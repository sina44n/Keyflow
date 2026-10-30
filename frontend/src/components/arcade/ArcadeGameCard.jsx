import React, { useState } from 'react';
import { Play, ThumbsUp, Eye } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { AnimatedGameThumbnail } from './AnimatedGameThumbnail';
import { formatCompactCount } from '../../utils/arcadeStatsService';

/**
 * ArcadeGameCard — Clean, Modern Typing Arcade Game Card
 * ======================================================
 * Designed to match typingbird.com reference aesthetic with 100% precision:
 * 1. High-Resolution 16:9 Cover Artwork with smooth hover scale
 * 2. Centered Game Title
 * 3. Justified Bottom Action Bar:
 *    - Left: Green circular Thumbs-Up badge + Like Count
 *    - Right: Blue circular Eye badge + Unique Plays / Views Count
 * 4. Entire card is click-to-play with smooth elevation hover
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
      className="card-panel group flex flex-col justify-between overflow-hidden rounded-xl sm:rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-[#151515] shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-[var(--accent)] cursor-pointer select-none"
      onClick={() => onPlay(game.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPlay(game.id);
        }
      }}
    >
      {/* 1. Large Game Artwork Thumbnail (16:9 Aspect Ratio) */}
      <div className="relative aspect-video w-full overflow-hidden bg-neutral-950">
        <AnimatedGameThumbnail game={game} />
        {/* Sleek Centered Play Button Overlay on Hover */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-[var(--accent)] text-white flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-5 h-5 ml-0.5 fill-current" />
          </div>
        </div>
      </div>

      {/* 2. Card Content Area — Centered Title and Left/Right Reference Badges */}
      <div className="p-3.5 sm:p-4 flex flex-col justify-between space-y-3">
        {/* Centered Game Title */}
        <h3 className="text-center text-sm sm:text-base font-bold text-neutral-800 dark:text-neutral-100 group-hover:text-[var(--accent)] transition-colors leading-snug line-clamp-1">
          {t(`arcade.${game.id}.title`) !== `arcade.${game.id}.title` ? t(`arcade.${game.id}.title`) : game.title}
        </h3>

        {/* 3. Reference-Matched High-Visibility Likes (Left) and Unique Plays (Right) */}
        <div className="flex items-center justify-between pt-0.5">
          {/* Interactive Thumbs-Up Likes Button (Reference Matched Green Circle + Count) */}
          <button
            type="button"
            onClick={handleLikeClick}
            disabled={isLiking}
            title={hasLiked ? 'Unlike game' : 'Like game'}
            aria-label={`${currentLikes} likes. ${hasLiked ? 'Liked' : 'Like'}`}
            className="flex items-center gap-1.5 group/like cursor-pointer select-none"
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform ${
                hasLiked
                  ? 'bg-emerald-600 text-white shadow-sm scale-110'
                  : 'bg-emerald-500 text-white group-hover/like:scale-110 shadow-xs'
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5 fill-current" />
            </div>
            <span
              className={`text-xs font-semibold ${
                hasLiked
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-neutral-600 dark:text-neutral-300'
              }`}
            >
              {formatCompactCount(currentLikes)}
            </span>
          </button>

          {/* Unique Plays Counter (Reference Matched Blue Circle + Count) */}
          <div
            className="flex items-center gap-1.5 select-none"
            title={`${currentPlays.toLocaleString()} total play sessions`}
          >
            <div className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-xs">
              <Eye className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
              {formatCompactCount(currentPlays)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArcadeGameCard;
