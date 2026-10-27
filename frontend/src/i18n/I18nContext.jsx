/**
 * KEYFLOW i18n Context
 * ====================
 * Manages active language state across 17 languages, dictionary lookups,
 * safe fallback to English, parameter interpolation, locale-aware formatting,
 * and RTL text direction toggling for Arabic.
 *
 * Persists preferences in localStorage and synchronizes with authenticated
 * user backend profile with clearly defined precedence.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { SUPPORTED_LANGUAGES, TRANSLATIONS } from './locales';
import { profileAPI } from '../utils/api';
import { AuthContext } from '../context/AuthContext';

const I18nContext = createContext(null);

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
};

const STORAGE_KEY = 'keyflow_user_language';

export const I18nProvider = ({ children }) => {
  // Safe access to auth context if rendered within AuthProvider
  const auth = useContext(AuthContext);

  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || 'en';
  });

  const activeLangConfig = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];
  const isRTL = activeLangConfig.dir === 'rtl';

  // Apply direction, lang attribute, and CSS class to document & body
  useEffect(() => {
    document.documentElement.dir = activeLangConfig.dir;
    document.documentElement.lang = language;
    if (activeLangConfig.dir === 'rtl') {
      document.body.classList.add('rtl-mode');
    } else {
      document.body.classList.remove('rtl-mode');
    }
  }, [language, activeLangConfig]);

  // Synchronize authenticated user preference on session restoration / login
  const prevUserIdRef = useRef(null);
  useEffect(() => {
    if (!auth || auth.isLoading) return;

    if (auth.user) {
      const currentUserId = auth.user.id;
      const accountLang = auth.user.preferences?.language;

      // On new user login or account switch, prefer account preference if valid
      if (prevUserIdRef.current !== currentUserId && accountLang) {
        prevUserIdRef.current = currentUserId;
        const valid = SUPPORTED_LANGUAGES.some((l) => l.code === accountLang);
        if (valid && accountLang !== language) {
          setLanguageState(accountLang);
          localStorage.setItem(STORAGE_KEY, accountLang);
        }
      }
    } else {
      // User logged out or guest: preserve existing language in state/localStorage
      prevUserIdRef.current = null;
    }
  }, [auth?.user, auth?.isLoading, language]);

  // Explicit language selector action
  const setLanguage = useCallback((langCode) => {
    const valid = SUPPORTED_LANGUAGES.some((l) => l.code === langCode);
    const chosen = valid ? langCode : 'en';
    setLanguageState(chosen);
    localStorage.setItem(STORAGE_KEY, chosen);

    // Sync to backend profile if authenticated (silently handles unauthenticated visitors)
    if (auth?.isAuthenticated) {
      profileAPI.updatePreferences({ language: chosen }).catch(() => {});
    }
  }, [auth?.isAuthenticated]);

  // Translation function supporting safe English fallback and parameter interpolation
  const t = useCallback(
    (key, paramsOrFallback = '', fallback = '') => {
      let params = null;
      let defaultText = '';

      if (typeof paramsOrFallback === 'object' && paramsOrFallback !== null) {
        params = paramsOrFallback;
        defaultText = fallback;
      } else if (typeof paramsOrFallback === 'string') {
        defaultText = paramsOrFallback;
      }

      const langDict = TRANSLATIONS[language] || {};
      let text = langDict[key];

      if (text === undefined) {
        const fallbackDict = TRANSLATIONS.en || {};
        text = fallbackDict[key];

        // Missing key diagnostic in development
        if (text === undefined && typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
          console.warn(`[i18n] Missing translation key "${key}" for language "${language}" and fallback "en"`);
        }
      }

      if (text === undefined) {
        text = defaultText || key;
      }

      // Parameter interpolation for {varName} patterns
      if (params && typeof text === 'string') {
        Object.entries(params).forEach(([paramKey, paramVal]) => {
          text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
        });
      }

      return text;
    },
    [language]
  );

  // Locale-aware formatting helpers
  const formatNumber = useCallback(
    (value, options = {}) => {
      try {
        return new Intl.NumberFormat(language, options).format(value);
      } catch {
        return String(value);
      }
    },
    [language]
  );

  const formatDate = useCallback(
    (date, options = { dateStyle: 'medium' }) => {
      try {
        const d = date instanceof Date ? date : new Date(date);
        return new Intl.DateTimeFormat(language, options).format(d);
      } catch {
        return String(date);
      }
    },
    [language]
  );

  const formatTime = useCallback(
    (date, options = { timeStyle: 'short' }) => {
      try {
        const d = date instanceof Date ? date : new Date(date);
        return new Intl.DateTimeFormat(language, options).format(d);
      } catch {
        return String(date);
      }
    },
    [language]
  );

  const value = {
    language,
    setLanguage,
    t,
    isRTL,
    dir: activeLangConfig.dir,
    supportedLanguages: SUPPORTED_LANGUAGES,
    currentLanguageConfig: activeLangConfig,
    formatNumber,
    formatDate,
    formatTime,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};
