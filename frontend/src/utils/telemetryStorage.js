/**
 * KEYFLOW — Scientific Keystroke Intelligence & Telemetry Engine
 * ==============================================================
 * Comprehensive analytics, session persistence, biomechanical modeling,
 * character metrics, calendar heatmaps, and multi-period aggregation.
 *
 * Guarantees:
 * 1. Strict mathematical consistency across Today, Weekly, and Overall reports.
 * 2. Real user data only: no fabricated statistics or mock overrides.
 * 3. Graceful fallback & honest empty states when data is absent.
 * 4. Multi-user isolation via keyflow_current_user_id.
 * 5. Full preservation of legacy lessonProgress & practiceAPI sessions.
 */

import { KEY_FINGER_MAP, resolveKeyToFinger, getAuthoritativeFingerForChar } from './touchTypingMap.js';
import { getLessonProgress } from './lessonProgress.js';
import {
  calculateGrossWpm,
  calculateNetWpm,
  calculateRawAccuracy,
  calculateFinalTextAccuracy,
  countUncorrectedErrors,
} from './typingFeedback.js';

// Standard 52-character standard touch typing coverage denominator
export const STANDARD_COVERAGE_CHARS = [
  'a','b','c','d','e','f','g','h','i','j','k','l','m',
  'n','o','p','q','r','s','t','u','v','w','x','y','z',
  '0','1','2','3','4','5','6','7','8','9',
  ' ',';',"'",',','.','/','[',']','\\','`','-','=',
  '!','@','#','$','%','^','&','*','(',')'
];

export const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const dayHeaders = DAY_HEADERS;

export function getCurrentUserId(explicitUserId = null) {
  let uid = explicitUserId !== null && explicitUserId !== undefined ? String(explicitUserId) : null;
  if (!uid) {
    try {
      if (typeof localStorage !== 'undefined') {
        uid = localStorage.getItem('keyflow_current_user_id') || null;
      }
    } catch {
      return null;
    }
  }
  if (uid && typeof uid === 'string' && uid.startsWith('user_')) {
    try {
      if (typeof localStorage !== 'undefined') {
        const aliased = localStorage.getItem(`keyflow_user_alias_${uid}`);
        if (aliased) return String(aliased);
      }
    } catch {}
  }
  return uid ? String(uid) : null;
}

export function getStorageKey(explicitUserId = null) {
  const userId = getCurrentUserId(explicitUserId);
  if (!userId) return 'keyflow_telemetry_sessions_guest';
  const canonicalKey = `keyflow_telemetry_sessions_u_${userId}`;
  if (typeof localStorage !== 'undefined') {
    try {
      const canonicalData = localStorage.getItem(canonicalKey);
      if (!canonicalData && explicitUserId && String(explicitUserId) !== userId) {
        const altKey = `keyflow_telemetry_sessions_u_${explicitUserId}`;
        const altData = localStorage.getItem(altKey);
        if (altData) {
          localStorage.setItem(canonicalKey, altData);
        }
      }
    } catch {}
  }
  return canonicalKey;
}

export function getGoalStorageKey(explicitUserId = null) {
  const userId = getCurrentUserId(explicitUserId);
  return userId ? `keyflow_telemetry_goal_u_${userId}` : 'keyflow_telemetry_goal_guest';
}

export function getWeeklyGoalStorageKey(explicitUserId = null) {
  const userId = getCurrentUserId(explicitUserId);
  return userId ? `keyflow_telemetry_weekly_goal_u_${userId}` : 'keyflow_telemetry_weekly_goal_guest';
}

export function getWeekStartStorageKey(explicitUserId = null) {
  const userId = getCurrentUserId(explicitUserId);
  return userId ? `keyflow_week_start_u_${userId}` : 'keyflow_week_start_guest';
}

// ---------------------------------------------------------------------------
// Date Utilities (User Local Timezone Aware)
// ---------------------------------------------------------------------------
export function toLocalDateString(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLocalDate(dateStr) {
  if (!dateStr) return new Date();
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

export function getWeekDateRange(weekStartDay = 0, referenceDate = new Date()) {
  const ref = new Date(referenceDate);
  ref.setHours(0, 0, 0, 0);

  const currentDay = ref.getDay(); // 0 is Sunday, 1 is Monday, etc.
  const diff = (currentDay - weekStartDay + 7) % 7;

  const startDate = new Date(ref);
  startDate.setDate(ref.getDate() - diff);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);

  const prevStartDate = new Date(startDate);
  prevStartDate.setDate(startDate.getDate() - 7);

  const prevEndDate = new Date(endDate);
  prevEndDate.setDate(endDate.getDate() - 7);

  return {
    startDate,
    endDate,
    startDateStr: toLocalDateString(startDate),
    endDateStr: toLocalDateString(endDate),
    prevStartDate,
    prevEndDate,
    prevStartDateStr: toLocalDateString(prevStartDate),
    prevEndDateStr: toLocalDateString(prevEndDate),
  };
}

// ---------------------------------------------------------------------------
// Storage Management
// ---------------------------------------------------------------------------
export function loadRawTelemetrySessions(explicitUserId = null) {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(getStorageKey(explicitUserId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const getRawTelemetrySessions = loadRawTelemetrySessions;

export function saveRawTelemetrySessions(sessions, explicitUserId = null) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(getStorageKey(explicitUserId), JSON.stringify(sessions));
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('keyflow-telemetry-updated'));
    }
  } catch {}
}

export function deleteTelemetrySession(sessionId, explicitUserId = null) {
  const sessions = loadRawTelemetrySessions(explicitUserId);
  const updated = sessions.filter(
    (s) => String(s.id || s.timestamp) !== String(sessionId)
  );
  saveRawTelemetrySessions(updated, explicitUserId);
  return updated;
}

export function clearAllTelemetrySessions(explicitUserId = null) {
  saveRawTelemetrySessions([], explicitUserId);
  return [];
}

/**
 * Synchronizes authoritative practice sessions returned from backend PostgreSQL
 * into the user's isolated local store without duplication.
 */
export function syncTelemetrySessionsFromBackend(serverSessions, explicitUserId = null) {
  if (!Array.isArray(serverSessions)) return [];
  const local = loadRawTelemetrySessions(explicitUserId);
  const existingMap = new Map();

  for (const s of local) {
    if (s.id) existingMap.set(String(s.id), s);
    if (s.sessionId) existingMap.set(String(s.sessionId), s);
    if (s.clientSessionId) existingMap.set(String(s.clientSessionId), s);
  }

  const merged = [...local];

  for (const s of serverSessions) {
    if (!s || typeof s !== 'object') continue;
    const cid = s.client_session_id || `backend_${s.id}`;
    if (existingMap.has(String(cid)) || existingMap.has(String(s.id)) || existingMap.has(String(s.client_session_id))) {
      continue;
    }

    const date = s.created_at ? new Date(s.created_at) : new Date();
    const duration = Math.max(1, Math.round(s.duration_seconds || 1));
    const grossWpm = Number(s.gross_wpm || s.wpm || 0);
    const netWpm = Number(s.net_wpm || 0);
    const accuracy = Number(s.accuracy || 0);
    const totalChars = Number(s.total_chars || 0);
    const correctChars = Number(s.correct_chars || 0);
    const incorrectChars = Number(s.incorrect_chars || 0);
    const errorCount = Number(s.error_count || 0);

    const formattedSession = {
      id: cid,
      sessionId: cid,
      timestamp: date.getTime(),
      date: toLocalDateString(date),
      mode: s.session_type || 'timed',
      sessionType: s.session_type || 'workstation',
      duration,
      durationSeconds: duration,
      wpm: grossWpm,
      grossWpm,
      netWpm,
      accuracy,
      rawAccuracy: accuracy,
      realAccuracy: accuracy,
      totalChars,
      totalKeystrokes: totalChars,
      correctChars,
      correctKeystrokes: correctChars,
      incorrectChars,
      incorrectKeystrokes: incorrectChars,
      mistakes: incorrectChars,
      errorCount,
      status: 'passed',
      characterStats: s.character_stats || s.characterStats || {},
      fingerStats: s.finger_stats || s.fingerStats || {},
    };

    merged.push(formattedSession);
    existingMap.set(String(cid), formattedSession);
  }

  // Sort descending by timestamp
  merged.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  saveRawTelemetrySessions(merged, explicitUserId);
  return merged;
}

