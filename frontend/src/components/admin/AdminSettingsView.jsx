import React from 'react';

export default function AdminSettingsView() {
  const envMode = import.meta.env.MODE || 'development';
  const apiBase = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000 (proxy: /api)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. HEADER & NOTICE */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid rgba(121, 82, 236, 0.12)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1E0B38', fontWeight: '800', fontSize: '15px' }}>
          <span>⚙️</span>
          <span>Platform Settings & System Configuration</span>
        </div>
        <p style={{ fontSize: '12px', color: '#4B5563', margin: 0, lineHeight: 1.6 }}>
          <strong>Environment-Governed Configuration:</strong> Kivora runtime settings are currently managed via environment configuration files (<code>.env</code>) and application bootstrap parameters.
        </p>
        <div style={{ backgroundColor: '#FAF5FF', border: '1px solid #E9D5FF', borderRadius: '10px', padding: '10px 14px', fontSize: '11.5px', color: '#6B21A8' }}>
          Dynamic administrative overrides, editable commission schedules, and maintenance mode toggles are scheduled for Phase 2. Safe, non-sensitive runtime parameters currently in effect are detailed below.
        </div>
      </div>

      {/* 2. CONFIGURATION GRIDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
        {/* Card 1: Core System & Infrastructure */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid rgba(121, 82, 236, 0.12)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
            padding: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
            <span style={{ fontSize: '16px' }}>🖥️</span>
            <span style={{ fontSize: '14px', fontWeight: '800', color: '#1E0B38' }}>System & Infrastructure</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #F3F4F6' }}>
              <span style={{ color: '#6B7280' }}>Environment Mode</span>
              <span style={{ fontWeight: '700', color: '#1E0B38', textTransform: 'uppercase' }}>{envMode}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #F3F4F6' }}>
              <span style={{ color: '#6B7280' }}>API Endpoint Target</span>
              <span style={{ fontWeight: '600', color: '#4C1D95' }}>{apiBase}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #F3F4F6' }}>
              <span style={{ color: '#6B7280' }}>Database Provider</span>
              <span style={{ fontWeight: '700', color: '#065F46' }}>SQLite 3 (kivora.db)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #F3F4F6' }}>
              <span style={{ color: '#6B7280' }}>Foreign Key Constraints</span>
              <span style={{ fontWeight: '700', color: '#065F46' }}>PRAGMA foreign_keys = ON</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6B7280' }}>Static Media Storage</span>
              <span style={{ fontWeight: '600', color: '#374151' }}>uploads/ (Local FS)</span>
            </div>
          </div>
        </div>

        {/* Card 2: AI & Verification Architecture */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid rgba(121, 82, 236, 0.12)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
            padding: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
            <span style={{ fontSize: '16px' }}>✦</span>
            <span style={{ fontSize: '14px', fontWeight: '800', color: '#1E0B38' }}>AI & Verification Engine</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #F3F4F6' }}>
              <span style={{ color: '#6B7280' }}>AI Provider</span>
              <span style={{ fontWeight: '700', color: '#1E0B38' }}>Google Gemini</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #F3F4F6' }}>
              <span style={{ color: '#6B7280' }}>Configured Model</span>
              <span style={{ fontWeight: '700', color: '#4C1D95' }}>gemini-3.8-flash</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #F3F4F6' }}>
              <span style={{ color: '#6B7280' }}>Verification Analysis Mode</span>
              <span style={{ fontWeight: '600', color: '#065F46' }}>Hybrid (Deterministic + Vision)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #F3F4F6' }}>
              <span style={{ color: '#6B7280' }}>API Key Configuration</span>
              <span style={{ fontWeight: '700', color: '#065F46' }}>Configured (Masked: ••••••••)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6B7280' }}>Decision Delegation</span>
              <span style={{ fontWeight: '700', color: '#DC2626' }}>Strictly Human Only</span>
            </div>
          </div>
        </div>

        {/* Card 3: Authentication & Security Controls */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid rgba(121, 82, 236, 0.12)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
            padding: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
            <span style={{ fontSize: '16px' }}>🔐</span>
            <span style={{ fontSize: '14px', fontWeight: '800', color: '#1E0B38' }}>Security & Authorization</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #F3F4F6' }}>
              <span style={{ color: '#6B7280' }}>Token Architecture</span>
              <span style={{ fontWeight: '700', color: '#1E0B38' }}>PyJWT Stateless Bearer</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #F3F4F6' }}>
              <span style={{ color: '#6B7280' }}>Password Encryption</span>
              <span style={{ fontWeight: '700', color: '#1E0B38' }}>bcrypt (12 rounds salted)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #F3F4F6' }}>
              <span style={{ color: '#6B7280' }}>Email OTP Expiration</span>
              <span style={{ fontWeight: '600', color: '#4C1D95' }}>15 Minutes</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6B7280' }}>RBAC Enforced</span>
              <span style={{ fontWeight: '700', color: '#065F46' }}>CREATOR, BRAND, ADMIN</span>
            </div>
          </div>
        </div>

        {/* Card 4: Verification Tier Policies */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid rgba(121, 82, 236, 0.12)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
            padding: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
            <span style={{ fontSize: '16px' }}>🛡️</span>
            <span style={{ fontSize: '14px', fontWeight: '800', color: '#1E0B38' }}>Verification Tier Thresholds</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #F3F4F6' }}>
              <span style={{ color: '#6B7280' }}>Top Studio Tier</span>
              <span style={{ fontWeight: '700', color: '#6D28D9' }}>≥ 5 Audited Evidence Records</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #F3F4F6' }}>
              <span style={{ color: '#6B7280' }}>Verified Pro Tier</span>
              <span style={{ fontWeight: '700', color: '#065F46' }}>2 – 4 Audited Evidence Records</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid #F3F4F6' }}>
              <span style={{ color: '#6B7280' }}>Community Tier</span>
              <span style={{ fontWeight: '700', color: '#92400E' }}>&lt; 2 Audited Evidence Records</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6B7280' }}>Promotion Trigger</span>
              <span style={{ fontWeight: '600', color: '#1E0B38' }}>Automated on Admin Approval</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
