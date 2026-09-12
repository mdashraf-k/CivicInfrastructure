import os
from typing import List, Union
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "CivicFix Infrastructure Platform"
    SECRET_KEY: str = "civicfix-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    DATABASE_URL: str = "sqlite:///./civicfix.db"

    UPLOAD_DIR: str = "./uploads"
    FAISS_INDEX_PATH: str = "./vector_store/issues.index"
    FAISS_METADATA_PATH: str = "./vector_store/metadata.json"

    CLOUDINARY_CLOUD_NAME: str = "dwwjf0ewi"
    CLOUDINARY_API_KEY: str = "ZD6AFSsV22lhOhCWKswZioHUzcM"
    CLOUDINARY_API_SECRET: str = "ZD6AFSsV22lhOhCWKswZioHUzcM"

    CLIP_MODEL_NAME: str = "openai/clip-vit-base-patch32"
    HF_MODEL_NAME: str = "google/vit-base-patch16-224"
    YOLO_MODEL_PATH: str = "yolov8n.pt"

    MAX_UPLOAD_MB: int = 10
    DUPLICATE_SIMILARITY_THRESHOLD: float = 0.80
    DUPLICATE_RADIUS_METERS: float = 500.0

    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "*"]

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
