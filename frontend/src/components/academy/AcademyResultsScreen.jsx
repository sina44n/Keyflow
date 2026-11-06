/**
 * KEYFLOW Academy Performance Results Screen
 * ==========================================
 * Full-page, automotive-style Typing Performance Dashboard.
 * Faithfully reproduces the high-end instrument-cluster speedometer reference image.
 *
 * Core Specifications:
 * - Prominent semicircular speedometer matching Reference Image proportions
 * - Thick, volumetric 5-zone colored arc with authentic ambient glows
 * - Realistic 3D metallic chiseled needle with silver specular and gunmetal shadow
 * - Concentric metallic chrome pivot hub
 * - 100% synchronized numerical score, needle angle, category name, and color
 * - Category labels tightly curved along outer arc in authentic zone colors
 * - Clean central readout: score + "OUT OF 100" + active category highlight
 * - Large, balanced 5-column statistics dashboard with neon icons
 * - Responsive layout across Desktop, Tablet, and Mobile with zero page scrolling
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  RotateCcw,
  LayoutGrid,
  ArrowRight,
  Gauge,
  Crosshair,
  Activity,
  AlertTriangle,
  Clock,
} from 'lucide-react';

import {
  getSpeedCategory,
  wpmToNeedleRotation,
  polarToCartesian,
  describeArc,
  describeRibbonSegment,
  calculateNetWpm,
} from '../../utils/speedometerEngine';
import { calculateStars, getLessonRecord } from '../../utils/lessonProgress';

/**
 * Prominent 3D Golden Star with ambient bloom and subtle facet depth.
 * Faithfully reproduces the five-star visual element from the reference image.
 */
