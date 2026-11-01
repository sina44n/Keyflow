import React from 'react';
import { AcademyCurriculumSidebar } from './AcademyCurriculumSidebar';

/**
 * UnitElevator
 * =========================================================================
 * Production curriculum navigation sidebar matching the reference screenshots.
 * Re-exports AcademyCurriculumSidebar with backward-compatible prop support.
 */
export const UnitElevator = (props) => {
  return <AcademyCurriculumSidebar {...props} />;
};

export default UnitElevator;
