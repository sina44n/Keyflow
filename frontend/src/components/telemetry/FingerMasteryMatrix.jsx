import React, { useState, useEffect, useMemo } from 'react';
import { Lightbulb, X, Activity, Target, Zap, ShieldCheck } from 'lucide-react';
import { practiceAPI } from '../../utils/api.js';
import { SPEED_SHADES, computeSpeedShade, ACCURACY_SHADES, computeAccuracyShade } from '../../utils/touchTypingMap.js';

export { SPEED_SHADES, computeSpeedShade, ACCURACY_SHADES, computeAccuracyShade };

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
  const [hoveredFinger, setHoveredFinger] = useState(null);
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

  // Authentic speed bounds across practiced fingers for dynamic 4-shade distribution (Task 1)
  const speedBounds = useMemo(() => {
    const validSpeeds = displayFingers
      .filter((f) => f.hasData && typeof f.speed === 'number' && f.speed > 0)
      .map((f) => f.speed);

    if (validSpeeds.length === 0) {
      return { min: 20, max: 40, dynamic: false };
    }
    const min = Math.min(...validSpeeds);
    const max = Math.max(...validSpeeds);
    return { min, max, dynamic: true };
  }, [displayFingers]);

  const getSpeedShade = (wpm, hasData) => computeSpeedShade(wpm, hasData, speedBounds);

  // Authentic accuracy bounds across practiced fingers for dynamic 4-shade distribution (Task 2)
  const accuracyBounds = useMemo(() => {
    const validAccuracies = displayFingers
      .filter((f) => f.hasData && typeof f.accuracy === 'number' && f.accuracy > 0)
      .map((f) => f.accuracy);

    if (validAccuracies.length === 0) {
      return { min: 80, max: 100, dynamic: false };
    }
    const min = Math.min(...validAccuracies);
    const max = Math.max(...validAccuracies);
    return { min, max, dynamic: true };
  }, [displayFingers]);

  const getAccuracyShade = (acc, hasData) => computeAccuracyShade(acc, hasData, accuracyBounds);

  // Individual performance color for any digit based on mode (Task 1 & Task 2)
  const getFingerPerformanceColor = (fId) => {
    const f = safeFingerMap[fId];
    if (!f || !f.hasData) return '#e2e8f0';
    if (mode === 'speed') return getSpeedShade(f.speed, f.hasData);
    return getAccuracyShade(f.accuracy, f.hasData);
  };

  /**
   * Anatomical Hand Vector Silhouette matching TypingClub Reference.
   * Renders the complete hand silhouette (palm, 4 fingers, thumb) filled
   * with the finger's performance shade (Level 1..4), and overlays the
   * specific active digit highlighted in vibrant TypingClub orange (#f7941d).
   */
  const ANATOMICAL_HAND_PATH =
    'M 46.5 13.8 C 46.9 13.6, 47.7 13.2, 48.3 13.8 C 48.9 14.4, 51.5 14.8, 51.9 19.2 C 52.3 23.6, 51.7 47.6, 51.9 51.6 C 52.1 55.6, 52.9 54.2, 53.7 53.4 C 54.5 52.6, 58.3 46.5, 59.1 44.4 C 59.9 42.3, 60.1 37.7, 60.9 35.4 C 61.7 33.1, 65.2 26.3, 66.3 24.6 C 67.3 22.9, 68.9 21.4, 69.9 21.0 C 71.0 20.6, 74.7 19.9, 75.3 21.0 C 75.9 22.1, 75.5 28.7, 75.3 30.0 C 75.1 31.3, 73.7 31.2, 73.5 31.8 C 73.3 32.4, 73.7 34.8, 73.5 35.4 C 73.3 36.0, 71.9 36.6, 71.7 37.2 C 71.5 37.8, 71.9 40.2, 71.7 40.8 C 71.5 41.4, 70.1 42.0, 69.9 42.6 C 69.7 43.2, 70.3 44.9, 69.9 46.2 C 69.5 47.5, 66.7 50.5, 66.3 53.4 C 65.9 56.3, 65.9 68.9, 66.3 71.4 C 66.7 73.9, 69.3 74.6, 69.9 75.0 C 70.5 75.4, 69.6 76.5, 71.7 75.0 C 73.8 73.5, 85.2 63.7, 87.9 62.4 C 90.6 61.1, 94.3 63.4, 95.1 64.2 C 95.9 65.0, 97.4 66.7, 95.1 69.6 C 92.8 72.5, 78.0 86.2, 75.3 89.4 C 72.6 92.6, 73.0 95.1, 71.7 96.6 C 70.4 98.1, 66.6 100.7, 64.5 102.0 C 62.4 103.3, 56.9 106.8, 53.7 107.4 C 50.6 108.0, 40.2 108.0, 37.5 107.4 C 34.8 106.8, 31.4 102.6, 30.3 102.0 C 29.2 101.4, 29.6 102.8, 28.5 102.0 C 27.4 101.2, 22.4 96.1, 21.3 94.8 C 20.2 93.5, 19.7 92.2, 19.5 91.2 C 19.3 90.2, 19.7 86.6, 19.5 85.8 C 19.3 85.0, 17.9 85.7, 17.7 84.0 C 17.5 82.3, 18.8 74.6, 17.7 71.4 C 16.6 68.2, 9.8 59.1, 8.7 57.0 C 7.6 54.9, 9.1 54.7, 8.7 53.4 C 8.3 52.1, 5.5 47.7, 5.1 46.2 C 4.7 44.7, 4.7 41.6, 5.1 40.8 C 5.5 40.0, 7.6 38.6, 8.7 39.0 C 9.8 39.4, 13.3 43.1, 14.1 44.4 C 14.9 45.7, 15.3 48.8, 15.9 49.8 C 16.5 50.8, 18.7 52.1, 19.5 53.4 C 20.3 54.7, 22.5 60.0, 23.1 60.6 C 23.7 61.2, 24.7 59.8, 24.9 58.8 C 25.1 57.8, 25.1 52.6, 24.9 51.6 C 24.7 50.6, 23.3 50.6, 23.1 49.8 C 22.9 49.0, 23.3 45.2, 23.1 44.4 C 22.9 43.6, 21.5 43.4, 21.3 42.6 C 21.1 41.8, 21.5 38.0, 21.3 37.2 C 21.1 36.4, 19.7 36.2, 19.5 35.4 C 19.3 34.6, 19.7 31.1, 19.5 30.0 C 19.3 28.9, 17.7 27.2, 17.7 26.4 C 17.7 25.6, 18.4 23.2, 19.5 22.8 C 20.6 22.4, 25.9 22.4, 26.7 22.8 C 27.5 23.2, 26.5 25.8, 26.7 26.4 C 26.9 27.0, 28.3 27.6, 28.5 28.2 C 28.7 28.8, 28.1 30.5, 28.5 31.8 C 28.9 33.1, 31.7 37.5, 32.1 39.0 C 32.5 40.5, 31.5 42.7, 32.1 44.4 C 32.7 46.1, 36.5 53.0, 37.5 53.4 C 38.5 53.8, 40.7 51.8, 41.1 48.0 C 41.5 44.2, 40.9 24.4, 41.1 21.0 C 41.3 17.6, 42.7 19.8, 42.9 19.2 C 43.1 18.6, 42.7 16.0, 42.9 15.6 C 43.1 15.2, 44.3 15.8, 44.7 15.6 C 45.1 15.4, 46.1 14.0, 46.5 13.8 Z';

  const DIGIT_PATHS = {
    pinky:
      'M 6.9 40.8 C 7.3 40.6, 7.9 40.2, 8.7 40.8 C 9.5 41.4, 13.3 44.9, 14.1 46.2 C 14.9 47.5, 14.8 49.9, 15.9 51.6 C 16.9 53.3, 22.9 58.5, 23.1 60.6 C 23.3 62.7, 18.3 68.1, 17.7 69.6 C 17.1 71.1, 17.7 73.2, 17.7 73.2 C 17.7 73.2, 19.0 72.3, 17.7 69.6 C 16.4 66.9, 8.2 52.7, 6.9 49.8 C 5.6 46.9, 7.1 45.2, 6.9 44.4 C 6.7 43.6, 5.1 43.0, 5.1 42.6 C 5.1 42.2, 6.5 41.0, 6.9 40.8 Z',
    ring:
      'M 19.5 22.8 C 19.9 22.6, 20.7 22.4, 21.3 22.8 C 21.9 23.2, 24.5 25.6, 24.9 26.4 C 25.3 27.2, 24.7 29.4, 24.9 30.0 C 25.1 30.6, 26.5 31.0, 26.7 31.8 C 26.9 32.6, 26.5 36.4, 26.7 37.2 C 26.9 38.0, 28.3 38.4, 28.5 39.0 C 28.7 39.6, 28.3 42.0, 28.5 42.6 C 28.7 43.2, 30.1 43.8, 30.3 44.4 C 30.5 45.0, 30.1 47.4, 30.3 48.0 C 30.5 48.6, 31.9 49.4, 32.1 49.8 C 32.3 50.2, 32.9 50.8, 32.1 51.6 C 31.3 52.4, 25.9 56.4, 24.9 57.0 C 23.8 57.6, 23.3 57.8, 23.1 57.0 C 22.9 56.2, 23.3 50.8, 23.1 49.8 C 22.9 48.8, 21.5 48.6, 21.3 48.0 C 21.1 47.4, 21.5 45.0, 21.3 44.4 C 21.1 43.8, 19.7 43.4, 19.5 42.6 C 19.3 41.8, 19.7 38.0, 19.5 37.2 C 19.3 36.4, 17.9 36.0, 17.7 35.4 C 17.5 34.8, 17.9 32.4, 17.7 31.8 C 17.5 31.2, 16.1 30.6, 15.9 30.0 C 15.7 29.4, 15.7 27.0, 15.9 26.4 C 16.1 25.8, 17.3 25.0, 17.7 24.6 C 18.1 24.2, 19.1 23.0, 19.5 22.8 Z',
    middle:
      'M 42.9 15.6 C 43.7 15.4, 47.7 11.8, 48.3 15.6 C 48.9 19.4, 48.1 44.0, 48.3 48.0 C 48.5 52.0, 51.1 49.6, 50.1 49.8 C 49.1 50.0, 40.6 51.9, 39.3 49.8 C 38.0 47.7, 39.1 34.1, 39.3 31.8 C 39.5 29.5, 40.9 31.7, 41.1 30.0 C 41.3 28.3, 40.9 19.1, 41.1 17.4 C 41.3 15.7, 42.1 15.8, 42.9 15.6 Z',
    index:
      'M 69.9 21.0 C 70.5 20.8, 72.9 20.4, 73.5 21.0 C 74.1 21.6, 75.3 25.6, 75.3 26.4 C 75.3 27.2, 73.7 27.4, 73.5 28.2 C 73.3 29.0, 73.9 32.3, 73.5 33.6 C 73.1 34.9, 70.3 38.0, 69.9 39.0 C 69.5 40.0, 70.3 41.6, 69.9 42.6 C 69.5 43.6, 66.7 46.7, 66.3 48.0 C 65.9 49.3, 66.5 52.6, 66.3 53.4 C 66.1 54.2, 64.7 54.8, 64.5 55.2 C 64.3 55.6, 64.9 57.2, 64.5 57.0 C 64.1 56.8, 61.9 54.0, 60.9 53.4 C 59.9 52.8, 56.1 52.0, 55.5 51.6 C 54.9 51.2, 54.9 51.1, 55.5 49.8 C 56.1 48.5, 60.1 42.9, 60.9 40.8 C 61.7 38.7, 61.9 33.9, 62.7 31.8 C 63.5 29.7, 67.3 24.1, 68.1 22.8 C 68.9 21.5, 69.3 21.2, 69.9 21.0 Z',
  };

  const ACTIVE_FINGER_COLOR = '#f7941d';

  const renderAnatomicalHand = (targetFinger) => {
    const isLeft = targetFinger.isLeft;
    const handColor = getFingerPerformanceColor(targetFinger.id);
    const activeDigit = targetFinger.activeDigit;
    const digitPath = DIGIT_PATHS[activeDigit];
    const clipId = `hand-clip-${targetFinger.id}`;

    return (
      <svg
        viewBox="0 0 100 120"
        className="w-13 h-16 sm:w-16 sm:h-20 transition-transform duration-260 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
        style={{
          transform: isLeft ? 'none' : 'scaleX(-1)',
          transformOrigin: '50% 50%',
        }}
        aria-hidden="true"
      >
        <defs>
          <clipPath id={clipId}>
            <path d={ANATOMICAL_HAND_PATH} />
          </clipPath>
        </defs>

        {/* Base Hand Silhouette (Palm, wrist, thumb & non-active digits in performance shade) */}
        <path
          d={ANATOMICAL_HAND_PATH}
          fill={handColor}
          className="transition-colors duration-240 ease-[cubic-bezier(0.22,1,0.36,1)]"
        />

        {/* Targeted Active Finger Highlight (TypingClub Orange) */}
        {digitPath && (
          <path
            d={digitPath}
            fill={ACTIVE_FINGER_COLOR}
            clipPath={`url(#${clipId})`}
            className="transition-colors duration-240 ease-[cubic-bezier(0.22,1,0.36,1)]"
          />
        )}
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
  const thumbsStrokes = thumbsSummary?.total_keystrokes ?? thumbsSummary?.keystrokes ?? 0;

  // Fastest qualifying finger computation for Left and Right hand
  const bestLeftFinger = useMemo(() => {
    const active = leftDisplay.filter((f) => f.hasData && typeof f.speed === 'number' && f.speed > 0);
    if (active.length === 0) return null;
    return [...active].sort((a, b) => (b.speed - a.speed) || (b.accuracy - a.accuracy))[0];
  }, [leftDisplay]);

  const bestRightFinger = useMemo(() => {
    const active = rightDisplay.filter((f) => f.hasData && typeof f.speed === 'number' && f.speed > 0);
    if (active.length === 0) return null;
    return [...active].sort((a, b) => (b.speed - a.speed) || (b.accuracy - a.accuracy))[0];
  }, [rightDisplay]);

  const leftBestInfo = useMemo(() => {
    if (bestLeftFinger) {
      return {
        name: bestLeftFinger.name,
        speed: bestLeftFinger.speed,
        accuracy: bestLeftFinger.accuracy,
      };
    }
    if (leftSummary?.strongest_finger_details) return leftSummary.strongest_finger_details;
    if (leftSummary?.strongestFingerDetails) return leftSummary.strongestFingerDetails;
    if (leftStrongest) {
      return { name: leftStrongest, speed: null, accuracy: null };
    }
    return null;
  }, [bestLeftFinger, leftSummary, leftStrongest]);

  const rightBestInfo = useMemo(() => {
    if (bestRightFinger) {
      return {
        name: bestRightFinger.name,
        speed: bestRightFinger.speed,
        accuracy: bestRightFinger.accuracy,
      };
    }
    if (rightSummary?.strongest_finger_details) return rightSummary.strongest_finger_details;
    if (rightSummary?.strongestFingerDetails) return rightSummary.strongestFingerDetails;
    if (rightStrongest) {
      return { name: rightStrongest, speed: null, accuracy: null };
    }
    return null;
  }, [bestRightFinger, rightSummary, rightStrongest]);

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
                <span
                  className="w-3.5 h-3.5 rounded-xs bg-[#bad7f3] border border-[#a6ccf0]"
                  title="Slowest (Very Light Blue)"
                />
                <span
                  className="w-3.5 h-3.5 rounded-xs bg-[#97c3ee] border border-[#83b7ea]"
                  title="Developing (Light Blue)"
                />
                <span
                  className="w-3.5 h-3.5 rounded-xs bg-[#75afe8] border border-[#5f9fe0]"
                  title="Improving (Medium Blue)"
                />
                <span
                  className="w-3.5 h-3.5 rounded-xs bg-[#529be2] border border-[#3e89d6]"
                  title="Fastest (Dark Blue)"
                />
              </div>
              <span>Faster</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-mono text-[var(--text-muted)]">
              <span>Highest Accuracy</span>
              <div className="flex items-center gap-1">
                <span
                  className="w-3.5 h-3.5 rounded-xs bg-[#1e68d0] border border-[#1656b0]"
                  title="Highest Accuracy (Blue)"
                />
                <span
                  className="w-3.5 h-3.5 rounded-xs bg-[#fecdd3] border border-[#fda4af]"
                  title="Second-Highest Accuracy (Light Red)"
                />
                <span
                  className="w-3.5 h-3.5 rounded-xs bg-[#f87171] border border-[#ef4444]"
                  title="Third-Highest Accuracy (Medium Red)"
                />
                <span
                  className="w-3.5 h-3.5 rounded-xs bg-[#991b1b] border border-[#7f1d1d]"
                  title="Lowest Accuracy (Dark Red)"
                />
              </div>
              <span>Lower Accuracy</span>
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
              {leftBestInfo && leftHasData && (
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                  Best: {leftBestInfo.name}
                  {typeof leftBestInfo.speed === 'number' && typeof leftBestInfo.accuracy === 'number'
                    ? ` (${leftBestInfo.speed} wpm, ${leftBestInfo.accuracy}%)`
                    : ''}
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
              {rightBestInfo && rightHasData && (
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                  Best: {rightBestInfo.name}
                  {typeof rightBestInfo.speed === 'number' && typeof rightBestInfo.accuracy === 'number'
                    ? ` (${rightBestInfo.speed} wpm, ${rightBestInfo.accuracy}%)`
                    : ''}
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
            <div>
              <div className="font-semibold text-[var(--text-primary)]">Thumbs</div>
              {thumbsHasData && thumbsStrokes > 0 && (
                <div className="text-[10px] text-[var(--text-muted)] font-normal mt-0.5">
                  {thumbsStrokes.toLocaleString()} spacebar strokes
                </div>
              )}
            </div>
            <div className="text-right">
              {mode === 'speed' ? (
                <>
                  <div className="font-bold text-sm text-[var(--text-primary)]">
                    {thumbsHasData ? `${thumbsSpeedVal} wpm` : '— wpm'}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    {thumbsHasData ? `${thumbsAccVal}% Accuracy` : 'No data recorded'}
                  </div>
                </>
              ) : (
                <>
                  <div className="font-bold text-sm text-[var(--text-primary)]">
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
                const isHovered = hoveredFinger?.id === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onMouseEnter={() => setHoveredFinger(f)}
                    onMouseLeave={() => setHoveredFinger(null)}
                    onClick={() => setSelectedFinger(isSelected ? null : f)}
                    className={`group flex flex-col items-center p-2 rounded-xl transition-all duration-240 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--bg-elevated)] ring-2 ring-[var(--accent)] shadow-xs'
                        : isHovered
                          ? 'bg-[var(--bg-elevated)]/80 ring-1 ring-[var(--accent)]/50'
                          : 'hover:bg-[var(--bg-elevated)]/70'
                    }`}
                    title={`${f.hand} ${f.name} Finger\nSpeed: ${f.hasData ? `${f.speed} WPM` : '—'}\nAccuracy: ${f.hasData ? `${f.accuracy}%` : '—'}\nStrokes: ${f.totalKeystrokes} (${f.correct} correct, ${f.incorrect} errors)`}
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
                const isHovered = hoveredFinger?.id === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onMouseEnter={() => setHoveredFinger(f)}
                    onMouseLeave={() => setHoveredFinger(null)}
                    onClick={() => setSelectedFinger(isSelected ? null : f)}
                    className={`group flex flex-col items-center p-2 rounded-xl transition-all duration-240 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--bg-elevated)] ring-2 ring-[var(--accent)] shadow-xs'
                        : isHovered
                          ? 'bg-[var(--bg-elevated)]/80 ring-1 ring-[var(--accent)]/50'
                          : 'hover:bg-[var(--bg-elevated)]/70'
                    }`}
                    title={`${f.hand} ${f.name} Finger\nSpeed: ${f.hasData ? `${f.speed} WPM` : '—'}\nAccuracy: ${f.hasData ? `${f.accuracy}%` : '—'}\nStrokes: ${f.totalKeystrokes} (${f.correct} correct, ${f.incorrect} errors)`}
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

      {/* Interactive Biomechanical Inspection Drawer (Active on Hover or Selection) */}
      {(selectedFinger || hoveredFinger) && (() => {
        const activeFinger = selectedFinger || hoveredFinger;
        const isPinned = selectedFinger?.id === activeFinger.id;
        return (
          <div className="p-4 sm:p-5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--accent)]/60 shadow-md animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <h4 className="text-sm font-mono font-bold text-[var(--text-primary)]">
                    {activeFinger.hand} Hand — {activeFinger.name} Finger
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-muted)]">
                    {isPinned ? 'Selected' : 'Hover Preview'}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1 font-mono">
                  Assigned touch-typing keys: <strong className="text-[var(--text-primary)]">{activeFinger.keys}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedFinger(null);
                  setHoveredFinger(null);
                }}
                className="p-1 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                title="Close inspection"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 pt-4 border-t border-[var(--border)] font-mono text-xs">
              <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)]">
                <span className="text-[10px] text-[var(--text-muted)] block uppercase">Speed</span>
                <span className="font-bold text-base text-[var(--text-primary)] flex items-center gap-1.5 mt-0.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  {activeFinger.hasData ? `${activeFinger.speed} WPM` : '— wpm'}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)]">
                <span className="text-[10px] text-[var(--text-muted)] block uppercase">Accuracy</span>
                <span className="font-bold text-base text-emerald-500 flex items-center gap-1.5 mt-0.5">
                  <Target className="w-3.5 h-3.5 text-emerald-500" />
                  {activeFinger.hasData ? `${activeFinger.accuracy}%` : '—%'}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)]">
                <span className="text-[10px] text-[var(--text-muted)] block uppercase">Total Keystrokes</span>
                <span className="font-bold text-base text-[var(--text-primary)] flex items-center gap-1.5 mt-0.5">
                  <Activity className="w-3.5 h-3.5 text-blue-500" />
                  {activeFinger.hasData ? activeFinger.totalKeystrokes.toLocaleString() : '0'}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)]">
                <span className="text-[10px] text-[var(--text-muted)] block uppercase">Correct Strokes</span>
                <span className="font-bold text-base text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  {activeFinger.hasData ? activeFinger.correct.toLocaleString() : '0'}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)]">
                <span className="text-[10px] text-[var(--text-muted)] block uppercase">Mistakes</span>
                <span className="font-bold text-base text-rose-500 flex items-center gap-1.5 mt-0.5">
                  <Activity className="w-3.5 h-3.5 text-rose-500" />
                  {activeFinger.hasData ? activeFinger.incorrect.toLocaleString() : '0'}
                </span>
              </div>
            </div>
          </div>
        );
      })()}

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
