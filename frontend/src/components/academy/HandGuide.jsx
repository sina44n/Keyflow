import React, { useMemo } from 'react';

/**
 * HandGuide — Realistic Anatomical Human Hand Guide for KEYFLOW.
 *
 * Modeled on natural human hand anatomy in an ergonomic touch-typing posture.
 * Symmetrically synchronized with the 900x350 ANSI 60% Virtual Keyboard.
 *
 * Anatomy Features:
 * - Natural palm silhouette with realistic thenar & hypothenar muscle contours
 * - Five distinct, proportional fingers per hand with rounded dome tips
 * - Believable wrists tapering naturally off the bottom edge
 * - Correct anatomical orientation:
 *     Left hand: Pinky (outer left), Ring, Middle, Index, Thumb (inner right towards space)
 *     Right hand: Thumb (inner left towards space), Index, Middle, Ring, Pinky (outer right)
 * - Seamless knuckle connection: fingers emerge organically from the palm without
 *   artificial dividing lines cutting across the joint
 * - Dynamic reach: when a key is targeted, the corresponding finger smoothly reaches
 *   with an ethereal cyan luminescence and glowing fingertip aura.
 */

// Symmetrical 15.0 Unit Keyboard Calibration:
// ViewBox: 0 0 900 350. Key Area: x = 20 to 880 (width 860). Center = 450.0.
const ROW_START_Y = 16;
const ROW_HEIGHT = 46;
const ROW_GAP = 7;
const KEY_GAP = 7;
const UNIT = (860 - 14 * KEY_GAP) / 15; // 50.8px

function computeKeyWidth(u) {
  return u * UNIT + (u - 1) * KEY_GAP;
}

const ROW_DEFS = [
  {
    y: ROW_START_Y, // cy = 39
    keys: [
      { id: '`', u: 1.0 },
      { id: '1', u: 1.0 },
      { id: '2', u: 1.0 },
      { id: '3', u: 1.0 },
      { id: '4', u: 1.0 },
      { id: '5', u: 1.0 },
      { id: '6', u: 1.0 },
      { id: '7', u: 1.0 },
      { id: '8', u: 1.0 },
      { id: '9', u: 1.0 },
      { id: '0', u: 1.0 },
      { id: '-', u: 1.0 },
      { id: '=', u: 1.0 },
      { id: 'backspace', u: 2.0 },
    ],
  },
  {
    y: ROW_START_Y + (ROW_HEIGHT + ROW_GAP), // cy = 92
    keys: [
      { id: 'tab', u: 1.5 },
      { id: 'q', u: 1.0 },
      { id: 'w', u: 1.0 },
      { id: 'e', u: 1.0 },
      { id: 'r', u: 1.0 },
      { id: 't', u: 1.0 },
      { id: 'y', u: 1.0 },
      { id: 'u', u: 1.0 },
      { id: 'i', u: 1.0 },
      { id: 'o', u: 1.0 },
      { id: 'p', u: 1.0 },
      { id: '[', u: 1.0 },
      { id: ']', u: 1.0 },
      { id: '\\', u: 1.5 },
    ],
  },
  {
    y: ROW_START_Y + 2 * (ROW_HEIGHT + ROW_GAP), // cy = 145
    keys: [
      { id: 'caps', u: 1.75 },
      { id: 'a', u: 1.0 },
      { id: 's', u: 1.0 },
      { id: 'd', u: 1.0 },
      { id: 'f', u: 1.0 },
      { id: 'g', u: 1.0 },
      { id: 'h', u: 1.0 },
      { id: 'j', u: 1.0 },
      { id: 'k', u: 1.0 },
      { id: 'l', u: 1.0 },
      { id: ';', u: 1.0 },
      { id: "'", u: 1.0 },
      { id: 'enter', u: 2.25 },
    ],
  },
  {
    y: ROW_START_Y + 3 * (ROW_HEIGHT + ROW_GAP), // cy = 198
    keys: [
      { id: 'shift-left', u: 2.25 },
      { id: 'z', u: 1.0 },
      { id: 'x', u: 1.0 },
      { id: 'c', u: 1.0 },
      { id: 'v', u: 1.0 },
      { id: 'b', u: 1.0 },
      { id: 'n', u: 1.0 },
      { id: 'm', u: 1.0 },
      { id: ',', u: 1.0 },
      { id: '.', u: 1.0 },
      { id: '/', u: 1.0 },
      { id: 'shift-right', u: 2.75 },
    ],
  },
  {
    y: ROW_START_Y + 4 * (ROW_HEIGHT + ROW_GAP), // cy = 251
    keys: [
      { id: 'control-left', u: 1.75 },
      { id: 'option-left', u: 1.5 },
      { id: 'space', u: 8.5 },
      { id: 'option-right', u: 1.5 },
      { id: 'control-right', u: 1.75 },
    ],
  },
];

