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
  Pause,
  Play,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { KeyboardGuide } from '../components/academy/KeyboardGuide';
import { getGuidePreferences, saveGuidePreferences } from '../utils/lessonProgress';
import {
  getCharacterFeedback,
  countCorrectChars,
  countUncorrectedErrors,
  calculateGrossWpm,
  calculateNetWpm,
  calculateRawAccuracy,
  calculateFinalTextAccuracy,
  createAuthoritativeSessionResult,
} from '../utils/typingFeedback';
import { useKeyboardSound } from '../context/SoundContext';
import { useI18n } from '../i18n/I18nContext';
import { practiceAPI, profileAPI, competitionAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { recordTelemetrySession } from '../utils/telemetryStorage';
import { generateCustomTypingPrompt } from '../utils/textUtilities';
import { getAuthoritativeFingerForChar } from '../utils/touchTypingMap';

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
    text: 'Typing is the art of translating thought into text without interruption. When your fingers know their places on the keyboard, words flow naturally onto the screen. Every keystroke becomes effortless and rhythmic. A quiet room and a responsive keyboard create an environment where focus deepens. Speed is never the primary goal; precision and steady cadence are what allow true velocity to emerge over sustained practice.',
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
  {
    id: 'deep-cadence-endurance',
    title: 'Architecture of Velocity (10+ Lines)',
    category: 'Endurance',
    text: 'Typing is the disciplined craft of translating thoughts directly into language without friction or hesitation. When your hands rest naturally over the home row anchors, every muscle fiber learns the precise distance to each keycap. Speed is never achieved through frantic exertion; true velocity is born from steady cadence, relaxed breathing, and immaculate precision. As your fingers glide across the rows, keystrokes blend into a continuous mechanical symphony where errors diminish and confidence expands. Notice how maintaining an upright posture and keeping your eyes fixed firmly on the screen frees your conscious mind to focus purely on the flow of concepts. Consistent daily practice rewires neuromuscular pathways until the physical keyboard completely dissolves beneath your fingertips, leaving only the seamless manifestation of pure expression.',
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
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [remainingTime, setRemainingTime] = useState(30);
  const [mistakes, setMistakes] = useState(0);
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
  const [backspaces, setBackspaces] = useState(0);
  const [errorHistory, setErrorHistory] = useState([]);
  const [correctedIndices, setCorrectedIndices] = useState(() => new Set());
  // Persistent session recovery across page reload
  const [isCompleted, setIsCompleted] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.location.search.includes('results=true')) {
        return true;
      }
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('keyflow_last_session_result');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.completedAt && (Date.now() - parsed.completedAt < 7200000)) {
            return true;
          }
        }
      }
    } catch {}
    return false;
  });

  const [sessionResults, setSessionResults] = useState(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('keyflow_last_session_result');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.completedAt && (Date.now() - parsed.completedAt < 7200000)) {
            return parsed;
          }
        }
      }
    } catch {}
    return null;
  });

  const [lastKeystroke, setLastKeystroke] = useState(null);

  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const totalActiveMsRef = useRef(0);
  const runningSegmentStartRef = useRef(null);
  const lastKeystrokeTimeRef = useRef(null);

  // Synchronous session tracker ref ensuring zero event loss & immunity to stale closures
  const sessionTrackerRef = useRef({
    sessionId: null,
    startedAt: null,
    typed: '',
    correctKeystrokes: 0,
    mistakes: 0,
    backspaces: 0,
    correctedIndices: new Set(),
    errorHistory: [],
    secondTimeline: [],
    lastSampleSecond: 0,
    isCompleted: false,
    characterStats: {},
  });

  const [wpmGoal, setWpmGoalState] = useState(() => {
    try {
      const saved = localStorage.getItem('keyflow_workstation_wpm_goal');
      return saved ? Number(saved) : null;
    } catch {
      return null;
    }
  });

  // Derive explicit session states (Idle, Running, Paused, Completed)
  const sessionState = isCompleted
    ? 'completed'
    : isPaused
    ? 'paused'
    : startTime
    ? 'running'
    : 'idle';
  const isRunning = sessionState === 'running';

  const getActiveElapsedMs = useCallback(() => {
    const runningMs = runningSegmentStartRef.current ? Date.now() - runningSegmentStartRef.current : 0;
    return totalActiveMsRef.current + runningMs;
  }, []);

  const getActiveElapsedSeconds = useCallback(() => {
    return Math.floor(getActiveElapsedMs() / 1000);
  }, [getActiveElapsedMs]);

  // Pause session handler
  const handlePause = useCallback(() => {
    if (isCompleted || isPaused || !startTime) return;
    if (runningSegmentStartRef.current) {
      totalActiveMsRef.current += Date.now() - runningSegmentStartRef.current;
      runningSegmentStartRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPaused(true);
  }, [isCompleted, isPaused, startTime]);

  // Resume session handler
  const handleResume = useCallback(() => {
    if (isCompleted || !isPaused || !startTime) return;
    runningSegmentStartRef.current = Date.now();
    setIsPaused(false);
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 20);
  }, [isCompleted, isPaused, startTime]);

  // Toggle pause/resume handler
  const handleTogglePause = useCallback(() => {
    if (isPaused) {
      handleResume();
    } else if (startTime && !isCompleted) {
      handlePause();
    }
  }, [isPaused, startTime, isCompleted, handleResume, handlePause]);

  const setWpmGoal = useCallback((val) => {
    const num = val ? Number(val) : null;
    setWpmGoalState(num);
    try {
      if (num) {
        localStorage.setItem('keyflow_workstation_wpm_goal', String(num));
      } else {
        localStorage.removeItem('keyflow_workstation_wpm_goal');
      }
    } catch {}
  }, []);

  // 10 to 500 WPM in increments of 10 + None (PHASE 5)
  const WPM_GOAL_OPTIONS = useMemo(() => {
    const opts = [{ value: '', label: 'None' }];
    for (let w = 10; w <= 500; w += 10) {
      opts.push({ value: String(w), label: `${w} WPM` });
    }
    return opts;
  }, []);

  // Dynamic Custom Generation Mode State (PHASE 11)
  const [customGenerationMode, setCustomGenerationModeState] = useState(() => {
    try {
      return localStorage.getItem('keyflow_workstation_custom_gen_mode') || 'simple';
    } catch {
      return 'simple';
    }
  });

  const setCustomGenerationMode = useCallback((newMode) => {
    setCustomGenerationModeState(newMode);
    try {
      localStorage.setItem('keyflow_workstation_custom_gen_mode', newMode);
    } catch {}
  }, []);

  // Ergonomic preferences (font size, anxiety-free live speed toggle)
  const [fontSize, setFontSizeState] = useState(() => {
    try {
      return localStorage.getItem('keyflow_workstation_fontsize') || 'normal';
    } catch {
      return 'normal';
    }
  });

  const setFontSize = (size) => {
    setFontSizeState(size);
    try {
      localStorage.setItem('keyflow_workstation_fontsize', size);
    } catch {}
  };

  const [showLiveWpm, setShowLiveWpmState] = useState(() => {
    try {
      return localStorage.getItem('keyflow_workstation_show_live_wpm') !== 'false';
    } catch {
      return true;
    }
  });

  const setShowLiveWpm = (val) => {
    setShowLiveWpmState((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      try {
        localStorage.setItem('keyflow_workstation_show_live_wpm', String(next));
      } catch {}
      return next;
    });
  };

  const viewportRef = useRef(null);
  const textTrackRef = useRef(null);
  const activeCharSpanRef = useRef(null);
  const pacingLineRef = useRef(null);
  const [scrollLine, setScrollLine] = useState(0);
  const [scrollOffsetPx, setScrollOffsetPx] = useState(0);
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
    // timed mode default: chain passages so typists at any duration (15s, 30s, 60s, 120s) never run out of text
    if (mode === 'timed') {
      // For longer timed durations (timeLimit >= 60) and standard durations, chain passages so text never runs out
      if (timeLimit >= 60 || timeLimit < 60) {
        return PRACTICE_PASSAGES.map((item) => item.text).join(' ');
      }
      return PRACTICE_PASSAGES.map((item) => item.text).join(' ');
    }
    return PRACTICE_PASSAGES[selectedPassageIndex].text;
  }, [mode, wordLimit, selectedPassageIndex, customPrompt, activeCompetition, timeLimit]);

  // ── Precision 4-Line Rendered-Line Auto-Scrolling ─────────────────────────
  // The viewport strictly displays exactly 4 visible lines at all times.
  // When active typing progresses into the 3rd visible line (lineIndex >= 2),
  // smoothly translate the text track upward by exactly 1 line height so the active
  // line moves to the 2nd visible position (index 1), revealing the next upcoming line at bottom.
  useEffect(() => {
    if (!viewportRef.current || isCompleted || isPaused) return;
    if (!textTrackRef.current) return;

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
      if (scrollLine !== 0 || scrollOffsetPx !== 0) {
        setScrollLine(0);
        setScrollOffsetPx(0);
      }
      return;
    }

    const activeSpan = activeCharSpanRef.current;
    if (!activeSpan) return;

    const firstCharSpan = textTrackRef.current.querySelector('.typing-char') || textTrackRef.current.firstElementChild;
    if (!firstCharSpan) return;

    // Accurate rendered line-height
    const computedLineHeight =
      parseFloat(window.getComputedStyle(viewportRef.current).lineHeight) ||
      activeSpan.offsetHeight ||
      39;

    // Relative vertical position of active character from Line 1 (0-indexed)
    const baseOffsetTop = firstCharSpan.offsetTop;
    const relativeTop = Math.max(0, activeSpan.offsetTop - baseOffsetTop);
    
    // Accurate 0-indexed rendered line row: Line 0, Line 1, Line 2, Line 3, ...
    const activeRow = Math.round(relativeTop / computedLineHeight);

    // Precision line calculation: targetScrollTop = Math.max(0, spanTop - spanHeight)
    // where spanTop is relative to line 1 and spanHeight is one rendered line
    const spanHeight = computedLineHeight;
    const spanTop = activeRow * spanHeight;
    const targetScrollTop = Math.max(0, spanTop - spanHeight);
    const targetScrollLine = Math.round(targetScrollTop / computedLineHeight);

    if (targetScrollLine !== scrollLine) {
      setScrollLine(targetScrollLine);
      setScrollOffsetPx(targetScrollTop);
    }
  }, [typed.length, currentTargetText, fontSize, isCompleted, isPaused, scrollLine, scrollOffsetPx]);

  // Window resize handler ensures line alignment is preserved on responsive width changes
  useEffect(() => {
    const handleResize = () => {
      if (!viewportRef.current || !textTrackRef.current) return;
      const computedLineHeight =
        parseFloat(window.getComputedStyle(viewportRef.current).lineHeight) ||
        39;
      setScrollOffsetPx(scrollLine * computedLineHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [scrollLine]);

  // ── Real WPM Pacing Guide Line Animation (PHASE 6) ─────────────────────────
  // Glides smoothly at the selected target speed (wpmGoal * 5 / 60 chars/sec).
  // Hidden when wpmGoal is None, pauses when paused, resets on reset.
  useEffect(() => {
    if (!wpmGoal || !startTime || isCompleted || !viewportRef.current) {
      if (pacingLineRef.current) {
        pacingLineRef.current.style.display = 'none';
      }
      return;
    }

    if (isPaused) {
      // Keep pacing line at its current position without running animation frame
      return;
    }

    let animFrameId = null;
    const targetCharsPerSec = (wpmGoal * 5) / 60; // Standard 5 chars/word

    const updatePacingLine = () => {
      if (!viewportRef.current || !pacingLineRef.current) return;
      const elapsed = getActiveElapsedMs() / 1000;
      const targetCharIdxFloat = elapsed * targetCharsPerSec;
      const targetCharIdx = Math.min(
        Math.floor(targetCharIdxFloat),
        Math.max(0, currentTargetText.length - 1)
      );
      const fraction = targetCharIdxFloat - Math.floor(targetCharIdxFloat);

      const spans = viewportRef.current.querySelectorAll('.typing-char');
      const span = spans[targetCharIdx];
      if (span) {
        const left = span.offsetLeft + (span.offsetWidth * fraction);
        const top = span.offsetTop;
        const height = span.offsetHeight || 38;

        pacingLineRef.current.style.display = 'block';
        pacingLineRef.current.style.transform = `translate3d(${left}px, ${top}px, 0)`;
        pacingLineRef.current.style.height = `${height}px`;
      }

      if (!isCompleted && !isPaused && targetCharIdx < currentTargetText.length - 1) {
        animFrameId = requestAnimationFrame(updatePacingLine);
      }
    };

    animFrameId = requestAnimationFrame(updatePacingLine);
    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
    };
  }, [wpmGoal, startTime, isCompleted, isPaused, currentTargetText, getActiveElapsedMs]);

  // Next expected character for guide highlight
  const currentTargetChar = useMemo(() => {
    if (!currentTargetText || typed.length >= currentTargetText.length) return null;
    return currentTargetText[typed.length];
  }, [typed, currentTargetText]);

  // Live metrics calculations
  const correctChars = useMemo(() => {
    return countCorrectChars(typed, currentTargetText);
  }, [typed, currentTargetText]);

  const totalKeystrokesTyped = correctKeystrokes + mistakes;
  const activeElapsedMs = startTime && !isPaused ? getActiveElapsedMs() : (elapsedSeconds * 1000);
  const activeElapsedSec = activeElapsedMs / 1000;
  // During first 500ms, prevent wild mathematical spikes from single keystrokes
  const liveGrossWpm = startTime && activeElapsedSec >= 0.5
    ? calculateGrossWpm(totalKeystrokesTyped, activeElapsedSec)
    : 0;
  const liveUncorrected = countUncorrectedErrors(typed, currentTargetText);
  const liveNetWpm = startTime && activeElapsedSec >= 0.5
    ? calculateNetWpm(liveGrossWpm, liveUncorrected, activeElapsedSec)
    : 0;
  const liveWpm = liveGrossWpm;
  // Live Raw Keystroke Accuracy: Correct Entries / (Correct Entries + Incorrect Entries) * 100
  // Backspace does NOT reset or erase mistakes from this calculation!
  const liveAccuracy =
    totalKeystrokesTyped > 0
      ? calculateRawAccuracy(correctKeystrokes, mistakes)
      : 100;

  // Complete session handler
  const handleCompleteSession = useCallback(
    (duration, synchronousTracker = null) => {
      // Prevent duplicate finalization
      if (sessionTrackerRef.current.isCompleted) return;
      sessionTrackerRef.current.isCompleted = true;

      setIsCompleted(true);
      setIsPaused(false);

      if (runningSegmentStartRef.current) {
        totalActiveMsRef.current += Date.now() - runningSegmentStartRef.current;
        runningSegmentStartRef.current = null;
      }

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const tracker = synchronousTracker || sessionTrackerRef.current;
      const finalTyped = tracker.typed ?? typed;
      const finalCorrect = tracker.correctKeystrokes ?? correctKeystrokes;
      const finalMistakes = tracker.mistakes ?? mistakes;
      const finalBackspaces = tracker.backspaces ?? backspaces;
      const finalErrors = [...(tracker.errorHistory || errorHistory)];

      const finalElapsedMs = totalActiveMsRef.current;
      const testDurationSec = Math.max(1, Math.round(duration || (finalElapsedMs / 1000) || 1));
      const totalValidEntries = finalCorrect + finalMistakes;

      const grossWpm = calculateGrossWpm(totalValidEntries, testDurationSec);
      const remainingErrors = countUncorrectedErrors(finalTyped, currentTargetText);
      const correctedMistakes = Math.max(0, finalMistakes - remainingErrors);
      const netWpm = calculateNetWpm(grossWpm, remainingErrors, testDurationSec);
      const rawAccuracy = calculateRawAccuracy(finalCorrect, finalMistakes);
      const finalTextAccuracy = calculateFinalTextAccuracy(finalTyped, currentTargetText);

      let tier = 'Typist';
      if (grossWpm >= 100) tier = 'Godspeed';
      else if (grossWpm >= 80) tier = 'Master';
      else if (grossWpm >= 60) tier = 'Expert';
      else if (grossWpm >= 40) tier = 'Proficient';

      // Ensure final timeline point exists with authentic Gross WPM
      const finalTimeline = [...(tracker.secondTimeline?.length ? tracker.secondTimeline : secondTimelineRef.current)];
      if (finalTimeline.length === 0 || finalTimeline[finalTimeline.length - 1].second !== testDurationSec) {
        finalTimeline.push({
          second: testDurationSec,
          wpm: grossWpm,
          rawWpm: grossWpm,
          errors: finalMistakes,
        });
      }

      const wpmSeries = finalTimeline.map((pt) => pt.wpm);
      const consistency = calculateConsistency(wpmSeries);
      const extraChars = Math.max(0, finalTyped.length - currentTargetText.length);
      const missedChars = Math.max(0, currentTargetText.length - finalTyped.length);

      const canonicalSessionId = tracker.sessionId || `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

      const results = createAuthoritativeSessionResult({
        sessionId: canonicalSessionId,
        userId: user?.id || null,
        testMode: activeCompetition ? 'competition' : customPrompt ? 'custom' : mode,
        targetText: currentTargetText,
        typed: finalTyped,
        durationSeconds: testDurationSec,
        correctKeystrokes: finalCorrect,
        mistakes: finalMistakes,
        backspaces: finalBackspaces,
        startedAt: tracker.startedAt || startTime || (Date.now() - finalElapsedMs),
        completedAt: Date.now(),
        wpmGoal,
        errorHistory: finalErrors,
        timeline: finalTimeline,
        customFields: {
          consistency,
          timeLimit,
          wordLimit,
          tier,
          isCompetition: Boolean(activeCompetition),
          competitionCode: activeCompetition?.competition?.code || null,
          accuracyTargetPassed: mode === 'accuracy' ? rawAccuracy >= 98 : null,
          extraChars,
          missedChars,
        },
      });

      // Persist canonical session to localStorage for survive-page-refresh guarantee
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('keyflow_last_session_result', JSON.stringify(results));
          if (user?.id) {
            localStorage.setItem(`keyflow_last_session_result_u_${user.id}`, JSON.stringify(results));
          }
        }
      } catch {}

      setSessionResults(results);

      // Compute authentic per-character performance metrics (CPM, WPM, accuracy)
      const rawCharStats = tracker.characterStats || {};
      const finalCharacterStats = {};
      for (const [key, stat] of Object.entries(rawCharStats)) {
        if (!key || !stat) continue;
        const total = Number(stat.total || 0);
        const correct = Number(stat.correct || 0);
        const incorrect = Number(stat.incorrect || 0);
        const avgIntervalMs = stat.intervalCount > 0 ? (stat.intervalSumMs / stat.intervalCount) : 0;
        const cpm = avgIntervalMs > 0 ? Math.round(60000 / avgIntervalMs) : Math.round(grossWpm * 5);
        const wpm = Math.round(cpm / 5);
        const accuracy = total > 0 ? Math.round((correct / total) * 100) : 100;
        finalCharacterStats[key] = {
          char: stat.char || (key === 'space' ? ' ' : key),
          total,
          correct,
          incorrect,
          cpm,
          wpm,
          accuracy,
        };
      }

      // Compute authentic per-finger performance metrics (WPM, accuracy, total keystrokes)
      const fingerBuckets = {
        'left-pinky': { id: 'left-pinky', name: 'Pinky', hand: 'Left', total: 0, correct: 0, incorrect: 0, wpmSum: 0, count: 0 },
        'left-ring': { id: 'left-ring', name: 'Ring', hand: 'Left', total: 0, correct: 0, incorrect: 0, wpmSum: 0, count: 0 },
        'left-middle': { id: 'left-middle', name: 'Middle', hand: 'Left', total: 0, correct: 0, incorrect: 0, wpmSum: 0, count: 0 },
        'left-index': { id: 'left-index', name: 'Index', hand: 'Left', total: 0, correct: 0, incorrect: 0, wpmSum: 0, count: 0 },
        'right-index': { id: 'right-index', name: 'Index', hand: 'Right', total: 0, correct: 0, incorrect: 0, wpmSum: 0, count: 0 },
        'right-middle': { id: 'right-middle', name: 'Middle', hand: 'Right', total: 0, correct: 0, incorrect: 0, wpmSum: 0, count: 0 },
        'right-ring': { id: 'right-ring', name: 'Ring', hand: 'Right', total: 0, correct: 0, incorrect: 0, wpmSum: 0, count: 0 },
        'right-pinky': { id: 'right-pinky', name: 'Pinky', hand: 'Right', total: 0, correct: 0, incorrect: 0, wpmSum: 0, count: 0 },
        'thumb': { id: 'thumb', name: 'Thumbs', hand: 'Thumbs', total: 0, correct: 0, incorrect: 0, wpmSum: 0, count: 0 },
      };

      for (const [key, stat] of Object.entries(finalCharacterStats)) {
        const fingerId = getAuthoritativeFingerForChar(stat.char || key);
        if (fingerId && fingerBuckets[fingerId]) {
          const b = fingerBuckets[fingerId];
          b.total += stat.total;
          b.correct += stat.correct;
          b.incorrect += stat.incorrect;
          if (stat.wpm > 0) {
            b.wpmSum += stat.wpm * stat.total;
            b.count += stat.total;
          }
        }
      }

      const finalFingerStats = {};
      for (const [fId, b] of Object.entries(fingerBuckets)) {
        if (b.total > 0) {
          const speed = b.count > 0 ? Math.round(b.wpmSum / b.count) : grossWpm;
          const acc = Math.round((b.correct / b.total) * 100);
          finalFingerStats[fId] = {
            id: fId,
            speed,
            wpm: speed,
            accuracy: acc,
            total: b.total,
            totalKeystrokes: b.total,
            correct: b.correct,
            incorrect: b.incorrect,
            hasData: b.total >= 3,
          };
        }
      }

      // Record in scientific telemetry engine
      recordTelemetrySession({
        userId: user?.id || null,
        id: canonicalSessionId,
        sessionId: canonicalSessionId,
        wpm: grossWpm,
        netWpm,
        grossWpm,
        accuracy: rawAccuracy,
        rawAccuracy,
        finalTextAccuracy,
        durationSeconds: testDurationSec,
        totalKeystrokes: totalValidEntries,
        totalChars: totalValidEntries,
        correctKeystrokes: finalCorrect,
        incorrectKeystrokes: finalMistakes,
        mistakes: finalMistakes,
        correctedMistakes,
        remainingErrors,
        backspaces: finalBackspaces,
        status: rawAccuracy >= 70 ? 'passed' : 'failed',
        sessionType: activeCompetition ? 'competition' : customPrompt ? 'custom' : mode,
        typedText: finalTyped,
        characterStats: finalCharacterStats,
        fingerStats: finalFingerStats,
      });

      // Async backend sync via practiceAPI with idempotency key
      practiceAPI
        .recordSession({
          session_id: canonicalSessionId,
          session_type: activeCompetition ? 'competition' : customPrompt ? 'custom' : mode,
          duration_seconds: testDurationSec,
          total_chars: totalValidEntries,
          correct_chars: finalCorrect,
          incorrect_chars: finalMistakes,
          gross_wpm: grossWpm,
          net_wpm: netWpm,
          accuracy: rawAccuracy,
          error_count: remainingErrors,
          character_stats: finalCharacterStats,
          finger_stats: finalFingerStats,
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
            duration_seconds: testDurationSec,
            correct_chars: finalCorrect,
            incorrect_chars: finalMistakes,
          })
          .catch(() => {});
      }
    },
    [typed, mistakes, correctKeystrokes, backspaces, currentTargetText, mode, timeLimit, wordLimit, user, activeCompetition, competitionParticipantId, customPrompt, wpmGoal, errorHistory, startTime]
  );

  // Key input handler
  const handleInputChange = (e) => {
    if (isCompleted || isPaused) return;
    const val = e.target.value;

    if (!startTime && val.length > 0) {
      const now = Date.now();
      setStartTime(now);
      totalActiveMsRef.current = 0;
      runningSegmentStartRef.current = now;
      lastKeystrokeTimeRef.current = performance.now();
      sessionTrackerRef.current.startedAt = now;
      sessionTrackerRef.current.sessionId = `sess_${now}_${Math.random().toString(36).slice(2, 9)}`;
      sessionTrackerRef.current.isCompleted = false;
      sessionTrackerRef.current.characterStats = {};
      setIsPaused(false);
    }

    if (val.length > typed.length) {
      const isBulk = (val.length - typed.length) > 2;
      let hasErrorInBulk = false;

      for (let i = typed.length; i < val.length; i++) {
        const expectedChar = currentTargetText[i];
        const actualChar = val[i];
        const isError = actualChar !== expectedChar;
        if (!isBulk) {
          playClick(isError);
        } else if (isError) {
          hasErrorInBulk = true;
        }

        // Authentic per-character performance & interval tracking
        const charKey = expectedChar === ' ' ? 'space' : expectedChar.toLowerCase();
        if (!sessionTrackerRef.current.characterStats) {
          sessionTrackerRef.current.characterStats = {};
        }
        if (!sessionTrackerRef.current.characterStats[charKey]) {
          sessionTrackerRef.current.characterStats[charKey] = {
            char: expectedChar,
            total: 0,
            correct: 0,
            incorrect: 0,
            intervalSumMs: 0,
            intervalCount: 0,
          };
        }
        const cEntry = sessionTrackerRef.current.characterStats[charKey];
        cEntry.total += 1;

        const nowPerf = performance.now();
        if (lastKeystrokeTimeRef.current) {
          const deltaMs = Math.min(2500, Math.max(15, nowPerf - lastKeystrokeTimeRef.current));
          cEntry.intervalSumMs += deltaMs;
          cEntry.intervalCount += 1;
        }
        lastKeystrokeTimeRef.current = nowPerf;

        if (isError) {
          cEntry.incorrect += 1;
          sessionTrackerRef.current.mistakes += 1;
          sessionTrackerRef.current.correctedIndices.add(i);

          setMistakes((m) => m + 1);
          setCorrectedIndices((prev) => new Set(prev).add(i));

          const textBefore = currentTargetText.slice(0, i);
          const lastSpace = textBefore.lastIndexOf(' ');
          const textAfter = currentTargetText.slice(i);
          const nextSpace = textAfter.indexOf(' ');
          const wordStart = lastSpace === -1 ? 0 : lastSpace + 1;
          const wordEnd = nextSpace === -1 ? currentTargetText.length : i + nextSpace;
          const targetWord = currentTargetText.slice(wordStart, wordEnd).trim();

          const errItem = {
            index: i,
            expected: expectedChar,
            actual: actualChar,
            word: targetWord,
            timestamp: Date.now(),
          };
          sessionTrackerRef.current.errorHistory.push(errItem);
          setErrorHistory((prev) => [...prev, errItem]);
        } else {
          cEntry.correct += 1;
          sessionTrackerRef.current.correctKeystrokes += 1;
          setCorrectKeystrokes((c) => c + 1);
        }
      }
      if (isBulk) {
        playClick(hasErrorInBulk);
      }
      const actualChar = val[val.length - 1];
      setLastKeystroke({ key: actualChar, code: '', id: performance.now() });
    } else if (val.length < typed.length) {
      // Backspace pressed: removes character, does NOT clear previous mistakes or alter error count
      const count = typed.length - val.length;
      lastKeystrokeTimeRef.current = performance.now();
      sessionTrackerRef.current.backspaces += count;
      setBackspaces((b) => b + count);
      setLastKeystroke({ key: 'backspace', code: 'Backspace', id: performance.now() });
    }

    sessionTrackerRef.current.typed = val;
    setTyped(val);

    // End condition for word / passage / custom / accuracy mode
    if (val.length >= currentTargetText.length) {
      const activeMs = getActiveElapsedMs();
      const dur = Math.max(1, Math.round(activeMs / 1000));
      handleCompleteSession(dur, sessionTrackerRef.current);
    }
  };

  // Reset test
  const handleReset = useCallback(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('keyflow_last_session_result');
        if (user?.id) {
          localStorage.removeItem(`keyflow_last_session_result_u_${user.id}`);
        }
      }
    } catch {}

    setTyped('');
    setStartTime(null);
    setIsPaused(false);
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
    totalActiveMsRef.current = 0;
    runningSegmentStartRef.current = null;
    secondTimelineRef.current = [];
    lastSampleSecondRef.current = 0;
    setScrollLine(0);
    setScrollOffsetPx(0);
    lastKeystrokeTimeRef.current = null;

    sessionTrackerRef.current = {
      sessionId: null,
      startedAt: null,
      typed: '',
      correctKeystrokes: 0,
      mistakes: 0,
      backspaces: 0,
      correctedIndices: new Set(),
      errorHistory: [],
      secondTimeline: [],
      lastSampleSecond: 0,
      isCompleted: false,
      characterStats: {},
    };

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (viewportRef.current) {
      viewportRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 40);
  }, [timeLimit, user]);

  // Apply custom text from studio
  const handleApplyCustomText = ({ prompt, mode: nextMode, timeLimit: nextTime, wordLimit: nextWords }) => {
    setActiveCompetition(null);
    setCustomPrompt(prompt);
    if (nextMode) setMode(nextMode);
    if (nextTime) setTimeLimit(nextTime);
    if (nextWords) setWordLimit(nextWords);
    handleReset();
  };

  // Trigger custom generation mode action from toolbar (PHASE 11)
  const handleTriggerCustomMode = useCallback(() => {
    const rawSource = customPrompt || currentTargetText;
    const generated = generateCustomTypingPrompt({
      sourceText: rawSource,
      generationMode: customGenerationMode,
      limitType: 'words',
      limitValue: 30,
      includePunctuation: true,
      includeNumbers: true,
    });
    if (generated) {
      setActiveCompetition(null);
      setCustomPrompt(generated);
      handleReset();
    }
  }, [customPrompt, currentTargetText, customGenerationMode, handleReset]);

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
    if (startTime && !isCompleted && !isPaused) {
      timerRef.current = setInterval(() => {
        const elapsed = getActiveElapsedSeconds();
        setElapsedSeconds(elapsed);

        // Record 1-second telemetry points for graph and consistency calculation
        if (elapsed > 0 && elapsed !== lastSampleSecondRef.current) {
          lastSampleSecondRef.current = elapsed;
          const tracker = sessionTrackerRef.current;
          const totalValid = tracker.correctKeystrokes + tracker.mistakes;
          const currentGrossWpm = calculateGrossWpm(totalValid, elapsed);
          const currentUncorrected = countUncorrectedErrors(tracker.typed, currentTargetText);
          const currentNetWpm = calculateNetWpm(currentGrossWpm, currentUncorrected, elapsed);
          const pt = {
            second: elapsed,
            wpm: currentGrossWpm,
            rawWpm: currentGrossWpm,
            errors: tracker.mistakes,
          };
          secondTimelineRef.current.push(pt);
          sessionTrackerRef.current.secondTimeline.push(pt);
        }

        if (mode === 'timed') {
          const rem = Math.max(0, timeLimit - elapsed);
          setRemainingTime(rem);
          if (rem <= 0) {
            handleCompleteSession(timeLimit, sessionTrackerRef.current);
          }
        }
      }, 250);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [startTime, isCompleted, isPaused, mode, timeLimit, handleCompleteSession, currentTargetText, getActiveElapsedSeconds]);

  // Auto-pause active test when user leaves the browser tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && startTime && !isCompleted && !isPaused) {
        handlePause();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [startTime, isCompleted, isPaused, handlePause]);

  // Global Keyboard Shortcuts (Alt+C, Alt+F, Alt+H, Alt+S, Alt+K, Alt+P, Esc)
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
        if (key === 'p') {
          e.preventDefault();
          handleTogglePause();
        } else if (key === 'c') {
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
  }, [handleReset, focusMode, handleTogglePause]);

  // Prevent accidental tab closure (e.g. hitting Ctrl+W during fast typing) while active test is running
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (startTime && !isCompleted && typed.length > 5) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [startTime, isCompleted, typed.length]);

  // Focus on mount or mode change (Strictly preserves completed results on reload & React StrictMode)
  const prevSettingsRef = useRef({ mode, timeLimit, wordLimit, selectedPassageIndex });
  useEffect(() => {
    const prev = prevSettingsRef.current;
    const hasChanged =
      prev.mode !== mode ||
      prev.timeLimit !== timeLimit ||
      prev.wordLimit !== wordLimit ||
      prev.selectedPassageIndex !== selectedPassageIndex;
    prevSettingsRef.current = { mode, timeLimit, wordLimit, selectedPassageIndex };

    if (hasChanged) {
      handleReset();
    } else if (!isCompleted && !sessionResults) {
      if (inputRef.current) inputRef.current.focus();
    }
  }, [mode, timeLimit, wordLimit, selectedPassageIndex, handleReset, isCompleted, sessionResults]);

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
          <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--accent)]/40 text-xs font-mono animate-in fade-in duration-240 ease-[cubic-bezier(0.22,1,0.36,1)]">
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

        {/* Workstation Feature Toolbar (Hidden in Focus Mode or when Results Screen is active) */}
        {!focusMode && !(isCompleted && sessionResults) && (
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
            fontSize={fontSize}
            setFontSize={setFontSize}
            showLiveWpm={showLiveWpm}
            setShowLiveWpm={setShowLiveWpm}
            customGenerationMode={customGenerationMode}
            onTriggerCustomMode={handleTriggerCustomMode}
            isPaused={isPaused}
            isRunning={isRunning}
            sessionState={sessionState}
            onTogglePause={handleTogglePause}
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
                    <span className="text-base font-bold text-[var(--text-primary)] font-mono">
                      {showLiveWpm ? liveWpm : '—'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-[var(--ui-success)]" />
                    <span className="text-[11px] uppercase">{t('workstation.accuracy') || 'Accuracy'}</span>
                    <span className="text-base font-bold text-[var(--text-primary)] font-mono">{liveAccuracy}%</span>
                  </div>
                  {/* Target Goal Selector (PHASE 5: 10 to 500 WPM in increments of 10) */}
                  <div className="flex items-center gap-1.5 pl-1 border-l border-[var(--border)]">
                    <Flag className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[10px] uppercase">Goal</span>
                    <select
                      value={wpmGoal || ''}
                      onChange={(e) => setWpmGoal(e.target.value ? Number(e.target.value) : null)}
                      className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded px-1.5 py-0.5 text-[11px] font-mono text-[var(--text-primary)] cursor-pointer"
                      title="Set Target Speed Goal (10 to 500 WPM in increments of 10)"
                    >
                      {WPM_GOAL_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
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
                  {isPaused && (
                    <div
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-500 font-mono text-[11px] font-bold tracking-wider uppercase animate-pulse shrink-0"
                      role="status"
                      aria-live="polite"
                    >
                      <Pause className="w-3 h-3 fill-amber-500" />
                      <span>PAUSED</span>
                    </div>
                  )}
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

              {/* Controlled 4-Line Typing Viewport (PHASE 7) — Smooth Line-by-Line Progression (PHASE 4) */}
              <div
                onClick={() => {
                  if (isPaused) {
                    handleResume();
                  } else if (inputRef.current) {
                    inputRef.current.focus();
                  }
                }}
                className={`p-4 sm:p-6 rounded-2xl border min-h-[160px] max-h-[180px] sm:min-h-[190px] sm:max-h-[225px] flex flex-col justify-center transition-all cursor-text relative select-none ${
                  isCompleted ? 'opacity-85 border-[var(--border)]' : 'border-[var(--accent)] shadow-sm'
                }`}
                style={{ background: 'var(--bg-surface)' }}
              >
                {/* Non-intrusive PAUSED badge overlay */}
                {isPaused && (
                  <div
                    className="absolute top-2.5 right-3 z-20 flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[var(--bg-elevated)]/95 backdrop-blur-xs border border-amber-500/40 text-amber-500 font-mono text-xs font-semibold shadow-xs animate-in fade-in select-none cursor-pointer"
                    role="status"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResume();
                    }}
                    title="Session is paused. Click here, press Resume, or press Space/Enter to continue."
                  >
                    <Pause className="w-3.5 h-3.5 fill-amber-500" />
                    <span>PAUSED</span>
                    <span className="text-[var(--text-muted)] text-[11px] hidden sm:inline">• Click or Space to Resume</span>
                  </div>
                )}
                <div
                  ref={viewportRef}
                  className={`overflow-hidden relative leading-relaxed font-mono whitespace-pre-wrap break-words ${
                    fontSize === 'large'
                      ? 'text-lg sm:text-3xl'
                      : fontSize === 'compact'
                      ? 'text-sm sm:text-lg'
                      : 'text-base sm:text-2xl'
                  }`}
                  style={{
                    height: 'calc(4 * 1.625em)',
                    maxHeight: 'calc(4 * 1.625em)',
                    scrollBehavior: 'smooth',
                  }}
                >
                  {/* Moving Text Layer with GPU-accelerated translation */}
                  <div
                    ref={textTrackRef}
                    className="will-change-transform"
                    style={{
                      transform: `translate3d(0, -${scrollOffsetPx}px, 0)`,
                      transition:
                        (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) ||
                        (() => {
                          try {
                            return localStorage.getItem('keyflow_reduced_motion') === 'true';
                          } catch {
                            return false;
                          }
                        })()
                          ? 'none'
                          : 'transform 200ms cubic-bezier(0.2, 0, 0, 1)',
                    }}
                  >
                    {/* Subtle WPM Pacing Guide Line (PHASE 6) */}
                    <div
                      ref={pacingLineRef}
                      className="absolute top-0 left-0 w-[2px] pointer-events-none z-10 transition-none"
                      style={{
                        display: 'none',
                        backgroundColor: 'rgba(100, 116, 139, 0.75)',
                        boxShadow: '0 0 3px rgba(100, 116, 139, 0.4)',
                      }}
                    >
                      <div className="absolute -top-1 -left-[3px] w-2 h-2 rounded-full bg-slate-500/90 shadow-xs" />
                    </div>

                    {currentTargetText.split('').map((char, idx) => {
                      const feedback = getCharacterFeedback(idx, typed, currentTargetText, isCompleted, correctedIndices);
                      const isCurrent =
                        (idx === typed.length && !isCompleted) ||
                        (idx === currentTargetText.length - 1 && typed.length >= currentTargetText.length);
                      return (
                        <span
                          key={idx}
                          ref={isCurrent ? activeCharSpanRef : null}
                          className={`${feedback.className} typing-char`}
                        >
                          {char === '\n' ? '↵\n' : char}
                        </span>
                      );
                    })}
                  </div>

                  <input
                    ref={inputRef}
                    type="text"
                    value={typed}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                      if (isCompleted) return;
                      if (e.key === 'Escape') return;
                      if (isPaused) {
                        if (e.key === ' ' || e.key === 'Enter') {
                          e.preventDefault();
                          handleResume();
                          return;
                        }
                        e.preventDefault();
                        return;
                      }
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
                      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Escape'].includes(e.key)) {
                        return;
                      }
                      setLastKeystroke({ key: e.key, code: e.code, id: performance.now() });
                    }}
                    disabled={isCompleted}
                    onPaste={(e) => e.preventDefault()}
                    className="absolute inset-0 opacity-0 cursor-default pointer-events-auto z-10"
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
        generationMode={customGenerationMode}
        onGenerationModeChange={setCustomGenerationMode}
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
