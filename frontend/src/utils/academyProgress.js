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
 * Calculates earned stars (1 to 3) based on accuracy and speed.
 */
export const calculateStars = (accuracy, targetAccuracy, wpm, targetWpm) => {
  if (accuracy < targetAccuracy || wpm < targetWpm) {
    return 0; // Did not pass threshold
  }
  if (accuracy >= 98 && wpm >= targetWpm * 1.1) {
    return 3;
  }
  if (accuracy >= 95) {
    return 2;
  }
  return 1;
};

/**
 * Records a completed lesson attempt, updating best scores and unlocking next stage.
 */
export const recordLessonResult = (levelNumber, { wpm, accuracy, mistakes, duration, passed, stars }) => {
  try {
    const progress = getAcademyProgress();
    const levelKey = String(levelNumber);
    const existing = progress.completedLevels[levelKey];

    const updatedBestWpm = existing ? Math.max(existing.bestWpm || 0, wpm) : wpm;
    const updatedBestAccuracy = existing ? Math.max(existing.bestAccuracy || 0, accuracy) : accuracy;
    const updatedStars = existing ? Math.max(existing.stars || 0, stars) : stars;

    progress.completedLevels[levelKey] = {
      completed: true,
      bestWpm: updatedBestWpm,
      bestAccuracy: updatedBestAccuracy,
      stars: updatedStars,
      lastMistakes: mistakes,
      lastDuration: duration,
      completedAt: new Date().toISOString(),
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
