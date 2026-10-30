/**
 * KEYFLOW Global Game Performance System — Global Game Manager
 * ============================================================
 * Unified platform-level performance architecture coordinator.
 * Integrates device detection, graphics profiles, runtime performance monitoring,
 * lifecycle management, audio, and WebGL fallback systems.
 */

import { detectDeviceCapabilities, DEVICE_TIERS, DEVICE_TIER_LABELS } from './DeviceCapabilityDetector.js';
import {
  GRAPHICS_PRESETS,
  PRESET_METADATA,
  getStoredGraphicsSettings,
  saveGraphicsSettings,
  resolveEffectivePreset,
  getWebGLGraphicsConfig,
  getDomOrCanvasGraphicsConfig,
  setUserGraphicsPreset,
  resetGraphicsSettingsToDefault,
} from './GraphicsProfileManager.js';
import { RuntimePerformanceMonitor } from './RuntimePerformanceMonitor.js';
import { GameLifecycleManager } from './GameLifecycleManager.js';
import { GameRegistry, registerGame, getGameDefinition, getAllRegisteredGames, RENDERING_TECH } from './GameRegistry.js';
import { GlobalAudioLifecycleManager } from './GlobalAudioLifecycleManager.js';
import { WebGLFallbackManager } from './WebGLFallbackManager.js';

class GlobalGameManagerImpl {
  constructor() {
    this.activeMonitor = null;
  }

  /**
   * Initializes the global performance system on application start.
   */
  init() {
    const caps = detectDeviceCapabilities();
    const settings = getStoredGraphicsSettings();

    // Auto-apply reduced motion if preferred by system and not explicitly configured
    if (caps.reducedMotion && settings.reducedMotion === null) {
      saveGraphicsSettings({ reducedMotion: true });
    }

    return { caps, settings };
  }

  /**
   * Launches a game session with full lifecycle registration and performance monitoring.
   */
  startGameSession(gameId, options = {}) {
    // 1. Terminate any existing active game session
    GameLifecycleManager.startSession(gameId);

    // 2. Stop any existing monitor
    if (this.activeMonitor) {
      this.activeMonitor.stop();
      this.activeMonitor = null;
    }

    // 3. Initialize fresh runtime monitor for this game
    this.activeMonitor = new RuntimePerformanceMonitor({ gameId, ...options });
    this.activeMonitor.start();

    // 4. Register monitor stop on session unmount
    GameLifecycleManager.addCleanup(() => {
      if (this.activeMonitor) {
        this.activeMonitor.stop();
        this.activeMonitor = null;
      }
    });

    return {
      session: GameLifecycleManager.getActiveSession(),
      monitor: this.activeMonitor,
      isFallback: WebGLFallbackManager.shouldActivateFallback(gameId),
    };
  }

  /**
   * Ends the current active game session and performs deep memory cleanup.
   */
  endGameSession() {
    if (this.activeMonitor) {
      this.activeMonitor.stop();
      this.activeMonitor = null;
    }
    GameLifecycleManager.terminateSession();
    GlobalAudioLifecycleManager.suspendAudio();
  }

  /**
   * Retrieves active runtime monitor.
   */
  getActiveMonitor() {
    return this.activeMonitor;
  }

  /**
   * Returns device capabilities.
   */
  getDeviceCapabilities() {
    return detectDeviceCapabilities();
  }

  /**
   * Returns graphics configuration tailored for the game's rendering technology.
   */
  getGraphicsConfig(tech = RENDERING_TECH.THREEJS_WEBGL, preset = null) {
    if (tech === RENDERING_TECH.THREEJS_WEBGL) {
      return getWebGLGraphicsConfig(preset);
    }
    return getDomOrCanvasGraphicsConfig(preset);
  }
}

export const GlobalGameManager = new GlobalGameManagerImpl();

// Re-export all sub-modules for clean developer consumption
export {
  DEVICE_TIERS,
  DEVICE_TIER_LABELS,
  detectDeviceCapabilities,
  GRAPHICS_PRESETS,
  PRESET_METADATA,
  getStoredGraphicsSettings,
  saveGraphicsSettings,
  resolveEffectivePreset,
  getWebGLGraphicsConfig,
  getDomOrCanvasGraphicsConfig,
  setUserGraphicsPreset,
  resetGraphicsSettingsToDefault,
  RuntimePerformanceMonitor,
  GameLifecycleManager,
  registerGame,
  getGameDefinition,
  getAllRegisteredGames,
  RENDERING_TECH,
  GlobalAudioLifecycleManager,
  WebGLFallbackManager,
};
