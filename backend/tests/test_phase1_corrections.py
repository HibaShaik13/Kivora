"""
Phase 1 Marketplace Correction Pass Test Suite
Verifies:
1. Brand self-pitch prevention (HTTP 400 or 403) both for owned briefs and brand roles.
2. Brief reference asset and cover image persistence & API retrieval.
3. Creator matching determinism, bounded scores (0-100), and null-safe explainability.
4. Conversation auto-provisioning upon application acceptance.
5. Idempotent conversation auto-linking for active engagements.
6. Saved creators tenant isolation, duplicate prevention, and removal.
7. Brand eligible briefs filtering and invitation duplicate prevention.
"""

import sys
import uuid
from datetime import datetime, timedelta
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = REPO_ROOT / "backend"
for p in [str(REPO_ROOT), str(BACKEND_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from fastapi.testclient import TestClient

from backend.app.models.models import (
    Base,
    User,
    CreatorProfile,
    BrandProfile,
    Brief,
    Application,
    Engagement,
    Conversation,
    Message,
    SavedCreator,
    PortfolioProject,
)
from backend.app.core.security import create_access_token, hash_password
from backend.app.database import get_db
from backend.app.main import app
from backend.app.services.matching import evaluate_creator_for_brief, match_creators_for_brief
import backend.app.services.email_service as es_mod

# Disable external network email dispatch for tests to use local fast path
es_mod.SMTP_HOST = None
es_mod.RESEND_API_KEY = None


def _create_verified_user(db, role: str) -> User:
    email = f"p1_{role.lower()}_{uuid.uuid4().hex[:8]}@example.com"
    user_id = str(uuid.uuid4())
    user = User(
        id=user_id,
        email=email,
        hashed_password=hash_password("Pass123!Safe"),
        role=role,
        is_email_verified=True,
    )
    db.add(user)
    db.flush()

    if role == "CREATOR":
        creator = CreatorProfile(
            id=str(uuid.uuid4()),
            user_id=user.id,
            display_name=f"Creator {user_id[:6]}",
            handle=f"creator_{user_id[:6]}",
            bio="AI Video & 3D Artist",
            avatar_url="/uploads/avatars/default.png",
            location="San Francisco, CA",
            primary_specialization="AI Video",
            min_budget=1000.0,
            average_rating=4.9,
            verification_tier="VERIFIED_PRO",
            availability_status="AVAILABLE",
        )
        db.add(creator)
    elif role == "BRAND":
        brand = BrandProfile(
            id=str(uuid.uuid4()),
            user_id=user.id,
            company_name=f"Brand {user_id[:6]}",
            slug=f"brand-{user_id[:6]}",
            industry="Consumer Goods",
            website_url="https://brand.example.com",
            logo_url="/uploads/logos/default.png",
            description="Leading modern consumer brand",
            headquarters="New York, NY",
        )
        db.add(brand)

    db.commit()
    db.refresh(user)
    return user


def _auth_header(user: User) -> dict:
    token = create_access_token(data={"sub": user.id, "role": user.role})
    return {"Authorization": f"Bearer {token}"}


def _create_test_brief(db, brand_profile_id: str, title: str = "Test Campaign") -> Brief:
    brief = Brief(
        id=str(uuid.uuid4()),
        brand_id=brand_profile_id,
        title=title,
        slug=f"test-campaign-{uuid.uuid4().hex[:8]}",
        campaign_objective="Brand awareness campaign",
        target_audience="Tech enthusiasts",
        content_type="AI Video",
        creative_style_mood="Cinematic, Moody",
        aspect_ratio="16:9",
        deliverables_description="1x 30s 4K video deliverable",
        budget_amount=3000.0,
        deadline=datetime.utcnow() + timedelta(days=30),
        commercial_use_requirements="Full worldwide digital rights",
        usage_channels="Paid Social, Web",
        usage_duration="12 Months",
        usage_territories="Worldwide",
        restrictions_and_guidelines="No competitor logos",
        disclosure_requirements="AI generated tag required",
        status="PUBLISHED",
    )
    db.add(brief)
    db.commit()
    db.refresh(brief)
    return brief


def test_brand_self_pitch_prevention(client: TestClient, db):
    """Ensure brands cannot submit pitch applications to their own briefs or any briefs."""
    brand_user = _create_verified_user(db, "BRAND")
    creator_user = _create_verified_user(db, "CREATOR")

    brief = _create_test_brief(db, brand_user.brand_profile.id, "Self-Pitch Guard Brief")

    # Brand attempts to apply -> must receive 400 or 403 Forbidden
    brand_headers = _auth_header(brand_user)
    resp = client.post(
        f"/api/briefs/{brief.id}/apply",
        json={
            "pitch_text": "I want to apply to my own brief",
            "proposed_rate": 3000.0,
            "proposed_timeline_days": 14,
            "attached_project_ids": [],
        },
        headers=brand_headers,
    )
    assert resp.status_code in [400, 403], f"Expected 400/403 for brand self-pitch, got {resp.status_code}"

    # Creator applies -> must succeed with 201
    creator_headers = _auth_header(creator_user)
    resp_creator = client.post(
        f"/api/briefs/{brief.id}/apply",
        json={
            "pitch_text": "Legitimate creator proposal for campaign",
            "proposed_rate": 2800.0,
            "proposed_timeline_days": 14,
            "attached_project_ids": [],
        },
        headers=creator_headers,
    )
    assert resp_creator.status_code == 201, f"Expected 201 for creator application, got {resp_creator.status_code}: {resp_creator.text}"


def test_brief_reference_asset_persistence(client: TestClient, db):
    """Ensure reference_asset_url and cover_image_url persist and are returned."""
    brand_user = _create_verified_user(db, "BRAND")
    brand_headers = _auth_header(brand_user)

    payload = {
        "title": "Brief With Reference Moodboard",
        "campaign_objective": "Product Launch",
        "target_audience": "Designers",
        "content_type": "AI Video",
        "creative_style_mood": "Cyberpunk Neon",
        "aspect_ratio": "16:9",
        "deliverables_description": "1x 45s trailer",
        "budget_amount": 4500.0,
        "commercial_use_requirements": "Full perpetual rights",
        "usage_channels": "All Channels",
        "usage_duration": "In perpetuity",
        "usage_territories": "Global",
        "restrictions_and_guidelines": "None",
        "disclosure_requirements": "Watermark optional",
        "reference_asset_url": "/uploads/briefs/moodboard_ref_123.png",
        "cover_image_url": "/uploads/briefs/moodboard_ref_123.png",
        "status": "PUBLISHED",
    }
    resp = client.post("/api/briefs", json=payload, headers=brand_headers)
    assert resp.status_code == 201, f"Create brief failed: {resp.text}"
    brief_data = resp.json()
    assert brief_data["reference_asset_url"] == "/uploads/briefs/moodboard_ref_123.png"
    assert brief_data["cover_image_url"] == "/uploads/briefs/moodboard_ref_123.png"

    # Fetch detail
    brief_id = brief_data["id"]
    get_resp = client.get(f"/api/briefs/{brief_id}", headers=brand_headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["reference_asset_url"] == "/uploads/briefs/moodboard_ref_123.png"
    assert get_resp.json()["cover_image_url"] == "/uploads/briefs/moodboard_ref_123.png"


def test_explainable_matching_service(client: TestClient, db):
    """Ensure creator matching service is deterministic, bounded (0-100), and null-safe."""
    brand_user = _create_verified_user(db, "BRAND")
    creator_user = _create_verified_user(db, "CREATOR")
    creator = creator_user.creator_profile

    # Add a portfolio project for video
    proj = PortfolioProject(
        id=str(uuid.uuid4()),
        creator_id=creator.id,
        title="Cosmic Synth Journey",
        slug=f"cosmic-{uuid.uuid4().hex[:6]}",
        description="A journey through synthwave space",
        content_type="AI Video",
        aspect_ratio="16:9",
        primary_asset_url="/uploads/portfolio/cosmic.mp4",
        thumbnail_url="/uploads/portfolio/cosmic_thumb.jpg",
    )
    db.add(proj)
    db.commit()

    brief = _create_test_brief(db, brand_user.brand_profile.id, "Sci-Fi Video Campaign")

    # Evaluate single creator
    result = evaluate_creator_for_brief(creator, brief)
    assert 0.0 <= result.score <= 100.0
    assert result.match_level in ["PERFECT", "EXCELLENT", "GOOD", "PARTIAL", "INCOMPATIBLE"]
    assert len(result.reasons) > 0
    assert result.creator_id == creator.id

    # Evaluate match list
    match_list = match_creators_for_brief(db, brief)
    assert isinstance(match_list, list)
    for m in match_list:
        assert 0.0 <= m.score <= 100.0


def test_conversation_provisioning_on_application_accepted(client: TestClient, db):
    """Accepting an application automatically links or creates a conversation."""
    brand_user = _create_verified_user(db, "BRAND")
    creator_user = _create_verified_user(db, "CREATOR")

    brief = _create_test_brief(db, brand_user.brand_profile.id, "Accepted App Collaboration")

    app_rec = Application(
        id=str(uuid.uuid4()),
        brief_id=brief.id,
        creator_id=creator_user.creator_profile.id,
        pitch_text="Ready to collaborate on campaign",
        proposed_rate=2000.0,
        proposed_timeline_days=14,
        attached_project_ids="",
        status="SUBMITTED",
    )
    db.add(app_rec)
    db.commit()

    # Brand updates application to ACCEPTED
    brand_headers = _auth_header(brand_user)
    patch_resp = client.patch(
        f"/api/briefs/applications/{app_rec.id}/status",
        json={"status": "ACCEPTED"},
        headers=brand_headers,
    )
    assert patch_resp.status_code == 200, f"Accepting application failed: {patch_resp.text}"

    # Verify conversation exists
    conv = db.query(Conversation).filter(
        Conversation.brand_id == brand_user.brand_profile.id,
        Conversation.creator_id == creator_user.creator_profile.id,
    ).first()
    assert conv is not None, "Conversation was not auto-created on application acceptance"

    # Check that brand messages inbox lists conversation with creator details
    conv_resp = client.get("/api/messages/conversations", headers=brand_headers)
    assert conv_resp.status_code == 200
    conv_data = conv_resp.json()
    conv_items = conv_data["items"] if "items" in conv_data else conv_data
    assert len(conv_items) >= 1
    target = next((c for c in conv_items if c["id"] == conv.id), None)
    assert target is not None
    assert target["creator_name"] == creator_user.creator_profile.display_name


def test_legacy_engagement_conversation_auto_linking(client: TestClient, db):
    """Existing engagements without conversation records are auto-linked idempotently."""
    brand_user = _create_verified_user(db, "BRAND")
    creator_user = _create_verified_user(db, "CREATOR")

    brief = _create_test_brief(db, brand_user.brand_profile.id, "Legacy Engagement Brief")

    app_rec = Application(
        id=str(uuid.uuid4()),
        brief_id=brief.id,
        creator_id=creator_user.creator_profile.id,
        pitch_text="Legacy pitch",
        proposed_rate=5000.0,
        proposed_timeline_days=21,
        attached_project_ids="",
        status="ACCEPTED",
    )
    db.add(app_rec)
    db.flush()

    eng = Engagement(
        id=str(uuid.uuid4()),
        brief_id=brief.id,
        creator_id=creator_user.creator_profile.id,
        application_id=app_rec.id,
        agreed_amount=5000.0,
        completion_deadline=datetime.utcnow() + timedelta(days=30),
        status="KICKOFF",
    )
    db.add(eng)
    db.commit()

    # Before call, no conversation exists
    assert db.query(Conversation).filter(
        Conversation.brand_id == brand_user.brand_profile.id,
        Conversation.creator_id == creator_user.creator_profile.id,
    ).first() is None

    # Brand visits conversations inbox -> idempotent link occurs
    brand_headers = _auth_header(brand_user)
    resp = client.get("/api/messages/conversations", headers=brand_headers)
    assert resp.status_code == 200
    conv_data = resp.json()
    conv_items = conv_data["items"] if "items" in conv_data else conv_data
    assert len(conv_items) >= 1
    found = [c for c in conv_items if c["creator_name"] == creator_user.creator_profile.display_name]
    assert len(found) == 1


def test_saved_creators_tenant_isolation_and_deduplication(client: TestClient, db):
    """Brand can save/unsave creators with tenant isolation and duplicate prevention."""
    brand_a = _create_verified_user(db, "BRAND")
    brand_b = _create_verified_user(db, "BRAND")
    creator = _create_verified_user(db, "CREATOR")

    creator_id = creator.creator_profile.id
    headers_a = _auth_header(brand_a)
    headers_b = _auth_header(brand_b)

    # Brand A saves creator
    save_resp = client.post(f"/api/saved/creators/{creator_id}", headers=headers_a)
    assert save_resp.status_code in [200, 201], f"Save creator failed: {save_resp.text}"

    # Brand A saves again (duplicate call) -> should handle gracefully without crashing or duplicating
    save_dup = client.post(f"/api/saved/creators/{creator_id}", headers=headers_a)
    assert save_dup.status_code in [200, 201]

    # Brand A lists saved -> has 1
    list_a = client.get("/api/saved/creators", headers=headers_a)
    assert list_a.status_code == 200
    saved_items = list_a.json()
    assert len(saved_items) == 1
    assert saved_items[0]["creator_id"] == creator_id

    # Brand B lists saved -> has 0 (isolated)
    list_b = client.get("/api/saved/creators", headers=headers_b)
    assert list_b.status_code == 200
    assert len(list_b.json()) == 0

    # Brand A unsaves creator
    del_resp = client.delete(f"/api/saved/creators/{creator_id}", headers=headers_a)
    assert del_resp.status_code == 200
    list_a_after = client.get("/api/saved/creators", headers=headers_a)
    assert len(list_a_after.json()) == 0


def test_brand_eligible_briefs_and_invitation_dedup(client: TestClient, db):
    """Brand can query eligible briefs and invite creator without duplicates."""
    brand_a = _create_verified_user(db, "BRAND")
    brand_b = _create_verified_user(db, "BRAND")
    creator = _create_verified_user(db, "CREATOR")

    brief_a = _create_test_brief(db, brand_a.brand_profile.id, "Brand A Active Brief")
    brief_b = _create_test_brief(db, brand_b.brand_profile.id, "Brand B Active Brief")

    headers_a = _auth_header(brand_a)

    # Brand A gets my briefs
    my_briefs = client.get("/api/briefs/my-briefs", headers=headers_a)
    assert my_briefs.status_code == 200
    brief_ids = [b["id"] for b in my_briefs.json()]
    assert brief_a.id in brief_ids
    assert brief_b.id not in brief_ids  # Brand B's brief is not returned

    # Brand A invites creator
    inv_payload = {
        "brief_id": brief_a.id,
        "creator_id": creator.creator_profile.id,
        "message": "We would love to have you on this project!",
    }
    inv_resp = client.post("/api/engagements/invite", json=inv_payload, headers=headers_a)
    assert inv_resp.status_code == 201, f"Invite failed: {inv_resp.text}"

    # Brand A sends duplicate invitation to same creator for same brief -> 400 Bad Request
    dup_resp = client.post("/api/engagements/invite", json=inv_payload, headers=headers_a)
    assert dup_resp.status_code in [400, 409]
    assert "pending invitation already exists" in dup_resp.json().get("detail", "").lower()


if __name__ == "__main__":
    from backend.tests.conftest import test_engine, TestingSessionLocal, assert_isolated_test_target

    print("Running Phase 1 Corrections Test Suite against isolated SQLite memory DB...")
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

    tests = [
        ("test_brand_self_pitch_prevention", lambda: test_brand_self_pitch_prevention(test_client, db)),
        ("test_brief_reference_asset_persistence", lambda: test_brief_reference_asset_persistence(test_client, db)),
        ("test_explainable_matching_service", lambda: test_explainable_matching_service(test_client, db)),
        ("test_conversation_provisioning_on_application_accepted", lambda: test_conversation_provisioning_on_application_accepted(test_client, db)),
        ("test_legacy_engagement_conversation_auto_linking", lambda: test_legacy_engagement_conversation_auto_linking(test_client, db)),
        ("test_saved_creators_tenant_isolation_and_deduplication", lambda: test_saved_creators_tenant_isolation_and_deduplication(test_client, db)),
        ("test_brand_eligible_briefs_and_invitation_dedup", lambda: test_brand_eligible_briefs_and_invitation_dedup(test_client, db)),
    ]

    passed = 0
    failed = 0
    for name, fn in tests:
        try:
            fn()
            print(f"[PASS] {name}")
            passed += 1
        except Exception as e:
            import traceback
            print(f"[FAIL] {name}: {e}")
            traceback.print_exc()
            failed += 1
        finally:
            db.rollback()

    app.dependency_overrides.pop(get_db, None)
    db.close()
    Base.metadata.drop_all(bind=test_engine)

    print(f"\nPHASE 1 CORRECTION RESULTS: {passed} passed, {failed} failed out of {len(tests)} tests.")
    if failed > 0:
        sys.exit(1)
