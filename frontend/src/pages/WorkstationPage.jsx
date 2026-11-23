import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RotateCcw,
  Gauge,
  Target,
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
import { CapsLockNotification } from '../components/common/CapsLockNotification';
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
import { usePlatformConfig } from '../context/PlatformConfigContext';
import { recordTelemetrySession } from '../utils/telemetryStorage';
import { generateCustomTypingPrompt } from '../utils/textUtilities';
import { getAuthoritativeFingerForChar } from '../utils/touchTypingMap';
import { useUniversalTypingFocus } from '../utils/useUniversalTypingFocus';

// New Workstation modular components
import { WorkstationToolbar } from '../components/workstation/WorkstationToolbar';
import { CustomTypingStudio } from '../components/workstation/CustomTypingStudio';
import { SavedTextsModal } from '../components/workstation/SavedTextsModal';
import { PracticeHistoryModal } from '../components/workstation/PracticeHistoryModal';
import { ShortcutsModal } from '../components/workstation/ShortcutsModal';
import { CompetitionModal } from '../components/workstation/CompetitionModal';
import { SoundSystemModal } from '../components/workstation/SoundSystemModal';
import {
  AUTO_PAUSE_INACTIVITY_MS,
  isValidTypingKey,
} from '../utils/workstationAutoPause';

export { AUTO_PAUSE_INACTIVITY_MS, isValidTypingKey };
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

export const createInitialSessionState = (defaults = {}) => ({
  mode: defaults.mode || 'timed',
  timeLimit: defaults.timeLimit || 30,
  wordLimit: defaults.wordLimit || 25,
  selectedPassageIndex: defaults.selectedPassageIndex ?? 0,
  customPrompt: defaults.customPrompt || null,
  originalSourcePassage: defaults.originalSourcePassage || null,
  activeSavedPassageId: defaults.activeSavedPassageId || null,
  customGenerationMode: defaults.customGenerationMode || 'random',
  typed: '',
  startTime: null,
  isPaused: false,
  elapsedSeconds: 0,
  remainingTime: defaults.timeLimit || 30,
  mistakes: 0,
  correctKeystrokes: 0,
  backspaces: 0,
  errorHistory: [],
  correctedIndices: new Set(),
  isCompleted: false,
  sessionResults: null,
  wpmGoal: defaults.wpmGoal || null,
  totalActiveMs: 0,
  runningSegmentStart: null,
  sessionTracker: {
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
  },
});

// Memoized individual character span: skips re-rendering when feedback class and caret status are unchanged
const WorkstationCharacterSpan = React.memo(function WorkstationCharacterSpan({
  char,
  feedbackClassName,
  isCurrent,
  activeRef,
}) {
  return (
    <span
      ref={isCurrent ? activeRef : null}
      className={`${feedbackClassName} typing-char`}
    >
      {char === '\n' ? '↵\n' : char}
    </span>
  );
});

const CHUNK_SIZE = 50;

// High-performance chunk component: isolates DOM reconciliation to only the active typing region (PHASE 7.53)
const WorkstationChunk = React.memo(
  function WorkstationChunk({
    startIndex,
    chars,
    currentTargetText,
    typed,
    isCompleted,
    correctedIndices,
    activeCharSpanRef,
  }) {
    return (
      <>
        {chars.map((char, localIdx) => {
          const idx = startIndex + localIdx;
          const feedback = getCharacterFeedback(idx, typed, currentTargetText, isCompleted, correctedIndices);
          const isCurrent =
            (idx === typed.length && !isCompleted) ||
            (idx === currentTargetText.length - 1 && typed.length >= currentTargetText.length);
          return (
            <WorkstationCharacterSpan
              key={idx}
              char={char}
              feedbackClassName={feedback.className}
              isCurrent={isCurrent}
              activeRef={activeCharSpanRef}
            />
          );
        })}
      </>
    );
  },
  (prev, next) => {
    // If text passage, completion status, or char slice changed, must re-render
    if (prev.currentTargetText !== next.currentTargetText) return false;
    if (prev.isCompleted !== next.isCompleted) return false;
    if (prev.chars !== next.chars) return false;
    if (prev.activeCharSpanRef !== next.activeCharSpanRef) return false;

    const start = prev.startIndex;
    const end = prev.startIndex + prev.chars.length;
    const prevLen = prev.typed.length;
    const nextLen = next.typed.length;

    // Buffer of 2 characters around chunk boundary for caret and previous character feedback
    const buffer = 2;
    const isPrevNear = prevLen >= start - buffer && prevLen <= end + buffer;
    const isNextNear = nextLen >= start - buffer && nextLen <= end + buffer;

    // If typing was or is near this chunk, re-render this chunk
    if (isPrevNear || isNextNear) return false;

    // Both were before this chunk (all chars untyped before and after) -> skip re-render
    if (prevLen < start - buffer && nextLen < start - buffer) return true;

    // Both were after this chunk (all chars typed before and after)
    if (prevLen > end + buffer && nextLen > end + buffer) {
      // Check if chunk text content changed in typed
      if (prev.typed.slice(start, end) !== next.typed.slice(start, end)) {
        return false;
      }
      // Check if correctedIndices changed for an index inside this chunk
      if (prev.correctedIndices !== next.correctedIndices) {
        for (let i = start; i < end; i++) {
          const hadPrev = prev.correctedIndices?.has(i);
          const hadNext = next.correctedIndices?.has(i);
          if (hadPrev !== hadNext) return false;
        }
      }
      return true;
    }

    return false;
  }
);

// Memoized text track: isolates character rendering from timer ticks and unrelated workstation state updates
const WorkstationTextTrack = React.memo(function WorkstationTextTrack({
  currentTargetText,
  typed,
  isCompleted,
  correctedIndices,
  activeCharSpanRef,
  pacingLineRef,
}) {
  const targetChars = useMemo(() => currentTargetText.split(''), [currentTargetText]);

  const chunks = useMemo(() => {
    const list = [];
    const len = targetChars.length;
    for (let i = 0; i < len; i += CHUNK_SIZE) {
      list.push({
        startIndex: i,
        chars: targetChars.slice(i, i + CHUNK_SIZE),
      });
    }
    return list;
  }, [targetChars]);

  return (
    <>
      {/* Subtle WPM Pacing Guide Line (PHASE 6) */}
      <div
        ref={pacingLineRef}
        className="absolute top-0 left-0 w-[2px] pointer-events-none z-10 transition-none"
        style={{
          display: 'none',
          backgroundColor: 'var(--accent)',
          boxShadow: '0 0 4px var(--accent)',
        }}
      >
        <div className="absolute -top-1 -left-[3px] w-2 h-2 rounded-full bg-[var(--accent)] shadow-xs" />
      </div>

      {chunks.map((chunk) => (
        <WorkstationChunk
          key={chunk.startIndex}
          startIndex={chunk.startIndex}
          chars={chunk.chars}
          currentTargetText={currentTargetText}
          typed={typed}
          isCompleted={isCompleted}
          correctedIndices={correctedIndices}
          activeCharSpanRef={activeCharSpanRef}
        />
      ))}
    </>
  );
});

