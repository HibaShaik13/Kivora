import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Clock,
  ArrowRight,
  Sparkle,
  PlusCircle,
  WarningCircle,
  ArrowsClockwise,
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
      .list({ limit: 3 })
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

  return (
    <section style={{ padding: '80px 0', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
      <div className="container">
        {/* Header */}
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
              <span className="badge badge-coral">
                <Sparkle weight="fill" size={13} />
                Live Campaigns
              </span>
            </div>
            <h2 style={{ fontSize: 'clamp(1.75rem, 2.5vw + 0.5rem, 2.375rem)', letterSpacing: '-0.03em' }}>
              Active campaign briefs accepting pitches.
            </h2>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: '54ch', marginTop: '6px' }}>
              Brands publish production-ready briefs with defined commercial rights, budgets, and technical generative parameters.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/briefs" className="btn btn-outline" style={{ background: 'var(--bg-surface)', fontSize: '0.875rem' }}>
              <span>View All Briefs</span>
              <ArrowRight size={16} />
            </Link>
            <Link to="/briefs/create" className="btn btn-primary" style={{ fontSize: '0.875rem' }}>
              <PlusCircle size={16} />
              <span>Post a Brief</span>
            </Link>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="card-editorial"
                style={{
                  height: '220px',
                  background: 'var(--bg-surface)',
                  animation: 'pulse 1.5s infinite ease-in-out',
                }}
              />
            ))}
          </div>
        )}

        {/* Error State with Retry */}
        {!loading && error && (
          <div className="card-editorial" style={{ textAlign: 'center', padding: '40px 24px', background: 'var(--bg-surface)' }}>
            <WarningCircle size={32} style={{ color: 'var(--accent-coral)', margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text-primary)', fontWeight: '600', marginBottom: '6px' }}>
              Campaign feed temporarily unavailable
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '18px' }}>
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
          <div className="card-editorial" style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--bg-surface)' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>No active briefs right now.</p>
            <Link to="/briefs/create" className="btn btn-primary" style={{ fontSize: '0.875rem' }}>
              Create the First Brief
            </Link>
          </div>
        )}

        {/* Brief Cards Grid */}
        {!loading && !error && briefs.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {briefs.map((brief) => (
              <Link
                key={brief.id}
                to={`/briefs/${brief.slug || brief.id}`}
                className="card-editorial"
                style={{
                  background: 'var(--bg-surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <div>
                  {/* Brand & Content Type Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                      {brief.brand?.company_name || 'Verified Brand'}
                    </span>
                    <span className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>
                      {brief.content_type} • {brief.aspect_ratio}
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    style={{
                      fontSize: '1.125rem',
                      fontWeight: '700',
                      lineHeight: '1.3',
                      marginBottom: '10px',
                      color: 'var(--text-primary)',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {brief.title}
                  </h3>

                  {/* Objective summary */}
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
                    {brief.campaign_objective}
                  </p>

                  {/* Required Tools Chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                    {brief.required_tools?.slice(0, 3).map((t) => (
                      <span key={t.tool_id} className="badge badge-neutral" style={{ fontSize: '0.625rem' }}>
                        {t.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer specs */}
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
                  <div style={{ fontWeight: '800', fontSize: '1.125rem', color: 'var(--text-primary)' }}>
                    ${brief.budget_amount?.toLocaleString()}{' '}
                    <span style={{ fontSize: '0.6875rem', fontWeight: '500', color: 'var(--text-tertiary)' }}>
                      {brief.budget_currency || 'USD'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                    <Clock size={14} />
                    <span>
                      {brief.deadline ? new Date(brief.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Flexible'}
                    </span>
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
