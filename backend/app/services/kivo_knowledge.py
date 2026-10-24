"""
Kivora Project Knowledge Retrieval Engine
Grounds Kivo AI Assistant in real, verified application architecture,
UI navigation labels, database models, and platform workflows.
"""

import json
import logging
import os
import re
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

logger = logging.getLogger(__name__)

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "kivora_knowledge_base.json"

_KNOWLEDGE_CACHE: Optional[Dict[str, Any]] = None


def get_knowledge_base() -> Dict[str, Any]:
    global _KNOWLEDGE_CACHE
    if _KNOWLEDGE_CACHE is not None:
        return _KNOWLEDGE_CACHE

    try:
        if DATA_PATH.is_file():
            with open(DATA_PATH, "r", encoding="utf-8") as f:
                _KNOWLEDGE_CACHE = json.load(f)
                return _KNOWLEDGE_CACHE
    except Exception as e:
        logger.error(f"Failed to load Kivora knowledge base from {DATA_PATH}: {e}")

    return {"version": "2.0.0", "articles": []}


def normalize(text: str) -> str:
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r"[^\w\s]", " ", text)
    return " ".join(text.split())


# Direct semantic question mappings for exact canonical user prompts
CANONICAL_QUESTION_MAP = [
    (r"(how\s+.*create.*campaign\s+brief|how\s+.*create.*brief|post.*brief|launch.*brief|ai\s+brief\s+builder)", "brand_create_brief"),
    (r"(match.*budget|find.*creators.*budget|creators.*match.*budget|search.*creators.*budget|budget.*filter)", "brand_discover_creators_budget"),
    (r"(why\s+is\s+chat\s+locked|chat\s+locked.*pitch|locked\s+after.*pitch|unlock.*chat|messaging\s+disabled)", "chat_unlock_conditions"),
    (r"(how\s+does.*matching\s+score\s+work|matching\s+score|match\s+score\s+work|algorithm\s+work|creator\s+matching\s+score)", "creator_matching_score"),
    (r"(how\s+.*upload\s+evidence|evidence.*creator\s+verification|upload\s+evidence.*verification|get\s+verified|verification\s+evidence)", "creator_verification_evidence"),
    (r"(how\s+does\s+an\s+administrator\s+review|admin.*review.*approve.*verification|approve.*verification\s+claim|admin\s+portal\s+workflow|how.*admin.*approve)", "admin_portal_workflow"),
    (r"(how\s+.*submit\s+a\s+deliverable|submit\s+deliverable.*brand|upload\s+deliverable|submit\s+deliverable)", "creator_collaborations_deliverables"),
    (r"(where\s+.*find.*notifications\s+and\s+analytics|where.*notifications|where.*analytics|find.*analytics|find.*notifications)", "creator_brand_notifications_analytics"),
    (r"(what\s+can\s+the\s+brand\s+portal\s+do|brand\s+portal\s+do|brand\s+portal\s+capabilities|brand\s+portal\s+features)", "brand_portal_capabilities"),
    (r"(complete\s+kivora\s+workflow|creator\s+discovery\s+to\s+final\s+delivery|complete\s+workflow|explain.*workflow)", "end_to_end_workflow"),
]


def retrieve_relevant_knowledge(
    query: str,
    user_role: Optional[str] = None,
    top_k: int = 2
) -> List[Dict[str, Any]]:
    """
    Retrieves the most relevant knowledge articles for a user query.
    Combines canonical intent mapping with token overlap scoring.
    """
    kb = get_knowledge_base()
    articles: List[Dict[str, Any]] = kb.get("articles", [])
    if not articles:
        return []

    norm_query = normalize(query)

    # 1. Check canonical intent patterns first
    for pattern, target_id in CANONICAL_QUESTION_MAP:
        if re.search(pattern, norm_query, re.IGNORECASE):
            for art in articles:
                if art.get("id") == target_id:
                    # Return target article first, plus any related article
                    results = [art]
                    rel_ids = art.get("related_topics", [])
                    for r_id in rel_ids:
                        for r_art in articles:
                            if r_art.get("id") == r_id and r_art not in results:
                                results.append(r_art)
                                break
                    return results[:top_k]

    # 2. Token overlap and keyword relevance scoring
    query_tokens = set(norm_query.split())
    scored: List[Tuple[float, Dict[str, Any]]] = []

    for art in articles:
        score = 0.0
        art_id = art.get("id", "")
        keywords = art.get("keywords", [])
        title = art.get("title", "")
        summary = art.get("summary", "")
        steps_text = " ".join(art.get("ui_steps", []))

        # Direct keyword phrase match
        for kw in keywords:
            norm_kw = normalize(kw)
            if norm_kw in norm_query:
                score += 15.0
            kw_tokens = set(norm_kw.split())
            if kw_tokens.issubset(query_tokens):
                score += 8.0

        # Title word overlap
        title_tokens = set(normalize(title).split())
        title_overlap = query_tokens.intersection(title_tokens)
        score += len(title_overlap) * 3.5

        # Summary and steps overlap
        body_tokens = set(normalize(summary + " " + steps_text).split())
        body_overlap = query_tokens.intersection(body_tokens)
        score += len(body_overlap) * 0.5

        # Role affinity bonus
        cat = art.get("category", "")
        if user_role and user_role.upper() in cat.upper():
            score += 1.5

        if score > 0:
            scored.append((score, art))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [art for _, art in scored[:top_k]]


