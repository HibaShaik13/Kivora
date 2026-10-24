"""
Kivora Explainable Matching Router
Provides privacy-safe creator matching against campaign briefs and AI-assisted proposal formulation.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.models import Brief, CreatorProfile, User
from backend.app.schemas.schemas import BriefMatchResponse, PitchAssistRequest, PitchAssistResponse
from backend.app.services.matching import match_creators_for_brief
from backend.app.services.pitch_assistant import assist_creator_pitch
from backend.app.core.deps import security_bearer, require_role, get_current_user, require_approved_creator_user
from backend.app.core.security import decode_access_token

router = APIRouter(prefix="/api/match", tags=["Matching"])


def verify_brief_visibility(brief: Brief, credentials: Optional[HTTPAuthorizationCredentials], db: Session):
    """
    Guarantees tenant isolation and draft brief privacy.
    Draft and unpublished briefs can only be accessed by the owning brand.
    """
    if brief.status in ["PUBLISHED", "ACTIVE", "OPEN"]:
        return  # Publicly discoverable published brief

    # Draft / private brief: enforce ownership
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Matching for unpublished brief drafts is restricted to the campaign owner.",
        )

    payload = decode_access_token(credentials.credentials)
    if not payload or not payload.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
        )

    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated user no longer exists.",
        )

    # Check ownership
    is_owner = bool(user.brand_profile and user.brand_profile.id == brief.brand_id)
    is_admin = bool(user.role == "ADMIN")
    if not (is_owner or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You do not own this unpublished campaign brief.",
        )


@router.get("/briefs/{brief_id}", response_model=BriefMatchResponse)
def get_brief_creator_matches(
    brief_id: str,
    min_score: float = Query(0.0, description="Minimum match score filter"),
    enforce_hard_filters: bool = Query(False, description="Filter out creators who fail hard requirements"),
    limit: Optional[int] = Query(None, description="Limit top N matches"),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Session = Depends(get_db),
):
    brief = db.query(Brief).filter(Brief.id == brief_id).first()
    if not brief:
        raise HTTPException(status_code=404, detail="Brief not found")

    # Enforce draft campaign privacy
    verify_brief_visibility(brief, credentials, db)

    total_creators = db.query(func.count(CreatorProfile.id)).scalar() or 0

    matches = match_creators_for_brief(
        db,
        brief,
        min_score=min_score,
        enforce_hard_filters=enforce_hard_filters,
        limit=limit,
    )

    return BriefMatchResponse(
        brief_id=brief.id,
        brief_title=brief.title,
        total_creators_evaluated=total_creators,
        matches=matches,
    )


@router.post("/briefs/{brief_id}/assist-pitch", response_model=PitchAssistResponse)
def assist_proposal_pitch(
    brief_id: str,
    payload: PitchAssistRequest,
    current_user: User = Depends(require_approved_creator_user),
    db: Session = Depends(get_db),
):
    """
    AI-assisted creator proposal and pitch formulation.
    Generates structured, brief-tailored pitch drafts grounded strictly in the creator's
    actual portfolio, tools, skills, and pricing evidence.
    """
    brief = db.query(Brief).filter(Brief.id == brief_id).first()
    if not brief:
        raise HTTPException(status_code=404, detail="Brief not found")

    if brief.status not in ["PUBLISHED", "ACTIVE", "OPEN"]:
        raise HTTPException(
            status_code=403,
            detail="Cannot generate proposal pitch for an unpublished campaign brief.",
        )

    creator = current_user.creator_profile
    if not creator:
        raise HTTPException(
            status_code=404,
            detail="Creator profile not found. Please complete profile setup first.",
        )

    return assist_creator_pitch(creator=creator, brief=brief, req=payload)
