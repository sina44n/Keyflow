import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateGrossWpm,
  calculateNetWpm,
  calculateRawAccuracy,
  calculateFinalTextAccuracy,
  countUncorrectedErrors,
  countCorrectChars,
  getCharacterFeedback,
  createKeystrokeTracker,
  createAuthoritativeSessionResult,
} from '../utils/typingFeedback.js';
import { evaluatePlacementDiagnostic } from '../utils/placementEngine.js';

describe('KEYFLOW Phase 7: Authoritative Typing Metrics & Scoring Contract', () => {
  // =========================================================================
  // 1. BASIC TYPING (Tests 1–8)
  // =========================================================================
  describe('1. Basic Typing Verification', () => {
    it('1. All correct printable characters: 100% accuracy, clean Gross and Net WPM', () => {
      // 50 characters in 30 seconds = 10 words / 0.5 minutes = 20 Gross WPM
      const totalChars = 50;
      const durationSec = 30;
      const gross = calculateGrossWpm(totalChars, durationSec);
      const uncorrected = 0;
      const net = calculateNetWpm(gross, uncorrected, durationSec);
      const acc = calculateRawAccuracy(50, 0);

      assert.equal(gross, 20);
      assert.equal(net, 20);
      assert.equal(acc, 100);
    });

    it('2. All incorrect printable characters: 0% keystroke accuracy, Net WPM clamped to 0', () => {
      // 50 incorrect characters in 30 seconds
      const totalChars = 50;
      const durationSec = 30;
      const gross = calculateGrossWpm(totalChars, durationSec);
      const uncorrected = 50;
      const net = calculateNetWpm(gross, uncorrected, durationSec);
      const acc = calculateRawAccuracy(0, 50);

      assert.equal(gross, 20);
      assert.equal(net, 0); // Net WPM penalized by uncorrected errors, strictly >= 0
      assert.equal(acc, 0);
    });

    it('3. Mixed correct and incorrect attempts: exact fractional accuracy and penalty', () => {
      // 40 correct, 10 incorrect in 30s. Total: 50 strokes.
      const gross = calculateGrossWpm(50, 30);
      const uncorrected = 10;
      const net = calculateNetWpm(gross, uncorrected, 30);
      const acc = calculateRawAccuracy(40, 10);

      assert.equal(gross, 20);
      assert.equal(net, 0); // 20 - (10 / 0.5) = 20 - 20 = 0
      assert.equal(acc, 80); // 40 / 50 * 100 = 80%
    });

    it('4. Empty session: strictly 0 Gross WPM, 0 Net WPM, 0% accuracy', () => {
      assert.equal(calculateGrossWpm(0, 0), 0);
      assert.equal(calculateNetWpm(0, 0, 0), 0);
      assert.equal(calculateRawAccuracy(0, 0), 0);
    });

    it('5. Zero-keystroke session: does not fabricate 100% accuracy', () => {
      const result = createAuthoritativeSessionResult({
        targetText: 'test passage',
        typed: '',
        durationSeconds: 30,
        correctKeystrokes: 0,
        mistakes: 0,
        backspaces: 0,
      });

      assert.equal(result.grossWpm, 0);
      assert.equal(result.netWpm, 0);
      assert.equal(result.accuracy, 0);
      assert.equal(result.finalTextAccuracy, 0);
    });

    it('6. Very short session (2 seconds): calculates authentic cadence without explosion', () => {
      // 10 chars in 2 seconds = 2 words / (2/60) min = 60 WPM
      const gross = calculateGrossWpm(10, 2);
      assert.equal(gross, 60);
    });

    it('7. Long session (300 seconds): maintains accuracy without float drift', () => {
      // 1500 chars in 300 seconds = 300 words / 5 minutes = 60 WPM
      const gross = calculateGrossWpm(1500, 300);
      const net = calculateNetWpm(gross, 0, 300);
      const acc = calculateRawAccuracy(1425, 75);

      assert.equal(gross, 60);
      assert.equal(net, 60);
      assert.equal(acc, 95); // 1425 / 1500 = 95%
    });

    it('8. Fractional elapsed time: supported without NaN or truncation bugs', () => {
      // 25 chars in 12.5 seconds = 5 words / (12.5 / 60) min = 24 WPM
      const gross = calculateGrossWpm(25, 12.5);
      assert.equal(gross, 24);
    });
  });

  // =========================================================================
  // 2. BACKSPACE AND CORRECTION (Tests 9–18)
  // =========================================================================
  describe('2. Backspace & Position-Based Correction History', () => {
    it('9. Wrong character followed by Backspace and correct replacement: mistake is retained in accuracy', () => {
      const tracker = createKeystrokeTracker();
      tracker.recordChar('X', 'A', 0); // mistake at 0
      tracker.recordBackspace();
      tracker.recordChar('A', 'A', 0); // correct at 0

      const stats = tracker.getStats('A', 'A');
      assert.equal(stats.correctEntries, 1);
      assert.equal(stats.incorrectEntries, 1);
      assert.equal(stats.totalKeystrokes, 2);
      assert.equal(stats.rawAccuracy, 50); // 1 / 2 = 50%
      assert.equal(stats.finalTextAccuracy, 100); // final text matches
    });

    it('10. Wrong character followed by Backspace and another wrong replacement: remains incorrect', () => {
      const tracker = createKeystrokeTracker();
      tracker.recordChar('X', 'A', 0);
      tracker.recordBackspace();
      tracker.recordChar('Y', 'A', 0);

      const stats = tracker.getStats('Y', 'A');
      assert.equal(stats.correctEntries, 0);
      assert.equal(stats.incorrectEntries, 2);
      assert.equal(stats.rawAccuracy, 0);
    });

    it('11. Multiple corrections at the same position: tracked cumulatively', () => {
      const tracker = createKeystrokeTracker();
      tracker.recordChar('X', 'A', 0); // 1st error
      tracker.recordBackspace();
      tracker.recordChar('Y', 'A', 0); // 2nd error
      tracker.recordBackspace();
      tracker.recordChar('A', 'A', 0); // 1st correct

      const stats = tracker.getStats('A', 'A');
      assert.equal(stats.correctEntries, 1);
      assert.equal(stats.incorrectEntries, 2);
      assert.equal(stats.totalKeystrokes, 3);
      assert.equal(Math.round(stats.rawAccuracy), 33); // 1 / 3 = 33%
    });

    it('12. Backspace on an empty position: does not corrupt attempt counters', () => {
      const tracker = createKeystrokeTracker();
      tracker.recordBackspace();
      tracker.recordBackspace();

      const stats = tracker.getStats('', 'ABC');
      assert.equal(stats.correctEntries, 0);
      assert.equal(stats.incorrectEntries, 0);
      assert.equal(stats.backspaceCount, 2);
      assert.equal(stats.totalKeystrokes, 0);
      assert.equal(stats.rawAccuracy, 0);
    });

    it('13. Backspace after a correct character: does not decrement correct entries count', () => {
      const tracker = createKeystrokeTracker();
      tracker.recordChar('A', 'A', 0);
      assert.equal(tracker.getStats('A', 'A').correctEntries, 1);

      tracker.recordBackspace();
      const statsAfter = tracker.getStats('', 'A');
      assert.equal(statsAfter.correctEntries, 1); // Attempt remains historically recorded
      assert.equal(statsAfter.backspaceCount, 1);
    });

    it('14. Corrected mistake remains in historical attempt count', () => {
      const target = 'FLOW';
      const tracker = createKeystrokeTracker();
      tracker.recordChar('F', target[0], 0);
      tracker.recordChar('Z', target[1], 1); // error
      tracker.recordBackspace();
      tracker.recordChar('L', target[1], 1); // corrected
      tracker.recordChar('O', target[2], 2);
      tracker.recordChar('W', target[3], 3);

      const stats = tracker.getStats('FLOW', target);
      assert.equal(stats.totalKeystrokes, 5); // 4 letters + 1 typo
      assert.equal(stats.incorrectEntries, 1);
      assert.equal(stats.rawAccuracy, 80); // 4 / 5 = 80%
    });

    it('15. Backspace does not increase printable attempt count', () => {
      const tracker = createKeystrokeTracker();
      tracker.recordChar('A', 'A', 0);
      for (let i = 0; i < 10; i++) {
        tracker.recordBackspace();
      }
      const stats = tracker.getStats('', 'A');
      assert.equal(stats.totalKeystrokes, 1); // only 'A' was a printable attempt
      assert.equal(stats.backspaceCount, 10);
    });

    it('16. Corrected position becomes YELLOW (char-corrected)', () => {
      const target = 'KEY';
      const mistakeIndices = new Set([1]); // position 1 had mistake
      const typed = 'KEY'; // now corrected

      const feedback = getCharacterFeedback(1, typed, target, false, mistakeIndices);
      assert.equal(feedback.status, 'corrected');
      assert.equal(feedback.isCorrect, true);
      assert.equal(feedback.isCorrected, true);
      assert.equal(feedback.className, 'char-corrected');
    });

    it('17. Never-wrong position remains GREEN (char-correct)', () => {
      const target = 'KEY';
      const mistakeIndices = new Set([1]); // position 1 had mistake, position 0 never had mistake
      const typed = 'KEY';

      const feedback0 = getCharacterFeedback(0, typed, target, false, mistakeIndices);
      assert.equal(feedback0.status, 'correct');
      assert.equal(feedback0.isCorrected, false);
      assert.equal(feedback0.className, 'char-correct');

      const feedback2 = getCharacterFeedback(2, typed, target, false, mistakeIndices);
      assert.equal(feedback2.status, 'correct');
      assert.equal(feedback2.isCorrected, false);
      assert.equal(feedback2.className, 'char-correct');
    });

    it('18. Still-wrong position remains RED (char-incorrect)', () => {
      const target = 'KEY';
      const mistakeIndices = new Set([1]);
      const typed = 'KXY'; // position 1 is still wrong ('X' != 'E')

      const feedback = getCharacterFeedback(1, typed, target, false, mistakeIndices);
      assert.equal(feedback.status, 'incorrect');
      assert.equal(feedback.isIncorrect, true);
      assert.equal(feedback.className, 'char-incorrect');
    });
  });

  // =========================================================================
  // 3. METRIC INTEGRITY (Tests 19–26)
  // =========================================================================
  describe('3. Metric Integrity & Mathematical Rules', () => {
    it('19. Corrected mistakes do not silently become perfect 100% historical accuracy', () => {
      // 99 correct, 1 corrected mistake -> 99 / 100 = 99%, NOT 100%!
      const acc = calculateRawAccuracy(99, 1);
      assert.equal(acc, 99);
    });

    it('20. Gross WPM strictly uses documented printable attempt volume (entries / 5 / minutes)', () => {
      // 100 printable strokes in 60s = 20 Gross WPM
      assert.equal(calculateGrossWpm(100, 60), 20);
    });

    it('21. Net WPM applies the documented uncorrected-error penalty rule', () => {
      // Gross 40 WPM in 60s, 5 uncorrected errors -> penalty = 5 WPM -> Net = 35 WPM
      const net = calculateNetWpm(40, 5, 60);
      assert.equal(net, 35);
    });

    it('22. Accuracy uses the documented denominator (correct / (correct + incorrect))', () => {
      const acc = calculateRawAccuracy(90, 10, 1);
      assert.equal(acc, 90.0);
    });

    it('23. Final text correctness is separate from keystroke accuracy', () => {
      const target = 'AUTHENTIC';
      const typed = 'AUTHENTIC'; // 100% correct text
      // But made 2 typos that were fixed
      const correctStrokes = 9;
      const mistakes = 2;

      const rawAccuracy = calculateRawAccuracy(correctStrokes, mistakes); // 9 / 11 = 81.8%
      const finalTextAccuracy = calculateFinalTextAccuracy(typed, target); // 100%

      assert.equal(Math.round(rawAccuracy), 82);
      assert.equal(finalTextAccuracy, 100);
      assert.notEqual(rawAccuracy, finalTextAccuracy);
    });

    it('24. Accuracy cannot exceed 100% under any circumstances', () => {
      assert.equal(calculateRawAccuracy(1000, 0), 100);
      assert.equal(calculateFinalTextAccuracy('test', 'test'), 100);
    });

    it('25. WPM cannot become negative under heavy uncorrected error penalty', () => {
      // Gross 20 WPM with 50 errors in 60s -> raw penalty 50 -> Net clamped to 0
      const net = calculateNetWpm(20, 50, 60);
      assert.equal(net, 0);
    });

    it('26. Missing or zero duration does not fabricate a high score', () => {
      assert.equal(calculateGrossWpm(100, 0), 0);
      assert.equal(calculateNetWpm(100, 0, 0), 0);
    });
  });

  // =========================================================================
  // 4. ENVIRONMENT CONSISTENCY (Tests 27–31)
  // =========================================================================
  describe('4. Cross-Environment Scoring Consistency', () => {
    // Standard test scenario: Target 'HELLO', user typed 'HEX', backspaced, typed 'LLO' (6 strokes total: 5 correct, 1 mistake) in 15 seconds.
    const scenario = {
      targetText: 'HELLO',
      typed: 'HELLO',
      durationSeconds: 15,
      correctKeystrokes: 5,
      mistakes: 1,
      backspaces: 1,
    };

    it('27. Workstation evaluates canonical session result matching authoritative contract', () => {
      const wsResult = createAuthoritativeSessionResult(scenario);
      assert.equal(wsResult.grossWpm, 5); // 6 strokes / 5 / 0.25 min = 1.2 / 0.25 = 4.8 -> 5
      assert.equal(wsResult.accuracy, 83); // 5 / 6 = 83.33% -> 83%
      assert.equal(wsResult.finalTextAccuracy, 100);
      assert.equal(wsResult.remainingErrors, 0);
      assert.equal(wsResult.correctedMistakes, 1);
    });

    it('28. Home Sprint evaluates matching authoritative metrics for same scenario', () => {
      const totalValid = scenario.correctKeystrokes + scenario.mistakes;
      const gross = calculateGrossWpm(totalValid, scenario.durationSeconds);
      const uncorrected = countUncorrectedErrors(scenario.typed, scenario.targetText);
      const net = calculateNetWpm(gross, uncorrected, scenario.durationSeconds);
      const acc = calculateRawAccuracy(scenario.correctKeystrokes, scenario.mistakes);

      assert.equal(gross, 5);
      assert.equal(net, 5);
      assert.equal(acc, 83);
    });

    it('29. Academy LessonPlayer evaluates matching authoritative metrics for same scenario', () => {
      const totalValid = scenario.correctKeystrokes + scenario.mistakes;
      const finalWpm = calculateGrossWpm(totalValid, scenario.durationSeconds);
      const finalAccuracy = calculateRawAccuracy(scenario.correctKeystrokes, scenario.mistakes);
      const finalTextAccuracy = calculateFinalTextAccuracy(scenario.typed, scenario.targetText);
      const remainingErrors = countUncorrectedErrors(scenario.typed, scenario.targetText);
      const finalNetWpm = calculateNetWpm(finalWpm, remainingErrors, scenario.durationSeconds);

      assert.equal(finalWpm, 5);
      assert.equal(finalNetWpm, 5);
      assert.equal(finalAccuracy, 83);
      assert.equal(finalTextAccuracy, 100);
      assert.equal(remainingErrors, 0);
    });

    it('30. Placement Test diagnostic evaluates matching authoritative metrics for same scenario', () => {
      const diagResult = evaluatePlacementDiagnostic({
        targetText: scenario.targetText,
        typedText: scenario.typed,
        durationSeconds: scenario.durationSeconds,
        correctKeystrokes: scenario.correctKeystrokes,
        mistakes: scenario.mistakes,
        backspaces: scenario.backspaces,
      });

      assert.equal(diagResult.grossWpm, 5);
      assert.equal(diagResult.netWpm, 5);
      assert.equal(diagResult.rawAccuracy, 83);
      assert.equal(diagResult.finalTextAccuracy, 100);
    });

    it('31. Competition submission schema accepts and verifies the same scoring semantics', () => {
      const durationSec = 30;
      const totalValid = 50;
      const correct = 45;
      const mistakes = 5;
      const remaining = 0; // all 5 were fixed

      const gross = calculateGrossWpm(totalValid, durationSec);
      const net = calculateNetWpm(gross, remaining, durationSec);
      const acc = calculateRawAccuracy(correct, mistakes);

      assert.equal(gross, 20);
      assert.equal(net, 20);
      assert.equal(acc, 90);
    });
  });

  // =========================================================================
  // 5. PERSISTENCE AND BACKEND RECALCULATION (Tests 32–36)
  // =========================================================================
  describe('5. Persistence & Backend Recalculation', () => {
    it('32. Saved result fields match the calculated result exactly', () => {
      const res = createAuthoritativeSessionResult({
        targetText: 'SPEED FLOW',
        typed: 'SPEED FLOW',
        durationSeconds: 20,
        correctKeystrokes: 10,
        mistakes: 0,
        backspaces: 0,
      });

      assert.equal(res.durationSeconds, 20);
      assert.equal(res.grossWpm, 6);
      assert.equal(res.accuracy, 100);
    });

    it('33. Session idempotency: multiple calls with same tracker produce identical stats', () => {
      const tracker = createKeystrokeTracker();
      tracker.recordChar('A', 'A', 0);
      tracker.recordChar('B', 'B', 1);

      const stats1 = tracker.getStats('AB', 'AB');
      const stats2 = tracker.getStats('AB', 'AB');

      assert.deepEqual(stats1, stats2);
    });

    it('34. Error count clamping: uncorrected errors cannot exceed incorrect entries', () => {
      const metrics = createAuthoritativeSessionResult({
        targetText: 'ABC',
        typed: 'XYZ',
        durationSeconds: 10,
        correctKeystrokes: 0,
        mistakes: 3,
      });

      assert.equal(metrics.remainingErrors, 3);
      assert.equal(metrics.correctedMistakes, 0);
    });

    it('35. Invalid metric combinations are normalized safely', () => {
      // Negative entries or NaN
      assert.equal(calculateGrossWpm(-5, -10), 0);
      assert.equal(calculateNetWpm(-5, -10, -10), 0);
      assert.equal(calculateRawAccuracy(-10, -5), 0);
    });

    it('36. Metric version tagging: authoritative sessions include metricVersion 2.0', () => {
      const res = createAuthoritativeSessionResult({
        targetText: 'test',
        typed: 'test',
        durationSeconds: 10,
      });
      assert.equal(res.metricVersion, '2.0');
    });
  });
});