export const FiveStarRating = ({ earnedCount = 0 }) => {
  // Pre-calculated 10 points for standard 5-pointed star with soft, rounded proportions
  // Center (30, 30), outer radius 24, inner radius 12.5
  const points = '30.00,6.00 37.35,19.90 52.83,22.59 41.87,33.88 44.18,49.40 30.00,42.50 15.82,49.40 18.13,33.88 7.17,22.59 22.65,19.90';

  const arcTransforms = [
    'translateY(16px) rotate(-16deg)',
    'translateY(5px) rotate(-8deg)',
    'translateY(0px) rotate(0deg)',
    'translateY(5px) rotate(8deg)',
    'translateY(16px) rotate(16deg)',
  ];

  return (
    <div
      className="flex items-center justify-center gap-2 sm:gap-3 md:gap-3.5 mb-1.5 sm:mb-2 select-none"
      aria-label={`Earned ${earnedCount} of 5 stars`}
      role="img"
    >
      {[0, 1, 2, 3, 4].map((idx) => {
        const isEarned = idx < earnedCount;
        const transform = arcTransforms[idx];

        return (
          <div
            key={idx}
            className="flex items-center justify-center transition-transform duration-300"
            style={{ transform }}
          >
            {isEarned ? (
              <svg
                className="w-10 h-10 sm:w-12 sm:h-12 md:w-13 md:h-13 overflow-visible"
                viewBox="0 0 60 60"
              >
                <defs>
                  <linearGradient id={`starGrad_${idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFF38A" />
                    <stop offset="30%" stopColor="#FCD34D" />
                    <stop offset="70%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#D97706" />
                  </linearGradient>
                  <linearGradient id={`starHighlight_${idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
                    <stop offset="60%" stopColor="#FDE68A" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Soft Radiant Golden Ambient Glow Blooms */}
                <circle cx="30" cy="30" r="26" fill="#F59E0B" opacity="0.38" filter="blur(12px)" />
                <circle cx="30" cy="30" r="18" fill="#FBBF24" opacity="0.58" filter="blur(7px)" />
                <circle cx="30" cy="30" r="10" fill="#FDE047" opacity="0.75" filter="blur(3px)" />

                {/* Main Volumetric 3D Golden Star with Rounded Points */}
                <polygon
                  points={points}
                  fill={`url(#starGrad_${idx})`}
                  stroke="#FDE68A"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  filter="drop-shadow(0 3px 6px rgba(180, 83, 9, 0.65))"
                />

                {/* Top Facet Sheen Highlight */}
                <ellipse cx="30" cy="24" rx="10" ry="6" fill={`url(#starHighlight_${idx})`} />
                <circle cx="30" cy="22" r="3" fill="#FFFFFF" opacity="0.7" filter="blur(1px)" />
              </svg>
            ) : (
              <svg
                className="w-10 h-10 sm:w-12 sm:h-12 md:w-13 md:h-13 overflow-visible"
                viewBox="0 0 60 60"
              >
                {/* Muted Unearned Star Fitting Existing Dark UI */}
                <polygon
                  points={points}
                  fill="#111726"
                  stroke="rgba(255, 255, 255, 0.16)"
                  strokeWidth="2.2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  filter="drop-shadow(0 2px 5px rgba(0, 0, 0, 0.7))"
                />
                <circle cx="30" cy="30" r="4.5" fill="rgba(255, 255, 255, 0.06)" />
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
};

export const AcademyResultsScreen = ({
  lesson,
  result,
  onRetry,
  onBack,
  onNext,
  hasNextLesson = false,
  hasNextStage = false,
}) => {
  // Extract authenticated metrics from actual completed session
  const wpm = Math.max(0, Math.round(result?.wpm || 0));
  const accuracy = Math.max(0, Math.min(100, Math.round(result?.accuracy || 100)));
  const mistakes = Math.max(0, result?.mistakes || 0);
  const duration = Math.max(1, result?.duration || 1);
  const passed = Boolean(result?.passed);

  // Authoritative Net WPM (penalizes uncorrected errors, never double-penalizing corrected typos)
  const netWpm = Math.max(
    0,
    result?.netWpm !== undefined
      ? Math.round(result.netWpm)
      : calculateNetWpm(wpm, result?.uncorrectedErrors ?? 0, duration)
  );

  // Synchronized score, category, and needle rotation
  const category = useMemo(() => getSpeedCategory(wpm), [wpm]);
  const targetRotation = useMemo(() => wpmToNeedleRotation(wpm), [wpm]);

  // Authoritative earned star count (0 to 5) directly from actual completed session result or recorded history
  const earnedStars = useMemo(() => {
    // 1. Direct result.stars from currently completed session
    if (typeof result?.stars === 'number' && !isNaN(result.stars)) {
      return Math.max(0, Math.min(5, Math.floor(result.stars)));
    }
    // 2. Fallback: check historical record from lessonProgress storage for this specific lesson
    const sId = lesson?.stageId || 1;
    const lNum = lesson?.lessonNum || lesson?.levelNumber || 1;
    const record = getLessonRecord(sId, lNum);
    if (typeof record?.stars === 'number' && !isNaN(record.stars)) {
      return Math.max(0, Math.min(5, Math.floor(record.stars)));
    }
    // 3. Fallback: calculate directly from authoritative calculateStars if accuracy and wpm are available
    if (typeof result?.accuracy === 'number' && typeof result?.wpm === 'number') {
      return calculateStars(
        result.accuracy,
        lesson?.targetAccuracy || 90,
        result.wpm,
        lesson?.targetWpm || 20
      );
    }
    // 4. Fallback: if lesson.record has metrics
    if (typeof lesson?.record?.stars === 'number' && !isNaN(lesson.record.stars)) {
      return Math.max(0, Math.min(5, Math.floor(lesson.record.stars)));
    }
    return 0;
  }, [result, lesson]);

  // Needle animation state
  const [needleRotation, setNeedleRotation] = useState(targetRotation);
  const [displayedWpm, setDisplayedWpm] = useState(0);
  const [isNeedleSettled, setIsNeedleSettled] = useState(false);
  const isNavigatingRef = useRef(false);

  // Check prefers-reduced-motion
  const prefersReducedMotion = typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Strict full-viewport lock (no vertical/horizontal scroll, no footer peek)
  useEffect(() => {
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = origOverflow;
    };
  }, []);

  // Expose settling status to visual QA automation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__RESULTS_SETTLED__ = isNeedleSettled;
    }
  }, [isNeedleSettled]);

  // Needle and WPM counter synchronized animation
  useEffect(() => {
    if (prefersReducedMotion) {
      setNeedleRotation(targetRotation);
      setDisplayedWpm(wpm);
      setIsNeedleSettled(true);
      return;
    }

    const startRot = 105; // 0 WPM (rightmost end of gauge)
    setNeedleRotation(startRot);
    setDisplayedWpm(0);
    setIsNeedleSettled(false);

    const animDuration = 800; // 800ms authentic automotive sweep
    let animFrame;
    const startTime = performance.now() + 60;

    const updateAnimation = (now) => {
      if (now < startTime) {
        animFrame = requestAnimationFrame(updateAnimation);
        return;
      }
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / animDuration);
      // Authentic automotive gauge easing: cubic-bezier(0.16, 1, 0.3, 1) quartic ease out
      const eased = 1 - Math.pow(1 - progress, 4);

      const currentWpm = Math.round(eased * wpm);
      const currentRot = startRot + eased * (targetRotation - startRot);

      setDisplayedWpm(currentWpm);
      setNeedleRotation(Number(currentRot.toFixed(2)));

      if (progress < 1) {
        animFrame = requestAnimationFrame(updateAnimation);
      } else {
        setDisplayedWpm(wpm);
        setNeedleRotation(targetRotation);
        setIsNeedleSettled(true);
      }
    };

    animFrame = requestAnimationFrame(updateAnimation);

    return () => {
      cancelAnimationFrame(animFrame);
    };
  }, [targetRotation, wpm, prefersReducedMotion]);

  // Handle action triggers with navigation lock
  const handleNextAction = useCallback(() => {
    if (isNavigatingRef.current) return;
    if (onNext) {
      isNavigatingRef.current = true;
      onNext();
    } else if (onRetry && !passed) {
      isNavigatingRef.current = true;
      onRetry();
    }
  }, [onNext, onRetry, passed]);

  // Enter shortcut (active only after needle settles, without visible text hint)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' || e.code === 'Enter' || e.code === 'NumpadEnter') {
        const activeTag = document.activeElement?.tagName?.toLowerCase();
        if (activeTag === 'input' || activeTag === 'textarea') return;
        if (!isNeedleSettled) return;
        e.preventDefault();
        handleNextAction();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNeedleSettled, handleNextAction]);

  // Prominent Semicircular SVG Geometry Dimensions
  const cx = 360;
  const cy = 208;
  const rOuterBezel = 210;
  const rOuter = 190;
  const rInner = 144;
  const rLabel = 201;
  const rInnerDial = 142;

  // Generate radial tick marks pointing toward (cx, cy)
  const tickMarks = useMemo(() => {
    const ticks = [];
    const totalTicks = 41; // Across 210° arc (from 195° down to -15°)
    const startAngle = 195;
    const endAngle = -15;

    for (let i = 0; i < totalTicks; i++) {
      const angle = startAngle - (i / (totalTicks - 1)) * (startAngle - endAngle);
      const isMajor = i % 4 === 0;
      const r1 = 140;
      const r2 = isMajor ? 126 : 133;
      const p1 = polarToCartesian(cx, cy, r1, angle);
      const p2 = polarToCartesian(cx, cy, r2, angle);

      ticks.push({
        x1: p1.x.toFixed(1),
        y1: p1.y.toFixed(1),
        x2: p2.x.toFixed(1),
        y2: p2.y.toFixed(1),
        isMajor,
      });
    }
    return ticks;
  }, [cx, cy]);

  // Category Label Paths for <textPath> (Curving clockwise around the outer arc)
  // Angles in polar coords: EXCELLENT (194 -> 154), GOOD (152 -> 112), FAIR (110 -> 70), POOR (68 -> 28), VERY POOR (26 -> -14)
  const labelArcPaths = useMemo(() => ({
    EXCELLENT: describeArc(cx, cy, rLabel, 194, 154),
    GOOD: describeArc(cx, cy, rLabel, 152, 112),
    FAIR: describeArc(cx, cy, rLabel, 110, 70),
    POOR: describeArc(cx, cy, rLabel, 68, 28),
    'VERY POOR': describeArc(cx, cy, rLabel, 26, -14),
  }), [cx, cy, rLabel]);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#080C14] overflow-hidden flex flex-col items-center justify-center p-2 sm:p-4 select-none font-sans"
      style={{
        background: 'radial-gradient(circle at 50% 36%, #141C2E 0%, #090E18 60%, #05080E 100%)',
      }}
    >
      {/* ── Top Header matching Reference Image with Five Stars ───────── */}
      <div className="text-center mb-1 flex flex-col items-center">
        {/* 5-Star Arc Header matching Reference Image */}
        <FiveStarRating earnedCount={earnedStars} />

        <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
          Typing Performance
        </div>
        <div className="flex items-center justify-center gap-2 mt-0.5">
          <span className="text-xs sm:text-sm text-[#7E8D9F] font-medium tracking-wide font-sans">
            Real-time speed overview
          </span>
          {lesson?.title && (
            <>
              <span className="text-slate-600 text-xs">•</span>
              <span className="text-xs text-slate-400 font-semibold">{lesson.title}</span>
            </>
          )}
        </div>
      </div>

      {/* ── Main Speedometer Viewport (Large, Prominent, Semicircular Dome) ── */}
      <div className="w-full max-w-[680px] sm:max-w-[760px] relative flex items-center justify-center -mb-5 sm:-mb-7">
        <svg
          viewBox="0 0 720 340"
          className="w-full h-auto overflow-visible drop-shadow-[0_20px_45px_rgba(0,0,0,0.9)]"
        >
          <defs>
            {/* Outer Bezel Dome Gradient */}
            <radialGradient id="bezelGrad" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#121828" />
              <stop offset="65%" stopColor="#0B101C" />
              <stop offset="100%" stopColor="#060911" />
            </radialGradient>

            {/* Inner Dial Face Gradient */}
            <radialGradient id="dialGrad" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#101726" />
              <stop offset="70%" stopColor="#090E1A" />
              <stop offset="100%" stopColor="#050810" />
            </radialGradient>

            {/* 3D Segment Gradients */}
            <linearGradient id="gradExcellent" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#15803D" />
              <stop offset="100%" stopColor="#22C55E" />
            </linearGradient>

            <linearGradient id="gradGood" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#65A30D" />
              <stop offset="100%" stopColor="#A3E635" />
            </linearGradient>

            <linearGradient id="gradFair" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#D97706" />
              <stop offset="100%" stopColor="#FACC15" />
            </linearGradient>

            <linearGradient id="gradPoor" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#C2410C" />
              <stop offset="100%" stopColor="#FB923C" />
            </linearGradient>

            <linearGradient id="gradVeryPoor" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#B91C1C" />
              <stop offset="100%" stopColor="#EF4444" />
            </linearGradient>

            {/* Needle 3D Bevel: Specular Left Face */}
            <linearGradient id="needleSpecular" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="45%" stopColor="#F1F5F9" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>

            {/* Needle 3D Bevel: Shaded Right Face */}
            <linearGradient id="needleShade" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#94A3B8" />
              <stop offset="55%" stopColor="#64748B" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>

            {/* Metallic Pivot Hub Gradients */}
            <linearGradient id="pivotChromeOuter" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="35%" stopColor="#E2E8F0" />
              <stop offset="70%" stopColor="#94A3B8" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>

            <linearGradient id="pivotCavity" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0B0F19" />
              <stop offset="50%" stopColor="#111827" />
              <stop offset="100%" stopColor="#1E293B" />
            </linearGradient>

            <linearGradient id="pivotChromeInner" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E2E8F0" />
              <stop offset="50%" stopColor="#94A3B8" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>

            {/* Drop Shadows & Glows */}
            <filter id="needleShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="6" dy="10" stdDeviation="6" floodColor="#000000" floodOpacity="0.75" />
            </filter>

            <filter id="activeCategoryGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="7" floodColor="currentColor" floodOpacity="0.95" />
            </filter>

            {/* Clean Dome Clip Boundary tucked behind stats dock */}
            <clipPath id="domeClip">
              <rect x="0" y="0" width="720" height="315" />
            </clipPath>

            {/* Curved Text Paths for Category Labels */}
            <path id="pathExcellent" d={labelArcPaths.EXCELLENT} fill="none" />
            <path id="pathGood" d={labelArcPaths.GOOD} fill="none" />
            <path id="pathFair" d={labelArcPaths.FAIR} fill="none" />
            <path id="pathPoor" d={labelArcPaths.POOR} fill="none" />
            <path id="pathVeryPoor" d={labelArcPaths['VERY POOR']} fill="none" />
          </defs>

          {/* ── Outer Bezel & Inner Dial Circular Housing ───────────────── */}
          <g clipPath="url(#domeClip)">
            <circle
              cx={cx}
              cy={cy}
              r={rOuterBezel}
              fill="url(#bezelGrad)"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1.5"
            />
            <circle
              cx={cx}
              cy={cy}
              r={rInnerDial}
              fill="url(#dialGrad)"
              stroke="#121828"
              strokeWidth="1.5"
            />
          </g>

          {/* ── 5 Semicircular Arc Segments with Colored Glows ───────────── */}
          {/* Segment 1: EXCELLENT (#22C55E) */}
          <path
            d={describeRibbonSegment(cx, cy, rOuter, rInner, 195, 154)}
            fill="url(#gradExcellent)"
            filter="drop-shadow(0 0 16px rgba(34,197,94,0.5))"
          />

          {/* Segment 2: GOOD (#A3E635) */}
          <path
            d={describeRibbonSegment(cx, cy, rOuter, rInner, 152, 112)}
            fill="url(#gradGood)"
            filter="drop-shadow(0 0 14px rgba(163,230,53,0.45))"
          />

          {/* Segment 3: FAIR (#FACC15) */}
          <path
            d={describeRibbonSegment(cx, cy, rOuter, rInner, 110, 70)}
            fill="url(#gradFair)"
            filter="drop-shadow(0 0 14px rgba(250,204,21,0.45))"
          />

          {/* Segment 4: POOR (#FB923C) */}
          <path
            d={describeRibbonSegment(cx, cy, rOuter, rInner, 68, 28)}
            fill="url(#gradPoor)"
            filter="drop-shadow(0 0 14px rgba(249,115,22,0.45))"
          />

          {/* Segment 5: VERY POOR (#EF4444) */}
          <path
            d={describeRibbonSegment(cx, cy, rOuter, rInner, 26, -15)}
            fill="url(#gradVeryPoor)"
            filter="drop-shadow(0 0 18px rgba(239,68,68,0.6))"
          />

          {/* ── Dark Dividing Boundaries between Segments ───────────────── */}
          {[153, 111, 69, 27].map((angle) => {
            const pOuter = polarToCartesian(cx, cy, rOuter + 2, angle);
            const pInner = polarToCartesian(cx, cy, rInner - 2, angle);
            return (
              <line
                key={angle}
                x1={pOuter.x.toFixed(1)}
                y1={pOuter.y.toFixed(1)}
                x2={pInner.x.toFixed(1)}
                y2={pInner.y.toFixed(1)}
                stroke="#080C14"
                strokeWidth="3.5"
              />
            );
          })}

          {/* ── Inner Radial Tick Marks ─────────────────────────────────── */}
          <g strokeLinecap="round">
            {tickMarks.map((t, idx) => (
              <line
                key={idx}
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke={t.isMajor ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.3)'}
                strokeWidth={t.isMajor ? '2.4' : '1.3'}
              />
            ))}
          </g>

          {/* ── Category Labels Hugging the Outer Arc (Coloured per zone) ── */}
          <g fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="12" letterSpacing="1.5">
            {/* EXCELLENT */}
            <text
              fill="#22C55E"
              opacity={category.name === 'EXCELLENT' && isNeedleSettled ? 1 : 0.88}
              filter={category.name === 'EXCELLENT' && isNeedleSettled ? 'url(#activeCategoryGlow)' : undefined}
            >
              <textPath href="#pathExcellent" startOffset="50%" textAnchor="middle">
                EXCELLENT
              </textPath>
            </text>

            {/* GOOD */}
            <text
              fill="#A3E635"
              opacity={category.name === 'GOOD' && isNeedleSettled ? 1 : 0.88}
              filter={category.name === 'GOOD' && isNeedleSettled ? 'url(#activeCategoryGlow)' : undefined}
            >
              <textPath href="#pathGood" startOffset="50%" textAnchor="middle">
                GOOD
              </textPath>
            </text>

            {/* FAIR */}
            <text
              fill="#FACC15"
              opacity={category.name === 'FAIR' && isNeedleSettled ? 1 : 0.88}
              filter={category.name === 'FAIR' && isNeedleSettled ? 'url(#activeCategoryGlow)' : undefined}
            >
              <textPath href="#pathFair" startOffset="50%" textAnchor="middle">
                FAIR
              </textPath>
            </text>

            {/* POOR */}
            <text
              fill="#FB923C"
              opacity={category.name === 'POOR' && isNeedleSettled ? 1 : 0.88}
              filter={category.name === 'POOR' && isNeedleSettled ? 'url(#activeCategoryGlow)' : undefined}
            >
              <textPath href="#pathPoor" startOffset="50%" textAnchor="middle">
                POOR
              </textPath>
            </text>

            {/* VERY POOR */}
            <text
              fill="#EF4444"
              opacity={category.name === 'VERY POOR' && isNeedleSettled ? 1 : 0.88}
              filter={category.name === 'VERY POOR' && isNeedleSettled ? 'url(#activeCategoryGlow)' : undefined}
            >
              <textPath href="#pathVeryPoor" startOffset="50%" textAnchor="middle">
                VERY POOR
              </textPath>
            </text>
          </g>

          {/* ── Realistic 3D Chiseled Metallic Needle ────────────────────── */}
          <g
            transform={`rotate(${needleRotation}, ${cx}, ${cy})`}
            filter="url(#needleShadow)"
          >
            {/* Left Specular Chrome Face */}
            <polygon
              points={`${cx - 10},${cy - 20} ${cx},${cy - 144} ${cx},${cy - 20}`}
              fill="url(#needleSpecular)"
            />
            {/* Right Shaded Gunmetal Face */}
            <polygon
              points={`${cx},${cy - 20} ${cx},${cy - 144} ${cx + 10},${cy - 20}`}
              fill="url(#needleShade)"
            />
            {/* Sharp Specular Ridge Line */}
            <line
              x1={cx}
              y1={cy - 144}
              x2={cx}
              y2={cy - 20}
              stroke="#FFFFFF"
              strokeWidth="1.2"
              opacity="0.95"
            />
          </g>

          {/* ── Concentric Metallic Chrome Pivot Hub Assembly ────────────── */}
          {/* Ambient Contact Shadow */}
          <circle cx={cx} cy={cy + 4} r="32" fill="rgba(0,0,0,0.6)" filter="blur(4px)" />
          {/* Outer Brushed Chrome Bevel Ring */}
          <circle cx={cx} cy={cy} r="28" fill="url(#pivotChromeOuter)" stroke="#475569" strokeWidth="1.5" />
          {/* Inner Recessed Dark Cavity */}
          <circle cx={cx} cy={cy} r="19" fill="url(#pivotCavity)" stroke="#1E293B" strokeWidth="1.5" />
          {/* Center Chrome Bearing */}
          <circle cx={cx} cy={cy} r="11" fill="url(#pivotChromeInner)" stroke="#334155" strokeWidth="1" />
          {/* Specular Highlight Dot */}
          <circle cx={cx - 3.5} cy={cy - 3.5} r="2.5" fill="#FFFFFF" opacity="0.9" />

          {/* ── Central Digital Score Display ───────────────────────────── */}
          <g transform={`translate(${cx}, ${cy + 46})`} textAnchor="middle">
            <text
              y="0"
              fill="#FFFFFF"
              fontSize="68"
              fontWeight="950"
              fontFamily="system-ui, -apple-system, sans-serif"
              letterSpacing="-2"
            >
              {isNeedleSettled ? wpm : displayedWpm}
            </text>
            <text
              y="24"
              fill="#7E8D9F"
              fontSize="12"
              fontWeight="800"
              letterSpacing="3"
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              OUT OF 100
            </text>
            <text
              y="44"
              fill={category.color}
              fontSize="14"
              fontWeight="900"
              letterSpacing="2.5"
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              {category.name}
            </text>
          </g>
        </svg>
      </div>

      {/* ── Large Balanced Statistics Dashboard matching Reference Image ─ */}
      <div className="w-full max-w-[740px] sm:max-w-[820px] px-2 z-10">
        <div className="rounded-2xl sm:rounded-3xl bg-[#0B0F19]/95 border border-slate-700/60 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] py-3.5 sm:py-4 px-4 sm:px-8 backdrop-blur-md">
          <div className="grid grid-cols-5 gap-1 sm:gap-2 text-center">
            {/* 1. GROSS WPM */}
            <div className="flex flex-col items-center justify-center px-1">
              <div className="text-[#00E676] mb-1">
                <Gauge className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="text-xl sm:text-2xl font-black font-sans text-white tracking-tight">
                {wpm}
              </div>
              <div className="text-[10px] sm:text-xs font-bold tracking-wider uppercase text-slate-400 mt-0.5">
                WPM
              </div>
            </div>

            {/* 2. ACCURACY */}
            <div className="flex flex-col items-center justify-center px-1">
              <div className="text-[#38BDF8] mb-1">
                <Crosshair className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="text-xl sm:text-2xl font-black font-sans text-white tracking-tight">
                {accuracy}%
              </div>
              <div className="text-[10px] sm:text-xs font-bold tracking-wider uppercase text-slate-400 mt-0.5">
                ACCURACY
              </div>
            </div>

            {/* 3. NET WPM */}
            <div className="flex flex-col items-center justify-center px-1">
              <div className="text-[#A855F7] mb-1">
                <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="text-xl sm:text-2xl font-black font-sans text-white tracking-tight">
                {netWpm}
              </div>
              <div className="text-[10px] sm:text-xs font-bold tracking-wider uppercase text-slate-400 mt-0.5">
                NET WPM
              </div>
            </div>

            {/* 4. ERRORS */}
            <div className="flex flex-col items-center justify-center px-1">
              <div className="text-[#F59E0B] mb-1">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="text-xl sm:text-2xl font-black font-sans text-white tracking-tight">
                {mistakes}
              </div>
              <div className="text-[10px] sm:text-xs font-bold tracking-wider uppercase text-slate-400 mt-0.5">
                ERRORS
              </div>
            </div>

            {/* 5. TIME */}
            <div className="flex flex-col items-center justify-center px-1">
              <div className="text-[#F43F5E] mb-1">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="text-xl sm:text-2xl font-black font-sans text-white tracking-tight">
                {duration}s
              </div>
              <div className="text-[10px] sm:text-xs font-bold tracking-wider uppercase text-slate-400 mt-0.5">
                TIME
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3 Action Buttons ────────────────────────────────────────────── */}
      <div className="w-full max-w-[560px] flex items-center justify-center gap-3 mt-3 sm:mt-4 px-2">
        {/* TRY AGAIN */}
        <button
          type="button"
          onClick={onRetry}
          className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700/80 bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-bold font-mono text-xs uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-md"
        >
          <RotateCcw className="w-4 h-4 text-slate-400" />
          <span>Try Again</span>
        </button>

        {/* BACK TO ACADEMY */}
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700/80 bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-bold font-mono text-xs uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-md"
        >
          <LayoutGrid className="w-4 h-4 text-slate-400" />
          <span>Back to Academy</span>
        </button>

        {/* NEXT LESSON / NEXT STAGE */}
        <button
          type="button"
          onClick={handleNextAction}
          disabled={!passed && !onNext}
          className={`flex-[1.2] py-2.5 px-4 rounded-xl font-black font-mono text-xs uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 shadow-lg ${
            passed || onNext
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:brightness-110 shadow-emerald-500/25 cursor-pointer active:scale-98'
              : 'bg-slate-800/60 text-slate-500 border border-slate-700/40 cursor-not-allowed'
          }`}
        >
          <span>{hasNextStage && !hasNextLesson ? 'Next Stage' : 'Next Lesson'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AcademyResultsScreen;
