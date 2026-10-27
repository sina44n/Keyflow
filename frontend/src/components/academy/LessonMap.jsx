import React, { useRef, useState, useMemo } from 'react';
import { LessonCard } from './LessonCard';
import { PathConnector } from './PathConnector';
import { UnitElevator } from './UnitElevator';
import { AlertCircle, X } from 'lucide-react';

/**
 * LessonMap
 * =========================================================================
 * Displays interactive lesson destination cards arranged in a responsive grid
 * with dynamic SVG circuit connectors, status badges, and synchronized unit elevator.
 * Never truncates lessons; displays all modules in the active view.
 */
export const LessonMap = ({
  _stageId = 1,
  activeUnit = 1,
  unitLabel = 'Home Row Foundations',
  lessons = [],
  activeLessonNum = 1,
  onSelectLesson,
  onSelectUnit,
  unitsData = [],
  unitProgress = {},
  unlockedUnitCount = 7,
}) => {
  const containerRef = useRef(null);
  const cardRefs = useRef([]);
  const [lockedToast, setLockedToast] = useState(null);

  // Prepare enriched lessons without arbitrary truncation
  const displayLessons = useMemo(() => {
    return lessons.map((l) => {
      const estimatedMinutes = l.estimatedMinutes || String(Math.ceil((l.estimatedSeconds || 60) / 60)) || '3';
      return {
        ...l,
        customTitle: l.title,
        estimatedMinutes,
      };
    });
  }, [lessons]);

  const handleLockedClick = (lessonNum) => {
    const requiredLessonNum = lessonNum > 1 ? lessonNum - 1 : 1;
    setLockedToast(`Complete Lesson ${requiredLessonNum} to unlock this module.`);
    setTimeout(() => {
      setLockedToast((current) => (current ? null : current));
    }, 3500);
  };

  const firstLessonNum = displayLessons[0]?.levelNumber || displayLessons[0]?.lessonNum || 1;
  const lastLessonNum = displayLessons[displayLessons.length - 1]?.levelNumber || displayLessons[displayLessons.length - 1]?.lessonNum || displayLessons.length;

  return (
    <div className="space-y-6">
      {/* Unit Header Bar with Red Accent Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
        <div className="border-l-4 border-[var(--accent)] pl-3.5 space-y-0.5">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Stage {activeUnit} — <span className="text-[var(--text-primary)]">{unitLabel}</span>
          </h2>
          <div className="text-xs font-mono text-[var(--text-muted)]">
            Lessons {firstLessonNum} – {lastLessonNum} ({displayLessons.length} Modules)
          </div>
        </div>

        {/* Legend / Status hints */}
        <div className="flex items-center gap-4 text-[11px] font-mono text-[var(--text-secondary)] self-start sm:self-auto">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] shadow-[0_0_6px_var(--accent)]" />
            <span>Next Up</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--ui-success)]" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--border)]" />
            <span>Upcoming</span>
          </div>
        </div>
      </div>

      {/* Locked Requirement Toast Notification */}
      {lockedToast && (
        <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--accent)]/40 text-xs font-mono text-[var(--text-primary)] flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200 shadow-xl">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[var(--accent)] shrink-0" />
            <span>{lockedToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setLockedToast(null)}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Grid + Unit Elevator Layout */}
      <div className="flex flex-col lg:flex-row items-start gap-6 relative">
        {/* Lesson Map Cards with SVG Circuit Connector Network */}
        <div className="flex-1 w-full relative" ref={containerRef}>
          {/* Dynamic Glowing Circuit Pathways */}
          <PathConnector
            containerRef={containerRef}
            cardRefs={cardRefs}
            lessons={displayLessons}
            activeLessonNum={activeLessonNum}
          />

          {/* 5-Column Grid on Desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5 relative z-10">
            {displayLessons.map((lesson, idx) => {
              const isCurrent = (lesson.levelNumber || lesson.lessonNum) === activeLessonNum && !lesson.record?.completed;

              return (
                <LessonCard
                  key={lesson.id || idx}
                  ref={(el) => (cardRefs.current[idx] = el)}
                  lesson={lesson}
                  isCurrent={isCurrent}
                  onSelect={onSelectLesson}
                  onLockedClick={handleLockedClick}
                />
              );
            })}
          </div>
        </div>

        {/* Right-Side Unit Elevator Panel */}
        <div className="w-full lg:w-auto shrink-0">
          <UnitElevator
            activeUnit={activeUnit}
            onSelectUnit={onSelectUnit}
            unitsData={unitsData}
            unitProgress={unitProgress}
            unlockedUnitCount={unlockedUnitCount}
          />
        </div>
      </div>
    </div>
  );
};
