import React, { useState, useRef, useEffect } from 'react';

const FEATURED_CREATORS_3D = [
  {
    id: 'elena-rostova',
    name: 'Aanya Sharma',
    role: 'Sci-Fi/VFX Video Director',
    handle: 'aanya_creative',
    avatar: '/assets/creator-portraits/elena.jpg',
    category: 'AI Video',
    categoryColor: '#7C3AED',
    resolution: '4K',
    projectTitle: 'Solaris Anomaly: Luxury Fragrance Commercial',
    thumbnail: '/assets/portfolio/elena_cyber_agent.jpg',
    videoUrl: '/assets/portfolio/solaris_anomaly_master.mp4',
    tags: ['AI Video', 'Cinematic', 'VFX'],
    bio: 'Pioneering generative cinematic video direction and sci-fi aesthetic world-building.',
  },
  {
    id: 'marcus-vance',
    name: 'Arjun Mehta',
    role: 'Product Visualization',
    handle: 'mehta_3d',
    avatar: '/assets/creator-portraits/marcus.jpg',
    category: 'Product Viz',
    categoryColor: '#0D9488',
    resolution: '4K',
    projectTitle: 'Aura Droplet: Photorealistic Serum',
    thumbnail: '/assets/portfolio/marcus_serum_roses.png',
    videoUrl: '/assets/portfolio/marcus_serum_roses.png',
    tags: ['3D Render', 'Product Viz', 'AI Art'],
    bio: 'Photorealistic luxury cosmetics, physical optics rendering, and studio product staging.',
  },
  {
    id: 'kai-tanaka',
    name: 'Kabir Nair',
    role: '2.5D Motion Artist',
    handle: 'kabir_visuals',
    avatar: '/assets/creator-portraits/kai.jpg',
    category: 'Animation',
    categoryColor: '#6366F1',
    resolution: '1080p',
    projectTitle: 'Shin-Tokyo Cyber Blades: 2.5D Anime Teaser',
    thumbnail: '/assets/portfolio/kai_cyberpunk_warrior.jpg',
    videoUrl: '/assets/portfolio/kai_neon_samurai.mp4',
    tags: ['Animation', 'Character', 'Motion'],
    bio: 'Specialist in 2.5D anime kinetic animation, cyber character design, and motion interpolation.',
    isHero: true,
  },
  {
    id: 'sophia-rivera',
    name: 'Sanya Malhotra',
    role: 'AI VFX & Virtual Effects',
    handle: 'sanya_beauty',
    avatar: '/assets/creator-portraits/sophia.jpg',
    category: 'CGI',
    categoryColor: '#0284C7',
    resolution: '4K',
    projectTitle: 'Eternal Echoes Cinematic Short',
    thumbnail: '/assets/portfolio/sophia_glowing_wolf.jpg',
    videoUrl: '/assets/portfolio/sophia_cellular_dew.mp4',
    tags: ['VFX', 'CGI', 'Concept Art'],
    bio: 'Hyper-detailed CGI wildlife, atmospheric environmental effects, and real-time virtual production.',
  },
  {
    id: 'ava-chen',
    name: 'Charvi Reddy',
    role: 'Illustration & Concept Art',
    handle: 'charvi_vfx',
    avatar: '/assets/creator-portraits/chloe.jpg',
    category: 'Illustration',
    categoryColor: '#D946EF',
    resolution: '4K',
    projectTitle: 'Celestial Realms Concept Series',
    thumbnail: '/assets/portfolio/ava_celestial_city.jpg',
    videoUrl: '/assets/portfolio/ava_celestial_city.jpg',
    tags: ['Illustration', 'Concept Art', 'AI Art'],
    bio: 'Grand celestial architecture, surreal dreamscapes, and visionary fantasy world-building.',
  },
];

