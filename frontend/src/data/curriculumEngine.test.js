import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  MASTER_LESSONS,
  STAGE_META,
  getLessonByLevel,
  getStageUnits,
  getAllUnits,
  getNextLessonId,
  validateCurriculum,
  FINGER_MAP,
} from './curriculumEngine.js';

describe('KEYFLOW Masterpiece Academy — Curriculum Architecture & Integrity', () => {
  it('contains at least 60 curated educational levels', () => {
    assert.ok(MASTER_LESSONS.length >= 60, `Expected at least 60 levels, found ${MASTER_LESSONS.length}`);
  });

  it('contains exactly 7 progressive stages covering Foundation to Mastery', () => {
    assert.equal(STAGE_META.length, 7);
    assert.equal(STAGE_META[0].title, 'Home Row Foundations');
    assert.equal(STAGE_META[1].title, 'Home-Row Mastery & Fluency');
    assert.equal(STAGE_META[2].title, 'Top Row Control');
    assert.equal(STAGE_META[3].title, 'Bottom Row Control');
    assert.equal(STAGE_META[4].title, 'Numbers, Capitalization & Punctuation');
    assert.equal(STAGE_META[5].title, 'Advanced Fluency & Real-World Typing');
    assert.equal(STAGE_META[6].title, 'Precision & Speed Endurance');
  });

  it('ensures every level from 1 to 60 appears in exact sequential order', () => {
    for (let i = 1; i <= 60; i++) {
      const lesson = getLessonByLevel(i);
      assert.ok(lesson, `Level ${i} must exist`);
      assert.equal(lesson.levelNumber, i, `Level number must be exactly ${i}`);
      assert.ok(lesson.title && lesson.title.length > 0, `Level ${i} must have title`);
      assert.ok(lesson.objective && lesson.objective.length > 0, `Level ${i} must have objective`);
      assert.ok(lesson.skills && lesson.skills.length > 0, `Level ${i} must declare skills`);
      assert.ok(lesson.exerciseText && lesson.exerciseText.length >= 10, `Level ${i} must have non-empty exercise`);
      assert.ok(lesson.targetWpm >= 15, `Level ${i} must have valid targetWpm`);
      assert.ok(lesson.targetAccuracy >= 85, `Level ${i} must have valid targetAccuracy`);
      assert.ok(lesson.guidance && lesson.guidance.length > 0, `Level ${i} must provide guidance`);
    }
  });

  it('ensures all lesson IDs are unique and properly formatted', () => {
    const ids = new Set();
    MASTER_LESSONS.forEach((l) => {
      const id = l.id || `level-${String(l.levelNumber).padStart(2, '0')}`;
      assert.equal(ids.has(id), false, `Duplicate ID detected: ${id}`);
      ids.add(id);
    });
  });

  it('validates the complete curriculum with validateCurriculum utility without errors', () => {
    const report = validateCurriculum();
    assert.equal(report.valid, true, `Validation failed with errors: ${JSON.stringify(report.errors)}`);
    assert.equal(report.errors.length, 0);
    assert.ok(report.levelCount >= 60);
    assert.equal(report.duplicateCount, 0, 'No duplicate exercises allowed');
  });
});

