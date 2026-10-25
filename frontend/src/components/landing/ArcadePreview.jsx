import React from 'react';
import { Gamepad2, Zap, Flame, Target, Sparkles } from 'lucide-react';
import { Button } from '../common/Button';

export const ARCADE_GAMES = [
  {
    id: 'cascade',
    title: 'Key Cascade',
    subtitle: 'Falling words defensive arcade',
    badge: 'Popular',
    icon: Flame,
    color: '#F06B72',
    description:
      'Words stream down the screen in vertical chutes. Type them before they crash into your defense barrier. Combos increase speed multiplier.',
    difficulty: 'Dynamic (Level 1-20)',
    highScore: '4,820 pts',
    features: ['Cascading word physics', 'Multi-word combo multiplier', 'Special power-up tokens'],
  },
  {
    id: 'sprint',
    title: 'Speed Sprint',
    subtitle: 'High-octane velocity rush',
    badge: 'High Velocity',
    icon: Zap,
    color: '#C8F36A',
    description:
      '60-second non-stop burst sprint. Every completed word extends the timer by +0.5 seconds. Push your absolute physiological peak speed.',
    difficulty: 'Expert',
    highScore: '124 WPM',
    features: ['Time-extension mechanic', 'Instant error recovery', 'Real-time velocity spikes'],
  },
  {
    id: 'hunter',
    title: 'Word Hunter',
    subtitle: 'Target elimination precision training',
    badge: 'Precision',
    icon: Target,
    color: '#38BDF8',
    description:
      'Target words appear in an unpredictable radar matrix. Spot the highlighted target and eliminate it with zero typos to maintain your streak.',
    difficulty: 'Intermediate',
    highScore: '99.4% streak',
    features: ['Eye-movement coordination', 'Blind periphery training', 'Streak shield bonuses'],
  },
];

export const ArcadePreview = () => {
  return (
    <section id="arcade" className="py-20 border-t border-[var(--border)] relative bg-[var(--bg-surface)]/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--accent)] font-mono">
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Interactive Typing Arcade</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Game-Engineered Speed Drills
          </h2>
          <p className="text-sm sm:text-base text-[var(--text-secondary)]">
            Drills disguised as arcade classics. Build lightning reaction times and hand-eye
            coordination through pressure mechanics.
          </p>
        </div>

        {/* 3 Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {ARCADE_GAMES.map((game) => {
            const Icon = game.icon;
            return (
              <div
                key={game.id}
                className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] p-6 space-y-5 hover:border-[var(--accent)] transition-all duration-200 shadow-lg hover:shadow-xl flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{ backgroundColor: `${game.color}20`, color: game.color }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)]">
                      {game.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                      {game.title}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
                      {game.subtitle}
                    </p>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {game.description}
                  </p>

                  {/* Features list */}
                  <div className="space-y-1.5 pt-2">
                    {game.features.map((feat, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)]"
                      >
                        <Sparkles className="w-3 h-3 text-[var(--accent)] shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Score & Play Button */}
                <div className="pt-4 border-t border-[var(--border)] space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[var(--text-muted)]">Leaderboard Peak:</span>
                    <span className="text-[var(--accent)] font-semibold">{game.highScore}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-center group-hover:bg-[var(--accent)] group-hover:text-[var(--accent-fg)] group-hover:border-[var(--accent)]"
                    onClick={() => alert(`Launching ${game.title} Arcade Engine in Phase 6!`)}
                  >
                    Play {game.title}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
