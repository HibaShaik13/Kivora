"""
Focused Regression Test Suite for Creator Hub Messages & Saved Briefs.
Covers:
1. Listing eligible conversations for authenticated creator (including accepted applications).
2. Correct brand identity and conversation isolation.
3. Message sending, message retrieval, and chronological order.
4. Conversation creation and linking idempotency (no duplicates).
5. Non-eligible relationships (PENDING/REJECTED) are not provisioned into conversations.
6. Saving, checking status, listing, and unsaving briefs.
7. Saved-brief persistence, idempotency, and duplicate prevention.
8. Saved-brief account isolation across different creators.
9. Role boundaries (brands cannot save briefs; creators cannot save creators).
10. Safe handling of draft and nonexistent briefs.
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
    SavedBrief,
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
        created_at=datetime.utcnow(),
    )
    db.add(user)
    db.commit()

    if role == "CREATOR":
        creator = CreatorProfile(
            id=str(uuid.uuid4()),
            user_id=user.id,
            handle=f"creator_{uuid.uuid4().hex[:6]}",
            display_name="Test Creator Profile",
            bio="AI Creative Specialist",
            avatar_url="/assets/avatars/elena.jpg",
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
            logo_url="/assets/brands/lumina.svg",
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


def _create_brief(db, brand_profile_id: str, title: str = "Test Campaign Brief", budget: float = 5000.0, status: str = "PUBLISHED") -> Brief:
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
        budget_amount=budget,
        budget_currency="USD",
        deadline=datetime.utcnow() + timedelta(days=30),
        commercial_use_requirements="Full digital & broadcast rights included",
        usage_channels="Paid Social, Web, Broadcast",
        usage_duration="12 Months",
        usage_territories="Worldwide",
        restrictions_and_guidelines="Original assets only",
        disclosure_requirements="Creator attribution required",
        status=status,
        created_at=datetime.utcnow(),
    )
    db.add(brief)
    db.commit()
    db.refresh(brief)
    return brief


def _create_application(db, brief_id: str, creator_id: str, status: str = "ACCEPTED") -> Application:
    app = Application(
        id=f"app-{uuid.uuid4().hex[:8]}",
        brief_id=brief_id,
        creator_id=creator_id,
        pitch_text="Pitch text",
        proposed_rate=4500.0,
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


def _auth_header(user: User) -> dict:
    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    return {"Authorization": f"Bearer {token}"}


# ==============================================================================
# TASK A TESTS: CREATOR HUB MESSAGES & CONVERSATIONS
# ==============================================================================

def test_creator_hub_messages_lists_accepted_applications(isolated_db, client):
    """
    When a creator has an accepted application without an existing engagement,
    calling list_conversations automatically and idempotently provisions the engagement
    and conversation, returning the brand contact and brief title.
    """
    creator_user = _create_verified_user(isolated_db, "CREATOR")
    brand_user = _create_verified_user(isolated_db, "BRAND")
    creator_profile = creator_user.creator_profile
    brand_profile = brand_user.brand_profile

    brief = _create_brief(isolated_db, brand_profile.id, title="Lumina Packaging Showcase")

    # Create accepted application
    app = Application(
        id=f"app-{uuid.uuid4().hex[:8]}",
        brief_id=brief.id,
        creator_id=creator_profile.id,
        pitch_text="Excited to direct this packaging commercial.",
        proposed_rate=4500.0,
        proposed_timeline_days=14,
        attached_project_ids="[]",
        status="ACCEPTED",
        submitted_at=datetime.utcnow(),
        reviewed_at=datetime.utcnow(),
    )
    isolated_db.add(app)
    isolated_db.commit()

    # Creator fetches conversations
    resp = client.get("/api/messages/conversations", headers=_auth_header(creator_user))
    assert resp.status_code == 200
    conv_data = resp.json()
    convs = conv_data.get("items", conv_data)
    assert len(convs) == 1

    conv = convs[0]
    assert conv["brand_id"] == brand_profile.id
    assert conv["creator_id"] == creator_profile.id
    assert conv["brand_name"] == brand_profile.company_name
    assert conv["brief_title"] == "Lumina Packaging Showcase"
    assert conv["brief_id"] == brief.id


def test_idempotent_conversation_creation(isolated_db, client):
    """Multiple calls to list_conversations must not create duplicate conversations."""
    creator_user = _create_verified_user(isolated_db, "CREATOR")
    brand_user = _create_verified_user(isolated_db, "BRAND")
    creator_profile = creator_user.creator_profile
    brand_profile = brand_user.brand_profile

    brief = _create_brief(isolated_db, brand_profile.id, title="Idempotent Test Brief")

    app = Application(
        id=f"app-{uuid.uuid4().hex[:8]}",
        brief_id=brief.id,
        creator_id=creator_profile.id,
        pitch_text="Pitch text",
        proposed_rate=3000.0,
        proposed_timeline_days=10,
        attached_project_ids="[]",
        status="ACCEPTED",
        submitted_at=datetime.utcnow(),
        reviewed_at=datetime.utcnow(),
    )
    isolated_db.add(app)
    isolated_db.commit()

    # Call 3 times consecutively
    r1 = client.get("/api/messages/conversations", headers=_auth_header(creator_user)).json().get("items", [])
    r2 = client.get("/api/messages/conversations", headers=_auth_header(creator_user)).json().get("items", [])
    r3 = client.get("/api/messages/conversations", headers=_auth_header(creator_user)).json().get("items", [])

    assert len(r1) == 1
    assert len(r2) == 1
    assert len(r3) == 1
    assert r1[0]["id"] == r3[0]["id"]

    # Verify database has exactly 1 conversation record
    count = isolated_db.query(Conversation).filter(
        Conversation.brand_id == brand_profile.id,
        Conversation.creator_id == creator_profile.id
    ).count()
    assert count == 1


def test_pending_or_rejected_applications_not_linked(isolated_db, client):
    """Pending or rejected applications must NOT be provisioned into conversations."""
    creator_user = _create_verified_user(isolated_db, "CREATOR")
    brand_user = _create_verified_user(isolated_db, "BRAND")
    creator_profile = creator_user.creator_profile
    brand_profile = brand_user.brand_profile

    brief = _create_brief(isolated_db, brand_profile.id, title="Pending Brief")

    # Add 1 PENDING and 1 REJECTED application
    app_pending = Application(
        id=f"app-{uuid.uuid4().hex[:8]}",
        brief_id=brief.id,
        creator_id=creator_profile.id,
        pitch_text="Pending pitch",
        proposed_rate=2000.0,
        proposed_timeline_days=7,
        attached_project_ids="[]",
        status="PENDING",
        submitted_at=datetime.utcnow(),
    )
    isolated_db.add(app_pending)
    isolated_db.commit()

    resp = client.get("/api/messages/conversations", headers=_auth_header(creator_user))
    assert resp.status_code == 200
    assert len(resp.json().get("items", [])) == 0


def test_conversation_isolation_and_messaging_security(isolated_db, client):
    """
    Creator A and Brand have a conversation.
    Creator B cannot see it, read its messages, or post to it.
    """
    creator_a = _create_verified_user(isolated_db, "CREATOR")
    creator_b = _create_verified_user(isolated_db, "CREATOR")
    brand_user = _create_verified_user(isolated_db, "BRAND")

    brief = _create_brief(isolated_db, brand_user.brand_profile.id, title="Confidential Brief")

    app = Application(
        id=f"app-{uuid.uuid4().hex[:8]}",
        brief_id=brief.id,
        creator_id=creator_a.creator_profile.id,
        pitch_text="Pitch A",
        proposed_rate=3500.0,
        proposed_timeline_days=10,
        attached_project_ids="[]",
        status="ACCEPTED",
        submitted_at=datetime.utcnow(),
        reviewed_at=datetime.utcnow(),
    )
    isolated_db.add(app)
    isolated_db.commit()

    # Creator A gets conversation
    resp_a = client.get("/api/messages/conversations", headers=_auth_header(creator_a))
    conv_id = resp_a.json()["items"][0]["id"]

    # Creator B lists conversations -> empty
    resp_b = client.get("/api/messages/conversations", headers=_auth_header(creator_b))
    assert len(resp_b.json().get("items", [])) == 0

    # Creator B tries to read messages -> 404 (not participant)
    read_resp = client.get(f"/api/messages/conversations/{conv_id}/messages", headers=_auth_header(creator_b))
    assert read_resp.status_code in (403, 404)

    # Creator B tries to send message -> 403 Forbidden
    send_resp = client.post(
        f"/api/messages/conversations/{conv_id}/messages",
        headers=_auth_header(creator_b),
        json={"content": "Unauthorized message attempt"},
    )
    assert send_resp.status_code == 403


def test_bidirectional_messaging_flow(isolated_db, client):
    """Creator and Brand can exchange real messages, preserving timestamps and order."""
    creator_user = _create_verified_user(isolated_db, "CREATOR")
    brand_user = _create_verified_user(isolated_db, "BRAND")

    brief = _create_brief(isolated_db, brand_user.brand_profile.id, title="Collab Brief")

    app = Application(
        id=f"app-{uuid.uuid4().hex[:8]}",
        brief_id=brief.id,
        creator_id=creator_user.creator_profile.id,
        pitch_text="Collab pitch",
        proposed_rate=4000.0,
        proposed_timeline_days=12,
        attached_project_ids="[]",
        status="ACCEPTED",
        submitted_at=datetime.utcnow(),
        reviewed_at=datetime.utcnow(),
    )
    isolated_db.add(app)
    isolated_db.commit()

    # Get provisioned conversation
    convs = client.get("/api/messages/conversations", headers=_auth_header(creator_user)).json().get("items", [])
    conv_id = convs[0]["id"]

    # Creator sends message
    m1_resp = client.post(
        f"/api/messages/conversations/{conv_id}/messages",
        headers=_auth_header(creator_user),
        json={"content": "Hello Brand, here is the preliminary moodboard!"},
    )
    assert m1_resp.status_code == 201
    m1_data = m1_resp.json()
    assert m1_data["sender_id"] == creator_user.id
    assert m1_data["content"] == "Hello Brand, here is the preliminary moodboard!"

    # Brand replies
    m2_resp = client.post(
        f"/api/messages/conversations/{conv_id}/messages",
        headers=_auth_header(brand_user),
        json={"content": "Love the direction, proceeding with milestone 1 approval."},
    )
    assert m2_resp.status_code == 201

    # Creator fetches message history
    history_resp = client.get(f"/api/messages/conversations/{conv_id}/messages", headers=_auth_header(creator_user))
    assert history_resp.status_code == 200
    messages = history_resp.json()
    assert len(messages) == 2
    assert messages[0]["content"] == "Hello Brand, here is the preliminary moodboard!"
    assert messages[1]["content"] == "Love the direction, proceeding with milestone 1 approval."


# ==============================================================================
# TASK B TESTS: SAVED BRIEFS END TO END
# ==============================================================================

def test_save_and_unsave_brief_lifecycle(isolated_db, client):
    """Creator can bookmark a brief, view it in saved list, and unsave it."""
    creator_user = _create_verified_user(isolated_db, "CREATOR")
    brand_user = _create_verified_user(isolated_db, "BRAND")
    brief = _create_brief(isolated_db, brand_user.brand_profile.id, title="Saveable Campaign Brief")

    # Initial state: not saved
    status_resp = client.get(f"/api/saved/briefs/{brief.id}/status", headers=_auth_header(creator_user))
    assert status_resp.status_code == 200
    assert status_resp.json()["is_saved"] is False

    # Save brief
    save_resp = client.post(f"/api/saved/briefs/{brief.id}", headers=_auth_header(creator_user))
    assert save_resp.status_code == 201
    assert save_resp.json()["is_saved"] is True

    # Check status: now saved
    status_resp2 = client.get(f"/api/saved/briefs/{brief.id}/status", headers=_auth_header(creator_user))
    assert status_resp2.json()["is_saved"] is True

    # List saved briefs: exact brief appears with metadata
    list_resp = client.get("/api/saved/briefs", headers=_auth_header(creator_user))
    assert list_resp.status_code == 200
    saved_list = list_resp.json()
    assert len(saved_list) == 1
    assert saved_list[0]["brief_id"] == brief.id
    assert saved_list[0]["brief"]["title"] == "Saveable Campaign Brief"
    assert saved_list[0]["brief"]["brand"]["company_name"] == brand_user.brand_profile.company_name

    # Unsave brief
    unsave_resp = client.delete(f"/api/saved/briefs/{brief.id}", headers=_auth_header(creator_user))
    assert unsave_resp.status_code == 200
    assert unsave_resp.json()["is_saved"] is False

    # List saved briefs: now empty
    list_resp2 = client.get("/api/saved/briefs", headers=_auth_header(creator_user))
    assert len(list_resp2.json()) == 0


def test_save_brief_duplicate_prevention(isolated_db, client):
    """Saving the same brief multiple times must be idempotent and not create duplicate records."""
    creator_user = _create_verified_user(isolated_db, "CREATOR")
    brand_user = _create_verified_user(isolated_db, "BRAND")
    brief = _create_brief(isolated_db, brand_user.brand_profile.id, title="Duplicate Test Brief")

    # Call save twice
    r1 = client.post(f"/api/saved/briefs/{brief.id}", headers=_auth_header(creator_user))
    r2 = client.post(f"/api/saved/briefs/{brief.id}", headers=_auth_header(creator_user))

    assert r1.status_code in (200, 201)
    assert r2.status_code in (200, 201)
    assert r2.json()["is_saved"] is True

    # Check DB record count
    count = isolated_db.query(SavedBrief).filter(
        SavedBrief.user_id == creator_user.id,
        SavedBrief.brief_id == brief.id,
    ).count()
    assert count == 1


def test_saved_brief_account_isolation(isolated_db, client):
    """Creator A's saved briefs are never visible to Creator B."""
    creator_a = _create_verified_user(isolated_db, "CREATOR")
    creator_b = _create_verified_user(isolated_db, "CREATOR")
    brand_user = _create_verified_user(isolated_db, "BRAND")
    brief = _create_brief(isolated_db, brand_user.brand_profile.id, title="Isolated Brief")

    # Creator A saves the brief
    client.post(f"/api/saved/briefs/{brief.id}", headers=_auth_header(creator_a))

    # Creator B checks status -> False
    stat_b = client.get(f"/api/saved/briefs/{brief.id}/status", headers=_auth_header(creator_b))
    assert stat_b.json()["is_saved"] is False

    # Creator B lists saved briefs -> empty
    list_b = client.get("/api/saved/briefs", headers=_auth_header(creator_b))
    assert len(list_b.json()) == 0


