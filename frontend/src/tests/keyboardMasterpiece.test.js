import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  ROW_DEFS,
  CALIBRATED_KEYS,
  KEY_COORDS,
  KEY_FINGER_MAP,
  resolveKeyToFinger,
} from '../utils/touchTypingMap.js';

describe('Redragon K617 Fizz 60% Mechanical Keyboard & Finger Mapping Engine', () => {
  it('implements exactly 61 keys across 5 rows matching physical ANSI 60% standard', () => {
    assert.equal(CALIBRATED_KEYS.length, 61, 'Contains exactly 61 mechanical keys');

    // Row 1: 14 keys (Esc, 1-0, -, =, Backspace)
    assert.equal(ROW_DEFS[0].keys.length, 14);

    // Row 2: 14 keys (Tab, Q-P, [, ], \)
    assert.equal(ROW_DEFS[1].keys.length, 14);

    // Row 3: 13 keys (Caps, A-L, ;, ', Enter)
    assert.equal(ROW_DEFS[2].keys.length, 13);

    // Row 4: 12 keys (Shift, Z-M, ,, ., /, Shift)
    assert.equal(ROW_DEFS[3].keys.length, 12);

    // Row 5: 8 keys (Ctrl, Code, Alt, Space, Alt, Code, Fn, Ctrl)
    assert.equal(ROW_DEFS[4].keys.length, 8);
  });

  it('guarantees identical 15.0 unit width across all 5 rows', () => {
    ROW_DEFS.forEach((row, idx) => {
      const totalUnits = row.keys.reduce((sum, k) => sum + k.u, 0);
      assert.ok(
        Math.abs(totalUnits - 15.0) < 0.001,
        `Row ${idx + 1} total units must equal 15.0 (got ${totalUnits})`
      );
    });
  });

  it('replicates the exact Monochrome Two-Tone colorway from the reference image', () => {
    // 46 Chalk White keys + 15 Obsidian Black modifier keys = 61 keys
    const whiteKeys = CALIBRATED_KEYS.filter((k) => k.color === 'white');
    const blackKeys = CALIBRATED_KEYS.filter((k) => k.color === 'black');

    assert.equal(whiteKeys.length, 46, 'Contains 46 chalk white alphanumeric and spacebar keys');
    assert.equal(blackKeys.length, 15, 'Contains 15 obsidian black perimeter modifier keys');

    // Row 1: Esc (black), 1..= (white), Backspace (black)
    const r1 = ROW_DEFS[0].keys;
    assert.equal(r1[0].color, 'black', 'Esc is black');
    for (let i = 1; i <= 12; i++) {
      assert.equal(r1[i].color, 'white', `Row 1 key ${r1[i].id} is white`);
    }
    assert.equal(r1[13].color, 'black', 'Backspace is black');

    // Row 2: Tab (black), Q..] (white), \ (black)
    const r2 = ROW_DEFS[1].keys;
    assert.equal(r2[0].color, 'black', 'Tab is black');
    for (let i = 1; i <= 12; i++) {
      assert.equal(r2[i].color, 'white', `Row 2 key ${r2[i].id} is white`);
    }
    assert.equal(r2[13].color, 'black', '\\ is black');

    // Row 3: Caps (black), A..' (white), Enter (black)
    const r3 = ROW_DEFS[2].keys;
    assert.equal(r3[0].color, 'black', 'Caps is black');
    for (let i = 1; i <= 11; i++) {
      assert.equal(r3[i].color, 'white', `Row 3 key ${r3[i].id} is white`);
    }
    assert.equal(r3[12].color, 'black', 'Enter is black');

    // Row 4: Shift-Left (black), Z../ (white), Shift-Right (black)
    const r4 = ROW_DEFS[3].keys;
    assert.equal(r4[0].color, 'black', 'Shift-L is black');
    for (let i = 1; i <= 10; i++) {
      assert.equal(r4[i].color, 'white', `Row 4 key ${r4[i].id} is white`);
    }
    assert.equal(r4[11].color, 'black', 'Shift-R is black');

    // Row 5: Ctrl, Code, Alt (black), Space (white), Alt, Code, Fn, Ctrl (black)
    const r5 = ROW_DEFS[4].keys;
    assert.equal(r5[0].color, 'black', 'Ctrl-L is black');
    assert.equal(r5[1].color, 'black', 'Code-L is black');
    assert.equal(r5[2].color, 'black', 'Alt-L is black');
    assert.equal(r5[3].color, 'white', 'Spacebar is white');
    assert.equal(r5[4].color, 'black', 'Alt-R is black');
    assert.equal(r5[5].color, 'black', 'Code-R is black');
    assert.equal(r5[6].color, 'black', 'Fn is black');
    assert.equal(r5[7].color, 'black', 'Ctrl-R is black');
  });

  it('features tactile homing bumps on F and J keycaps', () => {
    const fKey = CALIBRATED_KEYS.find((k) => k.id === 'f');
    const jKey = CALIBRATED_KEYS.find((k) => k.id === 'j');

    assert.ok(fKey && fKey.hasBump, 'F key has tactile bump indicator');
    assert.ok(jKey && jKey.hasBump, 'J key has tactile bump indicator');

    const gKey = CALIBRATED_KEYS.find((k) => k.id === 'g');
    assert.ok(!gKey.hasBump, 'Non-homing key does not have bump');
  });

  it('calibrates 6.25u spacebar width and ANSI contact coordinates', () => {
    const spaceKey = CALIBRATED_KEYS.find((k) => k.id === 'space');
    assert.ok(spaceKey, 'Space key exists');
    assert.equal(spaceKey.u, 6.25, 'Space key has 6.25u width');
    assert.ok(spaceKey.w > 340 && spaceKey.w < 370, `Space key physical width ~354px (got ${spaceKey.w})`);

    // Calibrated ANSI contact center
    assert.equal(KEY_COORDS['space'].cx, 413.9);
    assert.equal(KEY_COORDS['space'].cy, 251);
  });

  it('maps all 61 physical keys to anatomically correct touch-typing fingers', () => {
    // Left Hand
    assert.equal(KEY_FINGER_MAP['q'].finger, 'left-pinky');
    assert.equal(KEY_FINGER_MAP['a'].finger, 'left-pinky');
    assert.equal(KEY_FINGER_MAP['z'].finger, 'left-pinky');
    assert.equal(KEY_FINGER_MAP['control-left'].finger, 'left-pinky');
    assert.equal(KEY_FINGER_MAP['meta-left'].finger, 'left-pinky');

    assert.equal(KEY_FINGER_MAP['w'].finger, 'left-ring');
    assert.equal(KEY_FINGER_MAP['s'].finger, 'left-ring');
    assert.equal(KEY_FINGER_MAP['x'].finger, 'left-ring');

    assert.equal(KEY_FINGER_MAP['e'].finger, 'left-middle');
    assert.equal(KEY_FINGER_MAP['d'].finger, 'left-middle');
    assert.equal(KEY_FINGER_MAP['c'].finger, 'left-middle');

    assert.equal(KEY_FINGER_MAP['r'].finger, 'left-index');
    assert.equal(KEY_FINGER_MAP['f'].finger, 'left-index');
    assert.equal(KEY_FINGER_MAP['v'].finger, 'left-index');
    assert.equal(KEY_FINGER_MAP['t'].finger, 'left-index');
    assert.equal(KEY_FINGER_MAP['g'].finger, 'left-index');
    assert.equal(KEY_FINGER_MAP['b'].finger, 'left-index');

    // Thumbs
    assert.equal(KEY_FINGER_MAP['alt-left'].finger, 'left-thumb');
    assert.equal(KEY_FINGER_MAP['space'].finger, 'thumb');
    assert.equal(KEY_FINGER_MAP['alt-right'].finger, 'right-thumb');

    // Right Hand
    assert.equal(KEY_FINGER_MAP['y'].finger, 'right-index');
    assert.equal(KEY_FINGER_MAP['h'].finger, 'right-index');
    assert.equal(KEY_FINGER_MAP['n'].finger, 'right-index');
    assert.equal(KEY_FINGER_MAP['u'].finger, 'right-index');
    assert.equal(KEY_FINGER_MAP['j'].finger, 'right-index');
    assert.equal(KEY_FINGER_MAP['m'].finger, 'right-index');

    assert.equal(KEY_FINGER_MAP['i'].finger, 'right-middle');
    assert.equal(KEY_FINGER_MAP['k'].finger, 'right-middle');
    assert.equal(KEY_FINGER_MAP[','].finger, 'right-middle');

    assert.equal(KEY_FINGER_MAP['o'].finger, 'right-ring');
    assert.equal(KEY_FINGER_MAP['l'].finger, 'right-ring');
    assert.equal(KEY_FINGER_MAP['.'].finger, 'right-ring');

    assert.equal(KEY_FINGER_MAP['p'].finger, 'right-pinky');
    assert.equal(KEY_FINGER_MAP[';'].finger, 'right-pinky');
    assert.equal(KEY_FINGER_MAP['/'].finger, 'right-pinky');
    assert.equal(KEY_FINGER_MAP['enter'].finger, 'right-pinky');
    assert.equal(KEY_FINGER_MAP['backspace'].finger, 'right-pinky');
    assert.equal(KEY_FINGER_MAP['fn'].finger, 'right-pinky');
    assert.equal(KEY_FINGER_MAP['menu'].finger, 'right-pinky');
    assert.equal(KEY_FINGER_MAP['control-right'].finger, 'right-pinky');
  });

  it('resolves KeyboardEvent physical codes to key IDs and kinematics', () => {
    const spaceResolved = resolveKeyToFinger({ key: ' ', code: 'Space' });
    assert.ok(spaceResolved);
    assert.equal(spaceResolved.keyId, 'space');
    assert.equal(spaceResolved.finger, 'right-thumb');

    const tResolved = resolveKeyToFinger({ key: 't', code: 'KeyT' });
    assert.ok(tResolved);
    assert.equal(tResolved.finger, 'left-index');

    const shiftResolved = resolveKeyToFinger('!');
    assert.ok(shiftResolved);
    assert.equal(shiftResolved.keyId, '!');
    assert.equal(shiftResolved.finger, 'left-pinky');
  });
});
