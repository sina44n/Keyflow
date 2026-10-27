import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  STAGE_CURRICULA,
  STAGE_META,
  UNIT_DEFINITIONS,
  getLesson,
  getLessonById,
  getLessonByLevel,
  getLessonMeta,
  getStageUnits,
  getAllUnits,
  getNextLessonId,
  getPrevLessonId,
  validateCurriculum,
  getTotalLessonCount,
  FINGER_MAP,
} from './curriculumEngine.js';

describe('KEYFLOW Masterpiece Academy — Complete 4,200-Level Architecture & Integrity', () => {
  it('contains exactly 4,200 curated educational levels across 7 stages', () => {
    assert.equal(getTotalLessonCount(), 4200);
    for (let s = 1; s <= 7; s++) {
      assert.equal(STAGE_CURRICULA[s]?.length, 600, `Stage ${s} must have exactly 600 lessons`);
    }
  });

  it('contains exactly 7 progressive stages with distinct pedagogical objectives', () => {
    assert.equal(STAGE_META.length, 7);
    assert.equal(STAGE_META[0].title, 'Home Row Foundations');
    assert.equal(STAGE_META[1].title, 'Top Row Control');
    assert.equal(STAGE_META[2].title, 'Bottom Row Control');
    assert.equal(STAGE_META[3].title, 'Common Letter Combinations & Morphemes');
    assert.equal(STAGE_META[4].title, 'Word Flow & Cadence');
    assert.equal(STAGE_META[5].title, 'Sentence Rhythm & Shift Discipline');
    assert.equal(STAGE_META[6].title, 'Precision, Speed Endurance & Capstone Mastery');

    STAGE_META.forEach((meta, idx) => {
      assert.equal(meta.stageId, idx + 1);
      assert.equal(meta.startLevel, 1);
      assert.equal(meta.endLevel, 600);
      assert.equal(meta.totalLessons, 600);
    });
  });

  it('contains exactly 210 curricular units (30 units per stage x 7 stages)', () => {
    assert.equal(UNIT_DEFINITIONS.length, 210);
    for (let s = 1; s <= 7; s++) {
      const stageUnits = getStageUnits(s);
      assert.equal(stageUnits.length, 30, `Stage ${s} must have exactly 30 units`);
      stageUnits.forEach((u, i) => {
        assert.equal(u.unitNumber, i + 1);
        assert.equal(u.stageId, s);
        assert.equal(u.endLesson - u.startLesson + 1, 20, `Stage ${s} Unit ${u.unitNumber} must have 20 lessons`);
      });
    }
  });

  it('ensures every lesson in every stage has a unique stable ID (S1-L001 to S7-L600)', () => {
    const ids = new Set();
    for (let s = 1; s <= 7; s++) {
      for (let l = 1; l <= 600; l++) {
        const lesson = getLesson(s, l);
        assert.ok(lesson, `Lesson S${s}-L${l} must exist`);
        const expectedId = `S${s}-L${String(l).padStart(3, '0')}`;
        assert.equal(lesson.id, expectedId);
        assert.equal(ids.has(lesson.id), false, `Duplicate ID detected: ${lesson.id}`);
        ids.add(lesson.id);
      }
    }
    assert.equal(ids.size, 4200, 'All 4,200 lessons must have distinct IDs');
  });

  it('retrieves lessons via getLesson, getLessonById, and getLessonByLevel', () => {
    const l1 = getLesson(1, 1);
    const l1ById = getLessonById('S1-L001');
    const l1ByLevel = getLessonByLevel(1, 1);
    assert.equal(l1.id, 'S1-L001');
    assert.equal(l1ById.id, 'S1-L001');
    assert.equal(l1ByLevel.id, 'S1-L001');

    const s4l45 = getLesson(4, 45);
    const s4l45ById = getLessonById('S4-L045');
    assert.equal(s4l45.id, 'S4-L045');
    assert.equal(s4l45ById.id, 'S4-L045');

    const meta = getLessonMeta(4, 45);
    assert.equal(meta.id, 'S4-L045');
    assert.equal(meta.stageId, 4);
    assert.equal(meta.levelNumber, 45);
  });

  it('validates the complete 4,200-lesson curriculum with validateCurriculum utility without errors', () => {
    const report = validateCurriculum();
    assert.equal(report.valid, true, `Validation failed with errors: ${JSON.stringify(report.errors.slice(0, 5))}`);
    assert.equal(report.errors.length, 0);
    assert.equal(report.totalStages, 7);
    assert.equal(report.totalLessons, 4200);
  });
});

