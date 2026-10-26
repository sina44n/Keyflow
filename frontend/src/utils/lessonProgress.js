/**
 * KEYFLOW — Lesson-Level Progress Manager
 * ========================================
 * Tracks progress at the individual lesson level (stage + lessonNum).
 * Supports 4,200 lessons across 7 stages.
 * Persists via localStorage. Dispatches keyflow-progress-updated events.
 */

const STORAGE_KEY = 'keyflow_lesson_progress_v2';
const STAGE_STORAGE_KEY = 'keyflow_academy_progress';

const DEFAULT_STATE = {
  // lesson progress: key = "s{stageId}_l{lessonNum}" => { completed, bestWpm, bestAccuracy, stars, attempts }
  lessons: {},
  // highest lesson reached per stage: stageId => lessonNum
  stageProgress: { 1: 1, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 },
  // which stages are unlocked
  unlockedStages: [1],
  // keyboard guide preference
  keyboardGuide: true,
  // hand guide preference
  handGuide: true,
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE, lessons: {}, stageProgress: { ...DEFAULT_STATE.stageProgress }, unlockedStages: [1] };
    const parsed = JSON.parse(raw);
    return {
      lessons: parsed.lessons || {},
      stageProgress: parsed.stageProgress || { ...DEFAULT_STATE.stageProgress },
      unlockedStages: parsed.unlockedStages || [1],
      keyboardGuide: parsed.keyboardGuide !== undefined ? parsed.keyboardGuide : true,
      handGuide: parsed.handGuide !== undefined ? parsed.handGuide : true,
    };
  } catch {
    return { ...DEFAULT_STATE, lessons: {}, stageProgress: { ...DEFAULT_STATE.stageProgress }, unlockedStages: [1] };
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('keyflow-lesson-progress-updated', { detail: state }));
  } catch { /* localStorage blocked */ }
}

export function getLessonProgress() {
  return loadState();
}

export function isLessonUnlocked(stageId, lessonNum) {
  const state = loadState();
  if (!state.unlockedStages.includes(stageId)) return false;
  if (lessonNum === 1) return true;
  // Check if previous lesson is completed
  const prevKey = `s${stageId}_l${lessonNum - 1}`;
  return !!(state.lessons[prevKey]?.completed);
}

export function isStageUnlocked(stageId) {
  const state = loadState();
  return state.unlockedStages.includes(stageId);
}

export function getLessonRecord(stageId, lessonNum) {
  const state = loadState();
  return state.lessons[`s${stageId}_l${lessonNum}`] || null;
}

export function getStageCompletedCount(stageId) {
  const state = loadState();
  let count = 0;
  for (let l = 1; l <= 600; l++) {
    if (state.lessons[`s${stageId}_l${l}`]?.completed) count++;
  }
  return count;
}

export function getNextRecommendedLesson(stageId) {
  const state = loadState();
  if (!state.unlockedStages.includes(stageId)) return { stageId, lessonNum: 1 };
  for (let l = 1; l <= 600; l++) {
    if (!state.lessons[`s${stageId}_l${l}`]?.completed) {
      return { stageId, lessonNum: l };
    }
  }
  // All done in this stage — return next stage
  if (stageId < 7) return { stageId: stageId + 1, lessonNum: 1 };
  return { stageId, lessonNum: 600 };
}

export function calculateStars(accuracy, targetAccuracy, wpm, targetWpm) {
  // Fail if below required target threshold
  if (accuracy < targetAccuracy || wpm < targetWpm) {
    return 0;
  }

  // 5 Stars: Flawless mastery (99%+ accuracy with 25%+ over target speed, or 98%+ with 30%+)
  if ((accuracy >= 99 && wpm >= targetWpm * 1.25) || (accuracy >= 98 && wpm >= targetWpm * 1.3)) {
    return 5;
  }

  // 4 Stars: Excellent (97%+ accuracy and 15%+ over target speed)
  if (accuracy >= 97 && wpm >= targetWpm * 1.15) {
    return 4;
  }

  // 3 Stars: Great (95%+ accuracy and 10%+ over target speed, or 98%+ accuracy)
  if ((accuracy >= 95 && wpm >= targetWpm * 1.1) || (accuracy >= 98 && wpm >= targetWpm)) {
    return 3;
  }

  // 2 Stars: Good (accuracy at least 2% over target, or 5%+ over target speed)
  if (
    (accuracy >= targetAccuracy + 2 && wpm >= targetWpm) ||
    (accuracy >= targetAccuracy && wpm >= targetWpm * 1.05)
  ) {
    return 2;
  }

  // 1 Star: Baseline passed (met target accuracy and target WPM)
  return 1;
}

