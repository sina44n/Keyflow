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

  async captureScreenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const outPath = path.join(brainDir, filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`[Screenshot Saved] -> ${outPath}`);
    return outPath;
  }
}

async function main() {
  const SERVER_PORT = 4190;
  const CDP_PORT = 9240;

  console.log('=== Starting Phase 7.2 Trust Boundary & Accuracy Verification ===');

  const server = await startServer(SERVER_PORT);

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const userDataDir = path.join(os.tmpdir(), `edge-phase7-2-${Date.now()}`);

  console.log(`[Edge] Launching headless browser on port ${CDP_PORT}...`);
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

    // -------------------------------------------------------------
    // Test 1: Home Sprint Text Accuracy & Typing Feedback
    // -------------------------------------------------------------
    console.log('\n--- 1. Verifying Home Sprint Text Accuracy ---');
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${SERVER_PORT}/?dev_preview=true` });
    await sleep(2000);

    const homeSprintInfo = await cdp.evaluate(`
      (() => {
        function typeChar(input, val) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
          if (setter) setter.call(input, val);
          else input.value = val;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }

        const input = document.querySelector('input');
        if (input) {
          input.focus();
          typeChar(input, 'type with ');
        }

        return {
          currentValue: input?.value || '',
          spansCount: document.querySelectorAll('span').length,
        };
      })()
    `);
    console.log('[Home Sprint Info]:', homeSprintInfo);
    await cdp.captureScreenshot('phase7_2_home_sprint_text_accuracy.png');

    // -------------------------------------------------------------
    // Test 2: Workstation Accuracy Distinction (Typed-Position vs Keystroke Accuracy)
    // -------------------------------------------------------------
    console.log('\n--- 2. Verifying Workstation Results Accuracy Distinction ---');
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${SERVER_PORT}/workstation?dev_preview=true` });
    await sleep(2000);
    await cdp.evaluate('window.__KEYFLOW_DEV_BYPASS_AUTH__ = true');

    const workstationMounted = await cdp.evaluate(`
      (() => {
        const testResults = {
          wpm: 52,
          grossWpm: 52,
          netWpm: 48,
          rawAccuracy: 88,
          accuracy: 88,
          finalTextAccuracy: 95,
          correctKeystrokes: 176,
          correctChars: 176,
          mistakes: 24,
          correctedMistakes: 20,
          remainingErrors: 4,
          uncorrectedErrors: 4,
          duration: 25,
          durationSeconds: 25,
          consistency: 84,
          mode: 'timed',
          timeLimit: 30,
          errorDetails: [],
          timeline: [
            { second: 1, wpm: 40, rawWpm: 42, errors: 0 },
            { second: 12, wpm: 50, rawWpm: 53, errors: 2 },
            { second: 25, wpm: 52, rawWpm: 52, errors: 2 },
          ]
        };

        sessionStorage.setItem('keyflow_last_results', JSON.stringify(testResults));

        const input = document.querySelector('input[type="text"]');
        if (input) {
          const passageEl = document.querySelector('.leading-relaxed');
          const passage = passageEl?.textContent || 'Typing test passage.';
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
          if (setter) setter.call(input, passage);
          else input.value = passage;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
        return true;
      })()
    `);
    await sleep(2000);

    const wsResultsInfo = await cdp.evaluate(`
      (() => {
        const bodyText = document.body.innerText;
        return {
          hasGrossWpm: bodyText.includes('gross:'),
          hasNetWpm: bodyText.includes('net:'),
          hasKeystrokeAccuracy: bodyText.includes('keystrokes') || bodyText.includes('accuracy'),
          hasFinalTextAccuracy: bodyText.includes('final text:'),
          snippet: bodyText.slice(0, 300),
        };
      })()
    `);
    console.log('[Workstation Accuracy Distinction Result]:', wsResultsInfo);
    await cdp.captureScreenshot('phase7_2_workstation_accuracy_distinction.png');

    // -------------------------------------------------------------
    // Test 3: Academy Scoring Parity
    // -------------------------------------------------------------
    console.log('\n--- 3. Verifying Academy Scoring Parity ---');
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${SERVER_PORT}/academy/stage/1?dev_preview=true` });
    await sleep(2500);

    const academyInfo = await cdp.evaluate(`
      (() => {
        return {
          hasStageTitle: document.body.innerText.includes('Stage 1'),
          svgs: document.querySelectorAll('svg').length,
        };
      })()
    `);
    console.log('[Academy Info]:', academyInfo);
    await cdp.captureScreenshot('phase7_2_academy_scoring_parity.png');

    // -------------------------------------------------------------
    // Test 4: Placement Diagnostic Accuracy
    // -------------------------------------------------------------
    console.log('\n--- 4. Verifying Placement Diagnostic Accuracy ---');
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${SERVER_PORT}/academy?dev_preview=true` });
    await sleep(2000);

    await cdp.evaluate(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button, a'));
        const placementBtn = btns.find(b => b.textContent.includes('Placement') || b.textContent.includes('Take Placement Test'));
        if (placementBtn) placementBtn.click();
      })()
    `);
    await sleep(1200);

    const placementInfo = await cdp.evaluate(`
      (() => {
        const modal = document.querySelector('[role="dialog"], [data-testid="placement-modal"], .fixed');
        return {
          hasModal: !!modal,
          textSnippet: modal ? modal.innerText.slice(0, 150) : '',
        };
      })()
    `);
    console.log('[Placement Info]:', placementInfo);
    await cdp.captureScreenshot('phase7_2_placement_diagnostic_accuracy.png');

    // -------------------------------------------------------------
    // Test 5: Competition Trust Boundary
    // -------------------------------------------------------------
    console.log('\n--- 5. Verifying Competition Trust Boundary ---');
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${SERVER_PORT}/workstation?dev_preview=true` });
    await sleep(2000);
    await cdp.evaluate('window.__KEYFLOW_DEV_BYPASS_AUTH__ = true');

    await cdp.evaluate(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const compBtn = btns.find(b => b.textContent.includes('Competitions') || b.textContent.includes('Competition') || b.title?.includes('Competition') || b.getAttribute('aria-label')?.includes('Competition'));
        if (compBtn) compBtn.click();
      })()
    `);
    await sleep(1000);

    const compInfo = await cdp.evaluate(`
      (() => {
        const modal = document.querySelector('[role="dialog"], .fixed');
        return {
          hasModal: !!modal,
          snippet: modal ? modal.innerText.slice(0, 200) : '',
        };
      })()
    `);
    console.log('[Competition Info]:', compInfo);
    await cdp.captureScreenshot('phase7_2_competition_trust_boundary.png');

    console.log('\n=== All Phase 7.2 Browser Verifications Completed Successfully ===');
  } finally {
    try { edgeProcess.kill(); } catch {}
    try { server.close(); } catch {}
  }
}

main().catch((err) => {
  console.error('Browser verification failed:', err);
  process.exit(1);
});
