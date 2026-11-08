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

// 1. Lightweight Static HTTP Server with SPA fallback
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
  const SERVER_PORT = 5173;
  const CDP_PORT = 9222;

  // 1. Start Server
  const server = await startServer(SERVER_PORT);

  // 2. Launch Edge Headless
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const userDataDir = path.join(os.tmpdir(), `edge-cdp-${Date.now()}`);

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
      } catch {
        await sleep(300);
      }
    }

    if (!tabs || tabs.length === 0) {
      throw new Error(`Could not connect to CDP on port ${CDP_PORT}`);
    }

    const pageTab = tabs.find((t) => t.type === 'page') || tabs[0];
    console.log(`[CDP] Connected to tab: ${pageTab.title} (${pageTab.url})`);

    const client = new CDPClient(pageTab.webSocketDebuggerUrl);
    await client.connect();

    await client.send('Page.enable');
    await client.send('Runtime.enable');

    // Helper to wait for element in DOM
    async function waitForElement(selector, timeoutMs = 8000) {
      const startTime = Date.now();
      while (Date.now() - startTime < timeoutMs) {
        const found = await client.evaluate(`Boolean(document.querySelector(${JSON.stringify(selector)}))`);
        if (found) return true;
        await sleep(250);
      }
      return false;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TEST A: Short Lesson (<= 4 lines) -> Stage 1 Level 1
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n=== TEST A: Short Lesson (S1-L1) ===');
    await client.send('Page.navigate', { url: `http://127.0.0.1:${SERVER_PORT}/academy?lesson=S1-L1&dev_preview=true` });
    await waitForElement('[data-testid="academy-text-viewport"]');
    await sleep(1000);

    const shortState = await client.evaluate(`(() => {
      const viewport = document.querySelector('[data-testid="academy-text-viewport"]');
      const textTrack = document.querySelector('[data-testid="academy-text-track"]');
      const isMultiLine = viewport?.classList.contains('overflow-hidden') || false;
      return {
        isMultiLine,
        hasOverflowHidden: isMultiLine,
        viewportHeight: viewport ? window.getComputedStyle(viewport).height : null,
        trackTransform: textTrack ? window.getComputedStyle(textTrack).transform : null,
      };
    })()`);
    console.log('Short lesson state:', shortState);

    await client.screenshot(path.join(artifactDir, 'academy_scroll_step0_short_lesson.png'));

    // ─────────────────────────────────────────────────────────────────────────
    // TEST B: Multi-Line Lesson (> 4 lines) -> Stage 3 Level 610
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n=== TEST B: Multi-Line Lesson (S3-L610) ===');
    await client.send('Page.navigate', { url: `http://127.0.0.1:${SERVER_PORT}/academy?lesson=S3-L610&dev_preview=true` });
    await waitForElement('[data-testid="academy-text-viewport"]');
    await sleep(1200);

    const pageDiag = await client.evaluate(`(() => {
      return {
        url: window.location.href,
        title: document.title,
        bodySnippet: document.body.innerText.slice(0, 150).replace(/\\n+/g, ' '),
        hasInput: !!document.querySelector('input'),
        inputs: Array.from(document.querySelectorAll('input')).map(i => ({ type: i.type, ariaLabel: i.getAttribute('aria-label') })),
        allSpans: document.querySelectorAll('.typing-char').length,
      };
    })()`);
    console.log('[Page Diag S3-L610]:', pageDiag);

    const initialData = await client.evaluate(`(() => {
      const input = document.querySelector('input.sr-only') || document.querySelector('input[type="text"]');
      const viewport = document.querySelector('[data-testid="academy-text-viewport"]');
      const textTrack = document.querySelector('[data-testid="academy-text-track"]');
      const firstChar = textTrack?.querySelector('.typing-char');
      const allChars = textTrack?.querySelectorAll('.typing-char') || [];
      const lastChar = allChars[allChars.length - 1];
      const lh = viewport ? (parseFloat(window.getComputedStyle(viewport).lineHeight) || 44) : 44;
      const totalLines = lastChar && firstChar ? Math.round((lastChar.getBoundingClientRect().top - firstChar.getBoundingClientRect().top) / lh) + 1 : 0;
      
      return {
        inputFound: !!input,
        totalLines,
        viewportHeight: viewport ? window.getComputedStyle(viewport).height : null,
        maxHeight: viewport ? window.getComputedStyle(viewport).maxHeight : null,
        trackTransform: textTrack ? window.getComputedStyle(textTrack).transform : null,
        allCharsCount: allChars.length,
      };
    })()`);
    console.log('Initial multi-line lesson state:', initialData);
    await client.screenshot(path.join(artifactDir, 'academy_scroll_step1_initial_4lines.png'));

    // Read full exercise text directly from spans
    const targetChars = await client.evaluate(`(() => {
      const allSpans = Array.from(document.querySelectorAll('.typing-char'));
      return allSpans.map(s => s.textContent).join('');
    })()`);
    console.log(`Target text preview (${targetChars?.length || 0} chars): "${targetChars ? targetChars.slice(0, 80) : ''}..."`);

    // Helper to simulate typing into input
    async function typeLength(len) {
      const typed = targetChars ? targetChars.slice(0, len) : '';
      await client.evaluate(`(() => {
        const input = document.querySelector('input.sr-only') || document.querySelector('input[type="text"]');
        if (!input) return;
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(input, ${JSON.stringify(typed)});
        input.dispatchEvent(new Event('input', { bubbles: true }));
      })()`);
      await sleep(400);
      return await client.evaluate(`(() => {
        const activeSpan = document.querySelector('.char-current');
        const viewport = document.querySelector('[data-testid="academy-text-viewport"]');
        const textTrack = document.querySelector('[data-testid="academy-text-track"]');
        const firstChar = textTrack?.querySelector('.typing-char');
        const lh = viewport ? (parseFloat(window.getComputedStyle(viewport).lineHeight) || 44) : 44;
        const activeRow = activeSpan && firstChar ? Math.round((activeSpan.getBoundingClientRect().top - firstChar.getBoundingClientRect().top) / lh) : 0;
        return {
          activeRow,
          transform: textTrack ? window.getComputedStyle(textTrack).transform : null,
        };
      })()`);
    }

    // Step 2: Type Line 1 (~35 chars)
    console.log('\n--- Typing Line 1 ---');
    const s2 = await typeLength(35);
    console.log('After typing Line 1:', s2);
    await client.screenshot(path.join(artifactDir, 'academy_scroll_step2_line1_typed.png'));

    // Step 3: Type Line 2 (~75 chars)
    console.log('\n--- Typing Line 2 ---');
    const s3 = await typeLength(75);
    console.log('After typing Line 2:', s3);
    await client.screenshot(path.join(artifactDir, 'academy_scroll_step3_line2_typed.png'));

    // Step 4: Entering Line 3 (Critical Transition!) (~115 chars)
    console.log('\n--- Entering Line 3 (First Scroll Trigger) ---');
    const s4 = await typeLength(115);
    console.log('After entering Line 3:', s4);
    await client.screenshot(path.join(artifactDir, 'academy_scroll_step4_line3_scrolled.png'));

    // Step 5: Entering Line 4 (~155 chars)
    console.log('\n--- Entering Line 4 (Second Scroll Trigger) ---');
    const s5 = await typeLength(155);
    console.log('After entering Line 4:', s5);
    await client.screenshot(path.join(artifactDir, 'academy_scroll_step5_line4_scrolled.png'));

    // Step 6: Backspacing back to Line 2 (~75 chars)
    console.log('\n--- Backspacing back to Line 2 ---');
    const s6 = await typeLength(75);
    console.log('After backspacing to Line 2:', s6);
    await client.screenshot(path.join(artifactDir, 'academy_scroll_step6_backspace_reversed.png'));

    client.close();
    console.log('\n✅ All browser verification steps and screenshots completed successfully!');
  } finally {
    // Clean up Edge process and server
    try { edgeProcess.kill(); } catch {}
    try { server.close(); } catch {}
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch {}
  }
}

main().catch((err) => {
  console.error('Fatal error during visual verification:', err);
  process.exit(1);
});
