"""
Kivora FastAPI Application
Main entrypoint initializing REST routes, CORS middleware, and system health checks.
"""

import os
from pathlib import Path
import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import backend.app.core.config  # Ensures .env is loaded
from backend.app.api import auth, creators, brands, briefs, matching, ai, taxonomy, media, verification, engagements
from backend.app.core.config import CORS_ORIGINS

app = FastAPI(
    title="Kivora API",
    description="The AI Content Creator Marketplace — ByteXL HacXLerate 2026",
    version="1.0.0"
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logging.getLogger("uvicorn.error").exception(f"Unhandled exception on {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"}
    )


# Enable CORS for configured frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS if CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure configurable upload directory exists and mount static serving
UPLOAD_DIR = Path(os.getenv("KIVORA_UPLOAD_DIR", "uploads"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

PUBLIC_ASSETS_DIR = Path(__file__).resolve().parent.parent.parent / "frontend" / "public" / "assets"
if PUBLIC_ASSETS_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(PUBLIC_ASSETS_DIR)), name="assets")

# Mount API Routers
app.include_router(auth.router)
app.include_router(creators.router)
app.include_router(brands.router)
app.include_router(briefs.router)
app.include_router(matching.router)
app.include_router(engagements.router)
app.include_router(ai.router)
app.include_router(taxonomy.router)
app.include_router(media.router)
app.include_router(verification.router)


