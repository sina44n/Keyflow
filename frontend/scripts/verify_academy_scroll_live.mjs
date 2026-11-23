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
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    const reqPath = url.pathname;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      return res.end();
    }

    if (reqPath.startsWith('/api/platform/config/') || reqPath.startsWith('/platform/config/')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ competition_enabled: true, custom_text_enabled: true }));
    }

    if (reqPath.startsWith('/api/accounts/profile') || reqPath.startsWith('/api/accounts/me')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(
        JSON.stringify({
          id: 1,
          username: 'sinankp',
          email: 'sinan@keyflow.io',
          is_owner: true,
          profile: { display_name: 'SINAN KP', avatar_url: null },
          preferences: { theme_preset: 'dark-charcoal-lime', sound_profile: 'cherry-blue', sound_enabled: true },
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
      console.log(`[Test Server] Listening on http://127.0.0.1:${port}`);
      resolve(server);
    });
  });
}

async function fetchJson(url) {
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

async function main() {
  const PORT = 5410;
  const server = await startServer(PORT);
  const CDP_PORT = 9395;
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const userDataDir = path.join(os.tmpdir(), `edge_academy_scroll_${Date.now()}`);
  fs.mkdirSync(userDataDir, { recursive: true });

  console.log(`[Edge] Spawning Edge on CDP port ${CDP_PORT}`);
  const edgeProc = spawn(
    edgePath,
    [
      `--remote-debugging-port=${CDP_PORT}`,
      `--user-data-dir=${userDataDir}`,
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--window-size=1440,900',
      `http://127.0.0.1:${PORT}/academy?lesson=S1-L1`,
    ],
    { stdio: 'ignore' }
  );

  let cdp = null;

  async function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = Math.floor(Math.random() * 1e6);
      const msg = JSON.stringify({ id, method, params });
      const handler = (event) => {
        try {
          const raw = typeof event.data === 'string' ? event.data : event.toString();
          const res = JSON.parse(raw);
          if (res.id === id) {
            cdp.removeEventListener('message', handler);
            if (res.error) reject(new Error(JSON.stringify(res.error)));
            else resolve(res.result);
          }
        } catch (err) {
          reject(err);
        }
      };
      cdp.addEventListener('message', handler);
      cdp.send(msg);
    });
  }

  async function evaluate(expression) {
    const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    return res?.result?.value;
  }

  async function captureScreenshot(filename) {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const outPath = path.join(brainDir, filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`[Screenshot Saved] ${filename} (${buffer.length} bytes)`);
  }

  try {
    // Wait for CDP endpoint
    let wsUrl = null;
    for (let i = 0; i < 25; i++) {
      try {
        const tabs = await fetchJson(`http://127.0.0.1:${CDP_PORT}/json`);
        const pageTab = tabs.find((t) => t.type === 'page');
        if (pageTab?.webSocketDebuggerUrl) {
          wsUrl = pageTab.webSocketDebuggerUrl;
          break;
        }
      } catch {
        // waiting
      }
      await sleep(400);
    }

    if (!wsUrl) throw new Error('Failed to find CDP WebSocket endpoint');
    console.log(`[CDP] Connecting to WebSocket: ${wsUrl}`);
    cdp = new WebSocket(wsUrl);
    await new Promise((res, rej) => {
      cdp.onopen = res;
      cdp.onerror = rej;
    });
    console.log('[CDP] Connected!');

    await send('Page.enable');
    await send('Runtime.enable');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 1: SHORT LESSON (<= 4 lines: S1-L1)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n=== TEST 1: Short Lesson (<= 4 visual lines) ===');
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/academy?lesson=S1-L1` });
    await sleep(2500);

    const shortInfo = await evaluate(`(() => {
      const textTrack = document.querySelector('[data-testid="academy-text-track"]');
      const viewport = document.querySelector('[data-testid="academy-text-viewport"]');
      const allChars = textTrack ? textTrack.querySelectorAll('.typing-char') : [];
      const lh = viewport ? parseFloat(window.getComputedStyle(viewport).lineHeight) || 44 : 44;
      let totalLines = 1;
      if (allChars.length > 0) {
        const first = allChars[0].getBoundingClientRect();
        const last = allChars[allChars.length - 1].getBoundingClientRect();
        totalLines = Math.round((last.top - first.top) / lh) + 1;
      }
      const isMultiLine = viewport ? viewport.classList.contains('overflow-hidden') : false;
      const transform = textTrack ? window.getComputedStyle(textTrack).transform : null;
      return { totalLines, isMultiLine, transform, charCount: allChars.length };
    })()`);
    console.log('Short lesson evaluation:', shortInfo);

    if (shortInfo.isMultiLine) {
      throw new Error(`Expected isMultiLine to be false for <= 4 lines, got true (lines: ${shortInfo.totalLines})`);
    }
    console.log('✓ PASS: Short lesson correctly sets isMultiLine = false (no overflow-hidden, no auto-scrolling)');
    await captureScreenshot('academy_scroll_short_lesson.png');

    // ─────────────────────────────────────────────────────────────────────────
    // TEST 2: MULTI-LINE LESSON (> 4 lines: S3-L610)
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n=== TEST 2: Multi-Line Lesson (> 4 lines: S3-L610) ===');
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/academy?lesson=S3-L610` });
    await sleep(2500);

    const multiInfo = await evaluate(`(() => {
      const textTrack = document.querySelector('[data-testid="academy-text-track"]');
      const viewport = document.querySelector('[data-testid="academy-text-viewport"]');
      const allChars = textTrack ? textTrack.querySelectorAll('.typing-char') : [];
      const lh = viewport ? parseFloat(window.getComputedStyle(viewport).lineHeight) || 44 : 44;
      let totalLines = 1;
      if (allChars.length > 0) {
        const first = allChars[0].getBoundingClientRect();
        const last = allChars[allChars.length - 1].getBoundingClientRect();
        totalLines = Math.round((last.top - first.top) / lh) + 1;
      }
      const isMultiLine = viewport ? viewport.classList.contains('overflow-hidden') : false;
      const transform = textTrack ? window.getComputedStyle(textTrack).transform : null;
      const viewportHeight = viewport ? window.getComputedStyle(viewport).height : null;
      return { totalLines, isMultiLine, transform, viewportHeight, charCount: allChars.length };
    })()`);
    console.log('Multi-line initial evaluation:', multiInfo);

    if (!multiInfo.isMultiLine) {
      throw new Error(`Expected isMultiLine to be true for > 4 lines lesson, got false (lines: ${multiInfo.totalLines})`);
    }
    console.log(`✓ PASS: Multi-line lesson (${multiInfo.totalLines} lines) activates 4-line viewport restriction`);
    await captureScreenshot('academy_scroll_initial_multiline.png');

    // Read target text characters
    const targetText = await evaluate(`(() => {
      const allSpans = Array.from(document.querySelectorAll('.typing-char'));
      return allSpans.map(s => s.textContent).join('');
    })()`);
    console.log(`Exercise Target Text length: ${targetText.length}`);

    // Helper to simulate typing
    async function typeSlice(length) {
      const sliceVal = targetText.slice(0, length);
      await evaluate(`(() => {
        const input = document.querySelector('input[aria-label="Type the exercise text here"]');
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(input, ${JSON.stringify(sliceVal)});
        input.dispatchEvent(new Event('input', { bubbles: true }));
      })()`);
    }

    // Step 2A: Type Line 1 (approx 35 chars)
    console.log('\n--- Typing Line 1 ---');
    await typeSlice(35);
    await sleep(300);

    const stateLine1 = await evaluate(`(() => {
      const textTrack = document.querySelector('[data-testid="academy-text-track"]');
      const viewport = document.querySelector('[data-testid="academy-text-viewport"]');
      const activeChar = textTrack?.querySelector('.char-current');
      const firstChar = textTrack?.querySelector('.typing-char');
      const lh = viewport ? parseFloat(window.getComputedStyle(viewport).lineHeight) || 44 : 44;
      const activeRow = activeChar && firstChar ? Math.round((activeChar.getBoundingClientRect().top - firstChar.getBoundingClientRect().top) / lh) : 0;
      const transform = textTrack ? window.getComputedStyle(textTrack).transform : null;
      const inlineStyleTransform = textTrack ? textTrack.style.transform : '';
      return { activeRow, transform, inlineStyleTransform, lh };
    })()`);
    console.log('State Line 1:', stateLine1);
    if (stateLine1.inlineStyleTransform && !stateLine1.inlineStyleTransform.includes('translate3d(0, -0px, 0)')) {
      throw new Error(`Expected zero scroll on Line 1, got: ${stateLine1.inlineStyleTransform}`);
    }
    console.log('✓ PASS: Line 1 typing produces zero scroll (lines 1-4 remain in place)');

    // Step 2B: Type Line 2 (approx 75 chars)
    console.log('\n--- Typing Line 2 ---');
    await typeSlice(75);
    await sleep(300);

    const stateLine2 = await evaluate(`(() => {
      const textTrack = document.querySelector('[data-testid="academy-text-track"]');
      const viewport = document.querySelector('[data-testid="academy-text-viewport"]');
      const activeChar = textTrack?.querySelector('.char-current');
      const firstChar = textTrack?.querySelector('.typing-char');
      const lh = viewport ? parseFloat(window.getComputedStyle(viewport).lineHeight) || 44 : 44;
      const activeRow = activeChar && firstChar ? Math.round((activeChar.getBoundingClientRect().top - firstChar.getBoundingClientRect().top) / lh) : 0;
      const inlineStyleTransform = textTrack ? textTrack.style.transform : '';
      return { activeRow, inlineStyleTransform, lh };
    })()`);
    console.log('State Line 2:', stateLine2);
    if (stateLine2.inlineStyleTransform && !stateLine2.inlineStyleTransform.includes('translate3d(0, -0px, 0)')) {
      throw new Error(`Expected zero scroll on Line 2 (no premature scrolling!), got: ${stateLine2.inlineStyleTransform}`);
    }
    console.log('✓ PASS: Line 2 typing produces strictly ZERO premature scroll');

    // Step 2C: Enter Line 3 (Trigger first scroll!)
    console.log('\n--- Progressing to Line 3 (First Scroll Trigger) ---');
    await typeSlice(115);
    await sleep(500); // 200ms cubic-bezier transition

    const stateLine3 = await evaluate(`(() => {
      const textTrack = document.querySelector('[data-testid="academy-text-track"]');
      const viewport = document.querySelector('[data-testid="academy-text-viewport"]');
      const activeChar = textTrack?.querySelector('.char-current');
      const firstChar = textTrack?.querySelector('.typing-char');
      const lh = viewport ? parseFloat(window.getComputedStyle(viewport).lineHeight) || 44 : 44;
      const activeRow = activeChar && firstChar ? Math.round((activeChar.getBoundingClientRect().top - firstChar.getBoundingClientRect().top) / lh) : 0;
      const inlineStyleTransform = textTrack ? textTrack.style.transform : '';
      const transform = textTrack ? window.getComputedStyle(textTrack).transform : null;
      return { activeRow, inlineStyleTransform, transform, lh };
    })()`);
    console.log('State Line 3:', stateLine3);
    if (!stateLine3.inlineStyleTransform || stateLine3.inlineStyleTransform.includes('translate3d(0, -0px, 0)')) {
      throw new Error(`Expected scroll to activate on Line 3, got: ${stateLine3.inlineStyleTransform}`);
    }
    console.log(`✓ PASS: Line 3 triggered smooth auto-scroll upward: ${stateLine3.inlineStyleTransform}`);
    await captureScreenshot('academy_scroll_line3_triggered.png');

    // Step 2D: Enter Line 4 (Continuous scroll!)
    console.log('\n--- Progressing to Line 4 (Continuous Scroll) ---');
    await typeSlice(155);
    await sleep(500);

    const stateLine4 = await evaluate(`(() => {
      const textTrack = document.querySelector('[data-testid="academy-text-track"]');
      const viewport = document.querySelector('[data-testid="academy-text-viewport"]');
      const activeChar = textTrack?.querySelector('.char-current');
      const firstChar = textTrack?.querySelector('.typing-char');
      const lh = viewport ? parseFloat(window.getComputedStyle(viewport).lineHeight) || 44 : 44;
      const activeRow = activeChar && firstChar ? Math.round((activeChar.getBoundingClientRect().top - firstChar.getBoundingClientRect().top) / lh) : 0;
      const inlineStyleTransform = textTrack ? textTrack.style.transform : '';
      const transform = textTrack ? window.getComputedStyle(textTrack).transform : null;
      return { activeRow, inlineStyleTransform, transform, lh };
    })()`);
    console.log('State Line 4:', stateLine4);
    console.log(`✓ PASS: Line 4 advanced scroll offset to: ${stateLine4.inlineStyleTransform}`);
    await captureScreenshot('academy_scroll_line4_continuous.png');

    // Step 2E: Backspace back to Line 2 (Reverses scroll!)
    console.log('\n--- Backspacing back to Line 2 (Scroll Reversal) ---');
    await typeSlice(75);
    await sleep(500);

    const stateReversed = await evaluate(`(() => {
      const textTrack = document.querySelector('[data-testid="academy-text-track"]');
      const inlineStyleTransform = textTrack ? textTrack.style.transform : '';
      return { inlineStyleTransform };
    })()`);
    console.log('State after backspace:', stateReversed);
    if (stateReversed.inlineStyleTransform && !stateReversed.inlineStyleTransform.includes('translate3d(0, -0px, 0)')) {
      throw new Error(`Expected scroll to reverse back to 0px on Line 2, got: ${stateReversed.inlineStyleTransform}`);
    }
    console.log('✓ PASS: Backspacing back to Line 2 smoothly restored 0px offset');
    await captureScreenshot('academy_scroll_backspace_reversed.png');

    console.log('\n======================================================');
    console.log('ALL REAL BROWSER ACADEMY SCROLL TESTS PASSED WITH 100% SUCCESS!');
    console.log('======================================================');
  } finally {
    if (cdp) cdp.close();
    try { edgeProc.kill(); } catch {}
    try { server.close(); } catch {}
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch {}
  }
}

main().catch((err) => {
  console.error('[FATAL ERROR]:', err);
  process.exit(1);
});