// Compute exact key centers
export const KEY_COORDS = {};
ROW_DEFS.forEach((r) => {
  let curX = 20;
  r.keys.forEach((k) => {
    const width = computeKeyWidth(k.u);
    KEY_COORDS[k.id] = {
      x: curX,
      y: r.y,
      w: width,
      h: ROW_HEIGHT,
      cx: +(curX + width / 2).toFixed(1),
      cy: +(r.y + ROW_HEIGHT / 2).toFixed(1),
    };
    curX += width + KEY_GAP;
  });
});

// Touch-typing finger assignments
const KEY_FINGER_MAP = {
  // Left Pinky
  '`': { finger: 'left-pinky', x: KEY_COORDS['`'].cx, y: KEY_COORDS['`'].cy },
  '~': { finger: 'left-pinky', x: KEY_COORDS['`'].cx, y: KEY_COORDS['`'].cy },
  '1': { finger: 'left-pinky', x: KEY_COORDS['1'].cx, y: KEY_COORDS['1'].cy },
  '!': { finger: 'left-pinky', x: KEY_COORDS['1'].cx, y: KEY_COORDS['1'].cy },
  'tab': { finger: 'left-pinky', x: KEY_COORDS['tab'].cx, y: KEY_COORDS['tab'].cy },
  'q': { finger: 'left-pinky', x: KEY_COORDS['q'].cx, y: KEY_COORDS['q'].cy },
  'caps': { finger: 'left-pinky', x: KEY_COORDS['caps'].cx, y: KEY_COORDS['caps'].cy },
  'a': { finger: 'left-pinky', x: KEY_COORDS['a'].cx, y: KEY_COORDS['a'].cy },
  'shift-left': { finger: 'left-pinky', x: KEY_COORDS['shift-left'].cx, y: KEY_COORDS['shift-left'].cy },
  'z': { finger: 'left-pinky', x: KEY_COORDS['z'].cx, y: KEY_COORDS['z'].cy },

  // Left Ring
  '2': { finger: 'left-ring', x: KEY_COORDS['2'].cx, y: KEY_COORDS['2'].cy },
  '@': { finger: 'left-ring', x: KEY_COORDS['2'].cx, y: KEY_COORDS['2'].cy },
  'w': { finger: 'left-ring', x: KEY_COORDS['w'].cx, y: KEY_COORDS['w'].cy },
  's': { finger: 'left-ring', x: KEY_COORDS['s'].cx, y: KEY_COORDS['s'].cy },
  'x': { finger: 'left-ring', x: KEY_COORDS['x'].cx, y: KEY_COORDS['x'].cy },

  // Left Middle
  '3': { finger: 'left-middle', x: KEY_COORDS['3'].cx, y: KEY_COORDS['3'].cy },
  '#': { finger: 'left-middle', x: KEY_COORDS['3'].cx, y: KEY_COORDS['3'].cy },
  'e': { finger: 'left-middle', x: KEY_COORDS['e'].cx, y: KEY_COORDS['e'].cy },
  'd': { finger: 'left-middle', x: KEY_COORDS['d'].cx, y: KEY_COORDS['d'].cy },
  'c': { finger: 'left-middle', x: KEY_COORDS['c'].cx, y: KEY_COORDS['c'].cy },

  // Left Index
  '4': { finger: 'left-index', x: KEY_COORDS['4'].cx, y: KEY_COORDS['4'].cy },
  '$': { finger: 'left-index', x: KEY_COORDS['4'].cx, y: KEY_COORDS['4'].cy },
  '5': { finger: 'left-index', x: KEY_COORDS['5'].cx, y: KEY_COORDS['5'].cy },
  '%': { finger: 'left-index', x: KEY_COORDS['5'].cx, y: KEY_COORDS['5'].cy },
  'r': { finger: 'left-index', x: KEY_COORDS['r'].cx, y: KEY_COORDS['r'].cy },
  't': { finger: 'left-index', x: KEY_COORDS['t'].cx, y: KEY_COORDS['t'].cy },
  'f': { finger: 'left-index', x: KEY_COORDS['f'].cx, y: KEY_COORDS['f'].cy },
  'g': { finger: 'left-index', x: KEY_COORDS['g'].cx, y: KEY_COORDS['g'].cy },
  'v': { finger: 'left-index', x: KEY_COORDS['v'].cx, y: KEY_COORDS['v'].cy },
  'b': { finger: 'left-index', x: KEY_COORDS['b'].cx, y: KEY_COORDS['b'].cy },

  // Thumbs
  ' ': { finger: 'thumb', x: KEY_COORDS['space'].cx, y: KEY_COORDS['space'].cy },

  // Right Index
  '6': { finger: 'right-index', x: KEY_COORDS['6'].cx, y: KEY_COORDS['6'].cy },
  '^': { finger: 'right-index', x: KEY_COORDS['6'].cx, y: KEY_COORDS['6'].cy },
  '7': { finger: 'right-index', x: KEY_COORDS['7'].cx, y: KEY_COORDS['7'].cy },
  '&': { finger: 'right-index', x: KEY_COORDS['7'].cx, y: KEY_COORDS['7'].cy },
  'y': { finger: 'right-index', x: KEY_COORDS['y'].cx, y: KEY_COORDS['y'].cy },
  'u': { finger: 'right-index', x: KEY_COORDS['u'].cx, y: KEY_COORDS['u'].cy },
  'h': { finger: 'right-index', x: KEY_COORDS['h'].cx, y: KEY_COORDS['h'].cy },
  'j': { finger: 'right-index', x: KEY_COORDS['j'].cx, y: KEY_COORDS['j'].cy },
  'n': { finger: 'right-index', x: KEY_COORDS['n'].cx, y: KEY_COORDS['n'].cy },
  'm': { finger: 'right-index', x: KEY_COORDS['m'].cx, y: KEY_COORDS['m'].cy },

  // Right Middle
  '8': { finger: 'right-middle', x: KEY_COORDS['8'].cx, y: KEY_COORDS['8'].cy },
  '*': { finger: 'right-middle', x: KEY_COORDS['8'].cx, y: KEY_COORDS['8'].cy },
  'i': { finger: 'right-middle', x: KEY_COORDS['i'].cx, y: KEY_COORDS['i'].cy },
  'k': { finger: 'right-middle', x: KEY_COORDS['k'].cx, y: KEY_COORDS['k'].cy },
  ',': { finger: 'right-middle', x: KEY_COORDS[','].cx, y: KEY_COORDS[','].cy },
  '<': { finger: 'right-middle', x: KEY_COORDS[','].cx, y: KEY_COORDS[','].cy },

  // Right Ring
  '9': { finger: 'right-ring', x: KEY_COORDS['9'].cx, y: KEY_COORDS['9'].cy },
  '(': { finger: 'right-ring', x: KEY_COORDS['9'].cx, y: KEY_COORDS['9'].cy },
  'o': { finger: 'right-ring', x: KEY_COORDS['o'].cx, y: KEY_COORDS['o'].cy },
  'l': { finger: 'right-ring', x: KEY_COORDS['l'].cx, y: KEY_COORDS['l'].cy },
  '.': { finger: 'right-ring', x: KEY_COORDS['.'].cx, y: KEY_COORDS['.'].cy },
  '>': { finger: 'right-ring', x: KEY_COORDS['.'].cx, y: KEY_COORDS['.'].cy },

  // Right Pinky
  '0': { finger: 'right-pinky', x: KEY_COORDS['0'].cx, y: KEY_COORDS['0'].cy },
  ')': { finger: 'right-pinky', x: KEY_COORDS['0'].cx, y: KEY_COORDS['0'].cy },
  '-': { finger: 'right-pinky', x: KEY_COORDS['-'].cx, y: KEY_COORDS['-'].cy },
  '_': { finger: 'right-pinky', x: KEY_COORDS['-'].cx, y: KEY_COORDS['-'].cy },
  '=': { finger: 'right-pinky', x: KEY_COORDS['='].cx, y: KEY_COORDS['='].cy },
  '+': { finger: 'right-pinky', x: KEY_COORDS['='].cx, y: KEY_COORDS['='].cy },
  'backspace': { finger: 'right-pinky', x: KEY_COORDS['backspace'].cx, y: KEY_COORDS['backspace'].cy },
  'p': { finger: 'right-pinky', x: KEY_COORDS['p'].cx, y: KEY_COORDS['p'].cy },
  '[': { finger: 'right-pinky', x: KEY_COORDS['['].cx, y: KEY_COORDS['['].cy },
  '{': { finger: 'right-pinky', x: KEY_COORDS['['].cx, y: KEY_COORDS['['].cy },
  ']': { finger: 'right-pinky', x: KEY_COORDS[']'].cx, y: KEY_COORDS[']'].cy },
  '}': { finger: 'right-pinky', x: KEY_COORDS[']'].cx, y: KEY_COORDS[']'].cy },
  '\\': { finger: 'right-pinky', x: KEY_COORDS['\\'].cx, y: KEY_COORDS['\\'].cy },
  '|': { finger: 'right-pinky', x: KEY_COORDS['\\'].cx, y: KEY_COORDS['\\'].cy },
  ';': { finger: 'right-pinky', x: KEY_COORDS[';'].cx, y: KEY_COORDS[';'].cy },
  ':': { finger: 'right-pinky', x: KEY_COORDS[';'].cx, y: KEY_COORDS[';'].cy },
  "'": { finger: 'right-pinky', x: KEY_COORDS["'"].cx, y: KEY_COORDS["'"].cy },
  '"': { finger: 'right-pinky', x: KEY_COORDS["'"].cx, y: KEY_COORDS["'"].cy },
  'enter': { finger: 'right-pinky', x: KEY_COORDS['enter'].cx, y: KEY_COORDS['enter'].cy },
  '/': { finger: 'right-pinky', x: KEY_COORDS['/'].cx, y: KEY_COORDS['/'].cy },
  '?': { finger: 'right-pinky', x: KEY_COORDS['/'].cx, y: KEY_COORDS['/'].cy },
  'shift-right': { finger: 'right-pinky', x: KEY_COORDS['shift-right'].cx, y: KEY_COORDS['shift-right'].cy },
};

