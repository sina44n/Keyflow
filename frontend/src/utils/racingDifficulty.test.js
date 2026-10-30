import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  RACING_TIERS,
  RACING_VEHICLES,
  RACING_ENVIRONMENTS,
  AI_COMPETITORS,
  calculateRacingTier,
  getRacingPassage,
  computeAiProgress,
} from './racingDifficulty.js';

describe('KEYFLOW Arcade — Progressive Racing Difficulty Engine', () => {
  it('contains exactly 8 progressive difficulty tiers with ascending WPM targets', () => {
    assert.equal(RACING_TIERS.length, 8);
    for (let i = 0; i < RACING_TIERS.length - 1; i++) {
      assert.ok(
        RACING_TIERS[i + 1].minWpm >= RACING_TIERS[i].minWpm,
        `Tier ${i + 2} minWpm must be greater than or equal to Tier ${i + 1}`
      );
      assert.ok(
        RACING_TIERS[i + 1].aiBaseWpm > RACING_TIERS[i].aiBaseWpm,
        `Tier ${i + 2} AI base WPM must be higher than Tier ${i + 1}`
      );
    }
  });

  it('contains selectable supercars with distinct attribute profiles', () => {
    assert.ok(RACING_VEHICLES.length >= 5, 'Must contain at least 5 supercars');
    RACING_VEHICLES.forEach((v) => {
      assert.ok(v.id, 'Vehicle must have id');
      assert.ok(v.name, 'Vehicle must have name');
      assert.ok(v.acceleration > 50, 'Acceleration must be calibrated');
      assert.ok(v.topSpeed > 50, 'Top speed must be calibrated');
      assert.ok(v.nitroBoost > 50, 'Nitro boost must be calibrated');
      assert.ok(v.color, 'Vehicle must have primary color');
    });
  });

  it('contains 4 distinct racing environments with unique atmospheric configs', () => {
    assert.equal(RACING_ENVIRONMENTS.length, 4);
    const envIds = RACING_ENVIRONMENTS.map((e) => e.id);
    assert.deepEqual(envIds, ['speedway', 'sunset', 'neon-city', 'alpine']);
  });

  it('contains 3 competitive AI racers with individual personalities', () => {
    assert.equal(AI_COMPETITORS.length, 3);
    const names = AI_COMPETITORS.map((c) => c.name);
    assert.deepEqual(names, ['Xavier', 'Thomas', 'Joshua']);
  });

  it('dynamically scales difficulty tiers based on genuine player WPM and races completed', () => {
    // Beginner baseline
    assert.equal(calculateRacingTier({ currentTier: 1, recentWpm: 25, racesCompleted: 0 }), 1);
    // Progression to Amateur
    assert.equal(calculateRacingTier({ currentTier: 1, recentWpm: 38, racesCompleted: 2 }), 2);
    // Progression to Semi-Pro
    assert.equal(calculateRacingTier({ currentTier: 2, recentWpm: 48, racesCompleted: 3 }), 3);
    // Progression to Pro
    assert.equal(calculateRacingTier({ currentTier: 3, recentWpm: 65, racesCompleted: 4 }), 4);
    // Progression to Master
    assert.equal(calculateRacingTier({ currentTier: 4, recentWpm: 92, racesCompleted: 7 }), 6);
    // Progression to Legendary
    assert.equal(calculateRacingTier({ currentTier: 7, recentWpm: 125, racesCompleted: 15 }), 8);
  });

  it('retrieves valid educational passages for every difficulty tier', () => {
    for (let tier = 1; tier <= 8; tier++) {
      const passage = getRacingPassage(tier);
      assert.ok(typeof passage === 'string');
      assert.ok(passage.length > 30, `Passage for tier ${tier} should have sufficient length`);
    }
  });

  it('calculates competitive AI progress with adaptive rubber-banding', () => {
    const ai = AI_COMPETITORS[0];
    const tierConfig = RACING_TIERS[0];

    const speedNormal = computeAiProgress({
      aiRacer: ai,
      tierConfig,
      playerWpm: 30,
      elapsedSeconds: 5,
      currentProgress: 10,
      targetDistance: 800,
    });
    assert.ok(speedNormal > 5, 'AI speed should be positive');

    // If AI is excessively ahead, rubber-banding gently tempers pace
    const speedAhead = computeAiProgress({
      aiRacer: ai,
      tierConfig,
      playerWpm: 15,
      elapsedSeconds: 5,
      currentProgress: 50,
      targetDistance: 800,
    });
    assert.ok(speedAhead < speedNormal * 1.05);
  });
});
