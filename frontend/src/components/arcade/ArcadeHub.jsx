import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { ARCADE_GAMES, ARCADE_CATEGORIES } from '../../data/arcadeGamesData';
import { getArcadeRecords } from '../../utils/arcadeStorage';
import { ArcadeGameCard } from './ArcadeGameCard';
import { KeyCascadeGame } from './games/KeyCascadeGame';
import { SpeedSprintGame } from './games/SpeedSprintGame';
import { WordHunterGame } from './games/WordHunterGame';
import { KeyNinjaGame } from './games/KeyNinjaGame';
import { WordRunnerGame } from './games/WordRunnerGame';
import { TypingMemoryGame } from './games/TypingMemoryGame';
import { BossBattleGame } from './games/BossBattleGame';

export const ArcadeHub = ({ initialGameId = null, _isEmbedded = false }) => {
  const [selectedGameId, setSelectedGameId] = useState(initialGameId);
  const [activeCategory, setActiveCategory] = useState('all');
  const [records, setRecords] = useState(getArcadeRecords);
  const [soundOn, setSoundOn] = useState(true);

  const arenaRef = useRef(null);

  // Sync personal best records across tab events
  useEffect(() => {
    const handleRecordUpdate = () => {
      setRecords(getArcadeRecords());
    };
    window.addEventListener('keyflow-arcade-record-updated', handleRecordUpdate);
    return () => window.removeEventListener('keyflow-arcade-record-updated', handleRecordUpdate);
  }, []);

  // When a game is chosen, smoothly scroll to the game arena
  const handlePlayGame = (gameId) => {
    setSelectedGameId(gameId);
    setTimeout(() => {
      if (arenaRef.current) {
        arenaRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  // Filter games
  const filteredGames = ARCADE_GAMES.filter((game) => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'reaction') return ['cascade', 'sprint', 'ninja'].includes(game.id);
    if (activeCategory === 'precision') return ['hunter', 'memory'].includes(game.id);
    if (activeCategory === 'action') return ['runner', 'boss'].includes(game.id);
    return true;
  });

  return (
    <div className="space-y-10" ref={arenaRef}>
      {/* If a game is actively running, render its dedicated interface */}
      {selectedGameId ? (
        <div className="space-y-4 animate-in fade-in duration-200">
          {selectedGameId === 'cascade' && (
            <KeyCascadeGame
              onExit={() => setSelectedGameId(null)}
              soundEnabled={soundOn}
            />
          )}
          {selectedGameId === 'sprint' && (
            <SpeedSprintGame
              onExit={() => setSelectedGameId(null)}
              soundEnabled={soundOn}
            />
          )}
          {selectedGameId === 'hunter' && (
            <WordHunterGame
              onExit={() => setSelectedGameId(null)}
              soundEnabled={soundOn}
            />
          )}
          {selectedGameId === 'ninja' && (
            <KeyNinjaGame
              onExit={() => setSelectedGameId(null)}
              soundEnabled={soundOn}
            />
          )}
          {selectedGameId === 'runner' && (
            <WordRunnerGame
              onExit={() => setSelectedGameId(null)}
              soundEnabled={soundOn}
            />
          )}
          {selectedGameId === 'memory' && (
            <TypingMemoryGame
              onExit={() => setSelectedGameId(null)}
              soundEnabled={soundOn}
            />
          )}
          {selectedGameId === 'boss' && (
            <BossBattleGame
              onExit={() => setSelectedGameId(null)}
              soundEnabled={soundOn}
            />
          )}
        </div>
      ) : (
        /* Discovery Hub View */
        <div className="space-y-8">
          {/* Controls Bar: Categories & Sound Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Arcade categories">
              {ARCADE_CATEGORIES.map((cat) => (
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
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Sound Toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSoundOn((s) => !s)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                title={soundOn ? 'Arcade sound effects enabled' : 'Arcade sound effects muted'}
                aria-label="Toggle arcade audio"
              >
                {soundOn ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>SFX: On</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <span>SFX: Muted</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 7 Game Cards Responsive Grid (3 cols desktop, 2 cols tablet, 1 col mobile) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {filteredGames.map((game) => (
              <ArcadeGameCard
                key={game.id}
                game={game}
                record={records[game.id]}
                onPlay={handlePlayGame}
              />
            ))}
          </div>

          {/* Bottom Overview Stat Band */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-[var(--bg-elevated)]/60 border border-[var(--border)] text-center text-xs font-mono">
            <div className="space-y-1">
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Total Games</span>
              <span className="text-base font-bold text-[var(--text-primary)]">7 Playable Modes</span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">Difficulty Engine</span>
              <span className="text-base font-bold text-orange-400">6 Progressive Tiers</span>
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
