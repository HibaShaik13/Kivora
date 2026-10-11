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
    RESEND_FROM_EMAIL,
    is_resend_configured,
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


TEST_FIXTURE_DOMAINS = (
    ".test",
    ".invalid",
    ".localhost",
    ".demo",
    "example.com",
    "kivora.test",
    "kivora.demo",
    "kivora.internal",
)


def _is_test_fixture_email(email: str) -> bool:
    """Detects fixture/test recipient addresses by domain to prevent accidental live SMTP/API delivery."""
    if not email or "@" not in email:
        return True
    domain = email.lower().strip().split("@", 1)[1]
    return any(domain == d or domain.endswith(d) for d in TEST_FIXTURE_DOMAINS)


def _dispatch_via_resend(email: str, subject: str, plain_text: str, html_content: str) -> tuple[bool, Optional[str]]:
    """Dispatches email via official Resend HTTPS REST API (Port 443)."""
    api_key = (RESEND_API_KEY or "").strip()
    if not api_key or not is_resend_configured():
        return False, "RESEND_API_KEY not configured"

    payload = {
        "from": RESEND_FROM_EMAIL,
        "to": [email],
        "subject": subject,
        "text": plain_text,
        "html": html_content,
    }

    try:
        res = requests.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=8,
        )
        if res.status_code in [200, 201]:
            res_json = res.json()
            msg_id = res_json.get("id", "accepted")
            logger.info(f"[RESEND DISPATCH SUCCESS] Delivered to {_mask_email(email)} (ID: {msg_id})")
            return True, None
        else:
            try:
                err_body = res.json()
                err_msg = err_body.get("message") or err_body.get("name") or res.text
            except Exception:
                err_msg = res.text
            logger.warning(f"[RESEND DISPATCH ERROR] HTTP {res.status_code}: {err_msg}")
            return False, f"Resend API ({res.status_code}): {err_msg}"
    except Exception as e:
        logger.warning(f"[RESEND CONNECTION ERROR] {type(e).__name__}: {str(e)}")
        return False, f"Resend connection: {type(e).__name__}"


def _dispatch_via_smtp(email: str, subject: str, plain_text: str, html_content: str) -> bool:
    """Attempts SMTP transmission with fallback between STARTTLS (587) and SSL (465)."""
    import ssl

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
    msg["To"] = email

    part_text = MIMEText(plain_text, "plain", "utf-8")
    part_html = MIMEText(html_content, "html", "utf-8")
    msg.attach(part_text)
    msg.attach(part_html)

    # Sanitize username and password (strip spaces, e.g. from 16-char app passwords)
    clean_username = (SMTP_USERNAME or "").strip()
    clean_password = (SMTP_PASSWORD or "").replace(" ", "").strip()

    # 1. If explicitly configured on port 465, use direct SSL
    if SMTP_PORT == 465:
        context = ssl.create_default_context()
        server = smtplib.SMTP_SSL(SMTP_HOST, 465, context=context, timeout=5)
        server.ehlo()
        server.login(clean_username, clean_password)
        server.send_message(msg, from_addr=SMTP_FROM_EMAIL, to_addrs=[email])
        server.quit()
        return True

    # 2. Try configured port (e.g. 587 with STARTTLS)
    try:
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=5)
        server.ehlo()
        if SMTP_USE_TLS:
            context = ssl.create_default_context()
            server.starttls(context=context)
            server.ehlo()
        server.login(clean_username, clean_password)
        server.send_message(msg, from_addr=SMTP_FROM_EMAIL, to_addrs=[email])
        server.quit()
        return True
    except (TimeoutError, smtplib.SMTPConnectError, OSError) as e:
        logger.info(f"Port {SMTP_PORT} connection timed out/failed; attempting SSL fallback on port 465...")

    # 3. Fallback to Port 465 (SSL) if port 587 is blocked
    context = ssl.create_default_context()
    server = smtplib.SMTP_SSL(SMTP_HOST, 465, context=context, timeout=5)
    server.ehlo()
    server.login(clean_username, clean_password)
    server.send_message(msg, from_addr=SMTP_FROM_EMAIL, to_addrs=[email])
    server.quit()
    return True


def _mask_email(email: str) -> str:
    """Safely masks an email address for non-sensitive logging (e.g. j***@example.com)."""
    if not email or "@" not in email:
        return "***"
    parts = email.split("@", 1)
    username = parts[0]
    domain = parts[1]
    masked_user = username[0] + "***" if len(username) > 1 else "***"
    return f"{masked_user}@{domain}"


