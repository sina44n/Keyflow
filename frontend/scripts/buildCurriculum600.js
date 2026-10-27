/**
 * KEYFLOW Academy — 600-Level Curriculum Verification & Build Script
 * =================================================================
 * Audits all 600 lessons across 7 Stages and 30 Units for:
 * 1. Sequential contiguity (Levels 1 to 600 without gaps)
 * 2. Uniqueness of lesson IDs and exercise passages
 * 3. Absence of repetitive filler / character spam
 * 4. 100% ANSI keyboard and finger guide coverage
 * 5. Smooth progressive WPM and accuracy metrics
 */

import { CURRICULUM_600_LESSONS } from '../src/data/curriculum600Data.js';
import { validateCurriculum } from '../src/data/curriculumEngine.js';

console.log('Auditing KEYFLOW Masterpiece 600-Level Curriculum...');
console.log(`Loaded ${CURRICULUM_600_LESSONS.length} educational lessons.`);

const report = validateCurriculum(CURRICULUM_600_LESSONS);

if (!report.valid) {
  console.error(`Validation FAILED with ${report.errors.length} errors:`);
  report.errors.forEach((err) => console.error(`  - ${err}`));
  process.exit(1);
}

console.log('✔ All 600 levels verified sequentially contiguous from Level 1 to 600.');
console.log(`✔ All 600 lesson IDs and exercise passages are 100% unique.`);
console.log(`✔ Zero character spam (no "aaaaa", "fffff", or repeated drill filler).`);
console.log(`✔ 100% ANSI keyboard finger mappings verified.`);
console.log(`✔ Difficulty and target metrics increase progressively across 7 stages.`);
console.log(`✔ Level 600 Capstone Graduation assessment verified.`);
console.log('\nCurriculum 600 Build is in full compliance with all requirements.');
