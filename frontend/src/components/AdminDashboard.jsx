import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import AdminOverviewView from './admin/AdminOverviewView';
import AdminVerificationView from './admin/AdminVerificationView';
import AdminCreatorsView from './admin/AdminCreatorsView';
import AdminReportsView from './admin/AdminReportsView';
import AdminAuditLogView from './admin/AdminAuditLogView';
import AdminSettingsView from './admin/AdminSettingsView';

const PAGE_TITLES = {
  dashboard: {
    title: 'Admin Portal — Overview',
    subtitle: 'System health, KPIs, and platform verification activity overview',
  },
  requests: {
    title: 'Admin Portal — Verification Requests',
    subtitle: 'Audit creator generative pipelines, inspect ComfyUI graphs, and review claims',
  },
  creators: {
    title: 'Admin Portal — Creator Approval Queue',
    subtitle: 'Audit creator onboarding submissions, inspect portfolios, and review approval state',
  },
  reports: {
    title: 'Admin Portal — Reports & Analytics',
    subtitle: 'Verification approval rates, backlog distribution, and audit metrics',
  },
  'audit-log': {
    title: 'Admin Portal — Audit Log',
    subtitle: 'Historical record of administrative verification decisions',
  },
  settings: {
    title: 'Admin Portal — Platform Settings',
    subtitle: 'Runtime environment configuration and AI model parameters',
  },
};