// Resting home row finger coordinates
const RESTING_COORDS = {
  'left-pinky':  { x: KEY_COORDS['a'].cx, y: KEY_COORDS['a'].cy },
  'left-ring':   { x: KEY_COORDS['s'].cx, y: KEY_COORDS['s'].cy },
  'left-middle': { x: KEY_COORDS['d'].cx, y: KEY_COORDS['d'].cy },
  'left-index':  { x: KEY_COORDS['f'].cx, y: KEY_COORDS['f'].cy },
  'left-thumb':  { x: 350, y: 251 },

  'right-thumb':  { x: 460, y: 251 },
  'right-index':  { x: KEY_COORDS['j'].cx, y: KEY_COORDS['j'].cy },
  'right-middle': { x: KEY_COORDS['k'].cx, y: KEY_COORDS['k'].cy },
  'right-ring':   { x: KEY_COORDS['l'].cx, y: KEY_COORDS['l'].cy },
  'right-pinky':  { x: KEY_COORDS[';'].cx, y: KEY_COORDS[';'].cy },
};

/**
 * Creates an anatomical finger with natural curvature and seamless knuckle blending.
 * The openPath only strokes the lateral edges and rounded fingertip apex, leaving
 * the proximal knuckle base open so it flows naturally out of the palm.
 */
