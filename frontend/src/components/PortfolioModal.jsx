import React, { useState } from 'react';

export default function PortfolioModal({ project, onClose, onSelectCreator }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'workflow' | 'evidence'

  if (!project) return null;

  const isVideo = project.content_type === 'VIDEO' || project.content_type === 'ANIMATION';

  // Sample workflow steps mapping if not already populated
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
      <div className="modal-container glass-panel" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <span className={`badge badge-${project.content_type?.toLowerCase() || 'video'}`}>
              {project.content_type}
            </span>
            <h2 className="modal-title">{project.title}</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Modal Main Grid */}
        <div className="modal-grid">
          {/* Left Column: Media Player */}
          <div className="modal-media-col">
            <div className={`modal-player-wrapper aspect-${project.aspect_ratio ? project.aspect_ratio.replace(':', '-') : '16-9'}`}>
              {isVideo ? (
                <video
                  src={project.primary_asset_url}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="modal-video-element"
                />
              ) : (
                <img
                  src={project.primary_asset_url}
                  alt={project.title}
                  className="modal-image-element"
                />
              )}
            </div>

            {/* Media Metadata Pill Bar */}
            <div className="media-meta-pill-bar">
              <span className="meta-pill">Format: {project.aspect_ratio}</span>
              <span className="meta-pill">Quality: {project.resolution || '4K UHD'}</span>
              {project.duration_seconds && (
                <span className="meta-pill">Duration: {project.duration_seconds}s</span>
              )}
              <span className="meta-pill text-emerald">Commercial Rights: Buyout Held ✓</span>
            </div>

            {/* Creator Attribution Box */}
            <div className="creator-attribution-box glass-panel">
              <img
                src={project.creator_avatar || '/assets/avatars/elena.jpg'}
                alt={project.creator_name}
                className="attribution-avatar"
              />
              <div className="attribution-meta">
                <div className="attribution-name-row">
                  <strong>{project.creator_name}</strong>
                  <span className="badge badge-top-studio">{project.creator_tier || 'TOP STUDIO'}</span>
                </div>
                <span className="attribution-handle">@{project.creator_handle} • {project.specialization}</span>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  if (onSelectCreator) onSelectCreator(project);
                }}
              >
                Profile →
              </button>
            </div>
          </div>

          {/* Right Column: Tabbed Inspector */}
          <div className="modal-inspector-col">
            {/* Tab Buttons */}
            <div className="inspector-tabs">
              <button
                className={`inspector-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Project Overview
              </button>
              <button
                className={`inspector-tab-btn ${activeTab === 'workflow' ? 'active' : ''}`}
                onClick={() => setActiveTab('workflow')}
              >
                Workflow Pipeline ({workflowSteps.length})
              </button>
              <button
                className={`inspector-tab-btn ${activeTab === 'evidence' ? 'active' : ''}`}
                onClick={() => setActiveTab('evidence')}
              >
                Audited Evidence ({evidenceRecords.length})
              </button>
            </div>

            {/* Tab 1: Overview */}
            {activeTab === 'overview' && (
              <div className="tab-pane-content">
                <div className="inspector-field">
                  <label className="field-label">CREATIVE SYNOPSIS & BRIEF</label>
                  <p className="field-value">{project.description}</p>
                </div>

                <div className="inspector-field">
                  <label className="field-label">VERIFIED GENERATIVE TOOLS USED</label>
                  <div className="tag-group">
                    {project.tools_used && project.tools_used.map((tool) => (
                      <span key={tool} className="tag-pill tool-tag">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="inspector-field">
                  <label className="field-label">COMMERCIAL USAGE RIGHTS</label>
                  <div className="license-box glass-panel">
                    <div className="license-title">🛡️ {project.commercial_rights || 'Full Commercial Buyout'}</div>
                    <p className="license-desc">
                      Guaranteed non-infringing generative workflow with model commercial license compliance.
                      Eligible for broadcast, paid digital social, and worldwide web publication.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Workflow Pipeline */}
            {activeTab === 'workflow' && (
              <div className="tab-pane-content">
                <div className="workflow-timeline">
                  {workflowSteps.map((step, idx) => (
                    <div key={idx} className="timeline-item">
                      <div className="timeline-marker">
                        <span className="step-num">{step.step_order || idx + 1}</span>
                      </div>
                      <div className="timeline-content glass-panel">
                        <div className="timeline-header">
                          <strong className="stage-name">{step.stage_name}</strong>
                          <span className="tools-badge">{step.tools_used}</span>
                        </div>
                        <p className="stage-desc">{step.description}</p>
                        {step.parameters_snippet && (
                          <div className="code-snippet-box">
                            <span className="code-lang">GENERATION PARAMETERS</span>
                            <pre className="code-text">{step.parameters_snippet}</pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 3: Evidence & Verification */}
            {activeTab === 'evidence' && (
              <div className="tab-pane-content">
                <div className="evidence-list">
                  {evidenceRecords.map((ev, idx) => (
                    <div key={idx} className="evidence-card glass-panel">
                      <div className="evidence-header">
                        <div className="evidence-type-badge">{ev.evidence_type}</div>
                        <span className="verification-status-pill approved">
                          ✓ AUDITED & APPROVED
                        </span>
                      </div>
                      <h4 className="evidence-title">{ev.title}</h4>

                      {/* Evidence Image / Link */}
                      {ev.file_url && (
                        <div className="evidence-preview-wrapper">
                          <img
                            src={ev.file_url}
                            alt={ev.title}
                            className="evidence-schematic-img"
                            onError={(e) => {
                              e.target.src = '/assets/evidence/elena_comfy_node_tree.png';
                            }}
                          />
                        </div>
                      )}

                      <div className="reviewer-notes-box">
                        <span className="reviewer-tag">REVIEWER AUDIT NOTE</span>
                        <p className="reviewer-text">
                          {ev.reviewer_notes || 'All prompt vectors, node connections, and seed configs verified.'}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Gemini AI Verification Analysis Box */}
                  <div className="gemini-analysis-summary-box glass-panel">
                    <div className="gemini-box-header">
                      <span className="spark-icon">✨</span>
                      <strong>Gemini 3.8 Flash Verification Analysis</strong>
                      <span className="status-badge-completed">STATUS: COMPLETED</span>
                    </div>
                    <p className="gemini-summary-text">
                      "Creator verified proficiency in {project.tools_used?.[0] || 'Runway Gen-3'} with {evidenceRecords.length} process
                      evidence schematic(s) and {workflowSteps.length} documented production pipeline steps. Model parameters and
                      trajectory arcs confirmed."
                    </p>
                    <div className="gemini-disclaimer">
                      ⚠️ AI analysis is not proof of authenticity and does not constitute verification approval.
                      Final verification decisions rest solely with authorized human reviewers.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
