import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import CreateBriefModal from './CreateBriefModal';
import EditBrandProfileModal from './EditBrandProfileModal';
import ReviewEngagementModal from './ReviewEngagementModal';
import CreatorDiscovery from './CreatorDiscovery';
import MessagesInbox from './MessagesInbox';
import CollaborationWorkspaceModal from './CollaborationWorkspaceModal';
import BrandLogo from './BrandLogo';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';
import BrandAnalyticsView from './BrandAnalyticsView';
import PortalSettingsView from './PortalSettingsView';
import { getCreatorAvatar, getBriefCoverImage } from '../utils/visualAssetHelpers';
import { resolveBriefDomain, DOMAIN_LABELS, DOMAIN_FOLDERS } from '../utils/briefImageMap';
import { formatINR, clampDemoBudget } from '../utils/indianLocalization';


const LayoutDashboardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
  </svg>
);
const BuildingIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
    <path d="M6 12H4a2 2 0 0 0-2 2v8h4" />
    <path d="M18 9h2a2 2 0 0 1 2 2v11h-4" />
  </svg>
);
const FileTextIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);
const UsersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const HeartHandshakeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);
const BookmarkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
  </svg>
);
const MessageSquareIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const CompassIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);
const BarChartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>
);
const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const LogOutIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export default function BrandDashboard({
  currentUser,
  onOpenAiBuilder,
  onSelectCreator,
  onSelectProject,
  onSelectBrief,
  onLogout,
  onNavigateHome,
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

  // Campaign Briefs Filtering State
  const [briefSearchQuery, setBriefSearchQuery] = useState('');
  const [briefDomainFilter, setBriefDomainFilter] = useState('ALL');
  const [briefStatusFilter, setBriefStatusFilter] = useState('ALL');
  const [briefTabStatus, setBriefTabStatus] = useState('ALL');
  const [briefMarketingGoal, setBriefMarketingGoal] = useState('ALL');
  const [briefContentType, setBriefContentType] = useState('ALL');
  const [briefBudgetRange, setBriefBudgetRange] = useState('ALL');
  const [portalSearchQuery, setPortalSearchQuery] = useState('');

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

  const handleNotificationNavigate = (view, opts) => {
    if (opts?.tab) {
      if (opts.tab === 'projects') {
        setActiveTab('engagements');
      } else {
        setActiveTab(opts.tab);
      }
    } else if (view === 'inbox' || view === 'messages') {
      setActiveTab('messages');
    } else if (view === 'briefs') {
      setActiveTab('briefs');
    } else {
      setActiveTab('overview');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredBriefs = React.useMemo(() => {
    return briefs.filter((brief) => {
      // 1. Status Tab filter (All, Open, In Progress, Completed, Drafts)
      if (briefTabStatus && briefTabStatus !== 'ALL') {
        if (briefTabStatus === 'OPEN' && brief.status !== 'PUBLISHED') return false;
        if (briefTabStatus === 'IN_PROGRESS' && (brief.status !== 'PUBLISHED' || !(brief.applications_count > 0))) return false;
        if (briefTabStatus === 'COMPLETED' && brief.status !== 'CLOSED') return false;
        if (briefTabStatus === 'DRAFTS' && brief.status !== 'DRAFT') return false;
      }
      // 2. Dropdown Status filter
      if (briefStatusFilter !== 'ALL' && brief.status !== briefStatusFilter) {
        return false;
      }
      // 3. Marketing Goal filter
      if (briefMarketingGoal && briefMarketingGoal !== 'ALL') {
        const obj = (brief.campaign_objective || '').toLowerCase();
        const title = (brief.title || '').toLowerCase();
        if (briefMarketingGoal === 'PRODUCT_LAUNCH' && !obj.includes('launch') && !title.includes('launch')) return false;
        if (briefMarketingGoal === 'BRAND_AWARENESS' && !obj.includes('brand') && !obj.includes('awareness')) return false;
        if (briefMarketingGoal === 'CONVERSIONS' && !obj.includes('ad') && !obj.includes('commercial')) return false;
        if (briefMarketingGoal === 'SOCIAL_REELS' && !obj.includes('reel') && !obj.includes('social') && brief.aspect_ratio !== '9:16') return false;
      }
      // 4. Content Type filter
      if (briefContentType && briefContentType !== 'ALL') {
        const ct = (brief.content_type || '').toUpperCase();
        if (briefContentType === 'VIDEO' && ct !== 'VIDEO') return false;
        if (briefContentType === 'IMAGE' && ct !== 'IMAGE' && ct !== 'STILLS') return false;
        if (briefContentType === '3D' && ct !== '3D' && ct !== 'CGI') return false;
      }
      // 5. Budget Range filter
      if (briefBudgetRange && briefBudgetRange !== 'ALL') {
        const b = clampDemoBudget(brief.budget_amount, 35000);
        if (briefBudgetRange === 'TIER_1' && b >= 25000) return false;
        if (briefBudgetRange === 'TIER_2' && (b < 25000 || b > 40000)) return false;
        if (briefBudgetRange === 'TIER_3' && b <= 40000) return false;
      }
      // 6. Domain filter
      if (briefDomainFilter !== 'ALL') {
        const domain = resolveBriefDomain(brief);
        if (domain !== briefDomainFilter) {
          const catSlugs = (brief.categories || []).map((c) => (c.slug || '').toLowerCase());
          const catNames = (brief.categories || []).map((c) => (c.name || '').toLowerCase());
          const targetLabel = (DOMAIN_LABELS[briefDomainFilter] || '').toLowerCase();
          const targetSlug = briefDomainFilter.toLowerCase().replace(/_/g, '-');
          const hasRel = catSlugs.some((s) => s.includes(targetSlug)) || catNames.some((n) => n.includes(targetLabel));
          if (!hasRel) return false;
        }
      }
      // 7. Search query (from brief search or topbar search)
      const effectiveSearch = (briefSearchQuery || portalSearchQuery || '').toLowerCase().trim();
      if (effectiveSearch) {
        const titleMatch = brief.title?.toLowerCase().includes(effectiveSearch);
        const objMatch = brief.campaign_objective?.toLowerCase().includes(effectiveSearch);
        const formatMatch = `${brief.content_type || ''} ${brief.aspect_ratio || ''}`.toLowerCase().includes(effectiveSearch);
        if (!titleMatch && !objMatch && !formatMatch) return false;
      }
      return true;
    });
  }, [briefs, briefTabStatus, briefStatusFilter, briefMarketingGoal, briefContentType, briefBudgetRange, briefDomainFilter, briefSearchQuery, portalSearchQuery]);

  if (isLoading && !profile) {
    return (
      <div className="container py-16 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="spinner-sm mb-4" />
        <p className="text-neutral-500 font-sans text-sm">Accessing Brand Portal...</p>
      </div>
    );
  }

  return (
    <div className="portal-layout">
      {/* Sidebar with Purple/Lavender Gradient */}
      <aside className="portal-sidebar">
        <div>
          {/* Top Logo */}
          <div
            className="portal-sidebar-logo"
            onClick={onNavigateHome}
            role="button"
            tabIndex={0}
            title="Kivora Home"
          >
            Kivora<span className="brand-dot">.</span>
          </div>

          {/* Brand Profile Badge */}
          <div className="portal-profile-card">
            <BrandLogo
              brand={profile}
              brandName={profile?.company_name || 'Lumina Skincare'}
              width={40}
              height={40}
              shape="circle"
              padding="2px"
              className="shrink-0 ring-1 ring-purple-300 shadow-xs"
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-[#1E0B38] truncate font-sans tracking-tight">
                {profile?.company_name || 'Lumina Skincare'}
              </h3>
              <p className="text-xs text-[#6B5B88] font-medium truncate font-sans">
                Verified Brand
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="portal-nav-list">
            {[
              { id: 'overview', label: 'Dashboard', icon: <LayoutDashboardIcon /> },
              { id: 'profile', label: 'Brand Profile', icon: <BuildingIcon /> },
              { id: 'briefs', label: 'Campaign Briefs', icon: <FileTextIcon />, count: briefs.length },
              { id: 'applications', label: 'Creator Applications', icon: <UsersIcon />, count: applications.length },
              { id: 'engagements', label: 'Collaborations', icon: <HeartHandshakeIcon />, count: engagements.length },
              { id: 'saved', label: 'Saved Creators', icon: <BookmarkIcon />, count: savedCreators.length },
              { id: 'messages', label: 'Messages & Chat', icon: <MessageSquareIcon /> },
              { id: 'creators', label: 'Discover Creators', icon: <CompassIcon /> },
              { id: 'analytics', label: 'Analytics', icon: <BarChartIcon /> },
              { id: 'settings', label: 'Settings', icon: <SettingsIcon /> },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`portal-nav-item ${activeTab === item.id ? 'active' : ''}`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="portal-nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span className="portal-nav-count">{item.count}</span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Bottom Log Out */}
        <div className="portal-sidebar-footer">
          <button
            type="button"
            onClick={onLogout}
            className="portal-logout-btn"
          >
            <LogOutIcon />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area with Cream/White Background */}
      <div className="portal-main">
        {/* Top Header Bar */}
        <header className="portal-topbar">
          <div className="portal-pill-badge brand">
            <span>🏷</span>
            <span>Brand Portal</span>
          </div>

          <div className="portal-search-wrap">
            <svg
              className="portal-search-icon"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" x2="16.65" y1="21" y2="16.65" />
            </svg>
            <input
              type="text"
              className="portal-search-input"
              placeholder="Search creators, brands, or skills..."
              value={portalSearchQuery}
              onChange={(e) => setPortalSearchQuery(e.target.value)}
            />
          </div>

          <div className="portal-topbar-actions">
            <ThemeToggle />
            <NotificationBell onNavigate={handleNotificationNavigate} />

            <button
              type="button"
              className="portal-icon-btn"
              title="Messages & Chat"
              onClick={() => setActiveTab('messages')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </button>

            <div
              className="portal-topbar-avatar"
              onClick={() => setIsEditProfileOpen(true)}
              title={profile?.company_name || 'Lumina Skincare'}
            >
              {(profile?.company_name || 'L')[0]}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="portal-content-body">
          {error && (
            <div className="banner-error mb-6 p-4 rounded-xl bg-red-100 border border-red-200 text-red-800 text-xs">
              {error}
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Welcome Section */}
              <div className="portal-header-row">
                <div>
                  <span className="text-xs text-neutral-500 font-sans block">Welcome back,</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <h1 className="text-2xl font-bold font-sans text-neutral-900 tracking-tight">
                      {profile?.company_name || 'Lumina Skincare'}
                    </h1>
                    <span
                      className="portal-verified-circle"
                      title="Verified Brand"
                    >
                      ✓
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5 font-sans">
                    Create impactful campaigns and collaborate with top AI creators.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    className="portal-btn-primary"
                    onClick={() => setIsCreateBriefOpen(true)}
                  >
                    + Launch Brief
                  </button>
                  <button
                    type="button"
                    className="portal-btn-outline-purple"
                    onClick={onOpenAiBuilder}
                  >
                    ✨ AI Brief Builder
                  </button>
                </div>
              </div>

              {/* 4 Pastel Stat Cards */}
              <div className="portal-stat-grid">
                {/* Card 1: Total Briefs (Lavender Pastel) */}
                <div className="portal-stat-card lavender">
                  <div className="portal-stat-header">
                    <div className="portal-stat-icon-wrap" style={{ background: '#F3E2FD', color: '#683EE6' }}>
                      📊
                    </div>
                    <span className="portal-stat-title">Total Briefs</span>
                  </div>
                  <div>
                    <div className="portal-stat-value">{briefs.length}</div>
                    <div className="portal-stat-subtitle">Campaigns launched</div>
                  </div>
                </div>

                {/* Card 2: Creator Applications (Mint Pastel) */}
                <div className="portal-stat-card mint">
                  <div className="portal-stat-header">
                    <div className="portal-stat-icon-wrap" style={{ background: '#DBF7E9', color: '#059669' }}>
                      👥
                    </div>
                    <span className="portal-stat-title">Creator Applications</span>
                  </div>
                  <div>
                    <div className="portal-stat-value">{applications.length}</div>
                    <div className="portal-stat-subtitle">Proposals received</div>
                  </div>
                </div>

                {/* Card 3: Active Collaborations (Peach Pastel) */}
                <div className="portal-stat-card peach">
                  <div className="portal-stat-header">
                    <div className="portal-stat-icon-wrap" style={{ background: '#FFE5DC', color: '#EA580C' }}>
                      🤝
                    </div>
                    <span className="portal-stat-title">Active Collaborations</span>
                  </div>
                  <div>
                    <div className="portal-stat-value">{engagements.length}</div>
                    <div className="portal-stat-subtitle">Projects in progress</div>
                  </div>
                </div>

                {/* Card 4: Completed Works (Yellow Pastel) */}
                <div className="portal-stat-card yellow">
                  <div className="portal-stat-header">
                    <div className="portal-stat-icon-wrap" style={{ background: '#FDF4D4', color: '#D97706' }}>
                      📁
                    </div>
                    <span className="portal-stat-title">Completed Works</span>
                  </div>
                  <div>
                    <div className="portal-stat-value">{engagements.filter((e) => e.status === 'COMPLETED').length}</div>
                    <div className="portal-stat-subtitle">Approved deliverables</div>
                  </div>
                </div>
              </div>

              {/* Recent Campaign Briefs */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold font-sans text-neutral-900 tracking-tight">
                    Recent Campaign Briefs
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab('briefs')}
                    className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1 transition font-sans"
                  >
                    View All →
                  </button>
                </div>

                {briefs.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center border border-black/[0.06] shadow-xs">
                    <p className="text-neutral-500 text-xs mb-3 font-sans">No campaign briefs launched yet.</p>
                    <button
                      type="button"
                      className="portal-btn-primary"
                      onClick={() => setIsCreateBriefOpen(true)}
                    >
                      + Launch First Brief
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {briefs.slice(0, 3).map((brief) => {
                      const coverImg = getBriefCoverImage(brief);
                      const isApproved = brief.engagements?.some((e) => e.status === 'FINAL_APPROVED') || brief.status === 'PUBLISHED';
                      const statusTag = isApproved ? 'FINAL_APPROVED' : brief.status;
                      const statusPill = brief.status === 'PUBLISHED' ? 'In Progress' : brief.status === 'DRAFT' ? 'Draft' : 'Open';

                      return (
                        <div
                          key={brief.id}
                          className="portal-card-row cursor-pointer"
                          onClick={() => onSelectBrief(brief)}
                        >
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <img
                              src={coverImg}
                              alt={brief.title}
                              className="w-20 h-16 rounded-xl object-cover shrink-0 border border-black/[0.04]"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/assets/campaign-covers/brand_fashion_cover.jpg';
                              }}
                            />
                            <div className="min-w-0 flex-1">
                              <span className={`portal-badge-tag ${statusTag === 'FINAL_APPROVED' ? 'approved' : statusTag === 'DRAFT' ? 'draft' : 'open'} mb-1`}>
                                {statusTag}
                              </span>
                              <h3 className="text-sm font-bold text-neutral-900 font-sans tracking-tight truncate">
                                {brief.title}
                              </h3>
                              <p className="text-xs text-neutral-500 mt-0.5 font-sans">
                                Posted on Oct 12, 2026 • {brief.applications_count || 12} Proposals
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="portal-budget-pill">
                              {formatINR(clampDemoBudget(brief.budget_amount, 35000))}
                            </span>
                            <span className={`portal-status-pill ${
                              statusPill === 'In Progress' ? 'in-progress' : statusPill === 'Draft' ? 'draft' : 'open'
                            }`}>
                              {statusPill}
                            </span>
                            <button
                              type="button"
                              className="portal-dots-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectBrief(brief);
                              }}
                              title="Brief options"
                            >
                              ⋮
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: BRAND PROFILE */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl p-6 border border-black/[0.08] shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <BrandLogo
                    brand={profile}
                    brandName={profile?.company_name}
                    width={64}
                    height={64}
                    shape="circle"
                    padding="4px"
                    className="shadow-xs ring-1 ring-black/10 shrink-0"
                  />
                  <div>
                    <h2 className="text-xl font-bold font-sans text-neutral-900 tracking-tight">
                      {profile?.company_name}
                    </h2>
                    <p className="text-xs text-purple-700 font-mono">slug: {profile?.slug}</p>
                    <p className="text-xs text-neutral-600 mt-0.5 font-sans">{profile?.industry}</p>
                    <p className="text-xs text-neutral-500 mt-0.5 font-sans">
                      📍 {profile?.headquarters || 'Paris'} • {profile?.company_size || '50-200'} Employees
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-primary text-xs py-2 px-4 shadow-xs"
                  onClick={() => setIsEditProfileOpen(true)}
                >
                  Edit Profile
                </button>
              </div>

              <div className="pt-6 border-t border-black/[0.06]">
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 font-sans">
                  Brand Narrative & Values
                </h4>
                <p className="text-xs text-neutral-700 leading-relaxed font-sans">
                  {profile?.description || 'No description provided.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-black/[0.06]">
                <div className="p-4 rounded-xl bg-neutral-50 border border-black/[0.04]">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block font-sans">
                    Official Website
                  </span>
                  <a
                    href={profile?.website_url || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-purple-700 hover:underline mt-1 inline-block"
                  >
                    {profile?.website_url || 'https://brand.com'}
                  </a>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block font-sans">
                    Verification Status
                  </span>
                  <span className="text-xs text-emerald-800 font-bold mt-1 inline-flex items-center gap-1.5 font-sans">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Audited & Verified Brand
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CAMPAIGN BRIEFS */}
          {activeTab === 'briefs' && (
            <div className="space-y-5">
              {/* Header */}
              <div className="portal-header-row">
                <div>
                  <h1 className="text-2xl font-extrabold text-neutral-900 font-sans tracking-tight">
                    Campaign Briefs
                  </h1>
                  <p className="text-xs text-neutral-500 mt-1 font-sans">
                    Manage your brand campaigns and find the perfect creators.
                  </p>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    type="button"
                    className="portal-btn-primary"
                    onClick={() => setIsCreateBriefOpen(true)}
                  >
                    + Create Brief
                  </button>
                </div>
              </div>

              {/* Status Filter Tab Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
                {[
                  { key: 'ALL', label: 'All Briefs', count: briefs.length },
                  { key: 'OPEN', label: 'Open', count: briefs.filter((b) => b.status === 'PUBLISHED' && (!b.applications_count || b.applications_count === 0)).length },
                  { key: 'IN_PROGRESS', label: 'In Progress', count: briefs.filter((b) => b.status === 'PUBLISHED' && b.applications_count > 0).length },
                  { key: 'COMPLETED', label: 'Completed', count: briefs.filter((b) => b.status === 'CLOSED').length },
                  { key: 'DRAFTS', label: 'Drafts', count: briefs.filter((b) => b.status === 'DRAFT').length },
                ].map((tab) => {
                  const isActive = briefTabStatus === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setBriefTabStatus(tab.key)}
                      className={`portal-tab-pill ${isActive ? 'active' : 'inactive'}`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                          isActive
                            ? 'bg-white/25 text-white'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Dropdown Filters Row */}
              <div className="flex items-center gap-2.5 flex-wrap pt-1">
                <select
                  className="portal-dropdown-btn"
                  value={briefMarketingGoal}
                  onChange={(e) => setBriefMarketingGoal(e.target.value)}
                >
                  <option value="ALL">Marketing Goal ⌄</option>
                  <option value="PRODUCT_LAUNCH">Product Launch</option>
                  <option value="BRAND_AWARENESS">Brand Awareness</option>
                  <option value="CONVERSIONS">Conversions & Sales</option>
                  <option value="SOCIAL_REELS">Social Reels</option>
                </select>

                <select
                  className="portal-dropdown-btn"
                  value={briefContentType}
                  onChange={(e) => setBriefContentType(e.target.value)}
                >
                  <option value="ALL">Content Type ⌄</option>
                  <option value="VIDEO">Video</option>
                  <option value="IMAGE">Image / Stills</option>
                  <option value="3D">3D / CGI</option>
                </select>

                <select
                  className="portal-dropdown-btn"
                  value={briefBudgetRange}
                  onChange={(e) => setBriefBudgetRange(e.target.value)}
                >
                  <option value="ALL">Budget Range ⌄</option>
                  <option value="TIER_1">&lt; ₹25,000</option>
                  <option value="TIER_2">₹25,000 - ₹40,000</option>
                  <option value="TIER_3">&gt; ₹40,000</option>
                </select>

                <select
                  className="portal-dropdown-btn"
                  value={briefStatusFilter}
                  onChange={(e) => setBriefStatusFilter(e.target.value)}
                >
                  <option value="ALL">Status ⌄</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Draft</option>
                  <option value="CLOSED">Closed</option>
                </select>

                {(briefTabStatus !== 'ALL' ||
                  briefMarketingGoal !== 'ALL' ||
                  briefContentType !== 'ALL' ||
                  briefBudgetRange !== 'ALL' ||
                  briefStatusFilter !== 'ALL' ||
                  briefSearchQuery ||
                  portalSearchQuery) && (
                  <button
                    type="button"
                    className="text-xs font-semibold text-purple-700 hover:text-purple-900 transition ml-1 font-sans"
                    onClick={() => {
                      setBriefTabStatus('ALL');
                      setBriefMarketingGoal('ALL');
                      setBriefContentType('ALL');
                      setBriefBudgetRange('ALL');
                      setBriefStatusFilter('ALL');
                      setBriefSearchQuery('');
                      setPortalSearchQuery('');
                    }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              {/* Brief List */}
              {briefs.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-black/[0.06] shadow-xs">
                  <p className="text-neutral-500 text-xs mb-4 font-sans">No campaign briefs launched yet.</p>
                  <button
                    type="button"
                    className="portal-btn-primary"
                    onClick={() => setIsCreateBriefOpen(true)}
                  >
                    + Launch First Brief
                  </button>
                </div>
              ) : filteredBriefs.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-black/[0.06] shadow-xs">
                  <p className="text-neutral-500 text-xs mb-3 font-sans">No campaign briefs match your selected filters.</p>
                  <button
                    type="button"
                    className="portal-btn-secondary"
                    onClick={() => {
                      setBriefTabStatus('ALL');
                      setBriefMarketingGoal('ALL');
                      setBriefContentType('ALL');
                      setBriefBudgetRange('ALL');
                      setBriefStatusFilter('ALL');
                      setBriefSearchQuery('');
                      setPortalSearchQuery('');
                    }}
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {filteredBriefs.map((brief) => {
                    const coverImg = getBriefCoverImage(brief);
                    const isApproved = brief.engagements?.some((e) => e.status === 'FINAL_APPROVED') || (brief.status === 'PUBLISHED' && brief.applications_count > 0);
                    const statusTag = isApproved ? 'FINAL_APPROVED' : brief.status;
                    const statusPill =
                      brief.status === 'PUBLISHED' && brief.applications_count > 0
                        ? 'In Progress'
                        : brief.status === 'PUBLISHED'
                        ? 'Open'
                        : brief.status === 'DRAFT'
                        ? 'Draft'
                        : 'Closed';

                    return (
                      <div
                        key={brief.id}
                        className="portal-card-row cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                        onClick={() => onSelectBrief(brief)}
                      >
                        <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
                          <img
                            src={coverImg}
                            alt={brief.title}
                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shrink-0 border border-black/[0.04]"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/assets/campaign-covers/brand_fashion_cover.jpg';
                            }}
                          />
                          <div className="min-w-0 flex-1 space-y-1">
                            <span
                              className={`portal-badge-tag ${
                                statusTag === 'FINAL_APPROVED'
                                  ? 'approved'
                                  : statusTag === 'OPEN' || statusTag === 'PUBLISHED'
                                  ? 'open'
                                  : 'draft'
                              }`}
                            >
                              {statusTag}
                            </span>
                            <h3 className="text-sm sm:text-base font-bold text-neutral-900 font-sans tracking-tight line-clamp-1 hover:text-purple-700 transition">
                              {brief.title}
                            </h3>
                            <p className="text-xs text-neutral-500 line-clamp-1 font-sans">
                              {brief.campaign_objective || brief.deliverables_description || 'Premium skincare launch campaign with cinematic video and social media reels.'}
                            </p>
                            <div className="flex items-center gap-2 pt-1 flex-wrap">
                              <span className="portal-tag-pill">
                                📹 {brief.content_type || 'Video'}
                              </span>
                              <span className="portal-tag-pill">
                                🎬 Reels
                              </span>
                              <span className="portal-tag-pill">
                                📸 Instagram
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-neutral-100">
                          <span className="portal-budget-pill">
                            {formatINR(clampDemoBudget(brief.budget_amount, 35000))}
                          </span>
                          <div className="flex items-center gap-2">
                            <span
                              className={`portal-status-pill ${
                                statusPill === 'In Progress'
                                  ? 'in-progress'
                                  : statusPill === 'Draft'
                                  ? 'draft'
                                  : 'open'
                              }`}
                            >
                              {statusPill}
                            </span>
                            <button
                              type="button"
                              className="portal-dots-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectBrief(brief);
                              }}
                              title="Brief options"
                            >
                              ⋮
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: APPLICATIONS */}
          {activeTab === 'applications' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold font-sans text-neutral-900 tracking-tight">
                  Pitch Proposals Received ({applications.length})
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5 font-sans">
                  Evaluate creator proposals, review proposed terms, and accept bids to initiate collaborations.
                </p>
              </div>

              {applications.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-black/[0.08] shadow-xs">
                  <p className="text-neutral-500 text-xs font-sans">No pitch proposals received yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div key={app.id} className="bg-white rounded-2xl p-6 border border-black/[0.08] shadow-xs hover:shadow-md transition-all space-y-5">
                      {/* Top: Creator Identity & Status */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.06]">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <img
                            src={getCreatorAvatar({ display_name: app.creator_display_name, handle: app.creator_handle, avatar_url: app.creator_avatar_url })}
                            alt={app.creator_display_name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-purple-200 shadow-xs shrink-0"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/assets/creator-portraits/devon.jpg';
                            }}
                          />
                          <div className="min-w-0">
                            <h4
                              className="text-base font-bold text-neutral-900 font-sans tracking-tight cursor-pointer hover:text-purple-700 truncate"
                              onClick={() => onSelectCreator({ id: app.creator_id })}
                            >
                              {app.creator_display_name}
                            </h4>
                            <p className="text-xs text-purple-700 font-mono">@{app.creator_handle}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                          <span
                            className={`px-3 py-1 text-xs font-bold rounded-full ${
                              app.status === 'ACCEPTED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : app.status === 'REJECTED'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-purple-50 text-purple-700 border border-purple-200'
                            }`}
                          >
                            {app.status}
                          </span>
                        </div>
                      </div>

                      {/* Proposed Terms - Clean 4-Column Metric Grid with vertical separation */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-neutral-50/80 border border-black/[0.04]">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-sans">
                            Offered Rate
                          </span>
                          <span className="text-base font-bold text-neutral-900 font-sans mt-0.5">
                            {formatINR(clampDemoBudget(app.proposed_rate, 35000))}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-sans">
                            Timeline
                          </span>
                          <span className="text-base font-bold text-neutral-900 font-sans mt-0.5">
                            {app.proposed_timeline_days}{' '}
                            <span className="text-xs font-normal text-neutral-500">Days</span>
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-sans">
                            Submitted
                          </span>
                          <span className="text-sm font-semibold text-neutral-700 font-sans mt-0.5">
                            {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : 'Recent'}
                          </span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-sans">
                            Target Campaign
                          </span>
                          <span className="text-sm font-semibold text-purple-700 truncate font-sans mt-0.5" title={app.brief_title || 'Campaign Brief'}>
                            {app.brief_title || 'View Brief'}
                          </span>
                        </div>
                      </div>

                      {/* Proposal Approach Quote Container */}
                      <div className="p-4 rounded-xl bg-purple-50/40 border-l-4 border-purple-500 text-xs text-neutral-700 space-y-1.5">
                        <div className="text-[11px] font-bold text-purple-900 uppercase tracking-wider font-sans">
                          Creator Proposal & Approach
                        </div>
                        <p className="text-xs leading-relaxed whitespace-pre-wrap break-words text-neutral-700 font-sans">
                          {app.pitch_text}
                        </p>
                      </div>

                      {/* Action Footer */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-black/[0.06]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-xs"
                            onClick={() => {
                              if (onOpenChat) {
                                onOpenChat({ creatorId: app.creator_id, targetName: app.creator_display_name });
                              } else {
                                setActiveTab('messages');
                              }
                            }}
                          >
                            💬 Message Creator
                          </button>
                          <button
                            type="button"
                            className="btn-secondary text-xs py-2 px-3.5 shadow-xs"
                            onClick={() => onSelectCreator({ id: app.creator_id })}
                          >
                            View Creator Profile →
                          </button>
                        </div>

                        {app.status === 'SUBMITTED' && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-100 hover:bg-red-50 hover:text-red-700 text-neutral-700 border border-black/5 transition font-sans"
                              onClick={() => handleApplicationStatus(app.id, 'REJECTED')}
                            >
                              Decline Proposal
                            </button>
                            <button
                              type="button"
                              className="btn-primary text-xs py-2 px-4 shadow-sm font-sans"
                              onClick={() => handleApplicationStatus(app.id, 'ACCEPTED')}
                            >
                              Accept & Hire Creator 🚀
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

          {/* TAB 5: ENGAGEMENTS */}
          {activeTab === 'engagements' && (() => {
            const displayedEngagements = collabBriefFilter === 'ALL'
              ? engagements
              : engagements.filter((e) => e.brief_id === collabBriefFilter);

            return (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold font-sans text-neutral-900 tracking-tight">
                      Collaborations & Deliverables Management
                    </h2>
                    <p className="text-xs text-neutral-500 mt-0.5 font-sans">
                      Review submitted master asset files, request revisions, approve deliverables, and inspect hired creator histories.
                    </p>
                  </div>

                  {/* Subview switcher */}
                  <div className="flex items-center gap-2 p-1 bg-black/5 rounded-xl self-start md:self-auto">
                    <button
                      type="button"
                      onClick={() => setCollabSubView('engagements')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition font-sans ${
                        collabSubView === 'engagements'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      All Collaborations ({displayedEngagements.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setCollabSubView('creators')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition font-sans ${
                        collabSubView === 'creators'
                          ? 'bg-purple-600 text-white shadow-xs'
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
                    <div className="bg-white rounded-2xl p-12 text-center border border-black/[0.08] shadow-xs">
                      <p className="text-neutral-500 text-xs font-sans">No creators currently hired by this brand.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {hiredCreators.map((hc) => (
                        <div key={hc.creator_id} className="bg-white rounded-2xl p-5 border border-black/[0.08] shadow-xs hover:shadow-md transition-all space-y-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={getCreatorAvatar(hc)}
                                alt={hc.display_name}
                                className="w-12 h-12 rounded-full object-cover border-2 border-purple-200 shadow-xs shrink-0"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/assets/creator-portraits/devon.jpg';
                                }}
                              />
                              <div>
                                <h3
                                  className="text-sm font-bold text-neutral-900 font-sans tracking-tight cursor-pointer hover:text-purple-700"
                                  onClick={() => onSelectCreator({ id: hc.creator_id })}
                                >
                                  {hc.display_name}
                                </h3>
                                <p className="text-xs text-purple-700 font-mono">@{hc.handle}</p>
                                <span className="inline-block mt-0.5 px-2 py-0.5 text-[9px] font-bold rounded-full bg-purple-50 text-purple-700 border border-purple-200/60 font-sans">
                                  {hc.verification_tier || 'COMMUNITY'}
                                </span>
                              </div>
                            </div>
                            <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-purple-50 text-purple-700 border border-purple-200/60 font-sans">
                              {hc.collaborations_count} {hc.collaborations_count === 1 ? 'Project' : 'Projects'}
                            </span>
                          </div>

                          {/* Engagements with this creator */}
                          <div className="space-y-2 pt-2 border-t border-black/[0.06]">
                            <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-sans">
                              Collaboration Projects with this Brand
                            </h4>
                            {hc.engagements?.map((he) => (
                              <div
                                key={he.id}
                                className="p-3 rounded-xl bg-neutral-50/80 border border-black/[0.04] text-xs flex items-center justify-between gap-2"
                              >
                                <div className="min-w-0">
                                  <p className="font-semibold text-neutral-900 font-sans truncate">{he.brief_title}</p>
                                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-500 font-sans">
                                    <span>{formatINR(clampDemoBudget(he.agreed_amount, 35000))} Agreed</span>
                                    <span>•</span>
                                    <span>{he.deliverables_count} Deliverables</span>
                                  </div>
                                </div>
                                <span
                                  className={`shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-full font-sans ${
                                    he.status === 'COMPLETED'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-purple-50 text-purple-700 border border-purple-200'
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
                    <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-black/[0.08] shadow-xs">
                      <span className="text-xs font-semibold text-neutral-600 whitespace-nowrap font-sans">Filter by Brief:</span>
                      <select
                        className="py-1.5 px-3 text-xs bg-neutral-50 border border-black/10 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-neutral-700 font-medium font-sans flex-1 max-w-md"
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
                          className="text-xs text-purple-700 hover:underline font-sans font-bold"
                          onClick={() => setCollabBriefFilter('ALL')}
                        >
                          Clear Brief Filter
                        </button>
                      )}
                    </div>

                    {displayedEngagements.length === 0 ? (
                      <div className="bg-white rounded-2xl p-12 text-center border border-black/[0.08] shadow-xs">
                        <p className="text-neutral-500 text-xs font-sans">No collaborations matching the selected filter.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {displayedEngagements.map((eng) => (
                          <div key={eng.id} className="bg-white rounded-2xl p-6 border border-black/[0.08] shadow-xs hover:shadow-md transition-all space-y-4">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-4 border-b border-black/[0.06]">
                              <div>
                                <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-purple-50 text-purple-700 border border-purple-200/80 font-sans">
                                  {eng.status}
                                </span>
                                <h3 className="text-lg font-bold font-sans text-neutral-900 tracking-tight mt-1">
                                  {eng.brief_title}
                                </h3>
                                <p className="text-xs text-neutral-500 font-sans mt-0.5">
                                  Creator: <strong className="text-neutral-800">{eng.creator_display_name}</strong> (@{eng.creator_handle}) • Budget: {formatINR(clampDemoBudget(eng.agreed_amount, 35000))}
                                </p>
                              </div>

                              {/* Action Buttons based on status */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  type="button"
                                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-xs font-sans"
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
                                  className="btn-primary text-xs py-1.5 px-3.5 flex items-center gap-1.5 shadow-xs font-sans"
                                  onClick={() => setSelectedWorkspaceEngagementId(eng.id)}
                                >
                                  🚀 Open Workspace
                                </button>
                                {eng.status === 'DRAFT_SUBMITTED' && (
                                  <>
                                    <button
                                      type="button"
                                      className="btn-secondary text-xs py-1.5 px-3 shadow-xs font-sans"
                                      onClick={() => setReviewModalData({ engagement: eng, mode: 'revision' })}
                                    >
                                      Request Revisions
                                    </button>
                                    <button
                                      type="button"
                                      className="btn-primary text-xs py-1.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 shadow-xs font-sans"
                                      onClick={() => setReviewModalData({ engagement: eng, mode: 'approve' })}
                                    >
                                      Final Approval ✓
                                    </button>
                                  </>
                                )}

                                {eng.status === 'FINAL_APPROVED' && (
                                  <button
                                    type="button"
                                    className="btn-primary text-xs py-1.5 px-3.5 shadow-xs font-sans"
                                    onClick={() => setReviewModalData({ engagement: eng, mode: 'review' })}
                                  >
                                    ★ Rate & Review Creator
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Project Progress & Milestone Track */}
                            <div className="bg-purple-50/40 p-4 rounded-xl border border-purple-100/80 space-y-3">
                              <div className="flex items-center justify-between text-xs font-semibold">
                                <span className="text-purple-900 flex items-center gap-1.5 font-sans">
                                  <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></span>
                                  Milestone: <strong>{eng.current_milestone || 'In Progress'}</strong>
                                </span>
                                <span className="text-purple-700 font-bold font-sans">{eng.progress_percentage || 25}% Progress</span>
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
                                      className={`p-2 rounded-lg border font-sans ${
                                        m.status === 'COMPLETED'
                                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                          : m.status === 'IN_PROGRESS'
                                          ? 'bg-purple-100 border-purple-300 text-purple-900 font-semibold'
                                          : 'bg-white/80 border-black/5 text-neutral-400'
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
                              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 font-sans">
                                Deliverables Package ({eng.deliverables?.length || 0})
                              </h4>
                              <div className="space-y-2">
                                {eng.deliverables?.map((d) => (
                                  <div
                                    key={d.id}
                                    className="p-3 rounded-xl border border-black/[0.04] bg-neutral-50/70 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 text-xs"
                                  >
                                    <div>
                                      <span className="font-bold text-purple-700 mr-2 font-sans">v{d.version}</span>
                                      <strong className="font-sans text-neutral-900">{d.title}</strong>
                                      <p className="text-neutral-500 font-mono text-[11px] truncate max-w-md mt-0.5">
                                        {d.asset_url}
                                      </p>
                                      {d.notes && <p className="text-neutral-600 mt-1 italic font-sans">"{d.notes}"</p>}
                                      {d.feedback && (
                                        <p className="text-amber-800 mt-1 bg-amber-50 p-1.5 rounded border border-amber-200 font-sans">
                                          <strong>Revision Feedback:</strong> {d.feedback}
                                        </p>
                                      )}
                                    </div>
                                    <span
                                      className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full font-sans ${
                                        d.status === 'APPROVED'
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                          : d.status === 'REVISION_REQUESTED'
                                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                                      }`}
                                    >
                                      {d.status}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {eng.brand_rating && (
                              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-sans">
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
                  <h2 className="text-xl font-bold font-sans text-neutral-900 tracking-tight">Saved Creator Talent Roster</h2>
                  <p className="text-xs text-neutral-500 mt-0.5 font-sans">
                    Bookmarked AI creators and studios curated for your upcoming brand campaigns.
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full font-sans">
                  {savedCreators.length} Saved
                </span>
              </div>

              {savedCreators.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-black/[0.08] shadow-xs">
                  <span className="text-3xl block mb-2">🔖</span>
                  <h3 className="text-sm font-bold text-neutral-800 font-sans">No saved creators</h3>
                  <p className="text-xs text-neutral-500 mt-1 font-sans">
                    Click the favorite heart on any creator card in "Discover Creators" to save them here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedCreators.map((sc) => (
                    <div
                      key={sc.id}
                      className="p-5 bg-white rounded-2xl border border-black/[0.08] shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={getCreatorAvatar(sc.creator)}
                            alt={sc.creator?.display_name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-purple-100 shadow-xs shrink-0"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/assets/creator-portraits/devon.jpg';
                            }}
                          />
                          <div className="min-w-0">
                            <h3 className="font-bold text-sm text-neutral-900 font-sans tracking-tight truncate">
                              {sc.creator?.display_name}
                            </h3>
                            <span className="text-xs text-purple-700 font-mono">@{sc.creator?.handle}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            await api.unsaveCreator(sc.creator_id);
                            setSavedCreators((prev) => prev.filter((item) => item.creator_id !== sc.creator_id));
                          }}
                          className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-red-50 text-neutral-400 hover:text-red-600 flex items-center justify-center text-xs transition shrink-0"
                          title="Remove from saved roster"
                        >
                          ✕
                        </button>
                      </div>

                      <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed font-sans">
                        {sc.creator?.bio || sc.creator?.primary_specialization}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-black/[0.06]">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block font-sans">
                            Starting from
                          </span>
                          <span className="text-sm font-extrabold text-neutral-900 font-sans">
                            {formatINR(clampDemoBudget(sc.creator?.min_budget, 25000))}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (onOpenChat && sc.creator_id) {
                                onOpenChat({ creatorId: sc.creator_id, targetName: sc.creator?.display_name });
                              }
                            }}
                            className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-purple-700 text-xs font-bold rounded-xl transition flex items-center gap-1 shadow-xs font-sans"
                          >
                            💬 Chat
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (onSelectCreator && sc.creator) onSelectCreator(sc.creator);
                            }}
                            className="btn-primary text-xs py-1.5 px-3.5 shadow-xs font-sans"
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
                <h2 className="text-xl font-bold font-sans text-neutral-900 tracking-tight">Direct Collaboration Discussions</h2>
                <p className="text-xs text-neutral-500 mt-0.5 font-sans">
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
                <h2 className="text-xl font-bold font-sans text-neutral-900 tracking-tight">
                  Discover Audited AI Creators
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5 font-sans">
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

          {/* TAB 7: ANALYTICS */}
          {activeTab === 'analytics' && (
            <BrandAnalyticsView
              profile={profile}
              briefs={briefs}
              applications={applications}
              engagements={engagements}
              hiredCreators={hiredCreators}
              savedCreators={savedCreators}
              onNavigate={(tab) => {
                setActiveTab(tab);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenCreateBrief={() => setIsCreateBriefOpen(true)}
              isLoading={isLoading}
              error={error}
              onRetry={loadData}
            />
          )}

          {/* TAB 8: SETTINGS */}
          {activeTab === 'settings' && (
            <PortalSettingsView
              currentUser={currentUser}
              profile={profile}
              onOpenEditProfile={() => setIsEditProfileOpen(true)}
              role="BRAND"
            />
          )}
        </div>

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
