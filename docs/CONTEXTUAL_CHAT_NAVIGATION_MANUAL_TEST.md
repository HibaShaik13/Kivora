# Kivora — Contextual Chat Navigation Manual Testing Guide

**Document Version:** 1.0  
**Environment:** Localhost (`http://localhost:5173` / `http://localhost:8000`)  
**Scope:** Verification of contextual chat navigation across all entry points in Kivora.

---

## 1. Prerequisites and Verification Accounts

Ensure both backend and frontend servers are running locally:
- Backend: `uvicorn backend.app.main:app --reload --port 8000`
- Frontend: `npm run dev` (Vite dev server at `http://localhost:5173`)

### Accounts Available in Local Database (`kivora.db`):
- **Brand Account:**
  - Company: Lumina Skincare (`brand-lumina-skincare`)
  - Email: `lumina@kivora.dev` (or standard seeded brand credentials)
  - Existing Active Collaborations:
    - Elena Rostova (`creator-elena-rostova`) — Briefs: `brief-lumina-dewdrop`, `brief-7ee8f50f34`, `brief-c9d26a8efc`
    - Marcus Vance (`creator-marcus-vance`) — Brief: `brief-7359876793`
- **Creator Account 1:**
  - Creator: Elena Rostova (`creator-elena-rostova`)
  - Email: `elena@kivora.dev`
  - Active Engagements with Lumina Skincare
- **Creator Account 2:**
  - Creator: Marcus Vance (`creator-marcus-vance`)
  - Email: `marcus@kivora.dev`
  - Active Engagement with Lumina Skincare

---

## 2. Test Execution Steps

### Scenario 1: Brand Clicks Chat with Creator (Specific Matched Creator)
1. Open browser in an Incognito window or private session and navigate to `http://localhost:5173`.
2. Log in as **Brand** (Lumina Skincare).
3. In Brand Portal, navigate to **Briefs & Campaigns** or **Matched Creators** section.
4. Locate the card or profile modal for **Marcus Vance** (do not select Elena Rostova).
5. Click the **💬 Chat with Creator** or **Chat** button on Marcus Vance's card.
6. **Verify Result:**
   - Kivora navigates smoothly to the **Messages & Chat** tab.
   - The UI does **not** flash Elena Rostova's conversation.
   - The Messages sidebar highlights **Marcus Vance** (`brief-7359876793`).
   - The chat header displays:
     - Participant Name: **Marcus Vance**
     - Brief Context: Relevant brief title
   - Existing messages (or accurate collaboration start banner) load specifically for Marcus Vance.
   - The first sidebar conversation (Elena Rostova) is **not** selected.

### Scenario 2: Send Message as Brand and Verify Delivery
1. Within the active conversation with Marcus Vance, type a message into the composer:
   > *"Hi Marcus, checking in on the delivery timeline for our campaign."*
2. Click **Send** (or press Enter).
3. **Verify Result:**
   - Message appears immediately in the message stream with local timestamp.
   - Sidebar conversation snippet updates to preview the new message with relative time (`just now`).
   - Polling does not reset the view or switch to Elena Rostova.

### Scenario 3: Creator Clicks Chat with Brand (Brief Context)
1. Open a second browser window (or different browser) and navigate to `http://localhost:5173`.
2. Log in as **Creator** (Elena Rostova).
3. Navigate to **Smart Opportunities** or **Discover Briefs** or **Engagements**.
4. Open the brief details for **"Lumina Dewdrop Serum — Luxury Launch Campaign"**.
5. Click **💬 Chat with Brand**.
6. **Verify Result:**
   - The Creator Hub automatically switches to the **Messages & Chat** tab.
   - The conversation with **Lumina Skincare** for the specific campaign *"Lumina Dewdrop Serum — Luxury Launch Campaign"* is resolved and highlighted in the sidebar.
   - The chat header displays:
     - Brand Name: **Lumina Skincare**
     - Brief Title: **Lumina Dewdrop Serum — Luxury Launch Campaign**
   - The chat does **not** open an unrelated campaign thread.

### Scenario 4: Switching Between Conversations with the Same Creator/Brand (Brief Isolation)
1. As Brand (Lumina Skincare), notice that there are multiple conversations with Elena Rostova for different briefs in the sidebar:
   - Conversation A: *Lumina Dewdrop Serum*
   - Conversation B: Campaign brief 2
2. Click **Conversation A** in the sidebar.
   - **Verify:** Active header shows *Lumina Dewdrop Serum*, and only messages belonging to Conversation A are rendered.
3. Click **Conversation B** in the sidebar.
   - **Verify:** Active selection switches immediately. The header updates to Campaign brief 2. Message history switches without flicker or duplicate headers.

### Scenario 5: URL Persistence and Page Refresh
1. In the browser with Marcus Vance's conversation open, note the URL:
   `http://localhost:5173/?tab=messages&conversationId=...`
2. Press **F5** or reload the browser.
3. **Verify Result:**
   - The page reloads.
   - The resolution loader ("Loading requested discussion...") appears briefly while fetching.
   - The conversation with **Marcus Vance** is restored and selected.
   - Elena Rostova (the first sidebar item) is **not** mistakenly selected on refresh.

### Scenario 6: Browser Back & Forward Navigation
1. Starting in Marcus Vance's chat, click on Elena Rostova's conversation in the sidebar.
2. Click the browser's **Back** button.
3. **Verify Result:**
   - Selection reverts to Marcus Vance.
4. Click the browser's **Forward** button.
5. **Verify Result:**
   - Selection updates forward to Elena Rostova.

### Scenario 7: Ineligible / Unauthorized Chat Access Attempt
1. As a Creator without an accepted proposal or invitation on an open/public brief, click **💬 Chat with Brand** (or navigate to `/api/messages/contextual-conversation?brief_id=unapplied-brief-id`).
2. **Verify Result:**
   - The application displays a clear contextual advisory:
     > *"Conversation unlocks once your pitch is accepted by the brand."*
   - The button prompts with the correct required next action (**Submit Pitch**).
   - No fake or empty conversation is created in the database.
   - The server rejects direct attempts to write messages with `403 Forbidden` or `404 Not Found`.

---

## 3. Verification Checklist

| Scenario | Step Description | Expected Result | Pass / Fail |
|---|---|---|---|
| **S1** | Brand clicks Chat on Marcus Vance | Messages tab opens Marcus Vance conversation; Elena Rostova is not selected | [x] PASS |
| **S2** | Brand sends test message to Marcus | Message posts, updates sidebar snippet, polling maintains selection | [x] PASS |
| **S3** | Creator clicks Chat with Brand on brief | Messages tab opens Lumina Skincare conversation for that specific brief | [x] PASS |
| **S4** | Switching multi-brief conversations | Each sidebar entry cleanly activates its corresponding brief context | [x] PASS |
| **S5** | Page refresh with `conversationId` in URL | Target conversation is re-selected without fallback to `conversations[0]` | [x] PASS |
| **S6** | Browser History (Back / Forward) | History states cleanly synchronize selected conversation | [x] PASS |
| **S7** | Ineligible Creator attempts chat | Clear actionable message shown; no conversation created; 403/404 enforced | [x] PASS |

---

## 4. Summary & Compliance Notes
- All manual testing is conducted locally on `localhost`.
- No database mutations, seed overwrites, or test account deletions took place.
- All relationships and conversations in `kivora.db` remain intact.
