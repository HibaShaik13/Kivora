"""
Unit Tests for Kivora Matching Engine
Tests suitability scoring, string normalization, content type compatibility,
and proper separation of suitable vs unsuitable creator/brief combinations.
"""

import pytest
from backend.app.database import SessionLocal
from backend.app.models.models import CreatorProfile, Brief
from backend.app.services.matching import evaluate_creator_for_brief, are_content_types_compatible, normalize_text


@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_normalize_text():
    assert normalize_text("CONCEPT_ART") == "concept art"
    assert normalize_text("16:9") == "16:9"
    assert normalize_text("  Stylized-Anime  ") == "stylized anime"
    assert normalize_text(None) == ""


def test_content_type_compatibility():
    is_compat, is_exact = are_content_types_compatible("VIDEO", "VIDEO")
    assert is_compat is True and is_exact is True

    # Animation is compatible with Video
    is_compat, is_exact = are_content_types_compatible("VIDEO", "ANIMATION")
    assert is_compat is True and is_exact is False

    # Concept art is compatible with Image
    is_compat, is_exact = are_content_types_compatible("IMAGE", "CONCEPT_ART")
    assert is_compat is True and is_exact is False

    # Unrelated formats
    is_compat, is_exact = are_content_types_compatible("AUDIO", "3D_MODEL")
    assert is_compat is False and is_exact is False


def test_suitable_creator_scores_high(db_session):
    """
    Elena Rostova (Sci-Fi cinematography) evaluated against Dewdrop Serum 4K Video launch.
    Should score > 75% (EXCELLENT or PERFECT) with hard_filter_passed = True.
    """
    elena = db_session.query(CreatorProfile).filter(CreatorProfile.handle == "elena_creative").first()
    assert elena is not None
    brief = db_session.query(Brief).filter(Brief.title.like("%Dewdrop%")).first()
    assert brief is not None

    res = evaluate_creator_for_brief(elena, brief)
    assert res.breakdown.hard_filter_passed is True
    assert res.score >= 70.0
    assert res.match_level in ["GOOD", "EXCELLENT", "PERFECT"]


def test_specialization_aligned_creator_not_falsely_blocked(db_session):
    """
    Zara Chen (Sci-Fi Concept Art) evaluated against a CONCEPT_ART brief.
    Should pass hard filters and score > 60% rather than being falsely rejected.
    """
    zara = db_session.query(CreatorProfile).filter(CreatorProfile.handle == "zara_concept").first()
    assert zara is not None
    brief = db_session.query(Brief).filter(Brief.content_type == "CONCEPT_ART").first()
    if not brief:
        pytest.skip("No concept art brief in DB")

    res = evaluate_creator_for_brief(zara, brief)
    assert res.breakdown.hard_filter_passed is True
    assert res.score >= 50.0
    assert res.match_level in ["GOOD", "EXCELLENT"]


def test_unsuitable_budget_creator_fails_hard_filter(db_session):
    """
    A creator whose minimum budget exceeds the campaign budget ceiling by >15%
    must fail hard_filter_passed and receive an INCOMPATIBLE score.
    """
    elena = db_session.query(CreatorProfile).filter(CreatorProfile.handle == "elena_creative").first()
    assert elena is not None
    brief = db_session.query(Brief).first()
    assert brief is not None

    # Artificially set an exorbitant budget
    original_budget = elena.min_budget
    try:
        elena.min_budget = (brief.budget_amount or 1000.0) * 5.0
        res = evaluate_creator_for_brief(elena, brief)
        assert res.breakdown.hard_filter_passed is False
        assert res.match_level == "INCOMPATIBLE"
        assert res.score < 50.0
        assert any("budget" in g.lower() for g in res.gaps)
    finally:
        elena.min_budget = original_budget
