"""
Comprehensive Email Provider & Delivery Mechanism Test Suite
Tests Resend HTTPS API dispatch, SMTP fallback, failure modes, and privacy-safe logging.
"""

import sys
import unittest
from pathlib import Path
from unittest.mock import patch, MagicMock

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.app.services.email_service import (
    send_otp_email,
    _build_email_content,
    _mask_email,
    _dispatch_via_resend,
)


class TestEmailProviders(unittest.TestCase):

    def test_email_masking(self):
        self.assertEqual(_mask_email("elena.rostova@kivora.demo"), "e***@kivora.demo")
        self.assertEqual(_mask_email("a@example.com"), "***@example.com")
        self.assertEqual(_mask_email(""), "***")
        self.assertEqual(_mask_email(None), "***")

    def test_email_content_builder(self):
        subject, plain, html = _build_email_content("123456", "REGISTRATION")
        self.assertIn("123456", subject)
        self.assertIn("123456", plain)
        self.assertIn("123456", html)
        self.assertIn("Account Verification", html)
        self.assertIn("15 minutes", plain)

    def test_fixture_interception(self):
        result = send_otp_email("test.fixture.alice.creator@kivora.test", "123456")
        self.assertTrue(result["sent"])
        self.assertEqual(result["provider"], "fixture_guard")
        self.assertEqual(result["delivery_status"], "SIMULATED")

    @patch("backend.app.services.email_service.RESEND_API_KEY", "re_test_mock_123")
    @patch("backend.app.services.email_service.is_resend_configured", return_value=True)
    @patch("backend.app.services.email_service.requests.post")
    def test_resend_https_success(self, mock_post, mock_is_resend):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"id": "msg_resend_test_123"}
        mock_post.return_value = mock_resp

        recipient = "real.creator@verified-domain.org"
        result = send_otp_email(recipient, "456789")
        self.assertTrue(result["sent"])
        self.assertEqual(result["provider"], "resend")
        self.assertEqual(result["delivery_status"], "DELIVERED")
        # Ensure recipient passed to payload matches real registration email
        call_args = mock_post.call_args[1]
        self.assertEqual(call_args["json"]["to"], [recipient])

    @patch("backend.app.services.email_service.RESEND_API_KEY", "re_test_mock_123")
    @patch("backend.app.services.email_service.is_resend_configured", return_value=True)
    @patch("backend.app.services.email_service.is_smtp_configured", return_value=False)
    @patch("backend.app.services.email_service.requests.post")
    def test_resend_https_error_in_production(self, mock_post, mock_smtp, mock_resend):
        with patch("backend.app.services.email_service.KIVORA_ENV", "production"):
            mock_resp = MagicMock()
            mock_resp.status_code = 403
            mock_resp.json.return_value = {"message": "Domain not verified"}
            mock_post.return_value = mock_resp

            result = send_otp_email("real.creator@verified-domain.org", "456789")
            self.assertFalse(result["sent"])
            self.assertEqual(result["delivery_status"], "FAILED")
            self.assertIn("Domain not verified", result["delivery_notice"])

    @patch("backend.app.services.email_service.is_resend_configured", return_value=False)
    @patch("backend.app.services.email_service.is_smtp_configured", return_value=True)
    @patch("backend.app.services.email_service._dispatch_via_smtp", return_value=True)
    def test_smtp_fallback_when_resend_not_configured(self, mock_smtp_disp, mock_is_smtp, mock_is_resend):
        recipient = "real.creator@verified-domain.org"
        result = send_otp_email(recipient, "112233")
        self.assertTrue(result["sent"])
        self.assertEqual(result["provider"], "smtp")
        self.assertEqual(result["delivery_status"], "DELIVERED")
        mock_smtp_disp.assert_called_once()
        self.assertEqual(mock_smtp_disp.call_args[0][0], recipient)

    @patch("backend.app.services.email_service.is_resend_configured", return_value=False)
    @patch("backend.app.services.email_service.is_smtp_configured", return_value=False)
    def test_development_simulated_fallback(self, mock_smtp, mock_resend):
        with patch("backend.app.services.email_service.KIVORA_ENV", "development"):
            result = send_otp_email("real.creator@verified-domain.org", "998877")
            self.assertTrue(result["sent"])
            self.assertEqual(result["provider"], "dev_logger")
            self.assertEqual(result["delivery_status"], "SIMULATED")
            self.assertEqual(result["dev_otp"], "998877")


if __name__ == "__main__":
    unittest.main()
