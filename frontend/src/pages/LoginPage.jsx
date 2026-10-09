import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Sparkle,
  Eye,
  EyeSlash,
  ArrowRight,
  ShieldCheck,
  WarningCircle,
  ArrowsClockwise,
  User,
  Building,
  Key,
} from '@phosphor-icons/react';
import { authApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const redirectUrl = searchParams.get('redirect') || null;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await authApi.login({
        email: email.trim().toLowerCase(),
        password,
      });

      showToast('Welcome back to Kivora!', 'success');
      login(response.access_token, response.user);

      // Route destination
      if (response.user?.has_profile === false) {
        navigate('/onboarding', { replace: true });
      } else if (redirectUrl) {
        navigate(decodeURIComponent(redirectUrl), { replace: true });
      } else {
        const dest =
          response.user?.role === 'CREATOR'
            ? '/creator/dashboard'
            : response.user?.role === 'BRAND'
            ? '/brand/dashboard'
            : response.user?.role === 'ADMIN'
            ? '/admin/verification'
            : '/';
        navigate(dest, { replace: true });
      }
    } catch (err) {
      console.error('Login error:', err);
      // If email is not verified, suggest going to OTP verification
      if (err.status === 403 && err.message?.toLowerCase().includes('otp')) {
        setError('Email address is not yet verified. Please complete OTP verification.');
        setTimeout(() => {
          navigate(`/verify-otp?email=${encodeURIComponent(email.trim().toLowerCase())}`);
        }, 1500);
      } else {
        setError(err.message || 'Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Demo Login Helper
  const handleQuickDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError(null);
  };

  const isDevOrStaging = !import.meta.env.PROD;

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
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <span className="badge badge-verified">
                <Sparkle weight="fill" size={13} />
                Studio Access
              </span>
            </div>
            <h1 style={{ fontSize: '1.875rem', letterSpacing: '-0.03em', marginBottom: '8px' }}>
              Sign in to Kivora
            </h1>
            <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
              Access your creator studio, campaign briefs, or verification workspace.
            </p>
          </div>

          {/* Quick Demo Credentials Bar (Development & Hackathon evaluation) */}
          {isDevOrStaging && (
            <div
              style={{
                padding: '14px',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '24px',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-tertiary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Key size={14} /> Quick Demo Accounts (Click to Fill):
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('elena.rostova@kivora.demo', 'Password123!')}
                  className="btn btn-outline"
                  style={{ padding: '4px 10px', fontSize: '0.6875rem', background: 'var(--bg-surface)' }}
                >
                  Creator: Elena
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('atelier@maisonaurora.demo', 'Password123!')}
                  className="btn btn-outline"
                  style={{ padding: '4px 10px', fontSize: '0.6875rem', background: 'var(--bg-surface)' }}
                >
                  Brand: Sarah
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('admin@kivora.internal', 'Password123!')}
                  className="btn btn-outline"
                  style={{ padding: '4px 10px', fontSize: '0.6875rem', background: 'var(--bg-surface)' }}
                >
                  Admin: Reviewer
                </button>
              </div>
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
                marginBottom: '20px',
              }}
            >
              <WarningCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="form-input"
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="login-password">
                  Password
                </label>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-input"
                  style={{ paddingRight: '42px' }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
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

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: '8px' }}
            >
              {loading ? (
                <>
                  <ArrowsClockwise size={18} className="animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Kivora</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Don't have an account yet? </span>
            <Link to="/register" style={{ fontWeight: '700', color: 'var(--accent-lavender)', textDecoration: 'none' }}>
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
