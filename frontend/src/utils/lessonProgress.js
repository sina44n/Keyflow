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
  if (accuracy < targetAccuracy || wpm < targetWpm) return 0;
  if (accuracy >= 98 && wpm >= targetWpm * 1.15) return 3;
  if (accuracy >= 95) return 2;
  return 1;
}

export function recordLessonResult(stageId, lessonNum, { wpm, accuracy, mistakes, duration, passed, stars }) {
  const state = loadState();
  const key = `s${stageId}_l${lessonNum}`;
  const existing = state.lessons[key];

  state.lessons[key] = {
    completed: passed || (existing?.completed ?? false),
    bestWpm: existing ? Math.max(existing.bestWpm || 0, wpm) : wpm,
    bestAccuracy: existing ? Math.max(existing.bestAccuracy || 0, accuracy) : accuracy,
    stars: existing ? Math.max(existing.stars || 0, stars) : stars,
    attempts: (existing?.attempts || 0) + 1,
    lastMistakes: mistakes,
    lastDuration: duration,
    completedAt: passed ? new Date().toISOString() : (existing?.completedAt ?? null),
  };

  // Update stage progress tracker
  if (!state.stageProgress) state.stageProgress = {};
  const currentMax = state.stageProgress[stageId] || 0;
  if (lessonNum > currentMax) state.stageProgress[stageId] = lessonNum;

  // Unlock next stage if lesson 600 of current stage is passed
  if (passed && lessonNum >= 600 && stageId < 7) {
    const nextStage = stageId + 1;
    if (!state.unlockedStages.includes(nextStage)) {
      state.unlockedStages.push(nextStage);
    }
  }

  // Also check: if 10 lessons done in a stage, could unlock next... (for usability)
  // Actually: unlock next stage after completing lesson 30 (first unit assessment)
  if (passed && lessonNum >= 30 && stageId < 7) {
    const nextStage = stageId + 1;
    if (!state.unlockedStages.includes(nextStage)) {
      // Check if user completed enough lessons (30+)
      let completedCount = 0;
      for (let l = 1; l <= lessonNum; l++) {
        if (state.lessons[`s${stageId}_l${l}`]?.completed) completedCount++;
      }
      if (completedCount >= 30) {
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
    if (stageId > (old.unlockedLevel || 1) - 1 && passed) {
      old.unlockedLevel = Math.min(7, stageId + 1);
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

export function resetAllProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STAGE_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('keyflow-lesson-progress-updated', { detail: DEFAULT_STATE }));
  } catch { /* ignore */ }
}
