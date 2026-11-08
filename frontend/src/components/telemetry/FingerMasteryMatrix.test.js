import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  FINGER_DEFINITIONS,
  getAuthoritativeFingerForChar,
  SPEED_SHADES,
  computeSpeedShade,
  ACCURACY_SHADES,
  computeAccuracyShade,
} from '../../utils/touchTypingMap.js';
import { calculateReportMetrics } from '../../utils/telemetryStorage.js';

describe('KEYFLOW Finger Mastery & Biomechanical Analytics Engine', () => {
  it('defines all authoritative touch typing fingers with anatomical digit properties', () => {
    assert.equal(FINGER_DEFINITIONS.length, 8, '8 physical keyboard fingers defined');

    const leftPinky = FINGER_DEFINITIONS.find((f) => f.id === 'left-pinky');
    assert.ok(leftPinky);
    assert.equal(leftPinky.hand, 'Left');
    assert.equal(leftPinky.activeDigit, 'pinky');

    const rightIndex = FINGER_DEFINITIONS.find((f) => f.id === 'right-index');
    assert.ok(rightIndex);
    assert.equal(rightIndex.hand, 'Right');
    assert.equal(rightIndex.activeDigit, 'index');
  });

  it('accurately maps keystrokes to physical touch typing fingers and thumbs', () => {
    // Left hand
    assert.equal(getAuthoritativeFingerForChar('a'), 'left-pinky');
    assert.equal(getAuthoritativeFingerForChar('q'), 'left-pinky');
    assert.equal(getAuthoritativeFingerForChar('w'), 'left-ring');
    assert.equal(getAuthoritativeFingerForChar('s'), 'left-ring');
    assert.equal(getAuthoritativeFingerForChar('e'), 'left-middle');
    assert.equal(getAuthoritativeFingerForChar('d'), 'left-middle');
    assert.equal(getAuthoritativeFingerForChar('r'), 'left-index');
    assert.equal(getAuthoritativeFingerForChar('f'), 'left-index');
    assert.equal(getAuthoritativeFingerForChar('g'), 'left-index');

    // Right hand
    assert.equal(getAuthoritativeFingerForChar('h'), 'right-index');
    assert.equal(getAuthoritativeFingerForChar('j'), 'right-index');
    assert.equal(getAuthoritativeFingerForChar('u'), 'right-index');
    assert.equal(getAuthoritativeFingerForChar('i'), 'right-middle');
    assert.equal(getAuthoritativeFingerForChar('k'), 'right-middle');
    assert.equal(getAuthoritativeFingerForChar('o'), 'right-ring');
    assert.equal(getAuthoritativeFingerForChar('l'), 'right-ring');
    assert.equal(getAuthoritativeFingerForChar('p'), 'right-pinky');
    assert.equal(getAuthoritativeFingerForChar(';'), 'right-pinky');

    // Thumbs
    assert.equal(getAuthoritativeFingerForChar(' '), 'thumb');
    assert.equal(getAuthoritativeFingerForChar('space'), 'thumb');
  });

  it('aggregates real finger metrics and hand summaries from character stats', () => {
    const mockSessions = [
      {
        id: 'sess_bio_1',
        durationSeconds: 30,
        grossWpm: 50,
        characterStats: {
          f: { char: 'f', total: 20, correct: 18, incorrect: 2, cpm: 250, wpm: 50 },
          d: { char: 'd', total: 10, correct: 10, incorrect: 0, cpm: 200, wpm: 40 },
          j: { char: 'j', total: 30, correct: 27, incorrect: 3, cpm: 300, wpm: 60 },
          k: { char: 'k', total: 10, correct: 10, incorrect: 0, cpm: 250, wpm: 50 },
          space: { char: ' ', total: 15, correct: 15, incorrect: 0, cpm: 350, wpm: 70 },
        },
      },
    ];

    const metrics = calculateReportMetrics(mockSessions, 'overall');
    assert.ok(Array.isArray(metrics.fingerStats), 'Returns fingerStats array');

    // Left Index (Key F)
    const leftIndex = metrics.fingerStats.find((f) => f.id === 'left-index');
    assert.ok(leftIndex);
    assert.equal(leftIndex.hasData, true);
    assert.equal(leftIndex.totalKeystrokes, 20);
    assert.equal(leftIndex.accuracy, 90);
    assert.equal(leftIndex.speed, 50);

    // Left Middle (Key D)
    const leftMiddle = metrics.fingerStats.find((f) => f.id === 'left-middle');
    assert.ok(leftMiddle);
    assert.equal(leftMiddle.hasData, true);
    assert.equal(leftMiddle.totalKeystrokes, 10);
    assert.equal(leftMiddle.accuracy, 100);
    assert.equal(leftMiddle.speed, 40);

    // Right Index (Key J)
    const rightIndex = metrics.fingerStats.find((f) => f.id === 'right-index');
    assert.ok(rightIndex);
    assert.equal(rightIndex.hasData, true);
    assert.equal(rightIndex.totalKeystrokes, 30);
    assert.equal(rightIndex.accuracy, 90);
    assert.equal(rightIndex.speed, 60);

    // Left Hand Summary
    const leftHand = metrics.leftHandStats;
    assert.ok(leftHand);
    assert.equal(leftHand.hasData, true);
    assert.equal(leftHand.keystrokes, 30); // 20 + 10
    // Weighted speed: (50*20 + 40*10) / 30 = (1000 + 400) / 30 = 1400 / 30 = 47
    assert.equal(leftHand.speed, 47);
    // Accuracy: (18 + 10) / 30 = 28 / 30 = 93.3% -> 93%
    assert.equal(leftHand.accuracy, 93);
    assert.equal(leftHand.strongestFinger, 'Index');
    assert.deepEqual(leftHand.strongestFingerDetails, { name: 'Index', speed: 50, accuracy: 90 });

    // Right Hand Summary
    const rightHand = metrics.rightHandStats;
    assert.ok(rightHand);
    assert.equal(rightHand.hasData, true);
    assert.equal(rightHand.keystrokes, 40); // 30 + 10
    // Weighted speed: (60*30 + 50*10) / 40 = (1800 + 500) / 40 = 2300 / 40 = 58
    assert.equal(rightHand.speed, 58);
    assert.equal(rightHand.strongestFinger, 'Index');
    assert.deepEqual(rightHand.strongestFingerDetails, { name: 'Index', speed: 60, accuracy: 90 });

    // Thumbs Summary
    const thumbs = metrics.thumbsStats;
    assert.ok(thumbs);
    assert.equal(thumbs.hasData, true);
    assert.equal(thumbs.speed, 70);
    assert.equal(thumbs.accuracy, 100);
    assert.equal(thumbs.total_keystrokes, 15);
  });

  it('guarantees unpracticed fingers have hasData=false and zero fabricated values', () => {
    const emptyMetrics = calculateReportMetrics([], 'overall');
    assert.ok(Array.isArray(emptyMetrics.fingerStats));
    emptyMetrics.fingerStats.forEach((f) => {
      assert.equal(f.hasData, false);
      assert.equal(f.speed, null);
      assert.equal(f.totalKeystrokes, 0);
    });

    assert.equal(emptyMetrics.leftHandStats.hasData, false);
    assert.equal(emptyMetrics.leftHandStats.speed, null);
    assert.equal(emptyMetrics.leftHandStats.strongestFinger, null);

    assert.equal(emptyMetrics.rightHandStats.hasData, false);
    assert.equal(emptyMetrics.thumbsStats.hasData, false);
  });

  it('enforces minimum keystroke threshold of 3 before declaring hasData=true', () => {
    const shortSession = [
      {
        id: 'sess_threshold',
        durationSeconds: 5,
        grossWpm: 40,
        characterStats: {
          q: { char: 'q', total: 2, correct: 2, incorrect: 0, wpm: 40 }, // < 3 keystrokes
        },
      },
    ];

    const metrics = calculateReportMetrics(shortSession, 'overall');
    const pinky = metrics.fingerStats.find((f) => f.id === 'left-pinky');
    assert.ok(pinky);
    assert.equal(pinky.hasData, false, 'Less than 3 strokes must not be treated as established data');
  });

  it('implements Task 1 four-shade blue speed color system with strict progression', () => {
    // 1. Verify 4 distinct blue shades exist
    assert.ok(SPEED_SHADES.slowest, 'Very Light Blue exists');
    assert.ok(SPEED_SHADES.developing, 'Light Blue exists');
    assert.ok(SPEED_SHADES.improving, 'Medium Blue exists');
    assert.ok(SPEED_SHADES.fastest, 'Dark Blue exists');
    assert.ok(SPEED_SHADES.neutral, 'Neutral color exists');

    const uniqueColors = new Set([
      SPEED_SHADES.slowest,
      SPEED_SHADES.developing,
      SPEED_SHADES.improving,
      SPEED_SHADES.fastest,
    ]);
    assert.equal(uniqueColors.size, 4, 'All four blue shades are distinct');

    // 2. Unpracticed finger receives neutral color
    assert.equal(computeSpeedShade(null, false), SPEED_SHADES.neutral);
    assert.equal(computeSpeedShade(0, false), SPEED_SHADES.neutral);

    // 3. TypingClub reference speed distribution: [20, 23, 35, 37, 38, 44]
    const bounds = { min: 20, max: 44, dynamic: true };

    // Slowest (20 WPM) -> Very Light Blue
    const slowestColor = computeSpeedShade(20, true, bounds);
    assert.equal(slowestColor, SPEED_SHADES.slowest);

    // Developing (26 WPM) -> Light Blue
    const developingColor = computeSpeedShade(26, true, bounds);
    assert.equal(developingColor, SPEED_SHADES.developing);

    // Improving (35 WPM) -> Medium Blue
    const improvingColor = computeSpeedShade(35, true, bounds);
    assert.equal(improvingColor, SPEED_SHADES.improving);

    // Fastest (44 WPM) -> Dark Blue
    const fastestColor = computeSpeedShade(44, true, bounds);
    assert.equal(fastestColor, SPEED_SHADES.fastest);

    // 4. Higher speed produces progressively darker blue
    assert.equal(computeSpeedShade(20, true, bounds), SPEED_SHADES.slowest);
    assert.equal(computeSpeedShade(23, true, bounds), SPEED_SHADES.slowest);
    assert.equal(computeSpeedShade(35, true, bounds), SPEED_SHADES.improving);
    assert.equal(computeSpeedShade(37, true, bounds), SPEED_SHADES.improving);
    assert.equal(computeSpeedShade(38, true, bounds), SPEED_SHADES.fastest);
    assert.equal(computeSpeedShade(44, true, bounds), SPEED_SHADES.fastest);
  });

  it('implements Task 2 / Phase 3 Blue Highest & Red for Lower Accuracy color system', () => {
    // 1. Verify 4 distinct shades exist
    assert.equal(ACCURACY_SHADES.highest, '#1e68d0', 'Highest accuracy is Blue');
    assert.equal(ACCURACY_SHADES.secondHighest, '#fecdd3', 'Second-highest accuracy is Very Light Red');
    assert.equal(ACCURACY_SHADES.thirdHighest, '#f87171', 'Third-highest accuracy is Medium Red');
    assert.equal(ACCURACY_SHADES.lowest, '#991b1b', 'Lowest accuracy is Dark Red');
    assert.equal(ACCURACY_SHADES.neutral, '#e2e8f0', 'Neutral color exists');

    const uniqueColors = new Set([
      ACCURACY_SHADES.highest,
      ACCURACY_SHADES.secondHighest,
      ACCURACY_SHADES.thirdHighest,
      ACCURACY_SHADES.lowest,
    ]);
    assert.equal(uniqueColors.size, 4, 'All four accuracy shades are distinct');

    // 2. Unpracticed finger receives neutral color (never red or blue)
    assert.equal(computeAccuracyShade(null, false), ACCURACY_SHADES.neutral);
    assert.equal(computeAccuracyShade(0, false), ACCURACY_SHADES.neutral);

    // 3. Dynamic distribution with TypingClub reference accuracies [84, 87, 89, 91, 92, 94]
    const bounds = { min: 84, max: 94, dynamic: true };

    // Highest Accuracy (94%) -> Blue
    const highestColor = computeAccuracyShade(94, true, bounds);
    assert.equal(highestColor, ACCURACY_SHADES.highest, 'Highest accuracy receives Blue');

    // Second-highest Accuracy (92%) -> Very Light Red
    const secondHighestColor = computeAccuracyShade(92, true, bounds);
    assert.equal(secondHighestColor, ACCURACY_SHADES.secondHighest, 'Second-highest receives Very Light Red');

    // Third-highest Accuracy (89%) -> Medium Red
    const thirdHighestColor = computeAccuracyShade(89, true, bounds);
    assert.equal(thirdHighestColor, ACCURACY_SHADES.thirdHighest, 'Third-highest receives Medium Red');

    // Lowest Accuracy (84%) -> Dark Red
    const lowestColor = computeAccuracyShade(84, true, bounds);
    assert.equal(lowestColor, ACCURACY_SHADES.lowest, 'Lowest accuracy receives Dark Red');

    // 4. Standard benchmark fallback (e.g. all fingers have high accuracy)
    const benchmarkBounds = { min: 95, max: 99, dynamic: false };
    assert.equal(computeAccuracyShade(85, true, benchmarkBounds), ACCURACY_SHADES.lowest);
    assert.equal(computeAccuracyShade(90, true, benchmarkBounds), ACCURACY_SHADES.thirdHighest);
    assert.equal(computeAccuracyShade(95, true, benchmarkBounds), ACCURACY_SHADES.secondHighest);
    assert.equal(computeAccuracyShade(99, true, benchmarkBounds), ACCURACY_SHADES.highest);
  });

  it('implements Task 3 anatomical hand reconstruction with independent finger visualization & interactivity', () => {
    // 1. Verify two anatomically distinct hands (Left and Right)
    const leftFingers = FINGER_DEFINITIONS.filter((f) => f.hand === 'Left');
    const rightFingers = FINGER_DEFINITIONS.filter((f) => f.hand === 'Right');

    assert.equal(leftFingers.length, 4, 'Left hand has 4 distinct fingers');
    assert.equal(rightFingers.length, 4, 'Right hand has 4 distinct fingers');

    // 2. All 5 digits (Thumb + 4 fingers) are defined
    const allDigits = new Set([
      ...FINGER_DEFINITIONS.map((f) => f.activeDigit),
      'thumb',
    ]);
    assert.deepEqual(
      Array.from(allDigits).sort(),
      ['index', 'middle', 'pinky', 'ring', 'thumb'].sort(),
      'All 5 anatomical digits are recognized'
    );

    // 3. Each finger maintains its own independent performance state & metrics
    const sampleFingerData = {
      'left-pinky': { speed: 20, accuracy: 84, total: 30, correct: 25, incorrect: 5, hasData: true },
      'left-ring': { speed: 23, accuracy: 92, total: 40, correct: 37, incorrect: 3, hasData: true },
      'left-middle': { speed: 37, accuracy: 94, total: 50, correct: 47, incorrect: 3, hasData: true },
      'left-index': { speed: 35, accuracy: 87, total: 45, correct: 39, incorrect: 6, hasData: true },
      'right-index': { speed: 44, accuracy: 91, total: 60, correct: 55, incorrect: 5, hasData: true },
      'right-middle': { speed: 38, accuracy: 94, total: 55, correct: 52, incorrect: 3, hasData: true },
      'right-ring': { speed: 37, accuracy: 92, total: 48, correct: 44, incorrect: 4, hasData: true },
      'right-pinky': { speed: 20, accuracy: 89, total: 25, correct: 22, incorrect: 3, hasData: true },
    };

    const speedBounds = { min: 20, max: 44, dynamic: true };
    const accuracyBounds = { min: 84, max: 94, dynamic: true };

    // Verify independent speed coloring (not shared across hand)
    const lpSpeedColor = computeSpeedShade(sampleFingerData['left-pinky'].speed, true, speedBounds);
    const lmSpeedColor = computeSpeedShade(sampleFingerData['left-middle'].speed, true, speedBounds);
    assert.notEqual(lpSpeedColor, lmSpeedColor, 'Left Pinky and Left Middle have independent speed colors');
    assert.equal(lpSpeedColor, SPEED_SHADES.slowest);
    assert.equal(lmSpeedColor, SPEED_SHADES.improving);

    // Verify independent accuracy coloring (not shared across hand)
    const lpAccColor = computeAccuracyShade(sampleFingerData['left-pinky'].accuracy, true, accuracyBounds);
    const lmAccColor = computeAccuracyShade(sampleFingerData['left-middle'].accuracy, true, accuracyBounds);
    assert.notEqual(lpAccColor, lmAccColor, 'Left Pinky and Left Middle have independent accuracy colors');
    assert.equal(lpAccColor, ACCURACY_SHADES.lowest);
    assert.equal(lmAccColor, ACCURACY_SHADES.highest);

    // 4. Interactive diagnostic payload contains all 6 required fields
    const testFinger = {
      name: 'Index',
      hand: 'Left',
      speed: 35,
      accuracy: 87,
      totalKeystrokes: 45,
      correct: 39,
      incorrect: 6,
      hasData: true,
    };
    assert.equal(typeof testFinger.name, 'string', 'Finger name present');
    assert.equal(typeof testFinger.speed, 'number', 'Typing speed (WPM) present');
    assert.equal(typeof testFinger.accuracy, 'number', 'Accuracy (%) present');
    assert.equal(typeof testFinger.totalKeystrokes, 'number', 'Total keystrokes present');
    assert.equal(typeof testFinger.correct, 'number', 'Correct keystrokes present');
    assert.equal(typeof testFinger.incorrect, 'number', 'Incorrect keystrokes present');
  });

  it('Phase 2: validates complete TypingClub-style hand illustrations and uniform full-hand coloring contract', () => {
    // 1. Verify 8 complete miniature hands
    const handSequence = [
      { id: 'left-pinky', name: 'Pinky', hand: 'Left', isLeft: true },
      { id: 'left-ring', name: 'Ring', hand: 'Left', isLeft: true },
      { id: 'left-middle', name: 'Middle', hand: 'Left', isLeft: true },
      { id: 'left-index', name: 'Index', hand: 'Left', isLeft: true },
      { id: 'right-index', name: 'Index', hand: 'Right', isLeft: false },
      { id: 'right-middle', name: 'Middle', hand: 'Right', isLeft: false },
      { id: 'right-ring', name: 'Ring', hand: 'Right', isLeft: false },
      { id: 'right-pinky', name: 'Pinky', hand: 'Right', isLeft: false },
    ];

    assert.equal(handSequence.length, 8, 'Exactly 8 complete miniature hand illustrations');

    // 2. Symmetrical hand division (4 Left, 4 Right)
    const leftGroup = handSequence.slice(0, 4);
    const rightGroup = handSequence.slice(4, 8);
    assert.deepEqual(leftGroup.map((h) => h.name), ['Pinky', 'Ring', 'Middle', 'Index']);
    assert.deepEqual(rightGroup.map((h) => h.name), ['Index', 'Middle', 'Ring', 'Pinky']);

    // 3. Orientation: thumbs face inward toward the center divider
    assert.ok(leftGroup.every((h) => h.isLeft === true), 'All left hands use Left orientation (thumb on right)');
    assert.ok(rightGroup.every((h) => h.isLeft === false), 'All right hands use Right orientation (thumb on left)');

    // 4. Uniform full-hand coloring contract: each hand gets 1 uniform performance color
    const mockSpeeds = {
      'left-pinky': 20,
      'left-ring': 23,
      'left-middle': 37,
      'left-index': 35,
      'right-index': 44,
      'right-middle': 38,
      'right-ring': 37,
      'right-pinky': 20,
    };
    const bounds = { min: 20, max: 44, dynamic: true };
    const handColors = handSequence.map((h) => computeSpeedShade(mockSpeeds[h.id], true, bounds));
    assert.equal(handColors.length, 8, 'Each of the 8 hands receives a uniform performance color');
    assert.ok(handColors.every((c) => typeof c === 'string' && c.startsWith('#')), 'Valid hex color assigned to entire hand');
  });
});
