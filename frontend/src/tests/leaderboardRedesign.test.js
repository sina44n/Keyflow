/**
 * KEYFLOW Leaderboard Precision Redesign Tests
 * ============================================
 * Tests verifying:
 * 1. Scope navigation: Global, Weekly, Competitions
 * 2. Duration filter: 15s, 30s, 60s, 120s
 * 3. Strict removal of Continent and Language selection controls
 * 4. Centered heading section and subtitle
 * 5. Competitive 3-player podium with Gold (center), Silver (left), and Pink (right)
 * 6. Full-size Top 10 Performance vertical bar chart with rounded tops and numerical labels
 * 7. Real tournament browser component for Competitions mode
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('KEYFLOW World-Class Leaderboard Precision Redesign Tests', () => {
  it('LeaderboardFilters supports Global, Weekly, and Competitions scopes', () => {
    const filtersPath = path.resolve(__dirname, '../components/leaderboard/LeaderboardFilters.jsx');
    const content = fs.readFileSync(filtersPath, 'utf-8');

    assert.ok(content.includes("'global'"), 'Must define global scope');
    assert.ok(content.includes("'weekly'"), 'Must define weekly scope');
    assert.ok(content.includes("'competitions'"), 'Must define competitions scope');
  });

  it('LeaderboardFilters supports 15s, 30s, 60s, 120s duration filters', () => {
    const filtersPath = path.resolve(__dirname, '../components/leaderboard/LeaderboardFilters.jsx');
    const content = fs.readFileSync(filtersPath, 'utf-8');

    assert.ok(content.includes("'15'"), 'Must support 15s duration');
    assert.ok(content.includes("'30'"), 'Must support 30s duration');
    assert.ok(content.includes("'60'"), 'Must support 60s duration');
    assert.ok(content.includes("'120'"), 'Must support 120s duration');
  });

  it('LeaderboardFilters strictly omits Continent and Language selection dropdowns', () => {
    const filtersPath = path.resolve(__dirname, '../components/leaderboard/LeaderboardFilters.jsx');
    const content = fs.readFileSync(filtersPath, 'utf-8');

    // Strict requirements from Phase 3:
    assert.ok(!content.includes('All Continents'), 'Must NOT include All Continents');
    assert.ok(!content.includes('Language Selection'), 'Must NOT include Language Selection dropdown');
  });

  it('LeaderboardPage features horizontally centered heading and subtitle', () => {
    const pagePath = path.resolve(__dirname, '../pages/LeaderboardPage.jsx');
    const content = fs.readFileSync(pagePath, 'utf-8');

    assert.ok(content.includes('text-center'), 'Header must be centered horizontally');
    assert.ok(content.includes('Leaderboard'), 'Page must contain Leaderboard title');
    assert.ok(content.includes('See how you rank against other typists'), 'Must contain exact subtitle');
  });

  it('LeaderboardPodium implements 3-player hierarchy with Gold (center), Silver (left), and Pink (right)', () => {
    const podiumPath = path.resolve(__dirname, '../components/leaderboard/LeaderboardPodium.jsx');
    const content = fs.readFileSync(podiumPath, 'utf-8');

    assert.ok(content.includes('Crown'), 'Podium must render Crown icon on Rank 1');
    assert.ok(content.includes('border-amber-400'), 'Rank 1 must have prominent gold border');
    assert.ok(content.includes('Net WPM'), 'Podium card must display Net WPM');
    assert.ok(content.includes('Accuracy'), 'Podium card must display Accuracy');
    assert.ok(content.includes('Awaiting Contender'), 'Podium card must handle empty contender slots gracefully');
    assert.ok(content.includes('Claim #'), 'Podium must invite users to claim empty slots');

    // Height specifications: Left = Right = 320px, Center = 356px (taller)
    assert.ok(content.includes('md:h-[320px]'), 'Left and Right cards must have fixed md:h-[320px]');
    assert.ok(content.includes('md:h-[356px]'), 'Center card must have taller md:h-[356px]');
    assert.ok(content.includes('md:-translate-y-4'), 'Center card must be elevated with md:-translate-y-4');

    // Color specifications: Permanent light tints with dark text
    assert.ok(content.includes('bg-[#FFFDF5]'), 'Center card must use soft warm gold background');
    assert.ok(content.includes('bg-[#F8FAFC]'), 'Left card must use soft silver background');
    assert.ok(content.includes('bg-[#FFF5F7]'), 'Right card must use soft pink background');
    assert.ok(content.includes('text-[#1E293B]'), 'Card text must use dark high-contrast color');
  });

  it('LeaderboardPage positions Global Rankings Table directly beneath Podium and removes formula explainer', () => {
    const pagePath = path.resolve(__dirname, '../pages/LeaderboardPage.jsx');
    const content = fs.readFileSync(pagePath, 'utf-8');

    // Formula banner removed from above/around podium
    assert.ok(!content.includes('getFormulaExplanation'), 'Formula explanation helper must be removed');
    assert.ok(!content.includes('Uncorrected mistakes deduct from gross speed'), 'Formula banner must be removed');

    // Table directly below Podium: LeaderboardPodium appears before LeaderboardTable, and LeaderboardTable before LeaderboardChart
    const podiumIndex = content.indexOf('<LeaderboardPodium');
    const tableIndex = content.indexOf('<LeaderboardTable');
    const chartIndex = content.indexOf('<LeaderboardChart');

    assert.ok(podiumIndex !== -1, 'Must contain LeaderboardPodium');
    assert.ok(tableIndex !== -1, 'Must contain LeaderboardTable');
    assert.ok(chartIndex !== -1, 'Must contain LeaderboardChart');
    assert.ok(podiumIndex < tableIndex, 'LeaderboardPodium must be rendered before LeaderboardTable');
    assert.ok(tableIndex < chartIndex, 'LeaderboardTable must be rendered directly after Podium and before LeaderboardChart');
  });

  it('LeaderboardChart implements full-size vertical bars and numerical labels', () => {
    const chartPath = path.resolve(__dirname, '../components/leaderboard/LeaderboardChart.jsx');
    const content = fs.readFileSync(chartPath, 'utf-8');

    assert.ok(content.includes('rx={8}'), 'Bars must have rounded top corners (rx=8)');
    assert.ok(content.includes('truncateUsername'), 'Chart must truncate long usernames');
    assert.ok(content.includes('Ranked Typist Telemetry'), 'Chart must show telemetry context');
    assert.ok(content.includes('var(--accent)'), 'Chart must use theme accent CSS variables');
  });

  it('LeaderboardPage integrates Competitions browser and exact duration state', () => {
    const pagePath = path.resolve(__dirname, '../pages/LeaderboardPage.jsx');
    const content = fs.readFileSync(pagePath, 'utf-8');

    assert.ok(content.includes('LeaderboardCompetitions'), 'LeaderboardPage must import LeaderboardCompetitions');
    assert.ok(content.includes("scope === 'competitions'"), 'Must render competitions browser in competitions mode');
    assert.ok(content.includes('duration'), 'Must pass duration state');
  });
});
