/**
 * KEYFLOW Saved Texts Modal
 * =========================
 * Quick-access library for saved custom typing texts.
 * Shares the exact same data source with CustomTypingStudio.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Bookmark,
  Search,
  Play,
  Trash2,
  Check,
  Edit2,
  Plus,
} from 'lucide-react';
import { Button } from '../common/Button';
import {
  getSavedCustomTexts,
  updateCustomText,
  deleteCustomText,
} from '../../utils/customTextStorage.js';

export const SavedTextsModal = ({
  isOpen,
  onClose,
  onApplyText,
  onOpenCustomStudio,
  userId = null,
}) => {
  const [texts, setTexts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTexts(getSavedCustomTexts(userId));
    }
  }, [isOpen, userId]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return texts;
    const q = searchQuery.toLowerCase();
    return texts.filter(
      (t) => t.title.toLowerCase().includes(q) || t.text.toLowerCase().includes(q)
    );
  }, [texts, searchQuery]);

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this saved text?')) {
      const remaining = deleteCustomText(id, userId);
      setTexts(remaining);
    }
  };

  const handleUpdate = (id) => {
    if (!editTitle.trim()) {
      setEditingId(null);
      return;
    }
    updateCustomText(id, { title: editTitle }, userId);
    setTexts(getSavedCustomTexts(userId));
    setEditingId(null);
    setEditTitle('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-labelledby="saved-texts-title"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)] bg-[var(--bg-elevated)]">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-[var(--accent)]" />
            <h2 id="saved-texts-title" className="text-sm font-bold font-mono text-[var(--text-primary)]">
              Saved Passages Library
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--accent)]">
              {texts.length} saved
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={Plus}
              onClick={() => {
                onClose();
                onOpenCustomStudio();
              }}
            >
              New Custom Text
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              aria-label="Close saved texts"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-[var(--border)] bg-[var(--bg-surface)]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by title or passage text..."
              className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
        </div>

        {/* Body list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)] font-mono text-xs">
              No saved passages found.
            </div>
          ) : (
            filtered.map((item) => {
              const isEditing = editingId === item.id;
              return (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--accent)]/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="px-2 py-1 rounded bg-[var(--bg-surface)] border border-[var(--border)] text-xs font-mono text-[var(--text-primary)]"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdate(item.id)}
                          className="p-1 text-emerald-400"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-[var(--text-primary)] truncate">
                          {item.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(item.id);
                            setEditTitle(item.title);
                          }}
                          className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        >
                          <Edit2 className="w-3 h-3 inline" />
                        </button>
                      </div>
                    )}
                    <p className="text-[11px] font-mono text-[var(--text-secondary)] line-clamp-1">
                      {item.text}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--text-muted)]">
                      <span>{item.wordCount} words</span>
                      <span>•</span>
                      <span>{item.charCount} chars</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        onApplyText(item.text, item.wordCount);
                        onClose();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] text-[var(--accent-fg)] text-xs font-mono font-bold hover:bg-[var(--accent-hover)] transition-colors cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Start Practice</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-400 transition-colors"
                      title="Delete saved text"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
