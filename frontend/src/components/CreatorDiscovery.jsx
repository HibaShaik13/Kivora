import React, { useState, useEffect, useMemo } from 'react';
import { creatorService } from '../services/creatorService';
import CreatorCard from './CreatorCard';

const DISCIPLINE_KEYWORDS = {
  '3D & CGI': ['3d', 'cgi', 'render', 'spatial', 'architecture', 'cinema'],
  'AI Art': ['ai', 'generative', 'concept', 'art', 'surreal', 'synthesis', 'matte'],
  'Motion Design': ['motion', 'cinema', 'video', 'animation', 'camera', 'trajectory', 'arc'],
  'Visual Effects': ['effect', 'vfx', 'fluid', 'particle', 'lighting', 'cinematic', 'macro'],
  'Illustration': ['illustration', 'anime', 'stylized', 'world building', 'fashion'],
  'Brand Design': ['brand', 'product', 'design', 'commercial', 'advertising', 'minimalist'],
};

const TOOL_KEYWORDS = {
  'Runway Gen-3': ['runway', 'gen-3', 'gen3'],
  'ComfyUI': ['comfyui', 'comfy'],
  'Flux.1 Pro': ['flux'],
  'Midjourney': ['midjourney'],
  'Topaz Video AI': ['topaz'],
};

const POPULAR_LOCATIONS = ['London', 'Tokyo', 'Berlin', 'Paris', 'USA', 'Canada'];

