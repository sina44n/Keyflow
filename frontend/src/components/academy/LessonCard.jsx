import React, { useState } from 'react';
import { Check, Lock, Play, Clock, Star } from 'lucide-react';
import { LessonIllustration } from './LessonIllustration';

/**
 * LessonCard
 * =========================================================================
 * Interactive lesson destination card matching Reference A's visual richness
 * with Reference B's cinematic red & black aesthetic.
 * Four distinct states: Completed, Next Up / Current, Available, Locked.
 */
export const LessonCard = React.forwardRef(({
  lesson,
  isCurrent = false,
  onSelect,
  onLockedClick,
}, ref) => {
  const [isHovered, setIsHovered] = useState(false);

  const isCompleted = !!lesson.record?.completed;
  const isUnlocked = !!lesson.unlocked;
  const isLocked = !isUnlocked;
  const starsEarned = typeof lesson.record?.stars === 'number' ? Math.max(0, Math.min(5, lesson.record.stars)) : 0;
  const formattedNumber = String(lesson.lessonNum).padStart(2, '0');

  const handleClick = (e) => {
    e.preventDefault();
    if (isUnlocked) {
      onSelect(lesson.stageId, lesson.lessonNum);
    } else {
      if (onLockedClick) {
        onLockedClick(lesson.lessonNum);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e);
    }
  };

  // Determine state style tokens
  let cardBorder = 'border-[#222B38]';
  let cardBg = 'bg-[#0B1018]';
  let glowStyle = {};
  let cardOpacity = 'opacity-100';

  if (isCurrent) {
    cardBorder = 'border-[#FF1744]';
    cardBg = 'bg-[#101722]';
    glowStyle = {
      boxShadow: '0 0 24px rgba(255, 23, 68, 0.35), inset 0 0 16px rgba(255, 23, 68, 0.08)',
    };
  } else if (isCompleted) {
    cardBorder = 'border-[#22D889]/40 hover:border-[#22D889]';
    cardBg = 'bg-[#0B1018] hover:bg-[#0E1520]';
  } else if (isLocked) {
    cardBorder = 'border-[#1A222E]';
    cardBg = 'bg-[#080B10]';
    cardOpacity = 'opacity-65 hover:opacity-85';
  } else {
    // Available
    cardBorder = 'border-[#222B38] hover:border-[#FF1744]/60';
    cardBg = 'bg-[#0B1018] hover:bg-[#101722]';
  }

  return (
    <div
      ref={ref}
      tabIndex={isUnlocked ? 0 : 0}
      role="button"
      aria-label={`Lesson ${lesson.lessonNum}: ${lesson.title}. ${isCompleted ? 'Completed' : isCurrent ? 'Next up' : isLocked ? 'Locked' : 'Available'}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={glowStyle}
      className={`relative group rounded-2xl border ${cardBorder} ${cardBg} ${cardOpacity} p-4 flex flex-col justify-between transition-all duration-200 cursor-pointer text-left select-none outline-none focus-visible:ring-2 focus-visible:ring-[#FF1744] min-h-[220px] shadow-lg`}
    >
      {/* Top Header: Lesson Number + State Badge */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className={`font-mono text-base font-extrabold tracking-wider ${isCurrent ? 'text-[#FF1744]' : isCompleted ? 'text-[#22D889]' : isLocked ? 'text-[#6F7B8D]' : 'text-[#F5F7FA]'}`}>
          {formattedNumber}
        </span>

        {/* State Badges */}
        <div>
          {isCurrent && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FF1744] text-white text-[10px] font-mono font-bold tracking-wider uppercase shadow-[0_0_10px_rgba(255,23,68,0.5)]">
              <span>NEXT UP</span>
              <Play className="w-2.5 h-2.5 fill-current" />
            </span>
          )}

          {isCompleted && (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#22D889]/15 border border-[#22D889]/50 text-[#22D889]">
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            </span>
          )}

          {isLocked && (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#151D28] text-[#6F7B8D]">
              <Lock className="w-3.5 h-3.5" />
            </span>
          )}

          {!isCurrent && !isCompleted && !isLocked && (
            <span className="w-2 h-2 rounded-full bg-[#222B38] group-hover:bg-[#FF1744] transition-colors" />
          )}
        </div>
      </div>

      {/* Center: Rich Illustration */}
      <div className="flex items-center justify-center py-2 relative my-auto">
        <LessonIllustration
          lessonIndex={lesson.lessonNum}
          className={`w-full max-w-[130px] h-20 transition-transform duration-300 ${isHovered && isUnlocked ? 'scale-105' : 'scale-100'}`}
        />
        {/* Subtle hover play overlay on available cards */}
        {isHovered && isUnlocked && !isCurrent && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl backdrop-blur-[2px] transition-all">
            <div className="w-9 h-9 rounded-full bg-[#FF1744] text-white flex items-center justify-center shadow-[0_0_15px_#FF1744]">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Metadata: Title, Duration, 5-Star Rating */}
      <div className="mt-2 space-y-2 pt-2 border-t border-[#1C2533]">
        <div className="min-h-[36px] flex flex-col justify-center">
          <h3 className={`text-xs font-bold leading-snug line-clamp-2 transition-colors ${isCurrent ? 'text-white' : isCompleted ? 'text-[#F5F7FA]' : isLocked ? 'text-[#6F7B8D]' : 'text-[#E2E8F0] group-hover:text-white'}`}>
            {lesson.customTitle || lesson.title}
          </h3>
        </div>

        {/* Footer row: Key preview / Duration & Stars */}
        <div className="flex items-center justify-between text-[11px] font-mono">
          {/* Duration or WPM */}
          <div className="flex items-center gap-1.5 text-[#6F7B8D]">
            <Clock className="w-3 h-3 text-[#6F7B8D]" />
            <span>{lesson.estimatedMinutes || '2'} min</span>
            {isCompleted && lesson.record?.bestWpm && (
              <span className="text-[#22D889] font-bold ml-1">{lesson.record.bestWpm} WPM</span>
            )}
          </div>

          {/* 5-Star Rating Indicator */}
          <div className="flex items-center gap-0.5" aria-label={`Rating: ${starsEarned} of 5 stars`}>
            {[1, 2, 3, 4, 5].map((starIndex) => {
              const isFilled = isCompleted ? starIndex <= starsEarned : false;
              return (
                <Star
                  key={starIndex}
                  className={`w-3 h-3 ${isFilled ? 'text-[#FFC247] fill-[#FFC247]' : 'text-[#222B38] fill-[#151D28]'}`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});

LessonCard.displayName = 'LessonCard';