@app.on_event("startup")
def on_startup():
    """Ensure database schema and baseline catalog exist on application boot."""
    try:
        from backend.app.database import engine, Base, SessionLocal
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
        from backend.app.core.security import hash_password
        import json
        from datetime import datetime

        # 1. Ensure all database tables exist (PostgreSQL / SQLite)
        Base.metadata.create_all(bind=engine)

        # 2. Check if catalog needs baseline seeding
        db = SessionLocal()
        try:
            creator_count = db.query(CreatorProfile).count()
            if creator_count == 0:
                seed_file = Path(__file__).resolve().parent / "data" / "seed_data.json"
                if seed_file.exists():
                    with open(seed_file, "r", encoding="utf-8") as f:
                        data = json.load(f)

                    def parse_dt(dt_str):
                        return datetime.fromisoformat(dt_str) if dt_str else None

                    demo_hashed_pwd = hash_password("Password123!")

                    # Skills
                    for s in data.get("skills", []):
                        if not db.query(Skill).filter(Skill.id == s["id"]).first():
                            db.add(Skill(id=s["id"], name=s["name"], category=s.get("category", "General")))
                    db.flush()

                    # Tools
                    for t in data.get("tools", []):
                        if not db.query(Tool).filter(Tool.id == t["id"]).first():
                            db.add(Tool(id=t["id"], name=t["name"], category=t.get("category", "General"), vendor=t.get("vendor", "Generative AI")))
                    db.flush()

                    # Creators & Demo Users
                    for c in data.get("creators", []):
                        if not db.query(User).filter(User.id == c["user_id"]).first():
                            db.add(User(
                                id=c["user_id"],
                                email=c["email"],
                                hashed_password=demo_hashed_pwd,
                                role="CREATOR",
                                is_email_verified=True,
                                created_at=datetime.utcnow()
                            ))
                            db.flush()

                        if not db.query(CreatorProfile).filter(CreatorProfile.id == c["creator_id"]).first():
                            db.add(CreatorProfile(
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
                            ))
                            db.flush()

                        for sk_id, prof in c.get("skills", []):
                            cs_id = f"cs-{c['creator_id']}-{sk_id}"
                            if not db.query(CreatorSkill).filter(CreatorSkill.id == cs_id).first():
                                db.add(CreatorSkill(id=cs_id, creator_id=c["creator_id"], skill_id=sk_id, proficiency_level=prof))

                        for tl_id, prof, ver in c.get("tools", []):
                            ct_id = f"ct-{c['creator_id']}-{tl_id}"
                            if not db.query(CreatorTool).filter(CreatorTool.id == ct_id).first():
                                db.add(CreatorTool(id=ct_id, creator_id=c["creator_id"], tool_id=tl_id, proficiency_level=prof, is_claim_verified=ver))
                    db.flush()

                    # Brands & Demo Users
                    for b in data.get("brands", []):
                        if not db.query(User).filter(User.id == b["user_id"]).first():
                            db.add(User(
                                id=b["user_id"],
                                email=b["email"],
                                hashed_password=demo_hashed_pwd,
                                role="BRAND",
                                is_email_verified=True,
                                created_at=datetime.utcnow()
                            ))
                            db.flush()

                        if not db.query(BrandProfile).filter(BrandProfile.id == b["brand_id"]).first():
                            db.add(BrandProfile(
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
                            ))
                    db.flush()

                    # Briefs
                    for br in data.get("briefs", []):
                        if not db.query(Brief).filter(Brief.id == br["id"]).first():
                            db.add(Brief(
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
                            ))
                            db.flush()

                            for sk_id, req in br.get("required_skills", []):
                                bs_id = f"bs-{br['id']}-{sk_id}"
                                if not db.query(BriefSkill).filter(BriefSkill.id == bs_id).first():
                                    db.add(BriefSkill(id=bs_id, brief_id=br["id"], skill_id=sk_id, is_required=req))

                            for tl_id, req in br.get("required_tools", []):
                                bt_id = f"bt-{br['id']}-{tl_id}"
                                if not db.query(BriefTool).filter(BriefTool.id == bt_id).first():
                                    db.add(BriefTool(id=bt_id, brief_id=br["id"], tool_id=tl_id, is_required=req))
                    db.flush()

                    # Portfolios & Evidence
                    for p in data.get("portfolios", []):
                        if not db.query(PortfolioProject).filter(PortfolioProject.id == p["id"]).first():
                            db.add(PortfolioProject(
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
                            ))
                            db.flush()

                            for ws in p.get("workflow_steps", []):
                                ws_id = f"ws-{p['id']}-step-{ws['step_order']}"
                                if not db.query(WorkflowStep).filter(WorkflowStep.id == ws_id).first():
                                    db.add(WorkflowStep(
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
                                if not db.query(EvidenceRecord).filter(EvidenceRecord.id == ev["id"]).first():
                                    db.add(EvidenceRecord(
                                        id=ev["id"],
                                        project_id=p["id"],
                                        evidence_type=ev["evidence_type"],
                                        file_url=ev["file_url"],
                                        title=ev["title"],
                                        description=ev["description"],
                                        uploaded_at=datetime.utcnow()
                                    ))
                                    db.flush()

                                    if "verification" in ev:
                                        ver_data = ev["verification"]
                                        ver_id = ver_data["id"]
                                        if not db.query(VerificationRecord).filter(VerificationRecord.id == ver_id).first():
                                            db.add(VerificationRecord(
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
                    db.flush()

                    # Applications & Engagements
                    for app_item in data.get("applications", []):
                        if not db.query(Application).filter(Application.id == app_item["id"]).first():
                            db.add(Application(
                                id=app_item["id"],
                                brief_id=app_item["brief_id"],
                                creator_id=app_item["creator_id"],
                                pitch_text=app_item["pitch_text"],
                                proposed_rate=app_item["proposed_rate"],
                                proposed_timeline_days=app_item["proposed_timeline_days"],
                                attached_project_ids=app_item["attached_project_ids"],
                                status=app_item["status"],
                                submitted_at=parse_dt(app_item["submitted_at"]),
                                reviewed_at=parse_dt(app_item.get("reviewed_at")),
                                brand_feedback=app_item.get("brand_feedback")
                            ))
                    db.flush()

                    for eng in data.get("engagements", []):
                        if not db.query(Engagement).filter(Engagement.id == eng["id"]).first():
                            db.add(Engagement(
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

                    db.commit()

            # 3. Always ensure canonical admin accounts exist for hackathon evaluation
            demo_hashed_pwd = hash_password("Password123!")
            for admin_email in ["admin@kivora.internal", "admin@kivora.demo"]:
                admin_user = db.query(User).filter(User.email == admin_email).first()
                if not admin_user:
                    db.add(User(
                        id=f"user-admin-{admin_email.split('@')[0]}",
                        email=admin_email,
                        hashed_password=demo_hashed_pwd,
                        role="ADMIN",
                        is_email_verified=True,
                        created_at=datetime.utcnow()
                    ))
                else:
                    admin_user.hashed_password = demo_hashed_pwd
                    admin_user.role = "ADMIN"
                    admin_user.is_email_verified = True
            db.commit()
        except Exception as err:
            db.rollback()
            import logging
            logging.getLogger("uvicorn.error").error(f"Catalog initialization error: {err}")
        finally:
            db.close()
    except Exception as e:
        import logging
        logging.getLogger("uvicorn.error").error(f"Startup DB initialization error: {e}")


@app.get("/")
def root():
    return {
        "service": "Kivora Marketplace API",
        "version": "1.0.0",
        "status": "online",
        "docs_url": "/docs"
    }


@app.get("/api/health")
def health_check():
    db_status = "connected"
    try:
        from backend.app.database import engine
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {type(e).__name__}"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "environment": os.getenv("KIVORA_ENV", "development"),
        "database": db_status
    }
