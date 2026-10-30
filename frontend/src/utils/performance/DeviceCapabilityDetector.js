/**
 * KEYFLOW Global Game Performance System — Device Capability Detector
 * ====================================================================
 * Inspects client hardware, WebGL capabilities, display traits, and user preferences
 * safely and non-invasively to recommend optimal graphics and performance profiles.
 *
 * ZERO fingerprinting. ZERO invasive profiling. ZERO backend hardware transmission.
 */

export const DEVICE_TIERS = {
  HIGH: 'high',
  BALANCED: 'balanced',
  LOW: 'low',
  VERY_LOW: 'very-low',
  UNSUPPORTED: 'unsupported',
};

export const DEVICE_TIER_LABELS = {
  [DEVICE_TIERS.HIGH]: 'Ultra / High-Performance',
  [DEVICE_TIERS.BALANCED]: 'Balanced Performance',
  [DEVICE_TIERS.LOW]: 'Power Saver / Low Resource',
  [DEVICE_TIERS.VERY_LOW]: 'Minimal / Maximum Compatibility',
  [DEVICE_TIERS.UNSUPPORTED]: 'WebGL Restricted',
};

let cachedCapabilities = null;

/**
 * Probes WebGL capabilities safely using a temporary offscreen canvas.
 * Cleans up immediately after inspection.
 */
function probeWebGLCapabilities() {
  const result = {
    webgl1: false,
    webgl2: false,
    maxTextureSize: 2048,
    maxViewportDims: [2048, 2048],
    rendererFamily: 'unknown',
    isSoftwareRenderer: false,
    error: null,
  };

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return result;
  }

  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;

    // Check WebGL 2 first
    let gl = canvas.getContext('webgl2');
    if (gl) {
      result.webgl2 = true;
      result.webgl1 = true;
    } else {
      gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        result.webgl1 = true;
      }
    }

    if (!gl) {
      result.error = 'WebGL context unavailable';
      return result;
    }

    // Inspect safe WebGL parameters
    result.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 2048;
    const vpDims = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
    if (vpDims && vpDims.length >= 2) {
      result.maxViewportDims = [vpDims[0], vpDims[1]];
    }

    // Inspect renderer safely
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const unmaskedRenderer = String(
        gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || ''
      ).toLowerCase();

      // Check for software renderers (SwiftShader, llvmpipe, software rasterizer)
      if (
        unmaskedRenderer.includes('swiftshader') ||
        unmaskedRenderer.includes('llvmpipe') ||
        unmaskedRenderer.includes('software') ||
        unmaskedRenderer.includes('microsoft basic render')
      ) {
        result.isSoftwareRenderer = true;
        result.rendererFamily = 'software';
      } else if (unmaskedRenderer.includes('nvidia') || unmaskedRenderer.includes('geforce')) {
        result.rendererFamily = 'nvidia';
      } else if (unmaskedRenderer.includes('amd') || unmaskedRenderer.includes('radeon')) {
        result.rendererFamily = 'amd';
      } else if (unmaskedRenderer.includes('apple') || unmaskedRenderer.includes('m1') || unmaskedRenderer.includes('m2') || unmaskedRenderer.includes('m3')) {
        result.rendererFamily = 'apple';
      } else if (unmaskedRenderer.includes('intel')) {
        result.rendererFamily = 'intel';
      } else if (unmaskedRenderer.includes('mali') || unmaskedRenderer.includes('adreno')) {
        result.rendererFamily = 'mobile_gpu';
      }
    }

    // Clean up temporary WebGL context
    const loseContext = gl.getExtension('WEBGL_lose_context');
    if (loseContext) {
      loseContext.loseContext();
    }
  } catch (err) {
    result.error = err?.message || 'WebGL probe failed';
  }

  return result;
}

/**
 * Evaluates device classification tier based on detected capabilities.
 */
