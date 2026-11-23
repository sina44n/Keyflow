import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('KEYFLOW — Critical Fix: Clean Authentication Lifecycle, Direct Navigation & Sign-Out Reliability', () => {
  const appPath = path.resolve(__dirname, '../App.jsx');
  const appContent = fs.readFileSync(appPath, 'utf-8');

  const authPagePath = path.resolve(__dirname, '../pages/AuthPage.jsx');
  const authPageContent = fs.readFileSync(authPagePath, 'utf-8');

  const authContextPath = path.resolve(__dirname, '../context/AuthContext.jsx');
  const authContextContent = fs.readFileSync(authContextPath, 'utf-8');

  const navbarPath = path.resolve(__dirname, '../components/common/Navbar.jsx');
  const navbarContent = fs.readFileSync(navbarPath, 'utf-8');

  const protectedRoutePath = path.resolve(__dirname, '../components/auth/ProtectedRoute.jsx');
  const protectedRouteContent = fs.readFileSync(protectedRoutePath, 'utf-8');

  it('1. Verifies AuthPage navigates directly to home (/) without welcome gates or pending intent', () => {
    // Ensuring no pending_intent or welcome_seen holds
    assert.ok(
      !authPageContent.includes("keyflow_auth_pending_intent"),
      'AuthPage must not write keyflow_auth_pending_intent'
    );
    assert.ok(
      !authPageContent.includes("keyflow_welcome_seen"),
      'AuthPage must not check or set keyflow_welcome_seen'
    );
    // On auth success, navigates directly to destination (default '/')
    assert.ok(
      authPageContent.includes("const destination = location.state?.from && location.state.from !== '/' ? location.state.from : '/';"),
      'AuthPage must default destination to /'
    );
    assert.ok(
      authPageContent.includes("navigate(destination || '/', { replace: true })"),
      'AuthPage must navigate directly to destination or / upon successful auth'
    );
  });

  it('2. Verifies AppShell has zero welcome gating, resolution holds, or dark void overlays', () => {
    assert.ok(
      !appContent.includes('isWelcomePendingResolution'),
      'AppShell must not contain isWelcomePendingResolution'
    );
    assert.ok(
      !appContent.includes('isWelcomeActive'),
      'AppShell must not contain isWelcomeActive'
    );
    assert.ok(
      !appContent.includes('CinematicWelcomeOverlay'),
      'AppShell must not import or render CinematicWelcomeOverlay'
    );
  });

  it('3. Verifies AuthContext exposes isSigningOut and manages clean session lifecycle', () => {
    assert.ok(
      authContextContent.includes('isSigningOut'),
      'AuthContext must track and expose isSigningOut state'
    );
    assert.ok(
      !authContextContent.includes('keyflow-auth-login'),
      'AuthContext must not emit dead keyflow-auth-login events'
    );
    assert.ok(
      !authContextContent.includes('triggerWelcomeIfNeeded'),
      'AuthContext must not contain triggerWelcomeIfNeeded'
    );
  });

  it('4. Verifies AppShell directly renders application layout without welcome event listeners', () => {
    assert.ok(
      !appContent.includes("window.addEventListener('keyflow-auth-logout'"),
      'AppShell must not maintain dead keyflow-auth-logout event listener'
    );
    assert.ok(
      !appContent.includes("window.addEventListener('keyflow-auth-login'"),
      'AppShell must not maintain dead keyflow-auth-login event listener'
    );
    assert.ok(
      appContent.includes('<Navbar />'),
      'AppShell must directly render Navbar'
    );
    assert.ok(
      appContent.includes('<Footer />'),
      'AppShell must directly render Footer'
    );
  });

  it('5. Verifies ProtectedRoute respects isSigningOut to prevent redirect races', () => {
    assert.ok(
      protectedRouteContent.includes('isSigningOut'),
      'ProtectedRoute must receive isSigningOut from useAuth'
    );
    assert.ok(
      protectedRouteContent.includes('isLoading || isSigningOut'),
      'ProtectedRoute must show controlled loading and prevent early redirect during sign-out'
    );
  });

  it('6. Verifies Navbar provides isLoggingOut state and targets /login after sign-out', () => {
    assert.ok(
      navbarContent.includes('isLoggingOut'),
      'Navbar must manage isLoggingOut state'
    );
    assert.ok(
      navbarContent.includes("navigate('/login', { replace: true })"),
      'Navbar must navigate cleanly to /login upon sign-out completion'
    );
  });

  it('7. Verifies ClerkAuthBridge directs users directly to home page without intermediate welcome gates', () => {
    assert.ok(
      !authContextContent.includes("sessionStorage.setItem('keyflow_auth_pending_intent'"),
      'AuthContext must not set keyflow_auth_pending_intent'
    );
    assert.ok(
      authContextContent.includes("redirectUrlComplete: options?.destination || '/'"),
      'Google OAuth in AuthContext must direct to destination or /'
    );
  });
});
