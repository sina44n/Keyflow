import React, { useState } from 'react';
import { useTheme, THEMES } from '../../context/ThemeContext';
import { useI18n } from '../../i18n/I18nContext';
import { Check, Sparkles, SlidersHorizontal, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * ThemesShowcase — Exact Reference Image Redesign
 * ===============================================
 * Faithfully reproduces the attached visual reference:
 * - Soft, light grey / off-white background with subtle radial depth
 * - Small centered heading and subtle uppercase subtitle at top
 * - Four prominent vertical cards arranged horizontally on desktop
 * - Each card consists of a white, vertically oriented rounded rectangle
 * - Behind every white card: a colorful, rotated offset backing shape (Orange, Pink, Cyan, Blue)
 * - Layered floating drop shadows giving tactile depth
 * - Complete, uncompromised support for all 16 KEYFLOW themes (4 balanced rows of 4)
 * - Real zero-flash theme switching, active state indicators, and localStorage persistence
 */

// Four distinct reference accent colors for each 4-card row
const REFERENCE_BACKING_COLORS = [
  '#FF6B00', // Reference Card 1: Vibrant Orange
  '#E91E63', // Reference Card 2: Vivid Pink / Magenta
  '#00C0FA', // Reference Card 3: Crisp Sky Blue / Cyan
  '#0066FF', // Reference Card 4: Royal / Cobalt Blue
];

// 16 Themes mapped across 4 rows of 4 cards
const THEME_ROWS = [
  // Row 1: Premier Masterpiece & Flagships (Exact Reference Colors: Orange, Pink, Cyan, Blue)
  {
    rowTitle: 'Masterpiece Architectures',
    cards: [
      { num: '01', themeId: 'burgundy-cream', backingColor: '#FF6B00', tag: 'Masterpiece' },
      { num: '02', themeId: 'espresso-latte', backingColor: '#E91E63', tag: 'Artisan' },
      { num: '03', themeId: 'forest-sage', backingColor: '#00C0FA', tag: 'Botanical' },
      { num: '04', themeId: 'midnight-slate', backingColor: '#0066FF', tag: 'Industrial' },
    ],
  },
  // Row 2: Artisan & Nocturnal Studios
  {
    rowTitle: 'Nocturnal & Signature Studios',
    cards: [
      { num: '05', themeId: 'dark-charcoal-lime', backingColor: '#10B981', tag: 'High-Contrast' },
      { num: '06', themeId: 'dark-theme', backingColor: '#FF1744', tag: 'Signature' },
      { num: '07', themeId: 'midnight-blue', backingColor: '#0EA5E9', tag: 'Oceanic' },
      { num: '08', themeId: 'lavender-purple', backingColor: '#8B5CF6', tag: 'Aesthetic' },
    ],
  },
  // Row 3: Vibrant & Calm Studios
  {
    rowTitle: 'Vibrant & Natural Palettes',
    cards: [
      { num: '09', themeId: 'forest-green', backingColor: '#059669', tag: 'Botanical' },
      { num: '10', themeId: 'ocean-teal', backingColor: '#0D9488', tag: 'Vibrant' },
      { num: '11', themeId: 'sunset-orange', backingColor: '#F97316', tag: 'Energetic' },
      { num: '12', themeId: 'rose-pink', backingColor: '#EC4899', tag: 'Neon' },
    ],
  },
  // Row 4: Cool, Minimalist & Daylight Systems
  {
    rowTitle: 'Cool, Daylight & Minimalist Systems',
    cards: [
      { num: '13', themeId: 'arctic-blue', backingColor: '#06B6D4', tag: 'Sub-Zero' },
      { num: '14', themeId: 'solarized-light', backingColor: '#2563EB', tag: 'Daytime' },
      { num: '15', themeId: 'warm-sand', backingColor: '#D97706', tag: 'Natural' },
      { num: '16', themeId: 'classic-black-white', backingColor: '#475569', tag: 'Monochrome' },
    ],
  },
];

export const ThemesShowcase = () => {
  const { theme, setTheme, currentThemeObj } = useTheme();
  const { t } = useI18n();
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all' | 0 | 1 | 2 | 3

  // Helper to retrieve full theme definition
  const getTheme = (id) => THEMES.find((t) => t.id === id) || THEMES[0];

  // Filter rows if user chooses a specific set, or display all 4 rows
  const visibleRows = selectedFilter === 'all'
    ? THEME_ROWS
    : [THEME_ROWS[selectedFilter]];

  return (
    <section
      id="themes"
      className="py-16 sm:py-20 lg:py-24 border-t border-[var(--border)] relative bg-[#ECEEF2] dark:bg-[#12171F] transition-colors duration-200 overflow-hidden"
    >
      <div className="container-app max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* ================================================================= */}
        {/* TOP HEADER: EXACT REFERENCE TYPOGRAPHY                            */}
        {/* ================================================================= */}
        <div className="text-center max-w-xl mx-auto space-y-1 select-none">
          <h2 className="text-xs sm:text-sm font-bold tracking-[0.22em] uppercase text-gray-800 dark:text-gray-200">
            {t('themes.header', 'MODERN BUSINESS')}
          </h2>
          <p className="text-[10px] sm:text-[11px] font-semibold tracking-[0.28em] uppercase text-gray-400 dark:text-gray-500">
            {t('themes.subheader', 'STEP INFOGRAPHIC')}
          </p>
        </div>

        {/* Minimal Control Bar: Current Active Badge & Filter Tabs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-5xl mx-auto border-b border-gray-300/60 dark:border-gray-800 pb-4 text-xs font-mono">
          <div className="flex items-center gap-2.5 text-gray-700 dark:text-gray-300">
            <span
              className="w-3.5 h-3.5 rounded-full shadow-xs shrink-0"
              style={{ backgroundColor: currentThemeObj.accent }}
            />
            <span className="text-[11px] text-gray-500 dark:text-gray-400">Current Theme:</span>
            <span className="font-bold text-gray-900 dark:text-white font-sans">{currentThemeObj.name}</span>
            <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500">
              {currentThemeObj.tag}
            </span>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/70 dark:bg-gray-800/80 border border-gray-200/80 dark:border-gray-700 text-[11px]">
            <button
              type="button"
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-semibold ${
                selectedFilter === 'all'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              All 16 Palettes
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter(0)}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-semibold ${
                selectedFilter === 0
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              Masterpiece (Row 1)
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter(1)}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-semibold ${
                selectedFilter === 1
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              Nocturnal (Row 2)
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter(2)}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-semibold ${
                selectedFilter === 2
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              Vibrant (Row 3)
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter(3)}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-semibold ${
                selectedFilter === 3
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              Daylight (Row 4)
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* MAIN CONTENT: FOUR-CARD HORIZONTAL COMPOSITIONS                   */}
        {/* ================================================================= */}
        <div className="space-y-16">
          {visibleRows.map((row, rowIdx) => (
            <div key={row.rowTitle} className="space-y-6">
              {/* Optional subtle row subtitle when viewing all rows */}
              {selectedFilter === 'all' && (
                <div className="flex items-center gap-2 max-w-5xl mx-auto px-2">
                  <div className="h-px bg-gray-300 dark:bg-gray-800 flex-1" />
                  <span className="text-[11px] font-mono uppercase tracking-widest text-gray-400 dark:text-gray-500">
                    {row.rowTitle}
                  </span>
                  <div className="h-px bg-gray-300 dark:bg-gray-800 flex-1" />
                </div>
              )}

              {/* Four prominent cards arranged horizontally on desktop */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-6 lg:gap-7 max-w-5xl mx-auto items-center justify-center">
                {row.cards.map((card, cardIndex) => {
                  const themeItem = getTheme(card.themeId);
                  const isActive = themeItem.id === theme;

                  return (
                    <TiltedThemeCard
                      key={card.themeId}
                      card={card}
                      themeItem={themeItem}
                      isActive={isActive}
                      onSelect={() => setTheme(themeItem.id)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom subtle note & practice link */}
        <div className="text-center pt-8 border-t border-gray-300/60 dark:border-gray-800/80 max-w-2xl mx-auto space-y-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Instant theme transitions apply site-wide to all typing workstations, virtual keyboards, and analytics.
          </p>
          <div>
            <Link
              to="/practice"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-semibold text-xs shadow-md hover:scale-105 active:scale-95 transition-all"
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
 * TiltedThemeCard
 * 
 * Recreates the exact visual appearance of the reference card:
 * 1. Colorful rotated backing shape (rotated counter-clockwise ~ -6deg)
 * 2. Pure white rounded foreground card (rotated clockwise ~ +1.5deg)
 * 3. Step/Theme index, large number, title, option/tag, description, and selection indicator
 */
const TiltedThemeCard = ({ card, themeItem, isActive, onSelect }) => {
  return (
    <div className="relative group w-full max-w-[250px] mx-auto py-5 select-none">
      {/* 1. COLORFUL ROTATED BACKING SHAPE */}
      <div
        className="absolute inset-x-2 inset-y-4 rounded-[32px] transition-transform duration-300 ease-out pointer-events-none group-hover:scale-[1.04]"
        style={{
          backgroundColor: card.backingColor,
          transform: 'rotate(-6deg)',
          boxShadow: `0 20px 35px -8px ${card.backingColor}66, 0 8px 16px -4px rgba(0,0,0,0.12)`,
        }}
        aria-hidden="true"
      />

      {/* 2. PURE WHITE FOREGROUND ROUNDED RECTANGLE */}
      <button
        type="button"
        onClick={onSelect}
        role="button"
        aria-pressed={isActive}
        className={`relative z-10 w-full rounded-[28px] bg-white text-gray-800 p-6 flex flex-col items-center text-center transition-all duration-300 ease-out cursor-pointer shadow-xl hover:shadow-2xl group-hover:translate-y-[-4px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-black/20 ${
          isActive ? 'ring-3 ring-black/40 shadow-2xl' : ''
        }`}
        style={{
          transform: 'rotate(1.5deg)',
          minHeight: '390px',
        }}
      >
        {/* Active Pill / Indicator */}
        {isActive && (
          <div
            className="absolute top-3.5 right-4 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold flex items-center gap-1 shadow-xs"
            style={{
              backgroundColor: card.backingColor,
              color: '#FFFFFF',
            }}
          >
            <Check className="w-2.5 h-2.5 stroke-[3]" />
            <span>ACTIVE</span>
          </div>
        )}

        {/* Top: STEP / THEME label */}
        <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-gray-400 font-semibold pt-2">
          STEP
        </span>

        {/* Large Bold Number (01, 02, 03, 04...) */}
        <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-800 font-sans my-1">
          {card.num}
        </span>

        {/* YOUR TEXT HERE / Theme Name */}
        <h4 className="text-xs sm:text-[13px] font-bold uppercase tracking-wider text-gray-800 line-clamp-1 mt-1">
          {themeItem.name}
        </h4>

        {/* Subtle Horizontal Divider */}
        <div className="w-12 h-[1.5px] bg-gray-200 my-3 rounded-full" />

        {/* OPTION A / Theme Category Tag */}
        <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500 font-bold mb-1">
          {card.tag}
        </span>

        {/* Short Subtitle / Subtext */}
        <span className="text-[10px] font-semibold tracking-wider uppercase text-gray-400 mb-3">
          KEYFLOW STUDIO
        </span>

        {/* Palette Color Swatch Circles */}
        <div className="flex items-center justify-center gap-1.5 mb-4">
          {[
            { label: 'Accent', color: themeItem.accent },
            { label: 'Surface', color: themeItem.surface },
            { label: 'Border', color: themeItem.border },
            { label: 'Background', color: themeItem.bg },
          ].map((swatch) => (
            <div
              key={swatch.label}
              className="w-4 h-4 rounded-full border border-black/10 shadow-xs"
              style={{ backgroundColor: swatch.color }}
              title={`${swatch.label}: ${swatch.color}`}
            />
          ))}
        </div>

        {/* Description: Matching reference's sample text block */}
        <p className="text-[10px] leading-relaxed text-gray-400 font-sans line-clamp-3 px-1 mt-auto">
          {themeItem.subtitle}
        </p>

        {/* Bottom Selection Action Button */}
        <div className="w-full pt-3 mt-3 border-t border-gray-100">
          <span
            className={`inline-block w-full py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-colors ${
              isActive
                ? 'bg-gray-900 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
            }`}
          >
            {isActive ? 'Applied' : 'Select Theme'}
          </span>
        </div>
      </button>
    </div>
  );
};

export default ThemesShowcase;
