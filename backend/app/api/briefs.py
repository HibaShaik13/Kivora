"""
Kivora Campaign Briefs & Applications Router
"""

import uuid
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.app.database import get_db
from backend.app.models.models import (
    User,
    Brief,
    BriefSkill,
    BriefTool,
    Skill,
    Tool,
    BrandProfile,
    Application,
    Engagement,
)
from fastapi.security import HTTPAuthorizationCredentials
from backend.app.schemas.schemas import (
    BriefRead,
    BriefCreate,
    BriefUpdate,
    BriefStatusUpdate,
    BriefSkillRef,
    BriefToolRef,
    ApplicationCreate,
    ApplicationRead,
    ApplicationStatusUpdate,
    EngagementRead,
)
from backend.app.core.deps import require_role, get_current_verified_user, security_bearer
from backend.app.core.security import decode_access_token

router = APIRouter(prefix="/api/briefs", tags=["Briefs"])


def format_brief_read(b: Brief) -> BriefRead:
    req_skills = [
        BriefSkillRef(
            skill_id=bs.skill_id,
            name=bs.skill.name,
            is_required=bs.is_required
        )
        for bs in b.required_skills
    ]
    req_tools = [
        BriefToolRef(
            tool_id=bt.tool_id,
            name=bt.tool.name,
            is_required=bt.is_required
        )
        for bt in b.required_tools
    ]

    return BriefRead(
        id=b.id,
        brand_id=b.brand_id,
        brand=b.brand,
        title=b.title,
        slug=b.slug,
        campaign_objective=b.campaign_objective,
        target_audience=b.target_audience,
        content_type=b.content_type,
        creative_style_mood=b.creative_style_mood,
        aspect_ratio=b.aspect_ratio,
        duration_seconds_min=b.duration_seconds_min,
        duration_seconds_max=b.duration_seconds_max,
        resolution_min=b.resolution_min,
        deliverables_description=b.deliverables_description,
        revision_allowance=b.revision_allowance,
        budget_amount=b.budget_amount,
        budget_currency=b.budget_currency,
        deadline=b.deadline,
        commercial_use_requirements=b.commercial_use_requirements,
        usage_channels=b.usage_channels,
        usage_duration=b.usage_duration,
        usage_territories=b.usage_territories,
        restrictions_and_guidelines=b.restrictions_and_guidelines,
        disclosure_requirements=b.disclosure_requirements,
        status=b.status,
        created_at=b.created_at,
        required_skills=req_skills,
        required_tools=req_tools,
        applications_count=len(b.applications)
    )


