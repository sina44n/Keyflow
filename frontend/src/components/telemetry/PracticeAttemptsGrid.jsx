import React, { useMemo } from 'react';
import { RotateCcw } from 'lucide-react';
import { filterSessions } from '../../utils/telemetryStorage.js';

export const PracticeAttemptsGrid = ({ todaySessions, weekSessions, sessions = [] }) => {
  const effectiveToday = useMemo(() => {
    if (Array.isArray(todaySessions)) return todaySessions;
    return filterSessions(sessions, 'today').current || [];
  }, [todaySessions, sessions]);

  const effectiveWeek = useMemo(() => {
    if (Array.isArray(weekSessions)) return weekSessions;
    return filterSessions(sessions, 'weekly').current || [];
  }, [weekSessions, sessions]);

  const renderAttemptGrid = (sessList, totalSlots = 70) => {
    // 7 rows x 10 columns = 70 slots
    const slots = [];
    for (let i = 0; i < totalSlots; i++) {
      const sess = sessList[i];
      if (sess) {
        let colorClass = 'bg-emerald-500 hover:scale-125';
        let title = `Sprint #${i + 1}: Passed • ${sess.wpm} WPM • ${sess.accuracy}%`;
        if (sess.status === 'failed') {
          colorClass = 'bg-rose-500 hover:scale-125';
          title = `Sprint #${i + 1}: Failed • ${sess.wpm} WPM • ${sess.accuracy}%`;
        } else if (sess.status === 'partial') {
          colorClass = 'bg-amber-500 hover:scale-125';
          title = `Sprint #${i + 1}: Partial Attempt`;
        }
        slots.push(
          <div
            key={i}
            className={`w-3 h-3 rounded-xs transition-all duration-200 cursor-pointer shadow-xs ${colorClass}`}
            title={title}
          />
        );
      } else {
        slots.push(
          <div
            key={i}
            className="w-3 h-3 rounded-xs bg-[var(--bg-elevated)] border border-[color-mix(in_srgb,var(--border)_50%,transparent)]"
          />
        );
      }
    }

    return (
      <div className="grid grid-flow-col grid-rows-7 gap-1.5 p-3 rounded-xl bg-[var(--bg-elevated)]/60 border border-[var(--border)] overflow-x-auto">
        {slots}
      </div>
    );
  };

  const todayPassed = effectiveToday.filter((s) => s.status === 'passed').length;
  const weekPassed = effectiveWeek.filter((s) => s.status === 'passed').length;

  return (
    <div className="card-panel p-4 sm:p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-md flex flex-col justify-between space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-[var(--accent)]" />
          <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-[var(--text-primary)]">
            Practice Attempts
          </h3>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono text-[var(--text-muted)]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-xs bg-emerald-500" />
            Passed
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-xs bg-rose-500" />
            Failed
          </span>
        </div>
      </div>

      {/* Today Section (Reference Image 4) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="font-semibold text-[var(--text-primary)]">Today</span>
          <span className="font-bold text-[var(--text-secondary)]">
            {effectiveToday.length} {effectiveToday.length === 1 ? 'Attempt' : 'Attempts'}
            {effectiveToday.length > 0 && ` (${todayPassed} passed)`}
          </span>
        </div>
        {renderAttemptGrid(effectiveToday, 70)}
      </div>

      {/* This Week Section (Reference Image 4) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="font-semibold text-[var(--text-primary)]">This Week</span>
          <span className="font-bold text-[var(--text-secondary)]">
            {effectiveWeek.length} {effectiveWeek.length === 1 ? 'Attempt' : 'Attempts'}
            {effectiveWeek.length > 0 && ` (${weekPassed} passed)`}
          </span>
        </div>
        {renderAttemptGrid(effectiveWeek, 70)}
      </div>

      {/* Footer Info Notice (Reference Image 4) */}
      <div className="pt-2 border-t border-[var(--border)] text-[10px] font-mono text-[var(--text-muted)] flex flex-wrap items-center justify-between gap-1">
        <span>Active attempt telemetry updated live.</span>
        <span>Week starts on Sunday.</span>
      </div>
    </div>
  );
};

export default PracticeAttemptsGrid;
