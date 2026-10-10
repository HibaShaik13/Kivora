"""
Kivora Authentication & Account Management Router
Implements real user registration, bcrypt password hashing, email OTP verification,
PyJWT token generation, and account profile retrieval.
"""

import uuid
from datetime import datetime, timedelta
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.models import User, OtpCode, CreatorProfile, BrandProfile
from backend.app.schemas.schemas import (
    UserRegisterRequest,
    UserLoginRequest,
    VerifyOtpRequest,
    ResendOtpRequest,
    TokenResponse,
    UserSummaryResponse,
)
from backend.app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    generate_otp_code,
)
from backend.app.core.deps import get_current_user
from backend.app.services.email_service import send_otp_email

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def build_user_summary(user: User) -> UserSummaryResponse:
    has_profile = False
    profile_id = None
    if user.role == "CREATOR" and user.creator_profile:
        has_profile = True
        profile_id = user.creator_profile.id
    elif user.role == "BRAND" and user.brand_profile:
        has_profile = True
        profile_id = user.brand_profile.id

    return UserSummaryResponse(
        id=user.id,
        email=user.email,
        role=user.role,
        is_email_verified=user.is_email_verified,
        has_profile=has_profile,
        profile_id=profile_id,
    )


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    # 1. Normalize and check uniqueness
    email = payload.email.lower().strip()
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user and existing_user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please sign in."
        )

    role = payload.role.upper().strip()
    if role not in ["CREATOR", "BRAND"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be either 'CREATOR' or 'BRAND'."
        )

    # 2. Hash password with bcrypt
    hashed = hash_password(payload.password)

    # 3. Create or reuse unverified User record
    is_new_user = False
    if existing_user and not existing_user.is_email_verified:
        user = existing_user
        user.hashed_password = hashed
        user.role = role
        user_id = user.id
    else:
        is_new_user = True
        user_id = f"user-{uuid.uuid4().hex[:12]}"
        user = User(
            id=user_id,
            email=email,
            hashed_password=hashed,
            role=role,
            is_email_verified=False,
            created_at=datetime.utcnow()
        )
        db.add(user)

    # 4. Generate & store 6-digit OTP code (15-min expiration)
    otp = generate_otp_code()
    otp_record = OtpCode(
        id=f"otp-{uuid.uuid4().hex[:10]}",
        email=email,
        code=otp,
        purpose="REGISTRATION",
        expires_at=datetime.utcnow() + timedelta(minutes=15),
        is_used=False,
        created_at=datetime.utcnow()
    )
    db.add(otp_record)
    db.commit()

    try:
        dispatch_result = send_otp_email(email, otp, purpose="REGISTRATION")
    except Exception as e:
        db.delete(otp_record)
        if is_new_user:
            db.delete(user)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e)
        )

    response_data = {
        "message": "User registered successfully. Please verify your account using the OTP sent to your email.",
        "user_id": user_id,
        "email": email,
        "role": role,
    }
    if dispatch_result and dispatch_result.get("dev_otp"):
        response_data["dev_otp"] = dispatch_result["dev_otp"]
        response_data["message"] = f"Account registered! Verification code: {dispatch_result['dev_otp']}"

    return response_data


@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp(payload: VerifyOtpRequest, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    code = payload.otp_code.strip()

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account associated with this email address."
        )

    # Find the latest active OTP code for this email regardless of code
    otp_record = db.query(OtpCode).filter(
        OtpCode.email == email,
        OtpCode.is_used == False,
    ).order_by(OtpCode.created_at.desc()).first()

    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active verification code found for this email."
        )

    if datetime.utcnow() > otp_record.expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new code."
        )

    if otp_record.attempts >= 5:
        otp_record.is_used = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many failed attempts. Please request a new verification code."
        )

    if otp_record.code != code:
        otp_record.attempts += 1
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code."
        )

    if datetime.utcnow() > otp_record.expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new code."
        )

    # Mark OTP as used and user as verified
    otp_record.is_used = True
    user.is_email_verified = True
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)

    # Issue JWT access token
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role}
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=build_user_summary(user)
    )


@router.post("/resend-otp")
def resend_otp(payload: ResendOtpRequest, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account associated with this email address."
        )

    # Check for resend cooldown (60 seconds)
    recent_otp = db.query(OtpCode).filter(
        OtpCode.email == email
    ).order_by(OtpCode.created_at.desc()).first()
    
    if recent_otp and datetime.utcnow() < recent_otp.created_at + timedelta(seconds=60):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Please wait 60 seconds before requesting a new verification code."
        )

    otp = generate_otp_code()
    otp_record = OtpCode(
        id=f"otp-{uuid.uuid4().hex[:10]}",
        email=email,
        code=otp,
        purpose="RESEND",
        expires_at=datetime.utcnow() + timedelta(minutes=15),
        is_used=False,
        created_at=datetime.utcnow()
    )
    db.add(otp_record)
    db.commit()

    try:
        dispatch_result = send_otp_email(email, otp, purpose="RESEND")
    except Exception as e:
        db.delete(otp_record)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e)
        )
        
    res = {"message": "Verification code resent successfully."}
    if dispatch_result and dispatch_result.get("dev_otp"):
        res["dev_otp"] = dispatch_result["dev_otp"]
        res["message"] = f"New verification code: {dispatch_result['dev_otp']}"
    return res


@router.post("/login", response_model=TokenResponse)
def login_user(payload: UserLoginRequest, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email address not verified. Please complete OTP verification first."
        )

    access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role}
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=build_user_summary(user)
    )


@router.get("/me", response_model=UserSummaryResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return build_user_summary(current_user)
