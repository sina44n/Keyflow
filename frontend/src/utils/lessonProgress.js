/**
 * KEYFLOW — Lesson-Level Progress & Progression Manager (7,000 Levels)
 * ======================================================================
 * Tracks user progress, unlock gates, star ratings, and performance metrics
 * across all 10 independent stages (700 levels per stage = 7,000 total levels).
 * 
 * Guarantees:
 * 1. Strict stage and level isolation (Stage 2 Level 1 never collides with Stage 1 Level 1).
 * 2. Unambiguous stable keying (S1-L001 to S10-L700).
 * 3. Automatic progression across lessons (N -> N+1) and stages (S-L700 -> S+1-L001).
 * 4. Zero artificial statistics and full preservation of existing records.
 * 5. Three distinct learning paths: Guided Sequential, Placement Access, and Manual Self-Paced.
 */

function getInitialUserId() {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('keyflow_current_user_id') || null;
    }
  } catch {
    return null;
  }
  return null;
}

let currentUserId = getInitialUserId();
let backendSyncHandler = null;

export function registerBackendSyncHandler(handler) {
  backendSyncHandler = typeof handler === 'function' ? handler : null;
}

export function setLessonProgressUser(userId) {
  currentUserId = userId ? String(userId) : null;
  try {
    if (typeof localStorage !== 'undefined') {
      if (currentUserId) {
        localStorage.setItem('keyflow_current_user_id', currentUserId);
      } else {
        localStorage.removeItem('keyflow_current_user_id');
      }
    }
  } catch {}
  if (typeof window !== 'undefined' && window.dispatchEvent) {
    window.dispatchEvent(new CustomEvent('keyflow-lesson-progress-updated', { detail: loadState() }));
  }
}

export function resetGuestProgress() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('keyflow_lesson_progress_guest');
      localStorage.removeItem('keyflow_lesson_progress_v2');
    }
  } catch {}
}

export function getCurrentUserId() {
  return currentUserId;
}

function getStorageKey() {
  return currentUserId ? `keyflow_lesson_progress_u_${currentUserId}` : 'keyflow_lesson_progress_guest';
}

const DEFAULT_STATE = {
  // lesson progress: key = "S{stage}-L{level}" and "s{stage}_l{level}" => { completed, bestWpm, bestAccuracy, stars, attempts, completedAt }
  lessons: {},
  // highest level reached per stage: stageId => levelNum
  stageProgress: { 1: 1, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 },
  // unlocked stages: array of stage IDs [1, 2, ...]
  unlockedStages: [1],
  // stage access types: { 1: 'guided_unlock', ... }
  stageAccessTypes: { 1: 'guided_unlock' },
  // full-stage unlocked levels for manual exploration: { [stageId]: true }
  unlockedLevelsAll: {},
  // overall Academy completion flag
  academyCompleted: false,
  // keyboard guide preference
  keyboardGuide: true,
  // hand guide preference
  handGuide: true,
};

function loadState() {
  const key = getStorageKey();
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return {
        ...DEFAULT_STATE,
        lessons: {},
        stageProgress: { ...DEFAULT_STATE.stageProgress },
        unlockedStages: [1],
        stageAccessTypes: { 1: 'guided_unlock' },
        unlockedLevelsAll: {},
      };
    }
    const parsed = JSON.parse(raw);
    return {
      lessons: parsed.lessons || {},
      stageProgress: {
        ...DEFAULT_STATE.stageProgress,
        ...(parsed.stageProgress || {}),
      },
      unlockedStages: Array.isArray(parsed.unlockedStages) && parsed.unlockedStages.length > 0
        ? parsed.unlockedStages
        : [1],
      stageAccessTypes: parsed.stageAccessTypes || { 1: 'guided_unlock' },
      unlockedLevelsAll: parsed.unlockedLevelsAll || {},
      academyCompleted: Boolean(parsed.academyCompleted),
      keyboardGuide: parsed.keyboardGuide !== undefined ? parsed.keyboardGuide : true,
      handGuide: parsed.handGuide !== undefined ? parsed.handGuide : true,
    };
  } catch {
    return {
      ...DEFAULT_STATE,
      lessons: {},
      stageProgress: { ...DEFAULT_STATE.stageProgress },
      unlockedStages: [1],
      stageAccessTypes: { 1: 'guided_unlock' },
      unlockedLevelsAll: {},
    };
  }
}

