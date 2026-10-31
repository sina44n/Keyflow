/**
 * StickmanFightGame.jsx
 * KEYFLOW ARCADE — STICKMAN FIGHT (2D)
 * Masterpiece 2D Martial Arts Fighting Game powered by Continuous Paragraph Typing.
 * Phase 1: Perfect 1-on-1 Martial Combat (Player vs Single Opponent) with real
 * punches, kicks, knockbacks, ground falls, recovery, and typing-driven combat flow.
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
import { saveArcadeRecord } from '../../../utils/arcadeStorage';

import { StickmanParagraphManager } from '../stickman2d/StickmanParagraphManager';
import { Stickman2DAudio } from '../stickman2d/Stickman2DAudio';
import { Stickman2DCharacter } from '../stickman2d/Stickman2DCharacter';
import { Stickman2DEnvironment } from '../stickman2d/Stickman2DEnvironment';
import { Stickman2DCombat } from '../stickman2d/Stickman2DCombat';
import { Stickman2DEnemies } from '../stickman2d/Stickman2DEnemies';

export function StickmanFightGame({ onBack, onComplete, initialEncounter = 1 }) {
  // Game states: 'ready' | 'playing' | 'paused' | 'encounter_cleared' | 'game_over' | 'victory'
  const [gameState, setGameState] = useState('ready');
  const [currentEncounter, setCurrentEncounter] = useState(initialEncounter);
  const [score, setScore] = useState(0);

  // Health states
  const [playerHp, setPlayerHp] = useState(150);
  const [maxPlayerHp, setMaxPlayerHp] = useState(150);
  const [enemyHp, setEnemyHp] = useState(180);
  const [maxEnemyHp, setMaxEnemyHp] = useState(180);
  const [enemyName, setEnemyName] = useState('Shadow Brawler');
  const [enemiesRemaining, setEnemiesRemaining] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  // Live typing telemetry
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

  // Canvas & Engine Refs
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const lastTimeRef = useRef(null);

  const audioRef = useRef(null);
  const paragraphMgrRef = useRef(null);
  const envRef = useRef(null);
  const playerRef = useRef(null);
  const combatRef = useRef(null);
  const enemiesRef = useRef(null);

  // Combo sequence tracker (cycles through authentic martial arts combos)
  const comboCycleRef = useRef(0);
  const COMBO_ATTACKS = ['jab', 'cross', 'highKick', 'lowSweep', 'flyingKnee'];

  // Audio setup
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
      name: 'Crimson Fighter',
      x: 220,
      y: env.groundY,
      groundY: env.groundY,
      facing: 1,
      maxHp: 150,
    });
    playerRef.current = player;
    setPlayerHp(player.hp);
    setMaxPlayerHp(player.maxHp);

    const enemies = new Stickman2DEnemies({
      groundY: env.groundY,
      onEnemyDefeated: (enemy) => {
        setScore((prev) => prev + 250);
      },
      onEncounterCleared: (encounter) => {
        setScore((prev) => prev + encounter * 600);
        setGameState('encounter_cleared');
      },
    });
    enemiesRef.current = enemies;

    // Initialize 1v1 Sparring Opponent (Phase 1)
    const primaryEnemy = enemies.setup1v1 ? enemies.setup1v1(player.x) : enemies.getPrimaryEnemy();
    if (primaryEnemy) {
      setEnemyHp(primaryEnemy.hp);
      setMaxEnemyHp(primaryEnemy.maxHp);
      setEnemyName(primaryEnemy.name);
    }

    // Continuous Paragraph Typing Controller
    const paragraphMgr = new StickmanParagraphManager({
      onCorrectChar: (char, isSpace, word, stats) => {
        setTypingStats(stats);
        if (audioRef.current) audioRef.current.playKeypress(true);

        // Player advances toward the opponent on correct keystrokes
        const p = playerRef.current;
        const e = enemiesRef.current?.getPrimaryEnemy();
        if (p && p.isAlive && e && e.isAlive) {
          const dist = Math.abs(e.x - p.x);
          p.facing = e.x > p.x ? 1 : -1;
          if (dist > 85 && p.state === 'neutral') {
            p.vx = p.facing * 160;
            p.animator.play('dash', 1.1);
          }
        }
      },
      onErrorChar: (typed, expected, stats) => {
        setTypingStats(stats);
        if (audioRef.current) audioRef.current.playKeypress(false);
        // Error causes brief guard flicker
        const p = playerRef.current;
        if (p && p.isAlive && p.state === 'neutral') {
          p.animator.play('hitHead', 2.2);
        }
      },
      onWordComplete: (word, wordIndex, stats) => {
        setTypingStats(stats);
        triggerCombatAttack('word', stats);
      },
      onPunctuation: (char, stats) => {
        setTypingStats(stats);
        triggerCombatAttack('heavy', stats);
      },
      onParagraphComplete: (stats) => {
        setTypingStats(stats);
        triggerCombatAttack('finisher', stats);

        // Seamlessly stream next battle passage without breaking typing flow
        setTimeout(() => {
          paragraphMgrRef.current?.loadPassageForEncounter(currentEncounter);
          setCurrentPassage(paragraphMgrRef.current?.currentPassage || '');
          setCharStatuses(paragraphMgrRef.current?.charStatuses || []);
        }, 400);
      },
    });

    paragraphMgrRef.current = paragraphMgr;
    setCurrentPassage(paragraphMgr.currentPassage);
    setCharStatuses(paragraphMgr.charStatuses);
  }, []);

  // Map typing events to authentic martial strikes
  const triggerCombatAttack = useCallback((triggerType, stats) => {
    const player = playerRef.current;
    const enemy = enemiesRef.current?.getPrimaryEnemy();
    const audio = audioRef.current;

    if (!player || !player.isAlive || !enemy || !enemy.isAlive) return;

    player.currentStats = stats;
    player.facing = enemy.x > player.x ? 1 : -1;

    // Typing speed scales animation playback speed ($1.0x to $2.2x)
    const wpm = stats.wpm || 30;
    const animSpeed = Math.min(2.2, Math.max(1.0, wpm / 40));

    // Dash into attack pocket if slightly far
    const dist = Math.abs(enemy.x - player.x);
    if (dist > 95 && player.isGrounded) {
      player.vx = player.facing * 280;
    }

    if (triggerType === 'finisher') {
      // Paragraph completion: Double-palm Ki Blast (Reference A Frame 14/34/44)
      player.attack('kiBlast', animSpeed);
      if (audio) audio.playSlash(0.9);
    } else if (triggerType === 'heavy') {
      // Punctuation: Flying Dropkick or Knee Strike
      const heavyMove = Math.random() > 0.5 ? 'dropkick' : 'flyingKnee';
      player.attack(heavyMove, animSpeed);
      if (audio) audio.playSlash(1.2);
    } else {
      // Word completion: cycle through fluid martial combination
      const attackName = COMBO_ATTACKS[comboCycleRef.current % COMBO_ATTACKS.length];
      comboCycleRef.current++;
      player.attack(attackName, animSpeed);
      if (audio) audio.playSlash(1.0);
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

      // Prevent page scrolling on space or backspace
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
      const dt = Math.min(0.08, (time - lastTimeRef.current) / 1000);
      lastTimeRef.current = time;

      const canvas = canvasRef.current;
      if (canvas && envRef.current && playerRef.current && enemiesRef.current && combatRef.current) {
        const ctx = canvas.getContext('2d');
        const env = envRef.current;
        const player = playerRef.current;
        const enemies = enemiesRef.current;
        const combat = combatRef.current;
        const audio = audioRef.current;

        // Responsive resize
        if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
          canvas.width = canvas.clientWidth;
          canvas.height = canvas.clientHeight;
          env.resize(canvas.width, canvas.height);
          player.groundY = env.groundY;
          enemies.groundY = env.groundY;
        }

        // Update physics & combat
        if (gameState === 'playing') {
          player.update(dt);
          enemies.update(dt, player, combat, audio, env);

          // Focus camera between fighters
          const primaryEnemy = enemies.getPrimaryEnemy();
          const focusX = primaryEnemy ? (player.x + primaryEnemy.x) / 2 : player.x;
          env.update(dt, focusX);
          combat.update(dt);

          // Update HUD
          setPlayerHp(player.hp);
          setEnemiesRemaining(enemies.getLivingCount());
          if (primaryEnemy) {
            setEnemyHp(primaryEnemy.hp);
            setMaxEnemyHp(primaryEnemy.maxHp);
            setEnemyName(primaryEnemy.name);
          }

          // Check Player Defeat
          if (!player.isAlive && player.state === 'defeated') {
            handleGameOver();
          }
        }

        // Render Frame
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        env.render(ctx);

        // World transform with screen shake
        ctx.save();
        let shakeX = 0;
        let shakeY = 0;
        if (env.shakeIntensity > 0) {
          shakeX = (Math.random() * 2 - 1) * env.shakeIntensity;
          shakeY = (Math.random() * 2 - 1) * env.shakeIntensity;
        }
        ctx.translate(-env.cameraX + shakeX, shakeY);

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

  // Start 1v1 Battle
  const handleStartBattle = () => {
    if (audioRef.current) {
      audioRef.current.resume();
      audioRef.current.startAmbient();
    }
    const p = playerRef.current;
    if (p) {
      p.hp = p.maxHp;
      p.isAlive = true;
      p.state = 'neutral';
      p.animator.play('idle');
    }
    const e = enemiesRef.current?.setup1v1(p ? p.x : 220);
    if (e) {
      setEnemyHp(e.hp);
      setMaxEnemyHp(e.maxHp);
      setEnemyName(e.name);
    }
    paragraphMgrRef.current?.reset(currentEncounter);
    setCurrentPassage(paragraphMgrRef.current?.currentPassage || '');
    setCharStatuses(paragraphMgrRef.current?.charStatuses || []);
    setGameState('playing');
  };

  // Encounter advance: progressive multi-enemy battle flow (Phase 2)
  const handleNextEncounter = () => {
    const nextEnc = currentEncounter + 1;
    setCurrentEncounter(nextEnc);
    if (playerRef.current) {
      playerRef.current.hp = Math.min(playerRef.current.maxHp, playerRef.current.hp + 60);
      setPlayerHp(playerRef.current.hp);
    }
    // Setup encounter with progressive opponents (1 -> 2 -> 3 -> 4 -> Boss)
    enemiesRef.current?.setupEncounter(nextEnc, playerRef.current?.x || 220);
    const primary = enemiesRef.current?.getPrimaryEnemy();
    if (primary) {
      setEnemyHp(primary.hp);
      setMaxEnemyHp(primary.maxHp);
      setEnemyName(primary.name);
    }
    paragraphMgrRef.current?.loadPassageForEncounter(nextEnc);
    setCurrentPassage(paragraphMgrRef.current?.currentPassage || '');
    setCharStatuses(paragraphMgrRef.current?.charStatuses || []);
    setGameState('playing');
  };

  const handleGameOver = () => {
    setGameState('game_over');
    if (audioRef.current) {
      audioRef.current.playGameOver();
      audioRef.current.stopAmbient();
    }
    saveScore();
  };

  const saveScore = () => {
    try {
      const stats = paragraphMgrRef.current?.getStats() || typingStats;
      saveArcadeRecord('stickman', {
        score,
        encounter: currentEncounter,
        wpm: stats.wpm,
        accuracy: stats.accuracy,
        maxCombo: stats.maxCombo,
        date: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Could not save score record:', e);
    }
  };

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
        {/* Left: Player Vitality & Exit */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowExitDialog(true)}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Exit to Arcade"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Player Vitality Bar */}
          <div className="flex flex-col gap-1 min-w-[210px]">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-red-400">
                <Flame className="w-4 h-4 text-red-500 fill-red-500" />
                PLAYER VITALITY
              </span>
              <span className="text-slate-300 font-mono text-xs">
                {playerHp} / {maxPlayerHp}
              </span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-red-900/50">
              <div
                className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-emerald-400 transition-all duration-200 rounded-full"
                style={{ width: `${Math.max(0, (playerHp / maxPlayerHp) * 100)}%` }}
              />
            </div>
          </div>

          {/* Flow Multiplier */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
            <Zap className="w-4 h-4 fill-emerald-400 text-emerald-400" />
            <div className="text-xs">
              <span className="font-bold text-sm">{typingStats.flowMultiplier.toFixed(1)}x</span> FLOW
            </div>
          </div>
        </div>

        {/* Center: Opponent Health Bar & Encounter Tracker */}
        <div className="flex flex-col items-center min-w-[260px]">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 tracking-wider">
            <Swords className="w-4 h-4 text-amber-400" />
            <span className="text-red-400 font-extrabold">ENC {currentEncounter}</span>
            <span className="text-slate-500">•</span>
            <span>{enemyName.toUpperCase()}</span>
            {enemiesRemaining > 1 && (
              <span className="px-1.5 py-0.5 rounded bg-red-950 border border-red-700/60 text-[10px] text-red-300 font-mono">
                {enemiesRemaining} FOES
              </span>
            )}
            <span className="font-mono text-slate-300 text-xs">({enemyHp} HP)</span>
          </div>
          <div className="w-full h-3.5 bg-slate-900 rounded-full overflow-hidden border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.25)] mt-1">
            <div
              className="h-full bg-gradient-to-r from-amber-600 via-red-600 to-amber-400 transition-all duration-200"
              style={{ width: `${Math.max(0, (enemyHp / maxEnemyHp) * 100)}%` }}
            />
          </div>
        </div>

        {/* Right: Telemetry Badges & Audio Controls */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end px-3 py-1 bg-slate-800/80 rounded-lg border border-slate-700/60">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Cadence</span>
            <span className="text-sm font-bold font-mono text-emerald-400">{typingStats.wpm} WPM</span>
          </div>

          <div className="flex flex-col items-end px-3 py-1 bg-slate-800/80 rounded-lg border border-slate-700/60">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Precision</span>
            <span className="text-sm font-bold font-mono text-cyan-400">{typingStats.accuracy}%</span>
          </div>

          <div className="flex flex-col items-end px-3 py-1 bg-slate-800/80 rounded-lg border border-slate-700/60">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Score</span>
            <span className="text-sm font-bold font-mono text-amber-400">{score.toLocaleString()}</span>
          </div>

          <button
            onClick={handleToggleMute}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>

          <button
            onClick={() => setGameState('paused')}
            disabled={gameState !== 'playing'}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-40 transition"
            title="Pause (Esc)"
          >
            <Pause className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 2D CANVAS ARENA */}
      <div ref={containerRef} className="relative flex-1 w-full bg-black overflow-hidden">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
      </div>

      {/* BOTTOM CONTINUOUS PARAGRAPH TYPING DECK */}
      <footer className="relative z-20 px-6 py-4 bg-slate-900/95 border-t border-red-950/70 backdrop-blur-md shadow-2xl flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 font-medium text-emerald-400">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            CONTINUOUS COMBAT PARAGRAPH — TYPE STEADILY TO ADVANCE & STRIKE
          </span>
          <span className="font-mono text-slate-400">
            {typingStats.progressPercent}% Completed • Combo: <strong className="text-emerald-400">{typingStats.combo}</strong>
          </span>
        </div>

        {/* Character-by-character Passage Display */}
        <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/80 shadow-inner font-mono text-lg leading-relaxed tracking-wide min-h-[85px] max-h-[110px] overflow-y-auto">
          {currentPassage.split('').map((char, idx) => {
            const status = charStatuses[idx] || 'untyped';
            const isCursor = idx === typingStats.currentIndex;

            let charClass = 'text-slate-500';
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

        {/* Passage Progress Bar */}
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
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-[0_0_25px_rgba(220,38,38,0.6)] mb-4 border-2 border-emerald-400">
              <Swords className="w-8 h-8 text-white" />
            </div>

            <h1 className="text-3xl font-extrabold tracking-wider text-white mb-2 uppercase">
              STICKMAN FIGHT
            </h1>
            <p className="text-sm text-red-300 font-medium tracking-wide mb-6">
              AUTHENTIC 2D MARTIAL COMBAT • CONTINUOUS PARAGRAPH TYPING
            </p>

            <div className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-4 mb-6 text-left space-y-2.5 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Continuous Paragraph Typing:</strong> Type the displayed passage character by character. No isolated command buttons.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Martial Arts Combos:</strong> Typing words executes jabs, crosses, high roundhouse kicks, and leg sweeps. Punctuation unleashes heavy dropkicks!
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Interactive Defense & Knockdown:</strong> Opponents actively guard, counterattack, and recover from knockdowns. Maintain typing rhythm to dominate!
                </span>
              </div>
            </div>

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
                onClick={handleStartBattle}
                className="flex-1 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold shadow-lg shadow-red-900/40"
              >
                <Play className="w-5 h-5 mr-2" /> Start Battle
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY: ENCOUNTER CLEARED */}
      {gameState === 'encounter_cleared' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-6 animate-fadeIn">
          <div className="max-w-md w-full bg-slate-900/95 border border-emerald-500/50 rounded-2xl p-8 shadow-2xl flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-600/30 border-2 border-emerald-400 flex items-center justify-center mb-4">
              <Trophy className="w-8 h-8 text-emerald-400" />
            </div>

            <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-1">
              OPPONENT VANQUISHED!
            </h2>
            <p className="text-sm text-emerald-300 mb-6 font-medium">
              Encounter {currentEncounter} Victory • Vitality Restored (+60 HP)
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
              onClick={handleNextEncounter}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-950"
            >
              Continue to Encounter {currentEncounter + 1}
            </Button>
          </div>
        </div>
      )}

      {/* OVERLAY: PAUSE */}
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
                onClick={handleStartBattle}
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

      {/* OVERLAY: GAME OVER */}
      {gameState === 'game_over' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-6">
          <div className="max-w-md w-full bg-slate-900 border border-red-700/80 rounded-2xl p-8 shadow-2xl flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-red-950/80 border-2 border-red-500 flex items-center justify-center mb-4">
              <Skull className="w-8 h-8 text-red-500" />
            </div>

            <h2 className="text-2xl font-black text-red-500 uppercase tracking-wider mb-1">
              FIGHTER DEFEATED
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Overwhelmed in Encounter {currentEncounter}
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
                onClick={handleStartBattle}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold"
              >
                <RotateCcw className="w-4 h-4 mr-2" /> Try Again
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Dialog */}
      {showExitDialog && (
        <ArcadeExitDialog
          onConfirm={() => {
            saveScore();
            if (onBack) onBack();
          }}
          onCancel={() => setShowExitDialog(false)}
        />
      )}
    </div>
  );
}

export default StickmanFightGame;
