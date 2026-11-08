/**
 * KEYFLOW — Precision 4-Line Automatic Text Scrolling Engine
 * ==========================================================
 * Authoritative mathematical engine and layout calculation helpers for
 * four-line viewport restriction and line-by-line automatic scrolling.
 * 
 * Shared between KEYFLOW Workstation and KEYFLOW Academy Lesson Player.
 * 
 * Behavior Specification:
 * - Viewport strictly displays exactly 4 visual lines when exercise text > 4 lines.
 * - Line 1 (index 0): Active line at visible slot 0; lines [0, 1, 2, 3] visible. No scroll.
 * - Line 2 (index 1): Active line at visible slot 1; lines [0, 1, 2, 3] visible. No scroll.
 * - Line 3 (index 2): Triggers first scroll! Moves up 1 line. Lines [1, 2, 3, 4] visible.
 *                     Line 1 disappears; Line 5 appears at bottom. Active line at visible slot 1.
 * - Line 4 (index 3): Moves up 2 lines. Lines [2, 3, 4, 5] visible.
 * - Line k (index k): Moves up (k - 1) lines. Lines [k-1, k, k+1, k+2] visible.
 * - Backspacing from line k to k-1 smoothly reverses scrolling.
 * - Exercises with <= 4 visual lines do NOT scroll (display in full).
 */

/**
 * Calculates target scroll top and line indexes based on the active row and line height.
 * 
 * @param {number} activeRow - 0-indexed rendered row index where active character sits
 * @param {number} lineHeight - Rendered line height in pixels
 * @returns {{ targetScrollTop: number, scrollLine: number, visibleLines: number[], activeVisibleSlot: number }}
 */
export function calculateViewportScroll(activeRow, lineHeight = 44) {
  const row = Math.max(0, Number(activeRow) || 0);
  const lh = Math.max(1, Number(lineHeight) || 44);

  // Line 1 (row 0) and Line 2 (row 1) stay at top (0px offset).
  // Once entering Line 3 (row 2), offset begins at 1 * lh, keeping active line at slot 1.
  const spanHeight = lh;
  const spanTop = row * spanHeight;
  const targetScrollTop = Math.max(0, spanTop - spanHeight);
  const scrollLine = Math.round(targetScrollTop / lh);

  return {
    targetScrollTop,
    scrollLine,
    visibleLines: [scrollLine, scrollLine + 1, scrollLine + 2, scrollLine + 3],
    activeVisibleSlot: row - scrollLine,
  };
}

/**
 * Calculates total rendered visual lines given the bounding rects of the first and last characters.
 * 
 * @param {{ top: number }} firstCharRect - Bounding rect of first character
 * @param {{ top: number }} lastCharRect - Bounding rect of last character
 * @param {number} lineHeight - Rendered line height in pixels
 * @returns {number} Total count of visual lines (minimum 1)
 */
export function calculateTotalVisualLines(firstCharRect, lastCharRect, lineHeight = 44) {
  if (!firstCharRect || !lastCharRect) return 1;
  const lh = Math.max(1, Number(lineHeight) || 44);
  const verticalDistance = Math.max(0, lastCharRect.top - firstCharRect.top);
  return Math.round(verticalDistance / lh) + 1;
}

/**
 * Calculates the active character's rendered row index (0-indexed).
 * 
 * @param {{ top: number }} activeCharRect - Bounding rect of active character
 * @param {{ top: number }} firstCharRect - Bounding rect of first character
 * @param {number} lineHeight - Rendered line height in pixels
 * @returns {number} 0-indexed row index
 */
export function calculateActiveRow(activeCharRect, firstCharRect, lineHeight = 44) {
  if (!activeCharRect || !firstCharRect) return 0;
  const lh = Math.max(1, Number(lineHeight) || 44);
  const relativeTop = Math.max(0, activeCharRect.top - firstCharRect.top);
  return Math.round(relativeTop / lh);
}

/**
 * Checks whether user prefers reduced motion (system preference or localStorage).
 * 
 * @returns {boolean}
 */
export function isReducedMotionPreferred() {
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return true;
  }
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem('keyflow_reduced_motion') === 'true';
  } catch {
    return false;
  }
}
