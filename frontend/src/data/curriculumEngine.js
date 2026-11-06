/**
 * KEYFLOW - Comprehensive Touch-Typing Curriculum Engine
 * ========================================================
 * Complete 7,000-Level Masterpiece Curriculum across 10 Stages
 * (10 Stages x 70 Units x 10 Levels = 7,000 real educational lessons).
 * 
 * Every stage is an independent curriculum with 700 levels (70 Units x 10 Lessons).
 * Strictly validated, progressive lengths from tactile drills to extended prose,
 * zero character spam, and unambiguous stable lesson identities (S1-L001 to S10-L700).
 */

import { STAGE_1_LESSONS } from './curriculum/stage1Data.js';
import { STAGE_2_LESSONS } from './curriculum/stage2Data.js';
import { STAGE_3_LESSONS } from './curriculum/stage3Data.js';
import { STAGE_4_LESSONS } from './curriculum/stage4Data.js';
import { STAGE_5_LESSONS } from './curriculum/stage5Data.js';
import { STAGE_6_LESSONS } from './curriculum/stage6Data.js';
import { STAGE_7_LESSONS } from './curriculum/stage7Data.js';
import { STAGE_8_LESSONS } from './curriculum/stage8Data.js';
import { STAGE_9_LESSONS } from './curriculum/stage9Data.js';
import { STAGE_10_LESSONS } from './curriculum/stage10Data.js';

// Finger mapping for all standard ANSI keyboard keys
export const FINGER_MAP = {
  // Left Pinky
  '`': 'left-pinky', '~': 'left-pinky', '1': 'left-pinky', '!': 'left-pinky',
  'q': 'left-pinky', 'Q': 'left-pinky', 'a': 'left-pinky', 'A': 'left-pinky',
  'z': 'left-pinky', 'Z': 'left-pinky',
  // Left Ring
  '2': 'left-ring', '@': 'left-ring', 'w': 'left-ring', 'W': 'left-ring',
  's': 'left-ring', 'S': 'left-ring', 'x': 'left-ring', 'X': 'left-ring',
  // Left Middle
  '3': 'left-middle', '#': 'left-middle', 'e': 'left-middle', 'E': 'left-middle',
  'd': 'left-middle', 'D': 'left-middle', 'c': 'left-middle', 'C': 'left-middle',
  // Left Index
  '4': 'left-index', '$': 'left-index', '5': 'left-index', '%': 'left-index',
  'r': 'left-index', 'R': 'left-index', 't': 'left-index', 'T': 'left-index',
  'f': 'left-index', 'F': 'left-index', 'g': 'left-index', 'G': 'left-index',
  'v': 'left-index', 'V': 'left-index', 'b': 'left-index', 'B': 'left-index',
  // Thumbs
  ' ': 'thumb',
  // Right Index
  '6': 'right-index', '^': 'right-index', '7': 'right-index', '&': 'right-index',
  'y': 'right-index', 'Y': 'right-index', 'u': 'right-index', 'U': 'right-index',
  'h': 'right-index', 'H': 'right-index', 'j': 'right-index', 'J': 'right-index',
  'n': 'right-index', 'N': 'right-index', 'm': 'right-index', 'M': 'right-index',
  // Right Middle
  '8': 'right-middle', '*': 'right-middle', 'i': 'right-middle', 'I': 'right-middle',
  'k': 'right-middle', 'K': 'right-middle', ',': 'right-middle', '<': 'right-middle',
  // Right Ring
  '9': 'right-ring', '(': 'right-ring', 'o': 'right-ring', 'O': 'right-ring',
  'l': 'right-ring', 'L': 'right-ring', '.': 'right-ring', '>': 'right-ring',
  // Right Pinky
  '0': 'right-pinky', ')': 'right-pinky', '-': 'right-pinky', '_': 'right-pinky',
  '=': 'right-pinky', '+': 'right-pinky', 'p': 'right-pinky', 'P': 'right-pinky',
  '[': 'right-pinky', '{': 'right-pinky', ']': 'right-pinky', '}': 'right-pinky',
  '\\': 'right-pinky', '|': 'right-pinky', ';': 'right-pinky', ':': 'right-pinky',
  "'": 'right-pinky', '"': 'right-pinky', '/': 'right-pinky', '?': 'right-pinky',
  '—': 'right-pinky',
};

export const STAGE_CURRICULA = {
  1: STAGE_1_LESSONS,
  2: STAGE_2_LESSONS,
  3: STAGE_3_LESSONS,
  4: STAGE_4_LESSONS,
  5: STAGE_5_LESSONS,
  6: STAGE_6_LESSONS,
  7: STAGE_7_LESSONS,
  8: STAGE_8_LESSONS,
  9: STAGE_9_LESSONS,
  10: STAGE_10_LESSONS,
};

