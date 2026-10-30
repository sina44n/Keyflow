import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Brain, RotateCcw, Play, ArrowLeft, Trophy, Eye, EyeOff, CheckCircle2, AlertTriangle, Flame, Sparkles } from 'lucide-react';
import { Button } from '../../common/Button';
import { playArcadeSound } from '../../../utils/arcadeEngine';
import { saveArcadeRecord, getGameRecord } from '../../../utils/arcadeStorage';
import { calculateDifficultyTier, getTypingMemoryConfig } from '../../../utils/arcadeDifficulty';
import { ArcadeWordDeck, getVocabularyPool } from '../../../utils/arcadeVocabulary';
import { ArcadeExitDialog } from '../ArcadeExitDialog';
import { useI18n } from '../../../i18n/I18nContext';
import { Matrix3DScene } from '../memory3d/Matrix3DScene';
import { Matrix3DAudio } from '../memory3d/Matrix3DAudio';

export const TypingMemoryGame = ({ onExit, soundEnabled = true }) => {
  const { t } = useI18n();
  // Game states: 'ready', 'viewing', 'recalling', 'review', 'gameover'
  const [gameState, setGameState] = useState('ready');
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // 3D Canvas container & engine refs
  const canvasContainerRef = useRef(null);
  const scene3dRef = useRef(null);
  const audio3dRef = useRef(null);

  // Anti-repetition word deck initialized with Tier 1 pool
  const wordDeckRef = useRef(
    new ArcadeWordDeck({ gameId: 'memory', pool: getVocabularyPool('memory', 1) })
  );

  const [round, setRound] = useState(1);
  const [strikes, setStrikes] = useState(0); // Max 3 strikes
  const [score, setScore] = useState(0);
  const [consecutiveSuccesses, setConsecutiveSuccesses] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [viewTimeLeft, setViewTimeLeft] = useState(3.5);
  const [totalViewTime, setTotalViewTime] = useState(3.5);
  const [tierUpToast, setTierUpToast] = useState(null);

  // The secret sequence stored in memory state ONLY, hidden from DOM during recall
  const [sequence, setSequence] = useState([]);
  const [userInputs, setUserInputs] = useState([]); // Words typed by user
  const [currentTyping, setCurrentTyping] = useState('');

  const [roundResult, setRoundResult] = useState(null); // 'success' | 'fail'
  const [personalBestNotice, setPersonalBestNotice] = useState(false);

  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const elapsedTimerRef = useRef(null);
  const personalBest = getGameRecord('memory');

  // Progressive difficulty calculation
  const difficultyInfo = useMemo(() => {
    return calculateDifficultyTier({
      activeSeconds: elapsedSeconds,
      completedCount: Math.max(0, round - 1),
      score,
      currentStreak: consecutiveSuccesses,
      errorCount: strikes,
      mode: 'memory',
    });
  }, [elapsedSeconds, round, score, consecutiveSuccesses, strikes]);

  const memoryConfig = useMemo(() => {
    return getTypingMemoryConfig(difficultyInfo.tier, round);
  }, [difficultyInfo.tier, round]);

  // Audio initialization
  useEffect(() => {
    audio3dRef.current = new Matrix3DAudio();
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

    const scene = new Matrix3DScene(canvasContainerRef.current);
    scene3dRef.current = scene;

    return () => {
      scene.destroy();
      scene3dRef.current = null;
    };
  }, []);

  const prevTierRef = useRef(1);
  useEffect(() => {
    if (difficultyInfo.tier > prevTierRef.current) {
      setTierUpToast(`NEURAL CAPACITY EXPANDED — TIER ${difficultyInfo.tier} (${difficultyInfo.tierName})`);
      audio3dRef.current?.playRoundSuccess();
      // Dynamically switch deck pool to elevated difficulty tier
      wordDeckRef.current.setPool(getVocabularyPool('memory', difficultyInfo.tier));
      const t = setTimeout(() => setTierUpToast(null), 3000);
      prevTierRef.current = difficultyInfo.tier;
      return () => clearTimeout(t);
    }
    prevTierRef.current = difficultyInfo.tier;
  }, [difficultyInfo.tier, difficultyInfo.tierName]);

  // Elapsed active timer
  useEffect(() => {
    if (gameState === 'viewing' || gameState === 'recalling') {
      elapsedTimerRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
      return () => clearInterval(elapsedTimerRef.current);
    } else {
      clearInterval(elapsedTimerRef.current);
    }
  }, [gameState]);

  // Generate sequence for current round with anti-repetition
  const generateSequenceForRound = useCallback((config) => {
    const length = config.sequenceLength;
    const words = [];
    for (let i = 0; i < length; i++) {
      words.push(wordDeckRef.current.draw(words));
    }
    return words;
  }, []);

  const resetGame = useCallback(() => {
    setGameState('ready');
    setRound(1);
    setStrikes(0);
    setScore(0);
    setConsecutiveSuccesses(0);
    setElapsedSeconds(0);
    setUserInputs([]);
    setCurrentTyping('');
    setRoundResult(null);
    setPersonalBestNotice(false);
    setTierUpToast(null);
    wordDeckRef.current?.resetRun();
    scene3dRef.current?.loadSequence([], 'ready');
  }, []);

  // Start next round in viewing phase
  const startRound = useCallback((r, config) => {
    const seq = generateSequenceForRound(config);
    setSequence(seq);
    setUserInputs([]);
    setCurrentTyping('');
    setRoundResult(null);
    setViewTimeLeft(config.viewTime);
    setTotalViewTime(config.viewTime);
    setGameState('viewing');

    // Load sequence into 3D Neural Nodes and play reveal audio
    scene3dRef.current?.loadSequence(seq, 'viewing', [], '');
    audio3dRef.current?.playNodeReveal(0);
  }, [generateSequenceForRound]);

  const startGame = () => {
    resetGame();
    startRound(1, memoryConfig);
  };

  // Viewing phase countdown
  useEffect(() => {
    if (gameState !== 'viewing') return;

    timerRef.current = setInterval(() => {
      setViewTimeLeft((v) => {
        if (v <= 0.1) {
          // Shutter closes! Transition to recall phase
          setGameState('recalling');
          audio3dRef.current?.playShutterGlitch();
          scene3dRef.current?.syncPhase('recalling', sequence, [], '');
          return 0;
        }
        return Math.max(0, parseFloat((v - 0.1).toFixed(1)));
      });
    }, 100);

    return () => clearInterval(timerRef.current);
  }, [gameState, sequence]);

  // Focus input during recall
  useEffect(() => {
    if (gameState === 'recalling' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameState]);

  // Sync real-time typing with 3D active node
  useEffect(() => {
    if (gameState === 'recalling') {
      scene3dRef.current?.syncPhase('recalling', sequence, userInputs, currentTyping);
    }
  }, [currentTyping, userInputs, gameState, sequence]);

  // Game over record
  useEffect(() => {
    if (gameState === 'gameover') {
      const result = saveArcadeRecord('memory', {
        deepestRound: round,
        score,
        perfect: strikes === 0,
        highestTier: difficultyInfo.tier,
      });
      if (result.isNewBest) {
        const t = setTimeout(() => setPersonalBestNotice(true), 0);
        playArcadeSound('victory', soundEnabled);
        return () => clearTimeout(t);
      }
    }
  }, [gameState, round, score, strikes, difficultyInfo.tier, soundEnabled]);

  // Handle typing during recall
  const handleInputChange = (e) => {
    if (gameState !== 'recalling') return;
    const val = e.target.value;

    // Check on space -> commit word
    if (val.endsWith(' ')) {
      const submitted = val.trim().toLowerCase();
      if (!submitted) return;

      audio3dRef.current?.playNodeRecallConfirmed();
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
          audio3dRef.current?.playRoundSuccess();
          const pts = sequence.length * 50;
          setScore((s) => s + pts);
          setConsecutiveSuccesses((c) => c + 1);
          setRoundResult('success');
          setGameState('review');
          scene3dRef.current?.syncPhase('review', sequence, nextInputs, '');
        } else {
          // Round Failed!
          audio3dRef.current?.playStrikeAlarm();
          const newStrikes = strikes + 1;
          setStrikes(newStrikes);
          setConsecutiveSuccesses(0);
          setRoundResult('fail');
          scene3dRef.current?.syncPhase('review', sequence, nextInputs, '');

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

  const handleNextRound = () => {
    if (gameState === 'review') {
      const nextR = round + 1;
      setRound(nextR);
      startRound(nextR, getTypingMemoryConfig(difficultyInfo.tier, nextR));
    }
  };

  const handleAttemptExit = () => {
    if (gameState === 'viewing' || gameState === 'recalling') {
      setShowExitConfirm(true);
    } else {
      onExit();
    }
  };

  return (
    <div
      className="card-panel p-4 sm:p-6 space-y-4 max-w-5xl mx-auto border border-[var(--border)] shadow-2xl relative select-none"
      onClick={() => inputRef.current?.focus()}
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
              <Brain className="w-5 h-5 text-cyan-400" />
              <span>3D Neural Matrix</span>
            </h2>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              {memoryConfig.tierLabel} (Tier {difficultyInfo.tier}) • Sequence Length: {memoryConfig.sequenceLength} words • Shutter: {memoryConfig.viewTime}s
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Strikes Counter */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] font-mono text-xs">
            <span className="text-[10px] uppercase text-[var(--text-muted)]">Strikes:</span>
            {[1, 2, 3].map((num) => (
              <span
                key={num}
                className={`w-2.5 h-2.5 rounded-full ${
                  num <= strikes ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' : 'bg-neutral-700'
                }`}
              />
            ))}
          </div>

          <Button variant="ghost" size="xs" icon={RotateCcw} onClick={resetGame}>
            {t('common.restart')}
          </Button>
        </div>
      </div>

      {/* Dynamic Tier Escalation Toast Banner */}
      {tierUpToast && (
        <div className="px-3.5 py-2 rounded-xl bg-cyan-950/90 border border-cyan-500/60 text-cyan-300 font-mono text-xs flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2">
          <span className="flex items-center gap-2 font-bold">
            <Flame className="w-4 h-4 text-cyan-400 animate-pulse" />
            {tierUpToast}
          </span>
          <span className="text-[10px] text-cyan-400 uppercase tracking-wider font-semibold">
            Synaptic Bandwidth Scaled
          </span>
        </div>
      )}

      {/* 3D WebGL Neural Matrix Viewport & Holographic HUD */}
      <div className="relative rounded-2xl overflow-hidden border border-[var(--border)] bg-neutral-950 shadow-2xl h-[480px]">
        {/* Three.js Canvas Container */}
        <div ref={canvasContainerRef} className="w-full h-full cursor-default" />

        {/* Dynamic Top HUD Overlay */}
        <div className="absolute inset-x-0 top-0 p-4 pointer-events-none flex items-start justify-between">
          {/* Round Indicator */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-xs font-mono text-white shadow-lg">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-bold">Round {round}</span>
          </div>

          {/* Phase Countdown / Shutter Status */}
          {gameState === 'viewing' && (
            <div className="flex flex-col items-center px-4 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-cyan-500/40 shadow-lg animate-pulse">
              <span className="text-[9px] uppercase tracking-wider font-mono text-cyan-300 font-semibold flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> Memorization Window
              </span>
              <span className="text-xl font-black font-mono text-cyan-400">{viewTimeLeft}s</span>
            </div>
          )}

          {gameState === 'recalling' && (
            <div className="flex flex-col items-center px-4 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-amber-500/40 shadow-lg">
              <span className="text-[9px] uppercase tracking-wider font-mono text-amber-300 font-semibold flex items-center gap-1">
                <EyeOff className="w-3.5 h-3.5" /> Shutter Active — Blind Recall
              </span>
              <span className="text-xs font-mono text-neutral-300">
                Node {userInputs.length + 1} of {sequence.length}
              </span>
            </div>
          )}

          {/* Score Counter */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-xs font-mono text-white shadow-lg">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold">{score} pts</span>
          </div>
        </div>

        {/* Real-time Recall Input HUD */}
        {gameState === 'recalling' && (
          <div className="absolute inset-x-0 bottom-4 flex flex-col items-center pointer-events-none px-4">
            <div className="px-6 py-2.5 rounded-xl bg-black/85 backdrop-blur-md border border-amber-500/40 flex items-center gap-3 shadow-2xl">
              <span className="text-xs font-mono text-amber-400 uppercase tracking-wider font-bold">
                RECONSTRUCT NODE #{userInputs.length + 1}:
              </span>
              <div className="text-xl sm:text-2xl font-mono font-bold text-white tracking-wide">
                {currentTyping ? `${currentTyping}` : <span className="text-neutral-500 italic">Type word from memory...</span>}
                <span className="inline-block w-2 h-5 bg-amber-400 animate-pulse ml-1 align-middle" />
              </div>
              <span className="text-[10px] font-mono text-neutral-400 border border-neutral-700 px-1.5 py-0.5 rounded">
                SPACE to confirm
              </span>
            </div>
          </div>
        )}

        {/* Hidden Input for Keystrokes */}
        <input
          ref={inputRef}
          type="text"
          value={currentTyping}
          onChange={handleInputChange}
          disabled={gameState !== 'recalling'}
          className="opacity-0 absolute inset-0 w-full h-full cursor-default"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
          aria-label="Memory Sequence Recall Input"
        />

        {/* Ready Overlay */}
        {gameState === 'ready' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xs z-30 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shadow-2xl animate-pulse">
              <Brain className="w-9 h-9" />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <h3 className="text-2xl font-black text-white tracking-tight">3D Neural Matrix</h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                A 3D holographic neural matrix sequence challenge. Memorize the sequence of words illuminated on the crystalline synapse nodes before the shutter closes, then reconstruct them in order from blind memory.
              </p>
            </div>
            <Button variant="primary" size="lg" icon={Play} onClick={startGame} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold px-8 shadow-xl">
              INITIALIZE SYNAPTIC MATRIX
            </Button>
          </div>
        )}

        {/* Round Review Overlay */}
        {gameState === 'review' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xs z-30 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl ${
              roundResult === 'success'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
            }`}>
              {roundResult === 'success' ? <CheckCircle2 className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white">
                {roundResult === 'success' ? 'SYNAPTIC SYNC VERIFIED!' : 'NEURAL DESYNCHRONIZATION'}
              </h3>
              <p className="text-xs text-neutral-300 font-mono">
                {roundResult === 'success'
                  ? `All ${sequence.length} nodes successfully reconstructed.`
                  : 'Sequence mismatched. Review node connections in 3D.'}
              </p>
            </div>

            <Button variant="primary" size="md" onClick={handleNextRound} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold px-6">
              ADVANCE TO NEXT ROUND
            </Button>
          </div>
        )}

        {/* Game Over Summary Overlay */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-black/92 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-xl">
              <Trophy className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white tracking-tight">NEURAL CAPACITY REACHED</h3>
              <p className="text-xs text-neutral-400 font-mono">3 Strikes Incurred — Memory Matrix Deactivated</p>
            </div>

            {personalBestNotice && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold animate-pulse">
                <Trophy className="w-3.5 h-3.5" /> NEW DEEPEST ROUND RECORD!
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/5 p-4 rounded-xl border border-white/10 text-xs font-mono w-full max-w-md">
              <div>
                <span className="text-[10px] text-neutral-400 block uppercase">Deepest Round</span>
                <span className="text-xl font-bold text-cyan-400">Round {round}</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block uppercase">Total Score</span>
                <span className="text-xl font-bold text-white">{score}</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block uppercase">Strikes</span>
                <span className="text-xl font-bold text-rose-400">{strikes}/3</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block uppercase">Active Time</span>
                <span className="text-xl font-bold text-emerald-400">{elapsedSeconds}s</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button variant="primary" size="md" icon={RotateCcw} onClick={startGame} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold">
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
        <span>Type reconstructed word and press Space to advance to the next node</span>
        <span>Deepest Record: Round {personalBest?.deepestRound || 1} • Consecutive: {consecutiveSuccesses}</span>
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

export default TypingMemoryGame;
