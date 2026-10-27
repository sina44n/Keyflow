import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RotateCcw,
  Gauge,
  Target,
  Keyboard,
  HandMetal,
  Sparkles,
  Clock,
  FileText,
  Hash,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { KeyboardGuide } from '../components/academy/KeyboardGuide';
import { getGuidePreferences, saveGuidePreferences } from '../utils/lessonProgress';
import { getCharacterFeedback, countCorrectChars } from '../utils/typingFeedback';
import { SoundSelector } from '../components/common/SoundSelector';
import { useKeyboardSound } from '../context/SoundContext';
import { useI18n } from '../i18n/I18nContext';

const PRACTICE_PASSAGES = [
  {
    id: 'flow-thought',
    title: 'The Flow of Thought',
    category: 'General',
    text: 'Typing is the art of translating thought into text without interruption. When your fingers know their places on the keyboard, words flow naturally onto the screen. Every keystroke becomes effortless and rhythmic.',
  },
  {
    id: 'mechanical-harmony',
    title: 'Mechanical Harmony',
    category: 'Cadence',
    text: 'A quiet room and a responsive keyboard create an environment where focus deepens. Speed is never the primary goal; precision and steady cadence are what allow true velocity to emerge over sustained practice.',
  },
  {
    id: 'craft-discipline',
    title: 'The Silent Craft',
    category: 'Literature',
    text: 'The craftsman does not rush the tool. He lets the chisel follow the grain of the wood, and in time, form reveals itself. In the same way, the typist allows rhythm to guide the fingers rather than anxious hurry.',
  },
  {
    id: 'clean-code',
    title: 'Principles of Code',
    category: 'Technology',
    text: 'Any fool can write code that a computer can understand. Good programmers write code that humans can understand. Programs must be written for people to read, and only incidentally for machines to execute.',
  },
  {
    id: 'speed-light',
    title: 'Speed of Light',
    category: 'Science',
    text: 'Photons guided through pure silicon glass bounce at glancing angles millions of times each second. Information travels at roughly two hundred thousand kilometers per second, bridging oceans and continents in milliseconds.',
  },
  {
    id: 'quick-sprint',
    title: 'Quick Velocity Sprint',
    category: 'Pangram',
    text: 'The quick brown fox jumps over the lazy dog while five boxing wizards jump quickly through dark night skies.',
  },
];

const MODES = [
  { id: 'timed', label: 'Time', icon: Clock },
  { id: 'words', label: 'Words', icon: Hash },
  { id: 'passage', label: 'Passage', icon: FileText },
];

const TIME_OPTIONS = [15, 30, 60, 120];
const WORD_OPTIONS = [10, 25, 50, 100];

