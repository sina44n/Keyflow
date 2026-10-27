import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Brain, RotateCcw, Play, ArrowLeft, Trophy, Eye, EyeOff, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '../../common/Button';
import { getRandomWord, playArcadeSound } from '../../../utils/arcadeEngine';
import { saveArcadeRecord, getGameRecord } from '../../../utils/arcadeStorage';

export const TypingMemoryGame = ({ onExit, soundEnabled = true }) => {
  // Game states: 'ready', 'viewing', 'recalling', 'review', 'gameover'
  const [gameState, setGameState] = useState('ready');

  const [round, setRound] = useState(1);
  const [strikes, setStrikes] = useState(0); // Max 3 strikes
  const [score, setScore] = useState(0);
  const [viewTimeLeft, setViewTimeLeft] = useState(3.5);

  // The secret sequence stored in memory state ONLY, hidden from DOM during recall
  const [sequence, setSequence] = useState([]);
  const [userInputs, setUserInputs] = useState([]); // Words typed by user
  const [currentTyping, setCurrentTyping] = useState('');

  const [roundResult, setRoundResult] = useState(null); // 'success' | 'fail'
  const [personalBestNotice, setPersonalBestNotice] = useState(false);

  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const personalBest = getGameRecord('memory');

  // Generate sequence for current round (e.g. round 1 = 3 words, round 2 = 4 words, etc.)
  const generateSequenceForRound = useCallback((r) => {
    const length = Math.min(8, 2 + r); // 3 items at round 1, up to 8
    const words = [];
    for (let i = 0; i < length; i++) {
      words.push(getRandomWord('short', words));
    }
    return words;
  }, []);

  const resetGame = useCallback(() => {
    setGameState('ready');
    setRound(1);
    setStrikes(0);
    setScore(0);
    setUserInputs([]);
    setCurrentTyping('');
    setRoundResult(null);
    setPersonalBestNotice(false);
  }, []);

  // Start next round in viewing phase
  const startRound = useCallback((r) => {
    const seq = generateSequenceForRound(r);
    setSequence(seq);
    setUserInputs([]);
    setCurrentTyping('');
    setRoundResult(null);
    setViewTimeLeft(Math.max(2.5, 3.5 + (r - 1) * 0.4));
    setGameState('viewing');
  }, [generateSequenceForRound]);

  const startGame = () => {
    resetGame();
    startRound(1);
  };

  // Viewing phase countdown
  useEffect(() => {
    if (gameState !== 'viewing') return;

    timerRef.current = setInterval(() => {
      setViewTimeLeft((v) => {
        if (v <= 0.1) {
          // Shutter closes! Transition to recall phase
          setGameState('recalling');
          return 0;
        }
        return Math.max(0, parseFloat((v - 0.1).toFixed(1)));
      });
    }, 100);

    return () => clearInterval(timerRef.current);
  }, [gameState]);

  // Focus input during recall
  useEffect(() => {
    if (gameState === 'recalling' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameState]);

  // Game over record
  useEffect(() => {
    if (gameState === 'gameover') {
      const result = saveArcadeRecord('memory', {
        deepestRound: round,
        score,
        perfect: strikes === 0,
      });
      if (result.isNewBest) {
        const t = setTimeout(() => setPersonalBestNotice(true), 0);
        playArcadeSound('victory', soundEnabled);
        return () => clearTimeout(t);
      }
    }
  }, [gameState, round, score, strikes, soundEnabled]);

  // Handle typing during recall
  const handleInputChange = (e) => {
    if (gameState !== 'recalling') return;
    const val = e.target.value;

    // Check on space -> commit word
    if (val.endsWith(' ')) {
      const submitted = val.trim().toLowerCase();
      if (!submitted) return;

      playArcadeSound('blaster', soundEnabled);
      const nextInputs = [...userInputs, submitted];
      setUserInputs(nextInputs);
      setCurrentTyping('');

      // Check if finished entire sequence
      if (nextInputs.length === sequence.length) {
        // Evaluate complete sequence
        let allCorrect = true;
        for (let i = 0; i < sequence.length; i++) {
          if (nextInputs[i] !== sequence[i].toLowerCase()) {
            allCorrect = false;
            break;
          }
        }

        if (allCorrect) {
          // Round Success!
          playArcadeSound('combo', soundEnabled);
          const pts = sequence.length * 50;
          setScore((s) => s + pts);
          setRoundResult('success');
          setGameState('review');
        } else {
          // Round Failed!
          playArcadeSound('damage', soundEnabled);
          const newStrikes = strikes + 1;
          setStrikes(newStrikes);
          setRoundResult('fail');
          if (newStrikes >= 3) {
            setGameState('gameover');
          } else {
            setGameState('review');
          }
        }
      }
      return;
    }

    setCurrentTyping(val);
  };

  const advanceToNextRound = () => {
    const nextR = round + 1;
    setRound(nextR);
    startRound(nextR);
  };

  const retryCurrentRound = () => {
    startRound(round);
  };

  return (
    <div
      className="card-panel p-4 sm:p-6 space-y-4 max-w-4xl mx-auto border border-[var(--border)] shadow-2xl relative select-none"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="xs" icon={ArrowLeft} onClick={onExit}>
            Arcade Hub
          </Button>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Brain className="w-5 h-5 text-cyan-400" />
              Typing Memory
            </h2>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              Matrix Sequence Recall • Zero Hints Shutter
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="xs" icon={RotateCcw} onClick={startGame}>
            Restart
          </Button>
        </div>
      </div>

      {/* HUD Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-[var(--bg-elevated)] p-3 rounded-xl border border-[var(--border)] text-xs font-mono">
        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)] block">Round</span>
          <span className="text-base font-bold text-cyan-400">Round {round}</span>
        </div>

        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)] block">Sequence Length</span>
          <span className="text-base font-bold text-[var(--text-primary)]">{sequence.length} items</span>
        </div>

        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)] block">Memory Strikes</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            {[...Array(3)].map((_, i) => (
              <span
                key={i}
                className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[9px] font-bold ${
                  i < strikes
                    ? 'border-rose-500 bg-rose-500 text-white'
                    : 'border-neutral-700 bg-neutral-900 text-transparent'
                }`}
              >
                ✕
              </span>
            ))}
            <span className="text-[10px] text-[var(--text-muted)]">({3 - strikes} left)</span>
          </div>
        </div>

        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)] block">Score</span>
          <span className="text-base font-bold text-[var(--text-primary)]">{score}</span>
        </div>

        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)] block">Phase Status</span>
          <span className="text-xs font-bold font-mono">
            {gameState === 'viewing' ? (
              <span className="text-amber-400 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> Memorize ({viewTimeLeft}s)
              </span>
            ) : gameState === 'recalling' ? (
              <span className="text-cyan-400 flex items-center gap-1">
                <EyeOff className="w-3.5 h-3.5" /> Recall from Memory!
              </span>
            ) : (
              <span className="text-[var(--text-muted)]">Ready</span>
            )}
          </span>
        </div>
      </div>

      {/* Memory Vault Arena */}
      <div className="relative p-6 sm:p-8 rounded-xl border border-[var(--border)] bg-[#070d18] min-h-[300px] flex flex-col justify-center items-center overflow-hidden">
        {/* Holographic matrix background grid */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 50%, rgba(6,182,212,0.3) 0%, transparent 70%)',
          }}
        />

        {/* Phase 1: Viewing Memorization Tiles */}
        {gameState === 'viewing' && (
          <div className="space-y-6 text-center z-10 w-full max-w-xl">
            <div className="flex items-center justify-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider font-bold">
              <Eye className="w-4 h-4 animate-pulse" />
              <span>Memorize Sequence — Shutter in {viewTimeLeft}s</span>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {sequence.map((word, idx) => (
                <div
                  key={idx}
                  className="px-4 py-2.5 rounded-xl bg-cyan-950/70 border-2 border-cyan-400 text-cyan-100 font-mono text-lg font-black shadow-[0_0_15px_rgba(6,182,212,0.4)] animate-in fade-in zoom-in-95"
                >
                  <span className="text-xs text-cyan-400 block font-normal mb-0.5">#{idx + 1}</span>
                  {word}
                </div>
              ))}
            </div>

            {/* Shutter Countdown Bar */}
            <div className="w-full max-w-xs mx-auto h-2 bg-neutral-800 rounded-full overflow-hidden border border-neutral-700">
              <div
                className="h-full bg-amber-400 transition-all duration-100"
                style={{ width: `${(viewTimeLeft / 3.5) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Phase 2: Recall Mode — Strictly Zero DOM answer hint! */}
        {gameState === 'recalling' && (
          <div className="space-y-6 text-center z-10 w-full max-w-xl">
            <div className="flex items-center justify-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider font-bold">
              <EyeOff className="w-4 h-4" />
              <span>Type word #{userInputs.length + 1} of {sequence.length} (Press Space)</span>
            </div>

            {/* Progress Slots with Shutter Closed */}
            <div className="flex flex-wrap justify-center gap-3">
              {sequence.map((_, idx) => {
                const isFilled = idx < userInputs.length;
                const isCurrent = idx === userInputs.length;

                return (
                  <div
                    key={idx}
                    className={`w-24 h-16 rounded-xl border flex flex-col items-center justify-center font-mono font-bold transition-all ${
                      isFilled
                        ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                        : isCurrent
                        ? 'border-cyan-400 bg-cyan-950/60 ring-2 ring-cyan-400/40 text-cyan-100 scale-105'
                        : 'border-neutral-800 bg-neutral-900/60 text-neutral-600'
                    }`}
                  >
                    <span className="text-[10px] text-[var(--text-muted)]">Slot #{idx + 1}</span>
                    <span className="text-sm">
                      {isFilled ? userInputs[idx] : isCurrent ? currentTyping || '___' : '🔒'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Real Text Input */}
            <div className="max-w-xs mx-auto">
              <input
                ref={inputRef}
                type="text"
                value={currentTyping}
                onChange={handleInputChange}
                placeholder="Type from memory..."
                className="w-full px-4 py-2 text-center rounded-xl bg-[var(--bg-elevated)] border-2 border-cyan-400 font-mono text-base font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-cyan-500"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
              />
              <span className="text-[11px] font-mono text-[var(--text-muted)] block mt-1.5">
                Hit Spacebar to commit each word
              </span>
            </div>
          </div>
        )}

        {/* Phase 3: Round Review Overlay */}
        {gameState === 'review' && (
          <div className="space-y-5 text-center z-20 animate-in fade-in">
            {roundResult === 'success' ? (
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-emerald-400">Perfect Recall!</h3>
                <p className="text-xs text-[var(--text-secondary)]">All {sequence.length} words matched accurately from memory.</p>
                <Button variant="primary" size="md" onClick={advanceToNextRound}>
                  Advance to Round {round + 1} →
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-rose-400">Recall Mismatch</h3>
                <p className="text-xs text-[var(--text-secondary)]">Strike recorded ({strikes}/3).</p>
                <Button variant="outline" size="md" onClick={retryCurrentRound}>
                  Try Round Again
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Ready Overlay */}
        {gameState === 'ready' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xs z-30 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] text-cyan-400 flex items-center justify-center shadow-lg">
              <Brain className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-xl font-bold text-[var(--text-primary)]">Typing Memory Vault</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Memorize the word sequence before the shutter closes. Then reproduce it purely from muscle memory without hints.
              </p>
            </div>
            <Button variant="primary" size="lg" icon={Play} onClick={startGame}>
              Start Round 1
            </Button>
          </div>
        )}

        {/* Game Over */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-[var(--text-primary)]">Memory Overloaded!</h3>
              <p className="text-xs text-[var(--text-secondary)]">3 memory strikes reached.</p>
            </div>

            {personalBestNotice && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold">
                <Trophy className="w-3.5 h-3.5" /> NEW MEMORY DEPTH RECORD!
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 bg-[var(--bg-elevated)] p-4 rounded-xl border border-[var(--border)] text-xs font-mono w-full max-w-xs">
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Deepest Round</span>
                <span className="text-lg font-bold text-cyan-400">Round {round}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Total Score</span>
                <span className="text-lg font-bold text-[var(--accent)]">{score}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button variant="primary" size="md" icon={RotateCcw} onClick={startGame}>
                Try Again
              </Button>
              <Button variant="outline" size="md" onClick={onExit}>
                Back to Arcade
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between text-xs text-[var(--text-muted)] font-mono px-1">
        <span>Type from memory, space commits word</span>
        <span>Deepest Recall: Round {personalBest?.deepestRound || 0}</span>
      </div>
    </div>
  );
};
