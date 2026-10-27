/**
 * KEYFLOW API Client
 * ==================
 * Centralized axios instance with Knox token authentication.
 * Auto-injects Authorization header from stored token.
 * Handles 401 responses by clearing stale auth state.
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// ---------------------------------------------------------------------------
// Token Storage (localStorage — Knox tokens are long-lived, per-device)
// ---------------------------------------------------------------------------
const TOKEN_KEY = 'keyflow_auth_token';

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);
export const setStoredToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearStoredToken = () => localStorage.removeItem(TOKEN_KEY);

// ---------------------------------------------------------------------------
// Request Interceptor — inject Knox token
// ---------------------------------------------------------------------------
api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// Response Interceptor — handle 401 (expired/invalid token)
// ---------------------------------------------------------------------------
api.interceptors.response.use(
  (response) => response,
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
  register: (data) => api.post('/auth/register/', data),
  login: (data) => api.post('/auth/login/', data),
  logout: () => api.post('/auth/logout/'),
  logoutAll: () => api.post('/auth/logout-all/'),
  me: () => api.get('/auth/me/'),
  changePassword: (data) => api.post('/auth/change-password/', data),
  verifyEmail: (token) => api.post('/auth/verify-email/', { token }),
  resendVerification: () => api.post('/auth/resend-verification/'),
  passwordResetRequest: (email) => api.post('/auth/password-reset/', { email }),
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
// Quotes API Methods
// ---------------------------------------------------------------------------
export const quotesAPI = {
  getCurrent: () => api.get('/quotes/current/'),
  rotate: () => api.post('/quotes/rotate/'),
};

export default api;
