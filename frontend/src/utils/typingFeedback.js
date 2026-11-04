/**
 * KEYFLOW — Live Typing Feedback Engine
 * =====================================
 * Shared character comparison and conditional styling engine across
 * Academy LessonPlayer, Workstation practice, and interactive hero previews.
 */

/**
 * Calculates Gross WPM using the standard 5-character word convention.
 * Gross WPM = Total Valid Character Entries / 5 / Active Time in Minutes.
 *
 * @param {number} totalValidEntries - Total valid printable character entries (letters, digits, punctuation, spaces)
 * @param {number} durationSeconds - Active typing duration in seconds (pauses excluded)
 * @param {number} [decimals=0] - Decimal places to round to (default 0)
 * @returns {number} Gross WPM
 */
export function calculateGrossWpm(totalValidEntries = 0, durationSeconds = 1, decimals = 0) {
  const entries = Math.max(0, Number(totalValidEntries) || 0);
  const seconds = Math.max(0.1, Number(durationSeconds) || 0);
  const minutes = seconds / 60;
  if (minutes <= 0) return 0;
  const rawWpm = (entries / 5) / minutes;
  const clamped = Math.max(0, rawWpm);
  if (decimals > 0) {
    const factor = Math.pow(10, decimals);
    return Math.round(clamped * factor) / factor;
  }
  return Math.round(clamped);
}

/**
 * Counts uncorrected errors remaining in the user's typed string compared to the target text.
 * Any character in typed that does not match targetText at that index, or any extra character
 * typed beyond targetText length, is an uncorrected error.
 *
 * @param {string} typed - User's current or final typed string
 * @param {string} targetText - Reference target text
 * @returns {number} Count of remaining uncorrected errors
 */
export function countUncorrectedErrors(typed = '', targetText = '') {
  if (!typed || typeof typed !== 'string') return 0;
  const target = typeof targetText === 'string' ? targetText : '';
  let errors = 0;
  for (let i = 0; i < typed.length; i++) {
    if (i >= target.length || typed[i] !== target[i]) {
      errors++;
    }
  }
  return errors;
}

/**
 * Calculates Net WPM by subtracting uncorrected errors per minute from Gross WPM.
 * Net WPM = max(0, Gross WPM - (Uncorrected Errors / Active Time in Minutes)).
 *
 * @param {number} grossWpm - Gross WPM (or computed from totalValidEntries)
 * @param {number} uncorrectedErrors - Count of uncorrected errors in final text
 * @param {number} durationSeconds - Active typing duration in seconds
 * @param {number} [decimals=0] - Decimal places to round to
 * @returns {number} Net WPM
 */
export function calculateNetWpm(grossWpm = 0, uncorrectedErrors = 0, durationSeconds = 1, decimals = 0) {
  const rawGross = Math.max(0, Number(grossWpm) || 0);
  const errors = Math.max(0, Number(uncorrectedErrors) || 0);
  const seconds = Math.max(0.1, Number(durationSeconds) || 0);
  const minutes = seconds / 60;
  if (minutes <= 0) return 0;
  const penaltyPerMinute = errors / minutes;
  const netRaw = Math.max(0, rawGross - penaltyPerMinute);
  if (decimals > 0) {
    const factor = Math.pow(10, decimals);
    return Math.round(netRaw * factor) / factor;
  }
  return Math.round(netRaw);
}

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
 * Formula: Correct Entries / Total Valid Character Entries * 100.
 * Total Valid Character Entries = Correct Entries + Incorrect Entries.
 *
 * Critical requirement: Correcting a typo via Backspace does NOT erase the historical
 * error from the session record!
 *
 * @param {number} correctEntries - Total count of correct character entries
 * @param {number} incorrectEntries - Total count of incorrect character entries (errors)
 * @param {number} [decimals=0] - Decimal places to round to (default 0 for integer percentage)
 * @param {object} [options={}] - Options, e.g. { emptyDefault: 100 } for live HUD before typing starts
 * @returns {number} Raw keystroke accuracy percentage (0 to 100)
 */
export function calculateRawAccuracy(correctEntries = 0, incorrectEntries = 0, decimals = 0, options = {}) {
  const correct = Math.max(0, Number(correctEntries) || 0);
  const incorrect = Math.max(0, Number(incorrectEntries) || 0);
  const total = correct + incorrect;
  if (total <= 0) {
    return options.emptyDefault !== undefined ? options.emptyDefault : 0;
  }
  const raw = (correct / total) * 100;
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
  if (!typed || typed.length === 0) return 0;
  const correct = countCorrectChars(typed, targetText);
  const baseline = Math.max(typed.length, targetText.length);
  if (baseline <= 0) return 0;
  const raw = (correct / baseline) * 100;
  const clamped = Math.max(0, Math.min(100, raw));
  if (decimals > 0) {
    const factor = Math.pow(10, decimals);
    return Math.round(clamped * factor) / factor;
  }
  return Math.round(clamped);
}

