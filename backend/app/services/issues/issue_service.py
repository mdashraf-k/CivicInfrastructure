import os
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.issue import Issue, IssueStatus, IssueCategory
from app.models.issue_image import IssueImage, ImageType
from app.models.issue_history import IssueHistory
from app.models.issue_support import IssueSupport
from app.models.assignment import Assignment
from app.models.ai_analysis import AIAnalysis
from app.services.priority.priority_engine import priority_engine

VALID_TRANSITIONS = {
    IssueStatus.REPORTED.value: [IssueStatus.AI_ANALYZING.value, IssueStatus.PENDING_REVIEW.value, IssueStatus.REJECTED.value],
    IssueStatus.AI_ANALYZING.value: [IssueStatus.PENDING_REVIEW.value, IssueStatus.REPORTED.value],
    IssueStatus.PENDING_REVIEW.value: [IssueStatus.ASSIGNED.value, IssueStatus.DUPLICATE.value, IssueStatus.REJECTED.value],
    IssueStatus.ASSIGNED.value: [IssueStatus.IN_PROGRESS.value, IssueStatus.PENDING_REVIEW.value],
    IssueStatus.IN_PROGRESS.value: [IssueStatus.RESOLUTION_SUBMITTED.value, IssueStatus.ASSIGNED.value],
    IssueStatus.RESOLUTION_SUBMITTED.value: [IssueStatus.AI_VERIFYING.value, IssueStatus.RESOLVED.value, IssueStatus.REOPENED.value],
    IssueStatus.AI_VERIFYING.value: [IssueStatus.RESOLVED.value, IssueStatus.REOPENED.value],
    IssueStatus.REOPENED.value: [IssueStatus.ASSIGNED.value, IssueStatus.PENDING_REVIEW.value],
    IssueStatus.RESOLVED.value: [],
    IssueStatus.REJECTED.value: [],
    IssueStatus.DUPLICATE.value: [],
}

class IssueService:
    """Core service for managing issue creation, state transitions, support upvotes, and audit history."""

    @staticmethod
    def create_history(
        db: Session,
        issue_id: str,
        actor_id: Optional[str],
        old_status: Optional[str],
        new_status: str,
        note: Optional[str] = None
    ) -> IssueHistory:
        history = IssueHistory(
            issue_id=issue_id,
            actor_id=actor_id,
            old_status=old_status,
            new_status=new_status,
            note=note,
            created_at=datetime.now(timezone.utc)
        )
        db.add(history)
        db.commit()
        db.refresh(history)
        return history

    @classmethod
    def transition_status(
        cls,
        db: Session,
        issue: Issue,
        new_status: str,
        actor_id: str,
        note: Optional[str] = None
    ) -> Issue:
        current_status = issue.status
        allowed = VALID_TRANSITIONS.get(current_status, [])

        if new_status not in allowed and new_status != current_status:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "INVALID_STATUS_TRANSITION",
                    "message": f"Cannot transition issue from status '{current_status}' to '{new_status}'."
                }
            )

        issue.status = new_status
        if new_status == IssueStatus.RESOLVED.value:
            issue.resolved_at = datetime.now(timezone.utc)
        
        issue.updated_at = datetime.now(timezone.utc)
        db.commit()

        cls.create_history(
            db=db,
            issue_id=issue.id,
            actor_id=actor_id,
            old_status=current_status,
            new_status=new_status,
            note=note
        )

        db.refresh(issue)
        return issue

    @classmethod
    def add_support(cls, db: Session, issue_id: str, user_id: str) -> Dict[str, Any]:
        issue = db.query(Issue).filter(Issue.id == issue_id).first()
        if not issue:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "ISSUE_NOT_FOUND", "message": "Issue not found"}
            )

        existing = db.query(IssueSupport).filter(
            IssueSupport.issue_id == issue_id,
            IssueSupport.user_id == user_id
        ).first()

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "ALREADY_SUPPORTED", "message": "You have already supported this issue"}
            )

        support = IssueSupport(issue_id=issue_id, user_id=user_id)
        db.add(support)
        issue.support_count += 1

        # Recalculate priority with updated support count
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
        db.commit()

        return {
            "issue_id": issue.id,
            "support_count": issue.support_count,
            "priority_score": issue.priority_score,
            "priority_level": issue.priority_level,
            "user_has_supported": True
        }

issue_service = IssueService()
