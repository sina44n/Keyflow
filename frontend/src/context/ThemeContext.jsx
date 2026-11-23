import React, { createContext, useContext, useState, useEffect } from 'react';
import { profileAPI } from '../utils/api';
import { THEMES, THEME_STORAGE_KEY, DEFAULT_THEME_ID } from './themes.js';

export { THEMES, THEME_STORAGE_KEY, DEFAULT_THEME_ID };

const getInitialTheme = () => {
  try {
    const userId = typeof localStorage !== 'undefined' ? localStorage.getItem('keyflow_current_user_id') : null;
    const userKey = userId ? `keyflow_theme_u_${userId}` : null;
    const stored = (userKey && localStorage.getItem(userKey)) || localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'espresso-latte') {
      return 'glacier-aqua';
    }
    if (stored && THEMES.some((t) => t.id === stored)) {
      return stored;
    }
  } catch {
    // Fallback if localStorage is inaccessible
  }
  return 'burgundy-cream';
};

const ThemeContext = createContext({
  theme: 'burgundy-cream',
  setTheme: () => {},
  themes: THEMES,
  currentThemeObj: THEMES.find((t) => t.id === 'burgundy-cream') || THEMES[0],
});

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(getInitialTheme);

  // Sync theme when account preferences are restored
  useEffect(() => {
    const handleSync = (e) => {
      const remoteTheme = e.detail;
      if (remoteTheme && THEMES.some((t) => t.id === remoteTheme)) {
        // Prevent stale remote sync from overriding a recent explicit local user selection (within 15s)
        try {
          const lastLocalSet = Number(localStorage.getItem('keyflow_theme_timestamp')) || 0;
          if (Date.now() - lastLocalSet < 15000) {
            return;
          }
        } catch {}

        setThemeState(remoteTheme);
        try {
          const userId = localStorage.getItem('keyflow_current_user_id');
          const key = userId ? `keyflow_theme_u_${userId}` : THEME_STORAGE_KEY;
          localStorage.setItem(key, remoteTheme);
          localStorage.setItem(THEME_STORAGE_KEY, remoteTheme);
        } catch {}
        document.documentElement.setAttribute('data-theme', remoteTheme);
      }
    };

    const handleStorage = (e) => {
      if ((e.key === THEME_STORAGE_KEY || (e.key && e.key.startsWith('keyflow_theme_u_'))) && e.newValue && THEMES.some((t) => t.id === e.newValue)) {
        setThemeState(e.newValue);
        document.documentElement.setAttribute('data-theme', e.newValue);
      }
    };

    window.addEventListener('keyflow-theme-sync', handleSync);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('keyflow-theme-sync', handleSync);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const setTheme = (themeId) => {
    if (!THEMES.some((t) => t.id === themeId)) return;
    setThemeState(themeId);
    try {
      const userId = localStorage.getItem('keyflow_current_user_id');
      const key = userId ? `keyflow_theme_u_${userId}` : THEME_STORAGE_KEY;
      localStorage.setItem(key, themeId);
      localStorage.setItem(THEME_STORAGE_KEY, themeId);
      localStorage.setItem('keyflow_theme_timestamp', Date.now().toString());

      if (userId) {
        profileAPI.updatePreferences({ theme_preset: themeId }).catch(() => {});
      }
    } catch {
      // localStorage may fail in restricted iframes/private modes
    }
    document.documentElement.setAttribute('data-theme', themeId);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const currentThemeObj = THEMES.find((t) => t.id === theme) || THEMES[0];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES, currentThemeObj }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
