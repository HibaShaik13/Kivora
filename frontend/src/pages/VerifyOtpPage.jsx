import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  EnvelopeSimple,
  ShieldCheck,
  ArrowRight,
  ArrowsClockwise,
  WarningCircle,
  CheckCircle,
  ArrowLeft,
  Key,
} from '@phosphor-icons/react';
import { authApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';

export default function VerifyOtpPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { showToast } = useToast();

  const queryEmail = searchParams.get('email') || '';
  const isDevOrStaging = !import.meta.env.PROD;
  const initialDevOtp = isDevOrStaging ? (location.state?.devOtp || searchParams.get('dev_otp') || null) : null;
  const initialDeliveryStatus = location.state?.deliveryStatus || (initialDevOtp ? 'SIMULATED' : 'DELIVERED');
  const [deliveryStatus, setDeliveryStatus] = useState(initialDeliveryStatus);
  const [deliveryNotice, setDeliveryNotice] = useState(location.state?.deliveryNotice || null);

  const [email, setEmail] = useState(queryEmail);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState(null);
  const [devOtpHint, setDevOtpHint] = useState(initialDevOtp);

  const inputRefs = useRef([]);

  // Auto-focus first input on load
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Handle single digit input
  const handleDigitChange = (index, value) => {
    // Only accept numeric characters
    const cleanVal = value.replace(/[^0-9]/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = cleanVal;
    setOtpDigits(newDigits);

    // Auto-advance to next input
    if (cleanVal && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  // Handle backspace navigation
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  };

  // Handle full 6-digit paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pastedData) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < pastedData.length; i++) {
      newDigits[i] = pastedData[i];
    }
    setOtpDigits(newDigits);

    const nextIndex = Math.min(pastedData.length, 5);
    if (inputRefs.current[nextIndex]) {
      inputRefs.current[nextIndex].focus();
    }
  };

  const otpCode = otpDigits.join('');

  // Submit OTP Verification
  const handleVerify = async (e) => {
    e?.preventDefault();
    if (!email.trim()) {
      setError('Please provide your registered email address.');
      return;
    }

    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await authApi.verifyOtp({
        email: email.trim().toLowerCase(),
        otp_code: otpCode,
      });

      showToast('Email verified successfully!', 'success');

      // Update session with access token and user profile
      login(response.access_token, response.user);

      // Route based on profile setup status
      if (response.user?.has_profile === false) {
        navigate('/onboarding', { replace: true });
      } else {
        const dest = response.user?.role === 'CREATOR' ? '/creator/dashboard' : response.user?.role === 'BRAND' ? '/brand/dashboard' : '/';
        navigate(dest, { replace: true });
      }
    } catch (err) {
      console.error('OTP Verification error:', err);
      setError(err.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP code
  const handleResend = async () => {
    if (!email.trim()) {
      setError('Please enter your email to request a new code.');
      return;
    }

    setResending(true);
    setError(null);

    try {
      const response = await authApi.resendOtp({ email: email.trim().toLowerCase() });
      const toastMsg = response?.message || 'New verification code generated.';
      showToast(toastMsg, response?.delivery_status === 'FAILED' ? 'warning' : 'success');
      setOtpDigits(['', '', '', '', '', '']);
      if (inputRefs.current[0]) inputRefs.current[0].focus();

      if (response?.dev_otp && isDevOrStaging) {
        setDevOtpHint(response.dev_otp);
      }
      if (response?.delivery_status) {
        setDeliveryStatus(response.delivery_status);
      }
      if (response?.delivery_notice) {
        setDeliveryNotice(response.delivery_notice);
      }
    } catch (err) {
      console.error('Resend OTP error:', err);
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{ padding: '60px 0 100px' }}>
      <div className="container-narrow" style={{ maxWidth: '480px' }}>
        <div
          className="card-editorial"
          style={{
            padding: '40px 36px',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-lg)',
            textAlign: 'center',
          }}
        >
          {/* Top Icon */}
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--accent-lavender-subtle)',
              color: 'var(--accent-lavender)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <EnvelopeSimple size={28} weight="duotone" />
          </div>

          <span className="badge badge-verified" style={{ marginBottom: '10px' }}>
            Account Security
          </span>

          <h1 style={{ fontSize: '1.75rem', letterSpacing: '-0.03em', marginBottom: '8px' }}>
            Verify your email
          </h1>

          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5' }}>
            {deliveryStatus === 'DELIVERED' ? (
              <>
                We’ve sent a 6-digit verification code to{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{email || 'your email'}</strong>. Please check your inbox.
              </>
            ) : deliveryStatus === 'FAILED' ? (
              <>
                Verification email could not be delivered to{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{email || 'your email'}</strong>. You can enter a valid code below or request a resend.
              </>
            ) : (
              <>
                A 6-digit verification code was generated for{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{email || 'your email'}</strong>. Enter the code below to activate your account.
              </>
            )}
          </p>

          {/* Development Mode Notice Banner */}
          {deliveryStatus === 'SIMULATED' && deliveryNotice && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(245, 158, 11, 0.1)',
                color: '#D97706',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                fontSize: '0.8125rem',
                marginBottom: '20px',
                textAlign: 'left',
                lineHeight: '1.4',
              }}
            >
              <WarningCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Notice:</strong> {deliveryNotice}
              </div>
            </div>
          )}

          {/* Development Mode OTP Helper Hint */}
          {isDevOrStaging && devOtpHint && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--status-info-bg)',
                color: 'var(--accent-lavender)',
                border: '1px solid var(--status-info-border)',
                fontSize: '0.8125rem',
                fontFamily: 'var(--font-family-mono)',
                marginBottom: '24px',
                cursor: 'pointer',
              }}
              onClick={() => {
                const digits = devOtpHint.split('').slice(0, 6);
                setOtpDigits(digits);
              }}
              title="Click to auto-fill development OTP"
            >
              <Key size={14} />
              <span>Dev OTP: <strong>{devOtpHint}</strong> (Click to prefill)</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--status-error-bg)',
                color: 'var(--status-error)',
                border: '1px solid var(--status-error-border)',
                fontSize: '0.875rem',
                marginBottom: '24px',
                textAlign: 'left',
              }}
            >
              <WarningCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Email input if missing */}
          {!queryEmail && (
            <div className="form-group" style={{ marginBottom: '20px', textAlign: 'left' }}>
              <label className="form-label" htmlFor="otp-email">
                Account Email
              </label>
              <input
                id="otp-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="form-input"
              />
            </div>
          )}

          {/* 6-Digit OTP Boxes */}
          <form onSubmit={handleVerify}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '10px',
                marginBottom: '28px',
              }}
              onPaste={handlePaste}
            >
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  style={{
                    width: '48px',
                    height: '56px',
                    fontSize: '1.5rem',
                    fontWeight: '800',
                    fontFamily: 'var(--font-family-mono)',
                    textAlign: 'center',
                    background: 'var(--bg-surface)',
                    border: digit ? '2px solid var(--accent-lavender)' : '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    boxShadow: digit ? 'var(--shadow-glow-lavender)' : 'none',
                    transition: 'all var(--transition-fast)',
                  }}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '1rem', marginBottom: '20px' }}
            >
              {loading ? (
                <>
                  <ArrowsClockwise size={18} className="animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <span>Verify and Activate Account</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Resend & Return Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.875rem' }}>
            <div style={{ color: 'var(--text-secondary)' }}>
              Didn't receive the code?{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                style={{
                  color: 'var(--accent-lavender)',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                  padding: '0',
                }}
              >
                {resending ? 'Sending...' : 'Resend Code'}
              </button>
            </div>

            <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
              <Link
                to="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--text-tertiary)',
                  textDecoration: 'none',
                  fontSize: '0.8125rem',
                  fontWeight: '600',
                }}
              >
                <ArrowLeft size={14} />
                <span>Return to Sign In</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
