/**
 * KEYFLOW Arcade — Progressive Racing Difficulty & AI Simulation Engine
 * ====================================================================
 * Implements an 8-tier progression system, dynamic AI competitor behavior,
 * passage complexity scaling, vehicle attributes, and adaptive balancing.
 */

export const RACING_TIERS = [
  {
    tier: 1,
    name: 'Rookie',
    label: 'Rookie Division',
    minWpm: 24,
    maxWpm: 34,
    aiBaseWpm: 28,
    aiAccuracy: 0.92,
    trackDistance: 800,
    minPassageLength: 120,
    punctuationDensity: 'minimal',
    rewardCoins: 100,
  },
  {
    tier: 2,
    name: 'Amateur',
    label: 'Amateur Circuit',
    minWpm: 35,
    maxWpm: 46,
    aiBaseWpm: 40,
    aiAccuracy: 0.94,
    trackDistance: 950,
    minPassageLength: 160,
    punctuationDensity: 'standard',
    rewardCoins: 200,
  },
  {
    tier: 3,
    name: 'Semi-Pro',
    label: 'Semi-Pro Series',
    minWpm: 47,
    maxWpm: 58,
    aiBaseWpm: 52,
    aiAccuracy: 0.955,
    trackDistance: 1100,
    minPassageLength: 200,
    punctuationDensity: 'moderate',
    rewardCoins: 350,
  },
  {
    tier: 4,
    name: 'Professional',
    label: 'Pro League',
    minWpm: 59,
    maxWpm: 72,
    aiBaseWpm: 65,
    aiAccuracy: 0.965,
    trackDistance: 1250,
    minPassageLength: 240,
    punctuationDensity: 'advanced',
    rewardCoins: 500,
  },
  {
    tier: 5,
    name: 'Expert',
    label: 'Expert Championship',
    minWpm: 73,
    maxWpm: 88,
    aiBaseWpm: 80,
    aiAccuracy: 0.975,
    trackDistance: 1400,
    minPassageLength: 280,
    punctuationDensity: 'dense',
    rewardCoins: 750,
  },
  {
    tier: 6,
    name: 'Master',
    label: 'Master Grand Prix',
    minWpm: 89,
    maxWpm: 104,
    aiBaseWpm: 96,
    aiAccuracy: 0.982,
    trackDistance: 1550,
    minPassageLength: 320,
    punctuationDensity: 'complex',
    rewardCoins: 1000,
  },
  {
    tier: 7,
    name: 'Elite',
    label: 'Elite Invitational',
    minWpm: 105,
    maxWpm: 122,
    aiBaseWpm: 112,
    aiAccuracy: 0.988,
    trackDistance: 1700,
    minPassageLength: 360,
    punctuationDensity: 'severe',
    rewardCoins: 1500,
  },
  {
    tier: 8,
    name: 'Legendary',
    label: 'Apex Apex Legends',
    minWpm: 123,
    maxWpm: 145,
    aiBaseWpm: 130,
    aiAccuracy: 0.994,
    trackDistance: 1850,
    minPassageLength: 400,
    punctuationDensity: 'extreme',
    rewardCoins: 2500,
  },
];

/**
 * 5 Selectable High-Performance Supercars
 */
export const RACING_VEHICLES = [
  {
    id: 'apex-gt',
    name: 'Apex GT',
    class: 'Super GT',
    color: '#EF4444',
    secondaryColor: '#1F2937',
    glowColor: 'rgba(239, 68, 68, 0.45)',
    description: 'Balanced track monster with aggressive downforce and explosive low-end torque.',
    acceleration: 88,
    topSpeed: 86,
    nitroBoost: 85,
    handling: 90,
    unlockTier: 1,
  },
  {
    id: 'cyber-phantom',
    name: 'Cyber Phantom',
    class: 'Hypercar',
    color: '#06B6D4',
    secondaryColor: '#0F172A',
    glowColor: 'rgba(6, 182, 212, 0.45)',
    description: 'Electric prototype engineered for relentless top-end velocity and aerodynamic slicing.',
    acceleration: 82,
    topSpeed: 95,
    nitroBoost: 88,
    handling: 85,
    unlockTier: 1,
  },
  {
    id: 'viper-venom',
    name: 'Viper Venom',
    class: 'Motorsport Spec',
    color: '#EAB308',
    secondaryColor: '#18181B',
    glowColor: 'rgba(234, 179, 8, 0.45)',
    description: 'Raw high-revving naturally aspirated V10 delivering lightning off-the-line launch cadence.',
    acceleration: 96,
    topSpeed: 82,
    nitroBoost: 84,
    handling: 88,
    unlockTier: 1,
  },
  {
    id: 'shadow-specter',
    name: 'Shadow Specter',
    class: 'Obsidian Stealth',
    color: '#94A3B8',
    secondaryColor: '#090D16',
    glowColor: 'rgba(148, 163, 184, 0.45)',
    description: 'Matte carbon monocoque with enhanced nitro reserves and extended burn duration.',
    acceleration: 84,
    topSpeed: 89,
    nitroBoost: 96,
    handling: 87,
    unlockTier: 2,
  },
  {
    id: 'solar-flare',
    name: 'Solar Flare',
    class: 'Endurance Pro',
    color: '#F97316',
    secondaryColor: '#431407',
    glowColor: 'rgba(249, 115, 22, 0.45)',
    description: 'Twin-turbo hybrid racer engineered for sustained top-tier cadence and relentless rhythm.',
    acceleration: 92,
    topSpeed: 93,
    nitroBoost: 92,
    handling: 94,
    unlockTier: 3,
  },
];

