"""
Kivora Core Security & Authentication Utilities
Handles bcrypt password hashing, PyJWT creation/decoding, and secure OTP generation.
"""

import os
import secrets
import bcrypt
import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

ENV = os.getenv("KIVORA_ENV", os.getenv("ENV", "development")).lower()
SECRET_KEY = os.getenv("SECRET_KEY", os.getenv("JWT_SECRET_KEY"))

if not SECRET_KEY:
    if ENV in ["development", "dev", "test", "testing"]:
        SECRET_KEY = "kivora_dev_test_ephemeral_jwt_secret_never_use_in_production_32bytes_minimum_length"
    else:
        # Generate safe session key if unconfigured in environment
        import secrets as _sec
        SECRET_KEY = _sec.token_urlsafe(64)

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24


def hash_password(password: str) -> str:
    """Hashes a plain password using bcrypt with salt."""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against a bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Creates a signed PyJWT token with expiration."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and validates a PyJWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None


def generate_otp_code() -> str:
    """Generates a cryptographically secure 6-digit numeric OTP code."""
    return f"{secrets.randbelow(900000) + 100000}"