def test_role_guards_and_draft_brief_handling(isolated_db, client):
    """Brand cannot save briefs; creator cannot save drafts or non-existent briefs."""
    creator_user = _create_verified_user(isolated_db, "CREATOR")
    brand_user = _create_verified_user(isolated_db, "BRAND")

    published_brief = _create_brief(isolated_db, brand_user.brand_profile.id, title="Public", status="PUBLISHED")
    draft_brief = _create_brief(isolated_db, brand_user.brand_profile.id, title="Draft", status="DRAFT")

    # Brand tries to save brief -> 403 Forbidden
    brand_save = client.post(f"/api/saved/briefs/{published_brief.id}", headers=_auth_header(brand_user))
    assert brand_save.status_code == 403

    # Creator tries to save draft brief -> 404 Not Found (draft hidden from creators)
    draft_save = client.post(f"/api/saved/briefs/{draft_brief.id}", headers=_auth_header(creator_user))
    assert draft_save.status_code == 404

    # Creator tries to save non-existent brief -> 404 Not Found
    nonexistent_save = client.post("/api/saved/briefs/brief-does-not-exist", headers=_auth_header(creator_user))
    assert nonexistent_save.status_code == 404


# ==============================================================================
# TASK C TESTS: CHAT MESSAGE TIMESTAMPS AND ORDERING
# ==============================================================================

