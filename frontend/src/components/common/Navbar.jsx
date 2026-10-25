import React, { useState } from 'react';
import { ThemeSwitcher } from './ThemeSwitcher';
import { Button } from './Button';
import {
  Keyboard,
  BookOpen,
  Zap,
  Gamepad2,
  BarChart3,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Academy', href: '#curriculum', icon: BookOpen, badge: '7 Levels' },
    { label: 'Practice', href: '#practice', icon: Zap },
    { label: 'Arcade', href: '#arcade', icon: Gamepad2, badge: '3 Games' },
    { label: 'Telemetry', href: '#telemetry', icon: BarChart3 },
    { label: 'Themes', href: '#themes', icon: Sparkles, badge: '12' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[var(--bg-main)]/85 border-b border-[var(--border)] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] group-hover:border-[var(--accent)] flex items-center justify-center transition-all duration-200 shadow-xs relative">
            <Keyboard className="w-5 h-5 text-[var(--accent)] transition-transform group-hover:scale-110" />
            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-base font-extrabold tracking-wider text-[var(--text-primary)] leading-none group-hover:text-[var(--accent)] transition-colors">
              KEY<span className="text-[var(--accent)]">FLOW</span>
            </span>
            <span className="text-[10px] text-[var(--text-muted)] tracking-widest uppercase font-mono mt-0.5">
              Less looking. More flowing.
            </span>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.label}
                href={link.href}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all"
              >
                <Icon className="w-3.5 h-3.5 opacity-70" />
                <span>{link.label}</span>
                {link.badge && (
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)]">
                    {link.badge}
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        {/* Right Action Stack: Theme Switcher + Auth CTA */}
        <div className="hidden sm:flex items-center gap-2.5">
          <ThemeSwitcher />
          <Button variant="ghost" size="sm" onClick={() => alert('Authentication will be connected in Phase 2!')}>
            Sign In
          </Button>
          <Button variant="primary" size="sm" onClick={() => {
            const el = document.getElementById('sandbox');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}>
            Start Typing
          </Button>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex sm:hidden items-center gap-2">
          <ThemeSwitcher />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-[var(--border)] bg-[var(--bg-surface)] px-4 py-4 space-y-3">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-2 rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-[var(--accent)]" />
                    <span>{link.label}</span>
                  </div>
                  {link.badge && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)]">
                      {link.badge}
                    </span>
                  )}
                </a>
              );
            })}
          </div>

          <div className="pt-3 border-t border-[var(--border)] flex flex-col gap-2">
            <Button
              variant="outline"
              size="md"
              className="w-full justify-center"
              onClick={() => alert('Authentication will be connected in Phase 2!')}
            >
              Sign In
            </Button>
            <Button
              variant="primary"
              size="md"
              className="w-full justify-center"
              onClick={() => {
                setMobileMenuOpen(false);
                const el = document.getElementById('sandbox');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Start Free Typing
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};
