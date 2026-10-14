"""
Kivora Relational Data Models
Designed for FastAPI, SQLAlchemy 2.0, and SQLite (fully portable to Postgres).
"""

from datetime import datetime
from typing import List, Optional
from sqlalchemy import (
    Column,
    String,
    Text,
    Boolean,
    Integer,
    Float,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    Index,
    Enum,
    JSON,
)
from sqlalchemy.orm import relationship
from backend.app.database import Base


# ==========================================
# 1. AUTHENTICATION & USERS
# ==========================================

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="CREATOR")  # CREATOR, BRAND, ADMIN
    is_email_verified = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    creator_profile = relationship("CreatorProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    brand_profile = relationship("BrandProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")


class OtpCode(Base):
    __tablename__ = "otp_codes"

    id = Column(String(36), primary_key=True)
    email = Column(String(255), nullable=False, index=True)
    code = Column(String(10), nullable=False)
    purpose = Column(String(30), nullable=False, default="REGISTRATION")  # REGISTRATION, LOGIN, PASSWORD_RESET
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, nullable=False, default=False)
    attempts = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


# ==========================================
# 2. CREATOR PROFILES & TAXONOMY
# ==========================================

class CreatorProfile(Base):
    __tablename__ = "creator_profiles"

    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    display_name = Column(String(100), nullable=False)
    handle = Column(String(50), unique=True, nullable=False, index=True)
    bio = Column(Text, nullable=False)
    avatar_url = Column(String(500), nullable=False)
    banner_url = Column(String(500), nullable=True)
    location = Column(String(100), nullable=False)
    years_experience = Column(Integer, nullable=False, default=1)
    primary_specialization = Column(String(100), nullable=False, index=True)
    website_url = Column(String(500), nullable=True)
    min_budget = Column(Float, nullable=False, default=500.0, index=True)
    hourly_rate = Column(Float, nullable=True)
    availability_status = Column(String(30), nullable=False, default="AVAILABLE", index=True)  # AVAILABLE, BOOKED, LIMITED
    verification_tier = Column(String(30), nullable=False, default="COMMUNITY", index=True)  # UNVERIFIED, COMMUNITY, VERIFIED_PRO, TOP_STUDIO
    verified_claims_count = Column(Integer, default=0, nullable=False)
    completed_projects_count = Column(Integer, default=0, nullable=False)
    average_rating = Column(Float, default=5.0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="creator_profile")
    categories = relationship("CreatorCategory", back_populates="creator", cascade="all, delete-orphan")
    skills = relationship("CreatorSkill", back_populates="creator", cascade="all, delete-orphan")
    tools = relationship("CreatorTool", back_populates="creator", cascade="all, delete-orphan")
    portfolio_projects = relationship("PortfolioProject", back_populates="creator", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="creator", cascade="all, delete-orphan")
    engagements = relationship("Engagement", back_populates="creator", cascade="all, delete-orphan")


# ==========================================
# 2.5 CATEGORIES & MARKETPLACE TAXONOMY
# ==========================================

