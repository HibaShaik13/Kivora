"""
Kivora Messaging API
Enforces relationship-scoped communication between verified brand and creator participants.
Prevents arbitrary messaging without a valid collaboration or engagement context.
"""

import uuid
import html
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_, and_

from backend.app.database import get_db
from backend.app.models.models import (
    User,
    Conversation,
    Message,
    Engagement,
    Brief,
    CreatorProfile,
    BrandProfile,
    Application,
)
from backend.app.core.deps import get_current_user

from backend.app.schemas.schemas import (
    MessageCreate,
    MessageRead,
    ConversationRead,
    ConversationListResponse,
    ContextualConversationResponse,
)
from backend.app.services.notification_service import NotificationService

router = APIRouter(prefix="/api/messages", tags=["Messaging"])


def _ensure_utc_datetime(dt: Optional[datetime]) -> Optional[datetime]:
    """Ensures a datetime object is timezone-aware UTC."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _verify_conversation_member(conv: Conversation, user: User) -> tuple[bool, Optional[str], Optional[str]]:
    """
    Validates that the authenticated user is either the creator or brand of this conversation.
    Returns (is_member, user_role_in_conv, other_user_id).
    """
    if user.role == "CREATOR" and user.creator_profile and user.creator_profile.id == conv.creator_id:
        brand_profile = conv.brand
        other_user_id = brand_profile.user_id if brand_profile else None
        return True, "CREATOR", other_user_id
    elif user.role == "BRAND" and user.brand_profile and user.brand_profile.id == conv.brand_id:
        creator_profile = conv.creator
        other_user_id = creator_profile.user_id if creator_profile else None
        return True, "BRAND", other_user_id
    elif user.role == "ADMIN":
        return True, "ADMIN", None
    return False, None, None


def _format_message_read(m: Message, current_user_id: str) -> MessageRead:
    sender = m.sender
    sender_name = "User"
    sender_role = "USER"
    if sender:
        sender_role = sender.role
        if sender.role == "CREATOR" and sender.creator_profile:
            sender_name = sender.creator_profile.display_name or "Creator"
        elif sender.role == "BRAND" and sender.brand_profile:
            sender_name = sender.brand_profile.company_name or "Brand"

    return MessageRead(
        id=m.id,
        conversation_id=m.conversation_id,
        sender_id=m.sender_id,
        sender_name=sender_name,
        sender_role=sender_role,
        content=m.content,
        is_read=m.is_read,
        read_at=_ensure_utc_datetime(m.read_at),
        created_at=_ensure_utc_datetime(m.created_at) or datetime.now(timezone.utc),
    )


def _format_conversation_read(conv: Conversation, current_user: User, db: Session) -> ConversationRead:
    # Get last message
    last_msg = (
        db.query(Message)
        .filter(Message.conversation_id == conv.id)
        .order_by(desc(Message.created_at), desc(Message.id))
        .first()
    )
    last_msg_read = _format_message_read(last_msg, current_user.id) if last_msg else None

    # Calculate unread count for current user
    unread_count = (
        db.query(Message)
        .filter(
            Message.conversation_id == conv.id,
            Message.sender_id != current_user.id,
            Message.is_read.is_(False),
        )
        .count()
    )

    brand_obj = conv.brand or db.query(BrandProfile).filter(BrandProfile.id == conv.brand_id).first()
    creator_obj = conv.creator or db.query(CreatorProfile).filter(CreatorProfile.id == conv.creator_id).first()
    brief_obj = conv.brief or (db.query(Brief).filter(Brief.id == conv.brief_id).first() if conv.brief_id else None)
    if not brief_obj and conv.engagement and conv.engagement.brief:
        brief_obj = conv.engagement.brief

    brief_id = conv.brief_id or (brief_obj.id if brief_obj else None)
    brief_title = brief_obj.title if brief_obj else None
    brand_name = brand_obj.company_name if brand_obj else "Brand"
    brand_logo = brand_obj.logo_url if brand_obj else None
    creator_name = creator_obj.display_name if creator_obj else "Creator"
    creator_avatar = creator_obj.avatar_url if creator_obj else None
    creator_handle = creator_obj.handle if creator_obj else None

    return ConversationRead(
        id=conv.id,
        engagement_id=conv.engagement_id,
        brief_id=brief_id,
        brief_title=brief_title,
        brand_id=conv.brand_id,
        brand_name=brand_name,
        brand_logo=brand_logo,
        creator_id=conv.creator_id,
        creator_name=creator_name,
        creator_avatar=creator_avatar,
        creator_handle=creator_handle,
        last_message=last_msg_read,
        unread_count=unread_count,
        created_at=_ensure_utc_datetime(conv.created_at) or datetime.now(timezone.utc),
        updated_at=_ensure_utc_datetime(conv.updated_at) or datetime.now(timezone.utc),
    )


def _sync_creator_conversations(creator_profile_id: str, db: Session):
    """
    Idempotently auto-links eligible relationships for this creator into conversations.
    Covers:
      1. Accepted applications and accepted invitations.
      2. Active/completed creator engagements.
    Reuses existing conversations, prevents duplicates, and never alters unrelated records.
    """
    # 1. Process all accepted applications/invitations for this creator
    accepted_apps = (
        db.query(Application)
        .filter(
            Application.creator_id == creator_profile_id,
            Application.status == "ACCEPTED"
        )
        .all()
    )
    for app in accepted_apps:
        brief = app.brief or db.query(Brief).filter(Brief.id == app.brief_id).first()
        if not brief or not brief.brand_id:
            continue

        eng = db.query(Engagement).filter(Engagement.application_id == app.id).first()
        if not eng:
            eng_id = f"eng-{uuid.uuid4().hex[:10]}"
            eng = Engagement(
                id=eng_id,
                brief_id=app.brief_id,
                creator_id=creator_profile_id,
                application_id=app.id,
                status="KICKOFF",
                agreed_amount=app.proposed_rate or (brief.budget_amount if brief else 0.0) or 0.0,
                start_date=app.reviewed_at or datetime.utcnow(),
                completion_deadline=(app.reviewed_at or datetime.utcnow()) + timedelta(days=app.proposed_timeline_days or 14),
            )
            db.add(eng)
            db.flush()

        existing_c = db.query(Conversation).filter(Conversation.engagement_id == eng.id).first()
        if not existing_c:
            existing_c = db.query(Conversation).filter(
                Conversation.brand_id == brief.brand_id,
                Conversation.creator_id == creator_profile_id,
                Conversation.brief_id == brief.id
            ).first()
            if existing_c and not existing_c.engagement_id:
                existing_c.engagement_id = eng.id

        if not existing_c:
            new_c = Conversation(
                id=f"conv-{uuid.uuid4().hex[:10]}",
                engagement_id=eng.id,
                brief_id=brief.id,
                brand_id=brief.brand_id,
                creator_id=creator_profile_id,
                created_at=eng.created_at or datetime.utcnow(),
                updated_at=eng.updated_at or datetime.utcnow(),
            )
            db.add(new_c)
            db.flush()

    # 2. Process all engagements for this creator
    creator_engs = db.query(Engagement).filter(Engagement.creator_id == creator_profile_id).all()
    for eng in creator_engs:
        brief = eng.brief or db.query(Brief).filter(Brief.id == eng.brief_id).first()
        if not brief or not brief.brand_id:
            continue

        existing_c = db.query(Conversation).filter(Conversation.engagement_id == eng.id).first()
        if not existing_c:
            existing_c = db.query(Conversation).filter(
                Conversation.brand_id == brief.brand_id,
                Conversation.creator_id == creator_profile_id,
                Conversation.brief_id == brief.id
            ).first()
            if existing_c and not existing_c.engagement_id:
                existing_c.engagement_id = eng.id

        if not existing_c:
            new_c = Conversation(
                id=f"conv-{uuid.uuid4().hex[:10]}",
                engagement_id=eng.id,
                brief_id=brief.id,
                brand_id=brief.brand_id,
                creator_id=creator_profile_id,
                created_at=eng.created_at or datetime.utcnow(),
                updated_at=eng.updated_at or datetime.utcnow(),
            )
            db.add(new_c)
            db.flush()

    db.commit()


def _sync_brand_conversations(brand_profile_id: str, db: Session):
    """
    Idempotently auto-links eligible relationships for this brand into conversations.
    Covers:
      1. Accepted applications and accepted invitations on brand's briefs.
      2. Active/completed brand engagements.
    """
    accepted_apps = (
        db.query(Application)
        .join(Brief, Application.brief_id == Brief.id)
        .filter(
            Brief.brand_id == brand_profile_id,
            Application.status == "ACCEPTED"
        )
        .all()
    )
    for app in accepted_apps:
        brief = app.brief or db.query(Brief).filter(Brief.id == app.brief_id).first()
        if not brief:
            continue

        eng = db.query(Engagement).filter(Engagement.application_id == app.id).first()
        if not eng:
            eng_id = f"eng-{uuid.uuid4().hex[:10]}"
            eng = Engagement(
                id=eng_id,
                brief_id=app.brief_id,
                creator_id=app.creator_id,
                application_id=app.id,
                status="KICKOFF",
                agreed_amount=app.proposed_rate or brief.budget_amount or 0.0,
                start_date=app.reviewed_at or datetime.utcnow(),
                completion_deadline=(app.reviewed_at or datetime.utcnow()) + timedelta(days=app.proposed_timeline_days or 14),
            )
            db.add(eng)
            db.flush()

        existing_c = db.query(Conversation).filter(Conversation.engagement_id == eng.id).first()
        if not existing_c:
            existing_c = db.query(Conversation).filter(
                Conversation.brand_id == brand_profile_id,
                Conversation.creator_id == app.creator_id,
                Conversation.brief_id == brief.id
            ).first()
            if existing_c and not existing_c.engagement_id:
                existing_c.engagement_id = eng.id

        if not existing_c:
            new_c = Conversation(
                id=f"conv-{uuid.uuid4().hex[:10]}",
                engagement_id=eng.id,
                brief_id=brief.id,
                brand_id=brand_profile_id,
                creator_id=app.creator_id,
                created_at=eng.created_at or datetime.utcnow(),
                updated_at=eng.updated_at or datetime.utcnow(),
            )
            db.add(new_c)
            db.flush()

    brand_engs = db.query(Engagement).join(Brief, Engagement.brief_id == Brief.id).filter(Brief.brand_id == brand_profile_id).all()
    for eng in brand_engs:
        brief = eng.brief or db.query(Brief).filter(Brief.id == eng.brief_id).first()
        if not brief:
            continue

        existing_c = db.query(Conversation).filter(Conversation.engagement_id == eng.id).first()
        if not existing_c:
            existing_c = db.query(Conversation).filter(
                Conversation.brand_id == brand_profile_id,
                Conversation.creator_id == eng.creator_id,
                Conversation.brief_id == brief.id
            ).first()
            if existing_c and not existing_c.engagement_id:
                existing_c.engagement_id = eng.id

        if not existing_c:
            new_c = Conversation(
                id=f"conv-{uuid.uuid4().hex[:10]}",
                engagement_id=eng.id,
                brief_id=brief.id,
                brand_id=brand_profile_id,
                creator_id=eng.creator_id,
                created_at=eng.created_at or datetime.utcnow(),
                updated_at=eng.updated_at or datetime.utcnow(),
            )
            db.add(new_c)
            db.flush()

    db.commit()


@router.get("/conversations", response_model=ConversationListResponse)
def list_conversations(
    page: int = Query(1, ge=1),
    page_size: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Lists conversations for the authenticated brand or creator.
    Cross-user isolation: strictly filtered by the user's verified profile ID.
    Auto-links legacy engagements and accepted applications idempotently.
    """
    if current_user.role == "CREATOR":
        if not current_user.creator_profile:
            return ConversationListResponse(items=[], total=0)

        _sync_creator_conversations(current_user.creator_profile.id, db)
        query = db.query(Conversation).filter(Conversation.creator_id == current_user.creator_profile.id)

    elif current_user.role == "BRAND":
        if not current_user.brand_profile:
            return ConversationListResponse(items=[], total=0)

        _sync_brand_conversations(current_user.brand_profile.id, db)
        query = db.query(Conversation).filter(Conversation.brand_id == current_user.brand_profile.id)

    elif current_user.role == "ADMIN":
        query = db.query(Conversation)
    else:
        return ConversationListResponse(items=[], total=0)

    total = query.count()
    convs = (
        query.order_by(desc(Conversation.updated_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = [_format_conversation_read(c, current_user, db) for c in convs]
    return ConversationListResponse(items=items, total=total)


@router.get("/contextual-conversation", response_model=ContextualConversationResponse)
def get_contextual_conversation(
    creator_id: Optional[str] = Query(None, description="Creator profile ID for brand looking to chat with creator"),
    brief_id: Optional[str] = Query(None, description="Brief ID for creator looking to chat with brand, or brand scoping to a brief"),
    brand_id: Optional[str] = Query(None, description="Brand profile ID for creator looking to chat with brand"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Finds or resolves the eligible contextual conversation between brand and creator.
    - When called by BRAND: resolves conversation with specified creator_id (optionally scoped to brief_id).
      If no conversation exists and no eligible relationship exists, explains that an invitation/collaboration is required.
    - When called by CREATOR: resolves conversation with the brand of specified brief_id.
      Ensures the conversation is strictly associated with that brief; does not silently open an unrelated campaign.
      If not yet accepted, explains the status and relationship requirement.
    """
    if current_user.role == "BRAND":
        if not current_user.brand_profile:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Brand profile required.",
            )
        brand_prof_id = current_user.brand_profile.id
        if not creator_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="creator_id parameter is required for brand users.",
            )

        creator_obj = db.query(CreatorProfile).filter(
            or_(
                CreatorProfile.id == creator_id,
                CreatorProfile.user_id == creator_id,
                CreatorProfile.handle == creator_id,
            )
        ).first()
        if not creator_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Creator not found.",
            )

        # Idempotently sync conversations
        _sync_brand_conversations(brand_prof_id, db)

        q = db.query(Conversation).filter(
            Conversation.brand_id == brand_prof_id,
            or_(
                Conversation.creator_id == creator_obj.id,
                Conversation.creator_id == creator_obj.user_id,
            ),
        )
        if brief_id:
            conv = q.filter(Conversation.brief_id == brief_id).first()
            if not conv:
                eng = db.query(Engagement).filter(
                    or_(
                        Engagement.creator_id == creator_obj.id,
                        Engagement.creator_id == creator_obj.user_id,
                    ),
                    Engagement.brief_id == brief_id,
                ).first()
                if eng:
                    conv = db.query(Conversation).filter(Conversation.engagement_id == eng.id).first()
                    if conv and not conv.brief_id:
                        conv.brief_id = brief_id
                        db.commit()
        else:
            conv = q.order_by(desc(Conversation.updated_at)).first()

        if conv:
            return ContextualConversationResponse(
                status="found",
                conversation=_format_conversation_read(conv, current_user, db),
                creator_name=creator_obj.display_name,
            )

        # Ineligible: explain why and offer invite action
        brief_title = None
        if brief_id:
            b_obj = db.query(Brief).filter(Brief.id == brief_id).first()
            if b_obj:
                brief_title = b_obj.title

        reason = (
            f"Direct messaging with {creator_obj.display_name} for '{brief_title}' unlocks once an application pitch or brief invitation is accepted. Invite them to this brief to start collaborating."
            if brief_title
            else f"Direct messaging unlocks once you have an accepted collaboration or brief invitation with {creator_obj.display_name}. Invite them to an active campaign brief to start collaborating."
        )
        return ContextualConversationResponse(
            status="ineligible",
            conversation=None,
            reason=reason,
            required_action="INVITE",
            creator_name=creator_obj.display_name,
            brief_title=brief_title,
        )

    elif current_user.role == "CREATOR":
        if not current_user.creator_profile:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Creator profile required.",
            )
        creator_prof_id = current_user.creator_profile.id
        if not brief_id and not brand_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either brief_id or brand_id parameter is required for creator users.",
            )

        # Idempotently sync conversations
        _sync_creator_conversations(creator_prof_id, db)

        if brief_id:
            brief_obj = db.query(Brief).filter(Brief.id == brief_id).first()
            if not brief_obj or brief_obj.status == "DRAFT":
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Brief not found.",
                )

            brand_obj = brief_obj.brand
            brand_name = brand_obj.company_name if brand_obj else "Brand"

            # Strictly look for conversation associated with THIS brief
            conv = db.query(Conversation).filter(
                or_(
                    Conversation.creator_id == creator_prof_id,
                    Conversation.creator_id == current_user.id,
                ),
                Conversation.brief_id == brief_obj.id,
            ).first()

            if not conv:
                eng = db.query(Engagement).filter(
                    or_(
                        Engagement.creator_id == creator_prof_id,
                        Engagement.creator_id == current_user.id,
                    ),
                    Engagement.brief_id == brief_obj.id,
                ).first()
                if eng:
                    conv = db.query(Conversation).filter(Conversation.engagement_id == eng.id).first()
                    if conv and not conv.brief_id:
                        conv.brief_id = brief_obj.id
                        db.commit()

            if conv:
                return ContextualConversationResponse(
                    status="found",
                    conversation=_format_conversation_read(conv, current_user, db),
                    brand_name=brand_name,
                    brief_title=brief_obj.title,
                )

            # Check application status for this brief
            app = db.query(Application).filter(
                or_(
                    Application.creator_id == creator_prof_id,
                    Application.creator_id == current_user.id,
                ),
                Application.brief_id == brief_obj.id,
            ).first()

            invitation_id = None
            if app and app.status == "PENDING":
                reason = f"Your application pitch for '{brief_obj.title}' is currently under review by {brand_name}. Direct messaging unlocks as soon as the brand accepts your pitch."
                required_action = "APPLY"
            elif app and app.status == "INVITED":
                reason = f"You have been directly invited by {brand_name} to collaborate on '{brief_obj.title}'. Accept the invitation to unlock direct messaging and your collaboration workspace."
                required_action = "ACCEPT_INVITATION"
                invitation_id = app.id
            elif app and app.status == "REJECTED":
                reason = f"Your application for '{brief_obj.title}' was not selected for this campaign."
                required_action = "REJECTED"
            else:
                reason = f"Direct messaging with {brand_name} for '{brief_obj.title}' unlocks once your application pitch or invitation is accepted. Submit your pitch to start collaborating."
                required_action = "APPLY"

            return ContextualConversationResponse(
                status="ineligible",
                conversation=None,
                reason=reason,
                required_action=required_action,
                brand_name=brand_name,
                brief_title=brief_obj.title,
                invitation_id=invitation_id,
                application_id=app.id if app else None,
                application_status=app.status if app else None,
            )

        else:
            # Resolved via brand_id without specific brief
            brand_obj = db.query(BrandProfile).filter(
                or_(
                    BrandProfile.id == brand_id,
                    BrandProfile.user_id == brand_id,
                )
            ).first()
            if not brand_obj:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Brand not found.",
                )

            conv = db.query(Conversation).filter(
                or_(
                    Conversation.creator_id == creator_prof_id,
                    Conversation.creator_id == current_user.id,
                ),
                Conversation.brand_id == brand_obj.id,
            ).order_by(desc(Conversation.updated_at)).first()

            if conv:
                return ContextualConversationResponse(
                    status="found",
                    conversation=_format_conversation_read(conv, current_user, db),
                    brand_name=brand_obj.company_name,
                    brief_title=conv.brief.title if conv.brief else None,
                )

            return ContextualConversationResponse(
                status="ineligible",
                conversation=None,
                reason=f"Direct messaging with {brand_obj.company_name} unlocks once an application pitch or brief invitation is accepted.",
                required_action="APPLY",
                brand_name=brand_obj.company_name,
            )

    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Role not authorized for contextual conversations.",
        )


@router.get("/conversations/{conversation_id}", response_model=ConversationRead)
def get_conversation(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieves details for a specific conversation.
    Enforces participant authorization. Returns 404 for unauthorized users.
    """
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found.",
        )

    is_member, _, _ = _verify_conversation_member(conv, current_user)
    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found.",
        )

    return _format_conversation_read(conv, current_user, db)


@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageRead])
def get_conversation_messages(
    conversation_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieves chronological messages for an authorized conversation.
    Returns 404 for nonexistent or unauthorized conversations to prevent enumeration.
    """
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found.",
        )

    is_member, _, _ = _verify_conversation_member(conv, current_user)
    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found.",
        )

    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conv.id)
        .order_by(desc(Message.created_at), desc(Message.id))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    # Return chronological order (oldest first)
    messages.reverse()
    return [_format_message_read(m, current_user.id) for m in messages]


@router.post("/conversations/{conversation_id}/messages", response_model=MessageRead, status_code=status.HTTP_201_CREATED)
def send_message(
    conversation_id: str,
    payload: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Sends a message within a validated conversation.
    Sanitizes HTML to prevent stored XSS, validates non-empty content,
    updates conversation activity timestamp, and notifies recipient.
    """
    content = payload.content.strip()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message content cannot be blank.",
        )

    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found.",
        )

    is_member, role_in_conv, other_user_id = _verify_conversation_member(conv, current_user)
    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You are not an authorized participant in this conversation.",
        )

    # Sanitize content against stored XSS
    clean_content = html.escape(content)

    msg_id = f"msg-{uuid.uuid4().hex[:10]}"
    now = datetime.now(timezone.utc)
    message = Message(
        id=msg_id,
        conversation_id=conv.id,
        sender_id=current_user.id,
        content=clean_content,
        is_read=False,
        created_at=now,
    )
    db.add(message)

    conv.updated_at = now
    db.commit()
    db.refresh(message)

    # Notify recipient
    if other_user_id and other_user_id != current_user.id:
        try:
            sender_name = "Collaborator"
            if current_user.role == "CREATOR" and current_user.creator_profile:
                sender_name = current_user.creator_profile.display_name or "Creator"
            elif current_user.role == "BRAND" and current_user.brand_profile:
                sender_name = current_user.brand_profile.company_name or "Brand"

            NotificationService.notify_new_message(
                db=db,
                recipient_user_id=other_user_id,
                sender_name=sender_name,
                conversation_id=conv.id,
                preview=clean_content,
            )
        except Exception as notify_err:
            print(f"[MessagingAPI] Non-fatal notification error: {notify_err}")

    return _format_message_read(message, current_user.id)


