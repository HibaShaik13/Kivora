"""
Kivora Grounded Pitch & Proposal Assistant Service
Helps creators draft professional, brief-aligned pitches strictly grounded in their actual portfolio,
tools, skills, and pricing evidence. Never hallucinates qualifications.
"""

import os
import json
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from backend.app.models.models import CreatorProfile, Brief, PortfolioProject
from backend.app.schemas.schemas import PitchAssistRequest, PitchAssistResponse
from backend.app.services.matching import evaluate_creator_for_brief


def generate_heuristic_pitch(
    creator: CreatorProfile,
    brief: Brief,
    matched_skills: List[str],
    matched_tools: List[str],
    relevant_projects: List[Dict[str, Any]],
    proposed_rate: float,
    custom_notes: Optional[str] = None,
) -> PitchAssistResponse:
    """
    Deterministic, fully factual proposal drafting engine.
    Uses strictly the creator's existing profile, portfolio, and tool stack.
    """
    spec = creator.primary_specialization or "Generative Visual Production"
    top_proj_title = relevant_projects[0]["title"] if relevant_projects else None
    
    pitch_lines = [
        f"Hi {brief.brand.company_name if brief.brand else 'there'}, I would love to collaborate on '{brief.title}'.",
        f"As a creator specializing in {spec}, my production pipeline directly aligns with your requirements for {brief.content_type} in native {brief.aspect_ratio or '16:9'} format.",
    ]

    if top_proj_title:
        pitch_lines.append(
            f"My portfolio project '{top_proj_title}' demonstrates proven production experience with similar aesthetic and deliverable standards."
        )

    if matched_tools:
        tools_str = ", ".join(matched_tools[:4])
        pitch_lines.append(f"My active generation and finishing pipeline utilizes {tools_str}.")

    if matched_skills:
        skills_str = ", ".join(matched_skills[:3])
        pitch_lines.append(f"Key competencies applicable to this milestone include {skills_str}.")

    if custom_notes:
        pitch_lines.append(f"Specific approach note: {custom_notes.strip()}")

    pitch_lines.append(
        f"I can deliver all requested outputs ({brief.deliverables_description or 'master deliverables'}) including {brief.revision_allowance or 2} rounds of revisions within the agreed schedule."
    )

    pitch_text = "\n\n".join(pitch_lines)
    
    delivery_plan = (
        f"Phase 1: Concept & Keyframe Selection (Days 1-3)\n"
        f"Phase 2: High-Resolution Generation & Motion Synthesis (Days 4-8)\n"
        f"Phase 3: Color Grading, Upscaling & Revision Review (Days 9-12)\n"
        f"Final: Delivery of clean master {brief.aspect_ratio or '16:9'} renders ({brief.resolution_min or '4K'})."
    )

    return PitchAssistResponse(
        pitch_text=pitch_text,
        proposed_rate=proposed_rate,
        highlighted_skills=matched_skills[:4],
        highlighted_tools=matched_tools[:4],
        relevant_projects=relevant_projects[:3],
        delivery_plan_summary=delivery_plan,
        generation_engine="HEURISTIC_PITCH_ENGINE",
    )


def assist_creator_pitch(
    creator: CreatorProfile,
    brief: Brief,
    req: PitchAssistRequest,
) -> PitchAssistResponse:
    """
    Assists a creator in drafting a brief proposal pitch.
    Attempts Google Gemini generation when available, with strict grounding constraints.
    Falls back gracefully to the deterministic heuristic engine.
    """
    # 1. Evaluate fit to identify matching facts deterministically
    match_eval = evaluate_creator_for_brief(creator, brief)
    matched_skills = match_eval.matched_skills or []
    matched_tools = match_eval.matched_tools or []
    relevant_projects = match_eval.relevant_portfolio_projects or []

    # If brief had no rigid skill/tool constraints, highlight creator's active stack
    if not matched_tools and creator.tools:
        matched_tools = [
            (ct.tool.name if ct.tool and hasattr(ct.tool, 'name') else ct.tool_id)
            for ct in creator.tools
        ]
    if not matched_skills and creator.skills:
        matched_skills = [
            (cs.skill.name if cs.skill and hasattr(cs.skill, 'name') else cs.skill_id)
            for cs in creator.skills
        ]

    # 2. Determine realistic proposed rate
    brief_budget = brief.budget_amount or 0.0
    creator_rate = creator.min_budget or 0.0
    if brief_budget > 0 and creator_rate > 0:
        if creator_rate <= brief_budget:
            proposed_rate = min(brief_budget, max(creator_rate, brief_budget * 0.90))
        else:
            proposed_rate = brief_budget  # Match brand budget ceiling
    elif brief_budget > 0:
        proposed_rate = brief_budget
    elif creator_rate > 0:
        proposed_rate = creator_rate
    else:
        proposed_rate = 2500.0

    # 3. Attempt Gemini generation if API key is configured
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        try:
            from google import genai
            client = genai.Client(api_key=gemini_key)
            model_name = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
            
            grounding_context = {
                "creator_name": creator.display_name,
                "specialization": creator.primary_specialization,
                "brief_title": brief.title,
                "brand_name": brief.brand.company_name if brief.brand else "Brand",
                "content_type": brief.content_type,
                "aspect_ratio": brief.aspect_ratio,
                "budget_offered": proposed_rate,
                "matched_skills": matched_skills,
                "matched_tools": matched_tools,
                "relevant_projects": [p["title"] for p in relevant_projects],
                "creator_notes": req.custom_notes or "",
            }

            prompt_instruction = (
                "You are Kivora's Creative Proposal Assistant. Draft a compelling, professional pitch proposal "
                "for a creator applying to a commercial campaign brief.\n\n"
                "CRITICAL GROUNDING RULES:\n"
                "1. ONLY use the verified facts provided below. Do NOT invent qualifications, clients, or awards.\n"
                "2. Keep the tone collaborative, professional, and clear.\n"
                "3. Address the specific deliverable format and tools.\n\n"
                f"Context Data:\n{json.dumps(grounding_context, indent=2)}\n\n"
                "Output strictly valid JSON with keys:\n"
                "- pitch_text (string: 2-3 structured paragraphs)\n"
                "- delivery_plan_summary (string: brief phased milestones)\n"
            )

            response = client.models.generate_content(
                model=model_name,
                contents=prompt_instruction,
                config={'response_mime_type': 'application/json'}
            )
            parsed = json.loads(response.text)
            if "pitch_text" in parsed and "delivery_plan_summary" in parsed:
                return PitchAssistResponse(
                    pitch_text=parsed["pitch_text"],
                    proposed_rate=proposed_rate,
                    highlighted_skills=matched_skills[:4],
                    highlighted_tools=matched_tools[:4],
                    relevant_projects=relevant_projects[:3],
                    delivery_plan_summary=parsed["delivery_plan_summary"],
                    generation_engine=f"GEMINI ({model_name})",
                )
        except Exception as e:
            # Safe recovery to deterministic heuristic
            pass

    return generate_heuristic_pitch(
        creator=creator,
        brief=brief,
        matched_skills=matched_skills,
        matched_tools=matched_tools,
        relevant_projects=relevant_projects,
        proposed_rate=proposed_rate,
        custom_notes=req.custom_notes,
    )
