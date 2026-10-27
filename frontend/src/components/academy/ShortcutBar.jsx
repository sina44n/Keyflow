import React, { useEffect } from 'react';
import { Keyboard } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';

/**
 * ShortcutBar
 * =========================================================================
 * Fixed bottom bar with keyboard hints & real system status indicator (Reference B).
 * Features live keyboard event listeners for Tab+Enter, R, Esc.
 */
export const ShortcutBar = ({
  onNextLesson,
  onRestart,
  onBack,
  systemStatus = 'System Online',
  isOnline = true,
}) => {
  const { t } = useI18n();
  useEffect(() => {
    let tabPressed = false;
    let tabTimeout = null;

    const handleKeyDown = (e) => {
      // Ignore if user is currently typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return;

      if (e.key === 'Tab') {
        tabPressed = true;
        clearTimeout(tabTimeout);
        tabTimeout = setTimeout(() => {
          tabPressed = false;
        }, 1200);
      } else if (e.key === 'Enter') {
        if (tabPressed && onNextLesson) {
          e.preventDefault();
          onNextLesson();
          tabPressed = false;
        }
      } else if (e.key === 'r' || e.key === 'R') {
        if (!e.ctrlKey && !e.metaKey && onRestart) {
          e.preventDefault();
          onRestart();
        }
      } else if (e.key === 'Escape') {
        if (onBack) {
          e.preventDefault();
          onBack();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(tabTimeout);
    };
  }, [onNextLesson, onRestart, onBack]);

  return (
    <footer
      className="sticky bottom-0 z-30 w-full backdrop-blur-md bg-[color-mix(in_srgb,var(--bg-main)_90%,transparent)] border-t border-[var(--border)] py-2 px-4 sm:px-8 transition-colors"
      aria-label="Keyboard Shortcuts and System Status"
    >
      <div className="container-app flex items-center justify-between gap-4 text-xs font-mono">
        {/* Left: Keyboard Shortcuts */}
        <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
          <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
            <Keyboard className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            <span className="hidden sm:inline font-semibold">{t('footer.shortcuts')}</span>
          </div>

          {/* Next Lesson */}
          <button
            type="button"
            onClick={onNextLesson}
            className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer group"
          >
            <span className="px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border)] text-[10px] text-[var(--text-primary)] group-hover:border-[var(--accent)]">
              Tab
            </span>
            <span className="text-[var(--text-muted)]">→</span>
            <span className="group-hover:text-[var(--accent)]">{t('lesson.nextLesson')}</span>
          </button>

          {/* Restart */}
          <button
            type="button"
            onClick={onRestart}
            className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer group"
          >
            <span className="px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border)] text-[10px] text-[var(--text-primary)] group-hover:border-[var(--accent)]">
              R
            </span>
            <span className="group-hover:text-[var(--accent)]">{t('common.restart')}</span>
          </button>

          {/* Back */}
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer group"
          >
            <span className="px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border)] text-[10px] text-[var(--text-primary)] group-hover:border-[var(--accent)]">
              Esc
            </span>
            <span className="group-hover:text-[var(--accent)]">{t('common.back')}</span>
          </button>
        </div>

        {/* Right: Online Status */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`w-2 h-2 rounded-full ${
              isOnline ? 'bg-[var(--ui-success)] shadow-[0_0_8px_var(--ui-success)] animate-pulse' : 'bg-[var(--accent)]'
            }`}
          />
          <span className="text-[var(--text-secondary)] text-[11px] font-medium hidden xs:inline">
            {systemStatus}
          </span>
        </div>
      </div>
    </footer>
  );
};