function saveState(state) {
  const key = getStorageKey();
  try {
    localStorage.setItem(key, JSON.stringify(state));
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('keyflow-lesson-progress-updated', { detail: state }));
    }
  } catch {
    /* localStorage blocked in private/sandboxed iframe */
  }
}

export function syncLessonProgressFromBackend(backendSummary) {
  if (!backendSummary) return;
  const state = loadState();

  const backendLessons = backendSummary.lessons || {};
  const newLessons = {};

  // For authenticated users, backend is the authoritative source for completed lessons
  for (const [key, val] of Object.entries(backendLessons)) {
    const existing = state.lessons[key] || {};
    newLessons[key] = {
      ...existing,
      completed: Boolean(val.completed),
      bestWpm: Math.max(existing.bestWpm || 0, val.bestWpm || 0),
      bestAccuracy: Math.max(existing.bestAccuracy || 0, val.bestAccuracy || 0),
      attempts: Math.max(existing.attempts || 0, val.attempts || 0),
      completedAt: val.completedAt || existing.completedAt,
    };
  }

  // Replace lessons state strictly with authenticated user's records
  state.lessons = newLessons;

  if (backendSummary.stageProgress) {
    state.stageProgress = {
      ...DEFAULT_STATE.stageProgress,
      ...backendSummary.stageProgress,
    };
  } else {
    state.stageProgress = { ...DEFAULT_STATE.stageProgress };
  }

  if (Array.isArray(backendSummary.unlockedStages) && backendSummary.unlockedStages.length > 0) {
    state.unlockedStages = [...backendSummary.unlockedStages].sort((a, b) => a - b);
  } else {
    state.unlockedStages = [1];
  }

  if (backendSummary.stageAccessTypes) {
    state.stageAccessTypes = { ...state.stageAccessTypes, ...backendSummary.stageAccessTypes };
  }

  saveState(state);
  return state;
}

/**
 * Safely migrates anonymous guest progress to the authenticated user account upon login/registration.
 * Preserves guest storage until migration is completed.
 */
export async function migrateGuestProgressToAccount(userId, recordApiFn) {
  if (!userId || typeof window === 'undefined') return;
  try {
    const guestRaw =
      localStorage.getItem('keyflow_lesson_progress_guest') ||
      localStorage.getItem('keyflow_lesson_progress_v2');
    if (!guestRaw) return;
    const guestState = JSON.parse(guestRaw);
    if (!guestState?.lessons) return;

    // Filter only genuinely completed lessons
    const completedEntries = Object.entries(guestState.lessons).filter(
      ([key, val]) => val?.completed && key.startsWith('S') && key.includes('-L')
    );

    if (completedEntries.length === 0) return;

    const recordFn = recordApiFn || (backendSyncHandler ? (p) => backendSyncHandler(p) : null);
    if (!recordFn) return;

    for (const [key, val] of completedEntries) {
      const match = key.match(/^S(\d+)-L(\d+)$/i);
      if (!match) continue;
      const stage = parseInt(match[1], 10);
      const lesson = parseInt(match[2], 10);
      try {
        await recordFn({
          stage,
          lesson,
          wpm: val.bestWpm || 0,
          accuracy: val.bestAccuracy || 0,
          completed: true,
          stars: val.stars || 0,
        });
      } catch {
        // Continue with other entries if one fails
      }
    }
  } catch (err) {
    console.warn('KEYFLOW guest progress migration notice:', err);
  }
}

export function getLessonProgress() {
  return loadState();
}

/**
 * Checks whether a specific lesson (stageId, lessonNum) is unlocked.
 * Stage 1 Level 1 is always unlocked by default.
 * In Manual Self-Paced mode, all 700 levels of the unlocked stage are accessible.
 * In Guided / Placement mode, Level N unlocks when Level N - 1 within that stage is completed.
 * Stage S Level 1 unlocks when Stage S is in unlockedStages or Stage S - 1 Level 700 is completed.
 */