function createSeamlessFinger(kx, ky, tx, ty, width = 21, tipR = 10.5) {
  const theta = Math.atan2(ty - ky, tx - kx);
  const phi = theta + Math.PI / 2;

  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const cosP = Math.cos(phi);
  const sinP = Math.sin(phi);

  const halfBase = width * 0.5;
  const halfPip = width * 0.47;

  // Base at knuckle joint
  const blX = +(kx + cosP * halfBase).toFixed(1);
  const blY = +(ky + sinP * halfBase).toFixed(1);
  const brX = +(kx - cosP * halfBase).toFixed(1);
  const brY = +(ky - sinP * halfBase).toFixed(1);

  // PIP joint midpoints
  const len = Math.hypot(tx - kx, ty - ky);
  const midLen = len * 0.52;
  const mlX = +(kx + cosT * midLen + cosP * halfPip).toFixed(1);
  const mlY = +(ky + sinT * midLen + sinP * halfPip).toFixed(1);
  const mrX = +(kx + cosT * midLen - cosP * halfPip).toFixed(1);
  const mrY = +(ky + sinT * midLen - sinP * halfPip).toFixed(1);

  // Fingertip dome endpoints
  const baseTipX = tx - cosT * (tipR * 0.75);
  const baseTipY = ty - sinT * (tipR * 0.75);
  const tlX = +(baseTipX + cosP * tipR).toFixed(1);
  const tlY = +(baseTipY + sinP * tipR).toFixed(1);
  const trX = +(baseTipX - cosP * tipR).toFixed(1);
  const trY = +(baseTipY - sinP * tipR).toFixed(1);

  // Apex of rounded fingertip
  const apexX = +(tx + cosT * (tipR * 0.35)).toFixed(1);
  const apexY = +(ty + sinT * (tipR * 0.35)).toFixed(1);

  // Seamless open path (left edge -> dome tip -> right edge)
  const openPath = `M ${blX} ${blY}
    C ${(blX * 0.5 + mlX * 0.5).toFixed(1)} ${(blY * 0.5 + mlY * 0.5).toFixed(1)}, ${mlX} ${mlY}, ${tlX} ${tlY}
    C ${(tlX + cosT * tipR * 0.55).toFixed(1)} ${(tlY + sinT * tipR * 0.55).toFixed(1)}, ${(apexX + cosP * tipR * 0.55).toFixed(1)} ${(apexY + sinP * tipR * 0.55).toFixed(1)}, ${apexX} ${apexY}
    C ${(apexX - cosP * tipR * 0.55).toFixed(1)} ${(apexY - sinP * tipR * 0.55).toFixed(1)}, ${(trX + cosT * tipR * 0.55).toFixed(1)} ${(trY + sinT * tipR * 0.55).toFixed(1)}, ${trX} ${trY}
    C ${mrX} ${mrY}, ${(brX * 0.5 + mrX * 0.5).toFixed(1)} ${(brY * 0.5 + mrY * 0.5).toFixed(1)}, ${brX} ${brY}`;

  // Closed path for fill background
  const closedPath = `${openPath} Z`;

  return { openPath, closedPath, bl: { x: blX, y: blY }, br: { x: brX, y: brY } };
}

