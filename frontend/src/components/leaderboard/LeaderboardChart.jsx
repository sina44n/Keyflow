/**
 * KEYFLOW Top 10 Performance Chart Component
 * ==========================================
 * High-impact, responsive vertical bar chart matching Reference Image 5:
 * - Dynamic domain scaling: Tallest qualifying bar occupies ~88% of plot height
 * - Strict zero baseline and honest proportional scaling
 * - Rounded top bar corners (rx=8)
 * - Clear numerical value labels directly above bars
 * - Rank indicators (#1, #2...) below baseline
 * - Shortened player usernames below rank
 * - Theme-compliant coloring (var(--accent) for #1, secondary accent for contenders)
 * - Interactive hover tooltip with comprehensive telemetry details
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
              Top 10 Performance Curve
            </h3>
          </div>
          <span className="text-xs font-mono text-[var(--text-muted)]">Awaiting telemetry</span>
        </div>
        <div className="h-56 rounded-xl bg-[var(--bg-elevated)] border border-dashed border-[var(--border)] flex flex-col items-center justify-center p-4 text-center">
          <p className="text-xs font-mono text-[var(--text-muted)]">
            No qualifying typing sessions found for the active duration filter.
          </p>
        </div>
      </div>
    );
  }

  // Active metric accessor
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
  const rawMax = Math.max(...values, 0);

  // Dynamic Y-axis Domain Scaling (Guarantees tallest bar fills ~88% of vertical plotting space)
  const maxValue = category === 'accuracy'
    ? 100
    : Math.max(10, Math.ceil(rawMax / 0.88));

  // Chart Geometry
  const chartHeight = 310;
  const barWidth = 46;
  const gap = 24;
  const leftPadding = 56;
  const bottomPadding = 56;
  const topPadding = 32;
  const totalBarsWidth = entries.length * barWidth + (entries.length - 1) * gap;
  const chartWidth = Math.max(540, leftPadding + totalBarsWidth + 40);

  // Clean Y-axis Ticks
  const yTicks = category === 'accuracy'
    ? [0, 25, 50, 75, 100]
    : [
        0,
        Math.round(maxValue * 0.25),
        Math.round(maxValue * 0.5),
        Math.round(maxValue * 0.75),
        maxValue,
      ];

  const getY = (val) => {
    const scale = (val / maxValue) * (chartHeight - topPadding - bottomPadding);
    return chartHeight - bottomPadding - scale;
  };

  const truncateUsername = (username, maxLen = 9) => {
    if (!username) return '';
    if (username.length <= maxLen) return username;
    return `${username.slice(0, maxLen - 1)}…`;
  };

  return (
    <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] p-5 sm:p-6 shadow-sm transition-all">
      {/* Header (Reference Image 5) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] flex items-center justify-center text-[var(--accent)]">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-mono text-sm font-bold text-[var(--text-primary)]">
              Top 10 Performance Curve — {getMetricLabel()}
            </h3>
            <p className="text-xs font-mono text-[var(--text-muted)]">
              Ranked Typist Telemetry ({entries.length} typist{entries.length === 1 ? '' : 's'})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-[var(--text-muted)]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[var(--accent)]" />
            Rank #1 Leader
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[color-mix(in_srgb,var(--accent)_45%,var(--bg-elevated))]" />
            Contenders
          </span>
        </div>
      </div>

      {/* SVG Plotting Area */}
      <div className="overflow-x-auto relative">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-72 select-none min-w-[500px]"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Subtle Horizontal Grid Lines & Y-Axis Labels */}
          {yTicks.map((tick) => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <line
                  x1={leftPadding - 8}
                  y1={y}
                  x2={chartWidth - 20}
                  y2={y}
                  stroke="var(--border)"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                  strokeOpacity="0.7"
                />
                <text
                  x={leftPadding - 14}
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-[var(--text-muted)] text-[10px] font-mono font-medium"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Baseline */}
          <line
            x1={leftPadding - 8}
            y1={chartHeight - bottomPadding}
            x2={chartWidth - 20}
            y2={chartHeight - bottomPadding}
            stroke="var(--border)"
            strokeWidth="1.5"
          />

          {/* Typist Bars */}
          {entries.map((entry, idx) => {
            const val = getMetricValue(entry);
            const x = leftPadding + 14 + idx * (barWidth + gap);
            const y = getY(val);
            const barHeight = Math.max(6, chartHeight - bottomPadding - y);
            const isHovered = hoveredIdx === idx;
            const isFirst = idx === 0;

            return (
              <g
                key={entry.user_id}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer transition-all duration-200"
              >
                {/* Rounded Bar (Reference Image 5) */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={8}
                  className={`transition-all duration-200 ${
                    isFirst
                      ? 'fill-[var(--accent)]'
                      : isHovered
                      ? 'fill-[color-mix(in_srgb,var(--accent)_75%,white)]'
                      : 'fill-[color-mix(in_srgb,var(--accent)_45%,var(--bg-elevated))]'
                  }`}
                  style={{
                    filter: isHovered || isFirst
                      ? 'drop-shadow(0 4px 10px color-mix(in_srgb,var(--accent)_35%,transparent))'
                      : 'none',
                  }}
                />

                {/* Numerical Value Label Directly Above Bar (Reference Image 5) */}
                <text
                  x={x + barWidth / 2}
                  y={y - 8}
                  textAnchor="middle"
                  className={`text-[11px] font-mono font-bold transition-all ${
                    isHovered || isFirst ? 'fill-[var(--text-primary)]' : 'fill-[var(--text-secondary)]'
                  }`}
                >
                  {category === 'accuracy' ? `${val.toFixed(0)}%` : val.toFixed(1)}
                </text>

                {/* Rank Indicator Below Baseline (#1, #2...) */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - bottomPadding + 18}
                  textAnchor="middle"
                  className={`text-[11px] font-mono font-bold transition-all ${
                    isFirst
                      ? 'fill-[var(--accent)]'
                      : isHovered
                      ? 'fill-[var(--text-primary)]'
                      : 'fill-[var(--text-secondary)]'
                  }`}
                >
                  #{entry.rank}
                </text>

                {/* Shortened Username Identifier Below Rank */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - bottomPadding + 32}
                  textAnchor="middle"
                  className="fill-[var(--text-muted)] text-[9px] font-mono"
                >
                  {truncateUsername(entry.username)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hovered Bar Tooltip */}
        {hoveredIdx !== null && entries[hoveredIdx] && (
          <div
            className="absolute z-20 pointer-events-none p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] shadow-xl text-xs font-mono transition-opacity duration-150"
            style={{
              left: Math.min(
                leftPadding + hoveredIdx * (barWidth + gap) - 30,
                chartWidth - 190
              ),
              top: Math.max(10, getY(getMetricValue(entries[hoveredIdx])) - 80),
            }}
          >
            <div className="flex items-center gap-1.5 font-bold text-[var(--text-primary)] mb-1">
              <span className="text-[var(--accent)]">#{entries[hoveredIdx].rank}</span>
              <span>{entries[hoveredIdx].display_name || entries[hoveredIdx].username}</span>
            </div>
            <p className="text-[10px] text-[var(--text-muted)]">@{entries[hoveredIdx].username}</p>
            <div className="mt-2 pt-2 border-t border-[var(--border)] grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
              <div>
                <span className="text-[var(--text-muted)]">Net WPM: </span>
                <span className="font-bold text-[var(--accent)]">{entries[hoveredIdx].net_wpm.toFixed(1)}</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">Acc: </span>
                <span className="font-bold text-[var(--text-primary)]">{entries[hoveredIdx].accuracy.toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">Sessions: </span>
                <span className="font-semibold text-[var(--text-primary)]">{entries[hoveredIdx].sessions_count}</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">Duration: </span>
                <span className="font-semibold text-[var(--text-primary)]">{entries[hoveredIdx].duration_seconds}s</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardChart;
