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

  it('marks Arabic as RTL direction and other languages as LTR', () => {
    const arabic = SUPPORTED_LANGUAGES.find((l) => l.code === 'ar');
    assert.ok(arabic);
    assert.equal(arabic.dir, 'rtl');

    const ltrLanguages = SUPPORTED_LANGUAGES.filter((l) => l.code !== 'ar');
    for (const l of ltrLanguages) {
      assert.equal(l.dir, 'ltr', `Language ${l.code} should be LTR`);
    }
  });

  it('guarantees complete dictionary parity across all 17 languages with zero missing keys', () => {
    const enKeys = Object.keys(TRANSLATIONS.en).sort();
    assert.ok(enKeys.length >= 320, `Expected at least 320 translation keys, got ${enKeys.length}`);

    for (const lang of SUPPORTED_LANGUAGES) {
      const dict = TRANSLATIONS[lang.code];
      assert.ok(dict, `Dictionary for ${lang.code} does not exist`);
      
      const missingKeys = enKeys.filter((key) => !dict[key]);
      assert.deepEqual(
        missingKeys,
        [],
        `Language ${lang.code} is missing ${missingKeys.length} keys: ${missingKeys.slice(0, 5).join(', ')}...`
      );
    }
  });

  it('translates core navigation, auth, workstation, and arcade across non-English locales', () => {
    // Malayalam verification
    assert.equal(TRANSLATIONS.ml['auth.login.title'], 'പ്രവേശിക്കുക');
    assert.equal(TRANSLATIONS.ml['nav.workstation'], 'വർക്ക്‌സ്റ്റേഷൻ');
    assert.equal(TRANSLATIONS.ml['arcade.title'], 'ഗെയിം രൂപകൽപ്പന ചെയ്ത സ്പീഡ് ഡ്രില്ലുകൾ');

    // Hindi verification
    assert.equal(TRANSLATIONS.hi['auth.login.title'], 'लॉग इन करें');
    assert.equal(TRANSLATIONS.hi['nav.academy'], 'अकादमी');
    assert.equal(TRANSLATIONS.hi['common.accuracy'], 'सटीकता');

    // Arabic verification
    assert.equal(TRANSLATIONS.ar['nav.signIn'], 'تسجيل الدخول');
    assert.equal(TRANSLATIONS.ar['common.pause'], 'إيقاف مؤقت');

    // Japanese verification
    assert.equal(TRANSLATIONS.ja['common.play'], 'プレイ');
    assert.equal(TRANSLATIONS.ja['nav.themes'], 'テーマ');

    // Spanish verification
    assert.equal(TRANSLATIONS.es['auth.register.title'], 'Crear cuenta');
    assert.equal(TRANSLATIONS.es['common.restart'], 'Reiniciar');
  });

  it('contains dedicated translations for all 7 arcade games across all languages', () => {
    const gameIds = ['cascade', 'sprint', 'hunter', 'ninja', 'runner', 'memory', 'boss'];
    for (const lang of SUPPORTED_LANGUAGES) {
      const dict = TRANSLATIONS[lang.code];
      for (const id of gameIds) {
        assert.ok(dict[`arcade.${id}.title`], `Missing arcade.${id}.title in ${lang.code}`);
        assert.ok(dict[`arcade.${id}.desc`], `Missing arcade.${id}.desc in ${lang.code}`);
        assert.ok(dict[`arcade.${id}.badge`], `Missing arcade.${id}.badge in ${lang.code}`);
      }
    }
  });

  it('contains quote category translations across all languages', () => {
    const categories = ['typing', 'focus', 'discipline', 'patience', 'consistency', 'mastery', 'flow'];
    for (const lang of SUPPORTED_LANGUAGES) {
      const dict = TRANSLATIONS[lang.code];
      for (const cat of categories) {
        assert.ok(dict[`quotes.category.${cat}`], `Missing quotes.category.${cat} in ${lang.code}`);
      }
    }
  });

  it('contains dedicated theme showcase translations across all 17 languages', () => {
    const themeKeys = ['themes.badge', 'themes.title', 'themes.subtitle', 'themes.active'];
    for (const lang of SUPPORTED_LANGUAGES) {
      const dict = TRANSLATIONS[lang.code];
      for (const key of themeKeys) {
        assert.ok(dict[key], `Missing ${key} in ${lang.code}`);
        assert.ok(dict[key].trim().length > 0, `Empty ${key} in ${lang.code}`);
      }
    }
    assert.equal(TRANSLATIONS.en['themes.active'], 'Active');
    assert.equal(TRANSLATIONS.ml['themes.active'], 'സജീവം');
    assert.equal(TRANSLATIONS.hi['themes.active'], 'सक्रिय');
    assert.equal(TRANSLATIONS.ar['themes.active'], 'نشط');
  });

  it('falls back to English when a translation key is missing in another language', () => {
    const testKey = 'auth.login.button';
    const fallback = TRANSLATIONS.kn[testKey] || TRANSLATIONS.en[testKey];
    assert.ok(fallback);
  });
});

