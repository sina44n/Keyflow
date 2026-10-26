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
        {/* Soft atmospheric glow for active fingertip */}
        <filter id="handFingertipGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4.5" result="blur1" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="9.0" result="blur2" />
          <feMerge>
            <feMergeNode in="blur2" />
            <feMergeNode in="blur1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Ambient spill filter */}
        <filter id="handAmbientSpill" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="14" />
        </filter>

        {/* Neon-red fingertip radial illumination */}
        <radialGradient id="fingertipNeonRedGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="25%" stopColor="#FF304F" stopOpacity="0.85" />
          <stop offset="60%" stopColor="#FF1744" stopOpacity="0.55" />
          <stop offset="85%" stopColor="#D50032" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#7F0018" stopOpacity="0" />
        </radialGradient>

        {/* Secondary warm reflection gradient */}
        <radialGradient id="fingertipWarmSpill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FF1744" stopOpacity="0.45" />
          <stop offset="70%" stopColor="#7F0018" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>

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

      {/* ── PHOTOREALISTIC HUMAN HANDS ASSET ───────────────────────── */}
      {/* Positioned accurately over home row with natural wrist extension */}
      {!hideHandsImage && (
        <g mask="url(#wristFadeMask)">
          <image
            href="/realistic_hands_both.png"
            x="64"
            y="96"
            width="750"
            height="364"
            preserveAspectRatio="none"
            style={{
              filter: 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.75))',
              pointerEvents: 'none',
            }}
          />
        </g>
      )}

      {/* ── DYNAMIC FINGER GUIDANCE: AMBIENT RED KEY REFLECTION ──────── */}
      {/* Lights up the active finger subtly with authentic neon-red glow */}
      {activeTips.map((tip, idx) => (
        <g key={`tip-${idx}`} className="transition-all duration-150">
          {/* Broad atmospheric red aura spilling onto surrounding skin */}
          <ellipse
            cx={tip.x}
            cy={tip.y}
            rx="32"
            ry="26"
            fill="url(#fingertipWarmSpill)"
            filter="url(#handAmbientSpill)"
            opacity="0.75"
          />

          {/* Focused red illumination at the fingertip contact point */}
          <ellipse
            cx={tip.x}
            cy={tip.y}
            rx="16"
            ry="13"
            fill="url(#fingertipNeonRedGlow)"
            filter="url(#handFingertipGlow)"
            opacity="0.9"
            style={{ mixBlendMode: 'screen' }}
          />

          {/* Specular contact pinpoint */}
          <circle
            cx={tip.x}
            cy={tip.y - 1}
            r="3"
            fill="#FFFFFF"
            opacity="0.8"
            filter="url(#handFingertipGlow)"
          />

          {/* Off-home row directional beacon ray: points finger to off-home key */}
          {!isHomeRowTarget && targetPos && (
            <g opacity="0.85">
              {/* Subtle dashed guide line connecting finger to target keycap */}
              <line
                x1={tip.x}
                y1={tip.y - 4}
                x2={targetPos.x}
                y2={targetPos.y + (targetPos.y > tip.y ? -10 : 10)}
                stroke="#FF304F"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                strokeOpacity="0.65"
                filter="url(#handFingertipGlow)"
              />
              {/* Target key pulse halo */}
              <circle
                cx={targetPos.x}
                cy={targetPos.y}
                r="18"
                fill="none"
                stroke="#FF1744"
                strokeWidth="1.2"
                strokeDasharray="2 2"
                strokeOpacity="0.7"
                filter="url(#handFingertipGlow)"
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
