"""
Kivora Media Upload & Asset Management Router
Provides secure file upload handling, type/size validation, sanitized storage paths,
and configurable storage locations for portfolio assets, process evidence, and avatars.
"""

import os
import re
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from backend.app.models.models import User
from backend.app.schemas.schemas import MediaUploadResponse
from backend.app.core.deps import get_current_verified_user

router = APIRouter(prefix="/api/media", tags=["Media"])

UPLOAD_ROOT = Path(os.getenv("KIVORA_UPLOAD_DIR", "uploads"))
MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB

ALLOWED_EXTENSIONS = {
    # Images
    ".jpg", ".jpeg", ".png", ".webp", ".gif",
    # Video
    ".mp4", ".webm", ".mov",
    # Verification evidence documents & workflow schematics
    ".pdf", ".json", ".txt"
}

ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "application/pdf",
    "application/json",
    "text/plain",
    "application/octet-stream"
}


@router.post("/upload", response_model=MediaUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_media_file(
    file: UploadFile = File(...),
    category: str = Form("general"),
    current_user: User = Depends(get_current_verified_user)
):
    """
    Securely uploads a media file with extension, MIME type, and size validation.
    Saves to configurable storage and returns a relative web-accessible URL.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing file name in upload request.")

    # 1. Validate Extension
    raw_ext = Path(file.filename).suffix.lower()
    if raw_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file extension '{raw_ext}'. Allowed formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    # 2. Validate MIME Type if present
    content_type = file.content_type or "application/octet-stream"
    if content_type.lower() not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported content type '{content_type}'. Must be a valid image, video, or evidence document."
        )

    # 3. Sanitize category & directory
    safe_category = re.sub(r"[^a-zA-Z0-9_\-]", "", category).lower() or "general"
    target_dir = UPLOAD_ROOT / safe_category
    target_dir.mkdir(parents=True, exist_ok=True)

    # 4. Sanitize file name & assign unique collision-free ID
    clean_stem = re.sub(r"[^a-zA-Z0-9_\-]", "_", Path(file.filename).stem)[:30]
    safe_filename = f"{clean_stem}_{uuid.uuid4().hex[:10]}{raw_ext}"
    target_file_path = target_dir / safe_filename

    # 5. Stream and enforce size limit
    total_bytes = 0
    try:
        with open(target_file_path, "wb") as dest:
            while chunk := await file.read(1024 * 64):  # 64 KB chunks
                total_bytes += len(chunk)
                if total_bytes > MAX_FILE_SIZE_BYTES:
                    # Clean up partial write
                    dest.close()
                    if target_file_path.exists():
                        target_file_path.unlink()
                    raise HTTPException(
                        status_code=400,
                        detail="File exceeds maximum allowed size threshold (25 MB limit)."
                    )
                dest.write(chunk)
    except HTTPException:
        raise
    except Exception as exc:
        if target_file_path.exists():
            target_file_path.unlink()
        raise HTTPException(status_code=500, detail=f"Failed to persist uploaded asset: {str(exc)}")

    # 6. Web-accessible relative URL
    relative_url = f"/uploads/{safe_category}/{safe_filename}"

    return MediaUploadResponse(
        url=relative_url,
        filename=safe_filename,
        content_type=content_type,
        size_bytes=total_bytes
    )