def format_grounded_answer(article: Dict[str, Any], query: str) -> str:
    """
    Formats an authoritative, step-by-step Markdown response directly grounded in the verified article.
    Used for instant, guaranteed-accurate responses and offline fallback.
    """
    title = article.get("title", "Kivora Guide")
    summary = article.get("summary", "")
    ui_steps = article.get("ui_steps", [])

    lines = []
    lines.append(f"**{title}**\n")
    if summary:
        lines.append(f"{summary}\n")

    if ui_steps:
        lines.append("**Step-by-step Instructions:**")
        for step in ui_steps:
            lines.append(step)

    return "\n".join(lines)


def get_context_for_prompt(articles: List[Dict[str, Any]]) -> str:
    """Formats retrieved articles into a grounded context string for Gemini."""
    if not articles:
        return "No specific knowledge base article matched."

    context_blocks = []
    for art in articles:
        title = art.get("title", "")
        cat = art.get("category", "")
        summary = art.get("summary", "")
        steps = "\n".join(art.get("ui_steps", []))
        features = ", ".join(art.get("supported_features", []))

        block = f"--- KNOWLEDGE BASE ENTRY: {title} (Category: {cat}) ---\nSummary: {summary}\nFeatures: {features}\nUI Steps & Details:\n{steps}\n"
        context_blocks.append(block)

    return "\n".join(context_blocks)


def get_tailored_suggestions(article_id: Optional[str]) -> List[str]:
    """Returns curated follow-up prompts based on the matched topic."""
    suggestions_map = {
        "brand_create_brief": [
            "How can I find creators that match my budget?",
            "How does the AI Brief Builder generate deliverables?",
            "What happens after I publish a campaign brief?",
        ],
        "brand_discover_creators_budget": [
            "How do I create a campaign brief?",
            "How does the creator matching score work?",
            "What is the difference between Verified Pro and Top Studio?",
        ],
        "chat_unlock_conditions": [
            "How do I submit a pitch to a brief?",
            "How do brands review and accept proposals?",
            "How does milestone escrow protect payments?",
        ],
        "creator_matching_score": [
            "How do I upload evidence for creator verification?",
            "Why is chat locked after I submit a pitch?",
            "How can I improve my matching score for briefs?",
        ],
        "creator_verification_evidence": [
            "How does an administrator review and approve a verification claim?",
            "What types of ComfyUI or VFX proof are accepted?",
            "How does verification boost my creator matching score?",
        ],
        "admin_portal_workflow": [
            "How does the Gemini AI audit analyze verification evidence?",
            "What metrics are displayed on the Admin Dashboard?",
            "How do creators submit evidence for verification?",
        ],
        "creator_collaborations_deliverables": [
            "How does milestone escrow release payment upon approval?",
            "What happens if a brand requests a revision?",
            "Where can I find my notifications and analytics?",
        ],
        "creator_brand_notifications_analytics": [
            "What can the Brand Portal do?",
            "How do I submit a deliverable to a brand?",
            "Where do I manage my creator starting rate and bio?",
        ],
        "brand_portal_capabilities": [
            "How do I create a campaign brief?",
            "How can I find creators that match my budget?",
            "Explain the complete Kivora workflow from creator discovery to final delivery.",
        ],
        "end_to_end_workflow": [
            "How do I create a campaign brief?",
            "How does the creator matching score work?",
            "How does milestone escrow protect both parties?",
        ],
    }

    if article_id and article_id in suggestions_map:
        return suggestions_map[article_id]

    return [
        "How do I create a campaign brief?",
        "How can I find creators that match my budget?",
        "Why is chat locked after I submit a pitch?",
        "How does the creator matching score work?",
    ]
