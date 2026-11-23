import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('KEYFLOW — Home Page "Start Practice Sprint" Scroll-To-Top Behavior', () => {
  const ctaSectionPath = path.resolve(__dirname, '../components/landing/CTASection.jsx');
  const ctaSectionContent = fs.readFileSync(ctaSectionPath, 'utf-8');

  it('1. Verifies Start Practice Sprint button scrolls to absolute top (top: 0)', () => {
    assert.ok(
      ctaSectionContent.includes('window.scrollTo(') || ctaSectionContent.includes('root.scrollTo('),
      'CTASection must call scrollTo'
    );
    assert.ok(
      ctaSectionContent.includes('top: 0'),
      'CTASection must specify top: 0 to reach the absolute top of the page'
    );
    assert.ok(
      ctaSectionContent.includes("behavior: 'smooth'"),
      'CTASection must preserve smooth scrolling behavior'
    );
  });

  it('2. Verifies removal of scrollIntoView to prevent partial navbar occlusion', () => {
    assert.ok(
      !ctaSectionContent.includes("document.getElementById('sandbox')"),
      'CTASection must not target #sandbox for scrolling'
    );
    assert.ok(
      !ctaSectionContent.includes('el.scrollIntoView'),
      'CTASection must not call el.scrollIntoView which causes offset below the navbar'
    );
  });
});