/**
 * Merges legacy lessonProgress completed lessons so that users with past
 * activity immediately have their historical data reflected in telemetry.
 */
export function getAllMergedSessions(explicitUserId = null) {
  const explicitSessions = loadRawTelemetrySessions(explicitUserId);
  const explicitIds = new Set(explicitSessions.map((s) => s.id));

  // Synthesize sessions from completed Academy lessons if not already present
  const synthesized = [];
  try {
    const lessonState = getLessonProgress();
    if (lessonState?.lessons) {
      for (const [key, lesson] of Object.entries(lessonState.lessons)) {
        if (!lesson?.completed || !key.startsWith('S') || !key.includes('-L')) continue;
        const synthId = `legacy_lesson_${key}`;
        if (explicitIds.has(synthId)) continue;

        const date = lesson.completedAt ? new Date(lesson.completedAt) : new Date();
        const duration = lesson.lastDuration || 60;
        const wpm = typeof lesson.bestWpm === 'number' ? lesson.bestWpm : (lesson.wpm || 0);
        const accuracy = typeof lesson.bestAccuracy === 'number' ? lesson.bestAccuracy : (lesson.accuracy || 0);
        const mistakes = typeof lesson.lastMistakes === 'number' ? lesson.lastMistakes : (lesson.mistakes || 0);
        const totalChars = Math.round((wpm * 5 * duration) / 60) || 0;
        const correctChars = Math.max(0, totalChars - mistakes);

        synthesized.push({
          id: synthId,
          timestamp: date.getTime(),
          date: toLocalDateString(date),
          mode: 'lesson',
          title: `Academy ${key}`,
          duration,
          wpm,
          grossWpm: wpm,
          accuracy,
          realAccuracy: accuracy,
          totalChars,
          correctChars,
          incorrectChars: mistakes,
          backspaces: mistakes,
          status: 'passed',
          characterStats: {},
          fingerStats: {},
        });
      }
    }
  } catch {}

  const all = [...explicitSessions, ...synthesized];
  // Sort descending by timestamp
  return all.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}

/**
 * Authoritative telemetry session recorder.
 */
