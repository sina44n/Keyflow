import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('KEYFLOW — Clerk Authentication Frontend Architecture & Contracts', () => {
  it('App.jsx integrates ClerkProvider and conditionally wraps AuthProvider', () => {
    const appPath = path.resolve(__dirname, '../App.jsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');

    assert.ok(
      appContent.includes("import { ClerkProvider } from '@clerk/react'"),
      'App.jsx must import ClerkProvider from @clerk/react'
    );
    assert.ok(
      appContent.includes('VITE_CLERK_PUBLISHABLE_KEY'),
      'App.jsx must reference VITE_CLERK_PUBLISHABLE_KEY environment variable'
    );
    assert.ok(
      appContent.includes('<ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>'),
      'App.jsx must wrap application with ClerkProvider using publishable key'
    );
    assert.ok(
      appContent.includes('<AuthProvider isClerkConfigured={true}>{router}</AuthProvider>') &&
      appContent.includes('<AuthProvider isClerkConfigured={false}>{router}</AuthProvider>'),
      'App.jsx must pass isClerkConfigured flag to AuthProvider'
    );
  });

  it('AuthContext.jsx defines ClerkAuthBridge with authoritative DRF user resolution', () => {
    const authContextPath = path.resolve(__dirname, '../context/AuthContext.jsx');
    const authContextContent = fs.readFileSync(authContextPath, 'utf-8');

    assert.ok(
      authContextContent.includes("import { useAuth as useClerkAuth, useUser as useClerkUser, useClerk } from '@clerk/react'"),
      'AuthContext.jsx must import official Clerk React hooks'
    );
    assert.ok(
      authContextContent.includes('registerTokenGetter'),
      'AuthContext.jsx must register dynamic token getter with api.js'
    );
    assert.ok(
      authContextContent.includes('authAPI.clerkSync'),
      'AuthContext.jsx must invoke backend clerkSync to establish Django identity'
    );
    assert.ok(
      authContextContent.includes('syncLessonProgressFromBackend'),
      'AuthContext.jsx must preserve Academy progress synchronization on user login'
    );
    assert.ok(
      authContextContent.includes('syncArcadeRecordsFromBackend'),
      'AuthContext.jsx must preserve Arcade records synchronization on user login'
    );
    assert.ok(
      authContextContent.includes('FallbackAuthBridge'),
      'AuthContext.jsx must provide a safe FallbackAuthBridge when Clerk is unconfigured'
    );
  });

  it('api.js properly attaches Bearer token for Clerk JWTs and Token for Knox', () => {
    const apiPath = path.resolve(__dirname, '../utils/api.js');
    const apiContent = fs.readFileSync(apiPath, 'utf-8');

    assert.ok(
      apiContent.includes('registerTokenGetter'),
      'api.js must export registerTokenGetter for dynamic token retrieval'
    );
    assert.ok(
      apiContent.includes("config.headers.Authorization = `Bearer ${token}`"),
      'api.js must attach Bearer authorization header for Clerk JWTs'
    );
    assert.ok(
      apiContent.includes("config.headers.Authorization = `Token ${token}`"),
      'api.js must maintain backward-compatibility with Token header for Knox tokens'
    );
    assert.ok(
      apiContent.includes("clerkSync: (data) => api.post('/auth/clerk-sync/'"),
      'api.js must define clerkSync endpoint method'
    );
  });

  it('AuthPage.jsx provides Clerk SignIn and SignUp with KEYFLOW dark styling and safe fallback', () => {
    const authPagePath = path.resolve(__dirname, '../pages/AuthPage.jsx');
    const authPageContent = fs.readFileSync(authPagePath, 'utf-8');

    assert.ok(
      authPageContent.includes("import { SignIn, SignUp } from '@clerk/react'"),
      'AuthPage.jsx must import SignIn and SignUp components from @clerk/react'
    );
    assert.ok(
      authPageContent.includes('clerkAppearance'),
      'AuthPage.jsx must define custom clerkAppearance matching KEYFLOW theme'
    );
    assert.ok(
      authPageContent.includes('isClerkConfigured'),
      'AuthPage.jsx must inspect isClerkConfigured to render Clerk UI or setup guide'
    );
  });

  it('App.jsx provides wildcard subrouting for Clerk verification and callback routes', () => {
    const appPath = path.resolve(__dirname, '../App.jsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');

    assert.ok(appContent.includes('path="/login/*"'), 'App.jsx must provide wildcard route for /login/*');
    assert.ok(appContent.includes('path="/register/*"'), 'App.jsx must provide wildcard route for /register/*');
    assert.ok(appContent.includes('path="/forgot-password/*"'), 'App.jsx must provide wildcard route for /forgot-password/*');
    assert.ok(appContent.includes('path="/sso-callback/*"'), 'App.jsx must provide wildcard route for /sso-callback/*');
  });

  it('AuthPage.jsx integrates dedicated ClerkPasswordReset with generic email delivery messaging', () => {
    const authPagePath = path.resolve(__dirname, '../pages/AuthPage.jsx');
    const authPageContent = fs.readFileSync(authPagePath, 'utf-8');

    assert.ok(
      authPageContent.includes('export const ClerkPasswordReset'),
      'AuthPage.jsx must export ClerkPasswordReset component'
    );
    assert.ok(
      authPageContent.includes("strategy: 'reset_password_email_code'"),
      'ClerkPasswordReset must invoke Clerk reset_password_email_code strategy'
    );
    assert.ok(
      authPageContent.includes('If that email exists in our system, password reset instructions have been sent'),
      'ClerkPasswordReset must display generic confirmation message'
    );
    assert.ok(
      authPageContent.includes('attemptFirstFactor'),
      'ClerkPasswordReset must verify code and set password with attemptFirstFactor'
    );
  });

  it('AuthContext.jsx supports Clerk Google OAuth redirect and graceful offline fallback', () => {
    const authContextPath = path.resolve(__dirname, '../context/AuthContext.jsx');
    const authContextContent = fs.readFileSync(authContextPath, 'utf-8');

    assert.ok(
      authContextContent.includes("strategy: 'oauth_google'"),
      'AuthContext.jsx must invoke Clerk oauth_google strategy'
    );
    assert.ok(
      authContextContent.includes('redirectUrl: \'/sso-callback\''),
      'AuthContext.jsx must configure redirectUrl to /sso-callback'
    );
    assert.ok(
      authContextContent.includes('isOfflineFallback'),
      'AuthContext.jsx must provide resilient offline fallback user object'
    );
  });

  it('api.js getApiBaseUrl correctly handles production, local dev, and trailing slashes', async () => {
    const { getApiBaseUrl } = await import('../utils/api.js');

    // 1. Explicit full production URL with /api suffix
    assert.strictEqual(getApiBaseUrl('https://api.keyflow.app/api'), 'https://api.keyflow.app/api');

    // 2. Production URL without /api suffix -> automatically appends /api
    assert.strictEqual(getApiBaseUrl('https://api.keyflow.app'), 'https://api.keyflow.app/api');

    // 3. Trailing slash normalization
    assert.strictEqual(getApiBaseUrl('https://api.keyflow.app/'), 'https://api.keyflow.app/api');
    assert.strictEqual(getApiBaseUrl('https://api.keyflow.app/api/'), 'https://api.keyflow.app/api');

    // 4. Empty string -> returns default browser proxy endpoint (/api) or backend fallback
    const emptyResult = getApiBaseUrl('');
    assert.ok(emptyResult === '/api' || emptyResult === 'http://127.0.0.1:8000/api');
  });

  it('index.html does not load conflicting legacy Google Identity Services (GIS) scripts', () => {
    const indexPath = path.resolve(__dirname, '../../index.html');
    const indexContent = fs.readFileSync(indexPath, 'utf-8');

    assert.ok(
      !indexContent.includes('accounts.google.com/gsi/client'),
      'index.html must not include legacy GIS client script to avoid Clerk OAuth conflict'
    );
  });

  it('templates/email/clerk_verification_email.html exists and meets KEYFLOW branding & security standards', () => {
    const templatePath = path.resolve(__dirname, '../../../templates/email/clerk_verification_email.html');
    assert.ok(fs.existsSync(templatePath), 'clerk_verification_email.html must exist in templates/email');

    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    assert.ok(templateContent.includes('Verify your KEYFLOW email address'), 'Template must include expected subject');
    assert.ok(templateContent.includes('Verify Email Address'), 'Template must include primary action button text');
    assert.ok(templateContent.includes('{{action_url}}'), 'Template must include Clerk action_url variable');
    assert.ok(templateContent.includes('{{otp_code}}'), 'Template must include Clerk otp_code variable');
    assert.ok(templateContent.includes('#F95700'), 'Template must feature KEYFLOW brand accent color');
    assert.ok(templateContent.includes('Security notice'), 'Template must include security advisory');
  });
});
