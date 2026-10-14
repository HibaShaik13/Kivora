# KIVORA — PHASE 3 API AND DATA MODEL SPECIFICATION
## Workspace Endpoints, Schemas, Lifecycle Transitions & Data Dictionaries

---

## 1. Relational Data Models & Schema Extensions

Phase 3 introduces four new models and enhances the existing `engagement_deliverables` model to support enterprise collaboration, milestone tracking, immutable versioning, assistive AI reviews, and post-completion reviews.

### 1.1 `engagement_milestones`
Stores discrete project phases, delivery stages, and responsibility assignments.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | Primary Key | Unique milestone UUID |
| `engagement_id` | `VARCHAR(36)` | Foreign Key (`engagements.id`, ON DELETE CASCADE), Index | Associated engagement |
| `title` | `VARCHAR(200)` | NOT NULL | Milestone name (e.g. Concept Moodboard) |
| `description` | `TEXT` | Nullable | Detailed scope and criteria |
| `due_date` | `DATETIME` | Nullable | Expected completion date |
| `status` | `VARCHAR(30)` | NOT NULL, Default: `'PENDING'`, Index | `'PENDING'`, `'IN_PROGRESS'`, `'COMPLETED'` |
| `sequence_order` | `INTEGER` | NOT NULL, Default: `1` | Ordering index within collaboration |
| `responsible_party` | `VARCHAR(30)` | NOT NULL, Default: `'CREATOR'` | Party accountable: `'CREATOR'`, `'BRAND'` |
| `created_at` | `DATETIME` | NOT NULL, Default: UTC now | Creation timestamp |
| `completed_at` | `DATETIME` | Nullable | Completion timestamp |

### 1.2 `engagement_events`
Append-only activity log for auditability, client transparency, and timeline tracking.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | Primary Key | Unique event ID (`evt-...`) |
| `engagement_id` | `VARCHAR(36)` | Foreign Key (`engagements.id`, ON DELETE CASCADE), Index | Associated engagement |
| `event_type` | `VARCHAR(60)` | NOT NULL, Index | Activity type (e.g., `'DELIVERABLE_SUBMITTED'`, `'DELIVERABLE_APPROVED'`) |
| `actor_id` | `VARCHAR(36)` | NOT NULL, Index | User ID who initiated action |
| `actor_role` | `VARCHAR(30)` | NOT NULL | Role at time of action (`CREATOR`, `BRAND`, `ADMIN`) |
| `title` | `VARCHAR(200)` | NOT NULL | Human-readable event headline |
| `description` | `TEXT` | Nullable | Detailed context (sanitized) |
| `event_metadata` | `JSON` | Nullable | Non-sensitive structured metadata |
| `created_at` | `DATETIME` | NOT NULL, Default: UTC now, Index | Immutable timestamp |

### 1.3 `engagement_deliverables` (Additive Columns)
Existing deliverable table expanded to support persistent physical files, cryptographic integrity, and milestones:

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `file_storage_key` | `VARCHAR(500)` | Nullable | Internal relative disk storage path |
| `original_filename` | `VARCHAR(255)` | Nullable | Original sanitized filename for download presentation |
| `file_size_bytes` | `INTEGER` | Nullable | Exact file size in bytes |
| `content_type` | `VARCHAR(100)` | Nullable | Verified MIME type |
| `sha256_checksum` | `VARCHAR(64)` | Nullable | Cryptographic SHA-256 hash |
| `milestone_id` | `VARCHAR(36)` | Nullable, Index | Optional milestone link |

