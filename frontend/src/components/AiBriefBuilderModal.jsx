import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { getCurrentUser } from '../services/authService';

export default function AiBriefBuilderModal({ isOpen, onClose, onBriefCreated }) {
  const [step, setStep] = useState('prompt'); // 'prompt' | 'review'
  const [prompt, setPrompt] = useState('');
  const [brandIndustry, setBrandIndustry] = useState('Skincare & Beauty');
  const [targetBudget, setTargetBudget] = useState('5000');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState(null);
  const [generatedBrief, setGeneratedBrief] = useState(null);

  // Reference Asset Image Upload State
  const [uploadedImage, setUploadedImage] = useState(null); // { url, filename, size }
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      api.getCategories().then((cats) => {
        setCategories(cats || []);
        if (cats && cats.length > 0 && !selectedCategoryId) {
          const defaultCat = cats.find((c) => c.slug === 'beauty-skincare') || cats[0];
          setSelectedCategoryId(defaultCat.id);
        }
      }).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentUser = getCurrentUser();

  const handleImageFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate MIME type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Invalid file type. Please select a PNG, JPG, WEBP, or GIF image.');
      return;
    }

    // Validate size (25MB max)
    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError('File exceeds maximum allowed size (25MB limit).');
      return;
    }

    setIsUploadingImage(true);
    setUploadError(null);

    try {
      const res = await api.uploadMedia(file, 'briefs');
      if (res && res.url) {
        setUploadedImage({
          url: res.url,
          filename: file.name,
          size: file.size,
        });
        if (generatedBrief) {
          setGeneratedBrief((prev) => ({
            ...prev,
            reference_asset_url: res.url,
            cover_image_url: res.url,
          }));
        }
      } else {
        throw new Error('Upload response missing file URL.');
      }
    } catch (err) {
      console.error('Error uploading reference asset:', err);
      setUploadError(err.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setUploadError(null);
    if (generatedBrief) {
      setGeneratedBrief((prev) => ({
        ...prev,
        reference_asset_url: null,
        cover_image_url: null,
      }));
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || prompt.length < 10) {
      setError('Prompt must be at least 10 characters long.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.generateAiBrief({
        raw_prompt: prompt,
        brand_industry: brandIndustry || undefined,
        target_budget: targetBudget ? parseFloat(targetBudget) : undefined,
      });

      setGeneratedBrief({
        ...response,
        budget_amount: response.budget_amount || (targetBudget ? parseFloat(targetBudget) : 35000),
        budget_currency: response.budget_currency || 'INR',
        status: 'PUBLISHED',
        reference_asset_url: uploadedImage?.url || response.reference_asset_url || null,
        cover_image_url: uploadedImage?.url || response.cover_image_url || null,
      });
      setStep('review');
    } catch (err) {
      setError(err.message || 'Failed to generate brief. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setGeneratedBrief((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePublish = async () => {
    if (!currentUser || currentUser.role !== 'BRAND') {
      setError('You must be logged in as a verified BRAND to publish briefs.');
      return;
    }

    setIsPublishing(true);
    setError(null);

    try {
      const finalAssetUrl = uploadedImage?.url || generatedBrief.reference_asset_url || generatedBrief.cover_image_url || null;

      const payload = {
        title: generatedBrief.title,
        campaign_objective: generatedBrief.campaign_objective,
        target_audience: generatedBrief.target_audience,
        content_type: generatedBrief.content_type,
        creative_style_mood: generatedBrief.creative_style_mood,
        aspect_ratio: generatedBrief.aspect_ratio || '16:9',
        duration_seconds_min: generatedBrief.duration_seconds_min || 15,
        duration_seconds_max: generatedBrief.duration_seconds_max || 60,
        resolution_min: generatedBrief.resolution_min || '4K UHD',
        deliverables_description: generatedBrief.deliverables_description,
        revision_allowance: generatedBrief.revision_allowance || 2,
        budget_amount: parseFloat(generatedBrief.budget_amount),
        budget_currency: generatedBrief.budget_currency || 'INR',
        deadline_days: 21,
        commercial_use_requirements: generatedBrief.commercial_use_requirements || 'Full commercial rights',
        usage_channels: generatedBrief.usage_channels || 'Digital & Social Media',
        usage_duration: generatedBrief.usage_duration || '12 Months',
        usage_territories: generatedBrief.usage_territories || 'Worldwide',
        restrictions_and_guidelines: generatedBrief.restrictions_and_guidelines || 'No competitor logos',
        disclosure_requirements: generatedBrief.disclosure_requirements || 'Must state AI Assisted Production',
        reference_asset_url: finalAssetUrl,
        cover_image_url: finalAssetUrl,
        status: 'PUBLISHED',
        category_ids: selectedCategoryId ? [selectedCategoryId] : [],
        required_skill_ids: [],
        required_tool_ids: [],
      };

      const result = await api.createBrief(payload);
      if (onBriefCreated) onBriefCreated(result);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to publish brief.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div className="modal-container max-w-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <span className="badge-ai text-sm px-3 py-1 font-mono">✦ AI CAMPAIGN ARCHITECT</span>
            <h2 className="text-xl font-bold text-white">AI Brief Builder</h2>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Close modal">✕</button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="banner-error mb-4">
              <span className="font-semibold">Notice:</span> {error}
            </div>
          )}

          {/* Shared Reference Image Upload Component */}
          <div className="mb-4 p-4 rounded-xl border border-purple-500/20 bg-purple-950/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-purple-200 uppercase tracking-wider flex items-center gap-1.5">
                <span>🖼</span>
                <span>Campaign Reference / Moodboard Image</span>
              </span>
              {uploadedImage && (
                <span className="text-xs text-emerald-400 font-mono">
                  ✓ Uploaded & Attached
                </span>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={handleImageFileSelect}
            />

            {uploadError && (
              <p className="text-xs text-red-400 mb-2 font-medium">{uploadError}</p>
            )}

            {uploadedImage ? (
              <div className="flex items-center gap-4 bg-white/5 p-3 rounded-lg border border-white/10">
                <img
                  src={uploadedImage.url}
                  alt="Reference Preview"
                  className="w-16 h-16 rounded-lg object-cover border border-purple-400/40 shadow-sm shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate">
                    {uploadedImage.filename}
                  </p>
                  <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                    {(uploadedImage.size / 1024).toFixed(1)} KB • Persistent Server Asset
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="px-2.5 py-1 text-xs rounded bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-400/30 transition"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="px-2.5 py-1 text-xs rounded bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-400/30 transition"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-purple-400/30 hover:border-purple-400/60 rounded-lg p-4 text-center cursor-pointer transition bg-white/[0.02] hover:bg-purple-500/[0.04]"
              >
                {isUploadingImage ? (
                  <div className="flex items-center justify-center gap-2 text-xs text-purple-200">
                    <div className="spinner-sm" />
                    <span>Uploading and validating image asset...</span>
                  </div>
                ) : (
                  <div>
                    <span className="text-xl block mb-1">📸</span>
                    <p className="text-xs font-semibold text-purple-200">
                      Click to upload campaign reference or product moodboard
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      PNG, JPG, or WEBP up to 25MB • Saved directly with this brief
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {step === 'prompt' ? (
            <form onSubmit={handleGenerate} className="space-y-4">
              <p className="text-sm text-neutral-300">
                Transform rough ideas, creative hooks, or product descriptions into commercial-grade campaign specifications in seconds using multimodal AI analysis.
              </p>

              <div>
                <label className="label-form">Campaign Concept / Creative Prompt *</label>
                <textarea
                  className="input-textarea h-32"
                  placeholder="e.g. Launching a high-end botanical serum. We need cinematic 4K macro video footage with fluid simulations of droplets and radiant golden light. Target audience is luxury skincare buyers aged 25-45..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-form">Brand Industry</label>
                  <select
                    className="input-select"
                    value={brandIndustry}
                    onChange={(e) => setBrandIndustry(e.target.value)}
                  >
                    <option value="Skincare & Beauty">Skincare & Beauty</option>
                    <option value="Sci-Fi & Film Promotion">Sci-Fi & Film Promotion</option>
                    <option value="Automotive & Luxury Tech">Automotive & Luxury Tech</option>
                    <option value="Fashion & Haute Couture">Fashion & Haute Couture</option>
                    <option value="Beverage & Luxury Goods">Beverage & Luxury Goods</option>
                    <option value="Anime & Gaming Animation">Anime & Gaming Animation</option>
                  </select>
                </div>

                <div>
                  <label className="label-form">Target Budget (INR ₹)</label>
                  <input
                    type="number"
                    className="input-text"
                    placeholder="e.g. 35000 (₹10,000 - ₹49,999)"
                    value={targetBudget}
                    onChange={(e) => setTargetBudget(e.target.value)}
                  />
                </div>
              </div>

              {/* Inspiration Pills */}
              <div>
                <span className="text-xs text-neutral-400 block mb-2">Try quick prompt ideas:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="text-xs bg-surface-2 hover:bg-surface-3 text-neutral-300 px-2.5 py-1.5 rounded border border-white/5 transition"
                    onClick={() => {
                      setPrompt("Cinematic 15-second teaser for Solaris: Deep Space Anomaly. Needs photorealistic alien atmosphere, volumetric fog, and Unreal/ComfyUI camera tracking.");
                      setBrandIndustry("Sci-Fi & Film Promotion");
                      setTargetBudget("6000");
                    }}
                  >
                    🚀 Sci-Fi Film Teaser
                  </button>
                  <button
                    type="button"
                    className="text-xs bg-surface-2 hover:bg-surface-3 text-neutral-300 px-2.5 py-1.5 rounded border border-white/5 transition"
                    onClick={() => {
                      setPrompt("3D photorealistic glass perfume bottle advertisement with amber liquid, subtle caustics, and studio backlight reflection. 1:1 format for e-commerce and socials.");
                      setBrandIndustry("Beverage & Luxury Goods");
                      setTargetBudget("4000");
                    }}
                  >
                    ✨ Luxury Bottle Visual
                  </button>
                  <button
                    type="button"
                    className="text-xs bg-surface-2 hover:bg-surface-3 text-neutral-300 px-2.5 py-1.5 rounded border border-white/5 transition"
                    onClick={() => {
                      setPrompt("Dynamic 30s anime action sequence featuring a futuristic neon samurai running through atmospheric rain. Needs stylized cel-shading and fluid blade trails.");
                      setBrandIndustry("Anime & Gaming Animation");
                      setTargetBudget("5500");
                    }}
                  >
                    ⚡ Neon Cyber Samurai
                  </button>
                </div>
              </div>

              <div className="modal-footer pt-4 border-t border-white/10 flex justify-between items-center">
                <span className="text-xs text-neutral-500 font-mono">
                  Engine: Google Gemini / Deterministic Synthesizer
                </span>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="spinner-sm" />
                      Synthesizing Brief...
                    </>
                  ) : (
                    <>✦ Synthesize Brief with AI</>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-brand-cyan/10 border border-brand-cyan/20 rounded-lg text-xs text-brand-cyan flex items-center justify-between">
                <span>
                  ✓ Generated via <strong>{generatedBrief.generation_engine || 'Synthesizer'}</strong>. Review & edit specifications before posting.
                </span>
                <button
                  type="button"
                  className="text-xs underline hover:text-white"
                  onClick={() => setStep('prompt')}
                >
                  Edit Prompt
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label-form">Campaign Title</label>
                  <input
                    type="text"
                    className="input-text font-semibold text-white"
                    value={generatedBrief.title || ''}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                  />
                </div>

                <div className="col-span-2">
                  <label className="label-form">Campaign Objective</label>
                  <textarea
                    className="input-textarea h-20"
                    value={generatedBrief.campaign_objective || ''}
                    onChange={(e) => handleFieldChange('campaign_objective', e.target.value)}
                  />
                </div>

                <div>
                  <label className="label-form">Target Audience</label>
                  <input
                    type="text"
                    className="input-text"
                    value={generatedBrief.target_audience || ''}
                    onChange={(e) => handleFieldChange('target_audience', e.target.value)}
                  />
                </div>

                <div>
                  <label className="label-form">Content Type</label>
                  <input
                    type="text"
                    className="input-text"
                    value={generatedBrief.content_type || ''}
                    onChange={(e) => handleFieldChange('content_type', e.target.value)}
                  />
                </div>

                <div>
                  <label className="label-form">Creative Style & Mood</label>
                  <input
                    type="text"
                    className="input-text"
                    value={generatedBrief.creative_style_mood || ''}
                    onChange={(e) => handleFieldChange('creative_style_mood', e.target.value)}
                  />
                </div>

                <div>
                  <label className="label-form">Aspect Ratio & Resolution</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      className="input-text"
                      value={generatedBrief.aspect_ratio || '16:9'}
                      onChange={(e) => handleFieldChange('aspect_ratio', e.target.value)}
                    />
                    <input
                      type="text"
                      className="input-text"
                      value={generatedBrief.resolution_min || '4K UHD'}
                      onChange={(e) => handleFieldChange('resolution_min', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="label-form">Budget Amount (INR ₹)</label>
                  <input
                    type="number"
                    className="input-text"
                    value={generatedBrief.budget_amount || 35000}
                    onChange={(e) => handleFieldChange('budget_amount', e.target.value)}
                  />
                </div>

                <div>
                  <label className="label-form">Revisions Allowed</label>
                  <input
                    type="number"
                    className="input-text"
                    value={generatedBrief.revision_allowance || 2}
                    onChange={(e) => handleFieldChange('revision_allowance', e.target.value)}
                  />
                </div>

                <div className="col-span-2">
                  <label className="label-form">Primary Marketplace Category *</label>
                  <select
                    className="input-select"
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                  >
                    <option value="">Select Category...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon || '✦'} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="label-form">Deliverables Description</label>
                  <textarea
                    className="input-textarea h-20"
                    value={generatedBrief.deliverables_description || ''}
                    onChange={(e) => handleFieldChange('deliverables_description', e.target.value)}
                  />
                </div>

                <div className="col-span-2">
                  <label className="label-form">Commercial Rights & Usage</label>
                  <input
                    type="text"
                    className="input-text"
                    value={generatedBrief.commercial_use_requirements || ''}
                    onChange={(e) => handleFieldChange('commercial_use_requirements', e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer pt-4 border-t border-white/10 flex justify-between items-center">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setStep('prompt')}
                >
                  ← Back to Prompt
                </button>

                <div className="flex items-center gap-3">
                  {!currentUser ? (
                    <span className="text-xs text-amber-400">
                      Sign in as Lumina Brand to publish
                    </span>
                  ) : currentUser.role !== 'BRAND' ? (
                    <span className="text-xs text-amber-400">
                      Switch to Brand profile to publish
                    </span>
                  ) : null}

                  <button
                    type="button"
                    onClick={handlePublish}
                    disabled={isPublishing || !currentUser || currentUser.role !== 'BRAND'}
                    className="btn-primary flex items-center gap-2"
                  >
                    {isPublishing ? (
                      <>
                        <div className="spinner-sm" />
                        Publishing to Marketplace...
                      </>
                    ) : (
                      <>Publish Brief to Marketplace →</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
