import React from 'react';
import { Button } from '../common/Button';
import { ArrowRight, Keyboard } from 'lucide-react';

export const CTASection = () => {
  return (
    <section className="section-spacing border-t border-[var(--border)] relative overflow-hidden bg-[var(--bg-main)]">
      {/* Background glow */}
      <div
        className="absolute bottom-0 right-1/3 w-[450px] h-[250px] rounded-full blur-[140px] pointer-events-none opacity-15"
        style={{ backgroundColor: 'var(--accent)' }}
        aria-hidden="true"
      />

      <div className="container-app relative z-10">
        <div className="card-panel p-6 sm:p-10 md:p-12 text-center space-y-6 shadow-2xl max-w-4xl mx-auto">
          <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--accent)] flex items-center justify-center mx-auto shadow-xs">
            <Keyboard className="w-5 h-5" aria-hidden="true" />
          </div>

          <div className="space-y-3 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight leading-tight">
              Stop looking down.<br />Start flowing in rhythm.
            </h2>

            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              Unlock your natural typing velocity through deliberate tactile practice. 7 academy levels, real-time telemetry, and 12 bespoke themes.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
              icon={ArrowRight}
              onClick={() => {
                const el = document.getElementById('sandbox');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Start Free Practice
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                const el = document.getElementById('curriculum');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Explore 7-Level Academy
            </Button>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-[11px] font-mono text-[var(--text-muted)]">
            <span>Free for all typists</span>
            <span>•</span>
            <span>Zero login required to practice</span>
            <span>•</span>
            <span>REST API Ready</span>
          </div>
        </div>
      </div>
    </section>
  );
};
