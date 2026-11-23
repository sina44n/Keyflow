import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Workstation Toolbar Precision & Pause/Resume Upgrade Contract', () => {
  const toolbarPath = path.resolve(__dirname, '../components/workstation/WorkstationToolbar.jsx');
  const workstationPath = path.resolve(__dirname, '../pages/WorkstationPage.jsx');
  const shortcutsPath = path.resolve(__dirname, '../components/workstation/ShortcutsModal.jsx');

  const toolbarContent = fs.readFileSync(toolbarPath, 'utf-8');
  const workstationContent = fs.readFileSync(workstationPath, 'utf-8');
  const shortcutsContent = fs.readFileSync(shortcutsPath, 'utf-8');

  describe('1. Workstation Toolbar Layout & Precision Alignment', () => {
    it('groups all 6 practice modes (Time, Words, Passage, Accuracy, Custom, Competition) in Row 1', () => {
      assert.ok(toolbarContent.includes("setMode('timed')"), 'Time mode present');
      assert.ok(toolbarContent.includes("setMode('words')"), 'Words mode present');
      assert.ok(toolbarContent.includes("setMode('passage')"), 'Passage mode present');
      assert.ok(toolbarContent.includes("setMode('accuracy')"), 'Accuracy mode present');
      assert.ok(toolbarContent.includes('onOpenCustomStudio'), 'Custom mode present');
      assert.ok(toolbarContent.includes('onOpenCompetitions'), 'Competition mode present');

      // Shared container for Row 1 modes
      assert.ok(
        toolbarContent.includes('p-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]'),
        'Practice modes are grouped in a unified segmented container'
      );
    });

    it('standardizes duration options with equal-width w-12 buttons in Row 1 right', () => {
      assert.ok(toolbarContent.includes('h-7 w-12 rounded-lg'), 'Duration buttons must use equal width (w-12) and h-7');
      assert.ok(toolbarContent.includes('15, 30, 60, 120'), 'Must support 15s, 30s, 60s, 120s durations');
    });

    it('organizes Row 2 with Session Controls on the left and Settings/Actions on the right', () => {
      // Row 2 left: Dynamic Generation Mode, Saved Passages, History, Focus
      assert.ok(toolbarContent.includes('onTriggerCustomMode'), 'Row 2 left has custom generation mode');
      assert.ok(toolbarContent.includes('onOpenSavedTexts'), 'Row 2 left has saved texts');
      assert.ok(toolbarContent.includes('onOpenHistory'), 'Row 2 left has practice history');
      assert.ok(toolbarContent.includes('toggleFocusMode'), 'Row 2 left has focus toggle');

      // Standardized 32px height across row 2 buttons
      assert.ok(toolbarContent.includes('h-8 px-2.5 rounded-xl'), 'Row 2 controls use standardized h-8 px-2.5');
    });

    it('provides centered minimal Reset button between typing viewport and keyboard without toolbar overflow', () => {
      // Must not have text-labeled Reset button inside the toolbar (preventing toolbar overflow)
      assert.ok(!toolbarContent.includes('<span>Reset</span>'), 'Toolbar does not contain text-labeled Reset button');
      // Reset is positioned in WorkstationPage as an icon-only centered control
      assert.ok(
        workstationContent.includes('Centered Minimal Reset Control'),
        'WorkstationPage includes centered minimal Reset control'
      );
      assert.ok(
        workstationContent.includes('onClick={handleReset}'),
        'Centered Reset triggers handleReset'
      );
      assert.ok(
        workstationContent.includes('aria-label="Reset typing session"'),
        'Centered Reset has accessible aria-label'
      );
    });

    it('includes a dedicated Pause / Resume action button in the toolbar', () => {
      assert.ok(toolbarContent.includes('onTogglePause'), 'Toolbar accepts onTogglePause handler');
      assert.ok(toolbarContent.includes('isPaused'), 'Toolbar accepts isPaused state');
      assert.ok(toolbarContent.includes('isRunning'), 'Toolbar accepts isRunning state');
      assert.ok(toolbarContent.includes('Play className="w-3.5 h-3.5'), 'Renders Play icon when paused');
      assert.ok(toolbarContent.includes('Pause className="w-3.5 h-3.5'), 'Renders Pause icon when running');
      assert.ok(toolbarContent.includes('animate-pulse'), 'Applies subtle pulse feedback when paused');
    });
  });

  describe('2. Workstation Pause / Resume Engine & Session State', () => {
    it('defines explicit session states (idle, running, paused, completed)', () => {
      assert.ok(workstationContent.includes("sessionState"), 'WorkstationPage tracks explicit sessionState');
      assert.ok(workstationContent.includes("'idle'"), 'Supports idle session state');
      assert.ok(workstationContent.includes("'running'"), 'Supports running session state');
      assert.ok(workstationContent.includes("'paused'"), 'Supports paused session state');
      assert.ok(workstationContent.includes("'completed'"), 'Supports completed session state');
    });

    it('tracks active elapsed time excluding paused intervals', () => {
      assert.ok(workstationContent.includes('totalActiveMsRef'), 'Tracks cumulative active milliseconds');
      assert.ok(workstationContent.includes('runningSegmentStartRef'), 'Tracks active segment start timestamp');
      assert.ok(workstationContent.includes('getActiveElapsedMs'), 'Implements getActiveElapsedMs()');
      assert.ok(workstationContent.includes('getActiveElapsedSeconds'), 'Implements getActiveElapsedSeconds()');
    });

    it('implements handlePause, handleResume, and handleTogglePause handlers', () => {
      assert.ok(workstationContent.includes('const handlePause = useCallback'), 'Implements handlePause');
      assert.ok(workstationContent.includes('const handleResume = useCallback'), 'Implements handleResume');
      assert.ok(workstationContent.includes('const handleTogglePause = useCallback'), 'Implements handleTogglePause');
    });

    it('freezes pacing guide line animation when paused', () => {
      assert.ok(
        workstationContent.includes('if (isPaused) {') && workstationContent.includes('return;'),
        'Pacing guide cancels or skips animation frames while paused'
      );
    });

    it('handles typing input and auto-resumes smoothly when paused', () => {
      assert.ok(
        workstationContent.includes('if (isCompleted) return;') &&
          workstationContent.includes('isPausedRef.current'),
        'handleInputChange guards against completed session and coordinates with isPausedRef'
      );
    });

    it('resumes instantly on valid typing keypress inside typing container', () => {
      assert.ok(
        workstationContent.includes('isValidTypingKey(e)') &&
          workstationContent.includes('handleResume()'),
        'Valid typing keypress in typing input resumes paused session'
      );
    });

    it('auto-pauses when the tab or window loses visibility', () => {
      assert.ok(
        workstationContent.includes('visibilitychange') && workstationContent.includes('handlePause()'),
        'Listens to document visibilitychange and pauses active session'
      );
    });

    it('supports global keyboard shortcut Alt + P to toggle pause/resume', () => {
      assert.ok(
        workstationContent.includes("key === 'p'") && workstationContent.includes('handleTogglePause()'),
        'Alt + P toggles pause/resume globally in Workstation'
      );
    });

    it('displays clear PAUSED status indicators in both Telemetry bar and typing viewport', () => {
      assert.ok(
        workstationContent.includes('role="status"') && workstationContent.includes('PAUSED'),
        'Renders PAUSED indicator with accessibility role="status"'
      );
      assert.ok(
        workstationContent.includes('Click or Space to Resume'),
        'Viewport displays helpful instructions to resume'
      );
    });
  });

  describe('3. Shortcuts Modal Documentation', () => {
    it('documents Alt + P shortcut in ShortcutsModal', () => {
      assert.ok(
        shortcutsContent.includes('Alt + P') && shortcutsContent.includes('Pause / Resume active typing session'),
        'ShortcutsModal documents Alt + P for pause/resume'
      );
    });
  });
});