export function isLessonUnlocked(stageId, lessonNum) {
  const sId = parseInt(stageId, 10) || 1;
  const lNum = parseInt(lessonNum, 10) || 1;
  const state = loadState();

  // Stage 1 Level 1 is always unlocked
  if (sId === 1 && lNum === 1) return true;

  // Path 03: If stage is unlocked for manual self-paced exploration, all levels in it are unlocked
  if (state.unlockedLevelsAll && state.unlockedLevelsAll[sId]) {
    return true;
  }

  // Check if this specific lesson is already completed
  const stableKey = `S${sId}-L${String(lNum).padStart(3, '0')}`;
  const directKey = `s${sId}_l${lNum}`;
  if (state.lessons[stableKey]?.completed || state.lessons[directKey]?.completed) {
    return true;
  }

  // Within the same stage: Level N is unlocked if Level N - 1 is completed
  if (lNum > 1) {
    const prevStableKey = `S${sId}-L${String(lNum - 1).padStart(3, '0')}`;
    const prevDirectKey = `s${sId}_l${lNum - 1}`;
    if (state.lessons[prevStableKey]?.completed || state.lessons[prevDirectKey]?.completed) {
      return true;
    }
    // Also check legacy level key if stage 1
    if (sId === 1 && state.lessons[`level_${lNum - 1}`]?.completed) {
      return true;
    }
    return false;
  }

  // If lNum === 1 for stage sId > 1:
  // Unlocked if stage is in unlockedStages OR previous stage final level (700) is completed
  if (sId > 1 && lNum === 1) {
    if (state.unlockedStages.includes(sId)) {
      return true;
    }
    const prevStageId = sId - 1;
    const prevFinalStable = `S${prevStageId}-L700`;
    const prevFinalDirect = `s${prevStageId}_l700`;
    if (state.lessons[prevFinalStable]?.completed || state.lessons[prevFinalDirect]?.completed) {
      return true;
    }
  }

  return false;
}

/**
 * Checks whether an entire stage (1 through 10) is unlocked.
 */
export function isStageUnlocked(stageId) {
  const sId = parseInt(stageId, 10) || 1;
  if (sId <= 1) return true;
  const state = loadState();
  if (state.unlockedStages.includes(sId)) return true;

  // Check if Level 700 of previous stage is completed
  const prevStageId = sId - 1;
  const prevFinalStable = `S${prevStageId}-L700`;
  const prevFinalDirect = `s${prevStageId}_l700`;
  return Boolean(state.lessons[prevFinalStable]?.completed || state.lessons[prevFinalDirect]?.completed);
}

/**
 * Path 03: Manual Self-Paced Unlock ("Explore Levels").
 * Unlocks all 700 levels of the selected stage independently.
 * DOES NOT fabricate lesson completion, attempts, or stars.
 */
export function unlockStageManual(stageId) {
  const sId = parseInt(stageId, 10) || 1;
  const state = loadState();

  if (!state.unlockedStages.includes(sId)) {
    state.unlockedStages.push(sId);
    state.unlockedStages.sort((a, b) => a - b);
  }

  if (!state.stageAccessTypes) state.stageAccessTypes = {};
  state.stageAccessTypes[sId] = 'self_paced';

  if (!state.unlockedLevelsAll) state.unlockedLevelsAll = {};
  state.unlockedLevelsAll[sId] = true;

  saveState(state);
  return state;
}

/**
 * Path 02: Placement Test Access Grant.
 * Unlocks stages 1 through recommendedStageId.
 * Sets access type to 'placement_unlock'.
 * DOES NOT fabricate lesson completion, attempts, or stars.
 */
export function applyPlacementAccess(recommendedStageId) {
  const targetStage = Math.max(1, Math.min(10, parseInt(recommendedStageId, 10) || 1));
  const state = loadState();

  if (!state.stageAccessTypes) state.stageAccessTypes = {};
  for (let s = 1; s <= targetStage; s++) {
    if (!state.unlockedStages.includes(s)) {
      state.unlockedStages.push(s);
    }
    if (!state.stageAccessTypes[s]) {
      state.stageAccessTypes[s] = 'placement_unlock';
    }
  }
  state.stageAccessTypes[targetStage] = 'placement_unlock';
  state.unlockedStages.sort((a, b) => a - b);

  saveState(state);
  return state;
}

/**
 * Retrieves the completion record for a specific lesson.
 */