/**
 * 4 Distinct Thematic Racing Environments
 */
export const RACING_ENVIRONMENTS = [
  {
    id: 'speedway',
    name: 'Grand Prix Speedway',
    theme: 'World Championship Circuit',
    skyGradient: ['#0F172A', '#1E293B', '#334155'],
    roadColor: '#1E232E',
    laneDividerColor: '#E2E8F0',
    curbColors: ['#EF4444', '#FFFFFF'],
    crowdBanners: ['KEYFLOW RACING', 'APEX NITRO', 'CHAMPIONSHIP 2026', 'PRECISION VELOCITY'],
    lighting: 'stadium-floodlights',
    accentColor: '#38BDF8',
  },
  {
    id: 'sunset',
    name: 'Sunset Coastal Highway',
    theme: 'Pacific Ocean Golden Hour',
    skyGradient: ['#4C1D95', '#BE185D', '#FB923C'],
    roadColor: '#282030',
    laneDividerColor: '#FDE047',
    curbColors: ['#F97316', '#FFFFFF'],
    crowdBanners: ['COASTAL SPRINT', 'HORIZON RUN', 'PACIFIC GRAND PRIX'],
    lighting: 'golden-hour-glow',
    accentColor: '#F59E0B',
  },
  {
    id: 'neon-city',
    name: 'Neon Cyberpunk Night',
    theme: 'Metropolis Expressway',
    skyGradient: ['#020617', '#0F172A', '#1E1B4B'],
    roadColor: '#090D16',
    laneDividerColor: '#22D3EE',
    curbColors: ['#EC4899', '#3B82F6'],
    crowdBanners: ['CYBER CITY 2099', 'NEON OVERDRIVE', 'GRIDRUNNER ZERO'],
    lighting: 'neon-glow-wet-asphalt',
    accentColor: '#A855F7',
  },
  {
    id: 'alpine',
    name: 'Alpine Mountain Pass',
    theme: 'Highland Ridge Switchbacks',
    skyGradient: ['#082F49', '#0C4A6E', '#164E63'],
    roadColor: '#242D36',
    laneDividerColor: '#F8FAFC',
    curbColors: ['#10B981', '#FFFFFF'],
    crowdBanners: ['ALPINE ASCENT', 'SUMMIT RUSH', 'MOUNTAIN CHALLENGE'],
    lighting: 'crisp-morning-mountain',
    accentColor: '#10B981',
  },
];

/**
 * 3 AI Competitors with distinct behavioral profiles
 */
export const AI_COMPETITORS = [
  {
    id: 'xavier',
    name: 'Xavier',
    carColor: '#A855F7', // Cyber Purple
    accentColor: '#C084FC',
    personality: 'Aggressive Spurt',
    speedVariance: 0.08,
    errorFrequency: 0.035,
    nitroTendency: 0.85,
  },
  {
    id: 'thomas',
    name: 'Thomas',
    carColor: '#38BDF8', // Cyan Blue
    accentColor: '#7DD3FC',
    personality: 'Consistent Rhythm',
    speedVariance: 0.03,
    errorFrequency: 0.02,
    nitroTendency: 0.65,
  },
  {
    id: 'joshua',
    name: 'Joshua',
    carColor: '#FACC15', // Racing Yellow
    accentColor: '#FEF08A',
    personality: 'Late Closer',
    speedVariance: 0.06,
    errorFrequency: 0.03,
    nitroTendency: 0.9,
  },
];

/**
 * Curated racing typing passages indexed by tier
 */
