import React, { useRef, useEffect } from 'react';

const FEATURED_BRANDS_3D = [
  {
    id: 'brew-bean',
    name: 'Brew & Bean',
    category: 'Food & Beverage',
    campaigns: '5 campaigns',
    coverImage: '/assets/campaign-covers/brand_beverage_cover.jpg',
    initial: 'B',
    color: '#92400E',
    bgColor: '#FEF3C7',
    borderColor: '#FDE68A',
    iconType: 'coffee',
  },
  {
    id: 'drivex',
    name: 'DriveX',
    category: 'Automotive',
    campaigns: '7 campaigns',
    coverImage: '/assets/campaign-covers/brand_automotive_cover.jpg',
    initial: 'D',
    color: '#2563EB',
    bgColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    iconType: 'drive',
  },
  {
    id: 'luminae',
    name: 'Luminae',
    category: 'Beauty & Skincare',
    campaigns: '12 campaigns',
    coverImage: '/assets/campaign-covers/brand_skincare_cover.jpg',
    initial: 'L',
    color: '#DB2777',
    bgColor: '#FDF2F8',
    borderColor: '#FBCFE8',
    isHero: true,
    iconType: 'lotus',
  },
  {
    id: 'neotech',
    name: 'NeoTech',
    category: 'Technology & Gadgets',
    campaigns: '8 campaigns',
    coverImage: '/assets/campaign-covers/brand_technology_cover.jpg',
    initial: 'N',
    color: '#4F46E5',
    bgColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    iconType: 'hexagon',
  },
  {
    id: 'aurora-studios',
    name: 'Aurora Studios',
    category: 'Media & Entertainment',
    campaigns: '10 campaigns',
    coverImage: '/assets/campaign-covers/brand_gaming_cover.jpg',
    initial: 'A',
    color: '#7C3AED',
    bgColor: '#F3E8FF',
    borderColor: '#DDD6FE',
    iconType: 'letter-a',
  },
  {
    id: 'velora',
    name: 'Velora',
    category: 'Fashion & Apparel',
    campaigns: '8 campaigns',
    coverImage: '/assets/campaign-covers/brand_fashion_cover.jpg',
    initial: 'V',
    color: '#1F2937',
    bgColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    iconType: 'letter-v',
  },
];

