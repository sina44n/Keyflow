/**
 * KEYFLOW - Comprehensive Touch-Typing Curriculum Engine
 * ========================================================
 * Complete 4,200-Level Masterpiece Curriculum across 7 Stages
 * (7 Stages x 600 Levels = 4,200 real educational lessons).
 * 
 * Every stage is an independent curriculum with 600 levels (30 Units x 20 Lessons).
 * Strictly validated, progressive lengths from tactile drills to extended prose,
 * zero character spam, and unambiguous stable lesson identities (S1-L001 to S7-L600).
 */

import { STAGE_1_LESSONS } from './curriculum/stage1Data.js';
import { STAGE_2_LESSONS } from './curriculum/stage2Data.js';
import { STAGE_3_LESSONS } from './curriculum/stage3Data.js';
import { STAGE_4_LESSONS } from './curriculum/stage4Data.js';
import { STAGE_5_LESSONS } from './curriculum/stage5Data.js';
import { STAGE_6_LESSONS } from './curriculum/stage6Data.js';
import { STAGE_7_LESSONS } from './curriculum/stage7Data.js';

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
};

export const STAGE_CURRICULA = {
  1: STAGE_1_LESSONS,
  2: STAGE_2_LESSONS,
  3: STAGE_3_LESSONS,
  4: STAGE_4_LESSONS,
  5: STAGE_5_LESSONS,
  6: STAGE_6_LESSONS,
  7: STAGE_7_LESSONS,
};

export const STAGE_META = [
  {
    stageId: 1,
    title: 'Home Row Foundations',
    subtitle: 'Tactile anchor keys, muscle relaxation, and index-bump indexing',
    objective: 'Establish correct home-row anchors without looking at the keyboard. Focus on index rests on F and J bumps.',
    badge: 'Foundation',
    targetWpm: 24,
    targetAccuracy: 93,
    startLevel: 1,
    endLevel: 600,
    totalLessons: 600,
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
    targetWpm: 32,
    targetAccuracy: 94,
    startLevel: 1,
    endLevel: 600,
    totalLessons: 600,
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
    targetWpm: 38,
    targetAccuracy: 94,
    startLevel: 1,
    endLevel: 600,
    totalLessons: 600,
    color: 'violet',
    targetKeys: ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.'],
    homeKeys: ['F', 'J'],
  },
  {
    stageId: 4,
    title: 'Common Letter Combinations & Morphemes',
    subtitle: 'High-frequency English digrams, trigrams, and syllable morphemes',
    objective: 'Condition motor memory to fire frequent character sequences (th, ing, tion, ment) as single fluid neurological strokes.',
    badge: 'Morphemes',
    targetWpm: 46,
    targetAccuracy: 95,
    startLevel: 1,
    endLevel: 600,
    totalLessons: 600,
    color: 'amber',
    targetKeys: ['th', 'he', 'in', 'er', 'an', 'tion', 'ment', 'ness'],
    homeKeys: ['F', 'J'],
  },
  {
    stageId: 5,
    title: 'Word Flow & Cadence',
    subtitle: 'Continuous vocabulary rhythm and smooth multi-word transitions',
    objective: 'Eliminate pause delays between words and establish a steady, uninterrupted metronome cadence.',
    badge: 'Fluency',
    targetWpm: 54,
    targetAccuracy: 95,
    startLevel: 1,
    endLevel: 600,
    totalLessons: 600,
    color: 'cyan',
    targetKeys: ['Full Alphabet', 'Continuous Flow', 'Space Cadence'],
    homeKeys: ['F', 'J'],
  },
  {
    stageId: 6,
    title: 'Sentence Rhythm & Shift Discipline',
    subtitle: 'Opposite-hand Shift keys, punctuation, quotes, and capitalization',
    objective: 'Master two-handed Shift coordination: never press Shift and a letter key using the same hand.',
    badge: 'Punctuation',
    targetWpm: 60,
    targetAccuracy: 96,
    startLevel: 1,
    endLevel: 600,
    totalLessons: 600,
    color: 'rose',
    targetKeys: ['Shift', '.', '?', '!', ',', ';', ':', "'", '"'],
    homeKeys: ['F', 'J'],
  },
  {
    stageId: 7,
    title: 'Precision, Speed Endurance & Capstone Mastery',
    subtitle: 'Comprehensive velocity tests, numbers, code symbols, and grandmaster capstone',
    objective: 'Achieve complete neuromuscular flow: sustain 65+ WPM with 96%+ precision across challenging prose, code, and endurance passages.',
    badge: 'Mastery Tier',
    targetWpm: 70,
    targetAccuracy: 97,
    startLevel: 1,
    endLevel: 600,
    totalLessons: 600,
    color: 'orange',
    targetKeys: ['Mixed Keys', 'Numbers', 'Symbols', 'Endurance', 'Code'],
    homeKeys: ['F', 'J'],
  },
];

