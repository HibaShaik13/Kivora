"""
Kivora Explainable Matching Service
Deterministic, two-phase algorithm scoring creator fit for creative briefs.
Provides granular score breakdowns, matched criteria reasons, and missing gaps.
"""

from typing import List, Tuple, Optional
from sqlalchemy.orm import Session

from backend.app.models.models import CreatorProfile, Brief, PortfolioProject, CreatorSkill, CreatorTool
from backend.app.schemas.schemas import CreatorMatchResult, MatchScoreBreakdown


def evaluate_creator_for_brief(creator: CreatorProfile, brief: Brief) -> CreatorMatchResult:
    reasons: List[str] = []
    gaps: List[str] = []

    # ----------------------------------------------------
    # PHASE 1: HARD FILTER CHECKS (Binary Gates)
    # ----------------------------------------------------
    hard_filter_passed = True

    # 1. Content Type Compatibility
    matching_content_projs = [
        p for p in creator.portfolio_projects
        if p.content_type == brief.content_type
    ]
    if not matching_content_projs:
        # Check if primary specialization loosely aligns, otherwise hard failure
        if brief.content_type.lower() not in creator.primary_specialization.lower():
            hard_filter_passed = False
            gaps.append(f"No proven {brief.content_type} portfolio project found.")
    else:
        reasons.append(f"Portfolio includes {len(matching_content_projs)} verified {brief.content_type} projects.")

    # 2. Aspect Ratio Capability
    matching_ar_projs = [
        p for p in creator.portfolio_projects
        if p.aspect_ratio == brief.aspect_ratio
    ]
    if not matching_ar_projs:
        gaps.append(f"No direct {brief.aspect_ratio} aspect ratio sample in portfolio.")
    else:
        reasons.append(f"Demonstrated native {brief.aspect_ratio} production experience.")

    # 3. Budget Tolerance (Allows up to 15% negotiation threshold)
    budget_limit = brief.budget_amount * 1.15
    if creator.min_budget > budget_limit:
        hard_filter_passed = False
        gaps.append(f"Minimum budget (${creator.min_budget:,.0f}) exceeds campaign ceiling (${brief.budget_amount:,.0f}).")
    else:
        reasons.append(f"Creator minimum fee (${creator.min_budget:,.0f}) comfortably fits campaign budget (${brief.budget_amount:,.0f}).")

    # ----------------------------------------------------
    # PHASE 2: WEIGHTED SOFT SCORING (0 to 100)
    # ----------------------------------------------------

    # 1. SKILL SCORE (Weight: 35%)
    creator_skill_ids = {cs.skill_id: cs.proficiency_level for cs in creator.skills}
    brief_skills = brief.required_skills
    if brief_skills:
        skill_points = 0.0
        total_skill_weight = 0.0
        for bs in brief_skills:
            weight = 2.0 if bs.is_required else 1.0
            total_skill_weight += weight
            if bs.skill_id in creator_skill_ids:
                prof = creator_skill_ids[bs.skill_id]
                multiplier = 1.0 if prof == "EXPERT" else (0.85 if prof == "ADVANCED" else 0.70)
                skill_points += weight * multiplier
                reasons.append(f"Mastery in required skill '{bs.skill.name}' ({prof}).")
            else:
                if bs.is_required:
                    gaps.append(f"Missing required skill: '{bs.skill.name}'.")
                else:
                    gaps.append(f"Preferred skill '{bs.skill.name}' not declared.")
        skill_score = (skill_points / total_skill_weight) * 100.0 if total_skill_weight > 0 else 75.0
    else:
        skill_score = 80.0

    # 2. TOOL & MODEL SCORE (Weight: 25%)
    creator_tool_map = {ct.tool_id: ct for ct in creator.tools}
    brief_tools = brief.required_tools
    if brief_tools:
        tool_points = 0.0
        total_tool_weight = 0.0
        for bt in brief_tools:
            weight = 2.0 if bt.is_required else 1.0
            total_tool_weight += weight
            if bt.tool_id in creator_tool_map:
                ct = creator_tool_map[bt.tool_id]
                bonus = 1.0 if ct.is_claim_verified else 0.85
                tool_points += weight * bonus
                status_txt = "evidence-verified" if ct.is_claim_verified else "self-declared"
                reasons.append(f"Proficient in requested tool '{bt.tool.name}' ({status_txt}).")
            else:
                if bt.is_required:
                    gaps.append(f"Missing required tool pipeline: '{bt.tool.name}'.")
                else:
                    gaps.append(f"Preferred tool '{bt.tool.name}' not in creator stack.")
        tool_score = (tool_points / total_tool_weight) * 100.0 if total_tool_weight > 0 else 75.0
    else:
        tool_score = 80.0

    # 3. STYLE & SPECIALIZATION AFFINITY (Weight: 20%)
    style_keywords = [w.lower().strip() for w in brief.creative_style_mood.replace(",", " ").split() if len(w) > 3]
    creator_corpus = (creator.primary_specialization + " " + creator.bio).lower()
    style_matches = [w for w in style_keywords if w in creator_corpus]
    if style_matches:
        style_score = min(100.0, 60.0 + len(style_matches) * 15.0)
        reasons.append(f"Creative style alignment: matches aesthetic keywords ({', '.join(style_matches[:3])}).")
    else:
        style_score = 55.0

    # 4. VERIFICATION & EVIDENCE MULTIPLIER (Weight: 15%)
    if creator.verification_tier == "TOP_STUDIO":
        ver_score = 100.0
        reasons.append("Top Studio verified tier with multi-audited production workflows.")
    elif creator.verification_tier == "VERIFIED_PRO":
        ver_score = 90.0
        reasons.append(f"Verified Pro creator with {creator.verified_claims_count} audited evidence records.")
    elif creator.verification_tier == "COMMUNITY":
        ver_score = 65.0
    else:
        ver_score = 40.0
        gaps.append("Creator claims are currently self-declared without verified audit.")

    # 5. RATING & AVAILABILITY BONUS (Weight: 5%)
    rating_score = (creator.average_rating / 5.0) * 100.0
    if creator.availability_status == "AVAILABLE":
        rating_score = min(100.0, rating_score + 5.0)
        reasons.append("Immediately available for production kickoff.")
    elif creator.availability_status == "LIMITED":
        rating_score = max(0.0, rating_score - 10.0)
    else:
        rating_score = max(0.0, rating_score - 30.0)
        gaps.append("Creator currently has booked availability status.")

    # ----------------------------------------------------
    # COMPUTE COMPOSITE SCORE
    # ----------------------------------------------------
    raw_composite = (
        0.35 * skill_score +
        0.25 * tool_score +
        0.20 * style_score +
        0.15 * ver_score +
        0.05 * rating_score
    )

    if not hard_filter_passed:
        # Severe dampening for hard filter failure while retaining explanation
        final_score = round(min(raw_composite * 0.45, 45.0), 1)
        match_level = "INCOMPATIBLE"
    else:
        final_score = round(raw_composite, 1)
        if final_score >= 90.0:
            match_level = "PERFECT"
        elif final_score >= 80.0:
            match_level = "EXCELLENT"
        elif final_score >= 68.0:
            match_level = "GOOD"
        else:
            match_level = "PARTIAL"

    breakdown = MatchScoreBreakdown(
        hard_filter_passed=hard_filter_passed,
        skill_score=round(skill_score, 1),
        tool_score=round(tool_score, 1),
        style_score=round(style_score, 1),
        verification_score=round(ver_score, 1),
        rating_score=round(rating_score, 1),
        total_score=final_score,
        match_level=match_level
    )

    # Collect matched skills and tools
    matched_skills = [bs.skill.name for bs in brief_skills if bs.skill_id in creator_skill_ids]
    matched_tools = [bt.tool.name for bt in brief_tools if bt.tool_id in creator_tool_map]
    strengths = [r for r in reasons if any(k in r.lower() for k in ["mastery", "proficient", "verified", "top studio", "alignment", "available", "fits"])]
    missing_requirements = [g for g in gaps if any(k in g.lower() for k in ["missing required", "no proven", "exceeds"])]

    return CreatorMatchResult(
        creator_id=creator.id,
        display_name=creator.display_name,
        handle=creator.handle,
        avatar_url=creator.avatar_url,
        primary_specialization=creator.primary_specialization,
        verification_tier=creator.verification_tier,
        min_budget=creator.min_budget,
        score=final_score,
        match_level=match_level,
        breakdown=breakdown,
        reasons=reasons,
        gaps=gaps,
        matched_skills=matched_skills,
        matched_tools=matched_tools,
        strengths=strengths,
        missing_requirements=missing_requirements,
        compatibility_disclaimer="Scores represent estimated compatibility based on declared and verified portfolio evidence, not a guarantee of outcome.",
        hard_requirements_met=hard_filter_passed,
    )


def match_creators_for_brief(
    db: Session,
    brief: Brief,
    min_score: float = 0.0,
    enforce_hard_filters: bool = False,
    limit: Optional[int] = None,
) -> List[CreatorMatchResult]:
    from typing import Optional
    creators = db.query(CreatorProfile).all()
    results = [evaluate_creator_for_brief(c, brief) for c in creators]
    
    # Filter by hard filters if requested
    if enforce_hard_filters:
        results = [r for r in results if r.breakdown.hard_filter_passed]

    # Filter by min_score and sort descending by match score
    filtered = [r for r in results if r.score >= min_score]
    filtered.sort(key=lambda r: r.score, reverse=True)

    if limit is not None and limit > 0:
        filtered = filtered[:limit]

    return filtered

