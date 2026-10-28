import React, { useState } from 'react';
import { useTheme, THEMES } from '../../context/ThemeContext';
import { useI18n } from '../../i18n/I18nContext';
import {
  Palette,
  Check,
  Sparkles,
  ArrowRight,
  Keyboard,
  Info,
} from 'lucide-react';

import { Link } from 'react-router-dom';

/**
 * ThemesShowcase — Connected Geometric Theme Gallery
 * =================================================
 * Faithful reproduction of the reference infographic layout:
 * - Light, soft, modern elevated backdrop with subtle depth
 * - Connected geometric layout with white rounded rectangular panels
 * - Thick white conduit tubing linking the cards with 90° rounded corners
 * - Vibrant colored square accents placed at network junctions
 * - Hollow wireframe square rings decorating perimeters
 * - Large colored numeric badges ('01', '02', '03'...) in signature theme accents
 * - Full support for all 16 KEYFLOW color systems with zero-flash switching
 */
export const ThemesShowcase = () => {
  const { theme, setTheme, currentThemeObj } = useTheme();
  const { t } = useI18n();
  const [activeCategory, setActiveCategory] = useState('all'); // 'all' | 'artisan' | 'nocturnal' | 'radiant'

  // Partition themes across the connected geometric clusters
  // 1. Primary Masterpiece Cluster (Exact 1:1 constellation of Image 2)
  const cluster1 = [
    { num: '01', themeId: 'burgundy-cream', accentColor: '#9E2A2B' },
    { num: '02', themeId: 'espresso-latte', accentColor: '#C48A5A' },
    { num: '03', themeId: 'forest-sage', accentColor: '#6B9071' },
    { num: '05', themeId: 'midnight-slate', accentColor: '#9BA8AB' }, // Center large
    { num: '04', themeId: 'dark-charcoal-lime', accentColor: '#C8F36A' },
    { num: '06', themeId: 'dark-theme', accentColor: '#FF1744' }, // Secondary mid-left
    { num: '07', themeId: 'midnight-blue', accentColor: '#38BDF8' }, // Secondary lower-left
  ];

  // 2. Nocturnal & Cyberpunk Studio Cluster
  const cluster2 = [
    { num: '08', themeId: 'lavender-purple', accentColor: '#C084FC' },
    { num: '09', themeId: 'forest-green', accentColor: '#4ADE80' },
    { num: '10', themeId: 'ocean-teal', accentColor: '#2DD4BF' },
    { num: '11', themeId: 'sunset-orange', accentColor: '#FB923C' },
    { num: '12', themeId: 'rose-pink', accentColor: '#F472B6' },
  ];

  // 3. Radiant, Cool & Minimalist Cluster
  const cluster3 = [
    { num: '13', themeId: 'arctic-blue', accentColor: '#67E8F9' },
    { num: '14', themeId: 'solarized-light', accentColor: '#268BD2' },
    { num: '15', themeId: 'warm-sand', accentColor: '#D97706' },
    { num: '16', themeId: 'classic-black-white', accentColor: '#FFFFFF' },
  ];

  // Helper to find full theme object
  const getTheme = (id) => THEMES.find((t) => t.id === id) || THEMES[0];

  return (
    <section id="themes" className="section-spacing border-t border-[var(--border)] relative bg-[var(--bg-main)]">
      <div className="container-app space-y-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--accent)] font-mono shadow-xs">
            <Palette className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t('themes.badge', `${THEMES.length} Studio Color Architectures`)}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
            {t('themes.title', "Tailored for Every Typist's Eye")}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            {t('themes.subtitle', "Select any palette below to instantly re-theme KEYFLOW's interface. Every token, virtual keycap, and metric graph transitions with zero flash.")}
          </p>
        </div>

        {/* Live Active Theme Studio Sandbox & Controls */}
        <div className="p-4 sm:p-6 rounded-3xl bg-[var(--bg-elevated)] border border-[var(--border)] shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
            <div className="flex items-center gap-3">
              <span
                className="w-4 h-4 rounded-full shadow-[0_0_12px_currentColor]"
                style={{ backgroundColor: currentThemeObj.accent, color: currentThemeObj.accent }}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm sm:text-base text-[var(--text-primary)]">
                    {currentThemeObj.name}
                  </span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md border border-[var(--border)] text-[var(--text-muted)] bg-[var(--bg-surface)]">
                    {currentThemeObj.tag}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  {currentThemeObj.subtitle}
                </p>
              </div>
            </div>

            {/* Quick Filter / Jump Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] text-xs font-mono">
              {[
                { id: 'all', label: `All Systems (${THEMES.length})` },
                { id: 'artisan', label: 'Masterpiece (7)' },
                { id: 'nocturnal', label: 'Nocturnal (5)' },
                { id: 'radiant', label: 'Radiant (4)' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCategory(tab.id)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-semibold ${
                    activeCategory === tab.id
                      ? 'bg-[var(--accent)] text-[var(--accent-fg)] shadow-xs'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Live Typing Token Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center pt-1">
            <div className="lg:col-span-8 p-3.5 sm:p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                  <Keyboard className="w-3.5 h-3.5 text-[var(--accent)]" />
                  Live Virtual Keycaps & Typography Tokens
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {['Q', 'W', 'E', 'R', 'T', 'Y', 'SPACE'].map((key) => (
                    <span
                      key={key}
                      className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold shadow-xs border"
                      style={{
                        backgroundColor: key === 'E' ? currentThemeObj.accent : 'var(--key-bg)',
                        color: key === 'E' ? 'var(--accent-fg)' : 'var(--key-text)',
                        borderColor: key === 'E' ? currentThemeObj.accent : 'var(--key-border)',
                      }}
                    >
                      {key}
                    </span>
                  ))}
                  <span className="text-xs font-mono text-[var(--text-muted)] ml-2">
                    <span className="text-[var(--typing-correct)]">deliberate</span>{' '}
                    <span className="text-[var(--typing-caret)] underline">f</span>
                    <span className="text-[var(--text-muted)]">low</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <Link
                  to="/practice"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--accent)] text-[var(--accent-fg)] font-bold text-xs shadow-xs hover:brightness-105 transition-all"
                >
                  <span>Test in Workstation</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Active Theme Hex Swatches */}
            <div className="lg:col-span-4 p-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Active Palette Hexes</span>
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--text-secondary)]">
                  <span>{currentThemeObj.accent}</span>
                  <span>•</span>
                  <span>{currentThemeObj.bg}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {[
                  { label: 'Accent', color: currentThemeObj.accent },
                  { label: 'Surface', color: currentThemeObj.surface },
                  { label: 'Border', color: currentThemeObj.border },
                  { label: 'Background', color: currentThemeObj.bg },
                ].map((swatch) => (
                  <div
                    key={swatch.label}
                    className="w-5 h-5 rounded-md border border-black/10 shadow-xs"
                    style={{ backgroundColor: swatch.color }}
                    title={`${swatch.label}: ${swatch.color}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CLUSTER 1: PRIMARY MASTERPIECE CONSTELLATION (EXACT 1:1 MATCH OF IMAGE 2) */}
        {/* ========================================================================= */}
        {(activeCategory === 'all' || activeCategory === 'artisan') && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider pl-2">
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Masterpiece & Artisan Constellation (Exact Reference Geometry)</span>
            </div>

            <div className="relative w-full rounded-3xl p-4 sm:p-8 bg-[#dfe4ea] dark:bg-[#1a222d] border border-white/60 dark:border-white/10 shadow-inner overflow-hidden select-none transition-colors duration-200">
              {/* DESKTOP CONNECTED INFOGRAPHIC CANVAS (Exact layout of Image 2) */}
              <div className="relative w-full max-w-[1020px] mx-auto aspect-[1/0.95] hidden lg:block">
                {/* SVG LAYER: Connected White Conduit Tubing & Hollow Wireframe Square Rings */}
                <svg
                  viewBox="0 0 1000 950"
                  className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-sm z-0"
                  aria-hidden="true"
                >
                  <defs>
                    {/* Realistic soft drop shadow filter for conduits */}
                    <filter id="conduitGlow" x="-10%" y="-10%" width="130%" height="130%">
                      <feDropShadow dx="0" dy="6" stdDeviation="6" floodOpacity="0.14" floodColor="#000000" />
                      <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.08" floodColor="#000000" />
                    </filter>
                  </defs>

                  {/* 1. Hollow White Wireframe Rings with Rounded Corners (Matching Image 2) */}
                  <g stroke="#ffffff" strokeWidth="4.5" fill="none" filter="url(#conduitGlow)">
                    {/* Ring 1: Far top-left */}
                    <rect x="75" y="170" width="120" height="120" rx="18" />
                    {/* Ring 2: Far mid-left */}
                    <rect x="15" y="485" width="120" height="120" rx="18" />
                    {/* Ring 3: Top-right */}
                    <rect x="830" y="190" width="90" height="90" rx="16" />
                    {/* Ring 4: Mid-right */}
                    <rect x="805" y="420" width="85" height="85" rx="16" />
                    {/* Ring 5: Bottom-center */}
                    <rect x="340" y="810" width="125" height="125" rx="20" />
                    {/* Ring 6: Lower-mid-right */}
                    <rect x="620" y="875" width="70" height="70" rx="14" />
                    {/* Ring 7: Far bottom-right */}
                    <rect x="875" y="855" width="90" height="90" rx="18" />
                  </g>

                  {/* 2. White Conduit Pipes (15px thick white tracks with smooth 90° rounded corners) */}
                  <g
                    stroke="#ffffff"
                    strokeWidth="15"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    filter="url(#conduitGlow)"
                  >
                    {/* Pipe A: Top-left path connecting Accent 1 into Card 01 and Card 02 */}
                    <path d="M 335 155 L 430 155 M 335 155 L 335 240 L 275 240" />

                    {/* Pipe B: Top-right path connecting Accent 3 to Card 02 and down to Card 03 */}
                    <path d="M 610 135 L 750 135 L 750 240" />
                    <path d="M 750 135 L 820 135" />

                    {/* Pipe C: Central Hub connecting Card 01, Center Crimson Accent 2, Card 02, and Card 03 */}
                    <path d="M 390 355 L 460 355 L 460 465" />
                    <path d="M 505 240 L 505 330" />
                    <path d="M 460 355 L 635 355" />

                    {/* Pipe D: Left Branch down through Accent 4 and Accent 5 into Secondary A and B */}
                    <path d="M 215 470 L 118 470 L 118 678 L 238 678" />
                    <path d="M 178 715 L 178 795 L 238 795" />

                    {/* Pipe E: Right Branch connecting Card 03 through Accent 6 into Card 04 */}
                    <path d="M 700 460 L 700 652 L 750 652 L 750 715" />

                    {/* Pipe F: Bottom Hub connecting Card 05 through Accent 7 into Card 04 and Secondary B */}
                    <path d="M 518 720 L 570 720 L 570 790 L 650 790" />
                    <path d="M 570 790 L 398 790" />
                  </g>
                </svg>

                {/* 3. SOLID COLORED ACCENT SQUARES (Interactive, matching Image 2 placement) */}
                {/* Accent 1: Top Blue */}
                <button
                  type="button"
                  onClick={() => setTheme('midnight-blue')}
                  className="absolute z-10 rounded-2xl shadow-lg border-2 border-white/80 cursor-pointer transition-transform hover:scale-105 active:scale-95"
                  style={{
                    left: '290px',
                    top: '110px',
                    width: '95px',
                    height: '95px',
                    backgroundColor: '#0284c7',
                  }}
                  title="Activate Midnight Blue Accent"
                />

                {/* Accent 2: Center Crimson / Magenta */}
                <button
                  type="button"
                  onClick={() => setTheme('burgundy-cream')}
                  className="absolute z-10 rounded-2xl shadow-xl border-2 border-white/80 cursor-pointer transition-transform hover:scale-105 active:scale-95"
                  style={{
                    left: '400px',
                    top: '335px',
                    width: '120px',
                    height: '120px',
                    backgroundColor: '#e11d48',
                  }}
                  title="Activate Burgundy & Cream Accent"
                />

                {/* Accent 3: Top-Right Teal */}
                <button
                  type="button"
                  onClick={() => setTheme('ocean-teal')}
                  className="absolute z-10 rounded-2xl shadow-md border-2 border-white/80 cursor-pointer transition-transform hover:scale-105 active:scale-95"
                  style={{
                    left: '780px',
                    top: '90px',
                    width: '85px',
                    height: '85px',
                    backgroundColor: '#0d9488',
                  }}
                  title="Activate Ocean Teal Accent"
                />

                {/* Accent 4: Mid-Left Cyan */}
                <button
                  type="button"
                  onClick={() => setTheme('arctic-blue')}
                  className="absolute z-10 rounded-2xl shadow-md border-2 border-white/80 cursor-pointer transition-transform hover:scale-105 active:scale-95"
                  style={{
                    left: '75px',
                    top: '465px',
                    width: '85px',
                    height: '85px',
                    backgroundColor: '#06b6d4',
                  }}
                  title="Activate Arctic Blue Accent"
                />

                {/* Accent 5: Lower-Left Violet */}
                <button
                  type="button"
                  onClick={() => setTheme('lavender-purple')}
                  className="absolute z-10 rounded-2xl shadow-lg border-2 border-white/80 cursor-pointer transition-transform hover:scale-105 active:scale-95"
                  style={{
                    left: '130px',
                    top: '630px',
                    width: '95px',
                    height: '95px',
                    backgroundColor: '#8b5cf6',
                  }}
                  title="Activate Lavender Purple Accent"
                />

                {/* Accent 6: Mid-Right Sky Blue */}
                <button
                  type="button"
                  onClick={() => setTheme('midnight-blue')}
                  className="absolute z-10 rounded-2xl shadow-lg border-2 border-white/80 cursor-pointer transition-transform hover:scale-105 active:scale-95"
                  style={{
                    left: '655px',
                    top: '605px',
                    width: '95px',
                    height: '95px',
                    backgroundColor: '#38bdf8',
                  }}
                  title="Activate Sky Blue Accent"
                />

                {/* Accent 7: Bottom Orange / Coral */}
                <button
                  type="button"
                  onClick={() => setTheme('sunset-orange')}
                  className="absolute z-10 rounded-2xl shadow-xl border-2 border-white/80 cursor-pointer transition-transform hover:scale-105 active:scale-95"
                  style={{
                    left: '510px',
                    top: '730px',
                    width: '120px',
                    height: '120px',
                    backgroundColor: '#f97316',
                  }}
                  title="Activate Sunset Orange Accent"
                />

                {/* 4. REAL WHITE CONTENT CARDS WITH ELEVATED DROP SHADOWS */}
                {/* CARD 01: Top-Left (Burgundy & Cream) */}
                <ThemeInfographicCard
                  item={cluster1[0]}
                  themeItem={getTheme(cluster1[0].themeId)}
                  currentTheme={theme}
                  onSelect={setTheme}
                  style={{
                    left: '160px',
                    top: '240px',
                    width: '235px',
                    height: '235px',
                  }}
                />

                {/* CARD 02: Top-Center (Espresso & Latte) */}
                <ThemeInfographicCard
                  item={cluster1[1]}
                  themeItem={getTheme(cluster1[1].themeId)}
                  currentTheme={theme}
                  onSelect={setTheme}
                  style={{
                    left: '400px',
                    top: '30px',
                    width: '215px',
                    height: '215px',
                  }}
                />

                {/* CARD 03: Top-Right (Forest Sage) */}
                <ThemeInfographicCard
                  item={cluster1[2]}
                  themeItem={getTheme(cluster1[2].themeId)}
                  currentTheme={theme}
                  onSelect={setTheme}
                  style={{
                    left: '635px',
                    top: '240px',
                    width: '225px',
                    height: '225px',
                  }}
                />

                {/* CARD 05: Center-Large (Midnight Slate) */}
                <ThemeInfographicCard
                  item={cluster1[3]}
                  themeItem={getTheme(cluster1[3].themeId)}
                  currentTheme={theme}
                  onSelect={setTheme}
                  isLarge
                  style={{
                    left: '390px',
                    top: '465px',
                    width: '260px',
                    height: '260px',
                  }}
                />

                {/* CARD 04: Bottom-Right (Charcoal Lime) */}
                <ThemeInfographicCard
                  item={cluster1[4]}
                  themeItem={getTheme(cluster1[4].themeId)}
                  currentTheme={theme}
                  onSelect={setTheme}
                  style={{
                    left: '650px',
                    top: '715px',
                    width: '205px',
                    height: '205px',
                  }}
                />

                {/* SECONDARY CARD A: Mid-Left (Dark Theme) */}
                <ThemeInfographicCard
                  item={cluster1[5]}
                  themeItem={getTheme(cluster1[5].themeId)}
                  currentTheme={theme}
                  onSelect={setTheme}
                  isCompact
                  style={{
                    left: '225px',
                    top: '480px',
                    width: '160px',
                    height: '160px',
                  }}
                />

                {/* SECONDARY CARD B: Lower-Left (Midnight Ocean) */}
                <ThemeInfographicCard
                  item={cluster1[6]}
                  themeItem={getTheme(cluster1[6].themeId)}
                  currentTheme={theme}
                  onSelect={setTheme}
                  isCompact
                  style={{
                    left: '238px',
                    top: '715px',
                    width: '160px',
                    height: '160px',
                  }}
                />
              </div>

              {/* MOBILE & TABLET FALLBACK FOR CLUSTER 1 */}
              <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                {cluster1.map((item) => (
                  <MobileThemeCard
                    key={item.themeId}
                    item={item}
                    themeItem={getTheme(item.themeId)}
                    currentTheme={theme}
                    onSelect={setTheme}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CLUSTER 2: NOCTURNAL & CYBERPUNK STUDIO CONSTELLATION                     */}
        {/* ========================================================================= */}
        {(activeCategory === 'all' || activeCategory === 'nocturnal') && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider pl-2">
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Nocturnal & Cyberpunk Studio Cluster (Themes 08 – 12)</span>
            </div>

            <div className="relative w-full rounded-3xl p-4 sm:p-6 bg-[#dfe4ea] dark:bg-[#1a222d] border border-white/60 dark:border-white/10 shadow-inner overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {cluster2.map((item) => (
                  <MobileThemeCard
                    key={item.themeId}
                    item={item}
                    themeItem={getTheme(item.themeId)}
                    currentTheme={theme}
                    onSelect={setTheme}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CLUSTER 3: RADIANT, COOL & MINIMALIST CONSTELLATION                       */}
        {/* ========================================================================= */}
        {(activeCategory === 'all' || activeCategory === 'radiant') && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider pl-2">
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Radiant, Cool & Minimalist Cluster (Themes 13 – 16)</span>
            </div>

            <div className="relative w-full rounded-3xl p-4 sm:p-6 bg-[#dfe4ea] dark:bg-[#1a222d] border border-white/60 dark:border-white/10 shadow-inner overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {cluster3.map((item) => (
                  <MobileThemeCard
                    key={item.themeId}
                    item={item}
                    themeItem={getTheme(item.themeId)}
                    currentTheme={theme}
                    onSelect={setTheme}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Synced Guarantee Notice */}
        <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <Info className="w-4 h-4 text-[var(--accent)] shrink-0" />
            <span>
              All 16 studio themes maintain zero-flash transitions and adhere to WCAG AAA/AA legibility standards.
            </span>
          </div>
          <span className="text-[11px] text-[var(--text-muted)]">
            Instant persistence via localStorage: 'keyflow-theme'
          </span>
        </div>
      </div>
    </section>
  );
};

/**
 * Desktop Connected Infographic Theme Card
 * Matches the white rounded panels, bold colored numbers, and clean typography of Image 2.
 */
const ThemeInfographicCard = ({
  item,
  themeItem,
  currentTheme,
  onSelect,
  isLarge = false,
  isCompact = false,
  style = {},
}) => {
  const isActive = themeItem.id === currentTheme;

  return (
    <button
      type="button"
      onClick={() => onSelect(themeItem.id)}
      role="button"
      aria-pressed={isActive}
      className={`absolute z-20 rounded-3xl p-4 sm:p-5 flex flex-col justify-between text-left cursor-pointer transition-all duration-200 group bg-white dark:bg-[#0f1724] border border-white/90 dark:border-white/10 ${
        isActive
          ? 'ring-4 ring-[var(--accent)] shadow-2xl scale-[1.03]'
          : 'shadow-xl hover:shadow-2xl hover:scale-[1.02]'
      }`}
      style={{
        ...style,
        boxShadow: isActive
          ? '0 24px 48px -12px rgba(0,0,0,0.25), 0 8px 16px -4px rgba(0,0,0,0.1)'
          : '0 16px 36px -8px rgba(0,0,0,0.15), 0 6px 12px -3px rgba(0,0,0,0.06)',
      }}
    >
      {/* Top Header: Bold Colored Number & Tag */}
      <div className="flex items-start justify-between gap-1 w-full">
        <span
          className="font-mono font-extrabold tracking-tight"
          style={{
            color: item.accentColor,
            fontSize: isLarge ? '26px' : isCompact ? '18px' : '22px',
          }}
        >
          {item.num}
        </span>

        {isActive ? (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold shadow-xs"
            style={{
              backgroundColor: themeItem.accent,
              color: 'var(--accent-fg)',
            }}
          >
            <Check className="w-2.5 h-2.5" />
            <span>Active</span>
          </span>
        ) : (
          <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
            {themeItem.tag}
          </span>
        )}
      </div>

      {/* Middle Body: Theme Name & Subtitle */}
      <div className="space-y-1 w-full my-auto">
        <h4
          className="font-bold text-gray-900 dark:text-gray-100 truncate tracking-tight"
          style={{ fontSize: isLarge ? '15px' : isCompact ? '12px' : '13.5px' }}
        >
          {themeItem.name}
        </h4>
        <p
          className="text-gray-500 dark:text-gray-400 leading-snug line-clamp-2"
          style={{ fontSize: isLarge ? '11px' : isCompact ? '9.5px' : '10.5px' }}
        >
          {themeItem.subtitle}
        </p>
      </div>

      {/* Bottom Swatch Bar */}
      <div className="flex items-center justify-between gap-1 pt-1 border-t border-gray-100 dark:border-gray-800 w-full">
        <div className="flex items-center gap-1">
          {[
            { label: 'Accent', color: themeItem.accent },
            { label: 'Surface', color: themeItem.surface },
            { label: 'Border', color: themeItem.border },
            { label: 'Background', color: themeItem.bg },
          ].map((swatch) => (
            <div
              key={swatch.label}
              className="rounded-md border border-black/10 shadow-xs"
              style={{
                backgroundColor: swatch.color,
                width: isCompact ? '13px' : '17px',
                height: isCompact ? '13px' : '17px',
              }}
              title={`${swatch.label}: ${swatch.color}`}
            />
          ))}
        </div>

        <span className="text-[9px] font-mono text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors">
          {isActive ? 'Applied' : 'Select'}
        </span>
      </div>
    </button>
  );
};

/**
 * Mobile / Responsive Theme Card
 */
const MobileThemeCard = ({ item, themeItem, currentTheme, onSelect }) => {
  const isActive = themeItem.id === currentTheme;

  return (
    <button
      type="button"
      onClick={() => onSelect(themeItem.id)}
      role="button"
      aria-pressed={isActive}
      className={`rounded-2xl p-4 flex flex-col justify-between text-left cursor-pointer transition-all duration-150 bg-white dark:bg-[#0f1724] border ${
        isActive
          ? 'ring-3 ring-[var(--accent)] shadow-lg'
          : 'border-white/80 dark:border-white/10 shadow-md hover:shadow-lg'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className="font-mono font-extrabold text-xl"
          style={{ color: item.accentColor }}
        >
          {item.num}
        </span>
        {isActive ? (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold shadow-xs"
            style={{
              backgroundColor: themeItem.accent,
              color: 'var(--accent-fg)',
            }}
          >
            <Check className="w-2.5 h-2.5" />
            <span>Active</span>
          </span>
        ) : (
          <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
            {themeItem.tag}
          </span>
        )}
      </div>

      <div className="space-y-1 my-3">
        <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
          {themeItem.name}
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
          {themeItem.subtitle}
        </p>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-1.5">
          {[
            { label: 'Accent', color: themeItem.accent },
            { label: 'Surface', color: themeItem.surface },
            { label: 'Border', color: themeItem.border },
            { label: 'Background', color: themeItem.bg },
          ].map((swatch) => (
            <div
              key={swatch.label}
              className="w-4 h-4 rounded-md border border-black/10 shadow-xs"
              style={{ backgroundColor: swatch.color }}
              title={`${swatch.label}: ${swatch.color}`}
            />
          ))}
        </div>
        <span className="text-[10px] font-mono text-gray-400">
          {isActive ? 'Current' : 'Apply'}
        </span>
      </div>
    </button>
  );
};

export default ThemesShowcase;
