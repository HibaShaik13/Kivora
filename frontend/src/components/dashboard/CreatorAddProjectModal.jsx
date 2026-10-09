import React, { useState } from 'react';
import { X, Plus, Trash, Sparkle, UploadSimple, ShieldCheck } from '@phosphor-icons/react';
import { creatorsApi } from '../../api/creators';

export default function CreatorAddProjectModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content_type: 'VIDEO',
    primary_asset_url: '',
    thumbnail_url: '',
    aspect_ratio: '16:9',
    resolution: '4K',
    duration_seconds: 30,
    commercial_rights_held: true,
    commercial_license_type: 'COMMERCIAL_FULL',
    featured: true,
  });

  const [workflowSteps, setWorkflowSteps] = useState([
    { stage_name: 'Concept & Prompt Architecture', tools_used: 'Claude 3.5, Midjourney v6', description: 'Structured prompt engineering with style anchors and lighting definitions.', parameters_snippet: '--ar 16:9 --v 6.0 --style raw' },
    { stage_name: 'Motion Generation & Upscaling', tools_used: 'Runway Gen-3 Alpha, Topaz Video AI', description: 'Generated camera motion vectors and upscaled output to 4K 60fps.', parameters_snippet: 'Camera: Pan Right 4, Zoom In 2, Motion 5' }
  ]);

  const [evidenceRecords, setEvidenceRecords] = useState([
    { evidence_type: 'PROCESS_SCREENSHOT', title: 'Generation Timeline & Seed Logs', file_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80', description: 'Raw timeline export verifying iterative camera trajectory prompts.', request_verification: true, target_type: 'PORTFOLIO_PROJECT' }
  ]);

  if (!isOpen) return null;

  const handleStepChange = (index, field, value) => {
    const updated = [...workflowSteps];
    updated[index][field] = value;
    setWorkflowSteps(updated);
  };

  const addWorkflowStep = () => {
    setWorkflowSteps([
      ...workflowSteps,
      { stage_name: `Step ${workflowSteps.length + 1}`, tools_used: '', description: '', parameters_snippet: '' }
    ]);
  };

  const removeWorkflowStep = (index) => {
    if (workflowSteps.length === 1) return;
    setWorkflowSteps(workflowSteps.filter((_, i) => i !== index));
  };

  const handleEvidenceChange = (index, field, value) => {
    const updated = [...evidenceRecords];
    updated[index][field] = value;
    setEvidenceRecords(updated);
  };

  const addEvidence = () => {
    setEvidenceRecords([
      ...evidenceRecords,
      { evidence_type: 'PROCESS_SCREENSHOT', title: '', file_url: '', description: '', request_verification: false, target_type: 'PORTFOLIO_PROJECT' }
    ]);
  };

  const removeEvidence = (index) => {
    if (evidenceRecords.length === 1) return;
    setEvidenceRecords(evidenceRecords.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Project title is required.');
      return;
    }
    if (!formData.primary_asset_url.trim()) {
      setError('Primary asset URL is required.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        ...formData,
        duration_seconds: parseInt(formData.duration_seconds, 10) || null,
        workflow_steps: workflowSteps.filter(s => s.stage_name.trim()),
        evidence_records: evidenceRecords.filter(ev => ev.title.trim() && ev.file_url.trim()),
      };

      await creatorsApi.createPortfolioProject(payload);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to create portfolio project:', err);
      setError(err.message || 'Failed to save portfolio project. Please check fields and retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(26, 23, 21, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '800px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-xl)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-warm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'var(--accent-lavender-subtle)',
                color: 'var(--accent-lavender)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkle size={20} weight="fill" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontFamily: 'var(--font-family-display)' }}>
                Publish Portfolio Project
              </h3>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Include verified workflow telemetry & proof-of-generation assets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: '8px', borderRadius: '50%' }}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '24px', flex: 1 }}>
          {error && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: 'var(--accent-coral-subtle)',
                border: '1px solid var(--accent-coral-border)',
                borderRadius: '8px',
                color: 'var(--accent-coral)',
                fontSize: '0.875rem',
                marginBottom: '20px',
              }}
            >
              {error}
            </div>
          )}

          {/* Core Metadata */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
                Project Title *
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Lumina: Generative Cinematic Brand Film"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
                Description & Creative Intent
              </label>
              <textarea
                className="input"
                rows={3}
                placeholder="Describe the aesthetic direction, narrative arc, and generative techniques applied..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
                Primary Asset URL (Video / Image) *
              </label>
              <input
                type="url"
                className="input"
                placeholder="https://... (mp4, webm, jpg, png)"
                value={formData.primary_asset_url}
                onChange={(e) => setFormData({ ...formData, primary_asset_url: e.target.value })}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
                Thumbnail Poster URL
              </label>
              <input
                type="url"
                className="input"
                placeholder="https://images.unsplash.com/..."
                value={formData.thumbnail_url}
                onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
                Content Type
              </label>
              <select
                className="input"
                value={formData.content_type}
                onChange={(e) => setFormData({ ...formData, content_type: e.target.value })}
              >
                <option value="VIDEO">Video Production</option>
                <option value="IMAGE">Visual Imagery</option>
                <option value="3D_MODEL">3D & Spatial</option>
                <option value="AUDIO">Audio / Voice Synthesis</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
                Aspect Ratio
              </label>
              <select
                className="input"
                value={formData.aspect_ratio}
                onChange={(e) => setFormData({ ...formData, aspect_ratio: e.target.value })}
              >
                <option value="16:9">16:9 (Landscape Cinematic)</option>
                <option value="9:16">9:16 (Vertical Social)</option>
                <option value="1:1">1:1 (Square)</option>
                <option value="2.39:1">2.39:1 (Anamorphic Cinema)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
                Resolution
              </label>
              <input
                type="text"
                className="input"
                placeholder="4K, 1080p, 8K"
                value={formData.resolution}
                onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
                Duration (seconds)
              </label>
              <input
                type="number"
                className="input"
                min={1}
                value={formData.duration_seconds}
                onChange={(e) => setFormData({ ...formData, duration_seconds: e.target.value })}
              />
            </div>
          </div>

          {/* Workflow Steps Section */}
          <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Workflow Telemetry Steps</h4>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Break down your generative pipeline so brands can evaluate prompt structure and model tooling.
                </p>
              </div>
              <button
                type="button"
                onClick={addWorkflowStep}
                className="btn btn-outline"
                style={{ fontSize: '0.8125rem', padding: '6px 12px' }}
              >
                <Plus size={14} /> Add Step
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {workflowSteps.map((step, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    padding: '16px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--accent-lavender)' }}>
                      STEP {idx + 1}
                    </span>
                    {workflowSteps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeWorkflowStep(idx)}
                        className="btn btn-ghost"
                        style={{ padding: '4px', color: 'var(--text-tertiary)' }}
                        title="Remove step"
                      >
                        <Trash size={16} />
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      className="input"
                      placeholder="Stage Name (e.g. Prompt Architecture)"
                      value={step.stage_name}
                      onChange={(e) => handleStepChange(idx, 'stage_name', e.target.value)}
                    />
                    <input
                      type="text"
                      className="input"
                      placeholder="Tools Used (e.g. Midjourney v6, Runway)"
                      value={step.tools_used}
                      onChange={(e) => handleStepChange(idx, 'tools_used', e.target.value)}
                    />
                  </div>
                  <textarea
                    className="input"
                    rows={2}
                    placeholder="Description of pipeline action..."
                    value={step.description}
                    onChange={(e) => handleStepChange(idx, 'description', e.target.value)}
                    style={{ marginBottom: '8px' }}
                  />
                  <input
                    type="text"
                    className="input"
                    placeholder="Prompt snippet / parameters (e.g. --style raw --c 5)"
                    value={step.parameters_snippet}
                    onChange={(e) => handleStepChange(idx, 'parameters_snippet', e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Evidence Records Section */}
          <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Proof-of-Work Evidence</h4>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Attach screenshots, prompt logs, or seed links for official platform verification.
                </p>
              </div>
              <button
                type="button"
                onClick={addEvidence}
                className="btn btn-outline"
                style={{ fontSize: '0.8125rem', padding: '6px 12px' }}
              >
                <Plus size={14} /> Add Evidence
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {evidenceRecords.map((ev, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    padding: '16px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--accent-coral)' }}>
                      EVIDENCE ATTACHMENT #{idx + 1}
                    </span>
                    {evidenceRecords.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEvidence(idx)}
                        className="btn btn-ghost"
                        style={{ padding: '4px', color: 'var(--text-tertiary)' }}
                        title="Remove evidence"
                      >
                        <Trash size={16} />
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      className="input"
                      placeholder="Evidence Title (e.g. ComfyUI Graph Export)"
                      value={ev.title}
                      onChange={(e) => handleEvidenceChange(idx, 'title', e.target.value)}
                    />
                    <select
                      className="input"
                      value={ev.evidence_type}
                      onChange={(e) => handleEvidenceChange(idx, 'evidence_type', e.target.value)}
                    >
                      <option value="PROCESS_SCREENSHOT">Process Screenshot</option>
                      <option value="PROMPT_LOG">Prompt & Seed Log</option>
                      <option value="RAW_PROJECT_FILE">Raw Project / Node File</option>
                      <option value="VIDEO_TIMELAPSE">Screen Recording / Timelapse</option>
                      <option value="MODEL_SEED_RECORD">Model Seed Reference</option>
                    </select>
                  </div>
                  <input
                    type="url"
                    className="input"
                    placeholder="Evidence File URL (https://...)"
                    value={ev.file_url}
                    onChange={(e) => handleEvidenceChange(idx, 'file_url', e.target.value)}
                    style={{ marginBottom: '8px' }}
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={ev.request_verification}
                      onChange={(e) => handleEvidenceChange(idx, 'request_verification', e.target.checked)}
                    />
                    <ShieldCheck size={16} style={{ color: 'var(--accent-lavender)' }} />
                    <span>Submit this evidence for administrative audit to earn verified creator claims</span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div
            style={{
              marginTop: '28px',
              paddingTop: '20px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
            }}
          >
            <button type="button" onClick={onClose} className="btn btn-ghost" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Publishing...' : 'Publish to Portfolio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
