/**
 * KEYFLOW Practice History Modal
 * ==============================
 * Displays genuine session telemetry and practice history.
 * Never fabricates sessions or statistics.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  History,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import {
  loadRawTelemetrySessions,
  deleteTelemetrySession,
  clearAllTelemetrySessions,
  formatDuration,
} from '../../utils/telemetryStorage.js';
import { practiceAPI } from '../../utils/api.js';

export const PracticeHistoryModal = ({ isOpen, onClose, userId = null }) => {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    const loadHistory = async () => {
      setIsLoading(true);
      // 1. Load local telemetry sessions
      const local = loadRawTelemetrySessions(userId) || [];

      // 2. If authenticated, try fetching backend history and merge
      let merged = [...local];
      if (userId) {
        try {
          const res = await practiceAPI.getHistory();
          if (res?.data && Array.isArray(res.data)) {
            const backendSessions = res.data.map((s) => ({
              id: `api_${s.id}`,
              timestamp: new Date(s.created_at).getTime(),
              wpm: parseFloat(s.net_wpm) || 0,
              grossWpm: parseFloat(s.gross_wpm) || 0,
              accuracy: parseFloat(s.accuracy) || 0,
              durationSeconds: s.duration_seconds || 0,
              totalKeystrokes: s.total_chars || 0,
              correctKeystrokes: s.correct_chars || 0,
              incorrectKeystrokes: s.incorrect_chars || s.error_count || 0,
              sessionType: s.session_type || 'workstation',
            }));
            // Merge deduplicating by approximate timestamp
            const existingTimestamps = new Set(local.map((l) => Math.round(l.timestamp / 1000)));
            for (const bs of backendSessions) {
              if (!existingTimestamps.has(Math.round(bs.timestamp / 1000))) {
                merged.push(bs);
              }
            }
          }
        } catch {
          // offline fallback to local
        }
      }

      // Sort newest first
      merged.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setSessions(merged);
      setIsLoading(false);
    };

    loadHistory();

    const handleTelemetryUpdated = () => loadHistory();
    window.addEventListener('keyflow-telemetry-updated', handleTelemetryUpdated);
    return () => window.removeEventListener('keyflow-telemetry-updated', handleTelemetryUpdated);
  }, [isOpen, userId]);

  const handleDeleteSession = (sessionToDelete) => {
    if (!window.confirm('Are you sure you want to delete this typing session record from your history?')) {
      return;
    }
    const targetId = sessionToDelete.id || String(sessionToDelete.timestamp);
    deleteTelemetrySession(targetId, userId);
    setSessions((prev) => prev.filter((s) => String(s.id || s.timestamp) !== targetId));
  };

  const handleClearAll = () => {
    if (!window.confirm('Are you sure you want to delete ALL practice session records? This cannot be undone.')) {
      return;
    }
    clearAllTelemetrySessions(userId);
    setSessions([]);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Aggregate genuine stats
  const stats = useMemo(() => {
    if (sessions.length === 0) return null;
    const wpms = sessions.map((s) => s.wpm || 0);
    const accs = sessions.map((s) => s.accuracy || 0);
    const maxWpm = Math.max(...wpms);
    const avgWpm = Math.round(wpms.reduce((a, b) => a + b, 0) / wpms.length);
    const avgAcc = Math.round(accs.reduce((a, b) => a + b, 0) / accs.length);
    const totalTime = sessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);

    return {
      count: sessions.length,
      maxWpm,
      avgWpm,
      avgAcc,
      totalTimeFormatted: formatDuration(totalTime),
    };
  }, [sessions]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-labelledby="practice-history-title"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)] bg-[var(--bg-elevated)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)]">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 id="practice-history-title" className="text-sm font-bold font-mono text-[var(--text-primary)]">
                Practice Session History
              </h2>
              <p className="text-[11px] font-mono text-[var(--text-muted)]">
                Authoritative local & synced telemetry records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {sessions.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="px-2.5 py-1 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-red-500 hover:border-red-500/40 text-xs font-mono transition-colors cursor-pointer"
                title="Delete all practice history"
              >
                Clear All
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              aria-label="Close history modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats Summary Bar */}
        {stats && (
          <div className="grid grid-cols-4 gap-2 p-3 border-b border-[var(--border)] bg-[var(--bg-surface)] text-center font-mono">
            <div className="p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
              <div className="text-[10px] text-[var(--text-muted)] uppercase">Tests</div>
              <div className="text-base font-bold text-[var(--text-primary)]">{stats.count}</div>
            </div>
            <div className="p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
              <div className="text-[10px] text-[var(--text-muted)] uppercase">Peak WPM</div>
              <div className="text-base font-bold text-[var(--accent)]">{stats.maxWpm}</div>
            </div>
            <div className="p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
              <div className="text-[10px] text-[var(--text-muted)] uppercase">Avg WPM</div>
              <div className="text-base font-bold text-[var(--text-primary)]">{stats.avgWpm}</div>
            </div>
            <div className="p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
              <div className="text-[10px] text-[var(--text-muted)] uppercase">Avg Acc</div>
              <div className="text-base font-bold text-[var(--ui-success)]">{stats.avgAcc}%</div>
            </div>
          </div>
        )}

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 font-mono">
          {isLoading ? (
            <div className="text-center py-12 text-xs text-[var(--text-muted)]">
              Loading session telemetry...
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-[var(--border)] rounded-2xl p-6">
              <BarChart3 className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2 opacity-50" />
              <p className="text-sm text-[var(--text-primary)] font-bold">No practice sessions recorded yet.</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Complete any test in the Workstation to see your speed, accuracy, and cadence tracked here.
              </p>
            </div>
          ) : (
            sessions.map((s, idx) => {
              const dateStr = s.timestamp ? new Date(s.timestamp).toLocaleString() : 'Recent';
              return (
                <div
                  key={s.id || idx}
                  className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--accent)]/40 transition-colors flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[var(--accent)] font-mono">
                        {s.wpm} <span className="text-[10px] text-[var(--text-muted)] font-normal">WPM</span>
                      </span>
                      <span className="text-[var(--text-muted)]">•</span>
                      <span className="font-semibold text-[var(--ui-success)]">{s.accuracy}% ACC</span>
                      <span className="text-[10px] uppercase px-1.5 py-0.2 rounded bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-muted)]">
                        {s.sessionType || 'timed'}
                      </span>
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-2">
                      <span>{dateStr}</span>
                      <span>•</span>
                      <span>Duration: {s.durationSeconds || 0}s</span>
                      {s.incorrectKeystrokes !== undefined && (
                        <>
                          <span>•</span>
                          <span>Errors: {s.incorrectKeystrokes}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    {s.accuracy >= 95 ? (
                      <CheckCircle2 className="w-4 h-4 text-[var(--ui-success)]" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-[var(--ui-warning)]" />
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteSession(s)}
                      className="p-1 rounded-md text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Delete this session record"
                      aria-label="Delete this session record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
