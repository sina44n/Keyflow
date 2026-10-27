import React from 'react';
import { Gamepad2 } from 'lucide-react';
import { ArcadeHub } from '../arcade/ArcadeHub';

export const ArcadePreview = () => {
  return (
    <section id="arcade" className="section-spacing border-t border-[var(--border)] relative bg-[var(--bg-surface)]/30">
      <div className="container-app space-y-10 sm:space-y-12">
        {/* Header matching screenshot */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--accent)] font-mono">
            <Gamepad2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Interactive Typing Arcade</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Game-Engineered Speed Drills
          </h2>

          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            Neuromuscular drills disguised as arcade classics. Train reaction speed, peripheral vision, and burst cadence under time pressure.
          </p>
        </div>

        {/* 7-Game Playable Arcade Hub */}
        <ArcadeHub isEmbedded={true} />
      </div>
    </section>
  );
};
