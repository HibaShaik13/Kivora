import React, { useState } from 'react';

export default function CosmicFooter({ onNavigate, onOpenAdminDesk }) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => {
        setEmail('');
        setSubscribed(false);
      }, 3000);
    }
  };

  return (
    <footer className="kivora-cosmic-footer">
      <div className="container relative z-10">
        <div className="footer-top-grid">
          {/* Column 1: Brand & Socials */}
          <div className="footer-brand-column">
            <div className="footer-brand-name">
              Kivora<span className="serif-italic-accent">.</span>
            </div>
            <p className="footer-brand-tagline">
              Where human creativity meets intelligent innovation.
            </p>

            <div className="footer-socials-row">
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="footer-social-icon">
                in
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className="footer-social-icon">
                📷
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube" className="footer-social-icon">
                ▶
              </a>
              <a href="https://x.com" target="_blank" rel="noreferrer" aria-label="X Twitter" className="footer-social-icon">
                𝕏
              </a>
            </div>
          </div>

          {/* Column 2: Product */}
          <div className="footer-links-col">
            <h5 className="footer-col-title">Product</h5>
            <ul className="footer-links-list">
              <li><button type="button" onClick={() => onNavigate('creators')}>Discover Creators</button></li>
              <li><button type="button" onClick={() => onNavigate('briefs')}>Explore Briefs</button></li>
              <li><button type="button" onClick={() => {
                const el = document.getElementById('how-it-works');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}>How It Works</button></li>
              <li><button type="button" onClick={() => {
                const el = document.getElementById('kivo-chat-input');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}>Kivo AI</button></li>
              <li><button type="button" onClick={() => alert('Creator memberships are 100% free! Brands enjoy zero commission introductory terms.')}>Pricing</button></li>
            </ul>
          </div>

          {/* Column 3: For Creators */}
          <div className="footer-links-col">
            <h5 className="footer-col-title">For Creators</h5>
            <ul className="footer-links-list">
              <li><button type="button" onClick={() => onNavigate('creators')}>Create Profile</button></li>
              <li><button type="button" onClick={() => onNavigate('briefs')}>Find Campaigns</button></li>
              <li><button type="button" onClick={() => onNavigate('creators')}>Resources</button></li>
              <li><button type="button" onClick={() => onNavigate('creators')}>Creator Stories</button></li>
              <li><button type="button" onClick={() => onNavigate('creators')}>Success Stories</button></li>
            </ul>
          </div>

          {/* Column 4: For Brands */}
          <div className="footer-links-col">
            <h5 className="footer-col-title">For Brands</h5>
            <ul className="footer-links-list">
              <li><button type="button" onClick={() => onNavigate('briefs')}>Post a Campaign</button></li>
              <li><button type="button" onClick={() => onNavigate('creators')}>Find Creators</button></li>
              <li><button type="button" onClick={() => onNavigate('briefs')}>Brand Guide</button></li>
              <li><button type="button" onClick={() => onNavigate('briefs')}>Case Studies</button></li>
              <li><button type="button" onClick={() => onNavigate('briefs')}>Brand Stories</button></li>
            </ul>
          </div>

          {/* Column 5: Company & Newsletter */}
          <div className="footer-links-col footer-newsletter-col">
            <h5 className="footer-col-title">Company</h5>
            <ul className="footer-links-list">
              <li><button type="button" onClick={() => onNavigate('landing')}>About</button></li>
              <li><button type="button" onClick={() => onNavigate('landing')}>Blog</button></li>
              <li><button type="button" onClick={() => onNavigate('landing')}>Careers</button></li>
              <li><button type="button" onClick={() => onNavigate('landing')}>Contact</button></li>
              <li><button type="button" onClick={() => onNavigate('landing')}>Terms & Privacy</button></li>
            </ul>

            <div className="footer-newsletter-wrap">
              <span className="footer-newsletter-label">Join our creative community</span>
              <form onSubmit={handleSubscribe} className="footer-newsletter-form">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="footer-email-input"
                  required
                />
                <button
                  type="submit"
                  className="footer-subscribe-btn"
                  aria-label="Subscribe to Kivora newsletter"
                >
                  →
                </button>
              </form>
              {subscribed && (
                <span className="text-[11px] text-emerald-400 mt-1 block">
                  ✦ Welcome to the Kivora creative network!
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="footer-bottom-bar">
          <p className="footer-copyright">
            © 2026 Kivora. All rights reserved.
          </p>

          <div className="footer-meta-pill">
            <span className="meta-status-dot" />
            <span>FastAPI & SQLite Online • Real-time Escrow Sync</span>
            <button
              type="button"
              className="footer-admin-link"
              onClick={onOpenAdminDesk}
            >
              Admin Audit Desk
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
