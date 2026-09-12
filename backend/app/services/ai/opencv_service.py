import os
from typing import Dict, Any, Tuple
from PIL import Image
import numpy as np

try:
    import cv2
    HAS_CV2 = True
except ImportError:
    HAS_CV2 = False

class OpenCVService:
    """Service for image validation, quality metrics, and before/after difference calculation."""

    @staticmethod
    def validate_image(image_bytes: bytes, max_mb: int = 10) -> Dict[str, Any]:
        if len(image_bytes) > max_mb * 1024 * 1024:
            return {"valid": False, "error": f"File size exceeds maximum limit of {max_mb}MB"}
        
        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            if HAS_CV2:
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                if img is None:
                    return {"valid": False, "error": "Unreadable or corrupted image file"}
                height, width = img.shape[:2]
            else:
                from io import BytesIO
                pil_img = Image.open(BytesIO(image_bytes))
                pil_img.verify()
                width, height = pil_img.size

            if width < 100 or height < 100:
                return {"valid": False, "error": f"Image dimensions too small ({width}x{height}). Minimum is 100x100."}

            return {
                "valid": True,
                "width": width,
                "height": height,
                "error": None
            }
        except Exception as e:
            return {"valid": False, "error": f"Invalid image format: {str(e)}"}

    @staticmethod
    def calculate_image_quality(image_bytes: bytes) -> Dict[str, Any]:
        warnings = []
        blur_score = 100.0
        brightness = 128.0

        try:
            if HAS_CV2:
                nparr = np.frombuffer(image_bytes, np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                if img is not None:
                    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                    blur_score = float(cv2.Laplacian(gray, cv2.CV_64F).var())
                    brightness = float(np.mean(gray))
            else:
                from io import BytesIO
                pil_img = Image.open(BytesIO(image_bytes)).convert('L')
                arr = np.array(pil_img)
                brightness = float(np.mean(arr))
                blur_score = 150.0  # fallback estimation

            if blur_score < 50.0:
                warnings.append("Image appears blurry. Higher clarity improves detection accuracy.")
            if brightness < 40.0:
                warnings.append("Image is dark. Lighting quality may affect AI classification.")
            elif brightness > 220.0:
                warnings.append("Image is overexposed.")

            return {
                "blur_score": round(blur_score, 2),
                "brightness": round(brightness, 2),
                "warnings": warnings,
                "is_acceptable": True
            }
        except Exception as e:
            return {
                "blur_score": 100.0,
                "brightness": 128.0,
                "warnings": ["Could not compute full quality metrics"],
                "is_acceptable": True
            }

    @staticmethod
    def compare_before_after(before_bytes: bytes, after_bytes: bytes) -> float:
        """Calculates a visual change/diff score between before and after repair images (0.0 to 1.0)."""
        try:
            from io import BytesIO
            img_b = Image.open(BytesIO(before_bytes)).convert("RGB").resize((256, 256))
            img_a = Image.open(BytesIO(after_bytes)).convert("RGB").resize((256, 256))
            
            arr_b = np.array(img_b, dtype=np.float32)
            arr_a = np.array(img_a, dtype=np.float32)

            # Normalized Mean Absolute Error
            mae = np.mean(np.abs(arr_b - arr_a)) / 255.0
            # Higher MAE = greater difference / repair change
            change_score = float(np.clip(mae * 2.5, 0.0, 1.0))
            return round(change_score, 4)
        except Exception:
            return 0.5

opencv_service = OpenCVService()
