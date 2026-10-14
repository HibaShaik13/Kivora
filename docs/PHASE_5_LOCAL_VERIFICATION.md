# KIVORA — PHASE 5 LOCAL MANUAL VERIFICATION GUIDE

This document provides step-by-step instructions for testing and validating the Phase 5 AI Intelligence, Explainable Matching, and AI-Assisted Workflows in the local Kivora development environment.

---

## 1. Prerequisites & Server Status

Ensure both backend and frontend development servers are active:

### Backend
```powershell
# From project root:
uvicorn backend.app.main:app --reload --port 8000
```
- API Base: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`

### Frontend
```powershell
# From frontend/ directory:
npm run dev
```
- App URL: `http://localhost:5173`

---

## 2. Test Workflow 1 — Brand Matched-Creator Experience (T05.2 & T05.3)

### Goal
Verify that brands see explainable, calibrated creator matches on published briefs with transparent sub-scores, data coverage, and working navigation.

### Steps
1. Navigate to `http://localhost:5173`.
2. Sign in as a Brand (or use the quick switch / demo brand account: `elena@luminaskincare.com` / `password123` or your active brand user).
3. On the **Brand Portal**, open **Campaigns / My Briefs**.
4. Click on an active published brief, such as **"Lumina Dewdrop Serum — Luxury Launch Campaign"**.
5. Scroll down to the **"Top Matched Creators"** section.
6. Verify the presentation of matched creators:
   - **Match Score & Tier:** Displays calibrated percentage and badge (e.g., `88% — Strong Match`).
   - **Data Coverage:** Displays badge (e.g., `86% Data Coverage`).
   - **Factor Breakdown:** Sub-score pills displaying `Skill: 85%`, `Tool: 80%`, `Budget: 100%`.
   - **Match Reasons:** Bullet points detailing matching skills, tools, and content formats.
   - **Portfolio Projects:** Badges showing relevant creator portfolio projects that informed the score.
7. Click **"View Profile"** on a matched creator (e.g., *Maya Chen*):
   - The creator's detailed modal opens with their verified bio, portfolio pieces, rates, and skills.
   - Verify that closing the profile returns cleanly to the campaign brief.
8. Test **"Chat"** or **"Invite to Brief"**:
   - Verify that permissions and contextual conversation rules function correctly.

---

## 3. Test Workflow 2 — Creator Smart Opportunities & Match Explanations (T05.4)

### Goal
Verify that creators receive personalized brief recommendations with transparent match explanation panels and non-guarantee disclosures.

### Steps
1. Navigate to `http://localhost:5173`.
2. Sign in as a Creator (e.g., *Maya Chen* / `maya@creator.com` or your active creator account).
3. On the **Creator Hub**, navigate to the **Dashboard**.
4. Locate the **"Smart Opportunities"** section.
5. On any recommended brief card:
   - Confirm the match badge (e.g., `85% Match`).
   - Click the **"Explain Match ▼"** button to expand the explanation panel.
6. Verify the contents of the explanation panel:
   - **Why this matches you:** Shows positive alignments (e.g., *Matches your 3D Motion skill*, *Matches Cinema 4D tool*).
   - **Specifications:** Displays deliverable specs (e.g., format: `9:16 Video`, budget compatibility: `Within rate limit`).
   - **Missing Requirements / Warnings:** If any skills are unlisted on the creator profile, shows them honestly.
   - **Disclaimers:** Displays *“Match scores reflect algorithmic capability alignment and do not guarantee contract acceptance.”*
7. Click **"Explain Match ▲"** to collapse the panel cleanly.

---

## 4. Test Workflow 3 — Grounded AI-Assisted Proposal/Pitch (T05.6)

### Goal
Verify that creators can generate grounded, factual pitches using their actual portfolio and skill evidence without hallucinated credentials.

### Steps
1. In the **Creator Hub**, navigate to **Discover Briefs**.
2. Select any open campaign brief and click **"View Details"**.
3. In the brief modal, click **"Apply to Brief"**.
4. In the application drawer, locate the pitch text area.
5. Click the **"✨ Assist Pitch with AI"** button.
6. Observe the operation:
   - Button enters loading state (*"Drafting grounded pitch..."*).
   - The backend calls `POST /api/match/briefs/{brief_id}/assist-pitch`.
   - The pitch text area populates with a customized pitch.
7. Verify the generated pitch:
   - Factual references to the creator's actual portfolio pieces (e.g., references to Maya's real projects).
   - Cites actual software and skills from the creator's profile.
   - Proposes a rate aligned with the brief's budget and creator's day rate.
   - A banner appears: *"Drafted with Google Gemini (or Deterministic Synthesizer). Please review and edit before submitting."*
8. Edit the pitch text manually:
   - Verify the textarea is completely editable.
   - Submission remains manual and under the creator's control.

---

## 5. Test Workflow 4 — AI-Assisted Campaign Brief Builder (T05.5)

### Goal
Verify that brands can draft and refine briefs with AI or fallback assistance while retaining total publishing control.

### Steps
1. Sign in to the **Brand Portal**.
2. Click **"Create Brief"** or open the brief creation workflow.
3. Click the **"✨ AI Assist"** button to launch the AI Brief Builder modal.
4. Input a prompt (e.g., *"4K CGI product animation for a luxury botanical serum launch"*).
5. Click **"Generate Brief"**:
   - If `GEMINI_API_KEY` is active: Generates via Gemini with structured JSON output.
   - If offline / no key: Fallback executes deterministically via `Deterministic Synthesizer`.
6. Verify generated fields:
   - Campaign objective, style direction, deliverables, content format, required skills, tools, and budget guidance.
   - Engine badge indicates the source engine accurately.
7. Click **"Insert into Brief"**:
   - The brief builder form fills with the generated fields.
   - Confirm that the brief remains in **DRAFT** status until the brand clicks **"Publish Campaign"**.

---

## 6. Test Workflow 5 — Tenant Isolation & Draft Privacy (T05.7)

### Goal
Verify that unpublished drafts are strictly private and cannot be discovered or matched by unauthorized users.

### Steps
1. Sign in as Brand A and create a brief in **DRAFT** status.
2. Sign in as a Creator:
   - Search **Discover Briefs** -> The draft brief does NOT appear.
   - Check **Smart Opportunities** -> The draft brief does NOT appear.
3. Call `GET /api/match/briefs/{draft_brief_id}/creators` as an unauthorized user or unauthenticated client:
   - Returns `403 Forbidden` (`Draft brief matches are only accessible by the campaign owner.`).
