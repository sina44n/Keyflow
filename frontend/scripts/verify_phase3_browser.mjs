import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import os from 'node:os';

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

async function runBrowserVerification() {
  const SERVER_PORT = 4173;
  const CDP_PORT = 9225;

  console.log('--- Starting Phase 3 Browser Verification ---');

  // 1. Start Server
  const server = await startServer(SERVER_PORT);

  // 2. Launch Edge Headless
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const userDataDir = path.join(os.tmpdir(), `edge-phase3-${Date.now()}`);

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

    console.log(`Navigating to http://127.0.0.1:${SERVER_PORT}/?dev_preview=true ...`);
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${SERVER_PORT}/?dev_preview=true` });
    await sleep(2500);

    // Set dev bypass flag in browser window for cross-route testing
    await cdp.evaluate('window.__KEYFLOW_DEV_BYPASS_AUTH__ = true; window.sessionStorage.setItem("keyflow_bypass", "true");');

    // 1. Verify absence of banned claims in live DOM text
    const bannedClaims = [
      '0ms Input Latency',
      'Zero-Glance Anchoring',
      '12 Studio Themes',
      '0ms Input Latency • ANSI 60% Virtual Guide',
      'Free for all typists',
      'Zero login required to practice',
      'REST API Ready',
    ];

    const bodyText = await cdp.evaluate('document.body.innerText');

    console.log('\n--- Checking absence of banned marketing claims on live rendered page ---');
    for (const claim of bannedClaims) {
      const found = bodyText.includes(claim);
      console.log(`Claim "${claim}": ${found ? 'FAIL (present in body)' : 'PASS (absent)'}`);
      if (found) throw new Error(`Claim "${claim}" was found in live rendered page!`);
    }

    // 2. Dynamic stage count checks
    console.log('\n--- Checking dynamic stage count derivation ---');
    const heroAcademyBtn = await cdp.evaluate(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const found = btns.find(b => b.innerText.includes('Explore') && b.innerText.includes('Academy'));
        return found ? found.innerText : null;
      })()
    `);
    console.log(`Hero CTA Academy Button: "${heroAcademyBtn}"`);
    if (!heroAcademyBtn || !heroAcademyBtn.includes('10-Stage Academy')) {
      throw new Error(`Expected dynamic "Explore 10-Stage Academy", got "${heroAcademyBtn}"`);
    }

    const ctaAcademyBtn = await cdp.evaluate(`
      (() => {
        const btns = Array.from(document.querySelectorAll('section button'));
        const found = btns.find(b => b.innerText.includes('10-Stage Academy'));
        return found ? found.innerText : null;
      })()
    `);
    console.log(`CTA Section Academy Button: "${ctaAcademyBtn}"`);
    if (!ctaAcademyBtn) {
      throw new Error('CTA Section Academy button not found or missing 10-Stage Academy');
    }

    // 3. Status chip check
    const statusChip = await cdp.evaluate(`
      (() => {
        const el = document.querySelector('.inline-flex.items-center.gap-2.px-3.py-1');
        return el ? el.innerText : null;
      })()
    `);
    console.log(`Hero Status Chip: "${statusChip}"`);
    if (!statusChip.includes('Interactive ANSI 60% Virtual Guide')) {
      throw new Error(`Status chip unexpected text: "${statusChip}"`);
    }

    // 4. Micro Highlights check
    const microHighlights = await cdp.evaluate(`
      (() => {
        const container = document.querySelector('.pt-2.flex.flex-wrap.items-center.gap-x-5');
        return container ? container.innerText : null;
      })()
    `);
    console.log(`Micro Highlights: "${microHighlights}"`);
    if (microHighlights.includes('0ms') || microHighlights.includes('Zero-Glance') || microHighlights.includes('12')) {
      throw new Error(`Micro highlights contain banned claims: "${microHighlights}"`);
    }

    // 5. Architecture Pillars check
    const pillars = await cdp.evaluate(`
      (() => {
        const headings = Array.from(document.querySelectorAll('h3'));
        return headings.map(h => h.innerText.trim());
      })()
    `);
    console.log("All H3 Headings on page:", pillars);
    if (!pillars.includes('Sub-Millisecond Engine') || !pillars.some(p => p.includes('10-Stage') && p.includes('Academy')) || !pillars.some(p => p.includes('Themes'))) {
      throw new Error(`3 Pillars unexpected: ${JSON.stringify(pillars)}`);
    }

    // 6. Footer Stages check
    const footerStages = await cdp.evaluate(`
      (() => {
        const links = Array.from(document.querySelectorAll('footer a[href*="stage="]'));
        return links.map(l => ({ text: l.innerText, href: l.getAttribute('href') }));
      })()
    `);
    console.log(`Footer Stages Count: ${footerStages.length}`);
    console.log(`Footer First Stage:`, footerStages[0]);
    console.log(`Footer Tenth Stage:`, footerStages[footerStages.length - 1]);
    if (footerStages.length !== 10) {
      throw new Error(`Expected 10 footer stages, found ${footerStages.length}`);
    }

    // 7. Test immediate typing readiness on Home sprint
    console.log('\n--- Testing immediate typing readiness on Home Sprint ---');
    const activeElTag = await cdp.evaluate('document.activeElement.tagName');
    console.log(`Active focused element on mount: <${activeElTag}>`);

    // Type "the quick brown fox" without clicking
    for (const char of 'the quick') {
      await cdp.send('Input.dispatchKeyEvent', {
        type: 'keyDown',
        text: char,
        key: char,
      });
      await cdp.send('Input.dispatchKeyEvent', {
        type: 'keyUp',
        key: char,
      });
      await sleep(25);
    }

    const typedValue = await cdp.evaluate(`
      (() => {
        const input = document.querySelector('#sandbox input');
        return input ? input.value : null;
      })()
    `);
    console.log(`Home Sprint Input Value after typing: "${typedValue}"`);
    if (typedValue !== 'the quick') {
      throw new Error(`Typing failed. Expected "the quick", got "${typedValue}"`);
    }

    const liveWpm = await cdp.evaluate(`
      (() => {
        const wpmEl = document.querySelector('#sandbox .text-2xl.font-extrabold');
        return wpmEl ? wpmEl.innerText : null;
      })()
    `);
    console.log(`Live WPM on Home Sprint: ${liveWpm}`);

    // Take screenshot of Home hero
    const heroScreenshot = path.join(brainDir, 'phase3_home_hero_verified.png');
    await cdp.screenshot(heroScreenshot);

    // Scroll to Footer and take screenshot
    await cdp.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    await sleep(500);
    const footerScreenshot = path.join(brainDir, 'phase3_footer_verified.png');
    await cdp.screenshot(footerScreenshot);

    // 8. Test single-click navigation from footer links
    console.log('\n--- Testing single-click navigation on Footer Themes link ---');
    await cdp.evaluate(`
      (() => {
        const themesLink = Array.from(document.querySelectorAll('footer a')).find(a => a.href.includes('/themes'));
        if (themesLink) themesLink.click();
      })()
    `);
    await sleep(1500);
    const themesUrl = await cdp.evaluate('window.location.href');
    console.log(`URL after clicking Footer Themes link: ${themesUrl}`);
    if (!themesUrl.includes('/themes')) {
      throw new Error(`Expected navigation to /themes, got ${themesUrl}`);
    }

    console.log('\n--- Testing single-click navigation on Footer Stage 5 link ---');
    await cdp.evaluate(`
      (() => {
        window.__KEYFLOW_DEV_BYPASS_AUTH__ = true;
        const stage5Link = Array.from(document.querySelectorAll('footer a')).find(a => a.href.includes('stage=5'));
        if (stage5Link) stage5Link.click();
      })()
    `);
    await sleep(1500);
    const stage5Url = await cdp.evaluate('window.location.href');
    console.log(`URL after clicking Footer Stage 5 link: ${stage5Url}`);
    if (!stage5Url.includes('/academy?stage=5')) {
      throw new Error(`Expected navigation to /academy?stage=5, got ${stage5Url}`);
    }

    // 9. Responsive Button Visibility Check across viewports
    console.log('\n--- Verifying Button Label Visibility Across Viewports ---');
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
      await cdp.send('Page.navigate', { url: `http://127.0.0.1:${SERVER_PORT}/?dev_preview=true` });
      await sleep(1000);

      const buttonsVisible = await cdp.evaluate(`
        (() => {
          const btns = Array.from(document.querySelectorAll('main button, main a'));
          const importantBtns = btns.filter(b => {
            const txt = b.innerText.trim();
            return txt.length > 0 && (
              txt.includes('Workstation') ||
              txt.includes('Academy') ||
              txt.includes('Practice') ||
              txt.includes('Explore')
            );
          });
          return importantBtns.map(b => {
            const rect = b.getBoundingClientRect();
            const style = window.getComputedStyle(b);
            const isVisible = style.display !== 'none' &&
              style.visibility !== 'hidden' &&
              style.opacity !== '0' &&
              rect.width > 0 &&
              rect.height > 0;
            return {
              text: b.innerText.trim(),
              visible: isVisible,
              width: Math.round(rect.width),
              height: Math.round(rect.height),
            };
          });
        })()
      `);

      console.log(`Viewport ${vp.name} (${vp.width}x${vp.height}): Verified ${buttonsVisible.length} important action buttons`);
      for (const btn of buttonsVisible) {
        if (!btn.visible) {
          throw new Error(`Button "${btn.text}" was not visible on ${vp.name}!`);
        }
      }
    }

    console.log('\n=== ALL PHASE 3 REAL-BROWSER VERIFICATIONS SUCCEEDED ===\n');
  } finally {
    edgeProcess.kill();
    server.close();
  }
}

runBrowserVerification().catch((err) => {
  console.error('\n*** VERIFICATION FAILED ***\n', err);
  process.exit(1);
});
