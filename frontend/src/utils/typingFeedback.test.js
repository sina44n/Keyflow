import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getCharacterFeedback,
  countCorrectChars,
  calculateRawAccuracy,
  calculateFinalTextAccuracy,
  createKeystrokeTracker,
} from './typingFeedback.js';

describe('Typing Accuracy & Backspace Tracking System (5 Core Specifications)', () => {
  it('Test 1: ABC typed cleanly produces 100% raw and final accuracy', () => {
    const target = 'ABC';
    const tracker = createKeystrokeTracker();

    // Type 'A'
    assert.equal(tracker.recordChar('A', target[0]), true);
    // Type 'B'
    assert.equal(tracker.recordChar('B', target[1]), true);
    // Type 'C'
    assert.equal(tracker.recordChar('C', target[2]), true);

    const stats = tracker.getStats('ABC', target);
    assert.equal(stats.correctEntries, 3);
    assert.equal(stats.incorrectEntries, 0);
    assert.equal(stats.rawAccuracy, 100);
    assert.equal(stats.finalTextAccuracy, 100);
  });

  it('Test 2: AXC + Backspace + B produces 75% raw keystroke accuracy (3 correct / 4 attempts)', () => {
    const target = 'ABC';
    const tracker = createKeystrokeTracker();

    // User types 'A' (correct, stroke 1)
    tracker.recordChar('A', target[0]);
    // User types 'X' (incorrect error, stroke 2)
    tracker.recordChar('X', target[1]);
    // User backspaces 'X'
    tracker.recordBackspace();
    // User types 'B' (correct, stroke 3)
    tracker.recordChar('B', target[1]);
    // User types 'C' (correct, stroke 4)
    tracker.recordChar('C', target[2]);

    const stats = tracker.getStats('ABC', target);
    assert.equal(stats.correctEntries, 3);
    assert.equal(stats.incorrectEntries, 1);
    assert.equal(stats.totalKeystrokes, 4);
    assert.equal(stats.rawAccuracy, 75); // 3 / 4 * 100 = 75%
    assert.equal(stats.finalTextAccuracy, 100); // final text "ABC" is 100% correct
  });

  it('Test 3: HEXLLO + Backspace + HELLO produces 83.33% raw keystroke accuracy (5/6)', () => {
    const target = 'HELLO';
    const tracker = createKeystrokeTracker();

    // 'H' (correct 1)
    tracker.recordChar('H', target[0]);
    // 'E' (correct 2)
    tracker.recordChar('E', target[1]);
    // 'X' (incorrect 1)
    tracker.recordChar('X', target[2]);
    // Backspace 'X'
    tracker.recordBackspace();
    // 'L' (correct 3)
    tracker.recordChar('L', target[2]);
    // 'L' (correct 4)
    tracker.recordChar('L', target[3]);
    // 'O' (correct 5)
    tracker.recordChar('O', target[4]);

    const stats = tracker.getStats('HELLO', target, 2);
    assert.equal(stats.correctEntries, 5);
    assert.equal(stats.incorrectEntries, 1);
    assert.equal(stats.totalKeystrokes, 6);
    assert.equal(stats.rawAccuracy, 83.33); // 5 / 6 * 100 = 83.33%
    assert.equal(calculateRawAccuracy(5, 1, 0), 83); // Integer rounded: 83%
    assert.equal(stats.finalTextAccuracy, 100);
  });

  it('Test 4: AXX + 2 Backspaces + BC produces 60% raw keystroke accuracy (3/5)', () => {
    const target = 'ABC';
    const tracker = createKeystrokeTracker();

    // 'A' (correct 1)
    tracker.recordChar('A', target[0]);
    // 'X' (incorrect 1)
    tracker.recordChar('X', target[1]);
    // 'X' (incorrect 2)
    tracker.recordChar('X', target[2]);
    // 2 Backspaces
    tracker.recordBackspace();
    tracker.recordBackspace();
    // 'B' (correct 2)
    tracker.recordChar('B', target[1]);
    // 'C' (correct 3)
    tracker.recordChar('C', target[2]);

    const stats = tracker.getStats('ABC', target);
    assert.equal(stats.correctEntries, 3);
    assert.equal(stats.incorrectEntries, 2);
    assert.equal(stats.totalKeystrokes, 5);
    assert.equal(stats.rawAccuracy, 60); // 3 / 5 * 100 = 60%
    assert.equal(stats.finalTextAccuracy, 100);
  });

  it('Test 5: Backspace spamming does not alter error count or create fake correct entries', () => {
    const target = 'ABC';
    const tracker = createKeystrokeTracker();

    // Start with Test 4 state: 'A', 'X', 'X'
    tracker.recordChar('A', target[0]);
    tracker.recordChar('X', target[1]);
    tracker.recordChar('X', target[2]);

    // Spam Backspace 15 times
    for (let i = 0; i < 15; i++) {
      tracker.recordBackspace();
    }

    // Finish typing 'B' and 'C'
    tracker.recordChar('B', target[1]);
    tracker.recordChar('C', target[2]);

    // Additional 10 Backspaces at the end
    for (let i = 0; i < 10; i++) {
      tracker.recordBackspace();
    }

    const stats = tracker.getStats('ABC', target);
    assert.equal(stats.correctEntries, 3);
    assert.equal(stats.incorrectEntries, 2);
    assert.equal(stats.totalKeystrokes, 5);
    assert.equal(stats.rawAccuracy, 60);
    assert.equal(stats.backspaceCount, 25);
  });
});

