import React, { useState, useEffect, useMemo } from 'react';
import { Lightbulb, X, Activity, Target, Zap, ShieldCheck } from 'lucide-react';
import { practiceAPI } from '../../utils/api.js';

/**
 * FingerMasteryMatrix
 * 
 * Authentic Biomechanical 10-Finger Speed & Accuracy Analytics System.
 * Pixel-accurate implementation of TypingClub interaction & visualization:
 * - High-fidelity Anatomical Vector Hands (dorsal perspective, organic curves).
 * - 8 Hands horizontally: Left (Pinky, Ring, Middle, Index) | Right (Index, Middle, Ring, Pinky).
 * - Active digit highlighted in warm amber/orange (#f59e0b / #ea580c).
 * - Dual Mode Segmented Toggle: [ Speed | Accuracy ] matching Keyboard Mastery.
 * - Dynamic Color Ramp:
 *     * Speed Mode: Slower (#bae6fd) -> Developing (#7dd3fc) -> Improving (#38bdf8) -> Fast (#0284c7).
 *     * Accuracy Mode: Deep blue (98-100%) -> Medium blue (94-97%) -> Light blue (88-93%) -> Coral (80-87%) -> Red (<80%).
 * - Left Hand, Right Hand & Thumbs summary table with dynamic strongest finger.
 * - Interactive finger click inspection drawer with clinical touch typing breakdown.
 * - Time period synchronization (today / weekly / overall) with live backend API support.
 * - Strict zero-fabrication: unpracticed fingers honestly display "— wpm" / "No data recorded".
 * - Educational tip cards at bottom.
 */
