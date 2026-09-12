import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.models.issue import Issue, IssueStatus
from app.models.issue_image import IssueImage, ImageType
from app.models.assignment import Assignment
from app.models.ai_analysis import AIAnalysis
from app.schemas.issue import IssueResponse
from app.schemas.admin import (
    StatusUpdateSchema,
    AssignIssueSchema,
    MergeIssueSchema,
    VerifyResolutionResponse
)
from app.api.v1.endpoints.auth import require_authority
from app.services.issues.issue_service import issue_service
from app.services.ai import opencv_service, resolution_service
from app.services.priority.priority_engine import priority_engine

router = APIRouter(prefix="/admin", tags=["Authority Admin"])

@router.get("/issues", response_model=List[IssueResponse])
def list_admin_issues(
    status_filter: Optional[str] = None,
    category_filter: Optional[str] = None,
    priority_level: Optional[str] = None,
    search: Optional[str] = None,
    authority: User = Depends(require_authority),
    db: Session = Depends(get_db)
):
    query = db.query(Issue)

    if status_filter:
        query = query.filter(Issue.status == status_filter)
    if category_filter:
        query = query.filter(Issue.category == category_filter)
    if priority_level:
        query = query.filter(Issue.priority_level == priority_level)
    if search:
        pattern = f"%{search}%"
        query = query.filter((Issue.title.ilike(pattern)) | (Issue.description.ilike(pattern)))

    issues = query.order_by(Issue.priority_score.desc(), Issue.created_at.desc()).all()
    return issues

@router.get("/issues/{issue_id}", response_model=IssueResponse)
def get_admin_issue(
    issue_id: str,
    authority: User = Depends(require_authority),
    db: Session = Depends(get_db)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ISSUE_NOT_FOUND", "message": "Issue not found"}
        )
    return issue

@router.patch("/issues/{issue_id}/status", response_model=IssueResponse)
def update_issue_status(
    issue_id: str,
    update_data: StatusUpdateSchema,
    authority: User = Depends(require_authority),
    db: Session = Depends(get_db)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ISSUE_NOT_FOUND", "message": "Issue not found"}
        )

    if update_data.override_category:
        issue.category = update_data.override_category
    if update_data.override_severity is not None:
        issue.ai_severity = update_data.override_severity

    if update_data.override_category or update_data.override_severity is not None:
        p_res = priority_engine.calculate_priority(
            db=db,
            category=issue.category,
            ai_severity=issue.ai_severity or 20.0,
            support_count=issue.support_count,
            latitude=issue.latitude,
            longitude=issue.longitude,
            created_at=issue.created_at
        )
        issue.priority_score = p_res["total_score"]
        issue.priority_level = p_res["level"]

    updated_issue = issue_service.transition_status(
        db=db,
        issue=issue,
        new_status=update_data.status,
        actor_id=authority.id,
        note=update_data.note
    )
    return updated_issue

@router.post("/issues/{issue_id}/assign", response_model=IssueResponse)
def assign_issue(
    issue_id: str,
    assign_data: AssignIssueSchema,
    authority: User = Depends(require_authority),
    db: Session = Depends(get_db)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ISSUE_NOT_FOUND", "message": "Issue not found"}
        )

    assignment = Assignment(
        issue_id=issue.id,
        department=assign_data.department,
        assignee_name=assign_data.assignee_name,
        assigned_by=authority.id
    )
    db.add(assignment)
    db.commit()

    updated_issue = issue_service.transition_status(
        db=db,
        issue=issue,
        new_status=IssueStatus.ASSIGNED.value,
        actor_id=authority.id,
        note=f"Assigned to {assign_data.department} ({assign_data.assignee_name}). {assign_data.note or ''}"
    )
    return updated_issue