/**
 * Calculates comprehensive correction and error metrics.
 *
 * @param {object} params
 * @returns {object} Correction metrics breakdown
 */
export function calculateCorrectionMetrics({
  totalEntries = 0,
  correctEntries = 0,
  incorrectEntries = 0,
  typed = '',
  targetText = '',
  backspaces = 0,
} = {}) {
  const correct = Math.max(0, Number(correctEntries) || 0);
  const incorrect = Math.max(0, Number(incorrectEntries) || 0);
  const totalValid = totalEntries > 0 ? Number(totalEntries) : (correct + incorrect);
  const remainingErrors = countUncorrectedErrors(typed, targetText);
  const correctedMistakes = Math.max(0, incorrect - remainingErrors);
  const extraChars = Math.max(0, (typed?.length || 0) - (targetText?.length || 0));
  const missedChars = Math.max(0, (targetText?.length || 0) - (typed?.length || 0));

  return {
    totalValidEntries: totalValid,
    correctEntries: correct,
    incorrectEntries: incorrect,
    remainingErrors,
    correctedMistakes,
    extraChars,
    missedChars,
    backspaceCount: Math.max(0, Number(backspaces) || 0),
  };
}

/**
 * Constructs a single canonical session result object adhering to the authoritative metric contract.
 *
 * @param {object} params
 * @returns {object} Authoritative session result object
 */
export function createAuthoritativeSessionResult(params = {}) {
  const {
    sessionId = (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`),
    userId = null,
    testMode = 'timed',
    targetText = '',
    typed = '',
    durationSeconds = 1,
    correctKeystrokes = 0,
    mistakes = 0,
    backspaces = 0,
    startedAt = Date.now(),
    completedAt = Date.now(),
    wpmGoal = null,
    errorHistory = [],
    timeline = [],
    customFields = {},
  } = params;

  const durationSec = Math.max(1, Math.round(durationSeconds));
  const totalValidEntries = correctKeystrokes + mistakes;
  const grossWpm = calculateGrossWpm(totalValidEntries, durationSec);
  const remainingErrors = countUncorrectedErrors(typed, targetText);
  const correctedMistakes = Math.max(0, mistakes - remainingErrors);
  const netWpm = calculateNetWpm(grossWpm, remainingErrors, durationSec);
  const rawAccuracy = calculateRawAccuracy(correctKeystrokes, mistakes);
  const finalTextAccuracy = calculateFinalTextAccuracy(typed, targetText);
  const correctChars = countCorrectChars(typed, targetText);
  const extraChars = Math.max(0, typed.length - targetText.length);
  const missedChars = Math.max(0, targetText.length - typed.length);

  let tier = 'Typist';
  if (netWpm >= 100) tier = 'Godspeed';
  else if (netWpm >= 80) tier = 'Master';
  else if (netWpm >= 60) tier = 'Expert';
  else if (netWpm >= 40) tier = 'Proficient';

  return {
    sessionId,
    userId,
    mode: testMode,
    testMode,
    targetText,
    typed,
    startedAt,
    completedAt,
    duration: durationSec,
    durationSeconds: durationSec,
    totalCharacterEntries: totalValidEntries,
    totalKeystrokes: totalValidEntries,
    totalChars: totalValidEntries,
    correctCharacterEntries: correctKeystrokes,
    correctKeystrokes,
    correctChars,
    incorrectCharacterEntries: mistakes,
    mistakes,
    incorrectChars: mistakes,
    correctedMistakes,
    remainingErrors,
    errorCount: remainingErrors,
    backspaces,
    backspaceCount: backspaces,
    extraChars,
    missedChars,
    grossWpm,
    netWpm,
    wpm: netWpm,
    rawWpm: grossWpm,
    accuracy: rawAccuracy,
    rawAccuracy,
    finalTextAccuracy,
    tier,
    wpmGoal,
    wpmGoalPassed: wpmGoal ? netWpm >= wpmGoal : null,
    errorDetails: errorHistory,
    timeline,
    completionStatus: 'completed',
    metricVersion: '2.0',
    ...customFields,
  };
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

