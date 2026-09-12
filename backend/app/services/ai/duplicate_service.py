import math
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
import numpy as np

from app.core.config import settings
from app.models.issue import Issue, IssueStatus
from app.services.ai.faiss_service import faiss_service

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates distance in meters between two lat/lon points on Earth."""
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0)**2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return float(R * c)

class DuplicateDetectionService:
    """Combines FAISS visual similarity and spatial PostGIS/Haversine distance for duplicate detection."""

    @staticmethod
    def find_duplicates(
        db: Session,
        embedding: np.ndarray,
        category: str,
        lat: float,
        lon: float,
        exclude_issue_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        # 1. Search top 10 visually similar vectors in FAISS
        visual_matches = faiss_service.search_similar(embedding, top_k=10)
        if not visual_matches:
            return []

        # 2. Fetch candidates from Database
        candidate_ids = list(set([m["issue_id"] for m in visual_matches if m["issue_id"] != exclude_issue_id]))
        if not candidate_ids:
            return []

        candidates = db.query(Issue).filter(
            Issue.id.in_(candidate_ids),
            Issue.status.notin_([IssueStatus.RESOLVED.value, IssueStatus.REJECTED.value])
        ).all()

        candidate_map = {c.id: c for c in candidates}
        duplicate_results = []

        for match in visual_matches:
            issue_id = match["issue_id"]
            if issue_id not in candidate_map:
                continue

            issue = candidate_map[issue_id]
            visual_sim = match["similarity"]

            # 3. Calculate spatial distance
            distance_m = haversine_distance(lat, lon, issue.latitude, issue.longitude)

            # 4. Filter by radius threshold (e.g. 500 meters)
            if distance_m > settings.DUPLICATE_RADIUS_METERS:
                continue

            # 5. Category compatibility multiplier
            category_match = (issue.category == category or issue.ai_category == category)
            cat_multiplier = 1.0 if category_match else 0.75

            # 6. Combined Duplicate Score calculation
            distance_score = max(0.0, 1.0 - (distance_m / settings.DUPLICATE_RADIUS_METERS))
            duplicate_score = float((visual_sim * 0.6 + distance_score * 0.4) * cat_multiplier)
            duplicate_score = round(min(1.0, max(0.0, duplicate_score)), 4)

            # Apply threshold filter (e.g., duplicate_score >= 0.70)
            if duplicate_score >= 0.65:
                # Find image URL if available
                img_url = issue.images[0].storage_path if issue.images else None

                duplicate_results.append({
                    "issue_id": issue.id,
                    "title": issue.title or f"{issue.category.title()} report",
                    "category": issue.category,
                    "status": issue.status,
                    "priority_score": issue.priority_score,
                    "latitude": issue.latitude,
                    "longitude": issue.longitude,
                    "visual_similarity": round(visual_sim, 4),
                    "distance_meters": round(distance_m, 1),
                    "duplicate_score": duplicate_score,
                    "reason": f"Visually similar ({int(visual_sim*100)}%) and nearby ({int(distance_m)}m away)",
                    "image_url": img_url
                })

        duplicate_results.sort(key=lambda x: x["duplicate_score"], reverse=True)
        return duplicate_results

duplicate_service = DuplicateDetectionService()
