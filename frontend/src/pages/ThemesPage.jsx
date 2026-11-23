import React, { useEffect } from 'react';
import { ThemesShowcase } from '../components/landing/ThemesShowcase';

/**
 * ThemesPage — Dedicated KEYFLOW Studio Themes Selection Page
 * ============================================================
 * Accessible via /themes or /#themes.
 * Mounts the connected geometric theme gallery.
 */
export const ThemesPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] pb-16">
      <ThemesShowcase isStandalone={true} />
    </main>
  );
};

export default ThemesPage;
