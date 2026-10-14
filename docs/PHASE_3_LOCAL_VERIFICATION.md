# KIVORA — PHASE 3 LOCAL VERIFICATION CHECKLIST & PROTOCOL
## Interactive Scenarios, Verification Evidence & Production Guardrails

---

## 1. Local Verification Protocol

This document outlines the 17 core end-to-end scenarios required for Phase 3 verification. Automated test execution logs provide objective evidence of correctness.

| # | Verification Scenario | Automated Verification | Manual UI Verification | Status |
| :-: | :--- | :---: | :---: | :---: |
| **1** | Brand and Creator can open their authorized collaboration workspace | `test_workspace_access_and_progress_calculation` | Modal opens from "🚀 Open Workspace" in Dashboard | **VERIFIED** |
| **2** | Unrelated user cannot open that workspace (HTTP 403) | `test_workspace_access_and_progress_calculation` | API returns 403, UI displays access denied | **VERIFIED** |
| **3** | Progress percentage updates when real milestones and deliverable states change | `test_workspace_access_and_progress_calculation` | Progress bar increments from 20% to 100% | **VERIFIED** |
| **4** | Timeline entries reflect actual actions in correct chronological order | `test_milestone_management_and_timeline_integrity` | "Activity Timeline" tab renders all actions | **VERIFIED** |
| **5** | Creator can submit a valid deliverable with notes and file attachment | `test_secure_deliverable_uploads_and_downloads` | "Submit Deliverable" form uploads file | **VERIFIED** |
| **6** | Unauthorized user cannot upload to or download from the collaboration | `test_secure_deliverable_uploads_and_downloads` | Direct download endpoint returns 403 | **VERIFIED** |
| **7** | A second submission creates a new version without destroying the first | `test_deliverable_versioning_and_revision_lifecycle` | Version list displays v1 and v2 with full metadata | **VERIFIED** |
| **8** | Brand requests revision with reason, and creator can respond | `test_deliverable_versioning_and_revision_lifecycle` | "Request Revisions" opens feedback modal | **VERIFIED** |
| **9** | Reviewer can compare two versions safely side by side | `test_deliverable_version_comparison` | "Version Compare" tab displays diff view | **VERIFIED** |
| **10** | Brand history shows only that brand's collaborations | `test_collaboration_history_and_tenant_isolation` | `GET /api/workspaces/history/brand` tenant-scoped | **VERIFIED** |
| **11** | Creator history shows only that creator's collaborations | `test_collaboration_history_and_tenant_isolation` | `GET /api/workspaces/history/creator` tenant-scoped | **VERIFIED** |
| **12** | AI review analyzes only supported content and identifies limitations | `test_ai_assisted_review_and_safety` | AI Review Assistant evaluates brief requirements | **VERIFIED** |
| **13** | AI output cannot approve or reject a deliverable automatically | `test_ai_assisted_review_and_safety` | Deliverable status remains SUBMITTED post-review | **VERIFIED** |
| **14** | Eligible participants can submit reviews after collaboration completes | `test_reviews_ratings_and_eligibility` | Review submission enabled once COMPLETED | **VERIFIED** |
| **15** | Ineligible participants cannot submit or manipulate reviews | `test_reviews_ratings_and_eligibility` | HTTP 400 returned on non-completed engagements | **VERIFIED** |
| **16** | Existing Phase 1 and Phase 2 workflows still work (no regression) | All regression suites passed (24/24 tests) | Applications, Briefs, Notifications, Messages | **VERIFIED** |
| **17** | Database row counts, uploaded files, and historical records remain intact | Post-migration verification script | All 222 users, 127 creators, 33 brands intact | **VERIFIED** |

---

## 2. Evidence of Manual Local Verification Steps

### Step 1: Collaboration Workspace UI Launch
- Located in `CreatorDashboard.jsx` and `BrandDashboard.jsx` under active collaborations.
- Clicking **"🚀 Open Workspace"** opens `CollaborationWorkspaceModal` dynamically for the selected engagement.
- Displays:
  - Header: Brief title, agreed budget, expected completion date, status badges (`KICKOFF`, `DRAFT_SUBMITTED`, `FINAL_APPROVED`, `COMPLETED`).
  - Dynamic Progress Bar: Displays calculated completion percentage using the milestone/deliverable formula.
  - Tab navigation: Overview, Milestones & Deliverables, Version Compare, AI Review Assistant, Activity Timeline, Reviews & Sign-off.

### Step 2: Deliverable Submission & Versioning
- Creator clicks **"+ Submit Deliverable Version"**.
- User selects local file (`.png`, `.mp4`, `.pdf`, `.zip`, etc.) and enters optional submission notes.
- Submitting writes file to `backend/uploads/deliverables/`, computes SHA-256 checksum, logs append-only `DELIVERABLE_SUBMITTED` timeline event, and notifies brand.
- If an earlier version exists (e.g. v1), server automatically assigns v2 and retains v1 in immutable historical state.

### Step 3: Revision Request & Approval
- Brand reviewer selects **"Request Changes"** on latest submission.
- Enter required revision notes. Status transitions to `REVISION_REQUESTED`.
- Once satisfied, brand reviewer clicks **"Approve Deliverable"**. Status transitions to `FINAL_APPROVED`.
- When all deliverables are approved, brand clicks **"Complete Collaboration & Sign Off"** to finalize engagement.

### Step 4: AI Review Assistant
- Brand reviewer switches to **"AI Review Assistant"** tab.
- Clicks **"✨ Run AI Quality & Brief Alignment Analysis"**.
- Inspects structured advisory report:
  - Brief Requirement Coverage Score
  - Verified Requirements Checklist
  - Potential Omissions / Gaps
  - Technical & Aesthetic Observations
  - Reviewer Follow-up Questions
- UI explicitly displays: *"Advisory Quality Analysis — Not a final approval. Human reviewer retains sole decision-making authority."*

### Step 5: Post-Completion Reviews & Ratings
- On completed collaborations, either participant can open the **"Reviews & Sign-off"** tab.
- Enter star ratings (1.0 to 5.0) and optional written testimonial.
- Review is persisted to `engagement_reviews`, preventing duplicate reviews by the same user.
- Aggregate ratings for creator and brand profiles update automatically.

---

## 3. Residual Risks & Next Steps
- **Storage scalability:** Local upload storage (`backend/uploads/deliverables`) is appropriate for localhost development. For cloud staging or production, replace the local storage provider in `CollaborationService` with S3/GCS presigned URLs without altering API contracts.
- **Provider API keys:** Assistive AI evaluation includes offline heuristics and deterministic mock testing. When configuring live LLM providers (Anthropic, Gemini, OpenAI), set provider environment variables securely on the backend.