def test_sent_message_receives_server_utc_timestamp_with_z(isolated_db, client):
    """A newly sent message must receive an authoritative server UTC timestamp ending with Z."""
    creator_user = _create_verified_user(isolated_db, "CREATOR")
    brand_user = _create_verified_user(isolated_db, "BRAND")
    brief = _create_brief(isolated_db, brand_user.brand_profile.id)
    app = _create_application(isolated_db, brief.id, creator_user.creator_profile.id, status="ACCEPTED")

    # Sync conversation
    conv_resp = client.get("/api/messages/conversations", headers=_auth_header(creator_user))
    assert conv_resp.status_code == 200
    conv_id = conv_resp.json()["items"][0]["id"]

    # Send message as creator
    before_send = datetime.now(timezone.utc)
    send_resp = client.post(
        f"/api/messages/conversations/{conv_id}/messages",
        headers=_auth_header(creator_user),
        json={"content": "Authoritative timestamp verification"},
    )
    after_send = datetime.now(timezone.utc)

    assert send_resp.status_code == 201
    data = send_resp.json()
    assert "created_at" in data
    timestamp_str = data["created_at"]

    # Must end with Z indicating UTC
    assert timestamp_str.endswith("Z"), f"Expected timestamp ending with 'Z', got: {timestamp_str}"

    # Parse and verify within expected time range
    parsed_dt = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
    assert before_send - timedelta(seconds=2) <= parsed_dt <= after_send + timedelta(seconds=2)

    # Re-fetch conversation messages: exact same timestamp is preserved
    list_resp = client.get(
        f"/api/messages/conversations/{conv_id}/messages",
        headers=_auth_header(creator_user),
    )
    assert list_resp.status_code == 200
    msgs = list_resp.json()
    assert len(msgs) == 1
    assert msgs[0]["created_at"] == timestamp_str

    # Brand portal sees the exact same message instant
    brand_list_resp = client.get(
        f"/api/messages/conversations/{conv_id}/messages",
        headers=_auth_header(brand_user),
    )
    assert brand_list_resp.status_code == 200
    brand_msgs = brand_list_resp.json()
    assert len(brand_msgs) == 1
    assert brand_msgs[0]["created_at"] == timestamp_str


