import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Compass,
  CheckCircle2,
  AlertCircle,
  X,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { STAGE_META } from '../../data/curriculumEngine';
import { applyPlacementAccess } from '../../utils/lessonProgress';

const DIAGNOSTIC_PASSAGE = "The quick brown fox jumps over 10 lazy dogs! Press Shift-4 to get $100; {flow: true}.";

const COMPETENCIES = [
  { key: 'home_row', label: 'Home Row Foundation', keys: new Set('asdfghjkl; ') },
  { key: 'top_row', label: 'Top Row Upward Reach', keys: new Set('qwertyuiop') },
  { key: 'bottom_row', label: 'Bottom Row Downward Reach', keys: new Set('zxcvbnm,.') },
  { key: 'numbers', label: 'Number Row Dexterity', keys: new Set('0123456789') },
  { key: 'shift_symbols', label: 'Shift & Punctuation', keys: new Set('!${}:"ABCDEFGHIJKLMNOPQRSTUVWXYZ') },
];

export const PlacementModal = ({
  isOpen,
  onClose,
  onPlacementApplied,
}) => {
  const [typed, setTyped] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [keystrokes, setKeystrokes] = useState([]);
  const [evaluation, setEvaluation] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef(null);

  // Auto-focus on modal open
  useEffect(() => {
    if (isOpen && !evaluation) {
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
    }
  }, [isOpen, evaluation]);

  // Reset diagnostic state
  const handleReset = useCallback(() => {
    setTyped('');
    setStartTime(null);
    setEndTime(null);
    setKeystrokes([]);
    setEvaluation(null);
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 50);
  }, []);

  if (!isOpen) return null;

  const targetText = DIAGNOSTIC_PASSAGE;

  // Real-time evaluation calculation
  const evaluatePerformance = (finalTyped, strokes, durationSec) => {
    const elapsedMinutes = Math.max(0.01, durationSec / 60);
    const grossWpm = Math.round((strokes.length / 5) / elapsedMinutes);

    let correctCount = 0;
    const errorsByKey = {};
    const competencyStats = {
      home_row: { correct: 0, total: 0 },
      top_row: { correct: 0, total: 0 },
      bottom_row: { correct: 0, total: 0 },
      numbers: { correct: 0, total: 0 },
      shift_symbols: { correct: 0, total: 0 },
    };

    for (let i = 0; i < targetText.length; i++) {
      const expectedChar = targetText[i];
      const typedChar = finalTyped[i] || '';

      COMPETENCIES.forEach((comp) => {
        if (comp.keys.has(expectedChar) || comp.keys.has(expectedChar.toLowerCase())) {
          competencyStats[comp.key].total++;
          if (typedChar === expectedChar) {
            competencyStats[comp.key].correct++;
          }
        }
      });

      if (typedChar === expectedChar) {
        correctCount++;
      } else if (typedChar) {
        errorsByKey[expectedChar] = (errorsByKey[expectedChar] || 0) + 1;
      }
    }

    const overallAccuracy = Math.round((correctCount / Math.max(1, finalTyped.length)) * 100);

    // Consistency (IKI variability approximation)
    let ikis = [];
    for (let i = 1; i < strokes.length; i++) {
      ikis.push(strokes[i].time - strokes[i - 1].time);
    }
    let consistency = 80;
    if (ikis.length > 5) {
      const avgIki = ikis.reduce((a, b) => a + b, 0) / ikis.length;
      const variance = ikis.reduce((sum, iki) => sum + Math.pow(iki - avgIki, 2), 0) / ikis.length;
      const stdDev = Math.sqrt(variance);
      const cv = avgIki > 0 ? (stdDev / avgIki) : 0.3;
      consistency = Math.max(30, Math.min(99, Math.round((1 - Math.min(1, cv)) * 100)));
    }

    const tierResults = {};
    Object.keys(competencyStats).forEach((k) => {
      const c = competencyStats[k];
      tierResults[k] = {
        accuracy: c.total > 0 ? Math.round((c.correct / c.total) * 100) : 100,
        total: c.total,
      };
    });

    // Accuracy Gatekeeper Decision Matrix:
    // Speed NEVER overrides foundational accuracy.
    const homeAcc = tierResults.home_row.accuracy;
    const topAcc = tierResults.top_row.accuracy;
    const bottomAcc = tierResults.bottom_row.accuracy;
    const numberAcc = tierResults.numbers.accuracy;
    const shiftAcc = tierResults.shift_symbols.accuracy;

    let recommendedStage = 1;
    let reason = "Novice placement: Home-Row anchor stabilization needed.";

    if (homeAcc < 90 || grossWpm < 20) {
      recommendedStage = 1;
      reason = "Home Row foundational practice recommended to establish tactile anchors.";
    } else if (topAcc < 90 || grossWpm < 28) {
      recommendedStage = 2;
      reason = "Home Row mastered; Top Row upward reach discipline needed.";
    } else if (bottomAcc < 90 || grossWpm < 34) {
      recommendedStage = 3;
      reason = "Home and Top Rows stable; Bottom Row downward reach discipline needed.";
    } else if (grossWpm < 42 || consistency < 60) {
      recommendedStage = 4;
      reason = "Full alphabet accessible; cross-row transition flow and rhythm needed.";
    } else if (numberAcc < 88) {
      recommendedStage = 5;
      reason = "Alphabet mastered, but Number Row dexterity requires structured training.";
    } else if (shiftAcc < 88) {
      recommendedStage = 6;
      reason = "Numbers mastered; Opposite-hand Shift coordination and punctuation needed.";
    } else if (grossWpm < 63 || consistency < 75) {
      recommendedStage = 7;
      reason = "All keys accessible; High-Frequency English rhythm and cadence needed.";
    } else if (grossWpm < 73 || overallAccuracy < 93) {
      recommendedStage = 8;
      reason = "Fluid cadence demonstrated; Speed burst and sustained stamina needed.";
    } else if (grossWpm < 83 || overallAccuracy < 95) {
      recommendedStage = 9;
      reason = "High speed confirmed; Technical syntax, code brackets, and structured data needed.";
    } else {
      recommendedStage = 10;
      reason = "Grandmaster qualified: Literary and dense technical manual mastery.";
    }

    const weakKeys = Object.entries(errorsByKey)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([k]) => k);

    return {
      grossWpm,
      overallAccuracy,
      consistency,
      recommendedStage,
      recommendedStageMeta: STAGE_META[recommendedStage - 1],
      reason,
      tierResults,
      weakKeys,
    };
  };

  const handleKeyDown = (e) => {
    if (evaluation) return;
    if (e.key === 'Tab') return;

    if (!startTime) {
      setStartTime(Date.now());
    }

    const now = Date.now();

    if (e.key === 'Backspace') {
      e.preventDefault();
      setTyped((prev) => prev.slice(0, -1));
      setKeystrokes((prev) => [...prev, { key: 'Backspace', time: now }]);
      return;
    }

    if (e.key.length === 1) {
      e.preventDefault();
      const nextTyped = typed + e.key;
      setTyped(nextTyped);
      const nextStrokes = [...keystrokes, { key: e.key, time: now }];
      setKeystrokes(nextStrokes);

      if (nextTyped.length >= targetText.length) {
        const durationSec = Math.max(1, (now - (startTime || now)) / 1000);
        setEndTime(now);
        const evalResult = evaluatePerformance(nextTyped, nextStrokes, durationSec);
        setEvaluation(evalResult);
      }
    }
  };

  const handleApplyPlacement = async () => {
    if (!evaluation) return;
    setIsSubmitting(true);
    try {
      applyPlacementAccess(evaluation.recommendedStage);

      // Backend sync if user authenticated
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('keyflow_auth_token') : null;
      if (token) {
        try {
          await fetch('/api/lessons/curriculum/placement/evaluate/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              gross_wpm: evaluation.grossWpm,
              accuracy: evaluation.overallAccuracy,
              consistency_score: evaluation.consistency,
              weak_keys: evaluation.weakKeys,
              tier_results: evaluation.tierResults,
            }),
          });
        } catch {
          // Graceful fallback
        }
      }

      onPlacementApplied(evaluation.recommendedStage);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="placement-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] shadow-2xl p-6 sm:p-7 space-y-6 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3.5 pr-8">
          <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 flex items-center justify-center shrink-0">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent)] font-bold">
              Path 02 · Comprehensive Diagnostic Assessment
            </div>
            <h2 id="placement-modal-title" className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
              KEYFLOW Typing Placement Test
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Type the passage below to diagnose your multi-row competencies and place into your optimal learning stage.
            </p>
          </div>
        </div>

        {/* Diagnostic Typing Area or Results View */}
        {!evaluation ? (
          <div className="space-y-4">
            {/* Interactive Monospace Prompt */}
            <div
              className="relative p-5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] font-mono text-sm sm:text-base leading-relaxed tracking-wide cursor-text outline-none focus-within:border-[var(--accent)] transition-colors"
              onClick={() => inputRef.current?.focus()}
            >
              <div className="select-none flex flex-wrap gap-x-0.5">
                {targetText.split('').map((char, idx) => {
                  const typedChar = typed[idx];
                  let charClass = 'text-[var(--text-muted)] opacity-60';
                  if (typedChar !== undefined) {
                    charClass = typedChar === char ? 'text-[#34A853] font-bold' : 'text-[#EA4335] bg-[#EA4335]/15 rounded-xs font-bold';
                  }
                  const isCurrent = idx === typed.length;

                  return (
                    <span key={idx} className={`relative ${charClass}`}>
                      {char}
                      {isCurrent && (
                        <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[var(--accent)] animate-pulse" />
                      )}
                    </span>
                  );
                })}
              </div>

              {/* Hidden Accessible Input for capturing keystrokes */}
              <input
                ref={inputRef}
                type="text"
                value=""
                onChange={() => {}}
                onKeyDown={handleKeyDown}
                className="absolute inset-0 opacity-0 cursor-default"
                aria-label="Diagnostic typing passage input"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-mono">
              <span>{typed.length} / {targetText.length} characters</span>
              <span>Focus and type naturally at your standard speed</span>
            </div>
          </div>
        ) : (
          /* Diagnostic Results View */
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Speedometer Style Metric Strip */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-center font-mono">
              <div>
                <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Gross Speed</div>
                <div className="text-2xl font-extrabold text-[var(--accent)]">{evaluation.grossWpm} <span className="text-xs font-normal text-[var(--text-muted)]">WPM</span></div>
              </div>
              <div>
                <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Accuracy</div>
                <div className={`text-2xl font-extrabold ${evaluation.overallAccuracy >= 90 ? 'text-[#34A853]' : 'text-[#FBBC05]'}`}>
                  {evaluation.overallAccuracy}%
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Cadence Flow</div>
                <div className="text-2xl font-extrabold text-[var(--text-primary)]">{evaluation.consistency}%</div>
              </div>
            </div>

            {/* Competency Matrix Table */}
            <div className="space-y-2">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Multi-Competency Diagnostic Matrix
              </div>
              <div className="rounded-xl border border-[var(--border)] overflow-hidden text-xs">
                {COMPETENCIES.map((comp) => {
                  const stat = evaluation.tierResults[comp.key] || { accuracy: 100 };
                  const isPassed = stat.accuracy >= 90;
                  return (
                    <div
                      key={comp.key}
                      className="flex items-center justify-between px-3.5 py-2.5 bg-[var(--bg-card)] border-b border-[var(--border)] last:border-b-0"
                    >
                      <span className="font-medium text-[var(--text-primary)]">{comp.label}</span>
                      <div className="flex items-center gap-3">
                        <span className={`font-mono font-bold ${isPassed ? 'text-[#34A853]' : 'text-[#EA4335]'}`}>
                          {stat.accuracy}%
                        </span>
                        {isPassed ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#34A853]/15 text-[#34A853]">Passed</span>
                        ) : (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#EA4335]/15 text-[#EA4335]">Focus Area</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Diagnosed Weak Keys if any */}
            {evaluation.weakKeys.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[var(--text-muted)] font-mono">Diagnosed Focus Keys:</span>
                <div className="flex gap-1.5">
                  {evaluation.weakKeys.map((k, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-[var(--bg-elevated)] border border-[var(--border)] font-mono font-bold text-[var(--accent)]">
                      {k === ' ' ? 'Space' : k}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendation Card */}
            <div className="p-4 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/30 space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[var(--accent)]" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent)]">
                  Placement Recommendation
                </span>
              </div>
              <div className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                Stage {evaluation.recommendedStage}: {evaluation.recommendedStageMeta.title}
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {evaluation.reason}
              </p>
            </div>

            {/* Zero Fake Completion Guarantee Notice */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--text-muted)]">
              <ShieldCheck className="w-4 h-4 text-[#34A853] shrink-0" />
              <span>Accepting placement unlocks stages 1 through {evaluation.recommendedStage} for immediate access. Zero false completion records or stars are fabricated.</span>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake Test</span>
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-mono text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
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
                  <span>Accept & Unlock Stage {evaluation.recommendedStage}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
