import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import AddProjectModal from './AddProjectModal';
import EditCreatorProfileModal from './EditCreatorProfileModal';
import SubmitDeliverableModal from './SubmitDeliverableModal';
import MessagesInbox from './MessagesInbox';
import CollaborationWorkspaceModal from './CollaborationWorkspaceModal';
import BrandLogo from './BrandLogo';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';
import CreatorAnalyticsView from './CreatorAnalyticsView';
import PortalSettingsView from './PortalSettingsView';
import { getCreatorAvatar, getBriefCoverImage } from '../utils/visualAssetHelpers';
import { resolveBriefDomain, DOMAIN_LABELS, DOMAIN_FOLDERS } from '../utils/briefImageMap';
import { formatINR, clampDemoBudget } from '../utils/indianLocalization';

// SVG Icon Helpers matching Reference Design
const LayoutDashboardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </svg>
);
const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const PaletteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.563-2.512 5.563-5.563C22 6.5 17.5 2 12 2z" />
  </svg>
);
const CompassIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
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
const HeartHandshakeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);
const MessageSquareIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const SparklesIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
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

export default function CreatorDashboard({
  currentUser,
  approvalStatus = null,
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
      return localStorage.getItem('kivora_creator_tab') || 'overview';
    } catch {
      return 'overview';
    }
  }); // 'overview' | 'profile' | 'portfolio' | 'briefs' | 'opportunities' | 'invitations' | 'applications' | 'saved' | 'collaborations' | 'messages' | 'verification'

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
    if (chatContext) {
      setActiveTab('messages');
    }
  }, [initialTab, chatContext]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    try {
      localStorage.setItem('kivora_creator_tab', tabId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // ignore
    }
  };

  const handleNotificationNavigate = (view, opts) => {
    if (opts?.tab) {
      if (opts.tab === 'projects') {
        handleTabChange('collaborations');
      } else {
        handleTabChange(opts.tab);
      }
    } else if (view === 'inbox' || view === 'messages') {
      handleTabChange('messages');
    } else if (view === 'briefs') {
      handleTabChange('briefs');
    } else {
      handleTabChange('overview');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
  const [selectedWorkspaceEngagementId, setSelectedWorkspaceEngagementId] = useState(null);

  // Verification request form state
  const [selectedEvidenceProject, setSelectedEvidenceProject] = useState('');
  const [verScope, setVerScope] = useState('');
  const [verSuccessMsg, setVerSuccessMsg] = useState(null);

  const [collaboratingBrands, setCollaboratingBrands] = useState([]);
  const [collabSubView, setCollabSubView] = useState('engagements'); // 'engagements' | 'brands'

  // Phase 2 states
  const [invitations, setInvitations] = useState(null);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(true);
  const [invitationsError, setInvitationsError] = useState(null);
  const [savedBriefs, setSavedBriefs] = useState([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [opportunities, setOpportunities] = useState([]);
  const [alertPreferences, setAlertPreferences] = useState(null);
  const [isRefreshingOpps, setIsRefreshingOpps] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState(null);
  const [expandedOppId, setExpandedOppId] = useState(null);

  // Portal Search & Brief Filters matching reference
  const [portalSearchQuery, setPortalSearchQuery] = useState('');
  const [creatorBriefCategory, setCreatorBriefCategory] = useState('ALL');
  const [creatorContentType, setCreatorContentType] = useState('ALL');
  const [creatorBudgetRange, setCreatorBudgetRange] = useState('ALL');
  const [creatorPlatform, setCreatorPlatform] = useState('ALL');
  const [creatorCampaignGoal, setCreatorCampaignGoal] = useState('ALL');
  const [creatorSortBy, setCreatorSortBy] = useState('LATEST');
  const [allBriefs, setAllBriefs] = useState([]);

  // Smart Opportunities Domain & Search Filter State
  const [oppSearchQuery, setOppSearchQuery] = useState('');
  const [oppDomainFilter, setOppDomainFilter] = useState('ALL');

  const refreshInvitations = async (silent = false) => {
    try {
      if (!silent) setIsLoadingInvitations(true);
      setInvitationsError(null);
      const invData = await api.getMyInvitations();
      setInvitations(invData || []);
    } catch (err) {
      console.error('Error refreshing invitations:', err);
      if (!silent) setInvitationsError(err.message || 'Failed to load invitations.');
    } finally {
      if (!silent) setIsLoadingInvitations(false);
    }
  };

  const refreshSavedBriefs = async () => {
    try {
      setIsLoadingSaved(true);
      const savedData = await api.getSavedBriefs();
      setSavedBriefs(savedData || []);
    } catch (err) {
      console.error('Error refreshing saved briefs:', err);
    } finally {
      setIsLoadingSaved(false);
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [profData, appsData, engsData, verData, brandsData, invData, savedData, oppsData, prefData, briefsData] = await Promise.all([
        api.getMyCreatorProfile().catch(() => null),
        api.getMyApplications().catch(() => []),
        api.getEngagements().catch(() => []),
        api.getMyVerificationRequests().catch(() => []),
        api.getCollaboratingBrands().catch(() => []),
        api.getMyInvitations().catch(() => []),
        api.getSavedBriefs().catch(() => []),
        api.getOpportunityAlerts().catch(() => []),
        api.getAlertPreferences().catch(() => null),
        api.getBriefs().catch(() => []),
      ]);

      setProfile(profData);
      setApplications(appsData || []);
      setEngagements(engsData || []);
      setVerifications(verData || []);
      setCollaboratingBrands(brandsData || []);
      setInvitations(invData || []);
      setIsLoadingInvitations(false);
      setSavedBriefs(savedData || []);
      setOpportunities(oppsData || []);
      setAlertPreferences(prefData);
      setAllBriefs(Array.isArray(briefsData) ? briefsData : []);
    } catch (err) {
      console.error('Error loading creator dashboard:', err);
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDiscoverBriefs = useMemo(() => {
    return allBriefs.filter((brief) => {
      // 1. Category pill filter
      if (creatorBriefCategory !== 'ALL') {
        const cat = creatorBriefCategory.toLowerCase();
        const briefDomain = resolveBriefDomain(brief).toLowerCase();
        const briefCats = (brief.categories || []).map((c) => (c.name || c.slug || '').toLowerCase());
        const title = (brief.title || '').toLowerCase();
        const obj = (brief.campaign_objective || '').toLowerCase();
        const match =
          briefDomain.includes(cat) ||
          briefCats.some((c) => c.includes(cat)) ||
          title.includes(cat) ||
          obj.includes(cat);
        if (!match) return false;
      }

      // 2. Content Type
      if (creatorContentType !== 'ALL') {
        const ct = (brief.content_type || '').toUpperCase();
        if (creatorContentType === 'VIDEO' && ct !== 'VIDEO') return false;
        if (creatorContentType === 'REELS' && (ct !== 'VIDEO' || brief.aspect_ratio !== '9:16')) return false;
        if (creatorContentType === 'ANIMATION' && !ct.includes('ANIMATION') && !ct.includes('3D')) return false;
        if (creatorContentType === 'STILLS' && ct !== 'IMAGE' && ct !== 'STILL_IMAGE') return false;
      }

      // 3. Budget Range
      if (creatorBudgetRange !== 'ALL') {
        const amt = clampDemoBudget(brief.budget_amount, 35000);
        if (creatorBudgetRange === 'TIER_1' && amt >= 25000) return false;
        if (creatorBudgetRange === 'TIER_2' && (amt < 25000 || amt > 40000)) return false;
        if (creatorBudgetRange === 'TIER_3' && amt <= 40000) return false;
      }

      // 4. Platform
      if (creatorPlatform !== 'ALL') {
        const target = creatorPlatform.toLowerCase();
        const platforms = (brief.target_platforms || []).map((p) => p.toLowerCase());
        const desc = (brief.deliverables_description || '').toLowerCase();
        if (platforms.length > 0) {
          if (!platforms.some((p) => p.includes(target))) return false;
        } else if (!desc.includes(target) && !(brief.title || '').toLowerCase().includes(target)) {
          // pass through if generic
        }
      }

      // 5. Campaign Goal
      if (creatorCampaignGoal !== 'ALL') {
        const goal = (brief.campaign_objective || '').toLowerCase();
        if (creatorCampaignGoal === 'AWARENESS' && !goal.includes('awareness') && !goal.includes('launch')) return false;
        if (creatorCampaignGoal === 'CONVERSIONS' && !goal.includes('sales') && !goal.includes('conversion') && !goal.includes('ad')) return false;
        if (creatorCampaignGoal === 'REELS' && !goal.includes('reel') && brief.aspect_ratio !== '9:16') return false;
      }

      // 6. Search query
      if (portalSearchQuery.trim()) {
        const q = portalSearchQuery.toLowerCase();
        const title = (brief.title || '').toLowerCase();
        const brand = (brief.brand_company_name || brief.brand?.company_name || '').toLowerCase();
        const obj = (brief.campaign_objective || '').toLowerCase();
        if (!title.includes(q) && !brand.includes(q) && !obj.includes(q)) return false;
      }

      return true;
    }).sort((a, b) => {
      if (creatorSortBy === 'BUDGET_HIGH') return (Number(b.budget_amount) || 0) - (Number(a.budget_amount) || 0);
      if (creatorSortBy === 'BUDGET_LOW') return (Number(a.budget_amount) || 0) - (Number(b.budget_amount) || 0);
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
  }, [allBriefs, creatorBriefCategory, creatorContentType, creatorBudgetRange, creatorPlatform, creatorCampaignGoal, creatorSortBy, portalSearchQuery]);

  const handleAcceptInvitation = async (invId, briefId) => {
    try {
      await api.acceptInvitation(invId);
      setActionSuccessMsg('Invitation accepted! Collaboration thread and workspace activated.');
      setTimeout(() => setActionSuccessMsg(null), 3500);
      await Promise.all([refreshInvitations(true), loadData()]);
      if (briefId) {
        try {
          const res = await api.getContextualConversation({ brief_id: briefId });
          if (res?.status === 'found' && res.conversation && onOpenChat) {
            onOpenChat({ conversationId: res.conversation.id, briefId: briefId });
            return;
          }
        } catch {
          // ignore
        }
      }
      handleTabChange('messages');
    } catch (err) {
      alert(err.message || 'Failed to accept invitation.');
    }
  };

  const handleDeclineInvitation = async (invId) => {
    const reason = window.prompt('Optional reason for declining this campaign invitation:');
    try {
      await api.declineInvitation(invId, reason || undefined);
      setActionSuccessMsg('Invitation declined.');
      setTimeout(() => setActionSuccessMsg(null), 3000);
      await Promise.all([refreshInvitations(true), loadData()]);
    } catch (err) {
      alert(err.message || 'Failed to decline invitation.');
    }
  };

  const handleUnsaveBrief = async (briefId) => {
    if (!briefId) return;
    try {
      await api.unsaveBrief(briefId);
      setSavedBriefs((prev) => prev.filter((b) => (b.brief_id || b.brief?.id) !== briefId && b.id !== briefId));
      setActionSuccessMsg('Brief removed from saved bookmarks.');
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Error removing bookmark:', err);
      alert('Failed to remove bookmark: ' + (err.message || 'Network error'));
    }
  };

  const handleRefreshOpportunities = async () => {
    try {
      setIsRefreshingOpps(true);
      const refreshed = await api.refreshOpportunityAlerts(60.0);
      setOpportunities(refreshed || []);
      setActionSuccessMsg('Opportunity matches refreshed based on active campaign briefs!');
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } catch (err) {
      alert(err.message || 'Failed to refresh opportunities.');
    } finally {
      setIsRefreshingOpps(false);
    }
  };

  const handleTogglePreference = async (field, value) => {
    if (!alertPreferences) return;
    try {
      const updated = await api.updateAlertPreferences({ [field]: value });
      setAlertPreferences(updated);
    } catch (err) {
      console.error('Error updating alert preference:', err);
    }
  };

  const filteredOpportunities = React.useMemo(() => {
    if (!opportunities || !Array.isArray(opportunities)) return [];
    return opportunities.filter((opp) => {
      const brief = opp.brief;
      if (!brief) return false;

      // 1. Creative Domain filter
      if (oppDomainFilter && oppDomainFilter !== 'ALL') {
        const domain = resolveBriefDomain(brief);
        if (domain !== oppDomainFilter) return false;
      }

      // 2. Search query filter
      if (oppSearchQuery && oppSearchQuery.trim()) {
        const q = oppSearchQuery.toLowerCase().trim();
        const title = (brief.title || '').toLowerCase();
        const obj = (brief.campaign_objective || '').toLowerCase();
        const brand = (brief.brand?.company_name || '').toLowerCase();
        const desc = (brief.deliverables_description || '').toLowerCase();
        const format = (brief.content_type || '').toLowerCase();
        const reasons = (opp.match_reasons || []).join(' ').toLowerCase();

        if (
          !title.includes(q) &&
          !obj.includes(q) &&
          !brand.includes(q) &&
          !desc.includes(q) &&
          !format.includes(q) &&
          !reasons.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [opportunities, oppDomainFilter, oppSearchQuery]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'saved') {
      refreshSavedBriefs();
    } else if (activeTab === 'invitations') {
      refreshInvitations();
    }
  }, [activeTab]);

  // Periodic background check to keep invitations and badge count synchronized
  useEffect(() => {
    const interval = setInterval(() => {
      refreshInvitations(true);
    }, 30000);
    return () => clearInterval(interval);
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
    <div className="portal-layout">
      {/* Sidebar with Purple/Lavender Gradient */}
      <aside className="portal-sidebar">
        <div>
          {/* Brand Logo with clickable link */}
          <div
            className="portal-sidebar-logo"
            onClick={onNavigateHome}
            title="Return to Kivora Homepage"
          >
            <span>Kivora</span>
            <span className="brand-dot">.</span>
          </div>

          {/* Creator Mini Profile Card */}
          <div
            className="portal-profile-card cursor-pointer"
            onClick={() => setIsEditProfileOpen(true)}
            title="Edit Creator Profile"
          >
            <img
              src={getCreatorAvatar(profile)}
              alt={profile?.display_name || currentUser?.full_name || 'Creator'}
              className="portal-profile-avatar"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/assets/creator-portraits/devon.jpg';
              }}
            />
            <div className="portal-profile-info">
              <div className="portal-profile-name">
                {profile?.display_name || currentUser?.full_name || 'Creator'}
              </div>
              <div className="portal-profile-handle">
                @{profile?.handle || (currentUser?.email ? currentUser.email.split('@')[0] : 'creator')}
              </div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                <span className="portal-profile-badge">
                  {profile?.verification_tier || 'COMMUNITY'}
                </span>
                {(approvalStatus || profile?.approval_status) && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: '800',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      backgroundColor:
                        (approvalStatus || profile?.approval_status) === 'APPROVED'
                          ? '#D1FAE5'
                          : (approvalStatus || profile?.approval_status) === 'LEGACY_ACTIVE'
                          ? '#EDE9FE'
                          : (approvalStatus || profile?.approval_status) === 'REJECTED'
                          ? '#FEE2E2'
                          : '#FEF3C7',
                      color:
                        (approvalStatus || profile?.approval_status) === 'APPROVED'
                          ? '#065F46'
                          : (approvalStatus || profile?.approval_status) === 'LEGACY_ACTIVE'
                          ? '#5B21B6'
                          : (approvalStatus || profile?.approval_status) === 'REJECTED'
                          ? '#991B1B'
                          : '#92400E',
                    }}
                  >
                    ● {(approvalStatus || profile?.approval_status) === 'LEGACY_ACTIVE' ? 'LEGACY ACTIVE' : (approvalStatus || profile?.approval_status)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="portal-nav-list">
            {[
              { id: 'overview', label: 'Dashboard', icon: <LayoutDashboardIcon /> },
              { id: 'profile', label: 'Creator Profile', icon: <UserIcon /> },
              { id: 'portfolio', label: 'My Portfolio', icon: <PaletteIcon />, count: profile?.portfolio_projects?.length },
              { id: 'briefs', label: 'Discover Briefs', icon: <CompassIcon /> },
              { id: 'applications', label: 'My Applications', icon: <FileTextIcon />, count: applications?.length },
              { id: 'collaborations', label: 'Collaborations', icon: <HeartHandshakeIcon />, count: engagements?.length },
              { id: 'messages', label: 'Messages & Chat', icon: <MessageSquareIcon /> },
              { id: 'opportunities', label: 'Opportunities', icon: <SparklesIcon />, count: opportunities?.length },
              { id: 'analytics', label: 'Analytics', icon: <BarChartIcon /> },
              { id: 'settings', label: 'Settings', icon: <SettingsIcon /> },
            ].map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTabChange(item.id)}
                  className={`portal-nav-item ${isActive ? 'active' : ''}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="portal-nav-icon">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && !isActive && (
                    <span className="portal-nav-count">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer with Log Out */}
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
          <div className="portal-pill-badge creator">
            <span>✨</span>
            <span>Creator Studio</span>
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
              placeholder="Search brand briefs, keywords, or categories..."
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
              onClick={() => handleTabChange('messages')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </button>

            <img
              src={getCreatorAvatar(profile)}
              alt={profile?.display_name || 'Aanya Sharma'}
              className="w-8 h-8 rounded-full object-cover border border-black/10 cursor-pointer shadow-xs"
              onClick={() => setIsEditProfileOpen(true)}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/assets/creator-portraits/elena.jpg';
              }}
              title={profile?.display_name || currentUser?.display_name || currentUser?.full_name || 'Aanya Sharma'}
            />
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
                  <span className="text-xs text-neutral-500 font-sans block mb-0.5">Welcome back,</span>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 font-sans tracking-tight">
                      {profile?.display_name || currentUser?.display_name || currentUser?.full_name || 'Aanya Sharma'}
                    </h1>
                    {profile?.verification_tier === 'TOP_STUDIO' && (
                      <span className="text-amber-500 text-xl" title="Top Rated Verified Pro">✨</span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 mt-1 font-sans">
                    Create. Collaborate. Grow with Kivora.
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    className="portal-btn-primary"
                    onClick={() => handleTabChange('briefs')}
                  >
                    <span>Explore Briefs</span>
                    <span>→</span>
                  </button>
                </div>
              </div>

              {/* 4 Pastel Stat Cards */}
              <div className="portal-stat-grid">
                {/* 1. Portfolio Works (Pastel Lavender) */}
                <div className="portal-stat-card lavender">
                  <div className="portal-stat-header">
                    <div className="portal-stat-icon-wrap" style={{ background: '#F3E2FD', color: '#683EE6' }}>
                      🎨
                    </div>
                    <span className="portal-stat-title">Portfolio Works</span>
                  </div>
                  <div>
                    <div className="portal-stat-value">
                      {profile?.portfolio_projects ? profile.portfolio_projects.length : 0}
                    </div>
                    <div className="portal-stat-subtitle">
                      Published projects
                    </div>
                  </div>
                </div>

                {/* 2. Applications (Pastel Mint/Lavender) */}
                <div className="portal-stat-card lavender">
                  <div className="portal-stat-header">
                    <div className="portal-stat-icon-wrap" style={{ background: '#EDE9FE', color: '#6D28D9' }}>
                      📝
                    </div>
                    <span className="portal-stat-title">Applications</span>
                  </div>
                  <div>
                    <div className="portal-stat-value">
                      {applications ? applications.length : 0}
                    </div>
                    <div className="portal-stat-subtitle">
                      Total submitted
                    </div>
                  </div>
                </div>

                {/* 3. Active Collaborations (Pastel Mint) */}
                <div className="portal-stat-card mint">
                  <div className="portal-stat-header">
                    <div className="portal-stat-icon-wrap" style={{ background: '#DBF7E9', color: '#059669' }}>
                      🤝
                    </div>
                    <span className="portal-stat-title">Active Collaborations</span>
                  </div>
                  <div>
                    <div className="portal-stat-value">
                      {engagements ? engagements.filter((e) => e.status !== 'COMPLETED').length : 0}
                    </div>
                    <div className="portal-stat-subtitle">
                      Projects in progress
                    </div>
                  </div>
                </div>

                {/* 4. Average Rating (Pastel Warm Yellow) */}
                <div className="portal-stat-card yellow">
                  <div className="portal-stat-header">
                    <div className="portal-stat-icon-wrap" style={{ background: '#FDF4D4', color: '#D97706' }}>
                      ★
                    </div>
                    <span className="portal-stat-title">Average Rating</span>
                  </div>
                  <div>
                    <div className="portal-stat-value flex items-center gap-1">
                      {profile?.completed_projects_count && profile.completed_projects_count > 0 ? (
                        <>
                          <span className="text-amber-500 text-lg">★</span>
                          <span>{Number(profile.average_rating || 5.0).toFixed(1)}</span>
                        </>
                      ) : (
                        <span className="text-sm font-semibold text-neutral-400">— (New)</span>
                      )}
                    </div>
                    <div className="portal-stat-subtitle">
                      {profile?.completed_projects_count && profile.completed_projects_count > 0
                        ? `From ${profile.completed_projects_count} reviews`
                        : 'No reviews yet'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Campaign Collaborations */}
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <h2 className="text-base font-bold text-neutral-900 font-sans tracking-tight">
                    Active Campaign Collaborations
                  </h2>
                  <button
                    type="button"
                    className="text-xs font-semibold text-purple-700 hover:text-purple-900 transition font-sans"
                    onClick={() => handleTabChange('collaborations')}
                  >
                    View All →
                  </button>
                </div>

                {engagements && engagements.length > 0 ? (
                  <div className="space-y-3">
                    {engagements.slice(0, 3).map((collab, idx) => {
                      const coverImg =
                        idx === 0
                          ? '/assets/campaign-covers/brand_skincare_cover.jpg'
                          : '/assets/campaign-covers/golden_serum_cover.jpg';

                      return (
                        <div
                          key={collab.id}
                          className="portal-card-row cursor-pointer"
                          onClick={() => {
                            setSelectedWorkspaceEngagementId(collab.id);
                          }}
                        >
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <img
                              src={coverImg}
                              alt={collab.brief_title}
                              className="w-16 h-14 sm:w-20 sm:h-16 rounded-xl object-cover shrink-0 border border-black/[0.04]"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/assets/campaign-covers/brand_fashion_cover.jpg';
                              }}
                            />
                            <div className="min-w-0 flex-1">
                              <span className="portal-badge-tag approved mb-1">
                                {collab.status || 'ACTIVE'}
                              </span>
                              <h3 className="text-sm font-bold text-neutral-900 font-sans tracking-tight truncate">
                                {collab.brief_title}
                              </h3>
                              <p className="text-xs text-neutral-500 mt-0.5 font-sans">
                                Brand: <strong className="text-neutral-700">{collab.brand_company_name || 'Brand Partner'}</strong> • Agreed: {formatINR(clampDemoBudget(collab.agreed_amount, 35000))}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <button
                              type="button"
                              className="portal-btn-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSubmittingEngagement(collab);
                              }}
                            >
                              Submit Deliverable
                            </button>
                            <button
                              type="button"
                              className="portal-dots-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTabChange('collaborations');
                              }}
                              title="Collaboration options"
                            >
                              ⋮
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-black/[0.06] p-8 text-center shadow-xs">
                    <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3 text-xl">
                      🤝
                    </div>
                    <h3 className="text-sm font-bold text-neutral-900 mb-1">No Active Collaborations Yet</h3>
                    <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-4">
                      Explore open brand campaign briefs, submit creative proposals, and launch your first collaboration.
                    </p>
                    <button
                      type="button"
                      className="portal-btn-primary"
                      onClick={() => handleTabChange('briefs')}
                    >
                      Browse Campaign Briefs →
                    </button>
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
                      src={getCreatorAvatar(profile)}
                      alt={profile?.display_name || 'Creator'}
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
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/assets/creator-portraits/devon.jpg';
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
                    <span className="text-sm font-bold text-neutral-900">{formatINR(clampDemoBudget(profile?.min_budget, 25000))}</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-neutral-500 uppercase block">Hourly Rate</span>
                    <span className="text-sm font-bold text-neutral-900">{profile?.hourly_rate ? formatINR(profile.hourly_rate >= 500 ? profile.hourly_rate : profile.hourly_rate * 25) : '₹2,500'}/hr</span>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {profile?.portfolio_projects?.map((proj) => (
                    <div
                      key={proj.id}
                      className="glass-panel rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between border border-black/5"
                    >
                      <div
                        className="cursor-pointer relative aspect-video bg-neutral-900 group overflow-hidden"
                        onClick={() => onSelectProject(proj)}
                      >
                        <img
                          src={proj.thumbnail_url || proj.primary_asset_url}
                          alt={proj.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none gap-2">
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-black/75 text-white uppercase tracking-wider backdrop-blur-sm">
                            {proj.content_type || 'Asset'}
                          </span>
                          {proj.featured && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-purple-600 text-white shadow-sm flex items-center gap-1 font-sans">
                              <span>★</span>
                              <span>Featured</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <h4
                            className="text-sm font-bold text-neutral-900 hover:text-purple-700 cursor-pointer line-clamp-1 min-h-[20px]"
                            onClick={() => onSelectProject(proj)}
                            title={proj.title}
                          >
                            {proj.title}
                          </h4>
                          <p className="text-xs text-neutral-500 line-clamp-2 mt-1 min-h-[32px] leading-relaxed">
                            {proj.description || 'No description provided.'}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-black/10 flex items-center justify-between text-xs gap-2">
                          <span className="text-[10px] text-neutral-500 font-mono bg-neutral-100 px-2 py-0.5 rounded">
                            {proj.aspect_ratio || '16:9'} • {proj.resolution || '4K'}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="btn-secondary text-xs py-1 px-2.5 rounded-lg font-semibold"
                              onClick={() => {
                                setEditingProject(proj);
                                setIsAddProjectOpen(true);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition font-semibold"
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

          {/* TAB 4: BRIEFS (DISCOVER BRAND BRIEFS MATCHING REFERENCE) */}
          {activeTab === 'briefs' && (
            <div className="space-y-5">
              {/* Header */}
              <div>
                <h1 className="text-2xl font-extrabold text-neutral-900 font-sans tracking-tight">
                  Discover Brand Briefs
                </h1>
                <p className="text-xs text-neutral-500 mt-1 font-sans">
                  Find exciting opportunities and collaborate with verified brands.
                </p>
              </div>

              {/* Category Pills Row */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
                {[
                  { key: 'ALL', label: 'All' },
                  { key: 'SKINCARE', label: 'Skincare' },
                  { key: 'BEAUTY', label: 'Beauty' },
                  { key: 'FASHION', label: 'Fashion' },
                  { key: 'TECH', label: 'Tech' },
                  { key: 'FOOD', label: 'Food' },
                  { key: 'LIFESTYLE', label: 'Lifestyle' },
                  { key: 'TRAVEL', label: 'Travel' },
                  { key: 'GAMING', label: 'Gaming' },
                  { key: 'MORE', label: 'More ⌄' },
                ].map((cat) => {
                  const isActive = creatorBriefCategory === cat.key;
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setCreatorBriefCategory(cat.key)}
                      className={`portal-category-pill ${isActive ? 'active' : 'inactive'}`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  className="portal-category-pill inactive"
                  title="Filter options"
                >
                  🎛️
                </button>
              </div>

              {/* Filter Dropdowns Row */}
              <div className="portal-filter-bar pt-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <select
                    className="portal-dropdown-btn"
                    value={creatorContentType}
                    onChange={(e) => setCreatorContentType(e.target.value)}
                  >
                    <option value="ALL">Content Type ⌄</option>
                    <option value="VIDEO">Video</option>
                    <option value="REELS">Reels</option>
                    <option value="ANIMATION">Animation / 3D</option>
                    <option value="STILLS">Stills</option>
                  </select>

                  <select
                    className="portal-dropdown-btn"
                    value={creatorBudgetRange}
                    onChange={(e) => setCreatorBudgetRange(e.target.value)}
                  >
                    <option value="ALL">Budget Range ⌄</option>
                    <option value="TIER_1">&lt; ₹25,000</option>
                    <option value="TIER_2">₹25,000 - ₹40,000</option>
                    <option value="TIER_3">&gt; ₹40,000</option>
                  </select>

                  <select
                    className="portal-dropdown-btn"
                    value={creatorPlatform}
                    onChange={(e) => setCreatorPlatform(e.target.value)}
                  >
                    <option value="ALL">Platform ⌄</option>
                    <option value="INSTAGRAM">Instagram</option>
                    <option value="YOUTUBE">YouTube</option>
                    <option value="TIKTOK">TikTok</option>
                    <option value="WEB">Web</option>
                  </select>

                  <select
                    className="portal-dropdown-btn"
                    value={creatorCampaignGoal}
                    onChange={(e) => setCreatorCampaignGoal(e.target.value)}
                  >
                    <option value="ALL">Campaign Goal ⌄</option>
                    <option value="AWARENESS">Brand Awareness</option>
                    <option value="CONVERSIONS">Conversions</option>
                    <option value="REELS">Social Reels</option>
                  </select>

                  {(creatorBriefCategory !== 'ALL' ||
                    creatorContentType !== 'ALL' ||
                    creatorBudgetRange !== 'ALL' ||
                    creatorPlatform !== 'ALL' ||
                    creatorCampaignGoal !== 'ALL' ||
                    portalSearchQuery) && (
                    <button
                      type="button"
                      className="text-xs font-semibold text-purple-700 hover:text-purple-900 transition ml-1 font-sans"
                      onClick={() => {
                        setCreatorBriefCategory('ALL');
                        setCreatorContentType('ALL');
                        setCreatorBudgetRange('ALL');
                        setCreatorPlatform('ALL');
                        setCreatorCampaignGoal('ALL');
                        setPortalSearchQuery('');
                      }}
                    >
                      Clear Filters
                    </button>
                  )}
                </div>

                <div className="shrink-0">
                  <select
                    className="portal-dropdown-btn"
                    value={creatorSortBy}
                    onChange={(e) => setCreatorSortBy(e.target.value)}
                  >
                    <option value="LATEST">Sort by: Latest ⌄</option>
                    <option value="BUDGET_HIGH">Sort by: Highest Budget ⌄</option>
                    <option value="BUDGET_LOW">Sort by: Lowest Budget ⌄</option>
                  </select>
                </div>
              </div>

              {/* 3-Column Brief Cards Grid */}
              {(() => {
                const briefsToDisplay =
                  filteredDiscoverBriefs.length > 0
                    ? filteredDiscoverBriefs
                    : allBriefs;

                if (!briefsToDisplay || briefsToDisplay.length === 0) {
                  return (
                    <div className="bg-white rounded-2xl border border-black/[0.06] p-12 text-center shadow-xs">
                      <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3 text-xl">
                        🧭
                      </div>
                      <h3 className="text-base font-bold text-neutral-900 mb-1">No Campaign Briefs Found</h3>
                      <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                        No active briefs currently match your selected filters. Try broadening your criteria or clear category filters.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="portal-brief-grid">
                    {briefsToDisplay.map((brief, idx) => {
                      const coverImg =
                        brief.cover_image ||
                        getBriefCoverImage(brief) ||
                        (idx === 0
                          ? '/assets/campaign-covers/brand_skincare_cover.jpg'
                          : idx === 1
                          ? '/assets/campaign-covers/golden_serum_cover.jpg'
                          : '/assets/campaign-covers/brand_fashion_cover.jpg');

                      return (
                        <div
                          key={brief.id}
                          className="portal-brief-grid-card cursor-pointer group"
                          onClick={() => onSelectBrief(brief)}
                        >
                          {/* Image Cover with floating status tag */}
                          <div className="portal-brief-thumb-wrap">
                            <img
                              src={coverImg}
                              alt={brief.title}
                              className="portal-brief-thumb"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/assets/campaign-covers/brand_skincare_cover.jpg';
                              }}
                            />
                            <span className="portal-brief-status-tag">
                              {brief.status === 'PUBLISHED' || !brief.status ? 'OPEN' : brief.status}
                            </span>
                          </div>

                          {/* Body */}
                          <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                            <div className="space-y-2">
                              {/* Brand info */}
                              <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full bg-purple-100 border border-purple-200 text-purple-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                                  {(brief.brand_company_name || brief.brand?.company_name || 'L')[0]}
                                </div>
                                <span className="text-xs font-semibold text-neutral-800 truncate">
                                  {brief.brand_company_name || brief.brand?.company_name || 'Lumina Skincare'}
                                </span>
                                <span className="portal-verified-circle" style={{ width: 14, height: 14, fontSize: 8 }} title="Audited & Verified Brand">✓</span>
                              </div>

                              {/* Title */}
                              <h3 className="text-sm font-bold text-neutral-900 font-sans tracking-tight line-clamp-1 group-hover:text-purple-700 transition">
                                {brief.title}
                              </h3>

                              {/* Objective / Description */}
                              <p className="text-xs text-neutral-500 font-sans line-clamp-2 leading-relaxed">
                                {brief.campaign_objective || brief.deliverables_description || 'Creative campaign brief.'}
                              </p>
                            </div>

                            <div className="pt-2 border-t border-black/[0.04] space-y-2">
                              {/* Budget */}
                              <div>
                                <span className="portal-budget-pill">
                                  {formatINR(clampDemoBudget(brief.budget_amount, 35000))}
                                </span>
                              </div>

                              {/* Tags */}
                              <div className="flex items-center gap-1.5 flex-wrap">
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

                          {/* Footer Button */}
                          <div className="p-4 pt-0">
                            <button
                              type="button"
                              className="portal-btn-outline-purple w-full text-center py-2 text-xs font-bold"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectBrief(brief);
                              }}
                            >
                              <span>View Details</span>
                              <span>→</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
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
                    <div key={app.id} className="glass-panel p-6 rounded-2xl space-y-4 border border-black/5 hover:border-purple-200 transition">
                      {/* Top Header Row: Brief Title + Brand & Status Badge */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                              {app.brand_name || 'Brand Partner'}
                            </span>
                            <span className="text-xs text-neutral-400">
                              ID: {app.id.slice(0, 8)}
                            </span>
                          </div>
                          <h3
                            className="text-base font-bold text-neutral-900 hover:text-purple-700 cursor-pointer transition line-clamp-1"
                            onClick={() => {
                              if (onSelectBrief && app.brief_id) {
                                onSelectBrief({ id: app.brief_id, title: app.brief_title });
                              }
                            }}
                            title="View brief details"
                          >
                            {app.brief_title || 'Commercial Campaign Brief'} ↗
                          </h3>
                        </div>

                        {/* Status Label - fully contained with clear border and pill */}
                        <div className="shrink-0 self-start">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border shadow-xs ${
                              app.status === 'ACCEPTED'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : app.status === 'REJECTED'
                                ? 'bg-red-50 text-red-800 border-red-200'
                                : app.status === 'SHORTLISTED'
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-purple-50 text-purple-800 border-purple-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                app.status === 'ACCEPTED'
                                  ? 'bg-emerald-600'
                                  : app.status === 'REJECTED'
                                  ? 'bg-red-600'
                                  : app.status === 'SHORTLISTED'
                                  ? 'bg-amber-600'
                                  : 'bg-purple-600'
                              }`}
                            />
                            {app.status}
                          </span>
                        </div>
                      </div>

                      {/* 3-Section Metadata Strip */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-white/80 border border-black/5 text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                            Proposed Compensation
                          </span>
                          <span className="font-bold text-purple-700 text-sm mt-0.5 block">
                            {formatINR(clampDemoBudget(app.proposed_rate, 35000))}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                            Production Timeline
                          </span>
                          <span className="font-semibold text-neutral-800 text-sm mt-0.5 block">
                            {app.proposed_timeline_days} Calendar Days
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
                            Submitted Date
                          </span>
                          <span className="font-medium text-neutral-600 text-xs mt-1 block">
                            {new Date(app.submitted_at).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Pitch Text Section */}
                      <div className="p-4 rounded-xl bg-neutral-50/80 border border-black/5 text-xs text-neutral-700 space-y-1.5">
                        <strong className="block text-neutral-900 text-[11px] uppercase tracking-wider font-bold">
                          Proposal & Creative Approach:
                        </strong>
                        <p className="whitespace-pre-wrap leading-relaxed break-words">
                          {app.pitch_text}
                        </p>
                      </div>

                      {/* Brand Feedback (if available) */}
                      {app.brand_feedback && (
                        <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 space-y-1">
                          <strong className="block text-purple-800 text-[11px] uppercase tracking-wider font-bold">
                            Brand Client Feedback:
                          </strong>
                          <p className="leading-relaxed">{app.brand_feedback}</p>
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
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-serif font-bold text-neutral-900">
                    Campaign Collaborations & Brand History
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Track your client relationships, submit master asset files, and manage brand deliverables.
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
                    All Engagements ({engagements.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCollabSubView('brands')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      collabSubView === 'brands'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    Brand Partners ({collaboratingBrands.length})
                  </button>
                </div>
              </div>

              {collabSubView === 'brands' ? (
                /* BRAND PARTNERS VIEW */
                collaboratingBrands.length === 0 ? (
                  <div className="glass-panel p-12 text-center rounded-2xl">
                    <p className="text-neutral-500 text-xs">No brand collaborations on record yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {collaboratingBrands.map((brand) => (
                      <div key={brand.brand_id} className="glass-panel p-5 rounded-2xl space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <BrandLogo
                              brand={brand}
                              brandName={brand.company_name}
                              size={48}
                              shape="rounded"
                              padding="3px"
                            />
                            <div>
                              <h3 className="text-sm font-bold text-neutral-900">{brand.company_name}</h3>
                              <span className="text-[11px] text-purple-700 font-medium">{brand.industry || 'Commercial Client'}</span>
                            </div>
                          </div>
                          <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-purple-100 text-purple-800">
                            {brand.collaborations_count} {brand.collaborations_count === 1 ? 'Campaign' : 'Campaigns'}
                          </span>
                        </div>

                        {/* Engagements list with this brand */}
                        <div className="space-y-2 pt-2 border-t border-black/5">
                          <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                            Campaign History with {brand.company_name}
                          </h4>
                          {brand.engagements?.map((be) => (
                            <div
                              key={be.id}
                              className="p-3 rounded-xl bg-white/70 border border-black/5 text-xs flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <p className="font-semibold text-neutral-900 truncate">{be.brief_title}</p>
                                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-500">
                                  <span>{formatINR(clampDemoBudget(be.agreed_amount, 35000))} Agreed</span>
                                  <span>•</span>
                                  <span>{be.deliverables_count} Deliverables</span>
                                </div>
                              </div>
                              <span
                                className={`shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                  be.status === 'COMPLETED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-purple-100 text-purple-800'
                                }`}
                              >
                                {be.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                /* ALL ENGAGEMENTS VIEW */
                engagements.length === 0 ? (
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
                            Brand: <strong>{eng.brand_company_name}</strong> • Agreed Budget: {formatINR(clampDemoBudget(eng.agreed_amount, 35000))}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="btn-secondary text-xs flex items-center gap-1.5"
                            onClick={() => {
                              if (onOpenChat) {
                                onOpenChat({ briefId: eng.brief_id, brandId: eng.brand_id, targetName: eng.brand_company_name });
                              } else {
                                handleTabChange('messages');
                              }
                            }}
                          >
                            💬 Chat
                          </button>
                          <button
                            type="button"
                            className="btn-secondary text-xs flex items-center gap-1.5"
                            onClick={() => setSelectedWorkspaceEngagementId(eng.id)}
                          >
                            🚀 Open Workspace
                          </button>
                          {eng.status !== 'COMPLETED' && (
                            <button
                              type="button"
                              className="btn-primary text-xs"
                              onClick={() => setSubmittingEngagement(eng)}
                            >
                              + Submit Deliverable
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
              )
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          {/* TAB 8: DIRECT INVITATIONS */}
          {activeTab === 'invitations' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900">Campaign Invitations</h2>
                  <p className="text-xs text-neutral-500">
                    Direct collaboration requests received from verified commercial brands.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {invitations && invitations.some(i => i.status === 'INVITED') && (
                    <span className="text-xs font-semibold px-3 py-1 bg-amber-100 text-amber-800 rounded-full">
                      {invitations.filter(i => i.status === 'INVITED').length} Pending Action
                    </span>
                  )}
                  <span className="text-xs font-semibold px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
                    {isLoadingInvitations && invitations === null ? '...' : `${invitations?.length || 0} Total`}
                  </span>
                </div>
              </div>

              {actionSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
                  ✓ {actionSuccessMsg}
                </div>
              )}

              {isLoadingInvitations && invitations === null ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-black/10">
                  <div className="spinner-sm mx-auto mb-3" />
                  <p className="text-xs text-neutral-500">Loading campaign invitations...</p>
                </div>
              ) : invitationsError ? (
                <div className="p-8 text-center bg-red-50 rounded-2xl border border-red-200">
                  <p className="text-xs text-red-700 font-semibold mb-2">{invitationsError}</p>
                  <button
                    type="button"
                    onClick={() => refreshInvitations()}
                    className="px-3 py-1.5 text-xs font-bold bg-white text-red-700 rounded-lg border border-red-300 hover:bg-red-50"
                  >
                    Retry
                  </button>
                </div>
              ) : !invitations || invitations.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-black/10">
                  <span className="text-3xl block mb-2">✉️</span>
                  <h3 className="text-sm font-bold text-neutral-800">No invitations yet</h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    Keep your profile and portfolio updated to attract direct invitations from brands.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {invitations.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-5 bg-white rounded-2xl border border-black/10 shadow-sm flex flex-col justify-between space-y-4 min-h-[280px]"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3 gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <BrandLogo
                              brandName={inv.brand_name}
                              size={26}
                              shape="rounded"
                              padding="2px"
                            />
                            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg truncate">
                              {inv.brand_name || 'Brand Partner'}
                            </span>
                          </div>
                          <span
                            className={`shrink-0 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                              inv.status === 'INVITED'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : inv.status === 'ACCEPTED'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </div>

                        <h3
                          className="font-bold text-sm text-neutral-900 mb-1.5 hover:text-purple-700 cursor-pointer transition flex items-center gap-1.5 line-clamp-1"
                          onClick={() => {
                            if (onSelectBrief && inv.brief_id) {
                              onSelectBrief({ id: inv.brief_id, title: inv.brief_title });
                            }
                          }}
                          title="Open Campaign Brief details"
                        >
                          <span className="truncate">{inv.brief_title || 'Campaign Brief'}</span>
                          <span className="text-purple-600 text-xs shrink-0">↗</span>
                        </h3>
                        <div className="p-3 bg-neutral-50 rounded-xl border border-black/5 text-xs text-neutral-600 line-clamp-3 leading-relaxed mb-3">
                          {inv.pitch_text || 'Direct collaboration opportunity tailored to your creative expertise.'}
                        </div>

                        <div className="text-xs font-semibold text-neutral-700 flex items-center justify-between pt-2 border-t border-black/5">
                          <span className="text-neutral-500">Offered Compensation:</span>
                          <span className="text-purple-700 font-bold text-sm">{formatINR(clampDemoBudget(inv.proposed_rate, 35000))}</span>
                        </div>
                      </div>

                      {inv.status === 'INVITED' && (
                        <div className="flex items-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => handleAcceptInvitation(inv.id, inv.brief_id)}
                            className="flex-1 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition"
                          >
                            Accept & Kickoff 🚀
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeclineInvitation(inv.id)}
                            className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200 transition"
                          >
                            Decline
                          </button>
                        </div>
                      )}

                      {inv.status === 'ACCEPTED' && (
                        <div className="flex items-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={async () => {
                              if (inv.brief_id) {
                                try {
                                  const res = await api.getContextualConversation({ brief_id: inv.brief_id });
                                  if (res?.status === 'found' && res.conversation && onOpenChat) {
                                    onOpenChat({
                                      conversationId: res.conversation.id,
                                      briefId: inv.brief_id,
                                      targetName: inv.brand_name,
                                    });
                                    return;
                                  }
                                } catch {
                                  // ignore
                                }
                              }
                              handleTabChange('messages');
                            }}
                            className="w-full py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition flex items-center justify-center gap-1.5"
                          >
                            <span>💬</span>
                            <span>Chat with {inv.brand_name || 'Brand'}</span>
                          </button>
                        </div>
                      )}

                      {inv.status !== 'INVITED' && inv.status !== 'ACCEPTED' && (
                        <div className="pt-2">
                          <div className="w-full py-2 text-center text-xs text-neutral-500 font-semibold bg-neutral-50 rounded-xl border border-neutral-200">
                            Status: {inv.status}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 9: SAVED BRIEFS */}
          {activeTab === 'saved' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 font-serif">Saved Campaign Briefs</h2>
                  <p className="text-xs text-neutral-500">
                    Bookmarked opportunities saved for later review and proposal submission.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-3 py-1 bg-purple-100 text-purple-700 rounded-full border border-purple-200">
                    {savedBriefs.length} Saved
                  </span>
                  <button
                    type="button"
                    onClick={refreshSavedBriefs}
                    disabled={isLoadingSaved}
                    className="px-3 py-1.5 bg-white hover:bg-neutral-50 text-neutral-700 rounded-xl text-xs font-semibold border border-black/10 shadow-sm transition flex items-center gap-1.5"
                    title="Refresh saved briefs list"
                  >
                    <span className={isLoadingSaved ? 'animate-spin' : ''}>↻</span>
                    <span>{isLoadingSaved ? 'Refreshing...' : 'Refresh'}</span>
                  </button>
                </div>
              </div>

              {actionSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
                  ✓ {actionSuccessMsg}
                </div>
              )}

              {savedBriefs.length === 0 ? (
                <div className="p-12 text-center bg-white/80 rounded-2xl border border-black/10 glass-panel">
                  <span className="text-4xl block mb-3">🔖</span>
                  <h3 className="text-base font-bold text-neutral-900 font-serif">No saved briefs yet</h3>
                  <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                    Click the bookmark icon on any brief card in "Discover Briefs" to save it here for quick access.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleTabChange('briefs')}
                    className="btn-primary text-xs mt-4"
                  >
                    Discover Open Briefs →
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedBriefs.map((sb) => {
                    const brief = sb.brief || {};
                    const brand = brief.brand || {};
                    const briefId = sb.brief_id || brief.id;

                    return (
                      <div
                        key={sb.id || briefId}
                        className="kivora-saved-brief-card"
                      >
                        <div>
                          {/* Brand Info & Remove Header */}
                          <div className="saved-card-header">
                            <div className="saved-brand-info">
                              <BrandLogo
                                brand={brand}
                                brandName={brand.company_name || 'Brand Partner'}
                                size={38}
                                shape="rounded"
                                padding="2px"
                              />
                              <div className="min-w-0">
                                <h4 className="saved-brand-name">
                                  {brand.company_name || 'Brand Partner'}
                                </h4>
                                <span className="saved-brand-category">
                                  {brand.industry || brief.category || 'Commercial Campaign'}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleUnsaveBrief(briefId)}
                              className="saved-remove-btn"
                              title="Remove from saved briefs"
                            >
                              <span>✕</span>
                              <span>Remove</span>
                            </button>
                          </div>

                          {/* Brief Title & Objective */}
                          <h3
                            className="saved-brief-title"
                            onClick={() => {
                              if (onSelectBrief && brief.id) onSelectBrief(brief);
                            }}
                          >
                            {brief.title || 'Untitled Campaign'}
                          </h3>
                          <p className="saved-brief-desc">
                            {brief.campaign_objective || brief.deliverables_description || 'Commercial production brief requiring verified proof.'}
                          </p>

                          {/* Format & Specification Badges */}
                          <div className="saved-specs-row">
                            {brief.content_type && (
                              <span className="saved-spec-pill">
                                {brief.content_type}
                              </span>
                            )}
                            {brief.aspect_ratio && (
                              <span className="saved-spec-pill saved-spec-pill-purple">
                                {brief.aspect_ratio}
                              </span>
                            )}
                            {brief.revision_allowance !== undefined && (
                              <span className="saved-spec-pill">
                                {brief.revision_allowance} {brief.revision_allowance === 1 ? 'Revision' : 'Revisions'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Card Footer: Budget & Action Button */}
                        <div className="saved-card-footer">
                          <div>
                            <span className="opp-budget-label">
                              Compensation
                            </span>
                            <span className="saved-budget-val">
                              {brief.budget_amount ? formatINR(clampDemoBudget(brief.budget_amount, 35000)) : 'Open'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (onSelectBrief && brief.id) onSelectBrief(brief);
                            }}
                            className="saved-view-btn"
                          >
                            <span>View Brief</span>
                            <span>→</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 10: SMART OPPORTUNITY DISCOVERY */}
          {activeTab === 'opportunities' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900">⚡ Smart Opportunity Discovery</h2>
                  <p className="text-xs text-neutral-500">
                    High-affinity campaign briefs matched deterministically to your portfolio and verified skills.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRefreshOpportunities}
                  disabled={isRefreshingOpps}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5"
                >
                  {isRefreshingOpps ? 'Evaluating...' : '↻ Refresh Matches'}
                </button>
              </div>

              {actionSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
                  ✓ {actionSuccessMsg}
                </div>
              )}

              {/* Preferences Strip */}
              {alertPreferences && (
                <div className="p-4 bg-white rounded-2xl border border-black/10 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={alertPreferences.is_enabled}
                        onChange={(e) => handleTogglePreference('is_enabled', e.target.checked)}
                        className="rounded text-purple-600"
                      />
                      <span className="font-semibold text-neutral-800">Enable Smart Alerts</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={alertPreferences.in_app_alerts_enabled}
                        onChange={(e) => handleTogglePreference('in_app_alerts_enabled', e.target.checked)}
                        className="rounded text-purple-600"
                      />
                      <span className="text-neutral-700">In-App Alerts</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={alertPreferences.email_alerts_enabled}
                        onChange={(e) => handleTogglePreference('email_alerts_enabled', e.target.checked)}
                        className="rounded text-purple-600"
                      />
                      <span className="text-neutral-700">Email Notifications</span>
                    </label>
                  </div>

                  <span className="text-[11px] text-neutral-500">
                    Deterministic Scoring Threshold: ≥60% fit
                  </span>
                </div>
              )}

              {/* Filter & Search Toolbar */}
              <div className="p-4 bg-white rounded-2xl border border-black/10 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
                <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Search matched briefs, brands, formats..."
                      value={oppSearchQuery}
                      onChange={(e) => setOppSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 bg-neutral-50 border border-black/10 rounded-xl text-xs focus:bg-white focus:border-purple-600 outline-none transition"
                    />
                    <span className="absolute left-3 top-2.5 text-neutral-400">🔍</span>
                    {oppSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setOppSearchQuery('')}
                        className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-700"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="w-full sm:w-60">
                    <select
                      value={oppDomainFilter}
                      onChange={(e) => setOppDomainFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-50 border border-black/10 rounded-xl text-xs focus:bg-white focus:border-purple-600 outline-none transition"
                    >
                      <option value="ALL">All Creative Domains</option>
                      {DOMAIN_FOLDERS.map((domain) => (
                        <option key={domain} value={domain}>
                          {DOMAIN_LABELS[domain] || domain}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <span className="text-neutral-500 font-semibold">
                    {filteredOpportunities.length} {filteredOpportunities.length === 1 ? 'Opportunity' : 'Opportunities'}
                  </span>
                  {(oppDomainFilter !== 'ALL' || oppSearchQuery) && (
                    <button
                      type="button"
                      onClick={() => {
                        setOppDomainFilter('ALL');
                        setOppSearchQuery('');
                      }}
                      className="px-2.5 py-1 text-xs text-purple-700 hover:text-purple-900 font-semibold underline"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              </div>

              {/* Matches List */}
              {opportunities.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-black/10">
                  <span className="text-3xl block mb-2">🔍</span>
                  <h3 className="text-sm font-bold text-neutral-800">No matching briefs found right now</h3>
                  <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
                    Try adjusting your portfolio specializations or click "Refresh Matches" as new commercial campaigns are posted.
                  </p>
                </div>
              ) : filteredOpportunities.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-black/10">
                  <span className="text-3xl block mb-2">⚡</span>
                  <h3 className="text-sm font-bold text-neutral-800">No opportunities match your filter</h3>
                  <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
                    No briefs found matching the selected domain or search query.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setOppDomainFilter('ALL');
                      setOppSearchQuery('');
                    }}
                    className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    Clear Filter
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredOpportunities.map((opp) => {
                    const briefDomain = opp.brief ? resolveBriefDomain(opp.brief) : null;
                    const domainLabel = briefDomain && DOMAIN_LABELS[briefDomain];

                    return (
                      <div
                        key={opp.id}
                        className="kivora-opportunity-card"
                      >
                        <div>
                          {/* Brand & Fit Row */}
                          <div className="opp-card-top-row">
                            <div className="opp-brand-info">
                              <span className="opp-brand-name">
                                {opp.brief?.brand?.company_name || 'Brand Campaign'}
                              </span>
                              {domainLabel && (
                                <span className="px-2 py-0.5 text-[10px] font-semibold bg-purple-50 text-purple-700 rounded-md border border-purple-100 shrink-0">
                                  {domainLabel}
                                </span>
                              )}
                            </div>
                            <span className="opp-match-pill shrink-0">
                              ★ {Math.round(opp.match_score)}% Fit
                            </span>
                          </div>

                          {/* Campaign Title & Objective */}
                          <h3
                            className="opp-title"
                            onClick={() => {
                              if (onSelectBrief && opp.brief) onSelectBrief(opp.brief);
                            }}
                          >
                            {opp.brief?.title}
                          </h3>
                          <p className="opp-desc">
                            {opp.brief?.campaign_objective || opp.brief?.deliverables_description}
                          </p>

                          {/* Match Reasons Chips */}
                          <div className="opp-reasons-container">
                            <div className="opp-reasons-header">
                              <span className="opp-reasons-label">
                                Why this matched
                              </span>
                              <button
                                type="button"
                                onClick={() => setExpandedOppId(expandedOppId === opp.id ? null : opp.id)}
                                className="opp-reasons-toggle"
                              >
                                {expandedOppId === opp.id ? 'Hide Details ▲' : 'Explain Match ▼'}
                              </button>
                            </div>
                            {(opp.match_reasons || []).slice(0, 2).map((reason, ri) => (
                              <div key={ri} className="opp-reason-item">
                                <span className="opp-reason-check">✓</span>
                                <span className="truncate">{reason}</span>
                              </div>
                            ))}

                            {/* Expandable Explanation Details */}
                            {expandedOppId === opp.id && (
                              <div className="mt-3 pt-3 border-t border-purple-100 space-y-2 text-xs">
                                <div className="font-semibold text-purple-900 text-[11px]">
                                  Detailed Compatibility Factors:
                                </div>
                                {(opp.match_reasons || []).map((reason, ri) => (
                                  <div key={ri} className="opp-reason-item">
                                    <span className="text-purple-600 font-bold shrink-0">✓</span>
                                    <span>{reason}</span>
                                  </div>
                                ))}
                                {opp.brief?.content_type && (
                                  <div className="text-[11px] text-neutral-500 pt-2 border-t border-purple-100 flex items-center justify-between">
                                    <span>Format: {opp.brief.content_type} ({opp.brief.aspect_ratio || '16:9'})</span>
                                    <span>Revisions: {opp.brief.revision_allowance || 2}</span>
                                  </div>
                                )}
                                <p className="text-[10px] text-neutral-400 italic pt-1">
                                  Match score determined from verified portfolio nodes, tools, and past deliverables.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Card Footer: Budget & Primary Action */}
                        <div className="opp-card-footer">
                          <div>
                            <span className="opp-budget-label">Compensation</span>
                            <span className="opp-budget-amount">
                              {formatINR(clampDemoBudget(opp.brief?.budget_amount, 35000))}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (onSelectBrief && opp.brief) onSelectBrief(opp.brief);
                            }}
                            className="opp-action-btn"
                          >
                            Review Opportunity →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 11: IN-APP MESSAGING */}
          {activeTab === 'messages' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-neutral-900">Direct Discussions</h2>
                <p className="text-xs text-neutral-500">
                  Private, relationship-scoped messaging with brands you collaborate with.
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

          {/* TAB: ANALYTICS */}
          {activeTab === 'analytics' && (
            <CreatorAnalyticsView
              profile={profile}
              applications={applications}
              engagements={engagements}
              opportunities={opportunities}
              onNavigate={(tab) => handleTabChange(tab)}
            />
          )}

          {/* TAB: SETTINGS */}
          {activeTab === 'settings' && (
            <PortalSettingsView
              currentUser={currentUser}
              profile={profile}
              onOpenEditProfile={() => setIsEditProfileOpen(true)}
              role="CREATOR"
            />
          )}
        </div>
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

      {selectedWorkspaceEngagementId && (
        <CollaborationWorkspaceModal
          engagementId={selectedWorkspaceEngagementId}
          currentUser={currentUser}
          userRole="CREATOR"
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
