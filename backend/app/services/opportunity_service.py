"""
Kivora Opportunity Discovery & Alert Service
Connects creators with high-affinity campaign briefs using explainable deterministic matching.
Deduplicates alerts, respects user preferences, and persists alert history.
"""

import uuid
from datetime import datetime
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.models.models import (
    User,
    CreatorProfile,
    Brief,
    Application,
    AlertPreference,
    OpportunityAlertRecord,
)
from backend.app.services.matching import evaluate_creator_for_brief
from backend.app.services.notification_service import NotificationService


class OpportunityService:
    @staticmethod
    def get_or_create_preferences(db: Session, user_id: str) -> AlertPreference:
        prefs = db.query(AlertPreference).filter(AlertPreference.user_id == user_id).first()
        if not prefs:
            prefs = AlertPreference(
                id=f"ap-{uuid.uuid4().hex[:10]}",
                user_id=user_id,
                is_enabled=True,
                min_budget=None,
                preferred_categories=None,
                preferred_content_types=None,
                email_alerts_enabled=True,
                in_app_alerts_enabled=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(prefs)
            db.commit()
            db.refresh(prefs)
        return prefs

    @staticmethod
    def generate_alerts_for_creator(
        db: Session,
        creator_user_id: str,
        threshold_score: float = 60.0,
    ) -> List[OpportunityAlertRecord]:
        """
        Evaluates eligible briefs for a creator user against preferences and creates new alert records.
        Idempotent: Never generates duplicate alert records for the same (user_id, brief_id).
        """
        user = db.query(User).filter(User.id == creator_user_id).first()
        if not user or user.role != "CREATOR" or not user.creator_profile:
            return []

        creator = user.creator_profile
        prefs = OpportunityService.get_or_create_preferences(db, creator_user_id)
        if not prefs.is_enabled:
            return []

        # Find existing alert brief IDs to avoid reprocessing
        existing_alert_brief_ids = set(
            r[0] for r in db.query(OpportunityAlertRecord.brief_id).filter(
                OpportunityAlertRecord.user_id == user.id
            ).all()
        )

        # Find brief IDs creator already applied to or was invited to
        applied_brief_ids = set(
            r[0] for r in db.query(Application.brief_id).filter(
                Application.creator_id == creator.id
            ).all()
        )

        # Query eligible briefs (ACTIVE, PUBLISHED, OPEN)
        query = db.query(Brief).filter(
            Brief.status.in_(["ACTIVE", "PUBLISHED", "OPEN"])
        )

        # Preference filter: minimum budget
        if prefs.min_budget is not None and prefs.min_budget > 0:
            query = query.filter(Brief.budget_amount >= prefs.min_budget)

        # Preference filter: content types
        if prefs.preferred_content_types:
            query = query.filter(Brief.content_type.in_(prefs.preferred_content_types))

        briefs = query.order_by(desc(Brief.created_at)).limit(100).all()

        new_alerts = []
        for brief in briefs:
            if brief.id in existing_alert_brief_ids or brief.id in applied_brief_ids:
                continue

            # Check preferred categories filter if set
            if prefs.preferred_categories:
                brief_cat_slugs = [bc.category.slug for bc in (brief.categories or []) if bc.category]
                if not any(cat in prefs.preferred_categories for cat in brief_cat_slugs):
                    continue

            # Score creator against brief deterministically
            try:
                match_result = evaluate_creator_for_brief(creator, brief)
            except Exception as e:
                print(f"[OpportunityService] Match eval error for brief {brief.id}: {e}")
                continue

            if match_result.score >= threshold_score:
                alert_record = OpportunityAlertRecord(
                    id=f"alt-{uuid.uuid4().hex[:10]}",
                    user_id=user.id,
                    brief_id=brief.id,
                    match_score=float(match_result.score),
                    match_reasons=match_result.reasons[:4],
                    is_viewed=False,
                    created_at=datetime.utcnow(),
                )
                db.add(alert_record)
                new_alerts.append(alert_record)

                # Send in-app notification if preferred
                if prefs.in_app_alerts_enabled:
                    try:
                        top_reason = match_result.reasons[0] if match_result.reasons else "Strong match with campaign criteria."
                        NotificationService.create_notification(
                            db=db,
                            user_id=user.id,
                            notification_type="OPPORTUNITY_ALERT",
                            title=f"New Opportunity: {brief.title}",
                            message=f"Fit score {int(match_result.score)}%. {top_reason}",
                            resource_type="BRIEF",
                            resource_id=brief.id,
                            link_url=f"/briefs/{brief.slug or brief.id}",
                            dispatch_email=prefs.email_alerts_enabled,
                        )
                    except Exception as notify_err:
                        print(f"[OpportunityService] Notification error: {notify_err}")

        if new_alerts:
            db.commit()
            for a in new_alerts:
                db.refresh(a)

        return new_alerts
