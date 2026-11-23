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
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const mockCompetition = {
  id: 101,
  name: 'Global Championship Room',
  code: 'KF-CHAMP77',
  status: 'completed',
  challenge_type: 'words',
  target_limit: 25,
  time_limit_seconds: null,
  max_participants: 10,
  challenge_text: 'Precision cadence and immaculate touch typing form the bedrock of true velocity.',
  is_host: true,
  created_by_name: 'Antigravity Master',
  participant_count: 3,
  host: { id: 1, username: 'antigravity' },
  participants: [
    {
      id: 1,
      user: { id: 1, username: 'antigravity' },
      display_name: 'Antigravity Master',
      avatar_url: null,
      status: 'completed',
      net_wpm: 128.4,
      gross_wpm: 131.0,
      accuracy: 99.1,
      duration_seconds: 14.8,
      score: 1284,
      correct_chars: 102,
      incorrect_chars: 1,
      is_verified: true,
      rank: 1,
    },
    {
      id: 2,
      user: { id: 2, username: 'velocikey' },
      display_name: 'VelociKey',
      avatar_url: null,
      status: 'completed',
      net_wpm: 112.0,
      gross_wpm: 115.2,
      accuracy: 97.4,
      duration_seconds: 16.5,
      score: 1120,
      correct_chars: 98,
      incorrect_chars: 3,
      is_verified: true,
      rank: 2,
    },
    {
      id: 3,
      user: { id: 3, username: 'flowstate' },
      display_name: 'FlowState',
      avatar_url: null,
      status: 'completed',
      net_wpm: 98.6,
      gross_wpm: 101.0,
      accuracy: 98.0,
      duration_seconds: 18.2,
      score: 986,
      correct_chars: 95,
      incorrect_chars: 2,
      is_verified: false,
      rank: 3,
    },
  ],
  summary: {
    total_participants: 3,
    completed_count: 3,
    avg_wpm: 113.0,
    avg_accuracy: 98.2,
    top_score: 1284,
  },
};

const mockLeaderboardEntries = [
  {
    rank: 1,
    user_id: 1,
    username: 'antigravity',
    display_name: 'Antigravity Master',
    avatar_url: null,
    net_wpm: 142.5,
    gross_wpm: 144.0,
    accuracy: 99.2,
    sessions_count: 148,
    duration_seconds: 60,
    achieved_at: new Date().toISOString(),
    score: 142.5,
  },
  {
    rank: 2,
    user_id: 2,
    username: 'velocikey',
    display_name: 'VelociKey',
    avatar_url: null,
    net_wpm: 126.8,
    gross_wpm: 129.5,
    accuracy: 98.1,
    sessions_count: 94,
    duration_seconds: 60,
    achieved_at: new Date().toISOString(),
    score: 126.8,
  },
  {
    rank: 3,
    user_id: 3,
    username: 'flowstate',
    display_name: 'FlowState',
    avatar_url: null,
    net_wpm: 115.3,
    gross_wpm: 118.0,
    accuracy: 97.8,
    sessions_count: 67,
    duration_seconds: 60,
    achieved_at: new Date().toISOString(),
    score: 115.3,
  },
  {
    rank: 4,
    user_id: 4,
    username: 'mechakeys',
    display_name: 'MechaKeys',
    avatar_url: null,
    net_wpm: 104.2,
    gross_wpm: 106.1,
    accuracy: 98.0,
    sessions_count: 42,
    duration_seconds: 60,
    achieved_at: new Date().toISOString(),
    score: 104.2,
  },
];

function startServer(port) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    const reqPath = url.pathname;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      return res.end();
    }

    if (reqPath.startsWith('/api/platform/config/') || reqPath.startsWith('/platform/config/')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ competition_enabled: true, custom_text_enabled: true }));
    }

    if (reqPath.startsWith('/api/competition/rooms/KF-CHAMP77') || reqPath.startsWith('/api/competition/KF-CHAMP77')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(mockCompetition));
    }

    if (reqPath.startsWith('/api/competition/rooms/') || reqPath === '/api/competition/lobbies/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify([mockCompetition]));
    }

    if (reqPath.startsWith('/api/practice/leaderboard')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(
        JSON.stringify({
          period: 'all-time',
          category: 'speed',
          duration_seconds: 60,
          entries: mockLeaderboardEntries,
          current_user_rank: 1,
        })
      );
    }

    if (reqPath.startsWith('/api/accounts/profile') || reqPath.startsWith('/api/accounts/me')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(
        JSON.stringify({
          id: 1,
          username: 'antigravity',
          email: 'test@keyflow.io',
          is_owner: true,
          profile: {
            display_name: 'Antigravity Master',
            avatar_url: null,
          },
          preferences: {
            theme_preset: 'midnight-blue',
            sound_profile: 'cherry-blue',
            sound_enabled: true,
          },
        })
      );
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
      console.log(`[Test Server] Listening on http://127.0.0.1:${port}`);
      resolve(server);
    });
  });
}

