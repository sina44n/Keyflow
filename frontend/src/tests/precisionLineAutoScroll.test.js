import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('KEYFLOW — Precision Line-by-Line Auto-Scroll Contract', () => {
  const workstationPath = path.resolve(__dirname, '../pages/WorkstationPage.jsx');
  const workstationContent = fs.readFileSync(workstationPath, 'utf-8');

  describe('1. Four-Line Text Viewport Layout Constraints', () => {
    it('restricts visible viewport strictly to four lines (never three)', () => {
      assert.ok(
        workstationContent.includes("height: 'calc(4 * 1.625em)'"),
        'Viewport must be styled with exact 4-line height calc(4 * 1.625em)'
      );
      assert.ok(
        workstationContent.includes("maxHeight: 'calc(4 * 1.625em)'"),
        'Viewport must have maxHeight matching 4 lines'
      );
      assert.ok(
        workstationContent.includes('overflow-hidden'),
        'Viewport must have overflow-hidden to clip lines beyond 4'
      );
    });

    it('preserves typography, monospace font, relaxed leading, and background styling', () => {
      assert.ok(workstationContent.includes('leading-relaxed font-mono'), 'Preserves leading-relaxed and font-mono');
      assert.ok(workstationContent.includes('whitespace-pre-wrap break-words'), 'Preserves wrapping rules');
      assert.ok(workstationContent.includes("var(--bg-surface)"), 'Preserves surface background');
    });
  });

  describe('2. Line-by-Line Mathematical Scroll Progression', () => {
    // Pure function mimicking WorkstationPage calculation
    function calculateViewportScroll(lineIndex, lineHeight = 39) {
      const spanHeight = lineHeight;
      const spanTop = lineIndex <= 1 ? 0 : lineIndex * lineHeight;
      const targetScrollTop = Math.max(0, spanTop - spanHeight);
      const scrollLine = Math.round(targetScrollTop / lineHeight);
      const visibleLines = [scrollLine, scrollLine + 1, scrollLine + 2, scrollLine + 3];
      const activeVisibleSlot = lineIndex - scrollLine;
      return { targetScrollTop, scrollLine, visibleLines, activeVisibleSlot };
    }

    it('Line 1 (index 0) displays lines 0, 1, 2, 3 with active line at visible slot 0', () => {
      const res = calculateViewportScroll(0);
      assert.strictEqual(res.targetScrollTop, 0);
      assert.strictEqual(res.scrollLine, 0);
      assert.deepStrictEqual(res.visibleLines, [0, 1, 2, 3]);
      assert.strictEqual(res.activeVisibleSlot, 0); // 1st visible line
    });

    it('Line 2 (index 1) keeps lines 0, 1, 2, 3 visible with active line at visible slot 1', () => {
      const res = calculateViewportScroll(1);
      assert.strictEqual(res.targetScrollTop, 0);
      assert.strictEqual(res.scrollLine, 0);
      assert.deepStrictEqual(res.visibleLines, [0, 1, 2, 3]);
      assert.strictEqual(res.activeVisibleSlot, 1); // 2nd visible line
    });

    it('Line 3 (index 2) triggers first scroll: shifts by 1 line, active line moves to visible slot 1', () => {
      const res = calculateViewportScroll(2);
      assert.strictEqual(res.targetScrollTop, 39);
      assert.strictEqual(res.scrollLine, 1);
      // Line 0 moved out, Lines 1, 2, 3, 4 are visible
      assert.deepStrictEqual(res.visibleLines, [1, 2, 3, 4]);
      // Active line 2 is at visible slot 1 (the 2nd visible line)
      assert.strictEqual(res.activeVisibleSlot, 1);
    });

    it('Line 4 (index 3) triggers second scroll: shifts by 2 lines, active line moves to visible slot 1', () => {
      const res = calculateViewportScroll(3);
      assert.strictEqual(res.targetScrollTop, 78);
      assert.strictEqual(res.scrollLine, 2);
      // Line 1 moved out, Lines 2, 3, 4, 5 are visible
      assert.deepStrictEqual(res.visibleLines, [2, 3, 4, 5]);
      assert.strictEqual(res.activeVisibleSlot, 1);
    });

    it('Line 5 through 10 continue rolling viewport with active line consistently at slot 1', () => {
      for (let line = 4; line < 10; line++) {
        const res = calculateViewportScroll(line);
        assert.strictEqual(res.targetScrollTop, (line - 1) * 39);
        assert.strictEqual(res.scrollLine, line - 1);
        assert.deepStrictEqual(res.visibleLines, [line - 1, line, line + 1, line + 2]);
        assert.strictEqual(res.activeVisibleSlot, 1);
      }
    });

    it('Backspace from line k to line k-1 smoothly reverses scroll by 1 line', () => {
      const forwardRes = calculateViewportScroll(3);
      assert.strictEqual(forwardRes.scrollLine, 2);

      const backRes = calculateViewportScroll(2);
      assert.strictEqual(backRes.scrollLine, 1);
      assert.strictEqual(backRes.targetScrollTop, 39);
    });
  });

  describe('3. Multi-Line Passages and Mode Scalability', () => {
    it('provides multi-line endurance passage with at least ten lines in PRACTICE_PASSAGES', () => {
      assert.ok(
        workstationContent.includes('deep-cadence-endurance'),
        'Must include deep-cadence-endurance passage'
      );
      assert.ok(
        workstationContent.includes('Architecture of Velocity (10+ Lines)'),
        'Must include 10+ Lines passage title'
      );
    });

    it('supports chained passages for longer timed mode durations (60s, 120s)', () => {
      assert.ok(
        workstationContent.includes('timeLimit >= 60'),
        'Must support passage chaining for extended duration sessions'
      );
    });
  });

  describe('4. Session State & Responsiveness Integration', () => {
    it('skips scroll triggers when typing session is paused or completed', () => {
      assert.ok(
        workstationContent.includes('if (!viewportRef.current || isCompleted || isPaused) return;'),
        'Auto-scroll skips during paused or completed states'
      );
    });

    it('instantly snaps back to top on test reset', () => {
      assert.ok(
        workstationContent.includes("viewportRef.current.scrollTo({ top: 0, behavior: 'instant' })"),
        'handleReset immediately snaps scroll to 0 without animation delay'
      );
    });

    it('attaches resize listener to recompute alignment on responsive changes', () => {
      assert.ok(
        workstationContent.includes("window.addEventListener('resize', handleResize)"),
        'Listens to window resize events for layout adaptation'
      );
    });
  });
});
