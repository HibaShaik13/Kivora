"""
Kivora AI Brief Builder Service
Transforms raw conversational brand input into structured, editable creative briefs.
Supports modular LLM integration (Gemini / OpenAI) with a robust heuristic fallback engine.
"""

import os
import json
import re
from typing import Optional
from backend.app.schemas.schemas import BriefGenerationRequest, StructuredBriefOutput


def extract_heuristic_brief(req: BriefGenerationRequest) -> StructuredBriefOutput:
    """
    Deterministic NLP & keyword extraction fallback engine.
    Ensures the brief builder operates reliably without requiring external API keys.
    """
    p = req.raw_prompt.lower()

    # 1. Detect Content Type & Aspect Ratio
    if any(k in p for k in ["tiktok", "reel", "vertical", "shorts", "9:16"]):
        aspect_ratio = "9:16"
        content_type = "VIDEO"
        res = "1080p"
        dur_min, dur_max = 12, 20
    elif any(k in p for k in ["still", "photo", "packaging", "render", "1:1", "square", "stills"]):
        aspect_ratio = "1:1"
        content_type = "PRODUCT_VIZ"
        res = "4K UHD"
        dur_min, dur_max = None, None
    elif any(k in p for k in ["anime", "cartoon", "2d", "character animation", "sakuga"]):
        aspect_ratio = "16:9"
        content_type = "ANIMATION"
        res = "1080p"
        dur_min, dur_max = 20, 35
    elif any(k in p for k in ["concept art", "matte painting", "world building", "spatial"]):
        aspect_ratio = "16:9"
        content_type = "CONCEPT_ART"
        res = "4K UHD"
        dur_min, dur_max = None, None
    else:
        # Default cinematic video
        aspect_ratio = "16:9"
        content_type = "VIDEO"
        res = "4K UHD"
        dur_min, dur_max = 25, 40

    # 2. Mood & Industry Styling
    if any(k in p for k in ["skincare", "beauty", "cosmetic", "glow", "dew", "serum", "dermal", "fluid"]):
        style_mood = "Ethereal Luxury, Clinical Elegance, Macro Fluidity"
        skills = ["skill-4k-video", "skill-macro-fluid", "skill-camera-control"]
        tools = ["tool-runway-gen3", "tool-comfyui", "tool-topaz-video"]
        channels = "Paid Social, YouTube Pre-roll, Brand E-commerce, In-Store Digital"
        objective = "Breakthrough commercial demonstrating clinical formulation with hyper-realistic fluid droplet reveals."
        target_aud = "Affluent skincare enthusiasts, ages 22-45, seeking clean active beauty."
        restrictions = "No uncanny valley human facial distortion; natural water surface tension and pristine macro skin textures."
        suggested_budget = req.target_budget or 4200.0
    elif any(k in p for k in ["car", "automotive", "vehicle", "drift", "speed", "hypercar", "electric"]):
        style_mood = "High-Contrast Cyberpunk, Hyper-Speed, Metallic Reflections"
        skills = ["skill-automotive-cgi", "skill-4k-video", "skill-camera-control"]
        tools = ["tool-runway-gen3", "tool-flux1-pro", "tool-topaz-video"]
        channels = "Broadcast Commercial, YouTube 4K, International Auto Expos, Digital OOH"
        objective = "High-octane commercial capturing vehicle dynamics, headlight volumetric lighting, and reflective highway speed."
        target_aud = "Automotive aficionados, EV early adopters, luxury performance drivers."
        restrictions = "Wheel rotation and body reflections must stay cohesive across camera cut transitions."
        suggested_budget = req.target_budget or 6000.0
    elif any(k in p for k in ["fashion", "runway", "couture", "silk", "dress", "textile", "model"]):
        style_mood = "Surreal Avant-Garde, Haute Couture, Fluid Metamorphosis"
        skills = ["skill-fashion-avatar", "skill-4k-video", "skill-prompt-eng"]
        tools = ["tool-flux1-pro", "tool-runway-gen3", "tool-magnific"]
        channels = "Instagram Reels, TikTok Fashion, Paris Fashion Week Digital Displays"
        objective = "Surreal digital fashion showcase highlighting experimental fabric simulation and metaphysical transformations."
        target_aud = "High-fashion collectors, luxury brand buyers, digital art enthusiasts."
        restrictions = "Fluid drapery must avoid tearing or digital pixel noise artifacts."
        suggested_budget = req.target_budget or 4800.0
    elif any(k in p for k in ["game", "gaming", "rpg", "trailer", "cinematic", "character", "lore"]):
        style_mood = "Dark Fantasy, Cinematic Action, Volumetric Atmosphere"
        skills = ["skill-lora-char", "skill-4k-video", "skill-camera-control"]
        tools = ["tool-kling-ai", "tool-runway-gen3", "tool-elevenlabs"]
        channels = "Steam Store Header, YouTube Gaming, Twitch Sponsored Pre-roll"
        objective = "Character lore reveal teaser showcasing dynamic combat keyframes and environmental depth."
        target_aud = "Action RPG gamers, Steam wishlisters, fantasy entertainment community."
        restrictions = "Consistent character costume and silhouette across all camera perspectives."
        suggested_budget = req.target_budget or 3600.0
    else:
        style_mood = "Modern Premium, Architectural Cleanliness, Vibrant Motion"
        skills = ["skill-4k-video", "skill-camera-control"]
        tools = ["tool-runway-gen3", "tool-midjourney-v6"]
        channels = "Brand Website, Paid Social, Investor Video"
        objective = "Polished commercial asset communicating brand innovation with state-of-the-art generative visuals."
        target_aud = "Forward-thinking digital consumers and commercial partners."
        restrictions = "Strict brand style guideline adherence; clean lighting without hallucinated details."
        suggested_budget = req.target_budget or 3000.0

    # Clean title extraction
    first_sentence = req.raw_prompt.split(".")[0].strip()
    title = f"{first_sentence[:60].title()}: Campaign Spec"

    deliverables = f"1x Master Cut ({aspect_ratio} {res}), 2x Short-form Social Cuts, plus clean textless master render."

    return StructuredBriefOutput(
        title=title,
        campaign_objective=objective,
        target_audience=target_aud,
        content_type=content_type,
        creative_style_mood=style_mood,
        aspect_ratio=aspect_ratio,
        duration_seconds_min=dur_min,
        duration_seconds_max=dur_max,
        resolution_min=res,
        deliverables_description=deliverables,
        revision_allowance=2,
        budget_amount=suggested_budget,
        budget_currency="USD",
        recommended_skills=skills,
        recommended_tools=tools,
        commercial_use_requirements="Full commercial rights for paid digital distribution and web embed.",
        usage_channels=channels,
        usage_duration="12 Months",
        usage_territories="Worldwide",
        restrictions_and_guidelines=restrictions,
        disclosure_requirements="EU AI Act and FTC compliant commercial AI transparency disclosure (#CreatedWithAI).",
        generation_engine="HEURISTIC_FALLBACK_ENGINE"
    )


