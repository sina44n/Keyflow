/**
 * KEYFLOW Global Game Performance System — Global Audio Lifecycle Manager
 * =======================================================================
 * Shared audio manager for all arcade games. Manages Web Audio API context,
 * volume controls (master, sfx, music), mute toggles, browser autoplay unlocking,
 * and automatic suspension during tab backgrounding or game exit.
 */

const AUDIO_STORAGE_KEY = 'keyflow_game_audio_settings';

const DEFAULT_AUDIO_SETTINGS = {
  masterVolume: 0.8,
  sfxVolume: 0.9,
  musicVolume: 0.7,
  isMuted: false,
};

let inMemoryAudioSettings = { ...DEFAULT_AUDIO_SETTINGS };
let sharedAudioContext = null;

export class GlobalAudioLifecycleManager {
  static getSettings() {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return { ...inMemoryAudioSettings };
    }
    try {
      const raw = localStorage.getItem(AUDIO_STORAGE_KEY);
      if (!raw) return { ...DEFAULT_AUDIO_SETTINGS };
      return { ...DEFAULT_AUDIO_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_AUDIO_SETTINGS };
    }
  }

  static saveSettings(partial) {
    inMemoryAudioSettings = { ...inMemoryAudioSettings, ...partial };
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return { ...inMemoryAudioSettings };
    }
    try {
      const current = GlobalAudioLifecycleManager.getSettings();
      const updated = { ...current, ...partial };
      localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(updated));
      if (typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(
          new CustomEvent('keyflow-audio-settings-changed', { detail: updated })
        );
      }
      return updated;
    } catch {
      return GlobalAudioLifecycleManager.getSettings();
    }
  }

  /**
   * Retrieves or lazily creates the shared Web Audio API context.
   */
  static getAudioContext() {
    if (typeof window === 'undefined') return null;

    if (!sharedAudioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        sharedAudioContext = new AudioCtx();
      }
    }

    if (sharedAudioContext && sharedAudioContext.state === 'suspended') {
      sharedAudioContext.resume().catch(() => {});
    }

    return sharedAudioContext;
  }

  /**
   * Calculates effective volume multiplier for an audio channel.
   */
  static getEffectiveVolume(channel = 'sfx') {
    const settings = GlobalAudioLifecycleManager.getSettings();
    if (settings.isMuted) return 0;

    const master = settings.masterVolume ?? 0.8;
    const channelVol =
      channel === 'music'
        ? settings.musicVolume ?? 0.7
        : settings.sfxVolume ?? 0.9;

    return Math.max(0, Math.min(1, master * channelVol));
  }

  /**
   * Suspends the audio context safely when a game exits or tab is hidden.
   */
  static suspendAudio() {
    if (sharedAudioContext && sharedAudioContext.state === 'running') {
      sharedAudioContext.suspend().catch(() => {});
    }
  }

  /**
   * Resumes the audio context when returning to gameplay.
   */
  static resumeAudio() {
    const settings = GlobalAudioLifecycleManager.getSettings();
    if (settings.isMuted) return;

    if (sharedAudioContext && sharedAudioContext.state === 'suspended') {
      sharedAudioContext.resume().catch(() => {});
    }
  }
}
