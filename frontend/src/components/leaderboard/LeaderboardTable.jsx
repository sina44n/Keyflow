/**
 * KEYFLOW Leaderboard Table Component
 * ===================================
 * Redesigned Global Ranking Table matching Reference Image 4:
 * - Columns: Rank, Player, Net WPM, Gross WPM, Accuracy %, Sessions, Best Test, Achieved Date
 * - Gold (#1), Silver (#2), and Bronze (#3) rank badges
 * - Player avatar, display name, handle, and "You" badge for authenticated user
 * - Responsive table wrapper with smooth horizontal scroll on mobile
 * - Theme-compliant styling (Burgundy & Cream / 12-theme architecture)
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Medal, Zap, Target, Clock, ArrowRight, UserCheck } from 'lucide-react';

export const LeaderboardTable = ({ entries, currentUserId, currentUsername, period }) => {
  const navigate = useNavigate();

  const getInitials = (name) => {
    if (!name) return 'KF';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
          1
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-200 to-slate-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
          2
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-600 to-amber-800 text-white font-black text-xs flex items-center justify-center shadow-md">
          3
        </div>
      );
    }
    return (
      <span className="w-7 text-center font-mono font-bold text-xs text-[var(--text-muted)]">
        #{rank}
      </span>
    );
  };

  const getAccuracyBadge = (acc) => {
    let colorClasses = 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    if (acc < 95 && acc >= 90) {
      colorClasses = 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30';
    } else if (acc < 90) {
      colorClasses = 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-mono font-bold ${colorClasses}`}>
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
    <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] overflow-hidden shadow-sm">
      {/* Table Header Summary */}
      <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Trophy className="w-4 h-4 text-[var(--accent)]" />
          <h3 className="font-mono text-sm font-semibold text-[var(--text-primary)]">
            Global Rankings ({entries.length} Typist{entries.length === 1 ? '' : 's'})
          </h3>
        </div>
        <span className="text-xs font-mono text-[var(--text-muted)]">
          {period === 'all_time' ? 'All-Time Records' : `${period} Cohort`}
        </span>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg-elevated)] text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
              <th className="py-3 px-4 w-14 text-center">Rank</th>
              <th className="py-3 px-4">Player</th>
              <th className="py-3 px-4 text-right">Net WPM</th>
              <th className="py-3 px-4 text-right">Gross WPM</th>
              <th className="py-3 px-4 text-center">Accuracy</th>
              <th className="py-3 px-4 text-center">Sessions</th>
              <th className="py-3 px-4 text-center">Best Test</th>
              <th className="py-3 px-4 text-right">Achieved</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] font-mono text-xs">
            {entries.map((entry) => {
              const isCurrentUser =
                (currentUserId && entry.user_id === currentUserId) ||
                (currentUsername && entry.username === currentUsername);

              return (
                <tr
                  key={entry.user_id}
                  className={`transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--accent)_6%,var(--bg-surface))] ${
                    isCurrentUser ? 'bg-[color-mix(in_srgb,var(--accent)_12%,var(--bg-surface))]' : ''
                  }`}
                >
                  {/* Rank */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center">
                      {getRankBadge(entry.rank)}
                    </div>
                  </td>

                  {/* Player */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      {entry.avatar_url ? (
                        <img
                          src={entry.avatar_url}
                          alt={entry.display_name}
                          className="w-9 h-9 rounded-xl object-cover border border-[var(--border)] shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center font-mono font-bold text-xs text-[var(--accent)] shrink-0">
                          {getInitials(entry.display_name || entry.username)}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="font-bold text-[var(--text-primary)] truncate max-w-[140px] sm:max-w-[200px]"
                            title={entry.display_name}
                          >
                            {entry.display_name || entry.username}
                          </span>
                          {isCurrentUser && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-[var(--accent)] text-[var(--accent-fg)] text-[9px] font-bold">
                              <UserCheck className="w-2.5 h-2.5" />
                              <span>YOU</span>
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)] truncate">
                          @{entry.username}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Net WPM */}
                  <td className="py-3.5 px-4 text-right">
                    <span className="font-extrabold text-sm text-[var(--accent)]">
                      {entry.net_wpm.toFixed(1)}
                    </span>
                  </td>

                  {/* Gross WPM */}
                  <td className="py-3.5 px-4 text-right text-[var(--text-secondary)]">
                    {entry.gross_wpm.toFixed(1)}
                  </td>

                  {/* Accuracy */}
                  <td className="py-3.5 px-4 text-center">
                    {getAccuracyBadge(entry.accuracy)}
                  </td>

                  {/* Sessions */}
                  <td className="py-3.5 px-4 text-center text-[var(--text-secondary)]">
                    {entry.sessions_count}
                  </td>

                  {/* Best Test Duration */}
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--bg-elevated)] border border-[var(--border)] text-[11px] text-[var(--text-secondary)]">
                      <Clock className="w-3 h-3" />
                      <span>{entry.duration_seconds}s</span>
                    </span>
                  </td>

                  {/* Achieved Date */}
                  <td className="py-3.5 px-4 text-right text-[var(--text-muted)] text-[11px] whitespace-nowrap">
                    {new Date(entry.achieved_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaderboardTable;
