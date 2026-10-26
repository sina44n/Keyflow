/**
 * KEYFLOW — Tactile Keyboard Audio Studio Engine
 * =========================================================
 * High-fidelity, zero-dependency Web Audio keyboard sound synthesizer.
 * Provides 16 distinct acoustic profiles across 3 curated collections:
 *
 * 1. Mechanical Collection (Blue, Red, Brown, Creamy Thock, Marble Pop, Box Jade)
 * 2. Desk Setup Collection (Silent Office, Laptop Chiclet, Classic Keyboard, Retro Typewriter, Soft Foam, Studio Linear)
 * 3. Experimental Collection (Cyber Pulse, Glass Tap, Deep Bass, Arcade Keys)
 */

export const SOUND_CATEGORIES = [
  { id: 'all', label: 'All Profiles' },
  { id: 'mechanical', label: 'Mechanical' },
  { id: 'desk', label: 'Desk Setup' },
  { id: 'experimental', label: 'Experimental' },
];

export const SOUND_PROFILES = [
  // ── A. Mechanical Collection ─────────────────────────────────────────────
  {
    id: 'mechanical-blue',
    name: 'Mechanical Blue',
    category: 'mechanical',
    tag: 'Clicky',
    description: 'Crisp, tactile click with defined transient and clack',
  },
  {
    id: 'mechanical-red',
    name: 'Mechanical Red',
    category: 'mechanical',
    tag: 'Linear',
    description: 'Smooth, fast linear keystrokes with short controlled decay',
  },
  {
    id: 'mechanical-brown',
    name: 'Mechanical Brown',
    category: 'mechanical',
    tag: 'Tactile',
    description: 'Balanced tactile feedback with subtle bump character',
  },
  {
    id: 'creamy-thock',
    name: 'Creamy Thock',
    category: 'mechanical',
    tag: 'Thocky',
    description: 'Deep, warm, muted keystrokes with rounded low-mid body',
  },
  {
    id: 'marble-pop',
    name: 'Marble Pop',
    category: 'mechanical',
    tag: 'Marbly',
    description: 'Clean, polished pop transient with controlled resonance',
  },
  {
    id: 'box-jade',
    name: 'Box Jade',
    category: 'mechanical',
    tag: 'Click Bar',
    description: 'Pronounced, bright, snappy double-click mechanical attack',
  },

  // ── B. Premium Desk Setup Collection ─────────────────────────────────────
  {
    id: 'silent-office',
    name: 'Silent Office',
    category: 'desk',
    tag: 'Silent',
    description: 'Explicitly silent. Zero typing or preview audio',
  },
  {
    id: 'laptop-chiclet',
    name: 'Laptop Chiclet',
    category: 'desk',
    tag: 'Scissor',
    description: 'Delicate, low-profile laptop scissor switch keypresses',
  },
  {
    id: 'classic-keyboard',
    name: 'Classic Keyboard',
    category: 'desk',
    tag: 'Classic',
    description: 'Familiar, neutral computer keyboard attack and decay',
  },
  {
    id: 'retro-typewriter',
    name: 'Retro Typewriter',
    category: 'desk',
    tag: 'Vintage',
    description: 'Warm, percussive vintage metal striker & mechanical body',
  },
  {
    id: 'soft-foam',
    name: 'Soft Foam',
    category: 'desk',
    tag: 'Dampened',
    description: 'Ultra-cushioned, gasket-dampened keypress with soft thud',
  },
  {
    id: 'studio-linear',
    name: 'Studio Linear',
    category: 'desk',
    tag: 'Studio',
    description: 'Clean, acoustically treated linear switches with low noise floor',
  },

  // ── C. Experimental Collection ───────────────────────────────────────────
  {
    id: 'cyber-pulse',
    name: 'Cyber Pulse',
    category: 'experimental',
    tag: 'Synth',
    description: 'Subtle futuristic electronic blip with short synth character',
  },
  {
    id: 'glass-tap',
    name: 'Glass Tap',
    category: 'experimental',
    tag: 'Crystal',
    description: 'Light, rounded, clear tap with delicate high-frequency detail',
  },
  {
    id: 'deep-bass',
    name: 'Deep Bass',
    category: 'experimental',
    tag: 'Sub Bass',
    description: 'Warm, low-frequency punch with restrained sub body',
  },
  {
    id: 'arcade-keys',
    name: 'Arcade Keys',
    category: 'experimental',
    tag: '8-Bit',
    description: 'Playful, retro digital micro-pip for the Arcade experience',
  },
];

