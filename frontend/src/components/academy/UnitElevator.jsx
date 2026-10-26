import React from 'react';
import { Layers, Lock, CheckCircle2, ChevronRight } from 'lucide-react';

/**
 * UnitElevator
 * =========================================================================
 * The right-side vertical learning elevator from Reference A,
 * redesigned in the red-and-black identity of Reference B.
 * Shows Units 1-5 (and expandable/scrollable) with real progress dots,
 * synchronized with the main unit selector.
 */
export const UnitElevator = ({
  activeUnit = 1,
  onSelectUnit,
  unitsData = [],
  unitProgress = {},
  unlockedUnitCount = 20,
}) => {
  // Show first 6 units or primary units for the elevator panel
  const elevatorUnits = unitsData.slice(0, 8);

  return (
    <aside
      className="w-full lg:w-56 shrink-0 rounded-2xl bg-[#090C12] border border-[#222B38] p-3.5 space-y-3 shadow-xl sticky top-20 self-start"
      aria-label="Unit Elevator"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#1E2633]">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#FF1744]" />
          <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-[#F5F7FA]">
            Unit Elevator
          </h2>
        </div>
        <span className="text-[10px] font-mono text-[#6F7B8D]">
          U{String(activeUnit).padStart(2, '0')} / 20
        </span>
      </div>

      {/* Elevator Items List */}
      <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-0.5 scrollbar-thin">
        {elevatorUnits.map((u) => {
          const isSelected = u.unitNumber === activeUnit;
          const isUnlocked = u.unitNumber <= unlockedUnitCount;
          const progress = unitProgress[u.unitNumber] || { completed: false, count: 0, total: 20 };
          const completedRatio = Math.min(1, (progress.count || 0) / (progress.total || 20));

          return (
            <button
              key={u.unitNumber}
              type="button"
              disabled={!isUnlocked}
              onClick={() => isUnlocked && onSelectUnit(u.unitNumber)}
              className={`w-full text-left p-2.5 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col gap-1.5 ${
                isSelected
                  ? 'bg-[#101722] border-[#FF1744] shadow-[0_0_14px_rgba(255,23,68,0.3)]'
                  : isUnlocked
                  ? 'bg-[#0B1018] border-[#1D2533] hover:border-[#FF1744]/40 hover:bg-[#0E1520]'
                  : 'bg-[#070A0E] border-[#151D28] opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-mono font-bold ${isSelected ? 'text-[#FF1744]' : isUnlocked ? 'text-[#F5F7FA]' : 'text-[#6F7B8D]'}`}>
                  Unit {u.unitNumber}
                </span>

                {/* Progress Dots Indicator (like Reference A) */}
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4].map((dotIndex) => {
                    const isDotCompleted = completedRatio >= dotIndex * 0.25;
                    const isDotCurrent = isSelected && !isDotCompleted && dotIndex === 1;

                    return (
                      <span
                        key={dotIndex}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          isDotCompleted
                            ? 'bg-[#22D889] shadow-[0_0_4px_#22D889]'
                            : isDotCurrent
                            ? 'bg-[#FF1744] shadow-[0_0_4px_#FF1744] animate-pulse'
                            : 'bg-[#222B38]'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Unit Title Subtitle */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#A6B0C0] truncate max-w-[140px]">
                  {u.unitLabel}
                </span>
                {progress.completed && (
                  <CheckCircle2 className="w-3 h-3 text-[#22D889] shrink-0" />
                )}
                {!isUnlocked && (
                  <Lock className="w-2.5 h-2.5 text-[#6F7B8D] shrink-0" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
