from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class StatusUpdateSchema(BaseModel):
    status: str = Field(..., description="Target issue status")
    note: Optional[str] = Field(None, description="Optional note for status transition")
    override_category: Optional[str] = Field(None, description="Optional category correction by authority")
    override_severity: Optional[float] = Field(None, description="Optional severity correction by authority")

class AssignIssueSchema(BaseModel):
    department: str = Field(..., min_length=2, max_length=100)
    assignee_name: str = Field(..., min_length=2, max_length=255)
    note: Optional[str] = None

class MergeIssueSchema(BaseModel):
    target_issue_id: str = Field(..., description="Primary issue ID to merge into")
    note: Optional[str] = None

class VerifyResolutionResponse(BaseModel):
    issue_id: str
    resolution_score: float
    recommendation: str  # LIKELY_RESOLVED, NEEDS_REVIEW, LIKELY_NOT_RESOLVED
    before_image_url: str
    after_image_url: str
    explanation: str