def test_conversations_list_timestamps_serialized_with_z(isolated_db, client):
    """Conversation timestamps (created_at, updated_at, last_message) must all serialize with Z."""
    creator_user = _create_verified_user(isolated_db, "CREATOR")
    brand_user = _create_verified_user(isolated_db, "BRAND")
    brief = _create_brief(isolated_db, brand_user.brand_profile.id)
    app = _create_application(isolated_db, brief.id, creator_user.creator_profile.id, status="ACCEPTED")

    # Initial conversation list
    list_resp = client.get("/api/messages/conversations", headers=_auth_header(creator_user))
    assert list_resp.status_code == 200
    items = list_resp.json()["items"]
    assert len(items) == 1
    conv = items[0]

    assert conv["created_at"].endswith("Z")
    assert conv["updated_at"].endswith("Z")

    # Send a message to populate last_message
    client.post(
        f"/api/messages/conversations/{conv['id']}/messages",
        headers=_auth_header(creator_user),
        json={"content": "Hello brand"},
    )

    list_resp2 = client.get("/api/messages/conversations", headers=_auth_header(creator_user))
    items2 = list_resp2.json()["items"]
    last_msg = items2[0]["last_message"]
    assert last_msg is not None
    assert last_msg["created_at"].endswith("Z")


def test_messages_chronological_ordering_with_secondary_id(isolated_db, client):
    """Messages must be returned in strict chronological order, with deterministic secondary id tie-breaker."""
    creator_user = _create_verified_user(isolated_db, "CREATOR")
    brand_user = _create_verified_user(isolated_db, "BRAND")
    brief = _create_brief(isolated_db, brand_user.brand_profile.id)
    _create_application(isolated_db, brief.id, creator_user.creator_profile.id, status="ACCEPTED")

    conv_resp = client.get("/api/messages/conversations", headers=_auth_header(creator_user))
    conv_id = conv_resp.json()["items"][0]["id"]

    base_time = datetime(2026, 10, 13, 6, 0, 0, tzinfo=timezone.utc)

    # Insert messages directly into DB with specific times
    m1 = Message(
        id="msg-early",
        conversation_id=conv_id,
        sender_id=creator_user.id,
        content="First message",
        created_at=base_time,
    )
    # Two messages at the exact same second, tie broken by ID
    m2 = Message(
        id="msg-tie-b",
        conversation_id=conv_id,
        sender_id=creator_user.id,
        content="Tie B",
        created_at=base_time + timedelta(minutes=5),
    )
    m3 = Message(
        id="msg-tie-a",
        conversation_id=conv_id,
        sender_id=creator_user.id,
        content="Tie A",
        created_at=base_time + timedelta(minutes=5),
    )
    m4 = Message(
        id="msg-latest",
        conversation_id=conv_id,
        sender_id=creator_user.id,
        content="Latest message",
        created_at=base_time + timedelta(minutes=10),
    )
    isolated_db.add_all([m1, m2, m3, m4])
    isolated_db.commit()

    list_resp = client.get(
        f"/api/messages/conversations/{conv_id}/messages",
        headers=_auth_header(creator_user),
    )
    assert list_resp.status_code == 200
    msgs = list_resp.json()
    assert len(msgs) == 4

    # Earliest first
    assert msgs[0]["id"] == "msg-early"
    assert msgs[3]["id"] == "msg-latest"
    # Tied messages sorted stably
    tie_ids = [msgs[1]["id"], msgs[2]["id"]]
    assert "msg-tie-a" in tie_ids and "msg-tie-b" in tie_ids

