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
from backend.app.models.models import (
    User,
    CreatorProfile,
    PortfolioProject,
    CreatorTool,
    CreatorSkill,
    WorkflowStep,
    EvidenceRecord,
    VerificationRecord,
)
from backend.app.schemas.schemas import (
    CreatorProfileListRead,
    CreatorProfileDetailRead,
    CreatorSkillRead,
    CreatorToolRead,
    CreatorProfileSetupRequest,
    PortfolioProjectCreate,
    PortfolioProjectRead,
    PortfolioProjectUpdate,
    WorkflowStepCreate,
    WorkflowStepRead,
    EvidenceRecordCreate,
    EvidenceRecordRead,
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
    specialization: Optional[str] = Query(None, description="Primary specialization filter"),
    tool: Optional[str] = Query(None, description="Tool name or ID to filter by"),
    skill: Optional[str] = Query(None, description="Skill name or ID to filter by"),
    content_type: Optional[str] = Query(None, description="Content type filter (e.g. VIDEO, IMAGE)"),
    aspect_ratio: Optional[str] = Query(None, description="Aspect ratio filter (e.g. 16:9, 9:16)"),
    min_budget: Optional[float] = Query(None, description="Minimum budget/rate threshold"),
    max_budget: Optional[float] = Query(None, description="Maximum budget threshold"),
    verification_tier: Optional[str] = Query(None, description="Verification tier filter"),
    verification_status: Optional[str] = Query(None, description="Verification status alias"),
    only_verified: Optional[bool] = Query(None, description="Filter only verified creators (VERIFIED_PRO or TOP_STUDIO)"),
    availability: Optional[str] = Query(None, description="Availability status (AVAILABLE, BOOKED, LIMITED)"),
    sort_by: Optional[str] = Query(None, description="Sort order: rating_desc, budget_asc, budget_desc, experience_desc, verified_claims_desc"),
    page: Optional[int] = Query(None, ge=1, description="Page number"),
    limit: Optional[int] = Query(None, ge=1, le=100, description="Items per page"),
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

    if specialization:
        query = query.filter(CreatorProfile.primary_specialization.ilike(f"%{specialization}%"))

    if min_budget is not None:
        query = query.filter(CreatorProfile.min_budget >= min_budget)

    if max_budget is not None:
        query = query.filter(CreatorProfile.min_budget <= max_budget)

    v_tier = verification_tier or verification_status
    if only_verified:
        query = query.filter(CreatorProfile.verification_tier.in_(["VERIFIED_PRO", "TOP_STUDIO"]))
    elif v_tier:
        if v_tier.upper() in ["VERIFIED", "VERIFIED_ONLY"]:
            query = query.filter(CreatorProfile.verification_tier.in_(["VERIFIED_PRO", "TOP_STUDIO"]))
        else:
            query = query.filter(CreatorProfile.verification_tier == v_tier.upper())

    if availability:
        query = query.filter(CreatorProfile.availability_status == availability.upper())

    creators = query.all()

    # Relational filtering for tool, skill, content_type, and aspect_ratio
    matched = []
    for c in creators:
        if tool:
            tool_low = tool.lower()
            has_tool = any(
                ct.tool.name.lower() == tool_low
                or tool_low in ct.tool.name.lower()
                or ct.tool_id.lower() == tool_low
                for ct in c.tools
            )
            if not has_tool:
                continue

        if skill:
            skill_low = skill.lower()
            has_skill = any(
                cs.skill.name.lower() == skill_low
                or skill_low in cs.skill.name.lower()
                or cs.skill_id.lower() == skill_low
                for cs in c.skills
            )
            if not has_skill:
                continue

        if content_type:
            ct_low = content_type.upper()
            has_content_type = any(p.content_type.upper() == ct_low for p in c.portfolio_projects)
            if not has_content_type:
                continue

        if aspect_ratio:
            has_ar = any(p.aspect_ratio == aspect_ratio for p in c.portfolio_projects)
            if not has_ar:
                continue

        matched.append(c)

    # Sorting
    if sort_by:
        s = sort_by.lower()
        if s in ["rating_desc", "rating"]:
            matched.sort(key=lambda c: c.average_rating, reverse=True)
        elif s in ["budget_asc", "rate_asc"]:
            matched.sort(key=lambda c: c.min_budget)
        elif s in ["budget_desc", "rate_desc"]:
            matched.sort(key=lambda c: c.min_budget, reverse=True)
        elif s in ["experience_desc", "experience"]:
            matched.sort(key=lambda c: c.years_experience, reverse=True)
        elif s in ["verified_claims_desc", "verified_claims"]:
            matched.sort(key=lambda c: c.verified_claims_count, reverse=True)
        else:
            matched.sort(key=lambda c: (c.average_rating, c.verified_claims_count), reverse=True)
    else:
        matched.sort(key=lambda c: (c.average_rating, c.verified_claims_count), reverse=True)

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

    return [format_creator_list_item(c) for c in matched]



@router.get("/me", response_model=CreatorProfileDetailRead)
def get_my_creator_profile(
    current_user: User = Depends(require_role(["CREATOR"])),
    db: Session = Depends(get_db)
):
    """Authenticated creator retrieves their own full profile."""
    creator = current_user.creator_profile
    if not creator:
        raise HTTPException(
            status_code=404,
            detail="Creator profile not yet initialized. Please complete profile setup."
        )
    base_read = format_creator_list_item(creator)
    return CreatorProfileDetailRead(
        **base_read.dict(),
        website_url=creator.website_url,
        portfolio_projects=creator.portfolio_projects
    )


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


@router.put("/profile", response_model=CreatorProfileDetailRead)
def update_creator_profile_put(
    payload: CreatorProfileSetupRequest,
    current_user: User = Depends(require_role(["CREATOR"])),
    db: Session = Depends(get_db)
):
    """PUT alias allowing creators to update their profile."""
    return setup_or_update_creator_profile(payload, current_user, db)


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
            step_order=step_data.get("step_order", idx),
            stage_name=step_data.get("stage_name", f"Step {idx}"),
            tools_used=step_data.get("tools_used", "AI Generative Model"),
            description=step_data.get("description", ""),
            parameters_snippet=step_data.get("parameters_snippet"),
            output_sample_url=step_data.get("output_sample_url")
        )
        db.add(step)

    # Add evidence records
    for ev_data in payload.evidence_records:
        ev_id = f"ev-{uuid.uuid4().hex[:10]}"
        ev = EvidenceRecord(
            id=ev_id,
            project_id=proj_id,
            evidence_type=ev_data.get("evidence_type", "PROCESS_SCREENSHOT"),
            file_url=ev_data.get("file_url", "/assets/evidence/placeholder.png"),
            title=ev_data.get("title", "Process Evidence"),
            description=ev_data.get("description", ""),
            uploaded_at=datetime.utcnow()
        )
        db.add(ev)
        db.flush()

        # If verification request embedded
        if ev_data.get("request_verification"):
            ver_id = f"ver-{uuid.uuid4().hex[:10]}"
            ver = VerificationRecord(
                id=ver_id,
                evidence_id=ev_id,
                target_type=ev_data.get("target_type", "PORTFOLIO_PROJECT"),
                target_id=ev_data.get("target_id", proj_id),
                verification_scope=ev_data.get("verification_scope", f"Verification of {ev.title}"),
                status="PENDING",
                reviewed_by="PENDING_AUDIT",
                reviewer_notes="Submitted by creator for administrative audit.",
                reviewed_at=datetime.utcnow()
            )
            db.add(ver)

    db.commit()
    db.refresh(project)
    return project


