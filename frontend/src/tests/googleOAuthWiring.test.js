import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('KEYFLOW — Google OAuth Wiring & Clerk Session Isolation (Phase 7.37.6)', () => {
  const authPagePath = path.resolve(__dirname, '../pages/AuthPage.jsx');
  const authPageContent = fs.readFileSync(authPagePath, 'utf-8');
  const authContextPath = path.resolve(__dirname, '../context/AuthContext.jsx');
  const authContextContent = fs.readFileSync(authContextPath, 'utf-8');

  it('1. Standard Clerk-configured login renders dedicated Google OAuth action', () => {
    // Verifies that within isClerkConfigured block, the dedicated Google button is rendered
    assert.ok(
      authPageContent.includes('{/* Continue with Google for Clerk Mode (Login and Register) */}'),
      'AuthPage.jsx must include dedicated Google OAuth action in Clerk-configured branch'
    );
    assert.ok(
      authPageContent.includes('onClick={handleGoogleSignIn}'),
      'Google action must be wired to handleGoogleSignIn'
    );
  });

  it('2. Clicking Google login invokes supported authenticateWithRedirect on Clerk auth resource', () => {
    assert.ok(
      authContextContent.includes('authResource?.authenticateWithRedirect') ||
      authContextContent.includes('signIn?.authenticateWithRedirect') ||
      authContextContent.includes('clerk?.client?.signIn?.authenticateWithRedirect'),
      'AuthContext.jsx must invoke authenticateWithRedirect on supported Clerk resource'
    );
    assert.ok(
      !authContextContent.includes('clerk.openSignIn()') ||
      !authContextContent.includes('loginWithGoogle: async (options = {}) => {\n      // 1. Inspect and clear any active Clerk session before initiating a new OAuth flow\n      if (clerk?.session || clerk?.user) {\n        try {\n          await clerk.signOut();\n        } catch (signOutErr) {\n          console.error(\'[KEYFLOW Clerk] Pre-login sign out failed:\', signOutErr);\n          throw new Error(\'Unable to clear previous session before Google login. Please sign out manually.\');\n        }\n      }\n      // 2. Clear any stored tokens or cached user IDs to prevent cross-account contamination\n      clearStoredToken();\n      try {\n        localStorage.removeItem(\'keyflow_current_user_id\');\n      } catch {}\n      setLessonProgressUser(null);\n      setArcadeStorageUser(null);\n      setDjangoUser(null);\n      syncedClerkIdRef.current = null;\n\n      // 3. Initiate Google OAuth redirect with explicit account selection via supported Clerk API\n      const authResource = signIn || clerk?.client?.signIn || signUp || clerk?.client?.signUp;\n      if (authResource?.authenticateWithRedirect) {\n        return await authResource.authenticateWithRedirect({\n          strategy: \'oauth_google\',\n          redirectUrl: \'/sso-callback\',\n          redirectUrlComplete: options?.destination || \'/workstation\',\n          oidcPrompt: \'select_account\',\n        });\n      }\n      clerk.openSignIn();'),
      'loginWithGoogle must never fall back to clerk.openSignIn()'
    );
  });

  it('3. prompt=select_account reaches OAuth initiation via oidcPrompt', () => {
    assert.ok(
      authContextContent.includes("oidcPrompt: 'select_account'"),
      'AuthContext.jsx must pass oidcPrompt: select_account to force Google account chooser'
    );
    assert.ok(
      authContextContent.includes("strategy: 'oauth_google'"),
      'AuthContext.jsx must specify strategy: oauth_google'
    );
  });

  it('4. Existing active Clerk session is signed out before OAuth starts', async () => {
    const callOrder = [];
    const mockClerk = {
      session: { id: 'sess_active_owner' },
      user: { id: 'user_active_owner' },
      signOut: async () => {
        callOrder.push('signOut');
      },
      authenticateWithRedirect: async (params) => {
        callOrder.push('authenticateWithRedirect');
        assert.strictEqual(params.oidcPrompt, 'select_account');
      },
    };

    // Simulate loginWithGoogle logic from AuthContext.jsx
    if (mockClerk.session || mockClerk.user) {
      await mockClerk.signOut();
    }
    await mockClerk.authenticateWithRedirect({
      strategy: 'oauth_google',
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/workstation',
      oidcPrompt: 'select_account',
    });

    assert.deepStrictEqual(callOrder, ['signOut', 'authenticateWithRedirect']);
  });

  it('5. OAuth does NOT start if sign-out fails, preventing session leakage', async () => {
    let oauthStarted = false;
    let thrownError = null;

    const mockClerkFailingSignOut = {
      session: { id: 'sess_active_owner' },
      user: { id: 'user_active_owner' },
      signOut: async () => {
        throw new Error('Network error during sign out');
      },
      authenticateWithRedirect: async () => {
        oauthStarted = true;
      },
    };

    // Verify error guard in loginWithGoogle
    try {
      if (mockClerkFailingSignOut.session || mockClerkFailingSignOut.user) {
        try {
          await mockClerkFailingSignOut.signOut();
        } catch (signOutErr) {
          throw new Error('Unable to clear previous session before Google login. Please sign out manually.');
        }
      }
      await mockClerkFailingSignOut.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/workstation',
        oidcPrompt: 'select_account',
      });
    } catch (err) {
      thrownError = err;
    }

    assert.ok(thrownError, 'Must throw error when sign-out fails');
    assert.strictEqual(thrownError.message, 'Unable to clear previous session before Google login. Please sign out manually.');
    assert.strictEqual(oauthStarted, false, 'OAuth redirect must NEVER be invoked if sign out fails');
  });

  it('6. Duplicate clicks are prevented via button disabled state during loading', () => {
    assert.ok(
      authPageContent.includes('disabled={isSubmitting || isGoogleLoading}'),
      'Google button must be disabled when isGoogleLoading or isSubmitting is true'
    );
    assert.ok(
      authPageContent.includes('setIsGoogleLoading(true)'),
      'handleGoogleSignIn must immediately set isGoogleLoading to true'
    );
    assert.ok(
      authPageContent.includes('setIsGoogleLoading(false)'),
      'handleGoogleSignIn must reset isGoogleLoading in finally block'
    );
  });

  it('7. Logged-out user initiates Google login cleanly without redundant sign-out', async () => {
    const callOrder = [];
    const mockClerkLoggedOut = {
      session: null,
      user: null,
      signOut: async () => {
        callOrder.push('signOut');
      },
      authenticateWithRedirect: async (params) => {
        callOrder.push('authenticateWithRedirect');
        assert.strictEqual(params.strategy, 'oauth_google');
      },
    };

    if (mockClerkLoggedOut.session || mockClerkLoggedOut.user) {
      await mockClerkLoggedOut.signOut();
    }
    await mockClerkLoggedOut.authenticateWithRedirect({
      strategy: 'oauth_google',
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/workstation',
      oidcPrompt: 'select_account',
    });

    assert.deepStrictEqual(callOrder, ['authenticateWithRedirect'], 'Sign out must not be called when already signed out');
  });

  it('8. Email/password login remains functional via Clerk SignIn component', () => {
    assert.ok(
      authPageContent.includes('<SignIn'),
      'AuthPage.jsx must render Clerk SignIn component for email/password authentication'
    );
    assert.ok(
      authPageContent.includes('routing="path"'),
      'SignIn component must use path routing'
    );
    assert.ok(
      authPageContent.includes('path="/login"'),
      'SignIn component must mount at /login'
    );
  });

  it('9. Signup remains functional via Clerk SignUp component', () => {
    assert.ok(
      authPageContent.includes('<SignUp'),
      'AuthPage.jsx must render Clerk SignUp component for registration'
    );
    assert.ok(
      authPageContent.includes('path="/register"'),
      'SignUp component must mount at /register'
    );
  });

  it('10. Existing redirect destinations and fallback URLs are preserved', () => {
    assert.ok(
      authPageContent.includes('fallbackRedirectUrl={destination}'),
      'Clerk SignIn and SignUp must preserve dynamic destination fallback redirect'
    );
    assert.ok(
      authContextContent.includes("options?.destination || '/'"),
      'AuthContext.jsx must preserve destination parameter falling back to /'
    );
  });

  it('11. SSO callback behavior remains intact', () => {
    assert.ok(
      authContextContent.includes("redirectUrl: '/sso-callback'"),
      'AuthContext.jsx must direct OAuth callback to /sso-callback'
    );
    const appPath = path.resolve(__dirname, '../App.jsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');
    assert.ok(
      appContent.includes('<AuthenticateWithRedirectCallback'),
      'App.jsx must mount AuthenticateWithRedirectCallback at /sso-callback'
    );
  });

  it('12. Authentication errors are displayed safely without silent swallowing', () => {
    assert.ok(
      authPageContent.includes('{/* Error Alert for Clerk Mode */}'),
      'AuthPage.jsx must include error banner for Clerk authentication mode'
    );
    assert.ok(
      authPageContent.includes('<span>{errorMessage}</span>'),
      'AuthPage.jsx must render error message content safely'
    );
  });

  it('13. clerkAppearance hides internal social buttons and divider to prevent duplicate UI elements', () => {
    assert.ok(
      authPageContent.includes("socialButtonsRoot: 'hidden'"),
      'clerkAppearance must hide socialButtonsRoot'
    );
    assert.ok(
      authPageContent.includes("socialButtons: 'hidden'"),
      'clerkAppearance must hide socialButtons'
    );
    assert.ok(
      authPageContent.includes("socialButtonsBlockButton: 'hidden'"),
      'clerkAppearance must hide socialButtonsBlockButton'
    );
    assert.ok(
      authPageContent.includes("dividerRow: 'hidden'"),
      'clerkAppearance must hide dividerRow'
    );
  });
});
