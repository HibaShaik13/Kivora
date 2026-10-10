import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
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
import { authService, getCurrentUser, addAuthListener } from './services/authService';
import { api } from './services/api';
import './App.css';

export default function App() {
  const [currentView, setCurrentView] = useState('landing'); // 'landing' | 'creators' | 'briefs' | 'dashboard' | 'admin'
  const [currentUser, setCurrentUser] = useState(getCurrentUser());

  // Modal states
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [selectedBrief, setSelectedBrief] = useState(null);
  const [isAiBuilderOpen, setIsAiBuilderOpen] = useState(false);
  const [isAdminDeskOpen, setIsAdminDeskOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Sync auth state
  useEffect(() => {
    const unsubscribe = addAuthListener((user) => {
      setCurrentUser(user);
    });
    return unsubscribe;
  }, []);

  const handleSelectCreator = async (creator) => {
    try {
      const fullProfile = await api.getCreator(creator.id || creator.handle);
      setSelectedCreator(fullProfile);
    } catch {
      setSelectedCreator(creator);
    }
  };

  const handleBriefCreated = (newBrief) => {
    setIsAiBuilderOpen(false);
    if (currentUser?.role === 'BRAND') {
      setCurrentView('dashboard');
    } else {
      setCurrentView('briefs');
    }
    setSelectedBrief(newBrief);
  };

  const handleAuthSuccess = (userData) => {
    const user = userData.user || userData;
    setCurrentUser(user);
    setIsAuthModalOpen(false);
    if (user.role === 'ADMIN') {
      setCurrentView('admin');
    } else {
      setCurrentView('dashboard');
    }
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setCurrentView('landing');
  };

  return (
    <div className="app-wrapper font-sans">
      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={setCurrentView}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenAiBuilder={() => setIsAiBuilderOpen(true)}
        onOpenAdminDesk={() => {
          if (currentUser?.role === 'ADMIN') {
            setCurrentView('admin');
          } else {
            setIsAdminDeskOpen(true);
          }
        }}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {/* VIEW 1: PUBLIC LANDING PAGE */}
        {currentView === 'landing' && (
          <div className="landing-page-flow">
            {/* Hero Section with 3D Animated Showcase */}
            <HeroSection
              onExploreCreators={() => setCurrentView('creators')}
              onOpenAiBuilder={() => setIsAiBuilderOpen(true)}
            />

            {/* Curated 6 Portfolios Showcase with Video Previews */}
            <PortfolioSpotlight
              onSelectProject={(project) => setSelectedProject(project)}
            />

            {/* How Kivora Works (4 Glass Step Cards) */}
            <HowItWorksSection
              onExplore={() => setCurrentView('creators')}
              onPostBrief={() => setIsAiBuilderOpen(true)}
            />

            {/* Featured Creators Discovery */}
            <section className="container" style={{ padding: '4rem 2rem' }}>
              <CreatorDiscovery
                onSelectCreator={handleSelectCreator}
                onSelectProject={(project) => setSelectedProject(project)}
              />
            </section>

            {/* Creative Universe Section */}
            <CreativeUniverseSection
              onNavigateCreators={() => setCurrentView('creators')}
              onNavigateBriefs={() => setCurrentView('briefs')}
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
              />
            ) : currentUser.role === 'BRAND' ? (
              <BrandDashboard
                currentUser={currentUser}
                onOpenAiBuilder={() => setIsAiBuilderOpen(true)}
                onSelectCreator={handleSelectCreator}
                onSelectProject={(proj) => setSelectedProject(proj)}
                onSelectBrief={(b) => setSelectedBrief(b)}
                onLogout={handleLogout}
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
          isOpen={Boolean(selectedCreator)}
          onClose={() => setSelectedCreator(null)}
          onSelectProject={(proj) => setSelectedProject(proj)}
          onPostBrief={() => setIsAiBuilderOpen(true)}
        />
      )}

      {selectedBrief && (
        <BriefDetailModal
          brief={selectedBrief}
          currentUser={currentUser}
          isOpen={Boolean(selectedBrief)}
          onClose={() => setSelectedBrief(null)}
          onSelectCreator={(creator) => {
            setSelectedBrief(null);
            handleSelectCreator(creator);
          }}
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
                  setCurrentView('admin');
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
