"""
Kivora Notification Service
Handles durable in-app notifications and email dispatch triggers for marketplace events.
"""

import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import and_

from backend.app.models.models import Notification, User, AlertPreference
from backend.app.services.email_service import EmailService


class NotificationService:
    @staticmethod
    def create_notification(
        db: Session,
        user_id: str,
        notification_type: str,
        title: str,
        message: str,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        link_url: Optional[str] = None,
        dispatch_email: bool = False,
        email_data: Optional[Dict[str, Any]] = None,
    ) -> Notification:
        """
        Creates a durable in-app notification for the specified user and optionally dispatches email.
        """
        # Idempotency / Deduplication check for duplicate recent notifications (within last 1 minute)
        recent = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.type == notification_type,
            Notification.resource_id == resource_id,
        ).order_by(Notification.created_at.desc()).first()

        if recent and (datetime.utcnow() - recent.created_at).total_seconds() < 5:
            # Duplicate call within 5s, return existing notification
            return recent

        notification_id = str(uuid.uuid4())
        notification = Notification(
            id=notification_id,
            user_id=user_id,
            type=notification_type,
            title=title,
            message=message,
            resource_type=resource_type,
            resource_id=resource_id,
            link_url=link_url,
            is_read=False,
            created_at=datetime.utcnow(),
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)

        # Trigger email if enabled
        if dispatch_email:
            try:
                user = db.query(User).filter(User.id == user_id).first()
                if user and user.email:
                    # Check preferences if exists
                    prefs = db.query(AlertPreference).filter(AlertPreference.user_id == user_id).first()
                    if prefs is None or prefs.email_alerts_enabled:
                        EmailService.send_marketplace_notification(
                            to_email=user.email,
                            subject=f"[Kivora] {title}",
                            title=title,
                            message=message,
                            action_url=link_url,
                            template_data=email_data or {},
                        )
            except Exception as e:
                # Never fail the underlying transaction due to email failure
                print(f"[NotificationService] Non-fatal email dispatch error: {e}")

        return notification

    # =========================================================================
    # Event-specific convenience helpers
    # =========================================================================

    @classmethod
    def notify_application_received(cls, db: Session, brand_user_id: str, creator_name: str, brief_title: str, application_id: str):
        return cls.create_notification(
            db=db,
            user_id=brand_user_id,
            notification_type="APPLICATION_RECEIVED",
            title="New Application Received",
            message=f"{creator_name} submitted a proposal for '{brief_title}'.",
            resource_type="APPLICATION",
            resource_id=application_id,
            link_url=f"/dashboard/brand?tab=applications",
            dispatch_email=True,
        )

    @classmethod
    def notify_application_status(cls, db: Session, creator_user_id: str, brand_name: str, brief_title: str, status: str, application_id: str):
        status_text = "accepted" if status.upper() == "ACCEPTED" else "declined"
        return cls.create_notification(
            db=db,
            user_id=creator_user_id,
            notification_type=f"APPLICATION_{status.upper()}",
            title=f"Application {status_text.capitalize()}",
            message=f"{brand_name} {status_text} your proposal for '{brief_title}'.",
            resource_type="APPLICATION",
            resource_id=application_id,
            link_url=f"/dashboard/creator?tab=projects",
            dispatch_email=True,
        )

    @classmethod
    def notify_creator_invited(cls, db: Session, creator_user_id: str, brand_name: str, brief_title: str, invitation_id: str):
        return cls.create_notification(
            db=db,
            user_id=creator_user_id,
            notification_type="CREATOR_INVITED",
            title="New Brief Invitation",
            message=f"{brand_name} invited you to collaborate on '{brief_title}'.",
            resource_type="INVITATION",
            resource_id=invitation_id,
            link_url=f"/dashboard/creator?tab=invitations",
            dispatch_email=True,
        )

    @classmethod
    def notify_invitation_response(cls, db: Session, brand_user_id: str, creator_name: str, brief_title: str, accepted: bool, invitation_id: str):
        action = "accepted" if accepted else "declined"
        return cls.create_notification(
            db=db,
            user_id=brand_user_id,
            notification_type=f"INVITATION_{action.upper()}",
            title=f"Invitation {action.capitalize()}",
            message=f"{creator_name} {action} your invitation to '{brief_title}'.",
            resource_type="INVITATION",
            resource_id=invitation_id,
            link_url=f"/dashboard/brand?tab=projects" if accepted else f"/dashboard/brand?tab=briefs",
            dispatch_email=True,
        )

    @classmethod
    def notify_deliverable_submitted(cls, db: Session, brand_user_id: str, creator_name: str, milestone_title: str, engagement_id: str):
        return cls.create_notification(
            db=db,
            user_id=brand_user_id,
            notification_type="DELIVERABLE_SUBMITTED",
            title="New Deliverable Submitted",
            message=f"{creator_name} submitted work for '{milestone_title}'. Review and approve.",
            resource_type="ENGAGEMENT",
            resource_id=engagement_id,
            link_url=f"/dashboard/brand?tab=projects&engagementId={engagement_id}",
            dispatch_email=True,
        )

    @classmethod
    def notify_deliverable_reviewed(cls, db: Session, creator_user_id: str, brand_name: str, milestone_title: str, status: str, engagement_id: str):
        approved = status.upper() in ("APPROVED", "FINAL_APPROVED")
        verdict = "approved" if approved else "requested revisions on"
        return cls.create_notification(
            db=db,
            user_id=creator_user_id,
            notification_type=f"DELIVERABLE_{status.upper()}",
            title="Deliverable Review Update",
            message=f"{brand_name} {verdict} '{milestone_title}'.",
            resource_type="ENGAGEMENT",
            resource_id=engagement_id,
            link_url=f"/dashboard/creator?tab=projects&engagementId={engagement_id}",
            dispatch_email=True,
        )

    @classmethod
    def notify_new_message(cls, db: Session, recipient_user_id: str, sender_name: str, conversation_id: str, preview: str):
        return cls.create_notification(
            db=db,
            user_id=recipient_user_id,
            notification_type="NEW_MESSAGE",
            title=f"New message from {sender_name}",
            message=preview[:120] + ("..." if len(preview) > 120 else ""),
            resource_type="CONVERSATION",
            resource_id=conversation_id,
            link_url=f"/inbox?conversationId={conversation_id}",
            dispatch_email=False,  # Don't flood email for every chat message
        )
