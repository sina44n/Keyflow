import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('SoundSelector Dropdown Positioning & Overflow Resilience', () => {
  const soundSelectorPath = path.resolve(__dirname, '../components/common/SoundSelector.jsx');
  const heroSectionPath = path.resolve(__dirname, '../components/landing/HeroSection.jsx');

  const soundSelectorSrc = fs.readFileSync(soundSelectorPath, 'utf-8');
  const heroSectionSrc = fs.readFileSync(heroSectionPath, 'utf-8');

  it('guarantees SoundSelector defaults to auto alignment with dynamic positioning', () => {
    assert.ok(
      soundSelectorSrc.includes("align = 'auto'"),
      'SoundSelector must have align = "auto" default prop'
    );
    assert.ok(
      soundSelectorSrc.includes('computePlacement'),
      'SoundSelector must implement computePlacement for dynamic viewport/boundary calculation'
    );
  });

  it('guarantees SoundSelector popover has responsive dimensions and viewport boundary constraints', () => {
    assert.ok(
      soundSelectorSrc.includes('max-w-[calc(100vw-1.5rem)]'),
      'SoundSelector popover must constrain max-width to viewport width minus margins'
    );
    assert.ok(
      soundSelectorSrc.includes('w-[320px] sm:w-[360px]'),
      'SoundSelector popover must define proportional width across screen sizes'
    );
  });

  it('guarantees HeroSection sandbox terminal has overflow-visible to prevent clipping popovers', () => {
    assert.ok(
      heroSectionSrc.includes('id="sandbox"'),
      'HeroSection must retain id="sandbox"'
    );
    assert.ok(
      heroSectionSrc.includes('overflow-visible'),
      'HeroSection sandbox container must use overflow-visible instead of overflow-hidden'
    );
    assert.ok(
      !heroSectionSrc.includes('id="sandbox"\n              className="card-panel p-4 sm:p-6 shadow-xl relative overflow-hidden'),
      'HeroSection sandbox container must not clip popovers with overflow-hidden'
    );
  });

  it('guarantees HeroSection invokes SoundSelector with compact variant', () => {
    assert.ok(
      heroSectionSrc.includes('<SoundSelector variant="compact"'),
      'HeroSection must invoke SoundSelector with variant="compact"'
    );
  });

  it('guarantees SoundSelector category tabs and profile list prevent unwanted scrollbar collision', () => {
    assert.ok(
      soundSelectorSrc.includes('[scrollbar-width:none]'),
      'Category tabs must suppress horizontal scrollbars across browsers'
    );
    assert.ok(
      soundSelectorSrc.includes('pr-1.5'),
      'Profile list must provide adequate right padding for scrollbars'
    );
  });
});
