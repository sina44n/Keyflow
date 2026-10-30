/**
 * Warp3DAudio.js — Web Audio API Synthesizer for 3D Hyperspace Warp Speed Sprint
 * ==============================================================================
 * Dynamically synthesizes real-time engine hum, gate breach chimes, hypersonic sweeps,
 * error glitch pulses, and warp collapse transients with zero external asset dependencies.
 */
export class Warp3DAudio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.masterGain = null;

    // Engine hum nodes
    this.engineOsc1 = null;
    this.engineOsc2 = null;
    this.engineGain = null;
    this.engineFilter = null;
    this.isEngineRunning = false;

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
      console.warn('Warp3DAudio context initialization deferred:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setEnabled(val) {
    this.enabled = Boolean(val);
    if (!this.enabled && this.isEngineRunning) {
      this.stopEngine();
    }
  }

  startEngine() {
    if (!this.enabled || !this.ctx || this.isEngineRunning) return;
    this.resume();

    try {
      const now = this.ctx.currentTime;

      // Dual detuned sawtooth oscillators through lowpass filter
      this.engineOsc1 = this.ctx.createOscillator();
      this.engineOsc2 = this.ctx.createOscillator();
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineGain = this.ctx.createGain();

      this.engineOsc1.type = 'sawtooth';
      this.engineOsc2.type = 'triangle';

      this.engineOsc1.frequency.setValueAtTime(55, now); // A1 note
      this.engineOsc2.frequency.setValueAtTime(55.6, now); // detuned beats

      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(260, now);
      this.engineFilter.Q.setValueAtTime(3.5, now);

      this.engineGain.gain.setValueAtTime(0.001, now);
      this.engineGain.gain.exponentialRampToValueAtTime(0.12, now + 0.5);

      this.engineOsc1.connect(this.engineFilter);
      this.engineOsc2.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.masterGain);

      this.engineOsc1.start(now);
      this.engineOsc2.start(now);
      this.isEngineRunning = true;
    } catch (e) {
      console.warn('Failed to start warp engine audio:', e);
    }
  }

  updateEngineSpeed(wpm = 40, streak = 0) {
    if (!this.enabled || !this.ctx || !this.isEngineRunning) return;
    const now = this.ctx.currentTime;

    // Pitch scales with typing speed: 50Hz at 20 WPM up to 180Hz at 140+ WPM
    const clampedWpm = Math.max(20, Math.min(160, wpm));
    const baseFreq = 45 + (clampedWpm - 20) * 0.95;
    const streakMod = Math.min(30, streak * 1.5);
    const targetFreq = baseFreq + streakMod;

    // Filter frequency opens up with speed giving a brighter, more ferocious jet roar
    const filterFreq = 220 + (clampedWpm - 20) * 8.5 + streakMod * 25;

    this.engineOsc1?.frequency.setTargetAtTime(targetFreq, now, 0.1);
    this.engineOsc2?.frequency.setTargetAtTime(targetFreq * 1.012, now, 0.1);
    this.engineFilter?.frequency.setTargetAtTime(Math.min(2400, filterFreq), now, 0.1);

    // Engine volume swells slightly during fast flow
    const targetGain = 0.08 + Math.min(0.14, (clampedWpm / 150) * 0.12);
    this.engineGain?.gain.setTargetAtTime(targetGain, now, 0.15);
  }

  stopEngine() {
    if (!this.ctx || !this.isEngineRunning) return;
    try {
      const now = this.ctx.currentTime;
      this.engineGain?.gain.setTargetAtTime(0.0001, now, 0.2);
      setTimeout(() => {
        try {
          this.engineOsc1?.stop();
          this.engineOsc2?.stop();
          this.engineOsc1?.disconnect();
          this.engineOsc2?.disconnect();
          this.engineFilter?.disconnect();
          this.engineGain?.disconnect();
        } catch {}
        this.isEngineRunning = false;
      }, 300);
    } catch {
      this.isEngineRunning = false;
    }
  }

  /**
   * Resonant crystal sonic chime when breaching a quantum velocity gate cleanly
   */
  playGateSuccess(streak = 1) {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';

    // Harmonic pitch scale that rises with combo streak
    const baseFreqs = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C5, E5, G5, C6, E6
    const pitch = baseFreqs[streak % baseFreqs.length] * (1 + Math.floor(streak / 5) * 0.12);

    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 1.5, now + 0.12);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  /**
   * Hypersonic boom triggered when entering high combo streak tier (10x, 25x)
   */
  playHyperspaceBoost() {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.45);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.exponentialRampToValueAtTime(1800, now + 0.45);
    filter.Q.setValueAtTime(5, now);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.6);
  }

  /**
   * Harsh glitch burst on mistyped character
   */
  playErrorGlitch() {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.setValueAtTime(90, now + 0.05);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  /**
   * Warp tunnel collapse sound on session termination
   */
  playGameOver() {
    if (!this.enabled || !this.ctx) return;
    this.resume();
    this.stopEngine();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.8);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.9);
  }

  cleanup() {
    this.stopEngine();
    try {
      if (this.ctx && this.ctx.state !== 'closed') {
        this.ctx.close();
      }
    } catch {}
  }
}

