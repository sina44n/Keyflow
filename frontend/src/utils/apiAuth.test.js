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
});
