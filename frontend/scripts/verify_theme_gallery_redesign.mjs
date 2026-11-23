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
  const PORT = 5212;
  const server = await startServer(PORT);

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const cdpPort = 9265;
  const tmpUserData = path.join(os.tmpdir(), `edge_themes_${Date.now()}`);
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

  // Helper for viewport change
  async function setViewport(width, height) {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 768,
    });
    await sleep(400);
  }

  // Helper to capture screenshot
  async function captureScreenshot(outName) {
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const outPath = path.join(brainDir, outName);
    fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
    console.log(`[Screenshot Captured] -> ${outName}`);
  }

  // Wait for initial page hydration
  await sleep(1500);

  // 1. Initial Desktop 1920x1080 View
  console.log('[Step 1] Inspecting 1920x1080 Desktop View...');
  await setViewport(1920, 1080);
  await sleep(800);
  await captureScreenshot('theme_gallery_redesign_1920.png');

  // 2. Select Theme "Espresso & Latte" (Card 02) to verify active state & theme switching
  console.log('[Step 2] Selecting Card 02 (Espresso & Latte)...');
  const clickCardRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const cards = document.querySelectorAll('div[role="button"][aria-pressed]');
      if (cards.length >= 2) {
        cards[1].click();
        return { clicked: true, title: cards[1].querySelector('h4')?.textContent };
      }
      return { clicked: false, count: cards.length };
    })()`,
    returnByValue: true,
  });
  console.log('[Theme Click Result]', clickCardRes.result?.value);
  await sleep(600);
  await captureScreenshot('theme_gallery_active_switch.png');

  // 3. Test Category Filtering (Click "Nocturnal")
  console.log('[Step 3] Clicking "Nocturnal" collection filter...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const nocturnalBtn = btns.find(b => b.textContent.includes('Nocturnal'));
      if (nocturnalBtn) {
        nocturnalBtn.click();
        return { clicked: true };
      }
      return { clicked: false };
    })()`,
    returnByValue: true,
  });
  await sleep(500);
  await captureScreenshot('theme_gallery_nocturnal_filter.png');

  // Reset filter back to "All Palettes"
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const allBtn = btns.find(b => b.textContent.includes('All Palettes'));
      if (allBtn) allBtn.click();
    })()`,
    returnByValue: true,
  });
  await sleep(400);

  // 4. Laptop 1440x900
  console.log('[Step 4] Inspecting 1440x900 Laptop View...');
  await setViewport(1440, 900);
  await sleep(500);
  await captureScreenshot('theme_gallery_laptop_1440.png');

  // 5. Tablet 1024x768 (2 columns)
  console.log('[Step 5] Inspecting 1024x768 Tablet View...');
  await setViewport(1024, 768);
  await sleep(500);
  await captureScreenshot('theme_gallery_tablet_1024.png');

  // 6. Mobile 390x844 (1 column)
  console.log('[Step 6] Inspecting 390x844 Mobile View...');
  await setViewport(390, 844);
  await sleep(500);
  await captureScreenshot('theme_gallery_mobile_390.png');

  console.log('All verification captures completed successfully!');

  ws.close();
  browserProc.kill();
  server.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('Error during verification:', err);
  process.exit(1);
});
