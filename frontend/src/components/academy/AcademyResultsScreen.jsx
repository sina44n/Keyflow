/**
 * KEYFLOW Academy Performance Results Screen
 * ==========================================
 * Full-page, automotive-style Typing Performance Dashboard.
 * Replaces the previous modal-based result popup with a dedicated,
 * cinematic performance evaluation view inspired by high-end vehicle telemetry.
 *
 * Core Capabilities:
 * - 5-zone semicircular speedometer (EXCELLENT, GOOD, FAIR, POOR, VERY POOR)
 * - Mathematically calibrated needle rotation mapping actual WPM to exact angles
 * - Smooth left-to-right needle sweep animation with deceleration easing
 * - Delayed Typing Identity reveal (Precision Master, Speed Performer, etc.)
 * - 5 horizontal metric cards (WPM, Accuracy, Net WPM, Errors, Time)
 * - 3 action buttons: TRY AGAIN, BACK TO ACADEMY, NEXT
 * - Keyboard ENTER shortcut (gated until needle settles, guarded against spamming)
 * - Prefers-reduced-motion accessibility support
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  RotateCcw,
  LayoutGrid,
  ArrowRight,
  Gauge,
  Crosshair,
  Keyboard,
  Activity,
  AlertTriangle,
  Clock,
  Sparkles,
  Trophy,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

import {
  SPEED_CATEGORIES,
  getSpeedCategory,
  wpmToNeedleRotation,
  getTypingIdentity,
  calculateNetWpm,
  polarToCartesian,
  describeArc,
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
  const wpm = Math.max(0, Math.round(result?.wpm || 0));
  const accuracy = Math.max(0, Math.min(100, Math.round(result?.accuracy || 100)));
  const mistakes = Math.max(0, result?.mistakes || 0);
  const duration = Math.max(1, result?.duration || 1);
  const passed = Boolean(result?.passed);
  const totalKeystrokes = Math.max(0, result?.totalKeystrokes || result?.totalStrokes || result?.totalChars || Math.round(wpm * 5 * (duration / 60)));

  // Net WPM calculation: Gross WPM - Uncorrected Errors / Minutes
  const netWpm = Math.max(
    0,
    result?.netWpm !== undefined
      ? Math.round(result.netWpm)
      : Math.round(wpm - (mistakes / Math.max(duration / 60, 0.016)))
  );

  const category = useMemo(() => getSpeedCategory(wpm), [wpm]);
  const identity = useMemo(() => getTypingIdentity(wpm, accuracy), [wpm, accuracy]);
  const targetRotation = useMemo(() => wpmToNeedleRotation(wpm), [wpm]);

  // Starting position: far left (-105° rotation)
  const [needleRotation, setNeedleRotation] = useState(-105);
  const [isNeedleSettled, setIsNeedleSettled] = useState(false);
  const isNavigatingRef = useRef(false);

  // Check for prefers-reduced-motion
  const prefersReducedMotion = typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Animate needle on mount
  useEffect(() => {
    if (prefersReducedMotion) {
      setNeedleRotation(targetRotation);
      setIsNeedleSettled(true);
      return;
    }

    // Set starting position
    setNeedleRotation(-105);
    setIsNeedleSettled(false);

    // Trigger smooth transition to target rotation
    const startTimer = setTimeout(() => {
      setNeedleRotation(targetRotation);
    }, 120);

    // Settle identity & shortcut after animation duration (1600ms transition + delay)
    const settleTimer = setTimeout(() => {
      setIsNeedleSettled(true);
    }, 1800);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(settleTimer);
    };
  }, [targetRotation, prefersReducedMotion]);

  // Handle action triggers with navigation lock to prevent double-calls
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

  const handleRetryAction = useCallback(() => {
    if (isNavigatingRef.current) return;
    if (onRetry) {
      isNavigatingRef.current = true;
      onRetry();
    }
  }, [onRetry]);

  const handleBackAction = useCallback(() => {
    if (isNavigatingRef.current) return;
    if (onBack) {
      isNavigatingRef.current = true;
      onBack();
    }
  }, [onBack]);

  // Keyboard ENTER shortcut: only active after needle animation finishes
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== 'Enter') return;

      // Ignore if needle is still animating
      if (!isNeedleSettled) return;

      // Ignore if user is inside an input, textarea, or contentEditable element
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || document.activeElement?.isContentEditable) {
        return;
      }

      e.preventDefault();
      handleNextAction();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isNeedleSettled, handleNextAction]);

  // Gauge center & radii
  const cx = 270;
  const cy = 245;
  const arcRadius = 190;
  const labelRadius = 225;

  // Generate radial ticks inside the dial
  const ticks = useMemo(() => {
    const tickList = [];
    const totalTicks = 21; // every 5% from 0 to 100
    for (let i = 0; i <= totalTicks; i++) {
      const wpmVal = (i / totalTicks) * 100;
      const polar = 195 - (100 - wpmVal) * 2.1;
      const isMajor = i % 5 === 0;
      const rInner = isMajor ? 154 : 160;
      const rOuter = 168;
      const p1 = polarToCartesian(cx, cy, rInner, polar);
      const p2 = polarToCartesian(cx, cy, rOuter, polar);
      tickList.push({
        id: i,
        x1: p1.x.toFixed(2),
        y1: p1.y.toFixed(2),
        x2: p2.x.toFixed(2),
        y2: p2.y.toFixed(2),
        isMajor,
      });
    }
    return tickList;
  }, [cx, cy]);

  return (
    <div
      className="min-h-screen w-full bg-[#070B14] text-slate-100 flex flex-col justify-between items-center py-6 px-4 sm:px-8 select-none relative overflow-x-hidden font-sans"
      style={{
        backgroundImage: `
          radial-gradient(circle at 50% 32%, rgba(26, 46, 88, 0.28) 0%, rgba(7, 11, 20, 0.98) 72%),
          radial-gradient(circle at 20% 80%, rgba(16, 28, 54, 0.2) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(16, 28, 54, 0.2) 0%, transparent 50%)
        `,
      }}
    >
      {/* ── Top Header ─────────────────────────────────────────────────── */}
      <div className="w-full max-w-4xl text-center pt-2 sm:pt-4 z-10">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-[0.2em] uppercase font-mono drop-shadow-md">
          KEYFLOW PERFORMANCE
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 tracking-wider font-medium">
          Your typing performance at a glance
        </p>
      </div>

      {/* ── Main Speedometer Container ─────────────────────────────────── */}
      <div className="w-full max-w-[620px] flex flex-col items-center justify-center my-auto py-2 z-10">
        <div className="relative w-full aspect-[540/330] max-h-[380px] flex items-center justify-center">
          <svg
            viewBox="0 0 540 330"
            className="w-full h-full overflow-visible drop-shadow-[0_15px_35px_rgba(0,0,0,0.85)]"
          >
            <defs>
              {/* Outer Bezel Radial Gradient */}
              <radialGradient id="bezelGradient" cx="50%" cy="50%" r="50%">
                <stop offset="70%" stopColor="#0B132B" stopOpacity="0.9" />
                <stop offset="95%" stopColor="#1E293B" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#334155" stopOpacity="0.6" />
              </radialGradient>

              {/* Inner Dial Shadow Gradient */}
              <radialGradient id="dialGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#0E1626" />
                <stop offset="75%" stopColor="#0A101D" />
                <stop offset="100%" stopColor="#060A14" />
              </radialGradient>

              {/* Metallic Chrome Pivot - Outer */}
              <linearGradient id="pivotChromeOuter" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E2E8F0" />
                <stop offset="35%" stopColor="#94A3B8" />
                <stop offset="70%" stopColor="#475569" />
                <stop offset="100%" stopColor="#1E293B" />
              </linearGradient>

              {/* Metallic Chrome Pivot - Inner Center */}
              <linearGradient id="pivotChromeInner" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0F172A" />
                <stop offset="50%" stopColor="#334155" />
                <stop offset="100%" stopColor="#64748B" />
              </linearGradient>

              {/* Needle 3D Bevel: Specular Left */}
              <linearGradient id="needleSpecular" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="60%" stopColor="#E2E8F0" />
                <stop offset="100%" stopColor="#CBD5E1" />
              </linearGradient>

              {/* Needle 3D Bevel: Shaded Right */}
              <linearGradient id="needleShade" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#94A3B8" />
                <stop offset="70%" stopColor="#64748B" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>

              {/* Active Segment Ambient Glow Filter */}
              <filter id="activeGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Dark Outer Frame & Bezel */}
            <circle
              cx={cx}
              cy={cy}
              r={208}
              fill="url(#bezelGradient)"
              stroke="#1E293B"
              strokeWidth="2.5"
              strokeOpacity="0.7"
            />

            {/* Inner Dial Base */}
            <circle
              cx={cx}
              cy={cy}
              r={164}
              fill="url(#dialGradient)"
              stroke="#0F172A"
              strokeWidth="1.5"
            />

            {/* Dark Track Background under Arc */}
            <path
              d={describeArc(cx, cy, arcRadius, 195, -15)}
              fill="none"
              stroke="#0A0F1C"
              strokeWidth="32"
              strokeLinecap="round"
            />

            {/* ── 5 Colored Gauge Arc Segments ───────────────────────────── */}
            {SPEED_CATEGORIES.map((cat) => {
              const isActive = isNeedleSettled && category.name === cat.name;
              const pathData = describeArc(cx, cy, arcRadius, cat.startAngle, cat.endAngle);

              return (
                <path
                  key={cat.name}
                  d={pathData}
                  fill="none"
                  stroke={cat.color}
                  strokeWidth={isActive ? '30' : '28'}
                  strokeLinecap="butt"
                  filter={isActive ? 'url(#activeGlow)' : undefined}
                  opacity={isActive ? 1 : 0.88}
                  className="transition-all duration-300"
                />
              );
            })}

            {/* ── Radial Dial Tick Marks ─────────────────────────────────── */}
            {ticks.map((t) => (
              <line
                key={t.id}
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke={t.isMajor ? '#94A3B8' : '#334155'}
                strokeWidth={t.isMajor ? 2.5 : 1.5}
                strokeLinecap="round"
                opacity={t.isMajor ? 0.9 : 0.6}
              />
            ))}

            {/* ── Outer Category Labels ──────────────────────────────────── */}
            {SPEED_CATEGORIES.map((cat) => {
              const isActive = isNeedleSettled && category.name === cat.name;
              const pos = polarToCartesian(cx, cy, labelRadius, cat.midAngle);

              return (
                <text
                  key={cat.name}
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={isActive ? cat.color : '#64748B'}
                  className={`font-mono text-[11px] font-bold tracking-wider transition-all duration-300 ${
                    isActive ? 'scale-110 drop-shadow-[0_0_8px_currentColor]' : 'opacity-80'
                  }`}
                  style={{
                    textShadow: isActive ? `0 0 10px ${cat.glow}` : 'none',
                  }}
                >
                  {cat.name}
                </text>
              );
            })}

            {/* ── Realistic 3D Metallic Needle ───────────────────────────── */}
            <g
              transform={`rotate(${needleRotation}, ${cx}, ${cy})`}
              style={{
                transition: prefersReducedMotion
                  ? 'none'
                  : 'transform 1.6s cubic-bezier(0.2, 0.9, 0.3, 1)',
              }}
            >
              {/* Needle Drop Shadow */}
              <polygon
                points={`${cx - 7},${cy} ${cx},${cy - 175} ${cx + 7},${cy}`}
                fill="rgba(0, 0, 0, 0.65)"
                transform="translate(4, 6)"
              />

              {/* Left Specular Face */}
              <polygon
                points={`${cx - 7},${cy} ${cx},${cy - 175} ${cx},${cy}`}
                fill="url(#needleSpecular)"
              />

              {/* Right Shaded Face */}
              <polygon
                points={`${cx},${cy} ${cx},${cy - 175} ${cx + 7},${cy}`}
                fill="url(#needleShade)"
              />

              {/* Center Specular Ridge Line */}
              <line
                x1={cx}
                y1={cy}
                x2={cx}
                y2={cy - 175}
                stroke="#FFFFFF"
                strokeWidth="1.2"
                opacity="0.95"
              />
            </g>

            {/* ── Central Metallic Pivot Assembly ────────────────────────── */}
            {/* Outer Beveled Chrome Ring */}
            <circle
              cx={cx}
              cy={cy}
              r={24}
              fill="url(#pivotChromeOuter)"
              stroke="#64748B"
              strokeWidth="1.5"
              className="drop-shadow-md"
            />
            {/* Middle Recessed Dark Bevel */}
            <circle
              cx={cx}
              cy={cy}
              r={15}
              fill="#0F172A"
              stroke="#334155"
              strokeWidth="1"
            />
            {/* Center Chrome Cap */}
            <circle
              cx={cx}
              cy={cy}
              r={7}
              fill="url(#pivotChromeInner)"
              stroke="#94A3B8"
              strokeWidth="0.8"
            />

            {/* ── Center Digital Score Display (Inside Dial) ─────────────── */}
            <g transform={`translate(${cx}, ${cy + 42})`}>
              {/* Numerical Score / WPM Value */}
              <text
                x="0"
                y="0"
                textAnchor="middle"
                dominantBaseline="central"
                fill="#FFFFFF"
                className="font-mono font-black text-5xl tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
              >
                {wpm}
              </text>

              {/* "OUT OF 100" Label */}
              <text
                x="0"
                y="26"
                textAnchor="middle"
                dominantBaseline="central"
                fill="#94A3B8"
                className="font-mono text-[10px] font-bold tracking-[0.25em] uppercase"
              >
                OUT OF 100
              </text>

              {/* Active Category Indicator Tag */}
              {isNeedleSettled && (
                <text
                  x="0"
                  y="45"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={category.color}
                  className="font-mono text-[11px] font-extrabold tracking-widest uppercase transition-opacity duration-300 drop-shadow-[0_0_6px_currentColor]"
                >
                  {category.name}
                </text>
              )}
            </g>
          </svg>
        </div>

        {/* ── Typing Identity Reveal (Revealed After Needle Animation) ── */}
        <div
          className={`w-full max-w-xl text-center mt-3 sm:mt-4 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-900/90 via-[#0B132B]/90 to-slate-900/90 border border-slate-800/80 shadow-xl transition-all duration-700 ${
            isNeedleSettled
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-3 pointer-events-none'
          }`}
          style={{
            borderColor: isNeedleSettled
              ? `color-mix(in srgb, ${identity.badgeColor} 40%, #1e293b)`
              : undefined,
          }}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <Sparkles className="w-4 h-4" style={{ color: identity.badgeColor }} />
            <span
              className="text-xs sm:text-sm font-black font-mono tracking-widest uppercase"
              style={{ color: identity.badgeColor }}
            >
              {identity.title}
            </span>
            <Sparkles className="w-4 h-4" style={{ color: identity.badgeColor }} />
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans max-w-md mx-auto">
            {identity.description}
          </p>
        </div>
      </div>

      {/* ── 5 Horizontal Metric Cards (Matches Reference Image 2) ───── */}
      <div className="w-full max-w-3xl my-2 z-10">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-0 rounded-2xl bg-[#0B1120]/90 border border-slate-800/80 shadow-2xl backdrop-blur-md overflow-hidden">
          {/* 1. WPM */}
          <div className="flex flex-col items-center justify-center py-3.5 sm:py-4 px-3 sm:border-r border-slate-800/80 text-center">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center mb-1.5 text-[#39D353]">
              <Gauge className="w-4 h-4" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight">
              {wpm}
            </div>
            <div className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400 mt-0.5">
              WPM
            </div>
          </div>

          {/* 2. ACCURACY */}
          <div className="flex flex-col items-center justify-center py-3.5 sm:py-4 px-3 sm:border-r border-slate-800/80 text-center">
            <div className="w-8 h-8 rounded-lg bg-sky-500/15 flex items-center justify-center mb-1.5 text-[#38BDF8]">
              <Crosshair className="w-4 h-4" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight">
              {accuracy}%
            </div>
            <div className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400 mt-0.5">
              ACCURACY
            </div>
          </div>

          {/* 3. KEYSTROKES */}
          <div className="flex flex-col items-center justify-center py-3.5 sm:py-4 px-3 sm:border-r border-slate-800/80 text-center">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center mb-1.5 text-[#38BDF8]">
              <Keyboard className="w-4 h-4" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight">
              {totalKeystrokes}
            </div>
            <div className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400 mt-0.5">
              KEYSTROKES
            </div>
          </div>

          {/* 4. ERRORS */}
          <div className="flex flex-col items-center justify-center py-3.5 sm:py-4 px-3 sm:border-r border-slate-800/80 text-center">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center mb-1.5 text-[#F59E0B]">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight">
              {mistakes}
            </div>
            <div className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400 mt-0.5">
              ERRORS
            </div>
          </div>

          {/* 5. TIME */}
          <div className="col-span-2 sm:col-span-1 flex flex-col items-center justify-center py-3.5 sm:py-4 px-3 text-center border-t sm:border-t-0 border-slate-800/80">
            <div className="w-8 h-8 rounded-lg bg-rose-500/15 flex items-center justify-center mb-1.5 text-[#F43F5E]">
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight">
              {duration}s
            </div>
            <div className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400 mt-0.5">
              TIME
            </div>
          </div>
        </div>
      </div>

      {/* ── Grandmaster Capstone Graduation Banner (Stage 7 Level 600) ─ */}
      {passed && !hasNextLesson && !hasNextStage && (lesson?.stageId === 7 || lesson?.id === 'S7-L600') && (
        <div className="w-full max-w-2xl my-2 p-3.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-emerald-500/20 border border-amber-500/50 text-center space-y-1 shadow-lg z-10 animate-pulse">
          <div className="text-xs font-bold font-mono text-amber-300 uppercase tracking-widest flex items-center justify-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>ACADEMY GRANDMASTER GRADUATION</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-[11px] text-slate-300">
            You have mastered all 4,200 lessons across all 7 stages of the KEYFLOW Academy. True neuromuscular flow achieved!
          </div>
        </div>
      )}

      {/* ── Three Action Navigation Buttons ───────────────────────────── */}
      <div className="w-full max-w-2xl flex flex-col items-center pb-2 pt-1 z-10">
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 w-full">
          {/* BUTTON 1 — TRY AGAIN */}
          <button
            type="button"
            onClick={handleRetryAction}
            className="flex-1 sm:flex-initial min-w-[140px] px-5 py-3 rounded-xl font-bold font-mono text-xs tracking-wider uppercase bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700/80 hover:border-slate-600 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-slate-300" />
            <span>TRY AGAIN</span>
          </button>

          {/* BUTTON 2 — BACK TO ACADEMY */}
          <button
            type="button"
            onClick={handleBackAction}
            className="flex-1 sm:flex-initial min-w-[160px] px-5 py-3 rounded-xl font-bold font-mono text-xs tracking-wider uppercase bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <LayoutGrid className="w-4 h-4 text-slate-400" />
            <span>BACK TO ACADEMY</span>
          </button>

          {/* BUTTON 3 — NEXT */}
          {passed && (hasNextLesson || hasNextStage) ? (
            <button
              type="button"
              onClick={handleNextAction}
              className="w-full sm:w-auto flex-1 sm:flex-initial min-w-[160px] px-7 py-3 rounded-xl font-black font-mono text-xs tracking-widest uppercase bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white transition-all shadow-lg shadow-emerald-500/25 active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/30"
            >
              <span>{hasNextLesson ? 'NEXT LESSON' : 'NEXT STAGE'}</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
          ) : !passed ? (
            <div className="w-full sm:w-auto px-4 py-2 text-center text-xs text-amber-400/90 font-mono">
              Goal: {lesson?.targetWpm || 20} WPM & {lesson?.targetAccuracy || 90}% Acc required to advance
            </div>
          ) : null}
        </div>

        {/* Keyboard Enter Hint */}
        {passed && (hasNextLesson || hasNextStage) && (
          <div
            className={`mt-2.5 flex items-center gap-1.5 text-[11px] font-mono text-slate-400 transition-opacity duration-300 ${
              isNeedleSettled ? 'opacity-85' : 'opacity-0'
            }`}
          >
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-bold text-slate-200 bg-slate-800 border border-slate-700 rounded shadow-sm">
              ENTER ↵
            </kbd>
            <span>to continue</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcademyResultsScreen;
