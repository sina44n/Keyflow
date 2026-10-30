/**
 * KEYFLOW Arcade — Masterpiece 7-Game Dataset & Configurations
 * ============================================================
 * Defines configuration, metadata, difficulty tiers, and dictionary pools
 * for all seven authentic typing arcade games.
 */
import { Flame, Zap, Target, Swords, Footprints, Brain, ShieldAlert, Gauge } from 'lucide-react';
import { ARCADE_VOCABULARY } from '../utils/arcadeVocabulary.js';

export const ARCADE_GAMES = [
  {
    id: 'cascade',
    title: 'Key Cascade',
    subtitle: 'Falling words defensive arena',
    category: 'defense',
    categoryLabel: 'Typing Defense',
    badge: 'Reaction Drill',
    icon: Flame,
    color: '#F06B72',
    image: '/arcade/key_cascade.jpg',
    description:
      'Words stream down vertical chutes toward your baseline shield. Eliminate descending terms before they breach your firewall. Chain consecutive words for combo multipliers.',
    difficulty: 'Dynamic (Easy → Insane)',
    defaultMetricLabel: 'Best Score',
    defaultMetricUnit: 'pts',
    instructions: [
      'Words spawn at the top and fall steadily toward the danger line.',
      'Type the highlighted active word exactly to trigger an elimination laser.',
      'Breaching the danger line costs 1 shield. You have 3 shields total.',
      'Sustain unbroken chains to build up to a 4x combo score multiplier.',
    ],
    features: ['Cascading word physics', 'Multi-word combo multiplier', 'Special power-up tokens', 'Speed acceleration'],
  },
  {
    id: 'sprint',
    title: 'Speed Sprint',
    subtitle: 'High-octane velocity rush',
    category: 'speed',
    categoryLabel: 'Timed Challenge',
    badge: 'Velocity Drill',
    icon: Zap,
    color: '#C8F36A',
    image: '/arcade/speed_sprint.jpg',
    description:
      'High-octane sprint with selectable 30s, 60s, or 120s countdown. Maintain raw rhythm, accuracy, and burst cadence under relentless time pressure.',
    difficulty: 'Custom (30s / 60s / 120s)',
    defaultMetricLabel: 'Top Velocity',
    defaultMetricUnit: 'WPM',
    instructions: [
      'Select a time preset (30s, 60s, or 120s) and hit start.',
      'Type the highlighted stream of words as fast and accurately as possible.',
      'Each accurately typed word adds +0.5s bonus time to extend your sprint.',
      'Errors must be corrected or cleared to advance to subsequent words.',
    ],
    features: ['Real-time WPM calculation', 'Bonus time-extension (+0.5s)', 'Instant error recovery', 'Velocity spikes'],
  },
  {
    id: 'hunter',
    title: 'Word Hunter',
    subtitle: 'Target elimination precision training',
    category: 'precision',
    categoryLabel: 'Precision Targeting',
    badge: 'Precision Drill',
    icon: Target,
    color: '#38BDF8',
    image: '/arcade/word_hunter.jpg',
    description:
      'Tactical radar grid with floating target terms. Scan the sector, acquire the highlighted priority target, and eliminate it with 100% precision.',
    difficulty: 'Intermediate → Hard',
    defaultMetricLabel: 'Best Streak',
    defaultMetricUnit: 'targets',
    instructions: [
      'Multiple words float on the tactical radar sweep.',
      'The current priority target is locked with an active crosshair.',
      'Type the targeted word before the target timer expires.',
      'Missed keystrokes deplete radar stability. Accurate hits build streak multipliers.',
    ],
    features: ['Peripheral vision scanning', 'Lock-on crosshair', 'Radar stability gauge', 'Streak multipliers'],
  },
  {
    id: 'ninja',
    title: 'Key Ninja',
    subtitle: 'Airborne katana reflex slashing',
    category: 'reaction',
    categoryLabel: 'Reaction & Reflex',
    badge: 'Reflex Drill',
    icon: Swords,
    color: '#E11D48',
    image: '/arcade/key_ninja.jpg',
    description:
      'Fast-paced cyber slash arena. Type flying keycaps and words mid-air before their visual timer expires. Build blade combos and defend your 3 lives.',
    difficulty: 'Medium → Expert',
    defaultMetricLabel: 'Max Slices',
    defaultMetricUnit: 'slashes',
    instructions: [
      'Keycaps and words are tossed across the screen in parabolic arcs.',
      'Type the characters on any airborne target to slice it in half with your cyber katana.',
      'If a target falls off-screen without being sliced, you lose 1 life (3 lives total).',
      'Slice rapid targets consecutively to activate Blade Fury combo scoring.',
    ],
    features: ['Arcade slicing mechanics', 'Parabolic projectile physics', 'Blade Fury combos', 'Sparks & slash effects'],
  },
  {
    id: 'runner',
    title: 'Word Runner',
    subtitle: 'Side-scrolling cyber parkour',
    category: 'adventure',
    categoryLabel: 'Typing Adventure',
    badge: 'Adventure Drill',
    icon: Footprints,
    color: '#A855F7',
    image: '/arcade/word_runner.jpg',
    description:
      'Side-scrolling cyber runner. Type upcoming hurdle words to leap over barriers, dodge electric gates, and sprint across neon keyboard rooftops.',
    difficulty: 'Progressive Distance',
    defaultMetricLabel: 'Max Distance',
    defaultMetricUnit: 'meters',
    instructions: [
      'Your cybernetic runner continuously sprints forward along the neon highway.',
      'Each upcoming obstacle displays a target word above it.',
      'Type the word completely before the runner reaches the barrier to jump cleanly.',
      'Stumbling into obstacles reduces shield energy. Clear hurdles to gain velocity.',
    ],
    features: ['Side-scrolling parkour physics', 'Obstacle jump triggers', 'Distance scaling', 'Speed momentum'],
  },
  {
    id: 'memory',
    title: 'Typing Memory',
    subtitle: 'Holographic matrix sequence recall',
    category: 'memory',
    categoryLabel: 'Memory & Recall',
    badge: 'Cognitive Drill',
    icon: Brain,
    color: '#06B6D4',
    image: '/arcade/typing_memory.jpg',
    description:
      'Memorize the flashed sequence of letters and keywords before the shutter closes, then reproduce it purely from muscle memory without visual hints.',
    difficulty: 'Adaptive Rounds (3→9 items)',
    defaultMetricLabel: 'Deepest Round',
    defaultMetricUnit: 'rounds',
    instructions: [
      'Memorization phase: study the glowing sequence before the timer expires.',
      'Recall phase: the sequence disappears completely from the screen and DOM.',
      'Type the exact sequence in correct order from memory.',
      'Sequences grow progressively longer each round. You have 3 memory strike allowances.',
    ],
    features: ['Flash memorization phases', 'Zero DOM hint leakage', 'Progressive length scaling', 'Cognitive recall'],
  },
  {
    id: 'boss',
    title: 'Boss Battle',
    subtitle: 'Battlefield soldier combat & mecha warlord warfare',
    category: 'combat',
    categoryLabel: 'Military Combat',
    badge: 'Combat Trial',
    icon: ShieldAlert,
    color: '#F97316',
    image: '/arcade/boss_battle.jpg',
    description:
      'Defend your frontline military base against waves of advancing enemy soldiers. Type assigned combat codes to fire tracer rounds and eliminate infantry, assault, armored, and elite units before clashing with titanic enemy commanders.',
    difficulty: 'Dynamic Waves (1 → 10+)',
    defaultMetricLabel: 'Top Wave',
    defaultMetricUnit: 'wave',
    instructions: [
      'Enemy soldiers continuously advance across the battlefield toward your perimeter.',
      'Type the combat phrase above the targeted soldier to fire defensive tracer strikes.',
      'Neutralize assault, armored, and spec-ops units before they breach your barricade.',
      'On boss waves, counterstrike the commander attack targets before their charge timer detonates!',
    ],
    features: ['Real-time battlefield soldier combat', '4 distinct enemy soldier classes', 'Titanic boss charge encounters', 'Multi-wave progressive warfare'],
  },
  {
    id: 'nitro',
    title: 'Nitro Type Pro',
    subtitle: 'High-octane multi-lane drag racing',
    category: 'reaction',
    categoryLabel: 'Velocity Racing',
    badge: 'Championship Trial',
    icon: Gauge,
    color: '#EF4444',
    image: '/arcade/nitro_racing.jpg',
    description:
      'High-velocity 4-lane drag racing showdown. Accelerate your supercar by typing racing passages with surgical cadence, deploy nitro bursts, and outpace fierce AI competitors across iconic world circuits.',
    difficulty: 'Progressive (Rookie → Legendary)',
    defaultMetricLabel: 'Top Velocity',
    defaultMetricUnit: 'WPM',
    instructions: [
      'Type the highlighted racing passage with raw speed and precision to surge ahead.',
      'Sustain continuous typing streaks to charge and ignite your high-velocity Nitro Boost.',
      'Outpace Xavier, Thomas, and Joshua across 4 asphalt speedway lanes to claim 1st place.',
      'Earn podium points and cash rewards to unlock high-performance supercars and championship tracks.',
    ],
    features: [
      'Real-time 60 FPS drag racing physics',
      '4-lane competitive AI opponents',
      'Dynamic typing speedometer & tachometer',
      'Nitro boost exhaust ignition',
    ],
  },
];

