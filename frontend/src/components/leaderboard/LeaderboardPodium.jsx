/**
 * KEYFLOW Leaderboard Podium Cards
 * =================================
 * Displays the Top 3 typists of the selected cohort with gold, silver, and bronze accents.
 * Directly mirrors the structural design of the reference interface:
 * - Prominent Rank #1 gold border card with champion ribbon & medal
 * - Silver Rank #2 and Bronze Rank #3 cards
 * - Detailed performance metrics: Net WPM, Sessions, Accuracy, Overall Score
 * - Graceful placeholder cards when positions are awaiting competitors
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Medal, Crown, Zap, Target, BookOpen, Sparkles, Trophy } from 'lucide-react';

export const LeaderboardPodium = ({ topThree, category, period }) => {
  const navigate = useNavigate();

  const rankConfigs = [
    {
      rank: 1,
      title: 'Champion',
      borderClass: 'border-2 border-amber-400/80 dark:border-amber-400/90 shadow-[0_0_30px_rgba(251,191,36,0.18)]',
      badgeBg: 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black',
      ribbonBg: 'from-amber-400 to-amber-600',
      icon: Crown,
      medalColor: 'text-amber-400',
    },
    {
      rank: 2,
      title: '2nd Place',
      borderClass: 'border border-slate-300/60 dark:border-slate-500/40 shadow-[0_0_20px_rgba(203,213,225,0.12)]',
      badgeBg: 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-950 font-black',
      ribbonBg: 'from-slate-200 to-slate-400',
      icon: Medal,
      medalColor: 'text-slate-300',
    },
    {
      rank: 3,
      title: '3rd Place',
      borderClass: 'border border-amber-700/50 dark:border-amber-700/60 shadow-[0_0_20px_rgba(180,83,9,0.12)]',
      badgeBg: 'bg-gradient-to-br from-amber-600 to-amber-800 text-white font-black',
      ribbonBg: 'from-amber-600 to-amber-800',
      icon: Medal,
      medalColor: 'text-amber-600',
    },
  ];

  const getInitials = (name) => {
    if (!name) return 'KF';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {rankConfigs.map((config, idx) => {
        const player = topThree && topThree[idx] ? topThree[idx] : null;
        const Icon = config.icon;

        if (!player) {
          return (
            <div
              key={config.rank}
              className={`relative overflow-hidden rounded-2xl bg-[var(--bg-surface)] border border-dashed border-[var(--border)] p-6 flex flex-col justify-between transition-all duration-200 ${
                config.rank === 1 ? 'md:order-1' : config.rank === 2 ? 'md:order-0' : 'md:order-2'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center font-mono font-bold text-sm text-[var(--text-muted)]">
                    #{config.rank}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] font-mono">
                      Awaiting Contender
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] font-mono">
                      Podium Slot #{config.rank}
                    </p>
                  </div>
                </div>
                <div className={`w-8 h-8 rounded-full ${config.badgeBg} flex items-center justify-center shadow-sm`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="my-6 py-4 px-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-center">
                <p className="text-xs text-[var(--text-secondary)] font-mono">
                  No verified typist has claimed #{config.rank} for {period === 'all_time' ? 'all-time' : period} yet.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/workstation')}
                className="w-full py-2.5 px-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--accent)] text-xs font-mono font-semibold text-[var(--text-primary)] hover:text-[var(--accent)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Claim #{config.rank} Now</span>
              </button>
            </div>
          );
        }

        return (
          <div
            key={config.rank}
            className={`relative overflow-hidden rounded-2xl bg-[var(--bg-surface)] p-6 transition-all duration-300 hover:-translate-y-1 ${config.borderClass} ${
              config.rank === 1 ? 'md:order-1' : config.rank === 2 ? 'md:order-0' : 'md:order-2'
            }`}
          >
            {/* Top Row: Avatar, Names, and Medal */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                {/* Avatar with Rank Badge */}
                <div className="relative">
                  {player.avatar_url ? (
                    <img
                      src={player.avatar_url}
                      alt={player.display_name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-[var(--border)] shadow-md"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--bg-elevated)] to-[color-mix(in_srgb,var(--accent)_20%,transparent)] border border-[var(--border)] flex items-center justify-center font-mono font-extrabold text-base text-[var(--accent)] shadow-md">
                      {getInitials(player.display_name || player.username)}
                    </div>
                  )}
                  <span
                    className={`absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-lg ${config.badgeBg} flex items-center justify-center text-xs shadow-md border border-[var(--bg-surface)]`}
                  >
                    {config.rank}
                  </span>
                </div>

                <div className="min-w-0">
                  <h3 className="font-bold text-base text-[var(--text-primary)] truncate" title={player.display_name}>
                    {player.display_name || player.username}
                  </h3>
                  <p className="text-xs font-mono text-[var(--text-muted)] truncate">
                    @{player.username}
                  </p>
                </div>
              </div>

              {/* Champion Ribbon / Medal on Rank 1 */}
              <div className="shrink-0 flex flex-col items-center">
                {config.rank === 1 ? (
                  <div className="relative flex flex-col items-center">
                    {/* Ribbon tails */}
                    <div className="flex gap-1 -mb-1">
                      <div className="w-1.5 h-4 bg-red-600 rotate-12 rounded-t" />
                      <div className="w-1.5 h-4 bg-blue-600 -rotate-12 rounded-t" />
                    </div>
                    {/* Gold Medal Disc */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 p-0.5 shadow-[0_0_15px_rgba(251,191,36,0.5)] flex items-center justify-center">
                      <div className="w-full h-full rounded-full border border-amber-200/50 flex items-center justify-center font-mono font-black text-amber-950 text-sm">
                        1
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`w-9 h-9 rounded-full ${config.badgeBg} flex items-center justify-center shadow-md`}>
                    <Icon className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>

            {/* Performance Metrics Triad */}
            <div className="mt-6 grid grid-cols-3 gap-2 p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-center">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                  Net WPM
                </p>
                <p className="mt-1 font-mono font-extrabold text-lg text-[var(--accent)]">
                  {player.net_wpm.toFixed(1)}
                </p>
              </div>
              <div className="border-x border-[var(--border)] px-1">
                <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                  Accuracy
                </p>
                <p className="mt-1 font-mono font-bold text-lg text-[var(--text-primary)]">
                  {player.accuracy.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                  {category === 'overall' ? 'Score' : 'Sessions'}
                </p>
                <p className="mt-1 font-mono font-bold text-lg text-[var(--text-primary)]">
                  {category === 'overall' ? player.score.toFixed(1) : player.sessions_count}
                </p>
              </div>
            </div>

            {/* Footer badges: Test duration & achieved date */}
            <div className="mt-4 flex items-center justify-between text-xs font-mono text-[var(--text-secondary)]">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)] font-semibold">
                <Zap className="w-3 h-3" />
                {player.duration_seconds}s test
              </span>
              <span className="text-[var(--text-muted)]">
                {new Date(player.achieved_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

