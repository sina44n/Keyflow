import React from 'react';
import { useTheme, THEMES } from '../../context/ThemeContext';
import { Palette, Check, Sparkles } from 'lucide-react';

export const ThemesShowcase = () => {
  const { theme, setTheme, currentThemeObj } = useTheme();

  return (
    <section id="themes" className="py-20 border-t border-[var(--border)] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--accent)] font-mono">
            <Palette className="w-3.5 h-3.5" />
            <span>12 Studio Color Architectures</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Tailored for Every Typist's Eye
          </h2>
          <p className="text-sm sm:text-base text-[var(--text-secondary)]">
            Click any palette below to instantly transform KEYFLOW's interface. Every token,
            virtual keycap, and metric graph recalibrates in real time.
          </p>
        </div>

        {/* 12 Themes Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {THEMES.map((t) => {
            const isActive = t.id === theme;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                className={`text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between h-44 relative group ${
                  isActive
                    ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/40 shadow-lg'
                    : 'border-[var(--border)] hover:border-[var(--text-muted)] hover:scale-[1.02]'
                }`}
                style={{ backgroundColor: t.bg }}
              >
                {/* Active check indicator */}
                {isActive && (
                  <div
                    className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm"
                    style={{ backgroundColor: t.accent, color: t.bg }}
                  >
                    <Check className="w-3 h-3" />
                    <span>Active</span>
                  </div>
                )}

                {/* Color Palette Preview Swatches */}
                <div className="flex items-center gap-1.5 pt-1">
                  <div
                    className="w-6 h-6 rounded-md border border-white/20 shadow-xs"
                    style={{ backgroundColor: t.accent }}
                    title={`Accent: ${t.accent}`}
                  />
                  <div
                    className="w-6 h-6 rounded-md border border-white/20 shadow-xs"
                    style={{ backgroundColor: t.surface }}
                    title={`Surface: ${t.surface}`}
                  />
                  <div
                    className="w-6 h-6 rounded-md border border-white/20 shadow-xs"
                    style={{ backgroundColor: t.border }}
                    title={`Border: ${t.border}`}
                  />
                </div>

                {/* Theme Name & Metadata */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span
                      className="font-bold text-sm truncate"
                      style={{ color: t.mode === 'light' ? '#1c1917' : '#f5f5f4' }}
                    >
                      {t.name}
                    </span>
                    <span
                      className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-md border"
                      style={{
                        borderColor: t.mode === 'light' ? '#d6d3d1' : '#44403c',
                        color: t.mode === 'light' ? '#78716c' : '#a8a29e',
                      }}
                    >
                      {t.tag}
                    </span>
                  </div>
                  <p
                    className="text-[11px] line-clamp-2 leading-tight"
                    style={{ color: t.mode === 'light' ? '#57534e' : '#a8a29e' }}
                  >
                    {t.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Dynamic theme stats banner */}
        <div className="mt-10 p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--accent)]" />
            <span className="text-[var(--text-secondary)]">Currently displaying:</span>
            <span className="font-bold font-mono text-[var(--accent)]">{currentThemeObj.name}</span>
            <span className="text-[var(--text-muted)] font-mono">({currentThemeObj.id})</span>
          </div>
          <span className="text-[var(--text-muted)] font-mono">
            Stored in localStorage: 'keyflow-theme'
          </span>
        </div>
      </div>
    </section>
  );
};