export function HandGuide({ targetChar, isVisible = true, standalone = false }) {
  // Resolve active finger and key target
  const { activeFinger, targetPos } = useMemo(() => {
    if (!targetChar) return { activeFinger: null, targetPos: null };
    const key = targetChar === ' ' ? ' ' : targetChar.toLowerCase();
    const mapping = KEY_FINGER_MAP[key];
    if (!mapping) return { activeFinger: null, targetPos: null };
    return {
      activeFinger: mapping.finger,
      targetPos: { x: mapping.x, y: mapping.y },
    };
  }, [targetChar]);

  if (!isVisible) return null;

  // Active finger dynamically reaches, other fingers rest on home row
  const lp = activeFinger === 'left-pinky' ? targetPos : RESTING_COORDS['left-pinky'];
  const lr = activeFinger === 'left-ring' ? targetPos : RESTING_COORDS['left-ring'];
  const lm = activeFinger === 'left-middle' ? targetPos : RESTING_COORDS['left-middle'];
  const li = activeFinger === 'left-index' ? targetPos : RESTING_COORDS['left-index'];
  const lt = activeFinger === 'thumb' ? { x: 355, y: 251 } : RESTING_COORDS['left-thumb'];

  const rt = activeFinger === 'thumb' ? { x: 455, y: 251 } : RESTING_COORDS['right-thumb'];
  const ri = activeFinger === 'right-index' ? targetPos : RESTING_COORDS['right-index'];
  const rm = activeFinger === 'right-middle' ? targetPos : RESTING_COORDS['right-middle'];
  const rr = activeFinger === 'right-ring' ? targetPos : RESTING_COORDS['right-ring'];
  const rp = activeFinger === 'right-pinky' ? targetPos : RESTING_COORDS['right-pinky'];

  // Left hand knuckles (arched natural MCP joint line)
  const lk_pinky  = { x: 146.5, y: 198 };
  const lk_ring   = { x: 204.3, y: 190 };
  const lk_middle = { x: 262.1, y: 186 };
  const lk_index  = { x: 319.9, y: 190 };

  const f_lp = createSeamlessFinger(lk_pinky.x, lk_pinky.y, lp.x, lp.y, 19.5, 9.8);
  const f_lr = createSeamlessFinger(lk_ring.x, lk_ring.y, lr.x, lr.y, 21.0, 10.5);
  const f_lm = createSeamlessFinger(lk_middle.x, lk_middle.y, lm.x, lm.y, 22.0, 11.0);
  const f_li = createSeamlessFinger(lk_index.x, lk_index.y, li.x, li.y, 21.0, 10.5);
  const f_lt = createSeamlessFinger(295, 275, lt.x, lt.y, 22.5, 11.0);

  // Left Palm Base
  const leftPalm = `
    M 175 350
    C 172 308, 146 265, 136 230
    C 132 214, 134 204, ${f_lp.bl.x} ${f_lp.bl.y}
    Q 175 196, ${f_lr.bl.x} ${f_lr.bl.y}
    Q 233 188, ${f_lm.bl.x} ${f_lm.bl.y}
    Q 291 188, ${f_li.bl.x} ${f_li.bl.y}
    C 336 204, 324 226, 308 242
    C 292 254, 280 266, 284 282
    C 288 300, 274 322, 268 350
    Z
  `;

  // Right hand knuckles (arched natural MCP joint line)
  const rk_index  = { x: 493.4, y: 190 };
  const rk_middle = { x: 551.1, y: 186 };
  const rk_ring   = { x: 608.9, y: 190 };
  const rk_pinky  = { x: 666.7, y: 198 };

  const f_ri = createSeamlessFinger(rk_index.x, rk_index.y, ri.x, ri.y, 21.0, 10.5);
  const f_rm = createSeamlessFinger(rk_middle.x, rk_middle.y, rm.x, rm.y, 22.0, 11.0);
  const f_rr = createSeamlessFinger(rk_ring.x, rk_ring.y, rr.x, rr.y, 21.0, 10.5);
  const f_rp = createSeamlessFinger(rk_pinky.x, rk_pinky.y, rp.x, rp.y, 19.5, 9.8);
  const f_rt = createSeamlessFinger(518, 275, rt.x, rt.y, 22.5, 11.0);

  // Right Palm Base
  const rightPalm = `
    M 685 350
    C 688 308, 714 265, 724 230
    C 728 214, 726 204, ${f_rp.br.x} ${f_rp.br.y}
    Q 637 196, ${f_rr.br.x} ${f_rr.br.y}
    Q 579 188, ${f_rm.br.x} ${f_rm.br.y}
    Q 521 188, ${f_ri.br.x} ${f_ri.br.y}
    C 476 204, 488 226, 504 242
    C 520 254, 532 266, 528 282
    C 524 300, 538 322, 544 350
    Z
  `;

  const content = (
    <g id="realistic-human-hands" className="pointer-events-none select-none">
      <defs>
        {/* Soft Translucent Skin / Glass Fill */}
        <linearGradient id="humanHandGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
          <stop offset="35%" stopColor="#0284c7" stopOpacity="0.18" />
          <stop offset="80%" stopColor="#082f49" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#070b14" stopOpacity="0.0" />
        </linearGradient>

        {/* Active Finger Luminous Gradient */}
        <linearGradient id="activeReachGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
          <stop offset="45%" stopColor="#0284c7" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#0369a1" stopOpacity="0.15" />
        </linearGradient>

        {/* Realistic Fingertip Glow */}
        <filter id="fingertipAura" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ================================================================= */}
      {/* ── LEFT HUMAN HAND (Pinky at A, Index at F, Thumb at Space) ───── */}
      {/* ================================================================= */}
      <g id="left-human-hand" opacity="0.95">
        {/* Palm Base */}
        <path d={leftPalm} fill="url(#humanHandGrad)" stroke="#38bdf8" strokeWidth="1.3" strokeOpacity="0.45" />

        {/* Left Fingers (Base fill + unclosed stroke for seamless knuckle connection) */}
        <path d={f_lt.closedPath} fill="url(#humanHandGrad)" stroke="none" />
        <path d={f_lt.openPath} fill="none" stroke="#38bdf8" strokeWidth="1.3" strokeOpacity="0.45" />

        <path d={f_lp.closedPath} fill="url(#humanHandGrad)" stroke="none" />
        <path d={f_lp.openPath} fill="none" stroke="#38bdf8" strokeWidth="1.3" strokeOpacity="0.45" />

        <path d={f_lr.closedPath} fill="url(#humanHandGrad)" stroke="none" />
        <path d={f_lr.openPath} fill="none" stroke="#38bdf8" strokeWidth="1.3" strokeOpacity="0.45" />

        <path d={f_lm.closedPath} fill="url(#humanHandGrad)" stroke="none" />
        <path d={f_lm.openPath} fill="none" stroke="#38bdf8" strokeWidth="1.3" strokeOpacity="0.45" />

        <path d={f_li.closedPath} fill="url(#humanHandGrad)" stroke="none" />
        <path d={f_li.openPath} fill="none" stroke="#38bdf8" strokeWidth="1.3" strokeOpacity="0.45" />

        {/* Left Active Finger Highlight */}
        {activeFinger === 'left-pinky' && (
          <path d={f_lp.closedPath} fill="url(#activeReachGrad)" stroke="#38bdf8" strokeWidth="2.0" strokeOpacity="0.95" filter="url(#fingertipAura)" />
        )}
        {activeFinger === 'left-ring' && (
          <path d={f_lr.closedPath} fill="url(#activeReachGrad)" stroke="#38bdf8" strokeWidth="2.0" strokeOpacity="0.95" filter="url(#fingertipAura)" />
        )}
        {activeFinger === 'left-middle' && (
          <path d={f_lm.closedPath} fill="url(#activeReachGrad)" stroke="#38bdf8" strokeWidth="2.0" strokeOpacity="0.95" filter="url(#fingertipAura)" />
        )}
        {activeFinger === 'left-index' && (
          <path d={f_li.closedPath} fill="url(#activeReachGrad)" stroke="#38bdf8" strokeWidth="2.0" strokeOpacity="0.95" filter="url(#fingertipAura)" />
        )}
        {activeFinger === 'thumb' && (
          <path d={f_lt.closedPath} fill="url(#activeReachGrad)" stroke="#38bdf8" strokeWidth="2.0" strokeOpacity="0.95" filter="url(#fingertipAura)" />
        )}

        {/* Tendons & Creases */}
        <path d="M 210 330 C 200 285, 155 240, 146 198" stroke="#38bdf8" strokeWidth="0.8" strokeOpacity="0.22" fill="none" />
        <path d="M 220 326 C 216 278, 206 230, 204 190" stroke="#38bdf8" strokeWidth="0.8" strokeOpacity="0.25" fill="none" />
        <path d="M 230 324 C 234 274, 258 226, 262 186" stroke="#38bdf8" strokeWidth="0.8" strokeOpacity="0.25" fill="none" />
        <path d="M 242 326 C 250 278, 310 230, 320 190" stroke="#38bdf8" strokeWidth="0.8" strokeOpacity="0.25" fill="none" />
        <path d="M 300 242 C 275 264, 252 292, 248 325" stroke="#38bdf8" strokeWidth="0.9" strokeOpacity="0.22" fill="none" />

        {/* Left Glowing Fingertip Aura */}
        {activeFinger === 'left-pinky' && <circle cx={lp.x} cy={lp.y} r="8.5" fill="#38bdf8" opacity="0.95" filter="url(#fingertipAura)" />}
        {activeFinger === 'left-ring' && <circle cx={lr.x} cy={lr.y} r="8.5" fill="#38bdf8" opacity="0.95" filter="url(#fingertipAura)" />}
        {activeFinger === 'left-middle' && <circle cx={lm.x} cy={lm.y} r="9.0" fill="#38bdf8" opacity="0.95" filter="url(#fingertipAura)" />}
        {activeFinger === 'left-index' && <circle cx={li.x} cy={li.y} r="8.5" fill="#38bdf8" opacity="0.95" filter="url(#fingertipAura)" />}
        {activeFinger === 'thumb' && <circle cx={lt.x} cy={lt.y} r="8.5" fill="#38bdf8" opacity="0.95" filter="url(#fingertipAura)" />}
      </g>

      {/* ================================================================= */}
      {/* ── RIGHT HUMAN HAND (Thumb at Space, Index at J, Pinky at ;) ──── */}
      {/* ================================================================= */}
      <g id="right-human-hand" opacity="0.95">
        {/* Palm Base */}
        <path d={rightPalm} fill="url(#humanHandGrad)" stroke="#38bdf8" strokeWidth="1.3" strokeOpacity="0.45" />

        {/* Right Fingers (Base fill + unclosed stroke for seamless knuckle connection) */}
        <path d={f_rt.closedPath} fill="url(#humanHandGrad)" stroke="none" />
        <path d={f_rt.openPath} fill="none" stroke="#38bdf8" strokeWidth="1.3" strokeOpacity="0.45" />

        <path d={f_ri.closedPath} fill="url(#humanHandGrad)" stroke="none" />
        <path d={f_ri.openPath} fill="none" stroke="#38bdf8" strokeWidth="1.3" strokeOpacity="0.45" />

        <path d={f_rm.closedPath} fill="url(#humanHandGrad)" stroke="none" />
        <path d={f_rm.openPath} fill="none" stroke="#38bdf8" strokeWidth="1.3" strokeOpacity="0.45" />

        <path d={f_rr.closedPath} fill="url(#humanHandGrad)" stroke="none" />
        <path d={f_rr.openPath} fill="none" stroke="#38bdf8" strokeWidth="1.3" strokeOpacity="0.45" />

        <path d={f_rp.closedPath} fill="url(#humanHandGrad)" stroke="none" />
        <path d={f_rp.openPath} fill="none" stroke="#38bdf8" strokeWidth="1.3" strokeOpacity="0.45" />

        {/* Right Active Finger Highlight */}
        {activeFinger === 'right-index' && (
          <path d={f_ri.closedPath} fill="url(#activeReachGrad)" stroke="#38bdf8" strokeWidth="2.0" strokeOpacity="0.95" filter="url(#fingertipAura)" />
        )}
        {activeFinger === 'right-middle' && (
          <path d={f_rm.closedPath} fill="url(#activeReachGrad)" stroke="#38bdf8" strokeWidth="2.0" strokeOpacity="0.95" filter="url(#fingertipAura)" />
        )}
        {activeFinger === 'right-ring' && (
          <path d={f_rr.closedPath} fill="url(#activeReachGrad)" stroke="#38bdf8" strokeWidth="2.0" strokeOpacity="0.95" filter="url(#fingertipAura)" />
        )}
        {activeFinger === 'right-pinky' && (
          <path d={f_rp.closedPath} fill="url(#activeReachGrad)" stroke="#38bdf8" strokeWidth="2.0" strokeOpacity="0.95" filter="url(#fingertipAura)" />
        )}
        {activeFinger === 'thumb' && (
          <path d={f_rt.closedPath} fill="url(#activeReachGrad)" stroke="#38bdf8" strokeWidth="2.0" strokeOpacity="0.95" filter="url(#fingertipAura)" />
        )}

        {/* Tendons & Creases */}
        <path d="M 645 330 C 655 285, 705 240, 714 198" stroke="#38bdf8" strokeWidth="0.8" strokeOpacity="0.22" fill="none" />
        <path d="M 635 326 C 640 278, 654 230, 656 190" stroke="#38bdf8" strokeWidth="0.8" strokeOpacity="0.25" fill="none" />
        <path d="M 625 324 C 620 274, 598 226, 594 186" stroke="#38bdf8" strokeWidth="0.8" strokeOpacity="0.25" fill="none" />
        <path d="M 612 326 C 605 278, 545 230, 536 190" stroke="#38bdf8" strokeWidth="0.8" strokeOpacity="0.25" fill="none" />
        <path d="M 554 242 C 580 264, 602 292, 605 325" stroke="#38bdf8" strokeWidth="0.9" strokeOpacity="0.22" fill="none" />

        {/* Right Glowing Fingertip Aura */}
        {activeFinger === 'thumb' && <circle cx={rt.x} cy={rt.y} r="8.5" fill="#38bdf8" opacity="0.95" filter="url(#fingertipAura)" />}
        {activeFinger === 'right-index' && <circle cx={ri.x} cy={ri.y} r="8.5" fill="#38bdf8" opacity="0.95" filter="url(#fingertipAura)" />}
        {activeFinger === 'right-middle' && <circle cx={rm.x} cy={rm.y} r="9.0" fill="#38bdf8" opacity="0.95" filter="url(#fingertipAura)" />}
        {activeFinger === 'right-ring' && <circle cx={rr.x} cy={rr.y} r="8.5" fill="#38bdf8" opacity="0.95" filter="url(#fingertipAura)" />}
        {activeFinger === 'right-pinky' && <circle cx={rp.x} cy={rp.y} r="8.5" fill="#38bdf8" opacity="0.95" filter="url(#fingertipAura)" />}
      </g>
    </g>
  );

  if (standalone) {
    return (
      <svg
        viewBox="0 0 900 350"
        className="w-full max-w-[820px] h-auto block overflow-visible select-none pointer-events-none mx-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        {content}
      </svg>
    );
  }

  return content;
}

export default HandGuide;
