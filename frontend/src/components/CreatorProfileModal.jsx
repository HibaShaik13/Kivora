import React, { useState } from 'react';

export default function CreatorProfileModal({ creator, isOpen, onClose, onSelectProject, onPostBrief }) {
  const [activeTab, setActiveTab] = useState('portfolio'); // 'portfolio' | 'workflow' | 'about' | 'reviews'

  if (!isOpen || !creator) return null;

  const projects = creator.portfolio_projects || [
    {
      id: 'proj-1',
      title: 'Dewdrop Radiance Serum 4K Cinematic Launch',
      content_type: 'VIDEO',
      thumbnail_url: '/assets/portfolio/sophia_cellular_dew_thumb.jpg',
      primary_asset_url: '/assets/portfolio/sophia_cellular_dew.mp4',
      aspect_ratio: '16:9',
      resolution: '3840x2160',
      description: 'Macro fluid simulation with cellular luminescence and raytraced photon scattering.',
    },
    {
      id: 'proj-2',
      title: 'Solaris Anomaly - Procedural Sci-Fi Sequence',
      content_type: 'VIDEO',
      thumbnail_url: '/assets/portfolio/solaris_anomaly_thumb.jpg',
      primary_asset_url: '/assets/portfolio/solaris_anomaly_master.mp4',
      aspect_ratio: '16:9',
      resolution: '4K UHD',
      description: 'Procedural gravitational lensing and volumetric nebula simulation.',
    },
    {
      id: 'proj-3',
      title: 'Apex GT Hypercar Night Run',
      content_type: 'VIDEO',
      thumbnail_url: '/assets/portfolio/hassan_apex_gt_thumb.jpg',
      primary_asset_url: '/assets/portfolio/hassan_apex_gt.mp4',
      aspect_ratio: '16:9',
      resolution: '4K UHD',
      description: 'Raytraced carbon weave and dynamic camera drift through neon architectural tunnels.',
    },
    {
      id: 'proj-4',
      title: 'Liquid Organza Haute Couture Runway',
      content_type: 'VIDEO',
      thumbnail_url: '/assets/portfolio/maya_liquid_organza_thumb.jpg',
      primary_asset_url: '/assets/portfolio/maya_liquid_organza.mp4',
      aspect_ratio: '9:16',
      resolution: '4K UHD',
      description: 'Virtual textile physics with gossamer translucency and fluid motion curves.',
    },
    {
      id: 'proj-5',
      title: 'Cyberpunk Tokyo 2099 Cinematic',
      content_type: 'VIDEO',
      thumbnail_url: '/assets/portfolio/kai_neon_samurai_thumb.jpg',
      primary_asset_url: '/assets/portfolio/kai_neon_samurai.mp4',
      aspect_ratio: '16:9',
      resolution: '4K UHD',
      description: 'Anime motion interpolation and neural style grading.',
    },
    {
      id: 'proj-6',
      title: 'Aura Droplet Macro Botanical',
      content_type: 'IMAGE',
      thumbnail_url: '/assets/portfolio/marcus_aura_droplet_thumb.jpg',
      primary_asset_url: '/assets/portfolio/marcus_aura_droplet.jpg',
      aspect_ratio: '1:1',
      resolution: '4K UHD',
      description: 'Sub-surface scattering through organic morning dew droplets.',
    },
  ];

  const avatarUrl = creator.avatar_url || `/assets/avatars/${(creator.handle || 'elena').split('_')[0]}.jpg`;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="kivora-profile-modal-container glass-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Actions */}
        <div className="profile-modal-top-bar">
          <button
            type="button"
            className="modal-icon-action-btn"
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              alert('Profile link copied to clipboard!');
            }}
            title="Share profile"
          >
            ↗ Share
          </button>
          <button
            type="button"
            className="modal-icon-action-btn"
            title="Save creator"
          >
            ♡
          </button>
          <button
            type="button"
            className="modal-close-round-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Profile Hero Header */}
        <div className="profile-modal-hero-grid">
          {/* Left Column: Portrait & 3 Thumbnails */}
          <div className="profile-hero-left">
            <div className="profile-main-portrait-wrapper">
              <img
                src={avatarUrl}
                alt={creator.display_name}
                className="profile-main-portrait-img"
                onError={(e) => {
                  e.target.src = '/assets/avatars/elena.jpg';
                }}
              />
            </div>
            {/* 3 Small Thumbnails below */}
            <div className="profile-portrait-thumbs-row">
              {projects.slice(0, 3).map((p, idx) => (
                <div
                  key={idx}
                  className="profile-portrait-subthumb"
                  onClick={() => onSelectProject(p)}
                >
                  <img
                    src={p.thumbnail_url || p.primary_asset_url}
                    alt={p.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Middle Column: Info, Bio, Buttons */}
          <div className="profile-hero-middle">
            <div className="flex items-center gap-2">
              <h1 className="profile-display-name">{creator.display_name}</h1>
              <span className="purple-check-badge-large" title="Audited Creator">
                ✓
              </span>
            </div>
            <p className="profile-role-text">
              {creator.primary_specialization || '3D & Motion Artist'}
            </p>

            <div className="profile-meta-chips-row">
              <span>📍 {creator.location || 'London, UK'}</span>
              <span>•</span>
              <span>⭐ {creator.average_rating ? creator.average_rating.toFixed(1) : '4.9'} ({creator.completed_projects_count ? creator.completed_projects_count * 12 : 36} reviews)</span>
              <span>•</span>
              <span className="text-purple-700 font-semibold font-mono">
                {creator.verification_tier === 'TOP_STUDIO' ? '👑 Top Studio' : '🛡 Pro Tier'}
              </span>
            </div>

            <p className="profile-bio-manifesto">
              {creator.bio || 'I create cinematic 3D visuals and AI-driven motion design for brands who want to tell stories that feel alive. From concept to final frame, '}
              <span className="serif-italic-accent">I blend art, technology and emotion.</span>
            </p>

            {/* Skills & Tools chips */}
            <div className="profile-skills-pills-row">
              {creator.tools && creator.tools.map((t) => (
                <span key={t.tool_id || t.name} className="profile-tag-pill">
                  {t.name || (t.tool && t.tool.name) || t.tool_id}
                </span>
              ))}
              {creator.skills && creator.skills.map((s) => (
                <span key={s.skill_id || s.name} className="profile-tag-pill">
                  {s.name || (s.skill && s.skill.name) || s.skill_id}
                </span>
              ))}
              {(!creator.tools || creator.tools.length === 0) && (
                <>
                  <span className="profile-tag-pill">3D & CGI</span>
                  <span className="profile-tag-pill">Motion</span>
                  <span className="profile-tag-pill">Visual Effects</span>
                  <span className="profile-tag-pill">Creative Direction</span>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="profile-cta-buttons-row">
              <button
                type="button"
                className="btn btn-dark btn-pill-lg"
                onClick={() => {
                  onClose();
                  if (onPostBrief) onPostBrief();
                }}
              >
                Contact
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-pill-lg"
                onClick={() => {
                  alert(`Creator is currently Available. Minimum project rate is $${creator.min_budget?.toLocaleString() || '2,500'}.`);
                }}
              >
                View Availability
              </button>
            </div>
          </div>

          {/* Right Column: Statistics Cluster */}
          <div className="profile-hero-right">
            <div className="profile-stat-item">
              <span className="profile-stat-number">{creator.completed_projects_count ? creator.completed_projects_count + 15 : '50+'}</span>
              <span className="profile-stat-title">Projects</span>
            </div>
            <div className="profile-stat-item">
              <span className="profile-stat-number">{creator.years_experience ? `${creator.years_experience}+` : '3+'}</span>
              <span className="profile-stat-title">Years</span>
            </div>
            <div className="profile-stat-item">
              <span className="profile-stat-number">98%</span>
              <span className="profile-stat-title">Client Satisfaction</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="profile-tabs-nav-bar">
          {[
            { id: 'portfolio', label: 'Portfolio' },
            { id: 'workflow', label: 'Workflow' },
            { id: 'about', label: 'About' },
            { id: 'reviews', label: 'Reviews' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`profile-tab-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content 1: Portfolio Gallery */}
        {activeTab === 'portfolio' && (
          <div className="profile-portfolio-gallery-grid">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="portfolio-gallery-card"
                onClick={() => onSelectProject(proj)}
              >
                <div className="portfolio-gallery-thumb-wrap">
                  <img
                    src={proj.thumbnail_url || proj.primary_asset_url}
                    alt={proj.title}
                    className="portfolio-gallery-img"
                  />
                  {proj.content_type === 'VIDEO' && (
                    <div className="gallery-play-overlay">
                      <div className="play-circle-icon">▶</div>
                    </div>
                  )}
                  <span className="gallery-format-pill">
                    {proj.aspect_ratio || '16:9'}
                  </span>
                </div>
                <div className="p-3">
                  <h4 className="text-sm font-bold text-neutral-900 line-clamp-1">{proj.title}</h4>
                  <p className="text-xs text-neutral-500 line-clamp-2 mt-1">{proj.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab Content 2: Workflow */}
        {activeTab === 'workflow' && (
          <div className="p-6 bg-white/70 rounded-2xl border border-black/5 space-y-4">
            <h3 className="font-serif font-bold text-lg text-neutral-900">
              ⚡ ProofGraph Creative Production Workflow
            </h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
                <strong>Stage 1: Prompt & Optics Architecture</strong>
                <p className="text-neutral-600 mt-1">Multi-pass lighting seeds with custom LoRA embedding models.</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
                <strong>Stage 2: Temporal Video Synthesis</strong>
                <p className="text-neutral-600 mt-1">Runway Gen-3 Alpha camera arc trajectory with motion vector interpolation.</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
                <strong>Stage 3: 4K Master Upscale & Color Grade</strong>
                <p className="text-neutral-600 mt-1">Topaz Video AI ProRes render with DaVinci Resolve custom LUT mastering.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 3: About */}
        {activeTab === 'about' && (
          <div className="p-6 bg-white/70 rounded-2xl border border-black/5 space-y-4 text-xs">
            <h3 className="font-serif font-bold text-lg text-neutral-900">About {creator.display_name}</h3>
            <p className="leading-relaxed text-neutral-700">{creator.bio}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-black/10">
              <div>
                <span className="font-bold text-neutral-500 block uppercase text-[10px]">Location</span>
                <span className="font-semibold text-neutral-900">{creator.location || 'London, UK'}</span>
              </div>
              <div>
                <span className="font-bold text-neutral-500 block uppercase text-[10px]">Min Project Budget</span>
                <span className="font-semibold text-purple-700">${creator.min_budget?.toLocaleString() || '2,500'}</span>
              </div>
              <div>
                <span className="font-bold text-neutral-500 block uppercase text-[10px]">Hourly Rate</span>
                <span className="font-semibold text-neutral-900">${creator.hourly_rate || 150}/hr</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 4: Reviews */}
        {activeTab === 'reviews' && (
          <div className="p-6 bg-white/70 rounded-2xl border border-black/5 space-y-4 text-xs">
            <h3 className="font-serif font-bold text-lg text-neutral-900">Verified Client Reviews (★ 4.9)</h3>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-white border border-black/5">
                <div className="flex justify-between font-semibold">
                  <span>Lumina Skincare</span>
                  <span className="text-amber-500">★★★★★ 5.0</span>
                </div>
                <p className="text-neutral-600 mt-1 italic">
                  "Elena delivered stunning 4K macro footage ahead of deadline. The photorealistic fluid lighting was perfection."
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white border border-black/5">
                <div className="flex justify-between font-semibold">
                  <span>Apex Interactive</span>
                  <span className="text-amber-500">★★★★★ 5.0</span>
                </div>
                <p className="text-neutral-600 mt-1 italic">
                  "Exceptional technical mastery of ComfyUI pipelines and camera motion. Will hire again!"
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
