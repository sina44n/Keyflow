/**
 * KEYFLOW Academy Progress & Persistence Manager
 * ==============================================
 * Manages unlock states, best records (WPM, Accuracy, Stars), and persistence.
 * Dispatches 'keyflow-progress-updated' window events on change.
 */

const STORAGE_KEY = 'keyflow_academy_progress';

const DEFAULT_PROGRESS = {
  unlockedLevel: 1,
  completedLevels: {},
};

/**
 * Retrieves the current user progress from localStorage with error safety.
 */
export const getAcademyProgress = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw);
    return {
      unlockedLevel: typeof parsed.unlockedLevel === 'number' ? parsed.unlockedLevel : 1,
      completedLevels: parsed.completedLevels || {},
    };
  } catch (err) {
    console.warn('Failed to read KEYFLOW academy progress from localStorage:', err);
    return DEFAULT_PROGRESS;
  }
};

/**
 * Checks if a given level number (1-7) is currently unlocked.
 */
export const isLevelUnlocked = (levelNumber) => {
  if (levelNumber === 1) return true;
  const progress = getAcademyProgress();
  return levelNumber <= progress.unlockedLevel;
};

/**
 * Gets saved performance stats for a specific level.
 */
export const getLevelStats = (levelNumber) => {
  const progress = getAcademyProgress();
  return progress.completedLevels[String(levelNumber)] || null;
};

/**
 * Calculates earned stars (1 to 5) based on accuracy and speed.
 */
export const calculateStars = (accuracy, targetAccuracy, wpm, targetWpm) => {
  if (accuracy < targetAccuracy || wpm < targetWpm) {
    return 0; // Did not pass threshold
  }
  if ((accuracy >= 99 && wpm >= targetWpm * 1.25) || (accuracy >= 98 && wpm >= targetWpm * 1.3)) {
    return 5;
  }
  if (accuracy >= 97 && wpm >= targetWpm * 1.15) {
    return 4;
  }
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
  return 1;
};

/**
 * Records a completed lesson attempt, updating best scores and unlocking next stage.
 */
export const recordLessonResult = (levelNumber, options = {}) => {
  try {
    const progress = getAcademyProgress();
    const levelKey = String(levelNumber);
    const existing = progress.completedLevels[levelKey];

    const rawData = options && typeof options === 'object' ? options : {};
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

    const isCompleted = passed || (existing?.completed ?? false);
    const updatedBestWpm = existing ? Math.max(existing.bestWpm || 0, wpm) : wpm;
    const updatedBestAccuracy = existing ? Math.max(existing.bestAccuracy || 0, accuracy) : accuracy;
    const updatedStars = existing ? Math.max(existing.stars || 0, stars) : stars;

    progress.completedLevels[levelKey] = {
      completed: isCompleted,
      bestWpm: updatedBestWpm,
      bestAccuracy: updatedBestAccuracy,
      stars: updatedStars,
      lastMistakes: mistakes,
      lastDuration: duration,
      completedAt: passed
        ? (rawData.completedAt || new Date().toISOString())
        : (existing?.completedAt ?? null),
    };

    // Unlock subsequent level if passed and currently at highest unlocked
    if (passed && levelNumber >= progress.unlockedLevel && levelNumber < 7) {
      progress.unlockedLevel = levelNumber + 1;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));

    // Dispatch event for instant UI reactivity across components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('keyflow-progress-updated', { detail: progress }));
    }

    return progress;
  } catch (err) {
    console.error('Failed to save KEYFLOW lesson progress:', err);
    return DEFAULT_PROGRESS;
  }
};

/**
 * Resets progress back to Level 1 (primarily for development/testing).
 */
export const resetAcademyProgress = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('keyflow-progress-updated', { detail: DEFAULT_PROGRESS }));
    }
    return DEFAULT_PROGRESS;
  } catch (err) {
    console.error('Failed to reset academy progress:', err);
    return DEFAULT_PROGRESS;
  }
};
