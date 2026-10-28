import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Download,
  ExternalLink,
  Info,
  Play,
  Sparkles,
} from 'lucide-react';

import {
  formatDuration,
  exportCSVReport,
  downloadCSV,
  calculateTypingConsistency,
  filterSessionsByTimeRange,
} from '../../utils/telemetryStorage';


/**
 * CircularIntelligenceInfographic
 * 
 * Recreates the exact visual infographic from the reference image:
 * - One prominent central circle near the top (Typing Performance / Latest Result)
 * - Six smaller circular nodes arranged horizontally underneath
 * - Thin curved dotted connecting lines originating from the central circle
 * - Smooth multicolor gradient progression (Purple -> Indigo -> Blue -> Cyan -> Teal)
 * - Small circular markers beneath the nodes with titles & explanatory text
 * - Clean theme adaptability & interactive node inspection
 */
export const CircularIntelligenceInfographic = ({
  sessions = [],
  title = 'Typing Performance Overview',
  subtitle = 'Biomechanical Keystroke Intelligence & Metric Distribution',
  showRangeFilter = true,
  showActions = true,
}) => {
  const [range, setRange] = useState('all'); // '7d' | '30d' | '90d' | 'all'
  const [selectedNode, setSelectedNode] = useState(null);

  // Filtered session dataset
  const filteredSessions = useMemo(() => {
    return filterSessionsByTimeRange(sessions, range);
  }, [sessions, range]);

  // Derive genuine metrics from filtered sessions
  const metrics = useMemo(() => {
    if (!filteredSessions || filteredSessions.length === 0) {
      return {
        hasData: false,
        latestWpm: null,
        latestAccuracy: null,
        latestDate: null,
        totalDuration: 0,
        totalSessions: 0,
        maxWpm: 0,
        avgWpm: 0,
        consistency: null,
      };
    }

    // Sort chronologically descending
    const sorted = [...filteredSessions].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    const latest = sorted[0];

    let totalDur = 0;
    let maxSpeed = 0;
    let wpmSum = 0;

    sorted.forEach((s) => {
      const dur = Number(s.duration || s.duration_seconds || 0) || 0;
      totalDur += dur;
      const w = Number(s.wpm || s.grossWpm || 0) || 0;
      if (w > maxSpeed) maxSpeed = w;
      wpmSum += w;
    });

    const avg = sorted.length > 0 ? Math.round(wpmSum / sorted.length) : 0;
    const consistencyScore = calculateTypingConsistency(sorted);

    return {
      hasData: true,
      latestWpm: latest ? (Number(latest.wpm) || Number(latest.grossWpm) || 0) : null,
      latestAccuracy: latest ? (Number(latest.accuracy) || 100) : null,
      latestDate: latest?.date || (latest?.timestamp ? new Date(latest.timestamp).toLocaleDateString() : null),
      totalDuration: totalDur,
      totalSessions: sorted.length,
      maxWpm: maxSpeed,
      avgWpm: avg,
      consistency: consistencyScore,
    };
  }, [filteredSessions]);

  // Six lower nodes specification matching the reference image exactly
  const lowerNodes = [
    {
      id: 'speed',
      num: 1,
      title: 'SPEED',
      color: '#7e22ce', // Deep Purple
      displayValue: metrics.latestWpm !== null ? `${metrics.latestWpm}` : '—',
      unit: 'WPM',
      desc1: 'Latest valid sprint velocity',
      desc2: 'measured in net words/min',
      details: {
        headline: 'Typing Speed (Velocity)',
        value: metrics.latestWpm !== null ? `${metrics.latestWpm} WPM` : 'No data recorded',
        explanation: 'Your most recent valid session typing speed calculated as valid typed characters divided by 5 per elapsed minute.',
        insight: metrics.latestWpm
          ? `Current pace: ${metrics.latestWpm} WPM. Historical average is ${metrics.avgWpm} WPM.`
          : 'Practice a quick sprint to measure your initial velocity baseline.',
      },
    },
    {
      id: 'accuracy',
      num: 2,
      title: 'ACCURACY',
      color: '#4f46e5', // Purple-Indigo
      displayValue: metrics.latestAccuracy !== null ? `${metrics.latestAccuracy}%` : '—',
      unit: '',
      desc1: 'Real precision rate',
      desc2: 'without taking corrections',
      details: {
        headline: 'Real Typing Accuracy',
        value: metrics.latestAccuracy !== null ? `${metrics.latestAccuracy}%` : 'No data recorded',
        explanation: 'The percentage of characters entered cleanly on the very first keystroke without requiring backspace corrections.',
        insight: metrics.latestAccuracy >= 95
          ? 'Exceptional precision discipline! High accuracy naturally builds speed endurance.'
          : 'Focus on rhythm and reduce typing speed by 10% to eliminate misstrike clusters.',
      },
    },
    {
      id: 'practice-time',
      num: 3,
      title: 'PRACTICE TIME',
      color: '#2563eb', // Deep Blue
      displayValue: metrics.totalDuration > 0 ? formatDuration(metrics.totalDuration) : '0m',
      unit: '',
      desc1: 'Cumulative active duration',
      desc2: 'spent typing keystrokes',
      details: {
        headline: 'Accumulated Practice Time',
        value: formatDuration(metrics.totalDuration),
        explanation: 'Total active elapsed typing time recorded across drills, excluding idle or paused session intervals.',
        insight: `${metrics.totalSessions} total typing sessions recorded in this time range.`,
      },
    },
    {
      id: 'sessions',
      num: 4,
      title: 'SESSIONS',
      color: '#0284c7', // Ocean Blue
      displayValue: `${metrics.totalSessions}`,
      unit: '',
      desc1: 'Total completed drills',
      desc2: 'and performance sprints',
      details: {
        headline: 'Recorded Sessions',
        value: `${metrics.totalSessions} Sessions`,
        explanation: 'The number of completed, valid practice drills, Academy exercises, and sprints saved to your account.',
        insight: metrics.totalSessions > 0
          ? 'Consistency is the primary driver of neuromuscular memory development.'
          : 'Start your first drill to unlock continuous keystroke telemetry.',
      },
    },
    {
      id: 'best-wpm',
      num: 5,
      title: 'BEST WPM',
      color: '#0ea5e9', // Cerulean / Sky Blue
      displayValue: metrics.maxWpm > 0 ? `${metrics.maxWpm}` : '—',
      unit: 'WPM',
      desc1: 'Personal all-time velocity',
      desc2: 'peak achieved in practice',
      details: {
        headline: 'Personal Best Velocity',
        value: metrics.maxWpm > 0 ? `${metrics.maxWpm} WPM` : 'No records yet',
        explanation: 'The highest single-session speed recorded on your profile across all completed practice drills.',
        insight: metrics.maxWpm > 0
          ? `Your all-time speed ceiling is ${metrics.maxWpm} WPM. Regular practice turns peak speed into sustained cadence.`
          : 'No peak speed recorded yet.',
      },
    },
    {
      id: 'consistency',
      num: 6,
      title: 'CONSISTENCY',
      color: '#0d9488', // Cyan / Teal
      displayValue: metrics.consistency !== null ? `${metrics.consistency}%` : '—',
      unit: '',
      desc1: 'Rhythm and speed variance',
      desc2: 'across recorded sessions',
      details: {
        headline: 'Cadence & Rhythm Consistency',
        value: metrics.consistency !== null ? `${metrics.consistency}%` : 'Insufficient data',
        explanation: 'Measures smoothness of keystroke cadence. Derived from variance in velocity and error distribution across sessions.',
        insight: metrics.consistency >= 85
          ? 'Excellent fluid typing rhythm. Smooth pacing prevents muscular fatigue.'
          : 'Rhythm variance detected. Practice metronome drills to establish uniform keystroke intervals.',
      },
    },
  ];

  // CSV Export handler
  const handleExportCSV = () => {
    const filename = `keyflow_infographic_telemetry_${range}_${new Date().toISOString().slice(0, 10)}.csv`;
    const { csvContent } = exportCSVReport(filteredSessions, `keyflow_telemetry_${range}`);
    downloadCSV(csvContent, filename);
  };


  return (
    <div className="card-panel p-4 sm:p-6 md:p-8 rounded-3xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-xl relative overflow-hidden">
      {/* Top Header & Range Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-xs font-mono text-[var(--accent)] mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Biomechanical Performance Infographic</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
            {subtitle}
          </p>
        </div>

        {/* Range Selector */}
        {showRangeFilter && (
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] self-start sm:self-auto text-xs font-mono">
            {[
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: '90d', label: '90 Days' },
              { id: 'all', label: 'All Time' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRange(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-semibold ${
                  range === tab.id
                    ? 'bg-[var(--accent)] text-[var(--accent-fg)] shadow-xs font-bold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Infographic SVG Canvas — Desktop & Tablet */}
      <div className="w-full py-4 select-none">
        <div className="relative w-full max-w-[1020px] mx-auto">
          {/* Responsive SVG Infographic */}
          <svg
            viewBox="0 0 1000 560"
            className="w-full h-auto drop-shadow-sm hidden md:block"
            aria-label="Typing Performance Infographic"
          >
            <defs>
              {/* Central Circle Multi-Color Gradient Ring matching Reference Image */}
              <linearGradient id="centralRingGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7e22ce" />
                <stop offset="25%" stopColor="#4f46e5" />
                <stop offset="50%" stopColor="#2563eb" />
                <stop offset="75%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#0d9488" />
              </linearGradient>

              {/* Neumorphic Drop Shadow Filters for realistic floating discs */}
              <filter id="nodeShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="6" stdDeviation="8" floodOpacity="0.16" />
                <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.08" />
              </filter>
              <filter id="centralShadow" x="-25%" y="-25%" width="150%" height="150%">
                <feDropShadow dx="0" dy="10" stdDeviation="12" floodOpacity="0.22" />
                <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.1" />
              </filter>
            </defs>

            {/* LAYER 1: Curved Dotted Branching Lines (Behind Circles) */}
            <g className="connecting-lines" stroke="var(--border)" strokeWidth="1.8" strokeDasharray="3,4" fill="none">
              {/* Line 1 -> Node 1 (X=115) */}
              <path d="M 450 205 C 380 205, 115 205, 115 303" />
              {/* Line 2 -> Node 2 (X=269) */}
              <path d="M 470 212 C 410 225, 269 225, 269 303" />
              {/* Line 3 -> Node 3 (X=423) */}
              <path d="M 490 218 C 465 240, 423 250, 423 303" />
              {/* Line 4 -> Node 4 (X=577) */}
              <path d="M 510 218 C 535 240, 577 250, 577 303" />
              {/* Line 5 -> Node 5 (X=731) */}
              <path d="M 530 212 C 590 225, 731 225, 731 303" />
              {/* Line 6 -> Node 6 (X=885) */}
              <path d="M 550 205 C 620 205, 885 205, 885 303" />

              {/* Vertical Dotted Lines to Bottom Markers */}
              <path d="M 115 407 L 115 442" />
              <path d="M 269 407 L 269 442" />
              <path d="M 423 407 L 423 442" />
              <path d="M 577 407 L 577 442" />
              <path d="M 731 407 L 731 442" />
              <path d="M 885 407 L 885 442" />
            </g>

            {/* LAYER 2: Top Large Central Node */}
            <g className="central-node cursor-pointer" onClick={() => setSelectedNode(lowerNodes[0])}>
              {/* Multicolor Outer Gradient Ring */}
              <circle
                cx="500"
                cy="135"
                r="86"
                fill="none"
                stroke="url(#centralRingGrad)"
                strokeWidth="9"
              />

              {/* Inner Floating Circular Disc */}
              <circle
                cx="500"
                cy="135"
                r="78"
                fill="var(--bg-elevated)"
                filter="url(#centralShadow)"
              />

              {/* Centered Typography */}
              <text
                x="500"
                y="112"
                textAnchor="middle"
                className="fill-[var(--text-muted)] font-mono font-bold uppercase tracking-[0.22em]"
                fontSize="11"
              >
                TYPING PERFORMANCE
              </text>
              <text
                x="500"
                y="148"
                textAnchor="middle"
                className="fill-[var(--text-primary)] font-mono font-extrabold"
                fontSize="28"
              >
                {metrics.latestWpm !== null ? `${metrics.latestWpm} WPM` : 'NO DATA'}
              </text>
              <text
                x="500"
                y="172"
                textAnchor="middle"
                className="fill-[var(--accent)] font-mono font-semibold"
                fontSize="11"
              >
                {metrics.latestWpm !== null ? 'LATEST RESULT' : 'READY TO PRACTICE'}
              </text>
            </g>

            {/* LAYER 3: Six Lower Circular Nodes */}
            {lowerNodes.map((node, i) => {
              const cx = 115 + i * 154;
              const cy = 355;
              const r = 52;
              const innerR = 45;
              const isSelected = selectedNode?.id === node.id;

              return (
                <g
                  key={node.id}
                  className="lower-node cursor-pointer transition-transform duration-200"
                  onClick={() => setSelectedNode(node)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${node.title}: ${node.displayValue} ${node.unit}`}
                >
                  {/* Colored Outer Ring */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="none"
                    stroke={node.color}
                    strokeWidth={isSelected ? '8' : '6.5'}
                    className="transition-all duration-200"
                  />

                  {/* Inner Floating White/Theme Disc */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={innerR}
                    fill="var(--bg-elevated)"
                    filter="url(#nodeShadow)"
                    className={isSelected ? 'stroke-2 stroke-[var(--accent)]' : ''}
                  />

                  {/* Metric Value Inside Circle */}
                  <text
                    x={cx}
                    y={node.unit ? cy - 2 : cy + 5}
                    textAnchor="middle"
                    className="fill-[var(--text-primary)] font-mono font-extrabold"
                    fontSize={node.displayValue.length > 5 ? '13' : '16'}
                  >
                    {node.displayValue}
                  </text>
                  {node.unit && (
                    <text
                      x={cx}
                      y={cy + 15}
                      textAnchor="middle"
                      className="fill-[var(--text-muted)] font-mono font-semibold"
                      fontSize="9"
                    >
                      {node.unit}
                    </text>
                  )}

                  {/* Concentric Marker Dot beneath vertical line */}
                  <circle
                    cx={cx}
                    cy="442"
                    r="6.5"
                    fill={node.color}
                  />
                  <circle
                    cx={cx}
                    cy="442"
                    r="2.5"
                    fill="var(--bg-elevated)"
                  />

                  {/* Category Title below Dot */}
                  <text
                    x={cx}
                    y="470"
                    textAnchor="middle"
                    className="fill-[var(--text-primary)] font-mono font-bold tracking-wider uppercase"
                    fontSize="11"
                  >
                    {node.title}
                  </text>

                  {/* Supporting Description Text (2 Lines) */}
                  <text
                    x={cx}
                    y="488"
                    textAnchor="middle"
                    className="fill-[var(--text-muted)] font-sans"
                    fontSize="9.5"
                  >
                    {node.desc1}
                  </text>
                  <text
                    x={cx}
                    y="502"
                    textAnchor="middle"
                    className="fill-[var(--text-muted)] font-sans"
                    fontSize="9.5"
                  >
                    {node.desc2}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Mobile Fallback: Circular Cards Grid for screens under md breakpoint */}
          <div className="md:hidden space-y-6">
            {/* Mobile Central Node */}
            <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-[var(--bg-elevated)] border-4 border-indigo-500/80 shadow-lg text-center space-y-1">
              <span className="text-[11px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider">
                TYPING PERFORMANCE
              </span>
              <span className="text-3xl font-extrabold font-mono text-[var(--text-primary)]">
                {metrics.latestWpm !== null ? `${metrics.latestWpm} WPM` : 'NO DATA'}
              </span>
              <span className="text-xs font-semibold text-[var(--accent)] font-mono">
                {metrics.latestWpm !== null ? 'LATEST RESULT' : 'READY TO PRACTICE'}
              </span>
            </div>

            {/* Mobile 6 Lower Nodes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {lowerNodes.map((node) => (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => setSelectedNode(node)}
                  className="p-4 rounded-2xl bg-[var(--bg-elevated)] border flex flex-col items-center text-center space-y-1.5 transition-all cursor-pointer shadow-xs"
                  style={{ borderColor: node.color }}
                >
                  <div
                    className="w-12 h-12 rounded-full border-3 flex items-center justify-center font-mono font-bold text-xs bg-[var(--bg-surface)]"
                    style={{ borderColor: node.color }}
                  >
                    {node.displayValue}
                  </div>
                  <span className="text-xs font-bold font-mono text-[var(--text-primary)] uppercase">
                    {node.title}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] line-clamp-2">
                    {node.desc1}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Node Details Drawer / Popover */}
      {selectedNode && (
        <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-[var(--bg-elevated)] border shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in"
          style={{ borderColor: selectedNode.color }}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: selectedNode.color }}
              />
              <h4 className="text-sm font-bold font-mono text-[var(--text-primary)]">
                {selectedNode.details.headline}
              </h4>
              <span className="text-xs font-bold font-mono text-[var(--text-primary)] px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border)]">
                {selectedNode.details.value}
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {selectedNode.details.explanation}
            </p>
            <p className="text-xs text-[var(--accent)] font-medium">
              💡 {selectedNode.details.insight}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSelectedNode(null)}
            className="self-end sm:self-center px-3 py-1.5 rounded-xl border border-[var(--border)] text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Bottom Utility Controls */}
      {showActions && (
        <div className="mt-6 pt-5 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <Info className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Click any node to inspect calculation methodology and historical sample size.</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {metrics.totalSessions === 0 && (
              <Link
                to="/practice"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-fg)] font-bold shadow-xs hover:brightness-105 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Practice Sprint</span>
              </Link>
            )}

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={metrics.totalSessions === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-primary)] transition-all cursor-pointer disabled:opacity-50 shadow-xs"
              title="Download CSV Performance Summary"
            >
              <Download className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>Export CSV</span>
            </button>

            <Link
              to="/telemetry"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-fg)] font-bold shadow-xs hover:brightness-105 transition-all"
            >
              <span>Explore Typing Insights</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default CircularIntelligenceInfographic;
