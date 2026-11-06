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
  getStageCompletedCount,
  unlockStageManual,
  applyPlacementAccess,
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

describe('KEYFLOW Lesson Progress & Progression System (7,000 Levels)', () => {
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

  it('REGRESSION CHECK: unlocks Level 11 when Level 10 is passed', () => {
    assert.equal(isLessonUnlocked(1, 11), false);

    recordLessonResult(1, 10, {
      wpm: 24,
      accuracy: 94,
      passed: true,
      stars: 3,
    });

    assert.equal(isLessonUnlocked(1, 11), true);
  });

  it('progresses smoothly across Stage 1 Level 699 -> Level 700', () => {
    assert.equal(isLessonUnlocked(1, 700), false);

    recordLessonResult(1, 699, {
      wpm: 28,
      accuracy: 95,
      passed: true,
      stars: 3,
    });

    assert.equal(isLessonUnlocked(1, 700), true);
  });

  it('progresses smoothly across Stage 1 to Stage 2 boundary (S1-L700 -> S2-L001)', () => {
    assert.equal(isStageUnlocked(2), false);
    assert.equal(isLessonUnlocked(2, 1), false);

    // Complete Stage 1 Level 700 (Stage 1 Capstone)
    recordLessonResult(1, 700, {
      wpm: 30,
      accuracy: 95,
      passed: true,
      stars: 3,
    });

    // Stage 2 and Stage 2 Level 1 must now be unlocked!
    assert.equal(isStageUnlocked(2), true);
    assert.equal(isLessonUnlocked(2, 1), true);
    assert.equal(isLessonUnlocked(2, 2), false);
  });

  it('progresses smoothly across Stage 9 to Stage 10 boundary (S9-L700 -> S10-L001)', () => {
    assert.equal(isStageUnlocked(10), false);
    assert.equal(isLessonUnlocked(10, 1), false);

    recordLessonResult(9, 700, {
      wpm: 80,
      accuracy: 96,
      passed: true,
      stars: 3,
    });

    assert.equal(isStageUnlocked(10), true);
    assert.equal(isLessonUnlocked(10, 1), true);
  });

  it('completes Stage 10 Level 700 and marks Academy Completed', () => {
    // Unlock Stage 10
    recordLessonResult(9, 700, { wpm: 80, accuracy: 96, passed: true, stars: 3 });
    assert.equal(isStageUnlocked(10), true);

    // Complete S10-L699
    recordLessonResult(10, 699, { wpm: 85, accuracy: 96, passed: true, stars: 3 });
    assert.equal(isLessonUnlocked(10, 700), true);

    // Complete S10-L700 Grandmaster Capstone
    const finalState = recordLessonResult(10, 700, {
      wpm: 95,
      accuracy: 98,
      passed: true,
      stars: 3,
    });

    assert.equal(finalState.academyCompleted, true);
  });

  it('Path 03 (Manual Self-Paced Unlock): unlocks all 700 levels of stage without fabricating completions', () => {
    assert.equal(isStageUnlocked(5), false);
    assert.equal(isLessonUnlocked(5, 1), false);
    assert.equal(isLessonUnlocked(5, 350), false);

    // Manually unlock Stage 5
    const state = unlockStageManual(5);
    assert.equal(isStageUnlocked(5), true);
    assert.equal(state.stageAccessTypes[5], 'self_paced');

    // All levels in Stage 5 are now unlocked for exploratory practice
    assert.equal(isLessonUnlocked(5, 1), true);
    assert.equal(isLessonUnlocked(5, 100), true);
    assert.equal(isLessonUnlocked(5, 700), true);

    // ZERO fake completions or stars
    assert.equal(getLessonRecord(5, 1), null);
    assert.equal(getLessonRecord(5, 100), null);
    assert.equal(getLessonRecord(5, 700), null);
    assert.equal(getStageCompletedCount(5), 0);
  });

  it('Path 02 (Placement Access): unlocks stages 1 to recommended without fabricating completions', () => {
    assert.equal(isStageUnlocked(4), false);
    assert.equal(isStageUnlocked(5), false);

    // Apply placement for Stage 4
    const state = applyPlacementAccess(4);
    assert.equal(isStageUnlocked(1), true);
    assert.equal(isStageUnlocked(2), true);
    assert.equal(isStageUnlocked(3), true);
    assert.equal(isStageUnlocked(4), true);
    assert.equal(isStageUnlocked(5), false);

    // Stage 4 Level 1 is accessible
    assert.equal(isLessonUnlocked(4, 1), true);

    // ZERO fake completions or stars
    assert.equal(getLessonRecord(4, 1), null);
    assert.equal(getStageCompletedCount(4), 0);
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
      stars: 3,
    });

    const state = recordLessonResult(1, 1, { wpm: 25, accuracy: 95, passed: true, stars: 3 });
    assert.equal(state.lessons['S1-L001'].bestWpm, 25);
    assert.equal(state.lessons['S2-L001'].bestWpm, 35);
    assert.notEqual(state.lessons['S1-L001'].bestWpm, state.lessons['S2-L001'].bestWpm);
  });

  it('correctly calculates star ratings (0 to 3 stars)', () => {
    // Failing: 0 stars
    assert.equal(calculateStars(80, 90, 15, 20), 0);
    // Baseline pass: 1 star
    assert.equal(calculateStars(90, 90, 20, 20), 1);
    // Strong pass: 2 stars (+5 WPM, +2% Acc)
    assert.equal(calculateStars(92, 90, 25, 20), 2);
    // Mastery: 3 stars (+10 WPM, +4% Acc)
    assert.equal(calculateStars(94, 90, 30, 20), 3);
  });

  it('calculates genuine dashboard stats across 7,000 levels without fabricated values', () => {
    recordLessonResult(1, 1, { wpm: 25, accuracy: 95, passed: true, stars: 3 });
    recordLessonResult(1, 2, { wpm: 26, accuracy: 96, passed: true, stars: 3 });

    const stats = getAcademyDashboardStats(1);
    assert.equal(stats.completedLessons, 2);
    assert.equal(stats.totalStageLessons, 700);
    assert.equal(stats.totalAcademyLessons, 7000);
    assert.equal(stats.totalAcademyCompleted, 2);
  });

  it('getNextRecommendedLesson dynamically points to first uncompleted lesson across 7,000 levels', () => {
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
      recordLessonResult(1, 2, { wpm: 38, accuracy: 98, passed: true, stars: 3 });

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
        stageProgress: { 1: 1, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 },
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
  });
});
