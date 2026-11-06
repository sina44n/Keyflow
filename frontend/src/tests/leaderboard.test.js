/**
 * KEYFLOW Leaderboard Frontend Architecture & Integration Tests
 * ==============================================================
 * Tests verifying:
 * - Navbar replaces Features with Leaderboard in the exact same navigation position
 * - Route registration in App.jsx
 * - API client integration in api.js
 * - Component presence and structural compliance with Burgundy & Cream design system
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('KEYFLOW Global Leaderboard Implementation Tests', () => {
  it('Navbar replaces Features with Leaderboard in exact navigation position', () => {
    const navbarPath = path.resolve(__dirname, '../components/common/Navbar.jsx');
    const content = fs.readFileSync(navbarPath, 'utf-8');

    // Trophy icon imported
    assert.ok(content.includes('Trophy,'), 'Trophy icon must be imported in Navbar');

    // Leaderboard link present
    assert.ok(
      content.includes("{ label: t('nav.leaderboard') || 'Leaderboard', href: '/leaderboard', isInternal: true, icon: Trophy, primary: false }"),
      'Navbar must contain Leaderboard with isInternal: true and Trophy icon'
    );

    // Old features link removed from navLinks array
    assert.ok(
      !content.includes("{ label: t('nav.features') || 'Features', href: '/#features', isInternal: false, icon: Sparkles, primary: false }"),
      'Old Features link must be replaced in navLinks'
    );
  });

  it('App.jsx defines public /leaderboard route with LeaderboardPage', () => {
    const appPath = path.resolve(__dirname, '../App.jsx');
    const content = fs.readFileSync(appPath, 'utf-8');

    assert.ok(
      content.includes("import LeaderboardPage from './pages/LeaderboardPage'") ||
      content.includes("import('./pages/LeaderboardPage')"),
      'App.jsx must import LeaderboardPage'
    );
    assert.ok(
      content.includes('<Route path="/leaderboard" element={<LeaderboardPage />} />'),
      'App.jsx must route /leaderboard to LeaderboardPage'
    );
  });

  it('api.js exports leaderboardAPI with getLeaderboard and getHealth', () => {
    const apiPath = path.resolve(__dirname, '../utils/api.js');
    const content = fs.readFileSync(apiPath, 'utf-8');

    assert.ok(content.includes('export const leaderboardAPI = {'), 'api.js must export leaderboardAPI');
    assert.ok(content.includes("getLeaderboard: (params) => api.get('/leaderboard/', { params })"), 'leaderboardAPI must define getLeaderboard');
    assert.ok(content.includes("getHealth: () => api.get('/leaderboard/health/')"), 'leaderboardAPI must define getHealth');
  });

  it('Leaderboard components are modular, styled, and complete', () => {
    const compDir = path.resolve(__dirname, '../components/leaderboard');
    const files = [
      'LeaderboardOverview.jsx',
      'LeaderboardFilters.jsx',
      'LeaderboardPodium.jsx',
      'LeaderboardChart.jsx',
      'LeaderboardTable.jsx',
      'MyRankCard.jsx',
    ];

    files.forEach((file) => {
      const filePath = path.join(compDir, file);
      assert.ok(fs.existsSync(filePath), `Component file ${file} must exist`);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      assert.ok(fileContent.length > 200, `${file} must have meaningful content`);
    });

    const pagePath = path.resolve(__dirname, '../pages/LeaderboardPage.jsx');
    assert.ok(fs.existsSync(pagePath), 'LeaderboardPage.jsx must exist');
    const pageContent = fs.readFileSync(pagePath, 'utf-8');
    assert.ok(pageContent.includes('LeaderboardOverview'), 'LeaderboardPage must use LeaderboardOverview');
    assert.ok(pageContent.includes('LeaderboardFilters'), 'LeaderboardPage must use LeaderboardFilters');
    assert.ok(pageContent.includes('LeaderboardPodium'), 'LeaderboardPage must use LeaderboardPodium');
    assert.ok(pageContent.includes('LeaderboardChart'), 'LeaderboardPage must use LeaderboardChart');
    assert.ok(pageContent.includes('LeaderboardTable'), 'LeaderboardPage must use LeaderboardTable');
    assert.ok(pageContent.includes('MyRankCard'), 'LeaderboardPage must use MyRankCard');
  });

  it('LeaderboardPodium includes champion gold border and top 3 styling', () => {
    const podiumPath = path.resolve(__dirname, '../components/leaderboard/LeaderboardPodium.jsx');
    const content = fs.readFileSync(podiumPath, 'utf-8');

    assert.ok(content.includes('border-amber-400'), 'Rank 1 must have gold border styling');
    assert.ok(content.includes('Net WPM'), 'Podium card must display Net WPM');
    assert.ok(content.includes('Accuracy'), 'Podium card must display Accuracy');
    assert.ok(content.includes('Awaiting Contender'), 'Podium card must handle empty contender slots gracefully');
  });

  it('LeaderboardChart provides responsive SVG visualization', () => {
    const chartPath = path.resolve(__dirname, '../components/leaderboard/LeaderboardChart.jsx');
    const content = fs.readFileSync(chartPath, 'utf-8');

    assert.ok(content.includes('<svg'), 'LeaderboardChart must render SVG');
    assert.ok(content.includes('viewBox='), 'LeaderboardChart must have responsive viewBox');
    assert.ok(content.includes('getMetricValue'), 'LeaderboardChart must adapt to active ranking category');
  });

  it('LeaderboardTable displays all required columns and highlights current user', () => {
    const tablePath = path.resolve(__dirname, '../components/leaderboard/LeaderboardTable.jsx');
    const content = fs.readFileSync(tablePath, 'utf-8');

    assert.ok(content.includes('Net WPM'), 'Table must have Net WPM column');
    assert.ok(content.includes('Gross WPM'), 'Table must have Gross WPM column');
    assert.ok(content.includes('Accuracy'), 'Table must have Accuracy column');
    assert.ok(content.includes('Sessions'), 'Table must have Sessions column');
    assert.ok(content.includes('Best Test'), 'Table must have Best Test column');
    assert.ok(content.includes('Achieved'), 'Table must have Achieved column');
    assert.ok(content.includes('isCurrentUser'), 'Table must identify and highlight current logged in user');
  });

  it('MyRankCard provides authenticated standing and guest call to action', () => {
    const cardPath = path.resolve(__dirname, '../components/leaderboard/MyRankCard.jsx');
    const content = fs.readFileSync(cardPath, 'utf-8');

    assert.ok(content.includes('Join the Global Leaderboard'), 'Must display CTA for guests');
    assert.ok(content.includes('Your Current Standing'), 'Must display standing for authenticated ranked user');
    assert.ok(content.includes('You are not yet ranked'), 'Must guide authenticated unranked user to take a test');
  });
});

