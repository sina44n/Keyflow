import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
} from 'lucide-react';
import { Button } from '../../common/Button';
import { useI18n } from '../../../i18n/I18nContext';
import { ArcadeExitDialog } from '../ArcadeExitDialog';
import { saveArcadeRecord, getGameRecord } from '../../../utils/arcadeStorage';
import {
  RACING_TIERS,
  RACING_VEHICLES,
  RACING_ENVIRONMENTS,
  AI_COMPETITORS,
  calculateRacingTier,
  getRacingPassage,
  computeAiProgress,
} from '../../../utils/racingDifficulty';

/**
 * Procedural Web Audio Engine for Racing Sound Effects
 */
class RacingAudioEngine {
  constructor() {
    this.ctx = null;
    this.engineOsc = null;
    this.engineGain = null;
    this.isMuted = false;
  }

  init() {
    if (this.ctx || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    } catch {
      // AudioContext unavailable or blocked
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setValueAtTime(muted ? 0 : 0.04, this.ctx.currentTime);
    }
  }

  startEngine() {
    if (this.isMuted || !this.ctx || this.engineOsc) return;
    try {
      this.resume();
      const now = this.ctx.currentTime;
      this.engineOsc = this.ctx.createOscillator();
      this.engineGain = this.ctx.createGain();

      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(65, now); // Low idle rumble
      this.engineGain.gain.setValueAtTime(0.04, now);

      // Low pass filter for engine roar warmth
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);

      this.engineOsc.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc.start(now);
    } catch {
      // Safe fallback
    }
  }

  updateEngineRpm(wpm) {
    if (this.isMuted || !this.ctx || !this.engineOsc) return;
    try {
      const now = this.ctx.currentTime;
      const targetFreq = 65 + Math.min(180, (wpm || 0) * 1.5);
      this.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.08);
    } catch {
      // Safe fallback
    }
  }

  stopEngine() {
    if (this.engineOsc && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.engineGain.gain.linearRampToValueAtTime(0.001, now + 0.1);
        this.engineOsc.stop(now + 0.12);
      } catch {
        // Safe fallback
      }
      this.engineOsc = null;
      this.engineGain = null;
    }
  }

  playKeystroke() {
    if (this.isMuted || !this.ctx) return;
    try {
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.04);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // Safe fallback
    }
  }

  playCountdown(step) {
    if (this.isMuted || !this.ctx) return;
    try {
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const isGo = step === 0;
      const freq = isGo ? 880 : 440;
      const dur = isGo ? 0.35 : 0.14;

      osc.type = isGo ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(isGo ? 0.2 : 0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + dur);
    } catch {
      // Safe fallback
    }
  }

  playNitro() {
    if (this.isMuted || !this.ctx) return;
    try {
      this.resume();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(750, now + 0.25);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // Safe fallback
    }
  }

  playVictory() {
    if (this.isMuted || !this.ctx) return;
    try {
      this.resume();
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        const t = this.ctx.currentTime + idx * 0.1;
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.15, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        o.connect(g);
        g.connect(this.ctx.destination);
        o.start(t);
        o.stop(t + 0.45);
      });
    } catch {
      // Safe fallback
    }
  }

  cleanup() {
    this.stopEngine();
    if (this.ctx && this.ctx.state !== 'closed') {
      try {
        this.ctx.close().catch(() => {});
      } catch {}
      this.ctx = null;
    }
  }
}

/**
 * Helper to format seconds as mm:ss.ms
 */
const formatLapTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '00:00.00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
};

/**
 * NitroRacingGame Component
 * ==========================
 * Professional HTML5 Canvas Drag Speedway Racing Game
 */
