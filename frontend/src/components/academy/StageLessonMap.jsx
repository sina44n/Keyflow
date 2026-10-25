import React, { useState, useMemo, useCallback } from 'react';
import { Lock, CheckCircle2, Zap } from 'lucide-react';
import { getStageUnits, getLessonMeta, STAGE_META } from '../../data/curriculumEngine';
import { isLessonUnlocked, getLessonRecord, getStageCompletedCount, getNextRecommendedLesson } from '../../utils/lessonProgress';

/**
 * StageLessonMap — Displays 600 lessons in 20 units of 30 each.
 * Uses pagination (one unit at a time) for performance.
 * Does NOT render 600 DOM nodes simultaneously.
 */
export const StageLessonMap = ({ stageId, onSelectLesson }) => {
  const [activeUnit, setActiveUnit] = useState(1);
  const stageMeta = STAGE_META[stageId - 1];
  const units = useMemo(() => getStageUnits(stageId), [stageId]);
  const recommended = useMemo(() => getNextRecommendedLesson(stageId), [stageId]);

  // When unit changes, scroll top
  const handleUnitChange = useCallback((unitNum) => {
    setActiveUnit(unitNum);
  }, []);

  const currentUnit = units[activeUnit - 1] || units[0];

  // Generate lesson metas for this unit (30 lessons)
  const unitLessons = useMemo(() => {
    if (!currentUnit) return [];
    const lessons = [];
    for (let l = currentUnit.startLesson; l <= currentUnit.endLesson; l++) {
      const meta = getLessonMeta(stageId, l);
      const record = getLessonRecord(stageId, l);
      const unlocked = isLessonUnlocked(stageId, l);
      const isRecommended = recommended.stageId === stageId && recommended.lessonNum === l;
      lessons.push({ ...meta, record, unlocked, isRecommended });
    }
    return lessons;
  }, [stageId, currentUnit, recommended]);

  const completedCount = useMemo(() => getStageCompletedCount(stageId), [stageId]);
  const completedPct = Math.round((completedCount / 600) * 100);

  if (!currentUnit) return null;

  return (
    <div className="space-y-5">
      {/* Stage header summary */}
      <div className="card-panel p-5 space-y-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">Stage {stageId} of 7</div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">{stageMeta.title}</h2>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)]">Progress</div>
            <div className="text-xl font-bold font-mono text-[var(--accent)]">{completedCount}<span className="text-sm text-[var(--text-muted)]"> / 600</span></div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="w-full h-2 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
          <div className="h-full rounded-full bg-[var(--accent)] transition-all" style={{ width: `${completedPct}%` }} />
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-mono">
          <span>{completedPct}% complete</span>
          {recommended.stageId === stageId && (
            <span className="ml-auto flex items-center gap-1 text-[var(--accent)]">
              <Zap className="w-3 h-3" />
              Resume: Lesson {recommended.lessonNum}
            </span>
          )}
        </div>
      </div>

      {/* Unit navigator */}
      <div className="space-y-2">
        <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">20 Units — Select a unit:</div>
        <div className="flex flex-wrap gap-2">
          {units.map((u) => {
            // Count completed in this unit
            let unitDone = 0;
            for (let l = u.startLesson; l <= u.endLesson; l++) {
              if (getLessonRecord(stageId, l)?.completed) unitDone++;
            }
            const unitComplete = unitDone >= 30;
            const isCurrent = u.unitNumber === activeUnit;
            return (
              <button
                key={u.unitNumber}
                type="button"
                onClick={() => handleUnitChange(u.unitNumber)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-all cursor-pointer ${
                  isCurrent
                    ? 'border-[var(--accent)] bg-[var(--bg-elevated)] text-[var(--accent)]'
                    : unitComplete
                    ? 'border-[var(--ui-success)]/50 bg-[var(--bg-surface)] text-[var(--ui-success)]'
                    : 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]'
                }`}
                title={u.unitLabel}
                aria-label={`Unit ${u.unitNumber}: ${u.unitLabel}`}
                aria-pressed={isCurrent}
              >
                {unitComplete ? '✓' : `U${u.unitNumber}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Current unit header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-[var(--text-primary)]">
            Unit {activeUnit}: {currentUnit.unitLabel}
          </div>
          <div className="text-xs text-[var(--text-muted)] font-mono">
            Lessons {currentUnit.startLesson}–{currentUnit.endLesson}
            {currentUnit.isAssessment && <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] border border-[var(--ui-warning)] text-[var(--ui-warning)]">Assessment</span>}
          </div>
        </div>
      </div>

      {/* 30 lessons grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {unitLessons.map((lesson) => (
          <button
            key={lesson.id}
            type="button"
            disabled={!lesson.unlocked}
            onClick={() => lesson.unlocked && onSelectLesson(lesson.stageId, lesson.lessonNum)}
            className={`relative p-3 rounded-xl border text-left transition-all cursor-pointer text-xs ${
              lesson.record?.completed
                ? 'border-[var(--ui-success)]/40 bg-[var(--bg-elevated)]'
                : lesson.isRecommended
                ? 'border-[var(--accent)] bg-[var(--bg-elevated)] ring-1 ring-[var(--accent)]/30'
                : lesson.unlocked
                ? 'border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--text-muted)]'
                : 'border-[var(--border-subtle)] bg-[var(--bg-surface)]/50 opacity-50 cursor-not-allowed'
            }`}
            title={lesson.title}
            aria-label={`Lesson ${lesson.lessonNum}: ${lesson.title}`}
            aria-disabled={!lesson.unlocked}
          >
            {/* Lesson number */}
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono font-bold text-[var(--text-muted)]">#{lesson.lessonNum}</span>
              <span>
                {lesson.record?.completed
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-[var(--ui-success)]" />
                  : !lesson.unlocked
                  ? <Lock className="w-3 h-3 text-[var(--text-muted)]" />
                  : lesson.isRecommended
                  ? <Zap className="w-3.5 h-3.5 text-[var(--accent)]" />
                  : null}
              </span>
            </div>

            {/* Stars if completed */}
            {lesson.record?.completed && lesson.record.stars > 0 && (
              <div className="flex gap-0.5 mb-1">
                {[1,2,3].map(s => (
                  <span key={s} className={`text-[9px] ${s <= lesson.record.stars ? 'text-amber-400' : 'text-[var(--border)]'}`}>★</span>
                ))}
              </div>
            )}

            {/* Best WPM if completed */}
            {lesson.record?.completed && (
              <div className="font-mono text-[9px] text-[var(--ui-success)]">{lesson.record.bestWpm} wpm</div>
            )}

            {/* Recommended badge */}
            {lesson.isRecommended && !lesson.record?.completed && (
              <div className="text-[9px] font-mono text-[var(--accent)] font-bold">Next up</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
