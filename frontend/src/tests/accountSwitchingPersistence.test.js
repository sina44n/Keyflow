import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Polyfill MockLocalStorage for Node test runner
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
  setLessonProgressUser,
  getLessonProgress,
  syncLessonProgressFromBackend,
  migrateGuestProgressToAccount,
  resetGuestProgress,
  getCurrentUserId,
  recordLessonResult,
} from '../utils/lessonProgress.js';

import {
  loadRawTelemetrySessions,
  saveRawTelemetrySessions,
  syncTelemetrySessionsFromBackend,
  getStorageKey as getTelemetryStorageKey,
} from '../utils/telemetryStorage.js';

import {
  setArcadeStorageUser,
  getArcadeRecords,
  syncArcadeRecordsFromBackend,
  resetGuestArcadeRecords,
} from '../utils/arcadeStorage.js';

describe('KEYFLOW — Account Switching Data Persistence & Zero-Loss Isolation Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    setLessonProgressUser(null);
    setArcadeStorageUser(null);
    resetGuestProgress();
    resetGuestArcadeRecords();
  });

  it('1. Account A -> Account B -> Account A: Complete Roundtrip with Zero Data Loss', async () => {
    // ---------------------------------------------------------
    // Phase 1: User 14 (Account A) logs in and accumulates progress
    // ---------------------------------------------------------
    setLessonProgressUser('14');
    assert.equal(getCurrentUserId(), '14');

    // Simulate backend summary hydration for User 14 (6 lessons, 3 stars)
    const accountASummary = {
      lessons: {
        'S1-L001': { completed: true, stars: 3, bestWpm: 55, bestAccuracy: 100, attempts: 4 },
        'S1-L002': { completed: true, stars: 3, bestWpm: 54, bestAccuracy: 100, attempts: 2 },
        'S1-L003': { completed: true, stars: 3, bestWpm: 45, bestAccuracy: 93, attempts: 1 },
        'S1-L004': { completed: true, stars: 3, bestWpm: 49, bestAccuracy: 98, attempts: 1 },
        'S1-L005': { completed: true, stars: 3, bestWpm: 43, bestAccuracy: 100, attempts: 2 },
        'S1-L008': { completed: true, stars: 3, bestWpm: 30, bestAccuracy: 96, attempts: 1 },
      },
      stageProgress: { '1': 8, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0, '8': 0, '9': 0, '10': 0 },
      unlockedStages: [1],
      stageAccessTypes: { '1': 'guided_unlock' },
    };
    syncLessonProgressFromBackend(accountASummary);

    // Verify Account A local state is populated
    let stateA = getLessonProgress();
    assert.equal(stateA.lessons['S1-L001'].completed, true);
    assert.equal(stateA.lessons['S1-L001'].stars, 3);
    assert.equal(stateA.lessons['S1-L001'].bestWpm, 55);
    assert.equal(stateA.lessons['S1-L008'].completed, true);
    assert.equal(stateA.stageProgress['1'], 8);

    // Account A hydrates practice sessions
    const accountAPractice = [
      { id: 40, client_session_id: 'sess_a_40', session_type: 'timed', duration_seconds: 15, gross_wpm: 20, net_wpm: 4, accuracy: 81, total_chars: 50, correct_chars: 41, incorrect_chars: 9, error_count: 4, created_at: '2026-11-05T18:32:00Z' },
      { id: 39, client_session_id: 'sess_a_39', session_type: 'timed', duration_seconds: 15, gross_wpm: 50, net_wpm: 46, accuracy: 93, total_chars: 125, correct_chars: 116, incorrect_chars: 9, error_count: 1, created_at: '2026-11-05T18:25:00Z' },
    ];
    syncTelemetrySessionsFromBackend(accountAPractice, '14');

    let sessionsA = loadRawTelemetrySessions('14');
    assert.equal(sessionsA.length, 2);
    assert.equal(sessionsA[0].id, 'sess_a_40');

    // ---------------------------------------------------------
    // Phase 2: Account A logs out
    // ---------------------------------------------------------
    setLessonProgressUser(null);
    setArcadeStorageUser(null);
    resetGuestProgress();
    resetGuestArcadeRecords();

    assert.equal(getCurrentUserId(), null);
    let guestState = getLessonProgress();
    assert.deepEqual(guestState.lessons, {});

    // ---------------------------------------------------------
    // Phase 3: User 15 (Account B) logs in
    // ---------------------------------------------------------
    setLessonProgressUser('15');
    assert.equal(getCurrentUserId(), '15');

    // Account B has only 1 lesson completed with 1 star, 29 WPM
    const accountBSummary = {
      lessons: {
        'S1-L001': { completed: true, stars: 1, bestWpm: 29, bestAccuracy: 94, attempts: 1 },
      },
      stageProgress: { '1': 1, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0, '8': 0, '9': 0, '10': 0 },
      unlockedStages: [1],
      stageAccessTypes: { '1': 'guided_unlock' },
    };
    syncLessonProgressFromBackend(accountBSummary);

    let stateB = getLessonProgress();
    assert.equal(stateB.lessons['S1-L001'].completed, true);
    assert.equal(stateB.lessons['S1-L001'].stars, 1);
    assert.equal(stateB.lessons['S1-L001'].bestWpm, 29);
    // CRITICAL: Account B must NOT have Account A's S1-L002 or S1-L008!
    assert.equal(stateB.lessons['S1-L002'], undefined);
    assert.equal(stateB.lessons['S1-L008'], undefined);

    // Account B hydrates their distinct practice sessions
    const accountBPractice = [
      { id: 25, client_session_id: 'sess_b_25', session_type: 'timed', duration_seconds: 30, gross_wpm: 35, net_wpm: 30, accuracy: 90, total_chars: 175, correct_chars: 158, incorrect_chars: 17, error_count: 5, created_at: '2026-11-04T12:00:00Z' },
    ];
    syncTelemetrySessionsFromBackend(accountBPractice, '15');

    let sessionsB = loadRawTelemetrySessions('15');
    assert.equal(sessionsB.length, 1);
    assert.equal(sessionsB[0].id, 'sess_b_25');

    // ---------------------------------------------------------
    // Phase 4: Account B logs out
    // ---------------------------------------------------------
    setLessonProgressUser(null);
    setArcadeStorageUser(null);
    resetGuestProgress();
    resetGuestArcadeRecords();

    // ---------------------------------------------------------
    // Phase 5: Account A logs back in
    // ---------------------------------------------------------
    setLessonProgressUser('14');
    assert.equal(getCurrentUserId(), '14');

    // When Account A re-syncs from backend summary:
    syncLessonProgressFromBackend(accountASummary);

    let restoredStateA = getLessonProgress();
    // ALL 6 LESSONS AND 3 STARS FULLY RESTORED!
    assert.equal(restoredStateA.lessons['S1-L001'].completed, true);
    assert.equal(restoredStateA.lessons['S1-L001'].stars, 3);
    assert.equal(restoredStateA.lessons['S1-L001'].bestWpm, 55);
    assert.equal(restoredStateA.lessons['S1-L002'].completed, true);
    assert.equal(restoredStateA.lessons['S1-L002'].stars, 3);
    assert.equal(restoredStateA.lessons['S1-L008'].completed, true);
    assert.equal(restoredStateA.lessons['S1-L008'].stars, 3);
    assert.equal(restoredStateA.stageProgress['1'], 8);

    // Practice sessions re-hydrated
    syncTelemetrySessionsFromBackend(accountAPractice, '14');
    let restoredSessionsA = loadRawTelemetrySessions('14');
    assert.equal(restoredSessionsA.length, 2);
    assert.equal(restoredSessionsA[0].id, 'sess_a_40');
  });

  it('2. Clerk ID to Django ID aliasing guarantees zero divergence during offline fallback', () => {
    const clerkId = 'user_3LN4sX9cg3bUng1YzwiEB18Emh2';
    const djangoId = '14';

    // Store cross-index alias
    localStorage.setItem(`keyflow_user_alias_${clerkId}`, djangoId);

    // Simulate offline fallback where AuthContext falls back to clerkUser.id
    setLessonProgressUser(clerkId);

    // getCurrentUserId must resolve to canonical Django ID '14'
    assert.equal(getCurrentUserId(), '14');

    // Seed progress under canonical key
    recordLessonResult(1, 1, { wpm: 55, accuracy: 100, passed: true, stars: 3 });

    // Progress must be accessible under canonical state
    const progress = getLessonProgress();
    assert.equal(progress.lessons['S1-L001'].completed, true);
    assert.equal(progress.lessons['S1-L001'].stars, 3);

    // Verify localStorage key is canonical
    const canonicalRaw = localStorage.getItem(`keyflow_lesson_progress_u_${djangoId}`);
    assert.notEqual(canonicalRaw, null);
    const parsed = JSON.parse(canonicalRaw);
    assert.equal(parsed.lessons['S1-L001'].completed, true);
  });

  it('3. Telemetry Session Deduplication & Idempotency', () => {
    const serverSessions = [
      { id: 101, client_session_id: 'client_sess_1', duration_seconds: 30, gross_wpm: 60, net_wpm: 55, accuracy: 95, created_at: '2026-11-06T10:00:00Z' },
      { id: 102, client_session_id: 'client_sess_2', duration_seconds: 60, gross_wpm: 70, net_wpm: 68, accuracy: 98, created_at: '2026-11-06T10:05:00Z' },
    ];

    // First hydration
    syncTelemetrySessionsFromBackend(serverSessions, '14');
    let sessions = loadRawTelemetrySessions('14');
    assert.equal(sessions.length, 2);

    // Redundant re-hydration (e.g. page refresh or re-login)
    syncTelemetrySessionsFromBackend(serverSessions, '14');
    sessions = loadRawTelemetrySessions('14');
    // Must NOT duplicate sessions!
    assert.equal(sessions.length, 2);
  });

  it('4. Guest Migration Safety: Prevents cross-account re-migration', async () => {
    // Guest completes S1-L001
    setLessonProgressUser(null);
    localStorage.setItem('keyflow_lesson_progress_guest', JSON.stringify({
      lessons: {
        'S1-L001': { completed: true, bestWpm: 40, bestAccuracy: 95, stars: 2 },
      },
    }));

    const recordedA = [];
    const mockRecordA = async (payload) => {
      recordedA.push(payload);
    };

    // User A logs in -> migrates guest data
    await migrateGuestProgressToAccount('14', mockRecordA);
    assert.equal(recordedA.length, 1);
    assert.equal(recordedA[0].stage, 1);
    assert.equal(recordedA[0].lesson, 1);

    // Guest storage must now be cleaned up!
    const remainingGuest = localStorage.getItem('keyflow_lesson_progress_guest');
    assert.equal(remainingGuest, null);

    // User B logs in -> guest storage is empty, so User B receives ZERO migrated lessons
    const recordedB = [];
    const mockRecordB = async (payload) => {
      recordedB.push(payload);
    };
    await migrateGuestProgressToAccount('15', mockRecordB);
    assert.equal(recordedB.length, 0);
  });

  it('5. Authentic Star Preservation during backend sync', () => {
    setLessonProgressUser('14');

    const backendPayload = {
      lessons: {
        'S1-L001': { completed: true, stars: 3, bestWpm: 55, bestAccuracy: 100 },
        'S1-L002': { completed: true, stars: 2, bestWpm: 40, bestAccuracy: 92 },
        'S1-L003': { completed: true, stars: 5, bestWpm: 70, bestAccuracy: 100 },
      },
      stageProgress: { '1': 3, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0, '8': 0, '9': 0, '10': 0 },
      unlockedStages: [1, 2],
      stageAccessTypes: { '1': 'guided_unlock', '2': 'self_paced' },
    };

    syncLessonProgressFromBackend(backendPayload);

    const progress = getLessonProgress();
    assert.equal(progress.lessons['S1-L001'].stars, 3);
    assert.equal(progress.lessons['S1-L002'].stars, 2);
    assert.equal(progress.lessons['S1-L003'].stars, 5);
    assert.deepEqual(progress.unlockedStages, [1, 2]);
    assert.equal(progress.stageAccessTypes['2'], 'self_paced');
  });
});
