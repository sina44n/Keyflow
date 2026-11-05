/**
 * KEYFLOW Academy Performance Results Screen
 * ==========================================
 * Full-page, automotive-style Typing Performance Dashboard.
 * Faithfully reproduces the high-end instrument-cluster speedometer reference image.
 *
 * Core Specifications:
 * - 5-zone semicircular speedometer (EXCELLENT, GOOD, FAIR, POOR, VERY POOR from left to right)
 * - True curved category labels along the outer arc perimeter via SVG <textPath>
 * - Thick, vibrant colored arc with dark dividing segment seams
 * - Chiseled 3D metallic silver/chrome needle with two-tone bevel & central ridge
 * - Multi-ring concentric chrome pivot hub
 * - Inner dial with evenly spaced major and minor radial tick marks
 * - Central WPM readout ("OUT OF 100") with dynamic active category highlight
 * - Smooth sweep animation from rightmost VERY POOR (+105°) to actual WPM position
 * - Delayed Typing Identity reveal upon needle settling
 * - 5 horizontal telemetry metric cards (WPM, ACCURACY, NET WPM, ERRORS, TIME)
 * - 3 prominent action buttons: TRY AGAIN, BACK TO ACADEMY, NEXT LESSON
 * - Keyboard ENTER shortcut (active after needle settles, without visible hint text)
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
  Trophy,
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

  // Phase 7: Strict full-viewport lock (no vertical/horizontal scroll, no footer peek)
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
    }, 100);

    // Number counter interpolation
    const animDuration = 1200;
    const startTime = performance.now() + 100;
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
    }, 1350);

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

  // Phase 6 & Phase 8: Enter shortcut (active only after needle settles, without visible text hint)
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
  const cy = 255;
  const rOuter = 186;
  const rInner = 146;
  const rLabel = 210;

  // Generate radial tick marks pointing toward (cx, cy)
  const tickMarks = useMemo(() => {
    const ticks = [];
    const totalTicks = 41; // Every 5.25 degrees across the 210° arc (from 195° down to -15°)
    const startAngle = 195;
    const endAngle = -15;

    for (let i = 0; i < totalTicks; i++) {
      const angle = startAngle - (i / (totalTicks - 1)) * (startAngle - endAngle);
      const isMajor = i % 4 === 0;
      const r1 = 142;
      const r2 = isMajor ? 128 : 134;
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
  // Angles in polar coords: EXCELLENT (195 -> 153), GOOD (153 -> 111), FAIR (111 -> 69), POOR (69 -> 27), VERY POOR (27 -> -15)
  const labelArcPaths = useMemo(() => ({
    EXCELLENT: describeArc(cx, cy, rLabel, 195, 153),
    GOOD: describeArc(cx, cy, rLabel, 153, 111),
    FAIR: describeArc(cx, cy, rLabel, 111, 69),
    POOR: describeArc(cx, cy, rLabel, 69, 27),
    'VERY POOR': describeArc(cx, cy, rLabel, 27, -15),
  }), [cx, cy, rLabel]);

  return (
    <div
      className="fixed inset-x-0 bottom-0 top-14 sm:top-16 z-30 bg-[#070B14] overflow-hidden flex flex-col items-center justify-between px-3 sm:px-6 py-2 select-none"
      style={{
        background: 'radial-gradient(ellipse 70% 45% at 50% 20%, #101728 0%, #070B14 100%)',
      }}
    >
      {/* ── Main Speedometer Viewport ───────────────────────────────────── */}
      <div className="flex-1 min-h-0 w-full max-w-2xl flex items-center justify-center relative">
        <svg
          viewBox="0 0 600 425"
          className="w-full h-full max-h-[50vh] sm:max-h-[54vh] overflow-visible drop-shadow-[0_15px_35px_rgba(0,0,0,0.85)]"
        >
          <defs>
            {/* Outer Bezel Radial Gradient */}
            <radialGradient id="bezelGrad" cx="50%" cy="50%" r="50%">
              <stop offset="65%" stopColor="#0B101D" />
              <stop offset="88%" stopColor="#151D2E" />
              <stop offset="96%" stopColor="#25324A" />
              <stop offset="100%" stopColor="#080C14" />
            </radialGradient>

            {/* Inner Dial Face Gradient */}
            <radialGradient id="dialGrad" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#141C2E" />
              <stop offset="70%" stopColor="#0D1322" />
              <stop offset="100%" stopColor="#080C14" />
            </radialGradient>

            {/* Needle 3D Bevel: Specular Left Face */}
            <linearGradient id="needleSpecular" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="40%" stopColor="#F1F5F9" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>

            {/* Needle 3D Bevel: Shaded Right Face */}
            <linearGradient id="needleShade" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#94A3B8" />
              <stop offset="50%" stopColor="#64748B" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>

            {/* Metallic Pivot Hub Gradients */}
            <linearGradient id="pivotChromeOuter" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E2E8F0" />
              <stop offset="45%" stopColor="#94A3B8" />
              <stop offset="100%" stopColor="#1E293B" />
            </linearGradient>

            <linearGradient id="pivotCore" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0A0E1A" />
              <stop offset="50%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>

            {/* Drop Shadows & Glows */}
            <filter id="needleGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="3" dy="6" stdDeviation="4" floodColor="#000000" floodOpacity="0.8" />
            </filter>

            <filter id="activeCategoryGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="currentColor" floodOpacity="0.9" />
            </filter>

            {/* Curved Text Paths for Category Labels */}
            <path id="pathExcellent" d={labelArcPaths.EXCELLENT} fill="none" />
            <path id="pathGood" d={labelArcPaths.GOOD} fill="none" />
            <path id="pathFair" d={labelArcPaths.FAIR} fill="none" />
            <path id="pathPoor" d={labelArcPaths.POOR} fill="none" />
            <path id="pathVeryPoor" d={labelArcPaths['VERY POOR']} fill="none" />
          </defs>

          {/* ── Outer Metallic Bezel Hood ───────────────────────────────── */}
          <path
            d="M 64 325 A 244 244 0 1 1 536 325 L 490 315 A 198 198 0 1 0 110 315 Z"
            fill="url(#bezelGrad)"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1.5"
          />

          {/* ── Dark Recessed Channel under Arc ─────────────────────────── */}
          <path
            d="M 116.5 304 A 190 190 0 1 1 483.5 304 L 440.4 293 A 145 145 0 1 0 159.9 293 Z"
            fill="#070A12"
            stroke="#101726"
            strokeWidth="2"
          />

          {/* ── Inner Dial Face ─────────────────────────────────────────── */}
          <circle cx={cx} cy={cy} r="142" fill="url(#dialGrad)" stroke="#151D2E" strokeWidth="1.5" />

          {/* ── 5 Thick Colored Semicircular Arc Segments ───────────────── */}
          {/* Segment 1: EXCELLENT (#39D353) 195° -> 153° */}
          <path
            d={describeRibbonSegment(cx, cy, rOuter, rInner, 195, 153)}
            fill="#39D353"
            filter="drop-shadow(0 0 6px rgba(57,211,83,0.4))"
          />

          {/* Segment 2: GOOD (#A3E635) 153° -> 111° */}
          <path
            d={describeRibbonSegment(cx, cy, rOuter, rInner, 153, 111)}
            fill="#A3E635"
            filter="drop-shadow(0 0 6px rgba(163,230,53,0.4))"
          />

          {/* Segment 3: FAIR (#FACC15) 111° -> 69° */}
          <path
            d={describeRibbonSegment(cx, cy, rOuter, rInner, 111, 69)}
            fill="#FACC15"
            filter="drop-shadow(0 0 6px rgba(250,204,21,0.4))"
          />

          {/* Segment 4: POOR (#F97316) 69° -> 27° */}
          <path
            d={describeRibbonSegment(cx, cy, rOuter, rInner, 69, 27)}
            fill="#F97316"
            filter="drop-shadow(0 0 6px rgba(249,115,22,0.4))"
          />

          {/* Segment 5: VERY POOR (#EF4444) 27° -> -15° */}
          <path
            d={describeRibbonSegment(cx, cy, rOuter, rInner, 27, -15)}
            fill="#EF4444"
            filter="drop-shadow(0 0 6px rgba(239,68,68,0.4))"
          />

          {/* ── Dark Dividing Boundaries between Segments ───────────────── */}
          {/* Dividers at 153°, 111°, 69°, 27° */}
          {[153, 111, 69, 27].map((angle) => {
            const pOuter = polarToCartesian(cx, cy, rOuter + 1, angle);
            const pInner = polarToCartesian(cx, cy, rInner - 1, angle);
            return (
              <line
                key={angle}
                x1={pOuter.x.toFixed(1)}
                y1={pOuter.y.toFixed(1)}
                x2={pInner.x.toFixed(1)}
                y2={pInner.y.toFixed(1)}
                stroke="#080C14"
                strokeWidth="3"
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
                stroke={t.isMajor ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.22)'}
                strokeWidth={t.isMajor ? '2' : '1'}
              />
            ))}
          </g>

          {/* ── Curved Category Labels (Hugging the Outer Perimeter) ─────── */}
          <g font-family="system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="12" letterSpacing="1.8">
            {/* EXCELLENT */}
            <text
              fill="#39D353"
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
              fill="#F97316"
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
                : 'transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            filter="url(#needleGlow)"
          >
            {/* Left Specular Chrome Face */}
            <polygon points={`${cx - 9},${cy} ${cx},${cy - 146} ${cx},${cy}`} fill="url(#needleSpecular)" />
            {/* Right Shaded Gunmetal Face */}
            <polygon points={`${cx},${cy} ${cx},${cy - 146} ${cx + 9},${cy}`} fill="url(#needleShade)" />
            {/* Sharp Specular Ridge Line */}
            <line x1={cx} y1={cy - 146} x2={cx} y2={cy} stroke="#FFFFFF" strokeWidth="1.2" opacity="0.9" />
          </g>

          {/* ── Concentric Metallic Chrome Pivot Hub Assembly ────────────── */}
          <circle cx={cx} cy={cy + 3} r="25" fill="rgba(0,0,0,0.6)" filter="blur(3px)" />
          <circle cx={cx} cy={cy} r="23" fill="url(#pivotChromeOuter)" stroke="#334155" strokeWidth="1.5" />
          <circle cx={cx} cy={cy} r="17" fill="#0A0E1A" stroke="#1E293B" strokeWidth="1" />
          <circle cx={cx} cy={cy} r="12" fill="url(#pivotCore)" stroke="#64748B" strokeWidth="0.8" />
          <circle cx={cx - 4} cy={cy - 4} r="3" fill="#FFFFFF" opacity="0.65" />

          {/* ── Central Digital Score Display ───────────────────────────── */}
          <g transform={`translate(${cx}, ${cy + 52})`} textAnchor="middle">
            <text
              y="0"
              fill="#FFFFFF"
              fontSize="52"
              fontWeight="900"
              fontFamily="system-ui, -apple-system, sans-serif"
              letterSpacing="-1"
            >
              {displayedWpm}
            </text>
            <text
              y="22"
              fill="#64748B"
              fontSize="11"
              fontWeight="700"
              letterSpacing="2"
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              OUT OF 100
            </text>
            <text
              y="42"
              fill={category.color}
              fontSize="13"
              fontWeight="900"
              letterSpacing="2"
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              {category.name}
            </text>
          </g>
        </svg>
      </div>

      {/* ── Typing Identity Reveal Badge ─────────────────────────────────── */}
      <div
        className={`w-full max-w-md my-1 transition-all duration-500 transform ${
          isNeedleSettled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        <div
          className="px-4 py-1.5 sm:py-2 rounded-xl bg-slate-900/60 border text-center shadow-lg backdrop-blur-md"
          style={{ borderColor: `${identity.badgeColor}55` }}
        >
          <div
            className="text-xs font-mono font-black tracking-widest uppercase flex items-center justify-center gap-1.5"
            style={{ color: identity.badgeColor }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{identity.title}</span>
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <p className="text-[11px] text-slate-300 mt-0.5 font-medium line-clamp-1">
            {identity.description}
          </p>
        </div>
      </div>

      {/* ── 5 Horizontal Telemetry Metrics Cards ─────────────────────────── */}
      <div className="w-full max-w-3xl my-1">
        <div className="grid grid-cols-5 rounded-2xl bg-[#0D121F] border border-slate-800/80 shadow-2xl py-2.5 sm:py-3 px-1 sm:px-2 divide-x divide-slate-800/60 text-center">
          {/* 1. GROSS WPM */}
          <div className="flex flex-col items-center justify-center px-1">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center mb-1 text-[#39D353]">
              <Gauge className="w-3.5 h-3.5" />
            </div>
            <div className="text-lg sm:text-xl font-black font-mono text-white tracking-tight">
              {wpm}
            </div>
            <div className="text-[9px] sm:text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400 mt-0.5">
              WPM
            </div>
          </div>

          {/* 2. ACCURACY */}
          <div className="flex flex-col items-center justify-center px-1">
            <div className="w-7 h-7 rounded-lg bg-sky-500/15 flex items-center justify-center mb-1 text-[#38BDF8]">
              <Crosshair className="w-3.5 h-3.5" />
            </div>
            <div className="text-lg sm:text-xl font-black font-mono text-white tracking-tight">
              {accuracy}%
            </div>
            <div className="text-[9px] sm:text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400 mt-0.5">
              ACCURACY
            </div>
          </div>

          {/* 3. NET WPM */}
          <div className="flex flex-col items-center justify-center px-1">
            <div className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center mb-1 text-[#A855F7]">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <div className="text-lg sm:text-xl font-black font-mono text-white tracking-tight">
              {netWpm}
            </div>
            <div className="text-[9px] sm:text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400 mt-0.5">
              NET WPM
            </div>
          </div>

          {/* 4. ERRORS */}
          <div className="flex flex-col items-center justify-center px-1">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center mb-1 text-[#F59E0B]">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <div className="text-lg sm:text-xl font-black font-mono text-white tracking-tight">
              {mistakes}
            </div>
            <div className="text-[9px] sm:text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400 mt-0.5">
              ERRORS
            </div>
          </div>

          {/* 5. TIME */}
          <div className="flex flex-col items-center justify-center px-1">
            <div className="w-7 h-7 rounded-lg bg-rose-500/15 flex items-center justify-center mb-1 text-[#F43F5E]">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div className="text-lg sm:text-xl font-black font-mono text-white tracking-tight">
              {duration}s
            </div>
            <div className="text-[9px] sm:text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400 mt-0.5">
              TIME
            </div>
          </div>
        </div>
      </div>

      {/* ── 3 Action Buttons ────────────────────────────────────────────── */}
      <div className="w-full max-w-xl flex items-center justify-center gap-3 pt-1 pb-1 sm:pb-2">
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
