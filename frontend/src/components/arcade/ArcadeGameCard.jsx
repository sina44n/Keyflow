import React, { useState } from 'react';
import { Play, Trophy, ThumbsUp, Eye, Sparkles } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { Button } from '../common/Button';
import { AnimatedGameThumbnail } from './AnimatedGameThumbnail';
import { formatCompactCount } from '../../utils/arcadeStatsService';

/**
 * ArcadeGameCard — Redesigned Masterpiece Game Card
 * =================================================
 * Visual Hierarchy:
 * 1. Large Animated Game Artwork (16:9 aspect-ratio with animated effects)
 * 2. Game Title & Subtitle immediately beneath artwork
 * 3. Compact Real-Time Likes & Unique Plays Statistics Bar
 * 4. High-Octane "Play Game" Launch Action
 */
export const ArcadeGameCard = ({ game, record, stats, onPlay, onToggleLike }) => {
  const { t } = useI18n();
  const [isLiking, setIsLiking] = useState(false);
  const Icon = game.icon;

  const currentLikes = stats?.likes ?? 2500;
  const currentPlays = stats?.plays ?? 150000;
  const hasLiked = Boolean(stats?.hasLiked);

  // Format personal best string
  const formatPersonalBest = () => {
    if (!record || !record.gamesPlayed) return t('arcade.notPlayed');

    switch (game.id) {
      case 'cascade':
        return record.bestScore ? `${record.bestScore.toLocaleString()} ${t('common.pts')}` : t('arcade.notPlayed');
      case 'sprint':
        return record.bestWpm ? `${record.bestWpm} ${t('common.wpm')}` : t('arcade.notPlayed');
      case 'hunter':
        return record.bestStreak ? `${record.bestStreak} ${t('common.streak')}` : t('arcade.notPlayed');
      case 'ninja':
        return record.bestSlices ? `${record.bestSlices} slashes` : t('arcade.notPlayed');
      case 'runner':
        return record.maxDistance ? `${record.maxDistance}m` : t('arcade.notPlayed');
      case 'memory':
        return record.deepestRound ? `Round ${record.deepestRound}` : t('arcade.notPlayed');
      case 'boss':
        return record.highestWave
          ? `Wave ${record.highestWave}`
          : record.bossDefeated
          ? t('arcade.hud.victory')
          : t('arcade.notPlayed');
      case 'nitro':
        return record.bestWpm ? `${record.bestWpm} ${t('common.wpm')}` : t('arcade.notPlayed');
      default:
        return t('arcade.notPlayed');
    }
  };

  const bestValue = formatPersonalBest();
  const hasPlayed = record && record.gamesPlayed > 0;

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
    <div className="card-panel flex flex-col justify-between overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[var(--accent)] hover:shadow-2xl group cursor-pointer"
      onClick={() => onPlay(game.id)}
    >
      {/* 1. Large Animated Game Artwork */}
      <div className="p-2 sm:p-2.5 pb-0">
        <AnimatedGameThumbnail game={game} />
      </div>

      {/* 2. Card Content Area (Title immediately below image) */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5">
        <div className="space-y-2">
          {/* Title & Icon Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors leading-tight">
                {t(`arcade.${game.id}.title`) || game.title}
              </h3>
              <p className="text-[11px] font-mono text-[var(--text-muted)] mt-0.5">
                {game.subtitle}
              </p>
            </div>
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${game.color}20`, color: game.color }}
            >
              <Icon className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* 3. Reference-Matched High-Visibility Likes and Unique Plays Statistics Bar */}
          <div className="flex items-center justify-between gap-2 py-1.5 px-2.5 rounded-xl bg-[var(--bg-elevated)]/70 border border-[var(--border)] text-xs font-mono">
            {/* Interactive Thumbs-Up Likes Button (Reference Matched Green Badge) */}
            <button
              type="button"
              onClick={handleLikeClick}
              disabled={isLiking}
              title={hasLiked ? 'Unlike game' : 'Like game'}
              aria-label={`${currentLikes} likes. ${hasLiked ? 'Liked' : 'Like'}`}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer select-none ${
                hasLiked
                  ? 'bg-emerald-500/25 text-emerald-400 border border-emerald-500/40 shadow-xs'
                  : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20'
              }`}
            >
              <ThumbsUp
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  hasLiked ? 'fill-emerald-500 scale-110' : 'group-hover:scale-110'
                }`}
              />
              <span className="font-semibold">{formatCompactCount(currentLikes)}</span>
            </button>

            {/* Unique Plays Counter (Reference Matched Blue/Cyan Eye Badge) */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-500 border border-sky-500/20 font-bold"
              title={`${currentPlays.toLocaleString()} total play sessions`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="font-semibold">{formatCompactCount(currentPlays)}</span>
            </div>

            {/* Personal Best Indicator */}
            <div
              className={`flex items-center gap-1 px-1.5 py-1 truncate ${
                hasPlayed ? 'text-[var(--accent)] font-semibold' : 'text-[var(--text-muted)]'
              }`}
              title={`Personal Best: ${bestValue}`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate text-[11px] font-semibold">{bestValue}</span>
            </div>
          </div>

          {/* Concise Features Preview */}
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2 pt-0.5">
            {t(`arcade.${game.id}.desc`) || game.description}
          </p>
        </div>

        {/* 4. Action Button (Strictly aligned across all cards) */}
        <div className="pt-2 border-t border-[var(--border)]">
          <Button
            variant="primary"
            size="sm"
            icon={Play}
            onClick={(e) => {
              e.stopPropagation();
              onPlay(game.id);
            }}
            className="w-full justify-center shadow-xs group-hover:bg-[var(--accent)]"
          >
            {t('arcade.playGame')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ArcadeGameCard;
