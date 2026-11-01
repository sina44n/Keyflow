import React, { useState } from 'react';
import { Star, Lock, Search, Check, Play } from 'lucide-react';
import { AcademyIllustrationEngine } from './AcademyIllustrationEngine';
import { useI18n } from '../../i18n/I18nContext';

/**
 * AcademyLevelCard
 * =========================================================================
 * Production illustrated card component replicating the reference design:
 * - Large level number top-left (1..600)
 * - Status badge top-right (Magnifier for review, Padlock for locked, Checkmark for completed)
 * - Rich illustrated center graphic (~80px height)
 * - Authentic 5-Star rating indicator (Gold filled vs light outline)
 * - Crisp level title below stars
 * - Deep burgundy active border with ambient glow
 * - 100% Theme-agnostic using semantic CSS tokens
 */
export const AcademyLevelCard = React.forwardRef(({
  lesson,
  isCurrent = false,
  onSelect,
  onLockedClick,
}, ref) => {
  const { t } = useI18n();
  const [isHovered, setIsHovered] = useState(false);

  const levelNum = lesson.lessonNum || lesson.levelNumber || 1;
  const isCompleted = Boolean(lesson.record?.completed);
  const isUnlocked = Boolean(lesson.unlocked);
  const isLocked = !isUnlocked;

  // Star calculation (0 to 5)
  const starsEarned = typeof lesson.record?.stars === 'number'
    ? Math.max(0, Math.min(5, lesson.record.stars))
    : (isCompleted ? 3 : 0);

  // Check if review/focus lesson
  const lowerTitle = (lesson.title || '').toLowerCase();
  const lowerSkills = Array.isArray(lesson.skills) ? lesson.skills.map((s) => String(s).toLowerCase()) : [];
  const isReviewLesson = lowerTitle.includes('review') || lowerTitle.includes('focus') || lowerSkills.includes('review') || (levelNum % 4 === 0 && !isLocked);

  // Clean title derivation matching reference screenshots
  const displayTitle = getCuratedTitle(lesson, levelNum);

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

  // State-specific styling using semantic design tokens
  let containerBorder = 'border-[var(--border)]';
  let containerBg = 'bg-[var(--bg-card)]';
  let glowStyle = {};

  if (isCurrent) {
    containerBorder = 'border-2 border-[var(--accent)]';
    containerBg = 'bg-[var(--bg-elevated)]';
    glowStyle = {
      boxShadow: '0 0 18px color-mix(in srgb, var(--accent) 35%, transparent), inset 0 0 12px color-mix(in srgb, var(--accent) 6%, transparent)',
    };
  } else if (isLocked) {
    containerBorder = 'border border-[var(--border-subtle)]';
    containerBg = 'bg-[var(--bg-card)]';
  } else if (isCompleted) {
    containerBorder = 'border border-[var(--border)]';
  }

  return (
    <div
      ref={ref}
      tabIndex={isUnlocked ? 0 : 0}
      role="button"
      aria-label={`Level ${levelNum}: ${displayTitle}. ${isCompleted ? 'Completed' : isCurrent ? 'Next Up' : isLocked ? 'Locked' : 'Available'}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={glowStyle}
      className={`relative group rounded-2xl ${containerBorder} ${containerBg} p-3.5 sm:p-4 flex flex-col justify-between text-center select-none cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] min-h-[210px] ${
        !isLocked ? 'hover:-translate-y-1 hover:shadow-md hover:border-[var(--accent)]/50' : 'hover:border-[var(--border)]'
      }`}
    >
      {/* Top Header: Level Number (Left) & Status Badge (Right) */}
      <div className="flex items-center justify-between w-full mb-1">
        {/* Large Bold Level Number */}
        <span className={`text-base sm:text-lg font-extrabold tracking-tight ${
          isCurrent
            ? 'text-[var(--accent)]'
            : 'text-[var(--text-primary)]'
        }`}>
          {levelNum}
        </span>

        {/* Top-Right Status Badge */}
        <div className="flex items-center gap-1">
          {isReviewLesson && !isLocked && !isCompleted && (
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors" />
          )}

          {isLocked && (
            <Lock className="w-3.5 h-3.5 text-[var(--text-muted)] opacity-70" />
          )}

          {isCompleted && (
            <span className="w-5 h-5 rounded-full bg-[#34A853] text-white flex items-center justify-center shadow-xs">
              <Check className="w-3 h-3 stroke-[2.5]" />
            </span>
          )}

          {isCurrent && !isCompleted && (
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)] animate-pulse" />
          )}
        </div>
      </div>

      {/* Center: Curated Illustration Motif */}
      <div className="my-auto py-1.5 flex items-center justify-center relative">
        <AcademyIllustrationEngine
          lesson={lesson}
          isHovered={isHovered}
          isCurrent={isCurrent}
          isCompleted={isCompleted}
          isLocked={isLocked}
          className="w-full h-20 max-w-[125px]"
        />

        {/* Hover play prompt overlay on unlocked lessons */}
        {isHovered && isUnlocked && !isCurrent && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl backdrop-blur-[1px] transition-all">
            <div className="w-8 h-8 rounded-full bg-[var(--accent)] text-[var(--accent-fg)] flex items-center justify-center shadow-md">
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            </div>
          </div>
        )}
      </div>

      {/* Bottom: 5-Star Rating & Curated Title */}
      <div className="space-y-1.5 pt-1.5">
        {/* 5-Star Rating Row */}
        <div className="flex items-center justify-center gap-0.5" aria-label={`Rating: ${starsEarned} of 5 stars`}>
          {[1, 2, 3, 4, 5].map((starIdx) => {
            const isFilled = isCompleted ? starIdx <= starsEarned : (isCurrent && starIdx <= starsEarned && starsEarned > 0);
            return (
              <Star
                key={starIdx}
                className={`w-3.5 h-3.5 transition-colors ${
                  isFilled
                    ? 'text-[#FFB800] fill-[#FFB800] filter drop-shadow-[0_1px_1px_rgba(255,184,0,0.4)]'
                    : 'text-[var(--border)] fill-transparent stroke-[1.4]'
                }`}
              />
            );
          })}
        </div>

        {/* Level Title */}
        <div className="min-h-[32px] flex items-center justify-center px-1">
          <h3 className={`text-xs sm:text-[13px] font-bold leading-tight line-clamp-2 transition-colors ${
            isCurrent
              ? 'text-[var(--accent)] font-extrabold'
              : 'text-[var(--text-primary)]'
          }`}>
            {displayTitle}
          </h3>
        </div>
      </div>
    </div>
  );
});

AcademyLevelCard.displayName = 'AcademyLevelCard';

/**
 * Curates a clean, friendly title matching the reference screenshots.
 */
function getCuratedTitle(lesson, levelNum) {
  const rawTitle = lesson.title || '';
  const targetKeys = Array.isArray(lesson.targetKeys) ? lesson.targetKeys : [];
  const k1 = targetKeys[0] || 'f';
  const k2 = targetKeys[1] || 'j';

  // Unit 1 Reference Titles
  if (levelNum === 1) return 'Introduction';
  if (levelNum === 2) return `Keys ${k1.toLowerCase()} & ${k2.toLowerCase()}`;
  if (levelNum === 3) return 'Space Bar';
  if (levelNum === 4) return `Review: ${k1.toLowerCase()} & ${k2.toLowerCase()}`;
  if (levelNum === 5) return 'Keys d & k';
  if (levelNum === 6) return 'Review: d & k';
  if (levelNum === 7) return 'Practice: d & k';
  if (levelNum === 8) return 'Play: fjkd';
  if (levelNum === 9) return 'Keys s & l';
  if (levelNum === 10) return 'Review: s & l';
  if (levelNum === 11) return 'Practice: s & l';
  if (levelNum === 12) return 'Keys a & ;';
  if (levelNum === 13) return 'Review: a & ;';
  if (levelNum === 14) return 'First 8 Keys';
  if (levelNum === 15) return 'Play: First 8 Keys';

  // Unit 2 Reference Titles
  if (levelNum === 16) return 'Start Fast';
  if (levelNum === 17) return 'Text Reading';
  if (levelNum === 18) return 'Top Row Reach';
  if (levelNum === 19) return 'Focus Review';
  if (levelNum === 20) return 'Screen Practice';
  if (levelNum === 21) return 'Upper Hand Review';
  if (levelNum === 22) return 'Speed Sprint';
  if (levelNum === 23) return 'Level Play';
  if (levelNum === 24) return 'Lower Keys Z&X';
  if (levelNum === 25) return 'Key Combo';
  if (levelNum === 26) return 'Timed Drill';
  if (levelNum === 27) return 'V & B Keys';
  if (levelNum === 28) return 'Word Review';
  if (levelNum === 29) return 'Advanced Reach';
  if (levelNum === 30) return 'Climb Play';

  // Unit 3 Reference Titles
  if (levelNum === 31) return 'Fluid Rhythm';
  if (levelNum === 32) return 'Q & P reach';
  if (levelNum === 33) return 'Layout puzzle';
  if (levelNum === 34) return 'Focus Bullseye';
  if (levelNum === 35) return 'Top row numbers';
  if (levelNum === 36) return 'Upper reach Y&T';
  if (levelNum === 37) return 'Time pressure';
  if (levelNum === 38) return 'Route quest';
  if (levelNum === 39) return 'Capital letters';
  if (levelNum === 40) return 'Focus zoom';
  if (levelNum === 41) return 'Rapid Fire';
  if (levelNum === 42) return 'Center Keys G&H';
  if (levelNum === 43) return 'Pro patterns';
  if (levelNum === 44) return 'Special characters';
  if (levelNum === 45) return 'Bubble run';

  // For other levels, clean up verbose titles like "Tactile Anchors & Bump Detection Drill X"
  if (rawTitle.includes('Drill') || rawTitle.includes('Mastery') || rawTitle.includes('Foundation')) {
    if (targetKeys.length >= 2) {
      const mode = (levelNum % 4 === 0) ? 'Review:' : (levelNum % 3 === 0) ? 'Practice:' : 'Keys';
      return `${mode} ${targetKeys.slice(0, 2).map((k) => k.toLowerCase()).join(' & ')}`;
    }
  }

  // Fallback to title
  return rawTitle.replace(/Drill \d+/i, '').trim() || `Level ${levelNum}`;
}
