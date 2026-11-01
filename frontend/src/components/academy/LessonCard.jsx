import React from 'react';
import { AcademyLevelCard } from './AcademyLevelCard';

/**
 * LessonCard
 * =========================================================================
 * Production illustrated card matching the reference screenshots.
 * Re-exports AcademyLevelCard with backward-compatible forwardRef support.
 */
export const LessonCard = React.forwardRef((props, ref) => {
  return <AcademyLevelCard ref={ref} {...props} />;
});

LessonCard.displayName = 'LessonCard';

export default LessonCard;
