/**
 * KEYFLOW Leaderboard Filter Controls
 * ====================================
 * Precision layout directly matching MasterTyper Reference Image 4:
 * 1. ROW 1 (Centered): Scope navigation: Global | Weekly | Competitions
 * 2. ROW 2 (Centered): Duration selection: 15s | 30s | 60s | 120s
 * 3. Subordinate Secondary Control Bar: Ranking metrics (Speed | Accuracy | Overall),
 *    Historical periods (Daily | Weekly | Monthly | All Time), Live Timer & Refresh
 * 4. Ranking Formula Explainer Banner directly matching Reference Image 4
 * 5. Strict removal of Continent, Language, and oversized toolbar containers
 */

import React from 'react';
import {
  Zap,
  Target,
  Award,
  RotateCw,
  Globe,
  Calendar,
  Trophy,
  Clock,
} from 'lucide-react';

export const LeaderboardFilters = ({
  scope,
  setScope,
  period,
  setPeriod,
  category,
  setCategory,
  duration,
  setDuration,
  isLoading,
  onRefresh,
  timeRemaining,
}) => {
  const scopes = [
    { id: 'global', label: 'Global', icon: Globe },
    { id: 'weekly', label: 'Weekly', icon: Calendar },
    { id: 'competitions', label: 'Competitions', icon: Trophy },
  ];

  const durations = [
    { id: '15', label: '15s' },
    { id: '30', label: '30s' },
    { id: '60', label: '60s' },
    { id: '120', label: '120s' },
  ];

  const categories = [
    { id: 'speed', label: 'Speed Ranking', icon: Zap },
    { id: 'accuracy', label: 'Accuracy Ranking', icon: Target },
    { id: 'overall', label: 'Overall Ranking', icon: Award },
  ];

  const periods = [
    { id: 'daily', label: 'Daily' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'all_time', label: 'All Time' },
  ];

  return (
    <div className="space-y-4 max-w-4xl mx-auto w-full">
      {/* ROW 1 — Centered Scope Navigation (Reference Image 4) */}
      <div className="flex items-center justify-center">
        <div className="inline-flex items-center p-1.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-xs">
          {scopes.map((s) => {
            const Icon = s.icon;
            const isActive = scope === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setScope(s.id)}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-mono font-bold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[var(--accent)] text-[var(--accent-fg)] shadow-[0_2px_10px_color-mix(in_srgb,var(--accent)_30%,transparent)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[color-mix(in_srgb,var(--bg-elevated)_60%,transparent)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ROW 2 — Centered Test Duration Selector: 15s | 30s | 60s | 120s (Reference Image 4) */}
      <div className="flex items-center justify-center">
        <div className="inline-flex items-center p-1 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-xs">
          {durations.map((d) => {
            const isActive = String(duration) === String(d.id);
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setDuration(d.id)}
                className={`px-4 sm:px-5 py-1.5 rounded-lg text-xs sm:text-sm font-mono font-bold transition-all duration-180 cursor-pointer ${
                  isActive
                    ? 'bg-[var(--accent)] text-[var(--accent-fg)] shadow-xs scale-102'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[color-mix(in_srgb,var(--bg-elevated)_50%,transparent)]'
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Subordinate Secondary Control Bar: Ranking Metrics, Periods, Timer & Refresh */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        {/* Metric Selector (Speed / Accuracy / Overall) */}
        <div className="flex items-center p-1 bg-[var(--bg-surface)] border border-[var(--border-subtle,var(--border))] rounded-xl text-xs font-mono">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-bold shadow-2xs border border-[var(--border)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
              >
                <Icon className={`w-3 h-3 ${isActive ? 'text-[var(--accent)]' : ''}`} />
                <span className="hidden sm:inline">{cat.label}</span>
                <span className="sm:hidden">{cat.id.toUpperCase()}</span>
              </button>
            );
          })}
        </div>

        {/* Historical Period (when scope is Global), Timer & Refresh */}
        <div className="flex items-center gap-2">
          {scope === 'global' && (
            <div className="flex items-center p-1 bg-[var(--bg-surface)] border border-[var(--border-subtle,var(--border))] rounded-xl text-xs font-mono">
              {periods.map((p) => {
                const isActive = period === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPeriod(p.id)}
                    className={`px-2.5 py-1 rounded-md transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-bold shadow-2xs border border-[var(--border)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          )}

          {timeRemaining?.formatted && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] border border-[color-mix(in_srgb,var(--accent)_25%,transparent)] text-xs font-mono text-[var(--accent)] font-bold">
              <Clock className="w-3 h-3 shrink-0" />
              <span>{timeRemaining.formatted}</span>
            </div>
          )}

          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh live telemetry"
            aria-label="Refresh rankings"
            className="p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all cursor-pointer disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[var(--accent)]' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardFilters;
