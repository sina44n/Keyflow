import React, { useMemo } from 'react';
import { HandGuide } from './HandGuide';

/**
 * KeyboardGuide — Precision-Engineered ANSI 60% Virtual Keyboard.
 * 
 * Symmetrical 15.0 Unit calibration across all 5 rows (ViewBox: 0 0 900 350).
 * Every row matches 860px total width with zero gap disparity.
 * Features dual glyphs, tactile bumps on F & J, and active key glow.
 * Integrates realistic translucent human hands directly over the keys.
 */

// Dual-character shift map: shifted symbol -> base key
export const SHIFT_MAP = {
  '~':'`', '!':'1', '@':'2', '#':'3', '$':'4', '%':'5', '^':'6', '&':'7', '*':'8', '(':'9', ')':'0',
  '_':'-', '+':'=', '{':'[', '}':']', '|':'\\', ':':';', '"':"'", '<':',', '>':'.', '?':'/',
};

// 15.0 Unit Keyboard Layout definitions
// U = 51.267px, gap = 7px. Total width = 860px.
// Row height = 46px, row gap = 7px. Total height = 258px.
const ROW_START_Y = 16;
const ROW_HEIGHT = 46;
const ROW_GAP = 7;
const KEY_GAP = 7;
const UNIT = (860 - 13 * KEY_GAP) / 15; // 51.2667px

function computeKeyWidth(uMult) {
  return uMult * UNIT + (uMult - 1) * KEY_GAP;
}

