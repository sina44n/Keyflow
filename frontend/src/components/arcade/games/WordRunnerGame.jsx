import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Footprints, RotateCcw, Play, Pause, ArrowLeft, Trophy, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '../../common/Button';
import { calculateAccuracy, getRandomWord, playArcadeSound } from '../../../utils/arcadeEngine';
import { saveArcadeRecord, getGameRecord } from '../../../utils/arcadeStorage';

const TRACK_LENGTH = 1000; // 1,000 meters to finish line
const OBSTACLE_SPACING_METERS = 40; // Every 40m an obstacle

export const WordRunnerGame = ({ onExit, soundEnabled = true }) => {
  const [gameState, setGameState] = useState('ready'); // ready, countdown, playing, paused, gameover, victory
  const [countdown, setCountdown] = useState(3);

  const [distance, setDistance] = useState(0); // 0 to 1,000 meters
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [obstaclesCleared, setObstaclesCleared] = useState(0);
  const [stumbles, setStumbles] = useState(0);

  // Active obstacle approaching
  const [activeObstacle, setActiveObstacle] = useState(null); // { id, word, type: 'barrier' | 'spike' | 'laser', distance }
  const [typedBuffer, setTypedBuffer] = useState('');
  const [isJumping, setIsJumping] = useState(false);
  const [jumpProgress, setJumpProgress] = useState(0);

  const [totalStrokes, setTotalStrokes] = useState(0);
  const [correctStrokes, setCorrectStrokes] = useState(0);
  const [personalBestNotice, setPersonalBestNotice] = useState(false);

  const inputRef = useRef(null);
  const personalBest = getGameRecord('runner');

  // Generate next obstacle
  const spawnNextObstacle = useCallback((currentDist) => {
    const distToSpawn = Math.min(TRACK_LENGTH, currentDist + OBSTACLE_SPACING_METERS);
    const pool = currentDist > 500 ? 'medium' : 'short';
    const types = ['barrier', 'laser', 'spikes'];
    return {
      id: Math.random(),
      word: getRandomWord(pool),
      type: types[Math.floor(Math.random() * types.length)],
      targetDistance: distToSpawn,
    };
  }, []);

  const resetGame = useCallback(() => {
    setGameState('ready');
    setDistance(0);
    setLives(3);
    setScore(0);
    setObstaclesCleared(0);
    setStumbles(0);
    setTotalStrokes(0);
    setCorrectStrokes(0);
    setTypedBuffer('');
    setIsJumping(false);
    setJumpProgress(0);
    setPersonalBestNotice(false);
    setActiveObstacle(spawnNextObstacle(0));
  }, [spawnNextObstacle]);

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

  // Runner Movement & Collision Loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    let animId;
    let lastTime = performance.now();

    const loop = (time) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      // Base speed: 12 m/s, scales up to 24 m/s near end
      const speed = 12 + (distance / TRACK_LENGTH) * 12;
      const nextDist = distance + speed * dt;

      // Check for finish line
      if (nextDist >= TRACK_LENGTH) {
        setDistance(TRACK_LENGTH);
        setGameState('victory');
        playArcadeSound('victory', soundEnabled);
        return;
      }

      setDistance(nextDist);

      // Check collision with active obstacle if player hasn't jumped
      if (activeObstacle && nextDist >= activeObstacle.targetDistance) {
        // Collided!
        playArcadeSound('damage', soundEnabled);
        setLives((l) => {
          const rem = l - 1;
          if (rem <= 0) setGameState('gameover');
          return Math.max(0, rem);
        });
        setStumbles((s) => s + 1);
        setTypedBuffer('');
        // Spawn next obstacle
        setActiveObstacle(spawnNextObstacle(nextDist));
      }

      // Jump animation decay
      if (isJumping) {
        setJumpProgress((jp) => {
          const nextJp = jp + dt * 2.5;
          if (nextJp >= 1) {
            setIsJumping(false);
            return 0;
          }
          return nextJp;
        });
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, distance, activeObstacle, isJumping, spawnNextObstacle, soundEnabled]);

  // Focus input
  useEffect(() => {
    if (gameState === 'playing' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameState]);

  // Save game record on gameover / victory
  useEffect(() => {
    if (gameState === 'gameover' || gameState === 'victory') {
      const finalDist = Math.round(distance);
      const result = saveArcadeRecord('runner', {
        distance: finalDist,
        score,
        obstaclesCleared,
      });
      if (result.isNewBest) {
        const t = setTimeout(() => setPersonalBestNotice(true), 0);
        return () => clearTimeout(t);
      }
    }
  }, [gameState, distance, score, obstaclesCleared]);

  // Handle typing to clear upcoming obstacle
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

      if (!activeObstacle) return;

      const expectedChar = activeObstacle.word[typedBuffer.length]?.toLowerCase();
      if (char === expectedChar) {
        setCorrectStrokes((s) => s + 1);
        playArcadeSound('blaster', soundEnabled);
        const nextBuf = typedBuffer + char;
        setTypedBuffer(nextBuf);

        // Word completed! Trigger JUMP over obstacle!
        if (nextBuf.length === activeObstacle.word.length) {
          playArcadeSound('jump', soundEnabled);
          setIsJumping(true);
          setJumpProgress(0);

          const pts = activeObstacle.word.length * 20;
          setScore((sc) => sc + pts);
          setObstaclesCleared((oc) => oc + 1);

          // Clear obstacle and schedule next
          setActiveObstacle(spawnNextObstacle(distance + 15));
          setTypedBuffer('');
        }
      } else {
        // Typing mistake while running
        playArcadeSound('damage', soundEnabled);
      }
    }
  };

  const accuracy = calculateAccuracy(correctStrokes, totalStrokes);
  const distanceToObstacle = activeObstacle
    ? Math.max(0, Math.round(activeObstacle.targetDistance - distance))
    : 0;

  // Jump arc calculation: 0 -> 1 -> 0 height
  const jumpHeight = isJumping ? Math.sin(jumpProgress * Math.PI) * 75 : 0;

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
        aria-label="Word Runner typing input"
      />

      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="xs" icon={ArrowLeft} onClick={onExit}>
            Arcade Hub
          </Button>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Footprints className="w-5 h-5 text-purple-400" />
              Word Runner
            </h2>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              Side-Scrolling Cyber Parkour • Type to Leap Hurdles
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

      {/* HUD Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 bg-[var(--bg-elevated)] p-3 rounded-xl border border-[var(--border)] text-xs font-mono">
        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)] block">Distance</span>
          <span className="text-base font-bold text-purple-400">
            {Math.round(distance)}m <span className="text-[10px] text-[var(--text-muted)]">/ 1,000m</span>
          </span>
        </div>

        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)] block">Shields</span>
          <div className="flex items-center gap-1 mt-0.5">
            {[...Array(3)].map((_, i) => (
              <Shield
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < lives ? 'text-purple-400 fill-purple-400/30' : 'text-neutral-600'
                }`}
              />
            ))}
          </div>
        </div>

        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)] block">Score</span>
          <span className="text-base font-bold text-[var(--text-primary)]">{score}</span>
        </div>

        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)] block">Obstacles Cleared</span>
          <span className="text-base font-bold text-emerald-400">{obstaclesCleared}</span>
        </div>

        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)] block">Accuracy</span>
          <span className="text-base font-bold text-[var(--ui-success)]">{accuracy}%</span>
        </div>

        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)] block">Approaching In</span>
          <span className="text-base font-bold text-amber-400">{distanceToObstacle}m</span>
        </div>
      </div>

      {/* Parkour Track Arena */}
      <div className="relative w-full rounded-xl border border-[var(--border)] bg-[#070913] overflow-hidden shadow-inner h-[280px] flex flex-col justify-end">
        {/* Parallax Cyber City Skyline Background */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to top, rgba(168,85,247,0.3) 0%, transparent 60%)',
          }}
        />

        {/* Distance Progress Bar at Top */}
        <div className="absolute top-3 left-4 right-4 z-20">
          <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)] mb-1">
            <span>START (0m)</span>
            <span>CYBER FREEWAY TRACK</span>
            <span>FINISH LINE (1000m)</span>
          </div>
          <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden border border-neutral-700">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-75"
              style={{ width: `${(distance / TRACK_LENGTH) * 100}%` }}
            />
          </div>
        </div>

        {/* The Animated Ground / Neon Track */}
        <div className="relative w-full h-16 border-t-2 border-purple-500 bg-purple-950/30 flex items-center overflow-hidden">
          {/* Moving keyboard keycap stripes on ground */}
          <div
            className="absolute inset-0 opacity-30 flex items-center gap-6"
            style={{
              transform: `translateX(-${(distance * 8) % 40}px)`,
            }}
          >
            {[...Array(30)].map((_, i) => (
              <span key={i} className="w-8 h-8 rounded bg-purple-500/20 border border-purple-500/40 shrink-0" />
            ))}
          </div>
        </div>

        {/* Animated Cybernetic Runner Character */}
        <div
          className="absolute left-16 z-20 transition-all"
          style={{
            bottom: `${64 + jumpHeight}px`,
          }}
        >
          <div className="relative flex flex-col items-center">
            {/* Runner Avatar Icon */}
            <div
              className={`w-11 h-11 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.8)] border border-purple-300 ${
                isJumping ? 'scale-110 rotate-[-15deg]' : 'animate-bounce'
              }`}
            >
              <Footprints className="w-6 h-6" />
            </div>
            {/* Speed motion trail */}
            <div className="w-12 h-1 bg-gradient-to-r from-transparent to-purple-400 rounded-full blur-[1px] mt-1" />
          </div>
        </div>

        {/* Upcoming Obstacle with Target Word */}
        {activeObstacle && (
          <div
            className="absolute z-20 flex flex-col items-center"
            style={{
              bottom: '64px',
              left: `${Math.min(650, 150 + distanceToObstacle * 10)}px`,
              transition: 'left 50ms linear',
            }}
          >
            {/* Target Word Floating Pill */}
            <div className="px-3 py-1 rounded-lg bg-[var(--bg-elevated)] border-2 border-purple-500 font-mono text-xs font-black shadow-lg mb-2 text-white ring-2 ring-purple-500/40">
              <span className="text-emerald-400 bg-emerald-950/60 rounded px-0.5">
                {activeObstacle.word.slice(0, typedBuffer.length)}
              </span>
              <span>{activeObstacle.word.slice(typedBuffer.length)}</span>
            </div>

            {/* Obstacle Physical Barrier */}
            <div className="w-8 h-14 rounded-t-md bg-rose-600/90 border-2 border-rose-400 flex items-center justify-center text-white text-[10px] font-bold shadow-[0_0_12px_rgba(244,63,94,0.6)]">
              <AlertTriangle className="w-4 h-4 text-white animate-pulse" />
            </div>
          </div>
        )}

        {/* Overlay States */}
        {gameState === 'ready' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xs z-30 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] text-purple-400 flex items-center justify-center shadow-lg">
              <Footprints className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-xl font-bold text-[var(--text-primary)]">Word Runner Parkour</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Sprint across the 1,000m cyber freeway. Type each upcoming obstacle's word to execute a high-speed leap over barriers.
              </p>
            </div>
            <Button variant="primary" size="lg" icon={Play} onClick={startCountdown}>
              Start 1,000m Run
            </Button>
          </div>
        )}

        {gameState === 'countdown' && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xs z-30 flex items-center justify-center">
            <span className="text-6xl font-black font-mono text-purple-400 animate-pulse">
              {countdown}
            </span>
          </div>
        )}

        {gameState === 'paused' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xs z-30 flex flex-col items-center justify-center space-y-4">
            <h3 className="text-xl font-bold text-[var(--text-primary)]">Parkour Paused</h3>
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
              <h3 className="text-2xl font-black text-[var(--text-primary)]">Runner Stumbled!</h3>
              <p className="text-xs text-[var(--text-secondary)]">Shields exhausted after 3 hurdle collisions.</p>
            </div>

            {personalBestNotice && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold">
                <Trophy className="w-3.5 h-3.5" /> NEW DISTANCE RECORD!
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 bg-[var(--bg-elevated)] p-4 rounded-xl border border-[var(--border)] text-xs font-mono w-full max-w-sm">
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Distance Covered</span>
                <span className="text-lg font-bold text-purple-400">{Math.round(distance)}m</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Hurdles Cleared</span>
                <span className="text-lg font-bold text-emerald-400">{obstaclesCleared}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Total Score</span>
                <span className="text-lg font-bold text-[var(--accent)]">{score}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button variant="primary" size="md" icon={RotateCcw} onClick={startCountdown}>
                Run Again
              </Button>
              <Button variant="outline" size="md" onClick={onExit}>
                Back to Arcade
              </Button>
            </div>
          </div>
        )}

        {gameState === 'victory' && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Trophy className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-emerald-400">1,000m FINISH LINE CROSSED!</h3>
              <p className="text-xs text-[var(--text-secondary)]">You conquered the complete cyber parkour track!</p>
            </div>

            <div className="grid grid-cols-3 gap-3 bg-[var(--bg-elevated)] p-4 rounded-xl border border-[var(--border)] text-xs font-mono w-full max-w-sm">
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Final Score</span>
                <span className="text-lg font-bold text-[var(--accent)]">{score + 500}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Accuracy</span>
                <span className="text-lg font-bold text-[var(--ui-success)]">{accuracy}%</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Hurdles Cleared</span>
                <span className="text-lg font-bold text-emerald-400">{obstaclesCleared}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button variant="primary" size="md" icon={RotateCcw} onClick={startCountdown}>
                Run Again
              </Button>
              <Button variant="outline" size="md" onClick={onExit}>
                Back to Arcade
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between text-xs text-[var(--text-muted)] font-mono px-1">
        <span>Type word to jump obstacle before collision</span>
        <span>Stumbles: {stumbles} • Personal Best: {personalBest?.maxDistance || 0}m</span>
      </div>
    </div>
  );
};
