import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum

from app.db.base import Base

class UserRole(str, enum.Enum):
    CITIZEN = "CITIZEN"
    AUTHORITY = "AUTHORITY"

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default=UserRole.CITIZEN.value)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    issues = relationship("Issue", back_populates="reporter", cascade="all, delete-orphan")
    supports = relationship("IssueSupport", back_populates="user", cascade="all, delete-orphan")
