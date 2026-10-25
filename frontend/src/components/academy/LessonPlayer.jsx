import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  RotateCcw, Volume2, VolumeX, ArrowRight, ArrowLeft,
  CheckCircle2, AlertCircle, Keyboard, Hand,
  Zap, Target, Flame, Clock, ChevronDown,
} from 'lucide-react';
import { Button } from '../common/Button';
import { KeyboardGuide } from './KeyboardGuide';
import { ThemeSwitcher } from '../common/ThemeSwitcher';
import { getLesson } from '../../data/curriculumEngine';
import {
  recordLessonResult, calculateStars,
  getGuidePreferences, saveGuidePreferences,
} from '../../utils/lessonProgress';

/**
 * LessonPlayer — Masterpiece Typing Workstation matching the reference design.
 * 
 * Symmetrical, centered 780px content column aligning:
 * 1. Slim glowing progress bar & subtitle header
 * 2. Floating monospace passage with active-word focus pill & blinking caret
 * 3. 4-stat metric strip with vertical dividers
 * 4. Precision ANSI 60% Virtual Keyboard with Realistic Human Hand Guide
 * 5. Lower guide toggles and motivational footer
 */
export const LessonPlayer = ({
  stageId,
  lessonNum = 1,
  onBack,
  onNextLesson,
  onNextStage,
  hasNextLesson = true,
  hasNextStage = false,
  stage: legacyStage,
}) => {
  // ── Resolve lesson data ──────────────────────────────────────────────────
  const lesson = useMemo(() => {
    if (stageId && lessonNum) {
      try { return getLesson(stageId, lessonNum); } catch { /* fallback */ }
    }
    if (legacyStage) {
      return {
        id: `stage-${legacyStage.id}-lesson-001`,
        stageId: legacyStage.id, lessonNum: 1,
        stageTitle: legacyStage.title, title: legacyStage.title,
        unitLabel: legacyStage.subtitle || '', unit: 1,
        objective: legacyStage.objective, badge: legacyStage.badge,
        targetKeys: legacyStage.keys, homeKeys: legacyStage.homeKeys,
        exerciseText: legacyStage.exercise, difficulty: 'beginner',
        targetWpm: legacyStage.targetWpm, targetAccuracy: legacyStage.targetAccuracy,
        estimatedSeconds: legacyStage.estimatedSeconds,
        isAssessment: false, isMilestone: false, guidance: legacyStage.guidance,
      };
    }
    return null;
  }, [stageId, lessonNum, legacyStage]);

  // ── Guide preferences ────────────────────────────────────────────────────
  const [keyboardGuideOn, setKeyboardGuideOn] = useState(() => getGuidePreferences().keyboardGuide);
  const [handGuideOn, setHandGuideOn] = useState(() => getGuidePreferences().handGuide);

  // ── Typing state ─────────────────────────────────────────────────────────
  const [typed, setTyped] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [totalStrokes, setTotalStrokes] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [completedResult, setCompletedResult] = useState(null);

  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const completionFiredRef = useRef(false);
  const streakRef = useRef(0);

  const targetText = lesson?.exerciseText ?? '';

  // ── Derived metrics ──────────────────────────────────────────────────────
  const currentTargetChar = useMemo(() => {
    if (!targetText || typed.length >= targetText.length) return null;
    return targetText[typed.length];
  }, [typed, targetText]);

  const correctChars = useMemo(() => {
    let count = 0;
    for (let i = 0; i < typed.length; i++) {
      if (typed[i] === targetText[i]) count++;
    }
    return count;
  }, [typed, targetText]);

  const elapsedMinutes = Math.max((elapsedSeconds || 1) / 60, 0.016);
  const currentWpm = startTime ? Math.max(0, Math.round((correctChars / 5) / elapsedMinutes)) : 0;
  const currentAccuracy = totalStrokes > 0
    ? Math.max(0, Math.min(100, Math.round((correctChars / Math.max(correctChars + mistakes, 1)) * 100)))
    : 100;
  const progressPercent = targetText ? Math.min(100, Math.round((typed.length / targetText.length) * 100)) : 0;

  const timeDisplay = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:${String(elapsedSeconds % 60).padStart(2, '0')}`;

  // ── Audio Feedback ───────────────────────────────────────────────────────
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
    } catch { /* audio context blocked */ }
  }, [soundEnabled]);

  // ── Reset ────────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setTyped('');
    setStartTime(null);
    setElapsedSeconds(0);
    setTotalStrokes(0);
    setMistakes(0);
    setStreak(0);
    setMaxStreak(0);
    streakRef.current = 0;
    setIsCompleted(false);
    setCompletedResult(null);
    completionFiredRef.current = false;
    clearInterval(timerRef.current);
    setTimeout(() => { if (inputRef.current) inputRef.current.focus(); }, 50);
  }, []);

  useEffect(() => { handleReset(); }, [lesson?.id, handleReset]);

  // ── Timer ────────────────────────────────────────────────────────────────
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

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  // ── Input handler ────────────────────────────────────────────────────────
  const handleInputChange = useCallback((e) => {
    if (isCompleted || !targetText) return;
    const value = e.target.value;

    if (!startTime && value.length > 0) {
      setStartTime(Date.now());
    }

    if (value.length < typed.length) {
      setTyped(value);
      streakRef.current = 0;
      setStreak(0);
      return;
    }

    const newChar = value[value.length - 1];
    const expectedChar = targetText[typed.length];
    const isCorrect = newChar === expectedChar;

    setTotalStrokes(prev => prev + 1);

    if (isCorrect) {
      streakRef.current += 1;
      const currentStreakVal = streakRef.current;
      setStreak(currentStreakVal);
      setMaxStreak(prev => Math.max(prev, currentStreakVal));
      playClick(false);
    } else {
      streakRef.current = 0;
      setStreak(0);
      setMistakes(prev => prev + 1);
      playClick(true);
    }

    setTyped(value);

    // Completion check
    if (value.length >= targetText.length && !completionFiredRef.current) {
      completionFiredRef.current = true;
      setIsCompleted(true);
      clearInterval(timerRef.current);

      const finalDuration = Math.max(1, Math.floor((Date.now() - (startTime || Date.now())) / 1000));
      const finalMinutes = finalDuration / 60;
      let finalCorrect = 0;
      for (let i = 0; i < targetText.length; i++) {
        if (value[i] === targetText[i]) finalCorrect++;
      }
      const finalWpm = Math.max(0, Math.round((finalCorrect / 5) / Math.max(finalMinutes, 0.016)));
      const finalStrokes = totalStrokes + 1;
      const finalMistakes = isCorrect ? mistakes : mistakes + 1;
      const finalAccuracy = Math.max(0, Math.min(100, Math.round((finalCorrect / Math.max(finalCorrect + finalMistakes, 1)) * 100)));
      const finalStars = calculateStars(finalWpm, finalAccuracy, lesson?.targetWpm || 20, lesson?.targetAccuracy || 90);
      const passed = finalWpm >= (lesson?.targetWpm || 20) && finalAccuracy >= (lesson?.targetAccuracy || 90);

      const result = {
        wpm: finalWpm,
        accuracy: finalAccuracy,
        mistakes: finalMistakes,
        duration: finalDuration,
        stars: finalStars,
        passed,
        maxStreak,
        totalStrokes: finalStrokes,
      };
      setCompletedResult(result);

      if (lesson?.id) {
        try {
          recordLessonResult(lesson.id, {
            wpm: finalWpm,
            accuracy: finalAccuracy,
            stars: finalStars,
            mistakes: finalMistakes,
            duration: finalDuration,
            completedAt: new Date().toISOString(),
          });
        } catch { /* storage fallback */ }
      }
    }
  }, [isCompleted, targetText, typed, startTime, totalStrokes, mistakes, maxStreak, playClick, lesson]);

  // ── Guide toggles ────────────────────────────────────────────────────────
  const toggleKeyboardGuide = useCallback(() => {
    setKeyboardGuideOn(prev => {
      const next = !prev;
      saveGuidePreferences(next, handGuideOn);
      return next;
    });
  }, [handGuideOn]);

  const toggleHandGuide = useCallback(() => {
    setHandGuideOn(prev => {
      const next = !prev;
      saveGuidePreferences(keyboardGuideOn, next);
      return next;
    });
  }, [keyboardGuideOn]);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleReset();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleReset]);

  // ── Parse words for reference-matched passage rendering ──────────────────
  const words = useMemo(() => {
    if (!targetText) return [];
    const tokens = [];
    let currentIndex = 0;
    const parts = targetText.split(/(\s+)/);

    parts.forEach((part) => {
      if (!part) return;
      const startIndex = currentIndex;
      const endIndex = startIndex + part.length;
      tokens.push({
        text: part,
        isSpace: /^\s+$/.test(part),
        startIndex,
        endIndex,
        key: `${startIndex}-${part}`,
      });
      currentIndex = endIndex;
    });
    return tokens;
  }, [targetText]);

  if (!lesson) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-sm font-mono text-[var(--text-muted)]">Lesson not found.</p>
        {onBack && <Button variant="secondary" onClick={onBack}>Back to Academy</Button>}
      </div>
    );
  }

  const currentTypedIndex = typed.length;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[var(--bg-main,#0b1120)] text-[var(--text-primary)] overflow-y-auto overflow-x-hidden selection:bg-[var(--accent)] selection:text-black"
      style={{
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* ── AMBIENT CYANO-FLOW BACKGROUND CURVES (Reference Match) ─────── */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none opacity-20"
        preserveAspectRatio="none"
        viewBox="0 0 1440 900"
        aria-hidden="true"
      >
        <path d="M -80 180 C 180 320, 80 620, -40 820" stroke="var(--accent, #06b6d4)" strokeWidth="1.2" fill="none" opacity="0.4" />
        <path d="M -60 130 C 220 290, 120 670, -10 870" stroke="var(--accent, #06b6d4)" strokeWidth="0.8" fill="none" opacity="0.25" />
        <path d="M 1520 180 C 1260 320, 1360 620, 1480 820" stroke="var(--accent, #06b6d4)" strokeWidth="1.2" fill="none" opacity="0.4" />
        <path d="M 1500 130 C 1220 290, 1320 670, 1450 870" stroke="var(--accent, #06b6d4)" strokeWidth="0.8" fill="none" opacity="0.25" />
      </svg>

      {/* ── TOP NAVIGATION BAR (Reference Match) ───────────────────────── */}
      <nav
        className="w-full relative z-30 border-b border-[var(--border,#1e293b)] backdrop-blur-md shrink-0"
        style={{
          background: 'color-mix(in srgb, var(--bg-surface, #0c1322) 80%, transparent)',
        }}
      >
        <div className="w-full px-4 sm:px-8 h-16 flex items-center justify-between relative">
          {/* Left: Brand & Breadcrumb */}
          <div className="flex items-center gap-3 sm:gap-4 z-10 shrink-0">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-1.5 transition-colors cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                aria-label="Back to Academy"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            {/* KEYFLOW Logo */}
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shadow-xs"
                style={{ background: 'var(--accent, #06b6d4)' }}
              >
                <Keyboard className="w-4 h-4 text-white" />
              </div>
              <span className="font-mono text-sm font-extrabold tracking-wider hidden sm:inline text-[var(--text-primary)]">
                KEY<span style={{ color: 'var(--accent, #06b6d4)' }}>FLOW</span>
              </span>
            </div>

            {/* Breadcrumb: Academy / Lesson 129 */}
            <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
              <span className="opacity-40">/</span>
              <span>Academy</span>
              <span className="opacity-40">/</span>
              <span className="font-semibold text-[var(--accent,#06b6d4)]">
                Lesson {lesson.lessonNum}
              </span>
            </div>
          </div>

          {/* Center: Lesson Title — Centered relative to viewport */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none hidden md:block max-w-[360px] truncate text-center">
            <span className="text-[15px] font-medium text-[var(--text-primary)] tracking-wide pointer-events-auto">
              {lesson.title || `Lesson ${lesson.lessonNum}`}
            </span>
          </div>

          {/* Right: Controls & Profile */}
          <div className="flex items-center gap-1 sm:gap-2 z-10 shrink-0">
            {/* Restart */}
            <button
              type="button"
              onClick={handleReset}
              title="Restart lesson (Esc)"
              aria-label="Restart lesson"
              className="p-2 rounded-lg transition-colors cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Keyboard Guide Toggle Icon */}
            <button
              type="button"
              onClick={toggleKeyboardGuide}
              title={`Keyboard Guide: ${keyboardGuideOn ? 'ON' : 'OFF'}`}
              aria-label={`Keyboard Guide ${keyboardGuideOn ? 'on' : 'off'}`}
              className="p-2 rounded-lg transition-colors cursor-pointer"
              style={{ color: keyboardGuideOn ? 'var(--accent, #06b6d4)' : 'var(--text-muted)' }}
            >
              <Keyboard className="w-4 h-4" />
            </button>

            {/* Hand Guide Toggle Icon */}
            <button
              type="button"
              onClick={toggleHandGuide}
              title={`Hand Guide: ${handGuideOn ? 'ON' : 'OFF'}`}
              aria-label={`Hand Guide ${handGuideOn ? 'on' : 'off'}`}
              className="p-2 rounded-lg transition-colors cursor-pointer"
              style={{ color: handGuideOn ? 'var(--accent, #06b6d4)' : 'var(--text-muted)' }}
            >
              <Hand className="w-4 h-4" />
            </button>

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(p => !p)}
              title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
              aria-label={`Sound ${soundEnabled ? 'on' : 'off'}`}
              className="p-2 rounded-lg transition-colors cursor-pointer"
              style={{ color: soundEnabled ? 'var(--accent, #06b6d4)' : 'var(--text-muted)' }}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Divider */}
            <div className="w-px h-5 mx-1 bg-[var(--border,#1e293b)]" />

            {/* Hidden-until-clicked Studio Theme Switcher */}
            <ThemeSwitcher compact={true} />

            {/* Profile Avatar Pill */}
            <div
              className="flex items-center gap-1.5 pl-2 py-1 pr-1.5 rounded-full cursor-pointer transition-colors border border-[var(--border,#1e293b)] bg-[var(--bg-elevated,#131d31)]"
              title="User Account"
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-mono text-white shadow-xs"
                style={{ background: 'var(--accent, #06b6d4)' }}
              >
                S
              </div>
              <span className="hidden sm:inline text-[11px] font-mono font-semibold tracking-wider px-1 text-[var(--text-primary)]">
                SINAN
              </span>
              <ChevronDown className="w-3 h-3 opacity-60 text-[var(--text-muted)]" />
            </div>
          </div>
        </div>
      </nav>

      {/* ── UNIFIED CENTERED CONTENT COLUMN (780px Design Target) ────── */}
      <main
        className="flex-1 flex flex-col justify-center items-center relative z-10 w-full max-w-[780px] mx-auto px-4 sm:px-6 py-6"
      >
        {/* ── LESSON SUBTITLE & GLOWING PROGRESS BAR ─────────────────── */}
        <div className="w-full mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-[11px] font-mono tracking-widest uppercase font-semibold text-[var(--text-muted,#64748b)]"
            >
              LESSON {lesson.lessonNum} · {lesson.unitLabel || 'WORD ACCURACY'}
            </span>
            <span
              className="text-xs font-mono font-bold text-[var(--accent,#06b6d4)]"
            >
              {progressPercent}%
            </span>
          </div>

          {/* Slim 3px Progress Bar */}
          <div
            className="w-full rounded-full overflow-hidden bg-[color-mix(in_srgb,var(--border,#1e293b)_70%,transparent)]"
            style={{ height: '3px' }}
          >
            <div
              className="h-full rounded-full transition-all duration-150"
              style={{
                width: `${progressPercent}%`,
                background: 'var(--accent, #06b6d4)',
                boxShadow: progressPercent > 0 ? '0 0 10px var(--accent, #06b6d4)' : 'none',
              }}
            />
          </div>
        </div>

        {/* ── SEAMLESS FLOATING PASSAGE CANVAS (Active Word Highlight) ── */}
        <div
          onClick={() => inputRef.current && inputRef.current.focus()}
          className="relative w-full cursor-text mb-8 sm:mb-10 select-none transition-all duration-150 min-h-[140px] flex items-center justify-start text-left"
          role="region"
          aria-label="Typing practice canvas"
        >
          {/* Monospace floating text */}
          <div
            className="font-mono leading-[2.2] tracking-wide break-words text-xl sm:text-2xl text-left w-full"
            aria-hidden="true"
          >
            {words.map((word) => {
              const isCurrentWord =
                currentTypedIndex >= word.startIndex &&
                currentTypedIndex <= word.endIndex &&
                !isCompleted;

              if (word.isSpace) {
                return (
                  <span key={word.key} className="inline">
                    {word.text.split('').map((sp, spIdx) => {
                      const absoluteIdx = word.startIndex + spIdx;
                      let spCls = 'text-[var(--text-muted)] opacity-30';
                      if (absoluteIdx < currentTypedIndex) {
                        spCls =
                          typed[absoluteIdx] === ' '
                            ? 'text-[var(--accent)]'
                            : 'text-[var(--ui-error,#ef4444)] underline';
                      }
                      return (
                        <span key={spIdx} className={spCls}>
                          {' '}
                        </span>
                      );
                    })}
                  </span>
                );
              }

              return (
                <span
                  key={word.key}
                  className={`inline-block relative rounded-md transition-all duration-100 ${
                    isCurrentWord
                      ? 'px-1.5 py-0.5 -my-0.5 mx-0.5 border border-[#38bdf8]/40 bg-[#0284c7]/15 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                      : 'border border-transparent'
                  }`}
                >
                  {word.text.split('').map((char, charIdx) => {
                    const charAbsoluteIdx = word.startIndex + charIdx;
                    const isTyped = charAbsoluteIdx < currentTypedIndex;
                    const isAtCaret =
                      charAbsoluteIdx === currentTypedIndex && !isCompleted;
                    const isCorrect = isTyped && typed[charAbsoluteIdx] === char;
                    const isIncorrect = isTyped && !isCorrect;

                    let charColor =
                      'color-mix(in srgb, var(--text-muted, #64748b) 60%, transparent)';
                    if (isCorrect) charColor = 'var(--accent, #06b6d4)';
                    if (isIncorrect) charColor = 'var(--ui-error, #ef4444)';

                    return (
                      <span key={charIdx} className="relative inline">
                        {/* Blinking vertical cursor */}
                        {isAtCaret && (
                          <span
                            className="absolute -left-[1px] top-[10%] bottom-[10%] w-[2px] rounded-full animate-pulse z-10"
                            style={{
                              background: '#38bdf8',
                              boxShadow: '0 0 8px #38bdf8',
                            }}
                          />
                        )}
                        <span
                          style={{
                            color: charColor,
                            fontWeight: isTyped || isCurrentWord ? '500' : '400',
                          }}
                        >
                          {char}
                        </span>
                      </span>
                    );
                  })}
                  {/* Blinking cursor at end of word if completely typed */}
                  {currentTypedIndex === word.endIndex && isCurrentWord && (
                    <span
                      className="inline-block w-[2px] h-[1.2em] align-middle ml-0.5 rounded-full animate-pulse"
                      style={{
                        background: '#38bdf8',
                        boxShadow: '0 0 8px #38bdf8',
                      }}
                    />
                  )}
                </span>
              );
            })}
          </div>

          {/* Hidden real input */}
          <input
            ref={inputRef}
            type="text"
            value={typed}
            onChange={handleInputChange}
            disabled={isCompleted}
            className="absolute inset-0 opacity-0 w-full h-full cursor-default"
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-label="Type the exercise text here"
          />
        </div>

        {/* ── 4-STAT METRIC ROW (Matching Reference Layout) ──────────── */}
        <div
          className="w-full grid grid-cols-4 gap-0 mb-8 sm:mb-10 items-center justify-between"
        >
          {[
            {
              icon: Zap,
              label: 'WPM',
              value: currentWpm,
              color: 'var(--text-primary)',
              iconColor: 'var(--accent, #06b6d4)',
            },
            {
              icon: Target,
              label: 'ACCURACY',
              value: `${currentAccuracy}%`,
              color: 'var(--text-primary)',
              iconColor: '#F59E0B',
            },
            {
              icon: Flame,
              label: 'STREAK',
              value: streak,
              color: 'var(--text-primary)',
              iconColor: '#F97316',
            },
            {
              icon: Clock,
              label: 'TIME',
              value: timeDisplay,
              color: 'var(--text-primary)',
              iconColor: '#38BDF8',
            },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="flex flex-col items-center justify-center py-2 px-1 relative"
              >
                {/* Vertical Divider */}
                {i > 0 && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-8 bg-[var(--border,#1e293b)] opacity-60"
                  />
                )}
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Icon className="w-3.5 h-3.5" style={{ color: stat.iconColor }} aria-hidden="true" />
                  <span
                    className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-[var(--text-muted,#64748b)]"
                  >
                    {stat.label}
                  </span>
                </div>
                <div
                  className="text-2xl sm:text-3xl font-mono font-medium tracking-tight text-[var(--text-primary)]"
                >
                  {stat.value}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── PRECISION ANSI 60% KEYBOARD + INTEGRATED HUMAN HANDS ──── */}
        <div className="w-full flex items-center justify-center">
          <KeyboardGuide
            targetChar={currentTargetChar}
            isVisible={keyboardGuideOn}
            handGuideVisible={handGuideOn}
          />
        </div>

        {/* ── DUAL PILL GUIDE TOGGLES (Reference Match) ──────────────── */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 mt-6">
          {/* Keyboard Guide Toggle */}
          <button
            type="button"
            onClick={toggleKeyboardGuide}
            aria-pressed={keyboardGuideOn}
            aria-label={`Keyboard guide ${keyboardGuideOn ? 'on' : 'off'}`}
            className="flex items-center gap-2.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-[var(--border,#1e293b)] bg-[color-mix(in_srgb,var(--bg-surface,#0c1322)_70%,transparent)] backdrop-blur-xs cursor-pointer transition-all duration-150 hover:border-[var(--text-muted)]"
          >
            <Keyboard className="w-3.5 h-3.5 text-[var(--text-muted)]" aria-hidden="true" />
            <span className="text-xs font-mono text-[var(--text-secondary)]">
              Keyboard guide
            </span>
            <span
              className="text-xs font-bold font-mono"
              style={{ color: keyboardGuideOn ? 'var(--accent, #06b6d4)' : 'var(--text-muted)' }}
            >
              {keyboardGuideOn ? 'ON' : 'OFF'}
            </span>
            {/* Toggle switch */}
            <div
              className="relative rounded-full transition-colors ml-1"
              style={{
                width: '36px',
                height: '20px',
                background: keyboardGuideOn ? 'var(--accent, #06b6d4)' : 'var(--bg-elevated, #1e293b)',
                border: '1px solid',
                borderColor: keyboardGuideOn ? 'var(--accent, #06b6d4)' : 'var(--border, #334155)',
              }}
            >
              <div
                className="absolute rounded-full transition-all"
                style={{
                  width: '14px',
                  height: '14px',
                  top: '2px',
                  left: keyboardGuideOn ? '18px' : '2px',
                  background: keyboardGuideOn ? '#ffffff' : 'var(--text-muted)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  transition: 'left 150ms ease, background 150ms ease',
                }}
              />
            </div>
          </button>

          {/* Hand Guide Toggle */}
          <button
            type="button"
            onClick={toggleHandGuide}
            aria-pressed={handGuideOn}
            aria-label={`Hand guide ${handGuideOn ? 'on' : 'off'}`}
            className="flex items-center gap-2.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-[var(--border,#1e293b)] bg-[color-mix(in_srgb,var(--bg-surface,#0c1322)_70%,transparent)] backdrop-blur-xs cursor-pointer transition-all duration-150 hover:border-[var(--text-muted)]"
          >
            <Hand className="w-3.5 h-3.5 text-[var(--text-muted)]" aria-hidden="true" />
            <span className="text-xs font-mono text-[var(--text-secondary)]">
              Hand guide
            </span>
            <span
              className="text-xs font-bold font-mono"
              style={{ color: handGuideOn ? 'var(--accent, #06b6d4)' : 'var(--text-muted)' }}
            >
              {handGuideOn ? 'ON' : 'OFF'}
            </span>
            {/* Toggle switch */}
            <div
              className="relative rounded-full transition-colors ml-1"
              style={{
                width: '36px',
                height: '20px',
                background: handGuideOn ? 'var(--accent, #06b6d4)' : 'var(--bg-elevated, #1e293b)',
                border: '1px solid',
                borderColor: handGuideOn ? 'var(--accent, #06b6d4)' : 'var(--border, #334155)',
              }}
            >
              <div
                className="absolute rounded-full transition-all"
                style={{
                  width: '14px',
                  height: '14px',
                  top: '2px',
                  left: handGuideOn ? '18px' : '2px',
                  background: handGuideOn ? '#ffffff' : 'var(--text-muted)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  transition: 'left 150ms ease, background 150ms ease',
                }}
              />
            </div>
          </button>
        </div>

        {/* ── MOTIVATIONAL FOOTER HINT (Reference Match) ─────────────── */}
        <div className="flex items-center justify-center gap-3 mt-6 sm:mt-8 text-xs font-mono text-[var(--text-muted,#64748b)]">
          <div className="w-16 h-px bg-[var(--border,#1e293b)] opacity-60" />
          <span>Keep your eyes on the text</span>
          <span className="opacity-40">•</span>
          <span>Relax your hands</span>
          <div className="w-16 h-px bg-[var(--border,#1e293b)] opacity-60" />
        </div>

        {/* ── COMPLETION RESULTS MODAL ───────────────────────────────── */}
        {isCompleted && completedResult && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/75"
          >
            <div
              className="w-full max-w-md rounded-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200 border bg-[var(--bg-surface)] shadow-2xl"
              style={{
                borderColor: completedResult.passed
                  ? 'var(--ui-success, #22c55e)'
                  : 'var(--ui-warning, #f59e0b)',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: completedResult.passed
                        ? 'color-mix(in srgb, var(--ui-success, #22c55e) 20%, transparent)'
                        : 'color-mix(in srgb, var(--ui-warning, #f59e0b) 20%, transparent)',
                      color: completedResult.passed
                        ? 'var(--ui-success, #22c55e)'
                        : 'var(--ui-warning, #f59e0b)',
                    }}
                  >
                    {completedResult.passed ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <AlertCircle className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[var(--text-primary)]">
                      {completedResult.passed ? 'Lesson Complete!' : 'Keep Practicing'}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {completedResult.passed
                        ? `${completedResult.wpm} WPM at ${completedResult.accuracy}% accuracy`
                        : `Goal: ${lesson.targetWpm} WPM & ${lesson.targetAccuracy}% accuracy`}
                    </p>
                  </div>
                </div>
                {completedResult.passed && (
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3].map(star => (
                      <span
                        key={star}
                        className="text-xl"
                        style={{
                          color:
                            star <= completedResult.stars
                              ? '#FBBF24'
                              : 'var(--border)',
                        }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'WPM', value: completedResult.wpm, color: 'var(--accent)' },
                  { label: 'ACC', value: `${completedResult.accuracy}%`, color: 'var(--ui-success, #22c55e)' },
                  { label: 'TYPOS', value: completedResult.mistakes, color: 'var(--text-primary)' },
                  { label: 'TIME', value: `${completedResult.duration}s`, color: 'var(--text-primary)' },
                ].map(stat => (
                  <div
                    key={stat.label}
                    className="rounded-xl p-3 text-center border border-[var(--border)] bg-[var(--bg-elevated)]"
                  >
                    <div className="text-[9px] uppercase font-mono tracking-wider mb-1 text-[var(--text-muted)]">{stat.label}</div>
                    <div className="text-lg font-bold font-mono" style={{ color: stat.color }}>{stat.value}</div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <Button variant="secondary" size="sm" icon={RotateCcw} onClick={handleReset}>
                  Retry
                </Button>
                <div className="flex items-center gap-2">
                  {onBack && (
                    <Button variant="outline" size="sm" onClick={onBack}>
                      Overview
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
          </div>
        )}
      </main>
    </div>
  );
};
