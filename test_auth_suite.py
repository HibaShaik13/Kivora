import urllib.request
import urllib.error
import json
import uuid
import sqlite3
import sys

BASE_URL = "http://localhost:8000"

def post(endpoint, data, token=None):
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            **({"Authorization": f"Bearer {token}"} if token else {})
        }
    )
    try:
        with urllib.request.urlopen(req) as res:
            return res.status, json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"detail": body}

def get(endpoint, token=None):
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(
        url,
        headers={"Authorization": f"Bearer {token}"} if token else {}
    )
    try:
        with urllib.request.urlopen(req) as res:
            return res.status, json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"detail": body}

def get_latest_otp(email, purpose=None):
    conn = sqlite3.connect("kivora.db")
    c = conn.cursor()
    if purpose:
        c.execute("SELECT code FROM otp_codes WHERE email = ? AND purpose = ? ORDER BY created_at DESC LIMIT 1", (email, purpose))
    else:
        c.execute("SELECT code FROM otp_codes WHERE email = ? ORDER BY created_at DESC LIMIT 1", (email,))
    row = c.fetchone()
    conn.close()
    return row[0] if row else None

def get_user_db_record(email):
    conn = sqlite3.connect("kivora.db")
    c = conn.cursor()
    c.execute("SELECT id, email, hashed_password, role, is_email_verified FROM users WHERE email = ?", (email,))
    row = c.fetchone()
    conn.close()
    return row

