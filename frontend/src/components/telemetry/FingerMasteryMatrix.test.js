import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { FINGER_DEFINITIONS, getAuthoritativeFingerForChar } from '../../utils/touchTypingMap.js';
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

    // Right Hand Summary
    const rightHand = metrics.rightHandStats;
    assert.ok(rightHand);
    assert.equal(rightHand.hasData, true);
    assert.equal(rightHand.keystrokes, 40); // 30 + 10
    // Weighted speed: (60*30 + 50*10) / 40 = (1800 + 500) / 40 = 2300 / 40 = 58
    assert.equal(rightHand.speed, 58);
    assert.equal(rightHand.strongestFinger, 'Index');

    // Thumbs Summary
    const thumbs = metrics.thumbsStats;
    assert.ok(thumbs);
    assert.equal(thumbs.hasData, true);
    assert.equal(thumbs.speed, 70);
    assert.equal(thumbs.accuracy, 100);
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
});
