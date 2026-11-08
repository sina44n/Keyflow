import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Lightbulb, X, TrendingUp, Target, Activity, Award, ShieldAlert } from 'lucide-react';
import { ROW_DEFS, KEY_FINGER_MAP } from '../../utils/touchTypingMap.js';

/**
 * KeyboardMastery — Masterpiece ANSI 60% Keystroke Performance & Accuracy Heatmap.
 * Direct authentic implementation of TypingClub interaction & visualization:
 * - Speed Heatmap: darker blue = faster character CPM, lighter blue = slower CPM.
 * - Accuracy Heatmap: 100% blue, transitioning to soft red/deep red for errors.
 * - Unpracticed Keys: clean neutral cream/elevated (< 3 attempts or 0 total).
 * - Time Filtering: Segmented [ Daily | Weekly | Overall ] synchronized with Telemetry.
 * - Interactive Keyboard: Hover quick tooltip + Click rich character detail drawer.
 * - Relative Velocity: Character speed relative to overall typing pace (Tip 3).
 * - Legends: Compact swatch gradients for both Speed and Accuracy modes.
 * - Three Educational Tip Cards.
 */
export const KeyboardMastery = ({
  characterStats = [],
  avgWpm = 0,
  overallAccuracy = 100,
  activeReport = 'overall',
  onReportChange = null,
}) => {
  const [mode, setMode] = useState('speed'); // 'speed' | 'accuracy'
  const [localReport, setLocalReport] = useState(activeReport);
  const [selectedKey, setSelectedKey] = useState(null);
  const [hoveredKey, setHoveredKey] = useState(null);
  const containerRef = useRef(null);

  // Synchronize incoming activeReport prop
  useEffect(() => {
    if (activeReport) {
      setLocalReport(activeReport);
    }
  }, [activeReport]);

  const currentPeriod = onReportChange ? (activeReport || localReport) : localReport;

  const handlePeriodChange = (newPeriod) => {
    setLocalReport(newPeriod);
    if (onReportChange) {
      onReportChange(newPeriod);
    }
  };

  // Close selected key drawer on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedKey(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Normalize characterStats to safe array
  const safeStats = useMemo(() => {
    if (!characterStats) return [];
    if (Array.isArray(characterStats)) return characterStats;
    if (typeof characterStats === 'object') {
      return Object.entries(characterStats).map(([char, data]) => ({ char, ...data }));
    }
    return [];
  }, [characterStats]);

  // Map character stats by lowercase key id, uppercase, and special aliases
  const statsMap = useMemo(() => {
    const map = {};
    safeStats.forEach((c) => {
      if (c && c.char !== undefined && c.char !== null) {
        const raw = String(c.char);
        const lower = raw.toLowerCase();
        map[raw] = c;
        map[lower] = c;
        if (raw === ' ' || lower === 'space') {
          map['space'] = c;
          map[' '] = c;
        }
      }
    });
    return map;
  }, [safeStats]);

  // Extract practiced keys with at least 3 attempts to prevent statistical outliers
  const practicedStats = useMemo(() => {
    return safeStats.filter((c) => Number(c?.total || 0) >= 3);
  }, [safeStats]);

  // Calculate speed range (CPM) for robust relative heatmap color distribution
  const speedRange = useMemo(() => {
    if (practicedStats.length === 0) {
      return { min: 100, max: 300 };
    }
    const cpms = practicedStats.map((c) => Number(c.cpm || (c.wpm ? c.wpm * 5 : 0)) || 0).filter((v) => v > 0);
    if (cpms.length === 0) {
      const fallbackCpm = (avgWpm || 40) * 5;
      return { min: Math.max(50, fallbackCpm * 0.7), max: Math.max(150, fallbackCpm * 1.3) };
    }
    const minVal = Math.min(...cpms);
    const maxVal = Math.max(...cpms);
    return {
      min: minVal,
      max: maxVal > minVal ? maxVal : minVal + 50,
    };
  }, [practicedStats, avgWpm]);

  // Helper to resolve key stat safely from key definition
  const resolveKeyStat = (keyDef) => {
    const keyId = keyDef.id.toLowerCase();
    return statsMap[keyId] || (keyDef.bot ? statsMap[keyDef.bot.toLowerCase()] : null) || (keyDef.label ? statsMap[keyDef.label.toLowerCase()] : null);
  };

  // Compute key color based on active mode (Speed or Accuracy)
  const getKeyColorStyle = (keyDef) => {
    const stat = resolveKeyStat(keyDef);
    const totalAttempts = Number(stat?.total || 0);

    // Unpracticed or insufficient data (< 3 attempts): honest neutral appearance
    if (!stat || totalAttempts < 3) {
      return {
        backgroundColor: 'var(--bg-elevated)',
        color: 'var(--text-muted)',
        border: '1px solid var(--border)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      };
    }

    if (mode === 'speed') {
      // Darker blue = faster character CPM (TypingClub Reference 2)
      const keyCpm = Number(stat.cpm || (stat.wpm ? stat.wpm * 5 : 0)) || 0;
      const { min, max } = speedRange;
      const ratio = max > min ? Math.max(0, Math.min(1, (keyCpm - min) / (max - min))) : 0.5;

      if (ratio >= 0.82) {
        return {
          backgroundColor: '#0284c7', // Deep Sapphire Blue (Fastest)
          color: '#ffffff',
          border: '1px solid #0369a1',
          boxShadow: '0 1px 3px rgba(2, 132, 199, 0.35)',
        };
      } else if (ratio >= 0.62) {
        return {
          backgroundColor: '#0ea5e9', // Vibrant Cerulean Blue
          color: '#ffffff',
          border: '1px solid #0284c7',
          boxShadow: '0 1px 3px rgba(14, 165, 233, 0.3)',
        };
      } else if (ratio >= 0.42) {
        return {
          backgroundColor: '#38bdf8', // Medium Sky Blue
          color: '#082f49',
          border: '1px solid #0ea5e9',
          boxShadow: '0 1px 2px rgba(56, 189, 248, 0.25)',
        };
      } else if (ratio >= 0.22) {
        return {
          backgroundColor: '#7dd3fc', // Light Sky Blue
          color: '#082f49',
          border: '1px solid #38bdf8',
          boxShadow: '0 1px 2px rgba(125, 211, 252, 0.2)',
        };
      } else {
        return {
          backgroundColor: '#bae6fd', // Pale Sky Blue (Slowest practiced)
          color: '#082f49',
          border: '1px solid #7dd3fc',
          boxShadow: '0 1px 2px rgba(186, 230, 253, 0.2)',
        };
      }
    } else {
      // Accuracy mode: blue shows 100% accuracy, red shows lower accuracy (TypingClub Reference 3)
      const acc = Number(stat.accuracy !== undefined ? stat.accuracy : 100);

      if (acc >= 98) {
        return {
          backgroundColor: '#0284c7', // Sapphire Blue (100% / Flawless)
          color: '#ffffff',
          border: '1px solid #0369a1',
          boxShadow: '0 1px 3px rgba(2, 132, 199, 0.35)',
        };
      } else if (acc >= 94) {
        return {
          backgroundColor: '#0ea5e9', // Vibrant Cerulean Blue (High accuracy)
          color: '#ffffff',
          border: '1px solid #0284c7',
          boxShadow: '0 1px 3px rgba(14, 165, 233, 0.3)',
        };
      } else if (acc >= 88) {
        return {
          backgroundColor: '#38bdf8', // Light Cerulean (Good)
          color: '#082f49',
          border: '1px solid #0ea5e9',
          boxShadow: '0 1px 2px rgba(56, 189, 248, 0.25)',
        };
      } else if (acc >= 80) {
        return {
          backgroundColor: '#f87171', // Soft Coral / Light Red (Fair)
          color: '#ffffff',
          border: '1px solid #ef4444',
          boxShadow: '0 1px 2px rgba(248, 113, 113, 0.25)',
        };
      } else if (acc >= 68) {
        return {
          backgroundColor: '#ef4444', // Medium Red (Poor)
          color: '#ffffff',
          border: '1px solid #dc2626',
          boxShadow: '0 1px 3px rgba(239, 68, 68, 0.3)',
        };
      } else {
        return {
          backgroundColor: '#dc2626', // Deep Crimson Red (Very Poor)
          color: '#ffffff',
          border: '1px solid #b91c1c',
          boxShadow: '0 1px 3px rgba(220, 38, 38, 0.35)',
        };
      }
    }
  };

  const handleKeyClick = (keyDef) => {
    const keyId = keyDef.id.toLowerCase();
    const stat = resolveKeyStat(keyDef);
    const fingerAssignment = KEY_FINGER_MAP[keyId]?.finger || 'unassigned';

    setSelectedKey({
      keyDef,
      stat: stat || { total: 0, correct: 0, incorrect: 0, cpm: 0, wpm: 0, accuracy: 0 },
      finger: fingerAssignment,
    });
  };

  // Calculate relative comparison for selected key (Tip 3)
  const relativeComparison = useMemo(() => {
    if (!selectedKey || !selectedKey.stat || Number(selectedKey.stat.total || 0) < 3) {
      return null;
    }
    const keyCpm = Number(selectedKey.stat.cpm || (selectedKey.stat.wpm ? selectedKey.stat.wpm * 5 : 0)) || 0;
    const overallCpm = (avgWpm || 40) * 5;
    if (overallCpm <= 0) return null;
    const diffPct = Math.round(((keyCpm - overallCpm) / overallCpm) * 100);
    return {
      diffPct,
      isFaster: diffPct > 0,
      isSlower: diffPct < 0,
    };
  }, [selectedKey, avgWpm]);

  // Determine period display label
  const periodLabel = useMemo(() => {
    if (currentPeriod === 'today' || currentPeriod === 'daily') return 'Today';
    if (currentPeriod === 'weekly') return 'This Week';
    return 'Overall All-Time';
  }, [currentPeriod]);

  return (
    <div
      ref={containerRef}
      className="card-panel p-4 sm:p-6 md:p-7 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-md space-y-6"
    >
      {/* ── Top Header & Controls ─────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg sm:text-xl font-bold font-mono tracking-tight text-[var(--text-primary)]">
              Keyboard Mastery
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)] font-medium">
              ANSI 60%
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-2xl leading-relaxed">
            This color coded keyboard shows speed and accuracy per character. The darker the blue, the faster the character. White keys have not been practiced yet.
          </p>
        </div>

        {/* Segmented Controls Strip: [ Speed | Accuracy ] */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          {/* Speed | Accuracy Mode Toggle */}
          <div
            role="group"
            aria-label="Analytics mode toggle"
            className="inline-flex rounded-xl bg-[var(--bg-elevated)] p-1 border border-[var(--border)] text-xs font-mono shadow-xs"
          >
            <button
              type="button"
              onClick={() => setMode('speed')}
              className={`px-4 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                mode === 'speed'
                  ? 'bg-[var(--accent)] text-white shadow-xs font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              Speed
            </button>
            <button
              type="button"
              onClick={() => setMode('accuracy')}
              className={`px-4 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                mode === 'accuracy'
                  ? 'bg-[var(--accent)] text-white shadow-xs font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              Accuracy
            </button>
          </div>
        </div>
      </div>

      {/* ── Interactive 60% ANSI Keyboard Chassis ─────────────────────────── */}
      <div className="relative p-3 sm:p-5 md:p-6 rounded-3xl bg-[var(--bg-elevated)]/70 border border-[var(--border)] shadow-inner overflow-x-auto">
        <div className="min-w-[620px] sm:min-w-[680px] max-w-[840px] mx-auto p-3 sm:p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)]/80 shadow-sm space-y-1.5 sm:space-y-2 select-none">
          {ROW_DEFS.map((row, rIdx) => (
            <div key={rIdx} className="flex gap-1.5 justify-center">
              {row.keys.map((k) => {
                const style = getKeyColorStyle(k);
                const isSelected = selectedKey?.keyDef?.id === k.id;
                const stat = resolveKeyStat(k);
                const hasData = stat && Number(stat.total || 0) >= 3;
                const flexGrow = k.u;

                const cpmVal = Number(stat?.cpm || (stat?.wpm ? stat.wpm * 5 : 0)) || 0;
                const wpmVal = Number(stat?.wpm || (stat?.cpm ? Math.round(stat.cpm / 5) : 0)) || 0;
                const accVal = Number(stat?.accuracy !== undefined ? stat.accuracy : 100);

                const tooltipTitle = hasData
                  ? `Key '${k.bot || k.label || k.id}' • ${cpmVal} CPM (${wpmVal} WPM) • ${accVal}% Acc • ${stat.total} strokes`
                  : `Key '${k.bot || k.label || k.id}': Not practiced yet`;

                return (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => handleKeyClick(k)}
                    onMouseEnter={() => setHoveredKey({ keyDef: k, stat, hasData, cpm: cpmVal, wpm: wpmVal, acc: accVal })}
                    onMouseLeave={() => setHoveredKey(null)}
                    style={{
                      ...style,
                      flex: `${flexGrow} 0 0%`,
                      minHeight: '42px',
                    }}
                    className={`relative rounded-lg p-1 text-xs font-mono font-bold flex flex-col items-center justify-center transition-all duration-240 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'ring-2 ring-[var(--accent)] ring-offset-2 z-10 scale-105'
                        : 'hover:scale-[1.03] hover:z-10'
                    }`}
                    title={tooltipTitle}
                    aria-label={`Key ${k.label || k.id}`}
                  >
                    {k.top ? (
                      <div className="flex flex-col items-center leading-tight text-[10px]">
                        <span className="opacity-75">{k.top}</span>
                        <span className="font-extrabold text-[12px]">{k.bot}</span>
                      </div>
                    ) : (
                      <span className={`${k.isSpecial ? 'text-[10px] font-normal tracking-tight' : 'text-xs lowercase'}`}>
                        {k.label || k.id}
                      </span>
                    )}

                    {/* Home row tactile homing bumps on f and j */}
                    {k.hasBump && (
                      <span className="absolute bottom-1 w-2.5 h-0.5 rounded-full bg-current opacity-70" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Live Hover Status Strip / Quick Inspection */}
        <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)] px-3 max-w-[840px] mx-auto min-h-[22px]">
          {hoveredKey ? (
            <div className="flex items-center gap-3 animate-in fade-in">
              <span className="font-bold text-[var(--text-primary)]">
                Key '{hoveredKey.keyDef.bot || hoveredKey.keyDef.label || hoveredKey.keyDef.id}':
              </span>
              {hoveredKey.hasData ? (
                <>
                  <span>
                    Speed: <strong className="text-[var(--text-primary)]">{hoveredKey.cpm} CPM</strong> ({hoveredKey.wpm} WPM)
                  </span>
                  <span>•</span>
                  <span>
                    Accuracy: <strong className={hoveredKey.acc >= 90 ? 'text-emerald-500' : 'text-rose-500'}>{hoveredKey.acc}%</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Attempts: <strong className="text-[var(--text-primary)]">{hoveredKey.stat.total}</strong>
                  </span>
                </>
              ) : (
                <span className="text-[var(--text-muted)] italic">
                  Not enough data yet (requires 3+ keystrokes in this period)
                </span>
              )}
            </div>
          ) : (
            <span className="text-[var(--text-muted)] text-[10px]">
              Hover any key for quick inspection • Click for comprehensive character intelligence
            </span>
          )}

          <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold shrink-0">
            {periodLabel}
          </span>
        </div>
      </div>

      {/* ── Selected Key Detailed Intelligence Drawer ─────────────────────── */}
      {selectedKey && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--accent)] shadow-xl space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-3.5">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-xl bg-[var(--bg-surface)] border-2 border-[var(--accent)] flex items-center justify-center font-mono font-black text-2xl text-[var(--accent)] shadow-sm">
                {selectedKey.keyDef.bot || selectedKey.keyDef.label || selectedKey.keyDef.id}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold font-mono text-[var(--text-primary)]">
                    Character '{selectedKey.keyDef.label || selectedKey.keyDef.id}'
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)]">
                    {periodLabel}
                  </span>
                </div>
                <div className="text-xs text-[var(--text-muted)] mt-0.5 capitalize">
                  Assigned Finger: <strong className="text-[var(--text-primary)]">{selectedKey.finger.replace('-', ' ')}</strong>
                  {selectedKey.keyDef.hasBump && (
                    <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 font-mono">
                      Homing Anchor
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedKey(null)}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] border border-transparent hover:border-[var(--border)] cursor-pointer self-start sm:self-auto transition-all"
              title="Close key details (Esc)"
              aria-label="Close key details"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Key Metrics Grid */}
          {Number(selectedKey.stat.total || 0) >= 3 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] space-y-1">
                <span className="text-[var(--text-muted)] text-[10px] block flex items-center gap-1">
                  <Activity className="w-3 h-3 text-sky-500" />
                  Speed (CPM)
                </span>
                <span className="text-lg font-bold text-[var(--text-primary)]">
                  {selectedKey.stat.cpm || (selectedKey.stat.wpm ? selectedKey.stat.wpm * 5 : 0)} CPM
                </span>
                <span className="text-[10px] text-[var(--text-secondary)] block">
                  ≈ {selectedKey.stat.wpm || Math.round((selectedKey.stat.cpm || 0) / 5)} WPM
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] space-y-1">
                <span className="text-[var(--text-muted)] text-[10px] block flex items-center gap-1">
                  <Target className="w-3 h-3 text-emerald-500" />
                  Keystroke Accuracy
                </span>
                <span className={`text-lg font-bold ${selectedKey.stat.accuracy >= 90 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {selectedKey.stat.accuracy}%
                </span>
                <span className="text-[10px] text-[var(--text-secondary)] block">
                  Error rate: {selectedKey.stat.total > 0 ? ((selectedKey.stat.incorrect / selectedKey.stat.total) * 100).toFixed(1) : 0}%
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] space-y-1">
                <span className="text-[var(--text-muted)] text-[10px] block flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-500" />
                  Total Keystrokes
                </span>
                <span className="text-lg font-bold text-[var(--text-primary)]">
                  {Number(selectedKey.stat.total).toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-500 block">
                  {Number(selectedKey.stat.correct).toLocaleString()} correct
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] space-y-1">
                <span className="text-[var(--text-muted)] text-[10px] block flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-rose-500" />
                  Mistakes Made
                </span>
                <span className="text-lg font-bold text-rose-500">
                  {Number(selectedKey.stat.incorrect).toLocaleString()}
                </span>
                <span className="text-[10px] text-[var(--text-muted)] block">
                  Uncorrected errors included
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-dashed border-[var(--border)] text-center text-xs font-mono text-[var(--text-secondary)]">
              This character has fewer than 3 keystroke samples in {periodLabel}. Practice typing in the Workstation or Academy to generate authentic velocity and accuracy heatmaps!
            </div>
          )}

          {/* Relative Comparison Callout (Tip 3 fulfillment) */}
          {relativeComparison && (
            <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <TrendingUp className={`w-4 h-4 ${relativeComparison.isFaster ? 'text-emerald-500' : 'text-amber-500'}`} />
                <span>
                  Relative Speed: Key '{selectedKey.keyDef.label || selectedKey.keyDef.id}' is{' '}
                  <strong className={relativeComparison.isFaster ? 'text-emerald-500 font-bold' : 'text-amber-500 font-bold'}>
                    {relativeComparison.diffPct > 0 ? `+${relativeComparison.diffPct}%` : `${relativeComparison.diffPct}%`}
                  </strong>{' '}
                  {relativeComparison.isFaster ? 'faster' : 'slower'} than your overall session average ({avgWpm} WPM / {avgWpm * 5} CPM).
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Three Educational Tip Cards (TypingClub Reference 2 & 3) ──────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 text-amber-500 mt-0.5">
            <Lightbulb className="w-3.5 h-3.5" />
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
            <strong className="text-[var(--text-primary)] font-semibold">Tip: </strong>
            When viewing speed, the darker the blue, the faster your typing speed on that key is.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 text-amber-500 mt-0.5">
            <Lightbulb className="w-3.5 h-3.5" />
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
            <strong className="text-[var(--text-primary)] font-semibold">Tip: </strong>
            When viewing accuracy, blue shows 100% accuracy and red shows lower accuracy.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 text-amber-500 mt-0.5">
            <Lightbulb className="w-3.5 h-3.5" />
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
            <strong className="text-[var(--text-primary)] font-semibold">Tip: </strong>
            Click the keys to view the speed of other keys in respect to that key.
          </p>
        </div>
      </div>

      {/* ── Compact Legend Strips (Matching Reference Images 2 & 3) ───────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-[11px] font-mono text-[var(--text-muted)] border-t border-[var(--border)]/60">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded bg-[var(--bg-elevated)] border border-[var(--border)]" />
          <span>Unpracticed (&lt; 3 keystrokes)</span>
        </div>

        {mode === 'speed' ? (
          <div className="flex items-center gap-2">
            <span>Slower</span>
            <div className="flex items-center gap-1">
              <span className="w-5 h-3.5 rounded-xs bg-[#bae6fd] border border-[#7dd3fc]" title="Slowest practiced" />
              <span className="w-5 h-3.5 rounded-xs bg-[#7dd3fc] border border-[#38bdf8]" title="Slow" />
              <span className="w-5 h-3.5 rounded-xs bg-[#38bdf8] border border-[#0ea5e9]" title="Moderate" />
              <span className="w-5 h-3.5 rounded-xs bg-[#0ea5e9] border border-[#0284c7]" title="Fast" />
              <span className="w-5 h-3.5 rounded-xs bg-[#0284c7] border border-[#0369a1]" title="Fastest" />
            </div>
            <span>Faster</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span>Lower Accuracy</span>
            <div className="flex items-center gap-1">
              <span className="w-5 h-3.5 rounded-xs bg-[#dc2626] border border-[#b91c1c]" title="< 68% Accuracy" />
              <span className="w-5 h-3.5 rounded-xs bg-[#ef4444] border border-[#dc2626]" title="68% - 79% Accuracy" />
              <span className="w-5 h-3.5 rounded-xs bg-[#f87171] border border-[#ef4444]" title="80% - 87% Accuracy" />
              <span className="w-5 h-3.5 rounded-xs bg-[#38bdf8] border border-[#0ea5e9]" title="88% - 93% Accuracy" />
              <span className="w-5 h-3.5 rounded-xs bg-[#0ea5e9] border border-[#0284c7]" title="94% - 97% Accuracy" />
              <span className="w-5 h-3.5 rounded-xs bg-[#0284c7] border border-[#0369a1]" title="98% - 100% Accuracy" />
            </div>
            <span>100% Accuracy</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default KeyboardMastery;
