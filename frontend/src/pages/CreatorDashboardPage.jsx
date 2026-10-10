import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkle,
  ShieldCheck,
  Briefcase,
  FileText,
  Clock,
  Plus,
  Trash,
  CheckCircle,
  WarningCircle,
  ArrowSquareOut,
  UploadSimple,
  CurrencyDollar,
  Star,
  User,
  MagnifyingGlass,
  ArrowRight
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { creatorsApi } from '../api/creators';
import { briefsApi } from '../api/briefs';
import { engagementsApi } from '../api/engagements';
import { verificationApi } from '../api/verification';
import CreatorAddProjectModal from '../components/dashboard/CreatorAddProjectModal';
import CreatorApplyModal from '../components/dashboard/CreatorApplyModal';
import DeliverableSubmissionModal from '../components/dashboard/DeliverableSubmissionModal';
import ProjectDeepDiveModal from '../components/creator/ProjectDeepDiveModal';
import SafeImage from '../components/common/SafeImage';

export default function CreatorDashboardPage() {
  const { user, refreshSession } = useAuth();
  const navigate = useNavigate();

  // State
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [engagements, setEngagements] = useState([]);
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [openBriefs, setOpenBriefs] = useState([]);

  const [activeTab, setActiveTab] = useState('projects'); // 'projects', 'applications', 'engagements', 'briefs', 'verification'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [selectedBriefToApply, setSelectedBriefToApply] = useState(null);
  const [selectedEngagementToDeliver, setSelectedEngagementToDeliver] = useState(null);
  const [selectedDeepDiveProject, setSelectedDeepDiveProject] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch Profile
      let profData = null;
      try {
        profData = await creatorsApi.getMyProfile();
        setProfile(profData);
      } catch (err) {
        if (err.status === 404 || err.message?.includes('not yet initialized')) {
          setProfile(null);
        } else {
          throw err;
        }
      }

      // 2. Fetch Applications, Engagements, Verification Requests, and Open Briefs in parallel
      const [appsRes, engsRes, verRes, briefsRes] = await Promise.allSettled([
        briefsApi.getMyApplications(),
        engagementsApi.list(),
        verificationApi.getMyRequests(),
        briefsApi.list({ status: 'PUBLISHED', limit: 10 }),
      ]);

      if (appsRes.status === 'fulfilled') setApplications(appsRes.value || []);
      if (engsRes.status === 'fulfilled') setEngagements(engsRes.value || []);
      if (verRes.status === 'fulfilled') setVerificationRequests(verRes.value || []);
      if (briefsRes.status === 'fulfilled') setOpenBriefs(briefsRes.value || []);

    } catch (err) {
      console.error('Failed to load creator dashboard data:', err);
      setError(err.message || 'Failed to load creator workspace.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this portfolio project and its workflow history?')) {
      return;
    }
    try {
      await creatorsApi.deletePortfolioProject(projectId);
      await fetchDashboardData();
    } catch (err) {
      alert(err.message || 'Failed to delete project.');
    }
  };

  const handleRequestVerification = async (evidenceId, projectId, title) => {
    try {
      await verificationApi.submitRequest({
        evidence_id: evidenceId,
        target_type: 'PORTFOLIO_PROJECT',
        target_id: projectId,
        verification_scope: `Audit of workflow process: ${title}`,
      });
      alert('Verification request submitted for administrative audit!');
      await fetchDashboardData();
    } catch (err) {
      alert(err.message || 'Failed to submit verification request.');
    }
  };

  if (loading && !profile && applications.length === 0) {
    return (
      <div className="page-wrapper" style={{ padding: '80px 0', textAlign: 'center' }}>
        <div className="container">
          <div className="spinner" style={{ margin: '0 auto 20px' }} />
          <h2 style={{ fontFamily: 'var(--font-family-display)', color: 'var(--text-primary)' }}>
            Loading Creator Workspace...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper" style={{ padding: '40px 0 80px', backgroundColor: 'var(--bg-main)' }}>
      <div className="container">
        {/* If Creator has not completed profile onboarding */}
        {!profile && (
          <div
            className="card"
            style={{
              padding: '32px',
              backgroundColor: 'var(--bg-surface)',
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
                  Complete Your Creator Profile
                </h3>
              </div>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9375rem', maxWidth: '600px' }}>
                You have not yet completed profile setup. Add your primary specialization, generative skills, and hourly rates to unlock brand discovery and brief applications.
              </p>
            </div>
            <Link to="/onboarding" className="btn btn-primary" style={{ padding: '12px 24px' }}>
              <span>Complete Setup Now</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {/* Dashboard Header Profile Banner */}
        {profile && (
          <div
            className="card"
            style={{
              padding: '32px',
              backgroundColor: 'var(--bg-surface)',
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
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent-lavender-subtle)',
                    border: '2px solid var(--accent-lavender)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1.75rem',
                    color: 'var(--accent-lavender)',
                    overflow: 'hidden',
                  }}
                >
                  <SafeImage
                    src={profile.avatar_url}
                    alt={profile.display_name}
                    fallbackInitials={profile.display_name?.charAt(0) || 'C'}
                    fallbackBg="var(--accent-lavender-subtle)"
                    fallbackColor="var(--accent-lavender)"
                    style={{ width: '100%', height: '100%' }}
                    objectFit="cover"
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <h1 style={{ margin: 0, fontSize: '1.75rem', fontFamily: 'var(--font-family-display)', fontWeight: 800 }}>
                      {profile.display_name}
                    </h1>
                    <span className={`badge badge-${profile.verification_tier === 'COMMUNITY' ? 'neutral' : 'verified'}`}>
                      {profile.verification_tier || 'COMMUNITY'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    <span>@{profile.handle}</span>
                    <span>•</span>
                    <span>{profile.primary_specialization || 'Generative Creator'}</span>
                    <span>•</span>
                    <span>{profile.location || 'Remote'}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Link
                  to={`/creators/${profile.handle || profile.id}`}
                  className="btn btn-outline"
                  style={{ fontSize: '0.875rem', padding: '8px 16px' }}
                >
                  <ArrowSquareOut size={16} />
                  <span>View Public Profile</span>
                </Link>
                <button
                  onClick={() => setIsAddProjectOpen(true)}
                  className="btn btn-primary"
                  style={{ fontSize: '0.875rem', padding: '8px 16px' }}
                >
                  <Plus size={16} />
                  <span>Add Portfolio Work</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
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
                  Verified Claims
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {profile.verified_claims_count || 0}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Completed Projects
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {profile.completed_projects_count || 0}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Average Rating
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Star size={16} weight="fill" style={{ color: '#E5A000' }} />
                  <span>{profile.average_rating ? profile.average_rating.toFixed(1) : '5.0'}</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Active Engagements
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-lavender)', marginTop: '2px' }}>
                  {engagements.filter(e => !['COMPLETED', 'FINAL_APPROVED'].includes(e.status)).length}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Min Project Budget
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                  ${profile.min_budget?.toLocaleString() || '500'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderBottom: '1px solid var(--border-subtle)',
            marginBottom: '28px',
            overflowX: 'auto',
            paddingBottom: '2px',
          }}
        >
          {[
            { id: 'projects', label: 'Portfolio & Workflows', count: profile?.portfolio_projects?.length || 0, icon: Briefcase },
            { id: 'applications', label: 'My Applications', count: applications.length, icon: FileText },
            { id: 'engagements', label: 'Active Productions', count: engagements.length, icon: Sparkle },
            { id: 'briefs', label: 'Recommended Briefs', count: openBriefs.length, icon: MagnifyingGlass },
            { id: 'verification', label: 'Verification Audits', count: verificationRequests.length, icon: ShieldCheck },
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
                  borderBottom: isActive ? '2px solid var(--accent-lavender)' : '2px solid transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.9375rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <Icon size={18} weight={isActive ? 'bold' : 'regular'} />
                <span>{tab.label}</span>
                <span
                  style={{
                    backgroundColor: isActive ? 'var(--accent-lavender-subtle)' : 'var(--bg-subtle)',
                    color: isActive ? 'var(--accent-lavender)' : 'var(--text-tertiary)',
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

        {/* Tab 1: Portfolio & Workflows */}
        {activeTab === 'projects' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-family-display)' }}>
                  Portfolio Projects & Evidence Records
                </h2>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Published case studies showcasing your prompt workflows, generative models, and certified proof-of-work.
                </p>
              </div>
              <button onClick={() => setIsAddProjectOpen(true)} className="btn btn-primary" style={{ fontSize: '0.875rem' }}>
                <Plus size={16} />
                <span>Add Project</span>
              </button>
            </div>

            {!profile?.portfolio_projects || profile.portfolio_projects.length === 0 ? (
              <div
                className="card"
                style={{
                  padding: '48px',
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: '16px',
                }}
              >
                <Briefcase size={40} style={{ color: 'var(--accent-lavender)', margin: '0 auto 16px' }} />
                <h3 style={{ margin: '0 0 8px 0', fontFamily: 'var(--font-family-display)' }}>
                  No Portfolio Projects Yet
                </h3>
                <p style={{ margin: '0 auto 20px', color: 'var(--text-secondary)', maxWidth: '480px', fontSize: '0.9375rem' }}>
                  Upload your first generative campaign or video case study with workflow telemetry to earn verification and attract brand briefs.
                </p>
                <button onClick={() => setIsAddProjectOpen(true)} className="btn btn-primary">
                  <Plus size={16} />
                  <span>Publish First Project</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {profile.portfolio_projects.map((project) => (
                  <div
                    key={project.id}
                    className="card"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      boxShadow: 'var(--shadow-sm)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {/* Thumbnail / Video Preview */}
                    <div
                      style={{
                        position: 'relative',
                        height: '180px',
                        backgroundColor: '#060813',
                        overflow: 'hidden',
                        cursor: 'pointer',
                      }}
                      onClick={() => setSelectedDeepDiveProject(project)}
                    >
                      <SafeImage
                        src={project.thumbnail_url}
                        alt={project.title}
                        fallbackSrc="/assets/showcase_spatial.jpg"
                        style={{ width: '100%', height: '100%' }}
                        objectFit="cover"
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: '12px',
                          left: '12px',
                          display: 'flex',
                          gap: '6px',
                        }}
                      >
                        <span className="badge badge-coral" style={{ fontSize: '0.6875rem' }}>
                          {project.content_type || 'VIDEO'}
                        </span>
                        <span className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>
                          {project.aspect_ratio || '16:9'}
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <h4
                          style={{
                            margin: '0 0 6px 0',
                            fontSize: '1rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                          onClick={() => setSelectedDeepDiveProject(project)}
                        >
                          {project.title}
                        </h4>
                        <p
                          style={{
                            margin: '0 0 12px 0',
                            fontSize: '0.8125rem',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.4,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {project.description || 'No description provided.'}
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '12px' }}>
                          <span>{project.workflow_steps?.length || 0} Workflow Steps</span>
                          <span>•</span>
                          <span>{project.evidence_records?.length || 0} Evidence Attachments</span>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderTop: '1px solid var(--border-subtle)',
                          paddingTop: '12px',
                        }}
                      >
                        <button
                          onClick={() => setSelectedDeepDiveProject(project)}
                          className="btn btn-ghost"
                          style={{ fontSize: '0.8125rem', padding: '4px 8px' }}
                        >
                          Inspect Details &rarr;
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className="btn btn-ghost"
                          style={{ padding: '6px', color: 'var(--accent-coral)' }}
                          title="Delete Project"
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

        {/* Tab 2: My Applications */}
        {activeTab === 'applications' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-family-display)' }}>
                Submitted Campaign Applications
              </h2>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Track live status updates and feedback from brand campaign managers.
              </p>
            </div>

            {applications.length === 0 ? (
              <div
                className="card"
                style={{
                  padding: '48px',
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: '16px',
                }}
              >
                <FileText size={40} style={{ color: 'var(--accent-lavender)', margin: '0 auto 16px' }} />
                <h3 style={{ margin: '0 0 8px 0', fontFamily: 'var(--font-family-display)' }}>
                  No Applications Submitted Yet
                </h3>
                <p style={{ margin: '0 auto 20px', color: 'var(--text-secondary)', maxWidth: '440px', fontSize: '0.9375rem' }}>
                  Explore published briefs and pitch your generative creative vision to brands.
                </p>
                <button onClick={() => setActiveTab('briefs')} className="btn btn-primary">
                  Explore Campaign Briefs
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {applications.map((app) => (
                  <div
                    key={app.id}
                    className="card"
                    style={{
                      padding: '20px 24px',
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: '16px',
                      border: '1px solid var(--border-subtle)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span
                            className={`badge badge-${
                              app.status === 'ACCEPTED'
                                ? 'verified'
                                : app.status === 'SHORTLISTED'
                                ? 'coral'
                                : app.status === 'REJECTED'
                                ? 'neutral'
                                : 'neutral'
                            }`}
                            style={{ fontSize: '0.75rem' }}
                          >
                            {app.status}
                          </span>
                          <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                            Submitted on {new Date(app.submitted_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>
                          Brief ID: {app.brief_id}
                        </h4>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          ${app.proposed_rate?.toLocaleString()} USD
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                          Timeline: {app.proposed_timeline_days} days
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
                      <strong>Pitch Treatment:</strong> {app.pitch_text}
                    </div>

                    {app.brand_feedback && (
                      <div
                        style={{
                          padding: '12px 16px',
                          backgroundColor: 'var(--bg-subtle)',
                          borderRadius: '8px',
                          borderLeft: '3px solid var(--accent-lavender)',
                          fontSize: '0.8125rem',
                          color: 'var(--text-primary)',
                        }}
                      >
                        <strong>Brand Feedback:</strong> {app.brand_feedback}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Active Engagements */}
        {activeTab === 'engagements' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-family-display)' }}>
                Active Production Engagements & Deliverables
              </h2>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Submit deliverables, track client sign-offs, and receive verified brand ratings.
              </p>
            </div>

            {engagements.length === 0 ? (
              <div
                className="card"
                style={{
                  padding: '48px',
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: '16px',
                }}
              >
                <Sparkle size={40} style={{ color: 'var(--accent-coral)', margin: '0 auto 16px' }} />
                <h3 style={{ margin: '0 0 8px 0', fontFamily: 'var(--font-family-display)' }}>
                  No Active Engagements
                </h3>
                <p style={{ margin: '0 auto 20px', color: 'var(--text-secondary)', maxWidth: '440px', fontSize: '0.9375rem' }}>
                  When a brand accepts your application, your production milestone workspace will appear here.
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
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: '16px',
                      border: '1px solid var(--border-subtle)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span className={`badge badge-${eng.status === 'FINAL_APPROVED' || eng.status === 'COMPLETED' ? 'verified' : eng.status === 'REVISION_REQUESTED' ? 'coral' : 'neutral'}`}>
                            {eng.status.replace(/_/g, ' ')}
                          </span>
                          <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                            Brand: <strong>{eng.brand_company_name || 'Brand Partner'}</strong>
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

                    {/* Action to submit deliverable */}
                    {!['COMPLETED', 'FINAL_APPROVED'].includes(eng.status) && (
                      <div
                        style={{
                          padding: '16px',
                          backgroundColor: 'var(--bg-subtle)',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '16px',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                            Deliverable Submission Status: {eng.status}
                          </div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                            {eng.deliverables?.length > 0
                              ? `Latest package submitted: v${eng.deliverables.length}`
                              : 'No initial draft submitted yet.'}
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedEngagementToDeliver(eng)}
                          className="btn btn-primary"
                          style={{ fontSize: '0.875rem' }}
                        >
                          <UploadSimple size={16} />
                          <span>Submit Draft / Revised Package</span>
                        </button>
                      </div>
                    )}

                    {/* Deliverable History */}
                    {eng.deliverables && eng.deliverables.length > 0 && (
                      <div style={{ marginTop: '16px' }}>
                        <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                          Deliverable Version History:
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {eng.deliverables.map((d) => (
                            <div
                              key={d.id}
                              style={{
                                padding: '12px 16px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-subtle)',
                                backgroundColor: 'var(--bg-surface-subtle)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontSize: '0.8125rem',
                              }}
                            >
                              <div>
                                <span style={{ fontWeight: 700, marginRight: '8px', color: 'var(--text-primary)' }}>
                                  v{d.version}: {d.title}
                                </span>
                                <span
                                  className={`badge badge-${
                                    d.status === 'APPROVED'
                                      ? 'verified'
                                      : d.status === 'REVISION_REQUESTED'
                                      ? 'coral'
                                      : d.status === 'SUBMITTED'
                                      ? 'submitted'
                                      : 'neutral'
                                  }`}
                                  style={{ fontSize: '0.625rem' }}
                                >
                                  {d.status}
                                </span>
                                {d.feedback && (
                                  <div style={{ color: 'var(--accent-coral)', marginTop: '4px', fontStyle: 'italic' }}>
                                    Feedback: "{d.feedback}"
                                  </div>
                                )}
                              </div>
                              <a
                                href={d.asset_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-outline"
                                style={{ fontSize: '0.75rem', padding: '6px 12px', color: 'var(--text-primary)' }}
                              >
                                View Asset &rarr;
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Completed Testimonial */}
                    {eng.brand_rating && (
                      <div
                        style={{
                          marginTop: '16px',
                          padding: '16px',
                          backgroundColor: 'var(--accent-lavender-subtle)',
                          borderRadius: '10px',
                          border: '1px solid var(--accent-lavender)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <Star size={18} weight="fill" style={{ color: '#E5A000' }} />
                          <span style={{ fontWeight: 800, fontSize: '0.9375rem' }}>{eng.brand_rating.toFixed(1)} / 5.0 Rating</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.875rem', fontStyle: 'italic', color: 'var(--text-primary)' }}>
                          "{eng.brand_review}"
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Recommended Briefs */}
        {activeTab === 'briefs' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-family-display)' }}>
                Open Campaign Briefs
              </h2>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Active commercial campaigns seeking verified generative AI creators.
              </p>
            </div>

            {openBriefs.length === 0 ? (
              <div
                className="card"
                style={{
                  padding: '48px',
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: '16px',
                }}
              >
                <MagnifyingGlass size={40} style={{ color: 'var(--text-tertiary)', margin: '0 auto 16px' }} />
                <h3 style={{ margin: '0 0 8px 0', fontFamily: 'var(--font-family-display)' }}>
                  No Open Briefs Available
                </h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                  Check back soon as brand partners publish new generative campaigns.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                {openBriefs.map((brief) => (
                  <div
                    key={brief.id}
                    className="card"
                    style={{
                      padding: '24px',
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: '16px',
                      border: '1px solid var(--border-subtle)',
                      boxShadow: 'var(--shadow-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span className="badge badge-coral" style={{ fontSize: '0.6875rem' }}>
                          {brief.content_type || 'VIDEO'}
                        </span>
                        <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          ${brief.budget_amount?.toLocaleString()} {brief.budget_currency}
                        </span>
                      </div>

                      <h3 style={{ margin: '0 0 8px 0', fontSize: '1.125rem', fontWeight: 700, fontFamily: 'var(--font-family-display)' }}>
                        {brief.title}
                      </h3>

                      <p
                        style={{
                          margin: '0 0 16px 0',
                          fontSize: '0.8125rem',
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

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                        {brief.required_skills?.map((s) => (
                          <span key={s.skill_id} className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                      <Link to={`/briefs/${brief.slug || brief.id}`} className="btn btn-ghost" style={{ fontSize: '0.8125rem' }}>
                        View Brief &rarr;
                      </Link>
                      <button
                        onClick={() => setSelectedBriefToApply(brief)}
                        className="btn btn-primary"
                        style={{ fontSize: '0.8125rem', padding: '6px 14px' }}
                      >
                        Apply Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Verification Audits */}
        {activeTab === 'verification' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-family-display)' }}>
                Verification Audits & Claim History
              </h2>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Evidence records submitted for administrative audit and tier promotion.
              </p>
            </div>

            {verificationRequests.length === 0 ? (
              <div
                className="card"
                style={{
                  padding: '48px',
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: '16px',
                }}
              >
                <ShieldCheck size={40} style={{ color: 'var(--accent-lavender)', margin: '0 auto 16px' }} />
                <h3 style={{ margin: '0 0 8px 0', fontFamily: 'var(--font-family-display)' }}>
                  No Verification Requests Submitted
                </h3>
                <p style={{ margin: '0 auto 20px', color: 'var(--text-secondary)', maxWidth: '440px', fontSize: '0.9375rem' }}>
                  When you add portfolio projects, toggle "Submit for Verification" on your workflow evidence to earn verified badges.
                </p>
                <button onClick={() => setIsAddProjectOpen(true)} className="btn btn-primary">
                  Add Verified Evidence
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {verificationRequests.map((req) => (
                  <div
                    key={req.id}
                    className="card"
                    style={{
                      padding: '20px 24px',
                      backgroundColor: 'var(--bg-surface)',
                      borderRadius: '16px',
                      border: '1px solid var(--border-subtle)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '10px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span className={`badge badge-${req.status === 'APPROVED' ? 'verified' : req.status === 'PENDING' ? 'coral' : 'neutral'}`}>
                            {req.status}
                          </span>
                          <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                            Target: {req.target_type}
                          </span>
                        </div>
                        <h4 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>
                          {req.evidence_title || req.verification_scope}
                        </h4>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                        Reviewed by: {req.reviewed_by}
                      </div>
                    </div>

                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                      <strong>Audit Notes:</strong> {req.reviewer_notes || 'Pending administrative review.'}
                    </div>

                    {req.ai_analysis && (
                      <div
                        style={{
                          padding: '12px 16px',
                          backgroundColor: 'var(--bg-subtle)',
                          borderRadius: '8px',
                          fontSize: '0.8125rem',
                          color: 'var(--text-primary)',
                        }}
                      >
                        <div style={{ fontWeight: 700, color: 'var(--accent-lavender)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Sparkle size={14} weight="fill" />
                          <span>Gemini AI Audit Finding:</span>
                        </div>
                        <div>{req.ai_analysis.summary}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreatorAddProjectModal
        isOpen={isAddProjectOpen}
        onClose={() => setIsAddProjectOpen(false)}
        onSuccess={fetchDashboardData}
      />

      <CreatorApplyModal
        isOpen={Boolean(selectedBriefToApply)}
        brief={selectedBriefToApply}
        creatorProjects={profile?.portfolio_projects || []}
        onClose={() => setSelectedBriefToApply(null)}
        onSuccess={() => {
          fetchDashboardData();
          setActiveTab('applications');
        }}
      />

      <DeliverableSubmissionModal
        isOpen={Boolean(selectedEngagementToDeliver)}
        engagement={selectedEngagementToDeliver}
        onClose={() => setSelectedEngagementToDeliver(null)}
        onSuccess={fetchDashboardData}
      />

      <ProjectDeepDiveModal
        isOpen={Boolean(selectedDeepDiveProject)}
        project={selectedDeepDiveProject}
        creator={profile}
        onClose={() => setSelectedDeepDiveProject(null)}
      />
    </div>
  );
}
