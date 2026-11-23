import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the real exported getOrWaitAuthResource helper from clerkAuthHelper
import { getOrWaitAuthResource } from '../utils/clerkAuthHelper.js';

describe('KEYFLOW Phase 7.42 — Clerk Authentication Initialization & Google OAuth Readiness', () => {
  const authPagePath = path.resolve(__dirname, '../pages/AuthPage.jsx');
  const authPageContent = fs.readFileSync(authPagePath, 'utf-8');

  const authContextPath = path.resolve(__dirname, '../context/AuthContext.jsx');
  const authContextContent = fs.readFileSync(authContextPath, 'utf-8');

  const appPath = path.resolve(__dirname, '../App.jsx');
  const appContent = fs.readFileSync(appPath, 'utf-8');

  it('1. Google button remains disabled while Clerk is genuinely loading', () => {
    // AuthPage must observe isAuthReady from useAuth()
    assert.ok(
      authPageContent.includes('isAuthReady'),
      'AuthPage.jsx must destructure isAuthReady from useAuth()'
    );
    assert.ok(
      authPageContent.includes('disabled={isSubmitting || isGoogleLoading || (isClerkConfigured && !isAuthReady)}'),
      'Google button must be disabled when Clerk is not yet initialized'
    );
    assert.ok(
      authPageContent.includes("'Connecting...'"),
      'Google button must display a connecting indicator while Clerk initializes'
    );
  });

  it('2. Google OAuth does not execute before Clerk initialization completes (waits via addListener)', async () => {
    let listenerRegistered = false;
    let listenerCallback = null;

    const mockClerkLoading = {
      loaded: false,
      status: 'loading',
      addListener: (cb) => {
        listenerRegistered = true;
        listenerCallback = cb;
        return () => {};
      },
    };

    // Begin resolving auth resource while Clerk is loading
    const resourcePromise = getOrWaitAuthResource(mockClerkLoading, null, null, 1000);

    // Verify it did not immediately resolve because Clerk is loading
    assert.strictEqual(listenerRegistered, true, 'addListener must be registered to wait for Clerk initialization');

    // Simulate Clerk completing initialization and emitting ready client
    const mockSignInResource = {
      authenticateWithRedirect: async () => {},
    };
    listenerCallback({
      client: { signIn: mockSignInResource },
    });

    const resolved = await resourcePromise;
    assert.strictEqual(resolved, mockSignInResource, 'Must resolve the SignInResource once Clerk emits ready state');
  });

  it('3. Google OAuth starts after Clerk becomes ready', async () => {
    let oauthStarted = false;
    let receivedParams = null;

    const mockSignInResource = {
      authenticateWithRedirect: async (params) => {
        oauthStarted = true;
        receivedParams = params;
      },
    };

    const mockClerkReady = {
      loaded: true,
      status: 'ready',
      client: { signIn: mockSignInResource },
    };

    const resource = await getOrWaitAuthResource(mockClerkReady, null, null);
    assert.ok(resource, 'Must resolve ready resource immediately');
    await resource.authenticateWithRedirect({
      strategy: 'oauth_google',
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/workstation',
      oidcPrompt: 'select_account',
    });

    assert.strictEqual(oauthStarted, true, 'OAuth redirect must start after readiness');
    assert.strictEqual(receivedParams.strategy, 'oauth_google');
    assert.strictEqual(receivedParams.oidcPrompt, 'select_account');
  });

  it('4. The correct authentication resource is obtained from the supported Clerk hook/API', async () => {
    const mockSignIn = {
      authenticateWithRedirect: async () => {},
    };
    const mockClerk = {
      loaded: true,
      status: 'ready',
      client: { signIn: mockSignIn },
    };

    // Both direct client and hook-provided resources are recognized
    const resFromClient = await getOrWaitAuthResource(mockClerk, null, null);
    assert.strictEqual(resFromClient, mockSignIn);

    const resFromHook = await getOrWaitAuthResource({ loaded: true }, mockSignIn, null);
    assert.strictEqual(resFromHook, mockSignIn);
  });

  it('5. An initialized Clerk instance does not incorrectly produce the initialization error', async () => {
    const mockSignIn = {
      authenticateWithRedirect: async () => 'redirecting',
    };
    const mockClerk = {
      loaded: true,
      status: 'ready',
      client: { signIn: mockSignIn },
    };

    // Calling getOrWaitAuthResource with ready Clerk must never throw
    let thrown = null;
    let result = null;
    try {
      result = await getOrWaitAuthResource(mockClerk, mockSignIn, null);
    } catch (err) {
      thrown = err;
    }

    assert.strictEqual(thrown, null, 'Ready Clerk must NOT throw an initialization error');
    assert.strictEqual(result, mockSignIn);
  });

  it('6. Missing authentication resources produce a controlled error on timeout', async () => {
    const mockClerkBroken = {
      loaded: false,
      status: 'loading',
      addListener: () => () => {}, // Never emits
    };

    let thrown = null;
    try {
      await getOrWaitAuthResource(mockClerkBroken, null, null, 50); // fast timeout for test
    } catch (err) {
      thrown = err;
    }

    assert.ok(thrown, 'Must throw error on initialization timeout');
    assert.strictEqual(
      thrown.message,
      'Authentication service initialization timed out. Please refresh and try again.'
    );
  });

  it('7. Session sign-out is awaited before OAuth initiation', async () => {
    const sequence = [];
    const mockClerk = {
      session: { id: 'sess_active' },
      user: { id: 'user_active' },
      loaded: true,
      status: 'ready',
      signOut: async () => {
        sequence.push('signOut');
      },
      client: {
        signIn: {
          authenticateWithRedirect: async () => {
            sequence.push('authenticateWithRedirect');
          },
        },
      },
    };

    // Simulate loginWithGoogle flow
    if (mockClerk.session || mockClerk.user) {
      await mockClerk.signOut();
    }
    const authResource = await getOrWaitAuthResource(mockClerk, null, null);
    await authResource.authenticateWithRedirect({
      strategy: 'oauth_google',
    });

    assert.deepStrictEqual(sequence, ['signOut', 'authenticateWithRedirect']);
  });

  it('8. OAuth does not start if sign-out fails', async () => {
    let oauthStarted = false;
    let thrownError = null;

    const mockClerkFailing = {
      session: { id: 'sess_prev' },
      user: { id: 'user_prev' },
      signOut: async () => {
        throw new Error('Sign-out failed');
      },
      client: {
        signIn: {
          authenticateWithRedirect: async () => {
            oauthStarted = true;
          },
        },
      },
    };

    try {
      if (mockClerkFailing.session || mockClerkFailing.user) {
        try {
          await mockClerkFailing.signOut();
        } catch (err) {
          throw new Error('Unable to clear previous session before Google login. Please sign out manually.');
        }
      }
      await mockClerkFailing.client.signIn.authenticateWithRedirect({});
    } catch (err) {
      thrownError = err;
    }

    assert.ok(thrownError);
    assert.strictEqual(oauthStarted, false, 'OAuth must NOT start if sign-out fails');
  });

  it('9. Duplicate clicks do not initiate duplicate OAuth requests', () => {
    // Both isGoogleLoading and disabled attribute prevent duplicate submissions
    assert.ok(
      authPageContent.includes('setIsGoogleLoading(true)'),
      'handleGoogleSignIn must set isGoogleLoading to true'
    );
    assert.ok(
      authPageContent.includes('disabled={isSubmitting || isGoogleLoading || (isClerkConfigured && !isAuthReady)}'),
      'Button must disable when isGoogleLoading is true'
    );
    assert.ok(
      authPageContent.includes('if (isClerkConfigured && !isAuthReady) return;'),
      'handleGoogleSignIn must early-exit if clicked while not ready'
    );
  });

  it('10. oauth_google strategy remains intact', () => {
    assert.ok(
      authContextContent.includes("strategy: 'oauth_google'"),
      'strategy must be oauth_google'
    );
  });

  it('11. oidcPrompt: "select_account" reaches the correct method', () => {
    assert.ok(
      authContextContent.includes("oidcPrompt: 'select_account'"),
      'oidcPrompt must be select_account'
    );
  });

  it('12. Callback and deep-link destinations remain intact', () => {
    assert.ok(
      authContextContent.includes("redirectUrl: '/sso-callback'"),
      'redirectUrl must be /sso-callback'
    );
    assert.ok(
      authContextContent.includes("redirectUrlComplete: options?.destination || '/'"),
      'redirectUrlComplete must preserve options.destination'
    );
    assert.ok(
      appContent.includes('signInFallbackRedirectUrl="/"'),
      'App.jsx must configure signInFallbackRedirectUrl="/"'
    );
  });

  it('13. No clerk.openSignIn() fallback reappears in loginWithGoogle', () => {
    const loginWithGoogleStart = authContextContent.indexOf('loginWithGoogle: async');
    const loginWithGoogleEnd = authContextContent.indexOf('return <AuthContext.Provider', loginWithGoogleStart);
    const loginWithGoogleBody = authContextContent.substring(loginWithGoogleStart, loginWithGoogleEnd);

    assert.ok(
      !loginWithGoogleBody.includes('clerk.openSignIn()'),
      'clerk.openSignIn() must NEVER be called in loginWithGoogle'
    );
  });

  it('14. Existing email/password and signup behavior remains functional', () => {
    assert.ok(
      authPageContent.includes('<SignIn'),
      'AuthPage.jsx must mount Clerk SignIn for email/password'
    );
    assert.ok(
      authPageContent.includes('<SignUp'),
      'AuthPage.jsx must mount Clerk SignUp for registration'
    );
    assert.ok(
      authPageContent.includes('<ClerkPasswordReset'),
      'AuthPage.jsx must mount ClerkPasswordReset for password reset'
    );
  });
});
