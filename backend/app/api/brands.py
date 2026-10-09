"""
Kivora Brand Profile & Dashboard Router
"""

import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.app.database import get_db
from backend.app.models.models import BrandProfile, User
from backend.app.schemas.schemas import BrandProfileRead, BrandProfileSetupRequest, BrandProfileUpdateRequest
from backend.app.core.deps import require_role, get_current_user

router = APIRouter(prefix="/api/brands", tags=["Brands"])


@router.post("/profile", response_model=BrandProfileRead, status_code=201)
def setup_or_update_brand_profile(
    payload: BrandProfileSetupRequest,
    current_user: User = Depends(require_role(["BRAND"])),
    db: Session = Depends(get_db)
):
    """Real authenticated brand user sets up or updates their company profile."""
    brand = db.query(BrandProfile).filter(BrandProfile.user_id == current_user.id).first()

    clean_slug = payload.slug.lower().strip().replace(" ", "-")
    existing_slug = db.query(BrandProfile).filter(
        BrandProfile.slug == clean_slug,
        BrandProfile.user_id != current_user.id
    ).first()
    if existing_slug:
        raise HTTPException(status_code=400, detail="This company slug is already registered.")

    if not brand:
        brand_id = f"brand-{uuid.uuid4().hex[:10]}"
        brand = BrandProfile(
            id=brand_id,
            user_id=current_user.id,
            company_name=payload.company_name,
            slug=clean_slug,
            industry=payload.industry,
            website_url=payload.website_url,
            logo_url=payload.logo_url,
            description=payload.description,
            company_size=payload.company_size,
            headquarters=payload.headquarters,
            is_verified_brand=True,
            created_at=datetime.utcnow()
        )
        db.add(brand)
    else:
        brand.company_name = payload.company_name
        brand.slug = clean_slug
        brand.industry = payload.industry
        brand.website_url = payload.website_url
        brand.logo_url = payload.logo_url
        brand.description = payload.description
        brand.company_size = payload.company_size
        brand.headquarters = payload.headquarters
        brand.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(brand)
    return brand


@router.put("/profile", response_model=BrandProfileRead)
def update_brand_profile_put(
    payload: BrandProfileUpdateRequest,
    current_user: User = Depends(require_role(["BRAND"])),
    db: Session = Depends(get_db)
):
    """Authenticated brand updates their own profile with ownership enforcement."""
    brand = current_user.brand_profile
    if not brand:
        raise HTTPException(
            status_code=404,
            detail="Brand profile not yet configured. Please create your profile first."
        )

    if payload.slug is not None:
        clean_slug = payload.slug.lower().strip().replace(" ", "-")
        existing_slug = db.query(BrandProfile).filter(
            BrandProfile.slug == clean_slug,
            BrandProfile.user_id != current_user.id
        ).first()
        if existing_slug:
            raise HTTPException(status_code=400, detail="This company slug is already registered.")
        brand.slug = clean_slug

    for field in [
        "company_name", "industry", "website_url", "logo_url",
        "description", "company_size", "headquarters"
    ]:
        val = getattr(payload, field, None)
        if val is not None:
            setattr(brand, field, val)

    brand.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(brand)
    return brand


@router.get("", response_model=list[BrandProfileRead])
def list_brands(db: Session = Depends(get_db)):
    """Public listing of all verified brands."""
    brands = db.query(BrandProfile).order_by(BrandProfile.company_name).all()
    return brands


@router.get("/me", response_model=BrandProfileRead)
def get_my_brand_profile(
    current_user: User = Depends(require_role(["BRAND"])),
    db: Session = Depends(get_db)
):
    brand = current_user.brand_profile
    if not brand:
        raise HTTPException(status_code=404, detail="Brand profile not yet configured.")
    return brand


@router.get("/{slug_or_id}", response_model=BrandProfileRead)
def get_brand_detail(slug_or_id: str, db: Session = Depends(get_db)):
    brand = db.query(BrandProfile).filter(
        or_(BrandProfile.id == slug_or_id, BrandProfile.slug == slug_or_id)
    ).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    return brand
