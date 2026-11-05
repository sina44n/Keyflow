/**
 * KEYFLOW Speedometer & Academy Performance Telemetry Engine
 * ==========================================================
 * Pure mathematical model for the automotive speedometer gauge,
 * performance classifications, and typing identity engine.
 */

export const SPEED_CATEGORIES = [
  {
    name: 'EXCELLENT',
    color: '#39D353',
    glow: 'rgba(57, 211, 83, 0.45)',
    startWpm: 60,
    endWpm: 100,
    startAngle: 195,
    endAngle: 154,
    midAngle: 174.5,
  },
  {
    name: 'GOOD',
    color: '#A3E635',
    glow: 'rgba(163, 230, 53, 0.45)',
    startWpm: 40,
    endWpm: 59,
    startAngle: 152,
    endAngle: 112,
    midAngle: 132.0,
  },
  {
    name: 'FAIR',
    color: '#FACC15',
    glow: 'rgba(250, 204, 21, 0.45)',
    startWpm: 30,
    endWpm: 39,
    startAngle: 110,
    endAngle: 70,
    midAngle: 90.0,
  },
  {
    name: 'POOR',
    color: '#F97316',
    glow: 'rgba(249, 115, 22, 0.45)',
    startWpm: 20,
    endWpm: 29,
    startAngle: 68,
    endAngle: 28,
    midAngle: 48.0,
  },
  {
    name: 'VERY POOR',
    color: '#EF4444',
    glow: 'rgba(239, 68, 68, 0.45)',
    startWpm: 0,
    endWpm: 19,
    startAngle: 26,
    endAngle: -15,
    midAngle: 5.5,
  },
];

/**
 * Resolves speed classification from actual WPM.
 */
export function getSpeedCategory(wpm) {
  const clamped = Math.max(0, Math.min(100, Math.round(Number(wpm) || 0)));
  if (clamped >= 60) return SPEED_CATEGORIES[0];
  if (clamped >= 40) return SPEED_CATEGORIES[1];
  if (clamped >= 30) return SPEED_CATEGORIES[2];
  if (clamped >= 20) return SPEED_CATEGORIES[3];
  return SPEED_CATEGORIES[4];
}

/**
 * Converts actual WPM to needle rotation angle (degrees from 12 o'clock).
 * - 100 WPM = -105° (far left, EXCELLENT)
 * - 0 WPM = +105° (far right, VERY POOR)
 */
export function wpmToNeedleRotation(wpm) {
  const clamped = Math.max(0, Math.min(100, Number(wpm) || 0));
  // Polar angle from 195° (100 WPM) down to -15° (0 WPM)
  const polarAngle = 195 - (100 - clamped) * 2.1;
  // SVG rotation from 12 o'clock (90° polar):
  return 90 - polarAngle;
}

/**
 * Classifies the typist into an authentic Typing Identity based on Speed & Accuracy.
 */
export function getTypingIdentity(wpm, accuracy) {
  const rawWpm = Number(wpm) || 0;
  const rawAcc = Number(accuracy) || 0;

  if (rawWpm >= 50 && rawAcc >= 96) {
    return {
      title: 'PRECISION MASTER',
      description: 'You demonstrated exceptional control, laser accuracy, and consistent high-speed flow.',
      badgeColor: '#39D353',
    };
  }
  if (rawWpm >= 50 && rawAcc >= 90) {
    return {
      title: 'SPEED PERFORMER',
      description: 'Tremendous raw velocity with rapid finger transitions across the keyboard.',
      badgeColor: '#A3E635',
    };
  }
  if (rawWpm >= 25 && rawAcc >= 95) {
    return {
      title: 'ACCURACY BUILDER',
      description: 'Flawless keystroke discipline prioritizing zero mistakes and solid muscle memory.',
      badgeColor: '#38BDF8',
    };
  }
  if (rawWpm >= 25 && rawAcc >= 90) {
    return {
      title: 'BALANCED TYPIST',
      description: 'Steady rhythm and dependable coordination across all target keys.',
      badgeColor: '#FACC15',
    };
  }
  return {
    title: 'DEVELOPING TYPIST',
    description: 'Building foundational tactile memory and finger placement on the home row.',
    badgeColor: '#F97316',
  };
}

/**
 * Calculates Net WPM from gross WPM, mistakes, and duration in seconds.
 */
export function calculateNetWpm(wpm, mistakes, durationSeconds) {
  const gross = Math.max(0, Number(wpm) || 0);
  const errs = Math.max(0, Number(mistakes) || 0);
  const mins = Math.max(Number(durationSeconds) || 1, 1) / 60;
  return Math.max(0, Math.round(gross - (errs / mins)));
}

/**
 * Polar coordinate conversion.
 */
export function polarToCartesian(cx, cy, r, angleInDegrees) {
  const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
  return {
    x: cx + r * Math.cos(angleInRadians),
    y: cy - r * Math.sin(angleInRadians),
  };
}

/**
 * SVG arc path generator.
 */
export function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const arcSweep = Math.abs(startAngle - endAngle) <= 180 ? 0 : 1;
  return [
    'M', start.x.toFixed(2), start.y.toFixed(2),
    'A', r, r, 0, arcSweep, 1, end.x.toFixed(2), end.y.toFixed(2),
  ].join(' ');
}

/**
 * Generates an SVG path for an annular ribbon segment (thick colored arc).
 */
export function describeRibbonSegment(cx, cy, rOuter, rInner, startAngle, endAngle) {
  const p1 = polarToCartesian(cx, cy, rOuter, startAngle);
  const p2 = polarToCartesian(cx, cy, rOuter, endAngle);
  const p3 = polarToCartesian(cx, cy, rInner, endAngle);
  const p4 = polarToCartesian(cx, cy, rInner, startAngle);
  const arcSweep = Math.abs(startAngle - endAngle) <= 180 ? 0 : 1;
  return [
    'M', p1.x.toFixed(2), p1.y.toFixed(2),
    'A', rOuter, rOuter, 0, arcSweep, 1, p2.x.toFixed(2), p2.y.toFixed(2),
    'L', p3.x.toFixed(2), p3.y.toFixed(2),
    'A', rInner, rInner, 0, arcSweep, 0, p4.x.toFixed(2), p4.y.toFixed(2),
    'Z'
  ].join(' ');
}