export const DEFAULT_SOUND_SETTINGS = {
  enabled: true,
  profile: 'mechanical-blue',
};

const STORAGE_KEY = 'keyflow_keyboard_sound_settings_v1';

// Legacy ID migration map
const LEGACY_PROFILE_MAP = {
  classic: 'classic-keyboard',
  silent: 'silent-office',
};

// Shared AudioContext & noise buffer for low-latency synthesis
let audioCtx = null;
let noiseBuffer = null;
let activeVoiceCount = 0;
const MAX_CONCURRENT_VOICES = 6;

/**
 * Lazily obtains or creates the Web Audio context.
 * Automatically handles browser suspended state.
 */
export function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Pre-computes or returns a 1-second white noise buffer.
 */
function getNoiseBuffer(ctx) {
  if (noiseBuffer && noiseBuffer.sampleRate === ctx.sampleRate) return noiseBuffer;
  const bufferSize = ctx.sampleRate;
  noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

/**
 * Reads persisted keyboard sound settings from localStorage.
 */
export function getSoundSettings() {
  if (typeof localStorage === 'undefined') return DEFAULT_SOUND_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SOUND_SETTINGS;
    const parsed = JSON.parse(raw);

    // Map legacy profile IDs if present
    let rawProfile = parsed.profile;
    if (LEGACY_PROFILE_MAP[rawProfile]) {
      rawProfile = LEGACY_PROFILE_MAP[rawProfile];
    }

    const validProfile = SOUND_PROFILES.some((p) => p.id === rawProfile)
      ? rawProfile
      : DEFAULT_SOUND_SETTINGS.profile;

    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : DEFAULT_SOUND_SETTINGS.enabled,
      profile: validProfile,
    };
  } catch {
    return DEFAULT_SOUND_SETTINGS;
  }
}

/**
 * Persists keyboard sound settings and broadcasts update event.
 */
export function saveSoundSettings(settings) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(
        new CustomEvent('keyflow-sound-settings-updated', { detail: settings })
      );
    }
  } catch {
    // localStorage may fail in restricted iframes
  }
}

// ── Reusable Parameterized Synthesis Helpers ───────────────────────────────

/**
 * Plays a filtered noise transient burst.
 */
function playNoiseTransient(ctx, destination, {
  now,
  filterType = 'bandpass',
  frequency = 2500,
  Q = 3.0,
  gain = 0.1,
  duration = 0.015,
}) {
  const noise = ctx.createBufferSource();
  noise.buffer = getNoiseBuffer(ctx);

  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.setValueAtTime(frequency, now);
  filter.Q.setValueAtTime(Q, now);

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(gain, now);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  noise.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(destination);

  noise.start(now);
  noise.stop(now + duration + 0.005);
}

/**
 * Plays a pitch-gliding body oscillator.
 */
function playBodyOscillator(ctx, destination, {
  now,
  type = 'triangle',
  startFreq = 400,
  endFreq = 200,
  gain = 0.1,
  duration = 0.03,
  lowpassCutoff = null,
}) {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(startFreq, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration * 0.85);

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(gain, now);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  if (lowpassCutoff) {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(lowpassCutoff, now);
    osc.connect(filter);
    filter.connect(gainNode);
  } else {
    osc.connect(gainNode);
  }

  gainNode.connect(destination);
  osc.start(now);
  osc.stop(now + duration + 0.005);
}

/**
 * Synthesizes and plays a keypress sound for the given sound profile.
 *
 * @param {string} profileId - ID of sound profile (mechanical-blue, creamy-thock, etc.)
 * @param {boolean} isError - Whether the keystroke is an incorrect mistake
 * @param {boolean} force - If true, bypasses enabled check (used for previewing)
 */
