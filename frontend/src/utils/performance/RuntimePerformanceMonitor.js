/**
 * KEYFLOW Global Game Performance System — Runtime Performance Monitor
 * ====================================================================
 * Measures live frame times, average FPS, and rendering stability.
 * Provides intelligent, gradual runtime adaptation for Auto graphics mode
 * while strictly protecting manual user settings and GAMEPLAY FAIRNESS.
 *
 * NON-NEGOTIABLE:
 * Performance adaptation NEVER modifies typing accuracy, WPM math,
 * keyboard responsiveness, simulation logic, or competitive outcomes.
 */

import {
  GRAPHICS_PRESETS,
  getStoredGraphicsSettings,
  saveGraphicsSettings,
  resolveEffectivePreset,
} from './GraphicsProfileManager.js';

export class RuntimePerformanceMonitor {
  constructor(options = {}) {
    this.gameId = options.gameId || 'arcade_game';
    this.targetFps = options.targetFps || 60;
    this.sampleWindow = options.sampleWindow || 60; // 60 frames rolling window

    // State
    this.isRunning = false;
    this.rafId = null;
    this.lastFrameTime = 0;
    this.frameTimes = [];
    this.fps = 60;
    this.averageFps = 60;
    this.frameTimeMs = 16.6;
    this.slowFrameCount = 0;
    this.consecutiveLowCount = 0;
    this.consecutiveHighCount = 0;
    this.lastAdaptationTime = 0;

    // Cooldowns (milliseconds)
    this.DOWNGRADE_COOLDOWN_MS = 6000;
    this.UPGRADE_COOLDOWN_MS = 15000;

    // Listeners for telemetry HUD
    this.listeners = new Set();
  }

