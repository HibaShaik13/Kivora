"""
Kivora Engagement & Deliverable Collaboration Router
Handles project status, deliverable submissions, revisions, reviews, and delivery history.
"""

import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.models import (
    User,
    Engagement,
    EngagementDeliverable,
    CreatorProfile,
    BrandProfile,
    Brief,
)
from backend.app.schemas.schemas import (
    EngagementRead,
    EngagementDetailRead,
    DeliverableRead,
    DeliverableSubmissionCreate,
    RevisionRequestCreate,
    EngagementReviewCreate,
    EngagementStatusUpdate,
)
from backend.app.core.deps import require_role, get_current_verified_user

router = APIRouter(prefix="/api/engagements", tags=["Engagements"])


def format_deliverable_read(d: EngagementDeliverable) -> DeliverableRead:
    return DeliverableRead(
        id=d.id,
        engagement_id=d.engagement_id,
        version=d.version,
        title=d.title,
        asset_url=d.asset_url,
        notes=d.notes,
        submitted_by=d.submitted_by,
        status=d.status,
        feedback=d.feedback,
        submitted_at=d.submitted_at,
        reviewed_at=d.reviewed_at,
    )


def format_engagement_detail(e: Engagement) -> EngagementDetailRead:
    # Deliverables history
    deliv_reads = [format_deliverable_read(d) for d in e.deliverables]
    
    # If no explicit delivery rows exist yet but final_deliverable_url is set, synthesize v1
    if not deliv_reads and e.final_deliverable_url:
        synth_status = "APPROVED" if e.status in ["FINAL_APPROVED", "COMPLETED"] else "SUBMITTED"
        deliv_reads.append(
            DeliverableRead(
                id=f"deliv-initial-{e.id}",
                engagement_id=e.id,
                version=1,
                title="Initial Master Deliverable",
                asset_url=e.final_deliverable_url,
                notes="Delivered asset package",
                submitted_by=e.creator_id,
                status=synth_status,
                feedback=e.brand_review if e.brand_review else None,
                submitted_at=e.created_at,
                reviewed_at=e.updated_at if e.status in ["FINAL_APPROVED", "COMPLETED"] else None,
            )
        )

    return EngagementDetailRead(
        id=e.id,
        brief_id=e.brief_id,
        creator_id=e.creator_id,
        application_id=e.application_id,
        status=e.status,
        agreed_amount=e.agreed_amount,
        start_date=e.start_date,
        completion_deadline=e.completion_deadline,
        final_deliverable_url=e.final_deliverable_url,
        brand_rating=e.brand_rating,
        brand_review=e.brand_review,
        created_at=e.created_at,
        updated_at=e.updated_at,
        brief_title=e.brief.title if e.brief else None,
        brief_slug=e.brief.slug if e.brief else None,
        brand_company_name=e.brief.brand.company_name if (e.brief and e.brief.brand) else None,
        creator_display_name=e.creator.display_name if e.creator else None,
        creator_handle=e.creator.handle if e.creator else None,
        deliverables=deliv_reads,
    )


def verify_engagement_participant(e: Engagement, user: User):
    """Verify that user is either the assigned creator, the owning brand, or an admin."""
    if user.role == "ADMIN":
        return
    if user.role == "CREATOR":
        if not user.creator_profile or user.creator_profile.id != e.creator_id:
            raise HTTPException(
                status_code=403,
                detail="Forbidden: You are not the assigned creator for this engagement."
            )
    elif user.role == "BRAND":
        if not user.brand_profile or user.brand_profile.id != e.brief.brand_id:
            raise HTTPException(
                status_code=403,
                detail="Forbidden: You are not the brand that owns this campaign engagement."
            )
    else:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Unauthorized access to engagement."
        )


