import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import {
  Gauge,
  Trophy,
  Flame,
  RotateCcw,
  Volume2,
  VolumeX,
  ArrowLeft,
  Sparkles,
  Zap,
  Play,
  Flag,
  ChevronRight,
  Shield,
  Clock,
  Car,
  Award,
  Infinity as InfinityIcon,
  Timer,
  Sliders,
} from 'lucide-react';
import { Button } from '../../common/Button';
import { useI18n } from '../../../i18n/I18nContext';
import { ArcadeExitDialog } from '../ArcadeExitDialog';
import { saveArcadeRecord, getGameRecord } from '../../../utils/arcadeStorage';
import {
  GlobalGameManager,
  RENDERING_TECH,
  WebGLFallbackManager,
  GameLifecycleManager,
  getWebGLGraphicsConfig,
} from '../../../utils/performance/GlobalGameManager';
import { GlobalGameSettingsModal } from '../performance/GlobalGameSettingsModal';
import {
  RACING_TIERS,
  RACING_VEHICLES,
  RACING_ENVIRONMENTS,
  AI_COMPETITORS,
  calculateRacingTier,
  computeAiProgress,
} from '../../../utils/racingDifficulty';
import {
  PassageStreamQueue,
} from '../../../utils/continuousPassageEngine';
import { create3DVehicle } from '../racing3d/Racing3DVehicle';
import { create3DEnvironment } from '../racing3d/Racing3DEnvironment';
import { Racing3DCamera } from '../racing3d/Racing3DCamera';
import { Racing3DAudio } from '../racing3d/Racing3DAudio';

// Game Modes supported
const RACING_MODES = [
  {
    id: 'grand-prix',
    name: 'Grand Prix Championship',
    desc: '4-Car grid drag race. Reach target track distance and cross the checkered finish line first!',
    icon: Flag,
    badge: 'Championship',
  },
  {
    id: 'time-attack',
    name: 'Time Attack',
    desc: 'Race against the clock! Type as many continuous passages as possible within 60 seconds.',
    icon: Timer,
    badge: 'Solo Velocity',
  },
  {
    id: 'endless',
    name: 'Endless Highway',
    desc: 'Infinite continuous racing! Unlimited passages and scaling AI speed. How far can you survive?',
    icon: InfinityIcon,
    badge: 'Infinite Survival',
  },
];

/**
 * Format seconds as mm:ss.ms
 */
const formatLapTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '00:00.00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
};

