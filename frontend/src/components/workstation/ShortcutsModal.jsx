/**
 * KEYFLOW Keyboard Shortcuts Help Panel
 * =====================================
 * Lists all active, working keyboard shortcuts across the workstation.
 */

import React, { useEffect } from 'react';
import { X, Command, Keyboard } from 'lucide-react';

const SHORTCUTS = [
  {
    category: 'Test Execution',
    items: [
      { key: 'Escape', description: 'Quick restart active test / exit Focus Mode' },
      { key: 'Tab + Enter', description: 'Reset test and immediately re-focus typing input' },
    ],
  },
  {
    category: 'Workstation Panels',
    items: [
      { key: 'Alt + C', description: 'Open Custom Typing Studio' },
      { key: 'Alt + F', description: 'Toggle Focus Mode (distraction-free)' },
      { key: 'Alt + H', description: 'Open Practice History' },
      { key: 'Alt + S', description: 'Open Saved Passages library' },
      { key: 'Alt + K', description: 'Open this Keyboard Shortcuts cheat sheet' },
    ],
  },
  {
    category: 'Typing Area Rules',
    items: [
      { key: 'Backspace', description: 'Step back to correct mistakes during test' },
      { key: 'Click Box', description: 'Instantly refocus cursor into the active typing flow' },
    ],
  },
];

export const ShortcutsModal = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-labelledby="shortcuts-title"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)] bg-[var(--bg-elevated)]">
          <div className="flex items-center gap-2">
            <Command className="w-4 h-4 text-[var(--accent)]" />
            <h2 id="shortcuts-title" className="text-sm font-bold font-mono text-[var(--text-primary)]">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            aria-label="Close shortcuts"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto font-mono text-xs">
          {SHORTCUTS.map((section) => (
            <div key={section.category} className="space-y-2">
              <h3 className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
                {section.category}
              </h3>
              <div className="space-y-1.5">
                {section.items.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]"
                  >
                    <span className="text-[var(--text-secondary)]">{item.description}</span>
                    <kbd className="px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border)] text-[11px] font-bold text-[var(--accent)] shadow-xs">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
