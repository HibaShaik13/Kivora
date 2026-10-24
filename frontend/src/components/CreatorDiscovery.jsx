import React, { useState, useEffect, useMemo } from 'react';
import { creatorService } from '../services/creatorService';
import { api } from '../services/api';
import { getCurrentUser } from '../services/authService';
import CreatorCard from './CreatorCard';
import CategoryCard from './CategoryCard';
import { formatINR } from '../utils/indianLocalization';

const DISCIPLINE_KEYWORDS = {
  '3D & CGI': ['3d', 'cgi', 'render', 'spatial', 'architecture', 'cinema'],
  'AI Art': ['ai', 'generative', 'concept', 'art', 'surreal', 'synthesis', 'matte'],
  'Motion Design': ['motion', 'cinema', 'video', 'animation', 'camera', 'trajectory', 'arc'],
  'Visual Effects': ['effect', 'vfx', 'fluid', 'particle', 'lighting', 'cinematic', 'macro'],
  'Illustration': ['illustration', 'anime', 'stylized', 'world building', 'fashion'],
  'Brand Design': ['brand', 'product', 'design', 'commercial', 'advertising', 'minimalist'],
  'Fashion & Apparel': ['fashion', 'apparel', 'textile', 'virtual try-on', 'jewelry', 'runway'],
  'Beauty & Skincare': ['beauty', 'skincare', 'cosmetic', 'serum', 'lotion', 'makeup'],
  'Food & Beverage': ['food', 'beverage', 'culinary', 'coffee', 'cocktail', 'dining'],
  'Automotive': ['automotive', 'vehicle', 'car', 'supercar', 'cockpit', 'mobility'],
  'Technology & Gadgets': ['tech', 'technology', 'gadget', 'wearable', 'electronics', 'hardware'],
  'Gaming': ['game', 'gaming', 'rpg', 'trailer', 'esports', 'character'],
};

const TOOL_KEYWORDS = {
  'Runway Gen-3': ['runway', 'gen-3', 'gen3'],
  'ComfyUI': ['comfyui', 'comfy'],
  'Flux.1 Pro': ['flux'],
  'Midjourney': ['midjourney'],
  'Topaz Video AI': ['topaz'],
  'Blender': ['blender'],
  'Cinema 4D': ['cinema 4d', 'c4d'],
  'Unreal Engine 5': ['unreal', 'ue5'],
};

const POPULAR_LOCATIONS = ['Bengaluru', 'Mumbai', 'New Delhi', 'Hyderabad', 'Pune', 'Chennai', 'Kochi', 'Jaipur'];

