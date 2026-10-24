"""
Kivora Engagement & Deliverable Collaboration Router
Handles project status, deliverable submissions, revisions, reviews, and delivery history.
"""

import uuid
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.models import (
    User,
    Engagement,
    EngagementDeliverable,
    CreatorProfile,
    BrandProfile,
    Brief,
    Application,
    Conversation,
)
from backend.app.schemas.schemas import (
    EngagementRead,
    EngagementDetailRead,
    DeliverableRead,
    DeliverableSubmissionCreate,
    RevisionRequestCreate,
    EngagementReviewCreate,
    EngagementStatusUpdate,
    CreatorInviteRequest,
    InvitationRead,
    InvitationActionRequest,
)
from backend.app.core.deps import require_role, get_current_verified_user, require_approved_creator_user
from backend.app.services.notification_service import NotificationService

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

    from backend.app.api.projects import calculate_project_progress
    progress, current_milestone, milestones = calculate_project_progress(e)

    sorted_delivs = sorted(deliv_reads, key=lambda d: d.version, reverse=True)
    latest_deliv = sorted_delivs[0] if sorted_delivs else None

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
        progress_percentage=progress,
        current_milestone=current_milestone,
        milestones=milestones,
        deliverables=deliv_reads,
        latest_deliverable=latest_deliv,
    )


def format_invitation_read(app: Application) -> InvitationRead:
    return InvitationRead(
        id=app.id,
        brief_id=app.brief_id,
        brief_title=app.brief.title if app.brief else "Campaign Brief",
        brief_slug=app.brief.slug if app.brief else None,
        brief_budget=float(app.brief.budget_amount) if (app.brief and app.brief.budget_amount) else 0.0,
        creator_id=app.creator_id,
        creator_name=app.creator.display_name if app.creator else "Creator",
        creator_handle=app.creator.handle if app.creator else None,
        creator_avatar=app.creator.avatar_url if app.creator else None,
        brand_id=app.brief.brand_id if app.brief else "",
        brand_name=app.brief.brand.company_name if (app.brief and app.brief.brand) else "Brand",
        brand_logo=app.brief.brand.logo_url if (app.brief and app.brief.brand) else None,
        status=app.status,
        pitch_text=app.pitch_text,
        proposed_rate=float(app.proposed_rate) if app.proposed_rate is not None else (float(app.brief.budget_amount) if app.brief else 0.0),
        created_at=app.submitted_at or datetime.utcnow(),
        updated_at=app.reviewed_at or app.submitted_at or datetime.utcnow(),
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
    brief_id: Optional[str] = Query(None, description="Filter by brief ID"),
    creator_id: Optional[str] = Query(None, description="Filter by creator ID"),
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
    if brief_id:
        query = query.filter(Engagement.brief_id == brief_id)
    if creator_id:
        query = query.filter(Engagement.creator_id == creator_id)

    engagements = query.order_by(Engagement.created_at.desc()).all()
    return [format_engagement_detail(e) for e in engagements]


# ==========================================
# PHASE 2: BRAND-TO-CREATOR INVITATION APIS
# ==========================================

@router.post("/invite", response_model=InvitationRead, status_code=status.HTTP_201_CREATED)
def invite_creator_to_brief(
    payload: CreatorInviteRequest,
    current_user: User = Depends(require_role(["BRAND"])),
    db: Session = Depends(get_db),
):
    """
    Brand invites a creator to an active campaign brief they own.
    Enforces ownership, validates creator existence, prevents duplicate invites,
    creates Application record with status='INVITED', and triggers notification.
    """
    brand = current_user.brand_profile
    if not brand:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Authenticated user has no brand profile.",
        )

    brief = db.query(Brief).filter(Brief.id == payload.brief_id).first()
    if not brief:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brief not found.",
        )

    if brief.brand_id != brand.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You can only invite creators to briefs owned by your brand.",
        )

    if brief.status not in ["ACTIVE", "PUBLISHED", "OPEN"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Brief is not open for invitations (status: {brief.status}).",
        )

    creator = db.query(CreatorProfile).filter(CreatorProfile.id == payload.creator_id).first()
    if not creator:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Creator profile not found.",
        )

    # Check existing application or invitation
    existing = (
        db.query(Application)
        .filter(Application.brief_id == brief.id, Application.creator_id == creator.id)
        .first()
    )
    if existing:
        if existing.status == "INVITED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A pending invitation already exists for this creator on this brief.",
            )
        elif existing.status == "ACCEPTED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Creator is already collaborating on this brief.",
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"An application already exists for this creator with status '{existing.status}'.",
            )

    invitation_id = f"inv-{uuid.uuid4().hex[:10]}"
    invitation = Application(
        id=invitation_id,
        brief_id=brief.id,
        creator_id=creator.id,
        pitch_text=payload.message or f"Invitation from {brand.company_name} to collaborate on {brief.title}",
        proposed_rate=payload.proposed_rate if payload.proposed_rate is not None else float(brief.budget_amount or 0.0),
        proposed_timeline_days=getattr(brief, "estimated_duration_days", 14) or 14,
        attached_project_ids="",
        status="INVITED",
        submitted_at=datetime.utcnow(),
    )
    db.add(invitation)
    db.commit()
    db.refresh(invitation)

    # Trigger notification & email to creator
    try:
        if creator.user_id:
            NotificationService.notify_creator_invited(
                db=db,
                creator_user_id=creator.user_id,
                brand_name=brand.company_name or "Brand",
                brief_title=brief.title,
                invitation_id=invitation.id,
            )
    except Exception as notify_err:
        print(f"[EngagementsAPI] Non-fatal notification error on invite: {notify_err}")

    return format_invitation_read(invitation)


