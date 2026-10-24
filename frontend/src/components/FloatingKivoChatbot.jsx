import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { getCurrentUser } from '../services/authService';

export default function FloatingKivoChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'kivo',
      text: "Hi! I'm Kivo 👋 Your AI creative co-pilot. How can I help you navigate Kivora today?",
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([
    'What is Kivora?',
    'How does creator verification work?',
    'How do brands post campaign briefs?',
    'How does milestone escrow protect payments?',
  ]);
  const [isHovered, setIsHovered] = useState(false);
  const messagesEndRef = useRef(null);

  const currentUser = getCurrentUser();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    const handleOpen = (e) => {
      setIsOpen(true);
      if (e.detail?.prompt) {
        handleSend(e.detail.prompt);
      }
    };
    window.addEventListener('kivora:open-chat', handleOpen);
    return () => window.removeEventListener('kivora:open-chat', handleOpen);
  }, []);

  const handleSend = async (text) => {
    const query = (text || inputVal).trim();
    if (!query || isLoading) return;

    // Optimistically add user message
    const newMessages = [...messages, { sender: 'user', text: query }];
    setMessages(newMessages);
    setInputVal('');
    setIsLoading(true);

    try {
      // Connect to real backend API endpoint
      const historyPayload = newMessages.slice(-6).map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const res = await api.kivoChat({
        message: query,
        history: historyPayload,
        user_role: currentUser?.role || 'GUEST',
      });

      if (res && res.reply) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'kivo',
            text: res.reply,
            engine: res.generation_engine,
          },
        ]);
        if (Array.isArray(res.suggestions) && res.suggestions.length > 0) {
          setSuggestions(res.suggestions);
        }
      } else {
        throw new Error('Empty response from AI assistant.');
      }
    } catch (err) {
      console.error('Kivo chatbot API error:', err);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'kivo',
          text: "I'm having trouble connecting to the Kivora AI backend right now. Please try again in a few moments, or explore our Discover Creators and Campaign Briefs tabs.",
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button at Bottom-Right */}
      <div
        className="kivo-floating-trigger-container"
        style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Floating Speech Bubble */}
        <div
          className={`floating-kivo-speech-bubble ${isHovered && !isOpen ? 'visible' : ''}`}
          aria-hidden={!isHovered || isOpen}
        >
          <div className="floating-bubble-text">Hii! 👋 How can I help you today?</div>
          <div className="floating-bubble-tail" />
        </div>

        <button
          type="button"
          className={`kivo-floating-trigger-btn ${isHovered ? 'kivo-hover-bounce' : 'animate-float-gentle'}`}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Open Kivo AI Chat"
          title="Chat with Kivo AI"
        >
          <img
            src="/assets/kivo_robot_mascot.jpg"
            alt="Kivo"
            className="kivo-floating-trigger-avatar"
          />
          <span className="floating-trigger-status-dot" />
        </button>
      </div>

      {/* Floating Chat Modal Panel */}
      {isOpen && (
        <div
          className="kivo-floating-chat-panel"
          style={{ position: 'fixed', bottom: '92px', right: '24px', zIndex: 9999 }}
        >
          {/* Header */}
          <div className="kivo-panel-header">
            <div className="flex items-center gap-2">
              <div className="kivo-panel-avatar-wrap">
                <img src="/assets/kivo_robot_mascot.jpg" alt="Kivo" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm">Kivo AI</span>
                  <span className="kivo-online-dot" />
                </div>
                <span className="text-[11px] text-purple-200/70 block">Your creative co-pilot on Kivora</span>
              </div>
            </div>
            <button
              type="button"
              className="kivo-panel-close-btn"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* Messages Area */}
          <div className="kivo-panel-messages-area">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[88%] p-3 rounded-xl leading-relaxed text-xs ${
                    m.sender === 'user'
                      ? 'bg-[#7952EC] text-white rounded-br-none'
                      : m.isError
                      ? 'bg-red-950/40 text-red-200 border border-red-500/30 rounded-bl-none'
                      : 'bg-[#1C162E]/90 text-neutral-100 border border-purple-500/25 rounded-bl-none shadow-md backdrop-blur-sm'
                  }`}
                >
                  <div className="space-y-1">
                    {m.text.split('\n').map((line, lIdx) => {
                      const parts = line.split(/(\*\*.*?\*\*)/g);
                      return (
                        <div key={lIdx} className={line.trim() === '' ? 'h-1.5' : ''}>
                          {parts.map((part, pIdx) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                              return (
                                <strong key={pIdx} className="font-semibold text-purple-200">
                                  {part.slice(2, -2)}
                                </strong>
                              );
                            }
                            return part;
                          })}
                        </div>
                      );
                    })}
                  </div>
                  {m.engine && (
                    <span className="text-[9px] text-purple-300/70 block mt-2 font-mono border-t border-purple-500/20 pt-1">
                      ✦ {m.engine}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/10 border border-purple-500/20 text-purple-200 text-xs p-2.5 rounded-xl rounded-bl-none flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                  <span>Kivo is thinking... ✦</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          {suggestions.length > 0 && (
            <div className="kivo-panel-prompts-row">
              {suggestions.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="kivo-panel-chip"
                  onClick={() => handleSend(p)}
                  disabled={isLoading}
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input Box */}
          <form
            className="kivo-panel-input-wrap"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              type="text"
              placeholder="Ask Kivo anything about Kivora..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              disabled={isLoading}
              className="kivo-panel-input"
            />
            <button
              type="submit"
              disabled={!inputVal.trim() || isLoading}
              className="kivo-panel-send-btn"
              title="Send message"
            >
              ➔
            </button>
          </form>
        </div>
      )}
    </>
  );
}