describe('Missing Levels Bug Regression Suite (Levels 21–30 and 51–60)', () => {
  it('explicitly verifies Level 1 exists and opens correctly', () => {
    const l1 = getLessonByLevel(1);
    assert.ok(l1);
    assert.equal(l1.levelNumber, 1);
    assert.equal(l1.stageId, 1);
    assert.match(l1.exerciseText, /f j/i);
  });

  it('explicitly verifies Level 10 exists and is the Stage 1 Assessment', () => {
    const l10 = getLessonByLevel(10);
    assert.ok(l10);
    assert.equal(l10.levelNumber, 10);
    assert.equal(l10.stageId, 1);
    assert.equal(l10.isAssessment, true);
  });

  it('explicitly verifies Level 20 exists and is the Stage 2 Assessment', () => {
    const l20 = getLessonByLevel(20);
    assert.ok(l20);
    assert.equal(l20.levelNumber, 20);
    assert.equal(l20.stageId, 2);
    assert.equal(l20.isAssessment, true);
  });

  it('REGRESSION CHECK: explicitly verifies Level 21 exists, opens, and starts Stage 3', () => {
    const l21 = getLessonByLevel(21);
    assert.ok(l21, 'Level 21 must not be missing!');
    assert.equal(l21.levelNumber, 21);
    assert.equal(l21.stageId, 3);
    assert.match(l21.title, /top-row/i);
    assert.ok(l21.exerciseText.length >= 10);
  });

  it('REGRESSION CHECK: explicitly verifies all levels in range 21–30 exist and are contiguous', () => {
    for (let lvl = 21; lvl <= 30; lvl++) {
      const lesson = getLessonByLevel(lvl);
      assert.ok(lesson, `Level ${lvl} in range 21-30 must exist and not be dropped`);
      assert.equal(lesson.levelNumber, lvl);
      assert.equal(lesson.stageId, 3);
      assert.ok(lesson.exerciseText.length >= 10);
    }
  });

  it('explicitly verifies Level 30 exists and is the Stage 3 Assessment', () => {
    const l30 = getLessonByLevel(30);
    assert.ok(l30, 'Level 30 must not be missing!');
    assert.equal(l30.levelNumber, 30);
    assert.equal(l30.stageId, 3);
    assert.equal(l30.isAssessment, true);
  });

  it('explicitly verifies Level 31 exists, opens, and starts Stage 4', () => {
    const l31 = getLessonByLevel(31);
    assert.ok(l31);
    assert.equal(l31.levelNumber, 31);
    assert.equal(l31.stageId, 4);
    assert.match(l31.title, /bottom-row/i);
  });

  it('explicitly verifies Level 50 exists and is the Stage 5 Assessment', () => {
    const l50 = getLessonByLevel(50);
    assert.ok(l50);
    assert.equal(l50.levelNumber, 50);
    assert.equal(l50.stageId, 5);
    assert.equal(l50.isAssessment, true);
  });

  it('REGRESSION CHECK: explicitly verifies Level 51 exists, opens, and starts Stage 6', () => {
    const l51 = getLessonByLevel(51);
    assert.ok(l51, 'Level 51 must not be missing!');
    assert.equal(l51.levelNumber, 51);
    assert.equal(l51.stageId, 6);
    assert.ok(l51.exerciseText.length >= 15);
  });

  it('REGRESSION CHECK: explicitly verifies all levels in range 51–60 exist and are contiguous', () => {
    for (let lvl = 51; lvl <= 60; lvl++) {
      const lesson = getLessonByLevel(lvl);
      assert.ok(lesson, `Level ${lvl} in range 51-60 must exist and not be dropped`);
      assert.equal(lesson.levelNumber, lvl);
      assert.equal(lesson.stageId, 6);
      assert.ok(lesson.exerciseText.length >= 15);
    }
  });

  it('explicitly verifies Level 60 exists and is the Capstone Graduation Assessment', () => {
    const l60 = getLessonByLevel(60);
    assert.ok(l60, 'Level 60 must not be missing!');
    assert.equal(l60.levelNumber, 60);
    assert.equal(l60.stageId, 6);
    assert.equal(l60.isAssessment, true);
    assert.match(l60.title, /graduation/i);
  });
});

describe('Curriculum Educational Quality & Anti-Repetition Auditing', () => {
  it('guarantees zero excessive repeated characters (no fffff, aaaaa, sssss, ddddd, jjjjj)', () => {
    MASTER_LESSONS.forEach((l) => {
      const spam = l.exerciseText.match(/([a-zA-Z0-9;.,])\1{4,}/);
      assert.equal(spam, null, `Level ${l.levelNumber} contains repeated spam: "${spam ? spam[0] : ''}"`);
    });
  });

  it('guarantees zero duplicate exercise passages across all 60+ levels', () => {
    const seen = new Map();
    MASTER_LESSONS.forEach((l) => {
      const norm = l.exerciseText.trim().toLowerCase().replace(/\s+/g, ' ');
      assert.equal(seen.has(norm), false, `Level ${l.levelNumber} duplicates Level ${seen.get(norm)}: "${norm}"`);
      seen.set(norm, l.levelNumber);
    });
  });

  it('verifies all exercise characters map cleanly to supported ANSI keys and fingers', () => {
    MASTER_LESSONS.forEach((l) => {
      for (const char of l.exerciseText) {
        const mapped = FINGER_MAP[char] || FINGER_MAP[char.toLowerCase()];
        assert.ok(mapped, `Level ${l.levelNumber} contains unmapped character: "${char}"`);
      }
    });
  });

  it('verifies target WPM and accuracy increase progressively from beginner to expert', () => {
    const l1 = getLessonByLevel(1);
    const l20 = getLessonByLevel(20);
    const l40 = getLessonByLevel(40);
    const l60 = getLessonByLevel(60);

    assert.ok(l20.targetWpm >= l1.targetWpm);
    assert.ok(l40.targetWpm >= l20.targetWpm);
    assert.ok(l60.targetWpm >= l40.targetWpm);

    assert.ok(l60.targetAccuracy >= l1.targetAccuracy);
  });
});

