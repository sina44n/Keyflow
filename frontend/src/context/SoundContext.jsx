import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import {
  SOUND_PROFILES,
  SOUND_CATEGORIES,
  DEFAULT_SOUND_SETTINGS,
  getSoundSettings,
  saveSoundSettings,
  playKeySound,
} from '../utils/keyboardAudio';

export { SOUND_PROFILES, SOUND_CATEGORIES, DEFAULT_SOUND_SETTINGS };

const SoundContext = createContext({
  soundEnabled: true,
  soundProfile: 'mechanical-blue',
  currentProfileObj: SOUND_PROFILES[0],
  isAudible: true,
  setSoundEnabled: () => {},
  setSoundProfile: () => {},
  toggleSound: () => {},
  playClick: () => {},
  previewSound: () => {},
  profiles: SOUND_PROFILES,
  categories: SOUND_CATEGORIES,
});

export const SoundProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => getSoundSettings());

  const setSoundEnabled = useCallback((enabled) => {
    setSettings((prev) => {
      const next = { ...prev, enabled: Boolean(enabled) };
      saveSoundSettings(next);
      return next;
    });
  }, []);

  const setSoundProfile = useCallback((profileId) => {
    setSettings((prev) => {
      const valid = SOUND_PROFILES.some((p) => p.id === profileId);
      if (!valid) return prev;

      const next = { ...prev, profile: profileId };
      // If choosing an audible profile while muted, automatically enable so the choice takes effect immediately
      if (profileId !== 'silent-office' && !prev.enabled) {
        next.enabled = true;
      }
      saveSoundSettings(next);
      return next;
    });
  }, []);

  const toggleSound = useCallback(() => {
    setSettings((prev) => {
      const next = { ...prev, enabled: !prev.enabled };
      saveSoundSettings(next);
      return next;
    });
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
      currentProfileObj,
      isAudible,
      setSoundEnabled,
      setSoundProfile,
      toggleSound,
      playClick,
      previewSound,
      profiles: SOUND_PROFILES,
      categories: SOUND_CATEGORIES,
    }),
    [
      settings.enabled,
      settings.profile,
      currentProfileObj,
      isAudible,
      setSoundEnabled,
      setSoundProfile,
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
      currentProfileObj,
      isAudible,
      setSoundEnabled: (enabled) => saveSoundSettings({ ...getSoundSettings(), enabled }),
      setSoundProfile: (profile) => saveSoundSettings({ ...getSoundSettings(), profile }),
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
