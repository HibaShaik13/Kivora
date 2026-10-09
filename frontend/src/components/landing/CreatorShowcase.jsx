import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Star,
  ArrowRight,
  Sparkle,
  ArrowsClockwise,
  WarningCircle,
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

  return (
    <section style={{ padding: '80px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <div className="container">
        {/* Section Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: '36px',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="badge badge-verified">
                <Sparkle weight="fill" size={13} />
                Verified Talent Pool
              </span>
            </div>
            <h2 style={{ fontSize: 'clamp(1.75rem, 2.5vw + 0.5rem, 2.375rem)', letterSpacing: '-0.03em' }}>
              Top generative studios and directors.
            </h2>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: '54ch', marginTop: '6px' }}>
              Every creator profile includes verifiable ComfyUI pipelines, LoRA checkpoints, and high-fidelity render history.
            </p>
          </div>

          <Link to="/creators" className="btn btn-outline" style={{ fontSize: '0.875rem' }}>
            <span>Explore All Creators</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Category Filters */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '16px', marginBottom: '28px' }}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.8125rem',
                fontWeight: '600',
                border: activeCategory === cat.id ? '1px solid var(--text-primary)' : '1px solid var(--border-medium)',
                background: activeCategory === cat.id ? 'var(--text-primary)' : 'var(--bg-surface)',
                color: activeCategory === cat.id ? 'var(--text-on-dark)' : 'var(--text-secondary)',
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
                  height: '240px',
                  background: 'var(--bg-surface-subtle)',
                  animation: 'pulse 1.5s infinite ease-in-out',
                }}
              />
            ))}
          </div>
        )}

        {/* Error State with Retry */}
        {!loading && error && (
          <div className="card-editorial" style={{ textAlign: 'center', padding: '40px 24px' }}>
            <WarningCircle size={32} style={{ color: 'var(--accent-coral)', margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text-primary)', fontWeight: '600', marginBottom: '6px' }}>
              Catalog connection issue
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '18px' }}>
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
          <div className="card-editorial" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>No creators match this category yet.</p>
            <button onClick={() => setActiveCategory('ALL')} className="btn btn-outline" style={{ fontSize: '0.875rem' }}>
              Reset Filters
            </button>
          </div>
        )}

        {/* Creators Grid */}
        {!loading && !error && filteredCreators.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {filteredCreators.map((creator) => (
              <Link
                key={creator.id}
                to={`/creators/${creator.handle || creator.id}`}
                className="card-editorial"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <div>
                  {/* Top Row: Avatar + Handle + Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #1A1715 0%, #3D3835 100%)',
                          color: '#FAF8F5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '700',
                          fontSize: '1rem',
                        }}
                      >
                        {creator.display_name?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)' }}>
                          {creator.display_name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-family-mono)' }}>
                          @{creator.handle}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`badge ${
                        creator.verification_tier === 'TOP_STUDIO'
                          ? 'badge-verified'
                          : creator.verification_tier === 'VERIFIED_PRO'
                          ? 'badge-success'
                          : 'badge-neutral'
                      }`}
                      style={{ fontSize: '0.625rem' }}
                    >
                      <ShieldCheck weight="fill" size={12} />
                      {creator.verification_tier?.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Specialization & Bio */}
                  <div style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--accent-lavender)', marginBottom: '6px' }}>
                    {creator.primary_specialization}
                  </div>
                  <p
                    style={{
                      fontSize: '0.8125rem',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.5',
                      marginBottom: '16px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {creator.bio}
                  </p>

                  {/* Tool Chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
                    {creator.tools?.slice(0, 3).map((t) => (
                      <span
                        key={t.tool_id}
                        className="badge badge-neutral"
                        style={{ fontSize: '0.6875rem', padding: '3px 8px' }}
                      >
                        {t.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer Metrics */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-subtle)',
                    fontSize: '0.8125rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    <Star weight="fill" size={14} style={{ color: '#EAB308' }} />
                    <span>{creator.average_rating ? Number(creator.average_rating).toFixed(1) : '5.0'}</span>
                    <span style={{ color: 'var(--text-tertiary)', fontWeight: '400', fontSize: '0.75rem' }}>
                      ({creator.completed_projects_count || 0} projects)
                    </span>
                  </div>

                  <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                    ${creator.min_budget?.toLocaleString()}{' '}
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', fontWeight: '400' }}>min</span>
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
