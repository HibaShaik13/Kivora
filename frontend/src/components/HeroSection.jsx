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

          {/* Primary Action Button */}
          <div className="cosmic-hero-cta-group">
            <button
              type="button"
              className="cosmic-btn-primary"
              onClick={onExploreCreators}
              aria-label="Explore creators"
            >
              Explore Now <span className="cosmic-arrow-icon">→</span>
            </button>
          </div>
        </div>

        {/* Right Column: Interactive Constellation Floating Badges over Planet Scene */}
        <div className="cosmic-hero-planet-interactive-layer" aria-label="Creative Universe Navigation">
          {/* 1. CREATORS floating label (Top Left) */}
          <div className="cosmic-floating-node node-creators animate-float-slow">
            <button
              type="button"
              className="cosmic-interactive-pill"
              onClick={onExploreCreators}
              title="Discover verified creators"
            >
              <span className="node-icon">👑</span>
              <span className="node-text">CREATORS</span>
            </button>
            <div className="cosmic-connector-line line-creators" />
          </div>

          {/* 2. BRIEFS floating label (Top Right) */}
          <div className="cosmic-floating-node node-briefs animate-float-delayed">
            <button
              type="button"
              className="cosmic-interactive-pill"
              onClick={onExploreBriefs}
              title="Explore open briefs"
            >
              <span className="node-icon">📄</span>
              <span className="node-text">BRIEFS</span>
            </button>
            <div className="cosmic-connector-line line-briefs" />
          </div>

          {/* 3. COLLABORATE floating label (Bottom Left) */}
          <div className="cosmic-floating-node node-collaborate animate-float-gentle">
            <button
              type="button"
              className="cosmic-interactive-pill"
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
              <span className="node-text">COLLABORATE</span>
            </button>
            <div className="cosmic-connector-line line-collaborate" />
          </div>

          {/* 4. CREATE floating label (Bottom Right) */}
          <div className="cosmic-floating-node node-create animate-float-slow">
            <button
              type="button"
              className="cosmic-interactive-pill"
              onClick={() => {
                if (onOpenAiBuilder) {
                  onOpenAiBuilder();
                } else {
                  scrollToLogin();
                }
              }}
              title="Create a brief or launch campaign"
            >
              <span className="node-icon">✦</span>
              <span className="node-text">CREATE</span>
            </button>
            <div className="cosmic-connector-line line-create" />
          </div>
        </div>
      </div>
    </section>
  );
}
