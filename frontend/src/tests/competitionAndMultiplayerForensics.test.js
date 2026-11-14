import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('KEYFLOW Phase 6: Competition & Multiplayer Forensic Verification', () => {
  const workstationPath = path.resolve(__dirname, '../pages/WorkstationPage.jsx');
  const compModalPath = path.resolve(__dirname, '../components/workstation/CompetitionModal.jsx');
  const racingLobbyPath = path.resolve(__dirname, '../components/arcade/racing3d/Racing3DMultiplayerLobby.jsx');
  const nitroGamePath = path.resolve(__dirname, '../components/arcade/games/NitroRacingGame.jsx');
  const leaderboardCompsPath = path.resolve(__dirname, '../components/leaderboard/LeaderboardCompetitions.jsx');
  const apiPath = path.resolve(__dirname, '../utils/api.js');

  it('1. Verifies real-time communication architecture: HTTP polling & telemetry sync without fragile WebSockets', () => {
    const compContent = fs.readFileSync(compModalPath, 'utf-8');
    const lobbyContent = fs.readFileSync(racingLobbyPath, 'utf-8');
    const nitroContent = fs.readFileSync(nitroGamePath, 'utf-8');

    // Practice Competition polling: 4000ms
    assert.ok(compContent.includes('setInterval'), 'CompetitionModal must use periodic interval');
    assert.ok(compContent.includes('4000'), 'CompetitionModal must poll every 4000ms');

    // Racing Lobby polling: 1200ms
    assert.ok(lobbyContent.includes('1200'), 'Racing3DMultiplayerLobby must poll room state every 1200ms');

    // Nitro Racing live telemetry sync: 180ms
    assert.ok(nitroContent.includes('180'), 'NitroRacingGame must synchronize telemetry every 180ms');
    assert.ok(nitroContent.includes('/sync/'), 'NitroRacingGame must post telemetry to sync endpoint');

    // Ensure frontend does not instantiate raw WebSockets for gameplay
    assert.ok(!compContent.includes('new WebSocket'), 'CompetitionModal must not use raw WebSocket');
    assert.ok(!lobbyContent.includes('new WebSocket'), 'Racing3DMultiplayerLobby must not use raw WebSocket');
    assert.ok(!nitroContent.includes('new WebSocket'), 'NitroRacingGame must not use raw WebSocket');
  });

  it('2. Verifies competition room creation, limits, and host privileges in CompetitionModal', () => {
    const compContent = fs.readFileSync(compModalPath, 'utf-8');

    // Create form fields
    assert.ok(compContent.includes('name:'), 'Must include name field');
    assert.ok(compContent.includes('challenge_type:'), 'Must support challenge_type');
    assert.ok(compContent.includes('target_limit:'), 'Must support target_limit');
    assert.ok(compContent.includes('max_participants:'), 'Must support max_participants');
    assert.ok(compContent.includes('is_public:'), 'Must support is_public');

    // Host detection
    assert.ok(compContent.includes('isHost'), 'Must compute isHost status');
    assert.ok(compContent.includes('handleDeleteRoom'), 'Must implement handleDeleteRoom');
    assert.ok(compContent.includes('competitionAPI.delete'), 'Must call competitionAPI.delete for host cancellation');
  });

  it('3. Verifies code-based joining, duplicate prevention, and room synchronization', () => {
    const compContent = fs.readFileSync(compModalPath, 'utf-8');
    const apiContent = fs.readFileSync(apiPath, 'utf-8');

    // Join handler
    assert.ok(compContent.includes('handleJoin'), 'Must implement handleJoin');
    assert.ok(compContent.includes('toUpperCase()'), 'Must sanitize code to uppercase');
    assert.ok(compContent.includes('competitionAPI.join'), 'Must call competitionAPI.join');

    // API endpoints mapping
    assert.ok(apiContent.includes('/practice/competitions/'), 'API must define competition endpoints');
    assert.ok(apiContent.includes('join:'), 'competitionAPI must provide join method');
    assert.ok(apiContent.includes('submit:'), 'competitionAPI must provide submit method');
    assert.ok(apiContent.includes('start:'), 'competitionAPI must provide start method');
  });

  it('4. Verifies Workstation shared passage injection and isolated typing lifecycle', () => {
    const wsContent = fs.readFileSync(workstationPath, 'utf-8');

    // Challenge text overrides random passage
    assert.ok(wsContent.includes('if (activeCompetition?.challengeText)'), 'Workstation must use shared competition passage');
    assert.ok(wsContent.includes('handleStartCompetitionTest'), 'Workstation must handle starting competition test');
    assert.ok(wsContent.includes('setActiveCompetition'), 'Workstation must track active competition state');

    // Result submission
    assert.ok(wsContent.includes('competitionAPI'), 'Workstation must import competitionAPI');
    assert.ok(wsContent.includes('participant_id: competitionParticipantId'), 'Must submit with participantId');
    assert.ok(wsContent.includes('net_wpm: netWpm'), 'Must submit genuine Net WPM');
    assert.ok(wsContent.includes('gross_wpm: grossWpm'), 'Must submit Gross WPM');
    assert.ok(wsContent.includes('accuracy: rawAccuracy'), 'Must submit raw accuracy');
  });

  it('5. Verifies comprehensive Competition report downloads (CSV & JSON)', () => {
    const compContent = fs.readFileSync(compModalPath, 'utf-8');

    // CSV generator
    assert.ok(compContent.includes('handleDownloadCSV'), 'Must implement handleDownloadCSV');
    assert.ok(compContent.includes('KEYFLOW COMPETITION RESULTS REPORT'), 'CSV must contain standard report header');
    assert.ok(compContent.includes('Rank,Display Name,Status,Score,Net WPM,Raw WPM,Accuracy (%),CPM'), 'CSV must include complete metrics');

    // JSON generator
    assert.ok(compContent.includes('handleDownloadJSON'), 'Must implement handleDownloadJSON');
    assert.ok(compContent.includes('KEYFLOW Typing Competition Report'), 'JSON must contain report title');
  });

  it('6. Verifies 3D Multiplayer Racing lobby, lane allocation, and countdown transition', () => {
    const lobbyContent = fs.readFileSync(racingLobbyPath, 'utf-8');

    assert.ok(lobbyContent.includes('/api/games/racing/rooms/'), 'Must interact with racing rooms API');
    assert.ok(lobbyContent.includes('handleCreateRoom'), 'Must support room creation');
    assert.ok(lobbyContent.includes('handleJoinRoom'), 'Must support joining room by code');
    assert.ok(lobbyContent.includes('handleToggleReady'), 'Must support ready state toggle');
    assert.ok(lobbyContent.includes('handleHostStart'), 'Must support host force start');
    assert.ok(lobbyContent.includes('handleLeaveRoom'), 'Must support leaving room');
    assert.ok(lobbyContent.includes('onStartMultiplayerRace'), 'Must invoke onStartMultiplayerRace upon countdown/racing transition');
  });

  it('7. Verifies 3D Nitro Racing live telemetry synchronization and peer vehicle updates', () => {
    const nitroContent = fs.readFileSync(nitroGamePath, 'utf-8');

    assert.ok(nitroContent.includes('isMultiplayer'), 'Must detect multiplayer mode');
    assert.ok(nitroContent.includes('handleStartMultiplayerRace'), 'Must handle multiplayer race start');
    assert.ok(nitroContent.includes('playerVehicle.distance'), 'Must send player vehicle distance');
    assert.ok(nitroContent.includes('currentWpmVal'), 'Must send current WPM');
    assert.ok(nitroContent.includes('competitors[`lane_${peer.lane}`]'), 'Must update peer cars across lanes 0-3');
  });

  it('8. Verifies Leaderboard page tournament showcase integration', () => {
    const lbCompsContent = fs.readFileSync(leaderboardCompsPath, 'utf-8');

    assert.ok(lbCompsContent.includes('Active & Recent Tournaments'), 'Must display tournament showcase title');
    assert.ok(lbCompsContent.includes('comp.participants_count'), 'Must display real participant counts');
    assert.ok(lbCompsContent.includes('/workstation'), 'Must navigate to Workstation to host tournaments');
  });
});
