import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkle, ShieldCheck } from '@phosphor-icons/react';

export default function CtaBanner() {
  return (
    <section style={{ padding: '80px 0 100px' }}>
      <div className="container">
        <div
          style={{
            position: 'relative',
            background: 'linear-gradient(135deg, #1A1715 0%, #2A2522 100%)',
            color: '#FAF8F5',
            borderRadius: 'var(--radius-xl)',
            padding: '64px 40px',
            textAlign: 'center',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-xl)',
          }}
        >
          {/* Subtle Accent Glows */}
          <div
            style={{
              position: 'absolute',
              top: '-80px',
              left: '-80px',
              width: '300px',
              height: '300px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(124, 110, 230, 0.35) 0%, rgba(26, 23, 21, 0) 70%)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-80px',
              right: '-80px',
              width: '300px',
              height: '300px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255, 107, 87, 0.3) 0%, rgba(26, 23, 21, 0) 70%)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ position: 'relative', zIndex: 2, maxWidth: '640px', margin: '0 auto' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-pill)',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                marginBottom: '20px',
              }}
            >
              <Sparkle weight="fill" size={14} style={{ color: 'var(--accent-coral)' }} />
              <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#FAF8F5' }}>
                Join the Generative Production Era
              </span>
            </div>

            <h2
              style={{
                fontSize: 'clamp(2rem, 3vw + 0.5rem, 2.75rem)',
                fontWeight: '800',
                letterSpacing: '-0.03em',
                lineHeight: 1.15,
                marginBottom: '16px',
                color: '#FAF8F5',
              }}
            >
              Ready to bring your boldest campaigns to life?
            </h2>

            <p style={{ fontSize: '1.0625rem', opacity: 0.85, lineHeight: 1.6, marginBottom: '32px' }}>
              Publish your creative brief with AI assistance or get your generative studio verified by Kivora’s audit team.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <Link
                to="/briefs/create"
                className="btn btn-coral"
                style={{ padding: '14px 28px', fontSize: '1rem', fontWeight: '700' }}
              >
                <span>Post a Campaign Brief</span>
                <ArrowRight size={18} weight="bold" />
              </Link>

              <Link
                to="/creators"
                style={{
                  padding: '14px 24px',
                  borderRadius: 'var(--radius-pill)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#FAF8F5',
                  fontSize: '1rem',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'all var(--transition-fast)',
                }}
              >
                Explore Creator Portfolios
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
