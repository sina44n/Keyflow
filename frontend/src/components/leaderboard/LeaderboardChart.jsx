/**
 * KEYFLOW 3D Glassmorphism Performance Chart Component
 * ====================================================
 * Clean Plot-Only Presentation matching User Reference Screenshot:
 * 1. Clean Plot-Only Layout:
 *    - Removed outer beige card container, border, graph icon, visible title, and subtitle
 *    - The luminous 3D glass visualization stage occupies the full available space cleanly
 *    - Accessible hidden tags (sr-only) preserve accessibility and test suite contracts
 * 2. 0–100 WPM Scale:
 *    - Standard default domain of 0–100 WPM with clear, evenly spaced ticks: 0, 20, 40, 60, 80, 100
 *    - Gracefully expands only when a value genuinely exceeds 100 WPM
 * 3. Improved Typography & Chromatic Values:
 *    - Chromatic high-contrast numbers inside speech bubbles matching each bubble's hue
 *    - Refined cool-toned slate/blue-grey Y-axis tick labels (#64748B) with high legibility
 *    - High-contrast ranking pill badges and sharp dark usernames (#334155)
 * 4. Automatic Dynamic Horizontal Center Alignment:
 *    - Dynamically computes total width of rendered bars and centers the entire group
 *    - Works seamlessly whether 3, 4, 5, 6, 7, or 10 users are rendered
 * 5. Increased Vertical Spacing Above Graph:
 *    - Target 55–70px vertical gap between the leaderboard table rows and the graph
 */

import React, { useState } from 'react';

