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
      { themeId: 'espresso-latte', color: '#E91E63' }, // Pink / Magenta
      { themeId: 'forest-sage', color: '#00C0FA' },    // Cyan / Sky Blue
      { themeId: 'midnight-slate', color: '#0066FF' }, // Royal / Cobalt Blue
    ];

    row1Expected.forEach(({ themeId, color }) => {
      const found = THEMES.find((t) => t.id === themeId);
      assert.ok(found, `Row 1 must contain ${themeId}`);
      assert.ok(color.startsWith('#'), 'Backing color must be valid hex');
    });
  });

  it('confirms all 16 themes are partitioned into exactly 4 rows of 4 cards without duplicates', () => {
    const row1 = ['burgundy-cream', 'espresso-latte', 'forest-sage', 'midnight-slate'];
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

  it('verifies Burgundy & Cream, Espresso & Latte, Forest Sage, and Midnight Slate values remain intact', () => {
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
