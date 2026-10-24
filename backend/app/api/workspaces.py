"""
Kivora Collaboration Workspace Router
Complete endpoints for:
- Workspace dashboard context and progress calculation (T03.1)
- Milestone management and timeline activity logging (T03.2)
- Secure deliverable uploads, checksums, and protected downloads (T03.3)
- Versioning and revision lifecycle (T03.4)
- Version comparison view (T03.5)
- Brand-specific and creator-wide history (T03.6)
- AI-assisted review analysis (T03.7)
- Post-completion reviews and ratings (T03.8)
"""

import os
import uuid
import hashlib
from datetime import datetime
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, status, Response
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.models import User, Engagement, EngagementDeliverable, EngagementMilestone
from backend.app.schemas.schemas import (
    CollaborationWorkspaceRead,
    MilestoneCreate,
    MilestoneUpdate,
    MilestoneRead,
    EngagementEventRead,
    DeliverableRead,
    DeliverableSubmissionCreate,
    RevisionRequestCreate,
    DeliverableVersionCompareResponse,
    DeliverableAiAnalysisRead,
    DeliverableAiAnalysisRequest,
    ReviewCreate,
    ReviewRead,
    ReviewSummaryRead,
    ProjectRead,
)
from backend.app.core.deps import get_current_verified_user, require_role, require_approved_creator_user
from backend.app.services.collaboration_service import CollaborationService
from backend.app.services.ai_review_service import AiReviewService

router = APIRouter(prefix="/api/workspaces", tags=["Collaboration Workspace"])

UPLOAD_ROOT = Path(os.getenv("KIVORA_UPLOAD_DIR", "uploads")) / "deliverables"
UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)


# ==========================================
# STATIC HISTORY & REVIEWS SUMMARY ROUTES
# (Defined before /{engagement_id} to prevent path parameter shadowing)
# ==========================================

@router.get("/history/brand", response_model=List[ProjectRead])
def get_brand_collaboration_history(
    status: Optional[str] = Query(None, description="Filter by status (COMPLETED, FINAL_APPROVED, etc.)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_role(["BRAND"])),
    db: Session = Depends(get_db),
):
    """Brand views only their own collaboration history."""
    return CollaborationService.get_brand_history(db, current_user, status_filter=status, skip=skip, limit=limit)


@router.get("/history/creator", response_model=List[ProjectRead])
def get_creator_collaboration_history(
    status: Optional[str] = Query(None, description="Filter by status (COMPLETED, FINAL_APPROVED, etc.)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_approved_creator_user),
    db: Session = Depends(get_db),
):
    """Creator views only their own collaboration history across brands."""
    return CollaborationService.get_creator_history(db, current_user, status_filter=status, skip=skip, limit=limit)


@router.get("/reviews/summary/{profile_id}", response_model=ReviewSummaryRead)
def get_profile_review_summary(
    profile_id: str,
    role: str = Query("CREATOR", pattern="^(CREATOR|BRAND)$"),
    db: Session = Depends(get_db),
):
    """Retrieves verified rating distribution and aggregate score."""
    return CollaborationService.get_review_summary(db, profile_id, target_role=role)


# ==========================================
# T03.1: WORKSPACE DASHBOARD CONTEXT
# ==========================================

@router.get("/{engagement_id}", response_model=CollaborationWorkspaceRead)
def get_collaboration_workspace(
    engagement_id: str,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db),
):
    """
    Authenticated brand or creator accesses their collaboration workspace.
    Unrelated users receive 403 / 404.
    """
    return CollaborationService.get_workspace_data(db, engagement_id, current_user)


# ==========================================
# T03.2: MILESTONES & TIMELINE EVENTS
# ==========================================

@router.get("/{engagement_id}/timeline", response_model=List[EngagementEventRead])
def get_engagement_timeline(
    engagement_id: str,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db),
):
    """Retrieves chronological activity timeline for the collaboration."""
    engagement = db.query(Engagement).filter(Engagement.id == engagement_id).first()
    if not engagement:
        raise HTTPException(status_code=404, detail="Engagement not found.")
    CollaborationService.verify_participant(engagement, current_user)
    return engagement.events or []


@router.post("/{engagement_id}/milestones", response_model=MilestoneRead, status_code=status.HTTP_201_CREATED)
def create_engagement_milestone(
    engagement_id: str,
    payload: MilestoneCreate,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db),
):
    """Creates a milestone in the collaboration."""
    return CollaborationService.create_milestone(db, engagement_id, payload, current_user)


