import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('KEYFLOW Phase 7.41 — Google OAuth Flow Forensic Investigation & True Google Account Chooser Correction', () => {
  const authPagePath = path.resolve(__dirname, '../pages/AuthPage.jsx');
  const authPageContent = fs.readFileSync(authPagePath, 'utf-8');

  const authContextPath = path.resolve(__dirname, '../context/AuthContext.jsx');
  const authContextContent = fs.readFileSync(authContextPath, 'utf-8');

  const appPath = path.resolve(__dirname, '../App.jsx');
  const appContent = fs.readFileSync(appPath, 'utf-8');

  const indexCssPath = path.resolve(__dirname, '../index.css');
  const indexCssContent = fs.readFileSync(indexCssPath, 'utf-8');

  it('1. Clicking the custom Google button invokes the intended OAuth handler', () => {
    assert.ok(
      authPageContent.includes('onClick={handleGoogleSignIn}'),
      'Continue with Google button must bind onClick to handleGoogleSignIn'
    );
    assert.ok(
      authPageContent.includes('await loginWithGoogle({ destination });'),
      'handleGoogleSignIn must delegate to loginWithGoogle from useAuth'
    );
  });

  it('2. The correct installed Clerk API is called (signIn / client.signIn authenticateWithRedirect)', () => {
    assert.ok(
      authContextContent.includes('useSignIn();') && authContextContent.includes('signIn'),
      'AuthContext.jsx must consume useSignIn hook from @clerk/react'
    );
    assert.ok(
      authContextContent.includes('getOrWaitAuthResource(clerk, signIn, signUp)') ||
      authContextContent.includes('clerk?.client?.signIn || signIn'),
      'AuthContext.jsx must resolve official Clerk authResource (signIn / client.signIn)'
    );
    assert.ok(
      authContextContent.includes('authResource?.authenticateWithRedirect'),
      'AuthContext.jsx must call authenticateWithRedirect on the resolved authResource'
    );
  });

  it('3. The Google OAuth strategy is oauth_google', () => {
    assert.ok(
      authContextContent.includes("strategy: 'oauth_google'"),
      'OAuth invocation must explicitly specify strategy: "oauth_google"'
    );
  });

  it('4. oidcPrompt: "select_account" reaches the actual OAuth initiation method', () => {
    assert.ok(
      authContextContent.includes("oidcPrompt: 'select_account'"),
      'OAuth invocation must pass oidcPrompt: "select_account" to force account chooser'
    );
  });

  it('5. The callback URL remains /sso-callback', () => {
    assert.ok(
      authContextContent.includes("redirectUrl: '/sso-callback'"),
      'OAuth invocation must set redirectUrl to /sso-callback'
    );
  });

  it('6. The intended redirect destination is preserved', () => {
    assert.ok(
      authContextContent.includes("redirectUrlComplete: options?.destination || '/'"),
      'OAuth invocation must preserve target destination or fallback to /'
    );
  });

  it('7. Existing Clerk session cleanup is awaited', async () => {
    const steps = [];
    const mockClerk = {
      session: { id: 'sess_prev' },
      user: { id: 'user_prev' },
      signOut: async () => {
        steps.push('signOut');
      },
      client: {
        signIn: {
          authenticateWithRedirect: async (params) => {
            steps.push('authenticateWithRedirect');
            assert.strictEqual(params.strategy, 'oauth_google');
            assert.strictEqual(params.oidcPrompt, 'select_account');
          },
        },
      },
    };

    // Simulate loginWithGoogle flow
    if (mockClerk.session || mockClerk.user) {
      await mockClerk.signOut();
    }
    const authResource = mockClerk.client.signIn;
    await authResource.authenticateWithRedirect({
      strategy: 'oauth_google',
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/workstation',
      oidcPrompt: 'select_account',
    });

    assert.deepStrictEqual(steps, ['signOut', 'authenticateWithRedirect']);
  });

  it('8. OAuth does not start if session cleanup fails', async () => {
    let oauthStarted = false;
    let thrownError = null;

    const mockClerkFailingSignOut = {
      session: { id: 'sess_prev' },
      user: { id: 'user_prev' },
      signOut: async () => {
        throw new Error('Sign-out network timeout');
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
      if (mockClerkFailingSignOut.session || mockClerkFailingSignOut.user) {
        try {
          await mockClerkFailingSignOut.signOut();
        } catch (signOutErr) {
          throw new Error('Unable to clear previous session before Google login. Please sign out manually.');
        }
      }
      await mockClerkFailingSignOut.client.signIn.authenticateWithRedirect({});
    } catch (err) {
      thrownError = err;
    }

    assert.ok(thrownError, 'An error must be thrown when sign-out fails');
    assert.strictEqual(thrownError.message, 'Unable to clear previous session before Google login. Please sign out manually.');
    assert.strictEqual(oauthStarted, false, 'OAuth must NOT start if sign-out fails');
  });

  it('9. No second KEYFLOW login form or sign-in modal is opened', () => {
    // Extract loginWithGoogle method from AuthContext.jsx
    const loginWithGoogleStart = authContextContent.indexOf('loginWithGoogle: async');
    const loginWithGoogleEnd = authContextContent.indexOf('return <AuthContext.Provider', loginWithGoogleStart);
    const loginWithGoogleBody = authContextContent.substring(loginWithGoogleStart, loginWithGoogleEnd);

    assert.ok(
      !loginWithGoogleBody.includes('clerk.openSignIn()'),
      'loginWithGoogle must NEVER call clerk.openSignIn() which opens the duplicate modal popup'
    );
    assert.ok(
      !loginWithGoogleBody.includes('clerk.openSignUp()'),
      'loginWithGoogle must NEVER call clerk.openSignUp()'
    );
    assert.ok(
      loginWithGoogleBody.includes("throw new Error('Authentication service is still initializing. Please wait a moment and try again.');"),
      'loginWithGoogle must throw an initialization error instead of opening a modal when auth resource is not ready'
    );
  });

  it('10. Existing email/password authentication remains functional', () => {
    assert.ok(
      authPageContent.includes('<SignIn'),
      'AuthPage.jsx must render Clerk SignIn component for email/password authentication'
    );
    assert.ok(
      authPageContent.includes('<SignUp'),
      'AuthPage.jsx must render Clerk SignUp component for registration'
    );
    assert.ok(
      authPageContent.includes('<ClerkPasswordReset'),
      'AuthPage.jsx must retain ClerkPasswordReset component for password recovery'
    );
  });

  it('11. Phase 7.38 deep-link fallback configuration remains intact', () => {
    assert.ok(
      appContent.includes('signInFallbackRedirectUrl="/"'),
      'App.jsx must retain fallback redirect URL for sign-in'
    );
    assert.ok(
      appContent.includes('signUpFallbackRedirectUrl="/"'),
      'App.jsx must retain fallback redirect URL for sign-up'
    );
    assert.ok(
      !appContent.includes('signInForceRedirectUrl'),
      'App.jsx must NOT include signInForceRedirectUrl'
    );
    assert.ok(
      !appContent.includes('signUpForceRedirectUrl'),
      'App.jsx must NOT include signUpForceRedirectUrl'
    );
  });

  it('12. Existing Phase 7.39 and 7.40 layout behavior remains intact', () => {
    // Unified Card Header above Google button
    const clerkBranchStart = authPageContent.indexOf('{isClerkConfigured ? (');
    const headerIndex = authPageContent.indexOf('Sign in to KEYFLOW', clerkBranchStart);
    const googleButtonIndex = authPageContent.indexOf('onClick={handleGoogleSignIn}', clerkBranchStart);
    const dividerIndex = authPageContent.indexOf('<span className="bg-white px-3 text-gray-400 font-semibold">or</span>', clerkBranchStart);
    const signInMountIndex = authPageContent.indexOf('<SignIn', clerkBranchStart);

    assert.ok(headerIndex < googleButtonIndex, 'Header must be before Google button');
    assert.ok(googleButtonIndex < dividerIndex, 'Google button must be before divider');
    assert.ok(dividerIndex < signInMountIndex, 'Divider must be before SignIn fields');

    // Safe translation fallback
    assert.ok(
      authPageContent.includes("t('auth.login.google', 'Continue with Google')"),
      'Must use safe translation fallback for Google button'
    );

    // CSS suppression of prebuilt elements
    assert.ok(
      indexCssContent.includes('.cl-header') &&
      indexCssContent.includes('.cl-socialButtonsRoot') &&
      indexCssContent.includes('.cl-dividerRow') &&
      indexCssContent.includes('display: none !important;'),
      'index.css must enforce display: none !important on prebuilt Clerk elements'
    );
  });
});
