import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Target, RotateCcw, Play, Pause, ArrowLeft, Trophy, Crosshair, Clock, Flame } from 'lucide-react';
import { Button } from '../../common/Button';
import { calculateAccuracy, playArcadeSound } from '../../../utils/arcadeEngine';
import { saveArcadeRecord, getGameRecord } from '../../../utils/arcadeStorage';
import { calculateDifficultyTier, getWordHunterConfig } from '../../../utils/arcadeDifficulty';
import { ArcadeWordDeck, getVocabularyPool } from '../../../utils/arcadeVocabulary';
import { ArcadeExitDialog } from '../ArcadeExitDialog';
import { useI18n } from '../../../i18n/I18nContext';

const TOTAL_GAME_TIME = 60; // 60s tactical hunt
const TARGET_LIFETIME = 4.5; // seconds to destroy current target

export const WordHunterGame = ({ onExit, soundEnabled = true }) => {
  const { t } = useI18n();
  const [gameState, setGameState] = useState('ready');
  const [countdown, setCountdown] = useState(3);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Anti-repetition word deck initialized with Tier 1 pool
  const wordDeckRef = useRef(
    new ArcadeWordDeck({ gameId: 'hunter', pool: getVocabularyPool('hunter', 1) })
  );

  const [timeLeft, setTimeLeft] = useState(TOTAL_GAME_TIME);
  const [targetTimeLeft, setTargetTimeLeft] = useState(TARGET_LIFETIME);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [targetsEliminated, setTargetsEliminated] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  // Radar targets: [{ id, word, x, y, isLocked }]
  const [targets, setTargets] = useState([]);
  const [lockedTargetId, setLockedTargetId] = useState(null);
  const [typedBuffer, setTypedBuffer] = useState('');

  const [totalStrokes, setTotalStrokes] = useState(0);
  const [correctStrokes, setCorrectStrokes] = useState(0);
  const [personalBestNotice, setPersonalBestNotice] = useState(false);
  const [tierUpToast, setTierUpToast] = useState(null);

  const gameTimerRef = useRef(null);
  const targetTimerRef = useRef(null);
  const inputRef = useRef(null);
  const nextTargetIdRef = useRef(1);

  const personalBest = getGameRecord('hunter');

  // Dynamic difficulty calculation based on performance & progression
  const difficultyInfo = useMemo(() => {
    return calculateDifficultyTier({
      activeSeconds: TOTAL_GAME_TIME - timeLeft,
      completedCount: targetsEliminated,
      score,
      currentStreak: streak,
      errorCount: mistakes,
      mode: 'hunter',
    });
  }, [timeLeft, targetsEliminated, score, streak, mistakes]);

  const hunterConfig = useMemo(() => {
    return getWordHunterConfig(difficultyInfo.tier, difficultyInfo.performanceQuotient);
  }, [difficultyInfo.tier, difficultyInfo.performanceQuotient]);

  const prevTierRef = useRef(1);
  useEffect(() => {
    if (difficultyInfo.tier > prevTierRef.current) {
      setTierUpToast(`TARGET SECTOR ESCALATION — TIER ${difficultyInfo.tier} (${difficultyInfo.tierName})`);
      playArcadeSound('combo', soundEnabled);
      // Dynamically switch deck pool to elevated difficulty tier
      wordDeckRef.current.setPool(getVocabularyPool('hunter', difficultyInfo.tier));
      const t = setTimeout(() => setTierUpToast(null), 3000);
      prevTierRef.current = difficultyInfo.tier;
      return () => clearTimeout(t);
    }
    prevTierRef.current = difficultyInfo.tier;
  }, [difficultyInfo.tier, difficultyInfo.tierName, soundEnabled]);

  // Spawn initial cluster of radar targets with anti-repetition
  const spawnInitialCluster = useCallback(() => {
    const coords = [
      { x: 18, y: 22 }, { x: 50, y: 16 }, { x: 80, y: 26 },
      { x: 26, y: 55 }, { x: 52, y: 52 }, { x: 76, y: 62 },
      { x: 34, y: 82 }, { x: 68, y: 84 },
    ];
    const drawnWords = [];
    const newTargets = coords.map((pos) => {
      const word = wordDeckRef.current.draw(drawnWords);
      drawnWords.push(word);
      return {
        id: nextTargetIdRef.current++,
        word,
        x: pos.x,
        y: pos.y,
      };
    });
    setTargets(newTargets);
    if (newTargets.length > 0) {
      setLockedTargetId(newTargets[0].id);
    }
  }, []);

  const resetGame = useCallback(() => {
    setGameState('ready');
    setTimeLeft(TOTAL_GAME_TIME);
    setTargetTimeLeft(TARGET_LIFETIME);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setTargetsEliminated(0);
    setMistakes(0);
    setTotalStrokes(0);
    setCorrectStrokes(0);
    setTypedBuffer('');
    setPersonalBestNotice(false);
    wordDeckRef.current?.resetRun();
    spawnInitialCluster();
  }, [spawnInitialCluster]);

  const startCountdown = () => {
    resetGame();
    setGameState('countdown');
    setCountdown(3);
  };

  // Countdown
  useEffect(() => {
    if (gameState !== 'countdown') return;
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 800);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setGameState('playing'), 0);
    return () => clearTimeout(t);
  }, [gameState, countdown]);

  // Main session timer
  useEffect(() => {
    if (gameState !== 'playing') {
      clearInterval(gameTimerRef.current);
      return;
    }

    gameTimerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setGameState('gameover');
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(gameTimerRef.current);
  }, [gameState]);

  // Target urgency decay timer
  useEffect(() => {
    if (gameState !== 'playing') {
      clearInterval(targetTimerRef.current);
      return;
    }

    targetTimerRef.current = setInterval(() => {
      setTargetTimeLeft((ttl) => {
        if (ttl <= 0.1) {
          // Target escaped!
          playArcadeSound('damage', soundEnabled);
          setStreak(0);
          setMistakes((m) => m + 1);
          setTypedBuffer('');
          // Re-lock to next available
          setTargets((prev) => {
            if (prev.length <= 1) return prev;
            const remaining = prev.filter((t) => t.id !== lockedTargetId);
            setLockedTargetId(remaining[0]?.id || null);
            return remaining;
          });
          return hunterConfig.targetLifetime;
        }
        return Math.max(0, parseFloat((ttl - 0.1).toFixed(2)));
      });
    }, 100);

    return () => clearInterval(targetTimerRef.current);
  }, [gameState, lockedTargetId, hunterConfig.targetLifetime, soundEnabled]);

  // Maintain dynamic targets on radar based on difficulty tier with anti-repetition
  useEffect(() => {
    if (gameState !== 'playing') return;
    if (targets.length < hunterConfig.targetCount) {
      setTargets((prev) => {
        if (prev.length >= hunterConfig.targetCount) return prev;
        const activeWords = prev.map((t) => t.word);
        const newWord = wordDeckRef.current.draw(activeWords);
        const x = 15 + Math.random() * 70;
        const y = 15 + Math.random() * 70;
        return [
          ...prev,
          { id: nextTargetIdRef.current++, word: newWord, x, y },
        ];
      });
    }
  }, [targets.length, gameState, hunterConfig.targetCount]);

  // On Game Over, save record
  useEffect(() => {
    if (gameState === 'gameover') {
      const result = saveArcadeRecord('hunter', {
        score,
        bestStreak,
        targetsEliminated,
        highestTier: difficultyInfo.tier,
      });
      if (result.isNewBest) {
        const t = setTimeout(() => setPersonalBestNotice(true), 0);
        playArcadeSound('victory', soundEnabled);
        return () => clearTimeout(t);
      }
    }
  }, [gameState, score, bestStreak, targetsEliminated, difficultyInfo.tier, soundEnabled]);

  // Keyboard focus
  useEffect(() => {
    if (gameState === 'playing' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameState]);

  const handleAttemptExit = () => {
    if (gameState === 'playing' || gameState === 'paused') {
      setShowExitConfirm(true);
    } else {
      onExit();
    }
  };

  // Handle typing input
  const handleKeyDown = (e) => {
    if (showExitConfirm) {
      if (e.key === 'Escape') {
        setShowExitConfirm(false);
      }
      return;
    }

    if (e.key === 'Escape') {
      if (gameState === 'playing') setGameState('paused');
      else if (gameState === 'paused') setGameState('playing');
      return;
    }

    if (gameState !== 'playing') return;

    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      const char = e.key.toLowerCase();
      setTotalStrokes((s) => s + 1);

      const activeTarget = targets.find((t) => t.id === lockedTargetId);
      if (!activeTarget) return;

      const expectedChar = activeTarget.word[typedBuffer.length]?.toLowerCase();

      if (char === expectedChar) {
        setCorrectStrokes((s) => s + 1);
        playArcadeSound('blaster', soundEnabled);
        const nextBuf = typedBuffer + char;
        setTypedBuffer(nextBuf);

        // Target destroyed!
        if (nextBuf.length === activeTarget.word.length) {
          playArcadeSound('combo', soundEnabled);
          const pointsEarned = activeTarget.word.length * 20 * (1 + streak * 0.2);
          setScore((sc) => Math.round(sc + pointsEarned));
          setTargetsEliminated((te) => te + 1);
          setStreak((st) => {
            const nextSt = st + 1;
            setBestStreak((b) => Math.max(b, nextSt));
            return nextSt;
          });

          // Reset target decay
          setTargetTimeLeft(Math.max(2.5, TARGET_LIFETIME - Math.min(2, streak * 0.1)));
          setTypedBuffer('');

          // Switch lock to next closest target
          setTargets((prev) => {
            const remaining = prev.filter((t) => t.id !== activeTarget.id);
            if (remaining.length > 0) {
              setLockedTargetId(remaining[0].id);
            }
            return remaining;
          });
        }
      } else {
        // Typing mistake
        playArcadeSound('damage', soundEnabled);
        setMistakes((m) => m + 1);
        setStreak(0);
      }
    }
  };

  const accuracy = calculateAccuracy(correctStrokes, totalStrokes);
  const activeTarget = targets.find((t) => t.id === lockedTargetId);

  return (
    <div
      className="card-panel p-4 sm:p-6 space-y-4 max-w-4xl mx-auto border border-[var(--border)] shadow-2xl relative select-none"
      onClick={() => inputRef.current?.focus()}
    >
      <input
        ref={inputRef}
        type="text"
        className="opacity-0 absolute w-0 h-0 pointer-events-none"
        onKeyDown={handleKeyDown}
        aria-label="Word Hunter target input"
      />

      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="xs" icon={ArrowLeft} onClick={handleAttemptExit}>
            {t('nav.arcade')}
          </Button>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Target className="w-5 h-5 text-[var(--accent)]" />
              {t('arcade.hunter.title')}
            </h2>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              {difficultyInfo.tierName} Intensity (Tier {difficultyInfo.tier}) • Radar Lock & Neutralize
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {gameState === 'playing' ? (
            <Button variant="outline" size="xs" icon={Pause} onClick={() => setGameState('paused')}>
              {t('common.pause')}
            </Button>
          ) : gameState === 'paused' ? (
            <Button variant="primary" size="xs" icon={Play} onClick={() => setGameState('playing')}>
              {t('common.resume')}
            </Button>
          ) : null}
          <Button variant="ghost" size="xs" icon={RotateCcw} onClick={startCountdown}>
            {t('common.restart')}
          </Button>
        </div>
      </div>

      {/* Dynamic Tier Escalation Toast Banner */}
      {tierUpToast && (
        <div className="px-3 py-2 rounded-lg bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 font-mono text-xs flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <span className="flex items-center gap-2 font-bold">
            <Flame className="w-4 h-4 text-cyan-400 animate-pulse" />
            {tierUpToast}
          </span>
          <span className="text-[10px] text-cyan-400 uppercase">Target Density & Urgency Scaled</span>
        </div>
      )}

      {/* HUD Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 bg-[var(--bg-elevated)] p-3 rounded-xl border border-[var(--border)] text-xs font-mono">
        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)] flex items-center gap-1">
            <Clock className="w-3 h-3 text-[var(--accent)]" /> {t('arcade.hud.timeLeft')}
          </span>
          <span
            className={`text-base font-bold ${
              timeLeft <= 10 ? 'text-rose-400 animate-pulse' : 'text-[var(--text-primary)]'
            }`}
          >
            {timeLeft}s
          </span>
        </div>

        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)] block">{t('arcade.hud.score')}</span>
          <span className="text-base font-bold text-[var(--text-primary)]">{score}</span>
        </div>

        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)] block">Target Decay</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-400 transition-all duration-100"
                style={{ width: `${(targetTimeLeft / TARGET_LIFETIME) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-cyan-400 font-bold">{targetTimeLeft}s</span>
          </div>
        </div>

        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)] block">{t('workstation.wordsTyped')}</span>
          <span className="text-base font-bold text-emerald-400">{targetsEliminated}</span>
        </div>

        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)] block">{t('arcade.hud.streak')}</span>
          <span className="text-base font-bold text-amber-400">
            {streak} <span className="text-[10px] text-[var(--text-muted)]">(best {bestStreak})</span>
          </span>
        </div>

        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)] block">{t('common.accuracy')}</span>
          <span className="text-base font-bold text-[var(--ui-success)]">{accuracy}%</span>
        </div>
      </div>

      {/* Radar Target Arena */}
      <div
        className="relative w-full rounded-xl border border-[var(--border)] bg-[#070b12] overflow-hidden shadow-inner min-h-[380px]"
      >
        {/* Radar concentric circular guides */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <div className="w-80 h-80 rounded-full border border-cyan-500" />
          <div className="w-56 h-56 rounded-full border border-cyan-500 absolute" />
          <div className="w-32 h-32 rounded-full border border-cyan-500 absolute" />
          <div className="w-full h-px bg-cyan-500 absolute" />
          <div className="h-full w-px bg-cyan-500 absolute" />
        </div>

        {/* Floating radar targets */}
        {targets.map((tgt) => {
          const isLocked = tgt.id === lockedTargetId;
          const typedLen = isLocked ? typedBuffer.length : 0;
          const matchPart = tgt.word.slice(0, typedLen);
          const restPart = tgt.word.slice(typedLen);

          return (
            <div
              key={tgt.id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 font-mono text-xs font-bold transition-all duration-150 cursor-pointer ${
                isLocked
                  ? 'px-3 py-1.5 rounded-lg bg-cyan-950/80 border-2 border-cyan-400 text-cyan-200 ring-4 ring-cyan-500/30 scale-110 z-20 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                  : 'px-2 py-1 rounded-md bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-muted)] opacity-70 z-10 hover:opacity-100'
              }`}
              style={{ left: `${tgt.x}%`, top: `${tgt.y}%` }}
              onClick={(e) => {
                e.stopPropagation();
                setLockedTargetId(tgt.id);
                setTypedBuffer('');
                inputRef.current?.focus();
              }}
            >
              {isLocked ? (
                <div className="flex items-center gap-1.5">
                  <Crosshair className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                  <span>
                    <span className="text-emerald-400 bg-emerald-950/50 rounded px-0.5">
                      {matchPart}
                    </span>
                    <span className="text-cyan-100">{restPart}</span>
                  </span>
                </div>
              ) : (
                tgt.word
              )}
            </div>
          );
        })}

        {/* Current Lock-On Crosshair HUD overlay at bottom */}
        {activeTarget && (
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-[var(--bg-elevated)]/90 backdrop-blur-xs border border-cyan-500/40 px-4 py-2 rounded-xl flex items-center gap-3 z-20 shadow-xl">
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-bold">
              LOCKED TARGET:
            </span>
            <span className="text-base font-mono font-black tracking-wider text-[var(--text-primary)]">
              <span className="text-emerald-400">{activeTarget.word.slice(0, typedBuffer.length)}</span>
              <span>{activeTarget.word.slice(typedBuffer.length)}</span>
            </span>
          </div>
        )}

        {/* Overlays */}
        {gameState === 'ready' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xs z-30 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--accent)] flex items-center justify-center shadow-lg">
              <Target className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-xl font-bold text-[var(--text-primary)]">{t('arcade.hunter.title')}</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {t('arcade.hunter.desc')}
              </p>
            </div>
            <Button variant="primary" size="lg" icon={Play} onClick={startCountdown}>
              {t('common.play')}
            </Button>
          </div>
        )}

        {gameState === 'countdown' && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xs z-30 flex items-center justify-center">
            <span className="text-6xl font-black font-mono text-cyan-400 animate-pulse">
              {countdown}
            </span>
          </div>
        )}

        {gameState === 'paused' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xs z-30 flex flex-col items-center justify-center space-y-4">
            <h3 className="text-xl font-bold text-[var(--text-primary)]">{t('arcade.hud.pause')}</h3>
            <div className="flex gap-3">
              <Button variant="primary" size="sm" icon={Play} onClick={() => setGameState('playing')}>
                {t('common.resume')}
              </Button>
              <Button variant="outline" size="sm" icon={RotateCcw} onClick={startCountdown}>
                {t('common.restart')}
              </Button>
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <Trophy className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-[var(--text-primary)]">{t('arcade.hud.missionComplete')}</h3>
              <p className="text-xs text-[var(--text-secondary)]">{t('workstation.summary')}</p>
            </div>

            {personalBestNotice && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold">
                <Trophy className="w-3.5 h-3.5" /> {t('arcade.hud.newBest')}
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 bg-[var(--bg-elevated)] p-4 rounded-xl border border-[var(--border)] text-xs font-mono w-full max-w-sm">
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Total Score</span>
                <span className="text-lg font-bold text-[var(--accent)]">{score}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Eliminated</span>
                <span className="text-lg font-bold text-emerald-400">{targetsEliminated}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Peak Streak</span>
                <span className="text-lg font-bold text-amber-400">{bestStreak}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button variant="primary" size="md" icon={RotateCcw} onClick={startCountdown}>
                {t('arcade.hud.playAgain')}
              </Button>
              <Button variant="outline" size="md" onClick={onExit}>
                {t('arcade.hud.returnToHub')}
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between text-xs text-[var(--text-muted)] font-mono px-1">
        <span>Type characters in sequence or click targets to switch lock</span>
        <span>Escaped: {mistakes} • Personal Best: {personalBest?.bestScore || 0} pts</span>
      </div>

      {/* Exit Run Confirmation Dialog */}
      <ArcadeExitDialog
        isOpen={showExitConfirm}
        onCancel={() => setShowExitConfirm(false)}
        onConfirm={onExit}
      />
    </div>
  );
};
