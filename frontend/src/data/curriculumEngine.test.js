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

describe('KEYFLOW Masterpiece Academy — Complete 7,000-Level Architecture & Integrity', () => {
  it('contains exactly 7,000 curated educational levels across 10 stages', () => {
    assert.equal(getTotalLessonCount(), 7000);
    for (let s = 1; s <= 10; s++) {
      assert.equal(STAGE_CURRICULA[s]?.length, 700, `Stage ${s} must have exactly 700 lessons`);
    }
  });

  it('contains exactly 10 progressive stages with distinct pedagogical objectives', () => {
    assert.equal(STAGE_META.length, 10);
    assert.equal(STAGE_META[0].title, 'Home Row Foundations');
    assert.equal(STAGE_META[1].title, 'Top Row Control');
    assert.equal(STAGE_META[2].title, 'Bottom Row Control');
    assert.equal(STAGE_META[3].title, 'Full Alphabet Mastery & Cross-Row Transitions');
    assert.equal(STAGE_META[4].title, 'Number Row Mastery & Ten-Key Dexterity');
    assert.equal(STAGE_META[5].title, 'Shift Discipline, Punctuation & Common Symbols');
    assert.equal(STAGE_META[6].title, 'High-Frequency Vocabulary & Rhythm Cadence');
    assert.equal(STAGE_META[7].title, 'Speed & Endurance Building');
    assert.equal(STAGE_META[8].title, 'Technical, Numeric & Professional Fluency');
    assert.equal(STAGE_META[9].title, 'Master Typist & Specialization');

    STAGE_META.forEach((meta, idx) => {
      assert.equal(meta.stageId, idx + 1);
      assert.equal(meta.startLevel, 1);
      assert.equal(meta.endLevel, 700);
      assert.equal(meta.totalLessons, 700);
    });
  });

  it('contains exactly 700 curricular units (70 units per stage x 10 stages)', () => {
    assert.equal(UNIT_DEFINITIONS.length, 700);
    for (let s = 1; s <= 10; s++) {
      const stageUnits = getStageUnits(s);
      assert.equal(stageUnits.length, 70, `Stage ${s} must have exactly 70 units`);
      stageUnits.forEach((u, i) => {
        assert.equal(u.unitNumber, i + 1);
        assert.equal(u.stageId, s);
        assert.equal(u.endLesson - u.startLesson + 1, 10, `Stage ${s} Unit ${u.unitNumber} must have 10 lessons`);
      });
    }
  });

  it('ensures every lesson in every stage has a unique stable ID (S1-L001 to S10-L700)', () => {
    const ids = new Set();
    for (let s = 1; s <= 10; s++) {
      for (let l = 1; l <= 700; l++) {
        const lesson = getLesson(s, l);
        assert.ok(lesson, `Lesson S${s}-L${l} must exist`);
        const expectedId = `S${s}-L${String(l).padStart(3, '0')}`;
        assert.equal(lesson.id, expectedId);
        assert.equal(ids.has(lesson.id), false, `Duplicate ID detected: ${lesson.id}`);
        ids.add(lesson.id);
      }
    }
    assert.equal(ids.size, 7000, 'All 7,000 lessons must have distinct IDs');
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

    const s10l700 = getLesson(10, 700);
    assert.equal(s10l700.id, 'S10-L700');
  });

  it('validates the complete 7,000-lesson curriculum with validateCurriculum utility without errors', () => {
    const report = validateCurriculum();
    assert.equal(report.valid, true, `Validation failed with errors: ${JSON.stringify(report.errors.slice(0, 5))}`);
    assert.equal(report.errors.length, 0);
    assert.equal(report.totalStages, 10);
    assert.equal(report.totalLessons, 7000);
  });
});

describe('Stage Progression & Checkpoints Regression Suite', () => {
  it('verifies Stage 1 (Home Row) bounds and character discipline', () => {
    const l1 = getLesson(1, 1);
    const l700 = getLesson(1, 700);
    assert.equal(l1.id, 'S1-L001');
    assert.equal(l700.id, 'S1-L700');
    assert.equal(l700.isAssessment, true);
    assert.equal(l700.isMilestone, true);

    // Stage 1 must only use home row keys [asdfghjkl; ]
    const homeRowRegex = /^[asdfghjkl; ]+$/i;
    assert.ok(homeRowRegex.test(l1.exerciseText));
    assert.ok(homeRowRegex.test(l700.exerciseText));
  });

  it('verifies Stage 2 (Top Row) bounds and character discipline', () => {
    const l1 = getLesson(2, 1);
    const l700 = getLesson(2, 700);
    assert.equal(l1.id, 'S2-L001');
    assert.equal(l700.id, 'S2-L700');

    // Stage 2 must only use letters, space, and semicolons (no numbers, quotes or symbols)
    const stage2Regex = /^[a-z; ]+$/i;
    assert.ok(stage2Regex.test(l1.exerciseText));
    assert.ok(stage2Regex.test(l700.exerciseText));
  });

  it('verifies Stage 3 (Bottom Row) bounds and character discipline', () => {
    const l1 = getLesson(3, 1);
    const l700 = getLesson(3, 700);
    assert.equal(l1.id, 'S3-L001');
    assert.equal(l700.id, 'S3-L700');
  });

  it('verifies Stage 4 (Full Alphabet) bounds and content', () => {
    const l1 = getLesson(4, 1);
    const l700 = getLesson(4, 700);
    assert.equal(l1.id, 'S4-L001');
    assert.equal(l700.id, 'S4-L700');
  });

  it('verifies Stage 5 (Number Row) bounds and content', () => {
    const l1 = getLesson(5, 1);
    const l700 = getLesson(5, 700);
    assert.equal(l1.id, 'S5-L001');
    assert.equal(l700.id, 'S5-L700');
  });

  it('verifies Stage 6 (Sentence Rhythm & Shift) bounds and content', () => {
    const l1 = getLesson(6, 1);
    const l700 = getLesson(6, 700);
    assert.equal(l1.id, 'S6-L001');
    assert.equal(l700.id, 'S6-L700');
    // Shift discipline includes capital letters and punctuation
    assert.match(l1.exerciseText, /[A-Z]/);
    assert.match(l700.exerciseText, /[A-Z]/);
  });

  it('verifies Stage 10 (Master Typist) bounds and final capstone', () => {
    const l1 = getLesson(10, 1);
    const l700 = getLesson(10, 700);
    assert.equal(l1.id, 'S10-L001');
    assert.equal(l700.id, 'S10-L700');
    assert.ok(l700.exerciseText.length >= 300);
  });
});

