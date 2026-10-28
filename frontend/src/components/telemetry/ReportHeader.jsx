import React, { useState } from 'react';
import {
  Calendar,
  Download,
  Printer,
  Target,
  Sparkles,
  Clock,
  User,
} from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';

export const ReportHeader = ({
  activeReport,
  setActiveReport,
  onSelectReport,
  dateRangeText,
  goalMinutes,
  onUpdateGoal,
  goalProgressPercent,
  totalDurationFormatted,
  metrics,
  onExportCSV,
  onPrint,
  onOpenProfile,
}) => {
  const { t } = useI18n();
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(goalMinutes || 30);

  const handleSelectReport = onSelectReport || setActiveReport;
  const displayDateRange = dateRangeText || metrics?.dateRange?.label || '';
  const displayGoalProgress = goalProgressPercent !== undefined ? goalProgressPercent : (metrics?.goalProgressPercent || 0);
  const displayDuration = totalDurationFormatted || metrics?.formattedDuration || '0m';

  const reports = [
    { id: 'today', label: t('telemetry.reportToday') || 'Today Report', icon: Clock },
    { id: 'weekly', label: t('telemetry.reportWeekly') || 'Weekly Report', icon: Calendar },
    { id: 'overall', label: t('telemetry.reportOverall') || 'Overall Report', icon: Sparkles },
  ];

  const goalOptions = [15, 20, 30, 45, 60, 90, 120];

  const handleSaveGoal = () => {
    onUpdateGoal(selectedGoal);
    setGoalModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Title & Metadata Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-xs font-mono text-[var(--accent)] mb-2">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
            <span>{t('telemetry.badge') || 'Biomechanical Telemetry & Analytics'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
            {t('telemetry.title') || 'Scientific Keystroke Intelligence'}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 max-w-3xl leading-relaxed">
            {t('telemetry.subtitle') ||
              'Eliminate guesswork. KEYFLOW aggregates individual finger latencies, misstrike clusters, and cadence variance to pinpoint exactly where you lose velocity.'}
          </p>
        </div>

        {/* Global Action Tools */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Profile & Settings Button */}
          <button
            type="button"
            onClick={onOpenProfile}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--accent)] text-white hover:opacity-95 text-xs font-mono font-bold transition-all cursor-pointer shadow-xs"
            title="Open Telemetry Profile & Settings"
          >
            <User className="w-3.5 h-3.5 text-white" />
            <span>Profile</span>
          </button>

          {/* Practice Goal Pill */}
          <button
            type="button"
            onClick={() => setGoalModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--accent)] text-xs font-mono text-[var(--text-primary)] transition-all cursor-pointer shadow-xs"
            title="Configure Daily Practice Target"
          >
            <Target className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Goal: {goalMinutes}m</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                displayGoalProgress >= 100
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-[var(--accent)]/15 text-[var(--accent)]'
              }`}
            >
              {displayGoalProgress}%
            </span>
          </button>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={onExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--accent)] text-xs font-mono text-[var(--text-primary)] transition-all cursor-pointer shadow-xs"
            title="Download CSV Performance Records"
          >
            <Download className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span>Export CSV</span>
          </button>

          {/* Print Report */}
          <button
            type="button"
            onClick={onPrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--accent)] text-xs font-mono text-[var(--text-primary)] transition-all cursor-pointer shadow-xs"
            title="Print or Save as PDF"
          >
            <Printer className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* Report Selector Strip & Date Frame Display */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-2 sm:p-2.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-xs">
        {/* Report Tab Switcher */}
        <div className="grid grid-cols-3 sm:flex items-center gap-1 bg-[var(--bg-elevated)] p-1 rounded-xl border border-[var(--border)] w-full sm:w-auto" role="tablist">
          {reports.map((rep) => {
            const Icon = rep.icon;
            const isActive = activeReport === rep.id;
            const shortLabel = rep.id === 'today' ? 'Today' : rep.id === 'weekly' ? 'Weekly' : 'Overall';
            return (
              <button
                key={rep.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handleSelectReport(rep.id)}
                className={`flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[var(--accent)] text-[var(--accent-fg)] shadow-[0_0_12px_color-mix(in_srgb,var(--accent)_30%,transparent)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[color-mix(in_srgb,var(--bg-surface)_80%,transparent)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>
                  <span className="sm:hidden">{shortLabel}</span>
                  <span className="hidden sm:inline">{rep.label}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Current Date Frame & Practice Time Summary */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 px-2 text-xs font-mono text-[var(--text-secondary)]">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
            <span className="font-semibold text-[var(--text-primary)] truncate max-w-[200px] sm:max-w-none">{displayDateRange}</span>
          </div>
          <span className="text-[var(--border)] hidden xs:inline">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-muted)]">Active:</span>
            <span className="font-bold text-[var(--accent)]">{displayDuration}</span>
          </div>
        </div>
      </div>

      {/* Goal Configuration Modal */}
      {goalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] border border-[var(--accent)] flex items-center justify-center text-[var(--accent)]">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">Practice Duration Target</h3>
                <p className="text-xs text-[var(--text-muted)]">Set your preferred target active typing time</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {goalOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setSelectedGoal(opt)}
                  className={`py-2 rounded-xl text-xs font-mono font-bold transition-all border ${
                    selectedGoal === opt
                      ? 'bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)] shadow-xs'
                      : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--accent)]'
                  }`}
                >
                  {opt}m
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setGoalModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveGoal}
                className="px-4 py-2 rounded-xl text-xs font-mono font-semibold bg-[var(--accent)] text-[var(--accent-fg)] hover:opacity-90"
              >
                Save Target
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportHeader;
