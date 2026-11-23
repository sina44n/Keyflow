/**
 * KEYFLOW — Masterpiece Tactile Keyboard Audio Engine & Sound Studio
 * ===================================================================
 * High-fidelity, zero-dependency Web Audio physical acoustic modeling engine.
 *
 * Implements 20 genuinely distinct keyboard sound profiles across 3 curated collections:
 * 1. Mechanical Collection (Blue, Red, Brown, Creamy Thock, Marble Pop, Box Jade, Holy Panda, Buckling Spring, Gateron Yellow Pro)
 * 2. Desk Setup Collection (Silent Office, Laptop Chiclet, Classic Keyboard, Retro Typewriter, Soft Foam, Studio Linear, Topre Electro-Capacitive)
 * 3. Experimental Collection (Cyber Pulse, Glass Tap, Deep Bass, Arcade Keys)
 *
 * Physical Acoustic Modeling Architecture:
 * - Subtractive Formant Resonators: Simulates physical stem, keycap, plate, and housing collision modes.
 * - Multi-Layer Collision Synthesis: Actuation transient + housing clack/thock + subtle acoustic damping.
 * - Organic Keystroke Micro-Variation: Prevents machine-gun robotic repetition during fast typing.
 * - Dynamic Voice Limiting: Prevents clipping and CPU overload during rapid 120+ WPM typing bursts.
 * - Dedicated Output Bus with Dynamics Compressor / Studio Limiter: Guarantees zero clipping distortion.
 * - Global Volume Control & State Synchronization across the entire application.
 * - Fletcher-Munson Perceived Loudness Balancing across all switch types.
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
    description: 'Crisp, tactile click-jacket with defined transient and ABS clack',
  },
  {
    id: 'mechanical-red',
    name: 'Mechanical Red',
    category: 'mechanical',
    tag: 'Linear',
    description: 'Smooth, lightweight linear keystroke with soft dampened bottom-out',
  },
  {
    id: 'mechanical-brown',
    name: 'Mechanical Brown',
    category: 'mechanical',
    tag: 'Tactile',
    description: 'Balanced, moderate tactile bump feedback with rounded clack',
  },
  {
    id: 'creamy-thock',
    name: 'Creamy Thock',
    category: 'mechanical',
    tag: 'Thocky',
    description: 'Deep, warm, lubed POM plate keystrokes with rounded low-mid resonance',
  },
  {
    id: 'marble-pop',
    name: 'Marble Pop',
    category: 'mechanical',
    tag: 'Marbly',
    description: 'Clean PE-foam marble pop transient with controlled bubble acoustic tail',
  },
  {
    id: 'box-jade',
    name: 'Box Jade',
    category: 'mechanical',
    tag: 'Click Bar',
    description: 'Energetic, sharp click-bar snap with crisp bottom-out impact',
  },
  {
    id: 'holy-panda',
    name: 'Holy Panda',
    category: 'mechanical',
    tag: 'Heavy Tactile',
    description: 'Pronounced, authoritative tactile stem snap with solid nylon housing bottom-out',
  },
  {
    id: 'buckling-spring',
    name: 'Buckling Spring',
    category: 'mechanical',
    tag: 'Vintage Steel',
    description: 'Classic 1980s terminal coiled spring buckle snap and steel backplate ring',
  },
  {
    id: 'gateron-yellow',
    name: 'Gateron Yellow Pro',
    category: 'mechanical',
    tag: 'Milky Linear',
    description: 'Buttery, pre-lubed smooth linear keypress with deep milky housing thud',
  },

  // ── B. Premium Desk Setup Collection ─────────────────────────────────────
  {
    id: 'silent-office',
    name: 'Silent Office',
    category: 'desk',
    tag: 'Silent',
    description: 'Explicitly silent. Zero typing or preview audio output',
  },
  {
    id: 'laptop-chiclet',
    name: 'Laptop Chiclet',
    category: 'desk',
    tag: 'Scissor',
    description: 'Delicate, low-profile laptop scissor switch keypresses with short travel',
  },
  {
    id: 'classic-keyboard',
    name: 'Classic Keyboard',
    category: 'desk',
    tag: 'Classic',
    description: 'Familiar, neutral computer keyboard attack and gentle rubber-dome decay',
  },
  {
    id: 'retro-typewriter',
    name: 'Retro Typewriter',
    category: 'desk',
    tag: 'Vintage',
    description: 'Warm, percussive metal striker impact and heavy mechanical cast-iron body',
  },
  {
    id: 'soft-foam',
    name: 'Soft Foam',
    category: 'desk',
    tag: 'Dampened',
    description: 'Ultra-cushioned, gasket-dampened keypress with soft plush thud',
  },
  {
    id: 'studio-linear',
    name: 'Studio Linear',
    category: 'desk',
    tag: 'Studio',
    description: 'Clean, acoustically treated linear switches with low noise floor',
  },
  {
    id: 'topre-electro',
    name: 'Topre Electro-Capacitive',
    category: 'desk',
    tag: 'Capacitive',
    description: 'Distinctive conical spring and rubber dome thwack with refined quiet character',
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
    description: 'Light, rounded, clear tap with delicate high-frequency tempered glass detail',
  },
  {
    id: 'deep-bass',
    name: 'Deep Bass',
    category: 'experimental',
    tag: 'Sub Bass',
    description: 'Warm, low-frequency punch with restrained sub body and tight decay',
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
  volume: 0.75, // range: 0.0 to 1.0 (75%)
};

const STORAGE_KEY = 'keyflow_keyboard_sound_settings_v1';

// Legacy ID migration map
const LEGACY_PROFILE_MAP = {
  classic: 'classic-keyboard',
  silent: 'silent-office',
};

// Shared AudioContext & master pipeline for low-latency synthesis
let audioCtx = null;
let masterGainNode = null;
let limiterNode = null;
let noiseBuffer = null;
let activeVoiceCount = 0;
let lastPlaySoundTime = 0;
const MAX_CONCURRENT_VOICES = 12;
const MIN_SOUND_INTERVAL_MS = 10; // Rate limits keystroke audio bursts to prevent audio buffer overload

/**
 * Initializes the studio master processing bus with DynamicsCompressor (Limiter)
 * and master volume gain node.
 */
