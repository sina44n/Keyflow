import React, { useState, useMemo } from 'react';
import { Lightbulb } from 'lucide-react';
import { generateProgressTimeSeries } from '../../utils/telemetryStorage.js';

export const ProgressOverviewChart = ({ sessions = [], activeReportMetrics }) => {
  const [aggregation, setAggregation] = useState('daily'); // 'daily' | 'weekly' | 'monthly'

  // Metric visibility toggles (Reference Image 3)
  const [showPracticeTime, setShowPracticeTime] = useState(true);
  const [showAccuracy, setShowAccuracy] = useState(true);
  const [showCoverage, setShowCoverage] = useState(true);
  const [showSpeed, setShowSpeed] = useState(true);

  // Hovered data point
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Generate series data
  const series = useMemo(() => {
    return generateProgressTimeSeries(sessions, aggregation);
  }, [sessions, aggregation]);

  // Overall time frame summary values (Reference Image 3 Left Panel)
  const accuracyVal = activeReportMetrics?.accuracy !== undefined ? `${activeReportMetrics.accuracy}%` : '100%';
  const coverageVal = activeReportMetrics?.coveragePercent !== undefined ? `${activeReportMetrics.coveragePercent}%` : '91%';
  const speedVal = activeReportMetrics?.avgWpm !== undefined ? `${activeReportMetrics.avgWpm} wpm` : '0 wpm';
  const practiceTimeVal = activeReportMetrics?.durationFormatted || '0s';

  // SVG Chart Dimensions (ViewBox: 0 0 800 240)
  const width = 800;
  const height = 240;
  const paddingLeft = 40;
  const paddingRight = 30;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  // Maximum scales safely computed with reduce
  const maxWpm = useMemo(() => {
    return series.reduce((max, s) => Math.max(max, s?.wpm || 0), 100);
  }, [series]);

  const maxMinutes = useMemo(() => {
    return series.reduce((max, s) => Math.max(max, s?.practiceMinutes || 0), 10);
  }, [series]);

  // Compute coordinate points
  const points = useMemo(() => {
    if (series.length === 0) return [];
    return series.map((item, idx) => {
      const x = series.length === 1
        ? paddingLeft + chartW / 2
        : paddingLeft + (idx / (series.length - 1)) * chartW;

      // Accuracy % (0 - 100)
      const accY = paddingTop + chartH - ((item.accuracy || 0) / 100) * chartH;
      // Coverage % (0 - 100)
      const covY = paddingTop + chartH - ((item.coverage || 0) / 100) * chartH;
      // Speed WPM (0 - maxWpm)
      const speedY = paddingTop + chartH - ((item.wpm || 0) / maxWpm) * chartH;
      // Practice Time Bar Height
      const barHeight = ((item.practiceMinutes || 0) / maxMinutes) * (chartH * 0.7);
      const barY = paddingTop + chartH - barHeight;

      return {
        x,
        accY,
        covY,
        speedY,
        barY,
        barHeight,
        item,
      };
    });
  }, [series, chartW, chartH, maxWpm, maxMinutes]);

  // Build SVG path strings
  const accPath = points.length > 0 ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.accY}`).join(' ') : '';
  const covPath = points.length > 0 ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.covY}`).join(' ') : '';
  const speedPath = points.length > 0 ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.speedY}`).join(' ') : '';

  const activePoint = hoveredIndex !== null && points[hoveredIndex] ? points[hoveredIndex] : null;

  return (
    <div className="card-panel p-6 sm:p-7 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-md space-y-6">
      {/* Top Header & Aggregation Controls (Reference Image 3) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold font-mono tracking-tight text-[var(--text-primary)]">
            Progress Overview
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Use this graph to monitor speed and coverage improvement over time.
          </p>
        </div>

        {/* Daily | Weekly | Monthly segmented tabs */}
        <div className="inline-flex rounded-xl bg-[var(--bg-elevated)] p-1 border border-[var(--border)] text-xs font-mono self-start sm:self-auto">
          {['daily', 'weekly', 'monthly'].map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setAggregation(mode)}
              className={`px-3 py-1.5 rounded-lg capitalize font-semibold transition-all cursor-pointer ${
                aggregation === mode
                  ? 'bg-[var(--accent)] text-[var(--accent-fg)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Left Metrics Summary vs Right Multi-Metric Chart (Reference Image 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Side Summary Panel (Reference Image 3) */}
        <div className="lg:col-span-4 p-5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-3.5 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <span className="text-[var(--text-secondary)]">Accuracy %</span>
            <span className="text-sm font-bold text-emerald-400">{accuracyVal}</span>
          </div>
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <span className="text-[var(--text-secondary)]">Coverage</span>
            <span className="text-sm font-bold text-purple-400">{coverageVal}</span>
          </div>
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <span className="text-[var(--text-secondary)]">Speed (WPM)</span>
            <span className="text-sm font-bold text-amber-400">{speedVal}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-secondary)]">Practice for This Time Frame</span>
            <span className="text-sm font-bold text-cyan-400">{practiceTimeVal}</span>
          </div>
        </div>

        {/* Right Side Interactive SVG Chart (Reference Image 3) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Metric Toggle Legend Checkboxes */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
            {/* Practice Time Toggle */}
            <button
              type="button"
              onClick={() => setShowPracticeTime(!showPracticeTime)}
              className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <span className={`w-3.5 h-3.5 rounded-xs flex items-center justify-center ${showPracticeTime ? 'bg-cyan-400' : 'border border-[var(--border)]'}`}>
                {showPracticeTime && <span className="w-1.5 h-1.5 bg-black rounded-xs" />}
              </span>
              <span className="text-[var(--text-secondary)]">Practice Time</span>
            </button>

            {/* Accuracy Toggle */}
            <button
              type="button"
              onClick={() => setShowAccuracy(!showAccuracy)}
              className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <span className={`w-3.5 h-3.5 rounded-xs flex items-center justify-center ${showAccuracy ? 'bg-emerald-400' : 'border border-[var(--border)]'}`}>
                {showAccuracy && <span className="w-1.5 h-1.5 bg-black rounded-xs" />}
              </span>
              <span className="text-[var(--text-secondary)]">Accuracy %</span>
            </button>

            {/* Coverage Toggle */}
            <button
              type="button"
              onClick={() => setShowCoverage(!showCoverage)}
              className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <span className={`w-3.5 h-3.5 rounded-xs flex items-center justify-center ${showCoverage ? 'bg-purple-400' : 'border border-[var(--border)]'}`}>
                {showCoverage && <span className="w-1.5 h-1.5 bg-black rounded-xs" />}
              </span>
              <span className="text-[var(--text-secondary)]">Coverage</span>
            </button>

            {/* Speed Toggle */}
            <button
              type="button"
              onClick={() => setShowSpeed(!showSpeed)}
              className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <span className={`w-3.5 h-3.5 rounded-xs flex items-center justify-center ${showSpeed ? 'bg-amber-400' : 'border border-[var(--border)]'}`}>
                {showSpeed && <span className="w-1.5 h-1.5 bg-black rounded-xs" />}
              </span>
              <span className="text-[var(--text-secondary)]">Speed (WPM)</span>
            </button>
          </div>

          {/* SVG Canvas */}
          <div className="relative w-full rounded-xl bg-[var(--bg-elevated)]/40 border border-[var(--border)] p-2 overflow-hidden">
            <svg
              className="w-full h-56 select-none"
              viewBox={`0 0 ${width} ${height}`}
              preserveAspectRatio="none"
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Background horizontal gridlines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = paddingTop + ratio * chartH;
                return (
                  <line
                    key={i}
                    x1={paddingLeft}
                    y1={y}
                    x2={width - paddingRight}
                    y2={y}
                    className="stroke-[var(--border)] stroke-1 opacity-50"
                    strokeDasharray="4 4"
                  />
                );
              })}

              {/* Practice Time Cyan Vertical Bars */}
              {showPracticeTime &&
                points.map((p, idx) => (
                  <rect
                    key={idx}
                    x={p.x - 3}
                    y={p.barY}
                    width={6}
                    height={Math.max(2, p.barHeight)}
                    className="fill-cyan-400/50 hover:fill-cyan-400 transition-colors cursor-pointer"
                    rx="1"
                    onMouseEnter={() => setHoveredIndex(idx)}
                  />
                ))}

              {/* Coverage Purple Line */}
              {showCoverage && covPath && (
                <path
                  d={covPath}
                  className="fill-none stroke-purple-400 stroke-2 transition-all duration-300"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )}

              {/* Accuracy Green Line */}
              {showAccuracy && accPath && (
                <path
                  d={accPath}
                  className="fill-none stroke-emerald-400 stroke-2 transition-all duration-300"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )}

              {/* Speed Orange Line */}
              {showSpeed && speedPath && (
                <path
                  d={speedPath}
                  className="fill-none stroke-amber-400 stroke-2 transition-all duration-300"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )}

              {/* Interactive Crosshair & Hover Dots */}
              {points.map((p, idx) => {
                const isHovered = hoveredIndex === idx;
                return (
                  <g key={idx} onMouseEnter={() => setHoveredIndex(idx)} className="cursor-pointer">
                    {/* Invisible hover trigger area */}
                    <rect
                      x={p.x - chartW / (series.length * 2 || 1)}
                      y={paddingTop}
                      width={chartW / (series.length || 1)}
                      height={chartH}
                      className="fill-transparent"
                    />

                    {isHovered && (
                      <line
                        x1={p.x}
                        y1={paddingTop}
                        x2={p.x}
                        y2={paddingTop + chartH}
                        className="stroke-[var(--text-muted)] stroke-1"
                        strokeDasharray="2 2"
                      />
                    )}

                    {showSpeed && (
                      <circle
                        cx={p.x}
                        cy={p.speedY}
                        r={isHovered ? 5 : 3}
                        className="fill-amber-400 stroke-black stroke-1 transition-all"
                      />
                    )}

                    {showAccuracy && (
                      <circle
                        cx={p.x}
                        cy={p.accY}
                        r={isHovered ? 5 : 3}
                        className="fill-emerald-400 stroke-black stroke-1 transition-all"
                      />
                    )}
                  </g>
                );
              })}

              {/* X-Axis Date Labels */}
              {points.map((p, idx) => {
                // Render sparse labels (every Nth point)
                const step = Math.max(1, Math.floor(points.length / 8));
                if (idx % step !== 0 && idx !== points.length - 1) return null;
                return (
                  <text
                    key={idx}
                    x={p.x}
                    y={height - 12}
                    textAnchor="middle"
                    className="fill-[var(--text-muted)] font-mono text-[10px]"
                    transform={`rotate(-25, ${p.x}, ${height - 12})`}
                  >
                    {p.item.label}
                  </text>
                );
              })}
            </svg>

            {/* Interactive Tooltip Card */}
            {activePoint && (
              <div
                className="absolute top-2 right-2 pointer-events-none p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] shadow-lg text-[11px] font-mono space-y-1 animate-in fade-in z-20"
              >
                <div className="font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-1">
                  {activePoint.item.label} ({activePoint.item.date})
                </div>
                <div className="flex items-center justify-between gap-4 text-cyan-400">
                  <span>Practice:</span>
                  <span className="font-bold">{activePoint.item.durationFormatted}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-emerald-400">
                  <span>Accuracy:</span>
                  <span className="font-bold">{activePoint.item.accuracy}%</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-purple-400">
                  <span>Coverage:</span>
                  <span className="font-bold">{activePoint.item.coverage}%</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-amber-400">
                  <span>Speed:</span>
                  <span className="font-bold">{activePoint.item.wpm} WPM</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Helpful Tip Box (Reference Image 3) */}
      <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-start gap-3">
        <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 text-amber-400 mt-0.5">
          <Lightbulb className="w-4 h-4" />
        </div>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          <strong className="text-[var(--text-primary)] font-semibold">Tip: </strong>
          Click the box next to any of the statistics to add or remove it from the graph. Hover over the graph to see specifics for a given time frame.
        </p>
      </div>
    </div>
  );
};

export default ProgressOverviewChart;