export const FingerMasteryMatrix = ({
  fingerStats = [],
  leftHandStats = null,
  rightHandStats = null,
  thumbsStats = null,
  activeReport = 'overall',
  onReportChange = null,
}) => {
  const [mode, setMode] = useState('speed'); // 'speed' | 'accuracy'
  const [selectedFinger, setSelectedFinger] = useState(null);
  const [backendData, setBackendData] = useState(null);
  const [isLoadingApi, setIsLoadingApi] = useState(false);

  // Authoritative clinical touch-typing finger definitions
  const baseFingers = useMemo(() => [
    { id: 'left-pinky', name: 'Pinky', hand: 'Left', keys: 'Q, A, Z, 1', activeDigit: 'pinky', isLeft: true },
    { id: 'left-ring', name: 'Ring', hand: 'Left', keys: 'W, S, X, 2', activeDigit: 'ring', isLeft: true },
    { id: 'left-middle', name: 'Middle', hand: 'Left', keys: 'E, D, C, 3', activeDigit: 'middle', isLeft: true },
    { id: 'left-index', name: 'Index', hand: 'Left', keys: 'R, F, V, T, G, B, 4, 5', activeDigit: 'index', isLeft: true },
    { id: 'right-index', name: 'Index', hand: 'Right', keys: 'Y, H, N, U, J, M, 6, 7', activeDigit: 'index', isLeft: false },
    { id: 'right-middle', name: 'Middle', hand: 'Right', keys: 'I, K, ,, <, 8', activeDigit: 'middle', isLeft: false },
    { id: 'right-ring', name: 'Ring', hand: 'Right', keys: 'O, L, ., >, 9', activeDigit: 'ring', isLeft: false },
    { id: 'right-pinky', name: 'Pinky', hand: 'Right', keys: 'P, ;, :, \', ", ?, /, 0, -, =', activeDigit: 'pinky', isLeft: false },
  ], []);

  // Fetch backend analytics if authenticated
  useEffect(() => {
    let isCancelled = false;
    const fetchBackendStats = async () => {
      try {
        setIsLoadingApi(true);
        const periodParam = activeReport === 'daily' ? 'today' : activeReport;
        const res = await practiceAPI.getFingerMastery({ period: periodParam });
        if (!isCancelled && res?.data) {
          setBackendData(res.data);
        }
      } catch {
        // Fallback silently to client telemetryStorage
      } finally {
        if (!isCancelled) {
          setIsLoadingApi(false);
        }
      }
    };

    fetchBackendStats();
    return () => {
      isCancelled = true;
    };
  }, [activeReport]);

  // Normalize finger stats from backend or props
  const safeFingerMap = useMemo(() => {
    const map = {};
    // Priority 1: Backend API data if available with sessions
    if (backendData?.finger_stats && backendData.total_sessions > 0) {
      Object.entries(backendData.finger_stats).forEach(([fid, f]) => {
        map[fid] = {
          id: fid,
          speed: f.speed,
          accuracy: f.accuracy,
          totalKeystrokes: f.total,
          correct: f.correct,
          incorrect: f.incorrect,
          hasData: Boolean(f.has_data),
        };
      });
      return map;
    }

    // Priority 2: Client telemetry stats passed via props
    const rawList = Array.isArray(fingerStats)
      ? fingerStats
      : (fingerStats && typeof fingerStats === 'object' ? Object.values(fingerStats) : []);

    rawList.forEach((item) => {
      if (item?.id) {
        map[item.id] = {
          id: item.id,
          speed: item.speed,
          accuracy: item.accuracy,
          totalKeystrokes: item.totalKeystrokes || item.total || 0,
          correct: item.correct || 0,
          incorrect: item.incorrect || item.errors || 0,
          hasData: Boolean(item.hasData),
        };
      }
    });
    return map;
  }, [backendData, fingerStats]);

  // Merge base finger definitions with authentic typing performance
  const displayFingers = useMemo(() => {
    return baseFingers.map((f) => {
      const live = safeFingerMap[f.id];
      if (live && live.hasData) {
        return {
          ...f,
          speed: live.speed,
          accuracy: live.accuracy,
          totalKeystrokes: live.totalKeystrokes,
          correct: live.correct,
          incorrect: live.incorrect,
          hasData: true,
        };
      }
      return {
        ...f,
        speed: null,
        accuracy: null,
        totalKeystrokes: 0,
        correct: 0,
        incorrect: 0,
        hasData: false,
      };
    });
  }, [baseFingers, safeFingerMap]);

  // Hand summaries (backend preferred if available, fallback to props)
  const leftSummary = useMemo(() => {
    if (backendData?.left_hand && backendData.total_sessions > 0) {
      return backendData.left_hand;
    }
    return leftHandStats || { speed: 0, accuracy: 0, total_keystrokes: 0, hasData: false, strongestFinger: null };
  }, [backendData, leftHandStats]);

  const rightSummary = useMemo(() => {
    if (backendData?.right_hand && backendData.total_sessions > 0) {
      return backendData.right_hand;
    }
    return rightHandStats || { speed: 0, accuracy: 0, total_keystrokes: 0, hasData: false, strongestFinger: null };
  }, [backendData, rightHandStats]);

  const thumbsSummary = useMemo(() => {
    if (backendData?.thumbs && backendData.total_sessions > 0) {
      return backendData.thumbs;
    }
    return thumbsStats || { speed: 0, accuracy: 0, total_keystrokes: 0, hasData: false };
  }, [backendData, thumbsStats]);

  // Color functions matching TypingClub and KeyboardMastery
  const getSpeedShade = (wpm, hasData) => {
    if (!hasData || wpm === null || wpm === undefined) {
      return '#bae6fd'; // Neutral sky tint for unpracticed / slower
    }
    if (wpm >= 40) return '#0284c7'; // Fast / proficient deep blue
    if (wpm >= 30) return '#0ea5e9'; // Vibrant blue
    if (wpm >= 20) return '#38bdf8'; // Light sky blue
    return '#7dd3fc'; // Pale blue
  };

  const getAccuracyShade = (acc, hasData) => {
    if (!hasData || acc === null || acc === undefined) {
      return '#e2e8f0'; // Neutral slate for unpracticed
    }
    if (acc >= 98) return '#0284c7'; // 98-100% deep royal blue
    if (acc >= 94) return '#0ea5e9'; // 94-97% vibrant cerulean blue
    if (acc >= 88) return '#38bdf8'; // 88-93% light sky blue
    if (acc >= 80) return '#f87171'; // 80-87% soft coral / warning
    return '#ef4444'; // <80% error red
  };

  const getHandBodyColor = (finger) => {
    if (mode === 'speed') {
      return getSpeedShade(finger.speed, finger.hasData);
    }
    return getAccuracyShade(finger.accuracy, finger.hasData);
  };

  /**
   * Anatomical Vector Hand Graphic.
   * Dorsal perspective (view from above looking down on keyboard).
   * Proportioned digits: Pinky (shortest), Ring, Middle (tallest), Index.
   * Palm base with natural wrist contour and inward-pointing thumb.
   * Left hand has thumb pointing to the right; Right hand is mirrored.
   * Active digit highlighted in amber/orange (#f59e0b).
   */
  const renderAnatomicalHand = (finger) => {
    const isLeft = finger.isLeft;
    const activeDigit = finger.activeDigit;
    const bodyColor = getHandBodyColor(finger);
    const highlightColor = '#f59e0b'; // Amber/orange highlight matching reference
    const highlightStroke = '#d97706';

    const isDigitActive = (digit) => activeDigit === digit;

    return (
      <svg
        viewBox="0 0 100 125"
        className="w-16 h-20 sm:w-18 sm:h-22 transition-transform duration-200 group-hover:scale-105"
        style={{
          transform: isLeft ? 'none' : 'scaleX(-1)',
          transformOrigin: '50% 50%',
        }}
        aria-hidden="true"
      >
        <defs>
          <filter id={`glow-${finger.id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#f59e0b" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Anatomical Palm Base & Wrist Contour */}
        <path
          d="M 32 116 C 27 104, 23 88, 20 68 C 24 67, 30 67, 34 63 C 41 61, 46 61, 51 57 C 57 57, 61 59, 65 61 C 71 63, 75 72, 77 82 C 84 79, 92 70, 95 67 C 98 72, 94 82, 85 91 C 80 96, 75 106, 67 116 Z"
          fill={bodyColor}
          opacity="0.95"
          className="transition-colors duration-200"
        />

        {/* Thumb curving naturally inward toward keyboard center/spacebar */}
        <path
          d="M 73 82 C 77 75, 87 60, 94 65 C 99 70, 95 80, 86 89 C 81 94, 76 90, 73 82 Z"
          fill={isDigitActive('thumb') ? highlightColor : bodyColor}
          filter={isDigitActive('thumb') ? `url(#glow-${finger.id})` : undefined}
          stroke={isDigitActive('thumb') ? highlightStroke : 'none'}
          strokeWidth={isDigitActive('thumb') ? 0.75 : 0}
          className="transition-colors duration-200"
        />

        {/* Pinky Finger (Shortest outer digit) */}
        <rect
          x="20"
          y="42"
          width="10"
          height="32"
          rx="5"
          fill={isDigitActive('pinky') ? highlightColor : bodyColor}
          filter={isDigitActive('pinky') ? `url(#glow-${finger.id})` : undefined}
          stroke={isDigitActive('pinky') ? highlightStroke : 'none'}
          strokeWidth={isDigitActive('pinky') ? 0.75 : 0}
          className="transition-colors duration-200"
        />

        {/* Ring Finger */}
        <rect
          x="34"
          y="24"
          width="11"
          height="45"
          rx="5.5"
          fill={isDigitActive('ring') ? highlightColor : bodyColor}
          filter={isDigitActive('ring') ? `url(#glow-${finger.id})` : undefined}
          stroke={isDigitActive('ring') ? highlightStroke : 'none'}
          strokeWidth={isDigitActive('ring') ? 0.75 : 0}
          className="transition-colors duration-200"
        />

        {/* Middle Finger (Tallest digit) */}
        <rect
          x="48"
          y="13"
          width="11.5"
          height="51"
          rx="5.75"
          fill={isDigitActive('middle') ? highlightColor : bodyColor}
          filter={isDigitActive('middle') ? `url(#glow-${finger.id})` : undefined}
          stroke={isDigitActive('middle') ? highlightStroke : 'none'}
          strokeWidth={isDigitActive('middle') ? 0.75 : 0}
          className="transition-colors duration-200"
        />

        {/* Index Finger */}
        <rect
          x="62"
          y="25"
          width="11"
          height="43"
          rx="5.5"
          fill={isDigitActive('index') ? highlightColor : bodyColor}
          filter={isDigitActive('index') ? `url(#glow-${finger.id})` : undefined}
          stroke={isDigitActive('index') ? highlightStroke : 'none'}
          strokeWidth={isDigitActive('index') ? 0.75 : 0}
          className="transition-colors duration-200"
        />
      </svg>
    );
  };

  const leftDisplay = displayFingers.slice(0, 4);
  const rightDisplay = displayFingers.slice(4, 8);

  const leftHasData = Boolean(leftSummary?.hasData || leftSummary?.has_data);
  const rightHasData = Boolean(rightSummary?.hasData || rightSummary?.has_data);
  const thumbsHasData = Boolean(thumbsSummary?.hasData || thumbsSummary?.has_data);

  const leftSpeedVal = leftSummary?.speed ?? 0;
  const leftAccVal = leftSummary?.accuracy ?? 0;
  const leftStrongest = leftSummary?.strongestFinger || leftSummary?.strongest_finger;

  const rightSpeedVal = rightSummary?.speed ?? 0;
  const rightAccVal = rightSummary?.accuracy ?? 0;
  const rightStrongest = rightSummary?.strongestFinger || rightSummary?.strongest_finger;

  const thumbsSpeedVal = thumbsSummary?.speed ?? 0;
  const thumbsAccVal = thumbsSummary?.accuracy ?? 0;

  return (
    <div className="card-panel p-4 sm:p-6 md:p-7 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-md space-y-6">
      {/* Top Header: Title, Segmented [Speed | Accuracy] Toggle & Dynamic Legend */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold font-mono tracking-tight text-[var(--text-primary)]">
              Finger Mastery
            </h2>
            {isLoadingApi && (
              <span className="inline-block w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" title="Syncing..." />
            )}
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            This chart shows the current speed & real accuracy for each finger.
          </p>
        </div>

        {/* Right Controls: Mode Toggle & Compact Gradient Swatch Legend */}
        <div className="flex flex-wrap items-center gap-4 self-start md:self-auto">
          {/* Segmented Speed / Accuracy Toggle */}
          <div className="flex items-center rounded-lg bg-[var(--bg-elevated)] p-1 border border-[var(--border)] shadow-2xs">
            <button
              type="button"
              onClick={() => setMode('speed')}
              className={`px-3 py-1 text-xs font-mono font-medium rounded-md transition-all cursor-pointer ${
                mode === 'speed'
                  ? 'bg-[var(--accent)] text-white shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Speed
            </button>
            <button
              type="button"
              onClick={() => setMode('accuracy')}
              className={`px-3 py-1 text-xs font-mono font-medium rounded-md transition-all cursor-pointer ${
                mode === 'accuracy'
                  ? 'bg-[var(--accent)] text-white shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Accuracy
            </button>
          </div>

          {/* Dynamic Swatch Legend */}
          {mode === 'speed' ? (
            <div className="flex items-center gap-1.5 text-xs font-mono text-[var(--text-muted)]">
              <span>Slower</span>
              <div className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded-xs bg-[#bae6fd]" title="Slower / Untested (< 20 WPM)" />
                <span className="w-3.5 h-3.5 rounded-xs bg-[#7dd3fc]" title="Developing (20-29 WPM)" />
                <span className="w-3.5 h-3.5 rounded-xs bg-[#38bdf8]" title="Improving (30-39 WPM)" />
                <span className="w-3.5 h-3.5 rounded-xs bg-[#0284c7]" title="Proficient (≥ 40 WPM)" />
              </div>
              <span>Faster</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-mono text-[var(--text-muted)]">
              <span>Lower Accuracy</span>
              <div className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded-xs bg-[#ef4444]" title="Below 80%" />
                <span className="w-3.5 h-3.5 rounded-xs bg-[#f87171]" title="80% - 87%" />
                <span className="w-3.5 h-3.5 rounded-xs bg-[#38bdf8]" title="88% - 93%" />
                <span className="w-3.5 h-3.5 rounded-xs bg-[#0ea5e9]" title="94% - 97%" />
                <span className="w-3.5 h-3.5 rounded-xs bg-[#0284c7]" title="98% - 100%" />
              </div>
              <span>Higher Accuracy</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Analytics Grid: Hand Summaries Table + 8 High-Fidelity Vector Hands */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Hand, Right Hand & Thumbs Summary Card */}
        <div className="lg:col-span-4 p-4 sm:p-5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-4 font-mono text-xs shadow-xs">
          {/* Left Hand */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <div>
              <div className="font-semibold text-[var(--text-primary)]">Left Hand</div>
              {leftStrongest && leftHasData && (
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                  Best: {leftStrongest}
                </div>
              )}
            </div>
            <div className="text-right">
              {mode === 'speed' ? (
                <>
                  <div className="font-bold text-sm text-[var(--text-primary)]">
                    {leftHasData ? `${leftSpeedVal} wpm` : '— wpm'}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    {leftHasData ? `${leftAccVal}% Accuracy` : 'No data recorded'}
                  </div>
                </>
              ) : (
                <>
                  <div className="font-bold text-sm text-[var(--text-primary)]">
                    {leftHasData ? `${leftAccVal}% Accuracy` : '—'}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    {leftHasData ? `${leftSpeedVal} wpm` : 'No data recorded'}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Hand */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <div>
              <div className="font-semibold text-[var(--text-primary)]">Right Hand</div>
              {rightStrongest && rightHasData && (
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                  Best: {rightStrongest}
                </div>
              )}
            </div>
            <div className="text-right">
              {mode === 'speed' ? (
                <>
                  <div className="font-bold text-sm text-[var(--text-primary)]">
                    {rightHasData ? `${rightSpeedVal} wpm` : '— wpm'}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    {rightHasData ? `${rightAccVal}% Accuracy` : 'No data recorded'}
                  </div>
                </>
              ) : (
                <>
                  <div className="font-bold text-sm text-[var(--text-primary)]">
                    {rightHasData ? `${rightAccVal}% Accuracy` : '—'}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    {rightHasData ? `${rightSpeedVal} wpm` : 'No data recorded'}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Thumbs */}
          <div className="flex items-center justify-between">
            <div className="font-semibold text-[var(--text-primary)]">Thumbs</div>
            <div className="text-right">
              {mode === 'speed' ? (
                <>
                  <div className="font-bold text-sm text-[var(--accent)]">
                    {thumbsHasData ? `${thumbsSpeedVal} wpm` : '— wpm'}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    {thumbsHasData ? `${thumbsAccVal}% Accuracy` : 'No data recorded'}
                  </div>
                </>
              ) : (
                <>
                  <div className="font-bold text-sm text-[var(--accent)]">
                    {thumbsHasData ? `${thumbsAccVal}% Accuracy` : '—'}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    {thumbsHasData ? `${thumbsSpeedVal} wpm` : 'No data recorded'}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 8 Anatomical Hand Digits Array (4 Left | Divider | 4 Right) */}
        <div className="lg:col-span-8 p-3 sm:p-5 rounded-xl bg-[var(--bg-elevated)]/40 border border-[var(--border)] overflow-x-auto shadow-inner">
          <div className="min-w-[560px] sm:min-w-[600px] flex items-center justify-between gap-3">
            {/* Left Hand 4 Digits: Pinky, Ring, Middle, Index */}
            <div className="flex items-center gap-3 sm:gap-4">
              {leftDisplay.map((f) => {
                const isSelected = selectedFinger?.id === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFinger(isSelected ? null : f)}
                    className={`group flex flex-col items-center p-2 rounded-xl transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--bg-elevated)] ring-2 ring-[var(--accent)] shadow-xs'
                        : 'hover:bg-[var(--bg-elevated)]/70'
                    }`}
                    title={`Click to inspect ${f.hand} ${f.name} finger metrics`}
                  >
                    {renderAnatomicalHand(f)}
                    <div className="font-mono text-center mt-2 leading-tight">
                      {mode === 'speed' ? (
                        <>
                          <span className="block font-bold text-xs text-[var(--text-primary)]">
                            {f.hasData ? `${f.speed} wpm` : '— wpm'}
                          </span>
                          <span className="block text-[11px] text-[var(--text-muted)]">
                            {f.hasData ? `${f.accuracy}%` : '—'}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="block font-bold text-xs text-[var(--text-primary)]">
                            {f.hasData ? `${f.accuracy}%` : '—'}
                          </span>
                          <span className="block text-[11px] text-[var(--text-muted)]">
                            {f.hasData ? `${f.speed} wpm` : '— wpm'}
                          </span>
                        </>
                      )}
                      <span className="block text-[11px] font-semibold text-[var(--text-secondary)] mt-0.5">
                        {f.name}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Subtle Vertical Center Hand Divider */}
            <div className="h-28 border-r border-dashed border-[var(--border)] shrink-0 mx-1" />

            {/* Right Hand 4 Digits: Index, Middle, Ring, Pinky */}
            <div className="flex items-center gap-3 sm:gap-4">
              {rightDisplay.map((f) => {
                const isSelected = selectedFinger?.id === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFinger(isSelected ? null : f)}
                    className={`group flex flex-col items-center p-2 rounded-xl transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--bg-elevated)] ring-2 ring-[var(--accent)] shadow-xs'
                        : 'hover:bg-[var(--bg-elevated)]/70'
                    }`}
                    title={`Click to inspect ${f.hand} ${f.name} finger metrics`}
                  >
                    {renderAnatomicalHand(f)}
                    <div className="font-mono text-center mt-2 leading-tight">
                      {mode === 'speed' ? (
                        <>
                          <span className="block font-bold text-xs text-[var(--text-primary)]">
                            {f.hasData ? `${f.speed} wpm` : '— wpm'}
                          </span>
                          <span className="block text-[11px] text-[var(--text-muted)]">
                            {f.hasData ? `${f.accuracy}%` : '—'}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="block font-bold text-xs text-[var(--text-primary)]">
                            {f.hasData ? `${f.accuracy}%` : '—'}
                          </span>
                          <span className="block text-[11px] text-[var(--text-muted)]">
                            {f.hasData ? `${f.speed} wpm` : '— wpm'}
                          </span>
                        </>
                      )}
                      <span className="block text-[11px] font-semibold text-[var(--text-secondary)] mt-0.5">
                        {f.name}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Biomechanical Inspection Drawer */}
      {selectedFinger && (
        <div className="p-4 sm:p-5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--accent)]/60 shadow-md animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <h4 className="text-sm font-mono font-bold text-[var(--text-primary)]">
                  {selectedFinger.hand} Hand — {selectedFinger.name} Finger
                </h4>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1 font-mono">
                Assigned touch-typing keys: <strong className="text-[var(--text-primary)]">{selectedFinger.keys}</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedFinger(null)}
              className="p-1 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              title="Close inspection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-[var(--border)] font-mono text-xs">
            <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)]">
              <span className="text-[10px] text-[var(--text-muted)] block uppercase">Velocity</span>
              <span className="font-bold text-base text-[var(--text-primary)] flex items-center gap-1.5 mt-0.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                {selectedFinger.hasData ? `${selectedFinger.speed} WPM` : 'No data'}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)]">
              <span className="text-[10px] text-[var(--text-muted)] block uppercase">Real Accuracy</span>
              <span className="font-bold text-base text-emerald-500 flex items-center gap-1.5 mt-0.5">
                <Target className="w-3.5 h-3.5 text-emerald-500" />
                {selectedFinger.hasData ? `${selectedFinger.accuracy}%` : 'No data'}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)]">
              <span className="text-[10px] text-[var(--text-muted)] block uppercase">Eligible Strokes</span>
              <span className="font-bold text-base text-[var(--text-primary)] flex items-center gap-1.5 mt-0.5">
                <Activity className="w-3.5 h-3.5 text-blue-500" />
                {selectedFinger.hasData ? selectedFinger.totalKeystrokes.toLocaleString() : '0'}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)]">
              <span className="text-[10px] text-[var(--text-muted)] block uppercase">First-Attempt Accuracy</span>
              <span className="font-bold text-base text-[var(--text-primary)] flex items-center gap-1.5 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                {selectedFinger.hasData
                  ? `${selectedFinger.correct} / ${selectedFinger.totalKeystrokes}`
                  : '—'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Two Educational Tip Boxes (Preserved Matching Reference Image) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 text-amber-500 mt-0.5">
            <Lightbulb className="w-3.5 h-3.5" />
          </div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            <strong className="text-[var(--text-primary)] font-semibold">Tip: </strong>
            Use this chart to identify the strongest and weakest fingers in terms of speed and accuracy.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 text-amber-500 mt-0.5">
            <Lightbulb className="w-3.5 h-3.5" />
          </div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            <strong className="text-[var(--text-primary)] font-semibold">Tip: </strong>
            Real accuracy is your accuracy without taking any corrections into account.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FingerMasteryMatrix;
