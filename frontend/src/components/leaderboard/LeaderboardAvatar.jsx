/**
 * KEYFLOW Leaderboard Avatar Component
 * ====================================
 * Renders authentic provider-sourced profile pictures (e.g. Google OAuth)
 * with robust, graceful fallback to intelligent circular initial avatars
 * backed by deterministic user color assignment.
 *
 * Guarantees:
 * - Detects and filters out generic third-party placeholder avatars (e.g. Clerk default SVGs).
 * - Implements referrerPolicy="no-referrer" for Google CDN (googleusercontent.com) compatibility.
 * - Handles image load failures (onError) by immediately falling back to initials; never shows broken image icons.
 * - Preserves exact circular geometry, dimensions, and podium ring themes.
 * - Single centered uppercase initial with white text on a deterministic vibrant background.
 */

import React, { useState, useEffect } from 'react';
import {
  isAuthenticAvatarUrl,
  isGoogleAvatarHost,
  getInitial,
  getInitials,
  getAvatarColor,
  AVATAR_PALETTE,
} from '../../utils/avatarUtils';

export {
  isAuthenticAvatarUrl,
  isGoogleAvatarHost,
  getInitial,
  getInitials,
  getAvatarColor,
  AVATAR_PALETTE,
};

export const LeaderboardAvatar = ({
  src,
  name,
  userId,
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
  const initial = getInitial(displayName);
  const isAuthentic = isAuthenticAvatarUrl(src);
  const avatarColor = getAvatarColor(userId ?? displayName);

  // Filter out any legacy bg-* or text-* utility classes from ringClass
  // to prevent overriding the user's deterministic background color or white text
  const borderRingClass = ringClass
    ? ringClass
        .split(/\s+/)
        .filter((c) => !c.startsWith('bg-') && !c.startsWith('text-'))
        .join(' ')
    : '';

  // Podium Card Avatar: 56px (w-14 h-14) circular with podium-specific ring colors
  if (size === 'podium') {
    if (isAuthentic && !imgError) {
      return (
        <img
          src={src}
          alt={avatarAlt}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className={`w-14 h-14 rounded-full object-cover shadow-sm ${borderRingClass} ${className}`}
        />
      );
    }

    return (
      <div
        className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-2xl shadow-sm select-none uppercase tracking-wide shrink-0 ${borderRingClass} ${className}`}
        style={{
          backgroundColor: avatarColor.bg,
          color: avatarColor.text || '#FFFFFF',
        }}
        title={displayName}
      >
        {initial}
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
      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm select-none uppercase tracking-wide shrink-0 shadow-xs border border-black/10 dark:border-white/10 ${className}`}
      style={{
        backgroundColor: avatarColor.bg,
        color: avatarColor.text || '#FFFFFF',
      }}
      title={displayName}
    >
      {initial}
    </div>
  );
};

export const UserAvatar = LeaderboardAvatar;
export default LeaderboardAvatar;
