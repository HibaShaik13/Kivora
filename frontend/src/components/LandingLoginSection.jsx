import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';

const CREATIVE_QUOTATIONS = [
  {
    quote: "Your imagination deserves extraordinary collaborators.",
    highlight: "Human & Generative Synergy",
  },
  {
    quote: "Where human creativity meets intelligent innovation.",
    highlight: "Next-Gen Direction",
  },
  {
    quote: "Discover the minds behind tomorrow's visuals.",
    highlight: "Curated Talent",
  },
  {
    quote: "One bold idea. Infinite creative possibilities.",
    highlight: "Limitless Horizons",
  },
];

export default function LandingLoginSection({
  currentUser,
  onOpenAuth,
  onNavigateToDashboard,
  onLogout,
  onAuthSuccess,
}) {
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentQuoteIndex((prev) => (prev + 1) % CREATIVE_QUOTATIONS.length);
        setIsFading(false);
      }, 350);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const handleQuickDemoLogin = async (email) => {
    try {
      setDemoLoading(true);
      setDemoError(null);
      authService.logout();
      const data = await authService.login(email, 'Password123!');
      if (onAuthSuccess) onAuthSuccess(data);
    } catch (err) {
      setDemoError(err.message || 'Demo login failed');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <section id="login-section" className="landing-login-section">
      <div className="container landing-login-container">
        {/* Left Column: Welcoming Message & Rotating Creative Quotations */}
        <div className="login-editorial-column">
          <div className="login-badge-wrap">
            <span className="badge-editorial">
              <span className="badge-dot" />
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

          {/* Rotating Creative Quotation Card */}
          <div className="quote-display-card">
            <div className="quote-icon-mark">“</div>
            <div className={`quote-text-wrapper ${isFading ? 'fading' : ''}`}>
              <blockquote className="quote-body-text">
                {CREATIVE_QUOTATIONS[currentQuoteIndex].quote}
              </blockquote>
              <div className="quote-meta-row">
                <span className="quote-pill-tag">
                  {CREATIVE_QUOTATIONS[currentQuoteIndex].highlight}
                </span>
                <span className="quote-kivora-source">— Kivora Manifesto</span>
              </div>
            </div>

            {/* Quotation Carousel Indicators */}
            <div className="quote-indicators">
              {CREATIVE_QUOTATIONS.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`quote-dot ${idx === currentQuoteIndex ? 'active' : ''}`}
                  onClick={() => {
                    setIsFading(true);
                    setTimeout(() => {
                      setCurrentQuoteIndex(idx);
                      setIsFading(false);
                    }, 200);
                  }}
                  aria-label={`Show quote ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Trust Highlights */}
          <div className="login-trust-pills">
            <div className="trust-pill-item">
              <span className="trust-icon">✦</span>
              <span>Audited creator portfolios</span>
            </div>
            <div className="trust-pill-item">
              <span className="trust-icon">🛡</span>
              <span>Escrow milestone contracts</span>
            </div>
            <div className="trust-pill-item">
              <span className="trust-icon">⚡</span>
              <span>FastAPI & SQLite engine</span>
            </div>
          </div>
        </div>

        {/* Right Column: Original Modal Trigger or Active Session Portal */}
        <div className="login-form-column">
          <div className="login-card-surface">
            <div className="login-card-top-accent" />

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
              /* Logged Out Visitor: Original Modal Entrypoint & Demo Access */
              <div className="logged-out-portal-card">
                <div className="login-card-header">
                  <span className="badge-editorial mb-2">
                    <span className="badge-dot" />
                    GET STARTED
                  </span>
                  <h3 className="login-card-title">
                    Step into <span className="serif-italic-accent">Kivora.</span>
                  </h3>
                  <p className="login-card-subtitle">
                    Sign in to commission campaigns, manage creator deliverables, or explore verified portfolios.
                  </p>
                </div>

                {demoError && (
                  <div className="auth-banner error" style={{ marginBottom: '1rem' }}>
                    <span>⚠</span>
                    <div>{demoError}</div>
                  </div>
                )}

                <div className="portal-cta-stack">
                  <button
                    type="button"
                    className="btn btn-dark w-full auth-submit-btn"
                    onClick={onOpenAuth}
                  >
                    Open Sign In / Register Modal <span className="arrow-inline">→</span>
                  </button>
                </div>

                {/* Instant Demo Access (Exact Existing Profiles) */}
                <div className="auth-demo-section" style={{ marginTop: '2rem' }}>
                  <span className="demo-section-label">
                    Instant Demo Access (Confirmed Seed Data)
                  </span>
                  <div className="demo-buttons-stack">
                    <button
                      type="button"
                      onClick={() => handleQuickDemoLogin('elena.rostova@kivora.demo')}
                      disabled={demoLoading}
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
                      onClick={() => handleQuickDemoLogin('creative@luminaskincare.demo')}
                      disabled={demoLoading}
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
                      onClick={() => handleQuickDemoLogin('admin@kivora.demo')}
                      disabled={demoLoading}
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
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
