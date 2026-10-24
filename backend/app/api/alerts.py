"""
Kivora Opportunity Discovery & Alert Router
Manages creator smart alert preferences and returns personalized matched opportunities.
"""

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database import get_db
from backend.app.models.models import (
    User,
    AlertPreference,
    OpportunityAlertRecord,
    Brief,
)
from backend.app.core.deps import get_current_user, require_role, require_approved_creator_user

from backend.app.schemas.schemas import (
    AlertPreferenceRead,
    AlertPreferenceUpdate,
    OpportunityAlertRead,
    BriefRead,
)
from backend.app.services.opportunity_service import OpportunityService
from backend.app.api.briefs import format_brief_read

router = APIRouter(prefix="/api/alerts", tags=["Smart Opportunity Alerts"])


@router.get("/preferences", response_model=AlertPreferenceRead)
def get_alert_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieves the current user's opportunity alert preferences.
    """
    prefs = OpportunityService.get_or_create_preferences(db, current_user.id)
    return AlertPreferenceRead.model_validate(prefs)


@router.put("/preferences", response_model=AlertPreferenceRead)
def update_alert_preferences(
    payload: AlertPreferenceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Updates the current user's opportunity alert preferences.
    """
    prefs = OpportunityService.get_or_create_preferences(db, current_user.id)

    if payload.is_enabled is not None:
        prefs.is_enabled = payload.is_enabled
    if payload.min_budget is not None:
        prefs.min_budget = payload.min_budget
    if payload.preferred_categories is not None:
        prefs.preferred_categories = payload.preferred_categories
    if payload.preferred_content_types is not None:
        prefs.preferred_content_types = payload.preferred_content_types
    if payload.email_alerts_enabled is not None:
        prefs.email_alerts_enabled = payload.email_alerts_enabled
    if payload.in_app_alerts_enabled is not None:
        prefs.in_app_alerts_enabled = payload.in_app_alerts_enabled

    prefs.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(prefs)

    return AlertPreferenceRead.model_validate(prefs)


@router.get("/opportunities", response_model=List[OpportunityAlertRead])
def list_opportunity_alerts(
    page: int = Query(1, ge=1),
    page_size: int = Query(30, ge=1, le=100),
    unviewed_only: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_approved_creator_user),
):
    """
    Returns stored opportunity alerts for the authenticated creator, newest first.
    Includes complete campaign brief details and match explanation reasons.
    """
    query = db.query(OpportunityAlertRecord).filter(
        OpportunityAlertRecord.user_id == current_user.id
    )
    if unviewed_only:
        query = query.filter(OpportunityAlertRecord.is_viewed.is_(False))

    records = (
        query.order_by(desc(OpportunityAlertRecord.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    results = []
    for r in records:
        brief_read = format_brief_read(r.brief) if r.brief else None
        results.append(
            OpportunityAlertRead(
                id=r.id,
                user_id=r.user_id,
                brief_id=r.brief_id,
                match_score=r.match_score,
                match_reasons=r.match_reasons or [],
                is_viewed=r.is_viewed,
                created_at=r.created_at,
                brief=brief_read,
            )
        )
    return results


@router.post("/refresh", response_model=List[OpportunityAlertRead])
def refresh_opportunity_alerts(
    threshold_score: float = Query(60.0, ge=0.0, le=100.0),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["CREATOR"])),
):
    """
    Explicitly triggers opportunity matching and returns all current opportunity alerts.
    """
    OpportunityService.generate_alerts_for_creator(
        db=db,
        creator_user_id=current_user.id,
        threshold_score=threshold_score,
    )

    records = (
        db.query(OpportunityAlertRecord)
        .filter(OpportunityAlertRecord.user_id == current_user.id)
        .order_by(desc(OpportunityAlertRecord.created_at))
        .limit(30)
        .all()
    )

    results = []
    for r in records:
        brief_read = format_brief_read(r.brief) if r.brief else None
        results.append(
            OpportunityAlertRead(
                id=r.id,
                user_id=r.user_id,
                brief_id=r.brief_id,
                match_score=r.match_score,
                match_reasons=r.match_reasons or [],
                is_viewed=r.is_viewed,
                created_at=r.created_at,
                brief=brief_read,
            )
        )
    return results


@router.patch("/opportunities/{alert_id}/view")
def mark_opportunity_viewed(
    alert_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["CREATOR"])),
):
    """
    Marks an opportunity alert as viewed by the creator.
    """
    alert = (
        db.query(OpportunityAlertRecord)
        .filter(
            OpportunityAlertRecord.id == alert_id,
            OpportunityAlertRecord.user_id == current_user.id,
        )
        .first()
    )
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Opportunity alert not found.",
        )

    alert.is_viewed = True
    db.commit()
    return {"status": "ok", "alert_id": alert_id}
