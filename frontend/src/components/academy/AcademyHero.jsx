import React from 'react';
import { ProgressStats } from './ProgressStats';

/**
 * AcademyHero
 * =========================================================================
 * Header dashboard section inspired by Reference B.
 * Left: Typography with glowing red accent.
 * Right: 3 compact statistics cards.
 */
export const AcademyHero = ({
  overallProgress = 38,
  completedUnits = 7,
  totalUnits = 20,
  streak = 5,
  accuracy = 96,
  accuracyChange = '+2%',
}) => {
  return (
    <section className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pt-2 pb-6 border-b border-[#1C2533]">
      {/* Left Typography */}
      <div className="max-w-xl space-y-2">
        <div className="inline-flex items-center gap-2">
          <span className="text-xs font-mono font-bold tracking-widest text-[#FF1744] uppercase">
            TYPING ACADEMY
          </span>
          <span className="w-6 h-[1px] bg-[#FF1744]/40" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#F5F7FA] leading-tight">
          Your <span className="text-[#FF1744] drop-shadow-[0_0_16px_rgba(255,23,68,0.55)]">next level</span> starts here.
        </h1>

        <p className="text-sm text-[#A6B0C0] leading-relaxed">
          Build your typing skills, track your progress and unlock new challenges. One lesson at a time.
        </p>
      </div>

      {/* Right Stats Stack */}
      <ProgressStats
        overallProgress={overallProgress}
        completedUnits={completedUnits}
        totalUnits={totalUnits}
        streak={streak}
        accuracy={accuracy}
        accuracyChange={accuracyChange}
      />
    </section>
  );
};
