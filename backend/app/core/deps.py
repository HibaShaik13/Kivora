"""
FastAPI Authentication & Role-Based Access Control Dependencies
Provides strict JWT validation, email verification checks, and role enforcement.
"""

from typing import List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.models import User, CreatorProfile, BrandProfile
from backend.app.core.security import decode_access_token

security_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Session = Depends(get_db)
) -> User:
    """Extracts and verifies the JWT token from the Authorization header."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload missing subject identifier.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated user no longer exists in database.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def get_current_verified_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Ensures the authenticated user has completed email OTP verification."""
    if not current_user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email address not verified. Please verify your account via OTP."
        )
    return current_user


def require_role(allowed_roles: List[str]):
    """Factory dependency enforcing specific user roles (e.g. ['CREATOR'], ['BRAND'])."""
    def role_checker(user: User = Depends(get_current_verified_user)) -> User:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Role '{user.role}' not permitted. Requires: {', '.join(allowed_roles)}."
            )
        return user
    return role_checker


def get_current_creator(
    user: User = Depends(require_role(["CREATOR"])),
    db: Session = Depends(get_db)
) -> CreatorProfile:
    """Returns the CreatorProfile associated with the authenticated creator user."""
    creator = user.creator_profile
    if not creator:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Creator profile not yet initialized. Please complete profile setup."
        )
    return creator


def get_current_brand(
    user: User = Depends(require_role(["BRAND"])),
    db: Session = Depends(get_db)
) -> BrandProfile:
    """Returns the BrandProfile associated with the authenticated brand user."""
    brand = user.brand_profile
    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand profile not yet initialized. Please complete brand setup."
        )
    return brand
