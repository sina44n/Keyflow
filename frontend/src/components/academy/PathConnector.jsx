import React, { useState, useEffect } from 'react';

/**
 * PathConnector
 * =========================================================================
 * Renders glowing, responsive SVG circuits connecting the lesson cards
 * along their journey, inspired by Reference A in Reference B's neon-red theme.
 * Dynamically adapts to grid columns (5-col, 4-col, 3-col, 2-col, 1-col).
 */
export const PathConnector = ({ containerRef, cardRefs, lessons, activeLessonNum }) => {
  const [paths, setPaths] = useState([]);
  const [nodes, setNodes] = useState([]);

  useEffect(() => {
    const calculatePaths = () => {
      if (!containerRef.current || !cardRefs.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newPaths = [];
      const newNodes = [];

      const cardCount = lessons.length;

      for (let i = 0; i < cardCount - 1; i++) {
        const currentCard = cardRefs.current[i];
        const nextCard = cardRefs.current[i + 1];

        if (!currentCard || !nextCard) continue;

        const currentRect = currentCard.getBoundingClientRect();
        const nextRect = nextCard.getBoundingClientRect();

        // Coordinates relative to container
        const currentCenterY = (currentRect.top + currentRect.bottom) / 2 - containerRect.top;
        const nextCenterY = (nextRect.top + nextRect.bottom) / 2 - containerRect.top;
        const currentRight = currentRect.right - containerRect.left;
        const nextLeft = nextRect.left - containerRect.left;
        const currentBottom = currentRect.bottom - containerRect.top;
        const nextTop = nextRect.top - containerRect.top;
        const currentCenterX = (currentRect.left + currentRect.right) / 2 - containerRect.left;
        const nextCenterX = (nextRect.left + nextRect.right) / 2 - containerRect.left;

        // Determine progression state of this connection
        const isCurrentCompleted = lessons[i]?.record?.completed;
        const isNextUnlocked = lessons[i + 1]?.unlocked;
        const isNextCurrent = lessons[i + 1]?.lessonNum === activeLessonNum;
        const isActive = isCurrentCompleted && (isNextUnlocked || isNextCurrent);
        const isCompleted = isCurrentCompleted && lessons[i + 1]?.record?.completed;

        let d = '';

        // Check if cards are roughly in the same horizontal row (within 15px)
        const isSameRow = Math.abs(currentCenterY - nextCenterY) < 18;

        if (isSameRow) {
          // Horizontal connector between adjacent cards in same row
          d = `M ${currentRight} ${currentCenterY} L ${nextLeft} ${nextCenterY}`;

          newNodes.push({
            id: `node-exit-${i}`,
            x: currentRight,
            y: currentCenterY,
            active: isCurrentCompleted,
          });
          newNodes.push({
            id: `node-enter-${i + 1}`,
            x: nextLeft,
            y: nextCenterY,
            active: isActive,
          });
        } else if (Math.abs(currentCenterX - nextCenterX) < 20) {
          // Single-column vertical stacking (mobile)
          d = `M ${currentCenterX} ${currentBottom} L ${nextCenterX} ${nextTop}`;

          newNodes.push({
            id: `node-exit-v-${i}`,
            x: currentCenterX,
            y: currentBottom,
            active: isCurrentCompleted,
          });
          newNodes.push({
            id: `node-enter-v-${i + 1}`,
            x: nextCenterX,
            y: nextTop,
            active: isActive,
          });
        } else {
          // Row transition: serpentine / hair-pin turn connecting from end of row to next row
          const exitX = currentRight;
          const exitY = currentCenterY;
          const enterX = nextLeft;
          const enterY = nextCenterY;

          // Smooth cubic bezier S-curve curving outwards and around
          const curveDistance = Math.max(35, Math.abs(currentCenterY - nextCenterY) * 0.4);
          const cp1X = exitX + curveDistance;
          const cp1Y = exitY;
          const cp2X = enterX - curveDistance;
          const cp2Y = enterY;

          d = `M ${exitX} ${exitY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${enterX} ${enterY}`;

          newNodes.push({
            id: `node-loop-exit-${i}`,
            x: exitX,
            y: exitY,
            active: isCurrentCompleted,
          });
          newNodes.push({
            id: `node-loop-enter-${i + 1}`,
            x: enterX,
            y: enterY,
            active: isActive,
          });
        }

        newPaths.push({
          id: `path-${i}-${i + 1}`,
          d,
          isActive,
          isCompleted,
        });
      }

      setPaths(newPaths);
      setNodes(newNodes);
    };

    // Calculate immediately and on resize
    calculatePaths();
    const timer = setTimeout(calculatePaths, 100);
    const observer = new ResizeObserver(calculatePaths);
    if (containerRef.current) observer.observe(containerRef.current);
    window.addEventListener('resize', calculatePaths);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener('resize', calculatePaths);
    };
  }, [containerRef, cardRefs, lessons, activeLessonNum]);

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible"
      aria-hidden="true"
    >
      <defs>
        <filter id="circuitRedGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="var(--accent, #FF1744)" floodOpacity="0.8" />
        </filter>
        <filter id="circuitGreenGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="var(--ui-success, #22D889)" floodOpacity="0.8" />
        </filter>
        <linearGradient id="activeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent, #FF1744)" />
          <stop offset="100%" stopColor="var(--accent-hover, #FF304F)" />
        </linearGradient>
      </defs>

      {/* Background connector paths (inactive) */}
      {paths.map((p) => (
        <path
          key={`bg-${p.id}`}
          d={p.d}
          fill="none"
          stroke="var(--border, #1F2837)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.8"
        />
      ))}

      {/* Active & Completed neon-red glow paths */}
      {paths.map((p) => {
        if (!p.isActive && !p.isCompleted) return null;
        return (
          <path
            key={`fg-${p.id}`}
            d={p.d}
            fill="none"
            stroke={p.isCompleted ? "var(--ui-success, #22D889)" : "url(#activeGradient)"}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={p.isCompleted ? "url(#circuitGreenGlow)" : "url(#circuitRedGlow)"}
            className="transition-all duration-300"
          />
        );
      })}

      {/* Junction Nodes at card entry/exit points */}
      {nodes.map((n) => (
        <circle
          key={n.id}
          cx={n.x}
          cy={n.y}
          r={n.active ? 3.5 : 2.5}
          fill={n.active ? 'var(--accent, #FF1744)' : 'var(--border, #222B38)'}
          stroke={n.active ? 'var(--text-primary, #FFFFFF)' : 'var(--border-subtle, #151D28)'}
          strokeWidth="1"
          filter={n.active ? "url(#circuitRedGlow)" : undefined}
          className="transition-all duration-300"
        />
      ))}
    </svg>
  );
};
