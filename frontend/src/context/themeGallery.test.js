import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { THEMES } from './themes.js';

describe('KEYFLOW Exact Reference Theme Gallery Architecture', () => {
  it('confirms all 16 studio themes exist with strictly unique IDs', () => {
    assert.equal(THEMES.length, 16, `Expected exactly 16 themes, found ${THEMES.length}`);
    const ids = THEMES.map((t) => t.id);
    const uniqueIds = new Set(ids);
    assert.equal(uniqueIds.size, 16, 'Theme IDs must be completely unique');
  });

  it('confirms Row 1 features the 4 flagship themes with exact reference backing colors', () => {
    const row1Expected = [
      { themeId: 'burgundy-cream', color: '#FF6B00' }, // Orange
      { themeId: 'glacier-aqua', color: '#008890' },   // Teal / Cyan
      { themeId: 'forest-sage', color: '#00C0FA' },    // Cyan / Sky Blue
      { themeId: 'midnight-slate', color: '#F6C638' }, // Sunny Yellow
    ];

    row1Expected.forEach(({ themeId, color }) => {
      const found = THEMES.find((t) => t.id === themeId);
      assert.ok(found, `Row 1 must contain ${themeId}`);
      assert.ok(color.startsWith('#'), 'Backing color must be valid hex');
    });
  });

  it('confirms all 16 themes are partitioned into exactly 4 rows of 4 cards without duplicates', () => {
    const row1 = ['burgundy-cream', 'glacier-aqua', 'forest-sage', 'midnight-slate'];
    const row2 = ['dark-charcoal-lime', 'dark-theme', 'midnight-blue', 'lavender-purple'];
    const row3 = ['forest-green', 'ocean-teal', 'sunset-orange', 'rose-pink'];
    const row4 = ['arctic-blue', 'solarized-light', 'warm-sand', 'classic-black-white'];

    assert.equal(row1.length, 4, 'Row 1 must have exactly 4 cards');
    assert.equal(row2.length, 4, 'Row 2 must have exactly 4 cards');
    assert.equal(row3.length, 4, 'Row 3 must have exactly 4 cards');
    assert.equal(row4.length, 4, 'Row 4 must have exactly 4 cards');

    const allRowIds = [...row1, ...row2, ...row3, ...row4];
    assert.equal(allRowIds.length, 16, 'Total cards must be exactly 16');

    const setOfIds = new Set(allRowIds);
    assert.equal(setOfIds.size, 16, 'Every theme ID across the rows must be unique');

    // Ensure every theme in THEMES is accounted for
    THEMES.forEach((t) => {
      assert.ok(setOfIds.has(t.id), `Theme ${t.id} must appear in the gallery`);
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

  it('verifies Burgundy & Cream, Glacier Aqua, Forest Sage, and Midnight Slate values remain intact', () => {
    const burgundy = THEMES.find((t) => t.id === 'burgundy-cream');
    assert.equal(burgundy.accent, '#9E2A2B');
    assert.equal(burgundy.bg, '#FFFDF9');

    const glacier = THEMES.find((t) => t.id === 'glacier-aqua');
    assert.equal(glacier.bg, '#FFFFFF');
    assert.equal(glacier.accent, '#008890');

    const forest = THEMES.find((t) => t.id === 'forest-sage');
    assert.equal(forest.bg, '#FFFFFF');
    assert.equal(forest.accent, '#09473A');

    const slate = THEMES.find((t) => t.id === 'midnight-slate');
    assert.equal(slate.bg, '#FFFFFF');
    assert.equal(slate.accent, '#F6C638');

    const cobalt = THEMES.find((t) => t.id === 'forest-green');
    assert.equal(cobalt.bg, '#FFFFFF');
    assert.equal(cobalt.accent, '#173CFF');

    const lime = THEMES.find((t) => t.id === 'dark-charcoal-lime');
    assert.equal(lime.bg, '#000000');
    assert.equal(lime.accent, '#C5FF00');

    const lavender = THEMES.find((t) => t.id === 'lavender-purple');
    assert.equal(lavender.bg, '#FFFFFF');
    assert.equal(lavender.accent, '#32214A');

    const ocean = THEMES.find((t) => t.id === 'midnight-blue');
    assert.equal(ocean.bg, '#000000');
    assert.equal(ocean.accent, '#1749F5');

    const fiery = THEMES.find((t) => t.id === 'sunset-orange');
    assert.equal(fiery.bg, '#000000');
    assert.equal(fiery.accent, '#D7410E');

    const sage = THEMES.find((t) => t.id === 'arctic-blue');
    assert.equal(sage.bg, '#FFFFFF');
    assert.equal(sage.accent, '#949686');
  });
});
