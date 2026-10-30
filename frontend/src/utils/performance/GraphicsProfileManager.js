/**
 * KEYFLOW Global Game Performance System — Graphics Profile Manager
 * =================================================================
 * Manages graphics quality presets (Auto, Ultra, High, Medium, Performance),
 * translates presets into technology-specific rendering profiles (WebGL, Canvas, DOM),
 * persists user preferences, and protects manual user overrides.
 */

import { detectDeviceCapabilities, DEVICE_TIERS } from './DeviceCapabilityDetector.js';

export const GRAPHICS_PRESETS = {
  AUTO: 'auto',
  ULTRA: 'ultra',
  HIGH: 'high',
  MEDIUM: 'medium',
  PERFORMANCE: 'performance',
};

export const PRESET_METADATA = {
  [GRAPHICS_PRESETS.AUTO]: {
    id: 'auto',
    name: 'Auto (Recommended)',
    description: 'Dynamically adapts visual quality to match your device capabilities and maintain smooth frame rates.',
    badge: 'Dynamic',
  },
  [GRAPHICS_PRESETS.ULTRA]: {
    id: 'ultra',
    name: 'Ultra Quality',
    description: 'Maximum visual fidelity with full dynamic lighting, high-density particle systems, and sharpest resolution.',
    badge: 'Highest Quality',
  },
  [GRAPHICS_PRESETS.HIGH]: {
    id: 'high',
    name: 'High Quality',
    description: 'Crisp textures, balanced lighting, and responsive visual effects optimized for modern laptops and PCs.',
    badge: 'Balanced',
  },
  [GRAPHICS_PRESETS.MEDIUM]: {
    id: 'medium',
    name: 'Medium Quality',
    description: 'Streamlined visual effects and optimized geometry for stable performance on integrated graphics.',
    badge: 'Efficient',
  },
  [GRAPHICS_PRESETS.PERFORMANCE]: {
    id: 'performance',
    name: 'Maximum Performance',
    description: 'Prioritizes maximum frame rate and minimum input latency with minimal effects. Ideal for older or low-power devices.',
    badge: 'High FPS',
  },
};

const STORAGE_KEY = 'keyflow_game_graphics_settings';

const DEFAULT_SETTINGS = {
  preset: GRAPHICS_PRESETS.AUTO,
  manualOverride: false,
  reducedMotion: null, // null = follow system media query
  batterySaver: false,
  showPerfHud: false,
};

let inMemorySettings = { ...DEFAULT_SETTINGS };

/**
 * Returns stored graphics settings safely from localStorage.
 */
export function getStoredGraphicsSettings() {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return { ...inMemorySettings };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (err) {
    console.warn('[KEYFLOW Performance] Failed to parse stored graphics settings:', err);
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Persists graphics settings to localStorage and dispatches change event.
 */
export function saveGraphicsSettings(partialSettings) {
  inMemorySettings = { ...inMemorySettings, ...partialSettings };
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return { ...inMemorySettings };
  }
  try {
    const current = getStoredGraphicsSettings();
    const updated = { ...current, ...partialSettings };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(
        new CustomEvent('keyflow-graphics-profile-changed', { detail: updated })
      );
    }
    return updated;
  } catch (err) {
    console.warn('[KEYFLOW Performance] Failed to save graphics settings:', err);
    return getStoredGraphicsSettings();
  }
}

/**
 * Resolves the active effective graphics preset.
 * If user selected 'auto', resolves to the device capability recommendation.
 */
export function resolveEffectivePreset(userPreset = null) {
  const settings = getStoredGraphicsSettings();
  const targetPreset = userPreset || settings.preset;

  if (targetPreset !== GRAPHICS_PRESETS.AUTO) {
    return targetPreset;
  }

  // Auto preset: resolve based on device capabilities
  const caps = detectDeviceCapabilities();
  return caps.recommendedPreset || GRAPHICS_PRESETS.HIGH;
}

/**
 * Translates an effective preset into Three.js / WebGL-specific settings.
 */