export function playKeySound(profileId, isError = false, force = false) {
  // Normalize legacy IDs
  if (LEGACY_PROFILE_MAP[profileId]) {
    profileId = LEGACY_PROFILE_MAP[profileId];
  }

  if (!force) {
    const currentSettings = getSoundSettings();
    if (!currentSettings.enabled) return;
    if (currentSettings.profile === 'silent-office' || currentSettings.profile === 'silent') return;
    profileId = profileId || currentSettings.profile;
  }

  // Silent profile produces zero audio
  if (profileId === 'silent-office' || profileId === 'silent') return;

  const ctx = getAudioContext();
  if (!ctx) return;

  // Voice limiting to prevent distortion during rapid typing bursts
  if (activeVoiceCount >= MAX_CONCURRENT_VOICES) {
    return;
  }

  try {
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);

    // Subtle natural human micro-variations
    const pitchDetune = (Math.random() - 0.5) * 40; // +/- 20 cents
    const gainVar = 0.95 + Math.random() * 0.1; // +/- 5% volume
    const errorPitchMult = isError ? 0.72 : 1.0;
    const errorGainMult = isError ? 1.25 : 1.0;

    activeVoiceCount++;
    const cleanupTime = 0.08;
    setTimeout(() => {
      activeVoiceCount = Math.max(0, activeVoiceCount - 1);
      try {
        masterGain.disconnect();
      } catch {
        /* ignore */
      }
    }, cleanupTime * 1000 + 10);

    switch (profileId) {
      // ── A. Mechanical Collection ─────────────────────────────────────────

      case 'mechanical-blue': {
        // Crisp, clicky tactile mechanical switch (Cherry MX Blue style)
        // 1. High-frequency crisp click transient
        playNoiseTransient(ctx, masterGain, {
          now,
          filterType: 'bandpass',
          frequency: (isError ? 2600 : 3800) + pitchDetune * 4,
          Q: 4.5,
          gain: (isError ? 0.22 : 0.17) * gainVar,
          duration: 0.012,
        });

        // 2. Plastic bottom-out clack resonance
        playBodyOscillator(ctx, masterGain, {
          now,
          type: isError ? 'sawtooth' : 'triangle',
          startFreq: (isError ? 340 : 540) * errorPitchMult + pitchDetune,
          endFreq: (isError ? 180 : 280) * errorPitchMult,
          gain: 0.13 * gainVar * errorGainMult,
          duration: 0.038,
          lowpassCutoff: isError ? 1300 : 2400,
        });
        break;
      }

      case 'mechanical-red': {
        // Smooth, soft linear mechanical switch (Cherry MX Red style)
        // Smooth dampened bottom-out
        playBodyOscillator(ctx, masterGain, {
          now,
          type: isError ? 'sawtooth' : 'triangle',
          startFreq: (isError ? 260 : 380) * errorPitchMult + pitchDetune,
          endFreq: (isError ? 140 : 190) * errorPitchMult,
          gain: 0.13 * gainVar * errorGainMult,
          duration: 0.026,
          lowpassCutoff: isError ? 850 : 1250,
        });

        // Soft housing slider friction
        playNoiseTransient(ctx, masterGain, {
          now,
          filterType: 'bandpass',
          frequency: 1050,
          Q: 2.0,
          gain: 0.045 * gainVar,
          duration: 0.014,
        });
        break;
      }

      case 'mechanical-brown': {
        // Balanced tactile feedback with subtle bump character (Cherry MX Brown style)
        // 1. Mid-frequency tactile bump transient
        playNoiseTransient(ctx, masterGain, {
          now,
          filterType: 'bandpass',
          frequency: (isError ? 1800 : 2300) + pitchDetune * 2,
          Q: 3.2,
          gain: (isError ? 0.15 : 0.11) * gainVar,
          duration: 0.015,
        });

        // 2. Medium tactile bottom-out clack
        playBodyOscillator(ctx, masterGain, {
          now,
          type: isError ? 'sawtooth' : 'triangle',
          startFreq: (isError ? 290 : 460) * errorPitchMult + pitchDetune,
          endFreq: (isError ? 150 : 230) * errorPitchMult,
          gain: 0.12 * gainVar * errorGainMult,
          duration: 0.032,
          lowpassCutoff: isError ? 1100 : 1700,
        });
        break;
      }

      case 'creamy-thock': {
        // Deep, warm, muted keystrokes with rounded low-mid character (Lubed switch on POM plate)
        // 1. Resonant chassis thock
        playNoiseTransient(ctx, masterGain, {
          now,
          filterType: 'bandpass',
          frequency: (isError ? 360 : 470) + pitchDetune,
          Q: 5.8,
          gain: 0.16 * gainVar * errorGainMult,
          duration: 0.024,
        });

        // 2. Heavy low-end body
        playBodyOscillator(ctx, masterGain, {
          now,
          type: 'sine',
          startFreq: (isError ? 140 : 205) * errorPitchMult + pitchDetune,
          endFreq: (isError ? 85 : 120) * errorPitchMult,
          gain: (isError ? 0.22 : 0.18) * gainVar,
          duration: 0.042,
          lowpassCutoff: isError ? 550 : 750,
        });
        break;
      }

      case 'marble-pop': {
        // Clean, rounded, slightly brighter pop-like transient (PE foam marbly sound)
        // 1. High-Q resonant bubble pop
        playNoiseTransient(ctx, masterGain, {
          now,
          filterType: 'bandpass',
          frequency: (isError ? 1200 : 1650) + pitchDetune * 3,
          Q: 6.5,
          gain: (isError ? 0.2 : 0.16) * gainVar,
          duration: 0.02,
        });

        // 2. Fast pitch drop pop
        playBodyOscillator(ctx, masterGain, {
          now,
          type: 'sine',
          startFreq: (isError ? 460 : 680) * errorPitchMult + pitchDetune,
          endFreq: (isError ? 220 : 310) * errorPitchMult,
          gain: 0.14 * gainVar * errorGainMult,
          duration: 0.028,
        });
        break;
      }

      case 'box-jade': {
        // Bright, crisp double-click mechanical attack (Kailh Box Jade click bar)
        // 1. Sharp click-bar snap
        playNoiseTransient(ctx, masterGain, {
          now,
          filterType: 'bandpass',
          frequency: (isError ? 3200 : 4600) + pitchDetune * 4,
          Q: 5.5,
          gain: (isError ? 0.24 : 0.19) * gainVar,
          duration: 0.01,
        });

        // 2. High-energy bottom-out
        playBodyOscillator(ctx, masterGain, {
          now,
          type: isError ? 'sawtooth' : 'triangle',
          startFreq: (isError ? 290 : 430) * errorPitchMult + pitchDetune,
          endFreq: (isError ? 170 : 250) * errorPitchMult,
          gain: 0.14 * gainVar * errorGainMult,
          duration: 0.035,
          lowpassCutoff: isError ? 1600 : 2800,
        });
        break;
      }

      // ── B. Desk Setup Collection ──────────────────────────────────────────

      case 'laptop-chiclet': {
        // Lightweight laptop-style scissor keypresses (MacBook / ThinkPad)
        // Short, delicate, low-intensity character
        playNoiseTransient(ctx, masterGain, {
          now,
          filterType: 'bandpass',
          frequency: (isError ? 2000 : 2800) + pitchDetune * 2,
          Q: 3.5,
          gain: (isError ? 0.13 : 0.09) * gainVar,
          duration: 0.01,
        });

        playBodyOscillator(ctx, masterGain, {
          now,
          type: 'triangle',
          startFreq: (isError ? 280 : 420) * errorPitchMult + pitchDetune,
          endFreq: (isError ? 180 : 260) * errorPitchMult,
          gain: 0.08 * gainVar * errorGainMult,
          duration: 0.018,
          lowpassCutoff: isError ? 1200 : 1900,
        });
        break;
      }

      case 'classic-keyboard': {
        // Familiar, neutral computer keyboard feedback
        playNoiseTransient(ctx, masterGain, {
          now,
          filterType: 'bandpass',
          frequency: 1350 + pitchDetune * 2,
          Q: 2.2,
          gain: 0.07 * gainVar * errorGainMult,
          duration: 0.016,
        });

        playBodyOscillator(ctx, masterGain, {
          now,
          type: isError ? 'sawtooth' : 'triangle',
          startFreq: (isError ? 230 : 340) * errorPitchMult + pitchDetune,
          endFreq: (isError ? 120 : 180) * errorPitchMult,
          gain: 0.11 * gainVar * errorGainMult,
          duration: 0.028,
        });
        break;
      }

      case 'retro-typewriter': {
        // Warm, percussive vintage typewriter keystroke (no continuous bell/return)
        // 1. High metallic striker impact
        playNoiseTransient(ctx, masterGain, {
          now,
          filterType: 'bandpass',
          frequency: (isError ? 1400 : 1850) + pitchDetune * 3,
          Q: 4.8,
          gain: (isError ? 0.18 : 0.14) * gainVar,
          duration: 0.018,
        });

        // 2. Heavy vintage mechanical frame thud
        playBodyOscillator(ctx, masterGain, {
          now,
          type: isError ? 'sawtooth' : 'triangle',
          startFreq: (isError ? 210 : 310) * errorPitchMult + pitchDetune,
          endFreq: (isError ? 80 : 130) * errorPitchMult,
          gain: 0.16 * gainVar * errorGainMult,
          duration: 0.045,
          lowpassCutoff: isError ? 700 : 1100,
        });
        break;
      }

      case 'soft-foam': {
        // Heavily cushioned, dampened keypress with gentle attack and very short decay
        playBodyOscillator(ctx, masterGain, {
          now,
          type: 'sine',
          startFreq: (isError ? 150 : 220) * errorPitchMult + pitchDetune,
          endFreq: (isError ? 80 : 120) * errorPitchMult,
          gain: (isError ? 0.16 : 0.12) * gainVar,
          duration: 0.024,
          lowpassCutoff: 440,
        });
        break;
      }

      case 'studio-linear': {
        // Clean, controlled, smooth keypresses with restrained low-noise character
        playNoiseTransient(ctx, masterGain, {
          now,
          filterType: 'bandpass',
          frequency: 1200 + pitchDetune * 2,
          Q: 2.5,
          gain: 0.05 * gainVar,
          duration: 0.012,
        });

        playBodyOscillator(ctx, masterGain, {
          now,
          type: 'triangle',
          startFreq: (isError ? 240 : 350) * errorPitchMult + pitchDetune,
          endFreq: (isError ? 130 : 185) * errorPitchMult,
          gain: 0.11 * gainVar * errorGainMult,
          duration: 0.025,
          lowpassCutoff: isError ? 900 : 1350,
        });
        break;
      }

      // ── C. Experimental Collection ───────────────────────────────────────

      case 'cyber-pulse': {
        // Subtle futuristic electronic click with short, restrained synthetic character
        playNoiseTransient(ctx, masterGain, {
          now,
          filterType: 'highpass',
          frequency: (isError ? 2800 : 4200),
          Q: 1.5,
          gain: 0.08 * gainVar,
          duration: 0.008,
        });

        playBodyOscillator(ctx, masterGain, {
          now,
          type: 'sine',
          startFreq: (isError ? 560 : 860) * errorPitchMult + pitchDetune,
          endFreq: (isError ? 220 : 360) * errorPitchMult,
          gain: 0.12 * gainVar * errorGainMult,
          duration: 0.018,
        });
        break;
      }

      case 'glass-tap': {
        // Light, rounded, clear tap with delicate high-frequency detail (tempered glass)
        playNoiseTransient(ctx, masterGain, {
          now,
          filterType: 'bandpass',
          frequency: (isError ? 2400 : 3200) + pitchDetune * 2,
          Q: 7.0,
          gain: (isError ? 0.16 : 0.12) * gainVar,
          duration: 0.012,
        });

        playBodyOscillator(ctx, masterGain, {
          now,
          type: 'sine',
          startFreq: (isError ? 620 : 920) * errorPitchMult + pitchDetune,
          endFreq: (isError ? 400 : 640) * errorPitchMult,
          gain: 0.1 * gainVar * errorGainMult,
          duration: 0.016,
        });
        break;
      }

      case 'deep-bass': {
        // Warm, low-frequency keypress with restrained, tight bass body
        playBodyOscillator(ctx, masterGain, {
          now,
          type: 'sine',
          startFreq: (isError ? 95 : 120) * errorPitchMult + pitchDetune,
          endFreq: (isError ? 50 : 65) * errorPitchMult,
          gain: (isError ? 0.24 : 0.19) * gainVar,
          duration: 0.038,
          lowpassCutoff: 320,
        });
        break;
      }

      case 'arcade-keys': {
        // Playful, short digital keypress suitable for KEYFLOW's Arcade experience
        playBodyOscillator(ctx, masterGain, {
          now,
          type: 'square',
          startFreq: (isError ? 440 : 660) * errorPitchMult + pitchDetune,
          endFreq: (isError ? 260 : 420) * errorPitchMult,
          gain: 0.07 * gainVar * errorGainMult,
          duration: 0.015,
          lowpassCutoff: isError ? 1200 : 2000,
        });
        break;
      }

      default:
        break;
    }
  } catch {
    activeVoiceCount = Math.max(0, activeVoiceCount - 1);
  }
}
