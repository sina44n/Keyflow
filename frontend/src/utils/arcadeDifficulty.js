/**
 * KEYFLOW Arcade — Progressive Difficulty Engine
 * ===============================================
 * Deterministic, smooth, and adaptive difficulty scaling shared across
 * all seven authentic typing arcade games.
 *
 * Tiers:
 * 1: Warm-up (Casual pace, short words, generous timers)
 * 2: Beginner (Slightly faster, common vocabulary)
 * 3: Intermediate (Varied word length, moderate density, special targets)
 * 4: Advanced (Fast tempo, complex words, heightened urgency)
 * 5: Expert (Relentless cadence, multi-stage targets, elite hazards)
 * 6+: Master (Bounded caps, high skill ceiling without mathematical impossibility)
 */

export const DIFFICULTY_TIERS = [
  { tier: 1, name: 'Warm-up', color: '#10B981', minScore: 0, requiredSeconds: 0 },
  { tier: 2, name: 'Beginner', color: '#38BDF8', minScore: 400, requiredSeconds: 25 },
  { tier: 3, name: 'Intermediate', color: '#FBBF24', minScore: 1200, requiredSeconds: 60 },
  { tier: 4, name: 'Advanced', color: '#F97316', minScore: 2400, requiredSeconds: 110 },
  { tier: 5, name: 'Expert', color: '#EF4444', minScore: 4000, requiredSeconds: 180 },
  { tier: 6, name: 'Master', color: '#A855F7', minScore: 6500, requiredSeconds: 260 },
];

/**
 * Calculates current difficulty tier based on active gameplay metrics.
 * Incorporates an adaptive recovery factor if player is struggling with errors.
 */
export function calculateDifficultyTier({
  activeSeconds = 0,
  completedCount = 0,
  score = 0,
  wave = 1,
  currentStreak = 0,
  errorCount = 0,
  _mode = 'standard',
}) {
  const safeSeconds = Math.max(0, activeSeconds);
  const safeScore = Math.max(0, score);
  const safeCompleted = Math.max(0, completedCount);
  const safeWave = Math.max(1, wave);

  // Performance quotient (0.8 to 1.3) based on streak vs errors
  let performanceQuotient = 1.0;
  if (currentStreak > 15) {
    performanceQuotient = 1.25;
  } else if (currentStreak > 8) {
    performanceQuotient = 1.15;
  } else if (errorCount > 8 && currentStreak < 3) {
    // Player struggling: grant adaptive grace window to slow escalation
    performanceQuotient = 0.85;
  }

  // Composite progress metric combining score, wave, and active elapsed time
  let rawTier = 1;
  if (safeWave > 1) {
    // Wave-based games (Boss Battle, Key Cascade) scale directly with wave
    rawTier = Math.min(6, Math.floor(safeWave * 0.95 * performanceQuotient) + 1);
  } else {
    // Time/Score-based games (Speed Sprint, Word Hunter, Ninja, Runner, Memory)
    const timeTier = Math.floor((safeSeconds / 45) * performanceQuotient) + 1;
    const scoreTier = Math.floor((safeScore / 1000) * performanceQuotient) + 1;
    const countTier = Math.floor((safeCompleted / 12) * performanceQuotient) + 1;
    rawTier = Math.max(timeTier, Math.min(scoreTier, countTier));
  }

  // Bound tier safely between 1 and 6 (Master)
  const tier = Math.max(1, Math.min(6, Math.floor(rawTier)));
  const tierMeta = DIFFICULTY_TIERS.find((t) => t.tier === tier) || DIFFICULTY_TIERS[DIFFICULTY_TIERS.length - 1];

  return {
    tier,
    tierName: tierMeta.name,
    tierColor: tierMeta.color,
    isMaxTier: tier >= 6,
    performanceQuotient,
  };
}

/**
 * Game 1: Key Cascade Dynamic Config
 */
export function getKeyCascadeConfig(tier = 1, performance = 1.0) {
  const clampedTier = Math.max(1, Math.min(6, tier));
  return {
    // Spawn interval in seconds: 2.8s at Tier 1 down to 1.1s at Tier 6
    spawnInterval: Math.max(1.1, parseFloat((3.0 - clampedTier * 0.32 * performance).toFixed(2))),
    // Falling speed px/s: 32 at Tier 1 up to 88 at Tier 6
    fallSpeed: Math.min(92, Math.round(30 + clampedTier * 9.5 * performance)),
    // Word pool tailored to tier
    pool: clampedTier >= 4 ? 'long' : clampedTier >= 2 ? 'medium' : 'short',
    // Max simultaneous words allowed on arena
    maxWords: Math.min(7, 3 + Math.floor(clampedTier * 0.7)),
    dangerLineY: 380,
  };
}

/**
 * Game 2: Speed Sprint Dynamic Config
 */
export function getSpeedSprintConfig(tier = 1) {
  const clampedTier = Math.max(1, Math.min(6, tier));
  return {
    wordPool: clampedTier >= 5 ? 'long' : clampedTier >= 3 ? 'medium' : 'short',
    bonusTimePerWord: clampedTier >= 4 ? 0.4 : 0.5,
    streakMultiplier: 1 + Math.min(2.5, (clampedTier - 1) * 0.35),
    tierLabel: DIFFICULTY_TIERS[clampedTier - 1]?.name || 'Standard',
  };
}