export default function CreatorDiscovery({ onSelectCreator, onInviteCreator, onOpenChat }) {
  const [allCreators, setAllCreators] = useState([]);
  const [categories, setCategories] = useState([]);
  const [savedCreatorIds, setSavedCreatorIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentUser = getCurrentUser();

  // Category Filtering State
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDisciplines, setSelectedDisciplines] = useState([]);
  const [selectedTools, setSelectedTools] = useState([]);
  const [selectedTiers, setSelectedTiers] = useState([]);
  const [locationQuery, setLocationQuery] = useState('');
  const [maxBudget, setMaxBudget] = useState(49999);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Sidebar accordion states
  const [openSections, setOpenSections] = useState({
    categories: true,
    discipline: true,
    tools: true,
    tier: true,
    location: true,
    rate: true,
  });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCheckboxChange = (list, setList, value) => {
    if (list.includes(value)) {
      setList(list.filter((item) => item !== value));
    } else {
      setList([...list, value]);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [creatorsData, categoriesData] = await Promise.all([
        creatorService.getCreators(),
        api.getCategories().catch(() => []),
      ]);
      setAllCreators(creatorsData || []);
      setCategories(categoriesData || []);

      if (currentUser?.role === 'BRAND') {
        try {
          const savedData = await api.getSavedCreators();
          const items = Array.isArray(savedData) ? savedData : (savedData?.items || []);
          const idSet = new Set(items.map((item) => item.creator_id || item.creator?.id).filter(Boolean));
          setSavedCreatorIds(idSet);
        } catch {
          // Non-blocking saved creators prefetch
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load creators.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCategorySelect = (cat) => {
    if (selectedCategory?.slug === cat?.slug) {
      setSelectedCategory(null);
      setSelectedSubcategory(null);
    } else {
      setSelectedCategory(cat);
      setSelectedSubcategory(null);
    }
  };

  const handleResetFilters = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSearchQuery('');
    setSelectedDisciplines([]);
    setSelectedTools([]);
    setSelectedTiers([]);
    setLocationQuery('');
    setMaxBudget(49999);
  };

  // Composite multi-filter working in unison with actual creator data
  const filteredCreators = useMemo(() => {
    const list = allCreators.filter((c) => {
      // Exclude test accounts from public creator discovery
      const isTestUser = (
        c.handle?.toLowerCase().startsWith('test_') ||
        c.display_name?.toLowerCase().startsWith('test_') ||
        c.display_name?.toLowerCase().startsWith('test user') ||
        c.avatar_url?.includes('dicebear.com/7.x/bottts')
      );
      if (isTestUser) return false;

      // 1. Primary Category Filter
      if (selectedCategory) {
        const catSlug = selectedCategory.slug.toLowerCase();
        const catName = selectedCategory.name.toLowerCase();
        const creatorCats = c.categories || [];

        // Check if primary specialization or primary category matches
        const primaryCat = creatorCats.find((cc) => cc.is_primary);
        const isPrimaryRelational = primaryCat && (
          (primaryCat.slug || '').toLowerCase() === catSlug ||
          (primaryCat.name || '').toLowerCase() === catName
        );

        const specText = (c.primary_specialization || '').toLowerCase();
        const isPrimarySpec = specText.includes(catName) || specText.includes(catSlug.replace(/-/g, ' '));
        const isPrimaryMatch = Boolean(isPrimaryRelational || isPrimarySpec);

        // Keywords from discipline and taxonomy words
        const disciplineKeywords = DISCIPLINE_KEYWORDS[selectedCategory.name] || [];
        const nameWords = catName.split(/[ &,-]+/).map(w => w.toLowerCase()).filter((w) => w.length > 2);
        const allKeywords = [...new Set([...disciplineKeywords, ...nameWords, catSlug.replace(/-/g, ' ')])];

        const bioText = (c.bio || '').toLowerCase();
        const skillsText = (c.skills || []).map((s) => (s.name || '').toLowerCase()).join(' ');
        const creatorCorpus = `${specText} ${bioText} ${skillsText}`;

        const hasKeywordMatch = allKeywords.some((kw) => creatorCorpus.includes(kw));
        const hasTextCategory = creatorCorpus.includes(catName);

        // Secondary category check: requires verified keyword/skill relevance to avoid false matches
        const hasSecondaryRelational = creatorCats.some((cc) => {
          const s = (cc.slug || '').toLowerCase();
          const n = (cc.name || '').toLowerCase();
          return (
            s === catSlug ||
            n === catName ||
            (selectedCategory.subcategories || []).some(
              (sub) => sub.slug === s || sub.name === n
            )
          );
        });

        if (!isPrimaryMatch && !(hasSecondaryRelational && (hasKeywordMatch || hasTextCategory))) {
          return false;
        }

        // Subcategory check if selected
        if (selectedSubcategory) {
          const subSlug = selectedSubcategory.toLowerCase();
          const hasSub = creatorCats.some(
            (cc) => (cc.slug || '').toLowerCase() === subSlug || (cc.name || '').toLowerCase() === subSlug
          );
          const hasSubText = creatorCorpus.includes(subSlug.replace(/-/g, ' '));
          if (!hasSub && !hasSubText) return false;
        }
      }

      // 2. Search Query (Name, Handle, Bio, Specialty, Location, Skills, Tools)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = c.display_name?.toLowerCase().includes(q);
        const handleMatch = c.handle?.toLowerCase().includes(q);
        const bioMatch = c.bio?.toLowerCase().includes(q);
        const specMatch = c.primary_specialization?.toLowerCase().includes(q);
        const locMatch = c.location?.toLowerCase().includes(q);
        const skillMatch = c.skills?.some((s) => s.name?.toLowerCase().includes(q));
        const toolMatch = c.tools?.some((t) => (t.name || t.tool_id)?.toLowerCase().includes(q));
        if (!nameMatch && !handleMatch && !bioMatch && !specMatch && !locMatch && !skillMatch && !toolMatch) {
          return false;
        }
      }

      // 3. Creative Discipline Filter
      if (selectedDisciplines.length > 0) {
        const matchesDiscipline = selectedDisciplines.some((disc) => {
          const keywords = DISCIPLINE_KEYWORDS[disc] || [disc.toLowerCase()];
          const spec = (c.primary_specialization || '').toLowerCase();
          const bio = (c.bio || '').toLowerCase();
          const skills = (c.skills || []).map((s) => (s.name || '').toLowerCase()).join(' ');
          return keywords.some((kw) => spec.includes(kw) || bio.includes(kw) || skills.includes(kw));
        });
        if (!matchesDiscipline) return false;
      }

      // 4. Tools & Models Filter
      if (selectedTools.length > 0) {
        const matchesTool = selectedTools.some((toolKey) => {
          const keywords = TOOL_KEYWORDS[toolKey] || [toolKey.toLowerCase()];
          const toolsStr = (c.tools || []).map((t) => (t.name || t.tool_id || '').toLowerCase()).join(' ');
          return keywords.some((kw) => toolsStr.includes(kw));
        });
        if (!matchesTool) return false;
      }

      // 5. Verification Tier Filter
      if (selectedTiers.length > 0) {
        const matchesTier = selectedTiers.some((tier) => {
          if (tier === 'COMMUNITY') {
            return c.verification_tier === 'COMMUNITY' || c.verification_tier === 'UNVERIFIED' || !c.verification_tier;
          }
          return c.verification_tier === tier;
        });
        if (!matchesTier) return false;
      }

      // 6. Location Filter
      if (locationQuery.trim()) {
        const lq = locationQuery.toLowerCase().trim();
        const matchesLocation = c.location && c.location.toLowerCase().includes(lq);
        if (!matchesLocation) return false;
      }

      // 7. Rate Range Filter (INR ₹10,000 - ₹49,999)
      if (maxBudget < 49999) {
        const creatorBudget = c.min_budget !== undefined && c.min_budget !== null ? c.min_budget : 0;
        if (creatorBudget > maxBudget) return false;
      }

      return true;
    });

    // If a category is selected, sort primary specialists first, then by rating
    if (selectedCategory) {
      const catSlug = selectedCategory.slug.toLowerCase();
      const catName = selectedCategory.name.toLowerCase();
      list.sort((a, b) => {
        const aPrimary = (a.categories || []).some(cc => cc.is_primary && (cc.slug?.toLowerCase() === catSlug || cc.name?.toLowerCase() === catName)) ||
          (a.primary_specialization || '').toLowerCase().includes(catName);
        const bPrimary = (b.categories || []).some(cc => cc.is_primary && (cc.slug?.toLowerCase() === catSlug || cc.name?.toLowerCase() === catName)) ||
          (b.primary_specialization || '').toLowerCase().includes(catName);
        if (aPrimary && !bPrimary) return -1;
        if (!aPrimary && bPrimary) return 1;
        return (b.average_rating || 0) - (a.average_rating || 0);
      });
    }

    return list;
  }, [allCreators, selectedCategory, selectedSubcategory, searchQuery, selectedDisciplines, selectedTools, selectedTiers, locationQuery, maxBudget]);

  const hasActiveFilters =
    Boolean(selectedCategory) ||
    Boolean(selectedSubcategory) ||
    Boolean(searchQuery) ||
    selectedDisciplines.length > 0 ||
    selectedTools.length > 0 ||
    selectedTiers.length > 0 ||
    Boolean(locationQuery) ||
    maxBudget < 49999;

  const activeFilterCount =
    (selectedCategory ? 1 : 0) +
    (selectedSubcategory ? 1 : 0) +
    (searchQuery ? 1 : 0) +
    selectedDisciplines.length +
    selectedTools.length +
    selectedTiers.length +
    (locationQuery ? 1 : 0) +
    (maxBudget < 49999 ? 1 : 0);

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
              {filteredCreators.length} results
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
            placeholder="Search creators, skills, tools..."
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

        {/* Section 0: Taxonomy Categories List */}
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
                  name="sidebar-creator-category"
                  checked={selectedCategory === null}
                  onChange={() => {
                    setSelectedCategory(null);
                    setSelectedSubcategory(null);
                  }}
                  className="custom-checkbox"
                />
                <span className="font-semibold text-xs">All Domains ({allCreators.length})</span>
              </label>
              {categories.map((cat) => (
                <label key={cat.id} className="filter-checkbox-label">
                  <input
                    type="radio"
                    name="sidebar-creator-category"
                    checked={selectedCategory?.slug === cat.slug}
                    onChange={() => handleCategorySelect(cat)}
                    className="custom-checkbox"
                  />
                  <span className="text-xs">
                    {cat.name} ({cat.creator_count || 0})
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Section 1: Creative Discipline Keywords */}
        <div className="filter-accordion-group">
          <button
            type="button"
            className="filter-accordion-header"
            onClick={() => toggleSection('discipline')}
          >
            <span>Disciplines</span>
            <span className="accordion-chevron">{openSections.discipline ? '∧' : '∨'}</span>
          </button>
          {openSections.discipline && (
            <div className="filter-checkbox-list">
              {[
                '3D & CGI',
                'AI Art',
                'Motion Design',
                'Visual Effects',
                'Illustration',
                'Brand Design',
                'Fashion & Apparel',
                'Beauty & Skincare',
                'Food & Beverage',
                'Automotive',
              ].map((disc) => (
                <label key={disc} className="filter-checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedDisciplines.includes(disc)}
                    onChange={() => handleCheckboxChange(selectedDisciplines, setSelectedDisciplines, disc)}
                    className="custom-checkbox"
                  />
                  <span>{disc}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Tools & Models */}
        <div className="filter-accordion-group">
          <button
            type="button"
            className="filter-accordion-header"
            onClick={() => toggleSection('tools')}
          >
            <span>Tools & Models</span>
            <span className="accordion-chevron">{openSections.tools ? '∧' : '∨'}</span>
          </button>
          {openSections.tools && (
            <div className="filter-checkbox-list">
              {[
                'Runway Gen-3',
                'ComfyUI',
                'Flux.1 Pro',
                'Midjourney',
                'Topaz Video AI',
                'Blender',
                'Cinema 4D',
                'Unreal Engine 5',
              ].map((tool) => (
                <label key={tool} className="filter-checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedTools.includes(tool)}
                    onChange={() => handleCheckboxChange(selectedTools, setSelectedTools, tool)}
                    className="custom-checkbox"
                  />
                  <span>{tool}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Verification Tier */}
        <div className="filter-accordion-group">
          <button
            type="button"
            className="filter-accordion-header"
            onClick={() => toggleSection('tier')}
          >
            <span>Verification Tier</span>
            <span className="accordion-chevron">{openSections.tier ? '∧' : '∨'}</span>
          </button>
          {openSections.tier && (
            <div className="filter-checkbox-list">
              {[
                { key: 'TOP_STUDIO', label: '👑 Top Studio (Audited)' },
                { key: 'VERIFIED_PRO', label: '✓ Verified Pro' },
                { key: 'COMMUNITY', label: '🌱 Community Member' },
              ].map((t) => (
                <label key={t.key} className="filter-checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedTiers.includes(t.key)}
                    onChange={() => handleCheckboxChange(selectedTiers, setSelectedTiers, t.key)}
                    className="custom-checkbox"
                  />
                  <span>{t.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Section 4: Location */}
        <div className="filter-accordion-group">
          <button
            type="button"
            className="filter-accordion-header"
            onClick={() => toggleSection('location')}
          >
            <span>Location</span>
            <span className="accordion-chevron">{openSections.location ? '∧' : '∨'}</span>
          </button>
          {openSections.location && (
            <div className="space-y-2 pt-1">
              <input
                type="text"
                placeholder="City or country..."
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-black/10 bg-white"
              />
              <div className="flex flex-wrap gap-1">
                {POPULAR_LOCATIONS.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setLocationQuery(locationQuery === loc ? '' : loc)}
                    className={`text-[11px] px-2 py-0.5 rounded-full transition ${
                      locationQuery.toLowerCase() === loc.toLowerCase()
                        ? 'bg-purple-600 text-white font-semibold'
                        : 'bg-white/80 text-neutral-600 hover:bg-white border border-black/5'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section 5: Rate Range */}
        <div className="filter-accordion-group">
          <button
            type="button"
            className="filter-accordion-header"
            onClick={() => toggleSection('rate')}
          >
            <span>Starting Budget Ceiling</span>
            <span className="accordion-chevron">{openSections.rate ? '∧' : '∨'}</span>
          </button>
          {openSections.rate && (
            <div className="filter-range-block">
              <input
                type="range"
                min="10000"
                max="49999"
                step="1000"
                value={maxBudget}
                onChange={(e) => setMaxBudget(Number(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-neutral-500 mt-1 font-mono">
                <span>{formatINR(10000)}</span>
                <span className="font-bold text-purple-700">
                  {maxBudget >= 49999 ? 'Any rate (₹50k)' : `Up to ${formatINR(maxBudget)}`}
                </span>
              </div>
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
                  CREATIVE DOMAINS
                </span>
                <h3 className="category-section-heading">Browse by Creative Domain</h3>
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
                  onClick={() => handleCategorySelect(cat)}
                  mode="creators"
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
                ? `${selectedCategory.name} Creators`
                : 'Verified Creative Directors & Studios'}
            </h2>
            <p className="discovery-subtitle">
              Showing <strong>{filteredCreators.length}</strong> of {allCreators.length} verified creators
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
            <p className="loading-text">Loading curated creators...</p>
          </div>
        ) : error ? (
          <div className="kivora-error-card glass-panel">
            <p className="text-red font-semibold">Error: {error}</p>
            <button className="btn btn-secondary btn-sm mt-3" onClick={loadData}>
              Retry Query
            </button>
          </div>
        ) : filteredCreators.length === 0 ? (
          <div className="kivora-empty-card glass-panel">
            <div className="empty-icon text-3xl">🎨</div>
            <h3 className="empty-title">No creators match your active filters</h3>
            <p className="empty-desc">
              Try selecting a different domain, relaxing budget ceiling, or clearing search keywords.
            </p>
            <button className="btn btn-primary btn-sm mt-4" onClick={handleResetFilters}>
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="kivora-creators-card-grid">
            {filteredCreators.map((creator) => (
              <CreatorCard
                key={creator.id}
                creator={creator}
                onSelectCreator={onSelectCreator}
                onInviteCreator={onInviteCreator}
                onOpenChat={onOpenChat}
                isSaved={savedCreatorIds.has(creator.id)}
                onToggleSave={(cId, isSaved) => {
                  setSavedCreatorIds((prev) => {
                    const next = new Set(prev);
                    if (isSaved) next.add(cId);
                    else next.delete(cId);
                    return next;
                  });
                }}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