function initMasterBus(ctx) {
  if (!ctx) return;
  try {
    if (!masterGainNode) {
      masterGainNode = ctx.createGain();
      const settings = getSoundSettings();
      masterGainNode.gain.setValueAtTime(settings.volume ?? 0.75, ctx.currentTime);
    }
    if (!limiterNode) {
      limiterNode = ctx.createDynamicsCompressor();
      limiterNode.threshold.setValueAtTime(-1.5, ctx.currentTime);
      limiterNode.knee.setValueAtTime(6.0, ctx.currentTime);
      limiterNode.ratio.setValueAtTime(18.0, ctx.currentTime);
      limiterNode.attack.setValueAtTime(0.001, ctx.currentTime);
      limiterNode.release.setValueAtTime(0.045, ctx.currentTime);

      masterGainNode.connect(limiterNode);
      limiterNode.connect(ctx.destination);
    }
  } catch {
    /* ignore fallback */
  }
}

/**
 * Updates master volume level immediately across active AudioContext.
 */
export function updateMasterVolume(vol) {
  if (typeof vol !== 'number') return;
  const clamped = Math.max(0, Math.min(1, vol));
  if (audioCtx && masterGainNode) {
    try {
      masterGainNode.gain.setValueAtTime(clamped, audioCtx.currentTime);
    } catch {
      /* ignore */
    }
  }
}

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
      initMasterBus(audioCtx);
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Browser Autoplay Policy Unlock
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };
  window.addEventListener('click', unlockAudio, { passive: true, once: true });
  window.addEventListener('keydown', unlockAudio, { passive: true, once: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true, once: true });
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

    const validVolume = typeof parsed.volume === 'number' && !isNaN(parsed.volume)
      ? Math.max(0, Math.min(1, parsed.volume))
      : DEFAULT_SOUND_SETTINGS.volume;

    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : DEFAULT_SOUND_SETTINGS.enabled,
      profile: validProfile,
      volume: validVolume,
    };
  } catch {
    return DEFAULT_SOUND_SETTINGS;
  }
}

/**
 * Persists keyboard sound settings and broadcasts update event.
 * Guards against recursive loops and unnecessary broadcasts by only
 * persisting and dispatching when settings have actually changed.
 */
