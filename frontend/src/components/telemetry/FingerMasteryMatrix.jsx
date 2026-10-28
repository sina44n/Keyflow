import React, { useState } from 'react';
import { Lightbulb } from 'lucide-react';

/**
 * FingerMasteryMatrix
 * 
 * Biomechanical 10-finger typing speed and real accuracy breakdown.
 * Pixel-accurate implementation of TypingClub Reference Image 1:
 * - 8 Anatomical Hand silhouettes (Left: Pinky, Ring, Middle, Index | Right: Index, Middle, Ring, Pinky)
 * - Highlighted active finger in amber/orange (#f59e0b)
 * - Velocity-shaded hands (Slower to Faster cerulean blue ramp)
 * - Left Hand, Right Hand, and Thumbs summary table
 * - Educational tip cards
 * - Strict real-user data fidelity (honest empty states when unpracticed)
 */
export const FingerMasteryMatrix = ({
  fingerStats = [],
  leftHandStats = null,
  rightHandStats = null,
  thumbsStats = null,
}) => {
  const [selectedFinger, setSelectedFinger] = useState(null);

  // Authoritative touch typing finger definitions
  const baseFingers = [
    { id: 'left-pinky', name: 'Pinky', hand: 'Left', keys: 'Q, A, Z', activeDigit: 'pinky' },
    { id: 'left-ring', name: 'Ring', hand: 'Left', keys: 'W, S, X', activeDigit: 'ring' },
    { id: 'left-middle', name: 'Middle', hand: 'Left', keys: 'E, D, C', activeDigit: 'middle' },
    { id: 'left-index', name: 'Index', hand: 'Left', keys: 'R, F, V, T, G, B', activeDigit: 'index' },
    { id: 'right-index', name: 'Index', hand: 'Right', keys: 'Y, H, N, U, J, M', activeDigit: 'index' },
    { id: 'right-middle', name: 'Middle', hand: 'Right', keys: 'I, K, ,', activeDigit: 'middle' },
    { id: 'right-ring', name: 'Ring', hand: 'Right', keys: 'O, L, .', activeDigit: 'ring' },
    { id: 'right-pinky', name: 'Pinky', hand: 'Right', keys: 'P, ;, /', activeDigit: 'pinky' },
  ];

  // Normalize fingerStats
  const safeFingerArray = Array.isArray(fingerStats)
    ? fingerStats
    : (fingerStats && typeof fingerStats === 'object' ? Object.values(fingerStats) : []);

  // Map real user typing stats or honest unpracticed state
  const displayFingers = baseFingers.map((f) => {
    const live = safeFingerArray.find((item) => item?.id === f.id);
    if (live && live.hasData) {
      return {
        ...f,
        speed: live.speed,
        accuracy: live.accuracy,
        totalKeystrokes: live.totalKeystrokes,
        errorRate: live.errorRate,
        hasData: true,
      };
    }
    return {
      ...f,
      speed: null,
      accuracy: null,
      totalKeystrokes: 0,
      errorRate: '0.0%',
      hasData: false,
    };
  });

  // Color shades for speed (Slower to Faster, Reference Image 1)
  const getFingerShadeColor = (wpm, hasData) => {
    if (!hasData || wpm === null || wpm === undefined) {
      return '#bae6fd'; // Slower / Untested neutral sky tint
    }
    if (wpm >= 40) return '#0284c7'; // deep cerulean blue
    if (wpm >= 30) return '#0ea5e9'; // medium cerulean blue
    if (wpm >= 20) return '#38bdf8'; // light sky blue
    return '#7dd3fc'; // pale blue
  };

  /**
   * Anatomical SVG Hand Silhouette matching Reference Image 1.
   * Dorsal view (looking down at keyboard):
   * Left hand has thumb pointing to the right; Right hand is mirrored.
   */
  const renderHandSilhouette = (activeDigit, isLeft = true, wpm = 0, hasData = false) => {
    const baseColor = getFingerShadeColor(wpm, hasData);
    const highlightColor = '#f59e0b'; // amber/orange highlight matching Reference Image 1

    return (
      <svg
        viewBox="0 0 100 120"
        className="w-16 h-20 sm:w-18 sm:h-22 transition-transform duration-200 hover:scale-105"
        style={{
          transform: isLeft ? 'none' : 'scaleX(-1)',
          transformOrigin: '50% 50%',
        }}
        aria-hidden="true"
      >
        {/* Palm base with smooth anatomical contour */}
        <path
          d="M 28 68 C 24 75, 26 95, 34 112 C 45 116, 58 116, 70 112 C 78 98, 80 88, 76 74 C 70 70, 64 67, 51 65 C 38 67, 30 68, 28 68 Z"
          fill={baseColor}
          opacity="0.95"
        />

        {/* Thumb curving naturally outward toward keyboard center */}
        <path
          d="M 72 74 C 76 68, 86 58, 93 64 C 98 69, 94 78, 85 86 C 80 90, 75 88, 72 82 Z"
          fill={activeDigit === 'thumb' ? highlightColor : baseColor}
          opacity="0.95"
        />

        {/* Pinky Finger */}
        <rect
          x="23"
          y="44"
          width="10"
          height="30"
          rx="5"
          fill={activeDigit === 'pinky' ? highlightColor : baseColor}
        />

        {/* Ring Finger */}
        <rect
          x="36"
          y="26"
          width="11"
          height="46"
          rx="5.5"
          fill={activeDigit === 'ring' ? highlightColor : baseColor}
        />

        {/* Middle Finger (tallest) */}
        <rect
          x="50"
          y="16"
          width="12"
          height="54"
          rx="6"
          fill={activeDigit === 'middle' ? highlightColor : baseColor}
        />

        {/* Index Finger */}
        <rect
          x="65"
          y="28"
          width="11"
          height="44"
          rx="5.5"
          fill={activeDigit === 'index' ? highlightColor : baseColor}
        />
      </svg>
    );
  };

  const leftDisplay = displayFingers.slice(0, 4);
  const rightDisplay = displayFingers.slice(4, 8);

  const leftHasData = leftHandStats && leftHandStats.hasData;
  const rightHasData = rightHandStats && rightHandStats.hasData;
  const thumbsHasData = thumbsStats && thumbsStats.hasData;

  return (
    <div className="card-panel p-4 sm:p-6 md:p-7 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-md space-y-6">
      {/* Top Header & Legend (Reference Image 1) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold font-mono tracking-tight text-[var(--text-primary)]">
            Finger Mastery
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            This chart shows the current speed & real accuracy for each finger.
          </p>
        </div>

        {/* Slower to Faster Legend (Reference Image 1) */}
        <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)] self-start sm:self-auto">
          <span>Slower</span>
          <div className="flex items-center gap-1">
            <span className="w-3.5 h-3.5 rounded-xs bg-[#bae6fd]" title="Slower / Untested" />
            <span className="w-3.5 h-3.5 rounded-xs bg-[#7dd3fc]" title="Developing" />
            <span className="w-3.5 h-3.5 rounded-xs bg-[#38bdf8]" title="Improving" />
            <span className="w-3.5 h-3.5 rounded-xs bg-[#0284c7]" title="Faster / Proficient" />
          </div>
          <span>Faster</span>
        </div>
      </div>

      {/* Main Grid: Left Hand/Right Hand Table vs 8-Finger Anatomical Silhouettes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Hand vs Right Hand Summary Table (Reference Image 1) */}
        <div className="lg:col-span-4 p-4 sm:p-5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-4 font-mono text-xs shadow-xs">
          {/* Left Hand */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <div className="font-semibold text-[var(--text-primary)]">Left Hand</div>
            <div className="text-right">
              <div className="font-bold text-sm text-[var(--text-primary)]">
                {leftHasData ? `${leftHandStats.speed} wpm` : '— wpm'}
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">
                {leftHasData ? `${leftHandStats.accuracy}% Accuracy` : 'No data recorded'}
              </div>
            </div>
          </div>

          {/* Right Hand */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <div className="font-semibold text-[var(--text-primary)]">Right Hand</div>
            <div className="text-right">
              <div className="font-bold text-sm text-[var(--text-primary)]">
                {rightHasData ? `${rightHandStats.speed} wpm` : '— wpm'}
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">
                {rightHasData ? `${rightHandStats.accuracy}% Accuracy` : 'No data recorded'}
              </div>
            </div>
          </div>

          {/* Thumbs */}
          <div className="flex items-center justify-between">
            <div className="font-semibold text-[var(--text-primary)]">Thumbs</div>
            <div className="text-right">
              <div className="font-bold text-sm text-[var(--accent)]">
                {thumbsHasData ? `${thumbsStats.speed} wpm` : '— wpm'}
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">
                {thumbsHasData ? `${thumbsStats.accuracy}% Accuracy` : 'No data recorded'}
              </div>
            </div>
          </div>
        </div>

        {/* 8 Anatomical Hand Digits Array (Reference Image 1) */}
        <div className="lg:col-span-8 p-3 sm:p-4 rounded-xl bg-[var(--bg-elevated)]/40 border border-[var(--border)] overflow-x-auto shadow-inner">
          <div className="min-w-[540px] sm:min-w-[580px] flex items-center justify-between gap-3">
            {/* Left Hand 4 Digits */}
            <div className="flex items-center gap-3 sm:gap-4">
              {leftDisplay.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFinger(f)}
                  className={`flex flex-col items-center p-2 rounded-xl transition-all cursor-pointer ${
                    selectedFinger?.id === f.id
                      ? 'bg-[var(--bg-elevated)] ring-2 ring-[var(--accent)] shadow-xs'
                      : 'hover:bg-[var(--bg-elevated)]/60'
                  }`}
                  title={`Inspect ${f.hand} ${f.name} Finger`}
                >
                  {renderHandSilhouette(f.activeDigit, true, f.speed, f.hasData)}
                  <div className="font-mono text-center mt-2 leading-tight">
                    <span className="block font-bold text-xs text-[var(--text-primary)]">
                      {f.hasData ? `${f.speed} wpm` : '— wpm'}
                    </span>
                    <span className="block text-[11px] text-[var(--text-muted)]">
                      {f.hasData ? `${f.accuracy}%` : '—'}
                    </span>
                    <span className="block text-[11px] font-semibold text-[var(--text-secondary)] mt-0.5">
                      {f.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Vertical Center Hand Divider (Reference Image 1) */}
            <div className="h-28 border-r border-dashed border-[var(--border)] shrink-0" />

            {/* Right Hand 4 Digits */}
            <div className="flex items-center gap-3 sm:gap-4">
              {rightDisplay.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFinger(f)}
                  className={`flex flex-col items-center p-2 rounded-xl transition-all cursor-pointer ${
                    selectedFinger?.id === f.id
                      ? 'bg-[var(--bg-elevated)] ring-2 ring-[var(--accent)] shadow-xs'
                      : 'hover:bg-[var(--bg-elevated)]/60'
                  }`}
                  title={`Inspect ${f.hand} ${f.name} Finger`}
                >
                  {renderHandSilhouette(f.activeDigit, false, f.speed, f.hasData)}
                  <div className="font-mono text-center mt-2 leading-tight">
                    <span className="block font-bold text-xs text-[var(--text-primary)]">
                      {f.hasData ? `${f.speed} wpm` : '— wpm'}
                    </span>
                    <span className="block text-[11px] text-[var(--text-muted)]">
                      {f.hasData ? `${f.accuracy}%` : '—'}
                    </span>
                    <span className="block text-[11px] font-semibold text-[var(--text-secondary)] mt-0.5">
                      {f.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Finger Details Modal / Banner */}
      {selectedFinger && (
        <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--accent)] shadow-md flex items-center justify-between gap-4 animate-in fade-in">
          <div>
            <h4 className="text-xs font-mono font-bold text-[var(--text-primary)]">
              {selectedFinger.hand} Hand — {selectedFinger.name} Finger
            </h4>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 font-mono">
              Assigned touch typing keys: <strong className="text-[var(--text-secondary)]">{selectedFinger.keys}</strong>
            </p>
          </div>
          <div className="flex items-center gap-4 font-mono text-xs">
            <div>
              <span className="text-[10px] text-[var(--text-muted)] block">Velocity</span>
              <span className="font-bold text-sm text-[var(--text-primary)]">
                {selectedFinger.hasData ? `${selectedFinger.speed} WPM` : 'No data'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--text-muted)] block">Accuracy</span>
              <span className="font-bold text-sm text-emerald-400">
                {selectedFinger.hasData ? `${selectedFinger.accuracy}%` : 'No data'}
              </span>
            </div>
            {selectedFinger.hasData && (
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Strokes</span>
                <span className="font-bold text-sm text-[var(--text-primary)]">
                  {selectedFinger.totalKeystrokes.toLocaleString()}
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={() => setSelectedFinger(null)}
              className="text-xs text-[var(--accent)] hover:underline ml-2 cursor-pointer font-bold"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Two Helpful Tip Boxes (Reference Image 1) */}
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
