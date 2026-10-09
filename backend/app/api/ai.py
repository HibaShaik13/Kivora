"""
Kivora AI Capabilities Router
Exposes the AI-assisted brief builder endpoint.
"""

from fastapi import APIRouter, HTTPException
from backend.app.schemas.schemas import BriefGenerationRequest, StructuredBriefOutput
from backend.app.services.brief_builder import generate_structured_brief

router = APIRouter(prefix="/api/ai", tags=["AI Services"])


@router.post("/generate-brief", response_model=StructuredBriefOutput)
def create_ai_brief(payload: BriefGenerationRequest):
    try:
        return generate_structured_brief(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Brief Generation failed: {str(e)}")
