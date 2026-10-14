import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';

export default function NotificationBell({ onNavigate }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const popoverRef = useRef(null);

  const fetchUnreadCount = async () => {
    try {
      const data = await api.getUnreadNotificationsCount();
      if (data && typeof data.unread_count === 'number') {
        setUnreadCount(data.unread_count);
      }
    } catch {
      // Non-fatal background refresh
    }
  };

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getNotifications({ page: 1, page_size: 20 });
      setNotifications(data.items || []);
      if (typeof data.unread_count === 'number') {
        setUnreadCount(data.unread_count);
      }
    } catch (err) {
      setError(err.message || 'Failed to load notifications.');
    } finally {
      setIsLoading(false);
    }
  };

  // Poll unread count periodically (every 20s) and on mount
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 20000);
    return () => clearInterval(interval);
  }, []);

  // Fetch full notifications list when panel opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const handleMarkOneRead = async (e, id) => {
    e.stopPropagation();
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications read:', err);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await api.deleteNotification(id);
      const target = notifications.find((n) => n.id === id);
      if (target && !target.is_read) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleItemClick = async (notif) => {
    if (!notif.is_read) {
      try {
        await api.markNotificationRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // ignore
      }
    }
    setIsOpen(false);
    if (notif.link_url && onNavigate) {
      if (notif.link_url.includes('tab=')) {
        const match = notif.link_url.match(/tab=([^&]+)/);
        if (match && match[1]) {
          onNavigate('dashboard', { tab: match[1] });
          return;
        }
      }
      if (notif.link_url.startsWith('/inbox')) {
        onNavigate('inbox');
        return;
      }
      if (notif.link_url.startsWith('/briefs')) {
        onNavigate('briefs');
        return;
      }
      onNavigate('dashboard');
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'CREATOR_INVITED':
      case 'INVITATION_ACCEPTED':
      case 'INVITATION_DECLINED':
        return '✉️';
      case 'APPLICATION_RECEIVED':
      case 'APPLICATION_ACCEPTED':
      case 'APPLICATION_REJECTED':
        return '📄';
      case 'DELIVERABLE_SUBMITTED':
      case 'DELIVERABLE_APPROVED':
      case 'DELIVERABLE_REVISION_REQUESTED':
        return '📦';
      case 'NEW_MESSAGE':
        return '💬';
      case 'OPPORTUNITY_ALERT':
        return '✨';
      default:
        return '🔔';
    }
  };

  return (
    <div className="notification-bell-container" ref={popoverRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className="notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications: ${unreadCount} unread`}
        aria-expanded={isOpen}
        title="View Notifications"
        style={{
          position: 'relative',
          background: 'rgba(255, 255, 255, 0.8)',
          border: '1px solid #EAE6DF',
          borderRadius: '50%',
          width: '38px',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#1A1A1A',
          transition: 'all 0.15s ease',
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>

        {unreadCount > 0 && (
          <span
            className="notification-badge"
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              backgroundColor: '#7952EC',
              color: '#FFFFFF',
              fontSize: '11px',
              fontWeight: '700',
              borderRadius: '999px',
              minWidth: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              boxShadow: '0 2px 4px rgba(121, 82, 236, 0.4)',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Flyout Notification Panel */}
      {isOpen && (
        <div
          className="notification-panel"
          style={{
            position: 'absolute',
            top: '48px',
            right: 0,
            width: '360px',
            maxWidth: '90vw',
            background: '#FFFFFF',
            border: '1px solid #EAE6DF',
            borderRadius: '16px',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.12)',
            zIndex: 1000,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '480px',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid #F0ECE4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#FAF8F5',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: '700', fontSize: '15px', color: '#111' }}>Notifications</span>
              {unreadCount > 0 && (
                <span
                  style={{
                    background: '#ECE6FC',
                    color: '#7952EC',
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '12px',
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>
            {notifications.length > 0 && unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#7952EC',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List Content */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '4px 0' }}>
            {isLoading ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#888', fontSize: '13px' }}>
                Loading notifications...
              </div>
            ) : error ? (
              <div style={{ padding: '24px', textAlign: 'center' }}>
                <p style={{ color: '#DC2626', fontSize: '13px', margin: '0 0 8px 0' }}>{error}</p>
                <button
                  type="button"
                  onClick={fetchNotifications}
                  style={{
                    background: '#7952EC',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Retry
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '48px 20px', textAlign: 'center', color: '#999' }}>
                <span style={{ fontSize: '28px', display: 'block', marginBottom: '8px' }}>🔔</span>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: '#444' }}>No notifications yet</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>We'll notify you when activity occurs.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #F5F3EF',
                    background: n.is_read ? '#FFFFFF' : '#F9F7FE',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = n.is_read ? '#FAF8F5' : '#F3EDFD';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = n.is_read ? '#FFFFFF' : '#F9F7FE';
                  }}
                >
                  <span style={{ fontSize: '18px', lineHeight: 1 }}>{getTypeIcon(n.type)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '13px',
                          fontWeight: n.is_read ? '600' : '700',
                          color: '#111',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {n.title}
                      </p>
                      {!n.is_read && (
                        <span
                          style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            backgroundColor: '#7952EC',
                            display: 'inline-block',
                            marginLeft: '6px',
                          }}
                        />
                      )}
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '12px',
                        color: '#666',
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {n.message}
                    </p>
                    <span style={{ fontSize: '11px', color: '#AAA', marginTop: '4px', display: 'inline-block' }}>
                      {new Date(n.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Quick Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }}>
                    {!n.is_read && (
                      <button
                        type="button"
                        onClick={(e) => handleMarkOneRead(e, n.id)}
                        title="Mark as read"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#7952EC',
                          fontSize: '14px',
                          padding: '2px',
                        }}
                      >
                        ✓
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, n.id)}
                      title="Delete"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#CCC',
                        fontSize: '13px',
                        padding: '2px',
                      }}
                      onMouseEnter={(e) => (e.target.style.color = '#DC2626')}
                      onMouseLeave={(e) => (e.target.style.color = '#CCC')}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