describe('Live Character Color Feedback Logic', () => {
  it('identifies correct characters and assigns char-correct', () => {
    const target = 'Hello World';
    const typed = 'Hel';

    const char0 = getCharacterFeedback(0, typed, target);
    assert.equal(char0.status, 'correct');
    assert.equal(char0.isCorrect, true);
    assert.equal(char0.isIncorrect, false);
    assert.equal(char0.className, 'char-correct');

    const char1 = getCharacterFeedback(1, typed, target);
    assert.equal(char1.status, 'correct');
    assert.equal(char1.isCorrect, true);
    assert.equal(char1.className, 'char-correct');

    const char2 = getCharacterFeedback(2, typed, target);
    assert.equal(char2.status, 'correct');
    assert.equal(char2.isCorrect, true);
    assert.equal(char2.className, 'char-correct');
  });

  it('identifies incorrect characters and assigns char-incorrect', () => {
    const target = 'Hello World';
    const typed = 'Hxl';

    const char0 = getCharacterFeedback(0, typed, target);
    assert.equal(char0.isCorrect, true);
    assert.equal(char0.className, 'char-correct');

    const char1 = getCharacterFeedback(1, typed, target);
    assert.equal(char1.status, 'incorrect');
    assert.equal(char1.isCorrect, false);
    assert.equal(char1.isIncorrect, true);
    assert.equal(char1.className, 'char-incorrect');

    const char2 = getCharacterFeedback(2, typed, target);
    assert.equal(char2.isCorrect, true);
    assert.equal(char2.className, 'char-correct');
  });

  it('identifies untouched/not-yet-typed characters and assigns char-untyped', () => {
    const target = 'Hello World';
    const typed = 'He';

    // Index 3 and beyond are not yet typed
    const char3 = getCharacterFeedback(3, typed, target);
    assert.equal(char3.status, 'untyped');
    assert.equal(char3.isTyped, false);
    assert.equal(char3.isCurrent, false);
    assert.equal(char3.className, 'char-untyped');

    const char5 = getCharacterFeedback(5, typed, target);
    assert.equal(char5.status, 'untyped');
    assert.equal(char5.className, 'char-untyped');
  });

  it('identifies current character at cursor position and assigns char-current', () => {
    const target = 'Hello World';
    const typed = 'He';

    // Index 2 is the next expected character (cursor position)
    const char2 = getCharacterFeedback(2, typed, target, false);
    assert.equal(char2.status, 'current');
    assert.equal(char2.isCurrent, true);
    assert.equal(char2.isTyped, false);
    assert.equal(char2.className, 'char-current');

    // When completed, cursor indicator is not active
    const charCompleted = getCharacterFeedback(2, typed, target, true);
    assert.equal(charCompleted.status, 'untyped');
    assert.equal(charCompleted.isCurrent, false);
  });

  it('preserves previous character colors as typing continues', () => {
    const target = 'Keyboard';

    // Step 1: User types 'K' (correct)
    let typed = 'K';
    assert.equal(getCharacterFeedback(0, typed, target).className, 'char-correct');

    // Step 2: User types 'e' (correct)
    typed = 'Ke';
    assert.equal(getCharacterFeedback(0, typed, target).className, 'char-correct');
    assert.equal(getCharacterFeedback(1, typed, target).className, 'char-correct');

    // Step 3: User types 'x' instead of 'y' (incorrect)
    typed = 'Kex';
    assert.equal(getCharacterFeedback(0, typed, target).className, 'char-correct');
    assert.equal(getCharacterFeedback(1, typed, target).className, 'char-correct');
    assert.equal(getCharacterFeedback(2, typed, target).className, 'char-incorrect');

    // Step 4: User continues typing 'b' (correct)
    typed = 'Kexb';
    assert.equal(getCharacterFeedback(0, typed, target).className, 'char-correct');
    assert.equal(getCharacterFeedback(1, typed, target).className, 'char-correct');
    assert.equal(getCharacterFeedback(2, typed, target).className, 'char-incorrect');
    assert.equal(getCharacterFeedback(3, typed, target).className, 'char-correct');
  });

  it('correctly handles spaces', () => {
    const target = 'quick fox';

    // Correct space at index 5
    const typedCorrectSpace = 'quick ';
    const spaceFeedback = getCharacterFeedback(5, typedCorrectSpace, target);
    assert.equal(spaceFeedback.isCorrect, true);
    assert.equal(spaceFeedback.className, 'char-correct');

    // Incorrect character where space was expected
    const typedIncorrectSpace = 'quickx';
    const wrongSpaceFeedback = getCharacterFeedback(5, typedIncorrectSpace, target);
    assert.equal(wrongSpaceFeedback.isIncorrect, true);
    assert.equal(wrongSpaceFeedback.className, 'char-incorrect');

    // Space typed where letter was expected
    const typedSpaceInsteadOfLetter = ' ';
    const wrongLetterFeedback = getCharacterFeedback(0, typedSpaceInsteadOfLetter, target);
    assert.equal(wrongLetterFeedback.isIncorrect, true);
    assert.equal(wrongLetterFeedback.className, 'char-incorrect');
  });

  it('correctly handles punctuation', () => {
    const target = 'Ready, set; go! "Yes."';

    // Comma check
    const typedWithComma = 'Ready,';
    assert.equal(getCharacterFeedback(5, typedWithComma, target).className, 'char-correct');

    const typedWrongComma = 'Ready.';
    assert.equal(getCharacterFeedback(5, typedWrongComma, target).className, 'char-incorrect');

    // Exclamation and quotes
    const typedQuotes = 'Ready, set; go! "';
    const quoteIdx = 16;
    assert.equal(getCharacterFeedback(quoteIdx, typedQuotes, target).className, 'char-correct');
  });

  it('correctly distinguishes uppercase and lowercase letters', () => {
    const target = 'KeyFlow';

    // Typed lowercase 'k' when 'K' was expected
    const typedLower = 'k';
    assert.equal(getCharacterFeedback(0, typedLower, target).className, 'char-incorrect');

    // Typed uppercase 'K'
    const typedUpper = 'K';
    assert.equal(getCharacterFeedback(0, typedUpper, target).className, 'char-correct');

    // Typed uppercase 'E' when 'e' was expected
    const typedUpperE = 'KE';
    assert.equal(getCharacterFeedback(1, typedUpperE, target).className, 'char-incorrect');

    // Typed lowercase 'e'
    const typedCorrectE = 'Ke';
    assert.equal(getCharacterFeedback(1, typedCorrectE, target).className, 'char-correct');
  });

  it('correctly handles repeated characters independently', () => {
    const target = 'speed'; // repeated 'e' at index 2 and 3

    // First 'e' correct, second 'e' mistyped as 'a'
    const typed = 'spea';
    assert.equal(getCharacterFeedback(2, typed, target).className, 'char-correct');
    assert.equal(getCharacterFeedback(3, typed, target).className, 'char-incorrect');

    // Both correct
    const typed2 = 'spee';
    assert.equal(getCharacterFeedback(2, typed2, target).className, 'char-correct');
    assert.equal(getCharacterFeedback(3, typed2, target).className, 'char-correct');
  });

  it('calculates correct characters count accurately', () => {
    assert.equal(countCorrectChars('', 'hello'), 0);
    assert.equal(countCorrectChars('hel', 'hello'), 3);
    assert.equal(countCorrectChars('hxl', 'hello'), 2);
    assert.equal(countCorrectChars('hello world', 'hello world'), 11);
    assert.equal(countCorrectChars('hello world extra', 'hello world'), 11);
  });
});

