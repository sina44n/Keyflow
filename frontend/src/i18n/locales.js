/**
 * KEYFLOW Multilingual Localization System
 * =========================================
 * Provides comprehensive translations for navigation, authentication,
 * error messages, quotes, workstation, academy, and 7 arcade games
 * across 17 languages.
 * Includes RTL support metadata for Arabic.
 */

import en from './locales/en.js';
import ml from './locales/ml.js';
import hi from './locales/hi.js';
import ar from './locales/ar.js';
import ta from './locales/ta.js';
import te from './locales/te.js';
import kn from './locales/kn.js';
import bn from './locales/bn.js';
import es from './locales/es.js';
import fr from './locales/fr.js';
import de from './locales/de.js';
import pt from './locales/pt.js';
import ja from './locales/ja.js';
import ko from './locales/ko.js';
import zh from './locales/zh.js';
import it from './locales/it.js';
import id from './locales/id.js';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', dir: 'ltr' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', dir: 'ltr' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', dir: 'ltr' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', dir: 'ltr' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', dir: 'ltr' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr' },
  { code: 'fr', name: 'French', nativeName: 'Français', dir: 'ltr' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', dir: 'ltr' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', dir: 'ltr' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', dir: 'ltr' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', dir: 'ltr' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', dir: 'ltr' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', dir: 'ltr' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', dir: 'ltr' },
];

export const TRANSLATIONS = {
  en,
  ml,
  hi,
  ar,
  ta,
  te,
  kn,
  bn,
  es,
  fr,
  de,
  pt,
  ja,
  ko,
  zh,
  it,
  id,
};
