import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  getApiBaseUrl,
  getStoredToken,
  setStoredToken,
  clearStoredToken,
  authAPI,
} from './api.js';

describe('KEYFLOW Auth & API Integration Tests', () => {
  describe('API Base URL Normalization Engine', () => {
    it('defaults to /api in browser environment (window defined) and http://127.0.0.1:8000/api in SSR/Node', () => {
      // In Node environment without window
      assert.equal(getApiBaseUrl(''), 'http://127.0.0.1:8000/api');

      // In browser environment with window defined
      globalThis.window = {};
      assert.equal(getApiBaseUrl(''), '/api');
      assert.equal(getApiBaseUrl('   '), '/api');
      delete globalThis.window;
    });

    it('appends /api when a bare domain is provided without /api', () => {
      assert.equal(getApiBaseUrl('https://api.keyflow.app'), 'https://api.keyflow.app/api');
      assert.equal(getApiBaseUrl('https://backend-service.railway.app'), 'https://backend-service.railway.app/api');
    });

    it('removes trailing slash and appends /api cleanly', () => {
      assert.equal(getApiBaseUrl('https://api.keyflow.app/'), 'https://api.keyflow.app/api');
      assert.equal(getApiBaseUrl('http://localhost:8000/'), 'http://localhost:8000/api');
    });

    it('preserves existing /api without creating duplicate slashes or /api/api', () => {
      assert.equal(getApiBaseUrl('https://api.keyflow.app/api'), 'https://api.keyflow.app/api');
      assert.equal(getApiBaseUrl('https://api.keyflow.app/api/'), 'https://api.keyflow.app/api');
      assert.equal(getApiBaseUrl('http://127.0.0.1:8000/api///'), 'http://127.0.0.1:8000/api');
    });
  });

  describe('Knox Token Persistence in LocalStorage', () => {
    const memoryStorage = {};
    beforeEach(() => {
      globalThis.localStorage = {
        getItem: (k) => memoryStorage[k] || null,
        setItem: (k, v) => { memoryStorage[k] = String(v); },
        removeItem: (k) => { delete memoryStorage[k]; },
      };
      clearStoredToken();
    });

    it('saves, retrieves, and clears authentication tokens correctly', () => {
      assert.equal(getStoredToken(), null);

      setStoredToken('knox_test_token_abc123');
      assert.equal(getStoredToken(), 'knox_test_token_abc123');

      clearStoredToken();
      assert.equal(getStoredToken(), null);
    });
  });

  describe('Auth API Endpoint Definitions', () => {
    it('exposes all required authentication and password-reset methods', () => {
      assert.equal(typeof authAPI.register, 'function');
      assert.equal(typeof authAPI.login, 'function');
      assert.equal(typeof authAPI.googleLogin, 'function');
      assert.equal(typeof authAPI.logout, 'function');
      assert.equal(typeof authAPI.logoutAll, 'function');
      assert.equal(typeof authAPI.me, 'function');
      assert.equal(typeof authAPI.passwordResetRequest, 'function');
      assert.equal(typeof authAPI.passwordResetValidate, 'function');
      assert.equal(typeof authAPI.passwordResetConfirm, 'function');
    });
  });

  describe('Practice, Arcade & Quotes API Endpoint Definitions', () => {
    it('exposes practice, arcade, and quotes persistence methods', async () => {
      const { practiceAPI, gamesAPI, quotesAPI } = await import('./api.js');
      assert.equal(typeof practiceAPI.recordSession, 'function');
      assert.equal(typeof practiceAPI.getHistory, 'function');
      assert.equal(typeof practiceAPI.getPassages, 'function');
      assert.equal(typeof gamesAPI.recordSession, 'function');
      assert.equal(typeof gamesAPI.getRecords, 'function');
      assert.equal(typeof quotesAPI.getCurrent, 'function');
      assert.equal(typeof quotesAPI.rotate, 'function');
    });
  });

  describe('Guest Progress Migration to Account', () => {
    it('migrates completed guest lessons to server via recordApiFn', async () => {
      globalThis.window = { dispatchEvent: () => {} };
      globalThis.CustomEvent = class CustomEvent {
        constructor(type, eventInitDict) {
          this.type = type;
          this.detail = eventInitDict?.detail;
        }
      };

      const { migrateGuestProgressToAccount } = await import('./lessonProgress.js');

      const mockGuestState = {
        lessons: {
          'S1-L001': { completed: true, bestWpm: 45, bestAccuracy: 98, stars: 3 },
          'S1-L002': { completed: true, bestWpm: 52, bestAccuracy: 99, stars: 4 },
          'S1-L003': { completed: false, bestWpm: 20, bestAccuracy: 80, stars: 0 },
        },
      };

      globalThis.localStorage.setItem(
        'keyflow_lesson_progress_guest',
        JSON.stringify(mockGuestState)
      );

      const recordedCalls = [];
      const mockRecordApi = async (data) => {
        recordedCalls.push(data);
      };

      await migrateGuestProgressToAccount('user_123', mockRecordApi);

      assert.equal(recordedCalls.length, 2);
      assert.equal(recordedCalls[0].stage, 1);
      assert.equal(recordedCalls[0].lesson, 1);
      assert.equal(recordedCalls[0].wpm, 45);
      assert.equal(recordedCalls[1].lesson, 2);
      assert.equal(recordedCalls[1].wpm, 52);
    });
  });

  describe('Guest Arcade Migration & Sync', () => {
    it('migrates guest arcade records and merges backend summary', async () => {
      globalThis.window = { dispatchEvent: () => {} };
      globalThis.CustomEvent = class CustomEvent {
        constructor(type, eventInitDict) {
          this.type = type;
          this.detail = eventInitDict?.detail;
        }
      };

      const {
        syncArcadeRecordsFromBackend,
        getArcadeRecords,
        setArcadeStorageUser,
      } = await import('./arcadeStorage.js');

      setArcadeStorageUser('user_456');

      const mockServerRecords = {
        cascade: { bestScore: 2500, bestCombo: 25, gamesPlayed: 5 },
        sprint: { bestWpm: 92, bestAccuracy: 98.5, gamesPlayed: 3 },
      };

      syncArcadeRecordsFromBackend(mockServerRecords);
      const synced = getArcadeRecords();

      assert.equal(synced.cascade.bestScore, 2500);
      assert.equal(synced.cascade.bestCombo, 25);
      assert.equal(synced.sprint.bestWpm, 92);

      setArcadeStorageUser(null);
    });
  });
});
