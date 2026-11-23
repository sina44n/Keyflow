import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('KEYFLOW Master Upgrade: Workstation Competition System & Leaderboard', () => {
  const resultsPagePath = path.resolve(__dirname, '../pages/CompetitionResultsPage.jsx');
  const compModalPath = path.resolve(__dirname, '../components/workstation/CompetitionModal.jsx');
  const workstationPath = path.resolve(__dirname, '../pages/WorkstationPage.jsx');
  const dedicatedResultsPath = path.resolve(__dirname, '../components/workstation/DedicatedResultsScreen.jsx');
  const appPath = path.resolve(__dirname, '../App.jsx');
  const apiPath = path.resolve(__dirname, '../utils/api.js');

  it('1. Verifies CompetitionResultsPage implements Reference Image 4 design & layout', () => {
    assert.ok(fs.existsSync(resultsPagePath), 'CompetitionResultsPage.jsx must exist');
    const content = fs.readFileSync(resultsPagePath, 'utf-8');

    // Background watermark "Champions"
    assert.ok(
      content.includes('Champions'),
      'Must render background watermark "Champions"'
    );
    assert.ok(
      content.includes('text-[5rem] sm:text-[9rem] md:text-[13rem] lg:text-[16rem]'),
      'Watermark must be massive responsive text'
    );

    // Top 3 Winner Podium Cards matching Reference Image 2:
    // 1st Place (LEFT, Gold/Lime theme)
    // 2nd Place (MIDDLE, Silver/Cyan theme)
    // 3rd Place (RIGHT, Bronze/Orange theme)
    assert.ok(
      content.includes('1st Place') || content.includes('1<sup>st</sup>'),
      '1st Place must feature Gold/Lime theme with 1st rank indicator'
    );
    assert.ok(
      content.includes('2nd Place') || content.includes('2<sup>nd</sup>'),
      '2nd Place must feature Silver/Cyan theme with 2nd rank indicator'
    );
    assert.ok(
      content.includes('3rd Place') || content.includes('3<sup>rd</sup>'),
      '3rd Place must feature Bronze/Orange theme with 3rd rank indicator'
    );

    // Crown, medal, and award badges
    assert.ok(content.includes('Crown'), '1st place must feature Crown component');
    assert.ok(content.includes('Champion'), '1st place must designate Champion status');

    // 4 Dynamic Competition Statistic Cards directly below Top 3
    assert.ok(content.includes('Total Typists'), 'Card 1: Must display Total Typists');
    assert.ok(content.includes('Avg Velocity'), 'Card 2: Must display Avg Velocity (WPM)');
    assert.ok(content.includes('Avg Accuracy'), 'Card 3: Must display Avg Accuracy');
    assert.ok(content.includes('Top Score'), 'Card 4: Must display Top Score');

    // Complete Participant Leaderboard Table with EVERY valid participant
    assert.ok(content.includes('Complete Participant Standings'), 'Must render complete standings table');
    assert.ok(content.includes('Net WPM'), 'Table must include Net WPM');
    assert.ok(content.includes('Raw WPM'), 'Table must include Raw WPM');
    assert.ok(content.includes('Accuracy'), 'Table must include Accuracy');
    assert.ok(content.includes('CPM'), 'Table must include CPM');
    assert.ok(content.includes('Chars (OK/Err)'), 'Table must include Chars breakdown');
    assert.ok(content.includes('Duration'), 'Table must include Duration');

    // Export capabilities
    assert.ok(content.includes('handleExportCSV'), 'Must support CSV export');
    assert.ok(content.includes('handleExportJSON'), 'Must support JSON export');

    // Real-time polling for in-progress competitions
    assert.ok(content.includes('setInterval'), 'Must poll active competition status');
  });

  it('2. Verifies Lobby Management actions (Edit, Delete, Join) and Host Authorization', () => {
    const content = fs.readFileSync(compModalPath, 'utf-8');

    // Action icons in lobby cards
    assert.ok(content.includes('Pencil'), 'Must import and use Pencil icon for edit action');
    assert.ok(content.includes('Trash2'), 'Must use Trash2 icon for delete action');
    assert.ok(content.includes('handleOpenEdit'), 'Must implement handleOpenEdit');
    assert.ok(content.includes('handleSaveEdit'), 'Must implement handleSaveEdit');
    assert.ok(content.includes('handleConfirmDelete'), 'Must implement handleConfirmDelete');

    // Host check logic
    assert.ok(content.includes('canManageRoom'), 'Must implement canManageRoom authorization check');
    assert.ok(
      content.includes('Only the room host can edit this room'),
      'Non-host users must have disabled controls with informative tooltip'
    );
    assert.ok(
      content.includes('Only the room host can delete this room'),
      'Non-host users must have disabled delete with informative tooltip'
    );

    // Edit pre-validation: only waiting rooms can be edited
    assert.ok(
      content.includes("comp.status !== 'waiting'"),
      'Must prevent editing rooms that are in progress or completed'
    );

    // Delete confirmation prompt
    assert.ok(
      content.includes('Are you sure you want to delete this competition room?'),
      'Must prompt user with confirmation modal before room deletion'
    );
  });

  it('3. Verifies Optional Competition Timer in Create and Edit Room flows', () => {
    const content = fs.readFileSync(compModalPath, 'utf-8');

    // Toggle and preset durations
    assert.ok(content.includes('Competition Time Limit'), 'Must include Competition Time Limit section');
    assert.ok(content.includes('enable_time_limit'), 'Must manage enable_time_limit state');
    assert.ok(content.includes('time_limit_seconds'), 'Must manage time_limit_seconds state');

    // Preset options: 15s, 30s, 60s, 120s, 300s
    [15, 30, 60, 120, 300].forEach((dur) => {
      assert.ok(content.includes(String(dur)), `Must include ${dur}s duration preset`);
    });

    // Helper text for both text-completion mode and timed mode
    assert.ok(
      content.includes('Text-Completion Mode'),
      'Must describe text-completion mode when timer is disabled'
    );
    assert.ok(
      content.includes('Timed Race'),
      'Must describe timed race mode when timer is enabled'
    );
  });

  it('4. Verifies Automatic Navigation to Dedicated Results Page on Completion', () => {
    const workstationContent = fs.readFileSync(workstationPath, 'utf-8');

    // Must automatically submit and navigate to /competitions/:code/results
    assert.ok(
      workstationContent.includes("navigate(`/competitions/${compCode}/results`)") ||
      workstationContent.includes("navigate('/competitions/' + compCode + '/results')"),
      'Workstation must automatically navigate to /competitions/:code/results on test completion'
    );

    // Mode setup for competition test
    assert.ok(
      workstationContent.includes('isTimed'),
      'handleStartCompetitionTest must branch on timed mode'
    );
    assert.ok(
      workstationContent.includes("setMode('timed')"),
      'handleStartCompetitionTest must set timed mode when timer is active'
    );
    assert.ok(
      workstationContent.includes("setMode('words')"),
      'handleStartCompetitionTest must set words mode for text-completion'
    );
  });

  it('5. Verifies Route Registration in App.jsx and API Client PATCH support', () => {
    const appContent = fs.readFileSync(appPath, 'utf-8');
    const apiContent = fs.readFileSync(apiPath, 'utf-8');

    // Routes registered
    assert.ok(
      appContent.includes('/competitions/:code/results'),
      'App.jsx must register /competitions/:code/results'
    );
    assert.ok(
      appContent.includes('/competition/:code/results'),
      'App.jsx must register /competition/:code/results alias'
    );
    assert.ok(
      appContent.includes('CompetitionResultsPage'),
      'App.jsx must lazy load and render CompetitionResultsPage'
    );

    // API Client update method
    assert.ok(
      apiContent.includes("update: (code, data) => api.patch('/practice/competitions/' + code + '/', data)") ||
      apiContent.includes("update: (code, data) => api.patch(`/practice/competitions/${code}/`, data)"),
      'api.js must provide update method for PATCH /practice/competitions/:code/'
    );
  });

  it('6. Verifies DedicatedResultsScreen provides direct link to Room Standings', () => {
    const content = fs.readFileSync(dedicatedResultsPath, 'utf-8');
    assert.ok(
      content.includes('/results'),
      'DedicatedResultsScreen must link to /competitions/:code/results'
    );
  });

  it('7. Verifies Simplified Room Created View eliminates clutter from CompetitionModal', () => {
    const content = fs.readFileSync(compModalPath, 'utf-8');
    const activeBlockMatch = content.match(/activeTab === 'active' && currentComp && \([\s\S]*?\n          \)/);
    assert.ok(activeBlockMatch, 'Must render activeTab === active block');
    const activeBlock = activeBlockMatch[0];

    // Preserved Room Information & Actions
    assert.ok(activeBlock.includes('currentComp.name'), 'Must display room name');
    assert.ok(activeBlock.includes('currentComp.code'), 'Must display room code');
    assert.ok(activeBlock.includes('handleCopyCode'), 'Must provide copy button for room code');
    assert.ok(activeBlock.includes('currentComp.status'), 'Must display room status badge');
    assert.ok(activeBlock.includes('handleOpenEdit'), 'Must provide Edit Room button for host');
    assert.ok(activeBlock.includes('handleDeleteRoom'), 'Must provide Delete Room button for host');
    assert.ok(activeBlock.includes('handleStartTyping'), 'Must provide Start Test button');

    // Clutter must be completely eliminated from the modal view
    assert.ok(!activeBlock.includes('Lobby Avg Speed'), 'Lobby statistics cards must be removed from modal view');
    assert.ok(!activeBlock.includes('Podium Winners'), 'Podium winners section must be removed from modal view');
    assert.ok(!activeBlock.includes('Shared Challenge Text'), 'Shared challenge passage box must be removed from modal view');
    assert.ok(!activeBlock.includes('Complete Results for Every Participant'), 'Complete participant table must be removed from modal view');
    assert.ok(!activeBlock.includes('handleDownloadCSV'), 'CSV download button must be removed from modal view');
    assert.ok(!activeBlock.includes('handleDownloadJSON'), 'JSON download button must be removed from modal view');
  });

  it('8. Verifies DedicatedResultsScreen is suppressed for active competitions to eliminate flash', () => {
    const workstationContent = fs.readFileSync(workstationPath, 'utf-8');

    // DedicatedResultsScreen must only render when !activeCompetition
    assert.ok(
      workstationContent.includes('isCompleted && sessionResults && !activeCompetition'),
      'DedicatedResultsScreen must strictly require !activeCompetition to prevent results screen flash'
    );

    // Clean competition transition state when activeCompetition is completed
    assert.ok(
      workstationContent.includes('Tallying competition results...'),
      'Must render competition transition indicator during tallying and navigation'
    );
    assert.ok(
      workstationContent.includes('Navigating directly to Champions Leaderboard'),
      'Must explain direct navigation to Champions Leaderboard'
    );
  });
});
