"""
Kivora Core Security & Authentication Utilities
Handles bcrypt password hashing, PyJWT creation/decoding, and secure OTP generation.
"""

import os
import secrets
import hashlib
import bcrypt
import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

ENV = os.getenv("KIVORA_ENV", os.getenv("ENV", "development")).lower()
SECRET_KEY = os.getenv("SECRET_KEY")

if not SECRET_KEY:
    if ENV in ["development", "dev", "test", "testing"]:
        # Permitted fallback only under explicit local development or testing environments
        SECRET_KEY = "kivora_dev_test_ephemeral_jwt_secret_never_use_in_production"
    else:
        raise RuntimeError(
            "CRITICAL SECURITY CONFIGURATION ERROR: 'SECRET_KEY' environment variable "
            "must be explicitly set in non-development environments."
        )

# Ensure the signing key meets the RFC 7518 256-bit (32 bytes) requirement for HS256
# to eliminate PyJWT InsecureKeyLengthWarning while maintaining backward compatibility
if len(SECRET_KEY.encode("utf-8")) < 32:
    SIGNING_KEY = hashlib.sha256(SECRET_KEY.encode("utf-8")).digest()
    LEGACY_KEY = SECRET_KEY
else:
    SIGNING_KEY = SECRET_KEY.encode("utf-8") if isinstance(SECRET_KEY, str) else SECRET_KEY
    LEGACY_KEY = None

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
    """Creates a signed PyJWT token with expiration using the secure 256-bit key."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    encoded_jwt = jwt.encode(to_encode, SIGNING_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decodes and validates a PyJWT token.
    First attempts verification with SIGNING_KEY. If signature verification fails
    and a LEGACY_KEY exists, attempts verification with LEGACY_KEY to preserve
    active user sessions across server restarts.
    """
    try:
        payload = jwt.decode(token, SIGNING_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.InvalidSignatureError:
        if LEGACY_KEY:
            try:
                payload = jwt.decode(token, LEGACY_KEY, algorithms=[ALGORITHM])
                return payload
            except jwt.PyJWTError:
                return None
        return None
    except jwt.PyJWTError:
        return None


def generate_otp_code() -> str:
    """Generates a cryptographically secure 6-digit numeric OTP code using secrets."""
    code = secrets.randbelow(900000) + 100000
    return str(code)

