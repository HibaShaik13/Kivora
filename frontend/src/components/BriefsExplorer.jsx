import React, { useState, useEffect } from 'react';
import { briefService } from '../services/briefService';

export default function BriefsExplorer({ onSelectBrief, onOpenAiBuilder }) {
  const [briefs, setBriefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [maxBudget, setMaxBudget] = useState(10000);

  // Sidebar accordion states
  const [openSections, setOpenSections] = useState({
    category: true,
    budget: true,
    projectType: true,
    timeline: true,
  });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCheckboxChange = (category) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const loadBriefs = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (searchQuery) params.search = searchQuery;
      const data = await briefService.getBriefs(params);
      let filtered = data || [];

      if (selectedCategories.length > 0) {
        filtered = filtered.filter((b) =>
          selectedCategories.some(
            (cat) =>
              b.content_type?.toLowerCase().includes(cat.toLowerCase()) ||
              b.title?.toLowerCase().includes(cat.toLowerCase()) ||
              b.creative_style_mood?.toLowerCase().includes(cat.toLowerCase())
          )
        );
      }

      setBriefs(filtered);
    } catch (err) {
      setError(err.message || 'Failed to load briefs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBriefs();
  }, [searchQuery, selectedCategories]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
  };

  // Helper to pick a high-quality campaign thumbnail
  const getBriefThumbnail = (brief, idx) => {
    const defaultThumbs = [
      '/assets/portfolio/sophia_cellular_dew_thumb.jpg',
      '/assets/portfolio/marcus_aura_droplet_thumb.jpg',
      '/assets/portfolio/solaris_anomaly_thumb.jpg',
      '/assets/portfolio/maya_liquid_organza_thumb.jpg',
      '/assets/portfolio/hassan_apex_gt_thumb.jpg',
      '/assets/portfolio/kai_neon_samurai_thumb.jpg',
    ];
    return defaultThumbs[idx % defaultThumbs.length];
  };

  return (
    <div className="kivora-discovery-layout">
      {/* Left Filter Sidebar */}
      <aside className="kivora-filter-sidebar glass-panel">
        {/* Search Box */}
        <div className="sidebar-search-box">
          <span className="search-mag-icon">🔍</span>
          <input
            type="text"
            placeholder="Search briefs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sidebar-search-input"
          />
        </div>

        {/* Section 1: Category */}
        <div className="filter-accordion-group">
          <button
            type="button"
            className="filter-accordion-header"
            onClick={() => toggleSection('category')}
          >
            <span>Category</span>
            <span className="accordion-chevron">{openSections.category ? '∧' : '∨'}</span>
          </button>
          {openSections.category && (
            <div className="filter-checkbox-list">
              {[
                'Brand Campaign',
                'Digital Art',
                'Product Visualization',
                'Video & Animation',
                'Illustration',
                'Concept Design',
              ].map((cat) => (
                <label key={cat} className="filter-checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat)}
                    onChange={() => handleCheckboxChange(cat)}
                    className="custom-checkbox"
                  />
                  <span>{cat}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Budget Range */}
        <div className="filter-accordion-group">
          <button
            type="button"
            className="filter-accordion-header"
            onClick={() => toggleSection('budget')}
          >
            <span>Budget Range</span>
            <span className="accordion-chevron">{openSections.budget ? '∧' : '∨'}</span>
          </button>
          {openSections.budget && (
            <div className="filter-range-block">
              <input
                type="range"
                min="1000"
                max="10000"
                step="500"
                value={maxBudget}
                onChange={(e) => setMaxBudget(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-neutral-500 mt-1 font-mono">
                <span>$1,000</span>
                <span className="font-bold text-purple-700">Up to ${maxBudget.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Project Type */}
        <div className="filter-accordion-group">
          <button
            type="button"
            className="filter-accordion-header"
            onClick={() => toggleSection('projectType')}
          >
            <span>Project Type</span>
            <span className="accordion-chevron">{openSections.projectType ? '∧' : '∨'}</span>
          </button>
          {openSections.projectType && (
            <div className="filter-checkbox-list">
              {['Commercial Buyout', 'Non-Exclusive Digital', 'Editorial License'].map((pt) => (
                <label key={pt} className="filter-checkbox-label">
                  <input type="checkbox" className="custom-checkbox" />
                  <span>{pt}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Section 4: Timeline */}
        <div className="filter-accordion-group">
          <button
            type="button"
            className="filter-accordion-header"
            onClick={() => toggleSection('timeline')}
          >
            <span>Timeline</span>
            <span className="accordion-chevron">{openSections.timeline ? '∧' : '∨'}</span>
          </button>
          {openSections.timeline && (
            <div className="filter-checkbox-list">
              {['< 7 Days (Rush)', '14 Days Standard', '30+ Days Extended'].map((tl) => (
                <label key={tl} className="filter-checkbox-label">
                  <input type="checkbox" className="custom-checkbox" />
                  <span>{tl}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* AI Brief Builder Quick Button in Sidebar */}
        <button
          type="button"
          className="btn btn-ai w-full mt-6 text-xs flex items-center justify-center gap-1.5"
          onClick={onOpenAiBuilder}
        >
          <span>✨</span> Generate Brief with AI
        </button>
      </aside>

      {/* Right Main Grid Area */}
      <main className="kivora-discovery-main">
        {/* Headline Row */}
        <div>
          <span className="badge-editorial mb-2">
            <span className="badge-dot" />
            LATEST BRIEFS
          </span>
          <div className="discovery-headline-row">
            <h2 className="discovery-main-title">
              Briefs waiting for the right hands.
            </h2>
            <button
              type="button"
              className="view-all-link-btn"
              onClick={handleResetFilters}
            >
              View all briefs <span className="arrow-inline">→</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="kivora-loading-card glass-panel">
            <div className="spinner-ring" />
            <p>Loading active campaign briefs...</p>
          </div>
        ) : error ? (
          <div className="kivora-error-card glass-panel">
            <p className="text-red">Error: {error}</p>
            <button className="btn btn-secondary btn-sm" onClick={loadBriefs}>
              Retry
            </button>
          </div>
        ) : briefs.length === 0 ? (
          <div className="kivora-empty-card glass-panel">
            <div className="empty-icon text-3xl">📋</div>
            <h3 className="font-serif text-lg font-bold">No campaign briefs found</h3>
            <p className="text-xs text-neutral-500">Try clearing selected filters or generate a brief with AI.</p>
            <button className="btn btn-primary btn-sm mt-3" onClick={handleResetFilters}>
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="kivora-briefs-card-grid">
            {briefs.map((brief, idx) => (
              <div
                key={brief.id}
                className="kivora-brief-card glass-panel"
                onClick={() => onSelectBrief(brief)}
              >
                {/* Brief Image Thumbnail */}
                <div className="brief-card-thumb-wrap">
                  <img
                    src={getBriefThumbnail(brief, idx)}
                    alt={brief.title}
                    className="brief-card-img"
                  />
                  <button
                    type="button"
                    className="brief-favorite-btn"
                    onClick={(e) => e.stopPropagation()}
                  >
                    ♡
                  </button>
                  <span className="brief-format-overlay-pill">
                    {brief.aspect_ratio || '16:9'}
                  </span>
                </div>

                {/* Brief Details */}
                <div className="brief-card-body-content">
                  <span className="brief-brand-slug">
                    {brief.brand?.company_name || 'LUMINA SKINCARE'}
                  </span>
                  <h3 className="brief-card-heading">{brief.title}</h3>
                  <p className="brief-card-desc-snippet">{brief.campaign_objective}</p>

                  {/* Tag chips */}
                  <div className="brief-card-pills-row">
                    <span className="mini-tag-pill">{brief.content_type || 'Video'}</span>
                    <span className="mini-tag-pill">{brief.resolution_min || '4K UHD'}</span>
                    {brief.creative_style_mood && (
                      <span className="mini-tag-pill">
                        {brief.creative_style_mood.split(',')[0]}
                      </span>
                    )}
                  </div>

                  {/* Footer Row */}
                  <div className="brief-card-bottom-bar">
                    <span className="brief-card-deadline-budget">
                      Deadline: {brief.deadline ? new Date(brief.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '14 Nov 2026'} • ${brief.budget_amount?.toLocaleString() || '3,500'}
                    </span>
                    <button
                      type="button"
                      className="card-arrow-circle-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectBrief(brief);
                      }}
                    >
                      ↗
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
