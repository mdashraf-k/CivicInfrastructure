import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.db.base import Base

class IssueStatus(str, enum.Enum):
    REPORTED = "REPORTED"
    AI_ANALYZING = "AI_ANALYZING"
    PENDING_REVIEW = "PENDING_REVIEW"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLUTION_SUBMITTED = "RESOLUTION_SUBMITTED"
    AI_VERIFYING = "AI_VERIFYING"
    RESOLVED = "RESOLVED"
    REJECTED = "REJECTED"
    DUPLICATE = "DUPLICATE"
    REOPENED = "REOPENED"

class IssueCategory(str, enum.Enum):
    POTHOLE = "pothole"
    GARBAGE = "garbage/waste accumulation"
    STREETLIGHT = "broken streetlight"
    WATER_LEAK = "water leakage"
    DAMAGED_ROAD = "damaged footpath/road"
    FALLEN_TREE = "fallen tree"
    DAMAGED_INFRA = "damaged public infrastructure"
    OTHER = "other"

class Issue(Base):
    __tablename__ = "issues"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    reporter_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    category = Column(String(100), nullable=False, default=IssueCategory.OTHER.value)
    title = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    status = Column(String(50), nullable=False, default=IssueStatus.REPORTED.value, index=True)
    
    ai_category = Column(String(100), nullable=True)
    ai_confidence = Column(Float, nullable=True, default=0.0)
    ai_severity = Column(Float, nullable=True, default=0.0)
    
    priority_score = Column(Float, nullable=False, default=0.0, index=True)
    priority_level = Column(String(20), nullable=False, default="Low")  # Low, Medium, High, Critical
    support_count = Column(Integer, nullable=False, default=1)
    
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime, nullable=True)

    reporter = relationship("User", back_populates="issues")
    images = relationship("IssueImage", back_populates="issue", cascade="all, delete-orphan")
    assignments = relationship("Assignment", back_populates="issue", cascade="all, delete-orphan")
    history = relationship("IssueHistory", back_populates="issue", cascade="all, delete-orphan")
    supports = relationship("IssueSupport", back_populates="issue", cascade="all, delete-orphan")
    ai_analyses = relationship("AIAnalysis", back_populates="issue", cascade="all, delete-orphan")
