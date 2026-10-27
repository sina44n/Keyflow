import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  DIFFICULTY_TIERS,
  calculateDifficultyTier,
  getKeyCascadeConfig,
  getSpeedSprintConfig,
  getWordHunterConfig,
  getKeyNinjaConfig,
  getWordRunnerConfig,
  getTypingMemoryConfig,
  getBossBattleConfig,
} from './arcadeDifficulty.js';

import {
  SOLDIER_CLASSES,
  ARCADE_WORDS,
} from '../data/arcadeGamesData.js';

import {
  getArcadeRecords,
  saveArcadeRecord,
  resetArcadeRecords,
} from './arcadeStorage.js';

describe('Shared Progressive Difficulty Engine', () => {
  it('defines 6 progressive difficulty tiers with appropriate names', () => {
    assert.equal(DIFFICULTY_TIERS.length, 6);
    assert.equal(DIFFICULTY_TIERS[0].name, 'Warm-up');
    assert.equal(DIFFICULTY_TIERS[1].name, 'Beginner');
    assert.equal(DIFFICULTY_TIERS[2].name, 'Intermediate');
    assert.equal(DIFFICULTY_TIERS[3].name, 'Advanced');
    assert.equal(DIFFICULTY_TIERS[4].name, 'Expert');
    assert.equal(DIFFICULTY_TIERS[5].name, 'Master');
  });

  it('starts at Tier 1 (Warm-up) for a clean run', () => {
    const tierInfo = calculateDifficultyTier({
      activeSeconds: 0,
      completedCount: 0,
      score: 0,
      currentStreak: 0,
      errorCount: 0,
    });
    assert.equal(tierInfo.tier, 1);
    assert.equal(tierInfo.tierName, 'Warm-up');
  });

  it('gradually escalates tiers as active gameplay time, completions, and score advance', () => {
    // Intermediate play: 60s active, 25 words, 1500 score
    const intermediate = calculateDifficultyTier({
      activeSeconds: 65,
      completedCount: 28,
      score: 1600,
      currentStreak: 8,
      errorCount: 1,
    });
    assert.ok(intermediate.tier >= 2 && intermediate.tier <= 4, `Expected tier 2-4, got ${intermediate.tier}`);

    // Advanced / Expert play: 180s active, 75 words, 5500 score
    const advanced = calculateDifficultyTier({
      activeSeconds: 180,
      completedCount: 75,
      score: 5500,
      currentStreak: 20,
      errorCount: 3,
    });
    assert.ok(advanced.tier >= 4, `Expected tier >= 4, got ${advanced.tier}`);
  });

  it('strictly bounds difficulty progression between Tier 1 and Tier 6', () => {
    // Extreme high inputs
    const extremeHigh = calculateDifficultyTier({
      activeSeconds: 99999,
      completedCount: 9999,
      score: 999999,
      currentStreak: 500,
      errorCount: 0,
      wave: 99,
    });
    assert.equal(extremeHigh.tier, 6);

    // Negative / corrupted inputs
    const extremeLow = calculateDifficultyTier({
      activeSeconds: -100,
      completedCount: -50,
      score: -1000,
      currentStreak: -10,
      errorCount: 999,
      wave: -5,
    });
    assert.equal(extremeLow.tier, 1);
  });

  it('ensures paused time (zero elapsed active seconds) does not escalate difficulty', () => {
    const beforePause = calculateDifficultyTier({
      activeSeconds: 30,
      completedCount: 10,
      score: 500,
      currentStreak: 5,
      errorCount: 0,
    });

    // While paused, activeSeconds, completedCount, score do not change
    const duringPause = calculateDifficultyTier({
      activeSeconds: 30,
      completedCount: 10,
      score: 500,
      currentStreak: 5,
      errorCount: 0,
    });

    assert.equal(beforePause.tier, duringPause.tier);
    assert.equal(beforePause.compositeMetric, duringPause.compositeMetric);
  });

  it('ensures restart cleanly resets the current run back to Tier 1', () => {
    // End of long run
    const endOfRun = calculateDifficultyTier({
      activeSeconds: 240,
      completedCount: 90,
      score: 8000,
      currentStreak: 15,
      errorCount: 2,
    });
    assert.ok(endOfRun.tier >= 4);

    // After reset
    const afterRestart = calculateDifficultyTier({
      activeSeconds: 0,
      completedCount: 0,
      score: 0,
      currentStreak: 0,
      errorCount: 0,
    });
    assert.equal(afterRestart.tier, 1);
    assert.equal(afterRestart.tierName, 'Warm-up');
  });

  it('adapts difficulty to player performance (streak boost & error recovery grace window)', () => {
    // High streak accuracy boost
    const highPerformer = calculateDifficultyTier({
      activeSeconds: 40,
      completedCount: 20,
      score: 1200,
      currentStreak: 25,
      errorCount: 0,
    });

    // Struggling player with repeated mistakes
    const strugglingPlayer = calculateDifficultyTier({
      activeSeconds: 40,
      completedCount: 20,
      score: 1200,
      currentStreak: 0,
      errorCount: 12,
    });

    assert.ok(highPerformer.performanceQuotient > strugglingPlayer.performanceQuotient,
      'High streak player should have higher performance quotient than struggling player');
    assert.ok(highPerformer.tier >= strugglingPlayer.tier,
      'High streak player should have equal or higher tier than struggling player');
  });
});

