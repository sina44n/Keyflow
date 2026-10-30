import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Volume2, VolumeX } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { ARCADE_GAMES, ARCADE_CATEGORIES } from '../../data/arcadeGamesData';
import { getArcadeRecords } from '../../utils/arcadeStorage';
import { ArcadeGameCard } from './ArcadeGameCard';
import { ArcadeErrorBoundary } from './ArcadeErrorBoundary';
import { KeyCascadeGame } from './games/KeyCascadeGame';
import { SpeedSprintGame } from './games/SpeedSprintGame';
import { WordHunterGame } from './games/WordHunterGame';
import { KeyNinjaGame } from './games/KeyNinjaGame';
import { WordRunnerGame } from './games/WordRunnerGame';
import { TypingMemoryGame } from './games/TypingMemoryGame';
import { BossBattleGame } from './games/BossBattleGame';
import { NitroRacingGame } from './games/NitroRacingGame';
import {
  fetchArcadeStats,
  toggleGameLike,
  recordGamePlaySession,
  getCachedArcadeStats,
} from '../../utils/arcadeStatsService';

export const ArcadeHub = ({ initialGameId = null, onGameChange = null, isEmbedded = false }) => {
  const { t } = useI18n();
  const [selectedGameId, setSelectedGameId] = useState(initialGameId);
  const [activeCategory, setActiveCategory] = useState('all');
  const [records, setRecords] = useState(getArcadeRecords);
  const [stats, setStats] = useState(getCachedArcadeStats);
  const [soundOn, setSoundOn] = useState(true);
  const [isLaunching, setIsLaunching] = useState(false);

  const navigate = useNavigate();
  const arenaRef = useRef(null);

  // Sync internal selected game if parent/route updates initialGameId
  const [prevInitialId, setPrevInitialId] = useState(initialGameId);
  if (initialGameId !== prevInitialId) {
    setPrevInitialId(initialGameId);
    setSelectedGameId(initialGameId);
  }

  // Sync personal best records across tab events
  useEffect(() => {
    const handleRecordUpdate = () => {
      setRecords(getArcadeRecords());
    };
    window.addEventListener('keyflow-arcade-record-updated', handleRecordUpdate);
    return () => window.removeEventListener('keyflow-arcade-record-updated', handleRecordUpdate);
  }, []);

  // Sync real-time arcade stats (likes, unique plays)
  useEffect(() => {
    let mounted = true;
    fetchArcadeStats().then((data) => {
      if (mounted && data) setStats(data);
    });

    const handleStatsUpdate = (e) => {
      if (e.detail) {
        setStats(e.detail);
      }
    };
    window.addEventListener('keyflow-arcade-stats-updated', handleStatsUpdate);
    return () => {
      mounted = false;
      window.removeEventListener('keyflow-arcade-stats-updated', handleStatsUpdate);
    };
  }, []);

  // Handle like toggle with optimistic state
  const handleToggleLike = async (gameId) => {
    const updated = await toggleGameLike(gameId);
    setStats((prev) => ({
      ...prev,
      [gameId]: updated,
    }));
  };

  // When a game is chosen, launch reliably with double-click protection and scroll
  const handlePlayGame = (gameId) => {
    if (isLaunching) return;
    setIsLaunching(true);

    // Record unique play session idempotently
    recordGamePlaySession(gameId);

    if (isEmbedded) {
      navigate(`/arcade/${gameId}`);
      setIsLaunching(false);
      return;
    }

    setSelectedGameId(gameId);
    if (onGameChange) {
      onGameChange(gameId);
    }

    setTimeout(() => {
      setIsLaunching(false);
      if (arenaRef.current) {
        arenaRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 80);
  };

  const handleExitGame = () => {
    setSelectedGameId(null);
    if (onGameChange) {
      onGameChange(null);
    }
  };

  // Filter games
  const filteredGames = ARCADE_GAMES.filter((game) => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'reaction') return ['cascade', 'sprint', 'ninja', 'nitro'].includes(game.id);
    if (activeCategory === 'precision') return ['hunter', 'memory'].includes(game.id);
    if (activeCategory === 'action') return ['runner', 'boss'].includes(game.id);
    return true;
  });

  const isValidGame = ARCADE_GAMES.some((game) => game.id === selectedGameId);

  return (
    <div className="space-y-10" ref={arenaRef}>
      {/* If a game is actively running, render its dedicated interface inside an Error Boundary */}
      {selectedGameId && isValidGame ? (
        <ArcadeErrorBoundary onExit={handleExitGame}>
          <div className="space-y-4 animate-in fade-in duration-200">
            {selectedGameId === 'cascade' && (
              <KeyCascadeGame
                onExit={handleExitGame}
                soundEnabled={soundOn}
              />
            )}
            {selectedGameId === 'sprint' && (
              <SpeedSprintGame
                onExit={handleExitGame}
                soundEnabled={soundOn}
              />
            )}
            {selectedGameId === 'hunter' && (
              <WordHunterGame
                onExit={handleExitGame}
                soundEnabled={soundOn}
              />
            )}
            {selectedGameId === 'ninja' && (
              <KeyNinjaGame
                onExit={handleExitGame}
                soundEnabled={soundOn}
              />
            )}
            {selectedGameId === 'runner' && (
              <WordRunnerGame
                onExit={handleExitGame}
                soundEnabled={soundOn}
              />
            )}
            {selectedGameId === 'memory' && (
              <TypingMemoryGame
                onExit={handleExitGame}
                soundEnabled={soundOn}
              />
            )}
            {selectedGameId === 'boss' && (
              <BossBattleGame
                onExit={handleExitGame}
                soundEnabled={soundOn}
              />
            )}
            {selectedGameId === 'nitro' && (
              <NitroRacingGame
                onExit={handleExitGame}
                soundEnabled={soundOn}
              />
            )}
          </div>
        </ArcadeErrorBoundary>
      ) : (
        /* Discovery Hub View */
        <div className="space-y-8">
          {/* Controls Bar: Categories & Sound Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Arcade categories">
              {ARCADE_CATEGORIES.map((cat) => {
                const localizedCat =
                  cat.id === 'all'
                    ? t('arcade.cat.all')
                    : cat.id === 'reaction'
                    ? t('arcade.cat.reaction')
                    : cat.id === 'precision'
                    ? t('arcade.cat.precision')
                    : t('arcade.cat.action');
                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={activeCategory === cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
                      activeCategory === cat.id
                        ? 'bg-[var(--accent)] text-[var(--accent-fg)] shadow-xs'
                        : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]'
                    }`}
                  >
                    {localizedCat}
                  </button>
                );
              })}
            </div>

            {/* Sound Toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSoundOn((s) => !s)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                title={soundOn ? 'Arcade sound effects enabled' : 'Arcade sound effects muted'}
                aria-label="Toggle arcade audio"
              >
                {soundOn ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{t('arcade.sfxOn')}</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <span>{t('arcade.sfxMuted')}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 8 Game Cards Responsive Grid (3 cols desktop, 2 cols tablet, 1 col mobile) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {filteredGames.map((game) => (
              <ArcadeGameCard
                key={game.id}
                game={game}
                record={records[game.id]}
                stats={stats[game.id]}
                onPlay={handlePlayGame}
                onToggleLike={handleToggleLike}
              />
            ))}
          </div>

          {/* Bottom Overview Stat Band */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 sm:p-5 rounded-2xl bg-[var(--bg-elevated)]/60 border border-[var(--border)] text-center text-xs font-mono">
            <div className="space-y-1">
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">{t('arcade.totalGames')}</span>
              <span className="text-base font-bold text-[var(--text-primary)]">{t('arcade.modesCount')}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Difficulty Engine</span>
              <span className="text-base font-bold text-orange-400">8 Progressive Tiers</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Audio Engine</span>
              <span className="text-base font-bold text-emerald-400">Synthesized Web Audio</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Score Tracking</span>
              <span className="text-base font-bold text-[var(--accent)]">Local Bests Persisted</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