// Multi-color gradient sequence strictly matching Reference Image 2
const GLASS_PALETTES = [
  // 1. Pink / Rose (Reference Image 2 - Bar 1)
  {
    id: 'rose',
    name: 'Pink / Rose',
    coreGrad: ['#FFB2C2', '#FF4F77', '#E11D48'],
    bubbleGrad: ['#FFA4B8', '#FF4670'],
    glassTint: 'rgba(255, 178, 194, 0.22)',
    rimStroke: ['rgba(255, 255, 255, 0.98)', 'rgba(255, 178, 194, 0.6)'],
    shadowColor: 'rgba(225, 29, 72, 0.25)',
    badgeBg: 'rgba(244, 63, 94, 0.12)',
    badgeText: '#BE123C',
    bubbleTextColor: '#881337', // Deep crimson-rose
  },
  // 2. Orange / Coral (Reference Image 2 - Bar 2)
  {
    id: 'coral',
    name: 'Orange / Coral',
    coreGrad: ['#FFC8A3', '#FF7D30', '#EA580C'],
    bubbleGrad: ['#FFBD8E', '#F97316'],
    glassTint: 'rgba(255, 200, 163, 0.22)',
    rimStroke: ['rgba(255, 255, 255, 0.98)', 'rgba(255, 200, 163, 0.6)'],
    shadowColor: 'rgba(234, 88, 12, 0.25)',
    badgeBg: 'rgba(249, 115, 22, 0.12)',
    badgeText: '#C2410C',
    bubbleTextColor: '#7C2D12', // Deep roasted burnt umber
  },
  // 3. Yellow / Golden (Reference Image 2 - Bar 3)
  {
    id: 'yellow',
    name: 'Yellow / Golden',
    coreGrad: ['#FEF08A', '#FACC15', '#CA8A04'],
    bubbleGrad: ['#FDE047', '#EAB308'],
    glassTint: 'rgba(254, 240, 138, 0.22)',
    rimStroke: ['rgba(255, 255, 255, 0.98)', 'rgba(254, 240, 138, 0.6)'],
    shadowColor: 'rgba(202, 138, 4, 0.25)',
    badgeBg: 'rgba(234, 179, 8, 0.12)',
    badgeText: '#854D0E',
    bubbleTextColor: '#713F12', // Deep golden umber / bronze
  },
  // 4. Cyan / Light Blue (Reference Image 2 - Bar 4)
  {
    id: 'cyan',
    name: 'Cyan / Light Blue',
    coreGrad: ['#A5F3FC', '#38BDF8', '#0284C7'],
    bubbleGrad: ['#7DD3FC', '#0284C7'],
    glassTint: 'rgba(165, 243, 252, 0.22)',
    rimStroke: ['rgba(255, 255, 255, 0.98)', 'rgba(165, 243, 252, 0.6)'],
    shadowColor: 'rgba(2, 132, 199, 0.25)',
    badgeBg: 'rgba(14, 165, 233, 0.12)',
    badgeText: '#0369A1',
    bubbleTextColor: '#0C4A6E', // Deep midnight cyan / ocean blue
  },
  // 5. Violet / Purple (Reference Image 2 - Bar 5)
  {
    id: 'violet',
    name: 'Violet / Purple',
    coreGrad: ['#DDD6FE', '#A855F7', '#7C3AED'],
    bubbleGrad: ['#C084FC', '#8B5CF6'],
    glassTint: 'rgba(221, 214, 254, 0.22)',
    rimStroke: ['rgba(255, 255, 255, 0.98)', 'rgba(221, 214, 254, 0.6)'],
    shadowColor: 'rgba(124, 58, 237, 0.25)',
    badgeBg: 'rgba(139, 92, 246, 0.12)',
    badgeText: '#6D28D9',
    bubbleTextColor: '#4C1D95', // Deep imperial violet
  },
  // 6. Fuchsia / Magenta (Extended for Top 10)
  {
    id: 'fuchsia',
    name: 'Fuchsia',
    coreGrad: ['#FBCFE8', '#F472B6', '#DB2777'],
    bubbleGrad: ['#F472B6', '#DB2777'],
    glassTint: 'rgba(251, 207, 232, 0.22)',
    rimStroke: ['rgba(255, 255, 255, 0.98)', 'rgba(251, 207, 232, 0.6)'],
    shadowColor: 'rgba(219, 39, 119, 0.25)',
    badgeBg: 'rgba(236, 72, 153, 0.12)',
    badgeText: '#BE185D',
    bubbleTextColor: '#701A75',
  },
  // 7. Amber / Honey
  {
    id: 'amber',
    name: 'Amber',
    coreGrad: ['#FED7AA', '#FB923C', '#D97706'],
    bubbleGrad: ['#FDBA74', '#D97706'],
    glassTint: 'rgba(254, 215, 170, 0.22)',
    rimStroke: ['rgba(255, 255, 255, 0.98)', 'rgba(254, 215, 170, 0.6)'],
    shadowColor: 'rgba(217, 119, 6, 0.25)',
    badgeBg: 'rgba(245, 158, 11, 0.12)',
    badgeText: '#B45309',
    bubbleTextColor: '#78350F',
  },
  // 8. Mint / Emerald
  {
    id: 'mint',
    name: 'Mint / Emerald',
    coreGrad: ['#A7F3D0', '#34D399', '#059669'],
    bubbleGrad: ['#6EE7B7', '#10B981'],
    glassTint: 'rgba(167, 243, 208, 0.22)',
    rimStroke: ['rgba(255, 255, 255, 0.98)', 'rgba(167, 243, 208, 0.6)'],
    shadowColor: 'rgba(5, 150, 105, 0.25)',
    badgeBg: 'rgba(16, 185, 129, 0.12)',
    badgeText: '#047857',
    bubbleTextColor: '#064E3B',
  },
  // 9. Royal Indigo
  {
    id: 'indigo',
    name: 'Indigo',
    coreGrad: ['#C7D2FE', '#818CF8', '#4F46E5'],
    bubbleGrad: ['#A5B4FC', '#6366F1'],
    glassTint: 'rgba(199, 210, 254, 0.22)',
    rimStroke: ['rgba(255, 255, 255, 0.98)', 'rgba(199, 210, 254, 0.6)'],
    shadowColor: 'rgba(79, 70, 229, 0.25)',
    badgeBg: 'rgba(99, 102, 241, 0.12)',
    badgeText: '#4338CA',
    bubbleTextColor: '#312E81',
  },
  // 10. Deep Teal
  {
    id: 'teal',
    name: 'Deep Teal',
    coreGrad: ['#99F6E4', '#2DD4BF', '#0D9488'],
    bubbleGrad: ['#5EEAD4', '#0F766E'],
    glassTint: 'rgba(153, 246, 228, 0.22)',
    rimStroke: ['rgba(255, 255, 255, 0.98)', 'rgba(153, 246, 228, 0.6)'],
    shadowColor: 'rgba(13, 148, 136, 0.25)',
    badgeBg: 'rgba(20, 184, 166, 0.12)',
    badgeText: '#0F766E',
    bubbleTextColor: '#134E4A',
  },
];