@router.get("/portfolio/{project_id}", response_model=PortfolioProjectRead)
def get_portfolio_project_detail(
    project_id: str,
    db: Session = Depends(get_db)
):
    """Retrieve detailed portfolio project with workflow steps and evidence."""
    project = db.query(PortfolioProject).filter(
        or_(PortfolioProject.id == project_id, PortfolioProject.slug == project_id)
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Portfolio project not found")
    return project


@router.put("/portfolio/{project_id}", response_model=PortfolioProjectRead)
def update_portfolio_project(
    project_id: str,
    payload: PortfolioProjectUpdate,
    current_user: User = Depends(require_role(["CREATOR"])),
    db: Session = Depends(get_db)
):
    """Authenticated creator updates their own portfolio project."""
    creator = current_user.creator_profile
    if not creator:
        raise HTTPException(status_code=400, detail="Creator profile not configured.")

    project = db.query(PortfolioProject).filter(PortfolioProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Portfolio project not found")

    if project.creator_id != creator.id:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: You can only edit your own portfolio projects."
        )

    for field in [
        "title", "description", "content_type", "primary_asset_url",
        "thumbnail_url", "aspect_ratio", "resolution", "duration_seconds",
        "commercial_rights_held", "commercial_license_type", "featured"
    ]:
        val = getattr(payload, field, None)
        if val is not None:
            setattr(project, field, val)

    if payload.workflow_steps is not None:
        db.query(WorkflowStep).filter(WorkflowStep.project_id == project.id).delete()
        for idx, step_data in enumerate(payload.workflow_steps, start=1):
            step = WorkflowStep(
                id=f"ws-{project.id}-step-{idx}",
                project_id=project.id,
                step_order=step_data.get("step_order", idx),
                stage_name=step_data.get("stage_name", f"Step {idx}"),
                tools_used=step_data.get("tools_used", "AI Generative Model"),
                description=step_data.get("description", ""),
                parameters_snippet=step_data.get("parameters_snippet"),
                output_sample_url=step_data.get("output_sample_url")
            )
            db.add(step)

    db.commit()
    db.refresh(project)
    return project


@router.delete("/portfolio/{project_id}")
def delete_portfolio_project(
    project_id: str,
    current_user: User = Depends(require_role(["CREATOR"])),
    db: Session = Depends(get_db)
):
    """Authenticated creator deletes their own portfolio project."""
    creator = current_user.creator_profile
    if not creator:
        raise HTTPException(status_code=400, detail="Creator profile not configured.")

    project = db.query(PortfolioProject).filter(PortfolioProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Portfolio project not found")

    if project.creator_id != creator.id:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: You can only delete your own portfolio projects."
        )

    db.delete(project)
    db.commit()
    return {"message": "Portfolio project deleted successfully.", "deleted_id": project_id}


@router.post("/portfolio/{project_id}/evidence", response_model=EvidenceRecordRead, status_code=201)
def add_project_evidence(
    project_id: str,
    payload: EvidenceRecordCreate,
    current_user: User = Depends(require_role(["CREATOR"])),
    db: Session = Depends(get_db)
):
    """Authenticated creator adds an evidence record to their own portfolio project."""
    creator = current_user.creator_profile
    if not creator:
        raise HTTPException(status_code=400, detail="Creator profile not configured.")

    project = db.query(PortfolioProject).filter(PortfolioProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Portfolio project not found")

    if project.creator_id != creator.id:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: You can only add evidence to your own portfolio projects."
        )

    ev_id = f"ev-{uuid.uuid4().hex[:10]}"
    evidence = EvidenceRecord(
        id=ev_id,
        project_id=project.id,
        evidence_type=payload.evidence_type,
        file_url=payload.file_url,
        title=payload.title,
        description=payload.description,
        uploaded_at=datetime.utcnow()
    )
    db.add(evidence)
    db.flush()

    if payload.request_verification:
        ver_id = f"ver-{uuid.uuid4().hex[:10]}"
        verification = VerificationRecord(
            id=ver_id,
            evidence_id=ev_id,
            target_type=payload.target_type or "PORTFOLIO_PROJECT",
            target_id=payload.target_id or project.id,
            verification_scope=payload.verification_scope or f"Audit of {evidence.title}",
            status="PENDING",
            reviewed_by="PENDING_AUDIT",
            reviewer_notes="Submitted by creator for administrative audit.",
            reviewed_at=datetime.utcnow()
        )
        db.add(verification)

    db.commit()
    db.refresh(evidence)
    return evidence


@router.post("/portfolio/{project_id}/workflow-step", response_model=WorkflowStepRead, status_code=201)
def add_project_workflow_step(
    project_id: str,
    payload: WorkflowStepCreate,
    current_user: User = Depends(require_role(["CREATOR"])),
    db: Session = Depends(get_db)
):
    """Authenticated creator adds a creative workflow step to their portfolio project."""
    creator = current_user.creator_profile
    if not creator:
        raise HTTPException(status_code=400, detail="Creator profile not configured.")

    project = db.query(PortfolioProject).filter(PortfolioProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Portfolio project not found")

    if project.creator_id != creator.id:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: You can only add workflow steps to your own portfolio projects."
        )

    order = payload.step_order or (len(project.workflow_steps) + 1)
    step_id = f"ws-{project.id}-step-{order}-{uuid.uuid4().hex[:4]}"
    step = WorkflowStep(
        id=step_id,
        project_id=project.id,
        step_order=order,
        stage_name=payload.stage_name,
        tools_used=payload.tools_used,
        description=payload.description,
        parameters_snippet=payload.parameters_snippet,
        output_sample_url=payload.output_sample_url
    )
    db.add(step)
    db.commit()
    db.refresh(step)
    return step

