import React, { useState } from 'react';
import { authService } from '../services/authService';

export default function LandingLoginSection({
  currentUser,
  onOpenAuth,
  onNavigateToDashboard,
  onLogout,
  onAuthSuccess,
}) {
  // authMode: 'login' | 'register' | 'otp' | 'forgot' | 'reset'
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('CREATOR');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState(null);
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);
  const [oauthConfigInfo, setOauthConfigInfo] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const clearMessages = () => {
    setError(null);
    setInfoMessage(null);
    setOauthConfigInfo(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      if (authMode === 'login') {
        const data = await authService.login(email, password);
        if (onAuthSuccess) onAuthSuccess(data);
      } else if (authMode === 'register') {
        const data = await authService.register({
          email,
          password,
          full_name: fullName || email.split('@')[0],
          role,
        });
        if (data?.requires_otp) {
          setAuthMode('otp');
          setInfoMessage(
            data.dev_otp
              ? `Verification code sent! (Dev OTP: ${data.dev_otp})`
              : 'Please enter the 6-digit verification code dispatched to your email.'
          );
        } else if (data?.access_token) {
          if (onAuthSuccess) onAuthSuccess(data);
        }
      } else if (authMode === 'otp') {
        const data = await authService.verifyOtp(email, otpCode);
        if (onAuthSuccess) onAuthSuccess(data);
      } else if (authMode === 'forgot') {
        const data = await authService.forgotPassword(email);
        setAuthMode('reset');
        setInfoMessage(
          data?.dev_otp
            ? `Password reset code sent! (Dev OTP: ${data.dev_otp})`
            : 'If an account exists, a 6-digit password reset code has been sent to your email.'
        );
      } else if (authMode === 'reset') {
        await authService.resetPassword(email, otpCode, newPassword);
        // Automatically sign in with newly set credentials
        const data = await authService.login(email, newPassword);
        if (onAuthSuccess) onAuthSuccess(data);
      }
    } catch (err) {
      const msg = err.message || 'Authentication request failed.';
      if (authMode === 'login' && msg.toLowerCase().includes('not been verified')) {
        setError(msg);
        setAuthMode('otp');
        setInfoMessage('Enter your verification code to complete account activation.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      setError('Please provide your email address first.');
      return;
    }
    clearMessages();
    setLoading(true);
    try {
      const data = await authService.resendOtp(email);
      setInfoMessage(
        data?.dev_otp
          ? `New verification code dispatched! (Dev OTP: ${data.dev_otp})`
          : 'A new 6-digit verification code has been dispatched to your email.'
      );
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
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail) => {
    try {
      setLoading(true);
      clearMessages();
      authService.logout();
      const data = await authService.login(demoEmail, 'Password123!');
      if (onAuthSuccess) onAuthSuccess(data);
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (provider) => {
    setIsSocialLoading(provider);
    clearMessages();
    try {
      const res = await authService.getOAuthAuthorizeUrl(provider, role);
      if (res?.authorization_url) {
        window.location.href = res.authorization_url;
      } else {
        throw new Error(`Failed to generate ${provider} authorization URL.`);
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

  return (
    <section id="login-section" className="landing-login-section relative overflow-hidden">
      {/* 3D Cosmic Ribbon Background using newly provided login_section_bg.png */}
      <div className="login-ribbon-bg" aria-hidden="true">
        <img
          src="/assets/login_section_bg.png"
          alt=""
          className="login-custom-bg-img"
        />
        <div className="login-ambient-bloom" />
        <div className="login-floor-glow" />
      </div>

      <div className="container landing-login-container relative z-10">
        {/* Left Column: Welcoming Message & Manifesto Card */}
        <div className="login-editorial-column">
          <div className="login-badge-wrap">
            <span className="badge-editorial">
              <span className="badge-sparkle">✦</span>
              JOIN THE CREATIVE ERA
            </span>
          </div>

          <h2 className="login-editorial-title">
            Your next creative<br />
            chapter <span className="serif-italic-accent">starts here.</span>
          </h2>

          <p className="login-editorial-desc">
            Meet extraordinary talent, shape ambitious ideas, and bring your vision to life with Kivora.
          </p>

          {/* Manifesto Card with 4 Creator Avatars matching reference */}
          <div className="manifesto-card-box">
            <div className="manifesto-avatars-row">
              <img
                src="/assets/creator-portraits/elena.jpg"
                alt="Aanya"
                className="manifesto-avatar-img"
              />
              <img
                src="/assets/creator-portraits/marcus.jpg"
                alt="Arjun"
                className="manifesto-avatar-img"
              />
              <img
                src="/assets/creator-portraits/kai.jpg"
                alt="Kabir"
                className="manifesto-avatar-img"
              />
              <img
                src="/assets/creator-portraits/sophia.jpg"
                alt="Sanya"
                className="manifesto-avatar-img"
              />
            </div>
            <div className="manifesto-text-content">
              <p className="manifesto-quote-text">
                Where human creativity meets intelligent innovation.
              </p>
              <span className="manifesto-quote-author">— Kivora Manifesto</span>
            </div>
          </div>

          {/* Trust Highlights matching reference pills */}
          <div className="login-trust-pills">
            <div className="trust-pill-item">
              <span className="trust-icon">✦</span>
              <span>Audited creator portfolios</span>
            </div>
            <div className="trust-pill-item">
              <span className="trust-icon">✦</span>
              <span>Escrow milestone contracts</span>
            </div>
            <div className="trust-pill-item">
              <span className="trust-icon text-amber-500">⚡</span>
              <span>FastAPI & SQLite engine</span>
            </div>
          </div>
        </div>

        {/* Right Column: 3D White Glass Authentication Card */}
        <div className="login-form-column">
          <div className="auth-card-3d-surface">
            {currentUser ? (
              /* Authenticated User: Session-Aware Workspace Portal */
              <div className="auth-authenticated-card">
                <div className="auth-authenticated-header">
                  <span className="badge-editorial">
                    <span className="badge-dot" />
                    ACTIVE SESSION DETECTED
                  </span>
                  <h3 className="auth-authenticated-title">
                    Welcome back, <span className="serif-italic-accent">{currentUser.full_name || currentUser.email.split('@')[0]}</span>
                  </h3>
                  <p className="auth-authenticated-sub">
                    You are signed in as a verified <strong>{currentUser.role}</strong>. Your dashboard and active workflows are ready.
                  </p>
                </div>

                <div className="auth-authenticated-actions">
                  <button
                    type="button"
                    className="btn btn-dark w-full auth-submit-btn"
                    onClick={onNavigateToDashboard}
                  >
                    Go to {currentUser.role === 'CREATOR' ? 'Creator Studio' : currentUser.role === 'BRAND' ? 'Brand Workspace' : 'Admin Desk'} <span className="arrow-inline">→</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline w-full btn-authenticated-logout"
                    onClick={onLogout}
                  >
                    Log Out of Current Session
                  </button>
                </div>
              </div>
            ) : (
              /* Reference-matched Compact Authentication Card */
              <div className="auth-reference-card-inner">
                {/* Title */}
                <h3 className="auth-card-clean-title">
                  Welcome to <span className="auth-kivora-serif">Kivora.</span>
                </h3>

                {/* Tab Switcher: Sign In | Create Account */}
                {(authMode === 'login' || authMode === 'register') && (
                  <div className="auth-pill-tab-track">
                    <button
                      type="button"
                      className={`auth-pill-tab-btn ${authMode === 'login' ? 'active' : ''}`}
                      onClick={() => {
                        setAuthMode('login');
                        clearMessages();
                      }}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      className={`auth-pill-tab-btn ${authMode === 'register' ? 'active' : ''}`}
                      onClick={() => {
                        setAuthMode('register');
                        clearMessages();
                      }}
                    >
                      Create Account
                    </button>
                  </div>
                )}

                {/* Side-by-Side Google & GitHub OAuth Buttons (Visible in login/register) */}
                {(authMode === 'login' || authMode === 'register') && (
                  <div className="auth-social-row-grid">
                    <button
                      type="button"
                      className="auth-social-col-btn"
                      onClick={() => handleSocialAuth('google')}
                      disabled={loading || isSocialLoading === 'google'}
                    >
                      <svg className="social-icon" width="18" height="18" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>{isSocialLoading === 'google' ? 'Connecting...' : 'Continue with Google'}</span>
                    </button>

                    <button
                      type="button"
                      className="auth-social-col-btn"
                      onClick={() => handleSocialAuth('github')}
                      disabled={loading || isSocialLoading === 'github'}
                    >
                      <svg className="social-icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                      </svg>
                      <span>{isSocialLoading === 'github' ? 'Connecting...' : 'Continue with GitHub'}</span>
                    </button>
                  </div>
                )}

                {/* OAuth Missing Config Notice */}
                {oauthConfigInfo && (
                  <div className="auth-oauth-config-notice mt-2 mb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-amber-800">
                          {oauthConfigInfo.provider} OAuth Setup Required
                        </div>
                        <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                          {oauthConfigInfo.message}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="text-amber-500 hover:text-amber-700 text-sm font-bold"
                        onClick={() => setOauthConfigInfo(null)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}

                {/* Divider (in login/register mode) */}
                {(authMode === 'login' || authMode === 'register') && (
                  <div className="auth-clean-divider">
                    <span>OR CONTINUE WITH EMAIL</span>
                  </div>
                )}

                {/* Info Feedback Box */}
                {infoMessage && (
                  <div className="text-purple-700 text-xs py-1.5 px-3 mb-2 rounded bg-purple-50 border border-purple-200">
                    {infoMessage}
                  </div>
                )}

                {/* Error Alert Box */}
                {error && (
                  <div className="auth-alert-box text-rose-500 text-xs py-1.5 px-3 mb-2 rounded bg-rose-50 border border-rose-200">
                    {error}
                  </div>
                )}

                {/* Authentication Forms */}
                <form onSubmit={handleSubmit} className="auth-compact-form">
                  {/* Register Form extra fields */}
                  {authMode === 'register' && (
                    <div className="auth-compact-input-group">
                      <span className="auth-input-prefix-icon">👤</span>
                      <input
                        type="text"
                        className="auth-compact-input"
                        placeholder="Full Name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  {/* Email Field (for login, register, forgot, reset) */}
                  {authMode !== 'otp' && (
                    <div className="auth-compact-input-group">
                      <span className="auth-input-prefix-icon">✉</span>
                      <input
                        type="email"
                        className="auth-compact-input"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={authMode === 'reset'}
                      />
                    </div>
                  )}

                  {/* Password Field (for login, register) */}
                  {(authMode === 'login' || authMode === 'register') && (
                    <div className="auth-compact-input-group">
                      <span className="auth-input-prefix-icon">🔒</span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="auth-compact-input pr-10"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        className="auth-input-suffix-eye"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                  )}

                  {/* Forgot Password Link */}
                  {authMode === 'login' && (
                    <div className="auth-forgot-row">
                      <button
                        type="button"
                        className="auth-forgot-link-text"
                        onClick={() => {
                          setAuthMode('forgot');
                          clearMessages();
                        }}
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  {/* Register Role Selector */}
                  {authMode === 'register' && (
                    <div className="auth-role-select-row">
                      <span className="auth-role-label">Join as:</span>
                      <div className="flex gap-2 flex-1">
                        <button
                          type="button"
                          className={`flex-1 py-1 text-xs rounded-full border ${role === 'CREATOR' ? 'bg-purple-100 border-purple-500 font-bold text-purple-700' : 'border-neutral-200'}`}
                          onClick={() => setRole('CREATOR')}
                        >
                          🎨 Creator
                        </button>
                        <button
                          type="button"
                          className={`flex-1 py-1 text-xs rounded-full border ${role === 'BRAND' ? 'bg-purple-100 border-purple-500 font-bold text-purple-700' : 'border-neutral-200'}`}
                          onClick={() => setRole('BRAND')}
                        >
                          🏢 Brand
                        </button>
                      </div>
                    </div>
                  )}

                  {/* OTP Verification Fields (for registration OTP or login verification) */}
                  {authMode === 'otp' && (
                    <>
                      <div className="mb-2 text-center text-xs text-slate-600">
                        Enter the 6-digit verification code sent to <strong>{email}</strong>
                      </div>
                      <div className="auth-compact-input-group">
                        <span className="auth-input-prefix-icon">🔢</span>
                        <input
                          type="text"
                          className="auth-compact-input text-center font-mono font-bold tracking-widest text-lg"
                          placeholder="123456"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          required
                          autoFocus
                        />
                      </div>
                      <div className="flex justify-between items-center text-xs mt-1 mb-2">
                        <button
                          type="button"
                          className="text-purple-600 hover:underline font-semibold disabled:opacity-50"
                          onClick={handleResendOtp}
                          disabled={loading || resendCooldown > 0}
                        >
                          {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend code'}
                        </button>
                        <button
                          type="button"
                          className="text-slate-500 hover:underline"
                          onClick={() => {
                            setAuthMode('login');
                            clearMessages();
                          }}
                        >
                          Back to Sign In
                        </button>
                      </div>
                    </>
                  )}

                  {/* Reset Password Form Fields */}
                  {authMode === 'reset' && (
                    <>
                      <div className="auth-compact-input-group">
                        <span className="auth-input-prefix-icon">🔢</span>
                        <input
                          type="text"
                          className="auth-compact-input text-center font-mono font-bold tracking-widest text-lg"
                          placeholder="6-digit reset code"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          required
                        />
                      </div>
                      <div className="auth-compact-input-group">
                        <span className="auth-input-prefix-icon">🔒</span>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className="auth-compact-input pr-10"
                          placeholder="New password (min 8 chars)"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          minLength={8}
                        />
                      </div>
                    </>
                  )}

                  {/* Primary Submit Button */}
                  <button
                    type="submit"
                    className="auth-solid-submit-btn"
                    disabled={loading}
                  >
                    {loading
                      ? 'Please wait...'
                      : authMode === 'login'
                      ? 'Sign In'
                      : authMode === 'register'
                      ? 'Create Account'
                      : authMode === 'otp'
                      ? 'Verify & Sign In'
                      : authMode === 'forgot'
                      ? 'Send Reset Code'
                      : 'Reset Password & Sign In'}
                  </button>

                  {/* Return to Sign In button for forgot/reset */}
                  {(authMode === 'forgot' || authMode === 'reset') && (
                    <button
                      type="button"
                      className="text-center text-xs text-purple-600 hover:underline font-semibold mt-2"
                      onClick={() => {
                        setAuthMode('login');
                        clearMessages();
                      }}
                    >
                      ← Back to Sign In
                    </button>
                  )}
                </form>

                {/* Footer Switch Prompt (in login/register mode) */}
                {(authMode === 'login' || authMode === 'register') && (
                  <div className="auth-switch-prompt">
                    {authMode === 'login' ? (
                      <p>
                        Don't have an account?{' '}
                        <button
                          type="button"
                          className="auth-switch-link"
                          onClick={() => {
                            setAuthMode('register');
                            clearMessages();
                          }}
                        >
                          Create one
                        </button>
                      </p>
                    ) : (
                      <p>
                        Already have an account?{' '}
                        <button
                          type="button"
                          className="auth-switch-link"
                          onClick={() => {
                            setAuthMode('login');
                            clearMessages();
                          }}
                        >
                          Sign in
                        </button>
                      </p>
                    )}
                  </div>
                )}

                {/* Instant Demo Access Header */}
                <div className="auth-clean-divider">
                  <span>INSTANT DEMO ACCESS (CONFIRMED SEED DATA)</span>
                </div>

                {/* 3 Distinct Demo Account Rows Matching Reference Exactly */}
                <div className="auth-demo-accounts-stack">
                  {/* 1. Elena Rostova */}
                  <div
                    className="auth-demo-account-row"
                    onClick={() => handleQuickDemoLogin('elena.rostova@kivora.demo')}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="demo-account-icon-box bg-purple-100 text-purple-700 border border-purple-200">
                      🎬
                    </div>
                    <div className="demo-account-text-col">
                      <div className="demo-account-name">Aanya Sharma</div>
                      <div className="demo-account-role">Top Studio Creator • Sci-Fi AI Director</div>
                    </div>
                    <span className="demo-account-action-link">Sign In →</span>
                  </div>

                  {/* 2. Lumina Skincare */}
                  <div
                    className="auth-demo-account-row"
                    onClick={() => handleQuickDemoLogin('creative@luminaskincare.demo')}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="demo-account-icon-box bg-pink-100 text-pink-700 border border-pink-200">
                      🧴
                    </div>
                    <div className="demo-account-text-col">
                      <div className="demo-account-name">Lumina Skincare</div>
                      <div className="demo-account-role">Verified Brand • Luxury Cosmetic Campaigns</div>
                    </div>
                    <span className="demo-account-action-link">Sign In →</span>
                  </div>

                  {/* 3. Lead Reviewer */}
                  <div
                    className="auth-demo-account-row"
                    onClick={() => handleQuickDemoLogin('admin@kivora.demo')}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="demo-account-icon-box bg-slate-100 text-slate-700 border border-slate-200">
                      🛡️
                    </div>
                    <div className="demo-account-text-col">
                      <div className="demo-account-name">Lead Reviewer</div>
                      <div className="demo-account-role">Admin Desk • Verification & Audit Authority</div>
                    </div>
                    <span className="demo-account-action-link">Sign In →</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
