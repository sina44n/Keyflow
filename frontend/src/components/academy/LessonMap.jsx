import React, { useRef, useState, useMemo } from 'react';
import { AcademyLevelCard } from './AcademyLevelCard';
import { AcademyCurriculumSidebar } from './AcademyCurriculumSidebar';
import { AlertCircle, X } from 'lucide-react';

/**
 * LessonMap
 * =========================================================================
 * Production interactive lesson map matching the reference screenshots:
 * - 5-column grid of rich, illustrated AcademyLevelCards on desktop
 * - Independent vertically scrollable Curriculum sidebar on the right
 * - High-performance virtualized rendering for up to 600 levels per stage
 * - Locked module feedback and accessible keyboard navigation
 */
export const LessonMap = ({
  stageId = 1,
  activeUnit = 1,
  unitLabel = 'Home Row Foundations',
  lessons = [],
  activeLessonNum = 1,
  onSelectLesson,
  onSelectUnit,
  unitsData = [],
  unitProgress = {},
  unlockedUnitCount = 30,
  viewAllLevels = false,
}) => {
  const containerRef = useRef(null);
  const cardRefs = useRef([]);
  const [lockedToast, setLockedToast] = useState(null);

  // Locked click notification
  const handleLockedClick = (lessonNum) => {
    const requiredLessonNum = lessonNum > 1 ? lessonNum - 1 : 1;
    setLockedToast(`Complete Lesson ${requiredLessonNum} to unlock this module.`);
    setTimeout(() => {
      setLockedToast((current) => (current ? null : current));
    }, 3500);
  };

  return (
    <div className="space-y-4">
      {/* Locked Requirement Toast Notification */}
      {lockedToast && (
        <div className="p-3 rounded-xl bg-[#FFFDFB] dark:bg-[#251D19] border border-[var(--accent)]/50 text-xs font-mono text-[var(--text-primary)] flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200 shadow-xl">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[var(--accent)] shrink-0" />
            <span>{lockedToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setLockedToast(null)}
            className="text-[#A59285] hover:text-[var(--text-primary)] p-1 cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Layout: 5-Column Level Cards Grid + Curriculum Sidebar */}
      <div className="flex flex-col lg:flex-row items-start gap-5 sm:gap-6 relative">
        {/* Main Level Cards Grid Container */}
        <div className="flex-1 w-full" ref={containerRef}>
          <div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4 relative z-10"
            style={{
              // CSS containment for 600-level high performance scrolling
              contain: 'layout style',
            }}
          >
            {lessons.map((lesson, idx) => {
              const lessonNum = lesson.levelNumber || lesson.lessonNum || (idx + 1);
              const isCurrent = lessonNum === activeLessonNum && !lesson.record?.completed;

              return (
                <div
                  key={lesson.id || `level-${stageId}-${lessonNum}`}
                  style={{
                    // Browser content-visibility optimization skips rendering off-screen cards
                    contentVisibility: lessons.length > 30 ? 'auto' : 'visible',
                    containIntrinsicSize: '210px',
                  }}
                >
                  <AcademyLevelCard
                    ref={(el) => (cardRefs.current[idx] = el)}
                    lesson={lesson}
                    isCurrent={isCurrent}
                    onSelect={onSelectLesson}
                    onLockedClick={handleLockedClick}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right-Side Curriculum Navigation Sidebar */}
        <div className="w-full lg:w-auto shrink-0">
          <AcademyCurriculumSidebar
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

export default LessonMap;
