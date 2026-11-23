import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  SOUND_PROFILES,
  SOUND_CATEGORIES,
  DEFAULT_SOUND_SETTINGS,
  getSoundSettings,
  saveSoundSettings,
  playKeySound,
} from '../utils/keyboardAudio';

import { profileAPI } from '../utils/api';

export { SOUND_PROFILES, SOUND_CATEGORIES, DEFAULT_SOUND_SETTINGS };

const SoundContext = createContext({
  soundEnabled: true,
  soundProfile: 'mechanical-blue',
  volume: 0.75,
  currentProfileObj: SOUND_PROFILES[0],
  isAudible: true,
  setSoundEnabled: () => {},
  setSoundProfile: () => {},
  setVolume: () => {},
  toggleSound: () => {},
  playClick: () => {},
  previewSound: () => {},
  profiles: SOUND_PROFILES,
  categories: SOUND_CATEGORIES,
});

export const SoundProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => getSoundSettings());

  // Listen for account preferences restore and external sound updates
  useEffect(() => {
    const handleSync = (e) => {
      const { profile, enabled, volume } = e.detail || {};
      setSettings((prev) => {
        const nextProfile = profile && SOUND_PROFILES.some((p) => p.id === profile) ? profile : prev.profile;
        const nextEnabled = enabled !== undefined ? Boolean(enabled) : prev.enabled;
        const nextVolume = typeof volume === 'number' && !isNaN(volume)
          ? Math.max(0, Math.min(1, volume))
          : prev.volume;

        if (
          prev.profile === nextProfile &&
          prev.enabled === nextEnabled &&
          Math.abs(prev.volume - nextVolume) < 0.001
        ) {
          return prev;
        }

        return {
          profile: nextProfile,
          enabled: nextEnabled,
          volume: nextVolume,
        };
      });
      // CRITICAL: NEVER call saveSoundSettings here! handleSync reacts to an event
      // that was already persisted by saveSoundSettings or remote preference sync.
    };

    const handleStorageChange = (e) => {
      if (e.key === 'keyflow_keyboard_sound_settings' && e.newValue) {
        try {
          const fresh = getSoundSettings();
          setSettings((prev) => {
            if (
              prev.profile === fresh.profile &&
              prev.enabled === fresh.enabled &&
              Math.abs(prev.volume - fresh.volume) < 0.001
            ) {
              return prev;
            }
            return fresh;
          });
        } catch {}
      }
    };

    window.addEventListener('keyflow-sound-sync', handleSync);
    window.addEventListener('keyflow-sound-settings-updated', handleSync);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('keyflow-sound-sync', handleSync);
      window.removeEventListener('keyflow-sound-settings-updated', handleSync);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const setSoundEnabled = useCallback((enabled) => {
    const isBool = Boolean(enabled);
    setSettings((prev) => {
      if (prev.enabled === isBool) return prev;
      return { ...prev, enabled: isBool };
    });
    saveSoundSettings({ enabled: isBool });
    try {
      const userId = localStorage.getItem('keyflow_current_user_id');
      if (userId) {
        profileAPI.updatePreferences({ sound_enabled: isBool }).catch(() => {});
      }
    } catch {}
  }, []);

  const setVolume = useCallback((vol) => {
    const clamped = typeof vol === 'number' && !isNaN(vol) ? Math.max(0, Math.min(1, vol)) : 0.75;
    setSettings((prev) => {
      if (Math.abs(prev.volume - clamped) < 0.001) return prev;
      return { ...prev, volume: clamped };
    });
    saveSoundSettings({ volume: clamped });
  }, []);

  const setSoundProfile = useCallback((profileId) => {
    const valid = SOUND_PROFILES.some((p) => p.id === profileId);
    if (!valid) return;

    let willEnable = false;
    setSettings((prev) => {
      if (prev.profile === profileId && (profileId === 'silent-office' || prev.enabled)) {
        return prev;
      }
      const next = { ...prev, profile: profileId };
      if (profileId !== 'silent-office' && !prev.enabled) {
        next.enabled = true;
        willEnable = true;
      }
      return next;
    });

    const toSave = { profile: profileId };
    const cur = getSoundSettings();
    if (profileId !== 'silent-office' && !cur.enabled) {
      toSave.enabled = true;
      willEnable = true;
    }
    saveSoundSettings(toSave);

    try {
      const userId = localStorage.getItem('keyflow_current_user_id');
      if (userId) {
        const payload = { sound_profile: profileId };
        if (willEnable) payload.sound_enabled = true;
        profileAPI.updatePreferences(payload).catch(() => {});
      }
    } catch {}
  }, []);

  const toggleSound = useCallback(() => {
    const cur = getSoundSettings();
    const nextEnabled = !cur.enabled;
    setSettings((prev) => (prev.enabled === nextEnabled ? prev : { ...prev, enabled: nextEnabled }));
    saveSoundSettings({ enabled: nextEnabled });
    try {
      const userId = localStorage.getItem('keyflow_current_user_id');
      if (userId) {
        profileAPI.updatePreferences({ sound_enabled: nextEnabled }).catch(() => {});
      }
    } catch {}
  }, []);

  const currentProfileObj = useMemo(() => {
    return SOUND_PROFILES.find((p) => p.id === settings.profile) || SOUND_PROFILES[0];
  }, [settings.profile]);

  // Audible only if enabled AND not the Silent Office profile
  const isAudible = settings.enabled && settings.profile !== 'silent-office' && settings.profile !== 'silent';

  const playClick = useCallback(
    (isError = false) => {
      if (!isAudible) return;
      playKeySound(settings.profile, isError);
    },
    [isAudible, settings.profile]
  );

  const previewSound = useCallback((profileId) => {
    if (profileId === 'silent-office' || profileId === 'silent') return;
    playKeySound(profileId, false, true);
  }, []);

  const value = useMemo(
    () => ({
      soundEnabled: settings.enabled,
      soundProfile: settings.profile,
      volume: settings.volume ?? 0.75,
      currentProfileObj,
      isAudible,
      setSoundEnabled,
      setSoundProfile,
      setVolume,
      toggleSound,
      playClick,
      previewSound,
      profiles: SOUND_PROFILES,
      categories: SOUND_CATEGORIES,
    }),
    [
      settings.enabled,
      settings.profile,
      settings.volume,
      currentProfileObj,
      isAudible,
      setSoundEnabled,
      setSoundProfile,
      setVolume,
      toggleSound,
      playClick,
      previewSound,
    ]
  );

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
};

export const useKeyboardSound = () => {
  const context = useContext(SoundContext);
  if (!context) {
    const s = getSoundSettings();
    const currentProfileObj = SOUND_PROFILES.find((p) => p.id === s.profile) || SOUND_PROFILES[0];
    const isAudible = s.enabled && s.profile !== 'silent-office' && s.profile !== 'silent';

    return {
      soundEnabled: s.enabled,
      soundProfile: s.profile,
      volume: s.volume ?? 0.75,
      currentProfileObj,
      isAudible,
      setSoundEnabled: (enabled) => saveSoundSettings({ ...getSoundSettings(), enabled }),
      setSoundProfile: (profile) => saveSoundSettings({ ...getSoundSettings(), profile }),
      setVolume: (volume) => saveSoundSettings({ ...getSoundSettings(), volume }),
      toggleSound: () => {
        const cur = getSoundSettings();
        saveSoundSettings({ ...cur, enabled: !cur.enabled });
      },
      playClick: (isError = false) => {
        const cur = getSoundSettings();
        if (cur.enabled && cur.profile !== 'silent-office' && cur.profile !== 'silent') {
          playKeySound(cur.profile, isError);
        }
      },
      previewSound: (profileId) => {
        if (profileId === 'silent-office' || profileId === 'silent') return;
        playKeySound(profileId, false, true);
      },
      profiles: SOUND_PROFILES,
      categories: SOUND_CATEGORIES,
    };
  }
  return context;
};
