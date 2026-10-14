# KIVORA — PHASE 2 LOCALHOST VERIFICATION GUIDE
## Step-by-Step Manual & Functional Verification Checklist

**Environment:** Localhost Development  
**Frontend URL:** `http://localhost:5173`  
**Backend API URL:** `http://127.0.0.1:8000`  
**Database:** `kivora.db` (SQLite, preserved at revision `3354a2dad2da`)  

---

## 1. Localhost Running Services Check

Both the frontend Vite dev server and the backend FastAPI uvicorn server are continuously running in local development mode:
- Backend: `python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`
- Frontend: `npm run dev` (`http://localhost:5173`)

---

## 2. Step-by-Step Functional Verification Scenarios

### Scenario 1: User A Notification Lifecycle & Bell Badge
1. Log in as a creator user (e.g., `sophia.chen@example.com` or registered creator).
2. Observe the Notification Bell in the Navbar with live unread badge.
3. Click the bell to open the Notification Drawer.
4. Verify empty state displays when there are no notifications.
5. Trigger a notification (e.g. by applying to a brief or receiving an invitation).
6. Verify the badge shows `1` (or count up to `99+` if over 99).
7. Click "Mark as read" on the notification.
8. Verify unread count decrements to `0`.

### Scenario 2: Cross-User Notification Access Denial
1. Obtain notification ID `ntf-123` belonging to User A.
2. Log in as User B (`marcus.vance@example.com`).
3. Attempt to fetch or delete `ntf-123` via `PATCH /api/notifications/ntf-123/read` or `DELETE /api/notifications/ntf-123`.
4. Verify the backend responds with `404 Not Found` (preventing IDOR and resource enumeration).

### Scenario 3: Real Marketplace Application Notification
1. Log in as a creator and apply to an active brief owned by a brand (e.g., "Aura Skincare Launch").
2. Log in as the brand owner.
3. Check the brand's notification bell: observe notification titled `"New Application: Aura Skincare Launch"` with creator name and direct link.

### Scenario 4: Brand-to-Creator Invitation Workflow
1. Log in as a brand user (e.g., `elena.rostova@example.com`).
2. Navigate to Creator Discovery or open a Creator Profile card (e.g., Sophia Chen).
3. Click "Invite ✉️" or "Invite to Brief ✉️".
4. The `InviteCreatorModal` opens displaying the brand's active campaign briefs in a dropdown.
5. Select a brief, set a proposed rate (e.g. `$5,000`), and enter a custom note.
6. Click "Send Invitation".
7. Verify success toast appears. Attempting to re-invite the same creator returns an alert: "A pending invitation already exists".

### Scenario 5: Creator Responds to Invitation
1. Log in as the invited creator.
2. Check the Notification Bell: verify `"Collaboration Invitation: <Brief Title>"` is present.
3. Go to Creator Dashboard -> "Invitations" tab.
4. View the invitation card with brand details, brief title, proposed fee, and status `"INVITED"`.
5. Click "Accept Invitation":
   - Invitation transitions to `"ACCEPTED"`.
   - Engagement is automatically initialized with status `"KICKOFF"`.
   - A direct discussion thread is established in the Messages Inbox.

### Scenario 6: Unauthorized Invitation Manipulation
1. As an unrelated creator, attempt to invoke `POST /api/engagements/invitations/<id>/accept` targeting another creator's invitation ID.
2. Verify the server returns `403 Forbidden: You cannot accept an invitation addressed to another creator`.

### Scenario 7: Email Fallback Verification
1. When invitations or notifications are dispatched in local development without SMTP credentials:
2. Inspect the backend terminal logs.
3. Observe explicit sanitized dev log entry:
   `==> [DEV MARKETPLACE EMAIL FALLBACK] To: <email> | Subject: <subject> | Title: <title>`
4. Confirm response explicitly sets `"sent": False` and `"status": "development_fallback"`.

### Scenario 8: Direct Peer-to-Peer Messaging
1. Open the Messages view via the Navbar shortcut or Dashboard "Messages" tab.
2. Select the active conversation between the brand and creator.
3. Send a message: "Hi! Excited to kick off the master render."
4. Verify the message immediately appears in the conversation history with UTC timestamp and "Delivered" indicator.
5. Log in as the recipient.
6. Observe the unread message badge in the Navbar and Messages tab.
7. Open the conversation: unread status clears automatically.

### Scenario 9: Cross-User Messaging Protection & XSS Defense
1. Send a message containing `<script>alert('pwned')</script>`.
2. Inspect network response: content is safely escaped to `&lt;script&gt;alert('pwned')&lt;/script&gt;`.
3. Verify the message renders harmlessly as literal text in the browser.
4. Attempt to fetch messages for this conversation using an unauthorized user's bearer token.
5. Verify `404 Not Found`.

### Scenario 10 & 11: Saved Creators & Saved Briefs Bookmarks
1. As a creator, click the bookmark icon on any brief card.
2. Observe bookmark icon fills purple.
3. Navigate to Creator Dashboard -> "Saved Briefs" tab.
4. Verify the saved brief is listed. Clicking the bookmark icon again removes it.
5. As a brand, click the bookmark icon on any creator card.
6. Navigate to Brand Dashboard -> "Saved Creators" tab.
7. Verify the saved creator card is present.

### Scenario 12 & 13: Smart Opportunity Discovery & Preference Guards
1. Log in as a creator and open Creator Dashboard -> "Opportunities" tab.
2. Click "Refresh Matches".
3. Verify matched briefs appear with match percentage (e.g., `85% Compatibility`) and explainable justification bullets (e.g., "Demonstrated native 16:9 production experience").
4. Update preferences (e.g., raise minimum budget to `$10,000`).
5. Re-run matching: verify lower-budget briefs are filtered out cleanly.

### Scenario 14: Marketplace Regression Integrity
1. Navigate through Category Discovery, Creator Search, Brief Discovery, Application Submission, and Deliverable Review.
2. Confirm all Phase 0 and Phase 1 flows operate without regression.

### Scenario 15: Database Consistency & Migration Integrity
1. Run table count check:
   `python -c "import sqlite3; conn = sqlite3.connect('kivora.db'); c = conn.cursor(); print(c.execute('SELECT COUNT(*) FROM users').fetchone()[0])"`
2. Verify total users = `222`, creator profiles = `127`, briefs = `170`.
3. Verify Alembic migration version = `3354a2dad2da`.