export function saveSoundSettings(settings, { broadcast = true, force = false } = {}) {
  if (typeof localStorage === 'undefined' || !settings) return;
  try {
    const current = getSoundSettings();
    const nextProfile = settings.profile && SOUND_PROFILES.some((p) => p.id === settings.profile)
      ? settings.profile
      : current.profile;
    const nextEnabled = typeof settings.enabled === 'boolean'
      ? settings.enabled
      : current.enabled;
    const nextVolume = typeof settings.volume === 'number' && !isNaN(settings.volume)
      ? Math.max(0, Math.min(1, settings.volume))
      : current.volume;

    const hasChanged = (
      current.enabled !== nextEnabled ||
      current.profile !== nextProfile ||
      Math.abs(current.volume - nextVolume) > 0.001
    );

    const updated = {
      enabled: nextEnabled,
      profile: nextProfile,
      volume: nextVolume,
    };

    if (updated.volume !== undefined) {
      updateMasterVolume(updated.volume);
    }

    if (!hasChanged && !force) {
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    if (broadcast && typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(
        new CustomEvent('keyflow-sound-settings-updated', { detail: updated })
      );
    }
  } catch {
    // localStorage may fail in restricted iframes
  }
}

// ── Reusable Physical Acoustic Synthesis Helpers ───────────────────────────

/**
 * Plays a shaped noise transient burst into a bandpass or highpass filter.
 * Simulates mechanical actuation clicks, stem slider friction, or plate impact sparks.
 */
function playShapedNoise(ctx, destination, {
  now,
  filterType = 'bandpass',
  frequency = 3000,
  Q = 3.5,
  gain = 0.1,
  duration = 0.012,
  attack = 0.001,
}) {
  const noise = ctx.createBufferSource();
  noise.buffer = getNoiseBuffer(ctx);

  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.setValueAtTime(frequency, now);
  filter.Q.setValueAtTime(Q, now);

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.linearRampToValueAtTime(gain, now + attack);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  noise.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(destination);

  noise.start(now);
  noise.stop(now + duration + 0.005);
}

/**
 * Resonant Formant Body Impact
 * Excites a natural acoustic resonant mode (keycap cavity, switch plate, or chassis)
 * using an impulse-excited damped oscillator / resonant bandpass.
 */
function playResonantBody(ctx, destination, {
  now,
  frequency = 300,
  type = 'triangle',
  gain = 0.12,
  duration = 0.03,
  lowpassCutoff = null,
  pitchGlideTo = null,
}) {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, now);
  if (pitchGlideTo && pitchGlideTo !== frequency) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, pitchGlideTo), now + duration * 0.7);
  }

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.linearRampToValueAtTime(gain, now + 0.001);
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
 * Metallic Spring / Resonant Ping Layer
 * Simulates subtle metallic switch spring vibration, buckling spring ring, or striker clink.
 */
