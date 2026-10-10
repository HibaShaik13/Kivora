import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkle,
  ArrowRight,
  ShieldCheck,
  Compass,
  Planet,
  Lightning,
} from '@phosphor-icons/react';

export default function HeroSection() {
  return (
    <section
      style={{
        position: 'relative',
        minHeight: 'clamp(700px, calc(100dvh - var(--nav-height)), 960px)',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        background: '#060813',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* Background Cinematic Visual with Atmospheric Gradients */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        <img
          src="/assets/hero_cosmic_universe.png"
          alt="Kivora Celestial Creative Universe"
          className="hero-cinematic-bg"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: '75% 42%',
            filter: 'contrast(1.08) saturate(1.05)',
          }}
        />

        {/* Desktop Left-to-Right Scrim: Dark on left for razor-sharp readability, luminous on right for glass planet */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(90deg, rgba(6, 8, 19, 0.90) 0%, rgba(6, 8, 19, 0.78) 36%, rgba(6, 8, 19, 0.30) 65%, transparent 100%)',
          }}
        />

        {/* Top/Bottom Seamless Blends */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(6, 8, 19, 0.65) 0%, transparent 20%, transparent 72%, #080A18 100%)',
          }}
        />

        {/* Ambient Drifting Celestial Dust */}
        <div
          className="celestial-particle"
          style={{
            position: 'absolute',
            top: '26%',
            left: '38%',
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            background: '#A78BFA',
            boxShadow: '0 0 14px 3px rgba(167, 139, 250, 0.9)',
            animationDelay: '0s',
          }}
        />
        <div
          className="celestial-particle"
          style={{
            position: 'absolute',
            top: '68%',
            left: '20%',
            width: '3px',
            height: '3px',
            borderRadius: '50%',
            background: 'var(--accent-gold)',
            boxShadow: '0 0 10px 2px rgba(230, 198, 135, 0.8)',
            animationDelay: '3s',
          }}
        />
        <div
          className="celestial-particle"
          style={{
            position: 'absolute',
            top: '18%',
            left: '55%',
            width: '3px',
            height: '3px',
            borderRadius: '50%',
            background: '#FAF8F5',
            boxShadow: '0 0 8px 2px rgba(250, 248, 245, 0.9)',
            animationDelay: '5s',
          }}
        />
      </div>

      {/* Main Hero Story Container */}
      <div
        className="container"
        style={{
          position: 'relative',
          zIndex: 2,
          paddingTop: '64px',
          paddingBottom: '64px',
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '40px',
        }}
      >
        {/* Left Editorial Content Column */}
        <div
          style={{
            maxWidth: '680px',
            textAlign: 'left',
          }}
        >
          {/* Eyebrow Provenance Pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: 'var(--radius-pill)',
              background: 'rgba(16, 21, 48, 0.88)',
              border: '1px solid rgba(167, 139, 250, 0.3)',
              boxShadow: 'var(--shadow-md)',
              backdropFilter: 'blur(12px)',
              marginBottom: '24px',
            }}
          >
            <Sparkle weight="fill" size={14} style={{ color: '#A78BFA' }} />
            <span
              style={{
                fontFamily: 'var(--font-family-mono)',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#FAF8F5',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              The Generative Creative Platform
            </span>
          </div>

          {/* Master Headline */}
          <h1
            className="font-serif"
            style={{
              fontSize: 'clamp(2.75rem, 5.2vw + 0.8rem, 5rem)',
              fontWeight: '600',
              lineHeight: 1.08,
              letterSpacing: '-0.025em',
              marginBottom: '20px',
              color: 'var(--text-primary)',
              textShadow: '0 4px 28px rgba(0, 0, 0, 0.95)',
            }}
          >
            Step into a{' '}
            <span
              style={{
                fontStyle: 'italic',
                color: '#A78BFA',
                fontWeight: '500',
                textShadow: '0 0 35px rgba(167, 139, 250, 0.45)',
              }}
            >
              creative universe.
            </span>
          </h1>

          {/* Supporting Copy */}
          <p
            style={{
              fontSize: 'clamp(1.0625rem, 1.2vw + 0.5rem, 1.25rem)',
              lineHeight: 1.65,
              color: 'var(--text-secondary)',
              maxWidth: '50ch',
              marginBottom: '36px',
              fontWeight: '400',
              textShadow: '0 2px 14px rgba(0, 0, 0, 0.95)',
            }}
          >
            Discover extraordinary AI creators, explore bold ideas, and bring ambitious campaigns to life.
          </p>

          {/* Primary Action Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              flexWrap: 'wrap',
              marginBottom: '40px',
            }}
          >
            <Link
              to="/creators"
              className="btn btn-gold"
              style={{
                padding: '16px 36px',
                fontSize: '1rem',
                fontWeight: '700',
                boxShadow: '0 8px 24px -4px rgba(230, 198, 135, 0.3)',
              }}
            >
              <Compass size={18} weight="bold" />
              <span>Explore Creators</span>
              <ArrowRight size={16} weight="bold" />
            </Link>

            <Link
              to="/briefs/create"
              className="btn btn-outline"
              style={{
                padding: '16px 32px',
                fontSize: '1rem',
                fontWeight: '600',
                backdropFilter: 'blur(10px)',
              }}
            >
              <span>Create a Campaign</span>
            </Link>
          </div>

          {/* Provenance Verification Badges */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '20px',
              flexWrap: 'wrap',
              padding: '10px 22px',
              borderRadius: 'var(--radius-pill)',
              background: 'rgba(16, 21, 48, 0.75)',
              border: '1px solid var(--border-subtle)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={16} weight="fill" style={{ color: 'var(--accent-gold)' }} />
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                Verifiable Pipeline Proof
              </span>
            </div>
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--border-medium)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkle size={15} weight="fill" style={{ color: '#A78BFA' }} />
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                Studio Level Render Quality
              </span>
            </div>
          </div>
        </div>

        {/* Floating Ambient Celestial HUD Pill (Desktop Only) */}
        <div
          className="desktop-only"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            padding: '20px 24px',
            borderRadius: '20px',
            background: 'rgba(10, 14, 35, 0.65)',
            border: '1px solid rgba(167, 139, 250, 0.25)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.7)',
            maxWidth: '260px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(167, 139, 250, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#A78BFA',
              }}
            >
              <Planet size={18} weight="bold" />
            </div>
            <div>
              <div style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-family-mono)', color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>
                CURATED NETWORK
              </div>
              <div style={{ fontSize: '0.9375rem', fontWeight: '700', color: '#FAF8F5' }}>
                Verified Directors
              </div>
            </div>
          </div>
          <div style={{ height: '1px', background: 'var(--border-subtle)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Commercial Safe</span>
            <span style={{ color: 'var(--accent-gold)', fontWeight: '700' }}>100% Cleared</span>
          </div>
        </div>
      </div>
    </section>
  );
}


