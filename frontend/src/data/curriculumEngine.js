/**
 * KEYFLOW - Comprehensive Touch-Typing Curriculum Engine
 * ========================================================
 * Complete 600-Level Progressive Masterpiece Curriculum across 7 Stages
 * and 30 Units (20 lessons per unit = 600 total levels).
 * 
 * Fully validated, zero repetitive character drills (no "fffff" spam),
 * pedagogically sequenced from tactile anchors to professional prose.
 */

import { CURRICULUM_600_LESSONS } from './curriculum600Data.js';

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

export const STAGE_META = [
  {
    stageId: 1,
    title: 'Home Row Foundations',
    subtitle: 'Tactile anchor keys, muscle relaxation, and index-bump indexing',
    objective: 'Establish correct home-row anchors without looking at the keyboard. Focus on index rests on F and J bumps.',
    badge: 'Foundation',
    targetWpm: 22,
    targetAccuracy: 92,
    startLevel: 1,
    endLevel: 100,
    totalLessons: 100,
    color: 'emerald',
    targetKeys: ['A', 'S', 'D', 'F', 'J', 'K', 'L', ';', 'Space'],
    homeKeys: ['F', 'J'],
  },
  {
    stageId: 2,
    title: 'Top Row Control',
    subtitle: 'Upward diagonal reaches and returning to home-row rest',
    objective: 'Train fingers to stretch upward into the top row cleanly and recover home-row posture without hesitation.',
    badge: 'Top Row',
    targetWpm: 30,
    targetAccuracy: 93,
    startLevel: 101,
    endLevel: 180,
    totalLessons: 80,
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
    targetWpm: 36,
    targetAccuracy: 93,
    startLevel: 181,
    endLevel: 260,
    totalLessons: 80,
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
    targetWpm: 44,
    targetAccuracy: 94,
    startLevel: 261,
    endLevel: 340,
    totalLessons: 80,
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
    targetWpm: 52,
    targetAccuracy: 95,
    startLevel: 341,
    endLevel: 420,
    totalLessons: 80,
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
    targetWpm: 58,
    targetAccuracy: 95,
    startLevel: 421,
    endLevel: 500,
    totalLessons: 80,
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
    targetWpm: 68,
    targetAccuracy: 96,
    startLevel: 501,
    endLevel: 600,
    totalLessons: 100,
    color: 'orange',
    targetKeys: ['Mixed Keys', 'Numbers', 'Symbols', 'Endurance', 'Code'],
    homeKeys: ['F', 'J'],
  },
];

