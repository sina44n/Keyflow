/**
 * Google Search Console & XML Sitemap Verification Suite
 * =====================================================
 * Verifies sitemap.xml format, public routes, canonical domain,
 * Vercel configuration, and Google verification token preservation.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../');
const publicDir = path.resolve(rootDir, 'frontend/public');
const vercelJsonPath = path.resolve(rootDir, 'vercel.json');

describe('Sitemap & Search Engine Discovery Contract', () => {
  test('sitemap.xml exists in frontend/public and has valid XML declaration and schema', () => {
    const sitemapPath = path.join(publicDir, 'sitemap.xml');
    assert.ok(fs.existsSync(sitemapPath), 'frontend/public/sitemap.xml must exist');

    const content = fs.readFileSync(sitemapPath, 'utf8');
    assert.match(content, /^<\?xml version="1\.0" encoding="UTF-8"\?>/, 'Must start with XML declaration');
    assert.match(
      content,
      /<urlset\s+xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/,
      'Must declare standard sitemaps schema namespace'
    );
    assert.ok(content.endsWith('</urlset>\n') || content.endsWith('</urlset>'), 'Must close urlset tag');
  });

  test('sitemap.xml contains strictly public, canonical KEYFLOW URLs', () => {
    const sitemapPath = path.join(publicDir, 'sitemap.xml');
    const content = fs.readFileSync(sitemapPath, 'utf8');

    const locMatches = [...content.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
    assert.ok(locMatches.length >= 4, 'Must contain core public routes');

    const expectedCanonicalRoutes = [
      'https://keyflow-typing.vercel.app/',
      'https://keyflow-typing.vercel.app/themes',
      'https://keyflow-typing.vercel.app/telemetry',
      'https://keyflow-typing.vercel.app/login',
      'https://keyflow-typing.vercel.app/register',
    ];

    expectedCanonicalRoutes.forEach((expectedUrl) => {
      assert.ok(
        locMatches.includes(expectedUrl),
        `sitemap.xml must include canonical route: ${expectedUrl}`
      );
    });

    // Ensure all URLs belong strictly to canonical production domain
    locMatches.forEach((url) => {
      assert.ok(
        url.startsWith('https://keyflow-typing.vercel.app'),
        `URL must be on canonical domain https://keyflow-typing.vercel.app: ${url}`
      );
    });

    // Ensure no private, authenticated, test, or duplicate routes are present
    const forbiddenRoutes = [
      '/workstation',
      '/practice',
      '/academy',
      '/arcade',
      '/curriculum',
      '/analytics',
      '/sso-callback',
      '/reset-password',
    ];

    forbiddenRoutes.forEach((forbidden) => {
      const isPresent = locMatches.some((url) => url.endsWith(forbidden) || url.includes(`${forbidden}/`));
      assert.strictEqual(
        isPresent,
        false,
        `sitemap.xml must NOT include private or duplicate route: ${forbidden}`
      );
    });
  });

  test('preserves Google Search Console verification file', () => {
    const verificationPath = path.join(publicDir, 'googlea4403d4a69e42493.html');
    assert.ok(fs.existsSync(verificationPath), 'Verification file must exist in frontend/public');

    const content = fs.readFileSync(verificationPath, 'utf8').trim();
    assert.strictEqual(
      content,
      'google-site-verification: googlea4403d4a69e42493.html',
      'Verification file content must match exact plain text string without tags'
    );
  });

  test('robots.txt exists and references canonical sitemap.xml', () => {
    const robotsPath = path.join(publicDir, 'robots.txt');
    assert.ok(fs.existsSync(robotsPath), 'robots.txt must exist');

    const content = fs.readFileSync(robotsPath, 'utf8');
    assert.match(content, /User-agent:\s*\*/);
    assert.match(content, /Sitemap:\s*https:\/\/keyflow-typing\.vercel\.app\/sitemap\.xml/);
  });

  test('vercel.json specifies application/xml Content-Type header for sitemap.xml', () => {
    assert.ok(fs.existsSync(vercelJsonPath), 'vercel.json must exist');
    const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));

    assert.ok(Array.isArray(vercelConfig.headers), 'vercel.json must define headers array');
    const sitemapHeaderRule = vercelConfig.headers.find(h => h.source === '/sitemap.xml');
    assert.ok(sitemapHeaderRule, 'Must have a header rule for /sitemap.xml');

    const contentTypeHeader = sitemapHeaderRule.headers.find(
      hdr => hdr.key.toLowerCase() === 'content-type'
    );
    assert.ok(contentTypeHeader, 'Must declare Content-Type header');
    assert.match(contentTypeHeader.value, /application\/xml|text\/xml/);
  });
});
