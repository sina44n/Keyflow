/**
 * KEYFLOW Avatar Utilities
 * ========================
 * Authoritative utility functions for validating authentic Google profile avatar URLs
 * and generating safe initials fallbacks.
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
 * Extracts clean, two-letter initials from a display name or username.
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
