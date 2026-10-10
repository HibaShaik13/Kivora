import React, { useState } from 'react';
import { api } from '../services/api';

export default function AddProjectModal({ isOpen, onClose, onProjectSaved, existingProject = null }) {
  const isEditing = Boolean(existingProject);

  const [title, setTitle] = useState(existingProject?.title || '');
  const [description, setDescription] = useState(existingProject?.description || '');
  const [contentType, setContentType] = useState(existingProject?.content_type || 'VIDEO');
  const [primaryAssetUrl, setPrimaryAssetUrl] = useState(
    existingProject?.primary_asset_url || '/assets/portfolio/elena_cyberpunk_tokyo.mp4'
  );
  const [thumbnailUrl, setThumbnailUrl] = useState(
    existingProject?.thumbnail_url || '/assets/portfolio/elena_cyberpunk_tokyo_thumb.jpg'
  );
  const [aspectRatio, setAspectRatio] = useState(existingProject?.aspect_ratio || '16:9');
  const [resolution, setResolution] = useState(existingProject?.resolution || '3840x2160');
  const [durationSeconds, setDurationSeconds] = useState(existingProject?.duration_seconds || 15);
  const [commercialRightsHeld, setCommercialRightsHeld] = useState(
    existingProject?.commercial_rights_held !== undefined ? existingProject.commercial_rights_held : true
  );
  const [commercialLicenseType, setCommercialLicenseType] = useState(
    existingProject?.commercial_license_type || 'COMMERCIAL_BUYOUT'
  );
  const [featured, setFeatured] = useState(existingProject?.featured || false);

  // Workflow steps
  const [workflowSteps, setWorkflowSteps] = useState(
    existingProject?.workflow_steps?.length
      ? existingProject.workflow_steps
      : [
          {
            step_order: 1,
            stage_name: 'Concept & Prompt Architecture',
            tools_used: 'Midjourney v6.1 & Claude 3.5 Sonnet',
            description: 'Structured multi-pass prompt matrix with lighting, camera optics, and material seeds.',
            parameters_snippet: '{"cfg_scale": 6.5, "sampler": "Euler A", "steps": 30, "seed": 849204}',
          },
          {
            step_order: 2,
            stage_name: 'Temporal Video Synthesis',
            tools_used: 'Runway Gen-3 Alpha',
            description: 'Interpolated keyframes with continuous pan-right camera trajectory at 24fps.',
            parameters_snippet: '{"motion_bucket": 127, "camera_pan": "+15 deg", "fps": 24}',
          },
          {
            step_order: 3,
            stage_name: 'Master Upscaling & Grading',
            tools_used: 'Topaz Video AI & DaVinci Resolve',
            description: '4K ProRes render pass with balanced film grain and color consistency.',
            parameters_snippet: '{"upscale_factor": 4, "denoise": 15, "codec": "ProRes 4444"}',
          },
        ]
  );

  // Evidence records
  const [evidenceRecords, setEvidenceRecords] = useState(
    existingProject?.evidence_records?.length
      ? existingProject.evidence_records
      : [
          {
            title: 'Node Graph / Pipeline Schematic',
            evidence_type: 'WORKFLOW_NODE_GRAPH',
            file_url: '/assets/evidence/elena_comfy_node_tree.png',
            description: 'Exported pipeline schema verifying reproducibility and tool chain parameters.',
            request_verification: true,
          },
        ]
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleStepChange = (index, field, value) => {
    const updated = [...workflowSteps];
    updated[index] = { ...updated[index], [field]: value };
    setWorkflowSteps(updated);
  };

  const handleAddStep = () => {
    setWorkflowSteps([
      ...workflowSteps,
      {
        step_order: workflowSteps.length + 1,
        stage_name: `Step ${workflowSteps.length + 1}`,
        tools_used: 'AI Generative Tool',
        description: '',
        parameters_snippet: '',
      },
    ]);
  };

  const handleRemoveStep = (index) => {
    setWorkflowSteps(workflowSteps.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const payload = {
      title,
      description,
      content_type: contentType,
      primary_asset_url: primaryAssetUrl,
      thumbnail_url: thumbnailUrl,
      aspect_ratio: aspectRatio,
      resolution,
      duration_seconds: contentType === 'IMAGE' ? null : parseInt(durationSeconds, 10) || null,
      commercial_rights_held: commercialRightsHeld,
      commercial_license_type: commercialLicenseType,
      featured,
      workflow_steps: workflowSteps.map((s, idx) => ({
        ...s,
        step_order: idx + 1,
      })),
      evidence_records: evidenceRecords,
    };

    try {
      let savedProject;
      if (isEditing) {
        savedProject = await api.updatePortfolioProject(existingProject.id, payload);
      } else {
        savedProject = await api.addPortfolioProject(payload);
      }
      if (onProjectSaved) onProjectSaved(savedProject);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save portfolio project.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container glass-panel max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.95), rgba(255,255,255,0.95)), url(/assets/backgrounds/edit-profile.jpg)',
          backgroundSize: 'cover',
        }}
      >
        <div className="modal-header">
          <div>
            <span className="badge-editorial">
              <span className="badge-dot" />
              {isEditing ? 'UPDATE PROJECT' : 'NEW PORTFOLIO ENTRY'}
            </span>
            <h2 className="modal-title">{isEditing ? 'Edit Portfolio Project' : 'Publish Masterpiece'}</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && (
          <div className="banner-error mb-4" style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: '#FEE2E2', color: '#991B1B' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-form">Project Title *</label>
              <input
                type="text"
                className="input-text w-full"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Cyberpunk Tokyo 2099 Cinematic"
                required
              />
            </div>
            <div>
              <label className="label-form">Content Type *</label>
              <select
                className="input-text w-full"
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
              >
                <option value="VIDEO">Video</option>
                <option value="IMAGE">Image</option>
                <option value="ANIMATION">Animation</option>
                <option value="3D_MODEL">3D Model / NeRF</option>
                <option value="INTERACTIVE">Interactive / Real-time</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label-form">Project Narrative / Description</label>
            <textarea
              className="input-text w-full"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the aesthetic concept, creative intent, and production challenge."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-form">Primary Asset URL / Video *</label>
              <input
                type="text"
                className="input-text w-full"
                value={primaryAssetUrl}
                onChange={(e) => setPrimaryAssetUrl(e.target.value)}
                placeholder="/assets/portfolio/my_asset.mp4"
                required
              />
            </div>
            <div>
              <label className="label-form">Cover Thumbnail URL</label>
              <input
                type="text"
                className="input-text w-full"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="/assets/portfolio/my_thumb.jpg"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label-form">Aspect Ratio</label>
              <select
                className="input-text w-full"
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
              >
                <option value="16:9">16:9 (Landscape)</option>
                <option value="9:16">9:16 (Vertical)</option>
                <option value="1:1">1:1 (Square)</option>
                <option value="4:5">4:5 (Portrait)</option>
                <option value="21:9">21:9 (Cinematic)</option>
              </select>
            </div>
            <div>
              <label className="label-form">Resolution</label>
              <input
                type="text"
                className="input-text w-full"
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="3840x2160"
              />
            </div>
            <div>
              <label className="label-form">Duration (Sec)</label>
              <input
                type="number"
                className="input-text w-full"
                value={durationSeconds}
                onChange={(e) => setDurationSeconds(e.target.value)}
                disabled={contentType === 'IMAGE'}
                min={1}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-form">Commercial License Type</label>
              <select
                className="input-text w-full"
                value={commercialLicenseType}
                onChange={(e) => setCommercialLicenseType(e.target.value)}
              >
                <option value="COMMERCIAL_BUYOUT">Full Commercial Buyout</option>
                <option value="NON_COMMERCIAL">Non-Commercial / Portfolio Only</option>
                <option value="EDITORIAL_ONLY">Editorial Use Only</option>
                <option value="CC_BY">Creative Commons (CC-BY)</option>
              </select>
            </div>
            <div className="flex items-center gap-4 pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                <input
                  type="checkbox"
                  checked={commercialRightsHeld}
                  onChange={(e) => setCommercialRightsHeld(e.target.checked)}
                />
                Commercial Rights Held
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                />
                Featured Highlight
              </label>
            </div>
          </div>

          {/* Workflow Steps Section */}
          <div className="pt-3 border-t border-black/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
                ⚡ ProofGraph Workflow Steps ({workflowSteps.length})
              </span>
              <button
                type="button"
                className="link-arrow-btn text-xs"
                onClick={handleAddStep}
              >
                + Add Stage
              </button>
            </div>
            <div className="space-y-2">
              {workflowSteps.map((step, idx) => (
                <div key={idx} className="p-2.5 rounded-lg border border-black/5 bg-white/70 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">Stage {idx + 1}</span>
                    {workflowSteps.length > 1 && (
                      <button
                        type="button"
                        className="text-xs text-red-500 hover:underline"
                        onClick={() => handleRemoveStep(idx)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      className="input-text text-xs"
                      placeholder="Stage Name (e.g. Prompt Architecture)"
                      value={step.stage_name}
                      onChange={(e) => handleStepChange(idx, 'stage_name', e.target.value)}
                    />
                    <input
                      type="text"
                      className="input-text text-xs"
                      placeholder="Tools Used (e.g. ComfyUI, Runway)"
                      value={step.tools_used}
                      onChange={(e) => handleStepChange(idx, 'tools_used', e.target.value)}
                    />
                  </div>
                  <input
                    type="text"
                    className="input-text text-xs w-full"
                    placeholder="Brief description of parameters & technique"
                    value={step.description}
                    onChange={(e) => handleStepChange(idx, 'description', e.target.value)}
                  />
                  <input
                    type="text"
                    className="input-text text-xs font-mono w-full"
                    placeholder='Parameters JSON snippet (e.g. {"seed": 1234, "cfg": 7})'
                    value={step.parameters_snippet || ''}
                    onChange={(e) => handleStepChange(idx, 'parameters_snippet', e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/10">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Saving Project...' : isEditing ? 'Save Changes' : 'Publish Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
