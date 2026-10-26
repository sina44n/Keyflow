import React from 'react';

/**
 * LessonIllustration
 * =========================================================================
 * 20 distinct, high-polish, custom vector illustrations.
 * Cybernetic red-and-black identity (Reference B) with the playful, rich
 * visual variety of Reference A (keycaps, video screen, chronometers, bot mascot,
 * speed gauges, reticles, crest shields).
 */

export const LessonIllustration = ({ lessonIndex = 1, className = "w-24 h-20" }) => {
  const index = ((lessonIndex - 1) % 20) + 1;

  switch (index) {
    case 1:
      // Lesson 1: Introduction to Home Row — Cybernetic Video Screen / Tutorial HUD
      return (
        <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <defs>
            <linearGradient id="vidGrad" x1="0" y1="0" x2="120" y2="90" gradientUnits="userSpaceOnUse">
              <stop stopColor="#182232" />
              <stop offset="1" stopColor="#0B1018" />
            </linearGradient>
            <linearGradient id="glowRed" x1="50" y1="35" x2="70" y2="55" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FF304F" />
              <stop offset="1" stopColor="#FF1744" />
            </linearGradient>
            <filter id="redNeon" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#FF1744" floodOpacity="0.7" />
            </filter>
          </defs>
          {/* Glass Monitor Frame */}
          <rect x="15" y="14" width="90" height="62" rx="10" fill="url(#vidGrad)" stroke="#222B38" strokeWidth="2" />
          <rect x="20" y="19" width="80" height="52" rx="6" fill="#07090D" stroke="#16202E" strokeWidth="1" />
          
          {/* Ambient Grid Lines inside display */}
          <line x1="20" y1="35" x2="100" y2="35" stroke="#151D28" strokeWidth="0.8" strokeDasharray="3 3" />
          <line x1="20" y1="52" x2="100" y2="52" stroke="#151D28" strokeWidth="0.8" strokeDasharray="3 3" />
          
          {/* Waveform / telemetry audio line at bottom */}
          <path d="M25 64 L34 64 L38 58 L42 66 L47 62 L52 64 L95 64" stroke="#FF1744" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
          
          {/* Glowing Play Triangle Button */}
          <circle cx="60" cy="44" r="16" fill="#141B26" stroke="#FF1744" strokeWidth="1.5" filter="url(#redNeon)" />
          <polygon points="56,36 68,44 56,52" fill="url(#glowRed)" />
          
          {/* Corner HUD ticks */}
          <path d="M23 27 V23 H27" stroke="#FF1744" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M97 27 V23 H93" stroke="#FF1744" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="60" cy="16.5" r="1.5" fill="#FF1744" />
        </svg>
      );

    case 2:
      // Lesson 2: A S D F Keys — Left Hand Cluster
      return (
        <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <defs>
            <linearGradient id="keyTop" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#1E2838" />
              <stop offset="1" stopColor="#101724" />
            </linearGradient>
          </defs>
          {/* Base plate */}
          <rect x="12" y="24" width="96" height="42" rx="8" fill="#080C12" stroke="#222B38" strokeWidth="1.5" />
          {/* Key A */}
          <g transform="translate(18, 29)">
            <rect width="18" height="20" rx="4" fill="url(#keyTop)" stroke="#2F3B4D" strokeWidth="1" />
            <text x="9" y="14" fill="#A6B0C0" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">A</text>
          </g>
          {/* Key S */}
          <g transform="translate(40, 29)">
            <rect width="18" height="20" rx="4" fill="url(#keyTop)" stroke="#2F3B4D" strokeWidth="1" />
            <text x="9" y="14" fill="#A6B0C0" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">S</text>
          </g>
          {/* Key D */}
          <g transform="translate(62, 29)">
            <rect width="18" height="20" rx="4" fill="url(#keyTop)" stroke="#2F3B4D" strokeWidth="1" />
            <text x="9" y="14" fill="#A6B0C0" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">D</text>
          </g>
          {/* Key F (Glowing Home Key) */}
          <g transform="translate(84, 29)">
            <rect width="18" height="20" rx="4" fill="#1C1016" stroke="#FF1744" strokeWidth="1.5" />
            <text x="9" y="14" fill="#FF1744" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">F</text>
            {/* Tactile bump */}
            <line x1="6" y1="17" x2="12" y2="17" stroke="#FF1744" strokeWidth="1.5" strokeLinecap="round" />
          </g>
          {/* Connection Trace */}
          <path d="M20 72 H100" stroke="#FF1744" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4" />
        </svg>
      );

    case 3:
      // Lesson 3: J K L ; Keys — Right Hand Cluster (J Glowing)
      return (
        <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <defs>
            <linearGradient id="keyTopJ" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#1E2838" />
              <stop offset="1" stopColor="#101724" />
            </linearGradient>
          </defs>
          <rect x="12" y="24" width="96" height="42" rx="8" fill="#080C12" stroke="#222B38" strokeWidth="1.5" />
          {/* Key J (Glowing Home Key) */}
          <g transform="translate(18, 29)">
            <rect width="18" height="20" rx="4" fill="#1C1016" stroke="#FF1744" strokeWidth="1.5" />
            <text x="9" y="14" fill="#FF1744" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">J</text>
            <line x1="6" y1="17" x2="12" y2="17" stroke="#FF1744" strokeWidth="1.5" strokeLinecap="round" />
          </g>
          {/* Key K */}
          <g transform="translate(40, 29)">
            <rect width="18" height="20" rx="4" fill="url(#keyTopJ)" stroke="#2F3B4D" strokeWidth="1" />
            <text x="9" y="14" fill="#A6B0C0" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">K</text>
          </g>
          {/* Key L */}
          <g transform="translate(62, 29)">
            <rect width="18" height="20" rx="4" fill="url(#keyTopJ)" stroke="#2F3B4D" strokeWidth="1" />
            <text x="9" y="14" fill="#A6B0C0" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">L</text>
          </g>
          {/* Key ; */}
          <g transform="translate(84, 29)">
            <rect width="18" height="20" rx="4" fill="url(#keyTopJ)" stroke="#2F3B4D" strokeWidth="1" />
            <text x="9" y="14" fill="#A6B0C0" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">;</text>
          </g>
          <circle cx="27" cy="74" r="2" fill="#FF1744" />
          <line x1="29" y1="74" x2="95" y2="74" stroke="#222B38" strokeWidth="1" />
        </svg>
      );

    case 4:
      // Lesson 4: Space Bar — Wide Mechanical Key with Thumb Touchpoints
      return (
        <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <rect x="15" y="28" width="90" height="34" rx="8" fill="#0C111A" stroke="#222B38" strokeWidth="1.5" />
          {/* 3D Keycap bevel */}
          <path d="M22 34 H98 L92 54 H28 Z" fill="#151E2B" stroke="#2F3C4F" strokeWidth="1" />
          {/* Spacebar Label */}
          <text x="60" y="47" fill="#F5F7FA" fontSize="8" fontFamily="monospace" letterSpacing="3" fontWeight="bold" textAnchor="middle">SPACE</text>
          {/* Dual Thumb Guides */}
          <circle cx="45" cy="51" r="2.5" fill="#FF1744" opacity="0.8" />
          <circle cx="75" cy="51" r="2.5" fill="#FF1744" opacity="0.8" />
          {/* Neon Underglow bar */}
          <rect x="30" y="66" width="60" height="2" rx="1" fill="#FF1744" opacity="0.7" />
        </svg>
      );

    case 5:
      // Lesson 5: Home Row Practice — Dual 3D Homing Keys 'F' & 'J' with energy link
      return (
        <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <defs>
            <linearGradient id="capGrad" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#253245" />
              <stop offset="1" stopColor="#121824" />
            </linearGradient>
          </defs>
          {/* Key F */}
          <g transform="translate(22, 20)">
            <rect width="32" height="36" rx="6" fill="url(#capGrad)" stroke="#FF1744" strokeWidth="1.5" />
            <text x="16" y="24" fill="#FFFFFF" fontSize="16" fontFamily="monospace" fontWeight="900" textAnchor="middle">F</text>
            <line x1="11" y1="29" x2="21" y2="29" stroke="#FF1744" strokeWidth="2" strokeLinecap="round" />
          </g>
          {/* Key J */}
          <g transform="translate(66, 20)">
            <rect width="32" height="36" rx="6" fill="url(#capGrad)" stroke="#FF1744" strokeWidth="1.5" />
            <text x="16" y="24" fill="#FFFFFF" fontSize="16" fontFamily="monospace" fontWeight="900" textAnchor="middle">J</text>
            <line x1="11" y1="29" x2="21" y2="29" stroke="#FF1744" strokeWidth="2" strokeLinecap="round" />
          </g>
          {/* Energy Circuit connecting F & J */}
          <path d="M54 38 L66 38" stroke="#FF1744" strokeWidth="2" strokeDasharray="2 2" />
          <circle cx="60" cy="38" r="3" fill="#FF1744" />
          <text x="60" y="72" fill="#A6B0C0" fontSize="8" fontFamily="monospace" textAnchor="middle">INDEX ANCHORS</text>
        </svg>
      );

    case 6:
      // Lesson 6: Finger Position — Hand resting & tactile placement posture
      return (
        <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <rect x="20" y="45" width="80" height="28" rx="6" fill="#0C121A" stroke="#222B38" strokeWidth="1.5" />
          {/* Keys outline */}
          <line x1="36" y1="45" x2="36" y2="73" stroke="#1D2634" />
          <line x1="52" y1="45" x2="52" y2="73" stroke="#1D2634" />
          <line x1="68" y1="45" x2="68" y2="73" stroke="#1D2634" />
          <line x1="84" y1="45" x2="84" y2="73" stroke="#1D2634" />
          {/* Finger guide rays */}
          <path d="M30 18 Q30 35 30 46" stroke="#6F7B8D" strokeWidth="2" strokeLinecap="round" />
          <path d="M46 14 Q46 32 46 46" stroke="#6F7B8D" strokeWidth="2" strokeLinecap="round" />
          <path d="M60 12 Q60 30 60 46" stroke="#FF1744" strokeWidth="2" strokeLinecap="round" />
          <path d="M74 15 Q74 32 74 46" stroke="#6F7B8D" strokeWidth="2" strokeLinecap="round" />
          <circle cx="60" cy="46" r="3" fill="#FF1744" />
          <circle cx="30" cy="46" r="2" fill="#6F7B8D" />
          <circle cx="46" cy="46" r="2" fill="#6F7B8D" />
          <circle cx="74" cy="46" r="2" fill="#6F7B8D" />
          <text x="60" y="83" fill="#FF1744" fontSize="8" fontFamily="monospace" textAnchor="middle">ALIGNMENT</text>
        </svg>
      );

    case 7:
      // Lesson 7: Typing the Basics — Holographic Precision Stopwatch
      return (
        <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          {/* Outer Ring */}
          <circle cx="60" cy="45" r="28" stroke="#222B38" strokeWidth="2" fill="#0A0E15" />
          <circle cx="60" cy="45" r="24" stroke="#192230" strokeWidth="1" strokeDasharray="3 2" />
          <circle cx="60" cy="45" r="20" stroke="#FF1744" strokeWidth="1.5" strokeDasharray="70 40" strokeLinecap="round" />
          {/* Dial Center */}
          <circle cx="60" cy="45" r="3" fill="#FF1744" />
          {/* Hands */}
          <line x1="60" y1="45" x2="60" y2="30" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="60" y1="45" x2="72" y2="45" stroke="#FF1744" strokeWidth="1.5" strokeLinecap="round" />
          {/* Top Pusher */}
          <rect x="57" y="12" width="6" height="5" rx="1.5" fill="#FF1744" />
          <line x1="60" y1="17" x2="60" y2="19" stroke="#FF1744" strokeWidth="2" />
          {/* Side ticks */}
          <circle cx="60" cy="22" r="1.5" fill="#FF1744" />
          <circle cx="83" cy="45" r="1.5" fill="#6F7B8D" />
          <circle cx="60" cy="68" r="1.5" fill="#6F7B8D" />
          <circle cx="37" cy="45" r="1.5" fill="#6F7B8D" />
        </svg>
      );

    case 8:
      // Lesson 8: Speed Drills — Friendly Cybernetic Bot Mascot
      return (
        <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          {/* Bot Head Chassis */}
          <rect x="36" y="20" width="48" height="40" rx="10" fill="#101724" stroke="#2F3C4F" strokeWidth="2" />
          {/* Visor Screen */}
          <rect x="42" y="28" width="36" height="18" rx="6" fill="#05070A" stroke="#FF1744" strokeWidth="1.2" />
          {/* Glowing Eyes inside visor */}
          <circle cx="53" cy="37" r="3.5" fill="#FF1744" />
          <circle cx="67" cy="37" r="3.5" fill="#FF1744" />
          <circle cx="54" cy="36" r="1" fill="#FFFFFF" />
          <circle cx="68" cy="36" r="1" fill="#FFFFFF" />
          {/* Antenna */}
          <line x1="60" y1="20" x2="60" y2="12" stroke="#FF1744" strokeWidth="2" strokeLinecap="round" />
          <circle cx="60" cy="11" r="3" fill="#FF1744" />
          {/* Smile / Key mouth */}
          <path d="M53 52 Q60 56 67 52" stroke="#A6B0C0" strokeWidth="1.5" strokeLinecap="round" />
          {/* Keyboard pedestal */}
          <rect x="28" y="64" width="64" height="12" rx="3" fill="#151D2A" stroke="#222B38" />
          <line x1="42" y1="70" x2="48" y2="70" stroke="#FF1744" strokeWidth="1.5" />
          <line x1="56" y1="70" x2="64" y2="70" stroke="#A6B0C0" strokeWidth="1.5" />
          <line x1="72" y1="70" x2="78" y2="70" stroke="#FF1744" strokeWidth="1.5" />
        </svg>
      );

    case 9:
      // Lesson 9: Accuracy Drills — Sniper Target Reticle & Bullseye
      return (
        <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <circle cx="60" cy="45" r="32" stroke="#222B38" strokeWidth="1.5" fill="#0A0E15" />
          <circle cx="60" cy="45" r="22" stroke="#FF1744" strokeWidth="1.2" strokeDasharray="4 3" opacity="0.6" />
          <circle cx="60" cy="45" r="12" stroke="#FF1744" strokeWidth="1.5" />
          <circle cx="60" cy="45" r="3" fill="#FF1744" />
          {/* Crosshairs */}
          <line x1="60" y1="8" x2="60" y2="30" stroke="#FF1744" strokeWidth="2" strokeLinecap="round" />
          <line x1="60" y1="60" x2="60" y2="82" stroke="#FF1744" strokeWidth="2" strokeLinecap="round" />
          <line x1="23" y1="45" x2="45" y2="45" stroke="#FF1744" strokeWidth="2" strokeLinecap="round" />
          <line x1="75" y1="45" x2="97" y2="45" stroke="#FF1744" strokeWidth="2" strokeLinecap="round" />
          {/* Compass corners */}
          <path d="M40 25 H35 V30" stroke="#A6B0C0" strokeWidth="1" />
          <path d="M80 25 H85 V30" stroke="#A6B0C0" strokeWidth="1" />
          <path d="M40 65 H35 V60" stroke="#A6B0C0" strokeWidth="1" />
          <path d="M80 65 H85 V60" stroke="#A6B0C0" strokeWidth="1" />
        </svg>
      );

    case 10:
      // Lesson 10: Mixed Characters — Dual Isometric Metallic Keycaps 'D' and 'K'
      return (
        <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          {/* Key D */}
          <g transform="translate(24, 22)">
            <polygon points="12,0 36,0 28,26 4,26" fill="#1C2638" stroke="#3A495E" strokeWidth="1.2" />
            <polygon points="4,26 28,26 28,34 4,34" fill="#101724" stroke="#253245" strokeWidth="1" />
            <text x="20" y="18" fill="#F5F7FA" fontSize="13" fontFamily="monospace" fontWeight="bold">D</text>
          </g>
          {/* Key K */}
          <g transform="translate(62, 22)">
            <polygon points="12,0 36,0 28,26 4,26" fill="#1C2638" stroke="#FF1744" strokeWidth="1.2" />
            <polygon points="4,26 28,26 28,34 4,34" fill="#101724" stroke="#253245" strokeWidth="1" />
            <text x="20" y="18" fill="#FF1744" fontSize="13" fontFamily="monospace" fontWeight="bold">K</text>
          </g>
          {/* Connecting Circuit */}
          <path d="M30 65 L60 65 L70 56 L90 56" stroke="#FF1744" strokeWidth="1.5" strokeDasharray="3 2" />
          <circle cx="30" cy="65" r="2.5" fill="#FF1744" />
          <circle cx="90" cy="56" r="2.5" fill="#FF1744" />
        </svg>
      );

    case 11:
      // Lesson 11: Word Practice — Dual Keycaps 'S' & 'L' with flowing data ribbon
      return (
        <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <rect x="22" y="24" width="32" height="34" rx="6" fill="#131C2A" stroke="#2F3E54" strokeWidth="1.5" />
          <text x="38" y="46" fill="#FFFFFF" fontSize="15" fontFamily="monospace" fontWeight="bold" textAnchor="middle">S</text>
          
          <rect x="66" y="24" width="32" height="34" rx="6" fill="#131C2A" stroke="#FF1744" strokeWidth="1.5" />
          <text x="82" y="46" fill="#FF1744" fontSize="15" fontFamily="monospace" fontWeight="bold" textAnchor="middle">L</text>
          
          {/* Data Ribbon stream beneath */}
          <path d="M15 72 C35 64, 45 78, 65 72 C80 66, 95 76, 105 70" stroke="#FF1744" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <circle cx="65" cy="72" r="3" fill="#FF1744" />
        </svg>
      );

    case 12:
      // Lesson 12: Sentence Practice — Dual Keycaps 'A' & ';' with Cadence Wave
      return (
        <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <rect x="24" y="22" width="30" height="32" rx="6" fill="#111824" stroke="#2B394E" strokeWidth="1.5" />
          <text x="39" y="43" fill="#A6B0C0" fontSize="14" fontFamily="monospace" fontWeight="bold" textAnchor="middle">A</text>
          
          <rect x="66" y="22" width="30" height="32" rx="6" fill="#181016" stroke="#FF1744" strokeWidth="1.5" />
          <text x="81" y="43" fill="#FF1744" fontSize="16" fontFamily="monospace" fontWeight="bold" textAnchor="middle">;</text>
          
          {/* Frequency Cadence Bars */}
          <g transform="translate(35, 62)">
            <rect x="0" y="6" width="4" height="10" rx="1" fill="#FF1744" />
            <rect x="8" y="2" width="4" height="14" rx="1" fill="#FF1744" />
            <rect x="16" y="0" width="4" height="16" rx="1" fill="#FF304F" />
            <rect x="24" y="5" width="4" height="11" rx="1" fill="#FF1744" />
            <rect x="32" y="8" width="4" height="8" rx="1" fill="#FF1744" />
            <rect x="40" y="3" width="4" height="13" rx="1" fill="#FF1744" />
            <rect x="48" y="7" width="4" height="9" rx="1" fill="#FF1744" />
          </g>
        </svg>
      );

    case 13:
      // Lesson 13: Paragraph Practice — Futuristic Monospace Document Tablet
      return (
        <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <rect x="30" y="16" width="60" height="58" rx="6" fill="#0C121B" stroke="#253245" strokeWidth="1.5" />
          {/* Header Bar */}
          <rect x="30" y="16" width="60" height="12" rx="6" fill="#16202E" />
          <circle cx="37" cy="22" r="2" fill="#FF1744" />
          <circle cx="43" cy="22" r="2" fill="#A6B0C0" />
          
          {/* Flowing text lines */}
          <rect x="36" y="34" width="44" height="3" rx="1.5" fill="#FF1744" opacity="0.8" />
          <rect x="36" y="41" width="48" height="3" rx="1.5" fill="#6F7B8D" opacity="0.6" />
          <rect x="36" y="48" width="38" height="3" rx="1.5" fill="#6F7B8D" opacity="0.6" />
          <rect x="36" y="55" width="46" height="3" rx="1.5" fill="#FF1744" opacity="0.8" />
          <rect x="36" y="62" width="28" height="3" rx="1.5" fill="#A6B0C0" opacity="0.7" />
        </svg>
      );

    case 14:
      // Lesson 14: Speed Challenge — Winged Velocity Stopwatch & Boost Flames
      return (
        <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          {/* Left Wing */}
          <path d="M42 42 C30 30, 16 35, 12 44 C22 47, 34 48, 42 47" fill="#172232" stroke="#FF1744" strokeWidth="1.2" />
          {/* Right Wing */}
          <path d="M78 42 C90 30, 104 35, 108 44 C98 47, 86 48, 78 47" fill="#172232" stroke="#FF1744" strokeWidth="1.2" />
          
          {/* Stopwatch Body */}
          <circle cx="60" cy="45" r="20" fill="#0C121B" stroke="#FF1744" strokeWidth="2" />
          <circle cx="60" cy="45" r="15" stroke="#253245" strokeWidth="1" strokeDasharray="3 2" />
          <line x1="60" y1="45" x2="68" y2="37" stroke="#FF1744" strokeWidth="2" strokeLinecap="round" />
          <circle cx="60" cy="45" r="2.5" fill="#FFFFFF" />
          {/* Top Knob */}
          <rect x="58" y="20" width="4" height="5" fill="#FF1744" rx="1" />
          {/* Speed Sparks */}
          <polygon points="60,69 57,77 63,77" fill="#FF1744" />
        </svg>
      );

    case 15:
      // Lesson 15: Real Words — 3D Vocabulary Letter Blocks
      return (
        <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          {/* Block 1 */}
          <g transform="translate(20, 30)">
            <rect width="24" height="24" rx="4" fill="#182333" stroke="#2E3C50" strokeWidth="1.2" />
            <text x="12" y="17" fill="#FFFFFF" fontSize="12" fontFamily="monospace" fontWeight="bold" textAnchor="middle">W</text>
          </g>
          {/* Block 2 */}
          <g transform="translate(48, 22)">
            <rect width="24" height="24" rx="4" fill="#1D1219" stroke="#FF1744" strokeWidth="1.5" />
            <text x="12" y="17" fill="#FF1744" fontSize="12" fontFamily="monospace" fontWeight="bold" textAnchor="middle">O</text>
          </g>
          {/* Block 3 */}
          <g transform="translate(76, 30)">
            <rect width="24" height="24" rx="4" fill="#182333" stroke="#2E3C50" strokeWidth="1.2" />
            <text x="12" y="17" fill="#FFFFFF" fontSize="12" fontFamily="monospace" fontWeight="bold" textAnchor="middle">R</text>
          </g>
          {/* Foundation Beam */}
          <rect x="16" y="60" width="88" height="6" rx="2" fill="#0C121A" stroke="#222B38" />
          <circle cx="60" cy="74" r="2" fill="#FF1744" />
        </svg>
      );

    case 16:
      // Lesson 16: Common Mistakes — Backspace Hex Deflector Shield
      return (
        <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          {/* Hexagonal Shield */}
          <polygon points="60,12 88,28 88,62 60,78 32,62 32,28" fill="#0E1521" stroke="#222B38" strokeWidth="2" />
          <polygon points="60,18 82,31 82,59 60,72 38,59 38,31" fill="#120A0F" stroke="#FF1744" strokeWidth="1.5" />
          
          {/* Backspace Arrow icon */}
          <path d="M68 37 L50 45 L68 53 Z" fill="#FF1744" />
          <line x1="56" y1="45" x2="74" y2="45" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="65" y1="40" x2="71" y2="50" stroke="#000" strokeWidth="1.5" />
          <line x1="71" y1="40" x2="65" y2="50" stroke="#000" strokeWidth="1.5" />
        </svg>
      );

    case 17:
      // Lesson 17: Punctuation Practice — Orbital Punctuation Glyphs
      return (
        <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          {/* Orbital Ellipse */}
          <ellipse cx="60" cy="45" rx="38" ry="20" stroke="#253245" strokeWidth="1.5" strokeDasharray="4 3" fill="none" />
          
          {/* Center Glyph - Quotation */}
          <rect x="46" y="32" width="28" height="26" rx="6" fill="#181016" stroke="#FF1744" strokeWidth="1.5" />
          <text x="60" y="50" fill="#FF1744" fontSize="16" fontFamily="sans-serif" fontWeight="900" textAnchor="middle">“ ”</text>
          
          {/* Orbiting Semicolon */}
          <circle cx="28" cy="42" r="9" fill="#101724" stroke="#2E3D52" />
          <text x="28" y="47" fill="#A6B0C0" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle">;</text>
          
          {/* Orbiting Comma */}
          <circle cx="92" cy="48" r="9" fill="#101724" stroke="#2E3D52" />
          <text x="92" y="52" fill="#A6B0C0" fontSize="12" fontFamily="monospace" fontWeight="bold" textAnchor="middle">,</text>
        </svg>
      );

    case 18:
      // Lesson 18: Advanced Sentences — Tachometer Speedometer Dial
      return (
        <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          {/* Dial Arc */}
          <path d="M30 65 A35 35 0 1 1 90 65" stroke="#222B38" strokeWidth="5" fill="none" strokeLinecap="round" />
          {/* Redline Active Zone */}
          <path d="M75 35 A35 35 0 0 1 90 65" stroke="#FF1744" strokeWidth="5" fill="none" strokeLinecap="round" />
          {/* Hub */}
          <circle cx="60" cy="55" r="7" fill="#16202E" stroke="#FF1744" strokeWidth="1.5" />
          {/* Needle pushing into redline */}
          <line x1="60" y1="55" x2="80" y2="35" stroke="#FF1744" strokeWidth="2.5" strokeLinecap="round" />
          <text x="60" y="74" fill="#A6B0C0" fontSize="8" fontFamily="monospace" textAnchor="middle">VELOCITY</text>
        </svg>
      );

    case 19:
      // Lesson 19: Timed Test — Digital Chronometer Countdown
      return (
        <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <rect x="22" y="24" width="76" height="42" rx="8" fill="#0A0E15" stroke="#253245" strokeWidth="1.5" />
          <rect x="28" y="30" width="64" height="30" rx="4" fill="#05070A" stroke="#FF1744" strokeWidth="1.2" />
          {/* Digital Timer Readout */}
          <text x="60" y="51" fill="#FF1744" fontSize="16" fontFamily="monospace" fontWeight="900" letterSpacing="2" textAnchor="middle">01:00</text>
          {/* Blinking indicator */}
          <circle cx="34" cy="36" r="2" fill="#FF1744" className="animate-pulse" />
          <text x="60" y="78" fill="#6F7B8D" fontSize="7" fontFamily="monospace" textAnchor="middle">SPRINT COUNTDOWN</text>
        </svg>
      );

    case 20:
    default:
      // Lesson 20: Unit Mastery / Boss-fight — Crown Crest Shield with Laurels & Star
      return (
        <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <defs>
            <linearGradient id="shieldGrad" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#251016" />
              <stop offset="1" stopColor="#0B0E14" />
            </linearGradient>
            <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#FFC247" floodOpacity="0.8" />
            </filter>
          </defs>
          {/* Laurel Wings Left */}
          <path d="M35 30 C20 40 22 62 38 72 C30 62 30 45 38 38" fill="#1C2738" stroke="#FF1744" strokeWidth="1" />
          {/* Laurel Wings Right */}
          <path d="M85 30 C100 40 98 62 82 72 C90 62 90 45 82 38" fill="#1C2738" stroke="#FF1744" strokeWidth="1" />
          
          {/* Central Crest Shield */}
          <path d="M60 14 L84 25 C84 55 60 76 60 76 C60 76 36 55 36 25 Z" fill="url(#shieldGrad)" stroke="#FF1744" strokeWidth="2" />
          <path d="M60 20 L78 29 C78 52 60 69 60 69 C60 69 42 52 42 29 Z" fill="#0C1017" stroke="#2B394D" strokeWidth="1" />
          
          {/* Royal Crown */}
          <path d="M50 48 L48 36 L55 41 L60 33 L65 41 L72 36 L70 48 Z" fill="#FFC247" stroke="#FFA000" strokeWidth="1" filter="url(#goldGlow)" />
          {/* Star of Mastery */}
          <polygon points="60,54 62,59 67,59 63,62 65,67 60,64 55,67 57,62 53,59 58,59" fill="#FFC247" />
        </svg>
      );
  }
};
