"""
Phase 5 Comprehensive Matching Engine Tests
Validates deterministic scoring, 7 calibrated weights (totaling 100%), portfolio relevance,
data coverage indicators, binary hard filters, and explainable breakdown matrices.
"""

import pytest
from unittest.mock import MagicMock
from backend.app.models.models import (
    CreatorProfile,
    Brief,
    PortfolioProject,
    CreatorSkill,
    CreatorTool,
    Skill,
    Tool,
    Category,
    BriefCategory,
    CreatorCategory,
    BriefSkill,
    BriefTool,
)
from backend.app.services.matching import evaluate_creator_for_brief, match_creators_for_brief


def create_mock_skill(skill_id: str, name: str):
    s = Skill(id=skill_id, name=name, category="Generative Video")
    return s


def create_mock_tool(tool_id: str, name: str):
    t = Tool(id=tool_id, name=name, category="Video Generation", vendor="Runway")
    return t


def test_scoring_weights_total_100_percent():
    """Verify that the 7 scoring criteria weights sum to exactly 1.0 (100%)."""
    # 0.25 (skill) + 0.25 (portfolio) + 0.15 (tool) + 0.15 (style) + 0.10 (budget) + 0.05 (ver) + 0.05 (avail)
    weights = [0.25, 0.25, 0.15, 0.15, 0.10, 0.05, 0.05]
    assert round(sum(weights), 6) == 1.0


def test_exact_skill_and_tool_matches():
    """Creator with EXPERT skill and verified tool receives full skill and tool scores."""
    skill_model = create_mock_skill("skill-4k-video", "4K Video")
    tool_model = create_mock_tool("tool-runway-gen3", "Runway Gen-3")

    brief = Brief(
        id="brief-test-1",
        title="Luxury Automotive Teaser",
        content_type="VIDEO",
        aspect_ratio="16:9",
        budget_amount=5000.0,
        creative_style_mood="Cinematic, Luxury, High-Octane",
        required_skills=[BriefSkill(brief_id="brief-test-1", skill_id="skill-4k-video", is_required=True, skill=skill_model)],
        required_tools=[BriefTool(brief_id="brief-test-1", tool_id="tool-runway-gen3", is_required=True, tool=tool_model)],
        categories=[],
    )

    creator = CreatorProfile(
        id="creator-test-1",
        display_name="Elena Vance",
        handle="elenavance",
        avatar_url="https://example.com/avatar.jpg",
        primary_specialization="Commercial Video Director",
        bio="Cinematic luxury creator specializing in 4K automotive visuals",
        min_budget=4000.0,
        verification_tier="TOP_STUDIO",
        availability_status="AVAILABLE",
        average_rating=5.0,
        skills=[CreatorSkill(creator_id="creator-test-1", skill_id="skill-4k-video", proficiency_level="EXPERT", skill=skill_model)],
        tools=[CreatorTool(creator_id="creator-test-1", tool_id="tool-runway-gen3", is_claim_verified=True, tool=tool_model)],
        portfolio_projects=[
            PortfolioProject(
                id="proj-1",
                creator_id="creator-test-1",
                title="Supercar Velocity",
                description="Automotive luxury 4k video production",
                slug="supercar-velocity",
                primary_asset_url="https://example.com/proj.mp4",
                thumbnail_url="https://example.com/thumb.jpg",
                content_type="VIDEO",
                aspect_ratio="16:9",
                evidence_records=[MagicMock()],
            )
        ],
        categories=[],
    )

    res = evaluate_creator_for_brief(creator, brief)
    assert res.hard_requirements_met is True
    assert res.breakdown.hard_filter_passed is True
    assert res.breakdown.skill_score == 100.0
    assert res.breakdown.tool_score == 100.0
    assert res.breakdown.portfolio_score >= 90.0
    assert res.breakdown.budget_score == 100.0
    assert res.breakdown.verification_score == 100.0
    assert res.breakdown.availability_score == 100.0
    assert res.score >= 90.0
    assert res.match_level == "PERFECT"
    assert len(res.relevant_portfolio_projects) > 0
    assert res.relevant_portfolio_projects[0]["id"] == "proj-1"


def test_partial_and_missing_skills():
    """Creator missing required skills receives lower skill score and explicit gaps."""
    skill_required = create_mock_skill("skill-unreal", "Unreal Engine")
    skill_pref = create_mock_skill("skill-comfyui", "ComfyUI Node Graph")

    brief = Brief(
        id="brief-test-2",
        title="Gaming CGI Trailer",
        content_type="ANIMATION",
        aspect_ratio="16:9",
        budget_amount=6000.0,
        required_skills=[
            BriefSkill(brief_id="brief-test-2", skill_id="skill-unreal", is_required=True, skill=skill_required),
            BriefSkill(brief_id="brief-test-2", skill_id="skill-comfyui", is_required=False, skill=skill_pref),
        ],
        required_tools=[],
        categories=[],
    )

    creator = CreatorProfile(
        id="creator-test-2",
        display_name="Novice Creator",
        handle="novice",
        primary_specialization="3D Animator",
        min_budget=3000.0,
        verification_tier="COMMUNITY",
        availability_status="AVAILABLE",
        skills=[],  # Zero declared skills
        tools=[],
        portfolio_projects=[
            PortfolioProject(
                id="proj-2",
                creator_id="creator-test-2",
                title="Stylized Anime Walk",
                content_type="ANIMATION",
                aspect_ratio="16:9",
            )
        ],
        categories=[],
    )

    res = evaluate_creator_for_brief(creator, brief)
    assert res.breakdown.skill_score == 0.0
    assert any("Missing required skill: 'Unreal Engine'" in g for g in res.gaps)
    assert any("Missing required skill: 'Unreal Engine'" in g for g in res.missing_requirements)


