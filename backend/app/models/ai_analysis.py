import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.db.base import Base

class AIAnalysis(Base):
    __tablename__ = "ai_analyses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    issue_id = Column(String(36), ForeignKey("issues.id"), nullable=False)
    pipeline_version = Column(String(50), nullable=False, default="v1.0")
    detected_objects = Column(JSON, nullable=True)      # e.g., [{"label": "pothole", "confidence": 0.89, "bbox": [...]}]
    classification = Column(JSON, nullable=True)        # e.g., {"label": "damaged road", "confidence": 0.92}
    severity = Column(Float, nullable=True, default=0.0)
    confidence = Column(Float, nullable=True, default=0.0)
    duplicate_candidates = Column(JSON, nullable=True)  # List of candidate duplicate issue IDs + scores
    resolution_score = Column(Float, nullable=True)    # 0.0 to 1.0 score when evaluating after photo
    resolution_recommendation = Column(String(50), nullable=True)  # LIKELY_RESOLVED, NEEDS_REVIEW, LIKELY_NOT_RESOLVED
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    issue = relationship("Issue", back_populates="ai_analyses")
