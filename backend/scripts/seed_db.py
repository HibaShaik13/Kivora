"""
Kivora Idempotent & Non-Destructive Database Seeder
Seeds standard demo records for hackathon evaluation while strictly preserving
all newly registered real users, their profiles, portfolios, briefs, and applications.
Uses real bcrypt password hashes for all demo users.
"""

import os
import sys
import json
import logging
from pathlib import Path
from datetime import datetime

# Set up path so imports work when running from project root
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.app.database import engine, SessionLocal, Base
from backend.app.core.security import hash_password
from backend.app.models.models import (
    User,
    OtpCode,
    CreatorProfile,
    Skill,
    CreatorSkill,
    Tool,
    CreatorTool,
    BrandProfile,
    PortfolioProject,
    WorkflowStep,
    EvidenceRecord,
    VerificationRecord,
    VerificationAiAnalysis,
    Brief,
    BriefSkill,
    BriefTool,
    Application,
    Engagement,
    EngagementDeliverable,
)


logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("seed_db")

DEMO_DEFAULT_PASSWORD = "Password123!"


def parse_dt(dt_str):
    if not dt_str:
        return None
    return datetime.fromisoformat(dt_str)


def seed_database():
    env = os.getenv("KIVORA_ENV", os.getenv("ENV", "development")).lower()
    if env in ["production", "prod"]:
        logger.warning("SECURITY ABORT: seed_db.py cannot execute against production databases.")
        return

    seed_file = Path("backend/app/data/seed_data.json")
    if not seed_file.exists():
        logger.error(f"Seed file not found at {seed_file}")
        sys.exit(1)

    with open(seed_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Ensure all tables exist without dropping existing data
    logger.info("Verifying/creating database tables (non-destructive)...")
    Base.metadata.create_all(bind=engine)

    session = SessionLocal()
    demo_hashed_pwd = hash_password(DEMO_DEFAULT_PASSWORD)

    try:
        # 1. SKILLS
        for s in data["skills"]:
            existing = session.query(Skill).filter(Skill.id == s["id"]).first()
            if not existing:
                session.add(Skill(id=s["id"], name=s["name"], category=s["category"]))
        session.flush()

        # 2. TOOLS
        for t in data["tools"]:
            existing = session.query(Tool).filter(Tool.id == t["id"]).first()
            if not existing:
                session.add(Tool(id=t["id"], name=t["name"], category=t["category"], vendor=t["vendor"]))
        session.flush()

        # 3. CREATORS & DEMO USERS
        for c in data["creators"]:
            # User
            u = session.query(User).filter(User.id == c["user_id"]).first()
            if not u:
                u = User(
                    id=c["user_id"],
                    email=c["email"],
                    hashed_password=demo_hashed_pwd,
                    role="CREATOR",
                    is_email_verified=True,
                    created_at=datetime.utcnow()
                )
                session.add(u)
                session.flush()
            elif u.hashed_password.startswith("demo_"):
                u.hashed_password = demo_hashed_pwd

            # Creator Profile
            cp = session.query(CreatorProfile).filter(CreatorProfile.id == c["creator_id"]).first()
            if not cp:
                cp = CreatorProfile(
                    id=c["creator_id"],
                    user_id=c["user_id"],
                    display_name=c["display_name"],
                    handle=c["handle"],
                    bio=c["bio"],
                    avatar_url=c["avatar_url"],
                    banner_url=c.get("banner_url"),
                    location=c["location"],
                    years_experience=c["years_experience"],
                    primary_specialization=c["primary_specialization"],
                    website_url=c.get("website_url"),
                    min_budget=c["min_budget"],
                    hourly_rate=c.get("hourly_rate"),
                    availability_status=c["availability_status"],
                    verification_tier=c["verification_tier"],
                    verified_claims_count=c["verified_claims_count"],
                    completed_projects_count=c["completed_projects_count"],
                    average_rating=c["average_rating"]
                )
                session.add(cp)
                session.flush()

            # Skills
            for sk_id, prof in c.get("skills", []):
                cs_id = f"cs-{c['creator_id']}-{sk_id}"
                if not session.query(CreatorSkill).filter(CreatorSkill.id == cs_id).first():
                    session.add(CreatorSkill(id=cs_id, creator_id=c["creator_id"], skill_id=sk_id, proficiency_level=prof))

            # Tools
            for tl_id, prof, ver in c.get("tools", []):
                ct_id = f"ct-{c['creator_id']}-{tl_id}"
                if not session.query(CreatorTool).filter(CreatorTool.id == ct_id).first():
                    session.add(CreatorTool(id=ct_id, creator_id=c["creator_id"], tool_id=tl_id, proficiency_level=prof, is_claim_verified=ver))
        session.flush()

        # 4. BRANDS & DEMO USERS
        for b in data["brands"]:
            u = session.query(User).filter(User.id == b["user_id"]).first()
            if not u:
                u = User(
                    id=b["user_id"],
                    email=b["email"],
                    hashed_password=demo_hashed_pwd,
                    role="BRAND",
                    is_email_verified=True,
                    created_at=datetime.utcnow()
                )
                session.add(u)
                session.flush()
            elif u.hashed_password.startswith("demo_"):
                u.hashed_password = demo_hashed_pwd

            bp = session.query(BrandProfile).filter(BrandProfile.id == b["brand_id"]).first()
            if not bp:
                bp = BrandProfile(
                    id=b["brand_id"],
                    user_id=b["user_id"],
                    company_name=b["company_name"],
                    slug=b["slug"],
                    industry=b["industry"],
                    website_url=b.get("website_url"),
                    logo_url=b["logo_url"],
                    description=b["description"],
                    company_size=b["company_size"],
                    headquarters=b["headquarters"],
                    is_verified_brand=b["is_verified_brand"]
                )
                session.add(bp)
        session.flush()

        # 5. BRIEFS
        for br in data["briefs"]:
            brief = session.query(Brief).filter(Brief.id == br["id"]).first()
            if not brief:
                brief = Brief(
                    id=br["id"],
                    brand_id=br["brand_id"],
                    title=br["title"],
                    slug=br["slug"],
                    campaign_objective=br["campaign_objective"],
                    target_audience=br["target_audience"],
                    content_type=br["content_type"],
                    creative_style_mood=br["creative_style_mood"],
                    aspect_ratio=br["aspect_ratio"],
                    duration_seconds_min=br.get("duration_seconds_min"),
                    duration_seconds_max=br.get("duration_seconds_max"),
                    resolution_min=br["resolution_min"],
                    deliverables_description=br["deliverables_description"],
                    revision_allowance=br["revision_allowance"],
                    budget_amount=br["budget_amount"],
                    budget_currency=br["budget_currency"],
                    deadline=parse_dt(br["deadline"]),
                    commercial_use_requirements=br["commercial_use_requirements"],
                    usage_channels=br["usage_channels"],
                    usage_duration=br["usage_duration"],
                    usage_territories=br["usage_territories"],
                    restrictions_and_guidelines=br["restrictions_and_guidelines"],
                    disclosure_requirements=br["disclosure_requirements"],
                    status=br["status"]
                )
                session.add(brief)
                session.flush()

                for sk_id, req in br.get("required_skills", []):
                    bs_id = f"bs-{br['id']}-{sk_id}"
                    if not session.query(BriefSkill).filter(BriefSkill.id == bs_id).first():
                        session.add(BriefSkill(id=bs_id, brief_id=br["id"], skill_id=sk_id, is_required=req))

                for tl_id, req in br.get("required_tools", []):
                    bt_id = f"bt-{br['id']}-{tl_id}"
                    if not session.query(BriefTool).filter(BriefTool.id == bt_id).first():
                        session.add(BriefTool(id=bt_id, brief_id=br["id"], tool_id=tl_id, is_required=req))
        session.flush()

        # 6. PORTFOLIOS, WORKFLOWS & EVIDENCE
        for p in data["portfolios"]:
            proj = session.query(PortfolioProject).filter(PortfolioProject.id == p["id"]).first()
            if not proj:
                proj = PortfolioProject(
                    id=p["id"],
                    creator_id=p["creator_id"],
                    title=p["title"],
                    slug=p["slug"],
                    description=p["description"],
                    content_type=p["content_type"],
                    primary_asset_url=p["primary_asset_url"],
                    thumbnail_url=p["thumbnail_url"],
                    aspect_ratio=p["aspect_ratio"],
                    resolution=p["resolution"],
                    duration_seconds=p.get("duration_seconds"),
                    commercial_rights_held=p["commercial_rights_held"],
                    commercial_license_type=p["commercial_license_type"],
                    featured=p.get("featured", False),
                    created_at=parse_dt(p["created_at"])
                )
                session.add(proj)
                session.flush()

                for ws in p.get("workflow_steps", []):
                    ws_id = f"ws-{p['id']}-step-{ws['step_order']}"
                    if not session.query(WorkflowStep).filter(WorkflowStep.id == ws_id).first():
                        session.add(WorkflowStep(
                            id=ws_id,
                            project_id=p["id"],
                            step_order=ws["step_order"],
                            stage_name=ws["stage_name"],
                            tools_used=ws["tools_used"],
                            description=ws["description"],
                            parameters_snippet=ws.get("parameters_snippet"),
                            output_sample_url=ws.get("output_sample_url")
                        ))

                for ev in p.get("evidence_records", []):
                    ev_rec = session.query(EvidenceRecord).filter(EvidenceRecord.id == ev["id"]).first()
                    if not ev_rec:
                        ev_rec = EvidenceRecord(
                            id=ev["id"],
                            project_id=p["id"],
                            evidence_type=ev["evidence_type"],
                            file_url=ev["file_url"],
                            title=ev["title"],
                            description=ev["description"],
                            uploaded_at=datetime.utcnow()
                        )
                        session.add(ev_rec)
                        session.flush()

                        if "verification" in ev:
                            ver_data = ev["verification"]
                            ver_id = ver_data["id"]
                            if not session.query(VerificationRecord).filter(VerificationRecord.id == ver_id).first():
                                session.add(VerificationRecord(
                                    id=ver_id,
                                    evidence_id=ev["id"],
                                    target_type=ver_data["target_type"],
                                    target_id=p["id"] if ver_data["target_type"] == "PORTFOLIO_PROJECT" else p["creator_id"],
                                    verification_scope=ver_data["verification_scope"],
                                    status=ver_data["status"],
                                    reviewed_by=ver_data["reviewed_by"],
                                    reviewer_notes=ver_data["reviewer_notes"],
                                    reviewed_at=datetime.utcnow()
                                ))
        session.flush()

        # 7. APPLICATIONS
        for app in data["applications"]:
            if not session.query(Application).filter(Application.id == app["id"]).first():
                session.add(Application(
                    id=app["id"],
                    brief_id=app["brief_id"],
                    creator_id=app["creator_id"],
                    pitch_text=app["pitch_text"],
                    proposed_rate=app["proposed_rate"],
                    proposed_timeline_days=app["proposed_timeline_days"],
                    attached_project_ids=app["attached_project_ids"],
                    status=app["status"],
                    submitted_at=parse_dt(app["submitted_at"]),
                    reviewed_at=parse_dt(app.get("reviewed_at")),
                    brand_feedback=app.get("brand_feedback")
                ))
        session.flush()

        # 8. ENGAGEMENTS
        for eng in data["engagements"]:
            if not session.query(Engagement).filter(Engagement.id == eng["id"]).first():
                session.add(Engagement(
                    id=eng["id"],
                    brief_id=eng["brief_id"],
                    creator_id=eng["creator_id"],
                    application_id=eng["application_id"],
                    status=eng["status"],
                    agreed_amount=eng["agreed_amount"],
                    start_date=parse_dt(eng["start_date"]),
                    completion_deadline=parse_dt(eng["completion_deadline"]),
                    final_deliverable_url=eng.get("final_deliverable_url"),
                    brand_rating=eng.get("brand_rating"),
                    brand_review=eng.get("brand_review"),
                    created_at=parse_dt(eng["created_at"]),
                    updated_at=parse_dt(eng["updated_at"])
                ))

        session.commit()
        logger.info("Successfully verified/seeded all Kivora demo records in kivora.db (real users preserved).")

    except Exception as e:
        session.rollback()
        logger.exception(f"Error during seeding: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    seed_database()
