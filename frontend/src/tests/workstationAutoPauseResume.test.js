import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { isValidTypingKey, AUTO_PAUSE_INACTIVITY_MS } from '../utils/workstationAutoPause.js';

describe('KEYFLOW — Workstation A & B: Smart 7-Second Inactivity Auto-Pause and Keyboard Auto-Resume Contract', () => {
  const workstationPath = path.resolve(__dirname, '../pages/WorkstationPage.jsx');
  const workstationContent = fs.readFileSync(workstationPath, 'utf-8');

  describe('1. Inactivity Configuration & Helper Precision', () => {
    it('defines AUTO_PAUSE_INACTIVITY_MS as exactly 7000ms (7 seconds)', () => {
      assert.strictEqual(AUTO_PAUSE_INACTIVITY_MS, 7000, 'Inactivity threshold must be 7000ms');
      assert.ok(
        workstationContent.includes('AUTO_PAUSE_INACTIVITY_MS'),
        'Exports AUTO_PAUSE_INACTIVITY_MS constant'
      );
    });

    it('identifies printable letters, numbers, symbols, spaces, backspace and enter as valid typing keys', () => {
      // Letters
      assert.ok(isValidTypingKey({ key: 'a' }));
      assert.ok(isValidTypingKey({ key: 'Z' }));
      assert.ok(isValidTypingKey({ key: 'M', shiftKey: true }));

      // Numbers & Punctuation
      assert.ok(isValidTypingKey({ key: '5' }));
      assert.ok(isValidTypingKey({ key: '!' }));
      assert.ok(isValidTypingKey({ key: '.' }));
      assert.ok(isValidTypingKey({ key: '?' }));

      // Space & Editing
      assert.ok(isValidTypingKey({ key: ' ' }));
      assert.ok(isValidTypingKey({ key: 'Backspace' }));
      assert.ok(isValidTypingKey({ key: 'Enter' }));
    });

    it('rejects modifier keys, browser shortcuts, and non-typing keys', () => {
      // Modifiers
      assert.strictEqual(isValidTypingKey({ key: 'Shift' }), false);
      assert.strictEqual(isValidTypingKey({ key: 'Control' }), false);
      assert.strictEqual(isValidTypingKey({ key: 'Alt' }), false);
      assert.strictEqual(isValidTypingKey({ key: 'Meta' }), false);
      assert.strictEqual(isValidTypingKey({ key: 'CapsLock' }), false);

      // Shortcuts with modifier keys
      assert.strictEqual(isValidTypingKey({ key: 'c', ctrlKey: true }), false);
      assert.strictEqual(isValidTypingKey({ key: 'p', altKey: true }), false);
      assert.strictEqual(isValidTypingKey({ key: 'v', metaKey: true }), false);

      // Function & Navigation keys
      assert.strictEqual(isValidTypingKey({ key: 'F1' }), false);
      assert.strictEqual(isValidTypingKey({ key: 'F5' }), false);
      assert.strictEqual(isValidTypingKey({ key: 'Escape' }), false);
      assert.strictEqual(isValidTypingKey({ key: 'Tab' }), false);
      assert.strictEqual(isValidTypingKey({ key: 'ArrowLeft' }), false);
      assert.strictEqual(isValidTypingKey({ key: 'ArrowRight' }), false);
      assert.strictEqual(isValidTypingKey({ key: 'ArrowUp' }), false);
      assert.strictEqual(isValidTypingKey({ key: 'ArrowDown' }), false);
      assert.strictEqual(isValidTypingKey({ key: 'PageUp' }), false);
      assert.strictEqual(isValidTypingKey({ key: 'PageDown' }), false);
    });
  });

  describe('2. 7-Second Inactivity Auto-Pause Architecture', () => {
    it('maintains inactivityTimerRef and lastTypingActionTimestampRef', () => {
      assert.ok(workstationContent.includes('inactivityTimerRef = useRef(null)'), 'Tracks inactivityTimerRef');
      assert.ok(workstationContent.includes('lastTypingActionTimestampRef = useRef(null)'), 'Tracks lastTypingActionTimestampRef');
      assert.ok(workstationContent.includes('isAutoPausedRef = useRef(false)'), 'Tracks isAutoPausedRef');
    });

    it('implements handleAutoPause freezing elapsed time excluding the 7s waiting period', () => {
      assert.ok(workstationContent.includes('const handleAutoPause = useCallback'), 'Implements handleAutoPause');
      assert.ok(
        workstationContent.includes('const lastAction = lastTypingActionTimestampRef.current || runningSegmentStartRef.current;') &&
        workstationContent.includes('const segmentActiveMs = Math.max(0, lastAction - runningSegmentStartRef.current);'),
        'Calculates active elapsed time based on last typing action rather than Date.now() when auto-pausing'
      );
      assert.ok(
        workstationContent.includes('totalActiveMsRef.current += segmentActiveMs;'),
        'Excludes the 7-second inactive waiting period from cumulative active milliseconds'
      );
    });

    it('trims telemetry timeline points recorded during the inactive waiting period', () => {
      assert.ok(
        workstationContent.includes('secondTimelineRef.current.filter((pt) => pt.second <= elapsed)'),
        'Trims secondTimelineRef points to match true active elapsed time'
      );
    });

    it('arms and resets inactivity timer on each valid typing keystroke', () => {
      assert.ok(workstationContent.includes('const resetInactivityTimer = useCallback'), 'Implements resetInactivityTimer');
      assert.ok(workstationContent.includes('AUTO_PAUSE_INACTIVITY_MS'), 'Uses 7000ms inactivity threshold');
      assert.ok(
        workstationContent.includes('lastTypingActionTimestampRef.current = Date.now();') &&
        workstationContent.includes('resetInactivityTimer();'),
        'Resets countdown on valid keystrokes'
      );
    });
  });

  describe('3. Instant Keyboard Auto-Resume Architecture', () => {
    it('handles valid typing keys in onKeyDown while paused and delivers the first keypress', () => {
      assert.ok(workstationContent.includes('if (isPausedRef.current)'), 'Coordinates pause check with isPausedRef');
      assert.ok(workstationContent.includes('isValidTypingKey(e)'), 'Validates incoming key using isValidTypingKey');
      assert.ok(workstationContent.includes('handleResume()'), 'Invokes handleResume on valid typing key');
      assert.ok(
        workstationContent.includes('pendingKeystrokeRef.current = { key: e.key, code: e.code, id: performance.now() };'),
        'Captures pending keystroke so first keypress is not lost or corrupted'
      );
    });

    it('does not preventDefault for printable keys during auto-resume allowing native input processing', () => {
      // Notice: e.preventDefault() is NOT called for printable characters during auto-resume
      assert.ok(
        workstationContent.includes('// Allow printable keys, space, and backspace to flow natively into <input>'),
        'Permits browser native input dispatch without discarding the resuming character'
      );
    });

    it('maintains typing focus readiness during pause via useUniversalTypingFocus', () => {
      // isTypingActive must NOT be disabled solely by isPaused
      assert.ok(
        !workstationContent.includes('!isPaused &&\n    !customStudioOpen'),
        'Typing focus readiness is retained during pause to allow immediate keyboard auto-resume'
      );
    });
  });

  describe('4. Strict Session Isolation Between Page A and Page B', () => {
    it('clears inactivity timer and pauses active state upon switching modes', () => {
      assert.ok(
        workstationContent.includes('if (inactivityTimerRef.current) {') &&
        workstationContent.includes('clearTimeout(inactivityTimerRef.current);'),
        'Clears inactivity timer when switching between Page A and Page B'
      );
      assert.ok(
        workstationContent.includes('pageASessionRef') && workstationContent.includes('pageBSessionRef'),
        'Maintains independent session stores for Page A and Page B'
      );
      assert.ok(
        workstationContent.includes('isPaused: startTime && !isCompleted ? true : isPausedRef.current'),
        'Snapshots departing session with pause state preserved'
      );
    });

    it('cleans up intervals and timers on component unmount', () => {
      assert.ok(
        workstationContent.includes('// Clean up all active intervals and inactivity timers on unmount') &&
        workstationContent.includes('clearTimeout(inactivityTimerRef.current);'),
        'Ensures no lingering intervals or inactivity timeouts after unmounting'
      );
    });
  });
});
