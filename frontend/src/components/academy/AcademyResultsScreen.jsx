/**
 * KEYFLOW Academy Performance Results Screen
 * ==========================================
 * Full-page, automotive-style Typing Performance Dashboard.
 * Faithfully reproduces the high-end instrument-cluster speedometer reference image.
 *
 * Visual Specifications matching Reference Image:
 * - Clean centered header: "Typing Performance" / "Real-time speed overview"
 * - Deep midnight vignette canvas with soft centered radial spotlight
 * - 5-zone semicircular speedometer (EXCELLENT, GOOD, FAIR, POOR, VERY POOR)
 * - Category labels curving tightly along the outer arc, in their respective zone colors
 * - Volumetric colored arc segments with authentic colored ambient drop-shadows
 * - Dark dividing segment seams between zones
 * - Concentric dark bezel housing with inner radial dial plate and crisp tick marks
 * - Chiseled 3D metallic silver/chrome needle with two-tone bevel & central specular ridge
 * - Concentric metallic chrome donut pivot hub
 * - Central digital readout ("OUT OF 100") with dynamic category highlight
 * - Smooth sweep animation from rightmost VERY POOR (+105°) to actual WPM position
 * - Floating single-dock telemetry panel with 5 vibrant neon icon slots
 * - 3 clean action buttons (Try Again, Back to Academy, Next Lesson)
 * - Strict full-viewport fitting with zero page scrolling and zero footer visibility
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
  Sparkles,
} from 'lucide-react';

import {
  SPEED_CATEGORIES,
  getSpeedCategory,
  wpmToNeedleRotation,
  getTypingIdentity,
  polarToCartesian,
  describeArc,
  describeRibbonSegment,
} from '../../utils/speedometerEngine';

export const AcademyResultsScreen = ({
  lesson,
  result,
  onRetry,
  onBack,
  onNext,
  hasNextLesson = false,
  hasNextStage = false,
}) => {
  // Extract authenticated metrics
  const wpm = Math.max(0, Math.round(result?.wpm || 0));
  const accuracy = Math.max(0, Math.min(100, Math.round(result?.accuracy || 100)));
  const mistakes = Math.max(0, result?.mistakes || 0);
  const duration = Math.max(1, result?.duration || 1);
  const passed = Boolean(result?.passed);

  // Net WPM (retained accurately per Phase 8)
  const netWpm = Math.max(
    0,
    result?.netWpm !== undefined
      ? Math.round(result.netWpm)
      : Math.round(wpm - (mistakes / Math.max(duration / 60, 0.016)))
  );

  const category = useMemo(() => getSpeedCategory(wpm), [wpm]);
  const identity = useMemo(() => getTypingIdentity(wpm, accuracy), [wpm, accuracy]);
  const targetRotation = useMemo(() => wpmToNeedleRotation(wpm), [wpm]);

  // Phase 5: Needle starts from VERY POOR (rightmost end, +105°)
  const [needleRotation, setNeedleRotation] = useState(105);
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

  // Needle and WPM counter animation
  useEffect(() => {
    if (prefersReducedMotion) {
      setNeedleRotation(targetRotation);
      setDisplayedWpm(wpm);
      setIsNeedleSettled(true);
      return;
    }

    // Initialize at rightmost end (+105°)
    setNeedleRotation(105);
    setDisplayedWpm(0);
    setIsNeedleSettled(false);

    // Start needle sweep towards target
    const startTimer = setTimeout(() => {
      setNeedleRotation(targetRotation);
    }, 80);

    // Number counter interpolation
    const animDuration = 1000;
    const startTime = performance.now() + 80;
    let animFrame;

    const updateCounter = (now) => {
      if (now < startTime) {
        animFrame = requestAnimationFrame(updateCounter);
        return;
      }
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / animDuration);
      // Easing out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayedWpm(Math.round(eased * wpm));

      if (progress < 1) {
        animFrame = requestAnimationFrame(updateCounter);
      } else {
        setDisplayedWpm(wpm);
      }
    };

    animFrame = requestAnimationFrame(updateCounter);

    // Settle identity & Enter shortcut after animation finishes
    const settleTimer = setTimeout(() => {
      setIsNeedleSettled(true);
      setNeedleRotation(targetRotation);
      setDisplayedWpm(wpm);
    }, 1150);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(settleTimer);
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

  // SVG Geometry Dimensions
  const cx = 300;
  const cy = 230;
  const rOuter = 192;
  const rInner = 148;
  const rLabel = 216;

  // Generate radial tick marks pointing toward (cx, cy)
  const tickMarks = useMemo(() => {
    const ticks = [];
    const totalTicks = 41; // Across 210° arc (from 195° down to -15°)
    const startAngle = 195;
    const endAngle = -15;

    for (let i = 0; i < totalTicks; i++) {
      const angle = startAngle - (i / (totalTicks - 1)) * (startAngle - endAngle);
      const isMajor = i % 4 === 0;
      const r1 = 144;
      const r2 = isMajor ? 128 : 135;
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
      className="fixed inset-0 z-50 bg-[#080C14] overflow-hidden flex flex-col items-center justify-between py-2 sm:py-3 px-3 sm:px-6 select-none"
      style={{
        background: 'radial-gradient(circle at 50% 36%, #131B2C 0%, #090E18 60%, #05080E 100%)',
      }}
    >
      {/* ── Top Header matching Reference Image ───────────────────────── */}
      <div className="text-center pt-1 sm:pt-2">
        <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
          Typing Performance
        </div>
        <div className="text-xs sm:text-sm text-[#7E8D9F] font-medium mt-0.5 tracking-wide font-sans">
          Real-time speed overview
        </div>
      </div>

      {/* ── Main Speedometer Viewport ───────────────────────────────────── */}
      <div className="flex-1 min-h-0 w-full max-w-lg sm:max-w-xl flex items-center justify-center relative my-auto">
        <svg
          viewBox="0 0 600 375"
          className="w-full h-full max-h-[48vh] sm:max-h-[52vh] overflow-visible drop-shadow-[0_20px_40px_rgba(0,0,0,0.85)]"
        >
          <defs>
            {/* Outer Bezel Dome Gradient */}
            <radialGradient id="bezelGrad" cx="50%" cy="45%" r="55%">
              <stop offset="60%" stopColor="#0D1322" />
              <stop offset="85%" stopColor="#141D2E" />
              <stop offset="97%" stopColor="#1E2A3E" />
              <stop offset="100%" stopColor="#080C14" />
            </radialGradient>

            {/* Inner Dial Face Gradient */}
            <radialGradient id="dialGrad" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#121828" />
              <stop offset="70%" stopColor="#0A0F1B" />
              <stop offset="100%" stopColor="#060911" />
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
              <stop offset="0%" stopColor="#F8FAFC" />
              <stop offset="40%" stopColor="#94A3B8" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>

            <linearGradient id="pivotCore" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0A0E1A" />
              <stop offset="50%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>

            {/* Drop Shadows & Glows */}
            <filter id="needleShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="4" dy="8" stdDeviation="5" floodColor="#000000" floodOpacity="0.85" />
            </filter>

            <filter id="activeCategoryGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="currentColor" floodOpacity="0.95" />
            </filter>

            {/* Curved Text Paths for Category Labels */}
            <path id="pathExcellent" d={labelArcPaths.EXCELLENT} fill="none" />
            <path id="pathGood" d={labelArcPaths.GOOD} fill="none" />
            <path id="pathFair" d={labelArcPaths.FAIR} fill="none" />
            <path id="pathPoor" d={labelArcPaths.POOR} fill="none" />
            <path id="pathVeryPoor" d={labelArcPaths['VERY POOR']} fill="none" />
          </defs>

          {/* ── Dark Housing Disc & Recessed Bezel Track ─────────────────── */}
          <circle
            cx={cx}
            cy={cy}
            r="234"
            fill="url(#bezelGrad)"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1.5"
          />

          {/* ── Inner Dial Face ─────────────────────────────────────────── */}
          <circle
            cx={cx}
            cy={cy}
            r="144"
            fill="url(#dialGrad)"
            stroke="#121828"
            strokeWidth="1.5"
          />

          {/* ── 5 Semicircular Arc Segments with Colored Glows ───────────── */}
          {/* Segment 1: EXCELLENT (#22C55E) */}
          <path
            d={describeRibbonSegment(cx, cy, rOuter, rInner, 195, 154)}
            fill="url(#gradExcellent)"
            filter="drop-shadow(0 0 14px rgba(34,197,94,0.45))"
          />

          {/* Segment 2: GOOD (#A3E635) */}
          <path
            d={describeRibbonSegment(cx, cy, rOuter, rInner, 152, 112)}
            fill="url(#gradGood)"
            filter="drop-shadow(0 0 12px rgba(163,230,53,0.4))"
          />

          {/* Segment 3: FAIR (#FACC15) */}
          <path
            d={describeRibbonSegment(cx, cy, rOuter, rInner, 110, 70)}
            fill="url(#gradFair)"
            filter="drop-shadow(0 0 12px rgba(250,204,21,0.4))"
          />

          {/* Segment 4: POOR (#FB923C) */}
          <path
            d={describeRibbonSegment(cx, cy, rOuter, rInner, 68, 28)}
            fill="url(#gradPoor)"
            filter="drop-shadow(0 0 12px rgba(249,115,22,0.4))"
          />

          {/* Segment 5: VERY POOR (#EF4444) */}
          <path
            d={describeRibbonSegment(cx, cy, rOuter, rInner, 26, -15)}
            fill="url(#gradVeryPoor)"
            filter="drop-shadow(0 0 16px rgba(239,68,68,0.55))"
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
                stroke={t.isMajor ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.25)'}
                strokeWidth={t.isMajor ? '2' : '1.2'}
              />
            ))}
          </g>

          {/* ── Category Labels Hugging the Outer Arc (Coloured per zone) ── */}
          <g fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="12" letterSpacing="1.6">
            {/* EXCELLENT */}
            <text
              fill="#22C55E"
              opacity={category.name === 'EXCELLENT' && isNeedleSettled ? 1 : 0.85}
              filter={category.name === 'EXCELLENT' && isNeedleSettled ? 'url(#activeCategoryGlow)' : undefined}
            >
              <textPath href="#pathExcellent" startOffset="50%" textAnchor="middle">
                EXCELLENT
              </textPath>
            </text>

            {/* GOOD */}
            <text
              fill="#A3E635"
              opacity={category.name === 'GOOD' && isNeedleSettled ? 1 : 0.85}
              filter={category.name === 'GOOD' && isNeedleSettled ? 'url(#activeCategoryGlow)' : undefined}
            >
              <textPath href="#pathGood" startOffset="50%" textAnchor="middle">
                GOOD
              </textPath>
            </text>

            {/* FAIR */}
            <text
              fill="#FACC15"
              opacity={category.name === 'FAIR' && isNeedleSettled ? 1 : 0.85}
              filter={category.name === 'FAIR' && isNeedleSettled ? 'url(#activeCategoryGlow)' : undefined}
            >
              <textPath href="#pathFair" startOffset="50%" textAnchor="middle">
                FAIR
              </textPath>
            </text>

            {/* POOR */}
            <text
              fill="#FB923C"
              opacity={category.name === 'POOR' && isNeedleSettled ? 1 : 0.85}
              filter={category.name === 'POOR' && isNeedleSettled ? 'url(#activeCategoryGlow)' : undefined}
            >
              <textPath href="#pathPoor" startOffset="50%" textAnchor="middle">
                POOR
              </textPath>
            </text>

            {/* VERY POOR */}
            <text
              fill="#EF4444"
              opacity={category.name === 'VERY POOR' && isNeedleSettled ? 1 : 0.85}
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
            style={{
              transition: prefersReducedMotion
                ? 'none'
                : 'transform 1s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            filter="url(#needleShadow)"
          >
            {/* Left Specular Chrome Face */}
            <polygon points={`${cx - 8},${cy} ${cx},${cy - 146} ${cx},${cy}`} fill="url(#needleSpecular)" />
            {/* Right Shaded Gunmetal Face */}
            <polygon points={`${cx},${cy} ${cx},${cy - 146} ${cx + 8},${cy}`} fill="url(#needleShade)" />
            {/* Sharp Specular Ridge Line */}
            <line x1={cx} y1={cy - 146} x2={cx} y2={cy} stroke="#FFFFFF" strokeWidth="1.2" opacity="0.95" />
          </g>

          {/* ── Concentric Metallic Chrome Pivot Hub Assembly ────────────── */}
          <circle cx={cx} cy={cy + 3} r="25" fill="rgba(0,0,0,0.6)" filter="blur(3px)" />
          <circle cx={cx} cy={cy} r="23" fill="url(#pivotChromeOuter)" stroke="#475569" strokeWidth="1.5" />
          <circle cx={cx} cy={cy} r="16" fill="#0B0F19" stroke="#1E293B" strokeWidth="1" />
          <circle cx={cx} cy={cy} r="11" fill="url(#pivotCore)" stroke="#64748B" strokeWidth="0.8" />
          <circle cx={cx - 4} cy={cy - 4} r="3" fill="#FFFFFF" opacity="0.75" />

          {/* ── Central Digital Score Display ───────────────────────────── */}
          <g transform={`translate(${cx}, ${cy + 52})`} textAnchor="middle">
            <text
              y="0"
              fill="#FFFFFF"
              fontSize="56"
              fontWeight="900"
              fontFamily="system-ui, -apple-system, sans-serif"
              letterSpacing="-1.5"
            >
              {displayedWpm}
            </text>
            <text
              y="22"
              fill="#64748B"
              fontSize="11"
              fontWeight="700"
              letterSpacing="2.5"
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              OUT OF 100
            </text>
            <text
              y="42"
              fill={category.color}
              fontSize="13"
              fontWeight="800"
              letterSpacing="2"
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              {category.name}
            </text>
          </g>
        </svg>
      </div>

      {/* ── Subtle Typing Identity Tag ─────────────────────────────────── */}
      <div
        className={`my-0.5 transition-all duration-500 transform ${
          isNeedleSettled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
        }`}
      >
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/60 border text-[11px] font-bold tracking-wider uppercase backdrop-blur-sm"
          style={{
            borderColor: `${identity.badgeColor}44`,
            color: identity.badgeColor,
          }}
        >
          <Sparkles className="w-3 h-3" />
          <span>{identity.title}</span>
        </div>
      </div>

      {/* ── Single Floating Telemetry Dock matching Reference Image ─────── */}
      <div className="w-full max-w-2xl px-2 my-1">
        <div className="rounded-2xl sm:rounded-3xl bg-[#0E1422]/95 border border-slate-700/50 shadow-[0_20px_50px_rgba(0,0,0,0.85)] py-3 sm:py-4 px-3 sm:px-6 backdrop-blur-md">
          <div className="grid grid-cols-5 gap-1 sm:gap-2 text-center">
            {/* 1. GROSS WPM */}
            <div className="flex flex-col items-center justify-center">
              <div className="text-[#00E676] mb-1">
                <Gauge className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="text-lg sm:text-2xl font-black font-mono text-white tracking-tight">
                {wpm}
              </div>
              <div className="text-[9px] sm:text-[11px] font-bold tracking-wider uppercase text-slate-400 mt-0.5">
                WPM
              </div>
            </div>

            {/* 2. ACCURACY */}
            <div className="flex flex-col items-center justify-center">
              <div className="text-[#38BDF8] mb-1">
                <Crosshair className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="text-lg sm:text-2xl font-black font-mono text-white tracking-tight">
                {accuracy}%
              </div>
              <div className="text-[9px] sm:text-[11px] font-bold tracking-wider uppercase text-slate-400 mt-0.5">
                ACCURACY
              </div>
            </div>

            {/* 3. NET WPM */}
            <div className="flex flex-col items-center justify-center">
              <div className="text-[#A855F7] mb-1">
                <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="text-lg sm:text-2xl font-black font-mono text-white tracking-tight">
                {netWpm}
              </div>
              <div className="text-[9px] sm:text-[11px] font-bold tracking-wider uppercase text-slate-400 mt-0.5">
                NET WPM
              </div>
            </div>

            {/* 4. ERRORS */}
            <div className="flex flex-col items-center justify-center">
              <div className="text-[#F59E0B] mb-1">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="text-lg sm:text-2xl font-black font-mono text-white tracking-tight">
                {mistakes}
              </div>
              <div className="text-[9px] sm:text-[11px] font-bold tracking-wider uppercase text-slate-400 mt-0.5">
                ERRORS
              </div>
            </div>

            {/* 5. TIME */}
            <div className="flex flex-col items-center justify-center">
              <div className="text-[#F43F5E] mb-1">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="text-lg sm:text-2xl font-black font-mono text-white tracking-tight">
                {duration}s
              </div>
              <div className="text-[9px] sm:text-[11px] font-bold tracking-wider uppercase text-slate-400 mt-0.5">
                TIME
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3 Action Buttons ────────────────────────────────────────────── */}
      <div className="w-full max-w-xl flex items-center justify-center gap-3 pt-1 pb-1 sm:pb-3 px-2">
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
