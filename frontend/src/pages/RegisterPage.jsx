import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Sparkle,
  Eye,
  EyeSlash,
  ArrowRight,
  ShieldCheck,
  Building,
  User,
  WarningCircle,
  ArrowsClockwise,
} from '@phosphor-icons/react';
import { authApi } from '../api/auth';
import { useToast } from '../hooks/useToast';

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const initialRole = searchParams.get('role')?.toUpperCase() === 'BRAND' ? 'BRAND' : 'CREATOR';

  const [role, setRole] = useState(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorInfo, setErrorInfo] = useState(null);

  const handleFieldChange = (setter) => (e) => {
    setter(e.target.value);
    if (error || errorInfo) {
      setError(null);
      setErrorInfo(null);
    }
  };

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    if (error || errorInfo) {
      setError(null);
      setErrorInfo(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setErrorInfo(null);

    // Client validation
    if (!email.trim() || !password) {
      setError('Please provide a valid email and password.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.register({
        email: email.trim().toLowerCase(),
        password,
        role,
      });

      showToast('Registration successful! Please verify your email via OTP.', 'success');

      // Navigate to OTP verification with email and optional dev_otp in state
      navigate(`/verify-otp?email=${encodeURIComponent(email.trim().toLowerCase())}&role=${role}`, {
        state: { devOtp: response?.dev_otp },
      });
    } catch (err) {
      console.error('Registration failed:', err);
      const msg = err.message || 'Registration failed. Please check your details.';
      setError(msg);
      
      const lower = msg.toLowerCase();
      if (lower.includes('not verified') || lower.includes('unverified')) {
        setErrorInfo({ type: 'UNVERIFIED_EXISTS', email: email.trim().toLowerCase() });
      } else if (lower.includes('already exists')) {
        setErrorInfo({ type: 'VERIFIED_EXISTS', email: email.trim().toLowerCase() });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '60px 0 100px' }}>
      <div className="container-narrow" style={{ maxWidth: '520px' }}>
        <div
          className="card-editorial"
          style={{
            padding: '40px 36px',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <span className="badge badge-verified">
                <Sparkle weight="fill" size={13} />
                Join Kivora
              </span>
            </div>
            <h1 style={{ fontSize: '1.875rem', letterSpacing: '-0.03em', marginBottom: '8px' }}>
              Create your account
            </h1>
            <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
              Step into evidence-verified generative production.
            </p>
          </div>

          {/* Role Selector Tabs */}
          <div style={{ marginBottom: '28px' }}>
            <label className="form-label" style={{ marginBottom: '10px', display: 'block' }}>
              Select Account Type:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {/* Creator Role */}
              <button
                type="button"
                onClick={() => handleRoleChange('CREATOR')}
                disabled={loading}
                style={{
                  padding: '16px 14px',
                  borderRadius: 'var(--radius-lg)',
                  border: role === 'CREATOR' ? '2px solid var(--accent-lavender)' : '1px solid var(--border-medium)',
                  background: role === 'CREATOR' ? 'var(--accent-lavender-subtle)' : 'var(--bg-surface-subtle)',
                  textAlign: 'left',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <User size={18} style={{ color: role === 'CREATOR' ? 'var(--accent-lavender)' : 'var(--text-secondary)' }} />
                  <span style={{ fontWeight: '700', fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                    I'm a Creator
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.3' }}>
                  AI Directors, 3D Artists, Motion Studios
                </div>
              </button>

              {/* Brand Role */}
              <button
                type="button"
                onClick={() => handleRoleChange('BRAND')}
                disabled={loading}
                style={{
                  padding: '16px 14px',
                  borderRadius: 'var(--radius-lg)',
                  border: role === 'BRAND' ? '2px solid var(--accent-coral)' : '1px solid var(--border-medium)',
                  background: role === 'BRAND' ? 'var(--accent-coral-subtle)' : 'var(--bg-surface-subtle)',
                  textAlign: 'left',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Building size={18} style={{ color: role === 'BRAND' ? 'var(--accent-coral)' : 'var(--text-secondary)' }} />
                  <span style={{ fontWeight: '700', fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                    Hire a Creator
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.3' }}>
                  Brands, Agencies, Enterprise Teams
                </div>
              </button>
            </div>
          </div>

          {/* Error Message & Recovery Banners */}
          {error && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--status-error-bg)',
                color: 'var(--status-error)',
                border: '1px solid var(--status-error-border)',
                fontSize: '0.875rem',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <WarningCircle size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
              
              {/* Account Recovery Options */}
              {errorInfo?.type === 'VERIFIED_EXISTS' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '6px', borderTop: '1px dashed var(--status-error-border)' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Ready to access your workspace?</span>
                  <Link
                    to={`/login?email=${encodeURIComponent(errorInfo.email)}`}
                    style={{ color: 'var(--status-error)', fontWeight: '700', textDecoration: 'underline', fontSize: '0.8125rem' }}
                  >
                    Sign In to your account &rarr;
                  </Link>
                </div>
              )}

              {errorInfo?.type === 'UNVERIFIED_EXISTS' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', paddingTop: '6px', borderTop: '1px dashed var(--status-error-border)', fontSize: '0.8125rem' }}>
                  <Link
                    to={`/verify-otp?email=${encodeURIComponent(errorInfo.email)}&role=${role}`}
                    style={{ color: 'var(--status-error)', fontWeight: '700', textDecoration: 'underline' }}
                  >
                    Verify Email / Enter OTP &rarr;
                  </Link>
                  <Link
                    to={`/login?email=${encodeURIComponent(errorInfo.email)}`}
                    style={{ color: 'var(--text-secondary)', textDecoration: 'underline' }}
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="register-email">
                Work or Studio Email
              </label>
              <input
                id="register-email"
                type="email"
                required
                disabled={loading}
                value={email}
                onChange={handleFieldChange(setEmail)}
                placeholder="name@company.com"
                className="form-input"
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="register-password">
                Password (min. 8 characters)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={loading}
                  value={password}
                  onChange={handleFieldChange(setPassword)}
                  placeholder="••••••••"
                  className="form-input"
                  style={{ paddingRight: '42px' }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-tertiary)',
                    cursor: 'pointer',
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="register-confirm-password">
                Confirm Password
              </label>
              <input
                id="register-confirm-password"
                type={showPassword ? 'text' : 'password'}
                required
                disabled={loading}
                value={confirmPassword}
                onChange={handleFieldChange(setConfirmPassword)}
                placeholder="••••••••"
                className="form-input"
                autoComplete="new-password"
              />
            </div>


            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: '8px' }}
            >
              {loading ? (
                <>
                  <ArrowsClockwise size={18} className="animate-spin" />
                  <span>Registering Account...</span>
                </>
              ) : (
                <>
                  <span>Continue to Email Verification</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div style={{ textAlign: 'center', marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Already have an account? </span>
            <Link to="/login" style={{ fontWeight: '700', color: 'var(--accent-lavender)', textDecoration: 'none' }}>
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
