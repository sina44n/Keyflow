/**
 * Stickman2DAudio.js
 * High-performance Web Audio API procedural synthesizer for Stickman Fight (2D).
 * Zero external audio file dependencies. Realistic blade whooshes, metal clashes,
 * parry gongs, impacts, keypress clicks, and martial battle ambience.
 */

export class Stickman2DAudio {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterGain = null;
    this.ambientGain = null;
    this.isAmbientPlaying = false;
    this.ambientInterval = null;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.ctx = new AudioContext();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(this.isMuted ? 0 : 0.15, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);
    } catch (e) {
      console.warn("AudioContext init error:", e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.7, this.ctx.currentTime);
    }
  }

  toggleMute() {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  // Tactical blade slash whoosh
  playSlash(speed = 1.0) {
    if (this.isMuted || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Noise buffer for swoosh texture
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(800 * speed, t);
    filter.frequency.exponentialRampToValueAtTime(3200 * speed, t + 0.05);
    filter.frequency.exponentialRampToValueAtTime(400 * speed, t + 0.12);
    filter.Q.value = 3.0;

    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.4, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(t);
    noise.stop(t + 0.13);
  }

  // Steel sword clash
  playClash() {
    if (this.isMuted || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    // Resonant dual metallic tones
    const freqs = [1820, 2460, 4100];
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq + (Math.random() * 50 - 25), t);

      gain.gain.setValueAtTime(0.25 / (idx + 1), t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18 + idx * 0.04);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.25);
    });
  }

  // Heavy martial impact / flesh hit
  playHit(isCrit = false) {
    if (this.isMuted || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isCrit ? "sawtooth" : "triangle";
    osc.frequency.setValueAtTime(isCrit ? 180 : 120, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.15);

    gain.gain.setValueAtTime(isCrit ? 0.6 : 0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + (isCrit ? 0.22 : 0.14));

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.25);

    // If critical hit, add metal crunch
    if (isCrit) {
      this.playClash();
    }
  }

  // Precision parry gong / chime
  playParry() {
    if (this.isMuted || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const subOsc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1440, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.4);

    subOsc.type = "sine";
    subOsc.frequency.setValueAtTime(880, t);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    osc.connect(gain);
    subOsc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    subOsc.start(t);
    osc.stop(t + 0.65);
    subOsc.stop(t + 0.65);
  }

  // Acrobatic dash / dodge
  playDash() {
    if (this.isMuted || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(350, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.12);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.13);
  }

  // Tactile keystroke sound
  playKeypress(isCorrect = true) {
    if (this.isMuted || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (isCorrect) {
      osc.type = "sine";
      osc.frequency.setValueAtTime(650 + Math.random() * 80, t);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    } else {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(160, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    }

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  // Paragraph finisher: Blade Storm explosion
  playBladeStorm() {
    if (this.isMuted || !this.ctx) return;
    this.resume();

    const t = this.ctx.currentTime;
    // Rising sweep
    const sweep = this.ctx.createOscillator();
    const sweepGain = this.ctx.createGain();
    sweep.type = "sawtooth";
    sweep.frequency.setValueAtTime(150, t);
    sweep.frequency.exponentialRampToValueAtTime(1200, t + 0.35);

    sweepGain.gain.setValueAtTime(0.1, t);
    sweepGain.gain.linearRampToValueAtTime(0.4, t + 0.3);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    sweep.connect(sweepGain);
    sweepGain.connect(this.masterGain);

    sweep.start(t);
    sweep.stop(t + 0.45);

    // Blast impact at t + 0.35
    setTimeout(() => {
      this.playHit(true);
      this.playParry();
    }, 320);
  }

  // Wave victory fanfare
  playWaveCleared() {
    if (this.isMuted || !this.ctx) return;
    this.resume();

    const notes = [440, 554, 659, 880];
    const t = this.ctx.currentTime;
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t + idx * 0.1);

      gain.gain.setValueAtTime(0.001, t + idx * 0.1);
      gain.gain.linearRampToValueAtTime(0.25, t + idx * 0.1 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.1 + 0.4);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + idx * 0.1);
      osc.stop(t + idx * 0.1 + 0.45);
    });
  }

  // Game over sorrowful chords
  playGameOver() {
    if (this.isMuted || !this.ctx) return;
    this.resume();

    const notes = [440, 415, 370, 330];
    const t = this.ctx.currentTime;
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, t + idx * 0.2);

      gain.gain.setValueAtTime(0.2, t + idx * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.2 + 0.5);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + idx * 0.2);
      osc.stop(t + idx * 0.2 + 0.55);
    });
  }

  startAmbient() {
    if (this.isAmbientPlaying || !this.ctx) return;
    this.isAmbientPlaying = true;
    // Periodic subtle wind and crackle
    this.ambientInterval = setInterval(() => {
      if (this.isMuted || !this.ctx) return;
      try {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(80 + Math.random() * 30, t);
        gain.gain.setValueAtTime(0.02, t);
        gain.gain.linearRampToValueAtTime(0.06, t + 1.2);
        gain.gain.linearRampToValueAtTime(0.01, t + 2.5);

        osc.connect(gain);
        gain.connect(this.ambientGain);

        osc.start(t);
        osc.stop(t + 2.6);
      } catch (e) {
        // ignore
      }
    }, 3200);
  }

  stopAmbient() {
    this.isAmbientPlaying = false;
    if (this.ambientInterval) {
      clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }
  }

  dispose() {
    this.stopAmbient();
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch (e) {
        // ignore
      }
      this.ctx = null;
    }
  }
}
