/**
 * KEYFLOW Global Leaderboard Page
 * ===============================
 * Exact MasterTyper Reference Image 4 & 5 Layout Match:
 * 1. Centered Header: "⚡ Live Rankings", large "Leaderboard", "See how you rank against other typists"
 * 2. Centered Scope Navigation (Row 1): Global | Weekly | Competitions
 * 3. Centered Duration Selector (Row 2): 15s | 30s | 60s | 120s
 * 4. Competitive 3-Player Podium: Left #2 (Silver), Center #1 (Gold, elevated with Crown), Right #3 (Pink)
 * 5. Explainer Banner: "ⓘ Ranked by Score = WPM × Accuracy%..."
 * 6. Top 10 Performance Bar Chart: dynamic domain scaling so tallest bar occupies ~88% of plot height
 * 7. Subordinate Telemetry Overview Cards & Global Rankings Table
 * 8. My Rank Card / Guest Sign-in CTA
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { leaderboardAPI } from '../utils/api';
import { LeaderboardOverview } from '../components/leaderboard/LeaderboardOverview';
import { LeaderboardFilters } from '../components/leaderboard/LeaderboardFilters';
import { LeaderboardPodium } from '../components/leaderboard/LeaderboardPodium';
import { LeaderboardChart } from '../components/leaderboard/LeaderboardChart';
import { LeaderboardTable } from '../components/leaderboard/LeaderboardTable';
import { LeaderboardCompetitions } from '../components/leaderboard/LeaderboardCompetitions';
import { MyRankCard } from '../components/leaderboard/MyRankCard';
import { Zap, AlertCircle, RefreshCw } from 'lucide-react';

export const LeaderboardPage = () => {
  const { user, isAuthenticated } = useAuth();

  const [scope, setScope] = useState('global');
  const [period, setPeriod] = useState('all_time');
  const [category, setCategory] = useState('speed');
  const [duration, setDuration] = useState('15');
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch leaderboard data from DRF API with exact duration filtering
  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await leaderboardAPI.getLeaderboard({
        scope,
        period: scope === 'weekly' ? 'weekly' : period,
        category,
        duration,
        limit: 10,
      });
      setLeaderboardData(response.data);
    } catch (err) {
      console.error('Failed to load leaderboard telemetry:', err);
      setError('Unable to connect to live telemetry network. Please retry.');
    } finally {
      setIsLoading(false);
    }
  }, [scope, period, category, duration]);

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
    <main className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors duration-240 ease-[cubic-bezier(0.22,1,0.36,1)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* PHASE 2: Centered Leaderboard Heading (Exact Reference Image 4 Match) */}
        <div className="text-center space-y-2 pt-2 pb-1">
          {/* Top Live Rankings Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-xs font-mono text-amber-600 dark:text-amber-400 font-bold mb-1">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>Live Rankings</span>
          </div>

          {/* Centered Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-mono tracking-tight text-[var(--text-primary)]">
            Leaderboard
          </h1>

          {/* Centered Subtitle */}
          <p className="text-sm sm:text-base font-mono text-[var(--text-secondary)] max-w-lg mx-auto">
            See how you rank against other typists
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 dark:text-red-400 flex items-center justify-between text-xs font-mono max-w-2xl mx-auto">
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

        {/* PHASE 3: Clean Filter Placement Directly Beneath Heading (Reference Image 4) */}
        <LeaderboardFilters
          scope={scope}
          setScope={setScope}
          period={period}
          setPeriod={setPeriod}
          category={category}
          setCategory={setCategory}
          duration={duration}
          setDuration={setDuration}
          isLoading={isLoading}
          onRefresh={fetchLeaderboard}
          timeRemaining={leaderboardData?.stats?.period_time_remaining}
        />

        {/* Competitive 3-Player Podium (Exact Reference Image 4 Match) */}
        <div className="pt-2">
          <LeaderboardPodium
            topThree={topThree}
            category={category}
            period={scope === 'weekly' ? 'weekly' : `${duration}s`}
            currentUserId={user?.id}
          />
        </div>

        {/* Global Rankings Table directly beneath Podium (Reference Image 4) */}
        <LeaderboardTable
          entries={leaderboardData?.entries}
          currentUserId={user?.id}
          currentUsername={user?.username}
          period={scope === 'weekly' ? 'weekly' : `${duration}s`}
        />

        {/* Full-Size Top 10 Performance Curve Chart (Reference Image 5) */}
        <LeaderboardChart entries={leaderboardData?.entries} category={category} />

        {/* Tournament Lobbies Browser (rendered when scope === 'competitions') */}
        {scope === 'competitions' && (
          <LeaderboardCompetitions competitions={leaderboardData?.competitions} />
        )}

        {/* Platform Overview Cards (Subordinate Telemetry Section) */}
        <div className="space-y-3 pt-4">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Platform Benchmarks & Community Telemetry
          </h2>
          <LeaderboardOverview
            stats={leaderboardData?.stats}
            period={scope === 'weekly' ? 'weekly' : period}
          />
        </div>

        {/* Personal Rank / Guest CTA */}
        <MyRankCard
          myRank={leaderboardData?.my_rank}
          isAuthenticated={isAuthenticated}
          user={user}
          period={scope === 'weekly' ? 'weekly' : `${duration}s`}
        />
      </div>
    </main>
  );
};

export default LeaderboardPage;
