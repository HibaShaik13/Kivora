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
    skills = relationship("CreatorSkill", back_populates="creator", cascade="all, delete-orphan")
    tools = relationship("CreatorTool", back_populates="creator", cascade="all, delete-orphan")
    portfolio_projects = relationship("PortfolioProject", back_populates="creator", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="creator", cascade="all, delete-orphan")
    engagements = relationship("Engagement", back_populates="creator", cascade="all, delete-orphan")


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

    id = Column(String(100), primary_key=True)
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

    id = Column(String(100), primary_key=True)
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
    creative_style_mood = Column(String(255), nullable=False)
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
    status = Column(String(30), nullable=False, default="PUBLISHED", index=True)  # DRAFT, PUBLISHED, REVIEWING_APPLICATIONS, IN_PRODUCTION, COMPLETED, CANCELLED
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    brand = relationship("BrandProfile", back_populates="briefs")
    required_skills = relationship("BriefSkill", back_populates="brief", cascade="all, delete-orphan")
    required_tools = relationship("BriefTool", back_populates="brief", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="brief", cascade="all, delete-orphan")
    engagements = relationship("Engagement", back_populates="brief", cascade="all, delete-orphan")


class BriefSkill(Base):
    __tablename__ = "brief_skills"

    id = Column(String(100), primary_key=True)
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

    id = Column(String(100), primary_key=True)
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
    submitted_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    reviewed_at = Column(DateTime, nullable=True)

    engagement = relationship("Engagement", back_populates="deliverables")

