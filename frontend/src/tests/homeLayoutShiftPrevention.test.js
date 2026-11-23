import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('KEYFLOW — Home Page Layout Shift Prevention Audit', () => {
  const heroPath = path.resolve(__dirname, '../components/landing/HeroSection.jsx');

  it('1. Verifies HeroSection.jsx exists and is accessible', () => {
    assert.ok(fs.existsSync(heroPath), 'HeroSection.jsx must exist');
  });

  it('2. Verifies 2-column hero grid uses items-start to eliminate vertical shift on right-panel expansion', () => {
    const content = fs.readFileSync(heroPath, 'utf-8');
    assert.ok(
      content.includes('grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 items-start'),
      'Hero grid must use items-start instead of items-center to decouple vertical alignment'
    );
    assert.ok(
      !content.includes('grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 items-center'),
      'Hero grid must NOT use items-center which causes vertical layout shifts'
    );
  });

  it('3. Verifies left column uses anchored resting top padding on desktop viewports', () => {
    const content = fs.readFileSync(heroPath, 'utf-8');
    assert.ok(
      content.includes('lg:col-span-5 space-y-6 text-left lg:pt-[112px] xl:pt-[135px]'),
      'Left column must apply calibrated resting padding (lg:pt-[112px] xl:pt-[135px]) to preserve original visual balance'
    );
  });

  it('4. Verifies all left-column content elements remain intact', () => {
    const content = fs.readFileSync(heroPath, 'utf-8');
    assert.ok(content.includes("t('hero.title', 'Type with intuition.')"), 'Headline must remain intact');
    assert.ok(content.includes("t('hero.titleAccent', 'Flow without friction.')"), 'Headline accent must remain intact');
    assert.ok(content.includes("t('hero.subtitle'"), 'Subtitle must remain intact');
    assert.ok(content.includes("t('hero.launchWorkstation', 'Launch Workstation')"), 'Launch button must remain intact');
    assert.ok(content.includes("t('hero.exploreAcademy'"), 'Explore Academy button must remain intact');
  });

  it('5. Verifies right-column interactive typing workstation and results remain intact', () => {
    const content = fs.readFileSync(heroPath, 'utf-8');
    assert.ok(content.includes('id="sandbox"'), 'Sandbox card must remain intact');
    assert.ok(content.includes('isCompleted && ('), 'Sprint completed feedback card must remain intact');
    assert.ok(content.includes('handleReset'), 'Reset handler must remain intact');
  });
});
