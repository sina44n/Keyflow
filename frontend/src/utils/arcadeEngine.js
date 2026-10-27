/**
 * KEYFLOW Arcade — Shared Gameplay Engine & Audio Feedback
 * ========================================================
 * Provides deterministic mathematical metrics (WPM, Accuracy, Combos)
 * and lightweight Web Audio API synthesizer effects for retro arcade cues.
 */
import { ARCADE_WORDS } from '../data/arcadeGamesData.js';

/**
 * Standard touch-typing WPM formula:
 * (Characters Typed / 5) / (Elapsed Seconds / 60)
 */
export function calculateWpm(charsTyped, elapsedSeconds) {
  if (!charsTyped || !elapsedSeconds || elapsedSeconds <= 0) return 0;
  const minutes = Math.max(elapsedSeconds / 60, 0.01);
  const words = charsTyped / 5;
  return Math.max(0, Math.round(words / minutes));
}

/**
 * Standard touch-typing Accuracy formula:
 * (Correct Characters / Total Strokes) * 100
 */
export function calculateAccuracy(correctChars, totalStrokes) {
  if (!totalStrokes || totalStrokes <= 0) return 100;
  if (!correctChars || correctChars <= 0) return 0;
  const raw = (correctChars / totalStrokes) * 100;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

/**
 * Generates random words tailored to specified pool and length
 */
export function getRandomWord(pool = 'short', excludeList = []) {
  const words = ARCADE_WORDS[pool] || ARCADE_WORDS.short;
  const available = words.filter((w) => !excludeList.includes(w));
  const pickFrom = available.length > 0 ? available : words;
  const index = Math.floor(Math.random() * pickFrom.length);
  return pickFrom[index];
}

/**
 * Generates an array of words for continuous stream games
 */
export function generateWordStream(count = 20, difficulty = 'medium') {
  const result = [];
  for (let i = 0; i < count; i++) {
    const pool = difficulty === 'hard'
      ? (i % 3 === 0 ? 'long' : 'medium')
      : (i % 4 === 0 ? 'medium' : 'short');
    result.push(getRandomWord(pool, result.slice(-3)));
  }
  return result;
}

/**
 * Web Audio API synthesized arcade SFX engine
 * Zero external sound file loading required, 0ms latency, respects user sound setting.
 */
let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      audioCtx = new AudioCtx();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export const playArcadeSound = (type = 'blaster', enabled = true) => {
  if (!enabled || typeof window === 'undefined') return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    switch (type) {
      case 'blaster': {
        // High-frequency downward chirp for word elimination
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
        break;
      }
      case 'slice': {
        // Crisp high-velocity whoosh for ninja slicing
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
        break;
      }
      case 'jump': {
        // Rising frequency jump sound for runner
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(587, now + 0.15);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }
      case 'combo': {
        // Ascending harmonic chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.05); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.1); // G5
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
        break;
      }
      case 'damage': {
        // Low distorted rumble for damage / shield loss
        osc.type = 'square';
        osc.frequency.setValueAtTime(130, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.18);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
        break;
      }
      case 'boss-hit': {
        // Heavy metallic crunch
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(330, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }
      case 'victory': {
        // Fanfare chord
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.type = 'sine';
          o.frequency.setValueAtTime(freq, now + idx * 0.08);
          g.gain.setValueAtTime(0.08, now + idx * 0.08);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
          o.start(now + idx * 0.08);
          o.stop(now + 0.45);
        });
        break;
      }
      default:
        break;
    }
  } catch {
    // Ignore audio context error
  }
};
