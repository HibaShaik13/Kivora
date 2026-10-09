import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '380px',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            style={{
              pointerEvents: 'auto',
              cursor: 'pointer',
              padding: '12px 18px',
              borderRadius: 'var(--radius-md)',
              background: toast.type === 'error' ? 'var(--status-error-bg)' : toast.type === 'success' ? 'var(--status-success-bg)' : 'var(--bg-surface)',
              color: toast.type === 'error' ? 'var(--status-error)' : toast.type === 'success' ? 'var(--status-success)' : 'var(--text-primary)',
              border: `1px solid ${toast.type === 'error' ? 'var(--status-error-border)' : toast.type === 'success' ? 'var(--status-success-border)' : 'var(--border-subtle)'}`,
              boxShadow: 'var(--shadow-md)',
              fontSize: '0.875rem',
              fontWeight: '500',
              fontFamily: 'var(--font-family-body)',
              animation: 'slideIn 200ms ease-out',
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
