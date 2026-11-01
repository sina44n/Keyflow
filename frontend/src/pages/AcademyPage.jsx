import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { ProgressStats } from '../components/academy/ProgressStats';
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
  ArrowLeft,
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
  const stageMenuRef = useRef(null);

  // Close stage dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (stageMenuRef.current && !stageMenuRef.current.contains(e.target)) {
        setStageMenuOpen(false);
      }
    };
    if (stageMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [stageMenuOpen]);

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

  const startLessonNum = viewAllLevels ? 1 : (currentUnit?.startLesson || 1);
  const endLessonNum = viewAllLevels ? 600 : (currentUnit?.endLesson || 20);

  return (
    <div className="relative min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] pb-16 overflow-x-hidden selection:bg-[var(--accent)] selection:text-[var(--accent-fg)]">
      {/* Subtle Atmospheric Background Glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-25"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 50% -10%, color-mix(in srgb, var(--accent) 14%, transparent) 0%, transparent 60%),
            radial-gradient(ellipse at 95% 40%, color-mix(in srgb, var(--accent) 7%, transparent) 0%, transparent 45%),
            radial-gradient(ellipse at 5% 85%, color-mix(in srgb, var(--accent) 5%, transparent) 0%, transparent 50%)
          `,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 container-app py-5 sm:py-6 space-y-6">
        {/* Top Control Bar (Navigation & Mode Toggles) */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 sm:gap-3">
            {onExit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExit}
                className="border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-card)] rounded-xl text-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                {t('nav.home')}
              </Button>
            )}

            {/* View Mode Toggle: By Unit (20) vs All 600 Levels */}
            <div className="flex items-center rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-0.5">
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
                <span>By Unit</span>
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
                <span>All 600 Levels</span>
              </button>
            </div>
          </div>

          {/* Recommended Next Lesson Resume Pill */}
          <div className="flex items-center gap-2.5">
            <span className="text-[var(--text-muted)] hidden md:inline text-[11px]">
              Next Up: <span className="text-[var(--accent)] font-bold">Stage {recommended.stageId} Level {recommended.lessonNum}</span>
            </span>
            <button
              type="button"
              onClick={() => handleSelectLesson(recommended.stageId, recommended.lessonNum)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--accent)] text-[var(--accent-fg)] text-xs font-mono font-bold shadow-sm hover:opacity-90 transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Resume Lesson</span>
            </button>
          </div>
        </div>

        {/* Unified Reference Header Section:
            Left: Red Accent Bar with Unit Title + Stage Name with Select Stage Dropdown
            Right: ProgressStats Cards Stack (Progress % Ring, Streak, Accuracy)
        */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-2 border-b border-[var(--border)]">
          {/* Left Column: Contextual Hierarchy matching Reference Images */}
          <div className="space-y-2.5">
            {/* Red Accent Bar with Unit Number & Subtitle */}
            <div className="border-l-4 border-[var(--accent)] pl-3.5 space-y-0.5">
              <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
                {viewAllLevels ? (
                  <>Stage {activeStageId} — <span className="text-[var(--text-primary)]">All 600 Levels</span></>
                ) : (
                  <>Unit {activeUnit} — <span className="text-[var(--text-primary)]">{currentUnit?.unitLabel}</span></>
                )}
              </h2>
              <div className="text-xs font-mono text-[var(--text-muted)]">
                Lessons {startLessonNum} - {endLessonNum} ({displayLessons.length} Modules)
              </div>
            </div>

            {/* Stage Title + Select Stage Dropdown */}
            <div className="flex items-center gap-3 pt-1 pl-3.5" ref={stageMenuRef}>
              <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
                {activeStageMeta.title}
              </h3>

              {/* Select Stage Dropdown Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setStageMenuOpen(!stageMenuOpen)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--accent)] text-xs font-mono text-[var(--text-primary)] cursor-pointer shadow-xs transition-all"
                  aria-expanded={stageMenuOpen}
                  aria-label="Select Curriculum Stage"
                >
                  <span className="font-semibold text-xs">Select Stage</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                </button>

                {/* Stage Flyout Menu */}
                {stageMenuOpen && (
                  <div className="absolute left-0 top-full mt-2 z-50 w-72 sm:w-80 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2 border-b border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                      <span className="font-bold">Curriculum Stages (7)</span>
                      <span className="text-[var(--accent)] font-bold">4,200 Levels Total</span>
                    </div>
                    <div className="space-y-1 mt-1 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
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
                              setViewAllLevels(false);
                              setStageMenuOpen(false);
                            }}
                            className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                              isStActive
                                ? 'bg-[var(--bg-elevated)] border-2 border-[var(--accent)] text-[var(--text-primary)] shadow-xs'
                                : isStUnlocked
                                ? 'hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
                                : 'opacity-40 cursor-not-allowed text-[var(--text-muted)] border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="font-mono text-xs font-bold w-5 h-5 rounded-full bg-[var(--border)]/40 flex items-center justify-center text-center">
                                {st.stageId}
                              </span>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold leading-tight">{st.title}</span>
                                <span className="text-[10px] text-[var(--text-muted)] leading-tight truncate max-w-[180px]">
                                  {st.badge} · 600 Levels
                                </span>
                              </div>
                            </div>
                            {!isStUnlocked && <Lock className="w-3.5 h-3.5 text-[var(--text-muted)]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Protected ProgressStats Component Rendered As-Is */}
          <div className="w-full lg:w-auto shrink-0">
            <ProgressStats
              overallProgress={dashboardStats.overallProgress}
              completedUnits={dashboardStats.completedUnits}
              totalUnits={dashboardStats.totalUnits}
              streak={dashboardStats.streak}
              accuracy={dashboardStats.accuracy}
              accuracyChange={dashboardStats.accuracyChange}
            />
          </div>
        </div>

        {/* Main Lesson Map: 5-Column Illustrated Level Cards + Curriculum Sidebar */}
        <section aria-label="Curriculum Level Matrix" className="pt-1">
          <LessonMap
            stageId={activeStageId}
            activeUnit={activeUnit}
            unitLabel={viewAllLevels ? `All 600 Levels` : (currentUnit?.unitLabel || activeStageMeta.title)}
            lessons={displayLessons}
            activeLessonNum={recommended.lessonNum}
            onSelectLesson={handleSelectLesson}
            onSelectUnit={handleSelectUnit}
            unitsData={stageUnits}
            unitProgress={unitProgress}
            unlockedUnitCount={unlockedUnitCount}
            viewAllLevels={viewAllLevels}
          />
        </section>
      </div>

      {/* Bottom Sticky Shortcut Bar */}
      <ShortcutBar
        onNextLesson={() => handleSelectLesson(recommended.stageId, recommended.lessonNum)}
        onRestart={() => handleSelectLesson(activeStageId, 1)}
        onBack={onExit || (() => {})}
        systemStatus="KEYFLOW Academy Engine Online"
        isOnline={true}
      />
    </div>
  );
};

export default AcademyPage;
