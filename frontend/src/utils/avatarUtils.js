/**
 * KEYFLOW Avatar Utilities
 * ========================
 * Utility functions for validating authentic profile avatar URLs
 * and generating safe initials fallbacks.
 */

/**
 * Validates whether an avatar URL points to an authentic user-provided profile picture.
 * Rejects empty/null values, malformed URLs, and Clerk's auto-generated generic purple placeholder avatars.
 */
export function isAuthenticAvatarUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  // Filter out Clerk's auto-generated generic default placeholder avatar (type: "default")
  if (trimmed.includes('img.clerk.com/')) {
    try {
      const token = trimmed.split('img.clerk.com/')[1]?.split('?')[0]?.split('/')[0];
      if (token) {
        const base64 = token.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
        const jsonStr = typeof atob === 'function'
          ? atob(padded)
          : (typeof Buffer !== 'undefined' ? Buffer.from(padded, 'base64').toString('utf-8') : '');
        if (jsonStr) {
          const data = JSON.parse(jsonStr);
          if (data && data.type === 'default') {
            return false;
          }
        }
      }
    } catch {
      // If parsing fails, fall through to URL validation
    }
  }

  return trimmed.startsWith('http://') || trimmed.startsWith('https://');
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
