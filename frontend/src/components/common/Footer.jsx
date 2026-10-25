import React from 'react';
import { Keyboard, Terminal } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const CURRENT_YEAR = new Date().getFullYear();

export const Footer = () => {
  const { currentThemeObj } = useTheme();

  return (
    <footer className="w-full bg-[var(--bg-surface)] border-t border-[var(--border)] transition-colors duration-200 mt-16 sm:mt-24">
      {/* Keyboard Shortcuts Strip */}
      <div className="border-b border-[var(--border)] bg-[var(--bg-elevated)]/40 py-2.5">
        <div className="container-app flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" aria-hidden="true" />
            <span className="font-semibold text-[var(--text-secondary)] text-[11px]">Shortcuts:</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 font-mono text-[11px]">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--key-bg)] border border-[var(--key-border)] text-[var(--key-text)] text-[10px] shadow-xs">
                Tab + Enter
              </kbd>
              <span>Restart Sprint</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--key-bg)] border border-[var(--key-border)] text-[var(--key-text)] text-[10px] shadow-xs">
                Esc
              </kbd>
              <span>Reset</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--ui-success)] animate-pulse" aria-hidden="true" />
            <span className="text-[11px] font-mono text-[var(--text-secondary)]">
              API v1.0.0 Online
            </span>
          </div>
        </div>
      </div>

      {/* Main Footer Directory */}
      <div className="container-app py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <a href="#" className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] rounded-lg py-1">
              <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center shadow-xs">
                <Keyboard className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
              </div>
              <span className="font-mono text-base font-extrabold tracking-wider text-[var(--text-primary)]">
                KEY<span className="text-[var(--accent)]">FLOW</span>
              </span>
            </a>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-sm">
              The premier typing academy and telemetry platform engineered to rewire neuromuscular memory, eradicate glance habits, and build effortless typing velocity.
            </p>

            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[11px] font-mono text-[var(--text-muted)]">
              <span
                className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                style={{ backgroundColor: currentThemeObj.accent }}
                aria-hidden="true"
              />
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
              <li><a href="#curriculum" className="hover:text-[var(--accent)] transition-colors">Level 1: Home Row</a></li>
              <li><a href="#curriculum" className="hover:text-[var(--accent)] transition-colors">Level 2: Top Row</a></li>
              <li><a href="#curriculum" className="hover:text-[var(--accent)] transition-colors">Level 3: Bottom Row</a></li>
              <li><a href="#curriculum" className="hover:text-[var(--accent)] transition-colors">Level 4: Shift & Punctuation</a></li>
              <li><a href="#curriculum" className="hover:text-[var(--accent)] transition-colors">Level 5: Numbers & Symbols</a></li>
              <li><a href="#curriculum" className="hover:text-[var(--accent)] transition-colors">Level 6: Programmer Syntax</a></li>
              <li><a href="#curriculum" className="hover:text-[var(--accent)] transition-colors">Level 7: Speed Endurance</a></li>
            </ul>
          </div>

          {/* Column 2: Arcade & Modes */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-[var(--text-primary)]">
              Arcade & Modes
            </h4>
            <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
              <li><a href="#arcade" className="hover:text-[var(--accent)] transition-colors">Key Cascade</a></li>
              <li><a href="#arcade" className="hover:text-[var(--accent)] transition-colors">Speed Sprint</a></li>
              <li><a href="#arcade" className="hover:text-[var(--accent)] transition-colors">Word Hunter</a></li>
              <li><a href="#sandbox" className="hover:text-[var(--accent)] transition-colors">Live Typing Sandbox</a></li>
              <li><a href="#telemetry" className="hover:text-[var(--accent)] transition-colors">Biomechanical Telemetry</a></li>
              <li><a href="#themes" className="hover:text-[var(--accent)] transition-colors">12 Studio Themes</a></li>
            </ul>
          </div>

          {/* Column 3: Architecture */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-[var(--text-primary)]">
              Architecture
            </h4>
            <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
              <li><span>React 19 + Vite 8</span></li>
              <li><span>Tailwind CSS v4</span></li>
              <li><span>Django REST Framework</span></li>
              <li><span>PostgreSQL Relational DB</span></li>
              <li><span>Knox Multi-Device Auth</span></li>
              <li><span>Pure CSS Token Engine</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-muted)]">
          <p>© {CURRENT_YEAR} KEYFLOW. All rights reserved. Built for typists, engineers, and writers.</p>
          <div className="flex items-center gap-5 text-[11px]">
            <a href="#curriculum" className="hover:text-[var(--text-primary)] transition-colors">Academy Syllabus</a>
            <a href="#themes" className="hover:text-[var(--text-primary)] transition-colors">Themes</a>
            <a href="#telemetry" className="hover:text-[var(--text-primary)] transition-colors">Telemetry</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
