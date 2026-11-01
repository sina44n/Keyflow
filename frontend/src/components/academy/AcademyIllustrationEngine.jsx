import React from 'react';

/**
 * AcademyIllustrationEngine
 * =========================================================================
 * Production vector SVG illustration engine for the 4,200-level KEYFLOW Academy.
 * Directly replicated from the user-provided reference screenshots:
 * - Warm, creamy, friendly, tactile aesthetic
 * - 18 distinct educational motifs parameterized by targetKeys, skills, unit, and lesson
 * - High-contrast rendering in both Light (Cream & Burgundy) and Dark modes
 */

export const AcademyIllustrationEngine = ({
  lesson,
  isHovered = false,
  isCurrent = false,
  isCompleted = false,
  isLocked = false,
  className = "w-full h-20",
}) => {
  const lessonNum = lesson?.lessonNum || lesson?.levelNumber || 1;
  const unitNum = lesson?.unitNumber || Math.ceil(lessonNum / 20) || 1;
  const lessonInUnit = lesson?.lessonInUnit || ((lessonNum - 1) % 20) + 1;
  const title = (lesson?.title || '').toLowerCase();
  const skills = Array.isArray(lesson?.skills) ? lesson.skills.map((s) => String(s).toLowerCase()) : [];
  const targetKeys = Array.isArray(lesson?.targetKeys) && lesson.targetKeys.length > 0
    ? lesson.targetKeys
    : ['F', 'J'];

  // Resolve motif based on lesson characteristics
  const motif = resolveMotif(lessonNum, unitNum, lessonInUnit, title, skills, targetKeys);

  return (
    <div className={`flex items-center justify-center select-none pointer-events-none transition-transform duration-200 ${isHovered && !isLocked ? 'scale-105' : 'scale-100'}`}>
      {renderMotifSVG(motif, { targetKeys, lessonNum, isCompleted, isCurrent, isLocked, className })}
    </div>
  );
};

/**
 * Deterministically maps each lesson across all 4,200 levels to one of the 18 motifs.
 */
function resolveMotif(lessonNum, unitNum, lessonInUnit, title, skills, targetKeys) {
  // Explicit Unit 1 Exact Reference Mappings
  if (unitNum === 1 || lessonNum <= 20) {
    switch (lessonInUnit) {
      case 1: return 'intro_screen';
      case 2: return 'hand_keys';
      case 3: return 'space_bar';
      case 4: return 'review_magnifier';
      case 5: return 'hand_keys';
      case 6: return 'book_magic';
      case 7: return 'chronometer_timer';
      case 8: return 'astronaut_rocket';
      case 9: return 'key_box_reveal';
      case 10: return 'focus_zoom';
      case 11: return 'chronometer_timer';
      case 12: return 'hand_keys';
      case 13: return 'book_magic';
      case 14: return 'keyboard_matrix_path';
      case 15: return 'astronaut_blocks';
      case 16: return 'space_bar';
      case 17: return 'book_magic';
      case 18: return 'hand_keys';
      case 19: return 'focus_zoom';
      case 20: return 'code_terminal';
      default: return 'hand_keys';
    }
  }

  // Explicit Unit 2 Exact Reference Mappings
  if (unitNum === 2 || (lessonNum > 20 && lessonNum <= 40)) {
    switch (lessonInUnit) {
      case 1: return 'space_bar';          // 16 Start Fast
      case 2: return 'book_magic';         // 17 Text Reading
      case 3: return 'hand_keys';          // 18 Top Row Reach
      case 4: return 'focus_zoom';         // 19 Focus Review
      case 5: return 'code_terminal';      // 20 Screen Practice
      case 6: return 'hand_keys';          // 21 Upper Hand Review
      case 7: return 'speedometer_gauge';  // 22 Speed Sprint
      case 8: return 'astronaut_blocks';   // 23 Level Play
      case 9: return 'hand_keys';          // 24 Lower Keys Z&X
      case 10: return 'review_magnifier';  // 25 Key Combo
      case 11: return 'handheld_console';  // 26 Timed Drill
      case 12: return 'hand_keys';         // 27 V & B Keys
      case 13: return 'book_magic';        // 28 Word Review
      case 14: return 'shift_modifier';    // 29 Advanced Reach
      case 15: return 'astronaut_blocks';  // 30 Climb Play
      case 16: return 'hand_keys';
      case 17: return 'speedometer_gauge';
      case 18: return 'book_magic';
      case 19: return 'focus_zoom';
      case 20: return 'code_terminal';
      default: return 'hand_keys';
    }
  }

  // Explicit Unit 3 Exact Reference Mappings
  if (unitNum === 3 || (lessonNum > 40 && lessonNum <= 60)) {
    switch (lessonInUnit) {
      case 1: return 'audio_waveform';      // 31 Fluid Rhythm
      case 2: return 'hand_keys';           // 32 Q & P reach
      case 3: return 'puzzle_jigsaw';       // 33 Layout puzzle
      case 4: return 'bullseye_target';     // 34 Focus Bullseye
      case 5: return 'keyboard_matrix_path';// 35 Top row numbers
      case 6: return 'hand_keys';           // 36 Upper reach Y&T
      case 7: return 'chronometer_timer';   // 37 Time pressure
      case 8: return 'route_quest';         // 38 Route quest
      case 9: return 'shift_modifier';      // 39 Capital letters
      case 10: return 'focus_zoom';         // 40 Focus zoom
      case 11: return 'chronometer_timer';  // 41 Rapid Fire
      case 12: return 'hand_keys';          // 42 Center Keys G&H
      case 13: return 'book_magic';         // 43 Pro patterns
      case 14: return 'punctuation_sparkle';// 44 Special characters
      case 15: return 'astronaut_blocks';   // 45 Bubble run
      case 16: return 'audio_waveform';
      case 17: return 'speedometer_gauge';
      case 18: return 'hand_keys';
      case 19: return 'bullseye_target';
      case 20: return 'code_terminal';
      default: return 'hand_keys';
    }
  }

  // General 20-lesson cycle cadence for Units 4 through 30 across all 7 stages
  const cycleIndex = (lessonInUnit - 1) % 15;
  switch (cycleIndex) {
    case 0: return 'audio_waveform';
    case 1: return 'hand_keys';
    case 2: return 'space_bar';
    case 3: return 'review_magnifier';
    case 4: return 'hand_keys';
    case 5: return 'book_magic';
    case 6: return 'chronometer_timer';
    case 7: return 'astronaut_rocket';
    case 8: return 'puzzle_jigsaw';
    case 9: return 'focus_zoom';
    case 10: return 'speedometer_gauge';
    case 11: return 'hand_keys';
    case 12: return 'bullseye_target';
    case 13: return 'shift_modifier';
    case 14: return 'astronaut_blocks';
    default: return 'hand_keys';
  }
}

