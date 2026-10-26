import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ThemeSwitcher } from './ThemeSwitcher';
import { Button } from './Button';
import { useTheme } from '../../context/ThemeContext';
import {
  Keyboard,
  BookOpen,
  Gamepad2,
  BarChart3,
  Palette,
  Menu,
  X,
  Info,
  Play,
} from 'lucide-react';

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAuthNotice, setShowAuthNotice] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  useTheme();

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navLinks = [
    { label: 'Workstation', href: '/workstation', isInternal: true, icon: Keyboard },
    { label: 'Academy', href: '/academy', isInternal: true, icon: BookOpen },
    { label: 'Arcade', href: '/#arcade', isInternal: false, icon: Gamepad2 },
    { label: 'Themes', href: '/#themes', isInternal: false, icon: Palette },
    { label: 'Telemetry', href: '/#telemetry', isInternal: false, icon: BarChart3 },
  ];

  const handleNavClick = (link) => {
    setMobileMenuOpen(false);
    if (link.isInternal) {
      navigate(link.href);
    } else if (location.pathname === '/') {
      const targetId = link.href.replace('/#', '');
      const el = document.getElementById(targetId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(link.href);
    }
  };

  const handleContinuePractice = () => {
    setMobileMenuOpen(false);
    // If on academy, dispatch a custom event to start the recommended lesson, or navigate
    if (location.pathname.startsWith('/academy')) {
      window.dispatchEvent(new CustomEvent('keyflow-continue-practice'));
    } else {
      navigate('/academy');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[color-mix(in_srgb,var(--bg-main)_88%,transparent)] border-b border-[var(--border)] transition-colors duration-200">
      <div className="container-app h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] rounded-lg py-1"
          aria-label="KEYFLOW Home"
        >
          <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] group-hover:border-[var(--accent)] flex items-center justify-center transition-all duration-200 relative shrink-0 shadow-[0_0_10px_color-mix(in_srgb,var(--accent)_20%,transparent)]">
            <Keyboard className="w-4 h-4 text-[var(--accent)] transition-transform group-hover:scale-105" aria-hidden="true" />
            <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_4px_var(--accent)]" />
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-sm sm:text-base font-extrabold tracking-wider text-[var(--text-primary)] leading-none group-hover:text-[var(--accent)] transition-colors">
              KEY<span className="text-[var(--accent)]">FLOW</span>
            </span>
            <span className="text-[9px] text-[var(--text-muted)] tracking-widest uppercase font-mono mt-0.5">
              Precision Typing
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5" aria-label="Main navigation">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isAcademy = link.label === 'Academy';
            const isActive = isAcademy
              ? location.pathname.startsWith('/academy')
              : location.pathname === link.href;

            return (
              <button
                key={link.label}
                type="button"
                onClick={() => handleNavClick(link)}
                className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'text-[var(--text-primary)] bg-[var(--bg-elevated)] border border-[color-mix(in_srgb,var(--accent)_40%,transparent)] shadow-[0_0_12px_color-mix(in_srgb,var(--accent)_20%,transparent)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[color-mix(in_srgb,var(--bg-elevated)_60%,transparent)]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 transition-colors ${isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`} aria-hidden="true" />
                <span>{link.label}</span>
                {isActive && (
                  <span className="absolute -bottom-[9px] left-3 right-3 h-[2px] bg-[var(--accent)] shadow-[0_0_8px_var(--accent)] rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Action Stack */}
        <div className="hidden sm:flex items-center gap-2.5">
          <ThemeSwitcher />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAuthNotice(true)}
            className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Sign In
          </Button>
          <button
            type="button"
            onClick={handleContinuePractice}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-fg)] text-xs font-semibold tracking-wide shadow-[0_0_16px_color-mix(in_srgb,var(--accent)_35%,transparent)] transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Continue Practice</span>
          </button>
        </div>

        {/* Mobile Navigation Controls */}
        <div className="flex sm:hidden items-center gap-2">
          <ThemeSwitcher />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-[var(--border)] bg-[var(--bg-surface)] px-4 py-4 space-y-3 animate-in fade-in duration-150">
          <nav className="space-y-1" aria-label="Mobile navigation">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isAcademy = link.label === 'Academy';
              const isActive = isAcademy
                ? location.pathname.startsWith('/academy')
                : location.pathname === link.href;

              return (
                <button
                  key={link.label}
                  type="button"
                  onClick={() => handleNavClick(link)}
                  className={`w-full text-left flex items-center gap-2.5 p-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'text-[var(--accent)] bg-[var(--bg-elevated)] font-semibold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`} aria-hidden="true" />
                  <span>{link.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-[var(--border)] flex flex-col gap-2">
            <Button
              variant="outline"
              size="md"
              className="w-full justify-center"
              onClick={() => {
                setMobileMenuOpen(false);
                setShowAuthNotice(true);
              }}
            >
              Sign In
            </Button>
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-fg)] text-sm font-semibold tracking-wide shadow-[0_0_16px_color-mix(in_srgb,var(--accent)_35%,transparent)] transition-all cursor-pointer"
              onClick={handleContinuePractice}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Continue Practice</span>
            </button>
          </div>
        </div>
      )}

      {/* Auth Notice Modal */}
      {showAuthNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] p-5 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[var(--bg-elevated)] text-[var(--accent)] shrink-0">
                <Info className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[var(--text-primary)]">Knox Authentication System</h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  User accounts and cross-device synchronization will be integrated in Phase 2. All 7 Academy levels and interactive practice modes are fully active and playable right now!
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="primary" size="sm" onClick={() => setShowAuthNotice(false)}>
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
