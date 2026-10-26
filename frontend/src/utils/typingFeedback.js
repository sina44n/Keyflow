/**
 * KEYFLOW — Live Typing Feedback Engine
 * =====================================
 * Shared character comparison and conditional styling engine across
 * Academy LessonPlayer, Workstation practice, and interactive hero previews.
 */

/**
 * Computes live character feedback for a specific character position.
 * Handles spaces, punctuation, uppercase/lowercase letters, and repeated characters.
 *
 * @param {number} index - Absolute index of the character in the target text
 * @param {string} typed - Full user-typed string so far
 * @param {string} targetText - Full target passage string
 * @param {boolean} isCompleted - Whether the current typing session has finished
 * @returns {{
 *   status: 'correct' | 'incorrect' | 'current' | 'untyped',
 *   isCorrect: boolean,
 *   isIncorrect: boolean,
 *   isCurrent: boolean,
 *   isTyped: boolean,
 *   className: string
 * }}
 */
export function getCharacterFeedback(index, typed = '', targetText = '', isCompleted = false) {
  const isTyped = index < typed.length;

  if (isTyped) {
    const isCorrect = typed[index] === targetText[index];
    return {
      status: isCorrect ? 'correct' : 'incorrect',
      isCorrect,
      isIncorrect: !isCorrect,
      isCurrent: false,
      isTyped: true,
      className: isCorrect ? 'char-correct' : 'char-incorrect',
    };
  }

  const isCurrent = index === typed.length && !isCompleted;

  if (isCurrent) {
    return {
      status: 'current',
      isCorrect: false,
      isIncorrect: false,
      isCurrent: true,
      isTyped: false,
      className: 'char-current',
    };
  }

  return {
    status: 'untyped',
    isCorrect: false,
    isIncorrect: false,
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
