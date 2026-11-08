import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ROW_DEFS, KEY_FINGER_MAP } from '../../utils/touchTypingMap.js';
import { calculateReportMetrics } from '../../utils/telemetryStorage.js';

describe('KEYFLOW Keyboard Mastery & Per-Key Velocity Analytics', () => {
  it('contains full ANSI 60% physical key definitions with correct finger assignments', () => {
    assert.equal(ROW_DEFS.length, 5, 'Contains 5 keyboard rows');

    // Total keys in ANSI 60%
    const totalKeys = ROW_DEFS.reduce((sum, r) => sum + r.keys.length, 0);
    assert.equal(totalKeys, 61, 'Exactly 61 ANSI 60% mechanical keys');

    // Home row keys f and j must have tactile homing bump markers
    const homeRow = ROW_DEFS[2];
    const keyF = homeRow.keys.find((k) => k.id === 'f');
    const keyJ = homeRow.keys.find((k) => k.id === 'j');
    assert.ok(keyF && keyF.hasBump, 'Key F has tactile bump');
    assert.ok(keyJ && keyJ.hasBump, 'Key J has tactile bump');

    // Touch-typing finger assignments
    assert.equal(KEY_FINGER_MAP['f'].finger, 'left-index');
    assert.equal(KEY_FINGER_MAP['j'].finger, 'right-index');
    assert.equal(KEY_FINGER_MAP['a'].finger, 'left-pinky');
    assert.equal(KEY_FINGER_MAP[';'].finger, 'right-pinky');
  });

  it('aggregates per-character CPM, WPM, accuracy, and attempt counts from practice sessions', () => {
    const mockSessions = [
      {
        id: 'sess_1',
        durationSeconds: 30,
        grossWpm: 60,
        characterStats: {
          a: { char: 'a', total: 20, correct: 18, incorrect: 2, cpm: 240, wpm: 48 },
          s: { char: 's', total: 15, correct: 15, incorrect: 0, cpm: 300, wpm: 60 },
        },
      },
      {
        id: 'sess_2',
        durationSeconds: 30,
        grossWpm: 70,
        characterStats: {
          a: { char: 'a', total: 30, correct: 28, incorrect: 2, cpm: 260, wpm: 52 },
          space: { char: ' ', total: 25, correct: 25, incorrect: 0, cpm: 350, wpm: 70 },
        },
      },
    ];

    const metrics = calculateReportMetrics(mockSessions, 'overall');
    assert.ok(Array.isArray(metrics.characterStats), 'Returns characterStats array');

    const statA = metrics.characterStats.find((c) => c.char === 'a');
    assert.ok(statA, 'Character "a" is present in telemetry metrics');
    assert.equal(statA.total, 50, 'Total attempts aggregated across sessions (20 + 30)');
    assert.equal(statA.correct, 46, 'Total correct keystrokes aggregated (18 + 28)');
    assert.equal(statA.incorrect, 4, 'Total mistakes aggregated (2 + 2)');
    assert.equal(statA.accuracy, 92, 'Accuracy calculated: (46 / 50) * 100 = 92%');
    assert.equal(statA.cpm, 250, 'Average CPM calculated: (240 + 260) / 2 = 250');
    assert.equal(statA.wpm, 50, 'Average WPM calculated: (48 + 52) / 2 = 50');

    const statSpace = metrics.characterStats.find((c) => c.char === ' ' || c.char === 'space');
    assert.ok(statSpace, 'Spacebar character is tracked');
    assert.equal(statSpace.accuracy, 100);
  });

  it('guarantees unpracticed keys remain neutral and never fabricate fake velocity or accuracy', () => {
    // When no practice sessions exist, character stats are empty and coverage is honest
    const emptyMetrics = calculateReportMetrics([], 'overall');
    assert.equal(emptyMetrics.characterStats.length, 0, 'No character stats fabricated for empty history');
    assert.equal(emptyMetrics.hasData, false, 'hasData is false');
  });

  it('distinguishes CPM and WPM correctly (CPM ≈ WPM * 5)', () => {
    const singleSession = [
      {
        id: 'sess_single',
        durationSeconds: 60,
        grossWpm: 50,
        characterStats: {
          k: { char: 'k', total: 10, correct: 10, incorrect: 0, wpm: 50 },
        },
      },
    ];

    const metrics = calculateReportMetrics(singleSession, 'overall');
    const statK = metrics.characterStats.find((c) => c.char === 'k');
    assert.ok(statK);
    assert.equal(statK.wpm, 50);
    assert.equal(statK.cpm, 250, 'CPM automatically defaults to WPM * 5 if only WPM was provided');
  });
});

