import os
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = REPO_ROOT / "backend"
for p in [str(REPO_ROOT), str(BACKEND_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

import uuid
try:
    import pytest
except ImportError:
    pytest = None

from datetime import datetime, timedelta
from backend.app.models.models import User, OtpCode, BrandProfile, CreatorProfile, Brief
from backend.app.core.security import create_access_token, decode_access_token, generate_otp_code



def test_registration_does_not_auto_verify(client, isolated_db):
    """Verify that registration leaves user in unverified state and does not issue JWT access token."""
    email = f"creator_{uuid.uuid4().hex[:8]}@example.com"
    res = client.post("/api/auth/register", json={
        "email": email,
        "password": "SecurePassword123!",
        "role": "CREATOR",
        "full_name": "Test Creator"
    })
    assert res.status_code == 201
    data = res.json()
    assert data.get("requires_otp") is True
    assert "access_token" not in data, "Registration must not issue an access token before email verification"

    # Verify database state
    user = isolated_db.query(User).filter(User.email == email).first()
    assert user is not None
    assert user.is_email_verified is False, "User email must not be marked verified upon registration"

    # Verify OTP was created
    otp_record = isolated_db.query(OtpCode).filter(OtpCode.email == email).first()
    assert otp_record is not None
    assert len(otp_record.code) == 6
    assert otp_record.is_used is False


def test_login_rejects_unverified_email(client, isolated_db):
    """Verify that attempting to log in with an unverified account returns 403 and does not auto-verify."""
    email = f"brand_{uuid.uuid4().hex[:8]}@example.com"
    # Register first
    client.post("/api/auth/register", json={
        "email": email,
        "password": "SecurePassword123!",
        "role": "BRAND",
        "full_name": "Test Brand"
    })

    # Attempt login before OTP verification
    res = client.post("/api/auth/login", json={
        "email": email,
        "password": "SecurePassword123!"
    })
    assert res.status_code == 403, "Login must reject unverified email with 403 Forbidden"
    assert "not been verified" in res.json().get("detail", "").lower()

    # Verify user remains unverified
    user = isolated_db.query(User).filter(User.email == email).first()
    assert user.is_email_verified is False


def test_otp_verification_flow(client, isolated_db):
    """Verify that entering correct OTP marks user verified and issues a valid access token."""
    email = f"user_{uuid.uuid4().hex[:8]}@example.com"
    client.post("/api/auth/register", json={
        "email": email,
        "password": "SecurePassword123!",
        "role": "CREATOR",
        "full_name": "Verified Creator"
    })

    otp_record = isolated_db.query(OtpCode).filter(OtpCode.email == email).first()
    assert otp_record is not None
    valid_code = otp_record.code

    # 1. Invalid OTP attempt
    res_bad = client.post("/api/auth/verify-otp", json={
        "email": email,
        "otp_code": "000000"
    })
    assert res_bad.status_code == 400
    assert "invalid" in res_bad.json().get("detail", "").lower()

    # 2. Valid OTP attempt
    res_good = client.post("/api/auth/verify-otp", json={
        "email": email,
        "otp_code": valid_code
    })
    assert res_good.status_code == 200
    token_data = res_good.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"
    assert token_data["user"]["is_email_verified"] is True

    # 3. Subsequent login now succeeds
    res_login = client.post("/api/auth/login", json={
        "email": email,
        "password": "SecurePassword123!"
    })
    assert res_login.status_code == 200
    assert "access_token" in res_login.json()


def test_public_briefs_endpoint_never_exposes_drafts(client, isolated_db):
    """Verify that public brief queries strictly filter out draft briefs."""
    # Seed a brand and two briefs: one published, one draft
    user = User(
        id=f"user-{uuid.uuid4().hex[:8]}",
        email=f"brand_{uuid.uuid4().hex[:6]}@demo.com",
        hashed_password="hashed_pwd",
        role="BRAND",
        is_email_verified=True,
    )
    brand = BrandProfile(
        id=f"brand-{uuid.uuid4().hex[:8]}",
        user_id=user.id,
        company_name="Private Cosmetics",
        slug=f"priv-brand-{uuid.uuid4().hex[:4]}",
        industry="Beauty",
        logo_url="/assets/logo.png",
        description="Luxury brand",
        headquarters="New York"
    )
    brief_pub = Brief(
        id=f"brief-pub-{uuid.uuid4().hex[:6]}",
        brand_id=brand.id,
        title="Public Launch Campaign",
        slug=f"public-launch-{uuid.uuid4().hex[:4]}",
        campaign_objective="Reach broad audience",
        target_audience="General",
        content_type="VIDEO",
        creative_style_mood="Cinematic",
        aspect_ratio="16:9",
        deliverables_description="1x Video",
        budget_amount=5000.0,
        deadline=datetime.utcnow() + timedelta(days=30),
        commercial_use_requirements="Full buyout",
        usage_channels="Web",
        usage_duration="1 year",
        usage_territories="Global",
        restrictions_and_guidelines="None",
        disclosure_requirements="Standard",
        status="PUBLISHED"
    )
    brief_draft = Brief(
        id=f"brief-draft-{uuid.uuid4().hex[:6]}",
        brand_id=brand.id,
        title="Top Secret Confidential Unannounced Campaign",
        slug=f"secret-campaign-{uuid.uuid4().hex[:4]}",
        campaign_objective="Secret upcoming product",
        target_audience="Secret",
        content_type="VIDEO",
        creative_style_mood="Futuristic",
        aspect_ratio="16:9",
        deliverables_description="1x Video",
        budget_amount=25000.0,
        deadline=datetime.utcnow() + timedelta(days=60),
        commercial_use_requirements="NDA required",
        usage_channels="Internal",
        usage_duration="None",
        usage_territories="None",
        restrictions_and_guidelines="Strict NDA",
        disclosure_requirements="Confidential",
        status="DRAFT"
    )
    isolated_db.add_all([user, brand, brief_pub, brief_draft])
    isolated_db.commit()

    # Unauthenticated / Public listing
    res = client.get("/api/briefs")
    assert res.status_code == 200
    brief_titles = [b["title"] for b in res.json()]
    assert "Public Launch Campaign" in brief_titles
    assert "Top Secret Confidential Unannounced Campaign" not in brief_titles, "DRAFT briefs must NEVER leak into public listing"

    # Detail query for draft brief without authentication must 404
    res_detail = client.get(f"/api/briefs/{brief_draft.id}")
    assert res_detail.status_code == 404, "Direct query for DRAFT brief must return 404 for unauthenticated callers"

    # Detail query for draft brief by the owning brand succeeds
    token = create_access_token({"sub": user.id, "role": "BRAND"})
    res_auth = client.get(
        f"/api/briefs/{brief_draft.id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res_auth.status_code == 200
    assert res_auth.json()["title"] == "Top Secret Confidential Unannounced Campaign"


def test_cryptographic_otp_generator_format():
    """Verify that generate_otp_code produces 6-digit numeric strings in range 100000-999999."""
    for _ in range(50):
        code = generate_otp_code()
        assert len(code) == 6
        assert code.isdigit()
        val = int(code)
        assert 100000 <= val <= 999999


if __name__ == "__main__":
    from backend.tests.conftest import test_engine, TestingSessionLocal, assert_isolated_test_target
    from backend.app.database import get_db
    from backend.app.main import app
    from fastapi.testclient import TestClient
    from backend.app.models.models import Base

    print("\n=======================================================")
    print("RUNNING PHASE 1 SECURITY & PRIVACY ISOLATED TEST SUITE")
    print("=======================================================")

    assert_isolated_test_target("sqlite:///:memory:")
    Base.metadata.create_all(bind=test_engine)

    db = TestingSessionLocal()

    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    test_client = TestClient(app)

    import backend.app.services.email_service as email_service
    import backend.app.api.auth as auth_router
    fast_mock = lambda email, otp, purpose="REGISTRATION": {
        "sent": True,
        "provider": "mock_test",
        "status": "delivered",
        "dev_otp": otp
    }
    email_service.send_otp_email = fast_mock
    auth_router.send_otp_email = fast_mock

    tests = [
        ("test_registration_does_not_auto_verify", lambda: test_registration_does_not_auto_verify(test_client, db)),
        ("test_login_rejects_unverified_email", lambda: test_login_rejects_unverified_email(test_client, db)),
        ("test_otp_verification_flow", lambda: test_otp_verification_flow(test_client, db)),
        ("test_public_briefs_endpoint_never_exposes_drafts", lambda: test_public_briefs_endpoint_never_exposes_drafts(test_client, db)),
        ("test_cryptographic_otp_generator_format", lambda: test_cryptographic_otp_generator_format()),
    ]



    passed = 0
    failed = 0
    for name, fn in tests:
        try:
            fn()
            print(f"[PASS] {name}")
            passed += 1
        except Exception as e:
            print(f"[FAIL] {name}: {e}")
            failed += 1

    app.dependency_overrides.pop(get_db, None)
    db.close()
    Base.metadata.drop_all(bind=test_engine)

    print(f"\nRESULTS: {passed} passed, {failed} failed out of {len(tests)} tests.")
    if failed > 0:
        import sys
        sys.exit(1)

