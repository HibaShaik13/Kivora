# Kivora — Phase 1 Marketplace Manual Test Checklist

This checklist provides step-by-step verification instructions to test all corrected workflows in the browser in the safest order.

---

## Prerequisites
1. Ensure the backend is running at `http://127.0.0.1:8000`:
   ```bash
   cd backend && python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
2. Ensure the frontend is running at `http://localhost:5173`:
   ```bash
   cd frontend && npm run dev
   ```
3. Open `http://localhost:5173` in a modern web browser.

---

## Test Suite 1: Creator Profile Presentation & Sizing
1. Navigate to **Discover Creators** in the navbar.
2. Click on any creator card (e.g. Elena Rostova or Marcus Vance).
3. **Verify:**
   - The profile dialog opens with constrained dimensions (max width 840px, max height 90vh).
   - Content area scrolls cleanly without dual/nested scrollbars or page overflow.
   - Real creator data is displayed: name, handle, bio, hourly rate, min budget, skills, and tools.
   - No literal `undefined`, `null`, or hardcoded fake reviews appear.
   - If the creator has no portfolio projects, a clean empty state is shown; if projects exist, real portfolio cards appear.
4. Close the modal by clicking the "×" close button or outside the modal.
5. Click a second creator card.
6. **Verify:** The second creator's actual data loads immediately with no stale data from the previous creator.

---

## Test Suite 2: Portfolio Image & Video Viewers
1. While viewing a creator profile with portfolio projects, click on an image project.
2. **Verify:**
   - The viewer modal opens with balanced dimensions (max width 920px).
   - The image renders clearly, respecting aspect ratio with `object-fit: contain`.
   - Resolution, aspect ratio, content type, and commercial rights chips are clearly displayed.
3. Close the modal and click on a video project.
4. **Verify:**
   - The video viewer opens with native controls (`play`, `pause`, `volume`, `fullscreen`).
   - If a thumbnail/poster exists, it displays before playback.
   - If the video source is missing or undecodable, an honest fallback with a direct link is shown.
5. Close the viewer and confirm main page scrolling is restored.

---

## Test Suite 3: Campaign Brief Reference Asset Upload & Display
1. Log in as a brand (or create a brand account).
2. Click **Create Brief** (or **+ Post Campaign Brief**).
3. Fill in required fields (Title, Objective, Content Type, Budget, etc.).
4. Under the reference upload section, upload a sample moodboard image (`.png` or `.jpg`).
5. Confirm the upload succeeds and preview appears in the creation form.
6. Submit and publish the brief.
7. Open the newly published brief from the **Campaign Briefs** explorer.
8. **Verify:**
   - The **REFERENCE MOODBOARD / ASSET** section appears in the brief detail modal.
   - The image preview renders cleanly with a link to view full size or download.
9. Refresh the page and reopen the brief.
10. **Verify:** The reference asset persists across page reloads.

---

## Test Suite 4: Brand-Side "Invite to Brief"
1. While logged in as a brand with at least one active brief, navigate to **Discover Creators**.
2. Open any creator's profile.
3. Click the purple **Invite to Brief** button.
4. **Verify:**
   - The modal does NOT hang indefinitely on "Loading your active briefs...".
   - The brand's active briefs are listed in the dropdown or selection list.
5. Select a brief, enter an optional message, and click **Send Invitation**.
6. **Verify:**
   - A success confirmation appears.
   - The modal closes cleanly.
7. Attempt to invite the exact same creator to the same brief again.
8. **Verify:** A clean error message indicates that an invitation already exists without breaking the UI.

---

## Test Suite 5: Matched Creators Clickable from Brief View
1. Open any campaign brief from the Briefs Explorer or Brand Dashboard.
2. Scroll to the **RECOMMENDED CREATORS** / **AI MATCHING** section.
3. Hover over a matched creator card.
4. **Verify:** The creator card and the "View Profile →" link are clearly clickable.
5. Click on the matched creator.
6. **Verify:**
   - The creator's actual profile modal opens.
   - Real skills, tools, rates, and portfolio records match that exact creator.
7. Close the creator profile modal.
8. **Verify:** The original brief detail view remains open without losing context.

---

## Test Suite 6: Saved Creators End-to-End
1. In **Discover Creators**, find a creator you have not yet saved.
2. Click the bookmark heart icon on the card.
3. **Verify:**
   - The heart immediately fills with active purple color.
4. Refresh the page (`F5`).
5. **Verify:** The heart remains filled/saved.
6. Navigate to the **Saved Creators** tab in the Brand Portal.
7. **Verify:** The saved creator appears in your roster.
8. Click the heart icon again to unsave the creator.
9. **Verify:** The creator is removed from the saved roster and the heart icon returns to outline state.

---

## Test Suite 7: Messaging Inbox & Conversation Discovery
1. Log in as a brand that has an existing engagement or accepted application.
2. Navigate to **Messages** in the dashboard.
3. **Verify:**
   - The inbox does NOT show "0 Active / No conversations yet".
   - Active collaboration conversations appear with the creator's real name and avatar.
4. Click on a conversation to open the thread.
5. Send a test message: "Hello! Testing collaboration kickoff."
6. **Verify:**
   - The message renders immediately in the chat thread.
7. Refresh the page.
8. **Verify:** The sent message persists with the correct timestamp.

---

## Test Suite 8: Brand Guard Against Self-Pitching
1. Log in as a brand.
2. Open a brief that is owned by your brand.
3. **Verify:**
   - There is NO "Submit Application Pitch" or "Apply Now" form.
   - Instead, the Brand Desk management actions (View Applications, Matched Creators, Manage Brief) appear.
4. Open a brief owned by another brand (or log out and view as guest).
5. **Verify:** The creator pitch form is only presented to logged-in creator accounts.

---

## Test Suite 9: Explainable Creator Matching
1. Open a campaign brief requiring specific creative skills (e.g. 3D Generative Video, Runway Gen-2).
2. Examine the recommended creators and match scores.
3. **Verify:**
   - The match percentage is bounded between 0% and 100%.
   - The listed reasons (e.g., "Mastery in required skill...", "Demonstrated native 16:9 production") correspond to actual fields in the creator's profile.
   - Creators missing required skills list those specific missing requirements under "Potential Gaps".
   - Scores and reasons do not contradict each other.
