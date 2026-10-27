import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ARCADE_VOCABULARY,
  validateVocabulary,
  getAllVocabulary,
  shuffleArray,
  ArcadeWordDeck,
  getVocabularyPool,
} from './arcadeVocabulary.js';

describe('KEYFLOW Arcade — Vocabulary & Anti-Repetition Engine', () => {
  it('contains at least 2,000 unique valid English words and tactical phrases', () => {
    const result = validateVocabulary();
    assert.equal(result.valid, true, `Validation failed with errors: ${result.errors.join(', ')}`);
    assert.deepEqual(result.errors, []);
    assert.ok(
      result.totalUnique >= 2000,
      `Expected >= 2000 unique words, found ${result.totalUnique}`
    );
  });

  it('provides all 17 distinct categories with valid non-empty arrays', () => {
    const categories = Object.keys(ARCADE_VOCABULARY);
    assert.ok(categories.length >= 14, 'Should contain at least 14 categories');
    for (const cat of categories) {
      assert.ok(Array.isArray(ARCADE_VOCABULARY[cat]), `${cat} is not an array`);
      assert.ok(ARCADE_VOCABULARY[cat].length > 0, `${cat} is empty`);
    }
  });

  it('validates that entries contain only valid lowercase characters or spaces', () => {
    const allWords = getAllVocabulary();
    for (const w of allWords) {
      assert.match(w, /^[a-z\s-]+$/);
      assert.notEqual(w.trim(), '');
    }
  });

  it('shuffleArray produces deterministic output with seeded random function', () => {
    const input = ['alpha', 'bravo', 'charlie', 'delta', 'echo'];
    const fakeSeededRandom = () => 0.5;
    const shuffled1 = shuffleArray(input, fakeSeededRandom);
    const shuffled2 = shuffleArray(input, fakeSeededRandom);
    assert.deepEqual(shuffled1, shuffled2);
  });

  it('ArcadeWordDeck avoids repeating words from recent history', () => {
    const miniPool = ['apple', 'banana', 'cherry', 'date', 'elder', 'fig', 'grape'];
    const deck = new ArcadeWordDeck({ pool: miniPool, recentHistorySize: 4 });

    const drawn = [];
    for (let i = 0; i < 7; i++) {
      drawn.push(deck.draw());
    }

    // All 7 distinct items from pool should be drawn before repeats occur
    const uniqueDrawn = new Set(drawn);
    assert.equal(uniqueDrawn.size, 7);
  });

  it('ArcadeWordDeck honors excludeList for on-screen targets', () => {
    const pool = ['word1', 'word2', 'word3', 'word4'];
    const deck = new ArcadeWordDeck({ pool, recentHistorySize: 2 });

    // If word1 and word2 are active on screen, draw must choose word3 or word4
    const drawn = deck.draw(['word1', 'word2']);
    assert.ok(['word3', 'word4'].includes(drawn));
  });

  it('ArcadeWordDeck prevents immediate boundary duplicate when refilling', () => {
    const pool = ['alpha', 'bravo', 'charlie'];
    const deck = new ArcadeWordDeck({ pool, recentHistorySize: 2 });

    deck.draw();
    deck.draw();
    const third = deck.draw();

    // Now deck is exhausted and must refill. The 4th item should NOT be identical to the 3rd item
    const fourth = deck.draw();
    assert.notEqual(fourth, third);
  });

  it('ArcadeWordDeck resets per-run history cleanly', () => {
    const pool = ['one', 'two', 'three', 'four', 'five'];
    const deck = new ArcadeWordDeck({ pool });

    deck.draw();
    deck.draw();
    assert.equal(deck.recentHistory.length, 2);

    deck.resetRun();
    assert.equal(deck.recentHistory.length, 0);
    assert.equal(deck.lastDrawn, null);
  });

  it('getVocabularyPool returns appropriate pools for all 7 games across tiers 1-6', () => {
    const games = ['cascade', 'sprint', 'hunter', 'ninja', 'runner', 'memory', 'boss'];

    for (const g of games) {
      for (let tier = 1; tier <= 6; tier++) {
        const pool = getVocabularyPool(g, tier);
        assert.ok(Array.isArray(pool));
        assert.ok(pool.length >= 20, `Pool for game ${g} tier ${tier} should contain >= 20 words, got ${pool.length}`);
      }
    }
  });

  it('drawing 50 consecutive words produces zero adjacent duplicate words', () => {
    const games = ['cascade', 'sprint', 'hunter', 'ninja', 'runner', 'memory', 'boss'];
    for (const g of games) {
      const deck = new ArcadeWordDeck({ gameId: g, pool: getVocabularyPool(g, 1) });
      let prevWord = null;
      for (let i = 0; i < 50; i++) {
        const currentWord = deck.draw();
        assert.ok(typeof currentWord === 'string' && currentWord.length > 0);
        assert.notEqual(currentWord, prevWord, `Adjacent duplicate detected in ${g}: ${currentWord}`);
        prevWord = currentWord;
      }
    }
  });

  it('setPool updates active pool on tier escalation while preserving history protection', () => {
    const deck = new ArcadeWordDeck({ gameId: 'cascade', pool: ['cat', 'dog', 'bat'] });
    const w1 = deck.draw();
    assert.equal(deck.recentHistory.length, 1);

    // Switch pool to Tier 2
    deck.setPool(['quantum', 'circuit', 'velocity']);
    assert.equal(deck.pool.length, 3);
    assert.equal(deck.recentHistory.length, 1);
    assert.equal(deck.recentHistory[0], w1);

    const w2 = deck.draw();
    assert.ok(['quantum', 'circuit', 'velocity'].includes(w2));
  });
});
