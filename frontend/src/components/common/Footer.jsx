import React from 'react';
import { Keyboard, Terminal, Sparkles } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const CURRENT_YEAR = new Date().getFullYear();

export const Footer = () => {
  const { currentThemeObj } = useTheme();

  return (
    <footer className="w-full bg-[var(--bg-surface)] border-t border-[var(--border)] transition-colors duration-200 mt-20">
      {/* Keyboard Shortcuts Strip */}
      <div className="border-b border-[var(--border)] bg-[var(--bg-elevated)]/40 py-3 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[var(--accent)]" />
            <span className="font-semibold text-[var(--text-secondary)]">Keyboard Shortcuts:</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 font-mono text-[11px]">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--key-bg)] border border-[var(--key-border)] text-[var(--key-text)] text-[10px] shadow-xs">
                Tab + Enter
              </kbd>
              <span>Restart Test</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--key-bg)] border border-[var(--key-border)] text-[var(--key-text)] text-[10px] shadow-xs">
                Esc
              </kbd>
              <span>Pause / Reset</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--key-bg)] border border-[var(--key-border)] text-[var(--key-text)] text-[10px] shadow-xs">
                Ctrl + T
              </kbd>
              <span>Cycle Themes</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono text-[var(--text-secondary)]">
              API v1.0.0 Online
            </span>
          </div>
        </div>
      </div>

      {/* Main Footer Directory */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center">
                <Keyboard className="w-4 h-4 text-[var(--accent)]" />
              </div>
              <span className="font-mono text-base font-extrabold tracking-wider text-[var(--text-primary)]">
                KEY<span className="text-[var(--accent)]">FLOW</span>
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-sm">
              The premier typing academy and telemetry platform engineered to rewire motor memory,
              eradicate glance dependency, and build effortless typing velocity.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[11px] font-mono text-[var(--text-muted)]">
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Theme:</span>
              <span className="text-[var(--text-primary)] font-semibold">{currentThemeObj.name}</span>
            </div>
          </div>

          {/* Column 1: Curriculum */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-[var(--text-primary)]">
              Academy
            </h4>
            <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
              <li><a href="#curriculum" className="hover:text-[var(--accent)]">Level 1: Home Row</a></li>
              <li><a href="#curriculum" className="hover:text-[var(--accent)]">Level 2: Top Row</a></li>
              <li><a href="#curriculum" className="hover:text-[var(--accent)]">Level 3: Bottom Row</a></li>
              <li><a href="#curriculum" className="hover:text-[var(--accent)]">Level 4: Shift & Punctuation</a></li>
              <li><a href="#curriculum" className="hover:text-[var(--accent)]">Level 5: Numbers & Symbols</a></li>
              <li><a href="#curriculum" className="hover:text-[var(--accent)]">Level 6: Programmer Syntax</a></li>
              <li><a href="#curriculum" className="hover:text-[var(--accent)]">Level 7: Speed Endurance</a></li>
            </ul>
          </div>

          {/* Column 2: Arcade & Modes */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-[var(--text-primary)]">
              Arcade & Modes
            </h4>
            <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
              <li><a href="#arcade" className="hover:text-[var(--accent)]">Key Cascade</a></li>
              <li><a href="#arcade" className="hover:text-[var(--accent)]">Speed Sprint</a></li>
              <li><a href="#arcade" className="hover:text-[var(--accent)]">Word Hunter</a></li>
              <li><a href="#practice" className="hover:text-[var(--accent)]">Timed Speed Tests</a></li>
              <li><a href="#practice" className="hover:text-[var(--accent)]">Custom Quotes</a></li>
              <li><a href="#practice" className="hover:text-[var(--accent)]">Blind Typing Mode</a></li>
            </ul>
          </div>

          {/* Column 3: Architecture & Stack */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-[var(--text-primary)]">
              Architecture
            </h4>
            <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
              <li><span className="hover:text-[var(--accent)]">React 19 + Vite</span></li>
              <li><span className="hover:text-[var(--accent)]">Tailwind CSS v4</span></li>
              <li><span className="hover:text-[var(--accent)]">Django REST Framework</span></li>
              <li><span className="hover:text-[var(--accent)]">PostgreSQL Relational DB</span></li>
              <li><span className="hover:text-[var(--accent)]">Knox Multi-Device Auth</span></li>
              <li><span className="hover:text-[var(--accent)]">12 Dynamic Themes</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-muted)]">
          <p>© {CURRENT_YEAR} KEYFLOW. All rights reserved. Built for typists, coders, and writers.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-[var(--text-primary)]">Privacy Policy</a>
            <a href="#" className="hover:text-[var(--text-primary)]">Terms of Service</a>
            <a href="#" className="hover:text-[var(--text-primary)]">Accessibility (WCAG AAA)</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