export const UNIT_DEFINITIONS = [
  // Stage 1: Units 1-5 (Levels 1-100)
  { unitNumber: 1, stageId: 1, startLesson: 1, endLesson: 20, label: 'Home Row Anchor Foundations' },
  { unitNumber: 2, stageId: 1, startLesson: 21, endLesson: 40, label: 'Home Row Finger Independence' },
  { unitNumber: 3, stageId: 1, startLesson: 41, endLesson: 60, label: 'Home Row Short Words & Spatial Recovery' },
  { unitNumber: 4, stageId: 1, startLesson: 61, endLesson: 80, label: 'Home Row Rhythm & Bilateral Phrasing' },
  { unitNumber: 5, stageId: 1, startLesson: 81, endLesson: 100, label: 'Stage 1 Foundation Benchmark & Capstone' },

  // Stage 2: Units 6-9 (Levels 101-180)
  { unitNumber: 6, stageId: 2, startLesson: 101, endLesson: 120, label: 'Top Row Inward Reaches (E, R, T, U, I, O)' },
  { unitNumber: 7, stageId: 2, startLesson: 121, endLesson: 140, label: 'Top Row Outward Reaches & Morphemes (Q, W, P, Y)' },
  { unitNumber: 8, stageId: 2, startLesson: 141, endLesson: 160, label: 'Top-to-Home Row Transitions & Cadence' },
  { unitNumber: 9, stageId: 2, startLesson: 161, endLesson: 180, label: 'Stage 2 Top Row Benchmark & Assessment' },

  // Stage 3: Units 10-13 (Levels 181-260)
  { unitNumber: 10, stageId: 3, startLesson: 181, endLesson: 200, label: 'Bottom Row Inward Reaches (C, V, B, N, M)' },
  { unitNumber: 11, stageId: 3, startLesson: 201, endLesson: 220, label: 'Bottom Row Outward Reaches (Z, X)' },
  { unitNumber: 12, stageId: 3, startLesson: 221, endLesson: 240, label: 'Three-Row Vertical Transitions & Hand Posture' },
  { unitNumber: 13, stageId: 3, startLesson: 241, endLesson: 260, label: 'Stage 3 Bottom Row Benchmark & Assessment' },

  // Stage 4: Units 14-17 (Levels 261-340)
  { unitNumber: 14, stageId: 4, startLesson: 261, endLesson: 280, label: 'High-Frequency Digrams (th, er, on, an, re, in, he)' },
  { unitNumber: 15, stageId: 4, startLesson: 281, endLesson: 300, label: 'Common Trigrams & Word Fragments (the, ing, and, ion, ent)' },
  { unitNumber: 16, stageId: 4, startLesson: 301, endLesson: 320, label: 'Multi-Syllabic Morphemes (-tion, -ment, -ness, inter-)' },
  { unitNumber: 17, stageId: 4, startLesson: 321, endLesson: 340, label: 'Stage 4 Morpheme Fluency Benchmark & Assessment' },

  // Stage 5: Units 18-21 (Levels 341-420)
  { unitNumber: 18, stageId: 5, startLesson: 341, endLesson: 360, label: 'Common Vocabulary Cadence & Spacebar Rhythm' },
  { unitNumber: 19, stageId: 5, startLesson: 361, endLesson: 380, label: 'Varied Word Lengths & Bilateral Transitions' },
  { unitNumber: 20, stageId: 5, startLesson: 381, endLesson: 400, label: 'Natural English Prose & Full Sentence Flow' },
  { unitNumber: 21, stageId: 5, startLesson: 401, endLesson: 420, label: 'Stage 5 Word Cadence Benchmark & Assessment' },

  // Stage 6: Units 22-25 (Levels 421-500)
  { unitNumber: 22, stageId: 6, startLesson: 421, endLesson: 440, label: 'Opposite-Hand Shift Mechanics & Capitalization' },
  { unitNumber: 23, stageId: 6, startLesson: 441, endLesson: 460, label: 'Standard Punctuation & Contractions (., \', ?, !, ;)' },
  { unitNumber: 24, stageId: 6, startLesson: 461, endLesson: 480, label: 'Complex Dialogue, Quotes & Parentheticals' },
  { unitNumber: 25, stageId: 6, startLesson: 481, endLesson: 500, label: 'Stage 6 Sentence Rhythm Benchmark & Assessment' },

  // Stage 7: Units 26-30 (Levels 501-600)
  { unitNumber: 26, stageId: 7, startLesson: 501, endLesson: 520, label: 'Number Row Reaches & Numeric Sequences (1 to 0)' },
  { unitNumber: 27, stageId: 7, startLesson: 521, endLesson: 540, label: 'Alphanumeric Formats, Technical Code & Syntax' },
  { unitNumber: 28, stageId: 7, startLesson: 541, endLesson: 560, label: 'High-Velocity Speed Bursts & Weak-Finger Remediation' },
  { unitNumber: 29, stageId: 7, startLesson: 561, endLesson: 580, label: 'Extended Literary Transcription & Zero-Error Sprints' },
  { unitNumber: 30, stageId: 7, startLesson: 581, endLesson: 600, label: 'Grandmaster Capstone Mastery & Level 600 Final Graduation' },
];

export const MASTER_LESSONS = CURRICULUM_600_LESSONS;

/**
 * Retrieves a lesson by its global level number (1 through 600).
 */
export function getLessonByLevel(levelNumber) {
  const num = parseInt(levelNumber, 10);
  if (!num || num < 1 || num > MASTER_LESSONS.length) return null;
  const l = MASTER_LESSONS[num - 1];
  if (l && !l.lessonNum) {
    l.lessonNum = l.levelNumber;
  }
  return l;
}

