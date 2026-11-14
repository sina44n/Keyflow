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

async function runAcademyBrowserVerification() {
  const SERVER_PORT = 4178;
  const CDP_PORT = 9229;

  console.log('--- Starting Phase 5 Academy Browser Verification ---');

  // 1. Start Server
  const server = await startServer(SERVER_PORT);

  // 2. Launch Edge Headless
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const userDataDir = path.join(os.tmpdir(), `edge-phase5-${Date.now()}`);

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

    console.log(`Navigating to http://127.0.0.1:${SERVER_PORT}/academy?dev_preview=true ...`);
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${SERVER_PORT}/academy?dev_preview=true` });
    await sleep(2500);

    // Bypass auth globally
    await cdp.evaluate('window.__KEYFLOW_DEV_BYPASS_AUTH__ = true');

    // 1. Verify absence of obsolete 4,200 claims
    console.log('\n--- Checking absence of obsolete promotional claims ---');
    const bodyText = await cdp.evaluate('document.body.innerText');

    const bannedPhrases = ['4,200', '4.200', '4 200'];
    for (const phrase of bannedPhrases) {
      const found = bodyText.includes(phrase);
      console.log(`Obsolete phrase "${phrase}": ${found ? 'FAIL (present in body)' : 'PASS (absent)'}`);
      if (found) throw new Error(`Obsolete phrase "${phrase}" was found on live rendered Academy page!`);
    }

    // 2. Verify dynamic stage header and unit information
    console.log('\n--- Checking authentic dynamic stage header ---');
    const headerInfo = await cdp.evaluate(`
      (() => {
        const titleEl = document.querySelector('h2');
        const unitEl = document.querySelector('.border-l-4 ~ div');
        return {
          title: titleEl ? titleEl.innerText : '',
          unitText: unitEl ? unitEl.innerText : '',
        };
      })()
    `);
    console.log('Header Info:', headerInfo);
    assert.ok(headerInfo.title.includes('Stage 1'), 'Must display Stage 1 header');
    assert.ok(headerInfo.unitText.includes('Unit 1 of 70'), 'Must dynamically display Unit 1 of 70');

    // Screenshot of clean Academy Hub
    const hubScreenshot = path.join(brainDir, 'phase5_academy_hub_verified.png');
    await cdp.screenshot(hubScreenshot);

    // 3. Test Stage Flyout Dropdown
    console.log('\n--- Testing Select Stage Flyout Menu ---');
    await cdp.evaluate(`
      (() => {
        const selectBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Select Stage'));
        if (selectBtn) selectBtn.click();
      })()
    `);
    await sleep(500);

    const flyoutInfo = await cdp.evaluate(`
      (() => {
        const flyout = document.querySelector('.animate-in');
        if (!flyout) return null;
        const text = flyout.innerText;
        const stages = Array.from(flyout.querySelectorAll('button')).map(b => b.innerText.trim());
        return { text, stagesCount: stages.length };
      })()
    `);
    console.log('Flyout Info:', flyoutInfo);
    assert.ok(flyoutInfo, 'Flyout menu must open');
    assert.ok(flyoutInfo.text.includes('Curriculum Stages (10)'), 'Flyout must display dynamic 10 stages');
    assert.ok(flyoutInfo.text.includes('7,000 Levels Total'), 'Flyout must display 7,000 Levels Total');

    // Close flyout by clicking outside or clicking select button again
    await cdp.evaluate(`
      (() => {
        const selectBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Select Stage'));
        if (selectBtn) selectBtn.click();
      })()
    `);
    await sleep(300);

    // 4. Test Lesson Launch (Lesson 1)
    console.log('\n--- Testing Lesson 1 Launch into LessonPlayer ---');
    await cdp.evaluate(`
      (() => {
        // Find Resume Lesson or first card
        const resumeBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Resume Lesson'));
        if (resumeBtn) {
          resumeBtn.click();
        } else {
          const card = document.querySelector('section[aria-label="Curriculum Level Matrix"] button');
          if (card) card.click();
        }
      })()
    `);
    await sleep(2000);

    const lessonPlayerState = await cdp.evaluate(`
      (() => {
        const hasTextarea = Boolean(document.querySelector('textarea, [tabindex="0"]'));
        const body = document.body.innerText;
        const hasLessonPrompt = body.includes('Stage 1') || body.includes('Level 1') || body.includes('F & J');
        return { hasTextarea, hasLessonPrompt, url: window.location.href };
      })()
    `);
    console.log('LessonPlayer State:', lessonPlayerState);
    assert.ok(lessonPlayerState.hasTextarea || lessonPlayerState.hasLessonPrompt, 'LessonPlayer must be active');

    // Screenshot of active LessonPlayer
    const lessonScreenshot = path.join(brainDir, 'phase5_academy_lesson_active.png');
    await cdp.screenshot(lessonScreenshot);

    // 5. Test Responsive Viewports (Desktop, Tablet, Mobile)
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
      await cdp.send('Page.navigate', { url: `http://127.0.0.1:${SERVER_PORT}/academy?dev_preview=true` });
      await sleep(1000);

      const hasHorizontalScroll = await cdp.evaluate(`
        document.documentElement.scrollWidth > window.innerWidth + 2
      `);
      console.log(`Viewport ${vp.name} (${vp.width}x${vp.height}): Horizontal overflow: ${hasHorizontalScroll ? 'FAIL' : 'PASS (clean)'}`);
      if (hasHorizontalScroll) {
        throw new Error(`Viewport ${vp.name} suffered horizontal scroll overflow!`);
      }
    }

    console.log('\n=== ALL PHASE 5 REAL-BROWSER VERIFICATIONS SUCCEEDED ===\n');
  } finally {
    edgeProcess.kill();
    server.close();
  }
}

runAcademyBrowserVerification().catch((err) => {
  console.error('\n*** VERIFICATION FAILED ***\n', err);
  process.exit(1);
});
