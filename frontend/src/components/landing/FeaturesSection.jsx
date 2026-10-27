/**
 * KEYFLOW Features Section
 * ========================
 * Highlights precision telemetry, 4,200 progressive levels,
 * 7 arcade games, and acoustic sound profiles.
 */

import React from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { Target, Layers, Gamepad2, Volume2, ShieldCheck, Zap } from 'lucide-react';

export const FeaturesSection = () => {
  const { t } = useI18n();

  const features = [
    {
      icon: Target,
      title: t('features.card2.title'),
      desc: t('features.card2.desc'),
      badge: t('nav.telemetry'),
    },
    {
      icon: Layers,
      title: t('features.card1.title'),
      desc: t('features.card1.desc'),
      badge: t('nav.academy'),
    },
    {
      icon: Gamepad2,
      title: t('features.card3.title'),
      desc: t('features.card3.desc'),
      badge: t('nav.arcade'),
    },
    {
      icon: Volume2,
      title: t('features.card5.title'),
      desc: t('features.card5.desc'),
      badge: t('sound.title'),
    },
    {
      icon: ShieldCheck,
      title: t('features.card4.title'),
      desc: t('features.card4.desc'),
      badge: t('nav.themes'),
    },
    {
      icon: Zap,
      title: t('features.card6.title'),
      desc: t('features.card6.desc'),
      badge: t('nav.telemetry'),
    },
  ];

  return (
    <section id="features" className="py-20 border-b border-[var(--border)] bg-[var(--bg-main)]">
      <div className="container-app">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] text-[var(--accent)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)]">
            {t('features.badge')}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
            {t('features.title')}
          </h2>
          <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
            {t('features.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="group p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--accent)] transition-all duration-200 shadow-sm hover:shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] group-hover:border-[var(--accent)] flex items-center justify-center text-[var(--accent)] transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border)]">
                      {f.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[var(--text-primary)] mb-2 group-hover:text-[var(--accent)] transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                    {f.desc}
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
