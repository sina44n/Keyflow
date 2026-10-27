import React, { useState } from 'react';
import { Play, Sparkles, Trophy } from 'lucide-react';
import { Button } from '../common/Button';

export const ArcadeGameCard = ({ game, record, onPlay }) => {
  const [imgError, setImgError] = useState(false);
  const Icon = game.icon;

  // Format personal best string
  const formatPersonalBest = () => {
    if (!record || !record.gamesPlayed) return 'Not played yet';

    switch (game.id) {
      case 'cascade':
        return record.bestScore ? `${record.bestScore.toLocaleString()} pts` : 'Not played yet';
      case 'sprint':
        return record.bestWpm ? `${record.bestWpm} WPM` : 'Not played yet';
      case 'hunter':
        return record.bestStreak ? `${record.bestStreak} streak` : 'Not played yet';
      case 'ninja':
        return record.bestSlices ? `${record.bestSlices} slashes` : 'Not played yet';
      case 'runner':
        return record.maxDistance ? `${record.maxDistance}m` : 'Not played yet';
      case 'memory':
        return record.deepestRound ? `Round ${record.deepestRound}` : 'Not played yet';
      case 'boss':
        return record.bossDefeated ? 'Victory!' : record.bestScore ? `${record.bestScore} pts` : 'Not played yet';
      default:
        return 'Not played yet';
    }
  };

  const bestValue = formatPersonalBest();
  const hasPlayed = record && record.gamesPlayed > 0;

  return (
    <div className="card-panel flex flex-col justify-between overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] transition-all duration-200 hover:-translate-y-1 hover:border-[var(--accent)] hover:shadow-xl group">
      {/* 16:9 Artwork Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-neutral-900 border-b border-[var(--border)]">
        {!imgError ? (
          <img
            src={game.image}
            alt={`${game.title} visual artwork`}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-neutral-900 to-neutral-950 text-center">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-2"
              style={{ backgroundColor: `${game.color}25`, color: game.color }}
            >
              <Icon className="w-6 h-6" />
            </div>
            <span className="font-mono text-xs text-[var(--text-muted)]">{game.title}</span>
          </div>
        )}

        {/* Overlay Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-black/75 backdrop-blur-xs border border-white/10 text-white shadow-sm">
            {game.badge}
          </span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-black/70 backdrop-blur-xs text-[var(--text-muted)] border border-white/10">
            {game.categoryLabel}
          </span>
        </div>
      </div>

      {/* Card Content Area */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          {/* Title & Icon Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors leading-tight">
                {game.title}
              </h3>
              <p className="text-[11px] font-mono text-[var(--text-muted)] mt-0.5">
                {game.subtitle}
              </p>
            </div>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${game.color}20`, color: game.color }}
            >
              <Icon className="w-4 h-4" />
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-3">
            {game.description}
          </p>

          {/* Mechanics Features List */}
          <div className="space-y-1 pt-1">
            {game.features.slice(0, 3).map((feat, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] truncate"
              >
                <Sparkles className="w-3 h-3 text-[var(--accent)] shrink-0 opacity-80" />
                <span className="truncate">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card Footer (Cleanly Aligned across all cards) */}
        <div className="pt-3 border-t border-[var(--border)] space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              {game.defaultMetricLabel}:
            </span>
            <span
              className={`font-semibold ${
                hasPlayed ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
              }`}
            >
              {bestValue}
            </span>
          </div>

          <Button
            variant="primary"
            size="sm"
            icon={Play}
            onClick={() => onPlay(game.id)}
            className="w-full justify-center shadow-xs"
          >
            Play {game.title}
          </Button>
        </div>
      </div>
    </div>
  );
};
