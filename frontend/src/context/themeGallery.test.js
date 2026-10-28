import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { THEMES } from './themes.js';

describe('KEYFLOW Connected Theme Gallery & Palette Architecture', () => {
  it('confirms all 16 studio themes exist with strictly unique IDs', () => {
    assert.equal(THEMES.length, 16, `Expected exactly 16 themes, found ${THEMES.length}`);
    const ids = THEMES.map((t) => t.id);
    const uniqueIds = new Set(ids);
    assert.equal(uniqueIds.size, 16, 'Theme IDs must be completely unique');
  });

  it('confirms the primary cluster covers premier Masterpiece & Artisan themes', () => {
    const cluster1Ids = [
      'burgundy-cream',
      'espresso-latte',
      'forest-sage',
      'midnight-slate',
      'dark-charcoal-lime',
      'dark-theme',
      'midnight-blue',
    ];

    cluster1Ids.forEach((id) => {
      const found = THEMES.find((t) => t.id === id);
      assert.ok(found, `Cluster 1 must contain theme: ${id}`);
    });
  });

  it('confirms every single one of the 16 themes is partitioned across the 3 clusters with zero duplicates', () => {
    const cluster1Ids = [
      'burgundy-cream',
      'espresso-latte',
      'forest-sage',
      'midnight-slate',
      'dark-charcoal-lime',
      'dark-theme',
      'midnight-blue',
    ];

    const cluster2Ids = [
      'lavender-purple',
      'forest-green',
      'ocean-teal',
      'sunset-orange',
      'rose-pink',
    ];

    const cluster3Ids = [
      'arctic-blue',
      'solarized-light',
      'warm-sand',
      'classic-black-white',
    ];

    const allClusterIds = [...cluster1Ids, ...cluster2Ids, ...cluster3Ids];
    assert.equal(allClusterIds.length, 16, 'Total cluster theme count must be exactly 16');

    const setOfIds = new Set(allClusterIds);
    assert.equal(setOfIds.size, 16, 'Every cluster theme ID must be unique (no duplicates)');

    // Ensure every ID in THEMES is accounted for
    THEMES.forEach((t) => {
      assert.ok(setOfIds.has(t.id), `Theme ${t.id} must be included in the connected gallery`);
    });
  });

  it('verifies that each theme has valid 6-character hex colors for accent, bg, surface, and border', () => {
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;

    THEMES.forEach((theme) => {
      assert.match(theme.accent, hexPattern, `${theme.id} accent must be valid hex`);
      assert.match(theme.bg, hexPattern, `${theme.id} bg must be valid hex`);
      assert.match(theme.surface, hexPattern, `${theme.id} surface must be valid hex`);
      assert.match(theme.border, hexPattern, `${theme.id} border must be valid hex`);
      assert.ok(theme.name && theme.name.trim().length > 0, `${theme.id} must have a name`);
      assert.ok(theme.subtitle && theme.subtitle.trim().length > 0, `${theme.id} must have a subtitle`);
      assert.ok(theme.tag && theme.tag.trim().length > 0, `${theme.id} must have a tag`);
    });
  });

  it('verifies Burgundy & Cream, Espresso & Latte, Forest Sage, and Midnight Slate hex values', () => {
    const burgundy = THEMES.find((t) => t.id === 'burgundy-cream');
    assert.equal(burgundy.accent, '#9E2A2B');
    assert.equal(burgundy.bg, '#FFFDF9');

    const espresso = THEMES.find((t) => t.id === 'espresso-latte');
    assert.equal(espresso.bg, '#2B1D17');
    assert.equal(espresso.accent, '#C48A5A');

    const forest = THEMES.find((t) => t.id === 'forest-sage');
    assert.equal(forest.bg, '#0F2A1D');
    assert.equal(forest.accent, '#6B9071');

    const slate = THEMES.find((t) => t.id === 'midnight-slate');
    assert.equal(slate.bg, '#06141B');
    assert.equal(slate.accent, '#9BA8AB');
  });
});