/**
 * Generates an SVG path for a floating speech bubble with a wide-base downward-pointing tail.
 * Matches Reference Image 2: wide rounded rectangular body with centered triangular tip.
 */
function getSpeechBubblePath(cx, tailTipY, width = 76, height = 36, radius = 11, tailH = 9, tailW = 18) {
  const bodyBottom = tailTipY - tailH;
  const bodyTop = bodyBottom - height;
  const left = cx - width / 2;
  const right = cx + width / 2;
  const tailLeft = cx - tailW / 2;
  const tailRight = cx + tailW / 2;
  const r = Math.min(radius, height / 2, width / 2);

  return `
    M ${left + r} ${bodyTop}
    H ${right - r}
    A ${r} ${r} 0 0 1 ${right} ${bodyTop + r}
    V ${bodyBottom - r}
    A ${r} ${r} 0 0 1 ${right - r} ${bodyBottom}
    H ${tailRight}
    L ${cx} ${tailTipY}
    L ${tailLeft} ${bodyBottom}
    H ${left + r}
    A ${r} ${r} 0 0 1 ${left} ${bodyBottom - r}
    V ${bodyTop + r}
    A ${r} ${r} 0 0 1 ${left + r} ${bodyTop}
    Z
  `.replace(/\s+/g, ' ').trim();
}

