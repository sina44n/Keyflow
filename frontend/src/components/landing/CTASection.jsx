import React from 'react';
import { Button } from '../common/Button';
import { ArrowRight, Keyboard } from 'lucide-react';

export const CTASection = () => {
  return (
    <section className="py-20 border-t border-[var(--border)] relative overflow-hidden">
      <div
        className="absolute bottom-0 right-1/4 w-[500px] h-[300px] rounded-full blur-[140px] pointer-events-none opacity-20"
        style={{ backgroundColor: 'var(--accent)' }}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <div className="rounded-3xl bg-[var(--bg-surface)] border border-[var(--border)] p-8 sm:p-14 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--accent)] flex items-center justify-center mx-auto shadow-md">
            <Keyboard className="w-6 h-6" />
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-[var(--text-primary)] tracking-tight max-w-2xl mx-auto leading-tight">
            Stop searching for keys. Start flowing in state.
          </h2>

          <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-xl mx-auto leading-relaxed">
            Join thousands of typists, engineers, and students unlocking their highest typing
            velocity with scientifically structured lessons.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Button
              variant="primary"
              size="lg"
              icon={ArrowRight}
              onClick={() => {
                const el = document.getElementById('sandbox');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Start Level 1 for Free
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                const el = document.getElementById('curriculum');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              View Full Syllabus
            </Button>
          </div>

          <p className="text-xs font-mono text-[var(--text-muted)] pt-2">
            Free forever for individual typists • No credit card required • 100% open REST API
          </p>
        </div>
      </div>
    </section>
  );
};
