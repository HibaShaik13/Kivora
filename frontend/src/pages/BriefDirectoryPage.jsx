import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  MagnifyingGlass,
  Sparkle,
  CalendarBlank,
  CurrencyDollar,
  CheckCircle,
  Funnel,
  ArrowRight
} from '@phosphor-icons/react';
import { briefsApi } from '../api/briefs';
import { useAuth } from '../context/AuthContext';
import CreatorApplyModal from '../components/dashboard/CreatorApplyModal';
import { creatorsApi } from '../api/creators';

export default function BriefDirectoryPage() {
  const { isAuthenticated, isCreator, isBrand } = useAuth();
  const [briefs, setBriefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [contentType, setContentType] = useState('');
  const [aspectRatio, setAspectRatio] = useState('');
  const [minBudget, setMinBudget] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Creator profile for attaching work
  const [creatorProfile, setCreatorProfile] = useState(null);
  const [selectedBriefToApply, setSelectedBriefToApply] = useState(null);

  const fetchBriefs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        status: 'PUBLISHED',
        sort_by: sortBy,
      };
      if (search.trim()) params.search = search.trim();
      if (contentType) params.content_type = contentType;
      if (aspectRatio) params.aspect_ratio = aspectRatio;
      if (minBudget) params.min_budget = parseFloat(minBudget);

      const data = await briefsApi.list(params);
      setBriefs(data || []);
    } catch (err) {
      console.error('Failed to load briefs directory:', err);
      setError(err.message || 'Failed to load campaign briefs.');
    } finally {
      setLoading(false);
    }
  }, [search, contentType, aspectRatio, minBudget, sortBy]);

  useEffect(() => {
    fetchBriefs();
  }, [fetchBriefs]);

  useEffect(() => {
    if (isAuthenticated && isCreator) {
      creatorsApi.getMyProfile()
        .then(data => setCreatorProfile(data))
        .catch(() => setCreatorProfile(null));
    }
  }, [isAuthenticated, isCreator]);

  return (
    <div className="page-wrapper" style={{ padding: '40px 0 80px', backgroundColor: 'var(--bg-main)' }}>
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', marginBottom: '32px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-coral" style={{ fontSize: '0.6875rem' }}>COMMERCIAL CAMPAIGNS</span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>Live Brand Briefs</span>
            </div>
            <h1 style={{ margin: 0, fontSize: '2.25rem', fontFamily: 'var(--font-family-display)', fontWeight: 800 }}>
              Explore Campaign Briefs
            </h1>
            <p style={{ margin: '6px 0 0 0', color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '640px' }}>
              Discover commercial creative briefs published by forward-thinking brands and agencies. Pitch your generative workflows and earn commissions.
            </p>
          </div>

          {isBrand && (
            <Link to="/briefs/create" className="btn btn-primary" style={{ padding: '10px 20px' }}>
              <span>+ Create Campaign Brief</span>
            </Link>
          )}
        </div>

        {/* Filter Toolbar */}
        <div
          className="card"
          style={{
            padding: '20px',
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid var(--border-subtle)',
            marginBottom: '32px',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <MagnifyingGlass
                size={18}
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}
              />
              <input
                type="text"
                className="input"
                style={{ paddingLeft: '38px' }}
                placeholder="Search brief title, objective..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Content Type */}
            <div>
              <select
                className="input"
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
              >
                <option value="">All Content Types</option>
                <option value="VIDEO">Video Production</option>
                <option value="IMAGE">Visual Imagery</option>
                <option value="3D_MODEL">3D & Spatial</option>
                <option value="AUDIO">Audio & Voice Synthesis</option>
              </select>
            </div>

            {/* Aspect Ratio */}
            <div>
              <select
                className="input"
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
              >
                <option value="">All Aspect Ratios</option>
                <option value="16:9">16:9 Landscape</option>
                <option value="9:16">9:16 Vertical</option>
                <option value="1:1">1:1 Square</option>
                <option value="2.39:1">2.39:1 Anamorphic</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <select
                className="input"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="budget_desc">Highest Budget</option>
                <option value="budget_asc">Lowest Budget</option>
                <option value="deadline_asc">Closing Soonest</option>
              </select>
            </div>
          </div>
        </div>

        {/* Briefs Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Loading published briefs...</p>
          </div>
        ) : error ? (
          <div
            style={{
              padding: '24px',
              backgroundColor: 'var(--accent-coral-subtle)',
              borderRadius: '12px',
              color: 'var(--accent-coral)',
              border: '1px solid var(--accent-coral-border)',
            }}
          >
            {error}
          </div>
        ) : briefs.length === 0 ? (
          <div className="card" style={{ padding: '60px', textAlign: 'center', backgroundColor: '#FFF', borderRadius: '16px' }}>
            <FileText size={48} style={{ color: 'var(--text-tertiary)', margin: '0 auto 16px' }} />
            <h3 style={{ margin: '0 0 8px 0', fontFamily: 'var(--font-family-display)' }}>
              No Briefs Match Criteria
            </h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
              Try clearing filters or search terms to see all available campaign opportunities.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
            {briefs.map((brief) => (
              <div
                key={brief.id}
                className="card"
                style={{
                  padding: '28px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all var(--transition-normal)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span className="badge badge-coral" style={{ fontSize: '0.6875rem' }}>
                        {brief.content_type || 'VIDEO'}
                      </span>
                      <span className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>
                        {brief.aspect_ratio}
                      </span>
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      ${brief.budget_amount?.toLocaleString()} {brief.budget_currency}
                    </div>
                  </div>

                  <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-family-display)' }}>
                    <Link to={`/briefs/${brief.slug || brief.id}`} style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
                      {brief.title}
                    </Link>
                  </h3>

                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginBottom: '12px' }}>
                    By {brief.brand?.company_name || 'Verified Brand'} • Deadline: {new Date(brief.deadline).toLocaleDateString()}
                  </div>

                  <p
                    style={{
                      margin: '0 0 16px 0',
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {brief.campaign_objective}
                  </p>

                  {/* Skills / Tools */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
                    {brief.required_skills?.map((sk) => (
                      <span key={sk.skill_id} className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>
                        {sk.name}
                      </span>
                    ))}
                    {brief.required_tools?.map((tl) => (
                      <span key={tl.tool_id} className="badge badge-verified" style={{ fontSize: '0.6875rem' }}>
                        {tl.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Actions */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '16px',
                  }}
                >
                  <Link
                    to={`/briefs/${brief.slug || brief.id}`}
                    className="btn btn-ghost"
                    style={{ fontSize: '0.8125rem' }}
                  >
                    <span>Inspect Brief</span>
                    <ArrowRight size={12} />
                  </Link>

                  {isCreator ? (
                    <button
                      onClick={() => setSelectedBriefToApply(brief)}
                      className="btn btn-primary"
                      style={{ fontSize: '0.8125rem', padding: '6px 14px' }}
                    >
                      Apply & Pitch
                    </button>
                  ) : !isAuthenticated ? (
                    <Link
                      to={`/login?redirect=/briefs/${brief.slug || brief.id}`}
                      className="btn btn-outline"
                      style={{ fontSize: '0.8125rem', padding: '6px 12px' }}
                    >
                      Sign In to Apply
                    </Link>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Creator Apply Modal */}
      <CreatorApplyModal
        isOpen={Boolean(selectedBriefToApply)}
        brief={selectedBriefToApply}
        creatorProjects={creatorProfile?.portfolio_projects || []}
        onClose={() => setSelectedBriefToApply(null)}
        onSuccess={() => {
          alert('Application successfully submitted!');
          setSelectedBriefToApply(null);
        }}
      />
    </div>
  );
}
