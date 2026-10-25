import React, { useMemo } from 'react';

/**
 * HandGuide — Realistic Anatomical Human Hand Guide.
 * 
 * Accurately models human hands in a relaxed touch-typing posture.
 * Uses natural palm anatomy, realistic finger proportions, knuckles, and smooth curvature.
 * Synchronized with the 900x350 ANSI 60% Virtual Keyboard coordinate system.
 * When a key is targeted (e.g. 'i'), the corresponding finger dynamically reaches to that key
 * with an ethereal cyan glowing fingertip, matching the reference image.
 */

// Finger key assignments mapping keys to finger and exact target coordinates
const KEY_FINGER_MAP = {
  // Left Pinky
  '`': { finger: 'left-pinky', x: 45.6, y: 39 },
  '~': { finger: 'left-pinky', x: 45.6, y: 39 },
  '1': { finger: 'left-pinky', x: 96.9, y: 39 },
  '!': { finger: 'left-pinky', x: 96.9, y: 39 },
  'q': { finger: 'left-pinky', x: 133.0, y: 95 },
  'a': { finger: 'left-pinky', x: 147.6, y: 150 },
  'z': { finger: 'left-pinky', x: 182.2, y: 205 },
  'tab': { finger: 'left-pinky', x: 60.2, y: 95 },
  'caps': { finger: 'left-pinky', x: 67.5, y: 150 },
  'shift-left': { finger: 'left-pinky', x: 82.0, y: 205 },

  // Left Ring
  '2': { finger: 'left-ring', x: 155.1, y: 39 },
  '@': { finger: 'left-ring', x: 155.1, y: 39 },
  'w': { finger: 'left-ring', x: 191.3, y: 95 },
  's': { finger: 'left-ring', x: 205.9, y: 150 },
  'x': { finger: 'left-ring', x: 240.5, y: 205 },

  // Left Middle
  '3': { finger: 'left-middle', x: 213.4, y: 39 },
  '#': { finger: 'left-middle', x: 213.4, y: 39 },
  'e': { finger: 'left-middle', x: 249.6, y: 95 },
  'd': { finger: 'left-middle', x: 264.2, y: 150 },
  'c': { finger: 'left-middle', x: 298.8, y: 205 },

  // Left Index
  '4': { finger: 'left-index', x: 271.7, y: 39 },
  '$': { finger: 'left-index', x: 271.7, y: 39 },
  '5': { finger: 'left-index', x: 329.9, y: 39 },
  '%': { finger: 'left-index', x: 329.9, y: 39 },
  'r': { finger: 'left-index', x: 307.8, y: 95 },
  't': { finger: 'left-index', x: 366.1, y: 95 },
  'f': { finger: 'left-index', x: 322.4, y: 150 },
  'g': { finger: 'left-index', x: 380.7, y: 150 },
  'v': { finger: 'left-index', x: 357.0, y: 205 },
  'b': { finger: 'left-index', x: 415.3, y: 205 },

  // Thumbs
  ' ': { finger: 'thumb', x: 450.0, y: 260 },

  // Right Index
  '6': { finger: 'right-index', x: 388.2, y: 39 },
  '^': { finger: 'right-index', x: 388.2, y: 39 },
  '7': { finger: 'right-index', x: 446.5, y: 39 },
  '&': { finger: 'right-index', x: 446.5, y: 39 },
  'y': { finger: 'right-index', x: 424.4, y: 95 },
  'u': { finger: 'right-index', x: 482.6, y: 95 },
  'h': { finger: 'right-index', x: 439.0, y: 150 },
  'j': { finger: 'right-index', x: 497.2, y: 150 },
  'n': { finger: 'right-index', x: 473.6, y: 205 },
  'm': { finger: 'right-index', x: 531.8, y: 205 },

  // Right Middle
  '8': { finger: 'right-middle', x: 504.8, y: 39 },
  '*': { finger: 'right-middle', x: 504.8, y: 39 },
  'i': { finger: 'right-middle', x: 540.9, y: 95 },
  'k': { finger: 'right-middle', x: 555.5, y: 150 },
  ',': { finger: 'right-middle', x: 590.1, y: 205 },
  '<': { finger: 'right-middle', x: 590.1, y: 205 },

  // Right Ring
  '9': { finger: 'right-ring', x: 563.0, y: 39 },
  '(': { finger: 'right-ring', x: 563.0, y: 39 },
  'o': { finger: 'right-ring', x: 599.2, y: 95 },
  'l': { finger: 'right-ring', x: 613.8, y: 150 },
  '.': { finger: 'right-ring', x: 648.4, y: 205 },
  '>': { finger: 'right-ring', x: 648.4, y: 205 },

  // Right Pinky
  '0': { finger: 'right-pinky', x: 621.3, y: 39 },
  ')': { finger: 'right-pinky', x: 621.3, y: 39 },
  '-': { finger: 'right-pinky', x: 679.6, y: 39 },
  '_': { finger: 'right-pinky', x: 679.6, y: 39 },
  '=': { finger: 'right-pinky', x: 737.9, y: 39 },
  '+': { finger: 'right-pinky', x: 737.9, y: 39 },
  'p': { finger: 'right-pinky', x: 657.4, y: 95 },
  '[': { finger: 'right-pinky', x: 715.7, y: 95 },
  '{': { finger: 'right-pinky', x: 715.7, y: 95 },
  ']': { finger: 'right-pinky', x: 774.0, y: 95 },
  '}': { finger: 'right-pinky', x: 774.0, y: 95 },
  '\\': { finger: 'right-pinky', x: 846.9, y: 95 },
  '|': { finger: 'right-pinky', x: 846.9, y: 95 },
  ';': { finger: 'right-pinky', x: 672.0, y: 150 },
  ':': { finger: 'right-pinky', x: 672.0, y: 150 },
  "'": { finger: 'right-pinky', x: 730.3, y: 150 },
  '"': { finger: 'right-pinky', x: 730.3, y: 150 },
  'enter': { finger: 'right-pinky', x: 825.0, y: 150 },
  '/': { finger: 'right-pinky', x: 706.7, y: 205 },
  '?': { finger: 'right-pinky', x: 706.7, y: 205 },
  'shift-right': { finger: 'right-pinky', x: 801.3, y: 205 },
};