@router.get("", response_model=List[EngagementDetailRead])
def list_engagements(
    status: Optional[str] = Query(None, description="Filter by engagement status"),
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    """
    List engagements for the authenticated user.
    - Creators see only engagements they are hired for.
    - Brands see only engagements under their briefs.
    - Admins see all engagements.
    """
    query = db.query(Engagement)

    if current_user.role == "CREATOR":
        if not current_user.creator_profile:
            return []
        query = query.filter(Engagement.creator_id == current_user.creator_profile.id)
    elif current_user.role == "BRAND":
        if not current_user.brand_profile:
            return []
        query = query.join(Brief).filter(Brief.brand_id == current_user.brand_profile.id)
    elif current_user.role == "ADMIN":
        pass
    else:
        return []

    if status:
        query = query.filter(Engagement.status == status.upper())

    engagements = query.order_by(Engagement.created_at.desc()).all()
    return [format_engagement_detail(e) for e in engagements]


@router.get("/{engagement_id}", response_model=EngagementDetailRead)
def get_engagement_detail(
    engagement_id: str,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    """Get complete engagement details including deliverable history."""
    engagement = db.query(Engagement).filter(Engagement.id == engagement_id).first()
    if not engagement:
        raise HTTPException(status_code=404, detail="Engagement not found")

    verify_engagement_participant(engagement, current_user)
    return format_engagement_detail(engagement)


@router.post("/{engagement_id}/deliverables", response_model=EngagementDetailRead, status_code=201)
def submit_deliverable(
    engagement_id: str,
    payload: DeliverableSubmissionCreate,
    current_user: User = Depends(require_role(["CREATOR"])),
    db: Session = Depends(get_db)
):
    """
    Assigned creator submits a draft deliverable or revised version.
    Automatically increments version number, updates engagement state to DRAFT_SUBMITTED,
    and preserves delivery history.
    """
    engagement = db.query(Engagement).filter(Engagement.id == engagement_id).first()
    if not engagement:
        raise HTTPException(status_code=404, detail="Engagement not found")

    creator = current_user.creator_profile
    if not creator or engagement.creator_id != creator.id:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Only the assigned creator may submit deliverables for this engagement."
        )

    # State validation
    if engagement.status in ["COMPLETED", "FINAL_APPROVED"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot submit deliverables: Engagement is already '{engagement.status}'."
        )

    # Determine next version
    existing_versions = [d.version for d in engagement.deliverables]
    next_version = (max(existing_versions) + 1) if existing_versions else 1

    deliverable_id = f"deliv-{uuid.uuid4().hex[:10]}"
    deliv = EngagementDeliverable(
        id=deliverable_id,
        engagement_id=engagement.id,
        version=next_version,
        title=payload.title or f"Draft Deliverable v{next_version}",
        asset_url=payload.asset_url,
        notes=payload.notes,
        submitted_by=creator.id,
        status="SUBMITTED",
        submitted_at=datetime.utcnow()
    )
    db.add(deliv)

    engagement.status = "DRAFT_SUBMITTED"
    engagement.final_deliverable_url = payload.asset_url
    engagement.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(engagement)
    return format_engagement_detail(engagement)


@router.post("/{engagement_id}/revisions", response_model=EngagementDetailRead)
def request_revisions(
    engagement_id: str,
    payload: RevisionRequestCreate,
    current_user: User = Depends(require_role(["BRAND"])),
    db: Session = Depends(get_db)
):
    """
    Owning brand reviews the submitted draft and requests revisions.
    Attaches timestamped feedback to the latest deliverable and sets engagement to REVISION_REQUESTED.
    """
    engagement = db.query(Engagement).filter(Engagement.id == engagement_id).first()
    if not engagement:
        raise HTTPException(status_code=404, detail="Engagement not found")

    brand = current_user.brand_profile
    if not brand or engagement.brief.brand_id != brand.id:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Only the owning brand may request revisions for this engagement."
        )

    # State validation
    if engagement.status == "KICKOFF":
        raise HTTPException(
            status_code=400,
            detail="Cannot request revisions: No draft deliverable has been submitted yet."
        )
    if engagement.status in ["FINAL_APPROVED", "COMPLETED"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot request revisions: Engagement has already been '{engagement.status}'."
        )
    if engagement.status == "REVISION_REQUESTED":
        raise HTTPException(
            status_code=400,
            detail="Revisions already requested: Waiting for creator to resubmit revised draft."
        )

    # Update latest deliverable with feedback
    if engagement.deliverables:
        latest = sorted(engagement.deliverables, key=lambda d: d.version)[-1]
        latest.status = "REVISION_REQUESTED"
        latest.feedback = payload.feedback
        latest.reviewed_at = datetime.utcnow()

    engagement.status = "REVISION_REQUESTED"
    engagement.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(engagement)
    return format_engagement_detail(engagement)


