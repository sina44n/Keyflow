/**
 * KEYFLOW Navbar Component
 * =========================
 * Redesigned Floating Two-Capsule Navigation Bar with Theme-Aware Fluid Icon Hover Animation.
 *
 * Visual Architecture (Phase 7.43):
 * - Capsule 1 (Left & Center): Exact KEYFLOW brand identity + Icon-only navigation bar.
 *   Contains theme-aware fluid hover/active interaction: hovered icon elevates upward
 *   into a circular accent pod with curved surface cradle deformation, smoothly gliding
 *   between icons via Framer Motion spring physics. Zero vertical icon divider lines.
 * - Capsule 2 (Right): Language selector, theme switcher, authenticated profile menu or
 *   login action, and dynamic "Continue ▶" pill button.
 * - Mobile (<md): Responsive floating single capsule with full accessible navigation drawer.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ThemeSwitcher } from './ThemeSwitcher';
import { LanguageSelector } from './LanguageSelector';
import { Button } from './Button';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { usePlatformConfig } from '../../context/PlatformConfigContext';
import { useI18n } from '../../i18n/I18nContext';
import {
  Keyboard,
  GraduationCap,
  Gamepad2,
  Palette,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  BarChart3,
  Trophy,
  ChevronDown,
  Target,
  Sliders,
  Shield,
  Crown,
  Play,
  Loader2,
} from 'lucide-react';
import TelemetryProfileModal from '../telemetry/TelemetryProfileModal';

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileTab, setProfileTab] = useState('profile');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const userMenuRef = useRef(null);

  const shouldReduceMotion = useReducedMotion();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, clerkUser, isAuthenticated, logout } = useAuth();
  const { t } = useI18n();
  const { config } = usePlatformConfig();
  useTheme();

  // Close user menu on outside click or Escape
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [userMenuOpen]);

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
    ...(config?.academy_enabled !== false ? [{ label: t('nav.academy') || 'Academy', href: '/academy', isInternal: true, icon: GraduationCap, primary: true }] : []),
    ...(config?.arcade_enabled !== false ? [{ label: t('nav.arcade') || 'Arcade', href: '/arcade', isInternal: true, icon: Gamepad2, primary: true }] : []),
    { label: t('nav.telemetry') || 'Telemetry', href: '/telemetry', isInternal: true, icon: BarChart3, primary: false },
    ...(config?.leaderboard_enabled !== false ? [{ label: t('nav.leaderboard') || 'Leaderboard', href: '/leaderboard', isInternal: true, icon: Trophy, primary: false }] : []),
    { label: t('nav.themes') || 'Themes', href: '/themes', isInternal: true, icon: Palette, primary: false },
  ];

  // Determine active nav index from current route
  const getActiveIndex = () => {
    return navLinks.findIndex((link) => {
      if (link.href === '/academy') return location.pathname.startsWith('/academy');
      if (link.href === '/arcade') return location.pathname.startsWith('/arcade');
      return location.pathname === link.href;
    });
  };

  const activeIndex = getActiveIndex();
  const highlightedIndex = hoveredIndex !== null ? hoveredIndex : (activeIndex !== -1 ? activeIndex : null);

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
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
      navigate('/login', { replace: true });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full max-w-[100vw] overflow-x-clip px-3 sm:px-6 pt-3 sm:pt-4 pointer-events-none select-none transition-all duration-200">
      {/* Desktop Floating Two-Capsule Layout (md+) */}
      <div className="hidden md:flex w-full max-w-[1380px] mx-auto items-center justify-between gap-3 lg:gap-4 min-w-0">
        {/* Capsule 1: Left Brand Logo + Fluid Icon Navigation (Visibly Wider Proportions) */}
        <div className="pointer-events-auto h-14 px-3.5 sm:px-4 md:px-3.5 lg:px-7 xl:px-8 2xl:px-9 rounded-full bg-[var(--bg-surface)]/85 backdrop-blur-md border border-[var(--border)] shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex items-center gap-4 sm:gap-6 md:gap-4 lg:gap-12 xl:gap-18 2xl:gap-22 transition-colors duration-240 relative shrink-0">
          {/* Brand Logo - Preserves exact existing brand assets */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] rounded-lg py-1 shrink-0"
            aria-label="KEYFLOW Home"
          >
            <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] group-hover:border-[var(--accent)] flex items-center justify-center transition-all duration-260 ease-[cubic-bezier(0.22,1,0.36,1)] relative shrink-0 shadow-[0_0_10px_color-mix(in_srgb,var(--accent)_20%,transparent)]">
              <Keyboard className="w-4 h-4 text-[var(--accent)] transition-transform duration-260 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105" aria-hidden="true" />
              <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_4px_var(--accent)]" />
            </div>
            <div className="flex flex-col shrink-0 justify-center">
              <span className="font-mono text-sm sm:text-base font-extrabold tracking-wider text-[var(--text-primary)] leading-none group-hover:text-[var(--accent)] transition-colors duration-240 ease-[cubic-bezier(0.22,1,0.36,1)] whitespace-nowrap">
                KEY<span className="text-[var(--accent)]">FLOW</span>
              </span>
              <span className="text-[9px] text-[var(--text-muted)] tracking-wider uppercase font-mono mt-0.5 whitespace-nowrap">
                Precision Typing
              </span>
            </div>
          </Link>

          {/* Navigation Icons Only — Refined Spacing & NO SEPARATOR LINES */}
          <nav
            className="flex items-center gap-1.5 sm:gap-2 md:gap-1.5 lg:gap-4 xl:gap-5.5 2xl:gap-6.5 relative"
            onMouseLeave={() => setHoveredIndex(null)}
            aria-label="Main navigation"
          >
            {navLinks.map((link, index) => {
              const Icon = link.icon;
              const isHighlighted = highlightedIndex === index;

              return (
                <button
                  key={link.href}
                  type="button"
                  onClick={() => handleNavClick(link)}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onFocus={() => setHoveredIndex(index)}
                  onBlur={() => setHoveredIndex(null)}
                  className="relative w-10 h-10 flex items-center justify-center rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] transition-colors group"
                  aria-label={link.label}
                  title={link.label}
                >
                  {/* Fluid elevated circular pod with layoutId */}
                  {isHighlighted && (
                    <motion.div
                      layoutId="navbar-fluid-bubble"
                      transition={
                        shouldReduceMotion
                          ? { duration: 0 }
                          : { type: 'spring', stiffness: 380, damping: 28 }
                      }
                      className="absolute -top-2.5 inset-x-0 mx-auto w-10 h-10 pointer-events-none z-0 flex items-center justify-center"
                    >
                      {/* Elevated circular pod */}
                      <div className="w-10 h-10 rounded-full bg-[var(--accent)] text-[var(--accent-fg)] shadow-[0_6px_20px_color-mix(in_srgb,var(--accent)_45%,transparent)] border-2 border-[var(--bg-surface)] flex items-center justify-center" />

                      {/* Fluid surface notch / cradle deformation beneath the raised bubble */}
                      <div className="absolute top-[28px] left-1/2 -translate-x-1/2 w-16 h-3 pointer-events-none overflow-visible">
                        <svg
                          viewBox="0 0 64 12"
                          className="w-full h-full text-[var(--bg-surface)] overflow-visible"
                          fill="none"
                        >
                          <path
                            d="M 0 0 C 14 0, 18 10, 32 10 C 46 10, 50 0, 64 0"
                            fill="currentColor"
                          />
                          <path
                            d="M 0 0 C 14 0, 18 10, 32 10 C 46 10, 50 0, 64 0"
                            stroke="var(--border)"
                            strokeWidth="1.2"
                            fill="none"
                          />
                        </svg>
                      </div>
                    </motion.div>
                  )}

                  {/* Centered Icon with animated lift */}
                  <motion.div
                    animate={{
                      y: isHighlighted && !shouldReduceMotion ? -10 : 0,
                    }}
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { type: 'spring', stiffness: 400, damping: 28 }
                    }
                    className="relative z-10 flex items-center justify-center"
                  >
                    <Icon
                      className={`w-4.5 h-4.5 transition-colors duration-200 ${
                        isHighlighted
                          ? 'text-[var(--accent-fg)]'
                          : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
                      }`}
                      aria-hidden="true"
                    />
                  </motion.div>

                  {/* Accessible Floating Tooltip on hover */}
                  {hoveredIndex === index && (
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-[var(--bg-elevated)] border border-[var(--border)] text-[10px] font-mono font-semibold text-[var(--text-primary)] shadow-md pointer-events-none whitespace-nowrap z-30 animate-in fade-in zoom-in-95 duration-150">
                      {link.label}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Capsule 2: Right Utility Controls (Compact Width) */}
        <div className="pointer-events-auto h-14 px-1.5 sm:px-2 rounded-full bg-[var(--bg-surface)]/85 backdrop-blur-md border border-[var(--border)] shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex items-center gap-1 shrink-0 transition-colors duration-240">
          <LanguageSelector compact={true} />
          <ThemeSwitcher compact={true} />

          {isAuthenticated ? (
            <div className="flex items-center gap-1 shrink-0">
              {/* Authenticated User Menu Dropdown Button */}
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-1 px-1.5 py-1.5 rounded-full bg-transparent hover:bg-[var(--bg-elevated)] border border-transparent text-xs font-mono text-[var(--text-primary)] transition-all duration-240 cursor-pointer shrink-0"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                  aria-label="User profile and settings menu"
                >
                  <div className="w-5 h-5 rounded-full bg-[var(--accent)] text-[var(--accent-fg)] flex items-center justify-center text-[10px] font-bold">
                    {(user?.profile?.display_name || user?.username || 'U')[0].toUpperCase()}
                  </div>
                  <span className="font-semibold max-w-[90px] sm:max-w-[110px] truncate">
                    {user?.profile?.display_name || user?.username || 'Learner'}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-muted)] transition-transform duration-240 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-240 font-mono text-xs backdrop-blur-md">
                    <div className="px-3 py-2 border-b border-[var(--border)] mb-1">
                      <div className="font-bold text-[var(--text-primary)] truncate">
                        {user?.profile?.display_name || user?.username}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] truncate">
                        {user?.email || 'Logged In'}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span className="text-[10px] text-emerald-400 font-semibold">Active Member</span>
                      </div>
                    </div>

                    {/* Profile Navigation Links */}
                    <div className="space-y-0.5">
                      {Boolean(
                        user?.is_owner && (user?.is_super_admin || user?.role === 'SUPER_ADMIN')
                      ) && (
                        <Link
                          to="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors font-medium cursor-pointer"
                        >
                          <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                            <Crown className="w-3.5 h-3.5 text-amber-400" />
                          </div>
                          <span>Super Admin Center</span>
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          setProfileTab('profile');
                          setIsProfileOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
                      >
                        <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                          <UserIcon className="w-3.5 h-3.5 text-[var(--accent)]" />
                        </div>
                        <span>Profile Information</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          setProfileTab('goals');
                          setIsProfileOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
                      >
                        <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                          <Target className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <span>Practice Targets & Goals</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          setProfileTab('accessibility');
                          setIsProfileOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
                      >
                        <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                          <Sliders className="w-3.5 h-3.5 text-amber-400" />
                        </div>
                        <span>Accessibility & Motion</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          setProfileTab('security');
                          setIsProfileOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
                      >
                        <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                          <Shield className="w-3.5 h-3.5 text-sky-400" />
                        </div>
                        <span>Security & Export Data</span>
                      </button>
                    </div>

                    <div className="my-1 border-t border-[var(--border)]" />

                    <div className="space-y-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          navigate('/telemetry');
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
                      >
                        <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                          <BarChart3 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        </div>
                        <span>Telemetry Dashboard</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          navigate('/workstation');
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
                      >
                        <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                          <Keyboard className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        </div>
                        <span>Workstation Studio</span>
                      </button>
                    </div>

                    <div className="my-1 border-t border-[var(--border)]" />

                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer font-semibold disabled:opacity-50"
                    >
                      <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                        {isLoggingOut ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <LogOut className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <span>{isLoggingOut ? 'Signing out...' : t('nav.logout') || 'Sign Out'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Sign Out icon button */}
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="p-1.5 rounded-full border border-[var(--border)] text-[var(--text-muted)] hover:text-red-400 hover:border-red-400/40 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                title={t('nav.logout') || 'Sign Out'}
                aria-label="Sign Out"
              >
                {isLoggingOut ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                ) : (
                  <LogOut className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Continue Pill Button */}
              <button
                type="button"
                onClick={handleContinuePractice}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-fg)] text-xs font-semibold tracking-wide shadow-[0_0_16px_color-mix(in_srgb,var(--accent)_35%,transparent)] transition-all cursor-pointer shrink-0 whitespace-nowrap min-h-[36px]"
              >
                <span className="whitespace-nowrap">{t('nav.continue', 'Continue')}</span>
                <Play className="w-3.5 h-3.5 fill-current shrink-0" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/login')}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-full px-2 py-1.5 shrink-0 whitespace-nowrap border border-transparent"
              >
                {t('nav.signIn') || 'Sign In'}
              </Button>
              <button
                type="button"
                onClick={handleContinuePractice}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-fg)] text-xs font-semibold tracking-wide shadow-[0_0_16px_color-mix(in_srgb,var(--accent)_35%,transparent)] transition-all cursor-pointer shrink-0 whitespace-nowrap min-h-[36px]"
              >
                <span className="whitespace-nowrap">{t('nav.continue', 'Continue')}</span>
                <Play className="w-3.5 h-3.5 fill-current shrink-0" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Floating Capsule Header (<md) */}
      <div className="flex md:hidden max-w-[1380px] mx-auto items-center justify-between pointer-events-auto h-14 px-4 rounded-full bg-[var(--bg-surface)]/90 backdrop-blur-md border border-[var(--border)] shadow-md transition-colors duration-240">
        {/* Brand Logo */}
        <Link
          to="/"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-2 group focus-visible:outline-none rounded-lg py-1 shrink-0"
          aria-label="KEYFLOW Home"
        >
          <div className="w-7 h-7 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center relative shrink-0 shadow-xs">
            <Keyboard className="w-3.5 h-3.5 text-[var(--accent)]" aria-hidden="true" />
            <div className="absolute -bottom-0.5 -right-0.5 w-1 h-1 rounded-full bg-[var(--accent)]" />
          </div>
          <span className="font-mono text-sm font-extrabold tracking-wider text-[var(--text-primary)] leading-none">
            KEY<span className="text-[var(--accent)]">FLOW</span>
          </span>
        </Link>

        {/* Mobile Controls: Language, Theme, Hamburger Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <LanguageSelector compact={true} />
          <ThemeSwitcher compact={true} />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors cursor-pointer"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer (<md) */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)]/95 backdrop-blur-md px-4 py-4 space-y-3 pointer-events-auto shadow-2xl animate-in fade-in duration-200">
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
                  className={`w-full text-left flex items-center gap-2.5 p-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
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
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setProfileTab('profile');
                      setIsProfileOpen(true);
                    }}
                    className="flex items-center gap-2 text-left cursor-pointer hover:text-[var(--accent)] transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-[var(--accent)] shrink-0" />
                    <div>
                      <div className="font-semibold text-[var(--text-primary)]">
                        {user?.profile?.display_name || user?.username}
                      </div>
                      <div className="text-[10px] text-[var(--accent)] font-mono">
                        Profile & Settings →
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="text-xs text-red-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {isLoggingOut ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <LogOut className="w-3.5 h-3.5" />
                    )}
                    <span>{isLoggingOut ? 'Signing out...' : t('nav.logout') || 'Sign Out'}</span>
                  </button>
                </div>
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-fg)] text-sm font-semibold tracking-wide shadow-[0_0_16px_color-mix(in_srgb,var(--accent)_35%,transparent)] transition-all cursor-pointer whitespace-nowrap"
                  onClick={handleContinuePractice}
                >
                  <span className="whitespace-nowrap">{t('nav.continue', 'Continue')}</span>
                  <Play className="w-3.5 h-3.5 fill-current shrink-0" aria-hidden="true" />
                </button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="md"
                  className="w-full justify-center rounded-full"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/login');
                  }}
                >
                  {t('nav.signIn') || 'Sign In'}
                </Button>
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-fg)] text-sm font-semibold tracking-wide shadow-[0_0_16px_color-mix(in_srgb,var(--accent)_35%,transparent)] transition-all cursor-pointer whitespace-nowrap"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleContinuePractice();
                  }}
                >
                  <span className="whitespace-nowrap">{t('nav.continue', 'Continue')}</span>
                  <Play className="w-3.5 h-3.5 fill-current shrink-0" aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Global Authoritative Profile & Settings Modal */}
      {isAuthenticated && (
        <TelemetryProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          initialTab={profileTab}
        />
      )}
    </header>
  );
};
