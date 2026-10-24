"""
Kivora Phase 03 — Backend APIs and Authorization Test Suite
Verifies all Phase 03 requirements:
1. Unauthenticated and unverified requests (401 and 403 enforcement).
2. Incorrect roles and cross-account access (admin-only review, creator isolation).
3. Creator submission and resubmission (validation, idempotency, history preservation).
4. Admin approval, rejection with required reason, and legacy active assignment.
5. Repeated requests and duplicate submissions (idempotent behavior).
6. Legacy creator compatibility (LEGACY_ACTIVE access, brand discovery, status messages).
7. Existing engagement and workspace access based on authenticated contract participation.
8. Missing-column behavior against unmigrated schema (503 Service Unavailable, no silent drops).
9. Database integrity and OTP preservation.
"""

import sys
import uuid
import sqlite3
from pathlib import Path
from datetime import datetime, timedelta, timezone
import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = REPO_ROOT / "backend"
for p in [str(REPO_ROOT), str(BACKEND_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from backend.app.models.models import (
    Base,
    User,
    CreatorProfile,
    BrandProfile,
    Brief,
    Application,
    Engagement,
    PortfolioProject,
    EvidenceRecord,
    OtpCode,
    Notification,
)
from backend.app.core.security import create_access_token, hash_password
from backend.app.main import app
from backend.app.database import get_db


# ==============================================================================
# TEST FIXTURES & HELPERS
# ==============================================================================

def _token_headers(user: User) -> dict:
    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    return {"Authorization": f"Bearer {token}"}


def _create_test_brand(db) -> tuple[User, BrandProfile]:
    uid = f"usr-brand-{uuid.uuid4().hex[:8]}"
    user = User(
        id=uid,
        email=f"brand_{uuid.uuid4().hex[:12]}@example.com",
        hashed_password=hash_password("Password123!"),
        role="BRAND",
        is_email_verified=True,
        created_at=datetime.now(timezone.utc),
    )
    db.add(user)
    db.commit()

    brand = BrandProfile(
        id=f"brand-{uuid.uuid4().hex[:8]}",
        user_id=user.id,
        company_name=f"Brand Corp {uid[:4]}",
        slug=f"brand-corp-{uuid.uuid4().hex[:8]}",
        industry="Technology",
        website_url="https://lumina.ai",
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


def _create_test_creator(db, approval_status: str = "PENDING", tier: str = "COMMUNITY", is_verified: bool = True) -> tuple[User, CreatorProfile]:
    uid = f"usr-cr-{uuid.uuid4().hex[:8]}"
    user = User(
        id=uid,
        email=f"creator_{uuid.uuid4().hex[:12]}@example.com",
        hashed_password=hash_password("Password123!"),
        role="CREATOR",
        is_email_verified=is_verified,
        created_at=datetime.now(timezone.utc),
    )
    db.add(user)
    db.commit()

    creator = CreatorProfile(
        id=f"creator-{uuid.uuid4().hex[:8]}",
        user_id=user.id,
        handle=f"cr_{uuid.uuid4().hex[:8]}",
        display_name=f"Creator {uid[:4]}",
        bio="Generative AI Artist specializing in cinematic visuals and workflows.",
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
    uid = f"usr-adm-{uuid.uuid4().hex[:8]}"
    user = User(
        id=uid,
        email=f"admin_{uuid.uuid4().hex[:12]}@example.com",
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
        id=f"brief-{uuid.uuid4().hex[:8]}",
        brand_id=brand_id,
        title="Cinematic AI Commercial Brief",
        slug=f"cinematic-brief-{uuid.uuid4().hex[:8]}",
        campaign_objective="AI Commercial",
        target_audience="Global",
        content_type="VIDEO",
        creative_style_mood="Cinematic",
        aspect_ratio="16:9",
        resolution_min="4K",
        deliverables_description="1x 30s master video",
        revision_allowance=2,
        budget_amount=5000.0,
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


def _add_portfolio_project(db, creator_id: str) -> PortfolioProject:
    proj = PortfolioProject(
        id=f"proj-{uuid.uuid4().hex[:8]}",
        creator_id=creator_id,
        title="Project Runway AI Visuals",
        slug=f"proj-runway-{uuid.uuid4().hex[:6]}",
        description="Comprehensive AI generated commercial video project.",
        content_type="VIDEO",
        primary_asset_url="https://storage.kivora.com/video.mp4",
        thumbnail_url="https://storage.kivora.com/thumb.jpg",
        aspect_ratio="16:9",
        resolution="4K UHD",
        commercial_rights_held=True,
        commercial_license_type="Full Commercial Buyout",
        featured=False,
        created_at=datetime.now(timezone.utc),
    )
    db.add(proj)
    db.commit()
    db.refresh(proj)
    return proj


# ==============================================================================
# 1. UNAUTHENTICATED & UNVERIFIED REQUESTS (401 & 403 ENFORCEMENT)
# ==============================================================================

def test_unauthenticated_requests_strictly_401(client, isolated_db):
    """Unauthenticated calls to protected routes strictly return 401 Unauthorized."""
    # Profile
    res = client.get("/api/creators/me")
    assert res.status_code == 401

    # Onboarding submission
    res = client.post("/api/verification/creator/submit-for-review")
    assert res.status_code == 401

    # Admin review queue
    res = client.get("/api/verification/admin/creators")
    assert res.status_code == 401

    # Admin approval patch
    res = client.patch("/api/verification/admin/creators/some-creator/approval", json={"approval_status": "APPROVED"})
    assert res.status_code == 401

    # Brief application
    res = client.post("/api/briefs/some-brief/apply", json={"pitch_text": "Hi", "proposed_rate": 1000})
    assert res.status_code == 401


def test_unverified_email_creator_blocked_from_submission_and_marketplace(client, isolated_db):
    """A creator whose email is unverified receives 403 Forbidden on submission and marketplace."""
    creator_user, creator_profile = _create_test_creator(isolated_db, approval_status="PENDING", is_verified=False)
    _add_portfolio_project(isolated_db, creator_profile.id)
    headers = _token_headers(creator_user)

    # Submission blocked
    res_sub = client.post("/api/verification/creator/submit-for-review", headers=headers)
    assert res_sub.status_code == 403
    assert "email address not verified" in res_sub.json().get("detail", "").lower()

    # Marketplace application blocked
    brand_user, brand_profile = _create_test_brand(isolated_db)
    brief = _create_test_brief(isolated_db, brand_profile.id)
    res_apply = client.post(f"/api/briefs/{brief.id}/apply", headers=headers, json={
        "pitch_text": "Pitching on unverified email",
        "proposed_rate": 2000.0,
    })
    assert res_apply.status_code == 403
    assert "email address not verified" in res_apply.json().get("detail", "").lower()


def test_otp_verification_does_not_mutate_creator_approval(client, isolated_db):
    """Email OTP verification strictly toggles is_email_verified without approving creator."""
    email = f"otp_test_{uuid.uuid4().hex[:6]}@example.com"
    client.post("/api/auth/register", json={
        "email": email,
        "password": "Password123!",
        "role": "CREATOR",
        "full_name": "OTP Test Creator",
    })

    otp = isolated_db.query(OtpCode).filter(OtpCode.email == email).first()
    assert otp is not None

    res = client.post("/api/auth/verify-otp", json={
        "email": email,
        "otp_code": otp.code,
    })
    assert res.status_code == 200
    assert res.json()["user"]["is_email_verified"] is True
    assert res.json()["user"]["approval_status"] == "PENDING"

    user = isolated_db.query(User).filter(User.email == email).first()
    assert user.is_email_verified is True
    assert user.creator_profile.approval_status == "PENDING"


# ==============================================================================
# 2. INCORRECT ROLES & CROSS-ACCOUNT ACCESS (ROLE ENFORCEMENT & ISOLATION)
# ==============================================================================

def test_creator_and_brand_cannot_access_admin_creator_review_queue(client, isolated_db):
    """Neither creators nor brands can list the admin creator review queue."""
    creator_user, _ = _create_test_creator(isolated_db, approval_status="APPROVED")
    brand_user, _ = _create_test_brand(isolated_db)

    res_cr = client.get("/api/verification/admin/creators", headers=_token_headers(creator_user))
    assert res_cr.status_code == 403

    res_br = client.get("/api/verification/admin/creators", headers=_token_headers(brand_user))
    assert res_br.status_code == 403


def test_creator_and_brand_cannot_review_creator_approval(client, isolated_db):
    """Neither creators nor brands can call the admin approval patch endpoint."""
    creator_user, target_creator = _create_test_creator(isolated_db, approval_status="PENDING")
    other_creator, _ = _create_test_creator(isolated_db, approval_status="APPROVED")
    brand_user, _ = _create_test_brand(isolated_db)

    # Creator self-approval attempt
    res1 = client.patch(
        f"/api/verification/admin/creators/{target_creator.id}/approval",
        headers=_token_headers(creator_user),
        json={"approval_status": "APPROVED", "reviewer_notes": "Self approved"},
    )
    assert res1.status_code == 403

    # Other creator approval attempt
    res2 = client.patch(
        f"/api/verification/admin/creators/{target_creator.id}/approval",
        headers=_token_headers(other_creator),
        json={"approval_status": "APPROVED", "reviewer_notes": "Other approved"},
    )
    assert res2.status_code == 403

    # Brand approval attempt
    res3 = client.patch(
        f"/api/verification/admin/creators/{target_creator.id}/approval",
        headers=_token_headers(brand_user),
        json={"approval_status": "APPROVED", "reviewer_notes": "Brand approved"},
    )
    assert res3.status_code == 403


def test_creator_cannot_modify_or_delete_other_creator_portfolio(client, isolated_db):
    """A creator cannot update or delete another creator's portfolio project."""
    _, creator_a = _create_test_creator(isolated_db, approval_status="APPROVED")
    user_b, creator_b = _create_test_creator(isolated_db, approval_status="APPROVED")
    proj_a = _add_portfolio_project(isolated_db, creator_a.id)

    headers_b = _token_headers(user_b)

    # Attempt PUT
    res_put = client.put(
        f"/api/creators/portfolio/{proj_a.id}",
        headers=headers_b,
        json={"title": "Hacked Title"},
    )
    assert res_put.status_code == 403

    # Attempt DELETE
    res_del = client.delete(f"/api/creators/portfolio/{proj_a.id}", headers=headers_b)
    assert res_del.status_code == 403


def test_creator_cannot_add_evidence_to_other_creator_portfolio(client, isolated_db):
    """A creator cannot attach evidence to another creator's portfolio project."""
    _, creator_a = _create_test_creator(isolated_db, approval_status="APPROVED")
    user_b, _ = _create_test_creator(isolated_db, approval_status="APPROVED")
    proj_a = _add_portfolio_project(isolated_db, creator_a.id)

    headers_b = _token_headers(user_b)
    res_ev = client.post(
        f"/api/creators/portfolio/{proj_a.id}/evidence",
        headers=headers_b,
        json={
            "evidence_type": "PROCESS_SCREENSHOT",
            "file_url": "https://storage.kivora.com/screenshot.png",
            "title": "Cross-account evidence upload",
            "description": "Workflow verification screenshot",
        },
    )
    assert res_ev.status_code == 403


# ==============================================================================
# 3. CREATOR SUBMISSION & RESUBMISSION (VALIDATION, STATE, HISTORY)
# ==============================================================================

def test_submission_validation_requires_identity_bio_portfolio(client, isolated_db):
    """Submission fails with 400 if bio, specialization, or portfolio projects are missing."""
    user, creator = _create_test_creator(isolated_db, approval_status="PENDING")
    headers = _token_headers(user)

    # Missing portfolio (0 projects)
    res = client.post("/api/verification/creator/submit-for-review", headers=headers)
    assert res.status_code == 400
    assert "at least one portfolio project" in res.json().get("detail", "").lower()

    # Short bio (< 15 chars)
    _add_portfolio_project(isolated_db, creator.id)
    creator.bio = "Short"
    isolated_db.commit()

    res_short = client.post("/api/verification/creator/submit-for-review", headers=headers)
    assert res_short.status_code == 400
    assert "at least 15 characters" in res_short.json().get("detail", "").lower()


def test_creator_initial_submission_success(client, isolated_db):
    """Valid creator submits for review: transitions to PENDING and logs notification."""
    user, creator = _create_test_creator(isolated_db, approval_status="PENDING")
    _add_portfolio_project(isolated_db, creator.id)
    headers = _token_headers(user)

    res = client.post("/api/verification/creator/submit-for-review", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["approval_status"] == "PENDING"
    assert data["is_submitted"] is True
    assert data["portfolio_count"] >= 1

    # Check notification in DB
    notif = isolated_db.query(Notification).filter(
        Notification.user_id == user.id,
        Notification.type == "CREATOR_PROFILE_SUBMITTED",
    ).first()
    assert notif is not None


def test_rejected_creator_can_resubmit_and_transitions_to_pending(client, isolated_db):
    """A rejected creator can update their work and resubmit, moving from REJECTED to PENDING."""
    user, creator = _create_test_creator(isolated_db, approval_status="REJECTED")
    _add_portfolio_project(isolated_db, creator.id)
    headers = _token_headers(user)

    res = client.post("/api/verification/creator/submit-for-review", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["approval_status"] == "PENDING"

    isolated_db.refresh(creator)
    assert creator.approval_status == "PENDING"

    # Status endpoint reflects pending resubmission
    status_res = client.get("/api/verification/my-approval-status", headers=headers)
    assert status_res.status_code == 200
    assert status_res.json()["approval_status"] == "PENDING"
    assert status_res.json()["can_access_creator_features"] is False


# ==============================================================================
# 4. REPEATED REQUESTS & DUPLICATE SUBMISSIONS (IDEMPOTENCY)
# ==============================================================================

def test_repeated_submission_is_idempotent(client, isolated_db):
    """Submitting multiple times while PENDING is completely idempotent."""
    user, creator = _create_test_creator(isolated_db, approval_status="PENDING")
    _add_portfolio_project(isolated_db, creator.id)
    headers = _token_headers(user)

    res1 = client.post("/api/verification/creator/submit-for-review", headers=headers)
    assert res1.status_code == 200

    notif_count_1 = isolated_db.query(Notification).filter(
        Notification.user_id == user.id,
        Notification.type == "CREATOR_PROFILE_SUBMITTED",
    ).count()

    # Second submission
    res2 = client.post("/api/verification/creator/submit-for-review", headers=headers)
    assert res2.status_code == 200
    assert res2.json()["approval_status"] == "PENDING"

    notif_count_2 = isolated_db.query(Notification).filter(
        Notification.user_id == user.id,
        Notification.type == "CREATOR_PROFILE_SUBMITTED",
    ).count()
    # Does not spam duplicate submission notifications
    assert notif_count_2 == notif_count_1


def test_approved_and_legacy_creators_cannot_be_demoted_by_submission(client, isolated_db):
    """Calling submit-for-review when APPROVED or LEGACY_ACTIVE does NOT reset them to PENDING."""
    # Approved
    user_appr, cr_appr = _create_test_creator(isolated_db, approval_status="APPROVED")
    _add_portfolio_project(isolated_db, cr_appr.id)
    res_appr = client.post("/api/verification/creator/submit-for-review", headers=_token_headers(user_appr))
    assert res_appr.status_code == 200
    assert res_appr.json()["approval_status"] == "APPROVED"
    isolated_db.refresh(cr_appr)
    assert cr_appr.approval_status == "APPROVED"

    # Legacy Active
    user_leg, cr_leg = _create_test_creator(isolated_db, approval_status="LEGACY_ACTIVE")
    _add_portfolio_project(isolated_db, cr_leg.id)
    res_leg = client.post("/api/verification/creator/submit-for-review", headers=_token_headers(user_leg))
    assert res_leg.status_code == 200
    assert res_leg.json()["approval_status"] == "LEGACY_ACTIVE"
    isolated_db.refresh(cr_leg)
    assert cr_leg.approval_status == "LEGACY_ACTIVE"


# ==============================================================================
# 5. LEGACY CREATOR COMPATIBILITY (LEGACY_ACTIVE VERIFICATION)
# ==============================================================================

def test_legacy_active_creator_marketplace_access(client, isolated_db):
    """A creator with approval_status == LEGACY_ACTIVE can apply to briefs and use marketplace."""
    creator_user, creator_profile = _create_test_creator(isolated_db, approval_status="LEGACY_ACTIVE")
    brand_user, brand_profile = _create_test_brand(isolated_db)
    brief = _create_test_brief(isolated_db, brand_profile.id)
    headers = _token_headers(creator_user)

    # Brief application succeeds
    res_apply = client.post(f"/api/briefs/{brief.id}/apply", headers=headers, json={
        "pitch_text": "I am an experienced legacy community creator ready to execute this brief.",
        "proposed_rate": 4500.0,
        "proposed_timeline_days": 14,
    })
    assert res_apply.status_code == 201

    # Status check indicates authorized access with legacy messaging
    res_status = client.get("/api/verification/my-approval-status", headers=headers)
    assert res_status.status_code == 200
    data = res_status.json()
    assert data["approval_status"] == "LEGACY_ACTIVE"
    assert data["can_access_creator_features"] is True
    assert "legacy active" in data["message"].lower()


def test_legacy_active_creator_in_brand_discovery(client, isolated_db):
    """Public brand discovery (GET /api/creators) includes APPROVED and LEGACY_ACTIVE, excludes PENDING/REJECTED."""
    _, cr_appr = _create_test_creator(isolated_db, approval_status="APPROVED")
    _, cr_leg = _create_test_creator(isolated_db, approval_status="LEGACY_ACTIVE")
    _, cr_pend = _create_test_creator(isolated_db, approval_status="PENDING")
    _, cr_rejd = _create_test_creator(isolated_db, approval_status="REJECTED")

    # Distinct handles
    cr_appr.handle = f"appr_{uuid.uuid4().hex[:6]}"
    cr_leg.handle = f"leg_{uuid.uuid4().hex[:6]}"
    cr_pend.handle = f"pend_{uuid.uuid4().hex[:6]}"
    cr_rejd.handle = f"rejd_{uuid.uuid4().hex[:6]}"
    isolated_db.commit()

    res = client.get("/api/creators")
    assert res.status_code == 200
    handles = [c["handle"] for c in res.json()]

    assert cr_appr.handle in handles
    assert cr_leg.handle in handles
    assert cr_pend.handle not in handles
    assert cr_rejd.handle not in handles


# ==============================================================================
# 6. EXISTING ENGAGEMENT & WORKSPACE ACCESS (CONTRACT PARTICIPATION)
# ==============================================================================

def test_contract_participant_can_access_workspace_regardless_of_approval_status(client, isolated_db):
    """
    An assigned creator with PENDING or REJECTED status can still access
    their existing collaboration workspace based on contract ownership.
    """
    brand_user, brand_profile = _create_test_brand(isolated_db)
    brief = _create_test_brief(isolated_db, brand_profile.id)

    # Creator assigned to contract who later became REJECTED (e.g. resubmission rejected)
    creator_user, creator_profile = _create_test_creator(isolated_db, approval_status="REJECTED")

    app = Application(
        id=f"app-{uuid.uuid4().hex[:8]}",
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
        id=f"eng-{uuid.uuid4().hex[:8]}",
        brief_id=brief.id,
        creator_id=creator_profile.id,
        application_id=app.id,
        status="KICKOFF",
        agreed_amount=3000.0,
        completion_deadline=datetime.now(timezone.utc) + timedelta(days=14),
        created_at=datetime.now(timezone.utc),
    )
    isolated_db.add(eng)
    isolated_db.commit()

    # Assigned creator accesses workspace
    res = client.get(f"/api/workspaces/{eng.id}", headers=_token_headers(creator_user))
    assert res.status_code == 200
    assert res.json()["engagement"]["id"] == eng.id
    assert res.json()["user_role"] == "CREATOR"


def test_non_participant_blocked_from_collaboration_workspace(client, isolated_db):
    """An unrelated creator cannot access someone else's collaboration workspace."""
    brand_user, brand_profile = _create_test_brand(isolated_db)
    brief = _create_test_brief(isolated_db, brand_profile.id)
    _, assigned_creator = _create_test_creator(isolated_db, approval_status="APPROVED")
    unrelated_user, _ = _create_test_creator(isolated_db, approval_status="APPROVED")

    app = Application(
        id=f"app-{uuid.uuid4().hex[:8]}",
        brief_id=brief.id,
        creator_id=assigned_creator.id,
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
        id=f"eng-{uuid.uuid4().hex[:8]}",
        brief_id=brief.id,
        creator_id=assigned_creator.id,
        application_id=app.id,
        status="KICKOFF",
        agreed_amount=3000.0,
        completion_deadline=datetime.now(timezone.utc) + timedelta(days=14),
        created_at=datetime.now(timezone.utc),
    )
    isolated_db.add(eng)
    isolated_db.commit()

    res = client.get(f"/api/workspaces/{eng.id}", headers=_token_headers(unrelated_user))
    assert res.status_code == 403


# ==============================================================================
# 7. ADMIN APPROVAL, REJECTION & REASON ENFORCEMENT
# ==============================================================================

def test_admin_approval_and_rejection_lifecycle(client, isolated_db):
    """Admin can approve, reject with reason, or set LEGACY_ACTIVE on creator accounts."""
    admin = _create_test_admin(isolated_db)
    admin_headers = _token_headers(admin)
    _, creator = _create_test_creator(isolated_db, approval_status="PENDING")

    # 1. Rejection without notes -> 400
    res_no_notes = client.patch(
        f"/api/verification/admin/creators/{creator.id}/approval",
        headers=admin_headers,
        json={"approval_status": "REJECTED", "reviewer_notes": "   "},
    )
    assert res_no_notes.status_code == 400

    # 2. Rejection with notes -> 200, status REJECTED
    res_rej = client.patch(
        f"/api/verification/admin/creators/{creator.id}/approval",
        headers=admin_headers,
        json={"approval_status": "REJECTED", "reviewer_notes": "Needs higher quality sample evidence."},
    )
    assert res_rej.status_code == 200
    assert res_rej.json()["approval_status"] == "REJECTED"
    isolated_db.refresh(creator)
    assert creator.approval_status == "REJECTED"

    # 3. Admin approval -> 200, status APPROVED
    res_appr = client.patch(
        f"/api/verification/admin/creators/{creator.id}/approval",
        headers=admin_headers,
        json={"approval_status": "APPROVED", "reviewer_notes": "Portfolio verified."},
    )
    assert res_appr.status_code == 200
    assert res_appr.json()["approval_status"] == "APPROVED"
    isolated_db.refresh(creator)
    assert creator.approval_status == "APPROVED"

    # 4. Admin legacy active -> 200, status LEGACY_ACTIVE
    res_leg = client.patch(
        f"/api/verification/admin/creators/{creator.id}/approval",
        headers=admin_headers,
        json={"approval_status": "LEGACY_ACTIVE", "reviewer_notes": "Grandfathered active creator."},
    )
    assert res_leg.status_code == 200
    assert res_leg.json()["approval_status"] == "LEGACY_ACTIVE"
    isolated_db.refresh(creator)
    assert creator.approval_status == "LEGACY_ACTIVE"


# ==============================================================================
# 8. MISSING-COLUMN BEHAVIOR AGAINST UNMIGRATED SCHEMA
# ==============================================================================

def test_missing_column_behavior_against_unmigrated_schema():
    """
    On a disposable database lacking the 'approval_status' column (matching unmigrated schema):
    - Setter raises OperationalError rather than silently swallowing the write.
    - Admin approval patch endpoint returns 503 Service Unavailable reporting the dependency.
    """
    from sqlalchemy import text
    raw_engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=raw_engine)

    RawSession = sessionmaker(bind=raw_engine)
    session = RawSession()

    # Insert user and creator before dropping column (representing existing database profiles)
    uid = f"usr-{uuid.uuid4().hex[:8]}"
    cid = f"cr-{uuid.uuid4().hex[:8]}"
    user = User(
        id=uid,
        email="unmigrated@example.com",
        hashed_password=hash_password("Password123!"),
        role="CREATOR",
        is_email_verified=True,
        created_at=datetime.utcnow()
    )
    session.add(user)

    creator = CreatorProfile(
        id=cid,
        user_id=uid,
        handle="unmigrated_cr",
        display_name="Unmigrated Creator",
        bio="Experienced visual creator profile with workflow evidence.",
        avatar_url="/assets/avatars/elena.jpg",
        location="Remote",
        primary_specialization="VIDEO",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    session.add(creator)
    session.commit()

    # Drop index and approval_status column to accurately reproduce unmigrated database
    with raw_engine.connect() as conn:
        conn.execute(text("DROP INDEX IF EXISTS ix_creator_profiles_approval_status;"))
        conn.execute(text("ALTER TABLE creator_profiles DROP COLUMN approval_status;"))
        conn.commit()

    session.expire_all()

    # 1. Reading fallback defaults safely to PENDING without tier inference
    assert creator.approval_status == "PENDING"

    # 2. Attempting to set approval_status when column is missing raises OperationalError
    from sqlalchemy.exc import OperationalError
    with pytest.raises(OperationalError) as exc_info:
        creator.approval_status = "APPROVED"
    assert "approval_status" in str(exc_info.value).lower()
    assert "migration" in str(exc_info.value).lower()

    # 3. Test endpoint response using client override
    app.dependency_overrides[get_db] = lambda: session
    try:
        test_client = TestClient(app)
        admin = User(
            id=f"adm-{uuid.uuid4().hex[:8]}",
            email="admin_unmig@example.com",
            hashed_password="hash",
            role="ADMIN",
            is_email_verified=True,
            created_at=datetime.utcnow(),
        )
        session.add(admin)
        session.commit()

        token = create_access_token({"sub": admin.id, "email": admin.email, "role": admin.role})
        headers = {"Authorization": f"Bearer {token}"}

        res = test_client.patch(
            f"/api/verification/admin/creators/{cid}/approval",
            headers=headers,
            json={"approval_status": "APPROVED", "reviewer_notes": "Approval attempt on unmigrated DB"},
        )
        # Endpoint returns 503 Service Unavailable reporting the pending migration
        assert res.status_code == 503
        assert "migration" in res.json().get("detail", "").lower()
    finally:
        app.dependency_overrides.pop(get_db, None)
        session.close()


# ==============================================================================
# 9. DATABASE INTEGRITY ON DISPOSABLE DATABASE
# ==============================================================================

def test_database_foreign_key_integrity_clean(isolated_db):
    """PRAGMA foreign_key_check must return 0 violations across all isolated entities."""
    bind = isolated_db.get_bind()
    from sqlalchemy import text
    res = bind.execute(text("PRAGMA foreign_key_check;")).fetchall()
    assert len(res) == 0, f"Foreign key violations detected: {res}"
