import React from 'react';
import { BarChart3, TrendingUp, Activity, Award, Fingerprint } from 'lucide-react';

export const TelemetryPreview = () => {
  const fingerStats = [
    { name: 'L. Pinky', keys: 'Q, A, Z', errorRate: '3.2%', speed: '58 WPM', color: 'var(--ui-error)' },
    { name: 'L. Ring', keys: 'W, S, X', errorRate: '1.4%', speed: '72 WPM', color: 'var(--ui-success)' },
    { name: 'L. Middle', keys: 'E, D, C', errorRate: '0.8%', speed: '84 WPM', color: 'var(--ui-success)' },
    { name: 'L. Index', keys: 'R, F, V, T, G, B', errorRate: '1.1%', speed: '88 WPM', color: 'var(--ui-success)' },
    { name: 'Thumbs', keys: 'Spacebar', errorRate: '0.1%', speed: '105 WPM', color: 'var(--accent)' },
    { name: 'R. Index', keys: 'Y, H, N, U, J, M', errorRate: '0.9%', speed: '89 WPM', color: 'var(--ui-success)' },
    { name: 'R. Middle', keys: 'I, K, Comma', errorRate: '1.2%', speed: '81 WPM', color: 'var(--ui-success)' },
    { name: 'R. Ring', keys: 'O, L, Period', errorRate: '1.8%', speed: '70 WPM', color: 'var(--ui-warning)' },
    { name: 'R. Pinky', keys: 'P, ;, /', errorRate: '4.1%', speed: '54 WPM', color: 'var(--ui-error)' },
  ];

  return (
    <section id="telemetry" className="section-spacing border-t border-[var(--border)] relative bg-[var(--bg-surface)]/20">
      <div className="container-app space-y-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--accent)] font-mono">
            <BarChart3 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Biomechanical Telemetry & Analytics</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Scientific Keystroke Intelligence
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            Eliminate guesswork. KEYFLOW aggregates individual finger latencies, misstrike clusters, and cadence variance to pinpoint exactly where you lose velocity.
          </p>
        </div>

        {/* Analytics Display Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left: 10-Finger Error & Speed Matrix */}
          <div className="lg:col-span-7 card-panel p-5 sm:p-6 space-y-5 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-[var(--accent)]" aria-hidden="true" />
                <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
                  Ten-Finger Biomechanical Matrix
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded border border-[var(--border)]">
                Demonstration Data
              </span>
            </div>

            <div className="space-y-2.5">
              {fingerStats.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[var(--text-primary)]">{item.name}</span>
                      <span className="text-[10px] text-[var(--text-muted)]">({item.keys})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-[var(--text-muted)]">Err: {item.errorRate}</span>
                      <span className="font-bold text-[var(--text-primary)] w-16 text-right">{item.speed}</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, (parseInt(item.speed) / 110) * 100)}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--text-secondary)] flex items-start gap-2.5">
              <Activity className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" aria-hidden="true" />
              <span className="text-[11px] leading-relaxed">
                <strong>Simulated Insight:</strong> Pinky finger reaches indicate 3.5× higher misstrike rates. Level 4 (Shift discipline) and Level 6 (Programmer syntax) specifically isolate these finger clusters.
              </span>
            </div>
          </div>

          {/* Right: Velocity Progression Curve & Tier Badges */}
          <div className="lg:col-span-5 space-y-6">
            {/* Velocity Curve Card */}
            <div className="card-panel p-5 sm:p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
                  Velocity Curve (30-Day Simulation)
                </span>
                <TrendingUp className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
              </div>

              <div className="space-y-0.5">
                <div className="text-3xl sm:text-4xl font-extrabold font-mono text-[var(--text-primary)]">
                  94.2 <span className="text-base font-normal text-[var(--accent)]">WPM</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  +28.4 WPM projected improvement over 30 days of training
                </p>
              </div>

              {/* Responsive SVG Sparkline Chart */}
              <div className="pt-2">
                <div className="h-24 w-full flex items-end gap-1.5 pt-2">
                  {[35, 42, 45, 52, 58, 62, 60, 68, 74, 78, 85, 94].map((val, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t-xs bg-[var(--accent)] transition-all duration-200 hover:opacity-80"
                        style={{ height: `${(val / 100) * 72}px` }}
                        title={`Sprint ${i + 1}: ${val} WPM`}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)] pt-2 border-t border-[var(--border)]">
                  <span>Sprint 1 (35 WPM)</span>
                  <span>Sprint 12 (94 WPM)</span>
                </div>
              </div>
            </div>

            {/* Mastery Tier Card */}
            <div className="card-panel p-5 space-y-3 shadow-xl">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-[var(--text-primary)]">
                  Mastery Tier Demonstration
                </h4>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[var(--bg-elevated)] border border-[var(--accent)] flex items-center justify-center font-mono font-bold text-xs text-[var(--accent)] shrink-0">
                  Tier IV
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-[var(--text-primary)]">
                    Cadence Specialist
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    99% rhythm consistency across 200+ continuous words
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
