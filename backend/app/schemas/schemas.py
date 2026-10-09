"""
Pydantic Schemas for Kivora API
Defines input/output contracts, validation rules, and response shapes.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr


# ==========================================
# 1. TAXONOMY SCHEMAS (SKILLS & TOOLS)
# ==========================================

class SkillRead(BaseModel):
    id: str
    name: str
    category: str

    class Config:
        from_attributes = True


class CreatorSkillRead(BaseModel):
    skill_id: str
    name: str
    category: str
    proficiency_level: str

    class Config:
        from_attributes = True


class ToolRead(BaseModel):
    id: str
    name: str
    category: str
    vendor: str

    class Config:
        from_attributes = True


class CreatorToolRead(BaseModel):
    tool_id: str
    name: str
    category: str
    vendor: str
    proficiency_level: str
    is_claim_verified: bool

    class Config:
        from_attributes = True


# ==========================================
# 2. WORKFLOW & EVIDENCE SCHEMAS
# ==========================================

class WorkflowStepRead(BaseModel):
    id: str
    step_order: int
    stage_name: str
    tools_used: str
    description: str
    parameters_snippet: Optional[str] = None
    output_sample_url: Optional[str] = None

    class Config:
        from_attributes = True


class VerificationRecordRead(BaseModel):
    id: str
    target_type: str
    target_id: str
    verification_scope: str
    status: str
    reviewed_by: str
    reviewer_notes: str
    reviewed_at: datetime

    class Config:
        from_attributes = True


class EvidenceRecordRead(BaseModel):
    id: str
    project_id: str
    evidence_type: str
    file_url: str
    title: str
    description: str
    uploaded_at: datetime
    verification: Optional[VerificationRecordRead] = None

    class Config:
        from_attributes = True


# ==========================================
# 3. PORTFOLIO SCHEMAS
# ==========================================

class PortfolioProjectRead(BaseModel):
    id: str
    creator_id: str
    title: str
    slug: str
    description: str
    content_type: str
    primary_asset_url: str
    thumbnail_url: str
    aspect_ratio: str
    resolution: str
    duration_seconds: Optional[int] = None
    commercial_rights_held: bool
    commercial_license_type: str
    featured: bool
    created_at: datetime
    workflow_steps: List[WorkflowStepRead] = []
    evidence_records: List[EvidenceRecordRead] = []

    class Config:
        from_attributes = True


# ==========================================
# 4. CREATOR PROFILE SCHEMAS
# ==========================================

class CreatorProfileListRead(BaseModel):
    id: str
    display_name: str
    handle: str
    bio: str
    avatar_url: str
    banner_url: Optional[str] = None
    location: str
    years_experience: int
    primary_specialization: str
    min_budget: float
    hourly_rate: Optional[float] = None
    availability_status: str
    verification_tier: str
    verified_claims_count: int
    completed_projects_count: int
    average_rating: float
    skills: List[CreatorSkillRead] = []
    tools: List[CreatorToolRead] = []
    featured_project_thumbnail: Optional[str] = None
    featured_project_title: Optional[str] = None

    class Config:
        from_attributes = True


class CreatorProfileDetailRead(CreatorProfileListRead):
    website_url: Optional[str] = None
    portfolio_projects: List[PortfolioProjectRead] = []

    class Config:
        from_attributes = True


# ==========================================
# 5. BRAND PROFILE SCHEMAS
# ==========================================

class BrandProfileRead(BaseModel):
    id: str
    company_name: str
    slug: str
    industry: str
    website_url: Optional[str] = None
    logo_url: str
    description: str
    company_size: str
    headquarters: str
    is_verified_brand: bool

    class Config:
        from_attributes = True


# ==========================================
# 6. CAMPAIGN BRIEFS SCHEMAS
# ==========================================

class BriefSkillRef(BaseModel):
    skill_id: str
    name: str
    is_required: bool


class BriefToolRef(BaseModel):
    tool_id: str
    name: str
    is_required: bool


class BriefRead(BaseModel):
    id: str
    brand_id: str
    brand: Optional[BrandProfileRead] = None
    title: str
    slug: str
    campaign_objective: str
    target_audience: str
    content_type: str
    creative_style_mood: str
    aspect_ratio: str
    duration_seconds_min: Optional[int] = None
    duration_seconds_max: Optional[int] = None
    resolution_min: str
    deliverables_description: str
    revision_allowance: int
    budget_amount: float
    budget_currency: str
    deadline: datetime
    commercial_use_requirements: str
    usage_channels: str
    usage_duration: str
    usage_territories: str
    restrictions_and_guidelines: str
    disclosure_requirements: str
    status: str
    created_at: datetime
    required_skills: List[BriefSkillRef] = []
    required_tools: List[BriefToolRef] = []
    applications_count: int = 0

    class Config:
        from_attributes = True


class BriefCreate(BaseModel):
    brand_id: str
    title: str
    campaign_objective: str
    target_audience: str
    content_type: str
    creative_style_mood: str
    aspect_ratio: str
    duration_seconds_min: Optional[int] = None
    duration_seconds_max: Optional[int] = None
    resolution_min: str = "4K UHD"
    deliverables_description: str
    revision_allowance: int = 2
    budget_amount: float
    budget_currency: str = "USD"
    deadline_days: int = 21  # Target completion in days from now
    commercial_use_requirements: str
    usage_channels: str
    usage_duration: str
    usage_territories: str
    restrictions_and_guidelines: str
    disclosure_requirements: str
    required_skill_ids: List[str] = []
    required_tool_ids: List[str] = []


# ==========================================
# 7. APPLICATION & ENGAGEMENT SCHEMAS
# ==========================================

class ApplicationCreate(BaseModel):
    brief_id: str
    creator_id: str
    pitch_text: str
    proposed_rate: float
    proposed_timeline_days: int
    attached_project_ids: List[str] = []


class ApplicationRead(BaseModel):
    id: str
    brief_id: str
    creator_id: str
    creator: Optional[CreatorProfileListRead] = None
    pitch_text: str
    proposed_rate: float
    proposed_timeline_days: int
    attached_project_ids: str
    status: str
    submitted_at: datetime
    reviewed_at: Optional[datetime] = None
    brand_feedback: Optional[str] = None

    class Config:
        from_attributes = True


class ApplicationStatusUpdate(BaseModel):
    status: str  # SHORTLISTED, ACCEPTED, REJECTED
    brand_feedback: Optional[str] = None


class EngagementRead(BaseModel):
    id: str
    brief_id: str
    creator_id: str
    application_id: str
    status: str
    agreed_amount: float
    start_date: datetime
    completion_deadline: datetime
    final_deliverable_url: Optional[str] = None
    brand_rating: Optional[int] = None
    brand_review: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# 8. MATCHING & EXPLAINABLE AI SCHEMAS
# ==========================================

class MatchScoreBreakdown(BaseModel):
    hard_filter_passed: bool
    skill_score: float
    tool_score: float
    style_score: float
    verification_score: float
    rating_score: float
    total_score: float
    match_level: str  # PERFECT, EXCELLENT, GOOD, PARTIAL, INCOMPATIBLE


class CreatorMatchResult(BaseModel):
    creator_id: str
    display_name: str
    handle: str
    avatar_url: str
    primary_specialization: str
    verification_tier: str
    min_budget: float
    score: float
    match_level: str
    breakdown: MatchScoreBreakdown
    reasons: List[str]
    gaps: List[str]


class BriefMatchResponse(BaseModel):
    brief_id: str
    brief_title: str
    total_creators_evaluated: int
    matches: List[CreatorMatchResult]


# ==========================================
# 9. AI-ASSISTED BRIEF BUILDER SCHEMAS
# ==========================================

class BriefGenerationRequest(BaseModel):
    raw_prompt: str = Field(..., min_length=10, description="Conversational or rough campaign idea from brand")
    brand_industry: Optional[str] = None
    target_budget: Optional[float] = None


class StructuredBriefOutput(BaseModel):
    title: str
    campaign_objective: str
    target_audience: str
    content_type: str
    creative_style_mood: str
    aspect_ratio: str
    duration_seconds_min: Optional[int] = None
    duration_seconds_max: Optional[int] = None
    resolution_min: str
    deliverables_description: str
    revision_allowance: int
    budget_amount: float
    budget_currency: str
    recommended_skills: List[str]
    recommended_tools: List[str]
    commercial_use_requirements: str
    usage_channels: str
    usage_duration: str
    usage_territories: str
    restrictions_and_guidelines: str
    disclosure_requirements: str
    generation_engine: str  # "LLM_SYNTHESIZER" or "HEURISTIC_FALLBACK_ENGINE"
