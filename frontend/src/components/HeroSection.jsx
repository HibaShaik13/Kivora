import React from 'react';

export default function HeroSection({
  onExploreCreators,
  onOpenAiBuilder,
}) {
  return (
    <section className="hero-section">
      <div className="container hero-container">
        {/* Left Column: Editorial Headline, Subtext, CTAs */}
        <div className="hero-content">
          {/* Tag Badge */}
          <div className="hero-badge">
            <span className="badge-editorial">
              <span className="badge-dot" />
              A CREATIVE MARKETPLACE FOR THE AI ERA
            </span>
          </div>

          {/* Main Title */}
          <h1 className="hero-title">
            Where bold ideas<br />
            find their <span className="serif-italic-accent">creators.</span>
          </h1>

          {/* Subtext */}
          <p className="hero-description">
            Connect with verified AI creatives, from visionary directors to 3D artists,
            animators and designers. Turn your ideas into extraordinary campaigns.
          </p>

          {/* Action Buttons */}
          <div className="hero-actions">
            <button
              type="button"
              className="btn btn-dark btn-hero-primary"
              onClick={onExploreCreators}
            >
              Explore Creators <span className="arrow-inline">→</span>
            </button>

            <button
              type="button"
              className="btn btn-frosted btn-hero-secondary"
              onClick={onOpenAiBuilder}
            >
              Create a Brief
            </button>
          </div>
        </div>

        {/* Right Column: 3D Aesthetic Floating Showcase with Glass Cards & Ambient Lighting */}
        <div className="hero-visual-wrapper">
          <div className="hero-ambient-orb" />
          <div className="hero-ambient-orb secondary" />

          <div className="hero-floating-scene">
            {/* Primary Featured Creator Card */}
            <div className="hero-float-card hero-card-main animate-float">
              <div className="hero-card-media-wrapper">
                <img
                  src="/assets/avatars/elena.jpg"
                  alt="Elena Rostova"
                  className="hero-card-img"
                  onError={(e) => {
                    e.target.src = '/assets/backgrounds/creator-profile.jpg';
                  }}
                />
                <span className="hero-card-badge">👑 Top Studio</span>
              </div>
              <div className="hero-card-content">
                <div className="hero-card-header-row">
                  <div>
                    <h4 className="hero-card-name">Elena Rostova</h4>
                    <span className="hero-card-role">Sci-Fi Film & AI Director</span>
                  </div>
                  <span className="purple-check-badge">✓</span>
                </div>
                <div className="hero-card-tags">
                  <span className="mini-tag-pill">Runway Gen-3</span>
                  <span className="mini-tag-pill">ComfyUI</span>
                  <span className="mini-tag-pill">4K Video</span>
                </div>
              </div>
            </div>

            {/* Secondary Floating Mini Card (Marcus Vance) */}
            <div className="hero-float-card hero-card-secondary animate-float-delayed">
              <img
                src="/assets/avatars/marcus.jpg"
                alt="Marcus Vance"
                className="hero-mini-avatar"
                onError={(e) => {
                  e.target.src = '/assets/backgrounds/brand-workspace.jpg';
                }}
              />
              <div className="hero-mini-info">
                <div className="hero-mini-title">
                  <strong>Marcus Vance</strong>
                  <span className="purple-check-badge">✓</span>
                </div>
                <span className="hero-mini-sub">3D & Product Viz</span>
              </div>
            </div>

            {/* Tertiary Floating Metric Chip */}
            <div className="hero-float-card hero-card-metric animate-pulse-gentle">
              <div className="metric-dot" />
              <div className="metric-content">
                <span className="metric-label">Audited Evidence</span>
                <span className="metric-val">100% Verified</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