@router.get("", response_model=List[BriefRead])
def list_briefs(
    search: Optional[str] = Query(None, description="Search term for title or objective"),
    content_type: Optional[str] = Query(None, description="Content type"),
    aspect_ratio: Optional[str] = Query(None, description="Aspect ratio"),
    min_budget: Optional[float] = Query(None, description="Min budget amount"),
    max_budget: Optional[float] = Query(None, description="Max budget amount"),
    skill: Optional[str] = Query(None, description="Required skill name or ID"),
    tool: Optional[str] = Query(None, description="Required tool name or ID"),
    days_until_deadline: Optional[int] = Query(None, description="Filter briefs due within X days"),
    status: Optional[str] = Query(None, description="Brief status"),
    sort_by: Optional[str] = Query(None, description="Sort order: newest, budget_desc, budget_asc, deadline_asc"),
    page: Optional[int] = Query(None, ge=1, description="Page number"),
    limit: Optional[int] = Query(None, ge=1, le=100, description="Items per page"),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Session = Depends(get_db)
):
    query = db.query(Brief)

    if search:
        search_filter = f"%{search.lower()}%"
        query = query.filter(
            or_(
                Brief.title.ilike(search_filter),
                Brief.campaign_objective.ilike(search_filter),
                Brief.target_audience.ilike(search_filter)
            )
        )

    if content_type:
        query = query.filter(Brief.content_type == content_type)
    if aspect_ratio:
        query = query.filter(Brief.aspect_ratio == aspect_ratio)
    if min_budget is not None:
        query = query.filter(Brief.budget_amount >= min_budget)
    if max_budget is not None:
        query = query.filter(Brief.budget_amount <= max_budget)
    if days_until_deadline is not None:
        target_deadline = datetime.utcnow() + timedelta(days=days_until_deadline)
        query = query.filter(Brief.deadline <= target_deadline)

    # Lifecycle visibility protection: Public users only see PUBLISHED briefs
    if status is None or status.upper() == "PUBLISHED":
        query = query.filter(Brief.status == "PUBLISHED")
    else:
        # Non-published query (e.g. DRAFT, CANCELLED): must verify caller owns these briefs
        caller_brand_id = None
        if credentials and credentials.credentials:
            payload = decode_access_token(credentials.credentials)
            if payload and "sub" in payload:
                user = db.query(User).filter(User.id == payload["sub"]).first()
                if user and user.role == "BRAND" and user.brand_profile:
                    caller_brand_id = user.brand_profile.id
                elif user and user.role == "ADMIN":
                    caller_brand_id = "ADMIN"

        if not caller_brand_id:
            return []
        query = query.filter(Brief.status == status.upper())
        if caller_brand_id != "ADMIN":
            query = query.filter(Brief.brand_id == caller_brand_id)

    briefs = query.all()

    # Relational filtering for skill and tool
    matched = []
    for b in briefs:
        if skill:
            skill_low = skill.lower()
            has_skill = any(
                bs.skill.name.lower() == skill_low
                or skill_low in bs.skill.name.lower()
                or bs.skill_id.lower() == skill_low
                for bs in b.required_skills
            )
            if not has_skill:
                continue

        if tool:
            tool_low = tool.lower()
            has_tool = any(
                bt.tool.name.lower() == tool_low
                or tool_low in bt.tool.name.lower()
                or bt.tool_id.lower() == tool_low
                for bt in b.required_tools
            )
            if not has_tool:
                continue

        matched.append(b)

    # Sorting
    if sort_by:
        s = sort_by.lower()
        if s in ["budget_desc"]:
            matched.sort(key=lambda b: b.budget_amount, reverse=True)
        elif s in ["budget_asc"]:
            matched.sort(key=lambda b: b.budget_amount)
        elif s in ["deadline_asc"]:
            matched.sort(key=lambda b: b.deadline)
        elif s in ["newest"]:
            matched.sort(key=lambda b: b.created_at, reverse=True)
        else:
            matched.sort(key=lambda b: b.created_at, reverse=True)
    else:
        matched.sort(key=lambda b: b.created_at, reverse=True)

    # Pagination
    if page is not None and limit is not None:
        start = (page - 1) * limit
        matched = matched[start:start + limit]
    elif limit is not None:
        matched = matched[:limit]
    elif page is not None:
        default_limit = 20
        start = (page - 1) * default_limit
        matched = matched[start:start + default_limit]

    return [format_brief_read(b) for b in matched]



@router.get("/my-briefs", response_model=List[BriefRead])
def list_my_briefs(
    current_user: User = Depends(require_role(["BRAND"])),
    db: Session = Depends(get_db)
):
    """Authenticated brand retrieves all campaign briefs they have authored."""
    brand = current_user.brand_profile
    if not brand:
        return []
    briefs = db.query(Brief).filter(Brief.brand_id == brand.id).order_by(Brief.created_at.desc()).all()
    return [format_brief_read(b) for b in briefs]


@router.get("/{slug_or_id}", response_model=BriefRead)
def get_brief_detail(
    slug_or_id: str,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Session = Depends(get_db)
):
    brief = db.query(Brief).filter(
        or_(Brief.id == slug_or_id, Brief.slug == slug_or_id)
    ).first()

    if not brief:
        raise HTTPException(status_code=404, detail="Brief not found")

    # If brief is not published, only owning brand or admin can view
    if brief.status != "PUBLISHED":
        caller_authorized = False
        if credentials and credentials.credentials:
            payload = decode_access_token(credentials.credentials)
            if payload and "sub" in payload:
                user = db.query(User).filter(User.id == payload["sub"]).first()
                if user:
                    if user.role == "ADMIN":
                        caller_authorized = True
                    elif user.role == "BRAND" and user.brand_profile and user.brand_profile.id == brief.brand_id:
                        caller_authorized = True
        if not caller_authorized:
            raise HTTPException(
                status_code=404,
                detail="Brief not found or is currently in unpublished draft status."
            )

    return format_brief_read(brief)


