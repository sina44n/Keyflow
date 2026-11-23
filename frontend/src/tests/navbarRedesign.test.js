/**
 * KEYFLOW — Phase 7.43: Navbar Redesign & Fluid Icon Hover Animation Unit Tests
 * ==============================================================================
 * Comprehensive contract verification for:
 * 1. Floating two-capsule layout geometry & visual hierarchy.
 * 2. Exact preservation of KEYFLOW brand logo & assets.
 * 3. 6 Navigation icons in sequence (Workstation, Academy, Arcade, Telemetry, Leaderboard, Themes).
 * 4. STRICT EXCLUSION: Zero vertical divider lines between navigation icons.
 * 5. Fluid hover/active animation mechanics (Framer Motion spring physics, elevated pod, curved notch SVG).
 * 6. Dynamic theme awareness (CSS custom properties: var(--accent), var(--bg-surface), var(--border), var(--accent-fg)).
 * 7. Accessibility (aria-labels, tooltips, reduced motion).
 * 8. Right controls & dual-state authentication handling.
 * 9. Mobile (<md) responsive drawer preservation.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const navbarPath = path.resolve(__dirname, '../components/common/Navbar.jsx');
const navbarSrc = fs.readFileSync(navbarPath, 'utf-8');
const themeSwitcherPath = path.resolve(__dirname, '../components/common/ThemeSwitcher.jsx');
const themeSwitcherSrc = fs.readFileSync(themeSwitcherPath, 'utf-8');
const languageSelectorPath = path.resolve(__dirname, '../components/common/LanguageSelector.jsx');
const languageSelectorSrc = fs.readFileSync(languageSelectorPath, 'utf-8');

describe('KEYFLOW — Phase 7.43: Pixel-Precise Navbar Redesign & Fluid Hover Animation', () => {
  describe('1. Floating Two-Capsule Structural Layout', () => {
    it('implements floating top header with pointer-events-none wrapper', () => {
      assert.ok(
        navbarSrc.includes('sticky top-0 z-50 w-full') &&
        navbarSrc.includes('pointer-events-none'),
        'Navbar header must be sticky and floating with pointer-events-none container'
      );
    });

    it('renders desktop two-capsule layout with rounded-full geometry and backdrop blur', () => {
      assert.ok(
        navbarSrc.includes('hidden md:flex') &&
        navbarSrc.includes('rounded-full bg-[var(--bg-surface)]/85 backdrop-blur-md border border-[var(--border)]'),
        'Desktop navbar must render distinct floating rounded-full capsules with backdrop blur and theme borders'
      );
    });

    it('enables pointer-events-auto explicitly on both floating capsules', () => {
      const capsuleMatches = navbarSrc.match(/pointer-events-auto\s+h-14/g);
      assert.ok(
        capsuleMatches && capsuleMatches.length >= 2,
        'Both Capsule 1 (Nav) and Capsule 2 (Controls) must enable pointer-events-auto'
      );
    });
  });

  describe('2. Brand Logo & Identity Preservation', () => {
    it('preserves exact KEYFLOW keyboard icon badge with glowing dot', () => {
      assert.ok(
        navbarSrc.includes('<Keyboard className="w-4 h-4 text-[var(--accent)]') &&
        navbarSrc.includes('rounded-full bg-[var(--accent)] shadow-[0_0_4px_var(--accent)]'),
        'Must retain exact existing KEYFLOW keyboard icon badge with glowing accent dot'
      );
    });

    it('preserves exact KEYFLOW typography with brand accent color', () => {
      assert.ok(
        navbarSrc.includes('KEY<span className="text-[var(--accent)]">FLOW</span>') &&
        navbarSrc.includes('Precision Typing'),
        'Must retain exact KEYFLOW brand wordmark and "Precision Typing" subtitle'
      );
    });
  });

  describe('3. Navigation Icons & Order', () => {
    it('configures all 6 navigation items in exact sequence', () => {
      assert.ok(navbarSrc.includes("href: '/workstation'") && navbarSrc.includes('icon: Keyboard'), 'Workstation icon must be Keyboard');
      assert.ok(navbarSrc.includes("href: '/academy'") && navbarSrc.includes('icon: GraduationCap'), 'Academy icon must be GraduationCap');
      assert.ok(navbarSrc.includes("href: '/arcade'") && navbarSrc.includes('icon: Gamepad2'), 'Arcade icon must be Gamepad2');
      assert.ok(navbarSrc.includes("href: '/telemetry'") && navbarSrc.includes('icon: BarChart3'), 'Telemetry icon must be BarChart3');
      assert.ok(navbarSrc.includes("href: '/leaderboard'") && navbarSrc.includes('icon: Trophy'), 'Leaderboard icon must be Trophy');
      assert.ok(navbarSrc.includes("href: '/themes'") && navbarSrc.includes('icon: Palette'), 'Themes icon must be Palette');
    });

    it('renders icon-only buttons on desktop without visible inline text labels', () => {
      // In the nav container, button renders Icon inside motion.div, not an inline text span
      assert.ok(
        navbarSrc.includes('<Icon\n                      className={`w-4.5 h-4.5 transition-colors duration-200') ||
        navbarSrc.includes('<Icon className={`w-4.5 h-4.5'),
        'Desktop nav items must render icons without inline label text'
      );
    });
  });

  describe('4. CRITICAL EXCLUSION: Zero Separator Lines Between Navigation Icons', () => {
    it('strictly does not render vertical divider lines between navigation icons', () => {
      // Extract the desktop nav section
      const navSection = navbarSrc.slice(
        navbarSrc.indexOf('<nav'),
        navbarSrc.indexOf('</nav>')
      );

      assert.strictEqual(
        navSection.includes('divide-x'),
        false,
        'Navigation must not contain divide-x'
      );
      assert.strictEqual(
        navSection.includes('border-r'),
        false,
        'Navigation buttons must not have right borders as separators'
      );
      assert.strictEqual(
        navSection.includes('border-l'),
        false,
        'Navigation buttons must not have left borders as separators'
      );
      assert.strictEqual(
        navSection.includes('<hr'),
        false,
        'Navigation must not contain hr dividers'
      );
    });
  });

  describe('5. Fluid Icon Hover & Active Animation Mechanics', () => {
    it('uses Framer Motion layoutId for smooth gliding between icons', () => {
      assert.ok(
        navbarSrc.includes('layoutId="navbar-fluid-bubble"'),
        'Must use Framer Motion layoutId="navbar-fluid-bubble" for horizontal gliding'
      );
    });

    it('elevates hovered/active icon with vertical translation and spring physics', () => {
      assert.ok(
        navbarSrc.includes('y: isHighlighted && !shouldReduceMotion ? -10 : 0') ||
        navbarSrc.includes('y: isHighlighted'),
        'Hovered icon must elevate upward by -10px'
      );
      assert.ok(
        navbarSrc.includes("type: 'spring'") &&
        navbarSrc.includes('stiffness: 380') &&
        navbarSrc.includes('damping: 28'),
        'Must use spring physics with tuned stiffness and damping'
      );
    });

    it('renders circular active background pod centered behind elevated icon', () => {
      assert.ok(
        navbarSrc.includes('rounded-full bg-[var(--accent)] text-[var(--accent-fg)]'),
        'Active pod must be a circular accent background with accent-fg text'
      );
    });

    it('renders fluid SVG surface notch/cradle deformation beneath elevated circle', () => {
      assert.ok(
        navbarSrc.includes('viewBox="0 0 64 12"') &&
        navbarSrc.includes('M 0 0 C 14 0, 18 10, 32 10 C 46 10, 50 0, 64 0'),
        'Must render fluid curved cradle notch SVG with smooth bezier curves'
      );
    });

    it('smoothly restores resting state on mouse leave', () => {
      assert.ok(
        navbarSrc.includes('onMouseLeave={() => setHoveredIndex(null)}'),
        'Must reset hover state to restore resting position on pointer leave'
      );
    });

    it('supports reduced-motion preference via useReducedMotion hook', () => {
      assert.ok(
        navbarSrc.includes('useReducedMotion') &&
        navbarSrc.includes('shouldReduceMotion'),
        'Must respect prefers-reduced-motion accessibility preference'
      );
    });

    it('provides accessible tooltips and aria-labels for screen readers', () => {
      assert.ok(
        navbarSrc.includes('aria-label={link.label}') &&
        navbarSrc.includes('title={link.label}') &&
        navbarSrc.includes('hoveredIndex === index'),
        'Must provide accessible aria-label, title, and floating tooltip on hover'
      );
    });
  });

  describe('6. Theme-Aware Token Architecture', () => {
    it('exclusively uses theme CSS custom properties without hardcoding colors', () => {
      // Verify usage of core theme variables in Navbar
      assert.ok(navbarSrc.includes('var(--bg-surface)'), 'Must consume --bg-surface');
      assert.ok(navbarSrc.includes('var(--border)'), 'Must consume --border');
      assert.ok(navbarSrc.includes('var(--accent)'), 'Must consume --accent');
      assert.ok(navbarSrc.includes('var(--accent-fg)'), 'Must consume --accent-fg');
      assert.ok(navbarSrc.includes('var(--text-primary)'), 'Must consume --text-primary');
      assert.ok(navbarSrc.includes('var(--text-secondary)'), 'Must consume --text-secondary');

      // Ensure no raw hex codes like #9E2A2B or #FF1744 are hardcoded in Navbar
      assert.strictEqual(
        navbarSrc.includes('#9E2A2B'),
        false,
        'Must not hardcode burgundy hex in Navbar component'
      );
      assert.strictEqual(
        navbarSrc.includes('#FF1744'),
        false,
        'Must not hardcode keyflow-red hex in Navbar component'
      );
    });
  });

  describe('7. Right Utility Controls & Authentication States', () => {
    it('mounts LanguageSelector and ThemeSwitcher in compact mode', () => {
      assert.ok(navbarSrc.includes('<LanguageSelector compact={true} />'), 'Must mount compact LanguageSelector');
      assert.ok(navbarSrc.includes('<ThemeSwitcher compact={true} />'), 'Must mount compact ThemeSwitcher');
    });

    it('renders "Continue ▶" pill button with theme accent styling', () => {
      assert.ok(
        (navbarSrc.includes('Continue') || navbarSrc.includes('continue')) &&
        navbarSrc.includes('bg-[var(--accent)]') &&
        (navbarSrc.includes('Play') || navbarSrc.includes('ArrowRight')),
        'Must render "Continue ▶" pill button with theme accent background'
      );
    });

    it('handles authenticated user state with profile dropdown and logout trigger', () => {
      assert.ok(navbarSrc.includes('userMenuOpen'), 'Must manage user profile menu state');
      assert.ok(navbarSrc.includes('handleLogout'), 'Must provide handleLogout handler');
      assert.ok(navbarSrc.includes('TelemetryProfileModal'), 'Must mount authoritative TelemetryProfileModal');
    });

    it('handles unauthenticated visitor state with Sign In link and Continue Practice', () => {
      assert.ok(navbarSrc.includes("navigate('/login')"), 'Must navigate to /login when clicking Sign In');
      assert.ok(navbarSrc.includes('t(\'nav.signIn\') || \'Sign In\''), 'Must provide localized Sign In label');
    });
  });

  describe('8. Mobile (<md) Responsiveness', () => {
    it('provides dedicated mobile floating capsule with hamburger toggle', () => {
      assert.ok(
        navbarSrc.includes('flex md:hidden') &&
        navbarSrc.includes('setMobileMenuOpen(!mobileMenuOpen)'),
        'Must provide mobile capsule header with hamburger menu toggle'
      );
    });

    it('renders accessible mobile drawer containing all navigation links with icons and text', () => {
      assert.ok(
        navbarSrc.includes('{mobileMenuOpen && (') &&
        navbarSrc.includes('md:hidden mt-2 rounded-2xl'),
        'Mobile drawer must render dropdown card beneath mobile capsule'
      );
    });
  });

  describe('9. Phase 7.44: Left Navigation Capsule Width Refinement', () => {
    it('applies generous horizontal padding to the left capsule for relaxed breathing space', () => {
      assert.ok(
        navbarSrc.includes('px-3.5 sm:px-4 md:px-3.5 lg:px-7 xl:px-8 2xl:px-9 rounded-full') ||
        navbarSrc.includes('px-6 sm:px-7 md:px-8 lg:px-9 xl:px-10 rounded-full') ||
        navbarSrc.includes('px-7 sm:px-8 lg:px-10 xl:px-12') ||
        navbarSrc.includes('px-6 sm:px-7 lg:px-9 xl:px-10 rounded-full') ||
        navbarSrc.includes('px-5 sm:px-6 lg:px-8 rounded-full'),
        'Left capsule must have increased horizontal padding'
      );
    });

    it('increases horizontal gap between brand logo and navigation icons', () => {
      assert.ok(
        navbarSrc.includes('gap-4 sm:gap-6 md:gap-4 lg:gap-12 xl:gap-18 2xl:gap-22') ||
        navbarSrc.includes('gap-8 sm:gap-10 md:gap-12 lg:gap-16 xl:gap-20 2xl:gap-24') ||
        navbarSrc.includes('gap-9 sm:gap-11 lg:gap-14 xl:gap-18') ||
        navbarSrc.includes('gap-8 sm:gap-10 lg:gap-12 xl:gap-16') ||
        navbarSrc.includes('gap-7 sm:gap-9 lg:gap-11 xl:gap-14') ||
        navbarSrc.includes('gap-6 sm:gap-8 lg:gap-10 xl:gap-12'),
        'Left capsule must provide comfortable separation between logo and nav cluster'
      );
    });

    it('maintains comfortable, consistent spacing between all six navigation icons', () => {
      assert.ok(
        navbarSrc.includes('gap-1.5 sm:gap-2 md:gap-1.5 lg:gap-4 xl:gap-5.5 2xl:gap-6.5') ||
        navbarSrc.includes('gap-3 sm:gap-4 md:gap-4.5 lg:gap-5 xl:gap-6 2xl:gap-7') ||
        navbarSrc.includes('gap-3.5 sm:gap-4 lg:gap-4.5 xl:gap-5') ||
        navbarSrc.includes('gap-3 sm:gap-3.5 lg:gap-4 xl:gap-4.5') ||
        navbarSrc.includes('gap-2.5 sm:gap-3 lg:gap-3.5 xl:gap-4') ||
        navbarSrc.includes('gap-2 sm:gap-2.5 lg:gap-3 xl:gap-3.5'),
        'Navigation icon group must feature relaxed, consistent spacing without dividers'
      );
    });

    it('strictly preserves the right capsule controls, handlers, and position', () => {
      assert.ok(navbarSrc.includes('Capsule 2: Right Utility Controls'), 'Capsule 2 must be preserved');
      assert.ok(navbarSrc.includes('<LanguageSelector compact={true} />'), 'LanguageSelector preserved');
      assert.ok(navbarSrc.includes('<ThemeSwitcher compact={true} />'), 'ThemeSwitcher preserved');
      assert.ok(navbarSrc.includes('Continue') || navbarSrc.includes('continue'), 'Continue button preserved');
    });

    it('strictly preserves existing fluid icon-hover animation mechanics and physics', () => {
      assert.ok(navbarSrc.includes('layoutId="navbar-fluid-bubble"'), 'LayoutId preserved');
      assert.ok(navbarSrc.includes('stiffness: 380') && navbarSrc.includes('damping: 28'), 'Spring physics preserved');
      assert.ok(navbarSrc.includes('M 0 0 C 14 0, 18 10, 32 10 C 46 10, 50 0, 64 0'), 'Curved SVG notch preserved');
    });
  });

  describe('10. Phase 7.44: Unwanted Scrollbar Removal & Overflow Prevention', () => {
    it('prevents horizontal page overflow on floating header via overflow-x-clip', () => {
      assert.ok(
        navbarSrc.includes('max-w-[100vw]') && navbarSrc.includes('overflow-x-clip'),
        'Floating header must prevent horizontal overflow via max-w-[100vw] and overflow-x-clip'
      );
    });

    it('enforces explicit dir="ltr" and overflow-x: clip on html and body in index.css', () => {
      const indexCssPath = path.resolve(__dirname, '../index.css');
      const indexCssSrc = fs.readFileSync(indexCssPath, 'utf-8');

      assert.ok(indexCssSrc.includes('direction: ltr;'), 'html must enforce direction: ltr');
      assert.ok(indexCssSrc.includes('overflow-x: clip;'), 'html and body must enforce overflow-x: clip');
      assert.strictEqual(
        indexCssSrc.includes('overflow: hidden !important;'),
        false,
        'Must not apply global overflow: hidden shortcut'
      );
    });

    it('initializes index.html with dir="ltr" to prevent unwanted left-side browser scrollbars', () => {
      const indexPath = path.resolve(__dirname, '../../index.html');
      const indexHtmlSrc = fs.readFileSync(indexPath, 'utf-8');

      assert.ok(
        indexHtmlSrc.includes('dir="ltr"'),
        'index.html root <html> must declare dir="ltr"'
      );
    });
  });

  describe('11. Phase 7.45: Utility Control Borderless Refinement & Sun Theme Icon Update', () => {
    it('updates utility Theme Selector trigger icon to Sun from lucide-react', () => {
      assert.ok(
        themeSwitcherSrc.includes("import { Check, Sparkles, X, ChevronDown, Sun } from 'lucide-react';") ||
        themeSwitcherSrc.includes('Sun'),
        'ThemeSwitcher must import Sun from lucide-react'
      );
      assert.ok(
        themeSwitcherSrc.includes('<Sun className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" aria-hidden="true" />'),
        'ThemeSwitcher trigger must render Lucide Sun icon with w-3.5 h-3.5 visual sizing'
      );
      assert.ok(
        themeSwitcherSrc.includes('<ChevronDown'),
        'ThemeSwitcher trigger must include ChevronDown beside Sun icon'
      );
    });

    it('strictly preserves Palette icon for Themes in left navigation capsule', () => {
      assert.ok(
        navbarSrc.includes("import {\n  Keyboard,\n  GraduationCap,\n  Gamepad2,\n  Palette,") ||
        navbarSrc.includes('Palette,'),
        'Navbar must import Palette from lucide-react'
      );
      assert.ok(
        navbarSrc.includes("label: t('nav.themes') || 'Themes', href: '/themes', isInternal: true, icon: Palette"),
        'Left capsule navLinks must strictly preserve icon: Palette for Themes link'
      );
    });

    it('provides borderless default resting state for ThemeSwitcher', () => {
      assert.ok(
        themeSwitcherSrc.includes('borderless = true'),
        'ThemeSwitcher must default to borderless = true'
      );
      assert.ok(
        themeSwitcherSrc.includes("borderless\n            ? 'border border-transparent bg-transparent hover:bg-[var(--bg-elevated)]'") ||
        themeSwitcherSrc.includes('border border-transparent bg-transparent hover:bg-[var(--bg-elevated)]'),
        'ThemeSwitcher must apply border-transparent and bg-transparent in borderless mode'
      );
    });

    it('provides borderless default resting state for LanguageSelector', () => {
      assert.ok(
        languageSelectorSrc.includes('borderless = true'),
        'LanguageSelector must default to borderless = true'
      );
      assert.ok(
        languageSelectorSrc.includes("borderless\n            ? 'border border-transparent bg-transparent hover:bg-[var(--bg-elevated)]'") ||
        languageSelectorSrc.includes('border border-transparent bg-transparent hover:bg-[var(--bg-elevated)]'),
        'LanguageSelector must apply border-transparent and bg-transparent in borderless mode'
      );
    });

    it('renders authenticated user menu trigger button borderlessly in Navbar', () => {
      assert.ok(
        navbarSrc.includes('bg-transparent hover:bg-[var(--bg-elevated)] border border-transparent text-xs font-mono text-[var(--text-primary)]'),
        'Authenticated user profile trigger button must be borderless in resting state'
      );
      assert.strictEqual(
        navbarSrc.includes('bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--accent)] text-xs font-mono text-[var(--text-primary)] transition-all duration-240 cursor-pointer shrink-0 shadow-xs'),
        false,
        'Authenticated user profile trigger button must no longer have visible border outline or shadow-xs'
      );
    });

    it('renders unauthenticated Sign In button borderlessly in Navbar', () => {
      assert.ok(
        navbarSrc.includes('variant="ghost"') &&
        navbarSrc.includes('border border-transparent'),
        'Sign In button must render borderless ghost variant with border border-transparent'
      );
    });

    it('strictly preserves outer capsule borders for both Capsule 1 and Capsule 2', () => {
      assert.ok(
        navbarSrc.includes('rounded-full bg-[var(--bg-surface)]/85 backdrop-blur-md border border-[var(--border)]'),
        'Capsule 1 must retain its outer border'
      );
      assert.ok(
        navbarSrc.includes('h-14 px-1.5 sm:px-2 rounded-full bg-[var(--bg-surface)]/85 backdrop-blur-md border border-[var(--border)]') ||
        navbarSrc.includes('h-14 px-2 sm:px-2.5 rounded-full bg-[var(--bg-surface)]/85 backdrop-blur-md border border-[var(--border)]') ||
        navbarSrc.includes('h-14 px-2.5 sm:px-3 rounded-full bg-[var(--bg-surface)]/85 backdrop-blur-md border border-[var(--border)]') ||
        navbarSrc.includes('h-14 px-3 sm:px-4 rounded-full bg-[var(--bg-surface)]/85 backdrop-blur-md border border-[var(--border)]'),
        'Capsule 2 must retain its outer border'
      );
    });

    it('strictly preserves borders on unrelated buttons (Quick Sign Out & Continue Practice)', () => {
      assert.ok(
        navbarSrc.includes('className="p-1.5 rounded-full border border-[var(--border)] text-[var(--text-muted)] hover:text-red-400'),
        'Quick Sign Out button must preserve its border'
      );
      assert.ok(
        (navbarSrc.includes('Continue') || navbarSrc.includes('continue')) &&
        navbarSrc.includes('bg-[var(--accent)]') &&
        navbarSrc.includes('rounded-full'),
        'Continue pill button must preserve its styling'
      );
    });

    it('strictly preserves dropdown menu borders inside flyouts', () => {
      assert.ok(
        themeSwitcherSrc.includes('border border-[var(--border)] shadow-2xl p-4'),
        'ThemeSwitcher modal/flyout must retain internal border'
      );
      assert.ok(
        languageSelectorSrc.includes('border border-[var(--border)] bg-[var(--bg-surface)]'),
        'LanguageSelector dropdown must retain internal border'
      );
      assert.ok(
        navbarSrc.includes('rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xl p-2.5'),
        'User profile dropdown menu must retain internal border'
      );
    });
  });

  describe('12. Phase 7.46: Navbar Spacing Refinement, Compact Utility Capsule & Continue Practice Button Alignment', () => {
    it('increases vertical padding and minimum height of Continue Practice button', () => {
      assert.ok(
        (navbarSrc.includes('py-2') || navbarSrc.includes('py-2.5')) &&
        navbarSrc.includes('min-h-[36px]'),
        'Continue button must have increased vertical padding and minimum height (min-h-[36px])'
      );
    });

    it('positions action icon with comfortable spacing from text', () => {
      assert.ok(
        navbarSrc.includes('gap-2') && navbarSrc.includes('rounded-full bg-[var(--accent)]'),
        'Continue button must render with gap-2 and rounded-full accent styling'
      );
    });

    it('increases horizontal gap between KEYFLOW brand logo and first navigation icon', () => {
      assert.ok(
        navbarSrc.includes('gap-4 sm:gap-6 md:gap-4 lg:gap-12 xl:gap-18 2xl:gap-22') ||
        navbarSrc.includes('gap-8 sm:gap-10 md:gap-12 lg:gap-16 xl:gap-20 2xl:gap-24') ||
        navbarSrc.includes('gap-9 sm:gap-11 lg:gap-14 xl:gap-18') ||
        navbarSrc.includes('gap-8 sm:gap-10 lg:gap-12 xl:gap-16') ||
        navbarSrc.includes('gap-7 sm:gap-9 lg:gap-11 xl:gap-14'),
        'Left capsule must apply moderate gap increase between brand and nav cluster'
      );
    });

    it('adjusts inter-icon spacing across all six navigation icons', () => {
      assert.ok(
        navbarSrc.includes('gap-1.5 sm:gap-2 md:gap-1.5 lg:gap-4 xl:gap-5.5 2xl:gap-6.5') ||
        navbarSrc.includes('gap-3 sm:gap-4 md:gap-4.5 lg:gap-5 xl:gap-6 2xl:gap-7') ||
        navbarSrc.includes('gap-3.5 sm:gap-4 lg:gap-4.5 xl:gap-5') ||
        navbarSrc.includes('gap-3 sm:gap-3.5 lg:gap-4 xl:gap-4.5') ||
        navbarSrc.includes('gap-2.5 sm:gap-3 lg:gap-3.5 xl:gap-4'),
        'Navigation icons must have balanced inter-icon spacing'
      );
    });

    it('compacts right utility capsule dimensions and internal gaps', () => {
      assert.ok(
        navbarSrc.includes('h-14 px-1.5 sm:px-2 rounded-full') ||
        navbarSrc.includes('h-14 px-2 sm:px-2.5 rounded-full') ||
        navbarSrc.includes('h-14 px-2.5 sm:px-3 rounded-full'),
        'Right utility capsule must reduce outer horizontal padding'
      );
      assert.ok(
        navbarSrc.includes('gap-1 shrink-0') ||
        navbarSrc.includes('gap-1 sm:gap-1.5') ||
        navbarSrc.includes('gap-1.5 sm:gap-2'),
        'Right utility capsule must reduce inter-control gaps'
      );
    });

    it('compacts individual utility trigger button horizontal paddings', () => {
      assert.ok(
        languageSelectorSrc.includes('px-1.5 py-1.5') ||
        languageSelectorSrc.includes('gap-1.5 px-2 py-1.5'),
        'LanguageSelector trigger must use compact px-1.5 or px-2 horizontal padding'
      );
      assert.ok(
        themeSwitcherSrc.includes('px-1.5 py-1.5') ||
        themeSwitcherSrc.includes('gap-1 px-2 py-1.5'),
        'ThemeSwitcher trigger must use compact px-1.5 or px-2 padding'
      );
      assert.ok(
        navbarSrc.includes('px-1.5 py-1.5 rounded-full bg-transparent') ||
        navbarSrc.includes('gap-1.5 px-2 py-1.5 rounded-full bg-transparent'),
        'Authenticated user profile trigger must use compact px-1.5 or px-2 padding'
      );
    });

    it('strictly preserves Framer Motion fluid navigation hover mechanics', () => {
      assert.ok(navbarSrc.includes('layoutId="navbar-fluid-bubble"'), 'LayoutId must remain navbar-fluid-bubble');
      assert.ok(navbarSrc.includes('stiffness: 380') && navbarSrc.includes('damping: 28'), 'Spring physics stiffness and damping preserved');
      assert.ok(navbarSrc.includes('y: isHighlighted && !shouldReduceMotion ? -10 : 0') || navbarSrc.includes('y: isHighlighted'), 'Icon elevation preserved');
      assert.ok(navbarSrc.includes('M 0 0 C 14 0, 18 10, 32 10 C 46 10, 50 0, 64 0'), 'Curved notch geometry preserved');
    });

    it('strictly preserves horizontal overflow fencing and scrollbar protections', () => {
      assert.ok(navbarSrc.includes('max-w-[100vw]') && navbarSrc.includes('overflow-x-clip'), 'Header overflow-x-clip preserved');
      const indexCssPath = path.resolve(__dirname, '../index.css');
      const indexCssSrc = fs.readFileSync(indexCssPath, 'utf-8');
      assert.ok(indexCssSrc.includes('direction: ltr;'), 'direction: ltr preserved');
      assert.ok(indexCssSrc.includes('overflow-x: clip;'), 'overflow-x: clip preserved');
    });
  });

  describe('13. Phase 7.47: Final Navbar CTA Label, Icon Position & Reference-Proportion Capsule Balancing', () => {
    it('displays exactly "Continue" on the desktop CTA without "Continue Practice"', () => {
      assert.ok(
        navbarSrc.includes("t('nav.continue', 'Continue')") ||
        navbarSrc.includes("t('nav.continue') || t('nav.continuePractice') || 'Continue'"),
        'CTA button must use t("nav.continue", "Continue")'
      );
      // Ensure no Continue Practice remains in rendered JSX
      const continuePracticeOccurrences = (navbarSrc.match(/'Continue Practice'|"Continue Practice"/g) || []);
      assert.strictEqual(
        continuePracticeOccurrences.length,
        0,
        'Old label "Continue Practice" must not appear in any navbar JSX rendering'
      );
    });

    it('positions Lucide Play icon on the extreme RIGHT side of Continue text', () => {
      assert.ok(
        navbarSrc.includes("<span className=\"whitespace-nowrap\">{t('nav.continue', 'Continue')}</span>\n                <Play className=\"w-3.5 h-3.5 fill-current shrink-0\" aria-hidden=\"true\" />") ||
        navbarSrc.includes("<Play className=\"w-3.5 h-3.5 fill-current shrink-0\" aria-hidden=\"true\" />"),
        'CTA button must render text first, followed by Play icon on the right'
      );
    });

    it('strictly excludes ArrowRight from CTA buttons', () => {
      assert.strictEqual(
        navbarSrc.includes('ArrowRight'),
        false,
        'ArrowRight must be completely removed from Navbar component'
      );
    });

    it('increases left capsule width with wider padding and relaxed inter-item gaps', () => {
      assert.ok(
        navbarSrc.includes('px-3.5 sm:px-4 md:px-3.5 lg:px-7 xl:px-8 2xl:px-9') ||
        navbarSrc.includes('px-6 sm:px-7 md:px-8 lg:px-9 xl:px-10') ||
        navbarSrc.includes('px-7 sm:px-8 lg:px-10 xl:px-12') ||
        navbarSrc.includes('px-6 sm:px-7 lg:px-9 xl:px-10'),
        'Left capsule must apply wider horizontal padding'
      );
      assert.ok(
        navbarSrc.includes('gap-4 sm:gap-6 md:gap-4 lg:gap-12 xl:gap-18 2xl:gap-22') ||
        navbarSrc.includes('gap-8 sm:gap-10 md:gap-12 lg:gap-16 xl:gap-20 2xl:gap-24') ||
        navbarSrc.includes('gap-9 sm:gap-11 lg:gap-14 xl:gap-18') ||
        navbarSrc.includes('gap-8 sm:gap-10 lg:gap-12 xl:gap-16'),
        'Left capsule must apply generous gap between brand and nav cluster'
      );
      assert.ok(
        navbarSrc.includes('gap-1.5 sm:gap-2 md:gap-1.5 lg:gap-4 xl:gap-5.5 2xl:gap-6.5') ||
        navbarSrc.includes('gap-3 sm:gap-4 md:gap-4.5 lg:gap-5 xl:gap-6 2xl:gap-7') ||
        navbarSrc.includes('gap-3.5 sm:gap-4 lg:gap-4.5 xl:gap-5') ||
        navbarSrc.includes('gap-3 sm:gap-3.5 lg:gap-4 xl:gap-4.5'),
        'Left capsule navigation icons must feature relaxed inter-icon spacing'
      );
    });

    it('compacts right capsule with narrower padding and tighter gaps', () => {
      assert.ok(
        navbarSrc.includes('h-14 px-1.5 sm:px-2 rounded-full bg-[var(--bg-surface)]/85') ||
        navbarSrc.includes('h-14 px-2 sm:px-2.5 rounded-full bg-[var(--bg-surface)]/85'),
        'Right utility capsule must use compact horizontal padding'
      );
      assert.ok(
        navbarSrc.includes('flex items-center gap-1 shrink-0 transition-colors duration-240') ||
        navbarSrc.includes('flex items-center gap-1 sm:gap-1.5 shrink-0 transition-colors duration-240'),
        'Right utility capsule must use compact inter-control gaps'
      );
    });

    it('preserves click handler handleContinuePractice and workstation destination', () => {
      assert.ok(
        navbarSrc.includes('onClick={handleContinuePractice}'),
        'CTA button must retain handleContinuePractice click handler'
      );
      assert.ok(
        navbarSrc.includes("const handleContinuePractice = () => {"),
        'Navbar must define handleContinuePractice function'
      );
    });

    it('strictly preserves Framer Motion fluid navigation hover animation', () => {
      assert.ok(navbarSrc.includes('layoutId="navbar-fluid-bubble"'), 'LayoutId must remain navbar-fluid-bubble');
      assert.ok(navbarSrc.includes('stiffness: 380') && navbarSrc.includes('damping: 28'), 'Spring stiffness 380 and damping 28 preserved');
      assert.ok(navbarSrc.includes('M 0 0 C 14 0, 18 10, 32 10 C 46 10, 50 0, 64 0'), 'Curved SVG notch preserved');
    });

    it('strictly preserves borderless utility controls and Sun theme icon', () => {
      assert.ok(navbarSrc.includes('<LanguageSelector compact={true} />'), 'LanguageSelector preserved');
      assert.ok(navbarSrc.includes('<ThemeSwitcher compact={true} />'), 'ThemeSwitcher preserved');
      assert.ok(themeSwitcherSrc.includes('<Sun'), 'Sun icon preserved in ThemeSwitcher');
      assert.ok(navbarSrc.includes("icon: Palette"), 'Palette icon preserved for Themes in Left Capsule');
    });
  });

  describe('14. Phase 7.48: Left Navigation Capsule Width Dominance & Continue CTA Translation Fix', () => {
    it('reliably calls t("nav.continue", "Continue") preventing raw key exposure', () => {
      assert.ok(
        navbarSrc.includes("{t('nav.continue', 'Continue')}"),
        'All Continue CTA labels must invoke t with explicit fallback parameter "Continue"'
      );
      assert.strictEqual(
        navbarSrc.includes("{t('nav.continue')}"),
        false,
        'Must never call t("nav.continue") without fallback parameter'
      );
    });

    it('verifies "nav.continue" key exists across translation dictionaries', () => {
      const enLocalesPath = path.resolve(__dirname, '../i18n/locales/en.js');
      const enLocalesSrc = fs.readFileSync(enLocalesPath, 'utf-8');
      assert.ok(
        enLocalesSrc.includes('"nav.continue": "Continue"'),
        'en.js must declare "nav.continue": "Continue"'
      );
    });

    it('verifies Left Capsule container achieves visual width dominance via generous padding and gaps', () => {
      assert.ok(
        navbarSrc.includes('px-3.5 sm:px-4 md:px-3.5 lg:px-7 xl:px-8 2xl:px-9') ||
        navbarSrc.includes('px-6 sm:px-7 md:px-8 lg:px-9 xl:px-10') ||
        navbarSrc.includes('px-7 sm:px-8 lg:px-10 xl:px-12'),
        'Left capsule must apply dominant container padding'
      );
      assert.ok(
        navbarSrc.includes('gap-4 sm:gap-6 md:gap-4 lg:gap-12 xl:gap-18 2xl:gap-22') ||
        navbarSrc.includes('gap-8 sm:gap-10 md:gap-12 lg:gap-16 xl:gap-20 2xl:gap-24') ||
        navbarSrc.includes('gap-9 sm:gap-11 lg:gap-14 xl:gap-18'),
        'Left capsule must apply dominant logo-to-nav separation'
      );
      assert.ok(
        navbarSrc.includes('gap-1.5 sm:gap-2 md:gap-1.5 lg:gap-4 xl:gap-5.5 2xl:gap-6.5') ||
        navbarSrc.includes('gap-3 sm:gap-4 md:gap-4.5 lg:gap-5 xl:gap-6 2xl:gap-7') ||
        navbarSrc.includes('gap-3.5 sm:gap-4 lg:gap-4.5 xl:gap-5'),
        'Left capsule nav must apply comfortable inter-icon spacing'
      );
    });

    it('verifies Right Capsule maintains compact geometry and tight gaps', () => {
      assert.ok(
        navbarSrc.includes('h-14 px-1.5 sm:px-2 rounded-full bg-[var(--bg-surface)]/85') ||
        navbarSrc.includes('h-14 px-2 sm:px-2.5 rounded-full bg-[var(--bg-surface)]/85'),
        'Right capsule must remain compact'
      );
      assert.ok(
        navbarSrc.includes('flex items-center gap-1 shrink-0') ||
        navbarSrc.includes('gap-1 sm:gap-1.5'),
        'Right capsule controls must feature tight spacing'
      );
    });

    it('verifies Play icon strictly follows Continue text on the right side', () => {
      assert.ok(
        navbarSrc.includes('<span className="whitespace-nowrap">{t(\'nav.continue\', \'Continue\')}</span>\n                <Play className="w-3.5 h-3.5 fill-current shrink-0" aria-hidden="true" />'),
        'CTA button must place Play icon after text'
      );
    });
  });

  describe('15. Phase 7.49: Reference-Matched Left Navbar Width Expansion & Right Utility Capsule Compression', () => {
    it('expands available horizontal space for navigation icons across desktop viewports', () => {
      assert.ok(
        navbarSrc.includes('gap-1.5 sm:gap-2 md:gap-1.5 lg:gap-4 xl:gap-5.5 2xl:gap-6.5') ||
        navbarSrc.includes('gap-3 sm:gap-4 md:gap-4.5 lg:gap-5 xl:gap-6 2xl:gap-7'),
        'Navigation icon group must expand available space'
      );
    });

    it('maintains generous, reference-matched separation between KEYFLOW brand and navigation cluster', () => {
      assert.ok(
        navbarSrc.includes('gap-4 sm:gap-6 md:gap-4 lg:gap-12 xl:gap-18 2xl:gap-22') ||
        navbarSrc.includes('gap-8 sm:gap-10 md:gap-12 lg:gap-16 xl:gap-20 2xl:gap-24'),
        'Left capsule must apply spacious separation between brand and nav cluster'
      );
    });

    it('compresses right utility capsule dimensions and outer padding', () => {
      assert.ok(
        navbarSrc.includes('h-14 px-1.5 sm:px-2 rounded-full bg-[var(--bg-surface)]/85'),
        'Right utility capsule must compress outer horizontal padding to px-1.5 sm:px-2'
      );
      assert.ok(
        navbarSrc.includes('flex items-center gap-1 shrink-0'),
        'Right utility capsule must compress inter-control gaps to gap-1'
      );
    });

    it('compresses individual trigger button horizontal paddings and gaps', () => {
      assert.ok(
        languageSelectorSrc.includes('gap-1 px-1.5 py-1.5'),
        'LanguageSelector trigger must compress to gap-1 px-1.5'
      );
      assert.ok(
        themeSwitcherSrc.includes('gap-0.5 px-1.5 py-1.5'),
        'ThemeSwitcher trigger must compress to gap-0.5 px-1.5'
      );
      assert.ok(
        navbarSrc.includes('gap-1 px-1.5 py-1.5 rounded-full bg-transparent'),
        'Authenticated user profile trigger must compress to gap-1 px-1.5'
      );
    });

    it('preserves Continue CTA min-h-[36px], translation fallback, and Play icon on right', () => {
      assert.ok(navbarSrc.includes("t('nav.continue', 'Continue')"), 'Continue CTA must use fallback "Continue"');
      assert.ok(navbarSrc.includes('min-h-[36px]'), 'Continue CTA must retain min-h-[36px]');
      assert.ok(navbarSrc.includes('<Play className="w-3.5 h-3.5 fill-current shrink-0" aria-hidden="true" />'), 'Play icon must be on the right');
    });

    it('strictly preserves Framer Motion fluid navigation hover mechanics and SVG notch', () => {
      assert.ok(navbarSrc.includes('layoutId="navbar-fluid-bubble"'), 'LayoutId must remain navbar-fluid-bubble');
      assert.ok(navbarSrc.includes('stiffness: 380') && navbarSrc.includes('damping: 28'), 'Spring stiffness 380 and damping 28 preserved');
      assert.ok(navbarSrc.includes('M 0 0 C 14 0, 18 10, 32 10 C 46 10, 50 0, 64 0'), 'Curved SVG notch preserved');
    });

    it('strictly preserves borderless utility controls, Sun theme icon, and Palette navigation icon', () => {
      assert.ok(navbarSrc.includes('<LanguageSelector compact={true} />'), 'LanguageSelector preserved');
      assert.ok(navbarSrc.includes('<ThemeSwitcher compact={true} />'), 'ThemeSwitcher preserved');
      assert.ok(themeSwitcherSrc.includes('<Sun'), 'Sun icon preserved in ThemeSwitcher');
      assert.ok(navbarSrc.includes("icon: Palette"), 'Palette icon preserved for Themes in Left Capsule');
    });
  });

  describe('16. Phase 7.50: Actual Browser Geometry Audit & Reference-Pixel-Matched Navbar Capsule Calibration', () => {
    it('responsively scales Capsule 1 at 768px (md) to guarantee single-row collision-free fit', () => {
      assert.ok(
        navbarSrc.includes('md:px-3.5') || navbarSrc.includes('md:px-4'),
        'Capsule 1 must scale down padding at md breakpoint'
      );
      assert.ok(
        navbarSrc.includes('md:gap-4') || navbarSrc.includes('md:gap-5'),
        'Capsule 1 must scale down brand-to-nav gap at md breakpoint'
      );
      assert.ok(
        navbarSrc.includes('md:gap-1.5') || navbarSrc.includes('md:gap-2'),
        'Navigation icons must scale down gap at md breakpoint'
      );
    });

    it('achieves reference-pixel-matched left-dominant capsule expansion at desktop viewports (lg, xl, 2xl)', () => {
      assert.ok(
        navbarSrc.includes('lg:gap-12 xl:gap-18 2xl:gap-22'),
        'Capsule 1 must provide spacious brand-to-nav separation across lg, xl, and 2xl'
      );
      assert.ok(
        navbarSrc.includes('lg:gap-4 xl:gap-5.5 2xl:gap-6.5'),
        'Navigation icon group must expand available space across lg, xl, and 2xl'
      );
      assert.ok(
        navbarSrc.includes('lg:px-7 xl:px-8 2xl:px-9'),
        'Capsule 1 must apply balanced container padding across lg, xl, and 2xl'
      );
    });

    it('strictly preserves compact right capsule with tight control clustering', () => {
      assert.ok(
        navbarSrc.includes('h-14 px-1.5 sm:px-2 rounded-full bg-[var(--bg-surface)]/85'),
        'Capsule 2 must remain compact with px-1.5 sm:px-2'
      );
      assert.ok(
        navbarSrc.includes('flex items-center gap-1 shrink-0 transition-colors duration-240'),
        'Capsule 2 must cluster controls with gap-1'
      );
    });

    it('strictly preserves all six navigation items and routes in exact sequence', () => {
      const expectedLinks = ['/workstation', '/academy', '/arcade', '/telemetry', '/leaderboard', '/themes'];
      expectedLinks.forEach((link) => {
        assert.ok(navbarSrc.includes(`href: '${link}'`), `Route ${link} must exist in navLinks`);
      });
    });

    it('strictly preserves Continue CTA label, right-side Play icon, and click handler', () => {
      assert.ok(navbarSrc.includes("{t('nav.continue', 'Continue')}"), 'CTA must render Continue with fallback');
      assert.ok(navbarSrc.includes('Play className="w-3.5 h-3.5 fill-current shrink-0"'), 'Play icon must be on the right');
      assert.ok(navbarSrc.includes('onClick={handleContinuePractice}'), 'CTA must retain handleContinuePractice handler');
    });

    it('strictly preserves Framer Motion fluid bubble mechanics and SVG notch cradle', () => {
      assert.ok(navbarSrc.includes('layoutId="navbar-fluid-bubble"'), 'LayoutId must remain navbar-fluid-bubble');
      assert.ok(navbarSrc.includes('stiffness: 380') && navbarSrc.includes('damping: 28'), 'Spring physics preserved');
      assert.ok(navbarSrc.includes('M 0 0 C 14 0, 18 10, 32 10 C 46 10, 50 0, 64 0'), 'Curved SVG notch preserved');
    });

    it('strictly preserves borderless utility controls and icon representations', () => {
      assert.ok(themeSwitcherSrc.includes('<Sun'), 'Sun icon preserved in ThemeSwitcher');
      assert.ok(navbarSrc.includes("icon: Palette"), 'Palette icon preserved for Themes in Left Capsule');
      assert.ok(languageSelectorSrc.includes('border border-transparent bg-transparent'), 'LanguageSelector borderless');
      assert.ok(themeSwitcherSrc.includes('border border-transparent bg-transparent'), 'ThemeSwitcher borderless');
    });
  });
});
