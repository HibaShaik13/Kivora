import React, { useState, useEffect } from 'react';

export default function Navbar({
  currentView,
  onNavigate,
  currentUser,
  onOpenAuth,
  onLogout,
  onOpenAiBuilder,
  onOpenAdminDesk,
}) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleGetStarted = () => {
    if (currentUser) {
      if (currentUser.role === 'ADMIN') onNavigate('admin');
      else onNavigate('dashboard');
      return;
    }

    if (currentView !== 'landing') {
      onNavigate('landing');
      setTimeout(() => {
        const el = document.getElementById('login-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        onOpenAuth();
      }, 150);
    } else {
      const el = document.getElementById('login-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      onOpenAuth();
    }
  };

  const handleScrollToSection = (sectionId) => {
    if (currentView !== 'landing') {
      onNavigate('landing');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const isCosmicLanding = currentView === 'landing';

  return (
    <header className={`navbar-wrapper ${isCosmicLanding ? 'navbar-cosmic' : 'navbar-light'} ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container navbar-inner">
        {/* Brand Logo */}
        <div 
          className="brand-logo" 
          onClick={() => onNavigate('landing')}
          style={{ cursor: 'pointer' }}
          role="button"
          tabIndex={0}
          aria-label="Kivora Home"
        >
          <span className="brand-name">Kivora<span className="brand-dot">.</span></span>
        </div>

        {/* Navigation Links */}
        <nav className="nav-links" aria-label="Main Navigation">
          <button
            type="button"
            className={`nav-item ${currentView === 'creators' ? 'active' : ''}`}
            onClick={() => onNavigate('creators')}
          >
            Discover Creators
          </button>

          <button
            type="button"
            className={`nav-item ${currentView === 'briefs' ? 'active' : ''}`}
            onClick={() => onNavigate('briefs')}
          >
            Explore Briefs
          </button>

          <button
            type="button"
            className="nav-item"
            onClick={() => handleScrollToSection('how-it-works')}
          >
            How It Works
          </button>

          <button
            type="button"
            className="nav-item"
            onClick={() => handleScrollToSection('about')}
          >
            About
          </button>

          {currentUser && (
            <button
              type="button"
              className={`nav-item nav-item-studio ${currentView === 'dashboard' || currentView === 'admin' ? 'active' : ''}`}
              onClick={() => {
                if (currentUser.role === 'ADMIN') {
                  onNavigate('admin');
                } else {
                  onNavigate('dashboard');
                }
              }}
            >
              {currentUser.role === 'CREATOR'
                ? '🎨 Creator Studio'
                : currentUser.role === 'BRAND'
                ? '🏢 Brand Portal'
                : '🛡 Admin Desk'}
            </button>
          )}
        </nav>

        {/* Right Actions */}
        <div className="nav-actions">
          {currentUser ? (
            <div className="user-menu-group">
              <button
                type="button"
                className="user-badge-pill"
                onClick={() => {
                  if (currentUser.role === 'ADMIN') onNavigate('admin');
                  else onNavigate('dashboard');
                }}
                title={`Logged in as ${currentUser.role}. Click to open workspace`}
              >
                <span className="user-role-emoji">
                  {currentUser.role === 'CREATOR' ? '🎨' : currentUser.role === 'BRAND' ? '🏢' : '🛡️'}
                </span>
                <span className="user-email-name">
                  {currentUser.full_name || currentUser.email.split('@')[0]}
                </span>
              </button>

              <button
                type="button"
                className="btn-navbar-logout"
                onClick={onLogout}
                aria-label="Log out"
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className="logged-out-actions-row">
              <button
                type="button"
                className="btn-navbar-login"
                onClick={onOpenAuth}
                aria-label="Sign In"
              >
                Login
              </button>

              <button
                type="button"
                className="btn-navbar-get-started"
                onClick={handleGetStarted}
                aria-label="Get Started"
              >
                Get Started <span className="arrow-inline">→</span>
              </button>

              <button
                type="button"
                className="cosmic-profile-icon-btn"
                onClick={onOpenAuth}
                title="Account / Sign In"
                aria-label="Account Login"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="profile-svg-icon"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
