/**
 * KEYFLOW Global Game Performance System — Game Lifecycle Manager
 * ===============================================================
 * Enforces strict single-game session isolation, automated resource cleanup,
 * and background-tab lifecycle handling (Page Visibility API).
 *
 * Rules:
 * 1. Only ONE active gameplay session allowed at any time.
 * 2. Navigating away or launching another game terminates the previous game completely.
 * 3. Tab backgrounding throttles/pauses rendering and prevents erratic delta-time teleporting on restore.
 * 4. Deep disposal of Three.js GPU resources, canvas loops, timers, and Web Audio.
 */

let activeSession = null;
let visibilityListenerInitialized = false;

/**
 * Initializes global Page Visibility API listener.
 */
function initVisibilityListener() {
  if (visibilityListenerInitialized || typeof document === 'undefined') return;
  visibilityListenerInitialized = true;

  document.addEventListener('visibilitychange', () => {
    const isHidden = document.hidden;
    if (activeSession) {
      activeSession.isTabHidden = isHidden;

      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(
          new CustomEvent(isHidden ? 'keyflow-tab-hidden' : 'keyflow-tab-restored', {
            detail: {
              gameId: activeSession.gameId,
              timestamp: performance.now(),
            },
          })
        );
      }
    }
  });
}

export class GameLifecycleManager {
  /**
   * Starts a new active game session, automatically terminating any existing active session.
   */
  static startSession(gameId) {
    initVisibilityListener();

    if (activeSession && activeSession.gameId !== gameId) {
      GameLifecycleManager.terminateSession();
    }

    activeSession = {
      gameId,
      startedAt: Date.now(),
      isTabHidden: typeof document !== 'undefined' ? document.hidden : false,
      cleanups: new Set(),
      timers: new Set(),
      rafIds: new Set(),
      renderers: new Set(),
    };

    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(
        new CustomEvent('keyflow-game-session-started', { detail: { gameId } })
      );
    }

    return activeSession;
  }

  /**
   * Registers a cleanup callback for the active game session.
   */
  static addCleanup(fn) {
    if (activeSession && typeof fn === 'function') {
      activeSession.cleanups.add(fn);
    }
  }

  /**
   * Registers a timer ID (setTimeout or setInterval) to be cleared on unmount.
   */
  static trackTimer(id, isInterval = false) {
    if (activeSession && id) {
      activeSession.timers.add({ id, isInterval });
    }
  }

  /**
   * Registers a requestAnimationFrame ID for teardown.
   */
  static trackRaf(rafId) {
    if (activeSession && rafId) {
      activeSession.rafIds.add(rafId);
    }
  }

  /**
   * Registers a Three.js or WebGL renderer for GPU cleanup.
   */
  static trackRenderer(renderer) {
    if (activeSession && renderer) {
      activeSession.renderers.add(renderer);
    }
  }

  /**
   * Completely terminates and cleans up the active game session.
   */
  static terminateSession() {
    if (!activeSession) return;

    const { gameId, cleanups, timers, rafIds, renderers } = activeSession;

    // 1. Cancel requestAnimationFrames
    for (const rafId of rafIds) {
      if (typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(rafId);
      }
    }

    // 2. Clear all registered timers and intervals
    for (const timer of timers) {
      if (timer.isInterval) {
        clearInterval(timer.id);
      } else {
        clearTimeout(timer.id);
      }
    }

    // 3. Execute all custom cleanup hooks
    for (const fn of cleanups) {
      try {
        fn();
      } catch (err) {
        console.warn(`[GameLifecycleManager] Cleanup error for ${gameId}:`, err);
      }
    }

    // 4. Dispose WebGL renderers
    for (const renderer of renderers) {
      try {
        if (renderer && typeof renderer.dispose === 'function') {
          renderer.dispose();
        }
      } catch (err) {
        console.warn(`[GameLifecycleManager] Renderer dispose error:`, err);
      }
    }

    activeSession = null;

    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(
        new CustomEvent('keyflow-game-session-terminated', { detail: { gameId } })
      );
    }
  }

  /**
   * Deep disposal helper for Three.js scenes, geometries, materials, and textures.
   */
  static disposeThreeScene(scene, renderer) {
    if (scene && typeof scene.traverse === 'function') {
      scene.traverse((object) => {
        if (!object) return;

        // Dispose geometry
        if (object.geometry && typeof object.geometry.dispose === 'function') {
          object.geometry.dispose();
        }

        // Dispose material(s)
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          for (const mat of materials) {
            if (!mat) continue;
            // Dispose textures on material
            for (const key of Object.keys(mat)) {
              const val = mat[key];
              if (val && typeof val === 'object' && typeof val.dispose === 'function') {
                val.dispose();
              }
            }
            if (typeof mat.dispose === 'function') {
              mat.dispose();
            }
          }
        }
      });
    }

    if (renderer && typeof renderer.dispose === 'function') {
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentElement) {
        try {
          renderer.domElement.parentElement.removeChild(renderer.domElement);
        } catch {
          // ignore already unmounted elements
        }
      }
    }
  }

  /**
   * Returns information about the current active session, if any.
   */
  static getActiveSession() {
    return activeSession
      ? {
          gameId: activeSession.gameId,
          startedAt: activeSession.startedAt,
          isTabHidden: activeSession.isTabHidden,
        }
      : null;
  }
}
