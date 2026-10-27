import React, { useState, useMemo, useCallback } from 'react';
import { Lock, CheckCircle2, Zap } from 'lucide-react';
import { getStageUnits, getLessonMeta, STAGE_META } from '../../data/curriculumEngine';
import { isLessonUnlocked, getLessonRecord, getStageCompletedCount, getNextRecommendedLesson } from '../../utils/lessonProgress';

/**
 * StageLessonMap — Displays lessons for a stage cleanly.
 */
export const StageLessonMap = ({ stageId, onSelectLesson }) => {
  const [activeUnit, setActiveUnit] = useState(1);
  const stageMeta = STAGE_META[stageId - 1] || STAGE_META[0];
  const units = useMemo(() => getStageUnits(stageId), [stageId]);
  const recommended = useMemo(() => getNextRecommendedLesson(stageId), [stageId]);

  const handleUnitChange = useCallback((unitNum) => {
    setActiveUnit(unitNum);
  }, []);

  const currentUnit = units[activeUnit - 1] || units[0];

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
  const totalStageLessons = stageMeta.totalLessons || 10;
  const completedPct = Math.min(100, Math.round((completedCount / totalStageLessons) * 100));

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
            <div className="text-xl font-bold font-mono text-[var(--accent)]">
              {completedCount}<span className="text-sm text-[var(--text-muted)]"> / {totalStageLessons}</span>
            </div>
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

      {/* Unit navigator if multiple units exist */}
      {units.length > 1 && (
        <div className="space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">Units:</div>
          <div className="flex flex-wrap gap-2">
            {units.map((u) => {
              let unitDone = 0;
              for (let l = u.startLesson; l <= u.endLesson; l++) {
                if (getLessonRecord(stageId, l)?.completed) unitDone++;
              }
              const unitComplete = unitDone >= u.lessonsCount;
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
      )}

      {/* Lesson Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {unitLessons.map((l) => (
          <button
            key={l.id}
            type="button"
            disabled={!l.unlocked}
            onClick={() => l.unlocked && onSelectLesson(stageId, l.lessonNum)}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              l.record?.completed
                ? 'border-[var(--ui-success)]/40 bg-[var(--bg-card)]'
                : l.isRecommended
                ? 'border-[var(--accent)] bg-[var(--bg-elevated)] shadow-md'
                : l.unlocked
                ? 'border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--accent)]/50'
                : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-sm font-bold text-[var(--text-primary)]">
                Level {l.lessonNum}
              </span>
              {l.record?.completed ? (
                <CheckCircle2 className="w-4 h-4 text-[var(--ui-success)]" />
              ) : !l.unlocked ? (
                <Lock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              ) : null}
            </div>
            <div className="text-xs font-medium text-[var(--text-secondary)] truncate">
              {l.title}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
