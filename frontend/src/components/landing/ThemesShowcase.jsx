import React, { useState } from 'react';
import { useTheme, THEMES } from '../../context/ThemeContext';
import { useI18n } from '../../i18n/I18nContext';
import { THEME_ROWS, CARD_ROTATION_PRESETS } from '../../context/themeRows';
import {
  Wine,
  Droplets,
  Leaf,
  Layers,
  Moon,
  Terminal,
  Waves,
  Sparkles,
  TreePine,
  Compass,
  Flame,
  Sun,
  Snowflake,
  BookOpen,
  Mountain,
  Contrast,
  Check,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export { THEME_ROWS, CARD_ROTATION_PRESETS };

/**
 * THEME_ICONS
 * Strict thematic Lucide icons matching each of the 16 studio palettes.
 */
const THEME_ICONS = {
  'burgundy-cream': Wine,
  'glacier-aqua': Droplets,
  'forest-sage': Leaf,
  'midnight-slate': Sun,
  'dark-theme': Moon,
  'dark-charcoal-lime': Terminal,
  'midnight-blue': Waves,
  'lavender-purple': Sparkles,
  'forest-green': Zap,
  'ocean-teal': Compass,
  'sunset-orange': Flame,
  'rose-pink': Sun,
  'arctic-blue': Leaf,
  'solarized-light': BookOpen,
  'warm-sand': Mountain,
  'classic-black-white': Contrast,
};

export const ThemesShowcase = ({ isStandalone = false }) => {
  const { theme, setTheme, currentThemeObj } = useTheme();
  const { t } = useI18n();
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all' | 0 | 1 | 2 | 3

  // Helper to retrieve full theme definition
  const getTheme = (id) => THEMES.find((t) => t.id === id) || THEMES[0];

  // Filter rows if user chooses a specific set, or display all 4 rows
  const visibleRows =
    selectedFilter === 'all' ? THEME_ROWS : [THEME_ROWS[selectedFilter]];

  return (
    <section
      id="themes"
      className={`py-12 sm:py-14 lg:py-16 ${
        isStandalone ? '' : 'border-t border-[var(--border)]'
      } relative bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors duration-300 overflow-hidden`}
    >
      <div className="container-app max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* ================================================================= */}
        {/* TOP HEADER: FIND YOUR FLOW                                        */}
        {/* ================================================================= */}
        <div className="text-center max-w-xl mx-auto select-none">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)] font-sans">
            {t('themes.heading', 'Find Your Flow')}
          </h2>
        </div>

        {/* Minimal Control Bar: Current Active Badge & Filter Tabs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-5xl mx-auto border-b border-[var(--border)] pb-4 text-xs font-mono">
          <div className="flex items-center gap-2.5 text-[var(--text-secondary)]">
            <span
              className="w-3.5 h-3.5 rounded-full shadow-xs shrink-0"
              style={{ backgroundColor: currentThemeObj.accent }}
            />
            <span className="text-[11px] text-[var(--text-muted)]">Current Theme:</span>
            <span className="font-bold text-[var(--text-primary)] font-sans">
              {currentThemeObj.name}
            </span>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] text-[11px] overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-semibold shrink-0 ${
                selectedFilter === 'all'
                  ? 'bg-[var(--text-primary)] text-[var(--bg-main)] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              All Palettes
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter(0)}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-semibold shrink-0 ${
                selectedFilter === 0
                  ? 'bg-[var(--text-primary)] text-[var(--bg-main)] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Masterpiece
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter(1)}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-semibold shrink-0 ${
                selectedFilter === 1
                  ? 'bg-[var(--text-primary)] text-[var(--bg-main)] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Nocturnal
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter(2)}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-semibold shrink-0 ${
                selectedFilter === 2
                  ? 'bg-[var(--text-primary)] text-[var(--bg-main)] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Vibrant
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter(3)}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-semibold shrink-0 ${
                selectedFilter === 3
                  ? 'bg-[var(--text-primary)] text-[var(--bg-main)] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Daylight
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* MAIN CONTENT: DOUBLE-LAYER TILTED CARDS                           */}
        {/* 4 columns on Desktop (>= 1280px), 2 on Tablet, 1 on Mobile        */}
        {/* ================================================================= */}
        <div className="space-y-12">
          {visibleRows.map((row) => (
            <div key={row.rowTitle} className="space-y-6">
              {/* Collection divider and title */}
              {selectedFilter === 'all' && (
                <div className="flex items-center gap-3 max-w-5xl mx-auto px-2">
                  <div className="h-px bg-[var(--border)] flex-1" />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] font-bold">
                    {row.rowTitle}
                  </span>
                  <div className="h-px bg-[var(--border)] flex-1" />
                </div>
              )}

              {/* Responsive Grid: 1 col on mobile, 2 col on tablet (640px-1279px), 4 col on desktop (>=1280px) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8 sm:gap-7 xl:gap-8 max-w-6xl mx-auto items-stretch justify-center">
                {row.cards.map((card, cardIdx) => {
                  const themeItem = getTheme(card.themeId);
                  const isActive = themeItem.id === theme;
                  const rotation =
                    CARD_ROTATION_PRESETS[cardIdx % CARD_ROTATION_PRESETS.length];

                  return (
                    <TiltedThemeCard
                      key={card.themeId}
                      card={card}
                      themeItem={themeItem}
                      isActive={isActive}
                      rotation={rotation}
                      onSelect={() => setTheme(themeItem.id)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom subtle note & practice link */}
        <div className="text-center pt-8 border-t border-[var(--border)] max-w-2xl mx-auto space-y-3">
          <p className="text-xs text-[var(--text-muted)]">
            Instant theme transitions apply site-wide to all typing workstations, virtual keyboards, and analytics.
          </p>
          <div>
            <Link
              to="/practice"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--text-primary)] text-[var(--bg-main)] font-semibold text-xs shadow-md hover:scale-105 active:scale-95 transition-all"
            >
              <span>Test Current Theme in Workstation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * TiltedThemeCard — Exact Double-Layer Reference Architecture
 * ============================================================
 * Reproduces the visual design of Reference Image 2:
 * 1. Layer A (Rear Card): Solid/gradient theme-backing card with rounded corners,
 *    subtle rotation, soft deep dimensional shadow, visible extension around front.
 * 2. Layer B (Front Card): Crisp pure-white card with opposing subtle rotation,
 *    rounded corners, soft elevation shadow.
 * 3. Dashed Inset Border: Distinct 2.5px dashed border matching theme accent.
 * 4. Content Architecture:
 *    - Top: Small uppercase label `OPTION` and large bold condensed number `01`-`16` in theme color.
 *    - Top-right: ACTIVE badge (with checkmark) or category tag.
 *    - Middle: Bold uppercase theme name and concise description.
 *    - Bottom-left: Compact `Select Theme` or `✓ Applied` action button.
 *    - Bottom-right: Circular outlined badge containing the theme-specific icon.
 */
const TiltedThemeCard = ({ card, themeItem, isActive, rotation, onSelect }) => {
  const IconComponent = THEME_ICONS[card.themeId] || Leaf;

  return (
    <div className="relative group w-full max-w-[270px] mx-auto py-5 px-3 select-none">
      {/* =================================================================== */}
      {/* LAYER A — REAR COLORED BACKING CARD                                 */}
      {/* =================================================================== */}
      <div
        className="absolute inset-0 sm:-inset-1 rounded-[26px] transition-all duration-300 ease-out pointer-events-none group-hover:scale-[1.03]"
        style={{
          background: card.backingGradient || card.backingColor,
          transform: `rotate(${rotation.rear}deg)`,
          boxShadow: isActive
            ? `0 24px 44px -8px ${card.backingColor}99, 0 8px 22px -4px rgba(0,0,0,0.38)`
            : `0 18px 36px -8px ${card.backingColor}70, 0 6px 18px -4px rgba(0,0,0,0.22)`,
        }}
        aria-hidden="true"
      />

      {/* =================================================================== */}
      {/* LAYER B — FRONT WHITE INFORMATION CARD                              */}
      {/* =================================================================== */}
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect();
          }
        }}
        aria-pressed={isActive}
        className={`relative z-10 w-full rounded-[20px] bg-white text-neutral-800 p-2.5 sm:p-3 transition-all duration-300 ease-out cursor-pointer shadow-md group-hover:shadow-2xl group-hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40 ${
          isActive ? 'ring-2 ring-neutral-900/50 shadow-xl' : ''
        }`}
        style={{
          transform: `rotate(${rotation.front}deg)`,
        }}
      >
        {/* ================================================================= */}
        {/* INSET DASHED BORDER (Physical Stitched Patch Design)               */}
        {/* ================================================================= */}
        <div
          className="w-full rounded-[15px] border-[2.2px] border-dashed p-3 sm:p-3.5 flex flex-col justify-between"
          style={{
            borderColor: card.dashedColor || themeItem.accent,
            minHeight: '286px',
          }}
        >
          {/* Top Section: OPTION label, Large Bold Number, Active Pill */}
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-neutral-400">
                  OPTION
                </span>
                <span
                  className="text-3xl sm:text-[36px] font-black tracking-tight leading-none mt-0.5 font-sans"
                  style={{ color: card.dashedColor || themeItem.accent }}
                >
                  {card.num}
                </span>
              </div>

              {isActive ? (
                <span
                  className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase flex items-center gap-1 shadow-xs text-white shrink-0 mt-0.5"
                  style={{ backgroundColor: card.backingColor }}
                >
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                  <span>ACTIVE</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider font-semibold bg-neutral-100 text-neutral-500 shrink-0 mt-0.5">
                  {card.tag}
                </span>
              )}
            </div>

            {/* Middle Section: Theme Title and Description */}
            <div className="mt-4 text-left">
              <h4 className="text-xs sm:text-[13px] font-extrabold uppercase tracking-wider text-neutral-900 line-clamp-1 font-sans">
                {themeItem.name}
              </h4>
              <p className="text-[10.5px] leading-relaxed text-neutral-500 font-sans line-clamp-3 mt-1.5">
                {themeItem.subtitle}
              </p>
            </div>
          </div>

          {/* Bottom Section: Action Button (Left) & Circular Icon Badge (Right) */}
          <div className="flex items-center justify-between gap-2 pt-3 mt-auto">
            <span
              className={`inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider transition-all ${
                isActive
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-700 group-hover:bg-neutral-900 group-hover:text-white'
              }`}
            >
              {isActive && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              <span>{isActive ? 'Applied' : 'Select Theme'}</span>
            </span>

            {/* Circular Outlined Theme Icon Badge (Positioned Lower-Right) */}
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-[2.2px] flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 bg-white shadow-xs"
              style={{ borderColor: card.dashedColor || themeItem.accent }}
              title={themeItem.name}
            >
              <IconComponent
                className="w-4 h-4 sm:w-[18px] sm:h-[18px] stroke-[2.4]"
                style={{ color: card.dashedColor || themeItem.accent }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemesShowcase;
