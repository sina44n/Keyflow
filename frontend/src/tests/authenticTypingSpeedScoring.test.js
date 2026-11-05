/**
 * KEYFLOW — Authentic Typing Speed Scoring & Error Isolation Test Suite
 * ======================================================================
 * Validates the core product principle:
 * "KEYFLOW must honestly show users how fast they type and separately show how
 * accurately they type. Do not punish their displayed speed for making mistakes.
 * Accuracy communicates mistakes; speed communicates typing performance."
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
  createAuthoritativeSessionResult,
  createKeystrokeTracker,
  calculateConsistency,
} from '../utils/typingFeedback.js';

describe('KEYFLOW — Authentic Typing Speed Scoring & User Experience Suite', () => {
  // ── 1. Mandatory Section 8 Scenario Matrix ──────────────────────────────────
  describe('1. Mandatory Section 8 Scenario Matrix: Errors Never Penalize Primary WPM', () => {
    // 15 seconds test = 0.25 minutes. 55 WPM requires 55 * 5 * 0.25 = 68.75 ~ 69 keystrokes.
    const duration15Sec = 15;
    const totalEntries69 = 69; // (69 / 5) / 0.25 = 55.2 -> 55 WPM

    it('Scenario 1: 55 WPM, 0 errors -> Expected primary WPM: 55 WPM', () => {
      const correct = 69;
      const mistakes = 0;
      const gross = calculateGrossWpm(correct + mistakes, duration15Sec);
      assert.equal(gross, 55);

      const res = createAuthoritativeSessionResult({
        durationSeconds: duration15Sec,
        correctKeystrokes: correct,
        mistakes: mistakes,
        typed: 'a'.repeat(69),
        targetText: 'a'.repeat(69),
      });
      assert.equal(res.wpm, 55);
      assert.equal(res.grossWpm, 55);
      assert.equal(res.accuracy, 100);
    });

    it('Scenario 2: 55 WPM, 5 errors -> Expected primary WPM: 55 WPM', () => {
      const correct = 64;
      const mistakes = 5;
      const gross = calculateGrossWpm(correct + mistakes, duration15Sec);
      assert.equal(gross, 55);

      const res = createAuthoritativeSessionResult({
        durationSeconds: duration15Sec,
        correctKeystrokes: correct,
        mistakes: mistakes,
        typed: 'a'.repeat(64) + 'x'.repeat(5),
        targetText: 'a'.repeat(69),
      });
      assert.equal(res.wpm, 55);
      assert.equal(res.grossWpm, 55);
      // Accuracy is penalized: 64/69 = 92.75% -> 93%
      assert.equal(res.accuracy, 93);
    });

    it('Scenario 3: 55 WPM, 12 errors -> Expected primary WPM: 55 WPM', () => {
      const correct = 57;
      const mistakes = 12;
      const gross = calculateGrossWpm(correct + mistakes, duration15Sec);
      assert.equal(gross, 55);

      const res = createAuthoritativeSessionResult({
        durationSeconds: duration15Sec,
        correctKeystrokes: correct,
        mistakes: mistakes,
        typed: 'a'.repeat(57) + 'x'.repeat(12),
        targetText: 'a'.repeat(69),
      });
      assert.equal(res.wpm, 55);
      assert.equal(res.grossWpm, 55);
      // Accuracy is penalized: 57/69 = 82.6% -> 83%
      assert.equal(res.accuracy, 83);
    });

    it('Scenario 4: 55 WPM, 20 errors -> Expected primary WPM: 55 WPM', () => {
      const correct = 49;
      const mistakes = 20;
      const gross = calculateGrossWpm(correct + mistakes, duration15Sec);
      assert.equal(gross, 55);

      const res = createAuthoritativeSessionResult({
        durationSeconds: duration15Sec,
        correctKeystrokes: correct,
        mistakes: mistakes,
        typed: 'a'.repeat(49) + 'x'.repeat(20),
        targetText: 'a'.repeat(69),
      });
      assert.equal(res.wpm, 55);
      assert.equal(res.grossWpm, 55);
      // Accuracy: 49/69 = 71.01% -> 71%
      assert.equal(res.accuracy, 71);
    });

    it('Scenario 5: 40 WPM, 10 errors -> Expected primary WPM: 40 WPM', () => {
      // 40 WPM in 15 seconds = 40 * 5 * 0.25 = 50 keystrokes.
      const correct = 40;
      const mistakes = 10;
      const gross = calculateGrossWpm(correct + mistakes, duration15Sec);
      assert.equal(gross, 40);

      const res = createAuthoritativeSessionResult({
        durationSeconds: duration15Sec,
        correctKeystrokes: correct,
        mistakes: mistakes,
        typed: 'b'.repeat(40) + 'y'.repeat(10),
        targetText: 'b'.repeat(50),
      });
      assert.equal(res.wpm, 40);
      assert.equal(res.grossWpm, 40);
      assert.equal(res.accuracy, 80);
    });

    it('Scenario 6: 70 WPM, 0 errors -> Expected primary WPM: 70 WPM', () => {
      // 70 WPM in 15 seconds = 70 * 5 * 0.25 = 87.5 ~ 88 keystrokes.
      const correct = 88;
      const mistakes = 0;
      const gross = calculateGrossWpm(correct + mistakes, duration15Sec);
      assert.equal(gross, 70);

      const res = createAuthoritativeSessionResult({
        durationSeconds: duration15Sec,
        correctKeystrokes: correct,
        mistakes: mistakes,
        typed: 'c'.repeat(88),
        targetText: 'c'.repeat(88),
      });
      assert.equal(res.wpm, 70);
      assert.equal(res.grossWpm, 70);
      assert.equal(res.accuracy, 100);
    });

    it('Invariance Test: For identical keystrokes and duration, error count NEVER changes primary WPM', () => {
      const results = [0, 5, 12, 20, 35, 50].map((errs) => {
        const correct = Math.max(0, 69 - errs);
        return createAuthoritativeSessionResult({
          durationSeconds: 15,
          correctKeystrokes: correct,
          mistakes: errs,
          typed: 'a'.repeat(correct) + 'z'.repeat(errs),
          targetText: 'a'.repeat(69),
        }).wpm;
      });

      // Every single result must be exactly 55 WPM
      results.forEach((wpm) => assert.equal(wpm, 55));
    });
  });

  // ── 2. Final Text Accuracy Investigation & Resolution ───────────────────────
  describe('2. Final Text Accuracy & Character Breakdown Mathematical Consistency', () => {
    it('resolves the 3% bug: 57 correct and 12 uncorrected errors in a 2000-char passage produces 83%, NOT 3%', () => {
      const longPassage = 'A'.repeat(2000);
      const userTyped = 'A'.repeat(57) + 'B'.repeat(12); // 69 characters typed

      const acc = calculateFinalTextAccuracy(userTyped, longPassage);
      // 57 correct / 69 completed characters = 82.6% -> 83%
      assert.equal(acc, 83);
      assert.notEqual(acc, 3); // Guaranteed fix of the 3% bug!
    });

    it('returns 0% for empty typed string without fabricating 100% on incomplete test', () => {
      assert.equal(calculateFinalTextAccuracy('', 'The quick brown fox'), 0);
      assert.equal(calculateFinalTextAccuracy(null, 'The quick brown fox'), 0);
      assert.equal(calculateFinalTextAccuracy(undefined, 'The quick brown fox'), 0);
    });

    it('returns 100% when final typed characters completely match target positions', () => {
      const target = 'KEYFLOW precision typing platform';
      const typed = 'KEYFLOW'; // User typed partial target, all perfectly correct
      assert.equal(calculateFinalTextAccuracy(typed, target), 100);
    });

    it('correct / (correct + uncorrected) matches Final Text Accuracy perfectly', () => {
      const target = 'Hello world from the mechanical switch';
      const typed = 'Hello workd'; // indices 0-8 match ('Hello wor'), index 9 'k'!='l', index 10 'd'=='d' => 10 correct, 1 uncorrected
      const correct = countCorrectChars(typed, target);
      const uncorrected = countUncorrectedErrors(typed, target);

      assert.equal(correct, 10);
      assert.equal(uncorrected, 1);
      assert.equal(typed.length, correct + uncorrected);

      const expectedAcc = Math.round((10 / 11) * 100); // 90.9% -> 91%
      assert.equal(calculateFinalTextAccuracy(typed, target), expectedAcc);
    });
  });

  // ── 3. Backspace & Accuracy Independence ────────────────────────────────────
  describe('3. Backspaces and Two-Tier Accuracy Separation', () => {
    it('backspaces do not increase productive typing speed (gross WPM)', () => {
      const target = 'flow';
      const tracker = createKeystrokeTracker();

      tracker.recordChar('f', target[0]);
      tracker.recordChar('x', target[1]); // typo
      tracker.recordBackspace();          // backspace
      tracker.recordChar('l', target[1]); // correct
      tracker.recordChar('o', target[2]); // correct
      tracker.recordChar('w', target[3]); // correct

      const stats = tracker.getStats('flow', target);
      assert.equal(stats.backspaceCount, 1);
      assert.equal(stats.totalKeystrokes, 5); // 4 correct + 1 mistake. Backspace is not a productive character entry!

      // Duration = 10s. Gross WPM = (5 / 5) / (10 / 60) = 1 / 0.1667 = 6 WPM.
      const gross = calculateGrossWpm(stats.totalKeystrokes, 10);
      assert.equal(gross, 6);
    });

    it('raw accuracy retains historical mistake even after user backspaces and fixes it', () => {
      const target = 'abc';
      const tracker = createKeystrokeTracker();
      tracker.recordChar('a', target[0]);
      tracker.recordChar('x', target[1]);
      tracker.recordBackspace();
      tracker.recordChar('b', target[1]);
      tracker.recordChar('c', target[2]);

      const stats = tracker.getStats('abc', target);
      // Historical keystrokes: 3 correct + 1 typo = 4 attempts.
      // Raw accuracy: 3 / 4 = 75%.
      assert.equal(stats.rawAccuracy, 75);
      // Final buffer text: "abc" is 100% correct.
      assert.equal(stats.finalTextAccuracy, 100);
    });
  });

  // ── 4. Consistency & Timeline Safeguards ─────────────────────────────────────
  describe('4. Timeline Consistency & Graceful Sample Handling', () => {
    it('computes consistency from steady gross WPM samples accurately', () => {
      const samples = [55, 55, 55, 55, 55];
      const consistency = calculateConsistency(samples);
      assert.equal(consistency, 100);
    });

    it('computes realistic consistency for natural velocity variations', () => {
      const samples = [50, 52, 54, 53, 55];
      const consistency = calculateConsistency(samples);
      assert.ok(consistency >= 90 && consistency <= 99);
    });

    it('handles short tests with insufficient samples gracefully', () => {
      assert.equal(calculateConsistency([]), 0);
      assert.equal(calculateConsistency([55]), 100);
      assert.equal(calculateConsistency(null), 100);
    });
  });

  // ── 5. Session Snapshot Persistence & Reload Parity ──────────────────────────
  describe('5. Session Snapshot Persistence & Idempotency', () => {
    it('preserves authentic gross WPM through serialization and restoration', () => {
      const original = createAuthoritativeSessionResult({
        sessionId: 'sess_auth_speed_001',
        userId: 'pilot_user',
        testMode: 'timed',
        durationSeconds: 15,
        correctKeystrokes: 57,
        mistakes: 12,
        typed: 'A'.repeat(57) + 'X'.repeat(12),
        targetText: 'A'.repeat(69),
      });

      assert.equal(original.wpm, 55);
      assert.equal(original.grossWpm, 55);
      assert.equal(original.accuracy, 83);
      assert.equal(original.finalTextAccuracy, 83);

      const serialized = JSON.stringify(original);
      const restored = JSON.parse(serialized);

      assert.equal(restored.wpm, 55);
      assert.equal(restored.grossWpm, 55);
      assert.equal(restored.accuracy, 83);
      assert.equal(restored.finalTextAccuracy, 83);
    });
  });
});
