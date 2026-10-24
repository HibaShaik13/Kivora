"""
Kivora Explainable Matching Service
Deterministic, two-phase algorithm scoring creator fit for creative briefs.
Provides granular score breakdowns, matched criteria reasons, missing gaps, and verified portfolio evidence.
"""

from typing import List, Tuple, Optional, Dict, Any
from sqlalchemy.orm import Session

from backend.app.models.models import CreatorProfile, Brief, PortfolioProject, CreatorSkill, CreatorTool
from backend.app.schemas.schemas import CreatorMatchResult, MatchScoreBreakdown


CONTENT_TYPE_COMPATIBILITY_GROUPS = {
    "VIDEO": {"VIDEO", "ANIMATION", "MOTION_GRAPHICS", "CINEMATIC", "TRAILER", "SHORT_FILM"},
    "ANIMATION": {"ANIMATION", "VIDEO", "MOTION_GRAPHICS", "2D_ANIMATION", "3D_ANIMATION"},
    "IMAGE": {"IMAGE", "STILL_IMAGE", "CONCEPT_ART", "ILLUSTRATION", "PRODUCT_VIZ", "KEYART", "STILL"},
    "STILL_IMAGE": {"STILL_IMAGE", "IMAGE", "CONCEPT_ART", "ILLUSTRATION", "PRODUCT_VIZ", "KEYART", "STILL"},
    "CONCEPT_ART": {"CONCEPT_ART", "IMAGE", "STILL_IMAGE", "ILLUSTRATION", "MATTE_PAINTING", "VISUAL_DEVELOPMENT"},
    "PRODUCT_VIZ": {"PRODUCT_VIZ", "3D_MODEL", "IMAGE", "STILL_IMAGE", "CGI_RENDER", "COMMERCIAL_STILL", "VIDEO", "ANIMATION"},
    "3D_MODEL": {"3D_MODEL", "PRODUCT_VIZ", "CGI_RENDER", "ASSET_PACK", "ENVIRONMENT_3D", "IMAGE", "VIDEO"},
}


def normalize_text(val: Optional[str]) -> str:
    if not val:
        return ""
    return val.replace("_", " ").replace("-", " ").strip().lower()


def are_content_types_compatible(brief_ctype: Optional[str], item_ctype: Optional[str]) -> Tuple[bool, bool]:
    """
    Returns (is_compatible, is_exact_match).
    """
    if not brief_ctype or not item_ctype:
        return (False, False)

    b_norm = normalize_text(brief_ctype)
    i_norm = normalize_text(item_ctype)
    if b_norm == i_norm:
        return (True, True)

    b_key = brief_ctype.upper().replace(" ", "_")
    i_key = item_ctype.upper().replace(" ", "_")
    if i_key in CONTENT_TYPE_COMPATIBILITY_GROUPS.get(b_key, set()):
        return (True, False)

    # Token overlap check (e.g. 'concept art' vs 'concept', 'animation' vs 'anime animation')
    b_tokens = set(b_norm.split())
    i_tokens = set(i_norm.split())
    if b_tokens and (b_tokens.issubset(i_tokens) or b_norm in i_norm or i_norm in b_norm):
        return (True, False)

    return (False, False)