/**
 * Soldier classes configuration for Boss Battle
 */
export const SOLDIER_CLASSES = {
  infantry: {
    id: 'infantry',
    name: 'Infantry Soldier',
    badge: 'Frontline Unit',
    color: '#10B981',
    speedMult: 1.0,
    scoreValue: 100,
    maxHp: 1,
    pool: 'infantry',
  },
  assault: {
    id: 'assault',
    name: 'Assault Soldier',
    badge: 'Velocity Unit',
    color: '#F43F5E',
    speedMult: 1.35,
    scoreValue: 175,
    maxHp: 1,
    pool: 'assault',
  },
  armored: {
    id: 'armored',
    name: 'Armored Soldier',
    badge: 'Reinforced Unit',
    color: '#38BDF8',
    speedMult: 0.85,
    scoreValue: 275,
    maxHp: 2,
    pool: 'armored',
  },
  elite: {
    id: 'elite',
    name: 'Elite Commando',
    badge: 'Spec-Ops Unit',
    color: '#A855F7',
    speedMult: 1.45,
    scoreValue: 400,
    maxHp: 1,
    pool: 'elite',
  },
};

/**
 * Curated dictionaries by theme, difficulty, and military combat
 * Sourced from the master ARCADE_VOCABULARY database (3,300+ unique words)
 */
