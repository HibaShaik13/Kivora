# Phase 0: Security, Authentication & Authorization Audit
**Project:** Kivora AI Creator-Brand Marketplace  
**Date:** October 12, 2026  
**Auditor:** Kivora Phase 0 Master Audit  

---

## 1. Security Architecture Summary

The security review evaluates Kivora's defense against realistic abuse vectors, including Broken Object Level Authorization (BOLA/IDOR), authentication bypasses, credential leakage, injection, cross-site scripting (XSS), cross-origin attacks (CORS), insecure file uploads, and denial-of-service vulnerabilities.

### Security Posture Score: **5.5 / 10**
- **Strengths:** 
  - Standard bcrypt password hashing with automatic salt generation.
  - Consistent Pydantic input schemas preventing SQL injection.
  - Zero usage of `dangerouslySetInnerHTML` across React components.
  - Strict tenant separation inside the `engagements.py` API (creators and brands cannot query or modify each other's collaborations).
  - Robust file upload validation (file size streaming cap at 25MB, MIME checking, and safe UUID-based file renaming).
- **Vulnerabilities Requiring Action:**
  - Auto-verification logic completely bypassing email proof.
  - JWT key length shorter than the RFC 7518 specification threshold (28 bytes vs minimum 32 bytes).
  - Pseudo-random OTP generation (`random.randint`) vulnerable to state estimation.
  - Overly permissive CORS (`allow_origins=["*"]` with `allow_credentials=True`).
  - Public exposure of campaign briefs in `draft` status on the `/api/briefs` endpoint.
  - Lack of rate limiting on sensitive authentication and AI generation endpoints.

---

## 2. Detailed Findings by Severity

### Finding SEC-01 (CRITICAL) — Auto-Verification Bypass in Registration and Login Flows
- **Severity:** **CRITICAL**
- **Affected File/Endpoint:** `backend/app/api/auth.py` (`POST /api/auth/register`, `POST /api/auth/login`)
- **Evidence / Reproduction:**
  1. In `register()`:
     ```python
     new_user = User(
         email=user_data.email,
         hashed_password=get_password_hash(user_data.password),
         role=user_data.role,
         is_active=True,
         is_email_verified=True,  # <--- Bypasses OTP immediately upon registration
     )
     ```
  2. In `login()`:
     ```python
     # If user not verified, verify them on successful password check
     if not user.is_email_verified:
         user.is_email_verified = True
         db.commit()
     ```
- **Potential Impact:**
  An attacker can register an account using any corporate domain (e.g. `marketing@nike.com`) with a junk password and immediately gain verified brand status. They can issue briefs, solicit creator proposals, and harvest sensitive creator portfolio assets without proving ownership of the email address.
- **Remediation Required Before Public Access / Payments:** **YES.**
- **Recommended Fix:**
  - Set `is_email_verified = False` by default on user creation.
  - Emit an OTP via the email service during registration.
  - Restrict JWT issuance and authenticated dashboard access until `verify-otp` returns success.
  - Remove auto-verification from the `/login` handler.

---

### Finding SEC-02 (CRITICAL) — Sub-256-bit JWT Signing Secret & Insecure PRNG for OTP
- **Severity:** **CRITICAL**
- **Affected File/Endpoint:** `backend/app/core/security.py`, `backend/app/api/auth.py`
- **Evidence / Reproduction:**
  1. Running the test suite yields:
     ```
     InsecureKeyLengthWarning: The HMAC key provided is 28 bytes, which is shorter than the 32 bytes required for HS256. Using a key of this length is insecure and may lead to known attacks.
     ```
  2. In `backend/app/api/auth.py`:
     ```python
     def generate_otp_code() -> str:
         return str(random.randint(100000, 999999))  # Uses MT19937 PRNG, not cryptographically secure
     ```
- **Potential Impact:**
  - HMAC keys under 256 bits violate RFC 7518 Section 3.2 and are susceptible to offline brute-force attacks if tokens are captured.
  - Python's `random.randint` uses the Mersenne Twister algorithm (MT19937), which is completely predictable after observing 624 outputs. An attacker can predict subsequent OTP verification codes.
- **Remediation Required Before Public Access / Payments:** **YES.**
- **Recommended Fix:**
  - Generate a secure 64-character (512-bit) hex string for `SECRET_KEY` in production environment variables (`secrets.token_hex(32)`).
  - Update `generate_otp_code()` to use `secrets.randbelow()`:
    ```python
    import secrets
    def generate_otp_code() -> str:
        return f"{secrets.randbelow(900000) + 100000}"
    ```

---

### Finding SEC-03 (HIGH) — Overly Permissive CORS with Wildcard Allowed Origins
- **Severity:** **HIGH**
- **Affected File/Endpoint:** `backend/app/main.py`
- **Evidence / Reproduction:**
  ```python
  app.add_middleware(
      CORSMiddleware,
      allow_origins=["*"],
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
  )
  ```
- **Potential Impact:**
  Combining `allow_origins=["*"]` with `allow_credentials=True` violates browser CORS specifications. Modern browsers reject credentialed requests with wildcard origins, or malicious third-party websites can execute cross-origin requests against localhost/staging environments if users have active bearer tokens in headers.
- **Remediation Required Before Public Access / Payments:** **YES.**
- **Recommended Fix:**
  - Explicitly restrict origins in production to designated frontend domains:
    ```python
    ALLOWED_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        os.getenv("FRONTEND_APP_URL", "")
    ]
    ```

---

### Finding SEC-04 (HIGH) — Public Disclosure of Draft Briefs via General Listing
- **Severity:** **HIGH**
- **Affected File/Endpoint:** `backend/app/api/briefs.py` (`GET /api/briefs`)
- **Evidence / Reproduction:**
  `list_briefs` queries all briefs in the database:
  ```python
  query = db.query(Brief)
  if status:
      query = query.filter(Brief.status == status)
  return query.offset(skip).limit(limit).all()
  ```
  If an unauthenticated user or creator calls `GET /api/briefs` without `?status=active`, briefs with `status="draft"` are returned in the response payload.
- **Potential Impact:**
  Brands preparing confidential upcoming product launches or unannounced campaigns will have their campaign outlines, budgets, and creative concepts leaked to competitors before official publication.
- **Remediation Required Before Public Access / Payments:** **YES.**
- **Recommended Fix:**
  - Enforce `query = query.filter(Brief.status == "active")` for public listing requests.
  - If a brand is fetching `/briefs`, return drafts only if the query specifically scopes to `brief.brand_id == current_user_brand.id`.

---

### Finding SEC-05 (MEDIUM) — Missing Rate Limiting on Auth, OTP & AI Endpoints
- **Severity:** **MEDIUM**
- **Affected File/Endpoint:** `/api/auth/login`, `/api/auth/send-otp`, `/api/briefs/generate-ai`
- **Evidence / Reproduction:**
  No rate-limiting middleware (such as `slowapi` or Redis-backed rate limiters) is registered on the FastAPI application.
- **Potential Impact:**
  - Credential stuffing and brute-force attacks against user logins.
  - Abuse of SMS/email OTP endpoints leading to email API billing depletion or spam blacklisting.
  - Financial exhaustion of Google Gemini AI quotas via repeated automated invocations of `/generate-ai`.
- **Remediation Required Before Public Access / Payments:** Recommended before public launch.
- **Recommended Fix:**
  - Integrate `slowapi` with memory or Redis backend.
  - Enforce 5 login attempts/minute per IP, 3 OTP requests/hour per email, and 10 AI generation requests/hour per brand account.

---

### Finding SEC-06 (MEDIUM) — Ephemeral Local File Storage Vulnerability
- **Severity:** **MEDIUM**
- **Affected File/Endpoint:** `backend/app/api/media.py`
- **Evidence / Reproduction:**
  Files uploaded via `/api/media/upload` are saved directly to `./uploads/{category}/{safe_filename}` on the local disk.
- **Potential Impact:**
  - Ephemeral container architectures (Docker, Kubernetes, AWS ECS, Fly.io) destroy local filesystem modifications upon redeployment or autoscaling, resulting in permanent data loss of creator deliverables.
  - Multi-instance deployments cannot share local files without network-attached volumes.
- **Remediation Required Before Public Access / Payments:** Required before cloud deployment.
- **Recommended Fix:**
  - Implement an abstract storage interface (`StorageProvider`) supporting both Local Disk (for offline development) and S3-compatible cloud storage (AWS S3, Cloudflare R2) using pre-signed upload URLs.

---

### Finding SEC-07 (LOW) — Client-Side Token Storage in LocalStorage
- **Severity:** **LOW**
- **Affected File/Endpoint:** `frontend/src/App.jsx`, `frontend/src/services/api.js`
- **Evidence / Reproduction:**
  Tokens are stored via `localStorage.setItem("token", data.access_token)`.
- **Potential Impact:**
  If an XSS vulnerability were introduced into the frontend in future features, an attacker's script could extract tokens from `localStorage`.
- **Remediation Required Before Public Access / Payments:** No (Acceptable standard for MVPs, but should be hardened for enterprise compliance).
- **Recommended Fix:**
  - Transition authentication tokens to `HttpOnly`, `Secure`, `SameSite=Strict` cookies.

---

## 3. Vulnerability Summary Matrix

| ID | Title | Severity | Exploitability | Remediation Priority |
| :--- | :--- | :---: | :---: | :---: |
| **SEC-01** | Auto-Verification Bypass in Registration/Login | **CRITICAL** | High | **Immediate (P0)** |
| **SEC-02** | Weak 28-byte JWT Secret & Insecure PRNG OTP | **CRITICAL** | Medium | **Immediate (P0)** |
| **SEC-03** | Permissive CORS with Wildcard Origins | **HIGH** | Medium | **Phase 1 (P1)** |
| **SEC-04** | Confidential Draft Brief Public Exposure | **HIGH** | High | **Phase 1 (P1)** |
| **SEC-05** | Missing Rate Limiting on Auth & AI Endpoints | **MEDIUM** | High | **Phase 1 (P1)** |
| **SEC-06** | Ephemeral Local Storage for User Deliverables | **MEDIUM** | Low (Dev only) | **Phase 2 (P2)** |
| **SEC-07** | JWT Token Stored in Browser LocalStorage | **LOW** | Low | **Phase 3 (P3)** |