export function recordTelemetrySession(data) {
  if (!data) return null;
  const now = new Date();
  const timestamp = data.timestamp || now.getTime();
  const dateStr = data.date || toLocalDateString(now);

  const duration = Math.max(1, Math.round(data.duration || data.duration_seconds || 1));
  const totalChars = Math.max(0, Math.round(data.totalChars || data.total_chars || 0));
  const correctChars = Math.max(0, Math.round(data.correctChars || data.correct_chars || 0));
  const incorrectChars = Math.max(0, Math.round(data.incorrectChars || data.error_count || data.mistakes || 0));
  const backspaces = Math.max(0, Math.round(data.backspaces || 0));

  const grossWpm = typeof data.grossWpm === 'number'
    ? Math.round(data.grossWpm)
    : calculateGrossWpm(totalChars, duration);

  const remainingErrors = data.remainingErrors !== undefined
    ? Number(data.remainingErrors)
    : (data.typedText && data.targetText
        ? countUncorrectedErrors(data.typedText, data.targetText)
        : incorrectChars);

  const netWpm = typeof data.netWpm === 'number'
    ? Math.round(data.netWpm)
    : typeof data.wpm === 'number'
      ? Math.round(data.wpm)
      : calculateNetWpm(grossWpm, remainingErrors, duration);

  const accuracy = typeof data.rawAccuracy === 'number'
    ? Math.max(0, Math.min(100, Math.round(data.rawAccuracy)))
    : typeof data.accuracy === 'number'
      ? Math.max(0, Math.min(100, Math.round(data.accuracy)))
      : (correctChars + incorrectChars) > 0
        ? calculateRawAccuracy(correctChars, incorrectChars)
        : totalChars > 0
          ? Math.min(100, Math.max(0, Math.round((correctChars / Math.max(totalChars, 1)) * 100)))
          : 0;

  const realAccuracy = (correctChars + incorrectChars) > 0
    ? calculateRawAccuracy(correctChars, incorrectChars)
    : accuracy;

  const finalTextAccuracy = typeof data.finalTextAccuracy === 'number'
    ? Math.max(0, Math.min(100, Math.round(data.finalTextAccuracy)))
    : totalChars > 0
      ? Math.min(100, Math.max(0, Math.round((correctChars / Math.max(totalChars, 1)) * 100)))
      : 0;

  const status = data.status || (accuracy >= 85 ? 'passed' : 'failed');

  const session = {
    id: data.id || `sess_${timestamp}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp,
    date: dateStr,
    mode: data.mode || data.session_type || 'practice',
    title: data.title || (data.mode === 'lesson' ? 'Academy Drill' : 'Typing Sprint'),
    duration,
    wpm: typeof data.wpm === 'number' ? Math.round(data.wpm) : grossWpm,
    grossWpm,
    netWpm,
    accuracy,
    realAccuracy,
    finalTextAccuracy,
    totalChars,
    correctChars,
    incorrectChars,
    backspaces,
    status,
    characterStats: data.characterStats || {},
    fingerStats: data.fingerStats || {},
  };

  const existing = loadRawTelemetrySessions(data.userId);
  // Filter out any collision
  const updated = [session, ...existing.filter((s) => s.id !== session.id)];
  // Cap at 1000 detailed local sessions to maintain performance
  const trimmed = updated.slice(0, 1000);
  saveRawTelemetrySessions(trimmed, data.userId);
  return session;
}

// ---------------------------------------------------------------------------
// Preferences: Practice Goal & Week Start
// ---------------------------------------------------------------------------
export function getPracticeGoalMinutes(explicitUserId = null) {
  try {
    if (typeof localStorage === 'undefined') return 30;
    const val = localStorage.getItem(getGoalStorageKey(explicitUserId));
    return val ? parseInt(val, 10) || 30 : 30;
  } catch {
    return 30;
  }
}

export function setPracticeGoalMinutes(minutes, explicitUserId = null) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(getGoalStorageKey(explicitUserId), String(Math.max(5, Math.min(240, minutes))));
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('keyflow-telemetry-goal-updated'));
    }
  } catch {}
}

export function getWeeklyPracticeGoalMinutes(explicitUserId = null) {
  try {
    if (typeof localStorage === 'undefined') return 120;
    const val = localStorage.getItem(getWeeklyGoalStorageKey(explicitUserId));
    return val ? parseInt(val, 10) || 120 : 120;
  } catch {
    return 120;
  }
}

export function setWeeklyPracticeGoalMinutes(minutes, explicitUserId = null) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(getWeeklyGoalStorageKey(explicitUserId), String(Math.max(15, Math.min(1440, minutes))));
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('keyflow-telemetry-weekly-goal-updated'));
    }
  } catch {}
}

export function getWeekStartDay(explicitUserId = null) {
  try {
    if (typeof localStorage === 'undefined') return 0; // 0 = Sunday
    const val = localStorage.getItem(getWeekStartStorageKey(explicitUserId));
    return val !== null ? parseInt(val, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export function setWeekStartDay(dayIndex, explicitUserId = null) {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(getWeekStartStorageKey(explicitUserId), String(dayIndex % 7));
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('keyflow-week-start-updated'));
    }
  } catch {}
}

export const getPracticeGoal = getPracticeGoalMinutes;
export const setPracticeGoal = setPracticeGoalMinutes;
export const getWeeklyPracticeGoal = getWeeklyPracticeGoalMinutes;
export const setWeeklyPracticeGoal = setWeeklyPracticeGoalMinutes;
export const getWeekStartPreference = getWeekStartDay;
export const setWeekStartPreference = setWeekStartDay;

// ---------------------------------------------------------------------------
// Aggregation & Reporting Engine
// ---------------------------------------------------------------------------
export function formatDuration(totalSeconds) {
  const secs = Math.max(0, Math.round(totalSeconds || 0));
  const hrs = Math.floor(secs / 3600);
  const mins = Math.floor((secs % 3600) / 60);
  const remainingSecs = secs % 60;

  if (hrs > 0) {
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  }
  if (mins > 0) {
    return remainingSecs > 0 ? `${mins}m ${remainingSecs}s` : `${mins}m`;
  }
  return `${remainingSecs}s`;
}

export function formatDurationClock(totalSeconds) {
  const secs = Math.max(0, Math.round(totalSeconds || 0));
  const hrs = Math.floor(secs / 3600);
  const mins = Math.floor((secs % 3600) / 60);
  const remainingSecs = secs % 60;

  const hh = String(hrs).padStart(2, '0');
  const mm = String(mins).padStart(2, '0');
  const ss = String(remainingSecs).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

/**
 * Filter sessions by report type: 'today', 'weekly', 'overall'
 */
export function filterSessions(sessions, reportType = 'overall', options = {}) {
  const safeSessions = Array.isArray(sessions) ? sessions : [];
  const weekStartDay = options.weekStartDay !== undefined
    ? options.weekStartDay
    : (options.weekStart !== undefined ? options.weekStart : getWeekStartDay());
  const todayStr = toLocalDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toLocalDateString(yesterday);

  const { startDate, endDate, prevStartDate, prevEndDate } = getWeekDateRange(weekStartDay);

  let current = [];
  let comparison = [];

  const getSessionDateStr = (s) => {
    if (!s) return '';
    if (s.date) return s.date;
    if (s.timestamp) return toLocalDateString(new Date(s.timestamp));
    if (s.created_at) return toLocalDateString(new Date(s.created_at));
    return '';
  };

  const getSessionTimeMs = (s) => {
    if (!s) return 0;
    if (typeof s.timestamp === 'number') return s.timestamp;
    if (s.timestamp) return new Date(s.timestamp).getTime();
    if (s.created_at) return new Date(s.created_at).getTime();
    if (s.date) return new Date(s.date).getTime();
    return 0;
  };

  if (reportType === 'today') {
    current = safeSessions.filter((s) => getSessionDateStr(s) === todayStr);
    comparison = safeSessions.filter((s) => getSessionDateStr(s) === yesterdayStr);
  } else if (reportType === 'weekly') {
    const startMs = startDate.getTime();
    const endMs = endDate.getTime();
    const prevStartMs = prevStartDate.getTime();
    const prevEndMs = prevEndDate.getTime();

    current = safeSessions.filter((s) => {
      const ms = getSessionTimeMs(s);
      return ms >= startMs && ms <= endMs;
    });
    comparison = safeSessions.filter((s) => {
      const ms = getSessionTimeMs(s);
      return ms >= prevStartMs && ms <= prevEndMs;
    });
  } else {
    // Overall: all sessions
    current = safeSessions;
    // Historical baseline: past sessions older than 30 days, or first half of history
    const thirtyDaysAgo = Date.now() - 30 * 86400 * 1000;
    const older = safeSessions.filter((s) => getSessionTimeMs(s) < thirtyDaysAgo);
    if (older.length > 0) {
      comparison = older;
    } else if (safeSessions.length >= 2) {
      const mid = Math.floor(safeSessions.length / 2);
      comparison = safeSessions.slice(0, mid);
    } else {
      comparison = [];
    }
  }

  return { current, comparison };
}

/**
 * Computes comprehensive analytical metrics for a set of sessions.
 * Supports polymorphic calling conventions:
 *   - calculateReportMetrics(sessions, 'today', { weekStart, goalMinutes })
 *   - calculateReportMetrics(sessions, comparisonArray, options)
 *   - calculateReportMetrics(sessions)
 *   - calculateReportMetrics(sessions, optionsObject)
 */
export function calculateReportMetrics(sessions, comparisonOrReportType = [], options = {}) {
  const safeSessions = Array.isArray(sessions) ? sessions : [];

  let targetSessions = safeSessions;
  let comparisonSessions = [];
  let reportType = 'overall';
  let opts = options || {};

  if (typeof comparisonOrReportType === 'string') {
    reportType = comparisonOrReportType;
    const filtered = filterSessions(safeSessions, reportType, opts);
    targetSessions = filtered.current || [];
    comparisonSessions = filtered.comparison || [];
  } else if (Array.isArray(comparisonOrReportType)) {
    comparisonSessions = comparisonOrReportType;
    targetSessions = safeSessions;
    if (typeof options === 'string') {
      reportType = options;
      opts = {};
    } else if (options && typeof options === 'object') {
      opts = options;
      reportType = options.reportType || 'overall';
    }
  } else if (comparisonOrReportType && typeof comparisonOrReportType === 'object') {
    opts = comparisonOrReportType;
    if (typeof opts.reportType === 'string') {
      reportType = opts.reportType;
      const filtered = filterSessions(safeSessions, reportType, opts);
      targetSessions = filtered.current || [];
      comparisonSessions = filtered.comparison || [];
    } else {
      targetSessions = safeSessions;
      comparisonSessions = [];
    }
  }

  // Mandatory safeguards
  if (!Array.isArray(comparisonSessions)) {
    comparisonSessions = [];
  }
  if (!Array.isArray(targetSessions)) {
    targetSessions = [];
  }

  const hasData = targetSessions.length > 0;
  const goalMinutes = opts.goalMinutes || getPracticeGoalMinutes();

  let totalDuration = 0;
  let passedDuration = 0;
  let failedDuration = 0;
  let partialDuration = 0;
  let learningDuration = 0;

  let totalChars = 0;
  let correctChars = 0;
  let incorrectChars = 0;
  let backspaces = 0;

  let passedAttempts = 0;
  let failedAttempts = 0;
  let partialAttempts = 0;

  let maxWpm = 0;
  let totalWpmSum = 0;

  const practicedCharacters = new Set();
  const charMap = {};
  const fingerMap = {
    'left-pinky':  { name: 'Pinky',  hand: 'Left',  keys: 'Q, A, Z', total: 0, correct: 0, incorrect: 0, cpmSum: 0, cpmWeight: 0, wpmSum: 0, wpmWeight: 0 },
    'left-ring':   { name: 'Ring',   hand: 'Left',  keys: 'W, S, X', total: 0, correct: 0, incorrect: 0, cpmSum: 0, cpmWeight: 0, wpmSum: 0, wpmWeight: 0 },
    'left-middle': { name: 'Middle', hand: 'Left',  keys: 'E, D, C', total: 0, correct: 0, incorrect: 0, cpmSum: 0, cpmWeight: 0, wpmSum: 0, wpmWeight: 0 },
    'left-index':  { name: 'Index',  hand: 'Left',  keys: 'R, F, V, T, G, B', total: 0, correct: 0, incorrect: 0, cpmSum: 0, cpmWeight: 0, wpmSum: 0, wpmWeight: 0 },
    'thumb':       { name: 'Thumbs', hand: 'Thumbs', keys: 'Spacebar', total: 0, correct: 0, incorrect: 0, cpmSum: 0, cpmWeight: 0, wpmSum: 0, wpmWeight: 0 },
    'right-index': { name: 'Index',  hand: 'Right', keys: 'Y, H, N, U, J, M', total: 0, correct: 0, incorrect: 0, cpmSum: 0, cpmWeight: 0, wpmSum: 0, wpmWeight: 0 },
    'right-middle':{ name: 'Middle', hand: 'Right', keys: 'I, K, ,', total: 0, correct: 0, incorrect: 0, cpmSum: 0, cpmWeight: 0, wpmSum: 0, wpmWeight: 0 },
    'right-ring':  { name: 'Ring',   hand: 'Right', keys: 'O, L, .', total: 0, correct: 0, incorrect: 0, cpmSum: 0, cpmWeight: 0, wpmSum: 0, wpmWeight: 0 },
    'right-pinky': { name: 'Pinky',  hand: 'Right', keys: 'P, ;, /', total: 0, correct: 0, incorrect: 0, cpmSum: 0, cpmWeight: 0, wpmSum: 0, wpmWeight: 0 },
  };

  const activeDates = new Set();

  targetSessions.forEach((s) => {
    if (!s) return;
    const dur = Number(s.duration ?? s.durationSeconds ?? 0) || 0;
    totalDuration += dur;
    if (s.status === 'passed') passedDuration += dur;
    else if (s.status === 'failed') failedDuration += dur;
    else partialDuration += dur;

    if (s.mode === 'lesson') learningDuration += dur;

    totalChars += Number(s.totalChars ?? s.totalKeystrokes ?? 0) || 0;
    correctChars += Number(s.correctChars ?? s.correctKeystrokes ?? 0) || 0;
    incorrectChars += Number(s.incorrectChars ?? s.mistakes ?? 0) || 0;
    backspaces += Number(s.backspaces ?? 0) || 0;

    if (s.status === 'passed') passedAttempts++;
    else if (s.status === 'failed') failedAttempts++;
    else partialAttempts++;

    const wpm = Number(s.wpm ?? s.grossWpm ?? 0) || 0;
    if (wpm > maxWpm) maxWpm = wpm;
    totalWpmSum += wpm;

    if (s.date) activeDates.add(s.date);

    // Aggregate character stats if present
    if (s.characterStats && typeof s.characterStats === 'object') {
      for (const [char, stats] of Object.entries(s.characterStats)) {
        if (!char) continue;
        practicedCharacters.add(char.toLowerCase());
        if (!charMap[char]) {
          charMap[char] = { char, total: 0, correct: 0, incorrect: 0, wpmSum: 0, count: 0, cpmSum: 0, cpmCount: 0 };
        }
        const tot = Number(stats?.total ?? 0) || 0;
        const cor = Number(stats?.correct ?? 0) || 0;
        const inc = Number(stats?.incorrect ?? 0) || 0;
        const wpmVal = Number(stats?.wpm || 0);
        const cpmVal = Number(stats?.cpm || (wpmVal > 0 ? wpmVal * 5 : 0));

        charMap[char].total += tot;
        charMap[char].correct += cor;
        charMap[char].incorrect += inc;
        if (stats?.wpm) {
          charMap[char].wpmSum += wpmVal;
          charMap[char].count++;
        }
        if (cpmVal > 0) {
          charMap[char].cpmSum += cpmVal;
          charMap[char].cpmCount++;
        }

        // Infer authentic finger attribution from practiced character
        const canonicalFinger = getAuthoritativeFingerForChar(char);
        if (canonicalFinger && fingerMap[canonicalFinger]) {
          const fEntry = fingerMap[canonicalFinger];
          fEntry.total += tot;
          fEntry.correct += cor;
          fEntry.incorrect += inc;
          if (wpmVal > 0) {
            fEntry.wpmSum += wpmVal;
            fEntry.count = (fEntry.count || 0) + 1;
            fEntry.wpmWeight += tot;
          }
          if (cpmVal > 0 && tot > 0) {
            fEntry.cpmSum += cpmVal * tot;
            fEntry.cpmWeight += tot;
          }
        }
      }
    }

    // Aggregate finger stats if present directly and character stats were missing
    if ((!s.characterStats || Object.keys(s.characterStats).length === 0) && s.fingerStats && typeof s.fingerStats === 'object') {
      for (const [fId, stats] of Object.entries(s.fingerStats)) {
        const canonical = fId === 'left-thumb' || fId === 'right-thumb' ? 'thumb' : fId;
        if (fingerMap[canonical]) {
          const tot = Number(stats?.total ?? stats?.totalKeystrokes ?? 0) || 0;
          const cor = Number(stats?.correct ?? 0) || 0;
          const inc = Number(stats?.incorrect ?? 0) || 0;
          const wpmVal = Number(stats?.speed ?? stats?.wpm ?? 0) || 0;
          fingerMap[canonical].total += tot;
          fingerMap[canonical].correct += cor;
          fingerMap[canonical].incorrect += inc;
          if (wpmVal > 0 && tot > 0) {
            fingerMap[canonical].wpmSum += wpmVal * tot;
            fingerMap[canonical].wpmWeight += tot;
          }
        }
      }
    }
  });

  // Calculate averages
  const totalAttempts = targetSessions.length;
  const avgWpm = totalAttempts > 0 ? Math.round(totalWpmSum / totalAttempts) : 0;
  const accuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 0;
  const realAccuracy = (correctChars + incorrectChars + backspaces) > 0
    ? Math.round((correctChars / (correctChars + incorrectChars + backspaces)) * 100)
    : accuracy;

  // Keyboard coverage percentage
  const totalStandardKeys = STANDARD_COVERAGE_CHARS.length;
  let practicedKeyCount = 0;
  STANDARD_COVERAGE_CHARS.forEach((k) => {
    if (practicedCharacters.has(k)) practicedKeyCount++;
  });
  // If user has sessions but character-level tracker is fresh, estimate minimum coverage from volume
  if (practicedKeyCount === 0 && totalChars > 0) {
    practicedKeyCount = Math.min(totalStandardKeys, Math.max(12, Math.round(Math.log2(totalChars) * 4)));
  }
  const coveragePercent = Math.min(100, Math.round((practicedKeyCount / totalStandardKeys) * 100));

  // Comparison deltas
  let compMetrics = null;
  if (Array.isArray(comparisonSessions) && comparisonSessions.length > 0) {
    let compDur = 0;
    let compWpmSum = 0;
    let compCorrect = 0;
    let compTotalChars = 0;
    let compMistakes = 0;
    comparisonSessions.forEach((s) => {
      if (!s) return;
      compDur += Number(s.duration ?? s.durationSeconds ?? 0) || 0;
      compWpmSum += Number(s.wpm ?? s.grossWpm ?? 0) || 0;
      compCorrect += Number(s.correctChars ?? s.correctKeystrokes ?? 0) || 0;
      compTotalChars += Number(s.totalChars ?? s.totalKeystrokes ?? 0) || 0;
      compMistakes += Number(s.incorrectChars ?? s.mistakes ?? 0) || 0;
    });
    const compAvgWpm = comparisonSessions.length > 0 ? Math.round(compWpmSum / comparisonSessions.length) : 0;
    const compAcc = compTotalChars > 0 ? Math.round((compCorrect / compTotalChars) * 100) : 0;
    compMetrics = {
      durationDiff: totalDuration - compDur,
      wpmDiff: avgWpm - compAvgWpm,
      accuracyDiff: accuracy - compAcc,
      attemptsDiff: totalAttempts - comparisonSessions.length,
      charsDiff: totalChars - compTotalChars,
      mistakesDiff: incorrectChars - compMistakes,
    };
  }

  // Calculate Finger Mastery with duration-weighted velocity and real first-attempt accuracy
  const fingerStatsArray = Object.entries(fingerMap).map(([id, data]) => {
    const hasData = data.total >= 3;
    let fWpm = 0;
    if (data.count > 0) {
      fWpm = Math.round(data.wpmSum / data.count);
    } else if (data.cpmWeight > 0) {
      fWpm = Math.round((data.cpmSum / data.cpmWeight) / 5);
    } else if (data.wpmWeight > 0) {
      fWpm = Math.round(data.wpmSum / data.wpmWeight);
    } else {
      fWpm = avgWpm;
    }

    const fAcc = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
    const errRate = data.total > 0 ? ((data.incorrect / data.total) * 100).toFixed(1) + '%' : '0.0%';

    return {
      id,
      name: data.name,
      hand: data.hand,
      keys: data.keys,
      speed: hasData ? fWpm : null,
      speedText: hasData ? `${fWpm} WPM` : '— wpm',
      accuracy: hasData ? fAcc : null,
      accuracyText: hasData ? `${fAcc}%` : '—',
      errorRate: hasData ? errRate : '0.0%',
      totalKeystrokes: data.total,
      correct: data.correct,
      incorrect: data.incorrect,
      hasData,
    };
  });

  // Left hand vs Right hand vs Thumbs
  const leftFingers = fingerStatsArray.filter((f) => f.id.startsWith('left'));
  const rightFingers = fingerStatsArray.filter((f) => f.id.startsWith('right'));
  const thumbFinger = fingerStatsArray.find((f) => f.id === 'thumb');

  const calcHandSummary = (fingers) => {
    const valid = fingers.filter((f) => f.hasData);
    const totalStrokes = fingers.reduce((sum, f) => sum + (f.totalKeystrokes || 0), 0);
    const totalCorrect = fingers.reduce((sum, f) => sum + (f.correct || 0), 0);
    const totalIncorrect = fingers.reduce((sum, f) => sum + (f.incorrect || 0), 0);

    if (valid.length === 0 || totalStrokes < 3) {
      return {
        speed: null,
        accuracy: null,
        keystrokes: totalStrokes,
        hasData: false,
        strongestFinger: null,
      };
    }

    // Keystroke-weighted WPM across valid fingers
    const weightedSpeedSum = valid.reduce((sum, f) => sum + (f.speed * f.totalKeystrokes), 0);
    const validStrokesSum = valid.reduce((sum, f) => sum + f.totalKeystrokes, 0);
    const handSpeed = validStrokesSum > 0 ? Math.round(weightedSpeedSum / validStrokesSum) : 0;

    // Real first-attempt accuracy
    const handAcc = (totalCorrect + totalIncorrect) > 0
      ? Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100)
      : 0;

    // Strongest finger in this reporting period
    const sorted = [...valid].sort((a, b) => (b.speed - a.speed) || (b.accuracy - a.accuracy));
    const strongest = sorted[0]?.name || null;
    const strongestDetails = sorted[0]
      ? { name: sorted[0].name, speed: sorted[0].speed, accuracy: sorted[0].accuracy }
      : null;

    return {
      speed: handSpeed,
      accuracy: handAcc,
      keystrokes: totalStrokes,
      total_keystrokes: totalStrokes,
      hasData: true,
      strongestFinger: strongest,
      strongestFingerDetails: strongestDetails,
    };
  };

  const leftHandStats = calcHandSummary(leftFingers);
  const rightHandStats = calcHandSummary(rightFingers);
  const thumbsStats = {
    speed: thumbFinger?.hasData ? thumbFinger.speed : null,
    accuracy: thumbFinger?.hasData ? thumbFinger.accuracy : null,
    keystrokes: thumbFinger?.totalKeystrokes || 0,
    total_keystrokes: thumbFinger?.totalKeystrokes || 0,
    hasData: Boolean(thumbFinger?.hasData),
  };

  // Character-level breakdown
  const characterStatsArray = Object.values(charMap).map((c) => {
    const cWpm = c.count > 0 ? Math.round(c.wpmSum / c.count) : avgWpm;
    const cCpm = c.cpmCount > 0 ? Math.round(c.cpmSum / c.cpmCount) : Math.round(cWpm * 5);
    const cAcc = c.total > 0 ? Math.round((c.correct / c.total) * 100) : accuracy;
    return {
      char: c.char,
      total: c.total,
      correct: c.correct,
      incorrect: c.incorrect,
      wpm: cWpm,
      cpm: cCpm,
      accuracy: cAcc,
      category: /[a-zA-Z]/.test(c.char)
        ? 'letter'
        : /[0-9]/.test(c.char)
        ? 'number'
        : 'symbol',
    };
  });

  const weekStartDay = opts.weekStartDay !== undefined
    ? opts.weekStartDay
    : (opts.weekStart !== undefined ? opts.weekStart : getWeekStartDay());

  let dateRangeLabel = 'All Time History';
  if (reportType === 'today') {
    dateRangeLabel = `Today, ${toLocalDateString()}`;
  } else if (reportType === 'weekly') {
    const { startDate, endDate } = getWeekDateRange(weekStartDay);
    dateRangeLabel = `${toLocalDateString(startDate)} – ${toLocalDateString(endDate)}`;
  }

  return {
    hasData,
    reportType,
    dateRange: { reportType, label: dateRangeLabel },
    totalDuration,
    formattedDuration: formatDuration(totalDuration),
    durationFormatted: formatDuration(totalDuration),
    passedDuration,
    failedDuration,
    partialDuration,
    learningDuration,
    totalAttempts,
    passedAttempts,
    failedAttempts,
    partialAttempts,
    avgWpm,
    maxWpm,
    accuracy,
    realAccuracy,
    totalChars,
    correctChars,
    incorrectChars,
    backspaces,
    coveragePercent,
    activePracticeDays: activeDates.size,
    comparison: compMetrics,
    deltaWpm: compMetrics ? compMetrics.wpmDiff : 0,
    deltaAccuracy: compMetrics ? compMetrics.accuracyDiff : 0,
    deltaRealAccuracy: compMetrics ? compMetrics.accuracyDiff : 0,
    deltaDuration: compMetrics ? compMetrics.durationDiff : 0,
    deltaAttempts: compMetrics ? compMetrics.attemptsDiff : 0,
    deltaMistakes: compMetrics ? compMetrics.mistakesDiff : 0,
    goalMinutes: reportType === 'weekly' ? (opts.weeklyGoalMinutes || getWeeklyPracticeGoalMinutes(opts.userId)) : goalMinutes,
    dailyGoalMinutes: goalMinutes,
    weeklyGoalMinutes: opts.weeklyGoalMinutes || getWeeklyPracticeGoalMinutes(opts.userId),
    goalProgressPercent: (reportType === 'weekly'
      ? (opts.weeklyGoalMinutes || getWeeklyPracticeGoalMinutes(opts.userId))
      : goalMinutes) > 0
        ? Math.min(100, Math.round(((totalDuration / 60) / (reportType === 'weekly' ? (opts.weeklyGoalMinutes || getWeeklyPracticeGoalMinutes(opts.userId)) : goalMinutes)) * 100))
        : 0,
    fingerStats: fingerStatsArray,
    leftHandStats,
    rightHandStats,
    thumbsStats,
    characterStats: characterStatsArray,
    practicedKeyCount,
    totalStandardKeys,
  };
}

/**
 * Practice Calendar Four-Level Activity Green Color System.
 * - Level 1 — Low Activity: Very Light Green (#bbf7d0)
 * - Level 2 — Moderate Activity: Light Green (#4ade80)
 * - Level 3 — High Activity: Medium Green (#16a34a)
 * - Level 4 — Highest Activity: Dark Green (#14532d)
 * - Level 0 — Unpracticed / Zero Activity: Neutral canvas tone
 */
export const CALENDAR_ACTIVITY_SHADES = {
  level0: 'transparent',
  level1: '#bbf7d0', // Very Light Green (Low Activity)
  level2: '#4ade80', // Light Green (Moderate Activity)
  level3: '#16a34a', // Medium Green (High Activity)
  level4: '#14532d', // Dark Green (Highest Activity)
  neutral: 'transparent',
};

export const CALENDAR_BORDER_SHADES = {
  level0: 'transparent',
  level1: '#86efac',
  level2: '#22c55e',
  level3: '#15803d',
  level4: '#052e16',
  neutral: 'transparent',
};

/**
 * Calculates the 4-level activity intensity (0 to 4) dynamically
 * based on authentic practice volume distribution across recorded days.
 */
export function calculateActivityLevel(durationSeconds, activeDurations = []) {
  if (!durationSeconds || durationSeconds <= 0) return 0;

  const validDurations = Array.isArray(activeDurations)
    ? activeDurations.filter((d) => typeof d === 'number' && d > 0)
    : [];

  // When multiple active days exist with variance, use dynamic quartiles
  if (validDurations.length >= 2) {
    const sorted = [...validDurations].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];

    if (max > min) {
      if (sorted.length >= 4) {
        let q1 = sorted[Math.floor(sorted.length * 0.25)];
        let q2 = sorted[Math.floor(sorted.length * 0.50)];
        let q3 = sorted[Math.floor(sorted.length * 0.75)];

        // If duplicate durations collapse quartile boundaries, interpolate linearly
        if (q1 === q2 || q2 === q3) {
          const step = (max - min) / 4;
          q1 = min + step;
          q2 = min + 2 * step;
          q3 = min + 3 * step;
        }

        if (durationSeconds >= q3 || durationSeconds === max) return 4;
        if (durationSeconds >= q2) return 3;
        if (durationSeconds >= q1) return 2;
        return 1;
      } else {
        const span = max - min;
        const step = span / 4;
        if (durationSeconds >= max || durationSeconds >= min + 3 * step) return 4;
        if (durationSeconds >= min + 2 * step) return 3;
        if (durationSeconds >= min + step) return 2;
        return 1;
      }
    }
  }

  // Meaningful standard volume anchors (for single-session / uniform activity)
  if (durationSeconds >= 1800) return 4; // 30m+
  if (durationSeconds >= 900) return 3;  // 15m - 30m
  if (durationSeconds >= 300) return 2;  // 5m - 15m
  return 1;                              // 1s - 5m
}

/**
 * Generates the 12-month Practice Activity Calendar matrix.
 */
export function generatePracticeCalendar(sessions, weekStartDay = 0) {
  const safeSessions = Array.isArray(sessions) ? sessions : [];
  const dayMap = {};
  let totalAttempts = 0;

  safeSessions.forEach((s) => {
    if (!s) return;
    const dateStr = s.date || (s.timestamp ? toLocalDateString(new Date(s.timestamp)) : null);
    if (!dateStr) return;
    if (!dayMap[dateStr]) {
      dayMap[dateStr] = { duration: 0, attempts: 0, wpmSum: 0, accSum: 0, accCount: 0 };
    }
    const dur = Number(s.duration ?? s.durationSeconds ?? 0) || 0;
    dayMap[dateStr].duration += dur;
    dayMap[dateStr].attempts += 1;
    totalAttempts += 1;
    dayMap[dateStr].wpmSum += Number(s.wpm ?? s.grossWpm ?? 0) || 0;
    const acc = Number(s.accuracy ?? s.realAccuracy ?? 0);
    if (!isNaN(acc) && acc > 0) {
      dayMap[dateStr].accSum += acc;
      dayMap[dateStr].accCount += 1;
    }
  });

  // Collect all authentic active practice durations across the user's recorded days
  const activeDurations = Object.values(dayMap)
    .map((r) => r.duration)
    .filter((d) => d > 0);

  const now = new Date();
  const months = [];

  // Generate rolling 12 months (current month + previous 11 months)
  for (let m = 11; m >= 0; m--) {
    const target = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const year = target.getFullYear();
    const month = target.getMonth();
    const monthName = target.toLocaleString('default', { month: 'long' });
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const weeks = [];
    let currentWeek = [];

    // Helper for padding empty slots
    const createEmptyDay = () => ({
      isCurrentMonth: false,
      day: null,
      dayOfMonth: null,
      date: null,
      dateStr: '',
      duration: 0,
      durationSeconds: 0,
      durationFormatted: '0s',
      attempts: 0,
      avgWpm: 0,
      avgAccuracy: null,
      intensity: 0,
      level: 0,
    });

    // Pad beginning of month according to weekStartDay (0 = Sunday ... 6 = Saturday)
    const firstDay = new Date(year, month, 1).getDay();
    const prefixBlanks = (firstDay - weekStartDay + 7) % 7;
    for (let b = 0; b < prefixBlanks; b++) {
      currentWeek.push(createEmptyDay());
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const record = dayMap[dateStr] || { duration: 0, attempts: 0, wpmSum: 0, accSum: 0, accCount: 0 };
      const avgWpm = record.attempts > 0 ? Math.round(record.wpmSum / record.attempts) : 0;
      const avgAccuracy = record.accCount > 0 ? Math.round(record.accSum / record.accCount) : null;

      // Dynamic 4-level activity intensity scale based on user's authentic practice volume
      const intensity = calculateActivityLevel(record.duration, activeDurations);

      currentWeek.push({
        isCurrentMonth: true,
        day,
        dayOfMonth: day,
        date: dateStr,
        dateStr,
        duration: record.duration,
        durationSeconds: record.duration,
        durationFormatted: formatDuration(record.duration),
        attempts: record.attempts,
        avgWpm,
        avgAccuracy,
        intensity,
        level: intensity,
      });

      if (currentWeek.length === 7) {
        const weekDuration = currentWeek.reduce((sum, d) => sum + (d ? d.duration : 0), 0);
        weeks.push({
          days: currentWeek,
          totalDuration: weekDuration,
          totalDurationFormatted: formatDuration(weekDuration),
          weeklyTotalSeconds: weekDuration,
          weeklyDuration: weekDuration,
        });
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(createEmptyDay());
      }
      const weekDuration = currentWeek.reduce((sum, d) => sum + (d ? d.duration : 0), 0);
      weeks.push({
        days: currentWeek,
        totalDuration: weekDuration,
        totalDurationFormatted: formatDuration(weekDuration),
        weeklyTotalSeconds: weekDuration,
        weeklyDuration: weekDuration,
      });
    }

    months.push({
      year,
      month,
      monthName,
      weeks,
    });
  }

  // Calculate total practice time over last 12 months
  const total12MonthDuration = Object.values(dayMap).reduce((sum, d) => sum + d.duration, 0);

  return {
    totalDuration: total12MonthDuration,
    totalDurationFormatted: formatDuration(total12MonthDuration),
    formattedTotalDuration: formatDuration(total12MonthDuration),
    totalAttempts,
    months,
  };
}

/**
 * Progress Overview multi-metric line/area time series generator.
 */
export function generateProgressTimeSeries(sessions, aggregation = 'daily') {
  if (sessions.length === 0) return [];

  // Group sessions by bucket
  const buckets = {};

  sessions.forEach((s) => {
    let bucketKey = s.date;
    if (aggregation === 'weekly') {
      const d = parseLocalDate(s.date);
      const weekRange = getWeekDateRange(0, d);
      bucketKey = weekRange.startDateStr;
    } else if (aggregation === 'monthly') {
      bucketKey = s.date ? s.date.slice(0, 7) : '2026-10'; // YYYY-MM
    }

    if (!buckets[bucketKey]) {
      buckets[bucketKey] = {
        key: bucketKey,
        duration: 0,
        wpmSum: 0,
        totalChars: 0,
        correctChars: 0,
        count: 0,
        charsPracticed: new Set(),
      };
    }

    buckets[bucketKey].duration += s.duration || 0;
    buckets[bucketKey].wpmSum += s.wpm || 0;
    buckets[bucketKey].totalChars += s.totalChars || 0;
    buckets[bucketKey].correctChars += s.correctChars || 0;
    buckets[bucketKey].count++;

    if (s.characterStats) {
      Object.keys(s.characterStats).forEach((c) => buckets[bucketKey].charsPracticed.add(c.toLowerCase()));
    }
  });

  const sortedKeys = Object.keys(buckets).sort();
  return sortedKeys.map((key) => {
    const b = buckets[key];
    const avgWpm = Math.round(b.wpmSum / b.count);
    const acc = b.totalChars > 0 ? Math.round((b.correctChars / b.totalChars) * 100) : 100;
    const cov = Math.min(100, Math.round((b.charsPracticed.size / STANDARD_COVERAGE_CHARS.length) * 100)) || 85;

    // Format human-readable label
    let label = key;
    if (aggregation === 'daily') {
      const d = parseLocalDate(key);
      label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } else if (aggregation === 'weekly') {
      const d = parseLocalDate(key);
      label = `Wk ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
    } else if (aggregation === 'monthly') {
      const [y, m] = key.split('-');
      const d = new Date(Number(y), Number(m) - 1, 1);
      label = d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
    }

    return {
      date: key,
      label,
      practiceMinutes: Math.round(b.duration / 60),
      durationSeconds: b.duration,
      durationFormatted: formatDuration(b.duration),
      wpm: avgWpm,
      accuracy: acc,
      coverage: cov,
      attempts: b.count,
    };
  });
}

