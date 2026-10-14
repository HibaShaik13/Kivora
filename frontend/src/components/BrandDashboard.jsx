import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import CreateBriefModal from './CreateBriefModal';
import EditBrandProfileModal from './EditBrandProfileModal';
import ReviewEngagementModal from './ReviewEngagementModal';
import CreatorDiscovery from './CreatorDiscovery';
import MessagesInbox from './MessagesInbox';
import CollaborationWorkspaceModal from './CollaborationWorkspaceModal';
import BrandLogo from './BrandLogo';
import { getCreatorAvatar } from '../utils/visualAssetHelpers';


export default function BrandDashboard({
  currentUser,
  onOpenAiBuilder,
  onSelectCreator,
  onSelectProject,
  onSelectBrief,
  onLogout,
  initialTab,
  initialConversationId,
  chatContext,
  onClearChatContext,
  onOpenChat,
}) {
  const [activeTab, setActiveTab] = useState(() => {
    if (initialTab) return initialTab;
    if (chatContext) return 'messages';
    try {
      const params = new URLSearchParams(window.location.search);
      if (
        params.get('tab') === 'messages' ||
        params.has('conversationId') ||
        params.has('conv') ||
        params.has('c') ||
        params.has('creatorId') ||
        params.has('briefId')
      ) {
        return 'messages';
      }
      return params.get('tab') || 'overview';
    } catch {
      return 'overview';
    }
  }); // 'overview' | 'profile' | 'briefs' | 'applications' | 'engagements' | 'creators' | 'messages'

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
    if (chatContext) {
      setActiveTab('messages');
    }
  }, [initialTab, chatContext]);
  const [profile, setProfile] = useState(null);
  const [briefs, setBriefs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [engagements, setEngagements] = useState([]);
  const [hiredCreators, setHiredCreators] = useState([]);
  const [savedCreators, setSavedCreators] = useState([]);
  const [collabBriefFilter, setCollabBriefFilter] = useState('ALL');
  const [collabSubView, setCollabSubView] = useState('engagements'); // 'engagements' | 'creators'
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [isCreateBriefOpen, setIsCreateBriefOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [reviewModalData, setReviewModalData] = useState(null); // { engagement, mode: 'revision' | 'approve' | 'review' }
  const [selectedWorkspaceEngagementId, setSelectedWorkspaceEngagementId] = useState(null);

  // Selected brief for viewing applications
  const [selectedBriefId, setSelectedBriefId] = useState('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [profData, briefsData, engsData, hiredData, savedData] = await Promise.all([
        api.getMyBrandProfile().catch(() => null),
        (api.getMyBriefs ? api.getMyBriefs() : api.getBriefs()).catch(() => api.getBriefs().catch(() => [])),
        api.getEngagements().catch(() => []),
        api.getHiredCreators().catch(() => []),
        api.getSavedCreators().catch(() => []),
      ]);

      setProfile(profData);
      setBriefs(briefsData || []);
      setEngagements(engsData || []);
      setHiredCreators(hiredData || []);
      setSavedCreators(savedData || []);


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
              <BrandLogo
                brand={profile}
                brandName={profile?.company_name || 'Lumina Skincare'}
                size={44}
                shape="rounded"
                padding="3px"
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
                { id: 'saved', label: '🔖 Saved Creators', icon: '🔖', count: savedCreators.length },
                { id: 'messages', label: '💬 Messages & Chat', icon: '💬' },
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
                            src={getCreatorAvatar({ display_name: app.creator_display_name, handle: app.creator_handle, avatar_url: app.creator_avatar_url })}
                            alt={app.creator_display_name}
                            className="pitch-creator-avatar"
                            style={{ width: '48px', height: '48px', minWidth: '48px', maxWidth: '48px', minHeight: '48px', maxHeight: '48px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid rgba(121,82,236,0.25)' }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/assets/creator-portraits/devon.jpg';
                            }}
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
                  <BrandLogo
                    brand={profile}
                    brandName={profile?.company_name}
                    size={72}
                    shape="rounded"
                    padding="4px"
                    className="shadow-md"
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
                            src={getCreatorAvatar({ display_name: app.creator_display_name, handle: app.creator_handle, avatar_url: app.creator_avatar_url })}
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
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/assets/creator-portraits/devon.jpg';
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
          {activeTab === 'engagements' && (() => {
            const displayedEngagements = collabBriefFilter === 'ALL'
              ? engagements
              : engagements.filter((e) => e.brief_id === collabBriefFilter);

            return (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-serif font-bold text-neutral-900">
                      Collaborations & Deliverables Management
                    </h2>
                    <p className="text-xs text-neutral-500">
                      Review submitted master asset files, request revisions, approve deliverables, and inspect hired creator histories.
                    </p>
                  </div>

                  {/* Subview switcher */}
                  <div className="flex items-center gap-2 p-1 bg-black/5 rounded-xl self-start md:self-auto">
                    <button
                      type="button"
                      onClick={() => setCollabSubView('engagements')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        collabSubView === 'engagements'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      All Collaborations ({displayedEngagements.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setCollabSubView('creators')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        collabSubView === 'creators'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      Hired Creators ({hiredCreators.length})
                    </button>
                  </div>
                </div>

                {collabSubView === 'creators' ? (
                  /* HIRED CREATORS VIEW */
                  hiredCreators.length === 0 ? (
                    <div className="glass-panel p-12 text-center rounded-2xl">
                      <p className="text-neutral-500 text-xs">No creators currently hired by this brand.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {hiredCreators.map((hc) => (
                        <div key={hc.creator_id} className="glass-panel p-5 rounded-2xl space-y-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={getCreatorAvatar(hc)}
                                alt={hc.display_name}
                                className="w-12 h-12 rounded-full object-cover border border-purple-300 shadow-sm"
                                style={{ width: '48px', height: '48px', minWidth: '48px', borderRadius: '50%', objectFit: 'cover' }}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/assets/creator-portraits/devon.jpg';
                                }}
                              />
                              <div>
                                <h3
                                  className="text-sm font-bold text-neutral-900 cursor-pointer hover:text-purple-700"
                                  onClick={() => onSelectCreator({ id: hc.creator_id })}
                                >
                                  {hc.display_name}
                                </h3>
                                <p className="text-xs text-purple-700 font-mono">@{hc.handle}</p>
                                <span className="inline-block mt-0.5 px-2 py-0.2 text-[9px] font-bold rounded-full bg-purple-100 text-purple-800">
                                  {hc.verification_tier || 'COMMUNITY'}
                                </span>
                              </div>
                            </div>
                            <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-purple-100 text-purple-800">
                              {hc.collaborations_count} {hc.collaborations_count === 1 ? 'Project' : 'Projects'}
                            </span>
                          </div>

                          {/* Engagements with this creator */}
                          <div className="space-y-2 pt-2 border-t border-black/5">
                            <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                              Collaboration Projects with this Brand
                            </h4>
                            {hc.engagements?.map((he) => (
                              <div
                                key={he.id}
                                className="p-3 rounded-xl bg-white/70 border border-black/5 text-xs flex items-center justify-between gap-2"
                              >
                                <div className="min-w-0">
                                  <p className="font-semibold text-neutral-900 truncate">{he.brief_title}</p>
                                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-500">
                                    <span>${he.agreed_amount?.toLocaleString()} Agreed</span>
                                    <span>•</span>
                                    <span>{he.deliverables_count} Deliverables</span>
                                  </div>
                                </div>
                                <span
                                  className={`shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                    he.status === 'COMPLETED'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-purple-100 text-purple-800'
                                  }`}
                                >
                                  {he.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  /* ALL ENGAGEMENTS VIEW WITH BRIEF FILTER */
                  <>
                    {/* Filter by Brief */}
                    <div className="flex items-center gap-3 bg-white/80 p-3 rounded-xl border border-black/5">
                      <span className="text-xs font-semibold text-neutral-600 whitespace-nowrap">Filter by Brief:</span>
                      <select
                        className="input-select text-xs py-1.5 px-3 flex-1 max-w-md"
                        value={collabBriefFilter}
                        onChange={(e) => setCollabBriefFilter(e.target.value)}
                      >
                        <option value="ALL">All Campaign Briefs ({engagements.length})</option>
                        {briefs.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.title}
                          </option>
                        ))}
                      </select>
                      {collabBriefFilter !== 'ALL' && (
                        <button
                          type="button"
                          className="text-xs text-purple-700 hover:underline"
                          onClick={() => setCollabBriefFilter('ALL')}
                        >
                          Clear Brief Filter
                        </button>
                      )}
                    </div>

                    {displayedEngagements.length === 0 ? (
                      <div className="glass-panel p-12 text-center rounded-2xl">
                        <p className="text-neutral-500 text-xs">No collaborations matching the selected filter.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {displayedEngagements.map((eng) => (
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
                                <button
                                  type="button"
                                  className="btn-secondary text-xs flex items-center gap-1.5"
                                  onClick={() => {
                                    if (onOpenChat) {
                                      onOpenChat({ creatorId: eng.creator_id, briefId: eng.brief_id, targetName: eng.creator_display_name });
                                    } else {
                                      setActiveTab('messages');
                                    }
                                  }}
                                >
                                  💬 Chat
                                </button>
                                <button
                                  type="button"
                                  className="btn-primary text-xs flex items-center gap-1.5"
                                  onClick={() => setSelectedWorkspaceEngagementId(eng.id)}
                                >
                                  🚀 Open Workspace
                                </button>
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
                  </>
                )}
              </div>
            );
          })()}

          {/* TAB 7: SAVED CREATORS */}
          {activeTab === 'saved' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900">Saved Creator Talent Roster</h2>
                  <p className="text-xs text-neutral-500">
                    Bookmarked AI creators and studios curated for your upcoming brand campaigns.
                  </p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full">
                  {savedCreators.length} Saved
                </span>
              </div>

              {savedCreators.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-black/10">
                  <span className="text-3xl block mb-2">🔖</span>
                  <h3 className="text-sm font-bold text-neutral-800">No saved creators</h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    Click the favorite heart on any creator card in "Discover Creators" to save them here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedCreators.map((sc) => (
                    <div
                      key={sc.id}
                      className="p-5 bg-white rounded-2xl border border-black/10 shadow-sm flex flex-col justify-between space-y-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={getCreatorAvatar(sc.creator)}
                            alt={sc.creator?.display_name}
                            className="w-12 h-12 rounded-full object-cover border border-black/10"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/assets/creator-portraits/devon.jpg';
                            }}
                          />
                          <div>
                            <h3 className="font-bold text-sm text-neutral-900">{sc.creator?.display_name}</h3>
                            <span className="text-xs text-neutral-500">@{sc.creator?.handle}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            await api.unsaveCreator(sc.creator_id);
                            setSavedCreators((prev) => prev.filter((item) => item.creator_id !== sc.creator_id));
                          }}
                          className="text-xs text-neutral-400 hover:text-red-600 transition"
                          title="Remove from saved"
                        >
                          ✕
                        </button>
                      </div>

                      <p className="text-xs text-neutral-600 line-clamp-2">
                        {sc.creator?.bio || sc.creator?.primary_specialization}
                      </p>

                      <div className="flex items-center justify-between pt-3 border-t border-black/5">
                        <span className="text-xs font-bold text-neutral-800">
                          Starting at ${(sc.creator?.min_budget || 2500).toLocaleString()}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (onOpenChat && sc.creator_id) {
                                onOpenChat({ creatorId: sc.creator_id, targetName: sc.creator?.display_name });
                              }
                            }}
                            className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-purple-700 text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1"
                          >
                            💬 Chat
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (onSelectCreator && sc.creator) onSelectCreator(sc.creator);
                            }}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
                          >
                            View Profile →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 8: IN-APP MESSAGING */}
          {activeTab === 'messages' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-neutral-900">Direct Collaboration Discussions</h2>
                <p className="text-xs text-neutral-500">
                  Secure messaging with creators working on your campaign briefs.
                </p>
              </div>
              <MessagesInbox
                currentUser={currentUser}
                initialConversationId={initialConversationId}
                chatContext={chatContext}
                onClearChatContext={onClearChatContext}
              />
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
                onOpenChat={onOpenChat}
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

      {selectedWorkspaceEngagementId && (
        <CollaborationWorkspaceModal
          engagementId={selectedWorkspaceEngagementId}
          currentUser={currentUser}
          userRole="BRAND"
          onOpenMessages={(convId) => {
            setSelectedWorkspaceEngagementId(null);
            if (onOpenChat) onOpenChat(convId);
          }}
          onClose={() => {
            setSelectedWorkspaceEngagementId(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}
