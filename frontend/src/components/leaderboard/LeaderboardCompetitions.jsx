/**
 * KEYFLOW Leaderboard Competitions Showcase
 * =========================================
 * Displays real competition lobbies and tournaments from the backend database:
 * - Active & completed typing competitions
 * - Real participant counts and challenge targets
 * - Direct action buttons to join competition lobbies on the Workstation
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Users, Zap, ArrowRight, Play, CheckCircle2 } from 'lucide-react';

export const LeaderboardCompetitions = ({ competitions }) => {
  const navigate = useNavigate();

  if (!competitions || competitions.length === 0) {
    return (
      <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] p-8 text-center">
        <Trophy className="w-8 h-8 text-[var(--accent)] mx-auto mb-2" />
        <h4 className="font-mono text-sm font-bold text-[var(--text-primary)]">
          No Public Competitions Active
        </h4>
        <p className="text-xs font-mono text-[var(--text-secondary)] mt-1 max-w-sm mx-auto">
          Create a private or public typing tournament directly on the Workstation to compete head-to-head with friends.
        </p>
        <button
          type="button"
          onClick={() => navigate('/workstation')}
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-fg)] font-mono text-xs font-bold hover:bg-[var(--accent-hover)] transition-all cursor-pointer"
        >
          <span>Host Competition</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-[var(--accent)]" />
          <h3 className="font-mono text-sm font-bold text-[var(--text-primary)]">
            Active & Recent Tournaments
          </h3>
        </div>
        <span className="text-xs font-mono text-[var(--text-muted)]">
          {competitions.length} Available Lobbies
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {competitions.map((comp) => {
          const isActive = comp.status === 'active' || comp.status === 'waiting';

          return (
            <div
              key={comp.code}
              className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] flex flex-col justify-between hover:border-[var(--accent)] transition-all group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-md bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] text-[var(--accent)] text-[10px] font-mono font-bold">
                    {comp.code}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md ${
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border)]'
                    }`}
                  >
                    {isActive ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Live</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-slate-400" />
                        <span>Finished</span>
                      </>
                    )}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-[var(--text-primary)] font-mono truncate" title={comp.name}>
                  {comp.name}
                </h4>

                <div className="mt-2 flex items-center gap-3 text-xs font-mono text-[var(--text-secondary)]">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <span>{comp.participants_count} Typists</span>
                  </span>
                  <span>•</span>
                  <span>{comp.challenge_type === 'words' ? `${comp.target_limit} Words` : `${comp.target_limit}s Trial`}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate(`/workstation?competition=${comp.code}`)}
                className="mt-4 w-full py-2 px-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-primary)] hover:text-[var(--accent)] text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{isActive ? 'Enter Tournament' : 'View Results'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LeaderboardCompetitions;

