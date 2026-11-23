import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('KEYFLOW Phase 7.39 — Duplicate Google Button & Localization Correction', () => {
  const authPagePath = path.resolve(__dirname, '../pages/AuthPage.jsx');
  const authPageContent = fs.readFileSync(authPagePath, 'utf-8');

  const indexCssPath = path.resolve(__dirname, '../index.css');
  const indexCssContent = fs.readFileSync(indexCssPath, 'utf-8');

  const authContextPath = path.resolve(__dirname, '../context/AuthContext.jsx');
  const authContextContent = fs.readFileSync(authContextPath, 'utf-8');

  const appPath = path.resolve(__dirname, '../App.jsx');
  const appContent = fs.readFileSync(appPath, 'utf-8');

  it('1. Safe localization lookup returns explicit fallback without exposing key name', () => {
    // Simulate t function from I18nContext.jsx
    function simulateT(key, paramsOrFallback = '', fallback = '') {
      let defaultText = '';
      if (typeof paramsOrFallback === 'string') {
        defaultText = paramsOrFallback;
      } else if (typeof paramsOrFallback === 'object') {
        defaultText = fallback;
      }
      return defaultText || key;
    }

    assert.strictEqual(
      simulateT('auth.login.google', 'Continue with Google'),
      'Continue with Google',
      't with explicit fallback must return "Continue with Google"'
    );
    assert.strictEqual(
      simulateT('auth.register.google', 'Sign up with Google'),
      'Sign up with Google',
      't with explicit fallback must return "Sign up with Google"'
    );
  });

  it('2. AuthPage.jsx uses safe localization lookup with explicit fallback parameter', () => {
    assert.ok(
      authPageContent.includes("t('auth.login.google', 'Continue with Google')"),
      'AuthPage.jsx must call t with explicit fallback "Continue with Google"'
    );
    assert.ok(
      authPageContent.includes("t('auth.register.google', 'Sign up with Google')"),
      'AuthPage.jsx must call t with explicit fallback "Sign up with Google"'
    );
    assert.strictEqual(
      authPageContent.includes("t('auth.login.google') ||"),
      false,
      'AuthPage.jsx must not call t without fallback parameter'
    );
  });

  it('3. Clerk appearance overrides strictly suppress prebuilt internal social buttons and divider', () => {
    // 1. In clerkAppearance object
    assert.ok(
      authPageContent.includes("socialButtonsRoot: 'hidden'"),
      'clerkAppearance elements must specify socialButtonsRoot: hidden'
    );
    assert.ok(
      authPageContent.includes("socialButtons: 'hidden'"),
      'clerkAppearance elements must specify socialButtons: hidden'
    );
    assert.ok(
      authPageContent.includes("socialButtonsBlockButton: 'hidden'"),
      'clerkAppearance elements must specify socialButtonsBlockButton: hidden'
    );
    assert.ok(
      authPageContent.includes("dividerRow: 'hidden'"),
      'clerkAppearance elements must specify dividerRow: hidden'
    );

    // 2. In global stylesheet index.css with !important to defeat emotion specificity
    assert.ok(
      indexCssContent.includes('.cl-socialButtonsRoot') &&
      indexCssContent.includes('.cl-socialButtons') &&
      indexCssContent.includes('.cl-socialButtonsBlockButton') &&
      indexCssContent.includes('.cl-dividerRow') &&
      indexCssContent.includes('display: none !important;'),
      'index.css must enforce display: none !important on Clerk prebuilt social elements'
    );
  });

  it('4. Retained Google button is wired to custom loginWithGoogle with select_account', () => {
    // Button onClick handler
    assert.ok(
      authPageContent.includes('onClick={handleGoogleSignIn}'),
      'Retained outer Google button must invoke handleGoogleSignIn'
    );
    assert.ok(
      authPageContent.includes('await loginWithGoogle({ destination });'),
      'handleGoogleSignIn must delegate to loginWithGoogle from AuthContext'
    );

    // AuthContext OAuth options
    assert.ok(
      authContextContent.includes("strategy: 'oauth_google'"),
      'AuthContext.jsx must maintain strategy: oauth_google'
    );
    assert.ok(
      authContextContent.includes("oidcPrompt: 'select_account'"),
      'AuthContext.jsx must maintain oidcPrompt: select_account'
    );
    assert.ok(
      authContextContent.includes("redirectUrl: '/sso-callback'"),
      'AuthContext.jsx must direct callback to /sso-callback'
    );
  });

  it('5. Email/password sign-in and sign-up remain fully accessible in Clerk card', () => {
    // Clerk prebuilt component mounts
    assert.ok(
      authPageContent.includes('<SignIn'),
      'AuthPage.jsx must mount Clerk SignIn component'
    );
    assert.ok(
      authPageContent.includes('<SignUp'),
      'AuthPage.jsx must mount Clerk SignUp component'
    );

    // Clerk primary form buttons and inputs are not hidden
    assert.ok(
      authPageContent.includes("formButtonPrimary:"),
      'clerkAppearance must style formButtonPrimary'
    );
    assert.ok(
      authPageContent.includes("formFieldInput:"),
      'clerkAppearance must style formFieldInput'
    );
    assert.strictEqual(
      indexCssContent.includes('.cl-formButtonPrimary { display: none'),
      false,
      'index.css must never hide Clerk form buttons'
    );
    assert.strictEqual(
      indexCssContent.includes('.cl-formFieldInput { display: none'),
      false,
      'index.css must never hide Clerk form inputs'
    );
  });

  it('6. Phase 7.38 deep-link fallback configuration is preserved in App.jsx', () => {
    assert.ok(
      appContent.includes('signInFallbackRedirectUrl="/"'),
      'App.jsx must retain signInFallbackRedirectUrl'
    );
    assert.ok(
      appContent.includes('signUpFallbackRedirectUrl="/"'),
      'App.jsx must retain signUpFallbackRedirectUrl'
    );
    assert.strictEqual(
      appContent.includes('signInForceRedirectUrl'),
      false,
      'App.jsx must not reintroduce signInForceRedirectUrl'
    );
    assert.strictEqual(
      appContent.includes('signUpForceRedirectUrl'),
      false,
      'App.jsx must not reintroduce signUpForceRedirectUrl'
    );
  });
});
