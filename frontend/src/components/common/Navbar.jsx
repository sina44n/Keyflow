/**
 * KEYFLOW Navbar Component
 * =========================
 * Responsive navigation bar with brand wordmark, routing, language selector,
 * theme switcher, and dynamic authentication actions (Log In / Get Started or User Profile / Sign Out).
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ThemeSwitcher } from './ThemeSwitcher';
import { LanguageSelector } from './LanguageSelector';
import { Button } from './Button';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n/I18nContext';
import {
  Keyboard,
  BookOpen,
  Gamepad2,
  Palette,
  Menu,
  X,
  Play,
  User as UserIcon,
  LogOut,
  Sparkles,
  BarChart3,
} from 'lucide-react';

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useI18n();
  useTheme();

  // Close mobile menu on resize to desktop (md: 768px)
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
    { label: t('nav.workstation') || 'Workstation', href: '/workstation', isInternal: true, icon: Keyboard, primary: true },
    { label: t('nav.academy') || 'Academy', href: '/academy', isInternal: true, icon: BookOpen, primary: true },
    { label: t('nav.arcade') || 'Arcade', href: '/arcade', isInternal: true, icon: Gamepad2, primary: true },
    { label: t('nav.telemetry') || 'Telemetry', href: '/telemetry', isInternal: true, icon: BarChart3, primary: false },
    { label: t('nav.features') || 'Features', href: '/#features', isInternal: false, icon: Sparkles, primary: false },
    { label: t('nav.themes') || 'Themes', href: '/#themes', isInternal: false, icon: Palette, primary: false },
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
    if (location.pathname.startsWith('/academy')) {
      window.dispatchEvent(new CustomEvent('keyflow-continue-practice'));
    } else {
      navigate('/academy');
    }
  };

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[color-mix(in_srgb,var(--bg-main)_90%,transparent)] border-b border-[var(--border)] transition-colors duration-200">
      <div className="container-app h-16 flex items-center justify-between gap-2 lg:gap-4">
        {/* Brand Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] rounded-lg py-1 shrink-0"
          aria-label="KEYFLOW Home"
        >
          <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] group-hover:border-[var(--accent)] flex items-center justify-center transition-all duration-200 relative shrink-0 shadow-[0_0_10px_color-mix(in_srgb,var(--accent)_20%,transparent)]">
            <Keyboard className="w-4 h-4 text-[var(--accent)] transition-transform group-hover:scale-105" aria-hidden="true" />
            <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_4px_var(--accent)]" />
          </div>
          <div className="flex flex-col shrink-0 justify-center">
            <span className="font-mono text-sm sm:text-base font-extrabold tracking-wider text-[var(--text-primary)] leading-none group-hover:text-[var(--accent)] transition-colors whitespace-nowrap">
              KEY<span className="text-[var(--accent)]">FLOW</span>
            </span>
            <span className="text-[9px] text-[var(--text-muted)] tracking-wider uppercase font-mono mt-0.5 whitespace-nowrap">
              Precision Typing
            </span>
          </div>
        </Link>

        {/* Navigation Links — Core links visible on md+, secondary on xl+ */}
        <nav className="hidden md:flex items-center gap-1 xl:gap-1.5 shrink-0" aria-label="Main navigation">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isAcademy = link.href === '/academy';
            const isArcade = link.href === '/arcade';
            const isActive = isAcademy
              ? location.pathname.startsWith('/academy')
              : isArcade
              ? location.pathname.startsWith('/arcade')
              : location.pathname === link.href;

            const visibilityClass = link.primary ? 'flex' : 'hidden lg:flex';

            return (
              <button
                key={link.href}
                type="button"
                onClick={() => handleNavClick(link)}
                className={`relative ${visibilityClass} items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-all duration-150 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'text-[var(--text-primary)] bg-[var(--bg-elevated)] border border-[color-mix(in_srgb,var(--accent)_40%,transparent)] shadow-[0_0_12px_color-mix(in_srgb,var(--accent)_20%,transparent)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[color-mix(in_srgb,var(--bg-elevated)_60%,transparent)]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 transition-colors ${isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`} aria-hidden="true" />
                <span className="whitespace-nowrap">{link.label}</span>
                {isActive && (
                  <span className="absolute -bottom-[9px] left-3 right-3 h-[2px] bg-[var(--accent)] shadow-[0_0_8px_var(--accent)] rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Action Stack */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <LanguageSelector compact={true} />
          <ThemeSwitcher compact={true} />

          {isAuthenticated ? (
            <div className="flex items-center gap-2 pl-2 border-l border-[var(--border)] shrink-0">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-xs font-mono text-[var(--text-primary)] shrink-0">
                <UserIcon className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                <span className="font-semibold max-w-[100px] truncate">
                  {user?.profile?.display_name || user?.username || 'Learner'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-red-400 hover:border-red-400/40 transition-colors cursor-pointer shrink-0"
                title={t('nav.logout') || 'Sign Out'}
                aria-label="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleContinuePractice}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-fg)] text-xs font-semibold tracking-wide shadow-[0_0_16px_color-mix(in_srgb,var(--accent)_35%,transparent)] transition-all cursor-pointer shrink-0 whitespace-nowrap"
              >
                <Play className="w-3 h-3 fill-current shrink-0" />
                <span className="whitespace-nowrap">{t('nav.continuePractice') || 'Continue Practice'}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-2 border-l border-[var(--border)] shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/login')}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] shrink-0 whitespace-nowrap"
              >
                {t('nav.signIn') || 'Log In'}
              </Button>
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-fg)] text-xs font-semibold tracking-wide shadow-[0_0_16px_color-mix(in_srgb,var(--accent)_35%,transparent)] transition-all cursor-pointer shrink-0 whitespace-nowrap"
              >
                <span className="whitespace-nowrap">{t('nav.getStarted') || 'Get Started'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Navigation Controls (<md) */}
        <div className="flex md:hidden items-center gap-1.5 sm:gap-2 shrink-0">
          <LanguageSelector compact={true} />
          <ThemeSwitcher compact={true} />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors cursor-pointer"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer (<md) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[var(--border)] bg-[var(--bg-surface)] px-4 py-4 space-y-3 animate-in fade-in duration-150">
          <nav className="space-y-1" aria-label="Mobile navigation">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isAcademy = link.href === '/academy';
              const isArcade = link.href === '/arcade';
              const isActive = isAcademy
                ? location.pathname.startsWith('/academy')
                : isArcade
                ? location.pathname.startsWith('/arcade')
                : location.pathname === link.href;

              return (
                <button
                  key={link.href}
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
            {isAuthenticated ? (
              <>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-elevated)] text-sm">
                  <span className="font-semibold text-[var(--text-primary)]">
                    {user?.profile?.display_name || user?.username}
                  </span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-xs text-red-400 hover:underline flex items-center gap-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t('nav.logout') || 'Sign Out'}</span>
                  </button>
                </div>
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-fg)] text-sm font-semibold tracking-wide shadow-[0_0_16px_color-mix(in_srgb,var(--accent)_35%,transparent)] transition-all cursor-pointer whitespace-nowrap"
                  onClick={handleContinuePractice}
                >
                  <Play className="w-4 h-4 fill-current shrink-0" />
                  <span className="whitespace-nowrap">{t('nav.continuePractice') || 'Continue Practice'}</span>
                </button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="md"
                  className="w-full justify-center"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/login');
                  }}
                >
                  {t('nav.signIn') || 'Log In'}
                </Button>
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-fg)] text-sm font-semibold tracking-wide shadow-[0_0_16px_color-mix(in_srgb,var(--accent)_35%,transparent)] transition-all cursor-pointer"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/register');
                  }}
                >
                  <span>{t('nav.getStarted') || 'Get Started'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
