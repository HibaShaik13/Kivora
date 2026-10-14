"""
Kivora Saved Items API
Allows creators to save campaign briefs and brands to save creators.
Ensures persistent bookmarking, prevents duplicates, and enforces role boundaries.
"""

import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database import get_db
from backend.app.models.models import (
    User,
    SavedCreator,
    SavedBrief,
    CreatorProfile,
    Brief,
)
from backend.app.core.deps import get_current_user, require_role

from backend.app.schemas.schemas import (
    SavedStatusResponse,
    SavedCreatorRead,
    SavedBriefRead,
    CreatorProfileListRead,
    BriefRead,
)
from backend.app.api.creators import format_creator_list_item
from backend.app.api.briefs import format_brief_read

router = APIRouter(prefix="/api/saved", tags=["Saved Items"])


# ==========================================
# 1. SAVED BRIEFS (FOR CREATORS)
# ==========================================

@router.post("/briefs/{brief_id}", response_model=SavedStatusResponse, status_code=status.HTTP_201_CREATED)
def save_brief(
    brief_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["CREATOR"])),
):
    """
    Saves a brief to the creator's bookmarks.
    Idempotent: if already saved, returns is_saved=True without error.
    Enforces privacy: cannot save unpublished/draft briefs unless authorized.
    """
    brief = db.query(Brief).filter(Brief.id == brief_id).first()
    if not brief:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brief not found.",
        )

    # Privacy check: Creators cannot save drafts
    if brief.status in ["DRAFT", "ARCHIVED"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brief not found or unavailable.",
        )

    existing = (
        db.query(SavedBrief)
        .filter(SavedBrief.user_id == current_user.id, SavedBrief.brief_id == brief.id)
        .first()
    )
    if existing:
        return SavedStatusResponse(is_saved=True, saved_id=existing.id)

    saved_record = SavedBrief(
        id=f"sb-{uuid.uuid4().hex[:10]}",
        user_id=current_user.id,
        brief_id=brief.id,
        created_at=datetime.utcnow(),
    )
    db.add(saved_record)
    db.commit()
    db.refresh(saved_record)

    return SavedStatusResponse(is_saved=True, saved_id=saved_record.id)


@router.delete("/briefs/{brief_id}", response_model=SavedStatusResponse)
def unsave_brief(
    brief_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["CREATOR"])),
):
    """
    Removes a brief from the creator's bookmarks.
    Idempotent: returns is_saved=False even if not previously saved.
    """
    saved_record = (
        db.query(SavedBrief)
        .filter(SavedBrief.user_id == current_user.id, SavedBrief.brief_id == brief_id)
        .first()
    )
    if saved_record:
        db.delete(saved_record)
        db.commit()

    return SavedStatusResponse(is_saved=False, saved_id=None)


@router.get("/briefs/{brief_id}/status", response_model=SavedStatusResponse)
def get_brief_saved_status(
    brief_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Checks if the specified brief is saved by the current user.
    """
    saved_record = (
        db.query(SavedBrief)
        .filter(SavedBrief.user_id == current_user.id, SavedBrief.brief_id == brief_id)
        .first()
    )
    return SavedStatusResponse(
        is_saved=bool(saved_record),
        saved_id=saved_record.id if saved_record else None,
    )


@router.get("/briefs", response_model=List[SavedBriefRead])
def list_saved_briefs(
    page: int = Query(1, ge=1),
    page_size: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["CREATOR"])),
):
    """
    Returns the creator's saved briefs with complete brief card metadata.
    Excludes drafts or deleted briefs gracefully without breaking.
    """
    saved_records = (
        db.query(SavedBrief)
        .filter(SavedBrief.user_id == current_user.id)
        .order_by(desc(SavedBrief.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    results = []
    for sb in saved_records:
        if sb.brief and sb.brief.status not in ["DRAFT", "ARCHIVED"]:
            results.append(
                SavedBriefRead(
                    id=sb.id,
                    brief_id=sb.brief_id,
                    user_id=sb.user_id,
                    created_at=sb.created_at,
                    brief=format_brief_read(sb.brief),
                )
            )
    return results


# ==========================================
# 2. SAVED CREATORS (FOR BRANDS)
# ==========================================

@router.post("/creators/{creator_id}", response_model=SavedStatusResponse, status_code=status.HTTP_201_CREATED)
def save_creator(
    creator_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["BRAND"])),
):
    """
    Saves a creator to the brand's talent roster.
    Idempotent: if already saved, returns is_saved=True without error.
    """
    creator = db.query(CreatorProfile).filter(CreatorProfile.id == creator_id).first()
    if not creator:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Creator profile not found.",
        )

    existing = (
        db.query(SavedCreator)
        .filter(SavedCreator.user_id == current_user.id, SavedCreator.creator_id == creator.id)
        .first()
    )
    if existing:
        return SavedStatusResponse(is_saved=True, saved_id=existing.id)

    saved_record = SavedCreator(
        id=f"sc-{uuid.uuid4().hex[:10]}",
        user_id=current_user.id,
        creator_id=creator.id,
        created_at=datetime.utcnow(),
    )
    db.add(saved_record)
    db.commit()
    db.refresh(saved_record)

    return SavedStatusResponse(is_saved=True, saved_id=saved_record.id)


@router.delete("/creators/{creator_id}", response_model=SavedStatusResponse)
def unsave_creator(
    creator_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["BRAND"])),
):
    """
    Removes a creator from the brand's talent roster.
    Idempotent: returns is_saved=False even if not previously saved.
    """
    saved_record = (
        db.query(SavedCreator)
        .filter(SavedCreator.user_id == current_user.id, SavedCreator.creator_id == creator_id)
        .first()
    )
    if saved_record:
        db.delete(saved_record)
        db.commit()

    return SavedStatusResponse(is_saved=False, saved_id=None)


@router.get("/creators/{creator_id}/status", response_model=SavedStatusResponse)
def get_creator_saved_status(
    creator_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Checks if the specified creator is saved by the current user.
    """
    saved_record = (
        db.query(SavedCreator)
        .filter(SavedCreator.user_id == current_user.id, SavedCreator.creator_id == creator_id)
        .first()
    )
    return SavedStatusResponse(
        is_saved=bool(saved_record),
        saved_id=saved_record.id if saved_record else None,
    )


@router.get("/creators", response_model=List[SavedCreatorRead])
def list_saved_creators(
    page: int = Query(1, ge=1),
    page_size: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["BRAND"])),
):
    """
    Returns the brand's saved creator roster with complete creator card metadata.
    """
    saved_records = (
        db.query(SavedCreator)
        .filter(SavedCreator.user_id == current_user.id)
        .order_by(desc(SavedCreator.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    results = []
    for sc in saved_records:
        if sc.creator:
            results.append(
                SavedCreatorRead(
                    id=sc.id,
                    creator_id=sc.creator_id,
                    user_id=sc.user_id,
                    created_at=sc.created_at,
                    creator=format_creator_list_item(sc.creator),
                )
            )
    return results
