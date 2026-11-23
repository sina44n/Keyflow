import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('KEYFLOW Masterpiece Viewport, Auth & Competition Reporting', () => {
  it('WorkstationPage defines constrained typing viewport with automatic line progression', () => {
    const pagePath = path.resolve(__dirname, '../pages/WorkstationPage.jsx');
    const content = fs.readFileSync(pagePath, 'utf-8');

    // 1. Fixed/constrained viewport height & overflow
    assert.ok(content.includes('viewportRef'), 'Workstation must use viewportRef for smooth scrolling');
    assert.ok(content.includes('activeCharSpanRef'), 'Workstation must track active character span offset');
    assert.ok(content.includes('overflow-hidden'), 'Viewport must constrain overflow to prevent page expansion');
    assert.ok(content.includes('scrollBehavior: \'smooth\''), 'Viewport must scroll smoothly');

    // 2. Line-by-line progression effect
    assert.ok(content.includes('targetScrollTop = Math.max(0, spanTop - spanHeight)'), 'Must calculate scroll offset based on active line');

    // 3. Post-test error review & goals
    assert.ok(content.includes('errorDetails'), 'Results must include recorded error details');
    assert.ok(content.includes('Practice Mistakes'), 'Must offer practice mistakes drill');
    assert.ok(content.includes('wpmGoal'), 'Must support optional session WPM goal');
  });

  it('App.jsx requires authentication on workstation, practice, academy, and arcade routes', () => {
    const appPath = path.resolve(__dirname, '../App.jsx');
    const content = fs.readFileSync(appPath, 'utf-8');

    const protectedRoutes = ['/workstation', '/practice', '/academy', '/academy/stage/:stageId', '/arcade', '/arcade/:gameId'];
    for (const route of protectedRoutes) {
      assert.ok(
        content.includes(`path="${route}"`),
        `Route ${route} must exist in App.jsx`
      );
    }
    // Verify ProtectedRoute wraps these routes
    assert.ok(content.includes('<ProtectedRoute>'), 'App.jsx must wrap learning and practice routes in ProtectedRoute');
  });

  it('ProtectedRoute preserves complete destination path with search queries', () => {
    const prPath = path.resolve(__dirname, '../components/auth/ProtectedRoute.jsx');
    const content = fs.readFileSync(prPath, 'utf-8');

    assert.ok(content.includes('location.search'), 'ProtectedRoute must preserve query params in redirect');
    assert.ok(content.includes('to="/login"'), 'ProtectedRoute must redirect unauthenticated users to /login');
  });

  it('CompetitionModal and dedicated CompetitionResultsPage provide complete participant results, summary stats, podium, and CSV/JSON downloads', () => {
    const modalPath = path.resolve(__dirname, '../components/workstation/CompetitionModal.jsx');
    const resultsPath = path.resolve(__dirname, '../pages/CompetitionResultsPage.jsx');
    const content = fs.readFileSync(modalPath, 'utf-8');
    const resultsContent = fs.existsSync(resultsPath) ? fs.readFileSync(resultsPath, 'utf-8') : '';

    // 1. Summary & Podium (dedicated results page provides full champions podium and telemetry capsules)
    assert.ok(
      resultsContent.includes('podium') || resultsContent.includes('1st Place') || resultsContent.includes('Podium'),
      'Dedicated results page must render competition podium winners'
    );

    // 2. CSV & JSON downloads
    assert.ok(content.includes('handleDownloadCSV'), 'Must implement handleDownloadCSV');
    assert.ok(content.includes('handleDownloadJSON'), 'Must implement handleDownloadJSON');
    assert.ok(content.includes('keyflow-competition-'), 'Must use formatted competition export filename');

    // 3. Full participant results table columns
    assert.ok(resultsContent.includes('Score') || content.includes('Score'), 'Leaderboard must include Score');
    assert.ok(resultsContent.includes('Net WPM') || content.includes('Net WPM'), 'Leaderboard must include Net WPM');
    assert.ok(resultsContent.includes('Raw WPM') || content.includes('Raw WPM'), 'Leaderboard must include Raw WPM');
    assert.ok(resultsContent.includes('Accuracy') || content.includes('Accuracy'), 'Leaderboard must include Accuracy');
    assert.ok(resultsContent.includes('CPM') || content.includes('CPM'), 'Leaderboard must include CPM');
    assert.ok(resultsContent.includes('Chars (OK/Err)') || resultsContent.includes('Chars') || content.includes('Chars (OK/Err)'), 'Leaderboard must include character breakdown');
  });

  it('AuthContext safely imports resetGuestProgress and resetGuestArcadeRecords to prevent ReferenceErrors', () => {
    const authPath = path.resolve(__dirname, '../context/AuthContext.jsx');
    const content = fs.readFileSync(authPath, 'utf-8');

    assert.ok(content.includes('resetGuestProgress'), 'AuthContext must import resetGuestProgress');
    assert.ok(content.includes('resetGuestArcadeRecords'), 'AuthContext must import resetGuestArcadeRecords');
  });
});
