import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  STAGE_META,
  getLessonMeta,
  getStageUnits,
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
import { useI18n } from '../i18n/I18nContext';
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
  const { t } = useI18n();
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const rawLessonParam = searchParams ? searchParams.get('lesson') : null;
  const initialStageParam = searchParams ? parseInt(searchParams.get('stage'), 10) : null;
  const initialUnitParam = searchParams ? parseInt(searchParams.get('unit'), 10) : null;

  let resolvedInitialStage = initialStageParam || 1;
  let resolvedInitialLesson = null;

  if (rawLessonParam) {
    const sMatch = String(rawLessonParam).match(/^S(\d+)-L(\d+)$/i);
    if (sMatch) {
      resolvedInitialStage = parseInt(sMatch[1], 10);
      resolvedInitialLesson = parseInt(sMatch[2], 10);
    } else {
      const num = parseInt(rawLessonParam, 10);
      if (!isNaN(num)) {
        resolvedInitialLesson = num;
      }
    }
  }

  const resolvedInitialUnit = initialUnitParam || (resolvedInitialLesson ? Math.min(30, Math.ceil(resolvedInitialLesson / 20)) : 1);

  const [view, setView] = useState(resolvedInitialLesson ? VIEW.LESSON : VIEW.DASHBOARD);
  const [activeStageId, setActiveStageId] = useState(resolvedInitialStage || initialLevelId || 1);
  const [activeUnit, setActiveUnit] = useState(resolvedInitialUnit);
  const [activeLessonNum, setActiveLessonNum] = useState(resolvedInitialLesson || 1);
  const [viewAllLevels, setViewAllLevels] = useState(false);
  const [progress, setProgress] = useState(getLessonProgress);
  const [dashboardStats, setDashboardStats] = useState(() => getAcademyDashboardStats(activeStageId || 1));
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

  // Stage metadata & Units for active stage (30 units per stage x 20 lessons = 600 lessons)
  const activeStageMeta = STAGE_META[activeStageId - 1] || STAGE_META[0];
  const stageUnits = useMemo(() => getStageUnits(activeStageId), [activeStageId]);
  const currentUnit = stageUnits[activeUnit - 1] || stageUnits[0];

  // Global recommended next lesson across unlocked stages
  const recommended = useMemo(() => {
    if (!progress) return { stageId: activeStageId, lessonNum: 1 };
    return getNextRecommendedLesson(activeStageId);
  }, [activeStageId, progress]);

  // Handle "Continue Practice" event dispatched from Navbar or Hero
  useEffect(() => {
    const handleContinuePractice = () => {
      const targetStage = recommended?.stageId || activeStageId;
      const targetLesson = recommended?.lessonNum || 1;
      setActiveStageId(targetStage);
      setActiveLessonNum(targetLesson);
      setActiveUnit(Math.min(30, Math.ceil(targetLesson / 20)));
      setView(VIEW.LESSON);
    };

    window.addEventListener('keyflow-continue-practice', handleContinuePractice);
    return () => window.removeEventListener('keyflow-continue-practice', handleContinuePractice);
  }, [recommended, activeStageId]);

  // Calculate unit completion and progress for all 30 units of the active stage
  const unitProgress = useMemo(() => {
    const map = {};
    stageUnits.forEach((u) => {
      let done = 0;
      for (let l = u.startLesson; l <= u.endLesson; l++) {
        const record = getLessonRecord(activeStageId, l);
        if (record?.completed) {
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
  }, [stageUnits, activeStageId, progress]);

  const unlockedUnitCount = useMemo(() => {
    let highest = 1;
    for (const u of stageUnits) {
      if (u.unitNumber === 1 || isLessonUnlocked(activeStageId, u.startLesson)) {
        highest = Math.max(highest, u.unitNumber);
      }
    }
    return highest;
  }, [stageUnits, activeStageId, progress]);

  const handleSelectUnit = useCallback((unitNum) => {
    setActiveUnit(unitNum);
    setViewAllLevels(false);
  }, []);

  // Generate lessons for the active view (20 lessons for unit, or 600 lessons if viewing all)
  const displayLessons = useMemo(() => {
    if (!progress) return [];
    if (viewAllLevels) {
      const all = [];
      for (let l = 1; l <= 600; l++) {
        const meta = getLessonMeta(activeStageId, l);
        const record = getLessonRecord(activeStageId, l);
        const unlocked = isLessonUnlocked(activeStageId, l);
        const isNextUp = (recommended?.stageId === activeStageId && recommended?.lessonNum === l);

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
      const meta = getLessonMeta(activeStageId, l);
      const record = getLessonRecord(activeStageId, l);
      const unlocked = isLessonUnlocked(activeStageId, l);
      const isNextUp = (recommended?.stageId === activeStageId && recommended?.lessonNum === l);

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
    const resolvedStage = lesson ? lesson.stageId : stageId;
    const resolvedNum = lesson ? lesson.levelNumber : lessonNum;
    setActiveStageId(resolvedStage);
    setActiveLessonNum(resolvedNum);
    setActiveUnit(Math.min(30, Math.ceil(resolvedNum / 20)));
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
                ← {t('nav.home')}
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
                <span className="text-[var(--text-secondary)]">{t('academy.stage_label', { id: activeStageId })}:</span>
                <span className="font-bold text-[var(--text-primary)]">{activeStageMeta.title}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] ml-1" />
              </button>

              {/* Stage Selection Flyout */}
              {stageMenuOpen && (
                <div className="absolute left-0 top-full mt-2 z-50 w-72 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
                    <span>{t('academy.stages_count', { count: 7 })}</span>
                    <span className="text-[10px] text-[var(--accent)] font-bold">{t('academy.levels_count', { count: 600 })}</span>
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
                            setActiveUnit(1);
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

            {/* View Mode Toggle (Stage vs All 600 Levels) */}
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
                <span>{t('academy.by_unit')}</span>
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
                <span>{t('academy.all_levels', { count: 600 })}</span>
              </button>
            </div>
          </div>

          {/* Quick Resume Link */}
          <div className="flex items-center gap-3">
            <span className="text-[var(--text-muted)] hidden sm:inline">
              {t('academy.recommended')}: <span className="text-[var(--accent)] font-bold">{t('academy.stage_label', { id: recommended.stageId })} L{recommended.lessonNum}</span>
            </span>
            <button
              type="button"
              onClick={() => handleSelectLesson(recommended.stageId, recommended.lessonNum)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--accent)]/40 hover:border-[var(--accent)] text-[var(--accent)] hover:text-[var(--accent-fg)] hover:bg-[var(--accent)] text-xs font-mono font-bold shadow-xs transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{t('academy.resume')}</span>
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
              Select Curriculum Unit (1–{stageUnits.length}):
            </span>
            <span className="text-[11px] text-[var(--text-secondary)]">
              {viewAllLevels ? (
                <span className="text-[var(--accent)] font-bold">Viewing All 600 Levels of Stage {activeStageId}</span>
              ) : (
                <>
                  Active: <span className="text-[var(--accent)] font-bold">Unit {String(activeUnit).padStart(2, '0')}</span> ({currentUnit?.unitLabel})
                </>
              )}
            </span>
          </div>

          <UnitSelector
            activeUnit={activeUnit}
            onSelectUnit={handleSelectUnit}
            unitProgress={unitProgress}
            unlockedUnitCount={unlockedUnitCount}
            totalUnits={stageUnits.length}
          />
        </section>

        {/* 3. The Masterpiece Lesson Map */}
        <section aria-label="Lesson Journey Map" className="pt-2">
          <LessonMap
            stageId={activeStageId}
            activeUnit={viewAllLevels ? 1 : activeUnit}
            unitLabel={viewAllLevels ? `Stage ${activeStageId}: ${activeStageMeta.title} (All 600 Levels)` : (currentUnit?.unitLabel || activeStageMeta.title)}
            lessons={displayLessons}
            activeLessonNum={recommended.lessonNum}
            onSelectLesson={handleSelectLesson}
            onSelectUnit={handleSelectUnit}
            unitsData={stageUnits}
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