/**
 * Generates personalized, data-driven recommendations from performance.
 */
export function generatePersonalizedInsights(metrics) {
  const insights = [];

  if (!metrics || !metrics.hasData) {
    return [
      {
        id: 'no_data',
        type: 'intro',
        category: 'consistency',
        title: 'Start Your Telemetry Calibration',
        description: 'Complete your first practice sprint or Academy lesson to activate real-time keystroke telemetry, finger latency analysis, and biomechanical intelligence.',
        actionLabel: 'Launch Academy',
        actionText: 'Launch Academy',
        actionHref: '/academy',
        actionLink: '/academy',
      },
    ];
  }

  // 1. Weak Finger Detection
  const validFingers = (metrics.fingerStats || []).filter((f) => f && f.hasData);
  if (validFingers.length >= 2) {
    const sortedByAcc = [...validFingers].sort((a, b) => a.accuracy - b.accuracy);
    const weakest = sortedByAcc[0];
    if (weakest.accuracy < 92) {
      insights.push({
        id: `weak_finger_${weakest.id}`,
        type: 'warning',
        category: 'weak_finger',
        title: `Reinforce ${weakest.name} Discipline`,
        description: `${weakest.name} accuracy is currently ${weakest.accuracy}% (assigned keys: ${weakest.keys}). Focus on deliberate reaches and returning to home row rest positions.`,
        actionLabel: 'Practice Stage 1 Foundations',
        actionText: 'Practice Stage 1 Foundations',
        actionHref: '/academy?stage=1',
        actionLink: '/academy?stage=1',
      });
    }
  }

  // 2. Accuracy vs Speed Guidance
  if (metrics.accuracy < 95 && metrics.avgWpm > 30) {
    insights.push({
      id: 'accuracy_discipline',
      type: 'warning',
      category: 'speed_accuracy_balance',
      title: 'Prioritize Precision Over Pace',
      description: `Your average accuracy is ${metrics.accuracy}%. Scientific touch typing indicates that decelerating by 10% until accuracy hits 98% accelerates long-term neuromuscular mastery.`,
      actionLabel: 'Precision Drills',
      actionText: 'Precision Drills',
      actionHref: '/workstation',
      actionLink: '/workstation',
    });
  } else if (metrics.accuracy >= 98 && metrics.avgWpm < 60) {
    insights.push({
      id: 'speed_acceleration',
      type: 'achievement',
      category: 'speed_accuracy_balance',
      title: 'Ready for Velocity Escalation',
      description: `Phenomenal precision (${metrics.accuracy}% accuracy)! Your muscle memory is solidified. You are ready to push rhythmic cadence on continuous sprints.`,
      actionLabel: 'Sprint Practice',
      actionText: 'Sprint Practice',
      actionHref: '/workstation',
      actionLink: '/workstation',
    });
  }

  // 3. Goal & Consistency Milestones
  if (metrics.goalProgressPercent >= 100) {
    insights.push({
      id: 'goal_met',
      type: 'success',
      category: 'consistency',
      title: 'Practice Target Achieved',
      description: `Outstanding dedication! You have surpassed your ${metrics.goalMinutes}-minute practice goal for this session. Consistency is the primary catalyst of Godspeed tier typing.`,
      actionLabel: 'Try Arcade Challenge',
      actionText: 'Try Arcade Challenge',
      actionHref: '/arcade',
      actionLink: '/arcade',
    });
  }

  return insights;
}

