import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('KEYFLOW Phase 7.40 — Restore Original Login Card Google Button Position & Layout', () => {
  const authPagePath = path.resolve(__dirname, '../pages/AuthPage.jsx');
  const authPageContent = fs.readFileSync(authPagePath, 'utf-8');

  const indexCssPath = path.resolve(__dirname, '../index.css');
  const indexCssContent = fs.readFileSync(indexCssPath, 'utf-8');

  const authContextPath = path.resolve(__dirname, '../context/AuthContext.jsx');
  const authContextContent = fs.readFileSync(authContextPath, 'utf-8');

  const appPath = path.resolve(__dirname, '../App.jsx');
  const appContent = fs.readFileSync(appPath, 'utf-8');

  it('1. Unified card container renders title and subtitle at the top of the card', () => {
    assert.ok(
      authPageContent.includes("isLogin && 'Welcome Back'") ||
      authPageContent.includes("isLogin ? 'Welcome Back' : 'Welcome to KEYFLOW'"),
      'AuthPage.jsx must render "Welcome Back" at the top of the login card'
    );
    assert.ok(
      authPageContent.includes("'Enter your email and password to access your account'"),
      'AuthPage.jsx must render "Enter your email and password to access your account" subtitle'
    );
  });

  it('2. Custom Google button appears directly below the card header', () => {
    const clerkBranchStart = authPageContent.indexOf('{isClerkConfigured ? (');
    assert.ok(clerkBranchStart !== -1, 'isClerkConfigured block must exist');

    const headerIndex = authPageContent.indexOf('Welcome Back');
    const googleButtonIndex = authPageContent.indexOf('onClick={handleGoogleSignIn}', clerkBranchStart);
    const dividerIndex = authPageContent.indexOf('<span className="bg-white px-3 text-gray-400 font-semibold">or</span>', clerkBranchStart);
    const signInMountIndex = authPageContent.indexOf('<SignIn', clerkBranchStart);

    assert.ok(headerIndex !== -1, 'Unified card header must exist in Clerk branch');
    assert.ok(googleButtonIndex !== -1, 'Custom Google button must exist in Clerk branch');
    assert.ok(dividerIndex !== -1, 'Centered OR divider must exist in Clerk branch');
    assert.ok(signInMountIndex !== -1, '<SignIn component must exist in Clerk branch');

    // Strict sequential ordering inside the unified card:
    // 1. Header -> 2. Google Button -> 3. Divider -> 4. Clerk Form Fields
    assert.ok(
      headerIndex < googleButtonIndex,
      'Card header must appear BEFORE the Google button'
    );
    assert.ok(
      googleButtonIndex < dividerIndex,
      'Google button must appear BEFORE the centered OR divider'
    );
    assert.ok(
      dividerIndex < signInMountIndex,
      'Centered OR divider must appear BEFORE the Clerk email/password form'
    );
  });

  it('3. Clerk internal headers are suppressed to avoid duplicate titles', () => {
    // In clerkAppearance
    assert.ok(
      authPageContent.includes("header: 'hidden'"),
      'clerkAppearance must configure header: hidden'
    );
    assert.ok(
      authPageContent.includes("headerTitle: 'hidden'"),
      'clerkAppearance must configure headerTitle: hidden'
    );
    assert.ok(
      authPageContent.includes("headerSubtitle: 'hidden'"),
      'clerkAppearance must configure headerSubtitle: hidden'
    );

    // In index.css with !important
    assert.ok(
      indexCssContent.includes('.cl-header') &&
      indexCssContent.includes('.cl-headerTitle') &&
      indexCssContent.includes('.cl-headerSubtitle') &&
      indexCssContent.includes('display: none !important;'),
      'index.css must enforce display: none !important on Clerk internal header elements'
    );
  });

  it('4. Clerk internal social buttons and duplicate dividers remain strictly hidden', () => {
    // In clerkAppearance
    assert.ok(
      authPageContent.includes("socialButtonsRoot: 'hidden'"),
      'clerkAppearance must hide socialButtonsRoot'
    );
    assert.ok(
      authPageContent.includes("dividerRow: 'hidden'"),
      'clerkAppearance must hide dividerRow'
    );

    // In index.css
    assert.ok(
      indexCssContent.includes('.cl-socialButtonsRoot') &&
      indexCssContent.includes('.cl-dividerRow') &&
      indexCssContent.includes('display: none !important;'),
      'index.css must enforce display: none !important on Clerk internal social buttons and divider'
    );
  });

  it('5. Retained Google button preserves custom OAuth handler with select_account', () => {
    assert.ok(
      authPageContent.includes('onClick={handleGoogleSignIn}'),
      'Retained Google button must invoke handleGoogleSignIn'
    );
    assert.ok(
      authPageContent.includes('await loginWithGoogle({ destination });'),
      'handleGoogleSignIn must call loginWithGoogle'
    );
    assert.ok(
      authContextContent.includes("strategy: 'oauth_google'"),
      'AuthContext.jsx must maintain strategy: oauth_google'
    );
    assert.ok(
      authContextContent.includes("oidcPrompt: 'select_account'"),
      'AuthContext.jsx must maintain oidcPrompt: select_account'
    );
  });

  it('6. Phase 7.38 deep-link fallback redirects remain preserved in App.jsx', () => {
    assert.ok(
      appContent.includes('signInFallbackRedirectUrl="/"'),
      'App.jsx must retain signInFallbackRedirectUrl'
    );
    assert.ok(
      appContent.includes('signUpFallbackRedirectUrl="/"'),
      'App.jsx must retain signUpFallbackRedirectUrl'
    );
  });
});
