/**
 * KEYFLOW Academy Content Cleanup & Authentic Curriculum Verification Test Suite
 * ==============================================================================
 * Phase 5 Minimum Regression Gates:
 * 1. Displayed stage count matches authoritative STAGE_META source.
 * 2. Displayed lesson and level counts match actual registered content.
 * 3. Missing curriculum metadata evaluates honestly (zero) without fabricated defaults (no || 10).
 * 4. Obsolete claims (e.g. 4,200) are completely absent from Academy UI & translations.
 * 5. All 10 stages remain available and defined.
 * 6. All registered lessons remain available (700 lessons per stage = 7,000 total).
 * 7. Authentic progress, star calculation, and streak metrics remain accurate.
 * 8. Real four-line viewport scrolling and typing validation contracts remain intact.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

import {
  STAGE_META,
  STAGE_CURRICULA,
  getStageUnits,
  getLessonMeta,
  getLesson,
  getNextLessonId,
} from '../data/curriculumEngine.js';

import {
  calculateStars,
  recordLessonResult,
  getLessonRecord,
  isStageUnlocked,
  isLessonUnlocked,
  getAcademyDashboardStats,
  resetAllProgress,
  setLessonProgressUser,
} from '../utils/lessonProgress.js';

import { getCharacterFeedback } from '../utils/typingFeedback.js';
import { calculateViewportScroll } from '../utils/fourLineScroll.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read source files directly to verify structural integrity and absence of obsolete strings
const academyPageSrc = fs.readFileSync(path.resolve(__dirname, '../pages/AcademyPage.jsx'), 'utf8');
const heroSrc = fs.readFileSync(path.resolve(__dirname, '../components/landing/HeroSection.jsx'), 'utf8');
const ctaSrc = fs.readFileSync(path.resolve(__dirname, '../components/landing/CTASection.jsx'), 'utf8');
const featuresSrc = fs.readFileSync(path.resolve(__dirname, '../components/landing/FeaturesSection.jsx'), 'utf8');
const stageLessonMapSrc = fs.readFileSync(path.resolve(__dirname, '../components/academy/StageLessonMap.jsx'), 'utf8');
const exploreModalSrc = fs.readFileSync(path.resolve(__dirname, '../components/academy/ExploreStageModal.jsx'), 'utf8');
const progressStatsSrc = fs.readFileSync(path.resolve(__dirname, '../components/academy/ProgressStats.jsx'), 'utf8');
const enLocaleSrc = fs.readFileSync(path.resolve(__dirname, '../i18n/locales/en.js'), 'utf8');

describe('KEYFLOW — Phase 5: Academy Content Cleanup & Authentic Curriculum Verification', () => {

  // --------------------------------------------------------------------------
  // Gate 1 & 2: Authoritative Dynamic Curriculum Data
  // --------------------------------------------------------------------------
  describe('1. Authoritative Dynamic Curriculum Data Contract', () => {
    it('guarantees STAGE_META defines exactly 10 authoritative stages', () => {
      assert.ok(Array.isArray(STAGE_META), 'STAGE_META must be an array');
      assert.strictEqual(STAGE_META.length, 10, 'STAGE_META must define exactly 10 stages');
    });

    it('guarantees each stage has 700 registered educational lessons', () => {
      for (let s = 1; s <= 10; s++) {
        const stageLessons = STAGE_CURRICULA[s];
        assert.ok(Array.isArray(stageLessons), `Stage ${s} curriculum must be an array`);
        assert.strictEqual(stageLessons.length, 700, `Stage ${s} must have exactly 700 lessons`);
        const meta = STAGE_META[s - 1];
        assert.strictEqual(meta.totalLessons, 700, `Stage ${s} metadata totalLessons must equal 700`);
      }
    });

    it('guarantees total registered curriculum lessons sum to 7,000 without fabrication', () => {
      const totalLessons = STAGE_META.reduce((acc, s) => acc + (s.totalLessons || 0), 0);
      assert.strictEqual(totalLessons, 7000, 'Total curriculum lessons must equal 7,000');
    });

    it('guarantees getStageUnits produces exactly 70 units per stage', () => {
      for (let s = 1; s <= 10; s++) {
        const units = getStageUnits(s);
        assert.strictEqual(units.length, 70, `Stage ${s} must have exactly 70 units`);
        assert.strictEqual(units[0].startLesson, 1);
        assert.strictEqual(units[0].endLesson, 10);
        assert.strictEqual(units[69].startLesson, 691);
        assert.strictEqual(units[69].endLesson, 700);
      }
    });
  });

  // --------------------------------------------------------------------------
  // Gate 3: Elimination of || 10 Fabricated Fallbacks
  // --------------------------------------------------------------------------
  describe('2. Elimination of Fabricated Fallbacks (No || 10)', () => {
    it('guarantees HeroSection derives totalStages with nullish coalescing (no || 10 fallback)', () => {
      assert.ok(!heroSrc.includes('STAGE_META?.length || 10'), 'HeroSection must not contain STAGE_META?.length || 10');
      assert.ok(heroSrc.includes('STAGE_META?.length ?? 0'), 'HeroSection must use STAGE_META?.length ?? 0');
    });

    it('guarantees CTASection derives totalStages with nullish coalescing (no || 10 fallback)', () => {
      assert.ok(!ctaSrc.includes('STAGE_META?.length || 10'), 'CTASection must not contain STAGE_META?.length || 10');
      assert.ok(ctaSrc.includes('STAGE_META?.length ?? 0'), 'CTASection must use STAGE_META?.length ?? 0');
    });

    it('guarantees FeaturesSection derives totalStages with nullish coalescing (no || 10 fallback)', () => {
      assert.ok(!featuresSrc.includes('STAGE_META?.length || 10'), 'FeaturesSection must not contain STAGE_META?.length || 10');
      assert.ok(featuresSrc.includes('STAGE_META?.length ?? 0'), 'FeaturesSection must use STAGE_META?.length ?? 0');
    });

    it('guarantees StageLessonMap does not use totalLessons || 10 fallback', () => {
      assert.ok(!stageLessonMapSrc.includes('stageMeta.totalLessons || 10'), 'StageLessonMap must not use || 10 fallback');
      assert.ok(stageLessonMapSrc.includes('STAGE_META.length'), 'StageLessonMap must dynamically reference STAGE_META.length');
    });

    it('guarantees ProgressStats does not default to fabricated fake stats (e.g. 38% or 7 units)', () => {
      assert.ok(!progressStatsSrc.includes('overallProgress = 38'), 'ProgressStats must not default to 38%');
      assert.ok(!progressStatsSrc.includes('completedUnits = 7'), 'ProgressStats must not default to 7 units');
      assert.ok(progressStatsSrc.includes('overallProgress = 0'), 'ProgressStats must default to honest 0%');
    });
  });

  // --------------------------------------------------------------------------
  // Gate 4: Absence of Obsolete Claims
  // --------------------------------------------------------------------------
  describe('3. Absence of Obsolete & Inaccurate Claims', () => {
    it('strictly guarantees "4,200" is completely absent from en.js locale', () => {
      assert.ok(!enLocaleSrc.includes('4,200'), 'en.js must not contain obsolete "4,200"');
    });

    it('strictly guarantees all 17 locale files are free of obsolete 4,200 claims', () => {
      const localesDir = path.resolve(__dirname, '../i18n/locales');
      const files = fs.readdirSync(localesDir).filter((f) => f.endsWith('.js'));
      for (const file of files) {
        const content = fs.readFileSync(path.join(localesDir, file), 'utf8');
        assert.ok(!content.includes('4,200'), `${file} must not contain "4,200"`);
        assert.ok(!content.includes('4.200'), `${file} must not contain "4.200"`);
        assert.ok(!content.includes('4 200'), `${file} must not contain "4 200"`);
        assert.ok(!content.includes('४,২০০'), `${file} must not contain "४,২০০"`);
      }
    });

    it('guarantees AcademyPage flyout header dynamically derives counts', () => {
      assert.ok(academyPageSrc.includes('STAGE_META.length'), 'AcademyPage must use STAGE_META.length in flyout header');
      assert.ok(academyPageSrc.includes('STAGE_META.reduce'), 'AcademyPage must use STAGE_META.reduce in flyout header');
      assert.ok(!academyPageSrc.includes('Curriculum Stages (10)'), 'Hardcoded "Curriculum Stages (10)" must be removed');
      assert.ok(!academyPageSrc.includes('7,000 Levels Total'), 'Hardcoded static "7,000 Levels Total" must be dynamic');
    });
  });

  // --------------------------------------------------------------------------
  // Gate 5, 6, 7 & 8: Curriculum Navigation & Integrity
  // --------------------------------------------------------------------------
  describe('4. Curriculum Progression & Navigation Integrity', () => {
    it('resolves valid lessons for start, middle, and end of stages', () => {
      const s1l1 = getLesson(1, 1);
      assert.ok(s1l1, 'Stage 1 Lesson 1 must exist');
      assert.strictEqual(s1l1.stageId, 1);
      assert.strictEqual(s1l1.levelNumber, 1);

      const s5l350 = getLesson(5, 350);
      assert.ok(s5l350, 'Stage 5 Lesson 350 must exist');
      assert.strictEqual(s5l350.stageId, 5);
      assert.strictEqual(s5l350.levelNumber, 350);

      const s10l700 = getLesson(10, 700);
      assert.ok(s10l700, 'Stage 10 Lesson 700 must exist');
      assert.strictEqual(s10l700.stageId, 10);
      assert.strictEqual(s10l700.levelNumber, 700);
    });

    it('correctly transitions from lesson N to N+1 within a stage', () => {
      const next = getNextLessonId(1, 1);
      assert.ok(next);
      assert.strictEqual(next.stageId, 1);
      assert.strictEqual(next.lessonNum, 2);
    });

    it('correctly transitions across stage boundaries (S1-L700 -> S2-L001)', () => {
      const nextStage = getNextLessonId(1, 700);
      assert.ok(nextStage);
      assert.strictEqual(nextStage.stageId, 2);
      assert.strictEqual(nextStage.lessonNum, 1);
    });

    it('returns null when completing the final capstone (S10-L700)', () => {
      const terminal = getNextLessonId(10, 700);
      assert.strictEqual(terminal, null);
    });
  });

  // --------------------------------------------------------------------------
  // Gate 9, 10, 11 & 12: Progress, Stars & Streak Precision
  // --------------------------------------------------------------------------
  describe('5. Authentic Star & Streak Contract', () => {
    beforeEach(() => {
      setLessonProgressUser('phase5_test_user');
      resetAllProgress();
    });

    it('calculates stars authentically without fabrication (0 to 5 stars)', () => {
      // 5 Stars: Target WPM + 20 and Target Accuracy + 8% (or 100%)
      assert.strictEqual(calculateStars(100, 85, 45, 20), 5);
      // 3 Stars: Target WPM + 10 and Target Accuracy + 4%
      assert.strictEqual(calculateStars(90, 85, 31, 20), 3);
      // 1 Star: Meets baseline target WPM and target Accuracy
      assert.strictEqual(calculateStars(85, 85, 20, 20), 1);
      // 0 Stars: Below target accuracy
      assert.strictEqual(calculateStars(75, 85, 30, 20), 0);
    });

    it('starts a new user with 0 completed lessons, 0 stars, and 0 streak honestly', () => {
      const stats = getAcademyDashboardStats(1);
      assert.strictEqual(stats.completedLessons, 0, 'New user completed lessons must be 0');
      assert.strictEqual(stats.completedUnits, 0, 'New user completed units must be 0');
      assert.strictEqual(stats.overallProgress, 0, 'New user overall progress must be 0');
      assert.strictEqual(stats.streak, 0, 'New user streak must be 0');
    });

    it('records progress genuinely and updates dashboard metrics', () => {
      recordLessonResult(1, 1, {
        wpm: 25,
        accuracy: 95,
        passed: true,
        stars: 3,
      });

      const record = getLessonRecord(1, 1);
      assert.ok(record?.completed, 'Lesson 1 must be marked completed');
      assert.strictEqual(record.stars, 3, 'Lesson 1 must record 3 stars');

      const stats = getAcademyDashboardStats(1);
      assert.strictEqual(stats.completedLessons, 1, 'Completed lessons must increment to 1');
    });
  });

  // --------------------------------------------------------------------------
  // Gate 13, 14, 15, 16: Typing Validation & Four-Line Scroll
  // --------------------------------------------------------------------------
  describe('6. Typing Engine & Four-Line Viewport Scroll Contract', () => {
    it('validates typing feedback accurately for correct, incorrect and current characters', () => {
      const target = 'hello';
      const typed = 'hel';
      // Index 0: 'h' matched -> 'char-correct'
      assert.strictEqual(getCharacterFeedback(0, typed, target).className, 'char-correct');
      // Index 1: 'e' matched -> 'char-correct'
      assert.strictEqual(getCharacterFeedback(1, typed, target).className, 'char-correct');
      // Index 2: 'l' matched -> 'char-correct'
      assert.strictEqual(getCharacterFeedback(2, typed, target).className, 'char-correct');
      // Index 3: cursor position -> 'char-current'
      assert.strictEqual(getCharacterFeedback(3, typed, target).className, 'char-current');
      // Index 4: not yet typed -> 'char-untyped'
      assert.strictEqual(getCharacterFeedback(4, typed, target).className, 'char-untyped');

      // Test incorrect character:
      const wrongTyped = 'hex';
      assert.strictEqual(getCharacterFeedback(2, wrongTyped, target).className, 'char-incorrect');
    });

    it('guarantees four-line viewport scroll calculates correct offsets', () => {
      // Row 0 (line 1): stays at top (0px)
      const scroll0 = calculateViewportScroll(0, 44);
      assert.strictEqual(scroll0.targetScrollTop, 0);

      // Row 1 (line 2): stays at top (0px)
      const scroll1 = calculateViewportScroll(1, 44);
      assert.strictEqual(scroll1.targetScrollTop, 0);

      // Row 2 (line 3): enters scroll slot, shifts 1 * lineHeight (44px)
      const scroll2 = calculateViewportScroll(2, 44);
      assert.strictEqual(scroll2.targetScrollTop, 44);
      assert.strictEqual(scroll2.scrollLine, 1);
      assert.deepStrictEqual(scroll2.visibleLines, [1, 2, 3, 4]);
    });
  });
});