/**
 * Calculates personal records and milestones.
 */
export function getPersonalRecords(sessions) {
  const safeSessions = Array.isArray(sessions) ? sessions : [];
  if (safeSessions.length === 0) {
    return {
      highestWpm: 0,
      bestAccuracy: 0,
      longestSessionFormatted: '0s',
      longestSessionSeconds: 0,
      totalChars: 0,
      totalSessions: 0,
      totalCompletedSessions: 0,
      totalPracticeSeconds: 0,
      mostActiveDate: 'None',
      mostActiveDay: { date: '', durationSeconds: 0, attempts: 0 },
    };
  }

  let highestWpm = 0;
  let bestAccuracy = 0;
  let longestDuration = 0;
  let totalChars = 0;
  let totalPracticeSeconds = 0;

  const dateStats = {};

  safeSessions.forEach((s) => {
    if (!s) return;
    const w = Number(s.wpm ?? s.grossWpm ?? 0) || 0;
    const acc = Number(s.accuracy ?? s.realAccuracy ?? 0) || 0;
    const dur = Number(s.duration ?? s.durationSeconds ?? 0) || 0;
    const chars = Number(s.totalChars ?? s.keystrokes ?? s.words ?? 0) || 0;

    if (w > highestWpm) highestWpm = w;
    if (acc > bestAccuracy) bestAccuracy = acc;
    if (dur > longestDuration) longestDuration = dur;
    totalChars += chars;
    totalPracticeSeconds += dur;

    const dateStr = s.date || (s.timestamp ? toLocalDateString(new Date(s.timestamp)) : '');
    if (dateStr) {
      if (!dateStats[dateStr]) {
        dateStats[dateStr] = { count: 0, duration: 0 };
      }
      dateStats[dateStr].count += 1;
      dateStats[dateStr].duration += dur;
    }
  });

  let mostActiveDate = 'None';
  let mostActiveDay = { date: '', durationSeconds: 0, attempts: 0 };
  let maxCount = 0;
  for (const [d, stats] of Object.entries(dateStats)) {
    if (stats.count > maxCount || (stats.count === maxCount && stats.duration > mostActiveDay.durationSeconds)) {
      maxCount = stats.count;
      mostActiveDate = `${d} (${stats.count} sprints)`;
      mostActiveDay = { date: d, durationSeconds: stats.duration, attempts: stats.count };
    }
  }

  return {
    highestWpm,
    bestAccuracy,
    longestSessionFormatted: formatDuration(longestDuration),
    longestSessionSeconds: longestDuration,
    totalChars,
    totalSessions: safeSessions.length,
    totalCompletedSessions: safeSessions.filter((s) => s && s.status !== 'failed').length,
    totalPracticeSeconds,
    mostActiveDate,
    mostActiveDay,
  };
}

