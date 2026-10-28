import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nContext';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart3,
  Activity,
  Award,
  Fingerprint,
  ArrowRight,
  Play,
  ShieldCheck,
} from 'lucide-react';
import {
  getAllMergedSessions,
  calculateReportMetrics,
} from '../../utils/telemetryStorage';
import { CircularIntelligenceInfographic } from '../telemetry/CircularIntelligenceInfographic';

/**
 * TelemetryPreview
 * 
 * Scientific Keystroke Intelligence & Biomechanical Analytics Showcase.
 * - Exact circular infographic layout matching the user reference
 * - Genuine user telemetry integration (no fabricated demonstration values)
 * - Ten-Finger Biomechanical Matrix linked to actual session records
 * - High-contrast, theme-resilient "Explore Typing Insights" CTA button
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

  // Compute authoritative metrics across current session history
  const metrics = useMemo(() => {
    return calculateReportMetrics(sessions, 'overall');
  }, [sessions]);

  // Standard touch typing finger mapping for matrix
  const baseFingers = [
    { id: 'left-pinky', name: 'L. Pinky', keys: 'Q, A, Z' },
    { id: 'left-ring', name: 'L. Ring', keys: 'W, S, X' },
    { id: 'left-middle', name: 'L. Middle', keys: 'E, D, C' },
    { id: 'left-index', name: 'L. Index', keys: 'R, F, V, T, G, B' },
    { id: 'thumb', name: 'Thumbs', keys: 'Spacebar' },
    { id: 'right-index', name: 'R. Index', keys: 'Y, H, N, U, J, M' },
    { id: 'right-middle', name: 'R. Middle', keys: 'I, K, Comma' },
    { id: 'right-ring', name: 'R. Ring', keys: 'O, L, Period' },
    { id: 'right-pinky', name: 'R. Pinky', keys: 'P, ;, /' },
  ];

  // Derive genuine finger statistics
  const liveFingerStats = useMemo(() => {
    const safeLive = Array.isArray(metrics?.fingerStats) ? metrics.fingerStats : [];
    return baseFingers.map((base) => {
      const found = safeLive.find((f) => f.id === base.id);
      if (found && found.hasData) {
        const errNum = parseFloat(found.errorRate) || 0;
        let color = 'var(--ui-success)';
        if (errNum > 4) color = 'var(--ui-error)';
        else if (errNum > 2) color = 'var(--ui-warning)';

        return {
          ...base,
          speed: `${found.speed} WPM`,
          speedNum: found.speed,
          errorRate: found.errorRate,
          color,
          hasData: true,
        };
      }
      return {
        ...base,
        speed: '—',
        speedNum: 0,
        errorRate: '—',
        color: 'var(--border)',
        hasData: false,
      };
    });
  }, [metrics]);

  const hasAnyFingerData = liveFingerStats.some((f) => f.hasData);

  // Derive genuine mastery tier based on velocity and consistency
  const masteryTier = useMemo(() => {
    if (!metrics.hasData || metrics.maxWpm === 0) {
      return {
        tier: 'Uncalibrated',
        title: 'Novice Typist',
        description: 'Complete practice drills to evaluate rhythm and velocity.',
      };
    }
    if (metrics.maxWpm >= 90) {
      return {
        tier: 'Tier IV',
        title: 'Cadence Grandmaster',
        description: `Peak velocity ${metrics.maxWpm} WPM with high-velocity rhythm control.`,
      };
    }
    if (metrics.maxWpm >= 65) {
      return {
        tier: 'Tier III',
        title: 'Cadence Specialist',
        description: `Strong rhythm consistency across ${metrics.totalSessions} sessions.`,
      };
    }
    if (metrics.maxWpm >= 40) {
      return {
        tier: 'Tier II',
        title: 'Developing Fluency',
        description: 'Solid home-row foundation building toward burst velocity.',
      };
    }
    return {
      tier: 'Tier I',
      title: 'Foundation Stage',
      description: 'Focusing on finger placement and error reduction.',
    };
  }, [metrics]);

  return (
    <section id="telemetry" className="section-spacing border-t border-[var(--border)] relative bg-[var(--bg-surface)]/20">
      <div className="container-app space-y-12">
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

        {/* 2. Secondary Analytics Row: Ten-Finger Biomechanical Matrix & Mastery Tier */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          {/* Left: 10-Finger Error & Speed Matrix */}
          <div className="lg:col-span-7 card-panel p-4 sm:p-6 space-y-5 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
                <div className="flex items-center gap-2">
                  <Fingerprint className="w-5 h-5 text-[var(--accent)]" aria-hidden="true" />
                  <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                    Ten-Finger Biomechanical Matrix
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded border border-[var(--border)]">
                  {hasAnyFingerData ? 'Verified Real Telemetry' : 'Uncalibrated'}
                </span>
              </div>

              {/* Finger Rows */}
              <div className="space-y-2.5 mt-4">
                {hasAnyFingerData ? (
                  liveFingerStats.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-1 text-xs font-mono">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <span className="font-semibold text-[var(--text-primary)]">{item.name}</span>
                          <span className="text-[10px] text-[var(--text-muted)]">({item.keys})</span>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <span className="text-[11px] text-[var(--text-muted)]">
                            Err: {item.errorRate}
                          </span>
                          <span className="font-bold text-[var(--text-primary)] w-14 sm:w-16 text-right">
                            {item.speed}
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: item.hasData ? `${Math.min(100, (item.speedNum / 110) * 100)}%` : '0%',
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center space-y-3">
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-sm mx-auto">
                      No keystroke telemetry recorded yet. Start practicing to generate real 10-finger biomechanical analytics.
                    </p>
                    <Link
                      to="/practice"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--accent)] text-[var(--accent-fg)] font-bold text-xs shadow-xs"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Start Calibration Drill</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--text-secondary)] flex items-start gap-2.5 mt-4">
              <Activity className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" aria-hidden="true" />
              <span className="text-[11px] leading-relaxed">
                <strong>Neuromuscular Insight:</strong> Standard touch typing assigns distinct key zones to all ten digits. Pinky reaches naturally demand deliberate discipline to prevent velocity drops.
              </span>
            </div>
          </div>

          {/* Right: Mastery Tier & Telemetry Verification */}
          <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
            {/* Mastery Tier Card */}
            <div className="card-panel p-4 sm:p-5 space-y-3 shadow-xl">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-[var(--text-primary)]">
                  Mastery Tier Assessment
                </h4>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[var(--bg-elevated)] border border-[var(--accent)] flex items-center justify-center font-mono font-extrabold text-xs text-[var(--accent)] shrink-0 shadow-xs">
                  {masteryTier.tier}
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-[var(--text-primary)]">
                    {masteryTier.title}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    {masteryTier.description}
                  </div>
                </div>
              </div>
            </div>

            {/* Authenticated Integrity Card */}
            <div className="card-panel p-4 sm:p-5 space-y-3 shadow-xl bg-[var(--bg-surface)]">
              <div className="flex items-center gap-2 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-[var(--text-primary)]">
                  Data Integrity Guarantee
                </h4>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                All displayed velocity records, accuracy percentages, and practice targets derive strictly from your recorded sessions. KEYFLOW contains zero fabricated statistics.
              </p>
              <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
                <span>Account Status:</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {user ? 'Authenticated Profile' : 'Guest Browser Session'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. CTA to Full Telemetry Dashboard: Fixed Visibility & Renamed to 'Explore Typing Insights' */}
        <div className="pt-4 text-center">
          <Link
            to="/telemetry"
            className="inline-flex items-center justify-center gap-2.5 px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-[var(--accent)] text-[var(--accent-fg)] font-bold text-sm sm:text-base shadow-lg hover:brightness-105 active:scale-95 transition-all group max-w-full text-center focus-visible:ring-4 focus-visible:ring-[var(--accent)]/40 focus:outline-none"
            title="Explore Typing Insights"
          >
            <span>Explore Typing Insights</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 shrink-0" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default TelemetryPreview;
