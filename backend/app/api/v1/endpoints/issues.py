import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.models.issue import Issue, IssueStatus, IssueCategory
from app.models.issue_image import IssueImage, ImageType
from app.models.issue_support import IssueSupport
from app.models.ai_analysis import AIAnalysis
from app.models.issue_history import IssueHistory
from app.schemas.issue import (
    IssueResponse,
    IssueCreateResponse,
    IssueSupportResponse,
    IssueHistoryResponse,
    DuplicateCandidateResponse
)
from app.api.v1.endpoints.auth import get_current_user
from app.services.ai import (
    opencv_service,
    yolo_service,
    hf_service,
    clip_service,
    faiss_service,
    duplicate_service
)
from app.services.priority.priority_engine import priority_engine
from app.services.issues.issue_service import issue_service
from app.services.ai.duplicate_service import haversine_distance

router = APIRouter(prefix="/issues", tags=["Citizen Issues"])

from app.services.storage_service import storage_service

@router.post("", response_model=IssueCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_issue(
    image: UploadFile = File(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    category: Optional[str] = Form("other"),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Read and validate image bytes
    contents = await image.read()
    val_res = opencv_service.validate_image(contents, max_mb=settings.MAX_UPLOAD_MB)
    if not val_res["valid"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_IMAGE", "message": val_res["error"]}
        )

    # 2. Save image to Cloudinary (with local fallback) & extract EXIF GPS
    storage_res = storage_service.save_image(contents, image.filename or "photo.jpg", prefix="before")
    relative_storage_path = storage_res["storage_path"]

    # Use EXIF GPS if client coordinates are at 0,0 or missing
    exif_gps = storage_res.get("exif_gps")
    if (latitude == 0.0 and longitude == 0.0) and exif_gps:
        latitude, longitude = exif_gps

    # 3. Create Issue Record with AI_ANALYZING status
    issue_id = str(uuid.uuid4())
    issue = Issue(
        id=issue_id,
        reporter_id=current_user.id,
        category=category or "other",
        title=title or f"{(category or 'Civic').title()} Issue",
        description=description,
        status=IssueStatus.AI_ANALYZING.value,
        latitude=latitude,
        longitude=longitude,
        support_count=1
    )
    db.add(issue)
    db.commit()

    # 4. Background AI Processing Pipeline
    try:
        quality_res = opencv_service.calculate_image_quality(contents)
        yolo_res = yolo_service.detect_civic_problem(contents, user_category_hint=category)
        hf_res = hf_service.classify_with_huggingface(contents)
        embedding = clip_service.get_image_embedding(contents)

        # Image record creation
        img_id = str(uuid.uuid4())
        image_record = IssueImage(
            id=img_id,
            issue_id=issue.id,
            image_type=ImageType.BEFORE.value,
            storage_path=relative_storage_path,
            mime_type=image.content_type or "image/jpeg",
            width=val_res.get("width"),
            height=val_res.get("height")
        )
        db.add(image_record)

        # Add to FAISS Vector DB
        vec_id = faiss_service.add_embedding(embedding, issue_id=issue.id, image_id=img_id)
        image_record.clip_vector_id = str(vec_id)

        # Update Issue with AI insights
        issue.ai_category = yolo_res.get("category") or hf_res.get("label")
        issue.ai_confidence = float(yolo_res.get("confidence", 0.85))
        issue.ai_severity = float(yolo_res.get("severity", 25.0))

        # Duplicate search
        duplicate_candidates = duplicate_service.find_duplicates(
            db=db,
            embedding=embedding,
            category=issue.category,
            lat=latitude,
            lon=longitude,
            exclude_issue_id=issue.id
        )

        # Calculate Priority Score (0-100)
        p_res = priority_engine.calculate_priority(
            db=db,
            category=issue.category,
            ai_severity=issue.ai_severity,
            support_count=issue.support_count,
            latitude=latitude,
            longitude=longitude,
            created_at=issue.created_at
        )

        issue.priority_score = p_res["total_score"]
        issue.priority_level = p_res["level"]
        
        # Transition status AI_ANALYZING -> PENDING_REVIEW
        issue_service.transition_status(
            db=db,
            issue=issue,
            new_status=IssueStatus.PENDING_REVIEW.value,
            actor_id=current_user.id,
            note="AI analysis completed and queued for authority review."
        )

        # Save AI Analysis Audit Record
        ai_audit = AIAnalysis(
            issue_id=issue.id,
            pipeline_version="v1.0",
            detected_objects=yolo_res.get("detected_objects"),
            classification=hf_res,
            severity=issue.ai_severity,
            confidence=issue.ai_confidence,
            duplicate_candidates=duplicate_candidates
        )
        db.add(ai_audit)
        db.commit()
        db.refresh(issue)

        has_likely_duplicates = len(duplicate_candidates) > 0 and duplicate_candidates[0]["duplicate_score"] >= 0.75

        return IssueCreateResponse(
            issue=IssueResponse.model_validate(issue),
            duplicate_detected=has_likely_duplicates,
            likely_duplicates=[DuplicateCandidateResponse(**d) for d in duplicate_candidates]
        )

    except Exception as e:
        # AI Resilience fallback: Keep issue in PENDING_REVIEW if AI processing fails
        issue.status = IssueStatus.PENDING_REVIEW.value
        issue.priority_score = 30.0
        issue.priority_level = "Low"
        db.commit()
        issue_service.create_history(
            db=db,
            issue_id=issue.id,
            actor_id=current_user.id,
            old_status=IssueStatus.AI_ANALYZING.value,
            new_status=IssueStatus.PENDING_REVIEW.value,
            note=f"Created with basic fallback due to AI pipeline warning: {str(e)}"
        )
        db.refresh(issue)
        return IssueCreateResponse(
            issue=IssueResponse.model_validate(issue),
            duplicate_detected=False,
            likely_duplicates=[]
        )

@router.get("/mine", response_model=List[IssueResponse])
def get_my_issues(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    issues = db.query(Issue).filter(Issue.reporter_id == current_user.id).order_by(Issue.created_at.desc()).all()
    return issues

@router.get("/nearby", response_model=List[IssueResponse])
def get_nearby_issues(
    lat: float,
    lng: float,
    radius: float = 5000.0,  # meters
    category: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Issue).filter(Issue.status != IssueStatus.REJECTED.value)
    if category:
        query = query.filter(Issue.category == category)
    if status_filter:
        query = query.filter(Issue.status == status_filter)

    all_issues = query.all()
    nearby = []

    for issue in all_issues:
        dist = haversine_distance(lat, lng, issue.latitude, issue.longitude)
        if dist <= radius:
            nearby.append(issue)

    nearby.sort(key=lambda x: x.priority_score, reverse=True)
    return nearby

@router.get("/{issue_id}", response_model=IssueResponse)
def get_issue_details(issue_id: str, db: Session = Depends(get_db)):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ISSUE_NOT_FOUND", "message": "Issue not found"}
        )
    return issue

@router.post("/{issue_id}/support", response_model=IssueSupportResponse)
def support_issue(
    issue_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    res = issue_service.add_support(db=db, issue_id=issue_id, user_id=current_user.id)
    return IssueSupportResponse(
        issue_id=res["issue_id"],
        support_count=res["support_count"],
        user_has_supported=True
    )

@router.get("/{issue_id}/history", response_model=List[IssueHistoryResponse])
def get_issue_history(issue_id: str, db: Session = Depends(get_db)):
    try:
        history = db.query(IssueHistory).filter(
            IssueHistory.issue_id == issue_id
        ).order_by(IssueHistory.created_at.asc()).all()
        return history
    except Exception as e:
        # Return empty list rather than crashing — frontend handles missing history gracefully
        print(f"[history] Warning: could not fetch history for {issue_id}: {e}")
        return []
