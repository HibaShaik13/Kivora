import pytest
from fastapi.testclient import TestClient
import uuid

from backend.app.main import app
from backend.app.database import get_db, SessionLocal
from backend.app.models.models import User, OtpCode

@pytest.fixture
def mock_smtp_env(monkeypatch):
    import backend.app.services.email_service as email_service
    monkeypatch.setattr(email_service, "SMTP_HOST", "mock_host")
    monkeypatch.setattr(email_service, "SMTP_PORT", 587)
    monkeypatch.setattr(email_service, "SMTP_USER", "mock_user")
    monkeypatch.setattr(email_service, "SMTP_PASSWORD", "mock_pass")
    
    def mock_send(*args, **kwargs):
        return {"sent": True, "provider": "smtp", "status": "delivered"}
    monkeypatch.setattr(email_service, "_send_via_smtp", mock_send)

def test_login_invalid_password(client, db_session, mock_smtp_env):
    email = f"test_{uuid.uuid4()}@login.com"
    client.post("/api/auth/register", json={
        "email": email, "password": "Password123!", "role": "CREATOR"
    })
    # Verify account
    otp_record = db_session.query(OtpCode).filter(OtpCode.email == email).first()
    client.post("/api/auth/verify-otp", json={"email": email, "otp_code": otp_record.code})
    
    # Try logging in with invalid password
    res = client.post("/api/auth/login", json={"email": email, "password": "WrongPassword123!"})
    assert res.status_code == 401
    assert "Invalid email or password" in res.json()["detail"]

def test_login_unverified_account(client, db_session, mock_smtp_env):
    email = f"test_{uuid.uuid4()}@unverified.com"
    client.post("/api/auth/register", json={
        "email": email, "password": "Password123!", "role": "CREATOR"
    })
    
    # Try logging in before verifying
    res = client.post("/api/auth/login", json={"email": email, "password": "Password123!"})
    assert res.status_code == 403
    assert "not been verified" in res.json()["detail"].lower() or "not verified" in res.json()["detail"].lower()

def test_duplicate_registration(client, db_session, mock_smtp_env):
    email = f"test_{uuid.uuid4()}@dup.com"
    res1 = client.post("/api/auth/register", json={
        "email": email, "password": "Password123!", "role": "CREATOR"
    })
    assert res1.status_code == 201
    
    res2 = client.post("/api/auth/register", json={
        "email": email, "password": "Password123!", "role": "CREATOR"
    })
    assert res2.status_code == 400
    assert "An account with this email address already exists" in res2.json()["detail"]

def test_resend_cooldown(client, db_session, mock_smtp_env):
    email = f"test_{uuid.uuid4()}@resend.com"
    client.post("/api/auth/register", json={
        "email": email, "password": "Password123!", "role": "CREATOR"
    })
    
    # Second resend should fail due to 60s cooldown
    res = client.post("/api/auth/resend-otp", json={"email": email})
    assert res.status_code == 429
    assert "Please wait 60 seconds" in res.json()["detail"]
