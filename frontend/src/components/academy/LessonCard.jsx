import React, { useState } from 'react';
import { Check, Lock, Play, Clock, Star } from 'lucide-react';
import { LessonIllustration } from './LessonIllustration';
import { useI18n } from '../../i18n/I18nContext';

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
  const { t } = useI18n();
  const [isHovered, setIsHovered] = useState(false);

  const isCompleted = !!lesson.record?.completed;
  const isUnlocked = !!lesson.unlocked;
  const isLocked = !isUnlocked;
  const starsEarned = typeof lesson.record?.stars === 'number' ? Math.max(0, Math.min(5, lesson.record.stars)) : 0;
  const levelNum = lesson.lessonNum || lesson.levelNumber || 1;
  const formattedNumber = String(levelNum).padStart(3, '0');

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
  let cardBorder = 'border-[var(--border)]';
  let cardBg = 'bg-[var(--bg-card)]';
  let glowStyle = {};
  let cardOpacity = 'opacity-100';

  if (isCurrent) {
    cardBorder = 'border-[var(--accent)]';
    cardBg = 'bg-[var(--bg-elevated)]';
    glowStyle = {
      boxShadow: '0 0 24px color-mix(in srgb, var(--accent) 35%, transparent), inset 0 0 16px color-mix(in srgb, var(--accent) 8%, transparent)',
    };
  } else if (isCompleted) {
    cardBorder = 'border-[var(--ui-success)]/40 hover:border-[var(--ui-success)]';
    cardBg = 'bg-[var(--bg-card)] hover:bg-[var(--bg-elevated)]';
  } else if (isLocked) {
    cardBorder = 'border-[var(--border-subtle)]';
    cardBg = 'bg-[var(--bg-surface)]';
    cardOpacity = 'opacity-65 hover:opacity-85';
  } else {
    // Available
    cardBorder = 'border-[var(--border)] hover:border-[var(--accent)]/60';
    cardBg = 'bg-[var(--bg-card)] hover:bg-[var(--bg-elevated)]';
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
      className={`relative group rounded-2xl border ${cardBorder} ${cardBg} ${cardOpacity} p-4 flex flex-col justify-between transition-all duration-200 cursor-pointer text-left select-none outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] min-h-[220px] shadow-lg`}
    >
      {/* Top Header: Lesson Number + State Badge */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-baseline gap-1.5">
          <span className={`font-mono text-base font-extrabold tracking-wider ${isCurrent ? 'text-[var(--accent)]' : isCompleted ? 'text-[var(--ui-success)]' : isLocked ? 'text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>
            {formattedNumber}
          </span>
          {lesson.id && (
            <span className="text-[10px] font-mono text-[var(--text-muted)] opacity-60">
              {lesson.id}
            </span>
          )}
        </div>

        {/* State Badges */}
        <div>
          {isCurrent && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--accent)] text-[var(--accent-fg)] text-[10px] font-mono font-bold tracking-wider uppercase shadow-[0_0_10px_color-mix(in_srgb,var(--accent)_50%,transparent)]">
              <span>{t('academy.continueLesson')}</span>
              <Play className="w-2.5 h-2.5 fill-current" />
            </span>
          )}

          {isCompleted && (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--ui-success)]/15 border border-[var(--ui-success)]/50 text-[var(--ui-success)]">
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            </span>
          )}

          {isLocked && (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--border-subtle)] text-[var(--text-muted)]">
              <Lock className="w-3.5 h-3.5" />
            </span>
          )}

          {!isCurrent && !isCompleted && !isLocked && (
            <span className="w-2 h-2 rounded-full bg-[var(--border)] group-hover:bg-[var(--accent)] transition-colors" />
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
            <div className="w-9 h-9 rounded-full bg-[var(--accent)] text-[var(--accent-fg)] flex items-center justify-center shadow-[0_0_15px_var(--accent)]">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Metadata: Title, Duration, 5-Star Rating */}
      <div className="mt-2 space-y-2 pt-2 border-t border-[var(--border)]">
        <div className="min-h-[36px] flex flex-col justify-center">
          <h3 className={`text-xs font-bold leading-snug line-clamp-2 transition-colors ${isCurrent ? 'text-[var(--text-primary)]' : isCompleted ? 'text-[var(--text-primary)]' : isLocked ? 'text-[var(--text-muted)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`}>
            {lesson.customTitle || lesson.title}
          </h3>
        </div>

        {/* Footer row: Key preview / Duration & Stars */}
        <div className="flex items-center justify-between text-[11px] font-mono">
          {/* Duration or WPM */}
          <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
            <Clock className="w-3 h-3 text-[var(--text-muted)]" />
            <span>{lesson.estimatedMinutes || '2'} min</span>
            {isCompleted && lesson.record?.bestWpm && (
              <span className="text-[var(--ui-success)] font-bold ml-1">{lesson.record.bestWpm} {t('common.wpm')}</span>
            )}
          </div>

          {/* 5-Star Rating Indicator */}
          <div className="flex items-center gap-0.5" aria-label={`Rating: ${starsEarned} of 5 stars`}>
            {[1, 2, 3, 4, 5].map((starIndex) => {
              const isFilled = isCompleted ? starIndex <= starsEarned : false;
              return (
                <Star
                  key={starIndex}
                  className={`w-3 h-3 ${isFilled ? 'text-[#FFC247] fill-[#FFC247]' : 'text-[var(--border)] fill-[var(--border-subtle)]'}`}
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
