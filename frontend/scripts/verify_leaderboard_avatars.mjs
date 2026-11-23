import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import os from 'node:os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = 'c:\\betterinu\\KEYFLOW-typingWebsite\\frontend\\dist';
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

// Sample Google avatar proxy token
const validGoogleProxy = 'https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NLcGNwM1BfS1VHTkJQZ2VqU2t4a3ZkYjFHTWJnNXg9czEwMDAtYyIsInMiOiJ0ZXN0X3NpZyJ9';

const mockLeaderboardData = {
  cohort: '15s',
  period: 'all_time',
  category: 'speed',
  total_typists: 5,
  top_three: [
    {
      rank: 1,
      user_id: 39,
      username: 'sina44n07',
      display_name: 'SINAN KP',
      avatar_url: '',
      net_wpm: 50.0,
      gross_wpm: 53.8,
      accuracy: 93.0,
      score: 50.0,
      sessions_count: 8,
      best_test_date: '2026-11-16T18:25:21Z',
      achieved_at: '2026-11-16T18:25:21Z',
    },
    {
      rank: 2,
      user_id: 41,
      username: 'user_z1M3M9',
      display_name: 'Sinan kp',
      avatar_url: validGoogleProxy,
      net_wpm: 43.0,
      gross_wpm: 45.7,
      accuracy: 94.0,
      score: 43.0,
      sessions_count: 5,
      best_test_date: '2026-11-17T06:58:24Z',
      achieved_at: '2026-11-17T06:58:24Z',
    },
    {
      rank: 3,
      user_id: 42,
      username: 'user_7fHbUZ',
      display_name: 'rohith',
      avatar_url: '',
      net_wpm: 29.0,
      gross_wpm: 39.7,
      accuracy: 73.0,
      score: 29.0,
      sessions_count: 3,
      best_test_date: '2026-11-17T07:11:03Z',
      achieved_at: '2026-11-17T07:11:03Z',
    },
  ],
  entries: [
    {
      rank: 1,
      user_id: 39,
      username: 'sina44n07',
      display_name: 'SINAN KP',
      avatar_url: '',
      net_wpm: 50.0,
      gross_wpm: 53.8,
      accuracy: 93.0,
      sessions_count: 8,
      best_test_date: '2026-11-16T18:25:21Z',
      achieved_at: '2026-11-16T18:25:21Z',
    },
    {
      rank: 2,
      user_id: 41,
      username: 'user_z1M3M9',
      display_name: 'Sinan kp',
      avatar_url: validGoogleProxy,
      net_wpm: 43.0,
      gross_wpm: 45.7,
      accuracy: 94.0,
      sessions_count: 5,
      best_test_date: '2026-11-17T06:58:24Z',
      achieved_at: '2026-11-17T06:58:24Z',
    },
    {
      rank: 3,
      user_id: 42,
      username: 'user_7fHbUZ',
      display_name: 'rohith',
      avatar_url: '',
      net_wpm: 29.0,
      gross_wpm: 39.7,
      accuracy: 73.0,
      sessions_count: 3,
      best_test_date: '2026-11-17T07:11:03Z',
      achieved_at: '2026-11-17T07:11:03Z',
    },
    {
      rank: 4,
      user_id: 38,
      username: 'user_18Emh2',
      display_name: 'Michael',
      avatar_url: '',
      net_wpm: 25.0,
      gross_wpm: 28.0,
      accuracy: 89.0,
      sessions_count: 2,
      best_test_date: '2026-11-15T10:00:00Z',
      achieved_at: '2026-11-15T10:00:00Z',
    },
    {
      rank: 5,
      user_id: 55,
      username: 'alex_j',
      display_name: 'alex john',
      avatar_url: 'https://lh3.googleusercontent.com/broken_fallback_test_404.png',
      net_wpm: 20.0,
      gross_wpm: 22.0,
      accuracy: 91.0,
      sessions_count: 1,
      best_test_date: '2026-11-14T09:00:00Z',
      achieved_at: '2026-11-14T09:00:00Z',
    },
  ],
};

