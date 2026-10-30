import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatCompactCount,
  DEFAULT_COMMUNITY_STATS,
} from './arcadeStatsService.js';

describe('KEYFLOW Arcade — Likes & Plays Service Tests', () => {
  it('formats large numbers into compact gaming strings', () => {
    assert.equal(formatCompactCount(0), '0');
    assert.equal(formatCompactCount(753), '753');
    assert.equal(formatCompactCount(1200), '1.2k');
    assert.equal(formatCompactCount(2640), '2.6k');
    assert.equal(formatCompactCount(175700), '175.7k');
    assert.equal(formatCompactCount(1200000), '1.2M');
  });

  it('contains default community baseline statistics for all 8 arcade games', () => {
    const expectedGames = ['cascade', 'sprint', 'hunter', 'ninja', 'runner', 'memory', 'boss', 'nitro'];
    expectedGames.forEach((id) => {
      assert.ok(DEFAULT_COMMUNITY_STATS[id], `Must have default stats for ${id}`);
      assert.ok(DEFAULT_COMMUNITY_STATS[id].likes > 0, `${id} must have baseline likes`);
      assert.ok(DEFAULT_COMMUNITY_STATS[id].plays > 0, `${id} must have baseline plays`);
      assert.equal(DEFAULT_COMMUNITY_STATS[id].hasLiked, false);
    });
  });
});
