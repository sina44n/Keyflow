/**
 * KEYFLOW Leaderboard Performance Graph
 * =====================================
 * High-performance, responsive SVG visualization comparing Top 10 typists.
 * Dynamic rendering based on active category:
 * - Speed (Net WPM progression)
 * - Accuracy (% accuracy bars)
 * - Overall (Balanced performance index)
 */

import React, { useState } from 'react';
import { BarChart3, Info } from 'lucide-react';

export const LeaderboardChart = ({ entries, category }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!entries || entries.length === 0) {
    return (
      <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="font-mono text-sm font-semibold text-[var(--text-primary)]">
              Performance Distribution
            </h3>
          </div>
          <span className="text-xs font-mono text-[var(--text-muted)]">Top 10 Benchmark</span>
        </div>
        <div className="h-48 rounded-xl bg-[var(--bg-elevated)] border border-dashed border-[var(--border)] flex flex-col items-center justify-center p-4 text-center">
          <p className="text-xs font-mono text-[var(--text-muted)]">
            Awaiting session records to generate performance graph.
          </p>
        </div>
      </div>
    );
  }

  // Get active metric values
  const getMetricValue = (entry) => {
    if (category === 'speed') return entry.net_wpm;
    if (category === 'accuracy') return entry.accuracy;
    return entry.score;
  };

  const getMetricLabel = () => {
    if (category === 'speed') return 'Net WPM';
    if (category === 'accuracy') return 'Accuracy (%)';
    return 'Overall Score';
  };

  const values = entries.map(getMetricValue);
  const maxValue = Math.max(...values, category === 'accuracy' ? 100 : 50);

  // Chart dimensions
  const chartHeight = 220;
  const barWidth = 36;
  const gap = 16;
  const leftPadding = 50;
  const bottomPadding = 45;
  const topPadding = 25;
  const chartWidth = Math.max(500, leftPadding + entries.length * (barWidth + gap) + 20);

  // Y-axis ticks
  const yTicks = category === 'accuracy'
    ? [0, 50, 75, 90, 100]
    : [
        0,
        Math.round(maxValue * 0.25),
        Math.round(maxValue * 0.5),
        Math.round(maxValue * 0.75),
        Math.ceil(maxValue),
      ];

  const getY = (val) => {
    const scale = (val / (category === 'accuracy' ? 100 : maxValue)) * (chartHeight - topPadding - bottomPadding);
    return chartHeight - bottomPadding - scale;
  };

  return (
    <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] p-5 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[var(--accent)]" />
          <h3 className="font-mono text-sm font-semibold text-[var(--text-primary)]">
            Top 10 Performance Curve — {getMetricLabel()}
          </h3>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono text-[var(--text-muted)]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[var(--accent)]" />
            Ranked Typist Value
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-56 select-none"
          preserveAspectRatio="none"
        >
          {/* Subtle Grid Lines */}
          {yTicks.map((tick) => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <line
                  x1={leftPadding - 10}
                  y1={y}
                  x2={chartWidth - 10}
                  y2={y}
                  stroke="var(--border)"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={leftPadding - 15}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-[var(--text-muted)] text-[10px] font-mono"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Baseline */}
          <line
            x1={leftPadding - 10}
            y1={chartHeight - bottomPadding}
            x2={chartWidth - 10}
            y2={chartHeight - bottomPadding}
            stroke="var(--border)"
            strokeWidth="1.5"
          />

          {/* Typist Bars */}
          {entries.map((entry, idx) => {
            const val = getMetricValue(entry);
            const x = leftPadding + idx * (barWidth + gap);
            const y = getY(val);
            const barH = chartHeight - bottomPadding - y;
            const isHovered = hoveredIdx === idx;
            const isFirst = idx === 0;

            return (
              <g
                key={entry.user_id}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer transition-all duration-200"
              >
                {/* Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(4, barH)}
                  rx={6}
                  className={`transition-all duration-200 ${
                    isFirst
                      ? 'fill-[var(--accent)]'
                      : isHovered
                      ? 'fill-[color-mix(in_srgb,var(--accent)_80%,white)]'
                      : 'fill-[color-mix(in_srgb,var(--accent)_45%,var(--bg-elevated))]'
                  }`}
                  style={{
                    filter: isHovered || isFirst ? 'drop-shadow(0 0 6px color-mix(in_srgb,var(--accent)_40%,transparent))' : 'none',
                  }}
                />

                {/* Value Label above Bar */}
                <text
                  x={x + barWidth / 2}
                  y={y - 6}
                  textAnchor="middle"
                  className={`text-[10px] font-mono font-bold transition-all ${
                    isHovered || isFirst ? 'fill-[var(--text-primary)]' : 'fill-[var(--text-muted)]'
                  }`}
                >
                  {category === 'accuracy' ? `${val.toFixed(0)}%` : val.toFixed(1)}
                </text>

                {/* Rank & Username Below Axis */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - bottomPadding + 15}
                  textAnchor="middle"
                  className="fill-[var(--text-primary)] text-[11px] font-mono font-bold"
                >
                  #{entry.rank}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - bottomPadding + 28}
                  textAnchor="middle"
                  className="fill-[var(--text-muted)] text-[9px] font-mono truncate"
                  style={{ maxWidth: barWidth + gap }}
                >
                  {entry.username.slice(0, 5)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Dynamic Hover Details Card */}
      {hoveredIdx !== null && entries[hoveredIdx] && (
        <div className="mt-3 p-3 rounded-xl bg-[var(--bg-elevated)] border border-[color-mix(in_srgb,var(--accent)_40%,transparent)] flex flex-wrap items-center justify-between gap-3 text-xs font-mono animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[var(--accent)] text-white font-bold">
              #{entries[hoveredIdx].rank}
            </span>
            <span className="font-bold text-[var(--text-primary)]">
              {entries[hoveredIdx].display_name || entries[hoveredIdx].username}
            </span>
            <span className="text-[var(--text-muted)]">@{entries[hoveredIdx].username}</span>
          </div>
          <div className="flex items-center gap-4 text-[var(--text-secondary)]">
            <span>Net WPM: <strong className="text-[var(--accent)]">{entries[hoveredIdx].net_wpm.toFixed(1)}</strong></span>
            <span>Accuracy: <strong className="text-[var(--text-primary)]">{entries[hoveredIdx].accuracy.toFixed(1)}%</strong></span>
            <span>Test: <strong className="text-[var(--text-primary)]">{entries[hoveredIdx].duration_seconds}s</strong></span>
            <span>Sessions: <strong className="text-[var(--text-primary)]">{entries[hoveredIdx].sessions_count}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};

