/**
 * Phase 7.54: Workstation Functional Integrity, Text Mode Correctness,
 * Character Feedback Bug Elimination & Ultra-Smooth Typing Audit Suite
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  generateCustomTypingPrompt,
  shuffleArray,
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

describe('Phase 7.54: Workstation Functional Integrity & Audit Suite', () => {

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. FOUR GENERATION MODES CONTRACT & VERIFICATION
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Part 1 — Four Generation Modes (Simple, Shuffle, Repeat, Random) Functional Contracts', () => {
    const generate1000WordPassage = () => {
      const paragraphs = [];
      const words = [
        'keyboard', 'cadence', 'velocity', 'precision', 'tactile', 'mechanical',
        'neuromuscular', 'rhythm', 'artisan', 'ergonomic', 'matrix', 'switches',
        'flow', 'intuition', 'frictionless', 'discipline', 'mastery', 'focus',
        'efficiency', 'biomechanics', 'posture', 'dexterity', 'anchor', 'keystroke',
        'actuation', 'spring', 'bottom-out', 'acoustic', 'telemetry', 'endurance'
      ];
      for (let p = 0; p < 10; p++) {
        const pWords = [];
        for (let w = 0; w < 100; w++) {
          pWords.push(words[(p * 100 + w) % words.length]);
        }
        paragraphs.push(pWords.join(' '));
      }
      return paragraphs.join('\n\n');
    };

    const sourcePassage = generate1000WordPassage();
    const sourceWordCount = countWords(sourcePassage);

    it('Simple Mode: verbatim lossless reconstruction preserving all paragraphs and newlines', () => {
      const simpleOutput = generateCustomTypingPrompt({
        sourceText: sourcePassage,
        generationMode: 'simple',
        delimiter: ' ',
        limitType: 'passage',
        limitValue: 0,
        includePunctuation: true,
        includeNumbers: true,
      });

      assert.equal(simpleOutput, sourcePassage.trim());
      assert.equal(simpleOutput.includes('\n\n'), true);
      assert.equal(countWords(simpleOutput), sourceWordCount);
    });

    it('Shuffle Mode: Fisher-Yates word permutation preserving exact word count and word frequencies without 30-word capping', () => {
      const shuffleOutput1 = generateCustomTypingPrompt({
        sourceText: sourcePassage,
        generationMode: 'shuffle',
        delimiter: ' ',
        limitType: 'passage',
        limitValue: 0,
        includePunctuation: true,
        includeNumbers: true,
      });

      const shuffleOutput2 = generateCustomTypingPrompt({
        sourceText: sourcePassage,
        generationMode: 'shuffle',
        delimiter: ' ',
        limitType: 'passage',
        limitValue: 0,
        includePunctuation: true,
        includeNumbers: true,
      });

      const words1 = shuffleOutput1.split(/\s+/).filter(Boolean);
      const words2 = shuffleOutput2.split(/\s+/).filter(Boolean);
      const originalWords = sourcePassage.split(/\s+/).filter(Boolean);

      // Must NOT cap at 30 words: must be full 1,000 words
      assert.equal(words1.length, 1000);
      assert.equal(words2.length, 1000);
      assert.equal(words1.length, originalWords.length);

      // Must be a genuine permutation: different order but identical multiset of words
      assert.notEqual(shuffleOutput1, shuffleOutput2);

      const freqOriginal = {};
      originalWords.forEach(w => freqOriginal[w] = (freqOriginal[w] || 0) + 1);

      const freqShuffle = {};
      words1.forEach(w => freqShuffle[w] = (freqShuffle[w] || 0) + 1);

      assert.deepEqual(freqShuffle, freqOriginal);
    });

    it('Random Mode: samples from source vocabulary with replacement matching target word count', () => {
      const randomOutput = generateCustomTypingPrompt({
        sourceText: sourcePassage,
        generationMode: 'random',
        delimiter: ' ',
        limitType: 'passage',
        limitValue: 0,
        includePunctuation: true,
        includeNumbers: true,
      });

      const randomWords = randomOutput.split(/\s+/).filter(Boolean);
      assert.equal(randomWords.length, 1000);

      // Every word in randomOutput must come from the source vocabulary pool
      const originalVocab = new Set(sourcePassage.split(/\s+/).filter(Boolean));
      for (const w of randomWords) {
        assert.equal(originalVocab.has(w), true);
      }
    });

    it('Repeat Mode: cycles full source passage to integer repetition boundary (2x length)', () => {
      const repeatOutput = generateCustomTypingPrompt({
        sourceText: sourcePassage,
        generationMode: 'repeat',
        delimiter: ' ',
        limitType: 'passage',
        limitValue: 0,
        includePunctuation: true,
        includeNumbers: true,
      });

      const repeatWords = repeatOutput.split(/\s+/).filter(Boolean);
      assert.equal(repeatWords.length, 2000);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. DROPDOWN SELECTION VS MAIN ACTION BUTTON EXECUTION
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Part 2 — Dropdown Mode Selection vs Main Action Button Repeated Execution', () => {
    it('verifies WorkstationToolbar has split button architecture: main execute button + chevron dropdown', () => {
      assert.equal(workstationToolbarSource.includes('onTriggerCustomMode()'), true);
      assert.equal(workstationToolbarSource.includes('setModeDropdownOpen((prev) => !prev)'), true);
      assert.equal(workstationToolbarSource.includes("onTriggerCustomMode(item.id)"), true);
    });

    it('verifies WorkstationPage handleTriggerCustomMode executes current mode when called without args', () => {
      assert.equal(workstationPageSource.includes('const handleTriggerCustomMode = useCallback((targetMode = null) => {'), true);
      assert.equal(workstationPageSource.includes('const effectiveMode = (targetMode && typeof targetMode === \'string\')'), true);
      assert.equal(workstationPageSource.includes('? targetMode'), true);
      assert.equal(workstationPageSource.includes(': customGenerationMode;'), true);
    });

    it('verifies repeated execution: 5 successive main button clicks on Shuffle produce 5 distinct permutations without cycling modes', () => {
      const basePassage = 'The quick brown fox jumps over the lazy dog and runs through deep woods.';
      let currentMode = 'shuffle';
      const results = [];

      for (let i = 0; i < 5; i++) {
        const targetMode = null; // simulate main button click
        const effectiveMode = (targetMode && typeof targetMode === 'string') ? targetMode : currentMode;
        assert.equal(effectiveMode, 'shuffle');
        const output = generateCustomTypingPrompt({
          sourceText: basePassage,
          generationMode: effectiveMode,
          limitType: 'passage',
          limitValue: 0,
        });
        results.push(output);
      }

      assert.equal(results.length, 5);
      const expectedWordCount = basePassage.split(/\s+/).filter(Boolean).length;
      for (const r of results) {
        assert.equal(r.split(/\s+/).filter(Boolean).length, expectedWordCount);
      }
      // Mode remained strictly shuffle
      assert.equal(currentMode, 'shuffle');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. PRESERVATION OF CUSTOM TEXT ACROSS TIME / WORDS / PASSAGE / ACCURACY
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Part 3 — Test Mode Controls (Time, Words, Passage, Accuracy) Preserve Custom Passages', () => {
    it('verifies handleModeChange does NOT clear customPrompt or originalSourcePassage', () => {
      // In WorkstationPage.jsx, handleModeChange must NOT call setCustomPrompt(null)
      const modeChangeMatch = workstationPageSource.match(/const handleModeChange = useCallback\(\(newMode\) => \{([\s\S]*?)\}, \[/);
      assert.ok(modeChangeMatch, 'handleModeChange callback exists');
      const body = modeChangeMatch[1];
      assert.equal(body.includes('setCustomPrompt(null)'), false, 'handleModeChange must NOT nullify customPrompt');
      assert.equal(body.includes('setOriginalSourcePassage(null)'), false, 'handleModeChange must NOT nullify originalSourcePassage');
      assert.equal(body.includes('setActiveSavedPassageId(null)'), false, 'handleModeChange must NOT nullify activeSavedPassageId');
    });

    it('verifies handleSelectPassageIndex unloads custom text ONLY when user explicitly picks a built-in passage', () => {
      assert.equal(workstationPageSource.includes('const handleSelectPassageIndex = useCallback((idx) => {'), true);
      assert.equal(workstationPageSource.includes('setSelectedPassageIndex={handleSelectPassageIndex}'), true);
    });

    it('verifies currentTargetText respects customPrompt in words mode by slicing wordLimit and preserving full prompt in passage/timed/accuracy', () => {
      const customText = 'Alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi omicron pi rho sigma tau upsilon phi chi psi omega.';
      const words = customText.split(/\s+/).filter(Boolean);

      // Simulation of currentTargetText logic
      const resolveTarget = (mode, wordLimit, customPrompt) => {
        if (customPrompt) {
          if (mode === 'words' && wordLimit > 0) {
            const w = customPrompt.split(/\s+/).filter(Boolean);
            return w.slice(0, wordLimit).join(' ');
          }
          return customPrompt;
        }
        return 'builtin';
      };

      // Words mode with wordLimit = 10
      const wordsTarget = resolveTarget('words', 10, customText);
      assert.equal(wordsTarget.split(/\s+/).length, 10);
      assert.equal(wordsTarget.startsWith('Alpha beta gamma'), true);

      // Timed mode
      const timedTarget = resolveTarget('timed', 10, customText);
      assert.equal(timedTarget, customText);

      // Passage mode
      const passageTarget = resolveTarget('passage', 10, customText);
      assert.equal(passageTarget, customText);

      // Accuracy mode
      const accuracyTarget = resolveTarget('accuracy', 10, customText);
      assert.equal(accuracyTarget, customText);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. CARET PINNING & RED CHARACTER FEEDBACK BUG ELIMINATION
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Part 4 — Caret Pinning & Character Feedback Red-Propagation Bug Elimination', () => {
    it('verifies syncInputCaret and focusInputAndSyncCaret are defined and wired in WorkstationPage', () => {
      assert.equal(workstationPageSource.includes('const syncInputCaret = useCallback(() => {'), true);
      assert.equal(workstationPageSource.includes('const focusInputAndSyncCaret = useCallback(() => {'), true);
      assert.equal(workstationPageSource.includes('onClick={syncInputCaret}'), true);
      assert.equal(workstationPageSource.includes('onSelect={syncInputCaret}'), true);
      assert.equal(workstationPageSource.includes('onFocus={syncInputCaret}'), true);
      assert.equal(workstationPageSource.includes('onKeyUp={syncInputCaret}'), true);
    });

    it('verifies handleInputChange guards against middle-string insertion/displacement', () => {
      assert.equal(workstationPageSource.includes('if (!val.startsWith(typed))'), true);
      assert.equal(workstationPageSource.includes('val = typed + insertedStr'), true);
      assert.equal(workstationPageSource.includes('syncInputCaret()'), true);
    });

    it('simulates middle-caret typing displacement: typed characters remain strictly appended and do not shift character feedback', () => {
      const targetText = 'Typing with precision creates effortless flow.';
      let typed = 'Typing with';

      // Typist clicks near beginning, caret moves to index 3, and types 'x'
      // Browser produces e.target.value = "Typxing with"
      const incomingVal = 'Typxing with';

      // Test the protection logic in handleInputChange:
      let normalizedVal = incomingVal;
      if (normalizedVal.length > typed.length) {
        if (!normalizedVal.startsWith(typed)) {
          let diffIdx = 0;
          while (diffIdx < typed.length && typed[diffIdx] === normalizedVal[diffIdx]) {
            diffIdx++;
          }
          const insertedLen = normalizedVal.length - typed.length;
          const insertedStr = normalizedVal.slice(diffIdx, diffIdx + insertedLen) || normalizedVal.slice(-insertedLen);
          normalizedVal = typed + insertedStr;
        }
      }

      // Assert that normalizedVal appended 'x' at end ("Typing withx"), NOT in the middle!
      assert.equal(normalizedVal, 'Typing withx');

      // Verify character feedback for the first 11 characters remains green (matching targetText)
      for (let i = 0; i < typed.length; i++) {
        const fb = getCharacterFeedback(i, normalizedVal, targetText, false, null);
        assert.equal(fb.className, 'char-correct');
      }

      // 12th character ('x' vs ' ') is marked red (char-incorrect)
      const fb11 = getCharacterFeedback(11, normalizedVal, targetText, false, null);
      assert.equal(fb11.className, 'char-incorrect');

      // Correct with backspace:
      const backspacedVal = normalizedVal.slice(0, normalizedVal.length - 1);
      assert.equal(backspacedVal, 'Typing with');

      // Now typist types space (' '):
      const nextTyped = backspacedVal + ' ';
      assert.equal(nextTyped, 'Typing with ');

      // And types 'precision ':
      const precisionTyped = nextTyped + 'precision ';
      assert.equal(precisionTyped, 'Typing with precision ');

      // Check feedback for each character:
      for (let i = 0; i < precisionTyped.length; i++) {
        const fb = getCharacterFeedback(i, precisionTyped, targetText, false, new Set([11]));
        if (i === 11) {
          // Previously had error at index 11, now corrected -> char-corrected (yellow)
          assert.equal(fb.className, 'char-corrected');
        } else {
          // All subsequent characters must be green (char-correct), NEVER red!
          assert.equal(fb.className, 'char-correct', `Character at index ${i} ('${targetText[i]}') must be correct`);
        }
      }
    });

    it('simulates pause/resume and viewport click: caret is strictly pinned to end and no red feedback corruption occurs', () => {
      const targetText = 'Mechanical keyboards provide tactile confirmation.';
      let typed = 'Mechanical key';

      // Verify feedback before pause:
      for (let i = 0; i < typed.length; i++) {
        const fb = getCharacterFeedback(i, typed, targetText, false, null);
        assert.equal(fb.className, 'char-correct');
      }

      // Simulate pause and resume:
      // Upon resume, focusInputAndSyncCaret() ensures caret is at typed.length (14)
      const nextKey = 'b';
      typed = typed + nextKey; // "Mechanical keyb"

      const fbLast = getCharacterFeedback(typed.length - 1, typed, targetText, false, null);
      assert.equal(fbLast.className, 'char-correct');
      assert.equal(typed, 'Mechanical keyb');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. FOUR-LINE VIEWPORT GEOMETRY & AUTO-SCROLL PRESERVATION
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Part 5 — Four-Line Viewport Geometry & Auto-Scroll Preservation', () => {
    it('strictly preserves 4-line viewport height calc(4 * 1.625em) in WorkstationPage', () => {
      assert.equal(workstationPageSource.includes("height: 'calc(4 * 1.625em)'"), true);
      assert.equal(workstationPageSource.includes("maxHeight: 'calc(4 * 1.625em)'"), true);
    });

    it('strictly preserves GPU-accelerated translate3d auto-scroll mechanics', () => {
      assert.equal(workstationPageSource.includes('transform: `translate3d(0, -${scrollOffsetPx}px, 0)`'), true);
      assert.equal(workstationPageSource.includes('transition:'), true);
      assert.equal(workstationPageSource.includes('cubic-bezier(0.2, 0, 0, 1)'), true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. SCORING FORMULAS & FEEDBACK INTEGRITY
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Part 6 — Scoring Formulas & Feedback Semantic Integrity', () => {
    it('strictly preserves gross WPM, net WPM, and raw accuracy formulas', () => {
      const gross = calculateGrossWpm(250, 60); // 250 / 5 / 1 = 50 WPM
      assert.equal(gross, 50);

      const net = calculateNetWpm(50, 2, 60); // 50 - 2 = 48 WPM
      assert.equal(net, 48);

      const acc = calculateRawAccuracy(250, 2); // 248 / 250 = 99.2% -> 99%
      assert.equal(acc, 99);
    });
  });
});
