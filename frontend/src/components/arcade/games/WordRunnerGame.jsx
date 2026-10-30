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
  Compass,
} from 'lucide-react';
import { Button } from '../../common/Button';
import { calculateAccuracy, calculateWpm } from '../../../utils/arcadeEngine';
import { saveArcadeRecord, getGameRecord } from '../../../utils/arcadeStorage';
import { calculateDifficultyTier, getWordRunnerConfig } from '../../../utils/arcadeDifficulty';
import { ArcadeExitDialog } from '../ArcadeExitDialog';
import { useI18n } from '../../../i18n/I18nContext';

import { Runner3DScene } from '../runner3d/Runner3DScene';
import { Runner3DPlayer } from '../runner3d/Runner3DPlayer';
import { Runner3DTrack } from '../runner3d/Runner3DTrack';
import { Runner3DObstacles, ACTION_STYLES } from '../runner3d/Runner3DObstacles';
import { runnerAudio } from '../runner3d/Runner3DAudio';

const TRACK_LENGTH = 1000; // 1,000 meters to victory

/**
 * THEMATIC TYPING ACTION VOCABULARIES
 * Categorized by movement action and difficulty tiers
 */
const ACTION_VOCABULARIES = {
  jump: {
    tier1: ['hop', 'jump', 'leap', 'skip', 'rise'],
    tier2: ['vault', 'bound', 'spring', 'bounce', 'ascend'],
    tier3: ['elevate', 'propel', 'soar', 'launch', 'overleap'],
  },
  slide: {
    tier1: ['duck', 'drop', 'sink', 'skid', 'flat'],
    tier2: ['slide', 'glide', 'crawl', 'crouch', 'under'],
    tier3: ['slither', 'evade', 'descend', 'submerge', 'underslip'],
  },
  hack: {
    tier1: ['hack', 'slam', 'kick', 'fist', 'dash'],
    tier2: ['smash', 'break', 'blast', 'strike', 'clash'],
    tier3: ['breach', 'destroy', 'demolish', 'pulverize', 'annihilate'],
  },
  lane_left: {
    tier1: ['left', 'port', 'west', 'lean'],
    tier2: ['drift', 'shift', 'dodge', 'veer'],
    tier3: ['sidestep', 'deflect', 'swerve', 'flankleft'],
  },
  lane_right: {
    tier1: ['east', 'dash', 'slip', 'turn'],
    tier2: ['right', 'swerve', 'flank', 'blade'],
    tier3: ['starboard', 'traverse', 'maneuver', 'flankright'],
  },
  lane_center: {
    tier1: ['mid', 'core', 'axis'],
    tier2: ['center', 'focus', 'align', 'nexus'],
    tier3: ['central', 'converge', 'middle', 'midstream'],
  },
  bridge: {
    tier1: ['beam', 'path', 'span', 'flux'],
    tier2: ['bridge', 'photon', 'matrix', 'portal'],
    tier3: ['construct', 'nanotech', 'quantum', 'lightspan'],
  },
  boost: {
    tier1: ['gem', 'star', 'glow', 'rush'],
    tier2: ['boost', 'turbo', 'hyper', 'spark'],
    tier3: ['overdrive', 'velocity', 'catalyst', 'momentum'],
  },
};

