"""
Regression & Synchronization Test Suite: Direct Invitations Sidebar Count & Scope
Verifies:
1. Three accepted invitations: returns 3 in list and authoritative count (fixing Elena Lumina mismatch).
2. Pending invitations: pending and total count semantics accurately tracked.
3. Accepting or declining an invitation transitions status and updates counts correctly.
4. Issuing a new invitation increments both total and pending counts.
5. Creator isolation: invitations belonging to Creator A are strictly excluded from Creator B.
6. Refresh / re-query idempotence: re-fetching produces consistent, synchronized counts.
7. Empty invitation lists cleanly return 0 for total, pending, accepted, and declined.
8. Shared count contract: /my-invitations and /my-invitations/count agree 100%.
"""

import sys
from pathlib import Path
import uuid
from datetime import datetime, timezone, timedelta

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = REPO_ROOT / "backend"
for p in [str(REPO_ROOT), str(BACKEND_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.database import get_db
from backend.app.models.models import (
    Base,
    User,
    CreatorProfile,
    BrandProfile,
    Brief,
    Application,
    Engagement,
)
from backend.app.core.security import create_access_token, hash_password
from backend.tests.conftest import test_engine, TestingSessionLocal

client = TestClient(app)


@pytest.fixture(autouse=True)
def isolated_db():
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    app.dependency_overrides[get_db] = lambda: db
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=test_engine)
        app.dependency_overrides.clear()


def _create_user(db, email: str, role: str) -> User:
    uid = str(uuid.uuid4())
    user = User(
        id=uid,
        email=email,
        hashed_password=hash_password("Password123!"),
        role=role,
        is_email_verified=True,
        created_at=datetime.now(timezone.utc),
    )
    db.add(user)
    db.commit()

    if role == "CREATOR":
        creator = CreatorProfile(
            id=f"cr-{uuid.uuid4().hex[:8]}",
            user_id=user.id,
            handle=f"creator_{uuid.uuid4().hex[:6]}",
            display_name=f"Creator {uuid.uuid4().hex[:4]}",
            bio="AI Video & VFX Artist",
            avatar_url="https://example.com/avatar.jpg",
            location="Remote, Worldwide",
            years_experience=3,
            primary_specialization="VIDEO",
            min_budget=1500.0,
            availability_status="AVAILABLE",
            verification_tier="VERIFIED_PRO",
            approval_status="APPROVED",
            created_at=datetime.now(timezone.utc),
        )
        db.add(creator)
        db.commit()
    elif role == "BRAND":
        brand = BrandProfile(
            id=f"br-{uuid.uuid4().hex[:8]}",
            user_id=user.id,
            company_name=f"Brand {uuid.uuid4().hex[:4]}",
            slug=f"brand-{uuid.uuid4().hex[:6]}",
            industry="Commercial Production",
            logo_url="https://example.com/logo.jpg",
            description="Leading Brand",
            company_size="10-50",
            headquarters="San Francisco, CA",
            is_verified_brand=True,
            created_at=datetime.now(timezone.utc),
        )
        db.add(brand)
        db.commit()

    db.refresh(user)
    return user


def _create_brief(db, brand_profile_id: str, title: str = "Test Campaign") -> Brief:
    brief = Brief(
        id=f"brief-{uuid.uuid4().hex[:8]}",
        brand_id=brand_profile_id,
        title=title,
        slug=f"{title.lower().replace(' ', '-')}-{uuid.uuid4().hex[:6]}",
        campaign_objective="Luxury creative campaign",
        target_audience="Global consumer audience",
        content_type="VIDEO",
        creative_style_mood="Cinematic & Bold",
        aspect_ratio="16:9",
        resolution_min="4K UHD",
        deliverables_description="1x 60s 4K master deliverable",
        revision_allowance=2,
        budget_amount=5000.0,
        budget_currency="USD",
        deadline=datetime.now(timezone.utc) + timedelta(days=30),
        commercial_use_requirements="Full digital & broadcast rights included",
        usage_channels="Paid Social, Web, Broadcast",
        usage_duration="12 Months",
        usage_territories="Worldwide",
        restrictions_and_guidelines="No copyrighted music",
        disclosure_requirements="Clear creator attribution",
        status="PUBLISHED",
        created_at=datetime.now(timezone.utc),
    )
    db.add(brief)
    db.commit()
    return brief


def _auth_header(user: User) -> dict:
    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    return {"Authorization": f"Bearer {token}"}


def test_empty_invitations_list_and_count(isolated_db):
    """Scenario 7: Empty invitation lists return 0 count and empty list cleanly."""
    creator_user = _create_user(isolated_db, "empty_creator@test.com", "CREATOR")

    res_list = client.get("/api/engagements/my-invitations", headers=_auth_header(creator_user))
    assert res_list.status_code == 200
    assert res_list.json() == []

    res_count = client.get("/api/engagements/my-invitations/count", headers=_auth_header(creator_user))
    assert res_count.status_code == 200
    data = res_count.json()
    assert data["total"] == 0
    assert data["pending"] == 0
    assert data["accepted"] == 0
    assert data["declined"] == 0


def test_three_accepted_invitations_sidebar_count(isolated_db):
    """
    Scenario 1: Three accepted invitations (reproducing the Elena Rostova / Lumina Skincare scenario).
    Verifies that the Direct Invitations list returns 3 records and the authoritative count endpoint returns total=3,
    fixing the previous sidebar mismatch where filtering for INVITED only returned 0.
    """
    creator_user = _create_user(isolated_db, "elena@test.com", "CREATOR")
    brand_user = _create_user(isolated_db, "lumina@test.com", "BRAND")

    b1 = _create_brief(isolated_db, brand_user.brand_profile.id, "Lumina Serum 1")
    b2 = _create_brief(isolated_db, brand_user.brand_profile.id, "Lumina Serum 2")
    b3 = _create_brief(isolated_db, brand_user.brand_profile.id, "Lumina Serum 3")

    for idx, b in enumerate([b1, b2, b3], start=1):
        app_rec = Application(
            id=f"inv-accepted-{idx}",
            brief_id=b.id,
            creator_id=creator_user.creator_profile.id,
            pitch_text=f"Direct Invitation to {b.title}",
            proposed_rate=4500.0,
            proposed_timeline_days=14,
            attached_project_ids="",
            status="ACCEPTED",
            submitted_at=datetime.now(timezone.utc),
            reviewed_at=datetime.now(timezone.utc),
        )
        isolated_db.add(app_rec)
    isolated_db.commit()

    # Verify /my-invitations
    res_list = client.get("/api/engagements/my-invitations", headers=_auth_header(creator_user))
    assert res_list.status_code == 200
    invs = res_list.json()
    assert len(invs) == 3
    assert all(i["status"] == "ACCEPTED" for i in invs)

    # Verify /my-invitations/count authoritative counting
    res_count = client.get("/api/engagements/my-invitations/count", headers=_auth_header(creator_user))
    assert res_count.status_code == 200
    count_data = res_count.json()
    assert count_data["total"] == 3
    assert count_data["accepted"] == 3
    assert count_data["pending"] == 0
    assert count_data["declined"] == 0

    # Ensure shared contract: list length and count['total'] strictly agree
    assert len(invs) == count_data["total"]


def test_pending_invitation_and_count_semantics(isolated_db):
    """
    Scenario 2: Pending invitations accurately reflected in total and pending breakdown.
    """
    creator_user = _create_user(isolated_db, "pending_creator@test.com", "CREATOR")
    brand_user = _create_user(isolated_db, "brand_pending@test.com", "BRAND")

    brief = _create_brief(isolated_db, brand_user.brand_profile.id, "Pending Brief")

    # Brand invites creator
    invite_res = client.post(
        "/api/engagements/invite",
        headers=_auth_header(brand_user),
        json={
            "creator_id": creator_user.creator_profile.id,
            "brief_id": brief.id,
            "message": "Let's collaborate!",
            "proposed_rate": 3000.0,
        },
    )
    assert invite_res.status_code == 201

    res_count = client.get("/api/engagements/my-invitations/count", headers=_auth_header(creator_user))
    assert res_count.status_code == 200
    count_data = res_count.json()
    assert count_data["total"] == 1
    assert count_data["pending"] == 1
    assert count_data["accepted"] == 0

    # Status filter on list endpoint
    pending_list = client.get("/api/engagements/my-invitations?status=INVITED", headers=_auth_header(creator_user)).json()
    assert len(pending_list) == 1
    accepted_list = client.get("/api/engagements/my-invitations?status=ACCEPTED", headers=_auth_header(creator_user)).json()
    assert len(accepted_list) == 0


def test_accept_and_decline_updates_count(isolated_db):
    """
    Scenario 3: Accepting or declining an invitation updates counts correctly without record loss.
    """
    creator_user = _create_user(isolated_db, "action_creator@test.com", "CREATOR")
    brand_user = _create_user(isolated_db, "action_brand@test.com", "BRAND")

    b1 = _create_brief(isolated_db, brand_user.brand_profile.id, "Brief for Accept")
    b2 = _create_brief(isolated_db, brand_user.brand_profile.id, "Brief for Decline")

    # Invite to both
    inv1 = client.post(
        "/api/engagements/invite",
        headers=_auth_header(brand_user),
        json={"creator_id": creator_user.creator_profile.id, "brief_id": b1.id},
    ).json()

    inv2 = client.post(
        "/api/engagements/invite",
        headers=_auth_header(brand_user),
        json={"creator_id": creator_user.creator_profile.id, "brief_id": b2.id},
    ).json()

    # Pre-action count
    pre_counts = client.get("/api/engagements/my-invitations/count", headers=_auth_header(creator_user)).json()
    assert pre_counts["total"] == 2
    assert pre_counts["pending"] == 2
    assert pre_counts["accepted"] == 0
    assert pre_counts["declined"] == 0

    # Accept inv1
    accept_res = client.post(
        f"/api/engagements/invitations/{inv1['id']}/accept",
        headers=_auth_header(creator_user),
    )
    assert accept_res.status_code == 200

    mid_counts = client.get("/api/engagements/my-invitations/count", headers=_auth_header(creator_user)).json()
    assert mid_counts["total"] == 2
    assert mid_counts["pending"] == 1
    assert mid_counts["accepted"] == 1
    assert mid_counts["declined"] == 0

    # Decline inv2
    decline_res = client.post(
        f"/api/engagements/invitations/{inv2['id']}/decline",
        headers=_auth_header(creator_user),
        json={"reason": "Unavailable for this timeframe"},
    )
    assert decline_res.status_code == 200

    post_counts = client.get("/api/engagements/my-invitations/count", headers=_auth_header(creator_user)).json()
    assert post_counts["total"] == 2
    assert post_counts["pending"] == 0
    assert post_counts["accepted"] == 1
    assert post_counts["declined"] == 1

    # Both records remain visible in creator's my-invitations
    all_invs = client.get("/api/engagements/my-invitations", headers=_auth_header(creator_user)).json()
    assert len(all_invs) == 2


def test_new_invitation_increments_count(isolated_db):
    """
    Scenario 4: A newly dispatched invitation increments the count.
    """
    creator_user = _create_user(isolated_db, "fresh_creator@test.com", "CREATOR")
    brand_user = _create_user(isolated_db, "fresh_brand@test.com", "BRAND")
    brief = _create_brief(isolated_db, brand_user.brand_profile.id, "New Campaign")

    c0 = client.get("/api/engagements/my-invitations/count", headers=_auth_header(creator_user)).json()["total"]
    assert c0 == 0

    client.post(
        "/api/engagements/invite",
        headers=_auth_header(brand_user),
        json={"creator_id": creator_user.creator_profile.id, "brief_id": brief.id},
    )

    c1 = client.get("/api/engagements/my-invitations/count", headers=_auth_header(creator_user)).json()["total"]
    assert c1 == 1


def test_cross_creator_invitation_isolation(isolated_db):
    """
    Scenario 5: Invitations belonging to Creator A are strictly excluded from Creator B.
    """
    creator_a = _create_user(isolated_db, "creator_a@test.com", "CREATOR")
    creator_b = _create_user(isolated_db, "creator_b@test.com", "CREATOR")
    brand_user = _create_user(isolated_db, "brand_iso@test.com", "BRAND")
    brief = _create_brief(isolated_db, brand_user.brand_profile.id, "Isolated Brief")

    # Invite only Creator A
    client.post(
        "/api/engagements/invite",
        headers=_auth_header(brand_user),
        json={"creator_id": creator_a.creator_profile.id, "brief_id": brief.id},
    )

    # Check Creator A counts
    ca = client.get("/api/engagements/my-invitations/count", headers=_auth_header(creator_a)).json()
    assert ca["total"] == 1

    # Check Creator B counts - must strictly be 0
    cb = client.get("/api/engagements/my-invitations/count", headers=_auth_header(creator_b)).json()
    assert cb["total"] == 0
    invs_b = client.get("/api/engagements/my-invitations", headers=_auth_header(creator_b)).json()
    assert len(invs_b) == 0


def test_page_and_sidebar_shared_count_contract(isolated_db):
    """
    Scenario 8: The invitation page query (/my-invitations) and sidebar count query (/my-invitations/count)
    never disagree on the shared count definition.
    """
    creator_user = _create_user(isolated_db, "contract_creator@test.com", "CREATOR")
    brand_user = _create_user(isolated_db, "contract_brand@test.com", "BRAND")

    # Mix of accepted, invited, and declined invitations
    b1 = _create_brief(isolated_db, brand_user.brand_profile.id, "Contract Brief 1")
    b2 = _create_brief(isolated_db, brand_user.brand_profile.id, "Contract Brief 2")
    b3 = _create_brief(isolated_db, brand_user.brand_profile.id, "Contract Brief 3")

    inv1 = client.post(
        "/api/engagements/invite",
        headers=_auth_header(brand_user),
        json={"creator_id": creator_user.creator_profile.id, "brief_id": b1.id},
    ).json()
    client.post(f"/api/engagements/invitations/{inv1['id']}/accept", headers=_auth_header(creator_user))

    inv2 = client.post(
        "/api/engagements/invite",
        headers=_auth_header(brand_user),
        json={"creator_id": creator_user.creator_profile.id, "brief_id": b2.id},
    ).json()
    client.post(f"/api/engagements/invitations/{inv2['id']}/decline", headers=_auth_header(creator_user))

    client.post(
        "/api/engagements/invite",
        headers=_auth_header(brand_user),
        json={"creator_id": creator_user.creator_profile.id, "brief_id": b3.id},
    )

    # Re-query multiple times (simulating navigation and refresh - Scenario 6)
    for _ in range(3):
        page_items = client.get("/api/engagements/my-invitations", headers=_auth_header(creator_user)).json()
        counts = client.get("/api/engagements/my-invitations/count", headers=_auth_header(creator_user)).json()

        assert len(page_items) == counts["total"] == 3
        assert counts["accepted"] == 1
        assert counts["declined"] == 1
        assert counts["pending"] == 1
