import React from 'react';
import { Layers, Lock, CheckCircle2 } from 'lucide-react';

/**
 * AcademyCurriculumSidebar
 * =========================================================================
 * Independent curriculum navigation panel inspired by the reference designs.
 * - Displays all 30 units of the selected stage (or across all stages)
 * - Independent smooth vertical scrolling container
 * - 4-stage progress dots indicator showing completion ratio
 * - Fully synchronized with the main level grid
 * - Allows users to browse all units, while keeping locked status visually clear
 * - Semantic CSS token consumption for 100% theme fidelity
 */
export const AcademyCurriculumSidebar = ({
  activeUnit = 1,
  onSelectUnit,
  unitsData = [],
  unitProgress = {},
  unlockedUnitCount = 1,
}) => {
  const units = unitsData.length > 0 ? unitsData : [];
  const totalUnits = units.length || 70;

  return (
    <aside
      className="w-full lg:w-64 xl:w-72 shrink-0 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-3.5 space-y-3 shadow-md lg:sticky lg:top-20 self-start"
      aria-label="Curriculum Units Navigation"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[var(--accent)]" />
          <h2 className="text-xs font-mono font-bold tracking-wider uppercase text-[var(--text-primary)]">
            Curriculum
          </h2>
        </div>
        <span className="text-[11px] font-mono text-[var(--text-muted)]">
          Unit {activeUnit} / {totalUnits}
        </span>
      </div>

      {/* Units List Container with Independent Smooth Scrolling */}
      <div className="space-y-1.5 max-h-[660px] overflow-y-auto pr-1 no-scrollbar">
        {units.map((u) => {
          const isSelected = u.unitNumber === activeUnit;
          const isUnlocked = u.unitNumber <= unlockedUnitCount;
          const defaultTotal = u.lessonsCount || 10;
          const progress = unitProgress[u.unitNumber] || { completed: false, count: 0, total: defaultTotal };
          const completedRatio = Math.min(1, (progress.count || 0) / (progress.total || defaultTotal));

          return (
            <button
              key={u.unitNumber}
              type="button"
              onClick={() => onSelectUnit(u.unitNumber)}
              className={`w-full text-left p-2.5 rounded-xl border transition-all duration-150 cursor-pointer flex flex-col gap-1 ${
                isSelected
                  ? 'bg-[var(--bg-elevated)] border-2 border-[var(--accent)] shadow-sm'
                  : isUnlocked
                  ? 'bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--accent)]/50 hover:bg-[var(--bg-elevated)]/60'
                  : 'bg-[var(--bg-card)]/70 border border-[var(--border-subtle)] hover:border-[var(--accent)]/40 hover:bg-[var(--bg-elevated)]/40'
              }`}
            >
              {/* Unit Title + 4 Progress Dots */}
              <div className="flex items-center justify-between">
                <span className={`text-xs font-mono font-bold ${
                  isSelected
                    ? 'text-[var(--accent)]'
                    : isUnlocked
                    ? 'text-[var(--text-primary)]'
                    : 'text-[var(--text-muted)]'
                }`}>
                  Unit {u.unitNumber}
                </span>

                {/* 4-Stage Progress Dots Indicator */}
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4].map((dotIdx) => {
                    const isDotCompleted = completedRatio >= dotIdx * 0.25;
                    const isDotActive = isSelected && !isDotCompleted && dotIdx === 1;

                    return (
                      <span
                        key={dotIdx}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          isDotCompleted
                            ? 'bg-[#34A853] shadow-[0_0_3px_#34A853]'
                            : isDotActive
                            ? 'bg-[var(--accent)] animate-pulse'
                            : 'bg-[var(--border)]'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Subtitle & Status Icon */}
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] text-[var(--text-secondary)] truncate max-w-[170px]">
                  {u.unitLabel}
                </span>
                {progress.completed && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#34A853] shrink-0" />
                )}
                {!isUnlocked && (
                  <Lock className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
