from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Any
from datetime import datetime

class IssueImageResponse(BaseModel):
    id: str
    image_type: str
    storage_path: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class IssueHistoryResponse(BaseModel):
    id: str
    actor_id: Optional[str] = None
    old_status: Optional[str] = None
    new_status: str
    note: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class IssueSupportResponse(BaseModel):
    issue_id: str
    support_count: int
    user_has_supported: bool = True

class DuplicateCandidateResponse(BaseModel):
    issue_id: str
    title: Optional[str] = None
    category: str
    status: str
    priority_score: float
    latitude: float
    longitude: float
    visual_similarity: float
    distance_meters: float
    duplicate_score: float
    reason: str
    image_url: Optional[str] = None

class AIAnalysisSummary(BaseModel):
    ai_category: Optional[str] = None
    ai_confidence: Optional[float] = 0.0
    ai_severity: Optional[float] = 0.0
    detected_objects: Optional[Any] = None
    duplicate_candidates: Optional[List[DuplicateCandidateResponse]] = []
    resolution_score: Optional[float] = None
    resolution_recommendation: Optional[str] = None

class IssueResponse(BaseModel):
    id: str
    reporter_id: str
    category: str
    title: Optional[str] = None
    description: Optional[str] = None
    status: str
    ai_category: Optional[str] = None
    ai_confidence: Optional[float] = 0.0
    ai_severity: Optional[float] = 0.0
    priority_score: float
    priority_level: str
    support_count: int
    latitude: float
    longitude: float
    created_at: datetime
    updated_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    images: List[IssueImageResponse] = []
    history: List[IssueHistoryResponse] = []
    ai_analysis: Optional[AIAnalysisSummary] = None

    model_config = ConfigDict(from_attributes=True)


class IssueCreateResponse(BaseModel):
    issue: IssueResponse
    duplicate_detected: bool = False
    likely_duplicates: List[DuplicateCandidateResponse] = []
