import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Swords,
  RotateCcw,
  Play,
  Pause,
  ArrowLeft,
  Trophy,
  Heart,
  Flame,
  Zap,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Button } from '../../common/Button';
import { calculateAccuracy } from '../../../utils/arcadeEngine';
import { saveArcadeRecord, getGameRecord } from '../../../utils/arcadeStorage';
import { calculateDifficultyTier, getKeyNinjaConfig } from '../../../utils/arcadeDifficulty';
import { ArcadeWordDeck, getVocabularyPool } from '../../../utils/arcadeVocabulary';
import { ArcadeExitDialog } from '../ArcadeExitDialog';
import { useI18n } from '../../../i18n/I18nContext';

import { Ninja3DScene } from '../ninja3d/Ninja3DScene';
import { Ninja3DWordObject } from '../ninja3d/Ninja3DWordObject';
import { Ninja3DSliceEffects } from '../ninja3d/Ninja3DSliceEffects';
import { ninjaAudio } from '../ninja3d/Ninja3DAudio';

// Custom Martial Word Categories
const NINJA_WORD_CATEGORIES = [
  { id: 'tier', label: 'Progressive Dynamic' },
  { id: 'tech', label: 'Tech & Code' },
  { id: 'martial', label: 'Ninja Martial' },
  { id: 'swift', label: 'Agile Velocity' },
];

const TECH_WORDS = [
  'react', 'node', 'python', 'docker', 'syntax', 'async', 'lambda',
  'binary', 'matrix', 'thread', 'kernel', 'socket', 'buffer', 'cipher',
  'deploy', 'commit', 'schema', 'vector', 'packet', 'router', 'stream',
];

const MARTIAL_WORDS = [
  'katana', 'shuriken', 'shinobi', 'shadow', 'stealth', 'dojo', 'ronin',
  'samurai', 'kunai', 'sensei', 'tsunami', 'blade', 'warrior', 'strike',
  'scroll', 'spirit', 'dragon', 'temple', 'honor', 'silent', 'reflex',
];

const SWIFT_WORDS = [
  'swift', 'strike', 'flash', 'dash', 'slash', 'spark', 'storm',
  'surge', 'focus', 'pulse', 'tempo', 'rhythm', 'razor', 'glide',
  'split', 'slice', 'fury', 'blaze', 'burst', 'sharp', 'speed',
];

const BEGINNER_WORDS = [
  'cat', 'sun', 'run', 'fly', 'sky', 'star', 'glow', 'neo', 'zen', 'fox', 'gem', 'key', 'ice', 'arc', 'zap',
];