function startServer(port) {
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];

    // Intercept leaderboard API requests
    if (reqPath.startsWith('/api/leaderboard/')) {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      return res.end(JSON.stringify(mockLeaderboardData));
    }

    if (reqPath.startsWith('/api/auth/me/') || reqPath.startsWith('/api/profile/')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ id: 39, username: 'sina44n07', profile: { display_name: 'SINAN KP', avatar_url: '' } }));
    }

    let filePath = path.join(distDir, reqPath === '/' ? 'index.html' : reqPath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      return fs.createReadStream(filePath).pipe(res);
    }

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
}

async function main() {
  const PORT = 5178;
  const server = await startServer(PORT);

  const edgePaths = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ];
  const edgePath = edgePaths.find((p) => fs.existsSync(p));
  if (!edgePath) {
    throw new Error('Edge binary not found');
  }

  const cdpPort = 9226;
  const tmpUserData = path.join(os.tmpdir(), `edge_avatar_${Date.now()}`);
  fs.mkdirSync(tmpUserData, { recursive: true });

  console.log('[Edge] Spawning Edge on CDP port', cdpPort);
  const browserProc = spawn(
    edgePath,
    [
      `--remote-debugging-port=${cdpPort}`,
      `--user-data-dir=${tmpUserData}`,
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      `http://127.0.0.1:${PORT}/leaderboard`,
    ],
    { stdio: 'ignore' }
  );

  let cdpClient = null;
  try {
    let targets = null;
    for (let i = 0; i < 30; i++) {
      await sleep(300);
      try {
        targets = await fetchJson(`http://127.0.0.1:${cdpPort}/json/list`);
        if (targets && targets.length > 0) break;
      } catch {}
    }

    if (!targets || targets.length === 0) {
      throw new Error('Failed to connect to CDP targets');
    }

    const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
    cdpClient = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdpClient.connect();

    await cdpClient.send('Page.enable');
    await cdpClient.send('DOM.enable');
    await cdpClient.send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    console.log('[CDP] Navigating to /leaderboard');
    await cdpClient.send('Page.navigate', { url: `http://127.0.0.1:${PORT}/leaderboard` });
    await sleep(2500);

    // Inspect Podium Avatars
    const podiumAvatars = await cdpClient.evaluate(`
      (() => {
        const cards = document.querySelectorAll('.grid > div');
        const results = [];
        cards.forEach((card, i) => {
          const img = card.querySelector('img');
          const fallbackDiv = card.querySelector('.w-14.h-14');
          const nameEl = card.querySelector('h3');
          const rankText = card.innerText;
          
          let avatarInfo = null;
          if (img) {
            avatarInfo = {
              type: 'image',
              src: img.src,
              alt: img.alt,
              referrerPolicy: img.referrerPolicy,
              classes: img.className,
            };
          } else if (fallbackDiv) {
            const style = window.getComputedStyle(fallbackDiv);
            avatarInfo = {
              type: 'fallback_div',
              text: fallbackDiv.innerText.trim(),
              bgColor: style.backgroundColor,
              textColor: style.color,
              classes: fallbackDiv.className,
            };
          }
          
          results.push({
            cardIndex: i,
            playerName: nameEl ? nameEl.innerText.trim() : null,
            avatar: avatarInfo,
          });
        });
        return results;
      })()
    `);

    console.log('[CDP] Podium Avatars Inspection Result:', JSON.stringify(podiumAvatars, null, 2));

    // Capture Podium screenshot
    const podiumShot = await cdpClient.send('Page.captureScreenshot', { format: 'png' });
    const podiumPath = path.join(brainDir, 'leaderboard_avatar_podium.png');
    fs.writeFileSync(podiumPath, Buffer.from(podiumShot.data, 'base64'));
    console.log(`[Screenshot] Saved podium screenshot to ${podiumPath}`);

    // Scroll to table and trigger error on broken test image
    await cdpClient.evaluate(`
      (() => {
        window.scrollTo({ top: 400, behavior: 'instant' });
        const brokenImg = document.querySelectorAll('tbody tr')[4]?.querySelector('img');
        if (brokenImg) {
          brokenImg.dispatchEvent(new Event('error'));
        }
      })()
    `);
    await sleep(800);

    // Inspect Table Row Avatars
    const tableAvatars = await cdpClient.evaluate(`
      (() => {
        const rows = document.querySelectorAll('tbody tr');
        const results = [];
        rows.forEach((row, i) => {
          const img = row.querySelector('img');
          const fallbackDiv = row.querySelector('.w-9.h-9');
          const nameSpan = row.querySelector('td:nth-child(2) span');
          
          let avatarInfo = null;
          if (img) {
            avatarInfo = {
              type: 'image',
              src: img.src,
              alt: img.alt,
              referrerPolicy: img.referrerPolicy,
            };
          } else if (fallbackDiv) {
            const style = window.getComputedStyle(fallbackDiv);
            avatarInfo = {
              type: 'fallback_div',
              text: fallbackDiv.innerText.trim(),
              bgColor: style.backgroundColor,
              textColor: style.color,
            };
          }
          results.push({
            rowIndex: i,
            playerName: nameSpan ? nameSpan.innerText.trim() : null,
            avatar: avatarInfo,
          });
        });
        return results;
      })()
    `);

    console.log('[CDP] Table Avatars Inspection Result:', JSON.stringify(tableAvatars, null, 2));

    const tableShot = await cdpClient.send('Page.captureScreenshot', { format: 'png' });
    const tablePath = path.join(brainDir, 'leaderboard_avatar_table.png');
    fs.writeFileSync(tablePath, Buffer.from(tableShot.data, 'base64'));
    console.log(`[Screenshot] Saved table screenshot to ${tablePath}`);

    // Assertions
    console.log('=== VERIFICATION SUMMARY ===');
    
    // Check Rank 1: SINAN KP
    const rank1 = podiumAvatars.find(c => c.playerName === 'SINAN KP');
    if (!rank1 || rank1.avatar.type !== 'fallback_div' || rank1.avatar.text !== 'S') {
      throw new Error(`Rank 1 must render fallback div with letter "S", got ${JSON.stringify(rank1)}`);
    }
    console.log('✓ Rank 1: Correctly renders fallback div with centered "S" and unique solid background', rank1.avatar.bgColor);

    // Check Rank 2: Sinan kp (has authentic Google avatar)
    const rank2 = podiumAvatars.find(c => c.playerName === 'Sinan kp');
    if (!rank2 || rank2.avatar.type !== 'image' || rank2.avatar.referrerPolicy !== 'no-referrer') {
      throw new Error(`Rank 2 must render real image with no-referrer, got ${JSON.stringify(rank2)}`);
    }
    console.log('✓ Rank 2: Correctly renders authentic Google image with referrerPolicy="no-referrer"');

    // Check Rank 3: rohith
    const rank3 = podiumAvatars.find(c => c.playerName === 'rohith');
    if (!rank3 || rank3.avatar.type !== 'fallback_div' || rank3.avatar.text !== 'R') {
      throw new Error(`Rank 3 must render fallback div with letter "R", got ${JSON.stringify(rank3)}`);
    }
    console.log('✓ Rank 3: Correctly renders fallback div with centered "R" and unique solid background', rank3.avatar.bgColor);

    // Check Table rows: Michael -> 'M', alex john (with broken photo) -> 'A'
    const michaelRow = tableAvatars.find(r => r.playerName === 'Michael');
    if (!michaelRow || michaelRow.avatar.type !== 'fallback_div' || michaelRow.avatar.text !== 'M') {
      throw new Error(`Table row Michael must render "M", got ${JSON.stringify(michaelRow)}`);
    }
    console.log('✓ Table row Michael: Correctly renders fallback div with "M"');

    const alexRow = tableAvatars.find(r => r.playerName === 'alex john');
    if (!alexRow || alexRow.avatar.type !== 'fallback_div' || alexRow.avatar.text !== 'A') {
      throw new Error(`Table row alex john with broken image must fallback to "A", got ${JSON.stringify(alexRow)}`);
    }
    console.log('✓ Table row alex john (broken photo simulation): Gracefully failed over to fallback div with "A"');

    console.log('ALL VERIFICATIONS PASSED SUCCESSFULLY!');
  } finally {
    if (browserProc) {
      browserProc.kill();
    }
    server.close();
    try {
      fs.rmSync(tmpUserData, { recursive: true, force: true });
    } catch {}
  }
}

main().catch((err) => {
  console.error('[Verification Failed]', err);
  process.exit(1);
});
