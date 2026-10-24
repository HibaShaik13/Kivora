/**
 * Kivora Theme Manager
 * Provides light/dark theme switching, localStorage persistence, 
 * flash-prevention synchronization, and cross-component reactive updates.
 */

import { useState, useEffect } from 'react';

export const getSavedTheme = () => {
  try {
    const saved = localStorage.getItem('kivora_theme');
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
  } catch {
    // fallback
  }
  return 'light';
};

export const applyTheme = (theme) => {
  const safeTheme = theme === 'dark' ? 'dark' : 'light';
  try {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', safeTheme);
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('kivora_theme', safeTheme);
    }
  } catch (err) {
    console.warn('Failed to persist theme preference:', err);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('kivora_theme_change', { detail: safeTheme }));
  }

  return safeTheme;
};

export const toggleTheme = () => {
  let current = 'light';
  if (typeof document !== 'undefined') {
    current = document.documentElement.getAttribute('data-theme') || getSavedTheme();
  } else {
    current = getSavedTheme();
  }
  const next = current === 'dark' ? 'light' : 'dark';
  return applyTheme(next);
};

export const useTheme = () => {
  const [theme, setThemeState] = useState(() => {
    if (typeof document !== 'undefined') {
      const activeAttr = document.documentElement.getAttribute('data-theme');
      if (activeAttr === 'dark' || activeAttr === 'light') return activeAttr;
    }
    return getSavedTheme();
  });

  useEffect(() => {
    // Synchronize document attribute on mount
    applyTheme(theme);

    const handleThemeChange = (e) => {
      if (e.detail && (e.detail === 'dark' || e.detail === 'light')) {
        setThemeState(e.detail);
      }
    };

    window.addEventListener('kivora_theme_change', handleThemeChange);
    return () => {
      window.removeEventListener('kivora_theme_change', handleThemeChange);
    };
  }, []);

  const setTheme = (newTheme) => {
    const applied = applyTheme(newTheme);
    setThemeState(applied);
  };

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  return { theme, setTheme, toggleTheme: toggle };
};
