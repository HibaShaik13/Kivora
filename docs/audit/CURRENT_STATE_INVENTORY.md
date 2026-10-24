# KIVORA CURRENT STATE INVENTORY
**Comprehensive Technical Directory of Routes, Services, Tables, and Models**

---

## 1. Frontend Architecture & View Inventory

The frontend is built with React 18 and Vite 5.4.8, utilizing component-level view switching coordinated with URL query parameters in [App.jsx](file:///d:/dOWNLOADS/Kivora/frontend/src/App.jsx).

### Main Views Rendered by `currentView` State:

| View Identifier | Component / File | Purpose & Audience | Access Requirements |
| :--- | :--- | :--- | :--- |
| `landing` | [HeroSection.jsx](file:///d:/dOWNLOADS/Kivora/frontend/src/components/HeroSection.jsx) + 8 sections | Public landing page with 3D canvas, creator spotlight, brand conveyor. | Public (Unauthenticated) |
| `creators` | [CreatorDiscovery.jsx](file:///d:/dOWNLOADS/Kivora/frontend/src/components/CreatorDiscovery.jsx) | Public creator directory with search, taxonomy, budget, and tier filters. | Public (Unauthenticated) |
| `briefs` | [BriefsExplorer.jsx](file:///d:/dOWNLOADS/Kivora/frontend/src/components/BriefsExplorer.jsx) | Campaign briefs marketplace explorer with budget and domain filtering. | Public (Unauthenticated) |
| `dashboard` | [CreatorDashboard.jsx](file:///d:/dOWNLOADS/Kivora/frontend/src/components/CreatorDashboard.jsx) or [BrandDashboard.jsx](file:///d:/dOWNLOADS/Kivora/frontend/src/components/BrandDashboard.jsx) | Role-specific operational portal for creators or brands. | Authenticated `CREATOR` or `BRAND` |
| `admin` | [AdminDashboard.jsx](file:///d:/dOWNLOADS/Kivora/frontend/src/components/AdminDashboard.jsx) | Administrative control desk, KPI analytics, verification queue, settings. | Authenticated `ADMIN` only |
| `inbox` | [MessagesInbox.jsx](file:///d:/dOWNLOADS/Kivora/frontend/src/components/MessagesInbox.jsx) | Direct standalone messaging view with contextual project headers. | Authenticated user |

### Modal Dialogs Inventory:

| Modal Component | Trigger / Invoker | Primary Function |
| :--- | :--- | :--- |
| [AuthModal.jsx](file:///d:/dOWNLOADS/Kivora/frontend/src/components/AuthModal.jsx) | Navbar "Sign In", landing buttons | Sign In, Register (`CREATOR` / `BRAND`), and 6-digit Email OTP entry. |
| [CreatorProfileModal.jsx](file:///d:/dOWNLOADS/Kivora/frontend/src/components/CreatorProfileModal.jsx) | Creator card click in directory | Detailed public creator profile, portfolio carousel, verified tool badges. |
| [BriefDetailModal.jsx](file:///d:/dOWNLOADS/Kivora/frontend/src/components/BriefDetailModal.jsx) | Brief card click in explorer | Full campaign brief requirements, deliverables list, pitch application form. |
| [PortfolioModal.jsx](file:///d:/dOWNLOADS/Kivora/frontend/src/components/PortfolioModal.jsx) | Portfolio thumbnail click | High-resolution asset preview, workflow node graph, parameter snippets. |
| [AiBriefBuilderModal.jsx](file:///d:/dOWNLOADS/Kivora/frontend/src/components/AiBriefBuilderModal.jsx) | Navbar "AI Brief Builder" | AI-assisted campaign brief generator powered by Kivo Assistant. |
| [AddProjectModal.jsx](file:///d:/dOWNLOADS/Kivora/frontend/src/components/AddProjectModal.jsx) | Creator Dashboard "Upload Project" | Multi-step portfolio project upload with workflow steps and evidence. |
| [EditCreatorProfileModal.jsx](file:///d:/dOWNLOADS/Kivora/frontend/src/components/EditCreatorProfileModal.jsx) | Creator Dashboard profile header | Update display name, bio, rates, skills, and tools. |
| [EditBrandProfileModal.jsx](file:///d:/dOWNLOADS/Kivora/frontend/src/components/EditBrandProfileModal.jsx) | Brand Dashboard profile header | Update company details, brand logo, industry, and headquarters. |
| [CollaborationWorkspaceModal.jsx](file:///d:/dOWNLOADS/Kivora/frontend/src/components/CollaborationWorkspaceModal.jsx) | Collaboration card "Open Workspace"| Active project workspace, milestones, deliverables review, chat shortcut. |
| [InviteCreatorModal.jsx](file:///d:/dOWNLOADS/Kivora/frontend/src/components/InviteCreatorModal.jsx) | Creator Discovery "Invite to Brief" | Brand invites a creator to pitch on an active published brief. |

---

## 2. Backend API Router & Endpoint Directory

All routes are registered in [main.py](file:///d:/dOWNLOADS/Kivora/backend/app/main.py#L75-L90):

| Router Prefix | Source File | Key Endpoints | Auth Requirements |
| :--- | :--- | :--- | :--- |
| `/api/auth` | [auth.py](file:///d:/dOWNLOADS/Kivora/backend/app/api/auth.py) | `POST /register`, `POST /login`, `POST /verify-otp`, `POST /resend-otp`, `POST /forgot-password`, `POST /reset-password`, `GET /me`, `GET /oauth/status` | Public for auth; Bearer for `/me` |
| `/api/creators` | [creators.py](file:///d:/dOWNLOADS/Kivora/backend/app/api/creators.py) | `GET /` (directory), `GET /{id}`, `GET /me`, `POST /profile`, `POST /portfolio`, `DELETE /portfolio/{id}` | Public for directory; `CREATOR` for `/me` |
| `/api/brands` | `brands.py` | `GET /`, `GET /{id}`, `GET /me`, `POST /profile` | Public for browse; `BRAND` for `/me` |
| `/api/briefs` | `briefs.py` | `GET /`, `GET /{id}`, `POST /`, `POST /{id}/applications`, `GET /{id}/applications` | Public for browse; `BRAND` to create; `CREATOR` to apply |
| `/api/verification`| [verification.py](file:///d:/dOWNLOADS/Kivora/backend/app/api/verification.py) | `POST /request`, `GET /my-requests`, `GET /requests`, `PATCH /requests/{id}`, `POST /requests/{id}/analyze` | `CREATOR` to submit; `ADMIN` to list/review |
| `/api/engagements` | `engagements.py` | `GET /`, `GET /{id}`, `POST /{id}/deliverables`, `PATCH /deliverables/{id}/review`, `POST /invitations/{id}/accept` | `CREATOR` or `BRAND` (Ownership enforced) |
| `/api/messages` | `messages.py` | `GET /conversations`, `POST /conversations`, `GET /conversations/{id}/messages`, `POST /conversations/{id}/messages` | `CREATOR` or `BRAND` participant |
| `/api/notifications`| `notifications.py` | `GET /`, `PATCH /{id}/read`, `POST /read-all` | Authenticated user |
| `/api/alerts` | `alerts.py` | `GET /opportunities`, `POST /refresh`, `GET /preferences`, `PUT /preferences` | Authenticated `CREATOR` |
| `/api/saved` | `saved.py` | `GET /creators`, `POST /creators/{id}`, `DELETE /creators/{id}`, `GET /briefs`, `POST /briefs/{id}` | Authenticated user |
| `/api/matching` | `matching.py` | `GET /briefs/{id}/matches`, `POST /score` | Authenticated `BRAND` or `ADMIN` |
| `/api/media` | `media.py` | `POST /upload` | Authenticated user |
| `/api/ai` | `ai.py` | `POST /brief-builder`, `POST /pitch-assist`, `POST /deliverable-review` | Authenticated user |

---

## 3. Database Schema: 34 Relational Tables Inventory

All entities inherit from `Base = declarative_base()` in [models.py](file:///d:/dOWNLOADS/Kivora/backend/app/models/models.py):

| Table Name | Primary Key | Foreign Keys / Key Relationships | Record Count |
| :--- | :--- | :--- | :---: |
| `users` | `id (VARCHAR 36)` | Unique `email`. Relationships to creator and brand profiles. | 301 |
| `otp_codes` | `id (VARCHAR 36)` | Indexed `email`. Tracks purpose, attempts, expiration, use. | 138 |
| `creator_profiles` | `id (VARCHAR 36)` | `user_id -> users.id` (1-to-1). Unique `handle`. | 206 |
| `brand_profiles` | `id (VARCHAR 36)` | `user_id -> users.id` (1-to-1). Unique `slug`. | 33 |
| `categories` | `id (VARCHAR 60)` | Self-referential `parent_id -> categories.id`. | 97 |
| `creator_categories`| `id (VARCHAR 60)`| `creator_id -> creator_profiles.id`, `category_id -> categories.id`. | 315 |
| `skills` | `id (VARCHAR 36)` | Unique `name`, indexed `category`. | 20 |
| `creator_skills` | `id (VARCHAR 36)` | `creator_id -> creator_profiles.id`, `skill_id -> skills.id`. | 467 |
| `tools` | `id (VARCHAR 36)` | Unique `name`, vendor, category. | 20 |
| `creator_tools` | `id (VARCHAR 36)` | `creator_id -> creator_profiles.id`, `tool_id -> tools.id`. | 464 |
| `portfolio_projects`| `id (VARCHAR 36)`| `creator_id -> creator_profiles.id`. | 111 |
| `workflow_steps` | `id (VARCHAR 36)` | `project_id -> portfolio_projects.id`. | 14 |
| `evidence_records` | `id (VARCHAR 36)` | `project_id -> portfolio_projects.id`. | 12 |
| `verification_records`| `id (VARCHAR 36)`| `evidence_id -> evidence_records.id`. Target type & ID. | 12 |
| `verification_ai_analyses`| `id (VARCHAR 36)`| `verification_id -> verification_records.id` (1-to-1). | 6 |
| `briefs` | `id (VARCHAR 36)` | `brand_id -> brand_profiles.id`. | 171 |
| `brief_categories` | `id (VARCHAR 60)` | `brief_id -> briefs.id`, `category_id -> categories.id`. | 324 |
| `brief_skills` | `id (VARCHAR 36)` | `brief_id -> briefs.id`, `skill_id -> skills.id`. | 284 |
| `brief_tools` | `id (VARCHAR 36)` | `brief_id -> briefs.id`, `tool_id -> tools.id`. | 265 |
| `applications` | `id (VARCHAR 36)` | `brief_id -> briefs.id`, `creator_id -> creator_profiles.id`. | 53 |
| `engagements` | `id (VARCHAR 36)` | `brief_id -> briefs.id`, `creator_id`, `application_id`. | 33 |
| `engagement_milestones`| `id (VARCHAR 36)`| `engagement_id -> engagements.id`. | 0 |
| `engagement_deliverables`| `id (VARCHAR 36)`| `engagement_id -> engagements.id`. Versioned asset submissions. | 41 |
| `engagement_events`| `id (VARCHAR 36)` | `engagement_id -> engagements.id`. Audit trail of actions. | 0 |
| `deliverable_ai_analyses`| `id (VARCHAR 36)`| `deliverable_id -> engagement_deliverables.id`. | 0 |
| `engagement_reviews`| `id (VARCHAR 36)`| `engagement_id -> engagements.id`, `reviewer_id -> users.id`. | 0 |
| `notifications` | `id (VARCHAR 36)` | `user_id -> users.id`. In-app alert messages. | 36 |
| `conversations` | `id (VARCHAR 36)` | `brand_id -> brand_profiles.id`, `creator_id`. | 7 |
| `messages` | `id (VARCHAR 36)` | `conversation_id -> conversations.id`, `sender_id`. | 9 |
| `saved_creators` | `id (VARCHAR 36)` | `user_id -> users.id`, `creator_id -> creator_profiles.id`. | 5 |
| `saved_briefs` | `id (VARCHAR 36)` | `user_id -> users.id`, `brief_id -> briefs.id`. | 2 |
| `alert_preferences`| `id (VARCHAR 36)` | `user_id -> users.id` (1-to-1). | 3 |
| `opportunity_alerts`| `id (VARCHAR 36)`| `user_id -> users.id`, `brief_id -> briefs.id`. | 15 |
| `alembic_version` | `version_num` | Migration schema revision pointer. | 1 |
