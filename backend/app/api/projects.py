"""
Kivora Active Projects Router
Dedicated API for project tracking, milestone progress calculations,
deliverable versioning, feedback history, and role-based workspace management.
Reuses underlying Engagement and Deliverable relational models.
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
    Brief,
)
from backend.app.schemas.schemas import (
    ProjectRead,
    ProjectMilestone,
    DeliverableRead,
    DeliverableSubmissionCreate,
    RevisionRequestCreate,
    EngagementReviewCreate,
    EngagementStatusUpdate,
)
from backend.app.core.deps import require_role, get_current_verified_user

router = APIRouter(prefix="/api/projects", tags=["Active Projects"])


def calculate_project_progress(engagement: Engagement) -> tuple[int, str, List[ProjectMilestone]]:
    """
    Computes consistent project progress percentage, current milestone label,
    and a structured milestone progression array based on state and deliverables.
    """
    status = engagement.status.upper()
    deliverables = engagement.deliverables or []
    has_deliverables = len(deliverables) > 0
    latest_deliv = sorted(deliverables, key=lambda d: d.version)[-1] if has_deliverables else None

    # Milestone 1: Kickoff
    m1_done = status in ["DRAFT_SUBMITTED", "REVISION_REQUESTED", "FINAL_APPROVED", "COMPLETED"]
    m1_status = "COMPLETED" if m1_done else ("IN_PROGRESS" if status == "KICKOFF" else "PENDING")

    # Milestone 2: Draft Deliverable
    m2_done = status in ["FINAL_APPROVED", "COMPLETED"] or (has_deliverables and status != "KICKOFF")
    m2_status = "COMPLETED" if m2_done else ("IN_PROGRESS" if status == "KICKOFF" else "PENDING")

    # Milestone 3: Revisions & Review
    m3_done = status in ["FINAL_APPROVED", "COMPLETED"]
    m3_status = "COMPLETED" if m3_done else ("IN_PROGRESS" if status in ["DRAFT_SUBMITTED", "REVISION_REQUESTED"] else "PENDING")

    # Milestone 4: Final Approval & Handover
    m4_done = status == "COMPLETED"
    m4_status = "COMPLETED" if m4_done else ("IN_PROGRESS" if status == "FINAL_APPROVED" else "PENDING")

    milestones = [
        ProjectMilestone(
            id="m1",
            title="Project Kickoff & Creative Alignment",
            description="Campaign pitch accepted, milestones configured, and escrow funded.",
            status=m1_status,
            completed_at=engagement.start_date.isoformat() if m1_done else None,
        ),
        ProjectMilestone(
            id="m2",
            title="Draft Deliverable Production",
            description=f"Creator crafts master assets (currently v{latest_deliv.version if latest_deliv else 1}).",
            status=m2_status,
            completed_at=latest_deliv.submitted_at.isoformat() if (latest_deliv and m2_done) else None,
        ),
        ProjectMilestone(
            id="m3",
            title="Brand Review & Iteration Rounds",
            description="Brand review, timestamped feedback, and revision polish.",
            status=m3_status,
            completed_at=latest_deliv.reviewed_at.isoformat() if (latest_deliv and latest_deliv.reviewed_at and m3_done) else None,
        ),
        ProjectMilestone(
            id="m4",
            title="Final Sign-off, Buyout & Review",
            description="Deliverable approved, commercial buyout released, and performance rated.",
            status=m4_status,
            completed_at=engagement.updated_at.isoformat() if m4_done else None,
        ),
    ]

    if status == "KICKOFF":
        progress = 25
        current_milestone = "Awaiting Initial Draft"
    elif status == "DRAFT_SUBMITTED":
        progress = 60
        current_milestone = "Under Brand Review"
    elif status == "REVISION_REQUESTED":
        progress = 50
        current_milestone = "Revisions in Progress"
    elif status == "FINAL_APPROVED":
        progress = 90
        current_milestone = "Approved — Pending Final Rating"
    elif status == "COMPLETED":
        progress = 100
        current_milestone = "Completed & Verified"
    elif status == "DISPUTED":
        progress = 30
        current_milestone = "Under Mediation"
    else:
        progress = 15
        current_milestone = "Initiated"

    return progress, current_milestone, milestones


def format_project_read(e: Engagement) -> ProjectRead:
    """Transform an Engagement entity into a rich ProjectRead schema."""
    deliv_reads = []
    for d in (e.deliverables or []):
        deliv_reads.append(
            DeliverableRead(
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
        )

    # Synthesize fallback deliverable if final asset exists without child row
    if not deliv_reads and e.final_deliverable_url:
        synth_status = "APPROVED" if e.status in ["FINAL_APPROVED", "COMPLETED"] else "SUBMITTED"
        deliv_reads.append(
            DeliverableRead(
                id=f"deliv-initial-{e.id}",
                engagement_id=e.id,
                version=1,
                title="Initial Master Deliverable",
                asset_url=e.final_deliverable_url,
                notes="Delivered campaign asset",
                submitted_by=e.creator_id,
                status=synth_status,
                feedback=e.brand_review if e.brand_review else None,
                submitted_at=e.created_at,
                reviewed_at=e.updated_at if e.status in ["FINAL_APPROVED", "COMPLETED"] else None,
            )
        )

    # Sort deliverables by version descending for latest_deliverable
    sorted_delivs = sorted(deliv_reads, key=lambda d: d.version, reverse=True)
    latest_deliv = sorted_delivs[0] if sorted_delivs else None

    progress, current_milestone, milestones = calculate_project_progress(e)

    return ProjectRead(
        id=e.id,
        brief_id=e.brief_id,
        brief_title=e.brief.title if e.brief else "Campaign Project",
        brief_slug=e.brief.slug if e.brief else None,
        creator_id=e.creator_id,
        creator_display_name=e.creator.display_name if e.creator else None,
        creator_handle=e.creator.handle if e.creator else None,
        creator_avatar_url=e.creator.avatar_url if e.creator else None,
        brand_id=e.brief.brand_id if e.brief else None,
        brand_company_name=e.brief.brand.company_name if (e.brief and e.brief.brand) else None,
        brand_logo_url=e.brief.brand.logo_url if (e.brief and e.brief.brand) else None,
        application_id=e.application_id,
        status=e.status,
        progress_percentage=progress,
        current_milestone=current_milestone,
        milestones=milestones,
        agreed_amount=e.agreed_amount,
        start_date=e.start_date,
        completion_deadline=e.completion_deadline,
        final_deliverable_url=e.final_deliverable_url,
        brand_rating=e.brand_rating,
        brand_review=e.brand_review,
        created_at=e.created_at,
        updated_at=e.updated_at,
        deliverables=deliv_reads,
        latest_deliverable=latest_deliv,
    )


def verify_project_ownership(engagement: Engagement, user: User):
    """Enforces server-side project authorization."""
    if user.role == "ADMIN":
        return
    if user.role == "CREATOR":
        if not user.creator_profile or user.creator_profile.id != engagement.creator_id:
            raise HTTPException(
                status_code=403,
                detail="Forbidden: You are not the assigned creator for this project."
            )
    elif user.role == "BRAND":
        if not user.brand_profile or user.brand_profile.id != engagement.brief.brand_id:
            raise HTTPException(
                status_code=403,
                detail="Forbidden: You are not the brand owner of this project."
            )
    else:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Unauthorized access to project."
        )


# ==========================================
# 1. LIST ACTIVE PROJECTS
# ==========================================

@router.get("", response_model=List[ProjectRead])
def list_projects(
    status: Optional[str] = Query(None, description="Filter by status (e.g. KICKOFF, DRAFT_SUBMITTED, etc.)"),
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    """
    List active projects strictly scoped to the authenticated user:
    - Creators see only projects they are assigned to.
    - Brands see only projects for their own briefs.
    - Admins see all projects.
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

    projects = query.order_by(Engagement.created_at.desc()).all()
    return [format_project_read(p) for p in projects]


