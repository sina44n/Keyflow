import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { THEMES } from './themes.js';

describe('KEYFLOW Studio Theme Architecture', () => {
  it('contains exactly 16 themes with unique identifiers', () => {
    assert.equal(THEMES.length, 16, `Expected 16 themes, found ${THEMES.length}`);
    const ids = THEMES.map((t) => t.id);
    const uniqueIds = new Set(ids);
    assert.equal(uniqueIds.size, 16, 'Theme identifiers must be strictly unique');
  });

  it('preserves the Burgundy & Cream default theme intact', () => {
    const burgundy = THEMES.find((t) => t.id === 'burgundy-cream');
    assert.ok(burgundy, 'burgundy-cream theme must exist');
    assert.equal(burgundy.name, 'Burgundy & Cream');
    assert.equal(burgundy.accent, '#9E2A2B');
    assert.equal(burgundy.bg, '#FFFDF9');
    assert.equal(burgundy.mode, 'light');
  });

  it('correctly defines the Glacier Aqua theme with specified hex colors', () => {
    const theme = THEMES.find((t) => t.id === 'glacier-aqua');
    assert.ok(theme, 'glacier-aqua must exist in THEMES');
    assert.equal(theme.name, 'Glacier Aqua');
    assert.equal(theme.bg, '#FFFFFF', 'Pure clean white background');
    assert.equal(theme.border, '#D6E8EA', 'Icy cyan border');
    assert.equal(theme.accent, '#008890', 'Deep elegant teal accent');
    assert.equal(theme.mode, 'light');
    assert.ok(theme.tag);
  });

  it('correctly defines the Forest Sage theme with specified hex colors', () => {
    const theme = THEMES.find((t) => t.id === 'forest-sage');
    assert.ok(theme, 'forest-sage must exist in THEMES');
    assert.equal(theme.name, 'Forest Green');
    assert.equal(theme.bg, '#FFFFFF', 'Clean white background');
    assert.equal(theme.border, '#E2EAE3', 'Subtle sage border');
    assert.equal(theme.accent, '#09473A', 'Deep forest green accent');
    assert.equal(theme.mode, 'light');
    assert.ok(theme.tag);
  });

  it('correctly defines the Sunny Golden Yellow theme with specified hex colors', () => {
    const theme = THEMES.find((t) => t.id === 'midnight-slate');
    assert.ok(theme, 'midnight-slate must exist in THEMES');
    assert.equal(theme.name, 'Sunny Golden Yellow');
    assert.equal(theme.bg, '#FFFFFF', 'Pure clean white background');
    assert.equal(theme.surface, '#FBF7E5', 'Soft Cream surface');
    assert.equal(theme.border, '#F4EACF', 'Warm Cream border');
    assert.equal(theme.accent, '#F6C638', 'Primary Sunny Yellow accent');
    assert.equal(theme.mode, 'light');
    assert.ok(theme.tag);
  });

  it('correctly defines the Electric Cobalt theme with specified hex colors', () => {
    const theme = THEMES.find((t) => t.id === 'forest-green');
    assert.ok(theme, 'forest-green must exist in THEMES');
    assert.equal(theme.name, 'Electric Cobalt');
    assert.equal(theme.bg, '#FFFFFF', 'Pure clean white background');
    assert.equal(theme.surface, '#F3F6FC', 'Light Blue surface');
    assert.equal(theme.border, '#E8EDF7', 'Soft Blue-Gray border');
    assert.equal(theme.accent, '#173CFF', 'Primary Electric Blue accent');
    assert.equal(theme.mode, 'light');
    assert.ok(theme.tag);
  });

  it('correctly defines the Charcoal Lime theme with specified hex colors', () => {
    const theme = THEMES.find((t) => t.id === 'dark-charcoal-lime');
    assert.ok(theme, 'dark-charcoal-lime must exist in THEMES');
    assert.equal(theme.name, 'Charcoal Lime');
    assert.equal(theme.bg, '#000000', 'Original pure black background');
    assert.equal(theme.surface, '#111111', 'Dark Charcoal surface');
    assert.equal(theme.border, '#242424', 'Dark Charcoal border');
    assert.equal(theme.accent, '#C5FF00', 'Primary Neon Lime accent');
    assert.equal(theme.mode, 'dark');
    assert.ok(theme.tag);
  });

  it('correctly defines the Lavender Dream theme with specified hex colors', () => {
    const theme = THEMES.find((t) => t.id === 'lavender-purple');
    assert.ok(theme, 'lavender-purple must exist in THEMES');
    assert.equal(theme.name, 'Lavender Dream');
    assert.equal(theme.bg, '#FFFFFF', 'Pure clean white background');
    assert.equal(theme.surface, '#F9F6FC', 'Soft Lavender-White surface');
    assert.equal(theme.border, '#E8E1EE', 'Subtle border');
    assert.equal(theme.accent, '#32214A', 'Primary Royal Deep Purple accent');
    assert.equal(theme.mode, 'light');
    assert.ok(theme.tag);
  });

  it('correctly defines the Midnight Ocean theme with specified hex colors', () => {
    const theme = THEMES.find((t) => t.id === 'midnight-blue');
    assert.ok(theme, 'midnight-blue must exist in THEMES');
    assert.equal(theme.name, 'Midnight Ocean');
    assert.equal(theme.bg, '#000000', 'Pure deep black background');
    assert.equal(theme.surface, '#020817', 'Primary Dark Surface');
    assert.equal(theme.border, '#142A46', 'Subtle ocean border');
    assert.equal(theme.accent, '#1749F5', 'Primary Electric Ocean Blue accent');
    assert.equal(theme.mode, 'dark');
    assert.ok(theme.tag);
  });

  it('correctly defines the Fiery Orange theme with specified hex colors', () => {
    const theme = THEMES.find((t) => t.id === 'sunset-orange');
    assert.ok(theme, 'sunset-orange must exist in THEMES');
    assert.equal(theme.name, 'Fiery Orange');
    assert.equal(theme.bg, '#000000', 'Pure black background');
    assert.equal(theme.surface, '#1A1A1A', 'Dark card surface');
    assert.equal(theme.border, '#262626', 'Subtle border');
    assert.equal(theme.accent, '#D7410E', 'Primary Fiery Burnt Orange accent');
    assert.equal(theme.mode, 'dark');
    assert.ok(theme.tag);
  });

  it('correctly defines the Warm Sage theme with specified hex colors', () => {
    const theme = THEMES.find((t) => t.id === 'arctic-blue');
    assert.ok(theme, 'arctic-blue must exist in THEMES');
    assert.equal(theme.name, 'Warm Sage');
    assert.equal(theme.bg, '#FFFFFF', 'Pure White background');
    assert.equal(theme.surface, '#F7F5F1', 'Primary card surface');
    assert.equal(theme.border, '#E4DED5', 'Warm Beige border');
    assert.equal(theme.accent, '#949686', 'Muted Sage Green accent');
    assert.equal(theme.mode, 'light');
    assert.ok(theme.tag);
  });

  it('verifies every theme has non-empty metadata, valid mode, and 6-digit hex values', () => {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    for (const theme of THEMES) {
      assert.ok(theme.id && typeof theme.id === 'string');
      assert.ok(theme.name && typeof theme.name === 'string');
      assert.ok(theme.subtitle && typeof theme.subtitle === 'string');
      assert.ok(['dark', 'light'].includes(theme.mode), `Invalid mode for ${theme.id}`);
      assert.match(theme.accent, hexRegex, `Invalid accent hex for ${theme.id}`);
      assert.match(theme.bg, hexRegex, `Invalid bg hex for ${theme.id}`);
      assert.match(theme.surface, hexRegex, `Invalid surface hex for ${theme.id}`);
      assert.match(theme.border, hexRegex, `Invalid border hex for ${theme.id}`);
      assert.ok(theme.tag && typeof theme.tag === 'string');
    }
  });

  it('verifies index.css defines complete design token sets for all 15 themes', () => {
    const cssPath = resolve('src/index.css');
    const css = readFileSync(cssPath, 'utf-8');

    const criticalTokens = [
      '--bg-main',
      '--bg-surface',
      '--bg-elevated',
      '--text-primary',
      '--text-secondary',
      '--text-muted',
      '--accent',
      '--accent-hover',
      '--accent-fg',
      '--border',
      '--typing-correct',
      '--typing-incorrect',
      '--typing-caret',
      '--key-bg',
      '--key-border',
      '--key-text',
      '--btn-primary-bg',
    ];

    for (const theme of THEMES) {
      const themeSelector = `[data-theme="${theme.id}"]`;
      assert.ok(css.includes(themeSelector), `CSS must contain selector for ${themeSelector}`);

      // Verify block has critical tokens
      const blockStart = css.indexOf(themeSelector);
      const blockEnd = css.indexOf('}', blockStart);
      const block = css.slice(blockStart, blockEnd);

      for (const token of criticalTokens) {
        assert.ok(block.includes(token), `Theme ${theme.id} CSS block missing token ${token}`);
      }
    }
  });

  it('verifies exact specified hex colors are used in index.css for the three new themes', () => {
    const cssPath = resolve('src/index.css');
    const css = readFileSync(cssPath, 'utf-8');

    // 1. Glacier Aqua
    const glacierBlock = css.slice(css.indexOf('[data-theme="glacier-aqua"]'), css.indexOf('}', css.indexOf('[data-theme="glacier-aqua"]')));
    assert.ok(glacierBlock.includes('#FFFFFF'), 'Glacier Aqua must contain White #FFFFFF');
    assert.ok(glacierBlock.includes('#008890'), 'Glacier Aqua must contain Deep Teal #008890');
    assert.ok(glacierBlock.includes('#D6E8EA'), 'Glacier Aqua must contain Subtle Border #D6E8EA');
    assert.ok(glacierBlock.includes('#10182B'), 'Glacier Aqua must contain Deep Navy #10182B');
    assert.ok(glacierBlock.includes('#526B7C'), 'Glacier Aqua must contain Secondary Text #526B7C');

    // 2. Forest Green (id: forest-sage)
    const forestBlock = css.slice(css.indexOf('[data-theme="forest-sage"]'), css.indexOf('}', css.indexOf('[data-theme="forest-sage"]')));
    assert.ok(forestBlock.includes('#FFFFFF'), 'Forest Green must contain White #FFFFFF');
    assert.ok(forestBlock.includes('#09473A'), 'Forest Green must contain Deep Forest Green #09473A');
    assert.ok(forestBlock.includes('#397A65'), 'Forest Green must contain Natural Green #397A65');
    assert.ok(forestBlock.includes('#23312D'), 'Forest Green must contain Deep Forest Navy #23312D');
    assert.ok(forestBlock.includes('#E2EAE3'), 'Forest Green must contain Subtle Border #E2EAE3');

    // 3. Sunny Golden Yellow (id: midnight-slate)
    const slateBlock = css.slice(css.indexOf('[data-theme="midnight-slate"]'), css.indexOf('}', css.indexOf('[data-theme="midnight-slate"]')));
    assert.ok(slateBlock.includes('#FFFFFF'), 'Sunny Golden Yellow must contain White #FFFFFF');
    assert.ok(slateBlock.includes('#F6C638'), 'Sunny Golden Yellow must contain Primary Sunny Yellow #F6C638');
    assert.ok(slateBlock.includes('#F9DB6B'), 'Sunny Golden Yellow must contain Secondary Golden Yellow #F9DB6B');
    assert.ok(slateBlock.includes('#F4EACF'), 'Sunny Golden Yellow must contain Warm Cream #F4EACF');
    assert.ok(slateBlock.includes('#833920'), 'Sunny Golden Yellow must contain Rich Cocoa Brown #833920');
    assert.ok(slateBlock.includes('#B99453'), 'Sunny Golden Yellow must contain Muted Golden Beige #B99453');
    assert.ok(slateBlock.includes('#FBF7E5'), 'Sunny Golden Yellow must contain Soft Cream Surface #FBF7E5');

    // 4. Electric Cobalt (id: forest-green)
    const cobaltBlock = css.slice(css.indexOf('[data-theme="forest-green"]'), css.indexOf('}', css.indexOf('[data-theme="forest-green"]')));
    assert.ok(cobaltBlock.includes('#FFFFFF'), 'Electric Cobalt must contain White #FFFFFF');
    assert.ok(cobaltBlock.includes('#101A35'), 'Electric Cobalt must contain Deep Midnight Navy #101A35');
    assert.ok(cobaltBlock.includes('#173CFF'), 'Electric Cobalt must contain Primary Electric Blue #173CFF');
    assert.ok(cobaltBlock.includes('#244FE8'), 'Electric Cobalt must contain Secondary Royal Blue #244FE8');
    assert.ok(cobaltBlock.includes('#E8EDF7'), 'Electric Cobalt must contain Soft Blue-Gray #E8EDF7');
    assert.ok(cobaltBlock.includes('#8793AA'), 'Electric Cobalt must contain Muted Slate #8793AA');
    assert.ok(cobaltBlock.includes('#F3F6FC'), 'Electric Cobalt must contain Light Blue Surface #F3F6FC');
    assert.ok(cobaltBlock.includes('#111A32'), 'Electric Cobalt must contain Dark Text #111A32');

    // 5. Charcoal Lime (id: dark-charcoal-lime)
    const limeBlock = css.slice(css.indexOf('[data-theme="dark-charcoal-lime"]'), css.indexOf('}', css.indexOf('[data-theme="dark-charcoal-lime"]')));
    assert.ok(limeBlock.includes('#000000'), 'Charcoal Lime must contain Pure Black #000000');
    assert.ok(limeBlock.includes('#C5FF00'), 'Charcoal Lime must contain Primary Neon Lime #C5FF00');
    assert.ok(limeBlock.includes('#B5F000'), 'Charcoal Lime must contain Secondary Lime #B5F000');
    assert.ok(limeBlock.includes('#FFFFFF'), 'Charcoal Lime must contain White #FFFFFF');
    assert.ok(limeBlock.includes('#E8E8E8'), 'Charcoal Lime must contain Soft Gray #E8E8E8');
    assert.ok(limeBlock.includes('#242424'), 'Charcoal Lime must contain Dark Charcoal #242424');
    assert.ok(limeBlock.includes('#A6A6A6'), 'Charcoal Lime must contain Muted Gray Text #A6A6A6');
    assert.ok(limeBlock.includes('#111111'), 'Charcoal Lime must contain Dark Text on White #111111');

    // 6. Lavender Dream (id: lavender-purple)
    const lavenderBlock = css.slice(css.indexOf('[data-theme="lavender-purple"]'), css.indexOf('}', css.indexOf('[data-theme="lavender-purple"]')));
    assert.ok(lavenderBlock.includes('#FFFFFF'), 'Lavender Dream must contain Pure White #FFFFFF');
    assert.ok(lavenderBlock.includes('#32214A'), 'Lavender Dream must contain Primary Deep Purple #32214A');
    assert.ok(lavenderBlock.includes('#624C74'), 'Lavender Dream must contain Secondary Muted Purple #624C74');
    assert.ok(lavenderBlock.includes('#E9E0F3'), 'Lavender Dream must contain Pale Lavender #E9E0F3');
    assert.ok(lavenderBlock.includes('#F9F6FC'), 'Lavender Dream must contain Soft Lavender-White #F9F6FC');
    assert.ok(lavenderBlock.includes('#21172D'), 'Lavender Dream must contain Main Text #21172D');
    assert.ok(lavenderBlock.includes('#756A80'), 'Lavender Dream must contain Secondary Text #756A80');
    assert.ok(lavenderBlock.includes('#E8E1EE'), 'Lavender Dream must contain Subtle Border #E8E1EE');

    // 7. Midnight Ocean (id: midnight-blue)
    const midnightOceanBlock = css.slice(css.indexOf('[data-theme="midnight-blue"]'), css.indexOf('}', css.indexOf('[data-theme="midnight-blue"]')));
    assert.ok(midnightOceanBlock.includes('#000000'), 'Midnight Ocean must contain Pure Black #000000');
    assert.ok(midnightOceanBlock.includes('#020817'), 'Midnight Ocean must contain Primary Dark Surface #020817');
    assert.ok(midnightOceanBlock.includes('#03152B'), 'Midnight Ocean must contain Secondary Dark Surface #03152B');
    assert.ok(midnightOceanBlock.includes('#06264A'), 'Midnight Ocean must contain Deep Ocean Blue #06264A');
    assert.ok(midnightOceanBlock.includes('#1749F5'), 'Midnight Ocean must contain Electric Blue #1749F5');
    assert.ok(midnightOceanBlock.includes('#245BFF'), 'Midnight Ocean must contain Secondary Electric Blue #245BFF');
    assert.ok(midnightOceanBlock.includes('#0B9DCE'), 'Midnight Ocean must contain Ocean Cyan #0B9DCE');
    assert.ok(midnightOceanBlock.includes('#43C8E8'), 'Midnight Ocean must contain Soft Cyan Highlight #43C8E8');
    assert.ok(midnightOceanBlock.includes('#F5F8FF'), 'Midnight Ocean must contain Main Text #F5F8FF');
    assert.ok(midnightOceanBlock.includes('#A9B7CC'), 'Midnight Ocean must contain Secondary Text #A9B7CC');
    assert.ok(midnightOceanBlock.includes('#71839D'), 'Midnight Ocean must contain Muted Text #71839D');
    assert.ok(midnightOceanBlock.includes('#142A46'), 'Midnight Ocean must contain Subtle Border #142A46');
    assert.ok(midnightOceanBlock.includes('#F4B642'), 'Midnight Ocean must contain Warm Gold Accent #F4B642');

    // 8. Fiery Orange (id: sunset-orange)
    const fieryBlock = css.slice(css.indexOf('[data-theme="sunset-orange"]'), css.indexOf('}', css.indexOf('[data-theme="sunset-orange"]')));
    assert.ok(fieryBlock.includes('#000000'), 'Fiery Orange must contain Pure Black #000000');
    assert.ok(fieryBlock.includes('#D7410E'), 'Fiery Orange must contain Fiery Burnt Orange #D7410E');
    assert.ok(fieryBlock.includes('#F15A24'), 'Fiery Orange must contain Secondary Orange #F15A24');
    assert.ok(fieryBlock.includes('#1A1A1A'), 'Fiery Orange must contain Dark Card Surface #1A1A1A');
    assert.ok(fieryBlock.includes('#262626'), 'Fiery Orange must contain Subtle Border #262626');
    assert.ok(fieryBlock.includes('#FFFFFF'), 'Fiery Orange must contain Primary Text #FFFFFF');
    assert.ok(fieryBlock.includes('#A3A3A3'), 'Fiery Orange must contain Secondary Text #A3A3A3');
    assert.ok(fieryBlock.includes('#737373'), 'Fiery Orange must contain Muted Text #737373');

    // 9. Warm Sage (id: arctic-blue)
    const sageBlock = css.slice(css.indexOf('[data-theme="arctic-blue"]'), css.indexOf('}', css.indexOf('[data-theme="arctic-blue"]')));
    assert.ok(sageBlock.includes('#FFFFFF'), 'Warm Sage must contain Pure White #FFFFFF');
    assert.ok(sageBlock.includes('#949686'), 'Warm Sage must contain Muted Sage Green #949686');
    assert.ok(sageBlock.includes('#B08369'), 'Warm Sage must contain Earthy Taupe #B08369');
    assert.ok(sageBlock.includes('#1F1D17'), 'Warm Sage must contain Deep Charcoal #1F1D17');
    assert.ok(sageBlock.includes('#F7F5F1'), 'Warm Sage must contain Primary Card Surface #F7F5F1');
    assert.ok(sageBlock.includes('#F0EAE3'), 'Warm Sage must contain Secondary Card Surface #F0EAE3');
    assert.ok(sageBlock.includes('#E4DED5'), 'Warm Sage must contain Subtle Border #E4DED5');
    assert.ok(sageBlock.includes('#77766D'), 'Warm Sage must contain Muted Grey #77766D');
  });
});
