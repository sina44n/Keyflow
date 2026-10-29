/**
 * KEYFLOW Workstation Feature Toolbar
 * ===================================
 * Compact, unified professional control bar for the typing workstation.
 * Houses practice mode selectors, custom studio trigger, guides, sound,
 * focus mode, history, and typing competitions.
 */

import React from 'react';
import {
  Clock,
  Hash,
  FileText,
  Sliders,
  Target,
  Trophy,
  Bookmark,
  History,
  Maximize2,
  Command,
  RotateCcw,
  Keyboard,
  HandMetal,
  Sparkles,
} from 'lucide-react';
import { SoundSelector } from '../common/SoundSelector';
import { Button } from '../common/Button';

export const WorkstationToolbar = ({
  mode,
  setMode,
  timeLimit,
  setTimeLimit,
  wordLimit,
  setWordLimit,
  selectedPassageIndex,
  setSelectedPassageIndex,
  passages,
  customActive,
  customTitle,
  activeCompetition,
  keyboardGuideOn,
  toggleKeyboardGuide,
  handGuideOn,
  toggleHandGuide,
  focusMode,
  toggleFocusMode,
  onOpenCustomStudio,
  onOpenSavedTexts,
  onOpenHistory,
  onOpenShortcuts,
  onOpenCompetitions,
  onResetTest,
  t,
}) => {
  const TIME_OPTIONS = [15, 30, 60, 120];
  const WORD_OPTIONS = [10, 25, 50, 100];

  return (
    <div className="card-panel p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
      {/* Left Cluster: Practice Mode Selectors */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {/* Core Modes */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
          {/* Timed Mode */}
          <button
            type="button"
            onClick={() => setMode('timed')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              mode === 'timed' && !customActive && !activeCompetition
                ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-bold shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title="Time Trial Mode"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Time</span>
          </button>

          {/* Words Mode */}
          <button
            type="button"
            onClick={() => setMode('words')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              mode === 'words' && !customActive && !activeCompetition
                ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-bold shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title="Word Sprint Mode"
          >
            <Hash className="w-3.5 h-3.5" />
            <span>Words</span>
          </button>

          {/* Passages Mode */}
          <button
            type="button"
            onClick={() => setMode('passage')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              mode === 'passage' && !customActive && !activeCompetition
                ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-bold shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title="Curated Literature & Technical Passages"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Passage</span>
          </button>

          {/* Accuracy Practice Mode */}
          <button
            type="button"
            onClick={() => setMode('accuracy')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              mode === 'accuracy'
                ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-bold shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title="Accuracy Focus (98%+ Target Precision)"
          >
            <Target className="w-3.5 h-3.5 text-[var(--ui-success)]" />
            <span>Accuracy</span>
          </button>
        </div>

        {/* Custom Studio Trigger Button (PART 3.1) */}
        <button
          type="button"
          onClick={onOpenCustomStudio}
          className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border font-medium transition-all cursor-pointer ${
            customActive
              ? 'bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)] font-bold shadow-xs'
              : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]'
          }`}
          title="Open Custom Typing Studio (Alt+C)"
          aria-label="Open Custom Typing Studio"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Custom</span>
          {customActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse ml-0.5" />
          )}
        </button>

        {/* Competition Arena Trigger Button (PART 5.1) */}
        <button
          type="button"
          onClick={onOpenCompetitions}
          className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border font-medium transition-all cursor-pointer ${
            activeCompetition
              ? 'bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)] font-bold shadow-xs'
              : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]'
          }`}
          title="Typing Competition Arena"
          aria-label="Typing Competition Arena"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>Competition</span>
          {activeCompetition && (
            <span className="text-[10px] bg-black/30 px-1.5 py-0.2 rounded font-bold">
              {activeCompetition.code}
            </span>
          )}
        </button>

        {/* Secondary Sub-Controls depending on active mode */}
        <div className="flex items-center gap-1 pl-1">
          {mode === 'timed' && !customActive && !activeCompetition && (
            <div className="flex items-center gap-1 bg-[var(--bg-elevated)] p-1 rounded-lg border border-[var(--border)]">
              {TIME_OPTIONS.map((timeVal) => (
                <button
                  key={timeVal}
                  type="button"
                  onClick={() => setTimeLimit(timeVal)}
                  className={`px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
                    timeLimit === timeVal
                      ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-bold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {timeVal}s
                </button>
              ))}
            </div>
          )}

          {mode === 'words' && !customActive && !activeCompetition && (
            <div className="flex items-center gap-1 bg-[var(--bg-elevated)] p-1 rounded-lg border border-[var(--border)]">
              {WORD_OPTIONS.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setWordLimit(w)}
                  className={`px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
                    wordLimit === w
                      ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-bold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          )}

          {mode === 'passage' && !customActive && !activeCompetition && (
            <select
              value={selectedPassageIndex}
              onChange={(e) => setSelectedPassageIndex(parseInt(e.target.value, 10))}
              className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--text-primary)] cursor-pointer focus:outline-none focus:border-[var(--accent)] max-w-[160px] truncate"
            >
              {passages.map((p, idx) => (
                <option key={p.id} value={idx}>
                  {p.title}
                </option>
              ))}
            </select>
          )}

          {customActive && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--accent)]/40 text-[11px] text-[var(--accent)]">
              <span>Custom Text Active</span>
              <button
                type="button"
                onClick={onOpenCustomStudio}
                className="underline hover:text-[var(--text-primary)]"
              >
                Configure
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Cluster: Tooling, Guides, Audio, Focus Mode */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {/* Saved Texts Library Shortcut (PART 4.2) */}
        <button
          type="button"
          onClick={onOpenSavedTexts}
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-all cursor-pointer flex items-center gap-1.5"
          title="Saved Passages Library (Alt+S)"
          aria-label="Saved Passages"
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Saved</span>
        </button>

        {/* Practice History Shortcut (PART 4.3) */}
        <button
          type="button"
          onClick={onOpenHistory}
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-all cursor-pointer flex items-center gap-1.5"
          title="Practice Session History (Alt+H)"
          aria-label="Practice History"
        >
          <History className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">History</span>
        </button>

        {/* Focus Mode Toggle (PART 4.4) */}
        <button
          type="button"
          onClick={toggleFocusMode}
          className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
            focusMode
              ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)] font-bold'
              : 'border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]'
          }`}
          title="Focus Mode (Alt+F)"
          aria-label="Focus Mode"
          aria-pressed={focusMode}
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Focus</span>
        </button>

        {/* Keyboard Guide Toggle */}
        <button
          type="button"
          onClick={toggleKeyboardGuide}
          className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
            keyboardGuideOn
              ? 'border-[var(--accent)] bg-[var(--bg-elevated)] text-[var(--accent)] font-semibold shadow-xs'
              : 'border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
          title="Toggle Visual Keyboard Guide"
          aria-pressed={keyboardGuideOn}
        >
          <Keyboard className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">{keyboardGuideOn ? 'Keys On' : 'Keys Off'}</span>
        </button>

        {/* Hand Guide Toggle */}
        <button
          type="button"
          onClick={toggleHandGuide}
          className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
            handGuideOn
              ? 'border-[var(--accent)] bg-[var(--bg-elevated)] text-[var(--accent)] font-semibold shadow-xs'
              : 'border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
          title="Toggle 3D/Anatomical Hand Guide"
          aria-pressed={handGuideOn}
        >
          <HandMetal className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">{handGuideOn ? 'Hands On' : 'Hands Off'}</span>
        </button>

        {/* Keyboard Sound Selector */}
        <SoundSelector variant="toolbar" />

        {/* Shortcuts Help (PART 4.5) */}
        <button
          type="button"
          onClick={onOpenShortcuts}
          className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-all cursor-pointer"
          title="Keyboard Shortcuts (Alt+K)"
          aria-label="Keyboard Shortcuts"
        >
          <Command className="w-3.5 h-3.5" />
        </button>

        {/* Reset Test */}
        <Button variant="outline" size="sm" icon={RotateCcw} onClick={onResetTest} title="Reset Test (Esc)">
          <span className="hidden sm:inline">Reset</span>
        </Button>
      </div>
    </div>
  );
};
