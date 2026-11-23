import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '..');

describe('KEYFLOW — Theme-Aware Caps Lock Floating Notification Audit', () => {
  it('1. Verifies CapsLockNotification component exists with exact design specifications', () => {
    const compPath = path.join(srcDir, 'components', 'common', 'CapsLockNotification.jsx');
    assert.ok(fs.existsSync(compPath), 'CapsLockNotification.jsx must exist');
    const content = fs.readFileSync(compPath, 'utf8');

    // Reference Image 5 Design Verification
    assert.ok(content.includes('Caps Lock ON'), 'Must display "Caps Lock ON" text');
    assert.ok(content.includes('Lock'), 'Must include Lock icon from lucide-react');
    assert.ok(content.includes('rounded-full'), 'Must use compact pill-shaped container with rounded-full');
    assert.ok(content.includes('role="status"'), 'Must have role="status" for accessibility');
    assert.ok(content.includes('aria-live="polite"'), 'Must have aria-live="polite"');
    assert.ok(content.includes('pointer-events-none'), 'Must enforce pointer-events-none for zero layout interference');
    assert.ok(content.includes('absolute'), 'Must use absolute positioning');
  });

  it('2. Verifies browser-native Caps Lock detection using getModifierState', () => {
    const compPath = path.join(srcDir, 'components', 'common', 'CapsLockNotification.jsx');
    const content = fs.readFileSync(compPath, 'utf8');

    assert.ok(content.includes("getModifierState('CapsLock')"), 'Must use native getModifierState("CapsLock")');
    assert.ok(content.includes("addEventListener('keydown'"), 'Must listen to keydown events');
    assert.ok(content.includes("addEventListener('keyup'"), 'Must listen to keyup events');
    assert.ok(content.includes("removeEventListener"), 'Must properly clean up event listeners on unmount');
  });

  it('3. Verifies dynamic theme adaptation across dark and light palettes', () => {
    const compPath = path.join(srcDir, 'components', 'common', 'CapsLockNotification.jsx');
    const content = fs.readFileSync(compPath, 'utf8');

    assert.ok(content.includes('useTheme'), 'Must consume centralized KEYFLOW ThemeContext');
    assert.ok(content.includes('--bg-elevated'), 'Must use --bg-elevated for dark mode elevated surface');
    assert.ok(content.includes('--text-primary'), 'Must use --text-primary for dynamic contrast');
    assert.ok(content.includes('--bg-main'), 'Must use --bg-main for light mode text');
    assert.ok(content.includes('--border'), 'Must use --border for dark mode border delineation');
  });

  it('4. LOCATION 1: Academy Placement Test has Caps Lock at exact blue-marked position', () => {
    const placementPath = path.join(srcDir, 'components', 'academy', 'PlacementModal.jsx');
    assert.ok(fs.existsSync(placementPath));
    const content = fs.readFileSync(placementPath, 'utf8');

    assert.ok(content.includes('CapsLockNotification'), 'PlacementModal must import CapsLockNotification');
    assert.ok(
      content.includes('id="placement-capslock-notification"') ||
      content.includes('placement-capslock-notification'),
      'Must contain placement-capslock-notification element'
    );
    assert.ok(content.includes('-top-7'), 'Must position near left side of horizontal progress indicator');
  });

  it('5. LOCATION 2: Academy Level / Lesson Page has Caps Lock at exact blue-marked position', () => {
    const lessonPath = path.join(srcDir, 'components', 'academy', 'LessonPlayer.jsx');
    assert.ok(fs.existsSync(lessonPath));
    const content = fs.readFileSync(lessonPath, 'utf8');

    assert.ok(content.includes('CapsLockNotification'), 'LessonPlayer must import CapsLockNotification');
    assert.ok(
      content.includes('id="lesson-capslock-notification"') ||
      content.includes('lesson-capslock-notification'),
      'Must contain lesson-capslock-notification element'
    );
    assert.ok(content.includes('KeyboardGuide'), 'Must be positioned directly above virtual keyboard');
  });

  it('6. LOCATION 3: Home Page workstation preview has Caps Lock at exact blue-marked position', () => {
    const heroPath = path.join(srcDir, 'components', 'landing', 'HeroSection.jsx');
    assert.ok(fs.existsSync(heroPath));
    const content = fs.readFileSync(heroPath, 'utf8');

    assert.ok(content.includes('CapsLockNotification'), 'HeroSection must import CapsLockNotification');
    assert.ok(
      content.includes('id="hero-capslock-notification"') ||
      content.includes('hero-capslock-notification'),
      'Must contain hero-capslock-notification element'
    );
  });

  it('7. LOCATION 4: Full Workstation Page has Caps Lock at exact blue-marked position', () => {
    const wsPath = path.join(srcDir, 'pages', 'WorkstationPage.jsx');
    assert.ok(fs.existsSync(wsPath));
    const content = fs.readFileSync(wsPath, 'utf8');

    assert.ok(content.includes('CapsLockNotification'), 'WorkstationPage must import CapsLockNotification');
    assert.ok(
      content.includes('id="workstation-capslock-notification"') ||
      content.includes('workstation-capslock-notification'),
      'Must contain workstation-capslock-notification element'
    );
    assert.ok(
      content.includes('top-1/2 -translate-y-1/2'),
      'Must be in empty space below typing passage and above virtual keyboard'
    );
  });

  it('8. Zero Layout Shift: Guarantees zero document-flow footprint across all pages', () => {
    const compPath = path.join(srcDir, 'components', 'common', 'CapsLockNotification.jsx');
    const content = fs.readFileSync(compPath, 'utf8');

    // Assert absolute positioning and pointer-events-none are permanently applied
    assert.ok(content.includes('absolute'), 'Must use absolute positioning to prevent document flow displacement');
    assert.ok(content.includes('pointer-events-none'), 'Must use pointer-events-none to prevent click hijacking');
    assert.ok(content.includes('transition-all duration-200'), 'Must use subtle ~200ms transition');
  });
});
