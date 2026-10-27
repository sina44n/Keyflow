import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  MASTER_LESSONS,
  STAGE_META,
  UNIT_DEFINITIONS,
  getLessonByLevel,
  getStageUnits,
  getAllUnits,
  getNextLessonId,
  validateCurriculum,
  FINGER_MAP,
} from './curriculumEngine.js';

describe('KEYFLOW Masterpiece Academy — Complete 600-Level Architecture & Integrity', () => {
  it('contains exactly 600 curated educational levels', () => {
    assert.equal(MASTER_LESSONS.length, 600, `Expected exactly 600 levels, found ${MASTER_LESSONS.length}`);
  });

  it('contains exactly 7 progressive stages covering Foundation to Capstone Mastery', () => {
    assert.equal(STAGE_META.length, 7);
    assert.equal(STAGE_META[0].title, 'Home Row Foundations');
    assert.equal(STAGE_META[1].title, 'Top Row Control');
    assert.equal(STAGE_META[2].title, 'Bottom Row Control');
    assert.equal(STAGE_META[3].title, 'Common Letter Combinations & Morphemes');
    assert.equal(STAGE_META[4].title, 'Word Flow & Cadence');
    assert.equal(STAGE_META[5].title, 'Sentence Rhythm & Shift Discipline');
    assert.equal(STAGE_META[6].title, 'Precision, Speed Endurance & Capstone Mastery');
  });

  it('contains exactly 30 curricular units with 20 lessons per unit', () => {
    assert.equal(UNIT_DEFINITIONS.length, 30);
    UNIT_DEFINITIONS.forEach((u, i) => {
      assert.equal(u.unitNumber, i + 1);
      assert.equal(u.endLesson - u.startLesson + 1, 20, `Unit ${u.unitNumber} must have 20 lessons`);
    });
  });

  it('ensures every level from 1 to 600 appears in exact sequential order with complete metadata', () => {
    for (let i = 1; i <= 600; i++) {
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

  it('ensures all 600 lesson IDs are unique and properly formatted', () => {
    const ids = new Set();
    MASTER_LESSONS.forEach((l) => {
      const id = l.id || `level-${String(l.levelNumber).padStart(3, '0')}`;
      assert.equal(ids.has(id), false, `Duplicate ID detected: ${id}`);
      ids.add(id);
    });
    assert.equal(ids.size, 600);
  });

  it('validates the complete 600-level curriculum with validateCurriculum utility without errors', () => {
    const report = validateCurriculum();
    assert.equal(report.valid, true, `Validation failed with errors: ${JSON.stringify(report.errors)}`);
    assert.equal(report.errors.length, 0);
    assert.equal(report.levelCount, 600);
    assert.equal(report.duplicateCount, 0, 'No duplicate exercises allowed across all 600 levels');
  });
});

describe('Required Checkpoints & Range Regression Suite', () => {
  it('explicitly verifies Level 1 exists, opens, and establishes home row bumps', () => {
    const l1 = getLessonByLevel(1);
    assert.ok(l1);
    assert.equal(l1.levelNumber, 1);
    assert.equal(l1.stageId, 1);
    assert.match(l1.title, /Home Row Placement/i);
    assert.match(l1.exerciseText, /lad/i);
  });

  it('explicitly verifies Level 10 exists and has valid home row content', () => {
    const l10 = getLessonByLevel(10);
    assert.ok(l10);
    assert.equal(l10.levelNumber, 10);
    assert.equal(l10.stageId, 1);
  });

  it('explicitly verifies Level 20 exists and is the Unit 1 Assessment', () => {
    const l20 = getLessonByLevel(20);
    assert.ok(l20);
    assert.equal(l20.levelNumber, 20);
    assert.equal(l20.stageId, 1);
    assert.equal(l20.isAssessment, true);
  });

  it('REGRESSION CHECK: explicitly verifies Level 21 exists, opens, and starts Unit 2', () => {
    const l21 = getLessonByLevel(21);
    assert.ok(l21, 'Level 21 must not be missing!');
    assert.equal(l21.levelNumber, 21);
    assert.equal(l21.stageId, 1);
    assert.equal(l21.unitNumber, 2);
    assert.ok(l21.exerciseText.length >= 10);
  });

  it('REGRESSION CHECK: explicitly verifies all levels in range 21–30 exist and are contiguous', () => {
    for (let lvl = 21; lvl <= 30; lvl++) {
      const lesson = getLessonByLevel(lvl);
      assert.ok(lesson, `Level ${lvl} in range 21-30 must exist and not be dropped`);
      assert.equal(lesson.levelNumber, lvl);
    }
  });

  it('explicitly verifies Level 30 exists and has valid practice content', () => {
    const l30 = getLessonByLevel(30);
    assert.ok(l30);
    assert.equal(l30.levelNumber, 30);
  });

  it('explicitly verifies Level 31 exists and has valid practice content', () => {
    const l31 = getLessonByLevel(31);
    assert.ok(l31);
    assert.equal(l31.levelNumber, 31);
  });

  it('explicitly verifies Level 50 exists and has valid practice content', () => {
    const l50 = getLessonByLevel(50);
    assert.ok(l50);
    assert.equal(l50.levelNumber, 50);
    assert.equal(l50.isMilestone, true);
  });

  it('REGRESSION CHECK: explicitly verifies Level 51 exists, opens, and is contiguous', () => {
    const l51 = getLessonByLevel(51);
    assert.ok(l51, 'Level 51 must not be missing!');
    assert.equal(l51.levelNumber, 51);
  });

  it('REGRESSION CHECK: explicitly verifies all levels in range 51–60 exist and are contiguous', () => {
    for (let lvl = 51; lvl <= 60; lvl++) {
      const lesson = getLessonByLevel(lvl);
      assert.ok(lesson, `Level ${lvl} in range 51-60 must exist and not be dropped`);
      assert.equal(lesson.levelNumber, lvl);
    }
  });

  it('explicitly verifies Level 60 exists and is the Unit 3 Assessment', () => {
    const l60 = getLessonByLevel(60);
    assert.ok(l60);
    assert.equal(l60.levelNumber, 60);
    assert.equal(l60.isAssessment, true);
  });

  it('explicitly verifies Level 70 and 71 exist across Unit 4', () => {
    const l70 = getLessonByLevel(70);
    const l71 = getLessonByLevel(71);
    assert.ok(l70);
    assert.ok(l71);
    assert.equal(l70.levelNumber, 70);
    assert.equal(l71.levelNumber, 71);
  });

  it('explicitly verifies Stage 1 Capstone at Level 100', () => {
    const l100 = getLessonByLevel(100);
    assert.ok(l100);
    assert.equal(l100.levelNumber, 100);
    assert.equal(l100.stageId, 1);
    assert.equal(l100.isAssessment, true);
    assert.equal(l100.isMilestone, true);
  });

  it('explicitly verifies Level 200 (Stage 2 Assessment)', () => {
    const l200 = getLessonByLevel(200);
    assert.ok(l200);
    assert.equal(l200.levelNumber, 200);
    assert.equal(l200.isMilestone, true);
  });

  it('explicitly verifies Level 300 (Stage 3 Assessment)', () => {
    const l300 = getLessonByLevel(300);
    assert.ok(l300);
    assert.equal(l300.levelNumber, 300);
    assert.equal(l300.isMilestone, true);
  });

  it('explicitly verifies Level 400 (Stage 4 Assessment)', () => {
    const l400 = getLessonByLevel(400);
    assert.ok(l400);
    assert.equal(l400.levelNumber, 400);
    assert.equal(l400.isMilestone, true);
  });

  it('explicitly verifies Level 500 (Stage 5 Assessment)', () => {
    const l500 = getLessonByLevel(500);
    assert.ok(l500);
    assert.equal(l500.levelNumber, 500);
    assert.equal(l500.isMilestone, true);
  });

  it('explicitly verifies Level 599 and Level 600 Capstone Graduation', () => {
    const l599 = getLessonByLevel(599);
    const l600 = getLessonByLevel(600);
    assert.ok(l599);
    assert.ok(l600);
    assert.equal(l599.levelNumber, 599);
    assert.equal(l600.levelNumber, 600);
    assert.equal(l600.isAssessment, true);
    assert.equal(l600.isMilestone, true);
    assert.match(l600.title, /Grandmaster Capstone/i);
    assert.match(l600.exerciseText, /600-level KEYFLOW/i);
  });
});

describe('Curriculum Educational Quality & Anti-Repetition Auditing', () => {
  it('guarantees zero excessive repeated characters (no fffff, aaaaa, sssss, ddddd, jjjjj)', () => {
    MASTER_LESSONS.forEach((l) => {
      const match = l.exerciseText.match(/([a-zA-Z0-9;.,])\1{4,}/);
      assert.equal(match, null, `Level ${l.levelNumber} contains excessive character spam: "${match?.[0]}"`);
    });
  });

  it('guarantees zero duplicate exercise passages across all 600 levels', () => {
    const seen = new Map();
    MASTER_LESSONS.forEach((l) => {
      const norm = l.exerciseText.trim().toLowerCase().replace(/\s+/g, ' ');
      assert.equal(seen.has(norm), false, `Level ${l.levelNumber} duplicates exercise from Level ${seen.get(norm)}`);
      seen.set(norm, l.levelNumber);
    });
  });

  it('verifies all exercise characters map cleanly to supported ANSI keys and fingers', () => {
    MASTER_LESSONS.forEach((l) => {
      for (const ch of l.exerciseText) {
        const hasFinger = Boolean(FINGER_MAP[ch] || FINGER_MAP[ch.toLowerCase()]);
        assert.ok(hasFinger, `Level ${l.levelNumber} has unmapped character "${ch}"`);
      }
    });
  });

  it('verifies target WPM and accuracy increase progressively from beginner to expert', () => {
    const l1 = getLessonByLevel(1);
    const l100 = getLessonByLevel(100);
    const l300 = getLessonByLevel(300);
    const l600 = getLessonByLevel(600);

    assert.ok(l1.targetWpm <= l100.targetWpm);
    assert.ok(l100.targetWpm <= l300.targetWpm);
    assert.ok(l300.targetWpm <= l600.targetWpm);
    assert.ok(l600.targetWpm >= 65);
    assert.ok(l600.targetAccuracy >= 95);
  });
});

describe('Curriculum Navigation & Stage Unit Progression', () => {
  it('getNextLessonId correctly crosses unit and stage boundaries', () => {
    // Within unit
    const next1 = getNextLessonId(1, 1);
    assert.equal(next1.levelNumber, 2);

    // Cross Unit 1 to Unit 2 (Level 20 -> 21)
    const next20 = getNextLessonId(1, 20);
    assert.equal(next20.levelNumber, 21);

    // Cross Stage 1 to Stage 2 (Level 100 -> 101)
    const next100 = getNextLessonId(1, 100);
    assert.equal(next100.levelNumber, 101);
    assert.equal(next100.stageId, 2);

    // Final level (Level 600)
    const next600 = getNextLessonId(7, 600);
    assert.equal(next600, null, 'Level 600 is final lesson');
  });

  it('getAllUnits returns all 30 units covering 600 levels without dropping modules', () => {
    const units = getAllUnits();
    assert.equal(units.length, 30);
    assert.equal(units[0].startLesson, 1);
    assert.equal(units[0].endLesson, 20);
    assert.equal(units[29].startLesson, 581);
    assert.equal(units[29].endLesson, 600);
  });

  it('getStageUnits returns correct units for each stage', () => {
    const stage1Units = getStageUnits(1);
    assert.equal(stage1Units.length, 5);
    assert.equal(stage1Units[0].startLesson, 1);
    assert.equal(stage1Units[4].endLesson, 100);

    const stage7Units = getStageUnits(7);
    assert.equal(stage7Units.length, 5);
    assert.equal(stage7Units[0].startLesson, 501);
    assert.equal(stage7Units[4].endLesson, 600);
  });
});

describe('Curriculum Validator Negative Tests (Fixture Defect Detection)', () => {
  it('detects a missing sequential level', () => {
    const broken = MASTER_LESSONS.slice(0, 10).filter((l) => l.levelNumber !== 5);
    const report = validateCurriculum(broken);
    assert.equal(report.valid, false);
    assert.ok(report.errors.some((e) => e.includes('Missing sequential level')));
  });

  it('detects duplicate lesson IDs', () => {
    const broken = [
      { ...MASTER_LESSONS[0], id: 'duplicate-id' },
      { ...MASTER_LESSONS[1], id: 'duplicate-id' },
    ];
    const report = validateCurriculum(broken);
    assert.equal(report.valid, false);
    assert.ok(report.errors.some((e) => e.includes('Duplicate lesson ID')));
  });

  it('detects duplicate exercise text across different levels', () => {
    const broken = [
      { ...MASTER_LESSONS[0], levelNumber: 1, id: 'lvl-1', exerciseText: 'identical repeated passage text' },
      { ...MASTER_LESSONS[1], levelNumber: 2, id: 'lvl-2', exerciseText: 'identical repeated passage text' },
    ];
    const report = validateCurriculum(broken);
    assert.equal(report.valid, false);
    assert.ok(report.errors.some((e) => e.includes('Duplicate exercise text')));
  });

  it('detects empty or too-short exercise text', () => {
    const broken = [
      { ...MASTER_LESSONS[0], levelNumber: 1, id: 'lvl-1', exerciseText: 'abc' },
    ];
    const report = validateCurriculum(broken);
    assert.equal(report.valid, false);
    assert.ok(report.errors.some((e) => e.includes('Exercise text too short')));
  });

  it('detects excessive character spam (e.g. "aaaaa")', () => {
    const broken = [
      { ...MASTER_LESSONS[0], levelNumber: 1, id: 'lvl-1', exerciseText: 'aaaaa bbbbb ccccc ddddd' },
    ];
    const report = validateCurriculum(broken);
    assert.equal(report.valid, false);
    assert.ok(report.errors.some((e) => e.includes('Excessive repeated character spam')));
  });

  it('detects unsupported characters not in physical keyboard map', () => {
    const broken = [
      { ...MASTER_LESSONS[0], levelNumber: 1, id: 'lvl-1', exerciseText: 'valid text with emojis 🚀 and 🦄' },
    ];
    const report = validateCurriculum(broken);
    assert.equal(report.valid, false);
    assert.ok(report.errors.some((e) => e.includes('Unsupported character')));
  });

  it('detects invalid prerequisite chains', () => {
    const broken = [
      { ...MASTER_LESSONS[0], levelNumber: 1, id: 'lvl-1', prerequisiteLevel: null },
      { ...MASTER_LESSONS[1], levelNumber: 2, id: 'lvl-2', prerequisiteLevel: 99 },
    ];
    const report = validateCurriculum(broken);
    assert.equal(report.valid, false);
    assert.ok(report.errors.some((e) => e.includes('Invalid prerequisite')));
  });
});
