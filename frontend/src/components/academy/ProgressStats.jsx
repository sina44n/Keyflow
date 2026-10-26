import React from 'react';
import { Flame, Target, TrendingUp } from 'lucide-react';

/**
 * ProgressStats
 * =========================================================================
 * 3 compact, premium statistic cards from Reference B:
 * 1. Overall Progress (circular SVG progress ring)
 * 2. Current Streak (flame icon with red glow)
 * 3. Accuracy (target reticle with trend indicator)
 */
export const ProgressStats = ({
  overallProgress = 38,
  completedUnits = 7,
  totalUnits = 20,
  streak = 5,
  accuracy = 96,
  accuracyChange = '+2%',
}) => {
  // Circular ring calculations
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallProgress / 100) * circumference;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
      {/* 1. Overall Progress Card */}
      <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-[#090C12] border border-[#222B38] shadow-lg min-w-[190px]">
        {/* Circular Progress Ring */}
        <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
          <svg className="w-14 h-14 -rotate-90 transform" viewBox="0 0 60 60">
            {/* Background Track */}
            <circle
              cx="30"
              cy="30"
              r={radius}
              stroke="#1A2330"
              strokeWidth="4"
              fill="transparent"
            />
            {/* Foreground Progress */}
            <circle
              cx="30"
              cy="30"
              r={radius}
              stroke="#FF1744"
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-out"
              style={{
                filter: 'drop-shadow(0 0 5px rgba(255, 23, 68, 0.7))',
              }}
            />
          </svg>
          <span className="absolute font-mono text-xs font-bold text-[#F5F7FA]">
            {overallProgress}%
          </span>
        </div>

        {/* Text */}
        <div className="flex flex-col">
          <span className="text-[11px] font-medium text-[#A6B0C0]">Overall Progress</span>
          <span className="font-mono text-sm font-bold text-[#F5F7FA] mt-0.5">
            {completedUnits} <span className="text-xs text-[#6F7B8D] font-normal">/ {totalUnits} Units</span>
          </span>
        </div>
      </div>

      {/* 2. Current Streak Card */}
      <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#090C12] border border-[#222B38] shadow-lg min-w-[170px]">
        {/* Flame Icon Container with Glow */}
        <div className="w-12 h-12 rounded-xl bg-[#140D12] border border-[#FF1744]/30 flex items-center justify-center shrink-0 shadow-[0_0_14px_rgba(255,23,68,0.25)]">
          <Flame className="w-6 h-6 text-[#FF1744] fill-[#FF1744]/20 animate-pulse" />
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-medium text-[#A6B0C0]">Current Streak</span>
          <span className="font-mono text-base font-bold text-[#F5F7FA] mt-0.5">
            {streak} <span className="text-xs text-[#6F7B8D] font-normal">Days</span>
          </span>
        </div>
      </div>

      {/* 3. Accuracy Card */}
      <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#090C12] border border-[#222B38] shadow-lg min-w-[170px]">
        {/* Target Reticle Icon */}
        <div className="w-12 h-12 rounded-xl bg-[#140D12] border border-[#FF1744]/30 flex items-center justify-center shrink-0 shadow-[0_0_14px_rgba(255,23,68,0.25)]">
          <Target className="w-6 h-6 text-[#FF1744]" />
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-medium text-[#A6B0C0]">Accuracy</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-mono text-base font-bold text-[#F5F7FA]">
              {accuracy}%
            </span>
            {accuracyChange && (
              <span className="inline-flex items-center text-[10px] font-mono font-semibold text-[#22D889] bg-[#22D889]/10 px-1.5 py-0.2 rounded">
                ▲ {accuracyChange}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
