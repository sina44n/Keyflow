/**
 * KEYFLOW Arcade — Persistence & Personal Bests Storage
 * ====================================================
 * Secure, error-safe localStorage management for high scores, peak WPM,
 * and game statistics across all 7 arcade games.
 */

import { gamesAPI } from './api.js';

function getInitialArcadeUserId() {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('keyflow_current_user_id') || null;
    }
  } catch {
    return null;
  }
  return null;
}

let currentArcadeUserId = getInitialArcadeUserId();

export const setArcadeStorageUser = (userId) => {
  currentArcadeUserId = userId ? String(userId) : null;
  if (typeof window !== 'undefined' && window.dispatchEvent) {
    window.dispatchEvent(
      new CustomEvent('keyflow-arcade-record-updated', { detail: getArcadeRecords() })
    );
  }
};

export const resetGuestArcadeRecords = () => {
  if (typeof window === 'undefined') return DEFAULT_RECORDS;
  try {
    localStorage.removeItem('keyflow_arcade_records_guest');
    return DEFAULT_RECORDS;
  } catch {
    return DEFAULT_RECORDS;
  }
};

const getArcadeStorageKey = () => {
  return currentArcadeUserId
    ? `keyflow_arcade_records_u_${currentArcadeUserId}`
    : 'keyflow_arcade_records_guest';
};

const DEFAULT_RECORDS = {
  cascade: { bestScore: 0, bestCombo: 0, wordsDefeated: 0, highestTier: 1, gamesPlayed: 0 },
  sprint: { bestWpm: 0, bestAccuracy: 0, wordsTyped: 0, highestTier: 1, gamesPlayed: 0 },
  hunter: { bestScore: 0, bestStreak: 0, targetsEliminated: 0, highestTier: 1, gamesPlayed: 0 },
  ninja: { bestScore: 0, bestSlices: 0, maxCombo: 0, highestTier: 1, gamesPlayed: 0 },
  runner: { maxDistance: 0, bestScore: 0, obstaclesCleared: 0, highestTier: 1, gamesPlayed: 0 },
  memory: { deepestRound: 0, bestScore: 0, perfectRecalls: 0, highestTier: 1, gamesPlayed: 0 },
  boss: { bossDefeated: false, bestScore: 0, highestWave: 1, highestTier: 1, soldiersDefeated: 0, fastestDefeatSeconds: null, gamesPlayed: 0 },
  nitro: { bestWpm: 0, bestAccuracy: 0, racesWon: 0, highestTier: 1, topPlacement: 4, totalDistance: 0, gamesPlayed: 0 },
  warrior: { highScore: 0, waveReached: 1, highestTier: 1, gamesPlayed: 0, enemiesDefeated: 0 },
};

export const getArcadeRecords = () => {
  if (typeof window === 'undefined') return DEFAULT_RECORDS;
  try {
    const raw = localStorage.getItem(getArcadeStorageKey());
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
      highestTier: Math.max(gamePrev.highestTier || 1, Number(attemptData.highestTier || 1)),
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
        const wave = Number(attemptData.highestWave || attemptData.wave || 1);
        const soldiers = Number(attemptData.soldiersDefeated || 0);
        const defeated = Boolean(attemptData.bossDefeated);
        if (wave > (gamePrev.highestWave || 1)) {
          updated.highestWave = wave;
          isNewBest = true;
        }
        if (defeated && !gamePrev.bossDefeated) {
          isNewBest = true;
          updated.bossDefeated = true;
        }
        if (score > (gamePrev.bestScore || 0)) {
          updated.bestScore = score;
          isNewBest = true;
        }
        updated.soldiersDefeated = (gamePrev.soldiersDefeated || 0) + soldiers;
        if (defeated && attemptData.durationSeconds) {
          updated.fastestDefeatSeconds = gamePrev.fastestDefeatSeconds
            ? Math.min(gamePrev.fastestDefeatSeconds, attemptData.durationSeconds)
            : attemptData.durationSeconds;
        }
        break;
      }
      case 'nitro': {
        const wpm = Number(attemptData.wpm || attemptData.score || 0);
        const acc = Number(attemptData.accuracy || 0);
        const dist = Number(attemptData.distance || attemptData.totalDistance || 0);
        const placement = Number(attemptData.placement || 4);
        if (wpm > (gamePrev.bestWpm || 0)) {
          updated.bestWpm = wpm;
          isNewBest = true;
        }
        updated.bestAccuracy = Math.max(gamePrev.bestAccuracy || 0, acc);
        updated.totalDistance = (gamePrev.totalDistance || 0) + dist;
        updated.topPlacement = Math.min(gamePrev.topPlacement || 4, placement);
        if (placement === 1) {
          updated.racesWon = (gamePrev.racesWon || 0) + 1;
        }
        break;
      }
      default:
        break;
    }

    current[gameId] = updated;
    localStorage.setItem(getArcadeStorageKey(), JSON.stringify(current));

    // Asynchronously dispatch to backend if user is authenticated
    if (currentArcadeUserId) {
      try {
        gamesAPI
          .recordSession({
            game_type: gameId,
            score: Number(attemptData.score || attemptData.wpm || attemptData.distance || 0),
            accuracy: Number(attemptData.accuracy || 0),
            duration_seconds: Number(attemptData.durationSeconds || attemptData.duration || 0),
            words_correct: Number(
              attemptData.wordsDefeated ||
                attemptData.wordsTyped ||
                attemptData.targetsEliminated ||
                attemptData.slices ||
                attemptData.obstaclesCleared ||
                attemptData.soldiersDefeated ||
                0
            ),
            words_missed: Number(attemptData.mistakes || 0),
            difficulty: String(attemptData.difficulty || 'normal'),
            metadata: attemptData,
          })
          .catch(() => {});
      } catch {
        // Safe offline catch
      }
    }

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

