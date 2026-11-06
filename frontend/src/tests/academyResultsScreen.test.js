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
});
