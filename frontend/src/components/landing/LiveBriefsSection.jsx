import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  ArrowRight,
  PlusCircle,
  WarningCircle,
  ArrowsClockwise,
  Sparkle,
  FilmStrip,
  LockSimple,
} from '@phosphor-icons/react';
import { briefsApi } from '../../api/briefs';

export default function LiveBriefsSection() {
  const [briefs, setBriefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBriefs = useCallback(() => {
    setLoading(true);
    setError(null);
    briefsApi
      .list({ limit: 4 })
      .then((data) => {
        setBriefs(data || []);
      })
      .catch((err) => {
        console.warn('Could not load briefs:', err);
        setError(err.message || 'Unable to connect to live briefs feed. Please try again.');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchBriefs();
  }, [fetchBriefs]);

  const featuredBrief = briefs[0];
  const listBriefs = briefs.slice(1);

  return (
    <section style={{ padding: '100px 0', background: '#060813', borderBottom: '1px solid var(--border-subtle)' }}>
      <div className="container">
        {/* Header */}
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
                  background: 'rgba(230, 198, 135, 0.1)',
                  border: '1px solid rgba(230, 198, 135, 0.25)',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-family-mono)',
                  color: 'var(--accent-gold)',
                  fontWeight: '600',
                  letterSpacing: '0.04em',
                }}
              >
                <Sparkle weight="fill" size={12} />
                CAMPAIGNS IN MOTION
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
              Opportunities seeking extraordinary creators.
            </h2>
            <p style={{ fontSize: '1.0625rem', color: 'var(--text-secondary)', maxWidth: '58ch', marginTop: '8px', lineHeight: '1.6' }}>
              Brands publish generative production briefs with defined commercial rights, budgets, and technical parameters.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link to="/briefs" className="btn btn-outline" style={{ fontSize: '0.875rem' }}>
              <span>View All Briefs</span>
              <ArrowRight size={16} />
            </Link>
            <Link to="/briefs/create" className="btn btn-gold" style={{ fontSize: '0.875rem', fontWeight: '700' }}>
              <PlusCircle size={16} weight="bold" />
              <span>Post a Brief</span>
            </Link>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ background: 'var(--bg-surface)', borderRadius: '24px', padding: '32px', border: '1px solid var(--border-subtle)' }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: '80px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  marginBottom: '16px',
                  animation: 'pulse 1.5s infinite ease-in-out',
                }}
              />
            ))}
          </div>
        )}

        {/* Error State with Retry */}
        {!loading && error && (
          <div className="card-editorial" style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--bg-surface)' }}>
            <WarningCircle size={36} style={{ color: 'var(--accent-coral)', margin: '0 auto 14px' }} />
            <p style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '1.125rem', marginBottom: '8px' }}>
              Campaign Feed Temporarily Unavailable
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '20px' }}>
              {error}
            </p>
            <button onClick={fetchBriefs} className="btn btn-outline" style={{ fontSize: '0.875rem' }}>
              <ArrowsClockwise size={16} />
              <span>Retry Connection</span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && briefs.length === 0 && (
          <div className="card-editorial" style={{ textAlign: 'center', padding: '56px 24px', background: 'var(--bg-surface)' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '18px', fontSize: '1rem' }}>No active briefs right now in this showcase.</p>
            <Link to="/briefs/create" className="btn btn-gold" style={{ fontSize: '0.875rem' }}>
              Create the First Brief
            </Link>
          </div>
        )}

        {/* Varied Cinematic Opportunities Layout */}
        {!loading && !error && briefs.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(12, 1fr)',
              gap: '28px',
              alignItems: 'stretch',
            }}
          >
            {/* Featured Opportunity Spotlight (5 Columns) */}
            {featuredBrief && (
              <Link
                to={`/briefs/${featuredBrief.slug || featuredBrief.id}`}
                className="card-editorial"
                style={{
                  gridColumn: 'span 12',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '30px',
                  borderRadius: '24px',
                  background: 'linear-gradient(145deg, #101530 0%, #0a0e23 100%)',
                  border: '1px solid rgba(230, 198, 135, 0.25)',
                  boxShadow: '0 20px 48px -12px rgba(0, 0, 0, 0.7)',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <div>
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '200px',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      marginBottom: '22px',
                      background: '#060813',
                    }}
                  >
                    <img
                      src="/assets/showcase_product_luxury.png"
                      alt="Featured Campaign Visual"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center 35%',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        background: 'rgba(6, 8, 19, 0.88)',
                        backdropFilter: 'blur(8px)',
                        color: 'var(--accent-gold)',
                        padding: '5px 12px',
                        borderRadius: 'var(--radius-pill)',
                        fontSize: '0.6875rem',
                        fontFamily: 'var(--font-family-mono)',
                        fontWeight: '600',
                        border: '1px solid rgba(230, 198, 135, 0.3)',
                      }}
                    >
                      FEATURED CAMPAIGN BRIEF
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--accent-gold)', textTransform: 'uppercase', fontFamily: 'var(--font-family-mono)' }}>
                      {featuredBrief.brand?.company_name || 'Verified Enterprise Brand'}
                    </span>
                    <span className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>
                      {featuredBrief.content_type}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.375rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '10px', lineHeight: '1.25' }}>
                    {featuredBrief.title}
                  </h3>

                  <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '20px' }}>
                    {featuredBrief.campaign_objective}
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '20px',
                    borderTop: '1px solid var(--border-subtle)',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontFamily: 'var(--font-family-mono)' }}>
                      Verified Budget
                    </div>
                    <div style={{ fontSize: '1.375rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                      ${featuredBrief.budget_amount?.toLocaleString() || '15,000'}{' '}
                      <span style={{ fontSize: '0.8125rem', color: 'var(--accent-gold)', fontWeight: '600' }}>
                        {featuredBrief.budget_currency || 'USD'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#A78BFA', fontWeight: '700', fontSize: '0.9375rem' }}>
                    <span>Inspect Brief Specs</span>
                    <ArrowRight size={16} />
                  </div>
                </div>
              </Link>
            )}

            {/* Campaign Ledger List (Full Width or Staggered) */}
            {listBriefs.length > 0 && (
              <div
                style={{
                  gridColumn: 'span 12',
                  background: 'var(--bg-surface)',
                  borderRadius: '24px',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-md)',
                  overflow: 'hidden',
                }}
              >
                {listBriefs.map((brief, idx) => (
                  <Link
                    key={brief.id}
                    to={`/briefs/${brief.slug || brief.id}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                      gap: '24px',
                      alignItems: 'center',
                      padding: '26px 32px',
                      borderBottom: idx < listBriefs.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'all var(--transition-fast)',
                      background: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(167, 139, 250, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {/* Brand & Title Info */}
                    <div style={{ minWidth: '240px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-gold)', textTransform: 'uppercase', fontFamily: 'var(--font-family-mono)', letterSpacing: '0.04em' }}>
                          {brief.brand?.company_name || 'Verified Brand'}
                        </span>
                        <span className="badge badge-neutral" style={{ fontSize: '0.625rem', padding: '1px 6px' }}>
                          {brief.content_type}
                        </span>
                      </div>
                      <h3
                        style={{
                          fontSize: '1.125rem',
                          fontWeight: '700',
                          color: 'var(--text-primary)',
                          lineHeight: '1.3',
                          marginBottom: '4px',
                        }}
                      >
                        {brief.title}
                      </h3>
                      <p
                        style={{
                          fontSize: '0.8125rem',
                          color: 'var(--text-secondary)',
                          lineHeight: '1.45',
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {brief.campaign_objective}
                      </p>
                    </div>

                    {/* Technical Specifications */}
                    <div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontFamily: 'var(--font-family-mono)', marginBottom: '6px' }}>
                        Format & Pipeline
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-pill)',
                            background: 'rgba(167, 139, 250, 0.12)',
                            color: '#A78BFA',
                            border: '1px solid rgba(167, 139, 250, 0.25)',
                            fontSize: '0.6875rem',
                            fontWeight: '600',
                          }}
                        >
                          {brief.aspect_ratio || '16:9'}
                        </span>
                        {brief.required_tools?.slice(0, 2).map((t) => (
                          <span key={t.tool_id || t.name} className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>
                            {t.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Budget & Timeline Action */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontFamily: 'var(--font-family-mono)' }}>
                          Commission Budget
                        </div>
                        <div style={{ fontWeight: '800', fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                          ${brief.budget_amount?.toLocaleString()}{' '}
                          <span style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--accent-gold)' }}>
                            {brief.budget_currency || 'USD'}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-tertiary)', fontSize: '0.75rem', fontFamily: 'var(--font-family-mono)' }}>
                          <Clock size={14} />
                          <span>
                            {brief.deadline ? new Date(brief.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Flexible'}
                          </span>
                        </div>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.08)',
                            color: 'var(--accent-gold)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid var(--border-subtle)',
                            transition: 'all var(--transition-fast)',
                          }}
                        >
                          <ArrowRight size={15} />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