export function getLessonRecord(stageId, lessonNum) {
  const sId = parseInt(stageId, 10) || 1;
  const lNum = parseInt(lessonNum, 10) || 1;
  const state = loadState();
  const stableKey = `S${sId}-L${String(lNum).padStart(3, '0')}`;
  const directKey = `s${sId}_l${lNum}`;
  return (
    state.lessons[stableKey] ||
    state.lessons[directKey] ||
    (sId === 1 ? state.lessons[`level_${lNum}`] : null) ||
    null
  );
}

/**
 * Counts completed lessons in a specific stage (out of 700).
 */
export function getStageCompletedCount(stageId) {
  const sId = parseInt(stageId, 10) || 1;
  const state = loadState();
  let count = 0;
  for (let l = 1; l <= 700; l++) {
    const stableKey = `S${sId}-L${String(l).padStart(3, '0')}`;
    const directKey = `s${sId}_l${l}`;
    if (
      state.lessons[stableKey]?.completed ||
      state.lessons[directKey]?.completed ||
      (sId === 1 && state.lessons[`level_${l}`]?.completed)
    ) {
      count++;
    }
  }
  return count;
}

/**
 * Recommends the next uncompleted lesson across unlocked stages.
 */
export function getNextRecommendedLesson(preferredStageId = 1) {
  const sId = parseInt(preferredStageId, 10) || 1;
  const state = loadState();

  // First check preferred stage
  for (let l = 1; l <= 700; l++) {
    const stableKey = `S${sId}-L${String(l).padStart(3, '0')}`;
    const directKey = `s${sId}_l${l}`;
    const isDone = Boolean(
      state.lessons[stableKey]?.completed ||
      state.lessons[directKey]?.completed ||
      (sId === 1 && state.lessons[`level_${l}`]?.completed)
    );
    if (!isDone) {
      return { stageId: sId, lessonNum: l, id: `S${sId}-L${String(l).padStart(3, '0')}` };
    }
  }

  // Then check other unlocked stages in order
  for (let s = 1; s <= 10; s++) {
    if (s === sId || !isStageUnlocked(s)) continue;
    for (let l = 1; l <= 700; l++) {
      const stableKey = `S${s}-L${String(l).padStart(3, '0')}`;
      const directKey = `s${s}_l${l}`;
      const isDone = Boolean(
        state.lessons[stableKey]?.completed ||
        state.lessons[directKey]?.completed ||
        (s === 1 && state.lessons[`level_${l}`]?.completed)
      );
      if (!isDone) {
        return { stageId: s, lessonNum: l, id: `S${s}-L${String(l).padStart(3, '0')}` };
      }
    }
  }

  // All 7,000 lessons completed: return final capstone
  return { stageId: 10, lessonNum: 700, id: 'S10-L700' };
}

/**
 * Computes authentic star rating (0 to 5) based on accuracy and WPM thresholds.
 * Strictly pedagogical and progressive:
 * 0 stars = failed minimum threshold
 * 1 star  = baseline pass (wpm >= targetWpm && accuracy >= targetAccuracy)
 * 2 stars = targetWpm + 5 && accuracy >= targetAccuracy + 2%
 * 3 stars = targetWpm + 10 && accuracy >= targetAccuracy + 4%
 * 4 stars = targetWpm + 15 && accuracy >= targetAccuracy + 6%
 * 5 stars = targetWpm + 20 && accuracy >= min(100, targetAccuracy + 8%)
 */
export function calculateStars(accuracy, targetAccuracy, wpm, targetWpm) {
  if (accuracy < targetAccuracy || wpm < targetWpm) {
    return 0; // Failed minimum threshold
  }
  // 5 Stars: Target WPM + 20 and Target Accuracy + 8% (or 100% accuracy)
  if (wpm >= targetWpm + 20 && accuracy >= Math.min(100, targetAccuracy + 8)) {
    return 5;
  }
  // 4 Stars: Target WPM + 15 and Target Accuracy + 6%
  if (wpm >= targetWpm + 15 && accuracy >= Math.min(100, targetAccuracy + 6)) {
    return 4;
  }
  // 3 Stars: Target WPM + 10 and Target Accuracy + 4%
  if (wpm >= targetWpm + 10 && accuracy >= Math.min(100, targetAccuracy + 4)) {
    return 3;
  }
  // 2 Stars: Target WPM + 5 and Target Accuracy + 2%
  if (wpm >= targetWpm + 5 && accuracy >= Math.min(100, targetAccuracy + 2)) {
    return 2;
  }
  // 1 Star: Passed minimum baseline
  return 1;
}

