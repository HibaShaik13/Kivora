"""
Kivora Email & OTP Dispatch Service
Supports Gmail SMTP with STARTTLS (port 587) and SSL (port 465) resilience,
Resend REST API fallback, and safe non-production handling.
Never logs SMTP passwords, raw tokens, or sensitive credentials.
"""

import os
import smtplib
import logging
import requests
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, Optional

from backend.app.core.config import (
    KIVORA_ENV,
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USERNAME,
    SMTP_PASSWORD,
    SMTP_FROM_EMAIL,
    SMTP_FROM_NAME,
    SMTP_USE_TLS,
    RESEND_API_KEY,
    is_smtp_configured,
)

logger = logging.getLogger("email_service")


def _build_email_content(otp_code: str, purpose: str = "REGISTRATION") -> tuple[str, str, str]:
    """Generates subject, plain-text body, and styled HTML body for OTP verification."""
    purpose_title = "Account Verification" if purpose == "REGISTRATION" else "Security Verification"
    subject = f"{otp_code} is your Kivora verification code"

    plain_text = (
        f"KIVORA — The Generative Creator Platform\n\n"
        f"Your 6-digit verification code is: {otp_code}\n\n"
        f"This code will expire in 15 minutes.\n"
        f"If you did not request this verification code, you can safely ignore this email.\n\n"
        f"© Kivora Platform. All rights reserved."
    )

    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kivora Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF8F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1A1715;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FAF8F5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #EAE6DF; overflow: hidden; box-shadow: 0 4px 12px rgba(26, 23, 21, 0.05);" cellspacing="0" cellpadding="0">
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 36px 20px; background-color: #1A1715; text-align: left;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background-color: #FF6B57; width: 32px; height: 32px; border-radius: 8px; text-align: center; vertical-align: middle; color: #FFFFFF; font-weight: 800; font-size: 16px;">
                    ✦
                  </td>
                  <td style="padding-left: 12px; color: #FFFFFF; font-size: 20px; font-weight: 800; letter-spacing: -0.02em;">
                    KIVORA
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 36px 36px 28px;">
              <h1 style="margin: 0 0 12px; font-size: 22px; font-weight: 800; color: #1A1715; letter-spacing: -0.02em;">
                {purpose_title}
              </h1>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.5; color: #5C554E;">
                Enter the following 6-digit code in the Kivora verification portal to confirm your email address:
              </p>

              <!-- OTP Box -->
              <div style="background-color: #FAF8F5; border: 1.5px solid #7C6EE6; border-radius: 12px; padding: 20px; text-align: center; margin: 0 0 24px;">
                <span style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #1A1715; display: inline-block;">
                  {otp_code}
                </span>
              </div>

              <p style="margin: 0 0 8px; font-size: 13px; color: #8C837A; line-height: 1.4;">
                ⏱ <strong>Security Notice:</strong> This code is valid for <strong>15 minutes</strong> and can only be used once.
              </p>
              <p style="margin: 0; font-size: 13px; color: #8C837A; line-height: 1.4;">
                If you did not initiate this request, please ignore this email or contact support.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 36px; background-color: #FAF8F5; border-top: 1px solid #EAE6DF; text-align: center; font-size: 12px; color: #8C837A;">
              Kivora • The Generative AI Content Creator Platform
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""
    return subject, plain_text, html_content


def _dispatch_via_smtp(email: str, subject: str, plain_text: str, html_content: str) -> bool:
    """Attempts SMTP transmission with fallback between STARTTLS (587) and SSL (465)."""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
    msg["To"] = email

    part_text = MIMEText(plain_text, "plain", "utf-8")
    part_html = MIMEText(html_content, "html", "utf-8")
    msg.attach(part_text)
    msg.attach(part_html)

    # 1. If configured on port 465, use direct SSL
    if SMTP_PORT == 465:
        server = smtplib.SMTP_SSL(SMTP_HOST, 465, timeout=12)
        server.ehlo()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True

    # 2. Try configured port (e.g. 587 with STARTTLS)
    try:
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=6)
        server.ehlo()
        if SMTP_USE_TLS:
            server.starttls()
            server.ehlo()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True
    except (TimeoutError, smtplib.SMTPConnectError, OSError) as e:
        logger.info(f"Port {SMTP_PORT} connection timed out; attempting SSL fallback on port 465...")

    # 3. Fallback to Port 465 (SSL) if port 587 is blocked by local network/ISP
    server = smtplib.SMTP_SSL(SMTP_HOST, 465, timeout=12)
    server.ehlo()
    server.login(SMTP_USERNAME, SMTP_PASSWORD)
    server.send_message(msg)
    server.quit()
    return True


def send_otp_email(email: str, otp_code: str, purpose: str = "REGISTRATION") -> Dict[str, Any]:
    """
    Dispatches a 6-digit OTP code to the recipient's email address.
    Priority order:
    1. Real Gmail SMTP if configured in backend/.env
    2. Resend REST API if RESEND_API_KEY is configured
    3. Safe development terminal logger (disabled in production)
    """
    subject, plain_text, html_content = _build_email_content(otp_code, purpose)

    # 1. Primary: SMTP Delivery (e.g. Gmail SMTP)
    if is_smtp_configured():
        try:
            _dispatch_via_smtp(email, subject, plain_text, html_content)
            logger.info(f"OTP email successfully dispatched via SMTP ({SMTP_HOST}) to {email}")
            return {
                "sent": True,
                "provider": "smtp",
                "status": "delivered",
            }
        except smtplib.SMTPAuthenticationError:
            logger.error(f"SMTP authentication failed for user {SMTP_USERNAME}. Please verify Google App Password.")
        except smtplib.SMTPException as e:
            logger.error(f"SMTP error during dispatch to {email}: {type(e).__name__}")
        except Exception as e:
            logger.error(f"Unexpected error during SMTP connection: {type(e).__name__}")

    # 2. Secondary: Resend REST API Fallback
    if RESEND_API_KEY:
        try:
            res = requests.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": SMTP_FROM_EMAIL,
                    "to": [email],
                    "subject": subject,
                    "text": plain_text,
                    "html": html_content,
                },
                timeout=10,
            )
            if res.status_code in [200, 201]:
                logger.info(f"Resend email dispatched successfully to {email}")
                return {"sent": True, "provider": "resend", "status": "delivered"}
            else:
                logger.warning(f"Resend API error status={res.status_code}")
        except Exception as e:
            logger.warning(f"Failed to connect to Resend API: {type(e).__name__}")

    # 3. Development / Test Fallback
    if KIVORA_ENV not in ["production", "prod"]:
        logger.info(f"===> [DEV OTP DISPATCH] To: {email} | Code: {otp_code} | Purpose: {purpose}")
        return {
            "sent": True,
            "provider": "dev_logger",
            "dev_otp": otp_code,
        }

    return {
        "sent": False,
        "provider": "none",
        "error": "Failed to deliver verification email. Please check SMTP configuration.",
    }
