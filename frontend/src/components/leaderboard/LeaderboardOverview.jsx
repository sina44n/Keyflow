/**
 * KEYFLOW Leaderboard Overview Cards
 * ===================================
 * Visual summary of global platform typing telemetry:
 * 1. Total Registered Typists
 * 2. Active Competitors in Cohort
 * 3. Top Typing Speed + User
 * 4. Remaining Season Time or Average Platform Accuracy
 */

import React from 'react';
import { Users, Target, Zap, Flame, TrendingUp, Clock } from 'lucide-react';

export const LeaderboardOverview = ({ stats, period }) => {
  const hasStats = Boolean(stats);
  const {
    registered_typists = null,
    active_competitors = null,
    top_speed = null,
    top_speed_user = null,
    avg_accuracy = null,
    period_time_remaining = null,
  } = stats || {};

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Total Registered Typists */}
      <div className="relative overflow-hidden rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] p-5 transition-all duration-200 hover:border-[color-mix(in_srgb,var(--accent)_50%,transparent)] hover:shadow-[0_4px_20px_color-mix(in_srgb,var(--accent)_10%,transparent)] group">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-mono font-medium text-[var(--text-muted)] uppercase tracking-wider">
              Total Registered
            </p>
            <p className="mt-2 text-3xl font-extrabold font-mono text-[var(--text-primary)] tracking-tight">
              {hasStats && registered_typists !== null ? registered_typists.toLocaleString() : '--'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] flex items-center justify-center text-[var(--accent)] transition-transform group-hover:scale-105">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <p className="mt-3 text-xs text-[var(--text-secondary)] font-mono flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${hasStats ? 'bg-emerald-500 animate-pulse' : 'bg-[var(--text-muted)]'}`} />
          {hasStats ? 'Verified account holders' : 'Awaiting live telemetry'}
        </p>
      </div>

      {/* Card 2: Active Competitors */}
      <div className="relative overflow-hidden rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] p-5 transition-all duration-200 hover:border-[color-mix(in_srgb,var(--accent)_50%,transparent)] hover:shadow-[0_4px_20px_color-mix(in_srgb,var(--accent)_10%,transparent)] group">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-mono font-medium text-[var(--text-muted)] uppercase tracking-wider">
              Total Participated
            </p>
            <p className="mt-2 text-3xl font-extrabold font-mono text-[var(--text-primary)] tracking-tight">
              {hasStats && active_competitors !== null ? active_competitors.toLocaleString() : '--'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] flex items-center justify-center text-[var(--accent)] transition-transform group-hover:scale-105">
            <Target className="w-5 h-5" />
          </div>
        </div>
        <p className="mt-3 text-xs text-[var(--text-secondary)] font-mono">
          Ranked in {period === 'all_time' ? 'all-time history' : `${period} period`}
        </p>
      </div>

      {/* Card 3: Top Typing Speed */}
      <div className="relative overflow-hidden rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] p-5 transition-all duration-200 hover:border-[color-mix(in_srgb,var(--accent)_50%,transparent)] hover:shadow-[0_4px_20px_color-mix(in_srgb,var(--accent)_10%,transparent)] group">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-mono font-medium text-[var(--text-muted)] uppercase tracking-wider">
              Top Typing Speed
            </p>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold font-mono text-[var(--accent)] tracking-tight">
                {hasStats && top_speed && top_speed > 0 ? top_speed.toFixed(1) : '--'}
              </span>
              <span className="text-xs font-mono text-[var(--text-muted)] font-semibold">WPM</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] flex items-center justify-center text-[var(--accent)] transition-transform group-hover:scale-105">
            <Zap className="w-5 h-5" />
          </div>
        </div>
        <p className="mt-3 text-xs text-[var(--text-secondary)] font-mono truncate">
          {top_speed_user ? (
            <span>Record by <strong className="text-[var(--text-primary)]">@{top_speed_user}</strong></span>
          ) : (
            <span>Awaiting first benchmark</span>
          )}
        </p>
      </div>

      {/* Card 4: Remaining Time or Platform Accuracy */}
      <div className="relative overflow-hidden rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] p-5 transition-all duration-200 hover:border-[color-mix(in_srgb,var(--accent)_50%,transparent)] hover:shadow-[0_4px_20px_color-mix(in_srgb,var(--accent)_10%,transparent)] group">
        {period_time_remaining ? (
          <>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-mono font-medium text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                  Remaining time for completion
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                </p>
                <div className="mt-2 flex items-center gap-1.5 font-mono text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
                  <span>{period_time_remaining.formatted || `${period_time_remaining.hours}h ${period_time_remaining.minutes}m`}</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] flex items-center justify-center text-[var(--accent)] transition-transform group-hover:scale-105">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
              <span>{period_time_remaining.days > 0 ? 'Days : Hrs : Mins' : 'Hrs : Mins : Secs'}</span>
              <span className="text-[var(--accent)] font-medium">Top 3 win podium</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-mono font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  Platform Accuracy
                </p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold font-mono text-[var(--text-primary)] tracking-tight">
                    {hasStats && avg_accuracy && avg_accuracy > 0 ? `${avg_accuracy.toFixed(1)}%` : '--'}
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] flex items-center justify-center text-[var(--accent)] transition-transform group-hover:scale-105">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <p className="mt-3 text-xs text-[var(--text-secondary)] font-mono">
              Mean accuracy across all qualifying tests
            </p>
          </>
        )}
      </div>
    </div>
  );
};