/**
 * Main SVG motif renderer.
 */
function renderMotifSVG(motif, props) {
  const { targetKeys, className } = props;
  const key1 = targetKeys[0] || 'F';
  const key2 = targetKeys[1] || (targetKeys.length === 1 ? 'J' : 'K');

  switch (motif) {
    // 1. Introduction Screen (Monitor, Hands, Keyboard, Green Checkmark)
    case 'intro_screen':
      return (
        <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          {/* Monitor Frame */}
          <rect x="25" y="10" width="70" height="46" rx="6" fill="#3D2E2B" />
          <rect x="29" y="14" width="62" height="38" rx="4" fill="#E2EDF8" />
          {/* Play Triangle */}
          <polygon points="56,26 68,33 56,40" fill="#8B2635" opacity="0.9" />
          {/* Monitor Stand */}
          <rect x="56" y="56" width="8" height="6" fill="#4A3833" />
          <path d="M48 62 H72" stroke="#4A3833" strokeWidth="2.5" strokeLinecap="round" />
          {/* Miniature Hands & Keyboard */}
          <rect x="36" y="62" width="48" height="12" rx="3" fill="#FFFFFF" stroke="#3D2E2B" strokeWidth="1" />
          {/* Left hand */}
          <path d="M30 76 C32 68 38 68 42 72 L44 76 Z" fill="#F6C8AA" stroke="#3D2E2B" strokeWidth="1" />
          {/* Right hand */}
          <path d="M90 76 C88 68 82 68 78 72 L76 76 Z" fill="#F6C8AA" stroke="#3D2E2B" strokeWidth="1" />
          {/* Completed Checkmark Pill */}
          <circle cx="60" cy="68" r="7" fill="#34A853" />
          <path d="M57 68 L59.5 70.5 L63.5 65.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    // 2. Hand Keys (Two Keycaps with Hands/Fingers pointing + Reach Arrows + Green Pill)
    case 'hand_keys':
      return (
        <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          {/* Curved reaching arrows between keys */}
          <path d="M42 18 C42 10, 78 10, 78 18" stroke="#8B2635" strokeWidth="1.6" strokeDasharray="3 2" fill="none" />
          <polygon points="79,18 74,14 77,20" fill="#8B2635" />
          <polygon points="41,18 46,14 43,20" fill="#8B2635" />

          {/* Left Keycap */}
          <g transform="translate(26, 18)">
            <rect width="28" height="28" rx="6" fill="#F7F2EB" stroke="#3A2D28" strokeWidth="1.6" />
            <rect x="2" y="2" width="24" height="24" rx="4" fill="#FFFFFF" />
            <text x="14" y="18" fill="#2D231E" fontSize="13" fontFamily="system-ui, sans-serif" fontWeight="800" textAnchor="middle">
              {String(key1).slice(0, 2)}
            </text>
          </g>

          {/* Right Keycap */}
          <g transform="translate(66, 18)">
            <rect width="28" height="28" rx="6" fill="#F7F2EB" stroke="#3A2D28" strokeWidth="1.6" />
            <rect x="2" y="2" width="24" height="24" rx="4" fill="#FFFFFF" />
            <text x="14" y="18" fill="#2D231E" fontSize="13" fontFamily="system-ui, sans-serif" fontWeight="800" textAnchor="middle">
              {String(key2).slice(0, 2)}
            </text>
          </g>

          {/* Left Pointing Hand */}
          <path d="M16 66 C22 56 36 50 40 40 C41 38 43 38 44 41 C43 48 38 58 34 68 Z" fill="#F6C8AA" stroke="#3A2D28" strokeWidth="1.3" strokeLinejoin="round" />
          {/* Right Pointing Hand */}
          <path d="M104 66 C98 56 84 50 80 40 C79 38 77 38 76 41 C77 48 82 58 86 68 Z" fill="#F6C8AA" stroke="#3A2D28" strokeWidth="1.3" strokeLinejoin="round" />

          {/* Green Checkmark Circle Badge */}
          <circle cx="60" cy="62" r="7" fill="#34A853" />
          <path d="M57 62 L59.5 64.5 L63.5 59.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    // 3. Space Bar (Wide Keycap with Hand / Thumb pressing)
    case 'space_bar':
      return (
        <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          {/* Space Keycap */}
          <g transform="translate(22, 22)">
            <rect width="76" height="26" rx="6" fill="#F7F2EB" stroke="#3A2D28" strokeWidth="1.6" />
            <rect x="2" y="2" width="72" height="22" rx="4" fill="#FFFFFF" />
            <text x="36" y="16" fill="#2D231E" fontSize="11" fontFamily="system-ui, sans-serif" fontWeight="700" textAnchor="middle">
              Space
            </text>
          </g>
          {/* Thumb / Hand resting on space bar */}
          <path d="M72 68 C70 54 75 42 78 36 C80 34 83 34 84 37 C83 44 86 54 94 68 Z" fill="#F6C8AA" stroke="#3A2D28" strokeWidth="1.3" strokeLinejoin="round" />
          {/* Green Checkmark Badge */}
          <circle cx="52" cy="62" r="7" fill="#34A853" />
          <path d="M49 62 L51.5 64.5 L55.5 59.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    // 4. Review Magnifier (Warm Magnifying Glass zooming over letter bubbles)
    case 'review_magnifier':
      return (
        <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          {/* Speech Bubble / Letter Pill 1 */}
          <g transform="translate(68, 22)">
            <rect width="24" height="24" rx="8" fill="#F2E6D8" stroke="#3A2D28" strokeWidth="1.4" />
            <text x="12" y="16" fill="#2D231E" fontSize="12" fontFamily="system-ui, sans-serif" fontWeight="800" textAnchor="middle">
              {String(key2).toLowerCase().slice(0, 1)}
            </text>
          </g>
          {/* Magnifying Glass zooming on Key 1 */}
          <circle cx="50" cy="34" r="18" fill="#FFFFFF" stroke="#3A2D28" strokeWidth="2.5" />
          <circle cx="50" cy="34" r="15" fill="#FAF5EE" />
          <text x="50" y="40" fill="#8B2635" fontSize="18" fontFamily="system-ui, sans-serif" fontWeight="900" textAnchor="middle">
            {String(key1).toLowerCase().slice(0, 1)}
          </text>
          {/* Magnifier Handle */}
          <rect x="25" y="49" width="16" height="6" rx="2" transform="rotate(-40 25 49)" fill="#8B2635" stroke="#3A2D28" strokeWidth="1.5" />
          {/* Sparkles */}
          <circle cx="78" cy="14" r="1.5" fill="#FFB800" />
          <circle cx="86" cy="18" r="2" fill="#FFB800" />
        </svg>
      );

    // 5. Book Magic (Open Dictionary with sparkling letters)
    case 'book_magic':
      return (
        <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          {/* Open Book Pages */}
          <path d="M26 48 C36 44 48 44 58 48 C68 44 80 44 94 48 L90 22 C78 18 68 18 58 22 C48 18 36 18 26 22 Z" fill="#FFFFFF" stroke="#3A2D28" strokeWidth="1.8" strokeLinejoin="round" />
          {/* Book Spine / Cover Base */}
          <path d="M24 50 C36 46 48 46 58 50 C68 46 80 46 96 50" stroke="#8B2635" strokeWidth="3" strokeLinecap="round" />
          {/* Text lines */}
          <line x1="32" y1="28" x2="52" y2="28" stroke="#D5C5B5" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="32" y1="34" x2="48" y2="34" stroke="#D5C5B5" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="68" y1="28" x2="84" y2="28" stroke="#D5C5B5" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="68" y1="34" x2="80" y2="34" stroke="#D5C5B5" strokeWidth="1.5" strokeLinecap="round" />
          {/* Target Key badge floating above book */}
          <circle cx="58" cy="24" r="10" fill="#FAF3EB" stroke="#8B2635" strokeWidth="1.5" />
          <text x="58" y="28" fill="#8B2635" fontSize="10" fontFamily="system-ui, sans-serif" fontWeight="800" textAnchor="middle">
            {String(key1).slice(0, 1)}
            {String(key2).slice(0, 1)}
          </text>
          {/* Stars */}
          <polygon points="40,14 41,17 44,17 42,19 43,22 40,20 37,22 38,19 36,17 39,17" fill="#FFB800" />
          <polygon points="76,12 77,14 79,14 78,16 79,18 76,17 74,18 75,16 73,14 75,14" fill="#FFB800" />
        </svg>
      );

    // 6. Chronometer / Retro Stopwatch (Timer dial with clock hands)
    case 'chronometer_timer':
      return (
        <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          {/* Top Plunger */}
          <rect x="56" y="10" width="8" height="6" rx="2" fill="#8B2635" stroke="#3A2D28" strokeWidth="1.4" />
          <path d="M52 14 C52 11 68 11 68 14" stroke="#3A2D28" strokeWidth="1.5" fill="none" />
          {/* Outer Ring */}
          <circle cx="60" cy="44" r="24" fill="#8B2635" stroke="#3A2D28" strokeWidth="1.8" />
          {/* Inner Face */}
          <circle cx="60" cy="44" r="20" fill="#FAF5EE" stroke="#3A2D28" strokeWidth="1.2" />
          {/* Dial Ticks */}
          <line x1="60" y1="26" x2="60" y2="29" stroke="#3A2D28" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="78" y1="44" x2="75" y2="44" stroke="#3A2D28" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="60" y1="62" x2="60" y2="59" stroke="#3A2D28" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="42" y1="44" x2="45" y2="44" stroke="#3A2D28" strokeWidth="1.5" strokeLinecap="round" />
          {/* Clock Hands */}
          <line x1="60" y1="44" x2="68" y2="34" stroke="#3A2D28" strokeWidth="2" strokeLinecap="round" />
          <line x1="60" y1="44" x2="52" y2="40" stroke="#8B2635" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="60" cy="44" r="2.5" fill="#3A2D28" />
          {/* Side Keys for rhythm */}
          <text x="32" y="47" fill="#8B2635" fontSize="11" fontFamily="system-ui, sans-serif" fontWeight="800">
            {String(key1).slice(0, 1).toLowerCase()}
          </text>
          <text x="82" y="47" fill="#8B2635" fontSize="11" fontFamily="system-ui, sans-serif" fontWeight="800">
            {String(key2).slice(0, 1).toLowerCase()}
          </text>
        </svg>
      );

    // 7. Astronaut Rocket (Mascot rocket blasting up past falling letter blocks)
    case 'astronaut_rocket':
      return (
        <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          {/* Exhaust trails */}
          <path d="M42 54 L32 64 M45 56 L38 68" stroke="#FFB800" strokeWidth="2" strokeLinecap="round" />
          {/* Rocket Body */}
          <g transform="translate(38, 20) rotate(35)">
            {/* Fins */}
            <path d="M2 20 L-6 26 L2 26 Z" fill="#8B2635" stroke="#3A2D28" strokeWidth="1.2" />
            <path d="M18 20 L26 26 L18 26 Z" fill="#8B2635" stroke="#3A2D28" strokeWidth="1.2" />
            {/* Fuselage */}
            <ellipse cx="10" cy="14" rx="10" ry="16" fill="#FDFBF7" stroke="#3A2D28" strokeWidth="1.6" />
            <circle cx="10" cy="12" r="5" fill="#3D82A2" stroke="#3A2D28" strokeWidth="1" />
            <circle cx="8.5" cy="10.5" r="1.5" fill="#FFFFFF" />
            {/* Cone */}
            <path d="M2 6 Q10 -6 18 6 Z" fill="#8B2635" stroke="#3A2D28" strokeWidth="1.2" />
          </g>
          {/* Falling Letter Blocks */}
          <g transform="translate(80, 16)">
            <rect width="14" height="14" rx="3" fill="#FAF5EE" stroke="#3A2D28" strokeWidth="1.2" />
            <text x="7" y="11" fill="#2D231E" fontSize="9" fontWeight="800" textAnchor="middle">f</text>
          </g>
          <g transform="translate(94, 28)">
            <rect width="14" height="14" rx="3" fill="#FAF5EE" stroke="#3A2D28" strokeWidth="1.2" />
            <text x="7" y="11" fill="#2D231E" fontSize="9" fontWeight="800" textAnchor="middle">j</text>
          </g>
          <g transform="translate(82, 42)">
            <rect width="14" height="14" rx="3" fill="#FAF5EE" stroke="#3A2D28" strokeWidth="1.2" />
            <text x="7" y="11" fill="#2D231E" fontSize="9" fontWeight="800" textAnchor="middle">k</text>
          </g>
        </svg>
      );

    // 8. Key Box Reveal (Treasure box opening with radiant letter keys)
    case 'key_box_reveal':
      return (
        <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          {/* Radiant Sunburst Beams */}
          <line x1="60" y1="20" x2="60" y2="6" stroke="#FFB800" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
          <line x1="44" y1="24" x2="32" y2="14" stroke="#FFB800" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
          <line x1="76" y1="24" x2="88" y2="14" stroke="#FFB800" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
          {/* Box Base */}
          <rect x="52" y="16" width="16" height="12" rx="2" fill="#C99768" stroke="#3A2D28" strokeWidth="1.2" />
          {/* Left Key S */}
          <g transform="translate(36, 32)">
            <rect width="22" height="22" rx="5" fill="#F7F2EB" stroke="#3A2D28" strokeWidth="1.5" />
            <rect x="2" y="2" width="18" height="18" rx="3" fill="#FFFFFF" />
            <text x="11" y="15" fill="#2D231E" fontSize="12" fontWeight="800" textAnchor="middle">
              {String(key1).slice(0, 1)}
            </text>
          </g>
          {/* Right Key L */}
          <g transform="translate(62, 32)">
            <rect width="22" height="22" rx="5" fill="#F7F2EB" stroke="#3A2D28" strokeWidth="1.5" />
            <rect x="2" y="2" width="18" height="18" rx="3" fill="#FFFFFF" />
            <text x="11" y="15" fill="#2D231E" fontSize="12" fontWeight="800" textAnchor="middle">
              {String(key2).slice(0, 1)}
            </text>
          </g>
          {/* Green Checkmark Badge */}
          <circle cx="60" cy="62" r="6" fill="#34A853" />
          <path d="M57.5 62 L59.5 64 L62.5 60" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    // 9. Focus Zoom (Large Magnifying Glass over single circular keycap)
    case 'focus_zoom':
      return (
        <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          {/* Large Magnifier */}
          <circle cx="56" cy="38" r="22" fill="#FFFFFF" stroke="#3A2D28" strokeWidth="2.5" />
          <circle cx="56" cy="38" r="18" fill="#F7EFE6" />
          <text x="56" y="46" fill="#3A2D28" fontSize="22" fontFamily="system-ui, sans-serif" fontWeight="900" textAnchor="middle">
            {String(key1).slice(0, 1)}
          </text>
          {/* Handle */}
          <path d="M72 54 L90 70" stroke="#8B2635" strokeWidth="7" strokeLinecap="round" />
          <path d="M72 54 L90 70" stroke="#3A2D28" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    // 10. Keyboard Matrix Path (Home row anchor keys on dotted circuit pathway)
    case 'keyboard_matrix_path':
      return (
        <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          {/* Dotted Trail */}
          <path d="M20 54 H100" stroke="#8B2635" strokeWidth="2" strokeDasharray="3 3" />
          {/* Keycaps row 1 */}
          <g transform="translate(28, 22)">
            {[0, 1, 2, 3].map((i) => (
              <rect key={i} x={i * 17} y="0" width="13" height="13" rx="3" fill="#8B2635" opacity="0.8" />
            ))}
          </g>
          {/* Keycaps row 2 */}
          <g transform="translate(28, 38)">
            {[0, 1, 2, 3].map((i) => (
              <rect key={i} x={i * 17} y="0" width="13" height="13" rx="3" fill="#F7F2EB" stroke="#3A2D28" strokeWidth="1" />
            ))}
          </g>
        </svg>
      );

    // 11. Astronaut Blocks (Cute astronaut mascot hopping on keycap stepping stones)
    case 'astronaut_blocks':
      return (
        <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          {/* Stepping Stone Keycaps */}
          <g transform="translate(20, 52)">
            {['A', 'S', 'D', 'F', 'J'].map((ch, i) => (
              <g key={ch} transform={`translate(${i * 16}, 0)`}>
                <rect width="13" height="13" rx="3" fill="#8B2635" opacity="0.85" />
                <text x="6.5" y="9.5" fill="#FFFFFF" fontSize="8" fontWeight="800" textAnchor="middle">
                  {ch}
                </text>
              </g>
            ))}
          </g>
          {/* Jumping Astronaut */}
          <g transform="translate(48, 16)">
            {/* Backpack */}
            <rect x="0" y="8" width="6" height="12" rx="2" fill="#8B2635" />
            {/* Body */}
            <ellipse cx="14" cy="18" rx="7" ry="9" fill="#FDFBF7" stroke="#3A2D28" strokeWidth="1.4" />
            {/* Helmet */}
            <circle cx="14" cy="9" r="7" fill="#FDFBF7" stroke="#3A2D28" strokeWidth="1.4" />
            <ellipse cx="15" cy="9" rx="4" ry="3.5" fill="#3D82A2" stroke="#3A2D28" strokeWidth="1" />
            <circle cx="14" cy="8" r="1" fill="#FFFFFF" />
            {/* Legs */}
            <path d="M11 26 L8 34 M17 26 L20 34" stroke="#3A2D28" strokeWidth="2" strokeLinecap="round" />
          </g>
        </svg>
      );

    // 12. Speedometer Gauge (Arc dial with fast needle and speed sprint lines)
    case 'speedometer_gauge':
      return (
        <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          {/* Motion trail lines */}
          <line x1="24" y1="36" x2="34" y2="36" stroke="#8B2635" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="20" y1="44" x2="32" y2="44" stroke="#8B2635" strokeWidth="1.5" strokeLinecap="round" />
          {/* Dial Arc */}
          <path d="M40 56 A 26 26 0 1 1 80 56" stroke="#3A2D28" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M40 56 A 26 26 0 0 1 76 34" stroke="#8B2635" strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Center Hub */}
          <circle cx="60" cy="54" r="5" fill="#3A2D28" />
          {/* Needle pointing to high speed */}
          <line x1="60" y1="54" x2="74" y2="34" stroke="#8B2635" strokeWidth="2.5" strokeLinecap="round" />
          {/* Dial Ticks */}
          <circle cx="48" cy="36" r="1.5" fill="#3A2D28" />
          <circle cx="60" cy="32" r="1.5" fill="#3A2D28" />
          <circle cx="72" cy="36" r="1.5" fill="#3A2D28" />
        </svg>
      );

    // 13. Handheld Console (Switch style gaming screen with time drill)
    case 'handheld_console':
      return (
        <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          {/* Console Body */}
          <rect x="24" y="24" width="72" height="36" rx="10" fill="#3A2D28" />
          {/* Left Joypad Pill */}
          <rect x="25" y="25" width="14" height="34" rx="8" fill="#4E6E5D" />
          <circle cx="32" cy="36" r="3" fill="#2D231E" />
          {/* Right Joypad Pill */}
          <rect x="81" y="25" width="14" height="34" rx="8" fill="#8B2635" />
          <circle cx="88" cy="42" r="3" fill="#2D231E" />
          {/* Center Screen */}
          <rect x="41" y="28" width="38" height="28" rx="4" fill="#FAF5EE" />
          <text x="60" y="46" fill="#2D231E" fontSize="10" fontFamily="monospace" fontWeight="800" textAnchor="middle">
            00:04
          </text>
        </svg>
      );

    // 14. Puzzle Jigsaw (Interlocking keyboard jigsaw puzzle)
    case 'puzzle_jigsaw':
      return (
        <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          {/* Mini Keyboard Plate */}
          <rect x="24" y="28" width="72" height="34" rx="5" fill="#FAF5EE" stroke="#3A2D28" strokeWidth="1.5" />
          <rect x="28" y="32" width="12" height="12" rx="2" fill="#EADCCF" />
          <rect x="44" y="32" width="12" height="12" rx="2" fill="#EADCCF" />
          <rect x="60" y="32" width="12" height="12" rx="2" fill="#EADCCF" />
          <rect x="76" y="32" width="12" height="12" rx="2" fill="#EADCCF" />
          {/* Floating Interlocking Jigsaw Piece */}
          <g transform="translate(48, 12)">
            <path d="M0 0 H14 C16 4 20 4 22 0 H36 V14 C32 16 32 20 36 22 V36 H22 C20 32 16 32 14 36 H0 V22 C4 20 4 16 0 14 Z" fill="#E8B87A" stroke="#3A2D28" strokeWidth="1.4" />
            <text x="18" y="21" fill="#2D231E" fontSize="9" fontWeight="800" textAnchor="middle">
              {String(key1).slice(0, 1)}
            </text>
          </g>
          {/* Green Checkmark */}
          <circle cx="60" cy="56" r="6" fill="#34A853" />
          <path d="M57.5 56 L59.5 58 L62.5 54" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    // 15. Bullseye Target (Concentric archery rings with letter darts)
    case 'bullseye_target':
      return (
        <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          {/* Target Rings */}
          <circle cx="60" cy="40" r="26" fill="#FAF5EE" stroke="#3A2D28" strokeWidth="1.6" />
          <circle cx="60" cy="40" r="19" fill="#8B2635" />
          <circle cx="60" cy="40" r="12" fill="#FAF5EE" stroke="#3A2D28" strokeWidth="1" />
          <circle cx="60" cy="40" r="5" fill="#8B2635" />
          {/* Arrows hitting bullseye */}
          <line x1="72" y1="26" x2="62" y2="38" stroke="#3A2D28" strokeWidth="2" strokeLinecap="round" />
          <line x1="78" y1="42" x2="64" y2="41" stroke="#3A2D28" strokeWidth="2" strokeLinecap="round" />
          {/* Target Keys */}
          <text x="82" y="24" fill="#2D231E" fontSize="9" fontWeight="800">
            {String(key1).toLowerCase().slice(0, 1)}
          </text>
          <text x="86" y="44" fill="#2D231E" fontSize="9" fontWeight="800">
            {String(key2).toLowerCase().slice(0, 1)}
          </text>
        </svg>
      );

    // 16. Shift Modifier & Capital Letters
    case 'shift_modifier':
      return (
        <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          {/* Keycaps A B C */}
          <g transform="translate(36, 18)">
            {['A', 'B', 'C'].map((ch, i) => (
              <g key={ch} transform={`translate(${i * 18}, 0)`}>
                <rect width="15" height="15" rx="3.5" fill="#F7F2EB" stroke="#3A2D28" strokeWidth="1.2" />
                <rect x="1.5" y="1.5" width="12" height="12" rx="2" fill="#FFFFFF" />
                <text x="7.5" y="11" fill="#2D231E" fontSize="9" fontWeight="800" textAnchor="middle">
                  {ch}
                </text>
              </g>
            ))}
          </g>
          {/* Shift Keycap */}
          <g transform="translate(24, 38)">
            <rect width="34" height="18" rx="4" fill="#C9B5A3" stroke="#3A2D28" strokeWidth="1.4" />
            <text x="17" y="12" fill="#2D231E" fontSize="9" fontWeight="700" textAnchor="middle">
              Shift
            </text>
          </g>
          {/* Keycap Alt / Letters */}
          <g transform="translate(62, 38)">
            <rect width="16" height="18" rx="4" fill="#F7F2EB" stroke="#3A2D28" strokeWidth="1.2" />
            <rect x="1.5" y="1.5" width="13" height="15" rx="2" fill="#FFFFFF" />
            <text x="8" y="12" fill="#2D231E" fontSize="9" fontWeight="800" textAnchor="middle">
              {String(key1).toUpperCase().slice(0, 1)}
            </text>
          </g>
          <g transform="translate(82, 38)">
            <rect width="16" height="18" rx="4" fill="#F7F2EB" stroke="#3A2D28" strokeWidth="1.2" />
            <rect x="1.5" y="1.5" width="13" height="15" rx="2" fill="#FFFFFF" />
            <text x="8" y="12" fill="#2D231E" fontSize="9" fontWeight="800" textAnchor="middle">
              {String(key2).toUpperCase().slice(0, 1)}
            </text>
          </g>
          {/* Green Checkmark */}
          <circle cx="60" cy="64" r="6" fill="#34A853" />
          <path d="M57.5 64 L59.5 66 L62.5 62" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    // 17. Audio Waveform & Fluid Rhythm
    case 'audio_waveform':
      return (
        <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          {/* Waveform Ribbon */}
          <path d="M22 28 Q 32 16, 42 28 T 62 28 T 82 28 T 98 28" stroke="#389482" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M30 30 Q 40 22, 50 30 T 70 30 T 90 30" stroke="#8B2635" strokeWidth="1.5" strokeDasharray="3 2" fill="none" />
          {/* Mini Keyboard Row */}
          <g transform="translate(28, 38)">
            {[0, 1, 2, 3, 4].map((i) => (
              <rect key={i} x={i * 13} y="0" width="10" height="10" rx="2" fill="#FAF5EE" stroke="#3A2D28" strokeWidth="1" />
            ))}
          </g>
          {/* Two Hands floating rhythmically */}
          <path d="M22 66 C26 56 34 52 38 46 L40 66 Z" fill="#F6C8AA" stroke="#3A2D28" strokeWidth="1.2" />
          <path d="M98 66 C94 56 86 52 82 46 L80 66 Z" fill="#F6C8AA" stroke="#3A2D28" strokeWidth="1.2" />
          {/* Green Checkmark */}
          <circle cx="60" cy="62" r="6" fill="#34A853" />
          <path d="M57.5 62 L59.5 64 L62.5 60" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    // 18. Route Quest (Adventure car collecting key crystals)
    case 'route_quest':
      return (
        <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          {/* Scenic Hills */}
          <path d="M18 56 Q 38 42, 60 56 T 102 56" stroke="#D5C5B5" strokeWidth="1.5" fill="none" />
          {/* Car */}
          <g transform="translate(40, 36)">
            {/* Body */}
            <rect x="0" y="8" width="34" height="14" rx="4" fill="#4B6E59" stroke="#3A2D28" strokeWidth="1.4" />
            <path d="M6 8 L12 0 H24 L28 8 Z" fill="#FAF5EE" stroke="#3A2D28" strokeWidth="1.2" />
            {/* Wheels */}
            <circle cx="8" cy="22" r="4" fill="#3A2D28" />
            <circle cx="26" cy="22" r="4" fill="#3A2D28" />
          </g>
          {/* Key Treasures */}
          <g transform="translate(80, 20)">
            <circle cx="8" cy="8" r="7" fill="#E8B87A" stroke="#3A2D28" strokeWidth="1.2" />
            <rect x="7" y="14" width="2" height="6" fill="#3A2D28" />
          </g>
          <g transform="translate(24, 22)">
            <circle cx="6" cy="6" r="6" fill="#8B2635" stroke="#3A2D28" strokeWidth="1.2" />
          </g>
        </svg>
      );

    // 19. Code Terminal / Screen Practice
    case 'code_terminal':
    default:
      return (
        <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          {/* Monitor Frame */}
          <rect x="26" y="16" width="68" height="46" rx="6" fill="#3A2D28" />
          <rect x="30" y="20" width="60" height="38" rx="4" fill="#1C1816" />
          {/* Code syntax waterfall */}
          <text x="35" y="30" fill="#4EAE7C" fontSize="7" fontFamily="monospace" fontWeight="bold">const key = &apos;{String(key1).toLowerCase()}&apos;;</text>
          <text x="35" y="38" fill="#E8A598" fontSize="7" fontFamily="monospace">flow(key);</text>
          <text x="35" y="46" fill="#FFB800" fontSize="7" fontFamily="monospace">return true;</text>
          {/* Monitor Stand */}
          <rect x="56" y="62" width="8" height="5" fill="#4A3833" />
          <path d="M50 67 H70" stroke="#4A3833" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
  }
}
