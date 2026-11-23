/**
 * KEYFLOW Theme Gallery Configuration
 * =====================================
 * Curated theme metadata, authentic backing colors, dashed borders,
 * icons, and physical tilt rotational presets matching the design reference.
 */

export const THEME_ROWS = [
  // 1: Premier Masterpiece & Flagship Palettes
  {
    category: 'Masterpiece',
    rowTitle: 'Masterpiece Collection',
    cards: [
      {
        num: '01',
        themeId: 'burgundy-cream',
        backingColor: '#9E2A2B',
        backingGradient: 'linear-gradient(135deg, #B91C1C 0%, #7F1D1D 100%)',
        dashedColor: '#9E2A2B',
        tag: 'Masterpiece',
        iconName: 'Wine',
      },
      {
        num: '02',
        themeId: 'glacier-aqua',
        backingColor: '#008890',
        backingGradient: 'linear-gradient(135deg, #A0E0E0 0%, #008890 100%)',
        dashedColor: '#008890',
        tag: 'Icy',
        iconName: 'Droplets',
      },
      {
        num: '03',
        themeId: 'forest-sage',
        backingColor: '#09473A',
        backingGradient: 'linear-gradient(135deg, #397A65 0%, #09473A 100%)',
        dashedColor: '#09473A',
        tag: 'Botanical',
        iconName: 'Leaf',
      },
      {
        num: '04',
        themeId: 'midnight-slate',
        backingColor: '#F6C638',
        backingGradient: 'linear-gradient(135deg, #F9DB6B 0%, #F6C638 100%)',
        dashedColor: '#F6C638',
        tag: 'Sunny',
        iconName: 'Sun',
      },
    ],
  },
  // 2: Nocturnal & Dark Studios
  {
    category: 'Nocturnal',
    rowTitle: 'Nocturnal Collection',
    cards: [
      {
        num: '05',
        themeId: 'dark-theme',
        backingColor: '#D90429',
        backingGradient: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
        dashedColor: '#D90429',
        tag: 'Nocturnal',
        iconName: 'Moon',
      },
      {
        num: '06',
        themeId: 'dark-charcoal-lime',
        backingColor: '#C5FF00',
        backingGradient: 'linear-gradient(135deg, #C5FF00 0%, #111111 100%)',
        dashedColor: '#C5FF00',
        tag: 'Terminal',
        iconName: 'Terminal',
      },
      {
        num: '07',
        themeId: 'midnight-blue',
        backingColor: '#1749F5',
        backingGradient: 'linear-gradient(135deg, #1749F5 0%, #06264A 100%)',
        dashedColor: '#1749F5',
        tag: 'Oceanic',
        iconName: 'Waves',
      },
      {
        num: '08',
        themeId: 'lavender-purple',
        backingColor: '#32214A',
        backingGradient: 'linear-gradient(135deg, #624C74 0%, #32214A 100%)',
        dashedColor: '#32214A',
        tag: 'Royal',
        iconName: 'Sparkles',
      },
    ],
  },
  // 3: High-Cadence Vibrant Palettes
  {
    category: 'Vibrant',
    rowTitle: 'Vibrant Collection',
    cards: [
      {
        num: '09',
        themeId: 'forest-green',
        backingColor: '#101A35',
        backingGradient: 'linear-gradient(135deg, #173CFF 0%, #101A35 100%)',
        dashedColor: '#173CFF',
        tag: 'Electric',
        iconName: 'Zap',
      },
      {
        num: '10',
        themeId: 'ocean-teal',
        backingColor: '#0D9488',
        backingGradient: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
        dashedColor: '#0D9488',
        tag: 'Velocity',
        iconName: 'Compass',
      },
      {
        num: '11',
        themeId: 'sunset-orange',
        backingColor: '#D7410E',
        backingGradient: 'linear-gradient(135deg, #F15A24 0%, #D7410E 100%)',
        dashedColor: '#D7410E',
        tag: 'Fiery',
        iconName: 'Flame',
      },
      {
        num: '12',
        themeId: 'rose-pink',
        backingColor: '#DB2777',
        backingGradient: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
        dashedColor: '#DB2777',
        tag: 'Neon',
        iconName: 'Sun',
      },
    ],
  },
  // 4: Daylight & Clean Minimalist Palettes
  {
    category: 'Daylight',
    rowTitle: 'Daylight & Minimalist Palettes',
    cards: [
      {
        num: '13',
        themeId: 'arctic-blue',
        backingColor: '#949686',
        backingGradient: 'linear-gradient(135deg, #949686 0%, #B08369 100%)',
        dashedColor: '#949686',
        tag: 'Sage',
        iconName: 'Leaf',
      },
      {
        num: '14',
        themeId: 'solarized-light',
        backingColor: '#1D4ED8',
        backingGradient: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
        dashedColor: '#1D4ED8',
        tag: 'Daylight',
        iconName: 'BookOpen',
      },
      {
        num: '15',
        themeId: 'warm-sand',
        backingColor: '#B45309',
        backingGradient: 'linear-gradient(135deg, #D97706 0%, #92400E 100%)',
        dashedColor: '#B45309',
        tag: 'Natural',
        iconName: 'Mountain',
      },
      {
        num: '16',
        themeId: 'classic-black-white',
        backingColor: '#18181B',
        backingGradient: 'linear-gradient(135deg, #27272A 0%, #09090B 100%)',
        dashedColor: '#3F3F46',
        tag: 'Monochrome',
        iconName: 'Contrast',
      },
    ],
  },
];

/**
 * Distinct rotational angles for each column to recreate the exact
 * double-layer scissor/patch tilt from the design reference.
 */
export const CARD_ROTATION_PRESETS = [
  { rear: -5.2, front: 2.8 },
  { rear: 5.2, front: -2.8 },
  { rear: -4.6, front: 2.4 },
  { rear: 4.8, front: -2.6 },
];
