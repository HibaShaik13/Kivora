"""
Tests for Kivora Marketplace Expansion, Category Taxonomy, and Collaboration History Isolation
"""

import sys
from pathlib import Path
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(REPO_ROOT))

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import SessionLocal
from backend.app.models.models import (
    User,
    CreatorProfile,
    BrandProfile,
    Category,
    Brief,
    Application,
    Engagement,
    EngagementDeliverable
)
from backend.app.core.security import create_access_token

import pytest
client = TestClient(app)

@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_01_categories_load_with_actual_counts():
    """1. Category cards load from backend with actual creator & brief counts."""
    res = client.get("/api/taxonomy/categories")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 20, "Should have at least 20 primary categories"
    
    # Check that counts are computed from real records
    fashion = next((c for c in data if c["slug"] == "fashion-apparel"), None)
    assert fashion is not None, "Fashion & Apparel category must exist"
    assert fashion["creator_count"] > 0, "Fashion & Apparel should have creators"
    assert fashion["open_brief_count"] > 0, "Fashion & Apparel should have briefs"
    assert len(fashion["subcategories"]) >= 3, "Fashion & Apparel should have subcategories"


def test_02_filter_creators_by_fashion():
    """2. Selecting Fashion displays Fashion creators only."""
    res = client.get("/api/creators?category=fashion-apparel")
    assert res.status_code == 200
    creators = res.json()
    assert len(creators) > 0, "Should return creators in fashion-apparel"
    
    for c in creators:
        cat_slugs = [cat["slug"] for cat in c.get("categories", [])]
        has_fashion = any("fashion" in s for s in cat_slugs) or "fashion" in c["primary_specialization"].lower()
        assert has_fashion, f"Creator {c['id']} should be affiliated with fashion"


def test_03_filter_creators_by_food_and_beverage():
    """3. Selecting Food & Beverage displays matching creators only."""
    res = client.get("/api/creators?category=food-beverage")
    assert res.status_code == 200
    creators = res.json()
    assert len(creators) > 0, "Should return creators in food-beverage"
    
    for c in creators:
        cat_slugs = [cat["slug"] for cat in c.get("categories", [])]
        has_food = any("food" in s or "beverage" in s for s in cat_slugs) or "food" in c["primary_specialization"].lower()
        assert has_food, f"Creator {c['id']} should be affiliated with food-beverage"


def test_04_filter_creators_by_automotive():
    """4. Selecting Automotive displays matching creators only."""
    res = client.get("/api/creators?category=automotive")
    assert res.status_code == 200
    creators = res.json()
    assert len(creators) > 0, "Should return creators in automotive"
    
    for c in creators:
        cat_slugs = [cat["slug"] for cat in c.get("categories", [])]
        has_auto = any("automotive" in s for s in cat_slugs) or "automotive" in c["primary_specialization"].lower()
        assert has_auto, f"Creator {c['id']} should be affiliated with automotive"


def test_05_multiple_filters_combine_correctly():
    """5. Multiple filters combine correctly without overriding."""
    # Filter by category and verification_tier
    res = client.get("/api/creators?category=fashion-apparel&verification_tier=VERIFIED_PRO")
    assert res.status_code == 200
    creators = res.json()
    for c in creators:
        assert c["verification_tier"] == "VERIFIED_PRO"


def test_06_clearing_filters_restores_results():
    """6. Clearing filters restores complete eligible results."""
    res_filtered = client.get("/api/creators?category=automotive")
    res_all = client.get("/api/creators")
    assert res_filtered.status_code == 200
    assert res_all.status_code == 200
    assert len(res_all.json()) > len(res_filtered.json()), "Unfiltered list must have more creators"


def test_07_briefs_category_filtering():
    """7. Briefs explorer category filtering works accurately."""
    res_fashion = client.get("/api/briefs?category=fashion-apparel")
    assert res_fashion.status_code == 200
    briefs = res_fashion.json()
    assert len(briefs) > 0
    for b in briefs:
        assert b["status"] == "PUBLISHED"


def test_08_draft_and_closed_briefs_lifecycle_protection():
    """8. Unauthenticated/public users only see PUBLISHED briefs."""
    res = client.get("/api/briefs")
    assert res.status_code == 200
    for b in res.json():
        assert b["status"] == "PUBLISHED", "Public briefs explorer must only expose PUBLISHED briefs"