@router.post("/{engagement_id}/approve", response_model=EngagementDetailRead)
def approve_deliverable(
    engagement_id: str,
    current_user: User = Depends(require_role(["BRAND"])),
    db: Session = Depends(get_db)
):
    """
    Owning brand gives final sign-off on the deliverable.
    Transitions engagement to FINAL_APPROVED.
    """
    engagement = db.query(Engagement).filter(Engagement.id == engagement_id).first()
    if not engagement:
        raise HTTPException(status_code=404, detail="Engagement not found")

    brand = current_user.brand_profile
    if not brand or engagement.brief.brand_id != brand.id:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Only the owning brand may approve deliverables for this engagement."
        )

    if engagement.status == "KICKOFF":
        raise HTTPException(
            status_code=400,
            detail="Cannot approve deliverable: No deliverable has been submitted yet."
        )

    if engagement.deliverables:
        latest = sorted(engagement.deliverables, key=lambda d: d.version)[-1]
        latest.status = "APPROVED"
        latest.reviewed_at = datetime.utcnow()

    engagement.status = "FINAL_APPROVED"
    engagement.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(engagement)
    return format_engagement_detail(engagement)


@router.post("/{engagement_id}/review", response_model=EngagementDetailRead)
def review_engagement(
    engagement_id: str,
    payload: EngagementReviewCreate,
    current_user: User = Depends(require_role(["BRAND"])),
    db: Session = Depends(get_db)
):
    """
    Owning brand submits performance rating and written review.
    Transitions engagement to COMPLETED and updates creator's profile statistics.
    """
    engagement = db.query(Engagement).filter(Engagement.id == engagement_id).first()
    if not engagement:
        raise HTTPException(status_code=404, detail="Engagement not found")

    brand = current_user.brand_profile
    if not brand or engagement.brief.brand_id != brand.id:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Only the owning brand may submit a review for this engagement."
        )

    if engagement.status not in ["FINAL_APPROVED", "COMPLETED"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot submit review: Engagement status must be 'FINAL_APPROVED' before reviewing (current status: '{engagement.status}')."
        )

    was_final_approved = (engagement.status == "FINAL_APPROVED")

    engagement.brand_rating = payload.rating
    engagement.brand_review = payload.review
    engagement.status = "COMPLETED"
    engagement.updated_at = datetime.utcnow()

    # Update creator stats if this is a newly completed project
    creator = engagement.creator
    if creator and was_final_approved:
        creator.completed_projects_count += 1
        
        # Recalculate average rating across all rated engagements
        all_rated = (
            db.query(Engagement)
            .filter(
                Engagement.creator_id == creator.id,
                Engagement.brand_rating.isnot(None)
            )
            .all()
        )
        ratings = [e.brand_rating for e in all_rated if e.brand_rating is not None]
        if ratings:
            creator.average_rating = round(sum(ratings) / len(ratings), 2)

    db.commit()
    db.refresh(engagement)
    return format_engagement_detail(engagement)


@router.patch("/{engagement_id}/status", response_model=EngagementDetailRead)
def update_engagement_status(
    engagement_id: str,
    payload: EngagementStatusUpdate,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    """
    Lifecycle status update with participant validation.
    """
    engagement = db.query(Engagement).filter(Engagement.id == engagement_id).first()
    if not engagement:
        raise HTTPException(status_code=404, detail="Engagement not found")

    verify_engagement_participant(engagement, current_user)

    target_status = payload.status.upper()
    valid_statuses = ["KICKOFF", "DRAFT_SUBMITTED", "REVISION_REQUESTED", "FINAL_APPROVED", "COMPLETED", "DISPUTED"]
    if target_status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{payload.status}'. Must be one of: {valid_statuses}"
        )

    # Participant role permissions for status transitions
    if current_user.role == "CREATOR":
        if target_status not in ["DRAFT_SUBMITTED", "DISPUTED"]:
            raise HTTPException(
                status_code=403,
                detail=f"Forbidden: Creators cannot manually transition engagement status to '{target_status}'."
            )
    elif current_user.role == "BRAND":
        if target_status not in ["REVISION_REQUESTED", "FINAL_APPROVED", "COMPLETED", "DISPUTED"]:
            raise HTTPException(
                status_code=403,
                detail=f"Forbidden: Brands cannot manually transition engagement status to '{target_status}'."
            )

    engagement.status = target_status
    engagement.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(engagement)
    return format_engagement_detail(engagement)
