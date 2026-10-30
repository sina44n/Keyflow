import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Volume2, VolumeX, Sliders } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { ARCADE_GAMES, ARCADE_CATEGORIES } from '../../data/arcadeGamesData';
import { getArcadeRecords } from '../../utils/arcadeStorage';
import { ArcadeGameCard } from './ArcadeGameCard';
import { ArcadeErrorBoundary } from './ArcadeErrorBoundary';
import { ArcadeGameLoadingScreen } from './performance/ArcadeGameLoadingScreen';
import { GlobalGameSettingsModal } from './performance/GlobalGameSettingsModal';
import { PerformanceTelemetryHUD } from './performance/PerformanceTelemetryHUD';
import {
  GlobalGameManager,
  getStoredGraphicsSettings,
} from '../../utils/performance/GlobalGameManager';
import {
  fetchArcadeStats,
  toggleGameLike,
  recordGamePlaySession,
  getCachedArcadeStats,
} from '../../utils/arcadeStatsService';

// Lazy-loaded Game Modules — Guarantees ZERO heavy engine bundles loaded during website/gallery browsing
const KeyCascadeGame = React.lazy(() =>
  import('./games/KeyCascadeGame').then((m) => ({ default: m.KeyCascadeGame }))
);
const SpeedSprintGame = React.lazy(() =>
  import('./games/SpeedSprintGame').then((m) => ({ default: m.SpeedSprintGame }))
);
const WordHunterGame = React.lazy(() =>
  import('./games/WordHunterGame').then((m) => ({ default: m.WordHunterGame }))
);
const KeyNinjaGame = React.lazy(() =>
  import('./games/KeyNinjaGame').then((m) => ({ default: m.KeyNinjaGame }))
);
const WordRunnerGame = React.lazy(() =>
  import('./games/WordRunnerGame').then((m) => ({ default: m.WordRunnerGame }))
);
const TypingMemoryGame = React.lazy(() =>
  import('./games/TypingMemoryGame').then((m) => ({ default: m.TypingMemoryGame }))
);
const BossBattleGame = React.lazy(() =>
  import('./games/BossBattleGame').then((m) => ({ default: m.BossBattleGame }))
);
const NitroRacingGame = React.lazy(() =>
  import('./games/NitroRacingGame').then((m) => ({ default: m.NitroRacingGame }))
);

export const ArcadeHub = ({ initialGameId = null, onGameChange = null, isEmbedded = false }) => {
  const { t } = useI18n();
  const [selectedGameId, setSelectedGameId] = useState(initialGameId);
  const [activeCategory, setActiveCategory] = useState('all');
  const [records, setRecords] = useState(getArcadeRecords);
  const [stats, setStats] = useState(getCachedArcadeStats);
  const [soundOn, setSoundOn] = useState(true);
  const [isLaunching, setIsLaunching] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [graphicsSettings, setGraphicsSettings] = useState(getStoredGraphicsSettings);

  const navigate = useNavigate();
  const arenaRef = useRef(null);

  // Sync internal selected game if parent/route updates initialGameId
  const [prevInitialId, setPrevInitialId] = useState(initialGameId);
  if (initialGameId !== prevInitialId) {
    setPrevInitialId(initialGameId);
    setSelectedGameId(initialGameId);
    if (initialGameId) {
      GlobalGameManager.startGameSession(initialGameId);
    }
  }

  // Sync settings when changed in modal
  useEffect(() => {
    const handleSettingsChange = (e) => {
      if (e.detail) {
        setGraphicsSettings(e.detail);
      }
    };
    window.addEventListener('keyflow-graphics-profile-changed', handleSettingsChange);
    return () => window.removeEventListener('keyflow-graphics-profile-changed', handleSettingsChange);
  }, []);

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

  // When a game is chosen, launch reliably with session isolation and scroll
  const handlePlayGame = (gameId) => {
    if (isLaunching) return;
    setIsLaunching(true);

    // Record unique play session idempotently
    recordGamePlaySession(gameId);

    // Initialize global performance session
    GlobalGameManager.startGameSession(gameId);

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
    GlobalGameManager.endGameSession();
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

  const activeGameMeta = ARCADE_GAMES.find((g) => g.id === selectedGameId);
  const isValidGame = Boolean(activeGameMeta);

  return (
    <div className="space-y-10" ref={arenaRef}>
      {/* If a game is actively running, render its dedicated interface inside an Error Boundary and Suspense */}
      {selectedGameId && isValidGame ? (
        <ArcadeErrorBoundary onExit={handleExitGame}>
          <Suspense
            fallback={
              <ArcadeGameLoadingScreen
                onCancel={handleExitGame}
                gameTitle={activeGameMeta.title}
              />
            }
          >
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
          </Suspense>
        </ArcadeErrorBoundary>
      ) : (
        /* Discovery Hub View */
        <div className="space-y-8">
          {/* Controls Bar: Categories & Global Settings / Sound Toggle */}
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

            {/* Performance Settings & Sound Toggles */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                title="Open Game Graphics & Performance Settings"
                aria-label="Game Graphics and Performance Settings"
              >
                <Sliders className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span className="hidden sm:inline">Settings</span>
              </button>

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
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Performance System</span>
              <span className="text-base font-bold text-emerald-400">Adaptive WebGL / 2D</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Score Tracking</span>
              <span className="text-base font-bold text-[var(--accent)]">Local Bests Persisted</span>
            </div>
          </div>
        </div>
      )}

      {/* Global Performance & Graphics Settings Modal */}
      <GlobalGameSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Live Performance Telemetry HUD */}
      <PerformanceTelemetryHUD
        isVisible={Boolean(graphicsSettings.showPerfHud && selectedGameId)}
        gameId={selectedGameId}
      />
    </div>
  );
};
