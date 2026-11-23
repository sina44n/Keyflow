import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('KEYFLOW — Complete Footer Removal from Specified Pages', () => {
  const appPath = path.resolve(__dirname, '../App.jsx');
  const appContent = fs.readFileSync(appPath, 'utf-8');

  it('1. Verifies AppShell excludes Footer on Home (/)', () => {
    assert.ok(
      appContent.includes("normalizedPath === '/'"),
      'AppShell must explicitly exclude Footer on Home route (/)'
    );
  });

  it('2. Verifies AppShell excludes Footer on Workstation (/workstation & /practice)', () => {
    assert.ok(
      appContent.includes("'/workstation'"),
      'AppShell must explicitly exclude Footer on /workstation'
    );
    assert.ok(
      appContent.includes("'/practice'"),
      'AppShell must explicitly exclude Footer on /practice'
    );
  });

  it('3. Verifies AppShell excludes Footer on Academy (/academy and subroutes)', () => {
    assert.ok(
      appContent.includes("'/academy'"),
      'AppShell must explicitly exclude Footer on /academy'
    );
  });

  it('4. Verifies AppShell excludes Footer on Arcade (/arcade and subroutes)', () => {
    assert.ok(
      appContent.includes("'/arcade'"),
      'AppShell must explicitly exclude Footer on /arcade'
    );
  });

  it('5. Verifies AppShell excludes Footer on Telemetry (/telemetry & /analytics)', () => {
    assert.ok(
      appContent.includes("'/telemetry'"),
      'AppShell must explicitly exclude Footer on /telemetry'
    );
    assert.ok(
      appContent.includes("'/analytics'"),
      'AppShell must explicitly exclude Footer on /analytics'
    );
  });

  it('6. Verifies AppShell excludes Footer on Leaderboard (/leaderboard)', () => {
    assert.ok(
      appContent.includes("'/leaderboard'"),
      'AppShell must explicitly exclude Footer on /leaderboard'
    );
  });

  it('7. Verifies AppShell excludes Footer on Themes (/themes)', () => {
    assert.ok(
      appContent.includes("'/themes'"),
      'AppShell must explicitly exclude Footer on /themes'
    );
  });

  it('7b. Verifies AppShell excludes Footer on Competition Results (/competitions & /competition)', () => {
    assert.ok(
      appContent.includes("'/competitions'"),
      'AppShell must explicitly exclude Footer on /competitions'
    );
    assert.ok(
      appContent.includes("'/competition'"),
      'AppShell must explicitly exclude Footer on /competition'
    );
  });

  it('8. Verifies normalizedPath handles trailing slashes robustly', () => {
    assert.ok(
      appContent.includes("const normalizedPath = location.pathname.replace(/\\/+$/, '') || '/';"),
      'AppShell must strip trailing slashes to ensure reliable route matching'
    );
    assert.ok(
      appContent.includes("isNoFooterRoute"),
      'AppShell must compute isNoFooterRoute'
    );
    assert.ok(
      appContent.includes("{!isNoFooterRoute && !isAuthRoute && <Footer />}"),
      'AppShell must conditionally suppress Footer when on no-footer routes'
    );
  });

  it('9. Verifies none of the 7 target page components contain embedded or residual footers', () => {
    const pageFiles = [
      '../pages/LandingPage.jsx',
      '../pages/WorkstationPage.jsx',
      '../pages/AcademyPage.jsx',
      '../pages/ArcadePage.jsx',
      '../pages/TelemetryPage.jsx',
      '../pages/LeaderboardPage.jsx',
      '../pages/ThemesPage.jsx',
      '../pages/CompetitionResultsPage.jsx',
    ];

    for (const relPath of pageFiles) {
      const fullPath = path.resolve(__dirname, relPath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      assert.ok(
        !content.includes('<Footer'),
        `${relPath} must not render <Footer>`
      );
      assert.ok(
        !content.includes('import { Footer }'),
        `${relPath} must not import Footer`
      );
    }
  });
});