// Generate exact (x, y, w, h) for all keys
function generateLayout() {
  const rowDefs = [
    // Row 0 (15U, 14 keys)
    {
      y: ROW_START_Y,
      keys: [
        { id: '`', top: '~', bot: '`', u: 1.0 },
        { id: '1', top: '!', bot: '1', u: 1.0 },
        { id: '2', top: '@', bot: '2', u: 1.0 },
        { id: '3', top: '#', bot: '3', u: 1.0 },
        { id: '4', top: '$', bot: '4', u: 1.0 },
        { id: '5', top: '%', bot: '5', u: 1.0 },
        { id: '6', top: '^', bot: '6', u: 1.0 },
        { id: '7', top: '&', bot: '7', u: 1.0 },
        { id: '8', top: '*', bot: '8', u: 1.0 },
        { id: '9', top: '(', bot: '9', u: 1.0 },
        { id: '0', top: ')', bot: '0', u: 1.0 },
        { id: '-', top: '_', bot: '-', u: 1.0 },
        { id: '=', top: '+', bot: '=', u: 1.0 },
        { id: 'backspace', label: 'backspace', u: 2.0, isSpecial: true },
      ],
    },
    // Row 1 (15U, 14 keys)
    {
      y: ROW_START_Y + (ROW_HEIGHT + ROW_GAP),
      keys: [
        { id: 'tab', label: 'tab', u: 1.5, isSpecial: true },
        { id: 'q', label: 'q', u: 1.0 },
        { id: 'w', label: 'w', u: 1.0 },
        { id: 'e', label: 'e', u: 1.0 },
        { id: 'r', label: 'r', u: 1.0 },
        { id: 't', label: 't', u: 1.0 },
        { id: 'y', label: 'y', u: 1.0 },
        { id: 'u', label: 'u', u: 1.0 },
        { id: 'i', label: 'i', u: 1.0 },
        { id: 'o', label: 'o', u: 1.0 },
        { id: 'p', label: 'p', u: 1.0 },
        { id: '[', top: '{', bot: '[', u: 1.0 },
        { id: ']', top: '}', bot: ']', u: 1.0 },
        { id: '\\', top: '|', bot: '\\', u: 1.5 },
      ],
    },
    // Row 2 (15U, 13 keys)
    {
      y: ROW_START_Y + 2 * (ROW_HEIGHT + ROW_GAP),
      keys: [
        { id: 'caps', label: 'caps lock', u: 1.75, isSpecial: true },
        { id: 'a', label: 'a', u: 1.0, isHome: true },
        { id: 's', label: 's', u: 1.0, isHome: true },
        { id: 'd', label: 'd', u: 1.0, isHome: true },
        { id: 'f', label: 'f', u: 1.0, isHome: true, hasBump: true },
        { id: 'g', label: 'g', u: 1.0 },
        { id: 'h', label: 'h', u: 1.0 },
        { id: 'j', label: 'j', u: 1.0, isHome: true, hasBump: true },
        { id: 'k', label: 'k', u: 1.0, isHome: true },
        { id: 'l', label: 'l', u: 1.0, isHome: true },
        { id: ';', top: ':', bot: ';', u: 1.0, isHome: true },
        { id: "'", top: '"', bot: "'", u: 1.0 },
        { id: 'enter', label: 'enter', u: 2.25, isSpecial: true },
      ],
    },
    // Row 3 (15U, 12 keys)
    {
      y: ROW_START_Y + 3 * (ROW_HEIGHT + ROW_GAP),
      keys: [
        { id: 'shift-left', label: 'shift', u: 2.25, isSpecial: true },
        { id: 'z', label: 'z', u: 1.0 },
        { id: 'x', label: 'x', u: 1.0 },
        { id: 'c', label: 'c', u: 1.0 },
        { id: 'v', label: 'v', u: 1.0 },
        { id: 'b', label: 'b', u: 1.0 },
        { id: 'n', label: 'n', u: 1.0 },
        { id: 'm', label: 'm', u: 1.0 },
        { id: ',', top: '<', bot: ',', u: 1.0 },
        { id: '.', top: '>', bot: '.', u: 1.0 },
        { id: '/', top: '?', bot: '/', u: 1.0 },
        { id: 'shift-right', label: 'shift', u: 2.75, isSpecial: true },
      ],
    },
    // Row 4 (15U, 5 keys)
    {
      y: ROW_START_Y + 4 * (ROW_HEIGHT + ROW_GAP),
      keys: [
        { id: 'control-left', label: 'control', u: 1.75, isSpecial: true },
        { id: 'option-left', label: 'option', u: 1.5, isSpecial: true },
        { id: 'space', label: 'space', u: 8.5, isSpecial: true },
        { id: 'option-right', label: 'option', u: 1.5, isSpecial: true },
        { id: 'control-right', label: 'control', u: 1.75, isSpecial: true },
      ],
    },
  ];

  const allKeys = [];
  rowDefs.forEach((r) => {
    let currentX = 20; // 20px left margin in 900px width
    r.keys.forEach((k) => {
      const w = computeKeyWidth(k.u);
      allKeys.push({
        ...k,
        x: currentX,
        y: r.y,
        w,
        h: ROW_HEIGHT,
        cx: currentX + w / 2,
        cy: r.y + ROW_HEIGHT / 2,
      });
      currentX += w + KEY_GAP;
    });
  });

  return allKeys;
}

export const CALIBRATED_KEYS = generateLayout();

