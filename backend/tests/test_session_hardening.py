"""
Kivora Session Hardening & Role Isolation Regression Tests
Verifies token association with user and role, rejects cross-role access,
prevents stale session leakage across account switches, and validates expired token handling.
Uses strictly isolated in-memory database targets.
"""

import pytest
import uuid
from datetime import datetime, timedelta
from backend.app.models.models import User, CreatorProfile, BrandProfile
from backend.app.core.security import hash_password, create_access_token


def create_test_user(db, email: str, role: str, is_email_verified: bool = True):
    user_id = f"user-{uuid.uuid4().hex[:12]}"
    user = User(
        id=user_id,
        email=email.lower().strip(),
        hashed_password=hash_password("Password123!"),
        role=role,
        is_email_verified=is_email_verified,
        created_at=datetime.utcnow()
    )
    db.add(user)
    
    if role == "CREATOR":
        creator = CreatorProfile(
            id=f"cr-{uuid.uuid4().hex[:12]}",
            user_id=user_id,
            display_name=f"Creator {user_id[:6]}",
            handle=f"creator_{uuid.uuid4().hex[:6]}",
            bio="AI Creator bio",
            avatar_url="/assets/avatars/elena.jpg",
            location="Remote",
            years_experience=2,
            primary_specialization="Generative Video",
            min_budget=500.0,
            availability_status="AVAILABLE",
            verification_tier="COMMUNITY",
            verified_claims_count=0,
            completed_projects_count=0,
            average_rating=5.0,
            created_at=datetime.utcnow()
        )
        db.add(creator)
    elif role == "BRAND":
        brand = BrandProfile(
            id=f"br-{uuid.uuid4().hex[:12]}",
            user_id=user_id,
            company_name=f"Brand {user_id[:6]}",
            slug=f"brand_{uuid.uuid4().hex[:6]}",
            industry="Media",
            logo_url="/assets/brands/lumina.png",
            description="Brand description",
            company_size="10-50",
            headquarters="Remote",
            is_verified_brand=True,
            created_at=datetime.utcnow()
        )
        db.add(brand)
        
    db.commit()
    db.refresh(user)
    return user


def test_admin_token_cannot_access_creator_me_endpoint(client, isolated_db):
    """Admin token is strictly rejected when calling creator-only endpoints."""
    admin = create_test_user(isolated_db, f"admin_{uuid.uuid4().hex[:6]}@kivora.demo", "ADMIN")
    admin_token = create_access_token({"sub": admin.id, "email": admin.email, "role": admin.role})
    
    res = client.get("/api/creators/me", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 403
    assert "Access denied" in res.json()["detail"]
    assert "Requires: CREATOR" in res.json()["detail"]


def test_creator_token_cannot_access_admin_verification_requests(client, isolated_db):
    """Creator token is strictly rejected when attempting to list administrative verification requests."""
    creator = create_test_user(isolated_db, f"creator_{uuid.uuid4().hex[:6]}@kivora.demo", "CREATOR")
    creator_token = create_access_token({"sub": creator.id, "email": creator.email, "role": creator.role})
    
    res = client.get("/api/verification/requests", headers={"Authorization": f"Bearer {creator_token}"})
    assert res.status_code == 403
    assert "Requires: ADMIN" in res.json()["detail"] or "Requires one of roles: ['ADMIN']" in res.json()["detail"]


def test_brand_token_cannot_access_creator_endpoints(client, isolated_db):
    """Brand token is strictly rejected when attempting to access creator private endpoints."""
    brand = create_test_user(isolated_db, f"brand_{uuid.uuid4().hex[:6]}@kivora.demo", "BRAND")
    brand_token = create_access_token({"sub": brand.id, "email": brand.email, "role": brand.role})
    
    res = client.get("/api/creators/me", headers={"Authorization": f"Bearer {brand_token}"})
    assert res.status_code == 403
    assert "Access denied" in res.json()["detail"]


def test_account_switch_role_isolation(client, isolated_db):
    """
    Simulates sequential account switching between Creator and Admin.
    Verifies that requests using token A versus token B remain strictly isolated.
    """
    creator = create_test_user(isolated_db, f"creator_{uuid.uuid4().hex[:6]}@kivora.demo", "CREATOR")
    admin = create_test_user(isolated_db, f"admin_{uuid.uuid4().hex[:6]}@kivora.demo", "ADMIN")
    
    creator_token = create_access_token({"sub": creator.id, "email": creator.email, "role": creator.role})
    admin_token = create_access_token({"sub": admin.id, "email": admin.email, "role": admin.role})
    
    # 1. Creator session: Can access creator profile, blocked from admin verification
    res_c_profile = client.get("/api/creators/me", headers={"Authorization": f"Bearer {creator_token}"})
    assert res_c_profile.status_code == 200
    assert res_c_profile.json()["id"] == creator.creator_profile.id
    
    res_c_admin = client.get("/api/verification/requests", headers={"Authorization": f"Bearer {creator_token}"})
    assert res_c_admin.status_code == 403
    
    # 2. Switch to Admin session: Can access admin verification, blocked from creator profile
    res_a_admin = client.get("/api/verification/requests", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_a_admin.status_code == 200
    
    res_a_profile = client.get("/api/creators/me", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_a_profile.status_code == 403
    
    # 3. Creator session again: remains isolated and denied
    res_c_retry = client.get("/api/verification/requests", headers={"Authorization": f"Bearer {creator_token}"})
    assert res_c_retry.status_code == 403


def test_expired_token_handling(client, isolated_db):
    """An expired token is rejected with 401 Unauthorized."""
    user = create_test_user(isolated_db, f"user_{uuid.uuid4().hex[:6]}@kivora.demo", "CREATOR")
    expired_token = create_access_token(
        {"sub": user.id, "email": user.email, "role": user.role},
        expires_delta=timedelta(seconds=-60)
    )
    
    res = client.get("/api/creators/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert res.status_code == 401
    assert "Invalid or expired access token" in res.json()["detail"]


def test_tampered_token_handling(client, isolated_db):
    """A token with altered payload/signature is rejected with 401 Unauthorized."""
    user = create_test_user(isolated_db, f"user_{uuid.uuid4().hex[:6]}@kivora.demo", "CREATOR")
    valid_token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    
    # Alter the last 4 characters of the signature
    tampered_token = valid_token[:-4] + "xxxx"
    
    res = client.get("/api/creators/me", headers={"Authorization": f"Bearer {tampered_token}"})
    assert res.status_code == 401
    assert "Invalid or expired access token" in res.json()["detail"]


def test_missing_token_handling(client):
    """Protected endpoints require a Bearer token and return 401 Unauthorized when missing."""
    res = client.get("/api/creators/me")
    assert res.status_code == 401
    assert "Authentication required" in res.json()["detail"]