# ==========================================
# 2. GET PROJECT DETAIL
# ==========================================

@router.get("/{project_id}", response_model=ProjectRead)
def get_project_detail(
    project_id: str,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    """Get full project details, milestones, and deliverable version history."""
    project = db.query(Engagement).filter(Engagement.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    verify_project_ownership(project, current_user)
    return format_project_read(project)


# ==========================================
# 3. SUBMIT DELIVERABLE (CREATOR)
# ==========================================

@router.post("/{project_id}/deliverables", response_model=ProjectRead, status_code=201)
def submit_project_deliverable(
    project_id: str,
    payload: DeliverableSubmissionCreate,
    current_user: User = Depends(require_role(["CREATOR"])),
    db: Session = Depends(get_db)
):
    """Creator submits a draft deliverable or revised version."""
    project = db.query(Engagement).filter(Engagement.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    creator = current_user.creator_profile
    if not creator or project.creator_id != creator.id:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Only the assigned creator may submit deliverables for this project."
        )

    if project.status in ["COMPLETED", "FINAL_APPROVED"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot submit deliverables: Project status is '{project.status}'."
        )

    existing_versions = [d.version for d in project.deliverables]
    next_version = (max(existing_versions) + 1) if existing_versions else 1

    deliv_id = f"deliv-{uuid.uuid4().hex[:10]}"
    deliv = EngagementDeliverable(
        id=deliv_id,
        engagement_id=project.id,
        version=next_version,
        title=payload.title or f"Deliverable v{next_version}",
        asset_url=payload.asset_url,
        notes=payload.notes,
        submitted_by=creator.id,
        status="SUBMITTED",
        submitted_at=datetime.utcnow()
    )
    db.add(deliv)

    project.status = "DRAFT_SUBMITTED"
    project.final_deliverable_url = payload.asset_url
    project.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(project)
    return format_project_read(project)


# ==========================================
# 4. REQUEST REVISIONS (BRAND)
# ==========================================

@router.post("/{project_id}/revisions", response_model=ProjectRead)
def request_project_revisions(
    project_id: str,
    payload: RevisionRequestCreate,
    current_user: User = Depends(require_role(["BRAND"])),
    db: Session = Depends(get_db)
):
    """Brand requests revisions with feedback."""
    project = db.query(Engagement).filter(Engagement.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    brand = current_user.brand_profile
    if not brand or project.brief.brand_id != brand.id:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Only the brand owner may request revisions for this project."
        )

    if project.status == "KICKOFF":
        raise HTTPException(
            status_code=400,
            detail="Cannot request revisions: No draft deliverable has been submitted yet."
        )
    if project.status in ["FINAL_APPROVED", "COMPLETED"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot request revisions: Project is already '{project.status}'."
        )

    if project.deliverables:
        latest = sorted(project.deliverables, key=lambda d: d.version)[-1]
        latest.status = "REVISION_REQUESTED"
        latest.feedback = payload.feedback
        latest.reviewed_at = datetime.utcnow()

    project.status = "REVISION_REQUESTED"
    project.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(project)
    return format_project_read(project)


# ==========================================
# 5. APPROVE DELIVERABLE (BRAND)
# ==========================================

@router.post("/{project_id}/approve", response_model=ProjectRead)
def approve_project_deliverable(
    project_id: str,
    current_user: User = Depends(require_role(["BRAND"])),
    db: Session = Depends(get_db)
):
    """Brand gives final approval for master deliverable."""
    project = db.query(Engagement).filter(Engagement.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    brand = current_user.brand_profile
    if not brand or project.brief.brand_id != brand.id:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Only the brand owner may approve deliverables for this project."
        )

    if project.status == "KICKOFF":
        raise HTTPException(
            status_code=400,
            detail="Cannot approve deliverable: No deliverable has been submitted yet."
        )

    if project.deliverables:
        latest = sorted(project.deliverables, key=lambda d: d.version)[-1]
        latest.status = "APPROVED"
        latest.reviewed_at = datetime.utcnow()

    project.status = "FINAL_APPROVED"
    project.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(project)
    return format_project_read(project)


# ==========================================
# 6. REVIEW & COMPLETE PROJECT (BRAND)
# ==========================================

@router.post("/{project_id}/review", response_model=ProjectRead)
def review_and_complete_project(
    project_id: str,
    payload: EngagementReviewCreate,
    current_user: User = Depends(require_role(["BRAND"])),
    db: Session = Depends(get_db)
):
    """Brand submits rating and review, transitioning project to COMPLETED."""
    project = db.query(Engagement).filter(Engagement.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    brand = current_user.brand_profile
    if not brand or project.brief.brand_id != brand.id:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Only the brand owner may submit a review for this project."
        )

    if project.status not in ["FINAL_APPROVED", "COMPLETED"]:
        raise HTTPException(
            status_code=400,
            detail=f"Project must be in 'FINAL_APPROVED' status before review (current status: '{project.status}')."
        )

    was_final_approved = (project.status == "FINAL_APPROVED")

    project.brand_rating = payload.rating
    project.brand_review = payload.review
    project.status = "COMPLETED"
    project.updated_at = datetime.utcnow()

    creator = project.creator
    if creator and was_final_approved:
        creator.completed_projects_count += 1
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
    db.refresh(project)
    return format_project_read(project)


# ==========================================
# 7. UPDATE PROJECT LIFECYCLE STATUS
# ==========================================

@router.patch("/{project_id}/status", response_model=ProjectRead)
def update_project_status(
    project_id: str,
    payload: EngagementStatusUpdate,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    """Lifecycle status transition with participant role checks."""
    project = db.query(Engagement).filter(Engagement.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    verify_project_ownership(project, current_user)

    target_status = payload.status.upper()
    valid_statuses = ["KICKOFF", "DRAFT_SUBMITTED", "REVISION_REQUESTED", "FINAL_APPROVED", "COMPLETED", "DISPUTED"]
    if target_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status '{payload.status}'.")

    if current_user.role == "CREATOR":
        if target_status not in ["DRAFT_SUBMITTED", "DISPUTED"]:
            raise HTTPException(status_code=403, detail=f"Creators cannot transition project to '{target_status}'.")
    elif current_user.role == "BRAND":
        if target_status not in ["REVISION_REQUESTED", "FINAL_APPROVED", "COMPLETED", "DISPUTED"]:
            raise HTTPException(status_code=403, detail=f"Brands cannot transition project to '{target_status}'.")

    project.status = target_status
    project.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(project)
    return format_project_read(project)
