import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  RotateCcw, Volume2, VolumeX, Gauge, Target, ArrowRight, ArrowLeft,
  CheckCircle2, AlertCircle, Keyboard, HandMetal,
} from 'lucide-react';
import { Button } from '../common/Button';
import { KeyboardGuide } from './KeyboardGuide';
import { HandGuide } from './HandGuide';
import { getLesson } from '../../data/curriculumEngine';
import {
  recordLessonResult, calculateStars,
  getGuidePreferences, saveGuidePreferences,
} from '../../utils/lessonProgress';

/**
 * LessonPlayer — Full typing workstation with:
 * - Keyboard Guide (independent toggle)
 * - Hand Guide (independent toggle)
 * - Live WPM, accuracy, correct/incorrect chars
 * - Restart, Next, Back navigation
 * - Completion feedback with stars
 * Works for both stage-level exercises AND individual 600-lesson exercises.
 */
export const LessonPlayer = ({
  stageId,
  lessonNum = 1,
  onBack,
  onNextLesson,
  onNextStage,
  hasNextLesson = true,
  hasNextStage = false,
  // Legacy support for old stage-object API
  stage: legacyStage,
}) => {
  // Resolve lesson data
  const lesson = useMemo(() => {
    if (stageId && lessonNum) {
      try { return getLesson(stageId, lessonNum); } catch { /* fallback */ }
    }
    // Legacy fallback using old stage prop
    if (legacyStage) {
      return {
        id: `stage-${legacyStage.id}-lesson-001`,
        stageId: legacyStage.id,
        lessonNum: 1,
        stageTitle: legacyStage.title,
        title: legacyStage.title,
        unitLabel: legacyStage.subtitle || '',
        unit: 1,
        objective: legacyStage.objective,
        badge: legacyStage.badge,
        targetKeys: legacyStage.keys,
        homeKeys: legacyStage.homeKeys,
        exerciseText: legacyStage.exercise,
        difficulty: 'beginner',
        targetWpm: legacyStage.targetWpm,
        targetAccuracy: legacyStage.targetAccuracy,
        estimatedSeconds: legacyStage.estimatedSeconds,
        isAssessment: false,
        isMilestone: false,
        guidance: legacyStage.guidance,
      };
    }
    return null;
  }, [stageId, lessonNum, legacyStage]);

  // Guide preferences (persist)
  const [keyboardGuideOn, setKeyboardGuideOn] = useState(() => getGuidePreferences().keyboardGuide);
  const [handGuideOn, setHandGuideOn] = useState(() => getGuidePreferences().handGuide);

  // Typing state
  const [typed, setTyped] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [totalStrokes, setTotalStrokes] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [completedResult, setCompletedResult] = useState(null);

  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const completionFiredRef = useRef(false);

  const targetText = lesson?.exerciseText ?? '';

  // Derived: current target character for guides
  const currentTargetChar = useMemo(() => {
    if (!targetText || typed.length >= targetText.length) return null;
    return targetText[typed.length];
  }, [typed, targetText]);

  // Correct chars count
  const correctChars = useMemo(() => {
    let count = 0;
    for (let i = 0; i < typed.length; i++) {
      if (typed[i] === targetText[i]) count++;
    }
    return count;
  }, [typed, targetText]);

  // Live WPM (standard: correct chars / 5 / elapsed minutes)
  const elapsedMinutes = Math.max((elapsedSeconds || 1) / 60, 0.016);
  const currentWpm = startTime ? Math.max(0, Math.round((correctChars / 5) / elapsedMinutes)) : 0;

  // Live Accuracy
  const currentAccuracy = totalStrokes > 0
    ? Math.max(0, Math.min(100, Math.round((correctChars / Math.max(correctChars + mistakes, 1)) * 100)))
    : 100;

  // Progress
  const progressPercent = targetText ? Math.min(100, Math.round((typed.length / targetText.length) * 100)) : 0;

  // Audio click
  const playClick = useCallback((isError = false) => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isError ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(isError ? 240 : 580, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(isError ? 0.2 : 0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch { /* blocked */ }
  }, [soundEnabled]);

  const handleReset = useCallback(() => {
    setTyped('');
    setStartTime(null);
    setElapsedSeconds(0);
    setTotalStrokes(0);
    setMistakes(0);
    setIsCompleted(false);
    setCompletedResult(null);
    completionFiredRef.current = false;
    clearInterval(timerRef.current);
    setTimeout(() => { if (inputRef.current) inputRef.current.focus(); }, 50);
  }, []);

  // Reset when lesson changes
  useEffect(() => {
    handleReset();
  }, [lesson?.id, handleReset]);

  // Timer
  useEffect(() => {
    if (startTime && !isCompleted) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.max(1, Math.floor((Date.now() - startTime) / 1000)));
      }, 500);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [startTime, isCompleted]);

  // Focus on mount
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
    return () => clearInterval(timerRef.current);
  }, []);

  // Escape = restart
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') handleReset(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleReset]);

  // Save guide prefs when changed
  const toggleKeyboardGuide = useCallback(() => {
    setKeyboardGuideOn(prev => {
      saveGuidePreferences(!prev, handGuideOn);
      return !prev;
    });
  }, [handGuideOn]);

  const toggleHandGuide = useCallback(() => {
    setHandGuideOn(prev => {
      saveGuidePreferences(keyboardGuideOn, !prev);
      return !prev;
    });
  }, [keyboardGuideOn]);

  // Main typing handler
  const handleInputChange = useCallback((e) => {
    if (isCompleted) return;
    const val = e.target.value;
    const isAdding = val.length > typed.length;

    if (!startTime && val.length > 0) setStartTime(Date.now());

    if (isAdding) {
      const newChar = val[val.length - 1];
      const targetChar = targetText[val.length - 1];
      const isCorrect = newChar === targetChar;
      setTotalStrokes(prev => prev + 1);
      if (!isCorrect) setMistakes(prev => prev + 1);
      playClick(!isCorrect);
    }

    setTyped(val);

    // Completion
    if (val.length >= targetText.length && !completionFiredRef.current) {
      completionFiredRef.current = true;
      const finalDuration = Math.max(1, Math.floor((Date.now() - (startTime || Date.now())) / 1000));
      const finalMinutes = finalDuration / 60;
      let finalCorrect = 0;
      for (let i = 0; i < val.length; i++) {
        if (val[i] === targetText[i]) finalCorrect++;
      }
      const finalWpm = Math.max(0, Math.round((finalCorrect / 5) / Math.max(finalMinutes, 0.016)));
      const finalAccuracy = Math.max(0, Math.min(100, Math.round((finalCorrect / Math.max(finalCorrect + mistakes, 1)) * 100)));
      const passed = finalAccuracy >= (lesson?.targetAccuracy ?? 80) && finalWpm >= (lesson?.targetWpm ?? 10);
      const stars = calculateStars(finalAccuracy, lesson?.targetAccuracy ?? 80, finalWpm, lesson?.targetWpm ?? 10);

      const result = { wpm: finalWpm, accuracy: finalAccuracy, mistakes, duration: finalDuration, passed, stars, correctChars: finalCorrect };
      setIsCompleted(true);
      setCompletedResult(result);
      clearInterval(timerRef.current);

      if (lesson) {
        recordLessonResult(lesson.stageId, lesson.lessonNum, result);
      }
    }
  }, [isCompleted, typed, targetText, startTime, mistakes, playClick, lesson]);

  if (!lesson) {
    return (
      <div className="card-panel p-8 text-center">
        <p className="text-[var(--text-muted)]">Loading lesson...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Bar: Navigation + Stage Info + Controls */}
      <div
        className="card-panel p-4 flex flex-wrap items-center justify-between gap-3"
        style={{ borderColor: 'var(--border)' }}
      >
        {/* Left: Back + Lesson Info */}
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] hover:border-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1 text-xs font-medium cursor-pointer shrink-0"
              aria-label="Back to Academy overview"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded font-mono text-[10px] uppercase tracking-wider font-bold bg-[var(--accent)] text-[var(--accent-fg)]">
                Stage {lesson.stageId}
              </span>
              {lesson.isAssessment && (
                <span className="px-2 py-0.5 rounded font-mono text-[10px] uppercase tracking-wider border border-[var(--ui-warning)] text-[var(--ui-warning)]">
                  Assessment
                </span>
              )}
              {lesson.isMilestone && (
                <span className="px-2 py-0.5 rounded font-mono text-[10px] uppercase tracking-wider border border-[var(--accent)] text-[var(--accent)]">
                  Milestone
                </span>
              )}
            </div>
            <div className="text-xs font-medium text-[var(--text-secondary)] truncate mt-0.5" title={lesson.title}>
              {lesson.title}
            </div>
          </div>
        </div>

        {/* Right: Live Metrics + Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Metrics */}
          <div className="flex items-center gap-3 bg-[var(--bg-elevated)] px-3 py-1.5 rounded-lg border border-[var(--border)] text-[11px] font-mono">
            <div className="flex items-center gap-1">
              <Gauge className="w-3 h-3 text-[var(--accent)]" />
              <span className="text-[var(--text-muted)]">WPM</span>
              <span className="font-bold text-[var(--text-primary)] w-6 text-right">{currentWpm}</span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="w-3 h-3 text-[var(--ui-success)]" />
              <span className="text-[var(--text-muted)]">ACC</span>
              <span className="font-bold text-[var(--text-primary)] w-8 text-right">{currentAccuracy}%</span>
            </div>
            <span className="text-[var(--text-muted)] hidden sm:inline">
              {Math.floor(elapsedSeconds/60)}:{String(elapsedSeconds%60).padStart(2,'0')}
            </span>
          </div>

          {/* Guide Toggles */}
          <button
            type="button"
            onClick={toggleKeyboardGuide}
            className={`px-2 py-1.5 rounded-lg border text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
              keyboardGuideOn
                ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--bg-elevated)]'
                : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            title={keyboardGuideOn ? 'Keyboard Guide ON — Click to hide' : 'Keyboard Guide OFF — Click to show'}
            aria-label={`Keyboard Guide ${keyboardGuideOn ? 'ON' : 'OFF'}`}
            aria-pressed={keyboardGuideOn}
          >
            <Keyboard className="w-3 h-3" />
            <span className="hidden sm:inline">KB</span>
          </button>

          <button
            type="button"
            onClick={toggleHandGuide}
            className={`px-2 py-1.5 rounded-lg border text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
              handGuideOn
                ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--bg-elevated)]'
                : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            title={handGuideOn ? 'Hand Guide ON — Click to hide' : 'Hand Guide OFF — Click to show'}
            aria-label={`Hand Guide ${handGuideOn ? 'ON' : 'OFF'}`}
            aria-pressed={handGuideOn}
          >
            <HandMetal className="w-3 h-3" />
            <span className="hidden sm:inline">Hand</span>
          </button>

          {/* Audio toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(p => !p)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              soundEnabled ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-[var(--border)] text-[var(--text-muted)]'
            }`}
            title={soundEnabled ? 'Audio ON' : 'Audio OFF'}
            aria-label="Toggle audio"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Restart */}
          <Button variant="outline" size="sm" icon={RotateCcw} onClick={handleReset}>
            <span className="hidden sm:inline">Restart</span>
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)]">
          <span>Lesson {lesson.lessonNum} / 600 — {lesson.unitLabel}</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all duration-150"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main typing area + guides layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Typing area (dominant) */}
        <div className="xl:col-span-8 space-y-3">
          {/* Target keys reference */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-[var(--text-muted)]">
            <span className="uppercase tracking-wider">Focus:</span>
            {lesson.targetKeys.map((k, i) => (
              <span key={i} className="keycap" style={{ minWidth:'1.75rem', height:'1.75rem', fontSize:'0.7rem' }}>
                {k}
              </span>
            ))}
            <span className="ml-auto">
              Gate: <strong className="text-[var(--accent)]">{lesson.targetWpm} WPM</strong> / <strong className="text-[var(--ui-success)]">{lesson.targetAccuracy}% Acc</strong>
            </span>
          </div>

          {/* Typing area */}
          <div
            onClick={() => inputRef.current && inputRef.current.focus()}
            className={`p-5 sm:p-6 rounded-2xl font-mono text-base sm:text-xl leading-relaxed tracking-wider select-none cursor-text min-h-[120px] relative transition-all border ${
              isCompleted ? 'opacity-80 border-[var(--border)]' : 'border-[var(--accent)] shadow-inner'
            }`}
            style={{ background: 'var(--bg-main)' }}
            role="region"
            aria-label="Typing exercise area"
          >
            {targetText.split('').map((char, idx) => {
              let cls = 'char-untyped';
              if (idx < typed.length) {
                cls = typed[idx] === char ? 'char-correct' : 'char-incorrect';
              } else if (idx === typed.length && !isCompleted) {
                cls = 'char-current';
              }
              return <span key={idx} className={cls}>{char}</span>;
            })}

            <input
              ref={inputRef}
              type="text"
              value={typed}
              onChange={handleInputChange}
              disabled={isCompleted}
              className="absolute inset-0 opacity-0 cursor-default"
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-label="Type the exercise text here"
            />
          </div>

          {/* Coaching guidance */}
          <p className="text-xs text-[var(--text-secondary)] italic">
            💡 {lesson.guidance}
          </p>

          {/* Completion panel */}
          {isCompleted && completedResult && (
            <div
              className="card-panel p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200"
              style={{ borderColor: completedResult.passed ? 'var(--ui-success)' : 'var(--ui-warning)' }}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: completedResult.passed ? 'color-mix(in srgb, var(--ui-success) 20%, transparent)' : 'color-mix(in srgb, var(--ui-warning) 20%, transparent)',
                      color: completedResult.passed ? 'var(--ui-success)' : 'var(--ui-warning)',
                    }}
                  >
                    {completedResult.passed ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[var(--text-primary)]">
                      {completedResult.passed ? 'Lesson Complete!' : 'Keep Practicing'}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {completedResult.passed
                        ? `${completedResult.wpm} WPM at ${completedResult.accuracy}% accuracy.`
                        : `Need ${lesson.targetWpm} WPM & ${lesson.targetAccuracy}%. Got ${completedResult.wpm} WPM & ${completedResult.accuracy}%.`}
                    </p>
                  </div>
                </div>

                {completedResult.passed && (
                  <div className="flex items-center gap-1">
                    {[1,2,3].map(star => (
                      <span key={star} className={`text-xl ${star <= completedResult.stars ? 'text-amber-400' : 'text-[var(--border)]'}`}>★</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Results grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'WPM', value: `${completedResult.wpm}`, color: 'var(--accent)' },
                  { label: 'Accuracy', value: `${completedResult.accuracy}%`, color: 'var(--ui-success)' },
                  { label: 'Typos', value: `${completedResult.mistakes}`, color: 'var(--text-primary)' },
                  { label: 'Time', value: `${completedResult.duration}s`, color: 'var(--text-primary)' },
                ].map(stat => (
                  <div key={stat.label} className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
                    <div className="text-[10px] uppercase font-mono text-[var(--text-muted)]">{stat.label}</div>
                    <div className="text-lg font-bold font-mono" style={{ color: stat.color }}>{stat.value}</div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button variant="secondary" size="sm" icon={RotateCcw} onClick={handleReset}>
                  Retry Lesson
                </Button>
                <div className="flex items-center gap-2">
                  {onBack && (
                    <Button variant="outline" size="sm" onClick={onBack}>
                      Stage Overview
                    </Button>
                  )}
                  {completedResult.passed && hasNextLesson && onNextLesson && (
                    <Button variant="primary" size="sm" icon={ArrowRight} onClick={onNextLesson}>
                      Next Lesson
                    </Button>
                  )}
                  {completedResult.passed && hasNextStage && onNextStage && !hasNextLesson && (
                    <Button variant="primary" size="sm" icon={ArrowRight} onClick={onNextStage}>
                      Next Stage
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Guide panel (right column) */}
        {(keyboardGuideOn || handGuideOn) && (
          <div className="xl:col-span-4 space-y-4">
            {/* Guide labels */}
            <div className="card-panel p-4 space-y-4">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)]">
                Next Key: <span className="text-[var(--accent)] font-bold text-sm">
                  {currentTargetChar === ' ' ? '⎵ Space' : currentTargetChar ?? '—'}
                </span>
              </div>

              {keyboardGuideOn && (
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] mb-2">Keyboard Guide</div>
                  <KeyboardGuide targetChar={currentTargetChar} isVisible={keyboardGuideOn} />
                </div>
              )}

              {handGuideOn && (
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] mb-2">Hand Guide</div>
                  <HandGuide targetChar={currentTargetChar} isVisible={handGuideOn} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
