import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  CalendarBlank,
  CurrencyDollar,
  Sparkle,
  ArrowLeft,
  CheckCircle,
  Building,
  ShieldCheck,
  WarningCircle,
  Clock
} from '@phosphor-icons/react';
import { briefsApi } from '../api/briefs';
import { creatorsApi } from '../api/creators';
import { useAuth } from '../context/AuthContext';
import CreatorApplyModal from '../components/dashboard/CreatorApplyModal';

export default function BriefDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isCreator, isBrand } = useAuth();

  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [creatorProfile, setCreatorProfile] = useState(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await briefsApi.getDetail(slug);
        setBrief(data);
      } catch (err) {
        console.error('Failed to load brief detail:', err);
        setError(err.message || 'Campaign brief not found or access restricted.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [slug]);

  useEffect(() => {
    if (isAuthenticated && isCreator) {
      creatorsApi.getMyProfile()
        .then(data => setCreatorProfile(data))
        .catch(() => setCreatorProfile(null));
    }
  }, [isAuthenticated, isCreator]);

  if (loading) {
    return (
      <div className="page-wrapper" style={{ padding: '80px 0', textAlign: 'center' }}>
        <div className="container">
          <div className="spinner" style={{ margin: '0 auto 20px' }} />
          <h2 style={{ fontFamily: 'var(--font-family-display)' }}>Loading Campaign Brief...</h2>
        </div>
      </div>
    );
  }

  if (error || !brief) {
    return (
      <div className="page-wrapper" style={{ padding: '80px 0', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: '600px' }}>
          <div className="card" style={{ padding: '48px', backgroundColor: '#FFFFFF', borderRadius: '16px' }}>
            <WarningCircle size={48} style={{ color: 'var(--accent-coral)', margin: '0 auto 16px' }} />
            <h2 style={{ margin: '0 0 12px 0', fontFamily: 'var(--font-family-display)' }}>
              Brief Unavailable
            </h2>
            <p style={{ margin: '0 0 24px 0', color: 'var(--text-secondary)' }}>
              {error || 'The requested campaign brief does not exist or is currently in draft status.'}
            </p>
            <Link to="/briefs" className="btn btn-primary">
              Return to Briefs Directory
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper" style={{ padding: '40px 0 80px', backgroundColor: 'var(--bg-main)' }}>
      <div className="container" style={{ maxWidth: '960px' }}>
        {/* Back Link */}
        <div style={{ marginBottom: '24px' }}>
          <Link
            to="/briefs"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to All Briefs</span>
          </Link>
        </div>

        {/* Main Brief Content */}
        <div
          className="card"
          style={{
            padding: '36px',
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: '24px',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', marginBottom: '24px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className="badge badge-coral">{brief.content_type}</span>
                <span className="badge badge-neutral">{brief.aspect_ratio}</span>
                <span className={`badge badge-${brief.status === 'PUBLISHED' ? 'verified' : 'neutral'}`}>{brief.status}</span>
              </div>
              <h1 style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-family-display)', fontWeight: 800 }}>
                {brief.title}
              </h1>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '6px' }}>
                Published by <strong>{brief.brand?.company_name || 'Brand Partner'}</strong> • Created {new Date(brief.created_at).toLocaleDateString()}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                ${brief.budget_amount?.toLocaleString()} {brief.budget_currency}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '4px' }}>
                <Clock size={14} />
                <span>Deadline: {new Date(brief.deadline).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Core Objectives */}
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Campaign Objective & Creative Direction
            </h3>
            <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {brief.campaign_objective}
            </p>
          </div>

          {/* Technical Specs Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              padding: '20px',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: '12px',
              marginBottom: '28px',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>
                Target Audience
              </div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                {brief.target_audience || 'Broad / Specified in Brief'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>
                Creative Style
              </div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                {brief.creative_style_mood || 'Photorealistic AI'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>
                Resolution
              </div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                {brief.resolution_min || '4K UHD'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>
                Revision Allowance
              </div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                {brief.revision_allowance || 2} Rounds Included
              </div>
            </div>
          </div>

          {/* Deliverables Description */}
          {brief.deliverables_description && (
            <div style={{ marginBottom: '28px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Deliverables Package
              </h3>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {brief.deliverables_description}
              </p>
            </div>
          )}

          {/* Required Skills & Tooling */}
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
              Required Generative Competencies
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {brief.required_skills?.map((sk) => (
                <span key={sk.skill_id} className="badge badge-neutral" style={{ padding: '6px 12px', fontSize: '0.8125rem' }}>
                  {sk.name}
                </span>
              ))}
              {brief.required_tools?.map((tl) => (
                <span key={tl.tool_id} className="badge badge-verified" style={{ padding: '6px 12px', fontSize: '0.8125rem' }}>
                  {tl.name}
                </span>
              ))}
            </div>
          </div>

          {/* Commercial Rights Breakdown */}
          <div style={{ marginBottom: '32px', borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
              Commercial License & Territory Scope
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              <div><strong>Usage Channels:</strong> {brief.usage_channels || 'Digital & Social'}</div>
              <div><strong>Duration:</strong> {brief.usage_duration || 'Perpetual'}</div>
              <div><strong>Territories:</strong> {brief.usage_territories || 'Worldwide'}</div>
              <div><strong>Disclosure:</strong> {brief.disclosure_requirements || 'Standard Kivora AI disclosure'}</div>
            </div>
          </div>

          {/* Apply CTA Bar */}
          <div
            style={{
              paddingTop: '20px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
              {brief.applications_count || 0} creators have applied to this brief
            </div>

            {isCreator ? (
              <button
                onClick={() => setIsApplyModalOpen(true)}
                className="btn btn-primary"
                style={{ padding: '12px 28px', fontSize: '0.9375rem' }}
              >
                <Sparkle size={18} weight="fill" />
                <span>Submit Pitch & Proposal</span>
              </button>
            ) : !isAuthenticated ? (
              <Link
                to={`/login?redirect=/briefs/${brief.slug || brief.id}`}
                className="btn btn-primary"
                style={{ padding: '12px 24px' }}
              >
                Sign In to Apply
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {/* Pitch Modal */}
      <CreatorApplyModal
        isOpen={isApplyModalOpen}
        brief={brief}
        creatorProjects={creatorProfile?.portfolio_projects || []}
        onClose={() => setIsApplyModalOpen(false)}
        onSuccess={() => {
          alert('Your application has been submitted to the brand team!');
          setIsApplyModalOpen(false);
          navigate('/creator/dashboard');
        }}
      />
    </div>
  );
}
