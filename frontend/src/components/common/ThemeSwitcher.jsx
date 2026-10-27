import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../i18n/I18nContext';
import { Check, Sparkles, X, ChevronDown, Sun } from 'lucide-react';

export const ThemeSwitcher = ({ compact = false }) => {
  const { theme, setTheme, themes, currentThemeObj } = useTheme();
  const { t } = useI18n();
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
        className={compact 
          ? "p-2 rounded-lg transition-colors cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] relative flex items-center justify-center border border-[var(--border)]"
          : "flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--accent)]/50 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-mono font-medium transition-all cursor-pointer min-h-[38px]"}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={t('themeSwitcher.activeTheme', { name: currentThemeObj.name }, `Current theme: ${currentThemeObj.name}. Click to change theme.`)}
        id="theme-switcher-trigger"
      >
        <span
          className="w-2 h-2 rounded-full shrink-0 shadow-[0_0_6px_currentColor]"
          style={{ backgroundColor: currentThemeObj.accent, color: currentThemeObj.accent }}
          aria-hidden="true"
        />
        <Sun className="w-3.5 h-3.5 text-[var(--text-muted)]" aria-hidden="true" />
        {!compact && (
          <span className="hidden sm:inline text-[11px] font-semibold tracking-wide text-[var(--text-primary)]">
            {currentThemeObj.name}
          </span>
        )}
        <ChevronDown className="w-3 h-3 text-[var(--text-muted)] ml-0.5" />
      </button>

      {/* Flyout Menu / Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:p-0 sm:bg-transparent sm:backdrop-blur-none"
          role="dialog"
          aria-modal="true"
          aria-label={t('themeSwitcher.title', 'Studio Themes Selector')}
        >
          <div className="w-full max-w-md sm:w-96 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-[var(--bg-elevated)] text-[var(--accent)]">
                  <Sparkles className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider font-mono">
                    {t('themeSwitcher.title', 'Studio Palettes')}
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {t('themeSwitcher.choose', '12 custom-crafted color systems')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-md hover:bg-[var(--bg-elevated)] transition-colors"
                aria-label="Close theme selector"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {/* Themes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
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
                    className={`flex items-start gap-2.5 p-2 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'border-[var(--accent)] bg-[var(--bg-elevated)] shadow-xs'
                        : 'border-[var(--border)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-elevated)]/60'
                    }`}
                  >
                    {/* Visual 2-color swatch */}
                    <div
                      className="w-6 h-6 rounded-md shrink-0 flex items-center justify-center border border-white/10 shadow-xs relative overflow-hidden"
                      style={{ backgroundColor: t.bg }}
                    >
                      <div
                        className="w-3 h-3 rounded-full absolute -bottom-0.5 -right-0.5"
                        style={{ backgroundColor: t.accent }}
                      />
                      {isActive && <Check className="w-3 h-3 text-white drop-shadow-sm z-10" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                          {t.name}
                        </span>
                        <span className="text-[9px] px-1 py-0.2 rounded font-mono text-[var(--text-muted)] border border-[var(--border)]">
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

            {/* Footer */}
            <div className="mt-3 pt-2.5 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span>Zero-flash persistent sync</span>
              <span className="font-mono text-[10px] text-[var(--text-secondary)]">localStorage</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
