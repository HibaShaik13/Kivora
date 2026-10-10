import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Sparkle, ShieldCheck, UserCircle, Compass, FileText, SignOut, Warning } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';

export default function RootLayout() {
  const { user, isAuthenticated, isCreator, isBrand, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate('/', { replace: true });
  };

  const navLinks = [
    { label: 'Marketplace', path: '/creators', icon: Compass },
    { label: 'Campaign Briefs', path: '/briefs', icon: FileText },
  ];

  const dashboardPath = isCreator
    ? '/creator/dashboard'
    : isBrand
    ? '/brand/dashboard'
    : isAdmin
    ? '/admin/verification'
    : '/';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      {/* Pending Onboarding Banner if Authenticated without Profile */}
      {isAuthenticated && user?.has_profile === false && location.pathname !== '/onboarding' && (
        <div
          style={{
            background: 'var(--accent-coral-subtle)',
            borderBottom: '1px solid var(--accent-coral-border)',
            padding: '10px 16px',
            textAlign: 'center',
            fontSize: '0.875rem',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <Warning size={16} style={{ color: 'var(--accent-coral)' }} />
          <span>
            Your {user?.role} profile is not yet completed.{' '}
            <Link to="/onboarding" style={{ fontWeight: '700', color: 'var(--accent-coral)', textDecoration: 'underline' }}>
              Complete profile onboarding now &rarr;
            </Link>
          </span>
        </div>
      )}

      {/* Sticky Header */}
      <header className="app-header">
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Brand Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(230, 198, 135, 0.12)',
                border: '1px solid rgba(230, 198, 135, 0.28)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-gold)',
              }}
            >
              <Sparkle weight="fill" size={20} style={{ color: 'var(--accent-gold)' }} />
            </div>
            <span
              style={{
                fontFamily: 'var(--font-family-display)',
                fontSize: '1.25rem',
                fontWeight: '800',
                letterSpacing: '-0.03em',
                color: 'var(--text-primary)',
              }}
            >
              KIVORA
            </span>
            <span
              className="badge badge-verified"
              style={{ fontSize: '0.6875rem', padding: '2px 8px', marginLeft: '2px' }}
            >
              PRO
            </span>
          </Link>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname.startsWith(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.9375rem',
                    fontWeight: isActive ? '700' : '500',
                    color: isActive ? 'var(--accent-gold)' : 'var(--text-secondary)',
                    transition: 'color var(--transition-fast)',
                  }}
                >
                  <Icon size={16} weight={isActive ? 'bold' : 'regular'} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Auth Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Link
                  to={dashboardPath}
                  className="btn btn-outline"
                  style={{ padding: '8px 16px', fontSize: '0.875rem' }}
                >
                  <UserCircle size={18} />
                  <span>{user?.email?.split('@')[0]}</span>
                  <span
                    className={`badge ${
                      user?.role === 'ADMIN'
                        ? 'badge-coral'
                        : user?.role === 'BRAND'
                        ? 'badge-verified'
                        : 'badge-neutral'
                    }`}
                    style={{ fontSize: '0.625rem', padding: '1px 6px' }}
                  >
                    {user?.role}
                  </span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="btn btn-ghost"
                  style={{ padding: '8px 12px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  title="Sign out of account"
                >
                  <SignOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Link to="/login" className="btn btn-ghost" style={{ padding: '8px 18px', fontSize: '0.875rem' }}>
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-gold" style={{ padding: '8px 18px', fontSize: '0.875rem' }}>
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Page Area */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* Editorial Footer */}
      <footer className="app-footer">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--text-primary)' }}>Kivora</span>
            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>•</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
              Where bold ideas find their creators.
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
            <span>FastAPI Backend Connected</span>
            <span>JWT Bearer Security Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
