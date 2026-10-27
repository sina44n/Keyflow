import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Shield, Flame, RotateCcw, Play, Pause, ArrowLeft, Trophy, AlertTriangle } from 'lucide-react';
import { Button } from '../../common/Button';
import { calculateAccuracy, calculateWpm, playArcadeSound } from '../../../utils/arcadeEngine';
import { saveArcadeRecord } from '../../../utils/arcadeStorage';
import { calculateDifficultyTier, getKeyCascadeConfig } from '../../../utils/arcadeDifficulty';
import { ArcadeWordDeck, getVocabularyPool } from '../../../utils/arcadeVocabulary';
import { ArcadeExitDialog } from '../ArcadeExitDialog';
import { useI18n } from '../../../i18n/I18nContext';

const ARENA_HEIGHT = 440;
const DANGER_LINE_Y = 380;
const INITIAL_LIVES = 3;

export const KeyCascadeGame = ({ onExit, soundEnabled = true }) => {
  const { t } = useI18n();
  // Game states: 'ready', 'countdown', 'playing', 'paused', 'gameover'
  const [gameState, setGameState] = useState('ready');
  const [countdown, setCountdown] = useState(3);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Anti-repetition word deck initialized with Tier 1 pool
  const wordDeckRef = useRef(
    new ArcadeWordDeck({ gameId: 'cascade', pool: getVocabularyPool('cascade', 1) })
  );

  // Gameplay metrics
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [wordsEliminated, setWordsEliminated] = useState(0);
  const [missedWords, setMissedWords] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [totalStrokes, setTotalStrokes] = useState(0);
  const [correctStrokes, setCorrectStrokes] = useState(0);
  const [personalBestNotice, setPersonalBestNotice] = useState(false);
  const [tierUpToast, setTierUpToast] = useState(null);

  // Dynamic wave derived from score
  const wave = Math.min(6, Math.floor(score / 450) + 1);

  // Dynamic difficulty calculation based on performance & progression
  const difficultyInfo = useMemo(() => {
    return calculateDifficultyTier({
      activeSeconds: elapsedSeconds,
      completedCount: wordsEliminated,
      score,
      wave,
      currentStreak: combo,
      errorCount: missedWords,
      mode: 'cascade',
    });
  }, [elapsedSeconds, wordsEliminated, score, wave, combo, missedWords]);

  const cascadeConfig = useMemo(() => {
    return getKeyCascadeConfig(difficultyInfo.tier, difficultyInfo.performanceQuotient);
  }, [difficultyInfo.tier, difficultyInfo.performanceQuotient]);

  const prevTierRef = useRef(1);
  useEffect(() => {
    if (difficultyInfo.tier > prevTierRef.current) {
      setTierUpToast(`DIFFICULTY INCREASED — TIER ${difficultyInfo.tier} (${difficultyInfo.tierName})`);
      playArcadeSound('combo', soundEnabled);
      // Dynamically update deck pool to match new tier
      wordDeckRef.current.setPool(getVocabularyPool('cascade', difficultyInfo.tier));
      const t = setTimeout(() => setTierUpToast(null), 3000);
      prevTierRef.current = difficultyInfo.tier;
      return () => clearTimeout(t);
    }
    prevTierRef.current = difficultyInfo.tier;
  }, [difficultyInfo.tier, difficultyInfo.tierName, soundEnabled]);

  // Active falling words: [{ id, text, x, y, speed, targetIndex }]
  const [fallingWords, setFallingWords] = useState([]);
  const [activeWordId, setActiveWordId] = useState(null);
  const [typedBuffer, setTypedBuffer] = useState('');
  const [laserBeam, setLaserBeam] = useState(null); // { x, y }

  const nextWordIdRef = useRef(1);
  const lastSpawnTimeRef = useRef(0);
  const timerIntervalRef = useRef(null);
  const inputRef = useRef(null);

  // Reset all state for a clean game
  const resetGame = useCallback(() => {
    setGameState('ready');
    setScore(0);
    setLives(INITIAL_LIVES);
    setCombo(0);
    setBestCombo(0);
    setWordsEliminated(0);
    setMissedWords(0);
    setElapsedSeconds(0);
    setTotalStrokes(0);
    setCorrectStrokes(0);
    setFallingWords([]);
    setActiveWordId(null);
    setTypedBuffer('');
    setLaserBeam(null);
    setPersonalBestNotice(false);
    nextWordIdRef.current = 1;
    wordDeckRef.current?.resetRun();
  }, []);

  const startCountdown = () => {
    resetGame();
    setGameState('countdown');
    setCountdown(3);
  };

  // Countdown handler
  useEffect(() => {
    if (gameState !== 'countdown') return;
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 800);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setGameState('playing'), 0);
    return () => clearTimeout(t);
  }, [gameState, countdown]);

  // Elapsed seconds timer
  useEffect(() => {
    if (gameState !== 'playing') {
      clearInterval(timerIntervalRef.current);
      return;
    }
    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timerIntervalRef.current);
  }, [gameState]);

  // Focus input when playing
  useEffect(() => {
    if (gameState === 'playing' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameState]);

  // Core Game Loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    let animId;
    let lastTimestamp = performance.now();

    const loop = (timestamp) => {
      const delta = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
      lastTimestamp = timestamp;

      // Spawn words dynamically with anti-repetition and on-screen deduplication
      if (timestamp - lastSpawnTimeRef.current > cascadeConfig.spawnInterval * 1000) {
        lastSpawnTimeRef.current = timestamp;

        setFallingWords((prev) => {
          if (prev.length >= cascadeConfig.maxWords) return prev;
          const activeScreenWords = prev.map((w) => w.text);
          const newWordText = wordDeckRef.current.draw(activeScreenWords);
          const col = Math.floor(Math.random() * 4);
          const x = 40 + col * 120 + Math.random() * 30;
          const speed = cascadeConfig.fallSpeed + Math.random() * 8;

          return [
            ...prev,
            {
              id: nextWordIdRef.current++,
              text: newWordText,
              x,
              y: 20,
              speed,
            },
          ];
        });
      }

      // Move falling words down
      setFallingWords((prev) => {
        const next = [];
        let hitBottomCount = 0;

        for (const w of prev) {
          const newY = w.y + w.speed * delta;
          if (newY >= DANGER_LINE_Y) {
            hitBottomCount++;
          } else {
            next.push({ ...w, y: newY });
          }
        }

        if (hitBottomCount > 0) {
          playArcadeSound('damage', soundEnabled);
          setLives((l) => {
            const remaining = l - hitBottomCount;
            if (remaining <= 0) {
              setGameState('gameover');
            }
            return Math.max(0, remaining);
          });
          setMissedWords((m) => m + hitBottomCount);
          setCombo(0);
          setActiveWordId(null);
          setTypedBuffer('');
        }

        return next;
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, cascadeConfig, soundEnabled]);

  // On Game Over, save personal best
  useEffect(() => {
    if (gameState === 'gameover') {
      const result = saveArcadeRecord('cascade', {
        score,
        bestCombo,
        wordsDefeated: wordsEliminated,
        highestTier: difficultyInfo.tier,
      });
      if (result.isNewBest) {
        const t = setTimeout(() => setPersonalBestNotice(true), 0);
        playArcadeSound('victory', soundEnabled);
        return () => clearTimeout(t);
      }
    }
  }, [gameState, score, bestCombo, wordsEliminated, difficultyInfo.tier, soundEnabled]);

  const handleAttemptExit = () => {
    if (gameState === 'playing' || gameState === 'paused') {
      setShowExitConfirm(true);
    } else {
      onExit();
    }
  };

  // Handle typing inputs
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

      // If already targeting a word
      if (activeWordId) {
        const target = fallingWords.find((w) => w.id === activeWordId);
        if (target) {
          const expectedChar = target.text[typedBuffer.length]?.toLowerCase();
          if (char === expectedChar) {
            setCorrectStrokes((s) => s + 1);
            const newBuf = typedBuffer + char;
            setTypedBuffer(newBuf);

            // Completed the word!
            if (newBuf.length === target.text.length) {
              playArcadeSound('blaster', soundEnabled);
              setLaserBeam({ x: target.x + 30, y: target.y });
              setTimeout(() => setLaserBeam(null), 180);

              const wordPoints = target.text.length * 15 * (1 + combo * 0.25);
              setScore((s) => Math.round(s + wordPoints));
              setWordsEliminated((w) => w + 1);
              setCombo((c) => {
                const n = c + 1;
                setBestCombo((b) => Math.max(b, n));
                if (n % 5 === 0) playArcadeSound('combo', soundEnabled);
                return n;
              });

              setFallingWords((prev) => prev.filter((w) => w.id !== target.id));
              setActiveWordId(null);
              setTypedBuffer('');
            }
          } else {
            // Typing error on targeted word
            setCombo(0);
          }
          return;
        }
      }

      // Find lowest word starting with this character
      const candidate = [...fallingWords]
        .sort((a, b) => b.y - a.y)
        .find((w) => w.text.toLowerCase().startsWith(char));

      if (candidate) {
        setCorrectStrokes((s) => s + 1);
        setActiveWordId(candidate.id);
        const newBuf = char;
        setTypedBuffer(newBuf);

        // Word might be single letter
        if (newBuf.length === candidate.text.length) {
          playArcadeSound('blaster', soundEnabled);
          setScore((s) => s + 20);
          setWordsEliminated((w) => w + 1);
          setFallingWords((prev) => prev.filter((w) => w.id !== candidate.id));
          setActiveWordId(null);
          setTypedBuffer('');
        }
      } else {
        setCombo(0);
      }
    }
  };

  const accuracy = calculateAccuracy(correctStrokes, totalStrokes);
  const wpm = calculateWpm(correctStrokes, elapsedSeconds);

  return (
    <div
      className="card-panel p-4 sm:p-6 space-y-4 max-w-4xl mx-auto border border-[var(--border)] shadow-2xl relative select-none"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Hidden input to ensure keyboard captures cleanly across all browsers & mobile */}
      <input
        ref={inputRef}
        type="text"
        className="opacity-0 absolute w-0 h-0 pointer-events-none"
        onKeyDown={handleKeyDown}
        aria-label="Arcade typing input"
      />

      {/* Top Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="xs" icon={ArrowLeft} onClick={handleAttemptExit}>
            {t('arcade.title') === 'Game-Engineered Speed Drills' ? 'Arcade Hub' : t('nav.arcade')}
          </Button>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Flame className="w-5 h-5 text-[var(--accent)]" />
              {t('arcade.cascade.title')}
            </h2>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              Wave {wave} • {difficultyInfo.tierName} Intensity (Tier {difficultyInfo.tier})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {gameState === 'playing' ? (
            <Button variant="outline" size="xs" icon={Pause} onClick={() => setGameState('paused')}>
              {t('common.pause')} (Esc)
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
        <div className="px-3 py-2 rounded-lg bg-orange-950/80 border border-orange-500/50 text-orange-300 font-mono text-xs flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <span className="flex items-center gap-2 font-bold">
            <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
            {tierUpToast}
          </span>
          <span className="text-[10px] text-orange-400 uppercase">Spawn Rate & Velocity Scaled</span>
        </div>
      )}

      {/* HUD Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 bg-[var(--bg-elevated)] p-3 rounded-xl border border-[var(--border)] text-xs font-mono">
        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)] block">{t('arcade.hud.score')}</span>
          <span className="text-sm sm:text-base font-bold text-[var(--text-primary)]">{score}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)] block">{t('arcade.hud.health')}</span>
          <div className="flex items-center gap-1 mt-0.5">
            {[...Array(INITIAL_LIVES)].map((_, i) => (
              <Shield
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < lives ? 'text-emerald-400 fill-emerald-400/30' : 'text-neutral-600'
                }`}
              />
            ))}
          </div>
        </div>
        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)] block">{t('arcade.hud.combo')}</span>
          <span className="text-sm sm:text-base font-bold text-[var(--accent)]">
            {combo}x <span className="text-[10px] text-[var(--text-muted)]">(max {bestCombo})</span>
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)] block">{t('workstation.wordsTyped')}</span>
          <span className="text-sm sm:text-base font-bold text-emerald-400">{wordsEliminated}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)] block">{t('common.accuracy')}</span>
          <span className="text-sm sm:text-base font-bold text-[var(--ui-success)]">{accuracy}%</span>
        </div>
        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)] block">{t('common.time')}</span>
          <span className="text-sm sm:text-base font-bold text-[var(--text-secondary)]">
            {elapsedSeconds}s
          </span>
        </div>
      </div>

      {/* Active Falling Words Arena */}
      <div
        className="relative w-full rounded-xl border border-[var(--border)] bg-[var(--bg-main)] overflow-hidden shadow-inner flex flex-col justify-between"
        style={{ height: ARENA_HEIGHT }}
      >
        {/* Background Grid Pattern */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Laser Beam Effect */}
        {laserBeam && (
          <div
            className="absolute bottom-0 z-20 pointer-events-none"
            style={{
              left: `${laserBeam.x}px`,
              top: `${laserBeam.y}px`,
              width: '2px',
              height: `${ARENA_HEIGHT - laserBeam.y}px`,
              background: 'linear-gradient(to top, var(--accent), #fff)',
              boxShadow: '0 0 12px var(--accent)',
            }}
          />
        )}

        {/* Danger Line */}
        <div
          className="absolute left-0 right-0 z-10 border-b-2 border-dashed border-rose-500/60 flex items-center justify-between px-3 text-[10px] font-mono text-rose-400 bg-rose-500/10 pointer-events-none"
          style={{ top: DANGER_LINE_Y }}
        >
          <span className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-500" /> BASELINE SHIELD BARRIER
          </span>
          <span>BREACH ZONE</span>
        </div>

        {/* Falling Words */}
        {fallingWords.map((word) => {
          const isTargeted = word.id === activeWordId;
          const typedLen = isTargeted ? typedBuffer.length : 0;
          const matchingPart = word.text.slice(0, typedLen);
          const remainingPart = word.text.slice(typedLen);

          return (
            <div
              key={word.id}
              className={`absolute px-2.5 py-1 rounded-md font-mono text-xs font-bold transition-transform shadow-md ${
                isTargeted
                  ? 'bg-[var(--bg-elevated)] border-2 border-[var(--accent)] text-[var(--accent-fg)] ring-2 ring-[var(--accent)]/30 scale-105 z-20'
                  : 'bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] z-10'
              }`}
              style={{ left: `${word.x}px`, top: `${word.y}px` }}
            >
              {isTargeted ? (
                <span>
                  <span className="text-emerald-400 bg-emerald-950/40 px-0.5 rounded">
                    {matchingPart}
                  </span>
                  <span className="text-[var(--text-primary)]">{remainingPart}</span>
                </span>
              ) : (
                word.text
              )}
            </div>
          );
        })}

        {/* Arena Overlay States */}
        {gameState === 'ready' && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-xs z-30 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--accent)] flex items-center justify-center shadow-lg">
              <Flame className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-xl font-bold text-[var(--text-primary)]">{t('arcade.cascade.title')}</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {t('arcade.cascade.desc')}
              </p>
            </div>
            <Button variant="primary" size="lg" icon={Play} onClick={startCountdown}>
              {t('common.play')}
            </Button>
          </div>
        )}

        {gameState === 'countdown' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs z-30 flex items-center justify-center">
            <span className="text-6xl font-black font-mono text-[var(--accent)] animate-pulse">
              {countdown}
            </span>
          </div>
        )}

        {gameState === 'paused' && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-xs z-30 flex flex-col items-center justify-center space-y-4">
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
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-[var(--text-primary)]">{t('arcade.hud.gameOver')}</h3>
              <p className="text-xs text-[var(--text-secondary)]">All 3 shield barriers were overloaded.</p>
            </div>

            {personalBestNotice && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold">
                <Trophy className="w-3.5 h-3.5" /> {t('arcade.hud.newBest')}
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 bg-[var(--bg-elevated)] p-4 rounded-xl border border-[var(--border)] text-xs font-mono w-full max-w-sm">
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">{t('arcade.hud.score')}</span>
                <span className="text-lg font-bold text-[var(--accent)]">{score}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">{t('common.words')}</span>
                <span className="text-lg font-bold text-emerald-400">{wordsEliminated}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">{t('arcade.hud.combo')}</span>
                <span className="text-lg font-bold text-amber-400">{bestCombo}x</span>
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

      {/* Bottom Status / Instructions Tip */}
      <div className="flex flex-wrap items-center justify-between text-xs text-[var(--text-muted)] font-mono px-1">
        <span>{t('workstation.clickToFocus')}</span>
        <span>{t('arcade.hud.wave')} {wave} • {t('workstation.mistakes')}: {missedWords} • {t('common.speed')} {wpm} WPM</span>
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
