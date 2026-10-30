/**
 * KEYFLOW API Client
 * ==================
 * Centralized axios instance with Knox token authentication.
 * Auto-injects Authorization header from stored token.
 * Handles 401 responses by clearing stale auth state.
 */

import axios from 'axios';

export const getApiBaseUrl = (customEnvUrl) => {
  const envUrl = customEnvUrl !== undefined
    ? String(customEnvUrl || '').trim()
    : (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL ? String(import.meta.env.VITE_API_URL).trim() : '');
  if (envUrl) {
    const cleanUrl = envUrl.replace(/\/+$/, '');
    return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
  }
  return typeof window !== 'undefined' ? '/api' : 'http://127.0.0.1:8000/api';
};

export const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// ---------------------------------------------------------------------------
// Token Storage & Dynamic Clerk Token Provider
// ---------------------------------------------------------------------------
const TOKEN_KEY = 'keyflow_auth_token';

let tokenGetter = null;
export const registerTokenGetter = (fn) => {
  tokenGetter = fn;
};

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);
export const setStoredToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearStoredToken = () => localStorage.removeItem(TOKEN_KEY);

// ---------------------------------------------------------------------------
// Request Interceptor — inject Clerk Bearer JWT or Knox token
// ---------------------------------------------------------------------------
api.interceptors.request.use(
  async (config) => {
    let token = null;
    if (tokenGetter) {
      try {
        token = await tokenGetter();
      } catch {}
    }
    if (!token) {
      token = getStoredToken();
    }
    if (token) {
      // If token is JWT (3 dot-separated segments), use Bearer for Clerk
      if (typeof token === 'string' && token.split('.').length === 3) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        config.headers.Authorization = `Token ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// Response Interceptor — handle 401 & HTML SPA fallback responses
// ---------------------------------------------------------------------------
api.interceptors.response.use(
  (response) => {
    // If the backend returns HTML (e.g. Vercel SPA rewrite fallback when VITE_API_URL is missing)
    if (typeof response.data === 'string' && /^\s*<!doctype\s+html/i.test(response.data)) {
      const err = new Error(
        'Received an HTML response instead of JSON. Ensure VITE_API_URL is configured to point to the Django API.'
      );
      err.isSpaFallback = true;
      err.response = response;
      return Promise.reject(err);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      clearStoredToken();
      // Dispatch a custom event so AuthContext can react
      window.dispatchEvent(new CustomEvent('keyflow-auth-expired'));
    }
    return Promise.reject(error);
  }
);

// ---------------------------------------------------------------------------
// Auth API Methods
// ---------------------------------------------------------------------------
export const authAPI = {
  clerkSync: (data) => api.post('/auth/clerk-sync/', data || {}),
  register: (data) => api.post('/auth/register/', data),
  login: (data) => api.post('/auth/login/', data),
  googleLogin: (payload) =>
    api.post('/auth/google/', typeof payload === 'string' ? { id_token: payload } : payload),
  logout: () => api.post('/auth/logout/'),
  logoutAll: () => api.post('/auth/logout-all/'),
  me: () => api.get('/auth/me/'),
  updateMe: (data) => api.patch('/auth/me/', data),
  deleteAccount: (password) => api.delete('/auth/me/', { data: { password } }),
  changePassword: (data) => api.post('/auth/change-password/', data),
  verifyEmail: (token) => api.post('/auth/verify-email/', { token }),
  resendVerification: () => api.post('/auth/resend-verification/'),
  passwordResetRequest: (email) => api.post('/auth/password-reset/', { email }),
  passwordResetValidate: (token) => api.post('/auth/password-reset/validate_token/', { token }),
  passwordResetConfirm: (token, password) =>
    api.post('/auth/password-reset/confirm/', { token, password }),
};

// ---------------------------------------------------------------------------
// Profile API Methods
// ---------------------------------------------------------------------------
export const profileAPI = {
  get: () => api.get('/profile/'),
  update: (data) => api.patch('/profile/', data),
  getPreferences: () => api.get('/profile/preferences/'),
  updatePreferences: (data) => api.patch('/profile/preferences/', data),
};

// ---------------------------------------------------------------------------
// Lessons & Progression API Methods
// ---------------------------------------------------------------------------
export const lessonsAPI = {
  recordProgress: (data) => api.post('/lessons/record/', data),
  getProgress: () => api.get('/lessons/progress/'),
  getProgressSummary: () => api.get('/lessons/progress/summary/'),
};

// ---------------------------------------------------------------------------
// Practice & Typing Sessions API Methods
// ---------------------------------------------------------------------------
export const practiceAPI = {
  getPassages: (params) => api.get('/practice/passages/', { params }),
  getPassage: (id) => api.get(`/practice/passages/${id}/`),
  recordSession: (data) => api.post('/practice/sessions/', data),
  getHistory: () => api.get('/practice/history/'),
  getCompetitions: (params) => api.get('/practice/competitions/', { params }),
  createCompetition: (data) => api.post('/practice/competitions/', data),
  getCompetition: (code) => api.get(`/practice/competitions/${code}/`),
  joinCompetition: (code, data) => api.post(`/practice/competitions/${code}/join/`, data),
  submitCompetition: (code, data) => api.post(`/practice/competitions/${code}/submit/`, data),
  getMyCompetitions: () => api.get('/practice/competitions/my/'),
};

export const competitionAPI = {
  list: (params) => api.get('/practice/competitions/', { params }),
  create: (data) => api.post('/practice/competitions/', data),
  get: (code) => api.get(`/practice/competitions/${code}/`),
  join: (code, data) => api.post(`/practice/competitions/${code}/join/`, data),
  submit: (code, data) => api.post(`/practice/competitions/${code}/submit/`, data),
  my: () => api.get('/practice/competitions/my/'),
};

// ---------------------------------------------------------------------------
// Arcade Games API Methods
// ---------------------------------------------------------------------------
export const gamesAPI = {
  recordSession: (data) => api.post('/games/record/', data),
  getRecords: () => api.get('/games/records/'),
  getStats: (guestId) => api.get('/games/stats/', { params: guestId ? { guest_id: guestId } : {} }),
  toggleLike: (gameId, guestId) => api.post(`/games/${gameId}/like/`, { guest_id: guestId }),
  recordPlay: (gameId, sessionId, guestId) =>
    api.post(`/games/${gameId}/play/`, { sessionId, guest_id: guestId }),
};

// ---------------------------------------------------------------------------
// Quotes API Methods
// ---------------------------------------------------------------------------
export const quotesAPI = {
  getCurrent: (lang) => api.get('/quotes/current/', { params: lang ? { lang } : {} }),
  rotate: (lang) => api.post('/quotes/rotate/', {}, { params: lang ? { lang } : {} }),
};

export default api;
