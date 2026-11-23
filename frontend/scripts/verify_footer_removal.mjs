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
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.woff2': 'font/woff2',
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

      res.writeHead(200, {
        'Content-Length': stat.size,
        'Content-Type': contentType,
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
  const SERVER_PORT = 5178;
  const CDP_PORT = 9227;

  const server = await startServer(SERVER_PORT);

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const userDataDir = path.join(os.tmpdir(), `edge-cdp-footer-check-${Date.now()}`);

  console.log(`[Edge] Launching browser on CDP port ${CDP_PORT}...`);
  const edgeProcess = spawn(edgePath, [
    `--remote-debugging-port=${CDP_PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${userDataDir}`,
    '--window-size=1280,800',
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

    const client = new CDPClient(wsUrl);
    await client.connect();

    await client.send('Page.enable');
    await client.send('Runtime.enable');

    const TARGET_PAGES = [
      { name: 'Home', path: '/' },
      { name: 'Workstation', path: '/workstation' },
      { name: 'Academy', path: '/academy' },
      { name: 'Arcade', path: '/arcade' },
      { name: 'Telemetry', path: '/telemetry' },
      { name: 'Leaderboard', path: '/leaderboard' },
      { name: 'Themes', path: '/themes' },
    ];

    console.log('\n======================================================');
    console.log('VERIFYING FOOTER REMOVAL ACROSS ALL 7 TARGET PAGES');
    console.log('======================================================');

    const results = [];

    for (const p of TARGET_PAGES) {
      console.log(`\nNavigating to ${p.name} (${p.path})...`);
      await client.send('Page.navigate', { url: `http://127.0.0.1:${SERVER_PORT}${p.path}` });
      await sleep(1500);

      // Scroll to the bottom of the page to inspect natural ending
      await client.evaluate('window.scrollTo(0, document.body.scrollHeight)');
      await sleep(400);

      const pageState = await client.evaluate(`(() => {
        try {
          const footerEl = document.querySelector('footer');
          const hasShortcuts = Boolean(document.body.innerText && document.body.innerText.includes('API v1.0.0 Online'));
          const bodyHeight = document.body.scrollHeight;
          return {
            hasFooterElement: Boolean(footerEl),
            hasShortcutsBar: hasShortcuts,
            bodyHeight,
          };
        } catch (err) {
          return {
            error: err.message,
            hasFooterElement: Boolean(document.querySelector('footer')),
            hasShortcutsBar: false,
            bodyHeight: 0,
          };
        }
      })()`);

      const screenshotName = `footer_removed_${p.name.toLowerCase()}.png`;
      const screenshotPath = path.join(artifactDir, screenshotName);
      await client.screenshot(screenshotPath);

      results.push({
        page: p.name,
        path: p.path,
        hasFooter: pageState.hasFooterElement,
        hasShortcuts: pageState.hasShortcutsBar,
        screenshot: screenshotName,
      });

      console.log(`  [${p.name}] Footer element present: ${pageState.hasFooterElement} | Shortcuts bar present: ${pageState.hasShortcutsBar}`);
    }

    console.log('\n======================================================');
    console.log('FINAL AUDIT SUMMARY:');
    console.table(results);
    console.log('======================================================');

    client.close();
  } finally {
    try { edgeProcess.kill(); } catch {}
    try { server.close(); } catch {}
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch {}
    console.log('[Cleanup] Verification complete.');
  }
}

main().catch((err) => {
  console.error('[Fatal Error]', err);
  process.exit(1);
});
