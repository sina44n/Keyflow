/**
 * KEYFLOW Custom Text Storage & Library
 * =====================================
 * Manages persisted custom texts per user/guest.
 * Uses safe JSON parsing, input validation, and isolated keys.
 */

import { removeZeroWidth } from './textUtilities.js';
import { practiceAPI } from './api.js';

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
  let resolvedId = userId;
  if (!resolvedId && typeof localStorage !== 'undefined') {
    try {
      resolvedId = localStorage.getItem('keyflow_current_user_id');
    } catch {}
  }
  return `keyflow_custom_texts_${resolvedId || 'guest'}`;
};

const notifyCustomTextsChanged = () => {
  if (typeof window !== 'undefined' && window.dispatchEvent) {
    window.dispatchEvent(new CustomEvent('keyflow-custom-texts-updated'));
  }
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
 * Fetch and reconcile custom texts from the persistent backend database.
 * Merges backend records with local storage for true multi-device account persistence.
 */
export const fetchAndSyncCustomTexts = async (userId = null) => {
  if (!userId || typeof window === 'undefined') {
    return getSavedCustomTexts(userId);
  }

  try {
    const response = await practiceAPI.getCustomPassages();
    const backendItems = response.data || [];

    const formattedBackend = backendItems.map((p) => ({
      id: `backend_${p.id}`,
      backendId: p.id,
      title: p.title,
      text: p.text,
      wordCount: p.word_count || p.text.split(/\s+/).filter(Boolean).length,
      charCount: p.char_count || p.text.length,
      createdAt: new Date(p.created_at).getTime(),
      updatedAt: new Date(p.updated_at).getTime(),
    }));

    const key = getStorageKey(userId);
    const local = getSavedCustomTexts(userId);

    // Identify any local custom passages not yet persisted to backend
    const unsyncedLocal = local.filter(
      (item) =>
        item.id.startsWith('ct_') &&
        !item.backendId &&
        !formattedBackend.some((b) => b.title === item.title && b.text === item.text)
    );

    // Asynchronously push any unsynced local creations to backend
    for (const unsynced of unsyncedLocal) {
      try {
        const createRes = await practiceAPI.createCustomPassage({
          title: unsynced.title,
          text: unsynced.text,
        });
        if (createRes.data?.id) {
          unsynced.backendId = createRes.data.id;
          unsynced.id = `backend_${createRes.data.id}`;
        }
      } catch (uploadErr) {
        console.warn('Background sync upload notice:', uploadErr);
      }
    }

    // Retain starter texts for new users if no custom passages exist yet
    const starters = local.filter((item) => item.id.startsWith('starter_'));
    const merged = [
      ...formattedBackend,
      ...unsyncedLocal.filter((u) => !formattedBackend.some((b) => b.backendId === u.backendId)),
      ...(formattedBackend.length === 0 ? starters : []),
    ];

    localStorage.setItem(key, JSON.stringify(merged));
    notifyCustomTextsChanged();
    return merged;
  } catch (err) {
    console.warn('Failed to sync custom passages with backend, using cached local copy:', err);
    return getSavedCustomTexts(userId);
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

  const localId = `ct_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newEntry = {
    id: localId,
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
    notifyCustomTextsChanged();
  } catch (err) {
    console.error('Failed to save custom text to localStorage:', err);
  }

  // Persist to backend database when authenticated
  if (userId) {
    practiceAPI
      .createCustomPassage({ title: sanitizedTitle, text: sanitizedText })
      .then((res) => {
        if (res.data?.id) {
          const fresh = getSavedCustomTexts(userId);
          const idx = fresh.findIndex((i) => i.id === localId);
          if (idx !== -1) {
            fresh[idx].backendId = res.data.id;
            fresh[idx].id = `backend_${res.data.id}`;
            localStorage.setItem(getStorageKey(userId), JSON.stringify(fresh));
            notifyCustomTextsChanged();
          }
        }
      })
      .catch((err) => {
        console.warn('Background custom passage creation notice:', err);
      });
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

  const backendId = existing[index].backendId || (String(id).startsWith('backend_') ? id.replace('backend_', '') : null);

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
    notifyCustomTextsChanged();
  } catch (err) {
    console.error('Failed to update custom text in localStorage:', err);
  }

  // Persist update to backend database when authenticated
  if (userId && backendId) {
    practiceAPI
      .updateCustomPassage(backendId, { title: sanitizedTitle, text: sanitizedText })
      .catch((err) => {
        console.warn('Background custom passage update notice:', err);
      });
  }

  return updatedEntry;
};

/**
 * Delete a custom text entry.
 */
export const deleteCustomText = (id, userId = null) => {
  const existing = getSavedCustomTexts(userId);
  const target = existing.find((item) => item.id === id);
  const backendId = target?.backendId || (String(id).startsWith('backend_') ? id.replace('backend_', '') : null);

  const filtered = existing.filter((item) => item.id !== id);
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(filtered));
    notifyCustomTextsChanged();
  } catch (err) {
    console.error('Failed to delete custom text from localStorage:', err);
  }

  // Persist deletion to backend database when authenticated
  if (userId && backendId) {
    practiceAPI.deleteCustomPassage(backendId).catch((err) => {
      console.warn('Background custom passage deletion notice:', err);
    });
  }

  return filtered;
};
