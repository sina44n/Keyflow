/**
 * KEYFLOW Auth Context
 * ====================
 * Provides authentication state across the entire app.
 * Uses Knox token authentication with the Django backend.
 *
 * State: { user, token, isAuthenticated, isLoading }
 * Methods: login, register, logout, refreshUser
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authAPI, setStoredToken, clearStoredToken, getStoredToken } from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  // -----------------------------------------------------------------------
  // Restore session on mount — check stored token validity
  // -----------------------------------------------------------------------
  useEffect(() => {
    const restoreSession = async () => {
      const token = getStoredToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await authAPI.me();
        if (mountedRef.current) {
          setUser(res.data);
        }
      } catch {
        // Token expired or invalid
        clearStoredToken();
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };
    restoreSession();
    return () => { mountedRef.current = false; };
  }, []);

  // -----------------------------------------------------------------------
  // Listen for auth-expired events from API interceptor
  // -----------------------------------------------------------------------
  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
    };
    window.addEventListener('keyflow-auth-expired', handleExpired);
    return () => window.removeEventListener('keyflow-auth-expired', handleExpired);
  }, []);

  // -----------------------------------------------------------------------
  // Register
  // -----------------------------------------------------------------------
  const register = useCallback(async ({ email, username, password, password2 }) => {
    const res = await authAPI.register({ email, username, password, password2 });
    const { token, user: userData } = res.data;
    setStoredToken(token);
    setUser(userData);
    return userData;
  }, []);

  // -----------------------------------------------------------------------
  // Login
  // -----------------------------------------------------------------------
  const login = useCallback(async ({ email, password }) => {
    const res = await authAPI.login({ email, password });
    const { token, user: userData } = res.data;
    setStoredToken(token);
    setUser(userData);
    return userData;
  }, []);

  // -----------------------------------------------------------------------
  // Logout
  // -----------------------------------------------------------------------
  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {
      // Even if server logout fails, clear local state
    }
    clearStoredToken();
    setUser(null);
  }, []);

  // -----------------------------------------------------------------------
  // Refresh user data (after profile update, etc.)
  // -----------------------------------------------------------------------
  const refreshUser = useCallback(async () => {
    try {
      const res = await authAPI.me();
      setUser(res.data);
      return res.data;
    } catch {
      clearStoredToken();
      setUser(null);
      return null;
    }
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