/**
 * Retrieves a lesson by (stageId, lessonNum).
 * Fully backward-compatible with legacy calls getLesson(stageId, lessonNum).
 */
export function getLesson(stageId, lessonNum) {
  const sId = parseInt(stageId, 10) || 1;
  const lNum = parseInt(lessonNum, 10) || 1;

  // Case 1: lNum is directly a global levelNumber in MASTER_LESSONS
  const directByLevel = MASTER_LESSONS.find((l) => l.levelNumber === lNum);
  if (directByLevel && (directByLevel.stageId === sId || lNum > 20)) {
    return getLessonByLevel(lNum);
  }

  // Case 2: lNum is local to the stage
  const stageMeta = STAGE_META[sId - 1];
  if (stageMeta) {
    const calculatedLevel = (stageMeta.startLevel || 1) + (lNum - 1);
    if (calculatedLevel <= stageMeta.endLevel) {
      return getLessonByLevel(calculatedLevel);
    }
  }

  // Case 3: Fallback by global lNum
  return getLessonByLevel(lNum) || MASTER_LESSONS[0];
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
    badge: lesson.badge,
    targetWpm: lesson.targetWpm,
    targetAccuracy: lesson.targetAccuracy,
    estimatedMinutes: String(Math.ceil((lesson.estimatedSeconds || 60) / 60)),
  };
}

export function getLessonMetaByLevel(levelNumber) {
  const lesson = getLessonByLevel(levelNumber);
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
    badge: lesson.badge,
    targetWpm: lesson.targetWpm,
    targetAccuracy: lesson.targetAccuracy,
    estimatedMinutes: String(Math.ceil((lesson.estimatedSeconds || 60) / 60)),
  };
}

/**
 * Retrieves all units for a specific stage.
 */
export function getStageUnits(stageId) {
  const sId = parseInt(stageId, 10);
  const units = UNIT_DEFINITIONS.filter((u) => u.stageId === sId);
  if (units.length > 0) {
    return units.map((u) => ({
      unitNumber: u.unitNumber,
      stageId: u.stageId,
      unitLabel: u.label,
      startLesson: u.startLesson,
      endLesson: u.endLesson,
      isAssessment: true,
      lessonsCount: u.endLesson - u.startLesson + 1,
      color: STAGE_META[u.stageId - 1]?.color || 'emerald',
    }));
  }

  // Fallback to all units
  return getAllUnits();
}

/**
 * Returns all 30 units across the entire curriculum.
 */
export function getAllUnits() {
  return UNIT_DEFINITIONS.map((u) => ({
    unitNumber: u.unitNumber,
    stageId: u.stageId,
    unitLabel: u.label,
    startLesson: u.startLesson,
    endLesson: u.endLesson,
    isAssessment: true,
    lessonsCount: u.endLesson - u.startLesson + 1,
    color: STAGE_META[u.stageId - 1]?.color || 'emerald',
  }));
}

export function getFirstLesson(stageId) {
  const stage = STAGE_META[stageId - 1] || STAGE_META[0];
  return getLessonByLevel(stage.startLevel);
}

/**
 * Calculates next lesson ID seamlessly across lessons and stage boundaries.
 */
export function getNextLessonId(stageId, lessonNum) {
  const currentLesson = getLesson(stageId, lessonNum);
  if (!currentLesson) return null;
  const nextLevel = currentLesson.levelNumber + 1;
  const nextLesson = getLessonByLevel(nextLevel);
  if (!nextLesson) return null;
  return {
    stageId: nextLesson.stageId,
    lessonNum: nextLesson.levelNumber,
    levelNumber: nextLesson.levelNumber,
  };
}

/**
 * Comprehensive Curriculum Validator
 * ===================================
 * Audits all 600 levels for:
 * 1. Completeness: all sequential levels from 1 to 600 exist.
 * 2. Uniqueness: IDs and exercise contents are strictly unique.
 * 3. Anti-repetition: flags any repeated-character spam (e.g. "fffff", "aaaaa").
 * 4. Keyboard character validity: all characters are mapped to physical keys.
 * 5. Prerequisites: valid linear ordering without circular dependencies.
 * 6. Educational soundness: objectives, titles, target metrics present.
 */
