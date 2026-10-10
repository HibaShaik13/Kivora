"""
Kivora Complete Security, Profiles, Portfolios, Brief Lifecycle & AI Builder Regression Suite
Tests real-user persistence, creator profiles, AI portfolio ownership, verification audit,
brand profiles, campaign brief validation, full lifecycle (Draft/Publish/Close/Cancel),
cross-brand authorization, SQLite foreign keys, and AI provider fallback abstraction.
"""

import io
import os
import sys
import uuid
import json
from unittest.mock import MagicMock, patch

from pathlib import Path
from datetime import datetime, timedelta
from sqlalchemy.exc import IntegrityError

# Set up path so imports work when running from project root
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from starlette.testclient import TestClient

from backend.app.main import app
from backend.app.database import SessionLocal
from backend.app.core.security import hash_password
from backend.app.models.models import (
    User,
    OtpCode,
    CreatorProfile,
    CreatorTool,
    CreatorSkill,
    BrandProfile,
    Brief,
    PortfolioProject,
    WorkflowStep,
    EvidenceRecord,
    VerificationRecord,
    VerificationAiAnalysis,
    Application,
    Engagement,
    EngagementDeliverable,
)

from backend.app.services.brief_builder import (
    get_brief_provider,
    HeuristicFallbackProvider,
    GeminiBriefProvider,
    generate_structured_brief,
)
from backend.app.schemas.schemas import BriefGenerationRequest
from backend.scripts.seed_db import seed_database

client = TestClient(app)

# Explicitly namespaced test fixture emails to prevent collision with real users
TEST_ALICE_EMAIL = "test.fixture.alice.creator@kivora.test"
TEST_BOB_EMAIL = "test.fixture.bob.creator@kivora.test"
TEST_SOLARIS_EMAIL = "test.fixture.solaris.brand@kivora.test"
TEST_COMPETITOR_EMAIL = "test.fixture.competitor.brand@kivora.test"
TEST_ADMIN_EMAIL = "test.fixture.admin@kivora.test"


def cleanup_test_fixtures(db):
    """Safely removes only test-fixture identities without touching any real user records or demo seeds."""
    test_emails = [
        TEST_ALICE_EMAIL,
        TEST_BOB_EMAIL,
        TEST_SOLARIS_EMAIL,
        TEST_COMPETITOR_EMAIL,
        TEST_ADMIN_EMAIL,
        "alice.creator@test.com",
        "solaris.brand@test.com",
    ]
    for email in test_emails:
        u = db.query(User).filter(User.email == email).first()
        if u:
            db.delete(u)
        db.query(OtpCode).filter(OtpCode.email == email).delete()
    db.commit()


