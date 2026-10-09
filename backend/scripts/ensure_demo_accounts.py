"""
Kivora Repeatable Demo Accounts Provisioner
Safely provisions or updates canonical demo accounts for Creators, Brands, and Admin:
- elena.rostova@kivora.demo & elena@kivorastudios.com (Creator)
- atelier@maisonaurora.demo & sarah@auroracosmetics.com (Brand)
- admin@kivora.internal (Admin)
Ensures real bcrypt password hashes, verified email status, and complete profiles.
"""

import os
import sys
import uuid
from datetime import datetime

sys.path.insert(0, os.path.abspath("."))
from backend.app.database import engine, SessionLocal, Base
from backend.app.models.models import User, CreatorProfile, BrandProfile
from backend.app.core.security import hash_password

DEMO_PASSWORD = "Password123!"

def provision_demo_accounts():
    env = os.getenv("KIVORA_ENV", os.getenv("ENV", "development")).lower()
    if env in ["production", "prod"]:
        print("SECURITY ABORT: ensure_demo_accounts.py is strictly restricted from executing in production environments.")
        return

    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    hashed_pwd = hash_password(DEMO_PASSWORD)

    try:
        # 1. Creator Demo: Elena Rostova (elena.rostova@kivora.demo)
        c1 = session.query(User).filter(User.email == "elena.rostova@kivora.demo").first()
        if not c1:
            c1 = User(
                id="user-creator-1",
                email="elena.rostova@kivora.demo",
                hashed_password=hashed_pwd,
                role="CREATOR",
                is_email_verified=True,
                created_at=datetime.utcnow()
            )
            session.add(c1)
            session.flush()
        else:
            c1.hashed_password = hashed_pwd
            c1.is_email_verified = True

        if not c1.creator_profile:
            cp1 = CreatorProfile(
                id="creator-1",
                user_id=c1.id,
                display_name="Elena Rostova",
                handle="elena_creative",
                bio="Generative Visual Director & Sora specialist creating high-fashion and luxury commercials.",
                avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
                location="London, UK",
                years_experience=5,
                primary_specialization="Generative Video & Film",
                min_budget=1500,
                hourly_rate=175,
                availability_status="AVAILABLE",
                verification_tier="VERIFIED_PARTNER",
                verified_claims_count=6,
                completed_projects_count=18,
                average_rating=4.95,
                created_at=datetime.utcnow()
            )
            session.add(cp1)

        # 1b. Creator Alias: elena@kivorastudios.com
        c1_alias = session.query(User).filter(User.email == "elena@kivorastudios.com").first()
        if not c1_alias:
            c1_alias = User(
                id=f"user-creator-alias-{uuid.uuid4().hex[:8]}",
                email="elena@kivorastudios.com",
                hashed_password=hashed_pwd,
                role="CREATOR",
                is_email_verified=True,
                created_at=datetime.utcnow()
            )
            session.add(c1_alias)
            session.flush()
            cp_alias = CreatorProfile(
                id=f"creator-alias-{uuid.uuid4().hex[:8]}",
                user_id=c1_alias.id,
                display_name="Elena Rostova",
                handle="elena_studios",
                bio="Generative Video Director & Sora / Runway specialist.",
                avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
                location="London, UK",
                years_experience=5,
                primary_specialization="Generative Video & Film",
                min_budget=1500,
                hourly_rate=175,
                availability_status="AVAILABLE",
                verification_tier="VERIFIED_PARTNER",
                verified_claims_count=6,
                completed_projects_count=18,
                average_rating=4.95,
                created_at=datetime.utcnow()
            )
            session.add(cp_alias)
        else:
            c1_alias.hashed_password = hashed_pwd
            c1_alias.is_email_verified = True

        # 2. Brand Demo: Maison Aurora / Sarah (atelier@maisonaurora.demo & sarah@auroracosmetics.com)
        b1 = session.query(User).filter(User.email == "atelier@maisonaurora.demo").first()
        if not b1:
            b1 = User(
                id="user-brand-4",
                email="atelier@maisonaurora.demo",
                hashed_password=hashed_pwd,
                role="BRAND",
                is_email_verified=True,
                created_at=datetime.utcnow()
            )
            session.add(b1)
            session.flush()
        else:
            b1.hashed_password = hashed_pwd
            b1.is_email_verified = True

        if not b1.brand_profile:
            bp1 = BrandProfile(
                id="brand-4",
                user_id=b1.id,
                company_name="Maison Aurora",
                slug="maison-aurora",
                industry="Fashion & Haute Couture",
                website_url="https://maisonaurora.demo",
                logo_url="https://images.unsplash.com/photo-1541535650810-10d26f5c2ab3?auto=format&fit=crop&w=200&q=80",
                description="Parisian luxury fashion house pioneering AI haute couture visual campaigns.",
                company_size="51-200",
                headquarters="Paris, France",
                is_verified_brand=True,
                created_at=datetime.utcnow()
            )
            session.add(bp1)

        # 2b. Brand Alias: sarah@auroracosmetics.com
        b1_alias = session.query(User).filter(User.email == "sarah@auroracosmetics.com").first()
        if not b1_alias:
            b1_alias = User(
                id=f"user-brand-alias-{uuid.uuid4().hex[:8]}",
                email="sarah@auroracosmetics.com",
                hashed_password=hashed_pwd,
                role="BRAND",
                is_email_verified=True,
                created_at=datetime.utcnow()
            )
            session.add(b1_alias)
            session.flush()
        else:
            b1_alias.hashed_password = hashed_pwd
            b1_alias.is_email_verified = True
            b1_alias.role = "BRAND"

        if not b1_alias.brand_profile:
            bp_alias = BrandProfile(
                id=f"brand-alias-{uuid.uuid4().hex[:8]}",
                user_id=b1_alias.id,
                company_name="Aurora Cosmetics & Media",
                slug="aurora-cosmetics",
                industry="Beauty & Luxury Goods",
                website_url="https://auroracosmetics.com",
                logo_url="https://images.unsplash.com/photo-1541535650810-10d26f5c2ab3?auto=format&fit=crop&w=200&q=80",
                description="Global beauty and cosmetic brand creating generative campaign visuals.",
                company_size="51-200",
                headquarters="New York, NY",
                is_verified_brand=True,
                created_at=datetime.utcnow()
            )
            session.add(bp_alias)

        # 3. Admin Demo: Platform Reviewer (admin@kivora.internal)
        admin = session.query(User).filter(User.email == "admin@kivora.internal").first()
        if not admin:
            admin = User(
                id="user-admin-default",
                email="admin@kivora.internal",
                hashed_password=hashed_pwd,
                role="ADMIN",
                is_email_verified=True,
                created_at=datetime.utcnow()
            )
            session.add(admin)
        else:
            admin.hashed_password = hashed_pwd
            admin.role = "ADMIN"
            admin.is_email_verified = True

        session.commit()
        print("Demo accounts successfully provisioned and verified:")
        print("  - Creator: elena.rostova@kivora.demo / elena@kivorastudios.com [Password123!]")
        print("  - Brand:   atelier@maisonaurora.demo / sarah@auroracosmetics.com [Password123!]")
        print("  - Admin:   admin@kivora.internal [Password123!]")

    except Exception as e:
        session.rollback()
        print(f"Error provisioning demo accounts: {e}")
        raise
    finally:
        session.close()

if __name__ == "__main__":
    provision_demo_accounts()
