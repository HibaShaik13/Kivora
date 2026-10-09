"""
Kivora Real Users & Database Persistence Verification Suite
Tests the complete real-user lifecycle from registration, email OTP verification,
profile and portfolio creation, brand brief authoring, application submission,
selection, engagement creation, logout/re-login persistence, and security authorization checks.
"""

import sys
from pathlib import Path
from starlette.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.app.main import app
from backend.app.database import SessionLocal
from backend.app.models.models import (
    User,
    OtpCode,
    CreatorProfile,
    BrandProfile,
    Brief,
    PortfolioProject,
    WorkflowStep,
    EvidenceRecord,
    Application,
    Engagement,
)
from backend.scripts.seed_db import seed_database

client = TestClient(app)


def run_persistence_and_auth_tests():
    print("\n=======================================================")
    print("  KIVORA REAL USERS & PERSISTENCE VERIFICATION SUITE")
    print("=======================================================\n")

    db = SessionLocal()

    # Clean up test accounts if they existed from prior runs
    test_emails = ["alice.creator@test.com", "solaris.brand@test.com"]
    for email in test_emails:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            db.delete(existing)
        db.query(OtpCode).filter(OtpCode.email == email).delete()
    db.commit()

    # ----------------------------------------------------
    # 1. REAL CREATOR REGISTRATION
    # ----------------------------------------------------
    print("--- 1. Testing Real Creator Registration ---")
    reg_payload = {
        "email": "alice.creator@test.com",
        "password": "StrongPassword99!",
        "role": "CREATOR"
    }
    res = client.post("/api/auth/register", json=reg_payload)
    assert res.status_code == 201, f"Registration failed: {res.text}"
    reg_data = res.json()
    alice_id = reg_data["user_id"]
    print(f"[PASS] Creator registered: {alice_id} (email: alice.creator@test.com)")

    # ----------------------------------------------------
    # 2. LOGIN REJECTION FOR UNVERIFIED EMAIL
    # ----------------------------------------------------
    print("\n--- 2. Testing Login Rejection for Unverified Email ---")
    login_attempt = client.post("/api/auth/login", json={
        "email": "alice.creator@test.com",
        "password": "StrongPassword99!"
    })
    assert login_attempt.status_code == 403, f"Expected 403, got: {login_attempt.status_code}"
    print("[PASS] Unverified user login blocked with 403 Forbidden.")

    # ----------------------------------------------------
    # 3. OTP VERIFICATION
    # ----------------------------------------------------
    print("\n--- 3. Testing Email OTP Verification ---")
    # Fetch active OTP from database
    otp_record = db.query(OtpCode).filter(
        OtpCode.email == "alice.creator@test.com",
        OtpCode.is_used == False
    ).order_by(OtpCode.created_at.desc()).first()
    assert otp_record is not None, "OTP record not found in database"
    alice_otp = otp_record.code

    # Test invalid OTP
    bad_verify = client.post("/api/auth/verify-otp", json={
        "email": "alice.creator@test.com",
        "otp_code": "000000"
    })
    assert bad_verify.status_code == 400, "Invalid OTP should fail"
    print("[PASS] Invalid OTP rejected with 400 Bad Request.")

    # Test valid OTP
    good_verify = client.post("/api/auth/verify-otp", json={
        "email": "alice.creator@test.com",
        "otp_code": alice_otp
    })
    assert good_verify.status_code == 200, f"Valid OTP failed: {good_verify.text}"
    alice_auth = good_verify.json()
    alice_token = alice_auth["access_token"]
    assert alice_auth["user"]["is_email_verified"] is True
    print("[PASS] Valid OTP accepted; JWT token issued & email marked verified.")

    # ----------------------------------------------------
    # 4. CREATOR PROFILE CREATION & DATABASE PERSISTENCE
    # ----------------------------------------------------
    print("\n--- 4. Testing Real Creator Profile Setup ---")
    alice_headers = {"Authorization": f"Bearer {alice_token}"}
    profile_payload = {
        "display_name": "Alice Vance-Chen",
        "handle": "alice_synth",
        "bio": "Generative neural cinematographer focusing on hyper-speed camera motion and fluid optics.",
        "location": "Seattle, USA",
        "years_experience": 3,
        "primary_specialization": "Generative Neural Cinematography",
        "min_budget": 2400.0,
        "skill_ids": ["skill-4k-video", "skill-camera-control"],
        "tool_ids": ["tool-runway-gen3", "tool-comfyui"]
    }
    prof_res = client.post("/api/creators/profile", json=profile_payload, headers=alice_headers)
    assert prof_res.status_code == 201, f"Profile setup failed: {prof_res.text}"
    created_profile = prof_res.json()
    assert created_profile["handle"] == "alice_synth"
    alice_creator_id = created_profile["id"]
    print(f"[PASS] Real CreatorProfile persisted in database: {alice_creator_id}")

    # ----------------------------------------------------
    # 5. CREATOR PORTFOLIO & WORKFLOW AUTHORING
    # ----------------------------------------------------
    print("\n--- 5. Testing Portfolio & Workflow Authoring ---")
    portfolio_payload = {
        "title": "Quantum Flow: Neural Motion Study",
        "description": "A 25s continuous camera flight through liquid bismuth fractals.",
        "content_type": "VIDEO",
        "primary_asset_url": "/assets/portfolio/quantum_flow.mp4",
        "thumbnail_url": "/assets/portfolio/quantum_flow_thumb.jpg",
        "aspect_ratio": "16:9",
        "resolution": "4K UHD",
        "duration_seconds": 25,
        "commercial_rights_held": True,
        "commercial_license_type": "Full Commercial Buyout",
        "featured": True,
        "workflow_steps": [
            {
                "step_order": 1,
                "stage_name": "Latent Fractal Seeds",
                "tools_used": "ComfyUI, SDXL",
                "description": "Synthesized 4K depth keyframes."
            },
            {
                "step_order": 2,
                "stage_name": "Runway Camera Flight",
                "tools_used": "Runway Gen-3 Alpha",
                "description": "Calculated 3D vector camera path."
            }
        ],
        "evidence_records": [
            {
                "evidence_type": "WORKFLOW_NODE_GRAPH",
                "file_url": "/assets/evidence/alice_node_graph.png",
                "title": "Bismuth Flow Latent Pipeline",
                "description": "ComfyUI schematic proving generation parameters."
            }
        ]
    }
    proj_res = client.post("/api/creators/portfolio", json=portfolio_payload, headers=alice_headers)
    assert proj_res.status_code == 201, f"Portfolio authoring failed: {proj_res.text}"
    proj_data = proj_res.json()
    alice_project_id = proj_data["id"]
    assert len(proj_data["workflow_steps"]) == 2
    assert len(proj_data["evidence_records"]) == 1
    print(f"[PASS] Real PortfolioProject, 2 WorkflowSteps, and Evidence persisted in database.")

    # ----------------------------------------------------
    # 6. REAL BRAND REGISTRATION & PROFILE SETUP
    # ----------------------------------------------------
    print("\n--- 6. Testing Real Brand Registration & Setup ---")
    brand_reg = client.post("/api/auth/register", json={
        "email": "solaris.brand@test.com",
        "password": "SolarisBrand2026!",
        "role": "BRAND"
    })
    assert brand_reg.status_code == 201
    brand_user_id = brand_reg.json()["user_id"]

    # Verify brand OTP
    brand_otp_rec = db.query(OtpCode).filter(
        OtpCode.email == "solaris.brand@test.com",
        OtpCode.is_used == False
    ).order_by(OtpCode.created_at.desc()).first()
    assert brand_otp_rec is not None

    brand_verify = client.post("/api/auth/verify-otp", json={
        "email": "solaris.brand@test.com",
        "otp_code": brand_otp_rec.code
    })
    assert brand_verify.status_code == 200
    brand_token = brand_verify.json()["access_token"]
    brand_headers = {"Authorization": f"Bearer {brand_token}"}

    # Brand Profile Setup
    brand_prof_res = client.post("/api/brands/profile", json={
        "company_name": "Solaris Quantum Labs",
        "slug": "solaris-quantum-labs",
        "industry": "DeepTech & Quantum Computing",
        "description": "Pioneering room-temperature topological quantum processors.",
        "company_size": "50-250",
        "headquarters": "Boston, USA"
    }, headers=brand_headers)
    assert brand_prof_res.status_code == 201
    solaris_brand_id = brand_prof_res.json()["id"]
    print(f"[PASS] Real BrandProfile persisted: {solaris_brand_id} (Solaris Quantum Labs)")

    # ----------------------------------------------------
    # 7. REAL CAMPAIGN BRIEF CREATION BY BRAND
    # ----------------------------------------------------
    print("\n--- 7. Testing Real Campaign Brief Creation ---")
    brief_payload = {
        "brand_id": solaris_brand_id,
        "title": "Quantum Horizon 4K Teaser",
        "campaign_objective": "Teaser announcing our 1000-qubit processor reveal.",
        "target_audience": "Tech executives and researchers.",
        "content_type": "VIDEO",
        "creative_style_mood": "Minimalist High-Tech, Volumetric Light, Deep Indigo",
        "aspect_ratio": "16:9",
        "duration_seconds_min": 20,
        "duration_seconds_max": 30,
        "resolution_min": "4K UHD",
        "deliverables_description": "1x 30s Master Cut, ProRes 422HQ.",
        "revision_allowance": 2,
        "budget_amount": 5000.0,
        "budget_currency": "USD",
        "deadline_days": 20,
        "commercial_use_requirements": "Full commercial buyout.",
        "usage_channels": "YouTube, Web, Keynote",
        "usage_duration": "Perpetual",
        "usage_territories": "Worldwide",
        "restrictions_and_guidelines": "No cheesy stock quantum spheres.",
        "disclosure_requirements": "Created with AI disclaimer.",
        "required_skill_ids": ["skill-4k-video", "skill-camera-control"],
        "required_tool_ids": ["tool-runway-gen3"]
    }
    brief_res = client.post("/api/briefs", json=brief_payload, headers=brand_headers)
    assert brief_res.status_code == 201, f"Brief creation failed: {brief_res.text}"
    real_brief = brief_res.json()
    real_brief_id = real_brief["id"]
    print(f"[PASS] Real Brief persisted in database: {real_brief_id} ('Quantum Horizon 4K Teaser')")

    # ----------------------------------------------------
    # 8. EXPLAINABLE MATCHING FOR REAL BRIEF
    # ----------------------------------------------------
    print("\n--- 8. Testing Explainable Matching for Real Brief ---")
    match_res = client.get(f"/api/match/briefs/{real_brief_id}")
    assert match_res.status_code == 200
    match_data = match_res.json()
    alice_match = next((m for m in match_data["matches"] if m["creator_id"] == alice_creator_id), None)
    assert alice_match is not None, "Alice should be evaluated in matching"
    assert alice_match["score"] >= 70.0, f"Expected good match for Alice, got {alice_match['score']}"
    print(f"[PASS] Alice evaluated by matching engine: Score {alice_match['score']}% ({alice_match['match_level']})")
    print(f"       Reasons: {alice_match['reasons'][:2]}")

    # ----------------------------------------------------
    # 9. REAL CREATOR APPLICATION SUBMISSION
    # ----------------------------------------------------
    print("\n--- 9. Testing Real Creator Application Submission ---")
    app_payload = {
        "brief_id": real_brief_id,
        "creator_id": alice_creator_id,
        "pitch_text": "I specialize in neural camera trajectories and liquid quantum physics visuals. My Quantum Flow project demonstrates the exact aesthetic you need.",
        "proposed_rate": 4500.0,
        "proposed_timeline_days": 14,
        "attached_project_ids": [alice_project_id]
    }
    app_res = client.post(f"/api/briefs/{real_brief_id}/apply", json=app_payload, headers=alice_headers)
    assert app_res.status_code == 201, f"Application failed: {app_res.text}"
    application_data = app_res.json()
    application_id = application_data["id"]
    print(f"[PASS] Real Application persisted in database: {application_id}")

    # ----------------------------------------------------
    # 10. REAL BRAND REVIEW & APPLICATION ACCEPTANCE
    # ----------------------------------------------------
    print("\n--- 10. Testing Application Acceptance & Engagement ---")
    accept_res = client.patch(
        f"/api/briefs/applications/{application_id}/status",
        json={"status": "ACCEPTED", "brand_feedback": "Stunning portfolio. Looking forward to kickoff."},
        headers=brand_headers
    )
    assert accept_res.status_code == 200
    assert accept_res.json()["status"] == "ACCEPTED"

    # Verify Engagement was automatically created in database
    engagement_record = db.query(Engagement).filter(Engagement.application_id == application_id).first()
    assert engagement_record is not None, "Engagement record not generated on acceptance"
    assert engagement_record.status == "KICKOFF"
    assert engagement_record.agreed_amount == 4500.0
    print(f"[PASS] Application accepted & real Engagement provisioned: {engagement_record.id} (Status: KICKOFF)")

    # ----------------------------------------------------
    # 11. RE-LOGIN & DATABASE PERSISTENCE VERIFICATION
    # ----------------------------------------------------
    print("\n--- 11. Testing Logout / Re-Login Persistence ---")
    # Fresh login for Alice
    re_login_res = client.post("/api/auth/login", json={
        "email": "alice.creator@test.com",
        "password": "StrongPassword99!"
    })
    assert re_login_res.status_code == 200
    re_token = re_login_res.json()["access_token"]
    assert re_login_res.json()["user"]["has_profile"] is True

    # Query Alice profile using new token
    me_res = client.get(f"/api/creators/{alice_creator_id}", headers={"Authorization": f"Bearer {re_token}"})
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["display_name"] == "Alice Vance-Chen"
    assert len(me_data["portfolio_projects"]) == 1
    assert me_data["portfolio_projects"][0]["title"] == "Quantum Flow: Neural Motion Study"
    print("[PASS] Full profile and portfolio data accurately retrieved after fresh login.")

    # ----------------------------------------------------
    # 12. NON-DESTRUCTIVE SEEDING VERIFICATION
    # ----------------------------------------------------
    print("\n--- 12. Testing Non-Destructive Seeding Safety ---")
    seed_database()

    # Re-verify Alice and Acme data still exist completely intact in SQLite
    db.expire_all()
    alice_check = db.query(User).filter(User.email == "alice.creator@test.com").first()
    assert alice_check is not None, "Real user Alice was erased during seeding!"
    assert alice_check.creator_profile is not None
    assert len(alice_check.creator_profile.portfolio_projects) == 1

    brand_check = db.query(User).filter(User.email == "solaris.brand@test.com").first()
    assert brand_check is not None, "Real brand was erased during seeding!"
    assert brand_check.brand_profile is not None

    brief_check = db.query(Brief).filter(Brief.id == real_brief_id).first()
    assert brief_check is not None, "Real brief was erased during seeding!"

    eng_check = db.query(Engagement).filter(Engagement.application_id == application_id).first()
    assert eng_check is not None, "Real engagement was erased during seeding!"

    print("[PASS] Non-destructive seeding verified: Real users, profiles, briefs, and engagements preserved 100%.")

    # ----------------------------------------------------
    # 13. SECURITY & UNAUTHORIZED ACCESS CHECKS
    # ----------------------------------------------------
    print("\n--- 13. Testing Security & Unauthorized Access Checks ---")
    # A. Unauthenticated request to protected route
    unauth_res = client.post("/api/creators/portfolio", json=portfolio_payload)
    assert unauth_res.status_code == 401
    print("[PASS] Unauthenticated request blocked: 401 Unauthorized.")

    # B. Brand tries to call creator portfolio upload endpoint
    brand_as_creator = client.post("/api/creators/portfolio", json=portfolio_payload, headers=brand_headers)
    assert brand_as_creator.status_code == 403
    print("[PASS] Role mismatch blocked: Brand cannot author creator portfolio (403 Forbidden).")

    # C. Creator tries to call brand profile setup
    creator_as_brand = client.post("/api/brands/profile", json={"company_name": "Fake Brand"}, headers=alice_headers)
    assert creator_as_brand.status_code == 403
    print("[PASS] Role mismatch blocked: Creator cannot setup brand profile (403 Forbidden).")

    # D. Wrong password login
    bad_pwd = client.post("/api/auth/login", json={"email": "alice.creator@test.com", "password": "WrongPassword"})
    assert bad_pwd.status_code == 401
    print("[PASS] Wrong password rejected: 401 Unauthorized.")

    # E. Duplicate email registration
    dup_reg = client.post("/api/auth/register", json=reg_payload)
    assert dup_reg.status_code == 400
    print("[PASS] Duplicate email registration rejected: 400 Bad Request.")

    db.close()
    print("\n=======================================================")
    print("[SUCCESS] ALL REAL USER & PERSISTENCE TESTS PASSED (100%)")
    print("=======================================================\n")


if __name__ == "__main__":
    run_persistence_and_auth_tests()