/**
 * Synchronizes authoritative arcade records returned from the backend into user's local store.
 */
export const syncArcadeRecordsFromBackend = (serverRecords) => {
  if (!serverRecords || typeof serverRecords !== 'object') return;
  try {
    const current = getArcadeRecords();
    const merged = { ...current };

    for (const [gId, sRec] of Object.entries(serverRecords)) {
      if (!sRec || typeof sRec !== 'object') continue;
      const cRec = merged[gId] || DEFAULT_RECORDS[gId] || {};

      merged[gId] = {
        ...cRec,
        ...sRec,
        bestScore: Math.max(cRec.bestScore || 0, sRec.bestScore || 0),
        bestCombo: Math.max(cRec.bestCombo || 0, sRec.bestCombo || 0),
        wordsDefeated: Math.max(cRec.wordsDefeated || 0, sRec.wordsDefeated || 0),
        bestWpm: Math.max(cRec.bestWpm || 0, sRec.bestWpm || 0),
        bestAccuracy: Math.max(cRec.bestAccuracy || 0, sRec.bestAccuracy || 0),
        wordsTyped: Math.max(cRec.wordsTyped || 0, sRec.wordsTyped || 0),
        bestStreak: Math.max(cRec.bestStreak || 0, sRec.bestStreak || 0),
        targetsEliminated: Math.max(cRec.targetsEliminated || 0, sRec.targetsEliminated || 0),
        bestSlices: Math.max(cRec.bestSlices || 0, sRec.bestSlices || 0),
        maxCombo: Math.max(cRec.maxCombo || 0, sRec.maxCombo || 0),
        maxDistance: Math.max(cRec.maxDistance || 0, sRec.maxDistance || 0),
        obstaclesCleared: Math.max(cRec.obstaclesCleared || 0, sRec.obstaclesCleared || 0),
        deepestRound: Math.max(cRec.deepestRound || 0, sRec.deepestRound || 0),
        perfectRecalls: Math.max(cRec.perfectRecalls || 0, sRec.perfectRecalls || 0),
        highestWave: Math.max(cRec.highestWave || 1, sRec.highestWave || 1),
        highestTier: Math.max(cRec.highestTier || 1, sRec.highestTier || 1),
        soldiersDefeated: Math.max(cRec.soldiersDefeated || 0, sRec.soldiersDefeated || 0),
        gamesPlayed: Math.max(cRec.gamesPlayed || 0, sRec.gamesPlayed || 0),
        bossDefeated: Boolean(cRec.bossDefeated || sRec.bossDefeated),
      };
    }

    localStorage.setItem(getArcadeStorageKey(), JSON.stringify(merged));
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(
        new CustomEvent('keyflow-arcade-record-updated', { detail: merged })
      );
    }
  } catch (err) {
    console.warn('KEYFLOW arcade sync notice:', err);
  }
};

/**
 * Safely migrates guest arcade records to the newly authenticated account.
 */
export const migrateGuestArcadeRecordsToAccount = async (userId) => {
  if (!userId || typeof window === 'undefined') return;
  try {
    const rawGuest = localStorage.getItem('keyflow_arcade_records_guest');
    if (!rawGuest) return;
    const guestRecords = JSON.parse(rawGuest);
    if (!guestRecords || typeof guestRecords !== 'object') return;

    for (const [gameId, rec] of Object.entries(guestRecords)) {
      if (!rec || !rec.gamesPlayed) continue;
      try {
        await gamesAPI.recordSession({
          game_type: gameId,
          score: Number(rec.bestScore || rec.bestWpm || rec.maxDistance || 0),
          accuracy: Number(rec.bestAccuracy || 0),
          words_correct: Number(
            rec.wordsDefeated ||
              rec.wordsTyped ||
              rec.targetsEliminated ||
              rec.bestSlices ||
              rec.obstaclesCleared ||
              rec.soldiersDefeated ||
              0
          ),
          metadata: rec,
        });
      } catch {}
    }
  } catch (err) {
    console.warn('KEYFLOW guest arcade migration notice:', err);
  }
};

export const resetArcadeRecords = () => {
  if (typeof window === 'undefined') return DEFAULT_RECORDS;
  try {
    localStorage.removeItem(getArcadeStorageKey());
    window.dispatchEvent(new CustomEvent('keyflow-arcade-record-updated', { detail: DEFAULT_RECORDS }));
    return DEFAULT_RECORDS;
  } catch {
    return DEFAULT_RECORDS;
  }
};
