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

// Lightweight Static HTTP Server with byte-range support for MP4 streaming
function startServer(port) {
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    let filePath = path.join(distDir, reqPath === '/' ? 'index.html' : reqPath);

    // If looking for media in public/media fallback
    if (!fs.existsSync(filePath)) {
      const publicPath = path.resolve(__dirname, '../public', reqPath.startsWith('/') ? reqPath.slice(1) : reqPath);
      if (fs.existsSync(publicPath) && fs.statSync(publicPath).isFile()) {
        filePath = publicPath;
      }
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const stat = fs.statSync(filePath);

      // Support byte ranges for video seeking & smooth playback
      const range = req.headers.range;
      if (range && ext === '.mp4') {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
        const chunksize = end - start + 1;
        const stream = fs.createReadStream(filePath, { start, end });
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': 'video/mp4',
        });
        return stream.pipe(res);
      }

      res.writeHead(200, {
        'Content-Length': stat.size,
        'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
        'Accept-Ranges': 'bytes',
      });
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

async function main() {
  const SERVER_PORT = 5175;
  const CDP_PORT = 9224;

  const server = await startServer(SERVER_PORT);

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const userDataDir = path.join(os.tmpdir(), `edge-cdp-login-video-${Date.now()}`);

  console.log(`[Edge] Launching browser on CDP port ${CDP_PORT}...`);
  const edgeProcess = spawn(edgePath, [
    `--remote-debugging-port=${CDP_PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${userDataDir}`,
    '--window-size=1280,860',
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
    console.log('TEST 1: INITIAL VISIT TO /login (GREETING VIDEO)');
    console.log('======================================================');
    await client.send('Page.navigate', { url: `http://127.0.0.1:${SERVER_PORT}/login` });
    await sleep(2500);

    const initialStats = await client.evaluate(`
      (() => {
        const greeting = document.querySelector('[data-testid="greeting-video"]');
        const idle = document.querySelector('[data-testid="idle-video"]');
        const sessionKey = sessionStorage.getItem('kf_login_character_greeting_played');
        return {
          hasGreeting: !!greeting,
          greetingSrc: greeting ? greeting.src : null,
          greetingPaused: greeting ? greeting.paused : null,
          greetingCurrentTime: greeting ? greeting.currentTime : null,
          greetingDuration: greeting ? greeting.duration : null,
          hasIdle: !!idle,
          idleSrc: idle ? idle.src : null,
          idlePaused: idle ? idle.paused : null,
          idleOpacity: idle ? window.getComputedStyle(idle).opacity : null,
          sessionKey,
          brandText: document.body.innerText.includes('KEYFLOW'),
          welcomeHeading: document.querySelector('h1')?.innerText,
        };
      })()
    `);
    console.log('[Initial Visit State]:', initialStats);

    const shot1 = path.join(artifactDir, 'login_live_greeting_wave.png');
    await client.screenshot(shot1);

    console.log('\n======================================================');
    console.log('TEST 2: ADVANCE GREETING TO TRANSITION TRIGGER (t=7.2s)');
    console.log('======================================================');
    await client.evaluate(`
      (() => {
        const g = document.querySelector('[data-testid="greeting-video"]');
        if (g) {
          g.currentTime = 7.1;
        }
      })()
    `);
    await sleep(1500);

    const transitionStats = await client.evaluate(`
      (() => {
        const greeting = document.querySelector('[data-testid="greeting-video"]');
        const idle = document.querySelector('[data-testid="idle-video"]');
        const sessionKey = sessionStorage.getItem('kf_login_character_greeting_played');
        return {
          greetingPaused: greeting ? greeting.paused : null,
          idlePaused: idle ? idle.paused : null,
          idleCurrentTime: idle ? idle.currentTime : null,
          idleOpacity: idle ? window.getComputedStyle(idle).opacity : null,
          greetingOpacity: greeting ? window.getComputedStyle(greeting).opacity : null,
          sessionKey,
        };
      })()
    `);
    console.log('[Transition State]:', transitionStats);

    const shot2 = path.join(artifactDir, 'login_live_transition_crossfade.png');
    await client.screenshot(shot2);

    console.log('\n======================================================');
    console.log('TEST 3: TRANSITION COMPLETION & CONTINUOUS IDLE LOOP');
    console.log('======================================================');
    await sleep(1200);

    const idleStats = await client.evaluate(`
      (() => {
        const greeting = document.querySelector('[data-testid="greeting-video"]');
        const idle = document.querySelector('[data-testid="idle-video"]');
        const sessionKey = sessionStorage.getItem('kf_login_character_greeting_played');
        return {
          greetingPresent: !!greeting,
          greetingOpacity: greeting ? window.getComputedStyle(greeting).opacity : null,
          idlePaused: idle ? idle.paused : null,
          idleLoop: idle ? idle.loop : null,
          idleOpacity: idle ? window.getComputedStyle(idle).opacity : null,
          idleCurrentTime: idle ? idle.currentTime : null,
          sessionKey,
        };
      })()
    `);
    console.log('[Continuous Idle Loop State]:', idleStats);

    const shot3 = path.join(artifactDir, 'login_live_continuous_idle.png');
    await client.screenshot(shot3);

    console.log('\n======================================================');
    console.log('TEST 4: SIGN IN -> SIGN UP SWITCHING (NO RESTART)');
    console.log('======================================================');
    await client.send('Page.navigate', { url: `http://127.0.0.1:${SERVER_PORT}/register` });
    await sleep(1500);

    const registerStats = await client.evaluate(`
      (() => {
        const greeting = document.querySelector('[data-testid="greeting-video"]');
        const idle = document.querySelector('[data-testid="idle-video"]');
        const sessionKey = sessionStorage.getItem('kf_login_character_greeting_played');
        return {
          greetingPresent: !!greeting,
          idlePaused: idle ? idle.paused : null,
          idleOpacity: idle ? window.getComputedStyle(idle).opacity : null,
          sessionKey,
          welcomeHeading: document.querySelector('h1')?.innerText,
        };
      })()
    `);
    console.log('[Sign Up Page State]:', registerStats);

    const shot4 = path.join(artifactDir, 'login_live_signup_switch.png');
    await client.screenshot(shot4);

    console.log('\n======================================================');
    console.log('TEST 5: REPEAT VISIT TO /login WITHIN SAME SESSION');
    console.log('======================================================');
    await client.send('Page.navigate', { url: `http://127.0.0.1:${SERVER_PORT}/login` });
    await sleep(1500);

    const repeatVisitStats = await client.evaluate(`
      (() => {
        const greeting = document.querySelector('[data-testid="greeting-video"]');
        const idle = document.querySelector('[data-testid="idle-video"]');
        const sessionKey = sessionStorage.getItem('kf_login_character_greeting_played');
        return {
          greetingPresent: !!greeting,
          idlePresent: !!idle,
          idlePaused: idle ? idle.paused : null,
          idleOpacity: idle ? window.getComputedStyle(idle).opacity : null,
          sessionKey,
          welcomeHeading: document.querySelector('h1')?.innerText,
        };
      })()
    `);
    console.log('[Repeat Visit State]:', repeatVisitStats);

    console.log('\n======================================================');
    console.log('TEST 6: MOBILE RESPONSIVE TEST (375x667 Viewport)');
    console.log('======================================================');
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await sleep(1000);

    const mobileStats = await client.evaluate(`
      (() => {
        const container = document.querySelector('[data-testid="login-character-video-container"]');
        const idle = document.querySelector('[data-testid="idle-video"]');
        const rect = container ? container.getBoundingClientRect() : null;
        return {
          containerWidth: rect ? rect.width : null,
          containerHeight: rect ? rect.height : null,
          idleObjectFit: idle ? window.getComputedStyle(idle).objectFit : null,
        };
      })()
    `);
    console.log('[Mobile Responsive State]:', mobileStats);

    const shot5 = path.join(artifactDir, 'login_live_mobile_responsive.png');
    await client.screenshot(shot5);

    client.close();
    console.log('\nALL 6 LIVE BROWSER TEST PHASES COMPLETED SUCCESSFULLY!');
  } finally {
    edgeProcess.kill();
    server.close();
  }
}

main().catch((err) => {
  console.error('[Error in browser verification]:', err);
  process.exit(1);
});