async function main() {
  const PORT = 5388;
  const server = await startServer(PORT);

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const cdpPort = 9366;
  const tmpUserData = path.join(os.tmpdir(), `edge_theme_prop_${Date.now()}`);
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
      `http://127.0.0.1:${PORT}/workstation`,
    ],
    { stdio: 'ignore' }
  );

  await sleep(1500);

  let pageTarget = null;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${cdpPort}/json`);
      const list = await res.json();
      pageTarget = list.find((t) => t.type === 'page') || list[0];
      if (pageTarget) break;
    } catch {
      await sleep(300);
    }
  }

  if (!pageTarget) {
    console.error('Failed to locate Edge page target');
    browserProc.kill();
    server.close();
    process.exit(1);
  }

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let msgId = 1;
  const callbacks = new Map();
  ws.onmessage = (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.id && callbacks.has(msg.id)) {
      const cb = callbacks.get(msg.id);
      callbacks.delete(msg.id);
      cb(msg.result);
    }
  };

  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const id = msgId++;
      callbacks.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });

  await send('Page.enable');
  await send('DOM.enable');
  await send('CSS.enable');
  await send('Runtime.enable');

  // Set standard high-res viewport
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  // Representative themes to verify:
  // 1. midnight-blue: Pure Black #000000 & Electric Cobalt Accent #2563EB
  // 2. forest-green: Pure White #FFFFFF & Forest Green Accent #115E59
  // 3. dark-charcoal-lime: Original Black #000000 & Neon Lime Accent #E2F952
  // 4. burgundy-cream: Warm Cream #FFFDF9 & Deep Burgundy Accent #8B1D2C
  const testThemes = [
    { id: 'midnight-blue', name: 'Midnight Ocean (Dark Black/Electric Cobalt)', expectedBg: 'rgb(0, 0, 0)' },
    { id: 'forest-green', name: 'Forest Green (Pure White)', expectedBg: 'rgb(255, 255, 255)' },
    { id: 'dark-charcoal-lime', name: 'Charcoal Lime (Original Black)', expectedBg: 'rgb(0, 0, 0)' },
    { id: 'burgundy-cream', name: 'Burgundy & Cream (Warm Ivory/Cream)', expectedBg: 'rgb(255, 253, 249)' },
  ];

  console.log('\n=== RUNNING THEME PROPAGATION AUDIT ACROSS WORKSTATION, COMPETITIONS & LEADERBOARD ===');

  for (const t of testThemes) {
    console.log(`\n--> Testing Theme: ${t.name} (id: ${t.id})`);

    // 1. Navigate to Workstation
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/workstation` });
    await sleep(1000);

    // Apply theme dynamically to root
    await send('Runtime.evaluate', {
      expression: `
        document.documentElement.setAttribute('data-theme', '${t.id}');
        localStorage.setItem('keyflow-theme', '${t.id}');
      `,
    });
    await sleep(400);

    // Check Workstation root & body styles
    const workstationStyles = await send('Runtime.evaluate', {
      expression: `
        JSON.stringify({
          dataTheme: document.documentElement.getAttribute('data-theme'),
          bodyBg: window.getComputedStyle(document.body).backgroundColor,
          bgMain: window.getComputedStyle(document.documentElement).getPropertyValue('--bg-main').trim(),
          bgSurface: window.getComputedStyle(document.documentElement).getPropertyValue('--bg-surface').trim(),
          accent: window.getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),
          textPrimary: window.getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim(),
        });
      `,
      returnByValue: true,
    });
    const wsInfo = JSON.parse(workstationStyles.result.value);
    console.log('  [Workstation]', wsInfo);

    // Screenshot Workstation
    const wsShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(brainDir, `theme_prop_${t.id}_workstation.png`), Buffer.from(wsShot.data, 'base64'));

    // 2. Navigate to Competition Results Page
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/competitions/KF-CHAMP77/results` });
    await sleep(1000);
    await send('Runtime.evaluate', {
      expression: `
        document.documentElement.setAttribute('data-theme', '${t.id}');
      `,
    });
    await sleep(400);

    const compStyles = await send('Runtime.evaluate', {
      expression: `
        const rootDiv = document.querySelector('.min-h-screen');
        const actionBar = document.querySelector('.backdrop-blur-md');
        JSON.stringify({
          dataTheme: document.documentElement.getAttribute('data-theme'),
          rootDivBg: rootDiv ? window.getComputedStyle(rootDiv).backgroundColor : null,
          actionBarBg: actionBar ? window.getComputedStyle(actionBar).backgroundColor : null,
          hasWhiteOverride: rootDiv ? rootDiv.className.includes('#F8FAFC') : false,
        });
      `,
      returnByValue: true,
    });
    const compInfo = JSON.parse(compStyles.result.value);
    console.log('  [Competition Results]', compInfo);

    // Screenshot Competition Results
    const compShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(brainDir, `theme_prop_${t.id}_comp_results.png`), Buffer.from(compShot.data, 'base64'));

    // 3. Navigate to Leaderboard Page
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/leaderboard` });
    await sleep(1000);
    await send('Runtime.evaluate', {
      expression: `
        document.documentElement.setAttribute('data-theme', '${t.id}');
      `,
    });
    await sleep(400);

    const lbStyles = await send('Runtime.evaluate', {
      expression: `
        const table = document.querySelector('section[aria-label=\"Global Rankings\"]');
        JSON.stringify({
          dataTheme: document.documentElement.getAttribute('data-theme'),
          bodyBg: window.getComputedStyle(document.body).backgroundColor,
          tableFound: Boolean(table),
        });
      `,
      returnByValue: true,
    });
    const lbInfo = JSON.parse(lbStyles.result.value);
    console.log('  [Leaderboard]', lbInfo);

    // Screenshot Leaderboard
    const lbShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(brainDir, `theme_prop_${t.id}_leaderboard.png`), Buffer.from(lbShot.data, 'base64'));
  }

  console.log('\n=== ALL THEME VERIFICATION SCREENSHOTS RECORDED SUCCESSFULLY ===');
  browserProc.kill();
  server.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('[Error in Theme Propagation Verification]:', err);
  process.exit(1);
});
