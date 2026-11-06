import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PLACEMENT_TIERS,
  analyzeSpacebarDiscipline,
  analyzeCadence,
  evaluateTierPerformance,
  aggregateAssessmentProfile,
  calculateStageRecommendation,
} from '../utils/placementEngine.js';

describe('KEYFLOW — Placement Test Multi-Competency Assessment Engine', () => {

  describe('1. Spacebar and Word Separation Discipline', () => {
    it('accurately identifies clean spacing without missing or extra spaces', () => {
      const target = 'the quick fox';
      const typed = 'the quick fox';
      const res = analyzeSpacebarDiscipline(target, typed);
      assert.equal(res.expectedSpaces, 2);
      assert.equal(res.correctSpaces, 2);
      assert.equal(res.missingSpaces, 0);
      assert.equal(res.extraSpaces, 0);
      assert.equal(res.accuracy, 100);
    });

    it('detects missing spacebar between words without confusing it with a letter error', () => {
      const target = 'the quick fox';
      const typed = 'thequick fox'; // skipped space after 'the'
      const res = analyzeSpacebarDiscipline(target, typed);
      assert.equal(res.expectedSpaces, 2);
      assert.equal(res.missingSpaces, 1);
      assert.ok(res.accuracy < 100);
    });

    it('detects extra spacebar insertions inside words', () => {
      const target = 'fox jumps';
      const typed = 'fo x jumps'; // extra space inside 'fox'
      const res = analyzeSpacebarDiscipline(target, typed);
      assert.ok(res.extraSpaces >= 1);
      assert.ok(res.accuracy < 100);
    });
  });

  describe('2. Cadence & Rhythm Consistency Analysis', () => {
    it('evaluates steady metronomic cadence with high score', () => {
      // Intervals steady around 180ms
      const strokes = [];
      let t = 1000;
      for (let i = 0; i < 20; i++) {
        strokes.push({ key: 'a', time: t });
        t += 180 + (i % 2 === 0 ? 10 : -10); // very low variance
      }
      const res = analyzeCadence(strokes);
      assert.ok(res.cadenceScore >= 85, `Cadence should be high, got ${res.cadenceScore}`);
      assert.equal(res.pauseCount, 0);
    });

    it('penalizes hesitation pauses and erratic rhythm bursts', () => {
      const strokes = [];
      let t = 1000;
      for (let i = 0; i < 15; i++) {
        strokes.push({ key: 'a', time: t });
        t += (i === 5 || i === 10) ? 2000 : 120; // 2 big pauses (>1.2s)
      }
      const res = analyzeCadence(strokes);
      assert.ok(res.pauseCount >= 2);
      assert.ok(res.cadenceScore < 75, `Expected penalized cadence, got ${res.cadenceScore}`);
    });
  });

  describe('3. Tier Performance Evaluation & Weak Keys', () => {
    it('evaluates gross WPM, net WPM, accuracy, and categorizes competencies', () => {
      const tier = PLACEMENT_TIERS[0];
      const target = tier.text; // 'all glass flags fall glad flasks jazz asks'
      const typed = target;
      const durationSeconds = 10;
      const strokes = target.split('').map((char, i) => ({ key: char, time: 1000 + (i * 200) }));

      const evalResult = evaluateTierPerformance({
        targetText: target,
        typedText: typed,
        keystrokes: strokes,
        durationSeconds,
      });

      assert.equal(evalResult.overallAccuracy, 100);
      assert.ok(evalResult.grossWpm > 0);
      assert.equal(evalResult.errorCount, 0);
      assert.equal(evalResult.competencies.home_row.accuracy, 100);
      assert.equal(evalResult.competencies.spacebar.accuracy, 100);
    });

    it('correctly attributes errors to weak keys list', () => {
      const target = 'all glass flags';
      const typed = 'all gloxx flags'; // 'a', 's' mistyped as 'o', 'x'
      const evalResult = evaluateTierPerformance({
        targetText: target,
        typedText: typed,
        keystrokes: [],
        durationSeconds: 5,
      });

      assert.ok(evalResult.overallAccuracy < 100);
      assert.ok(evalResult.weakKeys.includes('a') || evalResult.weakKeys.includes('s'));
    });
  });

  describe('4. Intelligent 10-Stage Recommendation Logic (All 12 Prompt Scenarios)', () => {

    it('Scenario 1: Beginner with low speed (12 WPM) and low accuracy (75%) -> Stage 1', () => {
      const profile = {
        grossWpm: 12,
        overallAccuracy: 75,
        cadenceScore: 60,
        competencies: {
          home_row: { accuracy: 78, wpm: 12 },
          top_row: { accuracy: 70, wpm: 12 },
          bottom_row: { accuracy: 65, wpm: 12 },
          spacebar: { accuracy: 75, wpm: 12 },
          numbers: { accuracy: 50, wpm: 12 },
        },
        weakKeys: ['f', 'j', 'd'],
      };
      const rec = calculateStageRecommendation(profile);
      assert.equal(rec.recommendedStage, 1);
      assert.match(rec.reason, /Foundational touch-typing anchors/);
      assert.equal(rec.startingLessonLogicalId, 'S01-L001');
    });

    it('Scenario 2: Beginner with good accuracy (95%) but low speed (18 WPM) -> Stage 1', () => {
      const profile = {
        grossWpm: 18, // < 20 WPM threshold for Stage 2
        overallAccuracy: 95,
        cadenceScore: 80,
        competencies: {
          home_row: { accuracy: 96, wpm: 18 },
          top_row: { accuracy: 94, wpm: 18 },
          bottom_row: { accuracy: 92, wpm: 18 },
          spacebar: { accuracy: 95, wpm: 18 },
        },
      };
      const rec = calculateStageRecommendation(profile);
      assert.equal(rec.recommendedStage, 1);
      assert.ok(rec.strengths.length > 0);
    });

    it('Scenario 3: Intermediate typist (55 WPM, 96% alphabet) with weak numbers (70%) -> Gated to Stage 5', () => {
      const profile = {
        grossWpm: 55,
        overallAccuracy: 92,
        cadenceScore: 82,
        competencies: {
          home_row: { accuracy: 98, wpm: 55 },
          top_row: { accuracy: 96, wpm: 55 },
          bottom_row: { accuracy: 95, wpm: 55 },
          spacebar: { accuracy: 98, wpm: 55 },
          numbers: { accuracy: 70, wpm: 40 }, // FAILED NUMBER GATE (<88%)
          punctuation: { accuracy: 90, wpm: 50 },
          shift_symbols: { accuracy: 90, wpm: 50 },
        },
      };
      const rec = calculateStageRecommendation(profile);
      assert.equal(rec.recommendedStage, 5);
      assert.match(rec.reason, /top number row/);
    });

    it('Scenario 4: High speed typist (70 WPM) with poor accuracy (80%) -> Gated to Foundation / Top Row', () => {
      const profile = {
        grossWpm: 70,
        overallAccuracy: 80,
        cadenceScore: 75,
        competencies: {
          home_row: { accuracy: 82, wpm: 70 }, // Poor home row
          top_row: { accuracy: 80, wpm: 70 },
          bottom_row: { accuracy: 78, wpm: 70 },
          spacebar: { accuracy: 85, wpm: 70 },
        },
      };
      const rec = calculateStageRecommendation(profile);
      assert.equal(rec.recommendedStage, 1); // Foundational gatekeeper
    });

    it('Scenario 5: Solid alphabet typist (38 WPM, 95% acc) with erratic cadence / bursts -> Stage 4', () => {
      const profile = {
        grossWpm: 38,
        overallAccuracy: 95,
        cadenceScore: 55, // Inconsistent cadence (<60)
        competencies: {
          home_row: { accuracy: 96, wpm: 38 },
          top_row: { accuracy: 95, wpm: 38 },
          bottom_row: { accuracy: 92, wpm: 38 },
          spacebar: { accuracy: 94, wpm: 38 },
        },
      };
      const rec = calculateStageRecommendation(profile);
      assert.equal(rec.recommendedStage, 4);
      assert.match(rec.reason, /cross-row/);
    });

    it('Scenario 6: Strong sentence typist (52 WPM) with weak punctuation & shift (76%) -> Gated to Stage 6', () => {
      const profile = {
        grossWpm: 52,
        overallAccuracy: 91,
        cadenceScore: 80,
        competencies: {
          home_row: { accuracy: 98, wpm: 52 },
          top_row: { accuracy: 96, wpm: 52 },
          bottom_row: { accuracy: 95, wpm: 52 },
          spacebar: { accuracy: 96, wpm: 52 },
          numbers: { accuracy: 92, wpm: 48 }, // numbers passed
          punctuation: { accuracy: 76, wpm: 40 }, // FAILED PUNCTUATION (<88%)
          shift_symbols: { accuracy: 74, wpm: 40 },
        },
      };
      const rec = calculateStageRecommendation(profile);
      assert.equal(rec.recommendedStage, 6);
      assert.match(rec.reason, /Shift coordination and punctuation/);
    });

    it('Scenario 7: Advanced typist with steady speed (68 WPM, 96% acc across all keys) -> Stage 8', () => {
      const profile = {
        grossWpm: 68,
        overallAccuracy: 96,
        cadenceScore: 84,
        competencies: {
          home_row: { accuracy: 98, wpm: 68 },
          top_row: { accuracy: 97, wpm: 68 },
          bottom_row: { accuracy: 95, wpm: 68 },
          spacebar: { accuracy: 98, wpm: 68 },
          numbers: { accuracy: 94, wpm: 60 },
          punctuation: { accuracy: 95, wpm: 62 },
          shift_symbols: { accuracy: 94, wpm: 62 },
        },
      };
      const rec = calculateStageRecommendation(profile);
      assert.equal(rec.recommendedStage, 8);
      assert.match(rec.reason, /Speed & Endurance/i);
    });

    it('Scenario 8: High velocity (78 WPM) but weak technical brackets -> Stage 9', () => {
      const profile = {
        grossWpm: 78,
        overallAccuracy: 95,
        cadenceScore: 86,
        competencies: {
          home_row: { accuracy: 98, wpm: 78 },
          top_row: { accuracy: 97, wpm: 78 },
          bottom_row: { accuracy: 96, wpm: 78 },
          spacebar: { accuracy: 98, wpm: 78 },
          numbers: { accuracy: 95, wpm: 70 },
          punctuation: { accuracy: 95, wpm: 72 },
          shift_symbols: { accuracy: 94, wpm: 70 },
          code_syntax: { accuracy: 72, wpm: 50 }, // Weak technical syntax (<88%)
        },
      };
      const rec = calculateStageRecommendation(profile);
      assert.equal(rec.recommendedStage, 9);
      assert.match(rec.reason, /programming syntax/i);
    });

    it('Scenario 9: Elite Grandmaster (88 WPM, 97% acc, code 94%, cadence 90%) -> Stage 10', () => {
      const profile = {
        grossWpm: 88,
        overallAccuracy: 97,
        cadenceScore: 90,
        competencies: {
          home_row: { accuracy: 99, wpm: 88 },
          top_row: { accuracy: 98, wpm: 88 },
          bottom_row: { accuracy: 97, wpm: 88 },
          spacebar: { accuracy: 99, wpm: 88 },
          numbers: { accuracy: 96, wpm: 80 },
          punctuation: { accuracy: 96, wpm: 82 },
          shift_symbols: { accuracy: 96, wpm: 82 },
          code_syntax: { accuracy: 94, wpm: 78 },
        },
      };
      const rec = calculateStageRecommendation(profile);
      assert.equal(rec.recommendedStage, 10);
      assert.match(rec.reason, /Grandmaster qualified/i);
    });

    it('Scenario 10: Aggregates multiple tiers safely without losing data or fabricating NaN', () => {
      const t1 = {
        typedTextLength: 40,
        errorCount: 1,
        uncorrectedErrors: 1,
        durationSeconds: 10,
        grossWpm: 48,
        keystrokeCount: 40,
        cadenceStats: { cadenceScore: 82 },
        weakKeys: ['f'],
        competencies: {
          home_row: { correct: 35, total: 36 },
          spacebar: { correct: 4, total: 4, missing: 0, extra: 0 },
        },
      };
      const t2 = {
        typedTextLength: 50,
        errorCount: 2,
        uncorrectedErrors: 2,
        durationSeconds: 12,
        grossWpm: 50,
        keystrokeCount: 50,
        cadenceStats: { cadenceScore: 85 },
        weakKeys: ['z'],
        competencies: {
          top_row: { correct: 20, total: 21 },
          bottom_row: { correct: 15, total: 16 },
          spacebar: { correct: 8, total: 8, missing: 0, extra: 0 },
        },
      };

      const agg = aggregateAssessmentProfile([t1, t2]);
      assert.ok(agg.grossWpm > 0);
      assert.ok(agg.overallAccuracy >= 90);
      assert.equal(agg.totalErrors, 3);
      assert.ok(agg.weakKeys.includes('f') || agg.weakKeys.includes('z'));
    });

    it('Scenario 11: Safely handles single-tier beginner interruption / conclusion without crash', () => {
      const singleTier = [{
        typedTextLength: 20,
        errorCount: 5,
        uncorrectedErrors: 5,
        durationSeconds: 15,
        grossWpm: 16,
        keystrokeCount: 20,
        cadenceStats: { cadenceScore: 50 },
        weakKeys: ['a', 's'],
        competencies: {
          home_row: { correct: 15, total: 20 },
          spacebar: { correct: 2, total: 3, missing: 1, extra: 0 },
        },
      }];
      const agg = aggregateAssessmentProfile(singleTier);
      assert.ok(agg);
      const rec = calculateStageRecommendation(agg);
      assert.equal(rec.recommendedStage, 1);
    });

    it('Scenario 12: Zero-fabrication guarantee contract verification', () => {
      const profile = {
        grossWpm: 60,
        overallAccuracy: 95,
        cadenceScore: 80,
        competencies: {
          home_row: { accuracy: 96, wpm: 60 },
          top_row: { accuracy: 95, wpm: 60 },
          bottom_row: { accuracy: 94, wpm: 60 },
          spacebar: { accuracy: 96, wpm: 60 },
          numbers: { accuracy: 94, wpm: 55 },
          punctuation: { accuracy: 92, wpm: 55 },
          shift_symbols: { accuracy: 92, wpm: 55 },
        },
      };
      const rec = calculateStageRecommendation(profile);
      assert.equal(rec.recommendedStage, 7);
      // Verify structure has startingUnit 1 and startingLevel 1 without claiming any completed levels
      assert.equal(rec.recommendedUnit, 1);
      assert.equal(rec.recommendedLevel, 1);
      assert.equal(rec.startingLessonLogicalId, 'S07-L001');
    });
  });
});
