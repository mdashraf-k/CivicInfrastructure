from typing import Dict, Any
import numpy as np

from app.services.ai.opencv_service import opencv_service
from app.services.ai.clip_service import clip_service
from app.services.ai.yolo_service import yolo_service

class ResolutionVerificationService:
    """Evaluates before and after repair photos using OpenCV, CLIP embeddings, and YOLO detection."""

    @staticmethod
    def verify_resolution(before_bytes: bytes, after_bytes: bytes, category_hint: str) -> Dict[str, Any]:
        # 1. OpenCV quality validation
        quality_before = opencv_service.calculate_image_quality(before_bytes)
        quality_after = opencv_service.calculate_image_quality(after_bytes)

        # 2. Structural & visual difference calculation
        diff_score = opencv_service.compare_before_after(before_bytes, after_bytes)

        # 3. CLIP embedding visual comparison
        emb_before = clip_service.get_image_embedding(before_bytes)
        emb_after = clip_service.get_image_embedding(after_bytes)
        clip_sim = float(np.dot(emb_before, emb_after))
        clip_sim = float(np.clip((clip_sim + 1.0) / 2.0 if clip_sim <= 1.0 else clip_sim, 0.0, 1.0))

        # 4. YOLO detection on after image
        yolo_after = yolo_service.detect_civic_problem(after_bytes, user_category_hint=category_hint)
        # If confidence on problem in after image is low, it indicates problem cleared!
        clearance_score = 1.0 - float(yolo_after.get("confidence", 0.5)) if yolo_after.get("success") else 0.8

        # 5. Composite Resolution Confidence Score
        resolution_score = float(0.4 * diff_score + 0.3 * (1.0 - clip_sim) + 0.3 * clearance_score)
        resolution_score = round(min(1.0, max(0.0, resolution_score)), 4)

        # 6. Recommendation determination
        if resolution_score >= 0.70:
            recommendation = "LIKELY_RESOLVED"
            explanation = "AI detected substantial visual repair improvements and problem clearance."
        elif resolution_score >= 0.45:
            recommendation = "NEEDS_REVIEW"
            explanation = "Partial visual changes detected. Authority manual inspection advised."
        else:
            recommendation = "LIKELY_NOT_RESOLVED"
            explanation = "Minimal structural change detected between before and after repair images."

        return {
            "resolution_score": resolution_score,
            "recommendation": recommendation,
            "explanation": explanation,
            "quality_before": quality_before,
            "quality_after": quality_after,
            "diff_score": diff_score,
            "clip_similarity": round(clip_sim, 4),
            "clearance_score": round(clearance_score, 4)
        }

resolution_service = ResolutionVerificationService()
