import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const artifactDir = 'C:\\Users\\A S S A U L T\\.gemini\\antigravity\\brain\\0e20bd4d-7a63-41d1-a136-5e9da1bfcc64';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
    return res.result?.value;
  }

  async screenshot(outputPath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    fs.writeFileSync(outputPath, buffer);
    console.log(`[Screenshot Saved] ${outputPath} (${buffer.length} bytes)`);
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function run() {
  console.log('Connecting to Chrome DevTools Protocol at 127.0.0.1:9222...');
  let tabs = null;
  for (let i = 0; i < 20; i++) {
    try {
      tabs = await fetchJson('http://127.0.0.1:9222/json');
      if (tabs && tabs.length > 0) break;
    } catch {
      await sleep(500);
    }
  }

  if (!tabs || tabs.length === 0) {
    throw new Error('Could not find active browser tab on port 9222');
  }

  const pageTab = tabs.find((t) => t.type === 'page') || tabs[0];
  console.log(`Found tab: ${pageTab.title} (${pageTab.url})`);
  const client = new CDPClient(pageTab.webSocketDebuggerUrl);
  await client.connect();
  console.log('CDP Connected successfully!');

  await client.send('Page.enable');
  await client.send('Runtime.enable');

  const PORT = process.env.VITE_PORT || 5173;

  // ─────────────────────────────────────────────────────────────────────────
  // TEST A: Short Lesson (<= 4 lines)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n=== TEST A: Short Lesson (S1-L1: "fff jjj") ===');
  await client.send('Page.navigate', { url: `http://127.0.0.1:${PORT}/academy?lesson=S1-L1` });
  await sleep(2500);

  const shortState = await client.evaluate(`(() => {
    const textTrack = document.querySelector('.will-change-transform');
    const viewport = textTrack?.parentElement;
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
  // TEST B: Multi-Line Lesson (> 4 lines, Stage 3 Level 610)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n=== TEST B: Multi-Line Lesson (S3-L610) ===');
  await client.send('Page.navigate', { url: `http://127.0.0.1:${PORT}/academy?lesson=S3-L610` });
  await sleep(3000);

  // Step 1: Initial State
  const initialData = await client.evaluate(`(() => {
    const input = document.querySelector('input[aria-label="Type the exercise text here"]');
    const textTrack = document.querySelector('.will-change-transform');
    const viewport = textTrack?.parentElement;
    const firstChar = textTrack?.querySelector('.typing-char');
    const allChars = textTrack?.querySelectorAll('.typing-char') || [];
    const lastChar = allChars[allChars.length - 1];
    const lh = parseFloat(window.getComputedStyle(viewport).lineHeight) || 44;
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

  // Step 2: Type through Line 1
  console.log('\n--- Typing Line 1 ---');
  // Read target text characters to type accurately
  const targetChars = await client.evaluate(`(() => {
    const allSpans = Array.from(document.querySelectorAll('.typing-char'));
    return allSpans.map(s => s.textContent).join('');
  })()`);
  console.log(`Target text preview (${targetChars.length} chars): "${targetChars.slice(0, 80)}..."`);

  // Type ~35 characters (completes Line 1)
  const line1Text = targetChars.slice(0, 35);
  await client.evaluate(`(() => {
    const input = document.querySelector('input[aria-label="Type the exercise text here"]');
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeInputValueSetter.call(input, ${JSON.stringify(line1Text)});
    input.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await sleep(500);

  const line1State = await client.evaluate(`(() => {
    const activeSpan = document.querySelector('.char-current');
    const textTrack = document.querySelector('.will-change-transform');
    const viewport = textTrack?.parentElement;
    const firstChar = textTrack?.querySelector('.typing-char');
    const lh = parseFloat(window.getComputedStyle(viewport).lineHeight) || 44;
    const activeRow = activeSpan && firstChar ? Math.round((activeSpan.getBoundingClientRect().top - firstChar.getBoundingClientRect().top) / lh) : 0;
    return {
      activeRow,
      transform: textTrack ? window.getComputedStyle(textTrack).transform : null,
    };
  })()`);
  console.log('After typing Line 1:', line1State);
  await client.screenshot(path.join(artifactDir, 'academy_scroll_step2_line1_typed.png'));

  // Step 3: Type through Line 2
  console.log('\n--- Typing Line 2 ---');
  const line2Text = targetChars.slice(0, 75);
  await client.evaluate(`(() => {
    const input = document.querySelector('input[aria-label="Type the exercise text here"]');
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeInputValueSetter.call(input, ${JSON.stringify(line2Text)});
    input.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await sleep(500);

  const line2State = await client.evaluate(`(() => {
    const activeSpan = document.querySelector('.char-current');
    const textTrack = document.querySelector('.will-change-transform');
    const viewport = textTrack?.parentElement;
    const firstChar = textTrack?.querySelector('.typing-char');
    const lh = parseFloat(window.getComputedStyle(viewport).lineHeight) || 44;
    const activeRow = activeSpan && firstChar ? Math.round((activeSpan.getBoundingClientRect().top - firstChar.getBoundingClientRect().top) / lh) : 0;
    return {
      activeRow,
      transform: textTrack ? window.getComputedStyle(textTrack).transform : null,
    };
  })()`);
  console.log('After typing Line 2:', line2State);
  await client.screenshot(path.join(artifactDir, 'academy_scroll_step3_line2_typed.png'));

  // Step 4: Entering Line 3 (Critical Transition!)
  console.log('\n--- Entering Line 3 (First Scroll Trigger) ---');
  const line3Text = targetChars.slice(0, 115);
  await client.evaluate(`(() => {
    const input = document.querySelector('input[aria-label="Type the exercise text here"]');
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeInputValueSetter.call(input, ${JSON.stringify(line3Text)});
    input.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await sleep(600); // Allow 200ms transition to complete

  const line3State = await client.evaluate(`(() => {
    const activeSpan = document.querySelector('.char-current');
    const textTrack = document.querySelector('.will-change-transform');
    const viewport = textTrack?.parentElement;
    const firstChar = textTrack?.querySelector('.typing-char');
    const lh = parseFloat(window.getComputedStyle(viewport).lineHeight) || 44;
    const activeRow = activeSpan && firstChar ? Math.round((activeSpan.getBoundingClientRect().top - firstChar.getBoundingClientRect().top) / lh) : 0;
    return {
      activeRow,
      transform: textTrack ? window.getComputedStyle(textTrack).transform : null,
    };
  })()`);
  console.log('After entering Line 3:', line3State);
  await client.screenshot(path.join(artifactDir, 'academy_scroll_step4_line3_scrolled.png'));

  // Step 5: Entering Line 4 (Continuous Scroll)
  console.log('\n--- Entering Line 4 (Second Scroll Trigger) ---');
  const line4Text = targetChars.slice(0, 155);
  await client.evaluate(`(() => {
    const input = document.querySelector('input[aria-label="Type the exercise text here"]');
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeInputValueSetter.call(input, ${JSON.stringify(line4Text)});
    input.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await sleep(600);

  const line4State = await client.evaluate(`(() => {
    const activeSpan = document.querySelector('.char-current');
    const textTrack = document.querySelector('.will-change-transform');
    const viewport = textTrack?.parentElement;
    const firstChar = textTrack?.querySelector('.typing-char');
    const lh = parseFloat(window.getComputedStyle(viewport).lineHeight) || 44;
    const activeRow = activeSpan && firstChar ? Math.round((activeSpan.getBoundingClientRect().top - firstChar.getBoundingClientRect().top) / lh) : 0;
    return {
      activeRow,
      transform: textTrack ? window.getComputedStyle(textTrack).transform : null,
    };
  })()`);
  console.log('After entering Line 4:', line4State);
  await client.screenshot(path.join(artifactDir, 'academy_scroll_step5_line4_scrolled.png'));

  // Step 6: Backspacing back to Line 2 (Scroll Reversal)
  console.log('\n--- Backspacing back to Line 2 ---');
  await client.evaluate(`(() => {
    const input = document.querySelector('input[aria-label="Type the exercise text here"]');
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeInputValueSetter.call(input, ${JSON.stringify(line2Text)});
    input.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await sleep(600);

  const reversedState = await client.evaluate(`(() => {
    const activeSpan = document.querySelector('.char-current');
    const textTrack = document.querySelector('.will-change-transform');
    const viewport = textTrack?.parentElement;
    const firstChar = textTrack?.querySelector('.typing-char');
    const lh = parseFloat(window.getComputedStyle(viewport).lineHeight) || 44;
    const activeRow = activeSpan && firstChar ? Math.round((activeSpan.getBoundingClientRect().top - firstChar.getBoundingClientRect().top) / lh) : 0;
    return {
      activeRow,
      transform: textTrack ? window.getComputedStyle(textTrack).transform : null,
    };
  })()`);
  console.log('After backspacing to Line 2:', reversedState);
  await client.screenshot(path.join(artifactDir, 'academy_scroll_step6_backspace_reversed.png'));

  client.close();
  console.log('\nAll browser verification steps completed successfully!');
}

run().catch((err) => {
  console.error('Browser verification failed:', err);
  process.exit(1);
});