export const STAGE_META = [
  {
    stageId: 1,
    title: 'Home Row Foundations',
    subtitle: 'Tactile anchor keys, muscle relaxation, and index-bump indexing',
    objective: 'Establish correct home-row anchors without looking at the keyboard. Focus on index rests on F and J bumps.',
    badge: 'Foundation',
    targetWpm: 24,
    targetAccuracy: 85,
    startLevel: 1,
    endLevel: 700,
    totalLessons: 700,
    color: 'emerald',
    targetKeys: ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', 'Space'],
    homeKeys: ['F', 'J'],
  },
  {
    stageId: 2,
    title: 'Top Row Control',
    subtitle: 'Upward diagonal reaches and returning to home-row rest',
    objective: 'Train fingers to stretch upward into the top row cleanly and recover home-row posture without hesitation.',
    badge: 'Top Row',
    targetWpm: 34,
    targetAccuracy: 88,
    startLevel: 1,
    endLevel: 700,
    totalLessons: 700,
    color: 'blue',
    targetKeys: ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    homeKeys: ['F', 'J'],
  },
  {
    stageId: 3,
    title: 'Bottom Row Control',
    subtitle: 'Downward curl mechanics, wrist alignment, and pinky stabilization',
    objective: 'Conquer the downward finger curl motion across the entire bottom row with balanced speed and posture.',
    badge: 'Bottom Row',
    targetWpm: 40,
    targetAccuracy: 90,
    startLevel: 1,
    endLevel: 700,
    totalLessons: 700,
    color: 'violet',
    targetKeys: ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.'],
    homeKeys: ['F', 'J'],
  },
  {
    stageId: 4,
    title: 'Full Alphabet Mastery & Cross-Row Transitions',
    subtitle: 'Seamless cross-row leaps, high-frequency digrams, prefixes, and suffixes',
    objective: 'Integrate the complete 26-letter alphabet into instinctive cross-row neuromuscular pathways.',
    badge: 'Alphabet',
    targetWpm: 46,
    targetAccuracy: 92,
    startLevel: 1,
    endLevel: 700,
    totalLessons: 700,
    color: 'amber',
    targetKeys: ['A-Z', 'th', 'he', 'in', 'er', 'an', 'tion', 'ment'],
    homeKeys: ['F', 'J'],
  },
  {
    stageId: 5,
    title: 'Number Row Mastery & Ten-Key Dexterity',
    subtitle: 'Top number reaches (1-0), home-row recovery, numeric prose, dates, and metrics',
    objective: 'Build blind touch-typing accuracy on the top number row without glancing down.',
    badge: 'Numbers',
    targetWpm: 50,
    targetAccuracy: 92,
    startLevel: 1,
    endLevel: 700,
    totalLessons: 700,
    color: 'cyan',
    targetKeys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    homeKeys: ['F', 'J'],
  },
  {
    stageId: 6,
    title: 'Shift Discipline, Punctuation & Common Symbols',
    subtitle: 'Opposite-hand Shift keys, punctuation, quotes, and capitalization',
    objective: 'Master two-handed Shift coordination: never press Shift and a letter key using the same hand.',
    badge: 'Punctuation',
    targetWpm: 55,
    targetAccuracy: 93,
    startLevel: 1,
    endLevel: 700,
    totalLessons: 700,
    color: 'rose',
    targetKeys: ['Shift', '.', '?', '!', ',', ';', ':', "'", '"', '(', ')'],
    homeKeys: ['F', 'J'],
  },
  {
    stageId: 7,
    title: 'High-Frequency Vocabulary & Rhythm Cadence',
    subtitle: 'Top 1,000 core English words, eliminating pause latencies, metronomic cadence',
    objective: 'Eliminate pause delays between words and establish a steady, uninterrupted metronome cadence.',
    badge: 'Fluency',
    targetWpm: 62,
    targetAccuracy: 94,
    startLevel: 1,
    endLevel: 700,
    totalLessons: 700,
    color: 'teal',
    targetKeys: ['Top 1000 Words', 'Metronomic Cadence', 'Fluid Rhythm'],
    homeKeys: ['F', 'J'],
  },
  {
    stageId: 8,
    title: 'Speed & Endurance Building',
    subtitle: 'High-velocity sprints, sustained multi-minute stamina, relaxed ergonomics',
    objective: 'Sustain 60+ to 72 WPM sprints without finger fatigue or tension accumulation.',
    badge: 'Velocity',
    targetWpm: 72,
    targetAccuracy: 95,
    startLevel: 1,
    endLevel: 700,
    totalLessons: 700,
    color: 'orange',
    targetKeys: ['Sprint Intervals', 'Stamina Passages', 'Ergonomic Flow'],
    homeKeys: ['F', 'J'],
  },
  {
    stageId: 9,
    title: 'Technical, Numeric & Professional Fluency',
    subtitle: 'Programming syntax, JSON, camelCase, snake_case, brackets, and terminal CLI',
    objective: 'Touch-type code, data structures, and special operators with zero friction.',
    badge: 'Code & Tech',
    targetWpm: 80,
    targetAccuracy: 96,
    startLevel: 1,
    endLevel: 700,
    totalLessons: 700,
    color: 'indigo',
    targetKeys: ['{ }', '[ ]', '< >', '=', '+', '_', 'camelCase', 'snake_case'],
    homeKeys: ['F', 'J'],
  },
  {
    stageId: 10,
    title: 'Master Typist & Specialization',
    subtitle: 'Classical literature, dense academic prose, extreme burst benchmarks 80+ WPM',
    objective: 'Achieve grandmaster neuromuscular flow: sustain 75-95+ WPM with 95%+ precision across literary and academic masterworks.',
    badge: 'Grandmaster',
    targetWpm: 95,
    targetAccuracy: 97,
    startLevel: 1,
    endLevel: 700,
    totalLessons: 700,
    color: 'purple',
    targetKeys: ['Grandmaster Texts', 'Endurance Capstone', 'Velocity Burst'],
    homeKeys: ['F', 'J'],
  },
];