export default function VerifiedCreatorsSection({ onSelectCreator, onSelectProject, onNavigateCreators }) {
  const [activeHeroIndex, setActiveHeroIndex] = useState(2); // Kai Tanaka is initial center
  const [hoveredId, setHoveredId] = useState(null);
  const [cardTilt, setCardTilt] = useState({ id: null, rotateX: 0, rotateY: 0, x: 50, y: 50 });
  const [favorites, setFavorites] = useState({});
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  // Staggered reveal observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const toggleFavorite = (e, id) => {
    e.stopPropagation();
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePrev = () => {
    setActiveHeroIndex((prev) => (prev > 0 ? prev - 1 : FEATURED_CREATORS_3D.length - 1));
  };

  const handleNext = () => {
    setActiveHeroIndex((prev) => (prev < FEATURED_CREATORS_3D.length - 1 ? prev + 1 : 0));
  };

  // Safe handlers for project & creator modal triggers
  const handlePlayProject = (creator) => {
    if (onSelectProject) {
      onSelectProject({
        id: `proj-${creator.id}`,
        title: creator.projectTitle,
        creator_name: creator.name,
        creator_handle: creator.handle,
        creator_avatar: creator.avatar,
        thumbnail_url: creator.thumbnail,
        primary_asset_url: creator.videoUrl || creator.thumbnail,
        content_type: creator.category === 'Animation' ? 'ANIMATION' : creator.category === 'AI Video' ? 'VIDEO' : creator.category,
        resolution: creator.resolution,
        specialization: creator.role,
        description: `${creator.projectTitle} by ${creator.name}. Verified production asset.`,
      });
    }
  };

  const handleOpenProfile = (creator) => {
    if (onSelectCreator) {
      onSelectCreator({
        id: creator.id,
        name: creator.name,
        role: creator.role,
        handle: creator.handle,
        avatar: creator.avatar,
        bio: creator.bio,
        skills: creator.tags,
      });
    }
  };

  // Interactive 3D pointer tilt handler
  const handleMouseMove = (e, id) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const percentX = (x / rect.width) * 100;
    const percentY = (y / rect.height) * 100;
    const rotateX = -((y - rect.height / 2) / (rect.height / 2)) * 10;
    const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 10;

    setCardTilt({ id, rotateX, rotateY, x: percentX, y: percentY });
  };

  const handleMouseLeave = () => {
    setHoveredId(null);
    setCardTilt({ id: null, rotateX: 0, rotateY: 0, x: 50, y: 50 });
  };

  return (
    <section
      ref={sectionRef}
      className={`verified-creators-cosmic-section relative overflow-hidden ${isVisible ? 'is-in-view' : ''}`}
      id="verified-creators"
    >
      {/* Target 3D Ribbon Background Image & Atmospheric Glows */}
      <div className="creators-ribbon-bg" aria-hidden="true">
        {/* Soft header shield to ensure 100% crisp text readability */}
        <div className="creators-header-glow-shield" />

        <img
          src="/assets/verified_creators_bg.png"
          alt=""
          className="creators-custom-bg-img"
        />

        {/* Soft atmospheric center glow and floor caustic bloom */}
        <div className="creators-center-bloom" />
        <div className="creators-floor-glow" />
        <div className="creators-center-caustic-beam" />
      </div>

      <div className="container relative z-10">
        {/* Section Header */}
        <div className="creators-section-header">
          <div>
            <div className="creators-badge-pill">
              <span className="badge-sparkle">✦</span>
              VERIFIED CREATORS
            </div>
            <h2 className="creators-section-headline">
              Extraordinary creators.<br />
              <span className="serif-italic-accent">Real impact.</span>
            </h2>
            <p className="creators-section-sub">
              Explore featured creators from our verified community — AI films, product visuals, animations, and more.
            </p>
          </div>

          <div className="creators-header-actions">
            <button
              type="button"
              className="view-all-creators-btn"
              onClick={onNavigateCreators}
            >
              View All Creators <span className="arrow-inline">→</span>
            </button>
            <div className="creators-nav-arrows">
              <button
                type="button"
                className="nav-arrow-circle prev-arrow"
                onClick={handlePrev}
                aria-label="Previous creator"
              >
                ‹
              </button>
              <button
                type="button"
                className="nav-arrow-circle next-arrow"
                onClick={handleNext}
                aria-label="Next creator"
              >
                ›
              </button>
            </div>
          </div>
        </div>

        {/* 3D Arc Perspective Row of Overlapping Cards */}
        <div className="creators-3d-cards-track">
          {FEATURED_CREATORS_3D.map((creator, index) => {
            const isHovered = hoveredId === creator.id;
            const isCenterHero = index === activeHeroIndex;
            const offsetFromCenter = index - activeHeroIndex;
            const absOffset = Math.abs(offsetFromCenter);

            // Progressive 3D perspective arc values matching Image 1
            let baseScale = 0.92;
            let baseTranslateY = 12;
            let baseTranslateZ = 12;
            let baseRotateY = 0;
            let baseRotateZ = 0;

            if (absOffset === 0) {
              // Center Hero Card (Kai Tanaka): noticeably larger, elevated higher, closest to viewer
              baseScale = 1.14;
              baseTranslateY = -34;
              baseTranslateZ = 55;
              baseRotateY = 0;
              baseRotateZ = 0;
            } else if (absOffset === 1) {
              // Immediate neighbor cards (Marcus Vance & Sophia Rivera)
              baseScale = 0.99;
              baseTranslateY = -2;
              baseTranslateZ = 28;
              baseRotateY = offsetFromCenter < 0 ? 8.5 : -8.5;
              baseRotateZ = offsetFromCenter < 0 ? -0.8 : 0.8;
            } else {
              // Outer cards (Elena Rostova & Ava Chen)
              baseScale = 0.92;
              baseTranslateY = 12;
              baseTranslateZ = 12;
              baseRotateY = offsetFromCenter < 0 ? 14 : -14;
              baseRotateZ = offsetFromCenter < 0 ? -1.6 : 1.6;
            }

            // Interactive pointer tilt override when hovered
            let finalTransform = '';
            if (isHovered && cardTilt.id === creator.id) {
              finalTransform = `translateY(${baseTranslateY - 14}px) translateZ(${baseTranslateZ + 38}px) scale(${baseScale * 1.03}) rotateX(${cardTilt.rotateX}deg) rotateY(${cardTilt.rotateY + baseRotateY}deg)`;
            } else {
              finalTransform = `translateY(${baseTranslateY}px) translateZ(${baseTranslateZ}px) scale(${baseScale}) rotateY(${baseRotateY}deg) rotateZ(${baseRotateZ}deg)`;
            }

            // Stacking order: hovered is highest (50), center hero is 25, inner pair is 18, outer pair is 10
            const cardZIndex = isHovered ? 50 : (absOffset === 0 ? 25 : (absOffset === 1 ? 18 : 10));

            return (
              <div
                key={creator.id}
                className={`creator-card-3d-wrap ${isCenterHero ? 'is-hero-card' : ''} ${isHovered ? 'is-hovered' : ''}`}
                style={{
                  '--card-index': index,
                  transform: finalTransform,
                  zIndex: cardZIndex,
                }}
                onMouseEnter={() => setHoveredId(creator.id)}
                onMouseMove={(e) => handleMouseMove(e, creator.id)}
                onMouseLeave={handleMouseLeave}
                onClick={() => {
                  setActiveHeroIndex(index);
                }}
              >
                <div className="creator-card-3d-surface">
                  {/* Dynamic glossy specular highlight follows pointer */}
                  {isHovered && cardTilt.id === creator.id && (
                    <div
                      className="card-specular-gloss"
                      style={{
                        background: `radial-gradient(circle at ${cardTilt.x}% ${cardTilt.y}%, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0) 65%)`,
                      }}
                      aria-hidden="true"
                    />
                  )}

                  {/* Card Cover Media Box: clicking opens this creator's portfolio modal */}
                  <div
                    className="creator-card-media-box"
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayProject(creator);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handlePlayProject(creator);
                      }
                    }}
                    aria-label={`Open ${creator.projectTitle} preview`}
                  >
                    <img
                      src={creator.thumbnail}
                      alt={creator.projectTitle}
                      className="creator-card-cover-img"
                    />

                    {/* Top Badges: Category Pill, Resolution Pill, Heart */}
                    <div className="card-top-badges-row">
                      <div className="flex gap-1.5 items-center">
                        <span
                          className="card-cat-badge"
                          style={{ backgroundColor: creator.categoryColor }}
                        >
                          {creator.category}
                        </span>
                        <span className="card-res-badge">{creator.resolution}</span>
                      </div>
                      <button
                        type="button"
                        className={`card-heart-btn ${favorites[creator.id] ? 'active' : ''}`}
                        onClick={(e) => toggleFavorite(e, creator.id)}
                        aria-label="Save creator to favorites"
                      >
                        {favorites[creator.id] ? '♥' : '♡'}
                      </button>
                    </div>

                    {/* Centered Circular Violet Play Button matching reference image */}
                    <button
                      type="button"
                      className="card-play-button-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayProject(creator);
                      }}
                      aria-label={`Play ${creator.projectTitle} preview`}
                    >
                      <div className="play-circle-icon-vivid" title="Play artwork preview">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </button>
                  </div>

                  {/* Card Body Information */}
                  <div className="creator-card-bottom-info">
                    {/* Creator Identity: Clickable button opening creator's profile */}
                    <button
                      type="button"
                      className="creator-identity-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenProfile(creator);
                      }}
                      aria-label={`View ${creator.name}'s profile`}
                    >
                      <div className="creator-avatar-wrap">
                        <img
                          src={creator.avatar}
                          alt={creator.name}
                          className="creator-avatar-img"
                        />
                      </div>
                      <div className="creator-name-block">
                        <div className="creator-name-with-badge">
                          <span className="creator-card-name">{creator.name}</span>
                          <span className="creator-verified-badge" title="Verified Creator">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="#3B82F6">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                            </svg>
                          </span>
                        </div>
                        <span className="creator-card-role">{creator.role}</span>
                      </div>
                    </button>

                    {/* Project Title: Clickable to open portfolio project */}
                    <h4
                      className="creator-project-title clickable-title"
                      title={creator.projectTitle}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayProject(creator);
                      }}
                    >
                      {creator.projectTitle}
                    </h4>

                    {/* Pill Tags */}
                    <div className="creator-card-tags-row">
                      {creator.tags.map((tag) => (
                        <span key={tag} className="creator-card-pill-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
