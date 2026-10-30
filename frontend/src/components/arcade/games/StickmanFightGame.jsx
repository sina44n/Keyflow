/**
 * StickmanFightGame.jsx
 * KEYFLOW ARCADE — STICKMAN FIGHT (2D)
 * Authentic 2D Stickman Warrior Combat powered by Continuous Paragraph Typing.
 * Pure HTML5 Canvas 2D engine with forward kinematics skeletal animation,
 * swept blade hitboxes, multi-layer parallax Red Forest, and Web Audio API synthesizer.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Shield,
  Swords,
  RotateCcw,
  Play,
  ArrowLeft,
  Trophy,
  Skull,
  Zap,
  Volume2,
  VolumeX,
  Sparkles,
  Flame,
  CheckCircle,
  Pause,
} from 'lucide-react';
import { Button } from '../../common/Button';
import { ArcadeExitDialog } from '../ArcadeExitDialog';
import { saveArcadeRecord, getGameRecord } from '../../../utils/arcadeStorage';

import { StickmanParagraphManager } from '../stickman2d/StickmanParagraphManager';
import { Stickman2DAudio } from '../stickman2d/Stickman2DAudio';
import { Stickman2DCharacter } from '../stickman2d/Stickman2DCharacter';
import { Stickman2DEnvironment } from '../stickman2d/Stickman2DEnvironment';
import { Stickman2DCombat } from '../stickman2d/Stickman2DCombat';
import { Stickman2DEnemies } from '../stickman2d/Stickman2DEnemies';

export function StickmanFightGame({ onBack, onComplete, initialWave = 1 }) {
  // Game state
  const [gameState, setGameState] = useState('ready'); // 'ready' | 'playing' | 'paused' | 'wave_cleared' | 'game_over' | 'victory'
  const [currentWave, setCurrentWave] = useState(initialWave);
  const [score, setScore] = useState(0);
  const [playerHp, setPlayerHp] = useState(150);
  const [maxPlayerHp, setMaxPlayerHp] = useState(150);
  const [bossHp, setBossHp] = useState(null);
  const [maxBossHp, setMaxBossHp] = useState(null);
  const [enemiesRemaining, setEnemiesRemaining] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  // Typing telemetry state
  const [typingStats, setTypingStats] = useState({
    wpm: 0,
    grossWpm: 0,
    accuracy: 100,
    combo: 0,
    maxCombo: 0,
    flowMultiplier: 1.0,
    progressPercent: 0,
    currentIndex: 0,
    passageLength: 0,
  });

  const [currentPassage, setCurrentPassage] = useState('');
  const [charStatuses, setCharStatuses] = useState([]);

  // Canvas and Engine Refs
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animFrameRef = useRef(null);
  const lastTimeRef = useRef(null);

  // Game Engine Instances
  const audioRef = useRef(null);
  const paragraphMgrRef = useRef(null);
  const envRef = useRef(null);
  const playerRef = useRef(null);
  const combatRef = useRef(null);
  const enemiesRef = useRef(null);

  // Audio initialization
  useEffect(() => {
    const audio = new Stickman2DAudio();
    audio.init();
    audioRef.current = audio;

    return () => {
      audio.dispose();
    };
  }, []);

  // Initialize engine systems
  useEffect(() => {
    const env = new Stickman2DEnvironment(1000, 560);
    envRef.current = env;

    const combat = new Stickman2DCombat();
    combatRef.current = combat;

    const player = new Stickman2DCharacter({
      type: 'player',
      x: 200,
      y: env.groundY,
      facing: 1,
      maxHp: 150,
    });
    playerRef.current = player;
    setPlayerHp(player.hp);
    setMaxPlayerHp(player.maxHp);

    const enemies = new Stickman2DEnemies({
      groundY: env.groundY,
      onEnemyDefeated: () => {
        setScore((prev) => prev + 150);
      },
      onWaveCleared: (wave) => {
        setScore((prev) => prev + wave * 500);
        if (wave >= 5) {
          handleVictory();
        } else {
          setGameState('wave_cleared');
        }
      },
    });
    enemiesRef.current = enemies;

    // Paragraph Manager with combat action hooks
    const paragraphMgr = new StickmanParagraphManager({
      onCorrectChar: (char, isSpace, word, stats) => {
        setTypingStats(stats);
        if (audioRef.current) audioRef.current.playKeypress(true);

        // Player takes a forward martial step
        if (playerRef.current && playerRef.current.isAlive) {
          const nearest = enemiesRef.current?.getNearestLivingEnemy(playerRef.current.x);
          if (nearest) {
            playerRef.current.facing = nearest.x > playerRef.current.x ? 1 : -1;
            playerRef.current.vx = playerRef.current.facing * 140;
          }
        }
      },
      onErrorChar: (typed, expected, stats) => {
        setTypingStats(stats);
        if (audioRef.current) audioRef.current.playKeypress(false);
        // Typo causes brief guard wobble
        if (playerRef.current && playerRef.current.isAlive) {
          playerRef.current.animator.play('hit', 2.0);
        }
      },
      onWordComplete: (word, wordIndex, stats) => {
        setTypingStats(stats);
        triggerAttack('word_complete', stats);
      },
      onPunctuation: (char, stats) => {
        setTypingStats(stats);
        triggerAttack('punctuation', stats);
      },
      onParagraphComplete: (stats) => {
        setTypingStats(stats);
        triggerAttack('blade_storm', stats);

        // Auto stream next paragraph seamlessly without interruption
        setTimeout(() => {
          paragraphMgrRef.current?.loadPassageForWave(currentWave);
          setCurrentPassage(paragraphMgrRef.current?.currentPassage || '');
          setCharStatuses(paragraphMgrRef.current?.charStatuses || []);
        }, 350);
      },
    });

    paragraphMgrRef.current = paragraphMgr;
    setCurrentPassage(paragraphMgr.currentPassage);
    setCharStatuses(paragraphMgr.charStatuses);
  }, []);

  // Attack trigger resolution
  const triggerAttack = useCallback((attackType, stats) => {
    const player = playerRef.current;
    const enemies = enemiesRef.current;
    const combat = combatRef.current;
    const audio = audioRef.current;
    const env = envRef.current;

    if (!player || !player.isAlive || !enemies || !combat) return;

    const nearest = enemies.getNearestLivingEnemy(player.x);
    if (!nearest) return;

    // Orient toward enemy
    player.facing = nearest.x > player.x ? 1 : -1;

    // Calculate attack motion & animation
    const wpm = stats.wpm || 30;
    const animSpeed = Math.min(2.4, Math.max(1.0, wpm / 40));

    if (attackType === 'blade_storm') {
      player.animator.play('bladeStorm', animSpeed);
      if (audio) audio.playBladeStorm();
      if (env) env.addShake(14, 0.4);
    } else if (attackType === 'punctuation') {
      const isCyclone = Math.random() > 0.5;
      player.animator.play(isCyclone ? 'cyclone' : 'slash2', animSpeed);
      if (audio) audio.playSlash(1.2);
      if (env) env.addShake(6, 0.2);
    } else {
      const slashAnims = ['slash1', 'slash2', 'kick', 'flurry'];
      const chosenAnim = slashAnims[Math.floor(Math.random() * slashAnims.length)];
      player.animator.play(chosenAnim, animSpeed);
      if (audio) audio.playSlash(1.0);
    }

    // Dash into range if slightly far
    const dist = Math.abs(nearest.x - player.x);
    if (dist > 75) {
      player.vx = player.facing * 320;
    }

    // Apply combat damage calculation
    const calc = combat.calculateDamage(attackType, stats);
    const hitResult = nearest.takeDamage(calc.damage, calc.isCrit);

    if (hitResult.hit) {
      if (calc.isCrit && audio) audio.playHit(true);
      else if (audio) audio.playHit(false);

      const textType = calc.isFinisher ? 'finisher' : calc.isCrit ? 'crit' : 'normal';
      const label = calc.isFinisher ? `BLADE STORM! ${calc.damage}` : calc.isCrit ? `CRIT! ${calc.damage}` : `${calc.damage}`;
      combat.spawnDamageText(nearest.x, nearest.y - 75, label, textType);
      combat.spawnHitSparks(nearest.x, nearest.y - 50, calc.isCrit, true);

      setScore((prev) => prev + calc.damage * 2);

      if (hitResult.dead) {
        combat.spawnShadowDeathPuff(nearest.x, nearest.y - 40);
        if (audio) audio.playClash();
      }
    }
  }, []);

  // Global keydown typing listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (gameState === 'playing') setGameState('paused');
        else if (gameState === 'paused') setGameState('playing');
        return;
      }

      if (gameState !== 'playing') return;

      // Prevent spacebar or backspace from scrolling/navigating the page
      if (e.key === ' ' || e.key === 'Backspace') {
        e.preventDefault();
      }

      if (paragraphMgrRef.current) {
        const res = paragraphMgrRef.current.handleKeyDown(e);
        if (res) {
          setCharStatuses([...paragraphMgrRef.current.charStatuses]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Main 60 FPS Canvas Game Loop
  useEffect(() => {
    let animationFrameId;

    const render = (time) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = Math.min(0.1, (time - lastTimeRef.current) / 1000);
      lastTimeRef.current = time;

      const canvas = canvasRef.current;
      if (canvas && envRef.current && playerRef.current && enemiesRef.current && combatRef.current) {
        const ctx = canvas.getContext('2d');
        const env = envRef.current;
        const player = playerRef.current;
        const enemies = enemiesRef.current;
        const combat = combatRef.current;
        const audio = audioRef.current;

        // Resize check
        if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
          canvas.width = canvas.clientWidth;
          canvas.height = canvas.clientHeight;
          env.resize(canvas.width, canvas.height);
          player.y = env.groundY;
        }

        // Update physics & entities when playing
        if (gameState === 'playing') {
          player.update(dt);
          enemies.update(dt, player, combat, audio);
          env.update(dt, player.x);
          combat.update(dt);

          // Update HUD states
          setPlayerHp(player.hp);
          setEnemiesRemaining(enemies.getLivingCount());

          if (enemies.boss && enemies.boss.isAlive) {
            setBossHp(enemies.boss.hp);
            setMaxBossHp(enemies.boss.maxHp);
          } else {
            setBossHp(null);
          }

          // Check Player Death
          if (!player.isAlive && player.animator.currentAnim === 'death' && player.animator.animTime >= 0.75) {
            handleGameOver();
          }
        }

        // Render Frame
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        env.render(ctx); // Sky, mountains, trees, ground, spires, embers

        // Render entities transformed by camera
        ctx.save();
        let shakeOffsetX = 0;
        let shakeOffsetY = 0;
        if (env.shakeIntensity > 0) {
          shakeOffsetX = (Math.random() * 2 - 1) * env.shakeIntensity;
          shakeOffsetY = (Math.random() * 2 - 1) * env.shakeIntensity;
        }
        ctx.translate(-env.cameraX + shakeOffsetX, shakeOffsetY);

        enemies.render(ctx);
        player.render(ctx);
        combat.render(ctx);

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState]);

  // Start / Resume Game
  const handleStartGame = () => {
    if (audioRef.current) {
      audioRef.current.resume();
      audioRef.current.startAmbient();
    }
    enemiesRef.current?.startWave(currentWave, playerRef.current?.x || 200);
    paragraphMgrRef.current?.reset(currentWave);
    setCurrentPassage(paragraphMgrRef.current?.currentPassage || '');
    setCharStatuses(paragraphMgrRef.current?.charStatuses || []);
    setGameState('playing');
  };

  // Next Wave
  const handleNextWave = () => {
    const nextWave = currentWave + 1;
    setCurrentWave(nextWave);
    // Restore 35% health between waves
    if (playerRef.current) {
      playerRef.current.hp = Math.min(playerRef.current.maxHp, playerRef.current.hp + 50);
      setPlayerHp(playerRef.current.hp);
    }
    enemiesRef.current?.startWave(nextWave, playerRef.current?.x || 200);
    paragraphMgrRef.current?.loadPassageForWave(nextWave);
    setCurrentPassage(paragraphMgrRef.current?.currentPassage || '');
    setCharStatuses(paragraphMgrRef.current?.charStatuses || []);
    setGameState('playing');
  };

  // Game Over
  const handleGameOver = () => {
    setGameState('game_over');
    if (audioRef.current) {
      audioRef.current.playGameOver();
      audioRef.current.stopAmbient();
    }
    saveScoreRecord();
  };

  // Victory
  const handleVictory = () => {
    setGameState('victory');
    if (audioRef.current) {
      audioRef.current.playWaveCleared();
      audioRef.current.stopAmbient();
    }
    saveScoreRecord();
    if (onComplete) onComplete({ score, wave: currentWave, ...typingStats });
  };

  // Save record to Keyflow Arcade storage
  const saveScoreRecord = () => {
    try {
      const stats = paragraphMgrRef.current?.getStats() || typingStats;
      saveArcadeRecord('stickman', {
        score,
        wave: currentWave,
        wpm: stats.wpm,
        accuracy: stats.accuracy,
        maxCombo: stats.maxCombo,
        date: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Failed to save stickman arcade record:', e);
    }
  };

  // Toggle Mute
  const handleToggleMute = () => {
    if (audioRef.current) {
      const muted = audioRef.current.toggleMute();
      setIsMuted(muted);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[750px] bg-slate-950 text-white flex flex-col select-none overflow-hidden font-sans">
      {/* TOP HEADER HUD */}
      <header className="relative z-20 flex items-center justify-between px-6 py-3 bg-slate-900/90 backdrop-blur-md border-b border-red-950/60 shadow-lg">
        {/* Left: Vitality & Exit */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowExitDialog(true)}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Exit to Arcade"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Player Vitality Bar */}
          <div className="flex flex-col gap-1 min-w-[200px]">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-red-400">
                <Flame className="w-4 h-4 text-red-500 fill-red-500" />
                WARRIOR VITALITY
              </span>
              <span className="text-slate-300 font-mono">
                {playerHp} / {maxPlayerHp}
              </span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-red-900/50">
              <div
                className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-emerald-400 transition-all duration-300 rounded-full"
                style={{ width: `${Math.max(0, (playerHp / maxPlayerHp) * 100)}%` }}
              />
            </div>
          </div>

          {/* Flow Energy Multiplier */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
            <Zap className="w-4 h-4 fill-emerald-400 text-emerald-400" />
            <div className="text-xs">
              <span className="font-bold text-sm">{typingStats.flowMultiplier.toFixed(1)}x</span> FLOW
            </div>
          </div>
        </div>

        {/* Center: Boss HP Bar or Wave Badge */}
        <div className="flex flex-col items-center">
          {bossHp !== null ? (
            <div className="flex flex-col items-center gap-1 min-w-[260px]">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 tracking-wider">
                <Skull className="w-4 h-4 text-amber-500 animate-pulse" />
                INFERNAL COMMANDER BOSS
                <span className="font-mono text-slate-300">({bossHp} HP)</span>
              </div>
              <div className="w-full h-3.5 bg-slate-900 rounded-full overflow-hidden border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 via-red-600 to-amber-400 transition-all duration-200"
                  style={{ width: `${Math.max(0, (bossHp / maxBossHp) * 100)}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-950/80 border border-red-700/60 shadow-md">
              <Swords className="w-4 h-4 text-red-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-red-200">
                WAVE {currentWave} / 5
              </span>
              <span className="text-xs text-slate-400">
                • {enemiesRemaining} {enemiesRemaining === 1 ? 'Foe' : 'Foes'} Remaining
              </span>
            </div>
          )}
        </div>

        {/* Right: Live Telemetry Badges & Controls */}
        <div className="flex items-center gap-3">
          {/* Live WPM */}
          <div className="flex flex-col items-end px-3 py-1 bg-slate-800/80 rounded-lg border border-slate-700/60">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Cadence</span>
            <span className="text-sm font-bold font-mono text-emerald-400">{typingStats.wpm} WPM</span>
          </div>

          {/* Accuracy */}
          <div className="flex flex-col items-end px-3 py-1 bg-slate-800/80 rounded-lg border border-slate-700/60">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Precision</span>
            <span className="text-sm font-bold font-mono text-cyan-400">{typingStats.accuracy}%</span>
          </div>

          {/* Score */}
          <div className="flex flex-col items-end px-3 py-1 bg-slate-800/80 rounded-lg border border-slate-700/60">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Score</span>
            <span className="text-sm font-bold font-mono text-amber-400">{score.toLocaleString()}</span>
          </div>

          {/* Audio Mute */}
          <button
            onClick={handleToggleMute}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>

          {/* Pause */}
          <button
            onClick={() => setGameState('paused')}
            disabled={gameState !== 'playing'}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-40 transition"
            title="Pause Game (Esc)"
          >
            <Pause className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 2D CANVAS VIEWPORT */}
      <div ref={containerRef} className="relative flex-1 w-full bg-black overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
      </div>

      {/* BOTTOM CONTINUOUS PARAGRAPH TYPING DECK */}
      <footer className="relative z-20 px-6 py-4 bg-slate-900/95 border-t border-red-950/70 backdrop-blur-md shadow-2xl flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 font-medium text-emerald-400">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            CONTINUOUS COMBAT PASSAGE — TYPE WITH CADENCE TO STRIKE & ADVANCE
          </span>
          <span className="font-mono text-slate-400">
            {typingStats.progressPercent}% Completed • Combo: <strong className="text-emerald-400">{typingStats.combo}</strong>
          </span>
        </div>

        {/* Character-by-character Passage Display Deck */}
        <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/80 shadow-inner font-mono text-lg leading-relaxed tracking-wide min-h-[85px] max-h-[110px] overflow-y-auto">
          {currentPassage.split('').map((char, idx) => {
            const status = charStatuses[idx] || 'untyped';
            const isCursor = idx === typingStats.currentIndex;

            let charClass = 'text-slate-500'; // untyped
            if (status === 'correct') {
              charClass = 'text-emerald-400 font-semibold bg-emerald-950/30';
            } else if (status === 'incorrect') {
              charClass = 'text-red-400 bg-red-950/60 underline decoration-red-500';
            }

            return (
              <span
                key={idx}
                className={`relative transition-colors duration-75 ${charClass} ${
                  isCursor ? 'ring-2 ring-emerald-400 rounded-sm bg-emerald-900/40 text-white animate-pulse' : ''
                }`}
              >
                {char}
              </span>
            );
          })}
        </div>

        {/* Subtle Passage Progress Bar */}
        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-150"
            style={{ width: `${typingStats.progressPercent}%` }}
          />
        </div>
      </footer>

      {/* OVERLAY: READY MODAL */}
      {gameState === 'ready' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-6">
          <div className="max-w-xl w-full bg-slate-900/95 border border-red-700/60 rounded-2xl p-8 shadow-2xl flex flex-col items-center text-center">
            {/* Crimson Stickman Emblem */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-[0_0_25px_rgba(220,38,38,0.6)] mb-4 border-2 border-emerald-400">
              <Swords className="w-8 h-8 text-white" />
            </div>

            <h1 className="text-3xl font-extrabold tracking-wider text-white mb-2 uppercase">
              STICKMAN FIGHT
            </h1>
            <p className="text-sm text-red-300 font-medium tracking-wide mb-6">
              AUTHENTIC 2D STICKMAN WARRIOR COMBAT • CONTINUOUS PARAGRAPH TYPING
            </p>

            {/* Instruction Highlights */}
            <div className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-4 mb-6 text-left space-y-2.5 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Continuous Paragraph Typing:</strong> Type displayed martial battle passages to continuously command your crimson stickman warrior.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Typing Cadence & Attacks:</strong> Typing words triggers sword slashes, martial kicks, and flurry combos. Higher WPM grants massive damage multipliers!
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Flow Multiplier:</strong> Maintain unbroken typing streaks to charge your spirit meter up to 4.0x damage.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Paragraph Finisher:</strong> Completing each paragraph triggers an explosive aerial <em>Blade Storm</em>, instantly cycling to the next passage!
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-4 w-full">
              <Button
                variant="secondary"
                onClick={() => setShowExitDialog(true)}
                className="flex-1 py-3 border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Back to Arcade
              </Button>
              <Button
                variant="primary"
                onClick={handleStartGame}
                className="flex-1 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold shadow-lg shadow-red-900/40"
              >
                <Play className="w-5 h-5 mr-2" /> Start Battle
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY: WAVE CLEARED */}
      {gameState === 'wave_cleared' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-6 animate-fadeIn">
          <div className="max-w-md w-full bg-slate-900/95 border border-emerald-500/50 rounded-2xl p-8 shadow-2xl flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-600/30 border-2 border-emerald-400 flex items-center justify-center mb-4">
              <Trophy className="w-8 h-8 text-emerald-400" />
            </div>

            <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-1">
              WAVE {currentWave} CLEARED!
            </h2>
            <p className="text-sm text-emerald-300 mb-6 font-medium">
              Shadows Banished • Warrior Health Restored (+50 HP)
            </p>

            <div className="w-full grid grid-cols-2 gap-3 mb-6 font-mono text-xs">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-slate-400">Current WPM</div>
                <div className="text-lg font-bold text-emerald-400">{typingStats.wpm}</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-slate-400">Total Score</div>
                <div className="text-lg font-bold text-amber-400">{score.toLocaleString()}</div>
              </div>
            </div>

            <Button
              variant="primary"
              onClick={handleNextWave}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-950"
            >
              Enter Wave {currentWave + 1}
            </Button>
          </div>
        </div>
      )}

      {/* OVERLAY: PAUSE MODAL */}
      {gameState === 'paused' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-6">
          <div className="max-w-sm w-full bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center">
            <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-wider">Battle Paused</h2>
            <div className="flex flex-col gap-3 w-full">
              <Button
                variant="primary"
                onClick={() => setGameState('playing')}
                className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold"
              >
                Resume
              </Button>
              <Button
                variant="secondary"
                onClick={handleStartGame}
                className="w-full py-2.5 border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <RotateCcw className="w-4 h-4 mr-2" /> Restart Battle
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowExitDialog(true)}
                className="w-full py-2.5 border-slate-700 text-slate-400 hover:text-white"
              >
                Exit to Arcade
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY: GAME OVER MODAL */}
      {gameState === 'game_over' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-6">
          <div className="max-w-md w-full bg-slate-900 border border-red-700/80 rounded-2xl p-8 shadow-2xl flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-red-950/80 border-2 border-red-500 flex items-center justify-center mb-4">
              <Skull className="w-8 h-8 text-red-500" />
            </div>

            <h2 className="text-2xl font-black text-red-500 uppercase tracking-wider mb-1">
              WARRIOR FALLEN
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Defeated on Wave {currentWave} by the Shadow Legion
            </p>

            <div className="w-full grid grid-cols-2 gap-3 mb-6 font-mono text-xs">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-slate-400">Final Score</div>
                <div className="text-lg font-bold text-amber-400">{score.toLocaleString()}</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-slate-400">Typing Speed</div>
                <div className="text-lg font-bold text-emerald-400">{typingStats.wpm} WPM</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-slate-400">Accuracy</div>
                <div className="text-lg font-bold text-cyan-400">{typingStats.accuracy}%</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-slate-400">Max Combo</div>
                <div className="text-lg font-bold text-rose-400">{typingStats.maxCombo}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full">
              <Button
                variant="secondary"
                onClick={() => setShowExitDialog(true)}
                className="flex-1 py-3 border-slate-700 text-slate-300"
              >
                Exit
              </Button>
              <Button
                variant="primary"
                onClick={handleStartGame}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold"
              >
                <RotateCcw className="w-4 h-4 mr-2" /> Try Again
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY: VICTORY MODAL */}
      {gameState === 'victory' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-6">
          <div className="max-w-md w-full bg-slate-900 border border-amber-500/80 rounded-2xl p-8 shadow-2xl flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mb-4">
              <Trophy className="w-8 h-8 text-amber-400" />
            </div>

            <h2 className="text-2xl font-black text-amber-400 uppercase tracking-wider mb-1">
              GRAND VICTORY!
            </h2>
            <p className="text-xs text-amber-200/80 mb-6 font-medium">
              The Infernal Commander is vanquished! The Crimson Flame reigns supreme!
            </p>

            <div className="w-full grid grid-cols-2 gap-3 mb-6 font-mono text-xs">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-slate-400">Grand Score</div>
                <div className="text-lg font-bold text-amber-400">{score.toLocaleString()}</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-slate-400">Final WPM</div>
                <div className="text-lg font-bold text-emerald-400">{typingStats.wpm} WPM</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-slate-400">Accuracy</div>
                <div className="text-lg font-bold text-cyan-400">{typingStats.accuracy}%</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-slate-400">Max Combo</div>
                <div className="text-lg font-bold text-rose-400">{typingStats.maxCombo}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full">
              <Button
                variant="secondary"
                onClick={() => setShowExitDialog(true)}
                className="flex-1 py-3 border-slate-700 text-slate-300"
              >
                Arcade Hub
              </Button>
              <Button
                variant="primary"
                onClick={handleStartGame}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black"
              >
                Play Again
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Confirmation Dialog */}
      {showExitDialog && (
        <ArcadeExitDialog
          onConfirm={() => {
            saveScoreRecord();
            if (onBack) onBack();
          }}
          onCancel={() => setShowExitDialog(false)}
        />
      )}
    </div>
  );
}

export default StickmanFightGame;
