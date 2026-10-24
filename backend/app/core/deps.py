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


def require_approved_creator(
    user: User = Depends(require_role(["CREATOR"])),
    db: Session = Depends(get_db),
) -> CreatorProfile:
    """
    Returns the CreatorProfile for the authenticated creator, strictly enforcing
    that the creator account has been approved by an administrator.
    - If unauthenticated -> 401 Unauthorized (via get_current_user)
    - If email unverified -> 403 Forbidden ("Email address not verified...")
    - If role != CREATOR -> 403 Forbidden ("Access denied. Role not permitted...")
    - If creator profile missing -> 404 Not Found
    - If approval_status == "PENDING" -> 403 Forbidden with error_code "CREATOR_APPROVAL_PENDING"
    - If approval_status == "REJECTED" -> 403 Forbidden with error_code "CREATOR_APPROVAL_REJECTED"
    - If approval_status == "APPROVED" -> returns CreatorProfile
    """
    creator = user.creator_profile
    if not creator:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Creator profile not yet initialized. Please complete profile setup.",
        )

    approval = getattr(creator, "approval_status", "PENDING")
    if approval == "PENDING":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error_code": "CREATOR_APPROVAL_PENDING",
                "message": "Creator account approval is pending administrator review. Marketplace features are locked until approved.",
            },
        )
    elif approval == "REJECTED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error_code": "CREATOR_APPROVAL_REJECTED",
                "message": "Creator account approval was rejected by an administrator. Please update your portfolio evidence and resubmit.",
            },
        )
    elif approval not in ("APPROVED", "LEGACY_ACTIVE"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error_code": "CREATOR_APPROVAL_UNAUTHORIZED",
                "message": f"Creator approval status '{approval}' is not authorized for marketplace features.",
            },
        )

    return creator


def require_approved_creator_user(
    creator: CreatorProfile = Depends(require_approved_creator),
) -> User:
    """Returns the authenticated User instance for an approved creator."""
    return creator.user

