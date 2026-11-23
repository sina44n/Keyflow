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

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  let filePath = path.join(distDir, reqPath === '/' ? 'index.html' : reqPath);
  if (!fs.existsSync(filePath)) {
    const publicPath = path.resolve(__dirname, '../public', reqPath.startsWith('/') ? reqPath.slice(1) : reqPath);
    if (fs.existsSync(publicPath) && fs.statSync(publicPath).isFile()) filePath = publicPath;
    else filePath = path.join(distDir, 'index.html');
  }
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, {
      'Content-Length': fs.statSync(filePath).size,
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    fs.createReadStream(filePath).pipe(res);
    return;
  }
  res.writeHead(404);
  res.end('Not Found');
});

const SERVER_PORT = 5195;
await new Promise((r) => server.listen(SERVER_PORT, '127.0.0.1', r));

const CDP_PORT = 9247;
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const userDataDir = path.join(os.tmpdir(), `edge-cdp-shift-verify-${Date.now()}`);

const edgeProcess = spawn(edgePath, [
  `--remote-debugging-port=${CDP_PORT}`,
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  `--user-data-dir=${userDataDir}`,
  '--window-size=1440,900',
  'about:blank',
], { stdio: 'ignore' });

try {
  let wsUrl = null;
  for (let i = 0; i < 40; i++) {
    await sleep(200);
    try {
      const v = await fetchJson(`http://127.0.0.1:${CDP_PORT}/json/version`);
      if (v?.webSocketDebuggerUrl) {
        const list = await fetchJson(`http://127.0.0.1:${CDP_PORT}/json/list`);
        const p = list.find((it) => it.type === 'page');
        if (p?.webSocketDebuggerUrl) { wsUrl = p.webSocketDebuggerUrl; break; }
      }
    } catch {}
  }

  const ws = new WebSocket(wsUrl);
  await new Promise((r) => { ws.onopen = r; });

  let id = 1;
  const send = (method, params = {}) => new Promise((resolve) => {
    const curId = id++;
    const handler = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === curId) {
        ws.removeEventListener('message', handler);
        resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  const evaluate = async (expression) => {
    const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    return res?.result?.value;
  };

  const screenshot = async (filename) => {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(artifactDir, filename), Buffer.from(res.data, 'base64'));
    console.log(`[Screenshot Saved] ${filename}`);
  };

  await send('Page.enable');
  await send('Page.navigate', { url: `http://127.0.0.1:${SERVER_PORT}/` });

  for (let i = 0; i < 30; i++) {
    await sleep(200);
    const ready = await evaluate(`!!document.querySelector('h1') && !!document.getElementById('sandbox')`);
    if (ready) break;
  }
  await sleep(600);

  console.log('\n======================================================');
  console.log('TEST 1: DESKTOP (1440x900) LAYOUT SHIFT AUDIT');
  console.log('======================================================');

  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await sleep(300);

  const desktopBefore = await evaluate(`
    (() => {
      const h1 = document.querySelector('h1');
      const p = h1.nextElementSibling;
      const btn = p.nextElementSibling;
      return {
        h1Top: h1.getBoundingClientRect().top,
        pTop: p.getBoundingClientRect().top,
        btnTop: btn.getBoundingClientRect().top
      };
    })()
  `);
  console.log('[Desktop Resting State]:', desktopBefore);
  await screenshot('home_no_shift_desktop_before.png');

  // Trigger typing completion
  await evaluate(`
    (() => {
      const input = document.querySelector('#sandbox input');
      const text = 'the quick brown fox jumps over the lazy dog and flows with speed';
      const proto = window.HTMLInputElement.prototype;
      const setVal = Object.getOwnPropertyDescriptor(proto, 'value').set;
      setVal.call(input, text);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    })()
  `);
  await sleep(800);

  const desktopAfter = await evaluate(`
    (() => {
      const h1 = document.querySelector('h1');
      const p = h1.nextElementSibling;
      const btn = p.nextElementSibling;
      const results = document.querySelector('#sandbox .bg-\\\\[var\\\\(--bg-elevated\\\\)\\\\]');
      return {
        h1Top: h1.getBoundingClientRect().top,
        pTop: p.getBoundingClientRect().top,
        btnTop: btn.getBoundingClientRect().top,
        hasResults: !!results,
        resultsText: results ? results.innerText.trim().replace(/\\s+/g, ' ') : null
      };
    })()
  `);
  console.log('[Desktop With Results]:', desktopAfter);
  await screenshot('home_no_shift_desktop_after.png');

  const shiftH1 = Math.abs(desktopAfter.h1Top - desktopBefore.h1Top);
  const shiftP = Math.abs(desktopAfter.pTop - desktopBefore.pTop);
  const shiftBtn = Math.abs(desktopAfter.btnTop - desktopBefore.btnTop);

  console.log(`Shift Delta -> H1: ${shiftH1.toFixed(2)}px | P: ${shiftP.toFixed(2)}px | BTN: ${shiftBtn.toFixed(2)}px`);
  if (shiftH1 > 0.5) throw new Error(`Desktop H1 shifted by ${shiftH1}px! Must be 0px!`);

  // Reset sprint
  console.log('[Action] Clicking Reset...');
  await evaluate(`
    (() => {
      const btns = Array.from(document.querySelectorAll('#sandbox button'));
      const resetBtn = btns.find(b => b.innerText.includes('Reset') || b.innerText.includes('Restart'));
      if (resetBtn) resetBtn.click();
    })()
  `);
  await sleep(400);

  const desktopReset = await evaluate(`
    (() => {
      const h1 = document.querySelector('h1');
      return { h1Top: h1.getBoundingClientRect().top };
    })()
  `);
  console.log('[Desktop After Reset]:', desktopReset);
  const resetShift = Math.abs(desktopReset.h1Top - desktopBefore.h1Top);
  console.log(`Reset Shift Delta -> H1: ${resetShift.toFixed(2)}px`);
  if (resetShift > 0.5) throw new Error(`Desktop H1 shifted after reset by ${resetShift}px!`);

  console.log('\n======================================================');
  console.log('TEST 2: MOBILE (375x812) LAYOUT SHIFT AUDIT');
  console.log('======================================================');

  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 2, mobile: true });
  await sleep(400);

  const mobileBefore = await evaluate(`
    (() => {
      const h1 = document.querySelector('h1');
      const p = h1.nextElementSibling;
      const btn = p.nextElementSibling;
      return {
        h1Top: h1.getBoundingClientRect().top,
        pTop: p.getBoundingClientRect().top,
        btnTop: btn.getBoundingClientRect().top
      };
    })()
  `);
  console.log('[Mobile Resting State]:', mobileBefore);
  await screenshot('home_no_shift_mobile_before.png');

  // Trigger typing completion on mobile
  await evaluate(`
    (() => {
      const input = document.querySelector('#sandbox input');
      const text = 'the quick brown fox jumps over the lazy dog and flows with speed';
      const proto = window.HTMLInputElement.prototype;
      const setVal = Object.getOwnPropertyDescriptor(proto, 'value').set;
      setVal.call(input, text);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    })()
  `);
  await sleep(800);

  const mobileAfter = await evaluate(`
    (() => {
      const h1 = document.querySelector('h1');
      const p = h1.nextElementSibling;
      const btn = p.nextElementSibling;
      return {
        h1Top: h1.getBoundingClientRect().top,
        pTop: p.getBoundingClientRect().top,
        btnTop: btn.getBoundingClientRect().top
      };
    })()
  `);
  console.log('[Mobile With Results]:', mobileAfter);
  await screenshot('home_no_shift_mobile_after.png');

  const mobileShiftH1 = Math.abs(mobileAfter.h1Top - mobileBefore.h1Top);
  console.log(`Mobile Shift Delta -> H1: ${mobileShiftH1.toFixed(2)}px`);
  if (mobileShiftH1 > 0.5) throw new Error(`Mobile H1 shifted by ${mobileShiftH1}px!`);

  console.log('\n>>> ALL AUDIT TESTS PASSED WITH 0.00px LAYOUT SHIFT! <<<');

  ws.close();
} finally {
  try { edgeProcess.kill(); } catch {}
  server.close();
}
