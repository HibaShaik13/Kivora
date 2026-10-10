"""
Kivora Master Authentication & Email Delivery Regression Suite
Tests registration, unverified account recovery, cryptographic OTP generation,
invalidation of stale OTPs, rate limiting, single-use enforcement, JWT lifecycle,
and mocked multi-tier email dispatch.

Does NOT send real emails or alter production data.
"""

import sys
import uuid
from pathlib import Path
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock

# Ensure project root is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from starlette.testclient import TestClient
from backend.app.main import app
from backend.app.database import SessionLocal
from backend.app.models.models import User, OtpCode
from backend.app.core.security import generate_otp_code, hash_password, verify_password, decode_access_token
from backend.app.services.email_service import send_otp_email

client = TestClient(app)

TEST_USER_1 = "test.master.auth.user1@kivora.test"
TEST_USER_2 = "test.master.auth.user2@kivora.test"


def cleanup_fixtures(db):
    """Safely cleans up only namespaced test fixtures."""
    for email in [TEST_USER_1, TEST_USER_2]:
        user = db.query(User).filter(User.email == email).first()
        if user:
            db.delete(user)
        db.query(OtpCode).filter(OtpCode.email == email).delete()
    db.commit()


def run_auth_and_email_tests():
    print("\n=======================================================")
    print("  KIVORA MASTER AUTHENTICATION & EMAIL DELIVERY SUITE")
    print("=======================================================\n")

    db = SessionLocal()
    cleanup_fixtures(db)

    # ----------------------------------------------------
    # 1. Cryptographic OTP Generator Audit
    # ----------------------------------------------------
    print("--- 1. Testing Cryptographic OTP Generator ---")
    otp_samples = [generate_otp_code() for _ in range(20)]
    assert all(len(code) == 6 and code.isdigit() for code in otp_samples), "OTP must be 6 numeric digits"
    assert len(set(otp_samples)) == len(otp_samples), "OTP codes must be unique and uniform"
    print("[PASS] Cryptographic OTP generator generates uniform 6-digit codes.")

    # ----------------------------------------------------
    # 2. Mocked Email Dispatch Logic (SMTP, Resend, Dev)
    # ----------------------------------------------------
    print("\n--- 2. Testing Mocked Multi-Tier Email Dispatch ---")
    
    # Test 2A: SMTP Success
    with patch("backend.app.services.email_service.is_smtp_configured", return_value=True), \
         patch("backend.app.services.email_service._dispatch_via_smtp", return_value=True):
        res_smtp = send_otp_email(TEST_USER_1, "123456", "REGISTRATION")
        assert res_smtp["sent"] is True
        assert res_smtp["provider"] == "smtp"
        assert res_smtp["delivery_status"] == "DELIVERED"
        print("[PASS] Mocked SMTP dispatch returns DELIVERED status.")

    # Test 2B: SMTP Failure -> Resend Fallback Success
    with patch("backend.app.services.email_service.is_smtp_configured", return_value=True), \
         patch("backend.app.services.email_service._dispatch_via_smtp", side_effect=Exception("SMTP Connection Error")), \
         patch("backend.app.services.email_service.RESEND_API_KEY", "re_test_key_mock"), \
         patch("requests.post") as mock_post:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_post.return_value = mock_resp

        res_resend = send_otp_email(TEST_USER_1, "123456", "REGISTRATION")
        assert res_resend["sent"] is True
        assert res_resend["provider"] == "resend"
        assert res_resend["delivery_status"] == "DELIVERED"
        print("[PASS] Mocked Resend fallback succeeds on SMTP failure.")

    # Test 2C: Dev Fallback (When no provider configured in non-production)
    with patch("backend.app.services.email_service.is_smtp_configured", return_value=False), \
         patch("backend.app.services.email_service.RESEND_API_KEY", None), \
         patch("backend.app.services.email_service.KIVORA_ENV", "development"):
        res_dev = send_otp_email(TEST_USER_1, "123456", "REGISTRATION")
        assert res_dev["sent"] is True
        assert res_dev["provider"] == "dev_logger"
        assert res_dev["delivery_status"] == "SIMULATED"
        assert res_dev["dev_otp"] == "123456"
        print("[PASS] Dev fallback returns SIMULATED delivery with dev_otp.")

    # ----------------------------------------------------
    # 3. User Registration Flow & Pending State
    # ----------------------------------------------------
    print("\n--- 3. Testing User Registration Flow ---")
    with patch("backend.app.api.auth.send_otp_email", return_value={"sent": True, "provider": "dev_logger", "delivery_status": "SIMULATED", "dev_otp": "654321"}):
        reg_res = client.post("/api/auth/register", json={
            "email": TEST_USER_1,
            "password": "ValidPassword123!",
            "role": "CREATOR"
        })
    assert reg_res.status_code == 201, f"Registration failed: {reg_res.text}"
    data = reg_res.json()
    assert data["email"] == TEST_USER_1
    assert data["role"] == "CREATOR"
    assert "delivery_status" in data
    print(f"[PASS] User registered: {data['user_id']} | Status: {data['delivery_status']}")

    # Verify pending verification in DB
    user_db = db.query(User).filter(User.email == TEST_USER_1).first()
    assert user_db is not None
    assert user_db.is_email_verified is False
    print("[PASS] User database record persisted with is_email_verified=False.")

    # ----------------------------------------------------
    # 4. Block Unverified User Login
    # ----------------------------------------------------
    print("\n--- 4. Testing Unverified User Login Blocking ---")
    login_unverified = client.post("/api/auth/login", json={
        "email": TEST_USER_1,
        "password": "ValidPassword123!"
    })
    assert login_unverified.status_code == 403, "Unverified login must be rejected with 403"
    assert "not verified" in login_unverified.json()["detail"].lower()
    print("[PASS] Unverified login correctly rejected with 403 Forbidden.")

    # ----------------------------------------------------
    # 5. Unverified Account Recovery / Re-Registration
    # ----------------------------------------------------
    print("\n--- 5. Testing Unverified Account Recovery & Password Update ---")
    # Immediate retry within 60s should trigger 429 rate limit
    fast_retry = client.post("/api/auth/register", json={
        "email": TEST_USER_1,
        "password": "NewUpdatedPassword123!",
        "role": "CREATOR"
    })
    assert fast_retry.status_code == 429
    print("[PASS] Immediate re-registration within 60s rate-limited with 429.")

    # Simulate elapsed 60s by backdating prior OTP created_at
    db.query(OtpCode).filter(OtpCode.email == TEST_USER_1).update({
        "created_at": datetime.utcnow() - timedelta(seconds=65)
    })
    db.commit()

    # Re-register with new password
    with patch("backend.app.api.auth.send_otp_email", return_value={"sent": True, "provider": "dev_logger", "delivery_status": "SIMULATED", "dev_otp": "654321"}):
        recovery_reg = client.post("/api/auth/register", json={
            "email": TEST_USER_1,
            "password": "NewUpdatedPassword123!",
            "role": "CREATOR"
        })
    assert recovery_reg.status_code == 201
    db.refresh(user_db)
    assert verify_password("NewUpdatedPassword123!", user_db.hashed_password)
    print("[PASS] Unverified account re-registration successfully updated password and issued new OTP.")

    # ----------------------------------------------------
    # 6. Prior OTP Invalidation & Single-Use Enforcement
    # ----------------------------------------------------
    print("\n--- 6. Testing Invalidation of Stale OTPs ---")
    all_otps = db.query(OtpCode).filter(OtpCode.email == TEST_USER_1).order_by(OtpCode.created_at.desc()).all()
    assert len(all_otps) >= 2
    # Only the latest OTP should be unused
    assert all_otps[0].is_used is False
    assert all(o.is_used is True for o in all_otps[1:])
    old_otp = all_otps[1].code
    latest_otp = all_otps[0].code

    # Attempting verification with older OTP must fail
    old_otp_verify = client.post("/api/auth/verify-otp", json={
        "email": TEST_USER_1,
        "otp_code": old_otp
    })
    assert old_otp_verify.status_code == 400
    print("[PASS] Superseded / older OTP code rejected with 400 Bad Request.")

    # ----------------------------------------------------
    # 7. Invalid & Expired OTP Rejection
    # ----------------------------------------------------
    print("\n--- 7. Testing Invalid and Expired OTP Handling ---")
    bad_code_res = client.post("/api/auth/verify-otp", json={
        "email": TEST_USER_1,
        "otp_code": "000000"
    })
    assert bad_code_res.status_code == 400
    print("[PASS] Invalid OTP code rejected with 400 Bad Request.")

    # Test expired OTP
    db.query(OtpCode).filter(OtpCode.id == all_otps[0].id).update({
        "expires_at": datetime.utcnow() - timedelta(minutes=1)
    })
    db.commit()

    expired_verify = client.post("/api/auth/verify-otp", json={
        "email": TEST_USER_1,
        "otp_code": latest_otp
    })
    assert expired_verify.status_code == 400
    assert "expired" in expired_verify.json()["detail"].lower()
    print("[PASS] Expired OTP code rejected with 400 Bad Request.")

    # ----------------------------------------------------
    # 8. Resend OTP & Rate Limiting
    # ----------------------------------------------------
    print("\n--- 8. Testing Resend OTP & Cooldown Enforcement ---")
    # Backdate OTP to allow resend
    db.query(OtpCode).filter(OtpCode.email == TEST_USER_1).update({
        "created_at": datetime.utcnow() - timedelta(seconds=70)
    })
    db.commit()

    with patch("backend.app.api.auth.send_otp_email", return_value={"sent": True, "provider": "dev_logger", "delivery_status": "SIMULATED", "dev_otp": "789123"}):
        resend_res = client.post("/api/auth/resend-otp", json={"email": TEST_USER_1})
    assert resend_res.status_code == 200
    assert "delivery_status" in resend_res.json()
    print(f"[PASS] Resend OTP succeeded | Delivery status: {resend_res.json()['delivery_status']}")

    # Immediate second resend must fail with 429
    resend_rate_limit = client.post("/api/auth/resend-otp", json={"email": TEST_USER_1})
    assert resend_rate_limit.status_code == 429
    print("[PASS] Rapid resend blocked by 60s rate limit with 429 Too Many Requests.")

    # ----------------------------------------------------
    # 9. Successful OTP Verification & JWT Issuance
    # ----------------------------------------------------
    print("\n--- 9. Testing Successful OTP Verification ---")
    active_otp = db.query(OtpCode).filter(
        OtpCode.email == TEST_USER_1,
        OtpCode.is_used == False
    ).order_by(OtpCode.created_at.desc()).first().code

    verify_success = client.post("/api/auth/verify-otp", json={
        "email": TEST_USER_1,
        "otp_code": active_otp
    })
    assert verify_success.status_code == 200
    token_data = verify_success.json()
    assert "access_token" in token_data
    assert token_data["user"]["is_email_verified"] is True
    access_token = token_data["access_token"]
    print("[PASS] OTP verified successfully; JWT access token returned.")

    # Validate JWT payload
    jwt_payload = decode_access_token(access_token)
    assert jwt_payload["email"] == TEST_USER_1
    assert jwt_payload["role"] == "CREATOR"
    print(f"[PASS] JWT token signature & payload validated: sub={jwt_payload['sub']}")

    # ----------------------------------------------------
    # 10. Verified User Login
    # ----------------------------------------------------
    print("\n--- 10. Testing Verified User Login ---")
    login_success = client.post("/api/auth/login", json={
        "email": TEST_USER_1,
        "password": "NewUpdatedPassword123!"
    })
    assert login_success.status_code == 200
    assert login_success.json()["user"]["email"] == TEST_USER_1
    print("[PASS] Verified user successfully authenticated via /api/auth/login.")

    # Duplicate registration on verified account must fail
    dup_reg = client.post("/api/auth/register", json={
        "email": TEST_USER_1,
        "password": "SomeOtherPassword123!",
        "role": "CREATOR"
    })
    assert dup_reg.status_code == 400
    assert "already exists" in dup_reg.json()["detail"].lower()
    print("[PASS] Duplicate registration on verified account blocked with 400 Bad Request.")

    # ----------------------------------------------------
    # 11. Cleanup Test Fixtures
    # ----------------------------------------------------
    cleanup_fixtures(db)
    db.close()

    print("\n=======================================================")
    print("[SUCCESS] ALL AUTHENTICATION & EMAIL TESTS PASSED (100%)")
    print("=======================================================\n")


if __name__ == "__main__":
    run_auth_and_email_tests()