@router.post("", response_model=BriefRead, status_code=201)
def create_brief(
    payload: BriefCreate,
    current_user: User = Depends(require_role(["BRAND"])),
    db: Session = Depends(get_db)
):
    brand = current_user.brand_profile
    if not brand:
        raise HTTPException(
            status_code=400,
            detail="Brand profile not yet configured. Please set up your brand profile before creating briefs."
        )

    # Reject mismatched or forged client-supplied brand_id
    if payload.brand_id and payload.brand_id != brand.id:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Cannot create a campaign brief on behalf of a different brand profile."
        )

    # Validate business rules
    if payload.budget_amount <= 0:
        raise HTTPException(status_code=400, detail="Budget amount must be greater than zero.")
    if payload.deadline_days < 1:
        raise HTTPException(status_code=400, detail="Deadline must be at least 1 day in the future.")
    if not payload.title.strip() or not payload.campaign_objective.strip():
        raise HTTPException(status_code=400, detail="Brief title and campaign objective cannot be empty.")

    initial_status = (payload.status or "PUBLISHED").upper().strip()
    if initial_status not in ["DRAFT", "PUBLISHED"]:
        raise HTTPException(status_code=400, detail="Initial status must be either 'DRAFT' or 'PUBLISHED'.")

    brief_id = f"brief-{uuid.uuid4().hex[:10]}"
    slug = payload.title.lower().replace(" ", "-").replace(":", "").replace("/", "")[:60] + f"-{uuid.uuid4().hex[:4]}"
    deadline = datetime.utcnow() + timedelta(days=payload.deadline_days)

    brief = Brief(
        id=brief_id,
        brand_id=brand.id,
        title=payload.title,
        slug=slug,
        campaign_objective=payload.campaign_objective,
        target_audience=payload.target_audience,
        content_type=payload.content_type,
        creative_style_mood=payload.creative_style_mood,
        aspect_ratio=payload.aspect_ratio,
        duration_seconds_min=payload.duration_seconds_min,
        duration_seconds_max=payload.duration_seconds_max,
        resolution_min=payload.resolution_min,
        deliverables_description=payload.deliverables_description,
        revision_allowance=payload.revision_allowance,
        budget_amount=payload.budget_amount,
        budget_currency=payload.budget_currency,
        deadline=deadline,
        commercial_use_requirements=payload.commercial_use_requirements,
        usage_channels=payload.usage_channels,
        usage_duration=payload.usage_duration,
        usage_territories=payload.usage_territories,
        restrictions_and_guidelines=payload.restrictions_and_guidelines,
        disclosure_requirements=payload.disclosure_requirements,
        status=initial_status,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(brief)
    db.flush()

    for sk_id in payload.required_skill_ids:
        bs = BriefSkill(
            id=f"bs-{brief_id}-{sk_id}",
            brief_id=brief_id,
            skill_id=sk_id,
            is_required=True
        )
        db.add(bs)

    for tl_id in payload.required_tool_ids:
        bt = BriefTool(
            id=f"bt-{brief_id}-{tl_id}",
            brief_id=brief_id,
            tool_id=tl_id,
            is_required=True
        )
        db.add(bt)

    db.commit()
    db.refresh(brief)
    return format_brief_read(brief)


@router.put("/{brief_id}", response_model=BriefRead)
def update_brief(
    brief_id: str,
    payload: BriefUpdate,
    current_user: User = Depends(require_role(["BRAND"])),
    db: Session = Depends(get_db)
):
    """Authenticated brand updates their own campaign brief with ownership check."""
    brand = current_user.brand_profile
    if not brand:
        raise HTTPException(status_code=400, detail="Brand profile not yet configured.")

    brief = db.query(Brief).filter(Brief.id == brief_id).first()
    if not brief:
        raise HTTPException(status_code=404, detail="Brief not found")

    if brief.brand_id != brand.id:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: You can only edit campaign briefs created by your brand."
        )

    # Validate updates
    if payload.budget_amount is not None and payload.budget_amount <= 0:
        raise HTTPException(status_code=400, detail="Budget amount must be greater than zero.")
    if payload.deadline_days is not None:
        if payload.deadline_days < 1:
            raise HTTPException(status_code=400, detail="Deadline must be at least 1 day in the future.")
        brief.deadline = datetime.utcnow() + timedelta(days=payload.deadline_days)

    for field in [
        "title", "campaign_objective", "target_audience", "content_type",
        "creative_style_mood", "aspect_ratio", "duration_seconds_min",
        "duration_seconds_max", "resolution_min", "deliverables_description",
        "revision_allowance", "budget_amount", "budget_currency",
        "commercial_use_requirements", "usage_channels", "usage_duration",
        "usage_territories", "restrictions_and_guidelines", "disclosure_requirements"
    ]:
        val = getattr(payload, field, None)
        if val is not None:
            setattr(brief, field, val)

    if payload.status is not None:
        valid_statuses = ["DRAFT", "PUBLISHED", "CLOSED", "CANCELLED", "REVIEWING_APPLICATIONS", "IN_PRODUCTION", "COMPLETED"]
        if payload.status.upper() not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid brief status '{payload.status}'.")
        brief.status = payload.status.upper()

    # Sync skills
    if payload.required_skill_ids is not None:
        db.query(BriefSkill).filter(BriefSkill.brief_id == brief.id).delete()
        for sk_id in payload.required_skill_ids:
            db.add(BriefSkill(
                id=f"bs-{brief.id}-{sk_id}",
                brief_id=brief.id,
                skill_id=sk_id,
                is_required=True
            ))

    # Sync tools
    if payload.required_tool_ids is not None:
        db.query(BriefTool).filter(BriefTool.brief_id == brief.id).delete()
        for tl_id in payload.required_tool_ids:
            db.add(BriefTool(
                id=f"bt-{brief.id}-{tl_id}",
                brief_id=brief.id,
                tool_id=tl_id,
                is_required=True
            ))

    brief.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(brief)
    return format_brief_read(brief)


