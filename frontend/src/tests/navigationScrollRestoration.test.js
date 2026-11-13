import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Navigation & Scroll Restoration Contract — Phase 2', () => {
  const appPath = path.resolve(__dirname, '../App.jsx');
  const navbarPath = path.resolve(__dirname, '../components/common/Navbar.jsx');
  const footerPath = path.resolve(__dirname, '../components/common/Footer.jsx');
  const scrollToTopPath = path.resolve(__dirname, '../components/common/ScrollToTop.jsx');

  const appSrc = fs.readFileSync(appPath, 'utf-8');
  const navbarSrc = fs.readFileSync(navbarPath, 'utf-8');
  const footerSrc = fs.readFileSync(footerPath, 'utf-8');
  const scrollToTopSrc = fs.readFileSync(scrollToTopPath, 'utf-8');

  describe('1. Global Scroll-To-Top on Route Navigation', () => {
    it('creates ScrollToTop component with instant scroll behavior', () => {
      assert.ok(scrollToTopSrc.includes("behavior: 'instant'"), 'Must use instant scroll behavior');
      assert.ok(scrollToTopSrc.includes('top: 0'), 'Must scroll top to 0');
      assert.ok(scrollToTopSrc.includes('left: 0'), 'Must scroll left to 0');
    });

    it('listens strictly to pathname and hash from useLocation', () => {
      assert.ok(scrollToTopSrc.includes('useLocation'), 'Must use useLocation hook');
      assert.ok(scrollToTopSrc.includes('[pathname, hash]'), 'Must tie effect to pathname and hash');
    });

    it('integrates ScrollToTop inside BrowserRouter in App.jsx', () => {
      assert.ok(appSrc.includes('import { ScrollToTop }'), 'Must import ScrollToTop');
      assert.ok(
        appSrc.includes('<BrowserRouter>\n              <ScrollToTop />') ||
        appSrc.includes('<BrowserRouter><ScrollToTop />') ||
        appSrc.includes('<ScrollToTop />'),
        'Must place ScrollToTop inside BrowserRouter'
      );
    });

    it('safely handles hash anchors when present', () => {
      assert.ok(scrollToTopSrc.includes('document.getElementById'), 'Must check for target element by id');
      assert.ok(scrollToTopSrc.includes('scrollIntoView'), 'Must scroll element into view if hash present');
    });

    it('guards against undefined window object in SSR/Node environments', () => {
      assert.ok(scrollToTopSrc.includes("typeof window !== 'undefined'"), 'Guards window access');
    });
  });

  describe('2. Navbar Themes Route Fix', () => {
    it('configures Navbar Themes link with href: "/themes" and isInternal: true', () => {
      assert.ok(
        navbarSrc.includes("href: '/themes'") && navbarSrc.includes('isInternal: true'),
        'Navbar Themes link must point directly to /themes with isInternal: true'
      );
      assert.ok(
        !navbarSrc.includes("href: '/#themes'"),
        'Must NOT use /#themes in Navbar navLinks'
      );
    });

    it('renders dedicated ThemesPage on /themes route in App.jsx', () => {
      assert.ok(appSrc.includes('path="/themes"'), 'Must define /themes route in App.jsx');
      assert.ok(appSrc.includes('<ThemesPage />'), 'Must mount ThemesPage on /themes');
    });
  });

  describe('3. Footer Internal Route Audit', () => {
    it('uses React Router Link for Themes in footer', () => {
      assert.ok(
        footerSrc.includes('<Link to="/themes"'),
        'Footer Themes must use <Link to="/themes">'
      );
      assert.ok(
        !footerSrc.includes('href="#themes"'),
        'Footer Themes must not use raw href="#themes"'
      );
    });

    it('uses React Router Link for Telemetry in footer', () => {
      assert.ok(
        footerSrc.includes('<Link to="/telemetry"'),
        'Footer Telemetry must use <Link to="/telemetry">'
      );
      assert.ok(
        !footerSrc.includes('href="#telemetry"'),
        'Footer Telemetry must not use raw href="#telemetry"'
      );
    });

    it('uses React Router Link for Brand Wordmark in footer', () => {
      assert.ok(
        footerSrc.includes('<Link to="/"'),
        'Footer brand wordmark must use <Link to="/">'
      );
      assert.ok(
        !footerSrc.includes('<a href="#" className="flex items-center gap-2.5 group'),
        'Footer brand wordmark must not use <a href="#">'
      );
    });
  });
});