export const ARCADE_WORDS = {
  short: ARCADE_VOCABULARY.beginnerShort,
  medium: ARCADE_VOCABULARY.mediumWords,
  long: ARCADE_VOCABULARY.longAdvanced,
  infantry: ARCADE_VOCABULARY.militaryInfantry,
  assault: ARCADE_VOCABULARY.militaryAssault,
  armored: ARCADE_VOCABULARY.militaryArmored,
  elite: ARCADE_VOCABULARY.militaryElite,
  bossPhrases: ARCADE_VOCABULARY.bossPhrases,
  technology: ARCADE_VOCABULARY.technology,
  science: ARCADE_VOCABULARY.science,
  space: ARCADE_VOCABULARY.space,
  nature: ARCADE_VOCABULARY.nature,
  sports: ARCADE_VOCABULARY.sports,
  adventure: ARCADE_VOCABULARY.adventure,
  commonEveryday: ARCADE_VOCABULARY.commonEveryday,
  difficultCombinations: ARCADE_VOCABULARY.difficultCombinations,
  commonLetterCombinations: ARCADE_VOCABULARY.commonLetterCombinations,
};

/**
 * Filter categories for the arcade hub
 */
export const ARCADE_CATEGORIES = [
  { id: 'all', label: 'All Games (8)' },
  { id: 'reaction', label: 'Reaction & Speed (4)' },
  { id: 'precision', label: 'Precision & Recall (2)' },
  { id: 'action', label: 'Action & Combat (2)' },
];

export const getGameById = (gameId) => {
  return ARCADE_GAMES.find((g) => g.id === gameId) || ARCADE_GAMES[0];
};
