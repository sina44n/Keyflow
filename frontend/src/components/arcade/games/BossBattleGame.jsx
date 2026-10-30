import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ShieldAlert, RotateCcw, Play, Pause, ArrowLeft, Trophy, Skull, Shield, Crosshair, Zap,
  AlertTriangle, Award, Flame, Sliders
} from 'lucide-react';
import { Button } from '../../common/Button';
import { calculateAccuracy, calculateWpm, playArcadeSound } from '../../../utils/arcadeEngine';
import { saveArcadeRecord, getGameRecord } from '../../../utils/arcadeStorage';
import { ARCADE_WORDS, SOLDIER_CLASSES } from '../../../data/arcadeGamesData';
import { calculateDifficultyTier, getBossBattleConfig } from '../../../utils/arcadeDifficulty';
import { ArcadeWordDeck } from '../../../utils/arcadeVocabulary';
import { ArcadeExitDialog } from '../ArcadeExitDialog';
import { useI18n } from '../../../i18n/I18nContext';
import {
  GlobalGameManager,
  RENDERING_TECH,
} from '../../../utils/performance/GlobalGameManager';
import { GlobalGameSettingsModal } from '../performance/GlobalGameSettingsModal';
import { Boss3DScene } from '../boss3d/Boss3DScene';
import { Boss3DAudio } from '../boss3d/Boss3DAudio';

const ARENA_WIDTH = 760;
const ARENA_HEIGHT = 480;
const DANGER_LINE_Y = 360;
const PLAYER_MAX_HP = 100;

