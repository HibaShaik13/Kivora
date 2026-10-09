"""
Kivora Explainable Matching Router
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.models import Brief
from backend.app.schemas.schemas import BriefMatchResponse
from backend.app.services.matching import match_creators_for_brief

router = APIRouter(prefix="/api/match", tags=["Matching"])


@router.get("/briefs/{brief_id}", response_model=BriefMatchResponse)
def get_brief_creator_matches(
    brief_id: str,
    min_score: float = Query(0.0, description="Minimum match score filter"),
    db: Session = Depends(get_db)
):
    brief = db.query(Brief).filter(Brief.id == brief_id).first()
    if not brief:
        raise HTTPException(status_code=404, detail="Brief not found")

    matches = match_creators_for_brief(db, brief, min_score=min_score)

    return BriefMatchResponse(
        brief_id=brief.id,
        brief_title=brief.title,
        total_creators_evaluated=len(matches),
        matches=matches
    )
