"""
Kivora Creator Discovery & Profile Router
"""

import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.app.database import get_db
from backend.app.models.models import User, CreatorProfile, PortfolioProject, CreatorTool, CreatorSkill, WorkflowStep, EvidenceRecord
from backend.app.schemas.schemas import (
    CreatorProfileListRead,
    CreatorProfileDetailRead,
    CreatorSkillRead,
    CreatorToolRead,
    CreatorProfileSetupRequest,
    PortfolioProjectCreate,
    PortfolioProjectRead,
)
from backend.app.core.deps import require_role

router = APIRouter(prefix="/api/creators", tags=["Creators"])


def format_creator_list_item(c: CreatorProfile) -> CreatorProfileListRead:
    # Find featured project or first project
    feat_proj = next((p for p in c.portfolio_projects if p.featured), None)
    if not feat_proj and c.portfolio_projects:
        feat_proj = c.portfolio_projects[0]

    skills_read = [
        CreatorSkillRead(
            skill_id=cs.skill_id,
            name=cs.skill.name,
            category=cs.skill.category,
            proficiency_level=cs.proficiency_level
        )
        for cs in c.skills
    ]

    tools_read = [
        CreatorToolRead(
            tool_id=ct.tool_id,
            name=ct.tool.name,
            category=ct.tool.category,
            vendor=ct.tool.vendor,
            proficiency_level=ct.proficiency_level,
            is_claim_verified=ct.is_claim_verified
        )
        for ct in c.tools
    ]

    return CreatorProfileListRead(
        id=c.id,
        display_name=c.display_name,
        handle=c.handle,
        bio=c.bio,
        avatar_url=c.avatar_url,
        banner_url=c.banner_url,
        location=c.location,
        years_experience=c.years_experience,
        primary_specialization=c.primary_specialization,
        min_budget=c.min_budget,
        hourly_rate=c.hourly_rate,
        availability_status=c.availability_status,
        verification_tier=c.verification_tier,
        verified_claims_count=c.verified_claims_count,
        completed_projects_count=c.completed_projects_count,
        average_rating=c.average_rating,
        skills=skills_read,
        tools=tools_read,
        featured_project_thumbnail=feat_proj.thumbnail_url if feat_proj else None,
        featured_project_title=feat_proj.title if feat_proj else None
    )


@router.get("", response_model=List[CreatorProfileListRead])
def list_creators(
    search: Optional[str] = Query(None, description="Search term for name, bio, or specialization"),
    tool: Optional[str] = Query(None, description="Tool name or ID to filter by"),
    skill: Optional[str] = Query(None, description="Skill name or ID to filter by"),
    content_type: Optional[str] = Query(None, description="Content type filter"),
    aspect_ratio: Optional[str] = Query(None, description="Aspect ratio filter (e.g. 16:9, 9:16)"),
    max_budget: Optional[float] = Query(None, description="Maximum budget threshold"),
    verification_tier: Optional[str] = Query(None, description="Minimum verification tier"),
    availability: Optional[str] = Query(None, description="Availability status"),
    db: Session = Depends(get_db)
):
    query = db.query(CreatorProfile)

    if search:
        search_filter = f"%{search.lower()}%"
        query = query.filter(
            or_(
                CreatorProfile.display_name.ilike(search_filter),
                CreatorProfile.handle.ilike(search_filter),
                CreatorProfile.bio.ilike(search_filter),
                CreatorProfile.primary_specialization.ilike(search_filter)
            )
        )

    if max_budget is not None:
        query = query.filter(CreatorProfile.min_budget <= max_budget)

    if verification_tier:
        query = query.filter(CreatorProfile.verification_tier == verification_tier)

    if availability:
        query = query.filter(CreatorProfile.availability_status == availability)

    creators = query.all()

    # In-memory relational filtering for tool, skill, content_type, and aspect_ratio
    results = []
    for c in creators:
        if tool:
            has_tool = any(ct.tool.name.lower() == tool.lower() or ct.tool_id == tool for ct in c.tools)
            if not has_tool:
                continue

        if skill:
            has_skill = any(cs.skill.name.lower() == skill.lower() or cs.skill_id == skill for cs in c.skills)
            if not has_skill:
                continue

        if content_type:
            has_content_type = any(p.content_type == content_type for p in c.portfolio_projects)
            if not has_content_type:
                continue

        if aspect_ratio:
            has_ar = any(p.aspect_ratio == aspect_ratio for p in c.portfolio_projects)
            if not has_ar:
                continue

        results.append(format_creator_list_item(c))

    return results


@router.get("/{slug_or_id}", response_model=CreatorProfileDetailRead)
def get_creator_detail(slug_or_id: str, db: Session = Depends(get_db)):
    creator = db.query(CreatorProfile).filter(
        or_(CreatorProfile.id == slug_or_id, CreatorProfile.handle == slug_or_id)
    ).first()

    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")

    base_read = format_creator_list_item(creator)
    return CreatorProfileDetailRead(
        **base_read.dict(),
        website_url=creator.website_url,
        portfolio_projects=creator.portfolio_projects
    )


