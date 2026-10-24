# Google OAuth Production Fix & Diagnostic Report — Kivora

**Date:** October 24, 2026  
**Environment:** Production (Render) & Local Development (Localhost)  
**Status:** Code & Deployment Verified (Live); Awaiting Google Cloud Console URI Authorization Propagation  

---

## 1. Confirmed Root Cause & Supporting Evidence

### Root Cause
Google Sign-In worked seamlessly on `http://localhost:8000` because the Google OAuth 2.0 Client (`329722088606-l5plmh1fvr1dtfus7ed6i7b6liuj0ggm.apps.googleusercontent.com`) was created with only `http://localhost:8000/api/auth/oauth/google/callback` in its authorized redirect URIs. 

When deployed to Render, the backend correctly generates and expects the production callback URL:
```text
https://kivora-api-n7m1.onrender.com/api/auth/oauth/google/callback
```
Because this production URL was not yet registered in Google Cloud Console under the client's **Authorized redirect URIs**, Google's OAuth 2.0 authorization server blocked the request with:
```text
Error 400: redirect_uri_mismatch
```

### Empirical Side-by-Side Proof

| Environment | Client ID | Evaluated `redirect_uri` | Google OAuth Server Response |
| :--- | :--- | :--- | :--- |
| **Localhost** | `329722088606-l5plmh1fvr1dtfus7ed6i7b6liuj0ggm.apps.googleusercontent.com` | `http://localhost:8000/api/auth/oauth/google/callback` | **ACCEPTED (HTTP 200)** — Displays Google account chooser / consent screen |
| **Production** | `329722088606-l5plmh1fvr1dtfus7ed6i7b6liuj0ggm.apps.googleusercontent.com` | `https://kivora-api-n7m1.onrender.com/api/auth/oauth/google/callback` | **REJECTED (HTTP 200)** — Google error page with `Error 400: redirect_uri_mismatch` |

Candidate probing also verified that no other production paths (`/callback`, `/oauth/callback`, or frontend origins) are pre-registered on this Client ID.

---

## 2. Complete Production OAuth Flow Tracing

1. **User Action:** User clicks "Continue with Google" on `https://kivora-frontend.onrender.com`.
2. **Authorization Request:** Frontend requests `GET /api/auth/oauth/google/authorize?role=CREATOR` via the Render proxy rewrite to `https://kivora-api-n7m1.onrender.com`.
3. **Authorization URL Generation:** Backend constructs a signed cryptographic state token and generates:
   ```text
   https://accounts.google.com/o/oauth2/v2/auth?client_id=329722088606-l5plmh1fvr1dtfus7ed6i7b6liuj0ggm.apps.googleusercontent.com&redirect_uri=https%3A%2F%2Fkivora-api-n7m1.onrender.com%2Fapi%2Fauth%2Foauth%2Fgoogle%2Fcallback&response_type=code&scope=openid+email+profile&state={signed_jwt}&access_type=offline&prompt=select_account
   ```
4. **Browser Redirect:** Frontend sets `window.location.href = data.authorization_url`.
5. **Google Validation:** Google compares `client_id` and the decoded `redirect_uri` (`https://kivora-api-n7m1.onrender.com/api/auth/oauth/google/callback`).
6. **User Consent:** User authenticates and grants access; Google redirects to:
   ```text
   GET https://kivora-api-n7m1.onrender.com/api/auth/oauth/google/callback?code={auth_code}&state={signed_jwt}
   ```
7. **Token Exchange:** Backend handles the GET request, calls `https://oauth2.googleapis.com/token` with the exact same `redirect_uri`, fetches user identity from `https://www.googleapis.com/oauth2/v3/userinfo`, establishes the session, and issues a Kivora JWT.
8. **Frontend Session Established:** Backend redirects to:
   ```text
   302 Found -> https://kivora-frontend.onrender.com/?oauth_token={jwt}&email={user.email}&role={user.role}
   ```
   Frontend `App.jsx` stores the token and signs the user into their workspace.

