import React, { useState, useEffect, useCallback } from 'react';
import { STAGE_META, getNextLessonId } from '../data/curriculumEngine';
import {
  isStageUnlocked, isLessonUnlocked, getStageCompletedCount,
  getNextRecommendedLesson, getLessonProgress,
} from '../utils/lessonProgress';
import { LessonPlayer } from '../components/academy/LessonPlayer';
import { StageLessonMap } from '../components/academy/StageLessonMap';
import { Button } from '../components/common/Button';
import {
  BookOpen, Lock, ChevronRight, Zap, BarChart3,
  Trophy, ArrowLeft,
} from 'lucide-react';

// Views within the Academy
const VIEW = {
  OVERVIEW: 'overview',    // 7-stage grid overview
  STAGE: 'stage',          // Stage detail + lesson map
  LESSON: 'lesson',        // Active lesson player
};

export const AcademyPage = ({ initialLevelId = 1, onExit }) => {
  const [view, setView] = useState(VIEW.OVERVIEW);
  const [activeStageId, setActiveStageId] = useState(initialLevelId || 1);
  const [activeLessonNum, setActiveLessonNum] = useState(1);
  const [progress, setProgress] = useState(getLessonProgress);

  // Refresh progress on external updates
  useEffect(() => {
    const handler = () => setProgress(getLessonProgress());
    window.addEventListener('keyflow-lesson-progress-updated', handler);
    return () => window.removeEventListener('keyflow-lesson-progress-updated', handler);
  }, []);

  const handleSelectStage = useCallback((stageId) => {
    if (!isStageUnlocked(stageId)) return;
    setActiveStageId(stageId);
    setView(VIEW.STAGE);
  }, []);

  const handleSelectLesson = useCallback((stageId, lessonNum) => {
    if (!isLessonUnlocked(stageId, lessonNum)) return;
    setActiveStageId(stageId);
    setActiveLessonNum(lessonNum);
    setView(VIEW.LESSON);
  }, []);

  const handleNextLesson = useCallback(() => {
    const next = getNextLessonId(activeStageId, activeLessonNum);
    if (!next) return;
    if (next.stageId === activeStageId) {
      setActiveLessonNum(next.lessonNum);
    } else {
      setActiveStageId(next.stageId);
      setActiveLessonNum(next.lessonNum);
    }
  }, [activeStageId, activeLessonNum]);

  const handleBackToStage = useCallback(() => {
    setView(VIEW.STAGE);
  }, []);

  const handleBackToOverview = useCallback(() => {
    setView(VIEW.OVERVIEW);
  }, []);

  const activeStageMeta = STAGE_META[activeStageId - 1];
  const nextLessonId = getNextLessonId(activeStageId, activeLessonNum);
  const hasNextLesson = nextLessonId !== null && nextLessonId.stageId === activeStageId;
  const hasNextStage = nextLessonId !== null && nextLessonId.stageId !== activeStageId;

  // Recommended lesson across all stages
  const recommended = getNextRecommendedLesson(
    progress.unlockedStages?.[progress.unlockedStages.length - 1] ?? 1
  );

  return (
    <div className="container-app py-8 sm:py-12 space-y-6">
      {/* Breadcrumb header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          {onExit && (
            <Button variant="outline" size="sm" onClick={onExit}>← Home</Button>
          )}
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-[11px] font-mono text-[var(--accent)]">
              <BookOpen className="w-3 h-3" />
              <span>7-Stage Neuromuscular Academy — 4,200 Lessons</span>
            </div>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mt-1 text-sm font-semibold text-[var(--text-primary)]">
              <button
                type="button"
                onClick={handleBackToOverview}
                className={`hover:text-[var(--accent)] transition-colors ${view === VIEW.OVERVIEW ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`}
              >
                Academy
              </button>
              {view !== VIEW.OVERVIEW && (
                <>
                  <span className="text-[var(--text-muted)]">/</span>
                  <button
                    type="button"
                    onClick={handleBackToStage}
                    className={`hover:text-[var(--accent)] transition-colors ${view === VIEW.STAGE ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`}
                  >
                    {activeStageMeta?.title}
                  </button>
                </>
              )}
              {view === VIEW.LESSON && (
                <>
                  <span className="text-[var(--text-muted)]">/</span>
                  <span className="text-[var(--text-primary)]">Lesson {activeLessonNum}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Overall progress */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="bg-[var(--bg-elevated)] px-3 py-1.5 rounded-lg border border-[var(--border)] flex items-center gap-2">
            <span className="text-[var(--text-muted)]">Stages Unlocked:</span>
            <span className="font-bold text-[var(--accent)]">{progress.unlockedStages?.length ?? 1} / 7</span>
          </div>
          {recommended && (
            <Button
              variant="primary"
              size="sm"
              icon={Zap}
              onClick={() => handleSelectLesson(recommended.stageId, recommended.lessonNum)}
            >
              Resume
            </Button>
          )}
        </div>
      </div>

      {/* Views */}
      {view === VIEW.OVERVIEW && (
        <AcademyOverview
          progress={progress}
          onSelectStage={handleSelectStage}
          onResumeLesson={(stageId, lessonNum) => {
            setActiveStageId(stageId);
            setActiveLessonNum(lessonNum);
            setView(VIEW.LESSON);
          }}
        />
      )}

      {view === VIEW.STAGE && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" icon={ArrowLeft} onClick={handleBackToOverview}>
              All Stages
            </Button>
          </div>
          <StageLessonMap
            stageId={activeStageId}
            onSelectLesson={handleSelectLesson}
          />
        </div>
      )}

      {view === VIEW.LESSON && (
        <LessonPlayer
          stageId={activeStageId}
          lessonNum={activeLessonNum}
          onBack={handleBackToStage}
          onNextLesson={hasNextLesson ? handleNextLesson : undefined}
          onNextStage={hasNextStage ? () => {
            const next = getNextLessonId(activeStageId, activeLessonNum);
            if (next) {
              setActiveStageId(next.stageId);
              setActiveLessonNum(next.lessonNum);
            }
          } : undefined}
          hasNextLesson={hasNextLesson}
          hasNextStage={hasNextStage}
        />
      )}
    </div>
  );
};