@router.post("/profile", response_model=CreatorProfileDetailRead, status_code=201)
def setup_or_update_creator_profile(
    payload: CreatorProfileSetupRequest,
    current_user: User = Depends(require_role(["CREATOR"])),
    db: Session = Depends(get_db)
):
    """Real authenticated creator sets up or updates their public profile."""
    creator = db.query(CreatorProfile).filter(CreatorProfile.user_id == current_user.id).first()

    clean_handle = payload.handle.lower().strip().replace("@", "")
    # Check handle uniqueness against other creators
    existing_handle = db.query(CreatorProfile).filter(
        CreatorProfile.handle == clean_handle,
        CreatorProfile.user_id != current_user.id
    ).first()
    if existing_handle:
        raise HTTPException(status_code=400, detail="This creator handle is already taken.")

    if not creator:
        creator_id = f"creator-{uuid.uuid4().hex[:10]}"
        creator = CreatorProfile(
            id=creator_id,
            user_id=current_user.id,
            display_name=payload.display_name,
            handle=clean_handle,
            bio=payload.bio,
            avatar_url=payload.avatar_url,
            banner_url=payload.banner_url,
            location=payload.location,
            years_experience=payload.years_experience,
            primary_specialization=payload.primary_specialization,
            website_url=payload.website_url,
            min_budget=payload.min_budget,
            hourly_rate=payload.hourly_rate,
            availability_status="AVAILABLE",
            verification_tier="COMMUNITY",
            verified_claims_count=0,
            completed_projects_count=0,
            average_rating=5.0,
            created_at=datetime.utcnow()
        )
        db.add(creator)
    else:
        creator.display_name = payload.display_name
        creator.handle = clean_handle
        creator.bio = payload.bio
        creator.avatar_url = payload.avatar_url
        creator.banner_url = payload.banner_url
        creator.location = payload.location
        creator.years_experience = payload.years_experience
        creator.primary_specialization = payload.primary_specialization
        creator.website_url = payload.website_url
        creator.min_budget = payload.min_budget
        creator.hourly_rate = payload.hourly_rate
        creator.updated_at = datetime.utcnow()

    db.flush()

    # Link skills
    for sk_id in payload.skill_ids:
        exists = db.query(CreatorSkill).filter(
            CreatorSkill.creator_id == creator.id,
            CreatorSkill.skill_id == sk_id
        ).first()
        if not exists:
            db.add(CreatorSkill(
                id=f"cs-{creator.id}-{sk_id}",
                creator_id=creator.id,
                skill_id=sk_id,
                proficiency_level="ADVANCED"
            ))

    # Link tools
    for tl_id in payload.tool_ids:
        exists = db.query(CreatorTool).filter(
            CreatorTool.creator_id == creator.id,
            CreatorTool.tool_id == tl_id
        ).first()
        if not exists:
            db.add(CreatorTool(
                id=f"ct-{creator.id}-{tl_id}",
                creator_id=creator.id,
                tool_id=tl_id,
                proficiency_level="ADVANCED",
                is_claim_verified=False
            ))

    db.commit()
    db.refresh(creator)
    base_read = format_creator_list_item(creator)
    return CreatorProfileDetailRead(
        **base_read.dict(),
        website_url=creator.website_url,
        portfolio_projects=creator.portfolio_projects
    )


@router.post("/portfolio", response_model=PortfolioProjectRead, status_code=201)
def add_portfolio_project(
    payload: PortfolioProjectCreate,
    current_user: User = Depends(require_role(["CREATOR"])),
    db: Session = Depends(get_db)
):
    """Real creator authors a new portfolio project with workflows and evidence."""
    creator = current_user.creator_profile
    if not creator:
        raise HTTPException(status_code=400, detail="Please set up your creator profile before uploading portfolio work.")

    proj_id = f"proj-{uuid.uuid4().hex[:10]}"
    slug = payload.title.lower().replace(" ", "-").replace(":", "")[:50] + f"-{uuid.uuid4().hex[:4]}"

    project = PortfolioProject(
        id=proj_id,
        creator_id=creator.id,
        title=payload.title,
        slug=slug,
        description=payload.description,
        content_type=payload.content_type,
        primary_asset_url=payload.primary_asset_url,
        thumbnail_url=payload.thumbnail_url,
        aspect_ratio=payload.aspect_ratio,
        resolution=payload.resolution,
        duration_seconds=payload.duration_seconds,
        commercial_rights_held=payload.commercial_rights_held,
        commercial_license_type=payload.commercial_license_type,
        featured=payload.featured,
        created_at=datetime.utcnow()
    )
    db.add(project)
    db.flush()

    # Add workflow steps
    for idx, step_data in enumerate(payload.workflow_steps, start=1):
        step = WorkflowStep(
            id=f"ws-{proj_id}-step-{idx}",
            project_id=proj_id,
            step_order=idx,
            stage_name=step_data.get("stage_name", f"Step {idx}"),
            tools_used=step_data.get("tools_used", "AI Generative Model"),
            description=step_data.get("description", ""),
            parameters_snippet=step_data.get("parameters_snippet"),
            output_sample_url=step_data.get("output_sample_url")
        )
        db.add(step)

    # Add evidence records
    for ev_data in payload.evidence_records:
        ev = EvidenceRecord(
            id=f"ev-{uuid.uuid4().hex[:10]}",
            project_id=proj_id,
            evidence_type=ev_data.get("evidence_type", "PROCESS_SCREENSHOT"),
            file_url=ev_data.get("file_url", "/assets/evidence/placeholder.png"),
            title=ev_data.get("title", "Process Evidence"),
            description=ev_data.get("description", ""),
            uploaded_at=datetime.utcnow()
        )
        db.add(ev)

    db.commit()
    db.refresh(project)
    return project
