"""
Kivora Taxonomy & Catalog Router
Returns skills and generative tools catalog.
"""

from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.models import Skill, Tool
from backend.app.schemas.schemas import SkillRead, ToolRead

router = APIRouter(prefix="/api/taxonomy", tags=["Taxonomy"])


@router.get("/skills", response_model=List[SkillRead])
def list_skills(db: Session = Depends(get_db)):
    return db.query(Skill).all()


@router.get("/tools", response_model=List[ToolRead])
def list_tools(db: Session = Depends(get_db)):
    return db.query(Tool).all()
