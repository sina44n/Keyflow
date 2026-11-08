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
  '.glb': 'model/gltf-binary',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Lightweight Static HTTP Server with SPA fallback
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

async function main() {
  const SERVER_PORT = 5174;
  const CDP_PORT = 9223;

  const server = await startServer(SERVER_PORT);

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const userDataDir = path.join(os.tmpdir(), `edge-cdp-placement-${Date.now()}`);

  console.log(`[Edge] Launching headless browser on CDP port ${CDP_PORT}...`);
  const edgeProcess = spawn(edgePath, [
    `--remote-debugging-port=${CDP_PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${userDataDir}`,
    '--window-size=1280,920',
    'about:blank',
  ], {
    stdio: 'ignore',
  });

  try {
    console.log('Waiting for CDP connection...');
    let tabs = null;
    for (let i = 0; i < 30; i++) {
      try {
        tabs = await fetchJson(`http://127.0.0.1:${CDP_PORT}/json`);
        if (tabs && tabs.length > 0) break;
      } catch {
        await sleep(300);
      }
    }

    if (!tabs || tabs.length === 0) {
      throw new Error(`Could not connect to CDP on port ${CDP_PORT}`);
    }

    const pageTab = tabs.find((t) => t.type === 'page') || tabs[0];
    const client = new CDPClient(pageTab.webSocketDebuggerUrl);
    await client.connect();

    await client.send('Page.enable');
    await client.send('Runtime.enable');

    // Helper to wait for element
    async function waitForElement(selector, timeoutMs = 8000) {
      const startTime = Date.now();
      while (Date.now() - startTime < timeoutMs) {
        const found = await client.evaluate(`Boolean(document.querySelector(${JSON.stringify(selector)}))`);
        if (found) return true;
        await sleep(250);
      }
      return false;
    }

    console.log('\n=== Navigating to Academy Page with Placement Modal Open ===');
    await client.send('Page.navigate', { url: `http://127.0.0.1:${SERVER_PORT}/academy?placement=true&dev_preview=true` });
    await waitForElement('[data-testid="placement-typing-passage"]');
    await sleep(1000);

    // Verify modal state: MUST be in direct typing mode (NO 4 intro cards!)
    const modalCheck = await client.evaluate(`(() => {
      const modal = document.querySelector('div[role="dialog"]');
      if (!modal) return { open: false };
      const title = modal.querySelector('#placement-modal-title')?.textContent;
      const hasBeginBtn = Array.from(modal.querySelectorAll('button')).some(b => b.textContent.includes('Begin Assessment'));
      const hasIntroCards = modal.textContent.includes('Find Your True Typing Level');
      const hasInput = !!modal.querySelector('input');
      const hasSpacebar = modal.textContent.includes('SPACE');
      const passageSnippet = modal.querySelector('[data-testid="placement-typing-passage"]')?.textContent?.slice(0, 80);

      return {
        open: true,
        title,
        hasBeginBtn,
        hasIntroCards,
        hasInput,
        hasSpacebar,
        passageSnippet,
      };
    })()`);
    console.log('[Modal Initial Check]:', modalCheck);

    const shot1 = path.join(artifactDir, 'placement_modal_restored_typing_screen.png');
    await client.screenshot(shot1);

    // 2. Simulate Active Typing & Spacebar Press
    console.log('\n=== Step 2: Simulate Active Typing & Spacebar ===');
    const targetText = await client.evaluate(`(() => {
      const container = document.querySelector('[data-testid="placement-typing-passage"]');
      if (!container) return '';
      return container.innerText.replace(/\\s+/g, ' ').trim();
    })()`);
    console.log(`Target text read from DOM (${targetText.length} chars): "${targetText.slice(0, 70)}..."`);

    // Type first 60 characters
    const firstSnippet = targetText.slice(0, 60);
    await client.evaluate(`(() => {
      const input = document.querySelector('[data-testid="placement-typing-input"]');
      if (!input) return;
      for (const char of ${JSON.stringify(firstSnippet)}) {
        input.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }));
      }
    })()`);
    await sleep(600);

    const activeState = await client.evaluate(`(() => {
      const modal = document.querySelector('div[role="dialog"]');
      return {
        modalFound: !!modal,
        hasClock: modal?.textContent.includes('00:'),
        charsProgress: modal?.textContent.match(/\\d+ \\/ \\d+ characters/)?.[0],
      };
    })()`);
    console.log('[Active Typing State]:', activeState);

    const shot2 = path.join(artifactDir, 'placement_modal_typing_active.png');
    await client.screenshot(shot2);

    // 3. Complete Assessment & Check Results Screen
    console.log('\n=== Step 3: Complete Assessment & View Placement Results ===');
    // Type remaining characters to finish
    const remainingText = targetText.slice(60);
    await client.evaluate(`(() => {
      const input = document.querySelector('[data-testid="placement-typing-input"]');
      if (!input) return;
      for (const char of ${JSON.stringify(remainingText)}) {
        input.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }));
      }
    })()`);
    await waitForElement('[data-testid="placement-results-container"]');
    await sleep(1000);

    const resultsCheck = await client.evaluate(`(() => {
      const modal = document.querySelector('div[role="dialog"]');
      const resultsContainer = document.querySelector('[data-testid="placement-results-container"]');
      if (!resultsContainer) return { hasResults: false };

      const recTitle = resultsContainer.querySelector('h3')?.textContent;
      const recStageBadge = resultsContainer.textContent.match(/Stage \\d+ of 10/)?.[0];
      const hasWpm = resultsContainer.textContent.includes('WPM');
      const hasAccuracy = resultsContainer.textContent.includes('Accuracy');
      const hasStrengths = resultsContainer.textContent.includes('Demonstrated Strengths');
      const hasAreasToImprove = resultsContainer.textContent.includes('Recommended Focus Areas');
      const hasAcceptButton = Array.from(resultsContainer.querySelectorAll('button')).some(b => b.textContent.includes('Accept & Unlock'));

      return {
        hasResults: true,
        recTitle,
        recStageBadge,
        hasWpm,
        hasAccuracy,
        hasStrengths,
        hasAreasToImprove,
        hasAcceptButton,
      };
    })()`);
    console.log('[Results Screen Check]:', resultsCheck);

    const shot3 = path.join(artifactDir, 'placement_modal_results_screen.png');
    await client.screenshot(shot3);

    client.close();
    console.log('\n✅ Placement modal browser verification successfully executed and screenshots captured!');
  } finally {
    try { edgeProcess.kill(); } catch {}
    try { server.close(); } catch {}
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch {}
  }
}

main().catch((err) => {
  console.error('Fatal error during placement modal verification:', err);
  process.exit(1);
});
