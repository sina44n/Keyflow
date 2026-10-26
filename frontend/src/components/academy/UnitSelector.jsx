import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Lock, Check } from 'lucide-react';

/**
 * UnitSelector
 * =========================================================================
 * 20 horizontal unit pills (01 to 20) with cybernetic glowing red active state,
 * smooth scrolling, and full responsive behavior.
 */
export const UnitSelector = ({
  activeUnit = 1,
  onSelectUnit,
  unitProgress = {},
  unlockedUnitCount = 20,
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

  const units = Array.from({ length: 20 }, (_, i) => i + 1);

  return (
    <div className="relative w-full">
      {/* Scroll Controls on desktop if scrollable */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={scrollLeft}
          className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg bg-[#090C12] border border-[#222B38] text-[#A6B0C0] hover:text-white hover:border-[#FF1744] transition-colors shrink-0 cursor-pointer"
          aria-label="Scroll units left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Units Scroll Container */}
        <div
          ref={scrollRef}
          role="tablist"
          aria-label="Select Unit"
          className="flex-1 flex items-center gap-2 p-1.5 rounded-2xl bg-[#090C12] border border-[#222B38] overflow-x-auto scrollbar-none scroll-smooth"
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
                    ? 'bg-[#FF1744] text-white shadow-[0_0_16px_rgba(255,23,68,0.45)] border border-[#FF304F]'
                    : isUnlocked
                    ? 'bg-[#0B1018] text-[#A6B0C0] border border-[#222B38] hover:border-[#FF1744]/50 hover:text-white'
                    : 'bg-[#070A0F] text-[#475569] border border-[#17202C] opacity-50 cursor-not-allowed'
                }`}
              >
                <span>{formatted}</span>
                {progress.completed && !isSelected && (
                  <Check className="w-3 h-3 text-[#22D889]" />
                )}
                {!isUnlocked && (
                  <Lock className="w-2.5 h-2.5 text-[#475569]" />
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={scrollRight}
          className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg bg-[#090C12] border border-[#222B38] text-[#A6B0C0] hover:text-white hover:border-[#FF1744] transition-colors shrink-0 cursor-pointer"
          aria-label="Scroll units right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
