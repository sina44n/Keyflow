import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ShieldAlert, RotateCcw, Play, Pause, ArrowLeft, Trophy, Skull, Shield, Crosshair, Zap,
  AlertTriangle, Award, Flame
} from 'lucide-react';
import { Button } from '../../common/Button';
import { calculateAccuracy, calculateWpm, playArcadeSound } from '../../../utils/arcadeEngine';
import { saveArcadeRecord, getGameRecord } from '../../../utils/arcadeStorage';
import { ARCADE_WORDS, SOLDIER_CLASSES } from '../../../data/arcadeGamesData';
import { calculateDifficultyTier, getBossBattleConfig } from '../../../utils/arcadeDifficulty';
import { ArcadeWordDeck } from '../../../utils/arcadeVocabulary';
import { ArcadeExitDialog } from '../ArcadeExitDialog';

const ARENA_WIDTH = 760;
const ARENA_HEIGHT = 460;
const DANGER_LINE_Y = 360;
const PLAYER_MAX_HP = 100;

export const BossBattleGame = ({ onExit, soundEnabled = true }) => {
  // Game states: 'ready', 'countdown', 'playing', 'wave_cleared', 'boss_alert', 'paused', 'gameover', 'victory'
  const [gameState, setGameState] = useState('ready');
  const [countdown, setCountdown] = useState(3);

  // Wave & Progress
  const [wave, setWave] = useState(1);
  const [score, setScore] = useState(0);
  const [playerHp, setPlayerHp] = useState(PLAYER_MAX_HP);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Statistics
  const [soldiersDefeated, setSoldiersDefeated] = useState(0);
  const [bossesDefeated, setBossesDefeated] = useState(0);
  const [classKillCounts, setClassKillCounts] = useState({ infantry: 0, assault: 0, armored: 0, elite: 0 });
  const [totalStrokes, setTotalStrokes] = useState(0);
  const [correctStrokes, setCorrectStrokes] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [personalBestNotice, setPersonalBestNotice] = useState(false);
  const [tierUpToast, setTierUpToast] = useState(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Active battlefield soldiers: [{ id, classId, word, x, y, hp, maxHp, speed, isDefeated, defeatTimer }]
  const [soldiers, setSoldiers] = useState([]);
  const [activeSoldierId, setActiveSoldierId] = useState(null);
  const [typedBuffer, setTypedBuffer] = useState('');

  // Boss state
  const [bossActive, setBossActive] = useState(false);
  const [bossHp, setBossHp] = useState(0);
  const [bossMaxHp, setBossMaxHp] = useState(0);
  const [bossName, setBossName] = useState('');
  const [bossAttackTimeLeft, setBossAttackTimeLeft] = useState(0);
  const [bossPhrase, setBossPhrase] = useState('');
  const [bossTypedBuffer, setBossTypedBuffer] = useState('');
  const [bossAttackActive, setBossAttackActive] = useState(false);

  // Visual effects
  const [tracers, setTracers] = useState([]); // [{ id, startX, startY, endX, endY, color }]
  const [particles, setParticles] = useState([]); // [{ id, x, y, color, vx, vy, life }]
  const [floatingTexts, setFloatingTexts] = useState([]); // [{ id, text, x, y, color, life }]
  const [isShaking, setIsShaking] = useState(false);
  const [alarmActive, setAlarmActive] = useState(false);

  // Refs for loop & timing
  const nextSoldierIdRef = useRef(1);
  const lastSpawnTimeRef = useRef(0);
  const soldiersSpawnedInWaveRef = useRef(0);
  const timerIntervalRef = useRef(null);
  const inputRef = useRef(null);
  const prevTierRef = useRef(1);
  const phraseIndexRef = useRef(0);

  const personalBest = getGameRecord('boss');

  // Anti-repetition decks per combat class
  const combatDecksRef = useRef({
    infantry: new ArcadeWordDeck({ gameId: 'boss-infantry', pool: ARCADE_WORDS.infantry }),
    assault: new ArcadeWordDeck({ gameId: 'boss-assault', pool: ARCADE_WORDS.assault }),
    armored: new ArcadeWordDeck({ gameId: 'boss-armored', pool: ARCADE_WORDS.armored }),
    elite: new ArcadeWordDeck({ gameId: 'boss-elite', pool: ARCADE_WORDS.elite }),
  });

  // Dynamic difficulty calculation based on performance & progression
  const difficultyInfo = useMemo(() => {
    return calculateDifficultyTier({
      activeSeconds: elapsedSeconds,
      completedCount: soldiersDefeated + bossesDefeated * 5,
      score,
      wave,
      currentStreak: combo,
      errorCount,
      mode: 'boss',
    });
  }, [elapsedSeconds, soldiersDefeated, bossesDefeated, score, wave, combo, errorCount]);

  const waveConfig = useMemo(() => {
    return getBossBattleConfig(difficultyInfo.tier, wave);
  }, [difficultyInfo.tier, wave]);

  // Check for tier escalation toast
  useEffect(() => {
    if (difficultyInfo.tier > prevTierRef.current) {
      setTierUpToast(`COMBAT INTENSITY INCREASED — TIER ${difficultyInfo.tier} (${difficultyInfo.tierName})`);
      playArcadeSound('combo', soundEnabled);
      const t = setTimeout(() => setTierUpToast(null), 3200);
      prevTierRef.current = difficultyInfo.tier;
      return () => clearTimeout(t);
    }
    prevTierRef.current = difficultyInfo.tier;
  }, [difficultyInfo.tier, difficultyInfo.tierName, soundEnabled]);

  // Pick phrase for boss attack
  const pickNextBossPhrase = useCallback(() => {
    const pool = ARCADE_WORDS.bossPhrases;
    const phrase = pool[phraseIndexRef.current % pool.length];
    phraseIndexRef.current++;
    return phrase;
  }, []);

  // Reset entire session
  const resetGame = useCallback(() => {
    setGameState('ready');
    setWave(1);
    setScore(0);
    setPlayerHp(PLAYER_MAX_HP);
    setCombo(0);
    setMaxCombo(0);
    setElapsedSeconds(0);
    setSoldiersDefeated(0);
    setBossesDefeated(0);
    setClassKillCounts({ infantry: 0, assault: 0, armored: 0, elite: 0 });
    setTotalStrokes(0);
    setCorrectStrokes(0);
    setErrorCount(0);
    setSoldiers([]);
    setActiveSoldierId(null);
    setTypedBuffer('');
    setBossActive(false);
    setBossHp(0);
    setBossMaxHp(0);
    setBossName('');
    setBossPhrase('');
    setBossTypedBuffer('');
    setBossAttackActive(false);
    setShowExitConfirm(false);
    setTracers([]);
    setParticles([]);
    setFloatingTexts([]);
    setPersonalBestNotice(false);
    setTierUpToast(null);
    setIsShaking(false);
    setAlarmActive(false);
    soldiersSpawnedInWaveRef.current = 0;
    nextSoldierIdRef.current = 1;
    prevTierRef.current = 1;
    phraseIndexRef.current = 0;
    combatDecksRef.current.infantry.resetRun();
    combatDecksRef.current.assault.resetRun();
    combatDecksRef.current.armored.resetRun();
    combatDecksRef.current.elite.resetRun();
  }, []);

  const startCountdown = () => {
    resetGame();
    setGameState('countdown');
    setCountdown(3);
  };

  // Countdown timer
  useEffect(() => {
    if (gameState !== 'countdown') return;
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 800);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setGameState('playing'), 0);
    return () => clearTimeout(t);
  }, [gameState, countdown]);

  // Active elapsed timer
  useEffect(() => {
    if (gameState !== 'playing' && gameState !== 'boss_alert' && gameState !== 'wave_cleared') {
      clearInterval(timerIntervalRef.current);
      return;
    }
    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timerIntervalRef.current);
  }, [gameState]);

  // Focus keyboard input
  useEffect(() => {
    if (gameState === 'playing' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameState]);

  // Save game record on gameover / victory
  useEffect(() => {
    if (gameState === 'gameover' || gameState === 'victory') {
      const isDefeated = gameState === 'victory' || bossesDefeated > 0;
      const result = saveArcadeRecord('boss', {
        score,
        wave,
        highestTier: difficultyInfo.tier,
        soldiersDefeated,
        bossDefeated: isDefeated,
        durationSeconds: elapsedSeconds,
      });
      if (result.isNewBest) {
        const t = setTimeout(() => setPersonalBestNotice(true), 0);
        playArcadeSound('victory', soundEnabled);
        return () => clearTimeout(t);
      }
    }
  }, [gameState, score, wave, difficultyInfo.tier, soldiersDefeated, bossesDefeated, elapsedSeconds, soundEnabled]);

  // Helper: Trigger visual tracer laser from player console to soldier
  const fireTracer = useCallback((targetX, targetY, color = '#38BDF8') => {
    const id = Math.random();
    setTracers((prev) => [
      ...prev,
      { id, startX: ARENA_WIDTH / 2, startY: ARENA_HEIGHT, endX: targetX, endY: targetY, color, life: 1.0 },
    ]);
  }, []);

  // Helper: Add impact particles
  const addImpactParticles = useCallback((x, y, color = '#F97316') => {
    const newParticles = [];
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.5;
      const speed = 60 + Math.random() * 100;
      newParticles.push({
        id: Math.random(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 1.0,
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
  }, []);

  // Helper: Add floating combat text
  const addFloatingText = useCallback((text, x, y, color = '#10B981') => {
    const id = Math.random();
    setFloatingTexts((prev) => [...prev, { id, text, x, y, color, life: 1.0 }]);
  }, []);

  // Screen shake
  const triggerScreenShake = useCallback(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 240);
  }, []);

  // Pick random soldier class based on wave weights
  const pickSoldierClass = useCallback((weights) => {
    const rand = Math.random();
    if (rand < weights.infantry) return 'infantry';
    if (rand < weights.infantry + weights.assault) return 'assault';
    if (rand < weights.infantry + weights.assault + weights.armored) return 'armored';
    return 'elite';
  }, []);

  // Pick soldier word with anti-repetition and on-screen deduplication
  const pickSoldierWord = useCallback((classId, excludeWords = []) => {
    const deck = combatDecksRef.current[classId] || combatDecksRef.current.infantry;
    return deck.draw(excludeWords);
  }, []);

  // Advance to next wave
  const advanceWave = useCallback(() => {
    const nextWaveNum = wave + 1;
    const isNextBoss = nextWaveNum % 3 === 0;

    setWave(nextWaveNum);
    soldiersSpawnedInWaveRef.current = 0;
    setSoldiers([]);
    setActiveSoldierId(null);
    setTypedBuffer('');

    if (isNextBoss) {
      setGameState('boss_alert');
      const bHp = 400 + Math.floor(nextWaveNum / 3) * 350;
      const bName = nextWaveNum === 3 ? 'Commander Vane' : nextWaveNum === 6 ? 'Warlord Aethelred' : 'Supreme Mecha Titan';
      setBossHp(bHp);
      setBossMaxHp(bHp);
      setBossName(bName);
      setBossAttackTimeLeft(waveConfig.bossAttackTimer);
      setBossPhrase(pickNextBossPhrase());
      setBossTypedBuffer('');
      setBossActive(true);
      playArcadeSound('boss-hit', soundEnabled);

      setTimeout(() => {
        setGameState('playing');
      }, 2600);
    } else {
      setGameState('wave_cleared');
      playArcadeSound('victory', soundEnabled);
      setTimeout(() => {
        setGameState('playing');
      }, 2200);
    }
  }, [wave, waveConfig.bossAttackTimer, pickNextBossPhrase, soundEnabled]);

  // Main Soldier Combat & Physics Animation Loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    let animId;
    let lastTime = performance.now();

    const loop = (time) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      // 1. Spawning regular soldiers
      if (!bossActive && soldiersSpawnedInWaveRef.current < waveConfig.soldierQuota) {
        if (time - lastSpawnTimeRef.current > waveConfig.spawnInterval * 1000) {
          lastSpawnTimeRef.current = time;
          soldiersSpawnedInWaveRef.current++;

          const classId = pickSoldierClass(waveConfig.classWeights);
          const classMeta = SOLDIER_CLASSES[classId];

          // Distributed lane X coordinates: 4 lanes across battlefield
          const lane = Math.floor(Math.random() * 4);
          const laneWidth = (ARENA_WIDTH - 140) / 4;
          const x = 70 + lane * laneWidth + Math.random() * (laneWidth - 30);
          const y = 30;
          const speed = waveConfig.marchSpeed * classMeta.speedMult;

          setSoldiers((prev) => {
            const activeWords = prev.map((s) => s.word);
            const word = pickSoldierWord(classId, activeWords);
            return [
              ...prev,
              {
                id: nextSoldierIdRef.current++,
                classId,
                word,
                x,
                y,
                hp: classMeta.maxHp,
                maxHp: classMeta.maxHp,
                speed,
                isDefeated: false,
                defeatTimer: 0,
              },
            ];
          });
        }
      }

      // 2. Boss attack countdown in boss wave
      if (bossActive) {
        setBossAttackTimeLeft((t) => {
          if (t <= dt) {
            // Boss attack fires!
            playArcadeSound('damage', soundEnabled);
            triggerScreenShake();
            setBossAttackActive(true);
            setTimeout(() => setBossAttackActive(false), 350);

            setPlayerHp((hp) => {
              const nextHp = hp - 22;
              if (nextHp <= 0) setGameState('gameover');
              return Math.max(0, nextHp);
            });
            setCombo(0);
            setBossTypedBuffer('');
            setBossPhrase(pickNextBossPhrase());
            addFloatingText('BOMBARDMENT -22 HP!', ARENA_WIDTH / 2, ARENA_HEIGHT - 60, '#EF4444');
            return waveConfig.bossAttackTimer;
          }
          return parseFloat((t - dt).toFixed(2));
        });
      }

      // 3. Move active soldiers forward towards player defense line
      setSoldiers((prev) => {
        const next = [];
        let breachedDamage = 0;

        for (const s of prev) {
          if (s.isDefeated) {
            const nextDefeatTime = s.defeatTimer + dt;
            if (nextDefeatTime < 0.25) {
              next.push({ ...s, defeatTimer: nextDefeatTime });
            }
            continue;
          }

          const newY = s.y + s.speed * dt;

          // Check if breached defense barricade
          if (newY >= DANGER_LINE_Y) {
            const breachDmg = s.classId === 'armored' ? 22 : 14;
            breachedDamage += breachDmg;
            addImpactParticles(s.x, DANGER_LINE_Y, '#EF4444');
            addFloatingText(`BREACH -${breachDmg} HP`, s.x, DANGER_LINE_Y - 20, '#EF4444');
          } else {
            next.push({ ...s, y: newY });
          }
        }

        if (breachedDamage > 0) {
          playArcadeSound('damage', soundEnabled);
          triggerScreenShake();
          setAlarmActive(true);
          setTimeout(() => setAlarmActive(false), 600);

          setPlayerHp((hp) => {
            const nextHp = hp - breachedDamage;
            if (nextHp <= 0) setGameState('gameover');
            return Math.max(0, nextHp);
          });
          setCombo(0);
          setActiveSoldierId(null);
          setTypedBuffer('');
        }

        return next;
      });

      // 4. Update visual tracers life
      setTracers((prev) =>
        prev
          .map((tr) => ({ ...tr, life: tr.life - dt * 4.5 }))
          .filter((tr) => tr.life > 0)
      );

      // 5. Update impact particles
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx * dt,
            y: p.y + p.vy * dt,
            life: p.life - dt * 2.5,
          }))
          .filter((p) => p.life > 0)
      );

      // 6. Update floating combat texts
      setFloatingTexts((prev) =>
        prev
          .map((ft) => ({
            ...ft,
            y: ft.y - 35 * dt,
            life: ft.life - dt * 1.5,
          }))
          .filter((ft) => ft.life > 0)
      );

      // 7. Check wave completion: all spawned soldiers defeated
      if (
        !bossActive &&
        soldiersSpawnedInWaveRef.current >= waveConfig.soldierQuota &&
        soldiers.filter((s) => !s.isDefeated).length === 0
      ) {
        advanceWave();
        return;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [
    gameState,
    bossActive,
    waveConfig,
    soldiers,
    pickSoldierClass,
    pickSoldierWord,
    pickNextBossPhrase,
    advanceWave,
    fireTracer,
    addImpactParticles,
    addFloatingText,
    triggerScreenShake,
    soundEnabled,
  ]);

  const handleAttemptExit = () => {
    if (gameState === 'playing' || gameState === 'paused' || gameState === 'wave_cleared' || gameState === 'boss_alert') {
      setShowExitConfirm(true);
    } else {
      onExit();
    }
  };

  // Handle typing combat input
  const handleKeyDown = (e) => {
    if (showExitConfirm) {
      if (e.key === 'Escape') {
        setShowExitConfirm(false);
      }
      return;
    }

    if (e.key === 'Escape') {
      if (gameState === 'playing') setGameState('paused');
      else if (gameState === 'paused') setGameState('playing');
      return;
    }

    if (gameState !== 'playing') return;

    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      const char = e.key.toLowerCase();
      setTotalStrokes((s) => s + 1);

      // A. If Boss Encounter is active, player types boss counterstrike phrase
      if (bossActive) {
        const nextCharExpected = bossPhrase[bossTypedBuffer.length]?.toLowerCase();
        if (char === nextCharExpected) {
          setCorrectStrokes((c) => c + 1);
          const nextBuffer = bossTypedBuffer + bossPhrase[bossTypedBuffer.length];
          setBossTypedBuffer(nextBuffer);
          playArcadeSound('blaster', soundEnabled);

          // Full boss phrase completed -> counterstrike!
          if (nextBuffer === bossPhrase) {
            playArcadeSound('boss-hit', soundEnabled);
            fireTracer(ARENA_WIDTH / 2, 90, '#06B6D4');
            addImpactParticles(ARENA_WIDTH / 2, 90, '#06B6D4');
            triggerScreenShake();

            const damage = 140 + combo * 10;
            const newCombo = combo + 1;
            setCombo(newCombo);
            setMaxCombo((m) => Math.max(m, newCombo));
            setScore((sc) => sc + 500 * newCombo);
            addFloatingText(`CRITICAL HIT -${damage} HP! STUNNED!`, ARENA_WIDTH / 2, 110, '#38BDF8');

            setBossHp((hp) => {
              const nextHp = hp - damage;
              if (nextHp <= 0) {
                // Boss defeated!
                setBossesDefeated((b) => b + 1);
                setBossActive(false);
                addImpactParticles(ARENA_WIDTH / 2, 90, '#F97316');
                addFloatingText('TITAN COMMANDER DESTROYED! +1500 PTS', ARENA_WIDTH / 2, 130, '#FBBF24');
                advanceWave();
                return 0;
              }
              return nextHp;
            });

            setBossTypedBuffer('');
            setBossPhrase(pickNextBossPhrase());
            setBossAttackTimeLeft(waveConfig.bossAttackTimer);
          }
        } else {
          // Mistake on boss phrase
          playArcadeSound('damage', soundEnabled);
          setErrorCount((err) => err + 1);
          setCombo(0);
        }
        return;
      }

      // B. Regular battlefield soldiers combat
      // If already tracking an active soldier target
      if (activeSoldierId) {
        const soldier = soldiers.find((s) => s.id === activeSoldierId && !s.isDefeated);
        if (soldier) {
          const expectedChar = soldier.word[typedBuffer.length]?.toLowerCase();
          if (char === expectedChar) {
            setCorrectStrokes((c) => c + 1);
            const nextBuf = typedBuffer + soldier.word[typedBuffer.length];
            setTypedBuffer(nextBuf);
            playArcadeSound('blaster', soundEnabled);

            // Word completed!
            if (nextBuf === soldier.word) {
              const classMeta = SOLDIER_CLASSES[soldier.classId];

              // Check multi-stage armored soldier
              if (soldier.hp > 1) {
                // Armor shredded!
                playArcadeSound('boss-hit', soundEnabled);
                fireTracer(soldier.x, soldier.y, '#38BDF8');
                addImpactParticles(soldier.x, soldier.y, '#38BDF8');
                addFloatingText('ARMOR BROKEN!', soldier.x, soldier.y - 15, '#38BDF8');
                setSoldiers((prev) =>
                  prev.map((s) => (s.id === soldier.id ? { ...s, hp: 1, word: pickSoldierWord('infantry') } : s))
                );
                setTypedBuffer('');
                return;
              }

              // Soldier fully defeated!
              fireTracer(soldier.x, soldier.y, classMeta.color);
              addImpactParticles(soldier.x, soldier.y, classMeta.color);
              playArcadeSound('blaster', soundEnabled);

              const pts = classMeta.scoreValue * (1 + combo * 0.15);
              const roundedPts = Math.round(pts);
              setScore((sc) => sc + roundedPts);
              const newCombo = combo + 1;
              setCombo(newCombo);
              setMaxCombo((m) => Math.max(m, newCombo));
              setSoldiersDefeated((d) => d + 1);
              setClassKillCounts((prev) => ({
                ...prev,
                [soldier.classId]: prev[soldier.classId] + 1,
              }));

              addFloatingText(`+${roundedPts} ${classMeta.name.split(' ')[0]} DOWN`, soldier.x, soldier.y - 15, classMeta.color);

              // Mark soldier defeated with crumble animation
              setSoldiers((prev) =>
                prev.map((s) => (s.id === soldier.id ? { ...s, isDefeated: true, defeatTimer: 0 } : s))
              );
              setActiveSoldierId(null);
              setTypedBuffer('');
            }
          } else {
            // Typing error
            playArcadeSound('damage', soundEnabled);
            setErrorCount((err) => err + 1);
            setCombo(0);
          }
          return;
        }
      }

      // No active target: acquire target that begins with typed char (prioritize closest to defense line)
      const matchingSoldiers = soldiers
        .filter((s) => !s.isDefeated && s.word[0]?.toLowerCase() === char)
        .sort((a, b) => b.y - a.y); // nearest to defense line first

      if (matchingSoldiers.length > 0) {
        const target = matchingSoldiers[0];
        setActiveSoldierId(target.id);
        setTypedBuffer(target.word[0]);
        setCorrectStrokes((c) => c + 1);
        playArcadeSound('blaster', soundEnabled);

        // In 1-letter words (if any)
        if (target.word.length === 1) {
          const classMeta = SOLDIER_CLASSES[target.classId];
          fireTracer(target.x, target.y, classMeta.color);
          addImpactParticles(target.x, target.y, classMeta.color);
          setScore((sc) => sc + classMeta.scoreValue);
          setCombo((cm) => cm + 1);
          setSoldiersDefeated((d) => d + 1);
          setSoldiers((prev) =>
            prev.map((s) => (s.id === target.id ? { ...s, isDefeated: true, defeatTimer: 0 } : s))
          );
          setActiveSoldierId(null);
          setTypedBuffer('');
        }
      } else {
        // Stray keystroke with no matching target
        playArcadeSound('damage', soundEnabled);
        setErrorCount((err) => err + 1);
        setCombo(0);
      }
    }
  };

  const accuracy = calculateAccuracy(correctStrokes, totalStrokes);
  const liveWpm = calculateWpm(correctStrokes, elapsedSeconds);
  const bossHpPercent = bossMaxHp > 0 ? Math.max(0, Math.round((bossHp / bossMaxHp) * 100)) : 0;

  return (
    <div
      className={`card-panel p-4 sm:p-6 space-y-4 max-w-4xl mx-auto border border-[var(--border)] shadow-2xl relative select-none transition-transform ${
        isShaking ? 'translate-x-1 translate-y-0.5' : ''
      }`}
      onClick={() => inputRef.current?.focus()}
    >
      <input
        ref={inputRef}
        type="text"
        className="opacity-0 absolute w-0 h-0 pointer-events-none"
        onKeyDown={handleKeyDown}
        aria-label="Soldier Combat typing input"
      />

      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="xs" icon={ArrowLeft} onClick={handleAttemptExit}>
            Arcade Hub
          </Button>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-orange-500" />
              Boss Battle: Frontline Soldier Combat
            </h2>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              Wave {wave} • {difficultyInfo.tierName} Intensity (Tier {difficultyInfo.tier})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {gameState === 'playing' ? (
            <Button variant="outline" size="xs" icon={Pause} onClick={() => setGameState('paused')}>
              Pause
            </Button>
          ) : gameState === 'paused' ? (
            <Button variant="primary" size="xs" icon={Play} onClick={() => setGameState('playing')}>
              Resume
            </Button>
          ) : null}
          <Button variant="ghost" size="xs" icon={RotateCcw} onClick={startCountdown}>
            Restart
          </Button>
        </div>
      </div>

      {/* HUD Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 bg-[var(--bg-elevated)] p-3 rounded-xl border border-[var(--border)] font-mono text-xs">
        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)] block">Player Shield</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Shield className={`w-3.5 h-3.5 ${playerHp <= 30 ? 'text-rose-500 animate-pulse' : 'text-cyan-400'}`} />
            <span className={`font-bold ${playerHp <= 30 ? 'text-rose-400' : 'text-cyan-300'}`}>
              {playerHp}%
            </span>
          </div>
        </div>

        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)] block">Combat Wave</span>
          <span className="text-sm sm:text-base font-bold text-orange-400">Wave {wave}</span>
        </div>

        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)] block">Combo</span>
          <span className="text-sm sm:text-base font-bold text-[var(--accent)]">
            {combo}x <span className="text-[10px] text-[var(--text-muted)]">(max {maxCombo})</span>
          </span>
        </div>

        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)] block">Soldiers Down</span>
          <span className="text-sm sm:text-base font-bold text-emerald-400">{soldiersDefeated}</span>
        </div>

        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)] block">Velocity</span>
          <span className="text-sm sm:text-base font-bold text-[var(--text-primary)]">{liveWpm} WPM</span>
        </div>

        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)] block">Score</span>
          <span className="text-sm sm:text-base font-bold text-[var(--accent)]">{score}</span>
        </div>
      </div>

      {/* Soldier Class Breakdown */}
      <div className="flex flex-wrap items-center justify-between text-[11px] font-mono px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)]/50 border border-[var(--border)] text-[var(--text-muted)]">
        <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-secondary)]">Defeated by Class:</span>
        <div className="flex flex-wrap items-center gap-3">
          <span>Infantry: <strong className="text-emerald-400 font-bold">{classKillCounts.infantry}</strong></span>
          <span>Assault: <strong className="text-amber-400 font-bold">{classKillCounts.assault}</strong></span>
          <span>Armored: <strong className="text-cyan-400 font-bold">{classKillCounts.armored}</strong></span>
          <span>Elite: <strong className="text-purple-400 font-bold">{classKillCounts.elite}</strong></span>
        </div>
      </div>

      {/* Dynamic Tier Escalation Toast Banner */}
      {tierUpToast && (
        <div className="px-3 py-2 rounded-lg bg-orange-950/80 border border-orange-500/60 text-orange-300 font-mono text-xs flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <span className="flex items-center gap-2 font-bold">
            <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
            {tierUpToast}
          </span>
          <span className="text-[10px] text-orange-400 uppercase">Speed & Density Scaling</span>
        </div>
      )}

      {/* Cinematic Soldier Combat Battlefield */}
      <div
        className={`relative w-full rounded-xl border border-[var(--border)] overflow-hidden shadow-2xl flex flex-col justify-between transition-colors duration-200 ${
          alarmActive ? 'bg-red-950/40 ring-4 ring-rose-500/40' : 'bg-[#06080e]'
        }`}
        style={{ height: ARENA_HEIGHT }}
      >
        {/* Distant Military Terrain & Haze Background */}
        <div
          className="absolute inset-0 opacity-25 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 20%, rgba(249,115,22,0.18) 0%, transparent 60%), linear-gradient(to bottom, #090e1a 0%, #04060a 100%)',
          }}
        />

        {/* Distant Military Radar Scanline Grid */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, #38BDF8 1px, transparent 1px), linear-gradient(to bottom, #38BDF8 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Visual Tracer Laser Lines */}
        {tracers.map((tr) => (
          <svg
            key={tr.id}
            className="absolute inset-0 pointer-events-none z-20"
            style={{ width: '100%', height: '100%' }}
          >
            <line
              x1={tr.startX}
              y1={tr.startY}
              x2={tr.endX}
              y2={tr.endY}
              stroke={tr.color}
              strokeWidth="2.5"
              strokeDasharray="8 4"
              opacity={tr.life}
            />
          </svg>
        ))}

        {/* Impact Particles */}
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute w-1.5 h-1.5 rounded-full pointer-events-none z-30"
            style={{
              left: `${p.x}px`,
              top: `${p.y}px`,
              backgroundColor: p.color,
              opacity: p.life,
              boxShadow: `0 0 6px ${p.color}`,
            }}
          />
        ))}

        {/* Floating Combat Score / Callout Texts */}
        {floatingTexts.map((ft) => (
          <div
            key={ft.id}
            className="absolute font-mono text-xs font-black pointer-events-none z-40 transition-transform -translate-x-1/2"
            style={{
              left: `${ft.x}px`,
              top: `${ft.y}px`,
              color: ft.color,
              opacity: ft.life,
              textShadow: '0 0 8px rgba(0,0,0,0.9)',
            }}
          >
            {ft.text}
          </div>
        ))}

        {/* Defense Perimeter Danger Line */}
        <div
          className="absolute left-0 right-0 z-10 border-b-2 border-dashed border-rose-500/70 flex items-center justify-between px-3 text-[10px] font-mono text-rose-400 bg-rose-950/20 pointer-events-none"
          style={{ top: DANGER_LINE_Y }}
        >
          <span className="flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-pulse" /> FRONTLINE DEFENSE BARRICADE
          </span>
          <span>BREACH ZONE</span>
        </div>

        {/* Player Weapon Emplacement (Bottom Center) */}
        <div
          className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none"
        >
          <div className="w-10 h-6 bg-cyan-950 border-2 border-cyan-400 rounded-t-lg flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            <div className="w-1.5 h-3 bg-cyan-300 rounded-t animate-pulse" />
          </div>
          <span className="text-[9px] font-mono text-cyan-400 mt-0.5 uppercase tracking-wider">
            Laser Defense Battery
          </span>
        </div>

        {/* Boss Encounter Header & Phrase Display (When Boss is Active) */}
        {bossActive && (
          <div className={`relative z-20 p-3 bg-black/70 border-b rounded-t-xl backdrop-blur-xs space-y-2 transition-all duration-150 ${
            bossAttackActive
              ? 'border-rose-500 bg-rose-950/80 ring-2 ring-rose-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]'
              : 'border-orange-500/40'
          }`}>
            <div className="flex flex-wrap items-center justify-between text-xs font-mono">
              <span className="text-orange-400 font-bold flex items-center gap-1.5">
                <Skull className="w-4 h-4 text-orange-500 animate-pulse" />
                {bossName} (TITAN COMMANDER)
              </span>
              <span className="text-orange-300 font-bold">
                {bossHp} / {bossMaxHp} HP ({bossHpPercent}%)
              </span>
            </div>

            {/* Boss Segmented HP Bar */}
            <div className="h-2.5 bg-neutral-900 rounded-full overflow-hidden border border-neutral-700">
              <div
                className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-400 transition-all duration-100"
                style={{ width: `${bossHpPercent}%` }}
              />
            </div>

            {/* Boss Charge Countdown & Target Override Phrase */}
            <div className="pt-1 flex flex-col items-center text-center space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-rose-400 uppercase font-bold">
                  ORBITAL CHARGE: {bossAttackTimeLeft}s
                </span>
                <div className="w-24 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 transition-all duration-75"
                    style={{ width: `${(bossAttackTimeLeft / waveConfig.bossAttackTimer) * 100}%` }}
                  />
                </div>
              </div>

              {/* Boss Counterstrike Target Phrase */}
              <div className="px-4 py-2 rounded-lg bg-orange-950/80 border border-orange-500/60 font-mono text-sm sm:text-base font-bold shadow-lg">
                <span className="text-emerald-400 bg-emerald-950/80 px-0.5 rounded">
                  {bossPhrase.slice(0, bossTypedBuffer.length)}
                </span>
                <span className="text-neutral-100">
                  {bossPhrase.slice(bossTypedBuffer.length)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Regular Advancing Battlefield Soldiers */}
        {soldiers.map((soldier) => {
          const isTargeted = soldier.id === activeSoldierId;
          const typedLen = isTargeted ? typedBuffer.length : 0;
          const matchingPart = soldier.word.slice(0, typedLen);
          const remainingPart = soldier.word.slice(typedLen);
          const classMeta = SOLDIER_CLASSES[soldier.classId];

          return (
            <div
              key={soldier.id}
              className={`absolute transition-transform z-15 flex flex-col items-center select-none ${
                soldier.isDefeated ? 'opacity-0 scale-75 duration-200' : 'opacity-100'
              }`}
              style={{ left: `${soldier.x}px`, top: `${soldier.y}px`, transform: 'translate(-50%, -50%)' }}
            >
              {/* Target Word Tag Above Soldier */}
              <div
                className={`px-2 py-0.5 rounded-md font-mono text-xs font-bold shadow-lg border transition-all ${
                  isTargeted
                    ? 'bg-black/90 border-2 border-emerald-400 text-emerald-300 ring-2 ring-emerald-400/40 scale-105 z-30'
                    : 'bg-neutral-900/90 border-neutral-700 text-neutral-200 z-10'
                }`}
              >
                {isTargeted ? (
                  <span>
                    <span className="text-emerald-400 bg-emerald-950/80 px-0.5 rounded">
                      {matchingPart}
                    </span>
                    <span className="text-neutral-100">{remainingPart}</span>
                  </span>
                ) : (
                  soldier.word
                )}
              </div>

              {/* Soldier Class Graphic / Silhouette */}
              <div className="mt-1 flex flex-col items-center">
                <div
                  className="w-7 h-7 rounded-md border flex items-center justify-center shadow-md relative"
                  style={{
                    backgroundColor: `${classMeta.color}25`,
                    borderColor: classMeta.color,
                  }}
                >
                  {soldier.classId === 'infantry' && <Crosshair className="w-4 h-4 text-emerald-400" />}
                  {soldier.classId === 'assault' && <Zap className="w-4 h-4 text-rose-400" />}
                  {soldier.classId === 'armored' && <Shield className="w-4 h-4 text-sky-400" />}
                  {soldier.classId === 'elite' && <Skull className="w-4 h-4 text-purple-400" />}

                  {/* Armored 2-Stage HP indicator */}
                  {soldier.maxHp > 1 && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-sky-500 text-[8px] font-bold text-black flex items-center justify-center">
                      {soldier.hp}
                    </div>
                  )}
                </div>

                {/* Soldier Class Badge Pill */}
                <span
                  className="text-[9px] font-mono px-1 py-0.2 rounded mt-0.5 font-bold uppercase tracking-wider"
                  style={{ color: classMeta.color, backgroundColor: `${classMeta.color}15` }}
                >
                  {classMeta.badge.split(' ')[0]}
                </span>
              </div>
            </div>
          );
        })}

        {/* State Overlays */}
        {gameState === 'ready' && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-xs z-40 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-orange-950/60 border border-orange-500/50 text-orange-400 flex items-center justify-center shadow-xl">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-md">
              <h3 className="text-2xl font-black text-[var(--text-primary)]">Frontline Soldier Combat</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Enemy soldiers advance toward your defense barricade. Type assigned combat codes to eliminate infantry,
                assault, armored, and spec-ops units. Defeat titanic commanders on boss waves!
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono max-w-lg w-full pt-1">
              <div className="p-2 rounded bg-neutral-900 border border-emerald-500/30 text-emerald-400">
                <span className="font-bold block">INFANTRY</span>
                <span className="text-[9px] text-neutral-400">1-Hit • Common Words</span>
              </div>
              <div className="p-2 rounded bg-neutral-900 border border-rose-500/30 text-rose-400">
                <span className="font-bold block">ASSAULT</span>
                <span className="text-[9px] text-neutral-400">Fast • Velocity Threat</span>
              </div>
              <div className="p-2 rounded bg-neutral-900 border border-sky-500/30 text-sky-400">
                <span className="font-bold block">ARMORED</span>
                <span className="text-[9px] text-neutral-400">2-Stage Shield Armor</span>
              </div>
              <div className="p-2 rounded bg-neutral-900 border border-purple-500/30 text-purple-400">
                <span className="font-bold block">ELITE SPEC-OPS</span>
                <span className="text-[9px] text-neutral-400">High Speed • Bonus Pts</span>
              </div>
            </div>

            <Button variant="primary" size="lg" icon={Play} onClick={startCountdown}>
              Deploy to Battlefield
            </Button>
          </div>
        )}

        {gameState === 'countdown' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs z-40 flex items-center justify-center">
            <span className="text-7xl font-black font-mono text-orange-500 animate-pulse">
              {countdown}
            </span>
          </div>
        )}

        {gameState === 'wave_cleared' && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-xs z-40 flex flex-col items-center justify-center space-y-3">
            <Award className="w-12 h-12 text-emerald-400 animate-bounce" />
            <h3 className="text-2xl font-black font-mono text-emerald-300">WAVE {wave - 1} SECURED</h3>
            <p className="text-xs font-mono text-neutral-300">Deploying Reinforcements to Sector {wave}...</p>
          </div>
        )}

        {gameState === 'boss_alert' && (
          <div className="absolute inset-0 bg-red-950/80 backdrop-blur-xs z-40 flex flex-col items-center justify-center space-y-3 p-4 text-center">
            <AlertTriangle className="w-14 h-14 text-orange-500 animate-pulse" />
            <h3 className="text-3xl font-black font-mono text-orange-400 tracking-wider">
              WARNING: TITAN COMMANDER DETECTED
            </h3>
            <p className="text-sm font-mono text-orange-200">
              {bossName} is entering the combat theater. Prepare defensive counterstrikes!
            </p>
          </div>
        )}

        {gameState === 'paused' && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-xs z-40 flex flex-col items-center justify-center space-y-4">
            <h3 className="text-xl font-bold text-[var(--text-primary)]">Combat Suspended</h3>
            <div className="flex gap-3">
              <Button variant="primary" size="sm" icon={Play} onClick={() => setGameState('playing')}>
                Resume Combat
              </Button>
              <Button variant="outline" size="sm" icon={RotateCcw} onClick={startCountdown}>
                Restart
              </Button>
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-40 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <Skull className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-[var(--text-primary)]">Defense Perimeter Breached</h3>
              <p className="text-xs text-[var(--text-secondary)]">Frontline defenses collapsed under enemy assault.</p>
            </div>

            {personalBestNotice && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold">
                <Trophy className="w-3.5 h-3.5" /> NEW PERSONAL BEST RECORD!
              </div>
            )}

            {/* Comprehensive Combat Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[var(--bg-elevated)] p-4 rounded-xl border border-[var(--border)] text-xs font-mono w-full max-w-lg">
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Final Score</span>
                <span className="text-base font-bold text-[var(--accent)]">{score}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Wave Reached</span>
                <span className="text-base font-bold text-orange-400">Wave {wave}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Soldiers Down</span>
                <span className="text-base font-bold text-emerald-400">{soldiersDefeated}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Commanders Slain</span>
                <span className="text-base font-bold text-purple-400">{bossesDefeated}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Max Combo</span>
                <span className="text-base font-bold text-amber-400">{maxCombo}x</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Velocity</span>
                <span className="text-base font-bold text-cyan-400">{liveWpm} WPM</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Accuracy</span>
                <span className="text-base font-bold text-emerald-400">{accuracy}%</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Combat Time</span>
                <span className="text-base font-bold text-[var(--text-secondary)]">{elapsedSeconds}s</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button variant="primary" size="md" icon={RotateCcw} onClick={startCountdown}>
                Redeploy
              </Button>
              <Button variant="outline" size="md" onClick={onExit}>
                Back to Arcade
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex flex-wrap items-center justify-between text-xs text-[var(--text-muted)] font-mono px-1">
        <span>Type first letter of approaching soldier to lock and fire</span>
        <span>
          Personal Best: {personalBest?.bestScore || 0} pts (Wave {personalBest?.highestWave || 1})
        </span>
      </div>

      {/* Exit Run Confirmation Dialog */}
      <ArcadeExitDialog
        isOpen={showExitConfirm}
        onCancel={() => setShowExitConfirm(false)}
        onConfirm={onExit}
      />
    </div>
  );
};
