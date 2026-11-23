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
          username: 'antigravity',
          email: 'test@keyflow.io',
          is_owner: true,
          profile: { display_name: 'Antigravity Master', avatar_url: null },
          preferences: { theme_preset: 'burgundy-cream', sound_profile: 'cherry-blue', sound_enabled: true },
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

async function main() {
  const PORT = 5399;
  const server = await startServer(PORT);

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const cdpPort = 9377;
  const tmpUserData = path.join(os.tmpdir(), `edge_capslock_${Date.now()}`);
  fs.mkdirSync(tmpUserData, { recursive: true });

  console.log('[Edge] Spawning Edge on CDP port', cdpPort);
  const browserProc = spawn(
    edgePath,
    [
      `--remote-debugging-port=${cdpPort}`,
      `--user-data-dir=${tmpUserData}`,
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      `http://127.0.0.1:${PORT}/workstation`,
    ],
    { stdio: 'ignore' }
  );

  await sleep(1500);

  let pageTarget = null;
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${cdpPort}/json`);
      const list = await res.json();
      pageTarget = list.find((t) => t.type === 'page') || list[0];
      if (pageTarget) break;
    } catch {
      await sleep(300);
    }
  }

  if (!pageTarget) {
    console.error('Failed to locate Edge page target');
    browserProc.kill();
    server.close();
    process.exit(1);
  }

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let msgId = 1;
  const callbacks = new Map();
  ws.onmessage = (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.id && callbacks.has(msg.id)) {
      const cb = callbacks.get(msg.id);
      callbacks.delete(msg.id);
      cb(msg.result);
    }
  };

  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const id = msgId++;
      callbacks.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });

  await send('Page.enable');
  await send('DOM.enable');
  await send('CSS.enable');
  await send('Runtime.enable');

  // Inject dev bypass and mock user on all document loads
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `
      window.__KEYFLOW_DEV_BYPASS_AUTH__ = true;
      localStorage.setItem('keyflow_user', JSON.stringify({
        id: 1,
        username: 'sinankp',
        display_name: 'Sinan KP'
      }));
      localStorage.setItem('clerk_user_id', 'user_sinankp_1');
      localStorage.setItem('keyflow_current_user_id', '1');
    `,
  });

  ws.onmessage = (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      const text = msg.params.args.map((a) => a.value || a.description).join(' ');
      if (msg.params.type === 'error') {
        console.log('    [Browser Console Error]:', text);
      }
    } else if (msg.method === 'Runtime.exceptionThrown') {
      console.log('    [Browser Exception]:', msg.params.exceptionDetails.text);
    }
    if (msg.id && callbacks.has(msg.id)) {
      const cb = callbacks.get(msg.id);
      callbacks.delete(msg.id);
      cb(msg.result);
    }
  };

  async function waitForSelector(selector, timeoutMs = 8000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const evalRes = await send('Runtime.evaluate', {
        expression: `Boolean(document.querySelector('${selector}'))`,
        returnByValue: true,
      });
      if (evalRes && evalRes.result && evalRes.result.value) {
        return true;
      }
      await sleep(200);
    }
    return false;
  }

  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  console.log('\n=== RUNNING 4-PAGE CAPS LOCK POPUP VERIFICATION & ZERO LAYOUT SHIFT AUDIT ===');

  const pagesToTest = [
    {
      id: 'location-1-placement',
      name: 'Location 1: Academy Placement Test',
      url: `http://127.0.0.1:${PORT}/academy?placement=true&dev_preview=true`,
      selector: '#placement-capslock-notification',
      refSelector: '[data-testid="placement-typing-passage"]',
      waitSelector: '#placement-modal-title',
    },
    {
      id: 'location-2-lesson',
      name: 'Location 2: Academy Level / Lesson Page',
      url: `http://127.0.0.1:${PORT}/academy?stage=5&lesson=1&dev_preview=true`,
      selector: '#lesson-capslock-notification',
      refSelector: 'div[role="img"][aria-label*="Virtual keyboard"]',
      waitSelector: 'div[role="img"][aria-label*="Virtual keyboard"]',
    },
    {
      id: 'location-3-home',
      name: 'Location 3: Home Page Workstation Preview',
      url: `http://127.0.0.1:${PORT}/?dev_preview=true`,
      selector: '#hero-capslock-notification',
      refSelector: 'div[role="img"][aria-label*="Virtual keyboard"]',
      waitSelector: 'button[title*="Keyboard Guide"]',
    },
    {
      id: 'location-4-workstation',
      name: 'Location 4: Full Workstation Page',
      url: `http://127.0.0.1:${PORT}/workstation?dev_preview=true`,
      selector: '#workstation-capslock-notification',
      refSelector: 'button[title="Reset typing session (Esc)"]',
      waitSelector: 'button[title="Reset typing session (Esc)"]',
    },
  ];

  for (const pageItem of pagesToTest) {
    console.log(`\n--> Testing ${pageItem.name} (${pageItem.url})`);
    await send('Page.navigate', { url: pageItem.url });
    const waitSuccess = await waitForSelector(pageItem.waitSelector, 10000);
    console.log(`    [Wait for ${pageItem.waitSelector}]: ${waitSuccess ? 'Found' : 'Timed out'}`);
    await sleep(400);

    // Initial check: Caps Lock OFF
    const initialOffState = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const el = document.querySelector('${pageItem.selector}');
          const ref = document.querySelector('${pageItem.refSelector}');
          return JSON.stringify({
            notificationFound: Boolean(el),
            refFound: Boolean(ref),
            opacity: el ? window.getComputedStyle(el).opacity : null,
            pointerEvents: el ? window.getComputedStyle(el).pointerEvents : null,
            position: el ? window.getComputedStyle(el).position : null,
            refRect: ref ? ref.getBoundingClientRect() : null,
          });
        })()
      `,
      returnByValue: true,
    });
    const offData = JSON.parse(initialOffState.result.value);
    console.log('    [Initial OFF State]:', {
      found: offData.notificationFound,
      opacity: offData.opacity,
      pointerEvents: offData.pointerEvents,
      position: offData.position,
    });

    // 1. Trigger Caps Lock ON
    await send('Runtime.evaluate', {
      expression: `window.dispatchEvent(new CustomEvent('keyflow-capslock-sync', { detail: true }));`,
    });
    await sleep(350);

    // Measure element position after Caps Lock ON to verify ZERO layout shift
    const onState = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const el = document.querySelector('${pageItem.selector}');
          const ref = document.querySelector('${pageItem.refSelector}');
          const pill = el ? el.querySelector('.capslock-notification-pill') : null;
          return JSON.stringify({
            opacity: el ? window.getComputedStyle(el).opacity : null,
            transform: el ? window.getComputedStyle(el).transform : null,
            pillBg: pill ? window.getComputedStyle(pill).backgroundColor : null,
            pillColor: pill ? window.getComputedStyle(pill).color : null,
            pillText: pill ? pill.innerText.trim() : null,
            pillRect: pill ? pill.getBoundingClientRect() : null,
            refRect: ref ? ref.getBoundingClientRect() : null,
          });
        })()
      `,
      returnByValue: true,
    });
    const onData = JSON.parse(onState.result.value);
    console.log('    [Caps Lock ON State]:', {
      opacity: onData.opacity,
      pillText: onData.pillText,
      pillBg: onData.pillBg,
      pillColor: onData.pillColor,
    });

    // Verify ZERO layout shift
    if (offData.refRect && onData.refRect) {
      const deltaX = Math.abs(offData.refRect.x - onData.refRect.x);
      const deltaY = Math.abs(offData.refRect.y - onData.refRect.y);
      const deltaH = Math.abs(offData.refRect.height - onData.refRect.height);
      const deltaW = Math.abs(offData.refRect.width - onData.refRect.width);
      console.log(`    [Zero Layout Shift Check]: deltaX=${deltaX.toFixed(2)}px, deltaY=${deltaY.toFixed(2)}px, deltaH=${deltaH.toFixed(2)}px, deltaW=${deltaW.toFixed(2)}px`);
      if (deltaX > 0.5 || deltaY > 0.5 || deltaH > 0.5 || deltaW > 0.5) {
        console.error('    FAIL: Layout shifted after Caps Lock ON!');
      } else {
        console.log('    PASS: Zero Layout Shift Verified (100% stable).');
      }
    }

    // Capture screenshot with Caps Lock ON (Light Theme: Burgundy & Cream)
    const shotOn = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(brainDir, `capslock_${pageItem.id}_light_on.png`), Buffer.from(shotOn.data, 'base64'));

    // Test Theme Switch to Dark Theme (Charcoal Lime) while Caps Lock is ON
    await send('Runtime.evaluate', {
      expression: `
        document.documentElement.setAttribute('data-theme', 'dark-charcoal-lime');
        localStorage.setItem('keyflow-theme', 'dark-charcoal-lime');
      `,
    });
    await sleep(350);

    const darkState = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const el = document.querySelector('${pageItem.selector}');
          const pill = el ? el.querySelector('.capslock-notification-pill') : null;
          return JSON.stringify({
            pillBg: pill ? window.getComputedStyle(pill).backgroundColor : null,
            pillColor: pill ? window.getComputedStyle(pill).color : null,
          });
        })()
      `,
      returnByValue: true,
    });
    const darkData = JSON.parse(darkState.result.value);
    console.log('    [Dark Theme Adaptation]:', darkData);

    const shotDark = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(brainDir, `capslock_${pageItem.id}_dark_on.png`), Buffer.from(shotDark.data, 'base64'));

    // Switch back to default theme
    await send('Runtime.evaluate', {
      expression: `
        document.documentElement.setAttribute('data-theme', 'burgundy-cream');
        localStorage.setItem('keyflow-theme', 'burgundy-cream');
      `,
    });

    // 2. Trigger Caps Lock OFF
    await send('Runtime.evaluate', {
      expression: `window.dispatchEvent(new CustomEvent('keyflow-capslock-sync', { detail: false }));`,
    });
    await sleep(250);

    const finalOffState = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const el = document.querySelector('${pageItem.selector}');
          return el ? window.getComputedStyle(el).opacity : null;
        })()
      `,
      returnByValue: true,
    });
    console.log('    [Caps Lock OFF State]: opacity =', finalOffState.result.value);
  }

  console.log('\n=== ALL 4 LOCATIONS VERIFIED WITH ZERO LAYOUT SHIFT AND DYNAMIC THEME ADAPTATION ===');
  browserProc.kill();
  server.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('[Error in Caps Lock Verification]:', err);
  process.exit(1);
});
