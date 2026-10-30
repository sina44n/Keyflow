import React, { useState } from 'react';
import { useI18n } from '../../i18n/I18nContext';

/**
 * AnimatedGameThumbnail — Reusable, High-Performance Animated Artwork Component
 * ==============================================================================
 * Provides game-specific cinematic animation layers (speed streaks, radar sweeps,
 * energy slashes, matrix rain, holographic pulses) over high-res cover art.
 * Extensible for all future KEYFLOW Arcade games.
 */
export const AnimatedGameThumbnail = ({ game }) => {
  const { t } = useI18n();
  const [imgError, setImgError] = useState(false);
  const Icon = game.icon;

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-neutral-950 rounded-xl border border-[var(--border)] group/thumb">
      {/* 1. Base Artwork Image */}
      {!imgError ? (
        <img
          src={game.image}
          alt={`${game.title} visual artwork`}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover/thumb:scale-108"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black text-center">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-2 shadow-lg"
            style={{ backgroundColor: `${game.color}25`, color: game.color }}
          >
            <Icon className="w-6 h-6" />
          </div>
          <span className="font-mono text-xs text-[var(--text-muted)]">{game.title}</span>
        </div>
      )}

      {/* 2. Ambient Color Vignette Gradient */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40 group-hover/thumb:opacity-60 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at 50% 100%, ${game.color}40 0%, transparent 70%), linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)`,
        }}
      />

      {/* 3. Game-Specific Cinematic Motion Layers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* NITRO RACING: Animated speed streaks, moving road markings & headlight sweep */}
        {game.id === 'nitro' && (
          <div className="w-full h-full relative">
            {/* Speed streaks */}
            <div className="absolute top-1/4 -left-10 w-28 h-0.5 bg-gradient-to-r from-transparent via-red-400 to-white rounded-full animate-pulse opacity-75" />
            <div className="absolute top-3/4 -left-5 w-36 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-white rounded-full animate-pulse delay-150 opacity-75" />
            {/* Headlight beam sweep */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent -translate-x-full group-hover/thumb:translate-x-full transition-transform duration-1000 ease-in-out" />
            {/* Nitro boost glow at bottom center */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-6 bg-red-500/30 blur-md rounded-full animate-ping opacity-60" />
          </div>
        )}

        {/* KEY NINJA: Katana slash energy arc & airborne spark particles */}
        {game.id === 'ninja' && (
          <div className="w-full h-full relative">
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-65 group-hover/thumb:opacity-95 transition-opacity">
              <path
                d="M 10 90 Q 50 40 90 10"
                fill="none"
                stroke="#E11D48"
                strokeWidth="1.5"
                strokeDasharray="4 6"
                className="animate-pulse"
              />
              <circle cx="50" cy="40" r="1.5" fill="#FFFFFF" className="animate-ping" />
            </svg>
          </div>
        )}

        {/* SPEED SPRINT: Velocity streaks & forward runner pulse */}
        {game.id === 'sprint' && (
          <div className="w-full h-full relative">
            <div className="absolute top-1/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
            <div className="absolute top-2/3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-lime-400/50 to-transparent" />
          </div>
        )}

        {/* WORD HUNTER: Tactical radar sweep & lock-on crosshair */}
        {game.id === 'hunter' && (
          <div className="w-full h-full relative flex items-center justify-center">
            <div className="w-24 h-24 rounded-full border border-sky-400/30 flex items-center justify-center animate-spin [animation-duration:8s]">
              <div className="w-16 h-16 rounded-full border border-sky-400/40 border-dashed" />
              <div className="absolute w-full h-px bg-sky-400/30" />
              <div className="absolute h-full w-px bg-sky-400/30" />
            </div>
          </div>
        )}

        {/* KEY CASCADE: Vertical data matrix rain */}
        {game.id === 'cascade' && (
          <div className="w-full h-full relative flex justify-around opacity-40">
            <div className="w-0.5 h-full bg-gradient-to-b from-transparent via-rose-500/60 to-transparent animate-pulse" />
            <div className="w-0.5 h-full bg-gradient-to-b from-transparent via-orange-500/60 to-transparent animate-pulse delay-200" />
            <div className="w-0.5 h-full bg-gradient-to-b from-transparent via-rose-400/60 to-transparent animate-pulse delay-500" />
          </div>
        )}

        {/* WORD RUNNER: Cyber rooftops perspective highway */}
        {game.id === 'runner' && (
          <div className="w-full h-full relative">
            <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-purple-900/40 to-transparent" />
            <div className="absolute bottom-2 left-0 right-0 h-px bg-gradient-to-r from-purple-500/80 via-fuchsia-400 to-transparent animate-pulse" />
          </div>
        )}

        {/* TYPING MEMORY: Floating holographic matrix nodes */}
        {game.id === 'memory' && (
          <div className="w-full h-full relative flex items-center justify-center">
            <div className="w-16 h-16 border border-cyan-400/40 rounded-lg rotate-45 animate-pulse flex items-center justify-center">
              <div className="w-8 h-8 border border-cyan-300/60 rounded-sm" />
            </div>
          </div>
        )}

        {/* BOSS BATTLE: Molten energy core fissure */}
        {game.id === 'boss' && (
          <div className="w-full h-full relative">
            <div className="absolute inset-0 bg-radial from-orange-600/20 via-transparent to-transparent animate-pulse" />
            <div className="absolute bottom-3 left-1/4 right-1/4 h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 blur-xs rounded-full" />
          </div>
        )}
      </div>

      {/* 4. Top Overlay Category & Badge Pills */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-black/80 backdrop-blur-xs border border-white/10 text-white shadow-xs">
          {t(`arcade.${game.id}.badge`) || game.badge}
        </span>
        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-black/75 backdrop-blur-xs text-[var(--text-muted)] border border-white/10">
          {game.categoryLabel}
        </span>
      </div>

      {/* 5. Interactive Light Sweep Shimmer on Card Hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/12 to-transparent -translate-x-full group-hover/thumb:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none" />
    </div>
  );
};

export default AnimatedGameThumbnail;
