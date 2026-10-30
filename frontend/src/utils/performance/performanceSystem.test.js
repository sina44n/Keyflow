/**
 * KEYFLOW Global Game Performance System — Comprehensive Audit & Unit Tests
 * =========================================================================
 * Tests device capability detection, graphics profile resolutions, runtime performance
 * monitoring, hysteresis cooldowns, lifecycle isolation, game registry, and WebGL fallbacks.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  detectDeviceCapabilities,
  resetDeviceCapabilityCache,
  DEVICE_TIERS,
} from './DeviceCapabilityDetector.js';

import {
  GRAPHICS_PRESETS,
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
import {
  registerGame,
  getGameDefinition,
  getAllRegisteredGames,
  RENDERING_TECH,
} from './GameRegistry.js';
import { WebGLFallbackManager } from './WebGLFallbackManager.js';
import { GlobalAudioLifecycleManager } from './GlobalAudioLifecycleManager.js';

describe('KEYFLOW Global Game Performance Architecture Tests', () => {
  beforeEach(() => {
    resetDeviceCapabilityCache();
    resetGraphicsSettingsToDefault();
    GameLifecycleManager.terminateSession();
  });

  describe('1. Device Capability Detection', () => {
    it('safely detects capabilities and assigns a valid tier and preset', () => {
      const caps = detectDeviceCapabilities(true);
      assert.ok(caps.tier, 'Tier must be defined');
      assert.ok(
        [
          DEVICE_TIERS.HIGH,
          DEVICE_TIERS.BALANCED,
          DEVICE_TIERS.LOW,
          DEVICE_TIERS.VERY_LOW,
          DEVICE_TIERS.UNSUPPORTED,
        ].includes(caps.tier),
        `Tier "${caps.tier}" must be one of the recognized tiers`
      );
      assert.ok(caps.recommendedPreset, 'Recommended preset must be provided');
      assert.ok(typeof caps.hardwareConcurrency === 'number');
    });

    it('caches capability detection results for performance', () => {
      const first = detectDeviceCapabilities();
      const second = detectDeviceCapabilities();
      assert.strictEqual(first, second, 'Subsequent calls must return cached reference');
    });
  });

  describe('2. Graphics Quality Profile Manager', () => {
    it('resolves Auto preset to device capability recommendation', () => {
      saveGraphicsSettings({ preset: GRAPHICS_PRESETS.AUTO, manualOverride: false });
      const effective = resolveEffectivePreset();
      assert.ok(
        [GRAPHICS_PRESETS.ULTRA, GRAPHICS_PRESETS.HIGH, GRAPHICS_PRESETS.MEDIUM, GRAPHICS_PRESETS.PERFORMANCE].includes(
          effective
        ),
        `Effective preset "${effective}" must resolve to a concrete quality tier`
      );
    });

    it('protects manual user preset overrides from auto-resolution', () => {
      setUserGraphicsPreset(GRAPHICS_PRESETS.PERFORMANCE);
      const settings = getStoredGraphicsSettings();
      assert.strictEqual(settings.preset, GRAPHICS_PRESETS.PERFORMANCE);
      assert.strictEqual(settings.manualOverride, true);
      assert.strictEqual(resolveEffectivePreset(), GRAPHICS_PRESETS.PERFORMANCE);
    });

    it('returns valid WebGL configurations for all 4 concrete presets', () => {
      for (const preset of [
        GRAPHICS_PRESETS.ULTRA,
        GRAPHICS_PRESETS.HIGH,
        GRAPHICS_PRESETS.MEDIUM,
        GRAPHICS_PRESETS.PERFORMANCE,
      ]) {
        const config = getWebGLGraphicsConfig(preset);
        assert.strictEqual(config.preset, preset);
        assert.ok(typeof config.pixelRatio === 'number' && config.pixelRatio > 0);
        assert.ok(typeof config.particleDensity === 'number' && config.particleDensity <= 1.0);
        assert.ok(typeof config.drawDistance === 'number' && config.drawDistance >= 100);
      }
    });

    it('returns valid DOM/Canvas configurations with particle scaling', () => {
      const ultra = getDomOrCanvasGraphicsConfig(GRAPHICS_PRESETS.ULTRA);
      const perf = getDomOrCanvasGraphicsConfig(GRAPHICS_PRESETS.PERFORMANCE);
      assert.ok(ultra.maxParticles > perf.maxParticles, 'Ultra should have more particles than Performance');
      assert.strictEqual(perf.enableScreenShake, false, 'Screen shake must be disabled in Performance preset');
    });

    it('resets settings back to recommended Auto defaults cleanly', () => {
      setUserGraphicsPreset(GRAPHICS_PRESETS.ULTRA);
      resetGraphicsSettingsToDefault();
      const reset = getStoredGraphicsSettings();
      assert.strictEqual(reset.preset, GRAPHICS_PRESETS.AUTO);
      assert.strictEqual(reset.manualOverride, false);
    });
  });

  describe('3. Runtime Performance Monitor & Gradual Adaptation', () => {
    it('measures frame time and calculates rolling average FPS', () => {
      const monitor = new RuntimePerformanceMonitor({ gameId: 'nitro' });
      // Simulate 60 FPS frames (16.6ms each)
      for (let i = 0; i < 30; i++) {
        monitor.recordFrame(16.6, i * 16.6);
      }
      const metrics = monitor.getMetrics();
      assert.ok(metrics.averageFps >= 58 && metrics.averageFps <= 62, 'Average FPS should be ~60');
      assert.strictEqual(metrics.slowFrameCount, 0, 'No slow frames for 16.6ms deltas');
      monitor.stop();
    });

    it('detects slow frames and flags jitter spikes (> 33.3ms)', () => {
      const monitor = new RuntimePerformanceMonitor({ gameId: 'boss' });
      monitor.recordFrame(45.0, 100);
      monitor.recordFrame(50.0, 150);
      const metrics = monitor.getMetrics();
      assert.strictEqual(metrics.slowFrameCount, 2);
      monitor.stop();
    });

    it('clamps simulation delta-time to guarantee GAMEPLAY FAIRNESS during spikes', () => {
      const monitor = new RuntimePerformanceMonitor();
      // Even if a frame took 500ms (huge browser freeze), fair delta is capped at 0.05s
      const fairDelta = monitor.getFairSimulationDelta(0.5);
      assert.strictEqual(fairDelta, 0.05, 'Simulation delta must be capped to prevent vehicle tunneling');

      // Normal delta passes through
      const normalDelta = monitor.getFairSimulationDelta(0.016);
      assert.strictEqual(normalDelta, 0.016);
    });
  });

  describe('4. Game Lifecycle & Single Active Session Isolation', () => {
    it('allows only ONE active game session at a time', () => {
      GameLifecycleManager.startSession('nitro');
      assert.strictEqual(GameLifecycleManager.getActiveSession().gameId, 'nitro');

      // Launching another game terminates the previous one
      GameLifecycleManager.startSession('boss');
      assert.strictEqual(GameLifecycleManager.getActiveSession().gameId, 'boss');

      GameLifecycleManager.terminateSession();
      assert.strictEqual(GameLifecycleManager.getActiveSession(), null);
    });

    it('executes registered cleanup callbacks on termination', () => {
      GameLifecycleManager.startSession('cascade');
      let cleanedUp = false;
      GameLifecycleManager.addCleanup(() => {
        cleanedUp = true;
      });

      GameLifecycleManager.terminateSession();
      assert.strictEqual(cleanedUp, true, 'Registered cleanup callback must be called');
    });
  });

  describe('5. Game Registry & Architecture Adapters', () => {
    it('has all 8 authentic KEYFLOW Arcade games pre-registered', () => {
      const games = getAllRegisteredGames();
      assert.strictEqual(games.length >= 8, true, 'At least 8 games must be registered');

      const expectedIds = ['nitro', 'boss', 'ninja', 'runner', 'cascade', 'hunter', 'sprint', 'memory'];
      for (const id of expectedIds) {
        const def = getGameDefinition(id);
        assert.ok(def, `Game "${id}" must be registered`);
        assert.ok(def.renderingTech, `Game "${id}" must specify rendering technology`);
      }
    });

    it('identifies Nitro Racing as Three.js WebGL with Canvas 2D fallback', () => {
      const nitro = getGameDefinition('nitro');
      assert.strictEqual(nitro.renderingTech, RENDERING_TECH.THREEJS_WEBGL);
      assert.strictEqual(nitro.requiresGpu, true);
      assert.strictEqual(nitro.hasFallback, true);
      assert.strictEqual(nitro.fallbackTech, RENDERING_TECH.CANVAS_2D);
    });

    it('allows seamless registration of new future games', () => {
      const futureGame = registerGame({
        id: 'future-game-test',
        title: 'Future Space Typing',
        renderingTech: RENDERING_TECH.THREEJS_WEBGL,
        requiresGpu: true,
      });

      assert.strictEqual(futureGame.id, 'future-game-test');
      assert.strictEqual(getGameDefinition('future-game-test').title, 'Future Space Typing');
    });
  });

  describe('6. WebGL Fallback Management', () => {
    it('provides clear fallback notice for Nitro Racing in 2D Canvas mode', () => {
      const notice = WebGLFallbackManager.getFallbackNotice('nitro');
      assert.ok(notice);
      assert.strictEqual(notice.mode, 'canvas2d');
      assert.ok(notice.title.includes('2D Canvas'));
    });
  });

  describe('7. Global Audio Lifecycle Management', () => {
    it('calculates effective volume honoring master, channel, and mute states', () => {
      GlobalAudioLifecycleManager.saveSettings({
        masterVolume: 0.8,
        sfxVolume: 0.5,
        isMuted: false,
      });
      const vol = GlobalAudioLifecycleManager.getEffectiveVolume('sfx');
      assert.strictEqual(Math.round(vol * 100) / 100, 0.4);

      // When muted, volume is strictly 0
      GlobalAudioLifecycleManager.saveSettings({ isMuted: true });
      assert.strictEqual(GlobalAudioLifecycleManager.getEffectiveVolume('sfx'), 0);
    });
  });
});
