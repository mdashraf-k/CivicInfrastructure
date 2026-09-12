import math
from datetime import datetime, timezone
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from app.models.important_place import ImportantPlace

CATEGORY_SAFETY_WEIGHTS = {
    "pothole": 15.0,
    "fallen tree": 15.0,
    "water leakage": 12.0,
    "damaged footpath/road": 12.0,
    "damaged public infrastructure": 10.0,
    "broken streetlight": 10.0,
    "garbage/waste accumulation": 8.0,
    "other": 5.0,
}

class PriorityEngine:
    """Calculates deterministic 0-100 civic issue priority scores."""

    @staticmethod
    def calculate_location_importance(db: Session, lat: float, lon: float) -> float:
        """Finds nearest important place within 1km radius and returns 0-15 location score."""
        try:
            places = db.query(ImportantPlace).all()
            if not places:
                return 5.0  # default baseline

            min_dist = float('inf')
            max_weight = 1.0

            for place in places:
                # Approximate distance in meters
                d_lat = (place.latitude - lat) * 111000.0
                d_lon = (place.longitude - lon) * 111000.0 * math.cos(math.radians(lat))
                dist = math.sqrt(d_lat**2 + d_lon**2)
                if dist < min_dist:
                    min_dist = dist
                    max_weight = place.importance_weight

            if min_dist <= 100.0:
                loc_score = 15.0 * max_weight
            elif min_dist <= 500.0:
                loc_score = (15.0 - (min_dist - 100.0) / 400.0 * 7.0) * max_weight
            elif min_dist <= 1000.0:
                loc_score = (8.0 - (min_dist - 500.0) / 500.0 * 5.0) * max_weight
            else:
                loc_score = 3.0

            return round(min(15.0, max(0.0, loc_score)), 2)
        except Exception:
            return 5.0

    @classmethod
    def calculate_priority(
        cls,
        db: Session,
        category: str,
        ai_severity: float,
        support_count: int,
        latitude: float,
        longitude: float,
        created_at: datetime
    ) -> Dict[str, Any]:
        # 1. Severity component (0-40)
        # Severity input normalized 0-40
        sev_score = min(40.0, max(0.0, ai_severity))

        # 2. Support count component (0-20)
        # 1 report = 0 support pts; each additional supporter = 4 pts up to max 20 pts
        support_score = min(20.0, max(0.0, float((support_count - 1) * 4.0)))

        # 3. Location importance component (0-15)
        location_score = cls.calculate_location_importance(db, latitude, longitude)

        # 4. Safety impact component (0-15)
        category_clean = category.lower().strip()
        safety_score = CATEGORY_SAFETY_WEIGHTS.get(category_clean, 5.0)

        # 5. Time unresolved component (0-10)
        now = datetime.now(timezone.utc)
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        hours_old = max(0.0, (now - created_at).total_seconds() / 3600.0)
        time_score = min(10.0, round(hours_old / 24.0 * 2.5, 2))

        # Total 0-100 calculation
        total_score = round(min(100.0, max(0.0, sev_score + support_score + location_score + safety_score + time_score)), 1)

        # Level classification
        if total_score >= 85.0:
            level = "Critical"
        elif total_score >= 70.0:
            level = "High"
        elif total_score >= 40.0:
            level = "Medium"
        else:
            level = "Low"

        return {
            "total_score": total_score,
            "level": level,
            "breakdown": {
                "severity_score": round(sev_score, 1),
                "support_score": round(support_score, 1),
                "location_importance_score": round(location_score, 1),
                "safety_impact_score": round(safety_score, 1),
                "time_unresolved_score": round(time_score, 1)
            }
        }

priority_engine = PriorityEngine()
