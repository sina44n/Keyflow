import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Shield, Flame, RotateCcw, Play, Pause, ArrowLeft, Trophy, Zap, Crosshair } from 'lucide-react';
import { Button } from '../../common/Button';
import { calculateAccuracy, calculateWpm } from '../../../utils/arcadeEngine';
import { saveArcadeRecord, getGameRecord } from '../../../utils/arcadeStorage';
import { calculateDifficultyTier, getKeyCascadeConfig } from '../../../utils/arcadeDifficulty';
import { ArcadeWordDeck, getVocabularyPool } from '../../../utils/arcadeVocabulary';
import { ArcadeExitDialog } from '../ArcadeExitDialog';
import { useI18n } from '../../../i18n/I18nContext';

import { Meteor3DScene } from '../cascade3d/Meteor3DScene';
import { Meteor3DObject } from '../cascade3d/Meteor3DObject';
import { meteorAudio } from '../cascade3d/Meteor3DAudio';

const INITIAL_LIVES = 3;

export const KeyCascadeGame = ({ onExit, soundEnabled = true }) => {
  const { t } = useI18n();
  const [gameState, setGameState] = useState('ready'); // ready, countdown, playing, paused, gameover
  const [countdown, setCountdown] = useState(3);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Gameplay Metrics
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [meteorsEliminated, setMeteorsEliminated] = useState(0);
  const [missedMeteors, setMissedMeteors] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [totalStrokes, setTotalStrokes] = useState(0);
  const [correctStrokes, setCorrectStrokes] = useState(0);
  const [personalBestNotice, setPersonalBestNotice] = useState(false);
  const [wave, setWave] = useState(1);

  // Active Target HUD state
  const [activeTarget, setActiveTarget] = useState(null); // { id, text, typedCount }

  // Sound sync
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;
  useEffect(() => {
    meteorAudio.setMuted(!soundEnabled);
  }, [soundEnabled]);

  // Mount & Engine Refs
  const mountRef = useRef(null);
  const inputRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const nextIdRef = useRef(1);
  const lastSpawnTimeRef = useRef(0);

  const personalBest = getGameRecord('cascade');

  // Word Deck
  const wordDeckRef = useRef(
    new ArcadeWordDeck({ gameId: 'cascade', pool: getVocabularyPool('cascade', 1) })
  );

  // Progressive Difficulty Tier
  const difficultyInfo = useMemo(() => {
    return calculateDifficultyTier({
      activeSeconds: elapsedSeconds,
      completedCount: meteorsEliminated,
      score,
      wave,
      currentStreak: combo,
      errorCount: missedMeteors,
      mode: 'cascade',
    });
  }, [elapsedSeconds, meteorsEliminated, score, wave, combo, missedMeteors]);

  const cascadeConfig = useMemo(() => {
    return getKeyCascadeConfig(difficultyInfo.tier, difficultyInfo.performanceQuotient);
  }, [difficultyInfo.tier, difficultyInfo.performanceQuotient]);

  // Three.js Engine Container Ref
  const threeRef = useRef({
    scene: null,
    meteors: [],
    activeTargetId: null,
    typedBuffer: '',
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
    meteorAudio.init();
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
    setScore(0);
    setLives(INITIAL_LIVES);
    setCombo(0);
    setBestCombo(0);
    setMeteorsEliminated(0);
    setMissedMeteors(0);
    setElapsedSeconds(0);
    setTotalStrokes(0);
    setCorrectStrokes(0);
    setWave(1);
    setActiveTarget(null);
    setPersonalBestNotice(false);

    if (threeRef.current.scene) {
      for (const m of threeRef.current.meteors) {
        threeRef.current.scene.scene.remove(m.group);
        m.dispose();
      }
      threeRef.current.meteors = [];
      threeRef.current.activeTargetId = null;
      threeRef.current.typedBuffer = '';
    }
  }, []);

  // Handle Game Over
  useEffect(() => {
    if (gameState === 'gameover') {
      const accuracy = calculateAccuracy(correctStrokes, totalStrokes);
      const result = saveArcadeRecord('cascade', {
        bestScore: score,
        score,
        accuracy,
        wordsEliminated: meteorsEliminated,
        durationSeconds: elapsedSeconds,
        tier: difficultyInfo.tier,
      });

      if (result.isNewBest) {
        setPersonalBestNotice(true);
      }
    }
  }, [gameState, score, correctStrokes, totalStrokes, meteorsEliminated, elapsedSeconds, difficultyInfo.tier]);

  // =========================================================================
  // 3D WEBGL ENGINE INITIALIZATION & 60 FPS RENDER LOOP
  // =========================================================================
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new Meteor3DScene(container);
    threeRef.current.scene = scene;
    threeRef.current.meteors = [];
    threeRef.current.activeTargetId = null;
    threeRef.current.typedBuffer = '';

    let lastTime = performance.now();

    const loop = (time) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      const isPlaying = gameStateRef.current === 'playing';

      if (isPlaying) {
        const currentScore = score;
        const currentWave = Math.min(8, Math.floor(currentScore / 500) + 1);
        setWave(currentWave);

        // 1. Procedural Meteor Spawning
        const spawnIntervalMs = Math.max(1400, 3200 - currentWave * 220);
        if (time - lastSpawnTimeRef.current > spawnIntervalMs) {
          lastSpawnTimeRef.current = time;

          const activeUncut = threeRef.current.meteors.filter((m) => !m.isDestroyed);
          const maxSimultaneous = Math.min(5, 2 + Math.floor(currentWave / 2));

          if (activeUncut.length < maxSimultaneous) {
            const drawnText = wordDeckRef.current.draw(activeUncut.map((m) => m.text));
            const startX = (Math.random() - 0.5) * 16.0;
            const startY = 11.5 + Math.random() * 2.5;
            const speed = 2.2 + currentWave * 0.35 + Math.random() * 0.4;
            const isArmored = currentWave >= 3 && Math.random() > 0.65;

            const meteor = new Meteor3DObject({
              id: nextIdRef.current++,
              text: drawnText,
              startX,
              startY,
              speed,
              isArmored,
            });

            scene.scene.add(meteor.group);
            threeRef.current.meteors.push(meteor);
          }
        }

        // 2. Aim Turret at Active Target
        if (threeRef.current.activeTargetId) {
          const target = threeRef.current.meteors.find(
            (m) => m.id === threeRef.current.activeTargetId && !m.isDestroyed
          );
          if (target) {
            scene.aimTurretAt(target.group.position);
          }
        }

        // 3. Update Active Meteors & Collision with Defensive Grid
        const meteors = threeRef.current.meteors;
        let breachCount = 0;

        for (let i = meteors.length - 1; i >= 0; i--) {
          const m = meteors[i];
          m.update(dt);

          if (m.isDead) {
            // Debris dissolved
            scene.scene.remove(m.group);
            m.dispose();
            meteors.splice(i, 1);
          } else if (!m.isDestroyed && m.group.position.y <= -4.2) {
            // Meteor breached defensive energy grid!
            breachCount++;
            scene.triggerShake(0.65);
            meteorAudio.playShieldBreach();

            m.destroyWithExplosion(scene.scene);
            meteors.splice(i, 1);

            if (threeRef.current.activeTargetId === m.id) {
              threeRef.current.activeTargetId = null;
              threeRef.current.typedBuffer = '';
              setActiveTarget(null);
            }
          }
        }

        // 4. Handle Shield Depletion on Breaches
        if (breachCount > 0) {
          setMissedMeteors((prev) => prev + breachCount);
          setCombo(0);
          setLives((prev) => {
            const next = Math.max(0, prev - breachCount);
            if (next <= 0) {
              setGameState('gameover');
            }
            return next;
          });
        }
      }

      scene.update(dt);
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
    };
  }, []);

  // =========================================================================
  // TYPING ENGINE INPUT CONTROLS
  // =========================================================================
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

      if (gameState === 'ready' || gameState === 'gameover') {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          startCountdown();
          return;
        }
      }

      if (gameState !== 'playing') return;

      const scene = threeRef.current.scene;
      const meteors = threeRef.current.meteors || [];

      // Backspace: erase last character or release lock-on
      if (e.key === 'Backspace') {
        e.preventDefault();
        const activeId = threeRef.current.activeTargetId;
        if (activeId) {
          const target = meteors.find((m) => m.id === activeId);
          const currentBuf = threeRef.current.typedBuffer || '';

          if (currentBuf.length > 1) {
            const nextBuf = currentBuf.slice(0, -1);
            threeRef.current.typedBuffer = nextBuf;
            if (target) {
              target.setTypedProgress(nextBuf.length, true);
              setActiveTarget({ id: target.id, text: target.text, typedCount: nextBuf.length });
            }
          } else {
            // Release lock-on
            threeRef.current.typedBuffer = '';
            threeRef.current.activeTargetId = null;
            if (target) target.setTypedProgress(0, false);
            setActiveTarget(null);
          }
        }
        return;
      }

      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      e.preventDefault();
      const char = e.key.toLowerCase();
      setTotalStrokes((s) => s + 1);

      const activeId = threeRef.current.activeTargetId;
      const currentBuf = threeRef.current.typedBuffer || '';

      // 1. If currently locked onto a meteor
      if (activeId) {
        const target = meteors.find((m) => m.id === activeId && !m.isDestroyed);
        if (target) {
          const expectedChar = target.text[currentBuf.length]?.toLowerCase();

          if (char === expectedChar) {
            setCorrectStrokes((s) => s + 1);
            meteorAudio.playKeystroke();

            const nextBuf = currentBuf + char;
            threeRef.current.typedBuffer = nextBuf;
            target.setTypedProgress(nextBuf.length, true);

            setActiveTarget({ id: target.id, text: target.text, typedCount: nextBuf.length });

            // Meteor Completely Typed! FIRE DEFENSE LASER CANNON
            if (nextBuf.length === target.text.length) {
              scene.fireLaserAt(target.group.position);
              meteorAudio.playLaserBlast();
              meteorAudio.playMeteorExplosion();

              target.destroyWithExplosion(scene.scene);
              threeRef.current.activeTargetId = null;
              threeRef.current.typedBuffer = '';
              setActiveTarget(null);

              setMeteorsEliminated((c) => c + 1);
              setCombo((c) => {
                const next = c + 1;
                setBestCombo((bc) => Math.max(bc, next));
                return next;
              });
              setScore((s) => s + 250 + combo * 30);
            }
          } else {
            // Typo: break combo streak
            setCombo(0);
          }
          return;
        }
      }

      // 2. Lock onto an airborne meteor whose starting letter matches
      const activeUncut = meteors.filter((m) => !m.isDestroyed);
      // Sort by altitude (lowest Y first = most urgent threat)
      activeUncut.sort((a, b) => a.group.position.y - b.group.position.y);

      const candidate = activeUncut.find((m) => m.text.toLowerCase().startsWith(char));

      if (candidate) {
        setCorrectStrokes((s) => s + 1);
        meteorAudio.playLockOn();

        threeRef.current.activeTargetId = candidate.id;
        const nextBuf = char;
        threeRef.current.typedBuffer = nextBuf;
        candidate.setTypedProgress(1, true);

        setActiveTarget({ id: candidate.id, text: candidate.text, typedCount: 1 });
        scene.aimTurretAt(candidate.group.position);

        if (nextBuf.length === candidate.text.length) {
          scene.fireLaserAt(candidate.group.position);
          meteorAudio.playLaserBlast();
          meteorAudio.playMeteorExplosion();

          candidate.destroyWithExplosion(scene.scene);
          threeRef.current.activeTargetId = null;
          threeRef.current.typedBuffer = '';
          setActiveTarget(null);

          setMeteorsEliminated((c) => c + 1);
          setCombo((c) => c + 1);
          setScore((s) => s + 250);
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
  const liveWpm = calculateWpm(correctStrokes, elapsedSeconds);

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

      {/* TOP HUD: Defense Shields, Wave, WPM, Score */}
      <div className="relative z-10 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-none">
        {/* Shields & Wave */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-xs font-mono font-bold text-white shadow-lg">
            <span className="text-cyan-400">WAVE {wave}</span>
            <span className="text-neutral-500">•</span>
            <span className="text-amber-400">DEFENSE GRID</span>
          </div>

          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <Shield
                key={i}
                className={`w-5 h-5 transition-all ${
                  i < lives
                    ? 'text-cyan-400 fill-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.85)]'
                    : 'text-neutral-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Live Typing Speed */}
        <div className="hidden sm:flex items-center gap-3 font-mono text-xs font-bold">
          <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-cyan-400">
            <Zap className="w-3.5 h-3.5" />
            <span>{liveWpm} WPM</span>
          </div>
          <div className="px-3 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-emerald-400">
            <span>{accuracy}% ACC</span>
          </div>
        </div>

        {/* Score & Exit */}
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

      {/* BOTTOM HUD: Defense Turret Targeting Cockpit */}
      <div className="relative z-10 p-4 sm:p-6 flex flex-col items-center justify-end space-y-3 bg-gradient-to-t from-black/90 via-black/55 to-transparent pointer-events-none">
        {activeTarget ? (
          <div className="flex flex-col items-center space-y-1.5 max-w-lg w-full">
            <div className="px-6 py-2.5 rounded-2xl bg-black/85 backdrop-blur-md border border-cyan-500/50 shadow-2xl flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-cyan-400 animate-spin" />
                <span className="text-xs font-mono uppercase tracking-wider text-cyan-300 font-bold">
                  TURRET LOCK:
                </span>
              </div>

              <div className="font-mono text-2xl sm:text-3xl font-black tracking-widest">
                <span className="text-emerald-400">
                  {activeTarget.text.slice(0, activeTarget.typedCount)}
                </span>
                <span className="text-amber-300 underline decoration-4 underline-offset-4 animate-pulse">
                  {activeTarget.text[activeTarget.typedCount] || ''}
                </span>
                <span className="text-neutral-400">
                  {activeTarget.text.slice(activeTarget.typedCount + 1)}
                </span>
              </div>

              <div className="text-xs font-mono text-amber-400 font-bold">
                {combo > 0 ? `${combo}x` : ''}
              </div>
            </div>
            <div className="text-[11px] font-mono text-neutral-400">
              Type full keyword to fire orbital defense laser cannon
            </div>
          </div>
        ) : (
          <div className="px-5 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-xs font-mono text-neutral-400">
            Orbital radar active... Type first letter of any descending meteor to lock cannon!
          </div>
        )}
      </div>

      {/* READY SCREEN */}
      {gameState === 'ready' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-6 text-center space-y-5 animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-xl">
            <Flame className="w-8 h-8" />
          </div>

          <div className="space-y-1 max-w-md">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              3D METEOR DEFENSE
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              Defend your planetary colony against falling plasma meteors. Type the keywords floating above descending asteroids to aim and fire your orbital laser cannon!
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-center font-mono text-[11px] max-w-md w-full">
            <div className="p-2.5 rounded-xl bg-neutral-900/90 border border-white/10">
              <span className="text-cyan-400 font-bold block">LOCK-ON</span>
              <span className="text-neutral-400">Type 1st letter</span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-900/90 border border-white/10">
              <span className="text-amber-400 font-bold block">FIRE CANNON</span>
              <span className="text-neutral-400">Complete word</span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-900/90 border border-white/10">
              <span className="text-emerald-400 font-bold block">ENERGY GRID</span>
              <span className="text-neutral-400">3 Shield lives</span>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            icon={Play}
            onClick={startCountdown}
            className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-8 shadow-xl"
          >
            Activate Defense Grid
          </Button>
        </div>
      )}

      {/* COUNTDOWN OVERLAY */}
      {gameState === 'countdown' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-xs">
          <span className="text-7xl sm:text-8xl font-black font-mono text-cyan-400 animate-ping">
            {countdown}
          </span>
        </div>
      )}

      {/* PAUSE OVERLAY */}
      {gameState === 'paused' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md p-6 space-y-4">
          <h3 className="text-2xl font-bold text-white">Defense Grid Paused</h3>
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

      {/* GAME OVER OVERLAY */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-6 text-center space-y-5 animate-in zoom-in-95 duration-200">
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-rose-400">
              DEFENSE GRID BREACHED • MISSION OVER
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Colony Defended to Wave {wave}
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto font-mono text-center w-full">
            <div className="p-3 rounded-xl bg-neutral-900 border border-white/10">
              <span className="text-[10px] text-neutral-400 uppercase block">Total Score</span>
              <span className="text-2xl font-extrabold text-cyan-400">{score.toLocaleString()}</span>
            </div>
            <div className="p-3 rounded-xl bg-neutral-900 border border-white/10">
              <span className="text-[10px] text-neutral-400 uppercase block">Meteors Destroyed</span>
              <span className="text-2xl font-extrabold text-emerald-400">{meteorsEliminated}</span>
            </div>
            <div className="p-3 rounded-xl bg-neutral-900 border border-white/10">
              <span className="text-[10px] text-neutral-400 uppercase block">Max Combo</span>
              <span className="text-2xl font-extrabold text-amber-400">{bestCombo}x</span>
            </div>
            <div className="p-3 rounded-xl bg-neutral-900 border border-white/10">
              <span className="text-[10px] text-neutral-400 uppercase block">Typing Speed</span>
              <span className="text-2xl font-extrabold text-purple-400">{liveWpm} WPM</span>
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
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold"
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

export default KeyCascadeGame;
