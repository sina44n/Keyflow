/**
 * KEYFLOW Phase 7.52: Full-Passage Custom Text Persistence, Source-Locked Modes & Viewport Tests
 * =============================================================================================
 * Covers all 8 required verification scenarios:
 * 1. Full custom passage save with multiple paragraphs and intact newlines.
 * 2. Account persistence and multi-user isolation.
 * 3. Active source locking across Random, Shuffle, Repeat, Simple.
 * 4. 1,000-word passage transformation without truncation.
 * 5. Repeated rapid mode switching without state degradation.
 * 6. Four-line viewport geometry preservation (calc(4 * 1.625em)).
 * 7. Automatic scroll mechanism integrity and line progression.
 * 8. Explicit deletion semantics.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  generateCustomTypingPrompt,
  countWords,
  removeZeroWidth,
  shuffleArray,
} from '../utils/textUtilities.js';
import {
  getSavedCustomTexts,
  saveCustomText,
  updateCustomText,
  deleteCustomText,
} from '../utils/customTextStorage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory localStorage mock for node test environment
const mockStorage = {};
global.window = {
  localStorage: {
    getItem: (key) => mockStorage[key] || null,
    setItem: (key, val) => {
      mockStorage[key] = String(val);
    },
    removeItem: (key) => {
      delete mockStorage[key];
    },
    clear: () => {
      for (const k of Object.keys(mockStorage)) delete mockStorage[k];
    },
  },
  dispatchEvent: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
};
global.localStorage = global.window.localStorage;

describe('Phase 7.52: Workstation Custom Passage & Transformation Engine', () => {
  beforeEach(() => {
    global.window.localStorage.clear();
  });

  describe('Scenario 1 — Full Custom Passage Save & Line Break Preservation', () => {
    it('persists complete multi-paragraph passage including newlines without truncation', () => {
      const multiParagraph = [
        'Paragraph 1: Muscle memory is the key to fluid typing velocity.',
        'Paragraph 2: Fingers must return instinctively to the tactile home row.',
        'Paragraph 3: Speed emerges naturally from continuous, relaxed cadence.',
      ].join('\n\n');

      const saved = saveCustomText({
        title: '3-Paragraph Biomechanical Drill',
        text: multiParagraph,
        userId: 'user_scenario_1',
      });

      assert.ok(saved.id);
      assert.strictEqual(saved.text, multiParagraph);
      assert.ok(saved.text.includes('\n\n'), 'Double newlines must remain intact');
      assert.strictEqual(saved.text.split('\n\n').length, 3, 'Must contain exactly 3 paragraphs');

      // Reload from storage
      const reloaded = getSavedCustomTexts('user_scenario_1');
      const found = reloaded.find((t) => t.id === saved.id);
      assert.ok(found, 'Saved passage must be retrieved after storage reload');
      assert.strictEqual(found.text, multiParagraph);
    });
  });

  describe('Scenario 2 — Account Persistence & Multi-User Isolation', () => {
    it('guarantees User B cannot see or access User A custom passages in storage', () => {
      const userAPassage = saveCustomText({
        title: 'User A Secret Test',
        text: 'Top secret custom typing exercise for User A only.',
        userId: 'user_A_id',
      });

      // User A retrieves their passages
      const userATexts = getSavedCustomTexts('user_A_id');
      assert.ok(userATexts.some((t) => t.id === userAPassage.id));

      // User B retrieves their passages
      const userBTexts = getSavedCustomTexts('user_B_id');
      assert.ok(!userBTexts.some((t) => t.id === userAPassage.id), 'User B must not see User A passage');

      // Guest retrieves passages
      const guestTexts = getSavedCustomTexts(null);
      assert.ok(!guestTexts.some((t) => t.id === userAPassage.id), 'Guest must not see User A passage');
    });
  });

  describe('Scenario 3 — Active Source Locking Across Modes', () => {
    it('locks to Passage A and executes all modes on Passage A without switching source', () => {
      const passageA = 'alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu';
      const passageB = 'apple banana cherry date elderberry fig grape honeydew';
      const passageC = 'red green blue yellow cyan magenta black white orange purple';

      const savedA = saveCustomText({ title: 'Passage A', text: passageA, userId: 'user_lock' });
      const savedB = saveCustomText({ title: 'Passage B', text: passageB, userId: 'user_lock' });
      const savedC = saveCustomText({ title: 'Passage C', text: passageC, userId: 'user_lock' });

      // Simulate source locking to Passage A
      const lockedSource = savedA.text;
      const lockedId = savedA.id;
      const originalWords = lockedSource.split(/\s+/);

      // 1. Random mode on Passage A
      const randomPrompt = generateCustomTypingPrompt({
        sourceText: lockedSource,
        generationMode: 'random',
        limitType: 'passage',
        limitValue: 0,
      });
      const randomWords = randomPrompt.split(/\s+/);
      assert.strictEqual(randomWords.length, originalWords.length, 'Random must match source word count');
      randomWords.forEach((w) => {
        assert.ok(originalWords.includes(w), `Word "${w}" in random mode must originate from Passage A`);
        assert.ok(!passageB.includes(w), `Word "${w}" must NOT come from Passage B`);
        assert.ok(!passageC.includes(w), `Word "${w}" must NOT come from Passage C`);
      });

      // 2. Shuffle mode on Passage A
      const shufflePrompt = generateCustomTypingPrompt({
        sourceText: lockedSource,
        generationMode: 'shuffle',
        limitType: 'passage',
        limitValue: 0,
      });
      const shuffleWords = shufflePrompt.split(/\s+/);
      assert.strictEqual(shuffleWords.length, originalWords.length, 'Shuffle must preserve exact word count');
      assert.deepStrictEqual([...shuffleWords].sort(), [...originalWords].sort(), 'Shuffle must contain identical multiset of words');
      shuffleWords.forEach((w) => {
        assert.ok(!passageB.includes(w), `Shuffle must not contain Passage B words`);
      });

      // 3. Repeat mode on Passage A
      const repeatPrompt = generateCustomTypingPrompt({
        sourceText: lockedSource,
        generationMode: 'repeat',
        limitType: 'passage',
        limitValue: 0,
      });
      const repeatWords = repeatPrompt.split(/\s+/);
      assert.ok(repeatWords.length >= originalWords.length * 2, 'Repeat must repeat sequence');
      assert.strictEqual(repeatWords[0], originalWords[0]);
      assert.strictEqual(repeatWords[originalWords.length], originalWords[0], 'Repeat must cycle back to start of Passage A');

      // 4. Simple mode on Passage A
      const simplePrompt = generateCustomTypingPrompt({
        sourceText: lockedSource,
        generationMode: 'simple',
        limitType: 'passage',
        limitValue: 0,
      });
      assert.strictEqual(simplePrompt, passageA, 'Simple must reproduce Passage A verbatim');
    });
  });

  describe('Scenario 4 & 5 — Long Passage (1,000 Words) Transformation & Repeated Mode Switching', () => {
    it('operates on 1,000 words without truncation and preserves source across repeated mode switches', () => {
      // Build a deterministic 1,000-word passage
      const vocabulary = ['keystroke', 'rhythm', 'cadence', 'velocity', 'finger', 'matrix', 'tactile', 'anchor', 'flow', 'precision'];
      const words = [];
      for (let i = 0; i < 1000; i++) {
        words.push(`${vocabulary[i % vocabulary.length]}_${i}`);
      }
      const thousandWordPassage = words.join(' ');
      assert.strictEqual(countWords(thousandWordPassage), 1000);

      // The unmutated source of truth
      const originalSourcePassage = thousandWordPassage;

      // Cycle 1: Random
      const r1 = generateCustomTypingPrompt({
        sourceText: originalSourcePassage,
        generationMode: 'random',
        limitType: 'passage',
        limitValue: 0,
      });
      assert.strictEqual(countWords(r1), 1000, 'Random mode must produce full 1,000 words');
      assert.ok(!r1.startsWith('the be of and'), 'Must not fallback to default vocabulary when source is provided');

      // Cycle 2: Shuffle
      const s1 = generateCustomTypingPrompt({
        sourceText: originalSourcePassage,
        generationMode: 'shuffle',
        limitType: 'passage',
        limitValue: 0,
      });
      assert.strictEqual(countWords(s1), 1000, 'Shuffle mode must produce full 1,000 words');
      assert.notStrictEqual(s1, originalSourcePassage, 'Shuffled passage should differ in ordering');

      // Cycle 3: Repeat
      const rep1 = generateCustomTypingPrompt({
        sourceText: originalSourcePassage,
        generationMode: 'repeat',
        limitType: 'passage',
        limitValue: 0,
      });
      assert.ok(countWords(rep1) >= 1000, 'Repeat mode must contain at least 1,000 words');

      // Cycle 4: Simple
      const sim1 = generateCustomTypingPrompt({
        sourceText: originalSourcePassage,
        generationMode: 'simple',
        limitType: 'passage',
        limitValue: 0,
      });
      assert.strictEqual(sim1, originalSourcePassage, 'Simple mode must restore full 1,000 words verbatim');

      // Cycle 5: Re-run Random, confirming originalSourcePassage was never degraded
      const r2 = generateCustomTypingPrompt({
        sourceText: originalSourcePassage,
        generationMode: 'random',
        limitType: 'passage',
        limitValue: 0,
      });
      assert.strictEqual(countWords(r2), 1000, 'Subsequent Random transformation must maintain 1,000 words');
    });
  });

  describe('Scenario 6 & 7 — Four-Line Viewport & Automatic Scroll Preservation', () => {
    it('validates WorkstationPage maintains exact 4-line viewport height calc(4 * 1.625em) and auto-scroll', () => {
      const pagePath = path.resolve(__dirname, '../pages/WorkstationPage.jsx');
      const content = fs.readFileSync(pagePath, 'utf-8');

      // 1. Exactly 4 lines height contract
      assert.ok(content.includes("height: 'calc(4 * 1.625em)'"), 'Viewport must enforce exactly 4 lines height');
      assert.ok(content.includes("maxHeight: 'calc(4 * 1.625em)'"), 'Viewport must enforce exactly 4 lines maxHeight');
      assert.ok(content.includes('overflow-hidden'), 'Viewport must hide overflow lines');

      // 2. GPU-accelerated translation layer
      assert.ok(content.includes('translate3d(0, -${scrollOffsetPx}px, 0)'), 'Text track must translate along Y-axis');

      // 3. Precision scroll calculation
      assert.ok(content.includes('const targetScrollTop = Math.max(0, spanTop - spanHeight)'), 'Preserves targetScrollTop calculation');
      assert.ok(content.includes('const targetScrollLine = Math.round(targetScrollTop / computedLineHeight)'), 'Preserves line row calculation');

      // 4. Source-locked state variables
      assert.ok(content.includes('originalSourcePassage'), 'WorkstationPage must maintain originalSourcePassage state');
      assert.ok(content.includes('handleApplySavedPassage'), 'WorkstationPage must provide dedicated handleApplySavedPassage');
    });
  });

  describe('Scenario 8 — Explicit Deletion Semantics', () => {
    it('deletes only the selected custom passage while keeping other passages intact', () => {
      const p1 = saveCustomText({ title: 'Keep Me 1', text: 'First passage to keep.', userId: 'user_del' });
      const p2 = saveCustomText({ title: 'Delete Me', text: 'Second passage to delete.', userId: 'user_del' });
      const p3 = saveCustomText({ title: 'Keep Me 2', text: 'Third passage to keep.', userId: 'user_del' });

      let current = getSavedCustomTexts('user_del');
      assert.strictEqual(current.filter((p) => p.id === p2.id).length, 1);

      // Explicit delete
      const remaining = deleteCustomText(p2.id, 'user_del');
      assert.ok(!remaining.some((p) => p.id === p2.id), 'Deleted passage must be gone');
      assert.ok(remaining.some((p) => p.id === p1.id), 'p1 must remain intact');
      assert.ok(remaining.some((p) => p.id === p3.id), 'p3 must remain intact');

      // Verify reloaded storage
      const reloaded = getSavedCustomTexts('user_del');
      assert.ok(!reloaded.some((p) => p.id === p2.id));
      assert.ok(reloaded.some((p) => p.id === p1.id));
      assert.ok(reloaded.some((p) => p.id === p3.id));
    });
  });
});
