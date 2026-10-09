import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from '@phosphor-icons/react';

export default function NotFoundPage() {
  return (
    <div style={{ padding: '80px 0', textAlign: 'center' }}>
      <div className="container-narrow">
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--accent-coral-subtle)',
            color: 'var(--accent-coral)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <Compass size={32} weight="duotone" />
        </div>
        <span className="badge badge-coral" style={{ marginBottom: '12px' }}>
          404 Error
        </span>
        <h1 style={{ marginBottom: '16px', fontSize: '2.5rem' }}>Page Not Found</h1>
        <p style={{ margin: '0 auto 32px', maxWidth: '48ch' }}>
          The requested route does not exist or has been relocated. Return to the Kivora platform foundation.
        </p>
        <Link to="/" className="btn btn-primary">
          <ArrowLeft size={16} />
          Return to Foundation
        </Link>
      </div>
    </div>
  );
}
