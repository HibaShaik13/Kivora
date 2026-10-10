import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle,
  Clock,
  Database,
  Lightning,
  Sparkle,
  ArrowRight,
  ShieldCheck,
  Palette,
  Graph,
  Code,
} from '@phosphor-icons/react';
import { taxonomyApi } from '../api/taxonomy';
import api from '../api/client';

export default function StatusFoundationPage() {
  const [backendHealth, setBackendHealth] = useState({ status: 'checking', details: null });
  const [skills, setSkills] = useState([]);
  const [tools, setTools] = useState([]);
  const [loadingTaxonomy, setLoadingTaxonomy] = useState(true);

  useEffect(() => {
    // 1. Check Backend Health
    api
      .get('/api/health')
      .then((data) => setBackendHealth({ status: 'connected', details: data }))
      .catch((err) => setBackendHealth({ status: 'error', details: err.message }));

    // 2. Load Taxonomy Catalog
    Promise.all([taxonomyApi.getSkills(), taxonomyApi.getTools()])
      .then(([skillsData, toolsData]) => {
        setSkills(skillsData || []);
        setTools(toolsData || []);
      })
      .catch((err) => console.error('Failed to load taxonomy:', err))
      .finally(() => setLoadingTaxonomy(false));
  }, []);

  const routeDirectory = [
    { path: '/', label: 'Foundation & Status Hub', status: 'Phase 1 Active' },
    { path: '/login', label: 'Sign In (Creator / Brand / Admin)', status: 'Configured' },
    { path: '/register', label: 'Register & Role Selection', status: 'Configured' },
    { path: '/verify-otp', label: 'OTP Email Verification', status: 'Configured' },
    { path: '/onboarding', label: 'First-time Profile Onboarding', status: 'Configured' },
    { path: '/creators', label: 'Creator Discovery Marketplace', status: 'Configured' },
    { path: '/creators/elena_creative', label: 'Creator Profile Deep-Dive', status: 'Configured' },
    { path: '/briefs', label: 'Campaign Briefs Directory', status: 'Configured' },
    { path: '/briefs/lumina-botanicals-serum-reveal', label: 'Brief Detail & Creator Pitch', status: 'Configured' },
    { path: '/briefs/create', label: 'AI Brief Builder & Authoring', status: 'Configured' },
    { path: '/creator/dashboard', label: 'Creator Dashboard & Milestones', status: 'Configured' },
    { path: '/brand/dashboard', label: 'Brand Dashboard & Applications', status: 'Configured' },
    { path: '/admin/verification', label: 'Admin Evidence Audit Hub', status: 'Configured' },
    { path: '/non-existent-test-404', label: '404 Not Found Handling', status: 'Configured' },
  ];

  return (
    <div style={{ padding: '48px 0 80px' }}>
      <div className="container">
        {/* Header Hero Banner */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span className="badge badge-verified">
              <Sparkle weight="fill" size={14} />
              Phase 1 Completed
            </span>
            <span className="badge badge-neutral">Architecture & Design Foundation</span>
          </div>
          <h1 style={{ marginBottom: '16px', maxWidth: '24ch' }}>
            Kivora Frontend Architecture Initialized.
          </h1>
          <p style={{ fontSize: '1.125rem' }}>
            React 18 + Vite foundation established with an editorial warm luxury design system, centralized HTTP API service layer, and configured route hierarchy ready for Phase 2+.
          </p>
        </div>

        {/* 3-Column Diagnostic Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '48px' }}>
          {/* Diagnostic 1: Backend Connection */}
          <div className="card-editorial">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Database size={24} style={{ color: 'var(--accent-lavender)' }} />
                <h3 style={{ fontSize: '1.125rem' }}>Backend Connectivity</h3>
              </div>
              <span
                className={`badge ${
                  backendHealth.status === 'connected'
                    ? 'badge-success'
                    : backendHealth.status === 'checking'
                    ? 'badge-neutral'
                    : 'badge-coral'
                }`}
              >
                {backendHealth.status === 'connected' ? 'ONLINE (8000)' : backendHealth.status.toUpperCase()}
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', marginBottom: '16px' }}>
              API client configured to <code>{api.API_BASE_URL}</code> with Bearer token injection and multipart upload support.
            </p>
            <div
              style={{
                background: 'var(--bg-secondary)',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-family-mono)',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
              }}
            >
              {backendHealth.details ? JSON.stringify(backendHealth.details) : 'Checking /api/health...'}
            </div>
          </div>

          {/* Diagnostic 2: Design System Tokens */}
          <div className="card-editorial">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Palette size={24} style={{ color: 'var(--accent-coral)' }} />
                <h3 style={{ fontSize: '1.125rem' }}>Design System Tokens</h3>
              </div>
              <span className="badge badge-gold">Cinematic Universe</span>
            </div>
            <p style={{ fontSize: '0.875rem', marginBottom: '16px' }}>
              Midnight Navy (<code>#060813</code>), Exhibition Surface (<code>#101530</code>), Starlight Ivory (<code>#F7F5F0</code>), and Champagne Gold (<code>#E6C687</code>).
            </p>
            {/* Color Swatches */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <div style={{ flex: 1, height: '32px', borderRadius: 'var(--radius-sm)', background: '#060813', border: '1px solid var(--border-subtle)' }} title="Midnight Canvas #060813" />
              <div style={{ flex: 1, height: '32px', borderRadius: 'var(--radius-sm)', background: '#101530', border: '1px solid var(--border-subtle)' }} title="Surface Card #101530" />
              <div style={{ flex: 1, height: '32px', borderRadius: 'var(--radius-sm)', background: '#F7F5F0' }} title="Starlight Ivory #F7F5F0" />
              <div style={{ flex: 1, height: '32px', borderRadius: 'var(--radius-sm)', background: '#E6C687' }} title="Champagne Gold #E6C687" />
              <div style={{ flex: 1, height: '32px', borderRadius: 'var(--radius-sm)', background: '#8E7CFF' }} title="Atmospheric Violet #8E7CFF" />
            </div>
          </div>

          {/* Diagnostic 3: Live Taxonomy Load */}
          <div className="card-editorial">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Graph size={24} style={{ color: 'var(--accent-lavender)' }} />
                <h3 style={{ fontSize: '1.125rem' }}>Live Taxonomy Catalog</h3>
              </div>
              <span className="badge badge-success">
                {skills.length} Skills • {tools.length} Tools
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', marginBottom: '12px' }}>
              Successfully queried <code>/api/taxonomy/skills</code> and <code>/api/taxonomy/tools</code>:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {loadingTaxonomy ? (
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>Loading taxonomy...</span>
              ) : (
                tools.slice(0, 5).map((t) => (
                  <span key={t.id} className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>
                    {t.name}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Route Directory Table */}
        <div className="card-editorial" style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '1.375rem', marginBottom: '4px' }}>Configured Application Routes</h2>
              <p style={{ fontSize: '0.875rem' }}>All Phase 0 audited routes are registered in React Router and ready for page authoring.</p>
            </div>
            <span className="badge badge-neutral">{routeDirectory.length} Routes Configured</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {routeDirectory.map((r) => (
              <Link
                key={r.path}
                to={r.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'var(--bg-surface-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-lavender)';
                  e.currentTarget.style.background = 'var(--bg-surface)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.background = 'var(--bg-surface-subtle)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '2px' }}>
                    {r.label}
                  </div>
                  <div style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    {r.path}
                  </div>
                </div>
                <ArrowRight size={16} style={{ color: 'var(--text-tertiary)' }} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
