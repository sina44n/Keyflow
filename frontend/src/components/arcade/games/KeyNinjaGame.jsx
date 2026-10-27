import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Swords, RotateCcw, Play, Pause, ArrowLeft, Trophy, Heart, AlertTriangle, Flame } from 'lucide-react';
import { Button } from '../../common/Button';
import { calculateAccuracy, getRandomWord, playArcadeSound } from '../../../utils/arcadeEngine';
import { saveArcadeRecord, getGameRecord } from '../../../utils/arcadeStorage';
import { calculateDifficultyTier, getKeyNinjaConfig } from '../../../utils/arcadeDifficulty';

const ARENA_WIDTH = 700;
const ARENA_HEIGHT = 440;
const GRAVITY = 380; // px/s^2

export const KeyNinjaGame = ({ onExit, soundEnabled = true }) => {
  const [gameState, setGameState] = useState('ready');
  const [countdown, setCountdown] = useState(3);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [slices, setSlices] = useState(0);
  const [misses, setMisses] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [totalStrokes, setTotalStrokes] = useState(0);
  const [correctStrokes, setCorrectStrokes] = useState(0);
  const [personalBestNotice, setPersonalBestNotice] = useState(false);
  const [tierUpToast, setTierUpToast] = useState(null);

  // Targets: [{ id, text, x, y, vx, vy, isSliced, sliceTimer }]
  const [projectiles, setProjectiles] = useState([]);
  const [slashLines, setSlashLines] = useState([]); // [{ id, x1, y1, x2, y2 }]
  const [activeTargetId, setActiveTargetId] = useState(null);
  const [typedBuffer, setTypedBuffer] = useState('');

  const nextIdRef = useRef(1);
  const lastLaunchRef = useRef(0);
  const timerIntervalRef = useRef(null);
  const inputRef = useRef(null);

  const personalBest = getGameRecord('ninja');

  // Dynamic difficulty calculation based on performance & progression
  const difficultyInfo = useMemo(() => {
    return calculateDifficultyTier({
      activeSeconds: elapsedSeconds,
      completedCount: slices,
      score,
      currentStreak: combo,
      errorCount: misses,
      mode: 'ninja',
    });
  }, [elapsedSeconds, slices, score, combo, misses]);

  const ninjaConfig = useMemo(() => {
    return getKeyNinjaConfig(difficultyInfo.tier, difficultyInfo.performanceQuotient);
  }, [difficultyInfo.tier, difficultyInfo.performanceQuotient]);

  const prevTierRef = useRef(1);
  useEffect(() => {
    if (difficultyInfo.tier > prevTierRef.current) {
      setTierUpToast(`BLADE TEMPO INCREASED — TIER ${difficultyInfo.tier} (${difficultyInfo.tierName})`);
      playArcadeSound('combo', soundEnabled);
      const t = setTimeout(() => setTierUpToast(null), 3000);
      prevTierRef.current = difficultyInfo.tier;
      return () => clearTimeout(t);
    }
    prevTierRef.current = difficultyInfo.tier;
  }, [difficultyInfo.tier, difficultyInfo.tierName, soundEnabled]);

  const resetGame = useCallback(() => {
    setGameState('ready');
    setScore(0);
    setLives(3);
    setCombo(0);
    setMaxCombo(0);
    setSlices(0);
    setMisses(0);
    setElapsedSeconds(0);
    setTotalStrokes(0);
    setCorrectStrokes(0);
    setProjectiles([]);
    setSlashLines([]);
    setActiveTargetId(null);
    setTypedBuffer('');
    setPersonalBestNotice(false);
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

  // Elapsed timer
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

  // Game loop for physics
  useEffect(() => {
    if (gameState !== 'playing') return;

    let animId;
    let lastTime = performance.now();

    const loop = (time) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      // Launch new airborne targets based on dynamic difficulty tier
      if (time - lastLaunchRef.current > ninjaConfig.spawnInterval * 1000) {
        lastLaunchRef.current = time;
        const text = getRandomWord(ninjaConfig.pool);
        const startX = 80 + Math.random() * (ARENA_WIDTH - 200);
        const vx = (Math.random() - 0.5) * ninjaConfig.launchVelocityX;
        const vy = ninjaConfig.launchVelocityY - Math.random() * 40;

        setProjectiles((prev) => {
          if (prev.length >= ninjaConfig.maxAirborne) return prev;
          return [
            ...prev,
            {
              id: nextIdRef.current++,
              text,
              x: startX,
              y: ARENA_HEIGHT + 10,
              vx,
              vy,
              isSliced: false,
              sliceTimer: 0,
            },
          ];
        });
      }

      // Update positions with gravity
      setProjectiles((prev) => {
        const next = [];
        let droppedCount = 0;

        for (const p of prev) {
          if (p.isSliced) {
            // Sliced fragments fall away fast
            const updatedTimer = p.sliceTimer + dt;
            if (updatedTimer < 0.35) {
              next.push({
                ...p,
                y: p.y + p.vy * dt,
                x: p.x + p.vx * dt,
                vy: p.vy + GRAVITY * 1.5 * dt,
                sliceTimer: updatedTimer,
              });
            }
          } else {
            const nextX = p.x + p.vx * dt;
            const nextVy = p.vy + GRAVITY * dt;
            const nextY = p.y + nextVy * dt;

            // Checked if dropped off-screen
            if (nextY > ARENA_HEIGHT + 30 && nextVy > 0) {
              droppedCount++;
            } else {
              next.push({ ...p, x: nextX, y: nextY, vy: nextVy });
            }
          }
        }

        if (droppedCount > 0) {
          playArcadeSound('damage', soundEnabled);
          setLives((l) => {
            const rem = l - droppedCount;
            if (rem <= 0) setGameState('gameover');
            return Math.max(0, rem);
          });
          setMisses((m) => m + droppedCount);
          setCombo(0);
          setActiveTargetId(null);
          setTypedBuffer('');
        }

        return next;
      });

      // Clear old slash lines
      setSlashLines((prev) => prev.filter((sl) => time - sl.created < 200));

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, ninjaConfig, soundEnabled]);

  // Focus input
  useEffect(() => {
    if (gameState === 'playing' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameState]);

  // Game over save
  useEffect(() => {
    if (gameState === 'gameover') {
      const result = saveArcadeRecord('ninja', {
        score,
        slices,
        maxCombo,
        highestTier: difficultyInfo.tier,
      });
      if (result.isNewBest) {
        const t = setTimeout(() => setPersonalBestNotice(true), 0);
        playArcadeSound('victory', soundEnabled);
        return () => clearTimeout(t);
      }
    }
  }, [gameState, score, slices, maxCombo, difficultyInfo.tier, soundEnabled]);

  // Handle typing input
  const handleKeyDown = (e) => {
    if (gameState !== 'playing') return;

    if (e.key === 'Escape') {
      setGameState('paused');
      return;
    }

    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      const char = e.key.toLowerCase();
      setTotalStrokes((s) => s + 1);

      // If already tracking an active projectile
      if (activeTargetId) {
        const target = projectiles.find((p) => p.id === activeTargetId && !p.isSliced);
        if (target) {
          const expectedChar = target.text[typedBuffer.length]?.toLowerCase();
          if (char === expectedChar) {
            setCorrectStrokes((s) => s + 1);
            const nextBuf = typedBuffer + char;
            setTypedBuffer(nextBuf);

            // Sliced completely!
            if (nextBuf.length === target.text.length) {
              playArcadeSound('slice', soundEnabled);

              // Add visual katana slash line across the target
              setSlashLines((prev) => [
                ...prev,
                {
                  id: Math.random(),
                  x1: target.x - 30,
                  y1: target.y + 20,
                  x2: target.x + 80,
                  y2: target.y - 20,
                  created: performance.now(),
                },
              ]);

              const pts = target.text.length * 25 * (1 + combo * 0.3);
              setScore((sc) => Math.round(sc + pts));
              setSlices((sl) => sl + 1);
              setCombo((c) => {
                const next = c + 1;
                setMaxCombo((m) => Math.max(m, next));
                if (next % 4 === 0) playArcadeSound('combo', soundEnabled);
                return next;
              });

              // Mark target as sliced
              setProjectiles((prev) =>
                prev.map((p) =>
                  p.id === target.id
                    ? { ...p, isSliced: true, vy: -120, vx: p.vx * 1.5, sliceTimer: 0 }
                    : p
                )
              );
              setActiveTargetId(null);
              setTypedBuffer('');
            }
          } else {
            setCombo(0);
          }
          return;
        }
      }

      // Find unsliced airborne target matching starting char
      const candidate = [...projectiles]
        .filter((p) => !p.isSliced)
        .sort((a, b) => a.y - b.y)
        .find((p) => p.text.toLowerCase().startsWith(char));

      if (candidate) {
        setCorrectStrokes((s) => s + 1);
        setActiveTargetId(candidate.id);
        const nextBuf = char;
        setTypedBuffer(nextBuf);

        if (nextBuf.length === candidate.text.length) {
          playArcadeSound('slice', soundEnabled);
          setScore((sc) => sc + 30);
          setSlices((sl) => sl + 1);
          setProjectiles((prev) =>
            prev.map((p) =>
              p.id === candidate.id
                ? { ...p, isSliced: true, vy: -100, sliceTimer: 0 }
                : p
            )
          );
          setActiveTargetId(null);
          setTypedBuffer('');
        }
      } else {
        setCombo(0);
      }
    }
  };

  const accuracy = calculateAccuracy(correctStrokes, totalStrokes);

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
        aria-label="Key Ninja typing input"
      />

      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="xs" icon={ArrowLeft} onClick={onExit}>
            Arcade Hub
          </Button>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Swords className="w-5 h-5 text-[var(--accent)]" />
              Key Ninja
            </h2>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              Airborne Katana Slashing • {difficultyInfo.tierName} (Tier {difficultyInfo.tier})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
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

      {/* Dynamic Tier Escalation Toast Banner */}
      {tierUpToast && (
        <div className="px-3 py-2 rounded-lg bg-rose-950/80 border border-rose-500/50 text-rose-300 font-mono text-xs flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <span className="flex items-center gap-2 font-bold">
            <Flame className="w-4 h-4 text-rose-400 animate-pulse" />
            {tierUpToast}
          </span>
          <span className="text-[10px] text-rose-400 uppercase">Spawn Rate & Velocity Scaled</span>
        </div>
      )}

      {/* HUD Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 bg-[var(--bg-elevated)] p-3 rounded-xl border border-[var(--border)] text-xs font-mono">
        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)] block">Score</span>
          <span className="text-base font-bold text-[var(--text-primary)]">{score}</span>
        </div>

        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)] block">Lives</span>
          <div className="flex items-center gap-1 mt-0.5">
            {[...Array(3)].map((_, i) => (
              <Heart
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < lives ? 'text-rose-500 fill-rose-500' : 'text-neutral-600'
                }`}
              />
            ))}
          </div>
        </div>

        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)] block">Blade Combo</span>
          <span className="text-base font-bold text-rose-400">
            {combo}x <span className="text-[10px] text-[var(--text-muted)]">(max {maxCombo})</span>
          </span>
        </div>

        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)] block">Slices</span>
          <span className="text-base font-bold text-emerald-400">{slices}</span>
        </div>

        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)] block">Accuracy</span>
          <span className="text-base font-bold text-[var(--ui-success)]">{accuracy}%</span>
        </div>

        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)] block">Time</span>
          <span className="text-base font-bold text-[var(--text-secondary)]">{elapsedSeconds}s</span>
        </div>
      </div>

      {/* Ninja Dojo Arena */}
      <div
        className="relative w-full rounded-xl border border-[var(--border)] bg-[#090b10] overflow-hidden shadow-inner flex flex-col justify-between"
        style={{ height: ARENA_HEIGHT }}
      >
        {/* Background ambient glowing slash aura */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 50%, rgba(225,29,72,0.4) 0%, transparent 65%)',
          }}
        />

        {/* Dynamic Katana Slash Visuals */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-30">
          {slashLines.map((line) => (
            <line
              key={line.id}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="#F43F5E"
              strokeWidth="4"
              strokeLinecap="round"
              className="animate-out fade-out duration-200"
            />
          ))}
        </svg>

        {/* Airborne Targets */}
        {projectiles.map((p) => {
          const isTargeted = p.id === activeTargetId && !p.isSliced;
          const typedLen = isTargeted ? typedBuffer.length : 0;

          if (p.isSliced) {
            return (
              <div
                key={p.id}
                className="absolute flex gap-2 font-mono text-xs font-black text-rose-400 opacity-70 scale-95 pointer-events-none"
                style={{ left: `${p.x}px`, top: `${p.y}px` }}
              >
                <span className="transform -rotate-12 translate-x-[-10px] line-through">
                  {p.text.slice(0, Math.ceil(p.text.length / 2))}
                </span>
                <span className="transform rotate-12 translate-x-[10px] line-through">
                  {p.text.slice(Math.ceil(p.text.length / 2))}
                </span>
              </div>
            );
          }

          return (
            <div
              key={p.id}
              className={`absolute px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all shadow-lg ${
                isTargeted
                  ? 'bg-rose-950/90 border-2 border-rose-500 text-rose-100 ring-4 ring-rose-500/30 scale-110 z-20'
                  : 'bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] z-10'
              }`}
              style={{ left: `${p.x}px`, top: `${p.y}px` }}
            >
              {isTargeted ? (
                <span>
                  <span className="text-emerald-400 bg-emerald-950/60 rounded px-0.5">
                    {p.text.slice(0, typedLen)}
                  </span>
                  <span>{p.text.slice(typedLen)}</span>
                </span>
              ) : (
                p.text
              )}
            </div>
          );
        })}

        {/* Overlay States */}
        {gameState === 'ready' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xs z-30 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] text-rose-500 flex items-center justify-center shadow-lg">
              <Swords className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-xl font-bold text-[var(--text-primary)]">Key Ninja Arena</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Toss targets into the air. Slice them cleanly with your katana by typing their letters before they drop off-screen.
              </p>
            </div>
            <Button variant="primary" size="lg" icon={Play} onClick={startCountdown}>
              Enter Dojo
            </Button>
          </div>
        )}

        {gameState === 'countdown' && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xs z-30 flex items-center justify-center">
            <span className="text-6xl font-black font-mono text-rose-500 animate-pulse">
              {countdown}
            </span>
          </div>
        )}

        {gameState === 'paused' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xs z-30 flex flex-col items-center justify-center space-y-4">
            <h3 className="text-xl font-bold text-[var(--text-primary)]">Dojo Paused</h3>
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
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-[var(--text-primary)]">Out of Lives!</h3>
              <p className="text-xs text-[var(--text-secondary)]">3 flying targets slipped through uncut.</p>
            </div>

            {personalBestNotice && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold">
                <Trophy className="w-3.5 h-3.5" /> NEW NINJA RECORD!
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 bg-[var(--bg-elevated)] p-4 rounded-xl border border-[var(--border)] text-xs font-mono w-full max-w-sm">
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Total Score</span>
                <span className="text-lg font-bold text-[var(--accent)]">{score}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Total Slices</span>
                <span className="text-lg font-bold text-emerald-400">{slices}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Max Combo</span>
                <span className="text-lg font-bold text-amber-400">{maxCombo}x</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button variant="primary" size="md" icon={RotateCcw} onClick={startCountdown}>
                Play Again
              </Button>
              <Button variant="outline" size="md" onClick={onExit}>
                Back to Arcade
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between text-xs text-[var(--text-muted)] font-mono px-1">
        <span>Type first letter to target any flying fruit or word</span>
        <span>Missed: {misses} • Personal Best: {personalBest?.bestScore || 0} pts</span>
      </div>
    </div>
  );
};
