import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  STAGE_META,
  getAllUnits,
  getLessonMetaByLevel,
  getNextLessonId,
  getLesson,
} from '../data/curriculumEngine';
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
  Grid,
  Layers,
} from 'lucide-react';

const VIEW = {
  DASHBOARD: 'dashboard',
  LESSON: 'lesson',
};

export const AcademyPage = ({ initialLevelId = 1, onExit }) => {
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialLessonParam = searchParams ? parseInt(searchParams.get('lesson'), 10) : null;
  const initialStageParam = searchParams ? parseInt(searchParams.get('stage'), 10) : null;
  const initialUnitParam = searchParams ? parseInt(searchParams.get('unit'), 10) : null;

  const [view, setView] = useState(initialLessonParam ? VIEW.LESSON : VIEW.DASHBOARD);
  const [activeStageId, setActiveStageId] = useState(initialStageParam || initialLevelId || 1);
  const [activeUnit, setActiveUnit] = useState(initialUnitParam || initialStageParam || initialLevelId || 1);
  const [activeLessonNum, setActiveLessonNum] = useState(initialLessonParam || 1);
  const [viewAllLevels, setViewAllLevels] = useState(false);
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
  const unitsData = useMemo(() => getAllUnits(), []);
  const currentUnit = unitsData[activeUnit - 1] || unitsData[0];

  // Global recommended next lesson across unlocked stages
  const recommended = useMemo(() => {
    if (!progress) return null;
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

  // Calculate unit completion and progress for all 7 stages
  const unitProgress = useMemo(() => {
    const map = {};
    unitsData.forEach((u) => {
      let done = 0;
      for (let l = u.startLesson; l <= u.endLesson; l++) {
        if (progress.lessons?.[`level_${l}`]?.completed || progress.lessons?.[`s${u.unitNumber}_l${l}`]?.completed) {
          done++;
        }
      }
      map[u.unitNumber] = {
        completed: done >= u.lessonsCount,
        count: done,
        total: u.lessonsCount,
      };
    });
    return map;
  }, [unitsData, progress]);

  const unlockedUnitCount = useMemo(() => {
    return Math.max(1, ...(progress.unlockedStages || [1]));
  }, [progress]);

  // Generate all lessons for the active view without arbitrary truncation
  const displayLessons = useMemo(() => {
    if (!progress) return [];
    if (viewAllLevels) {
      const all = [];
      for (let l = 1; l <= 60; l++) {
        const meta = getLessonMetaByLevel(l);
        const record = getLessonRecord(meta.stageId, l);
        const unlocked = isLessonUnlocked(meta.stageId, l);
        const isNextUp = (recommended.lessonNum === l);

        all.push({
          ...meta,
          record,
          unlocked,
          isNextUp,
        });
      }
      return all;
    }

    if (!currentUnit) return [];
    const lessons = [];
    const start = currentUnit.startLesson;
    const end = currentUnit.endLesson;

    for (let l = start; l <= end; l++) {
      const meta = getLessonMetaByLevel(l);
      const record = getLessonRecord(activeStageId, l);
      const unlocked = isLessonUnlocked(activeStageId, l);
      const isNextUp = (recommended.lessonNum === l);

      lessons.push({
        ...meta,
        record,
        unlocked,
        isNextUp,
      });
    }
    return lessons;
  }, [activeStageId, currentUnit, recommended, progress, viewAllLevels]);

  // Lesson selection handler
  const handleSelectLesson = useCallback((stageId, lessonNum) => {
    if (!isLessonUnlocked(stageId, lessonNum)) return;
    const lesson = getLesson(stageId, lessonNum);
    setActiveStageId(lesson ? lesson.stageId : stageId);
    setActiveLessonNum(lesson ? lesson.levelNumber : lessonNum);
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
                    <span className="text-[10px] text-[var(--accent)]">60 Core Levels</span>
                  </div>
                  <div className="space-y-1 mt-1 max-h-64 overflow-y-auto pr-1">
                    {STAGE_META.map((st) => {
                      const isStUnlocked = isStageUnlocked(st.stageId);
                      const isStActive = st.stageId === activeStageId && !viewAllLevels;

                      return (
                        <button
                          key={st.stageId}
                          type="button"
                          disabled={!isStUnlocked}
                          onClick={() => {
                            setActiveStageId(st.stageId);
                            setActiveUnit(st.stageId);
                            setViewAllLevels(false);
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

            {/* View Mode Toggle (Stage vs All 60 Levels) */}
            <div className="hidden sm:flex items-center rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] p-0.5">
              <button
                type="button"
                onClick={() => setViewAllLevels(false)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                  !viewAllLevels
                    ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-bold shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>By Stage</span>
              </button>
              <button
                type="button"
                onClick={() => setViewAllLevels(true)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                  viewAllLevels
                    ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-bold shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Grid className="w-3 h-3" />
                <span>All 60 Levels</span>
              </button>
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

        {/* 1. Dashboard Hero with 3 Statistics Cards */}
        <AcademyHero
          overallProgress={dashboardStats.overallProgress}
          completedUnits={dashboardStats.completedUnits}
          totalUnits={dashboardStats.totalUnits}
          streak={dashboardStats.streak}
          accuracy={dashboardStats.accuracy}
          accuracyChange={dashboardStats.accuracyChange}
        />

        {/* 2. Horizontal Stage Selector */}
        <section aria-label="Units Navigation" className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-[var(--text-secondary)]">
            <span className="font-semibold tracking-wider uppercase text-[11px] text-[var(--text-muted)]">
              Select Curriculum Stage (1–7):
            </span>
            <span className="text-[11px] text-[var(--text-secondary)]">
              {viewAllLevels ? (
                <span className="text-[var(--accent)] font-bold">Viewing All 60 Levels</span>
              ) : (
                <>
                  Active: <span className="text-[var(--accent)] font-bold">Stage {String(activeUnit).padStart(2, '0')}</span>
                </>
              )}
            </span>
          </div>

          <UnitSelector
            activeUnit={activeUnit}
            onSelectUnit={(unitNum) => {
              setActiveUnit(unitNum);
              setActiveStageId(unitNum);
              setViewAllLevels(false);
            }}
            unitProgress={unitProgress}
            unlockedUnitCount={unlockedUnitCount}
            totalUnits={unitsData.length}
          />
        </section>

        {/* 3. The Masterpiece Lesson Map */}
        <section aria-label="Lesson Journey Map" className="pt-2">
          <LessonMap
            stageId={activeStageId}
            activeUnit={viewAllLevels ? 1 : activeUnit}
            unitLabel={viewAllLevels ? 'Complete Curriculum (All 60 Levels)' : (currentUnit?.unitLabel || activeStageMeta.title)}
            lessons={displayLessons}
            activeLessonNum={recommended.lessonNum}
            onSelectLesson={handleSelectLesson}
            onSelectUnit={(unitNum) => {
              setActiveUnit(unitNum);
              setActiveStageId(unitNum);
              setViewAllLevels(false);
            }}
            unitsData={unitsData}
            unitProgress={unitProgress}
            unlockedUnitCount={unlockedUnitCount}
          />
        </section>
      </div>

      {/* 4. Bottom Shortcut Bar */}
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
