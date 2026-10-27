/**
 * KEYFLOW Language Selector Dropdown
 * ===================================
 * Accessible dropdown menu to switch languages on the fly.
 * Highlights current selection and displays native language labels.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { Globe, Check, ChevronDown } from 'lucide-react';

export const LanguageSelector = ({ compact = false }) => {
  const { language, setLanguage, supportedLanguages, currentLanguageConfig } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--accent)] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
        aria-label="Select language"
        aria-expanded={isOpen}
      >
        <Globe className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        <span className="font-semibold uppercase tracking-wider">{currentLanguageConfig.code}</span>
        {!compact && (
          <span className="hidden lg:inline text-[11px] text-[var(--text-muted)] truncate max-w-[80px]">
            {currentLanguageConfig.nativeName}
          </span>
        )}
        <ChevronDown className={`w-3 h-3 text-[var(--text-muted)] transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 max-h-80 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-1.5 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2.5 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border)] mb-1">
            Languages ({supportedLanguages.length})
          </div>
          <div className="space-y-0.5">
            {supportedLanguages.map((lang) => {
              const isSelected = lang.code === language;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-sans transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] text-[var(--text-primary)] font-semibold'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase font-bold text-[var(--text-muted)] w-5">
                      {lang.code}
                    </span>
                    <span>{lang.nativeName}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">({lang.name})</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[var(--accent)]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
