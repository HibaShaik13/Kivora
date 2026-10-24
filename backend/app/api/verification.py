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
from sqlalchemy.exc import OperationalError

from backend.app.database import get_db
from backend.app.models.models import (
    User,
    CreatorProfile,
    PortfolioProject,
    EvidenceRecord,
    VerificationRecord,
    VerificationAiAnalysis,
    CreatorTool,
    Notification,
)
from backend.app.schemas.schemas import (
    VerificationRecordRead,
    VerificationRecordDetailRead,
    VerificationRequestCreate,
    VerificationReviewRequest,
    AIEvidenceAnalysisRead,
    InconsistencyFlag,
    CreatorApprovalUpdateRequest,
    CreatorApprovalDetailRead,
)
from backend.app.core.deps import require_role, get_current_verified_user
from backend.app.services.verification_analyzer import analyze_and_persist_verification
from backend.app.services.email_service import send_creator_approval_email, send_creator_rejection_email

logger = logging.getLogger("verification_router")

router = APIRouter(prefix="/api/verification", tags=["Verification"])


def format_ai_analysis(a: Optional[VerificationAiAnalysis]) -> Optional[AIEvidenceAnalysisRead]:
    if not a:
        return None

    inconsistencies = []
    for item in (a.potential_inconsistencies or []):
        if isinstance(item, InconsistencyFlag):
            inconsistencies.append(item)
        elif isinstance(item, dict):
            reason = item.get("reason") or item.get("issue") or item.get("flag") or "Flagged inconsistency"
            supp = item.get("supporting_info") or item.get("details") or item.get("frame_range") or "Template match detected"
            inconsistencies.append(InconsistencyFlag(reason=str(reason), supporting_info=str(supp)))
        elif isinstance(item, str):
            inconsistencies.append(InconsistencyFlag(reason=item, supporting_info="Analysis observation"))

    return AIEvidenceAnalysisRead(
        id=a.id,
        verification_id=a.verification_id,
        summary=a.summary,
        evidence_items_detected=a.evidence_items_detected or [],
        missing_evidence=a.missing_evidence or [],
        potential_inconsistencies=inconsistencies,
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


# ==========================================
# CREATOR ACCOUNT APPROVAL GOVERNANCE (PHASE 2)
# ==========================================

@router.get("/admin/creators", response_model=List[CreatorApprovalDetailRead])
@router.get("/admin/creators/approval-queue", response_model=List[CreatorApprovalDetailRead])
def list_creators_admin(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by approval status: PENDING, APPROVED, REJECTED, LEGACY_ACTIVE"),
    current_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """
    Administrative endpoint to inspect creator accounts and their approval status.
    Enforces ADMIN role requirement; creators and brands are denied access.
    Supports both /api/verification/admin/creators and /api/verification/admin/creators/approval-queue.
    """
    creators = db.query(CreatorProfile).all()
    results = []
    for c in creators:
        status_val = getattr(c, "approval_status", "PENDING")
        if status_filter and status_val.upper() != status_filter.upper().strip():
            continue

        p_count = len(c.portfolio_projects) if c.portfolio_projects else 0
        e_count = sum(len(p.evidence_records) for p in c.portfolio_projects) if c.portfolio_projects else 0

        # Check for latest decision / submission notifications
        reviewer_notes = None
        reviewed_at = None
        submitted_at = None

        if c.user_id:
            notifs = db.query(Notification).filter(
                Notification.user_id == c.user_id
            ).order_by(Notification.created_at.desc()).all()

            for n in notifs:
                if not reviewer_notes and n.type in ("CREATOR_APPROVAL", "CREATOR_REJECTION", "CREATOR_LEGACY_ACTIVE"):
                    reviewer_notes = n.message
                    reviewed_at = n.created_at
                if not submitted_at and n.type == "CREATOR_PROFILE_SUBMITTED":
                    submitted_at = n.created_at

        if not submitted_at:
            submitted_at = c.created_at

        results.append(
            CreatorApprovalDetailRead(
                creator_id=c.id,
                user_id=c.user_id,
                display_name=c.display_name,
                handle=c.handle,
                approval_status=status_val,
                verification_tier=c.verification_tier,
                is_email_verified=c.user.is_email_verified if c.user else False,
                portfolio_count=p_count,
                evidence_count=e_count,
                reviewed_by=None,
                reviewer_notes=reviewer_notes,
                reviewed_at=reviewed_at,
                avatar_url=c.avatar_url,
                primary_specialization=c.primary_specialization,
                bio=c.bio,
                location=c.location,
                submitted_at=submitted_at,
            )
        )
    return results


@router.patch("/admin/creators/{creator_id}/approval", response_model=CreatorApprovalDetailRead)
def review_creator_approval_admin(
    creator_id: str,
    payload: CreatorApprovalUpdateRequest,
    current_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """
    Administrative endpoint to approve, reject, or reset a creator account's approval status.
    Requires ADMIN role.
    """
    creator = db.query(CreatorProfile).filter(
        or_(CreatorProfile.id == creator_id, CreatorProfile.handle == creator_id)
    ).first()
    if not creator:
        raise HTTPException(status_code=404, detail="Creator profile not found.")

    new_status = payload.approval_status.upper().strip()
    if new_status not in ["APPROVED", "REJECTED", "PENDING", "LEGACY_ACTIVE"]:
        raise HTTPException(
            status_code=400,
            detail="Approval status must be either 'PENDING', 'APPROVED', 'REJECTED', or 'LEGACY_ACTIVE'."
        )

    if new_status == "REJECTED":
        if not payload.reviewer_notes or not payload.reviewer_notes.strip():
            raise HTTPException(
                status_code=400,
                detail="A meaningful rejection reason is required when rejecting a creator profile."
            )

    try:
        creator.approval_status = new_status
        creator.updated_at = datetime.utcnow()

        # Create audit and creator-facing notification
        notes = (payload.reviewer_notes or "").strip()
        if new_status == "APPROVED":
            db.add(Notification(
                id=f"notif-{uuid.uuid4().hex[:12]}",
                user_id=creator.user_id,
                type="CREATOR_APPROVAL",
                title="Creator Profile Approved! 🎉",
                message=notes or "Congratulations! Your creator profile has been approved. You now have full access to Kivora briefs, applications, and messaging.",
                created_at=datetime.utcnow()
            ))
        elif new_status == "LEGACY_ACTIVE":
            db.add(Notification(
                id=f"notif-{uuid.uuid4().hex[:12]}",
                user_id=creator.user_id,
                type="CREATOR_APPROVAL",
                title="Creator Account Grandfathered",
                message=notes or "Your creator account has been preserved with legacy active access.",
                created_at=datetime.utcnow()
            ))
        elif new_status == "REJECTED":
            db.add(Notification(
                id=f"notif-{uuid.uuid4().hex[:12]}",
                user_id=creator.user_id,
                type="CREATOR_REJECTION",
                title="Creator Profile Requires Updates",
                message=notes,
                created_at=datetime.utcnow()
            ))
        elif new_status == "PENDING":
            db.add(Notification(
                id=f"notif-{uuid.uuid4().hex[:12]}",
                user_id=creator.user_id,
                type="CREATOR_PROFILE_SUBMITTED",
                title="Creator Profile Reset to Pending",
                message=notes or "Creator profile has been reset to pending review.",
                created_at=datetime.utcnow()
            ))

        db.commit()
        db.refresh(creator)
    except OperationalError as oe:
        db.rollback()
        logger.error(f"Cannot update creator approval status: schema error: {oe}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database schema error: 'approval_status' column does not exist on table 'creator_profiles'. Pending database migration '8f2c3b4a5d6e' must be executed first."
        )

    # Automatically dispatch transactional notification email
    creator_email = creator.user.email if creator.user else None
    if creator_email:
        try:
            if new_status == "APPROVED":
                send_creator_approval_email(creator_email, creator.display_name)
            elif new_status == "REJECTED":
                send_creator_rejection_email(creator_email, creator.display_name, notes)
        except Exception as email_err:
            logger.warning(f"Failed to dispatch approval/rejection email to {creator_email}: {email_err}")

    p_count = len(creator.portfolio_projects) if creator.portfolio_projects else 0
    e_count = sum(len(p.evidence_records) for p in creator.portfolio_projects) if creator.portfolio_projects else 0

    return CreatorApprovalDetailRead(
        creator_id=creator.id,
        user_id=creator.user_id,
        display_name=creator.display_name,
        handle=creator.handle,
        approval_status=creator.approval_status,
        verification_tier=creator.verification_tier,
        is_email_verified=creator.user.is_email_verified if creator.user else False,
        portfolio_count=p_count,
        evidence_count=e_count,
        reviewed_by=current_user.email,
        reviewer_notes=payload.reviewer_notes,
        reviewed_at=datetime.utcnow(),
    )


@router.post("/creator/submit-for-review")
def submit_creator_profile_for_review(
    current_user: User = Depends(require_role(["CREATOR"])),
    db: Session = Depends(get_db)
):
    """
    Authenticated creator submits their profile and portfolio for administrative review.
    Validates required profile fields and ensures at least one portfolio project exists.
    """
    creator = current_user.creator_profile
    if not creator:
        raise HTTPException(
            status_code=400,
            detail="Creator profile not initialized. Please complete profile setup first."
        )

    # 1. Validate required identity & bio
    if not creator.display_name or not creator.display_name.strip():
        raise HTTPException(status_code=400, detail="Display name is required before submitting your profile.")
    if not creator.bio or len(creator.bio.strip()) < 15:
        raise HTTPException(
            status_code=400,
            detail="A professional bio of at least 15 characters is required before submission."
        )
    if not creator.primary_specialization or not creator.primary_specialization.strip():
        raise HTTPException(status_code=400, detail="Primary specialization is required before submission.")

    # 2. Validate portfolio requirement: at least 1 published portfolio project
    portfolio_count = len(creator.portfolio_projects) if creator.portfolio_projects else 0
    if portfolio_count < 1:
        raise HTTPException(
            status_code=400,
            detail="At least one portfolio project is required before submitting your creator profile for review."
        )

    # 3. Idempotent check: if already approved or legacy active, do not force back to pending
    if creator.approval_status in ("APPROVED", "LEGACY_ACTIVE"):
        return {
            "status": "success",
            "message": "Creator profile is already approved for marketplace participation.",
            "creator_id": creator.id,
            "approval_status": creator.approval_status,
            "is_submitted": True,
            "submitted_at": creator.created_at.isoformat() if creator.created_at else None,
            "portfolio_count": portfolio_count,
        }

    # 4. Idempotent check: if already pending and previously submitted
    existing_sub = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.type == "CREATOR_PROFILE_SUBMITTED"
    ).order_by(Notification.created_at.desc()).first()

    if creator.approval_status == "PENDING" and existing_sub:
        creator.updated_at = datetime.utcnow()
        try:
            db.commit()
            db.refresh(creator)
        except OperationalError as oe:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database schema error: 'approval_status' column does not exist on table 'creator_profiles'. Pending database migration '8f2c3b4a5d6e' must be executed first."
            )
        return {
            "status": "success",
            "message": "Creator profile submission confirmed (already pending review).",
            "creator_id": creator.id,
            "approval_status": "PENDING",
            "is_submitted": True,
            "submitted_at": existing_sub.created_at.isoformat(),
            "portfolio_count": portfolio_count,
        }

    # 5. Transition status to PENDING (initial submission or resubmission after REJECTED)
    try:
        creator.approval_status = "PENDING"
        creator.updated_at = datetime.utcnow()

        # Record submission notification for durable state tracking
        sub_notif = Notification(
            id=f"notif-{uuid.uuid4().hex[:12]}",
            user_id=current_user.id,
            type="CREATOR_PROFILE_SUBMITTED",
            title="Creator Profile Submitted",
            message="Your creator profile and portfolio have been submitted for administrator review.",
            created_at=datetime.utcnow()
        )
        db.add(sub_notif)
        db.commit()
        db.refresh(creator)
    except OperationalError as oe:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database schema error: 'approval_status' column does not exist on table 'creator_profiles'. Pending database migration '8f2c3b4a5d6e' must be executed first."
        )

    return {
        "status": "success",
        "message": "Creator profile submitted for review.",
        "creator_id": creator.id,
        "approval_status": "PENDING",
        "is_submitted": True,
        "submitted_at": sub_notif.created_at.isoformat(),
        "portfolio_count": portfolio_count,
    }


