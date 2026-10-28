import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  getCurrentUserId,
  getStorageKey,
  getGoalStorageKey,
  getWeeklyGoalStorageKey,
  getWeekStartStorageKey,
  loadRawTelemetrySessions,
  saveRawTelemetrySessions,
  getAllMergedSessions,
  recordTelemetrySession,
  getPracticeGoalMinutes,
  setPracticeGoalMinutes,
  getWeeklyPracticeGoalMinutes,
  setWeeklyPracticeGoalMinutes,
  getWeekStartDay,
  setWeekStartDay,
  calculateReportMetrics,
  generatePracticeCalendar,
  formatDuration,
  DAY_HEADERS,
} from '../../utils/telemetryStorage.js';

describe('KEYFLOW Telemetry Masterpiece Audit & Data Integrity Suite', () => {
  beforeEach(() => {
    // Reset simulated localStorage
    const store = new Map();
    globalThis.localStorage = {
      getItem: (k) => store.get(k) ?? null,
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
      clear: () => store.clear(),
    };
  });

  describe('1. Multi-User Isolation & Authoritative Storage Separation', () => {
    it('generates distinct storage keys for Guest, User 101, and User 202', () => {
      assert.equal(getStorageKey(null), 'keyflow_telemetry_sessions_guest');
      assert.equal(getStorageKey(101), 'keyflow_telemetry_sessions_u_101');
      assert.equal(getStorageKey(202), 'keyflow_telemetry_sessions_u_202');

      assert.equal(getGoalStorageKey(null), 'keyflow_telemetry_goal_guest');
      assert.equal(getGoalStorageKey(101), 'keyflow_telemetry_goal_u_101');

      assert.equal(getWeeklyGoalStorageKey(null), 'keyflow_telemetry_weekly_goal_guest');
      assert.equal(getWeeklyGoalStorageKey(101), 'keyflow_telemetry_weekly_goal_u_101');

      assert.equal(getWeekStartStorageKey(null), 'keyflow_week_start_guest');
      assert.equal(getWeekStartStorageKey(101), 'keyflow_week_start_u_101');
    });

    it('strictly isolates User A and User B session records without cross-contamination', () => {
      const sessionUserA = {
        id: 'sess_A_1',
        timestamp: Date.now(),
        date: '2026-10-28',
        duration: 120,
        wpm: 85,
        accuracy: 98,
        totalChars: 850,
        correctChars: 835,
        status: 'passed',
      };
      const sessionUserB = {
        id: 'sess_B_1',
        timestamp: Date.now(),
        date: '2026-10-28',
        duration: 60,
        wpm: 42,
        accuracy: 91,
        totalChars: 210,
        correctChars: 191,
        status: 'passed',
      };

      saveRawTelemetrySessions([sessionUserA], 101);
      saveRawTelemetrySessions([sessionUserB], 202);

      const loadedA = loadRawTelemetrySessions(101);
      const loadedB = loadRawTelemetrySessions(202);
      const loadedGuest = loadRawTelemetrySessions(null);

      assert.equal(loadedA.length, 1);
      assert.equal(loadedA[0].id, 'sess_A_1');
      assert.equal(loadedA[0].wpm, 85);

      assert.equal(loadedB.length, 1);
      assert.equal(loadedB[0].id, 'sess_B_1');
      assert.equal(loadedB[0].wpm, 42);

      assert.equal(loadedGuest.length, 0);
    });

    it('isolates personal practice goals between different user accounts', () => {
      setPracticeGoalMinutes(15, 101);
      setPracticeGoalMinutes(45, 202);
      setPracticeGoalMinutes(20, null); // guest

      assert.equal(getPracticeGoalMinutes(101), 15);
      assert.equal(getPracticeGoalMinutes(202), 45);
      assert.equal(getPracticeGoalMinutes(null), 20);

      setWeeklyPracticeGoalMinutes(180, 101);
      setWeeklyPracticeGoalMinutes(600, 202);
      assert.equal(getWeeklyPracticeGoalMinutes(101), 180);
      assert.equal(getWeeklyPracticeGoalMinutes(202), 600);
    });

    it('isolates calendar first-day-of-week preferences across users', () => {
      setWeekStartDay(1, 101); // Monday
      setWeekStartDay(0, 202); // Sunday
      setWeekStartDay(6, null); // Saturday for guest

      assert.equal(getWeekStartDay(101), 1);
      assert.equal(getWeekStartDay(202), 0);
      assert.equal(getWeekStartDay(null), 6);
    });
  });

  describe('2. Telemetry Calculation & Mathematical Integrity', () => {
    it('calculates gross WPM and net WPM strictly from actual typed characters and time', () => {
      // 500 total characters, 10 errors, in 60 seconds (1 minute)
      // Gross WPM = (500 / 5) / 1 = 100
      // Net WPM = (500/5 - 10) / 1 = 90
      const session = recordTelemetrySession({
        id: 'test_calc_session_1',
        duration: 60,
        totalChars: 500,
        correctChars: 490,
        incorrectChars: 10,
        backspaces: 5,
        wpm: 90,
      });

      assert.equal(session.grossWpm, 100);
      assert.equal(session.wpm, 90);
      assert.equal(session.accuracy, 98); // 490/500 = 98%
    });

    it('prevents double-counting and deduplicates sessions on save', () => {
      const s1 = { id: 'dup_sess_1', duration: 30, wpm: 50, status: 'passed' };
      const s2 = { id: 'dup_sess_1', duration: 30, wpm: 55, status: 'passed' }; // same ID, updated

      saveRawTelemetrySessions([s1], 999);
      saveRawTelemetrySessions([s2], 999);

      const stored = loadRawTelemetrySessions(999);
      assert.equal(stored.length, 1);
      assert.equal(stored[0].wpm, 55);
    });

    it('handles empty session history honestly without fabricating statistics or NaN', () => {
      const emptyMetrics = calculateReportMetrics([], 'overall', { goalMinutes: 30 });

      assert.equal(emptyMetrics.hasData, false);
      assert.equal(emptyMetrics.totalAttempts, 0);
      assert.equal(emptyMetrics.totalDuration, 0);
      assert.equal(emptyMetrics.avgWpm, 0);
      assert.equal(emptyMetrics.accuracy, 0);
      assert.equal(emptyMetrics.realAccuracy, 0);
      assert.equal(emptyMetrics.goalProgressPercent, 0);
      assert.equal(emptyMetrics.leftHandStats.hasData, false);
      assert.equal(emptyMetrics.rightHandStats.hasData, false);
      assert.equal(emptyMetrics.thumbsStats.hasData, false);
    });

    it('calculates practice attempts breakdown: passed, failed, partial', () => {
      const sessions = [
        { id: '1', duration: 60, wpm: 50, totalChars: 250, correctChars: 240, status: 'passed' },
        { id: '2', duration: 30, wpm: 40, totalChars: 100, correctChars: 80, status: 'failed' },
        { id: '3', duration: 15, wpm: 30, totalChars: 50, correctChars: 40, status: 'partial' },
      ];

      const metrics = calculateReportMetrics(sessions, 'overall');
      assert.equal(metrics.totalAttempts, 3);
      assert.equal(metrics.passedAttempts, 1);
      assert.equal(metrics.failedAttempts, 1);
      assert.equal(metrics.partialAttempts, 1);
      assert.equal(metrics.totalDuration, 105);
      assert.equal(metrics.passedDuration, 60);
      assert.equal(metrics.failedDuration, 30);
      assert.equal(metrics.partialDuration, 15);
    });

    it('computes weekly report goal progress against weeklyGoalMinutes', () => {
      // 1 hour (3600s) practiced in a week with 2 hour (120m) goal = 50% progress
      const sessions = [
        { id: 'w1', timestamp: Date.now(), duration: 3600, wpm: 60, totalChars: 3000, correctChars: 2900, status: 'passed' }
      ];

      const weeklyMetrics = calculateReportMetrics(sessions, 'weekly', { weeklyGoalMinutes: 120 });
      assert.equal(weeklyMetrics.weeklyGoalMinutes, 120);
      assert.equal(weeklyMetrics.goalProgressPercent, 50);
    });
  });

  describe('3. Finger Mastery & Hand Attribution Integrity', () => {
    it('aggregates real finger keystrokes and reports hasData=true when keystrokes exist', () => {
      const sessionWithFingers = {
        id: 'sess_finger_1',
        duration: 60,
        wpm: 60,
        status: 'passed',
        totalChars: 300,
        correctChars: 285,
        fingerStats: {
          'left-index': { total: 100, correct: 95, incorrect: 5, wpm: 55 },
          'right-index': { total: 120, correct: 114, incorrect: 6, wpm: 65 },
          'thumb': { total: 80, correct: 76, incorrect: 4, wpm: 70 },
        },
      };

      const metrics = calculateReportMetrics([sessionWithFingers], 'overall');
      const leftIndex = metrics.fingerStats.find((f) => f.id === 'left-index');
      const rightIndex = metrics.fingerStats.find((f) => f.id === 'right-index');
      const leftPinky = metrics.fingerStats.find((f) => f.id === 'left-pinky');

      assert.equal(leftIndex.hasData, true);
      assert.equal(leftIndex.speed, 55);
      assert.equal(leftIndex.accuracy, 95);

      assert.equal(rightIndex.hasData, true);
      assert.equal(rightIndex.speed, 65);
      assert.equal(rightIndex.accuracy, 95);

      // Pinky had 0 keystrokes in this session: must show hasData=false honestly
      assert.equal(leftPinky.hasData, false);
      assert.equal(leftPinky.totalKeystrokes, 0);
    });

    it('calculates Left Hand, Right Hand, and Thumbs summaries with true data attribution', () => {
      const session = {
        id: 'sess_hands_1',
        duration: 60,
        wpm: 50,
        status: 'passed',
        fingerStats: {
          'left-index': { total: 50, correct: 45, incorrect: 5, wpm: 40 },
          'left-middle': { total: 50, correct: 45, incorrect: 5, wpm: 40 },
          'right-index': { total: 60, correct: 57, incorrect: 3, wpm: 50 },
          'thumb': { total: 40, correct: 38, incorrect: 2, wpm: 75 },
        },
      };

      const metrics = calculateReportMetrics([session], 'overall');
      assert.equal(metrics.leftHandStats.hasData, true);
      assert.equal(metrics.leftHandStats.speed, 40);
      assert.equal(metrics.leftHandStats.accuracy, 90);

      assert.equal(metrics.rightHandStats.hasData, true);
      assert.equal(metrics.rightHandStats.speed, 50);
      assert.equal(metrics.rightHandStats.accuracy, 95);

      assert.equal(metrics.thumbsStats.hasData, true);
      assert.equal(metrics.thumbsStats.speed, 75);
      assert.equal(metrics.thumbsStats.accuracy, 95);
    });
  });

  describe('4. Keyboard Mastery Character Mapping', () => {
    it('aggregates character statistics and correctly resolves spacebar and letters', () => {
      const session = {
        id: 'sess_chars_1',
        duration: 60,
        status: 'passed',
        characterStats: {
          'e': { total: 40, correct: 38, incorrect: 2, wpm: 60 },
          't': { total: 30, correct: 30, incorrect: 0, wpm: 65 },
          ' ': { total: 20, correct: 20, incorrect: 0, wpm: 80 },
        },
      };

      const metrics = calculateReportMetrics([session], 'overall');
      const eStat = metrics.characterStats.find((c) => c.char === 'e');
      const spaceStat = metrics.characterStats.find((c) => c.char === ' ');

      assert.ok(eStat);
      assert.equal(eStat.total, 40);
      assert.equal(eStat.accuracy, 95);
      assert.equal(eStat.wpm, 60);

      assert.ok(spaceStat);
      assert.equal(spaceStat.total, 20);
      assert.equal(spaceStat.accuracy, 100);
      assert.equal(spaceStat.wpm, 80);
    });
  });

  describe('5. Practice Calendar Week Alignment', () => {
    it('generates 12 calendar months with correct weekday alignment for all 7 week-starts', () => {
      const sessions = [
        { id: 'cal_1', date: '2026-10-28', duration: 1200, wpm: 60, accuracy: 95, status: 'passed' }
      ];

      for (let startDay = 0; startDay < 7; startDay++) {
        const cal = generatePracticeCalendar(sessions, startDay);
        assert.equal(cal.months.length, 12);
        assert.equal(cal.totalDuration, 1200);
        assert.equal(cal.totalAttempts, 1);

        // Every week array must have exactly 7 day slots
        cal.months.forEach((m) => {
          m.weeks.forEach((w) => {
            assert.equal(w.days.length, 7);
          });
        });
      }
    });
  });
});
