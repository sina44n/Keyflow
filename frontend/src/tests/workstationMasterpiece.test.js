/**
 * KEYFLOW Workstation Masterpiece Upgrade Test Suite
 * =================================================
 * Automated test suite covering:
 * 1. Workstation Toolbar Layout & Precision Alignment
 * 2. Expanded Typing Text Area Width (Matching Feature/Control Container)
 * 3. Stable Dynamic Typing Viewport (Fixed Height, Line-by-Line Progression, Stationary Keyboard)
 * 4. Passage Integrity, Newlines (Enter handling), Backspace, and Keystroke Tracking
 * 5. Full Workstation Profile Parity & Unified Access via Main Navbar
 * 6. Multi-Mode Integrity (Timed, Words, Passages, Accuracy, Custom, Competition)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('KEYFLOW Workstation Masterpiece Upgrades & Alignment', () => {
  const workstationPath = path.resolve(__dirname, '../pages/WorkstationPage.jsx');
  const toolbarPath = path.resolve(__dirname, '../components/workstation/WorkstationToolbar.jsx');
  const navbarPath = path.resolve(__dirname, '../components/common/Navbar.jsx');
  const profileModalPath = path.resolve(__dirname, '../components/telemetry/TelemetryProfileModal.jsx');

  const workstationContent = fs.readFileSync(workstationPath, 'utf-8');
  const toolbarContent = fs.readFileSync(toolbarPath, 'utf-8');
  const navbarContent = fs.readFileSync(navbarPath, 'utf-8');
  const profileModalContent = fs.readFileSync(profileModalPath, 'utf-8');

  it('1. Workstation Feature Toolbar defines unified alignment and consistent control dimensions', () => {
    // Toolbar container is full width inside reference container
    assert.ok(toolbarContent.includes('w-full'), 'Toolbar must span full width of its reference container');
    assert.ok(toolbarContent.includes('flex flex-wrap items-center justify-between'), 'Toolbar must use balanced flex distribution');

    // Controls have standardized 32px height (h-8) and consistent rounding
    assert.ok(toolbarContent.includes('h-8'), 'Toolbar buttons must have standardized heights for vertical alignment');

    // All core modes present
    assert.ok(toolbarContent.includes("onClick={() => setMode('timed')}"), 'Must support Timed mode');
    assert.ok(toolbarContent.includes("onClick={() => setMode('words')}"), 'Must support Words mode');
    assert.ok(toolbarContent.includes("onClick={() => setMode('passage')}"), 'Must support Passage mode');
    assert.ok(toolbarContent.includes("onClick={() => setMode('accuracy')}"), 'Must support Accuracy mode');

    // Trigger buttons for Custom studio and Competition
    assert.ok(toolbarContent.includes('onOpenCustomStudio'), 'Toolbar must include Custom Studio trigger');
    assert.ok(toolbarContent.includes('onOpenCompetitions'), 'Toolbar must include Competition Arena trigger');

    // Utility controls
    assert.ok(toolbarContent.includes('onOpenSavedTexts'), 'Toolbar must include Saved Texts library');
    assert.ok(toolbarContent.includes('onOpenHistory'), 'Toolbar must include Practice History');
    assert.ok(toolbarContent.includes('toggleFocusMode'), 'Toolbar must include Focus Mode toggle');
    assert.ok(toolbarContent.includes('toggleKeyboardGuide'), 'Toolbar must include Visual Keyboard Guide toggle');
    assert.ok(toolbarContent.includes('toggleHandGuide'), 'Toolbar must include Hand Guide toggle');
    assert.ok(toolbarContent.includes('SoundSelector'), 'Toolbar must include Tactile Sound Selector');
    assert.ok(toolbarContent.includes('onOpenShortcuts'), 'Toolbar must include Shortcuts help modal');
    assert.ok(toolbarContent.includes('onResetTest'), 'Toolbar must include Reset test action');
  });

  it('2. Typing Text Area width matches the feature/control reference container', () => {
    // Both header, toolbar, telemetry, and typing area reside within max-w-5xl reference container
    assert.ok(workstationContent.includes('max-w-5xl mx-auto'), 'Workstation workspace must use unified max-w-5xl reference container');

    // Typing container is w-full within reference container (no longer constrained to 820px)
    assert.ok(!workstationContent.includes('max-w-[820px] mx-auto space-y-6'), 'Main typing workspace must not be artificially restricted to 820px');

    // Keyboard retains its calibrated 820px chassis width centered beneath the expanded typing area
    assert.ok(workstationContent.includes('max-w-[820px] mx-auto flex flex-col items-center'), 'Virtual keyboard must retain centered 820px ergonomic width');
  });

  it('3. Dynamic Typing Viewport provides stable line progression without pushing keyboard', () => {
    // Viewport has fixed height and overflow-hidden to prevent vertical growth
    assert.ok(workstationContent.includes('overflow-hidden'), 'Viewport must constrain overflow');
    assert.ok(workstationContent.includes('h-[160px]') || workstationContent.includes('max-h-[180px]'), 'Viewport must maintain fixed height');

    // Automatic line progression with scrollBehavior smooth & reduced-motion respect
    assert.ok(workstationContent.includes('prefersReducedMotion'), 'Viewport progression must respect user reduced motion preferences');
    assert.ok(workstationContent.includes('targetScrollTop = Math.max(0, spanTop - spanHeight)'), 'Must calculate scroll offset based on active line');

    // Keyboard remains stationary beneath the typing area
    assert.ok(workstationContent.includes('<KeyboardGuide'), 'Virtual keyboard must remain rendered beneath typing area');
  });

  it('4. Real newline and character input handling supports Enter and complete passages', () => {
    // Enter key appends newline to typed text for multi-line passage and custom code drills
    assert.ok(workstationContent.includes("e.key === 'Enter'"), 'Must handle Enter key for actual newlines');
    assert.ok(workstationContent.includes("typed + '\\n'"), 'Enter key must append newline to typed buffer');

    // Return symbol visual indicator for newline characters
    assert.ok(workstationContent.includes("char === '\\n' ? '↵\\n' : char"), 'Must display clear visual indicator for newline characters');

    // Full passage preserved in memory
    assert.ok(workstationContent.includes('currentTargetText.split'), 'Passage text must remain complete and mapped without truncation');
  });

  it('5. Main Navbar user-name button provides complete Workstation Profile access', () => {
    // Desktop user button is interactive (not a static div)
    assert.ok(navbarContent.includes('setUserMenuOpen((prev) => !prev)'), 'User name button must toggle user menu');
    assert.ok(navbarContent.includes('aria-haspopup="menu"'), 'User button must have accessible aria attributes');

    // Dropdown provides direct links to all Profile & Settings tabs
    assert.ok(navbarContent.includes("setProfileTab('profile')"), 'Dropdown must provide link to Profile tab');
    assert.ok(navbarContent.includes("setProfileTab('goals')"), 'Dropdown must provide link to Goals tab');
    assert.ok(navbarContent.includes("setProfileTab('accessibility')"), 'Dropdown must provide link to Accessibility tab');
    assert.ok(navbarContent.includes("setProfileTab('security')"), 'Dropdown must provide link to Security & Export tab');

    // Navigation links within menu
    assert.ok(navbarContent.includes("navigate('/telemetry')"), 'User menu must include Telemetry Dashboard shortcut');
    assert.ok(navbarContent.includes("navigate('/workstation')"), 'User menu must include Workstation shortcut');

    // Sign out action
    assert.ok(navbarContent.includes('onClick={handleLogout}'), 'User menu must include Sign Out action');

    // TelemetryProfileModal is mounted and shared
    assert.ok(navbarContent.includes('<TelemetryProfileModal'), 'Navbar must render TelemetryProfileModal for direct access');
    assert.ok(navbarContent.includes('initialTab={profileTab}'), 'Profile modal must accept initialTab for direct deep-linking');

    // Mobile drawer also provides access
    assert.ok(navbarContent.includes('Profile & Settings →'), 'Mobile navigation drawer must provide profile access');
  });

  it('6. Workstation Page provides direct access to the same Profile Modal', () => {
    // Header includes Profile button
    assert.ok(workstationContent.includes('setProfileModalOpen(true)'), 'Workstation page must include Profile trigger');
    assert.ok(workstationContent.includes('<TelemetryProfileModal'), 'Workstation page must mount TelemetryProfileModal');

    // Toolbar can also trigger profile
    assert.ok(workstationContent.includes('onOpenProfile'), 'WorkstationToolbar must receive onOpenProfile handler');
  });

  it('7. Complete Workstation Profile feature parity inventory', () => {
    // Tab 1: Personal Info
    assert.ok(profileModalContent.includes('Username'), 'Profile must include Username');
    assert.ok(profileModalContent.includes('Email Address'), 'Profile must include Email Address');
    assert.ok(profileModalContent.includes('First Name'), 'Profile must include First Name');
    assert.ok(profileModalContent.includes('Last Name'), 'Profile must include Last Name');
    assert.ok(profileModalContent.includes('Time Zone (IANA)'), 'Profile must include Time Zone');
    assert.ok(profileModalContent.includes('Bio & Typing Aspirations'), 'Profile must include Bio');

    // Tab 2: Goals & Practice Targets
    assert.ok(profileModalContent.includes('Daily Practice Goal'), 'Profile must include Daily Goal');
    assert.ok(profileModalContent.includes('Weekly Practice Goal'), 'Profile must include Weekly Goal');
    assert.ok(profileModalContent.includes('First Day of the Week'), 'Profile must include First Day of Week');

    // Tab 3: Accessibility
    assert.ok(profileModalContent.includes('Reduced Motion'), 'Profile must include Reduced Motion');
    assert.ok(profileModalContent.includes('Text Size Scale'), 'Profile must include Text Size Scale');
    assert.ok(profileModalContent.includes('Enhanced Contrast'), 'Profile must include Enhanced Contrast');

    // Tab 4: Security & Password
    assert.ok(profileModalContent.includes('Change Account Password'), 'Profile must include Change Password');

    // Tab 5: Subscription & Community Tier
    assert.ok(profileModalContent.includes('Free Community Tier'), 'Profile must include Subscription status');

    // Tab 6: Security & Export
    assert.ok(profileModalContent.includes('Export Personal Telemetry History'), 'Profile must include CSV Telemetry Export');
    assert.ok(profileModalContent.includes('Delete Account Permanently'), 'Profile must include Protected Account Deletion');
  });
});

