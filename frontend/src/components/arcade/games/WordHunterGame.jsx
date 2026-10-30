import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Target, RotateCcw, Play, Pause, ArrowLeft, Trophy, Crosshair, Clock, Flame, ShieldAlert, Sparkles } from 'lucide-react';
import { Button } from '../../common/Button';
import { calculateAccuracy, playArcadeSound } from '../../../utils/arcadeEngine';
import { saveArcadeRecord, getGameRecord } from '../../../utils/arcadeStorage';
import { calculateDifficultyTier, getWordHunterConfig } from '../../../utils/arcadeDifficulty';
import { ArcadeWordDeck, getVocabularyPool } from '../../../utils/arcadeVocabulary';
import { ArcadeExitDialog } from '../ArcadeExitDialog';
import { useI18n } from '../../../i18n/I18nContext';
import { Sniper3DScene } from '../hunter3d/Sniper3DScene';
import { Sniper3DAudio } from '../hunter3d/Sniper3DAudio';

const TOTAL_GAME_TIME = 60; // 60s tactical hunt
const TARGET_LIFETIME = 4.5; // seconds to destroy current target

export const WordHunterGame = ({ onExit, soundEnabled = true }) => {
  const { t } = useI18n();
  const [gameState, setGameState] = useState('ready');
  const [countdown, setCountdown] = useState(3);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // 3D Canvas container & engine refs
  const canvasContainerRef = useRef(null);
  const scene3dRef = useRef(null);
  const audio3dRef = useRef(null);

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

  // Radar targets: [{ id, word, x, y }]
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

  // Audio initialization
  useEffect(() => {
    audio3dRef.current = new Sniper3DAudio();
    audio3dRef.current.setEnabled(soundEnabled);

    return () => {
      audio3dRef.current?.cleanup();
    };
  }, []);

  useEffect(() => {
    audio3dRef.current?.setEnabled(soundEnabled);
  }, [soundEnabled]);

  // Three.js 3D Scene Initialization
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const scene = new Sniper3DScene(canvasContainerRef.current);
    scene3dRef.current = scene;

    return () => {
      scene.destroy();
      scene3dRef.current = null;
    };
  }, []);

  const prevTierRef = useRef(1);
  useEffect(() => {
    if (difficultyInfo.tier > prevTierRef.current) {
      setTierUpToast(`TARGET SECTOR ESCALATION — TIER ${difficultyInfo.tier} (${difficultyInfo.tierName})`);
      audio3dRef.current?.playLockOn();
      // Dynamically switch deck pool to elevated difficulty tier
      wordDeckRef.current.setPool(getVocabularyPool('hunter', difficultyInfo.tier));
      const t = setTimeout(() => setTierUpToast(null), 3000);
      prevTierRef.current = difficultyInfo.tier;
      return () => clearTimeout(t);
    }
    prevTierRef.current = difficultyInfo.tier;
  }, [difficultyInfo.tier, difficultyInfo.tierName]);

  // Spawn initial cluster of radar targets with anti-repetition
  const spawnInitialCluster = useCallback(() => {
    const coords = [
      { x: 20, y: 24 }, { x: 50, y: 18 }, { x: 80, y: 28 },
      { x: 28, y: 55 }, { x: 52, y: 52 }, { x: 74, y: 60 },
      { x: 36, y: 80 }, { x: 68, y: 82 },
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
    const t = setTimeout(() => {
      setGameState('playing');
      audio3dRef.current?.playLockOn();
    }, 0);
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
          audio3dRef.current?.playErrorAlarm();
          setStreak(0);
          setMistakes((m) => m + 1);
          setTypedBuffer('');
          // Re-lock to next available
          setTargets((prev) => {
            if (prev.length <= 1) return prev;
            const remaining = prev.filter((t) => t.id !== lockedTargetId);
            setLockedTargetId(remaining[0]?.id || null);
            audio3dRef.current?.playLockOn();
            return remaining;
          });
          return hunterConfig.targetLifetime;
        }
        return Math.max(0, parseFloat((ttl - 0.1).toFixed(2)));
      });
    }, 100);

    return () => clearInterval(targetTimerRef.current);
  }, [gameState, lockedTargetId, hunterConfig.targetLifetime]);

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

  // Sync 3D Scene Drones with React state
  useEffect(() => {
    if (gameState === 'playing' || gameState === 'ready') {
      scene3dRef.current?.syncTargets(
        targets,
        lockedTargetId,
        typedBuffer,
        targetTimeLeft,
        hunterConfig.targetLifetime
      );
    }
  }, [targets, lockedTargetId, typedBuffer, targetTimeLeft, gameState, hunterConfig.targetLifetime]);

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
        audio3dRef.current?.playKeyPing();
        const nextBuf = typedBuffer + char;
        setTypedBuffer(nextBuf);

        // Target destroyed!
        if (nextBuf.length === activeTarget.word.length) {
          // Trigger 3D Sniper Shot & Drone Detonation!
          scene3dRef.current?.fireSniperShot(activeTarget.id);
          audio3dRef.current?.playSniperShot();
          audio3dRef.current?.playDroneExplosion();

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
              audio3dRef.current?.playLockOn();
            }
            return remaining;
          });
        }
      } else {
        // Typing mistake
        audio3dRef.current?.playErrorAlarm();
        setMistakes((m) => m + 1);
      }
    }
  };

  const activeTarget = targets.find((t) => t.id === lockedTargetId);
  const accuracy = calculateAccuracy(correctStrokes, totalStrokes);
  const streakMultiplier = (1 + streak * 0.2).toFixed(1);

  return (
    <div
      className="card-panel p-4 sm:p-6 space-y-4 max-w-5xl mx-auto border border-[var(--border)] shadow-2xl relative select-none"
      onClick={() => inputRef.current?.focus()}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* Top Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="xs" icon={ArrowLeft} onClick={handleAttemptExit}>
            {t('nav.arcade')}
          </Button>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Crosshair className="w-5 h-5 text-sky-400" />
              <span>3D Cyber Sniper</span>
            </h2>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              {hunterConfig.tierLabel} Sector (Tier {difficultyInfo.tier}) • {streakMultiplier}x Multiplier • 360° Tactical Lock
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
        <div className="px-3.5 py-2 rounded-xl bg-sky-950/90 border border-sky-500/60 text-sky-300 font-mono text-xs flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2">
          <span className="flex items-center gap-2 font-bold">
            <Flame className="w-4 h-4 text-sky-400 animate-pulse" />
            {tierUpToast}
          </span>
          <span className="text-[10px] text-sky-400 uppercase tracking-wider font-semibold">
            Tactical Scan Range Expanded
          </span>
        </div>
      )}

      {/* 3D WebGL Cyber Cityscape & Sniper Scope Viewport */}
      <div className="relative rounded-2xl overflow-hidden border border-[var(--border)] bg-neutral-950 shadow-2xl h-[480px]">
        {/* Three.js Canvas Container */}
        <div ref={canvasContainerRef} className="w-full h-full cursor-crosshair" />

        {/* Tactical Crosshairs Center Reticle */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-28 h-28 border border-sky-400/40 rounded-full flex items-center justify-center animate-pulse">
            <div className="w-20 h-20 border border-dashed border-sky-400/50 rounded-full" />
            <div className="absolute w-full h-px bg-sky-400/30" />
            <div className="absolute h-full w-px bg-sky-400/30" />
            <div className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
          </div>
        </div>

        {/* Dynamic Top HUD Overlay */}
        <div className="absolute inset-x-0 top-0 p-4 pointer-events-none flex items-start justify-between">
          {/* Mission Timer */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-xs font-mono text-white shadow-lg">
            <Clock className={`w-4 h-4 ${timeLeft <= 10 ? 'text-rose-400 animate-pulse' : 'text-sky-400'}`} />
            <span className="text-sm font-bold">{timeLeft}s</span>
          </div>

          {/* Active Target Urgency Countdown */}
          {gameState === 'playing' && (
            <div className="flex flex-col items-center px-4 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 shadow-lg">
              <span className="text-[9px] uppercase tracking-wider font-mono text-neutral-400 font-semibold">
                Target Escape Window
              </span>
              <div className="flex items-baseline gap-1">
                <span className={`text-xl font-black font-mono tracking-tight ${
                  targetTimeLeft < 1.5 ? 'text-rose-400 animate-pulse' : 'text-sky-300'
                }`}>
                  {targetTimeLeft.toFixed(1)}s
                </span>
              </div>
            </div>
          )}

          {/* Drones Eliminated & Streak */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-xs font-mono shadow-lg">
            <Target className="w-4 h-4 text-emerald-400" />
            <span className="text-white font-bold">{targetsEliminated} Kills</span>
            <span className="text-amber-400 font-semibold">({streak}x)</span>
          </div>
        </div>

        {/* Bottom Active Target Callsign HUD */}
        {gameState === 'playing' && activeTarget && (
          <div className="absolute inset-x-0 bottom-4 flex flex-col items-center pointer-events-none px-4">
            <div className="px-6 py-2.5 rounded-xl bg-black/85 backdrop-blur-md border border-white/15 flex items-center gap-4 shadow-2xl">
              <span className="text-xs font-mono text-sky-400 uppercase tracking-wider font-bold">
                LOCK-ON:
              </span>
              <div className="text-2xl sm:text-3xl font-mono font-bold tracking-wide">
                {activeTarget.word.split('').map((char, idx) => {
                  const typed = typedBuffer[idx];
                  const isTyped = idx < typedBuffer.length;
                  const isCorrect = isTyped && typed === char;
                  const isCurrent = idx === typedBuffer.length;

                  let colorClass = 'text-white/60';
                  if (isCorrect) colorClass = 'text-emerald-400';
                  else if (isTyped) colorClass = 'text-rose-400 underline';
                  else if (isCurrent) colorClass = 'text-amber-400 bg-amber-400/20 px-0.5 rounded';

                  return (
                    <span key={idx} className={colorClass}>
                      {char}
                    </span>
                  );
                })}
              </div>
              <span className="text-[10px] font-mono text-neutral-400 border border-neutral-700 px-1.5 py-0.5 rounded">
                Type Call-sign
              </span>
            </div>
          </div>
        )}

        {/* Hidden Input for Keystrokes */}
        <input
          ref={inputRef}
          type="text"
          value=""
          onChange={() => {}}
          disabled={gameState !== 'playing'}
          className="opacity-0 absolute inset-0 w-full h-full cursor-default"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
          aria-label="Tactical Cyber Target Input"
        />

        {/* Ready Overlay */}
        {gameState === 'ready' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xs z-30 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-sky-500/20 border border-sky-500/40 text-sky-400 flex items-center justify-center shadow-2xl animate-pulse">
              <Crosshair className="w-9 h-9" />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <h3 className="text-2xl font-black text-white tracking-tight">3D Cyber Sniper</h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Take vantage position overlooking the cyberpunk skyline. Type rogue drone callsigns to lock on, fire electromagnetic railgun beams, and neutralize air targets before they escape.
              </p>
            </div>
            <Button variant="primary" size="lg" icon={Play} onClick={startCountdown} className="bg-sky-500 hover:bg-sky-600 text-white font-bold px-8 shadow-xl">
              INITIALIZE TACTICAL SCOPE
            </Button>
          </div>
        )}

        {/* 3-2-1 Countdown Overlay */}
        {gameState === 'countdown' && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-xs z-30 flex items-center justify-center">
            <span className="text-7xl font-black font-mono text-sky-400 animate-pulse drop-shadow-[0_0_30px_rgba(56,189,248,0.8)]">
              {countdown}
            </span>
          </div>
        )}

        {/* Paused Overlay */}
        {gameState === 'paused' && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-xs z-30 flex flex-col items-center justify-center space-y-4">
            <h3 className="text-2xl font-bold text-white font-mono">TACTICAL RECON PAUSED</h3>
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

        {/* Game Over Summary Overlay */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-black/92 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-xl">
              <Trophy className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white tracking-tight">MISSION DEBRIEF</h3>
              <p className="text-xs text-neutral-400 font-mono">Airspace Patrol Concluded</p>
            </div>

            {personalBestNotice && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold animate-pulse">
                <Trophy className="w-3.5 h-3.5" /> NEW SECTOR BEST RECORD!
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/5 p-4 rounded-xl border border-white/10 text-xs font-mono w-full max-w-md">
              <div>
                <span className="text-[10px] text-neutral-400 block uppercase">Drones Neutralized</span>
                <span className="text-xl font-bold text-sky-400">{targetsEliminated}</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block uppercase">Accuracy</span>
                <span className="text-xl font-bold text-emerald-400">{accuracy}%</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block uppercase">Best Streak</span>
                <span className="text-xl font-bold text-amber-400">{bestStreak}x</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block uppercase">Total Score</span>
                <span className="text-xl font-bold text-white">{score}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button variant="primary" size="md" icon={RotateCcw} onClick={startCountdown} className="bg-sky-500 hover:bg-sky-600 text-white font-bold">
                {t('arcade.hud.playAgain')}
              </Button>
              <Button variant="outline" size="md" onClick={onExit}>
                {t('arcade.hud.returnToHub')}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info Strip */}
      <div className="flex flex-wrap items-center justify-between text-xs text-[var(--text-muted)] font-mono px-1">
        <span>Type displayed drone callsign to discharge electromagnetic sniper beam</span>
        <span>Best Streak: {personalBest?.bestStreak || 0} • Escapes/Mistakes: {mistakes}</span>
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

export default WordHunterGame;
