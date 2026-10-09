import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowLeft, Code } from '@phosphor-icons/react';

export default function RoutePlaceholder({ title, route, phase, backingApi, description }) {
  return (
    <div style={{ padding: '64px 0 80px' }}>
      <div className="container-narrow">
        <div className="card-editorial" style={{ textAlign: 'center', padding: '48px 32px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'var(--accent-lavender-subtle)',
              color: 'var(--accent-lavender)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <Clock size={28} weight="duotone" />
          </div>

          <span className="badge badge-verified" style={{ marginBottom: '12px' }}>
            Scheduled for {phase || 'Phase 2+'}
          </span>

          <h1 style={{ fontSize: '2rem', marginBottom: '12px' }}>{title}</h1>
          <p style={{ margin: '0 auto 24px', maxWidth: '52ch', fontSize: '0.9375rem' }}>
            {description || 'This route is registered in the architecture and will be populated with full interactive UI in the subsequent development phase.'}
          </p>

          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              textAlign: 'left',
              marginBottom: '32px',
              fontFamily: 'var(--font-family-mono)',
              fontSize: '0.8125rem',
            }}
          >
            <div style={{ color: 'var(--text-tertiary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Code size={14} /> Backing Backend Endpoints:
            </div>
            <div style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
              {backingApi || 'Integrated via Centralized API Service Layer'}
            </div>
          </div>

          <Link to="/" className="btn btn-outline" style={{ display: 'inline-flex' }}>
            <ArrowLeft size={16} />
            Back to Foundation Hub
          </Link>
        </div>
      </div>
    </div>
  );
}
