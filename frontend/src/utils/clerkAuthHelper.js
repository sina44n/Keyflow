/**
 * KEYFLOW Clerk Authentication Readiness Helper
 * ==============================================
 * Resolves the active Clerk authentication resource (SignIn or SignUp).
 * If Clerk is still completing its initial handshake, cleanly awaits the readiness event
 * using Clerk's official addListener API instead of arbitrary delays or polling loops.
 */

export const getOrWaitAuthResource = async (clerk, signIn, signUp, timeoutMs = 8000) => {
  // 1. Prefer live client resource directly from clerk.client if already loaded
  const immediate = clerk?.client?.signIn || signIn || clerk?.client?.signUp || signUp;
  if (immediate?.authenticateWithRedirect) {
    return immediate;
  }

  // 2. If Clerk is currently initializing, wait for the readiness event
  if (!clerk?.loaded || clerk?.status === 'loading') {
    return new Promise((resolve, reject) => {
      let unsubscribe = null;
      const timer = setTimeout(() => {
        if (typeof unsubscribe === 'function') unsubscribe();
        reject(
          new Error('Authentication service initialization timed out. Please refresh and try again.')
        );
      }, timeoutMs);

      if (typeof clerk?.addListener === 'function') {
        unsubscribe = clerk.addListener((resources) => {
          const res = resources?.client?.signIn || clerk?.client?.signIn || resources?.client?.signUp;
          if (res?.authenticateWithRedirect) {
            clearTimeout(timer);
            if (typeof unsubscribe === 'function') unsubscribe();
            resolve(res);
          }
        });
      } else {
        clearTimeout(timer);
        reject(
          new Error('Authentication service is unavailable. Please check your connection.')
        );
      }
    });
  }

  // 3. Fallback: if Clerk is marked ready but no resource with authenticateWithRedirect was resolved
  if (immediate) return immediate;
  throw new Error('Authentication service is still initializing. Please wait a moment and try again.');
};
