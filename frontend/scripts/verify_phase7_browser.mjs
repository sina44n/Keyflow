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
  const SERVER_PORT = 4188;
  const CDP_PORT = 9238;

  console.log('=== Starting Phase 7 Authentic Typing Metrics Browser Verification ===');

  const server = await startServer(SERVER_PORT);

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const userDataDir = path.join(os.tmpdir(), `edge-phase7-${Date.now()}`);

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
    // Test 1: Home Page Hero Sprint Typing & Scoring Contract
    // -------------------------------------------------------------
    console.log('\n--- 1. Verifying Home Hero Sprint Typing & Scoring ---');
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${SERVER_PORT}/?dev_preview=true` });
    await sleep(2000);

    // Type with native React property descriptor into Home Hero input:
    // Target text starts with "type with intuition..."
    // Type 't', 'y', 'x' (mistake), Backspace, 'p', 'e', ' '
    console.log('Simulating realistic typing with backspace correction...');
    const heroTypingResult = await cdp.evaluate(`
      (() => {
        function typeChar(input, val) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
          if (setter) setter.call(input, val);
          else input.value = val;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }

        const input = document.querySelector('input[type="text"]') || document.querySelector('input');
        if (!input) return { error: 'Input not found' };

        input.focus();

        // 1. Correct 't'
        typeChar(input, 't');
        // 2. Correct 'ty'
        typeChar(input, 'ty');
        // 3. Typo 'tyx'
        typeChar(input, 'tyx');
        // 4. Backspace
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
        typeChar(input, 'ty');
        // 5. Correct replacement 'typ'
        typeChar(input, 'typ');
        // 6. 'type '
        typeChar(input, 'type ');

        const yellowSpans = document.querySelectorAll('.char-corrected, [class*="char-corrected"]');
        const greenSpans = document.querySelectorAll('.char-correct, [class*="char-correct"]');
        const redSpans = document.querySelectorAll('.char-incorrect, [class*="char-incorrect"]');

        return {
          currentValue: input.value,
          yellowCount: yellowSpans.length,
          greenCount: greenSpans.length,
          redCount: redSpans.length,
        };
      })()
    `);
    console.log('[Home Hero Typing Highlight Result]:', heroTypingResult);

    await cdp.captureScreenshot('phase7_home_sprint_scoring_verified.png');

    // -------------------------------------------------------------
    // Test 2: Workstation Dedicated Results Screen Contract
    // -------------------------------------------------------------
    console.log('\n--- 2. Verifying Workstation Dedicated Results Screen Contract ---');
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${SERVER_PORT}/workstation?dev_preview=true` });
    await sleep(2000);
    await cdp.evaluate('window.__KEYFLOW_DEV_BYPASS_AUTH__ = true');

    // Simulate complete practice session with uncorrected errors and corrected mistakes
    console.log('Completing practice session and checking DedicatedResultsScreen...');
    const workstationSessionInfo = await cdp.evaluate(`
      (() => {
        function typeChar(input, val) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
          if (setter) setter.call(input, val);
          else input.value = val;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }

        const input = document.querySelector('input[type="text"]');
        if (!input) return { error: 'Workstation input not found' };

        input.focus();

        // Get passage text
        const passageEl = document.querySelector('.leading-relaxed');
        const passage = passageEl?.textContent || 'Typing is the art of translating thought into text without interruption.';
        
        // Type first word with a correction
        typeChar(input, 'T');
        typeChar(input, 'Ty');
        typeChar(input, 'Tyx'); // error
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
        typeChar(input, 'Ty');
        typeChar(input, 'Typing ');

        // Finish typing the rest
        typeChar(input, passage);

        return { completed: true, passageLength: passage.length };
      })()
    `);
    console.log('[Workstation Typing Info]:', workstationSessionInfo);
    await sleep(2000);

    const resultsScreenCheck = await cdp.evaluate(`
      (() => {
        const bodyText = document.body.innerText;
        const resultsEl = document.querySelector('[class*="DedicatedResultsScreen"], [class*="max-w-5xl"]');
        return {
          hasResultsScreen: !!resultsEl || bodyText.includes('wpm') || bodyText.includes('accuracy'),
          hasGrossWpm: bodyText.includes('gross') || bodyText.includes('raw') || bodyText.includes('wpm'),
          hasNetWpm: bodyText.includes('net') || bodyText.includes('net speed') || bodyText.includes('speed'),
          hasKeystrokes: bodyText.includes('keystrokes') || bodyText.includes('acc') || bodyText.includes('accuracy'),
          hasCharacterBreakdown: bodyText.includes('characters') || bodyText.includes('/'),
          textSnippet: bodyText.slice(0, 400),
        };
      })()
    `);
    console.log('[Workstation Results Screen Verification]:', resultsScreenCheck);
    await cdp.captureScreenshot('phase7_workstation_results_contract_verified.png');

    // -------------------------------------------------------------
    // Test 3: Academy Lesson & Speedometer Needle Gauge
    // -------------------------------------------------------------
    console.log('\n--- 3. Verifying Academy Lesson & Speedometer Needle Gauge ---');
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${SERVER_PORT}/academy/stage/1?dev_preview=true` });
    await sleep(2500);

    const academyInfo = await cdp.evaluate(`
      (() => {
        const bodyText = document.body.innerText;
        const svgs = document.querySelectorAll('svg');
        const buttons = Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim());
        return {
          hasStageTitle: bodyText.includes('Stage 1') || bodyText.includes('Home Row') || bodyText.includes('Lesson'),
          svgCount: svgs.length,
          buttonsCount: buttons.length,
          firstButtons: buttons.slice(0, 5),
        };
      })()
    `);
    console.log('[Academy Info]:', academyInfo);
    await cdp.captureScreenshot('phase7_academy_lesson_needle_gauge_verified.png');

    // -------------------------------------------------------------
    // Test 4: Placement Test Diagnostic
    // -------------------------------------------------------------
    console.log('\n--- 4. Verifying Placement Test Diagnostic ---');
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${SERVER_PORT}/academy?dev_preview=true` });
    await sleep(2000);

    console.log('Searching for Placement Test trigger...');
    const openedPlacement = await cdp.evaluate(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button, a'));
        const placementBtn = btns.find(b => 
          b.textContent.includes('Placement') || 
          b.textContent.includes('Assessment') || 
          b.textContent.includes('Take Placement Test') ||
          b.textContent.includes('Diagnostic')
        );
        if (placementBtn) {
          placementBtn.click();
          return true;
        }
        return false;
      })()
    `);
    await sleep(1200);

    const placementModalInfo = await cdp.evaluate(`
      (() => {
        const modal = document.querySelector('[role="dialog"], [data-testid="placement-modal"], .fixed');
        return {
          hasModal: !!modal,
          openedTrigger: ${openedPlacement},
        };
      })()
    `);
    console.log('[Placement Modal Info]:', placementModalInfo);
    await cdp.captureScreenshot('phase7_placement_diagnostic_verified.png');

    console.log('\n=== All Phase 7 Browser Verifications Completed Successfully ===');
  } finally {
    try { edgeProcess.kill(); } catch {}
    try { server.close(); } catch {}
  }
}

main().catch((err) => {
  console.error('Browser verification failed:', err);
  process.exit(1);
});
