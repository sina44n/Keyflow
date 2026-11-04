/**
 * KEYFLOW My Rank Card
 * ====================
 * Section G from specification:
 * - Displays personal performance benchmark for authenticated users
 * - Displays conversion / sign-in call to action for visitors
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, User, ArrowRight, Zap, Target, LogIn } from 'lucide-react';

export const MyRankCard = ({ myRank, isAuthenticated, user, period }) => {
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl bg-gradient-to-r from-[var(--bg-surface)] to-[color-mix(in_srgb,var(--accent)_10%,var(--bg-surface))] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-14 h-14 rounded-2xl bg-[var(--accent)] text-white flex items-center justify-center shrink-0 shadow-lg">
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] font-mono">
                Join the Global Leaderboard
              </h3>
              <p className="mt-1 text-xs text-[var(--text-secondary)] font-mono max-w-xl">
                Sign in or register to record your authentic typing speed, unlock permanent telemetry metrics, and compete with precision typists worldwide.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white font-mono text-xs font-bold hover:bg-[var(--accent-hover)] transition-all shadow-md cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In / Register</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/workstation')}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)] font-mono text-xs font-semibold transition-all cursor-pointer"
            >
              <span>Try as Guest</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated user ranked
  if (myRank && myRank.ranked) {
    return (
      <div className="rounded-2xl bg-[var(--bg-surface)] border-2 border-[var(--accent)] p-6 sm:p-8 shadow-[0_4px_25px_color-mix(in_srgb,var(--accent)_15%,transparent)]">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[color-mix(in_srgb,var(--accent)_70%,black)] text-white flex items-center justify-center shrink-0 font-mono font-black text-xl shadow-md">
              #{myRank.rank}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-base font-bold text-[var(--text-primary)] font-mono">
                  Your Current Standing: Rank #{myRank.rank} of {myRank.total_competitors}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 font-mono text-[11px] font-bold">
                  Top {Math.max(1, Math.round(100 - myRank.percentile + 1))}%
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--text-secondary)] font-mono">
                {myRank.message || `Best recorded performance for ${period === 'all_time' ? 'all-time history' : period}.`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
            <div className="flex items-center gap-4 p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
              <div>
                <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Your Best</p>
                <p className="text-sm font-mono font-extrabold text-[var(--accent)]">
                  {myRank.net_wpm ? myRank.net_wpm.toFixed(1) : '--'} WPM
                </p>
              </div>
              <div className="border-l border-[var(--border)] pl-4">
                <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Accuracy</p>
                <p className="text-sm font-mono font-bold text-[var(--text-primary)]">
                  {myRank.accuracy ? `${myRank.accuracy.toFixed(1)}%` : '--'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/workstation')}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white font-mono text-xs font-bold hover:bg-[var(--accent-hover)] transition-all shadow-md cursor-pointer shrink-0"
            >
              <Zap className="w-4 h-4" />
              <span>Beat Your Score</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated user unranked for this period
  return (
    <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)] flex items-center justify-center shrink-0 font-mono font-bold">
            ?
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)] font-mono">
              You are not yet ranked for {period === 'all_time' ? 'all-time' : thisPeriodLabel(period)}
            </h3>
            <p className="mt-1 text-xs text-[var(--text-secondary)] font-mono max-w-lg">
              Complete a 15s, 30s, or 60s typing test on the Workstation to log your speed and join the global leaderboard.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/workstation')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white font-mono text-xs font-bold hover:bg-[var(--accent-hover)] transition-all shadow-md cursor-pointer shrink-0"
        >
          <Zap className="w-4 h-4" />
          <span>Start Practice Test</span>
        </button>
      </div>
    </div>
  );
};

function thisPeriodLabel(p) {
  if (p === 'daily') return 'today';
  if (p === 'weekly') return 'this week';
  if (p === 'monthly') return 'this month';
  return 'this period';
}

