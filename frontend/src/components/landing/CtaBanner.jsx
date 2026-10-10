import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkle, Compass } from '@phosphor-icons/react';

export default function CtaBanner() {
  return (
    <section style={{ padding: '100px 0 120px', background: '#060813' }}>
      <div className="container">
        <div
          style={{
            position: 'relative',
            background: 'linear-gradient(145deg, #101530 0%, #080a18 100%)',
            borderRadius: '28px',
            padding: '84px 40px',
            textAlign: 'center',
            overflow: 'hidden',
            border: '1px solid rgba(167, 139, 250, 0.28)',
            boxShadow: '0 24px 64px -16px rgba(0, 0, 0, 0.8)',
          }}
        >
          {/* Subtle Ambient Radial Glow */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '640px',
              height: '420px',
              background: 'radial-gradient(circle, rgba(167, 139, 250, 0.15) 0%, rgba(230, 198, 135, 0.05) 45%, transparent 70%)',
              pointerEvents: 'none',
              filter: 'blur(45px)',
            }}
          />

          <div style={{ position: 'relative', zIndex: 2, maxWidth: '740px', margin: '0 auto' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-pill)',
                background: 'rgba(167, 139, 250, 0.1)',
                border: '1px solid rgba(167, 139, 250, 0.25)',
                marginBottom: '24px',
              }}
            >
              <Sparkle weight="fill" size={13} style={{ color: '#A78BFA' }} />
              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-family-mono)', fontWeight: '600', color: '#A78BFA', letterSpacing: '0.04em' }}>
                THE GENERATIVE PRODUCTION UNIVERSE
              </span>
            </div>

            <h2
              className="font-serif"
              style={{
                fontSize: 'clamp(2.25rem, 3.8vw + 0.5rem, 3.5rem)',
                lineHeight: 1.12,
                letterSpacing: '-0.02em',
                marginBottom: '18px',
                color: 'var(--text-primary)',
              }}
            >
              Bring ambitious{' '}
              <span
                style={{
                  fontStyle: 'italic',
                  color: '#A78BFA',
                  fontWeight: '500',
                  textShadow: '0 0 30px rgba(167, 139, 250, 0.4)',
                }}
              >
                creative campaigns
              </span>{' '}
              to life.
            </h2>

            <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '36px', maxWidth: '58ch', margin: '0 auto 36px' }}>
              Publish your campaign brief with structured AI assistance or explore curated portfolios from verified generative directors.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <Link
                to="/briefs/create"
                className="btn btn-gold"
                style={{ padding: '16px 32px', fontSize: '0.9375rem', fontWeight: '700' }}
              >
                <span>Post a Campaign Brief</span>
                <ArrowRight size={16} weight="bold" />
              </Link>

              <Link
                to="/creators"
                className="btn btn-outline"
                style={{
                  padding: '16px 28px',
                  fontSize: '0.9375rem',
                  fontWeight: '600',
                }}
              >
                <Compass size={18} />
                <span>Explore Creators</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