function pickWordForAction(actionType, tier = 1, usedWords = []) {
  const group = ACTION_VOCABULARIES[actionType] || ACTION_VOCABULARIES.jump;
  const pool = tier >= 3 ? group.tier3 : tier === 2 ? group.tier2 : group.tier1;
  const available = pool.filter((w) => !usedWords.includes(w));
  const candidates = available.length > 0 ? available : pool;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

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

  // Active Target Action HUD State
  const [activeTarget, setActiveTarget] = useState(null); // { id, word, type, typedCount }
  const [visibleOptions, setVisibleOptions] = useState([]); // upcoming simultaneous choices

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
  const nextSpawnDistanceRef = useRef(35);

  const personalBest = getGameRecord('runner');

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

  // Three.js Engine Container Ref
  const threeRef = useRef({
    scene: null,
    player: null,
    track: null,
    obstacles: null,
    typedBuffer: '',
    activeTargetId: null,
    playerZ: 0,
    speed: 15.0,
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
    setActiveTarget(null);
    setVisibleOptions([]);
    setPersonalBestNotice(false);
    nextSpawnDistanceRef.current = 35;

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
    threeRef.current.activeTargetId = null;
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
    threeRef.current.speed = 15.0;
    threeRef.current.typedBuffer = '';
    threeRef.current.activeTargetId = null;

    let lastTime = performance.now();

    const loop = (time) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      const isPlaying = gameStateRef.current === 'playing';

      if (isPlaying) {
        // Forward speed scales gracefully with distance: 15 m/s -> 25 m/s
        const speed = 15.0 + Math.min(10.0, (threeRef.current.playerZ / 120) * 1.3);
        player.speed = speed;
        threeRef.current.playerZ += speed * dt;
        player.group.position.z = threeRef.current.playerZ;

        setDistance(Math.min(TRACK_LENGTH, threeRef.current.playerZ));

        // Victory condition: 1,000 meters reached!
        if (threeRef.current.playerZ >= TRACK_LENGTH) {
          setGameState('victory');
        }

        // 1. PROCEDURAL ENCOUNTER GENERATION (Typing-controlled action choices)
        if (threeRef.current.playerZ + 60 > nextSpawnDistanceRef.current) {
          const spawnZ = nextSpawnDistanceRef.current;
          const currentDist = threeRef.current.playerZ;
          const currentTier = currentDist > 700 ? 3 : currentDist > 300 ? 2 : 1;
          const usedWords = obstacles.obstacles.map((o) => o.word);

          // Determine current player lane (-1, 0, 1)
          const curLane = player.lane;

          if (currentDist < 200) {
            // Stage 1 (Beginner): Single clear obstacle in player's lane with generous approach
            const actions = ['jump', 'slide', 'hack', 'boost'];
            const act = actions[Math.floor(Math.random() * actions.length)];
            const word = pickWordForAction(act, 1, usedWords);

            obstacles.spawnObstacle({
              word,
              type: act,
              lane: act === 'boost' ? Math.floor(Math.random() * 3) - 1 : curLane,
              z: spawnZ,
            });

            nextSpawnDistanceRef.current += 38;
          } else {
            // Stage 2+ (Intermediate to Advanced): MULTIPLE SIMULTANEOUS WORD OPTIONS
            // Option A: An obstacle in player's current lane (JUMP, SLIDE, or HACK)
            const obsActions = ['jump', 'slide', 'hack'];
            const obsAct = obsActions[Math.floor(Math.random() * obsActions.length)];
            const obsWord = pickWordForAction(obsAct, currentTier, usedWords);

            obstacles.spawnObstacle({
              word: obsWord,
              type: obsAct,
              lane: curLane,
              z: spawnZ,
            });
            usedWords.push(obsWord);

            // Option B: A Lane Switch Navigation Choice in an adjacent lane
            const possibleLaneSwitches = [];
            if (curLane > -1) possibleLaneSwitches.push({ type: 'lane_left', lane: curLane - 1 });
            if (curLane < 1) possibleLaneSwitches.push({ type: 'lane_right', lane: curLane + 1 });
            if (curLane !== 0) possibleLaneSwitches.push({ type: 'lane_center', lane: 0 });

            if (possibleLaneSwitches.length > 0) {
              const navChoice = possibleLaneSwitches[Math.floor(Math.random() * possibleLaneSwitches.length)];
              const navWord = pickWordForAction(navChoice.type, currentTier, usedWords);

              obstacles.spawnObstacle({
                word: navWord,
                type: navChoice.type,
                lane: navChoice.lane,
                z: spawnZ - 4, // slightly earlier so player can choose to swerve
              });
              usedWords.push(navWord);
            }

            // High tiers: add occasional floating bonus crystal in open lane
            if (Math.random() > 0.55) {
              const openLanes = [-1, 0, 1].filter((l) => l !== curLane);
              if (openLanes.length > 0) {
                const crystalLane = openLanes[Math.floor(Math.random() * openLanes.length)];
                const boostWord = pickWordForAction('boost', currentTier, usedWords);
                obstacles.spawnObstacle({
                  word: boostWord,
                  type: 'boost',
                  lane: crystalLane,
                  z: spawnZ + 8,
                });
              }
            }

            const spacing = Math.max(26, 38 - Math.floor(currentDist / 120) * 2.5);
            nextSpawnDistanceRef.current += spacing;
          }
        }

        // 2. Active Options & Proximity Collision Evaluation
        const upcoming = obstacles.obstacles.filter(
          (o) => !o.cleared && o.z > threeRef.current.playerZ - 2.5
        );
        upcoming.sort((a, b) => a.z - b.z);

        // Update visible upcoming options on HUD
        setVisibleOptions(
          upcoming.slice(0, 3).map((o) => ({
            id: o.id,
            word: o.word,
            type: o.type,
            lane: o.lane,
            dist: Math.round(o.z - threeRef.current.playerZ),
            typedCount: o.typedCount,
          }))
        );

        // Target currently locked on
        const lockedTarget = upcoming.find((o) => o.id === threeRef.current.activeTargetId);
        if (lockedTarget) {
          setActiveTarget({
            id: lockedTarget.id,
            word: lockedTarget.word,
            type: lockedTarget.type,
            typedCount: lockedTarget.typedCount,
          });
        } else if (upcoming.length > 0) {
          // If no target locked, highlight the nearest obstacle in or adjacent to player lane
          const priority = upcoming.find((o) => o.lane === player.lane) || upcoming[0];
          setActiveTarget({
            id: priority.id,
            word: priority.word,
            type: priority.type,
            typedCount: priority.typedCount,
          });
        } else {
          setActiveTarget(null);
        }

        // Proximity collision detection for obstacles in current player lane
        for (const obs of upcoming) {
          const distToObs = obs.z - threeRef.current.playerZ;

          // Critical collision zone: 1.2m before to 0.6m behind
          if (distToObs <= 1.2 && distToObs >= -0.6 && !obs.hit && !obs.cleared) {
            const isInSameLane = obs.lane === player.lane;
            const isSafeJump = obs.type === 'jump' && player.state === 'jumping';
            const isSafeSlide = obs.type === 'slide' && player.state === 'sliding';
            const isNavNode = obs.type.startsWith('lane_') || obs.type === 'bridge';
            const isCrystal = obs.type === 'boost';

            if (!isInSameLane) {
              // Safely bypassed by being in a different lane!
              obs.cleared = true;
              obstacles.clearObstacle(obs);
              setObstaclesCleared((c) => c + 1);
              setScore((s) => s + 150);
            } else if (isSafeJump || isSafeSlide || isNavNode) {
              // Safely vaulted or passed through!
              obs.cleared = true;
              obstacles.clearObstacle(obs);
              setObstaclesCleared((c) => c + 1);
              setScore((s) => s + 250);
            } else if (isCrystal) {
              // Collected crystal
              obs.cleared = true;
              obstacles.clearObstacle(obs);
              runnerAudio.playCrystal();
              setScore((s) => s + 400);
            } else {
              // COLLISION IMPACT! Player reached obstacle without performing required typing action
              obs.hit = true;
              obs.cleared = true;
              obstacles.clearObstacle(obs);

              player.stumble();
              scene.triggerShake(0.55);
              runnerAudio.playStumble();

              setStumbles((s) => s + 1);
              setCombo(0);
              threeRef.current.typedBuffer = '';
              threeRef.current.activeTargetId = null;

              setLives((prev) => {
                const next = Math.max(0, prev - 1);
                if (next <= 0) {
                  setGameState('gameover');
                }
                return next;
              });
            }
          }
        }

        // 3. Update 3D Track, Obstacles, Player, and Camera
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

  // =========================================================================
  // TYPING-PRIMARY KEYBOARD CONTROL SYSTEM (NO WASD OR ARROW KEYS REQUIRED)
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

      // Backspace: erase last character or release lock-on
      if (e.key === 'Backspace') {
        e.preventDefault();
        const activeId = threeRef.current.activeTargetId;
        if (activeId) {
          const target = obstacles.obstacles.find((o) => o.id === activeId);
          const currentBuf = threeRef.current.typedBuffer || '';

          if (currentBuf.length > 1) {
            const nextBuf = currentBuf.slice(0, -1);
            threeRef.current.typedBuffer = nextBuf;
            if (target) obstacles.setTypedProgress(target, nextBuf.length, true);
          } else {
            // Release lock-on
            threeRef.current.typedBuffer = '';
            threeRef.current.activeTargetId = null;
            if (target) obstacles.setTypedProgress(target, 0, false);
          }
        }
        return;
      }

      // Ignore modifiers, arrows, F-keys
      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      e.preventDefault();
      const char = e.key.toLowerCase();
      setTotalStrokes((s) => s + 1);

      const activeId = threeRef.current.activeTargetId;
      const currentBuf = threeRef.current.typedBuffer || '';

      // 1. If currently locked onto a target
      if (activeId) {
        const target = obstacles.obstacles.find((o) => o.id === activeId && !o.cleared);
        if (target) {
          const expectedChar = target.word[currentBuf.length]?.toLowerCase();

          if (char === expectedChar) {
            // Correct Keystroke!
            setCorrectStrokes((s) => s + 1);
            runnerAudio.playKeystroke();

            const nextBuf = currentBuf + char;
            threeRef.current.typedBuffer = nextBuf;
            obstacles.setTypedProgress(target, nextBuf.length, true);

            setActiveTarget({
              id: target.id,
              word: target.word,
              type: target.type,
              typedCount: nextBuf.length,
            });

            // Target word completely typed! TRIGGER CORRESPONDING 3D ACTION IMMEDIATELY
            if (nextBuf.length === target.word.length) {
              threeRef.current.typedBuffer = '';
              threeRef.current.activeTargetId = null;
              target.cleared = true;
              obstacles.clearObstacle(target);

              // Execute 3D Player Acrobatic / Navigation Action
              switch (target.type) {
                case 'jump':
                  player.jump();
                  runnerAudio.playJump();
                  break;
                case 'slide':
                  player.slide();
                  runnerAudio.playSlide();
                  break;
                case 'hack':
                  player.hack();
                  runnerAudio.playBreach();
                  break;
                case 'lane_left':
                  player.changeLane(-1);
                  runnerAudio.playLaneSwitch();
                  break;
                case 'lane_right':
                  player.changeLane(1);
                  runnerAudio.playLaneSwitch();
                  break;
                case 'lane_center':
                  player.changeLane(0);
                  runnerAudio.playLaneSwitch();
                  break;
                case 'bridge':
                  runnerAudio.playBridge();
                  break;
                case 'boost':
                default:
                  runnerAudio.playCrystal();
                  break;
              }

              setObstaclesCleared((c) => c + 1);
              setCombo((c) => {
                const next = c + 1;
                setMaxCombo((mc) => Math.max(mc, next));
                return next;
              });
              setScore((s) => s + 300 + combo * 35);
            }
          } else {
            // Typo: play error sound, reset buffer, break combo
            runnerAudio.playError();
            setCombo(0);
            threeRef.current.typedBuffer = '';
            threeRef.current.activeTargetId = null;
            obstacles.setTypedProgress(target, 0, false);
          }
          return;
        }
      }

      // 2. Not currently locked onto a target: scan all visible upcoming options
      const upcoming = obstacles.obstacles.filter(
        (o) => !o.cleared && o.z > threeRef.current.playerZ - 1.5 && o.z < threeRef.current.playerZ + 60
      );
      upcoming.sort((a, b) => a.z - b.z);

      // Find an option whose first character matches the typed key
      const candidate = upcoming.find((o) => o.word.toLowerCase().startsWith(char));

      if (candidate) {
        setCorrectStrokes((s) => s + 1);
        runnerAudio.playKeystroke();

        threeRef.current.activeTargetId = candidate.id;
        const nextBuf = char;
        threeRef.current.typedBuffer = nextBuf;
        obstacles.setTypedProgress(candidate, 1, true);

        setActiveTarget({
          id: candidate.id,
          word: candidate.word,
          type: candidate.type,
          typedCount: 1,
        });

        // If word is length 1 (instant trigger)
        if (nextBuf.length === candidate.word.length) {
          threeRef.current.typedBuffer = '';
          threeRef.current.activeTargetId = null;
          candidate.cleared = true;
          obstacles.clearObstacle(candidate);

          if (candidate.type === 'jump') {
            player.jump();
            runnerAudio.playJump();
          } else if (candidate.type === 'slide') {
            player.slide();
            runnerAudio.playSlide();
          } else if (candidate.type === 'hack') {
            player.hack();
            runnerAudio.playBreach();
          } else if (candidate.type === 'lane_left') {
            player.changeLane(-1);
            runnerAudio.playLaneSwitch();
          } else if (candidate.type === 'lane_right') {
            player.changeLane(1);
            runnerAudio.playLaneSwitch();
          } else if (candidate.type === 'lane_center') {
            player.changeLane(0);
            runnerAudio.playLaneSwitch();
          } else if (candidate.type === 'bridge') {
            runnerAudio.playBridge();
          } else {
            runnerAudio.playCrystal();
          }

          setObstaclesCleared((c) => c + 1);
          setCombo((c) => c + 1);
          setScore((s) => s + 300);
        }
      } else {
        // No matching word starting with typed key
        runnerAudio.playError();
        setCombo(0);
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

      {/* TOP HUD: Progress, Lives, WPM, Score */}
      <div className="relative z-10 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-none">
        {/* Distance & Shields */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-xs font-mono font-bold text-white shadow-lg">
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

        {/* Live Typing Velocity Gauge */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-xs font-mono font-bold text-cyan-400">
            <Zap className="w-3.5 h-3.5" />
            <span>{liveWpm} WPM</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-xs font-mono font-bold text-emerald-400">
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

      {/* BOTTOM HUD: Typing Action Cockpit */}
      <div className="relative z-10 p-4 sm:p-6 flex flex-col items-center justify-end space-y-3 bg-gradient-to-t from-black/90 via-black/55 to-transparent pointer-events-none">
        {/* Primary Action Target Display */}
        {activeTarget ? (
          <div className="flex flex-col items-center space-y-2 max-w-xl w-full">
            <div className="px-6 py-3 rounded-2xl bg-black/85 backdrop-blur-md border border-purple-500/50 shadow-2xl flex flex-col sm:flex-row items-center gap-4 w-full justify-between">
              {/* Action Badge */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">ACTION:</span>
                <span
                  className="px-2.5 py-1 rounded-md text-xs font-mono font-extrabold"
                  style={{
                    backgroundColor: `${(ACTION_STYLES[activeTarget.type] || ACTION_STYLES.jump).color}25`,
                    color: (ACTION_STYLES[activeTarget.type] || ACTION_STYLES.jump).color,
                    border: `1px solid ${(ACTION_STYLES[activeTarget.type] || ACTION_STYLES.jump).color}50`,
                  }}
                >
                  {(ACTION_STYLES[activeTarget.type] || ACTION_STYLES.jump).label}
                </span>
              </div>

              {/* Large High-Contrast Keystroke Progress */}
              <div className="font-mono text-2xl sm:text-3xl font-black tracking-widest text-center">
                <span className="text-emerald-400">
                  {activeTarget.word.slice(0, activeTarget.typedCount)}
                </span>
                <span className="text-amber-300 underline decoration-4 underline-offset-4 animate-pulse">
                  {activeTarget.word[activeTarget.typedCount] || ''}
                </span>
                <span className="text-neutral-400">
                  {activeTarget.word.slice(activeTarget.typedCount + 1)}
                </span>
              </div>

              {/* Combo Streak */}
              <div className="text-xs font-mono text-amber-400 font-bold">
                {combo > 0 ? `${combo}x COMBO` : 'STEADY'}
              </div>
            </div>

            {/* Upcoming Simultaneous Options Preview */}
            {visibleOptions.length > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono">
                <span className="text-neutral-400">Optional Paths:</span>
                {visibleOptions
                  .filter((o) => o.id !== activeTarget.id)
                  .map((o) => (
                    <span
                      key={o.id}
                      className="px-2.5 py-0.5 rounded-full bg-black/60 border border-white/10 text-neutral-300"
                    >
                      <strong className="text-white uppercase mr-1">
                        {(ACTION_STYLES[o.type] || ACTION_STYLES.jump).label}:
                      </strong>
                      <span className="text-cyan-300">{o.word}</span>
                    </span>
                  ))}
              </div>
            )}
          </div>
        ) : (
          <div className="px-5 py-2.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-xs font-mono text-neutral-400">
            Running forward... Approaching cyber track obstacles.
          </div>
        )}
      </div>

      {/* READY SCREEN */}
      {gameState === 'ready' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-6 text-center space-y-5 animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-xl">
            <Footprints className="w-8 h-8" />
          </div>

          <div className="space-y-1.5 max-w-md">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              WORD RUNNER 3D
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              A 100% typing-controlled 3D parkour runner. The runner sprints forward automatically.
              Type displayed English words to jump, slide, dodge lanes, and breach barriers!
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-left font-mono text-[11px] max-w-xl w-full">
            <div className="p-2.5 rounded-xl bg-neutral-900/90 border border-sky-500/30">
              <span className="text-sky-400 font-bold block">JUMP</span>
              <span className="text-neutral-400">Type displayed word to vault electric hurdle</span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-900/90 border border-amber-500/30">
              <span className="text-amber-400 font-bold block">SLIDE</span>
              <span className="text-neutral-400">Type word to duck under high laser grid</span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-900/90 border border-indigo-500/30">
              <span className="text-indigo-400 font-bold block">CHANGE LANE</span>
              <span className="text-neutral-400">Type navigation word to dodge left or right</span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-900/90 border border-rose-500/30">
              <span className="text-rose-400 font-bold block">HACK & BREACH</span>
              <span className="text-neutral-400">Type combat word to smash firewall gates</span>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            icon={Play}
            onClick={startCountdown}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 shadow-xl"
          >
            Start Typing Sprint
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
              {gameState === 'victory' ? 'Neon Parkour Champion!' : 'Sprint Concluded'}
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
              <span className="text-[10px] text-neutral-400 uppercase block">Typing Speed</span>
              <span className="text-2xl font-extrabold text-cyan-400">{liveWpm} WPM</span>
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
