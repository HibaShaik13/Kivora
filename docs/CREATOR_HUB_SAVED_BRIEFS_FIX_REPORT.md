# Kivora — Creator Hub Saved Briefs Fix Report
**Phase 1/2 Focused Bug-Fix Task — Local Development**
**Author:** Senior Full-Stack React + FastAPI Engineer
**Environment:** Localhost (`http://localhost:8000` / `http://localhost:5173`)
**Target Database:** `sqlite:///D:/dOWNLOADS/Kivora (2)/Kivora/kivora.db` (Verified intact)

---

## 1. Executive Summary

This report documents the diagnosis, root-cause investigation, targeted implementation, and verification for **Task B: Creator Hub Saved Briefs — End-to-End Bookmarking, Real Brief Card Population, Real-Time Badges, and Account Isolation**.

Prior to this fix, the Creator Hub displayed `0 Saved` on the Saved Briefs tab, and bookmarking brief cards did not synchronize across the application or persist reliably on page refresh.

Following the fix:
- Clicking the bookmark icon on any brief card in "Discover Briefs" saves the exact brief via `POST /api/saved/briefs/{brief_id}`.
- Bookmarked briefs appear in the Creator Hub's "Saved Briefs" tab with full editorial cards: brand name, brand logo, category, format/aspect ratio, brief title, objective, budget, and direct links to view details.
- The sidebar badge count (`🔖 Saved Briefs (N)`) updates immediately in real-time.
- Unsaving a brief from either the brief card or the Saved Briefs tab immediately removes it from the list and decreases the count.
- Browser refresh (`F5`) retains the active view and tab via synchronized `localStorage` state (`kivora_current_view` and `kivora_creator_tab`).
- Account isolation is strictly enforced; Creator A cannot view or unsave Creator B's saved briefs, and brands cannot save briefs.

---

## 2. Confirmed Root Causes

### Root Cause 1: Isolated Local State in `BriefCard.jsx`
- In `BriefCard.jsx`, the bookmark state (`isSaved`) was managed purely with local React state (`useState(false)`).
- Although it called `api.checkBriefSavedStatus(brief.id)` on mount, its `useEffect` had `currentUser` in its dependency array. Because `currentUser` was re-instantiated on parent renders, it triggered repeated status queries.
- When the bookmark icon was clicked, it did not notify parent components (`BriefsExplorer` or `CreatorDashboard`) of the state mutation.

### Root Cause 2: Missing Prop Propagation in `BriefsExplorer.jsx`
- `BriefsExplorer.jsx` mapped through brief lists and rendered `<BriefCard>` without passing `isSaved` or an `onToggleSave` callback.
- As a result, brief cards were disconnected from the creator's saved briefs collection.

### Root Cause 3: Stale State and Missing Re-fetch in `CreatorDashboard.jsx`
- `CreatorDashboard.jsx` loaded `savedBriefs` only once inside `loadData()` on initial mount.
- When the creator navigated to Tab 9 (`activeTab === 'saved'`), the component did not re-fetch the latest saved briefs from `/api/saved/briefs`.
- Tab 9 had minimal markup and lacked brand logos, deliverable specifications, and a manual refresh trigger.

### Root Cause 4: Ephemeral Route State on Refresh in `App.jsx`
- In `App.jsx`, `currentView` was hardcoded to default to `'landing'`.
- In `CreatorDashboard.jsx`, `activeTab` was hardcoded to default to `'overview'`.
- When a user refreshed the page while viewing Saved Briefs, the application reverted to the public landing page, giving the false impression that saved briefs or session state had disappeared.

---

## 3. Targeted Technical Solution & Implementation