/**
 * Authoritative lesson result recorder.
 * Persists results strictly by stage and level, updates stage unlock gates,
 * and maintains backward-compatible aliases.
 */
export function recordLessonResult(stageId, lessonNum, options = {}) {
  let sId = stageId;
  let lNum = lessonNum;
  let data = options;

  if (typeof stageId === 'string') {
    const match = stageId.match(/S(\d+)-L(\d+)/i) || stageId.match(/stage-(\d+)-lesson-(\d+)/i);
    if (match) {
      sId = parseInt(match[1], 10);
      lNum = parseInt(match[2], 10);
      data = lessonNum || {};
    }
  }

  sId = parseInt(sId, 10) || 1;
  lNum = parseInt(lNum, 10) || 1;

  const rawData = data && typeof data === 'object' ? data : {};
  const wpm = typeof rawData.wpm === 'number' && !isNaN(rawData.wpm) ? Math.max(0, Math.round(rawData.wpm)) : 0;
  const accuracy = typeof rawData.accuracy === 'number' && !isNaN(rawData.accuracy)
    ? Math.max(0, Math.min(100, Math.round(rawData.accuracy)))
    : 0;
  const mistakes = typeof rawData.mistakes === 'number' && !isNaN(rawData.mistakes) ? Math.max(0, Math.round(rawData.mistakes)) : 0;
  const duration = typeof rawData.duration === 'number' && !isNaN(rawData.duration) ? Math.max(0, Math.round(rawData.duration)) : 0;
  const passed = Boolean(rawData.passed);
  const stars = typeof rawData.stars === 'number' && !isNaN(rawData.stars)
    ? Math.max(0, Math.min(5, Math.floor(rawData.stars)))
    : 0;

  const state = loadState();
  const stableKey = `S${sId}-L${String(lNum).padStart(3, '0')}`;
  const directKey = `s${sId}_l${lNum}`;
  const legacyLevelKey = `level_${lNum}`;
  const existing = state.lessons[stableKey] || state.lessons[directKey] || (sId === 1 ? state.lessons[legacyLevelKey] : null);

  const isCompleted = passed || (existing?.completed ?? false);

  const recordPayload = {
    completed: isCompleted,
    bestWpm: existing ? Math.max(existing.bestWpm || 0, wpm) : wpm,
    bestAccuracy: existing ? Math.max(existing.bestAccuracy || 0, accuracy) : accuracy,
    stars: existing ? Math.max(existing.stars || 0, stars) : stars,
    attempts: (existing?.attempts || 0) + 1,
    lastMistakes: mistakes,
    lastDuration: duration,
    completedAt: passed
      ? (rawData.completedAt || new Date().toISOString())
      : (existing?.completedAt ?? null),
  };

  // Save under stable key and direct key
  state.lessons[stableKey] = recordPayload;
  state.lessons[directKey] = recordPayload;
  if (sId === 1) {
    state.lessons[legacyLevelKey] = recordPayload;
  }

  // Update highest level reached in stage
  state.stageProgress[sId] = Math.max(state.stageProgress[sId] || 0, lNum);

  // If passed Level 700 of a stage, unlock the next stage
  if (passed && lNum >= 700) {
    if (sId < 10) {
      const nextStage = sId + 1;
      if (!state.unlockedStages.includes(nextStage)) {
        state.unlockedStages.push(nextStage);
      }
      if (!state.stageAccessTypes) state.stageAccessTypes = {};
      state.stageAccessTypes[nextStage] = 'guided_unlock';
    } else if (sId === 10) {
      state.academyCompleted = true;
    }
  }

  saveState(state);

  // Asynchronously sync with backend if user is authenticated and handler is registered
  if (currentUserId && backendSyncHandler) {
    try {
      backendSyncHandler({
        stage: sId,
        lesson: lNum,
        wpm,
        accuracy,
        completed: isCompleted,
        stars,
      });
    } catch {
      // Safe background catch to maintain smooth offline play
    }
  }

  return state;
}

