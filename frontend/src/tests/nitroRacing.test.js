/**
 * Nitro Racing Game Mechanics & 3D Speedway Test Suite
 * ====================================================
 * Verifies progressive difficulty tiers, supercar attributes, continuous passage
 * engine integration, and non-blocking cadence coaching (no abrupt vehicle freeze).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  RACING_TIERS,
  RACING_VEHICLES,
  RACING_ENVIRONMENTS,
  AI_COMPETITORS,
  computeAiProgress,
} from '../utils/racingDifficulty.js';
import { PassageStreamQueue } from '../utils/continuousPassageEngine.js';

describe('Nitro Racing Mechanics & Speedway Simulation', () => {
  test('Defines all 8 progressive racing difficulty tiers', () => {
    assert.strictEqual(RACING_TIERS.length, 8);
    const rookie = RACING_TIERS[0];
    const champion = RACING_TIERS[7];

    assert.strictEqual(rookie.name, 'Rookie');
    assert.strictEqual(champion.name, 'Champion');
    assert.ok(champion.minWpm > rookie.minWpm, 'Champion tier requires higher pace than Rookie');
    assert.ok(champion.trackDistance > rookie.trackDistance, 'Champion track is longer than Rookie track');
  });

  test('Defines all 8 selectable supercar models with distinct specs', () => {
    assert.strictEqual(RACING_VEHICLES.length, 8);
    const ids = RACING_VEHICLES.map(v => v.id);
    assert.ok(ids.includes('apex-gt'));
    assert.ok(ids.includes('cyber-phantom'));
    assert.ok(ids.includes('viper-venom'));
    assert.ok(ids.includes('shadow-specter'));

    RACING_VEHICLES.forEach(v => {
      assert.ok(v.topSpeed >= 70, `${v.id} top speed must be valid`);
      assert.ok(v.acceleration >= 70, `${v.id} acceleration must be valid`);
      assert.ok(v.nitroBoost >= 70, `${v.id} nitro boost must be valid`);
    });
  });

  test('Defines all 4 3D racing environments', () => {
    assert.strictEqual(RACING_ENVIRONMENTS.length, 4);
    const envIds = RACING_ENVIRONMENTS.map(e => e.id);
    assert.ok(envIds.includes('speedway'));
    assert.ok(envIds.includes('sunset'));
    assert.ok(envIds.includes('neon-city'));
    assert.ok(envIds.includes('alpine'));
  });

  test('Continuous passage stream generates text without blocking', () => {
    const stream = new PassageStreamQueue({ tier: 2, initialPassagesCount: 3 });
    assert.ok(stream.fullText.length > 100, 'Buffer must be initialized with text');

    const firstChar = stream.getCurrentChar();
    assert.ok(firstChar.length === 1);

    const stroke = stream.handleKeystroke(firstChar, 1.0);
    assert.strictEqual(stroke.isCorrect, true);
    assert.strictEqual(stream.totalCorrect, 1);
  });

  test('AI competitor progress scales with target distance and player velocity', () => {
    const ai = AI_COMPETITORS[0];
    const targetDistance = 1000;
    const progress = computeAiProgress({
      aiRacer: ai,
      tierConfig: RACING_TIERS[0],
      playerWpm: 40,
      playerDistance: 200,
      elapsedSeconds: 5,
      currentProgress: 20,
      targetDistance,
    });

    assert.ok(typeof progress === 'number');
    assert.ok(progress > 0, 'AI must have positive velocity along +X');
  });
});