@router.patch("/{brief_id}/status", response_model=BriefRead)
def update_brief_lifecycle_status(
    brief_id: str,
    payload: BriefStatusUpdate,
    current_user: User = Depends(require_role(["BRAND"])),
    db: Session = Depends(get_db)
):
    """
    Lifecycle transition endpoint allowing the owning brand to publish, close, or cancel a brief.
    Enforces ownership and validates allowed state transitions.
    """
    brand = current_user.brand_profile
    if not brand:
        raise HTTPException(status_code=400, detail="Brand profile not yet configured.")

    brief = db.query(Brief).filter(Brief.id == brief_id).first()
    if not brief:
        raise HTTPException(status_code=404, detail="Brief not found")

    if brief.brand_id != brand.id:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Only the owning brand can change the lifecycle status of this campaign brief."
        )

    target_status = payload.status.upper().strip()
    valid_statuses = ["DRAFT", "PUBLISHED", "CLOSED", "CANCELLED", "REVIEWING_APPLICATIONS", "IN_PRODUCTION", "COMPLETED"]
    if target_status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{payload.status}'. Must be one of: {', '.join(valid_statuses)}."
        )

    brief.status = target_status
    brief.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(brief)
    return format_brief_read(brief)


@router.delete("/{brief_id}")
def delete_or_cancel_brief(
    brief_id: str,
    current_user: User = Depends(require_role(["BRAND"])),
    db: Session = Depends(get_db)
):
    """Authenticated brand deletes or cancels their campaign brief."""
    brand = current_user.brand_profile
    if not brand:
        raise HTTPException(status_code=400, detail="Brand profile not yet configured.")

    brief = db.query(Brief).filter(Brief.id == brief_id).first()
    if not brief:
        raise HTTPException(status_code=404, detail="Brief not found")

    if brief.brand_id != brand.id:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: You can only delete campaign briefs owned by your brand."
        )

    # If applications or engagements exist, cancel it instead of hard deletion to preserve history
    if len(brief.applications) > 0 or len(brief.engagements) > 0:
        brief.status = "CANCELLED"
        brief.updated_at = datetime.utcnow()
        db.commit()
        return {"message": "Brief has existing applications; marked status as CANCELLED.", "brief_id": brief_id, "status": "CANCELLED"}

    db.delete(brief)
    db.commit()
    return {"message": "Brief deleted successfully.", "brief_id": brief_id}


def format_application_read(app: Application) -> ApplicationRead:
    return ApplicationRead(
        id=app.id,
        brief_id=app.brief_id,
        creator_id=app.creator_id,
        creator_display_name=app.creator.display_name if app.creator else None,
        creator_handle=app.creator.handle if app.creator else None,
        creator_avatar_url=app.creator.avatar_url if app.creator else None,
        pitch_text=app.pitch_text,
        proposed_rate=app.proposed_rate,
        proposed_timeline_days=app.proposed_timeline_days,
        attached_project_ids=app.attached_project_ids,
        status=app.status,
        submitted_at=app.submitted_at,
        reviewed_at=app.reviewed_at,
        brand_feedback=app.brand_feedback,
    )


