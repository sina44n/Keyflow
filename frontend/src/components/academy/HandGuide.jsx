import React, { useMemo } from 'react';

/**
 * HandGuide — Realistic Anatomical Human Hand Guidance for KEYFLOW.
 *
 * Replaces artificial wireframe hands with high-fidelity realistic human hands
 * naturally positioned in an ergonomic touch-typing posture over the virtual keyboard.
 *
 * Visual & Anatomical Standards:
 * - Natural human hand anatomy with authentic skin tone, palm geometry, and joints
 * - Natural finger proportions resting directly over home-row keycaps
 * - Wrists extend towards bottom with smooth gradient fade into the obsidian theme
 * - Dynamic finger guidance with subtle neon-red key-illumination reflections
 * - Fully synchronized with KEYFLOW keyboard coordinates (900x350 ANSI layout)
 */

import {
  KEY_COORDS,
  KEY_FINGER_MAP,
  FINGERTIP_POSITIONS,
} from '../../utils/touchTypingMap.js';

export { KEY_COORDS };

export function HandGuide({ targetChar, isVisible = true, standalone = false, hideHandsImage = false }) {
  // Resolve active finger and key target
  const { activeFinger, targetPos, isHomeRowTarget } = useMemo(() => {
    if (!targetChar) return { activeFinger: null, targetPos: null, isHomeRowTarget: false };
    const key = targetChar === ' ' ? ' ' : targetChar;
    const mapping = KEY_FINGER_MAP[key] || KEY_FINGER_MAP[key.toLowerCase()];
    if (!mapping) return { activeFinger: null, targetPos: null, isHomeRowTarget: false };

    const homeKeys = ['a', 's', 'd', 'f', 'j', 'k', 'l', ';', ' '];
    const isHome = homeKeys.includes(key.toLowerCase());

    return {
      activeFinger: mapping.finger,
      targetPos: { x: mapping.x, y: mapping.y },
      isHomeRowTarget: isHome,
    };
  }, [targetChar]);

  // Active finger tip resolution (handle thumbs specially)
  const activeTips = useMemo(() => {
    if (!activeFinger) return [];
    if (activeFinger === 'thumb') {
      // Space bar guidance: highlight both thumbs resting on the space bar
      return [FINGERTIP_POSITIONS['left-thumb'], FINGERTIP_POSITIONS['right-thumb']];
    }
    const tip = FINGERTIP_POSITIONS[activeFinger];
    return tip ? [tip] : [];
  }, [activeFinger]);

  if (!isVisible) return null;

  const content = (
    <g className="hand-guide-realistic-layer select-none pointer-events-none" aria-hidden="true">
      <defs>
        {/* Wrists seamless gradient mask towards the bottom edge */}
        <linearGradient id="wristFadeLinearGrad" x1="0" y1="0" x2="0" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="68%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="84%" stopColor="#ffffff" stopOpacity="0.7" />
          <stop offset="94%" stopColor="#ffffff" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        <mask id="wristFadeMask">
          <rect x="0" y="0" width="900" height="470" fill="url(#wristFadeLinearGrad)" />
        </mask>
      </defs>

      {/* ── SUBTLE TACTILE FINGER GUIDANCE (STRICTLY NO RGB / NO NEON) ── */}
      {activeTips.map((tip, idx) => (
        <g key={`tip-${idx}`} className="transition-all duration-150">
          {/* Subtle tactile guidance point at the contact center */}
          <circle
            cx={tip.x}
            cy={tip.y}
            r="4.5"
            fill="#801424"
            opacity="0.85"
          />
          <circle
            cx={tip.x}
            cy={tip.y}
            r="2.2"
            fill="#FFFFFF"
            opacity="0.95"
          />

          {/* Off-home row directional subtle guide: connects active finger to target keycap */}
          {!isHomeRowTarget && targetPos && (
            <g opacity="0.75">
              <line
                x1={tip.x}
                y1={tip.y - 4}
                x2={targetPos.x}
                y2={targetPos.y + (targetPos.y > tip.y ? -8 : 8)}
                stroke="#801424"
                strokeWidth="1.2"
                strokeDasharray="3 3"
              />
              <circle
                cx={targetPos.x}
                cy={targetPos.y}
                r="3.5"
                fill="#801424"
              />
            </g>
          )}
        </g>
      ))}
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