export function KeyboardGuide({
  targetChar,
  isVisible = true,
  handGuideVisible = true,
  children,
}) {
  // Determine target key and shift requirement
  const { targetKeyId, needsShift } = useMemo(() => {
    if (!targetChar) return { targetKeyId: null, needsShift: false };
    if (targetChar === ' ') return { targetKeyId: 'space', needsShift: false };

    if (SHIFT_MAP[targetChar]) {
      return { targetKeyId: SHIFT_MAP[targetChar], needsShift: true };
    }

    if (targetChar >= 'A' && targetChar <= 'Z') {
      return { targetKeyId: targetChar.toLowerCase(), needsShift: true };
    }

    return { targetKeyId: targetChar.toLowerCase(), needsShift: false };
  }, [targetChar]);

  if (!isVisible && !handGuideVisible) return null;

  return (
    <div
      className="relative w-full max-w-[780px] mx-auto select-none transition-all duration-200"
      role="img"
      aria-label={`Virtual keyboard, target key: ${targetChar || 'none'}`}
    >
      <svg
        viewBox="0 0 900 350"
        className="w-full h-auto block overflow-visible"
        style={{
          filter: 'drop-shadow(0 20px 50px rgba(0, 0, 0, 0.5))',
        }}
      >
        <defs>
          {/* Active Key Cyan Glow */}
          <filter id="activeKeyGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Outer Chassis Linear Gradient */}
          <linearGradient id="chassisGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0c1322" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#070b14" stopOpacity="0.95" />
          </linearGradient>

          {/* Key Normal Gradient */}
          <linearGradient id="keyNormGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#141c2e" />
            <stop offset="100%" stopColor="#0c1322" />
          </linearGradient>

          {/* Active Key Vibrant Cyan Gradient */}
          <linearGradient id="keyActiveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>

        {/* ── KEYBOARD CHASSIS BACKGROUND ─────────────────────────── */}
        {isVisible && (
          <rect
            x="8"
            y="6"
            width="884"
            height="278"
            rx="18"
            ry="18"
            fill="url(#chassisGrad)"
            stroke="var(--border, #1e293b)"
            strokeWidth="1.2"
          />
        )}

        {/* ── KEYCAPS ─────────────────────────────────────────────── */}
        {isVisible &&
          CALIBRATED_KEYS.map((k) => {
            const isTarget = k.id === targetKeyId;
            const isShiftActive =
              (k.id === 'shift-left' || k.id === 'shift-right') && needsShift;
            const isActive = isTarget || isShiftActive;

            return (
              <g key={k.id} className="transition-all duration-100">
                {/* Keycap rectangle */}
                <rect
                  x={k.x}
                  y={k.y}
                  width={k.w}
                  height={k.h}
                  rx="7"
                  ry="7"
                  fill={isActive ? 'url(#keyActiveGrad)' : 'url(#keyNormGrad)'}
                  stroke={isActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)'}
                  strokeWidth={isActive ? '1.5' : '1'}
                  filter={isActive ? 'url(#activeKeyGlow)' : 'none'}
                />

                {/* Keycap Dual Glyphs */}
                {k.top && k.bot ? (
                  <g textAnchor="middle" className="select-none pointer-events-none">
                    {/* Shift character (top) */}
                    <text
                      x={k.cx}
                      y={k.y + 16}
                      fill={isActive ? 'rgba(255,255,255,0.85)' : '#64748b'}
                      fontSize="11"
                      fontFamily="Inter, ui-monospace, monospace"
                      fontWeight="500"
                    >
                      {k.top}
                    </text>
                    {/* Base character (bottom) */}
                    <text
                      x={k.cx}
                      y={k.y + 34}
                      fill={isActive ? '#ffffff' : '#cbd5e1'}
                      fontSize="14"
                      fontFamily="Inter, ui-monospace, monospace"
                      fontWeight={isActive ? '700' : '500'}
                    >
                      {k.bot}
                    </text>
                  </g>
                ) : (
                  /* Single Label Key */
                  <text
                    x={k.cx}
                    y={k.cy + (k.isSpecial ? 4 : 5)}
                    textAnchor="middle"
                    fill={
                      isActive
                        ? '#ffffff'
                        : k.isSpecial
                        ? '#64748b'
                        : '#cbd5e1'
                    }
                    fontSize={k.isSpecial ? '12' : '15'}
                    fontFamily="Inter, ui-monospace, monospace"
                    fontWeight={isActive ? '700' : '500'}
                    className="select-none pointer-events-none"
                  >
                    {k.label}
                  </text>
                )}

                {/* Tactile home bumps on 'F' and 'J' */}
                {k.hasBump && (
                  <rect
                    x={k.cx - 8}
                    y={k.y + k.h - 6}
                    width="16"
                    height="2"
                    rx="1"
                    fill={isActive ? 'rgba(255,255,255,0.85)' : '#64748b'}
                  />
                )}
              </g>
            );
          })}

        {/* ── NATURAL HUMAN HAND GUIDE OVERLAY ─────────────────────── */}
        {handGuideVisible && (
          <HandGuide targetChar={targetChar} isVisible={handGuideVisible} />
        )}

        {/* Any injected children */}
        {children}
      </svg>
    </div>
  );
}
