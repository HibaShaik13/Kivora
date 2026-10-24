import React, { useState } from 'react';
import { authService } from '../services/authService';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'otp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('CREATOR'); // 'CREATOR' | 'BRAND'
  const [name, setName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState(null); // 'google' | 'github' | null
  const [oauthConfigInfo, setOauthConfigInfo] = useState(null);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null);

  if (!isOpen) return null;

  const handleSocialAuth = async (provider) => {
    setIsSocialLoading(provider);
    setError(null);
    setOauthConfigInfo(null);
    try {
      const res = await authService.getOAuthAuthorizeUrl(provider, role);
      if (res?.authorization_url) {
        window.location.href = res.authorization_url;
      }
    } catch (err) {
      const msg = err.message || '';
      if (
        msg.includes('not configured') ||
        msg.includes('PROVIDER_NOT_CONFIGURED') ||
        msg.includes('CLIENT_ID') ||
        msg.includes('500') ||
        msg.includes('400')
      ) {
        setOauthConfigInfo({
          provider: provider === 'google' ? 'Google' : 'GitHub',
          message: `${provider === 'google' ? 'Google' : 'GitHub'} OAuth 2.0 is not configured in this environment. To enable live ${provider === 'google' ? 'Google' : 'GitHub'} Sign-In, add ${provider.toUpperCase()}_CLIENT_ID and ${provider.toUpperCase()}_CLIENT_SECRET in backend/.env.`,
          envVars: [`${provider.toUpperCase()}_CLIENT_ID`, `${provider.toUpperCase()}_CLIENT_SECRET`],
          docsUrl: provider === 'google' ? 'https://console.cloud.google.com/apis/credentials' : 'https://github.com/settings/developers',
        });
      } else {
        setError(msg || `Failed to initiate ${provider} authentication.`);
      }
    } finally {
      setIsSocialLoading(null);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setOauthConfigInfo(null);
    try {
      authService.logout();
      const data = await authService.login(email, password);
      if (onAuthSuccess) onAuthSuccess(data);
      onClose();
    } catch (err) {
      const msg = (err.message || '').toLowerCase();
      if (msg.includes('not verified') || msg.includes('not been verified') || msg.includes('verification code')) {
        setMode('otp');
        setError(err.message);
      } else {
        setError(err.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setOauthConfigInfo(null);
    try {
      authService.logout();
      const res = await authService.register({
        email,
        password,
        role,
        full_name: name || undefined,
      });
      if (res?.access_token) {
        if (onAuthSuccess) onAuthSuccess(res);
        onClose();
        return;
      }
      setMode('otp');
      if (res?.dev_otp) {
        setOtpCode(res.dev_otp);
      }
      setSuccessInfo(res?.message || 'Account created successfully! Please enter your 6-digit verification code.');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessInfo(null);
    try {
      const data = await authService.verifyOtp(email, otpCode);
      if (onAuthSuccess) onAuthSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message || 'OTP verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setIsResending(true);
    setError(null);
    setSuccessInfo(null);
    try {
      const res = await authService.resendOtp(email);
      if (res?.dev_otp) {
        setOtpCode(res.dev_otp);
        setSuccessInfo(`New verification code: ${res.dev_otp}`);
      } else {
        setSuccessInfo(res?.message || 'A new verification code has been sent to your email.');
      }
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to resend verification code.');
    } finally {
      setIsResending(false);
    }
  };

  const handleQuickLogin = async (demoEmail) => {
    setIsLoading(true);
    setError(null);
    setOauthConfigInfo(null);
    try {
      authService.logout();
      const data = await authService.login(demoEmail, 'Password123!');
      if (onAuthSuccess) onAuthSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Sticky/Fixed Header */}
        <div className="auth-modal-header">
          <div>
            <span className="badge-editorial">
              <span className="badge-dot" />
              AUTHENTICATION
            </span>
            <h2 className="auth-modal-title">
              {mode === 'login' ? (
                <>Welcome back to <span className="serif-italic-accent">Kivora.</span></>
              ) : mode === 'register' ? (
                <>Join the <span className="serif-italic-accent">creative era.</span></>
              ) : (
                <>Verify your <span className="serif-italic-accent">identity.</span></>
              )}
            </h2>
          </div>
          <button className="auth-close-btn" onClick={onClose} aria-label="Close modal">✕</button>
        </div>

        {/* Tab Switcher (Sign In vs Create Account) */}
        {mode !== 'otp' && (
          <div className="auth-modal-tabs">
            <button
              type="button"
              className={`auth-tab-pill ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setError(null); setOauthConfigInfo(null); }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab-pill ${mode === 'register' ? 'active' : ''}`}
              onClick={() => { setMode('register'); setError(null); setOauthConfigInfo(null); }}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Scrollable Inner Body */}
        <div className="auth-modal-scrollable-body">
          {/* Alerts */}
          {error && (
            <div className="auth-banner error">
              <span>⚠</span>
              <div>{error}</div>
            </div>
          )}
          {successInfo && (
            <div className="auth-banner success">
              <span>✓</span>
              <div>{successInfo}</div>
            </div>
          )}

          {/* Social Auth Stack (Shown on both Sign In and Create Account) */}
          {mode !== 'otp' && (
            <>
              <div className="auth-social-stack">
                <button
                  type="button"
                  disabled={isLoading || isSocialLoading !== null}
                  onClick={() => handleSocialAuth('google')}
                  className="auth-social-btn"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" className="auth-social-icon">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                  <span>{isSocialLoading === 'google' ? 'Connecting to Google...' : 'Continue with Google'}</span>
                </button>

                <button
                  type="button"
                  disabled={isLoading || isSocialLoading !== null}
                  onClick={() => handleSocialAuth('github')}
                  className="auth-social-btn"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="auth-social-icon text-neutral-900">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  <span>{isSocialLoading === 'github' ? 'Connecting to GitHub...' : 'Continue with GitHub'}</span>
                </button>
              </div>

              {/* OAuth Configuration Guidance Banner if missing from environment */}
              {oauthConfigInfo && (
                <div className="auth-oauth-config-notice">
                  <div className="auth-notice-row">
                    <span className="auth-notice-icon">ℹ️</span>
                    <div className="auth-notice-content">
                      <strong className="auth-notice-title">
                        {oauthConfigInfo.provider} OAuth Setup Required
                      </strong>
                      <p className="auth-notice-desc">
                        {oauthConfigInfo.message}
                      </p>
                      <div className="auth-notice-actions">
                        <code className="auth-notice-code">
                          {oauthConfigInfo.envVars.join(' & ')}
                        </code>
                        <a
                          href={oauthConfigInfo.docsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="auth-notice-link"
                        >
                          Provider Documentation ↗
                        </a>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOauthConfigInfo(null)}
                      className="auth-notice-dismiss"
                      aria-label="Dismiss notice"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {/* Subtle OR Divider */}
              <div className="auth-social-divider">
                <span className="auth-social-divider-line" />
                <span className="auth-social-divider-text">OR CONTINUE WITH EMAIL</span>
                <span className="auth-social-divider-line" />
              </div>
            </>
          )}

          {/* Form Area: Login */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="auth-form-fields">
              <div className="auth-field-group">
                <label className="auth-field-label">Email Address</label>
                <input
                  type="email"
                  className="auth-input-control"
                  placeholder="name@kivora.demo"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="auth-field-group">
                <label className="auth-field-label">Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input-control"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="pw-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-dark w-full auth-submit-btn"
              >
                {isLoading ? 'Signing in...' : <>Sign In <span className="arrow-inline">→</span></>}
              </button>
            </form>
          )}

          {/* Form Area: Register */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="auth-form-fields">
              <div className="auth-field-group">
                <label className="auth-field-label">Select Your Account Type</label>
                <div className="auth-role-switch-grid">
                  <button
                    type="button"
                    className={`role-select-box ${role === 'CREATOR' ? 'active' : ''}`}
                    onClick={() => setRole('CREATOR')}
                  >
                    <span className="role-icon">🎨</span>
                    <div>
                      <strong>AI Creator</strong>
                      <small>Monetize generative skills</small>
                    </div>
                  </button>
                  <button
                    type="button"
                    className={`role-select-box ${role === 'BRAND' ? 'active' : ''}`}
                    onClick={() => setRole('BRAND')}
                  >
                    <span className="role-icon">🏢</span>
                    <div>
                      <strong>Brand / Agency</strong>
                      <small>Commission AI campaigns</small>
                    </div>
                  </button>
                </div>
              </div>

              <div className="auth-field-group">
                <label className="auth-field-label">Full Name or Studio / Company</label>
                <input
                  type="text"
                  className="auth-input-control"
                  placeholder={role === 'CREATOR' ? 'e.g. Aanya Sharma' : 'e.g. Lumina Skincare'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="auth-field-group">
                <label className="auth-field-label">Email Address</label>
                <input
                  type="email"
                  className="auth-input-control"
                  placeholder="you@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="auth-field-group">
                <label className="auth-field-label">Password (min 8 chars)</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input-control"
                    placeholder="Choose secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="pw-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-dark w-full auth-submit-btn"
              >
                {isLoading ? 'Creating Account...' : <>Join Kivora <span className="arrow-inline">→</span></>}
              </button>
            </form>
          )}

          {/* Form Area: OTP Verification */}
          {mode === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="auth-form-fields text-center">
              <p className="otp-explainer">
                We sent a 6-digit verification code to <strong>{email}</strong>.
              </p>

              <div className="auth-field-group">
                <input
                  type="text"
                  className="auth-input-control otp-input"
                  placeholder="123456"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-dark w-full auth-submit-btn"
                style={{ marginBottom: '16px' }}
              >
                {isLoading ? 'Verifying OTP...' : 'Verify Email & Continue →'}
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || isResending}
                className="btn btn-outline w-full"
                style={{ fontSize: '14px', padding: '10px' }}
              >
                {isResending ? 'Resending...' : resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : 'Resend Code'}
              </button>
            </form>
          )}

          {/* One-Click Demo Profiles (Preserved and fully accessible) */}
          <div className="auth-demo-section">
            <span className="demo-section-label">
              Instant Demo Access (Confirmed Seed Data)
            </span>
            <div className="demo-buttons-stack">
              <button
                type="button"
                onClick={() => handleQuickLogin('elena.rostova@kivora.demo')}
                disabled={isLoading}
                className="demo-pill-btn"
              >
                <div className="demo-btn-left">
                  <span className="demo-icon">🎬</span>
                  <div className="demo-info">
                    <strong>Aanya Sharma</strong>
                    <small>Top Studio Creator • Sci-Fi AI Director</small>
                  </div>
                </div>
                <span className="demo-arrow">Sign In →</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('creative@luminaskincare.demo')}
                disabled={isLoading}
                className="demo-pill-btn"
              >
                <div className="demo-btn-left">
                  <span className="demo-icon">🧴</span>
                  <div className="demo-info">
                    <strong>Lumina Skincare</strong>
                    <small>Verified Brand • Luxury Cosmetic Campaigns</small>
                  </div>
                </div>
                <span className="demo-arrow">Sign In →</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin@kivora.demo')}
                disabled={isLoading}
                className="demo-pill-btn"
              >
                <div className="demo-btn-left">
                  <span className="demo-icon">🛡</span>
                  <div className="demo-info">
                    <strong>Lead Reviewer</strong>
                    <small>Admin Desk • Verification & Audit Authority</small>
                  </div>
                </div>
                <span className="demo-arrow">Sign In →</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
