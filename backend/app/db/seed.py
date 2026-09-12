import os
import uuid
from datetime import datetime, timedelta, timezone
from PIL import Image, ImageDraw
import numpy as np

from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.models.user import User, UserRole
from app.models.issue import Issue, IssueStatus, IssueCategory
from app.models.issue_image import IssueImage, ImageType
from app.models.issue_history import IssueHistory
from app.models.important_place import ImportantPlace
from app.core.security import hash_password
from app.core.config import settings
from app.services.ai import clip_service, faiss_service
from app.services.priority.priority_engine import priority_engine

def create_dummy_image(filepath: str, label: str, bg_color: tuple):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    img = Image.new("RGB", (600, 400), color=bg_color)
    draw = ImageDraw.Draw(img)
    draw.rectangle([20, 20, 580, 380], outline=(255, 255, 255), width=4)
    draw.text((40, 180), f"CivicFix Demo Photo: {label}", fill=(255, 255, 255))
    img.save(filepath, "JPEG")

def seed_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    if db.query(User).first():
        print("Database already seeded.")
        db.close()
        return

    print("Seeding database with demo users, issues, images, and important places...")

    # 1. Authority Accounts
    admin_auth = User(
        name="Chief Municipal Officer",
        email="admin@civicfix.gov",
        password_hash=hash_password("admin123"),
        role=UserRole.AUTHORITY.value
    )
    dept_auth = User(
        name="Roads & Infra Inspector",
        email="authority@civicfix.gov",
        password_hash=hash_password("admin123"),
        role=UserRole.AUTHORITY.value
    )
    db.add_all([admin_auth, dept_auth])

    # 2. Citizen Accounts
    citizen1 = User(name="Alex Johnson", email="citizen@civicfix.com", password_hash=hash_password("citizen123"), role=UserRole.CITIZEN.value)
    citizen2 = User(name="Priya Sharma", email="priya@gmail.com", password_hash=hash_password("citizen123"), role=UserRole.CITIZEN.value)
    citizen3 = User(name="Marcus Vance", email="marcus@gmail.com", password_hash=hash_password("citizen123"), role=UserRole.CITIZEN.value)
    citizen4 = User(name="Sofia Chen", email="sofia@gmail.com", password_hash=hash_password("citizen123"), role=UserRole.CITIZEN.value)
    citizen5 = User(name="David Miller", email="david@gmail.com", password_hash=hash_password("citizen123"), role=UserRole.CITIZEN.value)
    citizens = [citizen1, citizen2, citizen3, citizen4, citizen5]
    db.add_all(citizens)
    db.commit()

    # 3. Seed Important Places
    places = [
        ImportantPlace(name="City Central High School", type="school", latitude=37.7749, longitude=-122.4194, importance_weight=1.5),
        ImportantPlace(name="General Hospital Emergency Ward", type="hospital", latitude=37.7780, longitude=-122.4150, importance_weight=1.8),
        ImportantPlace(name="Metropolitan Railway Station", type="transit", latitude=37.7720, longitude=-122.4220, importance_weight=1.4),
        ImportantPlace(name="Main Street Intersection", type="major_intersection", latitude=37.7755, longitude=-122.4180, importance_weight=1.3),
        ImportantPlace(name="State University Gate", type="university", latitude=37.7710, longitude=-122.4130, importance_weight=1.2),
    ]
    db.add_all(places)
    db.commit()

    # 4. Seed Issues
    demo_issues_data = [
        ("pothole", "Hazardous Pothole on Main St", "Deep crater on right lane near school crossing causing traffic slow down.", 37.7750, -122.4190, IssueStatus.PENDING_REVIEW.value, 40.0, 3, (120, 50, 50)),
        ("garbage/waste accumulation", "Overflowing Garbage Dumpster", "Trash spilling into sidewalk creating health hazard.", 37.7765, -122.4160, IssueStatus.ASSIGNED.value, 30.0, 5, (50, 100, 50)),
        ("broken streetlight", "Dark Streetlight Pole #42", "Light bulb burnt out for 3 days. Area dark at night.", 37.7730, -122.4210, IssueStatus.IN_PROGRESS.value, 20.0, 2, (100, 100, 50)),
        ("water leakage", "Burst Water Supply Pipeline", "Clean water pouring onto main road surface creating erosion.", 37.7782, -122.4148, IssueStatus.RESOLUTION_SUBMITTED.value, 35.0, 8, (50, 100, 150)),
        ("damaged footpath/road", "Cracked Sidewalk Slabs", "Tripping hazard for pedestrians outside public transit stop.", 37.7722, -122.4218, IssueStatus.RESOLVED.value, 15.0, 1, (80, 80, 80)),
        ("fallen tree", "Uprooted Tree Blocking Alley", "Storm blew large tree branch across narrow lane.", 37.7715, -122.4135, IssueStatus.PENDING_REVIEW.value, 38.0, 4, (40, 120, 60)),
        ("damaged public infrastructure", "Broken Park Bench & Railing", "Vandalized steel railing near playground.", 37.7758, -122.4175, IssueStatus.ASSIGNED.value, 18.0, 2, (90, 70, 50)),
        ("pothole", "Pothole Duplicate Report", "Another view of crater on Main St.", 37.7751, -122.4191, IssueStatus.DUPLICATE.value, 38.0, 1, (120, 55, 55)),
    ]

    for idx, (cat, title, desc, lat, lon, status_val, sev, supports, color) in enumerate(demo_issues_data):
        created = datetime.now(timezone.utc) - timedelta(days=idx * 2, hours=idx * 3)
        issue_id = str(uuid.uuid4())
        reporter = citizens[idx % len(citizens)]

        p_res = priority_engine.calculate_priority(
            db=db,
            category=cat,
            ai_severity=sev,
            support_count=supports,
            latitude=lat,
            longitude=lon,
            created_at=created
        )

        issue = Issue(
            id=issue_id,
            reporter_id=reporter.id,
            category=cat,
            title=title,
            description=desc,
            status=status_val,
            ai_category=cat,
            ai_confidence=0.88,
            ai_severity=sev,
            priority_score=p_res["total_score"],
            priority_level=p_res["level"],
            support_count=supports,
            latitude=lat,
            longitude=lon,
            created_at=created,
            resolved_at=datetime.now(timezone.utc) if status_val == IssueStatus.RESOLVED.value else None
        )
        db.add(issue)

        # Create dummy before photo
        before_filename = f"before_{issue_id[:8]}.jpg"
        before_abs = os.path.join(settings.UPLOAD_DIR, before_filename)
        create_dummy_image(before_abs, f"{title} (Before)", color)

        img_record = IssueImage(
            issue_id=issue.id,
            image_type=ImageType.BEFORE.value,
            storage_path=f"/uploads/{before_filename}",
            mime_type="image/jpeg",
            width=600,
            height=400
        )
        db.add(img_record)

        # Index in FAISS
        with open(before_abs, "rb") as f:
            b_bytes = f.read()
        emb = clip_service.get_image_embedding(b_bytes)
        vec_id = faiss_service.add_embedding(emb, issue_id=issue.id, image_id=img_record.id)
        img_record.clip_vector_id = str(vec_id)

        # If resolved or resolution submitted, create dummy after photo
        if status_val in [IssueStatus.RESOLUTION_SUBMITTED.value, IssueStatus.RESOLVED.value]:
            after_filename = f"after_{issue_id[:8]}.jpg"
            after_abs = os.path.join(settings.UPLOAD_DIR, after_filename)
            create_dummy_image(after_abs, f"{title} (Repaired After)", (50, 180, 80))

            after_img = IssueImage(
                issue_id=issue.id,
                image_type=ImageType.AFTER.value,
                storage_path=f"/uploads/{after_filename}",
                mime_type="image/jpeg",
                width=600,
                height=400
            )
            db.add(after_img)

        # History log
        history = IssueHistory(
            issue_id=issue.id,
            actor_id=reporter.id,
            old_status=IssueStatus.REPORTED.value,
            new_status=status_val,
            note=f"Issue initially created and processed to status {status_val}.",
            created_at=created
        )
        db.add(history)

    db.commit()
    db.close()
    print("Seeding complete! Demo credentials created:")
    print("Authority: admin@civicfix.gov / admin123")
    print("Citizen: citizen@civicfix.com / citizen123")

if __name__ == "__main__":
    seed_db()