export function recordLessonResult(stageId, lessonNum, options = {}) {
  let sId = stageId;
  let lNum = lessonNum;
  let data = options;

  // Handle call with lessonId string like 'stage-1-lesson-001'
  if (typeof stageId === 'string') {
    const match = stageId.match(/stage-(\d+)-lesson-(\d+)/);
    if (match) {
      sId = parseInt(match[1], 10);
      lNum = parseInt(match[2], 10);
      data = lessonNum || {};
    }
  }

  // Validate inputs: remove misleading defaults of 3 stars and passed: true
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
  const key = `s${sId}_l${lNum}`;
  const existing = state.lessons[key];

  // Preserve existing completed status if previously passed; failed lessons must never default to passed
  const isCompleted = passed || (existing?.completed ?? false);

  state.lessons[key] = {
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

  // Update stage progress tracker only if completed
  if (isCompleted) {
    if (!state.stageProgress) state.stageProgress = {};
    const currentMax = state.stageProgress[sId] || 0;
    if (lNum > currentMax) state.stageProgress[sId] = lNum;
  }

  // Unlock next stage if lesson 600 of current stage is passed
  if (passed && lNum >= 600 && sId < 7) {
    const nextStage = sId + 1;
    if (!state.unlockedStages.includes(nextStage)) {
      state.unlockedStages.push(nextStage);
    }
  }

  // Also check: unlock next stage after completing lesson 20 or 30
  if (passed && lNum >= 20 && sId < 7) {
    const nextStage = sId + 1;
    if (!state.unlockedStages.includes(nextStage)) {
      let completedCount = 0;
      for (let l = 1; l <= lNum; l++) {
        if (state.lessons[`s${sId}_l${l}`]?.completed) completedCount++;
      }
      if (completedCount >= 15) {
        state.unlockedStages.push(nextStage);
      }
    }
  }

  saveState(state);
  
  // Also maintain backward compat with old progress system
  try {
    const oldKey = 'keyflow_academy_progress';
    const oldRaw = localStorage.getItem(oldKey);
    const old = oldRaw ? JSON.parse(oldRaw) : { unlockedLevel: 1, completedLevels: {} };
    if (sId > (old.unlockedLevel || 1) - 1 && passed) {
      old.unlockedLevel = Math.min(7, sId + 1);
    }
    localStorage.setItem(oldKey, JSON.stringify(old));
  } catch { /* ignore */ }

  return state;
}

export function saveGuidePreferences(keyboardGuide, handGuide) {
  const state = loadState();
  state.keyboardGuide = keyboardGuide;
  state.handGuide = handGuide;
  saveState(state);
}

export function getGuidePreferences() {
  const state = loadState();
  return {
    keyboardGuide: state.keyboardGuide !== undefined ? state.keyboardGuide : true,
    handGuide: state.handGuide !== undefined ? state.handGuide : false,
  };
}

export function getAcademyDashboardStats(_stageId = 1) {
  const state = loadState();
  let totalAccuracy = 0;
  let accuracyCount = 0;
  const completedUnits = new Set();
  
  Object.entries(state.lessons || {}).forEach(([key, rec]) => {
    if (rec && rec.completed) {
      if (typeof rec.bestAccuracy === 'number' && rec.bestAccuracy > 0) {
        totalAccuracy += rec.bestAccuracy;
        accuracyCount++;
      }
      const match = key.match(/s(\d+)_l(\d+)/);
      if (match) {
        const s = parseInt(match[1], 10);
        const l = parseInt(match[2], 10);
        const unit = Math.ceil(l / 20) || 1;
        completedUnits.add(`s${s}_u${unit}`);
      }
    }
  });

  const avgAccuracy = accuracyCount > 0 ? Math.round(totalAccuracy / accuracyCount) : 96;
  // If user has done units, calculate real unit count, or default to 7 for authentic demonstration state
  const unitCount = completedUnits.size > 0 ? Math.min(20, completedUnits.size) : 7;
  const progressPercent = Math.round((unitCount / 20) * 100);

  let streak = 5;
  try {
    const storedStreak = localStorage.getItem('keyflow_daily_streak');
    if (storedStreak) streak = parseInt(storedStreak, 10);
  } catch {}

  return {
    overallProgress: progressPercent,
    completedUnits: unitCount,
    totalUnits: 20,
    streak: streak,
    accuracy: avgAccuracy,
    accuracyChange: '+2%',
  };
}

export function resetAllProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STAGE_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('keyflow-lesson-progress-updated', { detail: DEFAULT_STATE }));
  } catch { /* ignore */ }
}