export const NitroRacingGame = ({ onExit, soundEnabled = true }) => {
  const { t } = useI18n();

  // Load existing records
  const personalBest = useMemo(() => getGameRecord('nitro'), []);

  // Player Selections
  const [selectedVehicleId, setSelectedVehicleId] = useState('apex-gt');
  const [selectedEnvId, setSelectedEnvId] = useState('speedway');
  const [selectedTier, setSelectedTier] = useState(() => {
    return calculateRacingTier({
      currentTier: personalBest?.highestTier || 1,
      recentWpm: personalBest?.bestWpm || 0,
      racesCompleted: personalBest?.gamesPlayed || 0,
    });
  });

  // Game Lifecycle States: 'garage' | 'countdown' | 'racing' | 'gameover'
  const [gameState, setGameState] = useState('garage');
  const [countdown, setCountdown] = useState(3);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

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

  // Passage & Typing State
  const [passage, setPassage] = useState('');
  const [typedChars, setTypedChars] = useState('');
  const [errorsCount, setErrorsCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [hasError, setHasError] = useState(false);

  // Live Performance Metrics
  const [liveWpm, setLiveWpm] = useState(0);
  const [peakWpm, setPeakWpm] = useState(0);
  const [liveAccuracy, setLiveAccuracy] = useState(100);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [nitroMeter, setNitroMeter] = useState(0); // 0 to 100
  const [isNitroActive, setIsNitroActive] = useState(false);
  const [nitroBurstsUsed, setNitroBurstsUsed] = useState(0);
  const [currentPlacement, setCurrentPlacement] = useState(1);

  // Racers kinematic positions: meters from start
  const targetDistance = tierConfig.trackDistance;
  const [racersState, setRacersState] = useState({
    player: { id: 'player', name: 'YOU', distance: 0, progress: 0, placement: 1, finished: false, finishTime: null },
    xavier: { id: 'xavier', name: 'Xavier', distance: 0, progress: 0, placement: 2, finished: false, finishTime: null },
    thomas: { id: 'thomas', name: 'Thomas', distance: 0, progress: 0, placement: 3, finished: false, finishTime: null },
    joshua: { id: 'joshua', name: 'Joshua', distance: 0, progress: 0, placement: 4, finished: false, finishTime: null },
  });

  // Final Results state
  const [finalResults, setFinalResults] = useState(null);

  // Refs for animation loop and audio
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastFrameTimeRef = useRef(0);
  const raceStartTimeRef = useRef(0);
  const audioRef = useRef(null);
  const inputRef = useRef(null);
  const nitroTimeoutRef = useRef(null);

  // Initialize audio engine
  useEffect(() => {
    audioRef.current = new RacingAudioEngine();
    audioRef.current.init();
    audioRef.current.setMuted(!soundEnabled);

    return () => {
      audioRef.current?.cleanup();
    };
  }, [soundEnabled]);

  // Sync mute state
  useEffect(() => {
    audioRef.current?.setMuted(!soundEnabled);
  }, [soundEnabled]);

  // Keep typing input focused
  const ensureFocus = useCallback(() => {
    if (gameState === 'racing' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameState]);

  // Start Race Sequence (Garage -> Countdown -> Racing)
  const handleStartRace = useCallback(() => {
    const text = getRacingPassage(selectedTier);
    setPassage(text);
    setTypedChars('');
    setErrorsCount(0);
    setCorrectCount(0);
    setHasError(false);
    setLiveWpm(0);
    setPeakWpm(0);
    setLiveAccuracy(100);
    setElapsedTime(0);
    setNitroMeter(15); // Start with 15% primer
    setIsNitroActive(false);
    setNitroBurstsUsed(0);
    setCurrentPlacement(1);
    setFinalResults(null);

    setRacersState({
      player: { id: 'player', name: 'YOU', distance: 0, progress: 0, placement: 1, finished: false, finishTime: null },
      xavier: { id: 'xavier', name: 'Xavier', distance: 0, progress: 0, placement: 2, finished: false, finishTime: null },
      thomas: { id: 'thomas', name: 'Thomas', distance: 0, progress: 0, placement: 3, finished: false, finishTime: null },
      joshua: { id: 'joshua', name: 'Joshua', distance: 0, progress: 0, placement: 4, finished: false, finishTime: null },
    });

    setGameState('countdown');
    setCountdown(3);
    audioRef.current?.playCountdown(3);
  }, [selectedTier]);

  // Countdown timer effect
  useEffect(() => {
    if (gameState !== 'countdown') return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        const next = countdown - 1;
        setCountdown(next);
        audioRef.current?.playCountdown(next);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Countdown completed (GO!)
      const timer = setTimeout(() => {
        setGameState('racing');
        raceStartTimeRef.current = performance.now();
        lastFrameTimeRef.current = performance.now();
        audioRef.current?.startEngine();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [gameState, countdown]);

  // Activate Nitro Boost
  const triggerNitroBoost = useCallback(() => {
    if (isNitroActive || nitroMeter < 30 || gameState !== 'racing') return;

    setIsNitroActive(true);
    setNitroBurstsUsed((prev) => prev + 1);
    setNitroMeter(0);
    audioRef.current?.playNitro();

    if (nitroTimeoutRef.current) clearTimeout(nitroTimeoutRef.current);
    nitroTimeoutRef.current = setTimeout(() => {
      setIsNitroActive(false);
    }, 2800);
  }, [isNitroActive, nitroMeter, gameState]);

  // Handle typing input
  const handleKeyDown = useCallback(
    (e) => {
      if (gameState !== 'racing') return;

      // Space to activate nitro if meter is ready and space is not the target char
      const targetChar = passage[typedChars.length];
      if (e.key === ' ' && targetChar !== ' ' && nitroMeter >= 50) {
        e.preventDefault();
        triggerNitroBoost();
        return;
      }

      if (e.key === 'Backspace') {
        e.preventDefault();
        if (typedChars.length > 0) {
          setTypedChars((prev) => prev.slice(0, -1));
          setHasError(false);
        }
        return;
      }

      // Ignore special navigation keys
      if (e.key.length > 1 || e.ctrlKey || e.altKey || e.metaKey) {
        return;
      }

      e.preventDefault();
      const expectedChar = passage[typedChars.length];
      if (!expectedChar) return;

      if (e.key === expectedChar) {
        // Correct Keystroke
        const newTyped = typedChars + e.key;
        setTypedChars(newTyped);
        setCorrectCount((c) => c + 1);
        setHasError(false);

        // Keystroke sound & engine update
        audioRef.current?.playKeystroke();

        // Increment nitro meter on accurate streaks
        setNitroMeter((prev) => Math.min(100, prev + 2.8));

        // Auto-trigger nitro if full
        if (nitroMeter + 2.8 >= 100) {
          triggerNitroBoost();
        }

        // Calculate progress proportion
        const progressFrac = Math.min(1, newTyped.length / passage.length);
        const playerDist = progressFrac * targetDistance;

        setRacersState((prev) => ({
          ...prev,
          player: {
            ...prev.player,
            distance: playerDist,
            progress: progressFrac * 100,
            finished: progressFrac >= 1,
            finishTime: progressFrac >= 1 && !prev.player.finished ? (performance.now() - raceStartTimeRef.current) / 1000 : prev.player.finishTime,
          },
        }));

        // If player typed all characters, trigger race finish
        if (newTyped.length >= passage.length) {
          audioRef.current?.stopEngine();
          audioRef.current?.playVictory();
        }
      } else {
        // Error Keystroke
        setErrorsCount((err) => err + 1);
        setHasError(true);
        // Slight penalty on nitro meter
        setNitroMeter((prev) => Math.max(0, prev - 5));
      }
    },
    [gameState, passage, typedChars, nitroMeter, targetDistance, triggerNitroBoost]
  );

  // Main 60 FPS Simulation & Canvas Render Loop
  useEffect(() => {
    if (gameState !== 'racing') return;

    let roadOffset = 0;

    const renderLoop = (timestamp) => {
      if (!lastFrameTimeRef.current) lastFrameTimeRef.current = timestamp;
      const dt = Math.min(0.1, (timestamp - lastFrameTimeRef.current) / 1000);
      lastFrameTimeRef.current = timestamp;

      // Update elapsed time
      const elapsed = Math.max(0.1, (timestamp - raceStartTimeRef.current) / 1000);
      setElapsedTime(elapsed);

      // Calculate live WPM & accuracy
      const wordsTyped = correctCount / 5;
      const currentWpmVal = Math.round((wordsTyped / elapsed) * 60) || 0;
      const totalStrokes = correctCount + errorsCount;
      const accVal = totalStrokes > 0 ? Math.round((correctCount / totalStrokes) * 100) : 100;

      setLiveWpm(currentWpmVal);
      setPeakWpm((peak) => Math.max(peak, currentWpmVal));
      setLiveAccuracy(accVal);
      audioRef.current?.updateEngineRpm(currentWpmVal);

      // Vehicle stat multipliers
      const vehicleSpeedBonus = (vehicle.topSpeed - 80) * 0.005;
      const nitroMultiplier = isNitroActive ? 1.45 : 1.0;

      // Advance AI competitors
      setRacersState((prev) => {
        const next = { ...prev };
        let allFinished = next.player.finished;

        AI_COMPETITORS.forEach((ai) => {
          const racer = next[ai.id];
          if (!racer || racer.finished) return;

          const speedMps = computeAiProgress({
            aiRacer: ai,
            tierConfig,
            playerWpm: currentWpmVal * nitroMultiplier * (1 + vehicleSpeedBonus),
            elapsedSeconds: elapsed,
            currentProgress: racer.progress,
            targetDistance,
          });

          const newDist = Math.min(targetDistance, racer.distance + speedMps * dt);
          const newProgress = (newDist / targetDistance) * 100;
          const isDone = newDist >= targetDistance;

          next[ai.id] = {
            ...racer,
            distance: newDist,
            progress: newProgress,
            finished: isDone,
            finishTime: isDone && !racer.finished ? elapsed : racer.finishTime,
          };

          if (!isDone) allFinished = false;
        });

        // Compute live placements
        const list = [next.player, next.xavier, next.thomas, next.joshua];
        list.sort((a, b) => b.distance - a.distance);
        list.forEach((r, idx) => {
          if (next[r.id]) {
            next[r.id].placement = idx + 1;
          }
        });

        if (next.player) {
          setCurrentPlacement(next.player.placement);
        }

        // If player has finished, end the race after brief buffer
        if (next.player.finished && !finalResults) {
          const finalWpmVal = currentWpmVal;
          const finalAccVal = accVal;
          const playerRank = next.player.placement;

          // Save arcade record
          saveArcadeRecord('nitro', {
            wpm: finalWpmVal,
            accuracy: finalAccVal,
            distance: targetDistance,
            placement: playerRank,
            highestTier: selectedTier,
          });

          setFinalResults({
            placement: playerRank,
            finalWpm: finalWpmVal,
            peakWpm: Math.max(peakWpm, finalWpmVal),
            accuracy: finalAccVal,
            elapsedTime: elapsed,
            tierName: tierConfig.name,
            rewardCoins: playerRank === 1 ? tierConfig.rewardCoins : Math.round(tierConfig.rewardCoins * 0.4),
            standings: list.map((r) => ({
              id: r.id,
              name: r.name,
              placement: r.placement,
              time: r.finishTime || elapsed + (targetDistance - r.distance) / 25,
            })),
          });

          setTimeout(() => {
            setGameState('gameover');
          }, 1200);
        }

        return next;
      });

      // ==========================================
      // HTML5 CANVAS RENDERING (60 FPS Speedway)
      // ==========================================
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Dynamic road speed based on player movement
        const scrollSpeed = (Math.max(25, currentWpmVal) * 12 + (isNitroActive ? 300 : 0)) * dt;
        roadOffset = (roadOffset + scrollSpeed) % 80;

        // 1. Sky & Horizon Gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, 110);
        skyGrad.addColorStop(0, environment.skyGradient[0]);
        skyGrad.addColorStop(0.6, environment.skyGradient[1]);
        skyGrad.addColorStop(1, environment.skyGradient[2]);
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, 110);

        // 2. Stadium Floodlights & Horizon Silhouettes
        ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
        ctx.beginPath();
        for (let x = 0; x < width; x += 120) {
          ctx.rect(x + 20, 60, 24, 50);
          ctx.rect(x + 10, 45, 44, 15);
        }
        ctx.fill();

        // Floodlight glow cones
        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        for (let x = 30; x < width; x += 120) {
          ctx.beginPath();
          ctx.moveTo(x + 10, 45);
          ctx.lineTo(x - 50, 140);
          ctx.lineTo(x + 70, 140);
          ctx.closePath();
          ctx.fill();
        }

        // 3. Speedway Banners & Guardrail
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(0, 105, width, 25);
        ctx.fillStyle = environment.accentColor;
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        environment.crowdBanners.forEach((b, idx) => {
          const bx = 100 + idx * 240 - ((roadOffset * 0.4) % 240);
          if (bx > -100 && bx < width + 100) {
            ctx.fillText(`★ ${b} ★`, bx, 122);
          }
        });

        // 4. Red/White Speedway Curbs (Top & Bottom)
        const curbBlockWidth = 40;
        const curbHeight = 8;
        for (let x = -curbBlockWidth; x < width + curbBlockWidth; x += curbBlockWidth) {
          const blockIdx = Math.floor((x + roadOffset) / curbBlockWidth);
          ctx.fillStyle = blockIdx % 2 === 0 ? environment.curbColors[0] : environment.curbColors[1];
          ctx.fillRect(x - (roadOffset % curbBlockWidth), 130, curbBlockWidth, curbHeight);
          ctx.fillRect(x - (roadOffset % curbBlockWidth), height - 12, curbBlockWidth, curbHeight);
        }

        // 5. Asphalt Racing Surface (4 Lanes)
        const trackTop = 138;
        const trackBottom = height - 12;
        const trackHeight = trackBottom - trackTop;
        const laneHeight = trackHeight / 4;

        ctx.fillStyle = environment.roadColor;
        ctx.fillRect(0, trackTop, width, trackHeight);

        // Lane divider dashed lines
        ctx.strokeStyle = environment.laneDividerColor;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([28, 22]);
        ctx.lineDashOffset = -roadOffset;

        for (let lane = 1; lane < 4; lane++) {
          const y = trackTop + lane * laneHeight;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
        ctx.setLineDash([]); // Reset line dash

        // Checkered Start Gantry (Visible at start: <12% player progress)
        const playerProgress = racersState.player.progress;
        if (playerProgress < 15) {
          const startX = 70 - (playerProgress / 15) * 220;
          if (startX > -40) {
            ctx.fillStyle = '#FFFFFF';
            for (let y = trackTop; y < trackBottom; y += 14) {
              ctx.fillRect(startX, y, 7, 7);
              ctx.fillRect(startX + 7, y + 7, 7, 7);
            }
          }
        }

        // Checkered Finish Gantry (Visible near end: >82% player progress)
        if (playerProgress > 78) {
          const finishFrac = (playerProgress - 78) / 22;
          const finishX = width - 120 + (1 - finishFrac) * 250;
          if (finishX < width + 60) {
            // Checkered asphalt line
            for (let y = trackTop; y < trackBottom; y += 14) {
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(finishX, y, 8, 7);
              ctx.fillStyle = '#000000';
              ctx.fillRect(finishX + 8, y, 8, 7);
              ctx.fillStyle = '#000000';
              ctx.fillRect(finishX, y + 7, 8, 7);
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(finishX + 8, y + 7, 8, 7);
            }

            // Gantry Overhead Arch
            ctx.fillStyle = '#E2E8F0';
            ctx.fillRect(finishX + 4, 100, 8, trackHeight + 38);
            ctx.fillStyle = '#EF4444';
            ctx.fillRect(finishX - 30, 85, 76, 20);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('FINISH', finishX + 8, 99);
          }
        }

        // 6. Render 4 Racers
        const racersToDraw = [
          { data: racersState.xavier, lane: 0, color: '#A855F7', accent: '#C084FC', isPlayer: false },
          { data: racersState.thomas, lane: 1, color: '#38BDF8', accent: '#7DD3FC', isPlayer: false },
          { data: racersState.player, lane: 2, color: vehicle.color, accent: vehicle.secondaryColor, isPlayer: true },
          { data: racersState.joshua, lane: 3, color: '#FACC15', accent: '#FEF08A', isPlayer: false },
        ];

        racersToDraw.forEach(({ data, lane, color, accent, isPlayer }) => {
          if (!data) return;
          const laneY = trackTop + lane * laneHeight + laneHeight / 2;

          // Compute X position: based on progress relative to player
          // Base player at X = width * 0.38
          const playerDist = racersState.player.distance;
          const deltaFromPlayer = data.distance - playerDist;
          // Scale: 1 meter ≈ 2.2 pixels on screen
          const screenX = width * 0.36 + deltaFromPlayer * 2.2;
          const clampedX = Math.max(50, Math.min(width - 90, screenX));

          // Draw Speed Streaks when moving fast
          if (currentWpmVal > 45 || isNitroActive) {
            ctx.strokeStyle = isPlayer && isNitroActive ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 1.5;
            for (let s = 0; s < 3; s++) {
              const streakY = laneY - 10 + s * 9;
              ctx.beginPath();
              ctx.moveTo(clampedX - 25, streakY);
              ctx.lineTo(clampedX - 65 - Math.random() * 35, streakY);
              ctx.stroke();
            }
          }

          // Draw Underglow Neon
          ctx.save();
          ctx.shadowColor = isPlayer ? vehicle.glowColor : color;
          ctx.shadowBlur = isPlayer && isNitroActive ? 22 : 12;
          ctx.fillStyle = isPlayer ? vehicle.color : color;
          ctx.beginPath();
          ctx.ellipse(clampedX + 28, laneY + 14, 32, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Draw Exhaust Flames (Active on player when typing or nitro, or AI spurts)
          const showFlames = (isPlayer && (currentWpmVal > 30 || isNitroActive)) || (!isPlayer && Math.random() > 0.6);
          if (showFlames) {
            ctx.save();
            const flameLen = isPlayer && isNitroActive ? 28 + Math.random() * 12 : 14 + Math.random() * 8;
            const flameGrad = ctx.createLinearGradient(clampedX - 4, laneY + 8, clampedX - 4 - flameLen, laneY + 8);
            if (isPlayer && isNitroActive) {
              flameGrad.addColorStop(0, '#FFFFFF');
              flameGrad.addColorStop(0.3, '#38BDF8');
              flameGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
            } else {
              flameGrad.addColorStop(0, '#FFFFFF');
              flameGrad.addColorStop(0.3, '#F59E0B');
              flameGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
            }
            ctx.fillStyle = flameGrad;
            ctx.beginPath();
            ctx.moveTo(clampedX - 2, laneY + 4);
            ctx.lineTo(clampedX - 4 - flameLen, laneY + 8);
            ctx.lineTo(clampedX - 2, laneY + 12);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          }

          // ==============================
          // DRAW AERODYNAMIC SPORTS CAR
          // ==============================
          ctx.save();
          const carX = clampedX;
          const carY = laneY - 12;

          // Main Chassis Body
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.moveTo(carX, carY + 14); // Front bumper splitter
          ctx.lineTo(carX + 18, carY + 8); // Hood slope
          ctx.lineTo(carX + 34, carY + 1); // Windshield base
          ctx.lineTo(carX + 50, carY + 1); // Roofline
          ctx.lineTo(carX + 64, carY + 7); // Rear fastback
          ctx.lineTo(carX + 68, carY + 14); // Rear diffuser
          ctx.lineTo(carX + 64, carY + 19);
          ctx.lineTo(carX + 4, carY + 19);
          ctx.closePath();
          ctx.fill();

          // Tinted Cockpit / Windshield
          ctx.fillStyle = '#0F172A';
          ctx.beginPath();
          ctx.moveTo(carX + 22, carY + 8);
          ctx.lineTo(carX + 34, carY + 3);
          ctx.lineTo(carX + 48, carY + 3);
          ctx.lineTo(carX + 54, carY + 8);
          ctx.closePath();
          ctx.fill();

          // Rear High-Downforce Spoiler Wing
          ctx.fillStyle = accent || '#1E293B';
          ctx.fillRect(carX + 60, carY - 2, 7, 3);
          ctx.fillRect(carX + 62, carY + 1, 3, 5);

          // Headlights with Forward Beam
          ctx.fillStyle = '#FDE047';
          ctx.fillRect(carX - 1, carY + 12, 3, 4);

          // Front light beam onto road
          const beamGrad = ctx.createLinearGradient(carX - 2, carY + 14, carX - 35, carY + 18);
          beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
          beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
          ctx.fillStyle = beamGrad;
          ctx.beginPath();
          ctx.moveTo(carX - 2, carY + 13);
          ctx.lineTo(carX - 40, carY + 10);
          ctx.lineTo(carX - 40, carY + 22);
          ctx.lineTo(carX - 2, carY + 17);
          ctx.closePath();
          ctx.fill();

          // 2 Alloy Wheels (Side Profile)
          const wheelRadius = 5.5;
          const wheelY = carY + 18;
          [carX + 14, carX + 52].forEach((wx) => {
            // Tire
            ctx.fillStyle = '#111827';
            ctx.beginPath();
            ctx.arc(wx, wheelY, wheelRadius, 0, Math.PI * 2);
            ctx.fill();
            // Rim
            ctx.fillStyle = '#94A3B8';
            ctx.beginPath();
            ctx.arc(wx, wheelY, wheelRadius * 0.5, 0, Math.PI * 2);
            ctx.fill();
          });

          // Floating Position Badge (#1, #2, #3, #4)
          const badgeX = carX + 32;
          const badgeY = carY - 8;
          ctx.fillStyle = isPlayer ? 'rgba(239, 68, 68, 0.95)' : 'rgba(15, 23, 42, 0.85)';
          ctx.beginPath();
          ctx.roundRect(badgeX - 22, badgeY - 8, 44, 14, 4);
          ctx.fill();
          ctx.strokeStyle = isPlayer ? '#FCA5A5' : 'rgba(255, 255, 255, 0.2)';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 8.5px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`#${data.placement} ${data.name}`, badgeX, badgeY + 2.5);

          ctx.restore();
        });
      }

      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animationFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    gameState,
    correctCount,
    errorsCount,
    tierConfig,
    targetDistance,
    vehicle,
    environment,
    isNitroActive,
    peakWpm,
    selectedTier,
    finalResults,
  ]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4" onClick={ensureFocus}>
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
                Nitro Type Pro
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                Tier {selectedTier}: {tierConfig.name}
              </span>
            </div>
            <p className="text-[11px] font-mono text-[var(--text-muted)]">
              {environment.name} • 4-Lane Drag Strip
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

      {/* 2. GARAGE SCREEN (Vehicle, Environment & Tier Selection) */}
      {gameState === 'garage' && (
        <div className="p-5 sm:p-7 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-xl space-y-7 animate-in fade-in duration-200">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-red-500/15 text-red-400 border border-red-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>CHAMPIONSHIP GARAGE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Tune Your Supercar. Rule the Strip.
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
              Type accurately to accelerate through 4 horizontal lanes against Xavier, Thomas, and Joshua.
            </p>
          </div>

          {/* Supercar Selector (5 Vehicles) */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Select Supercar ({RACING_VEHICLES.length} Models)
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
                        : 'border-[var(--border)] bg-[var(--bg-elevated)]/60 hover:border-red-500/50 hover:bg-[var(--bg-elevated)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[var(--text-primary)] group-hover:text-red-400 transition-colors">
                        {v.name}
                      </span>
                      <div
                        className="w-3 h-3 rounded-full shadow-xs"
                        style={{ backgroundColor: v.color }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-[var(--text-muted)] block mb-3">
                      {v.class}
                    </span>

                    {/* Compact Specs Bars */}
                    <div className="space-y-1.5 text-[9px] font-mono text-[var(--text-secondary)]">
                      <div>
                        <div className="flex justify-between">
                          <span>Speed</span>
                          <span>{v.topSpeed}</span>
                        </div>
                        <div className="h-1 rounded-full bg-[var(--border)] overflow-hidden mt-0.5">
                          <div className="h-full bg-cyan-400" style={{ width: `${v.topSpeed}%` }} />
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

          {/* Environment & Track Selector (4 Tracks) */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Select Circuit & Lighting
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
                    <div className="h-1.5 w-full rounded-full mb-2" style={{ background: `linear-gradient(to right, ${env.skyGradient[1]}, ${env.accentColor})` }} />
                    <div className="text-xs font-bold text-[var(--text-primary)]">{env.name}</div>
                    <div className="text-[10px] font-mono text-[var(--text-muted)]">{env.theme}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tier & Competitor Difficulty Slider/Pills (8 Tiers) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Championship Division (Difficulty Tier)
              </h3>
              <span className="text-xs font-mono text-orange-400">
                Target: {tierConfig.minWpm}–{tierConfig.maxWpm} WPM • AI Pace: {tierConfig.aiBaseWpm} WPM
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

          {/* Launch Action */}
          <div className="pt-2 text-center">
            <Button
              variant="primary"
              size="lg"
              icon={Play}
              onClick={handleStartRace}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 shadow-xl hover:shadow-red-600/25 transition-all text-sm sm:text-base cursor-pointer"
            >
              LAUNCH INTO SPEEDWAY (SPACE / ENTER)
            </Button>
          </div>
        </div>
      )}

      {/* 3. COUNTDOWN SCREEN */}
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
            Keep your fingers on home row. Type immediately when the light turns green!
          </p>
        </div>
      )}

      {/* 4. ACTIVE LIVE RACE ARENA */}
      {gameState === 'racing' && (
        <div className="space-y-3">
          {/* Real-time Telemetry HUD Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] font-mono text-center shadow-md">
            {/* 1. Placement */}
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

            {/* 2. Live Speedometer WPM */}
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

            {/* 3. Accuracy */}
            <div className="p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
              <span className="text-[10px] uppercase text-[var(--text-muted)] block">Accuracy</span>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-lg font-extrabold text-emerald-400">
                  {liveAccuracy}%
                </span>
              </div>
            </div>

            {/* 4. Lap Timer */}
            <div className="p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
              <span className="text-[10px] uppercase text-[var(--text-muted)] block">Lap Time</span>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-base font-bold text-[var(--text-primary)]">
                  {formatLapTime(elapsedTime)}
                </span>
              </div>
            </div>

            {/* 5. Nitro Boost Gauge */}
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

          {/* 60 FPS HTML5 Speedway Canvas */}
          <div className="rounded-2xl overflow-hidden border border-[var(--border)] shadow-2xl bg-black relative">
            <canvas
              ref={canvasRef}
              width={960}
              height={380}
              className="w-full h-auto block"
            />

            {/* Mini-Track Progress Bar Overlay at bottom */}
            <div className="absolute bottom-2 left-4 right-4 py-1.5 px-3 rounded-lg bg-black/75 backdrop-blur-xs border border-white/10 flex items-center gap-3 text-[10px] font-mono text-white/80">
              <span className="shrink-0 flex items-center gap-1 text-red-400 font-bold">
                <Flag className="w-3 h-3" /> TRACK PROGRESS
              </span>
              <div className="flex-1 h-2 rounded-full bg-white/15 relative overflow-hidden">
                {/* 4 Car Markers */}
                <div
                  className="absolute top-0 bottom-0 w-2 rounded-full bg-purple-400 transition-all duration-75"
                  style={{ left: `${Math.min(98, racersState.xavier.progress)}%` }}
                  title="Xavier"
                />
                <div
                  className="absolute top-0 bottom-0 w-2 rounded-full bg-cyan-400 transition-all duration-75"
                  style={{ left: `${Math.min(98, racersState.thomas.progress)}%` }}
                  title="Thomas"
                />
                <div
                  className="absolute top-0 bottom-0 w-3 rounded-full bg-red-500 shadow-sm shadow-red-500 ring-1 ring-white transition-all duration-75 z-10"
                  style={{ left: `${Math.min(98, racersState.player.progress)}%` }}
                  title="YOU"
                />
                <div
                  className="absolute top-0 bottom-0 w-2 rounded-full bg-yellow-400 transition-all duration-75"
                  style={{ left: `${Math.min(98, racersState.joshua.progress)}%` }}
                  title="Joshua"
                />
              </div>
              <span className="shrink-0 font-bold text-white">
                {Math.round(racersState.player.progress)}%
              </span>
            </div>
          </div>

          {/* Ergonomic Typing Passage Viewport */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border transition-all shadow-xl bg-[var(--bg-surface)] ${
              hasError
                ? 'border-red-500 ring-2 ring-red-500/20'
                : 'border-[var(--border)] focus-within:border-[var(--accent)]'
            }`}
          >
            {/* Hidden Input to capture keystrokes reliably */}
            <input
              ref={inputRef}
              type="text"
              autoFocus
              value=""
              onChange={() => {}}
              onKeyDown={handleKeyDown}
              className="opacity-0 absolute -z-10 w-0 h-0"
              aria-label="Racing Typing Input"
            />

            <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)] mb-2.5 pb-2 border-b border-[var(--border)]">
              <span>RACE PASSAGE • TYPING FOCUS ACTIVE</span>
              <span>
                {typedChars.length} / {passage.length} chars
              </span>
            </div>

            {/* Letter by letter formatted text */}
            <div className="text-base sm:text-xl font-mono leading-relaxed select-none tracking-wide">
              {passage.split('').map((char, index) => {
                const isTyped = index < typedChars.length;
                const isCurrent = index === typedChars.length;

                let charClass = 'text-[var(--text-muted)]/40';
                if (isTyped) {
                  charClass = 'text-emerald-400 font-bold';
                } else if (isCurrent) {
                  charClass = hasError
                    ? 'bg-red-500 text-white rounded-xs px-0.5 animate-pulse'
                    : 'bg-[var(--accent)] text-[var(--accent-fg)] rounded-xs px-0.5 shadow-xs';
                }

                return (
                  <span key={index} className={`transition-colors duration-75 ${charClass}`}>
                    {char === ' ' && isCurrent ? '␣' : char}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 5. RACE RESULTS & PODIUM SCREEN */}
      {gameState === 'gameover' && finalResults && (
        <div className="p-6 sm:p-8 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-200">
          {/* Trophy Header */}
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center shadow-xl border bg-gradient-to-br from-amber-500/20 to-red-500/20 border-amber-500/40">
              <Trophy className={`w-10 h-10 ${finalResults.placement === 1 ? 'text-amber-400' : 'text-slate-300'}`} />
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-[var(--text-primary)]">
              {finalResults.placement === 1 ? '1ST PLACE — VICTORY!' : `#${finalResults.placement} PODIUM FINISH`}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-mono">
              {tierConfig.label} • {environment.name}
            </p>
          </div>

          {/* Final Telemetry Metrics Grid */}
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
              <span className="text-[10px] text-[var(--text-muted)] uppercase block">Finish Time</span>
              <span className="text-2xl font-extrabold text-[var(--text-primary)]">{formatLapTime(finalResults.elapsedTime)}</span>
              <span className="text-[10px] text-[var(--text-muted)] block">Total Lap</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
              <span className="text-[10px] text-[var(--text-muted)] uppercase block">Rewards</span>
              <span className="text-2xl font-extrabold text-amber-400">+{finalResults.rewardCoins}</span>
              <span className="text-[10px] text-[var(--text-muted)] block">Coins & XP</span>
            </div>
          </div>

          {/* Standings Table */}
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
                  <span className={s.id === 'player' ? 'font-bold text-red-400' : 'text-[var(--text-primary)]'}>
                    {s.name}
                  </span>
                </span>
                <span className="text-[var(--text-secondary)]">{formatLapTime(s.time)}</span>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
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

      {/* Abandon Run Exit Confirmation Dialog */}
      <ArcadeExitDialog
        isOpen={showExitConfirm}
        onCancel={() => setShowExitConfirm(false)}
        onConfirm={() => {
          setShowExitConfirm(false);
          audioRef.current?.stopEngine();
          onExit();
        }}
      />
    </div>
  );
};
