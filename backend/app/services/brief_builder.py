"""
Kivora AI Brief Builder Service
Transforms raw conversational brand input into structured, editable creative briefs.
Supports modular LLM integration (Gemini / OpenAI) with a robust heuristic fallback engine.
"""

import os
import json
import re
from abc import ABC, abstractmethod
from typing import Optional
import backend.app.core.config  # Ensures .env is loaded
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


class BaseBriefProvider(ABC):
    """Abstract base class for brief generation providers."""
    @abstractmethod
    def generate(self, req: BriefGenerationRequest) -> StructuredBriefOutput:
        pass


class HeuristicFallbackProvider(BaseBriefProvider):
    """Deterministic, domain-aware heuristic generator that operates without external keys."""
    def generate(self, req: BriefGenerationRequest) -> StructuredBriefOutput:
        return extract_heuristic_brief(req)


class GeminiBriefProvider(BaseBriefProvider):
    """Production Google Gemini LLM provider using the modern google.genai SDK."""
    def __init__(self, api_key: str, model_name: str = "gemini-3.8-flash"):
        self.api_key = api_key
        self.model_name = model_name

    def generate(self, req: BriefGenerationRequest) -> StructuredBriefOutput:
        from google import genai
        client = genai.Client(api_key=self.api_key)
        prompt_instruction = (
            f"You are Kivora's AI Campaign Brief Architect. Convert the following campaign concept into a technical, "
            f"production-ready creative brief for generative AI creators.\n\nConcept: {req.raw_prompt}\n"
            f"Target Budget: {req.target_budget or 'Standard commercial rate'}\n\n"
            f"Output strictly valid JSON with fields:\n"
            f"- title (string)\n"
            f"- campaign_objective (string)\n"
            f"- target_audience (string)\n"
            f"- content_type (string: VIDEO, ANIMATION, IMAGE, PRODUCT_VIZ, or CONCEPT_ART)\n"
            f"- creative_style_mood (string)\n"
            f"- aspect_ratio (string: 16:9, 9:16, 1:1, etc.)\n"
            f"- duration_seconds_min (int or null)\n"
            f"- duration_seconds_max (int or null)\n"
            f"- resolution_min (string: 4K UHD or 1080p)\n"
            f"- deliverables_description (string)\n"
            f"- revision_allowance (int, default 2)\n"
            f"- budget_amount (float)\n"
            f"- budget_currency (string: USD)\n"
            f"- recommended_skills (list of skill id strings e.g. skill-4k-video)\n"
            f"- recommended_tools (list of tool id strings e.g. tool-runway-gen3)\n"
            f"- commercial_use_requirements (string)\n"
            f"- usage_channels (string)\n"
            f"- usage_duration (string)\n"
            f"- usage_territories (string)\n"
            f"- restrictions_and_guidelines (string)\n"
            f"- disclosure_requirements (string)"
        )
        response = client.models.generate_content(
            model=self.model_name,
            contents=prompt_instruction,
            config={'response_mime_type': 'application/json'}
        )
        parsed = json.loads(response.text)
        parsed["generation_engine"] = f"GEMINI ({self.model_name})"
        return StructuredBriefOutput(**parsed)


def get_brief_provider(api_key: Optional[str] = None, force_fallback: bool = False) -> BaseBriefProvider:
    """Factory creating the appropriate AI brief provider based on environment and parameters."""
    key = api_key or os.getenv("GEMINI_API_KEY")
    if force_fallback or not key:
        return HeuristicFallbackProvider()
    model = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
    return GeminiBriefProvider(api_key=key, model_name=model)



def generate_structured_brief(req: BriefGenerationRequest) -> StructuredBriefOutput:
    """
    Primary brief builder entrypoint.
    Dispatches to Google Gemini if GEMINI_API_KEY is present;
    safely falls back to the deterministic heuristic engine if key is absent or provider fails.
    """
    gemini_key = os.getenv("GEMINI_API_KEY")

    if gemini_key:
        try:
            provider = get_brief_provider(api_key=gemini_key)
            return provider.generate(req)
        except Exception:
            # Fall back safely without crashing
            pass

    # Clearly labelled deterministic fallback engine
    fallback_provider = HeuristicFallbackProvider()
    return fallback_provider.generate(req)
