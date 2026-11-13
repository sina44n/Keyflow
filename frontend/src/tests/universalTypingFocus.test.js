import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isInteractiveElement } from '../utils/useUniversalTypingFocus.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Universal Typing Input Experience — Phase 1 Contract', () => {
  const workstationPath = path.resolve(__dirname, '../pages/WorkstationPage.jsx');
  const lessonPlayerPath = path.resolve(__dirname, '../components/academy/LessonPlayer.jsx');
  const heroSectionPath = path.resolve(__dirname, '../components/landing/HeroSection.jsx');
  const hookPath = path.resolve(__dirname, '../utils/useUniversalTypingFocus.js');

  const workstationSrc = fs.readFileSync(workstationPath, 'utf-8');
  const lessonPlayerSrc = fs.readFileSync(lessonPlayerPath, 'utf-8');
  const heroSectionSrc = fs.readFileSync(heroSectionPath, 'utf-8');
  const hookSrc = fs.readFileSync(hookPath, 'utf-8');

  describe('1. Interactive Element Identification & Focus Isolation', () => {
    it('correctly identifies form inputs as interactive targets', () => {
      // Mock minimal DOM element for Node test environment
      const mockInput = { tagName: 'INPUT', getAttribute: () => null, closest: () => null };
      const mockTextarea = { tagName: 'TEXTAREA', getAttribute: () => null, closest: () => null };
      const mockSelect = { tagName: 'SELECT', getAttribute: () => null, closest: () => null };
      const mockEditable = { tagName: 'DIV', isContentEditable: true, getAttribute: () => null, closest: () => null };
      const mockSearch = { tagName: 'DIV', getAttribute: (attr) => attr === 'role' ? 'searchbox' : null, closest: () => null };

      assert.strictEqual(isInteractiveElement(mockInput), true);
      assert.strictEqual(isInteractiveElement(mockTextarea), true);
      assert.strictEqual(isInteractiveElement(mockSelect), true);
      assert.strictEqual(isInteractiveElement(mockEditable), true);
      assert.strictEqual(isInteractiveElement(mockSearch), true);
    });

    it('correctly identifies clickable controls (buttons, links, menu items) as interactive', () => {
      const mockButton = { tagName: 'BUTTON', getAttribute: () => null, closest: () => null };
      const mockLink = { tagName: 'A', getAttribute: () => null, closest: () => null };
      const mockRoleBtn = {
        tagName: 'DIV',
        getAttribute: () => null,
        closest: (sel) => sel.includes('[role="button"]') ? {} : null,
      };

      assert.strictEqual(isInteractiveElement(mockButton), true);
      assert.strictEqual(isInteractiveElement(mockLink), true);
      assert.strictEqual(isInteractiveElement(mockRoleBtn), true);
    });

    it('correctly identifies elements inside modals/dialogs as interactive', () => {
      const mockModalChild = {
        tagName: 'DIV',
        getAttribute: () => null,
        closest: (sel) => sel.includes('[role="dialog"]') ? {} : null,
      };

      assert.strictEqual(isInteractiveElement(mockModalChild), true);
    });

    it('correctly permits non-interactive layout containers (background, margins, canvas)', () => {
      const mockBody = { tagName: 'BODY', getAttribute: () => null, closest: () => null };
      const mockDiv = { tagName: 'DIV', getAttribute: () => null, closest: () => null };
      const mockSpan = { tagName: 'SPAN', getAttribute: () => null, closest: () => null };
      const mockSection = { tagName: 'SECTION', getAttribute: () => null, closest: () => null };

      assert.strictEqual(isInteractiveElement(mockBody), false);
      assert.strictEqual(isInteractiveElement(mockDiv), false);
      assert.strictEqual(isInteractiveElement(mockSpan), false);
      assert.strictEqual(isInteractiveElement(mockSection), false);
      assert.strictEqual(isInteractiveElement(null), false);
      assert.strictEqual(isInteractiveElement(undefined), false);
    });
  });

  describe('2. Hook Implementation Safety & Non-Interference', () => {
    it('implements proactive auto-focus on mount, window focus, pointerdown, and keydown', () => {
      assert.ok(hookSrc.includes("window.addEventListener('focus'"), 'Handles window focus restoration');
      assert.ok(hookSrc.includes("window.addEventListener('pointerdown'"), 'Handles non-interactive pointerdown');
      assert.ok(hookSrc.includes("window.addEventListener('keydown'"), 'Handles universal keydown');
    });

    it('preserves browser shortcuts (Ctrl, Meta, Alt, Escape, F1-F12)', () => {
      assert.ok(hookSrc.includes('e.ctrlKey || e.metaKey || e.altKey'), 'Preserves Ctrl/Meta/Alt modifier keys');
      assert.ok(hookSrc.includes('F\\d+'), 'Preserves function keys (F1-F12)');
      assert.ok(hookSrc.includes("e.key === 'Escape'"), 'Preserves Escape key');
    });

    it('uses preventScroll: true to eliminate unwanted page jumping', () => {
      assert.ok(hookSrc.includes('preventScroll: true'), 'Focus uses preventScroll: true');
    });
  });

  describe('3. Workstation Universal Typing Integration', () => {
    it('imports and invokes useUniversalTypingFocus in WorkstationPage', () => {
      assert.ok(
        workstationSrc.includes('useUniversalTypingFocus'),
        'WorkstationPage imports useUniversalTypingFocus'
      );
    });

    it('gates focus readiness when modals or completed results are open', () => {
      assert.ok(
        workstationSrc.includes('isCompleted') && workstationSrc.includes('customStudioOpen'),
        'WorkstationPage gates focus readiness based on modal state and test completion'
      );
    });
  });

  describe('4. Academy LessonPlayer Universal Typing Integration', () => {
    it('imports and invokes useUniversalTypingFocus in LessonPlayer', () => {
      assert.ok(
        lessonPlayerSrc.includes('useUniversalTypingFocus'),
        'LessonPlayer imports useUniversalTypingFocus'
      );
    });

    it('gates focus readiness when lesson is completed', () => {
      assert.ok(
        lessonPlayerSrc.includes('disabled: isCompleted'),
        'LessonPlayer disables focus capture when lesson is completed'
      );
    });
  });

  describe('5. Home HeroSection Universal Typing Integration', () => {
    it('imports and invokes useUniversalTypingFocus in HeroSection', () => {
      assert.ok(
        heroSectionSrc.includes('useUniversalTypingFocus'),
        'HeroSection imports useUniversalTypingFocus'
      );
    });

    it('gates focus readiness when hero preview is completed', () => {
      assert.ok(
        heroSectionSrc.includes('disabled: isCompleted'),
        'HeroSection disables focus capture when sprint is completed'
      );
    });
  });
});
