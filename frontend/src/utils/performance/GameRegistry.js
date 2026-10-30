/**
 * KEYFLOW Global Game Performance System — Game Registry
 * ======================================================
 * Central registry for all KEYFLOW arcade games. Declares rendering technology,
 * graphics capabilities, resource requirements, mobile compatibility, and fallback support.
 *
 * Allows existing and future games to integrate into the shared performance architecture
 * through a clean, standardized adapter interface.
 */

export const RENDERING_TECH = {
  THREEJS_WEBGL: 'threejs_webgl',
  CANVAS_2D: 'canvas2d',
  SVG_DOM: 'svg_dom',
  REACT_DOM: 'react_dom',
};

const registeredGames = new Map();

/**
 * Validates and registers a game definition into the global performance architecture.
 */
export function registerGame(def) {
  if (!def || !def.id) {
    throw new Error('[KEYFLOW GameRegistry] Game definition must contain a valid "id".');
  }

  const normalized = {
    id: String(def.id),
    title: def.title || def.id,
    renderingTech: def.renderingTech || RENDERING_TECH.REACT_DOM,
    supportedPresets: def.supportedPresets || ['auto', 'ultra', 'high', 'medium', 'performance'],
    requiresGpu: Boolean(def.requiresGpu),
    hasFallback: Boolean(def.hasFallback),
    fallbackTech: def.fallbackTech || null,
    mobileSupported: def.mobileSupported !== false,
    mobileTouchControls: Boolean(def.mobileTouchControls),
    audioChannels: def.audioChannels || ['sfx'],
    maxParticles: def.maxParticles || { ultra: 50, high: 35, medium: 20, performance: 8 },
    cleanupHook: typeof def.cleanupHook === 'function' ? def.cleanupHook : null,
  };

  registeredGames.set(normalized.id, normalized);
  return normalized;
}

/**
 * Returns metadata for a registered game.
 */
export function getGameDefinition(gameId) {
  return registeredGames.get(gameId) || null;
}

/**
 * Returns an array of all registered game definitions.
 */
export function getAllRegisteredGames() {
  return Array.from(registeredGames.values());
}

export const GameRegistry = {
  registerGame,
  getGameDefinition,
  getAllRegisteredGames,
};

// -------------------------------------------------------------
// PRE-REGISTER ALL 8 EXISTING KEYFLOW ARCADE GAMES
// -------------------------------------------------------------

registerGame({
  id: 'nitro',
  title: 'Nitro Type Pro (KEYFLOW 3D Racing)',
  renderingTech: RENDERING_TECH.THREEJS_WEBGL,
  supportedPresets: ['auto', 'ultra', 'high', 'medium', 'performance'],
  requiresGpu: true,
  hasFallback: true,
  fallbackTech: RENDERING_TECH.CANVAS_2D,
  mobileSupported: true,
  mobileTouchControls: true,
  audioChannels: ['engine', 'sfx', 'countdown', 'nitro', 'fanfare'],
});

registerGame({
  id: 'boss',
  title: 'Boss Battle (Warrior Combat Arena)',
  renderingTech: RENDERING_TECH.SVG_DOM,
  supportedPresets: ['auto', 'ultra', 'high', 'medium', 'performance'],
  requiresGpu: false,
  hasFallback: true,
  fallbackTech: RENDERING_TECH.REACT_DOM,
  mobileSupported: true,
  mobileTouchControls: true,
  audioChannels: ['combat', 'sfx', 'alarm', 'victory'],
});

registerGame({
  id: 'ninja',
  title: 'Key Ninja',
  renderingTech: RENDERING_TECH.SVG_DOM,
  supportedPresets: ['auto', 'ultra', 'high', 'medium', 'performance'],
  requiresGpu: false,
  hasFallback: false,
  mobileSupported: true,
  mobileTouchControls: true,
  audioChannels: ['slash', 'combo', 'sfx'],
});

registerGame({
  id: 'runner',
  title: 'Word Runner',
  renderingTech: RENDERING_TECH.REACT_DOM,
  supportedPresets: ['auto', 'ultra', 'high', 'medium', 'performance'],
  requiresGpu: false,
  hasFallback: false,
  mobileSupported: true,
  mobileTouchControls: true,
  audioChannels: ['jump', 'sfx'],
});

registerGame({
  id: 'cascade',
  title: 'Key Cascade',
  renderingTech: RENDERING_TECH.REACT_DOM,
  supportedPresets: ['auto', 'ultra', 'high', 'medium', 'performance'],
  requiresGpu: false,
  hasFallback: false,
  mobileSupported: true,
  mobileTouchControls: true,
  audioChannels: ['laser', 'sfx'],
});

registerGame({
  id: 'hunter',
  title: 'Word Hunter',
  renderingTech: RENDERING_TECH.REACT_DOM,
  supportedPresets: ['auto', 'ultra', 'high', 'medium', 'performance'],
  requiresGpu: false,
  hasFallback: false,
  mobileSupported: true,
  mobileTouchControls: true,
  audioChannels: ['lock', 'elimination', 'sfx'],
});

registerGame({
  id: 'sprint',
  title: 'Speed Sprint',
  renderingTech: RENDERING_TECH.REACT_DOM,
  supportedPresets: ['auto', 'ultra', 'high', 'medium', 'performance'],
  requiresGpu: false,
  hasFallback: false,
  mobileSupported: true,
  mobileTouchControls: true,
  audioChannels: ['keystroke', 'bell', 'sfx'],
});

registerGame({
  id: 'memory',
  title: 'Typing Memory',
  renderingTech: RENDERING_TECH.REACT_DOM,
  supportedPresets: ['auto', 'ultra', 'high', 'medium', 'performance'],
  requiresGpu: false,
  hasFallback: false,
  mobileSupported: true,
  mobileTouchControls: true,
  audioChannels: ['shutter', 'recall', 'sfx'],
});
