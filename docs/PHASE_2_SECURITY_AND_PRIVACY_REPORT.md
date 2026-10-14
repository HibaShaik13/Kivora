# KIVORA — PHASE 2 SECURITY & PRIVACY AUDIT REPORT
## Access Control, IDOR Defense, Message Sanitization & Data Protection

**Date:** October 12, 2026  
**Auditor:** Principal Application Security Engineer  
**Scope:** Phase 2 Backend APIs, Messaging Layer, Notifications, and Database Persistence  

---

## 1. Threat Modeling & Security Controls

Phase 2 introduces user-generated content (messages, pitch text), sensitive business events (deliverable status, offer rates), and personalized communication channels. Each component was evaluated against standard OWASP API Security Top 10 vulnerabilities.

### 1.1 Insecure Direct Object References (IDOR) & Relationship Authorization
- **Notifications:** Every notification query filters strictly by `Notification.user_id == current_user.id`. Any attempt to read, mark read, or delete another user's notification returns `404 Not Found` (rather than `403 Forbidden`) to prevent resource enumeration.
- **Invitations:**
  - Brands can only invite creators to briefs where `brief.brand_id == current_user.brand_profile.id`.
  - Only the invited creator (`invitation.creator_id == current_user.creator_profile.id`) can accept or decline an invitation. An unrelated creator receives `403 Forbidden`.
  - Accepting an already-accepted or already-declined invitation is rejected server-side (`400 Bad Request`).
- **Conversations & Messaging:**
  - Conversations are strictly constrained to pairs with an authorized collaboration context (`brand_id` and `creator_id`).
  - Listing messages requires verified membership: `conversation.creator_id == current_user.creator_profile.id` or `conversation.brand_id == current_user.brand_profile.id`. Non-members receive `404 Not Found`.
  - Message posting validates membership and active participation. Unrelated users receive `403 Forbidden`.
- **Saved Items:**
  - Creators cannot bookmark other creators (`403 Forbidden`).
  - Brands cannot bookmark briefs (`403 Forbidden`).
  - Users can only delete their own bookmarks.
  - Attempting to bookmark a draft or unpublished brief returns `404 Not Found` to prevent draft discovery.

---

### 1.2 Cross-Site Scripting (XSS) & Content Sanitization
- **Message Content:**
  - All incoming message payloads pass through Python's standard `html.escape()` before persistence.
  - Payloads containing malicious HTML tags (e.g., `<script>alert(1)</script>`) are stored as safe entities (`&lt;script&gt;alert(1)&lt;/script&gt;`).
  - Frontend renders message content strictly using text nodes (`p` and `div` elements with React standard JSX escaping), never `dangerouslySetInnerHTML`.
- **Length & Payload Limits:**
  - Message bodies are bounded to a maximum length of 4,000 characters.
  - Invitation messages are bounded to 1,000 characters.

---

### 1.3 Confidentiality & Information Leakage
- **Draft Brief Privacy:**
  - The opportunity discovery engine (`OpportunityService`) explicitly restricts matching queries to `Brief.status.in_(["ACTIVE", "PUBLISHED", "OPEN"])`.
  - Draft, internal, or archived briefs are never evaluated, alerted, or exposed in opportunity feeds.
- **Sensitive Metadata Protection:**
  - Private JWT tokens, email verification codes, database credentials, and raw passwords are never logged or stored in notification text or message metadata.
  - Email notification templates render high-level milestone notifications without dumping entire private conversation payloads or confidential contract clauses.

---

### 1.4 Email Delivery Integrity & Abuse Controls
- **Delivery State Honesty:**
  - The `EmailService` adheres to strict truthfulness: when external SMTP or Resend credentials are not configured or encounter provider failures, emails fall back to the safe development console.
  - The returned delivery state explicitly flags `"sent": False` and `"status": "development_fallback"`. Kivora never claims an email was delivered merely because it was attempted.
- **Bounded Retries:**
  - Network provider dispatch is bounded to a maximum of 2 retry attempts with sanitization of provider error responses.
- **User Preference Enforcement:**
  - Alert dispatch respects `AlertPreference.email_alerts_enabled` and `AlertPreference.in_app_alerts_enabled`. If disabled by the user, email dispatch is suppressed.

---

## 2. Security Test Evidence

The automated security test suite `backend/tests/test_phase2_workflows.py` verified the following attack scenarios under an isolated SQLite in-memory environment:

1. **Cross-User Notification Access Denial:** Confirmed that User B cannot read or delete notifications belonging to User A (`404 Not Found`).
2. **Unauthorized Invitation Manipulation:** Confirmed that an unrelated creator cannot accept another creator's invitation (`403 Forbidden`).
3. **Cross-User Conversation Snoop:** Confirmed that a third-party creator cannot access messages or send messages in a brand–creator conversation (`404` on retrieval, `403` on send).
4. **XSS Sanitization:** Confirmed that `<script>` tags sent in message payloads are HTML-escaped.
5. **Role Guarding on Bookmarks:** Confirmed that brands cannot save briefs and creators cannot save creators (`403 Forbidden`).
6. **Draft Brief Isolation in Smart Alerts:** Confirmed that only published, active briefs generate opportunity alerts.

All tests passed with zero violations.
