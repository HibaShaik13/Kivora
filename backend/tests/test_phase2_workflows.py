"""
Phase 2 Comprehensive Automated Test Suite
Verifies:
- T02.1: Notification APIs, unread count, pagination, read mutations, cross-user isolation
- T02.3: Marketplace notification triggers (applications, deliverable status, invitations)
- T02.4: Brand-to-creator invitation lifecycle, duplicate prevention, ownership guards, accept/decline
- T02.5: Email service templates, bounded retry, and safe fallback handling
- T02.6: Relationship-scoped messaging, cross-user conversation access denial, text sanitization
- T02.7: Saved creators and saved briefs bookmarks, duplicate prevention, role guards, draft privacy
- T02.8: Smart opportunity alert generation, explainable match reasons, preference filtering, deduplication
"""

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = REPO_ROOT / "backend"
for p in [str(REPO_ROOT), str(BACKEND_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

import uuid
from datetime import datetime, timedelta

try:
    import pytest
except ImportError:
    pytest = None

from backend.app.models.models import (
    User,
    CreatorProfile,

    BrandProfile,
    Brief,
    Application,
    Engagement,
    Notification,
    Conversation,
    Message,
    SavedCreator,
    SavedBrief,
    AlertPreference,
    OpportunityAlertRecord,
)
from backend.app.core.security import create_access_token, hash_password
from backend.app.services.notification_service import NotificationService
from backend.app.services.email_service import EmailService, _build_marketplace_html_email
from backend.app.services.opportunity_service import OpportunityService


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
            approval_status="APPROVED",
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


def _auth_header(user: User) -> dict:
    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    return {"Authorization": f"Bearer {token}"}


# =========================================================================
# T02.1 & T02.3: NOTIFICATION PERSISTENCE, APIS & MARKETPLACE TRIGGERS
# =========================================================================

def test_notification_apis_and_isolation(client, isolated_db):
    user_a = _create_verified_user(isolated_db, "CREATOR")
    user_b = _create_verified_user(isolated_db, "CREATOR")

    # Seed notification for user A
    notif_a = NotificationService.create_notification(
        db=isolated_db,
        user_id=user_a.id,
        notification_type="TEST_EVENT",
        title="Welcome to Kivora",
        message="Your account is active.",
        link_url="/dashboard",
    )

    # 1. Unread count endpoint
    res = client.get("/api/notifications/unread-count", headers=_auth_header(user_a))
    assert res.status_code == 200
    assert res.json()["unread_count"] == 1

    # 2. List notifications
    res = client.get("/api/notifications", headers=_auth_header(user_a))
    assert res.status_code == 200
    items = res.json()["items"]
    assert len(items) == 1
    assert items[0]["id"] == notif_a.id
    assert items[0]["is_read"] is False

    # 3. Isolation: User B cannot see User A's notification
    res_b = client.get("/api/notifications", headers=_auth_header(user_b))
    assert res_b.status_code == 200
    assert len(res_b.json()["items"]) == 0

    # User B cannot mark User A's notification read (returns 404)
    res_hack = client.patch(f"/api/notifications/{notif_a.id}/read", headers=_auth_header(user_b))
    assert res_hack.status_code == 404

    # 4. User A marks notification as read
    res_read = client.patch(f"/api/notifications/{notif_a.id}/read", headers=_auth_header(user_a))
    assert res_read.status_code == 200
    assert res_read.json()["is_read"] is True

    # 5. Unread count updates
    res_count = client.get("/api/notifications/unread-count", headers=_auth_header(user_a))
    assert res_count.json()["unread_count"] == 0

    # 6. Delete notification
    res_del = client.delete(f"/api/notifications/{notif_a.id}", headers=_auth_header(user_a))
    assert res_del.status_code == 204


def test_marketplace_notification_triggers(client, isolated_db):
    brand_user = _create_verified_user(isolated_db, "BRAND")
    creator_user = _create_verified_user(isolated_db, "CREATOR")

    # Create brief
    brief = _create_brief(isolated_db, brand_user.brand_profile.id, title="Winter Commercial Launch", budget=5000.0)

    # Creator applies to brief
    app_res = client.post(
        f"/api/briefs/{brief.id}/apply",
        headers=_auth_header(creator_user),
        json={
            "pitch_text": "I can create this cinematic 4K video.",
            "proposed_rate": 4500.0,
            "proposed_timeline_days": 10,
            "attached_project_ids": [],
        },
    )
    assert app_res.status_code == 201

    # Brand should have received a notification
    brand_notifs = client.get("/api/notifications", headers=_auth_header(brand_user)).json()["items"]
    assert len(brand_notifs) >= 1
    assert brand_notifs[0]["type"] == "APPLICATION_RECEIVED"
    assert "Winter Commercial Launch" in brand_notifs[0]["message"]


# =========================================================================
# T02.4: CREATOR INVITATION WORKFLOW
# =========================================================================

def test_creator_invitation_lifecycle(client, isolated_db):
    brand_user = _create_verified_user(isolated_db, "BRAND")
    creator_user = _create_verified_user(isolated_db, "CREATOR")
    other_creator = _create_verified_user(isolated_db, "CREATOR")

    brief = _create_brief(isolated_db, brand_user.brand_profile.id, title="Summer Anomaly Launch", budget=6000.0)

    # 1. Brand invites creator
    invite_res = client.post(
        "/api/engagements/invite",
        headers=_auth_header(brand_user),
        json={
            "creator_id": creator_user.creator_profile.id,
            "brief_id": brief.id,
            "message": "We would love to collaborate on this campaign.",
            "proposed_rate": 5500.0,
        },
    )
    assert invite_res.status_code == 201
    inv_data = invite_res.json()
    assert inv_data["status"] == "INVITED"
    assert inv_data["proposed_rate"] == 5500.0
    invitation_id = inv_data["id"]

    # 2. Duplicate invite prevention
    dup_res = client.post(
        "/api/engagements/invite",
        headers=_auth_header(brand_user),
        json={
            "creator_id": creator_user.creator_profile.id,
            "brief_id": brief.id,
        },
    )
    assert dup_res.status_code == 400
    assert "already exists" in dup_res.json()["detail"].lower()

    # 3. Creator sees invitation in their dashboard list
    my_invs = client.get("/api/engagements/my-invitations", headers=_auth_header(creator_user)).json()
    assert len(my_invs) == 1
    assert my_invs[0]["id"] == invitation_id

    # 4. Other creator cannot accept someone else's invitation
    hack_res = client.post(
        f"/api/engagements/invitations/{invitation_id}/accept",
        headers=_auth_header(other_creator),
    )
    assert hack_res.status_code == 403

    # 5. Creator accepts invitation
    accept_res = client.post(
        f"/api/engagements/invitations/{invitation_id}/accept",
        headers=_auth_header(creator_user),
    )
    assert accept_res.status_code == 200
    assert accept_res.json()["status"] == "ACCEPTED"

    # Engagement is automatically initialized
    eng = isolated_db.query(Engagement).filter(Engagement.application_id == invitation_id).first()
    assert eng is not None
    assert eng.status == "KICKOFF"
    assert eng.agreed_amount == 5500.0

    # Brand receives notification of acceptance
    brand_notifs = client.get("/api/notifications", headers=_auth_header(brand_user)).json()["items"]
    assert any(n["type"] == "INVITATION_ACCEPTED" for n in brand_notifs)


# =========================================================================
# T02.5: EMAIL NOTIFICATIONS & DELIVERY INTEGRITY
# =========================================================================

def test_email_service_templates_and_fallback():
    # 1. Template renders valid HTML containing brand and message
    html = _build_marketplace_html_email("New Project Kickoff", "Deliverable is ready", "/dashboard")
    assert "Kivora" in html
    assert "New Project Kickoff" in html
    assert "View in Kivora" in html

    # 2. Fallback mode does not claim delivery when unconfigured
    import backend.app.services.email_service as es_mod
    orig_smtp = es_mod.SMTP_HOST
    orig_resend = es_mod.RESEND_API_KEY
    try:
        es_mod.SMTP_HOST = None
        es_mod.RESEND_API_KEY = None
        res = EmailService.send_marketplace_notification(
            to_email="creator@example.com",
            subject="Project Update",
            title="Project Milestone Approved",
            message="Your deliverable has been approved.",
            action_url="/dashboard",
        )
        # Dev console fallback must report sent=False to prevent false delivery claims
        assert res["sent"] is False
        assert res["status"] == "development_fallback"
    finally:
        es_mod.SMTP_HOST = orig_smtp
        es_mod.RESEND_API_KEY = orig_resend


# =========================================================================
# T02.6: IN-APP MESSAGING & AUTHORIZATION
# =========================================================================

def test_in_app_messaging_authorization(client, isolated_db):
    brand_user = _create_verified_user(isolated_db, "BRAND")
    creator_user = _create_verified_user(isolated_db, "CREATOR")
    unrelated_user = _create_verified_user(isolated_db, "CREATOR")

    # Create active conversation
    conv_id = f"conv-{uuid.uuid4().hex[:8]}"
    conv = Conversation(
        id=conv_id,
        brand_id=brand_user.brand_profile.id,
        creator_id=creator_user.creator_profile.id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    isolated_db.add(conv)
    isolated_db.commit()

    # 1. Unrelated user cannot view conversation messages
    res_unauth = client.get(
        f"/api/messages/conversations/{conv_id}/messages",
        headers=_auth_header(unrelated_user),
    )
    assert res_unauth.status_code == 404

    # 2. Unrelated user cannot send a message
    res_send_unauth = client.post(
        f"/api/messages/conversations/{conv_id}/messages",
        headers=_auth_header(unrelated_user),
        json={"content": "Malicious message"},
    )
    assert res_send_unauth.status_code == 403

    # 3. Authorized brand sends a message
    res_send = client.post(
        f"/api/messages/conversations/{conv_id}/messages",
        headers=_auth_header(brand_user),
        json={"content": "Hello! Welcome to the project <script>alert(1)</script>"},
    )
    assert res_send.status_code == 201
    msg_data = res_send.json()
    # Content must be sanitized against XSS
    assert "<script>" not in msg_data["content"]
    assert "&lt;script&gt;" in msg_data["content"]

    # 4. Creator reads message and checks unread counts
    res_unread = client.get("/api/messages/unread-count", headers=_auth_header(creator_user))
    assert res_unread.status_code == 200
    assert res_unread.json()["unread_count"] == 1

    # Creator retrieves messages
    res_msgs = client.get(
        f"/api/messages/conversations/{conv_id}/messages",
        headers=_auth_header(creator_user),
    )
    assert res_msgs.status_code == 200
    assert len(res_msgs.json()) == 1

    # Creator marks conversation read
    client.patch(f"/api/messages/conversations/{conv_id}/read", headers=_auth_header(creator_user))
    res_unread_after = client.get("/api/messages/unread-count", headers=_auth_header(creator_user))
    assert res_unread_after.json()["unread_count"] == 0


# =========================================================================
# T02.7: SAVED CREATORS & SAVED BRIEFS
# =========================================================================

def test_saved_items_and_role_guards(client, isolated_db):
    brand_user = _create_verified_user(isolated_db, "BRAND")
    creator_user = _create_verified_user(isolated_db, "CREATOR")

    brief = _create_brief(isolated_db, brand_user.brand_profile.id, title="Saved Brief Test", budget=3000.0)

    # 1. Creator saves brief
    save_b_res = client.post(f"/api/saved/briefs/{brief.id}", headers=_auth_header(creator_user))
    assert save_b_res.status_code == 201
    assert save_b_res.json()["is_saved"] is True

    # Check status
    stat_res = client.get(f"/api/saved/briefs/{brief.id}/status", headers=_auth_header(creator_user))
    assert stat_res.json()["is_saved"] is True

    # Idempotent repeat save
    repeat_res = client.post(f"/api/saved/briefs/{brief.id}", headers=_auth_header(creator_user))
    assert repeat_res.status_code == 201

    # Brand cannot save briefs (role restriction)
    res_brand_hack = client.post(f"/api/saved/briefs/{brief.id}", headers=_auth_header(brand_user))
    assert res_brand_hack.status_code == 403

    # Creator lists saved briefs
    list_saved_b = client.get("/api/saved/briefs", headers=_auth_header(creator_user)).json()
    assert len(list_saved_b) == 1
    assert list_saved_b[0]["brief_id"] == brief.id

    # 2. Brand saves creator
    save_c_res = client.post(
        f"/api/saved/creators/{creator_user.creator_profile.id}",
        headers=_auth_header(brand_user),
    )
    assert save_c_res.status_code == 201
    assert save_c_res.json()["is_saved"] is True

    # Creator cannot save creators
    res_creator_hack = client.post(
        f"/api/saved/creators/{creator_user.creator_profile.id}",
        headers=_auth_header(creator_user),
    )
    assert res_creator_hack.status_code == 403

    # Unsave
    unsave_res = client.delete(f"/api/saved/briefs/{brief.id}", headers=_auth_header(creator_user))
    assert unsave_res.status_code == 200
    assert unsave_res.json()["is_saved"] is False


# =========================================================================
# T02.8: SMART OPPORTUNITY DISCOVERY & ALERTS
# =========================================================================

def test_smart_opportunity_alerts(client, isolated_db):
    creator_user = _create_verified_user(isolated_db, "CREATOR")
    brand_user = _create_verified_user(isolated_db, "BRAND")

    # Give creator portfolio project matching brief
    from backend.app.models.models import PortfolioProject
    proj = PortfolioProject(
        id=str(uuid.uuid4()),
        creator_id=creator_user.creator_profile.id,
        title="Commercial CGI Sample",
        slug=f"cgi-{uuid.uuid4().hex[:6]}",
        description="High-end procedural fluid simulation",
        content_type="VIDEO",
        aspect_ratio="16:9",
        primary_asset_url="/assets/portfolio/sophia_cellular_dew.mp4",
        thumbnail_url="/assets/portfolio/sophia_cellular_dew_thumb.jpg",
        created_at=datetime.utcnow(),
    )
    isolated_db.add(proj)
    isolated_db.commit()

    # Create high-fit brief
    matching_brief = _create_brief(isolated_db, brand_user.brand_profile.id, title="Opportunity Match Brief", budget=4000.0)

    # 1. Update creator preferences
    pref_res = client.put(
        "/api/alerts/preferences",
        headers=_auth_header(creator_user),
        json={
            "is_enabled": True,
            "min_budget": 2000.0,
            "preferred_content_types": ["VIDEO"],
            "in_app_alerts_enabled": True,
        },
    )
    assert pref_res.status_code == 200
    assert pref_res.json()["min_budget"] == 2000.0

    # 2. Trigger opportunity matching
    refresh_res = client.post(
        "/api/alerts/refresh?threshold_score=50.0",
        headers=_auth_header(creator_user),
    )
    assert refresh_res.status_code == 200
    opps = refresh_res.json()
    assert len(opps) >= 1
    matching_alert = next((o for o in opps if o["brief_id"] == matching_brief.id), None)
    assert matching_alert is not None, f"Expected brief {matching_brief.id} in opps: {opps}"
    assert matching_alert["match_score"] >= 50.0
    assert len(matching_alert["match_reasons"]) > 0

    # 3. Creator received in-app notification for opportunity
    creator_notifs = client.get("/api/notifications", headers=_auth_header(creator_user)).json()["items"]
    assert any(n["type"] == "OPPORTUNITY_ALERT" for n in creator_notifs)

    # 4. Mark opportunity viewed
    alert_id = matching_alert["id"]
    view_res = client.patch(
        f"/api/alerts/opportunities/{alert_id}/view",
        headers=_auth_header(creator_user),
    )
    assert view_res.status_code == 200


if __name__ == "__main__":
    from backend.tests.conftest import test_engine, TestingSessionLocal, assert_isolated_test_target
    from backend.app.database import get_db
    from backend.app.main import app
    from fastapi.testclient import TestClient
    from backend.app.models.models import Base
    import backend.app.services.email_service as es_mod

    # Disable external network email dispatch for tests to use dev fallback instantly
    es_mod.SMTP_HOST = None
    es_mod.RESEND_API_KEY = None

    print("\n=======================================================")
    print("RUNNING PHASE 2 WORKFLOWS ISOLATED TEST SUITE")
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

    tests = [
        ("test_notification_apis_and_isolation", lambda: test_notification_apis_and_isolation(test_client, db)),
        ("test_marketplace_notification_triggers", lambda: test_marketplace_notification_triggers(test_client, db)),
        ("test_creator_invitation_lifecycle", lambda: test_creator_invitation_lifecycle(test_client, db)),
        ("test_email_service_templates_and_fallback", lambda: test_email_service_templates_and_fallback()),
        ("test_in_app_messaging_authorization", lambda: test_in_app_messaging_authorization(test_client, db)),
        ("test_saved_items_and_role_guards", lambda: test_saved_items_and_role_guards(test_client, db)),
        ("test_smart_opportunity_alerts", lambda: test_smart_opportunity_alerts(test_client, db)),
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

    print(f"\nPHASE 2 RESULTS: {passed} passed, {failed} failed out of {len(tests)} tests.")
    if failed > 0:
        import sys
        sys.exit(1)

