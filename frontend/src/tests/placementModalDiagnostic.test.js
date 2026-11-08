import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PLACEMENT_DIAGNOSTIC_PASSAGE,
  evaluatePlacementDiagnostic,
  calculateStageRecommendation,
  CHAR_SETS,
} from '../utils/placementEngine.js';
import { applyPlacementAccess } from '../utils/lessonProgress.js';

describe('KEYFLOW ACADEMY — Placement Test Modal Restoration & Diagnostic Engine', () => {

  describe('1. Diagnostic Passage Architecture & Visual Line Wrap', () => {
    it('verifies exact character count (286 characters) and word count (41 words)', () => {
      assert.equal(PLACEMENT_DIAGNOSTIC_PASSAGE.length, 286);
      const words = PLACEMENT_DIAGNOSTIC_PASSAGE.split(' ');
      assert.equal(words.length, 41);
    });

    it('guarantees 100% coverage of all 26 English alphabet letters (zero missing)', () => {
      const lower = PLACEMENT_DIAGNOSTIC_PASSAGE.toLowerCase();
      const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
      const missing = alphabet.filter((c) => !lower.includes(c));
      assert.deepEqual(missing, [], `Expected complete A-Z coverage, but missing: ${missing.join(', ')}`);
    });

    it('verifies presence of numbers, dates, punctuation, symbols, and code syntax', () => {
      // Numbers & dates
      assert.ok(PLACEMENT_DIAGNOSTIC_PASSAGE.includes('2026'), 'Must include year 2026');
      assert.ok(PLACEMENT_DIAGNOSTIC_PASSAGE.includes('10'), 'Must include 10');
      assert.ok(PLACEMENT_DIAGNOSTIC_PASSAGE.includes('95%'), 'Must include percentage');
      assert.ok(PLACEMENT_DIAGNOSTIC_PASSAGE.includes('100'), 'Must include 100');

      // Punctuation & symbols
      assert.ok(PLACEMENT_DIAGNOSTIC_PASSAGE.includes('.'), 'Must include period');
      assert.ok(PLACEMENT_DIAGNOSTIC_PASSAGE.includes(','), 'Must include comma');
      assert.ok(PLACEMENT_DIAGNOSTIC_PASSAGE.includes(':'), 'Must include colon');
      assert.ok(PLACEMENT_DIAGNOSTIC_PASSAGE.includes('!'), 'Must include exclamation mark');
      assert.ok(PLACEMENT_DIAGNOSTIC_PASSAGE.includes('{score: 100}'), 'Must include structured code syntax');

      // Capitalized titles & names
      assert.ok(PLACEMENT_DIAGNOSTIC_PASSAGE.includes('KEYFLOW Academy'));
      assert.ok(PLACEMENT_DIAGNOSTIC_PASSAGE.includes('November'));
    });

    it('enforces approximately 4 to 5 visual lines on desktop modal widths (60 to 75 chars/line)', () => {
      function wrapText(text, maxChars) {
        const words = text.split(' ');
        const lines = [];
        let cur = '';
        for (const w of words) {
          if ((cur + ' ' + w).trim().length <= maxChars) {
            cur = (cur + ' ' + w).trim();
          } else {
            lines.push(cur);
            cur = w;
          }
        }
        if (cur) lines.push(cur);
        return lines;
      }

      // 60 chars per line -> 5 lines
      const lines60 = wrapText(PLACEMENT_DIAGNOSTIC_PASSAGE, 60);
      assert.equal(lines60.length, 5);

      // 65 chars per line -> 5 lines
      const lines65 = wrapText(PLACEMENT_DIAGNOSTIC_PASSAGE, 65);
      assert.equal(lines65.length, 5);

      // 70 chars per line -> 5 lines
      const lines70 = wrapText(PLACEMENT_DIAGNOSTIC_PASSAGE, 70);
      assert.equal(lines70.length, 5);

      // 75 chars per line -> 4 lines
      const lines75 = wrapText(PLACEMENT_DIAGNOSTIC_PASSAGE, 75);
      assert.equal(lines75.length, 4);

      // Confirms desktop visual line bounds: 4 to 5 lines strictly
      [lines60, lines65, lines70, lines75].forEach((lines) => {
        assert.ok(lines.length >= 4 && lines.length <= 5, `Expected 4-5 lines, got ${lines.length}`);
      });
    });
  });

  describe('2. Spacebar Guidance & Word Spacing Contract', () => {
    it('preserves authentic keyboard space characters without decorative substitutions', () => {
      const spaceCount = (PLACEMENT_DIAGNOSTIC_PASSAGE.match(/ /g) || []).length;
      assert.equal(spaceCount, 40, 'Must contain 40 authentic spaces between 41 words');
      assert.ok(!PLACEMENT_DIAGNOSTIC_PASSAGE.includes('␣'), 'Must not substitute visual symbols into raw text');
      assert.ok(!PLACEMENT_DIAGNOSTIC_PASSAGE.includes('_'), 'Must not use underscores for spaces');
      assert.ok(!PLACEMENT_DIAGNOSTIC_PASSAGE.includes('•'), 'Must not use bullet points for spaces');
    });
  });

  describe('3. Accurate Typing Performance Measurement', () => {
    it('measures real Gross WPM using standard 5 chars/word convention', () => {
      // 286 characters typed cleanly in 60 seconds = 286/5 = 57.2 -> 57 WPM
      const res = evaluatePlacementDiagnostic({
        targetText: PLACEMENT_DIAGNOSTIC_PASSAGE,
        typedText: PLACEMENT_DIAGNOSTIC_PASSAGE,
        durationSeconds: 60,
        correctKeystrokes: 286,
        mistakes: 0,
      });

      assert.equal(res.grossWpm, 57);
      assert.equal(res.rawAccuracy, 100);
      assert.equal(res.uncorrectedErrors, 0);
    });

    it('strictly reports 0 WPM and 0% accuracy on empty zero-input assessment', () => {
      const res = evaluatePlacementDiagnostic({
        targetText: PLACEMENT_DIAGNOSTIC_PASSAGE,
        typedText: '',
        durationSeconds: 30,
        correctKeystrokes: 0,
        mistakes: 0,
      });

      assert.equal(res.grossWpm, 0, 'Zero input must produce 0 WPM');
      assert.equal(res.rawAccuracy, 0, 'Zero input must not fabricate 100% accuracy');
    });

    it('accounts for historical mistakes even when corrected using Backspace', () => {
      // Typist typed 286 characters final, but had 14 mistakes that were backspaced and corrected
      // Total attempts = 286 + 14 = 300. Raw accuracy = 286 / 300 = 95.33% -> 95%
      const res = evaluatePlacementDiagnostic({
        targetText: PLACEMENT_DIAGNOSTIC_PASSAGE,
        typedText: PLACEMENT_DIAGNOSTIC_PASSAGE,
        durationSeconds: 60,
        correctKeystrokes: 286,
        mistakes: 14,
        backspaces: 14,
      });

      assert.equal(res.rawAccuracy, 95, 'Correcting typos with backspace must preserve historical error penalty');
      assert.equal(res.finalTextAccuracy, 100, 'Final text matches 100%, but raw accuracy is 95%');
      assert.equal(res.mistakes, 14);
      assert.equal(res.backspaces, 14);
    });
  });

  describe('4. Intelligent 10-Stage Recommendation Framework', () => {
    it('Scenario A: Beginner (15 WPM, 82% accuracy) -> Recommended Stage 1', () => {
      const res = evaluatePlacementDiagnostic({
        targetText: PLACEMENT_DIAGNOSTIC_PASSAGE,
        typedText: PLACEMENT_DIAGNOSTIC_PASSAGE,
        durationSeconds: 228, // ~15 WPM
        correctKeystrokes: 235,
        mistakes: 51, // ~82% accuracy
      });

      assert.equal(res.recommendation.recommendedStage, 1);
      assert.match(res.recommendation.reason, /Foundational touch-typing anchors/);
      assert.equal(res.recommendation.startingLessonLogicalId, 'S01-L001');
    });

    it('Scenario B: Solid touch typist (36 WPM, 93% accuracy) -> Recommended Stage 3 or 4', () => {
      const res = evaluatePlacementDiagnostic({
        targetText: PLACEMENT_DIAGNOSTIC_PASSAGE,
        typedText: PLACEMENT_DIAGNOSTIC_PASSAGE,
        durationSeconds: 95, // ~36 WPM
        correctKeystrokes: 270,
        mistakes: 16, // ~94% accuracy
      });

      assert.ok(
        res.recommendation.recommendedStage >= 3 && res.recommendation.recommendedStage <= 4,
        `Expected Stage 3 or 4, got Stage ${res.recommendation.recommendedStage}`
      );
    });

    it('Scenario C: High speed (65 WPM) but poor accuracy (78%) -> Gated to Stage 1 (speed never overrides accuracy)', () => {
      const res = evaluatePlacementDiagnostic({
        targetText: PLACEMENT_DIAGNOSTIC_PASSAGE,
        typedText: PLACEMENT_DIAGNOSTIC_PASSAGE,
        durationSeconds: 52, // ~66 WPM
        correctKeystrokes: 223,
        mistakes: 63, // 78% accuracy
      });

      assert.equal(res.recommendation.recommendedStage, 1, 'Speed must never override foundational accuracy gaps');
    });

    it('Scenario D: Elite Grandmaster (86 WPM, 98% accuracy) -> Recommended Stage 10', () => {
      const res = evaluatePlacementDiagnostic({
        targetText: PLACEMENT_DIAGNOSTIC_PASSAGE,
        typedText: PLACEMENT_DIAGNOSTIC_PASSAGE,
        durationSeconds: 40, // ~86 WPM
        correctKeystrokes: 283,
        mistakes: 3, // ~99% accuracy
      });

      assert.equal(res.recommendation.recommendedStage, 10);
      assert.match(res.recommendation.reason, /Grandmaster/);
    });
  });

  describe('5. Zero-Loss Access Guarantee & Progress Integrity', () => {
    it('unlocks stages without fabricating fake lesson completions or stars', () => {
      // Mock clean storage state
      global.localStorage = {
        _data: {},
        getItem(k) { return this._data[k] || null; },
        setItem(k, v) { this._data[k] = String(v); },
        removeItem(k) { delete this._data[k]; },
      };

      const updatedState = applyPlacementAccess(6);
      assert.ok(updatedState.unlockedStages.includes(1));
      assert.ok(updatedState.unlockedStages.includes(6));
      assert.equal(updatedState.stageAccessTypes[6], 'placement_unlock');

      // Crucial: lessons object must be completely untouched!
      assert.deepEqual(updatedState.lessons, {}, 'Placement unlock must never fabricate fake lesson records');
    });
  });
});
