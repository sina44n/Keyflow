import React, { useState } from 'react';
import {
  BookOpen,
  ChevronRight,
} from 'lucide-react';
import { Button } from '../common/Button';

export const CURRICULUM_LEVELS = [
  {
    level: 1,
    title: 'Home Row Foundations',
    subtitle: 'Anchor finger placement, muscle relaxation, tactile indexing',
    keys: ['J', 'F', 'Space', 'U', 'R', 'K', 'D'],
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
    lessonsCount: 25,
    targetWpm: 80,
    description:
      'High-velocity conditioning. Sustain 80+ WPM through multi-paragraph articles and eliminate muscular fatigue.',
    badge: 'Mastery',
  },
];

export const CurriculumPreview = () => {
  const [selectedLevel, setSelectedLevel] = useState(CURRICULUM_LEVELS[0]);

  return (
    <section id="curriculum" className="py-20 border-t border-[var(--border)] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--accent)] font-mono">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Structured Learning Roadmap</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[var(--text-primary)] tracking-tight">
            The 7-Stage Academy Curriculum
          </h2>
          <p className="text-sm sm:text-base text-[var(--text-secondary)]">
            A comprehensive, progressive curriculum taking you from zero-touch muscle memory to 100+
            WPM programmer fluency.
          </p>
        </div>

        {/* Interactive Curriculum Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Level Selection List */}
          <div className="lg:col-span-5 space-y-2">
            {CURRICULUM_LEVELS.map((lvl) => {
              const isSelected = selectedLevel.level === lvl.level;
              return (
                <button
                  key={lvl.level}
                  type="button"
                  onClick={() => setSelectedLevel(lvl)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all duration-150 flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'border-[var(--accent)] bg-[var(--bg-surface)] shadow-md translate-x-1'
                      : 'border-[var(--border)] bg-[var(--bg-elevated)]/30 hover:bg-[var(--bg-elevated)] hover:border-[var(--text-muted)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg font-mono font-bold text-xs flex items-center justify-center border ${
                        isSelected
                          ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)]'
                          : 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {lvl.level}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[var(--text-primary)]">
                        {lvl.title}
                      </div>
                      <div className="text-xs text-[var(--text-muted)] truncate max-w-[220px]">
                        {lvl.lessonsCount} lessons • Target: {lvl.targetWpm} WPM
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${
                      isSelected ? 'text-[var(--accent)] translate-x-0.5' : 'text-[var(--text-muted)]'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Right: Selected Level Deep-Dive Card */}
          <div className="lg:col-span-7 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
            <div
              className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[90px] opacity-15 pointer-events-none"
              style={{ backgroundColor: 'var(--accent)' }}
            />

            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md font-mono text-xs uppercase tracking-wider font-bold bg-[var(--accent)] text-[var(--accent-fg)]">
                  Level {selectedLevel.level}
                </span>
                <span className="px-2.5 py-0.5 rounded-md font-mono text-xs text-[var(--text-secondary)] bg-[var(--bg-elevated)] border border-[var(--border)]">
                  {selectedLevel.badge}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono text-[var(--text-muted)]">
                <span>{selectedLevel.lessonsCount} Lessons</span>
                <span>•</span>
                <span className="text-[var(--accent)] font-semibold">
                  Target: {selectedLevel.targetWpm} WPM
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                {selectedLevel.title}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {selectedLevel.description}
              </p>
            </div>

            {/* Keys Taught in this Stage */}
            <div className="space-y-3">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
                Keycaps & Target Finger Patterns:
              </span>
              <div className="flex flex-wrap gap-2">
                {selectedLevel.keys.map((k, i) => (
                  <span
                    key={i}
                    className="px-3 py-2 rounded-lg font-mono text-sm font-bold bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] shadow-sm hover:border-[var(--accent)] transition-colors"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>

            {/* Level Milestones Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
                <div className="text-[11px] text-[var(--text-muted)] uppercase font-mono">Accuracy Goal</div>
                <div className="text-lg font-bold text-[var(--ui-success)] font-mono">98.5%+</div>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
                <div className="text-[11px] text-[var(--text-muted)] uppercase font-mono">Speed Gate</div>
                <div className="text-lg font-bold text-[var(--accent)] font-mono">{selectedLevel.targetWpm} WPM</div>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
                <div className="text-[11px] text-[var(--text-muted)] uppercase font-mono">Star Reward</div>
                <div className="text-lg font-bold text-[var(--text-primary)] font-mono">3 Stars / Lesson</div>
              </div>
            </div>

            {/* CTA */}
            <div className="pt-2 flex items-center justify-between">
              <Button
                variant="primary"
                size="md"
                onClick={() => alert(`Starting Level ${selectedLevel.level}: ${selectedLevel.title}! Lessons will load in Phase 3.`)}
              >
                Enroll in Level {selectedLevel.level}
              </Button>
              <span className="text-xs text-[var(--text-muted)] font-mono">
                No credit card required
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
