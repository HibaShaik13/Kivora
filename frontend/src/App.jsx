import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import LandingLoginSection from './components/LandingLoginSection';
import PortfolioSpotlight from './components/PortfolioSpotlight';
import HowItWorksSection from './components/HowItWorksSection';
import CreativeUniverseSection from './components/CreativeUniverseSection';
import CreatorDiscovery from './components/CreatorDiscovery';
import BriefsExplorer from './components/BriefsExplorer';
import PortfolioModal from './components/PortfolioModal';
import CreatorProfileModal from './components/CreatorProfileModal';
import BriefDetailModal from './components/BriefDetailModal';
import AiBriefBuilderModal from './components/AiBriefBuilderModal';
import AdminVerificationModal from './components/AdminVerificationModal';
import AuthModal from './components/AuthModal';
import CreatorDashboard from './components/CreatorDashboard';
import BrandDashboard from './components/BrandDashboard';
import AdminDashboard from './components/AdminDashboard';
import MessagesInbox from './components/MessagesInbox';
import InviteCreatorModal from './components/InviteCreatorModal';
import ErrorBoundary from './components/ErrorBoundary';
import { authService, getCurrentUser, addAuthListener } from './services/authService';
import { api } from './services/api';
import './App.css';


export default function App() {
  const [currentView, setCurrentView] = useState(() => {
    try {
      const user = getCurrentUser();
      const pathname = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      const isMessagesRoute =
        pathname === '/messages' ||
        pathname === '/inbox' ||
        pathname === '/chat' ||
        params.has('conversationId') ||
        params.has('conv') ||
        params.has('c') ||
        params.has('creatorId') ||
        params.has('briefId');

      if (isMessagesRoute) {
        return user ? 'dashboard' : 'inbox';
      }

      const saved = localStorage.getItem('kivora_current_view');
      if (saved && ['landing', 'creators', 'briefs', 'dashboard', 'admin', 'inbox'].includes(saved)) {
        if ((saved === 'dashboard' || saved === 'admin' || saved === 'inbox') && !user) {
          return 'landing';
        }
        return saved;
      }
      return user ? 'dashboard' : 'landing';
    } catch {
      return 'landing';
    }
  });
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [activeConversationId, setActiveConversationId] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('conversationId') || params.get('conv') || params.get('c') || null;
    } catch {
      return null;
    }
  });
  const [chatContext, setChatContext] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const conv = params.get('conversationId') || params.get('conv') || params.get('c') || null;
      const creator = params.get('creatorId') || params.get('creator_id') || null;
      const brand = params.get('brandId') || params.get('brand_id') || null;
      const brief = params.get('briefId') || params.get('brief_id') || null;
      if (conv || creator || brand || brief) {
        return { conversationId: conv, creatorId: creator, brandId: brand, briefId: brief, timestamp: Date.now() };
      }
      return null;
    } catch {
      return null;
    }
  });
  const [dashboardTab, setDashboardTab] = useState(() => {
    try {
      const pathname = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      if (
        pathname === '/messages' ||
        pathname === '/inbox' ||
        params.get('tab') === 'messages' ||
        params.has('conversationId') ||
        params.has('conv') ||
        params.has('c') ||
        params.has('creatorId') ||
        params.has('briefId') ||
        params.has('brandId')
      ) {
        return 'messages';
      }
      return params.get('tab') || null;
    } catch {
      return null;
    }
  });

  const handleNavigate = (view) => {
    setCurrentView(view);
    try {
      localStorage.setItem('kivora_current_view', view);
    } catch {
      // ignore
    }
  };

  const handleOpenChat = (chatTarget) => {
    let conversationId = null;
    let creatorId = null;
    let brandId = null;
    let briefId = null;
    let targetName = null;

    if (typeof chatTarget === 'string') {
      conversationId = chatTarget;
    } else if (chatTarget && typeof chatTarget === 'object') {
      conversationId = chatTarget.conversationId || chatTarget.id || null;
      creatorId = chatTarget.creatorId || null;
      brandId = chatTarget.brandId || null;
      briefId = chatTarget.briefId || null;
      targetName = chatTarget.targetName || chatTarget.creatorName || chatTarget.brandName || null;
    }

    setSelectedCreator(null);
    setSelectedBrief(null);
    setSelectedProject(null);
    setReturnToBrief(null);

    const newContext = {
      conversationId,
      creatorId,
      brandId,
      briefId,
      targetName,
      timestamp: Date.now(),
    };

    setActiveConversationId(conversationId);
    setChatContext(newContext);
    setDashboardTab('messages');

    try {
      const url = new URL(window.location.href);
      if (conversationId) {
        url.searchParams.set('conversationId', conversationId);
        url.searchParams.set('conv', conversationId);
      } else {
        url.searchParams.delete('conversationId');
        url.searchParams.delete('conv');
      }
      if (creatorId) {
        url.searchParams.set('creatorId', creatorId);
      } else {
        url.searchParams.delete('creatorId');
      }
      if (brandId) {
        url.searchParams.set('brandId', brandId);
      } else {
        url.searchParams.delete('brandId');
      }
      if (briefId) {
        url.searchParams.set('briefId', briefId);
      } else {
        url.searchParams.delete('briefId');
      }
      url.searchParams.set('tab', 'messages');
      window.history.pushState({}, '', url.toString());
    } catch {
      // ignore
    }

    if (currentUser) {
      handleNavigate('dashboard');
    } else {
      handleNavigate('inbox');
    }
  };

  // Modal states
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [selectedBrief, setSelectedBrief] = useState(null);
  const [returnToBrief, setReturnToBrief] = useState(null);
  const [invitingCreator, setInvitingCreator] = useState(null);
  const [isAiBuilderOpen, setIsAiBuilderOpen] = useState(false);
  const [isAdminDeskOpen, setIsAdminDeskOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Sync auth state & path routing
  useEffect(() => {
    const unsubscribe = addAuthListener((user) => {
      setCurrentUser(user);
    });
    if (window.location.pathname === '/login' || window.location.hash === '#login') {
      setIsAuthModalOpen(true);
    }

    const handlePopState = () => {
      try {
        const pathname = window.location.pathname;
        const params = new URLSearchParams(window.location.search);
        const conv = params.get('conversationId') || params.get('conv') || params.get('c') || null;
        const creator = params.get('creatorId') || params.get('creator_id') || null;
        const brand = params.get('brandId') || params.get('brand_id') || null;
        const brief = params.get('briefId') || params.get('brief_id') || null;
        const tab = params.get('tab') || (conv || creator || brand || brief || pathname === '/messages' || pathname === '/inbox' ? 'messages' : null);
        if (conv) {
          setActiveConversationId(conv);
        }
        if (conv || creator || brand || brief) {
          setChatContext({ conversationId: conv, creatorId: creator, brandId: brand, briefId: brief, timestamp: Date.now() });
        }
        if (tab) {
          setDashboardTab(tab);
        }
        if (pathname === '/messages' || pathname === '/inbox' || conv || creator || brand || brief) {
          const user = getCurrentUser();
          setCurrentView(user ? 'dashboard' : 'inbox');
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      unsubscribe();
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleSelectCreator = async (creator) => {
    setSelectedCreator(creator);
    try {
      const fullProfile = await api.getCreator(creator.id || creator.handle);
      setSelectedCreator(fullProfile);
    } catch {
      // Keep initial creator object
    }
  };

  const handleBriefCreated = (newBrief) => {
    setIsAiBuilderOpen(false);
    if (currentUser?.role === 'BRAND') {
      handleNavigate('dashboard');
    } else {
      handleNavigate('briefs');
    }
    setSelectedBrief(newBrief);
  };

  const handleAuthSuccess = (userData) => {
    const user = userData.user || userData;
    setCurrentUser(user);
    setIsAuthModalOpen(false);
    if (user.role === 'ADMIN') {
      handleNavigate('admin');
    } else {
      handleNavigate('dashboard');
    }
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    try {
      localStorage.removeItem('kivora_current_view');
      localStorage.removeItem('kivora_creator_tab');
    } catch {
      // ignore
    }
    handleNavigate('landing');
  };

  return (
    <div className="app-wrapper font-sans">
      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenAiBuilder={() => setIsAiBuilderOpen(true)}
        onOpenAdminDesk={() => {
          if (currentUser?.role === 'ADMIN') {
            handleNavigate('admin');
          } else {
            setIsAdminDeskOpen(true);
          }
        }}
      />

      {/* Main Content Area */}
      <main className="main-content">
        <ErrorBoundary>
        {/* VIEW 1: PUBLIC LANDING PAGE */}
        {currentView === 'landing' && (
          <div className="landing-page-flow">
            {/* Hero Section with Cosmic Artwork & Interactive Constellation */}
            <HeroSection
              onExploreCreators={() => handleNavigate('creators')}
              onExploreBriefs={() => handleNavigate('briefs')}
              onGetStarted={() => {
                const el = document.getElementById('login-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                setIsAuthModalOpen(true);
              }}
              onOpenAiBuilder={() => setIsAiBuilderOpen(true)}
            />

            {/* Dedicated Login Section with Rotating Creative Quotations */}
            <LandingLoginSection
              currentUser={currentUser}
              onOpenAuth={() => setIsAuthModalOpen(true)}
              onAuthSuccess={handleAuthSuccess}
              onNavigateToDashboard={() => {
                if (currentUser?.role === 'ADMIN') {
                  handleNavigate('admin');
                } else {
                  handleNavigate('dashboard');
                }
              }}
              onLogout={handleLogout}
            />

            {/* Curated 6 Portfolios Showcase with Video Previews */}
            <PortfolioSpotlight
              onSelectProject={(project) => setSelectedProject(project)}
            />

            {/* How Kivora Works (4 Glass Step Cards) */}
            <HowItWorksSection
              onExplore={() => handleNavigate('creators')}
              onPostBrief={() => setIsAiBuilderOpen(true)}
            />

            {/* Featured Creators Discovery */}
            <section className="container" style={{ padding: '4rem 2rem' }}>
              <CreatorDiscovery
                onSelectCreator={handleSelectCreator}
                onSelectProject={(project) => setSelectedProject(project)}
                onOpenChat={handleOpenChat}
              />
            </section>

            {/* Creative Universe Section */}
            <CreativeUniverseSection
              onNavigateCreators={() => handleNavigate('creators')}
              onNavigateBriefs={() => handleNavigate('briefs')}
              onOpenAuth={() => setIsAuthModalOpen(true)}
            />
          </div>
        )}

        {/* VIEW 2: CREATOR DISCOVERY EXPLORER */}
        {currentView === 'creators' && (
          <div
            style={{
              backgroundImage: 'linear-gradient(rgba(250, 247, 242, 0.95), rgba(250, 247, 242, 0.95)), url(/assets/backgrounds/creator-profile.jpg)',
              backgroundSize: 'cover',
              backgroundAttachment: 'fixed',
              minHeight: 'calc(100vh - 72px)',
              padding: '2rem 0',
            }}
          >
            <div className="container py-4">
              <CreatorDiscovery
                onSelectCreator={handleSelectCreator}
                onSelectProject={(project) => setSelectedProject(project)}
                onInviteCreator={(creator) => setInvitingCreator(creator)}
                onOpenChat={handleOpenChat}
              />
            </div>
          </div>
        )}


        {/* VIEW 3: CAMPAIGN BRIEFS EXPLORER */}
        {currentView === 'briefs' && (
          <div
            style={{
              backgroundImage: 'linear-gradient(rgba(250, 247, 242, 0.95), rgba(250, 247, 242, 0.95)), url(/assets/backgrounds/briefs-explorer.jpg)',
              backgroundSize: 'cover',
              backgroundAttachment: 'fixed',
              minHeight: 'calc(100vh - 72px)',
              padding: '2rem 0',
            }}
          >
            <div className="container py-4">
              <BriefsExplorer
                onSelectBrief={(brief) => setSelectedBrief(brief)}
                onOpenAiBuilder={() => setIsAiBuilderOpen(true)}
              />
            </div>
          </div>
        )}

        {/* VIEW 4: ROLE-BASED DASHBOARDS */}
        {currentView === 'dashboard' && (
          <>
            {!currentUser ? (
              <div className="container py-16 text-center">
                <p className="text-sm text-neutral-500 mb-4">Please log in to access your portal.</p>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setIsAuthModalOpen(true)}
                >
                  Sign In to Kivora
                </button>
              </div>
            ) : currentUser.role === 'CREATOR' ? (
              <CreatorDashboard
                currentUser={currentUser}
                onSelectProject={(proj) => setSelectedProject(proj)}
                onSelectBrief={(b) => setSelectedBrief(b)}
                onLogout={handleLogout}
                initialTab={dashboardTab}
                initialConversationId={activeConversationId}
                chatContext={chatContext}
                onClearChatContext={() => setChatContext(null)}
                onOpenChat={handleOpenChat}
              />
            ) : currentUser.role === 'BRAND' ? (
              <BrandDashboard
                currentUser={currentUser}
                onOpenAiBuilder={() => setIsAiBuilderOpen(true)}
                onSelectCreator={handleSelectCreator}
                onSelectProject={(proj) => setSelectedProject(proj)}
                onSelectBrief={(b) => setSelectedBrief(b)}
                onLogout={handleLogout}
                initialTab={dashboardTab}
                initialConversationId={activeConversationId}
                chatContext={chatContext}
                onClearChatContext={() => setChatContext(null)}
                onOpenChat={handleOpenChat}
              />
            ) : (
              <AdminDashboard currentUser={currentUser} onLogout={handleLogout} />
            )}
          </>
        )}

        {/* VIEW 5: ADMIN DASHBOARD */}
        {currentView === 'admin' && (
          <AdminDashboard currentUser={currentUser} onLogout={handleLogout} />
        )}

        {/* VIEW 6: DIRECT INBOX / MESSAGING */}
        {currentView === 'inbox' && (
          <div className="container py-6" style={{ minHeight: 'calc(100vh - 120px)' }}>
            {!currentUser ? (
              <div className="container py-16 text-center">
                <p className="text-sm text-neutral-500 mb-4">Please log in to view your messages.</p>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setIsAuthModalOpen(true)}
                >
                  Sign In to Kivora
                </button>
              </div>
            ) : (
              <MessagesInbox
                currentUser={currentUser}
                initialConversationId={activeConversationId}
                chatContext={chatContext}
                onClearChatContext={() => setChatContext(null)}
              />
            )}
          </div>
        )}
        </ErrorBoundary>
      </main>


      {/* Global Modals */}
      {selectedProject && (
        <PortfolioModal
          project={selectedProject}
          isOpen={Boolean(selectedProject)}
          onClose={() => setSelectedProject(null)}
          onSelectCreator={(creator) => {
            setSelectedProject(null);
            handleSelectCreator(creator);
          }}
        />
      )}

      {selectedCreator && (
        <CreatorProfileModal
          creator={selectedCreator}
          brief={returnToBrief}
          currentUser={currentUser}
          isOpen={Boolean(selectedCreator)}
          onClose={() => {
            setSelectedCreator(null);
            if (returnToBrief) {
              setSelectedBrief(returnToBrief);
              setReturnToBrief(null);
            }
          }}
          onSelectProject={(proj) => setSelectedProject(proj)}
          onPostBrief={() => setIsAiBuilderOpen(true)}
          onInviteCreator={(c) => {
            setSelectedCreator(null);
            setInvitingCreator(c);
          }}
          onOpenChat={handleOpenChat}
        />
      )}

      {/* Brand Creator Invite Modal */}
      {invitingCreator && (
        <InviteCreatorModal
          creator={invitingCreator}
          isOpen={Boolean(invitingCreator)}
          onClose={() => setInvitingCreator(null)}
        />
      )}


      {selectedBrief && (
        <BriefDetailModal
          brief={selectedBrief}
          currentUser={currentUser}
          isOpen={Boolean(selectedBrief)}
          onClose={() => {
            setSelectedBrief(null);
            setReturnToBrief(null);
          }}
          onSelectCreator={(creator) => {
            setReturnToBrief(selectedBrief);
            setSelectedBrief(null);
            handleSelectCreator(creator);
          }}
          onOpenChat={handleOpenChat}
        />
      )}

      {isAiBuilderOpen && (
        <AiBriefBuilderModal
          isOpen={isAiBuilderOpen}
          onClose={() => setIsAiBuilderOpen(false)}
          onBriefCreated={handleBriefCreated}
        />
      )}

      {isAdminDeskOpen && (
        <AdminVerificationModal
          isOpen={isAdminDeskOpen}
          onClose={() => setIsAdminDeskOpen(false)}
        />
      )}

      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      )}

      {/* Editorial Luxury Footer */}
      <footer className="footer-kivora-editorial">
        <div className="container footer-inner">
          <div>
            <div className="footer-brand">
              Kivora<span className="serif-italic-accent">.</span>
            </div>
            <p className="footer-sub">
              A creative marketplace connecting premier brands with verified AI creators.
            </p>
          </div>

          <div className="footer-meta">
            <div>
              <span className="footer-status-dot" />
              API Online • FastAPI & SQLite Connected
            </div>
            <span>•</span>
            <button
              type="button"
              className="link-arrow-btn"
              onClick={() => {
                if (currentUser?.role === 'ADMIN') {
                  handleNavigate('admin');
                } else {
                  setIsAdminDeskOpen(true);
                }
              }}
            >
              Admin Audit Desk
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
