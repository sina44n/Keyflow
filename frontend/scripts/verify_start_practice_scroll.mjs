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
  const SERVER_PORT = 5181;
  const CDP_PORT = 9229;

  const server = await startServer(SERVER_PORT);

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const userDataDir = path.join(os.tmpdir(), `edge-cdp-scroll-check-${Date.now()}`);

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

    const client = new CDPClient(wsUrl);
    await client.connect();

    await client.send('Page.enable');
    await client.send('Runtime.enable');

    console.log('\n======================================================');
    console.log('TEST 1: DESKTOP HOME PAGE SCROLL-TO-TOP VERIFICATION');
    console.log('======================================================');

    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    await client.send('Page.navigate', { url: `http://127.0.0.1:${SERVER_PORT}/` });
    await sleep(2000);

    // Scroll to the bottom CTA section
    await client.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    await sleep(600);

    const scrollPosBefore = await client.evaluate('window.scrollY');
    console.log(`[Scroll Position at CTA Section] scrollY = ${scrollPosBefore}`);

    await client.screenshot(path.join(artifactDir, 'start_practice_before_click.png'));

    // Click the "Start Practice Sprint" button
    console.log('[Action] Clicking "Start Practice Sprint" button in CTA section...');
    const clickSuccess = await client.evaluate(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const startBtn = btns.find(b => b.innerText && (b.innerText.includes('Start Practice Sprint') || b.innerText.includes('Start Practice')));
      if (startBtn) {
        startBtn.click();
        return true;
      }
      return false;
    })()`);

    console.log(`[Click Result] Success: ${clickSuccess}`);

    // Wait for smooth scroll animation to complete
    await sleep(1500);

    const finalScrollPos = await client.evaluate('window.scrollY');
    const headerRect = await client.evaluate(`(() => {
      const header = document.querySelector('header');
      const badge = document.querySelector('a[href="/telemetry"]');
      const hero = document.querySelector('h1');
      return {
        scrollY: window.scrollY,
        documentScrollTop: document.documentElement.scrollTop,
        headerTop: header ? header.getBoundingClientRect().top : null,
        badgeTop: badge ? badge.getBoundingClientRect().top : null,
        heroTop: hero ? hero.getBoundingClientRect().top : null,
      };
    })()`);

    console.log('[Final Scroll & Element Positions]:', JSON.stringify(headerRect, null, 2));

    await client.screenshot(path.join(artifactDir, 'start_practice_after_scroll_top.png'));

    console.log('\n======================================================');
    console.log('TEST 2: MOBILE VIEWPORT (375x667) SCROLL VERIFICATION');
    console.log('======================================================');

    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
      mobile: true,
    });

    await client.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    await sleep(600);

    const mobileScrollBefore = await client.evaluate('window.scrollY');
    console.log(`[Mobile Scroll Position at CTA] scrollY = ${mobileScrollBefore}`);

    console.log('[Action] Clicking "Start Practice Sprint" button on Mobile...');
    await client.evaluate(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const startBtn = btns.find(b => b.innerText && (b.innerText.includes('Start Practice Sprint') || b.innerText.includes('Start Practice')));
      if (startBtn) startBtn.click();
    })()`);

    await sleep(2200);

    const mobileFinalPos = await client.evaluate('window.scrollY');
    console.log(`[Mobile Final Scroll Position] scrollY = ${mobileFinalPos}`);

    await client.screenshot(path.join(artifactDir, 'start_practice_mobile_after_scroll_top.png'));

    console.log('\n======================================================');
    console.log(`DESKTOP SCROLL TO EXACT 0: ${finalScrollPos === 0 ? 'PASS (0px)' : 'FAIL (' + finalScrollPos + 'px)'}`);
    console.log(`MOBILE SCROLL TO EXACT 0: ${mobileFinalPos === 0 ? 'PASS (0px)' : 'FAIL (' + mobileFinalPos + 'px)'}`);
    console.log('======================================================');

    client.close();
  } finally {
    try { edgeProcess.kill(); } catch {}
    try { server.close(); } catch {}
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch {}
    console.log('[Cleanup] Verification finished.');
  }
}

main().catch((err) => {
  console.error('[Fatal Error]', err);
  process.exit(1);
});