@router.patch("/conversations/{conversation_id}/read")
def mark_conversation_as_read(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Marks all unread messages received by the current user in this conversation as read.
    """
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found.",
        )

    is_member, _, _ = _verify_conversation_member(conv, current_user)
    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found.",
        )

    now = datetime.now(timezone.utc)
    db.query(Message).filter(
        Message.conversation_id == conv.id,
        Message.sender_id != current_user.id,
        Message.is_read.is_(False),
    ).update({"is_read": True, "read_at": now}, synchronize_session=False)
    db.commit()

    return {"status": "ok", "conversation_id": conversation_id}


@router.get("/unread-count")
def get_unread_messages_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns total unread message count across all conversations the user participates in.
    """
    if current_user.role == "CREATOR":
        if not current_user.creator_profile:
            return {"unread_count": 0}
        conv_ids = [
            c[0] for c in db.query(Conversation.id).filter(
                Conversation.creator_id == current_user.creator_profile.id
            ).all()
        ]
    elif current_user.role == "BRAND":
        if not current_user.brand_profile:
            return {"unread_count": 0}
        conv_ids = [
            c[0] for c in db.query(Conversation.id).filter(
                Conversation.brand_id == current_user.brand_profile.id
            ).all()
        ]
    else:
        return {"unread_count": 0}

    if not conv_ids:
        return {"unread_count": 0}

    count = (
        db.query(Message)
        .filter(
            Message.conversation_id.in_(conv_ids),
            Message.sender_id != current_user.id,
            Message.is_read.is_(False),
        )
        .count()
    )
    return {"unread_count": count}


@router.post("/start-engagement-conversation/{engagement_id}", response_model=ConversationRead)
def get_or_create_engagement_conversation(
    engagement_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Finds or provisions a conversation for an active engagement.
    Verifies caller is an authorized participant (creator or brand).
    """
    eng = db.query(Engagement).filter(Engagement.id == engagement_id).first()
    if not eng:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Engagement not found.",
        )

    # Verify authorization
    is_authorized = False
    if current_user.role == "CREATOR" and current_user.creator_profile and current_user.creator_profile.id == eng.creator_id:
        is_authorized = True
    elif current_user.role == "BRAND" and current_user.brand_profile and eng.brief and eng.brief.brand_id == current_user.brand_profile.id:
        is_authorized = True
    elif current_user.role == "ADMIN":
        is_authorized = True

    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You are not a participant in this engagement.",
        )

    conv = db.query(Conversation).filter(Conversation.engagement_id == eng.id).first()
    if not conv:
        brand_id = eng.brief.brand_id if eng.brief else None
        if not brand_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot create conversation: Engagement has no associated brand.",
            )
        conv = Conversation(
            id=f"conv-{uuid.uuid4().hex[:10]}",
            engagement_id=eng.id,
            brief_id=eng.brief_id,
            brand_id=brand_id,
            creator_id=eng.creator_id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)

    return _format_conversation_read(conv, current_user, db)