export function validateCurriculum(customLessons = MASTER_LESSONS) {
  const errors = [];
  const warnings = [];
  const seenIds = new Set();
  const seenExercises = new Map();
  const levelNumbers = [];

  for (let i = 0; i < customLessons.length; i++) {
    const lesson = customLessons[i];
    const prefix = `[Level ${lesson.levelNumber || i + 1}]`;

    // 1. Level Number
    if (typeof lesson.levelNumber !== 'number') {
      errors.push(`${prefix} Missing or non-numeric levelNumber.`);
    } else {
      levelNumbers.push(lesson.levelNumber);
    }

    // 2. Unique ID
    const lessonId = lesson.id || `level-${String(lesson.levelNumber).padStart(3, '0')}`;
    if (seenIds.has(lessonId)) {
      errors.push(`${prefix} Duplicate lesson ID: "${lessonId}".`);
    }
    seenIds.add(lessonId);

    // 3. Title & Objective
    if (!lesson.title || lesson.title.trim().length < 3) {
      errors.push(`${prefix} Missing or inadequate title.`);
    }
    if (!lesson.objective || lesson.objective.trim().length < 10) {
      errors.push(`${prefix} Missing or inadequate objective.`);
    }

    // 4. Exercise Content
    if (!lesson.exerciseText || typeof lesson.exerciseText !== 'string') {
      errors.push(`${prefix} Missing or invalid exerciseText.`);
    } else {
      const trimmed = lesson.exerciseText.trim();
      if (trimmed.length < 10) {
        errors.push(`${prefix} Exercise text too short (${trimmed.length} chars).`);
      }

      // Check for excessive repetitive character spam (e.g. "aaaaa", "fffff", 5+ same chars)
      const spamMatch = trimmed.match(/([a-zA-Z0-9;.,])\1{4,}/);
      if (spamMatch) {
        errors.push(`${prefix} Excessive repeated character spam detected: "${spamMatch[0]}".`);
      }

      // Check for unintended duplicate exercises across lessons
      const normalized = trimmed.toLowerCase().replace(/\s+/g, ' ');
      if (seenExercises.has(normalized)) {
        errors.push(`${prefix} Duplicate exercise text already used in Level ${seenExercises.get(normalized)}.`);
      } else {
        seenExercises.set(normalized, lesson.levelNumber);
      }

      // Check character validity
      for (const char of trimmed) {
        if (!FINGER_MAP[char] && !FINGER_MAP[char.toLowerCase()]) {
          errors.push(`${prefix} Unsupported character in exercise: "${char}".`);
          break;
        }
      }
    }

    // 5. Prerequisites
    if (lesson.levelNumber > 1) {
      const expectedPrereq = lesson.levelNumber - 1;
      if (lesson.prerequisiteLevel && lesson.prerequisiteLevel !== expectedPrereq) {
        errors.push(`${prefix} Invalid prerequisite: expected ${expectedPrereq}, found ${lesson.prerequisiteLevel}.`);
      }
    }

    // 6. Targets
    if (typeof lesson.targetWpm !== 'number' || lesson.targetWpm < 10) {
      errors.push(`${prefix} Missing or invalid targetWpm.`);
    }
    if (typeof lesson.targetAccuracy !== 'number' || lesson.targetAccuracy < 80) {
      errors.push(`${prefix} Missing or invalid targetAccuracy.`);
    }
  }

  // Check sequential continuity of all levels
  levelNumbers.sort((a, b) => a - b);
  for (let expected = 1; expected <= customLessons.length; expected++) {
    if (!levelNumbers.includes(expected)) {
      errors.push(`Missing sequential level: Level ${expected} is not present in curriculum.`);
    }
  }

  return {
    valid: errors.length === 0,
    levelCount: customLessons.length,
    errors,
    warnings,
    duplicateCount: customLessons.length - seenExercises.size,
  };
}