describe('Position-Based Backspace Yellow Correction Highlighting', () => {
  it('Requirement 1 & 4: First-attempt correct character renders GREEN', () => {
    const target = 'FLOW';
    const typed = 'F';
    const correctedPositions = new Set();

    const char0 = getCharacterFeedback(0, typed, target, false, correctedPositions);
    assert.equal(char0.status, 'correct');
    assert.equal(char0.isCorrect, true);
    assert.equal(char0.isCorrected, false);
    assert.equal(char0.className, 'char-correct');
  });

  it('Requirement 2 & 5: Incorrect character currently present renders RED', () => {
    const target = 'FLOW';
    const typed = 'FX';
    const correctedPositions = new Set([1]); // index 1 had an error

    const char1 = getCharacterFeedback(1, typed, target, false, correctedPositions);
    assert.equal(char1.status, 'incorrect');
    assert.equal(char1.isCorrect, false);
    assert.equal(char1.isIncorrect, true);
    assert.equal(char1.isCorrected, false);
    assert.equal(char1.className, 'char-incorrect');
  });

  it('Requirement 3: Incorrect character removed using Backspace and corrected renders YELLOW', () => {
    const target = 'FLOW';
    // User typed 'FX', backspaced 'X', then typed 'L' (correct)
    const typed = 'FL';
    const correctedPositions = new Set([1]); // index 1 had an error

    const char0 = getCharacterFeedback(0, typed, target, false, correctedPositions);
    assert.equal(char0.status, 'correct');
    assert.equal(char0.className, 'char-correct'); // never had error -> GREEN

    const char1 = getCharacterFeedback(1, typed, target, false, correctedPositions);
    assert.equal(char1.status, 'corrected');
    assert.equal(char1.isCorrect, true);
    assert.equal(char1.isCorrected, true);
    assert.equal(char1.className, 'char-corrected'); // corrected -> YELLOW
  });

  it('Requirement 6: Multiple corrected positions maintain independent histories', () => {
    const target = 'KEYFLOW';
    // Position 1 ('E') mistyped and corrected -> YELLOW
    // Position 2 ('Y') never mistyped -> GREEN
    // Position 4 ('L') mistyped and corrected -> YELLOW
    const typed = 'KEYFL';
    const correctedPositions = new Set([1, 4]);

    assert.equal(getCharacterFeedback(0, typed, target, false, correctedPositions).className, 'char-correct');
    assert.equal(getCharacterFeedback(1, typed, target, false, correctedPositions).className, 'char-corrected');
    assert.equal(getCharacterFeedback(2, typed, target, false, correctedPositions).className, 'char-correct');
    assert.equal(getCharacterFeedback(3, typed, target, false, correctedPositions).className, 'char-correct');
    assert.equal(getCharacterFeedback(4, typed, target, false, correctedPositions).className, 'char-corrected');
  });

  it('Requirement 7: Repeated mistakes at same position remain RED while wrong and YELLOW when corrected', () => {
    const target = 'FLOW';
    const correctedPositions = new Set([1]);

    // Typed wrong second time 'FZ'
    let typed = 'FZ';
    let feedback = getCharacterFeedback(1, typed, target, false, correctedPositions);
    assert.equal(feedback.status, 'incorrect');
    assert.equal(feedback.className, 'char-incorrect'); // Still RED

    // Corrected again to 'FL'
    typed = 'FL';
    feedback = getCharacterFeedback(1, typed, target, false, correctedPositions);
    assert.equal(feedback.status, 'corrected');
    assert.equal(feedback.className, 'char-corrected'); // Returns to YELLOW
  });

  it('KeystrokeTracker tracks mistake indices and backspaces independently', () => {
    const target = 'REACT';
    const tracker = createKeystrokeTracker();

    // Type 'R' (correct)
    tracker.recordChar('R', target[0], 0);
    // Type 'X' (error at index 1)
    tracker.recordChar('X', target[1], 1);
    assert.equal(tracker.hasMistakeAt(1), true);
    assert.equal(tracker.hasMistakeAt(0), false);

    // Backspace 'X'
    tracker.recordBackspace();

    // Type 'E' (correct at index 1)
    tracker.recordChar('E', target[1], 1);
    // Type 'A' (correct at index 2)
    tracker.recordChar('A', target[2], 2);

    const stats = tracker.getStats('REA', target);
    assert.equal(stats.correctEntries, 3);
    assert.equal(stats.incorrectEntries, 1);
    assert.equal(stats.backspaceCount, 1);
    assert.equal(stats.mistakeIndices.has(1), true);

    // Verify feedback for all 3 positions
    assert.equal(getCharacterFeedback(0, 'REA', target, false, stats.mistakeIndices).className, 'char-correct');
    assert.equal(getCharacterFeedback(1, 'REA', target, false, stats.mistakeIndices).className, 'char-corrected');
    assert.equal(getCharacterFeedback(2, 'REA', target, false, stats.mistakeIndices).className, 'char-correct');
  });
});
