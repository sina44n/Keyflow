import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Lock, Check } from 'lucide-react';

/**
 * UnitSelector
 * =========================================================================
 * Responsive stage/unit pills with glowing active state, smooth scrolling,
 * and lock/completed visual cues.
 */
export const UnitSelector = ({
  activeUnit = 1,
  onSelectUnit,
  unitProgress = {},
  unlockedUnitCount = 7,
  totalUnits = 7,
}) => {
  const scrollRef = useRef(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  const units = Array.from({ length: totalUnits }, (_, i) => i + 1);

  return (
    <div className="relative w-full">
      {/* Scroll Controls on desktop if scrollable */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={scrollLeft}
          className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors shrink-0 cursor-pointer"
          aria-label="Scroll units left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Units Scroll Container */}
        <div
          ref={scrollRef}
          role="tablist"
          aria-label="Select Unit"
          className="flex-1 flex items-center gap-2 p-1.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] overflow-x-auto scrollbar-none scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {units.map((unitNum) => {
            const isSelected = unitNum === activeUnit;
            const isUnlocked = unitNum <= unlockedUnitCount;
            const progress = unitProgress[unitNum] || { completed: false, count: 0 };
            const formatted = String(unitNum).padStart(2, '0');

            return (
              <button
                key={unitNum}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-label={`Unit ${formatted}${!isUnlocked ? ' (Locked)' : ''}`}
                onClick={() => isUnlocked && onSelectUnit(unitNum)}
                className={`relative px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all duration-200 shrink-0 cursor-pointer select-none flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[var(--accent)] text-[var(--accent-fg)] border border-[var(--accent-hover)] shadow-sm'
                    : isUnlocked
                    ? 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--accent)]/50 hover:text-[var(--text-primary)]'
                    : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border-subtle)] opacity-50 cursor-not-allowed'
                }`}
              >
                <span>Unit {formatted}</span>
                {progress.completed && !isSelected && (
                  <Check className="w-3 h-3 text-[var(--ui-success)]" />
                )}
                {!isUnlocked && (
                  <Lock className="w-2.5 h-2.5 text-[var(--text-muted)]" />
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={scrollRight}
          className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors shrink-0 cursor-pointer"
          aria-label="Scroll units right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