export const NitroRacingGame = ({ onExit, soundEnabled = true }) => {
  const { t } = useI18n();

  // Load existing records
  const personalBest = useMemo(() => getGameRecord('nitro'), []);

  // Garage Selection State
  const [selectedMode, setSelectedMode] = useState('grand-prix'); // 'grand-prix' | 'time-attack' | 'endless'
  const [selectedVehicleId, setSelectedVehicleId] = useState('apex-gt');
  const [selectedEnvId, setSelectedEnvId] = useState('speedway');
  const [selectedTier, setSelectedTier] = useState(() => {
    return calculateRacingTier({
      currentTier: personalBest?.highestTier || 1,
      recentWpm: personalBest?.bestWpm || 0,
      racesCompleted: personalBest?.gamesPlayed || 0,
    });
  });

  // Lifecycle state: 'garage' | 'countdown' | 'racing' | 'gameover'
  const [gameState, setGameState] = useState('garage');
  const [countdown, setCountdown] = useState(3);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [is2DFallback, setIs2DFallback] = useState(() =>
    WebGLFallbackManager.shouldActivateFallback('nitro')
  );

  // Active configurations
  const vehicle = useMemo(() => {
    return RACING_VEHICLES.find((v) => v.id === selectedVehicleId) || RACING_VEHICLES[0];
  }, [selectedVehicleId]);

  const environment = useMemo(() => {
    return RACING_ENVIRONMENTS.find((e) => e.id === selectedEnvId) || RACING_ENVIRONMENTS[0];
  }, [selectedEnvId]);

  const tierConfig = useMemo(() => {
    return RACING_TIERS[selectedTier - 1] || RACING_TIERS[0];
  }, [selectedTier]);

  // Target race distance
  const targetDistance = useMemo(() => {
    if (selectedMode === 'time-attack') return 1200;
    if (selectedMode === 'endless') return 100000; // Effectively infinite
    return tierConfig.trackDistance * 1.5; // ~1200m - 2700m
  }, [selectedMode, tierConfig.trackDistance]);

  // Live Performance & Telemetry
  const [liveWpm, setLiveWpm] = useState(0);
  const [peakWpm, setPeakWpm] = useState(0);
  const [liveAccuracy, setLiveAccuracy] = useState(100);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [nitroMeter, setNitroMeter] = useState(20);
  const [isNitroActive, setIsNitroActive] = useState(false);
  const [nitroBurstsUsed, setNitroBurstsUsed] = useState(0);
  const [currentPlacement, setCurrentPlacement] = useState(1);
  const [hasTypingError, setHasTypingError] = useState(false);

  // Continuous Passage Viewport Window state
  const [viewportData, setViewportData] = useState({
    windowText: '',
    relativeCursor: 0,
    globalCursor: 0,
    totalCharsTyped: 0,
  });

  // Competitor distances for mini-progress bar
  const [miniProgress, setMiniProgress] = useState({
    player: 0,
    xavier: 0,
    thomas: 0,
    joshua: 0,
  });

  // Final Results
  const [finalResults, setFinalResults] = useState(null);

  // 3D Scene Refs
  const mountRef = useRef(null);
  const threeRef = useRef({
    scene: null,
    camera: null,
    cameraController: null,
    renderer: null,
    env: null,
    vehicles: {},
    audio: null,
    streamQueue: null,
    animFrame: null,
    raceStartTime: 0,
    lastFrameTime: 0,
    isFinished: false,
  });

  const inputRef = useRef(null);
  const nitroTimeoutRef = useRef(null);

  // Focus input helper
  const focusInput = useCallback(() => {
    if (gameState === 'racing' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameState]);

  // Start Race Sequence
  const handleStartRace = useCallback(() => {
    // 1. Initialize continuous passage stream
    const stream = new PassageStreamQueue({
      tier: selectedTier,
      initialPassagesCount: 4,
    });

    threeRef.current.streamQueue = stream;
    threeRef.current.isFinished = false;

    // Initial viewport text slice
    setViewportData(stream.getViewportWindow(30, 85));

    setLiveWpm(0);
    setPeakWpm(0);
    setLiveAccuracy(100);
    setElapsedTime(0);
    setNitroMeter(20);
    setIsNitroActive(false);
    setNitroBurstsUsed(0);
    setCurrentPlacement(1);
    setHasTypingError(false);
    setFinalResults(null);

    setGameState('countdown');
    setCountdown(3);
    threeRef.current.audio?.playCountdown(3);
  }, [selectedTier]);

  // Countdown sequence
  useEffect(() => {
    if (gameState !== 'countdown') return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        const next = countdown - 1;
        setCountdown(next);
        threeRef.current.audio?.playCountdown(next);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // GO!
      const timer = setTimeout(() => {
        setGameState('racing');
        threeRef.current.raceStartTime = performance.now();
        threeRef.current.lastFrameTime = performance.now();
        threeRef.current.audio?.startEngine();
      }, 550);
      return () => clearTimeout(timer);
    }
  }, [gameState, countdown]);

  // Nitro Trigger
  const triggerNitroBoost = useCallback(() => {
    if (isNitroActive || nitroMeter < 30 || gameState !== 'racing') return;

    setIsNitroActive(true);
    setNitroBurstsUsed((prev) => prev + 1);
    setNitroMeter(0);
    threeRef.current.audio?.playNitro();

    if (nitroTimeoutRef.current) clearTimeout(nitroTimeoutRef.current);
    nitroTimeoutRef.current = setTimeout(() => {
      setIsNitroActive(false);
    }, 2800);
  }, [isNitroActive, nitroMeter, gameState]);

  // Handle continuous typing input
  const handleKeyDown = useCallback(
    (e) => {
      if (gameState !== 'racing') return;

      const stream = threeRef.current.streamQueue;
      if (!stream) return;

      const expectedChar = stream.getCurrentChar();

      // Spacebar triggers Nitro if charged and space is not the target character
      if (e.key === ' ' && expectedChar !== ' ' && nitroMeter >= 50) {
        e.preventDefault();
        triggerNitroBoost();
        return;
      }

      if (e.key === 'Backspace') {
        e.preventDefault();
        stream.handleBackspace();
        setViewportData(stream.getViewportWindow(30, 85));
        setHasTypingError(false);
        return;
      }

      if (e.key.length > 1 || e.ctrlKey || e.altKey || e.metaKey) {
        return;
      }

      e.preventDefault();
      const elapsed = Math.max(0.1, (performance.now() - threeRef.current.raceStartTime) / 1000);

      const strokeResult = stream.handleKeystroke(e.key, elapsed);

      if (strokeResult.isCorrect) {
        setHasTypingError(false);
        threeRef.current.audio?.playKeystroke();

        // Increment nitro meter on accurate streaks
        setNitroMeter((prev) => Math.min(100, prev + 2.6));

        // Auto-surge when nitro reaches 100%
        if (nitroMeter + 2.6 >= 100) {
          triggerNitroBoost();
        }
      } else {
        setHasTypingError(true);
        // Penalty on mistakes
        setNitroMeter((prev) => Math.max(0, prev - 6));
      }

      setLiveWpm(strokeResult.liveWpm);
      setPeakWpm((p) => Math.max(p, strokeResult.liveWpm));
      setLiveAccuracy(strokeResult.accuracy);
      threeRef.current.audio?.updateEngineRpm(strokeResult.liveWpm, isNitroActive);

      // Update sliding viewport window without resetting or interrupting
      setViewportData(stream.getViewportWindow(30, 85));
    },
    [gameState, nitroMeter, isNitroActive, triggerNitroBoost]
  );

  // Global window keyboard listener ensuring 100% reliable continuous typing input
  useEffect(() => {
    if (gameState !== 'racing') return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleKeyDown]);

  // ==========================================
  // THREE.JS 3D SCENE & 60 FPS RENDER LOOP + CANVAS 2D FALLBACK
  // ==========================================
  useEffect(() => {
    if (gameState !== 'racing' || !mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || 960;
    const height = 400;

    // Start 2D Fallback renderer if WebGL is unavailable or requested
    const start2DFallbackLoop = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.className = 'w-full h-full block rounded-2xl shadow-inner';
      container.innerHTML = '';
      container.appendChild(canvas);

      const ctx = canvas.getContext('2d');
      if (!ctx) return () => {};

      const audio = new Racing3DAudio();
      audio.init();
      audio.setMuted(!soundEnabled);
      audio.startEngine();

      const cars = [
        { id: 'player', name: 'YOU', isPlayer: true, color: vehicle.color || '#EF4444', lane: 2, distance: 0, speed: 0, targetSpeed: 8 },
        { id: 'xavier', name: 'Xavier', isPlayer: false, color: '#A855F7', lane: 0, distance: 0, speed: 0, targetSpeed: 8 },
        { id: 'thomas', name: 'Thomas', isPlayer: false, color: '#38BDF8', lane: 1, distance: 0, speed: 0, targetSpeed: 8 },
        { id: 'joshua', name: 'Joshua', isPlayer: false, color: '#FACC15', lane: 3, distance: 0, speed: 0, targetSpeed: 8 },
      ];

      let animId;
      const loop = (timestamp) => {
        if (!threeRef.current.lastFrameTime) threeRef.current.lastFrameTime = timestamp;
        const dt = Math.min(0.08, (timestamp - threeRef.current.lastFrameTime) / 1000);
        threeRef.current.lastFrameTime = timestamp;

        const elapsed = Math.max(0.1, (timestamp - threeRef.current.raceStartTime) / 1000);
        setElapsedTime(elapsed);

        if (selectedMode === 'time-attack' && elapsed >= 60 && !threeRef.current.isFinished) {
          threeRef.current.isFinished = true;
        }

        const stream = threeRef.current.streamQueue;
        const streamMetrics = stream ? stream.getProgress() : { totalCorrect: 0, totalErrors: 0 };
        const words = streamMetrics.totalCorrect / 5;
        const currentWpmVal = Math.round((words / (elapsed / 60))) || 0;
        const totalStrokes = streamMetrics.totalCorrect + streamMetrics.totalErrors;
        const accVal = totalStrokes > 0 ? Math.round((streamMetrics.totalCorrect / totalStrokes) * 100) : 100;

        const baseMps = (currentWpmVal / 60) * 17.5;
        const vehicleBonus = (vehicle.topSpeed - 80) * 0.006;
        const accBonus = (vehicle.acceleration - 80) * 0.005;
        const nitroMultiplier = isNitroActive ? 1.48 : 1.0;
        const targetPlayerMps = Math.max(8.0, baseMps * (1 + vehicleBonus + accBonus) * nitroMultiplier);

        cars[0].targetSpeed = targetPlayerMps;
        cars[0].speed += (cars[0].targetSpeed - cars[0].speed) * Math.min(1.0, dt * 4.0);
        cars[0].distance += cars[0].speed * dt;

        for (let i = 1; i < 4; i++) {
          const competitor = AI_COMPETITORS[i - 1];
          const aiTargetMps = computeAiProgress({
            tier: selectedTier,
            competitor,
            elapsedSeconds: elapsed,
            playerDistance: cars[0].distance,
            targetDistance,
          });
          cars[i].targetSpeed = aiTargetMps;
          cars[i].speed += (cars[i].targetSpeed - cars[i].speed) * Math.min(1.0, dt * 3.5);
          cars[i].distance += cars[i].speed * dt;
        }

        audio.updateLive(currentWpmVal, isNitroActive, cars[0].speed);

        const sorted = [...cars].sort((a, b) => b.distance - a.distance);
        const playerRank = sorted.findIndex((c) => c.isPlayer) + 1;
        setPlayerPlacement(playerRank);
        setLiveWpm(currentWpmVal);
        setAccuracy(accVal);
        setTotalDistanceCovered(cars[0].distance);

        const totalDist = cars[0].distance;
        const isTargetReached = totalDist >= targetDistance;
        const isTimeAttackDone = selectedMode === 'time-attack' && elapsed >= 60;

        if ((isTargetReached || isTimeAttackDone) && !threeRef.current.isFinished) {
          threeRef.current.isFinished = true;
          audio.playFinishFanfare();

          const finalRank = playerRank;
          const isWinner = finalRank === 1;

          saveArcadeRecord('nitro', {
            wpm: currentWpmVal,
            accuracy: accVal,
            won: isWinner,
            tier: selectedTier,
            placement: finalRank,
            distance: totalDist,
          });

          setRaceResult({
            isWinner,
            placement: finalRank,
            finalWpm: currentWpmVal,
            peakWpm: Math.max(peakWpm, currentWpmVal),
            accuracy: accVal,
            elapsedTime: elapsed,
            totalDistance: totalDist,
            nitroBurstsUsed,
            tierName: tierConfig.name,
            rewardCoins: finalRank === 1 ? tierConfig.rewardCoins : Math.round(tierConfig.rewardCoins * 0.45),
            standings: sorted.map((r, idx) => ({
              id: r.name,
              name: r.name,
              placement: idx + 1,
              distance: Math.round(r.distance),
            })),
          });

          setTimeout(() => {
            setGameState('gameover');
          }, 1500);
        }

        // Draw 2D canvas race scene
        ctx.fillStyle = '#0b0f19';
        ctx.fillRect(0, 0, width, height);

        const laneHeight = height / 4;
        for (let l = 0; l < 4; l++) {
          const y = l * laneHeight;
          ctx.fillStyle = l % 2 === 0 ? '#1e293b' : '#141e2e';
          ctx.fillRect(0, y, width, laneHeight);

          if (l > 0) {
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 2;
            ctx.setLineDash([24, 16]);
            ctx.lineDashOffset = -(cars[0].distance * 6) % 40;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }

        // Checkered finish line
        const finishScreenX = ((targetDistance - cars[0].distance) * 2.5) + (width * 0.45);
        if (finishScreenX > 0 && finishScreenX < width + 100) {
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(finishScreenX, 0, 10, height);
          ctx.fillStyle = '#000000';
          for (let y = 0; y < height; y += 16) {
            ctx.fillRect(finishScreenX, y, 5, 8);
            ctx.fillRect(finishScreenX + 5, y + 8, 5, 8);
          }
        }

        // Draw cars Left to Right
        for (const car of cars) {
          const laneY = car.lane * laneHeight + laneHeight / 2;
          const screenX = car.isPlayer
            ? width * 0.38
            : width * 0.38 + (car.distance - cars[0].distance) * 2.8;

          if (screenX > -120 && screenX < width + 120) {
            if (car.speed > 4) {
              const flameLength = Math.min(32, car.speed * 1.1 * (isNitroActive && car.isPlayer ? 1.8 : 1.0));
              const grad = ctx.createLinearGradient(screenX - 38 - flameLength, laneY, screenX - 38, laneY);
              grad.addColorStop(0, 'rgba(56, 189, 248, 0)');
              grad.addColorStop(1, isNitroActive && car.isPlayer ? 'rgba(56, 189, 248, 0.9)' : 'rgba(249, 115, 22, 0.85)');
              ctx.fillStyle = grad;
              ctx.beginPath();
              ctx.ellipse(screenX - 42, laneY, flameLength, 4, 0, 0, Math.PI * 2);
              ctx.fill();
            }

            const beamGrad = ctx.createLinearGradient(screenX + 32, laneY, screenX + 90, laneY);
            beamGrad.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
            beamGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = beamGrad;
            ctx.beginPath();
            ctx.moveTo(screenX + 32, laneY - 6);
            ctx.lineTo(screenX + 90, laneY - 16);
            ctx.lineTo(screenX + 90, laneY + 16);
            ctx.lineTo(screenX + 32, laneY + 6);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = car.color;
            ctx.beginPath();
            ctx.roundRect(screenX - 34, laneY - 12, 68, 24, [4, 10, 10, 4]);
            ctx.fill();

            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.roundRect(screenX - 8, laneY - 8, 24, 16, 3);
            ctx.fill();

            ctx.fillStyle = '#020617';
            ctx.fillRect(screenX - 36, laneY - 15, 5, 30);

            ctx.fillStyle = car.isPlayer ? '#EF4444' : '#94a3b8';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`${car.name} (${Math.round(car.speed * 2.23)} mph)`, screenX, laneY - 18);
          }
        }

        animId = requestAnimationFrame(loop);
      };

      animId = requestAnimationFrame(loop);

      return () => {
        cancelAnimationFrame(animId);
        audio.cleanup();
      };
    };

    if (is2DFallback) {
      return start2DFallbackLoop();
    }

    // 1. Scene, Camera & WebGL Renderer
    const graphicsConfig = GlobalGameManager.getGraphicsConfig(RENDERING_TECH.THREEJS_WEBGL);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.2, graphicsConfig.drawDistance || 800);
    const cameraController = new Racing3DCamera({ camera, aspect: width / height });

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: graphicsConfig.antiAliasing,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(graphicsConfig.pixelRatio);
      if (graphicsConfig.shadows !== 'disabled') {
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type =
          graphicsConfig.shadows === 'high' ? THREE.PCFSoftShadowMap : THREE.BasicShadowMap;
      } else {
        renderer.shadowMap.enabled = false;
      }
    } catch (err) {
      console.warn('[NitroRacingGame] WebGLRenderer init failed, switching to 2D canvas fallback:', err);
      setIs2DFallback(true);
      return start2DFallbackLoop();
    }

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Bind context loss handler
    const cleanupContextLoss = WebGLFallbackManager.attachContextLossHandlers(
      renderer.domElement,
      () => {
        setIs2DFallback(true);
      }
    );

    // 2. Audio Engine
    const audio = new Racing3DAudio();
    audio.init();
    audio.setMuted(!soundEnabled);
    audio.startEngine();

    // 3. Build 3D Environment
    const env = create3DEnvironment({
      scene,
      envConfig: environment,
      targetDistance,
    });

    // 4. Build 4 Procedural 3D Supercars (Lanes 0 to 3, Left to Right)
    const playerVehicle = create3DVehicle({
      vehicleConfig: vehicle,
      isPlayer: true,
      driverName: 'YOU',
      lane: 2, // 3rd lane from top
      initialX: 0,
    });
    scene.add(playerVehicle.group);

    const xavierVehicle = create3DVehicle({
      vehicleConfig: { id: 'xavier-gt', color: '#A855F7', secondaryColor: '#1F2937' },
      isPlayer: false,
      driverName: 'Xavier',
      lane: 0,
      initialX: 0,
    });
    scene.add(xavierVehicle.group);

    const thomasVehicle = create3DVehicle({
      vehicleConfig: { id: 'thomas-gt', color: '#38BDF8', secondaryColor: '#0F172A' },
      isPlayer: false,
      driverName: 'Thomas',
      lane: 1,
      initialX: 0,
    });
    scene.add(thomasVehicle.group);

    const joshuaVehicle = create3DVehicle({
      vehicleConfig: { id: 'joshua-gt', color: '#FACC15', secondaryColor: '#18181B' },
      isPlayer: false,
      driverName: 'Joshua',
      lane: 3,
      initialX: 0,
    });
    scene.add(joshuaVehicle.group);

    const vehicles = {
      player: playerVehicle,
      xavier: xavierVehicle,
      thomas: thomasVehicle,
      joshua: joshuaVehicle,
    };

    // Store in ref
    threeRef.current.scene = scene;
    threeRef.current.camera = camera;
    threeRef.current.cameraController = cameraController;
    threeRef.current.renderer = renderer;
    threeRef.current.env = env;
    threeRef.current.vehicles = vehicles;
    threeRef.current.audio = audio;

    // Handle Window Resize
    const handleResize = () => {
      if (!mountRef.current || !renderer || !cameraController) return;
      const newWidth = mountRef.current.clientWidth || 960;
      renderer.setSize(newWidth, height);
      cameraController.setAspect(newWidth / height);
    };
    window.addEventListener('resize', handleResize);

    // Tab backgrounding safety handlers
    const handleTabHidden = () => {
      if (audio) audio.setMuted(true);
    };
    const handleTabRestored = () => {
      if (audio && soundEnabled) audio.setMuted(false);
      if (threeRef.current) {
        threeRef.current.lastFrameTime = performance.now();
      }
    };
    window.addEventListener('keyflow-tab-hidden', handleTabHidden);
    window.addEventListener('keyflow-tab-restored', handleTabRestored);

    // ==========================================
    // 60 FPS SIMULATION & RENDER LOOP
    // ==========================================
    let animId;
    const renderLoop = (timestamp) => {
      if (!threeRef.current.lastFrameTime) threeRef.current.lastFrameTime = timestamp;
      const dt = Math.min(0.08, (timestamp - threeRef.current.lastFrameTime) / 1000);
      threeRef.current.lastFrameTime = timestamp;

      const elapsed = Math.max(0.1, (timestamp - threeRef.current.raceStartTime) / 1000);
      setElapsedTime(elapsed);

      // Check Time Attack mode timer (60s limit)
      if (selectedMode === 'time-attack' && elapsed >= 60 && !threeRef.current.isFinished) {
        threeRef.current.isFinished = true;
      }

      const stream = threeRef.current.streamQueue;
      const streamMetrics = stream ? stream.getProgress() : { totalCorrect: 0, totalErrors: 0 };
      const words = streamMetrics.totalCorrect / 5;
      const currentWpmVal = Math.round((words / (elapsed / 60))) || 0;
      const totalStrokes = streamMetrics.totalCorrect + streamMetrics.totalErrors;
      const accVal = totalStrokes > 0 ? Math.round((streamMetrics.totalCorrect / totalStrokes) * 100) : 100;

      // 1. Calculate Player Velocity from Continuous Typing
      const baseMps = (currentWpmVal / 60) * 17.5; // ~1 WPM = ~0.29 m/s
      const vehicleBonus = (vehicle.topSpeed - 80) * 0.006;
      const accBonus = (vehicle.acceleration - 80) * 0.005;
      const nitroMultiplier = isNitroActive ? 1.48 : 1.0;
      const targetPlayerMps = Math.max(8.0, baseMps * (1 + vehicleBonus + accBonus) * nitroMultiplier);

      // Smooth vehicle momentum lerp
      playerVehicle.targetSpeed = targetPlayerMps;
      playerVehicle.distance += playerVehicle.targetSpeed * dt;

      // 2. Advance AI Racers along +X
      for (let i = 0; i < 3; i++) {
        const competitor = AI_COMPETITORS[i];
        const vKey = i === 0 ? 'xavier' : i === 1 ? 'thomas' : 'joshua';
        const aiTargetMps = computeAiProgress({
          tier: selectedTier,
          competitor,
          elapsedSeconds: elapsed,
          playerDistance: playerVehicle.distance,
          targetDistance,
        });
        vehicles[vKey].targetSpeed = aiTargetMps;
        vehicles[vKey].distance += vehicles[vKey].targetSpeed * dt;
      }

      // 3. Update Audio Pitch mapped to live WPM & velocity
      audio.updateLive(currentWpmVal, isNitroActive, playerVehicle.speed);

      // 4. Update 3D Visual Kinematics (Wheels, Flames, Underglow, Positions)
      Object.values(vehicles).forEach((v) => {
        v.update(dt, isNitroActive && v.isPlayer, dt > 0.001);
      });

      // 5. Update Procedural Environment along +X
      env.update(playerVehicle.distance);

      // 6. Update Follow Camera
      cameraController.update(playerVehicle.group.position, isNitroActive, dt);

      // 7. Update Live Telemetry State
      const racerList = [
        { driverName: 'YOU', distance: playerVehicle.distance, isPlayer: true },
        { driverName: 'Xavier', distance: vehicles.xavier.distance, isPlayer: false },
        { driverName: 'Thomas', distance: vehicles.thomas.distance, isPlayer: false },
        { driverName: 'Joshua', distance: vehicles.joshua.distance, isPlayer: false },
      ].sort((a, b) => b.distance - a.distance);

      racerList.forEach((r, idx) => {
        r.placement = idx + 1;
        if (r.isPlayer) {
          playerVehicle.badge.update(r.placement, playerVehicle.speed);
        } else {
          const vKey = r.driverName.toLowerCase();
          if (vehicles[vKey]) {
            vehicles[vKey].badge.update(r.placement, vehicles[vKey].speed);
          }
        }
      });

      const playerRank = racerList.find((r) => r.isPlayer)?.placement || 1;
      setPlayerPlacement(playerRank);
      setLiveWpm(currentWpmVal);
      setAccuracy(accVal);
      setTotalDistanceCovered(playerVehicle.distance);

      // 8. Check Race Finish Condition
      const totalDist = playerVehicle.distance;
      const isTargetReached = totalDist >= targetDistance;
      const isTimeAttackDone = selectedMode === 'time-attack' && elapsed >= 60;

      if ((isTargetReached || isTimeAttackDone) && !threeRef.current.isFinished) {
        threeRef.current.isFinished = true;
        audio.playFinishFanfare();

        const finalRank = playerRank;
        const isWinner = finalRank === 1;

        saveArcadeRecord('nitro', {
          wpm: currentWpmVal,
          accuracy: accVal,
          won: isWinner,
          tier: selectedTier,
          placement: finalRank,
          distance: totalDist,
        });

        setRaceResult({
          isWinner,
          placement: finalRank,
          finalWpm: currentWpmVal,
          peakWpm: Math.max(peakWpm, currentWpmVal),
          accuracy: accVal,
          elapsedTime: elapsed,
          totalDistance: totalDist,
          nitroBurstsUsed,
          tierName: tierConfig.name,
          rewardCoins: finalRank === 1 ? tierConfig.rewardCoins : Math.round(tierConfig.rewardCoins * 0.45),
          standings: racerList.map((r) => ({
            id: r.driverName,
            name: r.driverName,
            placement: r.placement,
            distance: Math.round(r.distance),
          })),
        });

        setTimeout(() => {
          setGameState('gameover');
        }, 1500);
      }

      // Render 3D Scene
      renderer.render(scene, camera);

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keyflow-tab-hidden', handleTabHidden);
      window.removeEventListener('keyflow-tab-restored', handleTabRestored);
      cleanupContextLoss();
      audio.cleanup();
      env.dispose();
      Object.values(vehicles).forEach((v) => v.dispose());
      GameLifecycleManager.disposeThreeScene(scene, renderer);
    };
  }, [
    gameState,
    vehicle,
    environment,
    tierConfig,
    targetDistance,
    selectedMode,
    isNitroActive,
    peakWpm,
    selectedTier,
    soundEnabled,
    nitroBurstsUsed,
    is2DFallback,
  ]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4" onClick={focusInput}>
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            icon={ArrowLeft}
            onClick={() => {
              if (gameState === 'racing') {
                setShowExitConfirm(true);
              } else {
                onExit();
              }
            }}
          >
            {t('arcade.exit.title') || 'Exit'}
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <Car className="w-5 h-5 text-red-500" />
              <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                Nitro Type Pro 3D
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                Tier {selectedTier}: {tierConfig.name}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)]">
                {RACING_MODES.find((m) => m.id === selectedMode)?.name}
              </span>
            </div>
            <p className="text-[11px] font-mono text-[var(--text-muted)]">
              {environment.name} • 3D WebGL Left-to-Right Speedway
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {personalBest?.bestWpm > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-xs font-mono text-[var(--text-secondary)]">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Record: <strong className="text-[var(--text-primary)]">{personalBest.bestWpm} WPM</strong></span>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            icon={Sliders}
            onClick={() => setIsSettingsOpen(true)}
            title="Graphics & Performance Settings"
          >
            Settings
          </Button>
          {gameState === 'racing' && (
            <Button
              variant="outline"
              size="sm"
              icon={RotateCcw}
              onClick={handleStartRace}
              title="Restart Race"
            >
              Restart
            </Button>
          )}
        </div>
      </div>

      {/* 2D Fallback Notice Banner */}
      {is2DFallback && (
        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span><strong>High-Performance 2D Canvas Mode:</strong> WebGL hardware acceleration unavailable.</span>
          </div>
          <span className="text-[10px] text-amber-400/90 hidden sm:inline">Continuous Typing Kinematics & AI Opponents Preserved</span>
        </div>
      )}

      {/* 2. CHAMPIONSHIP GARAGE & VEHICLE TUNING SCREEN */}
      {gameState === 'garage' && (
        <div className="p-5 sm:p-7 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-xl space-y-7 animate-in fade-in duration-200">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-red-500/15 text-red-400 border border-red-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>3D SPEEDWAY GARAGE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Tune Your Supercar. Rule the 3D Strip.
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
              Continuous typing propels your 3D vehicle from left to right on WebGL asphalt against Xavier, Thomas, and Joshua.
            </p>
          </div>

          {/* Game Mode Selector (3 Modes) */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Select Race Mode
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {RACING_MODES.map((mode) => {
                const Icon = mode.icon;
                const isSelected = mode.id === selectedMode;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setSelectedMode(mode.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-red-500 bg-red-500/10 shadow-lg ring-1 ring-red-500/50'
                        : 'border-[var(--border)] bg-[var(--bg-elevated)]/60 hover:border-red-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-red-400" />
                        <span className="text-xs font-bold text-[var(--text-primary)]">{mode.name}</span>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-main)] text-[var(--text-muted)] border border-[var(--border)]">
                        {mode.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                      {mode.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Supercar Selector (5 Models) */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Select 3D Supercar ({RACING_VEHICLES.length} Models)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {RACING_VEHICLES.map((v) => {
                const isSelected = v.id === selectedVehicleId;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVehicleId(v.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                      isSelected
                        ? 'border-red-500 bg-red-500/10 shadow-lg ring-1 ring-red-500/50'
                        : 'border-[var(--border)] bg-[var(--bg-elevated)]/60 hover:border-red-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[var(--text-primary)] group-hover:text-red-400 transition-colors">
                        {v.name}
                      </span>
                      <div
                        className="w-3.5 h-3.5 rounded-full shadow-xs"
                        style={{ backgroundColor: v.color }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-[var(--text-muted)] block mb-2.5">
                      {v.class}
                    </span>

                    <div className="space-y-1.5 text-[9px] font-mono text-[var(--text-secondary)]">
                      <div>
                        <div className="flex justify-between">
                          <span>Top Speed</span>
                          <span>{v.topSpeed}</span>
                        </div>
                        <div className="h-1 rounded-full bg-[var(--border)] overflow-hidden mt-0.5">
                          <div className="h-full bg-cyan-400" style={{ width: `${v.topSpeed}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between">
                          <span>Acceleration</span>
                          <span>{v.acceleration}</span>
                        </div>
                        <div className="h-1 rounded-full bg-[var(--border)] overflow-hidden mt-0.5">
                          <div className="h-full bg-emerald-400" style={{ width: `${v.acceleration}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between">
                          <span>Nitro</span>
                          <span>{v.nitroBoost}</span>
                        </div>
                        <div className="h-1 rounded-full bg-[var(--border)] overflow-hidden mt-0.5">
                          <div className="h-full bg-amber-400" style={{ width: `${v.nitroBoost}%` }} />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Environment & Circuit Selector (4 Themes) */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Select 3D Environment & Circuit
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {RACING_ENVIRONMENTS.map((env) => {
                const isSelected = env.id === selectedEnvId;
                return (
                  <button
                    key={env.id}
                    type="button"
                    onClick={() => setSelectedEnvId(env.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-cyan-500 bg-cyan-500/10 shadow-md ring-1 ring-cyan-500/50'
                        : 'border-[var(--border)] bg-[var(--bg-elevated)]/60 hover:border-cyan-500/40'
                    }`}
                  >
                    <div
                      className="h-1.5 w-full rounded-full mb-2"
                      style={{ background: `linear-gradient(to right, ${env.skyGradient[1]}, ${env.accentColor})` }}
                    />
                    <div className="text-xs font-bold text-[var(--text-primary)]">{env.name}</div>
                    <div className="text-[10px] font-mono text-[var(--text-muted)]">{env.theme}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty Tier Selector (8 Tiers) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Championship Division (Difficulty Tier)
              </h3>
              <span className="text-xs font-mono text-orange-400">
                Pace: {tierConfig.minWpm}–{tierConfig.maxWpm} WPM • AI Target: {tierConfig.aiBaseWpm} WPM
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {RACING_TIERS.map((tItem) => {
                const isSelected = tItem.tier === selectedTier;
                return (
                  <button
                    key={tItem.tier}
                    type="button"
                    onClick={() => setSelectedTier(tItem.tier)}
                    className={`py-2 px-1 text-center rounded-lg border font-mono text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'border-orange-500 bg-orange-500/20 text-orange-300 font-bold shadow-xs'
                        : 'border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <div className="text-[10px] opacity-70">Tier {tItem.tier}</div>
                    <div className="truncate font-semibold">{tItem.name}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Launch Button */}
          <div className="pt-2 text-center">
            <Button
              variant="primary"
              size="lg"
              icon={Play}
              onClick={handleStartRace}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 shadow-xl hover:shadow-red-600/25 transition-all text-sm sm:text-base cursor-pointer"
            >
              LAUNCH INTO 3D SPEEDWAY (SPACE / ENTER)
            </Button>
          </div>
        </div>
      )}

      {/* 3. 3-2-1 COUNTDOWN OVERLAY */}
      {gameState === 'countdown' && (
        <div className="p-12 sm:p-16 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xl flex flex-col items-center justify-center space-y-6 text-center animate-in zoom-in-95 duration-150">
          <div className="text-xs font-mono uppercase tracking-widest text-red-400">
            Grid Position Ready • Revving Engines
          </div>
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-red-500/10 border-2 border-red-500 flex items-center justify-center shadow-2xl animate-pulse">
            <span className="text-5xl sm:text-7xl font-extrabold text-red-500 font-mono">
              {countdown > 0 ? countdown : 'GO!'}
            </span>
          </div>
          <p className="text-xs font-mono text-[var(--text-secondary)]">
            Keep your fingers on the home row. Type continuously to drive!
          </p>
        </div>
      )}

      {/* 4. ACTIVE 3D RACING VIEWPORT */}
      {gameState === 'racing' && (
        <div className="space-y-3">
          {/* Telemetry HUD Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] font-mono text-center shadow-md">
            {/* Position */}
            <div className="p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
              <span className="text-[10px] uppercase text-[var(--text-muted)] block">Position</span>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <Trophy
                  className={`w-4 h-4 ${
                    currentPlacement === 1 ? 'text-amber-400' : currentPlacement === 2 ? 'text-slate-300' : 'text-amber-600'
                  }`}
                />
                <span className="text-lg font-extrabold text-[var(--text-primary)]">
                  #{currentPlacement}
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">/ 4</span>
              </div>
            </div>

            {/* Speedometer */}
            <div className="p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
              <span className="text-[10px] uppercase text-[var(--text-muted)] block">Speedometer</span>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <Gauge className="w-4 h-4 text-cyan-400" />
                <span className="text-lg font-extrabold text-cyan-400">
                  {liveWpm}
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">WPM</span>
              </div>
            </div>

            {/* Accuracy */}
            <div className="p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
              <span className="text-[10px] uppercase text-[var(--text-muted)] block">Accuracy</span>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-lg font-extrabold text-emerald-400">
                  {liveAccuracy}%
                </span>
              </div>
            </div>

            {/* Lap Stopwatch Timer */}
            <div className="p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
              <span className="text-[10px] uppercase text-[var(--text-muted)] block">
                {selectedMode === 'time-attack' ? 'Time Remaining' : 'Lap Time'}
              </span>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-base font-bold text-[var(--text-primary)]">
                  {selectedMode === 'time-attack' ? `${Math.max(0, 60 - Math.floor(elapsedTime))}s` : formatLapTime(elapsedTime)}
                </span>
              </div>
            </div>

            {/* Nitro Boost Surge Meter */}
            <div
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                isNitroActive
                  ? 'bg-red-500/20 border-red-500 animate-pulse'
                  : nitroMeter >= 50
                  ? 'bg-amber-500/10 border-amber-500/40 hover:bg-amber-500/20'
                  : 'bg-[var(--bg-elevated)] border-[var(--border)]'
              }`}
              onClick={triggerNitroBoost}
              title="Click or press Space when charged to trigger Nitro"
            >
              <div className="flex items-center justify-between text-[10px] uppercase">
                <span className={isNitroActive ? 'text-red-400 font-bold' : 'text-[var(--text-muted)]'}>
                  {isNitroActive ? 'NITRO ENGAGED!' : 'Nitro Surge'}
                </span>
                <Flame className={`w-3 h-3 ${nitroMeter >= 50 ? 'text-amber-400' : 'text-[var(--text-muted)]'}`} />
              </div>
              <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden mt-1.5">
                <div
                  className={`h-full transition-all duration-150 ${
                    isNitroActive ? 'bg-red-500 shadow-md shadow-red-500' : 'bg-gradient-to-r from-amber-500 to-red-500'
                  }`}
                  style={{ width: `${nitroMeter}%` }}
                />
              </div>
            </div>
          </div>

          {/* Three.js 3D WebGL Speedway Canvas Viewport (LEFT TO RIGHT RACING) */}
          <div className="rounded-2xl overflow-hidden border border-[var(--border)] shadow-2xl bg-black relative">
            <div
              ref={mountRef}
              className="w-full h-[400px] block cursor-pointer"
              onClick={focusInput}
            />

            {/* Mini-Track Progress Bar Overlay at bottom */}
            <div className="absolute bottom-2 left-4 right-4 py-1.5 px-3 rounded-lg bg-black/80 backdrop-blur-xs border border-white/10 flex items-center gap-3 text-[10px] font-mono text-white/80">
              <span className="shrink-0 flex items-center gap-1 text-red-400 font-bold">
                <Flag className="w-3 h-3" /> TRACK PROGRESS
              </span>
              <div className="flex-1 h-2 rounded-full bg-white/15 relative overflow-hidden">
                <div
                  className="absolute top-0 bottom-0 w-2 rounded-full bg-purple-400 transition-all duration-75"
                  style={{ left: `${Math.min(98, miniProgress.xavier)}%` }}
                  title="Xavier"
                />
                <div
                  className="absolute top-0 bottom-0 w-2 rounded-full bg-cyan-400 transition-all duration-75"
                  style={{ left: `${Math.min(98, miniProgress.thomas)}%` }}
                  title="Thomas"
                />
                <div
                  className="absolute top-0 bottom-0 w-3 rounded-full bg-red-500 shadow-sm shadow-red-500 ring-1 ring-white transition-all duration-75 z-10"
                  style={{ left: `${Math.min(98, miniProgress.player)}%` }}
                  title="YOU"
                />
                <div
                  className="absolute top-0 bottom-0 w-2 rounded-full bg-yellow-400 transition-all duration-75"
                  style={{ left: `${Math.min(98, miniProgress.joshua)}%` }}
                  title="Joshua"
                />
              </div>
              <span className="shrink-0 font-bold text-white">
                {Math.round(miniProgress.player)}%
              </span>
            </div>
          </div>

          {/* Continuous Unlimited Typing Passage Viewport */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border transition-all shadow-xl bg-[var(--bg-surface)] ${
              hasTypingError
                ? 'border-red-500 ring-2 ring-red-500/20'
                : 'border-[var(--border)] focus-within:border-[var(--accent)]'
            }`}
          >
            {/* Hidden Input ensuring uninterrupted keystroke capture */}
            <input
              ref={inputRef}
              type="text"
              autoFocus
              value=""
              onChange={() => {}}
              onKeyDown={handleKeyDown}
              className="absolute top-0 left-0 w-px h-px opacity-0 pointer-events-none"
              aria-label="3D Racing Continuous Typing Input"
            />

            <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)] mb-2.5 pb-2 border-b border-[var(--border)]">
              <span>CONTINUOUS PASSAGE STREAM • TYPING FOCUS ACTIVE</span>
              <span>
                {viewportData.globalCursor} characters typed
              </span>
            </div>

            {/* Sliding Window Character Highlighting */}
            <div className="text-base sm:text-xl font-mono leading-relaxed select-none tracking-wide">
              {viewportData.windowText.split('').map((char, index) => {
                const isTyped = index < viewportData.relativeCursor;
                const isCurrent = index === viewportData.relativeCursor;

                let charClass = 'text-[var(--text-muted)]/40';
                if (isTyped) {
                  charClass = 'text-emerald-400 font-bold';
                } else if (isCurrent) {
                  charClass = hasTypingError
                    ? 'bg-red-500 text-white rounded-xs px-0.5 animate-pulse'
                    : 'bg-[var(--accent)] text-[var(--accent-fg)] rounded-xs px-0.5 shadow-xs';
                }

                return (
                  <span
                    key={index}
                    data-current={isCurrent ? 'true' : undefined}
                    data-char={char}
                    className={`transition-colors duration-75 ${charClass}`}
                  >
                    {char === ' ' && isCurrent ? '␣' : char}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 5. RACE RESULTS & STANDINGS PODIUM */}
      {gameState === 'gameover' && finalResults && (
        <div className="p-6 sm:p-8 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-200">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center shadow-xl border bg-gradient-to-br from-amber-500/20 to-red-500/20 border-amber-500/40">
              <Trophy className={`w-10 h-10 ${finalResults.placement === 1 ? 'text-amber-400' : 'text-slate-300'}`} />
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-[var(--text-primary)]">
              {finalResults.placement === 1 ? '1ST PLACE — VICTORY!' : `#${finalResults.placement} PODIUM FINISH`}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-mono">
              {tierConfig.label} • {environment.name} • {RACING_MODES.find((m) => m.id === selectedMode)?.name}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto font-mono text-center">
            <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
              <span className="text-[10px] text-[var(--text-muted)] uppercase block">Average Velocity</span>
              <span className="text-2xl font-extrabold text-cyan-400">{finalResults.finalWpm}</span>
              <span className="text-[10px] text-[var(--text-muted)] block">WPM</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
              <span className="text-[10px] text-[var(--text-muted)] uppercase block">Accuracy</span>
              <span className="text-2xl font-extrabold text-emerald-400">{finalResults.accuracy}%</span>
              <span className="text-[10px] text-[var(--text-muted)] block">Clean Rhythm</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
              <span className="text-[10px] text-[var(--text-muted)] uppercase block">Total Distance</span>
              <span className="text-2xl font-extrabold text-[var(--text-primary)]">{finalResults.totalDistance}m</span>
              <span className="text-[10px] text-[var(--text-muted)] block">Track Covered</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
              <span className="text-[10px] text-[var(--text-muted)] uppercase block">Rewards</span>
              <span className="text-2xl font-extrabold text-amber-400">+{finalResults.rewardCoins}</span>
              <span className="text-[10px] text-[var(--text-muted)] block">Coins & XP</span>
            </div>
          </div>

          <div className="max-w-md mx-auto p-4 rounded-xl bg-[var(--bg-elevated)]/60 border border-[var(--border)] text-left font-mono text-xs space-y-2">
            <div className="text-[10px] uppercase text-[var(--text-muted)] tracking-wider pb-1 border-b border-[var(--border)]">
              Official Race Standings
            </div>
            {finalResults.standings.map((s, idx) => (
              <div key={s.id} className="flex items-center justify-between py-1">
                <span className="flex items-center gap-2">
                  <span className={`font-bold ${idx === 0 ? 'text-amber-400' : 'text-[var(--text-muted)]'}`}>
                    #{idx + 1}
                  </span>
                  <span className={s.id === 'YOU' ? 'font-bold text-red-400' : 'text-[var(--text-primary)]'}>
                    {s.name}
                  </span>
                </span>
                <span className="text-[var(--text-secondary)]">{s.distance}m</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <Button
              variant="outline"
              size="md"
              icon={RotateCcw}
              onClick={() => setGameState('garage')}
            >
              Garage & Tuning
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={Play}
              onClick={handleStartRace}
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              Race Again
            </Button>
            <Button
              variant="outline"
              size="md"
              icon={ArrowLeft}
              onClick={onExit}
            >
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
          threeRef.current.audio?.stopEngine();
          onExit();
        }}
      />

      {/* Global Performance & Graphics Settings Modal */}
      <GlobalGameSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};
