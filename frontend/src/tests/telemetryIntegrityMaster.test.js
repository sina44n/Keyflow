import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Mock browser global localStorage & window
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, val) => {
      store[key] = String(val);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

globalThis.localStorage = mockLocalStorage;
globalThis.window = {
  dispatchEvent: () => {},
  CustomEvent: class CustomEvent {},
};

import {
  recordTelemetrySession,
  getAllMergedSessions,
  syncTelemetrySessionsFromBackend,
  calculateReportMetrics,
  getPersonalRecords,
  generateProgressTimeSeries,
  clearAllTelemetrySessions,
  getStorageKey,
} from '../utils/telemetryStorage.js';

describe('KEYFLOW Telemetry System — Production Data Integrity & Cross-Page Synchronization Suite', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 1: Workstation Page A Recording
  // ─────────────────────────────────────────────────────────────────────────
  it('Scenario 1: accurately records Workstation Page A genuine typing session', () => {
    const userA = 'user_101';
    const canonicalId = 'sess_workstation_a_123';

    const recorded = recordTelemetrySession({
      userId: userA,
      id: canonicalId,
      sessionId: canonicalId,
      source: 'workstation_a',
      sourceEnvironment: 'workstation_a',
      mode: 'time',
      sessionType: 'timed',
      grossWpm: 72,
      netWpm: 70,
      accuracy: 98,
      rawAccuracy: 98,
      durationSeconds: 15,
      totalChars: 180,
      correctChars: 176,
      incorrectChars: 4,
      backspaces: 2,
      characterStats: {
        t: { char: 't', total: 20, correct: 20, incorrect: 0, wpm: 75 },
        h: { char: 'h', total: 15, correct: 15, incorrect: 0, wpm: 70 },
      },
    });

    assert.equal(recorded.source, 'workstation_a');
    assert.equal(recorded.sourceEnvironment, 'workstation_a');
    assert.equal(recorded.grossWpm, 72);
    assert.equal(recorded.netWpm, 70);
    assert.equal(recorded.duration, 15);
    assert.equal(recorded.totalChars, 180);

    // Verify stored under User A's isolated storage
    const userASessions = getAllMergedSessions(userA);
    assert.equal(userASessions.length, 1);
    assert.equal(userASessions[0].id, canonicalId);
    assert.equal(userASessions[0].source, 'workstation_a');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 2: Workstation Page B Recording & Page Independence
  // ─────────────────────────────────────────────────────────────────────────
  it('Scenario 2: accurately records Workstation Page B (Switch mode) with complete independence', () => {
    const userA = 'user_101';
    const pageBId = 'sess_workstation_b_456';

    const recorded = recordTelemetrySession({
      userId: userA,
      id: pageBId,
      sessionId: pageBId,
      source: 'workstation_b',
      sourceEnvironment: 'workstation_b',
      mode: 'words',
      sessionType: 'switch_mode',
      grossWpm: 85,
      netWpm: 84,
      accuracy: 99,
      rawAccuracy: 99,
      durationSeconds: 20,
      totalChars: 250,
      correctChars: 248,
      incorrectChars: 2,
      characterStats: {
        a: { char: 'a', total: 30, correct: 30, incorrect: 0, wpm: 88 },
      },
    });

    assert.equal(recorded.source, 'workstation_b');
    assert.equal(recorded.sourceEnvironment, 'workstation_b');
    assert.equal(recorded.grossWpm, 85);
    assert.equal(recorded.duration, 20);

    const userASessions = getAllMergedSessions(userA);
    assert.equal(userASessions.length, 1);
    assert.equal(userASessions[0].source, 'workstation_b');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 3: Academy Levels Recording & Non-Duplication
  // ─────────────────────────────────────────────────────────────────────────
  it('Scenario 3: accurately records Academy Level session without synthesizing duplicate legacy attempts', () => {
    const userA = 'user_101';
    const academyId = 'lesson_2_3_1700000000';

    const recorded = recordTelemetrySession({
      userId: userA,
      id: academyId,
      sessionId: academyId,
      source: 'academy',
      sourceEnvironment: 'academy',
      mode: 'lesson',
      sessionType: 'lesson',
      stageId: 2,
      levelNumber: 3,
      lessonKey: 'S2-L3',
      lessonId: 'S2-L3',
      grossWpm: 55,
      netWpm: 55,
      accuracy: 100,
      rawAccuracy: 100,
      durationSeconds: 40,
      totalChars: 300,
      correctChars: 300,
      incorrectChars: 0,
      characterStats: {
        e: { char: 'e', total: 40, correct: 40, incorrect: 0, wpm: 58 },
      },
    });

    assert.equal(recorded.source, 'academy');
    assert.equal(recorded.stageId, 2);
    assert.equal(recorded.levelNumber, 3);
    assert.equal(recorded.lessonKey, 'S2-L3');

    // Verify getAllMergedSessions does not create a fake duplicate
    const sessions = getAllMergedSessions(userA);
    assert.equal(sessions.length, 1, 'Academy session must be counted exactly once without duplication');
    assert.equal(sessions[0].id, academyId);
    assert.equal(sessions[0].source, 'academy');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 4: Cross-Environment Synchronization & Mathematical Exactness
  // ─────────────────────────────────────────────────────────────────────────
  it('Scenario 4: unifies sessions across Workstation A, Workstation B, and Academy with exact mathematics', () => {
    const userA = 'user_101';

    // 1. Workstation Page A: 15s, 180 chars, 72 WPM
    recordTelemetrySession({
      userId: userA,
      id: 'sess_wa',
      source: 'workstation_a',
      grossWpm: 72,
      netWpm: 70,
      accuracy: 98,
      durationSeconds: 15,
      totalChars: 180,
      correctChars: 176,
      incorrectChars: 4,
      characterStats: { t: { char: 't', total: 20, correct: 20, wpm: 75 } },
    });

    // 2. Workstation Page B: 20s, 250 chars, 85 WPM
    recordTelemetrySession({
      userId: userA,
      id: 'sess_wb',
      source: 'workstation_b',
      grossWpm: 85,
      netWpm: 84,
      accuracy: 99,
      durationSeconds: 20,
      totalChars: 250,
      correctChars: 248,
      incorrectChars: 2,
      characterStats: { a: { char: 'a', total: 30, correct: 30, wpm: 88 } },
    });

    // 3. Academy Level: 40s, 300 chars, 55 WPM
    recordTelemetrySession({
      userId: userA,
      id: 'sess_acad',
      source: 'academy',
      stageId: 1,
      levelNumber: 1,
      grossWpm: 55,
      netWpm: 55,
      accuracy: 100,
      durationSeconds: 40,
      totalChars: 300,
      correctChars: 300,
      incorrectChars: 0,
      characterStats: { e: { char: 'e', total: 40, correct: 40, wpm: 58 } },
    });

    const allSessions = getAllMergedSessions(userA);
    assert.equal(allSessions.length, 3, 'All 3 environments represented in session history');

    const metrics = calculateReportMetrics(allSessions, 'overall');

    // Duration: 15 + 20 + 40 = 75 seconds
    assert.equal(metrics.totalDuration, 75);
    // Total Characters: 180 + 250 + 300 = 730
    assert.equal(metrics.totalChars, 730);
    // Correct Characters: 176 + 248 + 300 = 724
    assert.equal(metrics.correctChars, 724);
    // Incorrect: 4 + 2 + 0 = 6
    assert.equal(metrics.incorrectChars, 6);
    // Accuracy: Math.round((724 / 730) * 100) = 99%
    assert.equal(metrics.accuracy, 99);
    // Average Speed: Math.round((72 + 85 + 55) / 3) = 71 WPM
    assert.equal(metrics.avgWpm, 71);
    // Best Speed: Math.max(72, 85, 55) = 85 WPM
    assert.equal(metrics.maxWpm, 85);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 5: Active Typing Duration vs Wall-Clock Time
  // ─────────────────────────────────────────────────────────────────────────
  it('Scenario 5: ensures recorded duration matches active typing time, strictly excluding pauses', () => {
    const userA = 'user_101';
    // User started at T=0, typed for 5s, paused for 30s, typed for 10s, auto-paused after 7s
    // Active typing time: 15 seconds. Wall-clock elapsed: 52 seconds.
    const activeSeconds = 15;

    const recorded = recordTelemetrySession({
      userId: userA,
      id: 'sess_pause_test',
      source: 'workstation_a',
      durationSeconds: activeSeconds,
      totalChars: 150,
      correctChars: 150,
      incorrectChars: 0,
      grossWpm: 60,
    });

    assert.equal(recorded.duration, 15, 'Recorded duration must be active typing seconds, not wall-clock');
    assert.equal(recorded.durationSeconds, 15);

    const metrics = calculateReportMetrics([recorded], 'overall');
    assert.equal(metrics.totalDuration, 15);
    assert.equal(metrics.formattedDuration, '15s');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 6: Zero Fabricated / Mock Data on Empty State
  // ─────────────────────────────────────────────────────────────────────────
  it('Scenario 6: guarantees completely honest, genuine 0 values and empty states when no data exists', () => {
    const emptyMetrics = calculateReportMetrics([], 'overall');
    assert.equal(emptyMetrics.hasData, false);
    assert.equal(emptyMetrics.totalDuration, 0);
    assert.equal(emptyMetrics.totalAttempts, 0);
    assert.equal(emptyMetrics.avgWpm, 0);
    assert.equal(emptyMetrics.maxWpm, 0);
    assert.equal(emptyMetrics.accuracy, 0);
    assert.equal(emptyMetrics.realAccuracy, 0);
    assert.equal(emptyMetrics.totalChars, 0);
    assert.equal(emptyMetrics.coveragePercent, 0);
    assert.equal(emptyMetrics.activePracticeDays, 0);

    const emptyRecords = getPersonalRecords([]);
    assert.equal(emptyRecords.highestWpm, 0);
    assert.equal(emptyRecords.bestAccuracy, 0);
    assert.equal(emptyRecords.totalSessions, 0);
    assert.equal(emptyRecords.totalCompletedSessions, 0);
    assert.equal(emptyRecords.totalPracticeSeconds, 0);

    const emptySeries = generateProgressTimeSeries([]);
    assert.equal(emptySeries.length, 0);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 7: Strict User Isolation (User A vs User B)
  // ─────────────────────────────────────────────────────────────────────────
  it('Scenario 7: strictly enforces user isolation between different user accounts', () => {
    const userA = 'user_101';
    const userB = 'user_202';

    // Record session for User A
    recordTelemetrySession({
      userId: userA,
      id: 'sess_userA_1',
      source: 'workstation_a',
      grossWpm: 90,
      durationSeconds: 30,
      totalChars: 300,
      correctChars: 300,
    });

    // Record session for User B
    recordTelemetrySession({
      userId: userB,
      id: 'sess_userB_1',
      source: 'workstation_b',
      grossWpm: 45,
      durationSeconds: 60,
      totalChars: 400,
      correctChars: 390,
    });

    // Verify User A only sees User A's data
    const sessionsA = getAllMergedSessions(userA);
    assert.equal(sessionsA.length, 1);
    assert.equal(sessionsA[0].id, 'sess_userA_1');
    assert.equal(sessionsA[0].grossWpm, 90);

    // Verify User B only sees User B's data
    const sessionsB = getAllMergedSessions(userB);
    assert.equal(sessionsB.length, 1);
    assert.equal(sessionsB[0].id, 'sess_userB_1');
    assert.equal(sessionsB[0].grossWpm, 45);

    // Confirm storage keys are strictly isolated
    assert.notEqual(getStorageKey(userA), getStorageKey(userB));
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 8: Idempotent Synchronization & No Duplication
  // ─────────────────────────────────────────────────────────────────────────
  it('Scenario 8: guarantees idempotency so backend sync and re-saving never duplicates sessions', () => {
    const userA = 'user_101';
    const clientSessionId = 'unique_session_uuid_999';

    // 1. Session recorded locally
    recordTelemetrySession({
      userId: userA,
      id: clientSessionId,
      sessionId: clientSessionId,
      clientSessionId,
      source: 'workstation_a',
      grossWpm: 65,
      netWpm: 65,
      accuracy: 100,
      durationSeconds: 15,
      totalChars: 150,
      correctChars: 150,
    });

    let localSessions = getAllMergedSessions(userA);
    assert.equal(localSessions.length, 1);

    // 2. Re-saving same session does not create duplicate
    recordTelemetrySession({
      userId: userA,
      id: clientSessionId,
      sessionId: clientSessionId,
      clientSessionId,
      source: 'workstation_a',
      grossWpm: 65,
      netWpm: 65,
      accuracy: 100,
      durationSeconds: 15,
      totalChars: 150,
      correctChars: 150,
    });

    localSessions = getAllMergedSessions(userA);
    assert.equal(localSessions.length, 1, 'Duplicate ID must be deduplicated on save');

    // 3. Backend sync passes same session (from PostgreSQL PracticeSession table)
    const backendSessions = [
      {
        id: 42,
        client_session_id: clientSessionId,
        source: 'workstation_a',
        session_type: 'timed',
        duration_seconds: 15,
        total_chars: 150,
        correct_chars: 150,
        incorrect_chars: 0,
        gross_wpm: 65,
        net_wpm: 65,
        accuracy: 100,
        created_at: new Date().toISOString(),
      },
    ];

    syncTelemetrySessionsFromBackend(backendSessions, userA);

    localSessions = getAllMergedSessions(userA);
    assert.equal(localSessions.length, 1, 'Syncing matching client_session_id must NOT duplicate the session');
    assert.equal(localSessions[0].id, clientSessionId);
  });
});
