import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  isLessonUnlocked,
  isStageUnlocked,
  recordLessonResult,
  calculateStars,
  getAcademyDashboardStats,
  getNextRecommendedLesson,
  resetAllProgress,
  setLessonProgressUser,
  syncLessonProgressFromBackend,
  resetGuestProgress,
  getLessonRecord,
  getLessonProgress,
} from './lessonProgress.js';

// Minimal localStorage mock for Node test environment
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
if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}
if (typeof globalThis.CustomEvent === 'undefined') {
  globalThis.CustomEvent = class CustomEvent {
    constructor(type, eventInitDict) {
      this.type = type;
      this.detail = eventInitDict?.detail;
    }
  };
}

describe('KEYFLOW Lesson Progress & Progression System (4,200 Levels)', () => {
  beforeEach(() => {
    resetAllProgress();
  });

  it('unlocks Stage 1 Level 1 by default for new learners', () => {
    assert.equal(isLessonUnlocked(1, 1), true);
  });

  it('keeps Stage 1 Level 2 locked until Level 1 is passed', () => {
    assert.equal(isLessonUnlocked(1, 2), false);

    // Fail Level 1
    recordLessonResult(1, 1, {
      wpm: 12,
      accuracy: 80,
      passed: false,
      stars: 0,
    });
    assert.equal(isLessonUnlocked(1, 2), false, 'Failed attempt must not unlock Level 2');

    // Pass Level 1
    recordLessonResult(1, 1, {
      wpm: 25,
      accuracy: 95,
      passed: true,
      stars: 3,
    });

    // Level 2 must now be unlocked!
    assert.equal(isLessonUnlocked(1, 2), true);
  });

  it('REGRESSION CHECK: unlocks Level 21 when Level 20 is passed', () => {
    assert.equal(isLessonUnlocked(1, 21), false);

    recordLessonResult(1, 20, {
      wpm: 24,
      accuracy: 94,
      passed: true,
      stars: 3,
    });

    assert.equal(isLessonUnlocked(1, 21), true);
  });

  it('REGRESSION CHECK: unlocks Level 51 when Level 50 is passed', () => {
    assert.equal(isLessonUnlocked(1, 51), false);

    recordLessonResult(1, 50, {
      wpm: 26,
      accuracy: 95,
      passed: true,
      stars: 3,
    });

    assert.equal(isLessonUnlocked(1, 51), true);
  });

  it('progresses smoothly across Stage 1 Level 599 -> Level 600', () => {
    assert.equal(isLessonUnlocked(1, 600), false);

    recordLessonResult(1, 599, {
      wpm: 28,
      accuracy: 95,
      passed: true,
      stars: 3,
    });

    assert.equal(isLessonUnlocked(1, 600), true);
  });

  it('progresses smoothly across Stage 1 to Stage 2 boundary (S1-L600 -> S2-L001)', () => {
    assert.equal(isStageUnlocked(2), false);
    assert.equal(isLessonUnlocked(2, 1), false);

    // Complete Stage 1 Level 600 (Stage 1 Capstone)
    recordLessonResult(1, 600, {
      wpm: 30,
      accuracy: 95,
      passed: true,
      stars: 4,
    });

    // Stage 2 and Stage 2 Level 1 must now be unlocked!
    assert.equal(isStageUnlocked(2), true);
    assert.equal(isLessonUnlocked(2, 1), true);
    assert.equal(isLessonUnlocked(2, 2), false);
  });

  it('progresses smoothly across Stage 2 to Stage 3 boundary (S2-L600 -> S3-L001)', () => {
    assert.equal(isStageUnlocked(3), false);
    assert.equal(isLessonUnlocked(3, 1), false);

    recordLessonResult(2, 600, {
      wpm: 38,
      accuracy: 95,
      passed: true,
      stars: 3,
    });

    assert.equal(isStageUnlocked(3), true);
    assert.equal(isLessonUnlocked(3, 1), true);
  });

  it('progresses smoothly across Stage 3 to Stage 4 boundary (S3-L600 -> S4-L001)', () => {
    assert.equal(isStageUnlocked(4), false);
    assert.equal(isLessonUnlocked(4, 1), false);

    recordLessonResult(3, 600, {
      wpm: 44,
      accuracy: 95,
      passed: true,
      stars: 3,
    });

    assert.equal(isStageUnlocked(4), true);
    assert.equal(isLessonUnlocked(4, 1), true);
  });

  it('progresses smoothly across Stage 4 to Stage 5 boundary (S4-L600 -> S5-L001)', () => {
    assert.equal(isStageUnlocked(5), false);
    assert.equal(isLessonUnlocked(5, 1), false);

    recordLessonResult(4, 600, {
      wpm: 52,
      accuracy: 95,
      passed: true,
      stars: 3,
    });

    assert.equal(isStageUnlocked(5), true);
    assert.equal(isLessonUnlocked(5, 1), true);
  });

  it('progresses smoothly across Stage 5 to Stage 6 boundary (S5-L600 -> S6-L001)', () => {
    assert.equal(isStageUnlocked(6), false);
    assert.equal(isLessonUnlocked(6, 1), false);

    recordLessonResult(5, 600, {
      wpm: 60,
      accuracy: 96,
      passed: true,
      stars: 4,
    });

    assert.equal(isStageUnlocked(6), true);
    assert.equal(isLessonUnlocked(6, 1), true);
  });

  it('progresses smoothly across Stage 6 to Stage 7 boundary (S6-L600 -> S7-L001)', () => {
    assert.equal(isStageUnlocked(7), false);
    assert.equal(isLessonUnlocked(7, 1), false);

    recordLessonResult(6, 600, {
      wpm: 65,
      accuracy: 96,
      passed: true,
      stars: 4,
    });

    assert.equal(isStageUnlocked(7), true);
    assert.equal(isLessonUnlocked(7, 1), true);
  });

  it('completes Stage 7 Level 600 and marks Academy Completed', () => {
    // Unlock Stage 7
    recordLessonResult(6, 600, { wpm: 65, accuracy: 96, passed: true, stars: 4 });
    assert.equal(isStageUnlocked(7), true);

    // Complete S7-L599
    recordLessonResult(7, 599, { wpm: 70, accuracy: 97, passed: true, stars: 4 });
    assert.equal(isLessonUnlocked(7, 600), true);

    // Complete S7-L600 Grandmaster Capstone
    const finalState = recordLessonResult(7, 600, {
      wpm: 74,
      accuracy: 98,
      passed: true,
      stars: 5,
    });

    assert.equal(finalState.academyCompleted, true);
  });

  it('strictly isolates Stage 2 Level 1 from Stage 1 Level 1 (zero collision)', () => {
    recordLessonResult(1, 1, {
      wpm: 25,
      accuracy: 95,
      passed: true,
      stars: 3,
    });

    recordLessonResult(2, 1, {
      wpm: 35,
      accuracy: 98,
      passed: true,
      stars: 5,
    });

    const state = recordLessonResult(1, 1, { wpm: 25, accuracy: 95, passed: true, stars: 3 });
    assert.equal(state.lessons['S1-L001'].bestWpm, 25);
    assert.equal(state.lessons['S2-L001'].bestWpm, 35);
    assert.notEqual(state.lessons['S1-L001'].bestWpm, state.lessons['S2-L001'].bestWpm);
  });

  it('correctly calculates star ratings (0 to 5 stars)', () => {
    // Failing: 0 stars
    assert.equal(calculateStars(80, 90, 15, 20), 0);
    // Bare pass: 1 star
    assert.equal(calculateStars(90, 90, 20, 20), 1);
    // Good pass: 2 stars
    assert.equal(calculateStars(93, 90, 20, 20), 2);
    // Solid pass: 3 stars
    assert.equal(calculateStars(95, 90, 23, 20), 3);
    // High mastery: 4 stars
    assert.equal(calculateStars(97, 90, 24, 20), 4);
    // Elite mastery: 5 stars
    assert.equal(calculateStars(99, 90, 26, 20), 5);
  });

  it('retains best WPM, accuracy, and stars across repeated attempts', () => {
    recordLessonResult(1, 1, { wpm: 30, accuracy: 94, passed: true, stars: 2 });
    recordLessonResult(1, 1, { wpm: 45, accuracy: 98, passed: true, stars: 4 });
    const retained = recordLessonResult(1, 1, { wpm: 20, accuracy: 90, passed: true, stars: 1 });

    assert.equal(retained.lessons['S1-L001'].bestWpm, 45);
    assert.equal(retained.lessons['S1-L001'].bestAccuracy, 98);
    assert.equal(retained.lessons['S1-L001'].stars, 4);
    assert.equal(retained.lessons['S1-L001'].attempts, 3);
  });

  it('calculates genuine dashboard stats across 4,200 levels without fabricated values', () => {
    recordLessonResult(1, 1, { wpm: 25, accuracy: 95, passed: true, stars: 3 });
    recordLessonResult(1, 2, { wpm: 26, accuracy: 96, passed: true, stars: 3 });

    const stats = getAcademyDashboardStats(1);
    assert.equal(stats.completedLessons, 2);
    assert.equal(stats.totalStageLessons, 600);
    assert.equal(stats.totalAcademyLessons, 4200);
    assert.equal(stats.totalAcademyCompleted, 2);
  });

  it('getNextRecommendedLesson dynamically points to first uncompleted lesson across 4,200 levels', () => {
    assert.deepEqual(getNextRecommendedLesson(1), { stageId: 1, lessonNum: 1, id: 'S1-L001' });

    recordLessonResult(1, 1, { wpm: 25, accuracy: 95, passed: true, stars: 3 });
    assert.deepEqual(getNextRecommendedLesson(1), { stageId: 1, lessonNum: 2, id: 'S1-L002' });
  });

  describe('Multi-User Account Switching & Strict Isolation (Frontend)', () => {
    it('isolates User A and User B progress completely across login, play, and account switching', () => {
      // 1. User A logs in
      setLessonProgressUser('user_A_id_101');
      assert.equal(globalThis.localStorage.getItem('keyflow_current_user_id'), 'user_A_id_101');

      // User A completes Level 1 and Level 2
      recordLessonResult(1, 1, { wpm: 35, accuracy: 97, passed: true, stars: 3 });
      recordLessonResult(1, 2, { wpm: 38, accuracy: 98, passed: true, stars: 4 });

      assert.equal(isLessonUnlocked(1, 1), true);
      assert.equal(isLessonUnlocked(1, 2), true);
      assert.equal(isLessonUnlocked(1, 3), true);
      assert.equal(getLessonRecord(1, 1)?.completed, true);
      assert.equal(getLessonRecord(1, 2)?.completed, true);
      assert.equal(getLessonRecord(1, 3)?.completed || false, false);

      // 2. User A logs out
      setLessonProgressUser(null);
      resetGuestProgress();
      assert.equal(globalThis.localStorage.getItem('keyflow_current_user_id'), null);
      assert.equal(globalThis.localStorage.getItem('keyflow_lesson_progress_guest'), null);

      // 3. User B signs in
      setLessonProgressUser('user_B_id_202');
      assert.equal(globalThis.localStorage.getItem('keyflow_current_user_id'), 'user_B_id_202');

      // User B MUST have zero completed levels and start at Level 1
      const progressB = getLessonProgress();
      assert.deepEqual(progressB.lessons, {});
      assert.equal(isLessonUnlocked(1, 1), true, 'Level 1 must be unlocked by default');
      assert.equal(isLessonUnlocked(1, 2), false, 'Level 2 must be locked for User B');
      assert.equal(getLessonRecord(1, 1)?.completed || false, false);
      assert.equal(getLessonRecord(1, 2)?.completed || false, false);

      // 4. Backend synchronization with empty backend data keeps User B clean
      syncLessonProgressFromBackend({
        lessons: {},
        stageProgress: { 1: 1, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 },
        unlockedStages: [1],
      });
      assert.equal(isLessonUnlocked(1, 2), false);
      assert.equal(getLessonRecord(1, 1)?.completed || false, false);

      // 5. User B completes Level 1
      recordLessonResult(1, 1, { wpm: 22, accuracy: 92, passed: true, stars: 1 });
      assert.equal(isLessonUnlocked(1, 2), true);
      assert.equal(isLessonUnlocked(1, 3), false);

      // 6. User A logs back in
      setLessonProgressUser('user_A_id_101');
      assert.equal(isLessonUnlocked(1, 1), true);
      assert.equal(isLessonUnlocked(1, 2), true);
      assert.equal(isLessonUnlocked(1, 3), true);
      assert.equal(getLessonRecord(1, 1)?.bestWpm, 35);
      assert.equal(getLessonRecord(1, 2)?.bestWpm, 38);

      // Clean up
      setLessonProgressUser(null);
      resetGuestProgress();
    });

    it('ensures syncLessonProgressFromBackend is authoritative and eliminates any stale local flags', () => {
      setLessonProgressUser('user_clean_999');
      // Simulate backend returning specific verified lessons
      syncLessonProgressFromBackend({
        lessons: {
          'S1-L001': { completed: true, bestWpm: 40, bestAccuracy: 95, attempts: 1 },
        },
        stageProgress: { 1: 2 },
        unlockedStages: [1],
      });

      assert.equal(isLessonUnlocked(1, 1), true);
      assert.equal(isLessonUnlocked(1, 2), true);
      assert.equal(isLessonUnlocked(1, 3), false);

      setLessonProgressUser(null);
      resetGuestProgress();
    });
  });
});
