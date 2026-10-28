import React from 'react';
import {
  Clock,
  Zap,
  Trophy,
  CheckCircle2,
  Grid,
  RotateCcw,
  Hash,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
export const SummaryCards = ({ metrics, activeReport }) => {
  const comparison = metrics?.comparison;
  const hasData = metrics && metrics.hasData;

  const renderDelta = (value, unit = '', isPositiveGood = true) => {
    if (value === null || value === undefined || isNaN(value)) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[var(--text-muted)]">
          <Minus className="w-3 h-3" />
          <span>vs baseline</span>
        </span>
      );
    }
    if (value === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[var(--text-muted)]">
          <span>±0{unit}</span>
          <span>vs prev</span>
        </span>
      );
    }
    const isUp = value > 0;
    const isGood = isPositiveGood ? isUp : !isUp;
    const Icon = isUp ? ArrowUpRight : ArrowDownRight;
    const colorClass = isGood ? 'text-emerald-400' : 'text-rose-400';

    return (
      <span className={`inline-flex items-center gap-0.5 text-[11px] font-mono font-semibold ${colorClass}`}>
        <Icon className="w-3.5 h-3.5" />
        <span>
          {isUp ? '+' : ''}
          {value}
          {unit}
        </span>
        <span className="text-[var(--text-muted)] font-normal ml-1">
          {activeReport === 'today' ? 'vs yesterday' : activeReport === 'weekly' ? 'vs last week' : 'vs baseline'}
        </span>
      </span>
    );
  };

  const cards = [
    {
      id: 'active_time',
      title: 'Active Practice Time',
      value: hasData ? metrics.durationFormatted : '0s',
      subtitle: hasData
        ? `${Math.round(metrics.passedDuration / 60)}m completed drills`
        : 'Zero idle time recorded',
      icon: Clock,
      color: 'var(--accent)',
      delta: comparison ? Math.round(comparison.durationDiff / 60) : null,
      unit: 'm',
      isPositiveGood: true,
    },
    {
      id: 'avg_speed',
      title: 'Average Typing Speed',
      value: hasData ? `${metrics.avgWpm} WPM` : '0 WPM',
      subtitle: hasData ? 'Weighted keystroke velocity' : 'Awaiting initial sprint',
      icon: Zap,
      color: '#38bdf8', // sky-400
      delta: comparison ? comparison.wpmDiff : null,
      unit: ' WPM',
      isPositiveGood: true,
    },
    {
      id: 'best_speed',
      title: 'Best Typing Speed',
      value: hasData ? `${metrics.maxWpm} WPM` : '0 WPM',
      subtitle: hasData ? 'Peak session velocity' : 'Personal best benchmark',
      icon: Trophy,
      color: '#fbbf24', // amber-400
      delta: null,
      customNote: hasData ? 'Highest burst cadence' : 'Unlock Godspeed tier',
    },
    {
      id: 'accuracy',
      title: 'Accuracy Rating',
      value: hasData ? `${metrics.accuracy}%` : '100%',
      subtitle: hasData
        ? `Real accuracy: ${metrics.realAccuracy}% (no corrections)`
        : 'Eradicate glance habits',
      icon: CheckCircle2,
      color: '#34d399', // emerald-400
      delta: comparison ? comparison.accuracyDiff : null,
      unit: '%',
      isPositiveGood: true,
    },
    {
      id: 'coverage',
      title: 'Keyboard Coverage',
      value: hasData ? `${metrics.coveragePercent}%` : '0%',
      subtitle: hasData
        ? `${metrics.practicedKeyCount} of ${metrics.totalStandardKeys} active keys`
        : 'ANSI 60% full layout',
      icon: Grid,
      color: '#a78bfa', // purple-400
      delta: null,
      customNote: `${metrics?.practicedKeyCount || 0} unique keys tested`,
    },
    {
      id: 'attempts',
      title: 'Total Attempts',
      value: hasData ? String(metrics.totalAttempts) : '0',
      subtitle: hasData
        ? `${metrics.passedAttempts} passed • ${metrics.failedAttempts} failed`
        : 'Completed & failed drills',
      icon: RotateCcw,
      color: '#f472b6', // pink-400
      delta: null,
      customNote: hasData ? `${Math.round((metrics.passedAttempts / metrics.totalAttempts) * 100)}% pass rate` : 'Start a lesson',
    },
    {
      id: 'characters',
      title: 'Characters Typed',
      value: hasData ? metrics.totalChars.toLocaleString() : '0',
      subtitle: hasData
        ? `${metrics.correctChars.toLocaleString()} clean • ${metrics.incorrectChars.toLocaleString()} errors`
        : 'Raw input telemetry',
      icon: Hash,
      color: '#60a5fa', // blue-400
      delta: null,
      customNote: hasData && metrics.backspaces > 0 ? `${metrics.backspaces} corrections` : 'Precision keystrokes',
    },
    {
      id: 'active_days',
      title: 'Active Practice Days',
      value: hasData ? `${metrics.activePracticeDays} ${metrics.activePracticeDays === 1 ? 'day' : 'days'}` : '0 days',
      subtitle: hasData
        ? `${metrics.activePracticeDays} calendar sessions`
        : 'Daily deliberate practice',
      icon: Flame,
      color: '#f97316', // orange-500
      delta: null,
      customNote: 'Consistency is mastery',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.id}
            className="card-panel min-w-0 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--accent)] transition-all duration-200 shadow-sm relative overflow-hidden group"
          >
            {/* Top Accent Strip */}
            <div
              className="absolute top-0 left-0 right-0 h-1 opacity-70 group-hover:opacity-100 transition-opacity"
              style={{ backgroundColor: c.color }}
            />

            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-mono font-medium text-[var(--text-muted)] truncate">
                {c.title}
              </span>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-[var(--border)] bg-[var(--bg-elevated)]"
                style={{ color: c.color }}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[var(--text-primary)] tracking-tight">
                {c.value}
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] truncate">
                {c.subtitle}
              </p>
            </div>

            <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs">
              {c.delta !== null ? (
                renderDelta(c.delta, c.unit, c.isPositiveGood)
              ) : (
                <span className="text-[11px] font-mono text-[var(--text-muted)] truncate">
                  {c.customNote}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SummaryCards;
