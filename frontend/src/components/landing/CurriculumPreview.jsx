import React, { useState } from 'react';
import {
  BookOpen,
  ChevronRight,
  Target,
  Gauge,
  Award,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../common/Button';

export const CURRICULUM_LEVELS = [
  {
    level: 1,
    title: 'Home Row Foundations',
    subtitle: 'Anchor finger placement, muscle relaxation, tactile indexing',
    keys: ['J', 'F', 'Space', 'U', 'R', 'K', 'D'],
    homeKeys: ['F', 'J'],
    lessonsCount: 16,
    targetWpm: 25,
    description:
      'Master the index and middle finger anchors. Build muscle confidence without glancing down at the physical keyboard.',
    badge: 'Foundation',
  },
  {
    level: 2,
    title: 'Top Row Expansion',
    subtitle: 'Upward finger reaches, diagonal accuracy, rhythm consistency',
    keys: ['E', 'I', 'O', 'P', 'Q', 'W', 'T', 'Y'],
    homeKeys: [],
    lessonsCount: 20,
    targetWpm: 35,
    description:
      'Train each finger to stretch upward cleanly from home row rest positions and return without hesitation.',
    badge: 'Expansion',
  },
  {
    level: 3,
    title: 'Bottom Row Foundations',
    subtitle: 'Downward curl mechanics, wrist alignment, pinky stabilization',
    keys: ['B', 'N', 'M', 'V', 'C', 'X', 'Z'],
    homeKeys: [],
    lessonsCount: 18,
    targetWpm: 45,
    description:
      'Conquer the downward curl motion. Build balanced left and right hand speed across the entire alphabet.',
    badge: 'Full Alpha',
  },
  {
    level: 4,
    title: 'Shift & Punctuation',
    subtitle: 'Opposite-hand Shift coordination, commas, periods, quotes',
    keys: ['Shift', '.', ',', "'", '"', '?', '!'],
    homeKeys: [],
    lessonsCount: 14,
    targetWpm: 55,
    description:
      'Drill proper two-handed Shift discipline. Never use the same hand to press Shift and a letter key.',
    badge: 'Fluency',
  },
  {
    level: 5,
    title: 'Numbers & Symbols',
    subtitle: 'Top-row number reach, math operators, currency symbols',
    keys: ['1-0', '@', '#', '$', '%', '^', '&', '*', '(', ')'],
    homeKeys: [],
    lessonsCount: 16,
    targetWpm: 50,
    description:
      'Eliminate the habit of looking down for numbers and standard financial / mathematical notation.',
    badge: 'Numeric',
  },
  {
    level: 6,
    title: 'Programmer Syntax & Code',
    subtitle: 'Brackets, braces, arrows, camelCase, snake_case syntax',
    keys: ['{ }', '[ ]', '< >', '( )', '=>', '===', ';', '&&', '||'],
    homeKeys: [],
    lessonsCount: 22,
    targetWpm: 60,
    description:
      'Tailored for software engineers. Drill tricky IDE keys, semicolons, backticks, and regex tokens with zero friction.',
    badge: 'Developer',
  },
  {
    level: 7,
    title: 'Speed Endurance & Flow',
    subtitle: 'Long-form classical passages, blind typing, burst sprints',
    keys: ['Full Passages', 'Prose', 'Technical Articles', 'Blind Mode'],
    homeKeys: [],
    lessonsCount: 25,
    targetWpm: 80,
    description:
      'High-velocity conditioning. Sustain 80+ WPM through multi-paragraph articles and eliminate muscular fatigue.',
    badge: 'Mastery',
  },
];

export const CurriculumPreview = () => {
  const [selectedLevel, setSelectedLevel] = useState(CURRICULUM_LEVELS[0]);
  const [enrolledNotice, setEnrolledNotice] = useState(false);

  const handleEnroll = () => {
    setEnrolledNotice(true);
    setTimeout(() => setEnrolledNotice(false), 3500);
  };

  return (
    <section id="curriculum" className="section-spacing border-t border-[var(--border)] relative bg-[var(--bg-main)]">
      <div className="container-app space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--accent)] font-mono">
            <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Academy Curriculum</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
            The 7-Stage Neuromuscular Academy
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            From zero-glance tactile anchoring to high-velocity programmer code syntax. Select any stage to inspect lesson requirements.
          </p>
        </div>

        {/* Balanced Two-Column Interactive Curriculum Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column: 7 Level Selector Cards */}
          <div className="lg:col-span-5 space-y-2" role="tablist" aria-label="Curriculum levels">
            {CURRICULUM_LEVELS.map((lvl) => {
              const isSelected = selectedLevel.level === lvl.level;
              return (
                <button
                  key={lvl.level}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedLevel(lvl)}
                  className={`w-full text-left p-3 rounded-xl border transition-all duration-150 flex items-center justify-between cursor-pointer min-h-[56px] ${
                    isSelected
                      ? 'border-[var(--accent)] bg-[var(--bg-elevated)] ring-1 ring-[var(--accent)]/30 shadow-xs'
                      : 'border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-elevated)]/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg font-mono font-bold text-xs flex items-center justify-center border shrink-0 transition-colors ${
                        isSelected
                          ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)]'
                          : 'border-[var(--border)] bg-[var(--bg-main)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {lvl.level}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] truncate">
                        {lvl.title}
                      </div>
                      <div className="text-[11px] font-mono text-[var(--text-muted)] truncate">
                        {lvl.lessonsCount} lessons • Gate: {lvl.targetWpm} WPM
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isSelected ? 'text-[var(--accent)] translate-x-0.5' : 'text-[var(--text-muted)]'
                    }`}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>

          {/* Right Column: Selected Level Deep-Dive Card */}
          <div className="lg:col-span-7 card-panel p-6 sm:p-7 space-y-6 shadow-xl relative overflow-hidden" role="tabpanel">
            {/* Header & Badges */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md font-mono text-xs uppercase tracking-wider font-bold bg-[var(--accent)] text-[var(--accent-fg)]">
                  Level {selectedLevel.level}
                </span>
                <span className="px-2.5 py-1 rounded-md font-mono text-xs text-[var(--text-secondary)] bg-[var(--bg-elevated)] border border-[var(--border)]">
                  {selectedLevel.badge}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono text-[var(--text-muted)]">
                <span>{selectedLevel.lessonsCount} Structured Lessons</span>
                <span>•</span>
                <span className="text-[var(--accent)] font-semibold">
                  Target: {selectedLevel.targetWpm} WPM
                </span>
              </div>
            </div>

            {/* Level Title & Description */}
            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                {selectedLevel.title}
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                {selectedLevel.description}
              </p>
            </div>

            {/* Mechanical Keycaps Tray */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                Keycaps & Target Finger Patterns:
              </span>
              <div className="flex flex-wrap gap-2 pt-1">
                {selectedLevel.keys.map((k, i) => {
                  const isHomingKey = selectedLevel.homeKeys && selectedLevel.homeKeys.includes(k);
                  return (
                    <span
                      key={i}
                      className={`keycap ${isHomingKey ? 'keycap-home' : ''}`}
                      title={isHomingKey ? `${k} (Home-row tactile index anchor)` : k}
                    >
                      {k}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Level Milestones Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] space-y-0.5">
                <div className="text-[10px] text-[var(--text-muted)] uppercase font-mono flex items-center gap-1">
                  <Target className="w-3 h-3 text-[var(--ui-success)]" />
                  <span>Accuracy Gate</span>
                </div>
                <div className="text-base font-bold text-[var(--ui-success)] font-mono">98.5%+</div>
              </div>
              <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] space-y-0.5">
                <div className="text-[10px] text-[var(--text-muted)] uppercase font-mono flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-[var(--accent)]" />
                  <span>Speed Gate</span>
                </div>
                <div className="text-base font-bold text-[var(--accent)] font-mono">{selectedLevel.targetWpm} WPM</div>
              </div>
              <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] space-y-0.5">
                <div className="text-[10px] text-[var(--text-muted)] uppercase font-mono flex items-center gap-1">
                  <Award className="w-3 h-3 text-[var(--text-primary)]" />
                  <span>Star Rewards</span>
                </div>
                <div className="text-base font-bold text-[var(--text-primary)] font-mono">3 Stars / Lesson</div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)]">
              <Button
                variant="primary"
                size="md"
                onClick={handleEnroll}
              >
                Enroll in Level {selectedLevel.level}
              </Button>
              <span className="text-[11px] text-[var(--text-muted)] font-mono">
                Full lesson drills activate in Phase 3
              </span>
            </div>

            {/* Enrolled Confirmation Notice */}
            {enrolledNotice && (
              <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--accent)] flex items-center gap-2 text-xs font-medium text-[var(--text-primary)] animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-[var(--ui-success)] shrink-0" />
                <span>
                  Enrolled in <strong>Level {selectedLevel.level}: {selectedLevel.title}</strong>! Lesson progression and exercises load in Phase 3.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
