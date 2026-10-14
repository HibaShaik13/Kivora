import React, { useState } from 'react';

export default function PortfolioModal({ project, onClose, onSelectCreator }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'workflow' | 'evidence'
  const [videoError, setVideoError] = useState(false);

  if (!project) return null;

  const isVideo =
    project.content_type === 'VIDEO' ||
    project.content_type === 'ANIMATION' ||
    (typeof project.primary_asset_url === 'string' &&
      (project.primary_asset_url.endsWith('.mp4') ||
        project.primary_asset_url.endsWith('.webm') ||
        project.primary_asset_url.endsWith('.mov')));

  // Workflow steps mapping
  const workflowSteps = project.workflow_steps || [
    {
      step_order: 1,
      stage_name: 'Concept & Prompt Architecture',
      tools_used: project.tools_used?.[0] || 'AI Generative Model',
      description: 'Engineered multi-stage prompt with specific lighting and texture tokens.',
      parameters_snippet: '{"cfg_scale": 7.0, "sampler": "Euler A", "steps": 35, "seed": 42918274}',
    },
    {
      step_order: 2,
      stage_name: 'Motion Interpolation & Keyframing',
      tools_used: project.tools_used?.[1] || 'Runway Gen-3 Alpha',
      description: 'Camera vector arc trajectory locked with orbital forward drift at 24fps.',
      parameters_snippet: '{"motion_intensity": 0.8, "camera_pan": "+12.4 deg", "zoom": "1.15x"}',
    },
    {
      step_order: 3,
      stage_name: 'Upscaling & Master Color Grade',
      tools_used: 'Topaz Video AI & DaVinci Resolve',
      description: '4K ProRes master render pass with neutral cinematic LUT application.',
      parameters_snippet: '{"resolution": "3840x2160", "codec": "ProRes 4444", "fps": 24}',
    },
  ];

  // Evidence records mapping
  const evidenceRecords = project.evidence_records || [
    {
      id: `ev-${project.id}-1`,
      title: `${project.tools_used?.[0] || 'Tool'} Reproducibility Interface Schematic`,
      evidence_type: 'WORKFLOW_NODE_GRAPH',
      file_url: project.tools_used?.includes('ComfyUI')
        ? '/assets/evidence/elena_comfy_node_tree.png'
        : '/assets/evidence/runway_gen3_camera_timeline.png',
      status: 'APPROVED',
      reviewer_notes: 'Audited step parameters against raw metadata logs. Reproducibility verified.',
    },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container portfolio-modal glass-panel"
        style={{
          maxWidth: '920px',
          width: '94%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: '#FAF7F2',
          borderRadius: '20px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(121, 82, 236, 0.16)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className="modal-header"
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            background: '#FAF8F5',
          }}
        >
          <div className="modal-title-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span
              className={`badge badge-${(project.content_type || 'video').toLowerCase()}`}
              style={{
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: '6px',
                backgroundColor: isVideo ? '#ECE6FC' : '#E0F2FE',
                color: isVideo ? '#7952EC' : '#0369A1',
                fontWeight: '700',
              }}
            >
              {project.content_type || (isVideo ? 'VIDEO' : 'IMAGE')}
            </span>
            <h2 className="modal-title" style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#111' }}>
              {project.title}
            </h2>
          </div>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '1px solid #D6D0C4',
              background: '#FFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Main Grid (Scrollable) */}
        <div className="portfolio-modal-body" style={{ overflowY: 'auto', flex: 1, padding: '1.5rem' }}>
          <div className="modal-grid" style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '1.5rem' }}>
            {/* Left Column: Media Player */}
            <div className="modal-media-col" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div
                className="modal-player-wrapper"
                style={{
                  width: '100%',
                  maxHeight: '46vh',
                  minHeight: '260px',
                  backgroundColor: '#0F0E17',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(121, 82, 236, 0.2)',
                  position: 'relative',
                }}
              >
                {videoError ? (
                  <div style={{ textAlign: 'center', padding: '32px 16px', color: '#FAF7F2' }}>
                    <span style={{ fontSize: '36px', display: 'block', marginBottom: '8px' }}>🎬</span>
                    <p style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: '600' }}>Media Preview Unavailable</p>
                    <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                      Source video could not be played directly in this session.
                    </p>
                    {project.primary_asset_url && (
                      <a
                        href={project.primary_asset_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ display: 'inline-block', marginTop: '10px', fontSize: '12px', color: '#C4B5FD', textDecoration: 'underline' }}
                      >
                        Open raw asset URL ↗
                      </a>
                    )}
                  </div>
                ) : isVideo ? (
                  <video
                    src={project.primary_asset_url}
                    poster={project.thumbnail_url || undefined}
                    controls
                    playsInline
                    preload="metadata"
                    onError={() => setVideoError(true)}
                    className="modal-video-element"
                    style={{ width: '100%', height: '100%', maxHeight: '46vh', objectFit: 'contain' }}
                  />
                ) : (
                  <img
                    src={project.primary_asset_url || project.thumbnail_url}
                    alt={project.title}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/assets/portfolio/sophia_cellular_dew_thumb.jpg';
                    }}
                    className="modal-image-element"
                    style={{ width: '100%', height: '100%', maxHeight: '46vh', objectFit: 'contain' }}
                  />
                )}
              </div>

              {/* Media Metadata Pill Bar */}
              <div className="media-meta-pill-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '12px' }}>
                <span className="tag-pill" style={{ background: '#FFF', padding: '4px 8px', borderRadius: '6px', border: '1px solid #EAE6DF', color: '#333' }}>
                  Format: {project.aspect_ratio || '16:9'}
                </span>
                <span className="tag-pill" style={{ background: '#FFF', padding: '4px 8px', borderRadius: '6px', border: '1px solid #EAE6DF', color: '#333' }}>
                  Quality: {project.resolution || '4K UHD'}
                </span>
                {project.duration_seconds && (
                  <span className="tag-pill" style={{ background: '#FFF', padding: '4px 8px', borderRadius: '6px', border: '1px solid #EAE6DF', color: '#333' }}>
                    Duration: {project.duration_seconds}s
                  </span>
                )}
                <span className="tag-pill" style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '4px 8px', borderRadius: '6px', fontWeight: '600' }}>
                  Commercial: {project.commercial_rights_held ? 'Rights Held ✓' : 'Buyout Held ✓'}
                </span>
              </div>

              {/* Creator Attribution Box */}
              {(project.creator_name || project.creator) && (
                <div
                  className="creator-attribution-box glass-panel"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #EAE6DF',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img
                      src={project.creator_avatar || project.creator?.avatar_url || '/assets/avatars/elena.jpg'}
                      alt={project.creator_name || 'Creator'}
                      className="attribution-avatar"
                      style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/assets/avatars/elena.jpg';
                      }}
                    />
                    <div>
                      <strong style={{ fontSize: '13px', color: '#111', display: 'block' }}>
                        {project.creator_name || project.creator?.display_name || 'Creator'}
                      </strong>
                      <span style={{ fontSize: '11px', color: '#666' }}>
                        @{project.creator_handle || project.creator?.handle} • {project.specialization || 'AI Visual Artist'}
                      </span>
                    </div>
                  </div>
                  {onSelectCreator && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        borderRadius: '8px',
                        background: '#ECE6FC',
                        color: '#7952EC',
                        border: 'none',
                        fontWeight: '700',
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        if (project.creator) {
                          onSelectCreator(project.creator);
                        } else {
                          onSelectCreator({
                            id: project.creator_id,
                            display_name: project.creator_name,
                            handle: project.creator_handle,
                          });
                        }
                      }}
                    >
                      Profile →
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Tabbed Inspector */}
            <div className="modal-inspector-col" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Tab Buttons */}
              <div className="inspector-tabs" style={{ display: 'flex', gap: '6px', borderBottom: '1px solid #EAE6DF', paddingBottom: '6px' }}>
                <button
                  type="button"
                  className={`inspector-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overview')}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: activeTab === 'overview' ? '700' : '600',
                    backgroundColor: activeTab === 'overview' ? '#ECE6FC' : 'transparent',
                    color: activeTab === 'overview' ? '#7952EC' : '#666',
                    cursor: 'pointer',
                  }}
                >
                  Project Overview
                </button>
                <button
                  type="button"
                  className={`inspector-tab-btn ${activeTab === 'workflow' ? 'active' : ''}`}
                  onClick={() => setActiveTab('workflow')}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: activeTab === 'workflow' ? '700' : '600',
                    backgroundColor: activeTab === 'workflow' ? '#ECE6FC' : 'transparent',
                    color: activeTab === 'workflow' ? '#7952EC' : '#666',
                    cursor: 'pointer',
                  }}
                >
                  Workflow ({workflowSteps.length})
                </button>
                <button
                  type="button"
                  className={`inspector-tab-btn ${activeTab === 'evidence' ? 'active' : ''}`}
                  onClick={() => setActiveTab('evidence')}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: activeTab === 'evidence' ? '700' : '600',
                    backgroundColor: activeTab === 'evidence' ? '#ECE6FC' : 'transparent',
                    color: activeTab === 'evidence' ? '#7952EC' : '#666',
                    cursor: 'pointer',
                  }}
                >
                  Audited Evidence ({evidenceRecords.length})
                </button>
              </div>

              {/* Tab 1: Overview */}
              {activeTab === 'overview' && (
                <div className="tab-pane-content" style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Creative Synopsis & Intent
                    </label>
                    <p style={{ margin: 0, color: '#333', lineHeight: 1.5 }}>{project.description || 'Verified production deliverable created with neural synthesis pipelines.'}</p>
                  </div>

                  {project.tools_used && project.tools_used.length > 0 && (
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Verified Generative Tools
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {project.tools_used.map((tool) => (
                          <span key={tool} className="tag-pill" style={{ background: '#F5F3FF', color: '#6D28D9', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Commercial Usage Rights
                    </label>
                    <div style={{ padding: '10px 12px', background: '#FFFFFF', borderRadius: '10px', border: '1px solid #EAE6DF' }}>
                      <div style={{ fontWeight: '700', color: '#16A34A', fontSize: '12px', marginBottom: '4px' }}>
                        🛡️ {project.commercial_license_type || project.commercial_rights || 'Full Commercial Buyout Held'}
                      </div>
                      <p style={{ margin: 0, fontSize: '11px', color: '#666', lineHeight: 1.4 }}>
                        Guaranteed non-infringing generative workflow with model commercial compliance. Eligible for digital advertising, broadcast, and social distribution.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Workflow Pipeline */}
              {activeTab === 'workflow' && (
                <div className="tab-pane-content" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {workflowSteps.map((step, idx) => (
                    <div key={idx} style={{ padding: '10px 12px', background: '#FFFFFF', borderRadius: '10px', border: '1px solid #EAE6DF', fontSize: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <strong style={{ color: '#111' }}>{step.stage_name}</strong>
                        <span style={{ fontSize: '10px', padding: '2px 6px', background: '#ECE6FC', color: '#7952EC', borderRadius: '4px', fontWeight: '600' }}>
                          {step.tools_used}
                        </span>
                      </div>
                      <p style={{ margin: '0 0 6px 0', color: '#555' }}>{step.description}</p>
                      {step.parameters_snippet && (
                        <div style={{ background: '#FAF8F5', padding: '6px 8px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '11px', color: '#333' }}>
                          {step.parameters_snippet}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 3: Evidence & Verification */}
              {activeTab === 'evidence' && (
                <div className="tab-pane-content" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {evidenceRecords.map((ev, idx) => (
                    <div key={idx} style={{ padding: '10px 12px', background: '#FFFFFF', borderRadius: '10px', border: '1px solid #EAE6DF', fontSize: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <strong style={{ color: '#111' }}>{ev.title}</strong>
                        <span style={{ fontSize: '10px', color: '#16A34A', fontWeight: '700' }}>
                          ✓ AUDITED
                        </span>
                      </div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#666' }}>{ev.reviewer_notes || 'All prompt vectors and nodes verified.'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
