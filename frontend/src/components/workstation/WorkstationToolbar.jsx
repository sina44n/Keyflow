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
  ChevronDown,
} from 'lucide-react';
import { SoundSelector } from '../common/SoundSelector';

export const WorkstationToolbar = React.memo(function WorkstationToolbar({
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
  switchMode,
  toggleSwitchMode,
  onOpenCustomStudio,
  onOpenSavedTexts,
  onOpenHistory,
  onOpenShortcuts,
  onOpenCompetitions,
  onOpenSoundSystem,
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
  onRestoreFocus,
  t,
  allowedDurations,
  customTextEnabled = true,
  competitionEnabled = true,
}) {
  const isSwitchActive = switchMode !== undefined ? Boolean(switchMode) : Boolean(focusMode);
  const onToggleSwitch = toggleSwitchMode || toggleFocusMode;
  const TIME_OPTIONS = allowedDurations && allowedDurations.length ? allowedDurations : [15, 30, 60, 120];
  const WORD_OPTIONS = [10, 25, 50, 100];

  const handlePreventFocusTheft = (e) => {
    const tag = (e.target.tagName || '').toUpperCase();
    if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
      e.preventDefault();
    }
  };

  const handleToolbarClickCapture = () => {
    if (onRestoreFocus) {
      setTimeout(onRestoreFocus, 10);
    }
  };

  const [modeDropdownOpen, setModeDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef(null);

  React.useEffect(() => {
    if (!modeDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setModeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [modeDropdownOpen]);

  // Derive active dynamic generation mode label and icon
  const getModeDetails = (m) => {
    switch (m) {
      case 'repeat':
        return { label: 'Repeat', icon: Repeat, color: 'text-sky-400' };
      case 'shuffle':
        return { label: 'Shuffle', icon: Shuffle, color: 'text-amber-400' };
      case 'random':
      default:
        return { label: 'Random', icon: Sparkles, color: 'text-emerald-400' };
    }
  };

  const currentModeInfo = getModeDetails(customGenerationMode);
  const ModeIcon = currentModeInfo.icon;

  if (isSwitchActive) {
    return (
      <div
        onMouseDown={handlePreventFocusTheft}
        onClickCapture={handleToolbarClickCapture}
        className="relative z-20 flex flex-col items-center justify-center gap-3 text-xs font-mono w-full select-none max-w-5xl mx-auto"
      >
        {/* ROW 1: Mode Selector Group (Left) + Duration Presets (Right) */}
        <div className="flex flex-nowrap items-center justify-center gap-4 sm:gap-6 w-full overflow-x-auto scrollbar-none">
          {/* Mode Selector Capsule: Time, Words, Passage, Accuracy, Custom, Competition */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-elevated)]/60 backdrop-blur-md border border-[var(--border)]/70 shadow-xs shrink-0">
            {/* Time Mode */}
            <button
              type="button"
              onClick={() => setMode('timed')}
              className={`h-7 px-2.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                mode === 'timed' && !activeCompetition
                  ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-bold shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/50'
              }`}
              title="Time Trial Mode"
              aria-label="Time Mode"
              aria-pressed={mode === 'timed' && !activeCompetition}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Time</span>
            </button>

            {/* Words Mode */}
            <button
              type="button"
              onClick={() => setMode('words')}
              className={`h-7 px-2.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                mode === 'words' && !activeCompetition
                  ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-bold shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/50'
              }`}
              title="Word Sprint Mode"
              aria-label="Words Mode"
              aria-pressed={mode === 'words' && !activeCompetition}
            >
              <Hash className="w-3.5 h-3.5" />
              <span>Words</span>
            </button>

            {/* Passage Mode */}
            <button
              type="button"
              onClick={() => setMode('passage')}
              className={`h-7 px-2.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                mode === 'passage' && !activeCompetition
                  ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-bold shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/50'
              }`}
              title="Curated Literature & Technical Passages"
              aria-label="Passage Mode"
              aria-pressed={mode === 'passage' && !activeCompetition}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Passage</span>
            </button>

            {/* Accuracy Mode */}
            <button
              type="button"
              onClick={() => setMode('accuracy')}
              className={`h-7 px-2.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                mode === 'accuracy' && !activeCompetition
                  ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-bold shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/50'
              }`}
              title="Accuracy Focus (98%+ Target Precision)"
              aria-label="Accuracy Mode"
              aria-pressed={mode === 'accuracy' && !activeCompetition}
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

            {/* Competition Mode */}
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

          {/* Duration Presets Capsule */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-elevated)]/60 backdrop-blur-md border border-[var(--border)]/70 shadow-xs shrink-0">
            {mode === 'timed' && !activeCompetition && (
              <>
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
              </>
            )}

            {mode === 'words' && !activeCompetition && (
              <>
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
              </>
            )}

            {mode === 'passage' && !customActive && !activeCompetition && (
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
            )}

            {mode === 'accuracy' && !activeCompetition && (
              <div className="flex items-center gap-1.5 px-3 py-1 text-xs text-[var(--ui-success)] font-medium shrink-0">
                <Target className="w-3.5 h-3.5" />
                <span>98%+ Target Precision</span>
              </div>
            )}
          </div>
        </div>

        {/* ROW 2: Secondary Controls Group 1 (Left) + Group 2 (Right) */}
        <div className="flex flex-nowrap items-center justify-center gap-4 sm:gap-6 w-full overflow-x-auto scrollbar-none">
          {/* Group 1 Capsule: Random, Saved, History, Switch, Speed, Compact */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-elevated)]/60 backdrop-blur-md border border-[var(--border)]/70 shadow-xs shrink-0">
            {/* Random / Dynamic Mode Dropdown */}
            <div ref={dropdownRef} className="relative flex items-center shrink-0 z-50">
              <button
                type="button"
                onClick={() => onTriggerCustomMode()}
                className="h-7 px-2 rounded-l-lg text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/50 transition-all cursor-pointer flex items-center gap-1.5 font-medium shrink-0"
                title={`Generation Mode: ${currentModeInfo.label}`}
                aria-label={`Generation Mode: ${currentModeInfo.label}`}
              >
                <ModeIcon className={`w-3.5 h-3.5 ${currentModeInfo.color}`} />
                <span>{currentModeInfo.label}</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setModeDropdownOpen((prev) => !prev);
                }}
                className="h-7 px-1 rounded-r-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/50 transition-all cursor-pointer flex items-center shrink-0"
                title="Select Transformation Mode"
                aria-label="Select Transformation Mode"
                aria-expanded={modeDropdownOpen}
              >
                <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${modeDropdownOpen ? 'rotate-180 text-[var(--accent)]' : ''}`} />
              </button>
              {modeDropdownOpen && (
                <div
                  className="absolute top-full left-0 mt-1.5 z-50 min-w-[130px] rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-xl p-1 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-150"
                  role="menu"
                >
                  {[
                    { id: 'random', label: 'Random', icon: Sparkles, color: 'text-emerald-400' },
                    { id: 'shuffle', label: 'Shuffle', icon: Shuffle, color: 'text-amber-400' },
                    { id: 'repeat', label: 'Repeat', icon: Repeat, color: 'text-sky-400' },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive = customGenerationMode === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          onTriggerCustomMode(item.id);
                          setModeDropdownOpen(false);
                        }}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors text-left cursor-pointer ${
                          isActive
                            ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-bold'
                            : 'text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[var(--accent-fg)]' : item.color}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Saved Passages */}
            <button
              type="button"
              onClick={onOpenSavedTexts}
              className="h-7 px-2.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/50 transition-all cursor-pointer flex items-center gap-1.5 font-medium shrink-0"
              title="Saved Passages Library (Alt+S)"
              aria-label="Saved Passages"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Saved</span>
            </button>

            {/* Practice History */}
            <button
              type="button"
              onClick={onOpenHistory}
              className="h-7 px-2.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/50 transition-all cursor-pointer flex items-center gap-1.5 font-medium shrink-0"
              title="Practice Session History (Alt+H)"
              aria-label="Practice History"
            >
              <History className="w-3.5 h-3.5" />
              <span>History</span>
            </button>

            {/* Switch Mode Button (ACTIVE) */}
            <button
              type="button"
              onClick={onToggleSwitch}
              className="h-7 px-2.5 rounded-lg bg-[var(--accent)] text-[var(--accent-fg)] font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              title="Switch Interface Mode (Alt+F)"
              aria-label="Switch Mode"
              aria-pressed={true}
              data-testid="workstation-switch-mode-toggle"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Switch</span>
            </button>
          </div>

          {/* Group 2 Capsule: Speed On, Compact, Sound, Pause (Keys On & Hands On completely removed) */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-elevated)]/60 backdrop-blur-md border border-[var(--border)]/70 shadow-xs shrink-0">
            {/* Speed Toggle */}
            {setShowLiveWpm && (
              <button
                type="button"
                onClick={() => setShowLiveWpm((v) => !v)}
                className={`h-7 px-2.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 font-medium shrink-0 ${
                  !showLiveWpm
                    ? 'text-[var(--accent)] font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/50'
                }`}
                title={showLiveWpm ? 'Live WPM visible (Click to hide speed)' : 'Live WPM hidden (Anxiety-free mode active)'}
                aria-label={showLiveWpm ? 'Speed On' : 'Speed Off'}
                aria-pressed={showLiveWpm}
              >
                {showLiveWpm ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-[var(--accent)]" />}
                <span>{showLiveWpm ? 'Speed On' : 'Speed Off'}</span>
              </button>
            )}

            {/* Compact / Difficulty Selector */}
            {setFontSize && (
              <button
                type="button"
                onClick={() => {
                  const next = fontSize === 'normal' ? 'large' : fontSize === 'large' ? 'compact' : 'normal';
                  setFontSize(next);
                }}
                className="h-7 px-2.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/50 transition-all cursor-pointer flex items-center gap-1.5 font-medium shrink-0"
                title={`Difficulty / Text Size: ${fontSize.toUpperCase()} (Click to toggle)`}
                aria-label={`Difficulty size ${fontSize}`}
              >
                <Type className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span className="capitalize">{fontSize}</span>
              </button>
            )}

            {/* Sound Selector */}
            <SoundSelector
              variant="toolbar"
              className="h-7 px-2 rounded-lg"
              onOpenModal={onOpenSoundSystem}
            />

            {/* Dedicated Pause / Resume Action Control */}
            <button
              type="button"
              onClick={onTogglePause}
              disabled={!isRunning && !isPaused}
              className={`h-7 px-2.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 font-medium shrink-0 select-none ${
                isPaused
                  ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 font-bold shadow-xs animate-pulse'
                  : isRunning
                  ? 'text-[var(--text-secondary)] hover:text-amber-500 hover:bg-[var(--bg-surface)]/50'
                  : 'text-[var(--text-muted)] opacity-40 cursor-not-allowed'
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onMouseDown={handlePreventFocusTheft}
      onClickCapture={handleToolbarClickCapture}
      className="card-panel relative z-20 p-2 sm:p-2.5 flex flex-col gap-2.5 text-xs font-mono w-full select-none"
    >
      {/* ─────────────────────────────────────────────────────────────
          ROW 1: Practice Modes (Left) & Contextual Options (Right)
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 w-full lg:flex-nowrap">
        {/* Left group: Practice Modes (Time, Words, Passage, Accuracy, Custom, Competition) */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] overflow-x-auto scrollbar-none shrink-0">
          {/* Time Mode */}
          <button
            type="button"
            onClick={() => setMode('timed')}
            className={`h-7 px-2.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              mode === 'timed' && !activeCompetition
                ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-bold shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/50'
            }`}
            title="Time Trial Mode"
            aria-label="Time Mode"
            aria-pressed={mode === 'timed' && !activeCompetition}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Time</span>
          </button>

          {/* Words Mode */}
          <button
            type="button"
            onClick={() => setMode('words')}
            className={`h-7 px-2.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              mode === 'words' && !activeCompetition
                ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-bold shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/50'
            }`}
            title="Word Sprint Mode"
            aria-label="Words Mode"
            aria-pressed={mode === 'words' && !activeCompetition}
          >
            <Hash className="w-3.5 h-3.5" />
            <span>Words</span>
          </button>

          {/* Passage Mode */}
          <button
            type="button"
            onClick={() => setMode('passage')}
            className={`h-7 px-2.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              mode === 'passage' && !activeCompetition
                ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-bold shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/50'
            }`}
            title="Curated Literature & Technical Passages"
            aria-label="Passage Mode"
            aria-pressed={mode === 'passage' && !activeCompetition}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Passage</span>
          </button>

          {/* Accuracy Mode */}
          <button
            type="button"
            onClick={() => setMode('accuracy')}
            className={`h-7 px-2.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              mode === 'accuracy' && !activeCompetition
                ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-bold shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/50'
            }`}
            title="Accuracy Focus (98%+ Target Precision)"
            aria-label="Accuracy Mode"
            aria-pressed={mode === 'accuracy' && !activeCompetition}
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

        {/* Right group: Duration Options / Word Limits / Passage Selector / Accuracy Target */}
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          {mode === 'timed' && !activeCompetition && (
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

          {mode === 'words' && !activeCompetition && (
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

          {mode === 'accuracy' && !activeCompetition && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--ui-success)] font-medium shrink-0">
              <Target className="w-3.5 h-3.5" />
              <span>98%+ Target Precision</span>
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          ROW 2: Session Controls (Left) & Settings / Actions (Right)
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-start gap-1.5 pt-2 border-t border-[var(--border)]/40 w-full lg:flex-nowrap">
        {/* Left group: Session Controls (Random, Shuffle, Repeat, Saved, History, Focus) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Dynamic Custom Generation Mode Action Button & Dropdown */}
          <div ref={dropdownRef} className="relative flex items-center shrink-0 z-50">
            <button
              type="button"
              onClick={() => onTriggerCustomMode()}
              className="h-8 px-2.5 rounded-l-xl border-y border-l border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:bg-[var(--bg-surface)] transition-all cursor-pointer flex items-center gap-1.5 font-bold shadow-xs shrink-0"
              title={`Generation Mode: ${currentModeInfo.label} (Click to execute ${currentModeInfo.label} on active passage)`}
              aria-label={`Generation Mode: ${currentModeInfo.label}`}
            >
              <ModeIcon className={`w-3.5 h-3.5 ${currentModeInfo.color}`} />
              <span>{currentModeInfo.label}</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setModeDropdownOpen((prev) => !prev);
              }}
              className="h-8 px-1.5 rounded-r-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] hover:bg-[var(--bg-surface)] transition-all cursor-pointer flex items-center shrink-0"
              title="Select Transformation Mode"
              aria-label="Select Transformation Mode"
              aria-expanded={modeDropdownOpen}
            >
              <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${modeDropdownOpen ? 'rotate-180 text-[var(--accent)]' : ''}`} />
            </button>
            {modeDropdownOpen && (
              <div
                className="absolute top-full left-0 mt-1.5 z-50 min-w-[130px] rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-xl p-1 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-150"
                role="menu"
              >
                {[
                  { id: 'random', label: 'Random', icon: Sparkles, color: 'text-emerald-400' },
                  { id: 'shuffle', label: 'Shuffle', icon: Shuffle, color: 'text-amber-400' },
                  { id: 'repeat', label: 'Repeat', icon: Repeat, color: 'text-sky-400' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = customGenerationMode === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onTriggerCustomMode(item.id);
                        setModeDropdownOpen(false);
                      }}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors text-left cursor-pointer ${
                        isActive
                          ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-bold'
                          : 'text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[var(--accent-fg)]' : item.color}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

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

          {/* Switch Interface Mode Toggle (formerly Focus) */}
          <button
            type="button"
            onClick={onToggleSwitch}
            className={`h-8 px-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 font-medium shrink-0 ${
              isSwitchActive
                ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)] font-bold shadow-xs'
                : 'border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] hover:bg-[var(--bg-surface)]'
            }`}
            title="Switch Interface Mode (Alt+F)"
            aria-label="Switch Mode"
            aria-pressed={isSwitchActive}
            data-testid="workstation-switch-mode-toggle"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Switch</span>
          </button>
        </div>

        {/* Right group: Settings & Actions (Speed, Difficulty/Size, Keys, Hands, Sound, Shortcuts, Pause/Resume) */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none max-w-full shrink-0">
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

          {/* Keyboard Sound Selector / Sound System */}
          <SoundSelector
            variant="toolbar"
            className="h-8 px-2.5 rounded-xl"
            onOpenModal={onOpenSoundSystem}
          />

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
        </div>
      </div>
    </div>
  );
});
