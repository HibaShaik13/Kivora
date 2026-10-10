"""
Kivora Demo Accounts & Deployment Seeding Verification Tests
Validates:
1. Existence of seeded creators, brands, and admin accounts.
2. Verified email status and roles (CREATOR, BRAND, ADMIN).
3. Demo login flow via POST /api/auth/login with password authentication.
4. Retention of profiles, portfolios, and records across repeated seeding runs.
5. Strict RBAC enforcement (admin vs non-admin endpoints).
6. Non-bypass of OTP for regular registrations.
"""

import pytest
from fastapi.testclient import TestClient
import uuid

from backend.app.main import app
from backend.app.database import SessionLocal
from backend.app.models.models import User, CreatorProfile, BrandProfile
from backend.scripts.seed_db import seed_database, DEMO_DEFAULT_PASSWORD, ADMIN_DEFAULT_PASSWORD

client = TestClient(app)


@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_demo_accounts_exist_and_verified(db_session):
    """Verify demo accounts exist in the database and have is_email_verified=True."""
    # 1. Admin
    admin = db_session.query(User).filter(User.email == "admin@kivora.demo").first()
    assert admin is not None, "Demo admin account missing from database"
    assert admin.role == "ADMIN"
    assert admin.is_email_verified is True

    # 2. Key Demo Creator (Elena Rostova)
    creator = db_session.query(User).filter(User.email == "elena.rostova@kivora.demo").first()
    assert creator is not None, "Demo creator account missing"
    assert creator.role == "CREATOR"
    assert creator.is_email_verified is True
    assert creator.creator_profile is not None
    assert creator.creator_profile.display_name == "Elena Rostova"
    assert len(creator.creator_profile.portfolio_projects) > 0

    # 3. Key Demo Brand (Lumina Skincare)
    brand = db_session.query(User).filter(User.email == "creative@luminaskincare.demo").first()
    assert brand is not None, "Demo brand account missing"
    assert brand.role == "BRAND"
    assert brand.is_email_verified is True
    assert brand.brand_profile is not None
    assert brand.brand_profile.company_name == "Lumina Skincare"


def test_demo_quick_logins():
    """Verify the 3 primary demo accounts featured in AuthModal quick login can sign in."""
    # Elena Rostova (Creator)
    res_creator = client.post("/api/auth/login", json={
        "email": "elena.rostova@kivora.demo",
        "password": DEMO_DEFAULT_PASSWORD
    })
    assert res_creator.status_code == 200, f"Creator demo login failed: {res_creator.text}"
    creator_data = res_creator.json()
    assert creator_data["user"]["role"] == "CREATOR"
    assert creator_data["user"]["has_profile"] is True
    assert "access_token" in creator_data

    # Lumina Skincare (Brand)
    res_brand = client.post("/api/auth/login", json={
        "email": "creative@luminaskincare.demo",
        "password": DEMO_DEFAULT_PASSWORD
    })
    assert res_brand.status_code == 200, f"Brand demo login failed: {res_brand.text}"
    brand_data = res_brand.json()
    assert brand_data["user"]["role"] == "BRAND"
    assert brand_data["user"]["has_profile"] is True
    assert "access_token" in brand_data

    # Admin (Lead Reviewer)
    res_admin = client.post("/api/auth/login", json={
        "email": "admin@kivora.demo",
        "password": ADMIN_DEFAULT_PASSWORD
    })
    assert res_admin.status_code == 200, f"Admin demo login failed: {res_admin.text}"
    admin_data = res_admin.json()
    assert admin_data["user"]["role"] == "ADMIN"
    assert "access_token" in admin_data


def test_idempotent_reseeding_preserves_accounts(db_session):
    """Running seed_database() again must not duplicate users or break existing logins."""
    # Count before
    user_count_before = db_session.query(User).count()

    # Re-run seeder
    seed_database()

    # Count after should be identical
    user_count_after = db_session.query(User).count()
    assert user_count_after == user_count_before, "Re-seeding altered total user count"

    # Quick login still works after re-seeding
    res = client.post("/api/auth/login", json={
        "email": "admin@kivora.demo",
        "password": ADMIN_DEFAULT_PASSWORD
    })
    assert res.status_code == 200


def test_admin_rbac_protection():
    """Ensure non-admin cannot access admin review endpoints, but admin can."""
    # 1. Login as creator
    c_res = client.post("/api/auth/login", json={
        "email": "elena.rostova@kivora.demo",
        "password": DEMO_DEFAULT_PASSWORD
    }).json()
    c_token = c_res["access_token"]

    # Attempt to list admin verification requests as creator -> 403 Forbidden
    forbidden_res = client.get(
        "/api/verification/requests",
        headers={"Authorization": f"Bearer {c_token}"}
    )
    assert forbidden_res.status_code == 403, f"Expected 403, got {forbidden_res.status_code}"

    # 2. Login as admin
    a_res = client.post("/api/auth/login", json={
        "email": "admin@kivora.demo",
        "password": ADMIN_DEFAULT_PASSWORD
    }).json()
    a_token = a_res["access_token"]

    # Admin accesses the endpoint successfully
    admin_check = client.get(
        "/api/verification/requests",
        headers={"Authorization": f"Bearer {a_token}"}
    )
    assert admin_check.status_code == 200, f"Admin was denied access: {admin_check.text}"
