import React from 'react';
import { Compass, ShieldCheck, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { unlockStageManual } from '../../utils/lessonProgress';

/**
 * ExploreStageModal — Path 03: Manual Self-Paced Access Confirmation Modal
 * 
 * Accessible dialog conforming to KEYFLOW Burgundy & Cream design system.
 * Unlocks all 700 levels of a stage for exploratory practice without fabricating
 * any lesson completions, attempts, or stars.
 */
export const ExploreStageModal = ({
  isOpen,
  stageMeta,
  onClose,
  onConfirmed,
}) => {
  if (!isOpen || !stageMeta) return null;

  const handleConfirm = async () => {
    try {
      // Local unlock
      unlockStageManual(stageMeta.stageId);

      // Backend sync if user has token
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('keyflow_auth_token') : null;
      if (token) {
        try {
          await fetch(`/api/lessons/curriculum/stages/${stageMeta.stageId}/unlock/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });
        } catch {
          // Offline / background graceful fallback
        }
      }

      onConfirmed(stageMeta.stageId);
    } catch (err) {
      console.warn('Failed to unlock stage manually:', err);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="explore-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Stage Identity */}
        <div className="flex items-start gap-3.5 pr-8">
          <div className="w-11 h-11 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 flex items-center justify-center shrink-0">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--accent)] font-bold">
              Path 03 · Manual Self-Paced Access
            </div>
            <h2 id="explore-modal-title" className="text-xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Unlock Stage {stageMeta.stageId}: {stageMeta.title}
            </h2>
          </div>
        </div>

        {/* Informational Body */}
        <div className="space-y-3 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
          <p>
            You are choosing to explore all <span className="font-bold text-[var(--text-primary)]">700 levels</span> (70 units) of this stage independently.
          </p>

          <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
              <ShieldCheck className="w-4 h-4 text-[#34A853]" />
              <span>Zero False Completion Guarantee</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-normal">
              Unlocking this stage will make all lessons playable immediately. It will <strong>NOT</strong> create fake completion records, fabricate attempts, or award false stars. Your authentic achievements remain 100% genuine.
            </p>
          </div>

          <ul className="space-y-1.5 text-xs text-[var(--text-muted)]">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
              <span>Full access to 70 units from tactile drills to capstones</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
              <span>Free navigation across all 700 levels in this stage</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
              <span>Earn authentic 1 to 3 stars as you actually pass each lesson</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-mono font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-[var(--accent-fg)] text-xs font-mono font-bold shadow-md hover:opacity-90 active:scale-98 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>Unlock All 700 Levels</span>
          </button>
        </div>
      </div>
    </div>
  );
};
