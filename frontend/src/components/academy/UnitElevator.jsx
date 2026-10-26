import React from 'react';
import { Layers, Lock, CheckCircle2 } from 'lucide-react';

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
      className="w-full lg:w-56 shrink-0 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] p-3.5 space-y-3 shadow-xl sticky top-20 self-start"
      aria-label="Unit Elevator"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[var(--accent)]" />
          <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-[var(--text-primary)]">
            Unit Elevator
          </h2>
        </div>
        <span className="text-[10px] font-mono text-[var(--text-muted)]">
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
                  ? 'bg-[var(--bg-elevated)] border-[var(--accent)] shadow-[0_0_14px_color-mix(in_srgb,var(--accent)_30%,transparent)]'
                  : isUnlocked
                  ? 'bg-[var(--bg-card)] border-[var(--border)] hover:border-[var(--accent)]/40 hover:bg-[var(--bg-elevated)]'
                  : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-mono font-bold ${isSelected ? 'text-[var(--accent)]' : isUnlocked ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
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
                            ? 'bg-[var(--ui-success)] shadow-[0_0_4px_var(--ui-success)]'
                            : isDotCurrent
                            ? 'bg-[var(--accent)] shadow-[0_0_4px_var(--accent)] animate-pulse'
                            : 'bg-[var(--border)]'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Unit Title Subtitle */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[var(--text-secondary)] truncate max-w-[140px]">
                  {u.unitLabel}
                </span>
                {progress.completed && (
                  <CheckCircle2 className="w-3 h-3 text-[var(--ui-success)] shrink-0" />
                )}
                {!isUnlocked && (
                  <Lock className="w-2.5 h-2.5 text-[var(--text-muted)] shrink-0" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