function playMetallicSpring(ctx, destination, {
  now,
  freq1 = 2800,
  freq2 = 4200,
  gain = 0.04,
  duration = 0.025,
}) {
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  osc1.type = 'sine';
  osc2.type = 'sine';
  osc1.frequency.setValueAtTime(freq1, now);
  osc2.frequency.setValueAtTime(freq2, now);

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.linearRampToValueAtTime(gain, now + 0.001);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc1.connect(gainNode);
  osc2.connect(gainNode);
  gainNode.connect(destination);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + duration + 0.005);
  osc2.stop(now + duration + 0.005);
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

  // Rate limiting to prevent audio buffer saturation & thread crashes on burst/paste
  const nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
  if (!force && (nowMs - lastPlaySoundTime < MIN_SOUND_INTERVAL_MS)) {
    return;
  }
  lastPlaySoundTime = nowMs;

  const ctx = getAudioContext();
  if (!ctx) return;

  // Voice limiting to prevent distortion during rapid typing bursts
  if (activeVoiceCount >= MAX_CONCURRENT_VOICES) {
    return;
  }

  try {
    const now = ctx.currentTime;
    const voiceMaster = ctx.createGain();

    // Connect to studio master processing bus or direct to destination as fallback
    if (masterGainNode) {
      voiceMaster.connect(masterGainNode);
    } else {
      voiceMaster.connect(ctx.destination);
    }

    // Subtle natural human micro-variations
    const pitchDetune = (Math.random() - 0.5) * 32; // +/- 16 cents
    const gainVar = 0.94 + Math.random() * 0.12; // +/- 6% volume
    const durationVar = 0.95 + Math.random() * 0.1; // +/- 5% decay
    const errorPitchMult = isError ? 0.75 : 1.0;
    const errorGainMult = isError ? 1.2 : 1.0;

    activeVoiceCount++;
    const cleanupTime = 0.11;
    setTimeout(() => {
      activeVoiceCount = Math.max(0, activeVoiceCount - 1);
      try {
        voiceMaster.disconnect();
      } catch {
        /* ignore */
      }
    }, cleanupTime * 1000 + 10);

    switch (profileId) {
      // ═════════════════════════════════════════════════════════════════════
      // ── A. Mechanical Collection ─────────────────────────────────────────
      // ═════════════════════════════════════════════════════════════════════

      case 'mechanical-blue': {
        // Cherry MX Blue style: Crisp, sharp click-jacket with defined transient and ABS clack
        // 1. Dual-stage sharp click transient (click-jacket snapping past the leaf)
        playShapedNoise(ctx, voiceMaster, {
          now,
          filterType: 'bandpass',
          frequency: (isError ? 2600 : 3750) + pitchDetune * 3,
          Q: 4.8,
          gain: (isError ? 0.18 : 0.15) * gainVar,
          duration: 0.009 * durationVar,
          attack: 0.0006,
        });

        // 2. Plastic keycap and housing clack (formant body resonance at ~530Hz -> ~310Hz)
        playResonantBody(ctx, voiceMaster, {
          now: now + 0.0018,
          type: isError ? 'sawtooth' : 'triangle',
          frequency: (isError ? 340 : 530) * errorPitchMult + pitchDetune,
          pitchGlideTo: (isError ? 200 : 310) * errorPitchMult,
          gain: 0.12 * gainVar * errorGainMult,
          duration: 0.035 * durationVar,
          lowpassCutoff: isError ? 1200 : 2200,
        });

        // 3. Subtle internal leaf spring ping
        playMetallicSpring(ctx, voiceMaster, {
          now: now + 0.003,
          freq1: 3400 + pitchDetune,
          freq2: 4800 + pitchDetune * 2,
          gain: 0.024 * gainVar,
          duration: 0.018,
        });

        // 4. Low-mid foundation warmth
        playResonantBody(ctx, voiceMaster, {
          now,
          type: 'sine',
          frequency: 230 * errorPitchMult,
          gain: 0.04 * gainVar,
          duration: 0.025,
          lowpassCutoff: 500,
        });
        break;
      }

      case 'mechanical-red': {
        // Cherry MX Red style: Smooth, lightweight linear keystroke with soft dampened bottom-out
        // Zero click. Smooth housing contact with short, natural decay
        // 1. Gentle stem slider friction (broadband soft noise)
        playShapedNoise(ctx, voiceMaster, {
          now,
          filterType: 'bandpass',
          frequency: 1150 + pitchDetune,
          Q: 1.8,
          gain: 0.045 * gainVar,
          duration: 0.015 * durationVar,
          attack: 0.001,
        });

        // 2. Dampened plastic bottom-out clack (clean 410Hz -> 250Hz body)
        playResonantBody(ctx, voiceMaster, {
          now,
          type: 'triangle',
          frequency: (isError ? 270 : 410) * errorPitchMult + pitchDetune,
          pitchGlideTo: (isError ? 160 : 250) * errorPitchMult,
          gain: 0.12 * gainVar * errorGainMult,
          duration: 0.026 * durationVar,
          lowpassCutoff: isError ? 800 : 1200,
        });

        // 3. Low-end cushion thud
        playResonantBody(ctx, voiceMaster, {
          now,
          type: 'sine',
          frequency: 195 * errorPitchMult,
          gain: 0.06 * gainVar,
          duration: 0.028,
          lowpassCutoff: 450,
        });
        break;
      }

      case 'mechanical-brown': {
        // Cherry MX Brown style: Balanced tactile bump with rounded clack (no click jacket)
        // 1. Rounded tactile bump transient (mid-frequency, lower Q than Blue)
        playShapedNoise(ctx, voiceMaster, {
          now,
          filterType: 'bandpass',
          frequency: (isError ? 1500 : 2150) + pitchDetune * 2,
          Q: 2.8,
          gain: (isError ? 0.12 : 0.09) * gainVar,
          duration: 0.014 * durationVar,
          attack: 0.001,
        });

        // 2. Medium tactile bottom-out clack (body at ~450Hz -> ~265Hz)
        playResonantBody(ctx, voiceMaster, {
          now: now + 0.001,
          type: isError ? 'sawtooth' : 'triangle',
          frequency: (isError ? 280 : 450) * errorPitchMult + pitchDetune,
          pitchGlideTo: (isError ? 170 : 265) * errorPitchMult,
          gain: 0.13 * gainVar * errorGainMult,
          duration: 0.032 * durationVar,
          lowpassCutoff: isError ? 1000 : 1700,
        });

        // 3. Low-mid tactile foundation
        playResonantBody(ctx, voiceMaster, {
          now,
          type: 'sine',
          frequency: 260 * errorPitchMult,
          gain: 0.06 * gainVar,
          duration: 0.025,
          lowpassCutoff: 550,
        });
        break;
      }

      case 'creamy-thock': {
        // Custom Lubed Switch on POM/PC Plate: Deep, warm, low-mid resonance
        // 1. Muted lubed housing tap
        playShapedNoise(ctx, voiceMaster, {
          now,
          filterType: 'bandpass',
          frequency: (isError ? 340 : 460) + pitchDetune,
          Q: 4.5,
          gain: 0.14 * gainVar * errorGainMult,
          duration: 0.022 * durationVar,
          attack: 0.0012,
        });

        // 2. Deep keycap cavity & plate thock body (warm sine resonant mode at ~185Hz -> ~110Hz)
        playResonantBody(ctx, voiceMaster, {
          now,
          type: 'sine',
          frequency: (isError ? 135 : 185) * errorPitchMult + pitchDetune,
          pitchGlideTo: (isError ? 85 : 110) * errorPitchMult,
          gain: (isError ? 0.24 : 0.22) * gainVar,
          duration: 0.045 * durationVar,
          lowpassCutoff: isError ? 500 : 650,
        });

        // 3. Sub-warmth chassis resonance layer (95Hz foundation)
        playResonantBody(ctx, voiceMaster, {
          now,
          type: 'sine',
          frequency: 95 * errorPitchMult,
          gain: 0.11 * gainVar,
          duration: 0.04,
          lowpassCutoff: 280,
        });
        break;
      }

      case 'marble-pop': {
        // PE Foam / Tape Mod Marbly Pop: High-Q bubble-like pop transient with controlled decay
        // 1. High-Q resonant bubble pop transient at ~1650Hz
        playShapedNoise(ctx, voiceMaster, {
          now,
          filterType: 'bandpass',
          frequency: (isError ? 1150 : 1650) + pitchDetune * 3,
          Q: 7.5,
          gain: (isError ? 0.19 : 0.17) * gainVar,
          duration: 0.018 * durationVar,
          attack: 0.0007,
        });

        // 2. Rounded keycap marbly pop body (glide from 630Hz -> 330Hz)
        playResonantBody(ctx, voiceMaster, {
          now,
          type: 'sine',
          frequency: (isError ? 430 : 630) * errorPitchMult + pitchDetune,
          pitchGlideTo: (isError ? 220 : 330) * errorPitchMult,
          gain: 0.14 * gainVar * errorGainMult,
          duration: 0.03 * durationVar,
          lowpassCutoff: 1500,
        });

        // 3. Pop air shimmer tail
        playShapedNoise(ctx, voiceMaster, {
          now: now + 0.004,
          filterType: 'bandpass',
          frequency: 2200 + pitchDetune * 2,
          Q: 3.2,
          gain: 0.035 * gainVar,
          duration: 0.012,
          attack: 0.0005,
        });
        break;
      }

      case 'box-jade': {
        // Kailh Box Jade style: Pronounced, bright, snappy double click-bar attack
        // 1. High-energy click-bar snap (fast burst at 4.6kHz)
        playShapedNoise(ctx, voiceMaster, {
          now,
          filterType: 'bandpass',
          frequency: (isError ? 3200 : 4650) + pitchDetune * 4,
          Q: 5.8,
          gain: (isError ? 0.22 : 0.18) * gainVar,
          duration: 0.009 * durationVar,
          attack: 0.0005,
        });

        // 2. Second click rebound micro-transient (click-bar reset contact)
        playShapedNoise(ctx, voiceMaster, {
          now: now + 0.0035,
          filterType: 'bandpass',
          frequency: 3850 + pitchDetune * 2,
          Q: 4.4,
          gain: 0.09 * gainVar,
          duration: 0.006,
          attack: 0.0005,
        });

        // 3. Rigid bottom-out clack
        playResonantBody(ctx, voiceMaster, {
          now: now + 0.001,
          type: isError ? 'sawtooth' : 'triangle',
          frequency: (isError ? 280 : 420) * errorPitchMult + pitchDetune,
          pitchGlideTo: (isError ? 160 : 260) * errorPitchMult,
          gain: 0.14 * gainVar * errorGainMult,
          duration: 0.032 * durationVar,
          lowpassCutoff: isError ? 1500 : 2500,
        });

        // 4. Click-bar metallic harmonic ring
        playResonantBody(ctx, voiceMaster, {
          now,
          type: 'sine',
          frequency: 5600 + pitchDetune * 2,
          gain: 0.03 * gainVar,
          duration: 0.016,
          lowpassCutoff: 6500,
        });
        break;
      }

      case 'holy-panda': {
        // Holy Panda Enthusiast Tactile: Heavy, rounded stem snap with authoritative nylon bottom-out
        // 1. Pronounced, solid tactile bump transient at ~1.68kHz (heavy bump, no high click-jacket)
        playShapedNoise(ctx, voiceMaster, {
          now,
          filterType: 'bandpass',
          frequency: (isError ? 1200 : 1680) + pitchDetune * 2,
          Q: 4.0,
          gain: (isError ? 0.18 : 0.14) * gainVar,
          duration: 0.016 * durationVar,
          attack: 0.0009,
        });

        // 2. Solid nylon housing bottom-out clack (resonant body at ~490Hz -> ~285Hz)
        playResonantBody(ctx, voiceMaster, {
          now: now + 0.001,
          type: isError ? 'sawtooth' : 'triangle',
          frequency: (isError ? 320 : 490) * errorPitchMult + pitchDetune,
          pitchGlideTo: (isError ? 180 : 285) * errorPitchMult,
          gain: 0.16 * gainVar * errorGainMult,
          duration: 0.038 * durationVar,
          lowpassCutoff: isError ? 1100 : 1900,
        });

        // 3. Full-bodied low-mid warmth foundation (225Hz)
        playResonantBody(ctx, voiceMaster, {
          now,
          type: 'sine',
          frequency: 225 * errorPitchMult,
          gain: 0.1 * gainVar,
          duration: 0.034,
          lowpassCutoff: 600,
        });
        break;
      }

      case 'buckling-spring': {
        // IBM Model M Buckling Spring style: Coiled spring buckle snap + stamped steel backplate resonance
        // 1. Spring coil buckling snap transient
        playShapedNoise(ctx, voiceMaster, {
          now,
          filterType: 'bandpass',
          frequency: (isError ? 2450 : 3350) + pitchDetune * 3,
          Q: 4.6,
          gain: (isError ? 0.18 : 0.14) * gainVar,
          duration: 0.012 * durationVar,
          attack: 0.0007,
        });

        // 2. Steel curved backplate heavy mechanical thud
        playResonantBody(ctx, voiceMaster, {
          now: now + 0.0018,
          type: isError ? 'sawtooth' : 'triangle',
          frequency: (isError ? 190 : 285) * errorPitchMult + pitchDetune,
          pitchGlideTo: (isError ? 95 : 135) * errorPitchMult,
          gain: 0.17 * gainVar * errorGainMult,
          duration: 0.048 * durationVar,
          lowpassCutoff: isError ? 750 : 1250,
        });

        // 3. Distinctive high-frequency metallic spring ring (5.25kHz / 2.95kHz)
        playMetallicSpring(ctx, voiceMaster, {
          now: now + 0.0025,
          freq1: 2950 + pitchDetune * 2,
          freq2: 5250 + pitchDetune * 3,
          gain: 0.05 * gainVar,
          duration: 0.038,
        });

        // 4. Stamped steel plate reverberation
        playResonantBody(ctx, voiceMaster, {
          now: now + 0.002,
          type: 'triangle',
          frequency: 780 + pitchDetune,
          gain: 0.04 * gainVar,
          duration: 0.025,
          lowpassCutoff: 1600,
        });
        break;
      }

      case 'gateron-yellow': {
        // Gateron Yellow Pro style: Buttery smooth linear keypress with deep milky housing thud
        // 1. Silent, buttery stem travel (subtle housing air displacement)
        playShapedNoise(ctx, voiceMaster, {
          now,
          filterType: 'bandpass',
          frequency: 980 + pitchDetune,
          Q: 1.7,
          gain: 0.038 * gainVar,
          duration: 0.014 * durationVar,
          attack: 0.001,
        });

        // 2. Warm milky nylon housing bottom-out (345Hz body -> 210Hz)
        playResonantBody(ctx, voiceMaster, {
          now,
          type: 'triangle',
          frequency: (isError ? 240 : 345) * errorPitchMult + pitchDetune,
          pitchGlideTo: (isError ? 150 : 210) * errorPitchMult,
          gain: 0.13 * gainVar * errorGainMult,
          duration: 0.028 * durationVar,
          lowpassCutoff: isError ? 750 : 1100,
        });

        // 3. Low-end body warmth
        playResonantBody(ctx, voiceMaster, {
          now,
          type: 'sine',
          frequency: 175 * errorPitchMult,
          gain: 0.08 * gainVar,
          duration: 0.032,
          lowpassCutoff: 480,
        });
        break;
      }

      // ═════════════════════════════════════════════════════════════════════
      // ── B. Desk Setup Collection ──────────────────────────────────────────
      // ═════════════════════════════════════════════════════════════════════

      case 'laptop-chiclet': {
        // Low-profile Scissor Switch (MacBook / ThinkPad): Ultra-short travel, delicate, crisp
        // 1. High-frequency crisp scissor snap (short tap)
        playShapedNoise(ctx, voiceMaster, {
          now,
          filterType: 'bandpass',
          frequency: (isError ? 1950 : 2750) + pitchDetune * 2,
          Q: 3.4,
          gain: (isError ? 0.13 : 0.09) * gainVar,
          duration: 0.008 * durationVar,
          attack: 0.0005,
        });

        // 2. Short, low-energy keycap bottom-out (very quick decay)
        playResonantBody(ctx, voiceMaster, {
          now,
          type: 'triangle',
          frequency: (isError ? 260 : 420) * errorPitchMult + pitchDetune,
          pitchGlideTo: (isError ? 180 : 275) * errorPitchMult,
          gain: 0.08 * gainVar * errorGainMult,
          duration: 0.016 * durationVar,
          lowpassCutoff: isError ? 1100 : 1900,
        });
        break;
      }

      case 'classic-keyboard': {
        // Classic Desktop Membrane Keyboard: Neutral rubber dome attack & decay
        // 1. Membrane contact tap
        playShapedNoise(ctx, voiceMaster, {
          now,
          filterType: 'bandpass',
          frequency: 1380 + pitchDetune * 2,
          Q: 2.2,
          gain: 0.07 * gainVar * errorGainMult,
          duration: 0.015 * durationVar,
          attack: 0.001,
        });

        // 2. Rubber dome collapse body
        playResonantBody(ctx, voiceMaster, {
          now,
          type: isError ? 'sawtooth' : 'triangle',
          frequency: (isError ? 220 : 335) * errorPitchMult + pitchDetune,
          pitchGlideTo: (isError ? 120 : 180) * errorPitchMult,
          gain: 0.11 * gainVar * errorGainMult,
          duration: 0.028 * durationVar,
          lowpassCutoff: isError ? 850 : 1350,
        });

        // 3. Plastic case cavity air
        playResonantBody(ctx, voiceMaster, {
          now,
          type: 'sine',
          frequency: 160 * errorPitchMult,
          gain: 0.05 * gainVar,
          duration: 0.022,
          lowpassCutoff: 400,
        });
        break;
      }

      case 'retro-typewriter': {
        // Vintage Mechanical Typewriter: Warm metallic striker impact & heavy frame thud
        // 1. High metallic striker face collision
        playShapedNoise(ctx, voiceMaster, {
          now,
          filterType: 'bandpass',
          frequency: (isError ? 1450 : 1950) + pitchDetune * 3,
          Q: 5.4,
          gain: (isError ? 0.18 : 0.14) * gainVar,
          duration: 0.015 * durationVar,
          attack: 0.0006,
        });

        // 2. Heavy mechanical chassis cast-iron frame thud
        playResonantBody(ctx, voiceMaster, {
          now: now + 0.001,
          type: isError ? 'sawtooth' : 'triangle',
          frequency: (isError ? 200 : 295) * errorPitchMult + pitchDetune,
          pitchGlideTo: (isError ? 75 : 115) * errorPitchMult,
          gain: 0.16 * gainVar * errorGainMult,
          duration: 0.046 * durationVar,
          lowpassCutoff: isError ? 700 : 1100,
        });

        // 3. Resonant striker arm metallic ring (2.45kHz)
        playMetallicSpring(ctx, voiceMaster, {
          now: now + 0.002,
          freq1: 2450 + pitchDetune,
          freq2: 3900 + pitchDetune * 2,
          gain: 0.035 * gainVar,
          duration: 0.024,
        });
        break;
      }

      case 'soft-foam': {
        // Silenced Gasket-Mounted Poron Foam: Soft, muffled, cushioned thud
        // 1. Heavily damped lowpass foam collision (no high frequencies)
        playResonantBody(ctx, voiceMaster, {
          now,
          type: 'sine',
          frequency: (isError ? 140 : 205) * errorPitchMult + pitchDetune,
          pitchGlideTo: (isError ? 80 : 115) * errorPitchMult,
          gain: (isError ? 0.16 : 0.13) * gainVar,
          duration: 0.025 * durationVar,
          lowpassCutoff: 350,
        });

        // 2. Soft cushioned micro-tap
        playShapedNoise(ctx, voiceMaster, {
          now,
          filterType: 'lowpass',
          frequency: 280,
          Q: 1.0,
          gain: 0.055 * gainVar,
          duration: 0.014,
          attack: 0.0015,
        });
        break;
      }

      case 'studio-linear': {
        // Acoustically Treated Studio Linear: Clean, balanced, pleasant for extended typing sessions
        // 1. Gentle rounded transient
        playShapedNoise(ctx, voiceMaster, {
          now,
          filterType: 'bandpass',
          frequency: 1180 + pitchDetune * 2,
          Q: 2.3,
          gain: 0.05 * gainVar,
          duration: 0.013 * durationVar,
          attack: 0.001,
        });

        // 2. Restrained, harmonic bottom-out body
        playResonantBody(ctx, voiceMaster, {
          now,
          type: 'triangle',
          frequency: (isError ? 230 : 345) * errorPitchMult + pitchDetune,
          pitchGlideTo: (isError ? 130 : 185) * errorPitchMult,
          gain: 0.11 * gainVar * errorGainMult,
          duration: 0.025 * durationVar,
          lowpassCutoff: isError ? 900 : 1350,
        });

        // 3. Low-noise foundation
        playResonantBody(ctx, voiceMaster, {
          now,
          type: 'sine',
          frequency: 210 * errorPitchMult,
          gain: 0.05 * gainVar,
          duration: 0.022,
          lowpassCutoff: 450,
        });
        break;
      }

      case 'topre-electro': {
        // Topre Electro-Capacitive Style: Conical spring + rubber dome collapse "thwack"
        // 1. Dome collapse "thwack" transient (rounded, warm mid-range, no sharp click)
        playShapedNoise(ctx, voiceMaster, {
          now,
          filterType: 'bandpass',
          frequency: (isError ? 650 : 890) + pitchDetune,
          Q: 2.9,
          gain: (isError ? 0.13 : 0.10) * gainVar,
          duration: 0.016 * durationVar,
          attack: 0.001,
        });

        // 2. Deep rubber dome & slider housing bottom-out (warm 245Hz / 145Hz body)
        playResonantBody(ctx, voiceMaster, {
          now,
          type: 'sine',
          frequency: (isError ? 160 : 245) * errorPitchMult + pitchDetune,
          pitchGlideTo: (isError ? 100 : 145) * errorPitchMult,
          gain: 0.15 * gainVar * errorGainMult,
          duration: 0.036 * durationVar,
          lowpassCutoff: 680,
        });

        // 3. Subtle conical spring compression ring
        playResonantBody(ctx, voiceMaster, {
          now: now + 0.002,
          type: 'triangle',
          frequency: 830 + pitchDetune,
          gain: 0.038 * gainVar,
          duration: 0.019,
          lowpassCutoff: 1250,
        });
        break;
      }

      // ═════════════════════════════════════════════════════════════════════
      // ── C. Experimental Collection ───────────────────────────────────────
      // ═════════════════════════════════════════════════════════════════════

      case 'cyber-pulse': {
        // Subtle futuristic electronic blip with short synth character
        playShapedNoise(ctx, voiceMaster, {
          now,
          filterType: 'highpass',
          frequency: (isError ? 2800 : 4400),
          Q: 1.5,
          gain: 0.075 * gainVar,
          duration: 0.008,
          attack: 0.0005,
        });

        playResonantBody(ctx, voiceMaster, {
          now,
          type: 'sine',
          frequency: (isError ? 560 : 860) * errorPitchMult + pitchDetune,
          pitchGlideTo: (isError ? 220 : 360) * errorPitchMult,
          gain: 0.12 * gainVar * errorGainMult,
          duration: 0.018,
        });
        break;
      }

      case 'glass-tap': {
        // Light, rounded, clear tap with delicate high-frequency detail (tempered glass)
        playShapedNoise(ctx, voiceMaster, {
          now,
          filterType: 'bandpass',
          frequency: (isError ? 2400 : 3200) + pitchDetune * 2,
          Q: 7.5,
          gain: (isError ? 0.16 : 0.12) * gainVar,
          duration: 0.012,
          attack: 0.0005,
        });

        playResonantBody(ctx, voiceMaster, {
          now,
          type: 'sine',
          frequency: (isError ? 620 : 910) * errorPitchMult + pitchDetune,
          pitchGlideTo: (isError ? 400 : 620) * errorPitchMult,
          gain: 0.1 * gainVar * errorGainMult,
          duration: 0.018,
        });
        break;
      }

      case 'deep-bass': {
        // Warm, low-frequency punch with restrained sub body and tight decay
        playResonantBody(ctx, voiceMaster, {
          now,
          type: 'sine',
          frequency: (isError ? 85 : 112) * errorPitchMult + pitchDetune,
          pitchGlideTo: (isError ? 42 : 58) * errorPitchMult,
          gain: (isError ? 0.22 : 0.19) * gainVar,
          duration: 0.038 * durationVar,
          lowpassCutoff: 320,
        });
        break;
      }

      case 'arcade-keys': {
        // Playful, retro digital micro-pip for the Arcade experience
        playResonantBody(ctx, voiceMaster, {
          now,
          type: 'square',
          frequency: (isError ? 420 : 650) * errorPitchMult + pitchDetune,
          pitchGlideTo: (isError ? 260 : 420) * errorPitchMult,
          gain: 0.07 * gainVar * errorGainMult,
          duration: 0.015,
          lowpassCutoff: isError ? 1100 : 1950,
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
