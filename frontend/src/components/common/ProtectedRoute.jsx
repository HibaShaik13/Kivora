import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { ShieldWarning, ArrowLeft } from '@phosphor-icons/react';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, token, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center' }}>
        <div className="container-narrow">
          <div className="card-editorial" style={{ padding: '48px 24px', animation: 'pulse 1.5s infinite ease-in-out' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Verifying authorization session...</p>
          </div>
        </div>
      </div>
    );
  }

  // 1. If not authenticated, redirect to login with return destination
  if (!isAuthenticated || !token) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  // 2. Check role authorization if roles are restricted
  if (allowedRoles.length > 0 && (!user || !allowedRoles.includes(user.role))) {
    return (
      <div style={{ padding: '80px 0 100px', textAlign: 'center' }}>
        <div className="container-narrow">
          <div className="card-editorial" style={{ padding: '48px 32px' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'var(--status-error-bg)',
                color: 'var(--status-error)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <ShieldWarning size={32} weight="duotone" />
            </div>

            <span className="badge badge-coral" style={{ marginBottom: '12px' }}>
              403 Forbidden
            </span>

            <h1 style={{ fontSize: '1.75rem', marginBottom: '10px' }}>Access Restricted</h1>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '48ch', margin: '0 auto 24px', fontSize: '0.9375rem' }}>
              Your current account role (<strong>{user?.role}</strong>) does not have permission to access this area. Requires:{' '}
              <code>{allowedRoles.join(', ')}</code>.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <Link
                to={user?.role === 'CREATOR' ? '/creator/dashboard' : user?.role === 'BRAND' ? '/brand/dashboard' : '/'}
                className="btn btn-primary"
              >
                <ArrowLeft size={16} />
                <span>Return to My Workspace</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
