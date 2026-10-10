"""
Kivora Verification & Evidence Audit Router
Supports creator verification requests with process evidence, distinguishes self-declared
claims from audited verification, and enforces strict admin-only approval/rejection.
"""

import uuid
from datetime import datetime
from typing import List, Optional
import logging
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.app.database import get_db
from backend.app.models.models import (
    User,
    CreatorProfile,
    PortfolioProject,
    EvidenceRecord,
    VerificationRecord,
    VerificationAiAnalysis,
    CreatorTool,
)
from backend.app.schemas.schemas import (
    VerificationRecordRead,
    VerificationRecordDetailRead,
    VerificationRequestCreate,
    VerificationReviewRequest,
    AIEvidenceAnalysisRead,
)
from backend.app.core.deps import require_role, get_current_verified_user
from backend.app.services.verification_analyzer import analyze_and_persist_verification

logger = logging.getLogger("verification_router")

router = APIRouter(prefix="/api/verification", tags=["Verification"])


def format_ai_analysis(a: Optional[VerificationAiAnalysis]) -> Optional[AIEvidenceAnalysisRead]:
    if not a:
        return None
    return AIEvidenceAnalysisRead(
        id=a.id,
        verification_id=a.verification_id,
        summary=a.summary,
        evidence_items_detected=a.evidence_items_detected or [],
        missing_evidence=a.missing_evidence or [],
        potential_inconsistencies=a.potential_inconsistencies or [],
        limitations=a.limitations or [],
        analysis_status=a.analysis_status,
        disclaimer=a.disclaimer,
        model_name=a.model_name,
        analyzed_at=a.analyzed_at,
    )


def format_verification_detail(v: VerificationRecord) -> VerificationRecordDetailRead:
    evidence = v.evidence
    project = evidence.project if evidence else None
    creator = project.creator if project else None

    return VerificationRecordDetailRead(
        id=v.id,
        target_type=v.target_type,
        target_id=v.target_id,
        verification_scope=v.verification_scope,
        status=v.status,
        reviewed_by=v.reviewed_by,
        reviewer_notes=v.reviewer_notes,
        reviewed_at=v.reviewed_at,
        evidence_id=v.evidence_id,
        evidence_title=evidence.title if evidence else None,
        evidence_file_url=evidence.file_url if evidence else None,
        evidence_type=evidence.evidence_type if evidence else None,
        project_id=project.id if project else None,
        project_title=project.title if project else None,
        creator_id=creator.id if creator else None,
        creator_name=creator.display_name if creator else None,
        creator_handle=creator.handle if creator else None,
        ai_analysis=format_ai_analysis(v.ai_analysis),
    )


@router.post("/request", response_model=VerificationRecordRead, status_code=status.HTTP_201_CREATED)
def submit_verification_request(
    payload: VerificationRequestCreate,
    current_user: User = Depends(require_role(["CREATOR"])),
    db: Session = Depends(get_db)
):
    """
    Authenticated creator submits an evidence record for verification review.
    Ownership is strictly enforced—creators can only verify their own work.
    """
    creator = current_user.creator_profile
    if not creator:
        raise HTTPException(
            status_code=400,
            detail="Creator profile not yet configured. Please set up your profile first."
        )

    # 1. Locate evidence and ensure creator ownership
    evidence = db.query(EvidenceRecord).filter(EvidenceRecord.id == payload.evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence record not found.")

    if not evidence.project or evidence.project.creator_id != creator.id:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Cannot request verification using evidence from another creator's project."
        )

    # 2. Check target validity if targeting CREATOR_TOOL
    if payload.target_type == "CREATOR_TOOL":
        has_tool = db.query(CreatorTool).filter(
            CreatorTool.creator_id == creator.id,
            CreatorTool.tool_id == payload.target_id
        ).first()
        if not has_tool:
            raise HTTPException(
                status_code=400,
                detail=f"Target tool '{payload.target_id}' is not linked to your creator profile."
            )

    # 3. Check existing verification record
    existing_ver = db.query(VerificationRecord).filter(
        VerificationRecord.evidence_id == evidence.id
    ).first()

    if existing_ver:
        if existing_ver.status == "PENDING":
            raise HTTPException(
                status_code=400,
                detail="A verification request for this evidence is already pending administrative review."
            )
        elif existing_ver.status == "APPROVED":
            raise HTTPException(
                status_code=400,
                detail="This evidence record has already been audited and approved."
            )
        else:
            # Re-submit previously rejected record
            existing_ver.target_type = payload.target_type
            existing_ver.target_id = payload.target_id
            existing_ver.verification_scope = payload.verification_scope
            existing_ver.status = "PENDING"
            existing_ver.reviewed_by = "PENDING_AUDIT"
            existing_ver.reviewer_notes = "Resubmitted by creator for administrative audit."
            existing_ver.reviewed_at = datetime.utcnow()
            db.commit()
            db.refresh(existing_ver)
            return existing_ver

    # 4. Create new pending verification record
    ver_id = f"ver-{uuid.uuid4().hex[:10]}"
    verification = VerificationRecord(
        id=ver_id,
        evidence_id=evidence.id,
        target_type=payload.target_type,
        target_id=payload.target_id,
        verification_scope=payload.verification_scope,
        status="PENDING",
        reviewed_by="PENDING_AUDIT",
        reviewer_notes="Submitted by creator for administrative audit.",
        reviewed_at=datetime.utcnow()
    )
    db.add(verification)
    db.commit()
    db.refresh(verification)
    return verification


