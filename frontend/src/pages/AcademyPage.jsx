import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { STAGE_META, getStageUnits, getLessonMeta, getNextLessonId } from '../data/curriculumEngine';
import {
  isStageUnlocked,
  isLessonUnlocked,
  getLessonRecord,
  getNextRecommendedLesson,
  getLessonProgress,
  getAcademyDashboardStats,
} from '../utils/lessonProgress';
import { LessonPlayer } from '../components/academy/LessonPlayer';
import { AcademyHero } from '../components/academy/AcademyHero';
import { UnitSelector } from '../components/academy/UnitSelector';
import { LessonMap } from '../components/academy/LessonMap';
import { ShortcutBar } from '../components/academy/ShortcutBar';
import { Button } from '../components/common/Button';
import {
  Lock,
  ChevronDown,
  Zap,
} from 'lucide-react';

const VIEW = {
  DASHBOARD: 'dashboard',
  LESSON: 'lesson',
  ALL_STAGES: 'all_stages',
};

export const AcademyPage = ({ initialLevelId = 1, onExit }) => {
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialLessonParam = searchParams ? parseInt(searchParams.get('lesson'), 10) : null;
  const initialStageParam = searchParams ? parseInt(searchParams.get('stage'), 10) : null;
  const initialUnitParam = searchParams ? parseInt(searchParams.get('unit'), 10) : null;

  const [view, setView] = useState(initialLessonParam ? VIEW.LESSON : VIEW.DASHBOARD);
  const [activeStageId, setActiveStageId] = useState(initialStageParam || initialLevelId || 1);
  const [activeUnit, setActiveUnit] = useState(initialUnitParam || 1);
  const [activeLessonNum, setActiveLessonNum] = useState(initialLessonParam || 1);
  const [progress, setProgress] = useState(getLessonProgress);
  const [dashboardStats, setDashboardStats] = useState(() => getAcademyDashboardStats(1));
  const [stageMenuOpen, setStageMenuOpen] = useState(false);

  // Sync progress on external updates (e.g. lesson completion)
  const refreshProgress = useCallback(() => {
    setProgress(getLessonProgress());
    setDashboardStats(getAcademyDashboardStats(activeStageId));
  }, [activeStageId]);

  useEffect(() => {
    window.addEventListener('keyflow-lesson-progress-updated', refreshProgress);
    return () => window.removeEventListener('keyflow-lesson-progress-updated', refreshProgress);
  }, [refreshProgress]);

  // Stage metadata & Units
  const activeStageMeta = STAGE_META[activeStageId - 1] || STAGE_META[0];
  const unitsData = useMemo(() => getStageUnits(activeStageId), [activeStageId]);
  const currentUnit = unitsData[activeUnit - 1] || unitsData[0];

  // Global recommended next lesson across unlocked stages
  const recommended = useMemo(() => {
    return getNextRecommendedLesson(activeStageId);
  }, [activeStageId, progress]);

  // Handle "Continue Practice" event dispatched from Navbar or Hero
  useEffect(() => {
    const handleContinuePractice = () => {
      const targetStage = recommended?.stageId || activeStageId;
      const targetLesson = recommended?.lessonNum || 1;
      setActiveStageId(targetStage);
      setActiveLessonNum(targetLesson);
      setView(VIEW.LESSON);
    };

    window.addEventListener('keyflow-continue-practice', handleContinuePractice);
    return () => window.removeEventListener('keyflow-continue-practice', handleContinuePractice);
  }, [recommended, activeStageId]);

  // Calculate unit completion and progress for all 20 units
  const unitProgress = useMemo(() => {
    const map = {};
    unitsData.forEach((u) => {
      let done = 0;
      for (let l = u.startLesson; l <= u.endLesson; l++) {
        if (progress.lessons?.[`s${activeStageId}_l${l}`]?.completed) {
          done++;
        }
      }
      map[u.unitNumber] = {
        completed: done >= 15, // Considered mastered at 15+ lessons
        count: done,
        total: 20,
      };
    });
    return map;
  }, [unitsData, activeStageId, progress]);

  // Generate 20 lessons for the currently selected unit
  const currentUnitLessons = useMemo(() => {
    if (!currentUnit) return [];
    const lessons = [];
    const start = currentUnit.startLesson;
    const end = Math.min(currentUnit.endLesson, start + 19);

    for (let l = start; l <= end; l++) {
      const meta = getLessonMeta(activeStageId, l);
      const record = getLessonRecord(activeStageId, l);
      const unlocked = isLessonUnlocked(activeStageId, l);
      const isNextUp = recommended.stageId === activeStageId && recommended.lessonNum === l;

      lessons.push({
        ...meta,
        record,
        unlocked,
        isNextUp,
      });
    }
    return lessons;
  }, [activeStageId, currentUnit, recommended, progress]);

  // Lesson selection handler
  const handleSelectLesson = useCallback((stageId, lessonNum) => {
    if (!isLessonUnlocked(stageId, lessonNum)) return;
    setActiveStageId(stageId);
    setActiveLessonNum(lessonNum);
    setView(VIEW.LESSON);
  }, []);

  const handleNextLesson = useCallback(() => {
    const next = getNextLessonId(activeStageId, activeLessonNum);
    if (!next) return;
    setActiveStageId(next.stageId);
    setActiveLessonNum(next.lessonNum);
  }, [activeStageId, activeLessonNum]);

  const handleBackToDashboard = useCallback(() => {
    setView(VIEW.DASHBOARD);
    refreshProgress();
  }, [refreshProgress]);

  // If active lesson view is selected, render LessonPlayer as dedicated full experience
  if (view === VIEW.LESSON) {
    const nextLessonId = getNextLessonId(activeStageId, activeLessonNum);
    const hasNextLesson = nextLessonId !== null && nextLessonId.stageId === activeStageId;
    const hasNextStage = nextLessonId !== null && nextLessonId.stageId !== activeStageId;

    return (
      <div className="w-full">
        <LessonPlayer
          stageId={activeStageId}
          lessonNum={activeLessonNum}
          onBack={handleBackToDashboard}
          onNextLesson={hasNextLesson ? handleNextLesson : undefined}
          onNextStage={hasNextStage ? () => {
            if (nextLessonId) {
              setActiveStageId(nextLessonId.stageId);
              setActiveLessonNum(nextLessonId.lessonNum);
            }
          } : undefined}
          hasNextLesson={hasNextLesson}
          hasNextStage={hasNextStage}
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] pb-16 overflow-x-hidden selection:bg-[var(--accent)] selection:text-[var(--accent-fg)]">
      {/* Subtle Atmospheric Accent Edge Glow Effects */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 50% -10%, color-mix(in srgb, var(--accent) 15%, transparent) 0%, transparent 60%),
            radial-gradient(ellipse at 95% 40%, color-mix(in srgb, var(--accent) 8%, transparent) 0%, transparent 45%),
            radial-gradient(ellipse at 5% 85%, color-mix(in srgb, var(--accent) 6%, transparent) 0%, transparent 50%)
          `,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 container-app py-6 space-y-7">
        {/* Stage Switcher Header Bar (Subtle Stage Selector & Exit) */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-3">
            {onExit && (
              <Button variant="outline" size="sm" onClick={onExit} className="border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                ← Home
              </Button>
            )}

            {/* Stage Dropdown Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setStageMenuOpen(!stageMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--accent)]/60 text-[var(--text-primary)] font-mono text-xs cursor-pointer shadow-xs transition-all"
                aria-expanded={stageMenuOpen}
                aria-label="Switch Curriculum Stage"
              >
                <div className="w-2 h-2 rounded-full bg-[var(--accent)] shadow-[0_0_6px_var(--accent)]" />
                <span className="text-[var(--text-secondary)]">Stage {activeStageId}:</span>
                <span className="font-bold text-[var(--text-primary)]">{activeStageMeta.title}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] ml-1" />
              </button>

              {/* Stage Selection Flyout */}
              {stageMenuOpen && (
                <div className="absolute left-0 top-full mt-2 z-50 w-72 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
                    <span>7 Neuromuscular Stages</span>
                    <span className="text-[10px] text-[var(--accent)]">4,200 Lessons</span>
                  </div>
                  <div className="space-y-1 mt-1 max-h-64 overflow-y-auto pr-1">
                    {STAGE_META.map((st) => {
                      const isStUnlocked = isStageUnlocked(st.stageId);
                      const isStActive = st.stageId === activeStageId;

                      return (
                        <button
                          key={st.stageId}
                          type="button"
                          disabled={!isStUnlocked}
                          onClick={() => {
                            setActiveStageId(st.stageId);
                            setActiveUnit(1);
                            setStageMenuOpen(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                            isStActive
                              ? 'bg-[var(--bg-elevated)] border border-[var(--accent)] text-[var(--text-primary)] shadow-xs'
                              : isStUnlocked
                              ? 'hover:bg-[var(--bg-elevated)]/80 text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
                              : 'opacity-40 cursor-not-allowed text-[var(--text-muted)] border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono text-xs font-bold w-4 text-center">
                              {st.stageId}
                            </span>
                            <span className="text-xs font-medium">{st.title}</span>
                          </div>
                          {!isStUnlocked && <Lock className="w-3 h-3 text-[var(--text-muted)]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Resume Link */}
          <div className="flex items-center gap-3">
            <span className="text-[var(--text-muted)] hidden sm:inline">
              Recommended: <span className="text-[var(--accent)] font-bold">Lesson {recommended.lessonNum}</span>
            </span>
            <button
              type="button"
              onClick={() => handleSelectLesson(recommended.stageId, recommended.lessonNum)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--accent)]/40 hover:border-[var(--accent)] text-[var(--accent)] hover:text-[var(--accent-fg)] hover:bg-[var(--accent)] text-xs font-mono font-bold shadow-xs transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Resume</span>
            </button>
          </div>
        </div>

        {/* 1. Dashboard Hero with 3 Statistics Cards (Reference B) */}
        <AcademyHero
          overallProgress={dashboardStats.overallProgress}
          completedUnits={dashboardStats.completedUnits}
          totalUnits={dashboardStats.totalUnits}
          streak={dashboardStats.streak}
          accuracy={dashboardStats.accuracy}
          accuracyChange={dashboardStats.accuracyChange}
        />

        {/* 2. Horizontal 20-Unit Selector (Reference B) */}
        <section aria-label="Units Navigation" className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-[var(--text-secondary)]">
            <span className="font-semibold tracking-wider uppercase text-[11px] text-[var(--text-muted)]">
              Select Learning Unit (1–20):
            </span>
            <span className="text-[11px] text-[var(--text-secondary)]">
              Active: <span className="text-[var(--accent)] font-bold">Unit {String(activeUnit).padStart(2, '0')}</span>
            </span>
          </div>

          <UnitSelector
            activeUnit={activeUnit}
            onSelectUnit={(unitNum) => setActiveUnit(unitNum)}
            unitProgress={unitProgress}
            unlockedUnitCount={20}
          />
        </section>

        {/* 3. The Masterpiece Lesson Map (Reference A layout & illustrations in Reference B colors) */}
        <section aria-label="Lesson Journey Map" className="pt-2">
          <LessonMap
            stageId={activeStageId}
            activeUnit={activeUnit}
            unitLabel={currentUnit?.unitLabel || 'Home Row Foundations'}
            lessons={currentUnitLessons}
            activeLessonNum={recommended.stageId === activeStageId ? recommended.lessonNum : 1}
            onSelectLesson={handleSelectLesson}
            onSelectUnit={(unitNum) => setActiveUnit(unitNum)}
            unitsData={unitsData}
            unitProgress={unitProgress}
            unlockedUnitCount={20}
          />
        </section>
      </div>

      {/* 4. Bottom Shortcut Bar (Reference B) */}
      <ShortcutBar
        onNextLesson={() => handleSelectLesson(recommended.stageId, recommended.lessonNum)}
        onRestart={() => handleSelectLesson(activeStageId, 1)}
        onBack={onExit || (() => {})}
        systemStatus="System Online"
        isOnline={true}
      />
    </div>
  );
};
