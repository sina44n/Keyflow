/**
 * KEYFLOW Custom Text Storage & Library
 * =====================================
 * Manages persisted custom texts per user/guest.
 * Uses safe JSON parsing, input validation, and isolated keys.
 */

import { removeZeroWidth } from './textUtilities.js';

const STARTER_CUSTOM_TEXTS = [
  {
    id: 'starter_quote_seneca',
    title: 'Seneca on Time',
    text: 'It is not that we have a short time to live, but that we waste a lot of it. Life is long enough, and a sufficiently generous estimate has been given to us for the highest achievements if it were all well invested.',
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
    wordCount: 42,
    charCount: 219,
  },
  {
    id: 'starter_code_python',
    title: 'Python List Comprehension',
    text: 'numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]\nsquares = [x ** 2 for x in numbers if x % 2 == 0]\nprint("Even squares:", squares)',
    createdAt: 1700000000001,
    updatedAt: 1700000000001,
    wordCount: 22,
    charCount: 126,
  },
  {
    id: 'starter_cadence_rhythm',
    title: 'Rhythm and Cadence',
    text: 'The best typists do not hurry their fingers. They establish a continuous, unbroken pulse. Each strike sounds at the exact same interval, building speed through harmony.',
    createdAt: 1700000000002,
    updatedAt: 1700000000002,
    wordCount: 28,
    charCount: 169,
  },
];

const getStorageKey = (userId) => {
  return `keyflow_custom_texts_${userId || 'guest'}`;
};

/**
 * Retrieve all saved custom texts for the current user/guest.
 */
export const getSavedCustomTexts = (userId = null) => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [...STARTER_CUSTOM_TEXTS];
  }
  const key = getStorageKey(userId);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      // First time initialization: populate starters
      localStorage.setItem(key, JSON.stringify(STARTER_CUSTOM_TEXTS));
      return [...STARTER_CUSTOM_TEXTS];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [...STARTER_CUSTOM_TEXTS];
  } catch (err) {
    console.warn('KEYFLOW custom text read notice:', err);
    return [...STARTER_CUSTOM_TEXTS];
  }
};

/**
 * Save a new custom text entry.
 */
export const saveCustomText = ({ title, text, userId = null }) => {
  const sanitizedText = removeZeroWidth(text || '').trim();
  if (!sanitizedText) {
    throw new Error('Text content cannot be empty.');
  }

  const sanitizedTitle = (title || '').trim() || `Custom Text (${new Date().toLocaleDateString()})`;
  const existing = getSavedCustomTexts(userId);

  const words = sanitizedText.split(/\s+/).filter(Boolean).length;
  const chars = sanitizedText.length;

  const newEntry = {
    id: `ct_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: sanitizedTitle,
    text: sanitizedText,
    wordCount: words,
    charCount: chars,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const updated = [newEntry, ...existing];
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save custom text to localStorage:', err);
  }
  return newEntry;
};

/**
 * Update an existing custom text entry.
 */
export const updateCustomText = (id, { title, text }, userId = null) => {
  const existing = getSavedCustomTexts(userId);
  const index = existing.findIndex((item) => item.id === id);
  if (index === -1) {
    throw new Error('Custom text entry not found.');
  }

  const sanitizedText = removeZeroWidth(text !== undefined ? text : existing[index].text).trim();
  if (!sanitizedText) {
    throw new Error('Text content cannot be empty.');
  }

  const sanitizedTitle = (title !== undefined ? title : existing[index].title).trim() || existing[index].title;
  const words = sanitizedText.split(/\s+/).filter(Boolean).length;
  const chars = sanitizedText.length;

  const updatedEntry = {
    ...existing[index],
    title: sanitizedTitle,
    text: sanitizedText,
    wordCount: words,
    charCount: chars,
    updatedAt: Date.now(),
  };

  existing[index] = updatedEntry;
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(existing));
  } catch (err) {
    console.error('Failed to update custom text in localStorage:', err);
  }
  return updatedEntry;
};

/**
 * Delete a custom text entry.
 */
export const deleteCustomText = (id, userId = null) => {
  const existing = getSavedCustomTexts(userId);
  const filtered = existing.filter((item) => item.id !== id);
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to delete custom text from localStorage:', err);
  }
  return filtered;
};
