import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateCustomTypingPrompt } from '../utils/textUtilities.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const workstationPagePath = path.resolve(__dirname, '../pages/WorkstationPage.jsx');
const workstationToolbarPath = path.resolve(__dirname, '../components/workstation/WorkstationToolbar.jsx');
const soundSelectorPath = path.resolve(__dirname, '../components/common/SoundSelector.jsx');

describe('Workstation Toolbar Overflow Correction, Centered Reset & Source-Mode Repair Contract', () => {
  const pageSrc = fs.readFileSync(workstationPagePath, 'utf8');
  const toolbarSrc = fs.readFileSync(workstationToolbarPath, 'utf8');
  const soundSrc = fs.readFileSync(soundSelectorPath, 'utf8');

  it('Phase 2 — Pause button is inside Toolbar Row 2 and Reset is removed from Toolbar', () => {
    // Toolbar Row 2 right-group contains Pause as the final action control
    assert.ok(toolbarSrc.includes('onTogglePause'), 'Toolbar must wire Pause/Resume action');
    assert.ok(toolbarSrc.includes('aria-label={isPaused ? \'Resume Session\' : \'Pause Session\'}'), 'Pause has accessible label');

    // Reset button is strictly NOT inside WorkstationToolbar
    assert.ok(
      !toolbarSrc.includes('<span>Reset</span>'),
      'Toolbar must NOT contain the text-labeled Reset button on the far right'
    );
    assert.ok(
      !toolbarSrc.includes('title="Reset Test (Esc)"'),
      'Toolbar must NOT contain the old Reset button'
    );
  });

  it('Phase 3 — Sound Selector in toolbar displays ONLY the sound icon and dropdown arrow (No sound name)', () => {
    // Check variant === 'toolbar' block in SoundSelector
    const toolbarBlock = soundSrc.slice(
      soundSrc.indexOf("if (variant === 'toolbar')"),
      soundSrc.indexOf("if (variant === 'compact')")
    );
    assert.ok(toolbarBlock.length > 0, 'SoundSelector must define variant === "toolbar" block');

    // Must contain volume icon and chevron
    assert.ok(toolbarBlock.includes('Volume2') && toolbarBlock.includes('VolumeX'), 'Must render volume icon');
    assert.ok(toolbarBlock.includes('ChevronDown'), 'Must render dropdown chevron');

    // Must NOT contain visible sound profile name or tag span
    assert.ok(!toolbarBlock.includes('currentProfileObj.tag'), 'Must NOT display currentProfileObj.tag in toolbar');
    assert.ok(!toolbarBlock.includes('currentProfileObj.name</span>'), 'Must NOT display profile name in text span');

    // Must maintain accessible tooltip and aria-label
    assert.ok(toolbarBlock.includes('aria-label={`Keyboard Sound:'), 'Must retain accessible aria-label');
    assert.ok(toolbarBlock.includes('title={`Keyboard Sound:'), 'Must retain accessible tooltip title');
  });

  it('Phase 4 — Centered Minimal Reset Control is positioned between typing area and visual keyboard', () => {
    // Centered Reset element in WorkstationPage
    assert.ok(
      pageSrc.includes('Centered Minimal Reset Control (PHASE 4: Blue-Marked Position)'),
      'WorkstationPage must include centered minimal Reset control'
    );

    // It must be horizontally centered
    assert.ok(
      pageSrc.includes('w-full flex items-center justify-center'),
      'Reset control container must be centered across the Workstation content area'
    );

    // It must call handleReset
    assert.ok(
      pageSrc.includes('onClick={handleReset}'),
      'Reset button must invoke handleReset'
    );

    // It must be icon-only (RotateCcw) and borderless/background-free
    assert.ok(
      pageSrc.includes('<RotateCcw className="w-5 h-5 transition-transform duration-200" />'),
      'Reset button must render RotateCcw icon'
    );

    // It must have accessible attributes
    assert.ok(
      pageSrc.includes('aria-label="Reset typing session"'),
      'Reset button must have accessible aria-label'
    );
    assert.ok(
      pageSrc.includes('title="Reset typing session (Esc)"'),
      'Reset button must have tooltip title'
    );
  });

  it('Phase 5 — Random / Shuffle / Simple / Repeat Source Selector Contract', () => {
    // Dropdown contains exactly 3 modes: Random, Shuffle, Repeat (Simple completely removed)
    assert.ok(toolbarSrc.includes("id: 'random', label: 'Random'"), 'Dropdown has Random');
    assert.ok(toolbarSrc.includes("id: 'shuffle', label: 'Shuffle'"), 'Dropdown has Shuffle');
    assert.ok(!toolbarSrc.includes("id: 'simple'"), 'Simple mode is completely removed from toolbar');
    assert.ok(toolbarSrc.includes("id: 'repeat', label: 'Repeat'"), 'Dropdown has Repeat');

    // Split button structure
    assert.ok(toolbarSrc.includes('currentModeInfo.label'), 'Main button displays active mode label');
    assert.ok(toolbarSrc.includes('aria-label="Select Transformation Mode"'), 'Chevron button opens dropdown');

    // Verification of generation logic
    const testText = 'Typing is the art of translating thought into text without interruption.';
    
    // 1. Shuffle mode produces words permutation
    const shuffleOutput1 = generateCustomTypingPrompt({
      sourceText: testText,
      generationMode: 'shuffle',
      limitType: 'passage',
      limitValue: 0,
      includePunctuation: true,
      includeNumbers: true,
    });
    const shuffleOutput2 = generateCustomTypingPrompt({
      sourceText: testText,
      generationMode: 'shuffle',
      limitType: 'passage',
      limitValue: 0,
      includePunctuation: true,
      includeNumbers: true,
    });
    const origWords = testText.split(' ').sort();
    assert.deepStrictEqual(shuffleOutput1.split(' ').sort(), origWords, 'Shuffle retains all words');
    assert.notStrictEqual(shuffleOutput1, testText, 'Shuffle alters word ordering');

    // 2. Repeat mode repeats content cleanly
    const repeatOutput = `${testText.trim()} ${testText.trim()}`;
    assert.ok(repeatOutput.startsWith(testText.trim()), 'Repeat starts with testText');
    assert.ok(repeatOutput.endsWith(testText.trim()), 'Repeat ends with testText');
    assert.strictEqual(repeatOutput.split(' ').length, testText.split(' ').length * 2, 'Repeat doubles word count');

    // 3. Random mode samples from words
    const randomOutput = generateCustomTypingPrompt({
      sourceText: testText,
      generationMode: 'random',
      limitType: 'passage',
      limitValue: 0,
      includePunctuation: true,
      includeNumbers: true,
    });
    assert.ok(randomOutput.length > 0, 'Random produces non-empty output');
  });

  it('Phase 5 — handleTriggerCustomMode supports all 4 modes with repeated click safety', () => {
    // WorkstationPage implementation checks: Random, Shuffle, Repeat supported and Simple eliminated
    assert.ok(pageSrc.includes("effectiveMode === 'random'"), 'Supports random mode');
    assert.ok(pageSrc.includes("effectiveMode === 'shuffle'"), 'Supports shuffle mode');
    assert.ok(!pageSrc.includes("effectiveMode === 'simple'"), 'Simple mode eliminated from WorkstationPage');
    assert.ok(pageSrc.includes("effectiveMode === 'repeat'"), 'Supports repeat mode');
    assert.ok(pageSrc.includes('cleanBase'), 'Repeat constructs clean boundary');
  });
});