export default function CreatorDiscovery({ onSelectCreator, onInviteCreator }) {
  const [allCreators, setAllCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDisciplines, setSelectedDisciplines] = useState([]);
  const [selectedTools, setSelectedTools] = useState([]);
  const [selectedTiers, setSelectedTiers] = useState([]);
  const [locationQuery, setLocationQuery] = useState('');
  const [maxBudget, setMaxBudget] = useState(10000);

  // Sidebar accordion states
  const [openSections, setOpenSections] = useState({
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

  const loadCreators = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await creatorService.getCreators();
      setAllCreators(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load creators.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCreators();
  }, []);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDisciplines([]);
    setSelectedTools([]);
    setSelectedTiers([]);
    setLocationQuery('');
    setMaxBudget(10000);
  };

  // Composite multi-filter working in unison with actual creator data
  const filteredCreators = useMemo(() => {
    return allCreators.filter((c) => {
      // Exclude test-only accounts from public creator discovery
      const isTestUser = (
        c.handle?.toLowerCase().startsWith('test_') ||
        c.display_name?.toLowerCase().startsWith('test_') ||
        c.display_name?.toLowerCase().startsWith('test user') ||
        c.avatar_url?.includes('dicebear.com/7.x/bottts')
      );
      if (isTestUser) return false;

      // 1. Search Query
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

      // 2. Creative Discipline Filter
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

      // 3. Tools & Models Filter
      if (selectedTools.length > 0) {
        const matchesTool = selectedTools.some((toolKey) => {
          const keywords = TOOL_KEYWORDS[toolKey] || [toolKey.toLowerCase()];
          const toolsStr = (c.tools || []).map((t) => (t.name || t.tool_id || '').toLowerCase()).join(' ');
          return keywords.some((kw) => toolsStr.includes(kw));
        });
        if (!matchesTool) return false;
      }

      // 4. Role / Tier Filter
      if (selectedTiers.length > 0) {
        const matchesTier = selectedTiers.some((tier) => {
          if (tier === 'COMMUNITY') {
            return c.verification_tier === 'COMMUNITY' || c.verification_tier === 'UNVERIFIED' || !c.verification_tier;
          }
          return c.verification_tier === tier;
        });
        if (!matchesTier) return false;
      }

      // 5. Location Filter
      if (locationQuery.trim()) {
        const lq = locationQuery.toLowerCase().trim();
        const matchesLocation = c.location && c.location.toLowerCase().includes(lq);
        if (!matchesLocation) return false;
      }

      // 6. Rate Range Filter
      if (maxBudget < 10000) {
        const creatorBudget = c.min_budget !== undefined && c.min_budget !== null ? c.min_budget : 0;
        if (creatorBudget > maxBudget) return false;
      }

      return true;
    });
  }, [allCreators, searchQuery, selectedDisciplines, selectedTools, selectedTiers, locationQuery, maxBudget]);

  const hasActiveFilters =
    Boolean(searchQuery) ||
    selectedDisciplines.length > 0 ||
    selectedTools.length > 0 ||
    selectedTiers.length > 0 ||
    Boolean(locationQuery) ||
    maxBudget < 10000;

  return (
    <div className="kivora-discovery-layout">
      {/* Left Filter Sidebar */}
      <aside className="kivora-filter-sidebar glass-panel">
        {/* Search Box */}
        <div className="sidebar-search-box">
          <span className="search-mag-icon">🔍</span>
          <input
            type="text"
            placeholder="Search creators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sidebar-search-input"
          />
        </div>

        {/* Section 1: Creative Discipline */}
        <div className="filter-accordion-group">
          <button
            type="button"
            className="filter-accordion-header"
            onClick={() => toggleSection('discipline')}
          >
            <span>Creative Discipline</span>
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
              {['Runway Gen-3', 'ComfyUI', 'Flux.1 Pro', 'Midjourney', 'Topaz Video AI'].map((tool) => (
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

        {/* Section 3: Role / Tier */}
        <div className="filter-accordion-group">
          <button
            type="button"
            className="filter-accordion-header"
            onClick={() => toggleSection('tier')}
          >
            <span>Role / Tier</span>
            <span className="accordion-chevron">{openSections.tier ? '∧' : '∨'}</span>
          </button>
          {openSections.tier && (
            <div className="filter-checkbox-list">
              {[
                { id: 'TOP_STUDIO', label: '👑 Top Studio' },
                { id: 'VERIFIED_PRO', label: '✓ Verified Pro' },
                { id: 'COMMUNITY', label: 'Community' },
              ].map((t) => (
                <label key={t.id} className="filter-checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedTiers.includes(t.id)}
                    onChange={() => handleCheckboxChange(selectedTiers, setSelectedTiers, t.id)}
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
            <div className="filter-location-block mt-2">
              <input
                type="text"
                placeholder="Search city, country..."
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-black/10 bg-white/80 focus:bg-white focus:outline-none"
              />
              <div className="flex flex-wrap gap-1 mt-2">
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
            <span>Rate Range</span>
            <span className="accordion-chevron">{openSections.rate ? '∧' : '∨'}</span>
          </button>
          {openSections.rate && (
            <div className="filter-range-block">
              <input
                type="range"
                min="500"
                max="10000"
                step="500"
                value={maxBudget}
                onChange={(e) => setMaxBudget(Number(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-neutral-500 mt-1 font-mono">
                <span>$500</span>
                <span className="font-bold text-purple-700">
                  {maxBudget >= 10000 ? 'Any rate ($10k+)' : `Up to $${maxBudget.toLocaleString()}`}
                </span>
              </div>
            </div>
          )}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            className="w-full mt-4 py-2 text-xs font-semibold rounded-full bg-neutral-200 hover:bg-neutral-300 text-neutral-800 transition shadow-sm"
            onClick={handleResetFilters}
          >
            Clear All Filters
          </button>
        )}
      </aside>

      {/* Right Main Grid Area */}
      <main className="kivora-discovery-main">
        {/* Headline Row */}
        <div className="discovery-headline-row">
          <div>
            <h2 className="discovery-main-title">
              Creators worth a closer look.
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5 font-medium">
              Showing {filteredCreators.length} of {allCreators.length} verified creators
            </p>
          </div>
          <button
            type="button"
            className="view-all-link-btn"
            onClick={handleResetFilters}
          >
            View all creators <span className="arrow-inline">→</span>
          </button>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="kivora-loading-card glass-panel">
            <div className="spinner-ring" />
            <p>Loading curated creators...</p>
          </div>
        ) : error ? (
          <div className="kivora-error-card glass-panel">
            <p className="text-red">Error: {error}</p>
            <button className="btn btn-secondary btn-sm" onClick={loadCreators}>
              Retry Query
            </button>
          </div>
        ) : filteredCreators.length === 0 ? (
          <div className="kivora-empty-card glass-panel">
            <div className="empty-icon text-3xl">🎨</div>
            <h3 className="font-serif text-lg font-bold">No creators match your filter</h3>
            <p className="text-xs text-neutral-500">Try clearing or adjusting selected filters to see more creators.</p>
            <button className="btn btn-primary btn-sm mt-3" onClick={handleResetFilters}>
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
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