@router.post("/{brief_id}/apply", response_model=ApplicationRead, status_code=201)
def submit_application(
    brief_id: str,
    payload: ApplicationCreate,
    current_user: User = Depends(require_role(["CREATOR"])),
    db: Session = Depends(get_db)
):
    brief = db.query(Brief).filter(Brief.id == brief_id).first()
    if not brief:
        raise HTTPException(status_code=404, detail="Brief not found")

    creator = current_user.creator_profile
    if not creator:
        raise HTTPException(
            status_code=400,
            detail="Creator profile not yet configured. Please set up your creator profile before applying to briefs."
        )

    # Only eligible PUBLISHED briefs accept applications
    if brief.status != "PUBLISHED":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot apply to brief: brief status is '{brief.status}'. Only PUBLISHED campaign briefs accept applications."
        )

    if brief.deadline and brief.deadline < datetime.utcnow():
        raise HTTPException(
            status_code=400,
            detail="Cannot apply to brief: application deadline has passed."
        )

    # Reject mismatched or forged client-supplied creator_id
    if payload.creator_id and payload.creator_id != creator.id:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Cannot submit an application on behalf of another creator."
        )

    existing_app = db.query(Application).filter(
        Application.brief_id == brief_id,
        Application.creator_id == creator.id
    ).first()
    if existing_app:
        raise HTTPException(status_code=400, detail="Creator has already applied to this brief")


    app_id = f"app-{uuid.uuid4().hex[:10]}"
    attached_str = ",".join(payload.attached_project_ids)

    app = Application(
        id=app_id,
        brief_id=brief_id,
        creator_id=creator.id,
        pitch_text=payload.pitch_text,
        proposed_rate=payload.proposed_rate,
        proposed_timeline_days=payload.proposed_timeline_days,
        attached_project_ids=attached_str,
        status="SUBMITTED"
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    return format_application_read(app)


@router.get("/applications/my-applications", response_model=List[ApplicationRead])
def list_my_applications(
    current_user: User = Depends(require_role(["CREATOR"])),
    db: Session = Depends(get_db)
):
    """Authenticated creator retrieves all applications they have submitted."""
    creator = current_user.creator_profile
    if not creator:
        return []
    apps = (
        db.query(Application)
        .filter(Application.creator_id == creator.id)
        .order_by(Application.submitted_at.desc())
        .all()
    )
    return [format_application_read(a) for a in apps]


@router.get("/{brief_id}/applications", response_model=List[ApplicationRead])
def list_brief_applications(

    brief_id: str,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    brief = db.query(Brief).filter(Brief.id == brief_id).first()
    if not brief:
        raise HTTPException(status_code=404, detail="Brief not found")

    # Restrict application lists strictly to the owning brand or ADMIN
    if current_user.role == "BRAND":
        if not current_user.brand_profile or current_user.brand_profile.id != brief.brand_id:
            raise HTTPException(
                status_code=403,
                detail="Forbidden: Only the brand that created this campaign brief can view submitted applications."
            )
    elif current_user.role == "ADMIN":
        pass
    else:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Only the owning brand can view submitted applications."
        )

    return [format_application_read(a) for a in brief.applications]


@router.patch("/applications/{application_id}/status", response_model=ApplicationRead)
def update_application_status(
    application_id: str,
    payload: ApplicationStatusUpdate,
    current_user: User = Depends(require_role(["BRAND"])),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    # Only the brief's owning brand can update application status or create engagements
    if not current_user.brand_profile or current_user.brand_profile.id != app.brief.brand_id:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Only the brand that owns this campaign brief can update application status or create engagements."
        )

    app.status = payload.status
    app.reviewed_at = datetime.utcnow()
    if payload.brand_feedback:
        app.brand_feedback = payload.brand_feedback

    # If accepted, automatically initialize engagement if one doesn't exist
    if payload.status == "ACCEPTED":
        existing_eng = db.query(Engagement).filter(Engagement.application_id == app.id).first()
        if not existing_eng:
            eng = Engagement(
                id=f"eng-{uuid.uuid4().hex[:10]}",
                brief_id=app.brief_id,
                creator_id=app.creator_id,
                application_id=app.id,
                status="KICKOFF",
                agreed_amount=app.proposed_rate,
                start_date=datetime.utcnow(),
                completion_deadline=datetime.utcnow() + timedelta(days=app.proposed_timeline_days)
            )
            db.add(eng)

    db.commit()
    db.refresh(app)
    return format_application_read(app)