  /**
   * Starts monitoring frame rendering loop.
   */
  start() {
    if (this.isRunning || typeof window === 'undefined') return;
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.frameTimes = [];
    this.consecutiveLowCount = 0;
    this.consecutiveHighCount = 0;

    const tick = (now) => {
      if (!this.isRunning) return;

      const deltaMs = now - this.lastFrameTime;
      this.lastFrameTime = now;

      if (deltaMs > 0 && deltaMs < 1000) {
        this.recordFrame(deltaMs, now);
      }

      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame(tick);
  }

  /**
   * Stops the performance monitor and cancels animation frame.
   */
  stop() {
    this.isRunning = false;
    if (this.rafId && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Records a frame delta and recalculates rolling metrics.
   */
  recordFrame(deltaMs, now = performance.now()) {
    this.frameTimes.push(deltaMs);
    if (this.frameTimes.length > this.sampleWindow) {
      this.frameTimes.shift();
    }

    const sum = this.frameTimes.reduce((acc, dt) => acc + dt, 0);
    this.frameTimeMs = sum / this.frameTimes.length;
    this.averageFps = Math.max(1, Math.min(120, Math.round(1000 / this.frameTimeMs)));
    this.fps = Math.max(1, Math.min(120, Math.round(1000 / deltaMs)));

    if (deltaMs > 33.3) {
      this.slowFrameCount++;
    }

    // Check for runtime adaptation if running in Auto mode
    this.evaluateAdaptation(now);

    // Notify listeners (HUD, diagnostics) every ~10 frames to avoid overhead
    if (this.frameTimes.length % 10 === 0) {
      this.notifyListeners();
    }
  }

  /**
   * Evaluates gradual graphics adaptation without thrashing or hysteresis.
   */
  evaluateAdaptation(now) {
    const settings = getStoredGraphicsSettings();

    // NEVER adapt if user has set a manual override
    if (settings.manualOverride || settings.preset !== GRAPHICS_PRESETS.AUTO) {
      return;
    }

    // Protect cooldown period
    if (now - this.lastAdaptationTime < this.DOWNGRADE_COOLDOWN_MS) {
      return;
    }

    const effective = resolveEffectivePreset();

    // Sustained low FPS (< 30 FPS over rolling window)
    if (this.averageFps < 30) {
      this.consecutiveLowCount++;
      this.consecutiveHighCount = 0;

      // 4 consecutive low windows (~4 seconds) triggers safe downgrade
      if (this.consecutiveLowCount >= 4) {
        this.downgradeQuality(effective, now);
      }
    }
    // Sustained high FPS (>= 58 FPS)
    else if (this.averageFps >= 58 && now - this.lastAdaptationTime > this.UPGRADE_COOLDOWN_MS) {
      this.consecutiveHighCount++;
      this.consecutiveLowCount = 0;

      // 10 consecutive high windows (~10 seconds) allows safe upgrade
      if (this.consecutiveHighCount >= 10) {
        this.upgradeQuality(effective, now);
      }
    } else {
      this.consecutiveLowCount = Math.max(0, this.consecutiveLowCount - 1);
      this.consecutiveHighCount = Math.max(0, this.consecutiveHighCount - 1);
    }
  }

  /**
   * Steps down visual quality by one level.
   */
  downgradeQuality(currentEffective, now) {
    let nextPreset = null;
    if (currentEffective === GRAPHICS_PRESETS.ULTRA) {
      nextPreset = GRAPHICS_PRESETS.HIGH;
    } else if (currentEffective === GRAPHICS_PRESETS.HIGH) {
      nextPreset = GRAPHICS_PRESETS.MEDIUM;
    } else if (currentEffective === GRAPHICS_PRESETS.MEDIUM) {
      nextPreset = GRAPHICS_PRESETS.PERFORMANCE;
    }

    if (nextPreset) {
      this.lastAdaptationTime = now;
      this.consecutiveLowCount = 0;
      this.dispatchAdaptationEvent(currentEffective, nextPreset, 'sustained_frame_drops');
    }
  }

  /**
   * Steps up visual quality by one level if performance allows.
   */
  upgradeQuality(currentEffective, now) {
    let nextPreset = null;
    if (currentEffective === GRAPHICS_PRESETS.PERFORMANCE) {
      nextPreset = GRAPHICS_PRESETS.MEDIUM;
    } else if (currentEffective === GRAPHICS_PRESETS.MEDIUM) {
      nextPreset = GRAPHICS_PRESETS.HIGH;
    }

    if (nextPreset) {
      this.lastAdaptationTime = now;
      this.consecutiveHighCount = 0;
      this.dispatchAdaptationEvent(currentEffective, nextPreset, 'performance_headroom');
    }
  }

  dispatchAdaptationEvent(fromPreset, toPreset, reason) {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(
        new CustomEvent('keyflow-graphics-adapted', {
          detail: {
            gameId: this.gameId,
            fromPreset,
            toPreset,
            reason,
            averageFps: this.averageFps,
          },
        })
      );
    }
  }

  /**
   * Safe simulation delta calculation:
   * Clamps delta-time to a maximum threshold (e.g., 50ms) to ensure physics/kinematics
   * remain completely stable and NEVER jump or teleport when a lag spike occurs.
   */
  getFairSimulationDelta(rawDeltaSeconds) {
    return Math.max(0.001, Math.min(rawDeltaSeconds || 0.016, 0.05));
  }

  /**
   * Subscribes a listener to live performance updates.
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    const telemetry = {
      fps: this.fps,
      averageFps: this.averageFps,
      frameTimeMs: Math.round(this.frameTimeMs * 10) / 10,
      slowFrameCount: this.slowFrameCount,
    };
    for (const listener of this.listeners) {
      try {
        listener(telemetry);
      } catch (err) {
        console.warn('[RuntimePerformanceMonitor] Listener error:', err);
      }
    }
  }

  /**
   * Returns current snapshot of metrics.
   */
  getMetrics() {
    return {
      fps: this.fps,
      averageFps: this.averageFps,
      frameTimeMs: Math.round(this.frameTimeMs * 10) / 10,
      slowFrameCount: this.slowFrameCount,
      isRunning: this.isRunning,
    };
  }
}
