import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import {
  Shield,
  ShieldAlert,
  Swords,
  RotateCcw,
  Play,
  Pause,
  ArrowLeft,
  Trophy,
  Skull,
  Crosshair,
  Zap,
  Volume2,
  VolumeX,
  HelpCircle,
  Flame,
  CheckCircle,
  Eye,
  Sliders,
} from 'lucide-react';
import { Button } from '../../common/Button';
import { ArcadeExitDialog } from '../ArcadeExitDialog';
import { saveArcadeRecord, getGameRecord } from '../../../utils/arcadeStorage';
import { GlobalGameManager } from '../../../utils/performance/GlobalGameManager';
import { GlobalGameSettingsModal } from '../performance/GlobalGameSettingsModal';

import { Warrior3DAudio } from '../warrior3d/Warrior3DAudio';
import { Warrior3DEnvironment } from '../warrior3d/Warrior3DEnvironment';
import { Warrior3DPlayer } from '../warrior3d/Warrior3DPlayer';
import { Warrior3DCamera } from '../warrior3d/Warrior3DCamera';
import { Warrior3DEnemies } from '../warrior3d/Warrior3DEnemies';
import { Warrior3DCombatSystem } from '../warrior3d/Warrior3DCombatSystem';

export const WarriorFightingGame = ({ onExit, soundEnabled = true }) => {
  // Game states: 'ready' | 'playing' | 'wave_cleared' | 'paused' | 'gameover' | 'victory'
  const [gameState, setGameState] = useState('ready');
  const [soundOn, setSoundOn] = useState(soundEnabled);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showControlsModal, setShowControlsModal] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // HUD Stats
  const [wave, setWave] = useState(1);
  const [playerHp, setPlayerHp] = useState(100);
  const [playerStamina, setPlayerStamina] = useState(100);
  const [combo, setCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [enemiesRemaining, setEnemiesRemaining] = useState(1);
  const [bossHp, setBossHp] = useState(null); // null or { current, max }
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  const [isTargetLocked, setIsTargetLocked] = useState(false);
  const [targetScreenPos, setTargetScreenPos] = useState(null);

  // High score record
  const [highScore, setHighScore] = useState(0);
  const [enemiesKilledTotal, setEnemiesKilledTotal] = useState(0);

  // Refs for 3D engine components
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
  const animationFrameRef = useRef(null);
  const lastTimeRef = useRef(0);

  // Keyboard & mouse input state
  const inputRef = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
  });

  // Load high score
  useEffect(() => {
    const record = getGameRecord('warrior');
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
   * Initialize Three.js viewport and engine instances
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 960;
    const height = Math.max(520, Math.min(680, window.innerHeight * 0.72));

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(58, width / height, 0.1, 150);
    camera.position.set(0, 2.5, 6);
    cameraRef.current = camera;

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 3. Audio Engine
    const audio = new Warrior3DAudio();
    audio.setEnabled(soundOn);
    audioRef.current = audio;

    // 4. Environment
    const env = new Warrior3DEnvironment(scene, 'cursed_forest');
    envRef.current = env;

    // 5. Player
    const player = new Warrior3DPlayer(scene, audio);
    playerRef.current = player;

    // 6. Camera Controller
    const cameraController = new Warrior3DCamera(camera, renderer.domElement);
    cameraController.onLockChange((locked) => {
      setIsPointerLocked(locked);
    });
    cameraControllerRef.current = cameraController;

    // 7. Group Enemies
    const enemies = new Warrior3DEnemies(scene, audio);
    enemiesRef.current = enemies;

    // 8. Combat System
    const combat = new Warrior3DCombatSystem(scene, audio);
    combatRef.current = combat;

    // 9. Window Resize Handler
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
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (cameraControllerRef.current) {
        cameraControllerRef.current.destroy();
      }
      if (audioRef.current) {
        audioRef.current.stopAmbientHum();
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  /**
   * Keyboard & Mouse Input Listeners
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing') {
        if (e.key === 'Escape' && gameState === 'paused') {
          setGameState('playing');
        }
        return;
      }

      const key = e.key.toLowerCase();

      // Movement keys
      if (key === 'w' || key === 'arrowup') inputRef.current.forward = true;
      if (key === 's' || key === 'arrowdown') inputRef.current.backward = true;
      if (key === 'a' || key === 'arrowleft') inputRef.current.left = true;
      if (key === 'd' || key === 'arrowright') inputRef.current.right = true;
      if (key === 'shift') inputRef.current.sprint = true;

      // Combat actions
      if (key === 'j') {
        // Light attack combo
        playerRef.current?.performLightAttack();
      } else if (key === 'k') {
        // Heavy cleave
        playerRef.current?.performHeavyAttack();
      } else if (key === 'l') {
        // Whirlwind special
        playerRef.current?.performWhirlwindAttack();
      } else if (key === 'f') {
        // Guard / Block
        playerRef.current?.startBlock();
      } else if (key === 'c') {
        // Quick Parry flick
        playerRef.current?.performParry();
      } else if (key === ' ' || key === 'q' || key === 'e') {
        // Dodge Roll
        e.preventDefault();
        playerRef.current?.performDodge();
      } else if (key === 'tab') {
        // Target Lock toggle
        e.preventDefault();
        if (cameraControllerRef.current && playerRef.current && enemiesRef.current) {
          const target = cameraControllerRef.current.toggleTargetLock(
            enemiesRef.current.enemies,
            playerRef.current.position
          );
          setIsTargetLocked(Boolean(target));
        }
      } else if (key === 'escape') {
        // Pause
        setGameState('paused');
        cameraControllerRef.current?.exitLock();
      }
    };

    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') inputRef.current.forward = false;
      if (key === 's' || key === 'arrowdown') inputRef.current.backward = false;
      if (key === 'a' || key === 'arrowleft') inputRef.current.left = false;
      if (key === 'd' || key === 'arrowright') inputRef.current.right = false;
      if (key === 'shift') inputRef.current.sprint = false;

      if (key === 'f') {
        playerRef.current?.stopBlock();
      }
    };

    const handleMouseDown = (e) => {
      if (gameState !== 'playing') return;

      if (e.button === 0) {
        // Left click: Light attack combo
        playerRef.current?.performLightAttack();
      } else if (e.button === 2) {
        // Right click: Heavy attack cleave
        e.preventDefault();
        playerRef.current?.performHeavyAttack();
      }
    };

    const handleContextMenu = (e) => {
      if (gameState === 'playing') {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [gameState]);

  /**
   * Start New Game / Start Wave
   */
  const handleStartGame = useCallback(() => {
    if (!playerRef.current || !enemiesRef.current || !envRef.current) return;

    setWave(1);
    setScore(0);
    setEnemiesKilledTotal(0);
    setPlayerHp(100);
    setPlayerStamina(100);
    setCombo(0);
    setBossHp(null);

    // Environment stage selection
    envRef.current.buildStage('cursed_forest');

    // Reset Player
    playerRef.current.reset(0, 8);

    // Spawn Wave 1
    enemiesRef.current.startWave(1);
    setEnemiesRemaining(enemiesRef.current.getAliveCount());

    setGameState('playing');

    // Start dark fantasy ambient music
    if (audioRef.current && soundOn) {
      audioRef.current.startAmbientHum();
    }

    // Auto-request pointer lock for convenience
    setTimeout(() => {
      cameraControllerRef.current?.requestLock();
    }, 100);
  }, [soundOn]);

  /**
   * Advance to Next Wave
   */
  const handleAdvanceWave = useCallback((nextWave) => {
    if (!playerRef.current || !enemiesRef.current || !envRef.current) return;

    setWave(nextWave);

    // Set thematic stage per wave progression
    if (nextWave <= 2) {
      envRef.current.buildStage('cursed_forest');
    } else if (nextWave <= 4) {
      envRef.current.buildStage('dark_castle');
    } else {
      envRef.current.buildStage('infernal_fortress');
    }

    // Restore partial health and full stamina between waves
    playerRef.current.health = Math.min(100, playerRef.current.health + 35);
    playerRef.current.stamina = 100;
    playerRef.current.position.set(0, 0, 8);

    // Spawn wave enemies
    enemiesRef.current.startWave(nextWave);
    setEnemiesRemaining(enemiesRef.current.getAliveCount());

    setGameState('playing');
  }, []);

  /**
   * Main Render & Game Loop
   */
  useEffect(() => {
    let animId = null;

    const gameLoop = (currentTime) => {
      animId = requestAnimationFrame(gameLoop);
      animationFrameRef.current = animId;

      if (!lastTimeRef.current) lastTimeRef.current = currentTime;
      const rawDelta = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;
      const delta = Math.min(rawDelta, 0.05); // Cap to avoid huge skips

      const player = playerRef.current;
      const enemies = enemiesRef.current;
      const cameraController = cameraControllerRef.current;
      const combat = combatRef.current;
      const env = envRef.current;
      const renderer = rendererRef.current;
      const scene = sceneRef.current;
      const camera = cameraRef.current;

      if (!player || !enemies || !cameraController || !combat || !renderer || !scene || !camera) return;

      if (gameState === 'playing') {
        // 1. Update Player
        player.update(delta, inputRef.current, cameraController, env);

        // 2. Update Group Enemies
        enemies.update(delta, player.position, env);

        // 3. Update Camera Orbit & Follow
        cameraController.update(delta, player.position);

        // 4. Update Combat & Swept Weapon Hit Collision
        combat.checkPlayerAttacks(player, enemies.enemies);
        combat.checkEnemyAttacks(enemies.enemies, player);
        combat.update(delta);

        // 5. Update Atmospheric Environment
        if (env) env.update(delta);

        // 6. Check Target Lock Screen Coordinate
        if (cameraController.isTargetLocked && cameraController.lockedTarget && cameraController.lockedTarget.isAlive) {
          const targetWorldPos = cameraController.lockedTarget.position.clone();
          targetWorldPos.y += 1.4;
          targetWorldPos.project(camera);

          const canvas = renderer.domElement;
          const sx = (targetWorldPos.x * 0.5 + 0.5) * canvas.clientWidth;
          const sy = (-targetWorldPos.y * 0.5 + 0.5) * canvas.clientHeight;
          setTargetScreenPos({ x: sx, y: sy });
          setIsTargetLocked(true);
        } else {
          setTargetScreenPos(null);
          setIsTargetLocked(false);
        }

        // 7. Sync HUD State
        setPlayerHp(Math.round(player.health));
        setPlayerStamina(Math.round(player.stamina));
        setCombo(player.comboCount);
        setScore(player.totalScore);

        const aliveCount = enemies.getAliveCount();
        setEnemiesRemaining(aliveCount);

        const boss = enemies.getBoss();
        if (boss) {
          setBossHp({ current: boss.health, max: boss.maxHealth });
        } else {
          setBossHp(null);
        }

        // 8. Game Over Check
        if (!player.isAlive && player.animEngine.stateTimer >= 1.4) {
          setGameState('gameover');
          cameraController.exitLock();
          if (player.totalScore > highScore) {
            setHighScore(player.totalScore);
            saveArcadeRecord('warrior', { highScore: player.totalScore, waveReached: wave });
          }
        }

        // 9. Wave Cleared / Victory Check
        if (aliveCount === 0 && player.isAlive) {
          if (wave >= 5) {
            // Defeated Boss in final wave: VICTORY!
            setGameState('victory');
            cameraController.exitLock();
            if (player.totalScore > highScore) {
              setHighScore(player.totalScore);
              saveArcadeRecord('warrior', { highScore: player.totalScore, waveReached: 5 });
            }
          } else {
            // Wave cleared! Transition banner
            setGameState('wave_cleared');
            cameraController.exitLock();
            setTimeout(() => {
              handleAdvanceWave(wave + 1);
            }, 2400);
          }
        }
      } else if (gameState === 'ready' || gameState === 'paused') {
        // Idle camera spin during ready screen
        if (gameState === 'ready' && player) {
          player.animEngine.update(delta, { x: 0, z: 0 }, false);
          cameraController.yaw += delta * 0.25;
          cameraController.update(delta, player.position);
          if (env) env.update(delta);
        }
      }

      // Render Scene
      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [gameState, wave, highScore, handleAdvanceWave]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-2xl select-none font-sans">
      {/* Top Header Controls Bar */}
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

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/40 border border-red-800/50 text-red-400 text-xs font-mono font-bold tracking-wider">
            <Swords className="w-3.5 h-3.5" />
            <span>DARK WARRIOR 3D</span>
          </div>
        </div>

        {/* Right side options: Controls, Settings, Sound */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowControlsModal(true)}
            className="p-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 hover:text-white transition-all cursor-pointer"
            title="Controls Guide"
            aria-label="Controls Guide"
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
        onClick={() => {
          if (gameState === 'playing' && !isPointerLocked) {
            cameraControllerRef.current?.requestLock();
          }
        }}
        className="relative w-full h-[540px] sm:h-[620px] cursor-crosshair overflow-hidden"
      />

      {/* IN-GAME HUD OVERLAYS */}
      {gameState === 'playing' && (
        <>
          {/* Top-Left: Player Vital Bars */}
          <div className="absolute top-14 left-4 z-10 w-60 sm:w-72 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 backdrop-blur-md space-y-2 pointer-events-none shadow-xl">
            {/* Health Bar */}
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

            {/* Stamina Bar */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px] font-mono tracking-wider">
                <span className="text-zinc-400 font-bold uppercase flex items-center gap-1">
                  <Zap className="w-3 h-3 text-cyan-400" /> STAMINA
                </span>
                <span className="text-cyan-300 font-bold">{playerStamina} / 100</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className="h-full bg-gradient-to-r from-cyan-600 to-sky-400 transition-all duration-75"
                  style={{ width: `${Math.max(0, playerStamina)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Top-Center: Wave Badge & Boss HP Bar */}
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-10 text-center pointer-events-none space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-950/85 border border-zinc-700/80 backdrop-blur-md shadow-lg">
              <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-widest">
                {wave === 5 ? '⚠️ FINAL BOSS WAVE' : `WAVE ${wave} OF 5`}
              </span>
            </div>

            {/* Boss Health Bar (Wave 5) */}
            {bossHp && (
              <div className="w-72 sm:w-96 p-2.5 rounded-xl bg-zinc-950/90 border border-red-900/60 backdrop-blur-md shadow-2xl space-y-1 animate-in fade-in">
                <div className="flex justify-between items-center text-[10px] font-mono tracking-wider">
                  <span className="text-red-400 font-bold flex items-center gap-1">
                    <Skull className="w-3 h-3 text-red-500" /> DARK COMMANDER TITAN
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

          {/* Top-Right: Score & Remaining Enemies */}
          <div className="absolute top-14 right-4 z-10 flex items-center gap-3 pointer-events-none">
            <div className="px-3.5 py-2 rounded-xl bg-zinc-950/80 border border-zinc-800 backdrop-blur-md text-right shadow-xl">
              <span className="text-[10px] font-mono text-zinc-400 block uppercase">SCORE</span>
              <span className="text-base font-mono font-black text-amber-400">{score.toLocaleString()}</span>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-zinc-950/80 border border-zinc-800 backdrop-blur-md text-right shadow-xl">
              <span className="text-[10px] font-mono text-zinc-400 block uppercase">ENEMIES</span>
              <span className="text-base font-mono font-black text-red-400">{enemiesRemaining}</span>
            </div>
          </div>

          {/* Floating Combo Counter */}
          {combo > 1 && (
            <div className="absolute bottom-20 left-8 z-10 animate-bounce pointer-events-none">
              <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600/90 to-orange-600/90 border border-amber-400 text-white font-mono font-black text-lg tracking-wider shadow-2xl flex items-center gap-2">
                <Flame className="w-5 h-5 text-yellow-300" />
                <span>{combo}x COMBO!</span>
              </div>
            </div>
          )}

          {/* Target Lock 2D Screen Reticle */}
          {isTargetLocked && targetScreenPos && (
            <div
              className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 z-10 animate-spin"
              style={{
                left: `${targetScreenPos.x}px`,
                top: `${targetScreenPos.y}px`,
                animationDuration: '6s',
              }}
            >
              <div className="w-10 h-10 border-2 border-red-500 rounded-xs rotate-45 shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
            </div>
          )}

          {/* Click to Lock Mouse Prompt if Pointer Lock is inactive */}
          {!isPointerLocked && (
            <div className="absolute inset-x-0 bottom-6 z-15 flex justify-center pointer-events-none">
              <div className="px-4 py-2 rounded-full bg-zinc-950/90 border border-zinc-700 text-xs font-mono text-zinc-200 shadow-xl backdrop-blur-md animate-pulse flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-amber-400" />
                <span>CLICK CANVAS TO ENGAGE COMBAT CONTROLS</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* READY SCREEN / MISSION BRIEFING */}
      {gameState === 'ready' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-zinc-950/85 backdrop-blur-md p-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-950/60 border border-red-800 text-red-400 font-mono text-xs font-bold tracking-widest uppercase">
            <Swords className="w-4 h-4" /> AAA 3D ACTION MASTERPIECE
          </div>

          <div className="space-y-2 max-w-lg">
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              DARK WARRIOR <span className="text-red-500">3D</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans">
              Enter the dark fantasy realm. Engage in visceral third-person sword combat against simultaneous enemy legions
              and defeat the Supreme Dark Commander.
            </p>
          </div>

          {/* Quick Controls Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-xl w-full text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-left">
              <span className="text-zinc-500 block text-[10px]">MOVEMENT</span>
              <span className="text-zinc-200 font-bold">WASD / Shift</span>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-left">
              <span className="text-zinc-500 block text-[10px]">LIGHT COMBO</span>
              <span className="text-zinc-200 font-bold">Left-Click / J</span>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-left">
              <span className="text-zinc-500 block text-[10px]">HEAVY CLEAVE</span>
              <span className="text-zinc-200 font-bold">Right-Click / K</span>
            </div>
            <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-left">
              <span className="text-zinc-500 block text-[10px]">BLOCK & PARRY</span>
              <span className="text-zinc-200 font-bold">F (Hold) / C</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleStartGame}
              className="px-8 py-3.5 bg-red-600 hover:bg-red-500 text-white font-mono font-bold tracking-wider rounded-xl shadow-lg shadow-red-900/40 cursor-pointer flex items-center gap-2 text-sm"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>COMMENCE BATTLE</span>
            </Button>
          </div>
        </div>
      )}

      {/* WAVE CLEARED BANNER */}
      {gameState === 'wave_cleared' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-zinc-950/60 backdrop-blur-xs p-6 text-center animate-in zoom-in-95 duration-300">
          <div className="p-8 rounded-2xl bg-zinc-950/90 border border-amber-500/50 shadow-2xl space-y-3 max-w-md">
            <CheckCircle className="w-12 h-12 text-amber-400 mx-auto animate-bounce" />
            <h2 className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">WAVE {wave} CLEARED</h2>
            <p className="text-xs text-zinc-400">Restoring vitality... Preparing next legion.</p>
          </div>
        </div>
      )}

      {/* GAME OVER SCREEN */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-md p-6 text-center space-y-6">
          <Skull className="w-16 h-16 text-red-500 mx-auto" />
          <div className="space-y-1">
            <h2 className="text-3xl sm:text-4xl font-black text-white font-mono tracking-wider">YOU HAVE FALLEN</h2>
            <p className="text-xs text-zinc-400">The dark shadows overwhelmed your blade.</p>
          </div>

          <div className="flex items-center justify-center gap-4 text-xs font-mono">
            <div className="px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-500 block text-[10px]">FINAL SCORE</span>
              <span className="text-lg font-bold text-amber-400">{score.toLocaleString()}</span>
            </div>
            <div className="px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-500 block text-[10px]">WAVE REACHED</span>
              <span className="text-lg font-bold text-zinc-200">{wave} / 5</span>
            </div>
          </div>

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
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-md p-6 text-center space-y-6">
          <Trophy className="w-16 h-16 text-amber-400 mx-auto animate-bounce" />
          <div className="space-y-1">
            <h2 className="text-3xl sm:text-4xl font-black text-amber-400 font-mono tracking-wider">VICTORY ACHIEVED!</h2>
            <p className="text-xs text-zinc-300">The Dark Commander Titan has been defeated.</p>
          </div>

          <div className="flex items-center justify-center gap-4 text-xs font-mono">
            <div className="px-5 py-3 rounded-xl bg-zinc-900 border border-amber-600/50">
              <span className="text-zinc-500 block text-[10px]">TOTAL SCORE</span>
              <span className="text-xl font-bold text-amber-400">{score.toLocaleString()}</span>
            </div>
            <div className="px-5 py-3 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-500 block text-[10px]">ALL 5 WAVES</span>
              <span className="text-xl font-bold text-emerald-400">CONQUERED</span>
            </div>
          </div>

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
          <h2 className="text-2xl font-black text-white font-mono tracking-wider">BATTLE PAUSED</h2>
          <div className="flex flex-col gap-2.5 w-52">
            <Button
              onClick={() => {
                setGameState('playing');
                cameraControllerRef.current?.requestLock();
              }}
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
              EXIT MISSION
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
                <HelpCircle className="w-4 h-4 text-amber-400" /> COMBAT CONTROLS GUIDE
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
              <div className="flex justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-500">Camera / Look</span>
                <span className="text-zinc-200">Mouse Move (Pointer Lock)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-500">Camera-Relative Move</span>
                <span className="text-zinc-200">W, A, S, D / Arrow Keys</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-500">Sprint Dash</span>
                <span className="text-zinc-200">Shift</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-500">Light Attack (3-Hit Combo)</span>
                <span className="text-amber-400">Left-Click or J</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-500">Heavy Cleave (Poise Break)</span>
                <span className="text-amber-400">Right-Click or K</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-500">Whirlwind 360° Special</span>
                <span className="text-amber-400">L Key</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-500">Defensive Shield Block</span>
                <span className="text-cyan-400">Hold F (Blocks 75% DMG)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-500">Precision Parry</span>
                <span className="text-yellow-400">C Key (Negates & Stuns)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-500">Evasive Dodge Roll</span>
                <span className="text-emerald-400">Space, Q, or E</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-500">Lock Target Focus</span>
                <span className="text-red-400">Tab Key</span>
              </div>
            </div>

            <Button
              onClick={() => setShowControlsModal(false)}
              className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs rounded-lg cursor-pointer"
            >
              GOT IT
            </Button>
          </div>
        </div>
      )}

      {/* Global Performance Settings Modal */}
      <GlobalGameSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Exit Confirmation Dialog */}
      <ArcadeExitDialog
        isOpen={showExitConfirm}
        onConfirm={onExit}
        onCancel={() => setShowExitConfirm(false)}
        title="Abandon Battle?"
        message="Your current mission wave progress will not be saved. Are you sure you wish to return to the Arcade?"
      />
    </div>
  );
};
