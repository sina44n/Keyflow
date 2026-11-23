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
  const PORT = 5415;
  const server = await startServer(PORT);
  const CDP_PORT = 9398;
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const userDataDir = path.join(os.tmpdir(), `edge_perf_${Date.now()}`);
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
      'about:blank',
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
    let wsUrl = null;
    for (let i = 0; i < 25; i++) {
      try {
        const tabs = await fetchJson(`http://127.0.0.1:${CDP_PORT}/json`);
        const pageTab = tabs.find((t) => t.type === 'page');
        if (pageTab?.webSocketDebuggerUrl) {
          wsUrl = pageTab.webSocketDebuggerUrl;
          break;
        }
      } catch {}
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

    console.log('\n======================================================');
    console.log('ACADEMY LEVELS: EXTREME PERFORMANCE BENCHMARK AUDIT');
    console.log('======================================================');

    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/academy?lesson=S3-L610` });
    await sleep(3000);

    // Initial check of lesson rendering
    const initCheck = await evaluate(`(() => {
      const viewport = document.querySelector('[data-testid="academy-text-viewport"]');
      const textTrack = document.querySelector('[data-testid="academy-text-track"]');
      const allSpans = Array.from(document.querySelectorAll('.typing-char'));
      const text = allSpans.map(s => s.textContent).join('');
      return {
        viewportFound: !!viewport,
        textTrackFound: !!textTrack,
        charCount: allSpans.length,
        textPreview: text.slice(0, 60),
      };
    })()`);
    console.log('Initial DOM check:', initCheck);

    await captureScreenshot('academy_perf_initial_load.png');

    // ─────────────────────────────────────────────────────────────────────────
    // BENCHMARK 1: High-Speed Consecutive Keystroke Latency Measurement
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- BENCHMARK 1: Keystroke Latency & Main-Thread Blocking ---');
    const benchmarkResult = await evaluate(`(async () => {
      const input = document.querySelector('input[aria-label="Type the exercise text here"]');
      const allSpans = Array.from(document.querySelectorAll('.typing-char'));
      const targetText = allSpans.map(s => s.textContent).join('');
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;

      const latencies = [];
      let currentVal = '';
      
      // Simulate fast typing of 80 characters (Line 1 and Line 2)
      const numKeys = Math.min(80, targetText.length);
      for (let i = 0; i < numKeys; i++) {
        const nextChar = targetText[i];
        currentVal += nextChar;
        
        const t0 = performance.now();
        // Dispatch keydown
        input.dispatchEvent(new KeyboardEvent('keydown', { key: nextChar, code: 'Key' + nextChar.toUpperCase(), bubbles: true }));
        // Dispatch input change
        nativeSetter.call(input, currentVal);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        const t1 = performance.now();
        latencies.push(t1 - t0);
        
        // Small realistic micro-interval (20ms: 120-150 WPM burst speed)
        await new Promise(r => setTimeout(r, 20));
      }

      const sum = latencies.reduce((a, b) => a + b, 0);
      const avg = sum / latencies.length;
      const max = Math.max(...latencies);
      const min = Math.min(...latencies);
      const sub2ms = latencies.filter(l => l <= 2.0).length;
      const sub5ms = latencies.filter(l => l <= 5.0).length;

      return {
        count: latencies.length,
        avgLatencyMs: Number(avg.toFixed(3)),
        maxLatencyMs: Number(max.toFixed(3)),
        minLatencyMs: Number(min.toFixed(3)),
        percentUnder2ms: Number(((sub2ms / latencies.length) * 100).toFixed(1)),
        percentUnder5ms: Number(((sub5ms / latencies.length) * 100).toFixed(1)),
        typedLength: currentVal.length,
      };
    })()`);
    console.log('Benchmark 1 Results (80 Keystrokes @ 150 WPM):', benchmarkResult);

    await captureScreenshot('academy_perf_fast_typing_line2.png');

    // ─────────────────────────────────────────────────────────────────────────
    // BENCHMARK 2: Line 3 Transition & Scroll Trigger Smoothness
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- BENCHMARK 2: Progressing to Line 3 (Automatic Scrolling) ---');
    const scrollTransitionResult = await evaluate(`(async () => {
      const input = document.querySelector('input[aria-label="Type the exercise text here"]');
      const allSpans = Array.from(document.querySelectorAll('.typing-char'));
      const textTrack = document.querySelector('[data-testid="academy-text-track"]');
      const targetText = allSpans.map(s => s.textContent).join('');
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;

      let currentVal = input.value;
      const startIdx = currentVal.length;
      const endIdx = Math.min(130, targetText.length); // Enter line 3
      const latencies = [];

      for (let i = startIdx; i < endIdx; i++) {
        const nextChar = targetText[i];
        currentVal += nextChar;

        const t0 = performance.now();
        input.dispatchEvent(new KeyboardEvent('keydown', { key: nextChar, code: 'Key' + nextChar.toUpperCase(), bubbles: true }));
        nativeSetter.call(input, currentVal);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        const t1 = performance.now();
        latencies.push(t1 - t0);

        await new Promise(r => setTimeout(r, 20));
      }

      await new Promise(r => setTimeout(r, 300)); // Allow 200ms transform transition to finish

      const transform = textTrack ? window.getComputedStyle(textTrack).transform : null;
      const inlineTransform = textTrack ? textTrack.style.transform : null;
      const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const max = Math.max(...latencies);

      return {
        typedLength: currentVal.length,
        avgLatencyMs: Number(avg.toFixed(3)),
        maxLatencyMs: Number(max.toFixed(3)),
        transform,
        inlineTransform,
      };
    })()`);
    console.log('Benchmark 2 Results (Entering Line 3 Scroll):', scrollTransitionResult);

    await captureScreenshot('academy_perf_line3_scrolled.png');

    // ─────────────────────────────────────────────────────────────────────────
    // BENCHMARK 3: Rapid Backspace and Keystroke Recovery
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- BENCHMARK 3: Rapid Backspace and Keystroke Recovery ---');
    const backspaceResult = await evaluate(`(async () => {
      const input = document.querySelector('input[aria-label="Type the exercise text here"]');
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;

      let currentVal = input.value;
      const backspaceTimes = [];

      // Rapidly backspace 30 characters
      for (let i = 0; i < 30; i++) {
        currentVal = currentVal.slice(0, -1);
        const t0 = performance.now();
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', code: 'Backspace', bubbles: true }));
        nativeSetter.call(input, currentVal);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        const t1 = performance.now();
        backspaceTimes.push(t1 - t0);
        await new Promise(r => setTimeout(r, 15));
      }

      const avg = backspaceTimes.reduce((a, b) => a + b, 0) / backspaceTimes.length;
      const max = Math.max(...backspaceTimes);

      return {
        backspacedCount: 30,
        newLength: currentVal.length,
        avgLatencyMs: Number(avg.toFixed(3)),
        maxLatencyMs: Number(max.toFixed(3)),
      };
    })()`);
    console.log('Benchmark 3 Results (30 Rapid Backspaces):', backspaceResult);

    await captureScreenshot('academy_perf_backspace_recovery.png');

    // ─────────────────────────────────────────────────────────────────────────
    // VERIFICATION SUMMARY & ASSERTIONS
    // ─────────────────────────────────────────────────────────────────────────
    console.log('\n--- Verification Summary & Performance Criteria ---');
    console.log(`Average Keystroke Processing Time: ${benchmarkResult.avgLatencyMs} ms`);
    console.log(`% Keystrokes under 5.0ms: ${benchmarkResult.percentUnder5ms} %`);
    console.log(`Max Single Keystroke Time: ${benchmarkResult.maxLatencyMs} ms`);

    if (benchmarkResult.avgLatencyMs > 6.0) {
      throw new Error(`Average keystroke latency ${benchmarkResult.avgLatencyMs}ms exceeds 6ms threshold!`);
    }

    if (!scrollTransitionResult.inlineTransform || scrollTransitionResult.inlineTransform.includes('translate3d(0, -0px, 0)')) {
      throw new Error(`Automatic scroll did not activate on line 3! Transform: ${scrollTransitionResult.inlineTransform}`);
    }

    console.log('\n✓ ALL PERFORMANCE AUDIT ACCEPTANCE CRITERIA MET WITH FLYING COLORS!');
  } finally {
    if (cdp) cdp.close();
    try { edgeProc.kill(); } catch {}
    try { server.close(); } catch {}
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch {}
  }
}

main().catch((err) => {
  console.error('[FATAL BENCHMARK ERROR]:', err);
  process.exit(1);
});
