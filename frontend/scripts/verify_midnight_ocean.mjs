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

function startServer(port) {
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      return res.end();
    }

    if (reqPath.startsWith('/api/platform/config/') || reqPath.startsWith('/platform/config/')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ competition_enabled: true, custom_text_enabled: true }));
    }

    if (reqPath.startsWith('/api/auth/me/') || reqPath.startsWith('/api/profile/')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(
        JSON.stringify({
          id: 1,
          username: 'sinankp',
          email: 'sinan@example.com',
          profile: { display_name: 'Sinan KP', avatar_url: '' },
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
      console.log(`[Static Server] Listening on http://127.0.0.1:${port}`);
      resolve(server);
    });
  });
}

async function main() {
  const PORT = 5280;
  const server = await startServer(PORT);

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const cdpPort = 9330;
  const tmpUserData = path.join(os.tmpdir(), `edge_ocean_${Date.now()}`);
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
      `http://127.0.0.1:${PORT}/themes`,
    ],
    { stdio: 'ignore' }
  );

  await sleep(1500);

  let pageTarget = null;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${cdpPort}/json`);
      const targets = await res.json();
      pageTarget = targets.find((t) => t.type === 'page');
      if (pageTarget) break;
    } catch {
      await sleep(300);
    }
  }

  if (!pageTarget) {
    console.error('Failed to locate page target on Edge CDP');
    browserProc.kill();
    server.close();
    process.exit(1);
  }

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  console.log('[CDP] Connected successfully to page target!');

  let msgId = 1;
  const callbacks = new Map();
  ws.onmessage = (evt) => {
    try {
      const msg = JSON.parse(evt.data);
      if (msg.id && callbacks.has(msg.id)) {
        const cb = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        if (msg.error) {
          console.error('[CDP Error]', msg.error);
        }
        cb(msg.result);
      }
    } catch (err) {}
  };

  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const id = msgId++;
      callbacks.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });

  await send('Page.enable');
  await send('DOM.enable');
  await send('Runtime.enable');

  async function setViewport(width, height) {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 768,
    });
    await sleep(400);
  }

  async function captureScreenshot(outName) {
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const outPath = path.join(brainDir, outName);
    fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
    console.log(`[Screenshot Captured] -> ${outName}`);
  }

  // Allow initial render
  await sleep(1500);
  await setViewport(1920, 1080);

  // 1. Initial /themes page before selecting Midnight Ocean
  console.log('[Step 1] Capturing Themes Gallery before selecting Midnight Ocean in Card 07 position...');
  await captureScreenshot('midnight_ocean_themes_gallery_1920.png');

  // 2. Select Card 07: Midnight Ocean
  console.log('[Step 2] Selecting Card 07: Midnight Ocean...');
  const selectRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const cards = document.querySelectorAll('div[role="button"][aria-pressed]');
      if (cards.length >= 7) {
        cards[6].scrollIntoView({ behavior: 'instant', block: 'center' });
        cards[6].click();
        const activeTheme = document.documentElement.getAttribute('data-theme');
        const title = cards[6].querySelector('h4')?.textContent;
        const bgComputed = window.getComputedStyle(document.body).backgroundColor;
        return { clicked: true, title, activeTheme, bgComputed };
      }
      return { clicked: false, totalCards: cards.length };
    })()`,
    returnByValue: true,
  });
  console.log('[Theme Selection Result]', selectRes.result?.value);
  await sleep(600);
  await captureScreenshot('midnight_ocean_active_selected_1920.png');

  // 3. Navigate to Workstation Page to inspect full Midnight Ocean application appearance
  console.log('[Step 3] Navigating to Workstation with Midnight Ocean active...');
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/workstation?dev_preview=true` });
  await sleep(1500);
  const workstationCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const activeTheme = document.documentElement.getAttribute('data-theme');
      const bodyBg = window.getComputedStyle(document.body).backgroundColor;
      const rootBg = window.getComputedStyle(document.documentElement).getPropertyValue('--bg-main').trim();
      return { activeTheme, bodyBg, rootBg };
    })()`,
    returnByValue: true,
  });
  console.log('[Workstation Page Verification]', workstationCheck.result?.value);
  await captureScreenshot('midnight_ocean_workstation_1920.png');

  // 4. Navigate to Academy Page
  console.log('[Step 4] Navigating to Academy with Midnight Ocean active...');
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/academy` });
  await sleep(1200);
  await captureScreenshot('midnight_ocean_academy_1920.png');

  // 5. Responsive testing on Themes Gallery with Midnight Ocean active
  console.log('[Step 5] Navigating back to Themes page for multi-viewport captures...');
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/themes` });
  await sleep(1200);

  // Laptop 1440x900
  console.log('[Step 6] Capturing Laptop 1440x900 view...');
  await setViewport(1440, 900);
  await sleep(500);
  await captureScreenshot('midnight_ocean_laptop_1440.png');

  // Tablet 1024x768 (2 columns)
  console.log('[Step 7] Capturing Tablet 1024x768 view...');
  await setViewport(1024, 768);
  await sleep(500);
  await captureScreenshot('midnight_ocean_tablet_1024.png');

  // Mobile 390x844 (1 column)
  console.log('[Step 8] Capturing Mobile 390x844 view...');
  await setViewport(390, 844);
  await sleep(500);
  await captureScreenshot('midnight_ocean_mobile_390.png');

  console.log('All Midnight Ocean verification captures finished successfully!');

  ws.close();
  browserProc.kill();
  server.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('Error in Midnight Ocean verification:', err);
  process.exit(1);
});
