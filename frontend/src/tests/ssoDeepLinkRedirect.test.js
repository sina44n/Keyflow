import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('KEYFLOW Phase 7.38 — Clerk SSO Deep-Link Redirect Correction', () => {
  const appPath = path.resolve(__dirname, '../App.jsx');
  const appContent = fs.readFileSync(appPath, 'utf-8');

  it('1. Both callback route declarations use fallback rather than forced redirects', () => {
    // Check that signInFallbackRedirectUrl and signUpFallbackRedirectUrl are present
    const fallbackSignInMatches = appContent.match(/signInFallbackRedirectUrl="\/"/g);
    const fallbackSignUpMatches = appContent.match(/signUpFallbackRedirectUrl="\/"/g);

    assert.ok(fallbackSignInMatches, 'App.jsx must contain signInFallbackRedirectUrl="/"');
    assert.strictEqual(
      fallbackSignInMatches.length,
      2,
      'App.jsx must configure signInFallbackRedirectUrl on both /sso-callback and /sso-callback/*'
    );

    assert.ok(fallbackSignUpMatches, 'App.jsx must contain signUpFallbackRedirectUrl="/"');
    assert.strictEqual(
      fallbackSignUpMatches.length,
      2,
      'App.jsx must configure signUpFallbackRedirectUrl on both /sso-callback and /sso-callback/*'
    );
  });

  it('2. Forced redirect properties are strictly eliminated from callback routes', () => {
    assert.strictEqual(
      appContent.includes('signInForceRedirectUrl'),
      false,
      'App.jsx must not contain signInForceRedirectUrl'
    );
    assert.strictEqual(
      appContent.includes('signUpForceRedirectUrl'),
      false,
      'App.jsx must not contain signUpForceRedirectUrl'
    );
  });

  it('3. Clerk RedirectUrls engine preserves deep-link destination when fallback is configured', async () => {
    const clerkRedirectUrlsPath = path.resolve(
      __dirname,
      '../../node_modules/@clerk/react/node_modules/@clerk/shared/dist/internal/clerk-js/redirectUrls.mjs'
    );
    const fileUrl = pathToFileURL(clerkRedirectUrlsPath).href;
    const { RedirectUrls } = await import(fileUrl);

    globalThis.window = { location: { origin: 'http://localhost:5173' } };

    // Scenario A: User accessed /academy/drills/speed -> deep-link in search params
    const redirectResolverA = new RedirectUrls(
      {},
      { signInFallbackRedirectUrl: '/workstation' },
      { redirect_url: '/academy/drills/speed' }
    );
    assert.strictEqual(
      redirectResolverA.getAfterSignInUrl(),
      'http://localhost:5173/academy/drills/speed',
      'Original deep link /academy/drills/speed must take precedence over fallback'
    );
  });

  it('4. Clerk RedirectUrls engine preserves deep-link query parameters', async () => {
    const clerkRedirectUrlsPath = path.resolve(
      __dirname,
      '../../node_modules/@clerk/react/node_modules/@clerk/shared/dist/internal/clerk-js/redirectUrls.mjs'
    );
    const fileUrl = pathToFileURL(clerkRedirectUrlsPath).href;
    const { RedirectUrls } = await import(fileUrl);

    globalThis.window = { location: { origin: 'http://localhost:5173' } };

    const targetUrl = '/academy/stage/3?difficulty=expert&mode=flow';
    const redirectResolver = new RedirectUrls(
      {},
      { signInFallbackRedirectUrl: '/workstation' },
      { redirect_url: targetUrl }
    );
    assert.strictEqual(
      redirectResolver.getAfterSignInUrl(),
      `http://localhost:5173${targetUrl}`,
      'Deep link query parameters must be preserved after authentication'
    );
  });

  it('5. /workstation remains the fallback when no explicit destination exists', async () => {
    const clerkRedirectUrlsPath = path.resolve(
      __dirname,
      '../../node_modules/@clerk/react/node_modules/@clerk/shared/dist/internal/clerk-js/redirectUrls.mjs'
    );
    const fileUrl = pathToFileURL(clerkRedirectUrlsPath).href;
    const { RedirectUrls } = await import(fileUrl);

    globalThis.window = { location: { origin: 'http://localhost:5173' } };

    const redirectResolver = new RedirectUrls(
      {},
      { signInFallbackRedirectUrl: '/workstation' },
      {}
    );
    assert.strictEqual(
      redirectResolver.getAfterSignInUrl(),
      'http://localhost:5173/workstation',
      '/workstation must be used when no explicit redirect_url is provided'
    );
  });

  it('6. Sign-up fallback preserves deep link and falls back to /workstation', async () => {
    const clerkRedirectUrlsPath = path.resolve(
      __dirname,
      '../../node_modules/@clerk/react/node_modules/@clerk/shared/dist/internal/clerk-js/redirectUrls.mjs'
    );
    const fileUrl = pathToFileURL(clerkRedirectUrlsPath).href;
    const { RedirectUrls } = await import(fileUrl);

    globalThis.window = { location: { origin: 'http://localhost:5173' } };

    // With deep link
    const resolverWithLink = new RedirectUrls(
      {},
      { signUpFallbackRedirectUrl: '/workstation' },
      { redirect_url: '/academy/placement' }
    );
    assert.strictEqual(
      resolverWithLink.getAfterSignUpUrl(),
      'http://localhost:5173/academy/placement',
      'Sign-up must preserve deep link destination'
    );

    // Without deep link
    const resolverDefault = new RedirectUrls(
      {},
      { signUpFallbackRedirectUrl: '/workstation' },
      {}
    );
    assert.strictEqual(
      resolverDefault.getAfterSignUpUrl(),
      'http://localhost:5173/workstation',
      'Sign-up must fall back to /workstation when no destination is provided'
    );
  });

  it('7. Negative test: verifies that ForceRedirectUrl would have clobbered deep links', async () => {
    const clerkRedirectUrlsPath = path.resolve(
      __dirname,
      '../../node_modules/@clerk/react/node_modules/@clerk/shared/dist/internal/clerk-js/redirectUrls.mjs'
    );
    const fileUrl = pathToFileURL(clerkRedirectUrlsPath).href;
    const { RedirectUrls } = await import(fileUrl);

    globalThis.window = { location: { origin: 'http://localhost:5173' } };

    // If signInForceRedirectUrl were present (defect state):
    const brokenResolver = new RedirectUrls(
      {},
      { signInForceRedirectUrl: '/workstation' },
      { redirect_url: '/academy/drills/speed' }
    );
    assert.strictEqual(
      brokenResolver.getAfterSignInUrl(),
      'http://localhost:5173/workstation',
      'Confirms that ForceRedirectUrl clobbers deep-link destinations to /workstation'
    );
  });

  it('8. Existing Google OAuth wiring in AuthContext.jsx remains intact', () => {
    const authContextPath = path.resolve(__dirname, '../context/AuthContext.jsx');
    const authContextContent = fs.readFileSync(authContextPath, 'utf-8');

    assert.ok(
      authContextContent.includes("strategy: 'oauth_google'"),
      'AuthContext.jsx must maintain strategy: oauth_google'
    );
    assert.ok(
      authContextContent.includes("redirectUrl: '/sso-callback'"),
      'AuthContext.jsx must direct callback to /sso-callback'
    );
    assert.ok(
      authContextContent.includes("options?.destination || '/'"),
      'AuthContext.jsx must pass destination parameter'
    );
    assert.ok(
      authContextContent.includes("oidcPrompt: 'select_account'"),
      'AuthContext.jsx must maintain oidcPrompt: select_account'
    );
  });

  it('9. Existing email/password authentication routes in App.jsx remain intact', () => {
    assert.ok(appContent.includes('path="/login/*"'), 'App.jsx must preserve /login/* route');
    assert.ok(appContent.includes('path="/login"'), 'App.jsx must preserve /login route');
    assert.ok(appContent.includes('path="/register/*"'), 'App.jsx must preserve /register/* route');
    assert.ok(appContent.includes('path="/register"'), 'App.jsx must preserve /register route');
    assert.ok(appContent.includes('path="/forgot-password"'), 'App.jsx must preserve /forgot-password route');
    assert.ok(appContent.includes('path="/reset-password/*"'), 'App.jsx must preserve /reset-password/* route');
  });
});
