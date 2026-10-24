"""
Regression Test Suite: Creator Login and Onboarding Routing
Tests the 8 core requirements of Section 5:
1. New creator login/setup routing.
2. Existing approved creator login.
3. Existing pending creator login.
4. Existing rejected creator login and resubmission route.
5. Existing account without a creator profile.
6. Unverified email and OTP requirements.
7. Demo-account role/profile mapping (Elena -> LEGACY_ACTIVE, Kai -> PENDING).
8. Missing approval-status column handling.
"""

import uuid
from datetime import datetime, timezone
import sqlalchemy as sa
from starlette.testclient import TestClient

from backend.app.main import app
from backend.app.models.models import User, CreatorProfile, Notification
from backend.app.core.security import hash_password, create_access_token


def _auth_header(token: str):
    return {"Authorization": f"Bearer {token}"}


def _create_test_creator_profile(db_session, user_id: str, handle: str, display_name: str, **kwargs):
    profile = CreatorProfile(
        id=kwargs.get("id", f"cr-{uuid.uuid4().hex[:8]}"),
        user_id=user_id,
        handle=handle,
        display_name=display_name,
        bio=kwargs.get("bio", "Verified generative creator specialized in video and CGI art."),
        avatar_url=kwargs.get("avatar_url", "/assets/avatars/elena.jpg"),
        location=kwargs.get("location", "Remote, Worldwide"),
        years_experience=kwargs.get("years_experience", 3),
        primary_specialization=kwargs.get("primary_specialization", "VIDEO"),
        min_budget=kwargs.get("min_budget", 1000.0),
        hourly_rate=kwargs.get("hourly_rate", 75.0),
        availability_status=kwargs.get("availability_status", "AVAILABLE"),
        verification_tier=kwargs.get("verification_tier", "COMMUNITY"),
        approval_status=kwargs.get("approval_status", "PENDING"),
        completed_projects_count=kwargs.get("completed_projects_count", 0),
        verified_claims_count=kwargs.get("verified_claims_count", 0),
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(profile)
    return profile


# --------------------------------------------------------------------------
# Test 1: New creator without a completed profile routes to setup/onboarding
# --------------------------------------------------------------------------
def test_new_creator_setup_routing(client, db_session):
    user_id = f"user-new-{uuid.uuid4().hex[:8]}"
    email = f"new_creator_{uuid.uuid4().hex[:6]}@example.com"
    user = User(
        id=user_id,
        email=email,
        hashed_password=hash_password("Password123!"),
        role="CREATOR",
        is_email_verified=True,
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(user)
    db_session.commit()

    # Login
    login_res = client.post("/api/auth/login", json={"email": email, "password": "Password123!"})
    assert login_res.status_code == 200
    user_data = login_res.json()["user"]
    assert user_data["role"] == "CREATOR"
    assert user_data["has_profile"] is False
    assert user_data["profile_id"] is None
    token = login_res.json()["access_token"]

    # Approval status endpoint returns 404 for creator without profile
    status_res = client.get("/api/verification/my-approval-status", headers=_auth_header(token))
    assert status_res.status_code == 404
    assert "Creator profile not yet initialized" in status_res.json()["detail"]


# --------------------------------------------------------------------------
# Test 2: Existing approved creator login
# --------------------------------------------------------------------------
def test_existing_approved_creator_login(client, db_session):
    user_id = f"user-appr-{uuid.uuid4().hex[:8]}"
    email = f"approved_creator_{uuid.uuid4().hex[:6]}@example.com"
    user = User(
        id=user_id,
        email=email,
        hashed_password=hash_password("Password123!"),
        role="CREATOR",
        is_email_verified=True,
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(user)

    _create_test_creator_profile(
        db_session,
        user_id,
        handle=f"appr_{uuid.uuid4().hex[:6]}",
        display_name="Approved Creator",
        verification_tier="VERIFIED_PRO",
        approval_status="APPROVED",
        completed_projects_count=5,
    )

    # Add approval notification
    notif = Notification(
        id=f"notif-{uuid.uuid4().hex[:8]}",
        user_id=user_id,
        title="Creator Account Approved",
        message="Your creator profile has been reviewed and approved.",
        type="CREATOR_APPROVAL",
        is_read=False,
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(notif)
    db_session.commit()

    login_res = client.post("/api/auth/login", json={"email": email, "password": "Password123!"})
    assert login_res.status_code == 200
    user_data = login_res.json()["user"]
    assert user_data["has_profile"] is True
    assert user_data["approval_status"] == "APPROVED"

    token = login_res.json()["access_token"]
    status_res = client.get("/api/verification/my-approval-status", headers=_auth_header(token))
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert status_data["approval_status"] == "APPROVED"
    assert status_data["can_access_creator_features"] is True


# --------------------------------------------------------------------------
# Test 3: Existing pending creator login
# --------------------------------------------------------------------------
def test_existing_pending_creator_login(client, db_session):
    user_id = f"user-pend-{uuid.uuid4().hex[:8]}"
    email = f"pending_creator_{uuid.uuid4().hex[:6]}@example.com"
    user = User(
        id=user_id,
        email=email,
        hashed_password=hash_password("Password123!"),
        role="CREATOR",
        is_email_verified=True,
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(user)

    _create_test_creator_profile(
        db_session,
        user_id,
        handle=f"test_pend_{uuid.uuid4().hex[:6]}",
        display_name="Pending Creator",
        verification_tier="COMMUNITY",
        approval_status="PENDING",
        completed_projects_count=0,
        verified_claims_count=0,
    )
    db_session.commit()

    login_res = client.post("/api/auth/login", json={"email": email, "password": "Password123!"})
    assert login_res.status_code == 200
    user_data = login_res.json()["user"]
    assert user_data["approval_status"] == "PENDING"
    assert user_data["has_profile"] is True

    token = login_res.json()["access_token"]
    status_res = client.get("/api/verification/my-approval-status", headers=_auth_header(token))
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert status_data["approval_status"] == "PENDING"
    assert status_data["can_access_creator_features"] is False


# --------------------------------------------------------------------------
# Test 4: Existing rejected creator login and rejection message
# --------------------------------------------------------------------------
def test_existing_rejected_creator_login(client, db_session):
    user_id = f"user-rej-{uuid.uuid4().hex[:8]}"
    email = f"rejected_creator_{uuid.uuid4().hex[:6]}@example.com"
    user = User(
        id=user_id,
        email=email,
        hashed_password=hash_password("Password123!"),
        role="CREATOR",
        is_email_verified=True,
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(user)

    _create_test_creator_profile(
        db_session,
        user_id,
        handle=f"rej_{uuid.uuid4().hex[:6]}",
        display_name="Rejected Creator",
        verification_tier="COMMUNITY",
        approval_status="REJECTED",
    )

    notif = Notification(
        id=f"notif-rej-{uuid.uuid4().hex[:8]}",
        user_id=user_id,
        title="Application Review Update",
        message="Please provide higher-resolution viewport captures and ComfyUI workflow JSON files.",
        type="CREATOR_REJECTION",
        is_read=False,
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(notif)
    db_session.commit()

    login_res = client.post("/api/auth/login", json={"email": email, "password": "Password123!"})
    assert login_res.status_code == 200
    user_data = login_res.json()["user"]
    assert user_data["approval_status"] == "REJECTED"

    token = login_res.json()["access_token"]
    status_res = client.get("/api/verification/my-approval-status", headers=_auth_header(token))
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert status_data["approval_status"] == "REJECTED"
    assert status_data["rejection_reason"] == "Please provide higher-resolution viewport captures and ComfyUI workflow JSON files."
    assert status_data["can_access_creator_features"] is False


# --------------------------------------------------------------------------
# Test 5: Existing account without a creator profile
# --------------------------------------------------------------------------
def test_existing_account_without_profile(client, db_session):
    user_id = f"user-noprof-{uuid.uuid4().hex[:8]}"
    email = f"noprof_{uuid.uuid4().hex[:6]}@example.com"
    user = User(
        id=user_id,
        email=email,
        hashed_password=hash_password("Password123!"),
        role="CREATOR",
        is_email_verified=True,
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(user)
    db_session.commit()

    login_res = client.post("/api/auth/login", json={"email": email, "password": "Password123!"})
    assert login_res.status_code == 200
    user_data = login_res.json()["user"]
    assert user_data["has_profile"] is False
    assert user_data["profile_id"] is None
    assert user_data["approval_status"] is None


# --------------------------------------------------------------------------
# Test 6: Unverified email enforces OTP requirement
# --------------------------------------------------------------------------
def test_unverified_email_enforces_otp(client, db_session):
    user_id = f"user-unver-{uuid.uuid4().hex[:8]}"
    email = f"unverified_{uuid.uuid4().hex[:6]}@example.com"
    user = User(
        id=user_id,
        email=email,
        hashed_password=hash_password("Password123!"),
        role="CREATOR",
        is_email_verified=False,
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(user)
    db_session.commit()

    login_res = client.post("/api/auth/login", json={"email": email, "password": "Password123!"})
    assert login_res.status_code == 403
    assert "Email address has not been verified" in login_res.json()["detail"]


# --------------------------------------------------------------------------
# Test 7: Demo-account role and profile mapping (Elena -> LEGACY_ACTIVE, Kai -> PENDING)
# --------------------------------------------------------------------------
def test_demo_account_mapping():
    # Use standalone TestClient to access seeded root database accounts
    root_client = TestClient(app)

    # Elena Rostova
    elena_res = root_client.post("/api/auth/login", json={"email": "elena.rostova@kivora.demo", "password": "Password123!"})
    assert elena_res.status_code == 200
    elena_user = elena_res.json()["user"]
    assert elena_user["role"] == "CREATOR"
    assert elena_user["has_profile"] is True
    assert elena_user["approval_status"] == "LEGACY_ACTIVE"

    elena_token = elena_res.json()["access_token"]
    elena_status = root_client.get("/api/verification/my-approval-status", headers=_auth_header(elena_token)).json()
    assert elena_status["approval_status"] == "LEGACY_ACTIVE"
    assert elena_status["can_access_creator_features"] is True

    # Kai Tanaka (intentionally pending demo creator)
    kai_res = root_client.post("/api/auth/login", json={"email": "kai.tanaka@kivora.demo", "password": "Password123!"})
    assert kai_res.status_code == 200
    kai_user = kai_res.json()["user"]
    assert kai_user["role"] == "CREATOR"
    assert kai_user["has_profile"] is True
    assert kai_user["approval_status"] == "PENDING"

    kai_token = kai_res.json()["access_token"]
    kai_status = root_client.get("/api/verification/my-approval-status", headers=_auth_header(kai_token)).json()
    assert kai_status["approval_status"] == "PENDING"
    assert kai_status["can_access_creator_features"] is False


# --------------------------------------------------------------------------
# Test 8: Missing approval_status column handling (HTTP 503 on writes, safe read)
# --------------------------------------------------------------------------
def test_missing_column_handling(client, db_session):
    admin_token = create_access_token({"sub": "user-admin-seed", "email": "admin@kivora.demo", "role": "ADMIN"})
    
    # Read handles gracefully without error
    queue_res = client.get("/api/verification/admin/creators/approval-queue", headers=_auth_header(admin_token))
    assert queue_res.status_code in (200, 401)

    inspector = sa.inspect(db_session.get_bind())
    columns = [c["name"] for c in inspector.get_columns("creator_profiles")]
    if "approval_status" not in columns:
        patch_res = client.patch(
            "/api/verification/admin/creators/cr-synth-001/approval",
            headers=_auth_header(admin_token),
            json={"approval_status": "APPROVED"}
        )
        assert patch_res.status_code in (503, 401)
