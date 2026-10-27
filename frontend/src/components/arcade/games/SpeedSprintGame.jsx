import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Zap, RotateCcw, Play, Pause, ArrowLeft, Trophy, Clock } from 'lucide-react';
import { Button } from '../../common/Button';
import { calculateAccuracy, calculateWpm, generateWordStream, playArcadeSound } from '../../../utils/arcadeEngine';
import { saveArcadeRecord, getGameRecord } from '../../../utils/arcadeStorage';

const TIME_PRESETS = [30, 60, 120];

export const SpeedSprintGame = ({ onExit, soundEnabled = true }) => {
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [gameState, setGameState] = useState('ready'); // ready, countdown, playing, paused, gameover
  const [countdown, setCountdown] = useState(3);

  const [timeLeft, setTimeLeft] = useState(60);
  const [words, setWords] = useState(() => generateWordStream(100, 'medium'));
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentInput, setCurrentInput] = useState('');

  const [totalStrokes, setTotalStrokes] = useState(0);
  const [correctChars, setCorrectChars] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [wordsCompleted, setWordsCompleted] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [score, setScore] = useState(0);

  const [personalBestNotice, setPersonalBestNotice] = useState(false);
  const [timeBonusNotice, setTimeBonusNotice] = useState(false);

  const timerRef = useRef(null);
  const inputRef = useRef(null);
  const startTimeRef = useRef(null);

  const personalBest = getGameRecord('sprint');

  // Reset session
  const resetGame = useCallback(() => {
    setGameState('ready');
    setTimeLeft(selectedDuration);
    setWords(generateWordStream(120, 'medium'));
    setCurrentWordIndex(0);
    setCurrentInput('');
    setTotalStrokes(0);
    setCorrectChars(0);
    setErrorCount(0);
    setWordsCompleted(0);
    setCurrentStreak(0);
    setBestStreak(0);
    setScore(0);
    setPersonalBestNotice(false);
    setTimeBonusNotice(false);
  }, [selectedDuration]);

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
      });

      if (result.isNewBest) {
        const t = setTimeout(() => setPersonalBestNotice(true), 0);
        playArcadeSound('victory', soundEnabled);
        return () => clearTimeout(t);
      }
    }
  }, [gameState, correctChars, totalStrokes, wordsCompleted, score, selectedDuration, soundEnabled]);

  // Handle typing
  const handleInputChange = (e) => {
    if (gameState !== 'playing') return;
    const value = e.target.value;
    const currentTargetWord = words[currentWordIndex] || '';

    // Handle space key -> check word submission
    if (value.endsWith(' ')) {
      const typedWord = value.trim();
      setTotalStrokes((s) => s + 1);

      if (typedWord === currentTargetWord) {
        // Correct word!
        playArcadeSound('combo', soundEnabled);
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

        setCurrentWordIndex((idx) => idx + 1);
        setCurrentInput('');
      } else {
        // Word submitted with error
        playArcadeSound('damage', soundEnabled);
        setErrorCount((err) => err + 1);
        setCurrentStreak(0);
        setCurrentWordIndex((idx) => idx + 1);
        setCurrentInput('');
      }
      return;
    }

    // Regular character typing
    if (value.length > currentInput.length) {
      const addedChar = value[value.length - 1];
      const targetChar = currentTargetWord[value.length - 1];
      setTotalStrokes((s) => s + 1);

      if (addedChar === targetChar) {
        setCorrectChars((c) => c + 1);
        playArcadeSound('blaster', soundEnabled);
      } else {
        setErrorCount((err) => err + 1);
        playArcadeSound('damage', soundEnabled);
      }
    }

    setCurrentInput(value);
  };

  return (
    <div
      className="card-panel p-4 sm:p-6 space-y-4 max-w-4xl mx-auto border border-[var(--border)] shadow-2xl relative select-none"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Top Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="xs" icon={ArrowLeft} onClick={onExit}>
            Arcade Hub
          </Button>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Zap className="w-5 h-5 text-[var(--accent)]" />
              Speed Sprint
            </h2>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              High-Octane Velocity Rush • +0.5s per accurate word
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
                  className={`px-2 py-0.5 rounded text-xs font-mono font-bold transition-colors ${
                    selectedDuration === sec
                      ? 'bg-[var(--accent)] text-[var(--accent-fg)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          )}

          {gameState === 'playing' ? (
            <Button variant="outline" size="xs" icon={Pause} onClick={() => setGameState('paused')}>
              Pause
            </Button>
          ) : gameState === 'paused' ? (
            <Button variant="primary" size="xs" icon={Play} onClick={() => setGameState('playing')}>
              Resume
            </Button>
          ) : null}
          <Button variant="ghost" size="xs" icon={RotateCcw} onClick={startCountdown}>
            Restart
          </Button>
        </div>
      </div>

      {/* HUD Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 bg-[var(--bg-elevated)] p-3 rounded-xl border border-[var(--border)] text-xs font-mono">
        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)] flex items-center gap-1">
            <Clock className="w-3 h-3 text-[var(--accent)]" /> Remaining
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className={`text-base font-bold ${
                timeLeft <= 10 ? 'text-rose-400 animate-pulse' : 'text-[var(--text-primary)]'
              }`}
            >
              {timeLeft}s
            </span>
            {timeBonusNotice && (
              <span className="text-[10px] text-emerald-400 font-bold animate-bounce">+0.5s</span>
            )}
          </div>
        </div>

        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)] block">Live WPM</span>
          <span className="text-base font-bold text-[var(--accent)]">{liveWpm}</span>
        </div>

        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)] block">Accuracy</span>
          <span className="text-base font-bold text-[var(--ui-success)]">{liveAccuracy}%</span>
        </div>

        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)] block">Words</span>
          <span className="text-base font-bold text-emerald-400">{wordsCompleted}</span>
        </div>

        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)] block">Streak</span>
          <span className="text-base font-bold text-amber-400">
            {currentStreak} <span className="text-[10px] text-[var(--text-muted)]">(max {bestStreak})</span>
          </span>
        </div>

        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)] block">Score</span>
          <span className="text-base font-bold text-[var(--text-primary)]">{score}</span>
        </div>
      </div>

      {/* Typing Stream Arena */}
      <div className="relative p-6 sm:p-8 rounded-xl border border-[var(--border)] bg-[var(--bg-main)] min-h-[220px] flex flex-col justify-center">
        {/* Active Words Display */}
        <div className="flex flex-wrap gap-2.5 text-base sm:text-lg font-mono leading-relaxed items-center max-h-40 overflow-hidden">
          {words.slice(Math.max(0, currentWordIndex - 3), currentWordIndex + 14).map((word, relIdx) => {
            const actualIdx = Math.max(0, currentWordIndex - 3) + relIdx;
            const isCurrent = actualIdx === currentWordIndex;
            const isCompleted = actualIdx < currentWordIndex;

            if (isCurrent) {
              return (
                <span
                  key={actualIdx}
                  className="px-2.5 py-1 rounded-md bg-[var(--bg-elevated)] border-2 border-[var(--accent)] ring-2 ring-[var(--accent)]/30 font-bold shadow-md"
                >
                  {word.split('').map((char, charIdx) => {
                    const typedChar = currentInput[charIdx];
                    const isMatched = typedChar === char;
                    const isErr = typedChar && !isMatched;

                    return (
                      <span
                        key={charIdx}
                        className={
                          isMatched
                            ? 'text-emerald-400'
                            : isErr
                            ? 'text-rose-400 underline'
                            : 'text-[var(--text-primary)]'
                        }
                      >
                        {char}
                      </span>
                    );
                  })}
                  {/* Blinking cursor */}
                  <span className="inline-block w-0.5 h-4 bg-[var(--accent)] animate-pulse ml-0.5 align-middle" />
                </span>
              );
            }

            return (
              <span
                key={actualIdx}
                className={
                  isCompleted
                    ? 'text-emerald-500/40 line-through'
                    : 'text-[var(--text-muted)] opacity-60'
                }
              >
                {word}
              </span>
            );
          })}
        </div>

        {/* Real hidden text input */}
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

        {/* Overlay States */}
        {gameState === 'ready' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xs z-30 flex flex-col items-center justify-center p-6 text-center space-y-4 rounded-xl">
            <div className="w-14 h-14 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--accent)] flex items-center justify-center shadow-lg">
              <Zap className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-xl font-bold text-[var(--text-primary)]">Speed Sprint Challenge</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Type non-stop before the clock runs out. Every accurately finished word extends your timer by +0.5s to test your raw burst velocity.
              </p>
            </div>
            <Button variant="primary" size="lg" icon={Play} onClick={startCountdown}>
              Start {selectedDuration}s Sprint
            </Button>
          </div>
        )}

        {gameState === 'countdown' && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xs z-30 flex items-center justify-center rounded-xl">
            <span className="text-6xl font-black font-mono text-[var(--accent)] animate-pulse">
              {countdown}
            </span>
          </div>
        )}

        {gameState === 'paused' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xs z-30 flex flex-col items-center justify-center space-y-4 rounded-xl">
            <h3 className="text-xl font-bold text-[var(--text-primary)]">Sprint Paused</h3>
            <div className="flex gap-3">
              <Button variant="primary" size="sm" icon={Play} onClick={() => setGameState('playing')}>
                Resume
              </Button>
              <Button variant="outline" size="sm" icon={RotateCcw} onClick={startCountdown}>
                Restart
              </Button>
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center space-y-4 rounded-xl">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Trophy className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-[var(--text-primary)]">Time Expired!</h3>
              <p className="text-xs text-[var(--text-secondary)]">Complete velocity session summary</p>
            </div>

            {personalBestNotice && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold">
                <Trophy className="w-3.5 h-3.5" /> NEW PEAK VELOCITY RECORD!
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[var(--bg-elevated)] p-4 rounded-xl border border-[var(--border)] text-xs font-mono w-full max-w-md">
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Velocity</span>
                <span className="text-xl font-bold text-[var(--accent)]">{liveWpm} WPM</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Accuracy</span>
                <span className="text-xl font-bold text-[var(--ui-success)]">{liveAccuracy}%</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Words Completed</span>
                <span className="text-xl font-bold text-emerald-400">{wordsCompleted}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Total Score</span>
                <span className="text-xl font-bold text-[var(--text-primary)]">{score}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button variant="primary" size="md" icon={RotateCcw} onClick={startCountdown}>
                Sprint Again
              </Button>
              <Button variant="outline" size="md" onClick={onExit}>
                Back to Arcade
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between text-xs text-[var(--text-muted)] font-mono px-1">
        <span>Press Space to submit current word and advance</span>
        <span>Errors: {errorCount} • Personal Best: {personalBest?.bestWpm || 0} WPM</span>
      </div>
    </div>
  );
};
