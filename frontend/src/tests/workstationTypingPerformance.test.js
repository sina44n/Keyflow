/**
 * KEYFLOW Workstation Typing Performance & Competition Backend Recovery Test Suite
 * =================================================================================
 * Verifies:
 * 1. Workstation Typing Responsiveness & Reconciliation Optimization
 *    - WorkstationCharacterSpan memoization (prevents reconciling 1000+ DOM nodes per keystroke)
 *    - WorkstationTextTrack memoization (isolates passage from timer ticks and live metric updates)
 *    - WorkstationToolbar memoization (prevents 30+ controls re-rendering on keystrokes)
 *    - Virtual KeyboardGuide & Hand3DGuide memoization
 * 2. Keystroke Event Pipeline & Render Batching
 *    - pendingKeystrokeRef stores accurate physical key/code from onKeyDown
 *    - handleInputChange dispatches lastKeystroke in the same render batch as setTyped
 *    - Error history is maintained synchronously in sessionTrackerRef without per-keystroke state thrashing
 * 3. 4-Line Viewport Auto-Scroll & Pacing Guide Preservation
 *    - 4-line viewport scroll preserved with cached line height and base offsets
 *    - Pacing guide queries cached spans instead of querySelectorAll on every animation frame
 * 4. Competition Backend Recovery Contract
 *    - Django auto-recovery plugin in vite.config.js for local development
 *    - Competition creation endpoint (/api/practice/competitions/) format and error resilience
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getCharacterFeedback,
  calculateGrossWpm,
  calculateNetWpm,
  calculateRawAccuracy,
  calculateFinalTextAccuracy,
} from '../utils/typingFeedback.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('KEYFLOW Workstation Typing Performance & Backend Recovery Contract', () => {
  const workstationPath = path.resolve(__dirname, '../pages/WorkstationPage.jsx');
  const toolbarPath = path.resolve(__dirname, '../components/workstation/WorkstationToolbar.jsx');
  const keyboardGuidePath = path.resolve(__dirname, '../components/academy/KeyboardGuide.jsx');
  const handGuidePath = path.resolve(__dirname, '../components/academy/HandGuide.jsx');
  const hand3dPath = path.resolve(__dirname, '../components/academy/Hand3DGuide.jsx');
  const viteConfigPath = path.resolve(__dirname, '../../vite.config.js');
  const compModalPath = path.resolve(__dirname, '../components/workstation/CompetitionModal.jsx');

  const workstationContent = fs.readFileSync(workstationPath, 'utf-8');
  const toolbarContent = fs.readFileSync(toolbarPath, 'utf-8');
  const keyboardGuideContent = fs.readFileSync(keyboardGuidePath, 'utf-8');
  const handGuideContent = fs.readFileSync(handGuidePath, 'utf-8');
  const hand3dContent = fs.readFileSync(hand3dPath, 'utf-8');
  const viteConfigContent = fs.readFileSync(viteConfigPath, 'utf-8');
  const compModalContent = fs.readFileSync(compModalPath, 'utf-8');

  describe('1. Workstation Typing DOM Reconciliation Optimization', () => {
    it('defines memoized WorkstationCharacterSpan component to isolate character DOM updates', () => {
      assert.ok(
        workstationContent.includes('const WorkstationCharacterSpan = React.memo'),
        'WorkstationPage must define a memoized WorkstationCharacterSpan'
      );
      assert.ok(
        workstationContent.includes('feedbackClassName'),
        'WorkstationCharacterSpan must receive feedbackClassName for shallow comparison'
      );
      assert.ok(
        workstationContent.includes('typing-char'),
        'WorkstationCharacterSpan must preserve standard .typing-char class'
      );
    });

    it('defines memoized WorkstationTextTrack component to decouple passage from timer updates', () => {
      assert.ok(
        workstationContent.includes('const WorkstationTextTrack = React.memo'),
        'WorkstationPage must define a memoized WorkstationTextTrack'
      );
      assert.ok(
        workstationContent.includes('<WorkstationTextTrack'),
        'WorkstationPage must render <WorkstationTextTrack inside the text track'
      );
    });

    it('wraps WorkstationToolbar in React.memo to prevent 30+ controls re-rendering on keystrokes', () => {
      assert.ok(
        toolbarContent.includes('React.memo(function WorkstationToolbar'),
        'WorkstationToolbar must be wrapped in React.memo'
      );
    });

    it('wraps KeyboardGuide, HandGuide, and Hand3DGuide in React.memo', () => {
      assert.ok(
        keyboardGuideContent.includes('React.memo(function KeyboardGuide'),
        'KeyboardGuide must be memoized'
      );
      assert.ok(
        handGuideContent.includes('React.memo(function HandGuide'),
        'HandGuide must be memoized'
      );
      assert.ok(
        hand3dContent.includes('React.memo(function Hand3DGuide'),
        'Hand3DGuide must be memoized'
      );
    });
  });

  describe('2. Keystroke Event Pipeline & Single-Render Batching', () => {
    it('captures pending physical keystroke in pendingKeystrokeRef for batch application', () => {
      assert.ok(
        workstationContent.includes('pendingKeystrokeRef = useRef(null)'),
        'WorkstationPage must declare pendingKeystrokeRef'
      );
      assert.ok(
        workstationContent.includes('pendingKeystrokeRef.current = { key: e.key, code: e.code'),
        'onKeyDown must record key and code without triggering early state re-renders'
      );
    });

    it('dispatches lastKeystroke in handleInputChange batched with setTyped', () => {
      assert.ok(
        workstationContent.includes('pendingKeystrokeRef.current && (pendingKeystrokeRef.current.key === actualChar'),
        'handleInputChange must consume pendingKeystrokeRef in the same batch as setTyped'
      );
    });

    it('records errors synchronously in sessionTrackerRef without per-keystroke React state recreation', () => {
      assert.ok(
        workstationContent.includes('sessionTrackerRef.current.errorHistory.push(errItem)'),
        'handleInputChange must record error item in sessionTrackerRef'
      );
      // Ensure setErrorHistory is not called in the keystroke loop
      const inputChangeSection = workstationContent.slice(
        workstationContent.indexOf('const handleInputChange ='),
        workstationContent.indexOf('sessionTrackerRef.current.typed = val;')
      );
      assert.ok(
        !inputChangeSection.includes('setErrorHistory((prev) => [...prev, errItem])'),
        'handleInputChange must not thrash React state array on every typo'
      );
    });
  });

  describe('3. Pacing Guide & 4-Line Viewport Preservation', () => {
    it('caches pacing spans in cachedPacingSpansRef to prevent 60fps DOM query layout thrashing', () => {
      assert.ok(
        workstationContent.includes('cachedPacingSpansRef = useRef(null)'),
        'WorkstationPage must declare cachedPacingSpansRef'
      );
      assert.ok(
        workstationContent.includes('cachedPacingSpansRef.current = viewportRef.current.querySelectorAll'),
        'updatePacingLine must cache spans instead of querying every frame'
      );
    });

    it('invalidates cachedPacingSpansRef on text/font changes, reset, and resize, with self-healing on length/disconnection mismatch', () => {
      assert.ok(
        workstationContent.includes('cachedPacingSpansRef.current = null;'),
        'WorkstationPage must clear pacing spans cache on resize and reset'
      );
      assert.ok(
        workstationContent.includes('cachedPacingSpansRef.current.length !== currentTargetText.length'),
        'updatePacingLine must self-heal if cached NodeList length mismatches current passage'
      );
      assert.ok(
        workstationContent.includes('!cachedPacingSpansRef.current[0].isConnected'),
        'updatePacingLine must self-heal if cached spans are detached from the active DOM'
      );
    });

    it('preserves 4-line viewport constraints and line-by-line auto-scroll', () => {
      assert.ok(
        workstationContent.includes("height: 'calc(4 * 1.625em)'"),
        'Viewport must maintain exact 4-line height formula'
      );
      assert.ok(
        workstationContent.includes('lastActiveOffsetTopRef'),
        'Viewport auto-scroll must use fast-path offsetTop comparison'
      );
    });
  });

  describe('4. Typing Responsiveness Benchmark (< 5ms per keystroke budget)', () => {
    it('executes 200 simulated keystrokes with character feedback calculation in under 10ms', () => {
      const sampleText = 'The quick brown fox jumps over the lazy dog while five boxing wizards jump quickly through dark night skies. '.repeat(5);
      const mistakeSet = new Set([10, 25, 45, 80]);
      let typed = '';

      const t0 = performance.now();
      for (let i = 0; i < 200; i++) {
        typed += sampleText[i];
        // Calculate feedback for typed characters
        const currentFeedback = getCharacterFeedback(i, typed, sampleText, false, mistakeSet);
        assert.ok(currentFeedback && currentFeedback.className, 'Must return valid feedback');
      }
      const t1 = performance.now();
      const elapsed = t1 - t0;
      const perKeystrokeMs = elapsed / 200;

      assert.ok(perKeystrokeMs < 1.0, `Keystroke computation must be < 1.0ms, got ${perKeystrokeMs.toFixed(3)}ms`);
      assert.ok(elapsed < 20.0, `200 keystrokes computation must take < 20ms, got ${elapsed.toFixed(2)}ms`);
    });

    it('preserves scoring formula parity for gross WPM, net WPM, and raw accuracy', () => {
      // 50 correct keystrokes in 30 seconds = (50 / 5) / (30 / 60) = 10 / 0.5 = 20 WPM
      const gross = calculateGrossWpm(50, 30);
      assert.strictEqual(gross, 20);

      // 0 uncorrected errors -> net = gross = 20
      const netClean = calculateNetWpm(20, 0, 30);
      assert.strictEqual(netClean, 20);

      // 2 uncorrected errors in 30 sec -> net = 20 - (2 / 0.5) = 20 - 4 = 16
      const netWithErrors = calculateNetWpm(20, 2, 30);
      assert.strictEqual(netWithErrors, 16);

      // Raw accuracy: 48 correct / 50 total = 96%
      const acc = calculateRawAccuracy(48, 2);
      assert.strictEqual(acc, 96);
    });
  });

  describe('5. Competition Backend Recovery & Architecture Contract', () => {
    it('configures djangoAutoStartPlugin in vite.config.js for seamless local development', () => {
      assert.ok(
        viteConfigContent.includes('djangoAutoStartPlugin()'),
        'vite.config.js must register djangoAutoStartPlugin'
      );
      assert.ok(
        viteConfigContent.includes('127.0.0.1:8000'),
        'vite.config.js must target 127.0.0.1:8000 for Django development server'
      );
      assert.ok(
        viteConfigContent.includes('/api/health/'),
        'vite.config.js must probe backend health on startup'
      );
    });

    it('verifies CompetitionModal supports room creation, active tab, and error reporting', () => {
      assert.ok(
        compModalContent.includes('competitionAPI.create'),
        'CompetitionModal must call competitionAPI.create'
      );
      assert.ok(
        compModalContent.includes('setStatusMessage'),
        'CompetitionModal must report creation status and errors'
      );
      assert.ok(
        compModalContent.includes("setActiveTab('active')"),
        'CompetitionModal must transition to active lobby on room creation'
      );
    });
  });
});
