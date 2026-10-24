import React, { useState } from 'react';

const SUGGESTION_PILLS = [
  { text: 'Find the best creators for my campaign', icon: '🔍' },
  { text: 'Suggest a creative concept for a brand launch', icon: '💡' },
  { text: 'Analyze current creative trends', icon: '📈' },
  { text: 'Help me write a campaign brief', icon: '📝' },
  { text: 'Give detailed production ideas', icon: '🎬' },
];

export default function MeetKivoSection() {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isKivoHovered, setIsKivoHovered] = useState(false);

  const handleOpenChat = (prompt) => {
    window.dispatchEvent(new CustomEvent('kivora:open-chat', { detail: { prompt } }));
  };

  return (
    <section className="meet-kivo-cosmic-section relative overflow-hidden" id="meet-kivo">
      <div className="container relative z-10">
        <div className="kivo-balanced-layout">
          {/* Column 1: Editorial Heading & Actions */}
          <div className="kivo-intro-col">
            <div className="kivo-badge-pill">
              <span className="badge-sparkle">✦</span>
              MEET KIVO
            </div>
            <h2 className="kivo-section-headline">
              Your AI <br />
              <span className="serif-italic-accent">Creative Co-Pilot.</span>
            </h2>
            <p className="kivo-section-sub">
              Get ideas, plan campaigns, find creators, explore trends, and turn your vision into reality — all in one conversation.
            </p>

            <div className="kivo-cta-buttons">
              <button
                type="button"
                className="kivo-btn-primary"
                onClick={() => handleOpenChat('Hi Kivo, how can you help me today?')}
              >
                Start Chatting <span className="arrow-inline">→</span>
              </button>

              <button
                type="button"
                className="kivo-btn-secondary"
                onClick={() => setIsVideoModalOpen(true)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Watch Demo
              </button>
            </div>
          </div>

          {/* Column 2: Interactive Floating Kivo Chatbot Mascot */}
          <div className="kivo-mascot-center-col">
            <div
              className="kivo-mascot-interactive-wrap"
              onMouseEnter={() => setIsKivoHovered(true)}
              onMouseLeave={() => setIsKivoHovered(false)}
              onClick={() => handleOpenChat('Hi Kivo, how can you help me today?')}
              role="button"
              tabIndex={0}
              title="Click to chat with Kivo AI"
            >
              {/* Animated Speech Bubble on Hover */}
              <div
                className={`kivo-speech-bubble ${isKivoHovered ? 'visible' : ''}`}
                aria-hidden={!isKivoHovered}
              >
                <div className="speech-bubble-text">
                  Hii! 👋 How can I help you today?
                </div>
                <div className="speech-bubble-tail" />
              </div>

              {/* Kivo Robot Avatar with idle float and hover wave/bounce */}
              <div
                className={`kivo-robot-display-wrap ${
                  isKivoHovered ? 'kivo-hover-bounce' : 'animate-float-gentle'
                }`}
              >
                <div className="kivo-robot-glow-halo" />
                <img
                  src="/assets/kivo_robot_mascot.jpg"
                  alt="Kivo 3D AI Robot Mascot"
                  className="kivo-robot-avatar-img"
                />
                <div className="kivo-mascot-active-pill">
                  <span className="kivo-pulse-dot" />
                  <span>Ask Kivo</span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Compact Suggestion Pills */}
          <div className="kivo-suggestions-col">
            <div className="kivo-suggestions-list">
              {SUGGESTION_PILLS.map((pill, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="kivo-suggestion-pill-item"
                  onClick={() => handleOpenChat(pill.text)}
                  title="Click to ask Kivo AI"
                >
                  <span className="pill-item-icon">{pill.icon}</span>
                  <span className="pill-item-text">{pill.text}</span>
                  <span className="pill-item-arrow">→</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Demo Video Modal */}
      {isVideoModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsVideoModalOpen(false)}
        >
          <div
            className="bg-neutral-900 border border-purple-500/40 rounded-2xl max-w-2xl w-full p-6 text-white relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute top-4 right-4 text-neutral-400 hover:text-white text-xl"
              onClick={() => setIsVideoModalOpen(false)}
            >
              ✕
            </button>
            <h3 className="text-xl font-bold mb-2">Kivora Creative Co-Pilot Demo</h3>
            <p className="text-sm text-neutral-400 mb-4">
              Watch how Kivo bridges generative direction, brief formulation, and creator talent matching.
            </p>
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-black flex items-center justify-center border border-white/10">
              <video
                src="/assets/portfolio/solaris_anomaly_master.mp4"
                controls
                autoPlay
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