export const WorkstationPage = () => {
  const navigate = useNavigate();
  const { t } = useI18n();

  // Mode settings
  const [mode, setMode] = useState('timed'); // 'timed' | 'words' | 'passage'
  const [timeLimit, setTimeLimit] = useState(30);
  const [wordLimit, setWordLimit] = useState(25);
  const [selectedPassageIndex, setSelectedPassageIndex] = useState(0);

  // Guide toggles (independent)
  const [keyboardGuideOn, setKeyboardGuideOn] = useState(() => getGuidePreferences().keyboardGuide);
  const [handGuideOn, setHandGuideOn] = useState(() => getGuidePreferences().handGuide);
  const { playClick } = useKeyboardSound();

  // Typing session state
  const [typed, setTyped] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [remainingTime, setRemainingTime] = useState(30);
  const [mistakes, setMistakes] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [sessionResults, setSessionResults] = useState(null);
  const [lastKeystroke, setLastKeystroke] = useState(null);

  const inputRef = useRef(null);
  const timerRef = useRef(null);

  // Determine current active text
  const currentTargetText = useMemo(() => {
    if (mode === 'passage') {
      return PRACTICE_PASSAGES[selectedPassageIndex].text;
    }
    if (mode === 'words') {
      const allWords = PRACTICE_PASSAGES.flatMap((p) => p.text.split(' '));
      return allWords.slice(0, wordLimit).join(' ');
    }
    // timed mode default
    return PRACTICE_PASSAGES[selectedPassageIndex].text;
  }, [mode, wordLimit, selectedPassageIndex]);

  // Next expected character for guide highlight
  const currentTargetChar = useMemo(() => {
    if (!currentTargetText || typed.length >= currentTargetText.length) return null;
    return currentTargetText[typed.length];
  }, [typed, currentTargetText]);

  // Synchronous guide toggles with persistence
  const toggleKeyboardGuide = () => {
    setKeyboardGuideOn((prev) => {
      const next = !prev;
      saveGuidePreferences(next, handGuideOn);
      return next;
    });
  };

  const toggleHandGuide = () => {
    setHandGuideOn((prev) => {
      const next = !prev;
      saveGuidePreferences(keyboardGuideOn, next);
      return next;
    });
  };



  // Live metrics calculations
  const correctChars = useMemo(() => {
    return countCorrectChars(typed, currentTargetText);
  }, [typed, currentTargetText]);

  const elapsedMinutes = Math.max((elapsedSeconds || 1) / 60, 0.016);
  const liveWpm = startTime ? Math.max(0, Math.round(correctChars / 5 / elapsedMinutes)) : 0;
  const liveAccuracy = typed.length > 0
    ? Math.max(0, Math.min(100, Math.round((correctChars / Math.max(correctChars + mistakes, 1)) * 100)))
    : 100;

  // Complete session handler
  const handleCompleteSession = useCallback(
    (duration) => {
      setIsCompleted(true);
      clearInterval(timerRef.current);

      const actualMinutes = Math.max(duration / 60, 0.016);
      const grossWpm = Math.round(typed.length / 5 / actualMinutes);
      const netWpm = Math.max(0, Math.round((typed.length / 5 - mistakes) / actualMinutes));
      const accuracy = typed.length > 0 ? Math.round((correctChars / (typed.length + mistakes)) * 100) : 100;

      let tier = 'Typist';
      if (netWpm >= 100) tier = 'Godspeed';
      else if (netWpm >= 80) tier = 'Master';
      else if (netWpm >= 60) tier = 'Expert';
      else if (netWpm >= 40) tier = 'Proficient';

      const results = {
        netWpm,
        grossWpm,
        accuracy,
        duration,
        correctChars,
        mistakes,
        totalChars: typed.length,
        tier,
      };

      setSessionResults(results);

      // Async backend sync
      try {
        fetch('/api/practice/sessions/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_type: mode,
            duration_seconds: duration,
            total_chars: typed.length,
            correct_chars: correctChars,
            incorrect_chars: mistakes,
            gross_wpm: grossWpm,
            net_wpm: netWpm,
            accuracy: accuracy,
            error_count: mistakes,
          }),
        }).catch(() => {
          /* guest or offline */
        });
      } catch {
        /* ignore */
      }
    },
    [typed, mistakes, correctChars, mode]
  );

  // Key input handler
  const handleInputChange = (e) => {
    if (isCompleted) return;
    const val = e.target.value;

    if (!startTime && val.length > 0) {
      setStartTime(Date.now());
    }

    if (val.length > typed.length) {
      const charIndex = val.length - 1;
      const expectedChar = currentTargetText[charIndex];
      const actualChar = val[charIndex];
      const isError = actualChar !== expectedChar;
      playClick(isError);
      if (isError) {
        setMistakes((m) => m + 1);
      }
      setLastKeystroke({ key: actualChar, code: '', id: performance.now() });
    } else if (val.length < typed.length) {
      setLastKeystroke({ key: 'backspace', code: 'Backspace', id: performance.now() });
    }

    setTyped(val);

    // End condition for word / passage mode
    if (val.length >= currentTargetText.length) {
      const dur = Math.max(1, Math.round((Date.now() - (startTime || Date.now())) / 1000));
      handleCompleteSession(dur);
    }
  };

  // Reset test
  const handleReset = useCallback(() => {
    setTyped('');
    setStartTime(null);
    setElapsedSeconds(0);
    setRemainingTime(timeLimit);
    setMistakes(0);
    setIsCompleted(false);
    setSessionResults(null);
    setLastKeystroke(null);
    clearInterval(timerRef.current);
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 40);
  }, [timeLimit]);

  // Timed countdown effect
  useEffect(() => {
    if (startTime && !isCompleted) {
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsedSeconds(elapsed);

        if (mode === 'timed') {
          const rem = Math.max(0, timeLimit - elapsed);
          setRemainingTime(rem);
          if (rem <= 0) {
            handleCompleteSession(timeLimit);
          }
        }
      }, 250);
    }
    return () => clearInterval(timerRef.current);
  }, [startTime, isCompleted, mode, timeLimit, handleCompleteSession]);

  // Hotkey: Tab + Enter or Escape to reset
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleReset();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleReset]);

  // Focus on mount or mode change
  useEffect(() => {
    handleReset();
  }, [mode, timeLimit, wordLimit, selectedPassageIndex, handleReset]);

  return (
    <div className="container-app py-8 sm:py-12 space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-[11px] font-mono text-[var(--accent)]">
            <Sparkles className="w-3 h-3" />
            <span>{t('hero.latency')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] mt-1 tracking-tight">
            {t('nav.workstation')}
          </h1>
        </div>

        {/* Action button to Academy */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={BookOpen}
            onClick={() => navigate('/academy')}
          >
            {t('hero.exploreAcademy')}
          </Button>
        </div>
      </div>

      {/* Mode and Parameter Selector Toolbar */}
      <div className="card-panel p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Mode Selection (Time, Words, Passage) */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
          {MODES.map((m) => {
            const Icon = m.icon;
            const isSelected = mode === m.id;
            const localizedLabel =
              m.id === 'timed'
                ? t('workstation.mode.timed')
                : m.id === 'words'
                ? t('workstation.mode.words')
                : t('workstation.mode.passage');
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-bold shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{localizedLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Middle: Mode Options */}
        <div className="flex items-center gap-2">
          {mode === 'timed' && (
            <div className="flex items-center gap-1 bg-[var(--bg-elevated)] p-1 rounded-lg border border-[var(--border)]">
              {TIME_OPTIONS.map((timeVal) => (
                <button
                  key={timeVal}
                  type="button"
                  onClick={() => setTimeLimit(timeVal)}
                  className={`px-2.5 py-1 rounded text-xs font-mono cursor-pointer transition-colors ${
                    timeLimit === timeVal
                      ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-bold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {t('workstation.seconds', { count: timeVal })}
                </button>
              ))}
            </div>
          )}

          {mode === 'words' && (
            <div className="flex items-center gap-1 bg-[var(--bg-elevated)] p-1 rounded-lg border border-[var(--border)]">
              {WORD_OPTIONS.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setWordLimit(w)}
                  className={`px-2.5 py-1 rounded text-xs font-mono cursor-pointer transition-colors ${
                    wordLimit === w
                      ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-bold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {t('workstation.wordCount', { count: w })}
                </button>
              ))}
            </div>
          )}

          {mode === 'passage' && (
            <select
              value={selectedPassageIndex}
              onChange={(e) => setSelectedPassageIndex(parseInt(e.target.value, 10))}
              className="px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-xs font-mono text-[var(--text-primary)] cursor-pointer focus:outline-none focus:border-[var(--accent)]"
            >
              {PRACTICE_PASSAGES.map((p, idx) => (
                <option key={p.id} value={idx}>
                  {p.title} ({p.category})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Right: Independent Guide Controls and Sound */}
        <div className="flex items-center gap-2">
          {/* Keyboard Guide Toggle */}
          <button
            type="button"
            onClick={toggleKeyboardGuide}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              keyboardGuideOn
                ? 'border-[var(--accent)] bg-[var(--bg-elevated)] text-[var(--accent)] shadow-xs'
                : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            title="Keyboard Guide: Visual keyboard highlighting next key"
            aria-pressed={keyboardGuideOn}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>{keyboardGuideOn ? t('workstation.kbGuideOn') : t('workstation.kbGuideOff')}</span>
          </button>

          {/* Hand Guide Toggle */}
          <button
            type="button"
            onClick={toggleHandGuide}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              handGuideOn
                ? 'border-[var(--accent)] bg-[var(--bg-elevated)] text-[var(--accent)] shadow-xs'
                : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            title="Hand Guide: Anatomical illustration highlighting recommended finger"
            aria-pressed={handGuideOn}
          >
            <HandMetal className="w-3.5 h-3.5" />
            <span>{handGuideOn ? t('workstation.handGuideOn') : t('workstation.handGuideOff')}</span>
          </button>

          {/* Sound Selector Popover */}
          <SoundSelector variant="toolbar" />

          {/* Reset */}
          <Button variant="outline" size="sm" icon={RotateCcw} onClick={handleReset}>
            {t('workstation.restart')}
          </Button>
        </div>
      </div>

      {/* Main Workstation Layout — Symmetrical Centered Composition */}
      <div className="w-full max-w-[820px] mx-auto space-y-6">
        {/* Live Telemetry Bar */}
        <div className="flex items-center justify-between px-2 text-xs font-mono text-[var(--text-muted)]">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-[var(--accent)]" />
              <span className="text-[11px] uppercase">{t('workstation.liveWpm')}</span>
              <span className="text-base font-bold text-[var(--text-primary)] font-mono">{liveWpm}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Target className="w-4 h-4 text-[var(--ui-success)]" />
              <span className="text-[11px] uppercase">{t('workstation.accuracy')}</span>
              <span className="text-base font-bold text-[var(--text-primary)] font-mono">{liveAccuracy}%</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {mode === 'timed' ? (
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[var(--accent)]" />
                <span className="text-base font-bold text-[var(--accent)] font-mono">{remainingTime}s</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span>{typed.length}</span>
                <span>/</span>
                <span>{currentTargetText.length} chars</span>
              </div>
            )}
          </div>
        </div>

        {/* Typing Area Box */}
        <div
          onClick={() => inputRef.current && inputRef.current.focus()}
          className={`p-6 sm:p-8 rounded-2xl border transition-all cursor-text min-h-[160px] relative select-none leading-relaxed font-mono text-lg sm:text-2xl whitespace-pre-wrap ${
            isCompleted
              ? 'opacity-85 border-[var(--border)]'
              : 'border-[var(--accent)] shadow-sm'
          }`}
          style={{ background: 'var(--bg-surface)' }}
        >
          {currentTargetText.split('').map((char, idx) => {
            const feedback = getCharacterFeedback(idx, typed, currentTargetText, isCompleted);
            return (
              <span key={idx} className={feedback.className}>
                {char}
              </span>
            );
          })}

          <input
            ref={inputRef}
            type="text"
            value={typed}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (isCompleted) return;
              if (e.key === 'Escape') return;
              if (e.key === 'Tab') {
                e.preventDefault();
              }
              setLastKeystroke({ key: e.key, code: e.code, id: performance.now() });
            }}
            disabled={isCompleted}
            className="absolute inset-0 opacity-0 cursor-default"
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-label="Type the passage text here"
          />
        </div>

        {/* Session Complete Results Card */}
        {isCompleted && sessionResults && (
          <div className="card-panel p-6 space-y-5 animate-in fade-in duration-200 border-2 border-[var(--accent)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[var(--accent)] text-[var(--accent-fg)] flex items-center justify-center font-extrabold text-xl font-mono shadow-md">
                  {sessionResults.netWpm}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">
                      {sessionResults.tier} {t('workstation.summary')}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--accent)]">
                      {sessionResults.netWpm} {t('common.wpm')}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Completed {mode} test in {sessionResults.duration} {t('common.seconds')} with {sessionResults.accuracy}% {t('common.accuracy').toLowerCase()}.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="secondary" size="md" icon={RotateCcw} onClick={handleReset}>
                  {t('workstation.tryAgain')}
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  icon={ArrowRight}
                  onClick={() => navigate('/academy')}
                >
                  {t('nav.academy')}
                </Button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
                <div className="text-[10px] uppercase font-mono text-[var(--text-muted)]">{t('workstation.netWpm')}</div>
                <div className="text-2xl font-extrabold font-mono text-[var(--accent)]">
                  {sessionResults.netWpm} <span className="text-xs text-[var(--text-muted)]">{t('common.wpm')}</span>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
                <div className="text-[10px] uppercase font-mono text-[var(--text-muted)]">{t('common.accuracy')}</div>
                <div className="text-2xl font-extrabold font-mono text-[var(--ui-success)]">
                  {sessionResults.accuracy}%
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
                <div className="text-[10px] uppercase font-mono text-[var(--text-muted)]">{t('workstation.rawWpm')}</div>
                <div className="text-2xl font-extrabold font-mono text-[var(--text-primary)]">
                  {sessionResults.grossWpm} <span className="text-xs text-[var(--text-muted)]">{t('common.wpm')}</span>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
                <div className="text-[10px] uppercase font-mono text-[var(--text-muted)]">{t('workstation.mistakes')}</div>
                <div className="text-2xl font-extrabold font-mono text-[var(--ui-error)]">
                  {sessionResults.mistakes}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Precision Virtual Keyboard + Realistic Hand Overlay (Centered) */}
        {(keyboardGuideOn || handGuideOn) && (
          <div className="w-full flex flex-col items-center pt-2">
            <KeyboardGuide
              targetChar={currentTargetChar}
              lastKeystroke={lastKeystroke}
              isVisible={keyboardGuideOn}
              handGuideVisible={handGuideOn}
            />
          </div>
        )}
      </div>
    </div>
  );
};