export function getWebGLGraphicsConfig(effectivePreset = null) {
  const preset = effectivePreset || resolveEffectivePreset();
  const caps = detectDeviceCapabilities();
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const isReducedMotion =
    caps.reducedMotion || getStoredGraphicsSettings().reducedMotion === true;

  switch (preset) {
    case GRAPHICS_PRESETS.ULTRA:
      return {
        preset: GRAPHICS_PRESETS.ULTRA,
        pixelRatio: Math.min(dpr, 2.0),
        shadows: 'high',
        shadowMapSize: 2048,
        particleDensity: 1.0,
        lightingComplexity: 'full',
        exhaustFlames: '3d_volumetric',
        drawDistance: 320,
        antiAliasing: true,
        enableBloom: true,
        cameraShake: !isReducedMotion,
        maxLights: 8,
      };

    case GRAPHICS_PRESETS.HIGH:
      return {
        preset: GRAPHICS_PRESETS.HIGH,
        pixelRatio: Math.min(dpr, 1.5),
        shadows: 'medium',
        shadowMapSize: 1024,
        particleDensity: 0.75,
        lightingComplexity: 'standard',
        exhaustFlames: '3d_volumetric',
        drawDistance: 240,
        antiAliasing: true,
        enableBloom: false,
        cameraShake: !isReducedMotion,
        maxLights: 5,
      };

    case GRAPHICS_PRESETS.MEDIUM:
      return {
        preset: GRAPHICS_PRESETS.MEDIUM,
        pixelRatio: 1.0,
        shadows: 'basic',
        shadowMapSize: 512,
        particleDensity: 0.4,
        lightingComplexity: 'simple',
        exhaustFlames: '2d_billboard',
        drawDistance: 170,
        antiAliasing: false,
        enableBloom: false,
        cameraShake: !isReducedMotion,
        maxLights: 3,
      };

    case GRAPHICS_PRESETS.PERFORMANCE:
    default:
      return {
        preset: GRAPHICS_PRESETS.PERFORMANCE,
        pixelRatio: 0.85,
        shadows: 'disabled',
        shadowMapSize: 0,
        particleDensity: 0.15,
        lightingComplexity: 'minimal',
        exhaustFlames: 'simple_glow',
        drawDistance: 110,
        antiAliasing: false,
        enableBloom: false,
        cameraShake: false,
        maxLights: 2,
      };
  }
}

/**
 * Translates an effective preset into Canvas 2D / SVG / DOM-specific settings.
 */
export function getDomOrCanvasGraphicsConfig(effectivePreset = null) {
  const preset = effectivePreset || resolveEffectivePreset();
  const caps = detectDeviceCapabilities();
  const isReducedMotion =
    caps.reducedMotion || getStoredGraphicsSettings().reducedMotion === true;

  switch (preset) {
    case GRAPHICS_PRESETS.ULTRA:
      return {
        preset: GRAPHICS_PRESETS.ULTRA,
        maxParticles: 50,
        enableScreenShake: !isReducedMotion,
        glowEffects: true,
        tracerDetail: 'full',
        enableAnimations: true,
        particleDecayRate: 0.02,
      };

    case GRAPHICS_PRESETS.HIGH:
      return {
        preset: GRAPHICS_PRESETS.HIGH,
        maxParticles: 35,
        enableScreenShake: !isReducedMotion,
        glowEffects: true,
        tracerDetail: 'standard',
        enableAnimations: true,
        particleDecayRate: 0.03,
      };

    case GRAPHICS_PRESETS.MEDIUM:
      return {
        preset: GRAPHICS_PRESETS.MEDIUM,
        maxParticles: 20,
        enableScreenShake: !isReducedMotion,
        glowEffects: false,
        tracerDetail: 'standard',
        enableAnimations: true,
        particleDecayRate: 0.05,
      };

    case GRAPHICS_PRESETS.PERFORMANCE:
    default:
      return {
        preset: GRAPHICS_PRESETS.PERFORMANCE,
        maxParticles: 8,
        enableScreenShake: false,
        glowEffects: false,
        tracerDetail: 'minimal',
        enableAnimations: false,
        particleDecayRate: 0.08,
      };
  }
}

/**
 * Sets user graphics preset. If setting to non-auto, marks manualOverride: true.
 * If setting to auto, resets manualOverride: false.
 */
export function setUserGraphicsPreset(newPreset) {
  const isAuto = newPreset === GRAPHICS_PRESETS.AUTO;
  return saveGraphicsSettings({
    preset: newPreset,
    manualOverride: !isAuto,
  });
}

/**
 * Resets user graphics settings back to recommended Auto defaults.
 */
export function resetGraphicsSettingsToDefault() {
  return saveGraphicsSettings({
    preset: GRAPHICS_PRESETS.AUTO,
    manualOverride: false,
    reducedMotion: null,
    batterySaver: false,
    showPerfHud: false,
  });
}
