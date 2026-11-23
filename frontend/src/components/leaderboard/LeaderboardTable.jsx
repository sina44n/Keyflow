/**
 * KEYFLOW Leaderboard Table Component
 * ===================================
 * Premium Angular Outline Leaderboard Redesign matching Reference Image 2:
 * - Individual outlined ranking rows: Every participant occupies an independent row
 *   with its own complete, thin outline border and subtle vertical spacing.
 * - Distinctive angular geometry: Clean slanted edges (-12deg skewX) with counter-skewed
 *   content (12deg skewX), preserving complete border continuity around all corners.
 * - Dynamic rank-based styling:
 *   - Rank 1: Gold / Yellow thin angular outline, gold rank number, warm accent.
 *   - Rank 2: Silver / Cool Blue thin angular outline, blue rank number.
 *   - Rank 3: Bronze / Orange thin angular outline, bronze rank number.
 *   - Rank 4+: Neutral subtle outline with muted rank number and clean white/light background.
 * - Current-user highlight: Identifies authenticated user with YOU badge and subtle tint
 *   without overriding top-three rank colors.
 * - Preserves existing Google profile photos, fallback initial avatars, and all telemetry metrics:
 *   Net WPM, Gross WPM, Accuracy, Sessions, Best Test, Achieved.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Clock, ArrowRight, UserCheck } from 'lucide-react';
import { LeaderboardAvatar } from './LeaderboardAvatar';

export const LeaderboardTable = ({ entries, currentUserId, currentUsername, period }) => {
  const navigate = useNavigate();

  const getRankStyle = (rank, isCurrentUser) => {
    if (rank === 1) {
      return {
        borderClass: 'border-amber-400/90',
        bgClass: isCurrentUser
          ? 'bg-[color-mix(in_srgb,var(--bg-card)_85%,#F59E0B)] ring-1 ring-amber-400/50'
          : 'bg-[color-mix(in_srgb,var(--bg-card)_92%,#F59E0B)]',
        shadowClass: 'shadow-[0_2px_12px_rgba(245,158,11,0.08)]',
        rankText: 'text-amber-500 font-black italic',
        netWpm: 'text-amber-600',
        hoverBorder: 'hover:border-amber-500',
      };
    }
    if (rank === 2) {
      return {
        borderClass: 'border-sky-400/90',
        bgClass: isCurrentUser
          ? 'bg-[color-mix(in_srgb,var(--bg-card)_85%,#38BDF8)] ring-1 ring-sky-400/50'
          : 'bg-[color-mix(in_srgb,var(--bg-card)_92%,#38BDF8)]',
        shadowClass: 'shadow-[0_2px_12px_rgba(56,189,248,0.08)]',
        rankText: 'text-sky-500 font-black italic',
        netWpm: 'text-sky-600',
        hoverBorder: 'hover:border-sky-500',
      };
    }
    if (rank === 3) {
      return {
        borderClass: 'border-orange-400/90',
        bgClass: isCurrentUser
          ? 'bg-[color-mix(in_srgb,var(--bg-card)_85%,#FB923C)] ring-1 ring-orange-400/50'
          : 'bg-[color-mix(in_srgb,var(--bg-card)_92%,#FB923C)]',
        shadowClass: 'shadow-[0_2px_12px_rgba(249,115,22,0.08)]',
        rankText: 'text-orange-500 font-black italic',
        netWpm: 'text-orange-600',
        hoverBorder: 'hover:border-orange-500',
      };
    }
    return {
      borderClass: isCurrentUser
        ? 'border-[var(--accent)] ring-1 ring-[var(--accent)]/30'
        : 'border-[var(--border)]',
      bgClass: isCurrentUser
        ? 'bg-[var(--bg-elevated)]'
        : 'bg-[var(--bg-card)]',
      shadowClass: 'shadow-[0_1px_3px_rgba(0,0,0,0.03)]',
      rankText: 'text-[var(--text-muted)] font-black italic',
      netWpm: 'text-[var(--accent)]',
      hoverBorder: 'hover:border-[var(--accent)]/50',
    };
  };

  const getAccuracyBadge = (acc) => {
    let colorClasses =
      'bg-emerald-500/10 text-emerald-600 border-emerald-500/25';
    if (acc < 95 && acc >= 90) {
      colorClasses =
        'bg-sky-500/10 text-sky-600 border-sky-500/25';
    } else if (acc < 90) {
      colorClasses =
        'bg-amber-500/10 text-amber-600 border-amber-500/25';
    }
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-mono font-bold ${colorClasses}`}
      >
        {acc.toFixed(1)}%
      </span>
    );
  };

  if (!entries || entries.length === 0) {
    return (
      <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] p-12 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] flex items-center justify-center text-[var(--accent)] mb-4">
          <Trophy className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-[var(--text-primary)] font-mono">
          No Typists Ranked for this Filter Yet
        </h3>
        <p className="mt-2 text-sm text-[var(--text-secondary)] font-mono max-w-md mx-auto">
          Be the pioneer to establish the benchmark! Complete a session on the Workstation and claim the #1 spot on the global leaderboard.
        </p>
        <button
          type="button"
          onClick={() => navigate('/workstation')}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-[var(--accent-fg)] font-mono text-xs font-bold hover:bg-[var(--accent-hover)] transition-all shadow-md cursor-pointer"
        >
          <span>Launch Workstation</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <section className="pt-12 scroll-mt-28" aria-label="Global Rankings">
      {/* Responsive Horizontal Scroll Wrapper (preserves layout on mobile/tablet) */}
      <div className="overflow-x-auto pb-3 pt-1">
        <div className="min-w-[760px] space-y-2.5">
          {/* Column Header Alignment Row */}
          <div className="flex items-center mx-3.5 px-6 py-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] select-none">
            <div className="w-[280px] lg:w-[320px] flex items-center gap-4 shrink-0">
              <span className="w-7 text-center">Rank</span>
              <span>Player</span>
            </div>
            <div className="w-24 text-right shrink-0">Net WPM</div>
            <div className="w-20 text-right shrink-0">Gross WPM</div>
            <div className="w-24 text-center shrink-0">Accuracy</div>
            <div className="w-20 text-center shrink-0">Sessions</div>
            <div className="w-20 text-center shrink-0">Best Test</div>
            <div className="w-28 text-right shrink-0">Achieved</div>
          </div>

          {/* Individual Angular Outlined Ranking Rows */}
          {entries.map((entry) => {
            const isCurrentUser = Boolean(
              (currentUserId && entry.user_id === currentUserId) ||
              (currentUsername && entry.username === currentUsername)
            );
            const style = getRankStyle(entry.rank, isCurrentUser);

            return (
              <div
                key={entry.user_id}
                className={`relative mx-3.5 transition-all duration-200 ease-out rounded-[6px] border ${style.borderClass} ${style.bgClass} ${style.shadowClass} ${style.hoverBorder} hover:-translate-y-0.5 hover:shadow-md focus-within:ring-2 focus-within:ring-[var(--accent)]`}
                style={{
                  transform: 'skewX(-12deg)',
                  transformOrigin: 'center center',
                }}
              >
                {/* Counter-skew inner container to keep all typography, avatars, and badges upright */}
                <div
                  className="flex items-center px-6 py-2.5 sm:py-3 w-full"
                  style={{
                    transform: 'skewX(12deg)',
                    transformOrigin: 'center center',
                  }}
                >
                  {/* Left Section: Rank + Avatar + Name + Handle */}
                  <div className="w-[280px] lg:w-[320px] flex items-center gap-4 min-w-0 shrink-0">
                    {/* Rank Number (Italicized, Bold, Color-Coded) */}
                    <span
                      className={`w-7 text-center font-mono font-black italic text-lg sm:text-xl select-none shrink-0 ${style.rankText}`}
                    >
                      {entry.rank}
                    </span>

                    {/* Circular Avatar */}
                    <LeaderboardAvatar
                      src={entry.avatar_url}
                      name={entry.display_name || entry.username}
                      userId={entry.user_id || entry.username}
                      size="table"
                    />

                    {/* Name & Handle */}
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="font-bold text-[var(--text-primary)] text-xs sm:text-sm truncate max-w-[130px] sm:max-w-[170px]"
                          title={entry.display_name}
                        >
                          {entry.display_name || entry.username}
                        </span>
                        {isCurrentUser && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-[var(--accent)] text-[var(--accent-fg)] text-[9px] font-bold shrink-0">
                            <UserCheck className="w-2.5 h-2.5" />
                            <span>YOU</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] font-mono truncate">
                        @{entry.username}
                      </p>
                    </div>
                  </div>

                  {/* Net WPM */}
                  <div className="w-24 text-right shrink-0">
                    <span className={`font-mono font-black text-sm sm:text-base ${style.netWpm}`}>
                      {entry.net_wpm.toFixed(1)}
                    </span>
                  </div>

                  {/* Gross WPM */}
                  <div className="w-20 text-right text-[var(--text-secondary)] font-mono text-xs sm:text-sm font-semibold shrink-0">
                    {entry.gross_wpm.toFixed(1)}
                  </div>

                  {/* Accuracy Badge */}
                  <div className="w-24 text-center shrink-0">
                    {getAccuracyBadge(entry.accuracy)}
                  </div>

                  {/* Sessions Count */}
                  <div className="w-20 text-center text-[var(--text-secondary)] font-mono text-xs sm:text-sm shrink-0">
                    {entry.sessions_count}
                  </div>

                  {/* Best Test Duration */}
                  <div className="w-20 text-center shrink-0">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--bg-elevated)] border border-[var(--border)] text-[11px] font-mono text-[var(--text-secondary)]">
                      <Clock className="w-3 h-3" />
                      <span>{entry.duration_seconds || 15}s</span>
                    </span>
                  </div>

                  {/* Achieved Date */}
                  <div className="w-28 text-right text-[var(--text-muted)] font-mono text-[11px] whitespace-nowrap shrink-0">
                    {new Date(entry.achieved_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LeaderboardTable;