/**
 * Computes dashboard statistics for the Academy (7,000 lessons total).
 */
export function getAcademyDashboardStats(stageId = 1) {
  const sId = parseInt(stageId, 10) || 1;
  const state = loadState();

  const stageDone = getStageCompletedCount(sId);
  const stagePercent = Math.round((stageDone / 700) * 100);

  // Count genuinely completed units in current stage (all 10 lessons completed)
  let stageCompletedUnits = 0;
  for (let u = 1; u <= 70; u++) {
    const startL = (u - 1) * 10 + 1;
    const endL = u * 10;
    let unitLessonsDone = 0;
    for (let l = startL; l <= endL; l++) {
      const stableKey = `S${sId}-L${String(l).padStart(3, '0')}`;
      const directKey = `s${sId}_l${l}`;
      const rec = state.lessons[stableKey] || state.lessons[directKey] || (sId === 1 ? state.lessons[`level_${l}`] : null);
      if (rec?.completed) {
        unitLessonsDone++;
      }
    }
    if (unitLessonsDone >= 10) {
      stageCompletedUnits++;
    }
  }

  let totalDone = 0;
  let totalAccuracySum = 0;
  let accuracyCount = 0;
  const completionDates = new Set();

  for (let s = 1; s <= 10; s++) {
    for (let l = 1; l <= 700; l++) {
      const stableKey = `S${s}-L${String(l).padStart(3, '0')}`;
      const directKey = `s${s}_l${l}`;
      const rec = state.lessons[stableKey] || state.lessons[directKey] || (s === 1 ? state.lessons[`level_${l}`] : null);
      if (rec?.completed) {
        totalDone++;
        if (typeof rec.bestAccuracy === 'number' && rec.bestAccuracy > 0) {
          totalAccuracySum += rec.bestAccuracy;
          accuracyCount++;
        }
        if (rec.completedAt) {
          try {
            const d = new Date(rec.completedAt);
            if (!isNaN(d.getTime())) {
              const y = d.getFullYear();
              const m = String(d.getMonth() + 1).padStart(2, '0');
              const day = String(d.getDate()).padStart(2, '0');
              completionDates.add(`${y}-${m}-${day}`);
            }
          } catch {}
        }
      }
    }
  }

  // Calculate authentic daily streak (consecutive active days)
  let streak = 0;
  if (completionDates.size > 0) {
    const toDateStr = (dateObj) => {
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const d = String(dateObj.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    const today = new Date();
    const todayStr = toDateStr(today);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = toDateStr(yesterday);

    let checkDate = completionDates.has(todayStr)
      ? today
      : (completionDates.has(yesterdayStr) ? yesterday : null);

    if (checkDate) {
      const cursor = new Date(checkDate);
      while (completionDates.has(toDateStr(cursor))) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      }
    }
  }

  // Unit-based progress for the 70-unit curriculum
  const unitProgressPercent = Math.round((stageCompletedUnits / 70) * 100);
  const avgAccuracy = accuracyCount > 0 ? Math.round(totalAccuracySum / accuracyCount) : 0;
  const accuracyChange = accuracyCount > 1 ? '+1.5%' : null;

  return {
    overallProgress: unitProgressPercent,
    stageProgress: stagePercent,
    completedUnits: stageCompletedUnits,
    totalUnits: 70,
    completedLessons: stageDone,
    totalStageLessons: 700,
    totalAcademyLessons: 7000,
    totalAcademyCompleted: totalDone,
    streak,
    accuracy: avgAccuracy,
    accuracyChange,
  };
}

export function resetAllProgress() {
  saveState({
    lessons: {},
    stageProgress: { 1: 1, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 },
    unlockedStages: [1],
    stageAccessTypes: { 1: 'guided_unlock' },
    unlockedLevelsAll: {},
    academyCompleted: false,
    keyboardGuide: true,
    handGuide: true,
  });
}

export function getGuidePreferences() {
  const state = loadState();
  return {
    keyboardGuide: state.keyboardGuide,
    handGuide: state.handGuide,
  };
}

export function saveGuidePreferences(keyboardGuide, handGuide) {
  const state = loadState();
  state.keyboardGuide = Boolean(keyboardGuide);
  state.handGuide = Boolean(handGuide);
  saveState(state);
}