@router.patch("/{engagement_id}/milestones/{milestone_id}", response_model=MilestoneRead)
def update_engagement_milestone(
    engagement_id: str,
    milestone_id: str,
    payload: MilestoneUpdate,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db),
):
    """Updates a milestone's status, due date, or title."""
    return CollaborationService.update_milestone(db, engagement_id, milestone_id, payload, current_user)


# ==========================================
# T03.3 & T03.4: SECURE DELIVERABLE UPLOADS & VERSIONING
# ==========================================

ALLOWED_DELIVERABLE_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".webp", ".gif",
    ".mp4", ".webm", ".mov",
    ".pdf", ".zip", ".json", ".txt", ".blend", ".usd", ".usdz",
}

MAX_DELIVERABLE_SIZE = 50 * 1024 * 1024  # 50 MB


@router.post("/{engagement_id}/upload-deliverable", response_model=DeliverableRead, status_code=status.HTTP_201_CREATED)
async def upload_secure_deliverable(
    engagement_id: str,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    submission_notes: Optional[str] = Form(None),
    milestone_id: Optional[str] = Form(None),
    current_user: User = Depends(require_role(["CREATOR", "ADMIN"])),
    db: Session = Depends(get_db),
):
    """
    Secure file upload with checksum calculation and automatic version incrementing.
    Stores physical file outside web root and tracks metadata in DB.
    """
    engagement = db.query(Engagement).filter(Engagement.id == engagement_id).first()
    if not engagement:
        raise HTTPException(status_code=404, detail="Engagement not found.")

    CollaborationService.verify_participant(engagement, current_user)

    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename.")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_DELIVERABLE_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type '{ext}'.")

    # Read content with size guard and compute SHA-256
    sha256 = hashlib.sha256()
    size = 0
    safe_filename = f"{uuid.uuid4().hex}_{Path(file.filename).name}"
    storage_path = UPLOAD_ROOT / safe_filename

    with open(storage_path, "wb") as buffer:
        while chunk := await file.read(64 * 1024):
            size += len(chunk)
            if size > MAX_DELIVERABLE_SIZE:
                storage_path.unlink(missing_ok=True)
                raise HTTPException(status_code=413, detail="File exceeds 50MB size limit.")
            sha256.update(chunk)
            buffer.write(chunk)

    payload = DeliverableSubmissionCreate(
        title=title or f"Master Deliverable Draft",
        notes=notes or submission_notes or "Uploaded asset package.",
        file_storage_key=str(storage_path),
        original_filename=file.filename,
        file_size_bytes=size,
        content_type=file.content_type or "application/octet-stream",
        sha256_checksum=sha256.hexdigest(),
        milestone_id=milestone_id if milestone_id and milestone_id.strip() else None,
        asset_url=f"/api/workspaces/{engagement_id}/deliverables/download-latest",
    )

    deliverable = CollaborationService.submit_deliverable_version(db, engagement_id, payload, current_user)
    # Update asset_url to point directly to this version's download
    deliverable.asset_url = f"/api/workspaces/{engagement_id}/deliverables/{deliverable.id}/download"
    db.commit()
    db.refresh(deliverable)
    return deliverable


@router.post("/{engagement_id}/deliverables", response_model=DeliverableRead, status_code=status.HTTP_201_CREATED)
def submit_deliverable_json(
    engagement_id: str,
    payload: DeliverableSubmissionCreate,
    current_user: User = Depends(require_role(["CREATOR", "ADMIN"])),
    db: Session = Depends(get_db),
):
    """JSON deliverable submission endpoint."""
    return CollaborationService.submit_deliverable_version(db, engagement_id, payload, current_user)


@router.get("/{engagement_id}/deliverables/{deliverable_id}/download")
def download_deliverable_file(
    engagement_id: str,
    deliverable_id: str,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db),
):
    """
    Protected deliverable download.
    Strictly verifies collaboration membership before serving the file.
    """
    engagement = db.query(Engagement).filter(Engagement.id == engagement_id).first()
    if not engagement:
        raise HTTPException(status_code=404, detail="Engagement not found.")

    CollaborationService.verify_participant(engagement, current_user)

    deliverable = (
        db.query(EngagementDeliverable)
        .filter(
            EngagementDeliverable.id == deliverable_id,
            EngagementDeliverable.engagement_id == engagement_id,
        )
        .first()
    )
    if not deliverable:
        raise HTTPException(status_code=404, detail="Deliverable not found.")

    if not deliverable.file_storage_key:
        # Fallback redirect if URL is external
        if deliverable.asset_url and deliverable.asset_url.startswith("http"):
            return Response(status_code=status.HTTP_302_FOUND, headers={"Location": deliverable.asset_url})
        raise HTTPException(status_code=404, detail="No stored binary file for this deliverable.")

    file_path = Path(deliverable.file_storage_key)
    if not file_path.exists():
        # Try relative to repo root
        file_path = Path.cwd() / deliverable.file_storage_key
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Stored file could not be located on disk.")

    return FileResponse(
        path=str(file_path),
        filename=deliverable.original_filename or f"deliverable_v{deliverable.version}{file_path.suffix}",
        media_type=deliverable.content_type or "application/octet-stream",
    )


