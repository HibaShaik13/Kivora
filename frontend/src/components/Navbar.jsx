import React from 'react';

export default function Navbar({
  currentView,
  onNavigate,
  currentUser,
  onOpenAuth,
  onLogout,
  onOpenAiBuilder,
  onOpenAdminDesk,
}) {
  return (
    <header className="navbar-wrapper">
      <div className="container navbar-inner">
        {/* Brand Logo */}
        <div 
          className="brand-logo" 
          onClick={() => onNavigate('landing')}
          style={{ cursor: 'pointer' }}
        >
          <span className="brand-name">Kivora<span className="brand-dot">.</span></span>
        </div>

        {/* Navigation Links */}
        <nav className="nav-links">
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

          {currentUser && (
            <button
              type="button"
              className={`nav-item ${currentView === 'dashboard' ? 'active font-bold text-purple-700' : ''}`}
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

          <a
            href="#how-it-works"
            className="nav-item"
            onClick={(e) => {
              if (currentView !== 'landing') {
                e.preventDefault();
                onNavigate('landing');
                setTimeout(() => {
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }
            }}
          >
            How It Works
          </a>
        </nav>

        {/* Right Actions */}
        <div className="nav-actions">
          {currentUser ? (
            <div className="user-menu-group flex items-center gap-3">
              <button
                type="button"
                className="user-badge-pill cursor-pointer"
                onClick={() => {
                  if (currentUser.role === 'ADMIN') onNavigate('admin');
                  else onNavigate('dashboard');
                }}
              >
                {currentUser.role === 'CREATOR' ? '🎨' : currentUser.role === 'BRAND' ? '🏢' : '🛡️'} {currentUser.email.split('@')[0]}
              </button>

              <button
                type="button"
                className="btn btn-sm btn-ghost text-red-600 hover:bg-red-50"
                onClick={onLogout}
              >
                Log Out
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-ghost btn-login"
                onClick={onOpenAuth}
              >
                Login
              </button>
              <button
                type="button"
                className="btn btn-dark btn-get-started"
                onClick={() => onOpenAuth()}
              >
                Get Started <span className="arrow-inline">→</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
