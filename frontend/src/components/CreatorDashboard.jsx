import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import AddProjectModal from './AddProjectModal';
import EditCreatorProfileModal from './EditCreatorProfileModal';
import SubmitDeliverableModal from './SubmitDeliverableModal';
import BriefsExplorer from './BriefsExplorer';

export default function CreatorDashboard({
  currentUser,
  onSelectProject,
  onSelectBrief,
  onLogout,
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'profile' | 'portfolio' | 'briefs' | 'applications' | 'collaborations' | 'verification'
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [engagements, setEngagements] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [submittingEngagement, setSubmittingEngagement] = useState(null);

  // Verification request form state
  const [selectedEvidenceProject, setSelectedEvidenceProject] = useState('');
  const [verScope, setVerScope] = useState('');
  const [verSuccessMsg, setVerSuccessMsg] = useState(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [profData, appsData, engsData, verData] = await Promise.all([
        api.getMyCreatorProfile().catch(() => null),
        api.getMyApplications().catch(() => []),
        api.getEngagements().catch(() => []),
        api.getMyVerificationRequests().catch(() => []),
      ]);

      setProfile(profData);
      setApplications(appsData || []);
      setEngagements(engsData || []);
      setVerifications(verData || []);
    } catch (err) {
      console.error('Error loading creator dashboard:', err);
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteProject = async (projId) => {
    if (!window.confirm('Are you sure you want to delete this portfolio project?')) return;
    try {
      await api.deletePortfolioProject(projId);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete project.');
    }
  };

  const handleRequestVerification = async (e) => {
    e.preventDefault();
    if (!profile?.portfolio_projects?.length) {
      alert('Please upload a portfolio project first.');
      return;
    }

    const proj = profile.portfolio_projects.find((p) => p.id === selectedEvidenceProject) || profile.portfolio_projects[0];
    const ev = proj.evidence_records?.[0];

    if (!ev) {
      alert('This project has no evidence record attached. Please edit the project to attach evidence first.');
      return;
    }

    try {
      await api.submitVerificationRequest({
        evidence_id: ev.id,
        target_type: 'PORTFOLIO_PROJECT',
        target_id: proj.id,
        verification_scope: verScope || `Technical audit for ${proj.title}`,
      });
      setVerSuccessMsg('Verification request submitted for administrative review!');
      setVerScope('');
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to submit verification request.');
    }
  };

  if (isLoading && !profile) {
    return (
      <div className="container py-16 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="spinner-sm mb-4" />
        <p className="text-neutral-500 font-serif">Accessing Creator Workspace...</p>
      </div>
    );
  }

  return (
    <div
      className="creator-dashboard-layout"
      style={{
        backgroundImage: 'linear-gradient(rgba(250, 247, 242, 0.94), rgba(250, 247, 242, 0.94)), url(/assets/backgrounds/creator-dashboard.jpg)',
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        minHeight: 'calc(100vh - 72px)',
      }}
    >
      <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside
          className="w-full md:w-64 shrink-0 glass-panel rounded-2xl p-4 flex flex-col justify-between"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.92), rgba(255,255,255,0.92)), url(/assets/backgrounds/sidebar.jpg)',
            backgroundSize: 'cover',
            height: 'fit-content',
          }}
        >
          <div className="space-y-6">
            {/* Creator Mini Profile Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-black/10">
              <img
                src={profile?.avatar_url || '/assets/avatars/elena.jpg'}
                alt={profile?.display_name || 'Creator'}
                className="w-12 h-12 rounded-full object-cover border-2 border-purple-400 shadow-sm"
                style={{
                  width: '48px',
                  height: '48px',
                  minWidth: '48px',
                  maxWidth: '48px',
                  minHeight: '48px',
                  maxHeight: '48px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  flexShrink: 0,
                }}
              />
              <div className="overflow-hidden">
                <h3 className="text-sm font-bold text-neutral-900 truncate">
                  {profile?.display_name || currentUser?.email}
                </h3>
                <p className="text-xs text-purple-700 font-mono truncate">
                  @{profile?.handle || 'creator'}
                </p>
                <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                  {profile?.verification_tier || 'COMMUNITY'}
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="space-y-1">
              {[
                { id: 'overview', label: '📊 Dashboard Overview', icon: '📊' },
                { id: 'profile', label: '👤 Creator Profile', icon: '👤' },
                { id: 'portfolio', label: '🎨 My Portfolio', icon: '🎨', count: profile?.portfolio_projects?.length },
                { id: 'briefs', label: '✨ Discover Briefs', icon: '✨' },
                { id: 'applications', label: '📝 My Applications', icon: '📝', count: applications.length },
                { id: 'collaborations', label: '🤝 Collaborations', icon: '🤝', count: engagements.length },
                { id: 'verification', label: '🛡 Verification & Proofs', icon: '🛡', count: verifications.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                    activeTab === tab.id
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-neutral-700 hover:bg-black/5'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-black/5 text-neutral-600'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="pt-6 border-t border-black/10 mt-6 space-y-2">
            <button
              type="button"
              onClick={() => setIsEditProfileOpen(true)}
              className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-white/80 hover:bg-white text-neutral-800 border border-black/10 text-center transition"
            >
              ⚙ Edit Profile Details
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="w-full py-2 px-3 text-xs font-semibold rounded-xl text-red-600 hover:bg-red-50 text-center transition"
            >
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Workspace Area */}
        <main className="flex-1 min-w-0">
          {error && (
            <div className="banner-error mb-6 p-4 rounded-xl bg-red-100 border border-red-200 text-red-800 text-xs">
              {error}
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Welcome Header */}
              <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <span className="badge-editorial">
                    <span className="badge-dot" />
                    CREATOR WORKSPACE
                  </span>
                  <h1 className="text-2xl font-serif font-bold text-neutral-900 mt-1">
                    Welcome back, <span className="serif-italic-accent">{profile?.display_name || 'Creator'}</span>
                  </h1>
                  <p className="text-xs text-neutral-600 mt-1">
                    Manage your audited portfolio, pitch for premium brand briefs, and submit master deliverables.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-primary text-xs"
                    onClick={() => setIsAddProjectOpen(true)}
                  >
                    + Add New Project
                  </button>
                  <button
                    type="button"
                    className="btn-secondary text-xs"
                    onClick={() => setActiveTab('briefs')}
                  >
                    Explore Briefs →
                  </button>
                </div>
              </div>

              {/* Verified Metrics Stat Cards (derived from real DB records) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-panel p-4 rounded-xl text-center">
                  <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
                    Portfolio Works
                  </span>
                  <span className="text-2xl font-serif font-bold text-neutral-900">
                    {profile?.portfolio_projects?.length || 0}
                  </span>
                </div>
                <div className="glass-panel p-4 rounded-xl text-center">
                  <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
                    Completed Projects
                  </span>
                  <span className="text-2xl font-serif font-bold text-purple-700">
                    {profile?.completed_projects_count || 0}
                  </span>
                </div>
                <div className="glass-panel p-4 rounded-xl text-center">
                  <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
                    Audited Claims
                  </span>
                  <span className="text-2xl font-serif font-bold text-emerald-600">
                    {profile?.verified_claims_count || 0} ✓
                  </span>
                </div>
                <div className="glass-panel p-4 rounded-xl text-center">
                  <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
                    Average Rating
                  </span>
                  <span className="text-2xl font-serif font-bold text-neutral-900">
                    ★ {profile?.average_rating || 5.0}
                  </span>
                </div>
              </div>

              {/* Active Engagements / Collaborations */}
              <div className="glass-panel p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-neutral-900 font-serif">
                    Active Campaign Collaborations ({engagements.length})
                  </h3>
                  <button
                    type="button"
                    className="text-xs text-purple-700 hover:underline font-semibold"
                    onClick={() => setActiveTab('collaborations')}
                  >
                    View All →
                  </button>
                </div>

                {engagements.length === 0 ? (
                  <div className="p-8 text-center text-neutral-400 text-xs">
                    No active campaign engagements yet. Pitch to open campaign briefs to start collaborating!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {engagements.slice(0, 3).map((eng) => (
                      <div
                        key={eng.id}
                        className="p-4 rounded-xl border border-black/5 bg-white/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-100 text-purple-800">
                              {eng.status}
                            </span>
                            <h4 className="text-sm font-bold text-neutral-900">{eng.brief_title}</h4>
                          </div>
                          <p className="text-xs text-neutral-500 mt-1">
                            Brand: <strong>{eng.brand_company_name || 'Lumina'}</strong> • Agreed: ${eng.agreed_amount?.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="btn-primary text-xs py-1.5 px-3"
                            onClick={() => setSubmittingEngagement(eng)}
                          >
                            Submit Deliverable
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Applications */}
              <div className="glass-panel p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-neutral-900 font-serif">
                    Recent Pitch Submissions ({applications.length})
                  </h3>
                  <button
                    type="button"
                    className="text-xs text-purple-700 hover:underline font-semibold"
                    onClick={() => setActiveTab('applications')}
                  >
                    View All →
                  </button>
                </div>

                {applications.length === 0 ? (
                  <div className="p-8 text-center text-neutral-400 text-xs">
                    No submitted pitches yet. Browse available briefs to apply!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {applications.slice(0, 3).map((app) => (
                      <div
                        key={app.id}
                        className="p-4 rounded-xl border border-black/5 bg-white/60 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                app.status === 'ACCEPTED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : app.status === 'REJECTED'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {app.status}
                            </span>
                            <span className="text-xs font-semibold text-neutral-800">
                              Proposed Rate: ${app.proposed_rate?.toLocaleString()} ({app.proposed_timeline_days} days)
                            </span>
                          </div>
                          <p className="text-xs text-neutral-600 mt-1 line-clamp-1 italic">
                            "{app.pitch_text}"
                          </p>
                        </div>
                        <span className="text-[10px] text-neutral-400">
                          {new Date(app.submitted_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="glass-panel p-6 rounded-2xl">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <img
                      src={profile?.avatar_url || '/assets/avatars/elena.jpg'}
                      alt={profile?.display_name}
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-purple-400 shadow-md"
                      style={{
                        width: '72px',
                        height: '72px',
                        minWidth: '72px',
                        maxWidth: '72px',
                        minHeight: '72px',
                        maxHeight: '72px',
                        borderRadius: '16px',
                        objectFit: 'cover',
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <h2 className="text-xl font-serif font-bold text-neutral-900">
                        {profile?.display_name}
                      </h2>
                      <p className="text-xs text-purple-700 font-mono">@{profile?.handle}</p>
                      <p className="text-xs text-neutral-600 mt-1">{profile?.primary_specialization}</p>
                      <p className="text-xs text-neutral-500">📍 {profile?.location || 'Global'} • {profile?.years_experience} Years Experience</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-primary text-xs"
                    onClick={() => setIsEditProfileOpen(true)}
                  >
                    Edit Profile
                  </button>
                </div>

                <div className="mt-6 pt-6 border-t border-black/10">
                  <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                    Creative Manifesto & Biography
                  </h4>
                  <p className="text-xs text-neutral-700 leading-relaxed">
                    {profile?.bio || 'No biography set.'}
                  </p>
                </div>

                {/* Rates & Terms */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-black/10">
                  <div>
                    <span className="text-[11px] font-bold text-neutral-500 uppercase block">Min Budget</span>
                    <span className="text-sm font-bold text-neutral-900">${profile?.min_budget?.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-neutral-500 uppercase block">Hourly Rate</span>
                    <span className="text-sm font-bold text-neutral-900">${profile?.hourly_rate}/hr</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-neutral-500 uppercase block">Portfolio Link</span>
                    <a
                      href={profile?.website_url || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-purple-700 hover:underline truncate block"
                    >
                      {profile?.website_url || 'kivora.dev/@creator'}
                    </a>
                  </div>
                </div>

                {/* Skills & Tools */}
                <div className="mt-6 pt-6 border-t border-black/10 space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                      Disciplines & Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {profile?.skills?.map((s) => (
                        <span key={s.skill_id} className="tag-pill text-xs">
                          {s.name} ({s.proficiency_level})
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                      AI Tools & Pipeline Stacks
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {profile?.tools?.map((t) => (
                        <span
                          key={t.tool_id}
                          className={`tag-pill text-xs flex items-center gap-1.5 ${
                            t.is_claim_verified
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                              : 'bg-white'
                          }`}
                        >
                          {t.is_claim_verified && <span className="text-emerald-600">✓</span>}
                          {t.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PORTFOLIO */}
          {activeTab === 'portfolio' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-serif font-bold text-neutral-900">
                    My Masterpiece Portfolio ({profile?.portfolio_projects?.length || 0})
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Audited creative portfolio entries with attached workflow node graphs and evidence records.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-primary text-xs"
                  onClick={() => {
                    setEditingProject(null);
                    setIsAddProjectOpen(true);
                  }}
                >
                  + Add Project
                </button>
              </div>

              {profile?.portfolio_projects?.length === 0 ? (
                <div className="glass-panel p-12 text-center rounded-2xl">
                  <p className="text-neutral-500 text-xs mb-4">You have not uploaded any portfolio projects yet.</p>
                  <button
                    type="button"
                    className="btn-primary text-xs"
                    onClick={() => setIsAddProjectOpen(true)}
                  >
                    Publish First Masterpiece
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profile?.portfolio_projects?.map((proj) => (
                    <div
                      key={proj.id}
                      className="glass-panel rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
                    >
                      <div
                        className="cursor-pointer relative aspect-video bg-neutral-900"
                        onClick={() => onSelectProject(proj)}
                      >
                        <img
                          src={proj.thumbnail_url || proj.primary_asset_url}
                          alt={proj.title}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold rounded bg-black/70 text-white uppercase">
                          {proj.content_type}
                        </span>
                        {proj.featured && (
                          <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-bold rounded bg-purple-600 text-white">
                            ★ Featured
                          </span>
                        )}
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <h4
                            className="text-sm font-bold text-neutral-900 hover:text-purple-700 cursor-pointer line-clamp-1"
                            onClick={() => onSelectProject(proj)}
                          >
                            {proj.title}
                          </h4>
                          <p className="text-xs text-neutral-500 line-clamp-2 mt-1">
                            {proj.description || 'No description provided.'}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-black/10 flex items-center justify-between text-xs">
                          <span className="text-[10px] text-neutral-500 font-mono">
                            {proj.aspect_ratio} • {proj.resolution || '4K'}
                          </span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="text-xs text-purple-700 hover:underline font-semibold"
                              onClick={() => {
                                setEditingProject(proj);
                                setIsAddProjectOpen(true);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="text-xs text-red-500 hover:underline"
                              onClick={() => handleDeleteProject(proj.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: BRIEFS */}
          {activeTab === 'briefs' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-serif font-bold text-neutral-900">
                  Open Campaign Briefs
                </h2>
                <p className="text-xs text-neutral-500">
                  Commercial briefs published by verified brands. Submit your pitch with custom rates and portfolio evidence.
                </p>
              </div>

              <BriefsExplorer onSelectBrief={onSelectBrief} onOpenAiBuilder={() => {}} />
            </div>
          )}

          {/* TAB 5: APPLICATIONS */}
          {activeTab === 'applications' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-serif font-bold text-neutral-900">
                  Submitted Campaign Applications ({applications.length})
                </h2>
                <p className="text-xs text-neutral-500">
                  Track the real-time status of your proposals and brand review decisions.
                </p>
              </div>

              {applications.length === 0 ? (
                <div className="glass-panel p-12 text-center rounded-2xl">
                  <p className="text-neutral-500 text-xs">No submitted proposals found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div key={app.id} className="glass-panel p-5 rounded-2xl space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                                app.status === 'ACCEPTED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : app.status === 'REJECTED'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {app.status}
                            </span>
                            <span className="text-xs text-neutral-400">
                              Submitted: {new Date(app.submitted_at).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-sm font-semibold">
                            <span>Proposed Rate: ${app.proposed_rate?.toLocaleString()}</span>
                            <span>•</span>
                            <span>Timeline: {app.proposed_timeline_days} Days</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-white/70 border border-black/5 text-xs text-neutral-700">
                        <strong className="block text-neutral-900 mb-1">Your Pitch:</strong>
                        {app.pitch_text}
                      </div>

                      {app.brand_feedback && (
                        <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900">
                          <strong>Brand Feedback:</strong> {app.brand_feedback}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: COLLABORATIONS */}
          {activeTab === 'collaborations' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-serif font-bold text-neutral-900">
                  Active Engagements & Master Deliverables ({engagements.length})
                </h2>
                <p className="text-xs text-neutral-500">
                  Submit master asset versions, handle revision notes, and track commercial approvals.
                </p>
              </div>

              {engagements.length === 0 ? (
                <div className="glass-panel p-12 text-center rounded-2xl">
                  <p className="text-neutral-500 text-xs">No active campaign engagements currently assigned.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {engagements.map((eng) => (
                    <div key={eng.id} className="glass-panel p-6 rounded-2xl space-y-4">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-4 border-b border-black/10">
                        <div>
                          <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-purple-100 text-purple-800">
                            {eng.status}
                          </span>
                          <h3 className="text-lg font-serif font-bold text-neutral-900 mt-1">
                            {eng.brief_title}
                          </h3>
                          <p className="text-xs text-neutral-500">
                            Brand: <strong>{eng.brand_company_name}</strong> • Agreed Budget: ${eng.agreed_amount?.toLocaleString()}
                          </p>
                        </div>
                        {eng.status !== 'COMPLETED' && (
                          <button
                            type="button"
                            className="btn-primary text-xs"
                            onClick={() => setSubmittingEngagement(eng)}
                          >
                            + Submit Deliverable Version
                          </button>
                        )}
                      </div>

                      {/* Deliverables History */}
                      <div>
                        <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                          Deliverables History ({eng.deliverables?.length || 0})
                        </h4>
                        <div className="space-y-2">
                          {eng.deliverables?.map((d) => (
                            <div
                              key={d.id}
                              className="p-3 rounded-xl border border-black/5 bg-white/70 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 text-xs"
                            >
                              <div>
                                <span className="font-bold text-purple-700 mr-2">v{d.version}</span>
                                <strong>{d.title}</strong>
                                <p className="text-neutral-500 font-mono text-[11px] truncate max-w-md">
                                  {d.asset_url}
                                </p>
                                {d.notes && <p className="text-neutral-600 mt-1 italic">"{d.notes}"</p>}
                                {d.feedback && (
                                  <p className="text-amber-800 mt-1 bg-amber-50 p-1.5 rounded border border-amber-200">
                                    <strong>Revision Feedback:</strong> {d.feedback}
                                  </p>
                                )}
                              </div>
                              <span
                                className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                  d.status === 'APPROVED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : d.status === 'REVISION_REQUESTED'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-purple-100 text-purple-800'
                                }`}
                              >
                                {d.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Final Review Display if Completed */}
                      {eng.brand_rating && (
                        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold">★ {eng.brand_rating} / 5.0 Rating Received</span>
                          </div>
                          <p className="italic">"{eng.brand_review}"</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: VERIFICATION */}
          {activeTab === 'verification' && (
            <div className="space-y-6">
              <div className="glass-panel p-6 rounded-2xl">
                <span className="badge-editorial">
                  <span className="badge-dot" />
                  PROOF-OF-WORK AUDIT
                </span>
                <h2 className="text-xl font-serif font-bold text-neutral-900 mt-1">
                  Creator Verification Desk
                </h2>
                <p className="text-xs text-neutral-600 mt-1">
                  Submit reproducibility node graphs, raw seeds, and workflow proof records for administrative audit.
                </p>

                {verSuccessMsg && (
                  <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg">
                    {verSuccessMsg}
                  </div>
                )}

                {/* Submit New Request Form */}
                <form onSubmit={handleRequestVerification} className="mt-6 p-4 rounded-xl bg-white/70 border border-black/5 space-y-3">
                  <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wider">
                    Submit New Audit Request
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label-form">Select Portfolio Project</label>
                      <select
                        className="input-text w-full"
                        value={selectedEvidenceProject}
                        onChange={(e) => setSelectedEvidenceProject(e.target.value)}
                      >
                        {profile?.portfolio_projects?.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title} ({p.content_type})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label-form">Audit Scope</label>
                      <input
                        type="text"
                        className="input-text w-full"
                        placeholder="e.g. ComfyUI seed reproducibility"
                        value={verScope}
                        onChange={(e) => setVerScope(e.target.value)}
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn-primary text-xs">
                    Submit for Administrative Audit
                  </button>
                </form>
              </div>

              {/* Existing Verification Records */}
              <div className="glass-panel p-6 rounded-2xl space-y-4">
                <h3 className="text-base font-bold text-neutral-900 font-serif">
                  Audited Verification Records ({verifications.length})
                </h3>

                {verifications.length === 0 ? (
                  <div className="p-8 text-center text-neutral-400 text-xs">
                    No verification requests submitted yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {verifications.map((v) => (
                      <div key={v.id} className="p-4 rounded-xl border border-black/5 bg-white/60 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                              v.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : v.status === 'REJECTED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {v.status}
                          </span>
                          <span className="text-neutral-400 text-[10px]">
                            {new Date(v.reviewed_at).toLocaleDateString()}
                          </span>
                        </div>

                        <div>
                          <strong>{v.verification_scope}</strong>
                          <p className="text-neutral-500 mt-0.5">
                            Target: {v.target_type} • Evidence: {v.evidence_title}
                          </p>
                        </div>

                        {v.reviewer_notes && (
                          <div className="p-2.5 rounded-lg bg-neutral-50 text-neutral-700 text-[11px]">
                            <strong>Auditor Notes:</strong> {v.reviewer_notes}
                          </div>
                        )}

                        {v.ai_analysis && (
                          <div className="p-3 rounded-lg bg-purple-50/50 border border-purple-200/50 text-[11px] text-purple-900 space-y-1">
                            <span className="font-bold block text-purple-700">
                              🤖 Gemini AI Assisted Evidence Analysis:
                            </span>
                            <p>{v.ai_analysis.summary}</p>
                            {v.ai_analysis.potential_inconsistencies?.length > 0 && (
                              <p className="text-amber-800">
                                <strong>Flags:</strong> {v.ai_analysis.potential_inconsistencies.join(', ')}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {isAddProjectOpen && (
        <AddProjectModal
          isOpen={isAddProjectOpen}
          onClose={() => {
            setIsAddProjectOpen(false);
            setEditingProject(null);
          }}
          existingProject={editingProject}
          onProjectSaved={() => loadData()}
        />
      )}

      {isEditProfileOpen && (
        <EditCreatorProfileModal
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          currentProfile={profile}
          onProfileUpdated={(updated) => setProfile(updated)}
        />
      )}

      {submittingEngagement && (
        <SubmitDeliverableModal
          isOpen={Boolean(submittingEngagement)}
          onClose={() => setSubmittingEngagement(null)}
          engagement={submittingEngagement}
          onDeliverableSubmitted={() => loadData()}
        />
      )}
    </div>
  );
}
