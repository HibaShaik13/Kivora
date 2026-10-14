import React, { useState, useEffect, useMemo } from 'react';
import { briefService } from '../services/briefService';
import { api } from '../services/api';
import { getCurrentUser } from '../services/authService';
import CategoryCard from './CategoryCard';
import BriefCard from './BriefCard';

export default function BriefsExplorer({
  onSelectBrief,
  onOpenAiBuilder,
  onToggleSaveBrief,
  savedBriefIds: externalSavedBriefIds,
}) {
  const [allBriefs, setAllBriefs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [savedBriefIds, setSavedBriefIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (externalSavedBriefIds) {
      setSavedBriefIds(new Set(externalSavedBriefIds));
      return;
    }
    const user = getCurrentUser();
    if (user && user.role === 'CREATOR') {
      api.getSavedBriefs()
        .then((res) => {
          const items = Array.isArray(res) ? res : (res?.items || []);
          const idSet = new Set(items.map((sb) => sb.brief_id || sb.id));
          setSavedBriefIds(idSet);
        })
        .catch(() => null);
    }
  }, [externalSavedBriefIds]);

  // Category State
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [maxBudget, setMaxBudget] = useState(35000);
  const [selectedProjectTypes, setSelectedProjectTypes] = useState([]);
  const [selectedTimelines, setSelectedTimelines] = useState([]);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Sidebar accordion states
  const [openSections, setOpenSections] = useState({
    categories: true,
    budget: true,
    projectType: true,
    timeline: true,
  });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCategoryCardClick = (cat) => {
    if (selectedCategory?.slug === cat?.slug) {
      setSelectedCategory(null);
      setSelectedSubcategory(null);
    } else {
      setSelectedCategory(cat);
      setSelectedSubcategory(null);
    }
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
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSearchQuery('');
    setMaxBudget(35000);
    setSelectedProjectTypes([]);
    setSelectedTimelines([]);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [briefsData, catsData] = await Promise.all([
        briefService.getBriefs(),
        api.getCategories().catch(() => []),
      ]);
      setAllBriefs(Array.isArray(briefsData) ? briefsData : []);
      setCategories(catsData || []);
    } catch (err) {
      console.error('Failed to load briefs:', err);
      setError(err.message || 'Failed to load campaign briefs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const matchesProjectType = (b, selectedTypes) => {
    if (!selectedTypes || selectedTypes.length === 0) return true;
    const ctype = (b.content_type || '').toUpperCase();
    return selectedTypes.some((pt) => {
      if (pt === 'Cinematic Video (16:9)') return ctype === 'VIDEO' && b.aspect_ratio === '16:9';
      if (pt === 'Social Video (9:16)') return ctype === 'VIDEO' && b.aspect_ratio === '9:16';
      if (pt === '3D / CGI Render') return ctype === '3D_ANIMATION' || ctype.includes('3D') || ctype === 'PRODUCT_VIZ';
      if (pt === 'Editorial Still') return ctype === 'STILL_IMAGE' || ctype === 'IMAGE';
      return false;
    });
  };

  const matchesTimeline = (b, selectedTls, nowMs) => {
    if (!selectedTls || selectedTls.length === 0) return true;
    if (!b.deadline) return true;
    const daysLeft = Math.ceil((new Date(b.deadline).getTime() - nowMs) / (1000 * 60 * 60 * 24));
    return selectedTls.some((tl) => {
      if (tl === '< 7 Days (Rush)') return daysLeft > 0 && daysLeft <= 7;
      if (tl === '14 Days Standard') return daysLeft > 7 && daysLeft <= 14;
      if (tl === '30+ Days Extended') return daysLeft > 14;
      return false;
    });
  };

  const filteredBriefs = useMemo(() => {
    const nowMs = Date.now();
    return allBriefs.filter((b) => {
      // Exclude non-published briefs from public explorer
      if (b.status && b.status !== 'PUBLISHED') return false;

      // 1. Category Filter (Top Visual Cards)
      if (selectedCategory) {
        const catSlug = selectedCategory.slug.toLowerCase();
        const catName = selectedCategory.name.toLowerCase();
        const briefCats = b.categories || [];

        const hasRelationalCat = briefCats.some((bc) => {
          const s = (bc.slug || '').toLowerCase();
          const n = (bc.name || '').toLowerCase();
          return (
            s === catSlug ||
            n === catName ||
            (selectedCategory.subcategories || []).some(
              (sub) => sub.slug === s || sub.name === n
            )
          );
        });

        const textCorpus = `${b.title} ${b.creative_style_mood} ${b.campaign_objective} ${b.content_type}`.toLowerCase();
        const hasTextCat = textCorpus.includes(catName) || textCorpus.includes(catSlug.replace('-', ' '));

        if (!hasRelationalCat && !hasTextCat) return false;

        // Subcategory check
        if (selectedSubcategory) {
          const subSlug = selectedSubcategory.toLowerCase();
          const hasSub = briefCats.some(
            (bc) => (bc.slug || '').toLowerCase() === subSlug || (bc.name || '').toLowerCase() === subSlug
          );
          if (!hasSub && !textCorpus.includes(subSlug.replace('-', ' '))) return false;
        }
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = b.title?.toLowerCase().includes(q);
        const objMatch = b.campaign_objective?.toLowerCase().includes(q);
        const brandMatch = b.brand?.company_name?.toLowerCase().includes(q);
        const moodMatch = b.creative_style_mood?.toLowerCase().includes(q);
        const skillsMatch = b.required_skills?.some((s) => s.name?.toLowerCase().includes(q));
        const toolsMatch = b.required_tools?.some((t) => t.name?.toLowerCase().includes(q));
        if (!titleMatch && !objMatch && !brandMatch && !moodMatch && !skillsMatch && !toolsMatch) {
          return false;
        }
      }

      // 3. Budget filter
      if (maxBudget < 35000) {
        if ((b.budget_amount || 0) > maxBudget) return false;
      }

      // 4. Project type filter
      if (!matchesProjectType(b, selectedProjectTypes)) return false;

      // 5. Timeline filter
      if (!matchesTimeline(b, selectedTimelines, nowMs)) return false;

      return true;
    });
  }, [allBriefs, selectedCategory, selectedSubcategory, searchQuery, maxBudget, selectedProjectTypes, selectedTimelines]);

  const hasActiveFilters =
    Boolean(selectedCategory) ||
    Boolean(selectedSubcategory) ||
    Boolean(searchQuery) ||
    maxBudget < 35000 ||
    selectedProjectTypes.length > 0 ||
    selectedTimelines.length > 0;

  const activeFilterCount =
    (selectedCategory ? 1 : 0) +
    (selectedSubcategory ? 1 : 0) +
    (searchQuery ? 1 : 0) +
    (maxBudget < 35000 ? 1 : 0) +
    selectedProjectTypes.length +
    selectedTimelines.length;

  const displayedCategories = showAllCategories ? categories : categories.slice(0, 8);

  return (
    <div className="kivora-discovery-layout">
      {/* Mobile Filter Toggle */}
      <div className="discovery-mobile-bar">
        <button
          type="button"
          className="mobile-filter-btn"
          onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
        >
          <span className="filter-icon">⚙</span>
          <span>Filters & Search</span>
          {activeFilterCount > 0 && (
            <span className="mobile-active-badge">{activeFilterCount}</span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            className="mobile-clear-btn"
            onClick={handleResetFilters}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Left Filter Sidebar */}
      <aside className={`kivora-filter-sidebar ${isMobileFilterOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header-row">
          <div className="sidebar-title-wrap">
            <h3 className="sidebar-main-heading">Filters</h3>
            <span className="sidebar-count-indicator">
              {filteredBriefs.length} briefs
            </span>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              className="sidebar-reset-link"
              onClick={handleResetFilters}
            >
              Reset
            </button>
          )}
        </div>

        {/* Search Box */}
        <div className="sidebar-search-box">
          <svg
            className="sidebar-search-icon"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" x2="16.65" y1="21" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search campaign briefs, brands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sidebar-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery('')}
            >
              ✕
            </button>
          )}
        </div>

        {/* Section 0: Taxonomy Categories */}
        <div className="filter-accordion-group">
          <button
            type="button"
            className="filter-accordion-header"
            onClick={() => toggleSection('categories')}
          >
            <span>Creative Domain</span>
            <span className="accordion-chevron">{openSections.categories ? '∧' : '∨'}</span>
          </button>
          {openSections.categories && (
            <div className="filter-checkbox-list max-h-48 overflow-y-auto pr-1">
              <label className="filter-checkbox-label">
                <input
                  type="radio"
                  name="sidebar-brief-category"
                  checked={selectedCategory === null}
                  onChange={() => {
                    setSelectedCategory(null);
                    setSelectedSubcategory(null);
                  }}
                  className="custom-checkbox"
                />
                <span className="font-semibold text-xs">All Domains ({allBriefs.length})</span>
              </label>
              {categories.map((cat) => (
                <label key={cat.id} className="filter-checkbox-label">
                  <input
                    type="radio"
                    name="sidebar-brief-category"
                    checked={selectedCategory?.slug === cat.slug}
                    onChange={() => handleCategoryCardClick(cat)}
                    className="custom-checkbox"
                  />
                  <span className="text-xs">
                    {cat.name} ({cat.brief_count || cat.open_brief_count || 0})
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Section 1: Budget Range */}
        <div className="filter-accordion-group">
          <button
            type="button"
            className="filter-accordion-header"
            onClick={() => toggleSection('budget')}
          >
            <span>Budget Ceiling</span>
            <span className="accordion-chevron">{openSections.budget ? '∧' : '∨'}</span>
          </button>
          {openSections.budget && (
            <div className="filter-range-block">
              <input
                type="range"
                min="1000"
                max="35000"
                step="1000"
                value={maxBudget}
                onChange={(e) => setMaxBudget(Number(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-neutral-500 mt-1 font-mono">
                <span>$1k</span>
                <span className="font-bold text-purple-700">
                  {maxBudget >= 35000 ? 'Any Budget ($35k+)' : `Up to $${maxBudget.toLocaleString()}`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Project Type */}
        <div className="filter-accordion-group">
          <button
            type="button"
            className="filter-accordion-header"
            onClick={() => toggleSection('projectType')}
          >
            <span>Deliverable Format</span>
            <span className="accordion-chevron">{openSections.projectType ? '∧' : '∨'}</span>
          </button>
          {openSections.projectType && (
            <div className="filter-checkbox-list">
              {[
                'Cinematic Video (16:9)',
                'Social Video (9:16)',
                '3D / CGI Render',
                'Editorial Still',
              ].map((pt) => (
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

        {/* Section 3: Timeline */}
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

        {hasActiveFilters && (
          <button
            type="button"
            className="sidebar-clear-all-btn"
            onClick={handleResetFilters}
          >
            Clear All Active Filters
          </button>
        )}

        {/* AI Brief Builder Quick Button in Sidebar */}
        {onOpenAiBuilder && (
          <button
            type="button"
            className="btn btn-ai w-full mt-4 text-xs flex items-center justify-center gap-1.5 shadow-sm"
            onClick={onOpenAiBuilder}
          >
            <span>✨</span> Generate Brief with AI
          </button>
        )}
      </aside>

      {/* Right Main Grid Area */}
      <main className="kivora-discovery-main">
        {/* Top Category Discovery Section */}
        {categories.length > 0 && (
          <div className="category-discovery-section">
            <div className="category-section-top-bar">
              <div>
                <span className="badge-editorial">
                  <span className="badge-dot" />
                  CAMPAIGN DOMAINS
                </span>
                <h3 className="category-section-heading">Explore Briefs by Creative Domain</h3>
              </div>

              <div className="flex items-center gap-2">
                {selectedCategory && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory(null);
                      setSelectedSubcategory(null);
                    }}
                    className="category-clear-pill-btn"
                  >
                    Clear Domain ✕
                  </button>
                )}
                {categories.length > 8 && (
                  <button
                    type="button"
                    onClick={() => setShowAllCategories(!showAllCategories)}
                    className="category-expand-toggle-btn"
                  >
                    {showAllCategories ? 'Show Fewer' : `View All (${categories.length})`}
                  </button>
                )}
              </div>
            </div>

            {/* Category Cards Grid */}
            <div className="kivora-category-grid">
              {displayedCategories.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  category={cat}
                  isSelected={selectedCategory?.slug === cat.slug}
                  onClick={() => handleCategoryCardClick(cat)}
                  mode="briefs"
                />
              ))}
            </div>

            {/* Subcategories Row if Category Selected */}
            {selectedCategory && selectedCategory.subcategories?.length > 0 && (
              <div className="subcategory-chips-bar">
                <span className="subcategory-bar-label">
                  <span className="label-icon">📂</span>
                  <span>{selectedCategory.name} Subcategories:</span>
                </span>
                <button
                  type="button"
                  className={`subcategory-chip ${!selectedSubcategory ? 'active' : ''}`}
                  onClick={() => setSelectedSubcategory(null)}
                >
                  All {selectedCategory.name}
                </button>
                {selectedCategory.subcategories.map((sub) => {
                  const isSubActive = selectedSubcategory === sub.slug;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      className={`subcategory-chip ${isSubActive ? 'active' : ''}`}
                      onClick={() => setSelectedSubcategory(isSubActive ? null : sub.slug)}
                    >
                      {sub.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Discovery Headline Row */}
        <div className="discovery-headline-row">
          <div>
            <h2 className="discovery-main-title">
              {selectedCategory
                ? `${selectedCategory.name} Opportunities`
                : 'Commercial Briefs Ready for Production'}
            </h2>
            <p className="discovery-subtitle">
              Showing <strong>{filteredBriefs.length}</strong> of {allBriefs.length} verified campaign briefs
              {selectedCategory && ` in ${selectedCategory.name}`}
              {selectedSubcategory && ` › ${selectedSubcategory}`}
            </p>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              className="view-all-link-btn"
              onClick={handleResetFilters}
            >
              Reset all filters <span className="arrow-inline">↺</span>
            </button>
          )}
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="kivora-loading-card glass-panel">
            <div className="spinner-ring" />
            <p className="loading-text">Loading active campaign briefs...</p>
          </div>
        ) : error ? (
          <div className="kivora-error-card glass-panel">
            <p className="text-red font-semibold">Error: {error}</p>
            <button className="btn btn-secondary btn-sm mt-3" onClick={loadData}>
              Retry Query
            </button>
          </div>
        ) : filteredBriefs.length === 0 ? (
          <div className="kivora-empty-card glass-panel">
            <div className="empty-icon text-3xl">📋</div>
            <h3 className="empty-title">No campaign briefs match your criteria</h3>
            <p className="empty-desc">
              Try adjusting your category selection, increasing budget limits, or clearing search filters.
            </p>
            <button className="btn btn-primary btn-sm mt-4" onClick={handleResetFilters}>
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="kivora-briefs-card-grid">
            {filteredBriefs.map((brief, idx) => (
              <BriefCard
                key={brief.id}
                brief={brief}
                index={idx}
                onSelectBrief={onSelectBrief}
                isSaved={savedBriefIds.has(brief.id)}
                onToggleSave={(briefId, isSaved, briefObj) => {
                  setSavedBriefIds((prev) => {
                    const next = new Set(prev);
                    if (isSaved) next.add(briefId);
                    else next.delete(briefId);
                    return next;
                  });
                  if (onToggleSaveBrief) {
                    onToggleSaveBrief(briefId, isSaved, briefObj);
                  }
                }}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
