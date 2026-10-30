/**
 * KEYFLOW Global Game Performance System — Arcade Game Loading Screen
 * ===================================================================
 * Smooth, non-blocking Suspense fallback displayed while lazily loading
 * an arcade game's isolated bundle and rendering engine.
 */

import React, { useState, useEffect } from 'react';
import { Loader2, ArrowLeft, Gamepad2 } from 'lucide-react';
import { Button } from '../../common/Button';

export const ArcadeGameLoadingScreen = ({ onCancel = null, gameTitle = 'Arcade Arena' }) => {
  const [stageIndex, setStageIndex] = useState(0);

  const stages = [
    'Initializing isolated game runtime...',
    'Loading audio synthesizer & sound cues...',
    'Calibrating rendering pipeline...',
    'Readying keyboard input engine...',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStageIndex((prev) => (prev < stages.length - 1 ? prev + 1 : prev));
    }, 250);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="min-h-[480px] w-full flex flex-col items-center justify-center p-8 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl shadow-xl text-center space-y-6"
      role="status"
      aria-live="polite"
    >
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)]">
          <Gamepad2 className="w-8 h-8 animate-pulse" />
        </div>
        <Loader2 className="w-6 h-6 text-[var(--accent)] animate-spin absolute -bottom-2 -right-2 bg-[var(--bg-elevated)] rounded-full p-0.5" />
      </div>

      <div className="space-y-2 max-w-sm">
        <h3 className="text-base font-bold text-[var(--text-primary)]">
          Preparing {gameTitle}
        </h3>
        <p className="text-xs font-mono text-[var(--text-secondary)] min-h-[1.5rem] transition-all">
          {stages[stageIndex]}
        </p>
      </div>

      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-main)] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Arcade Hub</span>
        </button>
      )}
    </div>
  );
};
