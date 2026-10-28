import React, { useState } from 'react';
import { Clock, Info } from 'lucide-react';
import { formatDurationClock } from '../../utils/telemetryStorage.js';

export const PracticeTimeDonut = ({
  metrics,
  timePeriod,
  setTimePeriod,
}) => {
  const [hoveredSlice, setHoveredSlice] = useState(null);

  const totalDuration = metrics?.totalDuration || 0;
  const passedDuration = metrics?.passedDuration || 0;
  const failedDuration = metrics?.failedDuration || 0;
  const partialDuration = metrics?.partialDuration || 0;
  const learningDuration = metrics?.learningDuration || 0;

  // Donut slices
  const slices = [
    {
      id: 'typing',
      label: 'Typing (Passed)',
      duration: passedDuration,
      color: '#06b6d4', // cyan-500
    },
    {
      id: 'not_passed',
      label: 'Not Passed',
      duration: failedDuration,
      color: '#f43f5e', // rose-500
    },
    {
      id: 'incomplete',
      label: 'Incomplete',
      duration: partialDuration,
      color: '#f97316', // orange-500
    },
    {
      id: 'learning',
      label: 'Learning Drills',
      duration: learningDuration,
      color: '#6366f1', // indigo-500
    },
  ];

  // SVG Donut calculation (viewBox 0 0 200 200, cx=100, cy=100, r=70)
  const radius = 70;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;
  const renderedSlices = slices.map((s) => {
    const percent = totalDuration > 0 ? (s.duration / totalDuration) : 0;
    const strokeDash = percent * circumference;
    const dashArray = `${strokeDash} ${circumference - strokeDash}`;
    const offset = currentOffset;
    currentOffset -= strokeDash;

    return {
      ...s,
      percent: Math.round(percent * 100),
      dashArray,
      dashOffset: offset,
      formatted: formatDurationClock(s.duration),
    };
  });

  return (
    <div className="card-panel p-4 sm:p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-md flex flex-col justify-between space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[var(--accent)]" />
          <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-[var(--text-primary)]">
            Practice Time
          </h3>
          <span title="Active typing duration excluding idle intervals" className="cursor-help text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <Info className="w-3.5 h-3.5" />
          </span>
        </div>
        <span className="text-[10px] font-mono text-[var(--text-muted)]">Active Telemetry</span>
      </div>

      {/* Slices Legend & Labels (Reference Image 4) */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-2 text-[10px] sm:text-[11px] font-mono">
        {renderedSlices.map((s) => (
          <div
            key={s.id}
            onMouseEnter={() => setHoveredSlice(s.id)}
            onMouseLeave={() => setHoveredSlice(null)}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              hoveredSlice === s.id
                ? 'bg-[var(--bg-elevated)] border-[var(--accent)]'
                : 'border-transparent hover:bg-[var(--bg-elevated)]/60'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-[var(--text-secondary)] truncate">{s.label}</span>
            </div>
            <div className="text-[11px] sm:text-[12px] font-bold text-[var(--text-primary)] pl-3.5">
              {s.formatted} ({s.percent}%)
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Donut Visualization (Reference Image 4) */}
      <div className="relative flex items-center justify-center my-2">
        <svg className="w-44 h-44 sm:w-48 sm:h-48 -rotate-90" viewBox="0 0 200 200">
          {/* Base empty ring */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            className="stroke-[var(--bg-elevated)] fill-none"
            strokeWidth="20"
          />

          {totalDuration > 0 ? (
            renderedSlices.map((s) => (
              <circle
                key={s.id}
                cx="100"
                cy="100"
                r={radius}
                className="fill-none transition-all duration-300 cursor-pointer"
                stroke={s.color}
                strokeWidth={hoveredSlice === s.id ? 24 : 20}
                strokeDasharray={s.dashArray}
                strokeDashoffset={s.dashOffset}
                strokeLinecap="round"
                onMouseEnter={() => setHoveredSlice(s.id)}
                onMouseLeave={() => setHoveredSlice(null)}
              />
            ))
          ) : (
            <circle
              cx="100"
              cy="100"
              r={radius}
              className="stroke-[var(--border)] fill-none"
              strokeWidth="20"
              strokeDasharray="4 8"
            />
          )}
        </svg>

        {/* Center Duration Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-xl sm:text-2xl font-mono font-extrabold text-[var(--text-primary)] tracking-tight">
            {formatDurationClock(totalDuration)}
          </span>
          <span className="text-[10px] font-mono text-[var(--text-muted)] mt-0.5">
            {hoveredSlice ? slices.find((sl) => sl.id === hoveredSlice)?.label : 'Total Active'}
          </span>
        </div>
      </div>

      {/* Period Selector Tabs (Today | This Week | Overall) */}
      <div className="pt-2 border-t border-[var(--border)] flex items-center justify-center">
        <div className="inline-flex rounded-xl bg-[var(--bg-elevated)] p-0.5 sm:p-1 border border-[var(--border)] text-[11px] sm:text-xs font-mono">
          {['today', 'weekly', 'overall'].map((p) => {
            const labels = { today: 'Today', weekly: 'This Week', overall: 'Overall' };
            const isSel = timePeriod === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setTimePeriod && setTimePeriod(p)}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  isSel
                    ? 'bg-[var(--accent)] text-[var(--accent-fg)] shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {labels[p]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PracticeTimeDonut;
