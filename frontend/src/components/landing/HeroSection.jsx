import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkle,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  VideoCamera,
} from '@phosphor-icons/react';

export default function HeroSection() {
  return (
    <section
      style={{
        position: 'relative',
        padding: '56px 0 64px',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #FAF8F5 0%, #F5F1EB 100%)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* Subtle Background Glow Spheres */}
      <div
        style={{
          position: 'absolute',
          top: '-120px',
          right: '-80px',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124, 110, 230, 0.09) 0%, rgba(250, 248, 245, 0) 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-100px',
          left: '-60px',
          width: '420px',
          height: '420px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 107, 87, 0.08) 0%, rgba(250, 248, 245, 0) 70%)',
          pointerEvents: 'none',
        }}
      />

      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '48px',
            alignItems: 'center',
          }}
        >
          {/* Left Column: Editorial Headline & Actions */}
          <div>
            {/* Tagline / Eyebrow */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-pill)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-sm)',
                marginBottom: '20px',
              }}
            >
              <Sparkle weight="fill" size={14} style={{ color: 'var(--accent-coral)' }} />
              <span
                style={{
                  fontFamily: 'var(--font-family-display)',
                  fontSize: '0.8125rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                }}
              >
                Where bold ideas find their creators.
              </span>
            </div>

            {/* Headline */}
            <h1
              style={{
                fontSize: 'clamp(2.5rem, 3.8vw + 1rem, 3.75rem)',
                fontWeight: '800',
                lineHeight: 1.08,
                letterSpacing: '-0.04em',
                marginBottom: '20px',
                color: 'var(--text-primary)',
              }}
            >
              The evidence-backed generative creator marketplace.
            </h1>

            {/* Subtext */}
            <p
              style={{
                fontSize: '1.125rem',
                lineHeight: 1.6,
                color: 'var(--text-secondary)',
                marginBottom: '32px',
                maxWidth: '46ch',
              }}
            >
              Connect with vetted generative AI directors, 3D artists, and studios with inspectable production pipelines and guaranteed commercial IP rights.
            </p>

            {/* Dual CTAs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '36px' }}>
              <Link to="/creators" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '1rem' }}>
                <span>Hire a Creator</span>
                <ArrowRight size={18} weight="bold" />
              </Link>
              <Link to="/register" className="btn btn-outline" style={{ padding: '14px 24px', fontSize: '1rem', background: 'var(--bg-surface)' }}>
                <span>Apply as Creator</span>
              </Link>
            </div>

            {/* Trust Micro-Metrics */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} weight="fill" style={{ color: 'var(--accent-lavender)' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Audited Workflow Proof
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={20} weight="fill" style={{ color: 'var(--status-success)' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Commercial IP Buyout
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Floating 3D-Inspired Studio Card Stack */}
          <div style={{ position: 'relative', minHeight: '440px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Background Decorative Base Card */}
            <div
              className="card-editorial"
              style={{
                position: 'absolute',
                top: '20px',
                right: '10px',
                width: '92%',
                height: '92%',
                background: 'rgba(255, 255, 255, 0.65)',
                transform: 'rotate(2.5deg)',
                zIndex: 1,
                border: '1px solid rgba(26, 23, 21, 0.06)',
                pointerEvents: 'none',
              }}
            />

            {/* Main Interactive Showcase Card */}
            <Link
              to="/creators/elena_creative"
              className="glass-panel"
              style={{
                position: 'relative',
                zIndex: 2,
                width: '100%',
                maxWidth: '480px',
                padding: '24px',
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-xl)',
                border: '1px solid rgba(255, 255, 255, 0.9)',
                textDecoration: 'none',
                color: 'inherit',
                display: 'block',
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #7C6EE6 0%, #FF6B57 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '700',
                      fontSize: '0.9375rem',
                    }}
                  >
                    ER
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                      Elena Rostova
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-family-mono)' }}>
                      @elena_rostova • Studio Showcase
                    </div>
                  </div>
                </div>
                <span className="badge badge-verified" style={{ fontSize: '0.6875rem' }}>
                  <ShieldCheck weight="fill" size={13} />
                  Top Studio
                </span>
              </div>

              {/* Sample Campaign Visual Snippet */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '190px',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  background: 'linear-gradient(135deg, #24202B 0%, #1A1715 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                }}
              >
                {/* Visual Content Representation */}
                <div style={{ textAlign: 'center', color: '#FAF8F5', padding: '16px' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(255,255,255,0.12)',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-pill)',
                      fontSize: '0.6875rem',
                      fontFamily: 'var(--font-family-mono)',
                      marginBottom: '10px',
                    }}
                  >
                    <VideoCamera size={13} />
                    4K UHD • 16:9 • ComfyUI + Runway Gen-3
                  </div>
                  <div style={{ fontWeight: '700', fontSize: '1.0625rem', letterSpacing: '-0.02em', marginBottom: '4px' }}>
                    “Aura Lumina” Liquid Fluidity
                  </div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.75 }}>
                    Worldwide Broadcast Rights • Full Node Graph Verified
                  </div>
                </div>
              </div>

              {/* Verified Tool & Milestone Badges */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>Runway Gen-3</span>
                  <span className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>Flux.1 Pro</span>
                  <span className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>ComfyUI</span>
                </div>
                <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                  $1,200 <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', fontWeight: '400' }}>min/brief</span>
                </div>
              </div>
            </Link>

            {/* Floating Live Badge Overlay */}
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                left: '-16px',
                zIndex: 3,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 16px',
                boxShadow: 'var(--shadow-lg)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--status-success-bg)',
                  color: 'var(--status-success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle weight="fill" size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  100% Provenance Audit
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                  Zero unverified prompt claims
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