export const KeyNinjaGame = ({ onExit, soundEnabled = true }) => {
  const { t } = useI18n();
  const [gameState, setGameState] = useState('ready'); // ready, countdown, playing, paused, gameover
  const [countdown, setCountdown] = useState(3);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('tier');

  // Score & Gameplay Metrics
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [slices, setSlices] = useState(0);
  const [misses, setMisses] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [totalStrokes, setTotalStrokes] = useState(0);
  const [correctStrokes, setCorrectStrokes] = useState(0);
  const [personalBestNotice, setPersonalBestNotice] = useState(false);
  const [tierUpToast, setTierUpToast] = useState(null);

  // Active word lock-on HUD state
  const [activeWordMeta, setActiveWordMeta] = useState(null); // { text, typed }

  // Three.js Mount & Physics Refs
  const mountRef = useRef(null);
  const inputRef = useRef(null);
  const nextIdRef = useRef(1);
  const lastLaunchRef = useRef(0);
  const timerIntervalRef = useRef(null);

  const personalBest = getGameRecord('ninja');

  // Word Deck
  const wordDeckRef = useRef(
    new ArcadeWordDeck({ gameId: 'ninja', pool: getVocabularyPool('ninja', 1) })
  );

  // Difficulty Tier
  const difficultyInfo = useMemo(() => {
    return calculateDifficultyTier({
      activeSeconds: elapsedSeconds,
      completedCount: slices,
      score,
      currentStreak: combo,
      errorCount: misses,
      mode: 'ninja',
    });
  }, [elapsedSeconds, slices, score, combo, misses]);

  const ninjaConfig = useMemo(() => {
    return getKeyNinjaConfig(difficultyInfo.tier, difficultyInfo.performanceQuotient);
  }, [difficultyInfo.tier, difficultyInfo.performanceQuotient]);

  // Three.js Engine Lifecycle Container Ref
  const threeRef = useRef({
    scene: null,
    effects: null,
    words: [],
    activeWordId: null,
    typedBuffer: '',
    animId: null,
  });

  // Keep live refs for 60fps render loop
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const slicesRef = useRef(slices);
  slicesRef.current = slices;

  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  const ninjaConfigRef = useRef(ninjaConfig);
  ninjaConfigRef.current = ninjaConfig;

  // Handle Dynamic Tier Up notification
  const prevTierRef = useRef(1);
  useEffect(() => {
    if (difficultyInfo.tier > prevTierRef.current) {
      setTierUpToast(`BLADE TEMPO INCREASED — TIER ${difficultyInfo.tier} (${difficultyInfo.tierName})`);
      ninjaAudio.playCombo(4, soundEnabledRef.current);
      if (selectedCategory === 'tier') {
        wordDeckRef.current.setPool(getVocabularyPool('ninja', difficultyInfo.tier));
      }
      const t = setTimeout(() => setTierUpToast(null), 3000);
      prevTierRef.current = difficultyInfo.tier;
      return () => clearTimeout(t);
    }
    prevTierRef.current = difficultyInfo.tier;
  }, [difficultyInfo.tier, difficultyInfo.tierName, selectedCategory]);

  // Reset Game State
  const resetGame = useCallback(() => {
    setGameState('ready');
    setScore(0);
    setLives(3);
    setCombo(0);
    setMaxCombo(0);
    setSlices(0);
    setMisses(0);
    setElapsedSeconds(0);
    setTotalStrokes(0);
    setCorrectStrokes(0);
    setActiveWordMeta(null);
    setPersonalBestNotice(false);

    if (threeRef.current.words) {
      threeRef.current.words.forEach((w) => {
        threeRef.current.scene?.scene.remove(w.group);
        w.dispose();
      });
      threeRef.current.words = [];
    }
    threeRef.current.activeWordId = null;
    threeRef.current.typedBuffer = '';

    // Initialize category deck
    if (selectedCategory === 'tech') {
      wordDeckRef.current = new ArcadeWordDeck({ gameId: 'ninja', pool: TECH_WORDS });
    } else if (selectedCategory === 'martial') {
      wordDeckRef.current = new ArcadeWordDeck({ gameId: 'ninja', pool: MARTIAL_WORDS });
    } else if (selectedCategory === 'swift') {
      wordDeckRef.current = new ArcadeWordDeck({ gameId: 'ninja', pool: SWIFT_WORDS });
    } else {
      wordDeckRef.current = new ArcadeWordDeck({
        gameId: 'ninja',
        pool: getVocabularyPool('ninja', 1),
      });
    }
    wordDeckRef.current?.resetRun();
  }, [selectedCategory]);

  const startCountdown = () => {
    resetGame();
    setGameState('countdown');
    setCountdown(3);
  };

  // Countdown timer
  useEffect(() => {
    if (gameState !== 'countdown') return;
    if (countdown > 0) {
      ninjaAudio.playWhoosh(soundEnabledRef.current);
      const t = setTimeout(() => setCountdown((c) => c - 1), 750);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setGameState('playing'), 0);
    return () => clearTimeout(t);
  }, [gameState, countdown]);

  // Seconds elapsed ticker
  useEffect(() => {
    if (gameState !== 'playing') {
      clearInterval(timerIntervalRef.current);
      return;
    }
    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timerIntervalRef.current);
  }, [gameState]);

  // Autofocus input
  useEffect(() => {
    if (gameState === 'playing' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameState]);

  // Handle Game Over Record Persistence
  useEffect(() => {
    if (gameState === 'gameover') {
      const result = saveArcadeRecord('ninja', {
        score,
        slices,
        maxCombo,
        highestTier: difficultyInfo.tier,
      });
      if (result.isNewBest) {
        setPersonalBestNotice(true);
        ninjaAudio.playCombo(8, soundEnabledRef.current);
      }
    }
  }, [gameState, score, slices, maxCombo, difficultyInfo.tier]);

  // =========================================================================
  // 3D WEBGL ENGINE INITIALIZATION & 60 FPS RENDER LOOP
  // =========================================================================
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Initialize 3D Scene & Effects
    const scene = new Ninja3DScene(container);
    const effects = new Ninja3DSliceEffects(scene.scene);

    threeRef.current.scene = scene;
    threeRef.current.effects = effects;
    threeRef.current.words = [];
    threeRef.current.activeWordId = null;
    threeRef.current.typedBuffer = '';

    let lastTime = performance.now();

    const loop = (time) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      const isPlaying = gameStateRef.current === 'playing';

      if (isPlaying) {
        const config = ninjaConfigRef.current;

        // 1. Progressive Difficulty & Airborne Word Spawning (High-arc dramatic parabolic jumps)
        const currentSlices = slicesRef.current || 0;
        let maxAirborne = 1;
        let spawnIntervalSec = 3.2;

        if (currentSlices < 6) {
          // Stage 1 (0-5 slices): Gentle beginner phase, strictly 1 word airborne
          maxAirborne = 1;
          spawnIntervalSec = 3.2;
        } else if (currentSlices < 16) {
          // Stage 2 (6-15 slices): 2 simultaneous airborne targets
          maxAirborne = 2;
          spawnIntervalSec = 2.4;
        } else if (currentSlices < 31) {
          // Stage 3 (16-30 slices): 2-3 simultaneous airborne targets
          maxAirborne = 3;
          spawnIntervalSec = 2.0;
        } else {
          // Stage 4 (31+ slices): 3-4 simultaneous airborne targets
          maxAirborne = 4;
          spawnIntervalSec = 1.6;
        }

        if (time - lastLaunchRef.current > spawnIntervalSec * 1000) {
          lastLaunchRef.current = time;

          const currentWords = threeRef.current.words;
          const activeUncutWords = currentWords.filter((w) => !w.isSliced);

          if (activeUncutWords.length < maxAirborne) {
            let drawnText;
            if (currentSlices < 6) {
              const available = BEGINNER_WORDS.filter((w) => !activeUncutWords.some((aw) => aw.text === w));
              drawnText = (available.length > 0 ? available : BEGINNER_WORDS)[
                Math.floor(Math.random() * (available.length > 0 ? available.length : BEGINNER_WORDS.length))
              ];
            } else {
              drawnText = wordDeckRef.current.draw(activeUncutWords.map((w) => w.text));
            }

            // High-arc dramatic parabolic jumps reaching Y ≈ +5.5 to +6.5 near Torii gate
            const startX = (Math.random() - 0.5) * 10.5;
            const startY = -6.8;
            const vx = -startX * (0.18 + Math.random() * 0.12);
            const vy = 19.5 + Math.random() * 2.5;
            const vz = (Math.random() - 0.5) * 1.2;

            const wordObj = new Ninja3DWordObject({
              id: nextIdRef.current++,
              text: drawnText,
              startX,
              startY,
              vx,
              vy,
              vz,
              gravity: 14.0,
            });

            scene.scene.add(wordObj.group);
            currentWords.push(wordObj);

            ninjaAudio.playWhoosh(soundEnabledRef.current);
          }
        }

        // 2. Update Active 3D Words
        const words = threeRef.current.words;
        let droppedCount = 0;

        for (let i = words.length - 1; i >= 0; i--) {
          const w = words[i];
          w.update(dt);

          if (w.isDead) {
            // Sliced fragments have completely dissolved
            scene.scene.remove(w.group);
            w.dispose();
            words.splice(i, 1);
          } else if (!w.isSliced && w.position.y < -7.0 && w.velocity.y < 0) {
            // Word dropped off-screen without being sliced
            droppedCount++;
            scene.scene.remove(w.group);
            w.dispose();
            words.splice(i, 1);

            // If player was typing this word, release target lock
            if (threeRef.current.activeWordId === w.id) {
              threeRef.current.activeWordId = null;
              threeRef.current.typedBuffer = '';
              setActiveWordMeta(null);
            }
          }
        }

        // 3. Handle Dropped Targets (Lives lost)
        if (droppedCount > 0) {
          ninjaAudio.playDamage(soundEnabledRef.current);
          setLives((prev) => {
            const next = Math.max(0, prev - droppedCount);
            if (next <= 0) {
              setGameState('gameover');
            }
            return next;
          });
          setMisses((m) => m + droppedCount);
          setCombo(0);
        }
      }

      // Update 3D Visual Effects & Scene Lights
      effects.update(dt);
      scene.update(dt);
      scene.render();

      threeRef.current.animId = requestAnimationFrame(loop);
    };

    threeRef.current.animId = requestAnimationFrame(loop);

    // Resize listener
    const handleResize = () => {
      scene.handleResize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (threeRef.current.animId) {
        cancelAnimationFrame(threeRef.current.animId);
      }
      threeRef.current.words.forEach((w) => {
        scene.scene.remove(w.group);
        w.dispose();
      });
      effects.dispose();
      scene.dispose();
    };
  }, []);

  // =========================================================================
  // KEYBOARD INPUT & WORD-SLICING EVENT HANDLER
  // =========================================================================
  const handleKeyDown = (e) => {
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

    if (e.key === 'Backspace') {
      e.preventDefault();
      if (threeRef.current.activeWordId) {
        const words = threeRef.current.words || [];
        const currentBuf = threeRef.current.typedBuffer || '';
        const target = words.find((w) => w.id === threeRef.current.activeWordId);

        if (currentBuf.length > 1) {
          const nextBuf = currentBuf.slice(0, -1);
          threeRef.current.typedBuffer = nextBuf;
          if (target) {
            target.setTypedCount(nextBuf.length);
            setActiveWordMeta({ text: target.text, typed: nextBuf.length });
          }
        } else {
          if (target) {
            target.setTargeted(false);
            target.setTypedCount(0);
          }
          threeRef.current.activeWordId = null;
          threeRef.current.typedBuffer = '';
          setActiveWordMeta(null);
        }
      }
      return;
    }

    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      const char = e.key.toLowerCase();
      setTotalStrokes((s) => s + 1);

      const words = threeRef.current.words || [];
      const activeId = threeRef.current.activeWordId;
      const currentBuf = threeRef.current.typedBuffer;

      // 1. If currently locked onto a target
      if (activeId) {
        const target = words.find((w) => w.id === activeId && !w.isSliced);
        if (target) {
          const expectedChar = target.text[currentBuf.length]?.toLowerCase();
          if (char === expectedChar) {
            setCorrectStrokes((s) => s + 1);
            ninjaAudio.playKeyStroke(soundEnabledRef.current);

            const nextBuf = currentBuf + char;
            threeRef.current.typedBuffer = nextBuf;
            target.setTypedCount(nextBuf.length);

            setActiveWordMeta({ text: target.text, typed: nextBuf.length });

            // Sliced Completely!
            if (nextBuf.length === target.text.length) {
              executeSlice(target);
            }
          } else {
            // Typing error: break combo streak
            setCombo(0);
          }
          return;
        }
      }

      // 2. Lock onto an unsliced airborne target whose starting character matches
      const unslicedWords = words.filter((w) => !w.isSliced);
      // Sort by urgency: lowest Y position (closest to ground)
      unslicedWords.sort((a, b) => a.position.y - b.position.y);

      const candidate = unslicedWords.find((w) => w.text.toLowerCase().startsWith(char));

      if (candidate) {
        setCorrectStrokes((s) => s + 1);
        ninjaAudio.playKeyStroke(soundEnabledRef.current);

        threeRef.current.activeWordId = candidate.id;
        const nextBuf = char;
        threeRef.current.typedBuffer = nextBuf;

        candidate.setTargeted(true);
        candidate.setTypedCount(1);

        setActiveWordMeta({ text: candidate.text, typed: 1 });

        if (nextBuf.length === candidate.text.length) {
          executeSlice(candidate);
        }
      }
    }
  };

  // Helper: Trigger Fruit Ninja 3D Slice
  const executeSlice = (target) => {
    // 1. Sound: Katana slice
    ninjaAudio.playKatanaSlash(soundEnabledRef.current);

    // 2. 3D Visual Effects: Katana light blade trail & spark burst
    const sliceAngle = -(Math.PI / 4) + (Math.random() - 0.5) * 0.3;
    threeRef.current.effects.spawnKatanaSlash({
      position: target.position,
      angle: sliceAngle,
      length: target.plaqueWidth * 1.5,
      color: 0xf43f5e,
    });
    threeRef.current.effects.spawnSparkBurst({
      position: target.position,
      count: 42,
    });

    // 3. 3D Mesh Split into 2 tumbling halves
    target.slice();

    // 4. Scoring and Combos
    const basePts = target.text.length * 28;
    const comboMultiplier = 1 + combo * 0.25;
    const earnedScore = Math.round(basePts * comboMultiplier);

    setScore((sc) => sc + earnedScore);
    setSlices((sl) => sl + 1);

    const nextCombo = combo + 1;
    setCombo(nextCombo);
    setMaxCombo((m) => Math.max(m, nextCombo));

    if (nextCombo > 1 && nextCombo % 3 === 0) {
      ninjaAudio.playCombo(nextCombo, soundEnabledRef.current);
      threeRef.current.scene?.triggerImpactEffect(0.22);
    }

    // Reset lock
    threeRef.current.activeWordId = null;
    threeRef.current.typedBuffer = '';
    setActiveWordMeta(null);
  };

  const accuracy = calculateAccuracy(correctStrokes, totalStrokes);

  return (
    <div className="space-y-4 max-w-5xl mx-auto" onClick={() => inputRef.current?.focus()}>
      {/* Hidden input anchor for smooth typing focus */}
      <input
        ref={inputRef}
        type="text"
        autoFocus
        value=""
        onChange={() => {}}
        onKeyDown={handleKeyDown}
        className="absolute top-0 left-0 w-px h-px opacity-0 pointer-events-none"
        aria-label="3D Key Ninja Typing Input"
      />

      {/* Top Header & Metrics Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-md font-mono text-xs">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            icon={ArrowLeft}
            onClick={() => {
              if (gameState === 'playing') setShowExitConfirm(true);
              else onExit();
            }}
          >
            {t('common.exit') || 'Back'}
          </Button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center font-bold">
              <Swords className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-[var(--text-primary)]">Key Ninja 3D</h2>
              <span className="text-[10px] text-[var(--text-muted)]">Airborne Blade Combat</span>
            </div>
          </div>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Hearts / Lives */}
          <div className="flex items-center gap-1.5" title="Ninja Lives Remaining">
            {[...Array(3)].map((_, i) => (
              <Heart
                key={i}
                className={`w-4 h-4 transition-all duration-300 ${
                  i < lives
                    ? 'text-rose-500 fill-rose-500 scale-105'
                    : 'text-zinc-600 fill-transparent scale-90'
                }`}
              />
            ))}
          </div>

          {/* Slices count */}
          <div className="text-center">
            <span className="text-[10px] uppercase text-[var(--text-muted)] block">Slices</span>
            <span className="text-sm sm:text-base font-extrabold text-emerald-400 font-mono">
              {slices}
            </span>
          </div>

          {/* Score & Combo */}
          <div className="text-center">
            <span className="text-[10px] uppercase text-[var(--text-muted)] block">Score</span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm sm:text-base font-extrabold text-[var(--text-primary)] font-mono">
                {score.toLocaleString()}
              </span>
              {combo > 2 && (
                <span className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-[10px] animate-pulse">
                  <Flame className="w-2.5 h-2.5" />
                  {combo}X
                </span>
              )}
            </div>
          </div>

          {/* Accuracy */}
          <div className="text-center hidden sm:block">
            <span className="text-[10px] uppercase text-[var(--text-muted)] block">Accuracy</span>
            <span className="text-sm sm:text-base font-extrabold text-cyan-400 font-mono">
              {accuracy}%
            </span>
          </div>
        </div>
      </div>

      {/* Tier Up Toast */}
      {tierUpToast && (
        <div className="p-2.5 rounded-xl bg-rose-600/25 border border-rose-500/50 text-rose-300 text-xs font-mono font-bold text-center animate-in zoom-in-95 duration-150">
          {tierUpToast}
        </div>
      )}

      {/* 3D WEBGL DOJO ARENA VIEWPORT */}
      <div className="relative rounded-2xl overflow-hidden border border-[var(--border)] shadow-2xl bg-black">
        {/* Mount container */}
        <div
          ref={mountRef}
          className="w-full h-[460px] sm:h-[500px] md:h-[540px] cursor-text"
        />

        {/* 1. READY SCREEN / CATEGORY SELECTOR */}
        {gameState === 'ready' && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center space-y-6 animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-500 flex items-center justify-center shadow-xl">
              <Swords className="w-9 h-9" />
            </div>

            <div className="space-y-1 max-w-md">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                KEY NINJA 3D WORD SLICER
              </h1>
              <p className="text-xs text-zinc-400">
                Type airborne words mid-flight to unleash glowing katana slashes. Split 3D targets into two halves and chain lethal combos!
              </p>
            </div>

            {/* Category Selector */}
            <div className="space-y-2 max-w-lg w-full">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
                Select Vocabulary Discipline
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {NINJA_WORD_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`py-2 px-2 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-rose-500/25 border-rose-500 text-rose-300 shadow-md'
                        : 'bg-zinc-900/80 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Launch Button */}
            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                icon={Play}
                onClick={startCountdown}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-8 shadow-xl hover:shadow-rose-600/30 transition-all text-sm sm:text-base cursor-pointer"
              >
                UNSHEATHE BLADE (SPACE / ENTER)
              </Button>
            </div>
          </div>
        )}

        {/* 2. COUNTDOWN OVERLAY */}
        {gameState === 'countdown' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center space-y-4 text-center z-30 animate-in fade-in">
            <span className="text-xs font-mono uppercase tracking-widest text-rose-400 font-bold">
              DOJO TRIAL COMMENCING
            </span>
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center shadow-2xl animate-pulse">
              <span className="text-5xl sm:text-6xl font-black text-rose-500 font-mono">
                {countdown > 0 ? countdown : 'SLASH!'}
              </span>
            </div>
          </div>
        )}

        {/* 3. ACTIVE PLAYING HUD: TARGET LOCK-ON PILL */}
        {gameState === 'playing' && activeWordMeta && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-black/85 border border-rose-500/50 backdrop-blur-md shadow-2xl z-20 flex items-center gap-2 font-mono text-sm">
            <span className="text-[11px] uppercase tracking-wider text-rose-400 font-bold">
              TARGET LOCKED:
            </span>
            <span>
              <span className="text-emerald-400 font-black">
                {activeWordMeta.text.slice(0, activeWordMeta.typed)}
              </span>
              <span className="text-amber-300 font-black underline animate-pulse">
                {activeWordMeta.text.slice(activeWordMeta.typed, activeWordMeta.typed + 1)}
              </span>
              <span className="text-zinc-400">
                {activeWordMeta.text.slice(activeWordMeta.typed + 1)}
              </span>
            </span>
          </div>
        )}

        {/* 4. PAUSED OVERLAY */}
        {gameState === 'paused' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center space-y-4 text-center">
            <h2 className="text-2xl font-bold text-white font-mono">DOJO TRIAL PAUSED</h2>
            <p className="text-xs text-zinc-400">Press ESC or click below to resume your run</p>
            <Button variant="primary" onClick={() => setGameState('playing')}>
              RESUME SLICING
            </Button>
          </div>
        )}

        {/* 5. GAME OVER SUMMARY PODIUM */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-widest">
                TRIAL CONCLUDED
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                Blade Sanctuary Standings
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl w-full font-mono text-center">
              <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-white/10">
                <span className="text-[10px] text-zinc-400 uppercase block">Words Sliced</span>
                <span className="text-2xl font-extrabold text-emerald-400">{slices}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-white/10">
                <span className="text-[10px] text-zinc-400 uppercase block">Final Score</span>
                <span className="text-2xl font-extrabold text-amber-400">{score}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-white/10">
                <span className="text-[10px] text-zinc-400 uppercase block">Max Combo</span>
                <span className="text-2xl font-extrabold text-rose-400">{maxCombo}X</span>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-white/10">
                <span className="text-[10px] text-zinc-400 uppercase block">Accuracy</span>
                <span className="text-2xl font-extrabold text-cyan-400">{accuracy}%</span>
              </div>
            </div>

            {personalBestNotice && (
              <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold animate-bounce">
                <Trophy className="w-4 h-4" />
                <span>NEW PERSONAL BEST ACHIEVED!</span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <Button variant="primary" icon={RotateCcw} onClick={startCountdown} className="bg-rose-600 hover:bg-rose-700">
                RETRY TRIAL (SPACE)
              </Button>
              <Button variant="ghost" onClick={onExit}>
                RETURN TO ARCADE
              </Button>
            </div>
          </div>
        )}
      </div>

      <ArcadeExitDialog
        isOpen={showExitConfirm}
        onConfirm={onExit}
        onCancel={() => setShowExitConfirm(false)}
      />
    </div>
  );
};

export default KeyNinjaGame;