@router.get("/my-invitations", response_model=List[InvitationRead])
def list_my_invitations(
    status: Optional[str] = Query(None, description="Optional status filter: INVITED, ACCEPTED, DECLINED"),
    current_user: User = Depends(require_role(["CREATOR"])),
    db: Session = Depends(get_db),
):
    """
    Authenticated creator retrieves all invitations sent to them.
    Optionally filters by status (e.g. INVITED, ACCEPTED, DECLINED).
    """
    creator = current_user.creator_profile
    if not creator:
        return []

    query = db.query(Application).filter(Application.creator_id == creator.id)
    if status and status.upper().strip():
        query = query.filter(Application.status == status.upper().strip())
    else:
        query = query.filter(Application.status.in_(["INVITED", "ACCEPTED", "DECLINED"]))

    invitations = query.order_by(Application.submitted_at.desc()).all()
    return [format_invitation_read(inv) for inv in invitations]


@router.get("/my-invitations/count")
def get_my_invitations_count(
    current_user: User = Depends(require_role(["CREATOR"])),
    db: Session = Depends(get_db),
):
    """
    Returns authoritative counts for direct invitations sent to the authenticated creator.
    Used for sidebar badge and header status synchronization.
    """
    creator = current_user.creator_profile
    if not creator:
        return {"total": 0, "pending": 0, "accepted": 0, "declined": 0}

    invitations = (
        db.query(Application.status)
        .filter(
            Application.creator_id == creator.id,
            Application.status.in_(["INVITED", "ACCEPTED", "DECLINED"]),
        )
        .all()
    )

    total = len(invitations)
    pending = sum(1 for (st,) in invitations if st == "INVITED")
    accepted = sum(1 for (st,) in invitations if st == "ACCEPTED")
    declined = sum(1 for (st,) in invitations if st == "DECLINED")

    return {
        "total": total,
        "pending": pending,
        "accepted": accepted,
        "declined": declined,
    }


@router.get("/brief-invitations/{brief_id}", response_model=List[InvitationRead])
def list_brief_invitations(
    brief_id: str,
    current_user: User = Depends(require_role(["BRAND"])),
    db: Session = Depends(get_db),
):
    """
    Owning brand retrieves all invitations issued for a specific brief.
    """
    brand = current_user.brand_profile
    if not brand:
        return []

    brief = db.query(Brief).filter(Brief.id == brief_id, Brief.brand_id == brand.id).first()
    if not brief:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brief not found or not owned by your brand.",
        )

    invitations = (
        db.query(Application)
        .filter(
            Application.brief_id == brief.id,
            Application.status.in_(["INVITED", "ACCEPTED", "DECLINED"]),
        )
        .order_by(Application.submitted_at.desc())
        .all()
    )
    return [format_invitation_read(inv) for inv in invitations]


