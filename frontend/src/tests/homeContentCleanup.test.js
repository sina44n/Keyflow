import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { STAGE_META } from '../data/curriculumEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Phase 3: Home Page Content & Interaction Cleanup Regression Suite', () => {
  const heroSectionPath = path.resolve(__dirname, '../components/landing/HeroSection.jsx');
  const ctaSectionPath = path.resolve(__dirname, '../components/landing/CTASection.jsx');
  const featuresSectionPath = path.resolve(__dirname, '../components/landing/FeaturesSection.jsx');
  const landingPagePath = path.resolve(__dirname, '../pages/LandingPage.jsx');
  const footerPath = path.resolve(__dirname, '../components/common/Footer.jsx');
  const localesEnPath = path.resolve(__dirname, '../i18n/locales/en.js');

  const heroSrc = fs.readFileSync(heroSectionPath, 'utf-8');
  const ctaSrc = fs.readFileSync(ctaSectionPath, 'utf-8');
  const featuresSrc = fs.readFileSync(featuresSectionPath, 'utf-8');
  const landingSrc = fs.readFileSync(landingPagePath, 'utf-8');
  const footerSrc = fs.readFileSync(footerPath, 'utf-8');
  const enLocaleSrc = fs.readFileSync(localesEnPath, 'utf-8');

  const bannedClaims = [
    '0ms Input Latency',
    'Zero-Glance Anchoring',
    '12 Studio Themes',
    '0ms Input Latency • ANSI 60% Virtual Guide',
    'Free for all typists',
    'Zero login required to practice',
    'REST API Ready',
  ];

  describe('1. Unwanted Marketing Claims Removal Verification', () => {
    bannedClaims.forEach((claim) => {
      it(`guarantees "${claim}" is completely absent from HeroSection`, () => {
        assert.ok(!heroSrc.includes(claim), `HeroSection must not contain "${claim}"`);
      });

      it(`guarantees "${claim}" is completely absent from CTASection`, () => {
        assert.ok(!ctaSrc.includes(claim), `CTASection must not contain "${claim}"`);
      });

      it(`guarantees "${claim}" is completely absent from FeaturesSection`, () => {
        assert.ok(!featuresSrc.includes(claim), `FeaturesSection must not contain "${claim}"`);
      });

      it(`guarantees "${claim}" is completely absent from LandingPage`, () => {
        assert.ok(!landingSrc.includes(claim), `LandingPage must not contain "${claim}"`);
      });

      it(`guarantees "${claim}" is completely absent from Footer`, () => {
        assert.ok(!footerSrc.includes(claim), `Footer must not contain "${claim}"`);
      });
    });

    it('guarantees English locale file has removed misleading claims', () => {
      assert.ok(!enLocaleSrc.includes('"0ms Input Latency"'), 'en.js must not contain "0ms Input Latency"');
      assert.ok(!enLocaleSrc.includes('"Zero-Glance Anchoring"'), 'en.js must not contain "Zero-Glance Anchoring"');
      assert.ok(!enLocaleSrc.includes('"12 Studio Themes"'), 'en.js must not contain "12 Studio Themes"');
      assert.ok(!enLocaleSrc.includes('"0ms Input Latency • ANSI 60% Virtual Guide"'), 'en.js must not contain "0ms Input Latency • ANSI 60% Virtual Guide"');
    });
  });

  describe('2. Dynamic Academy Stage Count from Authoritative Curriculum', () => {
    it('verifies curriculumEngine.js STAGE_META is the authoritative source of truth', () => {
      assert.ok(Array.isArray(STAGE_META), 'STAGE_META must be an array');
      assert.strictEqual(STAGE_META.length, 10, 'STAGE_META must currently define 10 authoritative stages');
    });

    it('guarantees HeroSection imports STAGE_META and derives totalStages dynamically', () => {
      assert.ok(heroSrc.includes("import { STAGE_META } from '../../data/curriculumEngine'"), 'HeroSection must import STAGE_META');
      assert.ok(heroSrc.includes('STAGE_META?.length'), 'HeroSection must derive stage count from STAGE_META?.length');
      assert.ok(!heroSrc.includes('Explore 7-Stage Academy'), 'HeroSection must not contain hardcoded "Explore 7-Stage Academy"');
      assert.ok(!heroSrc.includes('7-Stage Academy'), 'HeroSection must not contain hardcoded "7-Stage Academy"');
    });

    it('guarantees CTASection imports STAGE_META and derives totalStages dynamically', () => {
      assert.ok(ctaSrc.includes("import { STAGE_META } from '../../data/curriculumEngine'"), 'CTASection must import STAGE_META');
      assert.ok(ctaSrc.includes('STAGE_META?.length'), 'CTASection must derive stage count from STAGE_META?.length');
    });

    it('guarantees FeaturesSection imports STAGE_META and derives totalStages dynamically', () => {
      assert.ok(featuresSrc.includes("import { STAGE_META } from '../../data/curriculumEngine'"), 'FeaturesSection must import STAGE_META');
      assert.ok(featuresSrc.includes('STAGE_META?.length'), 'FeaturesSection must derive stage count from STAGE_META?.length');
    });

    it('guarantees Footer imports STAGE_META and maps all stages dynamically', () => {
      assert.ok(footerSrc.includes("import { STAGE_META } from '../../data/curriculumEngine'"), 'Footer must import STAGE_META');
      assert.ok(footerSrc.includes('STAGE_META.map'), 'Footer must dynamically map STAGE_META');
      assert.ok(!footerSrc.includes('Stage 7: Speed Endurance & Capstone'), 'Footer must not contain obsolete static Stage 7 capstone');
    });
  });

  describe('3. Button Label Permanent Visibility Verification', () => {
    it('ensures Hero action buttons render visible text without hover dependency', () => {
      assert.ok(heroSrc.includes("{t('hero.launchWorkstation', 'Launch Workstation')}"), 'Launch Workstation button label must be present');
      assert.ok(heroSrc.includes("Explore ${totalStages}-Stage Academy"), 'Dynamic Explore Academy button label must be present');
    });

    it('ensures CTA action buttons render visible text without hover dependency', () => {
      assert.ok(ctaSrc.includes("{t('cta.startPractice')}"), 'Start Practice button label must be present');
      assert.ok(ctaSrc.includes("Explore ${totalStages}-Stage Academy"), 'Dynamic Explore Academy button label must be present');
    });

    it('ensures action buttons are not hidden by opacity-0 or group-hover visibility classes', () => {
      // Ensure buttons do not have classes that make text only visible on hover
      assert.ok(!heroSrc.includes('group-hover:block hidden'), 'Hero buttons must not be hidden until hover');
      assert.ok(!ctaSrc.includes('group-hover:block hidden'), 'CTA buttons must not be hidden until hover');
    });
  });

  describe('4. Home Page Footer Route and Link Integrity Audit', () => {
    it('ensures all footer links use React Router Link with valid single-click routes', () => {
      assert.ok(footerSrc.includes('<Link to="/"'), 'Footer brand link must use <Link to="/">');
      assert.ok(footerSrc.includes('<Link to="/academy"'), 'Footer academy link must use <Link to="/academy">');
      assert.ok(footerSrc.includes('<Link to="/themes"'), 'Footer themes link must use <Link to="/themes">');
      assert.ok(footerSrc.includes('<Link to="/telemetry"'), 'Footer telemetry link must use <Link to="/telemetry">');
    });

    it('ensures no dead hash links or fake contact details exist in the footer', () => {
      assert.ok(!footerSrc.includes('href="#"'), 'Footer must not contain dead href="#" links');
      assert.ok(!footerSrc.includes('mailto:'), 'Footer must not contain fake mailto: addresses');
      assert.ok(!footerSrc.includes('twitter.com'), 'Footer must not contain fake twitter links');
      assert.ok(!footerSrc.includes('discord.gg'), 'Footer must not contain fake discord links');
    });

    it('ensures arcade game routes in footer point to valid game query parameters', () => {
      const games = ['cascade', 'sprint', 'hunter', 'ninja', 'runner', 'memory', 'boss'];
      games.forEach((game) => {
        assert.ok(footerSrc.includes(`/arcade?game=${game}`), `Footer must link to /arcade?game=${game}`);
      });
    });

    it('ensures academy stage routes in footer point to valid stage query parameters', () => {
      assert.ok(footerSrc.includes('/academy?stage=${stage.stageId}'), 'Footer must dynamically link to /academy?stage=${stage.stageId}');
    });
  });
});