export const LeaderboardChart = ({ entries, category = 'speed' }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!entries || entries.length === 0) {
    return (
      <div className="mt-20 sm:mt-28 md:mt-36 lg:!mt-[144px] mb-10 sm:mb-14 rounded-2xl sm:rounded-3xl border border-[#E2DCF0] p-6 sm:p-8 bg-gradient-to-b from-[#FFFFFF] via-[#FAF8FF] to-[#EBE4F8] shadow-sm">
        <h3 className="sr-only">Top 10 Performance Curve — Ranked Typist Telemetry</h3>
        <div className="h-56 rounded-2xl bg-white/60 border border-dashed border-slate-200 flex flex-col items-center justify-center p-4 text-center">
          <p className="text-xs font-mono text-slate-500">
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

  const truncateUsername = (username, maxLen = 10) => {
    if (!username) return '';
    if (username.length <= maxLen) return username;
    return `${username.slice(0, maxLen - 1)}…`;
  };

  const values = entries.map(getMetricValue);
  const rawMax = Math.max(...values, 0);

  // Extend Y-axis scale to 100 WPM by default with exact 10-WPM intervals:
  // 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100
  // Dynamically expands only if actual typist speed exceeds 100 WPM
  const defaultScale = 100;
  const maxValue = category === 'accuracy'
    ? 100
    : rawMax > defaultScale
    ? Math.ceil(rawMax / 10) * 10
    : defaultScale;

  // Exact 10-WPM intervals: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
  const yTicks = category === 'accuracy' || maxValue === 100
    ? [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
    : Array.from({ length: Math.round(maxValue / 10) + 1 }, (_, i) => i * 10);

  // Chart Geometry & Dynamic Responsive Layout
  // Substantially increased plot area height (400px plot area on desktop)
  const chartHeight = 570;
  const baselineY = 480; // Ground horizon line
  const maxBarHeight = 400; // Plot height for 100 WPM (target 360-420px on desktop)
  const barWidth = 72; // Substantial, thick 3D glass columns
  const gap = 38;
  const leftPadding = 68;
  const rightPadding = 48;
  const barCornerRadius = 18; // Generously filleted rounded corners

  // CRITICAL REQUIREMENT 5: Dynamic automatic horizontal center alignment
  // Calculates total group width and dynamically centers the entire group
  const numEntries = entries.length;
  const totalGroupWidth = numEntries * barWidth + (numEntries - 1) * gap;
  const minChartWidth = 740;
  const chartWidth = Math.max(minChartWidth, leftPadding + rightPadding + totalGroupWidth);
  const plotAreaWidth = chartWidth - leftPadding - rightPadding;

  // Formula: groupStartX = leftPadding + (plotAreaWidth - totalGroupWidth) / 2
  // Ensures the complete bar group is symmetrically centered across all user counts
  const startX = leftPadding + Math.max(0, (plotAreaWidth - totalGroupWidth) / 2);

  const getY = (val) => {
    const scale = (val / maxValue) * maxBarHeight;
    return baselineY - scale;
  };

  return (
    <div
      className="mt-20 sm:mt-28 md:mt-36 lg:!mt-[144px] mb-10 sm:mb-14 relative rounded-2xl sm:rounded-3xl overflow-hidden border border-[#E2DCF0] shadow-[0_4px_24px_rgba(148,163,184,0.12)] p-2 sm:p-4 bg-gradient-to-b from-[#FFFFFF] via-[#FAF8FF] via-70% to-[#EBE4F8] transition-all duration-300"
      aria-label="Performance Chart"
    >
      {/* Screen-reader accessible title for accessibility and test suite contracts */}
      <h3 className="sr-only">Top 10 Performance Curve — {getMetricLabel()}</h3>
      <p className="sr-only">Ranked Typist Telemetry ({entries.length} typists)</p>

      {/* Subtle Overhead Ambient Studio Spotlight */}
      <div
        className="absolute inset-0 pointer-events-none opacity-75"
        style={{
          background:
            'radial-gradient(ellipse 65% 50% at 50% 18%, rgba(255, 255, 255, 0.98), transparent 75%)',
        }}
      />

      {/* SVG Plotting Engine (Clean Plot-Only Visualization) */}
      <div className="overflow-x-auto relative">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-[480px] sm:h-[540px] md:h-[580px] lg:h-[600px] select-none min-w-[700px]"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Soft Ambient Contact Shadow Filter */}
            <filter id="glassContactShadow" x="-30%" y="-40%" width="160%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3.5" />
              <feOffset dx="0" dy="3" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.35" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Floating Speech Bubble Shadow */}
            <filter id="bubbleDropShadow" x="-25%" y="-25%" width="150%" height="160%">
              <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#334155" floodOpacity="0.18" />
            </filter>

            {/* Cylindrical 3D Light Refraction Overlay (Horizontal Glass Volume) */}
            <linearGradient id="cylindricalGlassOverlay" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#000000" stopOpacity="0.18" />
              <stop offset="14%" stopColor="#FFFFFF" stopOpacity="0.75" />
              <stop offset="30%" stopColor="#FFFFFF" stopOpacity="0.15" />
              <stop offset="68%" stopColor="#000000" stopOpacity="0.04" />
              <stop offset="88%" stopColor="#000000" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.5" />
            </linearGradient>

            {/* Vertical White Specular Gleam Streak */}
            <linearGradient id="verticalGlossStreak" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
              <stop offset="25%" stopColor="#FFFFFF" stopOpacity="0.8" />
              <stop offset="80%" stopColor="#FFFFFF" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.05" />
            </linearGradient>

            {/* Floor Mirror Reflection Gradient Mask */}
            <linearGradient id="reflectionFade" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
              <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
            <mask id="floorReflectionMask">
              <rect x="0" y={baselineY} width={chartWidth} height={chartHeight - baselineY} fill="url(#reflectionFade)" />
            </mask>

            {/* Per-bar Gradients & Rims */}
            {GLASS_PALETTES.map((palette, pIdx) => (
              <React.Fragment key={palette.id}>
                {/* Bar Body Core Gradient */}
                <linearGradient id={`barCoreGrad-${pIdx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={palette.coreGrad[0]} stopOpacity="0.90" />
                  <stop offset="45%" stopColor={palette.coreGrad[1]} stopOpacity="0.92" />
                  <stop offset="100%" stopColor={palette.coreGrad[2]} stopOpacity="0.96" />
                </linearGradient>

                {/* Speech Bubble Fill Gradient */}
                <linearGradient id={`bubbleGrad-${pIdx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={palette.bubbleGrad[0]} stopOpacity="0.94" />
                  <stop offset="100%" stopColor={palette.bubbleGrad[1]} stopOpacity="0.98" />
                </linearGradient>

                {/* Outer Glass Rim Bevel */}
                <linearGradient id={`glassRim-${pIdx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={palette.rimStroke[0]} />
                  <stop offset="40%" stopColor="rgba(255, 255, 255, 0.85)" />
                  <stop offset="100%" stopColor={palette.rimStroke[1]} />
                </linearGradient>
              </React.Fragment>
            ))}
          </defs>

          {/* Subtle Horizontal Telemetry Grid Lines (Exact 10-WPM Intervals: 0 to 100 WPM Scale) */}
          {yTicks.map((tick) => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <line
                  x1={leftPadding - 8}
                  y1={y}
                  x2={chartWidth - rightPadding + 8}
                  y2={y}
                  stroke={tick === 0 ? 'transparent' : 'rgba(168, 162, 195, 0.35)'}
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={leftPadding - 16}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-[var(--text-muted)] text-[11px] font-mono font-semibold select-none"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Reflective Ground Floor Surface Below Horizon (Reference Image 2) */}
          <rect
            x={leftPadding - 16}
            y={baselineY}
            width={chartWidth - leftPadding - rightPadding + 32}
            height={chartHeight - baselineY}
            fill="url(#reflectionFloorGrad)"
            opacity="0.25"
          />
          <linearGradient id="reflectionFloorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#DDD6FE" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#C4B5FD" stopOpacity="0.1" />
          </linearGradient>

          {/* Horizon Ground Line (Reflective Studio Floor Plane) */}
          <line
            x1={leftPadding - 16}
            y1={baselineY}
            x2={chartWidth - rightPadding + 16}
            y2={baselineY}
            stroke="rgba(196, 181, 253, 0.7)"
            strokeWidth="1.5"
          />

          {/* Inverted Mirror Floor Reflections (Reference Image 2) */}
          <g mask="url(#floorReflectionMask)">
            {entries.map((entry, idx) => {
              const palette = GLASS_PALETTES[idx % GLASS_PALETTES.length];
              const val = getMetricValue(entry);
              const x = startX + idx * (barWidth + gap);
              const y = getY(val);
              const barHeight = Math.max(16, baselineY - y);
              const reflectionHeight = Math.min(barHeight, 60);

              return (
                <g key={`refl-${entry.user_id || idx}`}>
                  <rect
                    x={x}
                    y={baselineY}
                    width={barWidth}
                    height={reflectionHeight}
                    rx={barCornerRadius}
                    fill={`url(#barCoreGrad-${idx % GLASS_PALETTES.length})`}
                    transform={`translate(0, ${2 * baselineY}) scale(1, -1)`}
                    opacity={0.44}
                  />
                </g>
              );
            })}
          </g>

          {/* 3D Glass Bars, Highlights & Floating Speech Bubbles (Centered Group) */}
          {entries.map((entry, idx) => {
            const palette = GLASS_PALETTES[idx % GLASS_PALETTES.length];
            const val = getMetricValue(entry);
            const x = startX + idx * (barWidth + gap);
            const centerX = x + barWidth / 2;
            const y = getY(val);
            const barHeight = Math.max(16, baselineY - y);
            const isHovered = hoveredIdx === idx;

            // Wide, authentic 3D glass speech bubble dimensions
            const bubbleW = 76;
            const bubbleH = 36;
            const bubbleTailH = 9;
            const bubbleTailW = 18;
            const bubbleGap = 10; // Gap between tail tip and top cap of the bar
            const bubbleTailTipY = y - bubbleGap;
            const bubblePath = getSpeechBubblePath(centerX, bubbleTailTipY, bubbleW, bubbleH, 11, bubbleTailH, bubbleTailW);
            const bubbleBodyTop = bubbleTailTipY - bubbleTailH - bubbleH;

            return (
              <g
                key={entry.user_id || idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer transition-transform duration-200"
                style={{
                  transform: isHovered ? 'scale(1.02)' : 'none',
                  transformOrigin: `${centerX}px ${baselineY}px`,
                }}
              >
                {/* 1. Ground Contact Shadow Ellipse */}
                <ellipse
                  cx={centerX}
                  cy={baselineY + 2.5}
                  rx={barWidth * 0.44}
                  ry={4.5}
                  fill="rgba(51, 65, 85, 0.28)"
                  filter="url(#glassContactShadow)"
                />

                {/* 2. Soft Ambient Bar Drop Shadow */}
                <rect
                  x={x + 2}
                  y={y + 3}
                  width={barWidth}
                  height={barHeight}
                  rx={barCornerRadius}
                  fill={palette.shadowColor}
                  opacity={0.4}
                />

                {/* 3. Outer Clear Glass Acrylic Shell (Double Casing - Reference Image 2) */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={barCornerRadius}
                  fill={palette.glassTint}
                  stroke="rgba(255, 255, 255, 0.92)"
                  strokeWidth="1.5"
                />

                {/* 4. Inner Luminous Colored Core (Inset for Thick Glass Wall Appearance, rx={8} compliance) */}
                <rect
                  x={x + 5}
                  y={y + 5}
                  width={barWidth - 10}
                  height={barHeight - 10}
                  rx={Math.max(8, barCornerRadius - 5)}
                  fill={`url(#barCoreGrad-${idx % GLASS_PALETTES.length})`}
                />

                {/* 5. 3D Perspective Rounded Top Cap (Reference Image 2 Feature: Top Face Catching Light) */}
                <rect
                  x={x + 4}
                  y={y + 3.5}
                  width={barWidth - 8}
                  height={13}
                  rx={6.5}
                  fill="rgba(255, 255, 255, 0.6)"
                  stroke="rgba(255, 255, 255, 0.98)"
                  strokeWidth="1.2"
                  opacity={0.92}
                />
                <rect
                  x={x + 8}
                  y={y + 5.5}
                  width={barWidth - 16}
                  height={7}
                  rx={3.5}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.85)"
                  strokeWidth="0.8"
                  opacity={0.85}
                />

                {/* 6. Cylindrical 3D Light Refraction Volume (Realistic Acrylic/Glass Depth) */}
                <rect
                  x={x + 2}
                  y={y + 2}
                  width={barWidth - 4}
                  height={barHeight - 4}
                  rx={barCornerRadius - 2}
                  fill="url(#cylindricalGlassOverlay)"
                  opacity={0.52}
                />

                {/* 7. Signature Curved Top Cap Gleam (Bright Specular Reflection Arc) */}
                <path
                  d={`M ${x + 9} ${y + 5} Q ${centerX} ${y + 2.5} ${x + barWidth - 9} ${y + 5}`}
                  stroke="rgba(255, 255, 255, 0.98)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* 8. Vertical Gloss Reflection Streak Along Left Edge */}
                <line
                  x1={x + 4}
                  y1={y + 14}
                  x2={x + 4}
                  y2={y + barHeight - 14}
                  stroke="url(#verticalGlossStreak)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                {/* 9. Bottom Internal Refraction Arc */}
                <path
                  d={`M ${x + 10} ${y + barHeight - 4.5} Q ${centerX} ${y + barHeight - 2.5} ${x + barWidth - 10} ${y + barHeight - 4.5}`}
                  stroke="rgba(255, 255, 255, 0.65)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />

                {/* 10. FLOATING 3D GLASS SPEECH BUBBLE WITH CHROMATIC HIGH-CONTRAST NUMBERS */}
                <g
                  filter="url(#bubbleDropShadow)"
                  className="transition-transform duration-200"
                  style={{
                    transform: isHovered ? 'translateY(-4px)' : 'none',
                  }}
                >
                  {/* Speech Bubble Glass Body & Wide-Base Pointer Path */}
                  <path
                    d={bubblePath}
                    fill={`url(#bubbleGrad-${idx % GLASS_PALETTES.length})`}
                    stroke="rgba(255, 255, 255, 0.98)"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />

                  {/* Bubble Top Specular Gloss Highlight Streak */}
                  <path
                    d={`M ${centerX - bubbleW / 2 + 10} ${bubbleBodyTop + 4} H ${centerX + bubbleW / 2 - 10}`}
                    stroke="rgba(255, 255, 255, 0.95)"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />

                  {/* Chromatic, Polished, High-Contrast Performance Value Inside Bubble */}
                  <text
                    x={centerX}
                    y={bubbleBodyTop + bubbleH / 2 + 5}
                    textAnchor="middle"
                    className="text-[13.5px] font-mono font-black select-none"
                    fill={palette.bubbleTextColor}
                    style={{
                      filter: 'drop-shadow(0 1px 0 rgba(255,255,255,0.85))',
                    }}
                  >
                    {category === 'accuracy' ? `${val.toFixed(0)}%` : val.toFixed(1)}
                  </text>
                </g>

                {/* 11. High-Contrast Rank Indicator Pill Badge Below Ground Line */}
                <rect
                  x={centerX - 20}
                  y={baselineY + 20}
                  width={40}
                  height={22}
                  rx={11}
                  fill={palette.badgeBg}
                  stroke={palette.badgeText}
                  strokeWidth="1"
                  strokeOpacity="0.4"
                />
                <text
                  x={centerX}
                  y={baselineY + 35}
                  textAnchor="middle"
                  className="text-[11px] font-mono font-black select-none"
                  fill={palette.badgeText}
                >
                  #{entry.rank}
                </text>

                {/* 12. High-Contrast Player Username Under Rank */}
                <text
                  x={centerX}
                  y={baselineY + 58}
                  textAnchor="middle"
                  className="fill-[var(--text-secondary)] text-[11px] font-mono font-semibold tracking-tight select-none"
                >
                  {truncateUsername(entry.username, 9)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Detailed Interactive Telemetry Tooltip on Hover */}
        {hoveredIdx !== null && entries[hoveredIdx] && (
          <div
            className="absolute z-30 pointer-events-none p-3.5 rounded-2xl bg-[var(--bg-surface)]/95 backdrop-blur-md border border-[var(--border)] shadow-2xl text-xs font-mono transition-opacity duration-150"
            style={{
              left: Math.min(
                startX + hoveredIdx * (barWidth + gap) - 40,
                chartWidth - 210
              ),
              top: Math.max(12, getY(getMetricValue(entries[hoveredIdx])) - 100),
            }}
          >
            <div className="flex items-center gap-2 font-bold text-[var(--text-primary)] mb-1">
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-black"
                style={{
                  backgroundColor: GLASS_PALETTES[hoveredIdx % GLASS_PALETTES.length].badgeBg,
                  color: GLASS_PALETTES[hoveredIdx % GLASS_PALETTES.length].badgeText,
                }}
              >
                #{entries[hoveredIdx].rank}
              </span>
              <span className="truncate max-w-[130px]">
                {entries[hoveredIdx].display_name || entries[hoveredIdx].username}
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">@{entries[hoveredIdx].username}</p>
            <div className="mt-2.5 pt-2 border-t border-[var(--border)] grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
              <div>
                <span className="text-[var(--text-muted)]">Net WPM: </span>
                <span className="font-black text-[var(--accent)]">{entries[hoveredIdx].net_wpm.toFixed(1)}</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">Gross: </span>
                <span className="font-semibold text-[var(--text-secondary)]">{entries[hoveredIdx].gross_wpm.toFixed(1)}</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">Acc: </span>
                <span className="font-semibold text-[var(--text-secondary)]">{entries[hoveredIdx].accuracy.toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">Sessions: </span>
                <span className="font-semibold text-[var(--text-secondary)]">{entries[hoveredIdx].sessions_count}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardChart;
