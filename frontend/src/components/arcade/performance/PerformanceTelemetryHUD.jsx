/**
 * KEYFLOW Global Game Performance System — Performance Telemetry HUD
 * ==================================================================
 * Non-intrusive floating HUD displaying live rendering FPS, frame-time latency,
 * device tier, and active graphics preset. Controlled via user settings.
 */

import React, { useState, useEffect } from 'react';
import { Activity, Gauge, Cpu, CheckCircle2, AlertCircle } from 'lucide-react';
import { GlobalGameManager } from '../../../utils/performance/GlobalGameManager';

export const PerformanceTelemetryHUD = ({ isVisible = false, gameId = null }) => {
  const [metrics, setMetrics] = useState({ fps: 60, averageFps: 60, frameTimeMs: 16.6, slowFrameCount: 0 });
  const [settings, setSettings] = useState(() => GlobalGameManager.getGraphicsConfig());
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const monitor = GlobalGameManager.getActiveMonitor();
    if (!monitor) return;

    const unsubscribe = monitor.subscribe((updatedMetrics) => {
      setMetrics(updatedMetrics);
    });

    const handleProfileChange = () => {
      setSettings(GlobalGameManager.getGraphicsConfig());
    };

    window.addEventListener('keyflow-graphics-profile-changed', handleProfileChange);
    window.addEventListener('keyflow-graphics-adapted', handleProfileChange);

    return () => {
      unsubscribe();
      window.removeEventListener('keyflow-graphics-profile-changed', handleProfileChange);
      window.removeEventListener('keyflow-graphics-adapted', handleProfileChange);
    };
  }, [gameId]);

  if (!isVisible) return null;

  const fpsColor =
    metrics.averageFps >= 50
      ? 'text-emerald-400'
      : metrics.averageFps >= 30
      ? 'text-amber-400'
      : 'text-rose-400';

  const fpsBg =
    metrics.averageFps >= 50
      ? 'bg-emerald-500/10 border-emerald-500/30'
      : metrics.averageFps >= 30
      ? 'bg-amber-500/10 border-amber-500/30'
      : 'bg-rose-500/10 border-rose-500/30';

  return (
    <div
      className="fixed bottom-4 right-4 z-50 font-mono text-[11px] select-none pointer-events-auto"
      role="status"
      aria-live="polite"
      aria-label="Real-time Performance Telemetry"
    >
      <div className="bg-neutral-900/90 backdrop-blur-md border border-neutral-700/80 rounded-xl shadow-2xl p-2.5 text-neutral-200 transition-all duration-200">
        {/* Header & Toggle */}
        <div className="flex items-center justify-between gap-3 border-b border-neutral-800 pb-1.5 mb-2">
          <div className="flex items-center gap-1.5 text-neutral-400">
            <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="font-bold tracking-wider text-[10px] uppercase">Telemetry</span>
          </div>
          <button
            type="button"
            onClick={() => setIsMinimized((m) => !m)}
            className="text-[10px] text-neutral-400 hover:text-white px-1.5 py-0.5 rounded bg-neutral-800 cursor-pointer"
            aria-label={isMinimized ? 'Expand telemetry' : 'Minimize telemetry'}
          >
            {isMinimized ? '+' : '−'}
          </button>
        </div>

        {/* Live Metrics Grid */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-4">
            <span className="text-neutral-400">Rendering:</span>
            <div className={`px-2 py-0.5 rounded border font-bold ${fpsColor} ${fpsBg}`}>
              {metrics.averageFps} FPS
            </div>
          </div>

          {!isMinimized && (
            <>
              <div className="flex items-center justify-between gap-4">
                <span className="text-neutral-400">Frame Time:</span>
                <span className="font-semibold text-neutral-200">{metrics.frameTimeMs} ms</span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-neutral-400">Preset:</span>
                <span className="font-semibold text-cyan-300 uppercase">{settings.preset}</span>
              </div>

              {metrics.slowFrameCount > 0 && (
                <div className="flex items-center justify-between gap-4 text-amber-400/90 text-[10px]">
                  <span>Jitter drops:</span>
                  <span>{metrics.slowFrameCount}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
