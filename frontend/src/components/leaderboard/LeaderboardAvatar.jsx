/**
 * KEYFLOW Leaderboard Avatar Component
 * ====================================
 * Renders authentic provider-sourced profile pictures (e.g. Google OAuth)
 * with robust, graceful fallback to the platform's themed initials avatar.
 *
 * Guarantees:
 * - Detects and filters out generic third-party placeholder avatars (e.g. Clerk default SVGs).
 * - Implements referrerPolicy="no-referrer" for Google CDN (googleusercontent.com) compatibility.
 * - Handles image load failures (onError) by immediately falling back to initials; never shows broken image icons.
 * - Preserves exact circular geometry, dimensions, and podium ring themes.
 */

import React, { useState, useEffect } from 'react';
import { isAuthenticAvatarUrl, getInitials } from '../../utils/avatarUtils';

export { isAuthenticAvatarUrl, getInitials };

export const LeaderboardAvatar = ({
  src,
  name,
  size = 'podium',
  ringClass = '',
  className = '',
  alt,
}) => {
  const [imgError, setImgError] = useState(false);

  // Reset error state if the src changes
  useEffect(() => {
    setImgError(false);
  }, [src]);

  const displayName = name || 'Typist';
  const avatarAlt = alt || `${displayName}'s avatar`;
  const initials = getInitials(displayName);
  const isAuthentic = isAuthenticAvatarUrl(src);

  // Podium Card Avatar: 56px (w-14 h-14) circular with podium-specific ring colors
  if (size === 'podium') {
    if (isAuthentic && !imgError) {
      return (
        <img
          src={src}
          alt={avatarAlt}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className={`w-14 h-14 rounded-full object-cover shadow-sm ${ringClass} ${className}`}
        />
      );
    }

    return (
      <div
        className={`w-14 h-14 rounded-full flex items-center justify-center font-mono font-black text-lg shadow-sm ${ringClass} ${className}`}
      >
        {initials}
      </div>
    );
  }

  // Table Row Avatar: 36px (w-9 h-9) circular
  if (isAuthentic && !imgError) {
    return (
      <img
        src={src}
        alt={avatarAlt}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className={`w-9 h-9 rounded-full object-cover border border-[var(--border)] shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`w-9 h-9 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center font-mono font-bold text-xs text-[var(--accent)] shrink-0 ${className}`}
    >
      {initials}
    </div>
  );
};

export default LeaderboardAvatar;