// ============================================================
// Academy Overview — 7 Stage Cards
// ============================================================
function AcademyOverview({ progress, onSelectStage, onResumeLesson }) {
  const stageColors = {
    emerald: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', text: '#10b981' },
    blue:    { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)', text: '#3b82f6' },
    violet:  { bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.3)', text: '#8b5cf6' },
    amber:   { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', text: '#f59e0b' },
    cyan:    { bg: 'rgba(6,182,212,0.1)',  border: 'rgba(6,182,212,0.3)',  text: '#06b6d4' },
    rose:    { bg: 'rgba(244,63,94,0.1)',  border: 'rgba(244,63,94,0.3)',  text: '#f43f5e' },
    orange:  { bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.3)', text: '#f97316' },
  };

  const unlockedStages = progress.unlockedStages ?? [1];

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="max-w-2xl">
        <h1 className="text-2xl font-extrabold text-[var(--text-primary)] mb-2">
          Neuromuscular Typing Academy
        </h1>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          Seven structured stages with 600 individual lessons each — 4,200 lessons total.
          Progress from tactile home-row anchoring through sentence rhythm to full precision mastery.
        </p>
      </div>

      {/* 7 stage cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {STAGE_META.map((stage) => {
          const unlocked = unlockedStages.includes(stage.stageId);
          const completedCount = getStageCompletedCount(stage.stageId);
          const completedPct = Math.round((completedCount / 600) * 100);
          const colorScheme = stageColors[stage.color] ?? stageColors.emerald;
          const nextLesson = getNextRecommendedLesson(stage.stageId);

          return (
            <button
              key={stage.stageId}
              type="button"
              disabled={!unlocked}
              onClick={() => onSelectStage(stage.stageId)}
              className={`text-left p-5 rounded-2xl border transition-all duration-150 space-y-4 group ${
                unlocked
                  ? 'cursor-pointer hover:shadow-lg'
                  : 'opacity-50 cursor-not-allowed'
              }`}
              style={{
                background: unlocked ? colorScheme.bg : 'var(--bg-surface)',
                borderColor: unlocked ? colorScheme.border : 'var(--border)',
              }}
              aria-label={`Stage ${stage.stageId}: ${stage.title}${unlocked ? '' : ' (locked)'}`}
            >
              {/* Stage number + badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-lg"
                    style={{
                      background: unlocked ? colorScheme.text : 'var(--bg-elevated)',
                      color: unlocked ? '#fff' : 'var(--text-muted)',
                    }}
                  >
                    {completedPct >= 100 ? '✓' : unlocked ? stage.stageId : <Lock className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider" style={{ color: unlocked ? colorScheme.text : 'var(--text-muted)' }}>
                      Stage {stage.stageId} of 7
                    </div>
                    <div className="text-sm font-bold text-[var(--text-primary)]">{stage.title}</div>
                  </div>
                </div>
                {unlocked && <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:translate-x-0.5 transition-transform" />}
              </div>

              {/* Subtitle */}
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{stage.subtitle}</p>

              {/* Progress bar */}
              {unlocked && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono" style={{ color: colorScheme.text }}>
                    <span>{completedCount} lessons done</span>
                    <span>{completedPct}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${completedPct}%`, background: colorScheme.text }}
                    />
                  </div>
                </div>
              )}

              {/* Stats row */}
              <div className="flex items-center gap-3 text-[10px] font-mono text-[var(--text-muted)]">
                <span>{stage.totalLessons} lessons</span>
                <span>•</span>
                <span>{stage.targetWpm} WPM gate</span>
                <span>•</span>
                <span>{stage.targetAccuracy}% acc gate</span>
              </div>

              {/* Resume button */}
              {unlocked && nextLesson.stageId === stage.stageId && completedPct < 100 && (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onResumeLesson) onResumeLesson(stage.stageId, nextLesson.lessonNum);
                  }}
                  className="text-[10px] font-mono font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                  style={{ color: colorScheme.text }}
                >
                  <Zap className="w-3 h-3" />
                  Resume lesson {nextLesson.lessonNum}
                </div>
              )}

              {!unlocked && (
                <div className="text-[10px] font-mono text-[var(--text-muted)] flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Complete Stage {stage.stageId - 1} to unlock
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Curriculum stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        {[
          { label: 'Total Lessons', value: '4,200', icon: BookOpen },
          { label: 'Stages', value: '7', icon: Trophy },
          { label: 'Lessons / Stage', value: '600', icon: BarChart3 },
          { label: 'Units / Stage', value: '20', icon: Zap },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card-panel p-3 flex items-center gap-3">
              <Icon className="w-4 h-4 text-[var(--accent)] shrink-0" />
              <div>
                <div className="text-[10px] uppercase font-mono text-[var(--text-muted)]">{stat.label}</div>
                <div className="text-lg font-bold font-mono text-[var(--text-primary)]">{stat.value}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
