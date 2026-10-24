"""
Kivora Authentication & Account Management Router
Implements real user registration, bcrypt password hashing, email OTP verification,
PyJWT token generation, and account profile retrieval.
"""

import uuid
import requests
import jwt
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.models import User, OtpCode, CreatorProfile, BrandProfile
from backend.app.core.config import (
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    get_google_client_id,
    get_google_client_secret,
    get_github_client_id,
    get_github_client_secret,
    FRONTEND_URL,
    BACKEND_URL,
    SECRET_KEY,
    is_google_oauth_configured,
    is_github_oauth_configured,
)
from backend.app.schemas.schemas import (
    UserRegisterRequest,
    UserLoginRequest,
    VerifyOtpRequest,
    ResendOtpRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
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
    approval_status = None
    if user.role == "CREATOR" and user.creator_profile:
        has_profile = True
        profile_id = user.creator_profile.id
        approval_status = getattr(user.creator_profile, "approval_status", "PENDING")
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
        approval_status=approval_status,
    )


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    # 1. Normalize and check uniqueness
    email = payload.email.lower().strip()
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
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

    # 3. Create unverified User record (email verification required)
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

    # 4. Create corresponding Profile record
    display_name = (payload.full_name or email.split("@")[0]).strip()
    clean_handle = "".join(c for c in display_name.lower().replace(" ", "_") if c.isalnum() or c == "_")[:20] or "user"
    handle = f"{clean_handle}_{uuid.uuid4().hex[:4]}"

    if role == "CREATOR":
        creator_profile = CreatorProfile(
            id=f"cr-{uuid.uuid4().hex[:12]}",
            user_id=user_id,
            display_name=display_name,
            handle=handle,
            bio="Generative AI Creator specializing in multi-modal synthesis and workflows.",
            avatar_url="/assets/avatars/elena.jpg",
            location="Remote / Global",
            years_experience=1,
            primary_specialization="Generative Video & Concept Art",
            min_budget=200.0,
            availability_status="AVAILABLE",
            verification_tier="COMMUNITY",
            approval_status="PENDING",
            verified_claims_count=0,
            completed_projects_count=0,
            average_rating=5.0,
            created_at=datetime.utcnow()
        )
        db.add(creator_profile)
    elif role == "BRAND":
        brand_profile = BrandProfile(
            id=f"br-{uuid.uuid4().hex[:12]}",
            user_id=user_id,
            company_name=display_name,
            slug=handle,
            industry="Media & Generative AI",
            logo_url=f"https://api.dicebear.com/7.x/identicon/svg?seed={handle}",
            description="Brand commissioning generative content and creative workflows.",
            company_size="1-10",
            headquarters="Remote / Global",
            is_verified_brand=False,
            created_at=datetime.utcnow()
        )
        db.add(brand_profile)

    # 5. Issue cryptographic OTP for email verification
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

    # Dispatch OTP via email service
    dispatch_result = None
    try:
        dispatch_result = send_otp_email(email, otp, purpose="REGISTRATION")
    except Exception as e:
        # In non-production, log and continue with fallback so local developer is not blocked
        import logging
        logging.getLogger("auth").warning(f"Registration email delivery note: {e}")

    response = {
        "message": "Account created successfully! Please enter the 6-digit verification code sent to your email.",
        "email": user.email,
        "requires_otp": True,
        "user_id": user.id,
        "user": build_user_summary(user),
    }
    import os
    if dispatch_result and dispatch_result.get("dev_otp") and os.getenv("KIVORA_ENV", "development").lower() != "production":
        response["dev_otp"] = dispatch_result["dev_otp"]
    return response


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


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Dispatches a 6-digit OTP code to the requested email for password reset."""
    email = payload.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()

    generic_msg = "If an account exists with this email address, a password reset verification code has been dispatched."
    if not user:
        return {"message": generic_msg, "email": email}

    otp = generate_otp_code()
    otp_record = OtpCode(
        id=f"otp-{uuid.uuid4().hex[:10]}",
        email=email,
        code=otp,
        purpose="PASSWORD_RESET",
        expires_at=datetime.utcnow() + timedelta(minutes=15),
        is_used=False,
        created_at=datetime.utcnow()
    )
    db.add(otp_record)
    db.commit()

    dispatch_result = None
    try:
        dispatch_result = send_otp_email(email, otp, purpose="PASSWORD_RESET")
    except Exception as e:
        import logging
        logging.getLogger("auth").warning(f"Password reset email delivery note: {e}")

    res = {"message": generic_msg, "email": email}
    import os
    if dispatch_result and dispatch_result.get("dev_otp") and os.getenv("KIVORA_ENV", "development").lower() != "production":
        res["dev_otp"] = dispatch_result["dev_otp"]
    return res


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Verifies OTP code and securely updates user password."""
    email = payload.email.lower().strip()
    code = payload.otp_code.strip()
    new_password = payload.new_password

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account associated with this email address."
        )

    otp_record = db.query(OtpCode).filter(
        OtpCode.email == email,
        OtpCode.purpose == "PASSWORD_RESET",
        OtpCode.is_used == False,
    ).order_by(OtpCode.created_at.desc()).first()

    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active password reset code found for this email. Please request a new code."
        )

    if datetime.utcnow() > otp_record.expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset code has expired. Please request a new code."
        )

    if otp_record.attempts >= 5:
        otp_record.is_used = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many failed attempts. Please request a new password reset code."
        )

    if otp_record.code != code:
        otp_record.attempts += 1
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code."
        )

    # Mark OTP as used and update user's hashed password
    otp_record.is_used = True
    user.hashed_password = hash_password(new_password)
    user.is_email_verified = True
    user.updated_at = datetime.utcnow()
    db.commit()

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Securely updates password for authenticated user after verifying current password."""
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )
    if len(payload.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters long.",
        )
    current_user.hashed_password = hash_password(payload.new_password)
    current_user.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Password has been successfully changed."}


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
        # Prevent silent verification: user must complete OTP verification
        # Issue fresh OTP if needed
        recent_otp = db.query(OtpCode).filter(
            OtpCode.email == email,
            OtpCode.is_used == False,
            OtpCode.expires_at > datetime.utcnow()
        ).first()
        if not recent_otp:
            otp = generate_otp_code()
            otp_record = OtpCode(
                id=f"otp-{uuid.uuid4().hex[:10]}",
                email=email,
                code=otp,
                purpose="LOGIN_VERIFY",
                expires_at=datetime.utcnow() + timedelta(minutes=15),
                is_used=False,
                created_at=datetime.utcnow()
            )
            db.add(otp_record)
            db.commit()
            try:
                send_otp_email(email, otp, purpose="LOGIN_VERIFY")
            except Exception:
                pass
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email address has not been verified. A verification code has been dispatched to your email. Please verify your account to continue."
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


# ============================================================================
# OAUTH 2.0 / OPENID CONNECT (GOOGLE & GITHUB AUTHENTICATION)
# ============================================================================

class OAuthCallbackPayload(BaseModel):
    code: str
    state: Optional[str] = None
    role: Optional[str] = "CREATOR"


def _encode_oauth_state(provider: str, role: str) -> str:
    payload = {
        "provider": provider.lower(),
        "role": role.upper() if role.upper() in ["CREATOR", "BRAND"] else "CREATOR",
        "nonce": uuid.uuid4().hex,
        "exp": datetime.utcnow() + timedelta(minutes=15)
    }
    return jwt.encode(payload, SECRET_KEY or "kivora_default_oauth_signing_secret_key", algorithm="HS256")


def _decode_oauth_state(state: str) -> Dict[str, Any]:
    try:
        return jwt.decode(state, SECRET_KEY or "kivora_default_oauth_signing_secret_key", algorithms=["HS256"])
    except Exception:
        return {"provider": "unknown", "role": "CREATOR"}


@router.get("/oauth/status")
def get_oauth_status():
    """
    Returns real-time configuration status and callback endpoints
    for Google and GitHub OAuth 2.0 / OpenID Connect providers.
    """
    return {
        "google": {
            "configured": is_google_oauth_configured(),
            "provider": "google",
            "name": "Google",
            "client_id": get_google_client_id() if is_google_oauth_configured() else None,
            "required_env": ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
            "setup_url": "https://console.cloud.google.com/apis/credentials",
            "callback_url": f"{BACKEND_URL}/api/auth/oauth/google/callback"
        },
        "github": {
            "configured": is_github_oauth_configured(),
            "provider": "github",
            "name": "GitHub",
            "client_id": get_github_client_id() if is_github_oauth_configured() else None,
            "required_env": ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"],
            "setup_url": "https://github.com/settings/developers",
            "callback_url": f"{BACKEND_URL}/api/auth/oauth/github/callback"
        }
    }


@router.get("/oauth/{provider}/authorize")
def get_oauth_authorize_url(
    provider: str,
    role: Optional[str] = Query("CREATOR", description="Account type: CREATOR or BRAND")
):
    """
    Generates secure OAuth 2.0 authorization URL with state nonce.
    If provider credentials are missing, clearly reports missing configuration.
    """
    prov = provider.lower().strip()
    if prov not in ["google", "github"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported OAuth provider: '{provider}'. Supported providers are 'google' and 'github'."
        )

    assigned_role = "BRAND" if (role or "").upper() == "BRAND" else "CREATOR"
    state_token = _encode_oauth_state(prov, assigned_role)

    if prov == "google":
        if not is_google_oauth_configured():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env."
            )
        redirect_uri = f"{BACKEND_URL}/api/auth/oauth/google/callback"
        google_cid = get_google_client_id()
        auth_url = (
            f"https://accounts.google.com/o/oauth2/v2/auth?"
            f"client_id={google_cid}&"
            f"redirect_uri={redirect_uri}&"
            f"response_type=code&"
            f"scope=openid%20email%20profile&"
            f"state={state_token}&"
            f"access_type=offline&"
            f"prompt=select_account"
        )
        return {"authorization_url": auth_url, "provider": "google", "state": state_token}

    elif prov == "github":
        if not is_github_oauth_configured():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="GitHub OAuth is not configured. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in backend/.env."
            )
        redirect_uri = f"{BACKEND_URL}/api/auth/oauth/github/callback"
        github_cid = get_github_client_id()
        auth_url = (
            f"https://github.com/login/oauth/authorize?"
            f"client_id={github_cid}&"
            f"redirect_uri={redirect_uri}&"
            f"scope=read:user%20user:email&"
            f"state={state_token}"
        )
        return {"authorization_url": auth_url, "provider": "github", "state": state_token}


def _process_oauth_exchange(provider: str, code: str, state: Optional[str], db: Session) -> User:
    """
    Exchanges authorization code for provider user identity and syncs user record.
    """
    prov = provider.lower().strip()
    decoded_state = _decode_oauth_state(state) if state else {}
    desired_role = decoded_state.get("role", "CREATOR")

    email = None
    display_name = None
    avatar_url = None

    if prov == "google":
        if not is_google_oauth_configured():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google OAuth is not configured on this server."
            )
        redirect_uri = f"{BACKEND_URL}/api/auth/oauth/google/callback"
        token_resp = requests.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": get_google_client_id(),
                "client_secret": get_google_client_secret(),
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri,
            },
            timeout=10,
        )
        if token_resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Google token exchange failed: {token_resp.text}"
            )
        tokens = token_resp.json()
        google_access_token = tokens.get("access_token")

        userinfo_resp = requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {google_access_token}"},
            timeout=10,
        )
        if userinfo_resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to retrieve profile from Google UserInfo endpoint."
            )
        google_user = userinfo_resp.json()
        email = google_user.get("email")
        display_name = google_user.get("name") or (email.split("@")[0] if email else "Creator")
        avatar_url = google_user.get("picture")

    elif prov == "github":
        if not is_github_oauth_configured():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="GitHub OAuth is not configured on this server."
            )
        redirect_uri = f"{BACKEND_URL}/api/auth/oauth/github/callback"
        token_resp = requests.post(
            "https://github.com/login/oauth/access_token",
            json={
                "client_id": get_github_client_id(),
                "client_secret": get_github_client_secret(),
                "code": code,
                "redirect_uri": redirect_uri,
            },
            headers={"Accept": "application/json"},
            timeout=10,
        )
        if token_resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"GitHub token exchange failed: {token_resp.text}"
            )
        tokens = token_resp.json()
        gh_access_token = tokens.get("access_token")
        if not gh_access_token:
            err_msg = tokens.get("error_description") or tokens.get("error") or "Unknown token error"
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"GitHub authorization failed: {err_msg}"
            )

        user_resp = requests.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {gh_access_token}"},
            timeout=10,
        )
        if user_resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to retrieve GitHub user profile."
            )
        gh_user = user_resp.json()
        email = gh_user.get("email")
        display_name = gh_user.get("name") or gh_user.get("login") or "GitHub User"
        avatar_url = gh_user.get("avatar_url")

        if not email:
            # Fetch emails if primary email is private
            emails_resp = requests.get(
                "https://api.github.com/user/emails",
                headers={"Authorization": f"Bearer {gh_access_token}"},
                timeout=10,
            )
            if emails_resp.status_code == 200:
                for em in emails_resp.json():
                    if em.get("primary") and em.get("verified"):
                        email = em.get("email")
                        break
                    elif not email and em.get("verified"):
                        email = em.get("email")

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not resolve a verified email from {provider.capitalize()} account."
        )

    email = email.lower().strip()
    user = db.query(User).filter(User.email == email).first()

    if not user:
        # Create verified Kivora user record
        user_id = f"user-{uuid.uuid4().hex[:12]}"
        user = User(
            id=user_id,
            email=email,
            hashed_password=hash_password(uuid.uuid4().hex),
            role=desired_role,
            is_email_verified=True,
            created_at=datetime.utcnow()
        )
        db.add(user)

        clean_name = display_name or email.split("@")[0]
        clean_handle = "".join(c for c in clean_name.lower().replace(" ", "_") if c.isalnum() or c == "_")[:20] or "user"
        handle = f"{clean_handle}_{uuid.uuid4().hex[:4]}"

        if desired_role == "CREATOR":
            creator = CreatorProfile(
                id=f"cr-{uuid.uuid4().hex[:12]}",
                user_id=user_id,
                display_name=clean_name,
                handle=handle,
                bio=f"Verified multi-modal generative AI creator authenticated via {provider.capitalize()}.",
                avatar_url=avatar_url or "/assets/avatars/elena.jpg",
                location="Remote / Global",
                years_experience=1,
                primary_specialization="Generative Video & Concept Art",
                min_budget=200.0,
                hourly_rate=50.0,
                availability_status="AVAILABLE",
                verification_tier="COMMUNITY",
                verified_claims_count=0,
                completed_projects_count=0,
                average_rating=5.0,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(creator)
        else:
            brand = BrandProfile(
                id=f"br-{uuid.uuid4().hex[:12]}",
                user_id=user_id,
                company_name=clean_name,
                slug=f"{clean_handle}-{uuid.uuid4().hex[:4]}",
                website="https://kivora.creative",
                industry="Creative & Media",
                bio=f"Verified creative organization authenticated via {provider.capitalize()}.",
                logo_url=avatar_url or "/assets/brands/default-brand.svg",
                verification_status="UNVERIFIED",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(brand)
        db.commit()
    else:
        # User exists: ensure email is verified
        if not user.is_email_verified:
            user.is_email_verified = True
            db.commit()

    return user


@router.get("/oauth/{provider}/callback")
def oauth_callback_get(
    provider: str,
    code: str = Query(..., description="Authorization code from OAuth provider"),
    state: Optional[str] = Query(None, description="Signed state parameter"),
    db: Session = Depends(get_db)
):
    """
    Standard browser redirect callback flow for OAuth 2.0 / OpenID Connect.
    Establishes Kivora session and redirects to frontend with authenticated JWT token.
    """
    user = _process_oauth_exchange(provider, code, state, db)
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role}
    )
    redirect_target = f"{FRONTEND_URL}/?oauth_token={access_token}&email={user.email}&role={user.role}"
    return RedirectResponse(url=redirect_target)


@router.post("/oauth/{provider}/callback", response_model=TokenResponse)
def oauth_callback_post(
    provider: str,
    payload: OAuthCallbackPayload,
    db: Session = Depends(get_db)
):
    """
    JSON API callback flow for popup or client-side OAuth flows.
    """
    user = _process_oauth_exchange(provider, payload.code, payload.state, db)
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role}
    )
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=build_user_summary(user)
    )
