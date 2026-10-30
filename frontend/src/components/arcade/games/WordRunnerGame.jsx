import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Footprints,
  RotateCcw,
  Play,
  Pause,
  ArrowLeft,
  Trophy,
  Shield,
  Flame,
  Zap,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../common/Button';
import { calculateAccuracy } from '../../../utils/arcadeEngine';
import { saveArcadeRecord, getGameRecord } from '../../../utils/arcadeStorage';
import { calculateDifficultyTier, getWordRunnerConfig } from '../../../utils/arcadeDifficulty';
import { ArcadeWordDeck, getVocabularyPool } from '../../../utils/arcadeVocabulary';
import { ArcadeExitDialog } from '../ArcadeExitDialog';
import { useI18n } from '../../../i18n/I18nContext';

import { Runner3DScene } from '../runner3d/Runner3DScene';
import { Runner3DPlayer } from '../runner3d/Runner3DPlayer';
import { Runner3DTrack } from '../runner3d/Runner3DTrack';
import { Runner3DObstacles } from '../runner3d/Runner3DObstacles';
import { runnerAudio } from '../runner3d/Runner3DAudio';

const TRACK_LENGTH = 1000; // 1,000 meters to victory

export const WordRunnerGame = ({ onExit, soundEnabled = true }) => {
  const { t } = useI18n();
  const [gameState, setGameState] = useState('ready'); // ready, countdown, playing, paused, gameover, victory
  const [countdown, setCountdown] = useState(3);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Gameplay Metrics
  const [distance, setDistance] = useState(0); // 0 to 1,000m
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [obstaclesCleared, setObstaclesCleared] = useState(0);
  const [stumbles, setStumbles] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [totalStrokes, setTotalStrokes] = useState(0);
  const [correctStrokes, setCorrectStrokes] = useState(0);
  const [personalBestNotice, setPersonalBestNotice] = useState(false);

  // Active Target Obstacle HUD state
  const [activeObstacle, setActiveObstacle] = useState(null); // { id, word, type, typedCount }

  // Audio mute sync
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;
  useEffect(() => {
    runnerAudio.setMuted(!soundEnabled);
  }, [soundEnabled]);

  // Mount & Engine Refs
  const mountRef = useRef(null);
  const inputRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const nextSpawnDistanceRef = useRef(30);

  const personalBest = getGameRecord('runner');

  // Word deck
  const wordDeckRef = useRef(
    new ArcadeWordDeck({ gameId: 'runner', pool: getVocabularyPool('runner', 1) })
  );

  // Dynamic progressive difficulty
  const difficultyInfo = useMemo(() => {
    return calculateDifficultyTier({
      activeSeconds: elapsedSeconds,
      completedCount: obstaclesCleared,
      score,
      currentStreak: combo,
      errorCount: stumbles,
      mode: 'runner',
    });
  }, [elapsedSeconds, obstaclesCleared, score, combo, stumbles]);

  const runnerConfig = useMemo(() => {
    return getWordRunnerConfig(difficultyInfo.tier, distance);
  }, [difficultyInfo.tier, distance]);

  // Three.js Engine Lifecycle Container Ref
  const threeRef = useRef({
    scene: null,
    player: null,
    track: null,
    obstacles: null,
    typedBuffer: '',
    playerZ: 0,
    speed: 16.0,
    animId: null,
  });

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  // Focus invisible input
  const focusInput = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
    }
  }, []);

  // Countdown timer
  const startCountdown = useCallback(() => {
    runnerAudio.init();
    setGameState('countdown');
    setCountdown(3);
  }, []);

  useEffect(() => {
    if (countdown > 0 && gameState === 'countdown') {
      const timer = setTimeout(() => {
        setCountdown((c) => c - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && gameState === 'countdown') {
      setGameState('playing');
      focusInput();
    }
  }, [countdown, gameState, focusInput]);

  // Elapsed game timer
  useEffect(() => {
    if (gameState === 'playing') {
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [gameState]);

  // Reset Game
  const resetGame = useCallback(() => {
    setGameState('ready');
    setDistance(0);
    setLives(3);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setObstaclesCleared(0);
    setStumbles(0);
    setElapsedSeconds(0);
    setTotalStrokes(0);
    setCorrectStrokes(0);
    setActiveObstacle(null);
    setPersonalBestNotice(false);
    nextSpawnDistanceRef.current = 30;

    if (threeRef.current.player) {
      threeRef.current.playerZ = 0;
      threeRef.current.player.group.position.set(0, 0, 0);
      threeRef.current.player.lane = 0;
      threeRef.current.player.currentLaneX = 0;
      threeRef.current.player.state = 'running';
    }
    if (threeRef.current.obstacles) {
      threeRef.current.obstacles.dispose();
    }
    threeRef.current.typedBuffer = '';
  }, []);

  // Handle Game Over or Victory Records
  useEffect(() => {
    if (gameState === 'gameover' || gameState === 'victory') {
      const accuracy = calculateAccuracy(correctStrokes, totalStrokes);
      const isWinner = gameState === 'victory';
      const result = saveArcadeRecord('runner', {
        maxDistance: Math.round(distance),
        score,
        accuracy,
        obstaclesCleared,
        stumbles,
        durationSeconds: elapsedSeconds,
        tier: difficultyInfo.tier,
        isVictory: isWinner,
      });

      if (result.isNewBest) {
        setPersonalBestNotice(true);
      }
    }
  }, [gameState, distance, score, correctStrokes, totalStrokes, obstaclesCleared, stumbles, elapsedSeconds, difficultyInfo.tier]);

  // =========================================================================
  // 3D WEBGL ENGINE INITIALIZATION & 60 FPS RENDER LOOP
  // =========================================================================
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new Runner3DScene(container);
    const track = new Runner3DTrack(scene.scene);
    const player = new Runner3DPlayer();
    const obstacles = new Runner3DObstacles(scene.scene);

    scene.scene.add(player.group);

    threeRef.current.scene = scene;
    threeRef.current.track = track;
    threeRef.current.player = player;
    threeRef.current.obstacles = obstacles;
    threeRef.current.playerZ = 0;
    threeRef.current.speed = 16.0;
    threeRef.current.typedBuffer = '';

    let lastTime = performance.now();

    const loop = (time) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      const isPlaying = gameStateRef.current === 'playing';

      if (isPlaying) {
        // Forward progression
        const speed = 15.0 + Math.min(12.0, (threeRef.current.playerZ / 100) * 1.5);
        player.speed = speed;
        threeRef.current.playerZ += speed * dt;
        player.group.position.z = threeRef.current.playerZ;

        setDistance(Math.min(TRACK_LENGTH, threeRef.current.playerZ));

        // Victory condition: 1,000 meters reached!
        if (threeRef.current.playerZ >= TRACK_LENGTH) {
          setGameState('victory');
        }

        // 1. Procedural Obstacle Spawning ahead of runner
        if (threeRef.current.playerZ + 55 > nextSpawnDistanceRef.current) {
          const spawnZ = nextSpawnDistanceRef.current;
          const types = ['jump', 'slide', 'hack', 'crystal'];
          const type = types[Math.floor(Math.random() * types.length)];
          const lane = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1

          const word = wordDeckRef.current.draw();
          obstacles.spawnObstacle({
            word,
            type,
            lane,
            z: spawnZ,
          });

          // Next obstacle spacing
          const spacing = Math.max(22, 38 - Math.floor(threeRef.current.playerZ / 120) * 3);
          nextSpawnDistanceRef.current += spacing;
        }

        // 2. Active Approaching Obstacle Detection & Collision Check
        const upcoming = obstacles.obstacles.filter((o) => !o.cleared && o.z > threeRef.current.playerZ - 2);
        upcoming.sort((a, b) => a.z - b.z);
        const activeObs = upcoming[0] || null;

        if (activeObs) {
          setActiveObstacle({
            id: activeObs.id,
            word: activeObs.word,
            type: activeObs.type,
            typedCount: activeObs.typedCount,
          });

          // Proximity collision detection (within 1.2 meters)
          const distToObs = activeObs.z - threeRef.current.playerZ;
          if (distToObs <= 1.2 && distToObs >= -0.8 && !activeObs.hit && !activeObs.cleared) {
            // Check if player took required move or is in matching lane
            const isSameLane = activeObs.lane === player.lane;
            const isSafeJump = activeObs.type === 'jump' && player.state === 'jumping';
            const isSafeSlide = activeObs.type === 'slide' && player.state === 'sliding';
            const isCrystal = activeObs.type === 'crystal';

            if (isCrystal) {
              // Collected bonus crystal!
              activeObs.cleared = true;
              obstacles.clearObstacle(activeObs);
              runnerAudio.playCrystal();
              setScore((s) => s + 350);
              setCombo((c) => c + 1);
            } else if (!isSameLane || isSafeJump || isSafeSlide) {
              // Dodged or vaulted safely!
              activeObs.cleared = true;
              obstacles.clearObstacle(activeObs);
              setObstaclesCleared((c) => c + 1);
              setScore((s) => s + 200);
            } else {
              // Collision impact!
              activeObs.hit = true;
              activeObs.cleared = true;
              obstacles.clearObstacle(activeObs);

              player.stumble();
              scene.triggerShake(0.5);
              runnerAudio.playStumble();

              setStumbles((s) => s + 1);
              setCombo(0);
              threeRef.current.typedBuffer = '';

              setLives((prev) => {
                const next = Math.max(0, prev - 1);
                if (next <= 0) {
                  setGameState('gameover');
                }
                return next;
              });
            }
          }
        } else {
          setActiveObstacle(null);
        }

        // 3. Update 3D Track & Obstacles
        track.update(threeRef.current.playerZ);
        obstacles.update(threeRef.current.playerZ, dt);
        player.update(dt);
        scene.updateCamera(player.group.position, dt);
      }

      scene.render();
      threeRef.current.animId = requestAnimationFrame(loop);
    };

    threeRef.current.animId = requestAnimationFrame(loop);

    const handleResize = () => {
      scene.handleResize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(threeRef.current.animId);
      scene.dispose();
      track.dispose();
      player.dispose();
      obstacles.dispose();
    };
  }, []);

  // Keyboard typing handler
  const handleKeyDown = useCallback(
    (e) => {
      if (showExitConfirm) {
        if (e.key === 'Escape') setShowExitConfirm(false);
        return;
      }

      if (e.key === 'Escape') {
        if (gameState === 'playing') setGameState('paused');
        else if (gameState === 'paused') setGameState('playing');
        return;
      }

      if (gameState === 'ready' || gameState === 'gameover' || gameState === 'victory') {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          startCountdown();
          return;
        }
      }

      if (gameState !== 'playing') return;

      const player = threeRef.current.player;
      const obstacles = threeRef.current.obstacles;
      if (!player || !obstacles) return;

      // 1. Lane Switch Navigation (ArrowLeft / ArrowRight / A / D)
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        player.lane = Math.max(-1, player.lane - 1);
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        player.lane = Math.min(1, player.lane + 1);
        return;
      }

      // 2. Typing characters toward active approaching obstacle
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        const char = e.key.toLowerCase();
        setTotalStrokes((s) => s + 1);

        // Find closest approaching active obstacle
        const upcoming = obstacles.obstacles.filter((o) => !o.cleared && o.z > threeRef.current.playerZ - 2);
        upcoming.sort((a, b) => a.z - b.z);
        const targetObs = upcoming[0];

        if (!targetObs) return;

        const currentBuf = threeRef.current.typedBuffer || '';
        const expectedChar = targetObs.word[currentBuf.length]?.toLowerCase();

        if (char === expectedChar) {
          setCorrectStrokes((s) => s + 1);
          runnerAudio.playKeystroke();

          const nextBuf = currentBuf + char;
          threeRef.current.typedBuffer = nextBuf;
          obstacles.setTypedCount(targetObs, nextBuf.length);

          setActiveObstacle({
            id: targetObs.id,
            word: targetObs.word,
            type: targetObs.type,
            typedCount: nextBuf.length,
          });

          // Word completely typed! Trigger corresponding 3D acrobatic action
          if (nextBuf.length === targetObs.word.length) {
            threeRef.current.typedBuffer = '';
            targetObs.cleared = true;
            obstacles.clearObstacle(targetObs);

            // Execute parkour move
            if (targetObs.type === 'jump') {
              player.jump();
              runnerAudio.playJump();
            } else if (targetObs.type === 'slide') {
              player.slide();
              runnerAudio.playSlide();
            } else if (targetObs.type === 'hack') {
              player.hack();
              runnerAudio.playBreach();
            } else {
              runnerAudio.playCrystal();
            }

            setObstaclesCleared((c) => c + 1);
            setCombo((c) => {
              const next = c + 1;
              setMaxCombo((mc) => Math.max(mc, next));
              return next;
            });
            setScore((s) => s + 250 + combo * 25);
          }
        } else {
          // Typo: reset current word buffer and break combo
          threeRef.current.typedBuffer = '';
          obstacles.setTypedCount(targetObs, 0);
          setCombo(0);
        }
      }
    },
    [gameState, showExitConfirm, startCountdown, combo]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const accuracy = calculateAccuracy(correctStrokes, totalStrokes);

  return (
    <div
      className="relative min-h-[580px] w-full rounded-2xl bg-neutral-950 border border-[var(--border)] overflow-hidden flex flex-col justify-between select-none shadow-2xl"
      onClick={focusInput}
    >
      <input
        ref={inputRef}
        type="text"
        className="opacity-0 absolute pointer-events-none"
        aria-hidden="true"
      />

      {/* 3D WebGL Canvas Viewport */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-pointer" />

      {/* TOP HUD: Progress, Lives, Combo, Score */}
      <div className="relative z-10 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
        {/* Left: Distance & Shields */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-xs font-mono font-bold text-white shadow-lg">
            <Footprints className="w-4 h-4 text-purple-400" />
            <span>{Math.round(distance)}m / {TRACK_LENGTH}m</span>
          </div>

          <div className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <Shield
                key={i}
                className={`w-5 h-5 transition-all ${
                  i < lives
                    ? 'text-cyan-400 fill-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                    : 'text-neutral-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Center: Live Action Indicator */}
        {activeObstacle && (
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-xs font-mono text-white shadow-lg">
            <span className="text-[10px] text-neutral-400 uppercase">Incoming:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded-md ${
                activeObstacle.type === 'jump'
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                  : activeObstacle.type === 'slide'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : activeObstacle.type === 'hack'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              }`}
            >
              {activeObstacle.type.toUpperCase()}
            </span>
          </div>
        )}

        {/* Right: Score & Exit */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-xs font-mono font-bold text-white shadow-lg">
            <span className="text-amber-400 mr-1.5">★</span>
            <span>{score.toLocaleString()}</span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowExitConfirm(true);
            }}
            className="p-2 rounded-xl bg-black/60 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-white/10 transition-colors pointer-events-auto cursor-pointer"
            title="Exit Game"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* BOTTOM HUD: Typing Target Stream & Word Input Bar */}
      <div className="relative z-10 p-4 sm:p-6 flex flex-col items-center justify-end space-y-3 bg-gradient-to-t from-black/85 via-black/45 to-transparent pointer-events-none">
        {/* Active Target Word Floating Display */}
        {activeObstacle ? (
          <div className="flex flex-col items-center space-y-1.5">
            <div className="px-5 py-2.5 rounded-2xl bg-black/85 backdrop-blur-md border border-purple-500/40 shadow-2xl flex items-center gap-3">
              <span className="text-xs font-mono uppercase tracking-wider text-purple-300">
                Type To {activeObstacle.type}:
              </span>
              <div className="font-mono text-xl sm:text-2xl font-black tracking-widest">
                <span className="text-emerald-400">
                  {activeObstacle.word.slice(0, activeObstacle.typedCount)}
                </span>
                <span className="text-amber-300 underline decoration-2">
                  {activeObstacle.word[activeObstacle.typedCount] || ''}
                </span>
                <span className="text-neutral-400">
                  {activeObstacle.word.slice(activeObstacle.typedCount + 1)}
                </span>
              </div>
            </div>
            <div className="text-[11px] font-mono text-neutral-400 flex items-center gap-3">
              <span>Lane: <strong className="text-white">A/D or Arrows</strong></span>
              <span>•</span>
              <span>Combo: <strong className="text-amber-400">{combo}x</strong></span>
            </div>
          </div>
        ) : (
          <div className="px-4 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-xs font-mono text-neutral-400">
            Scanning neon highway for upcoming cyber barriers...
          </div>
        )}
      </div>

      {/* READY SCREEN */}
      {gameState === 'ready' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md p-6 text-center space-y-5 animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-xl">
            <Footprints className="w-8 h-8" />
          </div>

          <div className="space-y-1 max-w-md">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              WORD RUNNER 3D
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              Sprint across the neon cyber highway. Type action words floating above obstacles to leap barriers, duck under laser grids, and breach firewalls!
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left font-mono text-[11px] max-w-lg w-full">
            <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-white/10">
              <span className="text-sky-400 font-bold block">JUMP</span>
              <span className="text-neutral-400">Low electric hurdle</span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-white/10">
              <span className="text-amber-400 font-bold block">SLIDE</span>
              <span className="text-neutral-400">High laser grid</span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-white/10">
              <span className="text-rose-400 font-bold block">HACK</span>
              <span className="text-neutral-400">Firewall gate</span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-white/10">
              <span className="text-emerald-400 font-bold block">BOOST</span>
              <span className="text-neutral-400">Energy crystal</span>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            icon={Play}
            onClick={startCountdown}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 shadow-xl"
          >
            Start Cyber Sprint
          </Button>
        </div>
      )}

      {/* COUNTDOWN OVERLAY */}
      {gameState === 'countdown' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-xs">
          <span className="text-7xl sm:text-8xl font-black font-mono text-purple-400 animate-ping">
            {countdown}
          </span>
        </div>
      )}

      {/* PAUSE OVERLAY */}
      {gameState === 'paused' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md p-6 space-y-4">
          <h3 className="text-2xl font-bold text-white">Sprint Paused</h3>
          <div className="flex gap-3">
            <Button variant="primary" size="md" icon={Play} onClick={() => setGameState('playing')}>
              Resume
            </Button>
            <Button variant="outline" size="md" icon={RotateCcw} onClick={resetGame}>
              Restart
            </Button>
            <Button variant="outline" size="md" icon={ArrowLeft} onClick={onExit}>
              Exit
            </Button>
          </div>
        </div>
      )}

      {/* GAME OVER & VICTORY OVERLAY */}
      {(gameState === 'gameover' || gameState === 'victory') && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-6 text-center space-y-5 animate-in zoom-in-95 duration-200">
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">
              {gameState === 'victory' ? 'VICTORY • 1,000M COMPLETED' : 'CIRCUIT OVER • SHIELDS DEPLETED'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              {gameState === 'victory' ? 'Neon Champion!' : 'Sprint Concluded'}
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto font-mono text-center w-full">
            <div className="p-3 rounded-xl bg-neutral-900 border border-white/10">
              <span className="text-[10px] text-neutral-400 uppercase block">Distance</span>
              <span className="text-2xl font-extrabold text-purple-400">{Math.round(distance)}m</span>
            </div>
            <div className="p-3 rounded-xl bg-neutral-900 border border-white/10">
              <span className="text-[10px] text-neutral-400 uppercase block">Score</span>
              <span className="text-2xl font-extrabold text-amber-400">{score.toLocaleString()}</span>
            </div>
            <div className="p-3 rounded-xl bg-neutral-900 border border-white/10">
              <span className="text-[10px] text-neutral-400 uppercase block">Cleared</span>
              <span className="text-2xl font-extrabold text-emerald-400">{obstaclesCleared}</span>
            </div>
            <div className="p-3 rounded-xl bg-neutral-900 border border-white/10">
              <span className="text-[10px] text-neutral-400 uppercase block">Accuracy</span>
              <span className="text-2xl font-extrabold text-cyan-400">{accuracy}%</span>
            </div>
          </div>

          {personalBestNotice && (
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono text-xs">
              🏆 New Personal Best Recorded!
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="primary"
              size="md"
              icon={RotateCcw}
              onClick={resetGame}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
            >
              Play Again
            </Button>
            <Button variant="outline" size="md" icon={ArrowLeft} onClick={onExit}>
              Exit to Arcade
            </Button>
          </div>
        </div>
      )}

      {/* Exit confirmation dialog */}
      <ArcadeExitDialog
        isOpen={showExitConfirm}
        onCancel={() => setShowExitConfirm(false)}
        onConfirm={() => {
          setShowExitConfirm(false);
          onExit();
        }}
      />
    </div>
  );
};

export default WordRunnerGame;
