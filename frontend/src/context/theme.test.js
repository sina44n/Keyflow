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

  it('correctly defines the Espresso & Latte theme with specified hex colors', () => {
    const theme = THEMES.find((t) => t.id === 'espresso-latte');
    assert.ok(theme, 'espresso-latte must exist in THEMES');
    assert.equal(theme.name, 'Espresso & Latte');
    assert.equal(theme.bg, '#2B1D17', 'Deep espresso background');
    assert.equal(theme.border, '#6B4A3A', 'Mocha border');
    assert.equal(theme.accent, '#C48A5A', 'Caramel accent');
    assert.equal(theme.mode, 'dark');
    assert.ok(theme.tag);
  });

  it('correctly defines the Forest Sage theme with specified hex colors', () => {
    const theme = THEMES.find((t) => t.id === 'forest-sage');
    assert.ok(theme, 'forest-sage must exist in THEMES');
    assert.equal(theme.name, 'Forest Sage');
    assert.equal(theme.bg, '#0F2A1D', 'Deep Forest background');
    assert.equal(theme.border, '#375534', 'Forest Green border');
    assert.equal(theme.accent, '#6B9071', 'Sage Green accent');
    assert.equal(theme.mode, 'dark');
    assert.ok(theme.tag);
  });

  it('correctly defines the Midnight Slate theme with specified hex colors', () => {
    const theme = THEMES.find((t) => t.id === 'midnight-slate');
    assert.ok(theme, 'midnight-slate must exist in THEMES');
    assert.equal(theme.name, 'Midnight Slate');
    assert.equal(theme.bg, '#06141B', 'Deep Midnight background');
    assert.equal(theme.surface, '#11212D', 'Dark Slate surface');
    assert.equal(theme.border, '#253745', 'Slate Blue border');
    assert.equal(theme.accent, '#9BA8AB', 'Mist Gray accent');
    assert.equal(theme.mode, 'dark');
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

    // 1. Espresso & Latte
    const espressoBlock = css.slice(css.indexOf('[data-theme="espresso-latte"]'), css.indexOf('}', css.indexOf('[data-theme="espresso-latte"]')));
    assert.ok(espressoBlock.includes('#2B1D17'), 'Espresso & Latte must contain Espresso #2B1D17');
    assert.ok(espressoBlock.includes('#6B4A3A'), 'Espresso & Latte must contain Mocha #6B4A3A');
    assert.ok(espressoBlock.includes('#C48A5A'), 'Espresso & Latte must contain Caramel #C48A5A');
    assert.ok(espressoBlock.includes('#E7D6C1'), 'Espresso & Latte must contain Latte #E7D6C1');
    assert.ok(espressoBlock.includes('#FAF6F0'), 'Espresso & Latte must contain Cream #FAF6F0');

    // 2. Forest Sage
    const forestBlock = css.slice(css.indexOf('[data-theme="forest-sage"]'), css.indexOf('}', css.indexOf('[data-theme="forest-sage"]')));
    assert.ok(forestBlock.includes('#0F2A1D'), 'Forest Sage must contain Deep Forest #0F2A1D');
    assert.ok(forestBlock.includes('#375534'), 'Forest Sage must contain Forest Green #375534');
    assert.ok(forestBlock.includes('#6B9071'), 'Forest Sage must contain Sage Green #6B9071');
    assert.ok(forestBlock.includes('#AEC3B0'), 'Forest Sage must contain Soft Sage #AEC3B0');
    assert.ok(forestBlock.includes('#E3EED4'), 'Forest Sage must contain Pale Green #E3EED4');

    // 3. Midnight Slate
    const slateBlock = css.slice(css.indexOf('[data-theme="midnight-slate"]'), css.indexOf('}', css.indexOf('[data-theme="midnight-slate"]')));
    assert.ok(slateBlock.includes('#06141B'), 'Midnight Slate must contain Deep Midnight #06141B');
    assert.ok(slateBlock.includes('#11212D'), 'Midnight Slate must contain Dark Slate #11212D');
    assert.ok(slateBlock.includes('#253745'), 'Midnight Slate must contain Slate Blue #253745');
    assert.ok(slateBlock.includes('#4A5C6A'), 'Midnight Slate must contain Steel Slate #4A5C6A');
    assert.ok(slateBlock.includes('#9BA8AB'), 'Midnight Slate must contain Mist Gray #9BA8AB');
    assert.ok(slateBlock.includes('#CCD0CF'), 'Midnight Slate must contain Cloud Gray #CCD0CF');
  });
});
