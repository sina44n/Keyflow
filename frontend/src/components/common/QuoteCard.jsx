/**
 * KEYFLOW Quote Card Component
 * =============================
 * Displays the user's personalized 12-hour rotating quote or public quote.
 * Fetches from /api/quotes/current/?lang= with automatic rotation tracking
 * and full localization support across all 17 languages.
 */

import React, { useState, useEffect } from 'react';
import { quotesAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n/I18nContext';
import { Quote as QuoteIcon, Sparkles, RefreshCw, Clock } from 'lucide-react';

export const QuoteCard = ({ className = '' }) => {
  const { isAuthenticated } = useAuth();
  const { language, t } = useI18n();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rotating, setRotating] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchQuote = async () => {
      try {
        const res = await quotesAPI.getCurrent(language);
        if (mounted) {
          setQuote(res.data);
        }
      } catch {
        // Fallback if offline
        if (mounted) {
          setQuote({
            text: 'Precision comes before speed. Type with intention, and velocity will follow.',
            author: 'KEYFLOW',
            category: 'typing',
            is_personalized: false,
            hours_remaining: 12.0,
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchQuote();
    return () => { mounted = false; };
  }, [isAuthenticated, language]);

  const handleRotate = async () => {
    if (!isAuthenticated || rotating) return;
    setRotating(true);
    try {
      const res = await quotesAPI.rotate(language);
      setQuote(res.data);
    } catch {
      // Ignore error
    } finally {
      setRotating(false);
    }
  };

  if (loading && !quote) {
    return (
      <div className={`p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] animate-pulse ${className}`}>
        <div className="h-4 bg-[var(--border)] rounded w-3/4 mb-3" />
        <div className="h-3 bg-[var(--border)] rounded w-1/4" />
      </div>
    );
  }

  if (!quote) return null;

  return (
    <div className={`relative p-6 sm:p-7 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-lg overflow-hidden transition-all duration-300 hover:border-[var(--accent)] ${className}`}>
      {/* Background quotation watermark */}
      <QuoteIcon className="absolute -bottom-4 -right-4 w-28 h-28 text-[var(--accent)] opacity-5 pointer-events-none" />

      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
          </div>
          <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-[var(--accent)]">
            {quote.is_personalized
              ? t('quotes.personalizedDailyFocus', 'Personalized Daily Focus')
              : t('quotes.dailyFocus', 'Daily Focus')}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono uppercase bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)]">
            {t(`quotes.category.${quote.category}`, quote.category)}
          </span>
        </div>

        {isAuthenticated && (
          <button
            type="button"
            onClick={handleRotate}
            disabled={rotating}
            className="flex items-center gap-1 text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1 rounded hover:bg-[var(--bg-elevated)] cursor-pointer"
            title={t('quotes.rotate', 'Rotate to new quote')}
          >
            <RefreshCw className={`w-3 h-3 ${rotating ? 'animate-spin' : ''}`} />
            <span>{t('quotes.rotate', 'Rotate')}</span>
          </button>
        )}
      </div>

      <p className="text-sm sm:text-base font-serif italic text-[var(--text-primary)] leading-relaxed relative z-10">
        “{quote.text}”
      </p>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
        <span className="font-mono font-semibold text-[var(--text-secondary)]">
          — {quote.author}
        </span>

        {quote.hours_remaining !== undefined && (
          <div className="flex items-center gap-1 font-mono text-[10px] text-[var(--text-muted)]">
            <Clock className="w-3 h-3" />
            <span>{t('quotes.rotatesIn', { hours: quote.hours_remaining }, `Rotates in ~${quote.hours_remaining}h`)}</span>
          </div>
        )}
      </div>
    </div>
  );
};
