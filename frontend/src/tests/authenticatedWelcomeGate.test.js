import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('KEYFLOW — Direct Authentication Flow & Discontinuation of Welcome Gate', () => {
  const appPath = path.resolve(__dirname, '../App.jsx');
  const appContent = fs.readFileSync(appPath, 'utf-8');

  const authPagePath = path.resolve(__dirname, '../pages/AuthPage.jsx');
  const authPageContent = fs.readFileSync(authPagePath, 'utf-8');

  const authContextPath = path.resolve(__dirname, '../context/AuthContext.jsx');
  const authContextContent = fs.readFileSync(authContextPath, 'utf-8');

  it('1. Verifies AppShell directly renders application layout without welcome gates', () => {
    assert.ok(!appContent.includes('isWelcomeActive'), 'AppShell must not have isWelcomeActive');
    assert.ok(!appContent.includes('isWelcomePendingResolution'), 'AppShell must not have isWelcomePendingResolution');
    assert.ok(appContent.includes('<Navbar />'), 'AppShell must directly render Navbar');
    assert.ok(appContent.includes('<Footer />'), 'AppShell must directly render Footer');
  });

  it('2. Verifies NO dark overlay or welcome resolution screen exists in AppShell', () => {
    assert.ok(!appContent.includes('aria-label="Preparing welcome experience"'), 'Must NOT have preparing welcome experience gate');
    assert.ok(!appContent.includes('CinematicWelcomeOverlay'), 'Must NOT render CinematicWelcomeOverlay');
  });

  it('3. Verifies AuthPage navigates directly to destination or / upon authentication', () => {
    assert.ok(
      authPageContent.includes("navigate(destination || '/', { replace: true })"),
      'AuthPage must immediately navigate to destination or / upon authentication'
    );
  });

  it('4. Verifies Workstation chunk is NOT preloaded specifically for welcome video', () => {
    assert.ok(
      !appContent.includes("import('./pages/WorkstationPage').catch"),
      'AppShell must not preload WorkstationPage for welcome video'
    );
  });

  it('5. Verifies Workstation remains accessible as a protected route', () => {
    assert.ok(
      appContent.includes('path="/workstation"'),
      'App.jsx must retain protected /workstation route definition'
    );
  });

  it('6. Verifies AuthContext maintains clean authentication lifecycle', () => {
    assert.ok(authContextContent.includes('isAuthenticated: Boolean(isSignedIn && djangoUser)'), 'Clerk auth bridge computes isAuthenticated correctly');
    assert.ok(authContextContent.includes('isSigningOut'), 'AuthContext exposes isSigningOut state');
  });
});