/**
 * Builds 70 units per stage dynamically from the stage lessons.
 * 10 Stages x 70 Units = 700 Units Total.
 */
function buildAllUnits() {
  const units = [];
  for (let s = 1; s <= 10; s++) {
    const stageMeta = STAGE_META[s - 1];
    const stageLessons = STAGE_CURRICULA[s] || [];
    for (let u = 1; u <= 70; u++) {
      const startLesson = (u - 1) * 10 + 1;
      const endLesson = u * 10;
      const firstLesson = stageLessons[startLesson - 1];
      const unitLabel = firstLesson?.unitLabel || `Unit ${u}: ${stageMeta.title} Module ${u}`;
      units.push({
        unitNumber: u,
        stageId: s,
        unitLabel,
        startLesson,
        endLesson,
        isAssessment: true,
        lessonsCount: 10,
        color: stageMeta.color || 'emerald',
      });
    }
  }
  return units;
}

export const UNIT_DEFINITIONS = buildAllUnits();

export const MASTER_LESSONS = STAGE_1_LESSONS;

export function getTotalLessonCount() {
  return 7000;
}

/**
 * Retrieves a lesson by its stageId (1-10) and stage-local level number (1-700).
 * Supports stable IDs like "S2-L045" when passed as the first argument.
 */
export function getLesson(stageId, lessonNum) {
  if (typeof stageId === 'string') {
    const sMatch = stageId.match(/^S(\d+)-L(\d+)$/i);
    if (sMatch) {
      const s = parseInt(sMatch[1], 10);
      const l = parseInt(sMatch[2], 10);
      return STAGE_CURRICULA[s]?.[l - 1] || null;
    }
  }

  const sId = parseInt(stageId, 10) || 1;
  const lNum = parseInt(lessonNum, 10) || 1;
  const stageLessons = STAGE_CURRICULA[sId];
  if (!stageLessons || stageLessons.length === 0) return null;
  return stageLessons[lNum - 1] || null;
}

/**
 * Retrieves a lesson by stable ID (e.g. "S1-L001", "S10-L700").
 */
export function getLessonById(lessonId) {
  if (!lessonId) return null;
  const match = String(lessonId).match(/^S(\d+)-L(\d+)$/i);
  if (match) {
    const sId = parseInt(match[1], 10);
    const lNum = parseInt(match[2], 10);
    return getLesson(sId, lNum);
  }
  for (let s = 1; s <= 10; s++) {
    const found = STAGE_CURRICULA[s]?.find((l) => l.id === lessonId);
    if (found) return found;
  }
  return null;
}

/**
 * Backward compatibility: getLessonByLevel(levelNumber, stageId = 1)
 */
export function getLessonByLevel(levelNumber, stageId = 1) {
  return getLesson(stageId, levelNumber);
}

/**
 * Returns lightweight metadata for a lesson card or map node.
 */