export const RACING_PASSAGES_BY_TIER = {
  1: [
    'The red sports car accelerates quickly down the open track as the lights turn green.',
    'Speed is about smooth rhythm and keeping your eyes fixed forward on the finish line.',
    'Fast fingers make the engine roar as each word propels your car ahead of the pack.',
    'Every clean stroke adds momentum to your run as you shift into top gear with confidence.',
  ],
  2: [
    'Tires grip the asphalt as you enter the wide curve, maintaining an effortless typing cadence.',
    'The crowd cheers from the stadium grandstands while four sleek supercars blast past the pit wall.',
    'Quick reflexes allow you to read ahead, letting each keypress flow without hesitation or friction.',
    'Precision and velocity unite on the speedway, turning focused keystrokes into sheer kinetic power.',
  ],
  3: [
    'Engines scream at nine thousand RPM as you draft behind the leader, waiting for the perfect moment to strike.',
    'Downforce pins the carbon chassis to the track; your hands maintain flawless home-row discipline under pressure.',
    'Twin turbochargers spool into boost as you cross the quarter-mile mark, surging into second position.',
    'Consistency separates the contenders from the champions when every fraction of a second determines the podium.',
  ],
  4: [
    'Sweeping through the coastal hairpin, the telemetry displays eighty-five words per minute with ninety-nine percent accuracy.',
    'Streetlights blur into vibrant streaks of neon as your high-velocity coupe pulls alongside Xavier on the straightaway.',
    'Tactile switches click in rapid succession, generating unbroken bursts of nitro that propel your vehicle past the pack.',
    'Aerodynamic efficiency and neuromuscular memory combine into pure velocity, eliminating all glance latency.',
  ],
  5: [
    'Navigating the technical chicanes requires surgical rhythm: braking smoothly into the apex before applying maximum acceleration.',
    'Carbon-ceramic brakes glow cherry red in the twilight; meanwhile, your cadence remains unflinching at ninety-five WPM.',
    'The digital tachometer sweeps toward redline as nitrous oxide injects into the intake manifold with a deafening roar.',
    'Mastery over complex punctuation and compound words preserves your momentum while competitors struggle with missed strokes.',
  ],
  6: [
    'High-stakes motorsport demands total neurological synchronization; every hyphen, apostrophe, and capital letter must execute flawlessly.',
    'Approaching the final sector at over one hundred words per minute, the aerodynamic slipstream delivers crucial speed advantages.',
    'Telemetry gauges confirm zero input latency as you execute rapid alphanumeric sequences across five precision rows.',
    'Championship glory belongs to those whose fingers dance effortlessly across mechanical switches with uncompromising precision.',
  ],
  7: [
    'Formula-grade telemetry records an astonishing one hundred fifteen WPM; the titanium exhaust bellows as you seize the race lead!',
    'Atmospheric pressure drops across the aerodynamic diffuser, generating three thousand pounds of ground-effect suction.',
    'Synchronizing cognitive parsing with finger kinematics rewires neuromuscular pathways for instantaneous, zero-glance velocity.',
    'The checkered flag waves in the distance as your speed peaks at maximum threshold, leaving the competition far behind.',
  ],
  8: [
    'Legendary velocity achieved: effortlessly sustaining over one hundred thirty words per minute through complex technical prose!',
    'Grandmaster cadence combines surgical precision, relentless rhythm, and peak cognitive stamina into an unstoppable racing triumph.',
    'The hall of champions welcomes a true titan of precision typing, whose mastery rewrites the limits of human velocity.',
  ],
};

/**
 * Calculates difficulty tier based on player performance and history.
 */
export const calculateRacingTier = ({ currentTier = 1, recentWpm = 0, recentPlacement = 4, racesCompleted = 0 }) => {
  let tier = Math.max(1, Math.min(8, Number(currentTier) || 1));

  // Natural progression thresholds
  if (recentWpm >= 120 && racesCompleted >= 12) return 8;
  if (recentWpm >= 100 && racesCompleted >= 9) return 7;
  if (recentWpm >= 85 && racesCompleted >= 7) return 6;
  if (recentWpm >= 70 && racesCompleted >= 5) return 5;
  if (recentWpm >= 55 && racesCompleted >= 3) return 4;
  if (recentWpm >= 42 && racesCompleted >= 2) return 3;
  if (recentWpm >= 30 && racesCompleted >= 1) return 2;

  // Promoted on 1st place finishes
  if (recentPlacement === 1 && recentWpm > RACING_TIERS[tier - 1].minWpm + 5) {
    tier = Math.min(8, tier + 1);
  }

  return tier;
};

/**
 * Retrieves racing passage for a given tier.
 */
export const getRacingPassage = (tier = 1) => {
  const safeTier = Math.max(1, Math.min(8, Number(tier) || 1));
  const pool = RACING_PASSAGES_BY_TIER[safeTier] || RACING_PASSAGES_BY_TIER[1];
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
};

/**
 * Computes live AI competitor speeds and progress using realistic delta-time kinematics.
 */
export const computeAiProgress = ({
  aiRacer,
  tierConfig,
  playerWpm,
  elapsedSeconds,
  currentProgress,
  targetDistance,
}) => {
  // Base target WPM from tier with AI personality variance
  let targetWpm = tierConfig.aiBaseWpm * (1 + (Math.sin(elapsedSeconds * 0.8 + aiRacer.name.length) * aiRacer.speedVariance));

  // Adaptive rubber-banding: keep race competitive within fair bounds
  const playerEstimatedDist = (playerWpm / 60) * 18 * elapsedSeconds;
  const currentDist = (currentProgress / 100) * targetDistance;
  const deltaDist = currentDist - playerEstimatedDist;

  // If AI is too far ahead (>80m), gently soften pace; if too far behind (<-90m), slightly boost pace
  if (deltaDist > 80) {
    targetWpm *= 0.92;
  } else if (deltaDist < -90) {
    targetWpm *= 1.08;
  }

  // WPM to meters per second conversion: 1 WPM ≈ 5 chars/min ≈ 0.35 m/s on scale
  const metersPerSecond = (targetWpm / 60) * 16.5;
  return metersPerSecond;
};