export const BossBattleGame = ({ onExit, soundEnabled = true }) => {
  const { t } = useI18n();
  // Game states: 'ready', 'countdown', 'playing', 'wave_cleared', 'boss_alert', 'paused', 'gameover', 'victory'
  const [gameState, setGameState] = useState('ready');
  const [countdown, setCountdown] = useState(3);

  // 3D Canvas container & engine refs
  const canvasContainerRef = useRef(null);
  const scene3dRef = useRef(null);
  const audio3dRef = useRef(null);

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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
  const [floatingTexts, setFloatingTexts] = useState([]);
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

  // Audio initialization
  useEffect(() => {
    audio3dRef.current = new Boss3DAudio();
    audio3dRef.current.setEnabled(soundEnabled);

    return () => {
      audio3dRef.current?.cleanup();
    };
  }, []);

  useEffect(() => {
    audio3dRef.current?.setEnabled(soundEnabled);
  }, [soundEnabled]);

  // Three.js 3D Scene Initialization
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const scene = new Boss3DScene(canvasContainerRef.current);
    scene3dRef.current = scene;

    return () => {
      scene.destroy();
      scene3dRef.current = null;
    };
  }, []);

  // Sync soldiers with 3D scene
  useEffect(() => {
    scene3dRef.current?.syncSoldiers(soldiers, activeSoldierId, typedBuffer);
  }, [soldiers, activeSoldierId, typedBuffer]);

  // Sync boss counter-parry shield with 3D scene
  useEffect(() => {
    if (bossActive) {
      scene3dRef.current?.syncBossAttack(bossPhrase, bossTypedBuffer, bossAttackTimeLeft);
    } else {
      scene3dRef.current?.syncBossAttack('', '', 0);
    }
  }, [bossActive, bossPhrase, bossTypedBuffer, bossAttackTimeLeft]);

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

  // Helper: Add floating combat text
  const addFloatingText = useCallback((text, x, y, color = '#10B981') => {
    const id = Math.random();
    setFloatingTexts((prev) => [...prev, { id, text, x, y, color, life: 1.0 }]);
  }, []);

  // Screen shake respecting Reduced Motion and Graphics Profile
  const triggerScreenShake = useCallback(() => {
    const domConfig = GlobalGameManager.getGraphicsConfig(RENDERING_TECH.SVG_DOM);
    if (!domConfig.enableScreenShake) return;
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
      audio3dRef.current?.playTitanRoar();

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
            // Boss ground slam attack fires!
            audio3dRef.current?.playGroundSlam();
            scene3dRef.current?.triggerBossGroundSlam();
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
            addFloatingText('TITAN SEISMIC SLAM -22 HP!', ARENA_WIDTH / 2, ARENA_HEIGHT - 60, '#EF4444');
            return waveConfig.bossAttackTimer;
          }
          return parseFloat((t - dt).toFixed(2));
        });
      }

      // 3. Move active soldiers forward towards player defense line
      setSoldiers((prev) => {
        let breached = false;
        const updated = prev
          .map((s) => {
            if (s.isDefeated) {
              return { ...s, defeatTimer: s.defeatTimer + dt };
            }

            const newY = s.y + s.speed * dt;
            if (newY >= DANGER_LINE_Y && !s.hasBreached) {
              breached = true;
              return { ...s, y: newY, hasBreached: true, isDefeated: true };
            }
            return { ...s, y: newY };
          })
          .filter((s) => s.defeatTimer < 0.25 && s.y < ARENA_HEIGHT + 20);

        if (breached) {
          playArcadeSound('damage', soundEnabled);
          triggerScreenShake();
          setPlayerHp((hp) => {
            const nextHp = hp - 15;
            if (nextHp <= 0) setGameState('gameover');
            return Math.max(0, nextHp);
          });
          setCombo(0);
          addFloatingText('BARRICADE BREACHED! -15 HP', ARENA_WIDTH / 2, DANGER_LINE_Y, '#EF4444');
        }

        // Check if wave is cleared
        if (
          !bossActive &&
          soldiersSpawnedInWaveRef.current >= waveConfig.soldierQuota &&
          updated.length === 0
        ) {
          advanceWave();
        }

        return updated;
      });

      // 4. Update floating texts decay
      setFloatingTexts((prev) =>
        prev
          .map((ft) => ({ ...ft, y: ft.y - 30 * dt, life: ft.life - dt * 1.5 }))
          .filter((ft) => ft.life > 0)
      );

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [
    gameState,
    bossActive,
    waveConfig,
    pickSoldierClass,
    pickSoldierWord,
    pickNextBossPhrase,
    advanceWave,
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
          audio3dRef.current?.playBolt();
          scene3dRef.current?.fireBolt();

          // Full boss phrase completed -> counterstrike!
          if (nextBuffer === bossPhrase) {
            audio3dRef.current?.playParryGong();
            triggerScreenShake();

            const damage = 140 + combo * 10;
            const newCombo = combo + 1;
            setCombo(newCombo);
            setMaxCombo((m) => Math.max(m, newCombo));
            setScore((sc) => sc + 500 * newCombo);
            addFloatingText(`PARRY COUNTER! -${damage} HP! STUNNED!`, ARENA_WIDTH / 2, 110, '#38BDF8');

            setBossHp((hp) => {
              const nextHp = hp - damage;
              if (nextHp <= 0) {
                // Boss defeated!
                setBossesDefeated((b) => b + 1);
                setBossActive(false);
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
      if (activeSoldierId) {
        const soldier = soldiers.find((s) => s.id === activeSoldierId && !s.isDefeated);
        if (soldier) {
          const expectedChar = soldier.word[typedBuffer.length]?.toLowerCase();
          if (char === expectedChar) {
            setCorrectStrokes((c) => c + 1);
            const nextBuf = typedBuffer + soldier.word[typedBuffer.length];
            setTypedBuffer(nextBuf);
            audio3dRef.current?.playBolt();

            // Fire 3D bolt to soldier
            scene3dRef.current?.fireBolt();

            // Word completed!
            if (nextBuf === soldier.word) {
              const classMeta = SOLDIER_CLASSES[soldier.classId];

              // Check multi-stage armored soldier
              if (soldier.hp > 1) {
                playArcadeSound('boss-hit', soundEnabled);
                addFloatingText('ARMOR BROKEN!', soldier.x, soldier.y - 15, '#38BDF8');
                setSoldiers((prev) =>
                  prev.map((s) => (s.id === soldier.id ? { ...s, hp: 1, word: pickSoldierWord('infantry') } : s))
                );
                setTypedBuffer('');
                return;
              }

              // Soldier fully defeated!
              audio3dRef.current?.playBolt();
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

      // No active target: acquire target that begins with typed char
      const matchingSoldiers = soldiers
        .filter((s) => !s.isDefeated && s.word[0]?.toLowerCase() === char)
        .sort((a, b) => b.y - a.y);

      if (matchingSoldiers.length > 0) {
        const target = matchingSoldiers[0];
        setActiveSoldierId(target.id);
        setTypedBuffer(target.word[0]);
        setCorrectStrokes((c) => c + 1);
        audio3dRef.current?.playBolt();
        scene3dRef.current?.fireBolt();

        if (target.word.length === 1) {
          const classMeta = SOLDIER_CLASSES[target.classId];
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
      className={`card-panel p-4 sm:p-6 space-y-4 max-w-5xl mx-auto border border-[var(--border)] shadow-2xl relative select-none transition-transform ${
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
            {t('nav.arcade')}
          </Button>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-orange-500" />
              <span>3D Titan Colosseum</span>
            </h2>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              Wave {wave} • {difficultyInfo.tierName} Intensity (Tier {difficultyInfo.tier}) • Dynamic Boss Parry System
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {gameState === 'playing' ? (
            <Button variant="outline" size="xs" icon={Pause} onClick={() => setGameState('paused')}>
              {t('common.pause')}
            </Button>
          ) : gameState === 'paused' ? (
            <Button variant="primary" size="xs" icon={Play} onClick={() => setGameState('playing')}>
              {t('common.resume')}
            </Button>
          ) : null}
          <Button variant="ghost" size="xs" icon={RotateCcw} onClick={startCountdown}>
            {t('common.restart')}
          </Button>
        </div>
      </div>

      {/* HUD Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 bg-[var(--bg-elevated)] p-3 rounded-xl border border-[var(--border)] font-mono text-xs">
        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)] block">{t('arcade.hud.health')}</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Shield className={`w-3.5 h-3.5 ${playerHp <= 30 ? 'text-rose-500 animate-pulse' : 'text-cyan-400'}`} />
            <span className={`font-bold ${playerHp <= 30 ? 'text-rose-400' : 'text-cyan-300'}`}>
              {playerHp}%
            </span>
          </div>
        </div>

        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)] block">{t('arcade.hud.wave')}</span>
          <span className="text-sm sm:text-base font-bold text-orange-400">Wave {wave}</span>
        </div>

        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)] block">{t('arcade.hud.combo')}</span>
          <span className="text-sm sm:text-base font-bold text-[var(--accent)]">
            {combo}x <span className="text-[10px] text-[var(--text-muted)]">(max {maxCombo})</span>
          </span>
        </div>

        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)] block">Enemies Neutralized</span>
          <span className="text-sm sm:text-base font-bold text-emerald-400">{soldiersDefeated}</span>
        </div>

        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)] block">Velocity</span>
          <span className="text-sm sm:text-base font-bold text-[var(--text-primary)]">{liveWpm} WPM</span>
        </div>

        <div>
          <span className="text-[10px] uppercase text-[var(--text-muted)] block">{t('arcade.hud.score')}</span>
          <span className="text-sm sm:text-base font-bold text-[var(--text-primary)]">{score}</span>
        </div>
      </div>

      {/* Dynamic Tier Escalation Toast Banner */}
      {tierUpToast && (
        <div className="px-3.5 py-2 rounded-xl bg-orange-950/90 border border-orange-500/60 text-orange-300 font-mono text-xs flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2">
          <span className="flex items-center gap-2 font-bold">
            <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
            {tierUpToast}
          </span>
          <span className="text-[10px] text-orange-400 uppercase tracking-wider font-semibold">
            Speed & Density Scaled
          </span>
        </div>
      )}

      {/* 3D WebGL Obsidian Volosseum Viewport */}
      <div className="relative rounded-2xl overflow-hidden border border-[var(--border)] bg-neutral-950 shadow-2xl h-[480px]">
        {/* Three.js Canvas Container */}
        <div ref={canvasContainerRef} className="w-full h-full cursor-default" />

        {/* Floating Combat Callouts */}
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

        {/* Boss Encounter Header & HP Bar (When Boss is Active) */}
        {bossActive && (
          <div className="absolute inset-x-4 top-4 z-20 p-3 bg-black/75 border border-orange-500/50 rounded-xl backdrop-blur-md space-y-1.5 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between text-xs font-mono">
              <span className="text-orange-400 font-bold flex items-center gap-1.5">
                <Skull className="w-4 h-4 text-orange-500 animate-pulse" />
                {bossName} (TITAN MECHA)
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
          </div>
        )}

        {/* State Overlays */}
        {gameState === 'ready' && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-xs z-40 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-orange-950/60 border border-orange-500/50 text-orange-400 flex items-center justify-center shadow-xl animate-pulse">
              <ShieldAlert className="w-9 h-9" />
            </div>
            <div className="space-y-1.5 max-w-md">
              <h3 className="text-2xl font-black text-white tracking-tight">3D Titan Colosseum</h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Step into the obsidian volcanic colosseum. Eliminate marching squads of mecha soldiers by typing their callsigns, then face articulated Titan Bosses and type counterstrike phrases to parry their orbital slams.
              </p>
            </div>

            <Button variant="primary" size="lg" icon={Play} onClick={startCountdown} className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 shadow-xl">
              ENTER THE COLOSSEUM
            </Button>
          </div>
        )}

        {gameState === 'boss_alert' && (
          <div className="absolute inset-0 bg-red-950/85 backdrop-blur-xs z-40 flex flex-col items-center justify-center space-y-3 animate-pulse">
            <Skull className="w-16 h-16 text-rose-500" />
            <h3 className="text-3xl font-black font-mono text-rose-400 tracking-wider">
              WARNING: TITAN TITAN DETECTED
            </h3>
            <p className="text-xs font-mono text-rose-300">
              Orbital defense online • Prepare counter-parry phrases!
            </p>
          </div>
        )}

        {gameState === 'wave_cleared' && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-xs z-40 flex flex-col items-center justify-center space-y-2">
            <Award className="w-12 h-12 text-emerald-400 animate-bounce" />
            <h3 className="text-2xl font-black font-mono text-emerald-400">
              WAVE {wave - 1} SECURED!
            </h3>
            <p className="text-xs font-mono text-neutral-300">Next squadron deploying...</p>
          </div>
        )}

        {gameState === 'countdown' && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-xs z-40 flex items-center justify-center">
            <span className="text-7xl font-black font-mono text-orange-400 animate-pulse">
              {countdown}
            </span>
          </div>
        )}

        {gameState === 'paused' && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-xs z-40 flex flex-col items-center justify-center space-y-4">
            <h3 className="text-2xl font-bold text-white font-mono">COMBAT PAUSED</h3>
            <div className="flex gap-3">
              <Button variant="primary" size="sm" icon={Play} onClick={() => setGameState('playing')}>
                {t('common.resume')}
              </Button>
              <Button variant="outline" size="sm" icon={RotateCcw} onClick={startCountdown}>
                {t('common.restart')}
              </Button>
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-black/92 backdrop-blur-md z-40 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center shadow-xl">
              <Skull className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white tracking-tight">DEFENSE COMPROMISED</h3>
              <p className="text-xs text-neutral-400 font-mono">Colosseum Barricade Overrun at Wave {wave}</p>
            </div>

            {personalBestNotice && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold animate-pulse">
                <Trophy className="w-3.5 h-3.5" /> NEW PERSONAL BEST RECORD!
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/5 p-4 rounded-xl border border-white/10 text-xs font-mono w-full max-w-md">
              <div>
                <span className="text-[10px] text-neutral-400 block uppercase">Wave Reached</span>
                <span className="text-xl font-bold text-orange-400">Wave {wave}</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block uppercase">Accuracy</span>
                <span className="text-xl font-bold text-cyan-400">{accuracy}%</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block uppercase">Max Combo</span>
                <span className="text-xl font-bold text-amber-400">{maxCombo}x</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block uppercase">Final Score</span>
                <span className="text-xl font-bold text-white">{score}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button variant="primary" size="md" icon={RotateCcw} onClick={startCountdown} className="bg-orange-500 hover:bg-orange-600 text-white font-bold">
                {t('arcade.hud.playAgain')}
              </Button>
              <Button variant="outline" size="md" onClick={onExit}>
                {t('arcade.hud.returnToHub')}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info Strip */}
      <div className="flex flex-wrap items-center justify-between text-xs text-[var(--text-muted)] font-mono px-1">
        <span>Type advancing enemy callsigns to discharge laser bolts; type boss phrases to counter-parry</span>
        <span>Accuracy: {accuracy}% • Record Wave: {personalBest?.highestWave || 1}</span>
      </div>

      {/* Exit Run Confirmation Dialog */}
      <ArcadeExitDialog
        isOpen={showExitConfirm}
        onCancel={() => setShowExitConfirm(false)}
        onConfirm={onExit}
      />

      {/* Global Performance Settings Modal */}
      <GlobalGameSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default BossBattleGame;