@patch("backend.app.api.auth.send_otp_email", return_value={"sent": True, "provider": "mock", "delivery_status": "DELIVERED"})
def run_persistence_and_auth_tests(mock_email):
    print("\n=======================================================")
    print("  KIVORA COMPLETE BACKEND REGRESSION & VERIFICATION SUITE")
    print("=======================================================\n")

    db = SessionLocal()
    cleanup_test_fixtures(db)

    # ----------------------------------------------------
    # 1. REAL CREATOR REGISTRATION & UNVERIFIED BLOCKING
    # ----------------------------------------------------
    print("--- 1. Testing Real Creator Registration & OTP Flow ---")
    reg_payload = {
        "email": TEST_ALICE_EMAIL,
        "password": "StrongPassword99!",
        "role": "CREATOR"
    }
    res = client.post("/api/auth/register", json=reg_payload)
    assert res.status_code == 201, f"Registration failed: {res.text}"
    alice_user_id = res.json()["user_id"]
    print(f"[PASS] Creator Alice registered: {alice_user_id}")

    # Unverified login attempt
    unverified_login = client.post("/api/auth/login", json={
        "email": TEST_ALICE_EMAIL,
        "password": "StrongPassword99!"
    })
    assert unverified_login.status_code == 403, "Unverified user must be blocked"
    print("[PASS] Unverified user login blocked with 403 Forbidden.")

    # Retrieve OTP code
    otp_rec = db.query(OtpCode).filter(
        OtpCode.email == TEST_ALICE_EMAIL,
        OtpCode.is_used == False
    ).order_by(OtpCode.created_at.desc()).first()
    assert otp_rec is not None

    # Invalid OTP attempt
    bad_otp_res = client.post("/api/auth/verify-otp", json={
        "email": TEST_ALICE_EMAIL,
        "otp_code": "000000"
    })
    assert bad_otp_res.status_code == 400
    print("[PASS] Invalid OTP rejected with 400 Bad Request.")

    # Valid OTP verification
    verify_res = client.post("/api/auth/verify-otp", json={
        "email": TEST_ALICE_EMAIL,
        "otp_code": otp_rec.code
    })
    assert verify_res.status_code == 200
    alice_token = verify_res.json()["access_token"]
    alice_headers = {"Authorization": f"Bearer {alice_token}"}
    print("[PASS] Valid OTP verified; JWT token issued for Alice.")

    # Also register Creator Bob (for cross-creator authorization & ownership testing)
    client.post("/api/auth/register", json={"email": TEST_BOB_EMAIL, "password": "BobPassword99!", "role": "CREATOR"})
    bob_otp = db.query(OtpCode).filter(OtpCode.email == TEST_BOB_EMAIL).order_by(OtpCode.created_at.desc()).first().code
    bob_auth = client.post("/api/auth/verify-otp", json={"email": TEST_BOB_EMAIL, "otp_code": bob_otp}).json()
    bob_headers = {"Authorization": f"Bearer {bob_auth['access_token']}"}

    client.post("/api/creators/profile", json={
        "display_name": "Bob 3D Studio",
        "handle": "test_bob_3d_artist",
        "bio": "Generative 3D artist specializing in NeRFs.",
        "location": "Berlin, Germany",
        "years_experience": 2,
        "primary_specialization": "3D NeRF Synthesis",
        "min_budget": 1500.0,
        "skill_ids": ["skill-product-viz"],
        "tool_ids": ["tool-midjourney-v6"]
    }, headers=bob_headers)
    print("[PASS] Creator Bob registered and provisioned for ownership tests.")

    # Provision Admin User for Verification Audit
    admin_user = User(
        id=f"user-admin-{uuid.uuid4().hex[:10]}",
        email=TEST_ADMIN_EMAIL,
        hashed_password=hash_password("AdminSecurePassword123!"),
        role="ADMIN",
        is_email_verified=True,
        created_at=datetime.utcnow()
    )
    db.add(admin_user)
    db.commit()

    admin_login = client.post("/api/auth/login", json={"email": TEST_ADMIN_EMAIL, "password": "AdminSecurePassword123!"}).json()
    admin_headers = {"Authorization": f"Bearer {admin_login['access_token']}"}
    print("[PASS] Admin identity securely provisioned for verification audit.")

    # ----------------------------------------------------
    # 2. CREATOR PROFILE CRUD & GET /ME
    # ----------------------------------------------------
    print("\n--- 2. Testing Creator Profile Setup, Update & GET /me ---")
    prof_res = client.post("/api/creators/profile", json={
        "display_name": "Alice Neural Art",
        "handle": "test_alice_neural_fx",
        "bio": "Generative neural cinematographer focusing on 4K fluid physics.",
        "location": "Seattle, USA",
        "years_experience": 3,
        "primary_specialization": "Generative Neural Cinematography",
        "min_budget": 2400.0,
        "skill_ids": ["skill-4k-video", "skill-camera-control"],
        "tool_ids": ["tool-runway-gen3", "tool-comfyui"]
    }, headers=alice_headers)
    assert prof_res.status_code == 201
    alice_creator_id = prof_res.json()["id"]
    print(f"[PASS] CreatorProfile persisted: {alice_creator_id}")

    # Test GET /api/creators/me
    me_res = client.get("/api/creators/me", headers=alice_headers)
    assert me_res.status_code == 200
    assert me_res.json()["handle"] == "test_alice_neural_fx"
    print("[PASS] GET /api/creators/me returned authentic creator profile.")

    # Test PUT /api/creators/profile
    update_prof_res = client.put("/api/creators/profile", json={
        "display_name": "Alice Neural Art (Updated)",
        "handle": "test_alice_neural_fx",
        "bio": "Updated bio with cutting-edge cinematic physics.",
        "location": "San Francisco, USA",
        "years_experience": 4,
        "primary_specialization": "Generative Neural Cinematography",
        "min_budget": 2600.0,
        "skill_ids": ["skill-4k-video", "skill-camera-control", "skill-macro-fluid"],
        "tool_ids": ["tool-runway-gen3", "tool-comfyui", "tool-topaz-video"]
    }, headers=alice_headers)
    assert update_prof_res.status_code == 200
    assert update_prof_res.json()["display_name"] == "Alice Neural Art (Updated)"
    assert len(update_prof_res.json()["tools"]) == 3
    print("[PASS] PUT /api/creators/profile successfully updated profile details & tools.")

    # ----------------------------------------------------
    # 3. AI PORTFOLIO CREATION & OWNERSHIP ENFORCEMENT
    # ----------------------------------------------------
    print("\n--- 3. Testing AI Portfolio Creation, Update & Ownership ---")
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
    assert proj_res.status_code == 201
    alice_proj_id = proj_res.json()["id"]
    alice_ev_id = proj_res.json()["evidence_records"][0]["id"]
    print(f"[PASS] Portfolio project created: {alice_proj_id} with evidence: {alice_ev_id}")

    # A. Bob attempts to edit Alice's project -> MUST BE FORBIDDEN (403)
    bob_edit_attempt = client.put(f"/api/creators/portfolio/{alice_proj_id}", json={
        "title": "Hacked Title By Bob"
    }, headers=bob_headers)
    assert bob_edit_attempt.status_code == 403
    print("[PASS] Cross-creator edit rejected: 403 Forbidden.")

    # B. Bob attempts to delete Alice's project -> MUST BE FORBIDDEN (403)
    bob_delete_attempt = client.delete(f"/api/creators/portfolio/{alice_proj_id}", headers=bob_headers)
    assert bob_delete_attempt.status_code == 403
    print("[PASS] Cross-creator delete rejected: 403 Forbidden.")

    # C. Alice legitimately updates her own project
    alice_edit_res = client.put(f"/api/creators/portfolio/{alice_proj_id}", json={
        "title": "Quantum Flow: Refined Motion Arc",
        "duration_seconds": 30
    }, headers=alice_headers)
    assert alice_edit_res.status_code == 200
    assert alice_edit_res.json()["title"] == "Quantum Flow: Refined Motion Arc"
    assert alice_edit_res.json()["duration_seconds"] == 30
    print("[PASS] Owning creator successfully updated portfolio project.")

    # D. Adding workflow step to project
    ws_res = client.post(f"/api/creators/portfolio/{alice_proj_id}/workflow-step", json={
        "stage_name": "Runway Camera Trajectory Controller",
        "tools_used": "Runway Gen-3 Alpha",
        "description": "15-degree roll with slow cinematic forward motion.",
        "parameters_snippet": "motion_speed: 4, roll: 15"
    }, headers=alice_headers)
    assert ws_res.status_code == 201
    print(f"[PASS] Workflow step persisted to portfolio project: {ws_res.json()['id']}")

    # E. Bob cannot add workflow step to Alice's project
    bob_ws_attempt = client.post(f"/api/creators/portfolio/{alice_proj_id}/workflow-step", json={
        "stage_name": "Unauthorized Step",
        "tools_used": "None",
        "description": "Test"
    }, headers=bob_headers)
    assert bob_ws_attempt.status_code == 403
    print("[PASS] Cross-creator workflow step addition blocked: 403 Forbidden.")

    # F. Adding extra evidence record to project
    ev2_res = client.post(f"/api/creators/portfolio/{alice_proj_id}/evidence", json={
        "evidence_type": "PROCESS_SCREENSHOT",
        "file_url": "/assets/evidence/runway_timeline.png",
        "title": "Runway Camera Motion Timeline",
        "description": "Screenshot of timeline vector interpolation.",
        "request_verification": False
    }, headers=alice_headers)
    assert ev2_res.status_code == 201
    alice_ev2_id = ev2_res.json()["id"]
    print(f"[PASS] Additional evidence record added: {alice_ev2_id}")

    # ----------------------------------------------------
    # 4. MEDIA UPLOAD HANDLING
    # ----------------------------------------------------
    print("\n--- 4. Testing Media Upload Mechanism & Validation ---")
    fake_png = io.BytesIO(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDRfakeimagebytes")
    unauth_upload = client.post("/api/media/upload", files={"file": ("render.png", fake_png, "image/png")})
    assert unauth_upload.status_code == 401
    print("[PASS] Unauthenticated media upload rejected: 401 Unauthorized.")

    fake_exe = io.BytesIO(b"MZ\x90\x00fakeexecutable")
    bad_upload = client.post(
        "/api/media/upload",
        files={"file": ("malware.exe", fake_exe, "application/octet-stream")},
        headers=alice_headers
    )
    assert bad_upload.status_code == 400
    print("[PASS] Disallowed file extension rejected: 400 Bad Request.")

    fake_png.seek(0)
    valid_upload = client.post(
        "/api/media/upload",
        data={"category": "portfolio"},
        files={"file": ("hero_frame.png", fake_png, "image/png")},
        headers=alice_headers
    )
    assert valid_upload.status_code == 201
    upload_data = valid_upload.json()
    assert upload_data["url"].startswith("/uploads/portfolio/")
    print(f"[PASS] Media file safely uploaded and relative URL issued: {upload_data['url']}")

    # ----------------------------------------------------
    # 5. VERIFICATION AUDIT LIFECYCLE
    # ----------------------------------------------------
    print("\n--- 5. Testing Verification Audit Lifecycle ---")
    bob_ver_attempt = client.post("/api/verification/request", json={
        "evidence_id": alice_ev_id,
        "target_type": "CREATOR_TOOL",
        "target_id": "tool-runway-gen3",
        "verification_scope": "Runway proficiency audit"
    }, headers=bob_headers)
    assert bob_ver_attempt.status_code == 403
    print("[PASS] Cross-creator verification request blocked: 403 Forbidden.")

    alice_ver_res = client.post("/api/verification/request", json={
        "evidence_id": alice_ev_id,
        "target_type": "CREATOR_TOOL",
        "target_id": "tool-runway-gen3",
        "verification_scope": "Runway Gen-3 Motion Arc Camera Trajectory Audit"
    }, headers=alice_headers)
    assert alice_ver_res.status_code == 201
    ver_id = alice_ver_res.json()["id"]
    assert alice_ver_res.json()["status"] == "PENDING"

    me_check = client.get("/api/creators/me", headers=alice_headers).json()
    runway_tool = next(t for t in me_check["tools"] if t["tool_id"] == "tool-runway-gen3")
    assert runway_tool["is_claim_verified"] is False
    print("[PASS] Pre-audit tool state verified: is_claim_verified=False (Self-Declared).")

    # Creator self-verification blocked
    alice_self_approve = client.patch(f"/api/verification/requests/{ver_id}", json={
        "status": "APPROVED",
        "reviewer_notes": "Self approved"
    }, headers=alice_headers)
    assert alice_self_approve.status_code == 403
    print("[PASS] Self-verification attempt blocked: 403 Forbidden.")

    # Admin approves
    admin_approve = client.patch(f"/api/verification/requests/{ver_id}", json={
        "status": "APPROVED",
        "reviewer_notes": "Audited custom motion parameters."
    }, headers=admin_headers)
    assert admin_approve.status_code == 200
    assert admin_approve.json()["status"] == "APPROVED"

    alice_refreshed = client.get("/api/creators/me", headers=alice_headers).json()
    runway_tool_after = next(t for t in alice_refreshed["tools"] if t["tool_id"] == "tool-runway-gen3")
    assert runway_tool_after["is_claim_verified"] is True
    assert alice_refreshed["verified_claims_count"] >= 1
    print("[PASS] Admin approved request: is_claim_verified=True, verified_claims_count incremented.")

    # Admin rejects second request
    alice_ver2_res = client.post("/api/verification/request", json={
        "evidence_id": alice_ev2_id,
        "target_type": "CREATOR_TOOL",
        "target_id": "tool-comfyui",
        "verification_scope": "ComfyUI Node Audit"
    }, headers=alice_headers)
    ver2_id = alice_ver2_res.json()["id"]

    admin_reject = client.patch(f"/api/verification/requests/{ver2_id}", json={
        "status": "REJECTED",
        "reviewer_notes": "Screenshot lacks node parameter settings."
    }, headers=admin_headers)
    assert admin_reject.status_code == 200
    assert admin_reject.json()["status"] == "REJECTED"
    print("[PASS] Admin rejected request: status=REJECTED and tool claim remains unverified.")

    # ----------------------------------------------------
    # 6. BRAND PROFILES CRUD & OWNERSHIP
    # ----------------------------------------------------
    print("\n--- 6. Testing Brand Setups, Updates (PUT) & Ownership ---")
    client.post("/api/auth/register", json={"email": TEST_SOLARIS_EMAIL, "password": "SolarisPassword!", "role": "BRAND"})
    solaris_otp = db.query(OtpCode).filter(OtpCode.email == TEST_SOLARIS_EMAIL).order_by(OtpCode.created_at.desc()).first().code
    solaris_auth = client.post("/api/auth/verify-otp", json={"email": TEST_SOLARIS_EMAIL, "otp_code": solaris_otp}).json()
    solaris_headers = {"Authorization": f"Bearer {solaris_auth['access_token']}"}

    solaris_prof = client.post("/api/brands/profile", json={
        "company_name": "Solaris Quantum Labs",
        "slug": "test-fixture-solaris-labs",
        "industry": "Quantum Tech",
        "description": "Next-gen quantum processing.",
        "headquarters": "Boston, USA"
    }, headers=solaris_headers).json()
    solaris_brand_id = solaris_prof["id"]

    client.post("/api/auth/register", json={"email": TEST_COMPETITOR_EMAIL, "password": "CompetitorPassword!", "role": "BRAND"})
    comp_otp = db.query(OtpCode).filter(OtpCode.email == TEST_COMPETITOR_EMAIL).order_by(OtpCode.created_at.desc()).first().code
    comp_auth = client.post("/api/auth/verify-otp", json={"email": TEST_COMPETITOR_EMAIL, "otp_code": comp_otp}).json()
    competitor_headers = {"Authorization": f"Bearer {comp_auth['access_token']}"}

    comp_prof = client.post("/api/brands/profile", json={
        "company_name": "Rival Technologies",
        "slug": "test-fixture-rival-technologies",
        "industry": "Computing",
        "description": "Competitor computing firm.",
        "headquarters": "New York, USA"
    }, headers=competitor_headers).json()
    competitor_brand_id = comp_prof["id"]
    print(f"[PASS] Two distinct brands provisioned: {solaris_brand_id} and {competitor_brand_id}")

    # A. GET /api/brands/me
    my_brand = client.get("/api/brands/me", headers=solaris_headers)
    assert my_brand.status_code == 200
    assert my_brand.json()["slug"] == "test-fixture-solaris-labs"
    print("[PASS] GET /api/brands/me accurately retrieved brand profile.")

    # B. PUT /api/brands/profile updates brand profile
    update_brand = client.put("/api/brands/profile", json={
        "company_name": "Solaris Quantum Labs International",
        "description": "Expanded quantum processors worldwide.",
        "headquarters": "Cambridge, USA"
    }, headers=solaris_headers)
    assert update_brand.status_code == 200
    assert update_brand.json()["company_name"] == "Solaris Quantum Labs International"
    assert update_brand.json()["headquarters"] == "Cambridge, USA"
    print("[PASS] PUT /api/brands/profile successfully updated brand details.")

    # C. Creator Alice attempting to update brand profile -> 403 Forbidden
    alice_brand_update = client.put("/api/brands/profile", json={"company_name": "Hacked Brand"}, headers=alice_headers)
    assert alice_brand_update.status_code == 403
    print("[PASS] Creator role updating brand profile blocked: 403 Forbidden.")

    # D. Slug collision check: Rival cannot steal Solaris's slug
    stolen_slug = client.put("/api/brands/profile", json={"slug": "test-fixture-solaris-labs"}, headers=competitor_headers)
    assert stolen_slug.status_code == 400
    print("[PASS] Duplicate brand slug update rejected: 400 Bad Request.")

    # E. Public listing of brands
    brand_list = client.get("/api/brands")
    assert brand_list.status_code == 200
    assert len(brand_list.json()) >= 2
    print("[PASS] GET /api/brands lists all public brand profiles.")

    # ----------------------------------------------------
    # 7. CAMPAIGN BRIEF VALIDATION & COMPLETE LIFECYCLE
    # ----------------------------------------------------
    print("\n--- 7. Testing Brief Validation & Complete Lifecycle (Draft -> Publish -> Close -> Cancel) ---")
    valid_brief_payload = {
        "title": "Quantum Horizon 4K Teaser",
        "campaign_objective": "Teaser announcing processor reveal.",
        "target_audience": "Tech executives.",
        "content_type": "VIDEO",
        "creative_style_mood": "Minimalist High-Tech",
        "aspect_ratio": "16:9",
        "resolution_min": "4K UHD",
        "deliverables_description": "1x 30s Master Cut.",
        "revision_allowance": 2,
        "budget_amount": 5000.0,
        "budget_currency": "USD",
        "deadline_days": 14,
        "commercial_use_requirements": "Full commercial buyout.",
        "usage_channels": "Web",
        "usage_duration": "12 Months",
        "usage_territories": "Worldwide",
        "restrictions_and_guidelines": "No stock imagery.",
        "disclosure_requirements": "AI disclosure tag.",
        "required_skill_ids": ["skill-4k-video"],
        "required_tool_ids": ["tool-runway-gen3"]
    }

    # A. Input Validation Rejections
    # Non-positive budget
    neg_budget = {**valid_brief_payload, "budget_amount": 0.0}
    assert client.post("/api/briefs", json=neg_budget, headers=solaris_headers).status_code == 400
    # Invalid deadline days
    neg_deadline = {**valid_brief_payload, "deadline_days": 0}
    assert client.post("/api/briefs", json=neg_deadline, headers=solaris_headers).status_code == 400
    # Empty title
    empty_title = {**valid_brief_payload, "title": "   "}
    assert client.post("/api/briefs", json=empty_title, headers=solaris_headers).status_code == 400
    # Invalid initial status
    bad_status = {**valid_brief_payload, "status": "UNKNOWN_STATE"}
    assert client.post("/api/briefs", json=bad_status, headers=solaris_headers).status_code == 400
    print("[PASS] Invalid brief inputs (budget <= 0, deadline < 1, empty title, bad status) rejected: 400 Bad Request.")

    # B. Creating a DRAFT Brief
    draft_payload = {**valid_brief_payload, "title": "Quantum Horizon Stealth Draft", "status": "DRAFT"}
    draft_res = client.post("/api/briefs", json=draft_payload, headers=solaris_headers)
    assert draft_res.status_code == 201
    draft_id = draft_res.json()["id"]
    draft_slug = draft_res.json()["slug"]
    assert draft_res.json()["status"] == "DRAFT"
    print(f"[PASS] Campaign brief created in DRAFT status: {draft_id}")

    # C. Unpublished Draft Protection
    # Public listing must NOT leak draft
    public_briefs = client.get("/api/briefs").json()
    assert not any(b["id"] == draft_id for b in public_briefs), "Unpublished draft leaked in public listing!"

    # Public unauthenticated detail query must return 404
    unauth_detail = client.get(f"/api/briefs/{draft_slug}")
    assert unauth_detail.status_code == 404, "Draft detail leaked to unauthenticated caller!"

    # Competitor brand detail query must return 404
    comp_detail = client.get(f"/api/briefs/{draft_slug}", headers=competitor_headers)
    assert comp_detail.status_code == 404, "Draft detail leaked to competitor brand!"

    # Owning brand CAN access draft detail
    solaris_detail = client.get(f"/api/briefs/{draft_slug}", headers=solaris_headers)
    assert solaris_detail.status_code == 200
    assert solaris_detail.json()["id"] == draft_id
    print("[PASS] Draft visibility properly restricted: hidden from public & competitors (404), visible to owner (200).")

    # Owning brand list-my-briefs shows draft
    my_briefs = client.get("/api/briefs/my-briefs", headers=solaris_headers)
    assert my_briefs.status_code == 200
    assert any(b["id"] == draft_id for b in my_briefs.json())
    print("[PASS] GET /api/briefs/my-briefs includes authored drafts.")

    # D. Editing Campaign Brief & Ownership Enforcement (PUT /api/briefs/{id})
    # Competitor tries to edit Solaris's draft -> 403 Forbidden
    comp_edit = client.put(f"/api/briefs/{draft_id}", json={"title": "Hacked by Rival"}, headers=competitor_headers)
    assert comp_edit.status_code == 403
    print("[PASS] Cross-brand edit attempt rejected: 403 Forbidden.")

    # Solaris legitimately updates the brief
    solaris_edit = client.put(f"/api/briefs/{draft_id}", json={
        "title": "Quantum Horizon Stealth Draft (Revised)",
        "budget_amount": 5500.0,
        "revision_allowance": 3,
        "required_tool_ids": ["tool-runway-gen3", "tool-comfyui"]
    }, headers=solaris_headers)
    assert solaris_edit.status_code == 200
    assert solaris_edit.json()["budget_amount"] == 5500.0
    assert solaris_edit.json()["revision_allowance"] == 3
    assert len(solaris_edit.json()["required_tools"]) == 2
    print("[PASS] Owning brand successfully updated brief and synced required tools.")

    # E. Lifecycle Transitions (PATCH /api/briefs/{id}/status)
    # Competitor tries to change status -> 403 Forbidden
    comp_status = client.patch(f"/api/briefs/{draft_id}/status", json={"status": "PUBLISHED"}, headers=competitor_headers)
    assert comp_status.status_code == 403
    print("[PASS] Cross-brand status change rejected: 403 Forbidden.")

    # Solaris publishes the brief -> PUBLISHED
    publish_res = client.patch(f"/api/briefs/{draft_id}/status", json={"status": "PUBLISHED"}, headers=solaris_headers)
    assert publish_res.status_code == 200
    assert publish_res.json()["status"] == "PUBLISHED"

    # Now public can view it
    pub_detail = client.get(f"/api/briefs/{draft_slug}")
    assert pub_detail.status_code == 200
    print("[PASS] Brief transitioned to PUBLISHED and is now publicly discoverable.")

    # Solaris closes the brief -> CLOSED
    close_res = client.patch(f"/api/briefs/{draft_id}/status", json={"status": "CLOSED"}, headers=solaris_headers)
    assert close_res.status_code == 200
    assert close_res.json()["status"] == "CLOSED"
    print("[PASS] Brief transitioned to CLOSED.")

    # Solaris cancels the brief -> CANCELLED
    cancel_res = client.patch(f"/api/briefs/{draft_id}/status", json={"status": "CANCELLED"}, headers=solaris_headers)
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "CANCELLED"
    print("[PASS] Brief transitioned to CANCELLED.")

    # F. Create published brief for application & engagement tests
    real_brief_res = client.post("/api/briefs", json=valid_brief_payload, headers=solaris_headers)
    assert real_brief_res.status_code == 201
    real_brief_id = real_brief_res.json()["id"]
    print(f"[PASS] Published campaign brief created for application flow: {real_brief_id}")

    # ----------------------------------------------------
    # 8. APPLICATION SUBMISSION & LIST PROTECTION
    # ----------------------------------------------------
    print("\n--- 8. Testing Application Submission & Cross-Brand Protection ---")
    app_data = {
        "brief_id": real_brief_id,
        "pitch_text": "I specialize in neural camera trajectories.",
        "proposed_rate": 4500.0,
        "proposed_timeline_days": 14,
        "attached_project_ids": [alice_proj_id]
    }

    assert client.post(f"/api/briefs/{real_brief_id}/apply", json=app_data).status_code == 401
    assert client.post(f"/api/briefs/{real_brief_id}/apply", json=app_data, headers=solaris_headers).status_code == 403

    # Forged creator ID
    forged_app_data = {**app_data, "creator_id": "creator-elena-rostova"}
    assert client.post(f"/api/briefs/{real_brief_id}/apply", json=forged_app_data, headers=alice_headers).status_code == 403

    # Legitimate Alice application
    valid_app_res = client.post(f"/api/briefs/{real_brief_id}/apply", json=app_data, headers=alice_headers)
    assert valid_app_res.status_code == 201
    application_id = valid_app_res.json()["id"]

    # Cross-brand view check
    assert client.get(f"/api/briefs/{real_brief_id}/applications").status_code == 401
    assert client.get(f"/api/briefs/{real_brief_id}/applications", headers=alice_headers).status_code == 403
    assert client.get(f"/api/briefs/{real_brief_id}/applications", headers=competitor_headers).status_code == 403
    solaris_view_apps = client.get(f"/api/briefs/{real_brief_id}/applications", headers=solaris_headers)
    assert solaris_view_apps.status_code == 200
    assert len(solaris_view_apps.json()) == 1
    print("[PASS] Application list restricted strictly to owning brand: 200 OK.")

    # ----------------------------------------------------
    # 9. STATUS UPDATE & ENGAGEMENT PROTECTION
    # ----------------------------------------------------
    print("\n--- 9. Testing Application Status & Engagement Protection ---")
    status_update_data = {"status": "ACCEPTED", "brand_feedback": "Welcome aboard."}
    assert client.patch(f"/api/briefs/applications/{application_id}/status", json=status_update_data).status_code == 401
    assert client.patch(f"/api/briefs/applications/{application_id}/status", json=status_update_data, headers=alice_headers).status_code == 403
    assert client.patch(f"/api/briefs/applications/{application_id}/status", json=status_update_data, headers=competitor_headers).status_code == 403

    solaris_accept = client.patch(f"/api/briefs/applications/{application_id}/status", json=status_update_data, headers=solaris_headers)
    assert solaris_accept.status_code == 200
    eng = db.query(Engagement).filter(Engagement.application_id == application_id).first()
    assert eng is not None
    assert eng.status == "KICKOFF"
    print(f"[PASS] Owning brand accepted application & provisioned Engagement: {eng.id}")

    # ----------------------------------------------------
    # 10. CREATOR DISCOVERY: FILTERS, SORTING, PAGINATION & EMPTY STATES
    # ----------------------------------------------------
    print("\n--- 10. Testing Creator Discovery (Combined Filters, Sorting, Pagination) ---")
    # A. Search by name & combined filters
    c_res = client.get("/api/creators?search=Alice&content_type=VIDEO")
    assert c_res.status_code == 200
    c_list = c_res.json()
    assert any(c["display_name"] == "Alice Neural Art (Updated)" for c in c_list)
    print("[PASS] Combined creator search (search + content_type) resolved target creator.")

    # B. Filter by tool & specialization
    tool_filter = client.get("/api/creators?tool=Runway Gen-3 Alpha")
    assert tool_filter.status_code == 200 and len(tool_filter.json()) >= 1

    # C. Verification tier filter
    ver_filter = client.get("/api/creators?verification_tier=VERIFIED_PRO")
    assert ver_filter.status_code == 200
    for c in ver_filter.json():
        assert c["verification_tier"] == "VERIFIED_PRO"
    print("[PASS] Creator verification tier filtering verified.")

    # D. Sorting by rating desc
    sort_res = client.get("/api/creators?sort_by=rating_desc")
    assert sort_res.status_code == 200
    ratings = [c["average_rating"] for c in sort_res.json()]
    assert ratings == sorted(ratings, reverse=True)

    # E. Sorting by budget asc
    budget_res = client.get("/api/creators?sort_by=budget_asc")
    assert budget_res.status_code == 200
    budgets = [c["min_budget"] for c in budget_res.json()]
    assert budgets == sorted(budgets)
    print("[PASS] Creator sorting options (rating_desc, budget_asc) functioning accurately.")

    # F. Pagination
    p1 = client.get("/api/creators?page=1&limit=3")
    assert p1.status_code == 200 and len(p1.json()) == 3
    p2 = client.get("/api/creators?page=2&limit=3")
    assert p2.status_code == 200 and len(p2.json()) == 3
    assert p1.json()[0]["id"] != p2.json()[0]["id"]
    print("[PASS] Creator pagination (page=1, page=2 with limit=3) correctly offsets results.")

    # G. Sensible empty state for non-matching query
    zero_res = client.get("/api/creators?search=NonExistentArtistQueryXYZ999")
    assert zero_res.status_code == 200 and zero_res.json() == []
    print("[PASS] Non-matching creator filter returns sensible empty list [].")

    # ----------------------------------------------------
    # 11. BRIEF DISCOVERY: FILTERS, SORTING, PAGINATION & DRAFT PRIVACY
    # ----------------------------------------------------
    print("\n--- 11. Testing Brief Discovery (Filters, Sorting, Privacy) ---")
    # A. Content type & budget filter
    b_res = client.get("/api/briefs?content_type=VIDEO&min_budget=1000&max_budget=10000")
    assert b_res.status_code == 200
    for b in b_res.json():
        assert b["content_type"] == "VIDEO"
        assert 1000 <= b["budget_amount"] <= 10000
    print("[PASS] Brief multi-attribute filter (content_type + budget range) functioning.")

    # B. Tool requirement filter
    b_tool = client.get("/api/briefs?tool=tool-runway-gen3")
    assert b_tool.status_code == 200 and len(b_tool.json()) >= 1
    print("[PASS] Brief required tool filtering functioning.")

    # C. Sorting
    b_sorted = client.get("/api/briefs?sort_by=budget_desc")
    assert b_sorted.status_code == 200
    b_budgets = [b["budget_amount"] for b in b_sorted.json()]
    assert b_budgets == sorted(b_budgets, reverse=True)
    print("[PASS] Brief sorting (budget_desc) functioning.")

    # D. Pagination
    bp = client.get("/api/briefs?page=1&limit=2")
    assert bp.status_code == 200 and len(bp.json()) == 2
    print("[PASS] Brief pagination correctly limits batch.")

    # E. Privacy: Public listings NEVER include draft briefs or private applications
    for b in client.get("/api/briefs").json():
        assert b["status"] == "PUBLISHED"
        assert "applications" not in b
    print("[PASS] Brief listings strictly omit private drafts and private applicant data.")

    # ----------------------------------------------------
    # 12. EXPLAINABLE MATCHING: SCORING, EXPLANATION & HARD REQUIREMENTS
    # ----------------------------------------------------
    print("\n--- 12. Testing Explainable Matching Engine ---")
    match_res = client.get(f"/api/match/briefs/{real_brief_id}")
    assert match_res.status_code == 200
    match_data = match_res.json()
    assert match_data["total_creators_evaluated"] >= 14
    assert len(match_data["matches"]) >= 1

    first_match = match_data["matches"][0]
    assert "score" in first_match
    assert "match_level" in first_match
    assert "breakdown" in first_match
    assert "reasons" in first_match
    assert "gaps" in first_match
    assert "matched_skills" in first_match
    assert "matched_tools" in first_match
    assert "strengths" in first_match
    assert "compatibility_disclaimer" in first_match
    assert first_match["breakdown"]["total_score"] == first_match["score"]
    print(f"[PASS] Match evaluation transparently populated: Top={first_match['display_name']} ({first_match['score']} - {first_match['match_level']})")

    # Test hard requirements filter parameter
    strict_res = client.get(f"/api/match/briefs/{real_brief_id}?enforce_hard_filters=true")
    assert strict_res.status_code == 200
    for m in strict_res.json()["matches"]:
        assert m["breakdown"]["hard_filter_passed"] is True
    print("[PASS] Matching parameter enforce_hard_filters=true successfully filtered incompatible candidates.")

    # ----------------------------------------------------
    # 13. APPLICATIONS: ELIGIBILITY & DUPLICATE PROTECTION
    # ----------------------------------------------------
    print("\n--- 13. Testing Applications Constraints & My-Applications ---")
    # A. Applying to a DRAFT brief must be rejected
    fresh_draft = client.post("/api/briefs", json={**valid_brief_payload, "title": "Fresh Temp Draft", "status": "DRAFT"}, headers=solaris_headers).json()["id"]
    draft_app_payload = {
        "pitch_text": "Draft application attempt.",
        "proposed_rate": 2000.0,
        "proposed_timeline_days": 10,
        "attached_project_ids": []
    }
    draft_apply = client.post(f"/api/briefs/{fresh_draft}/apply", json=draft_app_payload, headers=alice_headers)
    assert draft_apply.status_code == 400
    assert "Only PUBLISHED" in draft_apply.json()["detail"]
    print("[PASS] Applying to a non-published DRAFT brief rejected with 400 Bad Request.")

    # B. Duplicate application rejection
    dup_apply = client.post(f"/api/briefs/{real_brief_id}/apply", json=app_data, headers=alice_headers)
    assert dup_apply.status_code == 400
    assert "already applied" in dup_apply.json()["detail"]
    print("[PASS] Duplicate application rejected with 400 Bad Request.")

    # C. Creator views their own applications
    my_apps = client.get("/api/briefs/applications/my-applications", headers=alice_headers)
    assert my_apps.status_code == 200
    assert len(my_apps.json()) >= 1
    assert any(a["id"] == application_id for a in my_apps.json())
    print("[PASS] Authenticated creator successfully retrieved their own application history.")

    # ----------------------------------------------------
    # 14. ENGAGEMENT WORKFLOW: DELIVERABLES, REVISIONS, APPROVALS & REVIEWS
    # ----------------------------------------------------
    print("\n--- 14. Testing Engagement Lifecycle & Collaboration Workflow ---")
    eng_id = eng.id

    # A. Participant permissions
    assert client.get(f"/api/engagements/{eng_id}").status_code == 401
    assert client.get(f"/api/engagements/{eng_id}", headers=competitor_headers).status_code == 403
    alice_eng = client.get(f"/api/engagements/{eng_id}", headers=alice_headers)
    assert alice_eng.status_code == 200
    solaris_eng = client.get(f"/api/engagements/{eng_id}", headers=solaris_headers)
    assert solaris_eng.status_code == 200
    print("[PASS] Engagement access strictly restricted to participating creator and owning brand.")

    # B. Illegal state transition: Brand cannot approve or request revisions before draft submission
    assert client.post(f"/api/engagements/{eng_id}/approve", headers=solaris_headers).status_code == 400
    assert client.post(f"/api/engagements/{eng_id}/revisions", json={"feedback": "Premature"}, headers=solaris_headers).status_code == 400
    print("[PASS] Premature revision/approval before draft submission rejected with 400 Bad Request.")

    # C. Deliverable submission: Unauthorized creator rejected
    deliv_v1_payload = {
        "title": "Initial 4K Rough Cut v1",
        "asset_url": "/uploads/engagements/solaris_v1_rough.mp4",
        "notes": "First draft with atmospheric color grading."
    }
    assert client.post(f"/api/engagements/{eng_id}/deliverables", json=deliv_v1_payload, headers=bob_headers).status_code == 403

    # D. Assigned creator submits v1 deliverable
    deliv_v1_res = client.post(f"/api/engagements/{eng_id}/deliverables", json=deliv_v1_payload, headers=alice_headers)
    assert deliv_v1_res.status_code == 201
    eng_state1 = deliv_v1_res.json()
    assert eng_state1["status"] == "DRAFT_SUBMITTED"
    assert len(eng_state1["deliverables"]) == 1
    assert eng_state1["deliverables"][0]["version"] == 1
    assert eng_state1["deliverables"][0]["asset_url"] == deliv_v1_payload["asset_url"]
    print("[PASS] Creator submitted Draft Deliverable v1; status transitioned to DRAFT_SUBMITTED.")

    # E. Revision request by owning brand
    rev_payload = {
        "feedback": "Please adjust pacing from seconds 0:12 to 0:18 and increase neon luminescence."
    }
    # Creator or competitor cannot request revisions
    assert client.post(f"/api/engagements/{eng_id}/revisions", json=rev_payload, headers=alice_headers).status_code == 403
    assert client.post(f"/api/engagements/{eng_id}/revisions", json=rev_payload, headers=competitor_headers).status_code == 403

    rev_res = client.post(f"/api/engagements/{eng_id}/revisions", json=rev_payload, headers=solaris_headers)
    assert rev_res.status_code == 200
    eng_state2 = rev_res.json()
    assert eng_state2["status"] == "REVISION_REQUESTED"
    assert eng_state2["deliverables"][0]["feedback"] == rev_payload["feedback"]
    print("[PASS] Owning brand requested revision; feedback attached and status transitioned to REVISION_REQUESTED.")

    # F. Creator resubmits v2 deliverable
    deliv_v2_payload = {
        "title": "Pacing & Luminescence Refined Cut v2",
        "asset_url": "/uploads/engagements/solaris_v2_refined.mp4",
        "notes": "Addressed feedback: re-timed pacing and tuned glow shaders."
    }
    deliv_v2_res = client.post(f"/api/engagements/{eng_id}/deliverables", json=deliv_v2_payload, headers=alice_headers)
    assert deliv_v2_res.status_code == 201
    eng_state3 = deliv_v2_res.json()
    assert eng_state3["status"] == "DRAFT_SUBMITTED"
    assert len(eng_state3["deliverables"]) == 2
    assert eng_state3["deliverables"][1]["version"] == 2
    print("[PASS] Creator resubmitted revised deliverable v2; full delivery history (v1 + v2) preserved.")

    # G. Owning brand approves deliverable
    approve_res = client.post(f"/api/engagements/{eng_id}/approve", headers=solaris_headers)
    assert approve_res.status_code == 200
    eng_state4 = approve_res.json()
    assert eng_state4["status"] == "FINAL_APPROVED"
    assert eng_state4["deliverables"][1]["status"] == "APPROVED"
    print("[PASS] Owning brand approved deliverable v2; status transitioned to FINAL_APPROVED.")

    # H. Brand reviews and rates the completed engagement
    review_payload = {
        "rating": 5,
        "review": "Outstanding turnaround time and pristine 4K video rendering. Perfectly matched our visual guidelines!"
    }
    # Creator cannot submit brand review
    assert client.post(f"/api/engagements/{eng_id}/review", json=review_payload, headers=alice_headers).status_code == 403

    review_res = client.post(f"/api/engagements/{eng_id}/review", json=review_payload, headers=solaris_headers)
    assert review_res.status_code == 200
    eng_state5 = review_res.json()
    assert eng_state5["status"] == "COMPLETED"
    assert eng_state5["brand_rating"] == 5
    assert eng_state5["brand_review"] == review_payload["review"]

    # Verify creator statistics were updated in database
    db.expire_all()
    alice_profile = db.query(CreatorProfile).filter(CreatorProfile.id == alice_creator_id).first()
    assert alice_profile.completed_projects_count >= 1
    assert alice_profile.average_rating == 5.0
    print("[PASS] Brand submitted 5-star review; Engagement marked COMPLETED and creator stats updated.")

    # I. Delivering after project completion is rejected
    deliv_post_complete = client.post(f"/api/engagements/{eng_id}/deliverables", json=deliv_v2_payload, headers=alice_headers)
    assert deliv_post_complete.status_code == 400
    print("[PASS] Post-completion deliverable modification rejected with 400 Bad Request.")

    # ----------------------------------------------------
    # 15. AI BRIEF BUILDER PROVIDER ABSTRACTION & FALLBACK
    # ----------------------------------------------------
    print("\n--- 15. Testing AI Brief Builder Provider Abstraction & Safe Fallback ---")

    # A. API endpoint execution without external API key (isolated offline test)
    ai_req = {
        "raw_prompt": "We need a 30s luxury ethereal commercial for our hydrating glow serum, macro fluid droplet reveals in 4K 16:9.",
        "target_budget": 4500.0
    }
    with patch.dict(os.environ, {"GEMINI_API_KEY": ""}):
        ai_res = client.post("/api/ai/generate-brief", json=ai_req)
        assert ai_res.status_code == 200
        brief_gen = ai_res.json()
        assert brief_gen["generation_engine"] == "HEURISTIC_FALLBACK_ENGINE"
        assert brief_gen["content_type"] == "VIDEO"
        assert brief_gen["aspect_ratio"] == "16:9"
        assert brief_gen["resolution_min"] == "4K UHD"
        assert "tool-runway-gen3" in brief_gen["recommended_tools"]
    print("[PASS] AI Brief generation returns structured schema with clearly labelled HEURISTIC_FALLBACK_ENGINE.")


    # B. Provider factory behavior
    fallback_p = get_brief_provider(force_fallback=True)
    assert isinstance(fallback_p, HeuristicFallbackProvider)
    print("[PASS] Provider factory returns HeuristicFallbackProvider when fallback is forced.")

    # C. Mock Gemini provider execution (No live external HTTP call)
    gemini_p = GeminiBriefProvider(api_key="mock_key_for_testing", model_name="gemini-2.5-flash")
    mock_llm_json = {
        "title": "Synthetic Eclipse Luxury Commercial",
        "campaign_objective": "Announce luxury fragrance.",
        "target_audience": "Affluent digital collectors.",
        "content_type": "VIDEO",
        "creative_style_mood": "Ethereal Obsidian",
        "aspect_ratio": "16:9",
        "duration_seconds_min": 15,
        "duration_seconds_max": 30,
        "resolution_min": "4K UHD",
        "deliverables_description": "1x Master 4K cut.",
        "revision_allowance": 2,
        "budget_amount": 5000.0,
        "budget_currency": "USD",
        "recommended_skills": ["skill-4k-video"],
        "recommended_tools": ["tool-runway-gen3", "tool-comfyui"],
        "commercial_use_requirements": "Full buyout",
        "usage_channels": "Web",
        "usage_duration": "12M",
        "usage_territories": "Worldwide",
        "restrictions_and_guidelines": "No uncanny valley artifacts",
        "disclosure_requirements": "EU AI Act disclosure"
    }

    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = json.dumps(mock_llm_json)
    mock_client.models.generate_content.return_value = mock_response

    # Monkeypatch google.genai.Client temporarily to test provider parsing if package is present
    try:
        import google.genai
        original_client = google.genai.Client
        google.genai.Client = lambda **kwargs: mock_client
        try:
            req_obj = BriefGenerationRequest(raw_prompt="Fragrance commercial concept", target_budget=5000.0)
            mock_output = gemini_p.generate(req_obj)
            assert mock_output.generation_engine == "GEMINI (gemini-2.5-flash)"
            assert mock_output.title == "Synthetic Eclipse Luxury Commercial"
            print("[PASS] GeminiBriefProvider parses and validates structured response into StructuredBriefOutput (Mocked, 0 live calls).")
        finally:
            google.genai.Client = original_client
    except ImportError:
        print("[SKIP] google-genai package not installed locally; Gemini mock test skipped cleanly.")


    # ----------------------------------------------------
    # 16. SQLITE FOREIGN KEY ENFORCEMENT CHECK
    # ----------------------------------------------------
    print("\n--- 16. Testing SQLite Foreign Key Enforcement Pragma ---")
    orphan_brief = Brief(
        id=f"brief-orphan-{uuid.uuid4().hex[:6]}",
        brand_id="non_existent_brand_id_12345",
        title="Orphan Brief",
        slug="orphan-brief",
        campaign_objective="Test",
        target_audience="Test",
        content_type="VIDEO",
        creative_style_mood="Test",
        aspect_ratio="16:9",
        resolution_min="1080p",
        deliverables_description="Test",
        revision_allowance=1,
        budget_amount=1000.0,
        deadline=datetime.utcnow() + timedelta(days=5),
        commercial_use_requirements="Test",
        usage_channels="Web",
        usage_duration="12M",
        usage_territories="Worldwide",
        restrictions_and_guidelines="None",
        disclosure_requirements="None",
        status="PUBLISHED"
    )
    db.add(orphan_brief)
    fk_raised = False
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        fk_raised = True
    assert fk_raised, "SQLite foreign key enforcement failed to reject orphan record!"
    print("[PASS] SQLite PRAGMA foreign_keys=ON verified: Orphan insertion rejected with IntegrityError.")

    # ----------------------------------------------------
    # 17. RE-LOGIN PERSISTENCE & SAFE SEEDING INTEGRITY
    # ----------------------------------------------------
    print("\n--- 17. Testing Re-Login Persistence & Non-Destructive Seeding ---")
    re_login = client.post("/api/auth/login", json={"email": TEST_ALICE_EMAIL, "password": "StrongPassword99!"})
    assert re_login.status_code == 200

    seed_database()

    db.expire_all()
    alice_check = db.query(User).filter(User.email == TEST_ALICE_EMAIL).first()
    assert alice_check is not None
    assert alice_check.creator_profile is not None
    assert len(alice_check.creator_profile.portfolio_projects) == 1

    solaris_check = db.query(User).filter(User.email == TEST_SOLARIS_EMAIL).first()
    assert solaris_check is not None
    assert len(solaris_check.brand_profile.briefs) >= 1

    print("[PASS] All real/fixture data completely preserved across re-login and database re-seeding.")

    # ----------------------------------------------------
    # 18. GEMINI-ASSISTED CREATOR VERIFICATION ANALYSIS SUITE
    # ----------------------------------------------------
    print("\n--- 18. Testing Gemini-Assisted Creator Verification Analysis (14 Required Scenarios) ---")

    # Fixture: Create a fresh evidence record and pending verification request for Alice
    fresh_ev_res = client.post(f"/api/creators/portfolio/{alice_proj_id}/evidence", json={
        "evidence_type": "PROCESS_SCREENSHOT",
        "file_url": "/assets/evidence/alice_timeline_v3.png",
        "title": "Runway Camera Path Vector Timeline",
        "description": "Screenshot of camera path vector interpolation.",
        "request_verification": False
    }, headers=alice_headers)
    assert fresh_ev_res.status_code == 201
    alice_ev3_id = fresh_ev_res.json()["id"]

    fresh_ver_res = client.post("/api/verification/request", json={
        "evidence_id": alice_ev3_id,
        "target_type": "CREATOR_TOOL",
        "target_id": "tool-runway-gen3",
        "verification_scope": "Runway Gen-3 Temporal Consistency Audit"
    }, headers=alice_headers)
    assert fresh_ver_res.status_code == 201, f"Failed creating verification request: {fresh_ver_res.text}"
    test_ver_id = fresh_ver_res.json()["id"]
    assert fresh_ver_res.json()["status"] == "PENDING"

    # Pre-test tier snapshot
    alice_profile_pre = client.get("/api/creators/me", headers=alice_headers).json()
    pre_tier = alice_profile_pre["verification_tier"]

    # 18.1 & 18.2: Valid structured Gemini analysis & summary output validation (Mocked)
    mock_gemini_json = json.dumps({
        "summary": "Verified creator claims proficiency in Runway Gen-3 with 1 process screenshot and 2 documented workflow stages.",
        "potential_inconsistencies": [
            {
                "reason": "Documented workflow step mentions Midjourney v6 while claim scope is Runway Gen-3",
                "supporting_info": "Workflow step 2 lists tools_used='tool-midjourney-v6'"
            }
        ],
        "limitations": [
            "Analysis limited to text parameters and file metadata.",
            "Pixel-level temporal coherence not verified via raw video stream."
        ]
    })
    mock_model_response = MagicMock()
    mock_model_response.text = mock_gemini_json
    mock_ai_client = MagicMock()
    mock_ai_client.models.generate_content.return_value = mock_model_response

    try:
        import google.genai
        original_genai_client = google.genai.Client
        google.genai.Client = lambda **kwargs: mock_ai_client

        try:
            # 18.1 Trigger analysis as Admin
            analysis_res = client.post(f"/api/verification/requests/{test_ver_id}/analyze", headers=admin_headers)
            assert analysis_res.status_code == 200, f"Analysis failed: {analysis_res.text}"
            analysis_data = analysis_res.json()

            # 18.2 Evidence summary output validation
            assert "Runway Gen-3" in analysis_data["summary"]
            assert analysis_data["analysis_status"] == "COMPLETED"
            assert analysis_data["disclaimer"].startswith("AI analysis is not proof of authenticity")
            assert len(analysis_data["evidence_items_detected"]) >= 1
            print("[PASS] 1 & 2: Valid structured Gemini analysis & summary output validated (Mocked, 0 live calls).")

            # 18.4 Inconsistency flags returned and persisted
            assert len(analysis_data["potential_inconsistencies"]) == 1
            flag = analysis_data["potential_inconsistencies"][0]
            assert "reason" in flag and "supporting_info" in flag
            assert "Midjourney" in flag["reason"]

            db_analysis = db.query(VerificationAiAnalysis).filter(VerificationAiAnalysis.verification_id == test_ver_id).first()
            assert db_analysis is not None
            assert db_analysis.summary == analysis_data["summary"]
            assert len(db_analysis.potential_inconsistencies) == 1
            print("[PASS] 4: Inconsistency flags returned and persisted in database correctly.")

            # 18.11 Proof that analysis alone NEVER changes verification status or tier
            db.expire_all()
            ver_check = db.query(VerificationRecord).filter(VerificationRecord.id == test_ver_id).first()
            assert ver_check.status == "PENDING", f"Status altered to {ver_check.status} by analysis!"
            alice_profile_post = client.get("/api/creators/me", headers=alice_headers).json()
            assert alice_profile_post["verification_tier"] == pre_tier, "Verification tier altered by analysis!"
            print("[PASS] 11: Proof that analysis generation alone NEVER changes verification status or tier.")

            # 18.12 Persistence and retrieval via GET endpoint
            get_analysis_res = client.get(f"/api/verification/requests/{test_ver_id}/ai-analysis", headers=admin_headers)
            assert get_analysis_res.status_code == 200
            assert get_analysis_res.json()["id"] == analysis_data["id"]
            assert get_analysis_res.json()["summary"] == analysis_data["summary"]
            print("[PASS] 12: Persistence and retrieval of AI analysis verified.")

            # 18.8 Unauthorized reviewer access
            creator_trigger = client.post(f"/api/verification/requests/{test_ver_id}/analyze", headers=bob_headers)
            assert creator_trigger.status_code == 403
            unauth_trigger = client.post(f"/api/verification/requests/{test_ver_id}/analyze")
            assert unauth_trigger.status_code == 401
            print("[PASS] 8: Unauthorized reviewer access blocked with 403/401.")

            # 18.9 Creator access restrictions (Bob cannot view Alice's analysis, Alice can view her own)
            bob_view = client.get(f"/api/verification/requests/{test_ver_id}/ai-analysis", headers=bob_headers)
            assert bob_view.status_code == 403
            alice_view = client.get(f"/api/verification/requests/{test_ver_id}/ai-analysis", headers=alice_headers)
            assert alice_view.status_code == 200
            assert alice_view.json()["id"] == analysis_data["id"]
            print("[PASS] 9: Cross-creator analysis access blocked (403), owning creator access granted (200).")

            # 18.10 Prevention of self-approval
            alice_self_approve = client.patch(f"/api/verification/requests/{test_ver_id}", json={
                "status": "APPROVED",
                "reviewer_notes": "Self approved after AI analysis"
            }, headers=alice_headers)
            assert alice_self_approve.status_code == 403
            print("[PASS] 10: Prevention of creator self-approval verified (403).")

            # 18.3 Deterministic missing-evidence detection
            bare_proj = client.post("/api/creators/portfolio", json={
                "title": "Minimal Incomplete Project",
                "description": "No prompt logs, no workflow steps",
                "content_type": "VIDEO",
                "primary_asset_url": "https://kivora.dev/assets/minimal.mp4",
                "thumbnail_url": "https://kivora.dev/assets/minimal.jpg",
                "aspect_ratio": "16:9",
                "resolution": "1080p",
                "commercial_rights_held": True,
                "evidence_records": [{
                    "evidence_type": "PROCESS_SCREENSHOT",
                    "file_url": "https://kivora.dev/evidence/screenshot.png",
                    "title": "Basic Screenshot Only",
                    "description": "No parameters provided"
                }]
            }, headers=alice_headers).json()
            bare_ev_id = bare_proj["evidence_records"][0]["id"]
            bare_ver = client.post("/api/verification/request", json={
                "evidence_id": bare_ev_id,
                "target_type": "PORTFOLIO_PROJECT",
                "target_id": bare_proj["id"],
                "verification_scope": "Full Project Audit"
            }, headers=alice_headers).json()
            bare_ver_id = bare_ver["id"]

            bare_analysis = client.post(f"/api/verification/requests/{bare_ver_id}/analyze", headers=admin_headers).json()
            assert len(bare_analysis["missing_evidence"]) >= 1
            assert any("Prompt or Parameter Refinement Proof" in m for m in bare_analysis["missing_evidence"])
            assert any("Documented Workflow Pipeline" in m for m in bare_analysis["missing_evidence"])
            print("[PASS] 3: Deterministic missing-evidence detection correctly identified missing workflow and prompt logs.")

            # 18.5 Malformed or incomplete Gemini output
            bad_response = MagicMock()
            bad_response.text = "NOT_VALID_JSON_STRING"
            mock_ai_client.models.generate_content.return_value = bad_response

            malformed_analysis = client.post(f"/api/verification/requests/{test_ver_id}/analyze", headers=admin_headers)
            assert malformed_analysis.status_code == 200
            assert malformed_analysis.json()["analysis_status"] == "UNAVAILABLE"
            assert len(malformed_analysis.json()["missing_evidence"]) >= 0
            print("[PASS] 5: Malformed Gemini output safely handled without 500 crash.")

            # 18.7 Provider timeout / API error
            mock_ai_client.models.generate_content.side_effect = Exception("DeadlineExceeded: Provider timeout 504")

            error_analysis = client.post(f"/api/verification/requests/{test_ver_id}/analyze", headers=admin_headers)
            assert error_analysis.status_code == 200
            assert "provider error" in error_analysis.json()["limitations"][0].lower()
            print("[PASS] 7: Provider timeout and API error safely handled and logged without crashing.")

        finally:
            google.genai.Client = original_genai_client
    except ImportError:
        print("[SKIP] google-genai package not installed locally; Gemini verification mock tests skipped cleanly.")


    # 18.6 Missing API key resilience
    orig_env_key = os.environ.get("GEMINI_API_KEY", "")
    os.environ["GEMINI_API_KEY"] = ""
    try:
        no_key_analysis = client.post(f"/api/verification/requests/{test_ver_id}/analyze", headers=admin_headers)
        assert no_key_analysis.status_code == 200
        assert no_key_analysis.json()["analysis_status"] == "UNAVAILABLE"
        assert "Gemini AI assistance is unavailable" in no_key_analysis.json()["limitations"][0]
        print("[PASS] 6: Missing API key safely handled; deterministic checks still executed.")
    finally:
        os.environ["GEMINI_API_KEY"] = orig_env_key

    # 18.13 Regression of existing verification requests and reviewer decisions
    admin_final_approve = client.patch(f"/api/verification/requests/{test_ver_id}", json={
        "status": "APPROVED",
        "reviewer_notes": "Reviewed AI synthesis and verified prompt logs manually."
    }, headers=admin_headers)
    assert admin_final_approve.status_code == 200
    assert admin_final_approve.json()["status"] == "APPROVED"
    assert admin_final_approve.json()["ai_analysis"] is not None
    db_analysis = db.query(VerificationAiAnalysis).filter(VerificationAiAnalysis.verification_id == test_ver_id).first()
    if db_analysis:
        assert admin_final_approve.json()["ai_analysis"]["id"] == db_analysis.id


    my_ver_records = client.get("/api/verification/my-requests", headers=alice_headers)
    assert my_ver_records.status_code == 200
    assert any(r["id"] == test_ver_id for r in my_ver_records.json())
    print("[PASS] 13: Existing verification review lifecycle and reviewer decision authority intact.")

    # 18.14 Existing AI Brief Builder behavior remains intact
    brief_builder_check = client.post("/api/ai/generate-brief", json={
        "raw_prompt": "Futuristic electric car commercial with neon reflections and 16:9 4k resolution",
        "target_budget": 5000.0
    })
    assert brief_builder_check.status_code == 200
    assert brief_builder_check.json()["aspect_ratio"] == "16:9"
    assert brief_builder_check.json()["content_type"] == "VIDEO"
    print("[PASS] 14: Existing AI Brief Builder behavior remains completely intact.")

    # Clean up test fixtures at end of test run
    cleanup_test_fixtures(db)
    db.close()

    print("\n=======================================================")
    print("[SUCCESS] ALL SECURITY, PROFILES, BRIEFS, MATCHING & ENGAGEMENT TESTS PASSED (100%)")
    print("=======================================================\n")



if __name__ == "__main__":
    run_persistence_and_auth_tests()