describe('Stage Progression & Checkpoints Regression Suite', () => {
  it('verifies Stage 1 (Home Row) bounds and character discipline', () => {
    const l1 = getLesson(1, 1);
    const l600 = getLesson(1, 600);
    assert.equal(l1.id, 'S1-L001');
    assert.equal(l600.id, 'S1-L600');
    assert.equal(l600.isAssessment, true);
    assert.equal(l600.isMilestone, true);

    // Stage 1 must only use home row keys [asdfghjkl; ]
    const homeRowRegex = /^[asdfghjkl; ]+$/i;
    assert.ok(homeRowRegex.test(l1.exerciseText));
    assert.ok(homeRowRegex.test(l600.exerciseText));
  });

  it('verifies Stage 2 (Top Row) bounds and character discipline', () => {
    const l1 = getLesson(2, 1);
    const l600 = getLesson(2, 600);
    assert.equal(l1.id, 'S2-L001');
    assert.equal(l600.id, 'S2-L600');

    // Stage 2 must only use top row and home row [qwertyuiopasdfghjkl; ]
    const topHomeRegex = /^[qwertyuiopasdfghjkl; ]+$/i;
    assert.ok(topHomeRegex.test(l1.exerciseText));
    assert.ok(topHomeRegex.test(l600.exerciseText));
  });

  it('verifies Stage 3 (Bottom Row) bounds and character discipline', () => {
    const l1 = getLesson(3, 1);
    const l600 = getLesson(3, 600);
    assert.equal(l1.id, 'S3-L001');
    assert.equal(l600.id, 'S3-L600');
  });

  it('verifies Stage 4 (Morphemes) bounds and content', () => {
    const l1 = getLesson(4, 1);
    const l600 = getLesson(4, 600);
    assert.equal(l1.id, 'S4-L001');
    assert.equal(l600.id, 'S4-L600');
  });

  it('verifies Stage 5 (Word Flow & Cadence) bounds and content', () => {
    const l1 = getLesson(5, 1);
    const l600 = getLesson(5, 600);
    assert.equal(l1.id, 'S5-L001');
    assert.equal(l600.id, 'S5-L600');
  });

  it('verifies Stage 6 (Sentence Rhythm & Shift) bounds and content', () => {
    const l1 = getLesson(6, 1);
    const l600 = getLesson(6, 600);
    assert.equal(l1.id, 'S6-L001');
    assert.equal(l600.id, 'S6-L600');
    // Shift discipline includes capital letters and punctuation
    assert.match(l1.exerciseText, /[A-Z]/);
    assert.match(l600.exerciseText, /[A-Z]/);
  });

  it('verifies Stage 7 (Precision & Grandmaster) bounds and final capstone', () => {
    const l1 = getLesson(7, 1);
    const l600 = getLesson(7, 600);
    assert.equal(l1.id, 'S7-L001');
    assert.equal(l600.id, 'S7-L600');
    assert.match(l600.title, /Grandmaster Capstone/i);
    assert.match(l600.exerciseText, /4,200/);
    assert.ok(l600.exerciseText.length >= 700);
  });
});

