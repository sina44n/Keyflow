/**
 * KEYFLOW i18n Context
 * ====================
 * Manages active language state, dictionary lookups, fallback behavior,
 * and RTL text direction toggling.
 * Persists preferences in localStorage and synchronizes with backend profile.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SUPPORTED_LANGUAGES, TRANSLATIONS } from './locales';
import { profileAPI } from '../utils/api';

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
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || 'en';
  });

  const activeLangConfig = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];
  const isRTL = activeLangConfig.dir === 'rtl';

  // Apply direction and lang attribute to document
  useEffect(() => {
    document.documentElement.dir = activeLangConfig.dir;
    document.documentElement.lang = language;
  }, [language, activeLangConfig]);

  const setLanguage = useCallback((langCode) => {
    const valid = SUPPORTED_LANGUAGES.some((l) => l.code === langCode);
    const chosen = valid ? langCode : 'en';
    setLanguageState(chosen);
    localStorage.setItem(STORAGE_KEY, chosen);

    // Sync to backend profile if authenticated (silently fails if unauthenticated)
    profileAPI.updatePreferences({ language: chosen }).catch(() => {});
  }, []);

  // Translation function with safe English fallback
  const t = useCallback(
    (key, defaultText = '') => {
      const langDict = TRANSLATIONS[language] || {};
      if (langDict[key] !== undefined) {
        return langDict[key];
      }
      const fallbackDict = TRANSLATIONS.en || {};
      if (fallbackDict[key] !== undefined) {
        return fallbackDict[key];
      }
      return defaultText || key;
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
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};
