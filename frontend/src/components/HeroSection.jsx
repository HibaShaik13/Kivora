import React from 'react';

export default function HeroSection({
  onExploreCreators,
  onExploreBriefs,
  onGetStarted,
  onOpenAiBuilder,
}) {
  const scrollToLogin = () => {
    if (onGetStarted) {
      onGetStarted();
    } else {
      const loginSection = document.getElementById('login-section');
      if (loginSection) {
        loginSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <section className="cosmic-hero-section">
      {/* Background Cosmic Canvas & Ambient Lights */}
      <div className="cosmic-hero-bg-layer" aria-hidden="true">
        <img
          src="/assets/cosmic_hero_artwork.jpg"
          alt=""
          className="cosmic-hero-artwork-img"
          onError={(e) => {
            // Fallback in case of image load delay
            e.currentTarget.style.display = 'none';
          }}
        />
        <div className="cosmic-vignette-overlay" />
        <div className="cosmic-glow-orb cosmic-glow-purple" />
        <div className="cosmic-glow-orb cosmic-glow-amber" />
        <div className="cosmic-stars-particles" />
      </div>

      <div className="container cosmic-hero-container">
        {/* Left Column: Editorial Cosmic Typography & Actions */}
        <div className="cosmic-hero-text-block">
          {/* Small Top Label */}
          <div className="cosmic-label-badge">
            <span className="cosmic-badge-pill">
              <span className="cosmic-badge-sparkle">✦</span>
              CREATIVE POSSIBILITIES. LIMITLESS HORIZONS.
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="cosmic-hero-headline">
            Step into a<br />
            <span className="cosmic-hero-italic-highlight">creative universe.</span>
          </h1>

          {/* Supporting Text */}
          <p className="cosmic-hero-subtext">
            Explore talents, ideas and possibilities beyond imagination.
          </p>

          {/* CTA Buttons matching reference image */}
          <div className="cosmic-hero-cta-group">
            <button
              type="button"
              className="cosmic-btn-primary"
              onClick={onExploreCreators}
              aria-label="Explore creators"
            >
              Explore Creators <span className="cosmic-arrow-icon">→</span>
            </button>
            <button
              type="button"
              className="cosmic-btn-secondary"
              onClick={() => {
                if (onOpenAiBuilder) onOpenAiBuilder();
                else scrollToLogin();
              }}
              aria-label="Post a campaign"
            >
              Post a Campaign
            </button>
          </div>
        </div>

        {/* Right Column: Portal Scene & Interactive Pills matching reference */}
        <div className="cosmic-hero-planet-interactive-layer" aria-label="Creative Universe Navigation">
          {/* Center Portal Badge: Creators */}
          <div className="cosmic-portal-center-badge animate-float-slow">
            <button
              type="button"
              className="cosmic-portal-pill"
              onClick={onExploreCreators}
              title="Discover verified creators"
            >
              <span className="node-icon">👑</span>
              <span className="node-text">Creators</span>
            </button>
          </div>

          {/* Right-aligned Vertical Floating Pills */}
          <div className="cosmic-hero-right-pills">
            <button
              type="button"
              className="cosmic-interactive-pill animate-float-slow"
              onClick={onExploreBriefs}
              title="Explore briefs"
            >
              <span className="node-icon">📄</span>
              <span className="node-text">Briefs</span>
            </button>

            <button
              type="button"
              className="cosmic-interactive-pill animate-float-delayed"
              onClick={onExploreBriefs}
              title="Explore open briefs"
            >
              <span className="node-icon">📋</span>
              <span className="node-text">Briefs</span>
            </button>

            <button
              type="button"
              className="cosmic-interactive-pill animate-float-gentle"
              onClick={() => {
                const howItWorks = document.getElementById('how-it-works');
                if (howItWorks) {
                  howItWorks.scrollIntoView({ behavior: 'smooth' });
                } else if (onExploreCreators) {
                  onExploreCreators();
                }
              }}
              title="Collaborate on campaigns"
            >
              <span className="node-icon">🔗</span>
              <span className="node-text">Collaborate</span>
            </button>

            <button
              type="button"
              className="cosmic-interactive-pill animate-float-slow"
              onClick={() => {
                if (onOpenAiBuilder) onOpenAiBuilder();
                else scrollToLogin();
              }}
              title="Create a brief or launch campaign"
            >
              <span className="node-icon">⭐</span>
              <span className="node-text">Create</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
