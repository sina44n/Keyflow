import React, { useState } from 'react';
import {
  generatePracticeCalendar,
  formatDuration,
  getWeekStartPreference,
  setWeekStartPreference,
  DAY_HEADERS as SHARED_DAY_HEADERS,
} from '../../utils/telemetryStorage';

/**
 * HistoricalPracticeCalendar
 * 
 * 12-month rolling practice activity calendar with week-start selector,
 * 4-level heat intensity ramp, day hover tooltips, and inline day detail viewer.
 * Closely mirrors TypingClub Reference Image 5.
 */
export const DAY_HEADERS = SHARED_DAY_HEADERS || ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const dayHeaders = DAY_HEADERS;

export default function HistoricalPracticeCalendar({
  sessions = [],
  currentUserId = null,
  _currentUserId = null,
}) {
  const effectiveUserId = currentUserId || _currentUserId;
  const [weekStart, setWeekStart] = useState(() => getWeekStartPreference(effectiveUserId));
  const [selectedDay, setSelectedDay] = useState(null);
  const [hoveredDay, setHoveredDay] = useState(null);

  const calendarData = React.useMemo(() => {
    return generatePracticeCalendar(sessions, weekStart);
  }, [sessions, weekStart]);

  const handleWeekStartChange = (newStart) => {
    setWeekStart(newStart);
    setWeekStartPreference(newStart, effectiveUserId);
  };

  // Reorder day headers based on weekStart
  const orderedHeaders = React.useMemo(() => {
    const list = [];
    for (let i = 0; i < 7; i++) {
      const idx = (weekStart + i) % 7;
      list.push({ idx, short: DAY_HEADERS[idx][0], full: DAY_HEADERS[idx] });
    }
    return list;
  }, [weekStart]);

  // Heat map color palette for intensity levels 0, 1, 2, 3, 4
  const getCellBg = (level, isCurrentMonth) => {
    if (!isCurrentMonth) return 'bg-transparent border-transparent opacity-0 pointer-events-none';
    switch (level) {
      case 1:
        return 'bg-emerald-200 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-800';
      case 2:
        return 'bg-emerald-400 dark:bg-emerald-700 border-emerald-500 dark:border-emerald-600';
      case 3:
        return 'bg-emerald-500 dark:bg-emerald-600 border-emerald-600 dark:border-emerald-500';
      case 4:
        return 'bg-emerald-600 dark:bg-emerald-500 border-emerald-700 dark:border-emerald-400';
      default:
        return 'bg-[var(--bg-main)] border-[var(--border)]/60 hover:border-[var(--text-muted)]';
    }
  };

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4 sm:p-6 shadow-sm">
      {/* Top Header & Week-Start Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--border)]">
        <div>
          <h3 className="text-xl font-bold text-[var(--text-main)] tracking-tight">
            Practice Calendar
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Historical practice volume and consistency across the last 12 months.
          </p>
        </div>

        {/* Week Start Controls & Legend */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[var(--text-muted)] font-medium">My week starts on:</span>
            <div className="inline-flex flex-wrap p-1 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-xs font-semibold">
              {DAY_HEADERS.map((name, idx) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleWeekStartChange(idx)}
                  className={`px-1.5 sm:px-2 py-1 rounded-lg transition-all cursor-pointer ${
                    weekStart === idx
                      ? 'bg-[var(--accent)] text-white shadow-2xs font-bold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                  title={`Start week on ${name}`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Activity Intensity Legend */}
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <span>Less</span>
            <div className="w-3.5 h-3.5 rounded-sm bg-[var(--bg-main)] border border-[var(--border)]" />
            <div className="w-3.5 h-3.5 rounded-sm bg-emerald-200 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800" />
            <div className="w-3.5 h-3.5 rounded-sm bg-emerald-400 dark:bg-emerald-700 border border-emerald-500" />
            <div className="w-3.5 h-3.5 rounded-sm bg-emerald-500 dark:bg-emerald-600 border border-emerald-600" />
            <div className="w-3.5 h-3.5 rounded-sm bg-emerald-600 dark:bg-emerald-500 border border-emerald-700" />
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Statistics Column + 12 Mini Month Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 pt-6">
        {/* Left Stats Column */}
        <div className="lg:col-span-3 space-y-4">
          <div className="p-5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border)]">
            <div className="text-3xl font-extrabold text-[var(--text-main)] font-mono tracking-tight">
              {calendarData?.formattedTotalDuration || calendarData?.totalDurationFormatted || '0s'}
            </div>
            <div className="text-sm font-semibold text-[var(--text-main)] mt-1">
              Practice Time Last 12 Months
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-2 leading-relaxed">
              The practice calendar shows total practice time and number of attempts per day, as well as the weekly totals.
            </p>

            <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center justify-between text-xs">
              <span className="text-[var(--text-muted)]">Total Attempts:</span>
              <span className="font-mono font-bold text-[var(--text-main)]">
                {calendarData?.totalAttempts || 0}
              </span>
            </div>
          </div>

          {/* Selected Day Quick Inspector */}
          {selectedDay ? (
            <div className="p-4 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-xs animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[var(--accent)]">{selectedDay.dateStr || selectedDay.date || 'Selected Day'}</span>
                <button
                  type="button"
                  onClick={() => setSelectedDay(null)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <div className="mt-2 space-y-1 font-mono text-[var(--text-main)]">
                <div>Active Practice: <strong>{formatDuration(selectedDay.durationSeconds ?? selectedDay.duration ?? 0)}</strong></div>
                <div>Attempts: <strong>{selectedDay.attempts || 0}</strong></div>
                <div>Average WPM: <strong>{(selectedDay.avgWpm ?? selectedDay.wpm ?? 0) > 0 ? `${selectedDay.avgWpm ?? selectedDay.wpm} WPM` : '—'}</strong></div>
                <div>Accuracy: <strong>{(selectedDay.avgAccuracy ?? selectedDay.accuracy) !== null && (selectedDay.avgAccuracy ?? selectedDay.accuracy) !== undefined ? `${selectedDay.avgAccuracy ?? selectedDay.accuracy}%` : '—'}</strong></div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[var(--bg-main)]/50 border border-[var(--border)]/60 text-xs text-[var(--text-muted)] italic text-center">
              Click any calendar day to inspect detailed daily performance.
            </div>
          )}
        </div>

        {/* Right 12-Month Grid */}
        <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {(calendarData?.months || []).map((m) => (
            <div
              key={`${m.year}-${m.month}`}
              className="p-3 rounded-xl bg-[var(--bg-main)]/50 border border-[var(--border)]/60 flex flex-col justify-between"
            >
              {/* Month & Year Title */}
              <div className="flex items-baseline justify-between mb-2 pb-1 border-b border-[var(--border)]/50">
                <span className="text-xs font-bold text-[var(--text-main)]">
                  {m.monthName}
                </span>
                <span className="text-[10px] font-mono text-[var(--text-muted)]">
                  {m.year}
                </span>
              </div>

              {/* Day of Week Header row */}
              <div className="grid grid-cols-8 gap-1 mb-1 text-center">
                {orderedHeaders.map((h) => (
                  <span
                    key={h.idx}
                    className="text-[9px] font-bold text-[var(--text-muted)] uppercase"
                    title={h.full}
                  >
                    {h.short}
                  </span>
                ))}
                <span className="text-[9px] font-semibold text-[var(--text-muted)] uppercase" title="Weekly Total">
                  Tot
                </span>
              </div>

              {/* Weeks Rows */}
              <div className="space-y-1">
                {(m.weeks || []).map((week, wIdx) => {
                  const weekTotal = week?.weeklyTotalSeconds ?? week?.totalDuration ?? 0;
                  return (
                    <div key={wIdx} className="grid grid-cols-8 gap-1 items-center">
                      {/* 7 Days of the week */}
                      {(week?.days || []).map((day, dIdx) => {
                        if (!day || !day.isCurrentMonth) {
                          return (
                            <div
                              key={dIdx}
                              className="aspect-square w-full rounded-2xs border border-transparent bg-transparent pointer-events-none"
                              aria-hidden="true"
                            />
                          );
                        }

                        const dateString = day.dateStr || day.date || '';
                        const isSelected = selectedDay && (selectedDay.dateStr === dateString || selectedDay.date === dateString);
                        const durationSec = day.durationSeconds ?? day.duration ?? 0;
                        const intensityLevel = day.level ?? day.intensity ?? 0;
                        const dayNumber = day.dayOfMonth ?? day.day;

                        return (
                          <button
                            key={dateString || dIdx}
                            type="button"
                            onClick={() => setSelectedDay(day)}
                            onMouseEnter={() => setHoveredDay(day)}
                            onMouseLeave={() => setHoveredDay(null)}
                            className={`aspect-square w-full rounded-2xs border text-[8px] font-mono transition-all relative flex items-center justify-center cursor-pointer ${
                              getCellBg(intensityLevel, true)
                            } ${
                              isSelected ? 'ring-2 ring-[var(--accent)] ring-offset-1 z-10' : ''
                            }`}
                            title={`${dateString}: ${formatDuration(durationSec)} (${day.attempts || 0} attempts)`}
                            aria-label={`${dateString}: ${formatDuration(durationSec)}`}
                          >
                            {day.attempts > 0 ? (
                              <span className="opacity-0 hover:opacity-100 absolute inset-0 flex items-center justify-center bg-black/75 text-white rounded-2xs text-[8px] font-bold">
                                {dayNumber}
                              </span>
                            ) : null}
                          </button>
                        );
                      })}

                      {/* Weekly Total Column */}
                      <div
                        className="text-[8px] font-mono text-center text-[var(--text-muted)] truncate"
                        title={`Week total: ${formatDuration(weekTotal)}`}
                      >
                        {weekTotal > 0
                          ? `${Math.round(weekTotal / 60)}m`
                          : '—'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Hover Details Pill */}
      {hoveredDay && (
        <div className="mt-4 px-3 sm:px-4 py-2 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-xs text-[var(--text-main)] flex flex-wrap items-center justify-between gap-2 animate-fadeIn">
          <span className="font-semibold">{hoveredDay.dateStr || hoveredDay.date}</span>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[var(--text-muted)] font-mono">
            <span>Practice Time: <strong className="text-[var(--text-main)]">{formatDuration(hoveredDay.durationSeconds ?? hoveredDay.duration ?? 0)}</strong></span>
            <span>Attempts: <strong className="text-[var(--text-main)]">{hoveredDay.attempts || 0}</strong></span>
            {(hoveredDay.avgWpm ?? hoveredDay.wpm ?? 0) > 0 && (
              <span>Avg Speed: <strong className="text-sky-500">{hoveredDay.avgWpm ?? hoveredDay.wpm} WPM</strong></span>
            )}
            {(hoveredDay.avgAccuracy ?? hoveredDay.accuracy) !== null && (hoveredDay.avgAccuracy ?? hoveredDay.accuracy) !== undefined && (
              <span>Accuracy: <strong className="text-emerald-500">{hoveredDay.avgAccuracy ?? hoveredDay.accuracy}%</strong></span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
