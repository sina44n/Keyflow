import React, { useRef, useState, useMemo } from 'react';
import { LessonCard } from './LessonCard';
import { PathConnector } from './PathConnector';
import { UnitElevator } from './UnitElevator';
import { AlertCircle, X } from 'lucide-react';

/**
 * Curated 20 progressive lesson definitions for Unit 1 matching the prompt.
 * Other units adapt with progressive skill titles.
 */
const UNIT_1_TITLES = [
  'Introduction to Home Row',
  'A S D F Keys',
  'J K L ; Keys',
  'Space Bar',
  'Home Row Practice',
  'Finger Position',
  'Typing the Basics',
  'Speed Drills',
  'Accuracy Drills',
  'Mixed Characters',
  'Word Practice',
  'Sentence Practice',
  'Paragraph Practice',
  'Speed Challenge',
  'Real Words',
  'Common Mistakes',
  'Punctuation Practice',
  'Advanced Sentences',
  'Timed Test',
  'Unit 01 Mastery',
];

const UNIT_ESTIMATED_MINUTES = [
  '2', '3', '3', '2', '4', '3', '3', '4', '4', '5',
  '4', '5', '6', '6', '5', '4', '5', '6', '5', '8',
];

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
  unlockedUnitCount = 20,
}) => {
  const containerRef = useRef(null);
  const cardRefs = useRef([]);
  const [lockedToast, setLockedToast] = useState(null);

  // Prepare 20 enriched lessons for this unit
  const displayLessons = useMemo(() => {
    return lessons.slice(0, 20).map((l, index) => {
      const customTitle = activeUnit === 1
        ? (UNIT_1_TITLES[index] || l.title)
        : l.title;

      const estimatedMinutes = UNIT_ESTIMATED_MINUTES[index] || '3';

      return {
        ...l,
        customTitle,
        estimatedMinutes,
      };
    });
  }, [lessons, activeUnit]);

  const handleLockedClick = (lessonNum) => {
    const requiredLessonNum = lessonNum > 1 ? lessonNum - 1 : 1;
    setLockedToast(`Complete Lesson ${requiredLessonNum} to unlock this module.`);
    setTimeout(() => {
      setLockedToast((current) => (current ? null : current));
    }, 3500);
  };

  return (
    <div className="space-y-6">
      {/* Unit Header Bar with Red Accent Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
        <div className="border-l-4 border-[var(--accent)] pl-3.5 space-y-0.5">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Unit {String(activeUnit).padStart(2, '0')} — <span className="text-[var(--text-primary)]">{unitLabel}</span>
          </h2>
          <div className="text-xs font-mono text-[var(--text-muted)]">
            Lessons 1 – 20
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
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1"
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
              const isCurrent = lesson.lessonNum === activeLessonNum && !lesson.record?.completed;

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

        {/* Right-Side Unit Elevator Panel (Reference A redesigned in Reference B) */}
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
