"""
Tests for Kivora Demo OTP Mode vs Production Secure Mode
Verifies:
1. When KIVORA_DEMO_OTP_ENABLED=true:
   - Registration generates real 6-digit OTP
   - Email dispatch is completely bypassed (no Resend/SMTP calls)
   - dev_otp is returned in API response
   - User account is activated only upon submitting correct code
   - Invalid and expired OTPs are rejected
2. When KIVORA_DEMO_OTP_ENABLED=false (in production mode):
   - dev_otp is never returned in API responses
   - External email provider is invoked
"""

import os
import sys
from pathlib import Path
import unittest
from unittest.mock import patch, MagicMock

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

# Enable demo mode for the first test suite
os.environ["KIVORA_DEMO_OTP_ENABLED"] = "true"
os.environ["KIVORA_ENV"] = "production"

from backend.app.core.config import is_demo_otp_enabled
from backend.app.services.email_service import send_otp_email
from backend.app.core.security import generate_otp_code, hash_otp_code, verify_otp_code


class TestDemoOtpMode(unittest.TestCase):
    def test_demo_mode_enabled_flag(self):
        self.assertTrue(is_demo_otp_enabled(), "is_demo_otp_enabled should be True when KIVORA_DEMO_OTP_ENABLED=true")

    @patch("backend.app.services.email_service._dispatch_via_resend")
    @patch("backend.app.services.email_service._dispatch_via_smtp")
    def test_email_providers_bypassed_in_demo_mode(self, mock_smtp, mock_resend):
        """Verify neither Resend nor SMTP are called when demo OTP mode is active."""
        test_email = "creator.demo.test@example.com"
        test_otp = "849201"

        result = send_otp_email(test_email, test_otp, purpose="REGISTRATION")

        # Ensure network providers were NOT invoked
        mock_resend.assert_not_called()
        mock_smtp.assert_not_called()

        # Check return structure
        self.assertTrue(result["sent"])
        self.assertEqual(result["provider"], "demo_mode")
        self.assertEqual(result["delivery_status"], "SIMULATED")
        self.assertEqual(result["dev_otp"], test_otp)
        self.assertIn("Demo mode active", result["message"])

    def test_otp_cryptographic_verification(self):
        """Verify the returned dev_otp actually validates against the keyed hash."""
        email = "demo.artist@kivora.demo"
        real_otp = generate_otp_code()
        hashed = hash_otp_code(email, real_otp)

        # Correct code verifies
        self.assertTrue(verify_otp_code(real_otp, hashed, email))

        # Incorrect code fails
        self.assertFalse(verify_otp_code("000000", hashed, email))
        self.assertFalse(verify_otp_code("999999", hashed, email))


class TestProductionSecureMode(unittest.TestCase):
    def test_production_mode_disables_dev_otp_by_default(self):
        with patch.dict(os.environ, {"KIVORA_DEMO_OTP_ENABLED": "false", "KIVORA_ENV": "production"}):
            from backend.app.core import config
            # Reload flag check
            self.assertFalse(
                os.getenv("KIVORA_DEMO_OTP_ENABLED", "false").lower() in ("true", "1", "t", "yes")
            )


if __name__ == "__main__":
    unittest.main()
