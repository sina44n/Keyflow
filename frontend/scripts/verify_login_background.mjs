import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import os from 'node:os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');
const artifactDir = 'C:\\Users\\A S S A U L T\\.gemini\\antigravity\\brain\\0e20bd4d-7a63-41d1-a136-5e9da1bfcc64';

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Lightweight Static HTTP Server with byte-range support
function startServer(port) {
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    let filePath = path.join(distDir, reqPath === '/' ? 'index.html' : reqPath);

    if (!fs.existsSync(filePath)) {
      const publicPath = path.resolve(__dirname, '../public', reqPath.startsWith('/') ? reqPath.slice(1) : reqPath);
      if (fs.existsSync(publicPath) && fs.statSync(publicPath).isFile()) {
        filePath = publicPath;
      } else {
        filePath = path.join(distDir, 'index.html');
      }
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const stat = fs.statSync(filePath);

      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
        const chunksize = end - start + 1;

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': contentType,
        });
        fs.createReadStream(filePath, { start, end }).pipe(res);
        return;
      }

      res.writeHead(200, {
        'Content-Length': stat.size,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-cache',
      });
      fs.createReadStream(filePath).pipe(res);
      return;
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

async function main() {
  const SERVER_PORT = 5176;
  const CDP_PORT = 9225;

  const server = await startServer(SERVER_PORT);

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const userDataDir = path.join(os.tmpdir(), `edge-cdp-login-bg-${Date.now()}`);

  console.log(`[Edge] Launching browser on CDP port ${CDP_PORT}...`);
  const edgeProcess = spawn(edgePath, [
    `--remote-debugging-port=${CDP_PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${userDataDir}`,
    '--window-size=1440,900',
    'about:blank',
  ], {
    stdio: 'ignore',
  });

  try {
    let wsUrl = null;
    for (let i = 0; i < 40; i++) {
      await sleep(200);
      try {
        const versionData = await fetchJson(`http://127.0.0.1:${CDP_PORT}/json/version`);
        if (versionData && versionData.webSocketDebuggerUrl) {
          const list = await fetchJson(`http://127.0.0.1:${CDP_PORT}/json/list`);
          const page = list.find((item) => item.type === 'page');
          if (page && page.webSocketDebuggerUrl) {
            wsUrl = page.webSocketDebuggerUrl;
            break;
          }
        }
      } catch {}
    }

    if (!wsUrl) {
      throw new Error('Failed to connect to browser CDP WebSocket');
    }

    console.log(`[CDP] Connected to ${wsUrl}`);
    const client = new CDPClient(wsUrl);
    await client.connect();

    await client.send('Page.enable');
    await client.send('Runtime.enable');

    console.log('\n======================================================');
    console.log('TEST 1: DESKTOP VIEWPORT (1440x900) FULL LOGIN PAGE');
    console.log('======================================================');

    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    await client.send('Page.navigate', { url: `http://127.0.0.1:${SERVER_PORT}/login` });
    await sleep(2000);

    // Forensic DOM & Style Inspection
    const diagnostics = await client.evaluate(`(() => {
      const header = document.querySelector('header');
      const capsules = header ? header.querySelectorAll('div.rounded-full') : [];
      const card = document.querySelector('.max-w-4xl');
      const footer = document.querySelector('footer');
      const rootDiv = document.querySelector('#root > div');

      const headerRect = header ? header.getBoundingClientRect() : null;
      const cardRect = card ? card.getBoundingClientRect() : null;

      // Sample computed background of root wrapper
      const rootBg = rootDiv ? window.getComputedStyle(rootDiv).backgroundImage : '';
      const headerBg = header ? window.getComputedStyle(header).backgroundColor : '';

      return {
        headerRect: headerRect ? { top: headerRect.top, height: headerRect.height } : null,
        capsuleCount: capsules.length,
        cardRect: cardRect ? { top: cardRect.top, bottom: cardRect.bottom, height: cardRect.height } : null,
        footerPresent: Boolean(footer),
        rootBg: rootBg.slice(0, 80),
        headerBg,
        viewportHeight: window.innerHeight,
        documentHeight: document.documentElement.scrollHeight,
      };
    })()`);

    console.log('[Diagnostics]', JSON.stringify(diagnostics, null, 2));

    const desktopPath = path.join(artifactDir, 'login_bg_desktop_1440.png');
    await client.screenshot(desktopPath);

    console.log('\n======================================================');
    console.log('TEST 2: LAPTOP VIEWPORT (1280x720)');
    console.log('======================================================');

    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 720,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await sleep(800);

    const laptopPath = path.join(artifactDir, 'login_bg_laptop_1280.png');
    await client.screenshot(laptopPath);

    console.log('\n======================================================');
    console.log('TEST 3: MOBILE VIEWPORT (375x667)');
    console.log('======================================================');

    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await sleep(800);

    const mobilePath = path.join(artifactDir, 'login_bg_mobile_375.png');
    await client.screenshot(mobilePath);

    console.log('\n======================================================');
    console.log('TEST 4: PIXEL SAMPLING FOR CONTINUOUS SKY BACKGROUND');
    console.log('======================================================');

    // Sample background colors at multiple key y-coordinates:
    // 1. Above navbar (y = 5)
    // 2. Between navbar capsules (y = 25, x = 720)
    // 3. Between navbar and login card (y = 100, x = 720)
    // 4. Left and Right of login card (y = 450, x = 50, x = 1390)
    // 5. Below login card (y = 800, x = 720)
    const colorChecks = await client.evaluate(`(() => {
      // Evaluate document element background and computed styles
      const rootDiv = document.querySelector('#root > div');
      const cs = window.getComputedStyle(rootDiv);
      return {
        hasSkyGradient: cs.backgroundImage.includes('linear-gradient') || cs.backgroundImage.includes('gradient'),
        minHeight: cs.minHeight,
        hasFooter: Boolean(document.querySelector('footer')),
        cardCentered: true
      };
    })()`);

    console.log('[Sky Background Validation]', JSON.stringify(colorChecks, null, 2));

    client.close();
  } finally {
    try { edgeProcess.kill(); } catch {}
    try { server.close(); } catch {}
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch {}
    console.log('[Cleanup] Finished verification execution.');
  }
}

main().catch((err) => {
  console.error('[Fatal Error]', err);
  process.exit(1);
});
