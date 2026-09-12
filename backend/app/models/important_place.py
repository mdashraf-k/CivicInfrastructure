import uuid
from sqlalchemy import Column, String, Float

from app.db.base import Base

class ImportantPlace(Base):
    __tablename__ = "important_places"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    type = Column(String(100), nullable=False)  # school, hospital, university, major_intersection, transit
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    importance_weight = Column(Float, nullable=False, default=1.0)  # multiplier (1.0 to 2.0)
