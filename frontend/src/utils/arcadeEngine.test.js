import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ARCADE_GAMES,
  ARCADE_CATEGORIES,
  getGameById,
  ARCADE_WORDS,
} from '../data/arcadeGamesData.js';
import {
  calculateWpm,
  calculateAccuracy,
  getRandomWord,
  generateWordStream,
} from './arcadeEngine.js';
import {
  getArcadeRecords,
  getGameRecord,
  saveArcadeRecord,
  resetArcadeRecords,
} from './arcadeStorage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('KEYFLOW Arcade — 7 Masterpiece Games Integrity', () => {
  it('contains exactly seven curated arcade games', () => {
    assert.equal(ARCADE_GAMES.length, 7);
    assert.ok(ARCADE_CATEGORIES.length >= 4, 'categories must be defined');
  });

  it('contains all required game identities with unique IDs', () => {
    const expectedIds = ['cascade', 'sprint', 'hunter', 'ninja', 'runner', 'memory', 'boss'];
    const actualIds = ARCADE_GAMES.map((g) => g.id);
    assert.deepEqual(actualIds, expectedIds);
  });

  it('guarantees every game has complete metadata, instructions, and features', () => {
    ARCADE_GAMES.forEach((game) => {
      assert.ok(game.id, 'game must have id');
      assert.ok(game.title, `game ${game.id} must have title`);
      assert.ok(game.subtitle, `game ${game.id} must have subtitle`);
      assert.ok(game.description, `game ${game.id} must have description`);
      assert.ok(game.difficulty, `game ${game.id} must have difficulty`);
      assert.ok(game.image, `game ${game.id} must have image path`);
      assert.ok(Array.isArray(game.instructions), `game ${game.id} must have instructions array`);
      assert.ok(game.instructions.length >= 3, `game ${game.id} must have at least 3 instructions`);
      assert.ok(Array.isArray(game.features), `game ${game.id} must have features array`);
      assert.ok(game.features.length >= 3, `game ${game.id} must have at least 3 features`);
    });
  });

  it('retrieves games via getGameById utility correctly', () => {
    const sprint = getGameById('sprint');
    assert.equal(sprint.id, 'sprint');
    assert.equal(sprint.title, 'Speed Sprint');

    const boss = getGameById('boss');
    assert.equal(boss.id, 'boss');
    assert.equal(boss.title, 'Boss Battle');

    // Fallback on unknown ID
    const fallback = getGameById('unknown-mode');
    assert.equal(fallback.id, 'cascade');
  });

  it('verifies all 7 unique artwork assets exist in public directory and are non-empty', () => {
    const publicDir = path.resolve(__dirname, '../../public/arcade');
    ARCADE_GAMES.forEach((game) => {
      const assetFileName = path.basename(game.image);
      const fullPath = path.join(publicDir, assetFileName);
      assert.ok(fs.existsSync(fullPath), `Asset file must exist at ${fullPath}`);
      const stats = fs.statSync(fullPath);
      assert.ok(stats.size > 50000, `Asset file ${assetFileName} should be a real high-res image (>50KB)`);
    });
  });
});

describe('Arcade Engine & Metrics Verification', () => {
  it('accurately calculates standard typing WPM', () => {
    // 50 characters in 60 seconds = 10 words / 1 min = 10 WPM
    assert.equal(calculateWpm(50, 60), 10);
    // 300 characters in 60 seconds = 60 words / 1 min = 60 WPM
    assert.equal(calculateWpm(300, 60), 60);
    // 500 characters in 30 seconds = 100 words / 0.5 min = 200 WPM
    assert.equal(calculateWpm(500, 30), 200);
    // Zero conditions
    assert.equal(calculateWpm(0, 60), 0);
    assert.equal(calculateWpm(100, 0), 0);
  });

  it('accurately calculates typing accuracy percentage', () => {
    assert.equal(calculateAccuracy(100, 100), 100);
    assert.equal(calculateAccuracy(95, 100), 95);
    assert.equal(calculateAccuracy(0, 50), 0);
    assert.equal(calculateAccuracy(48, 50), 96);
    // Boundary guards
    assert.equal(calculateAccuracy(0, 0), 100);
  });

  it('generates random words within specified pools', () => {
    const shortWord = getRandomWord('short');
    assert.ok(ARCADE_WORDS.short.includes(shortWord));

    const mediumWord = getRandomWord('medium');
    assert.ok(ARCADE_WORDS.medium.includes(mediumWord));

    const longWord = getRandomWord('long');
    assert.ok(ARCADE_WORDS.long.includes(longWord));
  });

  it('generates continuous word streams for sprint and runner modes', () => {
    const stream = generateWordStream(15, 'medium');
    assert.equal(stream.length, 15);
    stream.forEach((word) => {
      assert.ok(typeof word === 'string' && word.length > 0);
    });
  });
});

describe('Arcade Storage & Personal Bests Persistence', () => {
  // Mock localStorage for node test runner
  const storageMock = {};
  global.localStorage = {
    getItem: (key) => storageMock[key] || null,
    setItem: (key, val) => {
      storageMock[key] = String(val);
    },
    removeItem: (key) => {
      delete storageMock[key];
    },
    clear: () => {
      Object.keys(storageMock).forEach((k) => delete storageMock[k]);
    },
  };

  global.window = {
    dispatchEvent: () => {},
  };

  it('initializes default records when storage is empty', () => {
    resetArcadeRecords();
    const records = getArcadeRecords();
    assert.ok(records.cascade);
    assert.ok(records.sprint);
    assert.ok(records.hunter);
    assert.ok(records.ninja);
    assert.ok(records.runner);
    assert.ok(records.memory);
    assert.ok(records.boss);
  });

  it('records attempt and flags new personal best for Speed Sprint WPM', () => {
    resetArcadeRecords();
    const res1 = saveArcadeRecord('sprint', { wpm: 85, accuracy: 96, wordsTyped: 40 });
    assert.equal(res1.isNewBest, true);
    assert.equal(res1.record.bestWpm, 85);

    const directLookup = getGameRecord('sprint');
    assert.equal(directLookup.bestWpm, 85);

    // Subsequent lower score is not a new best
    const res2 = saveArcadeRecord('sprint', { wpm: 75, accuracy: 92, wordsTyped: 35 });
    assert.equal(res2.isNewBest, false);
    assert.equal(res2.record.bestWpm, 85);
    assert.equal(res2.record.gamesPlayed, 2);

    // Higher score beats record
    const res3 = saveArcadeRecord('sprint', { wpm: 105, accuracy: 98, wordsTyped: 52 });
    assert.equal(res3.isNewBest, true);
    assert.equal(res3.record.bestWpm, 105);
    assert.equal(res3.record.gamesPlayed, 3);
  });

  it('records Boss Battle victory and defeat statistics', () => {
    resetArcadeRecords();
    const res = saveArcadeRecord('boss', { score: 1850, bossDefeated: true, durationSeconds: 42 });
    assert.equal(res.isNewBest, true);
    assert.equal(res.record.bossDefeated, true);
    assert.equal(res.record.fastestDefeatSeconds, 42);
  });
});
