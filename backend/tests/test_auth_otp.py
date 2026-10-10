import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
import uuid

from backend.app.main import app
from backend.app.database import get_db, SessionLocal
from backend.app.models.models import User, OtpCode
    
client = TestClient(app)

@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def mock_smtp_env(monkeypatch):
    import backend.app.services.email_service as email_service
    monkeypatch.setattr(email_service, "SMTP_HOST", "mock_host")
    monkeypatch.setattr(email_service, "SMTP_PORT", 587)
    monkeypatch.setattr(email_service, "SMTP_USER", "mock_user")
    monkeypatch.setattr(email_service, "SMTP_PASSWORD", "mock_pass")

def test_register_and_verify(db_session, mock_smtp_env, monkeypatch):
    email = f"test_{uuid.uuid4()}@example.com"
    
    import backend.app.services.email_service as email_service
    called = False
    
    def mock_send(*args, **kwargs):
        nonlocal called
        called = True
        return {"sent": True, "provider": "smtp", "status": "delivered"}
        
    monkeypatch.setattr(email_service, "_send_via_smtp", mock_send)
    
    # 1. Register
    res = client.post("/api/auth/register", json={
        "email": email,
        "password": "Password123!",
        "role": "CREATOR",
        "full_name": "Test User"
    })
    assert res.status_code == 201
    assert called == True
    
    # Check DB for OTP
    otp_record = db_session.query(OtpCode).filter(OtpCode.email == email).first()
    assert otp_record is not None
    assert not otp_record.is_used
    assert otp_record.attempts == 0
    
    otp_code = otp_record.code
    
    # 2. Verify with wrong OTP
    res_wrong = client.post("/api/auth/verify-otp", json={
        "email": email,
        "otp_code": "000000"
    })
    assert res_wrong.status_code == 400
    assert "Invalid verification code" in res_wrong.json()["detail"]
    
    db_session.refresh(otp_record)
    assert otp_record.attempts == 1
    
    # 3. Verify with correct OTP
    res_correct = client.post("/api/auth/verify-otp", json={
        "email": email,
        "otp_code": otp_code
    })
    assert res_correct.status_code == 200
    assert "access_token" in res_correct.json()
    
    db_session.refresh(otp_record)
    assert otp_record.is_used == True
    
    # 4. OTP Reuse
    res_reuse = client.post("/api/auth/verify-otp", json={
        "email": email,
        "otp_code": otp_code
    })
    assert res_reuse.status_code == 400
    assert "No active verification code found" in res_reuse.json()["detail"]

def test_attempt_limit(db_session, mock_smtp_env, monkeypatch):
    email = f"test_{uuid.uuid4()}@limit.com"
    import backend.app.services.email_service as email_service
    
    def mock_send(*args, **kwargs):
        return {"sent": True, "provider": "smtp", "status": "delivered"}
    monkeypatch.setattr(email_service, "_send_via_smtp", mock_send)
    
    client.post("/api/auth/register", json={
        "email": email,
        "password": "Password123!",
        "role": "CREATOR"
    })
    
    for _ in range(5):
        client.post("/api/auth/verify-otp", json={
            "email": email,
            "otp_code": "000000"
        })
        
    # 6th attempt should return 'Too many failed attempts'
    res = client.post("/api/auth/verify-otp", json={
        "email": email,
        "otp_code": "000000"
    })
    assert res.status_code == 400
    assert "Too many failed attempts" in res.json()["detail"]

def test_missing_smtp_raises(monkeypatch):
    import backend.app.services.email_service as email_service
    monkeypatch.setattr(email_service, "SMTP_USER", "")
    from backend.app.services.email_service import send_otp_email
    with pytest.raises(ValueError, match="Missing required SMTP configuration"):
        send_otp_email("test@example.com", "123456")
