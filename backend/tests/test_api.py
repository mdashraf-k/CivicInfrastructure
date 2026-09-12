import io
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from PIL import Image

from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.services.priority.priority_engine import priority_engine

# Use static pool for in-memory SQLite so all connections share the same memory DB
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

client = TestClient(app)

def create_test_image_bytes():
    buf = io.BytesIO()
    img = Image.new("RGB", (200, 200), color=(100, 100, 100))
    img.save(buf, format="JPEG")
    return buf.getvalue()

def test_auth_flow():
    # Register Citizen
    resp = client.post("/api/v1/auth/register", json={
        "name": "Test Citizen",
        "email": "testcitizen@example.com",
        "password": "password123",
        "role": "CITIZEN"
    })
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    token = data["access_token"]

    # Get Me
    me_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "testcitizen@example.com"

def test_issue_creation_and_support():
    # Register citizen
    reg_resp = client.post("/api/v1/auth/register", json={
        "name": "Report Citizen",
        "email": "reporter@example.com",
        "password": "password123",
        "role": "CITIZEN"
    })
    token = reg_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create issue with image upload
    img_bytes = create_test_image_bytes()
    files = {"image": ("test.jpg", img_bytes, "image/jpeg")}
    form_data = {
        "latitude": "37.7749",
        "longitude": "-122.4194",
        "category": "pothole",
        "title": "Deep Pothole Test",
        "description": "Test pothole report description"
    }

    resp = client.post("/api/v1/issues", data=form_data, files=files, headers=headers)
    assert resp.status_code == 201
    issue_data = resp.json()["issue"]
    assert issue_data["category"] == "pothole"
    assert issue_data["priority_score"] > 0
    issue_id = issue_data["id"]

    # Support existing issue
    sup_resp = client.post(f"/api/v1/issues/{issue_id}/support", headers=headers)
    assert sup_resp.status_code == 200
    assert sup_resp.json()["support_count"] == 2

def test_priority_engine_formula():
    db = TestingSessionLocal()
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    res = priority_engine.calculate_priority(
        db=db,
        category="pothole",
        ai_severity=30.0,
        support_count=5,
        latitude=37.7749,
        longitude=-122.4194,
        created_at=now
    )
    # Severity 30 + Support (4 * 16) + Safety 15 + Location = High/Critical
    assert res["total_score"] >= 50.0
    assert res["level"] in ["Medium", "High", "Critical"]
    db.close()