def generate_structured_brief(req: BriefGenerationRequest) -> StructuredBriefOutput:
    """
    Primary brief builder entrypoint.
    Executes LLM synthesis if API key is present; otherwise triggers the heuristic engine.
    """
    gemini_key = os.getenv("GEMINI_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")

    # If LLM key configured, attempt model call; fallback safely on failure
    if gemini_key:
        try:
            # Modular Google GenAI SDK execution
            from google import genai
            client = genai.Client(api_key=gemini_key)
            prompt_instruction = (
                f"You are Kivora's AI Campaign Brief Architect. Convert the following campaign idea into a structured JSON "
                f"matching the exact schema with technical camera/generative requirements:\n\nIdea: {req.raw_prompt}\n"
                f"Output strictly valid JSON with fields: title, campaign_objective, target_audience, content_type, "
                f"creative_style_mood, aspect_ratio, resolution_min, deliverables_description, revision_allowance, "
                f"budget_amount, budget_currency, recommended_skills, recommended_tools, commercial_use_requirements, "
                f"usage_channels, usage_duration, usage_territories, restrictions_and_guidelines, disclosure_requirements."
            )
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt_instruction,
                config={'response_mime_type': 'application/json'}
            )
            parsed = json.loads(response.text)
            parsed["generation_engine"] = "LLM_SYNTHESIZER (Gemini)"
            return StructuredBriefOutput(**parsed)
        except Exception:
            # Graceful degrade to heuristic engine without crashing
            pass

    # Standard production fallback
    return extract_heuristic_brief(req)
