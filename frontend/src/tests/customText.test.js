import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  removeZeroWidth,
  normalizeSmartQuotes,
  normalizeWhitespace,
  normalizeLineBreaks,
  countWords,
  countCharacters,
  generateCustomTypingPrompt,
} from '../utils/textUtilities.js';
import {
  getSavedCustomTexts,
  saveCustomText,
  updateCustomText,
  deleteCustomText,
} from '../utils/customTextStorage.js';

// In-memory localStorage mock for node test runner
const mockStore = {};
global.window = {
  localStorage: {
    getItem: (key) => mockStore[key] || null,
    setItem: (key, val) => {
      mockStore[key] = String(val);
    },
    removeItem: (key) => {
      delete mockStore[key];
    },
    clear: () => {
      for (const k of Object.keys(mockStore)) delete mockStore[k];
    },
  },
};
global.localStorage = global.window.localStorage;

describe('KEYFLOW Text Utilities Engine', () => {
  it('removes zero-width characters and hidden unicode markers', () => {
    const dirty = 'Hello\u200B \u200CWorld\uFEFF\u200D!';
    const cleaned = removeZeroWidth(dirty);
    assert.strictEqual(cleaned, 'Hello World!');
  });

  it('normalizes curly quotes, em dashes, and ellipses', () => {
    const raw = '“The master’s craft” — it’s… amazing';
    const normalized = normalizeSmartQuotes(raw);
    assert.strictEqual(normalized, '"The master\'s craft" - it\'s... amazing');
  });

  it('collapses repeated whitespace cleanly', () => {
    const spaced = '  Quick    brown   fox  ';
    assert.strictEqual(normalizeWhitespace(spaced), 'Quick brown fox');
  });

  it('converts linebreaks to single spaces', () => {
    const multiline = 'Line 1\r\nLine 2\nLine 3';
    assert.strictEqual(normalizeLineBreaks(multiline), 'Line 1 Line 2 Line 3');
  });

  it('accurately counts words and characters with space or pipe delimiter', () => {
    const text = 'apple banana orange';
    assert.strictEqual(countWords(text), 3);
    assert.strictEqual(countCharacters(text), 19);

    const piped = 'apple | banana | orange';
    assert.strictEqual(countWords(piped, '|'), 3);
  });

  it('generates simple mode prompts with word limits', () => {
    const prompt = generateCustomTypingPrompt({
      sourceText: 'one two three four five six seven eight',
      generationMode: 'simple',
      delimiter: ' ',
      limitType: 'words',
      limitValue: 4,
    });
    assert.strictEqual(prompt, 'one two three four');
  });

  it('generates repeat mode prompts repeating sequences to target limit', () => {
    const prompt = generateCustomTypingPrompt({
      sourceText: 'alpha beta',
      generationMode: 'repeat',
      delimiter: ' ',
      limitType: 'words',
      limitValue: 6,
    });
    assert.strictEqual(prompt, 'alpha beta alpha beta alpha beta');
  });

  it('supports pipe delimiters in custom prompt generation', () => {
    const prompt = generateCustomTypingPrompt({
      sourceText: 'alpha | beta | gamma',
      generationMode: 'simple',
      delimiter: '|',
      limitType: 'words',
      limitValue: 2,
    });
    assert.strictEqual(prompt, 'alpha|beta');
  });
});

describe('KEYFLOW Saved Custom Text Storage', () => {
  beforeEach(() => {
    global.window.localStorage.clear();
  });

  it('populates starter texts when storage is first opened', () => {
    const texts = getSavedCustomTexts('user_test_1');
    assert.ok(Array.isArray(texts));
    assert.ok(texts.length >= 3);
  });

  it('saves, updates, and deletes custom texts with user isolation', () => {
    const saved = saveCustomText({
      title: 'My Custom Drill',
      text: 'The quick brown fox jumps effortlessly.',
      userId: 'user_42',
    });
    assert.ok(saved.id.startsWith('ct_'));
    assert.strictEqual(saved.title, 'My Custom Drill');
    assert.strictEqual(saved.wordCount, 6);

    // Update
    const updated = updateCustomText(
      saved.id,
      { title: 'Renamed Drill', text: 'Slightly longer text for typing.' },
      'user_42'
    );
    assert.strictEqual(updated.title, 'Renamed Drill');
    assert.strictEqual(updated.wordCount, 5);

    // Isolation: user_99 should not see user_42 newly added entry
    const user99Texts = getSavedCustomTexts('user_99');
    assert.ok(!user99Texts.some((t) => t.id === saved.id));

    // Delete
    const remaining = deleteCustomText(saved.id, 'user_42');
    assert.ok(!remaining.some((t) => t.id === saved.id));
  });
});