@router.get("/my-approval-status")
def get_my_creator_approval_status(
    current_user: User = Depends(require_role(["CREATOR"])),
    db: Session = Depends(get_db)
):
    """
    Authenticated creator checks their own account approval status.
    Permitted for all creators (including PENDING and REJECTED) so they can check status.
    """
    creator = current_user.creator_profile
    if not creator:
        raise HTTPException(
            status_code=404,
            detail="Creator profile not yet initialized. Please complete profile setup."
        )

    portfolio_count = len(creator.portfolio_projects) if creator.portfolio_projects else 0
    approval_status = getattr(creator, "approval_status", "PENDING")

    has_bio = bool(creator.bio and len(creator.bio.strip()) >= 15)
    has_display_name = bool(creator.display_name and creator.display_name.strip())
    is_profile_complete = bool(has_display_name and has_bio and portfolio_count > 0)

    # Check for submission notification
    sub_notif = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.type == "CREATOR_PROFILE_SUBMITTED"
    ).order_by(Notification.created_at.desc()).first()

    if sub_notif:
        is_submitted = True
        submitted_at = sub_notif.created_at.isoformat()
    elif approval_status in ("APPROVED", "LEGACY_ACTIVE"):
        is_submitted = True
        submitted_at = creator.created_at.isoformat() if creator.created_at else None
    elif is_profile_complete or portfolio_count > 0:
        # Existing creator with complete profile or portfolio projects is considered submitted
        is_submitted = True
        submitted_at = creator.updated_at.isoformat() if creator.updated_at else None
    else:
        is_submitted = False
        submitted_at = None

    # Check for latest rejection notification
    rej_notif = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.type == "CREATOR_REJECTION"
    ).order_by(Notification.created_at.desc()).first()
    rejection_reason = rej_notif.message if (rej_notif and approval_status == "REJECTED") else None

    can_access = approval_status in ("APPROVED", "LEGACY_ACTIVE")

    if approval_status == "APPROVED":
        msg = "Your creator account is approved for full marketplace participation."
    elif approval_status == "LEGACY_ACTIVE":
        msg = "Your creator account has grandfathered legacy active access for marketplace participation."
    elif approval_status == "PENDING":
        msg = "Your creator account approval is pending administrator review."
    else:
        msg = "Your creator account was not approved. Please review the feedback, update your portfolio, and resubmit."

    return {
        "creator_id": creator.id,
        "is_email_verified": current_user.is_email_verified,
        "has_profile": True,
        "is_profile_complete": is_profile_complete,
        "approval_status": approval_status,
        "verification_tier": creator.verification_tier,
        "portfolio_count": portfolio_count,
        "is_submitted": is_submitted,
        "submitted_at": submitted_at,
        "rejection_reason": rejection_reason,
        "can_access_creator_features": can_access,
        "message": msg,
    }



