import React, { useMemo, useState, useEffect } from 'react';
import { HandGuide } from './HandGuide';
import { Hand3DGuide } from './Hand3DGuide';

/**
 * KeyboardGuide — Ultra-Realistic Redragon K617 Fizz 60% Mechanical Keyboard.
 * 
 * Recreated with photographic precision from the custom 60% mechanical reference:
 * - CNC-milled aluminum chassis with authentic 45-degree chamfered corners
 * - High-contrast Monochrome Two-Tone:
 *   • 46 Chalk White keycaps (Alphanumerics, numbers 1 to =, and 6.25u Spacebar)
 *   • 15 Matte Obsidian Black modifier keycaps (Esc, Tab, Caps, Shifts, Ctrl, Code, Alt, Fn, Backspace, Enter, \)
 * - Multi-layered 3D mechanical keycaps with realistic plastic thickness, angled skirts, and dished typing surfaces
 * - Natural ambient contact shadows and soft reflections between keys
 * - Target key highlight in rich darker red matching KEYFLOW's burgundy/crimson palette
 * - Physical mechanical switch downstroke displacement on keystroke
 * - Authentic legends and icons: Tab (⇥), Caps (⇩), Shift (⇧), Backspace (←), Enter (↵), Code (Win/Super)
 * - Molded tactile homing bars on F & J keycaps
 * - Coordinated with WebGL 3D anatomical skeletal hand rig for genuine human touch-typing kinematics
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

  // Track active pressed key with physical mechanical spring recovery
  const [activePressedKeyId, setActivePressedKeyId] = useState(null);

  useEffect(() => {
    if (!lastKeystroke) {
      setActivePressedKeyId(null);
      return;
    }
    const raw = typeof lastKeystroke === 'string' ? lastKeystroke : lastKeystroke.key;
    const resolvedId =
      raw === ' '
        ? 'space'
        : raw && SHIFT_MAP[raw]
          ? SHIFT_MAP[raw]
          : raw
            ? raw.toLowerCase()
            : null;

    if (resolvedId) {
      setActivePressedKeyId(resolvedId);
      const timer = setTimeout(() => {
        setActivePressedKeyId((curr) => (curr === resolvedId ? null : curr));
      }, 125);
      return () => clearTimeout(timer);
    }
  }, [lastKeystroke]);

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
          filter: 'drop-shadow(0 24px 60px rgba(0, 0, 0, 0.70))',
        }}
      >
        <defs>
          {/* Target Key Dark-Red Bloom (Matches KEYFLOW Burgundy/Crimson Palette) */}
          <filter id="targetKeyDarkRedBloom" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="7.5" result="blur2" />
            <feFlood floodColor="#8B001D" floodOpacity="0.60" result="redFlood" />
            <feComposite in="redFlood" in2="blur2" operator="in" result="redGlow" />
            <feMerge>
              <feMergeNode in="redGlow" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Target Key Dark-Red Dish Gradient (Rich Burgundy Crimson) */}
          <linearGradient id="targetKeyDarkRedGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#A81E32" />
            <stop offset="45%" stopColor="#851022" />
            <stop offset="100%" stopColor="#680A18" />
          </linearGradient>

          {/* CNC Aluminum Chassis Gradient (Silver-Grey Anodized Aluminum with Specular Edge) */}
          <linearGradient id="chassisAlumGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#C4CCD6" />
            <stop offset="12%" stopColor="#A8B2BF" />
            <stop offset="85%" stopColor="#87919E" />
            <stop offset="100%" stopColor="#6C7581" />
          </linearGradient>

          {/* Inner Recessed Switch Plate Cavity */}
          <linearGradient id="plateCavityGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1A202C" />
            <stop offset="100%" stopColor="#0F131A" />
          </linearGradient>

          {/* Chalk White Keycap Top Dish Gradient (Matte Plastic with Directional Studio Highlight) */}
          <linearGradient id="chalkWhiteDishGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="40%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#EEF1F5" />
          </linearGradient>

          {/* Chalk White Keycap Skirt/Wall Gradient */}
          <linearGradient id="chalkWhiteSkirtGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#CBD1DC" />
            <stop offset="100%" stopColor="#B4BAC6" />
          </linearGradient>

          {/* Matte Obsidian Black Keycap Top Dish Gradient */}
          <linearGradient id="matteBlackDishGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#323742" />
            <stop offset="45%" stopColor="#21252E" />
            <stop offset="100%" stopColor="#161920" />
          </linearGradient>

          {/* Matte Obsidian Black Keycap Skirt/Wall Gradient */}
          <linearGradient id="matteBlackSkirtGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1C2028" />
            <stop offset="100%" stopColor="#101318" />
          </linearGradient>

          {/* Ambient Contact Shadow Under Keycaps */}
          <filter id="keyContactShadow" x="-10%" y="-10%" width="120%" height="135%">
            <feDropShadow dx="0" dy="2.8" stdDeviation="1.6" floodColor="#06090F" floodOpacity="0.65" />
          </filter>

          {/* Compressed Contact Shadow Under Depressed Keycap */}
          <filter id="keyContactShadowPressed" x="-10%" y="-10%" width="120%" height="135%">
            <feDropShadow dx="0" dy="1.1" stdDeviation="0.9" floodColor="#06090F" floodOpacity="0.80" />
          </filter>
        </defs>

        {/* ── CNC ALUMINUM CHAMFERED CHASSIS (Matches Physical Reference) ── */}
        {isVisible && (
          <g className="chassis-group">
            {/* Outer Case with 45-Degree Chamfered Corners */}
            <path
              d="
                M 22 6
                L 878 6
                L 894 22
                L 894 262
                L 878 278
                L 22 278
                L 6 262
                L 6 22
                Z
              "
              fill="url(#chassisAlumGrad)"
              stroke="#CBD5E1"
              strokeWidth="1.2"
            />

            {/* Chamfered Bevel Highlight Lip */}
            <path
              d="
                M 23 8
                L 877 8
                L 892 23
                L 892 261
                L 877 276
                L 23 276
                L 8 261
                L 8 23
                Z
              "
              fill="none"
              stroke="rgba(255, 255, 255, 0.45)"
              strokeWidth="0.8"
            />

            {/* Recessed Switch Plate Cavity */}
            <path
              d="
                M 25 12
                L 875 12
                L 888 25
                L 888 259
                L 875 272
                L 25 272
                L 12 259
                L 12 25
                Z
              "
              fill="url(#plateCavityGrad)"
              stroke="#262F3D"
              strokeWidth="1"
            />

            {/* CNC Hardware Hex Bolts (Four Chamfered Corner Fasteners) */}
            {[
              { cx: 34, cy: 19 },
              { cx: 866, cy: 19 },
              { cx: 34, cy: 265 },
              { cx: 866, cy: 265 },
            ].map((bolt, bIdx) => (
              <g key={`bolt-${bIdx}`} opacity="0.60">
                <circle cx={bolt.cx} cy={bolt.cy} r="3.0" fill="#525E6F" stroke="#3A4350" strokeWidth="0.6" />
                <circle cx={bolt.cx} cy={bolt.cy} r="1.6" fill="#2E3744" />
                <circle cx={bolt.cx - 0.5} cy={bolt.cy - 0.5} r="0.7" fill="rgba(255,255,255,0.45)" />
              </g>
            ))}

            {/* Redragon K617 Fizz subtle CNC aluminum engraving */}
            <text
              x="866"
              y="288"
              textAnchor="end"
              fill="#64748B"
              fontSize="7.5"
              fontFamily="Inter, ui-monospace, monospace"
              fontWeight="700"
              letterSpacing="0.10em"
              opacity="0.70"
            >
              K617 FIZZ • 60% MECHANICAL
            </text>
          </g>
        )}

        {/* ── KEYBOARD-OFF SILHOUETTE (When Hands ON but Keyboard OFF) ── */}
        {!isVisible && handGuideVisible && (
          <path
            d="
              M 22 6
              L 878 6
              L 894 22
              L 894 262
              L 878 278
              L 22 278
              L 6 262
              L 6 22
              Z
            "
            fill="rgba(10, 14, 22, 0.45)"
            stroke="rgba(255, 23, 68, 0.20)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        )}

        {/* ── 61-KEY MECHANICAL KEYCAPS (46 Chalk White + 15 Obsidian Black) ── */}
        {isVisible &&
          CALIBRATED_KEYS.map((k) => {
            const isTarget = k.id === targetKeyId;
            const isShiftActive =
              (k.id === 'shift-left' || k.id === 'shift-right') && needsShift;
            const isPressed = k.id === activePressedKeyId;
            const isHighlighted = isTarget || isShiftActive;
            const isBlackKey = k.color === 'black';

            // Real physical mechanical switch downstroke displacement on keystroke
            const dy = isPressed ? 2.6 : (isHighlighted ? 0.6 : 0);

            // Shading and fills
            let skirtFill;
            let dishFill;
            let dishStroke;
            let textColor;
            let secondaryColor;
            let filterEffect = 'none';

            if (isHighlighted || (isPressed && isTarget)) {
              // Target key: Darker red matching KEYFLOW's burgundy palette
              skirtFill = '#520612';
              dishFill = 'url(#targetKeyDarkRedGrad)';
              dishStroke = '#BD2D44';
              textColor = '#FFFFFF';
              secondaryColor = 'rgba(255, 255, 255, 0.90)';
              filterEffect = 'url(#targetKeyDarkRedBloom)';
            } else if (isBlackKey) {
              // Matte obsidian black modifiers
              skirtFill = 'url(#matteBlackSkirtGrad)';
              dishFill = 'url(#matteBlackDishGrad)';
              dishStroke = '#3D4452';
              textColor = '#F8FAFC';
              secondaryColor = '#CBD5E1';
            } else {
              // Chalk white alphanumerics
              skirtFill = 'url(#chalkWhiteSkirtGrad)';
              dishFill = 'url(#chalkWhiteDishGrad)';
              dishStroke = '#D7DCE4';
              textColor = '#0F131A';
              secondaryColor = '#1E2530';
            }

            const strokeWidth = isHighlighted ? 1.5 : 0.8;

            return (
              <g
                key={k.id}
                className="select-none"
                style={{
                  transform: `translate3d(0, ${dy}px, 0)`,
                  transition: 'transform 80ms cubic-bezier(0.2, 0.9, 0.3, 1.25)',
                }}
              >
                {/* 3D Extruded Keycap Skirt (Side Walls & Contact Shadow) */}
                <rect
                  x={k.x}
                  y={k.y + 2.5}
                  width={k.w}
                  height={k.h}
                  rx="4.5"
                  ry="4.5"
                  fill={skirtFill}
                  filter={
                    isHighlighted
                      ? 'none'
                      : isPressed
                        ? 'url(#keyContactShadowPressed)'
                        : 'url(#keyContactShadow)'
                  }
                />

                {/* 3D Cradled Keycap Top Dish (Typing Surface) */}
                <rect
                  x={k.x + 1.2}
                  y={k.y + 0.8}
                  width={k.w - 2.4}
                  height={k.h - 4.2}
                  rx="3.5"
                  ry="3.5"
                  fill={dishFill}
                  stroke={dishStroke}
                  strokeWidth={strokeWidth}
                  filter={filterEffect}
                />

                {/* Specular edge highlight along top rim catching ambient studio light */}
                <line
                  x1={k.x + 4.5}
                  y1={k.y + 1.8}
                  x2={k.x + k.w - 4.5}
                  y2={k.y + 1.8}
                  stroke={
                    isHighlighted
                      ? 'rgba(255, 255, 255, 0.70)'
                      : isBlackKey
                        ? 'rgba(255, 255, 255, 0.20)'
                        : 'rgba(255, 255, 255, 0.85)'
                  }
                  strokeWidth="0.8"
                  strokeLinecap="round"
                />

                {/* ── KEYCAP LEGENDS (Exact Match to Physical Reference) ── */}
                {/* Case 1: Dual Glyph Keys (Numbers 1-0, -, =, [, ], ;, ', ,, ., /) */}
                {k.top && k.bot ? (
                  <g textAnchor="middle" className="select-none pointer-events-none">
                    {/* Shifted symbol (top) */}
                    <text
                      x={k.cx}
                      y={k.y + 15}
                      fill={secondaryColor}
                      fontSize="10"
                      fontFamily="Inter, ui-monospace, monospace"
                      fontWeight="700"
                    >
                      {k.top}
                    </text>

                    {/* Primary character / digit (bottom) */}
                    <text
                      x={k.cx}
                      y={k.y + 30}
                      fill={textColor}
                      fontSize="13"
                      fontFamily="Inter, ui-monospace, monospace"
                      fontWeight={isHighlighted ? '800' : '700'}
                    >
                      {k.bot}
                    </text>
                  </g>
                ) : k.id === 'space' ? (
                  /* Case 2: Clean Matte White 6.25u Spacebar */
                  <g className="select-none pointer-events-none">
                    {/* Subtle centered ergonomic tactile groove */}
                    <line
                      x1={k.cx - 24}
                      y1={k.cy + 1}
                      x2={k.cx + 24}
                      y2={k.cy + 1}
                      stroke={isHighlighted ? '#FFFFFF' : '#D1D5DB'}
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />
                  </g>
                ) : (
                  /* Case 3: Single Label Keycaps (Alphas & Modifiers) */
                  <g textAnchor="middle" className="select-none pointer-events-none">
                    <text
                      x={k.cx}
                      y={k.cy + (k.isSpecial ? 4 : 5)}
                      fill={textColor}
                      fontSize={k.u >= 2.0 ? '12' : k.isSpecial ? '11.5' : '14'}
                      fontFamily="Inter, ui-monospace, monospace"
                      fontWeight={isHighlighted ? '800' : '700'}
                    >
                      {k.label || k.id.toUpperCase()}
                    </text>
                  </g>
                )}

                {/* Tactile Homing Bars on 'F' and 'J' Keycaps (Physical 3D Molded Relief) */}
                {k.hasBump && (
                  <g>
                    <rect
                      x={k.cx - 7}
                      y={k.y + k.h - 8.0}
                      width="14"
                      height="2.2"
                      rx="1.1"
                      fill={isHighlighted ? 'rgba(0,0,0,0.30)' : 'rgba(0,0,0,0.18)'}
                    />
                    <rect
                      x={k.cx - 7}
                      y={k.y + k.h - 8.8}
                      width="14"
                      height="2.0"
                      rx="1.0"
                      fill={isHighlighted ? '#FFFFFF' : '#94A3B8'}
                    />
                  </g>
                )}
              </g>
            );
          })}

        {/* Any injected children */}
        {children}
      </svg>

      {/* ── ACTIVE FINGERTIP ILLUMINATION LAYER (UNDERNEATH 3D HAND) ── */}
      {handGuideVisible && (
        <div className="absolute inset-0 w-full h-full pointer-events-none select-none z-0">
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

      {/* ── 3D ARTICULATED REALISTIC HUMAN HAND RIG ─────────────────── */}
      {handGuideVisible && (
        <Hand3DGuide
          targetChar={targetChar}
          lastKeystroke={lastKeystroke}
          isVisible={handGuideVisible}
          spaceThumb={spaceThumb}
        />
      )}
    </div>
  );
}

export default KeyboardGuide;
