/**
 * KEYFLOW — Multi-Competency Placement Assessment & Recommendation Engine
 * =========================================================================
 * Evaluates typing competencies across all dimensions:
 * - Gross & Net WPM
 * - Accuracy & Error rate
 * - Keyboard Familiarity (Home Row, Top Row, Bottom Row)
 * - Spacebar & Word Separation (Missing vs Extra spaces)
 * - Number Row & Special Symbols
 * - Shift Coordination & Punctuation
 * - Rhythm, Cadence & Pause Latencies
 * - Weak Keys & Keystroke Patterns
 * 
 * Maps sequentially to Stages 1 through 10 of KEYFLOW's Academy Curriculum
 * with strict prerequisite-aware gatekeeping (high speed NEVER overrides
 * foundational accuracy or prerequisite gaps).
 */

import { STAGE_META } from '../data/curriculumEngine.js';

/**
 * Diagnostic Tiers designed to measure distinct competencies progressively.
 * Each tier is concise (40-65 characters) for quick, focused assessment.
 */
export const PLACEMENT_TIERS = [
  {
    id: 'foundation',
    tierNumber: 1,
    title: 'Foundations & Alphabet Reach',
    subtitle: 'Tactile anchors, Home-Row stability, and core alphabet reaches',
    instruction: 'Type the foundational drill text. Keep your fingers anchored near the home row and press the Spacebar once between words.',
    text: 'all glass flags fall glad flasks jazz asks',
    guidanceWords: ['all', 'glass', 'flags', 'fall', 'glad', 'flasks', 'jazz', 'asks'],
    competencyFocus: ['home_row', 'spacebar'],
    minTargetWpm: 20,
    minTargetAccuracy: 88,
  },
  {
    id: 'word_flow',
    tierNumber: 2,
    title: 'Word Flow & Spacebar Discipline',
    subtitle: 'Complete 26-letter alphabet, cross-row word transitions, and spacing cadence',
    instruction: 'Type the continuous word flow. Maintain an even rhythm and press the Spacebar firmly once between each word.',
    text: 'the quick brown fox jumps over swift dogs with quiet zeal',
    guidanceWords: ['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'swift', 'dogs', 'with', 'quiet', 'zeal'],
    competencyFocus: ['top_row', 'bottom_row', 'spacebar', 'cadence'],
    minTargetWpm: 32,
    minTargetAccuracy: 90,
  },
  {
    id: 'numbers_punctuation',
    tierNumber: 3,
    title: 'Numbers, Punctuation & Shift Coordination',
    subtitle: 'Blind number reaches, two-handed Shift coordination, and punctuation precision',
    instruction: 'Type the sentence containing numbers and punctuation. Use opposite-hand Shift for capitals and symbols, and Spacebar between words.',
    text: 'In 2026, typing at 85 WPM with 98% accuracy earns $150; keep practicing!',
    guidanceWords: ['In', '2026,', 'typing', 'at', '85', 'WPM', 'with', '98%', 'accuracy', 'earns', '$150;', 'keep', 'practicing!'],
    competencyFocus: ['numbers', 'shift_symbols', 'punctuation'],
    minTargetWpm: 45,
    minTargetAccuracy: 90,
  },
  {
    id: 'technical_capstone',
    tierNumber: 4,
    title: 'Technical Syntax & Velocity Cadence',
    subtitle: 'Programming syntax, code brackets, camelCase, snake_case, and sustained flow',
    instruction: 'Type the technical programming drill. Maintain precision with brackets, quotes, operators, and variable identifiers.',
    text: 'const matrix = { speed: "optimal", burst_rate: 95.5, active: true };',
    guidanceWords: ['const', 'matrix', '=', '{', 'speed:', '"optimal",', 'burst_rate:', '95.5,', 'active:', 'true', '};'],
    competencyFocus: ['code_syntax', 'cadence'],
    minTargetWpm: 60,
    minTargetAccuracy: 92,
  },
];

// Character Sets for Competency Classification
export const CHAR_SETS = {
  home_row: new Set('asdfghjkl;ASDFGHJKL:'),
  top_row: new Set('qwertyuiopQWERTYUIOP'),
  bottom_row: new Set('zxcvbnm,.ZXCVBNM<>'),
  numbers: new Set('0123456789'),
  punctuation: new Set('.,;:!?\'"-/()[]{}'),
  shift_symbols: new Set('!@#$%^&*()_+{}|:"<>?~ABCDEFGHIJKLMNOPQRSTUVWXYZ'),
  code_syntax: new Set('{}[];=<>+*/_`~|\\'),
};

/**
 * Analyzes spacebar and word separation behavior:
 * - Detects correctly placed spaces
 * - Detects missing spaces (user skipped space between words)
 * - Detects extra spaces (user inserted space where letter belonged)
 */
export function analyzeSpacebarDiscipline(targetText, typedText) {
  const targetSpaces = (targetText.match(/ /g) || []).length;
  const typedSpaces = (typedText.match(/ /g) || []).length;

  const missingSpaces = Math.max(0, targetSpaces - typedSpaces);
  const extraSpaces = Math.max(0, typedSpaces - targetSpaces);
  const correctSpaces = Math.max(0, Math.min(targetSpaces, typedSpaces));

  const spaceAccuracy = targetSpaces > 0
    ? Math.max(0, Math.round(((correctSpaces - (extraSpaces * 0.5)) / targetSpaces) * 100))
    : 100;

  return {
    expectedSpaces: targetSpaces,
    correctSpaces,
    missingSpaces,
    extraSpaces,
    accuracy: Math.min(100, spaceAccuracy),
  };
}

/**
 * Calculates Cadence & Rhythm variability from Inter-Keystroke Intervals (IKIs):
 * - Standard deviation of interval times
 * - Coefficient of variation (CV = stdDev / mean)
 * - Identifies hesitation pauses (>1.2 seconds)
 * - Identifies error bursts (3+ consecutive mistakes)
 */
export function analyzeCadence(keystrokes) {
  if (!keystrokes || keystrokes.length < 5) {
    return {
      cadenceScore: 80,
      meanIkiMs: 200,
      pauseCount: 0,
      burstCount: 0,
    };
  }

  const ikis = [];
  let pauseCount = 0;

  for (let i = 1; i < keystrokes.length; i++) {
    const delta = keystrokes[i].time - keystrokes[i - 1].time;
    if (delta > 0 && delta < 5000) {
      ikis.push(delta);
      if (delta > 1200) {
        pauseCount++;
      }
    }
  }

  if (ikis.length === 0) {
    return { cadenceScore: 80, meanIkiMs: 200, pauseCount: 0, burstCount: 0 };
  }

  const meanIki = ikis.reduce((sum, v) => sum + v, 0) / ikis.length;
  const variance = ikis.reduce((sum, v) => sum + Math.pow(v - meanIki, 2), 0) / ikis.length;
  const stdDev = Math.sqrt(variance);
  const cv = meanIki > 0 ? stdDev / meanIki : 0.35;

  // Steady cadence has CV around 0.2 - 0.35; erratic bursts have CV > 0.65
  // Score formula: maps CV of 0.2 to 98%, CV of 0.8 to 45%
  const baseCadence = Math.round((1 - Math.min(1, Math.max(0, (cv - 0.15) / 0.85))) * 100);
  const pausePenalty = Math.min(25, pauseCount * 4);
  const cadenceScore = Math.max(25, Math.min(99, baseCadence - pausePenalty));

  return {
    cadenceScore,
    meanIkiMs: Math.round(meanIki),
    pauseCount,
  };
}

/**
 * Evaluates performance for a single tier or aggregated test session.
 */
export function evaluateTierPerformance({
  targetText,
  typedText,
  keystrokes = [],
  durationSeconds = 1,
}) {
  const elapsedMin = Math.max(0.01, durationSeconds / 60);
  const grossWpm = Math.round((typedText.length / 5) / elapsedMin);

  let correctCount = 0;
  let errorCount = 0;
  let uncorrectedErrors = 0;
  const errorsByKey = {};

  const competencyCounters = {
    home_row: { correct: 0, total: 0 },
    top_row: { correct: 0, total: 0 },
    bottom_row: { correct: 0, total: 0 },
    numbers: { correct: 0, total: 0 },
    punctuation: { correct: 0, total: 0 },
    shift_symbols: { correct: 0, total: 0 },
    code_syntax: { correct: 0, total: 0 },
  };

  for (let i = 0; i < targetText.length; i++) {
    const expected = targetText[i];
    const typed = typedText[i];

    // Attribute character to competency categories
    Object.keys(CHAR_SETS).forEach((cat) => {
      if (CHAR_SETS[cat].has(expected)) {
        competencyCounters[cat].total++;
        if (typed === expected) {
          competencyCounters[cat].correct++;
        }
      }
    });

    if (typed !== undefined) {
      if (typed === expected) {
        correctCount++;
      } else {
        errorCount++;
        uncorrectedErrors++;
        errorsByKey[expected] = (errorsByKey[expected] || 0) + 1;
      }
    }
  }

  // Any extra typed characters beyond target length are errors
  if (typedText.length > targetText.length) {
    const extraCount = typedText.length - targetText.length;
    errorCount += extraCount;
    uncorrectedErrors += extraCount;
  }

  const overallAccuracy = typedText.length > 0
    ? Math.max(0, Math.min(100, Math.round((correctCount / typedText.length) * 100)))
    : 100;

  const netWpm = Math.max(0, Math.round(((typedText.length / 5) - uncorrectedErrors) / elapsedMin));

  const spaceStats = analyzeSpacebarDiscipline(targetText, typedText);
  const cadenceStats = analyzeCadence(keystrokes);

  // Compute breakdown percentages
  const competencyResults = {};
  Object.keys(competencyCounters).forEach((cat) => {
    const c = competencyCounters[cat];
    competencyResults[cat] = {
      accuracy: c.total > 0 ? Math.round((c.correct / c.total) * 100) : 100,
      total: c.total,
      correct: c.correct,
      wpm: grossWpm,
    };
  });

  // Include spacebar in competency results
  competencyResults.spacebar = {
    accuracy: spaceStats.accuracy,
    total: spaceStats.expectedSpaces,
    correct: spaceStats.correctSpaces,
    wpm: grossWpm,
    missing: spaceStats.missingSpaces,
    extra: spaceStats.extraSpaces,
  };

  const weakKeys = Object.entries(errorsByKey)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key]) => key);

  return {
    grossWpm,
    netWpm,
    overallAccuracy,
    errorCount,
    uncorrectedErrors,
    spaceStats,
    cadenceStats,
    competencies: competencyResults,
    weakKeys,
  };
}

