"""
Phase 5 Recommendation & Opportunity Workflow Tests
Validates personalized brief recommendations, preference filtering, alert deduplication,
and draft brief privacy / multi-tenant isolation.
"""

import uuid
from datetime import datetime, timedelta
import pytest
from backend.app.models.models import (
    User,
    CreatorProfile,
    BrandProfile,
    Brief,
    AlertPreference,
    OpportunityAlertRecord,
    PortfolioProject,
)
from backend.app.services.opportunity_service import OpportunityService
from backend.app.core.security import create_access_token, hash_password


def _create_verified_user(db, role: str) -> User:
    email = f"user_{role.lower()}_{uuid.uuid4().hex[:8]}@example.com"
    user_id = str(uuid.uuid4())
    user = User(
        id=user_id,
        email=email,
        hashed_password=hash_password("SecurePassword123!"),
        role=role,
        is_email_verified=True,
        created_at=datetime.utcnow(),
    )
    db.add(user)
    db.commit()

    if role == "CREATOR":
        creator = CreatorProfile(
            id=str(uuid.uuid4()),
            user_id=user.id,
            handle=f"creator_{uuid.uuid4().hex[:6]}",
            display_name="Test Creator",
            bio="AI Creative Specialist",
            avatar_url="https://example.com/avatar.jpg",
            location="Remote, Worldwide",
            years_experience=3,
            primary_specialization="VIDEO",
            min_budget=1500.0,
            availability_status="AVAILABLE",
            verification_tier="VERIFIED_PRO",
            created_at=datetime.utcnow(),
        )
        db.add(creator)
        db.commit()
    elif role == "BRAND":
        brand = BrandProfile(
            id=str(uuid.uuid4()),
            user_id=user.id,
            company_name=f"Brand {uuid.uuid4().hex[:4]}",
            slug=f"brand-{uuid.uuid4().hex[:6]}",
            industry="Commercial Production",
            logo_url="https://example.com/logo.jpg",
            description="Leading AI production brand",
            company_size="10-50",
            headquarters="San Francisco, CA",
            is_verified_brand=True,
            created_at=datetime.utcnow(),
        )
        db.add(brand)
        db.commit()

    db.refresh(user)
    return user


def _create_brief(db, brand_profile_id: str, title: str = "Test Brief", budget: float = 5000.0, status: str = "PUBLISHED") -> Brief:
    brief = Brief(
        id=str(uuid.uuid4()),
        brand_id=brand_profile_id,
        title=title,
        slug=f"{title.lower().replace(' ', '-')}-{uuid.uuid4().hex[:6]}",
        campaign_objective="Luxury creative campaign objective",
        target_audience="Global consumer audience",
        content_type="VIDEO",
        creative_style_mood="Cinematic & Bold",
        aspect_ratio="16:9",
        resolution_min="4K UHD",
        deliverables_description="1x 60s 4K master deliverable",
        revision_allowance=2,
        budget_amount=budget,
        budget_currency="USD",
        deadline=datetime.utcnow() + timedelta(days=30),
        commercial_use_requirements="Full digital & broadcast rights included",
        usage_channels="Paid Social, Web, Broadcast",
        usage_duration="12 Months",
        usage_territories="Worldwide",
        restrictions_and_guidelines="No copyrighted music, original assets only",
        disclosure_requirements="Clear creator attribution and AI disclosure where applicable",
        status=status,
        created_at=datetime.utcnow(),
    )
    db.add(brief)
    db.commit()
    return brief


