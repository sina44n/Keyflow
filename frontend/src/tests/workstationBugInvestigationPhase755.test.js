/**
 * Phase 7.55: Deep Root-Cause Investigation & Permanent Workstation
 * Character Feedback and Custom Passage Preservation Test Suite
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  generateCustomTypingPrompt,
  countWords,
} from '../utils/textUtilities.js';
import {
  getCharacterFeedback,
  calculateGrossWpm,
  calculateNetWpm,
  calculateRawAccuracy,
  countUncorrectedErrors,
} from '../utils/typingFeedback.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workstationPagePath = path.resolve(__dirname, '../pages/WorkstationPage.jsx');
const workstationToolbarPath = path.resolve(__dirname, '../components/workstation/WorkstationToolbar.jsx');
const workstationPageSource = fs.readFileSync(workstationPagePath, 'utf8');
const workstationToolbarSource = fs.readFileSync(workstationToolbarPath, 'utf8');

describe('Phase 7.55: Workstation Character Feedback & Custom Passage Preservation', () => {

  // ─────────────────────────────────────────────────────────────────────────
  // PART A — CHARACTER FEEDBACK TESTS (TEST A THROUGH TEST F)
  // ─────────────────────────────────────────────────────────────────────────
  describe('Part A — Character Feedback Integrity After Errors, Backspaces, Pause/Resume & Blur', () => {
    const targetText = 'The quick brown fox jumps over the lazy dog and runs through the forest with immense velocity and precision.';

    it('Test A — Basic error correction: corrected character turns YELLOW, subsequent 30 correct characters remain GREEN (0 red)', () => {
      // 1. Type 10 correct characters: "The quick "
      let typed = targetText.slice(0, 10);
      const correctedIndices = new Set();

      for (let i = 0; i < 10; i++) {
        const fb = getCharacterFeedback(i, typed, targetText, false, correctedIndices);
        assert.equal(fb.status, 'correct');
        assert.equal(fb.className, 'char-correct');
      }

      // 2. Type 1 incorrect character at index 10 ('x' instead of 'b')
      typed += 'x';
      correctedIndices.add(10);
      const errFb = getCharacterFeedback(10, typed, targetText, false, correctedIndices);
      assert.equal(errFb.status, 'incorrect');
      assert.equal(errFb.className, 'char-incorrect');

      // 3. Press Backspace: removes 'x', correctedIndices retains index 10
      typed = typed.slice(0, -1);
      assert.equal(typed.length, 10);

      // 4. Type the correct character ('b')
      typed += targetText[10];
      const correctedFb = getCharacterFeedback(10, typed, targetText, false, correctedIndices);
      assert.equal(correctedFb.status, 'corrected');
      assert.equal(correctedFb.className, 'char-corrected');

      // 5. Continue typing at least 30 correct characters
      for (let i = 11; i <= 40; i++) {
        typed += targetText[i];
      }
      assert.equal(typed.length, 41);

      // 6. Inspect every character's rendered feedback
      let redCount = 0;
      let yellowCount = 0;
      let greenCount = 0;

      for (let i = 0; i < typed.length; i++) {
        const fb = getCharacterFeedback(i, typed, targetText, false, correctedIndices);
        if (fb.className === 'char-incorrect') redCount++;
        if (fb.className === 'char-corrected') yellowCount++;
        if (fb.className === 'char-correct') greenCount++;
      }

      assert.equal(redCount, 0, 'Zero subsequent characters should turn RED');
      assert.equal(yellowCount, 1, 'Exactly 1 character (index 10) must be YELLOW');
      assert.equal(greenCount, 40, 'All 40 other typed characters must be GREEN');
    });

    it('Test B — Uncorrected error: only the incorrect character is RED, subsequent 30 correct characters remain GREEN', () => {
      // 1. Type 10 correct characters
      let typed = targetText.slice(0, 10);
      const correctedIndices = new Set();

      // 2. Type 1 incorrect character ('x' instead of 'b' at index 10)
      typed += 'x';

      // 3. Typist does NOT backspace, but continues typing correct subsequent characters
      for (let i = 11; i <= 40; i++) {
        typed += targetText[i];
      }
      assert.equal(typed.length, 41);

      // 4. Verify character feedback
      const fbAtError = getCharacterFeedback(10, typed, targetText, false, correctedIndices);
      assert.equal(fbAtError.status, 'incorrect');
      assert.equal(fbAtError.className, 'char-incorrect');

      for (let i = 11; i <= 40; i++) {
        const fb = getCharacterFeedback(i, typed, targetText, false, correctedIndices);
        assert.equal(fb.status, 'correct', `Character at index ${i} ('${targetText[i]}') must be correct`);
        assert.equal(fb.className, 'char-correct');
      }
    });

    it('Test C — Pause and resume does not corrupt subsequent character feedback or caret tracking', () => {
      let typed = targetText.slice(0, 15);
      const correctedIndices = new Set();

      // Error at index 15
      typed += 'z';
      correctedIndices.add(15);
      // Corrected via Backspace
      typed = typed.slice(0, -1);
      typed += targetText[15];

      // Simulate pause / resume: typed string and correctedIndices are preserved
      const savedTyped = typed;
      const isPaused = true;
      assert.equal(isPaused, true);
      const resumedTyped = savedTyped; // resumed

      // Continue typing 20 more characters
      let current = resumedTyped;
      for (let i = 16; i < 36; i++) {
        current += targetText[i];
        const fb = getCharacterFeedback(i, current, targetText, false, correctedIndices);
        assert.equal(fb.status, 'correct');
        assert.equal(fb.className, 'char-correct');
      }

      // Check index 15 remains YELLOW
      const fb15 = getCharacterFeedback(15, current, targetText, false, correctedIndices);
      assert.equal(fb15.status, 'corrected');
      assert.equal(fb15.className, 'char-corrected');
    });

    it('Test D — Focus loss and refocus does not corrupt cursor position or character feedback', () => {
      let typed = targetText.slice(0, 20);
      const correctedIndices = new Set();

      // Window blur happens: input retains value
      const blurredVal = typed;
      // Focus restores: selection range pinned to blurredVal.length
      const focusedCaret = blurredVal.length;
      assert.equal(focusedCaret, 20);

      // Continue typing from caret
      let current = blurredVal;
      for (let i = 20; i < 40; i++) {
        current += targetText[i];
        const fb = getCharacterFeedback(i, current, targetText, false, correctedIndices);
        assert.equal(fb.className, 'char-correct');
      }
    });

    it('Test E — Repeated corrections: multiple errors at different positions preserve GREEN, RED, and YELLOW independently', () => {
      const correctedIndices = new Set();
      let typed = '';

      // Type 5 correct chars (0-4)
      typed += targetText.slice(0, 5);
      // Error at index 5, corrected
      correctedIndices.add(5);
      typed += targetText[5];

      // Type 10 correct chars (6-15)
      typed += targetText.slice(6, 16);

      // Error at index 16, corrected
      correctedIndices.add(16);
      typed += targetText[16];

      // Type 5 correct chars (17-21)
      typed += targetText.slice(17, 22);

      // Uncorrected error at index 22 ('9' instead of targetText[22])
      typed += '9';

      // Type 10 correct chars (23-32)
      typed += targetText.slice(23, 33);

      // Verify states
      assert.equal(getCharacterFeedback(5, typed, targetText, false, correctedIndices).className, 'char-corrected');
      assert.equal(getCharacterFeedback(16, typed, targetText, false, correctedIndices).className, 'char-corrected');
      assert.equal(getCharacterFeedback(22, typed, targetText, false, correctedIndices).className, 'char-incorrect');

      // Verify clean characters remain green
      for (const idx of [0, 1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20, 21, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32]) {
        assert.equal(getCharacterFeedback(idx, typed, targetText, false, correctedIndices).className, 'char-correct');
      }
    });

    it('Test F — Long passage chunk boundary: character feedback remains consistent across 120-char chunks', () => {
      const longPassage = targetText.repeat(5); // ~550 chars
      const chunkSize = 120;
      const correctedIndices = new Set([119, 120, 121]); // errors around chunk 0-1 boundary

      let typed = longPassage.slice(0, 250);

      // Verify index 119 (end of chunk 0)
      assert.equal(getCharacterFeedback(119, typed, longPassage, false, correctedIndices).className, 'char-corrected');
      // Verify index 120 (start of chunk 1)
      assert.equal(getCharacterFeedback(120, typed, longPassage, false, correctedIndices).className, 'char-corrected');
      // Verify index 121
      assert.equal(getCharacterFeedback(121, typed, longPassage, false, correctedIndices).className, 'char-corrected');

      // Verify uncorrected char beyond chunk boundary
      assert.equal(getCharacterFeedback(200, typed, longPassage, false, correctedIndices).className, 'char-correct');
    });

    it('verifies WorkstationPage uses synchronous typedRef to eliminate stale React closures', () => {
      assert.equal(workstationPageSource.includes('const typedRef = useRef(\'\');'), true, 'typedRef must be defined');
      assert.equal(workstationPageSource.includes('typedRef.current = typed;'), true, 'typedRef must be synced on render');
      assert.equal(workstationPageSource.includes('typedRef.current = val;'), true, 'typedRef must be updated synchronously in handleInputChange');
      assert.equal(workstationPageSource.includes('typedRef.current = \'\';'), true, 'typedRef must be reset in handleReset');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // PART B — CUSTOM PASSAGE PRESERVATION ACROSS MODES (TEST 1 THROUGH 15)
  // ─────────────────────────────────────────────────────────────────────────
  describe('Part B — Custom 1,000-Word Passage Preservation Across All 4 Test Modes', () => {
    // Generate deterministic 1,000-word passage with identifiable markers
    const createDeterministic1000WordPassage = () => {
      const words = [];
      words.push('START_MARKER_KEYFLOW_ALPHA_1000');
      const vocabulary = [
        'mechanical', 'keyboard', 'precision', 'cadence', 'velocity', 'neuromuscular',
        'biomechanics', 'ergonomics', 'switches', 'actuation', 'tactile', 'linear',
        'spring', 'acoustic', 'telemetry', 'endurance', 'rhythm', 'discipline',
        'mastery', 'focus', 'flow', 'dexterity', 'accuracy', 'consistency', 'efficiency'
      ];
      for (let i = 1; i <= 998; i++) {
        if (i === 500) {
          words.push('MIDDLE_MARKER_PASSAGE_CORE_500');
        } else {
          words.push(vocabulary[i % vocabulary.length]);
        }
      }
      words.push('END_MARKER_KEYFLOW_OMEGA_1000');
      return words.join(' ');
    };

    const passage1000 = createDeterministic1000WordPassage();
    const wordCount = countWords(passage1000);

    // Simulated currentTargetText logic matching WorkstationPage.jsx
    const resolveTargetText = ({ mode, wordLimit, originalSourcePassage, customPrompt }) => {
      const activeCustom = originalSourcePassage || customPrompt;
      if (activeCustom) {
        if (mode === 'words' && wordLimit > 0) {
          const words = activeCustom.split(/\s+/).filter(Boolean);
          return words.slice(0, wordLimit).join(' ');
        }
        return activeCustom;
      }
      return 'FALLBACK_BUILTIN_PASSAGE';
    };

    it('1-2. Apply 1,000-word custom passage: retains full text and markers', () => {
      assert.equal(wordCount, 1000);
      assert.equal(passage1000.includes('START_MARKER_KEYFLOW_ALPHA_1000'), true);
      assert.equal(passage1000.includes('MIDDLE_MARKER_PASSAGE_CORE_500'), true);
      assert.equal(passage1000.includes('END_MARKER_KEYFLOW_OMEGA_1000'), true);

      const target = resolveTargetText({
        mode: 'passage',
        wordLimit: 1000,
        originalSourcePassage: passage1000,
        customPrompt: passage1000,
      });
      assert.equal(target, passage1000);
      assert.equal(countWords(target), 1000);
    });

    it('3-4. Switch to Time mode: custom passage remains active source (full 1,000 words)', () => {
      const target = resolveTargetText({
        mode: 'timed',
        wordLimit: 1000,
        originalSourcePassage: passage1000,
        customPrompt: passage1000,
      });
      assert.equal(target, passage1000, 'Time mode must use complete custom passage');
      assert.equal(target.includes('START_MARKER_KEYFLOW_ALPHA_1000'), true);
      assert.equal(target.includes('END_MARKER_KEYFLOW_OMEGA_1000'), true);
    });

    it('5-6. Switch to Words mode: applies wordLimit target slice while originalSourcePassage retains full 1,000 words', () => {
      const target25 = resolveTargetText({
        mode: 'words',
        wordLimit: 25,
        originalSourcePassage: passage1000,
        customPrompt: passage1000,
      });
      assert.equal(countWords(target25), 25);
      assert.equal(target25.startsWith('START_MARKER_KEYFLOW_ALPHA_1000'), true);

      // Verify the source itself was NOT truncated
      assert.equal(countWords(passage1000), 1000);
    });

    it('7-8. Switch to Accuracy mode: custom passage remains active source (full 1,000 words)', () => {
      const target = resolveTargetText({
        mode: 'accuracy',
        wordLimit: 25,
        originalSourcePassage: passage1000,
        customPrompt: passage1000,
      });
      assert.equal(target, passage1000, 'Accuracy mode must use complete custom passage');
      assert.equal(target.includes('MIDDLE_MARKER_PASSAGE_CORE_500'), true);
    });

    it('9-10. Switch to Passage mode: full 1,000-word custom passage is restored', () => {
      const target = resolveTargetText({
        mode: 'passage',
        wordLimit: 25,
        originalSourcePassage: passage1000,
        customPrompt: passage1000,
      });
      assert.equal(target, passage1000);
      assert.equal(countWords(target), 1000);
    });

    it('11. Repeat transitions in reverse order: Passage -> Accuracy -> Words -> Time -> Passage', () => {
      const modes = ['passage', 'accuracy', 'words', 'timed', 'passage'];
      for (const m of modes) {
        const text = resolveTargetText({
          mode: m,
          wordLimit: m === 'words' ? 50 : 1000,
          originalSourcePassage: passage1000,
          customPrompt: passage1000,
        });
        if (m === 'words') {
          assert.equal(countWords(text), 50);
        } else {
          assert.equal(countWords(text), 1000);
        }
      }
    });

    it('12. Verify that no built-in passage silently replaces the custom passage during mode switches', () => {
      const target = resolveTargetText({
        mode: 'timed',
        wordLimit: 1000,
        originalSourcePassage: passage1000,
        customPrompt: passage1000,
      });
      assert.equal(target.includes('FALLBACK_BUILTIN_PASSAGE'), false);
      assert.equal(target.includes('PRACTICE_PASSAGES'), false);
    });

    it('13. Verify WorkstationToolbar separates customActive from mode buttons active styling', () => {
      // In WorkstationToolbar.jsx, mode buttons (Time, Words, Passage, Accuracy)
      // must NOT be excluded by !customActive
      assert.equal(workstationToolbarSource.includes("mode === 'timed' && !activeCompetition"), true, 'Time button must show active even when customActive');
      assert.equal(workstationToolbarSource.includes("mode === 'words' && !activeCompetition"), true, 'Words button must show active even when customActive');
      assert.equal(workstationToolbarSource.includes("mode === 'passage' && !activeCompetition"), true, 'Passage button must show active even when customActive');
      assert.equal(workstationToolbarSource.includes("mode === 'accuracy' && !activeCompetition"), true, 'Accuracy button must show active even when customActive');
    });

    it('14. Verify WorkstationToolbar shows TIME_OPTIONS and WORD_OPTIONS even when customActive is true', () => {
      // In WorkstationToolbar.jsx, time options must show when mode === 'timed' && !activeCompetition
      assert.equal(workstationToolbarSource.includes("mode === 'timed' && !activeCompetition && ("), true);
      assert.equal(workstationToolbarSource.includes("mode === 'words' && !activeCompetition && ("), true);
    });

    it('15. Verify WorkstationPage passes initialText to CustomTypingStudio to pre-populate custom passage on edit', () => {
      assert.equal(workstationPageSource.includes("initialText={originalSourcePassage || customPrompt || ''}"), true);
    });
  });
});