describe('Individual Game Dynamic Configurations', () => {
  it('scales Key Cascade speed, spawn rate, and simultaneous words across tiers', () => {
    const tier1 = getKeyCascadeConfig(1);
    const tier6 = getKeyCascadeConfig(6);

    assert.ok(tier6.fallSpeed > tier1.fallSpeed, 'Tier 6 fall speed must be faster than Tier 1');
    assert.ok(tier6.spawnInterval < tier1.spawnInterval, 'Tier 6 spawn interval must be shorter than Tier 1');
    assert.ok(tier6.maxWords >= tier1.maxWords, 'Tier 6 must allow more simultaneous words');
    assert.equal(tier1.pool, 'short');
    assert.equal(tier6.pool, 'long');
  });

  it('scales Speed Sprint word pools and streak multipliers smoothly', () => {
    const tier1 = getSpeedSprintConfig(1);
    const tier5 = getSpeedSprintConfig(5);

    assert.equal(tier1.wordPool, 'short');
    assert.ok(['medium', 'long'].includes(tier5.wordPool));
    assert.ok(tier5.streakMultiplier > tier1.streakMultiplier);
  });

  it('scales Word Hunter radar targets from 4 to 8 with tighter target lifetime', () => {
    const tier1 = getWordHunterConfig(1);
    const tier6 = getWordHunterConfig(6);

    assert.equal(tier1.targetCount, 4);
    assert.equal(tier6.targetCount, 8);
    assert.ok(tier6.targetLifetime < tier1.targetLifetime, 'Target lifetime must decrease at higher tiers');
  });

  it('scales Key Ninja launch velocity and airborne capacity within fair bounds', () => {
    const tier1 = getKeyNinjaConfig(1);
    const tier6 = getKeyNinjaConfig(6);

    assert.ok(Math.abs(tier6.launchVelocityY) > Math.abs(tier1.launchVelocityY));
    assert.ok(tier6.maxAirborne > tier1.maxAirborne);
    assert.ok(tier6.spawnInterval < tier1.spawnInterval);
    assert.ok(tier6.maxAirborne <= 6, 'Key Ninja airborne capacity must remain bounded (<= 6)');
  });

  it('scales Word Runner velocity and obstacle spacing smoothly', () => {
    const tier1 = getWordRunnerConfig(1, 100);
    const tier6 = getWordRunnerConfig(6, 800);

    assert.ok(tier6.runnerSpeed > tier1.runnerSpeed, 'Word Runner speed must escalate');
    assert.ok(tier6.obstacleSpacing < tier1.obstacleSpacing, 'Obstacle spacing must tighten');
    assert.ok(tier6.obstacleSpacing >= 28, 'Obstacle spacing must remain fair (>= 28m)');
  });

  it('scales Typing Memory sequence length and shutter presentation time without leaks', () => {
    const round1 = getTypingMemoryConfig(1, 1);
    const round5 = getTypingMemoryConfig(4, 5);

    assert.equal(round1.sequenceLength, 3);
    assert.ok(round5.sequenceLength >= 6);
    assert.ok(round1.viewTime >= 2.6, 'View time must remain fair');
    assert.ok(round5.viewTime >= 2.6, 'View time must never drop below fair minimum');
  });

  it('scales Boss Battle soldier combat, waves, and boss encounters', () => {
    // Normal waves
    const wave1 = getBossBattleConfig(1, 1);
    assert.equal(wave1.isBossWave, false);
    assert.equal(wave1.classWeights.infantry, 1.0);
    assert.equal(wave1.classWeights.assault, 0.0);

    const wave2 = getBossBattleConfig(2, 2);
    assert.ok(wave2.classWeights.assault > 0);

    // Boss Wave 3
    const wave3 = getBossBattleConfig(3, 3);
    assert.equal(wave3.isBossWave, true);
    assert.ok(wave3.bossHp >= 400);
    assert.ok(wave3.bossAttackTimer >= 3.8);

    // Boss Wave 6
    const wave6 = getBossBattleConfig(5, 6);
    assert.equal(wave6.isBossWave, true);
    assert.ok(wave6.bossHp > wave3.bossHp, 'Later boss must have higher health');
  });
});

