/**
 * KEYFLOW Custom Typing Studio
 * ============================
 * Compact, organized custom text studio inspired by professional typing workbench
 * settings groups while adhering strictly to KEYFLOW's native design system and themes.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Sparkles,
  Sliders,
  RotateCcw,
  Play,
  Save,
  Trash2,
  Bookmark,
  Check,
  Undo2,
  FileText,
  Clock,
  Hash,
  Shuffle,
  Repeat,
  Type,
  AlignLeft,
  Quote,
  Search,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../common/Button';
import {
  removeZeroWidth,
  normalizeSmartQuotes,
  normalizeWhitespace,
  normalizeLineBreaks,
  countWords,
  countCharacters,
  generateCustomTypingPrompt,
} from '../../utils/textUtilities.js';
import {
  getSavedCustomTexts,
  saveCustomText,
  updateCustomText,
  deleteCustomText,
} from '../../utils/customTextStorage.js';

export const CustomTypingStudio = ({
  isOpen,
  onClose,
  onApplyCustomText,
  userId = null,
  initialText = '',
}) => {
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'saved'

  // Text state
  const [text, setText] = useState(initialText);
  const [undoHistory, setUndoHistory] = useState([]);
  const [saveTitle, setSaveTitle] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Settings groups
  const [generationMode, setGenerationMode] = useState('simple'); // 'simple' | 'repeat' | 'shuffle' | 'random'
  const [delimiter, setDelimiter] = useState(' '); // ' ' | '|'
  const [limitType, setLimitType] = useState('words'); // 'words' | 'timed' | 'passage'
  const [wordLimit, setWordLimit] = useState(25);
  const [timeLimit, setTimeLimit] = useState(30);
  const [includePunctuation, setIncludePunctuation] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);

  // Saved texts library
  const [savedTexts, setSavedTexts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  // Load saved texts when modal opens
  useEffect(() => {
    if (isOpen) {
      setSavedTexts(getSavedCustomTexts(userId));
    }
  }, [isOpen, userId]);

  // Set initial text if provided
  useEffect(() => {
    if (initialText) {
      setText(initialText);
    }
  }, [initialText]);

  // Escape hotkey to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Live word & char counters
  const charCount = useMemo(() => countCharacters(text), [text]);
  const wordCount = useMemo(() => countWords(text, delimiter), [text, delimiter]);

  // Filtered saved texts
  const filteredSavedTexts = useMemo(() => {
    if (!searchQuery.trim()) return savedTexts;
    const q = searchQuery.toLowerCase();
    return savedTexts.filter(
      (item) => item.title.toLowerCase().includes(q) || item.text.toLowerCase().includes(q)
    );
  }, [savedTexts, searchQuery]);

  // Push to undo history before utility modification
  const applyUtility = (fn, label) => {
    setUndoHistory((prev) => [text, ...prev.slice(0, 4)]);
    const modified = fn(text);
    setText(modified);
    setStatusMessage({ type: 'success', text: `Applied: ${label}` });
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const handleUndo = () => {
    if (undoHistory.length === 0) return;
    const [previous, ...rest] = undoHistory;
    setText(previous);
    setUndoHistory(rest);
    setStatusMessage({ type: 'info', text: 'Undid previous text utility change' });
    setTimeout(() => setStatusMessage(null), 2000);
  };

  // Save text to library
  const handleSaveText = () => {
    if (!text.trim()) {
      setStatusMessage({ type: 'error', text: 'Cannot save empty text.' });
      return;
    }
    try {
      const saved = saveCustomText({
        title: saveTitle.trim() || undefined,
        text,
        userId,
      });
      setSavedTexts(getSavedCustomTexts(userId));
      setSaveTitle('');
      setShowSaveInput(false);
      setStatusMessage({ type: 'success', text: `Saved "${saved.title}" to library!` });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  // Delete saved text
  const handleDeleteSaved = (id) => {
    if (window.confirm('Are you sure you want to delete this saved text?')) {
      const remaining = deleteCustomText(id, userId);
      setSavedTexts(remaining);
      setStatusMessage({ type: 'info', text: 'Saved text deleted.' });
      setTimeout(() => setStatusMessage(null), 2000);
    }
  };

  // Update saved text title
  const handleUpdateTitle = (id) => {
    if (!editTitle.trim()) {
      setEditingId(null);
      return;
    }
    updateCustomText(id, { title: editTitle }, userId);
    setSavedTexts(getSavedCustomTexts(userId));
    setEditingId(null);
    setEditTitle('');
  };

  // Reset settings group
  const handleResetDefaults = () => {
    setGenerationMode('simple');
    setDelimiter(' ');
    setLimitType('words');
    setWordLimit(25);
    setTimeLimit(30);
    setIncludePunctuation(true);
    setIncludeNumbers(true);
    setStatusMessage({ type: 'info', text: 'Settings reset to default.' });
    setTimeout(() => setStatusMessage(null), 2000);
  };

  // Apply to workstation typing test
  const handleApply = () => {
    const raw = text.trim();
    if (!raw && generationMode !== 'random') {
      setStatusMessage({ type: 'error', text: 'Please enter custom text or choose Random mode.' });
      return;
    }

    const prompt = generateCustomTypingPrompt({
      sourceText: raw,
      generationMode,
      delimiter,
      limitType,
      limitValue: limitType === 'words' ? wordLimit : timeLimit,
      includePunctuation,
      includeNumbers,
    });

    if (!prompt.trim()) {
      setStatusMessage({ type: 'error', text: 'Generated prompt was empty. Please check your text settings.' });
      return;
    }

    onApplyCustomText({
      prompt,
      mode: limitType === 'timed' ? 'timed' : limitType === 'words' ? 'words' : 'passage',
      timeLimit: limitType === 'timed' ? timeLimit : 30,
      wordLimit: limitType === 'words' ? wordLimit : countWords(prompt, delimiter),
      isCustom: true,
      customSource: raw,
      customConfig: {
        generationMode,
        delimiter,
        limitType,
        includePunctuation,
        includeNumbers,
      },
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-labelledby="custom-studio-title"
        aria-modal="true"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)] bg-[var(--bg-elevated)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)]">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 id="custom-studio-title" className="text-sm font-bold text-[var(--text-primary)] font-mono tracking-tight flex items-center gap-2">
                <span>Custom Typing Studio</span>
                <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--accent)]">
                  Pro Workbench
                </span>
              </h2>
              <p className="text-[11px] text-[var(--text-muted)] font-mono">
                Craft, transform, and practice custom text passages
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab Switcher */}
            <div className="flex items-center p-0.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)]">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`px-3 py-1 rounded-md text-xs font-mono font-medium transition-colors ${
                  activeTab === 'editor'
                    ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Editor
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('saved')}
                className={`px-3 py-1 rounded-md text-xs font-mono font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === 'saved'
                    ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Bookmark className="w-3 h-3" />
                <span>Saved ({savedTexts.length})</span>
              </button>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors cursor-pointer"
              aria-label="Close custom studio"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Toast Banner */}
        {statusMessage && (
          <div
            className={`px-4 py-2 text-xs font-mono flex items-center justify-between border-b ${
              statusMessage.type === 'error'
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : statusMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-primary)]'
            }`}
          >
            <span>{statusMessage.text}</span>
            <button type="button" onClick={() => setStatusMessage(null)} className="text-current opacity-70 hover:opacity-100">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {activeTab === 'editor' ? (
            <>
              {/* Text Area */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
                  <span>Input Text</span>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-[var(--text-primary)]">{wordCount} words</span>
                    <span>•</span>
                    <span>{charCount} characters</span>
                  </div>
                </div>

                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste or type your custom text here... (code snippets, literature, vocabulary, drills)"
                  rows={5}
                  className="w-full p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none text-sm font-mono text-[var(--text-primary)] placeholder-[var(--text-muted)] resize-y leading-relaxed transition-colors"
                />

                {/* Editor Action Strip */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  {/* Left: Text Utilities */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => applyUtility(removeZeroWidth, 'Zero-width cleaned')}
                      className="px-2 py-1 rounded bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors"
                      title="Remove zero-width spaces, BOM, and hidden characters"
                    >
                      Strip Zero-Width
                    </button>
                    <button
                      type="button"
                      onClick={() => applyUtility(normalizeSmartQuotes, 'Quotes normalized')}
                      className="px-2 py-1 rounded bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors"
                      title="Replace curly quotes and em-dashes with straight ASCII equivalents"
                    >
                      Normalize Quotes
                    </button>
                    <button
                      type="button"
                      onClick={() => applyUtility(normalizeWhitespace, 'Spaces collapsed')}
                      className="px-2 py-1 rounded bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors"
                      title="Collapse multiple consecutive spaces into a single space"
                    >
                      Collapse Spaces
                    </button>
                    <button
                      type="button"
                      onClick={() => applyUtility(normalizeLineBreaks, 'Linebreaks to spaces')}
                      className="px-2 py-1 rounded bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors"
                      title="Convert multi-line text into a single continuous typing stream"
                    >
                      Strip Newlines
                    </button>
                    {undoHistory.length > 0 && (
                      <button
                        type="button"
                        onClick={handleUndo}
                        className="px-2 py-1 rounded bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors flex items-center gap-1"
                        title="Undo text utility changes"
                      >
                        <Undo2 className="w-3 h-3" />
                        <span>Undo</span>
                      </button>
                    )}
                  </div>

                  {/* Right: Clear / Save Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setText('')}
                      disabled={!text}
                      className="px-2.5 py-1 rounded text-xs font-mono text-[var(--text-muted)] hover:text-red-400 disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSaveInput(!showSaveInput)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--bg-elevated)] border border-[var(--border)] text-xs font-mono text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors cursor-pointer"
                    >
                      <Save className="w-3 h-3 text-[var(--accent)]" />
                      <span>Save Passage</span>
                    </button>
                  </div>
                </div>

                {/* Save to library drawer */}
                {showSaveInput && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--accent)]/40 animate-in fade-in duration-100">
                    <input
                      type="text"
                      value={saveTitle}
                      onChange={(e) => setSaveTitle(e.target.value)}
                      placeholder="Title for this text (e.g. Code Sprint, Seneca Quote)"
                      className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                    />
                    <Button variant="primary" size="sm" onClick={handleSaveText}>
                      Save
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setShowSaveInput(false)}>
                      Cancel
                    </Button>
                  </div>
                )}
              </div>

              {/* Reference-Inspired Settings Groups */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                {/* Group 1: Text Generation Mode */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
                      <span>Generation Mode</span>
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase">Behavior</span>
                  </div>

                  <div className="grid grid-cols-4 gap-1 p-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)]">
                    {[
                      { id: 'simple', label: 'Simple', icon: Type },
                      { id: 'repeat', label: 'Repeat', icon: Repeat },
                      { id: 'shuffle', label: 'Shuffle', icon: Shuffle },
                      { id: 'random', label: 'Random', icon: Sparkles },
                    ].map((m) => {
                      const Icon = m.icon;
                      const active = generationMode === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setGenerationMode(m.id)}
                          className={`flex flex-col items-center gap-1 py-1.5 rounded text-[11px] font-mono transition-colors ${
                            active
                              ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-bold'
                              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-[11px] text-[var(--text-muted)] font-mono leading-snug">
                    {generationMode === 'simple' && 'Types the text verbatim exactly as input.'}
                    {generationMode === 'repeat' && 'Repeats the sequence continuously to reach the target word limit.'}
                    {generationMode === 'shuffle' && 'Shuffles the order of eligible words or delimited tokens.'}
                    {generationMode === 'random' && 'Generates randomized words using active vocabulary or word tokens.'}
                  </p>
                </div>

                {/* Group 2: Word Delimiter & Formatting */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <AlignLeft className="w-3.5 h-3.5 text-[var(--accent)]" />
                      <span>Delimiter & Punctuation</span>
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase">Tokens</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)]">
                      <button
                        type="button"
                        onClick={() => setDelimiter(' ')}
                        className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                          delimiter === ' '
                            ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-bold'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        Space (' ')
                      </button>
                      <button
                        type="button"
                        onClick={() => setDelimiter('|')}
                        className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                          delimiter === '|'
                            ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-bold'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        Pipe ('|')
                      </button>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono">
                      <label className="flex items-center gap-1.5 cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                        <input
                          type="checkbox"
                          checked={includePunctuation}
                          onChange={(e) => setIncludePunctuation(e.target.checked)}
                          className="accent-[var(--accent)] rounded"
                        />
                        <span>Punctuation</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                        <input
                          type="checkbox"
                          checked={includeNumbers}
                          onChange={(e) => setIncludeNumbers(e.target.checked)}
                          className="accent-[var(--accent)] rounded"
                        />
                        <span>Numbers</span>
                      </label>
                    </div>
                  </div>

                  <p className="text-[11px] text-[var(--text-muted)] font-mono leading-snug">
                    Choose how words are delimited and whether symbols or digits are included in generated tests.
                  </p>
                </div>

                {/* Group 3: Test Limit & Duration */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
                      <span>Test Limit Type</span>
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase">Countdown</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)]">
                      {[
                        { id: 'words', label: 'Words', icon: Hash },
                        { id: 'timed', label: 'Time', icon: Clock },
                        { id: 'passage', label: 'Full Passage', icon: FileText },
                      ].map((t) => {
                        const Icon = t.icon;
                        const active = limitType === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setLimitType(t.id)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                              active
                                ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-bold'
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                          >
                            <Icon className="w-3 h-3" />
                            <span>{t.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Limit Presets */}
                  {limitType === 'words' && (
                    <div className="flex items-center gap-1.5 pt-1">
                      {[10, 25, 50, 100].map((w) => (
                        <button
                          key={w}
                          type="button"
                          onClick={() => setWordLimit(w)}
                          className={`px-2 py-0.5 rounded text-xs font-mono ${
                            wordLimit === w
                              ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-bold'
                              : 'bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          {w}
                        </button>
                      ))}
                      <div className="flex items-center gap-1 ml-auto">
                        <span className="text-[10px] font-mono text-[var(--text-muted)]">Custom:</span>
                        <input
                          type="number"
                          min="1"
                          max="1000"
                          value={wordLimit}
                          onChange={(e) => setWordLimit(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          className="w-14 px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border)] text-xs font-mono text-[var(--text-primary)]"
                        />
                      </div>
                    </div>
                  )}

                  {limitType === 'timed' && (
                    <div className="flex items-center gap-1.5 pt-1">
                      {[15, 30, 60, 120].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setTimeLimit(s)}
                          className={`px-2 py-0.5 rounded text-xs font-mono ${
                            timeLimit === s
                              ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-bold'
                              : 'bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          {s}s
                        </button>
                      ))}
                      <div className="flex items-center gap-1 ml-auto">
                        <span className="text-[10px] font-mono text-[var(--text-muted)]">Custom:</span>
                        <input
                          type="number"
                          min="5"
                          max="600"
                          value={timeLimit}
                          onChange={(e) => setTimeLimit(Math.max(5, parseInt(e.target.value, 10) || 5))}
                          className="w-14 px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border)] text-xs font-mono text-[var(--text-primary)]"
                        />
                      </div>
                    </div>
                  )}

                  {limitType === 'passage' && (
                    <p className="text-[11px] text-[var(--text-muted)] font-mono">
                      Test completes when entire custom passage has been typed.
                    </p>
                  )}
                </div>

                {/* Group 4: Quick Preview */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono mb-2">
                      <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                        <Quote className="w-3.5 h-3.5 text-[var(--accent)]" />
                        <span>Prompt Preview</span>
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] uppercase">Live Output</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-xs font-mono text-[var(--text-secondary)] max-h-24 overflow-y-auto leading-relaxed">
                      {text.trim()
                        ? generateCustomTypingPrompt({
                            sourceText: text,
                            generationMode,
                            delimiter,
                            limitType,
                            limitValue: limitType === 'words' ? wordLimit : timeLimit,
                            includePunctuation,
                            includeNumbers,
                          }).slice(0, 200) + (text.length > 200 ? '...' : '')
                        : generationMode === 'random'
                        ? 'Random vocabulary words will be drawn at test start...'
                        : 'Enter text above to preview test prompt output.'}
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleResetDefaults}
                      className="text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset Options</span>
                    </button>
                    <span className="text-[10px] font-mono text-[var(--accent)]">
                      Target: {limitType === 'timed' ? `${timeLimit}s` : limitType === 'words' ? `${wordLimit} words` : 'Full Text'}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Saved Texts Library Tab */
            <div className="space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search saved custom texts by title or content..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              {/* List */}
              {filteredSavedTexts.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-[var(--border)] rounded-2xl p-6">
                  <Bookmark className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-mono text-[var(--text-primary)]">No saved texts found.</p>
                  <p className="text-xs font-mono text-[var(--text-muted)] mt-1">
                    Save passages in the Editor tab to build your library.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5 max-h-[55vh] overflow-y-auto pr-1">
                  {filteredSavedTexts.map((item) => {
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
                                onClick={() => handleUpdateTitle(item.id)}
                                className="p-1 text-emerald-400 hover:text-emerald-300"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold font-mono text-[var(--text-primary)] truncate">
                                {item.title}
                              </h4>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingId(item.id);
                                  setEditTitle(item.title);
                                }}
                                className="text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--text-primary)] underline"
                              >
                                Rename
                              </button>
                            </div>
                          )}

                          <p className="text-[11px] font-mono text-[var(--text-secondary)] line-clamp-1">
                            {item.text}
                          </p>

                          <div className="flex items-center gap-3 text-[10px] font-mono text-[var(--text-muted)]">
                            <span>{item.wordCount} words</span>
                            <span>•</span>
                            <span>{item.charCount} chars</span>
                            <span>•</span>
                            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setText(item.text);
                              setActiveTab('editor');
                              setStatusMessage({ type: 'info', text: `Loaded "${item.title}" into editor` });
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setText(item.text);
                              onApplyCustomText({
                                prompt: item.text,
                                mode: 'passage',
                                timeLimit: 30,
                                wordLimit: item.wordCount,
                                isCustom: true,
                                customSource: item.text,
                              });
                              onClose();
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent)] text-[var(--accent-fg)] text-xs font-mono font-bold hover:bg-[var(--accent-hover)] transition-colors cursor-pointer"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Practice</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSaved(item.id)}
                            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete custom text"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border)] bg-[var(--bg-elevated)]">
          <div className="text-[11px] font-mono text-[var(--text-muted)] hidden sm:block">
            {activeTab === 'editor' ? 'Click "Apply to Workstation" to start test' : `${filteredSavedTexts.length} texts in library`}
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            {activeTab === 'editor' && (
              <button
                type="button"
                onClick={handleApply}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--accent-fg)] text-xs font-mono font-bold tracking-wide shadow-md transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Apply to Workstation</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