describe('Continuous Progression & Navigation across all 7,000 Levels', () => {
  it('getNextLessonId correctly advances within stage and crosses stage boundaries', () => {
    // Within stage
    const next1 = getNextLessonId(1, 1);
    assert.equal(next1.id, 'S1-L002');
    assert.equal(next1.levelNumber, 2);

    // Cross Unit 1 to Unit 2 (Level 10 -> 11)
    const next10 = getNextLessonId(1, 10);
    assert.equal(next10.id, 'S1-L011');
    assert.equal(next10.levelNumber, 11);

    // Cross Stage 1 to Stage 2 (S1-L700 -> S2-L001)
    const nextS1End = getNextLessonId(1, 700);
    assert.equal(nextS1End.id, 'S2-L001');
    assert.equal(nextS1End.stageId, 2);
    assert.equal(nextS1End.levelNumber, 1);

    // Cross Stage 2 to Stage 3 (S2-L700 -> S3-L001)
    const nextS2End = getNextLessonId(2, 700);
    assert.equal(nextS2End.id, 'S3-L001');

    // Cross Stage 9 to Stage 10 (S9-L700 -> S10-L001)
    const nextS9End = getNextLessonId(9, 700);
    assert.equal(nextS9End.id, 'S10-L001');

    // Stage 10 Level 700 is final lesson - returns null
    const nextS10End = getNextLessonId(10, 700);
    assert.equal(nextS10End, null, 'S10-L700 is the final capstone');
  });

  it('getPrevLessonId correctly steps backward within stage and across stage boundaries', () => {
    // Within stage
    const prev2 = getPrevLessonId(1, 2);
    assert.equal(prev2.id, 'S1-L001');

    // Across stage boundary: S2-L001 -> S1-L700
    const prevS2Start = getPrevLessonId(2, 1);
    assert.equal(prevS2Start.id, 'S1-L700');
    assert.equal(prevS2Start.stageId, 1);
    assert.equal(prevS2Start.levelNumber, 700);

    // First lesson S1-L001 has no previous
    const prevS1Start = getPrevLessonId(1, 1);
    assert.equal(prevS1Start, null);
  });

  it('getAllUnits returns all 700 units covering 7,000 levels', () => {
    const units = getAllUnits();
    assert.equal(units.length, 700);
    assert.equal(units[0].stageId, 1);
    assert.equal(units[0].startLesson, 1);
    assert.equal(units[0].endLesson, 10);

    assert.equal(units[699].stageId, 10);
    assert.equal(units[699].unitNumber, 70);
    assert.equal(units[699].startLesson, 691);
    assert.equal(units[699].endLesson, 700);
  });
});

describe('Curriculum Educational Quality & Anti-Repetition Auditing', () => {
  it('guarantees zero excessive repeated characters across all 7,000 levels', () => {
    for (let s = 1; s <= 10; s++) {
      STAGE_CURRICULA[s].forEach((l) => {
        const match = l.exerciseText.match(/([a-zA-Z0-9;.,])\1{4,}/);
        assert.equal(match, null, `Stage ${s} Level ${l.levelNumber} contains character spam: "${match?.[0]}"`);
      });
    }
  });

  it('guarantees zero duplicate exercise passages within any stage', () => {
    for (let s = 1; s <= 10; s++) {
      const seen = new Map();
      STAGE_CURRICULA[s].forEach((l) => {
        const norm = l.exerciseText.trim().toLowerCase().replace(/\s+/g, ' ');
        assert.equal(seen.has(norm), false, `Stage ${s} Level ${l.levelNumber} duplicates Level ${seen.get(norm)}`);
        seen.set(norm, l.levelNumber);
      });
    }
  });

  it('verifies all exercise characters map cleanly to supported ANSI keys and fingers', () => {
    for (let s = 1; s <= 10; s++) {
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
    const s1l700 = getLesson(1, 700);
    const s10l1 = getLesson(10, 1);
    const s10l700 = getLesson(10, 700);

    assert.ok(s1l1.targetWpm <= s1l700.targetWpm);
    assert.ok(s1l700.targetWpm <= s10l1.targetWpm);
    assert.ok(s10l1.targetWpm <= s10l700.targetWpm);
    assert.ok(s10l700.targetWpm >= 75);
    assert.ok(s10l700.targetAccuracy >= 95);
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
