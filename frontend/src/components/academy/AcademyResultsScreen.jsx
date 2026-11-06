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
  // Extract authenticated metrics from actual completed session
  const wpm = Math.max(0, Math.round(result?.wpm || 0));
  const accuracy = Math.max(0, Math.min(100, Math.round(result?.accuracy || 100)));
  const mistakes = Math.max(0, result?.mistakes || 0);
  const duration = Math.max(1, result?.duration || 1);
  const passed = Boolean(result?.passed);

  // Authoritative Net WPM
  const netWpm = Math.max(
    0,
    result?.netWpm !== undefined
      ? Math.round(result.netWpm)
      : Math.round(wpm - (mistakes / Math.max(duration / 60, 0.016)))
  );

  // Synchronized score, category, and needle rotation
  const category = useMemo(() => getSpeedCategory(wpm), [wpm]);
  const identity = useMemo(() => getTypingIdentity(wpm, accuracy), [wpm, accuracy]);
  const targetRotation = useMemo(() => wpmToNeedleRotation(wpm), [wpm]);

  // Needle animation state
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
    }, 60);

    // Number counter interpolation
    const animDuration = 900;
    const startTime = performance.now() + 60;
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

    // Settle needle & Enter shortcut after animation finishes
    const settleTimer = setTimeout(() => {
      setIsNeedleSettled(true);
      setNeedleRotation(targetRotation);
      setDisplayedWpm(wpm);
    }, 1050);

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

  // Prominent Semicircular SVG Geometry Dimensions
  const cx = 340;
  const cy = 236;
  const rOuter = 216;
  const rInner = 170;
  const rLabel = 242;
  const rDial = 166;
  const rBezel = 232;

  // Generate radial tick marks pointing toward (cx, cy)
  const tickMarks = useMemo(() => {
    const ticks = [];
    const totalTicks = 41; // Across 210° arc (from 195° down to -15°)
    const startAngle = 195;
    const endAngle = -15;

    for (let i = 0; i < totalTicks; i++) {
      const angle = startAngle - (i / (totalTicks - 1)) * (startAngle - endAngle);
      const isMajor = i % 4 === 0;
      const r1 = 164;
      const r2 = isMajor ? 146 : 154;
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
      className="fixed inset-0 z-50 bg-[#080C14] overflow-hidden flex flex-col items-center justify-between py-2 sm:py-3 px-3 sm:px-6 select-none font-sans"
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

      {/* ── Main Speedometer Viewport (Large, Prominent, Semicircular) ── */}
      <div className="flex-1 min-h-0 w-full max-w-2xl sm:max-w-3xl flex items-center justify-center relative my-auto">
        <svg
          viewBox="0 0 680 400"
          className="w-full h-full max-h-[50vh] sm:max-h-[54vh] overflow-visible drop-shadow-[0_20px_45px_rgba(0,0,0,0.9)]"
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
              <feDropShadow dx="5" dy="9" stdDeviation="6" floodColor="#000000" floodOpacity="0.85" />
            </filter>

            <filter id="activeCategoryGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="7" floodColor="currentColor" floodOpacity="0.95" />
            </filter>

            {/* Curved Text Paths for Category Labels */}
            <path id="pathExcellent" d={labelArcPaths.EXCELLENT} fill="none" />
            <path id="pathGood" d={labelArcPaths.GOOD} fill="none" />
            <path id="pathFair" d={labelArcPaths.FAIR} fill="none" />
            <path id="pathPoor" d={labelArcPaths.POOR} fill="none" />
            <path id="pathVeryPoor" d={labelArcPaths['VERY POOR']} fill="none" />
          </defs>

          {/* ── Outer Bezel Semicircular Housing ─────────────────────────── */}
          <circle
            cx={cx}
            cy={cy}
            r={rBezel}
            fill="url(#bezelGrad)"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1.5"
          />

          {/* ── Inner Dial Face ─────────────────────────────────────────── */}
          <circle
            cx={cx}
            cy={cy}
            r={rDial}
            fill="url(#dialGrad)"
            stroke="#121828"
            strokeWidth="1.5"
          />

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
                strokeWidth="4"
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
                stroke={t.isMajor ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.28)'}
                strokeWidth={t.isMajor ? '2.5' : '1.3'}
              />
            ))}
          </g>

          {/* ── Category Labels Hugging the Outer Arc (Coloured per zone) ── */}
          <g fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="13" letterSpacing="1.8">
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
            style={{
              transition: prefersReducedMotion
                ? 'none'
                : 'transform 0.9s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            filter="url(#needleShadow)"
          >
            {/* Left Specular Chrome Face */}
            <polygon points={`${cx - 10},${cy} ${cx},${cy - 168} ${cx},${cy}`} fill="url(#needleSpecular)" />
            {/* Right Shaded Gunmetal Face */}
            <polygon points={`${cx},${cy} ${cx},${cy - 168} ${cx + 10},${cy}`} fill="url(#needleShade)" />
            {/* Sharp Specular Ridge Line */}
            <line x1={cx} y1={cy - 168} x2={cx} y2={cy} stroke="#FFFFFF" strokeWidth="1.5" opacity="0.95" />
          </g>

          {/* ── Concentric Metallic Chrome Pivot Hub Assembly ────────────── */}
          <circle cx={cx} cy={cy + 4} r="30" fill="rgba(0,0,0,0.65)" filter="blur(4px)" />
          <circle cx={cx} cy={cy} r="28" fill="url(#pivotChromeOuter)" stroke="#475569" strokeWidth="2" />
          <circle cx={cx} cy={cy} r="19" fill="#0B0F19" stroke="#1E293B" strokeWidth="1.5" />
          <circle cx={cx} cy={cy} r="13" fill="url(#pivotCore)" stroke="#64748B" strokeWidth="1" />
          <circle cx={cx - 5} cy={cy - 5} r="3.5" fill="#FFFFFF" opacity="0.8" />

          {/* ── Central Digital Score Display ───────────────────────────── */}
          <g transform={`translate(${cx}, ${cy + 56})`} textAnchor="middle">
            <text
              y="0"
              fill="#FFFFFF"
              fontSize="64"
              fontWeight="950"
              fontFamily="system-ui, -apple-system, sans-serif"
              letterSpacing="-2"
            >
              {displayedWpm}
            </text>
            <text
              y="25"
              fill="#64748B"
              fontSize="12"
              fontWeight="800"
              letterSpacing="3"
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              OUT OF 100
            </text>
            <text
              y="48"
              fill={category.color}
              fontSize="15"
              fontWeight="900"
              letterSpacing="2.5"
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

      {/* ── Large Balanced Statistics Dashboard matching Reference Image ─ */}
      <div className="w-full max-w-3xl px-2 my-1">
        <div className="rounded-3xl bg-[#0E1422]/95 border border-slate-700/60 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] py-3 sm:py-4 px-4 sm:px-8 backdrop-blur-md">
          <div className="grid grid-cols-5 gap-2 text-center divide-x divide-slate-800/60">
            {/* 1. GROSS WPM */}
            <div className="flex flex-col items-center justify-center px-1">
              <div className="text-[#00E676] mb-1">
                <Gauge className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight">
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
              <div className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight">
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
              <div className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight">
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
              <div className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight">
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
              <div className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight">
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
