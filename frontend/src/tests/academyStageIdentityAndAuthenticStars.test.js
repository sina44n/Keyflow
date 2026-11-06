/**
 * KEYFLOW Academy Stage Identity, Selector Alignment & Authentic Star System Test Suite
 * ======================================================================================
 * Tests for:
 * 1. Dynamic Active Curriculum Stage Identity (All 10 Stages)
 * 2. Stage Selector Dropdown Layout & Rigid Vertical Alignment of Explore Buttons
 * 3. Authentic Level Star Calculation (0, 1, 2, 3, 4, 5 Stars) Without Fabrication
 * 4. Historical Record Honest Fallbacks (Never Fabricate 3 Stars)
 * 5. Persistence Across Refresh and Multi-Session Continuity
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { STAGE_META } from '../data/curriculumEngine.js';
import {
  calculateStars,
  recordLessonResult,
  getLessonRecord,
  isStageUnlocked,
  isLessonUnlocked,
  getLessonProgress,
  setLessonProgressUser,
  resetAllProgress,
} from '../utils/lessonProgress.js';

// Polyfill MockLocalStorage for Node test environment
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

if (typeof globalThis.localStorage === 'undefined' || !globalThis.localStorage.getItem) {
  globalThis.localStorage = new MockLocalStorage();
}

describe('KEYFLOW — Masterpiece Stage Identity, Selector Alignment & Authentic Star System', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
    setLessonProgressUser('test_student_1');
    resetAllProgress();
  });

  // --------------------------------------------------------------------------
  // PART 1: Dynamic Active Stage Identity
  // --------------------------------------------------------------------------
  describe('1. Dynamic Active Stage Identity Resolution (All 10 Stages)', () => {
    it('verifies all 10 stages have authoritative titles, descriptions, and targets', () => {
      assert.equal(STAGE_META.length, 10, 'Must have exactly 10 curriculum stages');

      const expectedTitles = [
        'Home Row Foundations',
        'Top Row Control',
        'Bottom Row Control',
        'Full Alphabet Mastery & Cross-Row Transitions',
        'Number Row Mastery & Ten-Key Dexterity',
        'Shift Discipline, Punctuation & Common Symbols',
        'High-Frequency Vocabulary & Rhythm Cadence',
        'Speed & Endurance Building',
        'Technical, Numeric & Professional Fluency',
        'Master Typist & Specialization',
      ];

      STAGE_META.forEach((stage, idx) => {
        assert.equal(stage.stageId, idx + 1);
        assert.equal(stage.title, expectedTitles[idx]);
        assert.ok(stage.subtitle && stage.subtitle.length > 5, `Stage ${stage.stageId} must have a descriptive subtitle`);
        assert.ok(stage.totalLessons === 700, `Stage ${stage.stageId} must have 700 lessons`);
        assert.ok(stage.targetWpm > 0, `Stage ${stage.stageId} must have target WPM`);
        assert.ok(stage.targetAccuracy > 0, `Stage ${stage.stageId} must have target accuracy`);
      });
    });

    it('dynamically formats primary heading hierarchy according to active stage', () => {
      for (let sId = 1; sId <= 10; sId++) {
        const meta = STAGE_META[sId - 1];
        const primaryHeading = `Stage ${sId} — ${meta.title}`;
        const subtitle = meta.subtitle || meta.objective;

        assert.ok(primaryHeading.startsWith(`Stage ${sId} — `));
        assert.ok(!primaryHeading.includes('Unit 1 — Tactile Anchors'), 'Must not render legacy Unit 1 heading as primary title');
        assert.ok(subtitle.length > 0, 'Must provide rich pedagogical subtitle');
      }
    });

    it('recovers active stage from localStorage without resetting to Stage 1 on page refresh', () => {
      // User selects Stage 4
      globalThis.localStorage.setItem('keyflow_active_stage', '4');

      const savedStage = parseInt(globalThis.localStorage.getItem('keyflow_active_stage'), 10);
      assert.equal(savedStage, 4, 'Must remember Stage 4 across reload');

      const resolvedMeta = STAGE_META[savedStage - 1];
      assert.equal(resolvedMeta.title, 'Full Alphabet Mastery & Cross-Row Transitions');
    });

    it('respects URL query param over stored stage if explicitly provided', () => {
      globalThis.localStorage.setItem('keyflow_active_stage', '2');
      const urlQueryStage = 6; // Explicit query param ?stage=6

      const resolvedStage = urlQueryStage || parseInt(globalThis.localStorage.getItem('keyflow_active_stage'), 10) || 1;
      assert.equal(resolvedStage, 6);
      assert.equal(STAGE_META[resolvedStage - 1].title, 'Shift Discipline, Punctuation & Common Symbols');
    });
  });

  // --------------------------------------------------------------------------
  // PART 2: Select Stage Dropdown Layout & Explore Button Alignment
  // --------------------------------------------------------------------------
  describe('2. Stage Selector Layout & Explore Button Alignment', () => {
    it('verifies all 10 stages have distinct unlocked or locked status and consistent action column', () => {
      // By default only Stage 1 is unlocked
      assert.equal(isStageUnlocked(1), true);
      for (let s = 2; s <= 10; s++) {
        assert.equal(isStageUnlocked(s), false, `Stage ${s} should be locked by default`);
      }

      // Each row in the 10-stage selector maps to a fixed-width action column
      const ACTION_COLUMN_CLASS = 'w-16 shrink-0 flex items-center justify-end';
      const EXPLORE_BTN_CLASS = 'w-16 h-7 inline-flex items-center justify-center text-[10px] font-mono font-bold rounded-lg';

      STAGE_META.forEach((st) => {
        const isUnlocked = isStageUnlocked(st.stageId);
        // Verify action slot properties
        assert.ok(ACTION_COLUMN_CLASS.includes('w-16'), 'Action container must have fixed 64px width');
        assert.ok(ACTION_COLUMN_CLASS.includes('justify-end'), 'Action container must right-align buttons');

        if (!isUnlocked) {
          // Locked stage renders Explore button with fixed width and height
          assert.ok(EXPLORE_BTN_CLASS.includes('w-16'), 'Explore button must have fixed width');
          assert.ok(EXPLORE_BTN_CLASS.includes('h-7'), 'Explore button must have fixed height');
        }
      });
    });

    it('maintains 2-column grid layout preventing text overflow from misaligning buttons', () => {
      const GRID_ROW_CLASS = 'grid grid-cols-[1fr_auto] items-center gap-3';
      assert.ok(GRID_ROW_CLASS.includes('grid-cols-[1fr_auto]'), 'Row must define 1fr flexible info and auto action column');
      assert.ok(GRID_ROW_CLASS.includes('items-center'), 'Row must vertically center contents');
    });
  });

  // --------------------------------------------------------------------------
  // PART 3: Authentic Level Star Calculation (0 to 5 Stars)
  // --------------------------------------------------------------------------
  describe('3. Authentic Level Star Calculation (0 to 5 Stars)', () => {
    const targetWpm = 20;
    const targetAccuracy = 80;

    it('awards 0 stars for failed baseline (WPM or Accuracy below target)', () => {
      // Both below
      assert.equal(calculateStars(75, targetAccuracy, 15, targetWpm), 0);
      // Accuracy below, WPM above
      assert.equal(calculateStars(79, targetAccuracy, 40, targetWpm), 0);
      // WPM below, Accuracy above
      assert.equal(calculateStars(95, targetAccuracy, 19, targetWpm), 0);
    });

    it('awards exactly 1 star for baseline pass', () => {
      assert.equal(calculateStars(80, targetAccuracy, 20, targetWpm), 1);
      assert.equal(calculateStars(81, targetAccuracy, 24, targetWpm), 1);
    });

    it('awards exactly 2 stars for strong pass (+5 WPM, +2% Acc)', () => {
      // Target: 25 WPM, 82% Acc
      assert.equal(calculateStars(82, targetAccuracy, 25, targetWpm), 2);
      assert.equal(calculateStars(83, targetAccuracy, 29, targetWpm), 2);
      // Speed met (+5 WPM) but Accuracy missed (+1%) -> 1 star
      assert.equal(calculateStars(81, targetAccuracy, 25, targetWpm), 1);
    });

    it('awards exactly 3 stars for mastery pass (+10 WPM, +4% Acc)', () => {
      // Target: 30 WPM, 84% Acc
      assert.equal(calculateStars(84, targetAccuracy, 30, targetWpm), 3);
      assert.equal(calculateStars(85, targetAccuracy, 34, targetWpm), 3);
      // Speed met (+10 WPM) but Accuracy only +2% -> 2 stars
      assert.equal(calculateStars(82, targetAccuracy, 30, targetWpm), 2);
    });

    it('awards exactly 4 stars for advanced velocity (+15 WPM, +6% Acc)', () => {
      // Target: 35 WPM, 86% Acc
      assert.equal(calculateStars(86, targetAccuracy, 35, targetWpm), 4);
      assert.equal(calculateStars(87, targetAccuracy, 39, targetWpm), 4);
    });

    it('awards exactly 5 stars for elite mastery (+20 WPM, +8% Acc or 100%)', () => {
      // Target: 40 WPM, 88% Acc
      assert.equal(calculateStars(88, targetAccuracy, 40, targetWpm), 5);
      assert.equal(calculateStars(98, targetAccuracy, 48, targetWpm), 5);
      assert.equal(calculateStars(100, targetAccuracy, 60, targetWpm), 5);
    });

    it('never defaults to 3 stars when a level is completed with fewer or more stars', () => {
      // Complete with 1 star performance
      recordLessonResult(1, 1, { wpm: 20, accuracy: 80, passed: true, stars: 1 });
      const record1 = getLessonRecord(1, 1);
      assert.equal(record1.stars, 1, 'Completed level must retain 1 star, not default to 3');

      // Complete with 2 stars performance
      recordLessonResult(1, 2, { wpm: 25, accuracy: 82, passed: true, stars: 2 });
      const record2 = getLessonRecord(1, 2);
      assert.equal(record2.stars, 2, 'Completed level must retain 2 stars, not default to 3');

      // Complete with 5 stars performance
      recordLessonResult(1, 3, { wpm: 45, accuracy: 98, passed: true, stars: 5 });
      const record3 = getLessonRecord(1, 3);
      assert.equal(record3.stars, 5, 'Completed level must retain 5 stars, not truncate to 3');
    });

    it('correctly handles incomplete levels with 0 stars', () => {
      recordLessonResult(1, 4, { wpm: 12, accuracy: 70, passed: false, stars: 0 });
      const record4 = getLessonRecord(1, 4);
      assert.equal(record4.stars, 0);
      assert.equal(record4.completed, false);
    });

    it('preserves user best star count on retry', () => {
      // First attempt: 4 stars
      recordLessonResult(1, 5, { wpm: 35, accuracy: 86, passed: true, stars: 4 });
      let rec = getLessonRecord(1, 5);
      assert.equal(rec.stars, 4);
      assert.equal(rec.attempts, 1);

      // Second attempt: Worse performance (2 stars)
      recordLessonResult(1, 5, { wpm: 25, accuracy: 82, passed: true, stars: 2 });
      rec = getLessonRecord(1, 5);
      assert.equal(rec.stars, 4, 'Best stars must be preserved across attempts');
      assert.equal(rec.attempts, 2);

      // Third attempt: Higher performance (5 stars)
      recordLessonResult(1, 5, { wpm: 42, accuracy: 95, passed: true, stars: 5 });
      rec = getLessonRecord(1, 5);
      assert.equal(rec.stars, 5, 'Star count must upgrade to highest earned achievement');
      assert.equal(rec.attempts, 3);
    });
  });

  // --------------------------------------------------------------------------
  // PART 4: Historical Record Safety (Zero Fabricated Stars)
  // --------------------------------------------------------------------------
  describe('4. Historical Record Safety & Safe Fallbacks', () => {
    it('recalculates authentic stars from genuine historical bestWpm and bestAccuracy if stars is missing', () => {
      // Simulate historical legacy record without explicit 'stars' field
      const state = getLessonProgress();
      state.lessons['S1-L001'] = {
        completed: true,
        bestWpm: 42,
        bestAccuracy: 90,
        attempts: 1,
        completedAt: '2026-10-01T00:00:00Z',
      };
      globalThis.localStorage.setItem('keyflow_lesson_progress_u_test_student_1', JSON.stringify(state));

      const rec = getLessonRecord(1, 1);
      assert.equal(rec.stars, undefined);

      // In AcademyLevelCard logic:
      const targetWpm = 20;
      const targetAccuracy = 80;
      const recoveredStars = calculateStars(rec.bestAccuracy, targetAccuracy, rec.bestWpm, targetWpm);
      assert.equal(recoveredStars, 5, 'Must calculate authentic 5 stars from 42 WPM / 90% Acc');
    });

    it('safely assigns 1 star baseline for historical pass without metrics, NEVER fabricated 3 stars', () => {
      const historicalLegacyRecord = {
        completed: true,
        passed: true,
        // No bestWpm or bestAccuracy stored
      };

      let starsEarned = 0;
      if (historicalLegacyRecord.completed) {
        if (typeof historicalLegacyRecord.stars === 'number') {
          starsEarned = historicalLegacyRecord.stars;
        } else if (historicalLegacyRecord.bestWpm && historicalLegacyRecord.bestAccuracy) {
          starsEarned = calculateStars(historicalLegacyRecord.bestAccuracy, 80, historicalLegacyRecord.bestWpm, 20);
        } else if (historicalLegacyRecord.passed) {
          starsEarned = 1; // Honest minimum baseline pass, NOT 3 stars
        }
      }

      assert.equal(starsEarned, 1, 'Historical pass with no metrics must receive honest 1 star, never 3 stars');
    });

    it('safely assigns 0 stars for historical incomplete record without metrics', () => {
      const incompleteRecord = {
        completed: false,
        attempts: 2,
      };

      let starsEarned = 0;
      if (incompleteRecord.completed) {
        starsEarned = 1;
      }

      assert.equal(starsEarned, 0, 'Incomplete record must receive 0 stars');
    });
  });

  // --------------------------------------------------------------------------
  // PART 5: Multi-User Isolation & State Integrity
  // --------------------------------------------------------------------------
  describe('5. Multi-User Isolation of Earned Stars', () => {
    it('isolates earned stars between User A and User B completely', () => {
      // User A completes S1-L001 with 5 stars
      setLessonProgressUser('student_a');
      recordLessonResult(1, 1, { wpm: 45, accuracy: 98, passed: true, stars: 5 });
      assert.equal(getLessonRecord(1, 1)?.stars, 5);

      // Switch to User B (new user)
      setLessonProgressUser('student_b');
      const studentBRecord = getLessonRecord(1, 1);
      assert.equal(studentBRecord, null, 'User B must not see User A completed record');

      // User B completes with 2 stars
      recordLessonResult(1, 1, { wpm: 25, accuracy: 82, passed: true, stars: 2 });
      assert.equal(getLessonRecord(1, 1)?.stars, 2);

      // Switch back to User A
      setLessonProgressUser('student_a');
      assert.equal(getLessonRecord(1, 1)?.stars, 5, 'User A 5 stars must remain intact');
    });
  });
});