# ==========================================
# REVISION, APPROVAL & COMPLETION
# ==========================================

@router.post("/{engagement_id}/revisions", response_model=DeliverableRead)
def request_revisions(
    engagement_id: str,
    payload: RevisionRequestCreate,
    current_user: User = Depends(require_role(["BRAND", "ADMIN"])),
    db: Session = Depends(get_db),
):
    """Brand requests changes on the latest deliverable."""
    return CollaborationService.request_revision(db, engagement_id, payload, current_user)


@router.post("/{engagement_id}/approve", response_model=DeliverableRead)
def approve_deliverable(
    engagement_id: str,
    current_user: User = Depends(require_role(["BRAND", "ADMIN"])),
    db: Session = Depends(get_db),
):
    """Brand approves the latest deliverable version."""
    return CollaborationService.approve_deliverable(db, engagement_id, current_user)


@router.post("/{engagement_id}/complete", response_model=ProjectRead)
def complete_collaboration(
    engagement_id: str,
    current_user: User = Depends(require_role(["BRAND", "ADMIN"])),
    db: Session = Depends(get_db),
):
    """Brand finalizes engagement after approval."""
    engagement = CollaborationService.complete_engagement(db, engagement_id, current_user)
    from backend.app.api.projects import format_project_read
    return format_project_read(engagement)


# ==========================================
# T03.5: VERSION COMPARISON
# ==========================================

@router.get("/{engagement_id}/compare", response_model=DeliverableVersionCompareResponse)
def compare_versions(
    engagement_id: str,
    v_a: int = Query(..., description="First version number to compare"),
    v_b: int = Query(..., description="Second version number to compare"),
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db),
):
    """Compares two deliverable versions within an authorized collaboration."""
    return CollaborationService.compare_deliverable_versions(db, engagement_id, v_a, v_b, current_user)




# ==========================================
# T03.7: AI-ASSISTED REVIEW ANALYSIS
# ==========================================

@router.post("/{engagement_id}/deliverables/{deliverable_id}/ai-review", response_model=DeliverableAiAnalysisRead)
def request_ai_review(
    engagement_id: str,
    deliverable_id: str,
    mock_score: Optional[float] = Query(None, description="Optional override score for testing"),
    current_user: User = Depends(require_role(["BRAND", "ADMIN"])),
    db: Session = Depends(get_db),
):
    """
    Brand reviewer requests an assistive AI quality analysis.
    Evaluates deliverable against Brief requirements.
    Never alters status or replaces human judgment.
    """
    engagement = db.query(Engagement).filter(Engagement.id == engagement_id).first()
    if not engagement:
        raise HTTPException(status_code=404, detail="Engagement not found.")
    CollaborationService.verify_participant(engagement, current_user)
    return AiReviewService.analyze_deliverable(db, engagement_id, deliverable_id, mock_score=mock_score)


@router.get("/{engagement_id}/deliverables/{deliverable_id}/ai-review", response_model=Optional[DeliverableAiAnalysisRead])
def get_ai_review(
    engagement_id: str,
    deliverable_id: str,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db),
):
    """Retrieves existing AI review analysis for a deliverable."""
    engagement = db.query(Engagement).filter(Engagement.id == engagement_id).first()
    if not engagement:
        raise HTTPException(status_code=404, detail="Engagement not found.")
    CollaborationService.verify_participant(engagement, current_user)

    from backend.app.models.models import DeliverableAiAnalysis
    analysis = (
        db.query(DeliverableAiAnalysis)
        .filter(DeliverableAiAnalysis.deliverable_id == deliverable_id)
        .order_by(DeliverableAiAnalysis.created_at.desc())
        .first()
    )
    return analysis


# ==========================================
# T03.8: REVIEWS & RATINGS
# ==========================================

@router.post("/{engagement_id}/reviews", response_model=ReviewRead, status_code=status.HTTP_201_CREATED)
def submit_collaboration_review(
    engagement_id: str,
    payload: ReviewCreate,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db),
):
    """
    Authenticated participant submits a review for a completed collaboration.
    Enforces status=COMPLETED, prevents duplicates and self-reviews.
    """
    review = CollaborationService.submit_review(db, engagement_id, payload, current_user)
    from backend.app.schemas.schemas import ReviewRead
    return ReviewRead.model_validate(review)