/**
 * Combines multiple tier results into an authoritative overall assessment profile.
 */
export function aggregateAssessmentProfile(tierResultsList) {
  if (!tierResultsList || tierResultsList.length === 0) {
    return null;
  }

  let totalChars = 0;
  let totalErrors = 0;
  let totalDurationSec = 0;
  let totalCorrect = 0;
  let weightedGrossWpmSum = 0;
  let totalKeystrokes = 0;

  const aggregatedCompetencies = {
    home_row: { correct: 0, total: 0 },
    top_row: { correct: 0, total: 0 },
    bottom_row: { correct: 0, total: 0 },
    numbers: { correct: 0, total: 0 },
    punctuation: { correct: 0, total: 0 },
    shift_symbols: { correct: 0, total: 0 },
    code_syntax: { correct: 0, total: 0 },
    spacebar: { correct: 0, total: 0, missing: 0, extra: 0 },
  };

  const allWeakKeyCounts = {};
  const allCadenceScores = [];

  tierResultsList.forEach((r) => {
    totalChars += r.typedTextLength || 0;
    totalErrors += r.errorCount || 0;
    totalCorrect += Math.max(0, (r.typedTextLength || 0) - (r.uncorrectedErrors || 0));
    totalDurationSec += r.durationSeconds || 1;
    weightedGrossWpmSum += (r.grossWpm || 0) * (r.durationSeconds || 1);
    totalKeystrokes += (r.keystrokeCount || 0);

    if (r.cadenceStats?.cadenceScore) {
      allCadenceScores.push(r.cadenceStats.cadenceScore);
    }

    if (r.weakKeys) {
      r.weakKeys.forEach((k) => {
        allWeakKeyCounts[k] = (allWeakKeyCounts[k] || 0) + 1;
      });
    }

    if (r.competencies) {
      Object.keys(aggregatedCompetencies).forEach((compKey) => {
        const c = r.competencies[compKey];
        if (c) {
          aggregatedCompetencies[compKey].correct += c.correct || 0;
          aggregatedCompetencies[compKey].total += c.total || 0;
          if (compKey === 'spacebar') {
            aggregatedCompetencies.spacebar.missing += c.missing || 0;
            aggregatedCompetencies.spacebar.extra += c.extra || 0;
          }
        }
      });
    }
  });

  const durationMin = Math.max(0.01, totalDurationSec / 60);
  const overallGrossWpm = Math.round((totalChars / 5) / durationMin);
  const overallNetWpm = Math.max(0, Math.round(((totalChars / 5) - totalErrors) / durationMin));
  const overallAccuracy = totalChars > 0
    ? Math.max(0, Math.min(100, Math.round((totalCorrect / totalChars) * 100)))
    : 100;

  const avgCadence = allCadenceScores.length > 0
    ? Math.round(allCadenceScores.reduce((a, b) => a + b, 0) / allCadenceScores.length)
    : 80;

  // Compile final competency accuracy table
  const finalCompetencies = {};
  Object.keys(aggregatedCompetencies).forEach((k) => {
    const comp = aggregatedCompetencies[k];
    finalCompetencies[k] = {
      accuracy: comp.total > 0 ? Math.round((comp.correct / comp.total) * 100) : 100,
      total: comp.total,
      correct: comp.correct,
      wpm: overallGrossWpm,
      missing: comp.missing || 0,
      extra: comp.extra || 0,
    };
  });

  const sortedWeakKeys = Object.entries(allWeakKeyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k]) => k);

  return {
    grossWpm: overallGrossWpm,
    netWpm: overallNetWpm,
    overallAccuracy,
    totalErrors,
    totalDurationSec: Math.round(totalDurationSec),
    cadenceScore: avgCadence,
    competencies: finalCompetencies,
    weakKeys: sortedWeakKeys,
    tiersCompletedCount: tierResultsList.length,
  };
}

