import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Zap, RotateCcw, Play, Pause, ArrowLeft, Trophy, Clock, Flame, ShieldAlert, Sparkles } from 'lucide-react';
import { Button } from '../../common/Button';
import { calculateAccuracy, calculateWpm, playArcadeSound } from '../../../utils/arcadeEngine';
import { saveArcadeRecord, getGameRecord } from '../../../utils/arcadeStorage';
import { calculateDifficultyTier, getSpeedSprintConfig } from '../../../utils/arcadeDifficulty';
import { ArcadeWordDeck, getVocabularyPool } from '../../../utils/arcadeVocabulary';
import { ArcadeExitDialog } from '../ArcadeExitDialog';
import { useI18n } from '../../../i18n/I18nContext';
import { Warp3DScene } from '../sprint3d/Warp3DScene';
import { Warp3DAudio } from '../sprint3d/Warp3DAudio';

const TIME_PRESETS = [30, 60, 120];

export const SpeedSprintGame = ({ onExit, soundEnabled = true }) => {
  const { t } = useI18n();
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [gameState, setGameState] = useState('ready'); // ready, countdown, playing, paused, gameover
  const [countdown, setCountdown] = useState(3);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // 3D Canvas container and engine refs
  const canvasContainerRef = useRef(null);
  const scene3dRef = useRef(null);
  const audio3dRef = useRef(null);

  // Anti-repetition word deck initialized with Tier 1 pool
  const wordDeckRef = useRef(
    new ArcadeWordDeck({ gameId: 'sprint', pool: getVocabularyPool('sprint', 1) })
  );

  const generateStreamFromDeck = useCallback(() => {
    const list = [];
    for (let i = 0; i < 100; i++) {
      list.push(wordDeckRef.current.draw());
    }
    return list;
  }, []);

  const [timeLeft, setTimeLeft] = useState(60);
  const [words, setWords] = useState(() => {
    const initialDeck = new ArcadeWordDeck({ gameId: 'sprint', pool: getVocabularyPool('sprint', 1) });
    const initial = [];
    for (let i = 0; i < 100; i++) {
      initial.push(initialDeck.draw());
    }
    return initial;
  });
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentInput, setCurrentInput] = useState('');
  const [hasError, setHasError] = useState(false);

  const [totalStrokes, setTotalStrokes] = useState(0);
  const [correctChars, setCorrectChars] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [wordsCompleted, setWordsCompleted] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [score, setScore] = useState(0);

  const [personalBestNotice, setPersonalBestNotice] = useState(false);
  const [timeBonusNotice, setTimeBonusNotice] = useState(false);
  const [tierUpToast, setTierUpToast] = useState(null);

  const timerRef = useRef(null);
  const inputRef = useRef(null);
  const startTimeRef = useRef(null);

  const personalBest = getGameRecord('sprint');

  // Dynamic difficulty calculation based on performance & progression
  const difficultyInfo = useMemo(() => {
    return calculateDifficultyTier({
      activeSeconds: selectedDuration - timeLeft,
      completedCount: wordsCompleted,
      score,
      currentStreak,
      errorCount,
      mode: 'sprint',
    });
  }, [selectedDuration, timeLeft, wordsCompleted, score, currentStreak, errorCount]);

  const sprintConfig = useMemo(() => {
    return getSpeedSprintConfig(difficultyInfo.tier);
  }, [difficultyInfo.tier]);

  // Audio engine initialization
  useEffect(() => {
    audio3dRef.current = new Warp3DAudio();
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

    const scene = new Warp3DScene(canvasContainerRef.current);
    scene3dRef.current = scene;

    // Load initial words into 3D gates
    scene.loadWords(words.slice(currentWordIndex, currentWordIndex + 12));

    return () => {
      scene.destroy();
      scene3dRef.current = null;
    };
  }, []);

  const prevTierRef = useRef(1);
  useEffect(() => {
    if (difficultyInfo.tier > prevTierRef.current) {
      setTierUpToast(`WARP VELOCITY INTENSIFIED — TIER ${difficultyInfo.tier} (${difficultyInfo.tierName})`);
      audio3dRef.current?.playHyperspaceBoost();
      // Dynamically switch deck pool to elevated intensity
      wordDeckRef.current.setPool(getVocabularyPool('sprint', difficultyInfo.tier));
      const t = setTimeout(() => setTierUpToast(null), 3000);
      prevTierRef.current = difficultyInfo.tier;
      return () => clearTimeout(t);
    }
    prevTierRef.current = difficultyInfo.tier;
  }, [difficultyInfo.tier, difficultyInfo.tierName]);

  // Reset session
  const resetGame = useCallback(() => {
    setGameState('ready');
    setTimeLeft(selectedDuration);
    wordDeckRef.current?.resetRun();
    const newWords = generateStreamFromDeck();
    setWords(newWords);
    setCurrentWordIndex(0);
    setCurrentInput('');
    setHasError(false);
    setTotalStrokes(0);
    setCorrectChars(0);
    setErrorCount(0);
    setWordsCompleted(0);
    setCurrentStreak(0);
    setBestStreak(0);
    setScore(0);
    setPersonalBestNotice(false);
    setTimeBonusNotice(false);

    audio3dRef.current?.stopEngine();
    scene3dRef.current?.loadWords(newWords.slice(0, 12));
    scene3dRef.current?.setPerformanceMetrics(45, 0);
  }, [selectedDuration, generateStreamFromDeck]);

  const startCountdown = () => {
    resetGame();
    setGameState('countdown');
    setCountdown(3);
  };

  // Countdown timer
  useEffect(() => {
    if (gameState !== 'countdown') return;
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 800);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setGameState('playing');
      startTimeRef.current = performance.now();
      audio3dRef.current?.startEngine();
    }, 0);
    return () => clearTimeout(t);
  }, [gameState, countdown]);

  // Main countdown timer
  useEffect(() => {
    if (gameState !== 'playing') {
      clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setGameState('gameover');
          audio3dRef.current?.playGameOver();
          return 0;
        }
        return Math.max(0, parseFloat((t - 1).toFixed(1)));
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [gameState]);

  // Focus input
  useEffect(() => {
    if (gameState === 'playing' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameState]);

  // Elapsed seconds for metrics
  const elapsedSeconds = Math.max(0.1, selectedDuration - timeLeft);
  const liveWpm = calculateWpm(correctChars, elapsedSeconds);
  const liveAccuracy = calculateAccuracy(correctChars, totalStrokes);

  // Sync performance metrics with 3D scene & dynamic audio
  useEffect(() => {
    if (gameState === 'playing') {
      scene3dRef.current?.setPerformanceMetrics(liveWpm, currentStreak);
      audio3dRef.current?.updateEngineSpeed(liveWpm, currentStreak);
    }
  }, [gameState, liveWpm, currentStreak]);

  // On Game Over, save personal best
  useEffect(() => {
    if (gameState === 'gameover') {
      const finalWpm = calculateWpm(correctChars, selectedDuration);
      const finalAcc = calculateAccuracy(correctChars, totalStrokes);
      const result = saveArcadeRecord('sprint', {
        wpm: finalWpm,
        accuracy: finalAcc,
        wordsTyped: wordsCompleted,
        score,
        highestTier: difficultyInfo.tier,
      });

      if (result.isNewBest) {
        const t = setTimeout(() => setPersonalBestNotice(true), 0);
        playArcadeSound('victory', soundEnabled);
        return () => clearTimeout(t);
      }
    }
  }, [gameState, correctChars, totalStrokes, wordsCompleted, score, selectedDuration, difficultyInfo.tier, soundEnabled]);

  // Handle typing input
  const handleInputChange = (e) => {
    if (gameState !== 'playing') return;
    const value = e.target.value;
    const currentTargetWord = words[currentWordIndex] || '';

    // Handle space key -> check word submission
    if (value.endsWith(' ')) {
      const typedWord = value.trim();
      setTotalStrokes((s) => s + 1);

      if (typedWord === currentTargetWord) {
        // Correct word -> Breach Gate!
        audio3dRef.current?.playGateSuccess(currentStreak + 1);
        if ((currentStreak + 1) === 10 || (currentStreak + 1) === 25) {
          audio3dRef.current?.playHyperspaceBoost();
        }

        setCorrectChars((c) => c + currentTargetWord.length + 1);
        setWordsCompleted((w) => w + 1);
        const streakBonus = Math.min(5, 1 + currentStreak * 0.1);
        setScore((s) => Math.round(s + currentTargetWord.length * 10 * streakBonus));
        setCurrentStreak((st) => {
          const next = st + 1;
          setBestStreak((b) => Math.max(b, next));
          return next;
        });

        // Extend clock by +0.5s bonus!
        setTimeLeft((t) => parseFloat((t + 0.5).toFixed(1)));
        setTimeBonusNotice(true);
        setTimeout(() => setTimeBonusNotice(false), 500);

        // Breach 3D gate and advance
        const nextWordIndex = currentWordIndex + 1;
        const upcomingFutureWord = words[nextWordIndex + 7] || wordDeckRef.current.draw();
        scene3dRef.current?.breachGate(upcomingFutureWord);

        setCurrentWordIndex(nextWordIndex);
        setCurrentInput('');
        setHasError(false);
        scene3dRef.current?.updateTyping('', false);

        if (words.length - nextWordIndex < 30) {
          const more = [];
          for (let i = 0; i < 40; i++) {
            more.push(wordDeckRef.current.draw());
          }
          setWords((w) => [...w, ...more]);
        }
      } else {
        // Word submitted with error
        audio3dRef.current?.playErrorGlitch();
        setErrorCount((err) => err + 1);
        setCurrentStreak(0);
        setHasError(true);

        const nextWordIndex = currentWordIndex + 1;
        const upcomingFutureWord = words[nextWordIndex + 7] || wordDeckRef.current.draw();
        scene3dRef.current?.breachGate(upcomingFutureWord);

        setCurrentWordIndex(nextWordIndex);
        setCurrentInput('');
        scene3dRef.current?.updateTyping('', false);

        if (words.length - nextWordIndex < 30) {
          const more = [];
          for (let i = 0; i < 40; i++) {
            more.push(wordDeckRef.current.draw());
          }
          setWords((w) => [...w, ...more]);
        }
      }
      return;
    }

    // Regular character typing
    let errorDetected = false;
    if (value.length > currentInput.length) {
      const addedChar = value[value.length - 1];
      const targetChar = currentTargetWord[value.length - 1];
      setTotalStrokes((s) => s + 1);

      if (addedChar === targetChar) {
        setCorrectChars((c) => c + 1);
      } else {
        setErrorCount((err) => err + 1);
        audio3dRef.current?.playErrorGlitch();
        errorDetected = true;
      }
    }

    // Check if current prefix matches target prefix
    const prefixMismatch = !currentTargetWord.startsWith(value);
    const errState = errorDetected || prefixMismatch;
    setHasError(errState);
    setCurrentInput(value);

    // Update 3D canvas plaque character highlighting
    scene3dRef.current?.updateTyping(value, errState);
  };

  const handleAttemptExit = () => {
    if (gameState === 'playing' || gameState === 'paused') {
      setShowExitConfirm(true);
    } else {
      onExit();
    }
  };

  const handleKeyDown = (e) => {
    if (showExitConfirm) {
      if (e.key === 'Escape') {
        setShowExitConfirm(false);
      }
      return;
    }
    if (e.key === 'Escape') {
      if (gameState === 'playing') {
        setGameState('paused');
        audio3dRef.current?.stopEngine();
      } else if (gameState === 'paused') {
        setGameState('playing');
        audio3dRef.current?.startEngine();
      }
    }
  };

  const currentTargetWord = words[currentWordIndex] || '';
  const streakMultiplier = Math.min(5, 1 + (currentStreak * 0.1)).toFixed(1);

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
              <Zap className="w-5 h-5 text-emerald-400" />
              <span>3D Hyperspace Warp</span>
            </h2>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              {sprintConfig.tierLabel} Conduit (Tier {difficultyInfo.tier}) • {streakMultiplier}x Multiplier • +0.5s per clean breach
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {gameState === 'ready' && (
            <div className="flex items-center gap-1 bg-[var(--bg-elevated)] p-1 rounded-lg border border-[var(--border)]">
              {TIME_PRESETS.map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => {
                    setSelectedDuration(sec);
                    setTimeLeft(sec);
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-colors ${
                    selectedDuration === sec
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          )}

          {gameState === 'playing' ? (
            <Button
              variant="outline"
              size="xs"
              icon={Pause}
              onClick={() => {
                setGameState('paused');
                audio3dRef.current?.stopEngine();
              }}
            >
              {t('common.pause')}
            </Button>
          ) : gameState === 'paused' ? (
            <Button
              variant="primary"
              size="xs"
              icon={Play}
              onClick={() => {
                setGameState('playing');
                audio3dRef.current?.startEngine();
              }}
            >
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
        <div className="px-3.5 py-2 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 font-mono text-xs flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2">
          <span className="flex items-center gap-2 font-bold">
            <Flame className="w-4 h-4 text-emerald-400 animate-pulse" />
            {tierUpToast}
          </span>
          <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">
            Hyperspace Boost Activated
          </span>
        </div>
      )}

      {/* 3D WebGL Hyperspace Warp Canvas & HUD Container */}
      <div className="relative rounded-2xl overflow-hidden border border-[var(--border)] bg-neutral-950 shadow-2xl h-[480px]">
        {/* Three.js Canvas Container */}
        <div ref={canvasContainerRef} className="w-full h-full cursor-default" />

        {/* Dynamic In-Game HUD Overlay */}
        <div className="absolute inset-x-0 top-0 p-4 pointer-events-none flex items-start justify-between">
          {/* Left: Time Remaining Pill */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-xs font-mono text-white shadow-lg">
            <Clock className={`w-4 h-4 ${timeLeft <= 10 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`} />
            <span className="text-sm font-bold">{timeLeft}s</span>
            {timeBonusNotice && (
              <span className="text-xs text-emerald-400 font-bold animate-bounce">+0.5s</span>
            )}
          </div>

          {/* Center: Live WPM Velocity Gauge */}
          <div className="flex flex-col items-center px-4 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 shadow-lg">
            <span className="text-[9px] uppercase tracking-wider font-mono text-sky-400 font-semibold">
              Warp Velocity
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black font-mono text-white tracking-tight">{liveWpm}</span>
              <span className="text-[10px] font-mono text-sky-300">WPM</span>
            </div>
          </div>

          {/* Right: Streak & Multiplier */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-xs font-mono shadow-lg">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 font-bold">{currentStreak}x</span>
            <span className="text-[10px] text-neutral-400 font-semibold">({streakMultiplier}x Score)</span>
          </div>
        </div>

        {/* Bottom Word Display & Keystroke Color Feedback HUD */}
        {gameState === 'playing' && (
          <div className="absolute inset-x-0 bottom-4 flex flex-col items-center pointer-events-none px-4">
            <div className="px-5 py-2.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/15 flex items-center gap-3 shadow-2xl">
              <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">Target:</span>
              <div className="text-xl sm:text-2xl font-mono font-bold tracking-wide">
                {currentTargetWord.split('').map((char, idx) => {
                  const typed = currentInput[idx];
                  const isTyped = idx < currentInput.length;
                  const isCorrect = isTyped && typed === char;
                  const isCurrent = idx === currentInput.length;

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
              <span className="text-[10px] font-mono text-neutral-500 border border-neutral-700 px-1.5 py-0.5 rounded">
                SPACE to pass
              </span>
            </div>
          </div>
        )}

        {/* Real hidden text input capturing keystrokes */}
        <input
          ref={inputRef}
          type="text"
          value={currentInput}
          onChange={handleInputChange}
          disabled={gameState !== 'playing'}
          className="opacity-0 absolute inset-0 w-full h-full cursor-default"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
          aria-label="Speed Sprint Word Input"
        />

        {/* Ready Overlay */}
        {gameState === 'ready' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xs z-30 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-2xl animate-pulse">
              <Zap className="w-9 h-9" />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <h3 className="text-2xl font-black text-white tracking-tight">3D Hyperspace Warp</h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Tear through an infinite quantum warp conduit. Maintain high cadence to accelerate your pod, widen field of view, and blast through velocity gates.
              </p>
            </div>
            <Button variant="primary" size="lg" icon={Play} onClick={startCountdown} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8 shadow-xl">
              ENGAGE HYPERDRIVE
            </Button>
          </div>
        )}

        {/* 3-2-1 Countdown Overlay */}
        {gameState === 'countdown' && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-xs z-30 flex items-center justify-center">
            <span className="text-7xl font-black font-mono text-emerald-400 animate-pulse drop-shadow-[0_0_30px_rgba(16,185,129,0.8)]">
              {countdown}
            </span>
          </div>
        )}

        {/* Paused Overlay */}
        {gameState === 'paused' && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-xs z-30 flex flex-col items-center justify-center space-y-4">
            <h3 className="text-2xl font-bold text-white font-mono">WARP SYSTEM PAUSED</h3>
            <div className="flex gap-3">
              <Button
                variant="primary"
                size="sm"
                icon={Play}
                onClick={() => {
                  setGameState('playing');
                  audio3dRef.current?.startEngine();
                }}
              >
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
              <h3 className="text-2xl font-black text-white tracking-tight">WARP RUN COMPLETE</h3>
              <p className="text-xs text-neutral-400 font-mono">Hyperspace Conduit Decompressed</p>
            </div>

            {personalBestNotice && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold animate-pulse">
                <Trophy className="w-3.5 h-3.5" /> NEW PERSONAL BEST RECORD!
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/5 p-4 rounded-xl border border-white/10 text-xs font-mono w-full max-w-md">
              <div>
                <span className="text-[10px] text-neutral-400 block uppercase">Top Velocity</span>
                <span className="text-xl font-bold text-emerald-400">{liveWpm} WPM</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block uppercase">Accuracy</span>
                <span className="text-xl font-bold text-sky-400">{liveAccuracy}%</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block uppercase">Gates Breached</span>
                <span className="text-xl font-bold text-amber-400">{wordsCompleted}</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block uppercase">Total Score</span>
                <span className="text-xl font-bold text-white">{score}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button variant="primary" size="md" icon={RotateCcw} onClick={startCountdown} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold">
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
        <span>Type displayed target word and press Space to breach quantum gate</span>
        <span>Best Velocity: {personalBest?.bestWpm || 0} WPM • Total Errors: {errorCount}</span>
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

export default SpeedSprintGame;
