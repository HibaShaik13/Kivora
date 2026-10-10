import React from 'react';

export default function CreativeUniverseSection({
  onNavigateCreators,
  onNavigateBriefs,
  onOpenAuth,
}) {
  return (
    <section id="about" className="universe-section">
      <div className="container universe-container">
        {/* Ambient Portal Atmosphere */}
        <div className="universe-backdrop-glow" />
        <div className="universe-arch-portal" />

        <div className="universe-inner-grid">
          {/* Left: Call to Action */}
          <div className="universe-cta-block">
            <span className="badge-editorial universe-badge">
              <span className="badge-dot" />
              JOIN THE CREATIVE FUTURE
            </span>

            <h2 className="universe-title">
              Step into a<br />
              <span className="serif-italic-accent">creative universe.</span>
            </h2>

            <p className="universe-subtext">
              Explore creators, ideas and possibilities beyond imagination.
            </p>

            <div className="universe-actions">
              <button
                type="button"
                className="btn btn-dark btn-universe-cta"
                onClick={onOpenAuth}
              >
                Get Started Now <span className="arrow-inline">→</span>
              </button>
            </div>
          </div>

          {/* Right: Feature Highlights Cards */}
          <div className="universe-highlights">
            <div
              className="highlight-card glass-card"
              onClick={onNavigateCreators}
              role="button"
              tabIndex={0}
            >
              <div className="highlight-icon-circle">
                <span className="highlight-symbol">🎨</span>
              </div>
              <div className="highlight-info">
                <h4 className="highlight-name">Creators</h4>
                <p className="highlight-role">Visionary talent</p>
              </div>
              <span className="highlight-arrow">→</span>
            </div>

            <div
              className="highlight-card glass-card"
              onClick={onNavigateBriefs}
              role="button"
              tabIndex={0}
            >
              <div className="highlight-icon-circle">
                <span className="highlight-symbol">📋</span>
              </div>
              <div className="highlight-info">
                <h4 className="highlight-name">Briefs</h4>
                <p className="highlight-role">Meaningful projects</p>
              </div>
              <span className="highlight-arrow">→</span>
            </div>

            <div
              className="highlight-card glass-card"
              onClick={onNavigateBriefs}
              role="button"
              tabIndex={0}
            >
              <div className="highlight-icon-circle">
                <span className="highlight-symbol">⚡</span>
              </div>
              <div className="highlight-info">
                <h4 className="highlight-name">Collaboration</h4>
                <p className="highlight-role">Real impact</p>
              </div>
              <span className="highlight-arrow">→</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
