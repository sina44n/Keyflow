/**
 * Boss3DAudio.js — Web Audio API Synthesizer for 3D Titan Colosseum Boss Battle
 * ============================================================================
 * Procedurally generates titan mechanical stomps, player energy bolts,
 * parry gongs, ground slam seismic shockwaves, and victory fanfares.
 */
export class Boss3DAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.masterGain = null;
    this.initContext();
  }

  initContext() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    } catch (e) {
      console.warn('Boss3DAudio initialization deferred:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setEnabled(val) {
    this.enabled = Boolean(val);
  }

  /**
   * Player Energy Plasma Bolt Strike on Keystroke
   */
  playBolt() {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(750, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.1);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  /**
   * Titan Heavy Mechanical Stomp Footstep
   */
  playStomp() {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 0.28);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  /**
   * Parry Counter Gong when countering Titan attack in time
   */
  playParryGong() {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    const freqs = [520, 1040, 1560]; // Harmonics

    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);

      gain.gain.setValueAtTime(0.25 / (idx + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.7);
    });
  }

  /**
   * Titan Ground Slam Seismic Shockwave
   */
  playGroundSlam() {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.45;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);
    filter.frequency.exponentialRampToValueAtTime(40, now + 0.42);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
  }

  /**
   * Titan Roar Alert when Boss spawns
   */
  playTitanRoar() {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.3);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.8);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(320, now);
    filter.Q.setValueAtTime(4, now);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.9);
  }

  cleanup() {
    try {
      if (this.ctx && this.ctx.state !== 'closed') {
        this.ctx.close();
      }
    } catch {}
  }
}
