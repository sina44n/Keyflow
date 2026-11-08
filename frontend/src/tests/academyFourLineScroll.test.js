import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  calculateViewportScroll,
  calculateTotalVisualLines,
  calculateActiveRow,
  isReducedMotionPreferred,
} from '../utils/fourLineScroll.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('KEYFLOW ACADEMY — Precision 4-Line Automatic Text Scrolling Engine', () => {
  const lessonPlayerPath = path.resolve(__dirname, '../components/academy/LessonPlayer.jsx');
  const lessonPlayerContent = fs.readFileSync(lessonPlayerPath, 'utf-8');

  describe('1. Static Code Inspection & Structural Architecture Contracts', () => {
    it('integrates viewportRef, textTrackRef, and activeCharSpanRef into LessonPlayer', () => {
      assert.ok(lessonPlayerContent.includes('viewportRef = useRef(null)'), 'Must define viewportRef');
      assert.ok(lessonPlayerContent.includes('textTrackRef = useRef(null)'), 'Must define textTrackRef');
      assert.ok(lessonPlayerContent.includes('activeCharSpanRef = useRef(null)'), 'Must define activeCharSpanRef');
    });

    it('enforces exact four-line viewport height calc(4 * 2.2em) and overflow-hidden when multi-line', () => {
      assert.ok(
        lessonPlayerContent.includes("height: 'calc(4 * 2.2em)'"),
        'Must style viewport with exact 4-line height calc(4 * 2.2em)'
      );
      assert.ok(
        lessonPlayerContent.includes("maxHeight: 'calc(4 * 2.2em)'"),
        'Must constrain viewport with maxHeight calc(4 * 2.2em)'
      );
      assert.ok(
        lessonPlayerContent.includes("isMultiLine ? 'overflow-hidden relative' : ''"),
        'Must conditionally apply overflow-hidden relative only when text exceeds 4 lines'
      );
    });

    it('implements GPU-accelerated translate3d on textTrackRef with 200ms cubic-bezier transition', () => {
      assert.ok(
        lessonPlayerContent.includes('translate3d(0, -${scrollOffsetPx}px, 0)'),
        'Must use GPU-accelerated translate3d for smooth vertical text scrolling'
      );
      assert.ok(
        lessonPlayerContent.includes('transform 200ms cubic-bezier(0.2, 0, 0, 1)'),
        'Must use Workstation-exact 200ms cubic-bezier transition timing'
      );
      assert.ok(
        lessonPlayerContent.includes('isReducedMotionPreferred()'),
        'Must respect reduced-motion preference by disabling animation transition'
      );
    });

    it('resets scroll line and pixel offset to 0 on handleReset and lesson change', () => {
      assert.ok(lessonPlayerContent.includes('setScrollLine(0)'), 'Must reset scrollLine to 0');
      assert.ok(lessonPlayerContent.includes('setScrollOffsetPx(0)'), 'Must reset scrollOffsetPx to 0');
      assert.ok(
        lessonPlayerContent.includes("viewportRef.current.scrollTo({ top: 0, behavior: 'instant' })"),
        'Must instantly reset viewport scroll position on reset'
      );
    });

    it('preserves existing keyboard and hand guides without displacing them during scroll', () => {
      assert.ok(lessonPlayerContent.includes('<KeyboardGuide'), 'Preserves KeyboardGuide component');
      assert.ok(lessonPlayerContent.includes('keyboardGuideOn'), 'Preserves keyboard guide toggle');
      assert.ok(lessonPlayerContent.includes('handGuideOn'), 'Preserves hand guide toggle');
    });
  });

  describe('2. Four-Line Viewport Mathematical Progression (Workstation-Exact)', () => {
    const LINE_HEIGHT = 48; // Standard 24px font * 2.2 line-height

    it('Line 1 (index 0) produces zero scroll offset: lines [0, 1, 2, 3] visible at slot 0', () => {
      const res = calculateViewportScroll(0, LINE_HEIGHT);
      assert.strictEqual(res.targetScrollTop, 0);
      assert.strictEqual(res.scrollLine, 0);
      assert.deepStrictEqual(res.visibleLines, [0, 1, 2, 3]);
      assert.strictEqual(res.activeVisibleSlot, 0); // 1st visible line
    });

    it('Line 2 (index 1) produces zero scroll offset: lines [0, 1, 2, 3] visible at slot 1 (NO premature scrolling)', () => {
      const res = calculateViewportScroll(1, LINE_HEIGHT);
      assert.strictEqual(res.targetScrollTop, 0);
      assert.strictEqual(res.scrollLine, 0);
      assert.deepStrictEqual(res.visibleLines, [0, 1, 2, 3]);
      assert.strictEqual(res.activeVisibleSlot, 1); // 2nd visible line
    });

    it('Line 3 (index 2) triggers first scroll: shifts up 1 line; Line 1 disappears and Line 5 appears below', () => {
      const res = calculateViewportScroll(2, LINE_HEIGHT);
      assert.strictEqual(res.targetScrollTop, LINE_HEIGHT); // 48px
      assert.strictEqual(res.scrollLine, 1);
      assert.deepStrictEqual(res.visibleLines, [1, 2, 3, 4]); // Lines 2, 3, 4, 5
      assert.strictEqual(res.activeVisibleSlot, 1); // Active line stays at visible slot 1
    });

    it('Line 4 (index 3) advances viewport by exactly 1 more line (total 2 lines shift)', () => {
      const res = calculateViewportScroll(3, LINE_HEIGHT);
      assert.strictEqual(res.targetScrollTop, 2 * LINE_HEIGHT); // 96px
      assert.strictEqual(res.scrollLine, 2);
      assert.deepStrictEqual(res.visibleLines, [2, 3, 4, 5]); // Lines 3, 4, 5, 6
      assert.strictEqual(res.activeVisibleSlot, 1);
    });

    it('Line 5 through 10 maintain continuous rolling four-line viewport with active line at slot 1', () => {
      for (let line = 4; line < 10; line++) {
        const res = calculateViewportScroll(line, LINE_HEIGHT);
        assert.strictEqual(res.targetScrollTop, (line - 1) * LINE_HEIGHT);
        assert.strictEqual(res.scrollLine, line - 1);
        assert.deepStrictEqual(res.visibleLines, [line - 1, line, line + 1, line + 2]);
        assert.strictEqual(res.activeVisibleSlot, 1);
      }
    });

    it('Backspace from line k to line k-1 smoothly reverses scroll by exactly 1 line', () => {
      const forwardRes = calculateViewportScroll(3, LINE_HEIGHT);
      assert.strictEqual(forwardRes.scrollLine, 2);
      assert.strictEqual(forwardRes.targetScrollTop, 96);

      // User backspaces back into line 2
      const backRes = calculateViewportScroll(2, LINE_HEIGHT);
      assert.strictEqual(backRes.scrollLine, 1);
      assert.strictEqual(backRes.targetScrollTop, 48);

      // User backspaces back into line 1
      const backToLine1 = calculateViewportScroll(1, LINE_HEIGHT);
      assert.strictEqual(backToLine1.scrollLine, 0);
      assert.strictEqual(backToLine1.targetScrollTop, 0);
    });
  });

  describe('3. Conditional Activation: Exercises <= 4 Lines vs > 4 Lines', () => {
    const LINE_HEIGHT = 44;

    it('calculates 1 visual line for single-line drills (no scroll)', () => {
      const first = { top: 100 };
      const last = { top: 100 };
      const lines = calculateTotalVisualLines(first, last, LINE_HEIGHT);
      assert.strictEqual(lines, 1);
      assert.strictEqual(lines > 4, false);
    });

    it('calculates 2 visual lines for two-line drills (no scroll)', () => {
      const first = { top: 100 };
      const last = { top: 144 };
      const lines = calculateTotalVisualLines(first, last, LINE_HEIGHT);
      assert.strictEqual(lines, 2);
      assert.strictEqual(lines > 4, false);
    });

    it('calculates exactly 4 visual lines for 4-line passages (no scroll activation)', () => {
      const first = { top: 100 };
      const last = { top: 100 + 3 * LINE_HEIGHT }; // row 3
      const lines = calculateTotalVisualLines(first, last, LINE_HEIGHT);
      assert.strictEqual(lines, 4);
      assert.strictEqual(lines > 4, false);
    });

    it('calculates 5 visual lines for 5-line exercises (activates 4-line scrolling viewport)', () => {
      const first = { top: 100 };
      const last = { top: 100 + 4 * LINE_HEIGHT }; // row 4
      const lines = calculateTotalVisualLines(first, last, LINE_HEIGHT);
      assert.strictEqual(lines, 5);
      assert.strictEqual(lines > 4, true);
    });

    it('calculates 12 visual lines for long paragraph endurance passages', () => {
      const first = { top: 100 };
      const last = { top: 100 + 11 * LINE_HEIGHT }; // row 11
      const lines = calculateTotalVisualLines(first, last, LINE_HEIGHT);
      assert.strictEqual(lines, 12);
      assert.strictEqual(lines > 4, true);
    });
  });

  describe('4. Active Character Row Identification & Bounding Coordinate Stability', () => {
    const LINE_HEIGHT = 44;
    const firstCharRect = { top: 150 };

    it('maps characters on first visual line to row 0', () => {
      const charRect = { top: 150 };
      const row = calculateActiveRow(charRect, firstCharRect, LINE_HEIGHT);
      assert.strictEqual(row, 0);
    });

    it('maps characters on second visual line to row 1', () => {
      const charRect = { top: 150 + LINE_HEIGHT };
      const row = calculateActiveRow(charRect, firstCharRect, LINE_HEIGHT);
      assert.strictEqual(row, 1);
    });

    it('maps characters on third visual line to row 2', () => {
      const charRect = { top: 150 + 2 * LINE_HEIGHT };
      const row = calculateActiveRow(charRect, firstCharRect, LINE_HEIGHT);
      assert.strictEqual(row, 2);
    });

    it('maps characters on fifth visual line to row 4', () => {
      const charRect = { top: 150 + 4 * LINE_HEIGHT };
      const row = calculateActiveRow(charRect, firstCharRect, LINE_HEIGHT);
      assert.strictEqual(row, 4);
    });

    it('handles fractional sub-pixel coordinate noise gracefully via rounding', () => {
      // Sub-pixel jitter of 1.2px
      const charRect = { top: 150 + 2 * LINE_HEIGHT + 1.2 };
      const row = calculateActiveRow(charRect, firstCharRect, LINE_HEIGHT);
      assert.strictEqual(row, 2);
    });
  });

  describe('5. Accessibility & Reduced Motion Handling', () => {
    it('provides isReducedMotionPreferred helper', () => {
      assert.strictEqual(typeof isReducedMotionPreferred, 'function');
      const val = isReducedMotionPreferred();
      assert.strictEqual(typeof val, 'boolean');
    });
  });
});
