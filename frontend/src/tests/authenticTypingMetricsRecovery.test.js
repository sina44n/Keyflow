/**
 * KEYFLOW — Complete Authentic Typing Performance Recovery Test Suite
 * ====================================================================
 * Comprehensive verification of:
 * - Gross WPM: totalValidEntries / 5 / activeTimeMinutes
 * - Net WPM: max(0, grossWpm - (uncorrectedErrors / activeTimeMinutes))
 * - Raw Keystroke Accuracy: (correctEntries / totalValidEntries) * 100
 * - Final Text Accuracy: (correctFinalChars / baseline) * 100
 * - Backspace non-erasure of historical mistakes
 * - Zero WPM Results Screen regression resolution
 * - Persistence & survival across page refresh
 * - Frontend and backend calculation consistency
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

describe('KEYFLOW — Authentic Typing Performance Recovery (Phases 1-14)', () => {
  // Phase 4A & 4B: Gross & Net WPM
  describe('Phase 4: Mathematically Correct WPM Calculation', () => {
    it('calculates gross WPM from 300 character entries over 2 minutes as exactly 30 WPM', () => {
      // 300 entries / 5 / 2 = 30 WPM
      const gross = calculateGrossWpm(300, 120);
      assert.equal(gross, 30);
    });

    it('calculates net WPM deducting uncorrected errors per active minute', () => {
      // 300 entries in 2 mins = 30 Gross WPM. 4 uncorrected errors = 2 errors/min penalty. Net = 28 WPM.
      const gross = calculateGrossWpm(300, 120);
      const net = calculateNetWpm(gross, 4, 120);
      assert.equal(net, 28);
    });

    it('clamps net WPM to 0 when penalties exceed gross WPM, never returning negative values', () => {
      const gross = calculateGrossWpm(50, 60); // 10 WPM
      const net = calculateNetWpm(gross, 20, 60); // 20 errors/min penalty => 10 - 20 = -10 -> 0
      assert.equal(net, 0);
    });

    it('safely handles zero duration without NaN or Infinity', () => {
      assert.equal(calculateGrossWpm(0, 0), 0);
      assert.equal(calculateNetWpm(0, 0, 0), 0);
    });
  });

  // Phase 5: Raw Accuracy vs Final Text Accuracy
  describe('Phase 5: Distinct Raw Keystroke Accuracy vs Final Text Accuracy', () => {
    it('retains mistake in raw accuracy even after correction via Backspace', () => {
      // Target: "hello"
      // User types: 'h', 'x', Backspace, 'e', 'l', 'l', 'o'
      const target = 'hello';
      const tracker = createKeystrokeTracker();
      tracker.recordChar('h', target[0]); // 1 correct
      tracker.recordChar('x', target[1]); // 1 mistake
      tracker.recordBackspace();          // 1 backspace
      tracker.recordChar('e', target[1]); // 2 correct
      tracker.recordChar('l', target[2]); // 3 correct
      tracker.recordChar('l', target[3]); // 4 correct
      tracker.recordChar('o', target[4]); // 5 correct

      const stats = tracker.getStats('hello', target, 2);
      assert.equal(stats.totalKeystrokes, 6);
      assert.equal(stats.correctEntries, 5);
      assert.equal(stats.incorrectEntries, 1);
      assert.equal(stats.backspaceCount, 1);
      // Raw Keystroke Accuracy = 5 / 6 * 100 = 83.33%
      assert.equal(stats.rawAccuracy, 83.33);
      // Final Text Accuracy = 100%
      assert.equal(stats.finalTextAccuracy, 100);
    });

    it('does not penalize corrected mistake again in Net WPM', () => {
      const target = 'hello';
      const tracker = createKeystrokeTracker();
      tracker.recordChar('h', target[0]);
      tracker.recordChar('x', target[1]);
      tracker.recordBackspace();
      tracker.recordChar('e', target[1]);
      tracker.recordChar('l', target[2]);
      tracker.recordChar('l', target[3]);
      tracker.recordChar('o', target[4]);

      const metrics = calculateCorrectionMetrics({
        totalEntries: 6,
        correctEntries: 5,
        incorrectEntries: 1,
        typed: 'hello',
        targetText: target,
        backspaces: 1,
      });

      assert.equal(metrics.remainingErrors, 0);
      assert.equal(metrics.correctedMistakes, 1);

      // 6 entries in 15 seconds (0.25 min) = (6 / 5) / 0.25 = 4.8 -> 5 Gross WPM
      const gross = calculateGrossWpm(6, 15);
      const net = calculateNetWpm(gross, metrics.remainingErrors, 15);
      assert.equal(net, gross); // Since remainingErrors is 0, Net == Gross
    });
  });

  // Phase 6 & 11D: Results Screen 0 WPM Regression Resolution
  describe('Phase 6 & 11D: Results Screen Non-Zero WPM Guarantee', () => {
    it('creates immutable session result with non-zero WPM for completed session', () => {
      const sessionSnapshot = createAuthoritativeSessionResult({
        sessionId: 'sess_verify_nonzero_001',
        userId: 'typist_alpha',
        testMode: 'passage',
        targetText: 'Typing is the art of translating thought into text without interruption.',
        typed: 'Typing is the art of translating thought into text without interruption.',
        durationSeconds: 20, // 0.333 min
        correctKeystrokes: 72,
        mistakes: 0,
        backspaces: 0,
      });

      // 72 entries / 5 / (20 / 60) = 14.4 / 0.333 = 43.2 -> 43 WPM
      assert.ok(sessionSnapshot.grossWpm > 40);
      assert.equal(sessionSnapshot.grossWpm, sessionSnapshot.netWpm);
      assert.equal(sessionSnapshot.rawAccuracy, 100);
      assert.equal(sessionSnapshot.finalTextAccuracy, 100);
      assert.equal(sessionSnapshot.remainingErrors, 0);
      assert.equal(sessionSnapshot.metricVersion, '2.0');
      assert.notEqual(sessionSnapshot.netWpm, 0); // NEVER 0 WPM
    });

    it('session snapshot survives JSON serialization and page refresh restoration', () => {
      const original = createAuthoritativeSessionResult({
        sessionId: 'sess_refresh_persist_101',
        userId: 'user_42',
        testMode: 'timed',
        targetText: 'Sample text passage for speed test',
        typed: 'Sample text passage for speed test',
        durationSeconds: 30,
        correctKeystrokes: 35,
        mistakes: 2,
        backspaces: 1,
      });

      // Simulated localStorage save & restore
      const jsonString = JSON.stringify(original);
      const restored = JSON.parse(jsonString);

      assert.equal(restored.sessionId, original.sessionId);
      assert.equal(restored.netWpm, original.netWpm);
      assert.equal(restored.grossWpm, original.grossWpm);
      assert.equal(restored.rawAccuracy, original.rawAccuracy);
      assert.equal(restored.correctKeystrokes, 35);
      assert.equal(restored.mistakes, 2);
      assert.notEqual(restored.netWpm, 0);
    });
  });

  // Phase 9 & 11E: Frontend / Backend Calculation Parity
  describe('Phase 9 & 11E: Frontend & Backend Calculation Consistency', () => {
    it('produces identical metrics between frontend formulas and backend formulas', () => {
      const durationSeconds = 45;
      const totalChars = 225;
      const correctChars = 220;
      const incorrectChars = 5;
      const errorCount = 1;

      // Frontend calculation
      const frontendGross = calculateGrossWpm(totalChars, durationSeconds);
      const frontendNet = calculateNetWpm(frontendGross, errorCount, durationSeconds);
      const frontendAcc = calculateRawAccuracy(correctChars, incorrectChars);

      // Backend logic mirror (from backend/practice/views.py)
      const minutes = durationSeconds / 60.0;
      const backendGross = Math.round((totalChars / 5.0) / minutes);
      const backendNet = Math.max(0, Math.round(backendGross - (errorCount / minutes)));
      const backendAcc = Math.round((correctChars / (correctChars + incorrectChars)) * 100);

      assert.equal(frontendGross, backendGross);
      assert.equal(frontendNet, backendNet);
      assert.equal(frontendAcc, backendAcc);
    });
  });
});
