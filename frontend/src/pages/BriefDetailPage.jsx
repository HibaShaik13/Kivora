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
          <div className="card-editorial" style={{ padding: '48px', background: 'var(--bg-surface)', borderRadius: '24px', border: '1px solid var(--border-subtle)' }}>
            <WarningCircle size={48} style={{ color: 'var(--accent-coral)', margin: '0 auto 16px' }} />
            <h2 className="font-serif" style={{ margin: '0 0 12px 0', color: 'var(--text-primary)', fontSize: '1.75rem' }}>
              Brief Unavailable
            </h2>
            <p style={{ margin: '0 0 24px 0', color: 'var(--text-secondary)' }}>
              {error || 'The requested campaign brief does not exist or is currently in draft status.'}
            </p>
            <Link to="/briefs" className="btn btn-gold">
              Return to Briefs Directory
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper" style={{ padding: '40px 0 80px', background: 'var(--bg-primary)' }}>
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
              transition: 'color var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            <ArrowLeft size={16} />
            <span>Back to All Briefs</span>
          </Link>
        </div>

        {/* Main Brief Content */}
        <div
          className="card-editorial"
          style={{
            padding: '40px',
            background: 'linear-gradient(145deg, #10152B 0%, #0A0E23 100%)',
            borderRadius: '24px',
            border: '1px solid rgba(167, 139, 250, 0.25)',
            boxShadow: 'var(--shadow-lg)',
            marginBottom: '24px',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', marginBottom: '28px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span className="badge badge-coral">{brief.content_type}</span>
                <span className="badge badge-neutral">{brief.aspect_ratio}</span>
                <span className={`badge badge-${brief.status === 'PUBLISHED' ? 'gold' : 'neutral'}`}>{brief.status}</span>
              </div>
              <h1 className="font-serif" style={{ margin: 0, fontSize: 'clamp(1.75rem, 2.5vw + 0.5rem, 2.375rem)', color: 'var(--text-primary)', fontWeight: 700, letterSpacing: '-0.02em' }}>
                {brief.title}
              </h1>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '8px' }}>
                Published by <strong style={{ color: 'var(--accent-gold)' }}>{brief.brand?.company_name || 'Brand Partner'}</strong> • Created {new Date(brief.created_at).toLocaleDateString()}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                ${brief.budget_amount?.toLocaleString()} <span style={{ fontSize: '1rem', color: 'var(--accent-gold)', fontWeight: 600 }}>{brief.budget_currency}</span>
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px', marginTop: '4px' }}>
                <Clock size={14} style={{ color: 'var(--accent-gold)' }} />
                <span>Deadline: {new Date(brief.deadline).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Core Objectives */}
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#A78BFA', marginBottom: '8px' }}>
              Campaign Objective & Creative Direction
            </h3>
            <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
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
              background: 'rgba(6, 8, 19, 0.75)',
              borderRadius: '16px',
              border: '1px solid var(--border-subtle)',
              marginBottom: '28px',
            }}
          >
            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--accent-gold)', textTransform: 'uppercase', fontFamily: 'var(--font-family-mono)', fontWeight: 600 }}>
                Target Audience
              </div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                {brief.target_audience || 'Broad / Specified in Brief'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--accent-gold)', textTransform: 'uppercase', fontFamily: 'var(--font-family-mono)', fontWeight: 600 }}>
                Creative Style
              </div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                {brief.creative_style_mood || 'Photorealistic AI'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--accent-gold)', textTransform: 'uppercase', fontFamily: 'var(--font-family-mono)', fontWeight: 600 }}>
                Resolution
              </div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                {brief.resolution_min || '4K UHD'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--accent-gold)', textTransform: 'uppercase', fontFamily: 'var(--font-family-mono)', fontWeight: 600 }}>
                Revision Allowance
              </div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                {brief.revision_allowance || 2} Rounds Included
              </div>
            </div>
          </div>

          {/* Deliverables Description */}
          {brief.deliverables_description && (
            <div style={{ marginBottom: '28px' }}>
              <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#A78BFA', marginBottom: '8px' }}>
                Deliverables Package
              </h3>
              <p style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {brief.deliverables_description}
              </p>
            </div>
          )}

          {/* Required Skills & Tooling */}
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#A78BFA', marginBottom: '10px' }}>
              Required Generative Competencies
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {brief.required_skills?.map((sk) => (
                <span key={sk.skill_id} className="badge badge-neutral" style={{ padding: '6px 14px', fontSize: '0.8125rem' }}>
                  {sk.name}
                </span>
              ))}
              {brief.required_tools?.map((tl) => (
                <span key={tl.tool_id} className="badge badge-verified" style={{ padding: '6px 14px', fontSize: '0.8125rem' }}>
                  {tl.name}
                </span>
              ))}
            </div>
          </div>

          {/* Commercial Rights Breakdown */}
          <div style={{ marginBottom: '32px', borderTop: '1px solid var(--border-subtle)', paddingTop: '22px' }}>
            <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#A78BFA', marginBottom: '14px' }}>
              Commercial License & Territory Scope
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <div><strong style={{ color: 'var(--text-primary)' }}>Usage Channels:</strong> {brief.usage_channels || 'Digital & Social'}</div>
              <div><strong style={{ color: 'var(--text-primary)' }}>Duration:</strong> {brief.usage_duration || 'Perpetual'}</div>
              <div><strong style={{ color: 'var(--text-primary)' }}>Territories:</strong> {brief.usage_territories || 'Worldwide'}</div>
              <div><strong style={{ color: 'var(--text-primary)' }}>Disclosure:</strong> {brief.disclosure_requirements || 'Standard Kivora AI disclosure'}</div>
            </div>
          </div>

          {/* Apply CTA Bar */}
          <div
            style={{
              paddingTop: '22px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>{brief.applications_count || 0}</span> creators have applied to this brief
            </div>

            {isCreator ? (
              <button
                onClick={() => setIsApplyModalOpen(true)}
                className="btn btn-gold"
                style={{ padding: '12px 28px', fontSize: '0.9375rem', fontWeight: '700' }}
              >
                <Sparkle size={18} weight="fill" />
                <span>Submit Pitch & Proposal</span>
              </button>
            ) : !isAuthenticated ? (
              <Link
                to={`/login?redirect=/briefs/${brief.slug || brief.id}`}
                className="btn btn-gold"
                style={{ padding: '12px 26px', fontWeight: '700' }}
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
