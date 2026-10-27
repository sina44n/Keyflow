import React from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Gamepad2 } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { ArcadeHub } from '../components/arcade/ArcadeHub';

export const ArcadePage = () => {
  const { gameId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useI18n();

  // Support both /arcade/:gameId and /arcade?game=:gameId
  const activeGameId = gameId || searchParams.get('game') || null;

  const handleGameChange = (newGameId) => {
    if (newGameId) {
      navigate(`/arcade/${newGameId}`, { replace: false });
    } else {
      navigate('/arcade', { replace: false });
    }
  };

  return (
    <main className="min-h-screen py-10 sm:py-16 bg-[var(--bg-main)]">
      <div className="container-app space-y-10 sm:space-y-12">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--accent)] font-mono">
            <Gamepad2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t('arcade.badge')}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[var(--text-primary)] tracking-tight">
            {t('arcade.title')}
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto">
            {t('arcade.subtitle')}
          </p>
        </div>

        {/* Arcade Experience Hub */}
        <ArcadeHub initialGameId={activeGameId} onGameChange={handleGameChange} />
      </div>
    </main>
  );
};
