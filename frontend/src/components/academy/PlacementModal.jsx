import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Compass,
  CheckCircle2,
  X,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
  Target,
  BarChart3,
  Award,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import {
  PLACEMENT_DIAGNOSTIC_PASSAGE,
  evaluatePlacementDiagnostic,
} from '../../utils/placementEngine.js';
import { applyPlacementAccess } from '../../utils/lessonProgress.js';

/**
 * Dedicated Tactile Spacebar Keycap Component
 * Provides clear physical keycap visualization and subtle visual response on press.
 */
const SpacebarKeycap = ({ isPressed = false, isNext = false }) => {
  return (
    <span
      className={`inline-flex items-center justify-center gap-1.5 px-4 py-1.5 min-w-[110px] sm:min-w-[140px] rounded-lg text-xs font-mono font-bold tracking-wider select-none transition-all duration-150 shadow-sm border ${
        isPressed
          ? 'bg-[var(--accent)] text-[var(--accent-fg)] border-t border-white/30 border-b-2 border-black/60 shadow-inner scale-95 ring-2 ring-[var(--accent)]/50'
          : isNext
          ? 'bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--accent)] shadow-xs animate-pulse border-b-2'
          : 'bg-[var(--bg-card)] border-[var(--border)] border-b-2 border-b-black/30 text-[var(--text-primary)] hover:border-[var(--accent)]/50'
      }`}
      aria-label="Spacebar key indicator"
    >
      <span className="opacity-70 text-sm leading-none">␣</span>
      <span>SPACE</span>
    </span>
  );
};

