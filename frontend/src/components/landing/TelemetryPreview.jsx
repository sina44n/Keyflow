import React from 'react';
import { BarChart3, TrendingUp, Activity, Award, Fingerprint } from 'lucide-react';

export const TelemetryPreview = () => {
  const fingerStats = [
    { finger: 'L. Pinky (Q,A,Z)', errorRate: '3.2%', speed: '58 WPM', color: '#F06B72' },
    { finger: 'L. Ring (W,S,X)', errorRate: '1.4%', speed: '72 WPM', color: '#65B87A' },
    { finger: 'L. Middle (E,D,C)', errorRate: '0.8%', speed: '84 WPM', color: '#65B87A' },
    { finger: 'L. Index (R,F,V,T,G,B)', errorRate: '1.1%', speed: '88 WPM', color: '#65B87A' },
    { finger: 'Thumbs (Spacebar)', errorRate: '0.1%', speed: '105 WPM', color: '#C8F36A' },
    { finger: 'R. Index (Y,H,N,U,J,M)', errorRate: '0.9%', speed: '89 WPM', color: '#65B87A' },
    { finger: 'R. Middle (I,K,Comma)', errorRate: '1.2%', speed: '81 WPM', color: '#65B87A' },
    { finger: 'R. Ring (O,L,Period)', errorRate: '1.8%', speed: '70 WPM', color: '#65B87A' },
    { finger: 'R. Pinky (P,;,Slash)', errorRate: '4.1%', speed: '54 WPM', color: '#F06B72' },
  ];

  return (
    <section id="telemetry" className="py-20 border-t border-[var(--border)] relative bg-[var(--bg-surface)]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--accent)] font-mono">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Telemetry & Biomechanical Analytics</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Scientific Insights for Every Keystroke
          </h2>
          <p className="text-sm sm:text-base text-[var(--text-secondary)]">
            Don't guess where you're losing speed. KEYFLOW monitors individual finger latencies,
            misstrike clusters, and velocity consistency down to 1ms.
          </p>
        </div>

        {/* Analytics Display Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Finger Heatmap & Error Distribution */}
          <div className="lg:col-span-7 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-[var(--accent)]" />
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Ten-Finger Biomechanical Telemetry
                </h3>
              </div>
              <span className="text-xs font-mono text-[var(--ui-success)] bg-[var(--bg-elevated)] px-2.5 py-1 rounded-md border border-[var(--border)]">
                Live Sensor Feed
              </span>
            </div>

            <div className="space-y-3">
              {fingerStats.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[var(--text-secondary)]">{item.finger}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-[var(--text-muted)]">Error: {item.errorRate}</span>
                      <span className="font-bold text-[var(--text-primary)]">{item.speed}</span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (parseInt(item.speed) / 110) * 100)}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--text-secondary)] flex items-start gap-2.5">
              <Activity className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
              <span>
                <strong>Coaching Insight:</strong> Left and right pinky finger reaches show 3x higher
                error rates. Level 4 and Level 6 exercises will automatically isolate these key clusters.
              </span>
            </div>
          </div>

          {/* Right: Progression & Session Summary Stats */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] p-6 space-y-5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
                  Velocity Curve
                </span>
                <TrendingUp className="w-4 h-4 text-[var(--accent)]" />
              </div>
              <div className="space-y-1">
                <div className="text-4xl font-extrabold font-mono text-[var(--text-primary)]">
                  94.2 <span className="text-lg font-normal text-[var(--accent)]">WPM</span>
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  +28.4 WPM gained over 30 days of training
                </p>
              </div>

              {/* Simulated mini sparkline */}
              <div className="h-20 w-full flex items-end gap-1.5 pt-4">
                {[35, 42, 45, 52, 58, 62, 60, 68, 74, 78, 85, 94].map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-sm bg-[var(--accent)] transition-all duration-300 hover:opacity-80"
                      style={{ height: `${(val / 100) * 60}px` }}
                      title={`Day ${i * 2 + 1}: ${val} WPM`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)] pt-1 border-t border-[var(--border)]">
                <span>Day 1 (35 WPM)</span>
                <span>Day 30 (94 WPM)</span>
              </div>
            </div>

            <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] p-6 space-y-4 shadow-lg">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[var(--accent)]" />
                <h4 className="text-sm font-bold text-[var(--text-primary)]">Badges & Mastery Tier</h4>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[var(--bg-elevated)] border border-[var(--accent)] flex items-center justify-center font-mono font-bold text-sm text-[var(--accent)]">
                  Tier IV
                </div>
                <div>
                  <div className="text-sm font-semibold text-[var(--text-primary)]">
                    Cadence Specialist
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    99% consistency across 200+ continuous words
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
