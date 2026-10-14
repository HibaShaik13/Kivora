# Kivora — Chat Recovery Manual Testing Guide

**Version:** 1.0  
**Environment:** Localhost (`http://localhost:5173` / `http://localhost:8000`)  
**Purpose:** Step-by-step verification that clicking chat across Kivora works without blank screens or misattributed conversations.

---

## 1. Setup & Pre-Flight Checks

Ensure servers are running:
1. Backend: `uvicorn backend.app.main:app --reload --port 8000`
2. Frontend: `npm run dev` in `frontend/`

Open `http://localhost:5173` in a desktop browser (Chrome, Edge, Firefox, or Safari).

---

## 2. Test Step Checklist

### Step 1: Verify Public Exploration
1. Visit `http://localhost:5173`.
2. Confirm the home page renders with the header, cosmic hero graphics, and portfolio showcase.
3. Click **Discover Briefs** in the top navigation.
4. Confirm briefs load without errors.

### Step 2: Test Brief Chat Navigation as Creator (Primary Regression Path)
1. If not logged in, click **Sign In** and authenticate using Elena Rostova (`elena@kivora.dev`).
2. In the Creator Hub, open **Discover Briefs** or click the brief card:
   - **"Lumina Dewdrop Serum — Luxury Launch Campaign"**
3. In the brief modal, locate and click **💬 Chat with Lumina Skincare**.
4. **Expected Result:**
   - The application does **NOT** go blank.
   - The view switches to the **Messages & Chat** tab.
   - The top navigation bar remains visible.
   - The conversation list in the left sidebar highlights Lumina Skincare (`brief-c9d26a8efc`).
   - The chat header displays:
     - Partner: **Lumina Skincare**
     - Brief: **Lumina Dewdrop Serum — Luxury Launch Campaign**
     - Badge: **✓ Secure Verified Thread**
   - The message history for this campaign loads.

### Step 3: Test Real Message Sending
1. In the active Lumina Skincare chat, enter a test message:
   > *"Hello Lumina team, testing live collaboration thread."*
2. Click **Send 🚀** (or press Enter).
3. **Expected Result:**
   - The message renders immediately on the right side of the stream in purple with a timestamp.
   - The sidebar preview updates to reflect the latest message text.
   - Refreshing the page (F5) retains the message in the history.

### Step 4: Test Multi-Conversation Selection
1. Click another conversation in the left sidebar (e.g. Elena's second brief with Lumina or Marcus Vance's thread if in brand portal).
2. **Expected Result:**
   - Active selection switches cleanly to the newly clicked thread.
   - The header updates to show the new campaign title.
   - The previous navigation context does not force the selection back.

### Step 5: Test Brand Portal Chat Entry Point
1. Log in or switch to the brand account (Lumina Skincare: `lumina@kivora.dev`).
2. In the Brand Portal, navigate to **Matched Creators** or **Active Collaborations**.
3. Locate **Marcus Vance** (or Elena Rostova).
4. Click **💬 Chat with Creator**.
5. **Expected Result:**
   - Messages opens directly to Marcus Vance's conversation.
   - Elena Rostova (the first sidebar item) is **not** selected by default.
   - Header shows Marcus Vance and the relevant packaging brief.

### Step 6: Test Ineligible / Blocked Relationship
1. As a Creator, open an unapplied public brief where no invitation or accepted pitch exists.
2. Click **💬 Chat with Brand**.
3. **Expected Result:**
   - A clear advisory displays: *"Conversation unlocks once your pitch is accepted by the brand."*
   - The view does **NOT** crash, go blank, or open an unrelated thread.

---

## 3. Success Sign-Off Criteria

- [x] No blank page or unmounted root at any point during navigation.
- [x] Chat with Lumina Skincare selects the exact intended campaign thread.
- [x] Messages persist and send through the real API.
- [x] Application shell (Navbar, Dashboards) remains resilient.
- [x] Database `kivora.db` preserved intact without data loss.
