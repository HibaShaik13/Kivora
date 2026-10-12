import React, { useState, useEffect, useMemo } from 'react';
import { briefService } from '../services/briefService';

export default function BriefsExplorer({ onSelectBrief, onOpenAiBuilder }) {
  const [allBriefs, setAllBriefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [maxBudget, setMaxBudget] = useState(10000);
  const [selectedProjectTypes, setSelectedProjectTypes] = useState([]);
  const [selectedTimelines, setSelectedTimelines] = useState([]);

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

  const handleCategoryChange = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const handleProjectTypeChange = (projectType) => {
    setSelectedProjectTypes((prev) =>
      prev.includes(projectType) ? prev.filter((pt) => pt !== projectType) : [...prev, projectType]
    );
  };

  const handleTimelineChange = (timeline) => {
    setSelectedTimelines((prev) =>
      prev.includes(timeline) ? prev.filter((tl) => tl !== timeline) : [...prev, timeline]
    );
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setMaxBudget(10000);
    setSelectedProjectTypes([]);
    setSelectedTimelines([]);
  };

  const loadBriefs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await briefService.getBriefs();
      setAllBriefs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load briefs:', err);
      setError(err.message || 'Failed to load campaign briefs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBriefs();
  }, []);

  // Category matching logic
  const matchesCategory = (b, selectedCats) => {
    if (!selectedCats || selectedCats.length === 0) return true;
    const title = (b.title || '').toLowerCase();
    const ctype = (b.content_type || '').toLowerCase();
    const mood = (b.creative_style_mood || '').toLowerCase();
    const obj = (b.campaign_objective || '').toLowerCase();

    return selectedCats.some((cat) => {
      const catL = cat.toLowerCase();
      if (catL === 'video & animation') {
        return (
          ctype === 'video' ||
          ctype === 'animation' ||
          ctype.includes('video') ||
          ctype.includes('animation') ||
          title.includes('video') ||
          title.includes('animation') ||
          title.includes('film') ||
          title.includes('motion') ||
          title.includes('teaser') ||
          mood.includes('motion') ||
          obj.includes('video')
        );
      }
      if (catL === 'product visualization') {
        return (
          ctype === 'product_viz' ||
          ctype.includes('product') ||
          ctype.includes('viz') ||
          title.includes('product') ||
          title.includes('render') ||
          title.includes('glass') ||
          title.includes('serum') ||
          obj.includes('product')
        );
      }
      if (catL === 'digital art') {
        return (
          ctype === 'image' ||
          ctype === 'animation' ||
          ctype === 'concept_art' ||
          title.includes('art') ||
          title.includes('digital') ||
          title.includes('cyberpunk') ||
          title.includes('silk') ||
          title.includes('render') ||
          mood.includes('digital') ||
          mood.includes('art')
        );
      }
      if (catL === 'brand campaign') {
        return (
          title.includes('campaign') ||
          title.includes('launch') ||
          title.includes('commercial') ||
          title.includes('reveal') ||
          title.includes('ad series') ||
          obj.includes('commercial') ||
          obj.includes('campaign') ||
          obj.includes('launch') ||
          !!b.brand?.company_name
        );
      }
      if (catL === 'concept design') {
        return (
          ctype === 'concept_art' ||
          ctype.includes('concept') ||
          title.includes('concept') ||
          title.includes('spatial') ||
          title.includes('cockpit') ||
          title.includes('explainer') ||
          mood.includes('matte') ||
          obj.includes('concept')
        );
      }
      if (catL === 'illustration') {
        return (
          ctype === 'image' ||
          ctype === 'concept_art' ||
          title.includes('still') ||
          title.includes('illustration') ||
          title.includes('concept') ||
          obj.includes('still')
        );
      }
      return ctype.includes(catL) || title.includes(catL) || mood.includes(catL);
    });
  };

  // Project Type matching logic
  const matchesProjectType = (b, selectedPTs) => {
    if (!selectedPTs || selectedPTs.length === 0) return true;
    const reqs = (b.commercial_use_requirements || '').toLowerCase();
    const channels = (b.usage_channels || '').toLowerCase();

    return selectedPTs.some((pt) => {
      const ptL = pt.toLowerCase();
      if (ptL.includes('buyout') || ptL.includes('commercial')) {
        return reqs.includes('buyout') || reqs.includes('commercial') || reqs.includes('ownership');
      }
      if (ptL.includes('non-exclusive') || ptL.includes('digital')) {
        return (
          reqs.includes('non-exclusive') ||
          reqs.includes('digital') ||
          reqs.includes('social') ||
          channels.includes('digital') ||
          channels.includes('social')
        );
      }
      if (ptL.includes('editorial') || ptL.includes('license')) {
        return (
          reqs.includes('editorial') ||
          reqs.includes('license') ||
          reqs.includes('licensing') ||
          reqs.includes('pr') ||
          reqs.includes('rights')
        );
      }
      return reqs.includes(ptL) || channels.includes(ptL);
    });
  };

  // Timeline matching logic
  const matchesTimeline = (b, selectedTLs, refTime) => {
    if (!selectedTLs || selectedTLs.length === 0) return true;
    if (!b.deadline) return true;

    const deadlineTime = new Date(b.deadline).getTime();
    const diffTime = deadlineTime - refTime;
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return selectedTLs.some((tl) => {
      if (tl.includes('< 7') || tl.toLowerCase().includes('rush')) {
        return daysLeft <= 7;
      }
      if (tl.includes('14') || tl.toLowerCase().includes('standard')) {
        return daysLeft > 7 && daysLeft <= 14;
      }
      if (tl.includes('30+') || tl.toLowerCase().includes('extended')) {
        return daysLeft > 14;
      }
      return true;
    });
  };

  // Combine filters reactively
  const filteredBriefs = useMemo(() => {
    const nowMs = Date.now();
    return allBriefs.filter((b) => {
      // Exclude draft, closed or otherwise ineligible briefs
      if (b.status && b.status.toUpperCase() !== 'PUBLISHED') {
        return false;
      }

      // Search keyword filter
      if (searchQuery.trim()) {
        const term = searchQuery.trim().toLowerCase();
        const matchesSearch =
          (b.title || '').toLowerCase().includes(term) ||
          (b.campaign_objective || '').toLowerCase().includes(term) ||
          (b.creative_style_mood || '').toLowerCase().includes(term) ||
          (b.brand?.company_name || '').toLowerCase().includes(term) ||
          (b.content_type || '').toLowerCase().includes(term);
        if (!matchesSearch) return false;
      }

      // Budget filter
      if (maxBudget !== undefined && maxBudget !== null) {
        if (Number(b.budget_amount || 0) > Number(maxBudget)) {
          return false;
        }
      }

      // Category filter
      if (!matchesCategory(b, selectedCategories)) {
        return false;
      }

      // Project type filter
      if (!matchesProjectType(b, selectedProjectTypes)) {
        return false;
      }

      // Timeline filter
      if (!matchesTimeline(b, selectedTimelines, nowMs)) {
        return false;
      }

      return true;
    });
  }, [allBriefs, searchQuery, maxBudget, selectedCategories, selectedProjectTypes, selectedTimelines]);

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
                    onChange={() => handleCategoryChange(cat)}
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
                  <input
                    type="checkbox"
                    checked={selectedProjectTypes.includes(pt)}
                    onChange={() => handleProjectTypeChange(pt)}
                    className="custom-checkbox"
                  />
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
                  <input
                    type="checkbox"
                    checked={selectedTimelines.includes(tl)}
                    onChange={() => handleTimelineChange(tl)}
                    className="custom-checkbox"
                  />
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
        ) : filteredBriefs.length === 0 ? (
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
            {filteredBriefs.map((brief, idx) => (
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
