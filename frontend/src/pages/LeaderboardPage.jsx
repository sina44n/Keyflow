/**
 * KEYFLOW Global Leaderboard Page
 * ===============================
 * Real, data-driven Top 10 typing leaderboard powered by registered KEYFLOW typists.
 * Implements:
 * 1. Overview platform statistics cards (Registered Typists, Active, Top Speed, Season Timer)
 * 2. Period filters: Daily, Weekly, Monthly, All Time
 * 3. Category selectors: Speed Ranking (Net WPM), Accuracy Ranking (%), Overall Ranking
 * 4. Top 3 Podium showcase with prominent gold champion card & silver/bronze cards
 * 5. Top 10 Performance SVG chart
 * 6. Detailed Global Ranking Table with user highlight
 * 7. Authenticated "My Rank" status card / Guest sign-in call to action
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { leaderboardAPI } from '../utils/api';
import { LeaderboardOverview } from '../components/leaderboard/LeaderboardOverview';
import { LeaderboardFilters } from '../components/leaderboard/LeaderboardFilters';
import { LeaderboardPodium } from '../components/leaderboard/LeaderboardPodium';
import { LeaderboardChart } from '../components/leaderboard/LeaderboardChart';
import { LeaderboardTable } from '../components/leaderboard/LeaderboardTable';
import { MyRankCard } from '../components/leaderboard/MyRankCard';
import { Trophy, AlertCircle, RefreshCw } from 'lucide-react';

export const LeaderboardPage = () => {
  const { user, isAuthenticated } = useAuth();

  const [period, setPeriod] = useState('all_time');
  const [category, setCategory] = useState('speed');
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch leaderboard data from DRF API
  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await leaderboardAPI.getLeaderboard({
        period,
        category,
        limit: 10,
      });
      setLeaderboardData(response.data);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
      setError('Unable to load leaderboard telemetry. Please check your connection and retry.');
    } finally {
      setIsLoading(false);
    }
  }, [period, category]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Live countdown timer for active seasons (Daily / Weekly / Monthly)
  useEffect(() => {
    if (!leaderboardData?.stats?.period_time_remaining) return;

    const interval = setInterval(() => {
      setLeaderboardData((prev) => {
        if (!prev?.stats?.period_time_remaining) return prev;
        const currentSecs = prev.stats.period_time_remaining.total_seconds;
        if (currentSecs <= 0) return prev;

        const nextSecs = currentSecs - 1;
        const days = Math.floor(nextSecs / 86400);
        const hours = Math.floor((nextSecs % 86400) / 3600);
        const minutes = Math.floor((nextSecs % 3600) / 60);
        const seconds = nextSecs % 60;

        return {
          ...prev,
          stats: {
            ...prev.stats,
            period_time_remaining: {
              ...prev.stats.period_time_remaining,
              total_seconds: nextSecs,
              days,
              hours,
              minutes,
              seconds,
              formatted:
                days > 0
                  ? `${String(days).padStart(2, '0')} : ${String(hours).padStart(2, '0')} : ${String(minutes).padStart(2, '0')}`
                  : `${String(hours).padStart(2, '0')} : ${String(minutes).padStart(2, '0')} : ${String(seconds).padStart(2, '0')}`,
            },
          },
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [leaderboardData?.stats?.period_time_remaining?.total_seconds]);

  const topThree = leaderboardData?.entries ? leaderboardData.entries.slice(0, 3) : [];

  return (
    <main className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[var(--border)]">
          <div>
            {error ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-xs font-mono text-red-500 dark:text-red-400 font-semibold mb-3">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span>Telemetry Offline — Backend Unreachable</span>
              </div>
            ) : isLoading && !leaderboardData ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] text-xs font-mono text-[var(--text-muted)] font-semibold mb-3">
                <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
                <span>Connecting to Telemetry Network...</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] border border-[color-mix(in_srgb,var(--accent)_25%,transparent)] text-xs font-mono text-[var(--accent)] font-semibold mb-3">
                <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-ping" />
                <span>Verified Global Telemetry</span>
              </div>
            )}
            <h1 className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-[var(--text-primary)] flex items-center gap-3">
              <Trophy className="w-8 h-8 text-[var(--accent)] shrink-0" />
              <span>Leaderboard</span>
            </h1>
            <p className="mt-2 text-sm sm:text-base font-mono text-[var(--text-secondary)] max-w-2xl">
              Authentic typing performance records from registered KEYFLOW typists. Ranked by precision metrics in real time.
            </p>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={fetchLeaderboard}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 font-bold transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Section A: Platform Overview Cards */}
        <LeaderboardOverview stats={leaderboardData?.stats} period={period} />

        {/* Section B: Filters (Period & Category) */}
        <LeaderboardFilters
          period={period}
          setPeriod={setPeriod}
          category={category}
          setCategory={setCategory}
          isLoading={isLoading}
          onRefresh={fetchLeaderboard}
        />

        {/* Section C: Top 3 Podium Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Podium Contenders
            </h2>
            <span className="text-xs font-mono text-[var(--text-muted)]">
              {period === 'all_time' ? 'All-Time Champions' : `Top 3 for ${period}`}
            </span>
          </div>
          <LeaderboardPodium topThree={topThree} category={category} period={period} />
        </div>

        {/* Section D: Top 10 Performance Graph */}
        <LeaderboardChart entries={leaderboardData?.entries} category={category} />

        {/* Section E: Detailed Global Ranking Table */}
        <LeaderboardTable
          entries={leaderboardData?.entries}
          currentUserId={user?.id}
          currentUsername={user?.username}
          period={period}
        />

        {/* Section F: My Standing Card / Guest Sign-In CTA */}
        <MyRankCard
          myRank={leaderboardData?.my_rank}
          isAuthenticated={isAuthenticated}
          user={user}
          period={period}
        />
      </div>
    </main>
  );
};

export default LeaderboardPage;

