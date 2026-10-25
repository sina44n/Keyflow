import React, { useState } from 'react';
import { Gamepad2, Zap, Flame, Target, Sparkles, Info } from 'lucide-react';
import { Button } from '../common/Button';

export const ARCADE_GAMES = [
  {
    id: 'cascade',
    title: 'Key Cascade',
    subtitle: 'Falling words defensive arcade',
    badge: 'Reaction Drill',
    icon: Flame,
    color: '#F06B72',
    description:
      'Words stream down vertical chutes. Eliminate them before they breach your baseline shield. Combos multiply speed scores.',
    difficulty: 'Dynamic (Lvl 1-20)',
    leaderboardMetric: '4,820 pts peak',
    features: ['Cascading word physics', 'Multi-word combo multiplier', 'Special power-up tokens'],
  },
  {
    id: 'sprint',
    title: 'Speed Sprint',
    subtitle: 'High-octane velocity rush',
    badge: 'Velocity Drill',
    icon: Zap,
    color: '#C8F36A',
    description:
      '60-second non-stop sprint. Every accurately completed word extends your clock by +0.5s to test peak burst velocity.',
    difficulty: 'Expert',
    leaderboardMetric: '124 WPM peak',
    features: ['Time-extension mechanic', 'Instant error recovery', 'Real-time velocity spikes'],
  },
  {
    id: 'hunter',
    title: 'Word Hunter',
    subtitle: 'Target elimination precision training',
    badge: 'Precision Drill',
    icon: Target,
    color: '#38BDF8',
    description:
      'Target terms spawn randomly across a radar grid. Locate the highlighted target and destroy it with 100% accuracy.',
    difficulty: 'Intermediate',
    leaderboardMetric: '99.4% streak peak',
    features: ['Eye-movement coordination', 'Peripheral vision drill', 'Streak shield bonuses'],
  },
];

export const ArcadePreview = () => {
  const [selectedGameNotice, setSelectedGameNotice] = useState(null);

  return (
    <section id="arcade" className="section-spacing border-t border-[var(--border)] relative bg-[var(--bg-surface)]/30">
      <div className="container-app space-y-12">
        {/* Header */}
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

        {/* 3 Game Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {ARCADE_GAMES.map((game) => {
            const Icon = game.icon;
            return (
              <div
                key={game.id}
                className="card-panel p-5 sm:p-6 flex flex-col justify-between space-y-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg group"
              >
                <div className="space-y-4">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105"
                      style={{ backgroundColor: `${game.color}20`, color: game.color }}
                    >
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)]">
                      {game.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                      {game.title}
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
                      {game.subtitle}
                    </p>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {game.description}
                  </p>

                  {/* Scannable mechanics list */}
                  <div className="space-y-1.5 pt-1">
                    {game.features.map((feat, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)]"
                      >
                        <Sparkles className="w-3 h-3 text-[var(--accent)] shrink-0 opacity-70" aria-hidden="true" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Anchored Footer */}
                <div className="pt-4 border-t border-[var(--border)] space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[var(--text-muted)] text-[11px]">Rank Metric:</span>
                    <span className="text-[var(--accent)] font-semibold">{game.leaderboardMetric}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-center group-hover:border-[var(--accent)]"
                    onClick={() => setSelectedGameNotice(game)}
                  >
                    View Gameplay Spec
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Informative Game Mechanics Dialog */}
        {selectedGameNotice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" role="dialog" aria-modal="true">
            <div className="w-full max-w-sm rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[var(--bg-elevated)] text-[var(--accent)] shrink-0">
                  <Info className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">
                    {selectedGameNotice.title} — Phase 6 Arcade
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    The {selectedGameNotice.title} game loop, collision physics, combo scoring, and real-time backend leaderboard persistence will be delivered in Phase 6. Test your raw typing speed in the Live Sandbox above!
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="primary" size="sm" onClick={() => setSelectedGameNotice(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
