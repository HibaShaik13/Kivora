# Kivora — Creator Hub Messages & Saved Briefs Manual Test Checklist
**Local Verification Guide for Chrome / Edge**
**Local Dev URLs:**
- Frontend: `http://localhost:5173`
- Backend API Docs: `http://localhost:8000/docs`

---

## Pre-Requisites & Seed Accounts

The following demo accounts exist in the working database (`kivora.db`):
- **Creator (Elena Rostova)**: `elena@elenarostova.demo` (Password: `SecurePassword123!`)
- **Creator (Marcus Vance)**: `marcus@marcusvance.demo` (Password: `SecurePassword123!`)
- **Creator (Kai Tanaka)**: `kai@kaitanaka.demo` (Password: `SecurePassword123!`)
- **Brand (Lumina Skincare)**: `creative@luminaskincare.demo` (Password: `SecurePassword123!`)

---

## TASK A: Creator Hub Connected Messages & Chat Checklist

### Step A1: Verify Connected Brand Contacts List
1. Navigate to `http://localhost:5173` in an incognito window.
2. Sign in as creator **Marcus Vance** (`marcus@marcusvance.demo` / `SecurePassword123!`).
3. Click **💬 Messages & Chat** in the Creator Hub sidebar.
4. **Expected:**
   - Conversation sidebar lists **Lumina Skincare**.
   - Campaign title displays **"Lumina Packaging Showcase"** (or active campaign title).
   - Brand logo renders cleanly with proper styling.
   - Message timestamp and last-message preview are visible.

### Step A2: Switch Between Multiple Brand Conversations
1. Sign in as creator **Elena Rostova** (`elena@elenarostova.demo` / `SecurePassword123!`).
2. Open **💬 Messages & Chat**.
3. **Expected:**
   - Multiple eligible conversations are displayed.
   - Clicking between conversations switches the chat thread and updates the header with the active brand's identity.
   - Message histories do not bleed into each other.

### Step A3: Real-Time Messaging & Brand Reply
1. In Marcus Vance's chat window with Lumina Skincare, type: `"Hello Lumina team, we are ready for review."` and click **Send**.
2. **Expected:** Message appears immediately on the right with a blue/purple bubble and "Just now" timestamp.
3. In a separate browser profile / incognito window, sign in as brand **Lumina Skincare** (`creative@luminaskincare.demo`).
4. Navigate to the Brand Portal Messages.
5. Select Marcus Vance's conversation thread.
6. **Expected:** Marcus's message is visible.
7. Reply as Lumina: `"Looks great Marcus, proceed with rendering."` and click **Send**.
8. Switch back to Marcus Vance's browser window.
9. **Expected:** Lumina's reply appears within 5 seconds (via polling) or on clicking the conversation refresh button `↻`.

### Step A4: Refresh & Persistence
1. Press `F5` (browser refresh) in Marcus Vance's window.
2. **Expected:**
   - Stays on the Creator Hub (persisted via `kivora_current_view` and `kivora_creator_tab`).
   - Messages conversation list and message history reload with all messages intact.

### Step A5: Tenant Isolation & Security
1. Sign in as an unrelated creator, e.g. **Kai Tanaka** (`kai@kaitanaka.demo`).
2. Open **💬 Messages & Chat**.
3. **Expected:** Marcus Vance's and Elena Rostova's conversations are NOT visible.
4. Open browser DevTools Network tab. Attempting to call `GET /api/messages/conversations/conv-01e7795be5/messages` returns `404 Not Found`.

---

## TASK B: Creator Hub Saved Briefs Checklist

### Step B1: Bookmark a Brief from "Discover Briefs"
1. Sign in as creator **Marcus Vance** or **Elena Rostova**.
2. Click **✨ Discover Briefs** in the Creator Hub sidebar.
3. Locate an open brief card (e.g. *Aura Horizon* or *Lumina* campaign).
4. Click the bookmark ribbon icon `🔖` in the top-right corner of the brief card.
5. **Expected:**
   - The bookmark icon immediately changes to active purple state with tooltip "Saved to Hub".
   - The sidebar badge count for **🔖 Saved Briefs** increments by 1.

### Step B2: View Saved Brief in "Saved Briefs" Page
1. Click **🔖 Saved Briefs** in the Creator Hub sidebar.
2. **Expected:**
   - The bookmarked brief appears in the 2-column responsive grid.
   - Card displays:
     - Brand logo and brand company name.
     - Category and format pill (e.g. `16:9 • VIDEO`).
     - Brief title and campaign objective.
     - Budget amount in purple font (`$N USD`).
     - "View Brief →" action button.
     - "✕ Remove" button.

### Step B3: Page Refresh Persistence
1. While on the **Saved Briefs** tab, press `F5` (browser refresh).
2. **Expected:**
   - The user remains logged in on the Creator Hub's **Saved Briefs** tab.
   - The saved brief remains present in the list.
   - The sidebar count remains unchanged.

### Step B4: Unsave Brief from Saved Tab
1. On the Saved Briefs tab, click **✕ Remove** on the saved brief card.
2. **Expected:**
   - A success banner appears: `✓ Brief removed from saved bookmarks.`
   - The brief disappears from the list immediately.
   - The sidebar badge count decrements by 1.
   - If 0 saved briefs remain, the empty state displays: *"No saved briefs yet"* with a button to *"Discover Open Briefs →"*.

### Step B5: Unsave from "Discover Briefs" Card
1. Bookmark an open brief from **Discover Briefs**.
2. Click the bookmark icon again to unsave it.
3. **Expected:**
   - The bookmark reverts to the unbookmarked outline state.
   - The sidebar badge count decrements immediately.

### Step B6: Account Isolation
1. Sign in as **Elena Rostova**. Save brief A.
2. Sign in as **Marcus Vance** in another incognito session.
3. Navigate to **Saved Briefs**.
4. **Expected:** Elena's saved brief A does NOT appear in Marcus's saved briefs tab.