export const PlacementModal = ({
  isOpen,
  onClose,
  onPlacementApplied,
}) => {
  // Modal flow states: 'testing' (direct primary experience) | 'results'
  const [modalState, setModalState] = useState('testing');

  // Typing and performance tracking
  const [typed, setTyped] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [keystrokes, setKeystrokes] = useState([]);
  const [mistakes, setMistakes] = useState(0);
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
  const [backspaces, setBackspaces] = useState(0);
  const [correctedIndices, setCorrectedIndices] = useState(() => new Set());
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const spaceTimerRef = useRef(null);

  // Synchronous refs to guarantee zero dropped keystrokes during rapid bursts
  const typedRef = useRef('');
  const keystrokesRef = useRef([]);
  const mistakesRef = useRef(0);
  const correctKeystrokesRef = useRef(0);
  const backspacesRef = useRef(0);

  const targetText = PLACEMENT_DIAGNOSTIC_PASSAGE;

  // Format seconds to mm:ss
  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Full reset to fresh typing assessment
  const handleReset = useCallback(() => {
    setModalState('testing');
    typedRef.current = '';
    keystrokesRef.current = [];
    mistakesRef.current = 0;
    correctKeystrokesRef.current = 0;
    backspacesRef.current = 0;

    setTyped('');
    setStartTime(null);
    setElapsedSeconds(0);
    setKeystrokes([]);
    setMistakes(0);
    setCorrectKeystrokes(0);
    setBackspaces(0);
    setCorrectedIndices(new Set());
    setIsSpacePressed(false);
    setEvaluation(null);
    setIsSubmitting(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 50);
  }, []);

  // When modal opens, focus input immediately so typing can begin directly
  useEffect(() => {
    if (isOpen) {
      handleReset();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isOpen, handleReset]);

  // Active elapsed-time ticker (only runs after first valid typing input)
  useEffect(() => {
    if (startTime && modalState === 'testing' && !evaluation) {
      timerRef.current = setInterval(() => {
        const sec = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
        setElapsedSeconds(sec);
      }, 250);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTime, modalState, evaluation]);

  // Auto-focus input when clicking text area or returning to testing
  useEffect(() => {
    if (isOpen && modalState === 'testing') {
      const focusTimer = setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 60);
      return () => clearTimeout(focusTimer);
    }
  }, [isOpen, modalState]);

  // Handle assessment completion
  const handleComplete = useCallback((finalTyped, finalStrokes, finalMistakes, finalCorrect, finalBackspaces, finalDuration) => {
    if (timerRef.current) clearInterval(timerRef.current);

    const result = evaluatePlacementDiagnostic({
      targetText,
      typedText: finalTyped,
      keystrokes: finalStrokes,
      durationSeconds: finalDuration,
      correctKeystrokes: finalCorrect,
      mistakes: finalMistakes,
      backspaces: finalBackspaces,
    });

    setEvaluation(result);
    setModalState('results');
  }, [targetText]);

  // Keystroke handler for typing input
  const handleKeyDown = (e) => {
    if (modalState !== 'testing') return;
    if (e.key === 'Tab') return;
    if (e.key === 'Escape') {
      onClose();
      return;
    }

    const now = Date.now();
    const effectiveStart = startTime || now;
    if (!startTime) {
      setStartTime(now);
      setElapsedSeconds(1);
    }

    // Handle Space key tactile feedback
    if (e.key === ' ') {
      setIsSpacePressed(true);
      if (spaceTimerRef.current) clearTimeout(spaceTimerRef.current);
      spaceTimerRef.current = setTimeout(() => {
        setIsSpacePressed(false);
      }, 120);
    }

    // Backspace: remove last character, track backspaces, do not erase error count
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (typedRef.current.length > 0) {
        const nextTyped = typedRef.current.slice(0, -1);
        typedRef.current = nextTyped;
        setTyped(nextTyped);
        backspacesRef.current += 1;
        setBackspaces(backspacesRef.current);
        keystrokesRef.current.push({ key: 'Backspace', time: now });
        setKeystrokes([...keystrokesRef.current]);
      }
      return;
    }

    // Single character typing input
    if (e.key.length === 1) {
      e.preventDefault();
      const currentIndex = typedRef.current.length;
      if (currentIndex >= targetText.length) return;

      const expectedChar = targetText[currentIndex];
      const isCorrect = e.key === expectedChar;

      if (isCorrect) {
        correctKeystrokesRef.current += 1;
        setCorrectKeystrokes(correctKeystrokesRef.current);
      } else {
        mistakesRef.current += 1;
        setMistakes(mistakesRef.current);
        setCorrectedIndices((prev) => {
          const next = new Set(prev);
          next.add(currentIndex);
          return next;
        });
      }

      const nextTyped = typedRef.current + e.key;
      typedRef.current = nextTyped;
      setTyped(nextTyped);

      const stroke = {
        key: e.key,
        time: now,
        correct: isCorrect,
        expected: expectedChar,
      };
      keystrokesRef.current.push(stroke);
      setKeystrokes([...keystrokesRef.current]);

      // Check if complete
      if (nextTyped.length >= targetText.length) {
        const finalDuration = Math.max(1, (now - effectiveStart) / 1000);
        handleComplete(
          nextTyped,
          [...keystrokesRef.current],
          mistakesRef.current,
          correctKeystrokesRef.current,
          backspacesRef.current,
          finalDuration
        );
      }
    }
  };

  // Apply placement access locally and synchronize with backend
  const handleApplyPlacement = async () => {
    if (!evaluation?.recommendation?.recommendedStage) return;
    const recommendedStage = evaluation.recommendation.recommendedStage;
    setIsSubmitting(true);

    try {
      // 1. Authoritative local unlock
      applyPlacementAccess(recommendedStage);

      // 2. Synchronize with backend API if user is logged in
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('keyflow_auth_token') : null;
      if (token) {
        try {
          const evalRes = await fetch('/api/lessons/curriculum/placement/evaluate/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              gross_wpm: evaluation.grossWpm,
              accuracy: evaluation.rawAccuracy,
              consistency_score: evaluation.cadenceScore,
              weak_keys: evaluation.weakKeys,
              tier_results: evaluation.competencies,
            }),
          });

          if (evalRes.ok) {
            const evalData = await evalRes.json();
            if (evalData.session_id) {
              await fetch('/api/lessons/curriculum/placement/confirm/', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                  session_id: evalData.session_id,
                  action: 'accept',
                }),
              });
            }
          }
        } catch (err) {
          console.warn('KEYFLOW placement backend sync notice (offline fallback):', err);
        }
      }

      onPlacementApplied(recommendedStage);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tokenize passage into words to make word boundaries cleanly distinguishable
  const words = useMemo(() => {
    const list = [];
    let currentWord = '';
    let startIndex = 0;

    for (let i = 0; i < targetText.length; i++) {
      const char = targetText[i];
      if (char === ' ') {
        if (currentWord.length > 0) {
          list.push({ text: currentWord, startIndex, isSpace: false });
          currentWord = '';
        }
        list.push({ text: ' ', startIndex: i, isSpace: true });
        startIndex = i + 1;
      } else {
        if (currentWord.length === 0) {
          startIndex = i;
        }
        currentWord += char;
      }
    }
    if (currentWord.length > 0) {
      list.push({ text: currentWord, startIndex, isSpace: false });
    }
    return list;
  }, [targetText]);

  // Check if current target character is a space
  const isNextCharSpace = typed.length < targetText.length && targetText[typed.length] === ' ';

  // Live gross WPM during typing
  const liveWpm = useMemo(() => {
    if (!startTime || typed.length === 0 || elapsedSeconds <= 0) return 0;
    const minutes = elapsedSeconds / 60;
    return Math.round((typed.length / 5) / minutes);
  }, [startTime, typed.length, elapsedSeconds]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="placement-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && modalState !== 'testing') onClose();
      }}
    >
      <div className="relative w-full max-w-3xl rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] shadow-2xl p-5 sm:p-7 md:p-8 space-y-5 animate-in zoom-in-95 duration-200 max-h-[94vh] overflow-y-auto no-scrollbar">
        {/* Top-Right Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
          aria-label="Close placement test dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ======================================================== */}
        {/* HEADER SECTION (Matches Reference Image 2)               */}
        {/* ======================================================== */}
        <div className="flex items-start gap-3.5 pr-8 border-b border-[var(--border)] pb-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 flex items-center justify-center shrink-0 shadow-xs">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent)] font-bold">
                Path 02 · Comprehensive Diagnostic Assessment
              </span>
            </div>
            <h2 id="placement-modal-title" className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
              KEYFLOW Typing Placement Test
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
              Type the passage below to discover your current typing ability and find your ideal Academy Stage.
            </p>
          </div>
        </div>

        {/* ======================================================== */}
        {/* PRIMARY EXPERIENCE: DIRECT TYPING TEST                   */}
        {/* ======================================================== */}
        {modalState === 'testing' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Slim Assessment Progress Bar */}
            <div className="w-full h-1.5 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
              <div
                className="h-full bg-[var(--accent)] transition-all duration-150"
                style={{ width: `${Math.round((typed.length / targetText.length) * 100)}%` }}
              />
            </div>

            {/* Main Typing Passage Area (4 to 5 Readable Desktop Lines) */}
            <div
              data-testid="placement-typing-passage"
              className="relative p-5 sm:p-6 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] font-mono text-base sm:text-lg leading-[2.2] tracking-wide cursor-text outline-none focus-within:border-[var(--accent)] transition-colors shadow-inner min-h-[175px]"
              onClick={() => inputRef.current?.focus()}
            >
              <div className="select-none text-left">
                {words.map((wordObj, wIdx) => {
                  if (wordObj.isSpace) {
                    const charIdx = wordObj.startIndex;
                    const typedChar = typed[charIdx];
                    const isCurrent = charIdx === typed.length;
                    let spaceColor = 'text-[var(--text-muted)] opacity-60';
                    if (typedChar !== undefined) {
                      spaceColor = typedChar === ' '
                        ? 'text-[#34A853]'
                        : 'text-[#EA4335] bg-[#EA4335]/25 rounded-xs';
                    }

                    return (
                      <span key={wIdx} className={`relative inline ${spaceColor}`}>
                        {' '}
                        {isCurrent && (
                          <span
                            className="absolute -left-[1px] top-[10%] bottom-[10%] w-[2px] rounded-full animate-pulse z-10"
                            style={{
                              background: 'var(--accent, #FF1744)',
                              boxShadow: '0 0 8px var(--accent, #FF1744)',
                            }}
                          />
                        )}
                      </span>
                    );
                  }

                  return (
                    <span key={wIdx} className="inline relative">
                      {wordObj.text.split('').map((char, cIdx) => {
                        const charAbsoluteIdx = wordObj.startIndex + cIdx;
                        const typedChar = typed[charAbsoluteIdx];
                        const isCurrent = charAbsoluteIdx === typed.length;
                        const hadError = correctedIndices.has(charAbsoluteIdx);

                        let charColor = 'text-[var(--text-muted)] opacity-60';
                        if (typedChar !== undefined) {
                          if (typedChar === char) {
                            charColor = hadError
                              ? 'text-[#FBBC05] font-bold' // Corrected with backspace
                              : 'text-[#34A853] font-bold'; // First-attempt correct
                          } else {
                            charColor = 'text-[#EA4335] bg-[#EA4335]/25 rounded-xs font-bold'; // Error
                          }
                        }

                        return (
                          <span key={cIdx} className={`relative inline ${charColor}`}>
                            {char}
                            {isCurrent && (
                              <span
                                className="absolute -left-[1px] top-[10%] bottom-[10%] w-[2px] rounded-full animate-pulse z-10"
                                style={{
                                  background: 'var(--accent, #FF1744)',
                                  boxShadow: '0 0 8px var(--accent, #FF1744)',
                                }}
                              />
                            )}
                          </span>
                        );
                      })}
                    </span>
                  );
                })}
              </div>

              {/* Hidden Physical Input */}
              <input
                ref={inputRef}
                data-testid="placement-typing-input"
                type="text"
                value=""
                onChange={() => {}}
                onKeyDown={handleKeyDown}
                className="absolute inset-0 opacity-0 cursor-default"
                aria-label="Placement test interactive typing input"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                autoFocus
              />
            </div>

            {/* Spacebar Guidance Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-xs">
              <div className="flex items-center gap-3">
                <SpacebarKeycap isPressed={isSpacePressed} isNext={isNextCharSpace} />
                <span className="text-[var(--text-secondary)] font-medium">
                  Press <span className="font-mono font-bold text-[var(--accent)]">SPACE</span> once between words.
                </span>
              </div>
              <div className="flex items-center gap-3 font-mono text-[var(--text-muted)] text-xs">
                <span>
                  {typed.length} / {targetText.length} characters
                </span>
              </div>
            </div>

            {/* Bottom Progress & Diagnostic Status Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--border)] text-xs font-mono text-[var(--text-muted)]">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-[var(--text-primary)] font-bold">
                  <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>{formatTime(elapsedSeconds)}</span>
                </span>
                {liveWpm > 0 && (
                  <span className="text-[var(--text-muted)]">
                    Live: <strong className="text-[var(--accent)] font-mono">{liveWpm}</strong> WPM
                  </span>
                )}
                <span className="hidden sm:inline text-[var(--text-muted)]">
                  Focus and type naturally at your normal speed.
                </span>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restart</span>
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* PLACEMENT RESULT SCREEN (Stage Recommendation)           */}
        {/* ======================================================== */}
        {modalState === 'results' && evaluation && (
          <div data-testid="placement-results-container" className="space-y-5 animate-in fade-in duration-200">
            {/* Primary Recommended Stage Banner */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[var(--accent)]/10 border-2 border-[var(--accent)] shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[var(--accent)] fill-current" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent)]">
                    Recommended Academy Placement
                  </span>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[var(--accent)] text-[var(--accent-fg)]">
                  Stage {evaluation.recommendation.recommendedStage} of 10
                </span>
              </div>

              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-[var(--text-primary)] tracking-tight">
                  Stage {evaluation.recommendation.recommendedStage}: {evaluation.recommendation.stageMeta.title}
                </h3>
                <div className="text-xs font-mono text-[var(--accent)] mt-0.5">
                  Recommended Starting Point: Unit 1 · Level 1 ({evaluation.recommendation.startingLessonLogicalId})
                </div>
              </div>

              {/* Plain English "Why This Stage?" */}
              <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-xs text-[var(--text-secondary)] leading-relaxed space-y-1">
                <span className="font-bold text-[var(--text-primary)] block">Why this stage?</span>
                <p>{evaluation.recommendation.reason}</p>
              </div>
            </div>

            {/* Core 4-Metric Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-center font-mono">
              <div>
                <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Gross Speed</div>
                <div className="text-xl sm:text-2xl font-extrabold text-[var(--accent)]">
                  {evaluation.grossWpm} <span className="text-xs font-normal text-[var(--text-muted)]">WPM</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Net Speed</div>
                <div className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)]">
                  {evaluation.netWpm} <span className="text-xs font-normal text-[var(--text-muted)]">WPM</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Accuracy</div>
                <div className={`text-xl sm:text-2xl font-extrabold ${evaluation.rawAccuracy >= 90 ? 'text-[#34A853]' : evaluation.rawAccuracy >= 80 ? 'text-[#FBBC05]' : 'text-[#EA4335]'}`}>
                  {evaluation.rawAccuracy}%
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Active Time</div>
                <div className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)]">
                  {formatTime(Math.round(evaluation.durationSeconds))}
                </div>
              </div>
            </div>

            {/* Multi-Competency Diagnostic Breakdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Multi-Competency Diagnostic Breakdown
                </span>
                <span className="text-[10px] font-mono text-[var(--text-muted)]">
                  Measured across 286-character diagnostic passage
                </span>
              </div>

              <div className="rounded-xl border border-[var(--border)] overflow-hidden text-xs divide-y divide-[var(--border)]">
                {evaluation.recommendation.skillBreakdown.map((item) => {
                  const isPassed = item.status === 'Passed';
                  return (
                    <div
                      key={item.key}
                      className="flex items-center justify-between px-3.5 py-2.5 bg-[var(--bg-card)] hover:bg-[var(--bg-elevated)] transition-colors"
                    >
                      <span className="font-medium text-[var(--text-primary)]">{item.label}</span>
                      <div className="flex items-center gap-3">
                        <span className={`font-mono font-bold ${isPassed ? 'text-[#34A853]' : 'text-[#EA4335]'}`}>
                          {item.accuracy}%
                        </span>
                        {isPassed ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#34A853]/15 text-[#34A853] font-bold">
                            Passed
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#EA4335]/15 text-[#EA4335] font-bold">
                            Focus Area
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Strengths & Focus Areas Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Strengths */}
              <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#34A853]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Demonstrated Strengths</span>
                </div>
                <ul className="space-y-1.5 text-xs text-[var(--text-secondary)]">
                  {evaluation.recommendation.strengths.length > 0 ? (
                    evaluation.recommendation.strengths.map((str, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-[#34A853] font-bold">•</span>
                        <span>{str}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-[var(--text-muted)]">Baseline skills ready for foundational training.</li>
                  )}
                </ul>
              </div>

              {/* Areas to Improve */}
              <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[var(--accent)]">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Recommended Focus Areas</span>
                </div>
                <ul className="space-y-1.5 text-xs text-[var(--text-secondary)]">
                  {evaluation.recommendation.areasToImprove.map((area, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-[var(--accent)] font-bold">•</span>
                      <span>{area}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Diagnosed Focus Keys (if any) */}
            {evaluation.weakKeys && evaluation.weakKeys.length > 0 && (
              <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] flex flex-wrap items-center gap-2.5 text-xs">
                <span className="text-[var(--text-muted)] font-mono font-bold">Diagnosed Focus Keys:</span>
                <div className="flex flex-wrap gap-1.5">
                  {evaluation.weakKeys.map((k, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-0.5 rounded-md bg-[var(--bg-card)] border border-[var(--border)] font-mono font-bold text-[var(--accent)] shadow-xs"
                    >
                      {k === ' ' ? 'Spacebar' : k}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Zero Fake Completion Guarantee Notice */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--text-muted)]">
              <ShieldCheck className="w-5 h-5 text-[#34A853] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-[var(--text-primary)] block">Zero-Fabrication Guarantee</span>
                <p>
                  Accepting placement grants immediate unlocked access to Stages 1 through {evaluation.recommendation.recommendedStage}. Zero false completion records, artificial stars, or fake achievements are fabricated. Your learning history remains 100% genuine.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake Assessment</span>
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-mono text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
                >
                  Start from Stage 1
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleApplyPlacement}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-[var(--accent-fg)] text-xs font-mono font-bold shadow-md hover:opacity-90 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                  <span>Accept & Unlock Stage {evaluation.recommendation.recommendedStage}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
