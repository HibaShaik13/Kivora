import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import CreateBriefModal from './CreateBriefModal';
import EditBrandProfileModal from './EditBrandProfileModal';
import ReviewEngagementModal from './ReviewEngagementModal';
import CreatorDiscovery from './CreatorDiscovery';

export default function BrandDashboard({
  currentUser,
  onOpenAiBuilder,
  onSelectCreator,
  onSelectProject,
  onSelectBrief,
  onLogout,
}) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'profile' | 'briefs' | 'applications' | 'engagements' | 'creators'
  const [profile, setProfile] = useState(null);
  const [briefs, setBriefs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [engagements, setEngagements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [isCreateBriefOpen, setIsCreateBriefOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [reviewModalData, setReviewModalData] = useState(null); // { engagement, mode: 'revision' | 'approve' | 'review' }

  // Selected brief for viewing applications
  const [selectedBriefId, setSelectedBriefId] = useState('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [profData, briefsData, engsData] = await Promise.all([
        api.getMyBrandProfile().catch(() => null),
        api.getBriefs().catch(() => []),
        api.getEngagements().catch(() => []),
      ]);

      setProfile(profData);
      setBriefs(briefsData || []);
      setEngagements(engsData || []);

      // Load all applications across this brand's briefs
      if (briefsData?.length > 0) {
        const allAppsPromises = briefsData.map((b) =>
          api.getBriefApplications(b.id).catch(() => [])
        );
        const results = await Promise.all(allAppsPromises);
        const flattened = results.flat();
        setApplications(flattened);
      }
    } catch (err) {
      console.error('Error loading brand dashboard:', err);
      setError(err.message || 'Failed to load brand dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApplicationStatus = async (appId, status, feedback = '') => {
    try {
      await api.updateApplicationStatus(appId, {
        status,
        brand_feedback: feedback || undefined,
      });
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to update application status.');
    }
  };

  const handleBriefStatusChange = async (briefId, status) => {
    if (status === 'CLOSED' && !window.confirm('Are you sure you want to close this campaign brief? Creators will no longer be able to submit pitches.')) return;
    try {
      await api.updateBriefStatus(briefId, status);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to update brief status.');
    }
  };

  const handleDeleteBrief = async (briefId) => {
    if (!window.confirm('Are you sure you want to delete or cancel this campaign brief?')) return;
    try {
      await api.deleteBrief(briefId);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete brief.');
    }
  };

  if (isLoading && !profile) {
    return (
      <div className="container py-16 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="spinner-sm mb-4" />
        <p className="text-neutral-500 font-serif">Accessing Brand Portal...</p>
      </div>
    );
  }

  return (
    <div
      className="brand-dashboard-layout"
      style={{
        backgroundImage: 'linear-gradient(rgba(250, 247, 242, 0.94), rgba(250, 247, 242, 0.94)), url(/assets/backgrounds/brand-dashboard.jpg)',
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
            {/* Brand Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-black/10">
              <img
                src={profile?.logo_url || '/assets/brands/lumina.png'}
                alt={profile?.company_name || 'Brand'}
                className="brand-sidebar-logo"
                style={{ width: '44px', height: '44px', minWidth: '44px', maxWidth: '44px', minHeight: '44px', maxHeight: '44px', borderRadius: '12px', objectFit: 'contain', flexShrink: 0, background: '#fff', border: '1px solid rgba(0,0,0,0.1)', padding: '2px' }}
              />
              <div className="overflow-hidden">
                <h3 className="text-sm font-bold text-neutral-900 truncate">
                  {profile?.company_name || 'Lumina Skincare'}
                </h3>
                <p className="text-xs text-neutral-500 truncate">
                  {profile?.industry || 'Luxury Brand'}
                </p>
                <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Verified Brand ✓
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="space-y-1">
              {[
                { id: 'overview', label: '📊 Brand Overview', icon: '📊' },
                { id: 'profile', label: '🏢 Brand Organization', icon: '🏢' },
                { id: 'briefs', label: '📋 Campaign Briefs', icon: '📋', count: briefs.length },
                { id: 'applications', label: '📥 Pitch Proposals', icon: '📥', count: applications.length },
                { id: 'engagements', label: '🤝 Collaborations', icon: '🤝', count: engagements.length },
                { id: 'creators', label: '🔍 Discover Creators', icon: '🔍' },
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
              ⚙ Edit Brand Settings
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

        {/* Main Brand Workspace */}
        <main className="flex-1 min-w-0">
          {error && (
            <div className="banner-error mb-6 p-4 rounded-xl bg-red-100 border border-red-200 text-red-800 text-xs">
              {error}
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <span className="badge-editorial">
                    <span className="badge-dot" />
                    BRAND DESK
                  </span>
                  <h1 className="text-2xl font-serif font-bold text-neutral-900 mt-1">
                    {profile?.company_name || 'Brand'} <span className="serif-italic-accent">Command Center</span>
                  </h1>
                  <p className="text-xs text-neutral-600 mt-1">
                    Commission audited AI commercial talent, generate briefs with Gemini, and sign off master deliverables.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-primary text-xs"
                    onClick={() => setIsCreateBriefOpen(true)}
                  >
                    + Launch Brief
                  </button>
                  <button
                    type="button"
                    className="btn-secondary text-xs flex items-center gap-1.5"
                    onClick={onOpenAiBuilder}
                  >
                    ✨ AI Brief Builder
                  </button>
                </div>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-panel p-4 rounded-xl text-center">
                  <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
                    Total Briefs
                  </span>
                  <span className="text-2xl font-serif font-bold text-neutral-900">{briefs.length}</span>
                </div>
                <div className="glass-panel p-4 rounded-xl text-center">
                  <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
                    Pitches Received
                  </span>
                  <span className="text-2xl font-serif font-bold text-purple-700">
                    {applications.length}
                  </span>
                </div>
                <div className="glass-panel p-4 rounded-xl text-center">
                  <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
                    Active Collaborations
                  </span>
                  <span className="text-2xl font-serif font-bold text-emerald-600">
                    {engagements.length}
                  </span>
                </div>
                <div className="glass-panel p-4 rounded-xl text-center">
                  <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
                    Completed Works
                  </span>
                  <span className="text-2xl font-serif font-bold text-neutral-900">
                    {engagements.filter((e) => e.status === 'COMPLETED').length}
                  </span>
                </div>
              </div>

              {/* Pending Applications Review Alert */}
              <div className="glass-panel p-6 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-neutral-900 font-serif">
                    Recent Creator Pitch Proposals ({applications.length})
                  </h3>
                  <button
                    type="button"
                    className="text-xs text-purple-700 hover:underline font-semibold"
                    onClick={() => setActiveTab('applications')}
                  >
                    Review All →
                  </button>
                </div>

                {applications.length === 0 ? (
                  <div className="p-8 text-center text-neutral-400 text-xs">
                    No submitted pitches pending review. Launch a campaign brief to receive pitches from vetted creators!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {applications.slice(0, 3).map((app) => (
                      <div
                        key={app.id}
                        className="p-4 rounded-xl border border-black/5 bg-white/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '0.875rem 1rem', borderRadius: '0.875rem', background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(19,19,22,0.06)' }}
                      >
                        <div className="flex items-center gap-3" style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', minWidth: 0, flex: 1 }}>
                          <img
                            src={app.creator_avatar_url || '/assets/avatars/elena.jpg'}
                            alt={app.creator_display_name}
                            className="pitch-creator-avatar"
                            style={{ width: '48px', height: '48px', minWidth: '48px', maxWidth: '48px', minHeight: '48px', maxHeight: '48px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid rgba(121,82,236,0.25)' }}
                          />
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <h4 className="text-sm font-bold text-neutral-900" style={{ fontSize: '0.875rem', fontWeight: 700, margin: 0, color: '#131316' }}>
                                {app.creator_display_name}
                              </h4>
                              <span className="text-xs text-purple-700 font-mono" style={{ fontSize: '0.75rem', color: '#7952EC', fontFamily: 'monospace' }}>
                                @{app.creator_handle}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-600 italic line-clamp-1" style={{ fontSize: '0.75rem', color: '#6C6C75', fontStyle: 'italic', margin: '0.2rem 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              "{app.pitch_text}"
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                          <span className="text-xs font-bold text-neutral-900" style={{ fontSize: '0.75rem', fontWeight: 700, color: '#131316' }}>
                            ${app.proposed_rate?.toLocaleString()} ({app.proposed_timeline_days}d)
                          </span>
                          {app.status === 'SUBMITTED' ? (
                            <div className="flex gap-1.5" style={{ display: 'flex', gap: '0.35rem' }}>
                              <button
                                type="button"
                                className="btn-primary text-xs py-1 px-2.5"
                                style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                                onClick={() => handleApplicationStatus(app.id, 'ACCEPTED')}
                              >
                                Accept & Hire
                              </button>
                              <button
                                type="button"
                                className="btn-secondary text-xs py-1 px-2.5"
                                style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                                onClick={() => handleApplicationStatus(app.id, 'REJECTED')}
                              >
                                Decline
                              </button>
                            </div>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-neutral-100 text-neutral-700" style={{ padding: '0.2rem 0.6rem', fontSize: '0.65rem', fontWeight: 700, borderRadius: '9999px', background: app.status === 'ACCEPTED' ? '#ECFDF5' : '#F3F4F6', color: app.status === 'ACCEPTED' ? '#065F46' : '#374151' }}>
                              {app.status}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: BRAND PROFILE */}
          {activeTab === 'profile' && (
            <div className="glass-panel p-6 rounded-2xl space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <img
                    src={profile?.logo_url || '/assets/brands/lumina.png'}
                    alt={profile?.company_name}
                    className="w-20 h-20 rounded-2xl object-contain bg-white border border-black/10 p-2 shadow-md"
                    style={{
                      width: '72px',
                      height: '72px',
                      minWidth: '72px',
                      maxWidth: '72px',
                      minHeight: '72px',
                      maxHeight: '72px',
                      borderRadius: '16px',
                      objectFit: 'contain',
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <h2 className="text-xl font-serif font-bold text-neutral-900">
                      {profile?.company_name}
                    </h2>
                    <p className="text-xs text-purple-700 font-mono">slug: {profile?.slug}</p>
                    <p className="text-xs text-neutral-600 mt-1">{profile?.industry}</p>
                    <p className="text-xs text-neutral-500">
                      📍 {profile?.headquarters || 'Paris'} • {profile?.company_size || '50-200'} Employees
                    </p>
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

              <div className="pt-6 border-t border-black/10">
                <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                  Brand Narrative & Values
                </h4>
                <p className="text-xs text-neutral-700 leading-relaxed">
                  {profile?.description || 'No description provided.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-black/10">
                <div>
                  <span className="text-[11px] font-bold text-neutral-500 uppercase block">Official Website</span>
                  <a
                    href={profile?.website_url || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-purple-700 hover:underline"
                  >
                    {profile?.website_url || 'https://brand.com'}
                  </a>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-neutral-500 uppercase block">Verification Status</span>
                  <span className="text-xs text-emerald-700 font-bold">Audited & Verified Brand ✓</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CAMPAIGN BRIEFS */}
          {activeTab === 'briefs' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-serif font-bold text-neutral-900">
                    Campaign Briefs ({briefs.length})
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Manage your campaign objectives, deliverables criteria, and application lifecycle.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-secondary text-xs"
                    onClick={onOpenAiBuilder}
                  >
                    ✨ AI Brief Builder
                  </button>
                  <button
                    type="button"
                    className="btn-primary text-xs"
                    onClick={() => setIsCreateBriefOpen(true)}
                  >
                    + Create Brief
                  </button>
                </div>
              </div>

              {briefs.length === 0 ? (
                <div className="glass-panel p-12 text-center rounded-2xl">
                  <p className="text-neutral-500 text-xs mb-4">No campaign briefs launched yet.</p>
                  <button
                    type="button"
                    className="btn-primary text-xs"
                    onClick={() => setIsCreateBriefOpen(true)}
                  >
                    Launch Your First Brief
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {briefs.map((brief) => (
                    <div key={brief.id} className="glass-panel p-5 rounded-2xl space-y-4">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                                brief.status === 'PUBLISHED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : brief.status === 'CLOSED'
                                  ? 'bg-neutral-100 text-neutral-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {brief.status}
                            </span>
                            <span className="text-xs text-neutral-400 font-mono">
                              {brief.content_type} • {brief.aspect_ratio}
                            </span>
                          </div>
                          <h3
                            className="text-base font-bold text-neutral-900 mt-1 cursor-pointer hover:text-purple-700"
                            onClick={() => onSelectBrief(brief)}
                          >
                            {brief.title}
                          </h3>
                        </div>

                        <div className="text-right">
                          <span className="text-lg font-serif font-bold text-neutral-900">
                            ${brief.budget_amount?.toLocaleString()} {brief.budget_currency}
                          </span>
                          <span className="text-[11px] text-neutral-500 block">
                            {brief.applications_count || 0} Pitches Submitted
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-neutral-600 line-clamp-2">
                        {brief.campaign_objective}
                      </p>

                      <div className="brief-card-actions-bar pt-4 border-t border-black/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <button
                          type="button"
                          className="brief-btn-primary"
                          onClick={() => onSelectBrief(brief)}
                        >
                          <span>View Brief & Matches</span>
                          <span className="brief-btn-arrow">→</span>
                        </button>
                        <div className="flex items-center gap-2 flex-wrap">
                          {brief.status === 'DRAFT' && (
                            <button
                              type="button"
                              className="brief-btn-publish"
                              onClick={() => handleBriefStatusChange(brief.id, 'PUBLISHED')}
                              title="Publish this brief to open for pitches"
                            >
                              <span>🚀 Publish Brief</span>
                            </button>
                          )}
                          {brief.status === 'PUBLISHED' && (
                            <button
                              type="button"
                              className="brief-btn-secondary"
                              onClick={() => handleBriefStatusChange(brief.id, 'CLOSED')}
                              title="Close this brief to stop new pitches"
                            >
                              <span>⏸ Close Brief</span>
                            </button>
                          )}
                          {brief.status === 'CLOSED' && (
                            <span className="brief-status-tag-closed">
                              Status: Closed
                            </span>
                          )}
                          <button
                            type="button"
                            className="brief-btn-danger"
                            onClick={() => handleDeleteBrief(brief.id)}
                            title="Delete this campaign brief"
                          >
                            <span>🗑 Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: APPLICATIONS */}
          {activeTab === 'applications' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-serif font-bold text-neutral-900">
                  Pitch Proposals Received ({applications.length})
                </h2>
                <p className="text-xs text-neutral-500">
                  Evaluate creator proposals, review attached portfolios, and accept bids to initiate collaborations.
                </p>
              </div>

              {applications.length === 0 ? (
                <div className="glass-panel p-12 text-center rounded-2xl">
                  <p className="text-neutral-500 text-xs">No pitch proposals received yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div key={app.id} className="glass-panel p-5 rounded-2xl space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={app.creator_avatar_url || '/assets/avatars/elena.jpg'}
                            alt={app.creator_display_name}
                            className="w-12 h-12 rounded-full object-cover border border-purple-300 shadow-sm"
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
                          <div>
                            <h4
                              className="text-sm font-bold text-neutral-900 cursor-pointer hover:text-purple-700"
                              onClick={() => onSelectCreator({ id: app.creator_id })}
                            >
                              {app.creator_display_name}
                            </h4>
                            <p className="text-xs text-purple-700 font-mono">@{app.creator_handle}</p>
                            <span className="text-[11px] text-neutral-400">
                              Proposed: ${app.proposed_rate?.toLocaleString()} • {app.proposed_timeline_days} Days
                            </span>
                          </div>
                        </div>

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
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-white/70 border border-black/5 text-xs text-neutral-700">
                        <strong className="block text-neutral-900 mb-1">Creator Pitch:</strong>
                        {app.pitch_text}
                      </div>

                      {app.status === 'SUBMITTED' && (
                        <div className="pt-2 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            className="btn-secondary text-xs py-1.5 px-3"
                            onClick={() => handleApplicationStatus(app.id, 'REJECTED')}
                          >
                            Decline Proposal
                          </button>
                          <button
                            type="button"
                            className="btn-primary text-xs py-1.5 px-4"
                            onClick={() => handleApplicationStatus(app.id, 'ACCEPTED')}
                          >
                            Accept & Hire Creator
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ENGAGEMENTS */}
          {activeTab === 'engagements' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-serif font-bold text-neutral-900">
                  Active Campaigns & Deliverables ({engagements.length})
                </h2>
                <p className="text-xs text-neutral-500">
                  Review submitted master asset files, request revisions, approve deliverables, and publish reviews.
                </p>
              </div>

              {engagements.length === 0 ? (
                <div className="glass-panel p-12 text-center rounded-2xl">
                  <p className="text-neutral-500 text-xs">No active campaign collaborations.</p>
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
                            Creator: <strong>{eng.creator_display_name}</strong> (@{eng.creator_handle}) • Budget: ${eng.agreed_amount?.toLocaleString()}
                          </p>
                        </div>

                        {/* Action Buttons based on status */}
                        <div className="flex items-center gap-2">
                          {eng.status === 'DRAFT_SUBMITTED' && (
                            <>
                              <button
                                type="button"
                                className="btn-secondary text-xs"
                                onClick={() => setReviewModalData({ engagement: eng, mode: 'revision' })}
                              >
                                Request Revisions
                              </button>
                              <button
                                type="button"
                                className="btn-primary text-xs bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => setReviewModalData({ engagement: eng, mode: 'approve' })}
                              >
                                Final Approval ✓
                              </button>
                            </>
                          )}

                          {eng.status === 'FINAL_APPROVED' && (
                            <button
                              type="button"
                              className="btn-primary text-xs"
                              onClick={() => setReviewModalData({ engagement: eng, mode: 'review' })}
                            >
                              ★ Rate & Review Creator
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Project Progress & Milestone Track */}
                      <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-100 space-y-3">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-purple-900 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></span>
                            Milestone: <strong>{eng.current_milestone || 'In Progress'}</strong>
                          </span>
                          <span className="text-purple-700 font-bold">{eng.progress_percentage || 25}% Progress</span>
                        </div>
                        <div className="w-full bg-purple-200/60 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-purple-600 h-2 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${eng.progress_percentage || 25}%` }}
                          />
                        </div>

                        {/* Milestones Stepper */}
                        {eng.milestones && eng.milestones.length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1 text-[11px]">
                            {eng.milestones.map((m) => (
                              <div
                                key={m.id}
                                className={`p-2 rounded-lg border ${
                                  m.status === 'COMPLETED'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    : m.status === 'IN_PROGRESS'
                                    ? 'bg-purple-100 border-purple-300 text-purple-900 font-semibold'
                                    : 'bg-white/60 border-black/5 text-neutral-400'
                                }`}
                              >
                                <div className="flex items-center gap-1">
                                  <span>{m.status === 'COMPLETED' ? '✓' : m.status === 'IN_PROGRESS' ? '⏳' : '○'}</span>
                                  <span className="truncate">{m.title}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Deliverables Audit */}
                      <div>
                        <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                          Deliverables Package ({eng.deliverables?.length || 0})
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

                      {eng.brand_rating && (
                        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                          <strong>Your Rating: ★ {eng.brand_rating} / 5.0</strong>
                          <p className="italic mt-1">"{eng.brand_review}"</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: CREATORS DIRECTORY */}
          {activeTab === 'creators' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-serif font-bold text-neutral-900">
                  Discover Audited AI Creators
                </h2>
                <p className="text-xs text-neutral-500">
                  Search across verified skill taxonomies, generative AI tool stacks, and commercial video specialists.
                </p>
              </div>

              <CreatorDiscovery
                onSelectCreator={onSelectCreator}
                onSelectProject={onSelectProject}
              />
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {isCreateBriefOpen && (
        <CreateBriefModal
          isOpen={isCreateBriefOpen}
          onClose={() => setIsCreateBriefOpen(false)}
          onBriefCreated={() => loadData()}
        />
      )}

      {isEditProfileOpen && (
        <EditBrandProfileModal
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          currentProfile={profile}
          onProfileUpdated={(updated) => setProfile(updated)}
        />
      )}

      {reviewModalData && (
        <ReviewEngagementModal
          isOpen={Boolean(reviewModalData)}
          onClose={() => setReviewModalData(null)}
          engagement={reviewModalData.engagement}
          mode={reviewModalData.mode}
          onUpdated={() => loadData()}
        />
      )}
    </div>
  );
}
