"""
Kivora AI Capabilities Router
Exposes the AI-assisted brief builder and Kivo AI Chat concierge endpoints.
"""

import os
import re
import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from backend.app.schemas.schemas import (
    BriefGenerationRequest,
    StructuredBriefOutput,
    KivoChatRequest,
    KivoChatResponse,
)
from backend.app.services.brief_builder import generate_structured_brief

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai", tags=["AI Services"])


@router.post("/generate-brief", response_model=StructuredBriefOutput)
def create_ai_brief(payload: BriefGenerationRequest):
    try:
        return generate_structured_brief(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Brief Generation failed: {str(e)}")


from backend.app.services.kivo_knowledge import (
    retrieve_relevant_knowledge,
    format_grounded_answer,
    get_context_for_prompt,
    get_tailored_suggestions,
)



@router.post("/kivo-chat", response_model=KivoChatResponse)
def chat_with_kivo(payload: KivoChatRequest):
    """
    Kivo AI Chatbot backend endpoint.
    Retrieves grounded project knowledge across Creator, Brand, and Admin Portals.
    Grounds responses in the actual verified Kivora architecture and UI labels.
    """
    query = (payload.message or "").strip()
    if not query:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    query_lower = query.lower()

    # 1. Security & Authorization Guardrails: protect credentials, database schema, and admin actions
    sensitive_patterns = [
        r"\b(password|hash|secret|token|api_key|database|sql\s+inject|admin\s+override)\b",
        r"\b(approve.*without.*audit|bypass.*verification|drop\s+table|delete\s+from)\b",
    ]
    if any(re.search(pat, query_lower) for pat in sensitive_patterns):
        return KivoChatResponse(
            reply=(
                "I cannot disclose internal credentials, access keys, database secrets, or bypass platform verification protocols. "
                "All creator verification claims and administrative decisions require authenticated human review through the Admin Portal."
            ),
            suggestions=[
                "How does an administrator review and approve a verification claim?",
                "How do I upload evidence for creator verification?",
                "What can the Brand Portal do?",
            ],
            generation_engine="SECURITY_GUARDRAIL",
        )

    # 2. Knowledge Base Retrieval: retrieve top relevant articles
    retrieved_articles = retrieve_relevant_knowledge(
        query=query,
        user_role=payload.user_role,
        top_k=2
    )

    top_article = retrieved_articles[0] if retrieved_articles else None
    top_article_id = top_article.get("id") if top_article else None
    tailored_suggestions = get_tailored_suggestions(top_article_id)

    # 3. Attempt Gemini grounded inference if GEMINI_API_KEY is configured
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        try:
            from google import genai
            client = genai.Client(api_key=gemini_key)
            model_name = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")

            knowledge_context = get_context_for_prompt(retrieved_articles)

            system_instruction = (
                "You are Kivo, the friendly, witty, and deeply knowledgeable AI concierge for Kivora.\n"
                "Kivora is an AI-native creative marketplace uniting premier brands with verified generative artists, VFX directors, and 3D animators.\n\n"
                "CRITICAL INSTRUCTIONS:\n"
                "1. Base your answer strictly on the provided KIVORA KNOWLEDGE BASE below.\n"
                "2. Provide clear, step-by-step instructions using the EXACT UI labels, buttons, and navigation tabs from the knowledge base.\n"
                "3. If a user asks about a feature that is not in the knowledge base, honestly state that it is not currently supported rather than fabricating functionality.\n"
                "4. Keep the tone helpful, encouraging, and professional. Use formatting (bullet points, bold text) for readability.\n"
                "5. Never disclose passwords, API tokens, database schemas, or bypass admin authorizations.\n\n"
                f"KIVORA KNOWLEDGE BASE CONTEXT:\n{knowledge_context}\n"
            )

            prompt = f"{system_instruction}\nUser Question: {query}\n\nKivo's Grounded Answer:"
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
            )

            if response and response.text:
                text = response.text.strip()
                return KivoChatResponse(
                    reply=text,
                    suggestions=tailored_suggestions,
                    generation_engine=f"GEMINI ({model_name})",
                )
        except Exception as e:
            logger.warning("Gemini chat execution encountered error, falling back to grounded knowledge engine: %s", e)

    # 4. Deterministic Grounded Knowledge Engine (Zero-Hallucination Fallback)
    if top_article:
        reply_text = format_grounded_answer(top_article, query)
        engine_label = "GROUNDED_KNOWLEDGE_BASE"
    else:
        reply_text = (
            "I'm here to help you navigate Kivora! You can ask me how to create campaign briefs, "
            "how to find creators that match your budget, why chat is locked after submitting a pitch, "
            "how the creator matching score works, or how to submit evidence for verification."
        )
        engine_label = "GROUNDED_AI_ENGINE"

    return KivoChatResponse(
        reply=reply_text,
        suggestions=tailored_suggestions,
        generation_engine=engine_label,
    )

