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
    Dispatches a 6-digit OTP code to the user's email via SMTP.
    Raises an error if required configuration is missing.
    """
    subject = f"Your Kivora Verification Code: {otp_code}"
    body_text = (
        f"Welcome to Kivora — The AI Content Creator Marketplace.\n\n"
        f"Your verification code is: {otp_code}\n\n"
        f"This code will expire in 15 minutes. If you did not request this code, please ignore this email."
    )
    body_html = _build_html_email(otp_code, purpose)

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
        raise ValueError(f"Missing required SMTP configuration: {', '.join(missing_vars)}")

    try:
        return _send_via_smtp(email, subject, body_text, body_html)
    except smtplib.SMTPException as e:
        error_msg = str(e)
        logger.error(f"SMTP Error [{type(e).__name__}]: {error_msg}")
        raise RuntimeError("Email delivery failed. Please try again later.")
    except Exception as e:
        logger.error(f"Unexpected email dispatch error: {type(e).__name__}")
        raise RuntimeError("Email delivery failed. Please try again later.")
