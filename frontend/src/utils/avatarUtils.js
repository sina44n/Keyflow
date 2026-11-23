/**
 * KEYFLOW Avatar Utilities
 * ========================
 * Authoritative utility functions for validating authentic Google profile avatar URLs,
 * generating intelligent single-character initials fallbacks, and deterministically
 * assigning unique background colors from an accessible curated palette.
 */

/**
 * Validates that a URL originates strictly from verified Google profile picture domains
 * (*.googleusercontent.com or *.ggpht.com) over HTTPS.
 */
export function isGoogleAvatarHost(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== 'https:') return false;
    const hostname = parsed.hostname.toLowerCase().trim();
    if (!hostname) return false;
    if (hostname === 'googleusercontent.com' || hostname.endsWith('.googleusercontent.com')) {
      return true;
    }
    if (hostname === 'ggpht.com' || hostname.endsWith('.ggpht.com')) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Validates whether an avatar URL points to an authentic Google profile picture.
 * Accepts:
 * 1. Direct HTTPS Google profile picture URLs (*.googleusercontent.com, *.ggpht.com).
 * 2. Approved Clerk image proxy URLs (img.clerk.com) wrapping verified Google profile picture URLs.
 * Rejects:
 * - Arbitrary external HTTPS image URLs from non-Google domains.
 * - Clerk's auto-generated generic purple placeholder avatars (type: default).
 * - Clerk proxies wrapping non-Google URLs.
 * - Misleading domains, non-HTTPS schemes (http, javascript, data, blob), and empty/malformed URLs.
 */
export function isAuthenticAvatarUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim();
  if (!clean) return false;

  try {
    const parsed = new URL(clean);
    if (parsed.protocol !== 'https:') return false;

    // 1. Direct verified Google profile picture host
    if (isGoogleAvatarHost(clean)) {
      return true;
    }

    const hostname = parsed.hostname.toLowerCase().trim();
    // 2. Approved Clerk image proxy wrapping an authentic Google photo
    if (hostname === 'img.clerk.com' || hostname.endsWith('.clerk.com') || hostname.endsWith('.clerk.dev')) {
      const token = parsed.pathname.replace(/^\/+/, '').split('/')[0];
      if (!token) return false;

      const base64 = token.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
      const jsonStr = typeof atob === 'function'
        ? atob(padded)
        : (typeof Buffer !== 'undefined' ? Buffer.from(padded, 'base64').toString('utf-8') : '');
      if (!jsonStr) return false;

      const data = JSON.parse(jsonStr);
      if (data && typeof data === 'object' && data.type === 'proxy') {
        return Boolean(data.src && isGoogleAvatarHost(data.src));
      }
      return false;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Centrally managed palette of 26 curated, professional, vibrant solid colors.
 * Every color strictly satisfies WCAG AA contrast (> 4.5:1) against pure white (#FFFFFF).
 */
export const AVATAR_PALETTE = [
  { bg: '#0F766E', text: '#FFFFFF', name: 'Teal' },
  { bg: '#047857', text: '#FFFFFF', name: 'Emerald' },
  { bg: '#15803D', text: '#FFFFFF', name: 'Forest Green' },
  { bg: '#0E7490', text: '#FFFFFF', name: 'Cyan' },
  { bg: '#0369A1', text: '#FFFFFF', name: 'Sky Blue' },
  { bg: '#2563EB', text: '#FFFFFF', name: 'Royal Blue' },
  { bg: '#4F46E5', text: '#FFFFFF', name: 'Indigo' },
  { bg: '#7C3AED', text: '#FFFFFF', name: 'Violet' },
  { bg: '#9333EA', text: '#FFFFFF', name: 'Purple' },
  { bg: '#C026D3', text: '#FFFFFF', name: 'Magenta' },
  { bg: '#E11D48', text: '#FFFFFF', name: 'Rose' },
  { bg: '#DC2626', text: '#FFFFFF', name: 'Crimson' },
  { bg: '#C2410C', text: '#FFFFFF', name: 'Deep Orange' },
  { bg: '#9A3412', text: '#FFFFFF', name: 'Rust' },
  { bg: '#B45309', text: '#FFFFFF', name: 'Amber' },
  { bg: '#A16207', text: '#FFFFFF', name: 'Mustard' },
  { bg: '#881337', text: '#FFFFFF', name: 'Burgundy' },
  { bg: '#701A75', text: '#FFFFFF', name: 'Plum' },
  { bg: '#1E3A8A', text: '#FFFFFF', name: 'Midnight Blue' },
  { bg: '#334155', text: '#FFFFFF', name: 'Slate' },
  { bg: '#166534', text: '#FFFFFF', name: 'Pine Green' },
  { bg: '#115E59', text: '#FFFFFF', name: 'Dark Teal' },
  { bg: '#1D4ED8', text: '#FFFFFF', name: 'Cobalt' },
  { bg: '#A21CAF', text: '#FFFFFF', name: 'Dark Fuchsia' },
  { bg: '#BE123C', text: '#FFFFFF', name: 'Ruby' },
  { bg: '#475569', text: '#FFFFFF', name: 'Charcoal' },
];

/**
 * Deterministically assigns a unique, stable color from the curated palette
 * based on an immutable user identifier (user_id, username, email, or display name).
 * Guarantees the same user always receives the exact same color across refreshes,
 * podium slots, table rows, and filter toggles.
 */
export function getAvatarColor(identifier) {
  if (identifier === null || identifier === undefined) {
    return AVATAR_PALETTE[0];
  }
  const str = String(identifier).trim();
  if (!str) {
    return AVATAR_PALETTE[0];
  }

  // FNV-1a 32-bit hash for uniform distribution
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const idx = (hash >>> 0) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[idx];
}

/**
 * Extracts exactly one centered uppercase initial from the first meaningful
 * alphanumeric character of a display name or username.
 * e.g., 'sinan kp' -> 'S', 'robith' -> 'R', 'alex john' -> 'A', 'michael' -> 'M'
 * Fallback to '?' if no name or meaningful character is available.
 */
export function getInitial(name) {
  if (!name || typeof name !== 'string') return '?';
  const clean = name.trim();
  if (!clean) return '?';

  const match = clean.match(/[a-zA-Z0-9]/);
  if (match) {
    return match[0].toUpperCase();
  }
  return clean[0].toUpperCase() || '?';
}

/**
 * Extracts clean initials from a display name or username.
 * Supported for backward compatibility with 2-letter requests.
 */
export function getInitials(name) {
  if (!name || typeof name !== 'string') return 'KF';
  const clean = name.trim();
  if (!clean) return 'KF';
  const parts = clean.split(/\s+/);
  if (parts.length >= 2 && parts[0][0] && parts[1][0]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}
