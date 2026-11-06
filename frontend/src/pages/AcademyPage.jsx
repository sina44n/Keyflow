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
import { PlacementModal } from '../components/academy/PlacementModal';
import { ExploreStageModal } from '../components/academy/ExploreStageModal';
import { useI18n } from '../i18n/I18nContext';
import {
  Lock,
  ChevronDown,
  Zap,
  Grid,
  Layers,
  Compass,
  Sparkles,
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

  let resolvedInitialStage = initialStageParam;
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

  // Multi-source persistence: recover saved stage from localStorage if not provided in URL
  if (!resolvedInitialStage && typeof window !== 'undefined') {
    try {
      const savedStage = parseInt(localStorage.getItem('keyflow_active_stage'), 10);
      if (savedStage >= 1 && savedStage <= 10) {
        resolvedInitialStage = savedStage;
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }

  // Fallback to recommended next lesson stage or initialLevelId or 1
  if (!resolvedInitialStage) {
    try {
      const rec = getNextRecommendedLesson(1);
      resolvedInitialStage = rec?.stageId || initialLevelId || 1;
    } catch {
      resolvedInitialStage = initialLevelId || 1;
    }
  }

  const resolvedInitialUnit = initialUnitParam || (resolvedInitialLesson ? Math.min(70, Math.ceil(resolvedInitialLesson / 10)) : 1);

  const [view, setView] = useState(resolvedInitialLesson ? VIEW.LESSON : VIEW.DASHBOARD);
  const [activeStageId, setActiveStageId] = useState(resolvedInitialStage || 1);
  const [activeUnit, setActiveUnit] = useState(resolvedInitialUnit);
  const [activeLessonNum, setActiveLessonNum] = useState(resolvedInitialLesson || 1);
  const [viewAllLevels, setViewAllLevels] = useState(false);
  const [progress, setProgress] = useState(getLessonProgress);
  const [dashboardStats, setDashboardStats] = useState(() => getAcademyDashboardStats(activeStageId || 1));
  const [stageMenuOpen, setStageMenuOpen] = useState(false);
  const [placementModalOpen, setPlacementModalOpen] = useState(false);
  const [exploreModalStage, setExploreModalStage] = useState(null);
  const stageMenuRef = useRef(null);

  // Persist active stage selection across browser reloads
  useEffect(() => {
    if (typeof window !== 'undefined' && activeStageId >= 1 && activeStageId <= 10) {
      try {
        localStorage.setItem('keyflow_active_stage', String(activeStageId));
      } catch {
        // Storage resilience
      }
    }
  }, [activeStageId]);

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

  // Stage metadata & Units for active stage (70 units per stage x 10 lessons = 700 lessons)
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
      setActiveUnit(Math.min(70, Math.ceil(targetLesson / 10)));
      setView(VIEW.LESSON);
    };

    window.addEventListener('keyflow-continue-practice', handleContinuePractice);
    return () => window.removeEventListener('keyflow-continue-practice', handleContinuePractice);
  }, [recommended, activeStageId]);

  // Calculate unit completion and progress for all 70 units of the active stage
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

  // Generate lessons for the active view (10 lessons for unit, or 700 lessons if viewing all)
  const displayLessons = useMemo(() => {
    if (!progress) return [];
    if (viewAllLevels) {
      const all = [];
      for (let l = 1; l <= 700; l++) {
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
    setActiveUnit(Math.min(70, Math.ceil(resolvedNum / 10)));
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

  // Learning path callbacks
  const handlePlacementApplied = useCallback((recommendedStage) => {
    refreshProgress();
    setActiveStageId(recommendedStage);
    setActiveUnit(1);
    setViewAllLevels(false);
  }, [refreshProgress]);

  const handleManualExploreConfirmed = useCallback((stageId) => {
    setExploreModalStage(null);
    refreshProgress();
    setActiveStageId(stageId);
    setActiveUnit(1);
    setViewAllLevels(false);
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
  const endLessonNum = viewAllLevels ? 700 : (currentUnit?.endLesson || 10);

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
            {/* View Mode Toggle: By Unit (10) vs All 700 Levels */}
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
                <span>All 700 Levels</span>
              </button>
            </div>

            {/* Path 02: Placement Diagnostic Entry Point */}
            <button
              type="button"
              onClick={() => setPlacementModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--accent)] text-xs font-mono text-[var(--text-primary)] shadow-xs transition-all cursor-pointer"
              title="Assess typing competencies and find your recommended starting stage"
            >
              <Compass className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Placement Test</span>
            </button>
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
            Left: Red Accent Bar with Stage Identity + Context & Select Stage Dropdown
            Right: ProgressStats Cards Stack (Progress % Ring, Streak, Accuracy)
        */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-2 border-b border-[var(--border)]">
          {/* Left Column: Contextual Hierarchy matching Reference Images */}
          <div className="space-y-2.5">
            {/* Red Accent Bar with Dynamic Active Stage Identity */}
            <div className="border-l-4 border-[var(--accent)] pl-3.5 space-y-1">
              <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
                Stage {activeStageId} — <span className="text-[var(--text-primary)]">{activeStageMeta.title}</span>
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-normal leading-relaxed max-w-2xl">
                {activeStageMeta.subtitle || activeStageMeta.objective}
              </p>
            </div>

            {/* Context & Select Stage Dropdown */}
            <div className="flex flex-wrap items-center gap-3 pt-0.5 pl-3.5" ref={stageMenuRef}>
              <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
                <span>
                  {viewAllLevels ? (
                    <>All 700 Lessons · Full Stage Overview</>
                  ) : (
                    <>Unit {activeUnit} of 70: <span className="text-[var(--text-primary)] font-semibold">{currentUnit?.unitLabel}</span></>
                  )}
                </span>
                <span className="text-[var(--border)]">•</span>
                <span>Lessons {startLessonNum}–{endLessonNum} ({displayLessons.length} Modules)</span>
              </div>

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
                  <div className="absolute left-0 top-full mt-2 z-50 w-80 sm:w-96 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] shadow-2xl p-2.5 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2 border-b border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                      <span className="font-bold">Curriculum Stages (10)</span>
                      <span className="text-[var(--accent)] font-bold">7,000 Levels Total</span>
                    </div>
                    <div className="space-y-1.5 mt-1.5 max-h-80 overflow-y-auto pr-1 no-scrollbar">
                      {STAGE_META.map((st) => {
                        const isStUnlocked = isStageUnlocked(st.stageId);
                        const isStActive = st.stageId === activeStageId;
                        const accessType = progress?.stageAccessTypes?.[st.stageId] || (isStUnlocked ? 'guided' : 'locked');
                        const isSelfPaced = accessType === 'self_paced' || Boolean(progress?.unlockedLevelsAll?.[st.stageId]);

                        return (
                          <div
                            key={st.stageId}
                            className={`p-2.5 rounded-xl border transition-all grid grid-cols-[1fr_auto] items-center gap-3 ${
                              isStActive
                                ? 'bg-[var(--bg-elevated)] border-2 border-[var(--accent)] text-[var(--text-primary)] shadow-xs'
                                : isStUnlocked
                                ? 'bg-[var(--bg-card)] border-[var(--border)] hover:border-[var(--accent)]/50'
                                : 'bg-[var(--bg-card)]/50 border-[var(--border-subtle)] opacity-70'
                            }`}
                          >
                            {/* Left Column: Stage Information (Flexible Width) */}
                            <button
                              type="button"
                              disabled={!isStUnlocked}
                              onClick={() => {
                                setActiveStageId(st.stageId);
                                setActiveUnit(1);
                                setViewAllLevels(false);
                                setStageMenuOpen(false);
                                if (typeof window !== 'undefined') {
                                  try {
                                    localStorage.setItem('keyflow_active_stage', String(st.stageId));
                                  } catch {}
                                }
                              }}
                              className={`min-w-0 text-left flex items-center gap-2.5 cursor-pointer ${
                                !isStUnlocked ? 'cursor-not-allowed' : ''
                              }`}
                            >
                              <span className="font-mono text-xs font-bold w-5 h-5 rounded-full bg-[var(--border)]/40 flex items-center justify-center text-center shrink-0">
                                {st.stageId}
                              </span>
                              <div className="flex flex-col min-w-0 overflow-hidden">
                                <span className="text-xs font-bold leading-tight truncate">{st.title}</span>
                                <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                                  <span className="text-[10px] text-[var(--text-muted)] leading-tight truncate shrink-0">
                                    {st.badge} · 700 Levels
                                  </span>
                                  {isSelfPaced ? (
                                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/15 text-cyan-500 shrink-0">
                                      Self-Paced
                                    </span>
                                  ) : isStUnlocked ? (
                                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[var(--accent)]/15 text-[var(--accent)] shrink-0">
                                      Unlocked
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </button>

                            {/* Right Column: Fixed-Width Action Column Ensuring Identical Vertical Axis Alignment */}
                            <div className="w-16 shrink-0 flex items-center justify-end">
                              {!isStUnlocked ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setStageMenuOpen(false);
                                    setExploreModalStage(st);
                                  }}
                                  className="w-16 h-7 inline-flex items-center justify-center text-[10px] font-mono font-bold rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-fg)] transition-colors cursor-pointer text-center"
                                  title="Unlock all 700 levels of this stage for self-paced practice"
                                >
                                  Explore
                                </button>
                              ) : !isSelfPaced ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setStageMenuOpen(false);
                                    setExploreModalStage(st);
                                  }}
                                  className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]/30 transition-colors cursor-pointer"
                                  title="Enable full self-paced access across all 700 levels"
                                >
                                  <Compass className="w-3.5 h-3.5" />
                                </button>
                              ) : null}
                            </div>
                          </div>
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
            unitLabel={viewAllLevels ? `All 700 Levels` : (currentUnit?.unitLabel || activeStageMeta.title)}
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

      {/* Path 02: Placement Assessment Modal */}
      <PlacementModal
        isOpen={placementModalOpen}
        onClose={() => setPlacementModalOpen(false)}
        onPlacementApplied={handlePlacementApplied}
      />

      {/* Path 03: Manual Self-Paced Unlock Confirmation Modal */}
      <ExploreStageModal
        isOpen={Boolean(exploreModalStage)}
        stageMeta={exploreModalStage}
        onClose={() => setExploreModalStage(null)}
        onConfirmed={handleManualExploreConfirmed}
      />

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
