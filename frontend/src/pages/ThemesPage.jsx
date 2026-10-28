import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ThemesShowcase } from '../components/landing/ThemesShowcase';
import { ArrowLeft, Sparkles, Palette } from 'lucide-react';

/**
 * ThemesPage — Dedicated KEYFLOW Studio Themes Selection Page
 * ============================================================
 * Accessible via /themes or /#themes.
 * Mounts the connected geometric theme gallery with full breadcrumb context.
 */
export const ThemesPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] pb-16">
      {/* Top Breadcrumb Bar */}
      <div className="border-b border-[var(--border)] bg-[var(--bg-elevated)] py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs font-mono">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Home</span>
          </Link>

          <div className="flex items-center gap-2 text-[var(--accent)]">
            <Palette className="w-3.5 h-3.5" />
            <span>Studio Color Gallery</span>
          </div>
        </div>
      </div>

      {/* Main Connected Infographic Showcase */}
      <ThemesShowcase />
    </main>
  );
};

export default ThemesPage;