/**
 * Builds 30 units per stage dynamically from the stage lessons.
 */
function buildAllUnits() {
  const units = [];
  for (let s = 1; s <= 7; s++) {
    const stageMeta = STAGE_META[s - 1];
    const stageLessons = STAGE_CURRICULA[s] || [];
    for (let u = 1; u <= 30; u++) {
      const startLesson = (u - 1) * 20 + 1;
      const endLesson = u * 20;
      const firstLesson = stageLessons[startLesson - 1];
      const unitLabel = firstLesson?.unitLabel || `Unit ${u}: ${stageMeta.title} Module ${u}`;
      units.push({
        unitNumber: u,
        stageId: s,
        unitLabel,
        startLesson,
        endLesson,
        isAssessment: true,
        lessonsCount: 20,
        color: stageMeta.color || 'emerald',
      });
    }
  }
  return units;
}

export const UNIT_DEFINITIONS = buildAllUnits();

export const MASTER_LESSONS = STAGE_1_LESSONS;

export function getTotalLessonCount() {
  return 4200;
}

/**
 * Retrieves a lesson by its stageId (1-7) and stage-local level number (1-600).
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
 * Retrieves a lesson by stable ID (e.g. "S1-L001", "S7-L600").
 */
export function getLessonById(lessonId) {
  if (!lessonId) return null;
  const match = String(lessonId).match(/^S(\d+)-L(\d+)$/i);
  if (match) {
    const sId = parseInt(match[1], 10);
    const lNum = parseInt(match[2], 10);
    return getLesson(sId, lNum);
  }
  for (let s = 1; s <= 7; s++) {
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
 * Retrieves all 30 units for a specific stage (1 through 7).
 */
export function getStageUnits(stageId) {
  const sId = parseInt(stageId, 10) || 1;
  const stage = STAGE_META[sId - 1] || STAGE_META[0];
  const stageLessons = STAGE_CURRICULA[sId] || [];
  const units = [];

  for (let u = 1; u <= 30; u++) {
    const startLesson = (u - 1) * 20 + 1;
    const endLesson = u * 20;
    const firstLesson = stageLessons[startLesson - 1];
    const unitLabel = firstLesson?.unitLabel || `Unit ${u}: ${stage.title} Section ${u}`;

    units.push({
      unitNumber: u,
      stageId: sId,
      unitLabel,
      startLesson,
      endLesson,
      isAssessment: true,
      lessonsCount: 20,
      color: stage.color || 'emerald',
    });
  }
  return units;
}

/**
 * Returns all 210 units across the 7 stages of the curriculum.
 */
export function getAllUnits() {
  return UNIT_DEFINITIONS;
}

export function getFirstLesson(stageId = 1) {
  return getLesson(stageId, 1);
}

/**
 * Calculates next lesson ID seamlessly across lessons and stage boundaries.
 * Returns null after Level 600 of Stage 7 (Grandmaster Capstone).
 */
export function getNextLessonId(stageId, lessonNum) {
  const sId = parseInt(stageId, 10) || 1;
  const lNum = parseInt(lessonNum, 10) || 1;

  if (lNum < 600) {
    return {
      stageId: sId,
      lessonNum: lNum + 1,
      levelNumber: lNum + 1,
      id: `S${sId}-L${String(lNum + 1).padStart(3, '0')}`,
    };
  }

  if (lNum >= 600 && sId < 7) {
    return {
      stageId: sId + 1,
      lessonNum: 1,
      levelNumber: 1,
      id: `S${sId + 1}-L001`,
    };
  }

  // Stage 7 Level 600 is the final graduation
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
      lessonNum: 600,
      levelNumber: 600,
      id: `S${sId - 1}-L600`,
    };
  }

  return null;
}

/**
 * Comprehensive Curriculum Validator
 * Audits all 7 stages and 4,200 lessons, or a single lesson array fixture.
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

  // Multi-stage dictionary validation (7 stages x 600 lessons)
  for (let sId = 1; sId <= 7; sId++) {
    const stageLessons = curricula[sId] || [];
    if (stageLessons.length !== 600) {
      errors.push(`Stage ${sId}: Expected 600 lessons, found ${stageLessons.length}.`);
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
    totalStages: 7,
    totalLessons: totalCount,
    duplicateCount: 0,
    errors,
  };
}
