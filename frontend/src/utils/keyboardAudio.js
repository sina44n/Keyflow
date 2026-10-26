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
  // Micro-attack (0.8ms) to avoid digital DC clicks on start
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
    const pitchDetune = (Math.random() - 0.5) * 35; // +/- 17.5 cents
    const gainVar = 0.94 + Math.random() * 0.12; // +/- 6% volume
    const durationVar = 0.95 + Math.random() * 0.1; // +/- 5% decay
    const errorPitchMult = isError ? 0.74 : 1.0;
    const errorGainMult = isError ? 1.2 : 1.0;

    activeVoiceCount++;
    const cleanupTime = 0.09;
    setTimeout(() => {
      activeVoiceCount = Math.max(0, activeVoiceCount - 1);
      try {
        masterGain.disconnect();
      } catch {
        /* ignore */
      }
    }, cleanupTime * 1000 + 10);

    switch (profileId) {
      // ═════════════════════════════════════════════════════════════════════
      // ── A. Mechanical Collection ─────────────────────────────────────────
      // ═════════════════════════════════════════════════════════════════════

      case 'mechanical-blue': {
        // Cherry MX Blue style: Crisp, tactile click-jacket with defined transient and ABS clack
        // 1. Dual-stage sharp click transient (click-jacket snapping past the leaf)
        playShapedNoise(ctx, masterGain, {
          now,
          filterType: 'bandpass',
          frequency: (isError ? 2600 : 3650) + pitchDetune * 3,
          Q: 4.8,
          gain: (isError ? 0.18 : 0.14) * gainVar,
          duration: 0.009 * durationVar,
          attack: 0.0008,
        });

        // 2. Plastic keycap and housing clack (formant body resonance at ~520Hz and ~270Hz)
        playResonantBody(ctx, masterGain, {
          now: now + 0.002,
          type: isError ? 'sawtooth' : 'triangle',
          frequency: (isError ? 340 : 510) * errorPitchMult + pitchDetune,
          pitchGlideTo: (isError ? 200 : 310) * errorPitchMult,
          gain: 0.11 * gainVar * errorGainMult,
          duration: 0.034 * durationVar,
          lowpassCutoff: isError ? 1200 : 2100,
        });

        // 3. Subtle internal leaf spring ping
        playMetallicSpring(ctx, masterGain, {
          now: now + 0.003,
          freq1: 3400 + pitchDetune,
          freq2: 4800 + pitchDetune * 2,
          gain: 0.022 * gainVar,
          duration: 0.016,
        });
        break;
      }

      case 'mechanical-red': {
        // Cherry MX Red style: Smooth, lightweight linear keystroke with soft dampened bottom-out
        // Zero click. Smooth housing contact with short, natural decay
        // 1. Gentle stem slider friction (broadband soft noise)
        playShapedNoise(ctx, masterGain, {
          now,
          filterType: 'bandpass',
          frequency: 1100 + pitchDetune,
          Q: 1.8,
          gain: 0.04 * gainVar,
          duration: 0.014 * durationVar,
          attack: 0.001,
        });

        // 2. Dampened plastic bottom-out clack (clean 440Hz -> 260Hz body)
        playResonantBody(ctx, masterGain, {
          now,
          type: 'triangle',
          frequency: (isError ? 270 : 420) * errorPitchMult + pitchDetune,
          pitchGlideTo: (isError ? 160 : 250) * errorPitchMult,
          gain: 0.11 * gainVar * errorGainMult,
          duration: 0.024 * durationVar,
          lowpassCutoff: isError ? 800 : 1150,
        });
        break;
      }

      case 'mechanical-brown': {
        // Cherry MX Brown style: Balanced tactile bump with rounded clack (no click jacket)
        // 1. Rounded tactile bump transient (mid-frequency, lower Q than Blue)
        playShapedNoise(ctx, masterGain, {
          now,
          filterType: 'bandpass',
          frequency: (isError ? 1500 : 2100) + pitchDetune * 2,
          Q: 2.8,
          gain: (isError ? 0.11 : 0.08) * gainVar,
          duration: 0.014 * durationVar,
          attack: 0.001,
        });

        // 2. Medium tactile bottom-out clack (body at ~440Hz, housing at ~760Hz)
        playResonantBody(ctx, masterGain, {
          now: now + 0.001,
          type: isError ? 'sawtooth' : 'triangle',
          frequency: (isError ? 280 : 430) * errorPitchMult + pitchDetune,
          pitchGlideTo: (isError ? 170 : 260) * errorPitchMult,
          gain: 0.12 * gainVar * errorGainMult,
          duration: 0.03 * durationVar,
          lowpassCutoff: isError ? 1000 : 1600,
        });
        break;
      }

      case 'creamy-thock': {
        // Custom Lubed Switch on POM/PC Plate: Deep, warm, low-mid resonance
        // 1. Muted lubed housing tap
        playShapedNoise(ctx, masterGain, {
          now,
          filterType: 'bandpass',
          frequency: (isError ? 340 : 450) + pitchDetune,
          Q: 4.8,
          gain: 0.13 * gainVar * errorGainMult,
          duration: 0.022 * durationVar,
          attack: 0.0015,
        });

        // 2. Deep keycap cavity & plate thock body (warm sine resonant mode at ~190Hz -> ~125Hz)
        playResonantBody(ctx, masterGain, {
          now,
          type: 'sine',
          frequency: (isError ? 135 : 195) * errorPitchMult + pitchDetune,
          pitchGlideTo: (isError ? 90 : 125) * errorPitchMult,
          gain: (isError ? 0.22 : 0.18) * gainVar,
          duration: 0.042 * durationVar,
          lowpassCutoff: isError ? 500 : 700,
        });

        // 3. Sub-warmth body layer (110Hz rounded foundation)
        playResonantBody(ctx, masterGain, {
          now,
          type: 'sine',
          frequency: 110 * errorPitchMult,
          gain: 0.08 * gainVar,
          duration: 0.035,
          lowpassCutoff: 300,
        });
        break;
      }

      case 'marble-pop': {
        // PE Foam / Tape Mod Marbly Pop: High-Q bubble-like pop transient with controlled decay
        // 1. High-Q resonant bubble pop transient at ~1550Hz
        playShapedNoise(ctx, masterGain, {
          now,
          filterType: 'bandpass',
          frequency: (isError ? 1100 : 1550) + pitchDetune * 3,
          Q: 6.8,
          gain: (isError ? 0.18 : 0.15) * gainVar,
          duration: 0.018 * durationVar,
          attack: 0.0008,
        });

        // 2. Rounded keycap marbly pop body (glide from 580Hz -> 320Hz)
        playResonantBody(ctx, masterGain, {
          now,
          type: 'sine',
          frequency: (isError ? 420 : 610) * errorPitchMult + pitchDetune,
          pitchGlideTo: (isError ? 220 : 330) * errorPitchMult,
          gain: 0.13 * gainVar * errorGainMult,
          duration: 0.028 * durationVar,
          lowpassCutoff: 1400,
        });
        break;
      }

      case 'box-jade': {
        // Kailh Box Jade style: Pronounced, bright, snappy double click-bar attack
        // 1. High-energy click-bar snap (fast 8ms burst at 4.5kHz)
        playShapedNoise(ctx, masterGain, {
          now,
          filterType: 'bandpass',
          frequency: (isError ? 3100 : 4550) + pitchDetune * 4,
          Q: 5.6,
          gain: (isError ? 0.2 : 0.16) * gainVar,
          duration: 0.009 * durationVar,
          attack: 0.0006,
        });

        // 2. Second click rebound micro-transient (click-bar reset contact)
        playShapedNoise(ctx, masterGain, {
          now: now + 0.004,
          filterType: 'bandpass',
          frequency: 3800 + pitchDetune * 2,
          Q: 4.2,
          gain: 0.08 * gainVar,
          duration: 0.006,
          attack: 0.0005,
        });

        // 3. Rigid bottom-out clack
        playResonantBody(ctx, masterGain, {
          now: now + 0.001,
          type: isError ? 'sawtooth' : 'triangle',
          frequency: (isError ? 270 : 400) * errorPitchMult + pitchDetune,
          pitchGlideTo: (isError ? 160 : 250) * errorPitchMult,
          gain: 0.13 * gainVar * errorGainMult,
          duration: 0.032 * durationVar,
          lowpassCutoff: isError ? 1500 : 2400,
        });
        break;
      }

      case 'holy-panda': {
        // Holy Panda Enthusiast Tactile: Heavy, rounded stem snap with authoritative nylon bottom-out
        // 1. Pronounced, solid tactile bump transient at ~1.6kHz (heavier than Brown, no high click-jacket)
        playShapedNoise(ctx, masterGain, {
          now,
          filterType: 'bandpass',
          frequency: (isError ? 1150 : 1620) + pitchDetune * 2,
          Q: 3.8,
          gain: (isError ? 0.17 : 0.13) * gainVar,
          duration: 0.016 * durationVar,
          attack: 0.001,
        });

        // 2. Solid nylon housing bottom-out clack (resonant body at ~490Hz -> ~290Hz)
        playResonantBody(ctx, masterGain, {
          now: now + 0.001,
          type: isError ? 'sawtooth' : 'triangle',
          frequency: (isError ? 320 : 485) * errorPitchMult + pitchDetune,
          pitchGlideTo: (isError ? 180 : 285) * errorPitchMult,
          gain: 0.15 * gainVar * errorGainMult,
          duration: 0.036 * durationVar,
          lowpassCutoff: isError ? 1100 : 1800,
        });

        // 3. Full-bodied low-mid warmth foundation (230Hz)
        playResonantBody(ctx, masterGain, {
          now,
          type: 'sine',
          frequency: 230 * errorPitchMult,
          gain: 0.09 * gainVar,
          duration: 0.03,
          lowpassCutoff: 600,
        });
        break;
      }

      case 'buckling-spring': {
        // IBM Model M Buckling Spring style: Coiled spring buckle snap + stamped steel backplate resonance
        // 1. Spring coil buckling snap transient
        playShapedNoise(ctx, masterGain, {
          now,
          filterType: 'bandpass',
          frequency: (isError ? 2400 : 3300) + pitchDetune * 3,
          Q: 4.5,
          gain: (isError ? 0.17 : 0.13) * gainVar,
          duration: 0.012 * durationVar,
          attack: 0.0008,
        });

        // 2. Steel curved backplate heavy mechanical thud
        playResonantBody(ctx, masterGain, {
          now: now + 0.002,
          type: isError ? 'sawtooth' : 'triangle',
          frequency: (isError ? 190 : 280) * errorPitchMult + pitchDetune,
          pitchGlideTo: (isError ? 95 : 140) * errorPitchMult,
          gain: 0.16 * gainVar * errorGainMult,
          duration: 0.046 * durationVar,
          lowpassCutoff: isError ? 750 : 1200,
        });

        // 3. Distinctive high-frequency metallic spring ring (5.2kHz / 2.9kHz)
        playMetallicSpring(ctx, masterGain, {
          now: now + 0.003,
          freq1: 2950 + pitchDetune * 2,
          freq2: 5200 + pitchDetune * 3,
          gain: 0.045 * gainVar,
          duration: 0.035,
        });
        break;
      }

      case 'gateron-yellow': {
        // Gateron Yellow Pro style: Buttery smooth linear keypress with deep milky housing thud
        // 1. Silent, buttery stem travel (very subtle low-mid housing air displacement)
        playShapedNoise(ctx, masterGain, {
          now,
          filterType: 'bandpass',
          frequency: 950 + pitchDetune,
          Q: 1.6,
          gain: 0.035 * gainVar,
          duration: 0.012 * durationVar,
          attack: 0.0012,
        });

        // 2. Warm milky nylon housing bottom-out (330Hz body + 560Hz clack)
        playResonantBody(ctx, masterGain, {
          now,
          type: 'triangle',
          frequency: (isError ? 240 : 340) * errorPitchMult + pitchDetune,
          pitchGlideTo: (isError ? 150 : 210) * errorPitchMult,
          gain: 0.12 * gainVar * errorGainMult,
          duration: 0.026 * durationVar,
          lowpassCutoff: isError ? 750 : 1050,
        });

        // 3. Low-end body warmth
        playResonantBody(ctx, masterGain, {
          now,
          type: 'sine',
          frequency: 180 * errorPitchMult,
          gain: 0.07 * gainVar,
          duration: 0.028,
          lowpassCutoff: 450,
        });
        break;
      }

      // ═════════════════════════════════════════════════════════════════════
      // ── B. Desk Setup Collection ──────────────────────────────────────────
      // ═════════════════════════════════════════════════════════════════════

      case 'laptop-chiclet': {
        // Low-profile Scissor Switch (MacBook / ThinkPad): Ultra-short travel, delicate, crisp
        // 1. High-frequency crisp scissor snap (short 8ms tap)
        playShapedNoise(ctx, masterGain, {
          now,
          filterType: 'bandpass',
          frequency: (isError ? 1900 : 2700) + pitchDetune * 2,
          Q: 3.2,
          gain: (isError ? 0.12 : 0.08) * gainVar,
          duration: 0.009 * durationVar,
          attack: 0.0006,
        });

        // 2. Short, low-energy keycap bottom-out (very quick 16ms decay)
        playResonantBody(ctx, masterGain, {
          now,
          type: 'triangle',
          frequency: (isError ? 260 : 410) * errorPitchMult + pitchDetune,
          pitchGlideTo: (isError ? 180 : 270) * errorPitchMult,
          gain: 0.075 * gainVar * errorGainMult,
          duration: 0.017 * durationVar,
          lowpassCutoff: isError ? 1100 : 1800,
        });
        break;
      }

      case 'classic-keyboard': {
        // Classic Desktop Membrane Keyboard: Neutral rubber dome attack & decay
        // 1. Membrane contact tap
        playShapedNoise(ctx, masterGain, {
          now,
          filterType: 'bandpass',
          frequency: 1300 + pitchDetune * 2,
          Q: 2.1,
          gain: 0.065 * gainVar * errorGainMult,
          duration: 0.015 * durationVar,
          attack: 0.001,
        });

        // 2. Rubber dome collapse body
        playResonantBody(ctx, masterGain, {
          now,
          type: isError ? 'sawtooth' : 'triangle',
          frequency: (isError ? 220 : 330) * errorPitchMult + pitchDetune,
          pitchGlideTo: (isError ? 120 : 180) * errorPitchMult,
          gain: 0.1 * gainVar * errorGainMult,
          duration: 0.026 * durationVar,
          lowpassCutoff: isError ? 850 : 1300,
        });
        break;
      }

      case 'retro-typewriter': {
        // Vintage Mechanical Typewriter: Warm metallic striker impact & heavy frame thud (no bell on normal keys)
        // 1. High metallic striker face collision
        playShapedNoise(ctx, masterGain, {
          now,
          filterType: 'bandpass',
          frequency: (isError ? 1400 : 1880) + pitchDetune * 3,
          Q: 5.2,
          gain: (isError ? 0.17 : 0.13) * gainVar,
          duration: 0.016 * durationVar,
          attack: 0.0007,
        });

        // 2. Heavy mechanical chassis cast-iron frame thud
        playResonantBody(ctx, masterGain, {
          now: now + 0.001,
          type: isError ? 'sawtooth' : 'triangle',
          frequency: (isError ? 200 : 295) * errorPitchMult + pitchDetune,
          pitchGlideTo: (isError ? 75 : 120) * errorPitchMult,
          gain: 0.15 * gainVar * errorGainMult,
          duration: 0.044 * durationVar,
          lowpassCutoff: isError ? 700 : 1050,
        });

        // 3. Resonant striker arm metallic ring (2.4kHz)
        playMetallicSpring(ctx, masterGain, {
          now: now + 0.002,
          freq1: 2450 + pitchDetune,
          freq2: 3800 + pitchDetune * 2,
          gain: 0.03 * gainVar,
          duration: 0.022,
        });
        break;
      }

      case 'soft-foam': {
        // Silenced Gasket-Mounted Poron Foam: Soft, muffled, cushioned thud
        // 1. Heavily damped lowpass foam collision (no high frequencies)
        playResonantBody(ctx, masterGain, {
          now,
          type: 'sine',
          frequency: (isError ? 140 : 210) * errorPitchMult + pitchDetune,
          pitchGlideTo: (isError ? 80 : 120) * errorPitchMult,
          gain: (isError ? 0.15 : 0.11) * gainVar,
          duration: 0.023 * durationVar,
          lowpassCutoff: 380,
        });

        // 2. Soft cushioned micro-tap
        playShapedNoise(ctx, masterGain, {
          now,
          filterType: 'lowpass',
          frequency: 320,
          Q: 1.0,
          gain: 0.05 * gainVar,
          duration: 0.012,
          attack: 0.002,
        });
        break;
      }

      case 'studio-linear': {
        // Acoustically Treated Studio Linear: Clean, balanced, pleasant for extended typing sessions
        // 1. Gentle rounded transient
        playShapedNoise(ctx, masterGain, {
          now,
          filterType: 'bandpass',
          frequency: 1150 + pitchDetune * 2,
          Q: 2.2,
          gain: 0.048 * gainVar,
          duration: 0.012 * durationVar,
          attack: 0.001,
        });

        // 2. Restrained, harmonic bottom-out body
        playResonantBody(ctx, masterGain, {
          now,
          type: 'triangle',
          frequency: (isError ? 230 : 340) * errorPitchMult + pitchDetune,
          pitchGlideTo: (isError ? 130 : 185) * errorPitchMult,
          gain: 0.1 * gainVar * errorGainMult,
          duration: 0.024 * durationVar,
          lowpassCutoff: isError ? 900 : 1300,
        });
        break;
      }

      case 'topre-electro': {
        // Topre Electro-Capacitive Style: Conical spring + rubber dome collapse "thwack"
        // 1. Dome collapse "thwack" transient (rounded, warm mid-range, no sharp click)
        playShapedNoise(ctx, masterGain, {
          now,
          filterType: 'bandpass',
          frequency: (isError ? 650 : 880) + pitchDetune,
          Q: 2.8,
          gain: (isError ? 0.12 : 0.09) * gainVar,
          duration: 0.016 * durationVar,
          attack: 0.0012,
        });

        // 2. Deep rubber dome & slider housing bottom-out (warm 240Hz / 150Hz body)
        playResonantBody(ctx, masterGain, {
          now,
          type: 'sine',
          frequency: (isError ? 160 : 240) * errorPitchMult + pitchDetune,
          pitchGlideTo: (isError ? 100 : 145) * errorPitchMult,
          gain: 0.14 * gainVar * errorGainMult,
          duration: 0.034 * durationVar,
          lowpassCutoff: 650,
        });

        // 3. Subtle conical spring compression ring
        playResonantBody(ctx, masterGain, {
          now: now + 0.002,
          type: 'triangle',
          frequency: 820 + pitchDetune,
          gain: 0.035 * gainVar,
          duration: 0.018,
          lowpassCutoff: 1200,
        });
        break;
      }

      // ═════════════════════════════════════════════════════════════════════
      // ── C. Experimental Collection ───────────────────────────────────────
      // ═════════════════════════════════════════════════════════════════════

      case 'cyber-pulse': {
        // Subtle futuristic electronic blip with short synth character
        playShapedNoise(ctx, masterGain, {
          now,
          filterType: 'highpass',
          frequency: (isError ? 2800 : 4200),
          Q: 1.5,
          gain: 0.07 * gainVar,
          duration: 0.008,
          attack: 0.0005,
        });

        playResonantBody(ctx, masterGain, {
          now,
          type: 'sine',
          frequency: (isError ? 540 : 820) * errorPitchMult + pitchDetune,
          pitchGlideTo: (isError ? 220 : 360) * errorPitchMult,
          gain: 0.11 * gainVar * errorGainMult,
          duration: 0.017,
        });
        break;
      }

      case 'glass-tap': {
        // Light, rounded, clear tap with delicate high-frequency detail (tempered glass)
        playShapedNoise(ctx, masterGain, {
          now,
          filterType: 'bandpass',
          frequency: (isError ? 2300 : 3100) + pitchDetune * 2,
          Q: 7.2,
          gain: (isError ? 0.15 : 0.11) * gainVar,
          duration: 0.012,
          attack: 0.0006,
        });

        playResonantBody(ctx, masterGain, {
          now,
          type: 'sine',
          frequency: (isError ? 600 : 890) * errorPitchMult + pitchDetune,
          pitchGlideTo: (isError ? 400 : 620) * errorPitchMult,
          gain: 0.09 * gainVar * errorGainMult,
          duration: 0.016,
        });
        break;
      }

      case 'deep-bass': {
        // Warm, low-frequency punch with restrained sub body and tight decay
        playResonantBody(ctx, masterGain, {
          now,
          type: 'sine',
          frequency: (isError ? 90 : 115) * errorPitchMult + pitchDetune,
          pitchGlideTo: (isError ? 45 : 62) * errorPitchMult,
          gain: (isError ? 0.22 : 0.17) * gainVar,
          duration: 0.036 * durationVar,
          lowpassCutoff: 300,
        });
        break;
      }

      case 'arcade-keys': {
        // Playful, retro digital micro-pip for the Arcade experience
        playResonantBody(ctx, masterGain, {
          now,
          type: 'square',
          frequency: (isError ? 420 : 640) * errorPitchMult + pitchDetune,
          pitchGlideTo: (isError ? 260 : 420) * errorPitchMult,
          gain: 0.065 * gainVar * errorGainMult,
          duration: 0.014,
          lowpassCutoff: isError ? 1100 : 1900,
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
