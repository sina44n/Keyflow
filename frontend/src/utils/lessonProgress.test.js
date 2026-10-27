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

describe('KEYFLOW Lesson Progress & Progression System', () => {
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

  it('progresses smoothly across Stage 1 to Stage 2 boundary (Level 10 -> Level 11)', () => {
    assert.equal(isStageUnlocked(2), false);
    assert.equal(isLessonUnlocked(2, 11), false);

    // Complete Level 10
    recordLessonResult(1, 10, {
      wpm: 24,
      accuracy: 93,
      passed: true,
      stars: 3,
    });

    // Stage 2 and Level 11 must now be unlocked!
    assert.equal(isStageUnlocked(2), true);
    assert.equal(isLessonUnlocked(2, 11), true);
  });

  it('REGRESSION CHECK: unlocks Stage 3 and Level 21 when Level 20 is passed', () => {
    assert.equal(isStageUnlocked(3), false);
    assert.equal(isLessonUnlocked(3, 21), false);

    // Complete Level 20
    recordLessonResult(2, 20, {
      wpm: 28,
      accuracy: 94,
      passed: true,
      stars: 3,
    });

    // Stage 3 and Level 21 must now be unlocked!
    assert.equal(isStageUnlocked(3), true);
    assert.equal(isLessonUnlocked(3, 21), true);
  });

  it('REGRESSION CHECK: unlocks Stage 6 and Level 51 when Level 50 is passed', () => {
    assert.equal(isStageUnlocked(6), false);
    assert.equal(isLessonUnlocked(6, 51), false);

    // Complete Level 50
    recordLessonResult(5, 50, {
      wpm: 42,
      accuracy: 95,
      passed: true,
      stars: 3,
    });

    // Stage 6 and Level 51 must now be unlocked!
    assert.equal(isStageUnlocked(6), true);
    assert.equal(isLessonUnlocked(6, 51), true);
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
    recordLessonResult(1, 1, {
      wpm: 20,
      accuracy: 90,
      passed: true,
      stars: 2,
    });

    // Second attempt with better WPM
    const state = recordLessonResult(1, 1, {
      wpm: 35,
      accuracy: 92,
      passed: true,
      stars: 3,
    });

    const rec = state.lessons['s1_l1'];
    assert.equal(rec.bestWpm, 35);
    assert.equal(rec.bestAccuracy, 92);
    assert.equal(rec.stars, 3);
    assert.equal(rec.attempts, 2);
  });

  it('calculates genuine dashboard stats without fabricated values', () => {
    const stats0 = getAcademyDashboardStats(1);
    assert.equal(stats0.completedLessons, 0);
    assert.equal(stats0.totalLessons, 60);

    // Complete 3 lessons
    recordLessonResult(1, 1, { wpm: 25, accuracy: 96, passed: true, stars: 3 });
    recordLessonResult(1, 2, { wpm: 28, accuracy: 98, passed: true, stars: 4 });
    recordLessonResult(1, 3, { wpm: 30, accuracy: 94, passed: true, stars: 3 });

    const stats1 = getAcademyDashboardStats(1);
    assert.equal(stats1.completedLessons, 3);
    assert.equal(stats1.accuracy, 96); // Average of 96, 98, 94 is 96
  });

  it('getNextRecommendedLesson dynamically points to first uncompleted lesson', () => {
    assert.deepEqual(getNextRecommendedLesson(1), { stageId: 1, lessonNum: 1 });

    recordLessonResult(1, 1, { wpm: 25, accuracy: 95, passed: true });
    assert.deepEqual(getNextRecommendedLesson(1), { stageId: 1, lessonNum: 2 });
  });
});