describe('Continuous Progression & Navigation across all 4,200 Levels', () => {
  it('getNextLessonId correctly advances within stage and crosses stage boundaries', () => {
    // Within stage
    const next1 = getNextLessonId(1, 1);
    assert.equal(next1.id, 'S1-L002');
    assert.equal(next1.levelNumber, 2);

    // Cross Unit 1 to Unit 2 (Level 20 -> 21)
    const next20 = getNextLessonId(1, 20);
    assert.equal(next20.id, 'S1-L021');
    assert.equal(next20.levelNumber, 21);

    // Cross Stage 1 to Stage 2 (S1-L600 -> S2-L001)
    const nextS1End = getNextLessonId(1, 600);
    assert.equal(nextS1End.id, 'S2-L001');
    assert.equal(nextS1End.stageId, 2);
    assert.equal(nextS1End.levelNumber, 1);

    // Cross Stage 2 to Stage 3 (S2-L600 -> S3-L001)
    const nextS2End = getNextLessonId(2, 600);
    assert.equal(nextS2End.id, 'S3-L001');

    // Cross Stage 3 to Stage 4 (S3-L600 -> S4-L001)
    const nextS3End = getNextLessonId(3, 600);
    assert.equal(nextS3End.id, 'S4-L001');

    // Cross Stage 4 to Stage 5 (S4-L600 -> S5-L001)
    const nextS4End = getNextLessonId(4, 600);
    assert.equal(nextS4End.id, 'S5-L001');

    // Cross Stage 5 to Stage 6 (S5-L600 -> S6-L001)
    const nextS5End = getNextLessonId(5, 600);
    assert.equal(nextS5End.id, 'S6-L001');

    // Cross Stage 6 to Stage 7 (S6-L600 -> S7-L001)
    const nextS6End = getNextLessonId(6, 600);
    assert.equal(nextS6End.id, 'S7-L001');

    // Stage 7 Level 600 is final lesson - returns null
    const nextS7End = getNextLessonId(7, 600);
    assert.equal(nextS7End, null, 'S7-L600 is the final capstone');
  });

  it('getPrevLessonId correctly steps backward within stage and across stage boundaries', () => {
    // Within stage
    const prev2 = getPrevLessonId(1, 2);
    assert.equal(prev2.id, 'S1-L001');

    // Across stage boundary: S2-L001 -> S1-L600
    const prevS2Start = getPrevLessonId(2, 1);
    assert.equal(prevS2Start.id, 'S1-L600');
    assert.equal(prevS2Start.stageId, 1);
    assert.equal(prevS2Start.levelNumber, 600);

    // First lesson S1-L001 has no previous
    const prevS1Start = getPrevLessonId(1, 1);
    assert.equal(prevS1Start, null);
  });

  it('getAllUnits returns all 210 units covering 4,200 levels', () => {
    const units = getAllUnits();
    assert.equal(units.length, 210);
    assert.equal(units[0].stageId, 1);
    assert.equal(units[0].startLesson, 1);
    assert.equal(units[0].endLesson, 20);

    assert.equal(units[209].stageId, 7);
    assert.equal(units[209].unitNumber, 30);
    assert.equal(units[209].startLesson, 581);
    assert.equal(units[209].endLesson, 600);
  });
});

describe('Curriculum Educational Quality & Anti-Repetition Auditing', () => {
  it('guarantees zero excessive repeated characters across all 4,200 levels', () => {
    for (let s = 1; s <= 7; s++) {
      STAGE_CURRICULA[s].forEach((l) => {
        const match = l.exerciseText.match(/([a-zA-Z0-9;.,])\1{4,}/);
        assert.equal(match, null, `Stage ${s} Level ${l.levelNumber} contains character spam: "${match?.[0]}"`);
      });
    }
  });

  it('guarantees zero duplicate exercise passages within any stage', () => {
    for (let s = 1; s <= 7; s++) {
      const seen = new Map();
      STAGE_CURRICULA[s].forEach((l) => {
        const norm = l.exerciseText.trim().toLowerCase().replace(/\s+/g, ' ');
        assert.equal(seen.has(norm), false, `Stage ${s} Level ${l.levelNumber} duplicates Level ${seen.get(norm)}`);
        seen.set(norm, l.levelNumber);
      });
    }
  });

  it('verifies all exercise characters map cleanly to supported ANSI keys and fingers', () => {
    for (let s = 1; s <= 7; s++) {
      STAGE_CURRICULA[s].forEach((l) => {
        for (const ch of l.exerciseText) {
          const hasFinger = Boolean(FINGER_MAP[ch] || FINGER_MAP[ch.toLowerCase()]);
          assert.ok(hasFinger, `Stage ${s} Level ${l.levelNumber} has unmapped character "${ch}"`);
        }
      });
    }
  });

  it('verifies target WPM and accuracy increase progressively from beginner to grandmaster', () => {
    const s1l1 = getLesson(1, 1);
    const s1l600 = getLesson(1, 600);
    const s7l1 = getLesson(7, 1);
    const s7l600 = getLesson(7, 600);

    assert.ok(s1l1.targetWpm <= s1l600.targetWpm);
    assert.ok(s1l600.targetWpm <= s7l1.targetWpm);
    assert.ok(s7l1.targetWpm <= s7l600.targetWpm);
    assert.ok(s7l600.targetWpm >= 70);
    assert.ok(s7l600.targetAccuracy >= 96);
  });

  it('verifies progressive character length scaling from tactile drills to extended prose', () => {
    const s1Short = getLesson(1, 5);
    const s1Mid = getLesson(1, 200);
    const s7Capstone = getLesson(7, 600);

    assert.ok(s1Short.exerciseText.length < 80, `Early level text should be focused: ${s1Short.exerciseText.length}`);
    assert.ok(s1Mid.exerciseText.length > s1Short.exerciseText.length, 'Mid-stage should be longer than early drills');
    assert.ok(s7Capstone.exerciseText.length >= 700, `Capstone should be comprehensive: ${s7Capstone.exerciseText.length}`);
  });
});

