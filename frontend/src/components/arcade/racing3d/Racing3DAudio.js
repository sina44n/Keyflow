/**
 * KEYFLOW 3D Racing — Procedural Web Audio Sound Engine
 * ======================================================
 * Synthesizes dynamic internal combustion engine audio, pitch-mapped to
 * typing velocity, gear-shifts, turbo whoosh, countdown and finish chimes.
 */
export class Racing3DAudio {
  constructor() {
    this.ctx = null;
    this.engineOsc = null;
    this.engineSub = null;
    this.engineGain = null;
    this.filter = null;
    this.isMuted = false;
  }

  init() {
    if (this.ctx || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    } catch {
      // AudioContext unavailable
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setValueAtTime(muted ? 0 : 0.05, this.ctx.currentTime);
    }
  }

  startEngine() {
    if (this.isMuted || !this.ctx || this.engineOsc) return;
    try {
      this.resume();
      const now = this.ctx.currentTime;

      // Primary engine saw oscillator
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(62, now); // Idle rumble

      // Sub-harmonic low-end rumble
      this.engineSub = this.ctx.createOscillator();
      this.engineSub.type = 'triangle';
      this.engineSub.frequency.setValueAtTime(31, now);

      // Lowpass warmth filter
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.setValueAtTime(420, now);

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(this.isMuted ? 0 : 0.05, now);

      this.engineOsc.connect(this.filter);
      this.engineSub.connect(this.filter);
      this.filter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc.start(now);
      this.engineSub.start(now);
    } catch {
      // Safe fallback
    }
  }

  updateEngineRpm(wpm = 0, isNitro = false) {
    if (this.isMuted || !this.ctx || !this.engineOsc) return;
    try {
      const now = this.ctx.currentTime;
      const baseFreq = 62 + Math.min(190, Number(wpm || 0) * 1.6);
      const nitroBonus = isNitro ? 45 : 0;
      const targetFreq = baseFreq + nitroBonus;

      this.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.09);
      if (this.engineSub) {
        this.engineSub.frequency.setTargetAtTime(targetFreq * 0.5, now, 0.09);
      }
      if (this.filter) {
        this.filter.frequency.setTargetAtTime(420 + targetFreq * 3.5, now, 0.09);
      }
    } catch {
      // Safe fallback
    }
  }

  stopEngine() {
    if (this.engineOsc && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        if (this.engineGain) {
          this.engineGain.gain.linearRampToValueAtTime(0.001, now + 0.1);
        }
        this.engineOsc.stop(now + 0.12);
        if (this.engineSub) {
          this.engineSub.stop(now + 0.12);
        }
      } catch {}
      this.engineOsc = null;
      this.engineSub = null;
      this.engineGain = null;
      this.filter = null;
    }
  }

  playKeystroke() {
    if (this.isMuted || !this.ctx) return;
    try {
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(490, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.035);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.035);
    } catch {}
  }

  playCountdown(step) {
    if (this.isMuted || !this.ctx) return;
    try {
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const isGo = step === 0;
      const freq = isGo ? 880 : 440;
      const dur = isGo ? 0.38 : 0.15;

      osc.type = isGo ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(isGo ? 0.22 : 0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + dur);
    } catch {}
  }

  playNitro() {
    if (this.isMuted || !this.ctx) return;
    try {
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(170, now);
      osc.frequency.exponentialRampToValueAtTime(820, now + 0.3);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }

  playVictory() {
    if (this.isMuted || !this.ctx) return;
    try {
      this.resume();
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        const t = this.ctx.currentTime + idx * 0.1;

        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.16, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.42);

        o.connect(g);
        g.connect(this.ctx.destination);

        o.start(t);
        o.stop(t + 0.45);
      });
    } catch {}
  }

  cleanup() {
    this.stopEngine();
    if (this.ctx && this.ctx.state !== 'closed') {
      try {
        this.ctx.close().catch(() => {});
      } catch {}
      this.ctx = null;
    }
  }
}