class Category(Base):
    __tablename__ = "categories"

    id = Column(String(60), primary_key=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    icon = Column(String(50), nullable=True, default="✨")
    display_order = Column(Integer, nullable=False, default=0)
    parent_id = Column(String(60), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)

    # Relationships
    parent = relationship("Category", remote_side=[id], back_populates="subcategories")
    subcategories = relationship("Category", back_populates="parent", cascade="all, delete-orphan")
    creator_links = relationship("CreatorCategory", back_populates="category", cascade="all, delete-orphan")
    brief_links = relationship("BriefCategory", back_populates="category", cascade="all, delete-orphan")


class CreatorCategory(Base):
    __tablename__ = "creator_categories"

    id = Column(String(60), primary_key=True)
    creator_id = Column(String(36), ForeignKey("creator_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(String(60), ForeignKey("categories.id", ondelete="CASCADE"), nullable=False, index=True)
    is_primary = Column(Boolean, nullable=False, default=False)

    __table_args__ = (
        UniqueConstraint("creator_id", "category_id", name="uq_creator_category"),
    )

    creator = relationship("CreatorProfile", back_populates="categories")
    category = relationship("Category", back_populates="creator_links")


class BriefCategory(Base):
    __tablename__ = "brief_categories"

    id = Column(String(60), primary_key=True)
    brief_id = Column(String(36), ForeignKey("briefs.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(String(60), ForeignKey("categories.id", ondelete="CASCADE"), nullable=False, index=True)
    is_primary = Column(Boolean, nullable=False, default=False)

    __table_args__ = (
        UniqueConstraint("brief_id", "category_id", name="uq_brief_category"),
    )

    brief = relationship("Brief", back_populates="categories")
    category = relationship("Category", back_populates="brief_links")


class Skill(Base):
    __tablename__ = "skills"

    id = Column(String(36), primary_key=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    category = Column(String(50), nullable=False, index=True)  # Generative Video, 3D & Synthesis, Concept Art, Audio

    # Relationships
    creator_links = relationship("CreatorSkill", back_populates="skill")
    brief_links = relationship("BriefSkill", back_populates="skill")


class CreatorSkill(Base):
    __tablename__ = "creator_skills"

    id = Column(String(36), primary_key=True)
    creator_id = Column(String(36), ForeignKey("creator_profiles.id", ondelete="CASCADE"), nullable=False)
    skill_id = Column(String(36), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    proficiency_level = Column(String(30), nullable=False, default="ADVANCED")  # INTERMEDIATE, ADVANCED, EXPERT

    __table_args__ = (
        UniqueConstraint("creator_id", "skill_id", name="uq_creator_skill"),
    )

    creator = relationship("CreatorProfile", back_populates="skills")
    skill = relationship("Skill", back_populates="creator_links")


class Tool(Base):
    __tablename__ = "tools"

    id = Column(String(36), primary_key=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    category = Column(String(50), nullable=False)  # Video Generation, Image Synthesis, ControlNet/Pipeline, Audio/LipSync
    vendor = Column(String(100), nullable=False)

    creator_links = relationship("CreatorTool", back_populates="tool")
    brief_links = relationship("BriefTool", back_populates="tool")


class CreatorTool(Base):
    __tablename__ = "creator_tools"

    id = Column(String(36), primary_key=True)
    creator_id = Column(String(36), ForeignKey("creator_profiles.id", ondelete="CASCADE"), nullable=False)
    tool_id = Column(String(36), ForeignKey("tools.id", ondelete="CASCADE"), nullable=False)
    proficiency_level = Column(String(30), nullable=False, default="ADVANCED")  # COMPETENT, ADVANCED, MASTER
    is_claim_verified = Column(Boolean, nullable=False, default=False)

    __table_args__ = (
        UniqueConstraint("creator_id", "tool_id", name="uq_creator_tool"),
    )

    creator = relationship("CreatorProfile", back_populates="tools")
    tool = relationship("Tool", back_populates="creator_links")


# ==========================================
# 3. BRAND PROFILES
# ==========================================

class BrandProfile(Base):
    __tablename__ = "brand_profiles"

    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    company_name = Column(String(150), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    industry = Column(String(100), nullable=False, index=True)
    website_url = Column(String(500), nullable=True)
    logo_url = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    company_size = Column(String(50), nullable=False, default="10-50")
    headquarters = Column(String(100), nullable=False)
    is_verified_brand = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="brand_profile")
    briefs = relationship("Brief", back_populates="brand", cascade="all, delete-orphan")


# ==========================================
# 4. PORTFOLIO, WORKFLOW & EVIDENCE
# ==========================================

class PortfolioProject(Base):
    __tablename__ = "portfolio_projects"

    id = Column(String(36), primary_key=True)
    creator_id = Column(String(36), ForeignKey("creator_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    slug = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=False)
    content_type = Column(String(50), nullable=False, index=True)  # VIDEO, ANIMATION, IMAGE, PRODUCT_VIZ, CONCEPT_ART
    primary_asset_url = Column(String(500), nullable=False)
    thumbnail_url = Column(String(500), nullable=False)
    aspect_ratio = Column(String(20), nullable=False, index=True)  # 16:9, 9:16, 1:1, 4:5, 2.39:1
    resolution = Column(String(20), nullable=False, default="4K UHD")
    duration_seconds = Column(Integer, nullable=True)
    commercial_rights_held = Column(Boolean, nullable=False, default=True)
    commercial_license_type = Column(String(100), nullable=False, default="Full Commercial Buyout")
    featured = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    creator = relationship("CreatorProfile", back_populates="portfolio_projects")
    workflow_steps = relationship("WorkflowStep", back_populates="project", cascade="all, delete-orphan", order_by="WorkflowStep.step_order")
    evidence_records = relationship("EvidenceRecord", back_populates="project", cascade="all, delete-orphan")


class WorkflowStep(Base):
    __tablename__ = "workflow_steps"

    id = Column(String(36), primary_key=True)
    project_id = Column(String(36), ForeignKey("portfolio_projects.id", ondelete="CASCADE"), nullable=False, index=True)
    step_order = Column(Integer, nullable=False)
    stage_name = Column(String(100), nullable=False)
    tools_used = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    parameters_snippet = Column(Text, nullable=True)  # JSON or parameter string
    output_sample_url = Column(String(500), nullable=True)

    project = relationship("PortfolioProject", back_populates="workflow_steps")


class EvidenceRecord(Base):
    __tablename__ = "evidence_records"

    id = Column(String(36), primary_key=True)
    project_id = Column(String(36), ForeignKey("portfolio_projects.id", ondelete="CASCADE"), nullable=False, index=True)
    evidence_type = Column(String(50), nullable=False)  # PROCESS_SCREENSHOT, INTERMEDIATE_OUTPUT, WORKFLOW_NODE_GRAPH, PROMPT_REFINEMENT_LOG, SOURCE_PROJECT_FILE
    file_url = Column(String(500), nullable=False)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    project = relationship("PortfolioProject", back_populates="evidence_records")
    verification = relationship("VerificationRecord", back_populates="evidence", uselist=False, cascade="all, delete-orphan")


class VerificationRecord(Base):
    __tablename__ = "verification_records"

    id = Column(String(36), primary_key=True)
    evidence_id = Column(String(36), ForeignKey("evidence_records.id", ondelete="CASCADE"), nullable=True, unique=True)
    target_type = Column(String(50), nullable=False)  # PORTFOLIO_PROJECT, CREATOR_TOOL, CREATOR_SKILL, WORKFLOW_STEP
    target_id = Column(String(36), nullable=False, index=True)
    verification_scope = Column(String(200), nullable=False)
    status = Column(String(30), nullable=False, default="PENDING", index=True)  # PENDING, APPROVED, REJECTED, UNVERIFIED
    reviewed_by = Column(String(100), nullable=False)
    reviewer_notes = Column(Text, nullable=False)
    reviewed_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    evidence = relationship("EvidenceRecord", back_populates="verification")
    ai_analysis = relationship("VerificationAiAnalysis", back_populates="verification_record", uselist=False, cascade="all, delete-orphan")


class VerificationAiAnalysis(Base):
    __tablename__ = "verification_ai_analyses"

    id = Column(String(36), primary_key=True)
    verification_id = Column(String(36), ForeignKey("verification_records.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    summary = Column(Text, nullable=False)
    evidence_items_detected = Column(JSON, nullable=False)   # List[str]
    missing_evidence = Column(JSON, nullable=False)          # List[str]
    potential_inconsistencies = Column(JSON, nullable=False) # List[dict]
    limitations = Column(JSON, nullable=False)               # List[str]
    analysis_status = Column(String(30), nullable=False, default="COMPLETED", index=True)  # COMPLETED, UNAVAILABLE, ERROR
    disclaimer = Column(Text, nullable=False)
    model_name = Column(String(100), nullable=False)
    analyzed_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    verification_record = relationship("VerificationRecord", back_populates="ai_analysis")


# ==========================================
# 5. CAMPAIGN BRIEFS & REQUIREMENTS
# ==========================================

class Brief(Base):
    __tablename__ = "briefs"

    id = Column(String(36), primary_key=True)
    brand_id = Column(String(36), ForeignKey("brand_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    slug = Column(String(200), unique=True, nullable=False, index=True)
    campaign_objective = Column(Text, nullable=False)
    target_audience = Column(Text, nullable=False)
    content_type = Column(String(50), nullable=False, index=True)  # VIDEO, ANIMATION, IMAGE, PRODUCT_VIZ
    creative_style_mood = Column(String(100), nullable=False, index=True)
    aspect_ratio = Column(String(20), nullable=False, index=True)
    duration_seconds_min = Column(Integer, nullable=True)
    duration_seconds_max = Column(Integer, nullable=True)
    resolution_min = Column(String(20), nullable=False, default="4K UHD")
    deliverables_description = Column(Text, nullable=False)
    revision_allowance = Column(Integer, nullable=False, default=2)
    budget_amount = Column(Float, nullable=False, index=True)
    budget_currency = Column(String(10), nullable=False, default="USD")
    deadline = Column(DateTime, nullable=False, index=True)
    commercial_use_requirements = Column(Text, nullable=False)
    usage_channels = Column(String(200), nullable=False)
    usage_duration = Column(String(100), nullable=False)
    usage_territories = Column(String(100), nullable=False)
    restrictions_and_guidelines = Column(Text, nullable=False)
    disclosure_requirements = Column(String(200), nullable=False)
    reference_asset_url = Column(String(500), nullable=True)
    status = Column(String(30), nullable=False, default="PUBLISHED", index=True)  # DRAFT, PUBLISHED, REVIEWING_APPLICATIONS, IN_PRODUCTION, COMPLETED, CANCELLED
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    brand = relationship("BrandProfile", back_populates="briefs")
    categories = relationship("BriefCategory", back_populates="brief", cascade="all, delete-orphan")
    required_skills = relationship("BriefSkill", back_populates="brief", cascade="all, delete-orphan")
    required_tools = relationship("BriefTool", back_populates="brief", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="brief", cascade="all, delete-orphan")
    engagements = relationship("Engagement", back_populates="brief", cascade="all, delete-orphan")


class BriefSkill(Base):
    __tablename__ = "brief_skills"

    id = Column(String(36), primary_key=True)
    brief_id = Column(String(36), ForeignKey("briefs.id", ondelete="CASCADE"), nullable=False)
    skill_id = Column(String(36), ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    is_required = Column(Boolean, nullable=False, default=True)

    __table_args__ = (
        UniqueConstraint("brief_id", "skill_id", name="uq_brief_skill"),
    )

    brief = relationship("Brief", back_populates="required_skills")
    skill = relationship("Skill", back_populates="brief_links")


class BriefTool(Base):
    __tablename__ = "brief_tools"

    id = Column(String(36), primary_key=True)
    brief_id = Column(String(36), ForeignKey("briefs.id", ondelete="CASCADE"), nullable=False)
    tool_id = Column(String(36), ForeignKey("tools.id", ondelete="CASCADE"), nullable=False)
    is_required = Column(Boolean, nullable=False, default=False)

    __table_args__ = (
        UniqueConstraint("brief_id", "tool_id", name="uq_brief_tool"),
    )

    brief = relationship("Brief", back_populates="required_tools")
    tool = relationship("Tool", back_populates="brief_links")


# ==========================================
# 6. APPLICATIONS & ENGAGEMENTS
# ==========================================

class Application(Base):
    __tablename__ = "applications"

    id = Column(String(36), primary_key=True)
    brief_id = Column(String(36), ForeignKey("briefs.id", ondelete="CASCADE"), nullable=False, index=True)
    creator_id = Column(String(36), ForeignKey("creator_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    pitch_text = Column(Text, nullable=False)
    proposed_rate = Column(Float, nullable=False)
    proposed_timeline_days = Column(Integer, nullable=False)
    attached_project_ids = Column(Text, nullable=False)  # JSON or comma-separated list of project IDs
    status = Column(String(30), nullable=False, default="SUBMITTED", index=True)  # SUBMITTED, UNDER_REVIEW, SHORTLISTED, ACCEPTED, REJECTED, WITHDRAWN
    submitted_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    reviewed_at = Column(DateTime, nullable=True)
    brand_feedback = Column(Text, nullable=True)

    __table_args__ = (
        UniqueConstraint("brief_id", "creator_id", name="uq_brief_creator_app"),
    )

    brief = relationship("Brief", back_populates="applications")
    creator = relationship("CreatorProfile", back_populates="applications")
    engagement = relationship("Engagement", back_populates="application", uselist=False, cascade="all, delete-orphan")


class Engagement(Base):
    __tablename__ = "engagements"

    id = Column(String(36), primary_key=True)
    brief_id = Column(String(36), ForeignKey("briefs.id", ondelete="CASCADE"), nullable=False, index=True)
    creator_id = Column(String(36), ForeignKey("creator_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), unique=True, nullable=False)
    status = Column(String(30), nullable=False, default="KICKOFF", index=True)  # KICKOFF, DRAFT_SUBMITTED, REVISION_REQUESTED, FINAL_APPROVED, COMPLETED, DISPUTED
    agreed_amount = Column(Float, nullable=False)
    start_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    completion_deadline = Column(DateTime, nullable=False)
    final_deliverable_url = Column(String(500), nullable=True)
    brand_rating = Column(Integer, nullable=True)
    brand_review = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    brief = relationship("Brief", back_populates="engagements")
    creator = relationship("CreatorProfile", back_populates="engagements")
    application = relationship("Application", back_populates="engagement")
    deliverables = relationship("EngagementDeliverable", back_populates="engagement", cascade="all, delete-orphan", order_by="EngagementDeliverable.version")
    milestones = relationship("EngagementMilestone", back_populates="engagement", cascade="all, delete-orphan", order_by="EngagementMilestone.sequence_order")
    events = relationship("EngagementEvent", back_populates="engagement", cascade="all, delete-orphan", order_by="EngagementEvent.created_at.desc()")
    reviews = relationship("EngagementReview", back_populates="engagement", cascade="all, delete-orphan")


class EngagementMilestone(Base):
    __tablename__ = "engagement_milestones"

    id = Column(String(36), primary_key=True)
    engagement_id = Column(String(36), ForeignKey("engagements.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(DateTime, nullable=True)
    status = Column(String(30), nullable=False, default="PENDING", index=True)  # PENDING, IN_PROGRESS, COMPLETED
    sequence_order = Column(Integer, nullable=False, default=1)
    responsible_party = Column(String(30), nullable=False, default="CREATOR")  # CREATOR, BRAND
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    engagement = relationship("Engagement", back_populates="milestones")
    deliverables = relationship("EngagementDeliverable", back_populates="milestone")


class EngagementDeliverable(Base):
    __tablename__ = "engagement_deliverables"

    id = Column(String(36), primary_key=True)
    engagement_id = Column(String(36), ForeignKey("engagements.id", ondelete="CASCADE"), nullable=False, index=True)
    version = Column(Integer, nullable=False, default=1)
    title = Column(String(200), nullable=False)
    asset_url = Column(String(500), nullable=False)
    notes = Column(Text, nullable=True)
    submitted_by = Column(String(36), nullable=False)  # creator_id
    status = Column(String(30), nullable=False, default="SUBMITTED")  # SUBMITTED, REVISION_REQUESTED, APPROVED
    feedback = Column(Text, nullable=True)
    file_storage_key = Column(String(500), nullable=True)
    original_filename = Column(String(255), nullable=True)
    file_size_bytes = Column(Integer, nullable=True)
    content_type = Column(String(100), nullable=True)
    sha256_checksum = Column(String(64), nullable=True)
    milestone_id = Column(String(36), ForeignKey("engagement_milestones.id", ondelete="SET NULL"), nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    reviewed_at = Column(DateTime, nullable=True)

    engagement = relationship("Engagement", back_populates="deliverables")
    milestone = relationship("EngagementMilestone", back_populates="deliverables")
    ai_analyses = relationship("DeliverableAiAnalysis", back_populates="deliverable", cascade="all, delete-orphan", order_by="DeliverableAiAnalysis.created_at.desc()")


class EngagementEvent(Base):
    __tablename__ = "engagement_events"

    id = Column(String(36), primary_key=True)
    engagement_id = Column(String(36), ForeignKey("engagements.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(50), nullable=False, index=True)  # ENGAGEMENT_CREATED, MILESTONE_CREATED, MILESTONE_UPDATED, DELIVERABLE_SUBMITTED, REVISION_REQUESTED, DELIVERABLE_APPROVED, ENGAGEMENT_COMPLETED, REVIEW_SUBMITTED
    actor_id = Column(String(36), nullable=False)
    actor_role = Column(String(20), nullable=False)  # CREATOR, BRAND, SYSTEM
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    event_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    engagement = relationship("Engagement", back_populates="events")


class DeliverableAiAnalysis(Base):
    __tablename__ = "deliverable_ai_analyses"

    id = Column(String(36), primary_key=True)
    deliverable_id = Column(String(36), ForeignKey("engagement_deliverables.id", ondelete="CASCADE"), nullable=False, index=True)
    version = Column(Integer, nullable=False)
    brief_coverage_score = Column(Float, nullable=False)
    summary = Column(Text, nullable=False)
    requirement_coverage = Column(JSON, nullable=False)
    potential_omissions = Column(JSON, nullable=False)
    consistency_notes = Column(JSON, nullable=False)
    quality_observations = Column(JSON, nullable=False)
    suggested_questions = Column(JSON, nullable=False)
    recommended_checks = Column(JSON, nullable=False)
    model_name = Column(String(100), nullable=False)
    analysis_status = Column(String(30), nullable=False, default="COMPLETED")
    disclaimer = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    deliverable = relationship("EngagementDeliverable", back_populates="ai_analyses")


class EngagementReview(Base):
    __tablename__ = "engagement_reviews"

    id = Column(String(36), primary_key=True)
    engagement_id = Column(String(36), ForeignKey("engagements.id", ondelete="CASCADE"), nullable=False, index=True)
    reviewer_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    reviewer_role = Column(String(20), nullable=False)  # BRAND, CREATOR
    reviewee_id = Column(String(36), nullable=False, index=True)
    reviewee_role = Column(String(20), nullable=False)  # CREATOR, BRAND
    rating = Column(Float, nullable=False)
    review_text = Column(Text, nullable=True)
    communication_rating = Column(Float, nullable=True)
    quality_rating = Column(Float, nullable=True)
    timeliness_rating = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("engagement_id", "reviewer_id", name="uq_engagement_reviewer"),
    )

    engagement = relationship("Engagement", back_populates="reviews")
    reviewer = relationship("User")



# ==========================================
# 7. PHASE 2: NOTIFICATIONS
# ==========================================

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(50), nullable=False, index=True)  # APPLICATION_RECEIVED, APPLICATION_ACCEPTED, INVITATION_RECEIVED, DELIVERABLE_SUBMITTED, etc.
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    resource_type = Column(String(50), nullable=True)  # brief, engagement, conversation, application, creator
    resource_id = Column(String(36), nullable=True)
    link_url = Column(String(250), nullable=True)
    is_read = Column(Boolean, nullable=False, default=False, index=True)
    read_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    __table_args__ = (
        Index("ix_notifications_user_read", "user_id", "is_read"),
    )

    user = relationship("User", backref="notifications")


# ==========================================
# 8. PHASE 2: MESSAGING & CONVERSATIONS
# ==========================================

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String(36), primary_key=True)
    engagement_id = Column(String(36), ForeignKey("engagements.id", ondelete="CASCADE"), nullable=True, index=True)
    brief_id = Column(String(36), ForeignKey("briefs.id", ondelete="CASCADE"), nullable=True, index=True)
    brand_id = Column(String(36), ForeignKey("brand_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    creator_id = Column(String(36), ForeignKey("creator_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False, index=True)

    __table_args__ = (
        Index("ix_conversations_participants", "brand_id", "creator_id"),
    )

    engagement = relationship("Engagement", backref="conversations")
    brief = relationship("Brief", backref="conversations")
    brand = relationship("BrandProfile", backref="conversations")
    creator = relationship("CreatorProfile", backref="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at, Message.id")


class Message(Base):
    __tablename__ = "messages"

    id = Column(String(36), primary_key=True)
    conversation_id = Column(String(36), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, nullable=False, default=False, index=True)
    read_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User", backref="sent_messages")


# ==========================================
# 9. PHASE 2: SAVED ITEMS (BOOKMARKS)
# ==========================================

class SavedCreator(Base):
    __tablename__ = "saved_creators"

    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    creator_id = Column(String(36), ForeignKey("creator_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "creator_id", name="uq_user_saved_creator"),
    )

    user = relationship("User", backref="saved_creators")
    creator = relationship("CreatorProfile", backref="saved_by_users")


class SavedBrief(Base):
    __tablename__ = "saved_briefs"

    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    brief_id = Column(String(36), ForeignKey("briefs.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "brief_id", name="uq_user_saved_brief"),
    )

    user = relationship("User", backref="saved_briefs")
    brief = relationship("Brief", backref="saved_by_users")


# ==========================================
# 10. PHASE 2: SMART OPPORTUNITY ALERTS
# ==========================================

class AlertPreference(Base):
    __tablename__ = "alert_preferences"

    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    is_enabled = Column(Boolean, nullable=False, default=True)
    min_budget = Column(Float, nullable=True)
    preferred_categories = Column(JSON, nullable=True)       # List[str] slugs or IDs
    preferred_content_types = Column(JSON, nullable=True)    # List[str] VIDEO, IMAGE, etc.
    email_alerts_enabled = Column(Boolean, nullable=False, default=True)
    in_app_alerts_enabled = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", backref="alert_preference", uselist=False)


class OpportunityAlertRecord(Base):
    __tablename__ = "opportunity_alerts"

    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    brief_id = Column(String(36), ForeignKey("briefs.id", ondelete="CASCADE"), nullable=False, index=True)
    match_score = Column(Float, nullable=False)
    match_reasons = Column(JSON, nullable=False)  # List[str]
    is_viewed = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    __table_args__ = (
        UniqueConstraint("user_id", "brief_id", name="uq_user_brief_alert"),
    )

    user = relationship("User", backref="opportunity_alerts")
    brief = relationship("Brief", backref="opportunity_alerts")

