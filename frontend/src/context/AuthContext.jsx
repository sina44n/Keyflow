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
import { authAPI, lessonsAPI, gamesAPI, setStoredToken, clearStoredToken, getStoredToken } from '../utils/api';
import {
  setLessonProgressUser,
  syncLessonProgressFromBackend,
  registerBackendSyncHandler,
  migrateGuestProgressToAccount,
  resetGuestProgress,
} from '../utils/lessonProgress';
import {
  setArcadeStorageUser,
  syncArcadeRecordsFromBackend,
  migrateGuestArcadeRecordsToAccount,
  resetGuestArcadeRecords,
} from '../utils/arcadeStorage';

// Wire up asynchronous backend lesson progress synchronization
registerBackendSyncHandler((data) => {
  lessonsAPI.recordProgress(data).catch(() => {});
});

export const AuthContext = createContext(null);

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

  // Apply user session and synchronize isolated progression
  const applyUserSession = useCallback(async (userData) => {
    setUser(userData);
    if (userData?.id) {
      try {
        localStorage.setItem('keyflow_current_user_id', String(userData.id));
      } catch {}
      setLessonProgressUser(userData.id);
      setArcadeStorageUser(userData.id);

      // 1. Safely migrate any existing guest data into authenticated user account
      try {
        await migrateGuestProgressToAccount(userData.id, lessonsAPI.recordProgress);
        await migrateGuestArcadeRecordsToAccount(userData.id);
      } catch (err) {
        console.warn('KEYFLOW guest data migration notice:', err);
      }

      // 2. Fetch authoritative lesson progress from backend PostgreSQL
      try {
        const summaryRes = await lessonsAPI.getProgressSummary();
        if (summaryRes?.data) {
          syncLessonProgressFromBackend(summaryRes.data);
        }
      } catch {
        // Safe fallback if offline
      }

      // 3. Fetch authoritative arcade records from backend
      try {
        const arcadeRes = await gamesAPI.getRecords();
        if (arcadeRes?.data) {
          syncArcadeRecordsFromBackend(arcadeRes.data);
        }
      } catch {
        // Safe fallback
      }

      // 4. Dispatch theme and sound preference synchronization across contexts
      if (userData.preferences?.theme_preset && typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('keyflow-theme-sync', { detail: userData.preferences.theme_preset })
        );
      }
      if (userData.preferences?.sound_profile && typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('keyflow-sound-sync', {
            detail: {
              profile: userData.preferences.sound_profile,
              enabled: userData.preferences.sound_enabled,
            },
          })
        );
      }
    } else {
      try {
        localStorage.removeItem('keyflow_current_user_id');
      } catch {}
      setLessonProgressUser(null);
      setArcadeStorageUser(null);
      // Preserve local guest progress for anonymous play
    }
  }, []);

  // -----------------------------------------------------------------------
  // Restore session on mount — check stored token validity
  // -----------------------------------------------------------------------
  useEffect(() => {
    const restoreSession = async () => {
      const token = getStoredToken();
      if (!token) {
        try {
          localStorage.removeItem('keyflow_current_user_id');
        } catch {}
        setLessonProgressUser(null);
        setArcadeStorageUser(null);
        setIsLoading(false);
        return;
      }
      try {
        const res = await authAPI.me();
        if (mountedRef.current) {
          await applyUserSession(res.data);
        }
      } catch {
        // Token expired or invalid
        clearStoredToken();
        try {
          localStorage.removeItem('keyflow_current_user_id');
        } catch {}
        setLessonProgressUser(null);
        setArcadeStorageUser(null);
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };
    restoreSession();
    return () => {
      mountedRef.current = false;
    };
  }, [applyUserSession]);

  // -----------------------------------------------------------------------
  // Listen for auth-expired events from API interceptor
  // -----------------------------------------------------------------------
  useEffect(() => {
    const handleExpired = () => {
      try {
        localStorage.removeItem('keyflow_current_user_id');
      } catch {}
      setLessonProgressUser(null);
      setArcadeStorageUser(null);
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
    try {
      localStorage.setItem('keyflow_current_user_id', String(userData.id));
    } catch {}
    await applyUserSession(userData);
    return userData;
  }, [applyUserSession]);

  // -----------------------------------------------------------------------
  // Login
  // -----------------------------------------------------------------------
  const login = useCallback(async ({ email, password }) => {
    const res = await authAPI.login({ email, password });
    const { token, user: userData } = res.data;
    setStoredToken(token);
    try {
      localStorage.setItem('keyflow_current_user_id', String(userData.id));
    } catch {}
    await applyUserSession(userData);
    return userData;
  }, [applyUserSession]);

  // -----------------------------------------------------------------------
  // Google Login
  // -----------------------------------------------------------------------
  const loginWithGoogle = useCallback(async (payload) => {
    const res = await authAPI.googleLogin(payload);
    const { token, user: userData } = res.data;
    setStoredToken(token);
    try {
      localStorage.setItem('keyflow_current_user_id', String(userData.id));
    } catch {}
    await applyUserSession(userData);
    return userData;
  }, [applyUserSession]);

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
    try {
      localStorage.removeItem('keyflow_current_user_id');
    } catch {}
    setLessonProgressUser(null);
    setArcadeStorageUser(null);
    resetGuestProgress();
    resetGuestArcadeRecords();
    setUser(null);
  }, []);

  // -----------------------------------------------------------------------
  // Refresh user data (after profile update, etc.)
  // -----------------------------------------------------------------------
  const refreshUser = useCallback(async () => {
    try {
      const res = await authAPI.me();
      await applyUserSession(res.data);
      return res.data;
    } catch {
      clearStoredToken();
      try {
        localStorage.removeItem('keyflow_current_user_id');
      } catch {}
      setLessonProgressUser(null);
      setArcadeStorageUser(null);
      resetGuestProgress();
      resetGuestArcadeRecords();
      setUser(null);
      return null;
    }
  }, [applyUserSession]);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    loginWithGoogle,
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
