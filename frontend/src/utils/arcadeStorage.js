/**
 * KEYFLOW Arcade — Persistence & Personal Bests Storage
 * ====================================================
 * Secure, error-safe localStorage management for high scores, peak WPM,
 * and game statistics across all 7 arcade games.
 */

const STORAGE_KEY = 'keyflow_arcade_records_v1';

const DEFAULT_RECORDS = {
  cascade: { bestScore: 0, bestCombo: 0, wordsDefeated: 0, gamesPlayed: 0 },
  sprint: { bestWpm: 0, bestAccuracy: 0, wordsTyped: 0, gamesPlayed: 0 },
  hunter: { bestScore: 0, bestStreak: 0, targetsEliminated: 0, gamesPlayed: 0 },
  ninja: { bestScore: 0, bestSlices: 0, maxCombo: 0, gamesPlayed: 0 },
  runner: { maxDistance: 0, bestScore: 0, obstaclesCleared: 0, gamesPlayed: 0 },
  memory: { deepestRound: 0, bestScore: 0, perfectRecalls: 0, gamesPlayed: 0 },
  boss: { bossDefeated: false, bestScore: 0, fastestDefeatSeconds: null, gamesPlayed: 0 },
};

export const getArcadeRecords = () => {
  if (typeof window === 'undefined') return DEFAULT_RECORDS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_RECORDS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_RECORDS, ...parsed };
  } catch (err) {
    console.warn('Failed to parse KEYFLOW arcade records:', err);
    return DEFAULT_RECORDS;
  }
};

export const getGameRecord = (gameId) => {
  const records = getArcadeRecords();
  return records[gameId] || DEFAULT_RECORDS[gameId] || null;
};

/**
 * Saves a completed game record and flags if a new personal best was established.
 */
export const saveArcadeRecord = (gameId, attemptData = {}) => {
  if (typeof window === 'undefined') return { isNewBest: false, records: DEFAULT_RECORDS };
  try {
    const current = getArcadeRecords();
    const gamePrev = current[gameId] || DEFAULT_RECORDS[gameId] || {};
    let isNewBest = false;

    const updated = {
      ...gamePrev,
      gamesPlayed: (gamePrev.gamesPlayed || 0) + 1,
      lastPlayedAt: new Date().toISOString(),
    };

    switch (gameId) {
      case 'cascade': {
        const score = Number(attemptData.score || 0);
        const combo = Number(attemptData.bestCombo || 0);
        if (score > (gamePrev.bestScore || 0)) {
          updated.bestScore = score;
          isNewBest = true;
        }
        updated.bestCombo = Math.max(gamePrev.bestCombo || 0, combo);
        updated.wordsDefeated = (gamePrev.wordsDefeated || 0) + Number(attemptData.wordsDefeated || 0);
        break;
      }
      case 'sprint': {
        const wpm = Number(attemptData.wpm || 0);
        const acc = Number(attemptData.accuracy || 0);
        if (wpm > (gamePrev.bestWpm || 0)) {
          updated.bestWpm = wpm;
          isNewBest = true;
        }
        updated.bestAccuracy = Math.max(gamePrev.bestAccuracy || 0, acc);
        updated.wordsTyped = (gamePrev.wordsTyped || 0) + Number(attemptData.wordsTyped || 0);
        break;
      }
      case 'hunter': {
        const score = Number(attemptData.score || 0);
        const streak = Number(attemptData.bestStreak || 0);
        if (score > (gamePrev.bestScore || 0)) {
          updated.bestScore = score;
          isNewBest = true;
        }
        updated.bestStreak = Math.max(gamePrev.bestStreak || 0, streak);
        updated.targetsEliminated = (gamePrev.targetsEliminated || 0) + Number(attemptData.targetsEliminated || 0);
        break;
      }
      case 'ninja': {
        const score = Number(attemptData.score || 0);
        const slices = Number(attemptData.slices || 0);
        if (score > (gamePrev.bestScore || 0)) {
          updated.bestScore = score;
          isNewBest = true;
        }
        updated.bestSlices = Math.max(gamePrev.bestSlices || 0, slices);
        updated.maxCombo = Math.max(gamePrev.maxCombo || 0, Number(attemptData.maxCombo || 0));
        break;
      }
      case 'runner': {
        const distance = Number(attemptData.distance || 0);
        const score = Number(attemptData.score || 0);
        if (distance > (gamePrev.maxDistance || 0)) {
          updated.maxDistance = distance;
          isNewBest = true;
        }
        updated.bestScore = Math.max(gamePrev.bestScore || 0, score);
        updated.obstaclesCleared = (gamePrev.obstaclesCleared || 0) + Number(attemptData.obstaclesCleared || 0);
        break;
      }
      case 'memory': {
        const round = Number(attemptData.deepestRound || 0);
        const score = Number(attemptData.score || 0);
        if (round > (gamePrev.deepestRound || 0)) {
          updated.deepestRound = round;
          isNewBest = true;
        }
        updated.bestScore = Math.max(gamePrev.bestScore || 0, score);
        if (attemptData.perfect) {
          updated.perfectRecalls = (gamePrev.perfectRecalls || 0) + 1;
        }
        break;
      }
      case 'boss': {
        const score = Number(attemptData.score || 0);
        const defeated = Boolean(attemptData.bossDefeated);
        if (defeated && !gamePrev.bossDefeated) {
          isNewBest = true;
          updated.bossDefeated = true;
        }
        if (score > (gamePrev.bestScore || 0)) {
          updated.bestScore = score;
          isNewBest = true;
        }
        if (defeated && attemptData.durationSeconds) {
          updated.fastestDefeatSeconds = gamePrev.fastestDefeatSeconds
            ? Math.min(gamePrev.fastestDefeatSeconds, attemptData.durationSeconds)
            : attemptData.durationSeconds;
        }
        break;
      }
      default:
        break;
    }

    current[gameId] = updated;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));

    window.dispatchEvent(
      new CustomEvent('keyflow-arcade-record-updated', {
        detail: { gameId, record: updated, isNewBest },
      })
    );

    return { isNewBest, record: updated };
  } catch (err) {
    console.error('Failed to save arcade record:', err);
    return { isNewBest: false, record: DEFAULT_RECORDS[gameId] };
  }
};

export const resetArcadeRecords = () => {
  if (typeof window === 'undefined') return DEFAULT_RECORDS;
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('keyflow-arcade-record-updated', { detail: DEFAULT_RECORDS }));
    return DEFAULT_RECORDS;
  } catch {
    return DEFAULT_RECORDS;
  }
};
