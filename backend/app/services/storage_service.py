import os
import uuid
from typing import Tuple, Optional, Dict, Any
from io import BytesIO
from PIL import Image, ExifTags
import exifread

try:
    import cloudinary
    import cloudinary.uploader
    HAS_CLOUDINARY = True
except ImportError:
    HAS_CLOUDINARY = False

from app.core.config import settings

class StorageService:
    """Storage service supporting Cloudinary cloud storage and local storage with EXIF GPS extraction."""

    def __init__(self):
        self.cloud_name = getattr(settings, "CLOUDINARY_CLOUD_NAME", "dwwjf0ewi")
        self.api_key = getattr(settings, "CLOUDINARY_API_KEY", "ZD6AFSsV22lhOhCWKswZioHUzcM")
        self.api_secret = getattr(settings, "CLOUDINARY_API_SECRET", "ZD6AFSsV22lhOhCWKswZioHUzcM")

        if HAS_CLOUDINARY:
            try:
                cloudinary.config(
                    cloud_name=self.cloud_name,
                    api_key=self.api_key,
                    api_secret=self.api_secret,
                    secure=True
                )
            except Exception as e:
                print(f"Warning: Cloudinary init error: {e}")

    @staticmethod
    def extract_exif_gps(image_bytes: bytes) -> Optional[Tuple[float, float]]:
        """Extracts (latitude, longitude) from EXIF GPS metadata if present in photo."""
        try:
            tags = exifread.process_file(BytesIO(image_bytes))

            def _convert_to_degrees(value):
                d = float(value.values[0].num) / float(value.values[0].den)
                m = float(value.values[1].num) / float(value.values[1].den)
                s = float(value.values[2].num) / float(value.values[2].den)
                return d + (m / 60.0) + (s / 3600.0)

            lat_tag = tags.get('GPS GPSLatitude')
            lat_ref = tags.get('GPS GPSLatitudeRef')
            lon_tag = tags.get('GPS GPSLongitude')
            lon_ref = tags.get('GPS GPSLongitudeRef')

            if lat_tag and lat_ref and lon_tag and lon_ref:
                lat = _convert_to_degrees(lat_tag)
                if lat_ref.values[0] != 'N':
                    lat = -lat

                lon = _convert_to_degrees(lon_tag)
                if lon_ref.values[0] != 'E':
                    lon = -lon

                return (round(lat, 6), round(lon, 6))
        except Exception:
            pass
        return None

    def save_image(self, image_bytes: bytes, original_filename: str, prefix: str = "report") -> Dict[str, Any]:
        """Saves image to Cloudinary (if available) or local upload directory, returning the public image URL."""
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        ext = os.path.splitext(original_filename)[1] if original_filename else ".jpg"
        unique_name = f"{prefix}_{uuid.uuid4().hex}{ext}"

        # 1. Extract EXIF GPS coordinates if present
        exif_gps = self.extract_exif_gps(image_bytes)

        # 2. Try Cloudinary upload
        if HAS_CLOUDINARY:
            try:
                upload_result = cloudinary.uploader.upload(
                    image_bytes,
                    public_id=f"civicfix/{prefix}_{uuid.uuid4().hex}",
                    folder="civicfix_reports"
                )
                cloud_url = upload_result.get("secure_url") or upload_result.get("url")
                if cloud_url:
                    # Also save a local backup copy
                    local_path = os.path.join(settings.UPLOAD_DIR, unique_name)
                    with open(local_path, "wb") as f:
                        f.write(image_bytes)

                    return {
                        "storage_path": cloud_url,
                        "local_path": local_path,
                        "exif_gps": exif_gps,
                        "is_cloud": True
                    }
            except Exception as e:
                print(f"Cloudinary upload fallback to local storage: {e}")

        # 3. Local Storage Fallback
        local_path = os.path.join(settings.UPLOAD_DIR, unique_name)
        with open(local_path, "wb") as f:
            f.write(image_bytes)

        return {
            "storage_path": f"/uploads/{unique_name}",
            "local_path": local_path,
            "exif_gps": exif_gps,
            "is_cloud": False
        }

storage_service = StorageService()