// Resting home row coordinates for realistic posture
const RESTING_COORDS = {
  'left-pinky':  { x: 147.6, y: 150 },
  'left-ring':   { x: 205.9, y: 150 },
  'left-middle': { x: 264.2, y: 150 },
  'left-index':  { x: 322.4, y: 150 },
  'left-thumb':  { x: 330.0, y: 260 },

  'right-thumb':  { x: 575.0, y: 260 },
  'right-index':  { x: 497.2, y: 150 },
  'right-middle': { x: 555.5, y: 150 },
  'right-ring':   { x: 613.8, y: 150 },
  'right-pinky':  { x: 672.0, y: 150 },
};

export function HandGuide({ targetChar, isVisible = true, standalone = false }) {
  // Resolve active finger and target coordinate
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

  // Live positions: active finger reaches to targetPos, others rest naturally on home keys
  const lp = activeFinger === 'left-pinky' ? targetPos : RESTING_COORDS['left-pinky'];
  const lr = activeFinger === 'left-ring' ? targetPos : RESTING_COORDS['left-ring'];
  const lm = activeFinger === 'left-middle' ? targetPos : RESTING_COORDS['left-middle'];
  const li = activeFinger === 'left-index' ? targetPos : RESTING_COORDS['left-index'];
  const lt = activeFinger === 'thumb' ? { x: 345, y: 258 } : RESTING_COORDS['left-thumb'];

  const rt = activeFinger === 'thumb' ? { x: 555, y: 258 } : RESTING_COORDS['right-thumb'];
  const ri = activeFinger === 'right-index' ? targetPos : RESTING_COORDS['right-index'];
  const rm = activeFinger === 'right-middle' ? targetPos : RESTING_COORDS['right-middle'];
  const rr = activeFinger === 'right-ring' ? targetPos : RESTING_COORDS['right-ring'];
  const rp = activeFinger === 'right-pinky' ? targetPos : RESTING_COORDS['right-pinky'];

  const content = (
    <g id="realistic-human-hands" className="pointer-events-none select-none">
      <defs>
        {/* Soft Translucent Skin / Glass Fill */}
        <linearGradient id="humanHandGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#082f49" stopOpacity="0.22" />
          <stop offset="45%" stopColor="#0369a1" stopOpacity="0.16" />
          <stop offset="85%" stopColor="#0c1322" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#070b14" stopOpacity="0.0" />
        </linearGradient>

        {/* Active Finger Luminous Gradient */}
        <linearGradient id="activeReachGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
          <stop offset="40%" stopColor="#0284c7" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#0369a1" stopOpacity="0.1" />
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
      {/* ── LEFT HUMAN HAND (A S D F + Space) ──────────────────────────── */}
      {/* ================================================================= */}
      <g id="left-human-hand" opacity="0.94">
        {/* Palm & Wrist Anatomy */}
        <path
          d="M 130 350
             C 140 310, 142 270, 148 240
             C 152 218, 168 208, 192 208
             C 220 208, 245 212, 275 224
             C 305 238, 332 258, 348 278
             C 362 296, 368 322, 362 350
             Z"
          fill="url(#humanHandGrad)"
          stroke="#38bdf8"
          strokeWidth="1.2"
          strokeOpacity="0.32"
        />

        {/* Hypothenar & Thenar Muscle Contours */}
        <path d="M 152 270 Q 185 285 220 275" stroke="#38bdf8" strokeWidth="0.8" strokeOpacity="0.22" fill="none" />
        <path d="M 230 270 Q 275 285 320 265" stroke="#38bdf8" strokeWidth="0.8" strokeOpacity="0.22" fill="none" />
        <path d="M 205 240 Q 255 250 295 245" stroke="#38bdf8" strokeWidth="0.8" strokeOpacity="0.18" fill="none" />

        {/* Left Pinky -> Key A (147.6, 150) */}
        <path
          d={`M 148 238
              C 144 205, ${lp.x - 9} ${lp.y + 24}, ${lp.x - 7} ${lp.y}
              C ${lp.x - 3} ${lp.y - 10}, ${lp.x + 3} ${lp.y - 10}, ${lp.x + 7} ${lp.y}
              C ${lp.x + 8} ${lp.y + 24}, 168 205, 168 234 Z`}
          fill={activeFinger === 'left-pinky' ? "url(#activeReachGrad)" : "url(#humanHandGrad)"}
          stroke="#38bdf8"
          strokeWidth={activeFinger === 'left-pinky' ? "2" : "1.2"}
          strokeOpacity={activeFinger === 'left-pinky' ? "1" : "0.4"}
          filter={activeFinger === 'left-pinky' ? "url(#fingertipAura)" : "none"}
          style={{ transition: 'all 120ms ease-out' }}
        />
        {/* Pinky Knuckle Creases */}
        <path d={`M ${lp.x - 5} ${lp.y + 12} Q ${lp.x} ${lp.y + 10} ${lp.x + 5} ${lp.y + 12}`} stroke="#38bdf8" strokeWidth="0.8" strokeOpacity="0.28" fill="none" />
        {activeFinger === 'left-pinky' && (
          <circle cx={lp.x} cy={lp.y} r="9" fill="#38bdf8" opacity="0.95" filter="url(#fingertipAura)" />
        )}

        {/* Left Ring Finger -> Key S (205.9, 150) */}
        <path
          d={`M 172 232
              C 175 195, ${lr.x - 9} ${lr.y + 24}, ${lr.x - 8} ${lr.y}
              C ${lr.x - 3} ${lr.y - 11}, ${lr.x + 3} ${lr.y - 11}, ${lr.x + 8} ${lr.y}
              C ${lr.x + 8} ${lr.y + 24}, 202 195, 202 230 Z`}
          fill={activeFinger === 'left-ring' ? "url(#activeReachGrad)" : "url(#humanHandGrad)"}
          stroke="#38bdf8"
          strokeWidth={activeFinger === 'left-ring' ? "2" : "1.2"}
          strokeOpacity={activeFinger === 'left-ring' ? "1" : "0.4"}
          filter={activeFinger === 'left-ring' ? "url(#fingertipAura)" : "none"}
          style={{ transition: 'all 120ms ease-out' }}
        />
        <path d={`M ${lr.x - 6} ${lr.y + 12} Q ${lr.x} ${lr.y + 10} ${lr.x + 6} ${lr.y + 12}`} stroke="#38bdf8" strokeWidth="0.8" strokeOpacity="0.28" fill="none" />
        {activeFinger === 'left-ring' && (
          <circle cx={lr.x} cy={lr.y} r="9" fill="#38bdf8" opacity="0.95" filter="url(#fingertipAura)" />
        )}

        {/* Left Middle Finger -> Key D (264.2, 150) */}
        <path
          d={`M 206 230
              C 212 190, ${lm.x - 10} ${lm.y + 24}, ${lm.x - 8} ${lm.y}
              C ${lm.x - 3} ${lm.y - 12}, ${lm.x + 3} ${lm.y - 12}, ${lm.x + 8} ${lm.y}
              C ${lm.x + 9} ${lm.y + 24}, 238 190, 238 230 Z`}
          fill={activeFinger === 'left-middle' ? "url(#activeReachGrad)" : "url(#humanHandGrad)"}
          stroke="#38bdf8"
          strokeWidth={activeFinger === 'left-middle' ? "2" : "1.2"}
          strokeOpacity={activeFinger === 'left-middle' ? "1" : "0.4"}
          filter={activeFinger === 'left-middle' ? "url(#fingertipAura)" : "none"}
          style={{ transition: 'all 120ms ease-out' }}
        />
        <path d={`M ${lm.x - 6} ${lm.y + 13} Q ${lm.x} ${lm.y + 11} ${lm.x + 6} ${lm.y + 13}`} stroke="#38bdf8" strokeWidth="0.8" strokeOpacity="0.28" fill="none" />
        {activeFinger === 'left-middle' && (
          <circle cx={lm.x} cy={lm.y} r="9" fill="#38bdf8" opacity="0.95" filter="url(#fingertipAura)" />
        )}

        {/* Left Index Finger -> Key F (322.4, 150) */}
        <path
          d={`M 242 232
              C 252 195, ${li.x - 9} ${li.y + 24}, ${li.x - 8} ${li.y}
              C ${li.x - 3} ${li.y - 11}, ${li.x + 3} ${li.y - 11}, ${li.x + 8} ${li.y}
              C ${li.x + 8} ${li.y + 24}, 278 195, 276 235 Z`}
          fill={activeFinger === 'left-index' ? "url(#activeReachGrad)" : "url(#humanHandGrad)"}
          stroke="#38bdf8"
          strokeWidth={activeFinger === 'left-index' ? "2" : "1.2"}
          strokeOpacity={activeFinger === 'left-index' ? "1" : "0.4"}
          filter={activeFinger === 'left-index' ? "url(#fingertipAura)" : "none"}
          style={{ transition: 'all 120ms ease-out' }}
        />
        <path d={`M ${li.x - 6} ${li.y + 12} Q ${li.x} ${li.y + 10} ${li.x + 6} ${li.y + 12}`} stroke="#38bdf8" strokeWidth="0.8" strokeOpacity="0.28" fill="none" />
        {activeFinger === 'left-index' && (
          <circle cx={li.x} cy={li.y} r="9" fill="#38bdf8" opacity="0.95" filter="url(#fingertipAura)" />
        )}

        {/* Left Thumb -> Left Spacebar (330, 260) */}
        <path
          d={`M 298 255
              C 315 250, ${lt.x - 14} ${lt.y - 6}, ${lt.x} ${lt.y}
              C ${lt.x + 10} ${lt.y + 6}, ${lt.x + 4} ${lt.y + 18}, 338 285
              C 318 290, 296 275, 290 265 Z`}
          fill={activeFinger === 'thumb' ? "url(#activeReachGrad)" : "url(#humanHandGrad)"}
          stroke="#38bdf8"
          strokeWidth={activeFinger === 'thumb' ? "2" : "1.2"}
          strokeOpacity={activeFinger === 'thumb' ? "1" : "0.4"}
          filter={activeFinger === 'thumb' ? "url(#fingertipAura)" : "none"}
          style={{ transition: 'all 120ms ease-out' }}
        />
        {activeFinger === 'thumb' && (
          <circle cx={lt.x} cy={lt.y} r="8.5" fill="#38bdf8" opacity="0.95" filter="url(#fingertipAura)" />
        )}
      </g>

      {/* ================================================================= */}
      {/* ── RIGHT HUMAN HAND (J K L ; + Space) ─────────────────────────── */}
      {/* ================================================================= */}
      <g id="right-human-hand" opacity="0.94">
        {/* Palm & Wrist Anatomy */}
        <path
          d="M 770 350
             C 760 310, 758 270, 752 240
             C 748 218, 732 208, 708 208
             C 680 208, 655 212, 625 224
             C 595 238, 568 258, 552 278
             C 538 296, 532 322, 538 350
             Z"
          fill="url(#humanHandGrad)"
          stroke="#38bdf8"
          strokeWidth="1.2"
          strokeOpacity="0.32"
        />

        {/* Hypothenar & Thenar Muscle Contours */}
        <path d="M 748 270 Q 715 285 680 275" stroke="#38bdf8" strokeWidth="0.8" strokeOpacity="0.22" fill="none" />
        <path d="M 670 270 Q 625 285 580 265" stroke="#38bdf8" strokeWidth="0.8" strokeOpacity="0.22" fill="none" />
        <path d="M 695 240 Q 645 250 605 245" stroke="#38bdf8" strokeWidth="0.8" strokeOpacity="0.18" fill="none" />

        {/* Right Thumb -> Right Spacebar (575, 260) */}
        <path
          d={`M 602 255
              C 585 250, ${rt.x + 14} ${rt.y - 6}, ${rt.x} ${rt.y}
              C ${rt.x - 10} ${rt.y + 6}, ${rt.x - 4} ${rt.y + 18}, 562 285
              C 582 290, 604 275, 610 265 Z`}
          fill={activeFinger === 'thumb' ? "url(#activeReachGrad)" : "url(#humanHandGrad)"}
          stroke="#38bdf8"
          strokeWidth={activeFinger === 'thumb' ? "2" : "1.2"}
          strokeOpacity={activeFinger === 'thumb' ? "1" : "0.4"}
          filter={activeFinger === 'thumb' ? "url(#fingertipAura)" : "none"}
          style={{ transition: 'all 120ms ease-out' }}
        />
        {activeFinger === 'thumb' && (
          <circle cx={rt.x} cy={rt.y} r="8.5" fill="#38bdf8" opacity="0.95" filter="url(#fingertipAura)" />
        )}

        {/* Right Index Finger -> Key J (497.2, 150) */}
        <path
          d={`M 658 232
              C 648 195, ${ri.x + 9} ${ri.y + 24}, ${ri.x + 8} ${ri.y}
              C ${ri.x + 3} ${ri.y - 11}, ${ri.x - 3} ${ri.y - 11}, ${ri.x - 8} ${ri.y}
              C ${ri.x - 8} ${ri.y + 24}, 622 195, 624 235 Z`}
          fill={activeFinger === 'right-index' ? "url(#activeReachGrad)" : "url(#humanHandGrad)"}
          stroke="#38bdf8"
          strokeWidth={activeFinger === 'right-index' ? "2" : "1.2"}
          strokeOpacity={activeFinger === 'right-index' ? "1" : "0.4"}
          filter={activeFinger === 'right-index' ? "url(#fingertipAura)" : "none"}
          style={{ transition: 'all 120ms ease-out' }}
        />
        <path d={`M ${ri.x + 6} ${ri.y + 12} Q ${ri.x} ${ri.y + 10} ${ri.x - 6} ${ri.y + 12}`} stroke="#38bdf8" strokeWidth="0.8" strokeOpacity="0.28" fill="none" />
        {activeFinger === 'right-index' && (
          <circle cx={ri.x} cy={ri.y} r="9" fill="#38bdf8" opacity="0.95" filter="url(#fingertipAura)" />
        )}

        {/* Right Middle Finger -> Key K (555.5, 150) or REACHES TO Key I (540.9, 95) */}
        <path
          d={`M 694 230
              C 688 190, ${rm.x + 10} ${rm.y + 24}, ${rm.x + 8} ${rm.y}
              C ${rm.x + 3} ${rm.y - 12}, ${rm.x - 3} ${rm.y - 12}, ${rm.x - 8} ${rm.y}
              C ${rm.x - 9} ${rm.y + 24}, 662 190, 662 230 Z`}
          fill={activeFinger === 'right-middle' ? "url(#activeReachGrad)" : "url(#humanHandGrad)"}
          stroke="#38bdf8"
          strokeWidth={activeFinger === 'right-middle' ? "2.2" : "1.2"}
          strokeOpacity={activeFinger === 'right-middle' ? "1" : "0.4"}
          filter={activeFinger === 'right-middle' ? "url(#fingertipAura)" : "none"}
          style={{ transition: 'all 120ms ease-out' }}
        />
        <path d={`M ${rm.x + 6} ${rm.y + 13} Q ${rm.x} ${rm.y + 11} ${rm.x - 6} ${rm.y + 13}`} stroke="#38bdf8" strokeWidth="0.8" strokeOpacity="0.28" fill="none" />
        {activeFinger === 'right-middle' && (
          <circle cx={rm.x} cy={rm.y} r="9.5" fill="#38bdf8" opacity="0.95" filter="url(#fingertipAura)" />
        )}

        {/* Right Ring Finger -> Key L (613.8, 150) */}
        <path
          d={`M 728 232
              C 725 195, ${rr.x + 9} ${rr.y + 24}, ${rr.x + 8} ${rr.y}
              C ${rr.x + 3} ${rr.y - 11}, ${rr.x - 3} ${rr.y - 11}, ${rr.x - 8} ${rr.y}
              C ${rr.x - 8} ${rr.y + 24}, 698 195, 698 230 Z`}
          fill={activeFinger === 'right-ring' ? "url(#activeReachGrad)" : "url(#humanHandGrad)"}
          stroke="#38bdf8"
          strokeWidth={activeFinger === 'right-ring' ? "2" : "1.2"}
          strokeOpacity={activeFinger === 'right-ring' ? "1" : "0.4"}
          filter={activeFinger === 'right-ring' ? "url(#fingertipAura)" : "none"}
          style={{ transition: 'all 120ms ease-out' }}
        />
        <path d={`M ${rr.x + 6} ${rr.y + 12} Q ${rr.x} ${rr.y + 10} ${rr.x - 6} ${rr.y + 12}`} stroke="#38bdf8" strokeWidth="0.8" strokeOpacity="0.28" fill="none" />
        {activeFinger === 'right-ring' && (
          <circle cx={rr.x} cy={rr.y} r="9" fill="#38bdf8" opacity="0.95" filter="url(#fingertipAura)" />
        )}

        {/* Right Pinky -> Key ; (672.0, 150) */}
        <path
          d={`M 752 238
              C 756 205, ${rp.x + 9} ${rp.y + 24}, ${rp.x + 7} ${rp.y}
              C ${rp.x + 3} ${rp.y - 10}, ${rp.x - 3} ${rp.y - 10}, ${rp.x - 7} ${rp.y}
              C ${rp.x - 8} ${rp.y + 24}, 732 205, 732 234 Z`}
          fill={activeFinger === 'right-pinky' ? "url(#activeReachGrad)" : "url(#humanHandGrad)"}
          stroke="#38bdf8"
          strokeWidth={activeFinger === 'right-pinky' ? "2" : "1.2"}
          strokeOpacity={activeFinger === 'right-pinky' ? "1" : "0.4"}
          filter={activeFinger === 'right-pinky' ? "url(#fingertipAura)" : "none"}
          style={{ transition: 'all 120ms ease-out' }}
        />
        <path d={`M ${rp.x + 5} ${rp.y + 12} Q ${rp.x} ${rp.y + 10} ${rp.x - 5} ${rp.y + 12}`} stroke="#38bdf8" strokeWidth="0.8" strokeOpacity="0.28" fill="none" />
        {activeFinger === 'right-pinky' && (
          <circle cx={rp.x} cy={rp.y} r="9" fill="#38bdf8" opacity="0.95" filter="url(#fingertipAura)" />
        )}
      </g>
    </g>
  );

  if (standalone) {
    return (
      <svg
        viewBox="0 0 900 350"
        className="w-full max-w-[780px] h-auto block overflow-visible select-none pointer-events-none mx-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        {content}
      </svg>
    );
  }

  return content;
}

export default HandGuide;

