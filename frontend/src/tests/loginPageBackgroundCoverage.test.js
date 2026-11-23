import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('KEYFLOW — Full-Viewport Login Page Background Coverage & Navbar Transparency', () => {
  const appPath = path.resolve(__dirname, '../App.jsx');
  const appContent = fs.readFileSync(appPath, 'utf-8');

  const authPagePath = path.resolve(__dirname, '../pages/AuthPage.jsx');
  const authPageContent = fs.readFileSync(authPagePath, 'utf-8');

  const navbarPath = path.resolve(__dirname, '../components/common/Navbar.jsx');
  const navbarContent = fs.readFileSync(navbarPath, 'utf-8');

  it('1. Verifies AppShell provides continuous full-viewport sky background on auth routes', () => {
    assert.ok(
      appContent.includes("isAuthRoute"),
      'AppShell must compute isAuthRoute'
    );
    assert.ok(
      appContent.includes("bg-gradient-to-b from-[#96cdf2] via-[#bde1f8] to-[#edf7fd]"),
      'AppShell must attach sky gradient to outermost wrapper on auth routes'
    );
    assert.ok(
      appContent.includes("min-h-[100svh]"),
      'AppShell must enforce reliable modern full-viewport min-height (100svh)'
    );
  });

  it('2. Verifies atmospheric cloud overlays span the full viewport behind navbar and content', () => {
    assert.ok(
      appContent.includes('fixed inset-0 pointer-events-none overflow-hidden z-0'),
      'Must mount fixed background layer spanning full viewport at z-0'
    );
    assert.ok(
      appContent.includes('radial-gradient(ellipse_at_top'),
      'Must retain radial sunlight highlight layer'
    );
    assert.ok(
      appContent.includes('w-96 h-48 bg-white/60 rounded-full blur-3xl'),
      'Must retain cumulus cloud layer'
    );
  });

  it('3. Verifies Navbar is mounted above the background with transparent container and gap', () => {
    assert.ok(
      navbarContent.includes('<header className="sticky top-0 z-50 w-full max-w-[100vw] overflow-x-clip px-3 sm:px-6 pt-3 sm:pt-4 pointer-events-none select-none transition-all duration-200">'),
      'Navbar header must maintain transparent container with pointer-events-none'
    );
    assert.ok(
      navbarContent.includes('pointer-events-auto h-14'),
      'Navbar capsules must maintain independent pointer-events-auto and styling'
    );
    assert.ok(
      !navbarContent.includes('bg-white w-full'),
      'Navbar must not have full-width white background blocking sky'
    );
  });

  it('4. Verifies Footer and AnnouncementBanner are omitted on auth routes to prevent white strip gaps', () => {
    assert.ok(
      appContent.includes('!isAuthRoute && <Footer />'),
      'AppShell must hide Footer on auth routes to ensure continuous background below card'
    );
    assert.ok(
      appContent.includes('!isAuthRoute && <AnnouncementBanner />'),
      'AppShell must hide AnnouncementBanner on auth routes'
    );
  });

  it('5. Verifies AuthPage integrates cleanly with full-viewport wrapper without duplicate seams', () => {
    assert.ok(
      authPageContent.includes('relative w-full flex-1 flex items-center justify-center p-3 sm:p-6 md:p-8 my-auto z-10'),
      'AuthPage must be transparent flex container centered vertically in full viewport'
    );
    assert.ok(
      authPageContent.includes('from-[#96cdf2] via-[#bde1f8] to-[#edf7fd]'),
      'AuthPage must preserve atmospheric color tokens contract'
    );
  });
});
