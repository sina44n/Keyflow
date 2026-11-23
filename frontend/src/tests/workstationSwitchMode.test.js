import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const workstationPagePath = path.resolve(__dirname, '../pages/WorkstationPage.jsx');
const workstationToolbarPath = path.resolve(__dirname, '../components/workstation/WorkstationToolbar.jsx');

describe('KEYFLOW — Pixel-Precise Workstation Switch Mode Implementation Contract', () => {
  const pageSrc = fs.readFileSync(workstationPagePath, 'utf8');
  const toolbarSrc = fs.readFileSync(workstationToolbarPath, 'utf8');

  describe('1. Button Renaming & Two-Way Switching State', () => {
    it('renames Focus button to Switch in both modes', () => {
      // Must display <span>Switch</span> in WorkstationToolbar
      assert.ok(toolbarSrc.includes('<span>Switch</span>'), 'Toolbar must render button labeled Switch');
      assert.ok(!toolbarSrc.includes('<span>Focus</span>'), 'Old Focus label must be removed');

      // Accessibility attributes
      assert.ok(toolbarSrc.includes('aria-label="Switch Mode"'), 'Button must have accessible Switch Mode label');
      assert.ok(toolbarSrc.includes('data-testid="workstation-switch-mode-toggle"'), 'Must have switch mode test ID');
    });

    it('implements active and inactive styling based on switchMode / focusMode state', () => {
      // Active state highlighted with accent color
      assert.ok(
        toolbarSrc.includes("isSwitchActive") && toolbarSrc.includes("bg-[var(--accent)] text-[var(--accent-fg)] font-bold"),
        'Active switch state must apply highlighted accent styling'
      );
      // Inactive state uses subtle surface/border styling
      assert.ok(
        toolbarSrc.includes("bg-[var(--bg-elevated)] text-[var(--text-secondary)]"),
        'Inactive switch state must apply subtle secondary styling'
      );
    });

    it('persists switch mode state in localStorage for seamless reload', () => {
      assert.ok(
        pageSrc.includes("localStorage.getItem('keyflow_workstation_switch_mode')"),
        'WorkstationPage hydrates switch mode from localStorage'
      );
      assert.ok(
        pageSrc.includes("localStorage.setItem('keyflow_workstation_switch_mode'"),
        'WorkstationPage persists switch mode state to localStorage'
      );
    });
  });

  describe('2. Specific Removal Requirement — Clean Area Above Text', () => {
    it('completely removes globe english | star expert selector and renders no controls above text', () => {
      assert.ok(!pageSrc.includes('globe english'), 'Must not contain globe english');
      assert.ok(!pageSrc.includes('star expert'), 'Must not contain star expert');
      assert.ok(!toolbarSrc.includes('globe english'), 'Toolbar must not contain globe english');
      assert.ok(!toolbarSrc.includes('star expert'), 'Toolbar must not contain star expert');
      assert.ok(!pageSrc.includes('expert'), 'Must not contain expert difficulty selector');
    });
  });

  describe('3. Switch Mode Layout & Proportions (Screenshot 2 Match)', () => {
    it('hides secondary page header (Workstation title, Profile, Explore Academy) in Switch mode', () => {
      assert.ok(
        pageSrc.includes('{!focusMode && (') && pageSrc.includes('{t(\'nav.workstation\') || \'Workstation\'}'),
        'Page header must be hidden when focusMode/switchMode is active'
      );
    });

    it('transforms toolbar into centered floating pill layout in Switch mode', () => {
      // Centered layout classes for Row 1 and Row 2 in switch mode
      assert.ok(
        toolbarSrc.includes("justify-center gap-4 sm:gap-6 w-full"),
        'Row 1 and Row 2 must be centered with balanced gap in switch mode'
      );
    });

    it('renders measured 1.5-inch desktop horizontal margins matching reference geometry', () => {
      assert.ok(
        pageSrc.includes('100vw-3in') && pageSrc.includes('workstation-switch-mode-text-container'),
        'Switch mode text container must enforce measured 1.5-inch desktop margins (calc(100vw-3in)) without cramping'
      );
    });

    it('completely removes Keys On and Hands On tools from the switch mode toolbar', () => {
      // In the switch mode block, Keys On and Hands On must be completely removed
      const switchModeBlock = toolbarSrc.slice(toolbarSrc.indexOf('if (isSwitchActive) {'), toolbarSrc.indexOf('return (', toolbarSrc.indexOf('if (isSwitchActive) {') + 200));
      assert.ok(!switchModeBlock.includes('Keys On'), 'Switch mode toolbar must not contain Keys On');
      assert.ok(!switchModeBlock.includes('Hands On'), 'Switch mode toolbar must not contain Hands On');
    });

    it('implements intelligent toolbar auto-hide while typing with mouse movement reveal and zero layout shift', () => {
      // Must contain auto-hide state and mouse movement listener
      assert.ok(pageSrc.includes('isToolbarVisible'), 'WorkstationPage must manage isToolbarVisible state');
      assert.ok(pageSrc.includes('handleMouseMove'), 'WorkstationPage must implement handleMouseMove listener');
      assert.ok(pageSrc.includes('h-[76px] min-h-[76px]'), 'Must reserve toolbar layout space with fixed height wrapper to guarantee zero layout shift');
      assert.ok(pageSrc.includes('transition-opacity duration-200'), 'Must use smooth opacity transitions for toolbar visibility');
    });

    it('renders active timer/progress display in the reserved space above text', () => {
      assert.ok(pageSrc.includes('workstation-active-timer'), 'WorkstationPage must render active countdown timer above text');
      assert.ok(pageSrc.includes('remainingTime'), 'Timer must render remainingTime countdown');
    });

    it('renders floating cardless text directly on canvas in Switch mode', () => {
      assert.ok(
        pageSrc.includes('workstation-switch-mode-text-container'),
        'Must support switch mode text container testid'
      );
      assert.ok(
        pageSrc.includes('border-0 bg-transparent shadow-none'),
        'Switch mode text container must have no card box, no border, no background'
      );
    });

    it('renders spacious 3-line viewport with generous line-height matching Screenshot 2', () => {
      assert.ok(
        pageSrc.includes("calc(3 * 2.2em)"),
        'Switch mode viewport must render exactly 3 lines with spacious line-height'
      );
      assert.ok(
        pageSrc.includes("leading-[2.2]"),
        'Switch mode must use generous leading-[2.2]'
      );
    });

    it('preserves centered restart icon with CapsLockNotification below text', () => {
      assert.ok(
        pageSrc.includes('w-full flex items-center justify-center py-0.5 -my-1 relative max-w-[820px] mx-auto'),
        'Restart control must remain centered below text'
      );
      assert.ok(
        pageSrc.includes('CapsLockNotification'),
        'CapsLockNotification must remain present beside centered reset button'
      );
    });

    it('hides virtual keyboard by default in Switch mode', () => {
      assert.ok(
        pageSrc.includes('(!focusMode && (keyboardGuideOn || handGuideOn)) || (focusMode && showGuidesInSwitch'),
        'Virtual keyboard must be hidden by default in switch mode'
      );
    });
  });

  describe('4. Single-Screen 100dvh Zero-Scroll Architecture', () => {
    it('enforces overflow-hidden and viewport height constraining on switch mode wrapper', () => {
      assert.ok(
        pageSrc.includes('h-[calc(100dvh-5rem)] max-h-[calc(100dvh-5rem)] overflow-hidden'),
        'Switch mode container must be constrained to 100dvh single screen with overflow-hidden'
      );
    });
  });

  describe('5. Dynamic Theme Variable Inheritance', () => {
    it('uses standard CSS variables rather than hardcoding dark or yellow colors', () => {
      // Must use var(--bg-main), var(--accent), var(--border), var(--text-primary)
      assert.ok(toolbarSrc.includes('var(--accent)'), 'Toolbar must use var(--accent)');
      assert.ok(toolbarSrc.includes('var(--border)'), 'Toolbar must use var(--border)');
      assert.ok(toolbarSrc.includes('var(--bg-elevated)'), 'Toolbar must use var(--bg-elevated)');
      assert.ok(pageSrc.includes('var(--accent)'), 'WorkstationPage must use var(--accent)');
      assert.ok(!toolbarSrc.includes('#e2b714'), 'Must not hardcode yellow accent #e2b714');
      assert.ok(!toolbarSrc.includes('#2b2b2b'), 'Must not hardcode dark gray background #2b2b2b');
    });
  });

  describe('6. Tool Focus Restoration & Anti-Theft Protection', () => {
    it('prevents tool clicks from stealing focus on mousedown in both modes', () => {
      assert.ok(
        toolbarSrc.includes('handlePreventFocusTheft') && toolbarSrc.includes('onMouseDown={handlePreventFocusTheft}'),
        'Toolbar must implement onMouseDown focus-theft prevention'
      );
    });

    it('passes onRestoreFocus callback and invokes it on tool action in WorkstationToolbar', () => {
      assert.ok(pageSrc.includes('onRestoreFocus={focusInputAndSyncCaret}'), 'WorkstationPage must pass onRestoreFocus callback');
      assert.ok(toolbarSrc.includes('onRestoreFocus'), 'WorkstationToolbar must accept onRestoreFocus prop');
    });
  });

  describe('7. Page-Specific Session Isolation (Page A vs Page B)', () => {
    it('maintains independent session refs for Page A (standard) and Page B (switch)', () => {
      assert.ok(pageSrc.includes('pageASessionRef'), 'Must maintain pageASessionRef for Page A');
      assert.ok(pageSrc.includes('pageBSessionRef'), 'Must maintain pageBSessionRef for Page B');
      assert.ok(pageSrc.includes('createInitialSessionState'), 'Must initialize independent session structures');
    });

    it('snapshots departing session and restores arriving session upon switching', () => {
      assert.ok(pageSrc.includes('departingRef.current = {'), 'Must snapshot departing session on switch');
      assert.ok(pageSrc.includes('const target = arrivingRef.current'), 'Must restore arriving session on switch');
    });
  });

  describe('8. Page-Specific Tool Auto-Hide Scoping', () => {
    it('scopes auto-hide strictly to Page B (focusMode / switchMode)', () => {
      assert.ok(
        pageSrc.includes('if (focusMode && isToolbarVisibleRef.current)'),
        'Toolbar auto-hide in handleInputChange must be strictly scoped to focusMode'
      );
      assert.ok(
        pageSrc.includes('if (focusMode && isToolbarVisibleRef.current && ![\'Escape\'].includes(e.key))'),
        'Toolbar auto-hide in onKeyDown must be strictly scoped to focusMode'
      );
    });

    it('keeps Page A toolbar permanently visible during typing', () => {
      assert.ok(
        pageSrc.includes("isToolbarVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'") &&
        pageSrc.includes(": 'opacity-100 pointer-events-auto'"),
        'Page A toolbar wrapper must remain permanently visible with opacity-100'
      );
    });
  });

  describe('9. Vertical Spacing Refinement & Goal Control Placement', () => {
    it('reduces navbar-to-tools vertical gap and moves typing area up by ~1.25 inches', () => {
      assert.ok(
        pageSrc.includes('justify-start items-center pt-8 sm:pt-10 md:pt-12'),
        'Page B container must use justify-start with top padding (pt-8/pt-10/pt-12) to reduce gap'
      );
    });

    it('renders Goal control beside active timer on Page B', () => {
      assert.ok(
        pageSrc.includes('data-testid="workstation-switch-goal-control"'),
        'Page B must render Goal control with data-testid="workstation-switch-goal-control"'
      );
      assert.ok(
        pageSrc.includes('setWpmGoal'),
        'Goal control must invoke setWpmGoal'
      );
    });
  });
});