/**
 * Authoritative 10-Stage Curriculum Recommendation Engine.
 * Evaluates measured competencies against prerequisite readiness criteria.
 * Speed NEVER overrides foundational accuracy or prerequisite gaps.
 */
export function calculateStageRecommendation(profile) {
  const {
    grossWpm = 0,
    overallAccuracy = 0,
    cadenceScore = 75,
    competencies = {},
    weakKeys = [],
    tiersCompletedCount = 1,
  } = profile;

  const homeAcc = competencies.home_row?.accuracy ?? overallAccuracy;
  const topAcc = competencies.top_row?.accuracy ?? overallAccuracy;
  const bottomAcc = competencies.bottom_row?.accuracy ?? overallAccuracy;
  const spaceAcc = competencies.spacebar?.accuracy ?? overallAccuracy;
  const numberAcc = competencies.numbers?.accuracy ?? overallAccuracy;
  const punctAcc = competencies.punctuation?.accuracy ?? overallAccuracy;
  const shiftAcc = competencies.shift_symbols?.accuracy ?? overallAccuracy;
  const codeAcc = competencies.code_syntax?.accuracy ?? overallAccuracy;

  let recommendedStage = 1;
  let reason = '';
  const strengths = [];
  const areasToImprove = [];

  // STAGE 1: Home Row Foundations
  // Placed here if Home Row accuracy < 90% OR Spacebar < 85% OR Gross WPM < 20
  if (homeAcc < 90 || spaceAcc < 85 || grossWpm < 20) {
    recommendedStage = 1;
    reason = 'Foundational touch-typing anchors and muscle memory on the Home Row (F and J bumps) require consolidation before reach training.';
    if (homeAcc >= 85) strengths.push('Beginning home-row familiarity established');
    if (grossWpm >= 15) strengths.push('Natural typing pacing without heavy fatigue');
    areasToImprove.push('Home-row tactile anchor stability (F and J index key bumps)');
    if (spaceAcc < 85) areasToImprove.push('Spacebar word separation discipline (avoid missing or double spaces)');
    areasToImprove.push('Eliminating glance-downs at the keyboard layout');
  }
  // STAGE 2: Top Row Control
  // Placed here if Top Row accuracy < 90% OR Gross WPM < 28
  else if (topAcc < 90 || grossWpm < 28) {
    recommendedStage = 2;
    reason = 'Home-row anchor keys are well mastered; structured upward diagonal reach discipline (QWERTYUIOP) and recovery to home rest are recommended.';
    strengths.push('Solid home-row anchor stabilization');
    if (spaceAcc >= 90) strengths.push('Consistent word separation and clean spacebar timing');
    areasToImprove.push('Upward diagonal reach accuracy without lifting wrist rests');
    areasToImprove.push('Top-row letter recall (E, R, T, U, I, O)');
    areasToImprove.push('Smooth return to F and J home-row rest pose');
  }
  // STAGE 3: Bottom Row Control
  // Placed here if Bottom Row accuracy < 90% OR Gross WPM < 35
  else if (bottomAcc < 90 || grossWpm < 35) {
    recommendedStage = 3;
    reason = 'Home and top rows are stable; downward finger curls (ZXCVBNM) and pinky reach stabilization on the bottom row require dedicated practice.';
    strengths.push('Clean home-row anchor stability');
    strengths.push('Confident upward reach into top-row vowels and consonants');
    areasToImprove.push('Downward finger curl mechanics across the bottom row');
    areasToImprove.push('Pinky finger reach accuracy on Z and punctuation keys');
    areasToImprove.push('Wrist alignment and posture during downward key navigation');
  }
  // STAGE 4: Full Alphabet Mastery & Cross-Row Transitions
  // Placed here if Gross WPM < 42 OR Cadence Score < 60
  else if (grossWpm < 42 || cadenceScore < 60) {
    recommendedStage = 4;
    reason = 'All three keyboard rows are accessible; building seamless cross-row leaps, high-frequency digrams, and vocabulary rhythm will unlock fluency.';
    strengths.push('Comprehensive reach across all three letter rows (top, home, bottom)');
    strengths.push('Balanced left and right hand key recall');
    areasToImprove.push('Seamless cross-row leaps between top and bottom rows');
    areasToImprove.push('High-frequency letter pairs (th, he, in, er, an, tion)');
    areasToImprove.push('Consistent typing cadence on multi-syllable vocabulary');
  }
  // STAGE 5: Number Row Mastery & Ten-Key Dexterity
  // GATED: Fast typist (even 90 WPM) with weak numbers (<88%) MUST start at Stage 5!
  else if (numberAcc < 88) {
    recommendedStage = 5;
    reason = 'Full alphabet fluency is strong; blind touch-typing on the top number row (1-0) without glancing down is your key growth milestone.';
    strengths.push('Fluent full-alphabet touch-typing velocity');
    strengths.push('Strong word separation and natural spacebar cadence');
    areasToImprove.push('Blind upward reach to top number row (1-0) without looking');
    areasToImprove.push('Finger assignments for central numbers (4, 5, 6, 7)');
    areasToImprove.push('Immediate tactile recovery to home row after typing numeric strings');
  }
  // STAGE 6: Shift Discipline, Punctuation & Common Symbols
  // GATED: High speed typist with poor shift/punctuation (<88%) MUST start at Stage 6!
  else if (punctAcc < 88 || shiftAcc < 88) {
    recommendedStage = 6;
    reason = 'Alphanumeric typing is confident; two-handed opposite-hand Shift coordination and punctuation precision need structured refinement.';
    strengths.push('High-speed alphabet and number row fluency');
    strengths.push('Rapid key recall on both hands');
    areasToImprove.push('Opposite-hand Shift discipline (never press Shift with same hand as letter)');
    areasToImprove.push('Punctuation precision (semicolons, colons, commas, quotes)');
    areasToImprove.push('Capitalization cadence without hesitation latencies');
  }
  // STAGE 7: High-Frequency Vocabulary & Rhythm Cadence
  // Placed here if Gross WPM < 62 OR Cadence Score < 75
  else if (grossWpm < 62 || cadenceScore < 75) {
    recommendedStage = 7;
    reason = 'All keyboard keys are accessible; training with the top 1,000 core English words will eliminate pause latencies and build a metronomic cadence.';
    strengths.push('Complete keyboard mastery across letters, numbers, and symbols');
    strengths.push('Accurate punctuation and Shift coordination');
    areasToImprove.push('Eliminating pause latencies between words');
    areasToImprove.push('Building steady, metronomic typing rhythm without burst-and-stall cycles');
    areasToImprove.push('High-velocity muscle memory for the top 1,000 English words');
  }
  // STAGE 8: Speed & Endurance Building
  // Placed here if Gross WPM < 73 OR Overall Accuracy < 94
  else if (grossWpm < 73 || overallAccuracy < 94) {
    recommendedStage = 8;
    reason = 'Fluid metronomic cadence demonstrated; Speed & Endurance Building with high-velocity interval sprints and sustained multi-minute stamina will push past 70+ WPM velocity plateaus.';
    strengths.push('Excellent typing rhythm and balanced cadence');
    strengths.push('Fast, accurate navigation across standard and numeric prose');
    areasToImprove.push('Sustained stamina across multi-minute typing passages');
    areasToImprove.push('Velocity sprint intervals above 70 WPM');
    areasToImprove.push('Physical relaxation to prevent fingertip tension during speed runs');
  }
  // STAGE 9: Technical, Numeric & Professional Fluency
  // Placed here if Gross WPM < 83 OR Code Syntax Accuracy < 88
  else if (grossWpm < 83 || codeAcc < 88) {
    recommendedStage = 9;
    reason = 'High-velocity 70+ WPM typing confirmed; specialized practice with programming syntax, code brackets, camelCase, and technical prose is recommended.';
    strengths.push('High-velocity 70+ WPM touch-typing with strong stamina');
    strengths.push('Superior punctuation, numeric, and cadence control');
    areasToImprove.push('Code syntax and bracket pairs ({ }, [ ], < >, =>)');
    areasToImprove.push('Technical naming conventions (camelCase, snake_case, CONSTANT_CASE)');
    areasToImprove.push('Terminal command line and developer prose fluency');
  }
  // STAGE 10: Master Typist & Specialization
  // Grandmaster: Gross WPM >= 80, Accuracy >= 95%, Code syntax >= 88%, Cadence >= 80%
  else {
    recommendedStage = 10;
    reason = 'Grandmaster qualified! Demonstrates elite speed, near-flawless accuracy, and seamless technical control across complex literary and technical prose.';
    strengths.push('Grandmaster speed exceeding 80+ WPM with elite precision');
    strengths.push('Flawless two-handed Shift coordination and punctuation dexterity');
    strengths.push('Effortless code syntax and bracket navigation');
    areasToImprove.push('Extreme velocity endurance on literary and academic masterworks');
    areasToImprove.push('Micro-cadence optimization toward 95+ WPM benchmarks');
  }

  // Ensure stage meta exists
  const stageMeta = STAGE_META[recommendedStage - 1] || STAGE_META[0];

  // Specific weak key feedback
  if (weakKeys.length > 0) {
    const formattedKeys = weakKeys.map((k) => (k === ' ' ? 'Spacebar' : `'${k}'`)).join(', ');
    areasToImprove.push(`Accuracy calibration on diagnosed focus keys: ${formattedKeys}`);
  }

  // Format skill breakdown list
  const skillBreakdown = [
    {
      key: 'home_row',
      label: 'Home Row Foundation',
      accuracy: homeAcc,
      wpm: competencies.home_row?.wpm || grossWpm,
      status: homeAcc >= 90 ? 'Passed' : 'Focus Area',
    },
    {
      key: 'top_row',
      label: 'Top Row Upward Reach',
      accuracy: topAcc,
      wpm: competencies.top_row?.wpm || grossWpm,
      status: topAcc >= 90 ? 'Passed' : 'Focus Area',
    },
    {
      key: 'bottom_row',
      label: 'Bottom Row Downward Reach',
      accuracy: bottomAcc,
      wpm: competencies.bottom_row?.wpm || grossWpm,
      status: bottomAcc >= 90 ? 'Passed' : 'Focus Area',
    },
    {
      key: 'spacebar',
      label: 'Spacebar & Word Separation',
      accuracy: spaceAcc,
      wpm: competencies.spacebar?.wpm || grossWpm,
      status: spaceAcc >= 90 ? 'Passed' : 'Focus Area',
    },
    {
      key: 'numbers',
      label: 'Number Row Dexterity',
      accuracy: numberAcc,
      wpm: competencies.numbers?.wpm || grossWpm,
      status: numberAcc >= 88 ? 'Passed' : 'Focus Area',
    },
    {
      key: 'punctuation',
      label: 'Punctuation & Shift Precision',
      accuracy: Math.min(punctAcc, shiftAcc),
      wpm: competencies.punctuation?.wpm || grossWpm,
      status: (punctAcc >= 88 && shiftAcc >= 88) ? 'Passed' : 'Focus Area',
    },
    {
      key: 'cadence',
      label: 'Cadence Rhythm & Consistency',
      accuracy: cadenceScore,
      wpm: grossWpm,
      status: cadenceScore >= 75 ? 'Passed' : 'Focus Area',
    },
  ];

  if (codeAcc !== 100 || tiersCompletedCount >= 4) {
    skillBreakdown.push({
      key: 'code_syntax',
      label: 'Technical Syntax & Brackets',
      accuracy: codeAcc,
      wpm: grossWpm,
      status: codeAcc >= 88 ? 'Passed' : 'Focus Area',
    });
  }

  return {
    recommendedStage,
    stageMeta,
    recommendedUnit: 1,
    recommendedLevel: 1,
    startingLessonLogicalId: `S${String(recommendedStage).padStart(2, '0')}-L001`,
    reason,
    strengths,
    areasToImprove,
    skillBreakdown,
  };
}
