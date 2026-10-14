"""
Kivora Taxonomy & Catalog Router
Returns marketplace categories, subcategories, skills, and generative tools catalog.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from backend.app.database import get_db
from backend.app.models.models import Skill, Tool, Category, CreatorCategory, BriefCategory, Brief
from backend.app.schemas.schemas import SkillRead, ToolRead, CategoryRead, SubcategoryRead

router = APIRouter(prefix="/api/taxonomy", tags=["Taxonomy"])


@router.get("/categories", response_model=List[CategoryRead])
def list_categories(db: Session = Depends(get_db)):
    """
    Returns all top-level categories with subcategories and live counts
    of verified creators and published campaign briefs.
    """
    # Fetch top-level categories
    categories = (
        db.query(Category)
        .filter(Category.parent_id == None)
        .order_by(Category.display_order.asc(), Category.name.asc())
        .all()
    )

    # Batch compute creator counts per category
    creator_counts = dict(
        db.query(CreatorCategory.category_id, func.count(func.distinct(CreatorCategory.creator_id)))
        .group_by(CreatorCategory.category_id)
        .all()
    )

    # Batch compute published brief counts per category
    brief_counts = dict(
        db.query(BriefCategory.category_id, func.count(func.distinct(BriefCategory.brief_id)))
        .join(Brief, BriefCategory.brief_id == Brief.id)
        .filter(Brief.status == "PUBLISHED")
        .group_by(BriefCategory.category_id)
        .all()
    )

    results = []
    for c in categories:
        sub_list = [
            SubcategoryRead(
                id=s.id,
                name=s.name,
                slug=s.slug,
                description=s.description,
                icon=s.icon,
                display_order=s.display_order,
                parent_id=s.parent_id,
            )
            for s in sorted(c.subcategories, key=lambda x: (x.display_order, x.name))
        ]

        # Aggregate counts for parent and all its subcategories
        c_count = creator_counts.get(c.id, 0) + sum(creator_counts.get(s.id, 0) for s in c.subcategories)
        b_count = brief_counts.get(c.id, 0) + sum(brief_counts.get(s.id, 0) for s in c.subcategories)

        results.append(
            CategoryRead(
                id=c.id,
                name=c.name,
                slug=c.slug,
                description=c.description,
                icon=c.icon,
                display_order=c.display_order,
                parent_id=c.parent_id,
                subcategories=sub_list,
                creator_count=c_count,
                brief_count=b_count,
                open_brief_count=b_count,
            )
        )

    return results


@router.get("/categories/{slug_or_id}", response_model=CategoryRead)
def get_category_detail(slug_or_id: str, db: Session = Depends(get_db)):
    """Returns single category with its subcategories and metrics."""
    c = db.query(Category).filter(
        or_(Category.id == slug_or_id, Category.slug == slug_or_id)
    ).first()

    if not c:
        raise HTTPException(status_code=404, detail="Category not found")

    all_cat_ids = [c.id] + [s.id for s in c.subcategories]

    creator_count = (
        db.query(CreatorCategory.creator_id)
        .filter(CreatorCategory.category_id.in_(all_cat_ids))
        .distinct()
        .count()
    )

    brief_count = (
        db.query(BriefCategory.brief_id)
        .join(Brief, BriefCategory.brief_id == Brief.id)
        .filter(
            BriefCategory.category_id.in_(all_cat_ids),
            Brief.status == "PUBLISHED",
        )
        .distinct()
        .count()
    )

    sub_list = [
        SubcategoryRead(
            id=s.id,
            name=s.name,
            slug=s.slug,
            description=s.description,
            icon=s.icon,
            display_order=s.display_order,
            parent_id=s.parent_id,
        )
        for s in sorted(c.subcategories, key=lambda x: (x.display_order, x.name))
    ]

    return CategoryRead(
        id=c.id,
        name=c.name,
        slug=c.slug,
        description=c.description,
        icon=c.icon,
        display_order=c.display_order,
        parent_id=c.parent_id,
        subcategories=sub_list,
        creator_count=creator_count,
        brief_count=brief_count,
        open_brief_count=brief_count,
    )


@router.get("/skills", response_model=List[SkillRead])
def list_skills(db: Session = Depends(get_db)):
    return db.query(Skill).all()


@router.get("/tools", response_model=List[ToolRead])
def list_tools(db: Session = Depends(get_db)):
    return db.query(Tool).all()
