import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  getClerkPublishableKey,
  getClerkEnvironmentStatus,
  checkClientSecurityLeaks,
} from '../utils/clerkEnv.js';

describe('KEYFLOW — Clerk Environment Configuration & Hardening Validator', () => {
  it('correctly identifies development publishable key (pk_test_...)', () => {
    const devKey = 'pk_test_bmV3LWtpdHRlbi04MjU3LmNsZXJrLmFjY291bnRzLmRldiQ';
    const status = getClerkEnvironmentStatus(devKey, { PROD: false, DEV: true });

    assert.strictEqual(status.isConfigured, true);
    assert.strictEqual(status.isDevInstance, true);
    assert.strictEqual(status.isProdInstance, false);
    assert.strictEqual(status.instanceType, 'development');
    assert.strictEqual(status.validationError, null);
  });

  it('correctly identifies production publishable key (pk_live_...)', () => {
    const prodKey = 'pk_live_Y2xlcmsua2V5Zmxvdy5hcHAk';
    const status = getClerkEnvironmentStatus(prodKey, { PROD: true, DEV: false });

    assert.strictEqual(status.isConfigured, true);
    assert.strictEqual(status.isDevInstance, false);
    assert.strictEqual(status.isProdInstance, true);
    assert.strictEqual(status.instanceType, 'production');
    assert.strictEqual(status.validationError, null);
  });

  it('handles empty or missing publishable key gracefully without crashing', () => {
    const status = getClerkEnvironmentStatus('', { PROD: false, DEV: true });

    assert.strictEqual(status.isConfigured, false);
    assert.strictEqual(status.instanceType, 'unconfigured');
    assert.strictEqual(status.publishableKey, '');
    assert.strictEqual(status.validationError, null);
  });

  it('rejects malformed publishable keys that do not match pk_test_ or pk_live_', () => {
    const badKey = 'invalid_publishable_key_12345';
    const status = getClerkEnvironmentStatus(badKey, { PROD: false, DEV: true });

    assert.strictEqual(status.isConfigured, true);
    assert.strictEqual(status.isDevInstance, false);
    assert.strictEqual(status.isProdInstance, false);
    assert.strictEqual(status.instanceType, 'invalid');
    assert.ok(status.validationError.includes('pk_test_'));
  });

  it('detects and warns when development key is used in production mode', () => {
    const devKey = 'pk_test_bmV3LWtpdHRlbi04MjU3LmNsZXJrLmFjY291bnRzLmRldiQ';
    const status = getClerkEnvironmentStatus(devKey, { PROD: true, DEV: false });

    assert.strictEqual(status.isDevInstance, true);
    const hasDevInProdWarning = status.warnings.some((w) =>
      w.includes('Clerk Development Instance key (pk_test_...) detected in a production build')
    );
    assert.strictEqual(hasDevInProdWarning, true);
  });

  it('detects and notifies when production key is used in local development mode', () => {
    const prodKey = 'pk_live_Y2xlcmsua2V5Zmxvdy5hcHAk';
    const status = getClerkEnvironmentStatus(prodKey, { PROD: false, DEV: true });

    assert.strictEqual(status.isProdInstance, true);
    const hasProdInDevNotice = status.warnings.some((w) =>
      w.includes('Clerk Production Instance key (pk_live_...) detected in local development')
    );
    assert.strictEqual(hasProdInDevNotice, true);
  });

  it('detects accidental leak of Clerk Secret Key in client environment and reports security alert', () => {
    const maliciousClientEnv = {
      VITE_CLERK_PUBLISHABLE_KEY: 'pk_test_abc123',
      VITE_CLERK_SECRET_KEY: 'sk_test_secretKeyShouldNeverBeHere',
    };

    const leakCheck = checkClientSecurityLeaks(maliciousClientEnv);
    assert.strictEqual(leakCheck.hasSecurityLeak, true);
    assert.ok(leakCheck.leakedKeys.includes('VITE_CLERK_SECRET_KEY'));
  });

  it('passes security check when only safe public keys are in client environment', () => {
    const safeClientEnv = {
      VITE_CLERK_PUBLISHABLE_KEY: 'pk_test_abc123',
      VITE_API_URL: '/api',
    };

    const leakCheck = checkClientSecurityLeaks(safeClientEnv);
    assert.strictEqual(leakCheck.hasSecurityLeak, false);
    assert.strictEqual(leakCheck.leakedKeys.length, 0);
  });

  it('getClerkPublishableKey trims leading and trailing whitespace', () => {
    const raw = '   pk_test_sampleKey123   ';
    assert.strictEqual(getClerkPublishableKey(raw), 'pk_test_sampleKey123');
  });
});
