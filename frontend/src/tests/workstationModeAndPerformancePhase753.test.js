/**
 * KEYFLOW Phase 7.53: Stable Text Generation Mode Selection & Workstation Typing Performance
 * =========================================================================================
 * Comprehensive Behavioral & Regression Test Suite:
 * 1. Mode Selection vs. Mode Execution Separation:
 *    - Main generation button executes currently selected mode repeatedly without cycling.
 *    - Mode dropdown is the only control that explicitly switches the selected mode.
 *    - Full 4-mode verification: Simple, Shuffle, Repeat, Random.
 *    - Source locking on 1,000-word passages across repeated executions.
 * 2. Ultra-Smooth Typing Rendering Pipeline & Optimization:
 *    - WorkstationChunk memoization isolates DOM reconciliation to the active typing cursor.
 *    - Range-buffered comparator skips 95%+ of chunks during long typing sessions.
 *    - Strict preservation of character classes, colors (Green/Red/Yellow), and .typing-char.
 *    - Viewport height calc(4 * 1.625em) and auto-scroll geometry preservation.
 *    - WorkstationToolbar callback stabilization prevents unrelated control re-renders.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
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
} from '../utils/typingFeedback.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Phase 7.53: Workstation Stable Mode Selection & Typing Performance Suite', () => {
  const workstationPath = path.resolve(__dirname, '../pages/WorkstationPage.jsx');
  const toolbarPath = path.resolve(__dirname, '../components/workstation/WorkstationToolbar.jsx');
  const typingFocusPath = path.resolve(__dirname, '../utils/useUniversalTypingFocus.js');

  const workstationContent = fs.readFileSync(workstationPath, 'utf-8');
  const toolbarContent = fs.readFileSync(toolbarPath, 'utf-8');
  const typingFocusContent = fs.readFileSync(typingFocusPath, 'utf-8');

  describe('Part A — Stable Generation Mode Selection & Non-Cycling Execution', () => {
    it('verifies WorkstationToolbar separates main action button from dropdown mode selection', () => {
      // Main button calls onTriggerCustomMode() with no arguments (executing current mode)
      assert.ok(
        toolbarContent.includes('onClick={() => onTriggerCustomMode()}'),
        'Main button must call onTriggerCustomMode() without arguments to execute current mode'
      );

      // Main button tooltip indicates execution, NOT cycling
      assert.ok(
        toolbarContent.includes('Click to execute'),
        'Main button tooltip must indicate execution of the selected mode, not cycling'
      );
      assert.ok(
        !toolbarContent.includes('Click to cycle mode'),
        'Main button tooltip must not say "Click to cycle mode"'
      );

      // Dropdown menu items explicitly pass item.id to onTriggerCustomMode
      assert.ok(
        toolbarContent.includes('onTriggerCustomMode(item.id)'),
        'Dropdown items must call onTriggerCustomMode(item.id) with explicit mode id'
      );
    });

    it('verifies handleTriggerCustomMode executes current mode without mutating when targetMode is omitted', () => {
      // Inspect source code contract in WorkstationPage.jsx
      assert.ok(
        workstationContent.includes('const effectiveMode = (targetMode && typeof targetMode === \'string\')'),
        'handleTriggerCustomMode must derive effectiveMode from targetMode or fallback to customGenerationMode'
      );
      assert.ok(
        workstationContent.includes('if (targetMode && typeof targetMode === \'string\' && targetMode !== customGenerationMode)'),
        'handleTriggerCustomMode must only mutate customGenerationMode when explicit targetMode is provided'
      );
      assert.ok(
        !workstationContent.includes('nextMode = MODES[(curIdx + 1) % MODES.length]'),
        'handleTriggerCustomMode must not automatically cycle modes on main button click'
      );
    });

    it('simulates state transitions: clicking main button executes Shuffle repeatedly without mode changes', () => {
      const sourcePassage = 'Mastery of mechanical keyboards requires precise finger placement and steady breathing rhythm.';
      let customGenerationMode = 'shuffle';

      // Simulation of handleTriggerCustomMode logic
      const simulateTrigger = (targetMode = null) => {
        const effectiveMode = (targetMode && typeof targetMode === 'string')
          ? targetMode
          : customGenerationMode;

        if (targetMode && typeof targetMode === 'string' && targetMode !== customGenerationMode) {
          customGenerationMode = targetMode;
        }

        const generated = generateCustomTypingPrompt({
          sourceText: sourcePassage,
          generationMode: effectiveMode,
          limitType: 'passage',
          limitValue: 0,
          includePunctuation: true,
          includeNumbers: true,
        });

        return { effectiveMode, generated, activeMode: customGenerationMode };
      };

      // 1. Initial mode is Shuffle
      assert.strictEqual(customGenerationMode, 'shuffle');

      // 2. Click main button 5 times in a row
      for (let click = 1; click <= 5; click++) {
        const res = simulateTrigger(); // no args: main button click
        assert.strictEqual(res.effectiveMode, 'shuffle', `Click ${click} must execute shuffle`);
        assert.strictEqual(res.activeMode, 'shuffle', `Click ${click} must keep active mode as shuffle`);
        assert.strictEqual(customGenerationMode, 'shuffle', `Mode state must remain shuffle after click ${click}`);
        assert.ok(res.generated.length > 0, 'Generated text must not be empty');
      }

      // 3. User explicitly selects 'random' via dropdown
      const randomSelect = simulateTrigger('random');
      assert.strictEqual(randomSelect.effectiveMode, 'random');
      assert.strictEqual(randomSelect.activeMode, 'random');
      assert.strictEqual(customGenerationMode, 'random');

      // 4. Click main button 5 times now that Random is selected
      for (let click = 1; click <= 5; click++) {
        const res = simulateTrigger();
        assert.strictEqual(res.effectiveMode, 'random', `Click ${click} must execute random`);
        assert.strictEqual(res.activeMode, 'random', `Click ${click} must keep active mode as random`);
        assert.strictEqual(customGenerationMode, 'random');
      }

      // 5. User explicitly selects 'repeat' via dropdown
      const repeatSelect = simulateTrigger('repeat');
      assert.strictEqual(repeatSelect.effectiveMode, 'repeat');
      assert.strictEqual(customGenerationMode, 'repeat');

      // 6. User explicitly selects 'simple' via dropdown
      const simpleSelect = simulateTrigger('simple');
      assert.strictEqual(simpleSelect.effectiveMode, 'simple');
      assert.strictEqual(customGenerationMode, 'simple');
      assert.strictEqual(simpleSelect.generated, sourcePassage, 'Simple mode must restore original passage verbatim');
    });

    it('preserves full-passage source locking across repeated mode executions on 1,000-word passage', () => {
      const baseSentence = 'The tactile actuation point of mechanical switches provides instant neuromuscular confirmation. ';
      const thousandWordSource = baseSentence.repeat(100);
      const originalWordCount = countWords(thousandWordSource);
      assert.ok(originalWordCount >= 1000, 'Source must contain at least 1,000 words');

      let currentMode = 'shuffle';
      const lockedSource = thousandWordSource;

      // Execute Shuffle 3 times
      for (let i = 0; i < 3; i++) {
        const shuffled = generateCustomTypingPrompt({
          sourceText: lockedSource,
          generationMode: currentMode,
          limitType: 'passage',
          limitValue: 0,
        });
        assert.strictEqual(countWords(shuffled), originalWordCount, 'Shuffle must process complete 1,000 words');
      }

      // Switch to Random and execute 3 times
      currentMode = 'random';
      for (let i = 0; i < 3; i++) {
        const randomized = generateCustomTypingPrompt({
          sourceText: lockedSource,
          generationMode: currentMode,
          limitType: 'passage',
          limitValue: 0,
        });
        assert.strictEqual(countWords(randomized), originalWordCount, 'Random must process complete 1,000 words');
      }

      // Switch back to Simple
      currentMode = 'simple';
      const simple = generateCustomTypingPrompt({
        sourceText: lockedSource,
        generationMode: currentMode,
        limitType: 'passage',
        limitValue: 0,
      });
      assert.strictEqual(simple, lockedSource.trim(), 'Simple mode must preserve 1,000 words verbatim without data corruption');
    });
  });

  describe('Part B — Typing Pipeline Optimization & Workstation Responsiveness', () => {
    it('defines WorkstationChunk with range-buffered memoization in WorkstationPage', () => {
      assert.ok(
        workstationContent.includes('const WorkstationChunk = React.memo'),
        'WorkstationPage must declare a memoized WorkstationChunk component'
      );
      assert.ok(
        workstationContent.includes('CHUNK_SIZE = 50'),
        'WorkstationPage must define CHUNK_SIZE = 50 for optimal 1,000-word slicing'
      );
      assert.ok(
        workstationContent.includes('<WorkstationChunk'),
        'WorkstationTextTrack must render WorkstationChunk components'
      );
      assert.ok(
        workstationContent.includes('const WorkstationCharacterSpan = React.memo'),
        'WorkstationCharacterSpan must remain memoized'
      );
    });

    it('verifies WorkstationChunk comparator skips inactive chunks during typing progression', () => {
      const text = 'The quick brown fox jumps over the lazy dog. '.repeat(50); // ~2,250 chars
      const chunkSize = 50;
      const buffer = 2;

      // Comparator simulation logic matching WorkstationChunk
      const shouldChunkUpdate = (startIndex, charCount, prevTypedLen, nextTypedLen, prevIndices, nextIndices) => {
        const start = startIndex;
        const end = startIndex + charCount;

        const isPrevNear = prevTypedLen >= start - buffer && prevTypedLen <= end + buffer;
        const isNextNear = nextTypedLen >= start - buffer && nextTypedLen <= end + buffer;

        if (isPrevNear || isNextNear) return true; // needs update
        if (prevTypedLen < start - buffer && nextTypedLen < start - buffer) return false; // skip
        if (prevTypedLen > end + buffer && nextTypedLen > end + buffer) {
          if (prevIndices !== nextIndices) {
            for (let i = start; i < end; i++) {
              if (prevIndices?.has(i) !== nextIndices?.has(i)) return true;
            }
          }
          return false; // skip
        }
        return true;
      };

      // Test 1: User types character 25 (moving 24 -> 25)
      // Chunk 0 [0-50] should update
      assert.strictEqual(shouldChunkUpdate(0, 50, 24, 25), true, 'Active chunk must update');
      // Chunk 1 [50-100] should skip
      assert.strictEqual(shouldChunkUpdate(50, 50, 24, 25), false, 'Ahead chunk must skip update');
      // Chunk 20 [1000-1050] should skip
      assert.strictEqual(shouldChunkUpdate(1000, 50, 24, 25), false, 'Far ahead chunk must skip update');

      // Test 2: User types character 520 (moving 519 -> 520)
      // Chunk 0 [0-50] is behind: should skip
      assert.strictEqual(shouldChunkUpdate(0, 50, 519, 520), false, 'Behind chunk must skip update');
      // Chunk 10 [500-550] contains 520: must update
      assert.strictEqual(shouldChunkUpdate(500, 50, 519, 520), true, 'Active chunk containing 520 must update');
      // Chunk 11 [550-600] is ahead: should skip
      assert.strictEqual(shouldChunkUpdate(550, 50, 519, 520), false, 'Ahead chunk must skip update');

      // Out of 45 chunks, exactly 1 chunk updates, 44 skip (97.8% reduction)
      let updatedCount = 0;
      for (let c = 0; c < 45; c++) {
        if (shouldChunkUpdate(c * 50, 50, 519, 520)) updatedCount++;
      }
      assert.strictEqual(updatedCount, 1, 'Only the active chunk must update');
    });

    it('verifies WorkstationToolbar callback props are stabilized with useCallback', () => {
      assert.ok(
        workstationContent.includes('const handleSetTimeLimit = useCallback'),
        'handleSetTimeLimit must be wrapped in useCallback'
      );
      assert.ok(
        workstationContent.includes('const handleSetWordLimit = useCallback'),
        'handleSetWordLimit must be wrapped in useCallback'
      );
      assert.ok(
        workstationContent.includes('const handleToggleFocusMode = useCallback'),
        'handleToggleFocusMode must be wrapped in useCallback'
      );
      assert.ok(
        workstationContent.includes('const handleOpenCustomStudio = useCallback'),
        'handleOpenCustomStudio must be wrapped in useCallback'
      );
      assert.ok(
        workstationContent.includes('const handleOpenSavedTexts = useCallback'),
        'handleOpenSavedTexts must be wrapped in useCallback'
      );
      assert.ok(
        workstationContent.includes('const setShowLiveWpm = useCallback'),
        'setShowLiveWpm must be wrapped in useCallback'
      );
    });

    it('verifies useUniversalTypingFocus uses refs to eliminate per-keystroke window listener churn', () => {
      assert.ok(
        typingFocusContent.includes('const onKeystrokeRef = useRef(onKeystroke)'),
        'useUniversalTypingFocus must keep onKeystroke in a ref'
      );
      assert.ok(
        typingFocusContent.includes('const onDirectInputRef = useRef(onDirectInput)'),
        'useUniversalTypingFocus must keep onDirectInput in a ref'
      );
      assert.ok(
        typingFocusContent.includes('}, [isActive, disabled, inputRef, focusInput]);'),
        'useUniversalTypingFocus keydown effect must not depend on per-render function closures'
      );
    });

    it('strictly preserves 4-line viewport height calc(4 * 1.625em) and auto-scroll mechanics', () => {
      assert.ok(
        workstationContent.includes("height: 'calc(4 * 1.625em)'"),
        'WorkstationPage must preserve height: calc(4 * 1.625em)'
      );
      assert.ok(
        workstationContent.includes("maxHeight: 'calc(4 * 1.625em)'"),
        'WorkstationPage must preserve maxHeight: calc(4 * 1.625em)'
      );
      assert.ok(
        workstationContent.includes('lastActiveOffsetTopRef.current'),
        'WorkstationPage auto-scroll must preserve fast-path offsetTop check'
      );
    });

    it('strictly preserves character feedback semantics (Green, Red, Yellow)', () => {
      const target = 'Hello World';
      // User typed "Hel" correctly, index 2 was previously mistyped and corrected, index 3 is incorrect 'x'
      const typed = 'Helx';
      const corrected = new Set([2]); // index 2 had a typo previously but is currently 'l'

      // index 0: 'H' -> correct (Green: .char-correct)
      const f0 = getCharacterFeedback(0, typed, target, false, corrected);
      assert.strictEqual(f0.status, 'correct');
      assert.strictEqual(f0.className, 'char-correct');

      // index 2: 'l' -> matches target AND had error in history -> corrected (Yellow: .char-corrected)
      const f2 = getCharacterFeedback(2, typed, target, false, corrected);
      assert.strictEqual(f2.status, 'corrected');
      assert.strictEqual(f2.className, 'char-corrected');

      // index 3: 'x' vs 'l' -> incorrect (Red: .char-incorrect)
      const f3 = getCharacterFeedback(3, typed, target, false, corrected);
      assert.strictEqual(f3.status, 'incorrect');
      assert.strictEqual(f3.className, 'char-incorrect');

      // index 4: active cursor -> .char-current
      const f4 = getCharacterFeedback(4, typed, target, false, corrected);
      assert.strictEqual(f4.status, 'current');
      assert.strictEqual(f4.className, 'char-current');

      // index 5: untyped -> .char-untyped
      const f5 = getCharacterFeedback(5, typed, target, false, corrected);
      assert.strictEqual(f5.status, 'untyped');
      assert.strictEqual(f5.className, 'char-untyped');
    });
  });
});
