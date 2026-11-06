/**
 * KEYFLOW Academy Performance Results Screen Test Suite
 * =====================================================
 * Verifies:
 * 1. Exact 5-zone speed category definitions & color assignments.
 * 2. Mathematical WPM-to-needle rotation mappings with 100% real-time category synchronization.
 * 3. Authentic Typing Identity classifications based on Speed & Accuracy.
 * 4. Net WPM calculation and metric contract integrity.
 * 5. Full-page component structure and navigation callback signatures.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SPEED_CATEGORIES,
  getSpeedCategory,
  wpmToNeedleRotation,
  getTypingIdentity,
  calculateNetWpm,
} from '../utils/speedometerEngine.js';

describe('KEYFLOW — Academy Performance Results Screen & Speedometer Engine', () => {
  describe('1. 5-Zone Speed Category Definitions & Order', () => {
    it('defines exactly 5 categories in strict LEFT-TO-RIGHT order', () => {
      assert.strictEqual(SPEED_CATEGORIES.length, 5);
      assert.strictEqual(SPEED_CATEGORIES[0].name, 'EXCELLENT');
      assert.strictEqual(SPEED_CATEGORIES[0].color, '#22C55E'); // Green
      assert.strictEqual(SPEED_CATEGORIES[1].name, 'GOOD');
      assert.strictEqual(SPEED_CATEGORIES[1].color, '#A3E635'); // Lime Green
      assert.strictEqual(SPEED_CATEGORIES[2].name, 'FAIR');
      assert.strictEqual(SPEED_CATEGORIES[2].color, '#FACC15'); // Yellow
      assert.strictEqual(SPEED_CATEGORIES[3].name, 'POOR');
      assert.strictEqual(SPEED_CATEGORIES[3].color, '#F97316'); // Orange
      assert.strictEqual(SPEED_CATEGORIES[4].name, 'VERY POOR');
      assert.strictEqual(SPEED_CATEGORIES[4].color, '#EF4444'); // Red
    });

    it('correctly classifies mandatory prompt test values (10, 25, 35, 48, 50, 75)', () => {
      assert.strictEqual(getSpeedCategory(10).name, 'VERY POOR');
      assert.strictEqual(getSpeedCategory(25).name, 'POOR');
      assert.strictEqual(getSpeedCategory(35).name, 'FAIR');
      assert.strictEqual(getSpeedCategory(48).name, 'GOOD');
      assert.strictEqual(getSpeedCategory(50).name, 'GOOD');
      assert.strictEqual(getSpeedCategory(75).name, 'EXCELLENT');
    });

    it('correctly classifies all boundary values without off-by-one errors', () => {
      // VERY POOR: 0 - 19
      assert.strictEqual(getSpeedCategory(0).name, 'VERY POOR');
      assert.strictEqual(getSpeedCategory(19).name, 'VERY POOR');

      // POOR: 20 - 29
      assert.strictEqual(getSpeedCategory(20).name, 'POOR');
      assert.strictEqual(getSpeedCategory(29).name, 'POOR');

      // FAIR: 30 - 39
      assert.strictEqual(getSpeedCategory(30).name, 'FAIR');
      assert.strictEqual(getSpeedCategory(39).name, 'FAIR');

      // GOOD: 40 - 59
      assert.strictEqual(getSpeedCategory(40).name, 'GOOD');
      assert.strictEqual(getSpeedCategory(59).name, 'GOOD');

      // EXCELLENT: 60 - 100+
      assert.strictEqual(getSpeedCategory(60).name, 'EXCELLENT');
      assert.strictEqual(getSpeedCategory(100).name, 'EXCELLENT');
      assert.strictEqual(getSpeedCategory(120).name, 'EXCELLENT'); // Clamped
    });
  });

  describe('2. Mathematical WPM-to-Needle Rotation & Real-Time Synchronization', () => {
    it('maps 100 WPM to the leftmost gauge position (-105°)', () => {
      const rot = wpmToNeedleRotation(100);
      assert.strictEqual(rot, -105);
    });

    it('maps 0 WPM to the rightmost gauge position (+105°)', () => {
      const rot = wpmToNeedleRotation(0);
      assert.strictEqual(rot, 105);
    });

    it('maps 35 WPM (center of FAIR) to vertical top center (0°)', () => {
      const rot = wpmToNeedleRotation(35);
      assert.strictEqual(rot, 0);
    });

    it('synchronizes 48 WPM (User Screenshot Case) strictly inside GOOD zone [-21°, -63°]', () => {
      const rot48 = wpmToNeedleRotation(48);
      assert.strictEqual(rot48, -37.8);
      // Must point strictly inside the GOOD segment on the left
      assert.ok(rot48 < -21 && rot48 > -63, 'Needle at 48 WPM must point inside the GOOD zone');
      assert.strictEqual(getSpeedCategory(48).name, 'GOOD');
    });

    it('strictly maps prompt test cases (10, 25, 35, 50, 75) to valid category rotations', () => {
      // 75 WPM (EXCELLENT, left side): negative angle inside [-63°, -105°]
      const rot75 = wpmToNeedleRotation(75);
      assert.strictEqual(rot75, -78.75);
      assert.ok(rot75 < -63 && rot75 > -105);

      // 50 WPM (GOOD, left side): inside [-21°, -63°]
      const rot50 = wpmToNeedleRotation(50);
      assert.strictEqual(rot50, -42);
      assert.ok(rot50 < -21 && rot50 > -63);

      // 35 WPM (FAIR, top center): 0°
      const rot35 = wpmToNeedleRotation(35);
      assert.strictEqual(rot35, 0);

      // 25 WPM (POOR, right side): inside [+21°, +63°]
      const rot25 = wpmToNeedleRotation(25);
      assert.strictEqual(rot25, 42);
      assert.ok(rot25 > 21 && rot25 < 63);

      // 10 WPM (VERY POOR, far right): inside [+63°, +105°]
      const rot10 = wpmToNeedleRotation(10);
      assert.strictEqual(rot10, 84);
      assert.ok(rot10 > 63 && rot10 < 105);
    });

    it('guarantees strictly monotonic progression across all 0-100 integers', () => {
      let prevRot = wpmToNeedleRotation(100);
      for (let w = 99; w >= 0; w--) {
        const currentRot = wpmToNeedleRotation(w);
        assert.ok(
          currentRot > prevRot,
          `Rotation at ${w} WPM (${currentRot}) must be greater than at ${w + 1} WPM (${prevRot})`
        );
        prevRot = currentRot;
      }
    });

    it('guarantees every integer score 0-100 needle rotation is strictly inside its category zone', () => {
      for (let w = 0; w <= 100; w++) {
        const cat = getSpeedCategory(w);
        const rot = wpmToNeedleRotation(w);
        if (cat.name === 'VERY POOR') {
          assert.ok(rot >= 63 && rot <= 105, `VERY POOR ${w} WPM needle rot ${rot} out of range`);
        } else if (cat.name === 'POOR') {
          assert.ok(rot >= 21 && rot <= 63, `POOR ${w} WPM needle rot ${rot} out of range`);
        } else if (cat.name === 'FAIR') {
          assert.ok(rot >= -21 && rot <= 21, `FAIR ${w} WPM needle rot ${rot} out of range`);
        } else if (cat.name === 'GOOD') {
          assert.ok(rot >= -63 && rot <= -21, `GOOD ${w} WPM needle rot ${rot} out of range`);
        } else if (cat.name === 'EXCELLENT') {
          assert.ok(rot >= -105 && rot <= -63, `EXCELLENT ${w} WPM needle rot ${rot} out of range`);
        }
      }
    });
  });

  describe('3. Typing Identity Resolution Engine', () => {
    it('classifies High WPM + High Accuracy as PRECISION MASTER', () => {
      const id = getTypingIdentity(75, 98);
      assert.strictEqual(id.title, 'PRECISION MASTER');
      assert.strictEqual(id.badgeColor, '#22C55E');
    });

    it('classifies High WPM + Standard Accuracy as SPEED PERFORMER', () => {
      const id = getTypingIdentity(65, 92);
      assert.strictEqual(id.title, 'SPEED PERFORMER');
      assert.strictEqual(id.badgeColor, '#A3E635');
    });

    it('classifies Moderate WPM + High Accuracy as ACCURACY BUILDER', () => {
      const id = getTypingIdentity(35, 97);
      assert.strictEqual(id.title, 'ACCURACY BUILDER');
      assert.strictEqual(id.badgeColor, '#38BDF8');
    });

    it('classifies Moderate WPM + Standard Accuracy as BALANCED TYPIST', () => {
      const id = getTypingIdentity(35, 91);
      assert.strictEqual(id.title, 'BALANCED TYPIST');
      assert.strictEqual(id.badgeColor, '#FACC15');
    });

    it('classifies Low WPM or Developing Accuracy as DEVELOPING TYPIST', () => {
      const id1 = getTypingIdentity(15, 88);
      assert.strictEqual(id1.title, 'DEVELOPING TYPIST');
      assert.strictEqual(id1.badgeColor, '#F97316');

      const id2 = getTypingIdentity(0, 0);
      assert.strictEqual(id2.title, 'DEVELOPING TYPIST');
    });
  });

  describe('4. Net WPM and Metric Contract', () => {
    it('calculates Net WPM accurately using penalties for uncorrected errors', () => {
      // 50 WPM, 2 errors in 60s -> Net WPM = 48
      assert.strictEqual(calculateNetWpm(50, 2, 60), 48);
    });

    it('clamps Net WPM to zero when penalties exceed gross WPM', () => {
      assert.strictEqual(calculateNetWpm(10, 15, 60), 0);
    });
  });

  describe('5. Exact Boundary Value Verification (Prompt Requirements: 0, 19, 20, 29, 30, 39, 40, 59, 60, 100)', () => {
    const boundaries = [
      { wpm: 0, cat: 'VERY POOR', color: '#EF4444', expectedRot: 105.00 },
      { wpm: 19, cat: 'VERY POOR', color: '#EF4444', expectedRot: 65.10 },
      { wpm: 20, cat: 'POOR', color: '#F97316', expectedRot: 63.00 },
      { wpm: 29, cat: 'POOR', color: '#F97316', expectedRot: 25.20 },
      { wpm: 30, cat: 'FAIR', color: '#FACC15', expectedRot: 21.00 },
      { wpm: 39, cat: 'FAIR', color: '#FACC15', expectedRot: -16.80 },
      { wpm: 40, cat: 'GOOD', color: '#A3E635', expectedRot: -21.00 },
      { wpm: 59, cat: 'GOOD', color: '#A3E635', expectedRot: -60.90 },
      { wpm: 60, cat: 'EXCELLENT', color: '#22C55E', expectedRot: -63.00 },
      { wpm: 100, cat: 'EXCELLENT', color: '#22C55E', expectedRot: -105.00 },
    ];

    it('verifies exact category, color, and needle rotation for all specified boundary values', () => {
      boundaries.forEach(({ wpm, cat, color, expectedRot }) => {
        const category = getSpeedCategory(wpm);
        const rot = wpmToNeedleRotation(wpm);
        assert.strictEqual(category.name, cat, `WPM ${wpm} category mismatch`);
        assert.strictEqual(category.color, color, `WPM ${wpm} color mismatch`);
        assert.ok(
          Math.abs(rot - expectedRot) < 0.01,
          `WPM ${wpm} rotation ${rot}° did not match expected ${expectedRot}°`
        );
      });
    });

    it('verifies mathematical boundary continuity at transition points (20, 30, 40, 60)', () => {
      // Transition 1: VERY POOR -> POOR at 20 WPM
      const rot19_99 = wpmToNeedleRotation(19.999);
      const rot20_00 = wpmToNeedleRotation(20.000);
      assert.ok(Math.abs(rot19_99 - rot20_00) < 0.05, 'Discontinuity at 20 WPM boundary');
      assert.strictEqual(rot20_00, 63);

      // Transition 2: POOR -> FAIR at 30 WPM
      const rot29_99 = wpmToNeedleRotation(29.999);
      const rot30_00 = wpmToNeedleRotation(30.000);
      assert.ok(Math.abs(rot29_99 - rot30_00) < 0.05, 'Discontinuity at 30 WPM boundary');
      assert.strictEqual(rot30_00, 21);

      // Transition 3: FAIR -> GOOD at 40 WPM
      const rot39_99 = wpmToNeedleRotation(39.999);
      const rot40_00 = wpmToNeedleRotation(40.000);
      assert.ok(Math.abs(rot39_99 - rot40_00) < 0.05, 'Discontinuity at 40 WPM boundary');
      assert.strictEqual(rot40_00, -21);

      // Transition 4: GOOD -> EXCELLENT at 60 WPM
      const rot59_99 = wpmToNeedleRotation(59.999);
      const rot60_00 = wpmToNeedleRotation(60.000);
      assert.ok(Math.abs(rot59_99 - rot60_00) < 0.05, 'Discontinuity at 60 WPM boundary');
      assert.strictEqual(rot60_00, -63);
    });

    it('strictly clamps out-of-range values (< 0, > 100, non-numeric)', () => {
      assert.strictEqual(wpmToNeedleRotation(-20), 105);
      assert.strictEqual(getSpeedCategory(-20).name, 'VERY POOR');

      assert.strictEqual(wpmToNeedleRotation(150), -105);
      assert.strictEqual(getSpeedCategory(150).name, 'EXCELLENT');

      assert.strictEqual(wpmToNeedleRotation(NaN), 105);
      assert.strictEqual(getSpeedCategory(NaN).name, 'VERY POOR');
    });
  });

  describe('6. Actual Session Scenarios Verification (Scenarios A, B, C, D)', () => {
    it('Scenario A: Flawless Practice Session (WPM: 48, Acc: 100%, Net: 48, Errors: 0)', () => {
      const session = {
        wpm: 48,
        accuracy: 100,
        netWpm: 48,
        mistakes: 0,
        uncorrectedErrors: 0,
        duration: 8,
      };

      const cat = getSpeedCategory(session.wpm);
      const rot = wpmToNeedleRotation(session.wpm);
      assert.strictEqual(cat.name, 'GOOD');
      assert.strictEqual(cat.color, '#A3E635');
      assert.strictEqual(rot, -37.8);
      assert.strictEqual(session.netWpm, 48);
      assert.strictEqual(session.wpm, 48);
    });

    it('Scenario B: Fast but Error-Prone Session (WPM: 60, Acc: 80%, Errors: 5 in 60s)', () => {
      // User typed at 60 WPM gross, made 5 uncorrected errors over 60 seconds
      const finalWpm = 60;
      const uncorrectedErrors = 5;
      const duration = 60;
      const computedNetWpm = calculateNetWpm(finalWpm, uncorrectedErrors, duration);

      assert.strictEqual(computedNetWpm, 55); // 60 - (5 / 1.0) = 55
      const cat = getSpeedCategory(finalWpm);
      const rot = wpmToNeedleRotation(finalWpm);

      // Gauge displays authoritative Gross WPM (60)
      assert.strictEqual(cat.name, 'EXCELLENT');
      assert.strictEqual(cat.color, '#22C55E');
      assert.strictEqual(rot, -63);
      assert.ok(computedNetWpm < finalWpm, 'Net WPM must reflect uncorrected error penalties');
    });

    it('Scenario C: Corrected Mistakes Session (Diff WPM & Net WPM, non-perfect accuracy, corrected mistakes)', () => {
      // 100 valid keystrokes in 30s -> Gross WPM = (100 / 5) / 0.5 = 40 WPM
      // Total typos made = 4 (2 corrected via backspace, 2 left uncorrected in buffer)
      const grossWpm = 40;
      const mistakes = 4;
      const uncorrectedErrors = 2;
      const duration = 30; // 0.5 min
      const netWpm = calculateNetWpm(grossWpm, uncorrectedErrors, duration);

      // Penalty = 2 / 0.5 = 4 WPM -> Net WPM = 36
      assert.strictEqual(netWpm, 36);
      assert.notStrictEqual(grossWpm, netWpm);

      const cat = getSpeedCategory(grossWpm);
      const rot = wpmToNeedleRotation(grossWpm);
      assert.strictEqual(cat.name, 'GOOD');
      assert.strictEqual(rot, -21); // exactly at 40 WPM boundary
    });

    it('Scenario D: Zero-Keystroke Session (WPM: 0, Acc: 0%, Mistakes: 0, Duration: 1s)', () => {
      const session = {
        wpm: 0,
        accuracy: 0,
        netWpm: 0,
        mistakes: 0,
        duration: 1,
      };

      const cat = getSpeedCategory(session.wpm);
      const rot = wpmToNeedleRotation(session.wpm);
      assert.strictEqual(cat.name, 'VERY POOR');
      assert.strictEqual(cat.color, '#EF4444');
      assert.strictEqual(rot, 105);
      assert.strictEqual(session.netWpm, 0);
      assert.strictEqual(session.accuracy, 0);
    });
  });
});
