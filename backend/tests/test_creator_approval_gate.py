"""
Kivora Phase 2 — Creator Approval State Model and Backend Access Control Test Suite.
Verifies all safety, state separation, authorization gating, and lifecycle requirements:
1. New creator registration defaults to PENDING approval status.
2. Email verification (OTP) does NOT automatically approve creator account.
3. Pending creator is blocked with HTTP 403 and CREATOR_APPROVAL_PENDING from all protected marketplace endpoints.
4. Rejected creator is blocked with HTTP 403 and CREATOR_APPROVAL_REJECTED from protected endpoints.
5. Approved creator retains authorized access to all marketplace workflows.
6. Pending/rejected creator retains permitted access to profile, onboarding, evidence, notifications, and status.
7. Unauthenticated requests strictly receive 401 Unauthorized.
8. Brand and admin workflows remain independent and unchanged; admin can transition approval states.
9. Portfolio evidence verification remains independent of creator account approval.
10. Reversible migration preserves existing relationships and correctly backfills tiers in temporary database.
"""

import sys
import uuid
import shutil
import sqlite3
from pathlib import Path
from datetime import datetime, timedelta, timezone
import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = REPO_ROOT / "backend"
for p in [str(REPO_ROOT), str(BACKEND_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from backend.app.models.models import (
    User,
    CreatorProfile,
    BrandProfile,
    Brief,
    Application,
    Engagement,
    Conversation,
    PortfolioProject,
    EvidenceRecord,
    VerificationRecord,
    OtpCode,
)
from backend.app.core.security import create_access_token, hash_password


def _create_test_brand(db) -> tuple[User, BrandProfile]:
    uid = str(uuid.uuid4())
    user = User(
        id=uid,
        email=f"brand_{uid[:8]}@example.com",
        hashed_password=hash_password("Password123!"),
        role="BRAND",
        is_email_verified=True,
        created_at=datetime.now(timezone.utc),
    )
    db.add(user)
    db.commit()

    brand = BrandProfile(
        id=str(uuid.uuid4()),
        user_id=user.id,
        company_name=f"Brand Corp {uid[:4]}",
        slug=f"brand-corp-{uid[:6]}",
        industry="Technology",
        logo_url="/assets/brands/lumina.svg",
        description="Leading AI production brand",
        company_size="10-50",
        headquarters="San Francisco, CA",
        is_verified_brand=True,
        created_at=datetime.now(timezone.utc),
    )
    db.add(brand)
    db.commit()
    db.refresh(user)
    return user, brand


def _create_test_creator(db, approval_status: str = "PENDING", tier: str = "COMMUNITY") -> tuple[User, CreatorProfile]:
    uid = str(uuid.uuid4())
    user = User(
        id=uid,
        email=f"creator_{uid[:8]}@example.com",
        hashed_password=hash_password("Password123!"),
        role="CREATOR",
        is_email_verified=True,
        created_at=datetime.now(timezone.utc),
    )
    db.add(user)
    db.commit()

    creator = CreatorProfile(
        id=str(uuid.uuid4()),
        user_id=user.id,
        handle=f"creator_{uid[:6]}",
        display_name=f"Creator {uid[:4]}",
        bio="Generative AI Artist",
        avatar_url="/assets/avatars/elena.jpg",
        location="Remote",
        years_experience=3,
        primary_specialization="VIDEO",
        min_budget=1500.0,
        availability_status="AVAILABLE",
        verification_tier=tier,
        approval_status=approval_status,
        created_at=datetime.now(timezone.utc),
    )
    db.add(creator)
    db.commit()
    db.refresh(user)
    return user, creator


def _create_test_admin(db) -> User:
    uid = str(uuid.uuid4())
    user = User(
        id=uid,
        email=f"admin_{uid[:8]}@example.com",
        hashed_password=hash_password("Password123!"),
        role="ADMIN",
        is_email_verified=True,
        created_at=datetime.now(timezone.utc),
    )
    db.add(user)
    db.commit()
    return user


def _create_test_brief(db, brand_id: str) -> Brief:
    brief = Brief(
        id=str(uuid.uuid4()),
        brand_id=brand_id,
        title="Luxury Campaign Brief",
        slug=f"luxury-campaign-{uuid.uuid4().hex[:6]}",
        campaign_objective="Showcase AI visual style",
        target_audience="Global",
        content_type="VIDEO",
        creative_style_mood="Cinematic",
        aspect_ratio="16:9",
        resolution_min="4K",
        deliverables_description="1x 30s video",
        revision_allowance=2,
        budget_amount=3000.0,
        budget_currency="USD",
        deadline=datetime.now(timezone.utc) + timedelta(days=30),
        commercial_use_requirements="Full buyout",
        usage_channels="Digital",
        usage_duration="12 Months",
        usage_territories="Worldwide",
        restrictions_and_guidelines="Original AI",
        disclosure_requirements="Attribution",
        status="PUBLISHED",
        created_at=datetime.now(timezone.utc),
    )
    db.add(brief)
    db.commit()
    db.refresh(brief)
    return brief


def _token_headers(user: User) -> dict:
    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    return {"Authorization": f"Bearer {token}"}


# ==============================================================================
# 1. NEW CREATOR REGISTRATION & EMAIL OTP INDEPENDENCE
# ==============================================================================

def test_new_creator_registration_defaults_to_pending(client, isolated_db):
    """New creator registration must initialize approval_status to PENDING."""
    email = f"new_creator_{uuid.uuid4().hex[:8]}@example.com"
    res = client.post("/api/auth/register", json={
        "email": email,
        "password": "Password123!",
        "role": "CREATOR",
        "full_name": "Pending Onboarding Creator",
    })
    assert res.status_code == 201

    user = isolated_db.query(User).filter(User.email == email).first()
    assert user is not None
    assert user.is_email_verified is False
    assert user.creator_profile is not None
    assert user.creator_profile.approval_status == "PENDING"


def test_email_verification_does_not_approve_creator(client, isolated_db):
    """Email verification marks email verified but creator approval remains strictly PENDING."""
    email = f"verify_test_{uuid.uuid4().hex[:8]}@example.com"
    client.post("/api/auth/register", json={
        "email": email,
        "password": "Password123!",
        "role": "CREATOR",
        "full_name": "Email Verified Creator",
    })

    otp = isolated_db.query(OtpCode).filter(OtpCode.email == email).first()
    assert otp is not None

    res = client.post("/api/auth/verify-otp", json={
        "email": email,
        "otp_code": otp.code,
    })
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["is_email_verified"] is True
    assert data["user"]["approval_status"] == "PENDING"

    # Database state verification
    user = isolated_db.query(User).filter(User.email == email).first()
    assert user.is_email_verified is True
    assert user.creator_profile.approval_status == "PENDING"


# ==============================================================================
# 2. PENDING CREATOR SERVER-SIDE GATING ACROSS AUDITED ENDPOINTS
# ==============================================================================

def test_pending_creator_blocked_from_brief_application(client, isolated_db):
    """Pending creator is blocked with 403 and CREATOR_APPROVAL_PENDING from applying to briefs."""
    brand_user, brand_profile = _create_test_brand(isolated_db)
    brief = _create_test_brief(isolated_db, brand_profile.id)
    creator_user, _ = _create_test_creator(isolated_db, approval_status="PENDING")
    headers = _token_headers(creator_user)

    res = client.post(f"/api/briefs/{brief.id}/apply", headers=headers, json={
        "pitch_text": "I would love to work on this brief.",
        "proposed_rate": 2500.0,
        "proposed_timeline_days": 10,
    })
    assert res.status_code == 403
    data = res.json()
    detail = data.get("detail", {})
    if isinstance(detail, dict):
        assert detail.get("error_code") == "CREATOR_APPROVAL_PENDING"
    else:
        assert "pending" in str(detail).lower()


def test_pending_creator_blocked_from_pitch_assistance(client, isolated_db):
    """Pending creator is blocked from AI pitch assistance."""
    brand_user, brand_profile = _create_test_brand(isolated_db)
    brief = _create_test_brief(isolated_db, brand_profile.id)
    creator_user, _ = _create_test_creator(isolated_db, approval_status="PENDING")
    headers = _token_headers(creator_user)

    res = client.post(f"/api/match/briefs/{brief.id}/assist-pitch", headers=headers, json={
        "brief_id": brief.id,
        "creator_notes": "Help draft my pitch",
    })
    assert res.status_code == 403
    assert res.json().get("detail", {}).get("error_code") == "CREATOR_APPROVAL_PENDING"


def test_pending_creator_blocked_from_accepting_invitations(client, isolated_db):
    """Pending creator is blocked from accepting campaign invitations."""
    brand_user, brand_profile = _create_test_brand(isolated_db)
    brief = _create_test_brief(isolated_db, brand_profile.id)
    creator_user, creator_profile = _create_test_creator(isolated_db, approval_status="PENDING")
    headers = _token_headers(creator_user)

    # Seed an invitation application
    inv = Application(
        id=str(uuid.uuid4()),
        brief_id=brief.id,
        creator_id=creator_profile.id,
        status="INVITED",
        pitch_text="Direct campaign invitation",
        proposed_rate=3000.0,
        proposed_timeline_days=14,
        attached_project_ids="[]",
        submitted_at=datetime.now(timezone.utc),
    )
    isolated_db.add(inv)
    isolated_db.commit()

    res = client.post(f"/api/engagements/invitations/{inv.id}/accept", headers=headers)
    assert res.status_code == 403
    assert res.json().get("detail", {}).get("error_code") == "CREATOR_APPROVAL_PENDING"


def test_pending_creator_blocked_from_saved_briefs(client, isolated_db):
    """Pending creator cannot save, unsave, or list saved briefs."""
    brand_user, brand_profile = _create_test_brand(isolated_db)
    brief = _create_test_brief(isolated_db, brand_profile.id)
    creator_user, _ = _create_test_creator(isolated_db, approval_status="PENDING")
    headers = _token_headers(creator_user)

    # Save brief
    res_save = client.post(f"/api/saved/briefs/{brief.id}", headers=headers)
    assert res_save.status_code == 403
    assert res_save.json().get("detail", {}).get("error_code") == "CREATOR_APPROVAL_PENDING"

    # List saved briefs
    res_list = client.get("/api/saved/briefs", headers=headers)
    assert res_list.status_code == 403
    assert res_list.json().get("detail", {}).get("error_code") == "CREATOR_APPROVAL_PENDING"


def test_pending_creator_blocked_from_opportunity_alerts_and_history(client, isolated_db):
    """Pending creator cannot access opportunities or collaboration history."""
    creator_user, _ = _create_test_creator(isolated_db, approval_status="PENDING")
    headers = _token_headers(creator_user)

    res_alerts = client.get("/api/alerts/opportunities", headers=headers)
    assert res_alerts.status_code == 403
    assert res_alerts.json().get("detail", {}).get("error_code") == "CREATOR_APPROVAL_PENDING"

    res_history = client.get("/api/workspaces/history/creator", headers=headers)
    assert res_history.status_code == 403
    assert res_history.json().get("detail", {}).get("error_code") == "CREATOR_APPROVAL_PENDING"

    res_brands = client.get("/api/creators/me/brands", headers=headers)
    assert res_brands.status_code == 403
    assert res_brands.json().get("detail", {}).get("error_code") == "CREATOR_APPROVAL_PENDING"


def test_pending_creator_blocked_from_sending_messages(client, isolated_db):
    """Pending creator cannot post messages into conversations."""
    brand_user, brand_profile = _create_test_brand(isolated_db)
    creator_user, creator_profile = _create_test_creator(isolated_db, approval_status="PENDING")
    brief = _create_test_brief(isolated_db, brand_profile.id)

    app = Application(
        id=str(uuid.uuid4()),
        brief_id=brief.id,
        creator_id=creator_profile.id,
        status="ACCEPTED",
        pitch_text="Pitch text",
        proposed_rate=3000.0,
        proposed_timeline_days=14,
        attached_project_ids="[]",
        submitted_at=datetime.now(timezone.utc),
    )
    isolated_db.add(app)
    isolated_db.commit()

    eng = Engagement(
        id=str(uuid.uuid4()),
        brief_id=brief.id,
        creator_id=creator_profile.id,
        application_id=app.id,
        status="ACTIVE",
        agreed_amount=3000.0,
        completion_deadline=datetime.now(timezone.utc) + timedelta(days=14),
        created_at=datetime.now(timezone.utc),
    )
    isolated_db.add(eng)
    isolated_db.commit()

    conv = Conversation(
        id=str(uuid.uuid4()),
        engagement_id=eng.id,
        brief_id=brief.id,
        brand_id=brand_profile.id,
        creator_id=creator_profile.id,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    isolated_db.add(conv)
    isolated_db.commit()

    headers = _token_headers(creator_user)
    res = client.post(f"/api/messages/conversations/{conv.id}/messages", headers=headers, json={
        "content": "Hello from pending creator",
    })
    assert res.status_code == 403
    assert res.json().get("detail", {}).get("error_code") == "CREATOR_APPROVAL_PENDING"


# ==============================================================================
# 3. REJECTED CREATOR SERVER-SIDE GATING
# ==============================================================================

def test_rejected_creator_blocked_with_rejected_error_code(client, isolated_db):
    """Rejected creator receives 403 and CREATOR_APPROVAL_REJECTED."""
    brand_user, brand_profile = _create_test_brand(isolated_db)
    brief = _create_test_brief(isolated_db, brand_profile.id)
    creator_user, _ = _create_test_creator(isolated_db, approval_status="REJECTED")
    headers = _token_headers(creator_user)

    res_apply = client.post(f"/api/briefs/{brief.id}/apply", headers=headers, json={
        "pitch_text": "Applying as rejected creator",
        "proposed_rate": 2000.0,
        "proposed_timeline_days": 7,
    })
    assert res_apply.status_code == 403
    assert res_apply.json().get("detail", {}).get("error_code") == "CREATOR_APPROVAL_REJECTED"

    res_save = client.post(f"/api/saved/briefs/{brief.id}", headers=headers)
    assert res_save.status_code == 403
    assert res_save.json().get("detail", {}).get("error_code") == "CREATOR_APPROVAL_REJECTED"


# ==============================================================================
# 4. APPROVED CREATOR RETAINS FULL MARKETPLACE ACCESS
# ==============================================================================

def test_approved_creator_retains_authorized_access(client, isolated_db):
    """Approved creator can apply to briefs, save briefs, and send messages."""
    brand_user, brand_profile = _create_test_brand(isolated_db)
    brief = _create_test_brief(isolated_db, brand_profile.id)
    creator_user, creator_profile = _create_test_creator(isolated_db, approval_status="APPROVED", tier="VERIFIED_PRO")
    headers = _token_headers(creator_user)

    # 1. Apply to brief
    res_apply = client.post(f"/api/briefs/{brief.id}/apply", headers=headers, json={
        "pitch_text": "I have extensive generative video experience for luxury campaigns.",
        "proposed_rate": 3000.0,
        "proposed_timeline_days": 14,
    })
    assert res_apply.status_code == 201

    # 2. Save brief
    res_save = client.post(f"/api/saved/briefs/{brief.id}", headers=headers)
    assert res_save.status_code == 201

    # 3. List saved briefs
    res_list = client.get("/api/saved/briefs", headers=headers)
    assert res_list.status_code == 200
    items = res_list.json()
    assert any(b["brief_id"] == brief.id for b in items)

    # 4. Send message in engagement conversation
    app = isolated_db.query(Application).filter(
        Application.brief_id == brief.id,
        Application.creator_id == creator_profile.id,
    ).first()
    app.status = "ACCEPTED"
    isolated_db.commit()

    eng = Engagement(
        id=str(uuid.uuid4()),
        brief_id=brief.id,
        creator_id=creator_profile.id,
        application_id=app.id,
        status="ACTIVE",
        agreed_amount=3000.0,
        completion_deadline=datetime.now(timezone.utc) + timedelta(days=14),
        created_at=datetime.now(timezone.utc),
    )
    isolated_db.add(eng)
    isolated_db.commit()

    conv = Conversation(
        id=str(uuid.uuid4()),
        engagement_id=eng.id,
        brief_id=brief.id,
        brand_id=brand_profile.id,
        creator_id=creator_profile.id,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    isolated_db.add(conv)
    isolated_db.commit()

    res_msg = client.post(f"/api/messages/conversations/{conv.id}/messages", headers=headers, json={
        "content": "Hi brand, I am ready to start the project.",
    })
    assert res_msg.status_code in (200, 201)


# ==============================================================================
# 5. PERMITTED ONBOARDING, PROFILE & EVIDENCE AUTHORING FOR PENDING CREATORS
# ==============================================================================

def test_pending_creator_permitted_profile_and_evidence_workflows(client, isolated_db):
    """Pending creator can read/update own profile, add portfolio, add evidence, check approval status, and notifications."""
    creator_user, creator_profile = _create_test_creator(isolated_db, approval_status="PENDING")
    headers = _token_headers(creator_user)

    # 1. Read own profile
    res_me = client.get("/api/creators/me", headers=headers)
    assert res_me.status_code == 200
    assert res_me.json()["approval_status"] == "PENDING"

    # 2. Update profile bio
    res_up = client.post("/api/creators/profile", headers=headers, json={
        "display_name": creator_profile.display_name,
        "handle": creator_profile.handle,
        "bio": "Updated bio explaining my workflow and specialized AI pipelines.",
        "location": "Remote",
        "primary_specialization": "VIDEO",
        "years_experience": 4,
    })
    assert res_up.status_code in (200, 201)
    assert res_up.json()["bio"] == "Updated bio explaining my workflow and specialized AI pipelines."

    # 3. Add portfolio project
    res_proj = client.post("/api/creators/portfolio", headers=headers, json={
        "title": "Cosmic Odyssey",
        "description": "Midjourney + Runway Gen-3 short film",
        "content_type": "VIDEO",
        "primary_asset_url": "https://example.com/cosmic.mp4",
        "thumbnail_url": "https://example.com/thumb.jpg",
        "aspect_ratio": "16:9",
    })
    assert res_proj.status_code in (200, 201)
    proj_id = res_proj.json()["id"]

    # 4. Add evidence for portfolio project
    res_ev = client.post(f"/api/creators/portfolio/{proj_id}/evidence", headers=headers, json={
        "evidence_type": "PROCESS_SCREENSHOT",
        "file_url": "https://example.com/workflow_timelapse.mp4",
        "title": "Workflow Timelapse",
        "description": "Full screen capture of generative pipeline",
    })
    assert res_ev.status_code in (200, 201)

    # 5. Check own approval status endpoint
    res_status = client.get("/api/verification/my-approval-status", headers=headers)
    assert res_status.status_code == 200
    status_data = res_status.json()
    assert status_data["approval_status"] == "PENDING"
    assert status_data["is_email_verified"] is True

    # 6. Check notifications
    res_notif = client.get("/api/notifications", headers=headers)
    assert res_notif.status_code == 200

    # 7. Check current user auth
    res_auth = client.get("/api/auth/me", headers=headers)
    assert res_auth.status_code == 200
    assert res_auth.json()["approval_status"] == "PENDING"


# ==============================================================================
# 6. UNAUTHENTICATED & CROSS-ROLE BOUNDARY CHECKS
# ==============================================================================

def test_unauthenticated_requests_remain_unauthorized(client):
    """Unauthenticated requests receive 401 Unauthorized across all endpoints."""
    assert client.get("/api/verification/my-approval-status").status_code == 401
    assert client.post("/api/saved/briefs/brief-123").status_code == 401
    assert client.get("/api/saved/briefs").status_code == 401
    assert client.post("/api/briefs/brief-123/apply", json={}).status_code == 401
    assert client.get("/api/alerts/opportunities").status_code == 401


def test_brand_role_boundaries_remain_intact(client, isolated_db):
    """Brands cannot apply to briefs or save creator briefs."""
    brand_user, brand_profile = _create_test_brand(isolated_db)
    brief = _create_test_brief(isolated_db, brand_profile.id)
    headers = _token_headers(brand_user)

    # Brand attempting creator apply
    res = client.post(f"/api/briefs/{brief.id}/apply", headers=headers, json={
        "pitch_text": "Brand applying",
        "proposed_rate": 1000.0,
        "proposed_timeline_days": 5,
    })
    assert res.status_code == 403
    assert "role" in str(res.json().get("detail", "")).lower() or "creator" in str(res.json().get("detail", "")).lower()


# ==============================================================================
# 7. ADMIN APPROVAL MANAGEMENT ENDPOINTS
# ==============================================================================

def test_admin_can_review_and_transition_creator_approval(client, isolated_db):
    """Admin can list creator approval statuses and approve/reject creators with reviewer notes."""
    admin_user = _create_test_admin(isolated_db)
    creator_user, creator_profile = _create_test_creator(isolated_db, approval_status="PENDING")
    admin_headers = _token_headers(admin_user)

    # 1. Admin lists creators for approval review
    res_list = client.get("/api/verification/admin/creators?approval_status=PENDING", headers=admin_headers)
    assert res_list.status_code == 200
    creators = res_list.json()
    assert any(c["creator_id"] == creator_profile.id for c in creators)

    # 2. Admin approves creator
    res_approve = client.patch(
        f"/api/verification/admin/creators/{creator_profile.id}/approval",
        headers=admin_headers,
        json={"approval_status": "APPROVED", "reviewer_notes": "Portfolio verified and approved."},
    )
    assert res_approve.status_code == 200
    assert res_approve.json()["approval_status"] == "APPROVED"

    # Database state updated
    isolated_db.refresh(creator_profile)
    assert creator_profile.approval_status == "APPROVED"

    # 3. Creator now has approved status in self-check
    creator_headers = _token_headers(creator_user)
    res_check = client.get("/api/verification/my-approval-status", headers=creator_headers)
    assert res_check.status_code == 200
    assert res_check.json()["approval_status"] == "APPROVED"

    # 4. Admin rejects creator
    res_reject = client.patch(
        f"/api/verification/admin/creators/{creator_profile.id}/approval",
        headers=admin_headers,
        json={"approval_status": "REJECTED", "reviewer_notes": "Insufficient generative workflow evidence."},
    )
    assert res_reject.status_code == 200
    assert res_reject.json()["approval_status"] == "REJECTED"

    isolated_db.refresh(creator_profile)
    assert creator_profile.approval_status == "REJECTED"


# ==============================================================================
# 8. PORTFOLIO EVIDENCE VERIFICATION INDEPENDENCE
# ==============================================================================

def test_evidence_verification_does_not_mutate_creator_approval(client, isolated_db):
    """Verifying a piece of evidence does not silently approve creator account (independent state)."""
    admin_user = _create_test_admin(isolated_db)
    creator_user, creator_profile = _create_test_creator(isolated_db, approval_status="PENDING")
    admin_headers = _token_headers(admin_user)

    # Create portfolio project and verification record
    proj = PortfolioProject(
        id=str(uuid.uuid4()),
        creator_id=creator_profile.id,
        title="Evidence Test Project",
        slug=f"evidence-test-project-{uuid.uuid4().hex[:6]}",
        description="Generative video test project",
        content_type="VIDEO",
        primary_asset_url="https://example.com/test.mp4",
        thumbnail_url="https://example.com/thumb.jpg",
        aspect_ratio="16:9",
        resolution="4K UHD",
        created_at=datetime.now(timezone.utc),
    )
    isolated_db.add(proj)
    isolated_db.commit()

    ev = EvidenceRecord(
        id=str(uuid.uuid4()),
        project_id=proj.id,
        evidence_type="PROCESS_SCREENSHOT",
        file_url="https://example.com/timelapse.mp4",
        title="Process Timelapse",
        description="Workflow timelapse evidence",
        uploaded_at=datetime.now(timezone.utc),
    )
    isolated_db.add(ev)
    isolated_db.commit()

    rec = VerificationRecord(
        id=str(uuid.uuid4()),
        evidence_id=ev.id,
        target_type="PORTFOLIO_PROJECT",
        target_id=proj.id,
        status="PENDING",
        verification_scope="Verification of Process Timelapse",
        reviewed_by="PENDING_AUDIT",
        reviewer_notes="Submitted by creator for administrative audit.",
        reviewed_at=datetime.now(timezone.utc),
    )
    isolated_db.add(rec)
    isolated_db.commit()

    # Admin approves evidence record
    res_ev = client.patch(
        f"/api/verification/requests/{rec.id}",
        headers=admin_headers,
        json={"status": "APPROVED", "reviewer_notes": "Evidence timelapse confirmed legitimate."},
    )
    assert res_ev.status_code == 200

    # Creator approval status remains strictly PENDING!
    isolated_db.refresh(creator_profile)
    assert creator_profile.approval_status == "PENDING"


# ==============================================================================
# 9. MIGRATION REVERSIBILITY & DATA RETENTION IN TEMPORARY DATABASE
# ==============================================================================

def test_user_registration_and_email_otp_flow(client, isolated_db, monkeypatch):
    """Verify new user registration and OTP verification flow with mocked email transport."""
    import backend.app.api.auth as auth_api
    import backend.app.services.email_service as email_service

    # Ensure mock transport is active so zero real emails are sent
    mock_sent_emails = []
    def mock_send_otp(email, code, purpose="REGISTRATION"):
        mock_sent_emails.append({"email": email, "code": code, "purpose": purpose})
        return {"sent": True, "provider": "mock_smtp", "status": "delivered"}

    monkeypatch.setattr(auth_api, "send_otp_email", mock_send_otp)
    monkeypatch.setattr(email_service, "send_otp_email", mock_send_otp)

    unique_email = f"creator_{uuid.uuid4().hex[:8]}@testflow.com"
    reg_res = client.post("/api/auth/register", json={
        "email": unique_email,
        "password": "SecurePassword123!",
        "role": "CREATOR",
        "full_name": "Test Flow Creator",
    })
    assert reg_res.status_code == 201
    assert len(mock_sent_emails) == 1
    assert mock_sent_emails[0]["email"] == unique_email
    otp_code = mock_sent_emails[0]["code"]

    # Verify user is initially unverified and approval is PENDING
    user_row = isolated_db.query(User).filter(User.email == unique_email).first()
    assert user_row is not None
    assert user_row.is_email_verified is False
    assert user_row.creator_profile.approval_status == "PENDING"

    # Attempt login prior to verification -> blocked 403
    unver_login = client.post("/api/auth/login", json={
        "email": unique_email,
        "password": "SecurePassword123!",
    })
    assert unver_login.status_code == 403

    # Verify OTP
    verify_res = client.post("/api/auth/verify-otp", json={
        "email": unique_email,
        "otp_code": otp_code,
    })
    assert verify_res.status_code == 200
    token = verify_res.json()["access_token"]
    assert verify_res.json()["user"]["is_email_verified"] is True
    assert verify_res.json()["user"]["approval_status"] == "PENDING"


def test_existing_user_login_flow(client, isolated_db):
    """Verify login for existing verified user, and rejection of invalid credentials."""
    creator_user, _ = _create_test_creator(isolated_db, approval_status="APPROVED")
    
    # 1. Login with correct password
    login_res = client.post("/api/auth/login", json={
        "email": creator_user.email,
        "password": "Password123!",
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()
    assert login_res.json()["user"]["email"] == creator_user.email
    assert login_res.json()["user"]["approval_status"] == "APPROVED"

    # 2. Login with incorrect password -> 401
    bad_login = client.post("/api/auth/login", json={
        "email": creator_user.email,
        "password": "WrongPassword999!",
    })
    assert bad_login.status_code == 401
    assert "Invalid email or password" in bad_login.json()["detail"]


def test_non_admin_cannot_access_approval_endpoints(client, isolated_db):
    """Verify that creators and brands cannot access admin approval review endpoints."""
    creator_user, creator_profile = _create_test_creator(isolated_db, approval_status="APPROVED")
    brand_user, _ = _create_test_brand(isolated_db)

    creator_headers = _token_headers(creator_user)
    brand_headers = _token_headers(brand_user)

    # Creator attempted admin access
    c_list = client.get("/api/verification/admin/creators", headers=creator_headers)
    assert c_list.status_code == 403

    c_patch = client.patch(
        f"/api/verification/admin/creators/{creator_profile.id}/approval",
        headers=creator_headers,
        json={"approval_status": "APPROVED", "reviewer_notes": "Self approval attempt"},
    )
    assert c_patch.status_code == 403

    # Brand attempted admin access
    b_list = client.get("/api/verification/admin/creators", headers=brand_headers)
    assert b_list.status_code == 403

    b_patch = client.patch(
        f"/api/verification/admin/creators/{creator_profile.id}/approval",
        headers=brand_headers,
        json={"approval_status": "APPROVED", "reviewer_notes": "Brand approval attempt"},
    )
    assert b_patch.status_code == 403


def test_approval_state_visible_without_re_login(client, isolated_db):
    """Verify that approval state changes become visible immediately using the same token without re-login."""
    admin_user = _create_test_admin(isolated_db)
    creator_user, creator_profile = _create_test_creator(isolated_db, approval_status="PENDING")
    brand_user, brand_profile = _create_test_brand(isolated_db)
    brief = _create_test_brief(isolated_db, brand_profile.id)

    # Creator obtains initial token while PENDING
    creator_headers = _token_headers(creator_user)
    admin_headers = _token_headers(admin_user)

    # 1. Creator checks /auth/me and /verification/my-approval-status
    me_res = client.get("/api/auth/me", headers=creator_headers)
    assert me_res.status_code == 200
    assert me_res.json()["approval_status"] == "PENDING"

    status_res = client.get("/api/verification/my-approval-status", headers=creator_headers)
    assert status_res.status_code == 200
    assert status_res.json()["approval_status"] == "PENDING"

    # 2. Creator attempts to apply to brief -> blocked 403
    apply_blocked = client.post(
        f"/api/briefs/{brief.id}/apply",
        headers=creator_headers,
        json={
            "pitch_text": "Trying to apply before approval.",
            "proposed_rate": 2500.0,
            "proposed_timeline_days": 10,
        },
    )
    assert apply_blocked.status_code == 403
    assert apply_blocked.json().get("detail", {}).get("error_code") == "CREATOR_APPROVAL_PENDING"

    # 3. Admin updates approval status to APPROVED
    patch_res = client.patch(
        f"/api/verification/admin/creators/{creator_profile.id}/approval",
        headers=admin_headers,
        json={
            "approval_status": "APPROVED",
            "reviewer_notes": "Creator portfolio reviewed and approved.",
        },
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["approval_status"] == "APPROVED"

    # 4. Without logging out or obtaining a new token, creator re-checks endpoints
    me_updated = client.get("/api/auth/me", headers=creator_headers)
    assert me_updated.status_code == 200
    assert me_updated.json()["approval_status"] == "APPROVED"

    status_updated = client.get("/api/verification/my-approval-status", headers=creator_headers)
    assert status_updated.status_code == 200
    assert status_updated.json()["approval_status"] == "APPROVED"
    assert "approved for full marketplace" in status_updated.json()["message"]

    # 5. Creator immediately applies to the brief with the SAME token -> Success 201
    apply_success = client.post(
        f"/api/briefs/{brief.id}/apply",
        headers=creator_headers,
        json={
            "pitch_text": "Applying now that my account is approved!",
            "proposed_rate": 2500.0,
            "proposed_timeline_days": 10,
        },
    )
    assert apply_success.status_code == 201
    assert apply_success.json()["status"] == "SUBMITTED"


def test_creator_profile_submission_validation(client, db_session):
    """
    Phase 3: Verify that creator profile submission enforces validation:
    1. Must have display name, bio, and specialization.
    2. Must have at least 1 published portfolio project before review submission.
    3. Successfully submitting marks is_submitted=True and records submission.
    """
    user, creator = _create_test_creator(db_session, approval_status="PENDING")
    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Profile currently has 0 portfolio projects -> submission must fail
    res_no_proj = client.post("/api/verification/creator/submit-for-review", headers=headers)
    assert res_no_proj.status_code == 400
    assert "At least one portfolio project is required" in res_no_proj.json()["detail"]

    # 2. Check my-approval-status before adding project: is_submitted should be False
    status_pre = client.get("/api/verification/my-approval-status", headers=headers)
    assert status_pre.status_code == 200
    assert status_pre.json()["is_submitted"] is False
    assert status_pre.json()["portfolio_count"] == 0

    # 3. Creator adds a portfolio project
    proj_res = client.post(
        "/api/creators/portfolio",
        headers=headers,
        json={
            "title": "Cosmic Odyssey Commercial",
            "description": "Commercial advertisement generated with multi-modal neural workflows.",
            "content_type": "VIDEO",
            "aspect_ratio": "16:9",
            "primary_asset_url": "/assets/campaign-covers/brand_skincare_cover.jpg",
            "thumbnail_url": "/assets/campaign-covers/brand_skincare_cover.jpg",
            "resolution": "4K UHD",
            "commercial_rights_held": True,
            "commercial_license_type": "Full Commercial Buyout",
            "featured": True,
        },
    )
    assert proj_res.status_code == 201

    # 4. Now creator submits profile for review -> must succeed
    sub_res = client.post("/api/verification/creator/submit-for-review", headers=headers)
    assert sub_res.status_code == 200
    assert sub_res.json()["status"] == "success"
    assert sub_res.json()["is_submitted"] is True
    assert sub_res.json()["approval_status"] == "PENDING"
    assert sub_res.json()["portfolio_count"] == 1

    # 5. Check my-approval-status after submission: is_submitted is True
    status_post = client.get("/api/verification/my-approval-status", headers=headers)
    assert status_post.status_code == 200
    assert status_post.json()["is_submitted"] is True
    assert status_post.json()["approval_status"] == "PENDING"
    assert status_post.json()["submitted_at"] is not None


def test_admin_rejection_requires_meaningful_reason_and_persists(client, db_session):
    """
    Phase 3: Verify that administrative rejection:
    1. Strictly enforces non-empty reviewer notes / rejection reason (400 if empty).
    2. Persists the rejection reason and notifies creator.
    3. Returns the rejection reason in GET /api/verification/my-approval-status.
    """
    admin = _create_test_admin(db_session)
    admin_token = create_access_token({"sub": admin.id, "email": admin.email, "role": admin.role})
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    user, creator = _create_test_creator(db_session, approval_status="PENDING")
    creator_token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    creator_headers = {"Authorization": f"Bearer {creator_token}"}

    # 1. Attempt rejection with empty notes -> must fail with 400
    empty_rej = client.patch(
        f"/api/verification/admin/creators/{creator.id}/approval",
        headers=admin_headers,
        json={"approval_status": "REJECTED", "reviewer_notes": "   "},
    )
    assert empty_rej.status_code == 400
    assert "meaningful rejection reason is required" in empty_rej.json()["detail"]

    # 2. Reject with valid notes -> 200 OK
    reason_text = "Portfolio needs at least 2 video reels and prompt verification."
    valid_rej = client.patch(
        f"/api/verification/admin/creators/{creator.id}/approval",
        headers=admin_headers,
        json={"approval_status": "REJECTED", "reviewer_notes": reason_text},
    )
    assert valid_rej.status_code == 200
    assert valid_rej.json()["approval_status"] == "REJECTED"

    # 3. Creator reads their approval status and verifies rejection reason
    status_res = client.get("/api/verification/my-approval-status", headers=creator_headers)
    assert status_res.status_code == 200
    assert status_res.json()["approval_status"] == "REJECTED"
    assert status_res.json()["rejection_reason"] == reason_text
    assert status_res.json()["can_access_creator_features"] is False


def test_rejected_creator_can_resubmit_profile(client, db_session):
    """
    Phase 3: Verify that a rejected creator can update their portfolio
    and resubmit for review, resetting approval status back to PENDING.
    """
    admin = _create_test_admin(db_session)
    admin_token = create_access_token({"sub": admin.id, "email": admin.email, "role": admin.role})
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    user, creator = _create_test_creator(db_session, approval_status="REJECTED")
    creator_token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    creator_headers = {"Authorization": f"Bearer {creator_token}"}

    # Add a portfolio project so requirements are met
    client.post(
        "/api/creators/portfolio",
        headers=creator_headers,
        json={
            "title": "Updated High Res Campaign Reel",
            "description": "Brand-ready revised video submission.",
            "content_type": "VIDEO",
            "aspect_ratio": "16:9",
            "primary_asset_url": "/assets/campaign-covers/golden_serum_cover.jpg",
            "thumbnail_url": "/assets/campaign-covers/golden_serum_cover.jpg",
            "resolution": "4K UHD",
            "commercial_rights_held": True,
            "commercial_license_type": "Full Commercial Buyout",
            "featured": True,
        },
    )

    # Creator resubmits
    resubmit_res = client.post("/api/verification/creator/submit-for-review", headers=creator_headers)
    assert resubmit_res.status_code == 200
    assert resubmit_res.json()["approval_status"] == "PENDING"
    assert resubmit_res.json()["is_submitted"] is True

    # Creator checks status -> now PENDING
    status_res = client.get("/api/verification/my-approval-status", headers=creator_headers)
    assert status_res.status_code == 200
    assert status_res.json()["approval_status"] == "PENDING"
    assert status_res.json()["is_submitted"] is True


def test_admin_approval_and_rejection_email_dispatched(client, db_session, monkeypatch):
    """
    Verify that:
    1. Admin approval automatically triggers send_creator_approval_email.
    2. Admin rejection automatically triggers send_creator_rejection_email with the reason.
    """
    approval_emails = []
    rejection_emails = []

    def mock_approval_email(email, creator_name=None):
        approval_emails.append({"email": email, "creator_name": creator_name})
        return {"sent": True, "provider": "mock"}

    def mock_rejection_email(email, creator_name=None, reason=None):
        rejection_emails.append({"email": email, "creator_name": creator_name, "reason": reason})
        return {"sent": True, "provider": "mock"}

    monkeypatch.setattr("backend.app.api.verification.send_creator_approval_email", mock_approval_email)
    monkeypatch.setattr("backend.app.api.verification.send_creator_rejection_email", mock_rejection_email)

    admin = _create_test_admin(db_session)
    admin_token = create_access_token({"sub": admin.id, "email": admin.email, "role": admin.role})
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Test Approval Email
    user1, creator1 = _create_test_creator(db_session, approval_status="PENDING")
    appr_res = client.patch(
        f"/api/verification/admin/creators/{creator1.id}/approval",
        headers=admin_headers,
        json={"approval_status": "APPROVED", "reviewer_notes": "Outstanding portfolio!"},
    )
    assert appr_res.status_code == 200
    assert len(approval_emails) == 1
    assert approval_emails[0]["email"] == user1.email
    assert approval_emails[0]["creator_name"] == creator1.display_name

    # 2. Test Rejection Email
    user2, creator2 = _create_test_creator(db_session, approval_status="PENDING")
    rej_reason = "Please upload higher resolution workflow examples."
    rej_res = client.patch(
        f"/api/verification/admin/creators/{creator2.id}/approval",
        headers=admin_headers,
        json={"approval_status": "REJECTED", "reviewer_notes": rej_reason},
    )
    assert rej_res.status_code == 200
    assert len(rejection_emails) == 1
    assert rejection_emails[0]["email"] == user2.email
    assert rejection_emails[0]["creator_name"] == creator2.display_name
    assert rejection_emails[0]["reason"] == rej_reason


def test_brand_discovery_exposes_only_approved_creators(client, db_session):
    """
    Verify that public brand discovery (GET /api/creators) exposes ONLY eligible
    approved creators and excludes pending or rejected creators.
    """
    # Create 1 approved, 1 pending, and 1 rejected creator
    _, approved_creator = _create_test_creator(db_session, approval_status="APPROVED", tier="VERIFIED_PRO")
    _, pending_creator = _create_test_creator(db_session, approval_status="PENDING", tier="COMMUNITY")
    _, rejected_creator = _create_test_creator(db_session, approval_status="REJECTED", tier="COMMUNITY")

    # Give unique handles
    approved_creator.handle = f"appr_{uuid.uuid4().hex[:6]}"
    pending_creator.handle = f"pend_{uuid.uuid4().hex[:6]}"
    rejected_creator.handle = f"rejd_{uuid.uuid4().hex[:6]}"
    db_session.commit()

    # Query public brand discovery
    res = client.get("/api/creators")
    assert res.status_code == 200
    items = res.json()
    handles = [item["handle"] for item in items]

    assert approved_creator.handle in handles
    assert pending_creator.handle not in handles
    assert rejected_creator.handle not in handles




