import React, { useState } from 'react';

export const SPOTLIGHT_PROJECTS = [
  {
    id: 'proj-elena-solaris',
    title: 'Solaris Anomaly: Luxury Fragrance Spec Commercial',
    creator_name: 'Aanya Sharma',
    creator_handle: 'aanya_creative',
    creator_avatar: '/assets/creator-portraits/elena.jpg',
    creator_tier: 'TOP_STUDIO',
    content_type: 'VIDEO',
    aspect_ratio: '16:9',
    resolution: '4K UHD',
    duration_seconds: 30,
    primary_asset_url: '/assets/portfolio/solaris_anomaly_master.mp4',
    thumbnail_url: '/assets/portfolio/solaris_anomaly_thumb.jpg',
    tools_used: ['Runway Gen-3 Alpha', 'ComfyUI', 'SDXL', 'Topaz Video AI'],
    specialization: 'Sci-Fi Film & AI Video',
    description: 'Cinematic science-fiction commercial showcasing an extraterrestrial celestial anomaly, orbital camera trajectories, and fluid caustics.',
    commercial_rights: 'Full Commercial Buyout (Worldwide Perpetual)',
    evidence_count: 2,
    workflow_steps_count: 4,
  },
  {
    id: 'proj-marcus-lumina-bottle',
    title: 'Aura Droplet: Photorealistic Serum Dispenser',
    creator_name: 'Arjun Mehta',
    creator_handle: 'mehta_3d',
    creator_avatar: '/assets/creator-portraits/marcus.jpg',
    creator_tier: 'VERIFIED_PRO',
    content_type: 'PRODUCT_VIZ',
    aspect_ratio: '1:1',
    resolution: '4K UHD',
    duration_seconds: null,
    primary_asset_url: '/assets/portfolio/marcus_aura_droplet.jpg',
    thumbnail_url: '/assets/portfolio/marcus_aura_droplet_thumb.jpg',
    tools_used: ['Flux.1 Pro', 'Magnific AI', 'Photoshop'],
    specialization: 'Product Visualization',
    description: 'Hyper-realistic luxury cosmetic packaging render with studio lighting, physical glass caustics, and micro-droplet condensation.',
    commercial_rights: 'Full Commercial Buyout',
    evidence_count: 1,
    workflow_steps_count: 2,
  },
  {
    id: 'proj-kai-neon-samurai',
    title: 'Shin-Tokyo Cyber Blades: 2.5D Anime Teaser',
    creator_name: 'Kabir Nair',
    creator_handle: 'kabir_visuals',
    creator_avatar: '/assets/creator-portraits/kai.jpg',
    creator_tier: 'VERIFIED_PRO',
    content_type: 'ANIMATION',
    aspect_ratio: '16:9',
    resolution: '1080p',
    duration_seconds: 22,
    primary_asset_url: '/assets/portfolio/kai_neon_samurai.mp4',
    thumbnail_url: '/assets/portfolio/kai_neon_samurai_thumb.jpg',
    tools_used: ['Midjourney Niji 6', 'Kling AI 1.5', 'After Effects'],
    specialization: 'AI Animation & 2.5D Motion',
    description: 'Stylized anime sequence set in rainy Neo-Tokyo, featuring dynamic cyber katana lighting effects and fluid motion interpolation.',
    commercial_rights: 'Worldwide Digital Rights',
    evidence_count: 1,
    workflow_steps_count: 2,
  },
  {
    id: 'proj-maya-metamorphic',
    title: 'Liquid Organza: Virtual Couture Metamorphosis',
    creator_name: 'Meera Krishnan',
    creator_handle: 'meera_fashion',
    creator_avatar: '/assets/creator-portraits/maya.jpg',
    creator_tier: 'VERIFIED_PRO',
    content_type: 'VIDEO',
    aspect_ratio: '9:16',
    resolution: '4K UHD',
    duration_seconds: 25,
    primary_asset_url: '/assets/portfolio/maya_liquid_organza.mp4',
    thumbnail_url: '/assets/portfolio/maya_liquid_organza_thumb.jpg',
    tools_used: ['Flux.1 Pro', 'Runway Gen-3 Alpha', 'ComfyUI'],
    specialization: 'Experimental Visual Storytelling',
    description: 'Vertical digital haute couture showcase exploring avant-garde liquid fabric physics and surreal metallic transformations on the runway.',
    commercial_rights: 'Full Commercial Buyout',
    evidence_count: 1,
    workflow_steps_count: 2,
  },
  {
    id: 'proj-hassan-spectre',
    title: 'Apex GT: Midnight Autobahn High-Speed Run',
    creator_name: 'Hassan Siddiqui',
    creator_handle: 'hassan_automotive',
    creator_avatar: '/assets/creator-portraits/hassan.jpg',
    creator_tier: 'TOP_STUDIO',
    content_type: 'VIDEO',
    aspect_ratio: '16:9',
    resolution: '4K UHD',
    duration_seconds: 45,
    primary_asset_url: '/assets/portfolio/hassan_apex_gt.mp4',
    thumbnail_url: '/assets/portfolio/hassan_apex_gt_thumb.jpg',
    tools_used: ['Flux.1 Pro', 'Runway Gen-3 Alpha', 'Topaz Video AI', 'ControlNet'],
    specialization: 'Commercial Automotive AI Video',
    description: 'High-octane commercial cinematography capturing electric hypercar vehicle dynamics, volumetric headlight beams, and wet highway reflections.',
    commercial_rights: 'Worldwide Perpetual Commercial Buyout',
    evidence_count: 1,
    workflow_steps_count: 2,
  },
  {
    id: 'proj-sophia-dew',
    title: 'Cellular Hydration: Micro Dermal Droplet Spec',
    creator_name: 'Sanya Malhotra',
    creator_handle: 'sanya_beauty',
    creator_avatar: '/assets/creator-portraits/sophia.jpg',
    creator_tier: 'TOP_STUDIO',
    content_type: 'VIDEO',
    aspect_ratio: '16:9',
    resolution: '4K UHD',
    duration_seconds: 28,
    primary_asset_url: '/assets/portfolio/sophia_cellular_dew.mp4',
    thumbnail_url: '/assets/portfolio/sophia_cellular_dew_thumb.jpg',
    tools_used: ['Midjourney v6', 'Runway Gen-3 Alpha', 'ComfyUI'],
    specialization: 'Beauty & Lifestyle AI Content',
    description: 'Macro skincare advertising cinematography demonstrating clinical serum formulation with hyper-realistic microscopic hydration droplet reveals.',
    commercial_rights: 'Full Commercial Buyout',
    evidence_count: 1,
    workflow_steps_count: 2,
  },
];