def test_09_brand_collaboration_history_isolation(db_session):
    """9. A brand sees only its own collaborations with zero cross-brand leakage."""
    # Find synthetic brand 1
    brand1 = db_session.query(BrandProfile).filter(BrandProfile.id == "brand-synth-001").first()
    assert brand1 is not None, "Synthetic brand 1 must exist"
    
    token = create_access_token({"sub": brand1.user_id, "role": "BRAND"})
    res = client.get("/api/brands/me/creators", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    
    # Verify that every engagement returned belongs to a brief owned by brand1
    for creator_entry in data:
        for eng in creator_entry["engagements"]:
            brief_in_db = db_session.query(Brief).filter(Brief.id == eng["brief_id"]).first()
            assert brief_in_db.brand_id == brand1.id, "History must belong strictly to brand1"


def test_10_creator_collaboration_history_isolation(db_session):
    """10. A creator sees only brands they collaborated with."""
    eng_sample = db_session.query(Engagement).first()
    assert eng_sample is not None, "At least one engagement must exist"
    creator1 = eng_sample.creator
    assert creator1 is not None, "Creator must exist"
    
    token = create_access_token({"sub": creator1.user_id, "role": "CREATOR"})
    res = client.get("/api/creators/me/brands", headers={"Authorization": f"Bearer {token}"})
    if res.status_code == 403:
        detail = res.json().get("detail", {})
        assert detail.get("error_code") == "CREATOR_APPROVAL_PENDING"
    else:
        assert res.status_code == 200
        data = res.json()
        assert len(data) > 0, "Collaborating brands must be returned"
        for brand_entry in data:
            for eng in brand_entry["engagements"]:
                eng_in_db = db_session.query(Engagement).filter(Engagement.id == eng["engagement_id"]).first()
                assert eng_in_db.creator_id == creator1.id


def test_11_engagements_scoped_by_brief_id(db_session):
    """11. Filtering engagements by brief_id isolates history to that brief."""
    brand1 = db_session.query(BrandProfile).filter(BrandProfile.id == "brand-synth-001").first()
    token = create_access_token({"sub": brand1.user_id, "role": "BRAND"})
    
    # Find a brief owned by brand1 that has an engagement
    eng = (
        db_session.query(Engagement)
        .join(Brief, Engagement.brief_id == Brief.id)
        .filter(Brief.brand_id == brand1.id)
        .first()
    )
    if eng:
        res = client.get(f"/api/engagements?brief_id={eng.brief_id}", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        for item in res.json():
            assert item["brief_id"] == eng.brief_id


def test_12_non_seeded_users_preserved(db_session):
    """12. Original demo users (Elena Rostova, Admin) are preserved intact."""
    admin = db_session.query(User).filter(User.email == "admin@kivora.demo").first()
    assert admin is not None
    elena = db_session.query(User).filter(User.email == "elena.rostova@kivora.demo").first()
    assert elena is not None


if __name__ == "__main__":
    db = SessionLocal()
    tests = [
        ("01_categories_load_with_actual_counts", lambda: test_01_categories_load_with_actual_counts()),
        ("02_filter_creators_by_fashion", lambda: test_02_filter_creators_by_fashion()),
        ("03_filter_creators_by_food_and_beverage", lambda: test_03_filter_creators_by_food_and_beverage()),
        ("04_filter_creators_by_automotive", lambda: test_04_filter_creators_by_automotive()),
        ("05_multiple_filters_combine_correctly", lambda: test_05_multiple_filters_combine_correctly()),
        ("06_clearing_filters_restores_results", lambda: test_06_clearing_filters_restores_results()),
        ("07_briefs_category_filtering", lambda: test_07_briefs_category_filtering()),
        ("08_draft_and_closed_briefs_lifecycle_protection", lambda: test_08_draft_and_closed_briefs_lifecycle_protection()),
        ("09_brand_collaboration_history_isolation", lambda: test_09_brand_collaboration_history_isolation(db)),
        ("10_creator_collaboration_history_isolation", lambda: test_10_creator_collaboration_history_isolation(db)),
        ("11_engagements_scoped_by_brief_id", lambda: test_11_engagements_scoped_by_brief_id(db)),
        ("12_non_seeded_users_preserved", lambda: test_12_non_seeded_users_preserved(db)),
    ]

    print("\n=== RUNNING BACKEND TESTS ===")
    passed = 0
    failed = 0
    for name, fn in tests:
        try:
            fn()
            print(f"[PASS] {name}")
            passed += 1
        except Exception as e:
            print(f"[FAIL] {name}: {e}")
            failed += 1
    db.close()
    print(f"\nRESULTS: {passed} passed, {failed} failed out of {len(tests)} tests.\n")
    if failed > 0:
        sys.exit(1)
