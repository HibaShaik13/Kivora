import React from 'react';

const CREATIVE_DOMAINS_DATA = [
  { id: '3D_CGI', name: '3D & CGI', count: '40+ creators', icon: '🧊', color: '#8B5CF6' },
  { id: 'AI_ART', name: 'AI Art', count: '17+ creators', icon: '✨', color: '#A855F7' },
  { id: 'MOTION_DESIGN', name: 'Motion Design', count: '8+ creators', icon: '🎬', color: '#6366F1' },
  { id: 'VISUAL_EFFECTS', name: 'Visual Effects', count: 'Browse Domain', icon: '🪄', color: '#7C3AED' },
  { id: 'ILLUSTRATION', name: 'Illustration', count: '12+ creators', icon: '✏️', color: '#EC4899' },
  { id: 'BRAND_DESIGN', name: 'Brand Design', count: '15+ creators', icon: '🎨', color: '#F43F5E' },
  { id: 'FASHION_APPAREL', name: 'Fashion & Apparel', count: '31+ creators', icon: '👗', color: '#D946EF' },
  { id: 'BEAUTY_SKINCARE', name: 'Beauty & Skincare', count: '26+ creators', icon: '🧴', color: '#E11D48' },
  { id: 'FOOD_BEVERAGE', name: 'Food & Beverage', count: '25+ creators', icon: '☕', color: '#EA580C' },
  { id: 'AUTOMOTIVE', name: 'Automotive', count: '12+ creators', icon: '🏎️', color: '#4F46E5' },
  { id: 'GAMING', name: 'Gaming', count: '18+ creators', icon: '🎮', color: '#2563EB' },
  { id: 'FILM_ENTERTAINMENT', name: 'Film & Entertainment', count: '34+ creators', icon: '🎥', color: '#7E22CE' },
];

export default function CreativeDomainsSection({ onSelectDomain, onNavigateCreators }) {
  return (
    <section className="creative-domains-section relative overflow-hidden">
      <div className="container relative z-10">
        {/* Section Header */}
        <div className="domains-section-header">
          <div>
            <div className="domains-badge-pill">
              <span className="badge-sparkle">✦</span>
              EXPLORE CREATIVE DOMAINS
            </div>
            <h2 className="domains-section-title">
              Find the right creative expertise.
            </h2>
            <p className="domains-section-sub">
              Browse creators and campaigns by industry and creative domain.
            </p>
          </div>

          <button
            type="button"
            className="domains-view-all-btn"
            onClick={onNavigateCreators}
          >
            View All Domains <span className="arrow-inline">→</span>
          </button>
        </div>

        {/* 12 Domain Cards Grid: 6 Columns on Desktop */}
        <div className="domains-cards-grid">
          {CREATIVE_DOMAINS_DATA.map((domain) => (
            <div
              key={domain.id}
              className="domain-card-item"
              onClick={() => {
                if (onSelectDomain) onSelectDomain(domain.id);
                else if (onNavigateCreators) onNavigateCreators();
              }}
              role="button"
              tabIndex={0}
            >
              <div
                className="domain-icon-box"
                style={{
                  background: `${domain.color}15`,
                  borderColor: `${domain.color}35`,
                }}
              >
                <span className="domain-emoji-icon">{domain.icon}</span>
              </div>
              <div className="domain-info-block">
                <span className="domain-card-name">{domain.name}</span>
                <span className="domain-card-count">{domain.count}</span>
              </div>
              <span className="domain-chevron-icon">›</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