### 1.4 `deliverable_ai_analyses`
Records assistive quality evaluations without replacing human reviewer decisions.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | Primary Key | Unique analysis ID (`aia-...`) |
| `deliverable_id` | `VARCHAR(36)` | Foreign Key (`engagement_deliverables.id`, ON DELETE CASCADE), Index | Evaluated deliverable |
| `version` | `INTEGER` | NOT NULL | Version number evaluated |
| `brief_coverage_score`| `FLOAT` | NOT NULL | Evaluated alignment score (0.0 to 100.0) |
| `summary` | `TEXT` | NOT NULL | Human-readable findings synthesis |
| `requirement_coverage`| `JSON` | NOT NULL | List of satisfied brief specifications |
| `potential_omissions` | `JSON` | NOT NULL | List of potential omissions or gaps |
| `consistency_notes` | `JSON` | NOT NULL | Aesthetic and technical consistency notes |
| `quality_observations`| `JSON` | NOT NULL | Resolution, encoding, or format observations |
| `suggested_questions` | `JSON` | NOT NULL | Suggested questions for the reviewer |
| `recommended_checks` | `JSON` | NOT NULL | Manual checklist for reviewer verification |
| `model_name` | `VARCHAR(100)` | NOT NULL | Model identifier |
| `analysis_status` | `VARCHAR(30)` | NOT NULL, Default: `'COMPLETED'` | Status: `'COMPLETED'`, `'UNAVAILABLE'` |
| `disclaimer` | `TEXT` | NOT NULL | Assistive guidance disclaimer |
| `created_at` | `DATETIME` | NOT NULL, Default: UTC now | Analysis generation timestamp |