/**
 * Game 3: Word Hunter Dynamic Config
 */
export function getWordHunterConfig(tier = 1, performance = 1.0) {
  const clampedTier = Math.max(1, Math.min(6, tier));
  return {
    // Active targets count on radar: 4 up to 8
    targetCount: Math.min(8, 3 + clampedTier),
    // Target lifetime countdown in seconds: 5.0s down to 2.4s
    targetLifetime: Math.max(2.4, parseFloat((5.4 - clampedTier * 0.5 * performance).toFixed(2))),
    pool: clampedTier >= 4 ? 'medium' : 'short',
    radarDecayRate: 0.1,
  };
}

/**
 * Game 4: Key Ninja Dynamic Config
 */
export function getKeyNinjaConfig(tier = 1, performance = 1.0) {
  const clampedTier = Math.max(1, Math.min(6, tier));
  return {
    // Spawn interval: 2.2s at Tier 1 down to 0.9s at Tier 6
    spawnInterval: Math.max(0.9, parseFloat((2.4 - clampedTier * 0.26 * performance).toFixed(2))),
    // Vertical toss launch speed: 320 to 440 px/s
    launchVelocityY: -Math.min(450, 320 + clampedTier * 22),
    // Horizontal toss drift: 40 to 140 px/s
    launchVelocityX: 40 + clampedTier * 16,
    pool: clampedTier >= 4 ? 'medium' : 'short',
    maxAirborne: Math.min(6, 2 + Math.floor(clampedTier * 0.75)),
  };
}

/**
 * Game 5: Word Runner Dynamic Config
 */
export function getWordRunnerConfig(tier = 1, distance = 0) {
  const clampedTier = Math.max(1, Math.min(6, tier));
  const distBonus = Math.min(10, Math.floor(distance / 200));
  return {
    // Obstacle spacing: 45m down to 28m
    obstacleSpacing: Math.max(28, 46 - clampedTier * 3),
    // Runner velocity m/s: 11 m/s up to 26 m/s
    runnerSpeed: Math.min(26, 11 + clampedTier * 2.2 + distBonus),
    pool: clampedTier >= 4 || distance > 600 ? 'medium' : 'short',
  };
}

/**
 * Game 6: Typing Memory Dynamic Config
 */
export function getTypingMemoryConfig(tier = 1, round = 1) {
  const clampedTier = Math.max(1, Math.min(6, tier));
  // Sequence length scales with round and tier: 3 up to 8 words
  const sequenceLength = Math.min(8, 2 + round);
  // View presentation time in seconds: generous 4.0s for short, up to 6.5s for 8 words
  const viewTime = Math.max(2.6, parseFloat((2.2 + sequenceLength * 0.55 - clampedTier * 0.15).toFixed(1)));

  return {
    sequenceLength,
    viewTime,
    pool: round >= 4 ? 'medium' : 'short',
  };
}

/**
 * Game 7: Boss Battle (Soldier Combat) Dynamic Config
 */
export function getBossBattleConfig(tier = 1, wave = 1) {
  const clampedTier = Math.max(1, Math.min(6, tier));
  const isBossWave = wave % 3 === 0;

  // Enemy classes distribution based on wave & tier
  // Weights: [infantry, assault, armored, elite]
  let classWeights;
  if (wave === 1) {
    classWeights = { infantry: 1.0, assault: 0.0, armored: 0.0, elite: 0.0 };
  } else if (wave === 2) {
    classWeights = { infantry: 0.65, assault: 0.35, armored: 0.0, elite: 0.0 };
  } else if (isBossWave) {
    classWeights = { infantry: 0.4, assault: 0.35, armored: 0.15, elite: 0.1 };
  } else if (wave >= 4) {
    classWeights = { infantry: 0.3, assault: 0.35, armored: 0.25, elite: 0.1 };
  } else {
    classWeights = { infantry: 0.45, assault: 0.3, armored: 0.15, elite: 0.1 };
  }

  // Wave quota: number of regular enemies before wave clear or boss
  const soldierQuota = isBossWave ? 4 : 4 + Math.min(8, wave * 2);

  // Soldier march speed down the battlefield (px/s): 18 px/s at Tier 1 to 46 px/s at Tier 6
  const marchSpeed = Math.min(48, Math.round(18 + clampedTier * 5.2));

  // Soldier spawn interval in seconds: 3.2s down to 1.3s
  const spawnInterval = Math.max(1.3, parseFloat((3.4 - clampedTier * 0.35).toFixed(2)));

  // Boss attack charge deadline (seconds player has to counterstrike): 6.0s down to 3.8s
  const bossAttackTimer = Math.max(3.8, parseFloat((6.2 - clampedTier * 0.45).toFixed(2)));

  // Boss max HP scales with encounter number: 600 HP on Wave 3, 1000 HP on Wave 6, 1400 HP on Wave 9
  const bossHp = 400 + Math.floor(wave / 3) * 300;

  return {
    tier: clampedTier,
    isBossWave,
    soldierQuota,
    marchSpeed,
    spawnInterval,
    classWeights,
    bossAttackTimer,
    bossHp,
    defenseLineY: 340,
  };
}
