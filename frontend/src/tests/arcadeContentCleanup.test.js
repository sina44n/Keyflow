import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ARCADE_GAMES } from '../data/arcadeGamesData.js';
import { GameRegistry } from '../utils/performance/GameRegistry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Phase 4: Arcade Content Cleanup Regression Suite', () => {
  const arcadeHubPath = path.resolve(__dirname, '../components/arcade/ArcadeHub.jsx');
  const arcadePagePath = path.resolve(__dirname, '../pages/ArcadePage.jsx');
  const arcadePreviewPath = path.resolve(__dirname, '../components/landing/ArcadePreview.jsx');
  const enLocalePath = path.resolve(__dirname, '../i18n/locales/en.js');

  const arcadeHubSrc = fs.readFileSync(arcadeHubPath, 'utf-8');
  const arcadePageSrc = fs.readFileSync(arcadePagePath, 'utf-8');
  const arcadePreviewSrc = fs.readFileSync(arcadePreviewPath, 'utf-8');
  const enLocaleSrc = fs.readFileSync(enLocalePath, 'utf-8');

  const bannedPromotionalPhrases = [
    '8 Playable Modes',
    '8 Progressive Tiers',
    'Adaptive WebGL / 2D',
    'Local Bests Persisted',
    'Total Games',
  ];

  describe('1. Unwanted Promotional Blocks Removal Verification', () => {
    bannedPromotionalPhrases.forEach((phrase) => {
      it(`guarantees "${phrase}" is completely absent from ArcadeHub`, () => {
        assert.ok(!arcadeHubSrc.includes(phrase), `ArcadeHub must not contain "${phrase}"`);
      });

      it(`guarantees "${phrase}" is completely absent from ArcadePage`, () => {
        assert.ok(!arcadePageSrc.includes(phrase), `ArcadePage must not contain "${phrase}"`);
      });

      it(`guarantees "${phrase}" is completely absent from ArcadePreview`, () => {
        assert.ok(!arcadePreviewSrc.includes(phrase), `ArcadePreview must not contain "${phrase}"`);
      });
    });

    it('guarantees the promotional overview stat band container is removed from ArcadeHub', () => {
      assert.ok(!arcadeHubSrc.includes('Bottom Overview Stat Band'), 'Overview stat band comment must be removed');
      assert.ok(!arcadeHubSrc.includes('arcade.totalGames'), 'arcade.totalGames reference must be removed from ArcadeHub');
      assert.ok(!arcadeHubSrc.includes('arcade.modesCount'), 'arcade.modesCount reference must be removed from ArcadeHub');
    });

    it('guarantees obsolete promotional keys and hardcoded game counts are absent from en.js locale', () => {
      assert.ok(!enLocaleSrc.includes('"arcade.totalGames"'), 'en.js must not contain arcade.totalGames');
      assert.ok(!enLocaleSrc.includes('"arcade.modesCount"'), 'en.js must not contain arcade.modesCount');
      assert.ok(!enLocaleSrc.includes('8 Playable Games'), 'en.js must not contain "8 Playable Games"');
      assert.ok(!enLocaleSrc.includes('7 Playable Games'), 'en.js must not contain "7 Playable Games"');
    });
  });

  describe('2. DARK WARRIOR 3D Absence Verification', () => {
    it('strictly guarantees DARK WARRIOR is NOT present in ARCADE_GAMES', () => {
      const gameIds = ARCADE_GAMES.map((g) => g.id.toLowerCase());
      const gameTitles = ARCADE_GAMES.map((g) => g.title.toLowerCase());

      assert.ok(!gameIds.includes('warrior'), 'Warrior must not exist in ARCADE_GAMES');
      assert.ok(!gameIds.includes('dark_warrior'), 'dark_warrior must not exist in ARCADE_GAMES');
      assert.ok(!gameIds.includes('darkwarrior'), 'darkwarrior must not exist in ARCADE_GAMES');
      assert.ok(!gameTitles.some((t) => t.includes('dark warrior')), 'Dark Warrior title must not exist');
    });

    it('strictly guarantees DARK WARRIOR is not referenced in ArcadeHub or ArcadePage', () => {
      assert.ok(!arcadeHubSrc.toLowerCase().includes('dark warrior'), 'ArcadeHub must not reference Dark Warrior');
      assert.ok(!arcadePageSrc.toLowerCase().includes('dark warrior'), 'ArcadePage must not reference Dark Warrior');
    });
  });

  describe('3. Preservation of All Authentic Arcade Games', () => {
    const expectedGames = [
      { id: 'cascade', title: 'Key Cascade' },
      { id: 'sprint', title: 'Speed Sprint' },
      { id: 'hunter', title: 'Word Hunter' },
      { id: 'ninja', title: 'Key Ninja' },
      { id: 'runner', title: 'Word Runner' },
      { id: 'memory', title: 'Typing Memory' },
      { id: 'boss', title: 'Boss Battle' },
      { id: 'nitro', title: 'Nitro Type Pro' },
      { id: 'stickman', title: 'STICKMAN FIGHT' },
    ];

    it('preserves exactly 9 authentic arcade games in the registry', () => {
      assert.strictEqual(ARCADE_GAMES.length, 9, 'Must contain exactly 9 arcade games');
    });

    expectedGames.forEach((expected) => {
      it(`preserves game "${expected.title}" (${expected.id}) with valid config and instructions`, () => {
        const game = ARCADE_GAMES.find((g) => g.id === expected.id);
        assert.ok(game, `Game ${expected.id} must exist in ARCADE_GAMES`);
        assert.strictEqual(game.title, expected.title);
        assert.ok(game.description && game.description.length > 10, `${expected.id} must have description`);
        assert.ok(Array.isArray(game.instructions) && game.instructions.length >= 3, `${expected.id} must have instructions`);
        assert.ok(Array.isArray(game.features) && game.features.length >= 3, `${expected.id} must have features`);
      });

      it(`guarantees GameRegistry registers "${expected.id}"`, () => {
        const registered = GameRegistry.getGameDefinition(expected.id);
        assert.ok(registered, `${expected.id} must be registered in GameRegistry`);
      });
    });
  });

  describe('4. Arcade Hub Grid Layout & Hierarchy Integrity', () => {
    it('ensures ArcadeHub maintains responsive grid layout for game cards', () => {
      assert.ok(arcadeHubSrc.includes('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'), 'Game cards grid must maintain responsive layout');
      assert.ok(arcadeHubSrc.includes('filteredGames.map'), 'ArcadeHub must map filteredGames to ArcadeGameCard');
    });

    it('ensures ArcadeHub preserves audio and graphics settings controls', () => {
      assert.ok(arcadeHubSrc.includes('GlobalGameSettingsModal'), 'ArcadeHub must preserve settings modal');
      assert.ok(arcadeHubSrc.includes('setSoundOn'), 'ArcadeHub must preserve sound toggle');
    });
  });
});
