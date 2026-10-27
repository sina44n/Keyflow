/**
 * KEYFLOW How It Works Section
 * =============================
 * Three-step breakdown of calibration, muscle memory conditioning, and flow state.
 */

import React from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { Compass, Cpu, Flame } from 'lucide-react';

export const HowItWorksSection = () => {
  const { t } = useI18n();

  const steps = [
    {
      num: '01',
      icon: Compass,
      title: t('howItWorks.step1.title') || '1. Calibration',
      desc: t('howItWorks.step1.desc') || 'Assess your baseline WPM, finger balance, and error patterns through our diagnostic workstation.',
    },
    {
      num: '02',
      icon: Cpu,
      title: t('howItWorks.step2.title') || '2. Muscle Memory Conditioning',
      desc: t('howItWorks.step2.desc') || 'Condition your finger reflexes through targeted n-gram drills designed to eliminate hesitation.',
    },
    {
      num: '03',
      icon: Flame,
      title: t('howItWorks.step3.title') || '3. Flow State & Speed Burst',
      desc: t('howItWorks.step3.desc') || 'Lock in 90+ WPM fluency with real-world literature, code syntax, and adrenaline-pumping arcade combat.',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 border-b border-[var(--border)] bg-[var(--bg-surface)]">
      <div className="container-app">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase bg-[var(--bg-elevated)] text-[var(--accent)] border border-[var(--border)]">
            Progression Roadmap
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
            {t('howItWorks.title') || 'How KEYFLOW Transforms Your Speed'}
          </h2>
          <p className="text-sm sm:text-base text-[var(--text-secondary)]">
            A scientifically phased learning pathway moving from mechanical awareness to sub-conscious execution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="relative p-7 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] flex flex-col justify-between group hover:border-[var(--accent)] transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="font-mono text-3xl font-extrabold text-[var(--accent)] opacity-80">
                      {s.num}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] flex items-center justify-center text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
                    {s.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
