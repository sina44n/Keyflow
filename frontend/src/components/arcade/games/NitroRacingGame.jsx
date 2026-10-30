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
  Palette,
  Users,
  Check,
  Disc,
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
import { NITRO_STYLES } from '../racing3d/Racing3DNitroEffects';
import { Racing3DGarageTurntable } from '../racing3d/Racing3DGarageTurntable';
import { Racing3DMultiplayerLobby } from '../racing3d/Racing3DMultiplayerLobby';

// Racing Game Modes
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

// Presets for Garage Customization
const BODY_COLOR_PALETTE = [
  { name: 'Apex Crimson', hex: '#EF4444' },
  { name: 'Cyber Cyan', hex: '#06B6D4' },
  { name: 'Racing Gold', hex: '#EAB308' },
  { name: 'Electric Violet', hex: '#A855F7' },
  { name: 'Acid Green', hex: '#10B981' },
  { name: 'Obsidian Stealth', hex: '#1E293B' },
  { name: 'Solar Flame', hex: '#F97316' },
  { name: 'Pure Pearl', hex: '#F8FAFC' },
];

const WHEEL_FINISHES = [
  { id: 'chrome', name: 'Chrome Mirror', color: '#E2E8F0' },
  { id: 'gold', name: 'Forged Gold', color: '#F59E0B' },
  { id: 'bronze', name: 'Racing Bronze', color: '#B45309' },
  { id: 'stealth', name: 'Stealth Black', color: '#1E293B' },
];

