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
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null);

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      authService.logout();
      const data = await authService.login(email, password);
      if (onAuthSuccess) onAuthSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
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
      setSuccessInfo(res?.message || 'Account created successfully! Welcome to Kivora.');
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
        {/* Header */}
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

        {/* Tab Switcher (Login vs Register) */}
        {mode !== 'otp' && (
          <div className="auth-modal-tabs">
            <button
              type="button"
              className={`auth-tab-pill ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setError(null); }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab-pill ${mode === 'register' ? 'active' : ''}`}
              onClick={() => { setMode('register'); setError(null); }}
            >
              Create Account
            </button>
          </div>
        )}

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

        {/* Form Area */}
        <div className="auth-modal-body">
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
                  placeholder={role === 'CREATOR' ? 'e.g. Elena Rostova' : 'e.g. Lumina Skincare'}
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

          {/* One-Click Demo Profiles */}
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
                    <strong>Elena Rostova</strong>
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
