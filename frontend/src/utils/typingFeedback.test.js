import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCharacterFeedback, countCorrectChars } from './typingFeedback.js';

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
