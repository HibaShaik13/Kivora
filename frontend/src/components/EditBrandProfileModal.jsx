import React, { useState } from 'react';
import { api } from '../services/api';

export default function EditBrandProfileModal({ isOpen, onClose, onProfileUpdated, currentProfile }) {
  const [companyName, setCompanyName] = useState(currentProfile?.company_name || '');
  const [slug, setSlug] = useState(currentProfile?.slug || '');
  const [industry, setIndustry] = useState(currentProfile?.industry || 'Luxury Beauty & Skincare');
  const [websiteUrl, setWebsiteUrl] = useState(currentProfile?.website_url || 'https://luminaskincare.com');
  const [logoUrl, setLogoUrl] = useState(currentProfile?.logo_url || '/assets/brands/lumina.png');
  const [description, setDescription] = useState(
    currentProfile?.description || 'Premier organic skincare brand creating cinematic commercial campaigns.'
  );
  const [companySize, setCompanySize] = useState(currentProfile?.company_size || '50-200');
  const [headquarters, setHeadquarters] = useState(currentProfile?.headquarters || 'Paris, France');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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

          <div>
            <label className="label-form">Brand Logo URL</label>
            <input
              type="text"
              className="input-text w-full"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="/assets/brands/logo.png"
            />
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
