/**
 * KEYFLOW Leaderboard Podium Cards
 * =================================
 * Precision reproduction of MasterTyper Reference Image 4:
 * - Second place on the LEFT (Silver / Gray)
 * - First place in the CENTER (Gold / Yellow, elevated and prominent)
 * - Third place on the RIGHT (Soft Pink)
 * - Floating Gold Crown on Rank 1, Silver medal on Rank 2, Pink medal on Rank 3
 * - Top floating circular avatars with colored rings
 * - Large numerical score in center with WPM · Accuracy sub-line
 * - Solid colored full-width footer strip with Rank numbers (#2, #1, #3)
 * - Graceful unclaimed contender slots with Workstation action
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Medal, Zap, UserCheck, ArrowRight } from 'lucide-react';

export const LeaderboardPodium = ({ topThree, category, period, currentUserId }) => {
  const navigate = useNavigate();

  // Layout strictly mirrors Reference Image 4: Left is #2 (Silver), Center is #1 (Gold), Right is #3 (Pink)
  const podiumCards = [
    {
      targetRank: 2,
      title: '2nd Place',
      colorTheme: 'silver',
      desktopOrder: 'md:order-1',
      desktopHeight: 'md:h-[320px]',
      elevationClass: 'md:translate-y-0',
      cardBg: 'bg-[#F8FAFC]',
      cardBorder: 'border border-[#CBD5E1] shadow-sm',
      avatarRing: 'border-2 border-slate-300 bg-slate-100 text-slate-800',
      iconColor: 'text-slate-400',
      icon: Medal,
      scoreColor: 'text-[#3B49DF]',
      bottomStripBg: 'bg-[#CBD5E1] text-[#1E293B] font-black',
    },
    {
      targetRank: 1,
      title: 'Champion',
      colorTheme: 'gold',
      desktopOrder: 'md:order-2',
      desktopHeight: 'md:h-[356px]',
      elevationClass: 'md:-translate-y-4 z-10',
      cardBg: 'bg-[#FFFDF5]',
      cardBorder: 'border-2 border-amber-400 shadow-[0_12px_36px_rgba(245,158,11,0.20)]',
      avatarRing: 'border-2 border-amber-400 bg-amber-100 text-amber-900',
      iconColor: 'text-amber-500 drop-shadow-[0_2px_6px_rgba(245,158,11,0.5)]',
      icon: Crown,
      scoreColor: 'text-[#3B49DF]',
      bottomStripBg: 'bg-amber-400 text-amber-950 font-black',
    },
    {
      targetRank: 3,
      title: '3rd Place',
      colorTheme: 'pink',
      desktopOrder: 'md:order-3',
      desktopHeight: 'md:h-[320px]',
      elevationClass: 'md:translate-y-0',
      cardBg: 'bg-[#FFF5F7]',
      cardBorder: 'border border-[#FECDD3] shadow-sm',
      avatarRing: 'border-2 border-pink-300 bg-pink-100 text-pink-700',
      iconColor: 'text-pink-400',
      icon: Medal,
      scoreColor: 'text-[#E11D48]',
      bottomStripBg: 'bg-[#FECDD3] text-[#E11D48] font-black',
    },
  ];

  const getInitials = (name) => {
    if (!name) return 'KF';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getPrimaryScore = (player) => {
    if (!player) return '--';
    if (category === 'speed') return player.net_wpm.toFixed(0);
    if (category === 'accuracy') return `${player.accuracy.toFixed(0)}%`;
    return player.score.toFixed(0);
  };

  const getScoreUnit = () => {
    if (category === 'speed') return 'Net WPM';
    if (category === 'accuracy') return 'Accuracy';
    return 'Score';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto w-full pt-8 pb-4 items-end">
      {podiumCards.map((slot) => {
        // Map targetRank to player (Rank 1 -> index 0, Rank 2 -> index 1, Rank 3 -> index 2)
        const player = topThree ? topThree[slot.targetRank - 1] : null;
        const Icon = slot.icon;
        const isCurrentUser = Boolean(currentUserId && player && player.user_id === currentUserId);

        if (!player) {
          // Unclaimed Contender Position (Reference-matching layout)
          const unclaimedHeight = slot.targetRank === 1 ? 'md:h-[356px]' : 'md:h-[320px]';
          return (
            <div
              key={slot.targetRank}
              className={`relative rounded-3xl overflow-hidden border border-dashed border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/40 flex flex-col justify-between h-auto ${unclaimedHeight} transition-all duration-200 ${slot.desktopOrder} ${slot.elevationClass}`}
            >
              {/* Top Medal Icon & Avatar Placeholder */}
              <div className="pt-6 px-4 flex flex-col items-center text-center">
                <div className="w-6 h-6 mb-1 flex items-center justify-center">
                  <Icon className={`w-5 h-5 ${slot.iconColor} opacity-50`} />
                </div>
                <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center font-mono font-bold text-sm text-slate-500 mb-3">
                  #{slot.targetRank}
                </div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] font-mono">
                  Awaiting Contender
                </h3>
                <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
                  Slot #{slot.targetRank} for {period}
                </p>
              </div>

              <div className="px-5 my-3 text-center">
                <button
                  type="button"
                  onClick={() => navigate('/workstation')}
                  className="w-full py-2 px-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--accent)] text-xs font-mono font-bold text-[var(--text-primary)] hover:text-[var(--accent)] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>Claim #{slot.targetRank} Now</span>
                </button>
              </div>

              {/* Bottom Rank Bar */}
              <div className="w-full py-2.5 text-center font-mono font-black text-xs tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 border-t border-slate-200 dark:border-slate-700">
                #{slot.targetRank} UNCLAIMED
              </div>
            </div>
          );
        }

        // Active Ranked Typist Card (Exact Reference Image 4 Layout)
        return (
          <div
            key={slot.targetRank}
            className={`relative rounded-3xl overflow-hidden ${slot.cardBg} ${slot.cardBorder} flex flex-col justify-between h-auto ${slot.desktopHeight} transition-all duration-200 hover:-translate-y-1.5 ${
              slot.desktopOrder
            } ${slot.elevationClass} ${
              isCurrentUser ? 'ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg-main)]' : ''
            }`}
          >
            {/* Top Floating Icon & Circular Avatar (Reference Image 4) */}
            <div className="pt-6 px-4 flex flex-col items-center text-center">
              {/* Crown for #1, Medal for #2 & #3 */}
              <div className="w-7 h-7 mb-1 flex items-center justify-center">
                <Icon
                  className={`w-6 h-6 ${slot.iconColor} ${
                    slot.targetRank === 1 ? 'animate-bounce drop-shadow-[0_2px_8px_rgba(245,158,11,0.6)]' : ''
                  }`}
                />
              </div>

              {/* Circular Avatar */}
              <div className="relative mb-3">
                {player.avatar_url ? (
                  <img
                    src={player.avatar_url}
                    alt={player.display_name}
                    className={`w-14 h-14 rounded-full object-cover shadow-sm ${slot.avatarRing}`}
                  />
                ) : (
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center font-mono font-black text-lg shadow-sm ${slot.avatarRing}`}
                  >
                    {getInitials(player.display_name || player.username)}
                  </div>
                )}

                {isCurrentUser && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-[var(--accent)] text-[var(--accent-fg)] text-[9px] font-mono font-bold flex items-center gap-0.5 shadow-sm">
                    <UserCheck className="w-2.5 h-2.5" />
                    <span>YOU</span>
                  </span>
                )}
              </div>

              {/* Player Display Name */}
              <h3
                className="font-bold text-sm sm:text-base text-[#1E293B] truncate max-w-full px-2"
                title={player.display_name}
              >
                {player.display_name || player.username}
              </h3>
              <p className="text-[11px] font-mono text-[#64748B] truncate max-w-full">
                @{player.username}
              </p>
            </div>

            {/* Large Primary Score in Center (Reference Image 4: e.g. 62, 60, 45) */}
            <div className="my-2 text-center">
              <div className="font-mono font-black text-5xl tracking-tight leading-none">
                <span className={slot.scoreColor}>{getPrimaryScore(player)}</span>
              </div>
              <p className="text-[10px] font-mono font-bold text-[#64748B] mt-1 uppercase tracking-wider">
                {getScoreUnit()}
              </p>

              {/* Sub-Metric Line (Reference Image 4: e.g. "63 WPM · 98%") */}
              <div className="mt-2 flex items-center justify-center gap-1.5 text-xs font-mono text-[#64748B] font-semibold">
                <span>{player.net_wpm.toFixed(0)} WPM</span>
                <span>•</span>
                <span>{player.accuracy.toFixed(0)}% Accuracy</span>
              </div>
            </div>

            {/* Bottom Solid Rank Footer Strip (Reference Image 4: #2, #1, #3) */}
            <div
              className={`w-full py-2.5 text-center font-mono font-black text-sm tracking-wider ${slot.bottomStripBg}`}
            >
              #{slot.targetRank}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default LeaderboardPodium;
