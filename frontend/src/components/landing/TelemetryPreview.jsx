import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nContext';
import { useAuth } from '../../context/AuthContext';
import { BarChart3, ArrowRight } from 'lucide-react';
import { getAllMergedSessions } from '../../utils/telemetryStorage';
import { CircularIntelligenceInfographic } from '../telemetry/CircularIntelligenceInfographic';

/**
 * TelemetryPreview
 * 
 * Scientific Keystroke Intelligence & Biomechanical Analytics Showcase.
 * - Exact circular infographic layout matching the user reference
 * - Genuine user telemetry integration (no fabricated demonstration values)
 * - High-contrast, permanently visible "Explore Typing Insights" CTA button
 */
export const TelemetryPreview = () => {
  const { t } = useI18n();
  const { user } = useAuth();
  const userId = user?.id || null;

  // Real session state, re-synced on storage and custom events
  const [sessions, setSessions] = useState(() => getAllMergedSessions(userId));

  useEffect(() => {
    const refresh = () => setSessions(getAllMergedSessions(userId));
    window.addEventListener('keyflow-telemetry-updated', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('keyflow-telemetry-updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [userId]);

  return (
    <section id="telemetry" className="section-spacing border-t border-[var(--border)] relative bg-[var(--bg-surface)]/20">
      <div className="container-app space-y-10 sm:space-y-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--accent)] font-mono">
            <BarChart3 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t('telemetry.badge') || 'Biomechanical Telemetry & Analytics'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
            {t('telemetry.title') || 'Scientific Keystroke Intelligence'}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            {t('telemetry.subtitle') ||
              'Eliminate guesswork. KEYFLOW aggregates individual finger latencies, misstrike clusters, and cadence variance to pinpoint exactly where you lose velocity.'}
          </p>
        </div>

        {/* 1. Main Graph Replacement: Circular Intelligence Infographic (Reference-Based) */}
        <CircularIntelligenceInfographic
          sessions={sessions}
          title="Typing Performance Overview"
          subtitle="Biomechanical Keystroke Intelligence & Metric Distribution"
          showRangeFilter={true}
          showActions={false}
        />

        {/* 2. CTA to Full Telemetry Dashboard: Fixed Permanent Visibility */}
        <div className="pt-2 text-center">
          <Link
            to="/telemetry"
            className="inline-flex items-center justify-center gap-2.5 px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] font-bold text-sm sm:text-base shadow-lg hover:brightness-105 active:scale-95 transition-all group max-w-full text-center focus-visible:ring-4 focus-visible:ring-[var(--accent)]/40 focus:outline-none"
            style={{ color: 'var(--accent-fg)' }}
            title="Explore Typing Insights"
          >
            <span style={{ color: 'var(--accent-fg)' }}>Explore Typing Insights</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 shrink-0" style={{ color: 'var(--accent-fg)' }} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default TelemetryPreview;