export function getLessonMeta(stageId, lessonNum) {
  const lesson = getLesson(stageId, lessonNum);
  if (!lesson) return null;
  return {
    id: lesson.id,
    levelNumber: lesson.levelNumber,
    lessonNum: lesson.levelNumber,
    stageId: lesson.stageId,
    title: lesson.title,
    unitLabel: lesson.unitLabel,
    unit: lesson.unitNumber,
    objective: lesson.objective,
    isAssessment: lesson.isAssessment,
    isMilestone: lesson.isMilestone,
    badge: STAGE_META[lesson.stageId - 1]?.badge || 'Typist',
    targetWpm: lesson.targetWpm,
    targetAccuracy: lesson.targetAccuracy,
    estimatedMinutes: String(Math.ceil((lesson.estimatedSeconds || 60) / 60)),
  };
}

export function getLessonMetaByLevel(levelNumber, stageId = 1) {
  return getLessonMeta(stageId, levelNumber);
}

/**
 * Retrieves all 70 units for a specific stage (1 through 10).
 */
export function getStageUnits(stageId) {
  const sId = parseInt(stageId, 10) || 1;
  const stage = STAGE_META[sId - 1] || STAGE_META[0];
  const stageLessons = STAGE_CURRICULA[sId] || [];
  const units = [];

  for (let u = 1; u <= 70; u++) {
    const startLesson = (u - 1) * 10 + 1;
    const endLesson = u * 10;
    const firstLesson = stageLessons[startLesson - 1];
    const unitLabel = firstLesson?.unitLabel || `Unit ${u}: ${stage.title} Section ${u}`;

    units.push({
      unitNumber: u,
      stageId: sId,
      unitLabel,
      startLesson,
      endLesson,
      isAssessment: true,
      lessonsCount: 10,
      color: stage.color || 'emerald',
    });
  }
  return units;
}

/**
 * Returns all 700 units across the 10 stages of the curriculum.
 */
export function getAllUnits() {
  return UNIT_DEFINITIONS;
}

export function getFirstLesson(stageId = 1) {
  return getLesson(stageId, 1);
}

/**
 * Calculates next lesson ID seamlessly across lessons and stage boundaries.
 * Returns null after Level 700 of Stage 10 (Grandmaster Capstone).
 */
export function getNextLessonId(stageId, lessonNum) {
  const sId = parseInt(stageId, 10) || 1;
  const lNum = parseInt(lessonNum, 10) || 1;

  if (lNum < 700) {
    return {
      stageId: sId,
      lessonNum: lNum + 1,
      levelNumber: lNum + 1,
      id: `S${sId}-L${String(lNum + 1).padStart(3, '0')}`,
    };
  }

  if (lNum >= 700 && sId < 10) {
    return {
      stageId: sId + 1,
      lessonNum: 1,
      levelNumber: 1,
      id: `S${sId + 1}-L001`,
    };
  }

  // Stage 10 Level 700 is the final graduation
  return null;
}

/**
 * Calculates previous lesson ID seamlessly across lessons and stage boundaries.
 */
export function getPrevLessonId(stageId, lessonNum) {
  const sId = parseInt(stageId, 10) || 1;
  const lNum = parseInt(lessonNum, 10) || 1;

  if (lNum > 1) {
    return {
      stageId: sId,
      lessonNum: lNum - 1,
      levelNumber: lNum - 1,
      id: `S${sId}-L${String(lNum - 1).padStart(3, '0')}`,
    };
  }

  if (lNum <= 1 && sId > 1) {
    return {
      stageId: sId - 1,
      lessonNum: 700,
      levelNumber: 700,
      id: `S${sId - 1}-L700`,
    };
  }

  return null;
}

/**
 * Comprehensive Curriculum Validator
 * Audits all 10 stages and 7,000 lessons, or a single lesson array fixture.
 */