def send_otp_email(email: str, otp_code: str, purpose: str = "REGISTRATION") -> Dict[str, Any]:
    """
    Dispatches a 6-digit OTP code to the recipient's email address.
    Priority order:
    1. Test fixture interceptor (prevents accidental live dispatch to fixture addresses)
    2. Resend HTTPS REST API (Port 443 - ideal for cloud container environments like Render)
    3. Real SMTP with STARTTLS (Port 587) / SSL (Port 465) fallback
    4. Safe development terminal logger (disabled in production)
    """
    email_clean = email.lower().strip()
    subject, plain_text, html_content = _build_email_content(otp_code, purpose)
    masked = _mask_email(email_clean)
    delivery_errors = []

    # 1. Guard against test/fixture addresses leaking into live provider dispatch
    if _is_test_fixture_email(email_clean):
        logger.info(f"[TEST FIXTURE INTERCEPT] Safely intercepted test fixture recipient {masked}; skipping live network dispatch.")
        is_dev = KIVORA_ENV not in ["production", "prod"]
        return {
            "sent": True,
            "provider": "fixture_guard",
            "delivery_status": "SIMULATED",
            "dev_otp": otp_code if is_dev else None,
            "message": f"Test fixture recipient recognized: verification code generated safely.",
        }

    # 2. Primary for Cloud / Containers: Resend HTTPS API (Port 443)
    if is_resend_configured():
        ok, resend_err = _dispatch_via_resend(email_clean, subject, plain_text, html_content)
        if ok:
            return {
                "sent": True,
                "provider": "resend",
                "delivery_status": "DELIVERED",
                "message": f"Verification code sent to {email_clean}.",
            }
        else:
            delivery_errors.append(resend_err or "Resend dispatch failed")

    # 3. SMTP Delivery (e.g. Gmail SMTP)
    if is_smtp_configured():
        try:
            _dispatch_via_smtp(email_clean, subject, plain_text, html_content)
            logger.info(f"[EMAIL DISPATCH] Delivered via SMTP ({SMTP_HOST}) to {masked}")
            return {
                "sent": True,
                "provider": "smtp",
                "delivery_status": "DELIVERED",
                "message": f"Verification code sent to {email_clean}.",
            }
        except smtplib.SMTPAuthenticationError:
            err_msg = f"SMTP authentication failed for sender {SMTP_USERNAME}. Please check Google App Password."
            logger.error(f"[EMAIL DISPATCH ERROR] {err_msg}")
            delivery_errors.append("Gmail authentication failed (check App Password)")
        except smtplib.SMTPDataError as e:
            error_text = e.smtp_error.decode("utf-8", errors="ignore") if isinstance(e.smtp_error, bytes) else str(e.smtp_error)
            if "Daily user sending limit exceeded" in error_text or e.smtp_code == 550:
                err_msg = "Gmail SMTP: Daily user sending limit exceeded (550)."
            else:
                err_msg = f"Gmail SMTP data error ({e.smtp_code}): {error_text.strip()}"
            logger.error(f"[EMAIL DISPATCH ERROR] {err_msg}")
            delivery_errors.append(err_msg)
        except smtplib.SMTPRecipientsRefused:
            err_msg = f"Recipient email address was refused by SMTP server: {masked}"
            logger.error(f"[EMAIL DISPATCH ERROR] {err_msg}")
            delivery_errors.append("Recipient email address refused by mail server")
        except (TimeoutError, smtplib.SMTPConnectError, OSError) as e:
            err_msg = f"Outbound SMTP connection timed out or blocked on port {SMTP_PORT}/465. Note: Render free web services block outbound SMTP ports 25, 465, and 587."
            logger.error(f"[EMAIL DISPATCH ERROR] {err_msg}")
            delivery_errors.append("Outbound SMTP port blocked or timed out by container environment")
        except smtplib.SMTPException as e:
            err_msg = f"SMTP error during dispatch to {masked}: {type(e).__name__}"
            logger.error(f"[EMAIL DISPATCH ERROR] {err_msg}")
            delivery_errors.append(f"SMTP error: {type(e).__name__}")
        except Exception as e:
            err_msg = f"Unexpected error during SMTP connection: {type(e).__name__}"
            logger.error(f"[EMAIL DISPATCH ERROR] {err_msg}")
            delivery_errors.append(f"SMTP connection error: {type(e).__name__}")
    elif not is_resend_configured():
        delivery_errors.append("Neither Resend HTTPS API nor SMTP credentials configured")

    # 4. Development / Test Fallback
    if KIVORA_ENV not in ["production", "prod"]:
        logger.info(f"===> [DEV OTP DISPATCH] To: {masked} | Code: {otp_code} | Purpose: {purpose}")
        return {
            "sent": True,
            "provider": "dev_logger",
            "delivery_status": "SIMULATED",
            "dev_otp": otp_code,
            "message": "Development mode: OTP generated and logged to console.",
            "delivery_notice": "; ".join(delivery_errors),
        }

    return {
        "sent": False,
        "provider": "none",
        "delivery_status": "FAILED",
        "error": "Failed to deliver verification email. Please check email provider configuration or contact support.",
        "delivery_notice": "; ".join(delivery_errors),
    }

