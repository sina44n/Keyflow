import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  ChevronRight,
  Target,
  Gauge,
  Award,
  Lock,
  CheckCircle2,
  Play,
  RotateCcw,
} from 'lucide-react';
import { Button } from '../common/Button';
import { ACADEMY_STAGES, getStageById } from '../../data/curriculumData';
import { getAcademyProgress, isLevelUnlocked, getLevelStats } from '../../utils/academyProgress';
import { LessonPlayer } from '../academy/LessonPlayer';

export const CurriculumPreview = ({ onOpenDedicatedAcademy }) => {
  const [selectedLevel, setSelectedLevel] = useState(ACADEMY_STAGES[0]);
  const [progress, setProgress] = useState(getAcademyProgress);
  const [activePlayingStage, setActivePlayingStage] = useState(null);

  // Sync progress changes immediately across the UI
  useEffect(() => {
    const handleProgressUpdate = (e) => {
      setProgress(e.detail);
    };
    window.addEventListener('keyflow-progress-updated', handleProgressUpdate);
    return () => window.removeEventListener('keyflow-progress-updated', handleProgressUpdate);
  }, []);

  const completedStagesCount = Object.values(progress?.levelStats || {}).filter((s) => s.completed).length;
  const unlocked = isLevelUnlocked(selectedLevel.level);
  const stats = getLevelStats(selectedLevel.level);

  const handleNextStage = () => {
    if (activePlayingStage && activePlayingStage.level < 7) {
      const nextStage = getStageById(activePlayingStage.level + 1);
      setSelectedLevel(nextStage);
      setActivePlayingStage(nextStage);
    }
  };

  return (
    <section id="curriculum" className="section-spacing border-t border-[var(--border)] relative bg-[var(--bg-main)]">
      <div className="container-app space-y-10 sm:space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--accent)] font-mono">
            <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Interactive Academy • {completedStagesCount}/7 Stages Mastered</span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
              The 7-Stage Neuromuscular Academy
            </h2>
            {onOpenDedicatedAcademy && (
              <Button variant="ghost" size="xs" onClick={onOpenDedicatedAcademy} className="hidden sm:inline-flex">
                Dedicated View →
              </Button>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            All 7 stages feature genuine, progressively challenging exercises with real-time accuracy gates, speed minimums, and instant level progression.
          </p>
        </div>

        {/* If user is actively playing a stage right here in the curriculum */}
        {activePlayingStage ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[var(--text-muted)]">
                Active Training Session: Stage {activePlayingStage.level} of 7
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActivePlayingStage(null)}
              >
                ← Return to Level Grid
              </Button>
            </div>

            <LessonPlayer
              key={activePlayingStage.id}
              stage={activePlayingStage}
              onBack={() => setActivePlayingStage(null)}
              onNextStage={handleNextStage}
              hasNextStage={activePlayingStage.level < 7 && isLevelUnlocked(activePlayingStage.level + 1)}
            />
          </div>
        ) : (
          /* Two-Column Curriculum Overview */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Left Column: 7 Level Selector Cards */}
            <div className="lg:col-span-5 space-y-2" role="tablist" aria-label="Curriculum levels">
              {ACADEMY_STAGES.map((lvl) => {
                const isSelected = selectedLevel.level === lvl.level;
                const isLvlUnlocked = isLevelUnlocked(lvl.level);
                const lvlStats = getLevelStats(lvl.level);

                return (
                  <button
                    key={lvl.level}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setSelectedLevel(lvl)}
                    className={`w-full text-left p-3 rounded-xl border transition-all duration-150 flex items-center justify-between cursor-pointer min-h-[58px] ${
                      isSelected
                        ? 'border-[var(--accent)] bg-[var(--bg-elevated)] ring-1 ring-[var(--accent)]/30 shadow-xs'
                        : isLvlUnlocked
                        ? 'border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-elevated)]/60'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-surface)]/40 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg font-mono font-bold text-xs flex items-center justify-center border shrink-0 transition-colors ${
                          lvlStats?.completed
                            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                            : isSelected
                            ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)]'
                            : isLvlUnlocked
                            ? 'border-[var(--border)] bg-[var(--bg-main)] text-[var(--text-secondary)]'
                            : 'border-[var(--border-subtle)] bg-[var(--bg-main)] text-[var(--text-muted)]'
                        }`}
                      >
                        {lvlStats?.completed ? '✓' : isLvlUnlocked ? lvl.level : <Lock className="w-3.5 h-3.5" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] truncate">
                            {lvl.title}
                          </span>
                          {lvlStats?.stars > 0 && (
                            <span className="text-amber-400 text-xs">
                              {'★'.repeat(lvlStats.stars)}
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] font-mono text-[var(--text-muted)] truncate">
                          {lvlStats?.completed
                            ? `Best: ${lvlStats.bestWpm} WPM • ${lvlStats.bestAccuracy}% Acc`
                            : isLvlUnlocked
                            ? `Gate: ${lvl.targetWpm} WPM • ${lvl.targetAccuracy}% Acc`
                            : `Complete Stage ${lvl.level - 1} to unlock`}
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

            {/* Right Column: Selected Level Master Inspection Card */}
            <div className="lg:col-span-7 card-panel p-6 sm:p-7 space-y-6 shadow-xl relative overflow-hidden" role="tabpanel">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md font-mono text-xs uppercase tracking-wider font-bold bg-[var(--accent)] text-[var(--accent-fg)]">
                    Stage {selectedLevel.level} of 7
                  </span>
                  <span className="px-2.5 py-1 rounded-md font-mono text-xs text-[var(--text-secondary)] bg-[var(--bg-elevated)] border border-[var(--border)]">
                    {selectedLevel.badge}
                  </span>
                </div>

                {stats?.completed ? (
                  <div className="flex items-center gap-1.5 font-mono text-xs text-emerald-400 bg-emerald-950/30 px-2.5 py-1 rounded-md border border-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Completed • {stats.bestWpm} WPM</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-xs font-mono text-[var(--text-muted)]">
                    <span className="text-[var(--accent)] font-semibold">
                      Target: {selectedLevel.targetWpm} WPM
                    </span>
                    <span>•</span>
                    <span className="text-[var(--ui-success)] font-semibold">
                      Acc: {selectedLevel.targetAccuracy}%
                    </span>
                  </div>
                )}
              </div>

              {/* Title & Objective */}
              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                  {selectedLevel.title}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                  {selectedLevel.objective}
                </p>
              </div>

              {/* Target Keycaps Reference */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                  Target Keycaps:
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

              {/* Gates Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] space-y-0.5">
                  <div className="text-[10px] text-[var(--text-muted)] uppercase font-mono flex items-center gap-1">
                    <Target className="w-3 h-3 text-[var(--ui-success)]" />
                    <span>Accuracy Gate</span>
                  </div>
                  <div className="text-base font-bold text-[var(--ui-success)] font-mono">{selectedLevel.targetAccuracy}%</div>
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
                  <div className="text-base font-bold text-[var(--text-primary)] font-mono">
                    {stats?.stars ? `${stats.stars} ★ Earned` : '1 - 3 Stars'}
                  </div>
                </div>
              </div>

              {/* Action Button: Directly Launches the Lesson Player */}
              <div className="pt-3 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
                {unlocked ? (
                  <Button
                    variant="primary"
                    size="md"
                    icon={stats?.completed ? RotateCcw : Play}
                    onClick={() => setActivePlayingStage(selectedLevel)}
                  >
                    {stats?.completed ? `Replay Stage ${selectedLevel.level} (Lesson)` : `Play Stage ${selectedLevel.level} Lesson`}
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
                    <Lock className="w-4 h-4 text-[var(--ui-warning)] shrink-0" />
                    <span>Complete Stage {selectedLevel.level - 1} to unlock this lesson.</span>
                  </div>
                )}

                <span className="text-[11px] text-[var(--text-muted)] font-mono">
                  {selectedLevel.exercise.length} chars • Interactive neuromuscular engine
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
