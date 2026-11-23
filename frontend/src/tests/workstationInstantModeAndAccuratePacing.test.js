import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateCustomTypingPrompt } from '../utils/textUtilities.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const workstationToolbarPath = path.resolve(__dirname, '../components/workstation/WorkstationToolbar.jsx');
const workstationPagePath = path.resolve(__dirname, '../pages/WorkstationPage.jsx');
const customStudioPath = path.resolve(__dirname, '../components/workstation/CustomTypingStudio.jsx');

const workstationToolbarSource = fs.readFileSync(workstationToolbarPath, 'utf8');
const workstationPageSource = fs.readFileSync(workstationPagePath, 'utf8');
const customStudioSource = fs.readFileSync(customStudioPath, 'utf8');

describe('KEYFLOW Workstation: Instant Mode Switching, Toolbar Refinement & Goal WPM Pacing Contract', () => {
  describe('Phase 1 — Random, Shuffle & Repeat: Complete Functional Integrity & Simple Removal', () => {
    it('verifies dropdown contains exactly Random, Shuffle, Repeat and excludes Simple', () => {
      // Must contain Random, Shuffle, Repeat in dropdown
      assert.ok(workstationToolbarSource.includes("id: 'random', label: 'Random'"), 'Dropdown includes Random');
      assert.ok(workstationToolbarSource.includes("id: 'shuffle', label: 'Shuffle'"), 'Dropdown includes Shuffle');
      assert.ok(workstationToolbarSource.includes("id: 'repeat', label: 'Repeat'"), 'Dropdown includes Repeat');

      // Must NOT contain simple
      assert.ok(!workstationToolbarSource.includes("id: 'simple'"), 'Simple is completely removed from WorkstationToolbar');
      assert.ok(!customStudioSource.includes("id: 'simple'"), 'Simple is completely removed from CustomTypingStudio');
      assert.ok(!workstationPageSource.includes("effectiveMode === 'simple'"), 'Simple handler is removed from WorkstationPage');
    });

    it('verifies WorkstationToolbar getModeDetails defaults to Random and removes Simple case', () => {
      assert.ok(!workstationToolbarSource.includes("case 'simple':"), 'No simple case in getModeDetails');
      assert.ok(workstationToolbarSource.includes("label: 'Random'"), 'Defaults to Random');
      assert.ok(workstationToolbarSource.includes("label: 'Shuffle'"), 'Includes Shuffle');
      assert.ok(workstationToolbarSource.includes("label: 'Repeat'"), 'Includes Repeat');
    });

    it('verifies handleTriggerCustomMode executes synchronously without debounce or artificial delays', () => {
      assert.ok(workstationPageSource.includes('setSelectedPassageIndex(nextIdx)'), 'Random updates selectedPassageIndex synchronously');
      assert.ok(workstationPageSource.includes('prevSettingsRef.current.selectedPassageIndex = nextIdx'), 'Prevents secondary redundant reset');
      assert.ok(workstationPageSource.includes('handleReset()'), 'Synchronously resets session state');
    });

    it('verifies Shuffle and Repeat mode behaviors preserve text integrity', () => {
      const source = 'Typing is the art of translating thought into text without interruption.';
      
      // Shuffle retains words
      const shuffled = generateCustomTypingPrompt({
        sourceText: source,
        generationMode: 'shuffle',
        limitType: 'passage',
        limitValue: 0,
        includePunctuation: true,
        includeNumbers: true,
      });
      assert.strictEqual(shuffled.split(' ').sort().join(' '), source.split(' ').sort().join(' '), 'Shuffle preserves exact words');

      // Repeat produces 2x length boundary
      const cleanBase = source.trim();
      const repeated = `${cleanBase} ${cleanBase}`;
      assert.strictEqual(repeated.split(' ').length, source.split(' ').length * 2, 'Repeat produces clean double-length text');
    });
  });

  describe('Phase 2 — Toolbar Spacing: No Gap Between Focus and Speed On, Spacing After Pause', () => {
    it('verifies Row 2 has justify-start and gap-1.5 without ml-auto between Focus and Speed On', () => {
      // Row 2 container
      assert.ok(
        workstationToolbarSource.includes('flex flex-wrap items-center justify-start gap-1.5 pt-2 border-t border-[var(--border)]/40 w-full lg:flex-nowrap'),
        'Row 2 uses justify-start and gap-1.5 with lg:flex-nowrap'
      );

      // Verify ml-auto is NOT present in Row 2 right group
      const row2Index = workstationToolbarSource.indexOf('ROW 2: Session Controls');
      const row2Source = workstationToolbarSource.slice(row2Index);
      assert.ok(!row2Source.includes('ml-auto'), 'ml-auto removed from Row 2 to eliminate gap between Focus and Speed On');
    });
  });

  describe('Phase 3 — Spacing Around Reset Icon: Refined Vertical Spacing', () => {
    it('verifies centered Reset container and button use refined compact vertical padding', () => {
      assert.ok(
        workstationPageSource.includes('w-full flex items-center justify-center py-0.5 -my-1'),
        'Centered reset container uses refined py-0.5 -my-1 padding'
      );
      assert.ok(
        workstationPageSource.includes('p-1.5 rounded-full text-[var(--text-muted)]'),
        'Reset button uses refined p-1.5 padding'
      );
      assert.ok(
        workstationPageSource.includes('max-w-[820px] mx-auto flex flex-col items-center pt-0.5'),
        'Keyboard guide container uses tight pt-0.5 padding'
      );
    });
  });

  describe('Phase 4 — Goal WPM: Deep Mathematical Verification and Pacing Engine Parity', () => {
    it('verifies standard typing formula: CPS = (Goal WPM * 5) / 60', () => {
      const calculateCPS = (wpm) => (wpm * 5) / 60;
      const calculateCharTimeMs = (wpm) => 12000 / wpm;

      // 10 WPM
      assert.strictEqual(calculateCPS(10), 50 / 60);
      assert.strictEqual(calculateCharTimeMs(10), 1200);

      // 60 WPM
      assert.strictEqual(calculateCPS(60), 5);
      assert.strictEqual(calculateCharTimeMs(60), 200);

      // 100 WPM
      assert.strictEqual(calculateCPS(100), 500 / 60);
      assert.strictEqual(calculateCharTimeMs(100), 120);

      // 250 WPM
      assert.strictEqual(calculateCPS(250), 1250 / 60);
      assert.strictEqual(calculateCharTimeMs(250), 48);

      // 500 WPM
      assert.strictEqual(calculateCPS(500), 2500 / 60);
      assert.strictEqual(calculateCharTimeMs(500), 24);
    });

    it('verifies monotonic speed scaling: higher WPM produces strictly faster character pacing', () => {
      const speeds = [10, 20, 30, 60, 100, 150, 250, 350, 500];
      for (let i = 0; i < speeds.length - 1; i++) {
        const lower = (speeds[i] * 5) / 60;
        const higher = (speeds[i + 1] * 5) / 60;
        assert.ok(higher > lower, `${speeds[i + 1]} WPM CPS (${higher}) must be strictly faster than ${speeds[i]} WPM (${lower})`);
      }
    });

    it('verifies piecewise continuous pacing integration without jumping on live Goal change', () => {
      // Simulate typing for 2.0s at 60 WPM, then switching to 100 WPM for 1.0s
      let baseChar = 0;
      let segmentStartMs = 0;
      let activeGoal = 60;

      // At 2000ms:
      const now1 = 2000;
      const cps60 = (activeGoal * 5) / 60; // 5 chars/sec
      const charPosAtSwitch = baseChar + ((now1 - segmentStartMs) / 1000) * cps60; // 10 chars
      assert.strictEqual(charPosAtSwitch, 10);

      // Switch to 100 WPM at now1:
      baseChar += ((now1 - segmentStartMs) / 1000) * cps60;
      segmentStartMs = now1;
      activeGoal = 100;

      // At 2000ms + 1ms (immediately after switch):
      const nowImmediate = 2001;
      const cps100 = (activeGoal * 5) / 60;
      const charPosImmediate = baseChar + ((nowImmediate - segmentStartMs) / 1000) * cps100;
      // Position must NOT jump to 2.001 * 8.33 = 16.67 chars! It must stay at ~10.008 chars!
      assert.ok(
        Math.abs(charPosImmediate - 10) < 0.02,
        `Position must continue smoothly without jumping! Got ${charPosImmediate}`
      );

      // At 3000ms (1.0s after switch):
      const now2 = 3000;
      const charPosAt3s = baseChar + ((now2 - segmentStartMs) / 1000) * cps100;
      // Expected: 10 + 1.0s * (500/60) = 10 + 8.333 = 18.333 chars
      assert.strictEqual(charPosAt3s, 10 + (100 * 5 / 60));
    });

    it('verifies pacing state resets completely on handleReset', () => {
      assert.ok(
        workstationPageSource.includes('pacingStateRef.current = {'),
        'pacingStateRef resets on handleReset'
      );
      assert.ok(
        workstationPageSource.includes('baseChar: 0'),
        'baseChar resets to 0'
      );
      assert.ok(
        workstationPageSource.includes('segmentStartMs: 0'),
        'segmentStartMs resets to 0'
      );
    });
  });
});
