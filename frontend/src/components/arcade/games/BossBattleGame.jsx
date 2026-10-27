import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShieldAlert, RotateCcw, Play, Pause, ArrowLeft, Trophy, Skull, Shield } from 'lucide-react';
import { Button } from '../../common/Button';
import { calculateAccuracy, playArcadeSound } from '../../../utils/arcadeEngine';
import { saveArcadeRecord, getGameRecord } from '../../../utils/arcadeStorage';
import { ARCADE_WORDS } from '../../../data/arcadeGamesData';

const BOSS_MAX_HP = 1000;
const PLAYER_MAX_HP = 100;
const ATTACK_TIMER_BASE = 5.5; // seconds player has before boss attacks

export const BossBattleGame = ({ onExit, soundEnabled = true }) => {
  const [gameState, setGameState] = useState('ready'); // ready, countdown, playing, paused, gameover, victory
  const [countdown, setCountdown] = useState(3);

  const [bossHp, setBossHp] = useState(BOSS_MAX_HP);
  const [playerHp, setPlayerHp] = useState(PLAYER_MAX_HP);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Attack timer before boss strikes
  const [attackTimeLeft, setAttackTimeLeft] = useState(ATTACK_TIMER_BASE);
  const [currentPhrase, setCurrentPhrase] = useState('');
  const [typedBuffer, setTypedBuffer] = useState('');
  const [laserAttackActive, setLaserAttackActive] = useState(false);
  const [bossAttackActive, setBossAttackActive] = useState(false);

  const [totalStrokes, setTotalStrokes] = useState(0);
  const [correctStrokes, setCorrectStrokes] = useState(0);
  const [personalBestNotice, setPersonalBestNotice] = useState(false);

  const timerRef = useRef(null);
  const attackTimerRef = useRef(null);
  const inputRef = useRef(null);
  const phraseIndexRef = useRef(0);

  const personalBest = getGameRecord('boss');

  // Next attack phrase
  const pickNextPhrase = useCallback(() => {
    const pool = ARCADE_WORDS.bossPhrases;
    const phrase = pool[phraseIndexRef.current % pool.length];
    phraseIndexRef.current++;
    return phrase;
  }, []);

  const resetGame = useCallback(() => {
    setGameState('ready');
    setBossHp(BOSS_MAX_HP);
    setPlayerHp(PLAYER_MAX_HP);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setElapsedSeconds(0);
    setTotalStrokes(0);
    setCorrectStrokes(0);
    setTypedBuffer('');
    setLaserAttackActive(false);
    setBossAttackActive(false);
    setPersonalBestNotice(false);
    phraseIndexRef.current = 0;
    setCurrentPhrase(pickNextPhrase());
    setAttackTimeLeft(ATTACK_TIMER_BASE);
  }, [pickNextPhrase]);

  const startCountdown = () => {
    resetGame();
    setGameState('countdown');
    setCountdown(3);
  };

  // Countdown
  useEffect(() => {
    if (gameState !== 'countdown') return;
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 800);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setGameState('playing'), 0);
    return () => clearTimeout(t);
  }, [gameState, countdown]);

  // Elapsed timer
  useEffect(() => {
    if (gameState !== 'playing') {
      clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [gameState]);

  // Boss attack urgency decay timer
  useEffect(() => {
    if (gameState !== 'playing') {
      clearInterval(attackTimerRef.current);
      return;
    }

    attackTimerRef.current = setInterval(() => {
      setAttackTimeLeft((t) => {
        if (t <= 0.1) {
          // Boss strikes!
          playArcadeSound('boss-hit', soundEnabled);
          setBossAttackActive(true);
          setTimeout(() => setBossAttackActive(false), 300);

          setPlayerHp((hp) => {
            const nextHp = hp - 20;
            if (nextHp <= 0) setGameState('gameover');
            return Math.max(0, nextHp);
          });
          setCombo(0);
          setTypedBuffer('');
          setCurrentPhrase(pickNextPhrase());
          return ATTACK_TIMER_BASE;
        }
        return Math.max(0, parseFloat((t - 0.1).toFixed(2)));
      });
    }, 100);

    return () => clearInterval(attackTimerRef.current);
  }, [gameState, pickNextPhrase, soundEnabled]);

  // Focus input
  useEffect(() => {
    if (gameState === 'playing' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameState]);

  // Save record on completion
  useEffect(() => {
    if (gameState === 'victory' || gameState === 'gameover') {
      const isDefeated = gameState === 'victory';
      const result = saveArcadeRecord('boss', {
        score,
        bossDefeated: isDefeated,
        durationSeconds: elapsedSeconds,
      });
      if (result.isNewBest) {
        const t = setTimeout(() => setPersonalBestNotice(true), 0);
        return () => clearTimeout(t);
      }
    }
  }, [gameState, score, elapsedSeconds]);

  // Handle typing attack
  const handleKeyDown = (e) => {
    if (gameState !== 'playing') return;

    if (e.key === 'Escape') {
      setGameState('paused');
      return;
    }

    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      const char = e.key;
      setTotalStrokes((s) => s + 1);

      const expectedChar = currentPhrase[typedBuffer.length];
      if (char.toLowerCase() === expectedChar.toLowerCase()) {
        setCorrectStrokes((s) => s + 1);
        playArcadeSound('blaster', soundEnabled);
        const nextBuf = typedBuffer + char;
        setTypedBuffer(nextBuf);

        // Complete attack phrase executed!
        if (nextBuf.length === currentPhrase.length) {
          playArcadeSound('boss-hit', soundEnabled);
          setLaserAttackActive(true);
          setTimeout(() => setLaserAttackActive(false), 250);

          const damage = 110 + combo * 15;
          setBossHp((bhp) => {
            const remaining = bhp - damage;
            if (remaining <= 0) {
              setGameState('victory');
              playArcadeSound('victory', soundEnabled);
              return 0;
            }
            return remaining;
          });

          const pts = currentPhrase.length * 30 * (1 + combo * 0.2);
          setScore((sc) => Math.round(sc + pts));
          setCombo((c) => {
            const next = c + 1;
            setMaxCombo((m) => Math.max(m, next));
            if (next % 3 === 0) playArcadeSound('combo', soundEnabled);
            return next;
          });

          setTypedBuffer('');
          setCurrentPhrase(pickNextPhrase());
          setAttackTimeLeft(ATTACK_TIMER_BASE);
        }
      } else {
        // Typing mistake breaks combo
        playArcadeSound('damage', soundEnabled);
        setCombo(0);
      }
    }
  };

  const accuracy = calculateAccuracy(correctStrokes, totalStrokes);
  const bossHpPercent = Math.max(0, Math.round((bossHp / BOSS_MAX_HP) * 100));
  const playerHpPercent = Math.max(0, Math.round((playerHp / PLAYER_MAX_HP) * 100));

  return (
    <div
      className="card-panel p-4 sm:p-6 space-y-4 max-w-4xl mx-auto border border-[var(--border)] shadow-2xl relative select-none"
      onClick={() => inputRef.current?.focus()}
    >
      <input
        ref={inputRef}
        type="text"
        className="opacity-0 absolute w-0 h-0 pointer-events-none"
        onKeyDown={handleKeyDown}
        aria-label="Boss Battle typing combat input"
      />

      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="xs" icon={ArrowLeft} onClick={onExit}>
            Arcade Hub
          </Button>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-orange-500" />
              Boss Battle: Aethelred the Annihilator
            </h2>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              Colossal Mecha Confrontation • Type to Counterstrike
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

      {/* Duel Health Gauges Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[var(--bg-elevated)] p-4 rounded-xl border border-[var(--border)] font-mono text-xs">
        {/* Boss HP Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-orange-400 font-bold flex items-center gap-1.5">
              <Skull className="w-4 h-4" /> AETHELRED HP
            </span>
            <span className="text-orange-300 font-bold">
              {bossHp} / {BOSS_MAX_HP} ({bossHpPercent}%)
            </span>
          </div>
          <div className="h-3 bg-neutral-900 rounded-full overflow-hidden border border-neutral-700">
            <div
              className="h-full bg-gradient-to-r from-red-600 to-orange-500 transition-all duration-150"
              style={{ width: `${bossHpPercent}%` }}
            />
          </div>
        </div>

        {/* Player HP Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-cyan-400 font-bold flex items-center gap-1.5">
              <Shield className="w-4 h-4" /> PLAYER SHIELD HP
            </span>
            <span className="text-cyan-300 font-bold">
              {playerHp} / {PLAYER_MAX_HP} ({playerHpPercent}%)
            </span>
          </div>
          <div className="h-3 bg-neutral-900 rounded-full overflow-hidden border border-neutral-700">
            <div
              className={`h-full transition-all duration-150 ${
                playerHp <= 30
                  ? 'bg-rose-500 animate-pulse'
                  : 'bg-gradient-to-r from-cyan-600 to-emerald-400'
              }`}
              style={{ width: `${playerHpPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Combat Arena */}
      <div
        className={`relative w-full rounded-xl border border-[var(--border)] bg-[#090810] overflow-hidden shadow-inner min-h-[300px] flex flex-col justify-between p-6 transition-colors duration-150 ${
          bossAttackActive ? 'bg-red-950/60 ring-4 ring-red-500/50' : ''
        }`}
      >
        {/* Laser Attack Beam Visual */}
        {laserAttackActive && (
          <div
            className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center animate-out fade-out duration-200"
            style={{
              background:
                'radial-gradient(circle at 50% 50%, rgba(6,182,212,0.5) 0%, transparent 60%)',
            }}
          >
            <div className="w-full h-2 bg-cyan-300 shadow-[0_0_20px_cyan]" />
          </div>
        )}

        {/* Boss Status & Attack Countdown Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 z-10 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-orange-950/80 border border-orange-500/40 text-orange-400 font-bold text-[11px]">
              BOSS CHARGE: {attackTimeLeft}s
            </span>
            <div className="w-32 h-2 bg-neutral-800 rounded-full overflow-hidden border border-neutral-700">
              <div
                className="h-full bg-orange-500 transition-all duration-75"
                style={{ width: `${(attackTimeLeft / ATTACK_TIMER_BASE) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="text-[var(--text-muted)]">
              Combo: <strong className="text-orange-400">{combo}x</strong>
            </span>
            <span className="text-[var(--text-muted)]">
              Score: <strong className="text-[var(--text-primary)]">{score}</strong>
            </span>
          </div>
        </div>

        {/* Active Combat Attack Target Phrase Display */}
        <div className="my-auto py-6 text-center space-y-4 z-10">
          <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-400 font-bold block">
            DEFENSIVE COUNTERSTRIKE OVERRIDE
          </span>

          <div className="inline-block px-6 py-3 rounded-2xl bg-[var(--bg-elevated)] border-2 border-cyan-400/80 shadow-[0_0_20px_rgba(6,182,212,0.3)] ring-2 ring-cyan-500/20 max-w-xl">
            <span className="font-mono text-xl sm:text-2xl font-black tracking-wide">
              <span className="text-emerald-400 bg-emerald-950/60 rounded px-1">
                {currentPhrase.slice(0, typedBuffer.length)}
              </span>
              <span className="text-[var(--text-primary)]">
                {currentPhrase.slice(typedBuffer.length)}
              </span>
            </span>
            <span className="inline-block w-0.5 h-6 bg-cyan-400 animate-pulse ml-1 align-middle" />
          </div>
        </div>

        {/* Combat Status Bar */}
        <div className="flex flex-wrap justify-between items-center text-xs font-mono text-[var(--text-muted)] z-10">
          <span>Type exact combat phrase to fire kinetic plasma cannons</span>
          <span>Boss Damage: 110 + {combo * 15} combo dmg</span>
        </div>

        {/* Overlays */}
        {gameState === 'ready' && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-xs z-30 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[var(--bg-elevated)] border border-orange-500/40 text-orange-500 flex items-center justify-center shadow-lg">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-xl font-bold text-[var(--text-primary)]">Titan Confrontation</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Aethelred charges energy blasts every 5.5s. Type counterstrike commands accurately to damage the boss and disrupt incoming attacks!
              </p>
            </div>
            <Button variant="primary" size="lg" icon={Play} onClick={startCountdown}>
              Engage Boss
            </Button>
          </div>
        )}

        {gameState === 'countdown' && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xs z-30 flex items-center justify-center">
            <span className="text-6xl font-black font-mono text-orange-500 animate-pulse">
              {countdown}
            </span>
          </div>
        )}

        {gameState === 'paused' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xs z-30 flex flex-col items-center justify-center space-y-4">
            <h3 className="text-xl font-bold text-[var(--text-primary)]">Encounter Paused</h3>
            <div className="flex gap-3">
              <Button variant="primary" size="sm" icon={Play} onClick={() => setGameState('playing')}>
                Resume
              </Button>
              <Button variant="outline" size="sm" icon={RotateCcw} onClick={startCountdown}>
                Restart
              </Button>
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <Skull className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-rose-400">Player Defeated!</h3>
              <p className="text-xs text-[var(--text-secondary)]">Aethelred overwhelmed your shield generators.</p>
            </div>

            <div className="grid grid-cols-3 gap-3 bg-[var(--bg-elevated)] p-4 rounded-xl border border-[var(--border)] text-xs font-mono w-full max-w-sm">
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Boss HP Left</span>
                <span className="text-lg font-bold text-orange-400">{bossHp}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Score</span>
                <span className="text-lg font-bold text-[var(--accent)]">{score}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Accuracy</span>
                <span className="text-lg font-bold text-[var(--ui-success)]">{accuracy}%</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button variant="primary" size="md" icon={RotateCcw} onClick={startCountdown}>
                Retry Battle
              </Button>
              <Button variant="outline" size="md" onClick={onExit}>
                Back to Arcade
              </Button>
            </div>
          </div>
        )}

        {gameState === 'victory' && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Trophy className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-emerald-400">TITAN ANNIHILATED!</h3>
              <p className="text-xs text-[var(--text-secondary)]">Aethelred the Annihilator has fallen to your precision typing.</p>
            </div>

            {personalBestNotice && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold">
                <Trophy className="w-3.5 h-3.5" /> FIRST TITAN VICTORY RECORDED!
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 bg-[var(--bg-elevated)] p-4 rounded-xl border border-[var(--border)] text-xs font-mono w-full max-w-sm">
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Final Score</span>
                <span className="text-lg font-bold text-[var(--accent)]">{score + 1000}</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Duration</span>
                <span className="text-lg font-bold text-cyan-400">{elapsedSeconds}s</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] block">Max Combo</span>
                <span className="text-lg font-bold text-amber-400">{maxCombo}x</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button variant="primary" size="md" icon={RotateCcw} onClick={startCountdown}>
                Battle Again
              </Button>
              <Button variant="outline" size="md" onClick={onExit}>
                Back to Arcade
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between text-xs text-[var(--text-muted)] font-mono px-1">
        <span>Deflect attacks with sub-millisecond typing accuracy</span>
        <span>Best Score: {personalBest?.bestScore || 0} pts</span>
      </div>
    </div>
  );
};
