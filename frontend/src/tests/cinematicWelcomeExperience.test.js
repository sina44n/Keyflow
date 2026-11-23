import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('KEYFLOW — Permanent Removal of Authentication Welcome Video Suite', () => {
  const publicVideosDir = path.resolve(__dirname, '../../public/videos');
  const mp4Path = path.resolve(publicVideosDir, 'keyflow_welcome.mp4');
  const webmPath = path.resolve(publicVideosDir, 'keyflow_welcome.webm');

  const componentPath = path.resolve(__dirname, '../components/common/CinematicWelcomeOverlay.jsx');

  const appPath = path.resolve(__dirname, '../App.jsx');
  const appContent = fs.readFileSync(appPath, 'utf-8');

  const authPagePath = path.resolve(__dirname, '../pages/AuthPage.jsx');
  const authPageContent = fs.readFileSync(authPagePath, 'utf-8');

  const authContextPath = path.resolve(__dirname, '../context/AuthContext.jsx');
  const authContextContent = fs.readFileSync(authContextPath, 'utf-8');

  it('1. Verifies video assets are completely removed from public directory', () => {
    assert.ok(!fs.existsSync(mp4Path), 'keyflow_welcome.mp4 must NOT exist in public directory');
    assert.ok(!fs.existsSync(webmPath), 'keyflow_welcome.webm must NOT exist in public directory');
  });

  it('2. Verifies CinematicWelcomeOverlay component is completely removed from codebase', () => {
    assert.ok(!fs.existsSync(componentPath), 'CinematicWelcomeOverlay.jsx must NOT exist');
    assert.ok(!appContent.includes('CinematicWelcomeOverlay'), 'App.jsx must NOT import CinematicWelcomeOverlay');
  });

  it('3. Verifies App.jsx contains zero welcome state, gates, or overlays', () => {
    assert.ok(!appContent.includes('isWelcomePlaying'), 'App.jsx must NOT contain isWelcomePlaying');
    assert.ok(!appContent.includes('isWelcomeActive'), 'App.jsx must NOT contain isWelcomeActive');
    assert.ok(!appContent.includes('isWelcomePendingResolution'), 'App.jsx must NOT contain isWelcomePendingResolution');
    assert.ok(!appContent.includes('welcomeDismissed'), 'App.jsx must NOT contain welcomeDismissed');
    assert.ok(!appContent.includes('welcomeCompletedRef'), 'App.jsx must NOT contain welcomeCompletedRef');
  });

  it('4. Verifies AuthPage targets Home Page (/) by default and does NOT force /workstation', () => {
    assert.ok(
      authPageContent.includes("location.state?.from && location.state.from !== '/' ? location.state.from : '/'"),
      'AuthPage destination must default to / when no from state is provided'
    );
    assert.ok(
      authPageContent.includes("navigate(destination || '/', { replace: true })"),
      'AuthPage must navigate to destination or / upon authentication'
    );
    assert.ok(!authPageContent.includes('keyflow_welcome_seen'), 'AuthPage must NOT read keyflow_welcome_seen');
    assert.ok(!authPageContent.includes('keyflow_auth_pending_intent'), 'AuthPage must NOT set keyflow_auth_pending_intent');
  });

  it('5. Verifies AuthContext contains zero welcome triggers or obsolete session flags', () => {
    assert.ok(!authContextContent.includes('triggerWelcomeIfNeeded'), 'AuthContext must NOT contain triggerWelcomeIfNeeded');
    assert.ok(!authContextContent.includes('keyflow-auth-login'), 'AuthContext must NOT dispatch keyflow-auth-login');
    assert.ok(!authContextContent.includes('keyflow_auth_pending_intent'), 'AuthContext must NOT reference keyflow_auth_pending_intent');
    assert.ok(!authContextContent.includes('keyflow_welcome_seen'), 'AuthContext must NOT reference keyflow_welcome_seen');
  });

  it('6. Verifies /sso-callback redirects to Home Page (/) instead of forcing /workstation', () => {
    assert.ok(
      appContent.includes('signInFallbackRedirectUrl="/"'),
      'sso-callback must use / as signIn fallback redirect'
    );
    assert.ok(
      appContent.includes('signUpFallbackRedirectUrl="/"'),
      'sso-callback must use / as signUp fallback redirect'
    );
  });
});
