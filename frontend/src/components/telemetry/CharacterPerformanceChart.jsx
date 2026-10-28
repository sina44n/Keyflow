import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * CharacterPerformanceChart
 * 
 * Displays ranked horizontal bar chart for characters practiced.
 * Supports sorting by Speed (WPM), Accuracy (%), and Error Count.
 * Matches Reference Image 1 (Speed and Accuracy per Character).
 */
export default function CharacterPerformanceChart({ characterStats = {} }) {
  const [metric, setMetric] = useState('speed'); // 'speed' | 'accuracy' | 'errors'
  const [activeCategory, setActiveCategory] = useState('all'); // 'all' | 'letters' | 'numbers' | 'symbols'
  const [hoveredChar, setHoveredChar] = useState(null);

  // Convert characterStats (array or object) to normalized array
  const charList = useMemo(() => {
    if (!characterStats) return [];
    const rawList = Array.isArray(characterStats)
      ? characterStats
      : Object.entries(characterStats).map(([char, data]) => ({ char, ...data }));

    return rawList.map((data) => {
      const char = data?.char || '';
      return {
        char,
        wpm: data?.wpm || 0,
        accuracy: data?.accuracy ?? 100,
        totalKeystrokes: data?.totalKeystrokes ?? data?.total ?? 0,
        correctKeystrokes: data?.correctKeystrokes ?? data?.correct ?? 0,
        mistakes: data?.mistakes ?? data?.incorrect ?? 0,
        isLetter: /^[a-zA-Z]$/.test(char),
        isNumber: /^[0-9]$/.test(char),
        isSymbol: /^[^a-zA-Z0-9\s]$/.test(char) || char === ' ',
      };
    });
  }, [characterStats]);

  // Filter by category
  const filteredList = useMemo(() => {
    let list = charList.filter(c => c.totalKeystrokes > 0);
    if (activeCategory === 'letters') list = list.filter(c => c.isLetter);
    if (activeCategory === 'numbers') list = list.filter(c => c.isNumber);
    if (activeCategory === 'symbols') list = list.filter(c => c.isSymbol);

    // Sort based on selected metric
    return list.sort((a, b) => {
      if (metric === 'speed') return b.wpm - a.wpm || b.totalKeystrokes - a.totalKeystrokes;
      if (metric === 'accuracy') return b.accuracy - a.accuracy || b.totalKeystrokes - a.totalKeystrokes;
      if (metric === 'errors') return b.mistakes - a.mistakes || b.totalKeystrokes - a.totalKeystrokes;
      return 0;
    });
  }, [charList, activeCategory, metric]);

  // Key highlights
  const highlights = useMemo(() => {
    const validWithSpeed = charList.filter(c => c.totalKeystrokes >= 3 && c.wpm > 0);
    const validWithErrors = charList.filter(c => c.mistakes > 0);

    const fastest = validWithSpeed.length > 0
      ? [...validWithSpeed].sort((a, b) => b.wpm - a.wpm)[0]
      : null;
    const slowest = validWithSpeed.length > 0
      ? [...validWithSpeed].sort((a, b) => a.wpm - b.wpm)[0]
      : null;
    const mostAccurate = validWithSpeed.length > 0
      ? [...validWithSpeed].sort((a, b) => b.accuracy - a.accuracy || b.totalKeystrokes - a.totalKeystrokes)[0]
      : null;
    const mostMistyped = validWithErrors.length > 0
      ? [...validWithErrors].sort((a, b) => b.mistakes - a.mistakes)[0]
      : null;

    return { fastest, slowest, mostAccurate, mostMistyped };
  }, [charList]);

  // Max value for bar scaling
  const maxValue = useMemo(() => {
    if (filteredList.length === 0) return 100;
    if (metric === 'speed') return Math.max(60, ...filteredList.map(c => c.wpm));
    if (metric === 'accuracy') return 100;
    if (metric === 'errors') return Math.max(5, ...filteredList.map(c => c.mistakes));
    return 100;
  }, [filteredList, metric]);

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4 sm:p-6 shadow-sm">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <h3 className="text-xl font-bold text-[var(--text-main)] tracking-tight">
            Speed and Accuracy per Character
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            This chart shows the current speed and accuracy for each character. Hover over a bar to see exact details.
          </p>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex flex-wrap p-1 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-xs font-semibold">
            <button
              onClick={() => setMetric('speed')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all ${
                metric === 'speed'
                  ? 'bg-[var(--accent)] text-white shadow-sm font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Speed (WPM)
            </button>
            <button
              onClick={() => setMetric('accuracy')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all ${
                metric === 'accuracy'
                  ? 'bg-[var(--accent)] text-white shadow-sm font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Accuracy (%)
            </button>
            <button
              onClick={() => setMetric('errors')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all ${
                metric === 'errors'
                  ? 'bg-rose-500 text-white shadow-sm font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Mistakes
            </button>
          </div>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-4 pb-3">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[var(--text-muted)] font-medium mr-1">Filter:</span>
          {['all', 'letters', 'numbers', 'symbols'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded-md capitalize font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30 font-semibold'
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-main)] border border-transparent'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <span className="text-xs text-[var(--text-muted)]">
          {filteredList.length} character{filteredList.length === 1 ? '' : 's'} recorded
        </span>
      </div>

      {/* Main Bar Chart Container */}
      {filteredList.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[var(--bg-main)] border border-[var(--border)] flex items-center justify-center text-xl text-[var(--text-muted)]">
            ⌨️
          </div>
          <h4 className="text-sm font-semibold text-[var(--text-main)]">No character data recorded yet</h4>
          <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm mx-auto">
            Complete typing lessons in the Academy or practice sprints in the Workstation to see character speed and accuracy breakdowns.
          </p>
        </div>
      ) : (
        <div className="mt-3 max-h-96 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
          {filteredList.map((item) => {
            const displayChar = item.char === ' ' ? 'Space' : item.char;
            let barValue = 0;
            let displayVal = '';
            let barColor = 'bg-sky-400';

            if (metric === 'speed') {
              barValue = item.wpm;
              displayVal = `${item.wpm} WPM`;
              barColor = 'bg-sky-500';
            } else if (metric === 'accuracy') {
              barValue = item.accuracy;
              displayVal = `${item.accuracy}%`;
              barColor = item.accuracy >= 95 ? 'bg-emerald-500' : item.accuracy >= 85 ? 'bg-amber-500' : 'bg-rose-500';
            } else {
              barValue = item.mistakes;
              displayVal = `${item.mistakes} error${item.mistakes === 1 ? '' : 's'}`;
              barColor = 'bg-rose-500';
            }

            const barWidthPercent = Math.min(100, Math.max(2, (barValue / maxValue) * 100));

            return (
              <div
                key={item.char}
                className="group relative flex items-center gap-3 p-1.5 rounded-lg hover:bg-[var(--bg-main)]/60 transition-colors"
                onMouseEnter={() => setHoveredChar(item)}
                onMouseLeave={() => setHoveredChar(null)}
              >
                {/* Character Badge */}
                <div className="w-8 h-8 rounded-lg bg-[var(--bg-main)] border border-[var(--border)] flex items-center justify-center font-mono font-bold text-sm text-[var(--text-main)] shadow-2xs shrink-0">
                  {displayChar}
                </div>

                {/* Bar Track */}
                <div className="flex-1 h-6 bg-[var(--bg-main)] rounded-md overflow-hidden relative border border-[var(--border)]/40">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${barWidthPercent}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className={`h-full ${barColor} rounded-sm flex items-center justify-end pr-2`}
                  />
                  {/* Overlay text on bar */}
                  <span className="absolute inset-y-0 right-2 flex items-center text-xs font-semibold text-[var(--text-main)] pointer-events-none drop-shadow-xs">
                    {displayVal}
                  </span>
                </div>

                {/* Additional Quick Stats */}
                <div className="w-32 text-right shrink-0 text-xs hidden sm:block">
                  <span className="text-[var(--text-muted)] font-mono">
                    {item.accuracy}% acc · {item.totalKeystrokes} hits
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating or Inline Tooltip for Hovered Character */}
      {hoveredChar && (
        <div className="mt-4 p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--accent)]/40 flex flex-wrap items-center justify-between gap-4 text-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-md bg-[var(--accent)] text-white font-mono font-bold flex items-center justify-center">
              {hoveredChar.char === ' ' ? '␣' : hoveredChar.char}
            </span>
            <span className="font-semibold text-[var(--text-main)]">
              Character Details for "{hoveredChar.char === ' ' ? 'Space' : hoveredChar.char}"
            </span>
          </div>
          <div className="flex items-center gap-4 text-[var(--text-muted)] font-mono">
            <span>Speed: <strong className="text-[var(--text-main)]">{hoveredChar.wpm} WPM</strong></span>
            <span>Accuracy: <strong className="text-[var(--text-main)]">{hoveredChar.accuracy}%</strong></span>
            <span>Correct: <strong className="text-emerald-500">{hoveredChar.correctKeystrokes}</strong></span>
            <span>Errors: <strong className="text-rose-500">{hoveredChar.mistakes}</strong></span>
            <span>Total: <strong className="text-[var(--text-main)]">{hoveredChar.totalKeystrokes}</strong></span>
          </div>
        </div>
      )}

      {/* Highlight Cards Row (Fastest, Slowest, Most Accurate, Most Mistyped) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-[var(--border)]">
        <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border)]">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Fastest Character</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-lg font-bold text-[var(--text-main)]">
              {highlights.fastest ? (highlights.fastest.char === ' ' ? 'Space' : highlights.fastest.char) : '—'}
            </span>
            <span className="text-xs font-semibold text-sky-500 font-mono">
              {highlights.fastest ? `${highlights.fastest.wpm} WPM` : 'Insufficient data'}
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border)]">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Slowest Character</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-lg font-bold text-[var(--text-main)]">
              {highlights.slowest ? (highlights.slowest.char === ' ' ? 'Space' : highlights.slowest.char) : '—'}
            </span>
            <span className="text-xs font-semibold text-amber-500 font-mono">
              {highlights.slowest ? `${highlights.slowest.wpm} WPM` : 'Insufficient data'}
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border)]">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Most Accurate</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-lg font-bold text-[var(--text-main)]">
              {highlights.mostAccurate ? (highlights.mostAccurate.char === ' ' ? 'Space' : highlights.mostAccurate.char) : '—'}
            </span>
            <span className="text-xs font-semibold text-emerald-500 font-mono">
              {highlights.mostAccurate ? `${highlights.mostAccurate.accuracy}%` : 'Insufficient data'}
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border)]">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Most Frequent Error</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-lg font-bold text-[var(--text-main)]">
              {highlights.mostMistyped ? (highlights.mostMistyped.char === ' ' ? 'Space' : highlights.mostMistyped.char) : '—'}
            </span>
            <span className="text-xs font-semibold text-rose-500 font-mono">
              {highlights.mostMistyped ? `${highlights.mostMistyped.mistakes} errors` : '0 errors'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