---

## 3. Files Changed and Why

### 1. `backend/app/api/auth.py`
- **RFC 6749 Standard Query Encoding:** Replaced raw string interpolation with `urllib.parse.urlencode` to ensure all characters in callback URLs are properly encoded.
- **Resilient Callback Error Handling:** Updated `oauth_callback_get` to accept `error` and `error_description` parameters so user denials or cancellations redirect cleanly to `https://kivora-frontend.onrender.com/?oauth_error=...` rather than displaying unhandled server errors.
- **Creator Approval Lifecycle Preservation:** Kept newly authenticated creators at `approval_status="PENDING"` in adherence to marketplace access rules.

### 2. `backend/tests/test_oauth_auth.py`
- Added comprehensive unit tests covering:
  - `test_oauth_production_authorization_url_generation`: Validates production callback URL selection and query parameters.
  - `test_oauth_localhost_authorization_url_generation`: Verifies localhost callback URL compatibility.
  - `test_oauth_get_callback_success_redirects_to_frontend`: Validates code exchange and HTTP 302 redirect with session token.
  - `test_oauth_get_callback_provider_error_redirects_to_frontend`: Validates error query parameter handling.
  - `test_oauth_status_does_not_leak_secrets`: Validates that client secrets and HMAC keys are never exposed in JSON responses.

---

## 4. Tests and Verification Results

### Backend Automated Test Suites
```bash
# OAuth & Security Test Suite
pytest backend/tests/test_oauth_auth.py
# Result: 10 passed in 4.05s

# Creator Approval Gate & Access Control Suite
pytest backend/tests/test_creator_approval_gate.py
# Result: 24 passed in 78.58s
```

### Frontend Static & Lint Verification
```bash
npm run lint (oxlint) -> 0 errors, 32 minor unused warnings
npm run build (vite) -> Built dist bundle successfully in 3.04s
```

---

## 5. Deployment Status

| Service | Render Service ID | Commit | Deploy ID | Status | URL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **API Backend** | `srv-db4kags9v7es73a6fo00` | `b6765cc` | `dep-dbeffd0n74is73eihup0` | **LIVE** | `https://kivora-api-n7m1.onrender.com` |
| **Frontend Web** | `srv-db4keucs728c73flgc1g` | `1380fc9` | `dep-dbef6hoae00c73cv1bng` | **LIVE** | `https://kivora-frontend.onrender.com` |
| **PostgreSQL** | `dpg-db4ka6c9v7es73a6f4rg-a` | N/A | Synchronized | **AVAILABLE** | Managed Render Postgres |

---

## 6. Required Google Cloud Console Settings (Action Required)

To complete the production flow, the production callback must be saved in your Google Cloud Console project:

1. Open **[Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials)**.
2. Select your project and click on OAuth 2.0 Client ID:  
   **`329722088606-l5plmh1fvr1dtfus7ed6i7b6liuj0ggm.apps.googleusercontent.com`**
3. Under **Authorized JavaScript origins**, ensure the following are listed:
   ```text
   https://kivora-frontend.onrender.com
   https://kivora-api-n7m1.onrender.com
   http://localhost:5173
   http://localhost:8000
   ```
4. Under **Authorized redirect URIs**, click **+ ADD URI** and add:
   ```text
   https://kivora-api-n7m1.onrender.com/api/auth/oauth/google/callback
   ```
   *(Ensure `http://localhost:8000/api/auth/oauth/google/callback` remains so local development continues working).*
5. Click **SAVE** at the bottom of the page.
6. Note: Google Cloud changes usually take 1 to 3 minutes to propagate across Google's edge servers.

Once saved and propagated, clicking "Continue with Google" on `https://kivora-frontend.onrender.com` will immediately load the Google account selection screen without `redirect_uri_mismatch`.
