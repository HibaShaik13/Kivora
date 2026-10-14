import React, { useState } from 'react';
import { api } from '../services/api';

export default function EditBrandProfileModal({ isOpen, onClose, onProfileUpdated, currentProfile }) {
  const [companyName, setCompanyName] = useState(currentProfile?.company_name || '');
  const [slug, setSlug] = useState(currentProfile?.slug || '');
  const [industry, setIndustry] = useState(currentProfile?.industry || 'Luxury Beauty & Skincare');
  const [websiteUrl, setWebsiteUrl] = useState(currentProfile?.website_url || 'https://luminaskincare.com');
  const [logoUrl, setLogoUrl] = useState(currentProfile?.logo_url || '/assets/brands/lumina-skincare.svg');
  const [description, setDescription] = useState(
    currentProfile?.description || 'Premier organic skincare brand creating cinematic commercial campaigns.'
  );
  const [companySize, setCompanySize] = useState(currentProfile?.company_size || '50-200');
  const [headquarters, setHeadquarters] = useState(currentProfile?.headquarters || 'Paris, France');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState(null);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      setLogoUploadError('Logo file size exceeds 15 MB limit.');
      return;
    }
    setIsUploadingLogo(true);
    setLogoUploadError(null);
    try {
      const res = await api.uploadMedia(file, 'brands');
      if (res?.url) {
        setLogoUrl(res.url);
      }
    } catch (err) {
      setLogoUploadError(err.message || 'Failed to upload brand logo.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const payload = {
      company_name: companyName,
      slug: slug.toLowerCase().replace(/[^a-z0-9-_]/g, '-'),
      industry,
      website_url: websiteUrl,
      logo_url: logoUrl,
      description,
      company_size: companySize,
      headquarters,
    };

    try {
      const updated = await api.setupBrandProfile(payload);
      if (onProfileUpdated) onProfileUpdated(updated);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update brand profile.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container glass-panel max-w-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.96), rgba(255,255,255,0.96)), url(/assets/backgrounds/brand-dashboard.jpg)',
          backgroundSize: 'cover',
        }}
      >
        <div className="modal-header">
          <div>
            <span className="badge-editorial">
              <span className="badge-dot" />
              BRAND PASSPORT
            </span>
            <h2 className="modal-title">Edit Brand Organization</h2>
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
              <label className="label-form">Company Name *</label>
              <input
                type="text"
                className="input-text w-full"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Lumina Skincare"
                required
              />
            </div>
            <div>
              <label className="label-form">Brand Handle / Slug *</label>
              <input
                type="text"
                className="input-text w-full"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="lumina-skincare"
                required
              />
            </div>
          </div>

          <div>
            <label className="label-form">Company Bio / Narrative</label>
            <textarea
              className="input-text w-full"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell creators about your brand aesthetic, values, and creative standards."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-form">Industry</label>
              <input
                type="text"
                className="input-text w-full"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Luxury Skincare / Fashion"
              />
            </div>
            <div>
              <label className="label-form">Company Size</label>
              <select
                className="input-text w-full"
                value={companySize}
                onChange={(e) => setCompanySize(e.target.value)}
              >
                <option value="1-10">1-10 Employees (Boutique)</option>
                <option value="11-50">11-50 Employees (Growth)</option>
                <option value="50-200">50-200 Employees (Scale)</option>
                <option value="200-1000">200-1000 Employees (Enterprise)</option>
                <option value="1000+">1000+ Employees (Global Corp)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-form">Headquarters Location</label>
              <input
                type="text"
                className="input-text w-full"
                value={headquarters}
                onChange={(e) => setHeadquarters(e.target.value)}
                placeholder="e.g. Paris, France"
              />
            </div>
            <div>
              <label className="label-form">Website URL</label>
              <input
                type="url"
                className="input-text w-full"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://company.com"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-black/10 bg-white/70 space-y-3">
            <label className="label-form block mb-1">Brand Identity / Logo</label>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="w-14 h-14 rounded-xl overflow-hidden border border-black/10 bg-[#FAF7F2] flex items-center justify-center p-1.5 shadow-sm">
                <img
                  src={logoUrl || '/assets/brands/lumina-skincare.svg'}
                  alt="Brand logo preview"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/assets/brands/lumina-skincare.svg';
                  }}
                />
              </div>
              <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
                <div className="flex items-center gap-2">
                  <label className="btn-secondary text-xs cursor-pointer py-1.5 px-3">
                    {isUploadingLogo ? 'Uploading...' : '📁 Upload Brand Logo'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      disabled={isUploadingLogo}
                    />
                  </label>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="text-xs text-red-600 hover:underline px-2 py-1"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  className="input-text text-xs w-full py-1"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="/assets/brand-identities/... or /uploads/..."
                />
              </div>
            </div>
            {logoUploadError && (
              <p className="text-xs text-red-600">{logoUploadError}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/10">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Brand Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
