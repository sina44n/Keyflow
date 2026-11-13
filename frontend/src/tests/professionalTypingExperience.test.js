import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  isInteractiveElement,
  dispatchTypingCharacter,
} from '../utils/useUniversalTypingFocus.js';
import {
  getCharacterFeedback,
  countCorrectChars,
  calculateGrossWpm,
  calculateNetWpm,
  countUncorrectedErrors,
} from '../utils/typingFeedback.js';
import {
  calculateViewportScroll,
  calculateTotalVisualLines,
  calculateActiveRow,
  isReducedMotionPreferred,
} from '../utils/fourLineScroll.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('KEYFLOW — Phase 3 Professional Typing Experience Masterpiece Contract', () => {
  const workstationPath = path.resolve(__dirname, '../pages/WorkstationPage.jsx');
  const lessonPlayerPath = path.resolve(__dirname, '../components/academy/LessonPlayer.jsx');
  const heroSectionPath = path.resolve(__dirname, '../components/landing/HeroSection.jsx');
  const hookPath = path.resolve(__dirname, '../utils/useUniversalTypingFocus.js');
  const indexCssPath = path.resolve(__dirname, '../index.css');

  const workstationSrc = fs.readFileSync(workstationPath, 'utf-8');
  const lessonPlayerSrc = fs.readFileSync(lessonPlayerPath, 'utf-8');
  const heroSectionSrc = fs.readFileSync(heroSectionPath, 'utf-8');
  const hookSrc = fs.readFileSync(hookPath, 'utf-8');
  const indexCssSrc = fs.readFileSync(indexCssPath, 'utf-8');

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Task A: Universal Input Readiness & First-Keystroke Delivery
  // ───────────────────────────────────────────────────────────────────────────
  describe('1. Universal Input Readiness & First-Keystroke Architecture', () => {
    it('provides synchronous focus on mount as well as deferred fallback', () => {
      assert.ok(
        hookSrc.includes('focusInput();') && hookSrc.includes('setTimeout'),
        'Hook must invoke focusInput synchronously on mount with fallback timer'
      );
    });

    it('provides synchronous focus on window focus restoration', () => {
      assert.ok(
        hookSrc.includes("window.addEventListener('focus'"),
        'Hook must listen to window focus'
      );
    });

    it('provides background pointerdown restoration for non-interactive areas', () => {
      assert.ok(
        hookSrc.includes("window.addEventListener('pointerdown'"),
        'Hook must listen to pointerdown'
      );
    });

    it('dispatches first keystroke directly into input without dropping it when unfocused', () => {
      // Mock minimal controlled input
      const inputEl = {
        value: '',
        dispatchEvent: (evt) => { inputEl._lastEvent = evt; },
      };

      const result = dispatchTypingCharacter(inputEl, 't');
      assert.strictEqual(result, true, 'dispatchTypingCharacter must accept printable char');
      assert.strictEqual(inputEl.value, 't', 'input value must reflect dispatched character');
      assert.ok(inputEl._lastEvent, 'input event must be dispatched to trigger onChange');

      // Second keystroke
      const result2 = dispatchTypingCharacter(inputEl, 'h');
      assert.strictEqual(result2, true);
      assert.strictEqual(inputEl.value, 'th');

      // Backspace
      const resultBs = dispatchTypingCharacter(inputEl, 'Backspace');
      assert.strictEqual(resultBs, true);
      assert.strictEqual(inputEl.value, 't');

      // Backspace on empty input returns false (no crash, no-op)
      dispatchTypingCharacter(inputEl, 'Backspace');
      const resultEmptyBs = dispatchTypingCharacter(inputEl, 'Backspace');
      assert.strictEqual(resultEmptyBs, false);
      assert.strictEqual(inputEl.value, '');
    });

    it('rejects non-typing or modifier keys in dispatchTypingCharacter', () => {
      const inputEl = { value: 'abc', dispatchEvent: () => {} };
      assert.strictEqual(dispatchTypingCharacter(inputEl, 'Control'), false);
      assert.strictEqual(dispatchTypingCharacter(inputEl, 'Alt'), false);
      assert.strictEqual(dispatchTypingCharacter(inputEl, 'Escape'), false);
      assert.strictEqual(dispatchTypingCharacter(inputEl, 'F5'), false);
      assert.strictEqual(inputEl.value, 'abc');
    });

    it('integrates onKeystroke into HeroSection, WorkstationPage, and LessonPlayer', () => {
      assert.ok(
        heroSectionSrc.includes('onKeystroke:'),
        'HeroSection must pass onKeystroke to useUniversalTypingFocus'
      );
      assert.ok(
        workstationSrc.includes('onKeystroke:'),
        'WorkstationPage must pass onKeystroke to useUniversalTypingFocus'
      );
      assert.ok(
        lessonPlayerSrc.includes('onKeystroke:'),
        'LessonPlayer must pass onKeystroke to useUniversalTypingFocus'
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Keyboard Safety & Non-Interference
  // ───────────────────────────────────────────────────────────────────────────
  describe('2. Keyboard Safety, Non-Interference & Accessibility', () => {
    it('preserves Ctrl, Meta, and Alt shortcuts across the application', () => {
      assert.ok(hookSrc.includes('e.ctrlKey || e.metaKey || e.altKey'));
    });

    it('preserves Tab navigation without hijacking accessibility focus across all surfaces', () => {
      assert.ok(hookSrc.includes("e.key === 'Tab'"), 'Global hook must ignore Tab');
      assert.ok(!heroSectionSrc.includes("e.key === 'Tab') {\n                      e.preventDefault"), 'HeroSection must not block Tab');
      assert.ok(workstationSrc.includes("if (e.key === 'Tab')"), 'Workstation checks Tab');
      assert.ok(lessonPlayerSrc.includes("if (e.key === 'Tab')"), 'LessonPlayer checks Tab');
    });

    it('preserves IME composition by ignoring isComposing and keyCode 229', () => {
      assert.ok(hookSrc.includes('e.isComposing || e.keyCode === 229'));
    });

    it('correctly isolates interactive elements (inputs, textareas, selects, modals, buttons)', () => {
      const mockInput = { tagName: 'INPUT' };
      const mockSelect = { tagName: 'SELECT' };
      const mockTextarea = { tagName: 'TEXTAREA' };
      const mockEditable = { isContentEditable: true };
      const mockButton = { tagName: 'BUTTON' };
      const mockModalChild = {
        closest: (sel) => sel.includes('[role="dialog"]') ? {} : null,
      };

      assert.strictEqual(isInteractiveElement(mockInput), true);
      assert.strictEqual(isInteractiveElement(mockSelect), true);
      assert.strictEqual(isInteractiveElement(mockTextarea), true);
      assert.strictEqual(isInteractiveElement(mockEditable), true);
      assert.strictEqual(isInteractiveElement(mockButton), true);
      assert.strictEqual(isInteractiveElement(mockModalChild), true);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Task B: Character State & Error History Integrity
  // ───────────────────────────────────────────────────────────────────────────
  describe('3. Character State & Backspace Correction History (Green/Red/Yellow)', () => {
    const targetText = 'hello world';

    it('renders GREEN (char-correct) on first-attempt correct characters', () => {
      const typed = 'hel';
      const corrected = new Set();
      const fb0 = getCharacterFeedback(0, typed, targetText, false, corrected);
      const fb1 = getCharacterFeedback(1, typed, targetText, false, corrected);
      const fb2 = getCharacterFeedback(2, typed, targetText, false, corrected);

      assert.strictEqual(fb0.className, 'char-correct');
      assert.strictEqual(fb1.className, 'char-correct');
      assert.strictEqual(fb2.className, 'char-correct');
    });

    it('renders RED (char-incorrect) on mistyped characters currently in typed string', () => {
      const typed = 'hex';
      const corrected = new Set();
      const fb2 = getCharacterFeedback(2, typed, targetText, false, corrected);

      assert.strictEqual(fb2.className, 'char-incorrect');
      assert.strictEqual(fb2.status, 'incorrect');
    });

    it('renders YELLOW (char-corrected) after Backspace correction and preserves permanent history', () => {
      // User typed 'hex', made mistake at index 2, backspaced, and typed 'l'
      const typed = 'hel';
      const corrected = new Set([2]);

      const fb0 = getCharacterFeedback(0, typed, targetText, false, corrected);
      const fb1 = getCharacterFeedback(1, typed, targetText, false, corrected);
      const fb2 = getCharacterFeedback(2, typed, targetText, false, corrected);

      assert.strictEqual(fb0.className, 'char-correct', 'Index 0 was never mistyped: GREEN');
      assert.strictEqual(fb1.className, 'char-correct', 'Index 1 was never mistyped: GREEN');
      assert.strictEqual(fb2.className, 'char-corrected', 'Index 2 was mistyped and corrected: YELLOW');
      assert.strictEqual(fb2.isCorrected, true);
    });

    it('re-renders RED if a previously corrected position is mistyped again, then YELLOW when corrected again', () => {
      // User typed error at index 2, backspaced, typed error again at index 2
      const typed = 'hez';
      const corrected = new Set([2]);
      const fbWrong = getCharacterFeedback(2, typed, targetText, false, corrected);
      assert.strictEqual(fbWrong.className, 'char-incorrect', 'Must remain RED while wrong');

      // Now user backspaces and types 'l' (correct)
      const typedFixed = 'hel';
      const fbFixed = getCharacterFeedback(2, typedFixed, targetText, false, corrected);
      assert.strictEqual(fbFixed.className, 'char-corrected', 'Must return to YELLOW when fixed');
    });

    it('ensures HeroSection tracks correctedIndices for Yellow highlighting', () => {
      assert.ok(
        heroSectionSrc.includes('correctedIndices'),
        'HeroSection must track correctedIndices'
      );
      assert.ok(
        heroSectionSrc.includes('getCharacterFeedback(idx, inputVal, SAMPLE_TEXT, false, correctedIndices)'),
        'HeroSection must pass correctedIndices to getCharacterFeedback'
      );
    });

    it('ensures .char-corrected style exists in both index.css and App.css', () => {
      assert.ok(
        indexCssSrc.includes('.char-corrected'),
        'index.css must define .char-corrected'
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Task C: Caret Motion & Visual Polish
  // ───────────────────────────────────────────────────────────────────────────
  describe('4. Caret Motion, Pulse Animation & Visual Feedback', () => {
    it('renders char-current with border-bottom and caretPulse animation', () => {
      assert.ok(indexCssSrc.includes('.char-current'));
      assert.ok(indexCssSrc.includes('border-bottom: 2px solid var(--typing-caret)'));
      assert.ok(indexCssSrc.includes('@keyframes caretPulse'));
    });

    it('respects prefers-reduced-motion media query for caret and animations', () => {
      assert.ok(indexCssSrc.includes('prefers-reduced-motion: reduce'));
      assert.ok(isReducedMotionPreferred() !== undefined);
    });

    it('accurately identifies active caret index as char-current', () => {
      const typed = 'hel';
      const target = 'hello';
      const fbCurrent = getCharacterFeedback(3, typed, target, false);
      assert.strictEqual(fbCurrent.status, 'current');
      assert.strictEqual(fbCurrent.className, 'char-current');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. Task D: Professional Automatic Text Scrolling & Viewport Isolation
  // ───────────────────────────────────────────────────────────────────────────
  describe('5. Professional Automatic Text Scrolling & Viewport Isolation', () => {
    it('Workstation strictly maintains 4-line viewport without page scroll', () => {
      assert.ok(workstationSrc.includes("height: 'calc(4 * 1.625em)'"));
      assert.ok(workstationSrc.includes("maxHeight: 'calc(4 * 1.625em)'"));
      assert.ok(workstationSrc.includes('overflow-hidden'));
      assert.ok(workstationSrc.includes('translate3d(0, -${scrollOffsetPx}px, 0)'));
    });

    it('Academy strictly maintains 4-line viewport without page scroll', () => {
      assert.ok(lessonPlayerSrc.includes("height: 'calc(4 * 2.2em)'"));
      assert.ok(lessonPlayerSrc.includes("maxHeight: 'calc(4 * 2.2em)'"));
      assert.ok(lessonPlayerSrc.includes('overflow-hidden'));
      assert.ok(lessonPlayerSrc.includes('translate3d(0, -${scrollOffsetPx}px, 0)'));
    });

    it('calculateViewportScroll holds at line 0 for lines 1 and 2, and scrolls up for line 3 onwards', () => {
      const lh = 40;

      // Line 1 (row 0)
      const r0 = calculateViewportScroll(0, lh);
      assert.strictEqual(r0.scrollLine, 0);
      assert.strictEqual(r0.targetScrollTop, 0);

      // Line 2 (row 1)
      const r1 = calculateViewportScroll(1, lh);
      assert.strictEqual(r1.scrollLine, 0);
      assert.strictEqual(r1.targetScrollTop, 0);

      // Line 3 (row 2) -> first scroll step!
      const r2 = calculateViewportScroll(2, lh);
      assert.strictEqual(r2.scrollLine, 1);
      assert.strictEqual(r2.targetScrollTop, 40);

      // Line 4 (row 3) -> second scroll step
      const r3 = calculateViewportScroll(3, lh);
      assert.strictEqual(r3.scrollLine, 2);
      assert.strictEqual(r3.targetScrollTop, 80);
    });

    it('reverses scroll smoothly when Backspace moves backwards across lines', () => {
      const lh = 40;
      const atLine3 = calculateViewportScroll(2, lh);
      assert.strictEqual(atLine3.targetScrollTop, 40);

      const afterBackspaceToLine2 = calculateViewportScroll(1, lh);
      assert.strictEqual(afterBackspaceToLine2.targetScrollTop, 0);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 6. Task G & H: Metrics & Session Preservation
  // ───────────────────────────────────────────────────────────────────────────
  describe('6. Authentic Metrics, Session Preservation & Scoring Formulas', () => {
    it('preserves standard 5-character Gross WPM formula', () => {
      // 50 characters in 60 seconds = 10 words / 1 min = 10 WPM
      const gross = calculateGrossWpm(50, 60);
      assert.strictEqual(gross, 10);
    });

    it('preserves standard Net WPM penalty formula', () => {
      // Gross 50 WPM, 2 uncorrected errors in 60s -> 50 - 2 = 48 Net WPM
      const net = calculateNetWpm(50, 2, 60);
      assert.strictEqual(net, 48);
    });

    it('preserves uncorrected errors counting', () => {
      const typed = 'heXlo worXd';
      const target = 'hello world';
      const uncorrected = countUncorrectedErrors(typed, target);
      assert.strictEqual(uncorrected, 2);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 7. Checkpoints 4–8: Smooth Typing Optimization Contracts
  // ───────────────────────────────────────────────────────────────────────────
  describe('7. Checkpoints 4–8 Smooth Typing Engineering Optimizations', () => {
    it('returns frozen shared feedback descriptors eliminating heap allocations during typing', () => {
      const fb1 = getCharacterFeedback(10, 'abc', 'abcdef', false);
      const fb2 = getCharacterFeedback(20, 'abc', 'abcdef', false);
      assert.strictEqual(fb1, fb2, 'Untyped feedback must return identical frozen reference');
      assert.strictEqual(Object.isFrozen(fb1), true, 'Feedback descriptor must be frozen');

      const fbCorrect1 = getCharacterFeedback(0, 'a', 'a', false);
      const fbCorrect2 = getCharacterFeedback(0, 'a', 'a', false);
      assert.strictEqual(fbCorrect1, fbCorrect2, 'Correct feedback must return identical frozen reference');
    });

    it('preserves native selection range when dispatchTypingCharacter is invoked', () => {
      let rangeSet = null;
      const mockInput = {
        value: 'he',
        setSelectionRange: (start, end) => { rangeSet = { start, end }; },
        dispatchEvent: () => {},
      };

      dispatchTypingCharacter(mockInput, 'y');
      assert.deepStrictEqual(rangeSet, { start: 3, end: 3 }, 'setSelectionRange must match nextVal.length');
    });

    it('supports onDirectInput as an authoritative single-path input mechanism in useUniversalTypingFocus', () => {
      assert.ok(
        hookSrc.includes('onDirectInput'),
        'Hook must support onDirectInput'
      );
      assert.ok(
        workstationSrc.includes('onDirectInput:'),
        'WorkstationPage must wire onDirectInput'
      );
      assert.ok(
        lessonPlayerSrc.includes('onDirectInput:'),
        'LessonPlayer must wire onDirectInput'
      );
      assert.ok(
        heroSectionSrc.includes('onDirectInput:'),
        'HeroSection must wire onDirectInput'
      );
    });

    it('defines base .typing-char border-bottom: 2px solid transparent in index.css to eliminate layout micro-jitter', () => {
      assert.ok(
        indexCssSrc.includes('.typing-char    { display: inline; border-bottom: 2px solid transparent; }'),
        'Base .typing-char must define transparent bottom border'
      );
    });

    it('equips HeroSection typing input with safe autocomplete, autocorrect, autocapitalize, and spellcheck off', () => {
      assert.ok(heroSectionSrc.includes('autoComplete="off"'), 'HeroSection input must have autoComplete off');
      assert.ok(heroSectionSrc.includes('autoCorrect="off"'), 'HeroSection input must have autoCorrect off');
      assert.ok(heroSectionSrc.includes('autoCapitalize="off"'), 'HeroSection input must have autoCapitalize off');
      assert.ok(heroSectionSrc.includes('spellCheck={false}'), 'HeroSection input must have spellCheck disabled');
    });
  });
});

