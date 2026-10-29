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
});
