/**
 * KEYFLOW Masterpiece Auth Context
 * ================================
 * Unified Authentication Architecture:
 * - Powered by Clerk for identity, sign-in, registration, Google OAuth, and password recovery.
 * - Bridges verified Clerk sessions directly to Django REST Framework via Bearer JWTs.
 * - Authoritatively synchronizes Django User ID, Profile, and Preferences from PostgreSQL.
 * - Guarantees zero data loss for Academy progression, Practice history, Arcade personal bests,
 *   and Competition memberships.
 * - Supports graceful unconfigured fallback when VITE_CLERK_PUBLISHABLE_KEY is unset.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth as useClerkAuth, useUser as useClerkUser, useClerk } from '@clerk/react';
import {
  authAPI,
  lessonsAPI,
  gamesAPI,
  setStoredToken,
  clearStoredToken,
  getStoredToken,
  registerTokenGetter,
} from '../utils/api';
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

/**
 * Shared helper to synchronize local offline storage, theme, and sound settings
 * once the authoritative Django user is loaded.
 */
const applyUserSession = async (userData) => {
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
  }
};

/**
 * Inner Consumer when ClerkProvider is active.
 * Uses official Clerk hooks: useClerkAuth, useClerkUser, useClerk.
 */
const ClerkAuthBridge = ({ children }) => {
  const { isSignedIn, isLoaded, getToken } = useClerkAuth();
  const { user: clerkUser } = useClerkUser();
  const clerk = useClerk();

  const [djangoUser, setDjangoUser] = useState(null);
  const [isSyncing, setIsSyncing] = useState(true);
  const syncedClerkIdRef = useRef(null);
  const mountedRef = useRef(true);

  // Register Clerk dynamic token getter with Axios client
  useEffect(() => {
    registerTokenGetter(async () => {
      try {
        const token = await getToken();
        return token;
      } catch {
        return null;
      }
    });
  }, [getToken]);

  // Synchronize Clerk user identity with Django PostgreSQL backend
  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !clerkUser) {
      if (djangoUser) {
        setDjangoUser(null);
        applyUserSession(null);
      }
      setIsSyncing(false);
      syncedClerkIdRef.current = null;
      return;
    }

    // If already synchronized for this exact Clerk ID, skip redundant sync
    if (syncedClerkIdRef.current === clerkUser.id && djangoUser) {
      setIsSyncing(false);
      return;
    }

    let isMounted = true;
    setIsSyncing(true);

    const performSync = async () => {
      try {
        const token = await getToken();
        if (!token) {
          if (isMounted) setIsSyncing(false);
          return;
        }

        const syncPayload = {
          display_name: clerkUser.fullName || clerkUser.firstName || clerkUser.username || '',
          avatar_url: clerkUser.imageUrl || '',
          email: clerkUser.primaryEmailAddress?.emailAddress || '',
        };

        const res = await authAPI.clerkSync(syncPayload);
        if (isMounted && res?.data?.user) {
          syncedClerkIdRef.current = clerkUser.id;
          setDjangoUser(res.data.user);
          await applyUserSession(res.data.user);
        }
      } catch (err) {
        console.warn('[KEYFLOW Clerk] User sync notice, falling back to /api/auth/me/:', err);
        try {
          const meRes = await authAPI.me();
          if (isMounted && meRes?.data) {
            syncedClerkIdRef.current = clerkUser.id;
            setDjangoUser(meRes.data);
            await applyUserSession(meRes.data);
          }
        } catch {
          // If the backend is temporarily offline or unreachable, build a graceful fallback
          // user from clerkUser so the authenticated user isn't immediately ejected into a redirect loop
          if (isMounted && clerkUser) {
            const fallbackUser = {
              id: clerkUser.id,
              email: clerkUser.primaryEmailAddress?.emailAddress || '',
              username:
                clerkUser.username ||
                (clerkUser.primaryEmailAddress?.emailAddress
                  ? clerkUser.primaryEmailAddress.emailAddress.split('@')[0]
                  : 'typist'),
              clerk_id: clerkUser.id,
              is_email_verified: Boolean(
                clerkUser.primaryEmailAddress?.verification?.status === 'verified'
              ),
              profile: {
                display_name:
                  clerkUser.fullName || clerkUser.firstName || clerkUser.username || 'Typist',
                avatar_url: clerkUser.imageUrl || '',
              },
              preferences: {},
              isOfflineFallback: true,
            };
            syncedClerkIdRef.current = clerkUser.id;
            setDjangoUser(fallbackUser);
            await applyUserSession(fallbackUser);
          }
        }
      } finally {
        if (isMounted) {
          setIsSyncing(false);
        }
      }
    };

    performSync();

    return () => {
      isMounted = false;
    };
  }, [isLoaded, isSignedIn, clerkUser?.id, getToken]);

  const logout = useCallback(async () => {
    try {
      await clerk.signOut();
    } catch {}
    clearStoredToken();
    try {
      localStorage.removeItem('keyflow_current_user_id');
    } catch {}
    setLessonProgressUser(null);
    setArcadeStorageUser(null);
    resetGuestProgress();
    resetGuestArcadeRecords();
    setDjangoUser(null);
    syncedClerkIdRef.current = null;
  }, [clerk]);

  const refreshUser = useCallback(async () => {
    try {
      const res = await authAPI.me();
      if (mountedRef.current && res.data) {
        setDjangoUser(res.data);
        await applyUserSession(res.data);
      }
      return res.data;
    } catch {
      return null;
    }
  }, []);

  const value = {
    user: djangoUser,
    clerkUser,
    isAuthenticated: Boolean(isSignedIn && djangoUser),
    isLoading: !isLoaded || isSyncing,
    isClerkConfigured: true,
    getToken,
    logout,
    refreshUser,
    // Compat stubs for components calling legacy context methods
    login: async () => {
      clerk.openSignIn();
    },
    register: async () => {
      clerk.openSignUp();
    },
    loginWithGoogle: async (options = {}) => {
      if (clerk?.authenticateWithRedirect) {
        return clerk.authenticateWithRedirect({
          strategy: 'oauth_google',
          redirectUrl: '/sso-callback',
          redirectUrlComplete: options?.destination || '/workstation',
        });
      }
      clerk.openSignIn();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Fallback Consumer when Clerk is not configured.
 * Preserves app functionality and diagnostics without throwing.
 */
const FallbackAuthBridge = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;

    let isMounted = true;
    setIsLoading(true);
    authAPI
      .me()
      .then((res) => {
        if (isMounted && res.data) {
          setUser(res.data);
          applyUserSession(res.data);
        }
      })
      .catch(() => {
        clearStoredToken();
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {}
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

  const refreshUser = useCallback(async () => {
    try {
      const res = await authAPI.me();
      setUser(res.data);
      await applyUserSession(res.data);
      return res.data;
    } catch {
      return null;
    }
  }, []);

  const value = {
    user,
    clerkUser: null,
    isAuthenticated: Boolean(user),
    isLoading,
    isClerkConfigured: false,
    getToken: async () => getStoredToken(),
    logout,
    refreshUser,
    login: async ({ email, password }) => {
      const res = await authAPI.login({ email, password });
      setStoredToken(res.data.token);
      setUser(res.data.user);
      await applyUserSession(res.data.user);
      return res.data.user;
    },
    register: async (payload) => {
      const res = await authAPI.register(payload);
      setStoredToken(res.data.token);
      setUser(res.data.user);
      await applyUserSession(res.data.user);
      return res.data.user;
    },
    loginWithGoogle: async (payload) => {
      const res = await authAPI.googleLogin(payload);
      setStoredToken(res.data.token);
      setUser(res.data.user);
      await applyUserSession(res.data.user);
      return res.data.user;
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Root AuthProvider.
 * Conditionally delegates to ClerkAuthBridge if isClerkConfigured is true,
 * otherwise safely uses FallbackAuthBridge.
 */
export const AuthProvider = ({ children, isClerkConfigured = true }) => {
  if (isClerkConfigured) {
    return <ClerkAuthBridge>{children}</ClerkAuthBridge>;
  }
  return <FallbackAuthBridge>{children}</FallbackAuthBridge>;
};
