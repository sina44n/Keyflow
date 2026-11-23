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

describe('Workstation Toolbar Two-Row Restructuring & Generation Modes Contract', () => {
  const pageSrc = fs.readFileSync(workstationPagePath, 'utf8');
  const toolbarSrc = fs.readFileSync(workstationToolbarPath, 'utf8');

  it('Phase 2 — Academy Button Label displays exactly "Explore Academy"', () => {
    assert.ok(
      pageSrc.includes('Explore Academy'),
      'WorkstationPage header must contain button labeled "Explore Academy"'
    );
    assert.ok(
      !pageSrc.includes("{t('hero.exploreAcademy') || 'Academy'}"),
      'Old translation placeholder must not be present in WorkstationPage'
    );
    assert.ok(
      pageSrc.includes("onClick={() => navigate('/academy')}"),
      'Must navigate to /academy'
    );
  });

  it('Phase 3 — "Custom Active Edit" badge is completely eliminated from the toolbar', () => {
    assert.ok(
      !toolbarSrc.includes('Custom Active'),
      'WorkstationToolbar must NOT contain the visible "Custom Active" badge'
    );
    assert.ok(
      !toolbarSrc.includes('>Edit</button>'),
      'WorkstationToolbar must NOT contain the inline "Edit" link for custom active badge'
    );
  });

  it('Phase 4 — Desktop Toolbar strictly structured in Two Rows', () => {
    // Row 1 desktop non-wrapping
    assert.ok(
      toolbarSrc.includes('ROW 1: Practice Modes (Left) & Contextual Options (Right)'),
      'Row 1 comment must be present'
    );
    assert.ok(
      toolbarSrc.includes('lg:flex-nowrap'),
      'Row 1 must have flex-nowrap on lg viewports to ensure single row'
    );

    // Row 1 right group has ml-auto
    assert.ok(
      toolbarSrc.includes('ml-auto'),
      'Right group must have ml-auto to push contextual controls to the right'
    );

    // Contextual options in Row 1: Time, Words, Passage, Accuracy
    assert.ok(toolbarSrc.includes("mode === 'timed'"), 'Timed options on row 1 right');
    assert.ok(toolbarSrc.includes("mode === 'words'"), 'Words options on row 1 right');
    assert.ok(toolbarSrc.includes("mode === 'passage'"), 'Passage selector on row 1 right');
    assert.ok(toolbarSrc.includes("mode === 'accuracy'"), 'Accuracy target badge on row 1 right');
    assert.ok(toolbarSrc.includes('98%+ Target Precision'), 'Accuracy mode displays 98%+ Target Precision badge');

    // Row 2 desktop non-wrapping
    assert.ok(
      toolbarSrc.includes('ROW 2: Session Controls (Left) & Settings / Actions (Right)'),
      'Row 2 comment must be present'
    );
    assert.ok(
      toolbarSrc.includes('flex flex-wrap items-center justify-start gap-1.5 pt-2 border-t border-[var(--border)]/40 w-full lg:flex-nowrap'),
      'Row 2 must have flex-nowrap on lg viewports to ensure single row with cohesive gap-1.5 spacing'
    );
  });

  it('Phase 9 — Random Dropdown offers Random, Shuffle, Repeat options and updates button', () => {
    // Dropdown contains Random, Shuffle, Repeat (Simple completely removed)
    assert.ok(toolbarSrc.includes("id: 'random', label: 'Random'"), 'Dropdown has Random');
    assert.ok(toolbarSrc.includes("id: 'shuffle', label: 'Shuffle'"), 'Dropdown has Shuffle');
    assert.ok(!toolbarSrc.includes("id: 'simple'"), 'Simple mode is completely removed from toolbar');
    assert.ok(toolbarSrc.includes("id: 'repeat', label: 'Repeat'"), 'Dropdown has Repeat');

    // Initial state in WorkstationPage defaults to random
    assert.ok(
      pageSrc.includes("localStorage.getItem('keyflow_workstation_custom_gen_mode') || 'random'"),
      'customGenerationMode state must default to "random"'
    );

    // Test text generation logic for all modes
    const originalText = 'The quick brown fox jumps over the lazy dog';
    
    // Simple mode restores original text
    const simpleRes = generateCustomTypingPrompt({
      sourceText: originalText,
      generationMode: 'simple',
      limitType: 'passage',
      limitValue: 0,
      includePunctuation: true,
      includeNumbers: true,
    });
    assert.strictEqual(simpleRes, originalText);

    // Shuffle mode randomizes words
    const shuffleRes = generateCustomTypingPrompt({
      sourceText: originalText,
      generationMode: 'shuffle',
      limitType: 'passage',
      limitValue: 0,
      includePunctuation: true,
      includeNumbers: true,
    });
    const origWords = originalText.split(' ').sort();
    const shuffledWords = shuffleRes.split(' ').sort();
    assert.deepStrictEqual(shuffledWords, origWords);

    // Repeat mode repeats content
    const repeatRes = generateCustomTypingPrompt({
      sourceText: originalText,
      generationMode: 'repeat',
      limitType: 'passage',
      limitValue: 0,
      includePunctuation: true,
      includeNumbers: true,
    });
    assert.ok(repeatRes.split(' ').length >= origWords.length * 2);

    // Random mode samples from words
    const randomRes = generateCustomTypingPrompt({
      sourceText: originalText,
      generationMode: 'random',
      limitType: 'passage',
      limitValue: 0,
      includePunctuation: true,
      includeNumbers: true,
    });
    assert.ok(randomRes.length > 0);
  });

  it('Phase 10 — Custom Text Safety & Cross-Mode Persistence', () => {
    // Ensure currentTargetText logic preserves customPrompt and active custom text across modes
    assert.ok(
      pageSrc.includes('if (customPrompt) {'),
      'currentTargetText must prioritize customPrompt across modes'
    );
    assert.ok(
      pageSrc.includes("if (mode === 'words' && wordLimit > 0) {"),
      'Words mode must respect active custom text word limits'
    );
  });
});