@router.post("/invitations/{invitation_id}/accept", response_model=InvitationRead)
def accept_invitation(
    invitation_id: str,
    current_user: User = Depends(require_approved_creator_user),
    db: Session = Depends(get_db),
):
    """
    Creator accepts an invitation.
    Transitions status to ACCEPTED, provisions an active Engagement,
    establishes or links conversation, and notifies the brand.
    """
    creator = current_user.creator_profile
    if not creator:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Creator profile not found.",
        )

    invitation = db.query(Application).filter(Application.id == invitation_id).first()
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found.",
        )

    if invitation.creator_id != creator.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You cannot accept an invitation addressed to another creator.",
        )

    if invitation.status != "INVITED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot accept invitation: Current status is '{invitation.status}'.",
        )

    invitation.status = "ACCEPTED"
    invitation.reviewed_at = datetime.utcnow()

    # Automatically provision Engagement
    existing_eng = db.query(Engagement).filter(Engagement.application_id == invitation.id).first()
    eng_id = existing_eng.id if existing_eng else f"eng-{uuid.uuid4().hex[:10]}"
    if not existing_eng:
        eng = Engagement(
            id=eng_id,
            brief_id=invitation.brief_id,
            creator_id=invitation.creator_id,
            application_id=invitation.id,
            status="KICKOFF",
            agreed_amount=invitation.proposed_rate,
            start_date=datetime.utcnow(),
            completion_deadline=datetime.utcnow() + timedelta(days=invitation.proposed_timeline_days or 14),
        )
        db.add(eng)
        db.flush()

    # Ensure Conversation exists between brand and creator
    if invitation.brief and invitation.brief.brand_id:
        existing_conv = db.query(Conversation).filter(
            Conversation.engagement_id == eng_id
        ).first()
        if not existing_conv:
            existing_conv = db.query(Conversation).filter(
                Conversation.brand_id == invitation.brief.brand_id,
                Conversation.creator_id == invitation.creator_id,
                Conversation.brief_id == invitation.brief_id
            ).first()
            if existing_conv and not existing_conv.engagement_id:
                existing_conv.engagement_id = eng_id
        if not existing_conv:
            conv_id = f"conv-{uuid.uuid4().hex[:10]}"
            conv = Conversation(
                id=conv_id,
                engagement_id=eng_id,
                brief_id=invitation.brief_id,
                brand_id=invitation.brief.brand_id,
                creator_id=invitation.creator_id,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(conv)

    db.commit()
    db.refresh(invitation)

    # Notify brand
    try:
        if invitation.brief and invitation.brief.brand and invitation.brief.brand.user_id:
            NotificationService.notify_invitation_response(
                db=db,
                brand_user_id=invitation.brief.brand.user_id,
                creator_name=creator.display_name or "Creator",
                brief_title=invitation.brief.title,
                accepted=True,
                invitation_id=invitation.id,
            )
    except Exception as notify_err:
        print(f"[EngagementsAPI] Non-fatal notification error on accept: {notify_err}")

    return format_invitation_read(invitation)


@router.post("/invitations/{invitation_id}/decline", response_model=InvitationRead)
def decline_invitation(
    invitation_id: str,
    payload: Optional[InvitationActionRequest] = None,
    current_user: User = Depends(require_role(["CREATOR"])),
    db: Session = Depends(get_db),
):
    """
    Creator declines an invitation.
    Transitions status to DECLINED and notifies the brand.
    """
    creator = current_user.creator_profile
    if not creator:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Creator profile not found.",
        )

    invitation = db.query(Application).filter(Application.id == invitation_id).first()
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found.",
        )

    if invitation.creator_id != creator.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You cannot decline an invitation addressed to another creator.",
        )

    if invitation.status != "INVITED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot decline invitation: Current status is '{invitation.status}'.",
        )

    invitation.status = "DECLINED"
    invitation.reviewed_at = datetime.utcnow()
    if payload and payload.reason:
        invitation.brand_feedback = f"Declined by creator: {payload.reason}"

    db.commit()
    db.refresh(invitation)

    # Notify brand
    try:
        if invitation.brief and invitation.brief.brand and invitation.brief.brand.user_id:
            NotificationService.notify_invitation_response(
                db=db,
                brand_user_id=invitation.brief.brand.user_id,
                creator_name=creator.display_name or "Creator",
                brief_title=invitation.brief.title,
                accepted=False,
                invitation_id=invitation.id,
            )
    except Exception as notify_err:
        print(f"[EngagementsAPI] Non-fatal notification error on decline: {notify_err}")

    return format_invitation_read(invitation)


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
    current_user: User = Depends(require_approved_creator_user),
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

    # Phase 2: Notify the owning brand of deliverable submission
    try:
        if engagement.brief and engagement.brief.brand and engagement.brief.brand.user_id:
            NotificationService.notify_deliverable_submitted(
                db=db,
                brand_user_id=engagement.brief.brand.user_id,
                creator_name=creator.display_name or "Creator",
                milestone_title=deliv.title,
                engagement_id=engagement.id,
            )
    except Exception as notify_err:
        print(f"[EngagementsAPI] Non-fatal notification error: {notify_err}")

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

    # Phase 2: Notify creator of revision request
    try:
        if engagement.creator and engagement.creator.user_id:
            NotificationService.notify_deliverable_reviewed(
                db=db,
                creator_user_id=engagement.creator.user_id,
                brand_name=brand.company_name or "Brand",
                milestone_title=payload.feedback[:60] if payload.feedback else "Deliverable",
                status="REVISION_REQUESTED",
                engagement_id=engagement.id,
            )
    except Exception as notify_err:
        print(f"[EngagementsAPI] Non-fatal notification error: {notify_err}")

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

    # Phase 2: Notify creator of approval
    try:
        if engagement.creator and engagement.creator.user_id:
            NotificationService.notify_deliverable_reviewed(
                db=db,
                creator_user_id=engagement.creator.user_id,
                brand_name=brand.company_name or "Brand",
                milestone_title="Final Deliverable",
                status="FINAL_APPROVED",
                engagement_id=engagement.id,
            )
    except Exception as notify_err:
        print(f"[EngagementsAPI] Non-fatal notification error: {notify_err}")

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

