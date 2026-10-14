"""
Kivora Collaboration Workspace, Milestones, Deliverable Versioning & History Service
Enforces strict participant access, append-only timeline events, version immutability,
progress calculation, and role-scoped collaboration history.
"""

import os
import uuid
import hashlib
from datetime import datetime, timedelta
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, or_, and_
from fastapi import HTTPException, status

from backend.app.models.models import (
    User,
    CreatorProfile,
    BrandProfile,
    Brief,
    Engagement,
    EngagementDeliverable,
    EngagementMilestone,
    EngagementEvent,
    EngagementReview,
    Conversation,
)
from backend.app.schemas.schemas import (
    MilestoneCreate,
    MilestoneUpdate,
    DeliverableSubmissionCreate,
    RevisionRequestCreate,
    ReviewCreate,
    DeliverableVersionCompareResponse,
)
from backend.app.services.notification_service import NotificationService


class CollaborationService:

    @staticmethod
    def verify_participant(engagement: Engagement, user: User) -> str:
        """
        Verifies that user is an authorized participant in the engagement.
        Returns the user's role in this collaboration: 'CREATOR', 'BRAND', or 'ADMIN'.
        Raises 403 or 404 if unauthorized.
        """
        if user.role == "ADMIN":
            return "ADMIN"

        if user.role == "CREATOR":
            if not user.creator_profile or user.creator_profile.id != engagement.creator_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Forbidden: You are not the assigned creator for this collaboration.",
                )
            return "CREATOR"

        if user.role == "BRAND":
            brand_id = engagement.brief.brand_id if engagement.brief else None
            if not user.brand_profile or user.brand_profile.id != brand_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Forbidden: You are not the brand that owns this campaign collaboration.",
                )
            return "BRAND"

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Unauthorized collaboration access.",
        )

    @staticmethod
    def record_event(
        db: Session,
        engagement_id: str,
        event_type: str,
        actor_id: str,
        actor_role: str,
        title: str,
        description: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> EngagementEvent:
        """Records an append-only timeline event for the collaboration."""
        event = EngagementEvent(
            id=f"evt-{uuid.uuid4().hex[:10]}",
            engagement_id=engagement_id,
            event_type=event_type,
            actor_id=actor_id,
            actor_role=actor_role,
            title=title,
            description=description,
            event_metadata=metadata,
            created_at=datetime.utcnow(),
        )
        db.add(event)
        return event

    @staticmethod
    def calculate_progress(engagement: Engagement) -> Tuple[int, str, Dict[str, str]]:
        """
        Derives meaningful progress from real milestones and deliverable states.
        Formula:
        - If custom milestones exist:
          weighted_milestone_pct (60%) + deliverable_state_pct (40%)
        - If no custom milestones exist:
          derived from engagement status and latest deliverable version.
        Returns: (progress_percentage, current_milestone_title, next_required_action_dict)
        """
        status_val = engagement.status.upper()
        milestones = engagement.milestones or []
        deliverables = engagement.deliverables or []
        has_delivs = len(deliverables) > 0
        latest_deliv = sorted(deliverables, key=lambda d: d.version)[-1] if has_delivs else None

        # 1. Base progress calculation
        if milestones:
            total_m = len(milestones)
            completed_m = len([m for m in milestones if m.status == "COMPLETED"])
            in_prog_m = len([m for m in milestones if m.status == "IN_PROGRESS"])
            milestone_ratio = (completed_m + 0.5 * in_prog_m) / total_m
            m_pct = milestone_ratio * 60.0

            if status_val == "COMPLETED":
                d_pct = 40.0
            elif status_val == "FINAL_APPROVED":
                d_pct = 35.0
            elif status_val in ["DRAFT_SUBMITTED", "REVISION_REQUESTED"]:
                d_pct = 20.0
            elif status_val == "KICKOFF":
                d_pct = 10.0
            else:
                d_pct = 5.0

            progress = min(100, int(m_pct + d_pct))
            # Ensure 100% only when truly completed
            if status_val != "COMPLETED" and progress >= 100:
                progress = 95
            elif status_val == "COMPLETED":
                progress = 100
        else:
            # Derived from lifecycle states
            if status_val == "KICKOFF":
                progress = 20
            elif status_val == "DRAFT_SUBMITTED":
                v = latest_deliv.version if latest_deliv else 1
                progress = 50 if v == 1 else 75
            elif status_val == "REVISION_REQUESTED":
                progress = 55
            elif status_val == "FINAL_APPROVED":
                progress = 90
            elif status_val == "COMPLETED":
                progress = 100
            elif status_val == "DISPUTED":
                progress = 30
            else:
                progress = 15

        # 2. Current milestone title
        if milestones:
            in_prog = next((m for m in milestones if m.status == "IN_PROGRESS"), None)
            if in_prog:
                current_title = in_prog.title
            else:
                next_pending = next((m for m in sorted(milestones, key=lambda m: m.sequence_order) if m.status == "PENDING"), None)
                current_title = next_pending.title if next_pending else ("All Milestones Completed" if status_val in ["FINAL_APPROVED", "COMPLETED"] else "Milestones Pending")
        else:
            if status_val == "KICKOFF":
                current_title = "Initial Draft Production"
            elif status_val == "DRAFT_SUBMITTED":
                current_title = f"Brand Review (Deliverable v{latest_deliv.version if latest_deliv else 1})"
            elif status_val == "REVISION_REQUESTED":
                current_title = f"Revision Round (Addressing Feedback for v{latest_deliv.version if latest_deliv else 1})"
            elif status_val == "FINAL_APPROVED":
                current_title = "Commercial Sign-off & Completion"
            elif status_val == "COMPLETED":
                current_title = "Project Completed & Verified"
            else:
                current_title = "Collaboration Active"

        # 3. Next action per role
        if status_val == "KICKOFF":
            action = {
                "actor_role": "CREATOR",
                "action_label": "Submit Initial Draft",
                "action_description": "Upload the first deliverable draft for brand creative alignment.",
            }
        elif status_val == "DRAFT_SUBMITTED":
            action = {
                "actor_role": "BRAND",
                "action_label": "Review Deliverable",
                "action_description": f"Inspect deliverable v{latest_deliv.version if latest_deliv else 1}. Request revisions or approve.",
            }
        elif status_val == "REVISION_REQUESTED":
            action = {
                "actor_role": "CREATOR",
                "action_label": "Upload Revised Deliverable",
                "action_description": "Address the brand feedback and submit a new revision.",
            }
        elif status_val == "FINAL_APPROVED":
            action = {
                "actor_role": "BRAND",
                "action_label": "Complete Project & Review",
                "action_description": "Master assets approved. Finalize engagement and submit performance rating.",
            }
        elif status_val == "COMPLETED":
            action = {
                "actor_role": "BOTH",
                "action_label": "Collaboration Finalized",
                "action_description": "All deliverables approved and milestone buyout released.",
            }
        else:
            action = {
                "actor_role": "BOTH",
                "action_label": "Review Project State",
                "action_description": f"Engagement currently in status '{status_val}'.",
            }

        return progress, current_title, action

    @staticmethod
    def get_workspace_data(db: Session, engagement_id: str, current_user: User) -> Dict[str, Any]:
        """Loads complete workspace context, enforcing authorization and relationships."""
        engagement = db.query(Engagement).filter(Engagement.id == engagement_id).first()
        if not engagement:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Engagement not found.")

        user_role = CollaborationService.verify_participant(engagement, current_user)
        progress, current_m_title, next_action = CollaborationService.calculate_progress(engagement)

        # Linked conversation
        conv = (
            db.query(Conversation)
            .filter(
                or_(
                    Conversation.engagement_id == engagement.id,
                    and_(
                        Conversation.brief_id == engagement.brief_id,
                        Conversation.creator_id == engagement.creator_id,
                    ),
                )
            )
            .first()
        )

        brand_prof = engagement.brief.brand if engagement.brief else None
        creator_prof = engagement.creator

        from backend.app.api.projects import format_project_read
        project_read = format_project_read(engagement)

        return {
            "engagement": project_read,
            "brand": {
                "id": brand_prof.id if brand_prof else "",
                "company_name": brand_prof.company_name if brand_prof else "Brand",
                "slug": brand_prof.slug if brand_prof else "",
                "logo_url": brand_prof.logo_url if brand_prof else "",
                "website_url": brand_prof.website_url if brand_prof else "",
                "is_verified_brand": brand_prof.is_verified_brand if brand_prof else False,
                "user_id": brand_prof.user_id if brand_prof else "",
            },
            "creator": {
                "id": creator_prof.id if creator_prof else "",
                "display_name": creator_prof.display_name if creator_prof else "Creator",
                "handle": creator_prof.handle if creator_prof else "",
                "avatar_url": creator_prof.avatar_url if creator_prof else "",
                "primary_specialization": creator_prof.primary_specialization if creator_prof else "",
                "verification_tier": creator_prof.verification_tier if creator_prof else "",
                "user_id": creator_prof.user_id if creator_prof else "",
            },
            "brief": {
                "id": engagement.brief.id if engagement.brief else "",
                "title": engagement.brief.title if engagement.brief else "Campaign",
                "slug": engagement.brief.slug if engagement.brief else "",
                "campaign_objective": engagement.brief.campaign_objective if engagement.brief else "",
                "deliverables_description": engagement.brief.deliverables_description if engagement.brief else "",
                "budget_amount": engagement.brief.budget_amount if engagement.brief else 0.0,
                "content_type": engagement.brief.content_type if engagement.brief else "VIDEO",
                "aspect_ratio": engagement.brief.aspect_ratio if engagement.brief else "16:9",
                "resolution_min": engagement.brief.resolution_min if engagement.brief else "4K UHD",
                "status": engagement.brief.status if engagement.brief else "ACTIVE",
            },
            "milestones": engagement.milestones or [],
            "deliverables": engagement.deliverables or [],
            "events": engagement.events or [],
            "conversation_id": conv.id if conv else None,
            "progress_percentage": progress,
            "current_milestone_title": current_m_title,
            "next_required_action": next_action,
            "user_role": user_role,
        }

    # ==========================================
    # MILESTONE MANAGEMENT
    # ==========================================

    @staticmethod
    def create_milestone(
        db: Session,
        engagement_id: str,
        payload: MilestoneCreate,
        current_user: User,
    ) -> EngagementMilestone:
        engagement = db.query(Engagement).filter(Engagement.id == engagement_id).first()
        if not engagement:
            raise HTTPException(status_code=404, detail="Engagement not found.")

        user_role = CollaborationService.verify_participant(engagement, current_user)

        # Sequence ordering
        seq = payload.sequence_order
        if seq is None or seq < 1:
            existing_count = db.query(func.count(EngagementMilestone.id)).filter(
                EngagementMilestone.engagement_id == engagement_id
            ).scalar()
            seq = (existing_count or 0) + 1

        milestone = EngagementMilestone(
            id=f"mls-{uuid.uuid4().hex[:10]}",
            engagement_id=engagement_id,
            title=payload.title,
            description=payload.description,
            due_date=payload.due_date,
            status="PENDING",
            sequence_order=seq,
            responsible_party=payload.responsible_party,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(milestone)

        CollaborationService.record_event(
            db=db,
            engagement_id=engagement_id,
            event_type="MILESTONE_CREATED",
            actor_id=current_user.id,
            actor_role=user_role,
            title=f"Milestone Added: {milestone.title}",
            description=f"Created milestone #{milestone.sequence_order} assigned to {milestone.responsible_party}.",
            metadata={"milestone_id": milestone.id},
        )

        db.commit()
        db.refresh(milestone)
        return milestone

    @staticmethod
    def update_milestone(
        db: Session,
        engagement_id: str,
        milestone_id: str,
        payload: MilestoneUpdate,
        current_user: User,
    ) -> EngagementMilestone:
        engagement = db.query(Engagement).filter(Engagement.id == engagement_id).first()
        if not engagement:
            raise HTTPException(status_code=404, detail="Engagement not found.")

        user_role = CollaborationService.verify_participant(engagement, current_user)

        milestone = (
            db.query(EngagementMilestone)
            .filter(
                EngagementMilestone.id == milestone_id,
                EngagementMilestone.engagement_id == engagement_id,
            )
            .first()
        )
        if not milestone:
            raise HTTPException(status_code=404, detail="Milestone not found.")

        prev_status = milestone.status
        if payload.title is not None:
            milestone.title = payload.title
        if payload.description is not None:
            milestone.description = payload.description
        if payload.due_date is not None:
            milestone.due_date = payload.due_date
        if payload.sequence_order is not None:
            milestone.sequence_order = payload.sequence_order
        if payload.responsible_party is not None:
            milestone.responsible_party = payload.responsible_party

        if payload.status is not None:
            milestone.status = payload.status
            if payload.status == "COMPLETED" and prev_status != "COMPLETED":
                milestone.completed_at = datetime.utcnow()
            elif payload.status != "COMPLETED":
                milestone.completed_at = None

        milestone.updated_at = datetime.utcnow()

        CollaborationService.record_event(
            db=db,
            engagement_id=engagement_id,
            event_type="MILESTONE_UPDATED",
            actor_id=current_user.id,
            actor_role=user_role,
            title=f"Milestone Updated: {milestone.title}",
            description=f"Status changed from {prev_status} to {milestone.status}.",
            metadata={"milestone_id": milestone.id, "status": milestone.status},
        )

        db.commit()
        db.refresh(milestone)
        return milestone

    # ==========================================
    # DELIVERABLE SUBMISSION & REVISION LIFECYCLE
    # ==========================================

    @staticmethod
    def submit_deliverable_version(
        db: Session,
        engagement_id: str,
        payload: DeliverableSubmissionCreate,
        current_user: User,
    ) -> EngagementDeliverable:
        """
        Submits a new deliverable version. Never overwrites prior versions.
        Server calculates next version number deterministically.
        """
        engagement = db.query(Engagement).filter(Engagement.id == engagement_id).first()
        if not engagement:
            raise HTTPException(status_code=404, detail="Engagement not found.")

        user_role = CollaborationService.verify_participant(engagement, current_user)
        if user_role != "CREATOR" and user_role != "ADMIN":
            raise HTTPException(status_code=403, detail="Forbidden: Only assigned creators can submit deliverables.")

        # Determine next version number
        existing_versions = [d.version for d in (engagement.deliverables or [])]
        next_version = (max(existing_versions) + 1) if existing_versions else 1

        deliv_id = f"deliv-{uuid.uuid4().hex[:10]}"
        deliverable = EngagementDeliverable(
            id=deliv_id,
            engagement_id=engagement_id,
            version=next_version,
            title=payload.title or f"Deliverable v{next_version}",
            asset_url=payload.asset_url or (f"/api/engagements/{engagement_id}/deliverables/{deliv_id}/download" if payload.file_storage_key else ""),
            notes=payload.notes,
            submitted_by=engagement.creator_id,
            status="SUBMITTED",
            feedback=None,
            file_storage_key=payload.file_storage_key,
            original_filename=payload.original_filename,
            file_size_bytes=payload.file_size_bytes,
            content_type=payload.content_type,
            sha256_checksum=payload.sha256_checksum,
            milestone_id=payload.milestone_id,
            submitted_at=datetime.utcnow(),
        )
        db.add(deliverable)

        # Transition engagement status
        engagement.status = "DRAFT_SUBMITTED"
        engagement.updated_at = datetime.utcnow()

        # Update linked milestone if present
        if payload.milestone_id:
            m = db.query(EngagementMilestone).filter(EngagementMilestone.id == payload.milestone_id).first()
            if m and m.status == "PENDING":
                m.status = "IN_PROGRESS"
                m.updated_at = datetime.utcnow()

        CollaborationService.record_event(
            db=db,
            engagement_id=engagement_id,
            event_type="DELIVERABLE_SUBMITTED",
            actor_id=current_user.id,
            actor_role="CREATOR",
            title=f"Deliverable v{next_version} Submitted",
            description=f"Creator uploaded master deliverable v{next_version} ({payload.original_filename or 'asset package'}).",
            metadata={"deliverable_id": deliv_id, "version": next_version, "checksum": payload.sha256_checksum},
        )

        # Notify Brand
        try:
            brand_user_id = engagement.brief.brand.user_id if (engagement.brief and engagement.brief.brand) else None
            if brand_user_id:
                NotificationService.create_notification(
                    db=db,
                    user_id=brand_user_id,
                    notification_type="DELIVERABLE_SUBMITTED",
                    title=f"Deliverable v{next_version} Ready for Review",
                    message=f"{engagement.creator.display_name if engagement.creator else 'Creator'} submitted deliverable v{next_version} for '{engagement.brief.title if engagement.brief else 'Campaign'}'.",
                    resource_type="ENGAGEMENT",
                    resource_id=engagement_id,
                    link_url=f"/workspace/{engagement_id}",
                    dispatch_email=True,
                )
        except Exception as err:
            print(f"[CollaborationService] Non-fatal notification error: {err}")

        db.commit()
        db.refresh(deliverable)
        return deliverable

    @staticmethod
    def request_revision(
        db: Session,
        engagement_id: str,
        payload: RevisionRequestCreate,
        current_user: User,
    ) -> EngagementDeliverable:
        """Brand requests changes on the latest deliverable version."""
        engagement = db.query(Engagement).filter(Engagement.id == engagement_id).first()
        if not engagement:
            raise HTTPException(status_code=404, detail="Engagement not found.")

        user_role = CollaborationService.verify_participant(engagement, current_user)
        if user_role != "BRAND" and user_role != "ADMIN":
            raise HTTPException(status_code=403, detail="Forbidden: Only owning brand can request revisions.")

        deliverables = sorted(engagement.deliverables or [], key=lambda d: d.version)
        if not deliverables:
            raise HTTPException(status_code=400, detail="Cannot request revisions: No deliverable has been submitted yet.")

        latest = deliverables[-1]
        latest.status = "REVISION_REQUESTED"
        latest.feedback = payload.feedback
        latest.reviewed_at = datetime.utcnow()

        engagement.status = "REVISION_REQUESTED"
        engagement.updated_at = datetime.utcnow()

        CollaborationService.record_event(
            db=db,
            engagement_id=engagement_id,
            event_type="REVISION_REQUESTED",
            actor_id=current_user.id,
            actor_role="BRAND",
            title=f"Revision Requested on v{latest.version}",
            description=f"Brand provided revision notes: {payload.feedback[:120]}...",
            metadata={"deliverable_id": latest.id, "version": latest.version, "feedback": payload.feedback},
        )

        # Notify Creator
        try:
            creator_user_id = engagement.creator.user_id if engagement.creator else None
            if creator_user_id:
                NotificationService.create_notification(
                    db=db,
                    user_id=creator_user_id,
                    notification_type="REVISION_REQUESTED",
                    title=f"Revisions Requested on v{latest.version}",
                    message=f"Brand requested revisions on '{engagement.brief.title if engagement.brief else 'Campaign'}'. Check feedback in the workspace.",
                    resource_type="ENGAGEMENT",
                    resource_id=engagement_id,
                    link_url=f"/workspace/{engagement_id}",
                    dispatch_email=True,
                )
        except Exception as err:
            print(f"[CollaborationService] Non-fatal notification error: {err}")

        db.commit()
        db.refresh(latest)
        return latest

    @staticmethod
    def approve_deliverable(
        db: Session,
        engagement_id: str,
        current_user: User,
    ) -> EngagementDeliverable:
        """Brand approves the latest deliverable version."""
        engagement = db.query(Engagement).filter(Engagement.id == engagement_id).first()
        if not engagement:
            raise HTTPException(status_code=404, detail="Engagement not found.")

        user_role = CollaborationService.verify_participant(engagement, current_user)
        if user_role != "BRAND" and user_role != "ADMIN":
            raise HTTPException(status_code=403, detail="Forbidden: Only owning brand can approve deliverables.")

        deliverables = sorted(engagement.deliverables or [], key=lambda d: d.version)
        if not deliverables:
            raise HTTPException(status_code=400, detail="No deliverable exists to approve.")

        latest = deliverables[-1]
        latest.status = "APPROVED"
        latest.reviewed_at = datetime.utcnow()

        engagement.status = "FINAL_APPROVED"
        engagement.final_deliverable_url = latest.asset_url
        engagement.updated_at = datetime.utcnow()

        # Complete associated milestone if present
        if latest.milestone_id:
            m = db.query(EngagementMilestone).filter(EngagementMilestone.id == latest.milestone_id).first()
            if m:
                m.status = "COMPLETED"
                m.completed_at = datetime.utcnow()

        CollaborationService.record_event(
            db=db,
            engagement_id=engagement_id,
            event_type="DELIVERABLE_APPROVED",
            actor_id=current_user.id,
            actor_role="BRAND",
            title=f"Deliverable v{latest.version} Approved",
            description=f"Brand approved master asset package v{latest.version}.",
            metadata={"deliverable_id": latest.id, "version": latest.version},
        )

        # Notify Creator
        try:
            creator_user_id = engagement.creator.user_id if engagement.creator else None
            if creator_user_id:
                NotificationService.create_notification(
                    db=db,
                    user_id=creator_user_id,
                    notification_type="DELIVERABLE_APPROVED",
                    title="Deliverable Approved! 🎉",
                    message=f"Your deliverable v{latest.version} for '{engagement.brief.title if engagement.brief else 'Campaign'}' was approved by the brand.",
                    resource_type="ENGAGEMENT",
                    resource_id=engagement_id,
                    link_url=f"/workspace/{engagement_id}",
                    dispatch_email=True,
                )
        except Exception as err:
            print(f"[CollaborationService] Non-fatal notification error: {err}")

        db.commit()
        db.refresh(latest)
        return latest

    @staticmethod
    def complete_engagement(
        db: Session,
        engagement_id: str,
        current_user: User,
    ) -> Engagement:
        """Transitions engagement from FINAL_APPROVED to COMPLETED."""
        engagement = db.query(Engagement).filter(Engagement.id == engagement_id).first()
        if not engagement:
            raise HTTPException(status_code=404, detail="Engagement not found.")

        user_role = CollaborationService.verify_participant(engagement, current_user)
        if user_role != "BRAND" and user_role != "ADMIN":
            raise HTTPException(status_code=403, detail="Forbidden: Only brand can complete engagement.")

        if engagement.status != "FINAL_APPROVED":
            raise HTTPException(
                status_code=400,
                detail=f"Cannot complete engagement: Current status is '{engagement.status}'. Deliverable must be approved first.",
            )

        engagement.status = "COMPLETED"
        engagement.updated_at = datetime.utcnow()

        # Update creator completed count
        if engagement.creator:
            engagement.creator.completed_projects_count = (engagement.creator.completed_projects_count or 0) + 1

        # Mark all pending milestones as completed
        for m in (engagement.milestones or []):
            if m.status != "COMPLETED":
                m.status = "COMPLETED"
                m.completed_at = datetime.utcnow()

        CollaborationService.record_event(
            db=db,
            engagement_id=engagement_id,
            event_type="ENGAGEMENT_COMPLETED",
            actor_id=current_user.id,
            actor_role="BRAND",
            title="Collaboration Completed",
            description="All project deliverables approved and campaign signed off.",
            metadata={"agreed_amount": engagement.agreed_amount},
        )

        db.commit()
        db.refresh(engagement)
        return engagement

    # ==========================================
    # VERSION COMPARISON
    # ==========================================

    @staticmethod
    def compare_deliverable_versions(
        db: Session,
        engagement_id: str,
        version_a: int,
        version_b: int,
        current_user: User,
    ) -> DeliverableVersionCompareResponse:
        engagement = db.query(Engagement).filter(Engagement.id == engagement_id).first()
        if not engagement:
            raise HTTPException(status_code=404, detail="Engagement not found.")

        CollaborationService.verify_participant(engagement, current_user)

        delivs = engagement.deliverables or []
        row_a = next((d for d in delivs if d.version == version_a), None)
        row_b = next((d for d in delivs if d.version == version_b), None)
        if not row_a or not row_b:
            raise HTTPException(status_code=404, detail="One or both deliverable versions not found.")

        # Identify older vs newer
        older, newer = (row_a, row_b) if row_a.version < row_b.version else (row_b, row_a)

        # Determine comparison type
        ct_old = (older.content_type or "").lower()
        ct_new = (newer.content_type or "").lower()
        ext_old = os.path.splitext(older.original_filename or "")[1].lower()
        ext_new = os.path.splitext(newer.original_filename or "")[1].lower()

        if ("image" in ct_old or ext_old in [".jpg", ".png", ".webp"]) and ("image" in ct_new or ext_new in [".jpg", ".png", ".webp"]):
            comp_type = "IMAGE"
            summary = f"Visual comparison between v{older.version} and v{newer.version} image assets."
        elif ("text" in ct_old or ext_old in [".txt", ".json", ".md"]) and ("text" in ct_new or ext_new in [".txt", ".json", ".md"]):
            comp_type = "TEXT"
            summary = f"Textual artifact comparison between v{older.version} and v{newer.version}."
        else:
            comp_type = "METADATA"
            summary = f"Metadata comparison between v{older.version} and v{newer.version} ({ext_old or 'binary'} vs {ext_new or 'binary'})."

        from backend.app.schemas.schemas import DeliverableRead
        return DeliverableVersionCompareResponse(
            deliverable_id=newer.id,
            engagement_id=engagement_id,
            older_version=DeliverableRead.model_validate(older),
            newer_version=DeliverableRead.model_validate(newer),
            comparison_type=comp_type,
            text_diff=[
                {"field": "submission_notes", "older": older.notes, "newer": newer.notes},
                {"field": "reviewer_feedback", "older": older.feedback, "newer": newer.feedback},
            ],
            summary=summary,
        )

    # ==========================================
    # COLLABORATION HISTORY
    # ==========================================

    @staticmethod
    def get_brand_history(
        db: Session,
        brand_user: User,
        status_filter: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> List[Any]:
        if not brand_user.brand_profile:
            return []

        query = (
            db.query(Engagement)
            .join(Brief, Engagement.brief_id == Brief.id)
            .filter(Brief.brand_id == brand_user.brand_profile.id)
        )

        if status_filter:
            query = query.filter(Engagement.status == status_filter.upper())
        if date_from:
            query = query.filter(Engagement.created_at >= date_from)
        if date_to:
            query = query.filter(Engagement.created_at <= date_to)

        engagements = query.order_by(desc(Engagement.updated_at)).offset(skip).limit(limit).all()
        from backend.app.api.projects import format_project_read
        return [format_project_read(e) for e in engagements]

    @staticmethod
    def get_creator_history(
        db: Session,
        creator_user: User,
        status_filter: Optional[str] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> List[Any]:
        if not creator_user.creator_profile:
            return []

        query = db.query(Engagement).filter(Engagement.creator_id == creator_user.creator_profile.id)

        if status_filter:
            query = query.filter(Engagement.status == status_filter.upper())
        if date_from:
            query = query.filter(Engagement.created_at >= date_from)
        if date_to:
            query = query.filter(Engagement.created_at <= date_to)

        engagements = query.order_by(desc(Engagement.updated_at)).offset(skip).limit(limit).all()
        from backend.app.api.projects import format_project_read
        return [format_project_read(e) for e in engagements]

    # ==========================================
    # REVIEWS & RATINGS (T03.8)
    # ==========================================

    @staticmethod
    def submit_review(
        db: Session,
        engagement_id: str,
        payload: ReviewCreate,
        current_user: User,
    ) -> EngagementReview:
        """
        Submits a post-completion review.
        Enforces:
        - Engagement status must be COMPLETED
        - Authenticated user must be an active participant (Brand or Creator)
        - Prevents self-reviews
        - Prevents duplicate reviews for the same engagement and reviewer
        - Recomputes profile rating average
        """
        engagement = db.query(Engagement).filter(Engagement.id == engagement_id).first()
        if not engagement:
            raise HTTPException(status_code=404, detail="Engagement not found.")

        if engagement.status != "COMPLETED":
            raise HTTPException(
                status_code=400,
                detail=f"Reviews can only be submitted after collaboration is completed. Current status: '{engagement.status}'.",
            )

        user_role = CollaborationService.verify_participant(engagement, current_user)

        # Check for existing review by this user on this engagement
        existing = db.query(EngagementReview).filter(
            EngagementReview.engagement_id == engagement_id,
            EngagementReview.reviewer_id == current_user.id,
        ).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail="You have already submitted a review for this collaboration.",
            )

        if user_role == "BRAND":
            reviewer_role = "BRAND"
            reviewee_id = engagement.creator_id
            reviewee_role = "CREATOR"
        elif user_role == "CREATOR":
            reviewer_role = "CREATOR"
            reviewee_id = engagement.brief.brand_id if engagement.brief else ""
            reviewee_role = "BRAND"
        else:
            raise HTTPException(status_code=403, detail="Admins cannot submit collaboration reviews.")

        review = EngagementReview(
            id=f"rev-{uuid.uuid4().hex[:10]}",
            engagement_id=engagement_id,
            reviewer_id=current_user.id,
            reviewer_role=reviewer_role,
            reviewee_id=reviewee_id,
            reviewee_role=reviewee_role,
            rating=float(payload.rating),
            review_text=payload.review_text,
            communication_rating=payload.communication_rating,
            quality_rating=payload.quality_rating,
            timeliness_rating=payload.timeliness_rating,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(review)

        # If brand reviewing creator, also update legacy Engagement.brand_rating and CreatorProfile.average_rating
        if reviewer_role == "BRAND" and engagement.creator:
            engagement.brand_rating = int(round(payload.rating))
            engagement.brand_review = payload.review_text

            # Recompute creator average rating
            all_ratings = [
                r[0] for r in db.query(EngagementReview.rating).filter(
                    EngagementReview.reviewee_id == engagement.creator_id,
                    EngagementReview.reviewee_role == "CREATOR",
                ).all()
            ]
            all_ratings.append(float(payload.rating))
            if all_ratings:
                engagement.creator.average_rating = round(sum(all_ratings) / len(all_ratings), 1)

        CollaborationService.record_event(
            db=db,
            engagement_id=engagement_id,
            event_type="REVIEW_SUBMITTED",
            actor_id=current_user.id,
            actor_role=reviewer_role,
            title=f"{reviewer_role.title()} Review Submitted ({payload.rating}★)",
            description=payload.review_text or "No written feedback provided.",
            metadata={"rating": payload.rating, "review_id": review.id},
        )

        db.commit()
        db.refresh(review)
        return review

    @staticmethod
    def get_review_summary(db: Session, target_id: str, target_role: str = "CREATOR") -> Dict[str, Any]:
        """Calculates aggregate rating summary for a creator or brand profile."""
        reviews = (
            db.query(EngagementReview)
            .filter(
                EngagementReview.reviewee_id == target_id,
                EngagementReview.reviewee_role == target_role,
            )
            .all()
        )

        total = len(reviews)
        if total == 0:
            return {
                "average_rating": 5.0,
                "total_reviews": 0,
                "communication_avg": None,
                "quality_avg": None,
                "timeliness_avg": None,
                "rating_distribution": {5: 0, 4: 0, 3: 0, 2: 0, 1: 0},
                "recent_reviews": [],
            }

        avg = round(sum(r.rating for r in reviews) / total, 1)
        comm = [r.communication_rating for r in reviews if r.communication_rating]
        qual = [r.quality_rating for r in reviews if r.quality_rating]
        time = [r.timeliness_rating for r in reviews if r.timeliness_rating]

        dist = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
        for r in reviews:
            star = int(round(r.rating))
            if 1 <= star <= 5:
                dist[star] += 1

        recent = sorted(reviews, key=lambda r: r.created_at, reverse=True)[:5]

        from backend.app.schemas.schemas import ReviewRead
        return {
            "average_rating": avg,
            "total_reviews": total,
            "communication_avg": round(sum(comm) / len(comm), 1) if comm else None,
            "quality_avg": round(sum(qual) / len(qual), 1) if qual else None,
            "timeliness_avg": round(sum(time) / len(time), 1) if time else None,
            "rating_distribution": dist,
            "recent_reviews": [ReviewRead.model_validate(r) for r in recent],
        }
