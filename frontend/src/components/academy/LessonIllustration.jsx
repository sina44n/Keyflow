import React from 'react';
import { AcademyIllustrationEngine } from './AcademyIllustrationEngine';

/**
 * LessonIllustration
 * =========================================================================
 * Production vector illustration component matching the warm, illustrated
 * Academy aesthetic from the reference designs.
 * Backwards-compatible wrapper delegating to AcademyIllustrationEngine.
 */
export const LessonIllustration = ({
  lessonIndex = 1,
  lesson = null,
  className = "w-24 h-20",
  isHovered = false,
  isCurrent = false,
  isCompleted = false,
  isLocked = false,
}) => {
  const resolvedLesson = lesson || {
    lessonNum: lessonIndex,
    levelNumber: lessonIndex,
    title: `Lesson ${lessonIndex}`,
    skills: [],
    targetKeys: ['F', 'J'],
  };

  return (
    <AcademyIllustrationEngine
      lesson={resolvedLesson}
      isHovered={isHovered}
      isCurrent={isCurrent}
      isCompleted={isCompleted}
      isLocked={isLocked}
      className={className}
    />
  );
};
