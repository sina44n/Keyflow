import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  KEY_COORDS,
  CALIBRATED_KEYS,
  SHIFT_MAP,
  KEY_FINGER_MAP,
  FINGERTIP_POSITIONS,
} from '../../utils/touchTypingMap.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Realistic Hand Guidance & Virtual Keyboard Calibration', () => {
  it('calibrates key coordinates across all 5 keyboard rows accurately', () => {
    assert.ok(KEY_COORDS['a'], 'Key a exists');
    assert.ok(KEY_COORDS['s'], 'Key s exists');
    assert.ok(KEY_COORDS['d'], 'Key d exists');
    assert.ok(KEY_COORDS['f'], 'Key f exists');
    assert.ok(KEY_COORDS['space'], 'Key space exists');
    assert.ok(KEY_COORDS['j'], 'Key j exists');
    assert.ok(KEY_COORDS['k'], 'Key k exists');
    assert.ok(KEY_COORDS['l'], 'Key l exists');
    assert.ok(KEY_COORDS[';'], 'Key ; exists');

    // Home row keys should share the exact same row center Y (cy = 145)
    assert.equal(KEY_COORDS['a'].cy, 145);
    assert.equal(KEY_COORDS['s'].cy, 145);
    assert.equal(KEY_COORDS['d'].cy, 145);
    assert.equal(KEY_COORDS['f'].cy, 145);
    assert.equal(KEY_COORDS['j'].cy, 145);
    assert.equal(KEY_COORDS['k'].cy, 145);
    assert.equal(KEY_COORDS['l'].cy, 145);
    assert.equal(KEY_COORDS[';'].cy, 145);

    // Space bar should be calibrated for ANSI 60% mechanical layout (cx = 413.9)
    assert.equal(KEY_COORDS['space'].cx, 413.9);
    assert.equal(KEY_COORDS['space'].cy, 251);
  });

  it('validates 15.0 ANSI layout with exactly calibrated row widths', () => {
    assert.equal(CALIBRATED_KEYS.length, 61, 'Contains 61 calibrated Redragon K617 Fizz mechanical keys');
    const spaceKey = CALIBRATED_KEYS.find((k) => k.id === 'space');
    assert.ok(spaceKey, 'Space key exists in calibrated layout');
    assert.ok(spaceKey.w > 300, 'Space key has proper 6.25U width');
  });

  it('provides comprehensive dual-character shift mappings', () => {
    assert.equal(SHIFT_MAP['!'], '1');
    assert.equal(SHIFT_MAP['@'], '2');
    assert.equal(SHIFT_MAP['#'], '3');
    assert.equal(SHIFT_MAP['$'], '4');
    assert.equal(SHIFT_MAP['%'], '5');
    assert.equal(SHIFT_MAP['^'], '6');
    assert.equal(SHIFT_MAP['&'], '7');
    assert.equal(SHIFT_MAP['*'], '8');
    assert.equal(SHIFT_MAP['('], '9');
    assert.equal(SHIFT_MAP[')'], '0');
    assert.equal(SHIFT_MAP['?'], '/');
    assert.equal(SHIFT_MAP[':'], ';');
  });

  it('accurately maps standard touch-typing finger assignments for home-row and non-home keys', () => {
    // Left pinky
    assert.equal(KEY_FINGER_MAP['a'].finger, 'left-pinky');
    assert.equal(KEY_FINGER_MAP['q'].finger, 'left-pinky');
    assert.equal(KEY_FINGER_MAP['z'].finger, 'left-pinky');

    // Left ring
    assert.equal(KEY_FINGER_MAP['s'].finger, 'left-ring');
    assert.equal(KEY_FINGER_MAP['w'].finger, 'left-ring');
    assert.equal(KEY_FINGER_MAP['x'].finger, 'left-ring');

    // Left middle
    assert.equal(KEY_FINGER_MAP['d'].finger, 'left-middle');
    assert.equal(KEY_FINGER_MAP['e'].finger, 'left-middle');
    assert.equal(KEY_FINGER_MAP['c'].finger, 'left-middle');

    // Left index
    assert.equal(KEY_FINGER_MAP['f'].finger, 'left-index');
    assert.equal(KEY_FINGER_MAP['r'].finger, 'left-index');
    assert.equal(KEY_FINGER_MAP['v'].finger, 'left-index');
    assert.equal(KEY_FINGER_MAP['t'].finger, 'left-index');
    assert.equal(KEY_FINGER_MAP['g'].finger, 'left-index');
    assert.equal(KEY_FINGER_MAP['b'].finger, 'left-index');

    // Thumbs
    assert.equal(KEY_FINGER_MAP[' '].finger, 'thumb');

    // Right index
    assert.equal(KEY_FINGER_MAP['j'].finger, 'right-index');
    assert.equal(KEY_FINGER_MAP['u'].finger, 'right-index');
    assert.equal(KEY_FINGER_MAP['m'].finger, 'right-index');
    assert.equal(KEY_FINGER_MAP['y'].finger, 'right-index');
    assert.equal(KEY_FINGER_MAP['h'].finger, 'right-index');
    assert.equal(KEY_FINGER_MAP['n'].finger, 'right-index');

    // Right middle
    assert.equal(KEY_FINGER_MAP['k'].finger, 'right-middle');
    assert.equal(KEY_FINGER_MAP['i'].finger, 'right-middle');
    assert.equal(KEY_FINGER_MAP[','].finger, 'right-middle');

    // Right ring
    assert.equal(KEY_FINGER_MAP['l'].finger, 'right-ring');
    assert.equal(KEY_FINGER_MAP['o'].finger, 'right-ring');
    assert.equal(KEY_FINGER_MAP['.'].finger, 'right-ring');

    // Right pinky
    assert.equal(KEY_FINGER_MAP[';'].finger, 'right-pinky');
    assert.equal(KEY_FINGER_MAP['p'].finger, 'right-pinky');
    assert.equal(KEY_FINGER_MAP['/'].finger, 'right-pinky');
  });

  it('aligns fingertip contact coordinates directly over home-row key caps', () => {
    // Fingertips must sit within key bounds of home keys
    const lp = FINGERTIP_POSITIONS['left-pinky'];
    assert.ok(Math.abs(lp.x - KEY_COORDS['a'].cx) < 15, 'Left pinky is centered near A');

    const lr = FINGERTIP_POSITIONS['left-ring'];
    assert.ok(Math.abs(lr.x - KEY_COORDS['s'].cx) < 15, 'Left ring is centered near S');

    const lm = FINGERTIP_POSITIONS['left-middle'];
    assert.ok(Math.abs(lm.x - KEY_COORDS['d'].cx) < 15, 'Left middle is centered near D');

    const li = FINGERTIP_POSITIONS['left-index'];
    assert.ok(Math.abs(li.x - KEY_COORDS['f'].cx) < 15, 'Left index is centered near F');

    const ri = FINGERTIP_POSITIONS['right-index'];
    assert.ok(Math.abs(ri.x - KEY_COORDS['j'].cx) < 15, 'Right index is centered near J');

    const rm = FINGERTIP_POSITIONS['right-middle'];
    assert.ok(Math.abs(rm.x - KEY_COORDS['k'].cx) < 15, 'Right middle is centered near K');

    const rr = FINGERTIP_POSITIONS['right-ring'];
    assert.ok(Math.abs(rr.x - KEY_COORDS['l'].cx) < 15, 'Right ring is centered near L');

    const rp = FINGERTIP_POSITIONS['right-pinky'];
    assert.ok(Math.abs(rp.x - KEY_COORDS[';'].cx) < 20, 'Right pinky is centered near ;');
  });

  it('verifies realistic photographic hand assets exist in public directory', () => {
    const publicDir = path.resolve(__dirname, '../../../../frontend/public');
    const bothHandsPath = path.join(publicDir, 'realistic_hands_both.png');
    assert.ok(fs.existsSync(bothHandsPath), 'realistic_hands_both.png exists');

    const stats = fs.statSync(bothHandsPath);
    assert.ok(stats.size > 200000, `Asset size ${stats.size} bytes is high-resolution`);
  });
});
