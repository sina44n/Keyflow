/**
 * KEYFLOW Clerk Environment Configuration & Security Validator
 * ============================================================
 * Provides authoritative environment inspection and validation for Clerk authentication.
 * 
 * Responsibilities:
 * 1. Safe retrieval and trimming of VITE_CLERK_PUBLISHABLE_KEY.
 * 2. Format validation: Development ('pk_test_...') vs Production ('pk_live_...').
 * 3. Environment mismatch detection:
 *    - Development keys used in production builds (import.meta.env.PROD).
 *    - Production keys used in local development (import.meta.env.DEV).
 * 4. Critical security guard: Ensures NO secret keys ('sk_test_...', 'sk_live_...')
 *    are ever leaked into frontend environment variables or client-side bundles.
 * 5. Actionable diagnostics without exposing sensitive tokens or credentials.
 */

/**
 * Inspects environment variables for any accidental leak of Clerk Secret Keys.
 * Secret keys belong strictly in backend/.env or server-side environment variables.
 */
export const checkClientSecurityLeaks = (customEnv = null) => {
  const env = customEnv || (typeof import.meta !== 'undefined' ? import.meta.env : {});
  const leakedKeys = [];

  if (env && typeof env === 'object') {
    for (const [key, val] of Object.entries(env)) {
      if (typeof val === 'string') {
        const trimmedVal = val.trim();
        if (
          key.toUpperCase().includes('CLERK_SECRET') ||
          trimmedVal.startsWith('sk_test_') ||
          trimmedVal.startsWith('sk_live_')
        ) {
          leakedKeys.push(key);
        }
      }
    }
  }

  if (leakedKeys.length > 0) {
    console.error(
      `[KEYFLOW CRITICAL SECURITY ALERT] Clerk Secret Key detected in client-side environment (${leakedKeys.join(
        ', '
      )})! ` +
        'Clerk Secret Keys (sk_...) must NEVER be exposed to the browser. ' +
        'Remove it immediately from your frontend environment variables.'
    );
    return { hasSecurityLeak: true, leakedKeys };
  }

  return { hasSecurityLeak: false, leakedKeys: [] };
};

/**
 * Resolves the Clerk publishable key from environment or parameter.
 */
export const getClerkPublishableKey = (customKey = null) => {
  if (customKey !== null && customKey !== undefined) {
    return String(customKey).trim();
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_CLERK_PUBLISHABLE_KEY) {
    return String(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY).trim();
  }
  return '';
};

/**
 * Validates the Clerk environment status and reports environment separation diagnostics.
 *
 * @param {string|null} customKey Optional key override for unit testing
 * @param {object|null} customEnv Optional env flags override for unit testing ({ PROD: boolean, DEV: boolean })
 * @returns {object} Status metadata
 */
export const getClerkEnvironmentStatus = (customKey = null, customEnv = null) => {
  const publishableKey = getClerkPublishableKey(customKey);
  const isProd = customEnv?.PROD !== undefined
    ? Boolean(customEnv.PROD)
    : (typeof import.meta !== 'undefined' && Boolean(import.meta.env?.PROD));
  const isDev = customEnv?.DEV !== undefined
    ? Boolean(customEnv.DEV)
    : (typeof import.meta !== 'undefined' && Boolean(import.meta.env?.DEV));

  const warnings = [];
  let validationError = null;

  // Run security guard
  const securityCheck = checkClientSecurityLeaks(customEnv?.envObject || null);

  if (!publishableKey) {
    return {
      publishableKey: '',
      isConfigured: false,
      isDevInstance: false,
      isProdInstance: false,
      instanceType: 'unconfigured',
      validationError: null,
      warnings: ['VITE_CLERK_PUBLISHABLE_KEY is unset. Running in unconfigured fallback mode.'],
      hasSecurityLeak: securityCheck.hasSecurityLeak,
    };
  }

  const isDevInstance = publishableKey.startsWith('pk_test_');
  const isProdInstance = publishableKey.startsWith('pk_live_');

  if (!isDevInstance && !isProdInstance) {
    validationError =
      'Invalid Clerk publishable key format. Key must begin with "pk_test_" (Development) or "pk_live_" (Production).';
    warnings.push(validationError);
  }

  // Cross-environment detection
  if (isProd && isDevInstance) {
    const devInProdWarning =
      '[KEYFLOW Environment Notice] Clerk Development Instance key (pk_test_...) detected in a production build. ' +
      'Development instances have strict rate limits and should not be used in live production. ' +
      'Set VITE_CLERK_PUBLISHABLE_KEY to your production key (pk_live_...) in your hosting provider environment settings.';
    warnings.push(devInProdWarning);
    if (typeof console !== 'undefined' && console.warn) {
      console.warn(devInProdWarning);
    }
  }

  if (isDev && isProdInstance) {
    const prodInDevWarning =
      '[KEYFLOW Environment Notice] Clerk Production Instance key (pk_live_...) detected in local development. ' +
      'To prevent modifying production user accounts during local development, use a development key (pk_test_...).';
    warnings.push(prodInDevWarning);
    if (typeof console !== 'undefined' && console.warn) {
      console.warn(prodInDevWarning);
    }
  }

  return {
    publishableKey,
    isConfigured: true,
    isDevInstance,
    isProdInstance,
    instanceType: isDevInstance ? 'development' : isProdInstance ? 'production' : 'invalid',
    validationError,
    warnings,
    hasSecurityLeak: securityCheck.hasSecurityLeak,
  };
};

// Module-level evaluated constants
export const CLERK_PUBLISHABLE_KEY = getClerkPublishableKey();
export const clerkEnvStatus = getClerkEnvironmentStatus(CLERK_PUBLISHABLE_KEY);
export const isClerkConfigured = clerkEnvStatus.isConfigured && !clerkEnvStatus.validationError;
