import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Star,
  ArrowRight,
  ArrowsClockwise,
  WarningCircle,
  VideoCamera,
  Sparkle,
  SlidersHorizontal,
} from '@phosphor-icons/react';
import { creatorsApi } from '../../api/creators';

export default function CreatorShowcase() {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('ALL');

  const fetchCreators = useCallback(() => {
    setLoading(true);
    setError(null);
    creatorsApi
      .list({ limit: 6 })
      .then((data) => {
        setCreators(data || []);
      })
      .catch((err) => {
        console.warn('Could not load creators:', err);
        setError(err.message || 'Unable to connect to creator catalog. Please try again.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchCreators();
  }, [fetchCreators]);

  const categories = [
    { id: 'ALL', label: 'All Disciplines' },
    { id: 'VIDEO', label: 'AI Filmmaking' },
    { id: '3D', label: 'Surreal 3D & CGI' },
    { id: 'FASHION', label: 'Digital Fashion' },
    { id: 'PRODUCT', label: 'Macro & Fluidics' },
  ];

  const filteredCreators = creators.filter((c) => {
    if (activeCategory === 'ALL') return true;

    const spec = (c.primary_specialization || '').toLowerCase();
    const skills = (c.skills || []).map((s) => (s.name || '').toLowerCase()).join(' ');
    const tools = (c.tools || []).map((t) => (t.name || '').toLowerCase()).join(' ');
    const combined = `${spec} ${skills} ${tools}`;

    if (activeCategory === 'VIDEO') {
      return combined.includes('video') || combined.includes('film') || combined.includes('runway') || combined.includes('kling');
    }
    if (activeCategory === '3D') {
      return combined.includes('3d') || combined.includes('cgi') || combined.includes('comfyui') || combined.includes('flux');
    }
    if (activeCategory === 'FASHION') {
      return combined.includes('fashion') || combined.includes('avatar') || combined.includes('apparel');
    }
    if (activeCategory === 'PRODUCT') {
      return combined.includes('fluid') || combined.includes('product') || combined.includes('macro') || combined.includes('cosmetic');
    }
    return true;
  });

  const spotlightCreator = filteredCreators[0];
  const gridCreators = filteredCreators.slice(1, 5);

  const fallbackImages = [
    '/assets/showcase_spatial.jpg',
    '/assets/showcase_fluid.jpg',
    '/assets/hero_cinematic.jpg',
    '/assets/showcase_product_luxury.png',
  ];

  return (
    <section style={{ padding: '100px 0', borderBottom: '1px solid var(--border-subtle)', background: '#080A18' }}>
      <div className="container">
        {/* Section Exhibition Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: '44px',
            flexWrap: 'wrap',
            gap: '24px',
          }}
        >
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'rgba(167, 139, 250, 0.1)',
                  border: '1px solid rgba(167, 139, 250, 0.25)',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-family-mono)',
                  color: '#A78BFA',
                  fontWeight: '600',
                  letterSpacing: '0.04em',
                }}
              >
                <Sparkle weight="fill" size={12} />
                CURATED EXHIBITION
              </span>
            </div>
            <h2
              className="font-serif"
              style={{
                fontSize: 'clamp(2rem, 3.5vw + 0.5rem, 3.25rem)',
                fontWeight: '600',
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
              }}
            >
              Directors and studios shaping new realities.
            </h2>
            <p style={{ fontSize: '1.0625rem', color: 'var(--text-secondary)', maxWidth: '58ch', marginTop: '8px', lineHeight: '1.6' }}>
              Verified ComfyUI pipelines, custom LoRA checkpoints, and inspectable production records.
            </p>
          </div>

          <Link to="/creators" className="btn btn-outline" style={{ fontSize: '0.875rem' }}>
            <span>Explore All Creators</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Category Filters */}
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '14px', marginBottom: '36px' }}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                padding: '9px 20px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.8125rem',
                fontWeight: '600',
                border: activeCategory === cat.id ? '1px solid #A78BFA' : '1px solid var(--border-subtle)',
                background: activeCategory === cat.id ? '#A78BFA' : 'rgba(16, 21, 48, 0.6)',
                color: activeCategory === cat.id ? '#060813' : 'var(--text-secondary)',
                transition: 'all var(--transition-fast)',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="card-editorial"
                style={{
                  height: '280px',
                  background: 'var(--bg-surface)',
                  animation: 'pulse 1.5s infinite ease-in-out',
                }}
              />
            ))}
          </div>
        )}

        {/* Error State with Retry */}
        {!loading && error && (
          <div className="card-editorial" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <WarningCircle size={36} style={{ color: 'var(--accent-coral)', margin: '0 auto 14px' }} />
            <p style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '1.125rem', marginBottom: '8px' }}>
              Exhibition Catalog Connection Issue
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '20px' }}>
              {error}
            </p>
            <button onClick={fetchCreators} className="btn btn-outline" style={{ fontSize: '0.875rem' }}>
              <ArrowsClockwise size={16} />
              <span>Retry Connection</span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredCreators.length === 0 && (
          <div className="card-editorial" style={{ textAlign: 'center', padding: '56px 24px' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '1rem' }}>No creators match this category in the current showcase.</p>
            <button onClick={() => setActiveCategory('ALL')} className="btn btn-outline" style={{ fontSize: '0.875rem' }}>
              Reset Filters
            </button>
          </div>
        )}

        {/* Exhibition Spotlight & Asymmetric Grid Layout */}
        {!loading && !error && filteredCreators.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(12, 1fr)',
              gap: '28px',
              alignItems: 'stretch',
            }}
          >
            {/* Spotlight Feature Exhibition Card (7 Columns on Desktop) */}
            {spotlightCreator && (
              <Link
                to={`/creators/${spotlightCreator.handle || spotlightCreator.id}`}
                className="card-editorial"
                style={{
                  gridColumn: 'span 12',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '32px',
                  textDecoration: 'none',
                  color: 'inherit',
                  background: 'linear-gradient(145deg, #101530 0%, #0a0e23 100%)',
                  borderRadius: '24px',
                  border: '1px solid rgba(167, 139, 250, 0.28)',
                  boxShadow: '0 20px 48px -12px rgba(0, 0, 0, 0.7)',
                }}
              >
                <div>
                  {/* Spotlight Visual Asset */}
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      aspectRatio: '16/9',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      marginBottom: '24px',
                      background: '#060813',
                    }}
                  >
                    <img
                      src="/assets/showcase_fashion_couture.png"
                      alt={spotlightCreator.display_name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center 20%',
                        display: 'block',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '14px',
                        left: '14px',
                        background: 'rgba(6, 8, 19, 0.88)',
                        backdropFilter: 'blur(10px)',
                        color: '#A78BFA',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-pill)',
                        fontSize: '0.6875rem',
                        fontFamily: 'var(--font-family-mono)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        border: '1px solid rgba(167, 139, 250, 0.35)',
                      }}
                    >
                      <VideoCamera size={13} />
                      <span>Featured Studio Exhibition</span>
                    </div>

                    <div
                      style={{
                        position: 'absolute',
                        bottom: '14px',
                        right: '14px',
                        background: 'rgba(6, 8, 19, 0.88)',
                        backdropFilter: 'blur(10px)',
                        color: 'var(--accent-gold)',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-pill)',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        border: '1px solid rgba(230, 198, 135, 0.3)',
                      }}
                    >
                      ${spotlightCreator.min_budget?.toLocaleString() || '2,500'} min brief
                    </div>
                  </div>

                  {/* Creator Info Row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '14px',
                          background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.2) 0%, rgba(16, 21, 48, 1) 100%)',
                          color: '#A78BFA',
                          border: '1px solid rgba(167, 139, 250, 0.35)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '700',
                          fontSize: '1.125rem',
                        }}
                      >
                        {spotlightCreator.display_name?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                          {spotlightCreator.display_name}
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-family-mono)' }}>
                          @{spotlightCreator.handle}
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '5px 12px',
                        borderRadius: 'var(--radius-pill)',
                        background: 'rgba(230, 198, 135, 0.1)',
                        border: '1px solid rgba(230, 198, 135, 0.3)',
                        color: 'var(--accent-gold)',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                      }}
                    >
                      <ShieldCheck weight="fill" size={14} />
                      {spotlightCreator.verification_tier?.replace('_', ' ') || 'VERIFIED PRO'}
                    </span>
                  </div>

                  <div style={{ fontWeight: '600', fontSize: '1rem', color: '#A78BFA', marginBottom: '10px' }}>
                    {spotlightCreator.primary_specialization}
                  </div>

                  <p
                    style={{
                      fontSize: '0.9375rem',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.65',
                      marginBottom: '22px',
                    }}
                  >
                    {spotlightCreator.bio}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '22px' }}>
                    {spotlightCreator.tools?.map((t) => (
                      <span
                        key={t.tool_id || t.name}
                        className="badge badge-neutral"
                        style={{ fontSize: '0.75rem', padding: '5px 12px' }}
                      >
                        {t.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '20px',
                    borderTop: '1px solid var(--border-subtle)',
                    fontSize: '0.9375rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    <Star weight="fill" size={16} style={{ color: 'var(--accent-gold)' }} />
                    <span>{spotlightCreator.average_rating ? Number(spotlightCreator.average_rating).toFixed(1) : '5.0'}</span>
                    <span style={{ color: 'var(--text-tertiary)', fontWeight: '400', fontSize: '0.8125rem' }}>
                      ({spotlightCreator.completed_projects_count || 0} production deliveries)
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#A78BFA', fontWeight: '700' }}>
                    <span>View Exhibition Portfolio</span>
                    <ArrowRight size={15} />
                  </div>
                </div>
              </Link>
            )}

            {/* Supporting Exhibition Cards (Grid of 2 or 4) */}
            {gridCreators.map((creator, idx) => (
              <Link
                key={creator.id}
                to={`/creators/${creator.handle || creator.id}`}
                className="card-editorial"
                style={{
                  gridColumn: 'span 6',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  textDecoration: 'none',
                  color: 'inherit',
                  padding: '26px',
                  borderRadius: '20px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  {/* Thumbnail Banner */}
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '140px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      marginBottom: '18px',
                      background: '#060813',
                    }}
                  >
                    <img
                      src={fallbackImages[idx % fallbackImages.length]}
                      alt={creator.display_name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'rgba(6, 8, 19, 0.85)',
                        backdropFilter: 'blur(6px)',
                        color: 'var(--accent-gold)',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-pill)',
                        fontSize: '0.6875rem',
                        fontWeight: '700',
                      }}
                    >
                      ${creator.min_budget?.toLocaleString()} min
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: 'rgba(167, 139, 250, 0.12)',
                          color: '#A78BFA',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '700',
                          fontSize: '0.9375rem',
                          border: '1px solid rgba(167, 139, 250, 0.25)',
                        }}
                      >
                        {creator.display_name?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '1.0625rem', color: 'var(--text-primary)' }}>
                          {creator.display_name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-family-mono)' }}>
                          @{creator.handle}
                        </div>
                      </div>
                    </div>

                    <span className="badge badge-neutral" style={{ fontSize: '0.6875rem', padding: '3px 8px' }}>
                      {creator.verification_tier === 'TOP_STUDIO' ? 'TOP STUDIO' : 'PRO DIRECTOR'}
                    </span>
                  </div>

                  <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#A78BFA', marginBottom: '8px' }}>
                    {creator.primary_specialization}
                  </div>

                  <p
                    style={{
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.55',
                      marginBottom: '16px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {creator.bio}
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '14px',
                    borderTop: '1px solid var(--border-subtle)',
                    fontSize: '0.8125rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    <Star weight="fill" size={14} style={{ color: 'var(--accent-gold)' }} />
                    <span>{creator.average_rating ? Number(creator.average_rating).toFixed(1) : '5.0'}</span>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                      ({creator.completed_projects_count || 0})
                    </span>
                  </div>

                  <div style={{ color: 'var(--text-primary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Profile</span>
                    <ArrowRight size={13} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

