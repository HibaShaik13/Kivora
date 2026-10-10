import React, { useState, useEffect } from 'react';
import { creatorService } from '../services/creatorService';
import CreatorCard from './CreatorCard';

export default function CreatorDiscovery({ onSelectCreator, onInviteCreator }) {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDisciplines, setSelectedDisciplines] = useState([]);
  const [selectedTools, setSelectedTools] = useState([]);
  const [selectedTiers, setSelectedTiers] = useState([]);
  const [maxBudget, setMaxBudget] = useState(10000);

  // Sidebar accordion states
  const [openSections, setOpenSections] = useState({
    discipline: true,
    tools: true,
    tier: true,
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

  const fetchCreators = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (selectedTools.length > 0) params.tool = selectedTools[0];
      if (selectedTiers.length > 0) params.verification_tier = selectedTiers[0];

      const data = await creatorService.getCreators(params);
      let filtered = data || [];

      // Filter by disciplines if selected
      if (selectedDisciplines.length > 0) {
        filtered = filtered.filter((c) =>
          selectedDisciplines.some((disc) =>
            c.primary_specialization?.toLowerCase().includes(disc.toLowerCase()) ||
            c.skills?.some((s) => s.name?.toLowerCase().includes(disc.toLowerCase()))
          )
        );
      }

      setCreators(filtered);
    } catch (err) {
      setError(err.message || 'Failed to load creators.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedDisciplines, selectedTools, selectedTiers]);

  useEffect(() => {
    fetchCreators();
  }, [fetchCreators]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDisciplines([]);
    setSelectedTools([]);
    setSelectedTiers([]);
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

        {/* Section 3: Rate / Tier */}
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

        {/* Section 4: Rate Range */}
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
                className="w-full"
              />
              <div className="flex justify-between text-xs text-neutral-500 mt-1 font-mono">
                <span>$500</span>
                <span className="font-bold text-purple-700">Up to ${maxBudget.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        {(selectedDisciplines.length > 0 || selectedTools.length > 0 || selectedTiers.length > 0 || searchQuery) && (
          <button
            type="button"
            className="w-full mt-4 py-2 text-xs font-semibold rounded-full bg-neutral-200 hover:bg-neutral-300 text-neutral-800 transition"
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
          <h2 className="discovery-main-title">
            Creators worth a closer look.
          </h2>
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
            <button className="btn btn-secondary btn-sm" onClick={fetchCreators}>
              Retry Query
            </button>
          </div>
        ) : creators.length === 0 ? (
          <div className="kivora-empty-card glass-panel">
            <div className="empty-icon text-3xl">🎨</div>
            <h3 className="font-serif text-lg font-bold">No creators match your filter</h3>
            <p className="text-xs text-neutral-500">Try clearing selected filters to see all available creators.</p>
            <button className="btn btn-primary btn-sm mt-3" onClick={handleResetFilters}>
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="kivora-creators-card-grid">
            {creators.map((creator) => (
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
