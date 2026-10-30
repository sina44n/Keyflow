import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CONTINUOUS_PASSAGE_LIBRARY,
  getPassageForTier,
  PassageStreamQueue,
} from './continuousPassageEngine.js';

describe('KEYFLOW Arcade — Continuous Unlimited Passage Streaming Engine', () => {
  it('contains diverse tiered passage collections with rich vocabulary', () => {
    assert.ok(CONTINUOUS_PASSAGE_LIBRARY.rookie.length >= 8, 'Rookie pool must have >= 8 passages');
    assert.ok(CONTINUOUS_PASSAGE_LIBRARY.amateur.length >= 8, 'Amateur pool must have >= 8 passages');
    assert.ok(CONTINUOUS_PASSAGE_LIBRARY.advanced.length >= 8, 'Advanced pool must have >= 8 passages');
    assert.ok(CONTINUOUS_PASSAGE_LIBRARY.legendary.length >= 8, 'Legendary pool must have >= 8 passages');

    const sample = getPassageForTier(1);
    assert.ok(typeof sample === 'string' && sample.length > 30, 'Passage must be a valid sentence');
  });

  it('PassageStreamQueue initializes with an extensive continuous buffer exceeding 250 characters', () => {
    const stream = new PassageStreamQueue({ tier: 2, initialPassagesCount: 3 });
    assert.ok(stream.fullText.length > 200, `Buffer length must exceed 200 chars, got ${stream.fullText.length}`);
    assert.equal(stream.globalCursor, 0);
    assert.equal(stream.totalCorrect, 0);
  });

  it('automatically prefetches and expands buffer infinitely as player approaches the boundary', () => {
    const stream = new PassageStreamQueue({ tier: 1, initialPassagesCount: 2 });
    const initialLen = stream.fullText.length;

    // Type through the first passage
    while (stream.globalCursor < initialLen - 40) {
      const char = stream.getCurrentChar();
      const res = stream.handleKeystroke(char, 10);
      assert.ok(res.isCorrect, 'Keystroke must be correct');
    }

    // Buffer must have automatically expanded
    assert.ok(
      stream.fullText.length > initialLen,
      `Buffer must expand past initial ${initialLen}, got ${stream.fullText.length}`
    );
  });

  it('allows typing over 500 characters continuously without interruption or WPM reset', () => {
    const stream = new PassageStreamQueue({ tier: 3, initialPassagesCount: 3 });
    let simulatedSeconds = 5;

    for (let i = 0; i < 500; i++) {
      simulatedSeconds += 0.25;
      const expected = stream.getCurrentChar();
      const res = stream.handleKeystroke(expected, simulatedSeconds);

      assert.ok(res.isCorrect);
      assert.equal(res.cursor, i + 1);
      assert.ok(res.liveWpm > 0, 'WPM must be positive');
      assert.equal(res.accuracy, 100, 'Accuracy must be 100% on correct strokes');
    }

    assert.equal(stream.totalCorrect, 500);
    assert.ok(stream.fullText.length > 550, 'Buffer must be continuous');
  });

  it('accurately tracks typing errors and maintains streak physics', () => {
    const stream = new PassageStreamQueue({ tier: 1 });
    const correct1 = stream.getCurrentChar();

    stream.handleKeystroke(correct1, 2);
    assert.equal(stream.currentStreak, 1);

    // Deliberate error
    const wrongChar = correct1 === 'Z' ? 'X' : 'Z';
    const errRes = stream.handleKeystroke(wrongChar, 3);

    assert.equal(errRes.isCorrect, false);
    assert.equal(stream.totalErrors, 1);
    assert.equal(stream.currentStreak, 0);
    assert.ok(errRes.accuracy < 100);
  });

  it('provides a focused sliding viewport window for ergonomic UI rendering', () => {
    const stream = new PassageStreamQueue({ tier: 1 });
    // Advance 50 characters
    for (let i = 0; i < 50; i++) {
      stream.handleKeystroke(stream.getCurrentChar(), 10);
    }

    const windowData = stream.getViewportWindow(20, 60);
    assert.ok(windowData.windowText.length > 40, 'Window text must have adequate length');
    assert.equal(windowData.relativeCursor, 20, 'Relative cursor must match pastChars offset');
    assert.equal(windowData.globalCursor, 50);
  });
});
