/**
 * KEYFLOW Workstation Feature Toolbar
 * ===================================
 * Compact, unified professional control bar for the typing workstation.
 * Engineered with a strict maximum of TWO rows to guarantee zero multi-row spillage.
 * 
 * Row 1: Core Practice Mode Selectors & active mode parameter selectors.
 * Row 2: Dynamic Custom generation mode trigger, Saved, History, Focus, and practice tooling.
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
  Type,
  Eye,
  EyeOff,
  Shuffle,
  Repeat,
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
  fontSize = 'normal',
  setFontSize,
  showLiveWpm = true,
  setShowLiveWpm,
  customGenerationMode = 'simple',
  onTriggerCustomMode,
  t,
}) => {
  const TIME_OPTIONS = [15, 30, 60, 120];
  const WORD_OPTIONS = [10, 25, 50, 100];

  // Derive active dynamic generation mode label and icon
  const getModeDetails = (m) => {
    switch (m) {
      case 'repeat':
        return { label: 'Repeat', icon: Repeat, color: 'text-sky-400' };
      case 'shuffle':
        return { label: 'Shuffle', icon: Shuffle, color: 'text-amber-400' };
      case 'random':
        return { label: 'Random', icon: Sparkles, color: 'text-emerald-400' };
      case 'simple':
      default:
        return { label: 'Simple', icon: Sliders, color: 'text-[var(--accent)]' };
    }
  };

  const currentModeInfo = getModeDetails(customGenerationMode);
  const ModeIcon = currentModeInfo.icon;

  return (
    <div className="card-panel p-2 sm:p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono w-full select-none">
      {/* ─────────────────────────────────────────────────────────────
          ROW 1: Core Practice Mode Selectors & Mode Parameters
          ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-none pb-0.5 w-full">
        {/* Left: Mode Tabs Cluster */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] shrink-0">
            {/* Timed Mode */}
            <button
              type="button"
              onClick={() => setMode('timed')}
              className={`flex items-center gap-1.5 px-2.5 h-7 rounded-lg font-medium transition-all cursor-pointer ${
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
              className={`flex items-center gap-1.5 px-2.5 h-7 rounded-lg font-medium transition-all cursor-pointer ${
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
              className={`flex items-center gap-1.5 px-2.5 h-7 rounded-lg font-medium transition-all cursor-pointer ${
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
              className={`flex items-center gap-1.5 px-2.5 h-7 rounded-lg font-medium transition-all cursor-pointer ${
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

          {/* Custom Studio Trigger Button */}
          <button
            type="button"
            onClick={onOpenCustomStudio}
            className={`h-8 flex items-center gap-1.5 px-2.5 rounded-xl border font-medium transition-all cursor-pointer shrink-0 ${
              customActive
                ? 'bg-[var(--accent)] text-[var(--accent-fg)] border-[var(--accent)] font-bold shadow-xs'
                : 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]'
            }`}
            title={customTitle ? `Custom Studio: ${customTitle} (Alt+C)` : "Open Custom Typing Studio (Alt+C)"}
            aria-label="Open Custom Typing Studio"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Custom</span>
            {customActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse ml-0.5" />
            )}
          </button>

          {/* Competition Arena Trigger Button */}
          <button
            type="button"
            onClick={onOpenCompetitions}
            className={`h-8 flex items-center gap-1.5 px-2.5 rounded-xl border font-medium transition-all cursor-pointer shrink-0 ${
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
        </div>

        {/* Right: Active Mode Sub-Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {mode === 'timed' && !customActive && !activeCompetition && (
            <div className="flex items-center gap-1 bg-[var(--bg-elevated)] p-1 rounded-xl border border-[var(--border)] h-8">
              {TIME_OPTIONS.map((timeVal) => (
                <button
                  key={timeVal}
                  type="button"
                  onClick={() => setTimeLimit(timeVal)}
                  className={`h-6 px-2 rounded text-xs transition-colors cursor-pointer flex items-center justify-center ${
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
            <div className="flex items-center gap-1 bg-[var(--bg-elevated)] p-1 rounded-xl border border-[var(--border)] h-8">
              {WORD_OPTIONS.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setWordLimit(w)}
                  className={`h-6 px-2 rounded text-xs transition-colors cursor-pointer flex items-center justify-center ${
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
              className="h-8 px-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--text-primary)] cursor-pointer focus:outline-none focus:border-[var(--accent)] max-w-[170px] truncate"
            >
              {passages.map((p, idx) => (
                <option key={p.id} value={idx}>
                  {p.title}
                </option>
              ))}
            </select>
          )}

          {customActive && (
            <div className="h-8 flex items-center gap-1.5 px-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--accent)]/40 text-[11px] text-[var(--accent)]">
              <span>Custom Active</span>
              <button
                type="button"
                onClick={onOpenCustomStudio}
                className="underline hover:text-[var(--text-primary)] cursor-pointer font-bold"
              >
                Edit
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          ROW 2: Dynamic Custom Mode, Library, History & Practice Tools
          (Guarantees exactly 2 rows total)
          ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-none pt-1.5 border-t border-[var(--border)]/40 w-full">
        {/* Left Cluster: Dynamic Generation Mode Action + Saved + History */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Dynamic Custom Generation Mode Action Button (PHASE 11) */}
          <button
            type="button"
            onClick={onTriggerCustomMode}
            className="h-8 px-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:bg-[var(--bg-surface)] transition-all cursor-pointer flex items-center gap-1.5 font-bold shadow-xs"
            title={`Generation Mode: ${currentModeInfo.label} (Click to generate and practice)`}
            aria-label={`Generation Mode: ${currentModeInfo.label}`}
          >
            <ModeIcon className={`w-3.5 h-3.5 ${currentModeInfo.color}`} />
            <span>{currentModeInfo.label}</span>
          </button>

          {/* Saved Passages Library Shortcut (PHASE 10) */}
          <button
            type="button"
            onClick={onOpenSavedTexts}
            className="h-8 px-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-all cursor-pointer flex items-center gap-1.5"
            title="Saved Passages Library (Alt+S)"
            aria-label="Saved Passages"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Saved</span>
          </button>

          {/* Practice Session History Shortcut (PHASE 9) */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="h-8 px-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-all cursor-pointer flex items-center gap-1.5"
            title="Practice Session History (Alt+H)"
            aria-label="Practice History"
          >
            <History className="w-3.5 h-3.5" />
            <span>History</span>
          </button>

          {/* Focus Mode Toggle */}
          <button
            type="button"
            onClick={toggleFocusMode}
            className={`h-8 px-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
              focusMode
                ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)] font-bold shadow-xs'
                : 'border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]'
            }`}
            title="Focus Mode (Alt+F)"
            aria-label="Focus Mode"
            aria-pressed={focusMode}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Focus</span>
          </button>
        </div>

        {/* Right Cluster: Tooling, Guides, Audio, Reset */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Live Speed Toggle (Speed On / Off) */}
          {setShowLiveWpm && (
            <button
              type="button"
              onClick={() => setShowLiveWpm((v) => !v)}
              className={`h-8 px-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1 ${
                !showLiveWpm
                  ? 'border-[var(--accent)] bg-[var(--bg-elevated)] text-[var(--accent)] font-semibold shadow-xs'
                  : 'border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)]'
              }`}
              title={showLiveWpm ? 'Live WPM visible (Click for anxiety-free hidden speed mode)' : 'Live WPM hidden (Anxiety-free mode active)'}
            >
              {showLiveWpm ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-[var(--accent)]" />}
              <span>{showLiveWpm ? 'Speed On' : 'Speed Off'}</span>
            </button>
          )}

          {/* Font Size Selector (Compact / Normal / Large) */}
          {setFontSize && (
            <button
              type="button"
              onClick={() => {
                const next = fontSize === 'normal' ? 'large' : fontSize === 'large' ? 'compact' : 'normal';
                setFontSize(next);
              }}
              className="h-8 px-2 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-all cursor-pointer flex items-center gap-1"
              title={`Font Size: ${fontSize.toUpperCase()} (Click to toggle)`}
            >
              <Type className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span className="capitalize">{fontSize}</span>
            </button>
          )}

          {/* Keyboard Guide Toggle */}
          <button
            type="button"
            onClick={toggleKeyboardGuide}
            className={`h-8 px-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1 ${
              keyboardGuideOn
                ? 'border-[var(--accent)] bg-[var(--bg-elevated)] text-[var(--accent)] font-semibold shadow-xs'
                : 'border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            title="Toggle Visual Keyboard Guide"
            aria-pressed={keyboardGuideOn}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>{keyboardGuideOn ? 'Keys On' : 'Keys Off'}</span>
          </button>

          {/* Hand Guide Toggle */}
          <button
            type="button"
            onClick={toggleHandGuide}
            className={`h-8 px-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1 ${
              handGuideOn
                ? 'border-[var(--accent)] bg-[var(--bg-elevated)] text-[var(--accent)] font-semibold shadow-xs'
                : 'border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            title="Toggle 3D/Anatomical Hand Guide"
            aria-pressed={handGuideOn}
          >
            <HandMetal className="w-3.5 h-3.5" />
            <span>{handGuideOn ? 'Hands On' : 'Hands Off'}</span>
          </button>

          {/* Keyboard Sound Selector */}
          <SoundSelector variant="toolbar" />

          {/* Shortcuts Help */}
          <button
            type="button"
            onClick={onOpenShortcuts}
            className="h-8 w-8 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-all cursor-pointer flex items-center justify-center shrink-0"
            title="Keyboard Shortcuts (Alt+K)"
            aria-label="Keyboard Shortcuts"
          >
            <Command className="w-3.5 h-3.5" />
          </button>

          {/* Reset Test */}
          <Button variant="outline" size="sm" icon={RotateCcw} onClick={onResetTest} title="Reset Test (Esc)">
            <span>Reset</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
