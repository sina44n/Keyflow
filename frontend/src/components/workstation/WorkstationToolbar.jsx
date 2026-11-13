/**
 * KEYFLOW Workstation Feature Toolbar
 * ===================================
 * Compact, unified professional control bar for the typing workstation.
 * Engineered with two polished, aligned rows:
 * 
 * Row 1: Practice Modes (Left) & Duration Selection (Right)
 * Row 2: Session Controls (Left) & Settings / Actions including Pause/Resume (Right)
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
  Pause,
  Play,
} from 'lucide-react';
import { SoundSelector } from '../common/SoundSelector';

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
  isPaused = false,
  isRunning = false,
  sessionState = 'idle',
  onTogglePause,
  t,
  allowedDurations,
  customTextEnabled = true,
  competitionEnabled = true,
}) => {
  const TIME_OPTIONS = allowedDurations && allowedDurations.length ? allowedDurations : [15, 30, 60, 120];
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
    <div className="card-panel p-2 sm:p-2.5 flex flex-col gap-2.5 text-xs font-mono w-full select-none">
      {/* ─────────────────────────────────────────────────────────────
          ROW 1: Practice Modes (Left) & Duration (Right)
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 w-full">
        {/* Left group: Practice Modes (Time, Words, Passage, Accuracy, Custom, Competition) */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] overflow-x-auto scrollbar-none max-w-full shrink-0">
          {/* Time Mode */}
          <button
            type="button"
            onClick={() => setMode('timed')}
            className={`h-7 px-2.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              mode === 'timed' && !customActive && !activeCompetition
                ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-bold shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/50'
            }`}
            title="Time Trial Mode"
            aria-label="Time Mode"
            aria-pressed={mode === 'timed' && !customActive && !activeCompetition}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Time</span>
          </button>

          {/* Words Mode */}
          <button
            type="button"
            onClick={() => setMode('words')}
            className={`h-7 px-2.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              mode === 'words' && !customActive && !activeCompetition
                ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-bold shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/50'
            }`}
            title="Word Sprint Mode"
            aria-label="Words Mode"
            aria-pressed={mode === 'words' && !customActive && !activeCompetition}
          >
            <Hash className="w-3.5 h-3.5" />
            <span>Words</span>
          </button>

          {/* Passage Mode */}
          <button
            type="button"
            onClick={() => setMode('passage')}
            className={`h-7 px-2.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              mode === 'passage' && !customActive && !activeCompetition
                ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-bold shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/50'
            }`}
            title="Curated Literature & Technical Passages"
            aria-label="Passage Mode"
            aria-pressed={mode === 'passage' && !customActive && !activeCompetition}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Passage</span>
          </button>

          {/* Accuracy Mode */}
          <button
            type="button"
            onClick={() => setMode('accuracy')}
            className={`h-7 px-2.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              mode === 'accuracy'
                ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-bold shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/50'
            }`}
            title="Accuracy Focus (98%+ Target Precision)"
            aria-label="Accuracy Mode"
            aria-pressed={mode === 'accuracy'}
          >
            <Target className="w-3.5 h-3.5 text-[var(--ui-success)]" />
            <span>Accuracy</span>
          </button>

          {/* Custom Mode */}
          {customTextEnabled && (
            <button
              type="button"
              onClick={onOpenCustomStudio}
              className={`h-7 px-2.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                customActive
                  ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-bold shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/50'
              }`}
              title={customTitle ? `Custom Studio: ${customTitle} (Alt+C)` : "Open Custom Typing Studio (Alt+C)"}
              aria-label="Open Custom Typing Studio"
              aria-pressed={customActive}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Custom</span>
              {customActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse ml-0.5" />
              )}
            </button>
          )}

          {/* Competition Arena Trigger Button */}
          {competitionEnabled && (
            <button
              type="button"
              onClick={onOpenCompetitions}
              className={`h-7 px-2.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeCompetition
                  ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-bold shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/50'
              }`}
              title="Typing Competition Arena"
              aria-label="Typing Competition Arena"
              aria-pressed={Boolean(activeCompetition)}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Competition</span>
              {activeCompetition && (
                <span className="text-[10px] bg-black/30 px-1.5 py-0.2 rounded font-bold">
                  {activeCompetition.code}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Right group: Duration Options (15s, 30s, 60s, 120s with equal widths) */}
        <div className="flex items-center gap-1 shrink-0 ml-auto lg:ml-0">
          {mode === 'timed' && !customActive && !activeCompetition && (
            <div className="flex items-center gap-1 bg-[var(--bg-elevated)] p-1 rounded-xl border border-[var(--border)] shrink-0">
              {TIME_OPTIONS.map((timeVal) => (
                <button
                  key={timeVal}
                  type="button"
                  onClick={() => setTimeLimit(timeVal)}
                  className={`h-7 w-12 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                    timeLimit === timeVal
                      ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-bold shadow-xs'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/50'
                  }`}
                  title={`${timeVal} Seconds Duration`}
                  aria-label={`${timeVal} Seconds`}
                  aria-pressed={timeLimit === timeVal}
                >
                  {timeVal}s
                </button>
              ))}
            </div>
          )}

          {mode === 'words' && !customActive && !activeCompetition && (
            <div className="flex items-center gap-1 bg-[var(--bg-elevated)] p-1 rounded-xl border border-[var(--border)] shrink-0">
              {WORD_OPTIONS.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setWordLimit(w)}
                  className={`h-7 w-12 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                    wordLimit === w
                      ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-bold shadow-xs'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/50'
                  }`}
                  title={`${w} Words Limit`}
                  aria-label={`${w} Words`}
                  aria-pressed={wordLimit === w}
                >
                  {w}
                </button>
              ))}
            </div>
          )}

          {mode === 'passage' && !customActive && !activeCompetition && (
            <div className="flex items-center bg-[var(--bg-elevated)] p-1 rounded-xl border border-[var(--border)] shrink-0">
              <select
                value={selectedPassageIndex}
                onChange={(e) => setSelectedPassageIndex(parseInt(e.target.value, 10))}
                className="h-7 px-2.5 rounded-lg bg-[var(--bg-surface)] text-xs font-mono text-[var(--text-primary)] cursor-pointer focus:outline-none focus:ring-1 focus:ring-[var(--accent)] max-w-[190px] truncate border-0"
                aria-label="Select practice passage"
              >
                {passages.map((p, idx) => (
                  <option key={p.id} value={idx}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {customActive && (
            <div className="h-9 flex items-center gap-2 px-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--accent)]/40 text-xs font-mono text-[var(--accent)] shrink-0">
              <span className="font-medium">Custom Active</span>
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
          ROW 2: Session Controls (Left) & Settings / Actions (Right)
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-[var(--border)]/40 w-full">
        {/* Left group: Session Controls (Simple, Saved, History, Focus) */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none max-w-full shrink-0">
          {/* Dynamic Custom Generation Mode Action Button */}
          <button
            type="button"
            onClick={onTriggerCustomMode}
            className="h-8 px-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:bg-[var(--bg-surface)] transition-all cursor-pointer flex items-center gap-1.5 font-bold shadow-xs shrink-0"
            title={`Generation Mode: ${currentModeInfo.label} (Click to generate and practice)`}
            aria-label={`Generation Mode: ${currentModeInfo.label}`}
          >
            <ModeIcon className={`w-3.5 h-3.5 ${currentModeInfo.color}`} />
            <span>{currentModeInfo.label}</span>
          </button>

          {/* Saved Passages Library Shortcut */}
          <button
            type="button"
            onClick={onOpenSavedTexts}
            className="h-8 px-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] hover:bg-[var(--bg-surface)] transition-all cursor-pointer flex items-center gap-1.5 font-medium shrink-0"
            title="Saved Passages Library (Alt+S)"
            aria-label="Saved Passages"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Saved</span>
          </button>

          {/* Practice Session History Shortcut */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="h-8 px-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] hover:bg-[var(--bg-surface)] transition-all cursor-pointer flex items-center gap-1.5 font-medium shrink-0"
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
            className={`h-8 px-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 font-medium shrink-0 ${
              focusMode
                ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)] font-bold shadow-xs'
                : 'border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] hover:bg-[var(--bg-surface)]'
            }`}
            title="Focus Mode (Alt+F)"
            aria-label="Focus Mode"
            aria-pressed={focusMode}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Focus</span>
          </button>
        </div>

        {/* Right group: Settings & Actions (Speed, Difficulty/Size, Keys, Hands, Sound, Shortcuts, Pause/Resume, Reset) */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none max-w-full shrink-0 ml-auto lg:ml-0">
          {/* Live Speed Toggle (Speed On / Off) */}
          {setShowLiveWpm && (
            <button
              type="button"
              onClick={() => setShowLiveWpm((v) => !v)}
              className={`h-8 px-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 font-medium shrink-0 ${
                !showLiveWpm
                  ? 'border-[var(--accent)] bg-[var(--bg-elevated)] text-[var(--accent)] font-semibold shadow-xs'
                  : 'border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] hover:bg-[var(--bg-surface)]'
              }`}
              title={showLiveWpm ? 'Live WPM visible (Click to hide speed)' : 'Live WPM hidden (Anxiety-free mode active)'}
              aria-label={showLiveWpm ? 'Speed On' : 'Speed Off'}
              aria-pressed={showLiveWpm}
            >
              {showLiveWpm ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-[var(--accent)]" />}
              <span>{showLiveWpm ? 'Speed On' : 'Speed Off'}</span>
            </button>
          )}

          {/* Difficulty / Text Size Selector (Normal / Compact / Large) */}
          {setFontSize && (
            <button
              type="button"
              onClick={() => {
                const next = fontSize === 'normal' ? 'large' : fontSize === 'large' ? 'compact' : 'normal';
                setFontSize(next);
              }}
              className="h-8 px-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] hover:bg-[var(--bg-surface)] transition-all cursor-pointer flex items-center gap-1.5 font-medium shrink-0"
              title={`Difficulty / Text Size: ${fontSize.toUpperCase()} (Click to toggle)`}
              aria-label={`Difficulty size ${fontSize}`}
            >
              <Type className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span className="capitalize">{fontSize}</span>
            </button>
          )}

          {/* Keyboard Guide Toggle */}
          <button
            type="button"
            onClick={toggleKeyboardGuide}
            className={`h-8 px-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 font-medium shrink-0 ${
              keyboardGuideOn
                ? 'border-[var(--accent)] bg-[var(--bg-elevated)] text-[var(--accent)] font-semibold shadow-xs'
                : 'border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] hover:bg-[var(--bg-surface)]'
            }`}
            title="Toggle Visual Keyboard Guide"
            aria-label="Keyboard Guide"
            aria-pressed={keyboardGuideOn}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>{keyboardGuideOn ? 'Keys On' : 'Keys Off'}</span>
          </button>

          {/* Hand Guide Toggle */}
          <button
            type="button"
            onClick={toggleHandGuide}
            className={`h-8 px-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 font-medium shrink-0 ${
              handGuideOn
                ? 'border-[var(--accent)] bg-[var(--bg-elevated)] text-[var(--accent)] font-semibold shadow-xs'
                : 'border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] hover:bg-[var(--bg-surface)]'
            }`}
            title="Toggle 3D/Anatomical Hand Guide"
            aria-label="Hand Guide"
            aria-pressed={handGuideOn}
          >
            <HandMetal className="w-3.5 h-3.5" />
            <span>{handGuideOn ? 'Hands On' : 'Hands Off'}</span>
          </button>

          {/* Keyboard Sound Selector */}
          <SoundSelector variant="toolbar" className="h-8 px-2.5 rounded-xl" />

          {/* Shortcuts Help */}
          <button
            type="button"
            onClick={onOpenShortcuts}
            className="h-8 w-8 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] hover:bg-[var(--bg-surface)] transition-all cursor-pointer flex items-center justify-center shrink-0"
            title="Keyboard Shortcuts (Alt+K)"
            aria-label="Keyboard Shortcuts"
          >
            <Command className="w-3.5 h-3.5" />
          </button>

          {/* Dedicated Pause / Resume Action Control */}
          <button
            type="button"
            onClick={onTogglePause}
            disabled={!isRunning && !isPaused}
            className={`h-8 px-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 font-medium shrink-0 select-none ${
              isPaused
                ? 'border-amber-500/70 bg-amber-500/15 text-amber-500 hover:bg-amber-500/25 font-bold shadow-xs animate-pulse'
                : isRunning
                ? 'border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-amber-500 hover:border-amber-500/60 hover:bg-[var(--bg-surface)]'
                : 'border-[var(--border)]/50 bg-[var(--bg-elevated)]/40 text-[var(--text-muted)] opacity-40 cursor-not-allowed'
            }`}
            title={
              isPaused
                ? 'Resume Session (Alt+P)'
                : isRunning
                ? 'Pause Session (Alt+P)'
                : 'Start typing to enable pause'
            }
            aria-label={isPaused ? 'Resume Session' : 'Pause Session'}
            aria-pressed={isPaused}
          >
            {isPaused ? (
              <Play className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Pause className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </button>

          {/* Reset Test Action (Visually Distinguishable) */}
          <button
            type="button"
            onClick={onResetTest}
            className="h-8 px-3 rounded-xl border border-[var(--accent)]/60 bg-[var(--bg-elevated)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-fg)] hover:border-[var(--accent)] active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 font-semibold shadow-xs shrink-0"
            title="Reset Test (Esc)"
            aria-label="Reset Test"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};
