import React, { createContext, useContext, useState, useEffect } from 'react';

export const THEMES = [
  {
    id: 'dark-theme',
    name: 'Dark Theme',
    subtitle: 'Obsidian black with precision neon-red highlights',
    mode: 'dark',
    accent: '#FF1744',
    bg: '#050608',
    surface: '#090C12',
    border: '#222B38',
    tag: 'Signature',
  },
  {
    id: 'dark-charcoal-lime',
    name: 'Charcoal Lime',
    subtitle: 'High contrast terminal green on deep obsidian',
    mode: 'dark',
    accent: '#C8F36A',
    bg: '#10120F',
    surface: '#191C17',
    border: '#2E342A',
    tag: 'Lime',
  },
  {
    id: 'classic-black-white',
    name: 'Classic Monochrome',
    subtitle: 'Pure stark minimalism, timeless clarity',
    mode: 'dark',
    accent: '#FFFFFF',
    bg: '#0A0A0A',
    surface: '#141414',
    border: '#2A2A2A',
    tag: 'Minimal',
  },
  {
    id: 'burgundy-cream',
    name: 'Burgundy & Cream',
    subtitle: 'Warm luxury cream parchment and deep wine burgundy',
    mode: 'light',
    accent: '#9E2A2B',
    bg: '#FFFDF9',
    surface: '#F7F2EA',
    border: '#D5C5B8',
    tag: 'Masterpiece',
  },
  {
    id: 'midnight-blue',
    name: 'Midnight Ocean',
    subtitle: 'Electric cyan currents over deep oceanic navy',
    mode: 'dark',
    accent: '#38BDF8',
    bg: '#0B1120',
    surface: '#131D31',
    border: '#1E293B',
    tag: 'Popular',
  },
  {
    id: 'lavender-purple',
    name: 'Lavender Dream',
    subtitle: 'Soft violet glow in a velvet twilight',
    mode: 'dark',
    accent: '#C084FC',
    bg: '#120D1D',
    surface: '#1B142B',
    border: '#2E2248',
    tag: 'Aesthetic',
  },
  {
    id: 'forest-green',
    name: 'Forest Canopy',
    subtitle: 'Bioluminescent emerald and natural calm',
    mode: 'dark',
    accent: '#4ADE80',
    bg: '#0A160E',
    surface: '#112217',
    border: '#1C3827',
    tag: 'Calm',
  },
  {
    id: 'ocean-teal',
    name: 'Ocean Teal',
    subtitle: 'Vibrant turquoise waters under midnight skies',
    mode: 'dark',
    accent: '#2DD4BF',
    bg: '#08171A',
    surface: '#0F2429',
    border: '#183B43',
    tag: 'Vibrant',
  },
  {
    id: 'sunset-orange',
    name: 'Sunset Horizon',
    subtitle: 'Warm fiery dusk and amber twilight',
    mode: 'dark',
    accent: '#FB923C',
    bg: '#18100D',
    surface: '#241914',
    border: '#3D2A22',
    tag: 'Energetic',
  },
  {
    id: 'rose-pink',
    name: 'Neon Rose',
    subtitle: 'Electrifying magenta in nocturnal shadows',
    mode: 'dark',
    accent: '#F472B6',
    bg: '#180C14',
    surface: '#24121E',
    border: '#3F1F35',
    tag: 'Neon',
  },
  {
    id: 'arctic-blue',
    name: 'Arctic Frost',
    subtitle: 'Sub-zero glacial clarity and ice-blue neon',
    mode: 'dark',
    accent: '#67E8F9',
    bg: '#0C161C',
    surface: '#13212A',
    border: '#1E3544',
    tag: 'Cool',
  },
  {
    id: 'solarized-light',
    name: 'Solarized Paper',
    subtitle: 'Warm ivory parchment tuned for daytime reading',
    mode: 'light',
    accent: '#268BD2',
    bg: '#FDF6E3',
    surface: '#EEE8D5',
    border: '#D33682',
    tag: 'Daytime',
  },
  {
    id: 'warm-sand',
    name: 'Warm Dune',
    subtitle: 'Earthy desert dunes and amber accents',
    mode: 'light',
    accent: '#D97706',
    bg: '#F7F3EE',
    surface: '#ECE6DC',
    border: '#D8CEC0',
    tag: 'Natural',
  },
];

const THEME_STORAGE_KEY = 'keyflow-theme';

const ThemeContext = createContext({
  theme: 'dark-theme',
  setTheme: () => {},
  themes: THEMES,
  currentThemeObj: THEMES.find((t) => t.id === 'dark-theme') || THEMES[0],
});

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored && THEMES.some((t) => t.id === stored)) {
        return stored;
      }
    } catch {
      // Fallback if localStorage is inaccessible
    }
    return 'dark-theme';
  });

  const setTheme = (themeId) => {
    if (!THEMES.some((t) => t.id === themeId)) return;
    setThemeState(themeId);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, themeId);
    } catch {
      // localStorage may fail in restricted iframes/private modes
    }
    document.documentElement.setAttribute('data-theme', themeId);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const currentThemeObj = THEMES.find((t) => t.id === theme) || THEMES[0];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES, currentThemeObj }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
