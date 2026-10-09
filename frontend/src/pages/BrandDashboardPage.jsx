import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkle,
  ShieldCheck,
  Building,
  FileText,
  Plus,
  Trash,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  ArrowSquareOut,
  Users,
  Check,
  WarningCircle,
  Star,
  Eye
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { brandsApi } from '../api/brands';
import { briefsApi } from '../api/briefs';
import { engagementsApi } from '../api/engagements';
import ExplainableMatchDrawer from '../components/dashboard/ExplainableMatchDrawer';
import RevisionRequestModal from '../components/dashboard/RevisionRequestModal';
import EngagementReviewModal from '../components/dashboard/EngagementReviewModal';

export default function BrandDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [profile, setProfile] = useState(null);
  const [briefs, setBriefs] = useState([]);
  const [selectedBriefForApps, setSelectedBriefForApps] = useState(null);
  const [applications, setApplications] = useState([]);
  const [engagements, setEngagements] = useState([]);

  const [activeTab, setActiveTab] = useState('briefs'); // 'briefs', 'applications', 'engagements'
  const [briefStatusFilter, setBriefStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [appsLoading, setAppsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modals & Drawers
  const [selectedBriefForMatches, setSelectedBriefForMatches] = useState(null);
  const [selectedEngagementForRevision, setSelectedEngagementForRevision] = useState(null);
  const [selectedEngagementForReview, setSelectedEngagementForReview] = useState(null);

  const fetchBrandData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch Brand Profile
      let profData = null;
      try {
        profData = await brandsApi.getMyProfile();
        setProfile(profData);
      } catch (err) {
        if (err.status === 404) {
          setProfile(null);
        } else {
          throw err;
        }
      }

      // 2. Fetch Briefs & Engagements
      const [briefsRes, engsRes] = await Promise.allSettled([
        briefsApi.getMyBriefs(),
        engagementsApi.list(),
      ]);

      const myBriefs = briefsRes.status === 'fulfilled' ? (briefsRes.value || []) : [];
      setBriefs(myBriefs);

      if (engsRes.status === 'fulfilled') {
        setEngagements(engsRes.value || []);
      }

      // Set initial brief for application inspector
      if (myBriefs.length > 0 && !selectedBriefForApps) {
        setSelectedBriefForApps(myBriefs[0]);
      }
    } catch (err) {
      console.error('Failed to load brand dashboard data:', err);
      setError(err.message || 'Failed to load brand campaign center.');
    } finally {
      setLoading(false);
    }
  }, [selectedBriefForApps]);

  useEffect(() => {
    fetchBrandData();
  }, [fetchBrandData]);

  // Load applications whenever selectedBriefForApps changes
  useEffect(() => {
    if (!selectedBriefForApps) {
      setApplications([]);
      return;
    }

    const loadApps = async () => {
      try {
        setAppsLoading(true);
        const apps = await briefsApi.getBriefApplications(selectedBriefForApps.id);
        setApplications(apps || []);
      } catch (err) {
        console.error('Failed to load applications for brief:', err);
        setApplications([]);
      } finally {
        setAppsLoading(false);
      }
    };

    loadApps();
  }, [selectedBriefForApps]);

  const handleUpdateBriefStatus = async (briefId, newStatus) => {
    try {
      await briefsApi.updateStatus(briefId, newStatus);
      await fetchBrandData();
    } catch (err) {
      alert(err.message || 'Failed to update brief status.');
    }
  };

  const handleDeleteBrief = async (briefId) => {
    if (!window.confirm('Are you sure you want to delete or cancel this campaign brief?')) return;
    try {
      await briefsApi.deleteOrCancel(briefId);
      await fetchBrandData();
    } catch (err) {
      alert(err.message || 'Failed to delete brief.');
    }
  };

  const handleApplicationStatus = async (applicationId, status, feedback) => {
    try {
      await briefsApi.updateApplicationStatus(applicationId, { status, brand_feedback: feedback });
      // Reload applications & dashboard
      if (selectedBriefForApps) {
        const apps = await briefsApi.getBriefApplications(selectedBriefForApps.id);
        setApplications(apps || []);
      }
      await fetchBrandData();
    } catch (err) {
      alert(err.message || 'Failed to update application status.');
    }
  };

  const handleApproveDeliverable = async (engagementId) => {
    if (!window.confirm('Confirm final approval of this deliverable?')) return;
    try {
      await engagementsApi.approve(engagementId);
      await fetchBrandData();
    } catch (err) {
      alert(err.message || 'Failed to approve deliverable.');
    }
  };

  const filteredBriefs = briefs.filter((b) => {
    if (briefStatusFilter === 'ALL') return true;
    return b.status === briefStatusFilter;
  });

  if (loading && !profile && briefs.length === 0) {
    return (
      <div className="page-wrapper" style={{ padding: '80px 0', textAlign: 'center' }}>
        <div className="container">
          <div className="spinner" style={{ margin: '0 auto 20px' }} />
          <h2 style={{ fontFamily: 'var(--font-family-display)', color: 'var(--text-primary)' }}>
            Loading Brand Campaign Center...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper" style={{ padding: '40px 0 80px', backgroundColor: 'var(--bg-main)' }}>
      <div className="container">
        {/* If Brand has not completed profile onboarding */}
        {!profile && (
          <div
            className="card"
            style={{
              padding: '32px',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              marginBottom: '32px',
              border: '1.5px solid var(--accent-coral-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '24px',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <WarningCircle size={24} weight="fill" style={{ color: 'var(--accent-coral)' }} />
                <h3 style={{ margin: 0, fontFamily: 'var(--font-family-display)', fontSize: '1.25rem' }}>
                  Complete Your Brand Profile
                </h3>
              </div>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9375rem', maxWidth: '600px' }}>
                Set up your company details, industry, and logo to start authoring generative campaigns and hiring creators.
              </p>
            </div>
            <Link to="/onboarding" className="btn btn-primary" style={{ padding: '12px 24px' }}>
              <span>Complete Brand Setup</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {/* Brand Header Banner */}
        {profile && (
          <div
            className="card"
            style={{
              padding: '32px',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              marginBottom: '32px',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '16px',
                    backgroundColor: 'var(--accent-coral-subtle)',
                    border: '2px solid var(--accent-coral)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1.75rem',
                    color: 'var(--accent-coral)',
                    overflow: 'hidden',
                  }}
                >
                  {profile.logo_url ? (
                    <img src={profile.logo_url} alt={profile.company_name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    profile.company_name?.charAt(0) || 'B'
                  )}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <h1 style={{ margin: 0, fontSize: '1.75rem', fontFamily: 'var(--font-family-display)', fontWeight: 800 }}>
                      {profile.company_name}
                    </h1>
                    <span className="badge badge-verified">VERIFIED BRAND</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    <span>{profile.industry || 'Media & Creative'}</span>
                    <span>•</span>
                    <span>{profile.headquarters || 'Global HQ'}</span>
                    <span>•</span>
                    <span>{profile.company_size || 'Enterprise'}</span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Link to="/briefs/create" className="btn btn-primary" style={{ fontSize: '0.875rem', padding: '10px 20px' }}>
                  <Plus size={16} weight="bold" />
                  <span>Create Campaign Brief</span>
                </Link>
              </div>
            </div>

            {/* Metrics */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '16px',
                marginTop: '24px',
                paddingTop: '20px',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Total Briefs
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {briefs.length}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Active Briefs
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-coral)', marginTop: '2px' }}>
                  {briefs.filter(b => b.status === 'PUBLISHED').length}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Active Productions
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-lavender)', marginTop: '2px' }}>
                  {engagements.filter(e => !['COMPLETED'].includes(e.status)).length}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Completed Engagements
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {engagements.filter(e => e.status === 'COMPLETED').length}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderBottom: '1px solid var(--border-subtle)',
            marginBottom: '28px',
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'briefs', label: 'Campaign Briefs', count: briefs.length, icon: FileText },
            { id: 'applications', label: 'Applications Received', count: applications.length, icon: Users },
            { id: 'engagements', label: 'Production Engagements', count: engagements.length, icon: Sparkle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 18px',
                  background: 'none',
                  border: 'none',
                  borderBottom: isActive ? '2px solid var(--accent-coral)' : '2px solid transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.9375rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <Icon size={18} weight={isActive ? 'bold' : 'regular'} />
                <span>{tab.label}</span>
                <span
                  style={{
                    backgroundColor: isActive ? 'var(--accent-coral-subtle)' : 'var(--bg-subtle)',
                    color: isActive ? 'var(--accent-coral)' : 'var(--text-tertiary)',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Campaign Briefs */}
        {activeTab === 'briefs' && (
          <div>
            {/* Status Filter Sub-bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
                {['ALL', 'PUBLISHED', 'DRAFT', 'CLOSED', 'CANCELLED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setBriefStatusFilter(st)}
                    className={`btn ${briefStatusFilter === st ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <Link to="/briefs/create" className="btn btn-primary" style={{ fontSize: '0.8125rem' }}>
                <Plus size={14} /> Create Brief
              </Link>
            </div>

            {filteredBriefs.length === 0 ? (
              <div className="card" style={{ padding: '48px', textAlign: 'center', backgroundColor: '#FFF', borderRadius: '16px' }}>
                <FileText size={40} style={{ color: 'var(--text-tertiary)', margin: '0 auto 16px' }} />
                <h3 style={{ margin: '0 0 8px 0', fontFamily: 'var(--font-family-display)' }}>
                  No Campaign Briefs in '{briefStatusFilter}' Status
                </h3>
                <p style={{ margin: '0 auto 20px', color: 'var(--text-secondary)', maxWidth: '440px', fontSize: '0.9375rem' }}>
                  Create your first structured brief to match with verified generative creators.
                </p>
                <Link to="/briefs/create" className="btn btn-primary">
                  Create Brief
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredBriefs.map((brief) => (
                  <div
                    key={brief.id}
                    className="card"
                    style={{
                      padding: '24px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '16px',
                      border: '1px solid var(--border-subtle)',
                      boxShadow: 'var(--shadow-xs)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span className={`badge badge-${brief.status === 'PUBLISHED' ? 'coral' : brief.status === 'DRAFT' ? 'neutral' : 'neutral'}`}>
                            {brief.status}
                          </span>
                          <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                            {brief.content_type} • {brief.aspect_ratio}
                          </span>
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-family-display)' }}>
                          {brief.title}
                        </h3>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          ${brief.budget_amount?.toLocaleString()} {brief.budget_currency}
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                          Deadline: {new Date(brief.deadline).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <p style={{ margin: '0 0 16px 0', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {brief.campaign_objective}
                    </p>

                    {/* Actions Bar */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderTop: '1px solid var(--border-subtle)',
                        paddingTop: '16px',
                        flexWrap: 'wrap',
                        gap: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                          onClick={() => setSelectedBriefForMatches(brief)}
                          className="btn btn-outline"
                          style={{ fontSize: '0.8125rem', padding: '6px 14px', color: 'var(--accent-lavender)', borderColor: 'var(--accent-lavender)' }}
                        >
                          <Sparkle size={14} weight="fill" />
                          <span>Find AI Matches</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedBriefForApps(brief);
                            setActiveTab('applications');
                          }}
                          className="btn btn-ghost"
                          style={{ fontSize: '0.8125rem', padding: '6px 12px' }}
                        >
                          <Users size={14} />
                          <span>Applications ({brief.applications_count || 0})</span>
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {brief.status === 'DRAFT' && (
                          <button
                            onClick={() => handleUpdateBriefStatus(brief.id, 'PUBLISHED')}
                            className="btn btn-primary"
                            style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                          >
                            Publish
                          </button>
                        )}

                        {brief.status === 'PUBLISHED' && (
                          <button
                            onClick={() => handleUpdateBriefStatus(brief.id, 'CLOSED')}
                            className="btn btn-outline"
                            style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                          >
                            Close
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteBrief(brief.id)}
                          className="btn btn-ghost"
                          style={{ padding: '6px', color: 'var(--accent-coral)' }}
                          title="Delete Brief"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Applications Received */}
        {activeTab === 'applications' && (
          <div>
            {/* Brief Selector */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
                Select Campaign Brief:
              </label>
              <select
                className="input"
                style={{ maxWidth: '400px' }}
                value={selectedBriefForApps?.id || ''}
                onChange={(e) => {
                  const b = briefs.find(x => x.id === e.target.value);
                  setSelectedBriefForApps(b || null);
                }}
              >
                {briefs.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} ({b.status})
                  </option>
                ))}
              </select>
            </div>

            {appsLoading ? (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <div className="spinner" style={{ margin: '0 auto 12px' }} />
                <p style={{ color: 'var(--text-secondary)' }}>Loading submitted applications...</p>
              </div>
            ) : applications.length === 0 ? (
              <div className="card" style={{ padding: '48px', textAlign: 'center', backgroundColor: '#FFF', borderRadius: '16px' }}>
                <Users size={40} style={{ color: 'var(--text-tertiary)', margin: '0 auto 16px' }} />
                <h3 style={{ margin: '0 0 8px 0', fontFamily: 'var(--font-family-display)' }}>
                  No Applications Received Yet
                </h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                  As creators review and apply to this campaign brief, their pitches will appear here.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {applications.map((app) => (
                  <div
                    key={app.id}
                    className="card"
                    style={{
                      padding: '24px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '16px',
                      border: '1px solid var(--border-subtle)',
                      boxShadow: 'var(--shadow-xs)',
                    }}
                  >
                    {/* Applicant Info */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--accent-lavender-subtle)',
                            color: 'var(--accent-lavender)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '1.125rem',
                          }}
                        >
                          {app.creator_display_name?.charAt(0) || 'C'}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                              {app.creator_display_name || 'Creator'}
                            </span>
                            <span className={`badge badge-${app.status === 'ACCEPTED' ? 'verified' : app.status === 'SHORTLISTED' ? 'coral' : 'neutral'}`}>
                              {app.status}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                            @{app.creator_handle} • Submitted on {new Date(app.submitted_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          ${app.proposed_rate?.toLocaleString()} USD
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                          Proposed: {app.proposed_timeline_days} days
                        </div>
                      </div>
                    </div>

                    {/* Pitch */}
                    <p style={{ margin: '0 0 16px 0', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      <strong>Pitch:</strong> {app.pitch_text}
                    </p>

                    {/* Actions: Shortlist / Accept / Reject */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderTop: '1px solid var(--border-subtle)',
                        paddingTop: '12px',
                      }}
                    >
                      <Link
                        to={`/creators/${app.creator_handle || app.creator_id}`}
                        className="btn btn-ghost"
                        style={{ fontSize: '0.8125rem' }}
                        target="_blank"
                      >
                        <Eye size={14} />
                        <span>Inspect Creator Portfolio</span>
                      </Link>

                      {app.status === 'SUBMITTED' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleApplicationStatus(app.id, 'SHORTLISTED')}
                            className="btn btn-outline"
                            style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                          >
                            Shortlist
                          </button>
                          <button
                            onClick={() => handleApplicationStatus(app.id, 'REJECTED')}
                            className="btn btn-ghost"
                            style={{ fontSize: '0.75rem', padding: '6px 12px', color: 'var(--accent-coral)' }}
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleApplicationStatus(app.id, 'ACCEPTED')}
                            className="btn btn-primary"
                            style={{ fontSize: '0.75rem', padding: '6px 14px' }}
                          >
                            <Check size={14} weight="bold" />
                            <span>Accept & Commission</span>
                          </button>
                        </div>
                      )}

                      {app.status === 'SHORTLISTED' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleApplicationStatus(app.id, 'ACCEPTED')}
                            className="btn btn-primary"
                            style={{ fontSize: '0.75rem', padding: '6px 14px' }}
                          >
                            <Check size={14} weight="bold" />
                            <span>Accept & Commission</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Production Engagements */}
        {activeTab === 'engagements' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-family-display)' }}>
                Active Production Engagements
              </h2>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Review submitted deliverables, request specific revisions, and complete sign-offs.
              </p>
            </div>

            {engagements.length === 0 ? (
              <div className="card" style={{ padding: '48px', textAlign: 'center', backgroundColor: '#FFF', borderRadius: '16px' }}>
                <Sparkle size={40} style={{ color: 'var(--accent-lavender)', margin: '0 auto 16px' }} />
                <h3 style={{ margin: '0 0 8px 0', fontFamily: 'var(--font-family-display)' }}>
                  No Active Productions
                </h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                  When you accept a creator pitch, production milestones will automatically initialize here.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {engagements.map((eng) => (
                  <div
                    key={eng.id}
                    className="card"
                    style={{
                      padding: '24px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '16px',
                      border: '1px solid var(--border-subtle)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span className={`badge badge-${eng.status === 'FINAL_APPROVED' || eng.status === 'COMPLETED' ? 'verified' : eng.status === 'REVISION_REQUESTED' ? 'coral' : 'neutral'}`}>
                            {eng.status.replace(/_/g, ' ')}
                          </span>
                          <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                            Creator: <strong>@{eng.creator_handle}</strong> ({eng.creator_display_name})
                          </span>
                        </div>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-family-display)', fontWeight: 800 }}>
                          {eng.brief_title || 'Campaign Production'}
                        </h3>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          ${eng.agreed_amount?.toLocaleString()} USD
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                          Deadline: {new Date(eng.completion_deadline).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Deliverable Review Actions */}
                    {eng.deliverables?.length > 0 && (
                      <div style={{ marginBottom: '16px' }}>
                        <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                          Submitted Deliverables:
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {eng.deliverables.map((d) => (
                            <div
                              key={d.id}
                              style={{
                                padding: '12px 16px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-subtle)',
                                backgroundColor: '#FAFAF8',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontSize: '0.8125rem',
                              }}
                            >
                              <div>
                                <span style={{ fontWeight: 700, marginRight: '8px' }}>v{d.version}: {d.title}</span>
                                <span className={`badge badge-${d.status === 'APPROVED' ? 'verified' : d.status === 'REVISION_REQUESTED' ? 'coral' : 'neutral'}`} style={{ fontSize: '0.625rem' }}>
                                  {d.status}
                                </span>
                                {d.notes && <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Notes: {d.notes}</div>}
                              </div>
                              <a
                                href={d.asset_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-outline"
                                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                              >
                                Open Asset Package &rarr;
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Milestones Action Bar */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '10px',
                        borderTop: '1px solid var(--border-subtle)',
                        paddingTop: '16px',
                      }}
                    >
                      {eng.status === 'DRAFT_SUBMITTED' && (
                        <>
                          <button
                            onClick={() => setSelectedEngagementForRevision(eng)}
                            className="btn btn-outline"
                            style={{ fontSize: '0.8125rem', color: 'var(--accent-coral)' }}
                          >
                            Request Revisions
                          </button>
                          <button
                            onClick={() => handleApproveDeliverable(eng.id)}
                            className="btn btn-primary"
                            style={{ fontSize: '0.8125rem' }}
                          >
                            <CheckCircle size={16} weight="fill" />
                            <span>Approve Deliverable</span>
                          </button>
                        </>
                      )}

                      {eng.status === 'FINAL_APPROVED' && (
                        <button
                          onClick={() => setSelectedEngagementForReview(eng)}
                          className="btn btn-primary"
                          style={{ fontSize: '0.8125rem' }}
                        >
                          <Star size={16} weight="fill" />
                          <span>Complete & Review Creator</span>
                        </button>
                      )}

                      {eng.status === 'COMPLETED' && (
                        <div style={{ fontSize: '0.875rem', color: '#2E7D32', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle size={18} weight="fill" />
                          <span>Engagement Completed & Testimonial Published</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Drawers & Modals */}
      <ExplainableMatchDrawer
        isOpen={Boolean(selectedBriefForMatches)}
        brief={selectedBriefForMatches}
        onClose={() => setSelectedBriefForMatches(null)}
      />

      <RevisionRequestModal
        isOpen={Boolean(selectedEngagementForRevision)}
        engagement={selectedEngagementForRevision}
        onClose={() => setSelectedEngagementForRevision(null)}
        onSuccess={fetchBrandData}
      />

      <EngagementReviewModal
        isOpen={Boolean(selectedEngagementForReview)}
        engagement={selectedEngagementForReview}
        onClose={() => setSelectedEngagementForReview(null)}
        onSuccess={fetchBrandData}
      />
    </div>
  );
}
