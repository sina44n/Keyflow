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

describe('KEYFLOW Lesson Progress & Progression System (600 Levels)', () => {
  beforeEach(() => {
    resetAllProgress();
  });

  it('unlocks Level 1 by default for new learners', () => {
    assert.equal(isLessonUnlocked(1, 1), true);
  });

  it('keeps Level 2 locked until Level 1 is passed', () => {
    assert.equal(isLessonUnlocked(1, 2), false);

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

  it('progresses smoothly across Stage 1 to Stage 2 boundary (Level 100 -> Level 101)', () => {
    assert.equal(isStageUnlocked(2), false);
    assert.equal(isLessonUnlocked(2, 101), false);

    // Complete Level 100 (Stage 1 Capstone)
    recordLessonResult(1, 100, {
      wpm: 30,
      accuracy: 95,
      passed: true,
      stars: 3,
    });

    // Stage 2 and Level 101 must now be unlocked!
    assert.equal(isStageUnlocked(2), true);
    assert.equal(isLessonUnlocked(2, 101), true);
  });

  it('progresses smoothly across Stage 2 to Stage 3 boundary (Level 180 -> Level 181)', () => {
    assert.equal(isStageUnlocked(3), false);
    assert.equal(isLessonUnlocked(3, 181), false);

    // Complete Level 180
    recordLessonResult(2, 180, {
      wpm: 38,
      accuracy: 95,
      passed: true,
      stars: 3,
    });

    assert.equal(isStageUnlocked(3), true);
    assert.equal(isLessonUnlocked(3, 181), true);
  });

  it('progresses smoothly across Stage 6 to Stage 7 boundary (Level 500 -> Level 501)', () => {
    assert.equal(isStageUnlocked(7), false);
    assert.equal(isLessonUnlocked(7, 501), false);

    // Complete Level 500
    recordLessonResult(6, 500, {
      wpm: 60,
      accuracy: 96,
      passed: true,
      stars: 4,
    });

    assert.equal(isStageUnlocked(7), true);
    assert.equal(isLessonUnlocked(7, 501), true);
  });

  it('correctly calculates star ratings (0 to 5 stars)', () => {
    // Failing performance: 0 stars
    assert.equal(calculateStars(80, 90, 15, 20), 0);

    // Bare pass: 1 star
    assert.equal(calculateStars(90, 90, 20, 20), 1);

    // Good pass: 2 stars
    assert.equal(calculateStars(93, 90, 20, 20), 2);

    // Solid mastery: 3 stars
    assert.equal(calculateStars(95, 90, 23, 20), 3);

    // High mastery: 4 stars
    assert.equal(calculateStars(97, 90, 24, 20), 4);

    // Elite mastery: 5 stars
    assert.equal(calculateStars(99, 90, 26, 20), 5);
  });

  it('retains best WPM, accuracy, and stars across repeated attempts', () => {
    // Attempt 1: 30 WPM, 94% acc
    recordLessonResult(1, 1, {
      wpm: 30,
      accuracy: 94,
      passed: true,
      stars: 2,
    });

    // Attempt 2: 45 WPM, 98% acc (higher performance)
    const updated = recordLessonResult(1, 1, {
      wpm: 45,
      accuracy: 98,
      passed: true,
      stars: 4,
    });

    assert.equal(updated.lessons['level_1'].bestWpm, 45);
    assert.equal(updated.lessons['level_1'].bestAccuracy, 98);
    assert.equal(updated.lessons['level_1'].stars, 4);
    assert.equal(updated.lessons['level_1'].attempts, 2);

    // Attempt 3: 20 WPM, 90% acc (lower performance - bests must be retained!)
    const retained = recordLessonResult(1, 1, {
      wpm: 20,
      accuracy: 90,
      passed: true,
      stars: 1,
    });

    assert.equal(retained.lessons['level_1'].bestWpm, 45);
    assert.equal(retained.lessons['level_1'].bestAccuracy, 98);
    assert.equal(retained.lessons['level_1'].stars, 4);
    assert.equal(retained.lessons['level_1'].attempts, 3);
  });

  it('calculates genuine dashboard stats across 600 levels without fabricated values', () => {
    const initialStats = getAcademyDashboardStats(1);
    assert.equal(initialStats.completedLessons, 0);
    assert.equal(initialStats.totalLessons, 600);
    assert.equal(initialStats.overallProgress, 0);

    // Pass 6 lessons
    for (let l = 1; l <= 6; l++) {
      recordLessonResult(1, l, {
        wpm: 30,
        accuracy: 96,
        passed: true,
        stars: 3,
      });
    }

    const updatedStats = getAcademyDashboardStats(1);
    assert.equal(updatedStats.completedLessons, 6);
    assert.equal(updatedStats.totalLessons, 600);
    assert.equal(updatedStats.overallProgress, 1);
    assert.equal(updatedStats.accuracy, 96);
  });

  it('getNextRecommendedLesson dynamically points to first uncompleted lesson across 600 levels', () => {
    // Brand new user: Level 1
    assert.deepEqual(getNextRecommendedLesson(1), { stageId: 1, lessonNum: 1 });

    // Complete Level 1
    recordLessonResult(1, 1, { wpm: 25, accuracy: 95, passed: true, stars: 3 });
    assert.deepEqual(getNextRecommendedLesson(1), { stageId: 1, lessonNum: 2 });

    // Complete Level 2
    recordLessonResult(1, 2, { wpm: 28, accuracy: 96, passed: true, stars: 3 });
    assert.deepEqual(getNextRecommendedLesson(1), { stageId: 1, lessonNum: 3 });
  });
});
