import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nContext';
import { Button } from '../common/Button';
import { ArrowRight, Keyboard } from 'lucide-react';

export const CTASection = () => {
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <section className="section-spacing border-t border-[var(--border)] relative overflow-hidden bg-[var(--bg-main)]">
      {/* Background glow */}
      <div
        className="absolute bottom-0 right-1/3 w-[450px] h-[250px] rounded-full blur-[140px] pointer-events-none opacity-15"
        style={{ backgroundColor: 'var(--accent)' }}
        aria-hidden="true"
      />

      <div className="container-app relative z-10">
        <div className="card-panel p-6 sm:p-10 md:p-12 text-center space-y-6 shadow-2xl max-w-4xl mx-auto">
          <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--accent)] flex items-center justify-center mx-auto shadow-xs">
            <Keyboard className="w-5 h-5" aria-hidden="true" />
          </div>

          <div className="space-y-3 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight leading-tight">
              {t('cta.title')}<br />{t('cta.titleLine2')}
            </h2>

            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              {t('cta.subtitle')}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
              icon={ArrowRight}
              onClick={() => {
                const el = document.getElementById('sandbox');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              {t('cta.startPractice')}
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate('/academy')}
            >
              {t('cta.exploreAcademy')}
            </Button>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-[11px] font-mono text-[var(--text-muted)]">
            <span>{t('cta.free')}</span>
            <span>•</span>
            <span>{t('cta.noLogin')}</span>
            <span>•</span>
            <span>{t('cta.apiReady')}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
