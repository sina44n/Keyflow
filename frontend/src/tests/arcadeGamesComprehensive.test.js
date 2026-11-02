import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { ARCADE_GAMES } from '../data/arcadeGamesData.js';
import {
  calculateDifficultyTier,
  getKeyCascadeConfig,
  getSpeedSprintConfig,
  getWordHunterConfig,
  getKeyNinjaConfig,
  getWordRunnerConfig,
  getTypingMemoryConfig,
  getBossBattleConfig,
  DIFFICULTY_TIERS,
} from '../utils/arcadeDifficulty.js';
import { RACING_TIERS } from '../utils/racingDifficulty.js';
import { GameRegistry } from '../utils/performance/GameRegistry.js';

describe('KEYFLOW 9-Game Complete Arcade Audit & Difficulty Scaling', () => {
  it('ARCADE_GAMES registry contains exactly 9 curated games and zero Dark Warrior references', () => {
    assert.strictEqual(ARCADE_GAMES.length, 9, 'Must contain exactly 9 curated arcade games');

    const expectedIds = [
      'cascade',
      'sprint',
      'hunter',
      'ninja',
      'runner',
      'memory',
      'boss',
      'nitro',
      'stickman',
    ];

    const actualIds = ARCADE_GAMES.map((g) => g.id);
    for (const id of expectedIds) {
      assert.ok(actualIds.includes(id), `Missing game: ${id}`);
    }

    // Strictly ensure warrior / dark warrior does not exist in active registry
    assert.ok(!actualIds.includes('warrior'), 'Warrior should be completely removed from ARCADE_GAMES');
    assert.ok(!actualIds.includes('dark_warrior'), 'dark_warrior should not exist in ARCADE_GAMES');
  });

  it('GameRegistry registers all 9 games with appropriate rendering technology and settings', () => {
    const all = GameRegistry.getAllRegisteredGames();
    const ids = all.map((g) => g.id);

    assert.ok(ids.includes('stickman'), 'GameRegistry must have stickman registered');
    assert.ok(ids.includes('nitro'), 'GameRegistry must have nitro registered');
    assert.ok(ids.includes('cascade'), 'GameRegistry must have cascade registered');
    assert.ok(ids.includes('sprint'), 'GameRegistry must have sprint registered');
    assert.ok(ids.includes('hunter'), 'GameRegistry must have hunter registered');
    assert.ok(ids.includes('ninja'), 'GameRegistry must have ninja registered');
    assert.ok(ids.includes('runner'), 'GameRegistry must have runner registered');
    assert.ok(ids.includes('memory'), 'GameRegistry must have memory registered');
    assert.ok(ids.includes('boss'), 'GameRegistry must have boss registered');
  });

  describe('Progressive Difficulty Tier Calculations', () => {
    it('calculates tier 1 for initial start with 0 metrics', () => {
      const result = calculateDifficultyTier({
        activeSeconds: 0,
        completedCount: 0,
        score: 0,
        currentStreak: 0,
        errorCount: 0,
      });

      assert.strictEqual(result.tier, 1);
      assert.strictEqual(result.tierName, 'Warm-up');
      assert.strictEqual(result.isMaxTier, false);
    });

    it('scales up cleanly as score, completed count, and active seconds rise', () => {
      const advanced = calculateDifficultyTier({
        activeSeconds: 150,
        completedCount: 45,
        score: 3000,
        currentStreak: 12,
        errorCount: 1,
      });

      assert.ok(advanced.tier >= 3, `Tier should be >= 3, got ${advanced.tier}`);
      assert.ok(advanced.performanceQuotient > 1.0, 'Streak should grant performance quotient boost');
    });

    it('safely caps at Tier 6 (Master) without exceeding bound', () => {
      const master = calculateDifficultyTier({
        activeSeconds: 9999,
        completedCount: 999,
        score: 999999,
        currentStreak: 50,
        errorCount: 0,
      });

      assert.strictEqual(master.tier, 6);
      assert.strictEqual(master.isMaxTier, true);
      assert.strictEqual(master.tierName, 'Master');
    });

    it('applies adaptive error grace factor to slow escalation when struggling', () => {
      const struggling = calculateDifficultyTier({
        activeSeconds: 60,
        completedCount: 5,
        score: 200,
        currentStreak: 1,
        errorCount: 12,
      });

      assert.strictEqual(struggling.performanceQuotient, 0.85);
    });
  });

  describe('Game-Specific Difficulty Config Scaling', () => {
    it('Game 1: Key Cascade scales fallSpeed and spawnInterval across tiers', () => {
      const t1 = getKeyCascadeConfig(1);
      const t3 = getKeyCascadeConfig(3);
      const t6 = getKeyCascadeConfig(6);

      assert.ok(t1.fallSpeed < t3.fallSpeed, 'Tier 3 speed must exceed Tier 1');
      assert.ok(t3.fallSpeed < t6.fallSpeed, 'Tier 6 speed must exceed Tier 3');
      assert.ok(t1.spawnInterval > t6.spawnInterval, 'Tier 6 spawn interval must be faster than Tier 1');
      assert.strictEqual(t1.pool, 'short');
      assert.strictEqual(t6.pool, 'long');
    });

    it('Game 2: Speed Sprint scales streak multipliers and word pools', () => {
      const t1 = getSpeedSprintConfig(1);
      const t3 = getSpeedSprintConfig(3);
      const t6 = getSpeedSprintConfig(6);

      assert.ok(t6.streakMultiplier > t1.streakMultiplier, 'Tier 6 streak multiplier must be higher');
      assert.strictEqual(t1.wordPool, 'short');
      assert.strictEqual(t3.wordPool, 'medium');
      assert.strictEqual(t6.wordPool, 'long');
    });

    it('Game 3: Word Hunter scales targetCount and tightens targetLifetime', () => {
      const t1 = getWordHunterConfig(1);
      const t6 = getWordHunterConfig(6);

      assert.ok(t6.targetCount > t1.targetCount, 'Tier 6 must spawn more simultaneous radar targets');
      assert.ok(t6.targetLifetime < t1.targetLifetime, 'Tier 6 target lifetime must be shorter');
    });

    it('Game 4: Key Ninja accelerates launch velocity and shortens spawn intervals', () => {
      const t1 = getKeyNinjaConfig(1);
      const t6 = getKeyNinjaConfig(6);

      assert.ok(t1.spawnInterval > t6.spawnInterval, 'Tier 6 ninja launch interval must be faster');
      assert.ok(Math.abs(t6.launchVelocityY) > Math.abs(t1.launchVelocityY), 'Tier 6 launch velocity must be greater');
      assert.ok(t6.maxAirborne >= t1.maxAirborne, 'Tier 6 max airborne targets must scale');
    });

    it('Game 5: Word Runner increases runner speed and tightens obstacle spacing', () => {
      const t1 = getWordRunnerConfig(1, 0);
      const t6 = getWordRunnerConfig(6, 400);

      assert.ok(t6.runnerSpeed > t1.runnerSpeed, 'Tier 6 runner speed must exceed Tier 1');
      assert.ok(t6.obstacleSpacing < t1.obstacleSpacing, 'Tier 6 obstacles must be spaced closer');
    });

    it('Game 6: Typing Memory expands sequenceLength from short to long recall', () => {
      const r1 = getTypingMemoryConfig(1, 1);
      const r5 = getTypingMemoryConfig(3, 5);

      assert.ok(r5.sequenceLength > r1.sequenceLength, 'Round 5 sequence must be longer than Round 1');
      assert.ok(r5.viewTime > 0, 'View time must remain positive and valid');
    });

    it('Game 7: Boss Battle increases march speed, soldier quota, and boss HP', () => {
      const w1 = getBossBattleConfig(1, 1);
      const w3 = getBossBattleConfig(3, 3); // Boss wave
      const w6 = getBossBattleConfig(5, 6); // High boss wave

      assert.strictEqual(w1.isBossWave, false);
      assert.strictEqual(w3.isBossWave, true);
      assert.ok(w3.bossHp > 0);
      assert.ok(w6.bossHp > w3.bossHp, 'Wave 6 boss HP must exceed Wave 3 boss HP');
      assert.ok(w6.marchSpeed > w1.marchSpeed, 'Wave 6 soldier march speed must be higher');
    });

    it('Game 8: Nitro Racing scales across 8 distinct AI and distance tiers', () => {
      assert.strictEqual(RACING_TIERS.length, 8, 'Must provide 8 racing tiers');
      assert.strictEqual(RACING_TIERS[0].name, 'Rookie');
      assert.strictEqual(RACING_TIERS[7].name, 'Champion');

      for (let i = 1; i < RACING_TIERS.length; i++) {
        assert.ok(
          RACING_TIERS[i].aiBaseWpm >= RACING_TIERS[i - 1].aiBaseWpm,
          `Tier ${i} AI WPM (${RACING_TIERS[i].aiBaseWpm}) must be >= Tier ${i - 1} AI WPM`
        );
      }
    });
  });
});