describe('Curriculum Navigation & Stage Unit Progression', () => {
  it('getNextLessonId correctly crosses stage boundaries', () => {
    // Level 10 -> Level 11 (Stage 1 -> Stage 2)
    const next10 = getNextLessonId(1, 10);
    assert.deepEqual(next10, { stageId: 2, lessonNum: 11, levelNumber: 11 });

    // Level 20 -> Level 21 (Stage 2 -> Stage 3)
    const next20 = getNextLessonId(2, 20);
    assert.deepEqual(next20, { stageId: 3, lessonNum: 21, levelNumber: 21 });

    // Level 30 -> Level 31 (Stage 3 -> Stage 4)
    const next30 = getNextLessonId(3, 30);
    assert.deepEqual(next30, { stageId: 4, lessonNum: 31, levelNumber: 31 });

    // Level 50 -> Level 51 (Stage 5 -> Stage 6)
    const next50 = getNextLessonId(5, 50);
    assert.deepEqual(next50, { stageId: 6, lessonNum: 51, levelNumber: 51 });

    // Level 60 -> Level 61 (Stage 6 -> Stage 7)
    const next60 = getNextLessonId(6, 60);
    assert.deepEqual(next60, { stageId: 7, lessonNum: 61, levelNumber: 61 });
  });

  it('getAllUnits returns all 7 stages without dropping any modules', () => {
    const units = getAllUnits();
    assert.equal(units.length, 7);
    assert.equal(units[0].startLesson, 1);
    assert.equal(units[0].endLesson, 10);
    assert.equal(units[2].startLesson, 21);
    assert.equal(units[2].endLesson, 30);
    assert.equal(units[5].startLesson, 51);
    assert.equal(units[5].endLesson, 60);
  });

  it('getStageUnits returns correct units for each stage', () => {
    const stage3Units = getStageUnits(3);
    assert.equal(stage3Units.length, 1);
    assert.equal(stage3Units[0].startLesson, 21);
    assert.equal(stage3Units[0].endLesson, 30);
    assert.equal(stage3Units[0].lessonsCount, 10);
  });
});

describe('Curriculum Validator Negative Tests (Fixture Defect Detection)', () => {
  it('detects a missing sequential level', () => {
    // Malformed curriculum missing Level 4
    const malformed = MASTER_LESSONS.filter((l) => l.levelNumber !== 4);
    const report = validateCurriculum(malformed);
    assert.equal(report.valid, false);
    assert.ok(report.errors.some((e) => e.includes('Level 4 is not present')));
  });

  it('detects duplicate lesson IDs', () => {
    const malformed = [
      { ...MASTER_LESSONS[0], id: 'duplicate-id-test' },
      { ...MASTER_LESSONS[1], id: 'duplicate-id-test', levelNumber: 2 },
    ];
    const report = validateCurriculum(malformed);
    assert.equal(report.valid, false);
    assert.ok(report.errors.some((e) => e.includes('Duplicate lesson ID')));
  });

  it('detects duplicate exercise text across different levels', () => {
    const malformed = [
      ...MASTER_LESSONS.slice(0, 5),
      {
        ...MASTER_LESSONS[0],
        levelNumber: 6,
        id: 'level-06-clone',
        exerciseText: MASTER_LESSONS[0].exerciseText,
      },
    ];
    const report = validateCurriculum(malformed);
    assert.equal(report.valid, false);
    assert.ok(report.errors.some((e) => e.includes('Duplicate exercise text')));
  });

  it('detects empty or too-short exercise text', () => {
    const malformed = [
      {
        ...MASTER_LESSONS[0],
        exerciseText: 'too short',
      },
    ];
    const report = validateCurriculum(malformed);
    assert.equal(report.valid, false);
    assert.ok(report.errors.some((e) => e.includes('Exercise text too short')));
  });

  it('detects excessive character spam (e.g. "aaaaa")', () => {
    const malformed = [
      {
        ...MASTER_LESSONS[0],
        exerciseText: 'aaaaa bbbbb ccccc ddddd eeeee',
      },
    ];
    const report = validateCurriculum(malformed);
    assert.equal(report.valid, false);
    assert.ok(report.errors.some((e) => e.includes('Excessive repeated character spam')));
  });

  it('detects unsupported characters not in physical keyboard map', () => {
    const malformed = [
      {
        ...MASTER_LESSONS[0],
        exerciseText: 'hello world with emoji 🚀 and greek Ω',
      },
    ];
    const report = validateCurriculum(malformed);
    assert.equal(report.valid, false);
    assert.ok(report.errors.some((e) => e.includes('Unsupported character')));
  });

  it('detects invalid prerequisite chains', () => {
    const malformed = [
      { ...MASTER_LESSONS[0] },
      { ...MASTER_LESSONS[1], prerequisiteLevel: 99 }, // Expected 1, found 99
    ];
    const report = validateCurriculum(malformed);
    assert.equal(report.valid, false);
    assert.ok(report.errors.some((e) => e.includes('Invalid prerequisite')));
  });
});