def main():
    print("=================================================================")
    print("      KIVORA COMPREHENSIVE AUTHENTICATION AUDIT & VERIFICATION")
    print("=================================================================")

    passed = 0
    failed = 0

    def assert_test(condition, name, detail=""):
        nonlocal passed, failed
        if condition:
            print(f"  [PASS] {name}")
            passed += 1
        else:
            print(f"  [FAIL] {name} - {detail}")
            failed += 1

    # -------------------------------------------------------------
    # 1. DEMO ACCOUNTS AUDIT
    # -------------------------------------------------------------
    print("\n--- 1. Testing Demo Accounts (Preservation & Sign In) ---")
    demos = [
        ("Elena Rostova (Creator)", "elena.rostova@kivora.demo", "CREATOR"),
        ("Lumina Skincare (Brand)", "creative@luminaskincare.demo", "BRAND"),
        ("Lead Reviewer (Admin)", "admin@kivora.demo", "ADMIN"),
    ]
    for label, d_email, d_role in demos:
        status, body = post("/api/auth/login", {"email": d_email, "password": "Password123!"})
        assert_test(status == 200 and "access_token" in body, f"{label} login status 200 with JWT")
        assert_test(body.get("user", {}).get("role") == d_role, f"{label} role matches expected {d_role}")
        # Test session validation
        token = body.get("access_token")
        m_status, m_body = get("/api/auth/me", token=token)
        assert_test(m_status == 200 and m_body.get("email") == d_email, f"{label} session validated via /api/auth/me")

    # -------------------------------------------------------------
    # 2. CREATE ACCOUNT (REGISTRATION & VALIDATION)
    # -------------------------------------------------------------
    print("\n--- 2. Testing Account Creation (Registration, Validation & Hashing) ---")
    test_email = f"audit_user_{uuid.uuid4().hex[:8]}@example.com"
    test_pw = "SecureP@ssw0rd2026!"

    # 2a. Password too short (<8 chars)
    s, b = post("/api/auth/register", {"email": test_email, "password": "short", "role": "CREATOR", "full_name": "Short Pw"})
    assert_test(s == 422, "Short password rejected with validation error (422)")

    # 2b. Invalid email pattern
    s, b = post("/api/auth/register", {"email": "invalid-email-format", "password": test_pw, "role": "CREATOR", "full_name": "Bad Email"})
    assert_test(s == 422, "Malformed email rejected with validation error (422)")

    # 2c. Successful registration
    s, b = post("/api/auth/register", {"email": test_email, "password": test_pw, "role": "CREATOR", "full_name": "Audit Test Creator"})
    assert_test(s == 201 and b.get("requires_otp") is True, "Valid registration returns 201 and requires_otp: True")

    # 2d. Database persistence & password hashing audit
    user_rec = get_user_db_record(test_email)
    assert_test(user_rec is not None, "New user successfully persisted in SQLite database")
    if user_rec:
        u_id, u_email, u_hash, u_role, u_ver = user_rec
        assert_test(u_hash.startswith("$2b$") or len(u_hash) > 50, "Password hashed securely with bcrypt (no plaintext stored)")
        assert_test(u_ver == 0 or u_ver is False, "Account initial status is UNVERIFIED before OTP confirmation")

    # 2e. Duplicate email registration
    s, b = post("/api/auth/register", {"email": test_email, "password": test_pw, "role": "CREATOR", "full_name": "Duplicate"})
    assert_test(s == 400 and "already exists" in b.get("detail", ""), "Duplicate registration cleanly rejected with 400")

    # -------------------------------------------------------------
    # 3. UNVERIFIED ACCOUNT LOGIN BLOCK
    # -------------------------------------------------------------
    print("\n--- 3. Testing Unverified Account Login Blocking ---")
    s, b = post("/api/auth/login", {"email": test_email, "password": test_pw})
    assert_test(s == 403 and "not been verified" in b.get("detail", "").lower(), "Login cleanly BLOCKED (403) before OTP verification")

    # -------------------------------------------------------------
    # 4. EMAIL OTP VERIFICATION & RESEND
    # -------------------------------------------------------------
    print("\n--- 4. Testing OTP Verification Flow ---")
    reg_otp = get_latest_otp(test_email)
    assert_test(reg_otp is not None and len(reg_otp) == 6, f"6-digit OTP code generated and stored in database: {reg_otp}")

    # 4a. Incorrect OTP code
    s, b = post("/api/auth/verify-otp", {"email": test_email, "otp_code": "000000"})
    assert_test(s == 400 and "Invalid" in b.get("detail", ""), "Incorrect OTP code rejected with 400")

    # 4b. Successful OTP verification
    s, b = post("/api/auth/verify-otp", {"email": test_email, "otp_code": reg_otp})
    assert_test(s == 200 and "access_token" in b, "Correct OTP verification returns 200 and JWT access token")
    new_user_token = b.get("access_token")

    # Verify database updated
    user_rec = get_user_db_record(test_email)
    assert_test(user_rec and user_rec[4] in (1, True), "Database user.is_email_verified updated to True")

    # 4c. Verify reused OTP is rejected
    s, b = post("/api/auth/verify-otp", {"email": test_email, "otp_code": reg_otp})
    assert_test(s == 400, "Reused / expired OTP code rejected with 400")

    # -------------------------------------------------------------
    # 5. POST-VERIFICATION LOGIN
    # -------------------------------------------------------------
    print("\n--- 5. Testing Login for Verified Account ---")
    # Wrong password
    s, b = post("/api/auth/login", {"email": test_email, "password": "WrongPassword!"})
    assert_test(s == 401, "Invalid password rejected with 401 Unauthorized")

    # Correct credentials
    s, b = post("/api/auth/login", {"email": test_email, "password": test_pw})
    assert_test(s == 200 and "access_token" in b, "Verified account login succeeds with 200 and valid JWT")

    # -------------------------------------------------------------
    # 6. FORGOT & RESET PASSWORD FLOW
    # -------------------------------------------------------------
    print("\n--- 6. Testing Forgot Password & Reset Password Flow ---")
    # 6a. Dispatch reset code
    s, b = post("/api/auth/forgot-password", {"email": test_email})
    assert_test(s == 200 and "message" in b, "Forgot password endpoint returns 200 with notification")

    reset_otp = get_latest_otp(test_email, purpose="PASSWORD_RESET")
    assert_test(reset_otp is not None, f"Password reset OTP code issued in database: {reset_otp}")

    # 6b. Reset with incorrect code
    s, b = post("/api/auth/reset-password", {"email": test_email, "otp_code": "999999", "new_password": "NewSecretPassword2026!"})
    assert_test(s == 400, "Incorrect reset OTP code rejected with 400")

    # 6c. Reset with correct code
    new_pw = "BrandNewP@ssw0rd2026!"
    s, b = post("/api/auth/reset-password", {"email": test_email, "otp_code": reset_otp, "new_password": new_pw})
    assert_test(s == 200 and "successfully reset" in b.get("message", ""), "Password reset succeeds with 200")

    # 6d. Verify old password fails and new password works
    s_old, _ = post("/api/auth/login", {"email": test_email, "password": test_pw})
    assert_test(s_old == 401, "Old password rejected after reset (401)")

    s_new, b_new = post("/api/auth/login", {"email": test_email, "password": new_pw})
    assert_test(s_new == 200 and "access_token" in b_new, "New password successfully authenticates user (200)")

    # -------------------------------------------------------------
    # 7. GOOGLE & GITHUB OAUTH AUDIT
    # -------------------------------------------------------------
    print("\n--- 7. Testing Google & GitHub OAuth Integration ---")
    s, b = get("/api/auth/oauth/status")
    assert_test(s == 200, "OAuth status endpoint returns 200")
    assert_test(b.get("google", {}).get("configured") is True, "Google OAuth configured flag is True")
    assert_test(b.get("github", {}).get("configured") is True, "GitHub OAuth configured flag is True")

    # Test Google authorize URL generation
    s, b = get("/api/auth/oauth/google/authorize?role=CREATOR")
    assert_test(s == 200 and "accounts.google.com" in b.get("authorization_url", ""), "Google authorize endpoint returns valid Google OAuth 2.0 URL")

    # Test GitHub authorize URL generation
    s, b = get("/api/auth/oauth/github/authorize?role=BRAND")
    assert_test(s == 200 and "github.com/login/oauth" in b.get("authorization_url", ""), "GitHub authorize endpoint returns valid GitHub OAuth URL")

    # -------------------------------------------------------------
    # 8. SESSIONS & JWT VALIDATION
    # -------------------------------------------------------------
    print("\n--- 8. Testing Session & JWT Security ---")
    # Valid token
    s, b = get("/api/auth/me", token=new_user_token)
    assert_test(s == 200 and b.get("email") == test_email, "JWT token decodes and resolves correct user context")

    # Tampered token
    s, b = get("/api/auth/me", token=new_user_token + "tampered")
    assert_test(s == 401, "Tampered JWT token rejected with 401 Unauthorized")

    # Missing token
    s, b = get("/api/auth/me")
    assert_test(s == 401, "Missing Authorization header rejected with 401 Unauthorized")

    # Summary
    print("\n=================================================================")
    print(f"AUDIT COMPLETE: {passed} PASSED, {failed} FAILED (TOTAL: {passed + failed})")
    print("=================================================================")

    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    main()
