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
    Brief,
    BriefSkill,
    BriefTool,
    Skill,
    Tool,
    BrandProfile,
    Application,
    Engagement,
)
from backend.app.schemas.schemas import (
    BriefRead,
    BriefCreate,
    BriefSkillRef,
    BriefToolRef,
    ApplicationCreate,
    ApplicationRead,
    ApplicationStatusUpdate,
    EngagementRead,
)

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
    content_type: Optional[str] = Query(None, description="Content type"),
    aspect_ratio: Optional[str] = Query(None, description="Aspect ratio"),
    max_budget: Optional[float] = Query(None, description="Max budget"),
    status: Optional[str] = Query(None, description="Brief status"),
    db: Session = Depends(get_db)
):
    query = db.query(Brief)

    if content_type:
        query = query.filter(Brief.content_type == content_type)
    if aspect_ratio:
        query = query.filter(Brief.aspect_ratio == aspect_ratio)
    if max_budget is not None:
        query = query.filter(Brief.budget_amount <= max_budget)
    if status:
        query = query.filter(Brief.status == status)

    briefs = query.order_by(Brief.created_at.desc()).all()
    return [format_brief_read(b) for b in briefs]


@router.get("/{slug_or_id}", response_model=BriefRead)
def get_brief_detail(slug_or_id: str, db: Session = Depends(get_db)):
    brief = db.query(Brief).filter(
        or_(Brief.id == slug_or_id, Brief.slug == slug_or_id)
    ).first()

    if not brief:
        raise HTTPException(status_code=404, detail="Brief not found")

    return format_brief_read(brief)


@router.post("", response_model=BriefRead, status_code=201)
def create_brief(payload: BriefCreate, db: Session = Depends(get_db)):
    brand = db.query(BrandProfile).filter(BrandProfile.id == payload.brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand profile not found")

    brief_id = f"brief-{uuid.uuid4().hex[:10]}"
    slug = payload.title.lower().replace(" ", "-").replace(":", "").replace("/", "")[:60] + f"-{uuid.uuid4().hex[:4]}"

    deadline = datetime.utcnow() + timedelta(days=payload.deadline_days)

    brief = Brief(
        id=brief_id,
        brand_id=payload.brand_id,
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
        status="PUBLISHED"
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


@router.post("/{brief_id}/apply", response_model=ApplicationRead, status_code=201)
def submit_application(brief_id: str, payload: ApplicationCreate, db: Session = Depends(get_db)):
    brief = db.query(Brief).filter(Brief.id == brief_id).first()
    if not brief:
        raise HTTPException(status_code=404, detail="Brief not found")

    existing_app = db.query(Application).filter(
        Application.brief_id == brief_id,
        Application.creator_id == payload.creator_id
    ).first()
    if existing_app:
        raise HTTPException(status_code=400, detail="Creator has already applied to this brief")

    app_id = f"app-{uuid.uuid4().hex[:10]}"
    attached_str = ",".join(payload.attached_project_ids)

    app = Application(
        id=app_id,
        brief_id=brief_id,
        creator_id=payload.creator_id,
        pitch_text=payload.pitch_text,
        proposed_rate=payload.proposed_rate,
        proposed_timeline_days=payload.proposed_timeline_days,
        attached_project_ids=attached_str,
        status="SUBMITTED"
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    return app


@router.get("/{brief_id}/applications", response_model=List[ApplicationRead])
def list_brief_applications(brief_id: str, db: Session = Depends(get_db)):
    brief = db.query(Brief).filter(Brief.id == brief_id).first()
    if not brief:
        raise HTTPException(status_code=404, detail="Brief not found")
    return brief.applications


@router.patch("/applications/{application_id}/status", response_model=ApplicationRead)
def update_application_status(application_id: str, payload: ApplicationStatusUpdate, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

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
    return app
