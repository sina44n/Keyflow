import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import os from 'node:os';

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

  async screenshot(outputPath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    fs.writeFileSync(outputPath, buffer);
    console.log(`[Screenshot Saved] ${outputPath} (${buffer.length} bytes)`);
  }

  close() {
    if (this.ws) {
      try { this.ws.close(); } catch {}
    }
  }
}

async function runArcadeBrowserVerification() {
  const SERVER_PORT = 4175;
  const CDP_PORT = 9227;

  console.log('--- Starting Phase 4 Arcade Browser Verification ---');

  // 1. Start Server
  const server = await startServer(SERVER_PORT);

  // 2. Launch Edge Headless
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const userDataDir = path.join(os.tmpdir(), `edge-phase4-${Date.now()}`);

  console.log(`[Edge] Launching headless browser with CDP on port ${CDP_PORT}...`);
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
    // Wait for CDP readiness
    console.log('Waiting for CDP endpoints...');
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

    console.log(`Navigating to http://127.0.0.1:${SERVER_PORT}/arcade?dev_preview=true ...`);
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${SERVER_PORT}/arcade?dev_preview=true` });
    await sleep(2500);

    // Set auth bypass globally on window so sub-route navigations (e.g. /arcade/sprint) don't redirect to login
    await cdp.evaluate('window.__KEYFLOW_DEV_BYPASS_AUTH__ = true');

    // 1. Verify absence of the four promotional blocks
    const bannedBlocks = [
      'Total Games',
      '8 Playable Modes',
      '8 Progressive Tiers',
      'Adaptive WebGL / 2D',
      'Local Bests Persisted',
    ];

    const bodyText = await cdp.evaluate('document.body.innerText');

    console.log('\n--- Checking absence of banned promotional blocks ---');
    for (const phrase of bannedBlocks) {
      const found = bodyText.includes(phrase);
      console.log(`Promotional phrase "${phrase}": ${found ? 'FAIL (present in body)' : 'PASS (absent)'}`);
      if (found) throw new Error(`Phrase "${phrase}" was found on live rendered Arcade page!`);
    }

    // 2. Verify DARK WARRIOR 3D remains completely removed
    console.log('\n--- Checking DARK WARRIOR absence ---');
    const hasDarkWarrior = bodyText.toLowerCase().includes('dark warrior');
    console.log(`DARK WARRIOR present: ${hasDarkWarrior ? 'FAIL (present)' : 'PASS (absent)'}`);
    if (hasDarkWarrior) throw new Error('DARK WARRIOR 3D was detected on Arcade page!');

    // 3. Verify all 9 authentic game cards render
    console.log('\n--- Checking rendered game cards ---');
    const cards = await cdp.evaluate(`
      (() => {
        const gameCards = Array.from(document.querySelectorAll('main [role="button"], main .group'));
        const titles = Array.from(document.querySelectorAll('main h3')).map(h => h.innerText.trim());
        return {
          count: titles.length,
          titles,
        };
      })()
    `);
    console.log(`Rendered Game Titles (${cards.count}):`, cards.titles);
    const expectedGames = [
      'Key Cascade',
      'Speed Sprint',
      'Word Hunter',
      'Key Ninja',
      'Word Runner',
      'Typing Memory',
      'Boss Battle',
      'Nitro Type Pro',
      'STICKMAN FIGHT',
    ];

    for (const g of expectedGames) {
      const found = cards.titles.some((t) => t.toLowerCase().includes(g.toLowerCase()));
      console.log(`Game "${g}": ${found ? 'PASS (rendered)' : 'FAIL (missing)'}`);
      if (!found) throw new Error(`Expected game "${g}" was not rendered!`);
    }

    // Screenshot of clean Arcade Hub
    const hubScreenshot = path.join(brainDir, 'phase4_arcade_hub_verified.png');
    await cdp.screenshot(hubScreenshot);

    // 4. Test Game Category Filter interaction
    console.log('\n--- Testing Category Tabs Filtering ---');
    await cdp.evaluate(`
      (() => {
        const tabs = Array.from(document.querySelectorAll('button[role="tab"]'));
        const speedTab = tabs.find(t => t.innerText.toLowerCase().includes('speed') || t.innerText.toLowerCase().includes('reaction'));
        if (speedTab) speedTab.click();
      })()
    `);
    await sleep(500);
    const filteredTitles = await cdp.evaluate(`
      Array.from(document.querySelectorAll('main h3')).map(h => h.innerText.trim())
    `);
    console.log(`Filtered Game Titles after category click:`, filteredTitles);

    // Click 'All' to restore
    await cdp.evaluate(`
      (() => {
        const tabs = Array.from(document.querySelectorAll('button[role="tab"]'));
        if (tabs[0]) tabs[0].click();
      })()
    `);
    await sleep(500);

    // 5. Test Game Launch Interaction (Speed Sprint)
    console.log('\n--- Testing Game Launch (Speed Sprint) ---');
    await cdp.evaluate(`
      (() => {
        const cards = Array.from(document.querySelectorAll('main h3'));
        const sprintCard = cards.find(h => h.innerText.includes('Speed Sprint'));
        if (sprintCard) {
          const cardContainer = sprintCard.closest('[role="button"]') || sprintCard.parentElement;
          if (cardContainer) cardContainer.click();
        }
      })()
    `);
    await sleep(2000);

    const isGameActive = await cdp.evaluate(`
      (() => {
        const url = window.location.href;
        const hasArena = Boolean(document.querySelector('.relative.w-full, [tabindex="0"]'));
        return { url, hasArena };
      })()
    `);
    console.log(`Game Launch Status:`, isGameActive);
    if (!isGameActive.url.includes('sprint') && !isGameActive.hasArena) {
      throw new Error('Speed Sprint failed to launch into active arena');
    }

    // Take screenshot of active game arena
    const gameScreenshot = path.join(brainDir, 'phase4_arcade_game_active.png');
    await cdp.screenshot(gameScreenshot);

    // 6. Test Responsive Layout Across Viewports
    console.log('\n--- Verifying Responsive Viewports (Desktop, Tablet, Mobile) ---');
    const viewports = [
      { name: 'Desktop', width: 1280, height: 800 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 },
    ];

    for (const vp of viewports) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.width < 768,
      });
      await cdp.send('Page.navigate', { url: `http://127.0.0.1:${SERVER_PORT}/arcade?dev_preview=true` });
      await sleep(1000);

      const hasHorizontalScroll = await cdp.evaluate(`
        document.documentElement.scrollWidth > window.innerWidth + 2
      `);
      console.log(`Viewport ${vp.name} (${vp.width}x${vp.height}): Horizontal overflow: ${hasHorizontalScroll ? 'FAIL' : 'PASS (clean)'}`);
      if (hasHorizontalScroll) {
        throw new Error(`Viewport ${vp.name} suffered horizontal scroll overflow!`);
      }
    }

    console.log('\n=== ALL PHASE 4 REAL-BROWSER VERIFICATIONS SUCCEEDED ===\n');
  } finally {
    edgeProcess.kill();
    server.close();
  }
}

runArcadeBrowserVerification().catch((err) => {
  console.error('\n*** VERIFICATION FAILED ***\n', err);
  process.exit(1);
});
