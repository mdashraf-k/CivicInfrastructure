import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.db.base import Base

class ImageType(str, enum.Enum):
    BEFORE = "BEFORE"
    AFTER = "AFTER"

class IssueImage(Base):
    __tablename__ = "issue_images"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    issue_id = Column(String(36), ForeignKey("issues.id"), nullable=False)
    image_type = Column(String(20), nullable=False, default=ImageType.BEFORE.value)
    storage_path = Column(String(512), nullable=False)
    mime_type = Column(String(100), nullable=False, default="image/jpeg")
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    clip_vector_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    issue = relationship("Issue", back_populates="images")
