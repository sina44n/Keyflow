import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { THEMES } from '../context/themes.js';
import { THEME_ROWS, CARD_ROTATION_PRESETS } from '../context/themeRows.js';

describe('KEYFLOW Theme Gallery Reference-Matched Redesign Audit', () => {
  it('confirms all 16 themes are present with strictly unique IDs and valid colors', () => {
    assert.equal(THEMES.length, 16, 'Exactly 16 themes must exist in THEMES');
    const ids = THEMES.map((t) => t.id);
    const uniqueIds = new Set(ids);
    assert.equal(uniqueIds.size, 16, 'All 16 theme IDs must be completely unique');

    THEMES.forEach((theme) => {
      assert.ok(theme.id && theme.id.length > 0, 'Theme ID must be non-empty');
      assert.ok(theme.name && theme.name.length > 0, 'Theme name must be non-empty');
      assert.ok(theme.subtitle && theme.subtitle.length > 0, 'Theme subtitle must be non-empty');
      assert.match(theme.accent, /^#[0-9A-Fa-f]{6}$/, `${theme.id} accent must be valid hex`);
      assert.match(theme.bg, /^#[0-9A-Fa-f]{6}$/, `${theme.id} bg must be valid hex`);
      assert.match(theme.surface, /^#[0-9A-Fa-f]{6}$/, `${theme.id} surface must be valid hex`);
      assert.match(theme.border, /^#[0-9A-Fa-f]{6}$/, `${theme.id} border must be valid hex`);
    });
  });

  it('verifies THEME_ROWS contains all 16 themes partitioned across 4 curated collections', () => {
    assert.equal(THEME_ROWS.length, 4, 'Must have exactly 4 category rows');
    const categories = THEME_ROWS.map((r) => r.category);
    assert.deepEqual(categories, ['Masterpiece', 'Nocturnal', 'Vibrant', 'Daylight']);

    let totalCards = 0;
    const cardThemeIds = [];

    THEME_ROWS.forEach((row) => {
      assert.equal(row.cards.length, 4, `Row ${row.category} must contain exactly 4 cards`);
      totalCards += row.cards.length;
      row.cards.forEach((card) => {
        cardThemeIds.push(card.themeId);
        assert.ok(card.num, 'Card must have sequential number');
        assert.ok(card.backingColor, 'Card must have backingColor');
        assert.ok(card.dashedColor, 'Card must have dashedColor');
        assert.ok(card.tag, 'Card must have tag badge');
        assert.ok(card.iconName, 'Card must have iconName');

        // Check theme exists in THEMES
        const themeDef = THEMES.find((t) => t.id === card.themeId);
        assert.ok(themeDef, `Card theme ${card.themeId} must exist in THEMES definition`);
      });
    });

    assert.equal(totalCards, 16, 'Total cards across all rows must equal 16');
    assert.equal(new Set(cardThemeIds).size, 16, 'All 16 cards must feature unique theme IDs');
  });

  it('verifies authentic color preservation for key themes', () => {
    // Burgundy & Cream retains original deep burgundy wine palette
    const burgundy = THEMES.find((t) => t.id === 'burgundy-cream');
    assert.equal(burgundy.accent, '#9E2A2B');
    assert.equal(burgundy.bg, '#FFFDF9');

    // Glacier Aqua features pristine white background and elegant deep teal
    const glacier = THEMES.find((t) => t.id === 'glacier-aqua');
    assert.equal(glacier.accent, '#008890');
    assert.equal(glacier.bg, '#FFFFFF');
    assert.equal(glacier.border, '#D6E8EA');
    assert.equal(glacier.mode, 'light');

    // Forest Green features deep forest green and pristine white
    const sage = THEMES.find((t) => t.id === 'forest-sage');
    assert.equal(sage.accent, '#09473A');
    assert.equal(sage.bg, '#FFFFFF');

    // Sunny Golden Yellow features sunny golden yellow, warm cream, and pure white
    const slate = THEMES.find((t) => t.id === 'midnight-slate');
    assert.equal(slate.accent, '#F6C638');
    assert.equal(slate.bg, '#FFFFFF');
    assert.equal(slate.border, '#F4EACF');

    // Electric Cobalt features electric cobalt blue, soft blue-gray, and pure white
    const cobalt = THEMES.find((t) => t.id === 'forest-green');
    assert.equal(cobalt.accent, '#173CFF');
    assert.equal(cobalt.bg, '#FFFFFF');
    assert.equal(cobalt.border, '#E8EDF7');

    // Charcoal Lime features pure black and neon lime
    const lime = THEMES.find((t) => t.id === 'dark-charcoal-lime');
    assert.equal(lime.accent, '#C5FF00');
    assert.equal(lime.bg, '#000000');
    assert.equal(lime.border, '#242424');

    // Lavender Dream features royal deep purple, soft lavender-white, and pure white
    const lavender = THEMES.find((t) => t.id === 'lavender-purple');
    assert.equal(lavender.accent, '#32214A');
    assert.equal(lavender.bg, '#FFFFFF');
    assert.equal(lavender.border, '#E8E1EE');

    // Midnight Ocean features pure black, deep ocean surface, and electric blue
    const ocean = THEMES.find((t) => t.id === 'midnight-blue');
    assert.equal(ocean.accent, '#1749F5');
    assert.equal(ocean.bg, '#000000');
    assert.equal(ocean.border, '#142A46');

    // Fiery Orange features pure black, dark card surface, and fiery burnt orange
    const fiery = THEMES.find((t) => t.id === 'sunset-orange');
    assert.equal(fiery.accent, '#D7410E');
    assert.equal(fiery.bg, '#000000');
    assert.equal(fiery.border, '#262626');

    // Warm Sage features pure white, soft cream, and muted sage green
    const warmSage = THEMES.find((t) => t.id === 'arctic-blue');
    assert.equal(warmSage.accent, '#949686');
    assert.equal(warmSage.bg, '#FFFFFF');
    assert.equal(warmSage.border, '#E4DED5');
  });

  it('confirms card sequential numbering from 01 to 16 in strict order', () => {
    const allNums = THEME_ROWS.flatMap((r) => r.cards.map((c) => c.num));
    const expectedNums = Array.from({ length: 16 }, (_, i) => String(i + 1).padStart(2, '0'));
    assert.deepEqual(allNums, expectedNums, 'Cards must be numbered strictly 01 through 16');
  });

  it('confirms 4 alternating rotational presets for desktop double-layer tilt', () => {
    assert.equal(CARD_ROTATION_PRESETS.length, 4, 'Must have 4 column rotation presets');
    CARD_ROTATION_PRESETS.forEach((preset) => {
      assert.ok(typeof preset.rear === 'number', 'Rear angle must be a number');
      assert.ok(typeof preset.front === 'number', 'Front angle must be a number');
      // Verify opposing tilt (rear and front have opposite signs)
      assert.ok(preset.rear * preset.front < 0, 'Rear and front must tilt in opposite directions');
    });
  });
});
