import React from 'react';
import { getPersonalRecords, formatDuration } from '../../utils/telemetryStorage';

/**
 * PersonalRecords
 * 
 * Displays authenticated personal bests and lifetime milestones
 * calculated strictly from recorded user sessions.
 */
export default function PersonalRecords({
  sessions = [],
  activeReport = 'overall',
  periodMetrics = null,
}) {
  const records = React.useMemo(() => {
    return getPersonalRecords(sessions);
  }, [sessions]);

  const mostActiveDay = records?.mostActiveDay || { date: records?.mostActiveDate || '', durationSeconds: 0, attempts: 0 };
  const totalCompleted = records?.totalCompletedSessions ?? records?.totalSessions ?? 0;
  const totalPracticeSec = records?.totalPracticeSeconds ?? 0;
  const longestSeconds = records?.longestSessionSeconds ?? 0;

  const isToday = activeReport === 'today' || activeReport === 'daily';
  const isWeekly = activeReport === 'weekly';

  const speedTitle = isToday
    ? "Today's Peak Speed"
    : isWeekly
      ? "This Week's Peak Speed"
      : 'Highest Typing Speed';

  const speedVal = isToday || isWeekly
    ? ((periodMetrics?.bestWpm || 0) > 0 ? `${periodMetrics.bestWpm} WPM` : '—')
    : ((records?.highestWpm || 0) > 0 ? `${records.highestWpm} WPM` : '—');

  const speedDesc = isToday
    ? 'Peak speed recorded across completed practice today.'
    : isWeekly
      ? 'Peak speed recorded across practice this week.'
      : 'All-time personal best speed recorded in completed practice.';

  const accuracyTitle = isToday
    ? "Today's Accuracy"
    : isWeekly
      ? "This Week's Accuracy"
      : 'Peak Accuracy';

  const accuracyVal = isToday || isWeekly
    ? ((periodMetrics?.accuracy !== null && periodMetrics?.accuracy !== undefined && (periodMetrics?.attempts || 0) > 0) ? `${periodMetrics.accuracy}%` : '—')
    : ((records?.bestAccuracy || 0) > 0 ? `${records.bestAccuracy}%` : '—');

  const accuracyDesc = isToday
    ? 'Overall accuracy rating achieved today.'
    : isWeekly
      ? 'Overall accuracy rating achieved this week.'
      : 'Highest precision achieved in an active session.';

  const sessionsTitle = isToday
    ? "Today's Completed Drills"
    : isWeekly
      ? "This Week's Completed Drills"
      : 'Completed Sessions';

  const sessionsVal = isToday || isWeekly
    ? (periodMetrics?.attempts || 0).toLocaleString()
    : totalCompleted.toLocaleString();

  const sessionsDesc = isToday
    ? 'Successfully completed drills logged today.'
    : isWeekly
      ? 'Successfully completed drills logged this week.'
      : 'Total successfully passed drills and workstation sprints.';

  const cards = [
    {
      title: speedTitle,
      value: speedVal,
      desc: speedDesc,
      icon: '⚡',
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/30'
    },
    {
      title: accuracyTitle,
      value: accuracyVal,
      desc: accuracyDesc,
      icon: '🎯',
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30'
    },
    {
      title: 'Longest Focused Session',
      value: longestSeconds > 0 ? formatDuration(longestSeconds) : (records?.longestSessionFormatted && records.longestSessionFormatted !== '0s' ? records.longestSessionFormatted : '—'),
      desc: 'All-time maximum uninterrupted typing practice without idle gaps.',
      icon: '⏱️',
      color: 'text-sky-500 bg-sky-500/10 border-sky-500/30'
    },
    {
      title: 'Most Productive Day',
      value: mostActiveDay.durationSeconds > 0
        ? formatDuration(mostActiveDay.durationSeconds)
        : '—',
      desc: mostActiveDay.date
        ? `${mostActiveDay.date} (${mostActiveDay.attempts || 0} attempts)`
        : 'Most practice time logged in a single calendar day.',
      icon: '🏆',
      color: 'text-purple-500 bg-purple-500/10 border-purple-500/30'
    },
    {
      title: sessionsTitle,
      value: sessionsVal,
      desc: sessionsDesc,
      icon: '📜',
      color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30'
    },
    {
      title: 'Lifetime Active Practice',
      value: formatDuration(totalPracticeSec),
      desc: 'Cumulative focused time spent training on Keyflow.',
      icon: '⏳',
      color: 'text-rose-500 bg-rose-500/10 border-rose-500/30'
    }
  ];

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4 sm:p-6 shadow-sm">
      <div className="pb-4 border-b border-[var(--border)]">
        <h3 className="text-xl font-bold text-[var(--text-main)] tracking-tight">
          Personal Records & Milestones
        </h3>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Authentic milestones validated from your permanent typing history.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border)] flex items-start gap-4 transition-all duration-280 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[var(--text-muted)]/50 hover:shadow-xs"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 border ${card.color}`}>
              {card.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                {card.title}
              </div>
              <div className="text-2xl font-extrabold text-[var(--text-main)] font-mono tracking-tight mt-1">
                {card.value}
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-snug">
                {card.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
