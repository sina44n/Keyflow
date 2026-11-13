/**
 * Module 05: Arcade Engine & High Scores Management
 * Monitors gameplay records, high scores, and multiplayer racing sessions.
 */

import React, { useState, useEffect } from 'react';
import { Gamepad2, Trophy, Users, Flame, RefreshCw, Loader2 } from 'lucide-react';
import { adminApi } from '../adminApi';
import { StatCard } from '../components/StatCard';

export const AdminArcadePage = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchArcade = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getArcadeOverview();
      setData(res.data);
    } catch (err) {
      console.error('Failed to load arcade data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArcade();
  }, []);

  const stats = data?.game_stats || [];
  const recentSessions = data?.recent_sessions || [];
  const activeRooms = data?.active_multiplayer_rooms || 0;

  const totalPlays = stats.reduce((acc, curr) => acc + (curr.total_plays || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between bg-white border border-[#E8E5F0] p-5 rounded-xl shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-[#29243B] flex items-center space-x-2">
            <Gamepad2 className="w-5 h-5 text-[#7357D9]" />
            <span>Arcade Engine & High Scores</span>
          </h2>
          <p className="text-xs text-[#77748B] mt-1">
            Real-time telemetry from 3D Nitro Racing, Stickman Warrior Combat, and multiplayer rooms.
          </p>
        </div>

        <button
          onClick={fetchArcade}
          disabled={isLoading}
          className="p-2 rounded-lg bg-[#F0EDFF] hover:bg-[#EEEAFE] text-[#51419A] border border-[#D6D0E8] transition-colors shadow-sm"
          title="Refresh arcade"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#7357D9]' : 'text-[#7357D9]'}`} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Arcade Plays"
          value={isLoading ? '...' : totalPlays.toLocaleString()}
          subtext="Sessions recorded across all modes"
          icon={Gamepad2}
          color="indigo"
        />

        <StatCard
          title="Active Multiplayer Rooms"
          value={isLoading ? '...' : activeRooms.toString()}
          subtext="Live racing lobbies"
          icon={Users}
          color="emerald"
        />

        <StatCard
          title="Game Modes"
          value={stats.length.toString()}
          subtext="Active arcade experiences"
          icon={Trophy}
          color="amber"
        />
      </div>

      {/* Game Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.map((g) => (
          <div
            key={g.game_type}
            className="rounded-xl bg-white border border-[#E8E5F0] p-5 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#EFEDF5] pb-3">
              <span className="font-bold text-[#29243B] uppercase tracking-wider text-xs font-mono">
                {g.game_type}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F0EDFF] text-[#51419A] border border-[#E8E5F0]">
                {g.total_plays} Plays
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] text-[#77748B] block">High Score</span>
                <span className="text-xl font-bold font-mono text-emerald-600">{g.high_score || 0}</span>
              </div>
              <div>
                <span className="text-[11px] text-[#77748B] block">Avg Accuracy</span>
                <span className="text-xl font-bold font-mono text-amber-600">
                  {Math.round(g.avg_accuracy || 0)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Sessions Table */}
      <div className="rounded-xl bg-white border border-[#E8E5F0] p-5 shadow-sm">
        <h3 className="text-sm font-bold text-[#29243B] mb-4 border-b border-[#EFEDF5] pb-3">
          Recent Arcade Gameplay Sessions
        </h3>

        {recentSessions.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#9692A7]">No arcade sessions recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#EFEDF5] text-[10px] font-semibold text-[#77748B] uppercase tracking-wider bg-[#F7F7FC]">
                  <th className="py-2.5 px-3">Typist</th>
                  <th className="py-2.5 px-3">Game Type</th>
                  <th className="py-2.5 px-3">Score</th>
                  <th className="py-2.5 px-3">Accuracy</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEDF5]">
                {recentSessions.map((s) => (
                  <tr key={s.id} className="hover:bg-[#F9F9FD] text-[#29243B] transition-colors">
                    <td className="py-2.5 px-3 font-medium text-[#29243B]">{s.username}</td>
                    <td className="py-2.5 px-3 uppercase font-mono text-[10px] text-[#7357D9]">
                      {s.game_type}
                    </td>
                    <td className="py-2.5 px-3 font-bold font-mono text-emerald-600">{s.score}</td>
                    <td className="py-2.5 px-3 font-mono text-amber-600">{s.accuracy}%</td>
                    <td className="py-2.5 px-3 font-mono text-[#77748B]">{s.duration_seconds}s</td>
                    <td className="py-2.5 px-3 font-mono text-[#9692A7] text-right">
                      {new Date(s.created_at).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

