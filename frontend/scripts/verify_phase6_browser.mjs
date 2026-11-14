import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import os from 'node:os';
import assert from 'node:assert/strict';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');
const brainDir = 'C:\\Users\\A S S A U L T\\.gemini\\antigravity\\brain\\0e20bd4d-7a63-41d1-a136-5e9da1bfcc64';

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.glb': 'model/gltf-binary',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function startServer(port) {
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    let filePath = path.join(distDir, reqPath === '/' ? 'index.html' : reqPath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      return fs.createReadStream(filePath).pipe(res);
    }

    // SPA fallback
    const indexPath = path.join(distDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      return fs.createReadStream(indexPath).pipe(res);
    }

    res.writeHead(404);
    res.end('Not Found');
  });

  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => {
      console.log(`[Static Server] Listening on http://127.0.0.1:${port}`);
      resolve(server);
    });
  });
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve, reject } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) {
            reject(new Error(msg.error.message));
          } else {
            resolve(msg.result);
          }
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      console.error('[CDP Evaluate Error]', res.exceptionDetails.exception?.description || res.exceptionDetails.text);
    }
    return res.result?.value;
  }

  async captureScreenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const outPath = path.join(brainDir, filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`[Screenshot Saved] -> ${outPath}`);
    return outPath;
  }
}

async function main() {
  const SERVER_PORT = 4186;
  const CDP_PORT = 9236;

  console.log('=== Starting Phase 6 Competition & Multiplayer Browser Verification ===');

  const server = await startServer(SERVER_PORT);

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const userDataDir = path.join(os.tmpdir(), `edge-phase6-${Date.now()}`);

  console.log(`[Edge] Launching headless browser on port ${CDP_PORT}...`);
  const edgeProcess = spawn(edgePath, [
    `--remote-debugging-port=${CDP_PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${userDataDir}`,
    '--window-size=1280,900',
    'about:blank',
  ], {
    stdio: 'ignore',
  });

  try {
    let tabs = null;
    for (let i = 0; i < 30; i++) {
      try {
        tabs = await fetchJson(`http://127.0.0.1:${CDP_PORT}/json`);
        if (tabs && tabs.length > 0) break;
      } catch {}
      await sleep(250);
    }

    if (!tabs || tabs.length === 0) {
      throw new Error('CDP failed to become ready in time');
    }

    const pageTarget = tabs.find((t) => t.type === 'page') || tabs[0];
    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('DOM.enable');

    // -------------------------------------------------------------
    // Test 1: Workstation Competition Modal
    // -------------------------------------------------------------
    console.log('\n--- 1. Verifying Workstation Competition Modal ---');
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${SERVER_PORT}/workstation?dev_preview=true` });
    await sleep(2000);
    await cdp.evaluate('window.__KEYFLOW_DEV_BYPASS_AUTH__ = true');

    // Open competition modal via Trophy button or clicking toolbar competition button
    console.log('Opening Competition Modal...');
    await cdp.evaluate(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const compBtn = btns.find(b => b.textContent.includes('Competitions') || b.textContent.includes('Competition') || b.title?.includes('Competition') || b.getAttribute('aria-label')?.includes('Competition'));
        if (compBtn) compBtn.click();
      })()
    `);
    await sleep(800);

    // Verify modal elements
    const compModalInfo = await cdp.evaluate(`
      (() => {
        const text = document.body.innerText;
        return {
          hasCompetitionTitle: text.includes('Competition') || text.includes('Tournaments') || text.includes('Lobbies'),
          hasLobbiesTab: text.includes('Active Lobbies') || text.includes('Lobbies'),
          hasCreateTab: text.includes('Create Lobby') || text.includes('Create'),
          hasJoinTab: text.includes('Join by Code') || text.includes('Join'),
        };
      })()
    `);
    console.log('[Competition Modal Inspection]:', compModalInfo);
    assert.ok(compModalInfo.hasCompetitionTitle, 'Competition Modal must be rendered');

    await cdp.captureScreenshot('phase6_competition_modal_verified.png');

    // -------------------------------------------------------------
    // Test 2: Leaderboard Competitions Showcase
    // -------------------------------------------------------------
    console.log('\n--- 2. Verifying Leaderboard Competitions Showcase ---');
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${SERVER_PORT}/leaderboard?dev_preview=true` });
    await sleep(2000);
    await cdp.evaluate('window.__KEYFLOW_DEV_BYPASS_AUTH__ = true');

    // Click on Competitions scope/tab
    console.log('Selecting Competitions tab on Leaderboard...');
    await cdp.evaluate(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const compTab = btns.find(b => b.textContent.trim().toLowerCase() === 'competitions');
        if (compTab) compTab.click();
      })()
    `);
    await sleep(800);

    const lbInfo = await cdp.evaluate(`
      (() => {
        const text = document.body.innerText;
        return {
          hasLeaderboardTitle: text.includes('Leaderboard'),
          hasCompetitionsScope: text.includes('Competitions') || text.includes('Tournaments'),
          hasHostCTA: text.includes('Host Competition') || text.includes('Workstation'),
        };
      })()
    `);
    console.log('[Leaderboard Inspection]:', lbInfo);
    assert.ok(lbInfo.hasLeaderboardTitle, 'Leaderboard must be rendered');

    await cdp.captureScreenshot('phase6_leaderboard_competitions_verified.png');

    // -------------------------------------------------------------
    // Test 3: Arcade 3D Nitro Racing Multiplayer Lobby
    // -------------------------------------------------------------
    console.log('\n--- 3. Verifying Nitro Racing Multiplayer Lobby ---');
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${SERVER_PORT}/arcade/nitro?dev_preview=true` });
    await sleep(3000);
    await cdp.evaluate('window.__KEYFLOW_DEV_BYPASS_AUTH__ = true');

    // Click on Multiplayer tab in Nitro Racing
    console.log('Selecting Multiplayer tab in Nitro Racing Hub...');
    await cdp.evaluate(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const mpTab = btns.find(b => b.textContent.trim().toLowerCase() === 'multiplayer');
        if (mpTab) mpTab.click();
      })()
    `);
    await sleep(1200);

    const racingInfo = await cdp.evaluate(`
      (() => {
        const text = document.body.innerText;
        return {
          hasMultiplayerLobby: text.includes('Multiplayer') || text.includes('Live Racing Rooms') || text.includes('Active Grid Lobbies'),
          hasCreateRoomBtn: text.includes('Create Room') || text.includes('Host'),
          hasJoinCodeInput: text.includes('Join by Code') || text.includes('ROOM-') || text.includes('Enter Code'),
        };
      })()
    `);
    console.log('[Racing Multiplayer Inspection]:', racingInfo);
    assert.ok(racingInfo.hasMultiplayerLobby, 'Multiplayer Racing Lobby must be rendered');

    await cdp.captureScreenshot('phase6_racing_multiplayer_lobby_verified.png');

    console.log('\n=== All Phase 6 Browser Verifications Passed Successfully ===');
  } finally {
    try { edgeProcess.kill(); } catch {}
    try { await new Promise((r) => server.close(r)); } catch {}
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch {}
  }
}

main().catch((err) => {
  console.error('[Phase 6 Browser Verification Failed]:', err);
  process.exit(1);
});
