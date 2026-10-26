import React, { useMemo } from 'react';
import { HandGuide } from './HandGuide';
import { Hand3DGuide } from './Hand3DGuide';

/**
 * KeyboardGuide — Precision-Engineered ANSI 60% Virtual Keyboard.
 * 
 * Symmetrical 15.0 Unit calibration across all 5 rows (ViewBox: 0 0 900 350).
 * Every row matches exactly 860.0px total width with zero gap disparity:
 * - Key Area: x = 20 to 880 (centered at x = 450.0)
 * - Symmetrical 12px chassis padding on both left and right (chassis: x = 8 to 892)
 * Features dual glyphs, tactile bumps on F & J, and signature KEYFLOW neon-red key glow.
 * Integrates realistic articulated human hands naturally positioned over the keys.
 */

import {
  SHIFT_MAP,
  CALIBRATED_KEYS,
} from '../../utils/touchTypingMap.js';

export { SHIFT_MAP, CALIBRATED_KEYS };

export function KeyboardGuide({
  targetChar,
  lastKeystroke,
  isVisible = true,
  handGuideVisible = true,
  spaceThumb = 'right-thumb',
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

  // If both keyboard and hand guide are disabled, render nothing
  if (!isVisible && !handGuideVisible) return null;

  return (
    <div
      className="relative w-full min-w-0 max-w-[820px] mx-auto select-none transition-all duration-200"
      role="img"
      aria-label={`Virtual keyboard, target key: ${targetChar || 'none'}`}
    >
      <svg
        viewBox="0 0 900 350"
        className="w-full h-auto block overflow-visible"
        style={{
          filter: 'drop-shadow(0 20px 50px rgba(0, 0, 0, 0.6))',
        }}
      >
        <defs>
          {/* Active Key Neon-Red Bloom */}
          <filter id="activeKeyRedBloom" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4.5" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur2" />
            <feFlood floodColor="#FF1744" floodOpacity="0.65" result="redFlood" />
            <feComposite in="redFlood" in2="blur2" operator="in" result="redGlow" />
            <feMerge>
              <feMergeNode in="redGlow" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Outer Chassis Linear Gradient */}
          <linearGradient id="chassisGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0F1420" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#07090F" stopOpacity="0.98" />
          </linearGradient>

          {/* Key Normal Gradient */}
          <linearGradient id="keyNormGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#151C2B" />
            <stop offset="100%" stopColor="#0B1019" />
          </linearGradient>

          {/* Active Key Signature Neon-Red Gradient (Matches Reference Image 2) */}
          <linearGradient id="keyActiveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF304F" />
            <stop offset="100%" stopColor="#D50032" />
          </linearGradient>
        </defs>

        {/* ── KEYBOARD CHASSIS BACKGROUND (Symmetrical 12px padding: x=8 to 892) ── */}
        {isVisible && (
          <rect
            x="8"
            y="6"
            width="884"
            height="278"
            rx="18"
            ry="18"
            fill="url(#chassisGrad)"
            stroke="var(--border, #222B38)"
            strokeWidth="1.2"
          />
        )}

        {/* ── KEYBOARD-OFF DESK MAT SILHOUETTE (When Hands ON but Keyboard OFF) ── */}
        {!isVisible && handGuideVisible && (
          <rect
            x="8"
            y="6"
            width="884"
            height="278"
            rx="18"
            ry="18"
            fill="rgba(10, 14, 22, 0.45)"
            stroke="rgba(255, 23, 68, 0.15)"
            strokeWidth="1"
            strokeDasharray="4 4"
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
                  stroke={isActive ? '#FF6B8B' : 'rgba(255, 255, 255, 0.08)'}
                  strokeWidth={isActive ? '1.8' : '1'}
                  filter={isActive ? 'url(#activeKeyRedBloom)' : 'none'}
                />

                {/* Keycap Dual Glyphs */}
                {k.top && k.bot ? (
                  <g textAnchor="middle" className="select-none pointer-events-none">
                    {/* Shift character (top) */}
                    <text
                      x={k.cx}
                      y={k.y + 16}
                      fill={isActive ? 'rgba(255,255,255,0.9)' : '#64748b'}
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
                    fill={isActive ? 'rgba(255,255,255,0.9)' : '#64748b'}
                  />
                )}
              </g>
            );
          })}

        {/* Any injected children */}
        {children}
      </svg>

      {/* ── 3D ARTICULATED REALISTIC HUMAN HAND RIG ─────────────────── */}
      {handGuideVisible && (
        <Hand3DGuide
          targetChar={targetChar}
          lastKeystroke={lastKeystroke}
          isVisible={handGuideVisible}
          spaceThumb={spaceThumb}
        />
      )}

      {/* ── ACTIVE FINGERTIP NEON-RED ILLUMINATION OVERLAY ─────────── */}
      {handGuideVisible && (
        <div className="absolute inset-0 w-full h-full pointer-events-none select-none z-20">
          <svg
            viewBox="0 0 900 350"
            className="w-full h-auto block overflow-visible"
          >
            <HandGuide
              targetChar={targetChar}
              isVisible={handGuideVisible}
              hideHandsImage={true}
            />
          </svg>
        </div>
      )}
    </div>
  );
}

export default KeyboardGuide;
