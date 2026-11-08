import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  filterSessionsByTimeRange,
  calculateTypingConsistency,
  formatDuration,
} from '../../utils/telemetryStorage.js';

describe('KEYFLOW CircularIntelligenceInfographic Runtime & Verification Tests', () => {
  it('guarantees filterSessionsByTimeRange handles "today", "weekly", and "overall" safely', () => {
    const now = Date.now();
    const testSessions = [
      { id: 's1', timestamp: now, wpm: 60, grossWpm: 60, accuracy: 98, durationSeconds: 60 },
      { id: 's2', timestamp: now - 86400000 * 2, wpm: 55, grossWpm: 55, accuracy: 95, durationSeconds: 120 },
      { id: 's3', timestamp: now - 86400000 * 15, wpm: 50, grossWpm: 50, accuracy: 92, durationSeconds: 180 },
    ];

    const todayFiltered = filterSessionsByTimeRange(testSessions, 'today');
    assert.ok(Array.isArray(todayFiltered));
    assert.equal(todayFiltered.length, 1);
    assert.equal(todayFiltered[0].id, 's1');

    const weeklyFiltered = filterSessionsByTimeRange(testSessions, 'weekly');
    assert.ok(Array.isArray(weeklyFiltered));
    assert.equal(weeklyFiltered.length, 2);

    const overallFiltered = filterSessionsByTimeRange(testSessions, 'overall');
    assert.ok(Array.isArray(overallFiltered));
    assert.equal(overallFiltered.length, 3);
  });

  it('guarantees calculateTypingConsistency calculates valid score from sessions array', () => {
    const sessions = [
      { wpm: 50, accuracy: 95 },
      { wpm: 52, accuracy: 96 },
      { wpm: 49, accuracy: 94 },
    ];
    const score = calculateTypingConsistency(sessions);
    assert.equal(typeof score, 'number');
    assert.ok(score >= 0 && score <= 100);
  });

  it('handles empty sessions safely without NaN or undefined errors', () => {
    const emptyFiltered = filterSessionsByTimeRange([], 'today');
    assert.deepEqual(emptyFiltered, []);
    const consistency = calculateTypingConsistency([]);
    assert.equal(consistency, null, 'Empty history has null consistency');
    const duration = formatDuration(0);
    assert.equal(duration, '0s');
  });
});
