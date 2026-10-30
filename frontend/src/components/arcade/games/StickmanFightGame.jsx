import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
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
  HelpCircle,
  Flame,
  CheckCircle,
  Sliders,
  Sparkles,
  Target,
} from 'lucide-react';
import { Button } from '../../common/Button';
import { ArcadeExitDialog } from '../ArcadeExitDialog';
import { saveArcadeRecord, getGameRecord } from '../../../utils/arcadeStorage';
import { GlobalGameSettingsModal } from '../performance/GlobalGameSettingsModal';

import { Stickman3DAudio } from '../stickman3d/Stickman3DAudio';
import { Stickman3DEnvironment } from '../stickman3d/Stickman3DEnvironment';
import { Stickman3DPlayer } from '../stickman3d/Stickman3DPlayer';
import { Stickman3DCamera } from '../stickman3d/Stickman3DCamera';
import { Stickman3DEnemies } from '../stickman3d/Stickman3DEnemies';
import { Stickman3DCombatSystem } from '../stickman3d/Stickman3DCombatSystem';
import { StickmanTypingEngine } from '../stickman3d/StickmanTypingEngine';

export const StickmanFightGame = ({ onExit, soundEnabled = true }) => {
  // Game states: 'ready' | 'playing' | 'wave_cleared' | 'paused' | 'gameover' | 'victory'
  const [gameState, setGameState] = useState('ready');
  const [soundOn, setSoundOn] = useState(soundEnabled);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showControlsModal, setShowControlsModal] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // HUD & Telemetry
  const [wave, setWave] = useState(1);
  const [playerHp, setPlayerHp] = useState(100);
  const [flowEnergy, setFlowEnergy] = useState(0);
  const [score, setScore] = useState(0);
  const [enemiesRemaining, setEnemiesRemaining] = useState(1);
  const [bossHp, setBossHp] = useState(null); // null or { current, max }

  // Real-time Typing Deck
  const [activeWord, setActiveWord] = useState('');
  const [typedPart, setTypedPart] = useState('');
  const [untypedPart, setUntypedPart] = useState('');
  const [commandCategory, setCommandCategory] = useState('attacks');
  const [inputErrorShake, setInputErrorShake] = useState(false);

  // Floating enemy overhead word in 2D perspective screen space
  const [enemyWordPos, setEnemyWordPos] = useState(null);

  // Real typing metrics
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [combo, setCombo] = useState(0);
  const [comboMultiplier, setComboMultiplier] = useState(1.0);
  const [highScore, setHighScore] = useState(0);

  // Final summary stats
  const [finalReport, setFinalReport] = useState(null);

  // Three.js and Engine refs
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const cameraControllerRef = useRef(null);
  const audioRef = useRef(null);
  const envRef = useRef(null);
  const playerRef = useRef(null);
  const enemiesRef = useRef(null);
  const combatRef = useRef(null);
  const typingRef = useRef(null);
  const animFrameRef = useRef(null);
  const lastTimeRef = useRef(0);

  // Load high score
  useEffect(() => {
    const record = getGameRecord('stickman');
    if (record && record.highScore) {
      setHighScore(record.highScore);
    }
  }, []);

  // Sync sound
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.setEnabled(soundOn);
    }
  }, [soundOn]);

  /**
   * Initialize Three.js viewport & engine systems
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 960;
    const height = Math.max(520, Math.min(680, window.innerHeight * 0.72));

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(54, width / height, 0.1, 150);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const audio = new Stickman3DAudio();
    audio.setEnabled(soundOn);
    audioRef.current = audio;

    const env = new Stickman3DEnvironment(scene, 'red_forest');
    envRef.current = env;

    const player = new Stickman3DPlayer(scene, audio);
    playerRef.current = player;

    const cameraController = new Stickman3DCamera(camera);
    cameraControllerRef.current = cameraController;

    const enemies = new Stickman3DEnemies(scene, audio);
    enemiesRef.current = enemies;

    const combat = new Stickman3DCombatSystem(scene, audio);
    combatRef.current = combat;

    const typing = new StickmanTypingEngine(audio);
    typingRef.current = typing;

    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const newW = container.clientWidth;
      const newH = Math.max(520, Math.min(680, window.innerHeight * 0.72));
      cameraRef.current.aspect = newW / newH;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioRef.current) audioRef.current.stopAmbientDrone();
      if (rendererRef.current) rendererRef.current.dispose();
    };
  }, []);

  /**
   * Start New Game / Reset
   */
  const handleStartGame = useCallback(() => {
    if (!playerRef.current || !enemiesRef.current || !envRef.current || !typingRef.current) return;

    setWave(1);
    setScore(0);
    setPlayerHp(100);
    setFlowEnergy(0);
    setCombo(0);
    setComboMultiplier(1.0);
    setBossHp(null);
    setFinalReport(null);

    envRef.current.buildStage('red_forest');
    playerRef.current.reset(0, 4);

    enemiesRef.current.startWave(1);
    setEnemiesRemaining(enemiesRef.current.getAliveCount());

    typingRef.current.reset();
    typingRef.current.setDifficulty(1);
    const cmd = typingRef.current.generateCommand({ isComboReady: false });
    setActiveWord(cmd.text);
    setTypedPart('');
    setUntypedPart(cmd.text);
    setCommandCategory(cmd.category);

    setGameState('playing');

    if (audioRef.current && soundOn) {
      audioRef.current.startAmbientDrone();
    }
  }, [soundOn]);

  /**
   * Advance Wave Progression
   */
  const handleAdvanceWave = useCallback((nextWave) => {
    if (!playerRef.current || !enemiesRef.current || !envRef.current || !typingRef.current) return;

    setWave(nextWave);

    if (nextWave <= 2) {
      envRef.current.buildStage('red_forest');
    } else if (nextWave <= 4) {
      envRef.current.buildStage('dark_battlefield');
    } else {
      envRef.current.buildStage('infernal_arena');
    }

    playerRef.current.health = Math.min(100, playerRef.current.health + 30);
    playerRef.current.flowEnergy = 50;
    playerRef.current.position.set(0, 0, 4);

    enemiesRef.current.startWave(nextWave);
    setEnemiesRemaining(enemiesRef.current.getAliveCount());

    typingRef.current.setDifficulty(nextWave);
    const cmd = typingRef.current.generateCommand({ isComboReady: true });
    setActiveWord(cmd.text);
    setTypedPart('');
    setUntypedPart(cmd.text);
    setCommandCategory(cmd.category);

    setGameState('playing');
  }, []);

  /**
   * KEYBOARD TYPING INPUT LISTENER
   * Primary Combat Controller: Typing executes martial attacks, dodges, and parries
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing') {
        if (e.key === 'Escape' && gameState === 'paused') {
          setGameState('playing');
        }
        return;
      }

      if (e.key === 'Escape') {
        setGameState('paused');
        return;
      }

      const typing = typingRef.current;
      const player = playerRef.current;
      const enemies = enemiesRef.current;
      if (!typing || !player || !enemies) return;

      const closestEnemy = enemies.getClosestEnemy(player.position);
      const res = typing.processKeystroke(e.key);

      if (res.status === 'advancing') {
        setTypedPart(res.typed);
        setUntypedPart(res.remaining);
      } else if (res.status === 'completed') {
        // EXECUTE MARTIAL ACTION IMMEDIATELY!
        player.executeCombatAction(res.actionKey, closestEnemy);

        // Screen shake on heavy strikes
        if (res.actionKey === 'cleave' || res.actionKey === 'bladeStorm' || res.actionKey === 'cyclone') {
          cameraControllerRef.current?.addShake(0.35);
        }

        // Generate next combat prompt
        const nextCmd = typing.generateCommand({
          targetId: closestEnemy?.id,
          isComboReady: typing.comboCount >= 3,
          isDefensiveEmergency: closestEnemy?.aiState === 'windup',
        });

        setActiveWord(nextCmd.text);
        setTypedPart('');
        setUntypedPart(nextCmd.text);
        setCommandCategory(nextCmd.category);
      } else if (res.status === 'error') {
        // Shake typing box on error
        setInputErrorShake(true);
        setTimeout(() => setInputErrorShake(false), 250);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  /**
   * Main Render & Game Loop
   */
  useEffect(() => {
    let animId = null;

    const gameLoop = (currentTime) => {
      animId = requestAnimationFrame(gameLoop);
      animFrameRef.current = animId;

      if (!lastTimeRef.current) lastTimeRef.current = currentTime;
      const rawDelta = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;
      const delta = Math.min(rawDelta, 0.05);

      const player = playerRef.current;
      const enemies = enemiesRef.current;
      const cameraController = cameraControllerRef.current;
      const combat = combatRef.current;
      const typing = typingRef.current;
      const env = envRef.current;
      const renderer = rendererRef.current;
      const scene = sceneRef.current;
      const camera = cameraRef.current;

      if (!player || !enemies || !cameraController || !combat || !typing || !renderer || !scene || !camera) return;

      if (gameState === 'playing') {
        // 1. Update Player
        player.update(delta, env);

        // 2. Update Group Enemies
        enemies.update(delta, player.position, env);

        // 3. Update Dynamic Action Camera
        cameraController.update(delta, player.position, enemies.enemies);

        // 4. Update Combat Collisions & Damage
        combat.checkPlayerAttacks(player, enemies.enemies, typing.getComboMultiplier());
        combat.checkEnemyAttacks(enemies.enemies, player);
        combat.update(delta);

        // 5. Update Typing Timers
        typing.update(delta);

        // 6. Update Environment
        if (env) env.update(delta);

        // 7. Project Closest Enemy to Screen for Floating Word
        const closest = enemies.getClosestEnemy(player.position);
        if (closest && closest.isAlive) {
          const worldPos = closest.position.clone();
          worldPos.y += 2.5 * closest.scale;
          worldPos.project(camera);

          const canvas = renderer.domElement;
          const sx = (worldPos.x * 0.5 + 0.5) * canvas.clientWidth;
          const sy = (-worldPos.y * 0.5 + 0.5) * canvas.clientHeight;
          setEnemyWordPos({ x: sx, y: sy });
        } else {
          setEnemyWordPos(null);
        }

        // 8. Sync HUD & Metrics
        setPlayerHp(Math.round(player.health));
        setFlowEnergy(Math.round(player.flowEnergy));
        setScore(player.totalScore);

        const metrics = typing.getMetrics();
        setWpm(metrics.wpm);
        setAccuracy(metrics.accuracy);
        setCombo(metrics.combo);
        setComboMultiplier(metrics.multiplier);

        const aliveCount = enemies.getAliveCount();
        setEnemiesRemaining(aliveCount);

        const boss = enemies.getBoss();
        if (boss) {
          setBossHp({ current: boss.health, max: boss.maxHealth });
        } else {
          setBossHp(null);
        }

        // 9. Check Game Over
        if (!player.isAlive && player.animEngine.stateTimer >= 1.2) {
          setGameState('gameover');
          const report = {
            ...metrics,
            score: player.totalScore,
            wave,
            enemiesDefeated: player.enemiesDefeated,
          };
          setFinalReport(report);
          if (player.totalScore > highScore) {
            setHighScore(player.totalScore);
            saveArcadeRecord('stickman', { highScore: player.totalScore, waveReached: wave });
          }
        }

        // 10. Check Wave Cleared / Victory
        if (aliveCount === 0 && player.isAlive) {
          if (wave >= 5) {
            // Victory against final boss!
            setGameState('victory');
            player.animEngine.setState('victory', 0, true);
            const report = {
              ...metrics,
              score: player.totalScore,
              wave: 5,
              enemiesDefeated: player.enemiesDefeated,
            };
            setFinalReport(report);
            if (player.totalScore > highScore) {
              setHighScore(player.totalScore);
              saveArcadeRecord('stickman', { highScore: player.totalScore, waveReached: 5 });
            }
          } else {
            setGameState('wave_cleared');
            setTimeout(() => {
              handleAdvanceWave(wave + 1);
            }, 2400);
          }
        }
      } else if (gameState === 'ready') {
        // Gentle rotation in ready screen
        if (player) {
          player.animEngine.update(delta, { x: 0, z: 0 }, false);
          cameraController.cameraAngle += delta * 0.25;
          cameraController.update(delta, player.position, []);
          if (env) env.update(delta);
        }
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [gameState, wave, highScore, handleAdvanceWave]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-2xl select-none font-sans">
      {/* Top Header Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-zinc-950/90 via-zinc-950/60 to-transparent backdrop-blur-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowExitConfirm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/60 text-xs font-mono text-zinc-300 hover:text-white transition-all cursor-pointer"
            aria-label="Exit Game"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Arcade</span>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/50 border border-red-700/60 text-red-400 text-xs font-mono font-bold tracking-wider">
            <Swords className="w-3.5 h-3.5 text-emerald-400" />
            <span>STICKMAN FIGHT</span>
          </div>
        </div>

        {/* Right side options: Controls, Settings, Sound */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowControlsModal(true)}
            className="p-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 hover:text-white transition-all cursor-pointer"
            title="Typing Combat Guide"
            aria-label="Typing Combat Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 hover:text-white transition-all cursor-pointer"
            title="Graphics Settings"
            aria-label="Graphics Settings"
          >
            <Sliders className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setSoundOn((s) => !s)}
            className="p-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 hover:text-white transition-all cursor-pointer"
            title={soundOn ? 'Sound On' : 'Muted'}
            aria-label="Toggle Sound"
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
          </button>
        </div>
      </div>

      {/* Main 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        className="relative w-full h-[540px] sm:h-[620px] overflow-hidden"
      />

      {/* FLOATING 3D TARGET PROMPT OVER ENEMY */}
      {gameState === 'playing' && enemyWordPos && (
        <div
          className="absolute pointer-events-none -translate-x-1/2 -translate-y-full z-15 pb-2 transition-all duration-75"
          style={{ left: `${enemyWordPos.x}px`, top: `${enemyWordPos.y}px` }}
        >
          <div className="px-3 py-1 rounded-md bg-zinc-950/90 border border-emerald-500/80 text-white font-mono font-bold text-xs tracking-wider shadow-lg flex items-center gap-1.5">
            <Target className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span className="text-emerald-400">{typedPart}</span>
            <span className="text-zinc-300">{untypedPart}</span>
          </div>
        </div>
      )}

      {/* IN-GAME HUD OVERLAYS */}
      {gameState === 'playing' && (
        <>
          {/* Top-Left: Player Vitals & Flow Energy Gauge */}
          <div className="absolute top-14 left-4 z-10 w-60 sm:w-72 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 backdrop-blur-md space-y-2 pointer-events-none shadow-xl">
            {/* Vitality Bar */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px] font-mono tracking-wider">
                <span className="text-zinc-400 font-bold uppercase flex items-center gap-1">
                  <Shield className="w-3 h-3 text-red-400" /> VITALITY
                </span>
                <span className={`font-bold ${playerHp < 30 ? 'text-red-400 animate-pulse' : 'text-zinc-200'}`}>
                  {playerHp} / 100
                </span>
              </div>
              <div className="h-2.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className={`h-full transition-all duration-150 ${
                    playerHp > 50 ? 'bg-gradient-to-r from-red-600 to-emerald-500' : 'bg-red-600'
                  }`}
                  style={{ width: `${Math.max(0, playerHp)}%` }}
                />
              </div>
            </div>

            {/* Flow Energy Gauge */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px] font-mono tracking-wider">
                <span className="text-zinc-400 font-bold uppercase flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-400" /> FLOW ENERGY
                </span>
                <span className="text-emerald-400 font-bold">{flowEnergy}%</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className="h-full bg-gradient-to-r from-emerald-600 to-green-400 transition-all duration-150"
                  style={{ width: `${Math.max(0, flowEnergy)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Top-Center: Wave Counter & Boss HP Bar */}
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-10 text-center pointer-events-none space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-950/85 border border-zinc-700/80 backdrop-blur-md shadow-lg">
              <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-widest">
                {wave === 5 ? '⚠️ FINAL BOSS: INFERNAL COMMANDER' : `WAVE ${wave} OF 5`}
              </span>
            </div>

            {bossHp && (
              <div className="w-72 sm:w-96 p-2.5 rounded-xl bg-zinc-950/90 border border-red-900/60 backdrop-blur-md shadow-2xl space-y-1 animate-in fade-in">
                <div className="flex justify-between items-center text-[10px] font-mono tracking-wider">
                  <span className="text-red-400 font-bold flex items-center gap-1">
                    <Skull className="w-3 h-3 text-red-500" /> INFERNAL COMMANDER TITAN
                  </span>
                  <span className="text-zinc-300 font-bold">
                    {bossHp.current} / {bossHp.max}
                  </span>
                </div>
                <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden border border-red-950">
                  <div
                    className="h-full bg-gradient-to-r from-red-700 via-rose-600 to-red-500 transition-all duration-150"
                    style={{ width: `${Math.max(0, (bossHp.current / bossHp.max) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Top-Right: Score, WPM, and Enemies Badge */}
          <div className="absolute top-14 right-4 z-10 flex items-center gap-2.5 pointer-events-none">
            <div className="px-3 py-1.5 rounded-xl bg-zinc-950/80 border border-zinc-800 backdrop-blur-md text-right shadow-xl">
              <span className="text-[9px] font-mono text-zinc-400 block uppercase">WPM</span>
              <span className="text-sm font-mono font-black text-emerald-400">{wpm}</span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-zinc-950/80 border border-zinc-800 backdrop-blur-md text-right shadow-xl">
              <span className="text-[9px] font-mono text-zinc-400 block uppercase">ACCURACY</span>
              <span className="text-sm font-mono font-black text-sky-400">{accuracy}%</span>
            </div>

            <div className="px-3.5 py-1.5 rounded-xl bg-zinc-950/80 border border-zinc-800 backdrop-blur-md text-right shadow-xl">
              <span className="text-[9px] font-mono text-zinc-400 block uppercase">SCORE</span>
              <span className="text-sm font-mono font-black text-amber-400">{score.toLocaleString()}</span>
            </div>
          </div>

          {/* PRIMARY COMBAT TYPING DECK (Center-Bottom) */}
          <div className="absolute inset-x-0 bottom-6 z-15 flex flex-col items-center pointer-events-none space-y-2">
            {/* Combo Multiplier Pill */}
            {combo > 1 && (
              <div className="animate-bounce">
                <div className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-600 to-orange-600 border border-amber-400 text-white font-mono font-black text-xs tracking-wider shadow-lg flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-yellow-300" />
                  <span>{combo}x COMBO • {comboMultiplier.toFixed(1)}x DAMAGE</span>
                </div>
              </div>
            )}

            {/* Glowing Combat Word Deck */}
            <div
              className={`px-6 py-3.5 rounded-2xl bg-zinc-950/90 border transition-all duration-150 backdrop-blur-md shadow-2xl flex flex-col items-center ${
                inputErrorShake ? 'border-red-500 translate-x-1 scale-105' : 'border-emerald-500/80 shadow-emerald-950/40'
              }`}
            >
              <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-0.5 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>TYPE TO EXECUTE {commandCategory.toUpperCase()}</span>
              </div>

              {/* Large Monospace Word Display with Character Feedback */}
              <div className="text-2xl sm:text-3xl font-mono font-black tracking-widest">
                <span className="text-emerald-400 drop-shadow-[0_0_12px_rgba(34,197,94,0.8)]">
                  {typedPart}
                </span>
                <span className="text-zinc-500 underline decoration-emerald-500/60 decoration-2 underline-offset-4">
                  {untypedPart}
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* READY SCREEN / MISSION BRIEFING */}
      {gameState === 'ready' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-zinc-950/85 backdrop-blur-md p-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-950/60 border border-red-700 text-red-400 font-mono text-xs font-bold tracking-widest uppercase">
            <Swords className="w-4 h-4 text-emerald-400" /> TYPING-POWERED 3D WARRIOR COMBAT
          </div>

          <div className="space-y-2 max-w-lg">
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              STICKMAN <span className="text-red-500">FIGHT</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
              Control your 3D crimson stickman warrior purely through typing! Type combat commands with speed and surgical
              precision to unleash fluid sword combos, acrobatic dodges, and parries.
            </p>
          </div>

          {/* Quick Typing Combat Briefing */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-xl w-full text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-left">
              <span className="text-zinc-500 block text-[10px]">ATTACK WORDS</span>
              <span className="text-emerald-400 font-bold">SLASH / STRIKE</span>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-left">
              <span className="text-zinc-500 block text-[10px]">HEAVY CLEAVE</span>
              <span className="text-amber-400 font-bold">CLEAVE / FLURRY</span>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-left">
              <span className="text-zinc-500 block text-[10px]">DEFENSIVE WORDS</span>
              <span className="text-sky-400 font-bold">BLOCK / PARRY</span>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-left">
              <span className="text-zinc-500 block text-[10px]">MOBILITY WORDS</span>
              <span className="text-purple-400 font-bold">DODGE / LEAP</span>
            </div>
          </div>

          <Button
            onClick={handleStartGame}
            className="px-8 py-3.5 bg-red-600 hover:bg-red-500 text-white font-mono font-bold tracking-wider rounded-xl shadow-lg shadow-red-900/40 cursor-pointer flex items-center gap-2 text-sm"
          >
            <Play className="w-4 h-4 fill-current text-white" />
            <span>START COMBAT</span>
          </Button>
        </div>
      )}

      {/* WAVE CLEARED BANNER */}
      {gameState === 'wave_cleared' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-zinc-950/60 backdrop-blur-xs p-6 text-center animate-in zoom-in-95 duration-300">
          <div className="p-8 rounded-2xl bg-zinc-950/95 border border-emerald-500/60 shadow-2xl space-y-3 max-w-md">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h2 className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">WAVE {wave} CLEARED!</h2>
            <div className="text-xs font-mono text-zinc-300 space-y-1">
              <p>Current Speed: <span className="text-emerald-400 font-bold">{wpm} WPM</span> | Accuracy: <span className="text-sky-400 font-bold">{accuracy}%</span></p>
              <p className="text-zinc-500">Restoring vitality... Summoning next wave.</p>
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER SCREEN */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-md p-6 text-center space-y-5">
          <Skull className="w-16 h-16 text-red-500 mx-auto" />
          <div className="space-y-1">
            <h2 className="text-3xl sm:text-4xl font-black text-white font-mono tracking-wider">STICKMAN FALLEN</h2>
            <p className="text-xs text-zinc-400">The shadow legion broke through your guard.</p>
          </div>

          {finalReport && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-lg w-full text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500 block text-[10px]">FINAL SCORE</span>
                <span className="text-base font-bold text-amber-400">{finalReport.score.toLocaleString()}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500 block text-[10px]">SPEED</span>
                <span className="text-base font-bold text-emerald-400">{finalReport.wpm} WPM</span>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500 block text-[10px]">ACCURACY</span>
                <span className="text-base font-bold text-sky-400">{finalReport.accuracy}%</span>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500 block text-[10px]">MAX COMBO</span>
                <span className="text-base font-bold text-purple-400">{finalReport.maxCombo}x</span>
              </div>
            </div>
          )}

          <Button
            onClick={handleStartGame}
            className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-mono font-bold tracking-wider rounded-xl shadow-lg shadow-red-900/40 cursor-pointer flex items-center gap-2 text-xs"
          >
            <RotateCcw className="w-4 h-4" />
            <span>TRY AGAIN</span>
          </Button>
        </div>
      )}

      {/* VICTORY DEBRIEF */}
      {gameState === 'victory' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-md p-6 text-center space-y-5">
          <Trophy className="w-16 h-16 text-amber-400 mx-auto animate-bounce" />
          <div className="space-y-1">
            <h2 className="text-3xl sm:text-4xl font-black text-amber-400 font-mono tracking-wider">SUPREME VICTORY!</h2>
            <p className="text-xs text-zinc-300">You vanquished the Infernal Commander through legendary typing combat.</p>
          </div>

          {finalReport && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-lg w-full text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-zinc-900 border border-amber-600/50">
                <span className="text-zinc-500 block text-[10px]">TOTAL SCORE</span>
                <span className="text-base font-bold text-amber-400">{finalReport.score.toLocaleString()}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500 block text-[10px]">PEAK WPM</span>
                <span className="text-base font-bold text-emerald-400">{finalReport.wpm} WPM</span>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500 block text-[10px]">ACCURACY</span>
                <span className="text-base font-bold text-sky-400">{finalReport.accuracy}%</span>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-500 block text-[10px]">ENEMIES DEFEATED</span>
                <span className="text-base font-bold text-red-400">{finalReport.enemiesDefeated}</span>
              </div>
            </div>
          )}

          <Button
            onClick={handleStartGame}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-mono font-bold tracking-wider rounded-xl shadow-lg shadow-amber-900/40 cursor-pointer flex items-center gap-2 text-xs"
          >
            <RotateCcw className="w-4 h-4" />
            <span>PLAY AGAIN</span>
          </Button>
        </div>
      )}

      {/* PAUSE MENU */}
      {gameState === 'paused' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-zinc-950/85 backdrop-blur-md p-6 text-center space-y-4">
          <h2 className="text-2xl font-black text-white font-mono tracking-wider">COMBAT PAUSED</h2>
          <div className="flex flex-col gap-2.5 w-52">
            <Button
              onClick={() => setGameState('playing')}
              className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold rounded-lg cursor-pointer"
            >
              RESUME
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowControlsModal(true)}
              className="w-full py-2.5 border-zinc-700 text-zinc-300 font-mono text-xs font-bold rounded-lg cursor-pointer"
            >
              CONTROLS
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowExitConfirm(true)}
              className="w-full py-2.5 border-zinc-700 text-zinc-400 hover:text-white font-mono text-xs rounded-lg cursor-pointer"
            >
              EXIT TO ARCADE
            </Button>
          </div>
        </div>
      )}

      {/* CONTROLS GUIDE MODAL */}
      {showControlsModal && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-zinc-950/85 backdrop-blur-md p-4">
          <div className="w-full max-w-md p-6 rounded-2xl bg-zinc-900 border border-zinc-700 shadow-2xl space-y-4 text-xs font-mono">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="text-sm font-bold text-white flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-emerald-400" /> STICKMAN FIGHT CONTROLS GUIDE
              </span>
              <button
                type="button"
                onClick={() => setShowControlsModal(false)}
                className="text-zinc-400 hover:text-white text-base cursor-pointer font-sans"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-zinc-300">
              <p className="text-zinc-400 leading-relaxed font-sans pb-1">
                Your keyboard is your martial weapon! Correctly and quickly type the displayed words to trigger actions.
              </p>
              <div className="flex justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-500">Attack Commands</span>
                <span className="text-emerald-400 font-bold">Type: SLASH, STRIKE, CUT, JAB</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-500">Heavy Cleaves</span>
                <span className="text-amber-400 font-bold">Type: CLEAVE, FLURRY, CYCLONE</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-500">Defensive Wards</span>
                <span className="text-sky-400 font-bold">Type: BLOCK, PARRY, DEFLECT</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-500">Acrobatic Dodges</span>
                <span className="text-purple-400 font-bold">Type: DODGE, ROLL, LEAP, DASH</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-500">Pause Combat</span>
                <span className="text-zinc-200">Escape Key</span>
              </div>
            </div>

            <Button
              onClick={() => setShowControlsModal(false)}
              className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs rounded-lg cursor-pointer"
            >
              READY TO FIGHT
            </Button>
          </div>
        </div>
      )}

      {/* Global Performance Settings Modal */}
      <GlobalGameSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Exit Dialog */}
      <ArcadeExitDialog
        isOpen={showExitConfirm}
        onConfirm={onExit}
        onCancel={() => setShowExitConfirm(false)}
        title="Leave Stickman Fight?"
        message="Your active combat wave and Flow combo streak will not be saved. Are you sure you wish to return to the Arcade?"
      />
    </div>
  );
};
