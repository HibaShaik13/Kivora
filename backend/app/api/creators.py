"""
Kivora Creator Discovery & Profile Router
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.app.database import get_db
from backend.app.models.models import CreatorProfile, PortfolioProject, CreatorTool, CreatorSkill
from backend.app.schemas.schemas import CreatorProfileListRead, CreatorProfileDetailRead, CreatorSkillRead, CreatorToolRead

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