export const WorkstationPage = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user } = useAuth();
  const { config } = usePlatformConfig();

  // Mode settings
  const [mode, setMode] = useState('timed'); // 'timed' | 'words' | 'passage' | 'accuracy'
  const [timeLimit, setTimeLimit] = useState(() => config?.default_duration || 30);

  useEffect(() => {
    if (config?.default_duration && !user?.id) {
      setTimeLimit(config.default_duration);
    }
  }, [config?.default_duration, user?.id]);
  const [wordLimit, setWordLimit] = useState(25);
  const [selectedPassageIndex, setSelectedPassageIndex] = useState(0);

  // Custom text state
  const [customPrompt, setCustomPrompt] = useState(null);
  const [originalSourcePassage, setOriginalSourcePassage] = useState(null);
  const [activeSavedPassageId, setActiveSavedPassageId] = useState(null);

  // Competition state
  const [activeCompetition, setActiveCompetition] = useState(null);
  const [competitionParticipantId, setCompetitionParticipantId] = useState(null);
  const [competitionParticipantToken, setCompetitionParticipantToken] = useState(null);

  // Modals state
  const [customStudioOpen, setCustomStudioOpen] = useState(false);
  const [savedTextsOpen, setSavedTextsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [competitionsOpen, setCompetitionsOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [soundSystemOpen, setSoundSystemOpen] = useState(false);

  // Switch Mode (formerly Focus Mode: alternate clean floating typing interface)
  const [focusMode, setFocusMode] = useState(() => {
    try {
      return localStorage.getItem('keyflow_workstation_switch_mode') === 'true';
    } catch {
      return false;
    }
  });
  const [showGuidesInSwitch, setShowGuidesInSwitch] = useState(false);

  // Independent Page Sessions (Page A: Standard mode, Page B: Switch mode)
  // Guarantees Page A and Page B maintain isolated typing text, typed chars,
  // cursor position, timer, and metrics with zero cross-contamination.
  const pageASessionRef = useRef(null);
  const pageBSessionRef = useRef(null);
  const isSwitchingModeRef = useRef(false);
  if (!pageASessionRef.current) {
    pageASessionRef.current = createInitialSessionState({
      timeLimit: config?.default_duration || 30,
      selectedPassageIndex: 0,
    });
  }
  if (!pageBSessionRef.current) {
    pageBSessionRef.current = createInitialSessionState({
      timeLimit: config?.default_duration || 30,
      selectedPassageIndex: 0,
    });
  }

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
    if (focusMode) {
      setShowGuidesInSwitch(true);
    }
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
    if (focusMode) {
      setShowGuidesInSwitch(true);
    }
  };

  // Typing session state
  const [typed, setTyped] = useState('');
  const typedRef = useRef('');
  typedRef.current = typed;
  const [startTime, setStartTime] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  isPausedRef.current = isPaused;
  const isAutoPausedRef = useRef(false);
  const inactivityTimerRef = useRef(null);
  const lastTypingActionTimestampRef = useRef(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [remainingTime, setRemainingTime] = useState(30);

  // Intelligent Toolbar Auto-Hide While Typing & Mousemove Reveal (Strictly Scoped to Page B)
  const [isToolbarVisible, setIsToolbarVisible] = useState(true);
  const isToolbarVisibleRef = useRef(true);
  useEffect(() => {
    isToolbarVisibleRef.current = isToolbarVisible;
  }, [isToolbarVisible]);

  useEffect(() => {
    const handleMouseMove = () => {
      // Scoped strictly to Page B when toolbar was hidden
      if (focusMode && !isToolbarVisibleRef.current) {
        isToolbarVisibleRef.current = true;
        setIsToolbarVisible(true);
      }
    };
    if (focusMode) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
    }
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [focusMode]);
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
  const pendingKeystrokeRef = useRef(null);
  const cachedPacingSpansRef = useRef(null);

  // Pinned caret synchronization: keeps input selection range strictly pinned to end of typed string
  const syncInputCaret = useCallback(() => {
    if (inputRef.current) {
      const len = inputRef.current.value.length;
      try {
        inputRef.current.setSelectionRange(len, len);
      } catch {}
    }
  }, []);

  const focusInputAndSyncCaret = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      const len = inputRef.current.value.length;
      try {
        inputRef.current.setSelectionRange(len, len);
      } catch {}
    }
  }, []);

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

  // Smart 7-Second Inactivity Auto-Pause Handler
  const handleAutoPause = useCallback(() => {
    if (isCompleted || isPausedRef.current || !startTime) return;

    // 1. Freeze active interval timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // 2. Clear inactivity timer reference
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }

    // 3. Freeze active typing time at the exact moment of the last typing action
    // (Excludes the 7-second inactive waiting period from active elapsed typing time)
    if (runningSegmentStartRef.current) {
      const lastAction = lastTypingActionTimestampRef.current || runningSegmentStartRef.current;
      const segmentActiveMs = Math.max(0, lastAction - runningSegmentStartRef.current);
      totalActiveMsRef.current += segmentActiveMs;
      runningSegmentStartRef.current = null;
    }

    const elapsed = Math.floor(totalActiveMsRef.current / 1000);
    setElapsedSeconds(elapsed);

    // Trim timeline points recorded during the 7s idle waiting period
    secondTimelineRef.current = secondTimelineRef.current.filter((pt) => pt.second <= elapsed);
    sessionTrackerRef.current.secondTimeline = (sessionTrackerRef.current.secondTimeline || []).filter(
      (pt) => pt.second <= elapsed
    );
    lastSampleSecondRef.current = elapsed;

    if (mode === 'timed') {
      const rem = Math.max(0, timeLimit - elapsed);
      setRemainingTime(rem);
    }

    // 4. Set paused states
    isPausedRef.current = true;
    isAutoPausedRef.current = true;
    setIsPaused(true);

    // 5. In Switch mode, reveal toolbar so typist sees Pause/Resume indicator and settings
    if (focusMode) {
      isToolbarVisibleRef.current = true;
      setIsToolbarVisible(true);
    }
  }, [isCompleted, startTime, mode, timeLimit, focusMode]);

  // Resets / Arms the 7-second inactivity timer
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    if (!isCompleted && !isPausedRef.current && (startTime || typedRef.current.length > 0)) {
      const inactivityMs =
        typeof window !== 'undefined' && window.__KEYFLOW_AUTO_PAUSE_MS__
          ? window.__KEYFLOW_AUTO_PAUSE_MS__
          : AUTO_PAUSE_INACTIVITY_MS;
      inactivityTimerRef.current = setTimeout(() => {
        handleAutoPause();
      }, inactivityMs);
    }
  }, [isCompleted, startTime, handleAutoPause]);

  // Manual Pause session handler
  const handlePause = useCallback(() => {
    if (isCompleted || isPausedRef.current || !startTime) return;
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    if (runningSegmentStartRef.current) {
      totalActiveMsRef.current += Date.now() - runningSegmentStartRef.current;
      runningSegmentStartRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    isPausedRef.current = true;
    isAutoPausedRef.current = false;
    setIsPaused(true);
    if (focusMode) {
      isToolbarVisibleRef.current = true;
      setIsToolbarVisible(true);
    }
  }, [isCompleted, startTime, focusMode]);

  // Resume session handler (triggered by button, click, or keyboard auto-resume)
  const handleResume = useCallback(() => {
    if (isCompleted || !isPausedRef.current || !startTime) return;
    const now = Date.now();
    runningSegmentStartRef.current = now;
    lastTypingActionTimestampRef.current = now;
    isPausedRef.current = false;
    isAutoPausedRef.current = false;
    setIsPaused(false);
    resetInactivityTimer();
    setTimeout(() => {
      focusInputAndSyncCaret();
    }, 20);
  }, [isCompleted, startTime, focusInputAndSyncCaret, resetInactivityTimer]);

  // Toggle pause/resume handler
  const handleTogglePause = useCallback(() => {
    if (isPausedRef.current) {
      handleResume();
    } else if (startTime && !isCompleted) {
      handlePause();
    }
  }, [startTime, isCompleted, handleResume, handlePause]);

  // Universal Typing Input Focus: immediate typing readiness without requiring a click
  // Preserves focus readiness even while paused to enable instantaneous keyboard auto-resume
  const isTypingActive =
    !isCompleted &&
    !sessionResults &&
    !customStudioOpen &&
    !savedTextsOpen &&
    !historyOpen &&
    !shortcutsOpen &&
    !competitionsOpen &&
    !profileModalOpen &&
    !soundSystemOpen;

  useUniversalTypingFocus({
    inputRef,
    isActive: isTypingActive,
    disabled: !isTypingActive,
    onKeystroke: (k) => setLastKeystroke(k),
    onDirectInput: (val) => handleInputChange({ target: { value: val } }),
  });

  const setWpmGoal = useCallback((val) => {
    const num = val ? Number(val) : null;
    if (startTime && !isCompleted && pacingStateRef.current.activeGoal !== num) {
      const currentActiveMs = getActiveElapsedMs();
      if (pacingStateRef.current.activeGoal) {
        const prevCPS = (pacingStateRef.current.activeGoal * 5) / 60;
        const deltaMs = Math.max(0, currentActiveMs - pacingStateRef.current.segmentStartMs);
        pacingStateRef.current.baseChar += (deltaMs / 1000) * prevCPS;
      }
      pacingStateRef.current.segmentStartMs = currentActiveMs;
      pacingStateRef.current.activeGoal = num;
    } else {
      pacingStateRef.current.activeGoal = num;
    }
    setWpmGoalState(num);
    try {
      if (num) {
        localStorage.setItem('keyflow_workstation_wpm_goal', String(num));
      } else {
        localStorage.removeItem('keyflow_workstation_wpm_goal');
      }
    } catch {}
  }, [startTime, isCompleted, getActiveElapsedMs]);

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
      return localStorage.getItem('keyflow_workstation_custom_gen_mode') || 'random';
    } catch {
      return 'random';
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

  const setFontSize = useCallback((size) => {
    setFontSizeState(size);
    try {
      localStorage.setItem('keyflow_workstation_fontsize', size);
    } catch {}
  }, []);

  const [showLiveWpm, setShowLiveWpmState] = useState(() => {
    try {
      return localStorage.getItem('keyflow_workstation_show_live_wpm') !== 'false';
    } catch {
      return true;
    }
  });

  const setShowLiveWpm = useCallback((val) => {
    setShowLiveWpmState((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      try {
        localStorage.setItem('keyflow_workstation_show_live_wpm', String(next));
      } catch {}
      return next;
    });
  }, []);

  // Stable handlers for WorkstationToolbar to prevent re-rendering during active typing
  const handleSetTimeLimit = useCallback((val) => {
    setTimeLimit(val);
    setRemainingTime(val);
    if (user?.id) profileAPI.updatePreferences({ preferred_duration: val }).catch(() => {});
  }, [user?.id]);

  const handleSetWordLimit = useCallback((val) => {
    setWordLimit(val);
    if (user?.id) profileAPI.updatePreferences({ preferred_word_count: val }).catch(() => {});
  }, [user?.id]);

  const handleToggleFocusMode = useCallback(() => {
    // 1. Pause active timer and clear inactivity timer if running on current departing page
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }

    if (runningSegmentStartRef.current) {
      totalActiveMsRef.current += Date.now() - runningSegmentStartRef.current;
      runningSegmentStartRef.current = null;
    }

    const departingRef = focusMode ? pageBSessionRef : pageASessionRef;
    const arrivingRef = focusMode ? pageASessionRef : pageBSessionRef;
    const nextFocusMode = !focusMode;

    // 2. Snapshot current active session into departing page ref
    departingRef.current = {
      mode,
      timeLimit,
      wordLimit,
      selectedPassageIndex,
      customPrompt,
      originalSourcePassage,
      activeSavedPassageId,
      customGenerationMode,
      typed: typedRef.current,
      startTime,
      isPaused: startTime && !isCompleted ? true : isPausedRef.current,
      elapsedSeconds,
      remainingTime,
      mistakes,
      correctKeystrokes,
      backspaces,
      errorHistory: [...errorHistory],
      correctedIndices: new Set(correctedIndices),
      isCompleted,
      sessionResults,
      wpmGoal,
      totalActiveMs: totalActiveMsRef.current,
      runningSegmentStart: null,
      sessionTracker: { ...sessionTrackerRef.current },
    };

    // 3. Restore arriving page session
    const target = arrivingRef.current;
    isSwitchingModeRef.current = true;
    prevSettingsRef.current = {
      mode: target.mode,
      timeLimit: target.timeLimit,
      wordLimit: target.wordLimit,
      selectedPassageIndex: target.selectedPassageIndex,
    };

    setMode(target.mode);
    setTimeLimit(target.timeLimit);
    setWordLimit(target.wordLimit);
    setSelectedPassageIndex(target.selectedPassageIndex);
    setCustomPrompt(target.customPrompt);
    setOriginalSourcePassage(target.originalSourcePassage);
    setActiveSavedPassageId(target.activeSavedPassageId);
    setCustomGenerationModeState(target.customGenerationMode);
    setTyped(target.typed);
    typedRef.current = target.typed;
    setStartTime(target.startTime);
    isPausedRef.current = target.isPaused;
    isAutoPausedRef.current = false;
    setIsPaused(target.isPaused);
    setElapsedSeconds(target.elapsedSeconds);
    setRemainingTime(target.remainingTime);
    setMistakes(target.mistakes);
    setCorrectKeystrokes(target.correctKeystrokes);
    setBackspaces(target.backspaces);
    setErrorHistory(target.errorHistory || []);
    setCorrectedIndices(new Set(target.correctedIndices || []));
    setIsCompleted(target.isCompleted);
    setSessionResults(target.sessionResults);
    setWpmGoalState(target.wpmGoal);

    totalActiveMsRef.current = target.totalActiveMs || 0;
    runningSegmentStartRef.current = null;
    sessionTrackerRef.current = { ...target.sessionTracker };

    if (inputRef.current) {
      inputRef.current.value = target.typed;
    }

    // 4. Update switch mode and persist
    setFocusMode(nextFocusMode);
    try {
      localStorage.setItem('keyflow_workstation_switch_mode', String(nextFocusMode));
    } catch {}

    // Reset toolbar visibility for arriving page
    isToolbarVisibleRef.current = true;
    setIsToolbarVisible(true);

    // 5. Restore focus and sync caret
    setTimeout(() => {
      syncInputCaret();
      focusInputAndSyncCaret();
    }, 20);
  }, [
    focusMode,
    mode,
    timeLimit,
    wordLimit,
    selectedPassageIndex,
    customPrompt,
    originalSourcePassage,
    activeSavedPassageId,
    customGenerationMode,
    typed,
    startTime,
    isPaused,
    elapsedSeconds,
    remainingTime,
    mistakes,
    correctKeystrokes,
    backspaces,
    errorHistory,
    correctedIndices,
    isCompleted,
    sessionResults,
    wpmGoal,
    syncInputCaret,
    focusInputAndSyncCaret,
  ]);
  const handleToggleSwitchMode = handleToggleFocusMode;

  const handleOpenCustomStudio = useCallback(() => setCustomStudioOpen(true), []);
  const handleOpenSavedTexts = useCallback(() => setSavedTextsOpen(true), []);
  const handleOpenHistory = useCallback(() => setHistoryOpen(true), []);
  const handleOpenShortcuts = useCallback(() => setShortcutsOpen(true), []);
  const handleOpenCompetitions = useCallback(() => setCompetitionsOpen(true), []);
  const handleOpenSoundSystem = useCallback(() => setSoundSystemOpen(true), []);
  const handleOpenProfile = useCallback(() => setProfileModalOpen(true), []);

  const viewportRef = useRef(null);
  const textTrackRef = useRef(null);
  const activeCharSpanRef = useRef(null);
  const pacingLineRef = useRef(null);
  const pacingStateRef = useRef({
    baseChar: 0,
    segmentStartMs: 0,
    activeGoal: wpmGoal,
  });
  const [scrollLine, setScrollLine] = useState(0);
  const [scrollOffsetPx, setScrollOffsetPx] = useState(0);
  const secondTimelineRef = useRef([]);
  const lastSampleSecondRef = useRef(0);
  const cachedLineHeightRef = useRef(null);
  const cachedBaseOffsetTopRef = useRef(null);
  const lastActiveOffsetTopRef = useRef(null);

  // Determine current active text: custom passage remains source across all 4 modes (PHASE 7.55)
  const currentTargetText = useMemo(() => {
    if (activeCompetition?.challengeText) {
      return activeCompetition.challengeText;
    }
    if (customPrompt) {
      if (mode === 'words' && wordLimit > 0) {
        const words = customPrompt.split(/\s+/).filter(Boolean);
        return words.slice(0, wordLimit).join(' ');
      }
      return customPrompt;
    }
    if (originalSourcePassage && (activeSavedPassageId || !PRACTICE_PASSAGES.some((p) => p.text === originalSourcePassage))) {
      if (mode === 'words' && wordLimit > 0) {
        const words = originalSourcePassage.split(/\s+/).filter(Boolean);
        return words.slice(0, wordLimit).join(' ');
      }
      return originalSourcePassage;
    }
    if (mode === 'passage') {
      return PRACTICE_PASSAGES[selectedPassageIndex]?.text || PRACTICE_PASSAGES[0].text;
    }
    if (mode === 'words') {
      const allWords = PRACTICE_PASSAGES.flatMap((p) => p.text.split(' '));
      return allWords.slice(0, wordLimit).join(' ');
    }
    if (mode === 'accuracy') {
      return PRACTICE_PASSAGES[selectedPassageIndex]?.text || PRACTICE_PASSAGES[0].text;
    }
    // timed mode default: chain passages so typists at any duration (15s, 30s, 60s, 120s) never run out of text
    if (mode === 'timed') {
      if (timeLimit >= 60 || timeLimit < 60) {
        return PRACTICE_PASSAGES.map((item) => item.text).join(' ');
      }
      return PRACTICE_PASSAGES.map((item) => item.text).join(' ');
    }
    return PRACTICE_PASSAGES[selectedPassageIndex]?.text || PRACTICE_PASSAGES[0].text;
  }, [mode, wordLimit, selectedPassageIndex, customPrompt, originalSourcePassage, activeCompetition, timeLimit, activeSavedPassageId]);

  // Memoize character array to avoid re-splitting long passages on every keystroke
  const targetChars = useMemo(() => currentTargetText.split(''), [currentTargetText]);

  // Invalidate geometry cache when font or passage changes
  useEffect(() => {
    cachedLineHeightRef.current = null;
    cachedBaseOffsetTopRef.current = null;
    lastActiveOffsetTopRef.current = null;
    cachedPacingSpansRef.current = null;
    pendingKeystrokeRef.current = null;
  }, [fontSize, currentTargetText, focusMode]);

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
      lastActiveOffsetTopRef.current = null;
      if (scrollLine !== 0 || scrollOffsetPx !== 0) {
        setScrollLine(0);
        setScrollOffsetPx(0);
      }
      return;
    }

    const activeSpan = activeCharSpanRef.current;
    if (!activeSpan) return;

    // Fast-path: if active character has not moved to a new line offset, skip layout measurements completely
    const currentOffsetTop = activeSpan.offsetTop;
    if (lastActiveOffsetTopRef.current !== null && currentOffsetTop === lastActiveOffsetTopRef.current) {
      return;
    }

    const firstCharSpan = textTrackRef.current.querySelector('.typing-char') || textTrackRef.current.firstElementChild;
    if (!firstCharSpan) return;

    // Accurate rendered line-height (cached across same font/size lifecycle)
    if (cachedLineHeightRef.current === null) {
      cachedLineHeightRef.current =
        parseFloat(window.getComputedStyle(viewportRef.current).lineHeight) ||
        activeSpan.offsetHeight ||
        39;
    }
    const computedLineHeight = cachedLineHeightRef.current;

    // Relative vertical position of active character from Line 1 (0-indexed)
    if (cachedBaseOffsetTopRef.current === null) {
      cachedBaseOffsetTopRef.current = firstCharSpan.offsetTop;
    }
    const baseOffsetTop = cachedBaseOffsetTopRef.current;
    const relativeTop = Math.max(0, currentOffsetTop - baseOffsetTop);
    lastActiveOffsetTopRef.current = currentOffsetTop;

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
      cachedLineHeightRef.current = null;
      cachedBaseOffsetTopRef.current = null;
      lastActiveOffsetTopRef.current = null;
      const computedLineHeight =
        parseFloat(window.getComputedStyle(viewportRef.current).lineHeight) ||
        39;
      cachedLineHeightRef.current = computedLineHeight;
      setScrollOffsetPx(scrollLine * computedLineHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [scrollLine]);

  // ── Real WPM Pacing Guide Line Animation (PHASE 6 & PHASE 4 Mathematical Pacing) ──
  // Glides continuously and smoothly at the exact mathematical target speed:
  // (wpmGoal * 5) / 60 chars/second (Standard 1 word = 5 characters).
  // Hidden when wpmGoal is None, paused when session is paused, resets on reset.
  // Supports live Goal WPM changes without jumping or session resets.
  useEffect(() => {
    if (!wpmGoal || isCompleted || !viewportRef.current) {
      if (pacingLineRef.current) {
        pacingLineRef.current.style.display = 'none';
      }
      return;
    }

    // Position at character 0 before typing begins
    if (!startTime) {
      if (
        !cachedPacingSpansRef.current ||
        cachedPacingSpansRef.current.length !== currentTargetText.length ||
        (cachedPacingSpansRef.current[0] && !cachedPacingSpansRef.current[0].isConnected)
      ) {
        cachedPacingSpansRef.current = viewportRef.current.querySelectorAll('.typing-char');
      }
      const firstSpan = cachedPacingSpansRef.current && cachedPacingSpansRef.current[0];
      if (firstSpan && pacingLineRef.current) {
        pacingLineRef.current.style.display = 'block';
        pacingLineRef.current.style.transform = `translate3d(${firstSpan.offsetLeft}px, ${firstSpan.offsetTop}px, 0)`;
        pacingLineRef.current.style.height = `${firstSpan.offsetHeight || 38}px`;
      }
      return;
    }

    if (isPaused) {
      // Keep pacing line at its exact paused position without advancing
      return;
    }

    let animFrameId = null;

    const updatePacingLine = () => {
      if (!viewportRef.current || !pacingLineRef.current) return;
      if (!wpmGoal) {
        pacingLineRef.current.style.display = 'none';
        return;
      }

      const currentActiveMs = getActiveElapsedMs();
      // Handle live Goal change during active execution
      if (pacingStateRef.current.activeGoal !== wpmGoal) {
        if (pacingStateRef.current.activeGoal) {
          const prevCPS = (pacingStateRef.current.activeGoal * 5) / 60;
          const deltaMs = Math.max(0, currentActiveMs - pacingStateRef.current.segmentStartMs);
          pacingStateRef.current.baseChar += (deltaMs / 1000) * prevCPS;
        }
        pacingStateRef.current.segmentStartMs = currentActiveMs;
        pacingStateRef.current.activeGoal = wpmGoal;
      }

      const currentCPS = (wpmGoal * 5) / 60;
      const deltaMs = Math.max(0, currentActiveMs - pacingStateRef.current.segmentStartMs);
      const targetCharIdxFloat = pacingStateRef.current.baseChar + (deltaMs / 1000) * currentCPS;
      const maxIdx = Math.max(0, currentTargetText.length - 1);
      const targetCharIdx = Math.min(Math.floor(targetCharIdxFloat), maxIdx);
      const fraction = targetCharIdx >= maxIdx ? 1 : (targetCharIdxFloat - Math.floor(targetCharIdxFloat));

      if (
        !cachedPacingSpansRef.current ||
        cachedPacingSpansRef.current.length !== currentTargetText.length ||
        (cachedPacingSpansRef.current[0] && !cachedPacingSpansRef.current[0].isConnected)
      ) {
        cachedPacingSpansRef.current = viewportRef.current.querySelectorAll('.typing-char');
      }

      const span = cachedPacingSpansRef.current[targetCharIdx];
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
      isPausedRef.current = false;
      isAutoPausedRef.current = false;
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      isToolbarVisibleRef.current = true;
      setIsToolbarVisible(true);

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

      // Distinguish source environment: Workstation Page A vs Workstation Page B (Focus/Switch mode)
      const currentSource = focusMode ? 'workstation_b' : 'workstation_a';

      // Record in scientific telemetry engine
      recordTelemetrySession({
        userId: user?.id || null,
        id: canonicalSessionId,
        sessionId: canonicalSessionId,
        source: currentSource,
        sourceEnvironment: currentSource,
        environment: currentSource,
        wpm: netWpm,
        netWpm,
        grossWpm,
        rawWpm: grossWpm,
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
          source: currentSource,
          source_environment: currentSource,
          duration_seconds: testDurationSec,
          total_chars: totalValidEntries,
          correct_chars: finalCorrect,
          incorrect_chars: finalMistakes,
          gross_wpm: grossWpm,
          net_wpm: netWpm,
          accuracy: rawAccuracy,
          error_count: remainingErrors,
          character_stats: {
            ...finalCharacterStats,
            _meta: { source: currentSource, mode: activeCompetition ? 'competition' : customPrompt ? 'custom' : mode },
          },
          finger_stats: finalFingerStats,
        })
        .catch(() => {});

      // If active competition, submit genuine result to competition lobby & automatically navigate to results page
      if (activeCompetition) {
        const compCode = activeCompetition.competition?.code || activeCompetition.code;
        const partId = competitionParticipantId || activeCompetition.participantId;
        const partToken = competitionParticipantToken || activeCompetition.participantToken || null;

        let navigated = false;
        const doNavigate = () => {
          if (!navigated && compCode) {
            navigated = true;
            navigate(`/competitions/${compCode}/results`);
          }
        };

        if (compCode && partId) {
          competitionAPI
            .submit(compCode, {
              participant_id: competitionParticipantId || partId,
              participant_token: partToken,
              net_wpm: netWpm,
              gross_wpm: grossWpm,
              accuracy: rawAccuracy,
              duration_seconds: testDurationSec,
              correct_chars: finalCorrect,
              incorrect_chars: finalMistakes,
              error_count: remainingErrors,
              typed_text: finalTyped,
            })
            .catch((err) => {
              console.warn('Competition submission error:', err);
            })
            .finally(() => {
              doNavigate();
            });

          // Timeout safety guard so UI never hangs if network delays
          setTimeout(doNavigate, 600);
        } else if (compCode) {
          doNavigate();
        }
      }
    },
    [typed, mistakes, correctKeystrokes, backspaces, currentTargetText, mode, timeLimit, wordLimit, user, activeCompetition, competitionParticipantId, competitionParticipantToken, customPrompt, wpmGoal, errorHistory, startTime, navigate]
  );

  // Key input handler: synchronized with typedRef to eliminate stale state closures (PHASE 7.55)
  const handleInputChange = (e) => {
    if (isCompleted) return;
    if (isPausedRef.current) {
      handleResume();
    }
    let val = e.target.value;
    const currentTyped = typedRef.current;
    const typed = currentTyped; // Fresh synchronous reference eliminates stale React closure

    // Guard against caret displacement / middle-string insertion or deletion (PHASE 7.54)
    if (val.length > typed.length) {
      if (!val.startsWith(typed)) {
        let insertedStr = '';
        if (pendingKeystrokeRef.current?.key && pendingKeystrokeRef.current.key.length === 1) {
          insertedStr = pendingKeystrokeRef.current.key;
        } else {
          let diffIdx = 0;
          while (diffIdx < typed.length && typed[diffIdx] === val[diffIdx]) {
            diffIdx++;
          }
          const insertedLen = val.length - typed.length;
          insertedStr = val.slice(diffIdx, diffIdx + insertedLen) || val.slice(-insertedLen);
        }
        val = typed + insertedStr;
        if (e.target) {
          e.target.value = val;
        }
      }
    } else if (val.length < typed.length) {
      if (!typed.startsWith(val)) {
        val = typed.slice(0, val.length);
        if (e.target) {
          e.target.value = val;
        }
      }
    }
    syncInputCaret();

    // Auto-hide toolbar while actively typing (Strictly Scoped to Page B / focusMode)
    if (focusMode && isToolbarVisibleRef.current) {
      isToolbarVisibleRef.current = false;
      setIsToolbarVisible(false);
    }

    if (!startTime && val.length > 0) {
      const now = Date.now();
      setStartTime(now);
      totalActiveMsRef.current = 0;
      runningSegmentStartRef.current = now;
      lastKeystrokeTimeRef.current = performance.now();
      lastTypingActionTimestampRef.current = now;
      sessionTrackerRef.current.startedAt = now;
      sessionTrackerRef.current.sessionId = `sess_${now}_${Math.random().toString(36).slice(2, 9)}`;
      sessionTrackerRef.current.isCompleted = false;
      sessionTrackerRef.current.characterStats = {};
      isPausedRef.current = false;
      isAutoPausedRef.current = false;
      setIsPaused(false);
      pacingStateRef.current = {
        baseChar: 0,
        segmentStartMs: 0,
        activeGoal: wpmGoal,
      };
      resetInactivityTimer();
    }

    if (val.length > currentTyped.length) {
      const isBulk = (val.length - currentTyped.length) > 2;
      let hasErrorInBulk = false;

      for (let i = currentTyped.length; i < val.length; i++) {
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
      const strokeToSet = pendingKeystrokeRef.current && (pendingKeystrokeRef.current.key === actualChar || pendingKeystrokeRef.current.key?.toLowerCase() === actualChar?.toLowerCase())
        ? pendingKeystrokeRef.current
        : { key: actualChar, code: '', id: performance.now() };
      pendingKeystrokeRef.current = null;
      setLastKeystroke(strokeToSet);
    } else if (val.length < currentTyped.length) {
      // Backspace pressed: removes character, does NOT clear previous mistakes or alter error count
      const count = currentTyped.length - val.length;
      playClick(false);
      lastKeystrokeTimeRef.current = performance.now();
      sessionTrackerRef.current.backspaces += count;
      setBackspaces((b) => b + count);
      const strokeToSet = pendingKeystrokeRef.current && pendingKeystrokeRef.current.key === 'Backspace'
        ? pendingKeystrokeRef.current
        : { key: 'backspace', code: 'Backspace', id: performance.now() };
      pendingKeystrokeRef.current = null;
      setLastKeystroke(strokeToSet);
    }

    // Update last typing action and arm/reset 7-second inactivity timer
    lastTypingActionTimestampRef.current = Date.now();
    resetInactivityTimer();

    // Synchronously update ref before React async state update to prevent stale closures
    typedRef.current = val;
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

    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }

    typedRef.current = '';
    setTyped('');
    setStartTime(null);
    isPausedRef.current = false;
    isAutoPausedRef.current = false;
    setIsPaused(false);
    isToolbarVisibleRef.current = true;
    setIsToolbarVisible(true);
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
    cachedLineHeightRef.current = null;
    cachedBaseOffsetTopRef.current = null;
    lastActiveOffsetTopRef.current = null;
    cachedPacingSpansRef.current = null;
    pendingKeystrokeRef.current = null;
    pacingStateRef.current = {
      baseChar: 0,
      segmentStartMs: 0,
      activeGoal: wpmGoal,
    };
    if (pacingLineRef.current) {
      if (wpmGoal && cachedPacingSpansRef.current && cachedPacingSpansRef.current[0]) {
        const firstSpan = cachedPacingSpansRef.current[0];
        pacingLineRef.current.style.display = 'block';
        pacingLineRef.current.style.transform = `translate3d(${firstSpan.offsetLeft}px, ${firstSpan.offsetTop}px, 0)`;
        pacingLineRef.current.style.height = `${firstSpan.offsetHeight || 38}px`;
      } else {
        pacingLineRef.current.style.display = 'none';
        pacingLineRef.current.style.transform = 'translate3d(0, 0, 0)';
      }
    }
    if (viewportRef.current) {
      viewportRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 40);
  }, [timeLimit, user, wpmGoal]);

  // Apply custom text from studio
  const handleApplyCustomText = ({ prompt, mode: nextMode, timeLimit: nextTime, wordLimit: nextWords, customSource, savedPassageId }) => {
    setActiveCompetition(null);
    const sourceToLock = customSource || prompt;
    setOriginalSourcePassage(sourceToLock);
    setActiveSavedPassageId(savedPassageId || null);
    setCustomPrompt(prompt);
    if (nextMode) setMode(nextMode);
    if (nextTime) setTimeLimit(nextTime);
    if (nextWords) setWordLimit(nextWords);
    handleReset();
  };

  // Apply saved passage with source locking and active mode transformation
  const handleApplySavedPassage = useCallback((textToApply, count, passageId = null) => {
    setActiveCompetition(null);
    setOriginalSourcePassage(textToApply);
    setActiveSavedPassageId(passageId || null);

    const transformed = generateCustomTypingPrompt({
      sourceText: textToApply,
      generationMode: customGenerationMode,
      limitType: 'passage',
      limitValue: 0,
      includePunctuation: true,
      includeNumbers: true,
    });

    setCustomPrompt(transformed || textToApply);
    setMode('passage');
    setWordLimit(count || (textToApply ? textToApply.split(/\s+/).filter(Boolean).length : 25));
    setTimeLimit(30);
    handleReset();
  }, [customGenerationMode, handleReset]);

  // Trigger custom generation mode action from toolbar (Random, Shuffle, Repeat)
  const handleTriggerCustomMode = useCallback((targetMode = null) => {
    // Resolve effective mode
    const effectiveMode = (targetMode && typeof targetMode === 'string')
      ? targetMode
      : customGenerationMode;

    if (targetMode && typeof targetMode === 'string' && targetMode !== customGenerationMode) {
      setCustomGenerationMode(targetMode);
    }

    const isCustomText = Boolean(
      activeSavedPassageId ||
      (originalSourcePassage && !PRACTICE_PASSAGES.some((p) => p.text === originalSourcePassage))
    );

    // MODE 1: RANDOM
    if (effectiveMode === 'random') {
      if (!isCustomText) {
        // Randomly select another eligible passage from PRACTICE_PASSAGES (avoiding immediate repeat)
        const eligibleIndices = PRACTICE_PASSAGES.map((_, i) => i).filter((i) => i !== selectedPassageIndex);
        const nextIdx = eligibleIndices.length > 0
          ? eligibleIndices[Math.floor(Math.random() * eligibleIndices.length)]
          : 0;
        setSelectedPassageIndex(nextIdx);
        const nextText = PRACTICE_PASSAGES[nextIdx].text;
        setOriginalSourcePassage(nextText);
        setCustomPrompt(nextText);
        prevSettingsRef.current.selectedPassageIndex = nextIdx;
        setActiveCompetition(null);
        handleReset();
        return;
      } else {
        // Randomly sample words from the loaded custom passage
        const rawSource = originalSourcePassage || customPrompt;
        const generated = generateCustomTypingPrompt({
          sourceText: rawSource,
          generationMode: 'random',
          limitType: 'passage',
          limitValue: 0,
          includePunctuation: true,
          includeNumbers: true,
        });
        if (generated) {
          setActiveCompetition(null);
          setCustomPrompt(generated);
          handleReset();
        }
        return;
      }
    }

    // Base source for shuffle and repeat
    const cleanBaseSource = isCustomText
      ? (originalSourcePassage || customPrompt)
      : (PRACTICE_PASSAGES[selectedPassageIndex]?.text || PRACTICE_PASSAGES[0].text);

    if (!originalSourcePassage && cleanBaseSource) {
      setOriginalSourcePassage(cleanBaseSource);
    }
    const rawSource = originalSourcePassage || cleanBaseSource;
    if (!rawSource) return;

    // MODE 2: SHUFFLE
    if (effectiveMode === 'shuffle') {
      const generated = generateCustomTypingPrompt({
        sourceText: rawSource,
        generationMode: 'shuffle',
        limitType: 'passage',
        limitValue: 0,
        includePunctuation: true,
        includeNumbers: true,
      });
      if (generated) {
        setActiveCompetition(null);
        setCustomPrompt(generated);
        handleReset();
      }
      return;
    }

    // MODE 3: REPEAT
    if (effectiveMode === 'repeat') {
      const cleanBase = rawSource.trim();
      const repeated = `${cleanBase} ${cleanBase}`;
      setActiveCompetition(null);
      setCustomPrompt(repeated);
      handleReset();
      return;
    }
  }, [
    customGenerationMode,
    setCustomGenerationMode,
    originalSourcePassage,
    customPrompt,
    selectedPassageIndex,
    activeSavedPassageId,
    handleReset,
  ]);

  // Start Competition Test
  const handleStartCompetitionTest = ({ competition, participantId, participantToken, challengeText, challengeType, targetLimit }) => {
    setCustomPrompt(null);
    setOriginalSourcePassage(null);
    setActiveSavedPassageId(null);
    setActiveCompetition({ competition, participantId, participantToken, challengeText });
    setCompetitionParticipantId(participantId);
    setCompetitionParticipantToken(participantToken || null);

    const isTimed = Boolean(
      competition?.time_limit_seconds ||
      competition?.competition_mode === 'timed' ||
      challengeType === 'timed'
    );

    if (isTimed) {
      setMode('timed');
      setTimeLimit(competition?.time_limit_seconds || targetLimit || 60);
    } else {
      setMode('words');
      setWordLimit(targetLimit || 25);
    }
    handleReset();
  };

  // Built-in passage selection handler: switching to built-in passage unloads custom text
  const handleSelectPassageIndex = useCallback((idx) => {
    setCustomPrompt(null);
    setOriginalSourcePassage(null);
    setActiveSavedPassageId(null);
    setSelectedPassageIndex(idx);
    handleReset();
  }, [handleReset]);

  // Mode change handler preserves custom text and only clears competition overrides
  const handleModeChange = useCallback((newMode) => {
    setActiveCompetition(null);
    setMode(newMode);
    handleReset();
    if (user?.id) {
      profileAPI.updatePreferences({ preferred_mode: newMode }).catch(() => {});
    }
  }, [handleReset, user?.id]);

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

  // Clean up all active intervals and inactivity timers on unmount
  useEffect(() => {
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

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

      // Allow Esc everywhere to exit switch mode or reset test
      if (e.key === 'Escape') {
        if (focusMode) {
          handleToggleFocusMode();
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
          handleToggleFocusMode();
        } else if (key === 'h') {
          e.preventDefault();
          setHistoryOpen((v) => !v);
        } else if (key === 's') {
          e.preventDefault();
          setSavedTextsOpen((v) => !v);
        } else if (key === 'k') {
          e.preventDefault();
          setShortcutsOpen((v) => !v);
        } else if (key === 'u' || key === 'm') {
          e.preventDefault();
          setSoundSystemOpen((v) => !v);
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
    if (isSwitchingModeRef.current) {
      isSwitchingModeRef.current = false;
      prevSettingsRef.current = { mode, timeLimit, wordLimit, selectedPassageIndex };
      return;
    }
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
      focusInputAndSyncCaret();
    }
  }, [mode, timeLimit, wordLimit, selectedPassageIndex, handleReset, isCompleted, sessionResults, focusInputAndSyncCaret]);

  return (
    <div
      className={
        focusMode
          ? 'h-[calc(100dvh-5rem)] max-h-[calc(100dvh-5rem)] overflow-hidden flex flex-col justify-start items-center pt-8 sm:pt-10 md:pt-12 px-2 sm:px-4 w-full select-none'
          : 'container-app py-6 sm:py-10'
      }
    >
      <div
        className={
          focusMode
            ? 'w-full max-w-[1440px] mx-auto flex flex-col justify-start items-center'
            : 'w-full max-w-5xl mx-auto space-y-5'
        }
      >
        {/* Top Banner & Header (Hidden in Switch Mode) */}
        {!focusMode && (
          <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[var(--border)] transition-all">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
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
                Explore Academy
              </Button>
            </div>
          </div>
        )}

        {/* Workstation Feature Toolbar (Active in both Standard and Switch modes; hidden only when Results Screen is active) */}
        {!(isCompleted && sessionResults) && (
          <div className={`w-full flex justify-center items-center ${focusMode ? 'h-[76px] min-h-[76px]' : ''} relative z-20 shrink-0`}>
            <div
              className={`w-full transition-opacity duration-200 ease-out ${
                focusMode
                  ? (isToolbarVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none')
                  : 'opacity-100 pointer-events-auto'
              }`}
              style={{ willChange: 'opacity' }}
              data-testid="workstation-toolbar-wrapper"
            >
              <WorkstationToolbar
                mode={mode}
                setMode={handleModeChange}
                timeLimit={timeLimit}
                setTimeLimit={handleSetTimeLimit}
                wordLimit={wordLimit}
                setWordLimit={handleSetWordLimit}
                selectedPassageIndex={selectedPassageIndex}
                setSelectedPassageIndex={handleSelectPassageIndex}
                passages={PRACTICE_PASSAGES}
                customActive={Boolean(customPrompt)}
                customTitle="Custom Drill"
                activeCompetition={activeCompetition?.competition}
                keyboardGuideOn={keyboardGuideOn}
                toggleKeyboardGuide={toggleKeyboardGuide}
                handGuideOn={handGuideOn}
                toggleHandGuide={toggleHandGuide}
                focusMode={focusMode}
                toggleFocusMode={handleToggleFocusMode}
                switchMode={focusMode}
                toggleSwitchMode={handleToggleFocusMode}
                onOpenCustomStudio={handleOpenCustomStudio}
                onOpenSavedTexts={handleOpenSavedTexts}
                onOpenHistory={handleOpenHistory}
                onOpenShortcuts={handleOpenShortcuts}
                onOpenCompetitions={handleOpenCompetitions}
                onOpenSoundSystem={() => setSoundSystemOpen(true)}
                onOpenProfile={handleOpenProfile}
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
                onRestoreFocus={focusInputAndSyncCaret}
                allowedDurations={config?.allowed_durations}
                customTextEnabled={config?.custom_text_enabled}
                competitionEnabled={config?.competition_enabled}
                t={t}
              />
            </div>
          </div>
        )}

        {/* Dedicated Gap & Active Progress/Timer Row with Goal Selector */}
        {!(isCompleted && sessionResults) && focusMode && (
          <div className="w-[calc(100vw-2rem)] sm:w-[calc(100vw-3rem)] lg:w-[calc(100vw-3in)] max-w-[calc(100vw-3in)] mx-auto mt-6 sm:mt-8 mb-2 sm:mb-3 select-none">
            <div className="flex items-center justify-between min-h-[32px]">
              <div className="flex items-center gap-3 sm:gap-4">
                {mode === 'timed' ? (
                  <div
                    data-testid="workstation-active-timer"
                    className="text-2xl sm:text-3xl font-mono font-bold text-[var(--accent)] tracking-tight flex items-center gap-2"
                  >
                    <span>{remainingTime}</span>
                  </div>
                ) : mode === 'words' ? (
                  <div
                    data-testid="workstation-active-words-counter"
                    className="text-xl sm:text-2xl font-mono font-bold text-[var(--accent)] tracking-tight flex items-center gap-1.5"
                  >
                    <span>{sessionTrackerRef.current.typed ? sessionTrackerRef.current.typed.trim().split(/\s+/).filter(Boolean).length : 0}</span>
                    <span className="text-sm sm:text-base text-[var(--text-muted)] font-normal">/ {wordLimit}</span>
                  </div>
                ) : (
                  <div
                    data-testid="workstation-active-char-counter"
                    className="text-lg sm:text-xl font-mono font-medium text-[var(--accent)] tracking-tight flex items-center gap-1.5"
                  >
                    <span>{typed.length}</span>
                    <span className="text-sm sm:text-base text-[var(--text-muted)] font-normal">/ {currentTargetText.length}</span>
                  </div>
                )}

                {/* Target Goal Selector beside timer at blue '+' location */}
                <div
                  data-testid="workstation-switch-goal-control"
                  className="flex items-center gap-1.5 pl-2.5 sm:pl-3 border-l border-[var(--border)] select-none"
                >
                  <Flag className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-[11px] uppercase font-mono text-[var(--text-muted)] tracking-wider">Goal</span>
                  <select
                    value={wpmGoal || ''}
                    onChange={(e) => {
                      setWpmGoal(e.target.value ? Number(e.target.value) : null);
                      setTimeout(() => {
                        focusInputAndSyncCaret();
                      }, 10);
                    }}
                    className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded px-1.5 py-0.5 text-xs font-mono text-[var(--text-primary)] cursor-pointer hover:border-[var(--accent)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                    title="Set Target Speed Goal (10 to 500 WPM in increments of 10)"
                    aria-label="Target speed goal"
                  >
                    {WPM_GOAL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Paused Badge */}
              {isPaused && (
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-500 font-mono text-xs font-bold tracking-wider uppercase animate-pulse shadow-xs"
                  role="status"
                >
                  <Pause className="w-3.5 h-3.5 fill-amber-500" />
                  <span>PAUSED</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Workstation Layout — Dedicated Results Screen or Active Practice Area */}
        <div className={`w-full ${focusMode ? 'space-y-4 sm:space-y-5' : 'space-y-5'}`}>
          {isCompleted && sessionResults && !activeCompetition ? (
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
          ) : isCompleted && activeCompetition ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 space-y-4 text-center rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] shadow-sm animate-fade-in font-mono">
              <div className="w-10 h-10 rounded-full border-3 border-[var(--accent)]/30 border-t-[var(--accent)] animate-spin" />
              <div className="space-y-1">
                <div className="text-base font-bold text-[var(--text-primary)]">Tallying competition results...</div>
                <div className="text-xs text-[var(--text-muted)]">Navigating directly to Champions Leaderboard</div>
              </div>
            </div>
          ) : (
            <>
              {/* Live Telemetry Bar (Hidden in Switch Mode to match Screenshot 2) */}
              {!focusMode && (
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
              )}

              {/* Controlled 4-Line Typing Viewport (PHASE 7) — Smooth Line-by-Line Progression (PHASE 4) */}
              <div
                onClick={() => {
                  if (isPaused) {
                    handleResume();
                  } else {
                    focusInputAndSyncCaret();
                  }
                }}
                className={
                  focusMode
                    ? "w-[calc(100vw-2rem)] sm:w-[calc(100vw-3rem)] lg:w-[calc(100vw-3in)] max-w-[calc(100vw-3in)] mx-auto flex flex-col justify-center items-start py-2 sm:py-3 transition-all cursor-text relative select-none border-0 bg-transparent shadow-none"
                    : `p-4 sm:p-6 rounded-2xl border min-h-[160px] max-h-[180px] sm:min-h-[190px] sm:max-h-[225px] flex flex-col justify-center transition-all cursor-text relative select-none ${
                        isCompleted ? 'opacity-85 border-[var(--border)]' : 'border-[var(--accent)] shadow-sm'
                      }`
                }
                style={focusMode ? undefined : { background: 'var(--bg-surface)' }}
                data-testid={focusMode ? "workstation-switch-mode-text-container" : "workstation-standard-text-container"}
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
                    title="Session is paused. Start typing to auto-resume, or click here to resume."
                    data-testid="workstation-paused-badge"
                  >
                    <Pause className="w-3.5 h-3.5 fill-amber-500" />
                    <span>PAUSED</span>
                    <span className="text-[var(--text-muted)] text-[11px] hidden sm:inline">• Click or Space to Resume (or type any key)</span>
                  </div>
                )}
                <div
                  ref={viewportRef}
                  className={`overflow-hidden relative leading-relaxed font-mono whitespace-pre-wrap break-words w-full text-left ${
                    focusMode
                      ? fontSize === 'large'
                        ? 'text-xl sm:text-3xl leading-[2.3]'
                        : fontSize === 'compact'
                        ? 'text-base sm:text-xl leading-[2.0]'
                        : 'text-xl sm:text-2xl md:text-[26px] leading-[2.2] tracking-wide'
                      : fontSize === 'large'
                      ? 'text-lg sm:text-3xl leading-relaxed'
                      : fontSize === 'compact'
                      ? 'text-sm sm:text-lg leading-relaxed'
                      : 'text-base sm:text-2xl leading-relaxed'
                  }`}
                  style={
                    focusMode
                      ? {
                          height:
                            fontSize === 'large'
                              ? 'calc(3 * 2.3em)'
                              : fontSize === 'compact'
                              ? 'calc(3 * 2.0em)'
                              : 'calc(3 * 2.2em)',
                          maxHeight:
                            fontSize === 'large'
                              ? 'calc(3 * 2.3em)'
                              : fontSize === 'compact'
                              ? 'calc(3 * 2.0em)'
                              : 'calc(3 * 2.2em)',
                          scrollBehavior: 'smooth',
                          letterSpacing: '0.02em',
                        }
                      : {
                          height: 'calc(4 * 1.625em)',
                          maxHeight: 'calc(4 * 1.625em)',
                          scrollBehavior: 'smooth',
                        }
                  }
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
                    <WorkstationTextTrack
                      currentTargetText={currentTargetText}
                      typed={typed}
                      isCompleted={isCompleted}
                      correctedIndices={correctedIndices}
                      activeCharSpanRef={activeCharSpanRef}
                      pacingLineRef={pacingLineRef}
                    />
                  </div>

                  <input
                    ref={inputRef}
                    data-testid="workstation-typing-input"
                    type="text"
                    value={typed}
                    onChange={handleInputChange}
                    onClick={syncInputCaret}
                    onSelect={syncInputCaret}
                    onFocus={syncInputCaret}
                    onKeyUp={syncInputCaret}
                    onKeyDown={(e) => {
                      if (isCompleted) return;
                      if (e.key === 'Escape') return;
                      if (focusMode && isToolbarVisibleRef.current && !['Escape'].includes(e.key)) {
                        isToolbarVisibleRef.current = false;
                        setIsToolbarVisible(false);
                      }
                      if (isPausedRef.current) {
                        if (isValidTypingKey(e)) {
                          if (e.key === 'Backspace') {
                            pendingKeystrokeRef.current = { key: 'Backspace', code: e.code, id: performance.now() };
                          } else if (e.key.length === 1) {
                            pendingKeystrokeRef.current = { key: e.key, code: e.code, id: performance.now() };
                          }
                          handleResume();
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleInputChange({ target: { value: typed + '\n' } });
                            return;
                          }
                          if (e.key === 'Tab') {
                            if (currentTargetChar === '\t') {
                              e.preventDefault();
                              handleInputChange({ target: { value: typed + '\t' } });
                            }
                            return;
                          }
                          // Allow printable keys, space, and backspace to flow natively into <input>
                          return;
                        }
                        if (!['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) {
                          e.preventDefault();
                        }
                        return;
                      }
                      if (e.key === 'Tab') {
                        if (currentTargetChar === '\t') {
                          e.preventDefault();
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
                      pendingKeystrokeRef.current = { key: e.key, code: e.code, id: performance.now() };
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

              {/* Centered Minimal Reset Control (PHASE 4: Blue-Marked Position) & Floating Caps Lock Indicator */}
              <div className="w-full flex items-center justify-center py-0.5 -my-1 relative max-w-[820px] mx-auto">
                <CapsLockNotification
                  className="left-1 sm:left-2 top-1/2 -translate-y-1/2"
                  id="workstation-capslock-notification"
                  data-testid="workstation-capslock-notification"
                />
                <button
                  type="button"
                  onClick={handleReset}
                  className="p-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--accent)] hover:scale-110 active:scale-95 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 select-none"
                  title="Reset typing session (Esc)"
                  aria-label="Reset typing session"
                >
                  <RotateCcw className="w-5 h-5 transition-transform duration-200" />
                </button>
              </div>

              {/* Precision Virtual Keyboard + Realistic Hand Overlay (Hidden in Switch Mode by default) */}
              {((!focusMode && (keyboardGuideOn || handGuideOn)) || (focusMode && showGuidesInSwitch && (keyboardGuideOn || handGuideOn))) && (
                <div className="w-full max-w-[820px] mx-auto flex flex-col items-center pt-0.5">
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
          focusInputAndSyncCaret();
        }}
        onApplyCustomText={handleApplyCustomText}
        userId={user?.id}
        initialText={originalSourcePassage || customPrompt || ''}
        generationMode={customGenerationMode}
        onGenerationModeChange={setCustomGenerationMode}
      />

      <SavedTextsModal
        isOpen={savedTextsOpen}
        onClose={() => {
          setSavedTextsOpen(false);
          focusInputAndSyncCaret();
        }}
        onApplyText={(textToApply, count, passageId) => {
          handleApplySavedPassage(textToApply, count, passageId);
        }}
        onOpenCustomStudio={() => setCustomStudioOpen(true)}
        userId={user?.id}
      />

      <PracticeHistoryModal
        isOpen={historyOpen}
        onClose={() => {
          setHistoryOpen(false);
          focusInputAndSyncCaret();
        }}
        userId={user?.id}
      />

      <ShortcutsModal
        isOpen={shortcutsOpen}
        onClose={() => {
          setShortcutsOpen(false);
          focusInputAndSyncCaret();
        }}
      />

      <CompetitionModal
        isOpen={competitionsOpen}
        onClose={() => {
          setCompetitionsOpen(false);
          focusInputAndSyncCaret();
        }}
        onStartCompetitionTest={handleStartCompetitionTest}
        user={user}
        activeCompetition={activeCompetition?.competition}
      />

      <TelemetryProfileModal
        isOpen={profileModalOpen}
        onClose={() => {
          setProfileModalOpen(false);
          focusInputAndSyncCaret();
        }}
        initialTab="profile"
      />

      <SoundSystemModal
        isOpen={soundSystemOpen}
        onClose={() => {
          setSoundSystemOpen(false);
          focusInputAndSyncCaret();
        }}
      />
    </div>
  );
};