export function validateCurriculum(curricula = STAGE_CURRICULA) {
  const errors = [];
  const seenIds = new Set();
  let totalCount = 0;

  // If passed an array of lessons directly (e.g. in unit tests/fixtures)
  if (Array.isArray(curricula)) {
    const lessons = curricula;
    const seenTexts = new Set();
    for (let idx = 0; idx < lessons.length; idx++) {
      const lesson = lessons[idx];
      const prefix = `[Lesson ${lesson.levelNumber || idx + 1}]`;
      totalCount++;

      // Sequential level check
      if (idx > 0 && lessons[idx - 1].levelNumber !== undefined && lesson.levelNumber !== undefined) {
        if (lesson.levelNumber !== lessons[idx - 1].levelNumber + 1) {
          errors.push(`${prefix} Missing sequential level: expected ${lessons[idx - 1].levelNumber + 1}, got ${lesson.levelNumber}.`);
        }
      }

      // ID check
      if (seenIds.has(lesson.id)) {
        errors.push(`${prefix} Duplicate lesson ID: ${lesson.id}.`);
      }
      if (lesson.id) seenIds.add(lesson.id);

      // Exercise text length
      if (!lesson.exerciseText || lesson.exerciseText.length < 10) {
        errors.push(`${prefix} Exercise text too short.`);
      }

      // Repeated character spam
      if (lesson.exerciseText && /([a-zA-Z0-9;.,])\1{4,}/.test(lesson.exerciseText)) {
        errors.push(`${prefix} Excessive repeated character spam detected.`);
      }

      // Duplicate exercise text
      if (lesson.exerciseText && seenTexts.has(lesson.exerciseText)) {
        errors.push(`${prefix} Duplicate exercise text: "${lesson.exerciseText.substring(0, 30)}...".`);
      }
      if (lesson.exerciseText) seenTexts.add(lesson.exerciseText);

      // Keyboard mapping
      if (lesson.exerciseText) {
        for (const char of lesson.exerciseText) {
          if (!FINGER_MAP[char] && !FINGER_MAP[char.toLowerCase()]) {
            errors.push(`${prefix} Unsupported character not in keyboard map: "${char}".`);
            break;
          }
        }
      }

      // Prerequisite check
      if (lesson.prerequisiteLevel !== undefined && lesson.prerequisiteLevel !== null) {
        if (lesson.prerequisiteLevel !== (lesson.levelNumber - 1)) {
          errors.push(`${prefix} Invalid prerequisite: expected ${lesson.levelNumber - 1}, got ${lesson.prerequisiteLevel}.`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      totalStages: 1,
      totalLessons: totalCount,
      duplicateCount: 0,
      errors,
    };
  }

  // Multi-stage dictionary validation (10 stages x 700 lessons)
  for (let sId = 1; sId <= 10; sId++) {
    const stageLessons = curricula[sId] || [];
    if (stageLessons.length !== 700) {
      errors.push(`Stage ${sId}: Expected 700 lessons, found ${stageLessons.length}.`);
    }

    const seenTextsInStage = new Set();

    for (let idx = 0; idx < stageLessons.length; idx++) {
      const lesson = stageLessons[idx];
      const prefix = `[Stage ${sId} Level ${idx + 1}]`;
      totalCount++;

      // ID check
      const expectedId = `S${sId}-L${String(idx + 1).padStart(3, '0')}`;
      if (lesson.id !== expectedId) {
        errors.push(`${prefix} ID mismatch: expected ${expectedId}, got ${lesson.id}.`);
      }
      if (seenIds.has(lesson.id)) {
        errors.push(`${prefix} Duplicate lesson ID: ${lesson.id}.`);
      }
      seenIds.add(lesson.id);

      // Sequencing
      if (lesson.levelNumber !== idx + 1) {
        errors.push(`${prefix} levelNumber out of order: ${lesson.levelNumber}.`);
      }
      if (lesson.stageId !== sId) {
        errors.push(`${prefix} stageId mismatch: ${lesson.stageId} vs ${sId}.`);
      }

      // Content
      if (!lesson.title || lesson.title.length < 3) {
        errors.push(`${prefix} Inadequate title.`);
      }
      if (!lesson.objective || lesson.objective.length < 10) {
        errors.push(`${prefix} Inadequate objective.`);
      }
      if (!lesson.exerciseText || lesson.exerciseText.length < 15) {
        errors.push(`${prefix} Exercise text too short.`);
      }

      // Repeated character spam
      if (/([a-zA-Z0-9;.,])\1{4,}/.test(lesson.exerciseText)) {
        errors.push(`${prefix} Excessive repeated character spam detected.`);
      }

      // Uniqueness within stage
      if (seenTextsInStage.has(lesson.exerciseText)) {
        errors.push(`${prefix} Duplicate exercise text within Stage ${sId}.`);
      }
      seenTextsInStage.add(lesson.exerciseText);

      // Character validity
      for (const char of lesson.exerciseText) {
        if (!FINGER_MAP[char] && !FINGER_MAP[char.toLowerCase()]) {
          errors.push(`${prefix} Unsupported character not in keyboard map: "${char}".`);
          break;
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    totalStages: 10,
    totalLessons: totalCount,
    duplicateCount: 0,
    errors,
  };
}