@router.post("/issues/{issue_id}/merge", response_model=IssueResponse)
def merge_issue(
    issue_id: str,
    merge_data: MergeIssueSchema,
    authority: User = Depends(require_authority),
    db: Session = Depends(get_db)
):
    duplicate_issue = db.query(Issue).filter(Issue.id == issue_id).first()
    target_issue = db.query(Issue).filter(Issue.id == merge_data.target_issue_id).first()

    if not duplicate_issue or not target_issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ISSUE_NOT_FOUND", "message": "Target or duplicate issue not found"}
        )

    # Merge support count into target issue
    target_issue.support_count += duplicate_issue.support_count
    
    # Recalculate target issue priority
    p_res = priority_engine.calculate_priority(
        db=db,
        category=target_issue.category,
        ai_severity=target_issue.ai_severity or 20.0,
        support_count=target_issue.support_count,
        latitude=target_issue.latitude,
        longitude=target_issue.longitude,
        created_at=target_issue.created_at
    )
    target_issue.priority_score = p_res["total_score"]
    target_issue.priority_level = p_res["level"]

    # Set duplicate issue status to DUPLICATE
    issue_service.transition_status(
        db=db,
        issue=duplicate_issue,
        new_status=IssueStatus.DUPLICATE.value,
        actor_id=authority.id,
        note=f"Merged into primary issue {target_issue.id}. {merge_data.note or ''}"
    )

    db.commit()
    db.refresh(target_issue)
    return target_issue

from app.services.storage_service import storage_service

@router.post("/issues/{issue_id}/resolution-photo", response_model=IssueResponse)
async def upload_resolution_photo(
    issue_id: str,
    image: UploadFile = File(...),
    authority: User = Depends(require_authority),
    db: Session = Depends(get_db)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ISSUE_NOT_FOUND", "message": "Issue not found"}
        )

    contents = await image.read()
    val_res = opencv_service.validate_image(contents, max_mb=settings.MAX_UPLOAD_MB)
    if not val_res["valid"]:
        raise HTTPException(
            status_code=status.INVALID_IMAGE,
            detail={"code": "INVALID_IMAGE", "message": val_res["error"]}
        )

    storage_res = storage_service.save_image(contents, image.filename or "after_photo.jpg", prefix="after")
    relative_storage_path = storage_res["storage_path"]

    after_image = IssueImage(
        issue_id=issue.id,
        image_type=ImageType.AFTER.value,
        storage_path=relative_storage_path,
        mime_type=image.content_type or "image/jpeg",
        width=val_res.get("width"),
        height=val_res.get("height")
    )
    db.add(after_image)

    # Transition to RESOLUTION_SUBMITTED
    updated_issue = issue_service.transition_status(
        db=db,
        issue=issue,
        new_status=IssueStatus.RESOLUTION_SUBMITTED.value,
        actor_id=authority.id,
        note="After-repair photo uploaded for verification."
    )
    return updated_issue

@router.post("/issues/{issue_id}/verify-resolution", response_model=VerifyResolutionResponse)
def verify_issue_resolution(
    issue_id: str,
    authority: User = Depends(require_authority),
    db: Session = Depends(get_db)
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ISSUE_NOT_FOUND", "message": "Issue not found"}
        )

    before_img_record = next((img for img in issue.images if img.image_type == ImageType.BEFORE.value), None)
    after_img_record = next((img for img in issue.images if img.image_type == ImageType.AFTER.value), None)

    if not before_img_record or not after_img_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "MISSING_IMAGES", "message": "Both before and after photos are required for AI verification"}
        )

    # Read image files
    before_abs = os.path.join(settings.UPLOAD_DIR, os.path.basename(before_img_record.storage_path))
    after_abs = os.path.join(settings.UPLOAD_DIR, os.path.basename(after_img_record.storage_path))

    before_bytes = b""
    after_bytes = b""

    if os.path.exists(before_abs):
        with open(before_abs, "rb") as f:
            before_bytes = f.read()
    if os.path.exists(after_abs):
        with open(after_abs, "rb") as f:
            after_bytes = f.read()

    res = resolution_service.verify_resolution(
        before_bytes=before_bytes,
        after_bytes=after_bytes,
        category_hint=issue.category
    )

    # Save AI verification analysis
    ai_audit = AIAnalysis(
        issue_id=issue.id,
        pipeline_version="v1.0",
        resolution_score=res["resolution_score"],
        resolution_recommendation=res["recommendation"]
    )
    db.add(ai_audit)

    # Transition issue to AI_VERIFYING status
    issue_service.transition_status(
        db=db,
        issue=issue,
        new_status=IssueStatus.AI_VERIFYING.value,
        actor_id=authority.id,
        note=f"AI resolution verification complete. Score: {res['resolution_score']} ({res['recommendation']})."
    )

    return VerifyResolutionResponse(
        issue_id=issue.id,
        resolution_score=res["resolution_score"],
        recommendation=res["recommendation"],
        before_image_url=before_img_record.storage_path,
        after_image_url=after_img_record.storage_path,
        explanation=res["explanation"]
    )