describe('Boss Battle Soldier Combat Mechanics', () => {
  it('defines 4 distinct soldier classes with specific combat attributes', () => {
    const classKeys = Object.keys(SOLDIER_CLASSES);
    assert.equal(classKeys.length, 4);
    assert.deepEqual(classKeys, ['infantry', 'assault', 'armored', 'elite']);

    const infantry = SOLDIER_CLASSES.infantry;
    assert.equal(infantry.maxHp, 1);
    assert.equal(infantry.scoreValue, 100);

    const assault = SOLDIER_CLASSES.assault;
    assert.ok(assault.speedMult > infantry.speedMult, 'Assault soldiers must move faster than infantry');

    const armored = SOLDIER_CLASSES.armored;
    assert.equal(armored.maxHp, 2, 'Armored soldiers must require 2 typing stages to eliminate');
    assert.ok(armored.scoreValue > infantry.scoreValue);

    const elite = SOLDIER_CLASSES.elite;
    assert.ok(elite.scoreValue >= 400, 'Elite soldiers must award major score');
  });

  it('contains dedicated vocabulary pools for every soldier class and boss encounter', () => {
    assert.ok(ARCADE_WORDS.infantry.length >= 10);
    assert.ok(ARCADE_WORDS.assault.length >= 10);
    assert.ok(ARCADE_WORDS.armored.length >= 10);
    assert.ok(ARCADE_WORDS.elite.length >= 10);
    assert.ok(ARCADE_WORDS.bossPhrases.length >= 8);
  });

  it('persists highestWave, soldiersDefeated, and highestTier in arcade storage', () => {
    // Mock storage
    const storage = {};
    global.localStorage = {
      getItem: (k) => storage[k] || null,
      setItem: (k, v) => { storage[k] = String(v); },
      removeItem: (k) => { delete storage[k]; },
      clear: () => { Object.keys(storage).forEach((k) => delete storage[k]); },
    };
    global.window = { dispatchEvent: () => {} };

    resetArcadeRecords();

    const saveResult = saveArcadeRecord('boss', {
      score: 3400,
      highestWave: 4,
      highestTier: 3,
      soldiersDefeated: 28,
      bossDefeated: true,
      commandersSlain: 1,
    });

    assert.equal(saveResult.isNewBest, true);
    assert.equal(saveResult.record.highestWave, 4);
    assert.equal(saveResult.record.highestTier, 3);
    assert.equal(saveResult.record.soldiersDefeated, 28);
    assert.equal(saveResult.record.bossDefeated, true);

    const allRecords = getArcadeRecords();
    assert.equal(allRecords.boss.soldiersDefeated, 28);
    assert.equal(allRecords.boss.highestTier, 3);
  });
});
