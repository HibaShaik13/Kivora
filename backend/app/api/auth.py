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
    # 1. Normalize and validate email and role
    email = payload.email.lower().strip()
    role = payload.role.upper().strip()
    if role not in ["CREATOR", "BRAND"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be either 'CREATOR' or 'BRAND'."
        )

    # 2. Hash password with bcrypt
    hashed = hash_password(payload.password)

    # 3. Check existing user state
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        if existing_user.is_email_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists. Please sign in."
            )
        else:
            # Unverified account recovery: check 60s cooldown before issuing new OTP
            recent_otp = db.query(OtpCode).filter(
                OtpCode.email == email,
                OtpCode.created_at >= datetime.utcnow() - timedelta(seconds=60)
            ).first()
            if recent_otp:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="A verification code was recently requested for this account. Please wait 60 seconds before retrying."
                )

            # Update password hash and role for the pending account
            existing_user.hashed_password = hashed
            existing_user.role = role
            existing_user.updated_at = datetime.utcnow()
            user = existing_user
    else:
        # Create fresh User record
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

    # 4. Invalidate any prior unused OTPs for this email to prevent dangling codes
    db.query(OtpCode).filter(
        OtpCode.email == email,
        OtpCode.is_used == False
    ).update({"is_used": True})

    # 5. Generate & persist cryptographically secure 6-digit OTP code (15-min expiration)
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
    db.refresh(user)

    # 6. Dispatch OTP via email service
    dispatch_result = send_otp_email(email, otp, purpose="REGISTRATION")
    delivery_status = dispatch_result.get("delivery_status", "DELIVERED")
    delivery_notice = dispatch_result.get("delivery_notice", "")

    if delivery_status == "DELIVERED":
        msg = f"User registered successfully! A 6-digit verification code has been sent to {email}."
    elif delivery_status == "SIMULATED":
        if "sending limit exceeded" in delivery_notice.lower() or "550" in delivery_notice:
            msg = "Gmail daily sending limit exceeded (550). Operating in development mode with generated OTP."
        elif "authentication failed" in delivery_notice.lower():
            msg = "Gmail authentication failed. Operating in development mode with generated OTP."
        else:
            msg = "User registered in development mode. Verification code generated."
    else:
        msg = "Account created, but verification email could not be sent. Please check SMTP configuration or request a new code."

    response_data = {
        "message": msg,
        "user_id": user.id,
        "email": email,
        "role": user.role,
        "delivery_status": delivery_status,
    }
    if dispatch_result.get("dev_otp"):
        response_data["dev_otp"] = dispatch_result["dev_otp"]
    if dispatch_result.get("delivery_notice"):
        response_data["delivery_notice"] = dispatch_result["delivery_notice"]

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

    # Find the latest active OTP code for this email matching the submitted code
    otp_record = db.query(OtpCode).filter(
        OtpCode.email == email,
        OtpCode.code == code,
        OtpCode.is_used == False,
    ).order_by(OtpCode.created_at.desc()).first()

    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code. Please check your 6-digit code or request a new one."
        )

    if datetime.utcnow() > otp_record.expires_at:
        # Invalidate expired code
        otp_record.is_used = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new code."
        )

    # Invalidate ALL unused OTPs for this email upon successful verification
    db.query(OtpCode).filter(
        OtpCode.email == email,
        OtpCode.is_used == False
    ).update({"is_used": True})

    # Activate user account
    user.is_email_verified = True
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)

    # Issue signed JWT access token (24h lifespan)
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

    if user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account is already verified. Please sign in."
        )

    # Rate limiting: Maximum 1 OTP dispatch per 60 seconds per email
    recent_otp = db.query(OtpCode).filter(
        OtpCode.email == email,
        OtpCode.created_at >= datetime.utcnow() - timedelta(seconds=60)
    ).first()
    if recent_otp:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="A verification code was recently sent. Please wait 60 seconds before requesting a new code."
        )

    # Invalidate any prior unused OTPs
    db.query(OtpCode).filter(
        OtpCode.email == email,
        OtpCode.is_used == False
    ).update({"is_used": True})

    # Generate and persist fresh OTP
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

    dispatch_result = send_otp_email(email, otp, purpose="RESEND")
    delivery_status = dispatch_result.get("delivery_status", "DELIVERED")
    delivery_notice = dispatch_result.get("delivery_notice", "")

    if delivery_status == "DELIVERED":
        msg = f"New verification code sent to {email}. Please check your inbox."
    elif delivery_status == "SIMULATED":
        if "sending limit exceeded" in delivery_notice.lower() or "550" in delivery_notice:
            msg = "Gmail daily sending limit exceeded (550). Operating in development mode with generated OTP."
        elif "authentication failed" in delivery_notice.lower():
            msg = "Gmail authentication failed. Operating in development mode with generated OTP."
        else:
            msg = "Development mode: New verification code generated."
    else:
        msg = "New code generated, but email delivery encountered an issue. Please check SMTP settings."

    res = {
        "message": msg,
        "delivery_status": delivery_status,
    }
    if dispatch_result.get("dev_otp"):
        res["dev_otp"] = dispatch_result["dev_otp"]
    if dispatch_result.get("delivery_notice"):
        res["delivery_notice"] = dispatch_result["delivery_notice"]

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
