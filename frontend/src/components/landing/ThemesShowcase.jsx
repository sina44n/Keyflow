import React from 'react';
import { useTheme, THEMES } from '../../context/ThemeContext';
import { Palette, Check, Sparkles } from 'lucide-react';

export const ThemesShowcase = () => {
  const { theme, setTheme, currentThemeObj } = useTheme();

  return (
    <section id="themes" className="section-spacing border-t border-[var(--border)] relative bg-[var(--bg-main)]">
      <div className="container-app space-y-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--accent)] font-mono">
            <Palette className="w-3.5 h-3.5" aria-hidden="true" />
            <span>12 Studio Color Architectures</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Tailored for Every Typist's Eye
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            Select any palette below to instantly re-theme KEYFLOW's interface. Every token, virtual keycap, and metric graph transitions with zero flash.
          </p>
        </div>

        {/* 12 Themes Responsive Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" role="region" aria-label="Theme selection gallery">
          {THEMES.map((t) => {
            const isActive = t.id === theme;
            const isLight = t.mode === 'light';

            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                aria-pressed={isActive}
                className={`text-left p-4 rounded-xl border transition-all duration-150 cursor-pointer flex flex-col justify-between min-h-[148px] relative group ${
                  isActive
                    ? 'ring-2 ring-[var(--accent)] shadow-md translate-y-[-2px]'
                    : 'hover:translate-y-[-2px] hover:shadow-sm'
                }`}
                style={{
                  backgroundColor: t.bg,
                  borderColor: isActive ? t.accent : t.border,
                }}
              >
                {/* Active check pill */}
                {isActive && (
                  <div
                    className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 shadow-xs"
                    style={{ backgroundColor: t.accent, color: t.bg }}
                  >
                    <Check className="w-3 h-3" />
                    <span>Active</span>
                  </div>
                )}

                {/* 4-Color Palette Swatch Bar */}
                <div className="flex items-center gap-1.5 pt-0.5">
                  <div
                    className="w-5 h-5 rounded-md border border-black/10 shadow-xs"
                    style={{ backgroundColor: t.accent }}
                    title={`Accent: ${t.accent}`}
                  />
                  <div
                    className="w-5 h-5 rounded-md border border-white/10 shadow-xs"
                    style={{ backgroundColor: t.surface }}
                    title={`Surface: ${t.surface}`}
                  />
                  <div
                    className="w-5 h-5 rounded-md border border-white/10 shadow-xs"
                    style={{ backgroundColor: t.border }}
                    title={`Border: ${t.border}`}
                  />
                  <div
                    className="w-5 h-5 rounded-md border border-black/10 shadow-xs"
                    style={{ backgroundColor: t.bg }}
                    title={`Background: ${t.bg}`}
                  />
                </div>

                {/* Theme Name & Metadata */}
                <div className="space-y-1 pt-3">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className="font-bold text-sm truncate"
                      style={{ color: isLight ? '#1c1917' : '#f5f5f4' }}
                    >
                      {t.name}
                    </span>
                    <span
                      className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded-md border"
                      style={{
                        borderColor: isLight ? '#d6d3d1' : '#3f3f46',
                        color: isLight ? '#78716c' : '#a1a1aa',
                      }}
                    >
                      {t.tag}
                    </span>
                  </div>
                  <p
                    className="text-[11px] line-clamp-2 leading-relaxed"
                    style={{ color: isLight ? '#57534e' : '#a1a1aa' }}
                  >
                    {t.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Dynamic Theme Banner */}
        <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--accent)] shrink-0" aria-hidden="true" />
            <span className="text-[var(--text-secondary)]">Active Palette:</span>
            <span className="font-bold font-mono text-[var(--accent)]">{currentThemeObj.name}</span>
            <span className="text-[var(--text-muted)] font-mono text-[11px]">({currentThemeObj.id})</span>
          </div>
          <span className="text-[11px] text-[var(--text-muted)] font-mono">
            Synced automatically to localStorage: 'keyflow-theme'
          </span>
        </div>
      </div>
    </section>
  );
};
