import React from 'react';

/**
 * PageLoadingFallback
 * Elegant, accessible loading indicator displayed during React.lazy() chunk downloads.
 * Styled to blend seamlessly with KEYFLOW's Burgundy & Cream design system.
 */
export const PageLoadingFallback = ({ message = 'Loading KEYFLOW...' }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-[70vh] flex flex-col items-center justify-center p-8 bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors duration-200"
    >
      <div className="relative flex items-center justify-center mb-5">
        {/* Outer glowing pulsing halo */}
        <div className="absolute w-14 h-14 rounded-full bg-[var(--accent)]/15 animate-ping" />
        
        {/* Spinning indicator ring */}
        <div className="w-12 h-12 rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] animate-spin" />
        
        {/* Subtle center logo pip */}
        <div className="absolute w-3 h-3 rounded-full bg-[var(--accent)]" />
      </div>

      <p className="text-sm font-medium tracking-wide text-[var(--text-muted)] animate-pulse">
        {message}
      </p>
      <span className="sr-only">Loading content, please wait...</span>
    </div>
  );
};

export default PageLoadingFallback;