def evaluate_creator_for_brief(creator: CreatorProfile, brief: Brief) -> CreatorMatchResult:
    reasons: List[str] = []
    gaps: List[str] = []
    warnings: List[str] = []
    relevant_portfolio_projects: List[Dict[str, Any]] = []

    # ----------------------------------------------------
    # DATA COVERAGE TRACKING
    # Explicitly track how many required data dimensions exist
    # ----------------------------------------------------
    coverage_checks = {
        "skills": bool(creator.skills and len(creator.skills) > 0),
        "tools": bool(creator.tools and len(creator.tools) > 0),
        "portfolio": bool(creator.portfolio_projects and len(creator.portfolio_projects) > 0),
        "categories": bool(creator.categories and len(creator.categories) > 0),
        "budget": bool(creator.min_budget is not None and creator.min_budget > 0),
        "availability": bool(creator.availability_status in ["AVAILABLE", "LIMITED", "BOOKED"]),
        "verification": bool(creator.verification_tier and creator.verification_tier != "NONE"),
    }
    populated_dims = sum(1 for v in coverage_checks.values() if v)
    data_coverage = round((populated_dims / len(coverage_checks)) * 100.0, 1)

    # ----------------------------------------------------
    # PHASE 1: HARD FILTER CHECKS (Binary Eligibility Gates)
    # ----------------------------------------------------
    hard_filter_passed = True

    # 1. Content Type Compatibility
    b_ctype = brief.content_type or ""
    exact_content_matches = []
    compatible_content_matches = []
    for p in (creator.portfolio_projects or []):
        is_compat, is_exact = are_content_types_compatible(b_ctype, p.content_type)
        if is_exact:
            exact_content_matches.append(p)
        elif is_compat:
            compatible_content_matches.append(p)

    spec_norm = normalize_text(creator.primary_specialization)
    bio_norm = normalize_text(creator.bio)
    skills_norm = " ".join(normalize_text(cs.skill.name if cs.skill and hasattr(cs.skill, 'name') else cs.skill_id) for cs in (creator.skills or []))
    cats_norm = " ".join(normalize_text(cat.category.name if cat.category and hasattr(cat.category, 'name') else cat.category_id) for cat in (creator.categories or []))
    b_ctype_norm = normalize_text(b_ctype)
    creator_corpus = f"{spec_norm} {bio_norm} {skills_norm} {cats_norm}"
    b_tokens = [token for token in b_ctype_norm.split() if len(token) > 3]

    discipline_aligned = (
        (b_ctype_norm in spec_norm)
        or (b_ctype_norm in bio_norm)
        or (b_ctype_norm in skills_norm)
        or (b_ctype_norm in cats_norm)
        or any(token in creator_corpus for token in b_tokens)
    )

    if exact_content_matches:
        reasons.append(f"Portfolio includes {len(exact_content_matches)} verified {b_ctype} project(s).")
    elif compatible_content_matches:
        reasons.append(f"Demonstrated production in related creative deliverable formats ({compatible_content_matches[0].content_type}).")
    elif discipline_aligned:
        warnings.append(f"Specialization & expertise align with {b_ctype} production without direct portfolio sample.")
    else:
        hard_filter_passed = False
        gaps.append(f"No proven {b_ctype} portfolio project or creative discipline alignment found.")

    # 2. Aspect Ratio Capability
    matching_ar_projs = [
        p for p in (creator.portfolio_projects or [])
        if p.aspect_ratio == brief.aspect_ratio
    ]
    if not matching_ar_projs:
        gaps.append(f"No direct {brief.aspect_ratio} aspect ratio sample in portfolio.")
    else:
        reasons.append(f"Demonstrated native {brief.aspect_ratio} production experience.")

    # 3. Budget Tolerance (Allows up to 15% negotiation threshold)
    c_budget = creator.min_budget or 0.0
    b_budget = brief.budget_amount or 0.0
    budget_limit = b_budget * 1.15
    if b_budget > 0 and c_budget > budget_limit:
        hard_filter_passed = False
        gaps.append(f"Minimum budget (${c_budget:,.0f}) exceeds campaign ceiling (${b_budget:,.0f}).")
    elif b_budget > 0 and c_budget > 0:
        reasons.append(f"Creator minimum fee (${c_budget:,.0f}) fits campaign budget (${b_budget:,.0f}).")

    # ----------------------------------------------------
    # PHASE 2: WEIGHTED SOFT SCORING (100% Total Calibrated Framework)
    # Skill (25%), Portfolio (25%), Tool (15%), Domain/Format (15%),
    # Budget (10%), Verification (5%), Availability (5%)
    # ----------------------------------------------------

    # 1. SKILL SCORE (Weight: 25%)
    creator_skill_ids = {cs.skill_id: cs.proficiency_level for cs in (creator.skills or [])}
    brief_skills = brief.required_skills or []
    if brief_skills:
        skill_points = 0.0
        total_skill_weight = 0.0
        for bs in brief_skills:
            weight = 2.0 if bs.is_required else 1.0
            total_skill_weight += weight
            skill_name = bs.skill.name if (bs.skill and hasattr(bs.skill, 'name')) else bs.skill_id
            if bs.skill_id in creator_skill_ids:
                prof = creator_skill_ids[bs.skill_id]
                multiplier = 1.0 if prof == "EXPERT" else (0.85 if prof == "ADVANCED" else (0.70 if prof == "INTERMEDIATE" else 0.50))
                skill_points += weight * multiplier
                reasons.append(f"Mastery in required skill '{skill_name}' ({prof}).")
            else:
                if bs.is_required:
                    gaps.append(f"Missing required skill: '{skill_name}'.")
                else:
                    gaps.append(f"Preferred skill '{skill_name}' not declared.")
        skill_score = (skill_points / total_skill_weight) * 100.0 if total_skill_weight > 0 else 75.0
    else:
        skill_score = 80.0

    # 2. PORTFOLIO RELEVANCE SCORE (Weight: 25%)
    # Evaluates past projects: content type alignment, aspect ratio alignment, keyword relevance, and attached evidence
    projs = creator.portfolio_projects or []
    if projs:
        # Check matching projects and build relevant references
        relevant_matches = []
        for p in projs:
            score_contrib = 0
            is_compat, is_exact = are_content_types_compatible(brief.content_type, p.content_type)
            if is_exact:
                score_contrib += 40
            elif is_compat:
                score_contrib += 32

            if p.aspect_ratio == brief.aspect_ratio:
                score_contrib += 25
            elif p.aspect_ratio:
                score_contrib += 12
            
            # Text / tag matching
            brief_text = f"{brief.title or ''} {brief.creative_style_mood or ''} {brief.campaign_objective or ''}".lower()
            p_title = getattr(p, "title", "") or ""
            p_desc = getattr(p, "description", "") or ""
            p_tags = getattr(p, "tags", "") or ""
            p_tools = getattr(p, "software_used", "") or ""
            proj_text = f"{p_title} {p_desc} {p_tags} {p_tools}".lower()
            matching_keywords = [w for w in brief_text.split() if len(w) > 3 and w in proj_text]
            if matching_keywords:
                score_contrib += min(25, len(matching_keywords) * 8)

            # Evidence records bonus
            ev_records = getattr(p, "evidence_records", None) or []
            if len(ev_records) > 0:
                score_contrib += 10

            if score_contrib >= 25 or is_exact or is_compat:
                relevant_matches.append((p, score_contrib))

        if relevant_matches:
            relevant_matches.sort(key=lambda x: x[1], reverse=True)
            for top_p, _ in relevant_matches[:4]:
                relevant_portfolio_projects.append({
                    "id": getattr(top_p, "id", "") or "",
                    "title": getattr(top_p, "title", "Project") or "Project",
                    "content_type": getattr(top_p, "content_type", "") or "",
                    "aspect_ratio": getattr(top_p, "aspect_ratio", "") or "",
                    "thumbnail_url": getattr(top_p, "thumbnail_url", "") or "",
                })
            # Best project fit
            top_score = relevant_matches[0][1]
            portfolio_score = min(100.0, float(top_score))
            reasons.append(f"Direct portfolio evidence: '{relevant_matches[0][0].title}' matches campaign deliverable.")
        else:
            portfolio_score = 40.0 if discipline_aligned else 25.0
            gaps.append("Portfolio contains no directly matching deliverables or media formats.")
    else:
        if discipline_aligned:
            portfolio_score = 45.0
            warnings.append("Creator profile has no portfolio samples uploaded; scored based on declared discipline mastery.")
        else:
            portfolio_score = 15.0
            gaps.append("Creator profile has no portfolio projects uploaded.")
            warnings.append("Low portfolio evidence available for automated validation.")

    # 3. TOOL & MODEL SCORE (Weight: 15%)
    creator_tool_map = {ct.tool_id: ct for ct in (creator.tools or [])}
    brief_tools = brief.required_tools or []
    if brief_tools:
        tool_points = 0.0
        total_tool_weight = 0.0
        for bt in brief_tools:
            weight = 2.0 if bt.is_required else 1.0
            total_tool_weight += weight
            tool_name = bt.tool.name if (bt.tool and hasattr(bt.tool, 'name')) else bt.tool_id
            if bt.tool_id in creator_tool_map:
                ct = creator_tool_map[bt.tool_id]
                bonus = 1.0 if ct.is_claim_verified else 0.85
                tool_points += weight * bonus
                status_txt = "evidence-verified" if ct.is_claim_verified else "self-declared"
                reasons.append(f"Proficient in requested tool '{tool_name}' ({status_txt}).")
            else:
                if bt.is_required:
                    gaps.append(f"Missing required tool pipeline: '{tool_name}'.")
                else:
                    gaps.append(f"Preferred tool '{tool_name}' not in creator stack.")
        tool_score = (tool_points / total_tool_weight) * 100.0 if total_tool_weight > 0 else 75.0
    else:
        tool_score = 80.0

    # 4. CREATIVE DOMAIN & CONTENT-FORMAT AFFINITY (Weight: 15%)
    brief_cat_ids = {bc.category_id for bc in (brief.categories or [])}
    brief_parent_ids = {bc.category.parent_id for bc in (brief.categories or []) if bc.category and bc.category.parent_id}
    creator_cat_ids = {cc.category_id for cc in (creator.categories or [])}
    creator_parent_ids = {cc.category.parent_id for cc in (creator.categories or []) if cc.category and cc.category.parent_id}

    if brief_cat_ids:
        direct_matches = brief_cat_ids.intersection(creator_cat_ids)
        parent_matches = brief_cat_ids.intersection(creator_parent_ids).union(brief_parent_ids.intersection(creator_cat_ids))
        if direct_matches:
            matched_cat_names = [bc.category.name for bc in brief.categories if bc.category_id in direct_matches and bc.category]
            cat_score = 100.0
            reasons.append(f"Category alignment: matched in '{', '.join(matched_cat_names)}'.")
        elif parent_matches:
            cat_score = 80.0
            reasons.append("Creative domain alignment across parent/child taxonomy.")
        else:
            cat_score = 45.0
            gaps.append("Creator categories do not directly match campaign brief category.")
    else:
        cat_score = 75.0

    style_keywords = [w.lower().strip() for w in (brief.creative_style_mood or "").replace(",", " ").split() if len(w) > 3]
    creator_corpus = ((creator.primary_specialization or "") + " " + (creator.bio or "")).lower()
    style_matches = [w for w in style_keywords if w in creator_corpus]
    if style_matches:
        raw_style_score = min(100.0, 60.0 + len(style_matches) * 15.0)
        reasons.append(f"Creative style alignment: matches aesthetic keywords ({', '.join(style_matches[:3])}).")
    else:
        raw_style_score = 55.0

    style_score = round(0.60 * cat_score + 0.40 * raw_style_score, 1)

    # 5. BUDGET COMPATIBILITY SCORE (Weight: 10%)
    if b_budget <= 0:
        budget_score = 80.0
    elif c_budget <= 0:
        budget_score = 75.0  # Flexible/open rate
    elif c_budget <= b_budget:
        budget_score = 100.0
    elif c_budget <= budget_limit:
        # Linear decay from 100 to 60 over 15% negotiation buffer
        decay = (c_budget - b_budget) / (0.15 * b_budget)
        budget_score = round(100.0 - (40.0 * decay), 1)
        warnings.append(f"Creator min budget (${c_budget:,.0f}) is slightly above campaign target (${b_budget:,.0f}).")
    else:
        budget_score = 20.0

    # 6. VERIFICATION & EVIDENCE MULTIPLIER (Weight: 5%)
    if creator.verification_tier == "TOP_STUDIO":
        ver_score = 100.0
        reasons.append("Top Studio verified tier with multi-audited production workflows.")
    elif creator.verification_tier == "VERIFIED_PRO":
        ver_score = 90.0
        reasons.append(f"Verified Pro creator with {creator.verified_claims_count or 0} audited evidence records.")
    elif creator.verification_tier == "COMMUNITY":
        ver_score = 65.0
    else:
        ver_score = 40.0
        gaps.append("Creator claims are currently self-declared without verified audit.")

    # 7. AVAILABILITY SCORE (Weight: 5%)
    if creator.availability_status == "AVAILABLE":
        avail_score = 100.0
        reasons.append("Immediately available for production kickoff.")
    elif creator.availability_status == "LIMITED":
        avail_score = 60.0
        warnings.append("Creator has limited production availability.")
    elif creator.availability_status == "BOOKED":
        avail_score = 20.0
        gaps.append("Creator currently has booked availability status.")
    else:
        avail_score = 70.0

    # Average rating reference (for breakdown transparency)
    avg_rating = creator.average_rating if creator.average_rating is not None else 5.0
    rating_score = (avg_rating / 5.0) * 100.0

    # ----------------------------------------------------
    # COMPUTE COMPOSITE SCORE (Sum of Weights = 1.00)
    # ----------------------------------------------------
    raw_composite = (
        0.25 * skill_score +
        0.25 * portfolio_score +
        0.15 * tool_score +
        0.15 * style_score +
        0.10 * budget_score +
        0.05 * ver_score +
        0.05 * avail_score
    )

    if not hard_filter_passed:
        # Dampening for hard filter failure while retaining explanation
        final_score = round(min(raw_composite * 0.55, 45.0), 1)
        match_level = "INCOMPATIBLE"
    else:
        final_score = round(raw_composite, 1)
        if final_score >= 85.0:
            match_level = "PERFECT"
        elif final_score >= 75.0:
            match_level = "EXCELLENT"
        elif final_score >= 60.0:
            match_level = "GOOD"
        else:
            match_level = "PARTIAL"

    breakdown = MatchScoreBreakdown(
        hard_filter_passed=hard_filter_passed,
        skill_score=round(skill_score, 1),
        portfolio_score=round(portfolio_score, 1),
        tool_score=round(tool_score, 1),
        style_score=round(style_score, 1),
        budget_score=round(budget_score, 1),
        verification_score=round(ver_score, 1),
        availability_score=round(avail_score, 1),
        rating_score=round(rating_score, 1),
        data_coverage=data_coverage,
        total_score=final_score,
        match_level=match_level,
    )

    # Collect matched skills and tools
    matched_skills = [
        (bs.skill.name if (bs.skill and hasattr(bs.skill, 'name')) else bs.skill_id)
        for bs in brief_skills if bs.skill_id in creator_skill_ids
    ]
    matched_tools = [
        (bt.tool.name if (bt.tool and hasattr(bt.tool, 'name')) else bt.tool_id)
        for bt in brief_tools if bt.tool_id in creator_tool_map
    ]
    strengths = [r for r in reasons if any(k in r.lower() for k in ["mastery", "proficient", "verified", "top studio", "alignment", "available", "fits", "direct portfolio"])]
    missing_requirements = [g for g in gaps if any(k in g.lower() for k in ["missing required", "no proven", "exceeds"])]

    return CreatorMatchResult(
        creator_id=creator.id,
        display_name=creator.display_name,
        handle=creator.handle,
        avatar_url=creator.avatar_url or "",
        location=getattr(creator, "location", None) or "Bengaluru, Karnataka",
        primary_specialization=creator.primary_specialization or "Generative Media Creator",
        verification_tier=creator.verification_tier or "NONE",
        min_budget=creator.min_budget or 0.0,
        score=final_score,
        match_level=match_level,
        breakdown=breakdown,
        reasons=reasons,
        gaps=gaps,
        matched_skills=matched_skills,
        matched_tools=matched_tools,
        strengths=strengths,
        missing_requirements=missing_requirements,
        warnings=warnings,
        relevant_portfolio_projects=relevant_portfolio_projects,
        confidence_score=data_coverage,
        data_coverage=data_coverage,
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
    creators = db.query(CreatorProfile).all()
    # Filter out explicitly rejected creators from brief matching
    creators = [c for c in creators if getattr(c, "approval_status", "APPROVED") != "REJECTED"]
    results = [evaluate_creator_for_brief(c, brief) for c in creators]

    # Filter by hard filters if requested
    if enforce_hard_filters:
        results = [r for r in results if r.breakdown.hard_filter_passed]

    # Filter by min_score and sort descending by match score, deterministic tie-break by handle
    filtered = [r for r in results if r.score >= min_score]
    filtered.sort(key=lambda r: (r.score, r.confidence_score, r.handle), reverse=True)

    if limit is not None and limit > 0:
        filtered = filtered[:limit]

    return filtered