export default function FeaturedBrandsConveyor({ onExploreBriefs }) {
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const isHoveredRef = useRef(false);
  const animFrameIdRef = useRef(null);
  const singleLoopWidthRef = useRef(0);

  // 6 identical sets to ensure infinite buffer on both left and right
  const brandsConveyorList = [
    ...FEATURED_BRANDS_3D,
    ...FEATURED_BRANDS_3D,
    ...FEATURED_BRANDS_3D,
    ...FEATURED_BRANDS_3D,
    ...FEATURED_BRANDS_3D,
    ...FEATURED_BRANDS_3D,
  ];

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) return;

    const measureAndInit = () => {
      if (!track || !viewport) return;
      const totalWidth = track.scrollWidth;
      if (totalWidth > 0) {
        // Exactly 1 set of 6 cards
        const singleSetWidth = totalWidth / 6;
        singleLoopWidthRef.current = singleSetWidth;

        // Position in the middle set (Set 2) if near the start
        if (viewport.scrollLeft < singleSetWidth * 0.5) {
          viewport.scrollLeft = singleSetWidth * 2;
        }
      }
    };

    measureAndInit();
    const timer = setTimeout(measureAndInit, 250);
    window.addEventListener('resize', measureAndInit);

    // Continuous smooth conveyor speed (0.85px per frame = ~50px/sec at 60fps)
    const speed = 0.85;

    const step = () => {
      if (!isHoveredRef.current && viewport && singleLoopWidthRef.current > 0) {
        viewport.scrollLeft += speed;

        const singleWidth = singleLoopWidthRef.current;
        // Seamlessly cycle within the buffer zone: never reach track bounds
        if (viewport.scrollLeft >= singleWidth * 3) {
          viewport.scrollLeft -= singleWidth;
        } else if (viewport.scrollLeft < singleWidth) {
          viewport.scrollLeft += singleWidth;
        }
      }
      animFrameIdRef.current = requestAnimationFrame(step);
    };

    animFrameIdRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      clearTimeout(timer);
      window.removeEventListener('resize', measureAndInit);
    };
  }, []);

  const handlePrev = () => {
    if (viewportRef.current) {
      viewportRef.current.scrollBy({ left: -280, behavior: 'smooth' });
    }
  };

  const handleNext = () => {
    if (viewportRef.current) {
      viewportRef.current.scrollBy({ left: 280, behavior: 'smooth' });
    }
  };

  return (
    <section
      className="featured-brands-3d-section relative overflow-hidden"
      id="featured-brands"
    >
      {/* 3D Cosmic Ribbon Background Artwork & Atmospheric Lighting */}
      <div className="brands-ribbon-bg" aria-hidden="true">
        {/* Soft header glow shield ensuring 100% crisp text readability */}
        <div className="brands-header-glow-shield" />

        <img
          src="/assets/featured_brands_bg.png"
          alt=""
          className="brands-custom-bg-img"
        />

        {/* Soft center ambient bloom and floor caustic sparkle beam */}
        <div className="brands-center-bloom" />
        <div className="brands-floor-glow" />
        <div className="brands-center-caustic-beam" />
      </div>

      <div className="container relative z-10">
        {/* Section Header */}
        <div className="brands-section-header">
          <div>
            <div className="brands-badge-pill">
              <span className="badge-sparkle">✦</span>
              FEATURED BRANDS & CREATIVE PARTNERS
            </div>
            <h2 className="brands-section-headline">
              Innovative brands.<br />
              <span className="serif-italic-accent">Bold opportunities.</span>
            </h2>
            <p className="brands-section-sub">
              Discover forward-thinking brands launching creative campaigns on Kivora.
            </p>
          </div>

          <div className="brands-header-actions">
            <button
              type="button"
              className="brands-view-all-btn"
              onClick={onExploreBriefs}
            >
              View All Brands <span className="arrow-inline">→</span>
            </button>
            <div className="brands-nav-arrows">
              <button
                type="button"
                className="nav-arrow-circle prev-arrow"
                onClick={handlePrev}
                aria-label="Previous brands"
              >
                ‹
              </button>
              <button
                type="button"
                className="nav-arrow-circle next-arrow"
                onClick={handleNext}
                aria-label="Next brands"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Smooth Continuous Conveyor Belt Track */}
      <div
        className="brands-conveyor-viewport"
        ref={viewportRef}
        onMouseEnter={() => {
          isHoveredRef.current = true;
        }}
        onMouseLeave={() => {
          isHoveredRef.current = false;
        }}
      >
        <div className="brands-conveyor-track" ref={trackRef}>
          {brandsConveyorList.map((brand, index) => (
            <div
              key={`${brand.id}-${index}`}
              className={`brand-card-conveyor-item ${brand.isHero ? 'is-hero-card' : ''}`}
              onClick={onExploreBriefs}
              role="button"
              tabIndex={0}
            >
              {/* Brand Cover Media Box */}
              <div className="brand-card-media-box">
                <img
                  src={brand.coverImage}
                  alt={brand.name}
                  className="brand-card-cover-img"
                  loading="lazy"
                />

                {/* Top Campaign Badge */}
                <div className="brand-top-badge">
                  <span>{brand.campaigns}</span>
                </div>
              </div>

              {/* Brand Lower Info Bar */}
              <div className="brand-card-bottom-info">
                {/* Brand Logo Container */}
                <div
                  className="brand-logo-container"
                  style={{
                    backgroundColor: brand.bgColor,
                    borderColor: brand.borderColor,
                  }}
                >
                  {brand.iconType === 'coffee' && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={brand.color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                      <line x1="6" y1="1" x2="6" y2="4" />
                      <line x1="10" y1="1" x2="10" y2="4" />
                      <line x1="14" y1="1" x2="14" y2="4" />
                    </svg>
                  )}
                  {brand.iconType === 'drive' && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={brand.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 4h6a8 8 0 0 1 8 8 8 8 0 0 1-8 8H5z" />
                      <path d="M10 9l3 3-3 3" />
                    </svg>
                  )}
                  {brand.iconType === 'lotus' && (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={brand.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 4c-2 4-5 6-7 9 3 1 5 1 7-2 2 3 4 3 7 2-2-3-5-5-7-9z" />
                      <path d="M7 15c2 2 5 2 5 2s3 0 5-2" />
                      <path d="M12 17v3" />
                    </svg>
                  )}
                  {brand.iconType === 'hexagon' && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={brand.color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
                      <polyline points="2 8.5 12 14.5 22 8.5" />
                      <polyline points="12 14.5 12 22" />
                    </svg>
                  )}
                  {brand.iconType === 'letter-a' && (
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: brand.color, fontFamily: 'system-ui, sans-serif', lineHeight: 1 }}>
                      A
                    </span>
                  )}
                  {brand.iconType === 'letter-v' && (
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: brand.color, fontFamily: 'system-ui, sans-serif', lineHeight: 1 }}>
                      V
                    </span>
                  )}
                </div>

                {/* Brand Name & Details */}
                <div className="brand-card-text-block">
                  <h4 className="brand-card-name">{brand.name}</h4>
                  <span className="brand-card-category">{brand.category}</span>
                  <span className="brand-card-campaign-link">{brand.campaigns}</span>
                </div>

                {/* Action Arrow Button */}
                <button
                  type="button"
                  className="brand-card-arrow-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onExploreBriefs) onExploreBriefs();
                  }}
                  aria-label={`Explore ${brand.name} briefs`}
                >
                  <span>→</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