export default function AdminDashboard({ currentUser, onLogout, initialTab }) {
  const [requests, setRequests] = useState(null); // null = unloaded/fetching, [] = genuine empty
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState(''); // '' (All) | 'PENDING' | 'APPROVED' | 'REJECTED'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReq, setSelectedReq] = useState(null);
  const [activeEvidenceTab, setActiveEvidenceTab] = useState('evidence'); // 'evidence' | 'details' | 'history'
  const [analyzingId, setAnalyzingId] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [selectedEvidencePreview, setSelectedEvidencePreview] = useState(null);

  // Initialize active navigation from URL search param, initialTab, or localStorage
  const [activeSidebarNav, setActiveSidebarNav] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['dashboard', 'requests', 'creators', 'reports', 'audit-log', 'settings'].includes(tabParam)) {
        return tabParam;
      }
      if (initialTab && ['dashboard', 'requests', 'creators', 'reports', 'audit-log', 'settings'].includes(initialTab)) {
        return initialTab;
      }
      const saved = localStorage.getItem('kivora_admin_tab');
      if (saved && ['dashboard', 'requests', 'creators', 'reports', 'audit-log', 'settings'].includes(saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'dashboard';
  });

  // Browser popstate support (Back/Forward navigation)
  useEffect(() => {
    const handlePopState = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('tab');
        if (tabParam && ['dashboard', 'requests', 'creators', 'reports', 'audit-log', 'settings'].includes(tabParam)) {
          setActiveSidebarNav(tabParam);
          setActionError(null);
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavChange = useCallback((tabId, opts = {}) => {
    setActiveSidebarNav(tabId);
    setActionError(null); // Clear transient action error on tab switch; keep loadError if data failed
    try {
      localStorage.setItem('kivora_admin_tab', tabId);
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tabId);
      if (opts.search) {
        url.searchParams.set('q', opts.search);
      }
      window.history.pushState({ adminTab: tabId }, '', url.toString());
    } catch {
      // ignore
    }
  }, []);

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await api.getAdminVerificationRequests();
      setRequests(data || []);
      if (data?.length > 0 && !selectedReq) {
        setSelectedReq(data[0]);
      } else if (selectedReq) {
        const updated = data.find((r) => r.id === selectedReq.id);
        if (updated) setSelectedReq(updated);
      }
    } catch (err) {
      setLoadError(err.message || 'Failed to load verification requests.');
      setRequests(null);
    } finally {
      setIsLoading(false);
    }
  }, [selectedReq]);

  const handleAdminQuickLogin = async () => {
    const isDev = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true';
    if (!isDev) {
      setLoadError('Demo quick login is only available in development environment.');
      return;
    }
    setIsLoading(true);
    setLoadError(null);
    try {
      // Direct authenticated login as the seed administrator
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@kivora.demo', password: 'Password123!' }),
      });
      if (!res.ok) {
        throw new Error('Failed to authenticate as admin@kivora.demo');
      }
      const data = await res.json();
      if (data.access_token) {
        localStorage.setItem('kivora_token', data.access_token);
        const user = data.user || {
          id: data.user_id,
          email: data.email,
          role: data.role,
        };
        localStorage.setItem('kivora_user', JSON.stringify(user));
      }
      setSuccessMsg('Successfully authenticated as Administrator (admin@kivora.demo).');
      setTimeout(() => setSuccessMsg(null), 4000);
      await loadRequests();
    } catch (err) {
      setLoadError(err.message || 'Administrator authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleRunAiAnalysis = async (verId) => {
    setAnalyzingId(verId);
    setActionError(null);
    try {
      const analysis = await api.analyzeVerificationAi(verId);
      setRequests((prev) =>
        (prev || []).map((r) => (r.id === verId ? { ...r, ai_analysis: analysis } : r))
      );
      if (selectedReq && selectedReq.id === verId) {
        setSelectedReq((prev) => ({ ...prev, ai_analysis: analysis }));
      }
      setSuccessMsg('Gemini AI Evidence Audit completed successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setActionError(err.message || 'Failed to execute AI analysis.');
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleReview = async (verId, newStatus) => {
    if (!reviewNotes.trim()) {
      setActionError('A decision rationale is required before approving or rejecting.');
      return;
    }
    setIsSubmittingReview(true);
    setActionError(null);
    try {
      const updated = await api.reviewVerificationRequest(verId, {
        status: newStatus,
        reviewer_notes: reviewNotes.trim(),
      });
      setRequests((prev) => (prev || []).map((r) => (r.id === verId ? updated : r)));
      setSelectedReq(updated);
      setReviewNotes('');
      setSuccessMsg(`Verification status updated to: ${newStatus}`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setActionError(err.message || 'Review action failed.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Filtered requests
  const filteredRequests = useMemo(() => {
    if (!requests) return [];
    return requests.filter((r) => {
      const matchesStatus = statusFilter ? r.status === statusFilter : true;
      const matchesSearch = searchQuery
        ? (r.creator_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (r.creator_handle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (r.verification_scope || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (r.evidence_title || '').toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      return matchesStatus && matchesSearch;
    });
  }, [requests, statusFilter, searchQuery]);

  // Statistics (derived when requests are loaded; null when unloaded)
  const totalCount = requests ? requests.length : 0;
  const pendingCount = requests ? requests.filter((r) => r.status === 'PENDING').length : 0;
  const approvedCount = requests ? requests.filter((r) => r.status === 'APPROVED').length : 0;
  const rejectedCount = requests ? requests.filter((r) => r.status === 'REJECTED').length : 0;
  const auditedCount = requests ? requests.filter((r) => Boolean(r.ai_analysis)).length : 0;

  const currentHeader = PAGE_TITLES[activeSidebarNav] || PAGE_TITLES.dashboard;

  return (
    <div
      className="admin-portal-wrapper"
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#F8F9FC',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        color: '#1E1B4B',
      }}
    >
      {/* 1. LEFT NAVIGATION SIDEBAR (Pale Lilac/Lavender Gradient matching reference) */}
      <aside
        className="admin-sidebar"
        style={{
          width: '260px',
          minWidth: '260px',
          background: 'linear-gradient(180deg, #F8F5FD 0%, #F1EAFA 50%, #ECE4F8 100%)',
          borderRight: '1px solid rgba(121, 82, 236, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.5rem 1.25rem',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 40,
        }}
      >
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2rem', paddingLeft: '0.5rem' }}>
          <span style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.03em', color: '#1E0B38' }}>
            Kivora<span style={{ color: '#7952EC' }}>.</span>
          </span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: '700',
              padding: '2px 6px',
              borderRadius: '999px',
              backgroundColor: '#EDE9FE',
              color: '#6D28D9',
              letterSpacing: '0.05em',
            }}
          >
            ADMIN
          </span>
        </div>

        {/* Navigation Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
          {/* Dashboard */}
          <button
            type="button"
            onClick={() => {
              handleNavChange('dashboard');
              setStatusFilter('');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '12px',
              fontSize: '13.5px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
              backgroundColor: activeSidebarNav === 'dashboard' ? '#DDD0F7' : 'transparent',
              color: activeSidebarNav === 'dashboard' ? '#4C1D95' : '#4A3B69',
            }}
          >
            <span style={{ fontSize: '16px' }}>⊞</span>
            <span>Dashboard</span>
          </button>

          {/* Verification Requests */}
          <button
            type="button"
            onClick={() => {
              handleNavChange('requests');
              setStatusFilter('PENDING');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: '12px',
              fontSize: '13.5px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
              backgroundColor: activeSidebarNav === 'requests' ? '#DDD0F7' : 'transparent',
              color: activeSidebarNav === 'requests' ? '#4C1D95' : '#4A3B69',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '16px' }}>🛡️</span>
              <span>Verification Requests</span>
            </div>
            {pendingCount > 0 && (
              <span
                style={{
                  backgroundColor: '#EDE9FE',
                  color: '#6D28D9',
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '999px',
                }}
              >
                {pendingCount}
              </span>
            )}
          </button>

          {/* Creators */}
          <button
            type="button"
            onClick={() => handleNavChange('creators')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '12px',
              fontSize: '13.5px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
              backgroundColor: activeSidebarNav === 'creators' ? '#DDD0F7' : 'transparent',
              color: activeSidebarNav === 'creators' ? '#4C1D95' : '#4A3B69',
            }}
          >
            <span style={{ fontSize: '16px' }}>👥</span>
            <span>Creator Approvals</span>
          </button>

          {/* Reports */}
          <button
            type="button"
            onClick={() => handleNavChange('reports')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '12px',
              fontSize: '13.5px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
              backgroundColor: activeSidebarNav === 'reports' ? '#DDD0F7' : 'transparent',
              color: activeSidebarNav === 'reports' ? '#4C1D95' : '#4A3B69',
            }}
          >
            <span style={{ fontSize: '16px' }}>📊</span>
            <span>Reports</span>
          </button>

          {/* Audit Log */}
          <button
            type="button"
            onClick={() => handleNavChange('audit-log')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '12px',
              fontSize: '13.5px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
              backgroundColor: activeSidebarNav === 'audit-log' ? '#DDD0F7' : 'transparent',
              color: activeSidebarNav === 'audit-log' ? '#4C1D95' : '#4A3B69',
            }}
          >
            <span style={{ fontSize: '16px' }}>📋</span>
            <span>Audit Log</span>
          </button>

          {/* Platform Settings */}
          <button
            type="button"
            onClick={() => handleNavChange('settings')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '12px',
              fontSize: '13.5px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
              backgroundColor: activeSidebarNav === 'settings' ? '#DDD0F7' : 'transparent',
              color: activeSidebarNav === 'settings' ? '#4C1D95' : '#4A3B69',
            }}
          >
            <span style={{ fontSize: '16px' }}>⚙️</span>
            <span>Platform Settings</span>
          </button>
        </nav>

        {/* Bottom Profile & Logout */}
        <div style={{ borderTop: '1px solid rgba(121, 82, 236, 0.12)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 8px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#7952EC',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '13px',
              }}
            >
              AD
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#1E0B38' }}>
                {currentUser?.email?.split('@')[0] || 'Admin'}
              </div>
              <div style={{ fontSize: '11px', color: '#6B7280' }}>Platform Administrator</div>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: '10px',
              border: '1px solid #FECACA',
              backgroundColor: '#FFFFFF',
              color: '#DC2626',
              fontSize: '12.5px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <span>⎋</span>
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowY: 'auto' }}>
        {/* Top Bar */}
        <header
          style={{
            height: '70px',
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 2rem',
            position: 'sticky',
            top: 0,
            zIndex: 30,
          }}
        >
          {/* Left Title with Shield Icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#EDE9FE',
                color: '#7952EC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
              }}
            >
              🛡️
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#1E0B38' }}>
                {currentHeader.title}
              </div>
              <div style={{ fontSize: '11.5px', color: '#6B7280' }}>
                {currentHeader.subtitle}
              </div>
            </div>
          </div>

          {/* Center Search Input */}
          <div style={{ flex: '0 1 420px', position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9CA3AF',
                fontSize: '14px',
              }}
            >
              🔍
            </span>
            <input
              type="text"
              placeholder="Search across admin records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '10px',
                border: '1px solid #E5E7EB',
                backgroundColor: '#F9FAFB',
                fontSize: '12.5px',
                outline: 'none',
                color: '#1F2937',
              }}
            />
          </div>

          {/* Right Notifications & Admin Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{ position: 'relative', cursor: 'pointer' }}
              onClick={() => handleNavChange('requests')}
              title={`${pendingCount} pending requests awaiting review`}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: '1px solid #E5E7EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                }}
              >
                🔔
              </div>
              {pendingCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    backgroundColor: '#7952EC',
                    color: '#FFFFFF',
                    fontSize: '10px',
                    fontWeight: '700',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {pendingCount}
                </span>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 10px 4px 6px',
                borderRadius: '999px',
                border: '1px solid #E5E7EB',
                backgroundColor: '#FFFFFF',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: '#7952EC',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: '700',
                }}
              >
                AD
              </div>
              <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#1F2937' }}>
                Admin ▾
              </span>
            </div>
          </div>
        </header>

        {/* Feedback Messages with Dismiss Buttons & Recovery Actions */}
        <div style={{ padding: '1rem 2rem 0' }}>
          {/* Action-level error banner */}
          {actionError && (
            <div
              style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FCA5A5',
                color: '#991B1B',
                fontSize: '12.5px',
                padding: '10px 16px',
                borderRadius: '10px',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>{actionError}</span>
              <button
                type="button"
                onClick={() => setActionError(null)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#991B1B',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  padding: '0 4px',
                }}
                title="Dismiss message"
              >
                ✕
              </button>
            </div>
          )}

          {/* Load error banner with recovery options */}
          {loadError && (
            <div
              style={{
                backgroundColor: '#FFFBEB',
                border: '1px solid #FCD34D',
                color: '#92400E',
                fontSize: '12.5px',
                padding: '12px 16px',
                borderRadius: '10px',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>⚠️</span>
                <span>
                  <strong>Data Loading Note:</strong> {loadError}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {(import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true') && (
                  <button
                    type="button"
                    onClick={handleAdminQuickLogin}
                    style={{
                      backgroundColor: '#7952EC',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                    title="Authenticate session using local admin@kivora.demo credentials (Development Only)"
                  >
                    Sign in as Admin
                  </button>
                )}
                <button
                  type="button"
                  onClick={loadRequests}
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#92400E',
                    border: '1px solid #FCD34D',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                backgroundColor: '#ECFDF5',
                border: '1px solid #A7F3D0',
                color: '#065F46',
                fontSize: '12.5px',
                padding: '10px 16px',
                borderRadius: '10px',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>{successMsg}</span>
              <button
                type="button"
                onClick={() => setSuccessMsg(null)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#065F46',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  padding: '0 4px',
                }}
                title="Dismiss message"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Page Content Based on activeSidebarNav */}
        <div style={{ padding: '1rem 2rem 2.5rem' }}>
          {/* 1. DASHBOARD OVERVIEW */}
          {activeSidebarNav === 'dashboard' && (
            <AdminOverviewView
              requests={requests}
              isLoading={isLoading}
              error={loadError}
              totalCount={totalCount}
              pendingCount={pendingCount}
              approvedCount={approvedCount}
              rejectedCount={rejectedCount}
              auditedCount={auditedCount}
              onNavigateToRequests={(status) => {
                if (status !== undefined) setStatusFilter(status);
                handleNavChange('requests');
              }}
              onSelectRequest={(req) => {
                setSelectedReq(req);
                handleNavChange('requests');
              }}
              onRetry={loadRequests}
              onAdminLogin={handleAdminQuickLogin}
            />
          )}

          {/* 2. VERIFICATION REQUESTS */}
          {activeSidebarNav === 'requests' && (
            <AdminVerificationView
              requests={requests}
              filteredRequests={filteredRequests}
              isLoading={isLoading}
              error={loadError}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedReq={selectedReq}
              setSelectedReq={setSelectedReq}
              activeEvidenceTab={activeEvidenceTab}
              setActiveEvidenceTab={setActiveEvidenceTab}
              analyzingId={analyzingId}
              onRunAiAnalysis={handleRunAiAnalysis}
              reviewNotes={reviewNotes}
              setReviewNotes={setReviewNotes}
              isSubmittingReview={isSubmittingReview}
              onSubmitReview={handleReview}
              selectedEvidencePreview={selectedEvidencePreview}
              setSelectedEvidencePreview={setSelectedEvidencePreview}
              totalCount={totalCount}
              pendingCount={pendingCount}
              approvedCount={approvedCount}
              rejectedCount={rejectedCount}
              onClearError={() => setActionError(null)}
              onRetry={loadRequests}
              onAdminLogin={handleAdminQuickLogin}
            />
          )}

          {/* 3. CREATOR DIRECTORY */}
          {activeSidebarNav === 'creators' && (
            <AdminCreatorsView
              onInspectCreatorVerifications={(creatorFilter) => {
                setSearchQuery(creatorFilter);
                handleNavChange('requests', { search: creatorFilter });
              }}
            />
          )}

          {/* 4. REPORTS */}
          {activeSidebarNav === 'reports' && (
            <AdminReportsView
              requests={requests}
              isLoading={isLoading}
              error={loadError}
              totalCount={totalCount}
              pendingCount={pendingCount}
              approvedCount={approvedCount}
              rejectedCount={rejectedCount}
              auditedCount={auditedCount}
              onRetry={loadRequests}
              onAdminLogin={handleAdminQuickLogin}
            />
          )}

          {/* 5. AUDIT LOG */}
          {activeSidebarNav === 'audit-log' && (
            <AdminAuditLogView
              requests={requests}
              isLoading={isLoading}
              error={loadError}
              onRetry={loadRequests}
              onAdminLogin={handleAdminQuickLogin}
            />
          )}

          {/* 6. PLATFORM SETTINGS */}
          {activeSidebarNav === 'settings' && (
            <AdminSettingsView />
          )}
        </div>
      </main>
    </div>
  );
}
