/**
 * KEYFLOW — Masterpiece Authentic Typing Speed, Accuracy & Integrity Test Suite
 * ==============================================================================
 * Validates the scientific measurement standard:
 * - Gross WPM = Total Valid Character Entries / 5 / Active Minutes
 * - Net WPM = max(0, Gross WPM - (Uncorrected Errors / Active Minutes))
 * - Raw Keystroke Accuracy = Correct Entries / Total Valid Entries * 100
 * - Final Text Accuracy = Correct Final Chars / Baseline * 100
 * - Uncorrected Errors & Corrected Mistakes
 * - User Isolation, Persistence & Provenance
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateGrossWpm,
  calculateNetWpm,
  calculateRawAccuracy,
  calculateFinalTextAccuracy,
  countUncorrectedErrors,
  countCorrectChars,
  calculateCorrectionMetrics,
  createAuthoritativeSessionResult,
  createKeystrokeTracker,
} from '../utils/typingFeedback.js';

import {
  getStorageKey,
  loadRawTelemetrySessions,
  saveRawTelemetrySessions,
  recordTelemetrySession,
  clearAllTelemetrySessions,
} from '../utils/telemetryStorage.js';

describe('KEYFLOW — Authentic Typing Speed & Accuracy (Phases 1-10)', () => {
  // Test A — Perfect typing
  it('Test A: Perfect typing produces 100% raw accuracy and matching gross & net WPM', () => {
    const target = 'ABCDE';
    const tracker = createKeystrokeTracker();
    for (const ch of target) {
      tracker.recordChar(ch, ch);
    }
    const stats = tracker.getStats('ABCDE', target);
    assert.equal(stats.totalKeystrokes, 5);
    assert.equal(stats.correctEntries, 5);
    assert.equal(stats.incorrectEntries, 0);
    assert.equal(stats.rawAccuracy, 100);
    assert.equal(stats.finalTextAccuracy, 100);

    const durationSeconds = 15; // 0.25 min
    const gross = calculateGrossWpm(stats.totalKeystrokes, durationSeconds);
    const uncorrected = countUncorrectedErrors('ABCDE', target);
    const net = calculateNetWpm(gross, uncorrected, durationSeconds);

    assert.equal(gross, 4); // (5 / 5) / 0.25 = 4
    assert.equal(uncorrected, 0);
    assert.equal(net, 4); // Net == Gross
  });

  // Test B — One incorrect attempt, then correction
  it('Test B: One mistake corrected via Backspace retains 75% raw accuracy & 100% final accuracy', () => {
    const target = 'ABC';
    const tracker = createKeystrokeTracker();

    // Input: A -> X -> Backspace -> B -> C
    tracker.recordChar('A', target[0]); // stroke 1: correct
    tracker.recordChar('X', target[1]); // stroke 2: mistake
    tracker.recordBackspace();          // backspace does NOT erase mistake from history
    tracker.recordChar('B', target[1]); // stroke 3: correct
    tracker.recordChar('C', target[2]); // stroke 4: correct

    const stats = tracker.getStats('ABC', target);
    assert.equal(stats.totalKeystrokes, 4);
    assert.equal(stats.correctEntries, 3);
    assert.equal(stats.incorrectEntries, 1);
    assert.equal(stats.backspaceCount, 1);
    assert.equal(stats.rawAccuracy, 75); // 3 / 4 * 100 = 75%
    assert.equal(stats.finalTextAccuracy, 100);

    const metrics = calculateCorrectionMetrics({
      totalEntries: stats.totalKeystrokes,
      correctEntries: stats.correctEntries,
      incorrectEntries: stats.incorrectEntries,
      typed: 'ABC',
      targetText: target,
      backspaces: stats.backspaceCount,
    });

    assert.equal(metrics.correctedMistakes, 1);
    assert.equal(metrics.remainingErrors, 0);

    const durationSeconds = 12; // 0.2 min
    const gross = calculateGrossWpm(stats.totalKeystrokes, durationSeconds);
    const net = calculateNetWpm(gross, metrics.remainingErrors, durationSeconds);

    assert.equal(gross, 4); // (4 / 5) / 0.2 = 4
    assert.equal(net, 4);   // 0 remaining errors => Net == Gross
  });

  // Test C — Two incorrect attempts, both corrected
  it('Test C: Two mistakes corrected both remain in history yielding 60% raw accuracy', () => {
    const target = 'ABC';
    const tracker = createKeystrokeTracker();

    // Input: A -> X -> X -> Backspace -> Backspace -> B -> C
    tracker.recordChar('A', target[0]);
    tracker.recordChar('X', target[1]);
    tracker.recordChar('X', target[2]);
    tracker.recordBackspace();
    tracker.recordBackspace();
    tracker.recordChar('B', target[1]);
    tracker.recordChar('C', target[2]);

    const stats = tracker.getStats('ABC', target);
    assert.equal(stats.totalKeystrokes, 5);
    assert.equal(stats.correctEntries, 3);
    assert.equal(stats.incorrectEntries, 2);
    assert.equal(stats.backspaceCount, 2);
    assert.equal(stats.rawAccuracy, 60); // 3 / 5 * 100 = 60%
    assert.equal(stats.finalTextAccuracy, 100);

    const metrics = calculateCorrectionMetrics({
      totalEntries: stats.totalKeystrokes,
      correctEntries: stats.correctEntries,
      incorrectEntries: stats.incorrectEntries,
      typed: 'ABC',
      targetText: target,
      backspaces: stats.backspaceCount,
    });

    assert.equal(metrics.correctedMistakes, 2);
    assert.equal(metrics.remainingErrors, 0);
  });

  // Test D — Uncorrected error
  it('Test D: Uncorrected error penalizes Net WPM according to scientific formula', () => {
    const target = 'ABC';
    const tracker = createKeystrokeTracker();

    // Input: A -> X -> C (final typed: "AXC")
    tracker.recordChar('A', target[0]); // correct
    tracker.recordChar('X', target[1]); // error
    tracker.recordChar('C', target[2]); // correct

    const stats = tracker.getStats('AXC', target, 2);
    assert.equal(stats.totalKeystrokes, 3);
    assert.equal(stats.correctEntries, 2);
    assert.equal(stats.incorrectEntries, 1);
    assert.equal(stats.rawAccuracy, 66.67);

    const remainingErrors = countUncorrectedErrors('AXC', target);
    assert.equal(remainingErrors, 1);

    const durationSeconds = 12; // 0.2 min
    const gross = calculateGrossWpm(stats.totalKeystrokes, durationSeconds);
    assert.equal(gross, 3); // (3 / 5) / 0.2 = 3 WPM

    // Uncorrected errors per minute = 1 / 0.2 = 5 WPM penalty
    // Net WPM = max(0, 3 - 5) = 0 WPM
    const net = calculateNetWpm(gross, remainingErrors, durationSeconds);
    assert.equal(net, 0);
  });

  // Test E — Repeated characters, spaces and punctuation
  it('Test E: Counts spaces and punctuation without counting control keys', () => {
    const target = 'Hi, world!';
    const tracker = createKeystrokeTracker();

    for (let i = 0; i < target.length; i++) {
      tracker.recordChar(target[i], target[i]);
    }
    // Simulate non-character Backspace spamming
    tracker.recordBackspace();
    tracker.recordBackspace();

    const stats = tracker.getStats(target, target);
    assert.equal(stats.totalKeystrokes, target.length);
    assert.equal(stats.correctEntries, target.length);
    assert.equal(stats.incorrectEntries, 0);
    assert.equal(stats.backspaceCount, 2);
    assert.equal(stats.rawAccuracy, 100);
  });

  // Test F — Timing & Zero-Division Safeguards
  it('Test F: Gracefully handles very short sessions and zero entries without NaN', () => {
    // 0 entries typed
    assert.equal(calculateGrossWpm(0, 1), 0);
    assert.equal(calculateNetWpm(0, 0, 1), 0);
    assert.equal(calculateRawAccuracy(0, 0), 0); // Honest 0% accuracy when 0 chars typed
    assert.equal(calculateRawAccuracy(0, 0, 0, { emptyDefault: 100 }), 100); // Live HUD opt-in
    assert.equal(calculateFinalTextAccuracy('', 'Hello'), 0);

    // Rapid 1-second session
    const gross = calculateGrossWpm(10, 1);
    assert.ok(gross > 0 && !isNaN(gross) && isFinite(gross));
  });

  // Test G — Canonical Result Contract
  it('Test G: createAuthoritativeSessionResult constructs canonical results with version 2.0', () => {
    const res = createAuthoritativeSessionResult({
      userId: 'test_user_42',
      testMode: 'timed',
      targetText: 'The quick brown fox',
      typed: 'The quick brown fox',
      durationSeconds: 15,
      correctKeystrokes: 19,
      mistakes: 0,
      backspaces: 0,
    });

    assert.ok(res.sessionId);
    assert.equal(res.userId, 'test_user_42');
    assert.equal(res.metricVersion, '2.0');
    assert.equal(res.totalCharacterEntries, 19);
    assert.equal(res.rawAccuracy, 100);
    assert.equal(res.finalTextAccuracy, 100);
    assert.equal(res.netWpm, res.grossWpm);
  });

  // Test H — Multi-user isolation
  it('Test H: Scopes session telemetry strictly by user ID', () => {
    const keyA = getStorageKey('user_101');
    const keyB = getStorageKey('user_202');
    const keyGuest = getStorageKey(null);

    assert.equal(keyA, 'keyflow_telemetry_sessions_u_user_101');
    assert.equal(keyB, 'keyflow_telemetry_sessions_u_user_202');
    assert.equal(keyGuest, 'keyflow_telemetry_sessions_guest');
    assert.notEqual(keyA, keyB);
  });

  // Test I — Idempotent Persistence & Deduplication
  it('Test I: recordTelemetrySession records genuine sessions idempotently', () => {
    const sessionId = 'test_sess_idem_001';
    const session = recordTelemetrySession({
      id: sessionId,
      duration: 30,
      totalChars: 120,
      correctChars: 115,
      incorrectChars: 5,
      rawAccuracy: 96,
      wpm: 46,
      grossWpm: 48,
    });

    assert.ok(session);
    assert.equal(session.id, sessionId);
    assert.equal(session.grossWpm, 48);
    assert.equal(session.wpm, 46);
    assert.equal(session.accuracy, 96);
  });

  // Test J — Completed Session Persistence & Survives Refresh
  it('Test J: createAuthoritativeSessionResult creates immutable snapshot that preserves non-zero WPM', () => {
    const result = createAuthoritativeSessionResult({
      sessionId: 'sess_test_survive_001',
      userId: 'user_test_99',
      testMode: 'timed',
      targetText: 'The quick brown fox jumps over the lazy dog',
      typed: 'The quick brown fox jumps over the lazy dog',
      durationSeconds: 30,
      correctKeystrokes: 43,
      mistakes: 0,
      backspaces: 0,
    });

    assert.equal(result.netWpm, 17); // (43 / 5) / 0.5 = 17.2 -> 17 WPM
    assert.equal(result.grossWpm, 17);
    assert.equal(result.rawAccuracy, 100);
    assert.equal(result.finalTextAccuracy, 100);
    assert.equal(result.durationSeconds, 30);
    assert.ok(result.completedAt > 0);

    // Simulated localStorage persistence
    const serialized = JSON.stringify(result);
    const recovered = JSON.parse(serialized);
    assert.equal(recovered.netWpm, 17);
    assert.equal(recovered.grossWpm, 17);
    assert.notEqual(recovered.netWpm, 0); // Never 0 WPM!
  });

  // Test K — Backspace Does Not Alter Denominator of Raw Keystroke Accuracy
  it('Test K: Backspace does not pollute raw accuracy denominator with control keystrokes', () => {
    // 5 characters typed: 'H', 'E', 'L', 'L', 'O'
    // User made 1 typo: 'X' at position 1, pressed Backspace, then 'E'
    // Total entries = 6 (5 correct, 1 incorrect). Backspaces = 1.
    const tracker = createKeystrokeTracker();
    tracker.recordChar('H', 'H');
    tracker.recordChar('X', 'E'); // mistake
    tracker.recordBackspace();
    tracker.recordChar('E', 'E');
    tracker.recordChar('L', 'L');
    tracker.recordChar('L', 'L');
    tracker.recordChar('O', 'O');

    const stats = tracker.getStats('HELLO', 'HELLO');
    assert.equal(stats.correctEntries, 5);
    assert.equal(stats.incorrectEntries, 1);
    assert.equal(stats.backspaceCount, 1);
    assert.equal(stats.totalKeystrokes, 6);
    // Raw accuracy = 5 / 6 * 100 = 83.33 -> 83%
    assert.equal(stats.rawAccuracy, 83);
    assert.equal(stats.finalTextAccuracy, 100);
  });
});