### 3.1 `BriefCard.jsx`
In [frontend/src/components/BriefCard.jsx](file:///d:/dOWNLOADS/Kivora%20%282%29/Kivora/frontend/src/components/BriefCard.jsx):
- Accepted props: `isSaved: initialSaved` and `onToggleSave`.
- Stabilized `useEffect` dependencies by referencing `currentUser?.id` instead of the full object reference.
- Implemented optimistic bookmark toggling: updates UI state immediately, calls `api.saveBrief(brief.id)` or `api.unsaveBrief(brief.id)`, and rolls back state if the API call rejects.
- Emits callback `onToggleSave?.(brief.id, nextSaved, brief)` to notify parent components.

### 3.2 `BriefsExplorer.jsx`
In [frontend/src/components/BriefsExplorer.jsx](file:///d:/dOWNLOADS/Kivora%20%282%29/Kivora/frontend/src/components/BriefsExplorer.jsx):
- Accepted external props: `savedBriefIds: externalSavedBriefIds` and `onToggleSaveBrief`.
- Maintained a local fallback `Set` of saved brief IDs prefetched on mount for creators via `api.getSavedBriefs()`.
- Passed `isSaved={isBriefSaved(brief.id)}` and `onToggleSave={handleToggleSave}` to all `<BriefCard>` components.

### 3.3 `CreatorDashboard.jsx`
In [frontend/src/components/CreatorDashboard.jsx](file:///d:/dOWNLOADS/Kivora%20%282%29/Kivora/frontend/src/components/CreatorDashboard.jsx):
- Initialized `activeTab` from `localStorage.getItem('kivora_creator_tab') || 'overview'`.
- Updated all tab navigations to use `handleTabChange(tabId)` which updates `localStorage`.
- Added `refreshSavedBriefs()` and an effect hook listening to `[activeTab]`, fetching fresh saved briefs automatically whenever switching to the `'saved'` tab.
- Connected `<BriefsExplorer>` in Tab 4 (`Discover Briefs`) with `savedBriefIds` and `onToggleSaveBrief`, keeping the sidebar badge count synchronized in real time.
- Enriched Tab 9 (`Saved Briefs`) with an editorial card design:
  - Header: Title, subtitle, real-time count badge, and `↻ Refresh` button.
  - Card Header: Brand logo (with fallback), brand name, industry/category.
  - Card Body: Brief title (clickable to open brief details modal), objective/description, format pill (`16:9 • VIDEO`), revision allowance.
  - Card Footer: Compensation (`$N USD`) and "View Brief →" action button.
  - Working "✕ Remove" button with optimistic removal and error handling.

### 3.4 `App.jsx`
In [frontend/src/App.jsx](file:///d:/dOWNLOADS/Kivora%20%282%29/Kivora/frontend/src/App.jsx):
- Initialized `currentView` from `localStorage.getItem('kivora_current_view')` with authenticated role checks.
- Implemented `handleNavigate(view)` saving the active view to `localStorage`.
- Cleared keys on `handleLogout()`.

---

## 4. Affected Files & API Endpoints

### Files Changed:
1. `frontend/src/components/BriefCard.jsx` — Optimistic bookmark toggling, prop synchronization, rollback on error.
2. `frontend/src/components/BriefsExplorer.jsx` — Saved briefs ID set prefetching and propagation to cards.
3. `frontend/src/components/CreatorDashboard.jsx` — Tab persistence, auto-refresh on saved tab, real-time badge count, enriched card layout.
4. `frontend/src/App.jsx` — Persistent current view in localStorage across page reloads.

### Endpoints Verified & Utilized:
- `POST /api/saved/briefs/{brief_id}` (Save brief; idempotent duplicate prevention)
- `DELETE /api/saved/briefs/{brief_id}` (Unsave brief; idempotent)
- `GET /api/saved/briefs/{brief_id}/status` (Check bookmark status for authenticated creator)
- `GET /api/saved/briefs` (List saved briefs with full brief metadata and brand profile)

---

## 5. Account Isolation & Role Guards

- **Strict Creator Scoping**: `GET /api/saved/briefs` filters strictly by `SavedBrief.user_id == current_user.id`.
- **Role Enforcement**: `POST /api/saved/briefs/{brief_id}` and `DELETE /api/saved/briefs/{brief_id}` enforce `require_role(["CREATOR"])`. Brands attempting to access these endpoints receive `403 Forbidden`.
- **Draft Privacy**: Draft or archived briefs cannot be saved by creators; querying them returns `404 Not Found`.
- **Idempotency**: Repeated save or unsave operations never duplicate database records or throw 500 errors.
