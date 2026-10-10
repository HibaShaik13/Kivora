import React from 'react';

export default function HowItWorksSection({ onExplore, onPostBrief }) {
  const steps = [
    {
      num: '01',
      title: 'Discover',
      desc: 'Find verified creators matching your vision.',
      icon: (
        <svg viewBox="0 0 100 100" className="step-3d-svg">
          <defs>
            <linearGradient id="torusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C4B5FD" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#6D28D9" stopOpacity="0.95" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <ellipse cx="50" cy="50" rx="38" ry="24" fill="none" stroke="url(#torusGrad)" strokeWidth="14" transform="rotate(-25 50 50)" filter="url(#glow)" />
          <ellipse cx="50" cy="50" rx="20" ry="10" fill="none" stroke="#FFFFFF" strokeWidth="3" opacity="0.6" transform="rotate(-25 50 50)" />
        </svg>
      ),
      action: onExplore,
    },
    {
      num: '02',
      title: 'Define',
      desc: 'Create structured briefs with AI assistance.',
      icon: (
        <svg viewBox="0 0 100 100" className="step-3d-svg">
          <defs>
            <linearGradient id="cubeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E9D5FF" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#A855F7" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#7E22CE" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          <rect x="22" y="24" width="40" height="40" rx="8" fill="url(#cubeGrad)" opacity="0.6" transform="rotate(-10 42 44)" />
          <rect x="36" y="36" width="42" height="42" rx="8" fill="url(#cubeGrad)" opacity="0.85" />
          <line x1="44" y1="50" x2="68" y2="50" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
          <line x1="44" y1="60" x2="60" y2="60" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
        </svg>
      ),
      action: onPostBrief,
    },
    {
      num: '03',
      title: 'Connect',
      desc: 'Get the best matches with explainable insights.',
      icon: (
        <svg viewBox="0 0 100 100" className="step-3d-svg">
          <defs>
            <radialGradient id="sphereGrad1" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="40%" stopColor="#C084FC" />
              <stop offset="100%" stopColor="#6B21A8" />
            </radialGradient>
            <radialGradient id="sphereGrad2" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#F3E8FF" />
              <stop offset="50%" stopColor="#A855F7" />
              <stop offset="100%" stopColor="#581C87" />
            </radialGradient>
          </defs>
          <circle cx="42" cy="45" r="22" fill="url(#sphereGrad1)" opacity="0.9" />
          <circle cx="68" cy="62" r="15" fill="url(#sphereGrad2)" opacity="0.85" />
          <circle cx="65" cy="30" r="10" fill="url(#sphereGrad1)" opacity="0.75" />
        </svg>
      ),
      action: onExplore,
    },
    {
      num: '04',
      title: 'Create',
      desc: 'Collaborate, track progress and achieve real impact.',
      icon: (
        <svg viewBox="0 0 100 100" className="step-3d-svg">
          <defs>
            <linearGradient id="prismGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F3E8FF" stopOpacity="0.95" />
              <stop offset="60%" stopColor="#9333EA" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#581C87" stopOpacity="0.95" />
            </linearGradient>
          </defs>
          <polygon points="50,15 85,75 15,75" fill="url(#prismGrad)" opacity="0.88" />
          <polygon points="50,15 85,75 52,75" fill="#FFFFFF" opacity="0.25" />
          <polygon points="50,15 52,75 15,75" fill="#581C87" opacity="0.3" />
        </svg>
      ),
      action: onPostBrief,
    },
  ];

  return (
    <section id="how-it-works" className="how-it-works-section">
      <div className="container">
        {/* Section Header */}
        <div className="section-head-row">
          <div>
            <span className="badge-editorial">
              <span className="badge-dot" />
              HOW KIVORA WORKS
            </span>
            <h2 className="section-title">
              From idea to <span className="serif-italic-accent">impact.</span>
            </h2>
            <p className="section-subtext">
              A transparent workflow designed for AI-native production and multi-disciplinary creative campaigns.
            </p>
          </div>

          <div className="section-head-link">
            <button
              type="button"
              className="link-arrow-btn"
              onClick={onExplore}
            >
              Learn More <span className="arrow-inline">→</span>
            </button>
          </div>
        </div>

        {/* 4 Steps Grid */}
        <div className="steps-grid">
          {steps.map((st) => (
            <div
              key={st.num}
              className="step-card glass-card"
              onClick={st.action}
              role="button"
              tabIndex={0}
            >
              <div className="step-card-top">
                <span className="step-card-num">{st.num} •</span>
                <div className="step-card-visual">{st.icon}</div>
              </div>

              <div className="step-card-content">
                <h3 className="step-card-title">{st.title}</h3>
                <p className="step-card-desc">{st.desc}</p>
              </div>

              <div className="step-card-footer">
                <span className="step-corner-arrow">↗</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
