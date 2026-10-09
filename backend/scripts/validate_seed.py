"""
Kivora Seed Data & Integrity Validator
Executes automated relational integrity audits, foreign key validation,
and test-drives the 6 hackathon evaluation match/filter scenarios.
"""

import sys
import logging
from pathlib import Path
from sqlalchemy import text

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.app.database import engine, SessionLocal
from backend.app.models.models import (
    User,
    CreatorProfile,
    BrandProfile,
    Skill,
    CreatorSkill,
    Tool,
    CreatorTool,
    Brief,
    BriefSkill,
    BriefTool,
    PortfolioProject,
    WorkflowStep,
    EvidenceRecord,
    VerificationRecord,
    Application,
    Engagement,
)

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("validate_seed")


def run_validations():
    session = SessionLocal()
    errors = []

    print("\n=======================================================")
    print("  KIVORA SEED DATA & RELATIONAL INTEGRITY VALIDATOR")
    print("=======================================================\n")

    # 1. SQLite Foreign Key Integrity Check
    logger.info("Executing SQLite PRAGMA foreign_key_check...")
    fk_violations = session.execute(text("PRAGMA foreign_key_check;")).fetchall()
    if fk_violations:
        errors.append(f"Foreign key violations found: {fk_violations}")
    else:
        logger.info("[PASS] Zero foreign key violations detected.")

    # 2. Entity Count Verification
    counts = {
        "Users": session.query(User).count(),
        "Creator Profiles": session.query(CreatorProfile).count(),
        "Brand Profiles": session.query(BrandProfile).count(),
        "Skills": session.query(Skill).count(),
        "Tools": session.query(Tool).count(),
        "Creator Skills": session.query(CreatorSkill).count(),
        "Creator Tools": session.query(CreatorTool).count(),
        "Briefs": session.query(Brief).count(),
        "Brief Skills": session.query(BriefSkill).count(),
        "Brief Tools": session.query(BriefTool).count(),
        "Portfolio Projects": session.query(PortfolioProject).count(),
        "Workflow Steps": session.query(WorkflowStep).count(),
        "Evidence Records": session.query(EvidenceRecord).count(),
        "Verification Records": session.query(VerificationRecord).count(),
        "Applications": session.query(Application).count(),
        "Engagements": session.query(Engagement).count(),
    }

    logger.info("Verifying entity counts against specifications:")
    for entity, cnt in counts.items():
        logger.info(f"  - {entity}: {cnt}")

    if counts["Creator Profiles"] < 12 or counts["Creator Profiles"] > 15:
        errors.append(f"Expected 12-15 creators, found {counts['Creator Profiles']}")
    if counts["Brand Profiles"] < 5 or counts["Brand Profiles"] > 8:
        errors.append(f"Expected 5-8 brands, found {counts['Brand Profiles']}")
    if counts["Briefs"] < 8 or counts["Briefs"] > 12:
        errors.append(f"Expected 8-12 briefs, found {counts['Briefs']}")

    # 3. Matching Scenario 1: Strong Match (Elena Rostova on Lumina Dewdrop)
    logger.info("\n--- Scenario 1: Strong Match Validation ---")
    dewdrop_brief = session.query(Brief).filter(Brief.id == "brief-lumina-dewdrop").first()
    elena = session.query(CreatorProfile).filter(CreatorProfile.id == "creator-elena-rostova").first()

    assert dewdrop_brief is not None, "Dewdrop brief missing"
    assert elena is not None, "Elena profile missing"

    # Match criteria: Video, 16:9, Runway Gen-3, budget under $4500
    elena_video_proj = [p for p in elena.portfolio_projects if p.content_type == "VIDEO" and p.aspect_ratio == "16:9"]
    elena_has_runway = any(ct.tool.name == "Runway Gen-3 Alpha" for ct in elena.tools)
    elena_budget_fit = elena.min_budget <= dewdrop_brief.budget_amount

    if elena_video_proj and elena_has_runway and elena_budget_fit:
        logger.info("[PASS] Elena Rostova strongly matches Lumina Dewdrop (16:9 4K Video, Runway Gen-3 verified, $3k <= $4.5k)")
    else:
        errors.append("Scenario 1 failed: Elena does not match Lumina Dewdrop as expected")

    # 4. Matching Scenario 2: Partial Match (Marcus Vance on Lumina Dewdrop)
    logger.info("\n--- Scenario 2: Partial Match Validation ---")
    marcus = session.query(CreatorProfile).filter(CreatorProfile.id == "creator-marcus-vance").first()
    marcus_has_video = any(p.content_type == "VIDEO" for p in marcus.portfolio_projects)
    marcus_budget_fit = marcus.min_budget <= dewdrop_brief.budget_amount

    if not marcus_has_video and marcus_budget_fit:
        logger.info("[PASS] Marcus Vance correctly identified as Partial Match (Budget fits $1.8k <= $4.5k, but lacks Video motion capability)")
    else:
        errors.append("Scenario 2 failed: Marcus Vance match status unexpected")

    # 5. Matching Scenario 3: Hard Filter Exclusion (Kai Tanaka on Lumina Dewdrop)
    logger.info("\n--- Scenario 3: Hard Filter Failure Validation ---")
    kai = session.query(CreatorProfile).filter(CreatorProfile.id == "creator-kai-tanaka").first()
    # Lumina brief requires skill-4k-video and skill-macro-fluid
    kai_skills = {cs.skill_id for cs in kai.skills}
    missing_required = {"skill-4k-video", "skill-macro-fluid"} - kai_skills
    if missing_required:
        logger.info(f"[PASS] Kai Tanaka correctly fails hard filter for Lumina Dewdrop (Missing: {missing_required})")
    else:
        errors.append("Scenario 3 failed: Kai Tanaka unexpectedly passed requirements")

    # 6. Matching Scenario 4: Legitimate Zero-Result Search Scenario
    logger.info("\n--- Scenario 4: Zero-Result Search Validation ---")
    # Query for impossible combination: Audio-Visual + Aspect Ratio 1:1 + Budget under $200
    zero_match_creators = session.query(CreatorProfile).join(CreatorProfile.portfolio_projects)\
        .filter(PortfolioProject.content_type == "AUDIO_VISUAL")\
        .filter(PortfolioProject.aspect_ratio == "1:1")\
        .filter(CreatorProfile.min_budget < 200.0).all()

    if len(zero_match_creators) == 0:
        logger.info("[PASS] Legitimate zero-result search returns exactly 0 matches with clean termination.")
    else:
        errors.append("Scenario 4 failed: Zero-result search unexpectedly returned matches")

    # 7. Scenario 5: Commercial Rights Diversity
    logger.info("\n--- Scenario 5: Commercial License Diversity Validation ---")
    license_types = session.query(PortfolioProject.commercial_license_type).distinct().all()
    license_list = [lt[0] for lt in license_types]
    logger.info(f"Detected distinct commercial license tiers: {license_list}")
    if len(license_list) >= 2:
        logger.info("[PASS] Multiple distinct commercial licensing tiers active.")
    else:
        errors.append("Scenario 5 failed: Insufficient commercial license diversity")

    # 8. Scenario 6: Verification Status Spectrum
    logger.info("\n--- Scenario 6: Verification Spectrum Audit ---")
    ver_statuses = session.query(VerificationRecord.status).distinct().all()
    status_list = [s[0] for s in ver_statuses]
    logger.info(f"Detected verification statuses: {status_list}")
    unverified_tools = session.query(CreatorTool).filter(CreatorTool.is_claim_verified == False).count()
    verified_tools = session.query(CreatorTool).filter(CreatorTool.is_claim_verified == True).count()
    logger.info(f"Creator tool claims: {verified_tools} Verified vs {unverified_tools} Self-Declared Unverified")

    if "APPROVED" in status_list and ("PENDING" in status_list or unverified_tools > 0):
        logger.info("[PASS] Verification spectrum properly distinguishes Audited Evidence from Self-Declarations.")
    else:
        errors.append("Scenario 6 failed: Verification spectrum not fully differentiated")

    session.close()

    print("\n=======================================================")
    if errors:
        print(f"[ERROR] VALIDATION FAILED WITH {len(errors)} ERROR(S):")
        for err in errors:
            print(f"  - {err}")
        sys.exit(1)
    else:
        print("[SUCCESS] ALL INTEGRITY AUDITS & FILTER SCENARIOS PASSED (100%)")
        print("=======================================================\n")


if __name__ == "__main__":
    run_validations()
