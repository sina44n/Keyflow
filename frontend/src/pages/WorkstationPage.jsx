import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RotateCcw,
  Gauge,
  Target,
  Sparkles,
  Clock,
  ArrowRight,
  BookOpen,
  Trophy,
  Eye,
  Minimize2,
  Flag,
  AlertCircle,
  User,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { KeyboardGuide } from '../components/academy/KeyboardGuide';
import { getGuidePreferences, saveGuidePreferences } from '../utils/lessonProgress';
import {
  getCharacterFeedback,
  countCorrectChars,
  calculateRawAccuracy,
  calculateFinalTextAccuracy,
} from '../utils/typingFeedback';
import { useKeyboardSound } from '../context/SoundContext';
import { useI18n } from '../i18n/I18nContext';
import { practiceAPI, profileAPI, competitionAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { recordTelemetrySession } from '../utils/telemetryStorage';

// New Workstation modular components
import { WorkstationToolbar } from '../components/workstation/WorkstationToolbar';
import { CustomTypingStudio } from '../components/workstation/CustomTypingStudio';
import { SavedTextsModal } from '../components/workstation/SavedTextsModal';
import { PracticeHistoryModal } from '../components/workstation/PracticeHistoryModal';
import { ShortcutsModal } from '../components/workstation/ShortcutsModal';
import { CompetitionModal } from '../components/workstation/CompetitionModal';
import TelemetryProfileModal from '../components/telemetry/TelemetryProfileModal';
import { DedicatedResultsScreen, calculateConsistency } from '../components/workstation/DedicatedResultsScreen';

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

const TIME_OPTIONS = [15, 30, 60, 120];
const WORD_OPTIONS = [10, 25, 50, 100];

export const WorkstationPage = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user } = useAuth();

  // Mode settings
  const [mode, setMode] = useState('timed'); // 'timed' | 'words' | 'passage' | 'accuracy'
  const [timeLimit, setTimeLimit] = useState(30);
  const [wordLimit, setWordLimit] = useState(25);
  const [selectedPassageIndex, setSelectedPassageIndex] = useState(0);

  // Custom text state
  const [customPrompt, setCustomPrompt] = useState(null);

  // Competition state
  const [activeCompetition, setActiveCompetition] = useState(null);
  const [competitionParticipantId, setCompetitionParticipantId] = useState(null);

  // Modals state
  const [customStudioOpen, setCustomStudioOpen] = useState(false);
  const [savedTextsOpen, setSavedTextsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [competitionsOpen, setCompetitionsOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Focus Mode (distraction-free)
  const [focusMode, setFocusMode] = useState(false);

  // Guide toggles (independent)
  const [keyboardGuideOn, setKeyboardGuideOn] = useState(() => getGuidePreferences().keyboardGuide);
  const [handGuideOn, setHandGuideOn] = useState(() => getGuidePreferences().handGuide);
  const { playClick } = useKeyboardSound();

  // Hydrate user workstation preferences from backend if authenticated
  useEffect(() => {
    if (user?.preferences) {
      const p = user.preferences;
      if (p.preferred_duration && TIME_OPTIONS.includes(p.preferred_duration)) {
        setTimeLimit(p.preferred_duration);
      }
      if (p.preferred_word_count && WORD_OPTIONS.includes(p.preferred_word_count)) {
        setWordLimit(p.preferred_word_count);
      }
      if (p.preferred_mode && ['timed', 'words', 'passage', 'accuracy'].includes(p.preferred_mode)) {
        setMode(p.preferred_mode);
      }
      if (p.keyboard_visual_enabled !== undefined) {
        setKeyboardGuideOn(Boolean(p.keyboard_visual_enabled));
      }
      if (p.hand_guide_enabled !== undefined) {
        setHandGuideOn(Boolean(p.hand_guide_enabled));
      }
    }
  }, [user]);

  // Synchronous guide toggles with persistence & account sync
  const toggleKeyboardGuide = () => {
    setKeyboardGuideOn((prev) => {
      const next = !prev;
      saveGuidePreferences(next, handGuideOn);
      if (user?.id) {
        profileAPI.updatePreferences({ keyboard_visual_enabled: next }).catch(() => {});
      }
      return next;
    });
  };

  const toggleHandGuide = () => {
    setHandGuideOn((prev) => {
      const next = !prev;
      saveGuidePreferences(keyboardGuideOn, next);
      if (user?.id) {
        profileAPI.updatePreferences({ hand_guide_enabled: next }).catch(() => {});
      }
      return next;
    });
  };

  // Typing session state
  const [typed, setTyped] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [remainingTime, setRemainingTime] = useState(30);
  const [mistakes, setMistakes] = useState(0);
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
  const [backspaces, setBackspaces] = useState(0);
  const [errorHistory, setErrorHistory] = useState([]);
  const [correctedIndices, setCorrectedIndices] = useState(() => new Set());
  const [wpmGoal, setWpmGoal] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [sessionResults, setSessionResults] = useState(null);
  const [lastKeystroke, setLastKeystroke] = useState(null);

  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const viewportRef = useRef(null);
  const activeCharSpanRef = useRef(null);
  const lastTargetScrollRef = useRef(0);
  const secondTimelineRef = useRef([]);
  const lastSampleSecondRef = useRef(0);

  // Determine current active text
  const currentTargetText = useMemo(() => {
    if (activeCompetition?.challengeText) {
      return activeCompetition.challengeText;
    }
    if (customPrompt) {
      return customPrompt;
    }
    if (mode === 'passage') {
      return PRACTICE_PASSAGES[selectedPassageIndex].text;
    }
    if (mode === 'words') {
      const allWords = PRACTICE_PASSAGES.flatMap((p) => p.text.split(' '));
      return allWords.slice(0, wordLimit).join(' ');
    }
    if (mode === 'accuracy') {
      return 'Precision and cadence define velocity. Never rush the stroke; allow your rhythm to guide each finger accurately.';
    }
    // timed mode default
    return PRACTICE_PASSAGES[selectedPassageIndex].text;
  }, [mode, wordLimit, selectedPassageIndex, customPrompt, activeCompetition]);

  // Automatic line-by-line smooth viewport progression
  useEffect(() => {
    if (!viewportRef.current) return;
    const prefersReducedMotion =
      (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) ||
      (() => {
        try {
          return localStorage.getItem('keyflow_reduced_motion') === 'true';
        } catch {
          return false;
        }
      })();

    if (typed.length === 0) {
      lastTargetScrollRef.current = 0;
      viewportRef.current.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      return;
    }
    const activeSpan = activeCharSpanRef.current;
    if (!activeSpan) return;

    // Use computed line-height or measured span offsetHeight
    const computedLineHeight =
      parseFloat(window.getComputedStyle(viewportRef.current).lineHeight) ||
      activeSpan.offsetHeight ||
      38;
    const spanHeight = computedLineHeight;

    // Relative line top from line 0
    const firstCharSpan = viewportRef.current.querySelector('.char-untyped, .char-correct, .char-incorrect, .char-current') || viewportRef.current.firstElementChild;
    const baseOffsetTop = firstCharSpan ? firstCharSpan.offsetTop : 0;
    const relativeTop = Math.max(0, activeSpan.offsetTop - baseOffsetTop);
    const lineIndex = Math.round(relativeTop / computedLineHeight);

    // Keep active line centered in 3-line viewport:
    // Lines 0 and 1 stay at scrollTop = 0; Line 2 shifts by 1 line, Line 3 by 2 lines, etc.
    const spanTop = lineIndex <= 1 ? 0 : (lineIndex * computedLineHeight);
    const targetScrollTop = Math.max(0, spanTop - spanHeight);

    // Only trigger smooth scroll when crossing into a new line (prevents keystroke animation interruption)
    if (Math.abs(targetScrollTop - lastTargetScrollRef.current) >= 2) {
      lastTargetScrollRef.current = targetScrollTop;
      viewportRef.current.scrollTo({
        top: targetScrollTop,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
    }
  }, [typed.length, currentTargetText]);

  // Next expected character for guide highlight
  const currentTargetChar = useMemo(() => {
    if (!currentTargetText || typed.length >= currentTargetText.length) return null;
    return currentTargetText[typed.length];
  }, [typed, currentTargetText]);

  // Live metrics calculations
  const correctChars = useMemo(() => {
    return countCorrectChars(typed, currentTargetText);
  }, [typed, currentTargetText]);

  const elapsedMinutes = Math.max((elapsedSeconds || 1) / 60, 0.016);
  const liveWpm = startTime ? Math.max(0, Math.round(correctChars / 5 / elapsedMinutes)) : 0;
  // Live Raw Keystroke Accuracy: Correct Entries / (Correct Entries + Incorrect Entries) * 100
  // Backspace does NOT reset or erase mistakes from this calculation!
  const liveAccuracy =
    (correctKeystrokes + mistakes) > 0
      ? calculateRawAccuracy(correctKeystrokes, mistakes)
      : 100;

  // Complete session handler
  const handleCompleteSession = useCallback(
    (duration) => {
      setIsCompleted(true);
      clearInterval(timerRef.current);

      const actualMinutes = Math.max(duration / 60, 0.016);
      const grossWpm = Math.round(typed.length / 5 / actualMinutes);
      const netWpm = Math.max(0, Math.round((typed.length / 5 - mistakes) / actualMinutes));
      const rawAccuracy = calculateRawAccuracy(correctKeystrokes, mistakes);
      const finalTextAccuracy = calculateFinalTextAccuracy(typed, currentTargetText);
      const accuracy = rawAccuracy;

      let tier = 'Typist';
      if (netWpm >= 100) tier = 'Godspeed';
      else if (netWpm >= 80) tier = 'Master';
      else if (netWpm >= 60) tier = 'Expert';
      else if (netWpm >= 40) tier = 'Proficient';

      // Ensure final timeline point exists
      const finalTimeline = [...secondTimelineRef.current];
      const testDurationSec = Math.max(1, Math.round(duration));
      if (finalTimeline.length === 0 || finalTimeline[finalTimeline.length - 1].second !== testDurationSec) {
        finalTimeline.push({
          second: testDurationSec,
          wpm: netWpm,
          rawWpm: grossWpm,
          errors: mistakes,
        });
      }

      const wpmSeries = finalTimeline.map((pt) => pt.wpm);
      const consistency = calculateConsistency(wpmSeries);
      const extraChars = Math.max(0, typed.length - currentTargetText.length);
      const missedChars = Math.max(0, currentTargetText.length - typed.length);

      const results = {
        netWpm,
        grossWpm,
        accuracy: rawAccuracy,
        rawAccuracy,
        finalTextAccuracy,
        consistency,
        duration: testDurationSec,
        mode,
        timeLimit,
        wordLimit,
        correctChars,
        correctKeystrokes,
        mistakes,
        extraChars,
        missedChars,
        backspaces,
        totalChars: typed.length,
        tier,
        isCompetition: Boolean(activeCompetition),
        competitionCode: activeCompetition?.competition?.code || null,
        accuracyTargetPassed: mode === 'accuracy' ? rawAccuracy >= 98 : null,
        wpmGoal,
        wpmGoalPassed: wpmGoal ? netWpm >= wpmGoal : null,
        errorDetails: [...errorHistory],
        timeline: finalTimeline,
        startTime,
      };

      setSessionResults(results);

      // Record in scientific telemetry engine
      recordTelemetrySession({
        userId: user?.id || null,
        wpm: netWpm,
        accuracy: rawAccuracy,
        rawAccuracy,
        finalTextAccuracy,
        durationSeconds: duration,
        totalKeystrokes: correctKeystrokes + mistakes,
        correctKeystrokes,
        incorrectKeystrokes: mistakes,
        backspaces,
        status: rawAccuracy >= 70 ? 'passed' : 'failed',
        sessionType: activeCompetition ? 'competition' : customPrompt ? 'custom' : mode,
        typedText: typed,
      });

      // Async backend sync via practiceAPI
      practiceAPI
        .recordSession({
          session_type: activeCompetition ? 'competition' : customPrompt ? 'custom' : mode,
          duration_seconds: duration,
          total_chars: typed.length,
          correct_chars: correctChars,
          incorrect_chars: mistakes,
          gross_wpm: grossWpm,
          net_wpm: netWpm,
          accuracy: rawAccuracy,
          error_count: mistakes,
        })
        .catch(() => {});

      // If active competition, submit genuine result to competition lobby
      if (activeCompetition && competitionParticipantId) {
        competitionAPI
          .submit(activeCompetition.competition.code, {
            participant_id: competitionParticipantId,
            net_wpm: netWpm,
            gross_wpm: grossWpm,
            accuracy: rawAccuracy,
            duration_seconds: duration,
            correct_chars: correctChars,
            incorrect_chars: mistakes,
          })
          .catch(() => {});
      }
    },
    [typed, mistakes, correctKeystrokes, backspaces, correctChars, currentTargetText, mode, user, activeCompetition, competitionParticipantId, customPrompt, wpmGoal, errorHistory]
  );

  // Key input handler
  const handleInputChange = (e) => {
    if (isCompleted) return;
    const val = e.target.value;

    if (!startTime && val.length > 0) {
      setStartTime(Date.now());
    }

    if (val.length > typed.length) {
      for (let i = typed.length; i < val.length; i++) {
        const expectedChar = currentTargetText[i];
        const actualChar = val[i];
        const isError = actualChar !== expectedChar;
        playClick(isError);
        if (isError) {
          setMistakes((m) => m + 1);
          setCorrectedIndices((prev) => new Set(prev).add(i));
          const textBefore = currentTargetText.slice(0, i);
          const lastSpace = textBefore.lastIndexOf(' ');
          const textAfter = currentTargetText.slice(i);
          const nextSpace = textAfter.indexOf(' ');
          const wordStart = lastSpace === -1 ? 0 : lastSpace + 1;
          const wordEnd = nextSpace === -1 ? currentTargetText.length : i + nextSpace;
          const targetWord = currentTargetText.slice(wordStart, wordEnd).trim();

          setErrorHistory((prev) => [
            ...prev,
            {
              index: i,
              expected: expectedChar,
              actual: actualChar,
              word: targetWord,
              timestamp: Date.now(),
            },
          ]);
        } else {
          setCorrectKeystrokes((c) => c + 1);
        }
      }
      const actualChar = val[val.length - 1];
      setLastKeystroke({ key: actualChar, code: '', id: performance.now() });
    } else if (val.length < typed.length) {
      // Backspace pressed: removes character, does NOT clear previous mistakes or alter error count
      setBackspaces((b) => b + (typed.length - val.length));
      setLastKeystroke({ key: 'backspace', code: 'Backspace', id: performance.now() });
    }

    setTyped(val);

    // End condition for word / passage / custom / accuracy mode
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
    setCorrectKeystrokes(0);
    setBackspaces(0);
    setErrorHistory([]);
    setCorrectedIndices(new Set());
    setIsCompleted(false);
    setSessionResults(null);
    setLastKeystroke(null);
    secondTimelineRef.current = [];
    lastSampleSecondRef.current = 0;
    lastTargetScrollRef.current = 0;
    clearInterval(timerRef.current);
    if (viewportRef.current) {
      viewportRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 40);
  }, [timeLimit]);

  // Apply custom text from studio
  const handleApplyCustomText = ({ prompt, mode: nextMode, timeLimit: nextTime, wordLimit: nextWords }) => {
    setActiveCompetition(null);
    setCustomPrompt(prompt);
    if (nextMode) setMode(nextMode);
    if (nextTime) setTimeLimit(nextTime);
    if (nextWords) setWordLimit(nextWords);
    handleReset();
  };

  // Start Competition Test
  const handleStartCompetitionTest = ({ competition, participantId, challengeText, challengeType, targetLimit }) => {
    setCustomPrompt(null);
    setActiveCompetition({ competition, participantId, challengeText });
    setCompetitionParticipantId(participantId);
    setMode(challengeType === 'timed' ? 'timed' : 'words');
    if (challengeType === 'timed') {
      setTimeLimit(targetLimit);
    } else {
      setWordLimit(targetLimit);
    }
    handleReset();
  };

  // Mode change handler clears custom/competition overrides when selecting standard modes
  const handleModeChange = (newMode) => {
    setCustomPrompt(null);
    setActiveCompetition(null);
    setMode(newMode);
    if (user?.id) {
      profileAPI.updatePreferences({ preferred_mode: newMode }).catch(() => {});
    }
  };

  // Timed countdown & 1-second telemetry sampling effect
  useEffect(() => {
    if (startTime && !isCompleted) {
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsedSeconds(elapsed);

        // Record 1-second telemetry points for graph and consistency calculation
        if (elapsed > 0 && elapsed !== lastSampleSecondRef.current) {
          lastSampleSecondRef.current = elapsed;
          const currentElapsedMinutes = Math.max(elapsed / 60, 0.016);
          const currentGrossWpm = Math.round(typed.length / 5 / currentElapsedMinutes);
          const currentNetWpm = Math.max(0, Math.round((typed.length / 5 - mistakes) / currentElapsedMinutes));
          secondTimelineRef.current.push({
            second: elapsed,
            wpm: currentNetWpm,
            rawWpm: Math.max(currentNetWpm, currentGrossWpm),
            errors: mistakes,
          });
        }

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
  }, [startTime, isCompleted, mode, timeLimit, handleCompleteSession, typed.length, mistakes]);

  // Global Keyboard Shortcuts (Alt+C, Alt+F, Alt+H, Alt+S, Alt+K, Esc)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl &&
        (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable);

      // Allow Esc everywhere to exit focus mode or reset test
      if (e.key === 'Escape') {
        if (focusMode) {
          setFocusMode(false);
        } else {
          handleReset();
        }
        return;
      }

      // Ignore other shortcuts when user is typing in a search or editor input
      if (isInput && activeEl !== inputRef.current) {
        return;
      }

      if (e.altKey) {
        const key = e.key.toLowerCase();
        if (key === 'c') {
          e.preventDefault();
          setCustomStudioOpen((v) => !v);
        } else if (key === 'f') {
          e.preventDefault();
          setFocusMode((v) => !v);
        } else if (key === 'h') {
          e.preventDefault();
          setHistoryOpen((v) => !v);
        } else if (key === 's') {
          e.preventDefault();
          setSavedTextsOpen((v) => !v);
        } else if (key === 'k') {
          e.preventDefault();
          setShortcutsOpen((v) => !v);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleReset, focusMode]);

  // Focus on mount or mode change
  useEffect(() => {
    handleReset();
  }, [mode, timeLimit, wordLimit, selectedPassageIndex, handleReset]);

  return (
    <div className="container-app py-6 sm:py-10">
      <div className="w-full max-w-5xl mx-auto space-y-5">
        {/* Top Banner & Header (Hidden in Focus Mode) */}
        {!focusMode && (
          <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[var(--border)] transition-all">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-[11px] font-mono text-[var(--accent)]">
                <Sparkles className="w-3 h-3" />
                <span>{t('hero.latency') || 'Zero Latency Precision'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] mt-1 tracking-tight">
                {t('nav.workstation') || 'Workstation'}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={User}
                onClick={() => setProfileModalOpen(true)}
                title="Workstation Profile & Settings"
              >
                Profile
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={BookOpen}
                onClick={() => navigate('/academy')}
              >
                {t('hero.exploreAcademy') || 'Academy'}
              </Button>
            </div>
          </div>
        )}

        {/* Focus Mode floating banner */}
        {focusMode && (
          <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--accent)]/40 text-xs font-mono animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <Eye className="w-4 h-4 text-[var(--accent)]" />
              <span>Focus Mode Active • Distraction-free typing</span>
            </div>
            <button
              type="button"
              onClick={() => setFocusMode(false)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--accent)] text-[var(--accent-fg)] font-bold hover:bg-[var(--accent-hover)] transition-colors cursor-pointer"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Exit Focus (Esc)</span>
            </button>
          </div>
        )}

        {/* Workstation Feature Toolbar (Hidden in Focus Mode) */}
        {!focusMode && (
          <WorkstationToolbar
            mode={mode}
            setMode={handleModeChange}
            timeLimit={timeLimit}
            setTimeLimit={(val) => {
              setTimeLimit(val);
              if (user?.id) profileAPI.updatePreferences({ preferred_duration: val }).catch(() => {});
            }}
            wordLimit={wordLimit}
            setWordLimit={(val) => {
              setWordLimit(val);
              if (user?.id) profileAPI.updatePreferences({ preferred_word_count: val }).catch(() => {});
            }}
            selectedPassageIndex={selectedPassageIndex}
            setSelectedPassageIndex={setSelectedPassageIndex}
            passages={PRACTICE_PASSAGES}
            customActive={Boolean(customPrompt)}
            customTitle="Custom Drill"
            activeCompetition={activeCompetition?.competition}
            keyboardGuideOn={keyboardGuideOn}
            toggleKeyboardGuide={toggleKeyboardGuide}
            handGuideOn={handGuideOn}
            toggleHandGuide={toggleHandGuide}
            focusMode={focusMode}
            toggleFocusMode={() => setFocusMode((v) => !v)}
            onOpenCustomStudio={() => setCustomStudioOpen(true)}
            onOpenSavedTexts={() => setSavedTextsOpen(true)}
            onOpenHistory={() => setHistoryOpen(true)}
            onOpenShortcuts={() => setShortcutsOpen(true)}
            onOpenCompetitions={() => setCompetitionsOpen(true)}
            onOpenProfile={() => setProfileModalOpen(true)}
            onResetTest={handleReset}
            t={t}
          />
        )}

        {/* Main Workstation Layout — Dedicated Results Screen or Active Practice Area */}
        <div className="w-full space-y-5">
          {isCompleted && sessionResults ? (
            <DedicatedResultsScreen
              results={sessionResults}
              onRestart={handleReset}
              onNextTest={() => {
                setSelectedPassageIndex((prev) => (prev + 1) % PRACTICE_PASSAGES.length);
                handleReset();
              }}
              onBackToWorkstation={handleReset}
              // Practice Mistakes Drill
              onPracticeMistakes={() => {
                const words = Array.from(
                  new Set(sessionResults.errorDetails.map((e) => e.word).filter(Boolean))
                );
                if (words.length > 0) {
                  handleApplyCustomText({
                    prompt: words.join(' '),
                    mode: 'words',
                    wordLimit: words.length,
                    timeLimit: 30,
                  });
                }
              }}
              onOpenAcademy={() => navigate('/academy')}
              activeCompetition={activeCompetition}
            />
          ) : (
            <>
              {/* Live Telemetry Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-2 text-xs font-mono text-[var(--text-muted)]">
                <div className="flex items-center gap-3 sm:gap-6">
                  <div className="flex items-center gap-1.5">
                    <Gauge className="w-4 h-4 text-[var(--accent)]" />
                    <span className="text-[11px] uppercase">{t('workstation.liveWpm') || 'Live WPM'}</span>
                    <span className="text-base font-bold text-[var(--text-primary)] font-mono">{liveWpm}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-[var(--ui-success)]" />
                    <span className="text-[11px] uppercase">{t('workstation.accuracy') || 'Accuracy'}</span>
                    <span className="text-base font-bold text-[var(--text-primary)] font-mono">{liveAccuracy}%</span>
                  </div>
                  {/* Target Goal Selector */}
                  <div className="flex items-center gap-1.5 pl-1 border-l border-[var(--border)]">
                    <Flag className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[10px] uppercase">Goal</span>
                    <select
                      value={wpmGoal || ''}
                      onChange={(e) => setWpmGoal(e.target.value ? Number(e.target.value) : null)}
                      className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded px-1.5 py-0.5 text-[11px] font-mono text-[var(--text-primary)] cursor-pointer"
                      title="Set Target Speed Goal"
                    >
                      <option value="">None</option>
                      <option value="40">40 WPM</option>
                      <option value="60">60 WPM</option>
                      <option value="80">80 WPM</option>
                      <option value="100">100 WPM</option>
                      <option value="120">120 WPM</option>
                    </select>
                  </div>
                  {mode === 'accuracy' && (
                    <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      98%+ Goal
                    </span>
                  )}
                  {activeCompetition && (
                    <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      <span>Room {activeCompetition.competition.code}</span>
                    </span>
                  )}
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

              {/* Controlled 3-Line Typing Viewport — Smooth Line-by-Line Progression */}
              <div
                onClick={() => inputRef.current && inputRef.current.focus()}
                className={`p-4 sm:p-6 rounded-2xl border min-h-[160px] max-h-[180px] flex flex-col justify-center transition-all cursor-text relative select-none ${
                  isCompleted ? 'opacity-85 border-[var(--border)]' : 'border-[var(--accent)] shadow-sm'
                }`}
                style={{ background: 'var(--bg-surface)' }}
              >
                <div
                  ref={viewportRef}
                  className="overflow-hidden relative leading-relaxed font-mono text-base sm:text-2xl whitespace-pre-wrap break-words"
                  style={{
                    height: 'calc(3 * 1.625em)',
                    maxHeight: 'calc(3 * 1.625em)',
                    scrollBehavior: 'smooth',
                  }}
                >
                  {currentTargetText.split('').map((char, idx) => {
                    const feedback = getCharacterFeedback(idx, typed, currentTargetText, isCompleted, correctedIndices);
                    const isCurrent = idx === typed.length && !isCompleted;
                    return (
                      <span
                        key={idx}
                        ref={isCurrent ? activeCharSpanRef : null}
                        className={feedback.className}
                      >
                        {char === '\n' ? '↵\n' : char}
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
                        if (currentTargetChar === '\t') {
                          handleInputChange({ target: { value: typed + '\t' } });
                        }
                        return;
                      }
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleInputChange({ target: { value: typed + '\n' } });
                        return;
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
              </div>

              {/* Precision Virtual Keyboard + Realistic Hand Overlay (Hidden in Focus Mode) */}
              {!focusMode && (keyboardGuideOn || handGuideOn) && (
                <div className="w-full max-w-[820px] mx-auto flex flex-col items-center pt-2">
                  <KeyboardGuide
                    targetChar={currentTargetChar}
                    lastKeystroke={lastKeystroke}
                    isVisible={keyboardGuideOn}
                    handGuideVisible={handGuideOn}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals & Overlays */}
      <CustomTypingStudio
        isOpen={customStudioOpen}
        onClose={() => {
          setCustomStudioOpen(false);
          if (inputRef.current) inputRef.current.focus();
        }}
        onApplyCustomText={handleApplyCustomText}
        userId={user?.id}
      />

      <SavedTextsModal
        isOpen={savedTextsOpen}
        onClose={() => {
          setSavedTextsOpen(false);
          if (inputRef.current) inputRef.current.focus();
        }}
        onApplyText={(textToApply, count) => {
          handleApplyCustomText({
            prompt: textToApply,
            mode: 'passage',
            wordLimit: count,
            timeLimit: 30,
          });
        }}
        onOpenCustomStudio={() => setCustomStudioOpen(true)}
        userId={user?.id}
      />

      <PracticeHistoryModal
        isOpen={historyOpen}
        onClose={() => {
          setHistoryOpen(false);
          if (inputRef.current) inputRef.current.focus();
        }}
        userId={user?.id}
      />

      <ShortcutsModal
        isOpen={shortcutsOpen}
        onClose={() => {
          setShortcutsOpen(false);
          if (inputRef.current) inputRef.current.focus();
        }}
      />

      <CompetitionModal
        isOpen={competitionsOpen}
        onClose={() => {
          setCompetitionsOpen(false);
          if (inputRef.current) inputRef.current.focus();
        }}
        onStartCompetitionTest={handleStartCompetitionTest}
        user={user}
        activeCompetition={activeCompetition?.competition}
      />

      <TelemetryProfileModal
        isOpen={profileModalOpen}
        onClose={() => {
          setProfileModalOpen(false);
          if (inputRef.current) inputRef.current.focus();
        }}
        initialTab="profile"
      />
    </div>
  );
};