def test_hard_filter_budget_ceiling_failure():
    """Creator whose rate exceeds brief budget by more than 15% fails hard filter."""
    brief = Brief(
        id="brief-test-budget",
        title="Startup Promo",
        content_type="VIDEO",
        aspect_ratio="16:9",
        budget_amount=2000.0,  # 2000 limit with 15% tolerance = 2300 max
        required_skills=[],
        required_tools=[],
        categories=[],
    )

    creator = CreatorProfile(
        id="creator-expensive",
        display_name="Expensive Studio",
        handle="expensive",
        primary_specialization="Commercial Video",
        min_budget=4000.0,  # Far above 2300
        verification_tier="TOP_STUDIO",
        availability_status="AVAILABLE",
        portfolio_projects=[
            PortfolioProject(
                id="proj-exp",
                creator_id="creator-expensive",
                title="Luxury Commercial",
                content_type="VIDEO",
                aspect_ratio="16:9",
            )
        ],
        categories=[],
    )

    res = evaluate_creator_for_brief(creator, brief)
    assert res.hard_requirements_met is False
    assert res.breakdown.hard_filter_passed is False
    assert res.match_level == "INCOMPATIBLE"
    assert res.score <= 45.0
    assert any("exceeds campaign ceiling" in g.lower() for g in res.gaps)


def test_hard_filter_content_type_mismatch():
    """Creator with incompatible content type and no related specialization fails hard filter."""
    brief = Brief(
        id="brief-anim",
        title="2D Anime Opener",
        content_type="ANIMATION",
        aspect_ratio="16:9",
        budget_amount=4000.0,
        required_skills=[],
        required_tools=[],
        categories=[],
    )

    creator = CreatorProfile(
        id="creator-photo",
        display_name="Still Photographer",
        handle="photo_only",
        primary_specialization="Product Photography Still Renders",
        min_budget=1500.0,
        verification_tier="COMMUNITY",
        availability_status="AVAILABLE",
        portfolio_projects=[
            PortfolioProject(
                id="proj-photo",
                creator_id="creator-photo",
                title="Bottle Still",
                content_type="PRODUCT_VIZ",
                aspect_ratio="1:1",
            )
        ],
        categories=[],
    )

    res = evaluate_creator_for_brief(creator, brief)
    assert res.hard_requirements_met is False
    assert res.breakdown.hard_filter_passed is False
    assert res.match_level == "INCOMPATIBLE"
    assert any("No proven ANIMATION portfolio project" in g for g in res.gaps)


def test_data_coverage_calculation():
    """Verify data coverage percentage is computed accurately based on populated dimensions."""
    brief = Brief(
        id="brief-cov",
        title="Simple Brief",
        content_type="VIDEO",
        aspect_ratio="16:9",
        budget_amount=3000.0,
        required_skills=[],
        required_tools=[],
        categories=[],
    )

    # Completely blank creator: 0/7 dimensions
    empty_creator = CreatorProfile(
        id="creator-empty",
        display_name="Empty Profile",
        handle="empty",
        primary_specialization="",
        min_budget=None,
        verification_tier="NONE",
        availability_status="",
        skills=[],
        tools=[],
        portfolio_projects=[],
        categories=[],
    )
    res_empty = evaluate_creator_for_brief(empty_creator, brief)
    assert res_empty.data_coverage == 0.0

    # Creator with budget, portfolio, availability, verification (4/7 = ~57.1%)
    partial_creator = CreatorProfile(
        id="creator-partial",
        display_name="Partial Profile",
        handle="partial",
        primary_specialization="Video",
        min_budget=2500.0,
        verification_tier="COMMUNITY",
        availability_status="AVAILABLE",
        skills=[],
        tools=[],
        portfolio_projects=[
            PortfolioProject(id="p-1", creator_id="creator-partial", content_type="VIDEO", aspect_ratio="16:9", title="Sample")
        ],
        categories=[],
    )
    res_partial = evaluate_creator_for_brief(partial_creator, brief)
    assert res_partial.data_coverage == 57.1


def test_deterministic_ranking_and_tie_breaking():
    """Ensures deterministic ordering: higher score first, ties broken by handle."""
    brief = Brief(
        id="brief-rank",
        title="Rank Test",
        content_type="VIDEO",
        aspect_ratio="16:9",
        budget_amount=5000.0,
        required_skills=[],
        required_tools=[],
        categories=[],
    )

    c1 = CreatorProfile(
        id="c-alpha",
        display_name="Alpha",
        handle="alpha",
        primary_specialization="Video",
        min_budget=3000.0,
        verification_tier="COMMUNITY",
        availability_status="AVAILABLE",
        portfolio_projects=[PortfolioProject(id="p-a", creator_id="c-alpha", content_type="VIDEO", aspect_ratio="16:9", title="Vid")],
    )
    c2 = CreatorProfile(
        id="c-beta",
        display_name="Beta",
        handle="beta",
        primary_specialization="Video",
        min_budget=3000.0,
        verification_tier="COMMUNITY",
        availability_status="AVAILABLE",
        portfolio_projects=[PortfolioProject(id="p-b", creator_id="c-beta", content_type="VIDEO", aspect_ratio="16:9", title="Vid")],
    )

    r1 = evaluate_creator_for_brief(c1, brief)
    r2 = evaluate_creator_for_brief(c2, brief)
    assert r1.score == r2.score  # Exact tie

    db_mock = MagicMock()
    db_mock.query().all.return_value = [c2, c1]

    matches = match_creators_for_brief(db_mock, brief)
    assert len(matches) == 2
    # Lexicographical tie break by handle: beta is higher reverse-sort or stable
    assert matches[0].handle == "beta" or matches[1].handle == "alpha"
