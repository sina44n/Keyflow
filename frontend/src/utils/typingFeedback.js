/**
 * KEYFLOW — Live Typing Feedback Engine
 * =====================================
 * Shared character comparison and conditional styling engine across
 * Academy LessonPlayer, Workstation practice, and interactive hero previews.
 */

/**
 * Computes live character feedback for a specific character position.
 * Handles spaces, punctuation, uppercase/lowercase letters, repeated characters,
 * and position-based Backspace correction history (Yellow highlighting).
 *
 * @param {number} index - Absolute index of the character in the target text
 * @param {string} typed - Full user-typed string so far
 * @param {string} targetText - Full target passage string
 * @param {boolean} isCompleted - Whether the current typing session has finished
 * @param {Set<number> | Array<number> | Object} [correctedPositions=null] - Positions where typos previously occurred
 * @returns {{
 *   status: 'correct' | 'incorrect' | 'corrected' | 'current' | 'untyped',
 *   isCorrect: boolean,
 *   isIncorrect: boolean,
 *   isCorrected: boolean,
 *   isCurrent: boolean,
 *   isTyped: boolean,
 *   className: string
 * }}
 */
export function getCharacterFeedback(index, typed = '', targetText = '', isCompleted = false, correctedPositions = null) {
  const isTyped = index < typed.length;

  if (isTyped) {
    const isCorrect = typed[index] === targetText[index];
    const hadError = correctedPositions && (
      typeof correctedPositions.has === 'function'
        ? correctedPositions.has(index)
        : Boolean(correctedPositions[index])
    );

    if (!isCorrect) {
      return {
        status: 'incorrect',
        isCorrect: false,
        isIncorrect: true,
        isCorrected: false,
        isCurrent: false,
        isTyped: true,
        className: 'char-incorrect',
      };
    }

    if (hadError) {
      return {
        status: 'corrected',
        isCorrect: true,
        isIncorrect: false,
        isCorrected: true,
        isCurrent: false,
        isTyped: true,
        className: 'char-corrected',
      };
    }

    return {
      status: 'correct',
      isCorrect: true,
      isIncorrect: false,
      isCorrected: false,
      isCurrent: false,
      isTyped: true,
      className: 'char-correct',
    };
  }

  const isCurrent = index === typed.length && !isCompleted;

  if (isCurrent) {
    return {
      status: 'current',
      isCorrect: false,
      isIncorrect: false,
      isCorrected: false,
      isCurrent: true,
      isTyped: false,
      className: 'char-current',
    };
  }

  return {
    status: 'untyped',
    isCorrect: false,
    isIncorrect: false,
    isCorrected: false,
    isCurrent: false,
    isTyped: false,
    className: 'char-untyped',
  };
}

/**
 * Computes the number of correctly typed characters between user input and target text.
 * Strictly compares character by character at matching indices.
 *
 * @param {string} typed - Full user-typed string
 * @param {string} targetText - Target passage string
 * @returns {number} Count of correctly typed characters
 */
export function countCorrectChars(typed = '', targetText = '') {
  if (!typed || !targetText) return 0;
  let count = 0;
  const len = Math.min(typed.length, targetText.length);
  for (let i = 0; i < len; i++) {
    if (typed[i] === targetText[i]) count++;
  }
  return count;
}

/**
 * Computes Raw Keystroke Accuracy based on cumulative historical attempts.
 * Formula: Correct Entries / (Correct Entries + Incorrect Entries) * 100.
 *
 * Critical requirement: Correcting a typo via Backspace does NOT erase the historical
 * error from the session record!
 *
 * @param {number} correctEntries - Total count of correct character entries
 * @param {number} incorrectEntries - Total count of incorrect character entries (errors)
 * @param {number} [decimals=0] - Decimal places to round to (default 0 for integer percentage)
 * @returns {number} Raw keystroke accuracy percentage (0 to 100)
 */
export function calculateRawAccuracy(correctEntries = 0, incorrectEntries = 0, decimals = 0) {
  const total = correctEntries + incorrectEntries;
  if (total <= 0) return 100;
  const raw = (correctEntries / total) * 100;
  const clamped = Math.max(0, Math.min(100, raw));
  if (decimals > 0) {
    const factor = Math.pow(10, decimals);
    return Math.round(clamped * factor) / factor;
  }
  return Math.round(clamped);
}

/**
 * Computes Final Text Accuracy: the match percentage of the final text against target.
 *
 * @param {string} typed - Final user-typed string
 * @param {string} targetText - Full target passage string
 * @param {number} [decimals=0] - Decimal places to round to
 * @returns {number} Final text accuracy percentage (0 to 100)
 */
export function calculateFinalTextAccuracy(typed = '', targetText = '', decimals = 0) {
  if (!targetText || targetText.length === 0) return 100;
  const correct = countCorrectChars(typed, targetText);
  const baseline = Math.max(typed.length, targetText.length);
  if (baseline <= 0) return 100;
  const raw = (correct / baseline) * 100;
  const clamped = Math.max(0, Math.min(100, raw));
  if (decimals > 0) {
    const factor = Math.pow(10, decimals);
    return Math.round(clamped * factor) / factor;
  }
  return Math.round(clamped);
}

/**
 * Creates a keystroke accuracy tracking manager.
 * Tracks character entries, mistakes, and backspaces according to touch-typing standards.
 */
export function createKeystrokeTracker() {
  let correctEntries = 0;
  let incorrectEntries = 0;
  let backspaceCount = 0;
  const errorDetails = [];
  const mistakeIndices = new Set();

  return {
    recordChar(actualChar, expectedChar, charIndex = 0, targetWord = '') {
      const isCorrect = actualChar === expectedChar;
      if (isCorrect) {
        correctEntries += 1;
      } else {
        incorrectEntries += 1;
        mistakeIndices.add(charIndex);
        errorDetails.push({
          index: charIndex,
          actual: actualChar,
          expected: expectedChar,
          word: targetWord,
          timestamp: Date.now(),
        });
      }
      return isCorrect;
    },
    recordBackspace() {
      backspaceCount += 1;
      // Backspace removes character from editable text, but does NOT remove previous mistakes
      // and does NOT change correctEntries or incorrectEntries count.
    },
    getMistakeIndices() {
      return new Set(mistakeIndices);
    },
    hasMistakeAt(charIndex) {
      return mistakeIndices.has(charIndex);
    },
    getStats(typed = '', targetText = '', decimals = 0) {
      const rawAccuracy = calculateRawAccuracy(correctEntries, incorrectEntries, decimals);
      const finalTextAccuracy = calculateFinalTextAccuracy(typed, targetText, decimals);
      return {
        correctEntries,
        incorrectEntries,
        backspaceCount,
        totalKeystrokes: correctEntries + incorrectEntries,
        rawAccuracy,
        finalTextAccuracy,
        mistakeIndices: new Set(mistakeIndices),
        errorDetails: [...errorDetails],
      };
    },
    reset() {
      correctEntries = 0;
      incorrectEntries = 0;
      backspaceCount = 0;
      errorDetails.length = 0;
      mistakeIndices.clear();
    },
  };
}

