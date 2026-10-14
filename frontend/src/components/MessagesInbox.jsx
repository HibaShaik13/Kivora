import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { getCurrentUser } from '../services/authService';
import {
  parseMessageDate,
  formatMessageBubbleTime,
  formatConversationListItemTime,
} from '../utils/dateUtils';
import { getCreatorAvatar } from '../utils/visualAssetHelpers';
import BrandLogo from './BrandLogo';

function sortMessagesChronologically(msgs) {
  if (!Array.isArray(msgs)) return [];
  return [...msgs].sort((a, b) => {
    const timeA = parseMessageDate(a.created_at)?.getTime() || 0;
    const timeB = parseMessageDate(b.created_at)?.getTime() || 0;
    if (timeA !== timeB) return timeA - timeB;
    return String(a.id || '').localeCompare(String(b.id || ''));
  });
}

export default function MessagesInbox({
  currentUser,
  initialConversationId,
  chatContext,
  onClearChatContext,
}) {
  const effectiveUser = currentUser || getCurrentUser();
  const isCreatorUser = effectiveUser?.role?.toUpperCase() === 'CREATOR';

  const getTargetIntent = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const convId =
        chatContext?.conversationId ||
        initialConversationId ||
        params.get('conversationId') ||
        params.get('conv') ||
        params.get('c') ||
        null;
      const creatorId =
        chatContext?.creatorId ||
        params.get('creatorId') ||
        params.get('creator_id') ||
        null;
      const brandId =
        chatContext?.brandId ||
        params.get('brandId') ||
        params.get('brand_id') ||
        null;
      const briefId =
        chatContext?.briefId ||
        params.get('briefId') ||
        params.get('brief_id') ||
        null;
      const targetName =
        chatContext?.targetName ||
        chatContext?.creatorName ||
        chatContext?.brandName ||
        null;

      const hasExplicitTarget = Boolean(convId || creatorId || brandId || briefId);
      return {
        convId,
        creatorId,
        brandId,
        briefId,
        targetName,
        hasExplicitTarget,
      };
    } catch {
      return {
        convId: initialConversationId || null,
        creatorId: null,
        brandId: null,
        briefId: null,
        targetName: null,
        hasExplicitTarget: Boolean(initialConversationId),
      };
    }
  };

  const initialTarget = getTargetIntent();
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(initialTarget.convId || null);
  const [activeTargetName, setActiveTargetName] = useState(initialTarget.targetName);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [isLoadingConvs, setIsLoadingConvs] = useState(true);
  const [isLoadingMsgs, setIsLoadingMsgs] = useState(false);
  const [isResolvingTarget, setIsResolvingTarget] = useState(initialTarget.hasExplicitTarget);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [resolutionError, setResolutionError] = useState(null);
  const [contextualIneligibleNotice, setContextualIneligibleNotice] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const updateUrlForConversation = (convId) => {
    try {
      const url = new URL(window.location);
      if (convId) {
        url.searchParams.set('conversationId', convId);
        url.searchParams.set('conv', convId);
      } else {
        url.searchParams.delete('conversationId');
        url.searchParams.delete('conv');
      }
      url.searchParams.delete('creatorId');
      url.searchParams.delete('creator_id');
      url.searchParams.delete('brandId');
      url.searchParams.delete('brand_id');
      url.searchParams.delete('briefId');
      url.searchParams.delete('brief_id');
      window.history.replaceState({}, '', url);
    } catch {
      // ignore
    }
  };

  const handleSelectConversation = (convId) => {
    setActiveConvId(convId);
    setResolutionError(null);
    setContextualIneligibleNotice(null);
    setIsResolvingTarget(false);
    if (onClearChatContext) {
      onClearChatContext();
    }
    updateUrlForConversation(convId);
  };

  const loadAndResolveConversations = async (targetOverride = null) => {
    try {
      setIsLoadingConvs(true);
      setError(null);

      const target = targetOverride || getTargetIntent();
      const hasTarget = target.hasExplicitTarget;

      if (hasTarget) {
        setIsResolvingTarget(true);
        setActiveTargetName(target.targetName || null);
        setResolutionError(null);
        setContextualIneligibleNotice(null);
      }

      const data = await api.getConversations({ page: 1, page_size: 50 });
      let items = data.items || [];

      if (hasTarget) {
        // Option 1: Direct conversation ID requested
        if (target.convId) {
          const existing = items.find((c) => c.id === target.convId);
          if (existing) {
            setActiveConvId(existing.id);
            setResolutionError(null);
            setContextualIneligibleNotice(null);
            updateUrlForConversation(existing.id);
            if (onClearChatContext) onClearChatContext();
          } else {
            try {
              const directConv = await api.getConversation(target.convId);
              if (directConv) {
                items = [directConv, ...items.filter((c) => c.id !== directConv.id)];
                setActiveConvId(directConv.id);
                setResolutionError(null);
                setContextualIneligibleNotice(null);
                updateUrlForConversation(directConv.id);
                if (onClearChatContext) onClearChatContext();
              } else {
                setActiveConvId(null);
                setResolutionError(`The requested discussion "${target.convId}" could not be found or you lack access to it.`);
              }
            } catch (convErr) {
              console.warn('Could not load requested conversation directly:', convErr);
              setActiveConvId(null);
              setResolutionError(
                convErr.message?.includes('403') || convErr.message?.toLowerCase().includes('forbidden')
                  ? 'You are not authorized to view this private collaboration thread.'
                  : `The requested discussion could not be found or you lack access to it.`
              );
            }
          }
        }
        // Option 2: Target specified by creator_id, brand_id, or brief_id
        else if (target.creatorId || target.brandId || target.briefId) {
          // Check if an existing item already satisfies this exact relationship and brief
          let existingMatch = null;
          if (target.briefId && (target.creatorId || target.brandId)) {
            existingMatch = items.find(
              (c) =>
                c.brief_id === target.briefId &&
                ((target.creatorId && (c.creator_id === target.creatorId || c.creator_handle === target.creatorId)) ||
                 (target.brandId && c.brand_id === target.brandId))
            );
          } else if (target.briefId) {
            existingMatch = items.find((c) => c.brief_id === target.briefId);
          } else if (target.creatorId) {
            existingMatch = items.find((c) => c.creator_id === target.creatorId || c.creator_handle === target.creatorId);
          } else if (target.brandId) {
            existingMatch = items.find((c) => c.brand_id === target.brandId);
          }

          if (existingMatch) {
            setActiveConvId(existingMatch.id);
            setResolutionError(null);
            setContextualIneligibleNotice(null);
            updateUrlForConversation(existingMatch.id);
            if (onClearChatContext) onClearChatContext();
          } else {
            try {
              const res = await api.getContextualConversation({
                creator_id: target.creatorId || undefined,
                brand_id: target.brandId || undefined,
                brief_id: target.briefId || undefined,
              });

              if (res?.status === 'found' && res.conversation) {
                const foundConv = res.conversation;
                if (!items.some((c) => c.id === foundConv.id)) {
                  items = [foundConv, ...items];
                }
                setActiveConvId(foundConv.id);
                setResolutionError(null);
                setContextualIneligibleNotice(null);
                updateUrlForConversation(foundConv.id);
                if (onClearChatContext) onClearChatContext();
              } else {
                setActiveConvId(null);
                setContextualIneligibleNotice(
                  res?.reason || 'Direct messaging unlocks once an application pitch or brief invitation is accepted.'
                );
              }
            } catch (ctxErr) {
              console.warn('Error resolving contextual conversation:', ctxErr);
              setActiveConvId(null);
              setResolutionError(ctxErr.message || 'Unable to resolve the requested discussion.');
            }
          }
        }
      } else {
        // Option 3: General inbox visit without any specific person or brief requested
        if (!activeConvId && items.length > 0) {
          setActiveConvId(items[0].id);
        }
      }

      setConversations(items);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError(err.message || 'Failed to load conversations.');
    } finally {
      setIsLoadingConvs(false);
      setIsResolvingTarget(false);
    }
  };

  const loadMessages = async (convId) => {
    if (!convId) return;
    try {
      setIsLoadingMsgs(true);
      const msgs = await api.getConversationMessages(convId, { page: 1, page_size: 100 });
      setMessages(sortMessagesChronologically(msgs));
      // Mark as read
      await api.markConversationRead(convId).catch(() => null);
      // Update local unread badge in conversation list
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, unread_count: 0 } : c))
      );
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setIsLoadingMsgs(false);
    }
  };

  // React to prop or context changes
  useEffect(() => {
    const target = getTargetIntent();
    if (target.hasExplicitTarget) {
      loadAndResolveConversations(target);
    }
  }, [
    initialConversationId,
    chatContext?.timestamp,
    chatContext?.conversationId,
    chatContext?.creatorId,
    chatContext?.brandId,
    chatContext?.briefId,
  ]);

  // Sync back/forward popstate
  useEffect(() => {
    const handlePopState = () => {
      const target = getTargetIntent();
      if (target.hasExplicitTarget) {
        loadAndResolveConversations(target);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Initial load on mount
  useEffect(() => {
    loadAndResolveConversations();
    const convInterval = setInterval(() => {
      api.getConversations({ page: 1, page_size: 50 })
        .then((data) => {
          if (data?.items) {
            setConversations((prev) => {
              const currentActive = activeConvId;
              let merged = data.items;
              if (currentActive) {
                const activeItem = prev.find((p) => p.id === currentActive);
                if (activeItem && !merged.some((m) => m.id === currentActive)) {
                  merged = [activeItem, ...merged];
                }
              }
              return merged;
            });
          }
        })
        .catch(() => null);
    }, 15000);
    return () => clearInterval(convInterval);
  }, []);

  // When active conversation changes, load messages and poll them
  useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId);
      const msgInterval = setInterval(() => {
        api.getConversationMessages(activeConvId, { page: 1, page_size: 100 })
          .then((msgs) => setMessages(sortMessagesChronologically(msgs)))
          .catch(() => null);
      }, 6000);
      return () => clearInterval(msgInterval);
    } else {
      setMessages([]);
    }
  }, [activeConvId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = messageText.trim();
    if (!text || !activeConvId || isSending) return;

    try {
      setIsSending(true);
      setError(null);
      const newMsg = await api.sendMessage(activeConvId, text);
      setMessages((prev) => sortMessagesChronologically([...prev, newMsg]));
      setMessageText('');
      // Update last message preview in conversations
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConvId ? { ...c, last_message: newMsg, updated_at: newMsg.created_at } : c))
      );
    } catch (err) {
      setError(err.message || 'Failed to send message.');
    } finally {
      setIsSending(false);
    }
  };

  const activeConv = conversations.find((c) => c.id === activeConvId);

  return (
    <div
      className="messages-inbox-container"
      style={{
        display: 'grid',
        gridTemplateColumns: '320px 1fr',
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #EAE6DF',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        minHeight: '620px',
        height: 'calc(80vh - 80px)',
        overflow: 'hidden',
      }}
    >
      {/* Sidebar: Conversations List */}
      <div
        className="inbox-sidebar"
        style={{
          borderRight: '1px solid #F0ECE4',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#FAF8F5',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #F0ECE4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#111' }}>
            Messages
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#777', fontWeight: '500' }}>
              {conversations.length} Active
            </span>
            <button
              type="button"
              onClick={() => loadAndResolveConversations()}
              title="Refresh conversations"
              aria-label="Refresh conversations"
              style={{
                background: 'none',
                border: 'none',
                color: '#7952EC',
                cursor: 'pointer',
                padding: '2px 4px',
                fontSize: '14px',
                lineHeight: 1,
              }}
            >
              ↻
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {isLoadingConvs ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#888', fontSize: '13px' }}>
              Loading discussions...
            </div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#888' }}>
              <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>💬</span>
              <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                No conversations yet
              </p>
              <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.4 }}>
                Conversations unlock once an application or invitation is accepted.
              </p>
            </div>
          ) : (
            conversations.map((c) => {
              const isActive = c.id === activeConvId;
              const otherPartyName = isCreatorUser ? c.brand_name : c.creator_name;
              const defaultFallbackAvatar = isCreatorUser
                ? '/assets/brands/lumina.svg'
                : '/assets/avatars/elena.jpg';
              const creatorAvatarResolved = getCreatorAvatar({
                display_name: c.creator_name,
                handle: c.creator_handle,
                avatar_url: c.creator_avatar,
              });
              const otherPartyAvatar = isCreatorUser
                ? c.brand_logo || defaultFallbackAvatar
                : creatorAvatarResolved || defaultFallbackAvatar;

              return (
                <div
                  key={c.id}
                  onClick={() => handleSelectConversation(c.id)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #F2EFE9',
                    backgroundColor: isActive ? '#ECE6FC' : '#FAF8F5',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  {isCreatorUser ? (
                    <BrandLogo
                      brandName={c.brand_name}
                      logoUrl={c.brand_logo}
                      size={42}
                      shape="rounded"
                      padding="2px"
                    />
                  ) : (
                    <img
                      src={otherPartyAvatar}
                      alt={otherPartyName}
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '1px solid #EAE6DF',
                        flexShrink: 0,
                      }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = defaultFallbackAvatar;
                      }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {otherPartyName}
                      </span>
                      <span style={{ fontSize: '11px', color: '#999', marginLeft: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {formatConversationListItemTime(c.last_message?.created_at || c.updated_at)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <p style={{ margin: 0, fontSize: '11px', color: '#7952EC', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.brief_title || 'Campaign Project'}
                      </p>
                      {c.unread_count > 0 && (
                        <span
                          style={{
                            backgroundColor: '#7952EC',
                            color: '#FFF',
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '2px 6px',
                            borderRadius: '10px',
                            marginLeft: '4px',
                            flexShrink: 0,
                          }}
                        >
                          {c.unread_count}
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.last_message ? c.last_message.content : 'No messages yet'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div
        className="inbox-chat-area"
        style={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#FFFFFF',
        }}
      >
        {activeConv ? (
          <>
            {/* Chat Header */}
            <div
              style={{
                padding: '14px 24px',
                borderBottom: '1px solid #F0ECE4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#FFFFFF',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {isCreatorUser ? (
                  <BrandLogo
                    brandName={activeConv.brand_name}
                    logoUrl={activeConv.brand_logo}
                    size={38}
                    shape="rounded"
                    padding="2px"
                  />
                ) : (
                  <img
                    src={getCreatorAvatar({
                      display_name: activeConv.creator_name,
                      handle: activeConv.creator_handle,
                      avatar_url: activeConv.creator_avatar,
                    })}
                    alt={activeConv.creator_name || 'Creator Partner'}
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '1px solid #EAE6DF',
                    }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/assets/avatars/elena.jpg';
                    }}
                  />
                )}
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#111' }}>
                    {isCreatorUser ? activeConv.brand_name : activeConv.creator_name}
                  </h3>
                  <span style={{ fontSize: '12px', color: '#7952EC', fontWeight: '500' }}>
                    {activeConv.brief_title || 'Campaign Collaboration'}
                  </span>
                </div>
              </div>

              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#16A34A',
                  background: '#DCFCE7',
                  padding: '4px 10px',
                  borderRadius: '12px',
                }}
              >
                ✓ Secure Verified Thread
              </span>
            </div>

            {/* Messages Scroll Area */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                backgroundColor: '#FCFBFA',
              }}
            >
              {isLoadingMsgs && messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#888', fontSize: '13px' }}>
                  Loading chat history...
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 24px', color: '#999' }}>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: '#444' }}>
                    This is the start of your secure collaboration thread.
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
                    Exchange milestone updates, deliverable links, and project feedback below.
                  </p>
                </div>
              ) : (
                messages.map((m) => {
                  const isMine = m.sender_id === currentUser?.id;
                  return (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMine ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div
                        style={{
                          maxWidth: '70%',
                          padding: '10px 16px',
                          borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          backgroundColor: isMine ? '#7952EC' : '#FFFFFF',
                          color: isMine ? '#FFFFFF' : '#1A1A1A',
                          border: isMine ? 'none' : '1px solid #EAE6DF',
                          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                          fontSize: '14px',
                          lineHeight: 1.5,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        {m.content}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginTop: '3px',
                          padding: '0 4px',
                          fontSize: '11px',
                          color: '#999',
                        }}
                      >
                        <span className="message-time">
                          {formatMessageBubbleTime(m.created_at)}
                        </span>
                        {isMine && (
                          <span
                            className="message-status"
                            style={{
                              fontWeight: '500',
                              color: m.is_read ? '#7952EC' : '#999',
                            }}
                          >
                            {m.is_read ? '• Read' : '• Sent'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Error banner if any */}
            {error && (
              <div
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#FEF2F2',
                  borderTop: '1px solid #FCA5A5',
                  color: '#DC2626',
                  fontSize: '12px',
                }}
              >
                {error}
              </div>
            )}

            {/* Composer Input Form */}
            <form
              onSubmit={handleSendMessage}
              style={{
                padding: '14px 20px',
                borderTop: '1px solid #F0ECE4',
                display: 'flex',
                gap: '10px',
                backgroundColor: '#FFFFFF',
                alignItems: 'center',
              }}
            >
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message..."
                maxLength={5000}
                disabled={isSending}
                style={{
                  flex: 1,
                  padding: '12px 18px',
                  borderRadius: '12px',
                  border: '1px solid #D6D0C4',
                  fontSize: '14px',
                  outline: 'none',
                  backgroundColor: '#FAF8F5',
                }}
              />
              <button
                type="submit"
                disabled={!messageText.trim() || isSending}
                style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#7952EC',
                  color: '#FFFFFF',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: !messageText.trim() || isSending ? 'not-allowed' : 'pointer',
                  opacity: !messageText.trim() || isSending ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'opacity 0.15s ease',
                }}
              >
                {isSending ? 'Sending...' : 'Send 🚀'}
              </button>
            </form>
          </>
        ) : isResolvingTarget || (isLoadingConvs && initialTarget.hasExplicitTarget) ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666',
              padding: '32px',
              backgroundColor: '#FCFBFA',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                border: '3px solid #EAE6DF',
                borderTopColor: '#7952EC',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '16px',
              }}
            />
            <p style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#111' }}>
              Loading requested discussion...
            </p>
            <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#777' }}>
              Resolving verified participant and campaign context.
            </p>
          </div>
        ) : resolutionError ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 24px',
              textAlign: 'center',
              backgroundColor: '#FCFBFA',
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                marginBottom: '16px',
              }}
            >
              🔒
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '700', color: '#111' }}>
              Discussion Unavailable
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#666', maxWidth: '420px', lineHeight: 1.5 }}>
              {resolutionError}
            </p>
            {conversations.length > 0 && (
              <button
                type="button"
                onClick={() => handleSelectConversation(conversations[0].id)}
                style={{
                  padding: '10px 22px',
                  borderRadius: '12px',
                  backgroundColor: '#7952EC',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(121, 82, 236, 0.25)',
                }}
              >
                Go to Active Discussions
              </button>
            )}
          </div>
        ) : contextualIneligibleNotice ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 24px',
              textAlign: 'center',
              backgroundColor: '#FCFBFA',
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                backgroundColor: '#F3E8FF',
                color: '#7952EC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                marginBottom: '16px',
              }}
            >
              ✉
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '700', color: '#111' }}>
              Messaging Not Unlocked
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#555', maxWidth: '440px', lineHeight: 1.5 }}>
              {contextualIneligibleNotice}
            </p>
            {conversations.length > 0 && (
              <button
                type="button"
                onClick={() => handleSelectConversation(conversations[0].id)}
                style={{
                  padding: '10px 22px',
                  borderRadius: '12px',
                  backgroundColor: '#7952EC',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(121, 82, 236, 0.25)',
                }}
              >
                View Existing Discussions
              </button>
            )}
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#888', padding: '32px', textAlign: 'center', backgroundColor: '#FCFBFA' }}>
            <span style={{ fontSize: '36px', marginBottom: '12px' }}>💬</span>
            <p style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#222' }}>Select a discussion</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#888' }}>
              Choose a contact from the left sidebar to view messages.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