function evaluateDeviceTier({
  webgl,
  isMobile,
  hardwareConcurrency,
  devicePixelRatio,
  reducedMotion,
}) {
  if (!webgl.webgl1 && !webgl.webgl2) {
    return DEVICE_TIERS.UNSUPPORTED;
  }

  if (webgl.isSoftwareRenderer || webgl.maxTextureSize < 4096) {
    return DEVICE_TIERS.VERY_LOW;
  }

  // Mobile devices are conservatively placed in BALANCED or LOW to protect battery & thermals
  if (isMobile) {
    if (webgl.webgl2 && hardwareConcurrency >= 6 && webgl.maxTextureSize >= 8192) {
      return DEVICE_TIERS.BALANCED;
    }
    return DEVICE_TIERS.LOW;
  }

  // Desktop / Laptop classification
  if (
    webgl.webgl2 &&
    hardwareConcurrency >= 4 &&
    webgl.maxTextureSize >= 8192 &&
    (webgl.rendererFamily === 'nvidia' ||
      webgl.rendererFamily === 'amd' ||
      webgl.rendererFamily === 'apple')
  ) {
    return DEVICE_TIERS.HIGH;
  }

  if (webgl.webgl1 && hardwareConcurrency >= 2 && webgl.maxTextureSize >= 4096) {
    return DEVICE_TIERS.BALANCED;
  }

  if (hardwareConcurrency <= 2 || webgl.maxTextureSize <= 4096) {
    return DEVICE_TIERS.LOW;
  }

  return DEVICE_TIERS.BALANCED;
}

/**
 * Returns comprehensive device capability profile.
 * Result is cached for the life of the page session.
 */
export function detectDeviceCapabilities(forceRefresh = false) {
  if (cachedCapabilities && !forceRefresh) {
    return cachedCapabilities;
  }

  const isBrowser = typeof window !== 'undefined' && typeof navigator !== 'undefined';

  if (!isBrowser) {
    cachedCapabilities = {
      tier: DEVICE_TIERS.BALANCED,
      tierLabel: DEVICE_TIER_LABELS[DEVICE_TIERS.BALANCED],
      isMobile: false,
      isTablet: false,
      isTouch: false,
      hardwareConcurrency: 4,
      devicePixelRatio: 1,
      webgl: { webgl1: true, webgl2: true, maxTextureSize: 4096, rendererFamily: 'unknown' },
      reducedMotion: false,
      recommendedPreset: 'high',
      detectedAt: Date.now(),
    };
    return cachedCapabilities;
  }

  const userAgent = navigator.userAgent || '';
  const isTouch = 'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
  const isMobile = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTablet = /iPad|Tablet/i.test(userAgent) || (isTouch && window.innerWidth >= 768 && window.innerWidth <= 1024);
  const hardwareConcurrency = Math.max(1, navigator.hardwareConcurrency || 4);
  const devicePixelRatio = Math.max(1, Math.min(window.devicePixelRatio || 1, 3.0));

  const reducedMotionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const reducedMotion = Boolean(reducedMotionQuery && reducedMotionQuery.matches);

  const webgl = probeWebGLCapabilities();

  const tier = evaluateDeviceTier({
    webgl,
    isMobile: isMobile || (isTablet && hardwareConcurrency <= 4),
    hardwareConcurrency,
    devicePixelRatio,
    reducedMotion,
  });

  // Map tier to recommended graphics preset
  let recommendedPreset = 'high';
  if (tier === DEVICE_TIERS.HIGH) {
    recommendedPreset = 'ultra';
  } else if (tier === DEVICE_TIERS.BALANCED) {
    recommendedPreset = 'high';
  } else if (tier === DEVICE_TIERS.LOW) {
    recommendedPreset = 'medium';
  } else if (tier === DEVICE_TIERS.VERY_LOW || tier === DEVICE_TIERS.UNSUPPORTED) {
    recommendedPreset = 'performance';
  }

  cachedCapabilities = {
    tier,
    tierLabel: DEVICE_TIER_LABELS[tier] || 'Balanced',
    isMobile,
    isTablet,
    isTouch: Boolean(isTouch),
    hardwareConcurrency,
    devicePixelRatio,
    webgl,
    reducedMotion,
    recommendedPreset,
    detectedAt: Date.now(),
  };

  return cachedCapabilities;
}

/**
 * Resets cached capabilities (useful for unit testing or display mode switches).
 */
export function resetDeviceCapabilityCache() {
  cachedCapabilities = null;
}
