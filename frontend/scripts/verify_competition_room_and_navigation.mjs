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

const mockCompetition = {
  id: 101,
  name: 'Sprint Challenge Room',
  code: 'KF-SPRT99',
  status: 'waiting',
  challenge_type: 'words',
  target_limit: 5,
  time_limit_seconds: null,
  max_participants: 10,
  challenge_text: 'hello world test code fast',
  is_host: true,
  created_by_name: 'Sinan KP',
  participant_count: 1,
  host: { id: 1, username: 'sinankp' },
  participants: [
    {
      id: 1,
      user: { id: 1, username: 'sinankp' },
      display_name: 'Sinan KP',
      status: 'waiting',
      net_wpm: 0,
      accuracy: 100,
    },
  ],
  summary: {
    total_participants: 1,
    completed_count: 0,
    avg_wpm: 0,
    avg_accuracy: 100,
    top_score: 0,
    top_wpm: 0,
    podium: [],
  },
};

function startServer(port) {
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      return res.end();
    }

    if (reqPath.startsWith('/api/platform/config/') || reqPath.startsWith('/platform/config/')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ competition_enabled: true, custom_text_enabled: true }));
    }

    if (reqPath.startsWith('/api/auth/me/') || reqPath.startsWith('/api/profile/')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(
        JSON.stringify({
          id: 1,
          username: 'sinankp',
          email: 'sinan@example.com',
          profile: { display_name: 'Sinan KP', avatar_url: '' },
        })
      );
    }

    if (reqPath.includes('/submit/')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(
        JSON.stringify({
          success: true,
          participant_id: 1,
          net_wpm: 75,
          accuracy: 100,
          rank: 1,
        })
      );
    }

    if (req.method === 'POST' && (reqPath.startsWith('/api/practice/competitions/') || reqPath.startsWith('/practice/competitions/'))) {
      res.writeHead(201, { 'Content-Type': 'application/json' });
      return res.end(
        JSON.stringify({
          id: 202,
          name: 'Championship Sprint Room',
          code: 'KF-CRTD99',
          status: 'waiting',
          challenge_type: 'words',
          target_limit: 5,
          time_limit_seconds: null,
          max_participants: 10,
          challenge_text: 'hello world test code fast',
          is_host: true,
          created_by_name: 'Sinan KP',
          participant_count: 1,
          participant_id: 1,
          participant_token: 'tok_host_123',
          host: { id: 1, username: 'sinankp' },
          participants: [
            {
              id: 1,
              user: { id: 1, username: 'sinankp' },
              display_name: 'Sinan KP',
              status: 'waiting',
              net_wpm: 0,
              accuracy: 100,
            },
          ],
        })
      );
    }

    // List endpoint returns an Array
    if (reqPath === '/api/practice/competitions/' || reqPath === '/practice/competitions/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify([mockCompetition]));
    }

    // Detail endpoint for a specific competition code
    if (reqPath.startsWith('/api/practice/competitions/') || reqPath.startsWith('/practice/competitions/')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(
        JSON.stringify({
          id: 202,
          name: 'Championship Sprint Room',
          code: 'KF-CRTD99',
          status: 'waiting',
          challenge_type: 'words',
          target_limit: 5,
          time_limit_seconds: null,
          max_participants: 10,
          challenge_text: 'hello world test code fast',
          is_host: true,
          created_by_name: 'Sinan KP',
          participant_count: 1,
          host: { id: 1, username: 'sinankp' },
          participants: [
            {
              id: 1,
              user: { id: 1, username: 'sinankp' },
              display_name: 'Sinan KP',
              status: 'completed',
              net_wpm: 75,
              raw_wpm: 75,
              accuracy: 100,
              score: 750,
              duration_seconds: 4,
              rank: 1,
            },
          ],
          summary: {
            total_participants: 1,
            completed_count: 1,
            avg_wpm: 75,
            avg_accuracy: 100,
            top_score: 750,
            top_wpm: 75,
            podium: [
              {
                id: 1,
                display_name: 'Sinan KP',
                rank: 1,
                net_wpm: 75,
                raw_wpm: 75,
                accuracy: 100,
                score: 750,
                duration_seconds: 4,
                avatar_url: '',
              },
            ],
          },
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
      console.log(`[Static Server] Listening on http://127.0.0.1:${port}`);
      resolve(server);
    });
  });
}

