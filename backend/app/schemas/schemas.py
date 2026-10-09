"""
Pydantic Schemas for Kivora API
Defines input/output contracts, validation rules, and response shapes.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


# ==========================================
# 0. AUTHENTICATION & USER SCHEMAS
# ==========================================

EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"

class UserRegisterRequest(BaseModel):
    email: str = Field(..., pattern=EMAIL_PATTERN, description="Valid email address")
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    role: str = Field("CREATOR", description="Role: 'CREATOR' or 'BRAND'")


class UserLoginRequest(BaseModel):
    email: str = Field(..., pattern=EMAIL_PATTERN)
    password: str


class VerifyOtpRequest(BaseModel):
    email: str = Field(..., pattern=EMAIL_PATTERN)
    otp_code: str = Field(..., min_length=6, max_length=6)


class ResendOtpRequest(BaseModel):
    email: str = Field(..., pattern=EMAIL_PATTERN)


class UserSummaryResponse(BaseModel):
    id: str
    email: str
    role: str
    is_email_verified: bool
    has_profile: bool = False
    profile_id: Optional[str] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserSummaryResponse


class CreatorProfileSetupRequest(BaseModel):
    display_name: str
    handle: str
    bio: str
    avatar_url: str = "/assets/avatars/default.jpg"
    banner_url: Optional[str] = None
    location: str
    years_experience: int = 1
    primary_specialization: str
    website_url: Optional[str] = None
    min_budget: float = 500.0
    hourly_rate: Optional[float] = None
    skill_ids: List[str] = []
    tool_ids: List[str] = []


class BrandProfileSetupRequest(BaseModel):
    company_name: str
    slug: str
    industry: str
    website_url: Optional[str] = None
    logo_url: str = "/assets/brands/default.svg"
    description: str
    company_size: str = "10-50"
    headquarters: str


class BrandProfileUpdateRequest(BaseModel):
    company_name: Optional[str] = None
    slug: Optional[str] = None
    industry: Optional[str] = None
    website_url: Optional[str] = None
    logo_url: Optional[str] = None
    description: Optional[str] = None
    company_size: Optional[str] = None
    headquarters: Optional[str] = None


class PortfolioProjectCreate(BaseModel):
    title: str
    description: str
    content_type: str
    primary_asset_url: str
    thumbnail_url: str
    aspect_ratio: str
    resolution: str = "4K UHD"
    duration_seconds: Optional[int] = None
    commercial_rights_held: bool = True
    commercial_license_type: str = "Full Commercial Buyout"
    featured: bool = False
    workflow_steps: List[Dict[str, Any]] = []
    evidence_records: List[Dict[str, Any]] = []


class PortfolioProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    content_type: Optional[str] = None
    primary_asset_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    aspect_ratio: Optional[str] = None
    resolution: Optional[str] = None
    duration_seconds: Optional[int] = None
    commercial_rights_held: Optional[bool] = None
    commercial_license_type: Optional[str] = None
    featured: Optional[bool] = None
    workflow_steps: Optional[List[Dict[str, Any]]] = None


class WorkflowStepCreate(BaseModel):
    stage_name: str
    tools_used: str
    description: str
    step_order: Optional[int] = None
    parameters_snippet: Optional[str] = None
    output_sample_url: Optional[str] = None


class EvidenceRecordCreate(BaseModel):
    evidence_type: str = "PROCESS_SCREENSHOT"
    file_url: str
    title: str
    description: str
    request_verification: bool = False
    target_type: Optional[str] = "PORTFOLIO_PROJECT"
    target_id: Optional[str] = None
    verification_scope: Optional[str] = None


class VerificationRequestCreate(BaseModel):
    evidence_id: str
    target_type: str  # PORTFOLIO_PROJECT, CREATOR_TOOL, CREATOR_SKILL, WORKFLOW_STEP
    target_id: str
    verification_scope: str


class VerificationReviewRequest(BaseModel):
    status: str  # APPROVED, REJECTED
    reviewer_notes: str


class MediaUploadResponse(BaseModel):
    url: str
    filename: str
    content_type: str
    size_bytes: int


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


class InconsistencyFlag(BaseModel):
    reason: str
    supporting_info: str


class AIEvidenceAnalysisRead(BaseModel):
    id: str
    verification_id: str
    summary: str
    evidence_items_detected: List[str]
    missing_evidence: List[str]
    potential_inconsistencies: List[InconsistencyFlag]
    limitations: List[str]
    analysis_status: str  # COMPLETED, UNAVAILABLE, ERROR
    disclaimer: str
    model_name: Optional[str] = None
    analyzed_at: datetime

    class Config:
        from_attributes = True


class VerificationRecordDetailRead(VerificationRecordRead):
    evidence_id: Optional[str] = None
    evidence_title: Optional[str] = None
    evidence_file_url: Optional[str] = None
    evidence_type: Optional[str] = None
    project_id: Optional[str] = None
    project_title: Optional[str] = None
    creator_id: Optional[str] = None
    creator_name: Optional[str] = None
    creator_handle: Optional[str] = None
    ai_analysis: Optional[AIEvidenceAnalysisRead] = None


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
    brand_id: Optional[str] = None  # Derived from authenticated brand profile; rejected if mismatched
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
    status: Optional[str] = "PUBLISHED"  # "PUBLISHED" or "DRAFT"
    required_skill_ids: List[str] = []
    required_tool_ids: List[str] = []


class BriefUpdate(BaseModel):
    title: Optional[str] = None
    campaign_objective: Optional[str] = None
    target_audience: Optional[str] = None
    content_type: Optional[str] = None
    creative_style_mood: Optional[str] = None
    aspect_ratio: Optional[str] = None
    duration_seconds_min: Optional[int] = None
    duration_seconds_max: Optional[int] = None
    resolution_min: Optional[str] = None
    deliverables_description: Optional[str] = None
    revision_allowance: Optional[int] = None
    budget_amount: Optional[float] = None
    budget_currency: Optional[str] = None
    deadline_days: Optional[int] = None
    commercial_use_requirements: Optional[str] = None
    usage_channels: Optional[str] = None
    usage_duration: Optional[str] = None
    usage_territories: Optional[str] = None
    restrictions_and_guidelines: Optional[str] = None
    disclosure_requirements: Optional[str] = None
    status: Optional[str] = None
    required_skill_ids: Optional[List[str]] = None
    required_tool_ids: Optional[List[str]] = None


class BriefStatusUpdate(BaseModel):
    status: str  # DRAFT, PUBLISHED, CLOSED, CANCELLED


# ==========================================
# 7. APPLICATION & ENGAGEMENT SCHEMAS
# ==========================================

class ApplicationCreate(BaseModel):
    brief_id: Optional[str] = None
    creator_id: Optional[str] = None  # Derived from authenticated creator profile; rejected if mismatched
    pitch_text: str
    proposed_rate: float
    proposed_timeline_days: int
    attached_project_ids: List[str] = []


class ApplicationRead(BaseModel):
    id: str
    brief_id: str
    creator_id: str
    creator_display_name: Optional[str] = None
    creator_handle: Optional[str] = None
    creator_avatar_url: Optional[str] = None
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


class DeliverableRead(BaseModel):
    id: str
    engagement_id: str
    version: int
    title: str
    asset_url: str
    notes: Optional[str] = None
    submitted_by: str
    status: str
    feedback: Optional[str] = None
    submitted_at: datetime
    reviewed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DeliverableSubmissionCreate(BaseModel):
    asset_url: str = Field(..., min_length=3, description="Deliverable asset link or storage path")
    title: Optional[str] = Field("Draft Deliverable", min_length=2)
    notes: Optional[str] = None


class RevisionRequestCreate(BaseModel):
    feedback: str = Field(..., min_length=3, description="Specific revision instructions and feedback")
    revision_notes: Optional[str] = None


class EngagementReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Star rating from 1 to 5")
    review: str = Field(..., min_length=3, description="Written performance review")


class EngagementStatusUpdate(BaseModel):
    status: str  # DRAFT_SUBMITTED, REVISION_REQUESTED, FINAL_APPROVED, COMPLETED, DISPUTED
    notes: Optional[str] = None


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
    deliverables: List[DeliverableRead] = []

    class Config:
        from_attributes = True


class EngagementDetailRead(EngagementRead):
    brief_title: Optional[str] = None
    brief_slug: Optional[str] = None
    brand_company_name: Optional[str] = None
    creator_display_name: Optional[str] = None
    creator_handle: Optional[str] = None


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
    matched_skills: List[str] = []
    matched_tools: List[str] = []
    strengths: List[str] = []
    missing_requirements: List[str] = []
    compatibility_disclaimer: str = "Scores represent estimated compatibility based on declared and verified portfolio evidence, not a guarantee of outcome."
    hard_requirements_met: bool = True


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
