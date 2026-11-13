/**
 * Module 06: Global Leaderboard Administration
 * Inspects top platform typists, tracks integrity, and allows purging anomalies (>350 WPM).
 */

import React, { useState, useEffect } from 'react';
import { Trophy, RefreshCw, AlertTriangle, ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react';
import { adminApi } from '../adminApi';
import { ConfirmModal } from '../components/ConfirmModal';

export const AdminLeaderboardPage = () => {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Recalculate State
  const [isRecalculateModalOpen, setIsRecalculateModalOpen] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getLeaderboardAdmin();
      setEntries(res.data?.leaderboard || []);
    } catch (err) {
      console.error('Failed to load admin leaderboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      const res = await adminApi.recalculateLeaderboard();
      alert(`Leaderboard integrity audit complete. Purged ${res.data?.purged_anomalies || 0} impossible anomalies.`);
      setIsRecalculateModalOpen(false);
      fetchLeaderboard();
    } catch (err) {
      alert('Failed to audit leaderboard.');
    } finally {
      setIsRecalculating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-[#E8E5F0] p-5 rounded-xl shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-[#29243B] flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span>Leaderboard Administration & Integrity</span>
          </h2>
          <p className="text-xs text-[#77748B] mt-1">
            Authoritative ranking data and anti-cheat anomaly scrubber.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={() => setIsRecalculateModalOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-[#7357D9] hover:bg-[#6246C5] text-white text-xs font-semibold flex items-center space-x-2 transition-all shadow-sm"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Audit & Purge Anomalies</span>
          </button>

          <button
            onClick={fetchLeaderboard}
            disabled={isLoading}
            className="p-2 rounded-lg bg-[#F0EDFF] hover:bg-[#EEEAFE] text-[#51419A] border border-[#D6D0E8] transition-colors shadow-sm"
            title="Refresh leaderboard"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#7357D9]' : 'text-[#7357D9]'}`} />
          </button>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-xl bg-white border border-[#E8E5F0] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#EFEDF5] bg-[#F7F7FC] text-[10px] font-semibold text-[#77748B] uppercase tracking-wider">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Typist</th>
                <th className="py-3 px-4">Net WPM</th>
                <th className="py-3 px-4">Gross WPM</th>
                <th className="py-3 px-4">Accuracy</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4 text-right">Recorded Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFEDF5]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#9692A7]">
                    <Loader2 className="w-6 h-6 animate-spin text-[#7357D9] mx-auto mb-2" />
                    <span>Loading leaderboard rankings...</span>
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-[#9692A7]">
                    No leaderboard entries recorded yet.
                  </td>
                </tr>
              ) : (
                entries.map((entry, idx) => (
                  <tr key={entry.id} className="hover:bg-[#F9F9FD] text-[#29243B] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-xs">
                      {idx === 0 ? (
                        <span className="text-amber-500">#1 👑</span>
                      ) : idx === 1 ? (
                        <span className="text-[#77748B]">#2 🥈</span>
                      ) : idx === 2 ? (
                        <span className="text-amber-700">#3 🥉</span>
                      ) : (
                        <span className="text-[#9692A7]">#{idx + 1}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#29243B]">
                      <span>{entry.username}</span>
                      {entry.email && <span className="block text-[10px] font-mono text-[#9692A7]">{entry.email}</span>}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">{entry.net_wpm} WPM</td>
                    <td className="py-3.5 px-4 font-mono text-[#77748B]">{entry.gross_wpm}</td>
                    <td className="py-3.5 px-4 font-mono text-amber-600">{entry.accuracy}%</td>
                    <td className="py-3.5 px-4 font-mono text-[#77748B]">{entry.duration_seconds}s</td>
                    <td className="py-3.5 px-4 font-mono text-[#9692A7] text-right">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recalculate Modal */}
      <ConfirmModal
        isOpen={isRecalculateModalOpen}
        onClose={() => setIsRecalculateModalOpen(false)}
        onConfirm={handleRecalculate}
        title="Audit & Purge Leaderboard Anomalies?"
        message="This action scans all practice session records and permanently removes any impossible bot or glitched submissions exceeding 350 WPM."
        confirmText="Audit & Purge"
        isDangerous={true}
        isLoading={isRecalculating}
      />
    </div>
  );
};