async function main() {
  const PORT = 5198;
  const server = await startServer(PORT);

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const cdpPort = 9245;
  const tmpUserData = path.join(os.tmpdir(), `edge_comp_${Date.now()}`);
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
      `http://127.0.0.1:${PORT}/workstation?dev_preview=true`,
    ],
    { stdio: 'ignore' }
  );

  await sleep(1500);

  let pageTarget = null;
  for (let i = 0; i < 20; i++) {
    try {
      const list = await fetch(`http://127.0.0.1:${cdpPort}/json/list`).then((r) => r.json());
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
    if (msg.method === 'Runtime.exceptionThrown') {
      console.error('[CDP Exception]', JSON.stringify(msg.params.exceptionDetails));
    }
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
    `,
  });

  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/workstation?dev_preview=true` });
  await sleep(3000);

  const evalVal = async (expression) => {
    const res = await send('Runtime.evaluate', { expression, returnByValue: true });
    return res?.result?.value;
  };

  // Check URL
  const initialUrl = await evalVal('window.location.pathname');
  console.log('[CDP] Initial URL path:', initialUrl);

  // Log all available buttons on page
  const allButtons = await evalVal(`(() => {
    return Array.from(document.querySelectorAll('button')).map(b => ({
      text: b.innerText.trim(),
      aria: b.getAttribute('aria-label'),
      title: b.getAttribute('title')
    }));
  })()`);
  console.log('[CDP] Available buttons on Workstation:', JSON.stringify(allButtons));

  // Click Competition button to open CompetitionModal
  console.log('[CDP] Clicking Competition button to open CompetitionModal...');
  const openModalRes = await evalVal(`(() => {
    const compBtn = document.querySelector('button[aria-label="Typing Competition Arena"]') || 
                    Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Competition'));
    if (compBtn) {
      compBtn.click();
      return { success: true, outerHTML: compBtn.outerHTML };
    }
    return { success: false };
  })()`);
  console.log('Open Competition Modal result:', JSON.stringify(openModalRes));
  await sleep(2500);

  console.log('[CDP] Current URL:', await evalVal('window.location.href'));
  console.log('[CDP] Document readyState:', await evalVal('document.readyState'));
  console.log('[CDP] Body HTML snippet:', await evalVal('document.body.innerHTML.slice(0, 300)'));

  // Log modal buttons using textContent
  const modalButtons = await evalVal(`(() => {
    return Array.from(document.querySelectorAll('button')).map(b => (b.textContent || '').trim()).filter(Boolean);
  })()`);
  console.log('[CDP] Buttons after clicking Competition:', JSON.stringify(modalButtons));

  // In CompetitionModal lobbies list, find the Join button in the lobby card (or click Lobbies tab if not there)
  console.log('[CDP] Finding Join button on lobby row...');
  const openRoomRes = await evalVal(`(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    // Find button that contains Join and is NOT the tab header
    const joinBtn = btns.find(b => {
      const text = (b.textContent || '').trim();
      return text.includes('Join') && !b.classList.contains('px-2.5'); // tab header uses px-2.5 py-1
    }) || btns.find(b => b.textContent.includes('Join'));
    
    if (joinBtn) {
      joinBtn.click();
      return { success: true, text: joinBtn.textContent.trim(), html: joinBtn.outerHTML };
    }
    return { success: false, available: btns.map(b => b.textContent.trim()) };
  })()`);
  console.log('Room open result:', JSON.stringify(openRoomRes));
  await sleep(2000);

  const rawModalText = await evalVal("document.querySelector('.fixed.inset-0')?.textContent");
  console.log('[CDP] Raw Modal textContent in Room view:\n', rawModalText);

  // Inspect the Room View in CompetitionModal
  const roomInspection = await evalVal(`(() => {
    const modal = document.querySelector('.fixed.inset-0');
    if (!modal) return { error: 'modal_not_open' };

    const text = modal.textContent || '';
    return {
      hasRoomName: text.includes('Sprint Challenge Room') || text.includes('Championship Sprint Room'),
      hasRoomCode: text.includes('KF-SPRT99') || text.includes('KF-CRTD99'),
      hasStatus: text.toLowerCase().includes('waiting') || text.toLowerCase().includes('active') || text.toLowerCase().includes('completed'),
      hasEditRoom: text.includes('Edit Room'),
      hasDeleteRoom: text.includes('Delete Room'),
      hasStartTest: text.includes('Start Test'),
      hasResultsLink: text.includes('Results Page'),
      // Verify clutter is removed:
      hasLobbyStats: text.includes('Lobby Avg Speed') || text.includes('Lobby Avg Accuracy') || text.includes('BEST SCORE'),
      hasPodiumWinners: text.includes('Podium Winners') || text.includes('1st Place Gold'),
      hasSharedChallengePreview: text.includes('Shared Challenge Text (All participants receive this identical prompt)'),
      hasParticipantTable: text.includes('Complete Results for Every Participant'),
      hasCSVBtn: text.includes('CSV'),
      hasJSONBtn: text.includes('JSON'),
    };
  })()`);

  console.log('[CDP] Room View Inspection Results:');
  console.log(JSON.stringify(roomInspection, null, 2));

  // Take screenshot of simplified room view
  const modalScreenshot = await send('Page.captureScreenshot', { format: 'png' });
  const modalImagePath = path.join(brainDir, 'competition_room_simplified_view.png');
  fs.writeFileSync(modalImagePath, Buffer.from(modalScreenshot.data, 'base64'));
  console.log(`[Screenshot] Saved simplified room modal to ${modalImagePath}`);

  // Now click Start Test to launch the competition typing test
  console.log('[CDP] Clicking Start Test...');
  const startTestRes = await evalVal(`(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const startBtn = btns.find(b => b.textContent.includes('Start Test'));
    if (startBtn) {
      startBtn.click();
      return 'started';
    }
    return 'not_found';
  })()`);
  console.log('Start test result:', startTestRes);
  await sleep(2000);

  // Type the words to complete the challenge using React's native value setter
  console.log('[CDP] Completing competition challenge...');
  const typingResult = await evalVal(`(() => {
    const input = document.querySelector('input[type="text"]');
    if (!input) return 'no_input';

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeInputValueSetter.call(input, 'hello world test code fast');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return 'typed';
  })()`);
  console.log('Typing result:', typingResult);

  // Check immediately if DedicatedResultsScreen flashed or if clean transition appeared
  await sleep(150);
  const flashCheck = await evalVal(`(() => {
    const tallyingIndicator = document.body.innerText.includes('Tallying competition results...');
    const dedicatedScoreTitle = document.body.innerText.includes('Consistency') && document.body.innerText.includes('Raw WPM');
    return {
      renderedDedicatedResults: Boolean(dedicatedScoreTitle),
      renderedTallyingIndicator: tallyingIndicator,
      currentPath: window.location.pathname,
    };
  })()`);
  console.log('[CDP] Immediate Completion State Inspection:');
  console.log(JSON.stringify(flashCheck, null, 2));

  // Capture transition state screenshot
  const transitionScreenshot = await send('Page.captureScreenshot', { format: 'png' });
  const transitionImagePath = path.join(brainDir, 'competition_direct_transition_view.png');
  fs.writeFileSync(transitionImagePath, Buffer.from(transitionScreenshot.data, 'base64'));
  console.log(`[Screenshot] Saved transition screenshot to ${transitionImagePath}`);

  // Wait for redirect to /competitions/KF-SPRT99/results
  await sleep(1500);
  const finalCheck = await evalVal(`(() => {
    return {
      currentPath: window.location.pathname,
      isResultsPage: window.location.pathname.includes('/competitions/') && window.location.pathname.includes('/results'),
    };
  })()`);
  console.log('[CDP] Post-Redirect Navigation State:');
  console.log(JSON.stringify(finalCheck, null, 2));

  // Take screenshot of results page
  const resultsScreenshot = await send('Page.captureScreenshot', { format: 'png' });
  const resultsImagePath = path.join(brainDir, 'competition_direct_navigation_completed.png');
  fs.writeFileSync(resultsImagePath, Buffer.from(resultsScreenshot.data, 'base64'));
  console.log(`[Screenshot] Saved results page screenshot to ${resultsImagePath}`);

  // Cleanup
  ws.close();
  browserProc.kill();
  server.close();
  console.log('[CDP] Verification completed successfully!');
}

main().catch((err) => {
  console.error('Error during verification:', err);
  process.exit(1);
});
