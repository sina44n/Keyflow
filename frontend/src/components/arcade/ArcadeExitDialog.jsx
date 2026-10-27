import React from 'react';
import { AlertTriangle, Play, ArrowLeft } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { Button } from '../common/Button';

export const ArcadeExitDialog = ({ isOpen, onCancel, onConfirm }) => {
  const { t } = useI18n();
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="abandon-run-title"
    >
      <div className="w-full max-w-sm rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] p-5 sm:p-6 shadow-2xl space-y-4 text-center animate-in zoom-in-95 duration-150">
        <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-inner">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div className="space-y-1.5">
          <h3 id="abandon-run-title" className="text-lg font-bold text-[var(--text-primary)]">
            {t('arcade.exit.title')}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            {t('arcade.exit.warning')}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            icon={Play}
            onClick={onCancel}
          >
            {t('arcade.exit.cancel')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={ArrowLeft}
            onClick={onConfirm}
            className="bg-rose-600 hover:bg-rose-700 text-white"
          >
            {t('arcade.exit.confirm')}
          </Button>
        </div>
      </div>
    </div>
  );
};
