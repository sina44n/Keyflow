import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Palette, Check, Sparkles, X } from 'lucide-react';

export const ThemeSwitcher = () => {
  const { theme, setTheme, themes, currentThemeObj } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close on escape or outside click
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-medium transition-all duration-150 cursor-pointer"
        aria-expanded={isOpen}
        aria-label="Select Theme"
        id="theme-switcher-trigger"
      >
        <span
          className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0 shadow-xs"
          style={{ backgroundColor: currentThemeObj.accent }}
        />
        <span className="hidden sm:inline font-mono text-[11px] uppercase tracking-wider text-[var(--text-primary)]">
          {currentThemeObj.name}
        </span>
        <Palette className="w-3.5 h-3.5 opacity-70" />
      </button>

      {/* Modal / Flyout Menu */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs sm:absolute sm:inset-auto sm:right-0 sm:mt-2 sm:p-0 sm:bg-transparent sm:backdrop-blur-none"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg sm:w-96 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-[var(--bg-elevated)] text-[var(--accent)]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Studio Themes</h3>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    12 custom-crafted color palettes
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-md hover:bg-[var(--bg-elevated)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Themes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
              {themes.map((t) => {
                const isActive = t.id === theme;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setTheme(t.id);
                      setIsOpen(false);
                    }}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'border-[var(--accent)] bg-[var(--bg-elevated)] shadow-xs'
                        : 'border-[var(--border)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-elevated)]/50'
                    }`}
                  >
                    {/* Visual Color Pill Stack */}
                    <div
                      className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center border border-white/10 shadow-xs relative overflow-hidden"
                      style={{ backgroundColor: t.bg }}
                    >
                      <div
                        className="w-3.5 h-3.5 rounded-full absolute -bottom-1 -right-1"
                        style={{ backgroundColor: t.accent }}
                      />
                      {isActive && <Check className="w-3.5 h-3.5 text-white drop-shadow-sm z-10" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                          {t.name}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full uppercase tracking-wider font-mono text-[var(--text-muted)] border border-[var(--border)]">
                          {t.tag}
                        </span>
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">
                        {t.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Footer */}
            <div className="mt-3 pt-2.5 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span>Saved automatically</span>
              <span className="font-mono text-[10px] text-[var(--text-secondary)]">data-theme</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
