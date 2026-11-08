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
  '\t': 'left-pinky',
  '\n': 'right-pinky',
  '\r': 'right-pinky',
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
    title: 'Complete Keyboard Education & Foundation',
    subtitle: 'F & J homing anchors, all 26 letters, numbers, symbols, and functional keys',
    objective: 'Master the complete essential keyboard in Stage 1 without looking at the keys. Build tactile anchors, lowercase, uppercase, digits, symbols, and foundational rhythm.',
    badge: 'Foundation',
    targetWpm: 24,
    targetAccuracy: 85,
    startLevel: 1,
    endLevel: 700,
    totalLessons: 700,
    color: 'emerald',
    targetKeys: ['A-Z', '0-9', 'Symbols', 'Shift', 'Enter', 'Space'],
    homeKeys: ['F', 'J'],
  },
  {
    stageId: 2,
    title: 'Foundation & Controlled Fluency',
    subtitle: 'High-frequency English vocabulary, common collocations, and short fluent sentences',
    objective: 'Develop controlled fluency across common words and short sentences while retaining numbers and symbols with steady cadence.',
    badge: 'Fluency',
    targetWpm: 32,
    targetAccuracy: 88,
    startLevel: 1,
    endLevel: 700,
    totalLessons: 700,
    color: 'blue',
    targetKeys: ['High-Frequency Words', 'Collocations', 'Sentence Cadence'],
    homeKeys: ['F', 'J'],
  },
  {
    stageId: 3,
    title: 'Word & Sentence Mastery',
    subtitle: 'Expanded English vocabulary, compound words, descriptive syntax, and natural dialogues',
    objective: 'Master medium and long vocabulary, complex sentence structures, dialogues, questions, and punctuation integration.',
    badge: 'Sentence Mastery',
    targetWpm: 40,
    targetAccuracy: 90,
    startLevel: 1,
    endLevel: 700,
    totalLessons: 700,
    color: 'violet',
    targetKeys: ['Word Mastery', 'Sentence Syntax', 'Punctuation Integration'],
    homeKeys: ['F', 'J'],
  },
  {
    stageId: 4,
    title: 'Paragraph Fluency & Cohesion',
    subtitle: 'Multi-sentence paragraphs, discourse transitions, and sustained typing cadence',
    objective: 'Develop multi-sentence typing stamina, discourse cohesion, and consistent rhythmic pacing across extended paragraphs without fatigue.',
    badge: 'Paragraph Cohesion',
    targetWpm: 48,
    targetAccuracy: 92,
    startLevel: 1,
    endLevel: 700,
    totalLessons: 700,
    color: 'amber',
    targetKeys: ['Paragraph Fluency', 'Discourse Connectors', 'Sustained Rhythm'],
    homeKeys: ['F', 'J'],
  },
  {
    stageId: 5,
    title: 'Intermediate Speed Development',
    subtitle: 'Sprint intervals, metronome rhythm cadence, velocity bursts, and timed passages',
    objective: 'Elevate typing speed through controlled sprint intervals, rapid word transitions, and consistent accuracy under time pressure.',
    badge: 'Speed Development',
    targetWpm: 54,
    targetAccuracy: 93,
    startLevel: 1,
    endLevel: 700,
    totalLessons: 700,
    color: 'cyan',
    targetKeys: ['Velocity Intervals', 'Speed Bursts', 'Metronome Cadence'],
    homeKeys: ['F', 'J'],
  },
  {
    stageId: 6,
    title: 'Advanced Performance & Cadence',
    subtitle: 'Complex mixed vocabulary, scientific prose, and advanced punctuation density',
    objective: 'Transcribe dense scientific and technical prose with heavy punctuation density, complex multi-clause syntax, and high-speed accuracy.',
    badge: 'Advanced Performance',
    targetWpm: 62,
    targetAccuracy: 94,
    startLevel: 1,
    endLevel: 700,
    totalLessons: 700,
    color: 'rose',
    targetKeys: ['Advanced Cadence', 'Scientific Prose', 'Punctuation Density'],
    homeKeys: ['F', 'J'],
  },
  {
    stageId: 7,
    title: 'Professional & Technical Fluency',
    subtitle: 'Business memos, markdown documentation, programming code, JSON, and terminal CLI',
    objective: 'Touch-type code, data structures, terminal commands, and professional enterprise documentation with zero friction.',
    badge: 'Professional & Code',
    targetWpm: 70,
    targetAccuracy: 95,
    startLevel: 1,
    endLevel: 700,
    totalLessons: 700,
    color: 'teal',
    targetKeys: ['Code Syntax', 'JSON & Config', 'Markdown Docs', 'Terminal CLI'],
    homeKeys: ['F', 'J'],
  },
  {
    stageId: 8,
    title: 'High-Speed Mastery & Stamina',
    subtitle: 'High-velocity sprints, multi-minute sustained stamina, and relaxed ergonomics',
    objective: 'Sustain 65-78 WPM sprints and multi-minute marathon runs without finger fatigue or tension accumulation.',
    badge: 'High-Speed Stamina',
    targetWpm: 78,
    targetAccuracy: 96,
    startLevel: 1,
    endLevel: 700,
    totalLessons: 700,
    color: 'orange',
    targetKeys: ['High-Speed Cadence', 'Multi-Minute Stamina', 'Fatigue Prevention'],
    homeKeys: ['F', 'J'],
  },
  {
    stageId: 9,
    title: 'Elite Performance Benchmarks',
    subtitle: 'Dense academic literature, philosophical treatises, legal briefs, and speed benchmarks',
    objective: 'Achieve elite speed benchmarks (75-88 WPM) across dense academic monographs and philosophical treatises under strict precision standards.',
    badge: 'Elite Benchmarks',
    targetWpm: 88,
    targetAccuracy: 97,
    startLevel: 1,
    endLevel: 700,
    totalLessons: 700,
    color: 'indigo',
    targetKeys: ['Elite Benchmarks', 'Philosophical Treatises', 'Legal & Academic Prose'],
    homeKeys: ['F', 'J'],
  },
  {
    stageId: 10,
    title: 'Grandmaster Typist & Capstone',
    subtitle: 'Classical literature masterworks, historical orations, and Grandmaster Capstone certification',
    objective: 'Attain world-class grandmaster neuromuscular flow: sustain 82-95+ WPM with 96-98%+ precision across literary masterpieces and capstone trials.',
    badge: 'Grandmaster',
    targetWpm: 95,
    targetAccuracy: 98,
    startLevel: 1,
    endLevel: 700,
    totalLessons: 700,
    color: 'purple',
    targetKeys: ['Grandmaster Literature', 'Historic Speeches', 'Capstone Examination'],
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