@router.get("/my-requests", response_model=List[VerificationRecordDetailRead])
def list_my_verification_requests(
    current_user: User = Depends(require_role(["CREATOR"])),
    db: Session = Depends(get_db)
):
    """Authenticated creator lists all verification records attached to their projects."""
    creator = current_user.creator_profile
    if not creator:
        return []

    records = db.query(VerificationRecord).join(EvidenceRecord).join(PortfolioProject).filter(
        PortfolioProject.creator_id == creator.id
    ).order_by(VerificationRecord.reviewed_at.desc()).all()

    return [format_verification_detail(r) for r in records]


@router.get("/requests", response_model=List[VerificationRecordDetailRead])
def list_verification_requests_admin(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status: PENDING, APPROVED, REJECTED"),
    current_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """
    Administrative endpoint to inspect submitted verification requests.
    Enforces ADMIN role requirement; creators and brands are denied access.
    """
    query = db.query(VerificationRecord).join(EvidenceRecord).join(PortfolioProject)

    if status_filter:
        query = query.filter(VerificationRecord.status == status_filter.upper())

    records = query.order_by(VerificationRecord.reviewed_at.desc()).all()
    return [format_verification_detail(r) for r in records]


@router.patch("/requests/{verification_id}", response_model=VerificationRecordDetailRead)
def review_verification_request_admin(
    verification_id: str,
    payload: VerificationReviewRequest,
    current_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """
    Administrative endpoint to approve or reject verification requests.
    Creators cannot verify themselves. Validates target and updates creator verification tier.
    """
    ver = db.query(VerificationRecord).filter(VerificationRecord.id == verification_id).first()
    if not ver:
        raise HTTPException(status_code=404, detail="Verification record not found.")

    new_status = payload.status.upper().strip()
    if new_status not in ["APPROVED", "REJECTED"]:
        raise HTTPException(
            status_code=400,
            detail="Review status must be either 'APPROVED' or 'REJECTED'."
        )

    ver.status = new_status
    ver.reviewed_by = current_user.email
    ver.reviewer_notes = payload.reviewer_notes
    ver.reviewed_at = datetime.utcnow()
    db.flush()

    # Apply consequences to creator's verified claims & taxonomy
    evidence = ver.evidence
    creator = evidence.project.creator if (evidence and evidence.project) else None

    if creator:
        if ver.target_type == "CREATOR_TOOL":
            ct = db.query(CreatorTool).filter(
                CreatorTool.creator_id == creator.id,
                CreatorTool.tool_id == ver.target_id
            ).first()
            if ct:
                ct.is_claim_verified = (new_status == "APPROVED")

        # Recalculate verified claims count
        approved_count = db.query(VerificationRecord).join(
            EvidenceRecord, VerificationRecord.evidence_id == EvidenceRecord.id
        ).join(
            PortfolioProject, EvidenceRecord.project_id == PortfolioProject.id
        ).filter(
            PortfolioProject.creator_id == creator.id,
            VerificationRecord.status == "APPROVED"
        ).count()

        creator.verified_claims_count = approved_count

        # Promote tier according to evaluation rubric
        if approved_count >= 5:
            creator.verification_tier = "TOP_STUDIO"
        elif approved_count >= 2:
            creator.verification_tier = "VERIFIED_PRO"
        else:
            creator.verification_tier = "COMMUNITY"

    db.commit()
    db.refresh(ver)
    return format_verification_detail(ver)


@router.post("/requests/{verification_id}/analyze", response_model=AIEvidenceAnalysisRead, status_code=status.HTTP_200_OK)
def trigger_verification_analysis(
    verification_id: str,
    current_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """
    Authorized reviewer triggers Gemini-assisted verification analysis.
    Executes evidence summarization, deterministic missing-evidence detection,
    and inconsistency flagging. Persists the analysis without changing verification status.
    """
    ver = db.query(VerificationRecord).filter(VerificationRecord.id == verification_id).first()
    if not ver:
        raise HTTPException(
            status_code=404,
            detail="Verification request not found."
        )

    try:
        analysis = analyze_and_persist_verification(db, verification_id)
        return format_ai_analysis(analysis)
    except Exception as e:
        logger.error(f"Error during verification analysis: {e}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while generating the verification analysis."
        )


@router.get("/requests/{verification_id}/ai-analysis", response_model=AIEvidenceAnalysisRead, status_code=status.HTTP_200_OK)
def get_verification_ai_analysis(
    verification_id: str,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve stored AI verification analysis.
    Accessible to authorized reviewers (ADMIN) and the owning creator.
    Cross-creator access is forbidden (403).
    """
    ver = db.query(VerificationRecord).filter(VerificationRecord.id == verification_id).first()
    if not ver:
        raise HTTPException(
            status_code=404,
            detail="Verification request not found."
        )

    # Authorization enforcement
    if current_user.role != "ADMIN":
        if current_user.role == "CREATOR":
            evidence = ver.evidence
            project = evidence.project if evidence else None
            creator_profile = current_user.creator_profile
            if not project or not creator_profile or project.creator_id != creator_profile.id:
                raise HTTPException(
                    status_code=403,
                    detail="Forbidden: Cannot access another creator's verification analysis."
                )
        else:
            raise HTTPException(
                status_code=403,
                detail="Forbidden: Unauthorized role for verification records."
            )

    if not ver.ai_analysis:
        raise HTTPException(
            status_code=404,
            detail="No AI analysis found for this verification request. Please run analysis first."
        )

    return format_ai_analysis(ver.ai_analysis)

