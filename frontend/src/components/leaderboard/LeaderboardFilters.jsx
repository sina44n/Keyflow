/**
 * KEYFLOW Leaderboard Filter Controls
 * ====================================
 * Allows typists to filter rankings by:
 * - Period: Daily, Weekly, Monthly, All Time
 * - Category: Speed Ranking, Accuracy Ranking, Overall Ranking
 */

import React from 'react';
import { Zap, Target, Award, RotateCw } from 'lucide-react';

export const LeaderboardFilters = ({
  period,
  setPeriod,
  category,
  setCategory,
  isLoading,
  onRefresh,
}) => {
  const periods = [
    { id: 'daily', label: 'Daily' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'all_time', label: 'All Time' },
  ];

  const categories = [
    { id: 'speed', label: 'Speed Ranking', icon: Zap },
    { id: 'accuracy', label: 'Accuracy Ranking', icon: Target },
    { id: 'overall', label: 'Overall Ranking', icon: Award },
  ];

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl">
      {/* Category Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto p-1 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border)]">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = category === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono font-medium whitespace-nowrap transition-all duration-240 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer ${
                isActive
                  ? 'bg-[var(--accent)] text-white shadow-[0_2px_10px_color-mix(in_srgb,var(--accent)_30%,transparent)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[color-mix(in_srgb,var(--bg-surface)_60%,transparent)]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Period Tabs & Refresh */}
      <div className="flex items-center justify-between md:justify-end gap-2">
        <div className="flex items-center gap-1 p-1 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border)]">
          {periods.map((p) => {
            const isActive = period === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all duration-240 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer ${
                  isActive
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[color-mix(in_srgb,var(--accent)_40%,transparent)] shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          title="Refresh rankings"
          aria-label="Refresh rankings"
          className="p-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all cursor-pointer disabled:opacity-50"
        >
          <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[var(--accent)]' : ''}`} />
        </button>
      </div>
    </div>
  );
};

