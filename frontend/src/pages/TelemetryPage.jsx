import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getAllMergedSessions,
  calculateReportMetrics,
  getPracticeGoal,
  setPracticeGoal,
  downloadCSV,
  getWeekStartPreference
} from '../utils/telemetryStorage';

// Telemetry Sub-Components
import ReportHeader from '../components/telemetry/ReportHeader';
import SummaryCards from '../components/telemetry/SummaryCards';
import SpeedAccuracySummary from '../components/telemetry/SpeedAccuracySummary';
import PracticeTimeDonut from '../components/telemetry/PracticeTimeDonut';
import PracticeAttemptsGrid from '../components/telemetry/PracticeAttemptsGrid';
import ProgressOverviewChart from '../components/telemetry/ProgressOverviewChart';
import CircularIntelligenceInfographic from '../components/telemetry/CircularIntelligenceInfographic';
import KeyboardMastery from '../components/telemetry/KeyboardMastery';
import FingerMasteryMatrix from '../components/telemetry/FingerMasteryMatrix';
import CharacterPerformanceChart from '../components/telemetry/CharacterPerformanceChart';
import HistoricalPracticeCalendar from '../components/telemetry/HistoricalPracticeCalendar';
import PersonalizedInsights from '../components/telemetry/PersonalizedInsights';
import PersonalRecords from '../components/telemetry/PersonalRecords';
import TelemetryProfileModal from '../components/telemetry/TelemetryProfileModal';

/**
 * TelemetryPage
 * 
 * Master Scientific Keystroke Intelligence & Biomechanical Analytics Dashboard.
 * Implements all specifications from the Masterpiece prompt & TypingClub references.
 */
export default function TelemetryPage() {
  const { user } = useAuth();
  const userId = user?.id || null;

  // Active Report Tab: 'today' | 'weekly' | 'overall'
  const [activeReport, setActiveReport] = useState('overall');

  // Practice Goal State (minutes per day)
  const [goalMinutes, setGoalMinutesState] = useState(() => getPracticeGoal(userId));

  // Sessions state (reloaded on storage event)
  const [sessions, setSessions] = useState(() => getAllMergedSessions(userId));

  // Week start preference state (updated when calendar changes it)
  const [weekStart, setWeekStart] = useState(() => getWeekStartPreference(userId));

  // Profile & Settings modal open state
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Refresh sessions when telemetry updates
  const refreshSessions = useCallback(() => {
    setSessions(getAllMergedSessions(userId));
  }, [userId]);

  useEffect(() => {
    const handleUpdate = () => refreshSessions();
    const handleGoalUpdate = () => setGoalMinutesState(getPracticeGoal(userId));
    const handleWeekStartUpdate = () => setWeekStart(getWeekStartPreference(userId));

    window.addEventListener('keyflow-telemetry-updated', handleUpdate);
    window.addEventListener('keyflow-telemetry-goal-updated', handleGoalUpdate);
    window.addEventListener('keyflow-week-start-updated', handleWeekStartUpdate);
    window.addEventListener('keyflow-lesson-progress-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('keyflow-telemetry-updated', handleUpdate);
      window.removeEventListener('keyflow-telemetry-goal-updated', handleGoalUpdate);
      window.removeEventListener('keyflow-week-start-updated', handleWeekStartUpdate);
      window.removeEventListener('keyflow-lesson-progress-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [userId, refreshSessions]);

  // Handle goal change
  const handleGoalChange = (newGoal) => {
    setGoalMinutesState(newGoal);
    setPracticeGoal(newGoal, userId);
  };

  // Compute calculated metrics for active report
  const metrics = useMemo(() => {
    return calculateReportMetrics(sessions, activeReport, { weekStart, goalMinutes });
  }, [sessions, activeReport, weekStart, goalMinutes]);

  // Handle CSV export
  const handleExportCSV = () => {
    const filename = `keyflow_telemetry_${activeReport}_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCSV(sessions, filename);
  };

  // Handle Print Report
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] py-8 px-4 sm:px-6 lg:px-8 print:p-0">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Report Header with Today / Weekly / Overall selector, date range, goals & actions */}
        <ReportHeader
          activeReport={activeReport}
          onSelectReport={setActiveReport}
          metrics={metrics}
          goalMinutes={goalMinutes}
          onUpdateGoal={handleGoalChange}
          onExportCSV={handleExportCSV}
          onPrint={handlePrint}
          onOpenProfile={() => setIsProfileOpen(true)}
        />

        {/* Guest Warning / Synchronization Notice */}
        {!user && (
          <div className="px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-600 dark:text-amber-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">ℹ️</span>
              <span>
                You are currently viewing guest telemetry. Keystroke telemetry is stored locally in this browser. Sign in or register to sync your records across all devices.
              </span>
            </div>
            <a
              href="/login"
              className="font-bold underline hover:text-amber-700 dark:hover:text-amber-300 ml-4 shrink-0"
            >
              Sign In
            </a>
          </div>
        )}

        {/* 1. Summary Statistic Cards (8 Cards with Comparison Deltas) */}
        <SummaryCards metrics={metrics} activeReport={activeReport} />

        {/* 2. Top Analytics Row (Matching Reference Image 4) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-stretch">
          {/* Speed & Accuracy / Coverage Rings */}
          <div className="lg:col-span-4 flex flex-col">
            <SpeedAccuracySummary metrics={metrics} />
          </div>

          {/* Practice Time SVG Donut Chart */}
          <div className="lg:col-span-4 flex flex-col">
            <PracticeTimeDonut metrics={metrics} timePeriod={activeReport} setTimePeriod={setActiveReport} />
          </div>

          {/* Practice Attempts Dual Matrix */}
          <div className="lg:col-span-4 flex flex-col">
            <PracticeAttemptsGrid sessions={sessions} metrics={metrics} />
          </div>
        </div>

        {/* 3. Reference-Based Circular Intelligence Infographic */}
        <CircularIntelligenceInfographic sessions={sessions} />

        {/* 4. Progress Overview Time-Series */}
        <ProgressOverviewChart sessions={sessions} activeReportMetrics={metrics} activeReport={activeReport} />

        {/* 4. Keyboard Mastery ANSI 60% Interactive Heatmap (Matching Reference Image 2) */}
        <KeyboardMastery characterStats={metrics.characterStats} avgWpm={metrics.avgWpm} overallAccuracy={metrics.accuracy} />

        {/* 5. Ten-Finger Biomechanical Matrix (Preserved & Upgraded, Matching Reference Image 1) */}
        <FingerMasteryMatrix
          fingerStats={metrics.fingerStats}
          leftHandStats={metrics.leftHandStats}
          rightHandStats={metrics.rightHandStats}
          thumbsStats={metrics.thumbsStats}
        />

        {/* 6. Speed and Accuracy per Character Ranked Bar Chart (Matching Reference Image 1 bottom) */}
        <CharacterPerformanceChart characterStats={metrics.characterStats} />

        {/* 7. Historical Practice Calendar 12-Month Matrix (Matching Reference Image 5) */}
        <HistoricalPracticeCalendar sessions={sessions} currentUserId={userId} />

        {/* 8. Scientific Recommendations & Actionable Insights */}
        <PersonalizedInsights metrics={metrics} sessions={sessions} />

        {/* 9. Personal Records & Milestones */}
        <PersonalRecords sessions={sessions} />

        {/* 10. Profile & Settings Modal */}
        <TelemetryProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          sessions={sessions}
        />
      </div>
    </div>
  );
}