def test_opportunity_service_alert_generation_and_deduplication(isolated_db):
    """
    Ensures OpportunityService generates alerts for matching published briefs
    and is strictly idempotent (no duplicate alert records created on subsequent runs).
    """
    creator_user = _create_verified_user(isolated_db, "CREATOR")
    creator_profile = creator_user.creator_profile

    # Add matching portfolio project to creator
    proj = PortfolioProject(
        id=str(uuid.uuid4()),
        creator_id=creator_profile.id,
        title="Commercial Video Reel",
        slug=f"commercial-reel-{uuid.uuid4().hex[:6]}",
        description="High-end video reel",
        content_type="VIDEO",
        aspect_ratio="16:9",
        primary_asset_url="https://example.com/reel.mp4",
        thumbnail_url="https://example.com/thumb.jpg",
    )
    isolated_db.add(proj)
    isolated_db.commit()

    brand_user = _create_verified_user(isolated_db, "BRAND")
    brand_profile = brand_user.brand_profile

    published_brief = _create_brief(
        isolated_db,
        brand_profile_id=brand_profile.id,
        title="Lumina Dewdrop Campaign",
        budget=5000.0,
        status="PUBLISHED",
    )

    # 1. First execution: should generate 1 alert
    alerts_run1 = OpportunityService.generate_alerts_for_creator(
        db=isolated_db,
        creator_user_id=creator_user.id,
        threshold_score=50.0,
    )
    assert len(alerts_run1) == 1
    assert alerts_run1[0].brief_id == published_brief.id
    assert alerts_run1[0].match_score >= 50.0

    # 2. Second execution: should be completely idempotent (0 new alerts)
    alerts_run2 = OpportunityService.generate_alerts_for_creator(
        db=isolated_db,
        creator_user_id=creator_user.id,
        threshold_score=50.0,
    )
    assert len(alerts_run2) == 0

    # Total in DB is still exactly 1
    total = isolated_db.query(OpportunityAlertRecord).filter(
        OpportunityAlertRecord.user_id == creator_user.id
    ).count()
    assert total == 1


def test_draft_briefs_are_never_recommended(isolated_db):
    """Guarantees that private DRAFT briefs are never recommended to creators."""
    creator_user = _create_verified_user(isolated_db, "CREATOR")
    brand_user = _create_verified_user(isolated_db, "BRAND")

    draft_brief = _create_brief(
        isolated_db,
        brand_profile_id=brand_user.brand_profile.id,
        title="Confidential Internal Draft",
        budget=8000.0,
        status="DRAFT",  # Private draft!
    )

    # Generate alerts: draft brief must NOT be evaluated or alerted
    alerts = OpportunityService.generate_alerts_for_creator(
        db=isolated_db,
        creator_user_id=creator_user.id,
        threshold_score=0.0,
    )
    assert len(alerts) == 0
    assert not any(a.brief_id == draft_brief.id for a in alerts)


def test_matching_endpoint_draft_brief_privacy(client, isolated_db):
    """
    Verifies that the /api/match/briefs/{brief_id} endpoint enforces tenant isolation:
    Draft briefs cannot be inspected by unauthenticated users or unauthorized third parties.
    """
    owner_user = _create_verified_user(isolated_db, "BRAND")
    other_brand_user = _create_verified_user(isolated_db, "BRAND")

    draft_brief = _create_brief(
        isolated_db,
        brand_profile_id=owner_user.brand_profile.id,
        title="Confidential Secret Campaign",
        budget=5000.0,
        status="DRAFT",
    )

    # Case A: Anonymous request -> 403 Forbidden
    res_anon = client.get(f"/api/match/briefs/{draft_brief.id}")
    assert res_anon.status_code == 403

    # Case B: Other brand -> 403 Forbidden
    token_other = create_access_token(data={"sub": other_brand_user.id})
    res_other = client.get(
        f"/api/match/briefs/{draft_brief.id}",
        headers={"Authorization": f"Bearer {token_other}"},
    )
    assert res_other.status_code == 403

    # Case C: Owning brand -> 200 OK
    token_owner = create_access_token(data={"sub": owner_user.id})
    res_owner = client.get(
        f"/api/match/briefs/{draft_brief.id}",
        headers={"Authorization": f"Bearer {token_owner}"},
    )
    assert res_owner.status_code == 200
    assert res_owner.json()["brief_id"] == draft_brief.id
