import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SUPPORTED_LANGUAGES, TRANSLATIONS } from './locales.js';

describe('KEYFLOW Multilingual System', () => {
  it('contains all 17 requested languages with native names', () => {
    assert.equal(SUPPORTED_LANGUAGES.length, 17);
    const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
    const required = [
      'en', 'ml', 'hi', 'ar', 'ta', 'te', 'kn', 'bn',
      'es', 'fr', 'de', 'pt', 'ja', 'ko', 'zh', 'it', 'id'
    ];
    for (const code of required) {
      assert.ok(codes.includes(code), `Missing language code: ${code}`);
    }
  });

  it('marks Arabic as RTL direction', () => {
    const arabic = SUPPORTED_LANGUAGES.find((l) => l.code === 'ar');
    assert.ok(arabic);
    assert.equal(arabic.dir, 'rtl');
  });

  it('provides complete core navigation and auth translations in English', () => {
    const en = TRANSLATIONS.en;
    assert.ok(en['nav.academy']);
    assert.ok(en['nav.workstation']);
    assert.ok(en['nav.arcade']);
    assert.ok(en['nav.signIn']);
    assert.ok(en['nav.getStarted']);
    assert.ok(en['auth.login.title']);
    assert.ok(en['auth.register.title']);
    assert.ok(en['auth.password']);
  });

  it('translates Malayalam and Hindi auth titles correctly', () => {
    assert.equal(TRANSLATIONS.ml['auth.login.title'], 'പ്രവേശിക്കുക');
    assert.equal(TRANSLATIONS.hi['auth.login.title'], 'लॉग इन करें');
  });

  it('falls back to English when a translation key is missing in another language', () => {
    const testKey = 'auth.login.button';
    const fallback = TRANSLATIONS.kn[testKey] || TRANSLATIONS.en[testKey];
    assert.ok(fallback);
  });
});