export default function PortfolioSpotlight({ onSelectProject }) {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <section className="spotlight-section">
      <div className="container">
        <div className="section-header">
          <div className="section-header-tag">CURATED SHOWCASE</div>
          <h2 className="section-title">Verified Creator Portfolio Showcase</h2>
          <p className="section-sub">
            Inspect live generative AI commercials, anime sequences, and CGI product renders with full
            reproducibility logs and human-audited evidence.
          </p>
        </div>

        <div className="spotlight-grid">
          {SPOTLIGHT_PROJECTS.map((proj) => {
            const isVideo = proj.content_type === 'VIDEO' || proj.content_type === 'ANIMATION';
            const isHovered = hoveredId === proj.id;

            return (
              <div
                key={proj.id}
                className="spotlight-card glass-panel"
                onMouseEnter={() => setHoveredId(proj.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onSelectProject(proj)}
              >
                {/* Media Container */}
                <div className={`spotlight-media-wrapper aspect-${proj.aspect_ratio.replace(':', '-')}`}>
                  {isVideo ? (
                    <>
                      <img
                        src={proj.thumbnail_url}
                        alt={proj.title}
                        className={`spotlight-thumb ${isHovered ? 'thumb-hidden' : ''}`}
                        loading="lazy"
                      />
                      <video
                        src={proj.primary_asset_url}
                        muted
                        loop
                        playsInline
                        autoPlay={isHovered}
                        className={`spotlight-video ${isHovered ? 'video-active' : ''}`}
                      />
                      <div className="video-play-indicator">
                        <span className="play-icon">{isHovered ? '⏸' : '▶'}</span>
                        <span className="duration-tag">{proj.duration_seconds}s</span>
                      </div>
                    </>
                  ) : (
                    <img
                      src={proj.primary_asset_url}
                      alt={proj.title}
                      className="spotlight-image"
                      loading="lazy"
                    />
                  )}

                  {/* Badges Overlay */}
                  <div className="spotlight-badges-overlay">
                    <span className={`badge badge-${proj.content_type.toLowerCase()}`}>
                      {proj.content_type}
                    </span>
                    <span className="badge-format-tag">
                      {proj.aspect_ratio} • {proj.resolution}
                    </span>
                  </div>
                </div>

                {/* Content Section */}
                <div className="spotlight-content">
                  {/* Creator Bar */}
                  <div className="spotlight-creator-row">
                    <img
                      src={proj.creator_avatar}
                      alt={proj.creator_name}
                      className="spotlight-avatar"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/assets/creator-portraits/devon.jpg';
                      }}
                    />
                    <div className="spotlight-creator-meta">
                      <div className="creator-name-row">
                        <span className="creator-display-name">{proj.creator_name}</span>
                        {proj.creator_tier === 'TOP_STUDIO' ? (
                          <span className="badge badge-top-studio">TOP STUDIO</span>
                        ) : (
                          <span className="badge badge-verified-pro">VERIFIED PRO</span>
                        )}
                      </div>
                      <span className="creator-specialization-text">{proj.specialization}</span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="spotlight-card-title">{proj.title}</h3>
                  <p className="spotlight-card-desc">{proj.description}</p>

                  {/* Tools Strip */}
                  <div className="spotlight-tools-strip">
                    {proj.tools_used.map((tool) => (
                      <span key={tool} className="tag-pill">
                        {tool}
                      </span>
                    ))}
                  </div>

                  {/* Footer Meta */}
                  <div className="spotlight-card-footer">
                    <div className="proof-status-indicator">
                      <span className="check-dot">✓</span>
                      <span>{proj.workflow_steps_count} Audited Workflow Steps</span>
                    </div>
                    <span className="inspect-cta-link">
                      Inspect Evidence →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
