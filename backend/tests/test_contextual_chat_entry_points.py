"""
Contextual Chat Entry Points Regression Test Suite.
Verifies all 10 requirements and scenarios:
1. Brand clicks Chat on creator profile -> opens correct eligible conversation.
2. Creator clicks Chat with Brand on published brief -> opens correct brand conversation.
3. Brand with multiple creators -> opens intended creator conversation.
4. Creator with briefs from multiple brands -> opens correct brand conversation.
5. Multiple briefs belonging to same brand -> strictly isolated campaign context.
6. Repeated clicks -> idempotent, no duplicate conversations created.
7. Unauthorized users -> server-side rejection, cannot read or write messages.
8. Restrictions on pending/ineligible relationships -> returned as ineligible with actionable guidance.
9. Inbox direct access -> listing all conversations still works directly without contextual query.
10. Bidirectional persistence -> messages persist and appear in both Creator Hub and Brand Portal.
"""

import sys
from pathlib import Path
import uuid
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
    Message,
)
from backend.app.core.security import create_access_token, hash_password


def _create_verified_user(db, role: str) -> User:
    email = f"user_{role.lower()}_{uuid.uuid4().hex[:8]}@example.com"
    user = User(
        id=str(uuid.uuid4()),
        email=email,
        hashed_password=hash_password("SecurePassword123!"),
        role=role,
        is_email_verified=True,
        created_at=datetime.now(timezone.utc),
    )
    db.add(user)
    db.commit()

    if role == "CREATOR":
        creator = CreatorProfile(
            id=str(uuid.uuid4()),
            user_id=user.id,
            handle=f"creator_{uuid.uuid4().hex[:6]}",
            display_name=f"Creator {uuid.uuid4().hex[:4]}",
            bio="AI Creative Specialist",
            avatar_url="/assets/avatars/elena.jpg",
            location="Remote",
            years_experience=3,
            primary_specialization="VIDEO",
            min_budget=1500.0,
            availability_status="AVAILABLE",
            verification_tier="VERIFIED_PRO",
            created_at=datetime.now(timezone.utc),
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
    return user


def _create_brief(db, brand_profile_id: str, title: str = "Test Campaign Brief", status: str = "PUBLISHED") -> Brief:
    brief = Brief(
        id=str(uuid.uuid4()),
        brand_id=brand_profile_id,
        title=title,
        slug=f"{title.lower().replace(' ', '-')}-{uuid.uuid4().hex[:6]}",
        campaign_objective="Brand launch visual campaign",
        target_audience="Global consumer audience",
        content_type="VIDEO",
        creative_style_mood="Cinematic & Bold",
        aspect_ratio="16:9",
        resolution_min="4K UHD",
        deliverables_description="1x 60s 4K master deliverable",
        revision_allowance=2,
        budget_amount=5000.0,
        budget_currency="USD",
        deadline=datetime.now(timezone.utc),
        commercial_use_requirements="Full digital & broadcast rights included",
        usage_channels="Paid Social, Web, Broadcast",
        usage_duration="12 Months",
        usage_territories="Worldwide",
        restrictions_and_guidelines="Original assets only",
        disclosure_requirements="Creator attribution required",
        status=status,
        created_at=datetime.now(timezone.utc),
    )
    db.add(brief)
    db.commit()
    db.refresh(brief)
    return brief


def _create_application(db, brief_id: str, creator_profile_id: str, status: str = "ACCEPTED") -> Application:
    app = Application(
        id=f"app-{uuid.uuid4().hex[:8]}",
        brief_id=brief_id,
        creator_id=creator_profile_id,
        pitch_text="Pitch for commercial campaign with AI workflow.",
        proposed_rate=5000.0,
        proposed_timeline_days=14,
        attached_project_ids="[]",
        status=status,
        submitted_at=datetime.utcnow(),
        reviewed_at=datetime.utcnow(),
    )
    db.add(app)
    db.commit()
    db.refresh(app)
    return app


def _create_engagement(db, brief_id: str, creator_profile_id: str, status: str = "KICKOFF", app_id: str = None) -> Engagement:
    if not app_id:
        app = _create_application(db, brief_id, creator_profile_id, status="ACCEPTED")
        app_id = app.id
    eng = Engagement(
        id=str(uuid.uuid4()),
        brief_id=brief_id,
        creator_id=creator_profile_id,
        application_id=app_id,
        status=status,
        agreed_amount=5000.0,
        start_date=datetime.utcnow(),
        completion_deadline=datetime.utcnow() + timedelta(days=30),
        created_at=datetime.utcnow(),
    )
    db.add(eng)
    db.commit()
    db.refresh(eng)
    return eng


# SCENARIO 1: Brand clicks Chat on creator profile and opens correct eligible conversation
def test_brand_clicks_chat_on_creator_profile(client, isolated_db):
    brand_user = _create_verified_user(isolated_db, "BRAND")
    creator_user = _create_verified_user(isolated_db, "CREATOR")
    brief = _create_brief(isolated_db, brand_user.brand_profile.id, title="Summer Campaign")
    _create_engagement(isolated_db, brief.id, creator_user.creator_profile.id, status="KICKOFF")

    brand_token = create_access_token({"sub": brand_user.id, "email": brand_user.email, "role": "BRAND"})
    headers = {"Authorization": f"Bearer {brand_token}"}

    # Brand calls contextual-conversation endpoint with creator_id
    res = client.get(f"/api/messages/contextual-conversation?creator_id={creator_user.creator_profile.id}", headers=headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["status"] == "found"
    assert data["conversation"] is not None
    assert data["conversation"]["creator_id"] == creator_user.creator_profile.id
    assert data["conversation"]["brand_id"] == brand_user.brand_profile.id

    conv_id = data["conversation"]["id"]

    # Verify conversation can be directly fetched by ID
    get_conv_res = client.get(f"/api/messages/conversations/{conv_id}", headers=headers)
    assert get_conv_res.status_code == 200
    assert get_conv_res.json()["id"] == conv_id


# SCENARIO 2: Creator clicks Chat with Brand on a published brief
def test_creator_clicks_chat_with_brand_on_published_brief(client, isolated_db):
    brand_user = _create_verified_user(isolated_db, "BRAND")
    creator_user = _create_verified_user(isolated_db, "CREATOR")
    brief = _create_brief(isolated_db, brand_user.brand_profile.id, title="Lumina Serum Launch")
    _create_application(isolated_db, brief.id, creator_user.creator_profile.id, status="ACCEPTED")

    creator_token = create_access_token({"sub": creator_user.id, "email": creator_user.email, "role": "CREATOR"})
    headers = {"Authorization": f"Bearer {creator_token}"}

    # Creator calls contextual-conversation with brief_id
    res = client.get(f"/api/messages/contextual-conversation?brief_id={brief.id}", headers=headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["status"] == "found"
    assert data["conversation"]["brief_id"] == brief.id
    assert data["conversation"]["brand_id"] == brand_user.brand_profile.id
    assert data["conversation"]["creator_id"] == creator_user.creator_profile.id


# SCENARIO 3: Brand with multiple creators opens intended creator conversation
def test_brand_with_multiple_creators_opens_intended_conversation(client, isolated_db):
    brand_user = _create_verified_user(isolated_db, "BRAND")
    creator1 = _create_verified_user(isolated_db, "CREATOR")
    creator2 = _create_verified_user(isolated_db, "CREATOR")

    brief1 = _create_brief(isolated_db, brand_user.brand_profile.id, title="Campaign 1")
    brief2 = _create_brief(isolated_db, brand_user.brand_profile.id, title="Campaign 2")

    _create_engagement(isolated_db, brief1.id, creator1.creator_profile.id, status="KICKOFF")
    _create_engagement(isolated_db, brief2.id, creator2.creator_profile.id, status="KICKOFF")

    brand_token = create_access_token({"sub": brand_user.id, "email": brand_user.email, "role": "BRAND"})
    headers = {"Authorization": f"Bearer {brand_token}"}

    res1 = client.get(f"/api/messages/contextual-conversation?creator_id={creator1.creator_profile.id}", headers=headers)
    assert res1.status_code == 200
    conv1 = res1.json()["conversation"]

    res2 = client.get(f"/api/messages/contextual-conversation?creator_id={creator2.creator_profile.id}", headers=headers)
    assert res2.status_code == 200
    conv2 = res2.json()["conversation"]

    assert conv1["id"] != conv2["id"]
    assert conv1["creator_id"] == creator1.creator_profile.id
    assert conv2["creator_id"] == creator2.creator_profile.id


# SCENARIO 4: Creator with briefs from multiple brands opens correct brand conversation
def test_creator_with_briefs_from_multiple_brands(client, isolated_db):
    brand_a = _create_verified_user(isolated_db, "BRAND")
    brand_b = _create_verified_user(isolated_db, "BRAND")
    creator = _create_verified_user(isolated_db, "CREATOR")

    brief_a = _create_brief(isolated_db, brand_a.brand_profile.id, title="Brand A Brief")
    brief_b = _create_brief(isolated_db, brand_b.brand_profile.id, title="Brand B Brief")

    _create_application(isolated_db, brief_a.id, creator.creator_profile.id, status="ACCEPTED")
    _create_application(isolated_db, brief_b.id, creator.creator_profile.id, status="ACCEPTED")

    creator_token = create_access_token({"sub": creator.id, "email": creator.email, "role": "CREATOR"})
    headers = {"Authorization": f"Bearer {creator_token}"}

    res_a = client.get(f"/api/messages/contextual-conversation?brief_id={brief_a.id}", headers=headers)
    assert res_a.status_code == 200
    data_a = res_a.json()
    assert data_a["conversation"]["brand_id"] == brand_a.brand_profile.id
    assert data_a["conversation"]["brief_id"] == brief_a.id

    res_b = client.get(f"/api/messages/contextual-conversation?brief_id={brief_b.id}", headers=headers)
    assert res_b.status_code == 200
    data_b = res_b.json()
    assert data_b["conversation"]["brand_id"] == brand_b.brand_profile.id
    assert data_b["conversation"]["brief_id"] == brief_b.id

    assert data_a["conversation"]["id"] != data_b["conversation"]["id"]


# SCENARIO 5: Multiple briefs belonging to same brand do not cause wrong campaign context
def test_multiple_briefs_same_brand_isolated_campaign_context(client, isolated_db):
    brand = _create_verified_user(isolated_db, "BRAND")
    creator = _create_verified_user(isolated_db, "CREATOR")

    brief_1 = _create_brief(isolated_db, brand.brand_profile.id, title="Brand Alpha Brief 1")
    brief_2 = _create_brief(isolated_db, brand.brand_profile.id, title="Brand Alpha Brief 2")

    # Creator only applied to Brief 1
    _create_application(isolated_db, brief_1.id, creator.creator_profile.id, status="ACCEPTED")

    creator_token = create_access_token({"sub": creator.id, "email": creator.email, "role": "CREATOR"})
    headers = {"Authorization": f"Bearer {creator_token}"}

    # Requesting Brief 1 opens Brief 1's conversation
    res1 = client.get(f"/api/messages/contextual-conversation?brief_id={brief_1.id}", headers=headers)
    assert res1.status_code == 200
    assert res1.json()["status"] == "found"
    assert res1.json()["conversation"]["brief_id"] == brief_1.id

    # Requesting Brief 2 must NOT return Brief 1's conversation
    res2 = client.get(f"/api/messages/contextual-conversation?brief_id={brief_2.id}", headers=headers)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["status"] == "ineligible"
    assert data2["required_action"] == "APPLY"
    assert "Brief 2" in data2["reason"] or "application" in data2["reason"]


# SCENARIO 6: Repeated clicks do not create duplicate conversations
def test_repeated_clicks_do_not_create_duplicates(client, isolated_db):
    brand = _create_verified_user(isolated_db, "BRAND")
    creator = _create_verified_user(isolated_db, "CREATOR")
    brief = _create_brief(isolated_db, brand.brand_profile.id, title="Idempotent Brief")
    _create_engagement(isolated_db, brief.id, creator.creator_profile.id, status="KICKOFF")

    brand_token = create_access_token({"sub": brand.id, "email": brand.email, "role": "BRAND"})
    headers = {"Authorization": f"Bearer {brand_token}"}

    first_res = client.get(f"/api/messages/contextual-conversation?creator_id={creator.creator_profile.id}", headers=headers)
    assert first_res.status_code == 200
    conv_id_1 = first_res.json()["conversation"]["id"]

    for _ in range(5):
        subsequent_res = client.get(f"/api/messages/contextual-conversation?creator_id={creator.creator_profile.id}", headers=headers)
        assert subsequent_res.status_code == 200
        assert subsequent_res.json()["conversation"]["id"] == conv_id_1

    # Verify database has exactly 1 conversation
    total_convs = isolated_db.query(Conversation).filter(
        Conversation.brand_id == brand.brand_profile.id,
        Conversation.creator_id == creator.creator_profile.id,
    ).count()
    assert total_convs == 1


# SCENARIO 7: Unauthorized users cannot open or send messages to arbitrary participants
def test_unauthorized_users_cannot_access_or_send_messages(client, isolated_db):
    brand_a = _create_verified_user(isolated_db, "BRAND")
    brand_b = _create_verified_user(isolated_db, "BRAND")
    creator_a = _create_verified_user(isolated_db, "CREATOR")
    creator_b = _create_verified_user(isolated_db, "CREATOR")

    brief_a = _create_brief(isolated_db, brand_a.brand_profile.id, title="Private Brief")
    _create_engagement(isolated_db, brief_a.id, creator_a.creator_profile.id, status="KICKOFF")

    brand_a_token = create_access_token({"sub": brand_a.id, "email": brand_a.email, "role": "BRAND"})
    res = client.get(f"/api/messages/contextual-conversation?creator_id={creator_a.creator_profile.id}", headers={"Authorization": f"Bearer {brand_a_token}"})
    conv_id = res.json()["conversation"]["id"]

    # Brand B tries to access Conversation of Brand A
    brand_b_token = create_access_token({"sub": brand_b.id, "email": brand_b.email, "role": "BRAND"})
    headers_b = {"Authorization": f"Bearer {brand_b_token}"}

    get_res = client.get(f"/api/messages/conversations/{conv_id}", headers=headers_b)
    assert get_res.status_code == 404

    msg_res = client.get(f"/api/messages/conversations/{conv_id}/messages", headers=headers_b)
    assert msg_res.status_code == 404

    send_res = client.post(f"/api/messages/conversations/{conv_id}/messages", headers=headers_b, json={"content": "Malicious probe"})
    assert send_res.status_code in [403, 404]

    # Creator B tries to access Conversation between Brand A and Creator A
    creator_b_token = create_access_token({"sub": creator_b.id, "email": creator_b.email, "role": "CREATOR"})
    headers_cb = {"Authorization": f"Bearer {creator_b_token}"}

    assert client.get(f"/api/messages/conversations/{conv_id}", headers=headers_cb).status_code == 404
    assert client.post(f"/api/messages/conversations/{conv_id}/messages", headers=headers_cb, json={"content": "Malicious probe"}).status_code in [403, 404]


# SCENARIO 8: Messaging restrictions are respected for pending or ineligible relationships
def test_restrictions_respected_for_pending_or_ineligible(client, isolated_db):
    brand = _create_verified_user(isolated_db, "BRAND")
    creator = _create_verified_user(isolated_db, "CREATOR")

    # Ineligible Brand view: no engagement/application/invitation
    brand_token = create_access_token({"sub": brand.id, "email": brand.email, "role": "BRAND"})
    res_brand = client.get(f"/api/messages/contextual-conversation?creator_id={creator.creator_profile.id}", headers={"Authorization": f"Bearer {brand_token}"})
    assert res_brand.status_code == 200
    data_brand = res_brand.json()
    assert data_brand["status"] == "ineligible"
    assert data_brand["required_action"] == "INVITE"
    assert data_brand["conversation"] is None

    # Ineligible Creator view: application is PENDING
    brief = _create_brief(isolated_db, brand.brand_profile.id, title="Under Review Brief")
    _create_application(isolated_db, brief.id, creator.creator_profile.id, status="PENDING")

    creator_token = create_access_token({"sub": creator.id, "email": creator.email, "role": "CREATOR"})
    res_creator = client.get(f"/api/messages/contextual-conversation?brief_id={brief.id}", headers={"Authorization": f"Bearer {creator_token}"})
    assert res_creator.status_code == 200
    data_creator = res_creator.json()
    assert data_creator["status"] == "ineligible"
    assert data_creator["required_action"] == "APPLY"
    assert data_creator["conversation"] is None

    # Draft brief: must return 404
    draft_brief = _create_brief(isolated_db, brand.brand_profile.id, title="Secret Draft", status="DRAFT")
    res_draft = client.get(f"/api/messages/contextual-conversation?brief_id={draft_brief.id}", headers={"Authorization": f"Bearer {creator_token}"})
    assert res_draft.status_code == 404


# SCENARIO 9: Inbox works when opened directly without contextual button
def test_inbox_works_directly_without_contextual_button(client, isolated_db):
    brand = _create_verified_user(isolated_db, "BRAND")
    creator1 = _create_verified_user(isolated_db, "CREATOR")
    creator2 = _create_verified_user(isolated_db, "CREATOR")

    brief1 = _create_brief(isolated_db, brand.brand_profile.id, title="Brief Alpha")
    brief2 = _create_brief(isolated_db, brand.brand_profile.id, title="Brief Beta")

    _create_engagement(isolated_db, brief1.id, creator1.creator_profile.id, status="KICKOFF")
    _create_engagement(isolated_db, brief2.id, creator2.creator_profile.id, status="KICKOFF")

    # Brand accesses general inbox
    brand_token = create_access_token({"sub": brand.id, "email": brand.email, "role": "BRAND"})
    res = client.get("/api/messages/conversations", headers={"Authorization": f"Bearer {brand_token}"})
    assert res.status_code == 200
    conv_data = res.json()
    conv_list = conv_data["items"] if isinstance(conv_data, dict) and "items" in conv_data else conv_data
    assert isinstance(conv_list, list)
    assert len(conv_list) >= 2


# SCENARIO 10: Messages persist after refresh and appear in both Creator Hub and Brand Portal
def test_messages_bidirectional_persistence(client, isolated_db):
    brand = _create_verified_user(isolated_db, "BRAND")
    creator = _create_verified_user(isolated_db, "CREATOR")
    brief = _create_brief(isolated_db, brand.brand_profile.id, title="Full Cycle Campaign")
    _create_engagement(isolated_db, brief.id, creator.creator_profile.id, status="KICKOFF")

    brand_token = create_access_token({"sub": brand.id, "email": brand.email, "role": "BRAND"})
    creator_token = create_access_token({"sub": creator.id, "email": creator.email, "role": "CREATOR"})

    brand_headers = {"Authorization": f"Bearer {brand_token}"}
    creator_headers = {"Authorization": f"Bearer {creator_token}"}

    # Brand opens chat and sends message
    init_res = client.get(f"/api/messages/contextual-conversation?creator_id={creator.creator_profile.id}", headers=brand_headers)
    conv_id = init_res.json()["conversation"]["id"]

    send_brand = client.post(
        f"/api/messages/conversations/{conv_id}/messages",
        headers=brand_headers,
        json={"content": "Welcome to the campaign, please review the storyboard."},
    )
    assert send_brand.status_code in [200, 201]
    brand_msg_id = send_brand.json()["id"]

    # Creator fetches messages (simulating Hub opening)
    creator_msgs = client.get(f"/api/messages/conversations/{conv_id}/messages", headers=creator_headers)
    assert creator_msgs.status_code == 200
    items = creator_msgs.json()
    assert len(items) == 1
    assert items[0]["id"] == brand_msg_id
    assert items[0]["content"] == "Welcome to the campaign, please review the storyboard."
    assert items[0]["sender_id"] == brand.id

    # Creator replies
    send_creator = client.post(
        f"/api/messages/conversations/{conv_id}/messages",
        headers=creator_headers,
        json={"content": "Thank you! Storyboard looks great. Starting rough cuts."},
    )
    assert send_creator.status_code in [200, 201]
    creator_msg_id = send_creator.json()["id"]

    # Brand fetches messages (simulating page reload/refresh)
    brand_msgs_after_reload = client.get(f"/api/messages/conversations/{conv_id}/messages", headers=brand_headers)
    assert brand_msgs_after_reload.status_code == 200
    reloaded_items = brand_msgs_after_reload.json()
    assert len(reloaded_items) == 2
    assert reloaded_items[0]["id"] == brand_msg_id
    assert reloaded_items[1]["id"] == creator_msg_id
    assert reloaded_items[0]["created_at"].endswith("Z")
    assert reloaded_items[1]["created_at"].endswith("Z")


# SCENARIO 11: Creator brief invitation flow -> ineligible -> accept invitation -> unlocks chat & bidirectional messaging
def test_creator_brief_invitation_lifecycle_and_messaging(client, isolated_db):
    brand = _create_verified_user(isolated_db, "BRAND")
    creator = _create_verified_user(isolated_db, "CREATOR")
    brief = _create_brief(isolated_db, brand.brand_profile.id, title="Lumina Dewdrop Serum — Luxury Launch Campaign")

    # Brand creates an invitation (Application with status="INVITED")
    inv = _create_application(
        isolated_db,
        brief.id,
        creator.creator_profile.id,
        status="INVITED",
    )

    creator_token = create_access_token({"sub": creator.id, "email": creator.email, "role": "CREATOR"})
    brand_token = create_access_token({"sub": brand.id, "email": brand.email, "role": "BRAND"})
    creator_headers = {"Authorization": f"Bearer {creator_token}"}
    brand_headers = {"Authorization": f"Bearer {brand_token}"}

    # 1. Creator checks contextual conversation before accepting
    res_before = client.get(f"/api/messages/contextual-conversation?brief_id={brief.id}", headers=creator_headers)
    assert res_before.status_code == 200
    data_before = res_before.json()
    assert data_before["status"] == "ineligible"
    assert data_before["required_action"] == "ACCEPT_INVITATION"
    assert data_before["invitation_id"] == inv.id
    assert "invited" in data_before["reason"].lower()

    # 2. Creator accepts invitation
    accept_res = client.post(f"/api/engagements/invitations/{inv.id}/accept", headers=creator_headers)
    assert accept_res.status_code == 200
    assert accept_res.json()["status"] == "ACCEPTED"

    # 3. Creator checks contextual conversation after accepting -> must be found!
    res_after = client.get(f"/api/messages/contextual-conversation?brief_id={brief.id}", headers=creator_headers)
    assert res_after.status_code == 200
    data_after = res_after.json()
    assert data_after["status"] == "found"
    assert data_after["conversation"] is not None
    conv = data_after["conversation"]
    assert conv["brief_id"] == brief.id
    assert conv["brief_title"] == "Lumina Dewdrop Serum — Luxury Launch Campaign"
    assert conv["brand_name"] == brand.brand_profile.company_name
    conv_id = conv["id"]

    # 4. Creator sends message to brand
    send_msg = client.post(
        f"/api/messages/conversations/{conv_id}/messages",
        headers=creator_headers,
        json={"content": "Hi Lumina team! Delighted to accept your campaign invitation."},
    )
    assert send_msg.status_code in [200, 201]

    # 5. Brand checks inbox -> conversation listed with creator name and brief title
    brand_inbox = client.get("/api/messages/conversations", headers=brand_headers)
    assert brand_inbox.status_code == 200
    brand_convs = brand_inbox.json()["items"]
    assert any(c["id"] == conv_id for c in brand_convs)

    # 6. Brand replies
    reply_msg = client.post(
        f"/api/messages/conversations/{conv_id}/messages",
        headers=brand_headers,
        json={"content": "Welcome aboard! Excited to see your fluid dynamic concepts."},
    )
    assert reply_msg.status_code in [200, 201]

    # 7. Creator checks inbox -> conversation listed and messages populated
    creator_inbox = client.get("/api/messages/conversations", headers=creator_headers)
    assert creator_inbox.status_code == 200
    creator_convs = creator_inbox.json()["items"]
    assert any(c["id"] == conv_id for c in creator_convs)

    # 8. Messages list has both messages
    msgs_res = client.get(f"/api/messages/conversations/{conv_id}/messages", headers=creator_headers)
    assert msgs_res.status_code == 200
    assert len(msgs_res.json()) == 2


# ==============================================================================
# SPECIFIC VERIFICATION SCENARIOS A - F (KIVORA MASTER BUG-FIX SPEC)
# ==============================================================================

def test_scenario_a_brand_to_creator(client, isolated_db):
    """
    Test A: Brand opens creator profile -> Chat resolves exact creator conversation
    with correct name, avatar, and existing message history.
    """
    brand = _create_verified_user(isolated_db, "BRAND")
    creator = _create_verified_user(isolated_db, "CREATOR")
    brief = _create_brief(isolated_db, brand.brand_profile.id, title="Serum Campaign")
    eng = _create_engagement(isolated_db, brief.id, creator.creator_profile.id, status="KICKOFF")

    # Seed an existing message in conversation
    conv = isolated_db.query(Conversation).filter(Conversation.engagement_id == eng.id).first()
    if not conv:
        conv = Conversation(
            id=f"conv-{uuid.uuid4().hex[:10]}",
            engagement_id=eng.id,
            brief_id=brief.id,
            brand_id=brand.brand_profile.id,
            creator_id=creator.creator_profile.id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        isolated_db.add(conv)
        isolated_db.commit()

    seed_msg = Message(
        id=f"msg-{uuid.uuid4().hex[:10]}",
        conversation_id=conv.id,
        sender_id=creator.id,
        content="Hello from creator!",
        created_at=datetime.utcnow(),
    )
    isolated_db.add(seed_msg)
    isolated_db.commit()

    brand_token = create_access_token({"sub": brand.id, "email": brand.email, "role": "BRAND"})
    brand_headers = {"Authorization": f"Bearer {brand_token}"}

    # Brand requests contextual conversation for this creator
    res = client.get(
        f"/api/messages/contextual-conversation?creator_id={creator.creator_profile.id}",
        headers=brand_headers,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "found"
    assert data["conversation"]["id"] == conv.id
    assert data["conversation"]["creator_name"] == creator.creator_profile.display_name
    assert data["conversation"]["creator_avatar"] == creator.creator_profile.avatar_url

    # History loads correctly
    msgs = client.get(f"/api/messages/conversations/{conv.id}/messages", headers=brand_headers)
    assert msgs.status_code == 200
    assert len(msgs.json()) >= 1
    assert msgs.json()[0]["content"] == "Hello from creator!"


def test_scenario_b_creator_to_brand(client, isolated_db):
    """
    Test B: Creator opens published brief -> Chat with Brand resolves conversation
    for that exact brand and brief with brief title and brand identity.
    """
    brand = _create_verified_user(isolated_db, "BRAND")
    creator = _create_verified_user(isolated_db, "CREATOR")
    brief = _create_brief(isolated_db, brand.brand_profile.id, title="Holiday Film")
    _create_application(isolated_db, brief.id, creator.creator_profile.id, status="ACCEPTED")

    creator_token = create_access_token({"sub": creator.id, "email": creator.email, "role": "CREATOR"})
    creator_headers = {"Authorization": f"Bearer {creator_token}"}

    res = client.get(
        f"/api/messages/contextual-conversation?brief_id={brief.id}",
        headers=creator_headers,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "found"
    assert data["conversation"]["brief_id"] == brief.id
    assert data["conversation"]["brief_title"] == "Holiday Film"
    assert data["conversation"]["brand_id"] == brand.brand_profile.id
    assert data["brand_name"] == brand.brand_profile.company_name


def test_scenario_c_multiple_conversations_selection(client, isolated_db):
    """
    Test C: Account with multiple conversations selects requested brief/creator conversation,
    not the previously selected or first inbox entry.
    """
    brand = _create_verified_user(isolated_db, "BRAND")
    creator = _create_verified_user(isolated_db, "CREATOR")

    brief1 = _create_brief(isolated_db, brand.brand_profile.id, title="Brief Alpha")
    brief2 = _create_brief(isolated_db, brand.brand_profile.id, title="Brief Beta")

    _create_engagement(isolated_db, brief1.id, creator.creator_profile.id, status="KICKOFF")
    _create_engagement(isolated_db, brief2.id, creator.creator_profile.id, status="KICKOFF")

    creator_token = create_access_token({"sub": creator.id, "email": creator.email, "role": "CREATOR"})
    creator_headers = {"Authorization": f"Bearer {creator_token}"}

    # Request Brief 1
    res1 = client.get(f"/api/messages/contextual-conversation?brief_id={brief1.id}", headers=creator_headers)
    assert res1.status_code == 200
    conv1 = res1.json()["conversation"]
    assert conv1["brief_id"] == brief1.id

    # Request Brief 2 -> must return conv2, not conv1
    res2 = client.get(f"/api/messages/contextual-conversation?brief_id={brief2.id}", headers=creator_headers)
    assert res2.status_code == 200
    conv2 = res2.json()["conversation"]
    assert conv2["brief_id"] == brief2.id
    assert conv2["id"] != conv1["id"]

    # Direct fetch by ID returns each respective conversation correctly
    get1 = client.get(f"/api/messages/conversations/{conv1['id']}", headers=creator_headers)
    assert get1.status_code == 200
    assert get1.json()["id"] == conv1["id"]

    get2 = client.get(f"/api/messages/conversations/{conv2['id']}", headers=creator_headers)
    assert get2.status_code == 200
    assert get2.json()["id"] == conv2["id"]


def test_scenario_d_existing_conversation_no_misleading_unlock(client, isolated_db):
    """
    Test D: Profile with an authorized conversation returns found status without unlock notices.
    """
    brand = _create_verified_user(isolated_db, "BRAND")
    creator = _create_verified_user(isolated_db, "CREATOR")
    brief = _create_brief(isolated_db, brand.brand_profile.id, title="Existing Collab")
    _create_engagement(isolated_db, brief.id, creator.creator_profile.id, status="KICKOFF")

    brand_token = create_access_token({"sub": brand.id, "email": brand.email, "role": "BRAND"})
    brand_headers = {"Authorization": f"Bearer {brand_token}"}

    res = client.get(
        f"/api/messages/contextual-conversation?creator_id={creator.creator_profile.id}",
        headers=brand_headers,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "found"
    assert data["conversation"] is not None
    assert data.get("reason") is None


def test_scenario_e_no_eligible_conversation_clear_notice_and_protection(client, isolated_db):
    """
    Test E: Relationship without permission shows clear eligibility requirement;
    unauthorized messages cannot be sent.
    """
    brand = _create_verified_user(isolated_db, "BRAND")
    creator = _create_verified_user(isolated_db, "CREATOR")
    brief = _create_brief(isolated_db, brand.brand_profile.id, title="Unapplied Brief")

    creator_token = create_access_token({"sub": creator.id, "email": creator.email, "role": "CREATOR"})
    creator_headers = {"Authorization": f"Bearer {creator_token}"}

    res = client.get(
        f"/api/messages/contextual-conversation?brief_id={brief.id}",
        headers=creator_headers,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ineligible"
    assert data["conversation"] is None
    assert "pitch" in data["reason"].lower() or "application" in data["reason"].lower()
    assert data["required_action"] == "APPLY"

    # Attempting to post message to an invalid/unauthorized conversation fails
    bad_send = client.post(
        "/api/messages/conversations/nonexistent-conv-id/messages",
        headers=creator_headers,
        json={"content": "Attempting unauthorized message."},
    )
    assert bad_send.status_code == 404


def test_scenario_f_persistence_and_cross_user_isolation(client, isolated_db):
    """
    Test F: Refresh/direct access preserves selection; another user is denied access.
    """
    brand1 = _create_verified_user(isolated_db, "BRAND")
    creator1 = _create_verified_user(isolated_db, "CREATOR")
    brief1 = _create_brief(isolated_db, brand1.brand_profile.id, title="Isolated Campaign")
    _create_engagement(isolated_db, brief1.id, creator1.creator_profile.id, status="KICKOFF")

    creator1_token = create_access_token({"sub": creator1.id, "email": creator1.email, "role": "CREATOR"})
    creator1_headers = {"Authorization": f"Bearer {creator1_token}"}

    # Provision/resolve legitimate conversation
    res = client.get(f"/api/messages/contextual-conversation?brief_id={brief1.id}", headers=creator1_headers)
    assert res.status_code == 200
    conv = res.json()["conversation"]
    assert conv is not None
    conv_id = conv["id"]

    # 1. Direct fetch succeeds (simulates page refresh on /messages?conversationId=...)
    get_res = client.get(f"/api/messages/conversations/{conv_id}", headers=creator1_headers)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == conv_id

    # 2. Another unrelated creator tries to access the conversation ID
    unrelated_creator = _create_verified_user(isolated_db, "CREATOR")
    unrelated_token = create_access_token({"sub": unrelated_creator.id, "email": unrelated_creator.email, "role": "CREATOR"})
    unrelated_headers = {"Authorization": f"Bearer {unrelated_token}"}

    forbidden_res = client.get(f"/api/messages/conversations/{conv_id}", headers=unrelated_headers)
    assert forbidden_res.status_code in [403, 404]

    forbidden_msgs = client.get(f"/api/messages/conversations/{conv_id}/messages", headers=unrelated_headers)
    assert forbidden_msgs.status_code in [403, 404]


def test_creator_resolves_chat_with_brand_by_brand_id(client, isolated_db):
    """
    Test Creator clicking Chat with Brand directly via brand_id.
    """
    brand = _create_verified_user(isolated_db, "BRAND")
    creator = _create_verified_user(isolated_db, "CREATOR")
    brief = _create_brief(isolated_db, brand.brand_profile.id, title="Brand Direct Collab")
    _create_engagement(isolated_db, brief.id, creator.creator_profile.id, status="KICKOFF")

    creator_token = create_access_token({"sub": creator.id, "email": creator.email, "role": "CREATOR"})
    creator_headers = {"Authorization": f"Bearer {creator_token}"}

    # Query using brand_id directly
    res = client.get(
        f"/api/messages/contextual-conversation?brand_id={brand.brand_profile.id}",
        headers=creator_headers,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "found"
    assert data["conversation"]["brand_id"] == brand.brand_profile.id
    assert data["conversation"]["creator_id"] == creator.creator_profile.id


def test_creator_resolves_chat_with_brand_by_brand_id_ineligible(client, isolated_db):
    """
    Test Creator clicking Chat with Brand directly via brand_id when no accepted relationship exists.
    """
    brand = _create_verified_user(isolated_db, "BRAND")
    creator = _create_verified_user(isolated_db, "CREATOR")

    creator_token = create_access_token({"sub": creator.id, "email": creator.email, "role": "CREATOR"})
    creator_headers = {"Authorization": f"Bearer {creator_token}"}

    res = client.get(
        f"/api/messages/contextual-conversation?brand_id={brand.brand_profile.id}",
        headers=creator_headers,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ineligible"
    assert data["conversation"] is None



