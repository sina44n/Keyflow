import React, { useState } from 'react';
import { Play, ThumbsUp, Eye } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { AnimatedGameThumbnail } from './AnimatedGameThumbnail';
import { formatCompactCount } from '../../utils/arcadeStatsService';

/**
 * ArcadeGameCard — Clean, Modern Typing Arcade Game Card
 * ======================================================
 * Designed to match typingbird.com reference aesthetic:
 * 1. High-Resolution Cover Artwork with smooth hover scale
 * 2. Centered Game Title
 * 3. Centered Reference-Matched Pill Badges:
 *    - Green Pill: Thumbs-Up (Interactive Like Button) + Compact Count
 *    - Blue/Cyan Pill: Eye (Unique Plays / Views) + Compact Count
 * 4. Click anywhere on card to launch game immediately
 */
export const ArcadeGameCard = ({ game, record, stats, onPlay, onToggleLike }) => {
  const { t } = useI18n();
  const [isLiking, setIsLiking] = useState(false);

  const currentLikes = stats?.likes ?? 2500;
  const currentPlays = stats?.plays ?? 150000;
  const hasLiked = Boolean(stats?.hasLiked);

  const handleLikeClick = async (e) => {
    e.stopPropagation();
    if (isLiking || !onToggleLike) return;
    setIsLiking(true);
    try {
      await onToggleLike(game.id);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Play ${game.title}`}
      className="card-panel group flex flex-col justify-between overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[var(--accent)] hover:shadow-2xl cursor-pointer select-none"
      onClick={() => onPlay(game.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPlay(game.id);
        }
      }}
    >
      {/* 1. Large Game Artwork Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-neutral-950">
        <AnimatedGameThumbnail game={game} />
        {/* Sleek Centered Play Button Overlay on Hover */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-[var(--accent)] text-white flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-5 h-5 ml-0.5 fill-current" />
          </div>
        </div>
      </div>

      {/* 2. Card Content Area — Centered Title and Badges */}
      <div className="p-4 sm:p-5 text-center flex-1 flex flex-col justify-center space-y-2.5">
        {/* Game Title */}
        <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors leading-snug line-clamp-1">
          {t(`arcade.${game.id}.title`) || game.title}
        </h3>

        {/* 3. Reference-Matched High-Visibility Likes and Unique Plays Badges */}
        <div className="flex items-center justify-center gap-2.5 pt-0.5">
          {/* Interactive Thumbs-Up Likes Button (Reference Matched Green Badge) */}
          <button
            type="button"
            onClick={handleLikeClick}
            disabled={isLiking}
            title={hasLiked ? 'Unlike game' : 'Like game'}
            aria-label={`${currentLikes} likes. ${hasLiked ? 'Liked' : 'Like'}`}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer select-none ${
              hasLiked
                ? 'bg-emerald-500 text-white border border-emerald-600 shadow-sm scale-105'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/25 hover:scale-105'
            }`}
          >
            <ThumbsUp
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                hasLiked ? 'fill-current' : 'group-hover:scale-110'
              }`}
            />
            <span>{formatCompactCount(currentLikes)}</span>
          </button>

          {/* Unique Plays Counter (Reference Matched Blue/Cyan Eye Badge) */}
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/25 select-none"
            title={`${currentPlays.toLocaleString()} total play sessions`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{formatCompactCount(currentPlays)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArcadeGameCard;
