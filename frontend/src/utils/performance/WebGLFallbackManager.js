/**
 * KEYFLOW Global Game Performance System — WebGL Fallback Manager
 * ===============================================================
 * Detects WebGL availability, manages WebGL context loss and restoration events,
 * and activates game-specific graceful fallbacks (e.g., Canvas 2D mode for Nitro Racing)
 * ensuring that WebGL failures NEVER crash the KEYFLOW platform.
 */

import { detectDeviceCapabilities, DEVICE_TIERS } from './DeviceCapabilityDetector.js';
import { getGameDefinition, RENDERING_TECH } from './GameRegistry.js';

let contextLossHandled = false;

export class WebGLFallbackManager {
  /**
   * Evaluates whether a game should run in fallback mode.
   */
  static shouldActivateFallback(gameId) {
    const gameDef = getGameDefinition(gameId);
    if (!gameDef || !gameDef.requiresGpu) {
      return false;
    }

    const caps = detectDeviceCapabilities();
    if (caps.tier === DEVICE_TIERS.UNSUPPORTED || (!caps.webgl.webgl1 && !caps.webgl.webgl2)) {
      return true;
    }

    return false;
  }

  /**
   * Binds context loss listeners to a WebGL canvas to prevent default page crash.
   */
  static attachContextLossHandlers(canvas, onLost = null, onRestored = null) {
    if (!canvas || typeof canvas.addEventListener !== 'function') return () => {};

    const handleContextLost = (event) => {
      event.preventDefault(); // Prevents browser from treating it as unrecoverable
      console.warn('[WebGLFallbackManager] WebGL Context Lost! Initiating graceful fallback...');

      if (typeof onLost === 'function') {
        onLost(event);
      }

      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent('keyflow-webgl-context-lost', { detail: { canvas } }));
      }
    };

    const handleContextRestored = (event) => {
      console.info('[WebGLFallbackManager] WebGL Context Restored! Reinitializing scene...');

      if (typeof onRestored === 'function') {
        onRestored(event);
      }

      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent('keyflow-webgl-context-restored', { detail: { canvas } }));
      }
    };

    canvas.addEventListener('webglcontextlost', handleContextLost, false);
    canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }

  /**
   * Returns fallback configuration and explanation for display to user.
   */
  static getFallbackNotice(gameId) {
    const gameDef = getGameDefinition(gameId);
    if (!gameDef) return null;

    if (gameId === 'nitro') {
      return {
        isFallback: true,
        mode: 'canvas2d',
        title: 'High-Performance 2D Canvas Mode Active',
        description:
          'WebGL hardware acceleration is unavailable on this device. The race is running in optimized 2D mode with full continuous typing kinematics, AI opponents, and score persistence.',
        actionLabel: 'Play in 2D Mode',
      };
    }

    return {
      isFallback: true,
      mode: 'compatibility',
      title: 'Compatibility Mode Active',
      description: 'Running with simplified rendering effects to maintain stable performance.',
      actionLabel: 'Continue Practice',
    };
  }
}
