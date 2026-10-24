# KIVORA ROLE AND FEATURE ACCESS MATRIX
**Creator Lifecycle Permissions, Sidebar Gating, and Role Isolation**

---

## 1. Creator Dashboard Sidebar & View Gating

The creator sidebar in [CreatorDashboard.jsx](file:///d:/dOWNLOADS/Kivora/frontend/src/components/CreatorDashboard.jsx#L564-L575) renders 10 operational navigation destinations. This matrix defines their accessibility across lifecycle states:

| Sidebar Navigation Item | ID | Unverified (No OTP) | In `DRAFT` State | In `PENDING_REVIEW` | In `APPROVED` State | In `REJECTED` State | Suspended |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Dedicated Pending View** | `pending` | ❌ | ❌ | **ACTIVE** | ❌ (Standard Portal) | ❌ (Rejection View) | ❌ |
| **Dashboard Overview** | `overview` | ❌ (401/403) | ⚠️ (Setup Mode) | 👁️ (Pending Card) | ✅ Full Access | ⚠️ (Feedback Card) | ❌ (403) |
| **Creator Profile** | `profile` | ❌ (401/403) | ✅ Editable | 👁️ Read-Only | ✅ Editable | ✅ Editable | ❌ (403) |
| **My Portfolio** | `portfolio` | ❌ (401/403) | ✅ Upload/Edit | 👁️ Read-Only | ✅ Upload/Edit | ✅ Upload/Edit | ❌ (403) |
| **Discover Briefs** | `briefs` | ❌ (401/403) | 👁️ Browse Only | 👁️ Browse Only | ✅ Browse & Apply | 👁️ Browse Only | ❌ (403) |
| **My Applications** | `applications`| ❌ (401/403) | ❌ Hidden | ❌ Hidden | ✅ Full Access | 👁️ Historical Only | ❌ (403) |
| **Collaborations** | `collaborations`| ❌ (401/403) | ❌ Hidden | ❌ Hidden | ✅ Full Access | 👁️ Historical Only | ❌ (403) |
| **Messages & Chat** | `messages` | ❌ (401/403) | ❌ Hidden | ❌ Hidden | ✅ Full Access | ❌ Blocked | ❌ (403) |
| **Smart Opportunities** | `opportunities`| ❌ (401/403) | ❌ Hidden | ❌ Hidden | ✅ Full Access | ❌ Blocked | ❌ (403) |
| **Analytics** | `analytics` | ❌ (401/403) | ❌ Hidden | ❌ Hidden | ✅ Full Access | 👁️ Past Metrics | ❌ (403) |
| **Settings** | `settings` | ❌ (401/403) | ✅ Password only | ✅ Password only | ✅ Full Settings | ✅ Full Settings | ❌ (403) |

---

## 2. Server-Side Protected Action Enforcement

Frontend UI hiding must always be backed by server-side FastAPI dependencies in [deps.py](file:///d:/dOWNLOADS/Kivora/backend/app/core/deps.py):

| Action / Endpoint | Method | Required Dependency | Behavior When In `DRAFT` / `PENDING_REVIEW` |
| :--- | :---: | :--- | :--- |
| `POST /api/briefs/{id}/applications` | `POST` | `require_approved_creator` | Returns `HTTP 403 Forbidden ("Profile verification required to apply for brand briefs.")`. |
| `POST /api/engagements/invitations/{id}/accept` | `POST` | `require_approved_creator` | Returns `HTTP 403 Forbidden ("Profile verification required to accept campaign invitations.")`. |
| `POST /api/messages/conversations` | `POST` | `require_approved_creator` | Returns `HTTP 403 Forbidden ("Unverified creators cannot initiate conversations with brands.")`. |
| `POST /api/engagements/{id}/deliverables` | `POST` | `require_approved_creator` | Returns `HTTP 403 Forbidden ("Active engagement deliverable submission locked.")`. |
| `POST /api/creators/portfolio` | `POST` | `require_role(["CREATOR"])` | Allowed in `DRAFT`, `RESUBMISSION_REQUIRED`, and `APPROVED`. Locked in `PENDING_REVIEW`. |
| `POST /api/verification/request` | `POST` | `require_role(["CREATOR"])` | Allowed. Submits evidence claim attached to creator's portfolio project. |
| `POST /api/creators/profile/submit` | `POST` | `require_role(["CREATOR"])` | Validates completeness and transitions profile to `PENDING_REVIEW`. |

---

## 3. Dedicated Pending Verification Dashboard Specification

When a creator's `profile_status` is `PENDING_REVIEW`, the main content area of [CreatorDashboard.jsx](file:///d:/dOWNLOADS/Kivora/frontend/src/components/CreatorDashboard.jsx) renders the **Pending Verification Dashboard**:

```
+-----------------------------------------------------------------------------------------+
|  Kivora Creator Studio                                       [Elena Rostova] (Pending)  |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|   ⏳ Your Creator Profile is Under Administrative Review                               |
|   Submitted on October 23, 2026 at 14:32 UTC                                            |
|                                                                                         |
|   Our administrative team and Kivo AI audit tools are reviewing your submitted          |
|   evidence and portfolio to guarantee commercial rights and authenticity.               |
|                                                                                         |
|   +---------------------------------------------------------------------------------+   |
|   | Submission Checklist                                                            |   |
|   |   ✅ Profile Avatar & Identity: Verified                                         |   |
|   |   ✅ Primary Specialization & Bio: Complete (142 words)                          |   |
|   |   ✅ Portfolio Projects: 2 projects uploaded                                     |   |
|   |   ✅ Process Evidence: Node graph & intermediate frames attached                 |   |
|   |   ⏳ Human Review & AI Audit: In Progress (Queue position: #4)                  |   |
|   +---------------------------------------------------------------------------------+   |
|                                                                                         |
|   Need to update your submitted materials?                                              |
|   [Withdraw & Edit Submission]   [View Submitted Evidence]                              |
|                                                                                         |
|   While you wait: Explore published campaign briefs to see upcoming brand requirements.  |
|   [Explore Briefs (Read-Only)]                                                          |
|                                                                                         |
+-----------------------------------------------------------------------------------------+
```

### Components of the Pending Dashboard:
1. **Status Banner:** Clear indicator displaying `PENDING_REVIEW` with exact timestamp.
2. **Audit Checklist:** Visual progress bar confirming bio, avatar, skills, portfolio projects, and evidence items detected.
3. **Evidence Preview Drawer:** Read-only inspection of the files and workflow steps the admin is currently evaluating.
4. **Correction Route:** "Withdraw & Edit Submission" button allowing creators to revert to `DRAFT` if they discover an error prior to admin audit.
5. **Permitted Activity:** Direct button to explore campaign briefs in read-only mode so creators can prepare pitches while awaiting review.

---

## 4. Brand and Administrator Isolation

1. **Role Boundary Enforcement:**
   - [auth.py](file:///d:/dOWNLOADS/Kivora/backend/app/api/auth.py#L88) strictly prevents users from selecting role `'ADMIN'` during registration.
   - [deps.py](file:///d:/dOWNLOADS/Kivora/backend/app/core/deps.py#L70-L80) validates the user's role on every protected request.
2. **Prevention of Client-Side Privilege Escalation:**
   - Altering `kivora_user` in `localStorage` or modifying React state has zero effect on backend authorization.
   - The backend decodes the signed JWT from the HTTP `Authorization: Bearer <token>` header and verifies cryptographic signature before checking `user.role == 'ADMIN'`.
   - Modifying a token payload invalidates the HMAC-SHA256 signature, causing `401 Unauthorized`.
