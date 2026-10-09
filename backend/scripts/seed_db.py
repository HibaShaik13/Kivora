"""
Kivora Database Seeding Script
Populates SQLite with relational seed data from backend/app/data/seed_data.json.
Guarantees reproducible, idempotent execution with foreign key integrity.
"""

import sys
import json
import logging
from pathlib import Path
from datetime import datetime

# Set up path so imports work when running from project root
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.app.database import engine, SessionLocal, Base
from backend.app.models.models import (
    User,
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
    Brief,
    BriefSkill,
    BriefTool,
    Application,
    Engagement,
)

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("seed_db")


def parse_dt(dt_str):
    if not dt_str:
        return None
    return datetime.fromisoformat(dt_str)


def seed_database():
    seed_file = Path("backend/app/data/seed_data.json")
    if not seed_file.exists():
        logger.error(f"Seed file not found at {seed_file}")
        sys.exit(1)

    with open(seed_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    logger.info("Dropping and re-creating all tables in kivora.db...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    session = SessionLocal()
    try:
        # 1. SKILLS
        logger.info(f"Seeding {len(data['skills'])} skills...")
        for s in data["skills"]:
            skill = Skill(
                id=s["id"],
                name=s["name"],
                category=s["category"]
            )
            session.add(skill)
        session.flush()

        # 2. TOOLS
        logger.info(f"Seeding {len(data['tools'])} tools...")
        for t in data["tools"]:
            tool = Tool(
                id=t["id"],
                name=t["name"],
                category=t["category"],
                vendor=t["vendor"]
            )
            session.add(tool)
        session.flush()

        # 3. CREATORS & USERS
        logger.info(f"Seeding {len(data['creators'])} creators & users...")
        for c in data["creators"]:
            user = User(
                id=c["user_id"],
                email=c["email"],
                hashed_password="demo_argon2_hashed_secret_for_testing",
                role="CREATOR",
                is_email_verified=True,
                created_at=datetime.utcnow()
            )
            session.add(user)
            session.flush()

            creator = CreatorProfile(
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
            session.add(creator)
            session.flush()

            # Creator skills
            for sk_id, prof in c.get("skills", []):
                cs = CreatorSkill(
                    id=f"cs-{c['creator_id']}-{sk_id}",
                    creator_id=c["creator_id"],
                    skill_id=sk_id,
                    proficiency_level=prof
                )
                session.add(cs)

            # Creator tools
            for tl_id, prof, ver in c.get("tools", []):
                ct = CreatorTool(
                    id=f"ct-{c['creator_id']}-{tl_id}",
                    creator_id=c["creator_id"],
                    tool_id=tl_id,
                    proficiency_level=prof,
                    is_claim_verified=ver
                )
                session.add(ct)
        session.flush()

        # 4. BRANDS & USERS
        logger.info(f"Seeding {len(data['brands'])} brands & users...")
        for b in data["brands"]:
            user = User(
                id=b["user_id"],
                email=b["email"],
                hashed_password="demo_argon2_hashed_secret_for_testing",
                role="BRAND",
                is_email_verified=True,
                created_at=datetime.utcnow()
            )
            session.add(user)
            session.flush()

            brand = BrandProfile(
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
            session.add(brand)
        session.flush()

        # 5. BRIEFS
        logger.info(f"Seeding {len(data['briefs'])} campaign briefs...")
        for br in data["briefs"]:
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
                bs = BriefSkill(
                    id=f"bs-{br['id']}-{sk_id}",
                    brief_id=br["id"],
                    skill_id=sk_id,
                    is_required=req
                )
                session.add(bs)

            for tl_id, req in br.get("required_tools", []):
                bt = BriefTool(
                    id=f"bt-{br['id']}-{tl_id}",
                    brief_id=br["id"],
                    tool_id=tl_id,
                    is_required=req
                )
                session.add(bt)
        session.flush()

        # 6. PORTFOLIOS, WORKFLOWS & EVIDENCE
        logger.info(f"Seeding {len(data['portfolios'])} portfolio deep-dives...")
        for p in data["portfolios"]:
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

            # Workflow steps
            for ws in p.get("workflow_steps", []):
                step = WorkflowStep(
                    id=f"ws-{p['id']}-step-{ws['step_order']}",
                    project_id=p["id"],
                    step_order=ws["step_order"],
                    stage_name=ws["stage_name"],
                    tools_used=ws["tools_used"],
                    description=ws["description"],
                    parameters_snippet=ws.get("parameters_snippet"),
                    output_sample_url=ws.get("output_sample_url")
                )
                session.add(step)

            # Evidence records & Verifications
            for ev in p.get("evidence_records", []):
                evidence = EvidenceRecord(
                    id=ev["id"],
                    project_id=p["id"],
                    evidence_type=ev["evidence_type"],
                    file_url=ev["file_url"],
                    title=ev["title"],
                    description=ev["description"],
                    uploaded_at=datetime.utcnow()
                )
                session.add(evidence)
                session.flush()

                if "verification" in ev:
                    ver_data = ev["verification"]
                    ver = VerificationRecord(
                        id=ver_data["id"],
                        evidence_id=ev["id"],
                        target_type=ver_data["target_type"],
                        target_id=p["id"] if ver_data["target_type"] == "PORTFOLIO_PROJECT" else p["creator_id"],
                        verification_scope=ver_data["verification_scope"],
                        status=ver_data["status"],
                        reviewed_by=ver_data["reviewed_by"],
                        reviewer_notes=ver_data["reviewer_notes"],
                        reviewed_at=datetime.utcnow()
                    )
                    session.add(ver)
        session.flush()

        # 7. APPLICATIONS
        logger.info(f"Seeding {len(data['applications'])} applications...")
        for app in data["applications"]:
            application = Application(
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
            )
            session.add(application)
        session.flush()

        # 8. ENGAGEMENTS
        logger.info(f"Seeding {len(data['engagements'])} production engagements...")
        for eng in data["engagements"]:
            engagement = Engagement(
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
            )
            session.add(engagement)

        session.commit()
        logger.info("Successfully seeded all Kivora tables into kivora.db!")

    except Exception as e:
        session.rollback()
        logger.exception(f"Error during seeding: {e}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    seed_database()