### 1.5 `engagement_reviews`
Post-completion reviews, ratings, and sub-score distributions.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(36)` | Primary Key | Unique review ID (`rev-...`) |
| `engagement_id` | `VARCHAR(36)` | Foreign Key (`engagements.id`, ON DELETE CASCADE), Index | Reviewed engagement |
| `reviewer_id` | `VARCHAR(36)` | Foreign Key (`users.id`, ON DELETE CASCADE), Index | Submitting user ID |
| `reviewer_role` | `VARCHAR(30)` | NOT NULL | Role of reviewer: `'BRAND'`, `'CREATOR'` |
| `reviewee_id` | `VARCHAR(36)` | NOT NULL, Index | Recipient profile ID (`creator_id` or `brand_id`) |
| `reviewee_role` | `VARCHAR(30)` | NOT NULL | Recipient role: `'CREATOR'`, `'BRAND'` |
| `rating` | `FLOAT` | NOT NULL | Overall rating (1.0 to 5.0) |
| `review_text` | `TEXT` | Nullable | Qualitative feedback |
| `communication_rating`| `FLOAT` | Nullable | Communication score (1.0 to 5.0) |
| `quality_rating` | `FLOAT` | Nullable | Creative quality score (1.0 to 5.0) |
| `timeliness_rating` | `FLOAT` | Nullable | Adherence to deadlines (1.0 to 5.0) |
| `created_at` | `DATETIME` | NOT NULL, Default: UTC now | Review submission timestamp |
| `updated_at` | `DATETIME` | NOT NULL, Default: UTC now | Last update timestamp |

**Table Constraints:**  
- `uq_engagement_reviewer`: `(engagement_id, reviewer_id)` guarantees each participant can submit at most one review per engagement.

---

## 2. API Endpoints Reference

All endpoints require standard Bearer JWT authorization and enforce participant verification.

### 2.1 Workspace Context & Timeline
- `GET /api/workspaces/{engagement_id}`
  - Access: Brand owner or assigned Creator (or Admin).
  - Returns: `CollaborationWorkspaceRead` containing brief, brand, creator, milestones, deliverables, events, conversation ID, dynamic progress percentage, and next required actions.
- `GET /api/workspaces/{engagement_id}/timeline`
  - Access: Brand owner or assigned Creator.
  - Returns: `List[EngagementEventRead]` in reverse chronological order.

### 2.2 Milestones
- `POST /api/workspaces/{engagement_id}/milestones`
  - Access: Authorized participant.
  - Body: `MilestoneCreate` (`title`, `description`, `due_date`, `responsible_party`, `sequence_order`).
  - Returns: `MilestoneRead` (HTTP 201).
- `PATCH /api/workspaces/{engagement_id}/milestones/{milestone_id}`
  - Access: Authorized participant.
  - Body: `MilestoneUpdate` (`title`, `description`, `due_date`, `status`, `responsible_party`).
  - Returns: `MilestoneRead`.

### 2.3 Deliverables & Versioning
- `POST /api/workspaces/{engagement_id}/upload-deliverable`
  - Access: Assigned Creator (or Admin).
  - Content-Type: `multipart/form-data`.
  - Fields: `file` (UploadFile), `title` (Form), `notes` or `submission_notes` (Form), `milestone_id` (Form).
  - Returns: `DeliverableRead` (HTTP 201).
- `POST /api/workspaces/{engagement_id}/deliverables`
  - Access: Assigned Creator (or Admin).
  - Content-Type: `application/json`.
  - Body: `DeliverableSubmissionCreate`.
  - Returns: `DeliverableRead` (HTTP 201).
- `GET /api/workspaces/{engagement_id}/deliverables/{deliverable_id}/download`
  - Access: Authorized participant.
  - Returns: Streaming `FileResponse` with verified MIME type and sanitized original filename.
- `POST /api/workspaces/{engagement_id}/revisions`
  - Access: Brand owner (or Admin).
  - Body: `RevisionRequestCreate` (`feedback`, `revision_notes`).
  - Returns: `DeliverableRead`.
- `POST /api/workspaces/{engagement_id}/approve`
  - Access: Brand owner (or Admin).
  - Returns: `DeliverableRead` with `status: "APPROVED"`.
- `POST /api/workspaces/{engagement_id}/complete`
  - Access: Brand owner (or Admin).
  - Precondition: Engagement must be `FINAL_APPROVED`.
  - Returns: `ProjectRead` with `status: "COMPLETED"`.

### 2.4 Version Comparison
- `GET /api/workspaces/{engagement_id}/compare?v_a={int}&v_b={int}`
  - Access: Authorized participant.
  - Returns: `DeliverableVersionCompareResponse` with older/newer metadata, text difference chunks if applicable, and comparison summary.

### 2.5 Collaboration History
- `GET /api/workspaces/history/brand?status={str}&skip={int}&limit={int}`
  - Access: Role `BRAND`. Returns only collaborations belonging to caller's brand account.
- `GET /api/workspaces/history/creator?status={str}&skip={int}&limit={int}`
  - Access: Role `CREATOR`. Returns only collaborations belonging to caller's creator account across brands.

### 2.6 AI-Assisted Review
- `POST /api/workspaces/{engagement_id}/deliverables/{deliverable_id}/ai-review`
  - Access: Brand owner (or Admin).
  - Returns: `DeliverableAiAnalysisRead`.
- `GET /api/workspaces/{engagement_id}/deliverables/{deliverable_id}/ai-review`
  - Access: Authorized participant.
  - Returns: `Optional[DeliverableAiAnalysisRead]`.

### 2.7 Reviews & Ratings
- `POST /api/workspaces/{engagement_id}/reviews`
  - Access: Authorized participant.
  - Precondition: Engagement status must be `COMPLETED`.
  - Body: `ReviewCreate` (`rating`, `review_text`, `communication_rating`, `quality_rating`, `timeliness_rating`).
  - Returns: `ReviewRead` (HTTP 201).
- `GET /api/workspaces/reviews/summary/{profile_id}?role={CREATOR|BRAND}`
  - Access: Public / Authenticated.
  - Returns: `ReviewSummaryRead` (`average_rating`, `total_reviews`, sub-score averages, star distribution, recent reviews).

---

## 3. Progress Calculation Formula Specification

The collaboration progress percentage ($P$) is computed deterministically in `CollaborationService.calculate_progress`:

### Case A: Custom Milestones Exist
$$P = \min(95, \left\lfloor M_{score} \times 0.60 + D_{score} \times 0.40 \right\rfloor)$$
Where:
- $M_{score} = \frac{\text{Completed Milestones} + 0.5 \times \text{In-Progress Milestones}}{\text{Total Milestones}} \times 100$
- $D_{score}$ is derived from engagement status:
  - `KICKOFF`: $25\%$
  - `DRAFT_SUBMITTED`: $50\%$
  - `REVISION_REQUESTED`: $50\%$
  - `FINAL_APPROVED`: $87.5\%$
  - `COMPLETED`: $100\%$
- **Invariant:** $P$ is capped at $95\%$ while engagement is not `COMPLETED`. When `COMPLETED`, $P = 100\%$.

### Case B: No Custom Milestones Exist (Lifecycle-Derived)
- `KICKOFF`: $20\%$
- `DRAFT_SUBMITTED` (v1): $50\%$
- `DRAFT_SUBMITTED` (v2+): $75\%$
- `REVISION_REQUESTED`: $55\%$
- `FINAL_APPROVED`: $90\%$
- `COMPLETED`: $100\%$
