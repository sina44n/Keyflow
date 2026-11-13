/**
 * KEYFLOW Platform Configuration & Announcements Context
 * ======================================================
 * Manages live public configuration, active system announcements,
 * feature flags, and real-time maintenance mode state.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { platformAPI, announcementsAPI } from '../utils/api';

export const PlatformConfigContext = createContext(null);

export const usePlatformConfig = () => {
  const context = useContext(PlatformConfigContext);
  if (!context) {
    throw new Error('usePlatformConfig must be used within a PlatformConfigProvider');
  }
  return context;
};

const DEFAULT_CONFIG = {
  maintenance_mode: false,
  maintenance_message: 'KEYFLOW is currently undergoing scheduled optimization. We will be back shortly.',
  registration_enabled: true,
  custom_text_enabled: true,
  competition_enabled: true,
  arcade_enabled: true,
  academy_enabled: true,
  leaderboard_enabled: true,
  guest_typing_enabled: true,
  announcements_enabled: true,
  default_duration: 60,
  allowed_durations: [15, 30, 60, 120, 300],
};

const DISMISSED_KEY = 'keyflow_dismissed_announcements';

const getDismissedAnnouncementIds = () => {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const setDismissedAnnouncementIds = (ids) => {
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(ids));
  } catch {}
};

export const PlatformConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [announcements, setAnnouncements] = useState([]);
  const [dismissedIds, setDismissedIds] = useState(getDismissedAnnouncementIds);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConfigAndAnnouncements = useCallback(async () => {
    try {
      const [configRes, annRes] = await Promise.allSettled([
        platformAPI.getConfig(),
        announcementsAPI.getActive(),
      ]);

      if (configRes.status === 'fulfilled' && configRes.value?.data) {
        setConfig((prev) => ({
          ...prev,
          ...configRes.value.data,
        }));
      }

      if (annRes.status === 'fulfilled' && annRes.value?.data?.announcements) {
        setAnnouncements(annRes.value.data.announcements);
      }
    } catch (err) {
      console.warn('[KEYFLOW] Failed to refresh platform config:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigAndAnnouncements();

    // Re-fetch on custom event (e.g. after Admin saves settings)
    const handleSync = () => fetchConfigAndAnnouncements();
    window.addEventListener('keyflow-config-updated', handleSync);
    window.addEventListener('focus', handleSync);

    // Light periodic refresh every 60 seconds
    const interval = setInterval(fetchConfigAndAnnouncements, 60000);

    return () => {
      window.removeEventListener('keyflow-config-updated', handleSync);
      window.removeEventListener('focus', handleSync);
      clearInterval(interval);
    };
  }, [fetchConfigAndAnnouncements]);

  const dismissAnnouncement = useCallback((id) => {
    setDismissedIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      setDismissedAnnouncementIds(next);
      return next;
    });
    announcementsAPI.dismiss(id).catch(() => {});
  }, []);

  const activeAnnouncements = announcements.filter(
    (a) => !dismissedIds.includes(a.id)
  );

  const isFeatureEnabled = useCallback(
    (featureName) => {
      if (!config) return true;
      return config[featureName] !== false;
    },
    [config]
  );

  const value = {
    config,
    activeAnnouncements,
    dismissedIds,
    dismissAnnouncement,
    refreshConfig: fetchConfigAndAnnouncements,
    isMaintenanceMode: Boolean(config?.maintenance_mode),
    maintenanceMessage: config?.maintenance_message || DEFAULT_CONFIG.maintenance_message,
    isFeatureEnabled,
    isLoading,
  };

  return (
    <PlatformConfigContext.Provider value={value}>
      {children}
    </PlatformConfigContext.Provider>
  );
};

