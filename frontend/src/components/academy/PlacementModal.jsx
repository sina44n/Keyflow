import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Compass,
  CheckCircle2,
  X,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info,
  Clock,
  Target,
  BarChart3,
  Award,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import {
  PLACEMENT_TIERS,
  evaluateTierPerformance,
  aggregateAssessmentProfile,
  calculateStageRecommendation,
} from '../../utils/placementEngine.js';
import { applyPlacementAccess } from '../../utils/lessonProgress.js';

/**
 * Dedicated Tactile Keycap Component
 * Distinct visual representations for standard letters and wide Spacebar key.
 */
const Keycap = ({ label, isSpace = false, isActive = false }) => {
  if (isSpace) {
    return (
      <span
        className={`inline-flex items-center justify-center px-4 py-1.5 min-w-[120px] sm:min-w-[160px] rounded-lg text-[11px] sm:text-xs font-mono font-bold tracking-wider select-none transition-all shadow-sm ${
          isActive
            ? 'bg-[var(--accent)] text-[var(--accent-fg)] border-t border-white/30 border-b-2 border-black/60 shadow-md ring-2 ring-[var(--accent)]/50'
            : 'bg-[var(--bg-elevated)] border-t border-white/15 border-x border-b-2 border-black/50 text-[var(--accent)]'
        }`}
        aria-label="Spacebar key"
      >
        <span className="mr-1.5 opacity-80 text-sm">␣</span>
        <span>SPACEBAR</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center px-2 py-1 min-w-[32px] sm:min-w-[36px] rounded-md text-xs font-mono font-bold select-none transition-all shadow-sm ${
        isActive
          ? 'bg-[var(--accent)] text-[var(--accent-fg)] border-t border-white/30 border-b-2 border-black/60 shadow-md ring-2 ring-[var(--accent)]/50'
          : 'bg-[var(--bg-elevated)] border-t border-white/15 border-x border-b-2 border-black/50 text-[var(--text-primary)]'
      }`}
    >
      {label}
    </span>
  );
};

export const PlacementModal = ({
  isOpen,
  onClose,
  onPlacementApplied,
}) => {
  // Modal flow states: 'intro' | 'testing' | 'results'
  const [modalState, setModalState] = useState('intro');
  const [currentTierIndex, setCurrentTierIndex] = useState(0);
  const [tierResults, setTierResults] = useState([]);

  // Active tier typing state
  const [typed, setTyped] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [keystrokes, setKeystrokes] = useState([]);
  const [evaluation, setEvaluation] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputRef = useRef(null);

  const activeTier = PLACEMENT_TIERS[currentTierIndex] || PLACEMENT_TIERS[0];
  const targetText = activeTier.text;

  // Auto-focus hidden input during typing state
  useEffect(() => {
    if (isOpen && modalState === 'testing') {
      const timer = setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isOpen, modalState, currentTierIndex]);

  // Reset entire assessment
  const handleFullReset = useCallback(() => {
    setModalState('intro');
    setCurrentTierIndex(0);
    setTierResults([]);
    setTyped('');
    setStartTime(null);
    setKeystrokes([]);
    setEvaluation(null);
    setIsSubmitting(false);
  }, []);

  // Reset only active tier
  const handleResetCurrentTier = useCallback(() => {
    setTyped('');
    setStartTime(null);
    setKeystrokes([]);
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 50);
  }, []);

  // Handle tier completion and progression
  const completeTier = useCallback((finalTyped, finalStrokes, durationSec) => {
    const tierEval = evaluateTierPerformance({
      targetText,
      typedText: finalTyped,
      keystrokes: finalStrokes,
      durationSeconds: durationSec,
    });

    const recordedTier = {
      ...tierEval,
      tierId: activeTier.id,
      tierNumber: activeTier.tierNumber,
      typedTextLength: finalTyped.length,
      keystrokeCount: finalStrokes.length,
      durationSeconds: durationSec,
    };

    const nextTierResults = [...tierResults, recordedTier];
    setTierResults(nextTierResults);

    // Adaptive Check:
    // If beginner struggled heavily on Tier 1 (Gross WPM < 18 or Accuracy < 75%),
    // conclude early at Stage 1 to prevent frustrating technical tests
    const isTier1Struggle = activeTier.tierNumber === 1 && (tierEval.grossWpm < 18 || tierEval.overallAccuracy < 75);

    // Check if more tiers remain and not concluding early
    const nextTierIdx = currentTierIndex + 1;
    const shouldContinue = !isTier1Struggle && nextTierIdx < PLACEMENT_TIERS.length;

    // For Tier 4 (technical capstone), only present if user performed well on Tiers 1-3
    const qualifiesForTier4 = nextTierIdx === 3
      ? nextTierResults.every((r) => r.grossWpm >= 45 && r.overallAccuracy >= 88)
      : true;

    if (shouldContinue && qualifiesForTier4) {
      setCurrentTierIndex(nextTierIdx);
      setTyped('');
      setStartTime(null);
      setKeystrokes([]);
    } else {
      // Finalize multi-tier assessment
      const overallProfile = aggregateAssessmentProfile(nextTierResults);
      const finalRecommendation = calculateStageRecommendation(overallProfile);
      setEvaluation({
        ...overallProfile,
        recommendation: finalRecommendation,
      });
      setModalState('results');
    }
  }, [activeTier, currentTierIndex, targetText, tierResults]);

  // Keystroke handler for typing input
  const handleKeyDown = (e) => {
    if (modalState !== 'testing') return;
    if (e.key === 'Tab') return;

    const now = Date.now();
    const effectiveStart = startTime || now;
    if (!startTime) {
      setStartTime(now);
    }

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

      // Check if finished current tier
      if (nextTyped.length >= targetText.length) {
        const durationSec = Math.max(0.5, (now - effectiveStart) / 1000);
        completeTier(nextTyped, nextStrokes, durationSec);
      }
    }
  };

  // Apply placement access to local storage & backend
  const handleApplyPlacement = async () => {
    if (!evaluation?.recommendation?.recommendedStage) return;
    const recommendedStage = evaluation.recommendation.recommendedStage;
    setIsSubmitting(true);

    try {
      // 1. Local authoritative unlock
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
              accuracy: evaluation.overallAccuracy,
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

  // Decline placement and exit
  const handleDeclinePlacement = async () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="placement-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && modalState !== 'testing') onClose();
      }}
    >
      <div className="relative w-full max-w-3xl rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] shadow-2xl p-5 sm:p-7 md:p-8 space-y-6 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto no-scrollbar">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
          aria-label="Close placement test dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ======================================================== */}
        {/* HEADER SECTION                                          */}
        {/* ======================================================== */}
        <div className="flex items-start gap-3.5 pr-8 border-b border-[var(--border)] pb-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 flex items-center justify-center shrink-0 shadow-xs">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent)] font-bold">
                Path 02 · Comprehensive Assessment
              </span>
              {modalState === 'testing' && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)]">
                  Step {activeTier.tierNumber} of {PLACEMENT_TIERS.length}
                </span>
              )}
            </div>
            <h2 id="placement-modal-title" className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
              KEYFLOW Typing Placement Test
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Intelligent multi-competency assessment mapped across KEYFLOW's 10-stage Academy curriculum.
            </p>
          </div>
        </div>

        {/* ======================================================== */}
        {/* STATE 1: INTRODUCTION SCREEN                             */}
        {/* ======================================================== */}
        {modalState === 'intro' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                Find Your True Typing Level
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                This diagnostic evaluates your typing ability across multiple core skills—including typing speed, foundational accuracy, keyboard row reaches, Spacebar discipline, number row dexterity, punctuation coordination, and rhythm cadence.
              </p>
            </div>

            {/* Assessment Pillars Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
                  <Target className="w-4 h-4 text-[var(--accent)]" />
                  <span>Accuracy Matters as Much as Speed</span>
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Type naturally without rushing. Fast typing with high mistake rates will not grant access to advanced stages.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
                  <BarChart3 className="w-4 h-4 text-[var(--accent)]" />
                  <span>Multi-Competency Analysis</span>
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Measures all three letter rows, Spacebar word separation, numbers, punctuation, and rhythm consistency.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
                  <Award className="w-4 h-4 text-[var(--accent)]" />
                  <span>Prerequisite-Aware Placement</span>
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Recommends the highest stage for which you have demonstrated full readiness, explaining your strengths and focus areas.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
                  <ShieldCheck className="w-4 h-4 text-[#34A853]" />
                  <span>Zero-Loss Access Guarantee</span>
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Accepting placement unlocks access without fabricating artificial lesson completions, stars, or fake achievements.
                </p>
              </div>
            </div>

            {/* Spacebar Instruction Preview Note */}
            <div className="p-3.5 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-xs text-[var(--text-secondary)] flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
              <span>
                <strong>Spacebar Clarity:</strong> In all exercises, words are separated by keyboard spaces. Press the Spacebar once firmly between each word. Dedicated visual keycaps will guide you.
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setModalState('testing')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-[var(--accent-fg)] text-xs font-mono font-bold shadow-md hover:opacity-90 active:scale-98 transition-all cursor-pointer"
              >
                <span>Begin Assessment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STATE 2: TESTING INTERACTIVE TYPING SCREEN              */}
        {/* ======================================================== */}
        {modalState === 'testing' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Step Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-[var(--text-primary)]">
                  Step {activeTier.tierNumber} of {PLACEMENT_TIERS.length}: {activeTier.title}
                </span>
                <span className="text-[var(--text-muted)]">
                  {typed.length} / {targetText.length} characters
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                <div
                  className="h-full bg-[var(--accent)] transition-all duration-200"
                  style={{ width: `${Math.round((typed.length / targetText.length) * 100)}%` }}
                />
              </div>
            </div>

            {/* Visual Section A: Explicit Instructions Box */}
            <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[var(--accent)] uppercase tracking-wider">
                <Info className="w-3.5 h-3.5" />
                <span>Assessment Instruction</span>
              </div>
              <p className="text-xs sm:text-sm text-[var(--text-primary)] font-medium leading-relaxed">
                {activeTier.instruction}
              </p>
            </div>

            {/* Visual Section B: Typing Content Monospace Area */}
            <div
              className="relative p-5 sm:p-6 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] font-mono text-base sm:text-lg leading-relaxed tracking-wider cursor-text outline-none focus-within:border-[var(--accent)] transition-colors shadow-inner"
              onClick={() => inputRef.current?.focus()}
            >
              <div className="select-none flex flex-wrap gap-x-0.5">
                {targetText.split('').map((char, idx) => {
                  const typedChar = typed[idx];
                  let charClass = 'text-[var(--text-muted)] opacity-60';
                  if (typedChar !== undefined) {
                    charClass = typedChar === char
                      ? 'text-[#34A853] font-bold'
                      : 'text-[#EA4335] bg-[#EA4335]/20 rounded-xs font-bold';
                  }
                  const isCurrent = idx === typed.length;

                  return (
                    <span key={idx} className={`relative ${charClass}`}>
                      {char === ' ' ? ' ' : char}
                      {isCurrent && (
                        <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[var(--accent)] animate-pulse" />
                      )}
                    </span>
                  );
                })}
              </div>

              {/* Hidden input to capture physical keyboard input */}
              <input
                ref={inputRef}
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
              />
            </div>

            {/* Visual Section C: Keyboard Guidance Bar (Dedicated Keycaps) */}
            <div className="p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Keyboard Guidance · Keys & Spacebar Separation
                </span>
                <span className="text-[10px] font-mono text-[var(--text-muted)]">
                  Press Spacebar between words
                </span>
              </div>

              {/* Visual keycaps flow */}
              <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]/60 overflow-x-auto no-scrollbar">
                {activeTier.guidanceWords.map((word, wIdx) => {
                  // Determine whether current cursor is in this word or the subsequent space
                  return (
                    <React.Fragment key={wIdx}>
                      <Keycap label={word} />
                      {wIdx < activeTier.guidanceWords.length - 1 && (
                        <Keycap label="␣ SPACEBAR" isSpace={true} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Live Telemetry & Control Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={handleResetCurrentTier}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restart Section</span>
              </button>

              <div className="flex items-center gap-3 text-xs font-mono text-[var(--text-muted)]">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>Type at your natural pace</span>
                </span>
                <button
                  type="button"
                  onClick={handleFullReset}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] underline cursor-pointer ml-2"
                >
                  Exit Test
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STATE 3: RESULTS & INTELLIGENT STAGE RECOMMENDATION     */}
        {/* ======================================================== */}
        {modalState === 'results' && evaluation && (
          <div className="space-y-6 animate-in fade-in duration-200">
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

            {/* Core Metric Strip */}
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
                <div className={`text-xl sm:text-2xl font-extrabold ${evaluation.overallAccuracy >= 90 ? 'text-[#34A853]' : 'text-[#FBBC05]'}`}>
                  {evaluation.overallAccuracy}%
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Cadence Flow</div>
                <div className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)]">
                  {evaluation.cadenceScore}%
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
                  Evaluated across {evaluation.tiersCompletedCount} diagnostic tiers
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

            {/* Diagnosed Weak Keys Badge Row */}
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

            {/* Transparent Hardware Finger Tracking Note */}
            <div className="text-[11px] text-[var(--text-muted)] italic leading-relaxed">
              * Note: Direct hardware finger tracking is not present; keyboard reach control and cadence balance are evaluated objectively from observable keystroke latencies and mistake patterns.
            </div>

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

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={handleFullReset}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake Assessment</span>
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleDeclinePlacement}
                  className="px-4 py-2.5 rounded-xl text-xs font-mono text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
                >
                  Decline (Start from Stage 1)
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