const UNDERGLOW_PALETTE = [
  { name: 'Crimson', hex: '#EF4444' },
  { name: 'Cyan Neon', hex: '#06B6D4' },
  { name: 'Purple Ray', hex: '#A855F7' },
  { name: 'Acid Lime', hex: '#10B981' },
  { name: 'Solar Amber', hex: '#F59E0B' },
  { name: 'Ice White', hex: '#FFFFFF' },
];

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

  // Customization & Driver Profile State (persisted in localStorage)
  const [customVehicle, setCustomVehicle] = useState(() => {
    try {
      const saved = localStorage.getItem('keyflow_nitro_custom_vehicle');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      selectedVehicleId: 'apex-gt',
      primaryColor: '#EF4444',
      secondaryColor: '#1F2937',
      wheelFinish: 'chrome',
      glowColor: '#EF4444',
      nitroStyle: 'fire',
    };
  });

  const [driverName, setDriverName] = useState(() => {
    return localStorage.getItem('keyflow_racing_driver_name') || 'ApexRacer';
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('keyflow_nitro_custom_vehicle', JSON.stringify(customVehicle));
    } catch (e) {}
  }, [customVehicle]);

  useEffect(() => {
    try {
      localStorage.setItem('keyflow_racing_driver_name', driverName);
    } catch (e) {}
  }, [driverName]);

  // Screen Tabs: 'modes' | 'garage' | 'multiplayer'
  const [hubTab, setHubTab] = useState('modes');

  // Racing Game Setup
  const [selectedMode, setSelectedMode] = useState('grand-prix');
  const [selectedEnvId, setSelectedEnvId] = useState('speedway');
  const [selectedTier, setSelectedTier] = useState(() => {
    return calculateRacingTier({
      currentTier: personalBest?.highestTier || 1,
      recentWpm: personalBest?.bestWpm || 0,
      racesCompleted: personalBest?.gamesPlayed || 0,
    });
  });

  // Multiplayer Room State
  const [multiplayerContext, setMultiplayerContext] = useState(null);

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
    return RACING_VEHICLES.find((v) => v.id === customVehicle.selectedVehicleId) || RACING_VEHICLES[0];
  }, [customVehicle.selectedVehicleId]);

  const environment = useMemo(() => {
    return RACING_ENVIRONMENTS.find((e) => e.id === selectedEnvId) || RACING_ENVIRONMENTS[0];
  }, [selectedEnvId]);

  const tierConfig = useMemo(() => {
    return RACING_TIERS[selectedTier - 1] || RACING_TIERS[0];
  }, [selectedTier]);

  // Target race distance
  const targetDistance = useMemo(() => {
    if (multiplayerContext?.room?.target_distance) {
      return multiplayerContext.room.target_distance;
    }
    if (selectedMode === 'time-attack') return 1200;
    if (selectedMode === 'endless') return 100000;
    return tierConfig.trackDistance * 1.5;
  }, [selectedMode, tierConfig.trackDistance, multiplayerContext]);

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
  const [comboStreak, setComboStreak] = useState(0);
  const [totalDistanceCovered, setTotalDistanceCovered] = useState(0);

  // Continuous Passage Viewport Window state
  const [viewportData, setViewportData] = useState({
    windowText: '',
    relativeCursor: 0,
    globalCursor: 0,
    totalCharsTyped: 0,
  });

  // Final Results
  const [finalResults, setFinalResults] = useState(null);

  // Mutable refs to decouple 60 FPS Three.js render loop from React state re-renders
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  const isNitroActiveRef = useRef(isNitroActive);
  isNitroActiveRef.current = isNitroActive;

  const customVehicleRef = useRef(customVehicle);
  customVehicleRef.current = customVehicle;

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
    lastKeystrokeTime: 0,
    playerSpeed: 0,
    comboStreak: 0,
    lastSyncTime: 0,
    isFinished: false,
  });

  const inputRef = useRef(null);
  const nitroTimeoutRef = useRef(null);

  // Focus input helper
  const focusInput = useCallback(() => {
    if ((gameState === 'racing' || gameState === 'countdown') && inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameState]);

  // Nitro Trigger Function (Tab Key or On-Screen Button)
  const triggerNitroBoost = useCallback(() => {
    if (isNitroActive || nitroMeter < 25) return;

    setIsNitroActive(true);
    setNitroMeter((prev) => Math.max(0, prev - 35));
    setNitroBurstsUsed((b) => b + 1);
    threeRef.current.audio?.playNitro();

    if (nitroTimeoutRef.current) clearTimeout(nitroTimeoutRef.current);
    nitroTimeoutRef.current = setTimeout(() => {
      setIsNitroActive(false);
    }, 3200);
  }, [isNitroActive, nitroMeter]);

  // Start Race Sequence (Pre-warms 3D scene on starting grid)
  const handleStartRace = useCallback(() => {
    const stream = new PassageStreamQueue({
      tier: selectedTier,
      initialPassagesCount: 4,
    });

    threeRef.current.streamQueue = stream;
    threeRef.current.isFinished = false;
    threeRef.current.playerSpeed = 0;
    threeRef.current.comboStreak = 0;
    threeRef.current.lastKeystrokeTime = performance.now();
    threeRef.current.lastSyncTime = 0;

    setViewportData(stream.getViewportWindow(30, 85));
    setLiveWpm(0);
    setPeakWpm(0);
    setLiveAccuracy(100);
    setElapsedTime(0);
    setNitroMeter(30);
    setIsNitroActive(false);
    setNitroBurstsUsed(0);
    setCurrentPlacement(1);
    setHasTypingError(false);
    setComboStreak(0);
    setTotalDistanceCovered(0);
    setFinalResults(null);

    setGameState('countdown');
    setCountdown(3);
    threeRef.current.audio?.playCountdown(3);
  }, [selectedTier]);

  // Start Race from Multiplayer Lobby
  const handleStartMultiplayerRace = useCallback(
    ({ room, participant, participants }) => {
      setMultiplayerContext({ room, participant, participants });
      handleStartRace();
    },
    [handleStartRace]
  );

  // Synchronized countdown timer (scene is already mounted)
  useEffect(() => {
    if (countdown > 0 && gameState === 'countdown') {
      const timer = setTimeout(() => {
        const next = countdown - 1;
        setCountdown(next);
        if (next === 0) {
          threeRef.current.audio?.playCountdown(0);
          threeRef.current.raceStartTime = performance.now();
          threeRef.current.lastFrameTime = performance.now();
          threeRef.current.lastKeystrokeTime = performance.now();
          setGameState('racing');
          focusInput();
        } else {
          threeRef.current.audio?.playCountdown(next);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, gameState, focusInput]);

  // Continuous typing input handler with progressive impulse acceleration
  const handleKeyDown = useCallback(
    (e) => {
      if (gameState !== 'racing') return;

      const stream = threeRef.current.streamQueue;
      if (!stream) return;

      // Tab key triggers Nitro boost (prevents default focus shift)
      if (e.key === 'Tab' || e.code === 'Tab') {
        e.preventDefault();
        if (nitroMeter >= 25 && !isNitroActive) {
          triggerNitroBoost();
        }
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

        // 1. Progressive Impulse Acceleration
        threeRef.current.comboStreak = (threeRef.current.comboStreak || 0) + 1;
        const streak = threeRef.current.comboStreak;
        setComboStreak(streak);

        const streakBonus = 1 + Math.min(0.5, Math.floor(streak / 10) * 0.1);
        const impulse = 4.2 * (vehicle.acceleration / 80) * streakBonus;
        const maxVelocity = (vehicle.topSpeed / 80) * 42 * (isNitroActive ? 1.45 : 1.0);

        threeRef.current.playerSpeed = Math.min(
          maxVelocity,
          Math.max(10, (threeRef.current.playerSpeed || 8) + impulse)
        );
        threeRef.current.lastKeystrokeTime = performance.now();

        // 2. Nitro Charging on accurate typing
        const charge = streak >= 20 ? 3.8 : 2.5;
        setNitroMeter((prev) => {
          const next = Math.min(100, prev + charge);
          if (next >= 100 && !isNitroActive) {
            triggerNitroBoost();
          }
          return next;
        });
      } else {
        setHasTypingError(true);
        // Typo Penalty: 15% deceleration penalty (never backward! floor 7 m/s)
        threeRef.current.comboStreak = 0;
        setComboStreak(0);
        threeRef.current.playerSpeed = Math.max(7.0, (threeRef.current.playerSpeed || 8) * 0.85);
        setNitroMeter((prev) => Math.max(0, prev - 5));
      }

      setLiveWpm(strokeResult.liveWpm);
      setPeakWpm((p) => Math.max(p, strokeResult.liveWpm));
      setLiveAccuracy(strokeResult.accuracy);
      threeRef.current.audio?.updateEngineRpm(strokeResult.liveWpm, isNitroActive);

      setViewportData(stream.getViewportWindow(30, 85));
    },
    [gameState, nitroMeter, isNitroActive, vehicle, triggerNitroBoost]
  );

  useEffect(() => {
    if (gameState !== 'racing' && gameState !== 'countdown') return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleKeyDown]);

  const isRaceActive = gameState === 'racing' || gameState === 'countdown';

  // ==========================================
  // 3D SCENE & 60 FPS RENDER LOOP
  // Mounts during both 'countdown' and 'racing' to prevent any viewport resizing!
  // ==========================================
  useEffect(() => {
    if (!isRaceActive || !mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth || 960;
    const height = container.clientHeight || 440;

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
      renderer.shadowMap.enabled = graphicsConfig.shadows !== 'disabled';
    } catch (err) {
      console.warn('[NitroRacingGame] WebGLRenderer init failed, fallback:', err);
      setIs2DFallback(true);
      return () => {};
    }

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Audio Engine
    const audio = new Racing3DAudio();
    audio.init();
    audio.setMuted(!soundEnabled);
    audio.startEngine();
    threeRef.current.audio = audio;

    // 3D Environment along +X
    const env = create3DEnvironment({
      scene,
      envConfig: environment,
      targetDistance,
    });

    // Determine Driver & Lane Configurations
    const isMultiplayer = !!multiplayerContext?.room;
    const selfLane = isMultiplayer ? (multiplayerContext.participant?.lane ?? 0) : 2;

    // Build Player Supercar with user customization
    const playerVehicle = create3DVehicle({
      vehicleConfig: {
        id: customVehicle.selectedVehicleId,
        color: customVehicle.primaryColor,
        secondaryColor: customVehicle.secondaryColor,
        glowColor: customVehicle.glowColor,
        wheelFinish: customVehicle.wheelFinish,
        nitroStyle: customVehicle.nitroStyle,
      },
      isPlayer: true,
      driverName: driverName || 'YOU',
      lane: selfLane,
      initialX: 0,
    });
    scene.add(playerVehicle.group);

    // Build Competitors (AI or Multiplayer Peers)
    const competitors = {};
    if (isMultiplayer) {
      const peers = (multiplayerContext.participants || []).filter(
        (p) => p.id !== multiplayerContext.participant?.id
      );
      peers.forEach((peer) => {
        const peerCar = create3DVehicle({
          vehicleConfig: {
            id: peer.vehicle_id || 'cyber-phantom',
            color: peer.primary_color || '#38BDF8',
            secondaryColor: '#0F172A',
            wheelFinish: peer.wheel_finish || 'chrome',
            nitroStyle: peer.nitro_style || 'electric',
          },
          isPlayer: false,
          driverName: peer.display_name || `Racer ${peer.lane + 1}`,
          lane: peer.lane,
          initialX: 0,
        });
        scene.add(peerCar.group);
        competitors[`lane_${peer.lane}`] = peerCar;
      });
    } else {
      // 3 AI Competitors in remaining lanes
      const aiConfigs = [
        { key: 'xavier', lane: 0, name: 'Xavier', color: '#A855F7', id: 'cyber-phantom' },
        { key: 'thomas', lane: 1, name: 'Thomas', color: '#38BDF8', id: 'viper-venom' },
        { key: 'joshua', lane: 3, name: 'Joshua', color: '#FACC15', id: 'solar-flare' },
      ];
      aiConfigs.forEach((cfg) => {
        const aiCar = create3DVehicle({
          vehicleConfig: { id: cfg.id, color: cfg.color, secondaryColor: '#18181B' },
          isPlayer: false,
          driverName: cfg.name,
          lane: cfg.lane,
          initialX: 0,
        });
        scene.add(aiCar.group);
        competitors[cfg.key] = aiCar;
      });
    }

    const allVehicles = { player: playerVehicle, ...competitors };

    threeRef.current.scene = scene;
    threeRef.current.camera = camera;
    threeRef.current.cameraController = cameraController;
    threeRef.current.renderer = renderer;
    threeRef.current.env = env;
    threeRef.current.vehicles = allVehicles;

    // Window Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !cameraController) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight || 440;
      renderer.setSize(newWidth, newHeight);
      cameraController.setAspect(newWidth / newHeight);
    };
    window.addEventListener('resize', handleResize);

    // 60 FPS Simulation Loop
    let animId;
    const renderLoop = (timestamp) => {
      if (!threeRef.current.lastFrameTime) threeRef.current.lastFrameTime = timestamp;
      const dt = Math.min(0.08, (timestamp - threeRef.current.lastFrameTime) / 1000);
      threeRef.current.lastFrameTime = timestamp;

      const isRacing = gameStateRef.current === 'racing';
      const isNitro = isNitroActiveRef.current;

      const elapsed = Math.max(0.1, (timestamp - threeRef.current.raceStartTime) / 1000);
      if (isRacing) {
        setElapsedTime(elapsed);
      }

      // Check Time Attack limit
      if (selectedMode === 'time-attack' && elapsed >= 60 && !threeRef.current.isFinished) {
        threeRef.current.isFinished = true;
      }

      const stream = threeRef.current.streamQueue;
      const streamMetrics = stream ? stream.getProgress() : { totalCorrect: 0, totalErrors: 0 };
      const words = streamMetrics.totalCorrect / 5;
      const currentWpmVal = Math.round(words / (elapsed / 60)) || 0;
      const totalStrokes = streamMetrics.totalCorrect + streamMetrics.totalErrors;
      const accVal = totalStrokes > 0 ? Math.round((streamMetrics.totalCorrect / totalStrokes) * 100) : 100;

      // 1. Aerodynamic Drag & Momentum when idling
      if (isRacing) {
        const idleTime = (performance.now() - (threeRef.current.lastKeystrokeTime || performance.now())) / 1000;
        if (idleTime > 1.2) {
          const idleDecay = Math.pow(0.97, dt * 60);
          threeRef.current.playerSpeed = Math.max(7.0, (threeRef.current.playerSpeed || 8) * idleDecay);
        }

        const vehicleBonus = (vehicle.topSpeed - 80) * 0.006;
        const accBonus = (vehicle.acceleration - 80) * 0.005;
        const nitroMultiplier = isNitro ? 1.48 : 1.0;
        const cadenceFloor = Math.max(
          7.0,
          (currentWpmVal / 60) * 17.5 * (1 + vehicleBonus + accBonus) * nitroMultiplier
        );
        const finalSpeed = Math.max(cadenceFloor, (threeRef.current.playerSpeed || 7) * nitroMultiplier);

        playerVehicle.targetSpeed = finalSpeed;
        playerVehicle.distance += playerVehicle.targetSpeed * dt;
      } else {
        // Countdown state: cars idling on starting grid
        playerVehicle.targetSpeed = 0;
      }

      // 2. Advance AI Competitors along +X
      if (!isMultiplayer && isRacing) {
        AI_COMPETITORS.forEach((competitor, idx) => {
          const vKey = idx === 0 ? 'xavier' : idx === 1 ? 'thomas' : 'joshua';
          if (competitors[vKey]) {
            const aiTargetMps = computeAiProgress({
              aiRacer: competitor,
              tierConfig,
              playerWpm: currentWpmVal,
              elapsedSeconds: elapsed,
              currentProgress: (competitors[vKey].distance / targetDistance) * 100,
              targetDistance,
            });
            competitors[vKey].targetSpeed = aiTargetMps;
            competitors[vKey].distance += competitors[vKey].targetSpeed * dt;
          }
        });
      }

      // 3. Sync Multiplayer Telemetry
      if (isMultiplayer && isRacing) {
        const nowMs = performance.now();
        if (nowMs - (threeRef.current.lastSyncTime || 0) > 180) {
          threeRef.current.lastSyncTime = nowMs;
          fetch(`/api/games/racing/rooms/${multiplayerContext.room.code}/sync/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              participantId: multiplayerContext.participant?.id,
              distance: playerVehicle.distance,
              speed: playerVehicle.currentSpeed,
              wpm: currentWpmVal,
              accuracy: accVal,
              placement: currentPlacement,
              isFinished: threeRef.current.isFinished,
              finishTime: elapsed,
            }),
          })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
              if (data?.participants) {
                data.participants.forEach((peer) => {
                  if (peer.id !== multiplayerContext.participant?.id) {
                    const peerCar = competitors[`lane_${peer.lane}`];
                    if (peerCar) {
                      peerCar.distance = peer.distance;
                      peerCar.targetSpeed = peer.speed;
                    }
                  }
                });
              }
            })
            .catch(() => {});
        }
      }

      // 4. Update Audio Engine
      audio.updateLive(currentWpmVal, isNitro, playerVehicle.currentSpeed);

      // 5. Update Follow Camera
      cameraController.update({
        playerX: playerVehicle.distance,
        speed: playerVehicle.currentSpeed,
        isNitro,
        dt,
        isFinished: threeRef.current.isFinished,
      });

      // 6. Update Environment
      env.update(playerVehicle.distance);

      // 7. Calculate Live Placements & Update Billboard Badges
      const racerList = [
        { driverName: driverName || 'YOU', distance: playerVehicle.distance, isPlayer: true, vehicle: playerVehicle },
        ...Object.entries(competitors).map(([k, v]) => ({
          driverName: v.driverName,
          distance: v.distance,
          isPlayer: false,
          vehicle: v,
        })),
      ].sort((a, b) => b.distance - a.distance);

      racerList.forEach((r, idx) => {
        const rank = idx + 1;
        r.vehicle.update({
          speed: r.vehicle.targetSpeed,
          dt,
          isNitro: isNitro && r.isPlayer,
          placement: rank,
          currentWpm: r.isPlayer ? currentWpmVal : Math.round(r.vehicle.targetSpeed * 3.4),
          nitroStyle: customVehicleRef.current.nitroStyle,
        });
      });

      const playerRank = racerList.find((r) => r.isPlayer)?.placement || 1;
      setCurrentPlacement(playerRank);
      setLiveWpm(currentWpmVal);
      setLiveAccuracy(accVal);
      setTotalDistanceCovered(playerVehicle.distance);

      // 8. Render Frame
      renderer.render(scene, camera);

      // 9. Finish Race Condition
      const totalDist = playerVehicle.distance;
      const isTargetReached = totalDist >= targetDistance;
      const isTimeAttackDone = selectedMode === 'time-attack' && elapsed >= 60;

      if ((isTargetReached || isTimeAttackDone) && !threeRef.current.isFinished && isRacing) {
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

        setFinalResults({
          isWinner,
          placement: finalRank,
          finalWpm: currentWpmVal,
          peakWpm: Math.max(peakWpm, currentWpmVal),
          accuracy: accVal,
          elapsedTime: elapsed,
          totalDistance: Math.round(totalDist),
          nitroBurstsUsed,
          tierName: tierConfig.name,
          rewardCoins: finalRank === 1 ? tierConfig.rewardCoins : Math.round(tierConfig.rewardCoins * 0.45),
          standings: racerList.map((r, idx) => ({
            id: r.driverName,
            name: r.driverName,
            placement: idx + 1,
            distance: Math.round(r.distance),
          })),
        });

        setGameState('gameover');
        return;
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      audio.cleanup();
      playerVehicle.dispose();
      Object.values(competitors).forEach((c) => c.dispose());
      env.dispose();
      renderer.dispose();
    };
  }, [
    isRaceActive,
    is2DFallback,
    selectedMode,
    selectedTier,
    targetDistance,
    selectedEnvId,
    environment,
    tierConfig,
    vehicle,
    driverName,
    multiplayerContext,
    soundEnabled,
  ]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4" onClick={focusInput}>
      {/* 1. TOP HEADER & HUD BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-md">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            icon={ArrowLeft}
            onClick={() => {
              if (gameState === 'racing' || gameState === 'countdown') {
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
                Nitro Racing Pro 3D
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                Tier {selectedTier}: {tierConfig.name}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)]">
                {RACING_MODES.find((m) => m.id === selectedMode)?.name}
              </span>
            </div>
            <p className="text-[11px] font-mono text-[var(--text-muted)]">
              {environment.name} • Left-to-Right (+X) Kinetic Speedway
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
          {(gameState === 'racing' || gameState === 'countdown') && (
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

      {/* 2. PRE-RACE HUB SCREEN (Modes, Garage, Multiplayer) */}
      {gameState === 'garage' && (
        <div className="space-y-4">
          {/* Navigation Pill Tabs */}
          <div className="flex items-center justify-center p-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] max-w-md mx-auto">
            <button
              type="button"
              onClick={() => setHubTab('modes')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                hubTab === 'modes'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Flag className="w-3.5 h-3.5" /> Circuit Modes
            </button>
            <button
              type="button"
              onClick={() => setHubTab('garage')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                hubTab === 'garage'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Palette className="w-3.5 h-3.5" /> 3D Garage
            </button>
            <button
              type="button"
              onClick={() => setHubTab('multiplayer')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                hubTab === 'multiplayer'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Multiplayer
            </button>
          </div>

          {/* TAB 1: CIRCUIT MODES & LAUNCH */}
          {hubTab === 'modes' && (
            <div className="p-5 sm:p-7 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-xl space-y-7 animate-in fade-in duration-200">
              <div className="text-center max-w-xl mx-auto space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-red-500/15 text-red-400 border border-red-500/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AAA 3D TYPING SPEEDWAY</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                  Kinetic Velocity. True 3D Drag Strip.
                </h1>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                  Progressive acceleration transforms every keystroke into forward momentum (+X). Hit Tab for high-octane nitro bursts!
                </p>
              </div>

              {/* Game Modes */}
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

              {/* Circuit Environments */}
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

              {/* Difficulty Tiers */}
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
                  ENTER 3D STARTING GRID (SPACE / ENTER)
                </Button>
              </div>
            </div>
          )}

          {/* TAB 2: 3D SHOWROOM GARAGE & CUSTOMIZATION */}
          {hubTab === 'garage' && (
            <div className="p-5 sm:p-7 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-xl space-y-7 animate-in fade-in">
              <div className="text-center max-w-xl mx-auto space-y-1">
                <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)]">
                  Vehicle Showroom & Paint Studio
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  Customize your supercar livery, wheel alloys, neon underglow, and nitro visual style with live 3D turntable preview.
                </p>
              </div>

              {/* 3D Turntable Preview */}
              <Racing3DGarageTurntable
                vehicleId={customVehicle.selectedVehicleId}
                primaryColor={customVehicle.primaryColor}
                secondaryColor={customVehicle.secondaryColor}
                wheelFinish={customVehicle.wheelFinish}
                glowColor={customVehicle.glowColor}
                nitroStyle={customVehicle.nitroStyle}
                driverName={driverName}
              />

              {/* Driver Identity Editor */}
              <div className="p-4 rounded-xl bg-[var(--bg-elevated)]/60 border border-[var(--border)] flex flex-col sm:flex-row items-center gap-3">
                <div className="flex-1 w-full space-y-1">
                  <label className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase">
                    Racing Display Name (Floating 3D Billboard)
                  </label>
                  <input
                    type="text"
                    maxLength={16}
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] text-sm font-mono font-bold text-[var(--text-primary)] focus:outline-none focus:border-red-500 uppercase"
                  />
                </div>
                <div className="text-xs font-mono text-zinc-400">
                  Renders floating above your car in all 3D races and multiplayer rooms.
                </div>
              </div>

              {/* Supercar Selector (5 Models) */}
              <div className="space-y-3">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Select 3D Supercar ({RACING_VEHICLES.length} Models)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {RACING_VEHICLES.map((v) => {
                    const isSelected = v.id === customVehicle.selectedVehicleId;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setCustomVehicle((prev) => ({ ...prev, selectedVehicleId: v.id }))}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-red-500 bg-red-500/10 shadow-lg ring-1 ring-red-500/50'
                            : 'border-[var(--border)] bg-[var(--bg-elevated)]/60 hover:border-red-500/40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-[var(--text-primary)]">{v.name}</span>
                          <span className="text-[9px] font-mono px-1 rounded bg-black/40 text-zinc-400">
                            {v.class}
                          </span>
                        </div>
                        <div className="space-y-1 text-[9px] font-mono text-[var(--text-secondary)]">
                          <div className="flex justify-between">
                            <span>Top Speed</span>
                            <span className="text-cyan-400">{v.topSpeed}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Acceleration</span>
                            <span className="text-emerald-400">{v.acceleration}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Nitro</span>
                            <span className="text-amber-400">{v.nitroBoost}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Paint & Visual Styling Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* 1. Body Paint Swatches */}
                <div className="space-y-2.5 p-4 rounded-xl bg-[var(--bg-elevated)]/40 border border-[var(--border)]">
                  <span className="text-xs font-mono font-bold uppercase text-[var(--text-muted)] block">
                    Body Paint Livery
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {BODY_COLOR_PALETTE.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setCustomVehicle((prev) => ({ ...prev, primaryColor: c.hex }))}
                        className={`h-9 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer ${
                          customVehicle.primaryColor === c.hex
                            ? 'border-white scale-105 shadow-md'
                            : 'border-transparent hover:border-white/40'
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      >
                        {customVehicle.primaryColor === c.hex && <Check className="w-4 h-4 text-white drop-shadow" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Wheel Rim Finishes */}
                <div className="space-y-2.5 p-4 rounded-xl bg-[var(--bg-elevated)]/40 border border-[var(--border)]">
                  <span className="text-xs font-mono font-bold uppercase text-[var(--text-muted)] block">
                    Alloy Rim Finish
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {WHEEL_FINISHES.map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setCustomVehicle((prev) => ({ ...prev, wheelFinish: w.id }))}
                        className={`p-2.5 rounded-lg border text-left font-mono text-xs transition-all cursor-pointer flex items-center gap-2 ${
                          customVehicle.wheelFinish === w.id
                            ? 'border-red-500 bg-red-500/15 text-[var(--text-primary)] font-bold'
                            : 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)]'
                        }`}
                      >
                        <div className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: w.color }} />
                        <span className="truncate">{w.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Underglow Neon */}
                <div className="space-y-2.5 p-4 rounded-xl bg-[var(--bg-elevated)]/40 border border-[var(--border)]">
                  <span className="text-xs font-mono font-bold uppercase text-[var(--text-muted)] block">
                    Underglow Neon
                  </span>
                  <div className="grid grid-cols-6 gap-2">
                    {UNDERGLOW_PALETTE.map((u) => (
                      <button
                        key={u.hex}
                        type="button"
                        onClick={() => setCustomVehicle((prev) => ({ ...prev, glowColor: u.hex }))}
                        className={`h-9 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer ${
                          customVehicle.glowColor === u.hex
                            ? 'border-white scale-105 shadow-md'
                            : 'border-transparent hover:border-white/40'
                        }`}
                        style={{ backgroundColor: u.hex }}
                        title={u.name}
                      >
                        {customVehicle.glowColor === u.hex && <Check className="w-4 h-4 text-white drop-shadow" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 6 Distinct Nitro Visual Styles */}
              <div className="space-y-3">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Customizable Nitro Visual System (6 Styles)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {NITRO_STYLES.map((style) => {
                    const isSelected = customVehicle.nitroStyle === style.id;
                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setCustomVehicle((prev) => ({ ...prev, nitroStyle: style.id }))}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-red-500 bg-red-500/10 shadow-lg ring-1 ring-red-500/50'
                            : 'border-[var(--border)] bg-[var(--bg-elevated)]/60 hover:border-red-500/40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <Flame className="w-4 h-4" style={{ color: style.color }} />
                            <span className="text-xs font-bold text-[var(--text-primary)]">{style.name}</span>
                          </div>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-zinc-300">
                            {style.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                          {style.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: REAL MULTIPLAYER ROOMS & LOBBY */}
          {hubTab === 'multiplayer' && (
            <Racing3DMultiplayerLobby
              customVehicle={customVehicle}
              driverName={driverName}
              onStartMultiplayerRace={handleStartMultiplayerRace}
              onBackToGarage={() => setHubTab('modes')}
            />
          )}
        </div>
      )}

      {/* 3. ACTIVE 3D RACING VIEWPORT & HEADS-UP DISPLAY */}
      {(gameState === 'racing' || gameState === 'countdown') && (
        <div className="relative rounded-2xl overflow-hidden border border-[var(--border)] shadow-2xl bg-black animate-in fade-in duration-150">
          {/* Stable Aspect-Ratio 3D Mount Stage */}
          <div ref={mountRef} className="w-full h-[400px] sm:h-[460px] cursor-text" />

          {/* Hidden continuous typing input anchor */}
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

          {/* COUNTDOWN OVERLAY ON TOP OF 3D STARTING GRID */}
          {gameState === 'countdown' && (
            <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px] flex flex-col items-center justify-center space-y-4 text-center z-30 animate-in fade-in">
              <span className="text-xs font-mono uppercase tracking-widest text-red-400 font-bold">
                GRID READY • REVVING ENGINES
              </span>
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center shadow-2xl animate-pulse">
                <span className="text-5xl sm:text-6xl font-black text-red-500 font-mono">
                  {countdown > 0 ? countdown : 'GO!'}
                </span>
              </div>
              <p className="text-xs font-mono text-zinc-300">
                Continuous typing propels your vehicle along +X!
              </p>
            </div>
          )}

          {/* Top Live Telemetry HUD Bar */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none z-20">
            {/* Live Placement Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/75 border border-white/10 backdrop-blur-md shadow-lg">
              <span className="text-xs font-mono text-zinc-400">POS</span>
              <span className="text-lg font-black text-white font-mono">
                #{currentPlacement}
              </span>
              <span className="text-xs font-mono text-zinc-400">/ 4</span>
            </div>

            {/* Live Velocity & Accuracy Badges */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/75 border border-white/10 backdrop-blur-md shadow-lg">
                <Gauge className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-mono font-bold text-cyan-400">{liveWpm}</span>
                <span className="text-[10px] font-mono text-zinc-400">WPM</span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/75 border border-white/10 backdrop-blur-md shadow-lg">
                <Award className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-mono font-bold text-emerald-400">{liveAccuracy}%</span>
              </div>

              {comboStreak > 5 && (
                <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold animate-pulse">
                  <Zap className="w-3.5 h-3.5" />
                  <span>{comboStreak} STREAK</span>
                </div>
              )}
            </div>

            {/* Nitro Boost Button / Trigger */}
            <button
              type="button"
              onClick={triggerNitroBoost}
              disabled={nitroMeter < 25 || isNitroActive}
              className={`pointer-events-auto px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-lg ${
                isNitroActive
                  ? 'bg-cyan-500 text-white animate-pulse shadow-cyan-500/50'
                  : nitroMeter >= 25
                  ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-amber-500/30'
                  : 'bg-black/60 text-zinc-500 border border-white/10'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>{isNitroActive ? 'NITRO ENGAGED' : 'NITRO (TAB)'}</span>
              <span className="text-[10px] opacity-80">{Math.round(nitroMeter)}%</span>
            </button>
          </div>

          {/* Bottom HUD: Continuous Passage Stream Sliding Window */}
          <div className="absolute bottom-3 left-3 right-3 p-4 rounded-xl bg-black/85 border border-white/10 backdrop-blur-md z-20">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-2 pb-1 border-b border-white/10">
              <span className="text-[11px] font-bold text-red-400 uppercase tracking-wide">
                CONTINUOUS PASSAGE STREAM • TYPING FOCUS ACTIVE
              </span>
              <span>{viewportData.globalCursor} chars typed</span>
            </div>

            <div className="text-base sm:text-xl font-mono leading-relaxed select-none tracking-wide text-zinc-400">
              {viewportData.windowText.split('').map((char, index) => {
                const isTyped = index < viewportData.relativeCursor;
                const isCurrent = index === viewportData.relativeCursor;

                let charClass = 'text-zinc-600';
                if (isTyped) {
                  charClass = 'text-emerald-400 font-bold';
                } else if (isCurrent) {
                  charClass = hasTypingError
                    ? 'bg-red-500 text-white rounded-xs px-0.5 animate-pulse'
                    : 'bg-red-500 text-white rounded-xs px-0.5 shadow-sm';
                }

                return (
                  <span key={index} className={charClass}>
                    {char === ' ' ? ' ' : char}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. GAME OVER & RACE RESULTS PODIUM */}
      {gameState === 'gameover' && finalResults && (
        <div className="p-6 sm:p-8 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
              CHECKERED FLAG • RACE CONCLUDED
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)]">
              {finalResults.isWinner ? 'Victory Podium Finish!' : `Placed #${finalResults.placement}`}
            </h2>
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
                  <span className={s.id === (driverName || 'YOU') ? 'font-bold text-red-400' : 'text-[var(--text-primary)]'}>
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