describe('Curriculum Validator Negative Tests (Fixture Defect Detection)', () => {
  const baseLesson = STAGE_CURRICULA[1][0];

  it('detects a missing sequential level', () => {
    const broken = [
      { ...baseLesson, levelNumber: 1, id: 'S1-L001' },
      { ...baseLesson, levelNumber: 3, id: 'S1-L003' },
    ];
    const report = validateCurriculum(broken);
    assert.equal(report.valid, false);
    assert.ok(report.errors.some((e) => e.includes('Missing sequential level')));
  });

  it('detects duplicate lesson IDs', () => {
    const broken = [
      { ...baseLesson, levelNumber: 1, id: 'duplicate-id' },
      { ...baseLesson, levelNumber: 2, id: 'duplicate-id' },
    ];
    const report = validateCurriculum(broken);
    assert.equal(report.valid, false);
    assert.ok(report.errors.some((e) => e.includes('Duplicate lesson ID')));
  });

  it('detects duplicate exercise text across different levels', () => {
    const broken = [
      { ...baseLesson, levelNumber: 1, id: 'S1-L001', exerciseText: 'identical repeated passage text' },
      { ...baseLesson, levelNumber: 2, id: 'S1-L002', exerciseText: 'identical repeated passage text' },
    ];
    const report = validateCurriculum(broken);
    assert.equal(report.valid, false);
    assert.ok(report.errors.some((e) => e.includes('Duplicate exercise text')));
  });

  it('detects empty or too-short exercise text', () => {
    const broken = [
      { ...baseLesson, levelNumber: 1, id: 'S1-L001', exerciseText: 'abc' },
    ];
    const report = validateCurriculum(broken);
    assert.equal(report.valid, false);
    assert.ok(report.errors.some((e) => e.includes('Exercise text too short')));
  });

  it('detects excessive character spam (e.g. "aaaaa")', () => {
    const broken = [
      { ...baseLesson, levelNumber: 1, id: 'S1-L001', exerciseText: 'aaaaa bbbbb ccccc ddddd' },
    ];
    const report = validateCurriculum(broken);
    assert.equal(report.valid, false);
    assert.ok(report.errors.some((e) => e.includes('Excessive repeated character spam')));
  });

  it('detects unsupported characters not in physical keyboard map', () => {
    const broken = [
      { ...baseLesson, levelNumber: 1, id: 'S1-L001', exerciseText: 'valid text with emojis 🚀 and 🦄' },
    ];
    const report = validateCurriculum(broken);
    assert.equal(report.valid, false);
    assert.ok(report.errors.some((e) => e.includes('Unsupported character not in keyboard map')));
  });

  it('detects invalid prerequisite chains', () => {
    const broken = [
      { ...baseLesson, levelNumber: 1, id: 'S1-L001', prerequisiteLevel: null },
      { ...baseLesson, levelNumber: 2, id: 'S1-L002', prerequisiteLevel: 99 },
    ];
    const report = validateCurriculum(broken);
    assert.equal(report.valid, false);
    assert.ok(report.errors.some((e) => e.includes('Invalid prerequisite')));
  });
});
