import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Star,
  Clock,
  ArrowLeft,
  Sparkle,
  CheckCircle,
  Globe,
  MapPin,
  Briefcase,
  DiamondsFour,
  VideoCamera,
  WarningCircle,
  ArrowsClockwise,
  ArrowSquareOut,
  Sliders,
} from '@phosphor-icons/react';
import { creatorsApi } from '../api/creators';
import ProjectDeepDiveModal from '../components/creator/ProjectDeepDiveModal';

export default function CreatorProfilePage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeTypeFilter, setActiveTypeFilter] = useState('ALL');

  useEffect(() => {
    setLoading(true);
    setError(null);
    creatorsApi
      .getDetail(slug)
      .then((data) => {
        setCreator(data);
      })
      .catch((err) => {
        console.error('Failed to load creator profile:', err);
        setError(err.status === 404 ? 'NOT_FOUND' : err.message || 'Could not load creator profile.');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  // Handle 404 or Loading states
  if (loading) {
    return (
      <div style={{ padding: '60px 0 100px' }}>
        <div className="container">
          <div className="card-editorial" style={{ height: '280px', marginBottom: '32px', animation: 'pulse 1.5s infinite ease-in-out' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {[1, 2].map((i) => (
              <div key={i} className="card-editorial" style={{ height: '260px', animation: 'pulse 1.5s infinite ease-in-out' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error === 'NOT_FOUND' || (!creator && !loading)) {
    return (
      <div style={{ padding: '80px 0 120px', textAlign: 'center' }}>
        <div className="container-narrow">
          <div className="card-editorial" style={{ padding: '48px 24px' }}>
            <WarningCircle size={48} style={{ color: 'var(--accent-coral)', margin: '0 auto 16px' }} />
            <h1 style={{ fontSize: '1.75rem', marginBottom: '8px' }}>Creator Not Found</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              No creator matching <code>@{slug}</code> exists in the verified Kivora registry.
            </p>
            <Link to="/creators" className="btn btn-primary">
              <ArrowLeft size={16} />
              <span>Return to Creator Marketplace</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '80px 0 120px', textAlign: 'center' }}>
        <div className="container-narrow">
          <div className="card-editorial" style={{ padding: '48px 24px' }}>
            <WarningCircle size={48} style={{ color: 'var(--accent-coral)', margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Connection Error</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>{error}</p>
            <button onClick={() => window.location.reload()} className="btn btn-outline">
              <ArrowsClockwise size={16} />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const projects = creator.portfolio_projects || [];
  const filteredProjects = projects.filter((p) => {
    if (activeTypeFilter === 'ALL') return true;
    return p.content_type?.toUpperCase() === activeTypeFilter;
  });

  return (
    <div style={{ padding: '40px 0 100px' }}>
      <div className="container">
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: '24px' }}>
          <Link
            to="/creators"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              transition: 'color var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            <ArrowLeft size={16} />
            <span>Back to Creator Marketplace</span>
          </Link>
        </div>

        {/* Profile Hero Header */}
        <div
          className="card-editorial"
          style={{
            padding: '36px',
            marginBottom: '40px',
            background: 'linear-gradient(180deg, #FFFFFF 0%, #FAF8F5 100%)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-xl)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '24px',
            }}
          >
            {/* Left: Avatar + Details */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #1A1715 0%, #3D3835 100%)',
                  color: '#FAF8F5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '2rem',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                {creator.display_name?.charAt(0) || 'C'}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                  <h1 style={{ fontSize: 'clamp(1.75rem, 2.5vw + 0.5rem, 2.25rem)', letterSpacing: '-0.03em' }}>
                    {creator.display_name}
                  </h1>
                  <span
                    className={`badge ${
                      creator.verification_tier === 'TOP_STUDIO'
                        ? 'badge-verified'
                        : creator.verification_tier === 'VERIFIED_PRO'
                        ? 'badge-success'
                        : 'badge-neutral'
                    }`}
                  >
                    <ShieldCheck weight="fill" size={13} />
                    {creator.verification_tier?.replace('_', ' ')}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', color: 'var(--text-tertiary)', fontSize: '0.875rem', marginBottom: '14px' }}>
                  <span style={{ fontFamily: 'var(--font-family-mono)', color: 'var(--text-secondary)', fontWeight: '600' }}>
                    @{creator.handle}
                  </span>
                  <span>•</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={15} />
                    {creator.location}
                  </span>
                  <span>•</span>
                  <span>{creator.years_experience} yrs generative production</span>
                  {creator.website_url && (
                    <>
                      <span>•</span>
                      <a
                        href={creator.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-lavender)' }}
                      >
                        <Globe size={15} />
                        <span>Website</span>
                      </a>
                    </>
                  )}
                </div>

                <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: '1.6', maxWidth: '64ch' }}>
                  {creator.bio}
                </p>
              </div>
            </div>

            {/* Right: Metrics & Actions */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '16px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                minWidth: '240px',
              }}
            >
              <div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontFamily: 'var(--font-family-mono)' }}>
                  Starting Minimum Fee
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                  ${creator.min_budget?.toLocaleString()}{' '}
                  <span style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-tertiary)' }}>USD / brief</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8125rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  <Star weight="fill" size={15} style={{ color: '#EAB308' }} />
                  <span>{creator.average_rating ? Number(creator.average_rating).toFixed(1) : '5.0'}</span>
                </div>
                <span style={{ color: 'var(--text-tertiary)' }}>•</span>
                <span style={{ color: 'var(--text-secondary)' }}>{creator.completed_projects_count || 0} completed projects</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: creator.availability_status === 'AVAILABLE' ? 'var(--status-success)' : 'var(--status-warning)',
                  }}
                />
                <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {creator.availability_status === 'AVAILABLE' ? 'Available for New Briefs' : creator.availability_status}
                </span>
              </div>

              <Link
                to="/briefs/create"
                className="btn btn-primary"
                style={{ width: '100%', fontSize: '0.875rem', padding: '10px 16px' }}
              >
                <span>Invite to Campaign Brief</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 2-Column Section: Stack & Provenance Matrix */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', marginBottom: '48px' }}>
          {/* Generative Tool Stack (Declared vs Evidence Audited) */}
          <div className="card-editorial">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.125rem' }}>Generative Tool Stack & Models</h3>
              <span className="badge badge-neutral">{creator.tools?.length || 0} Tools</span>
            </div>

            <div style={{ display: 'grid', gap: '10px' }}>
              {creator.tools?.map((tool) => (
                <div
                  key={tool.tool_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'var(--bg-surface-subtle)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      {tool.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      {tool.vendor} • {tool.category}
                    </div>
                  </div>

                  {tool.is_claim_verified ? (
                    <span className="badge badge-verified" style={{ fontSize: '0.625rem' }}>
                      <ShieldCheck weight="fill" size={12} />
                      Evidence Audited
                    </span>
                  ) : (
                    <span className="badge badge-neutral" style={{ fontSize: '0.625rem' }}>
                      Self-Declared
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Creative Disciplines & Skills */}
          <div className="card-editorial">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.125rem' }}>Production Disciplines & Skills</h3>
              <span className="badge badge-neutral">{creator.skills?.length || 0} Skills</span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {creator.skills?.map((skill) => (
                <div
                  key={skill.skill_id}
                  style={{
                    display: 'inline-flex',
                    flexDirection: 'column',
                    padding: '8px 14px',
                    background: 'var(--bg-surface-subtle)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <span style={{ fontWeight: '700', fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                    {skill.name}
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                    {skill.proficiency_level} • {skill.category}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Portfolio Projects Section */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.5rem', letterSpacing: '-0.03em' }}>
                Verified Portfolio Projects
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Inspect interactive step-by-step production pipelines and verifiable render logs.
              </p>
            </div>

            {/* Content Type Filter Pills */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['ALL', 'VIDEO', 'IMAGE', 'PRODUCT_VIZ'].map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveTypeFilter(type)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    border: activeTypeFilter === type ? '1px solid var(--text-primary)' : '1px solid var(--border-medium)',
                    background: activeTypeFilter === type ? 'var(--text-primary)' : 'var(--bg-surface)',
                    color: activeTypeFilter === type ? 'var(--text-on-dark)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Project Grid */}
          {filteredProjects.length === 0 ? (
            <div className="card-editorial" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <p style={{ color: 'var(--text-secondary)' }}>No portfolio projects found for this category.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '28px' }}>
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="card-editorial"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '24px',
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelectedProject(project)}
                >
                  <div>
                    {/* Media Preview Box */}
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: '200px',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        background: 'linear-gradient(135deg, #1A1715 0%, #302B27 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '16px',
                      }}
                    >
                      <div style={{ textAlign: 'center', color: '#FAF8F5', padding: '16px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.12)', padding: '4px 10px', borderRadius: 'var(--radius-pill)', fontSize: '0.6875rem', marginBottom: '8px' }}>
                          <VideoCamera size={13} />
                          {project.content_type} • {project.aspect_ratio}
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: '700' }}>
                          {project.title}
                        </div>
                      </div>
                    </div>

                    {/* Title & Metadata */}
                    <h3 style={{ fontSize: '1.125rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
                      {project.title}
                    </h3>
                    <p
                      style={{
                        fontSize: '0.8125rem',
                        color: 'var(--text-secondary)',
                        lineHeight: '1.5',
                        marginBottom: '16px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {project.description}
                    </p>
                  </div>

                  {/* Deep-Dive CTA Footer */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '14px',
                      borderTop: '1px solid var(--border-subtle)',
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--accent-lavender)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} />
                      {project.workflow_steps?.length || 0} Production Steps
                    </span>

                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ padding: '6px 14px', fontSize: '0.75rem' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProject(project);
                      }}
                    >
                      <span>View Workflow & Evidence</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Interactive Project Deep-Dive Modal */}
      <ProjectDeepDiveModal
        project={selectedProject}
        isOpen={Boolean(selectedProject)}
        onClose={() => setSelectedProject(null)}
      />
    </div>
  );
}