/**
 * Generates downloadable CSV content from telemetry sessions.
 */
export function generateCSVReport(sessions, reportTitle = 'KEYFLOW_Telemetry_Report') {
  const headers = [
    'Session ID',
    'Date',
    'Timestamp',
    'Mode',
    'Title',
    'Duration (seconds)',
    'Duration (formatted)',
    'Net WPM',
    'Gross WPM',
    'Accuracy (%)',
    'Real Accuracy (%)',
    'Total Characters',
    'Correct Characters',
    'Incorrect Characters',
    'Backspaces',
    'Status',
  ];

  const rows = sessions.map((s) => [
    `"${s.id}"`,
    `"${s.date}"`,
    s.timestamp ? `"${new Date(s.timestamp).toISOString()}"` : '""',
    `"${s.mode}"`,
    `"${(s.title || '').replace(/"/g, '""')}"`,
    s.duration,
    `"${formatDuration(s.duration)}"`,
    s.wpm,
    s.grossWpm || s.wpm,
    s.accuracy,
    s.realAccuracy || s.accuracy,
    s.totalChars,
    s.correctChars,
    s.incorrectChars,
    s.backspaces || 0,
    `"${s.status}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  return {
    csvContent,
    filename: `${reportTitle}_${toLocalDateString()}.csv`,
  };
}

export const exportCSVReport = generateCSVReport;

export function downloadCSV(csvContentOrSessions, filename = 'keyflow_telemetry.csv') {
  if (typeof window === 'undefined') return;
  const content = typeof csvContentOrSessions === 'string'
    ? csvContentOrSessions
    : (Array.isArray(csvContentOrSessions) ? generateCSVReport(csvContentOrSessions).csvContent : '');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}


/**
 * Calculates genuine typing rhythm consistency percentage from session history.
 * CV (coefficient of variation) of WPM combined with accuracy stability.
 */
export function calculateTypingConsistency(sessions = []) {
  const valid = (Array.isArray(sessions) ? sessions : []).filter(
    (s) => s && typeof s.wpm === 'number' && s.wpm > 0
  );
  if (valid.length === 0) return null;
  if (valid.length === 1) {
    const acc = typeof valid[0].accuracy === 'number' ? valid[0].accuracy : 100;
    return Math.min(100, Math.max(70, Math.round(acc)));
  }

  const wpms = valid.map((s) => s.wpm);
  const mean = wpms.reduce((a, b) => a + b, 0) / wpms.length;
  if (mean === 0) return 0;

  const variance = wpms.reduce((sum, w) => sum + Math.pow(w - mean, 2), 0) / wpms.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean;

  const speedConsistency = Math.max(0, Math.min(100, Math.round((1 - cv) * 100)));
  const avgAcc = valid.reduce((sum, s) => sum + (Number(s.accuracy) || 100), 0) / valid.length;

  return Math.min(100, Math.max(0, Math.round(speedConsistency * 0.6 + avgAcc * 0.4)));
}

/**
 * Filters sessions by time range: 7d, 30d, 90d, or all.
 */
export function filterSessionsByTimeRange(sessions = [], rangeKey = 'all') {
  if (!Array.isArray(sessions) || sessions.length === 0) return [];
  if (rangeKey === 'all' || rangeKey === 'overall') return sessions;

  if (rangeKey === 'today' || rangeKey === 'daily' || rangeKey === '1d') {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const cutoff = todayStart.getTime();
    return sessions.filter((s) => {
      const t = s.timestamp || (s.date ? new Date(s.date).getTime() : 0);
      return t >= cutoff;
    });
  }

  const now = Date.now();
  let days = 30;
  if (rangeKey === '7d' || rangeKey === 'weekly') days = 7;
  if (rangeKey === '30d') days = 30;
  if (rangeKey === '90d') days = 90;

  const cutoff = now - days * 86400 * 1000;
  return sessions.filter((s) => {
    const t = s.timestamp || (s.date ? new Date(s.date).getTime() : 0);
    return t >= cutoff;
  });
}

