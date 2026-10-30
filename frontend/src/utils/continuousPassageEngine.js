/**
 * KEYFLOW Arcade — Continuous Unlimited Passage Streaming Engine
 * =============================================================
 * Provides an effectively unlimited, difficulty-aware, multi-domain stream of
 * meaningful typing passages. Eliminates fixed-length limitations and guarantees
 * seamless continuous typing without interrupting the racing simulation.
 */

export const CONTINUOUS_PASSAGE_LIBRARY = {
  // Tier 1: Rookie / Beginner (Common words, clean cadence, minimal punctuation)
  rookie: [
    'The red sports car accelerates quickly down the open track as the lights turn green.',
    'Speed is about smooth rhythm and keeping your eyes fixed forward on the finish line.',
    'Fast fingers make the engine roar as each word propels your car ahead of the pack.',
    'Every clean stroke adds momentum to your run as you shift into top gear with confidence.',
    'Focus on the path ahead and let your hands find every key without glancing down.',
    'The morning sun shines bright over the speedway as four tuned cars take their places.',
    'Smooth typing creates effortless velocity when your fingers move with calm precision.',
    'Accelerate smoothly out of the wide bend and maintain your speed along the straight.',
    'The open highway stretches far into the horizon as your tachometer climbs steadily.',
    'Steady hands and calm focus allow you to build an unbeatable rhythm from lap to lap.',
    'Rhythm is the secret of high speed driving where every clean keystroke counts.',
    'Follow the road lines and feel the power of the engine respond to your every command.',
  ],

  // Tier 2: Amateur / Intermediate (Longer sentences, automotive terminology, regular punctuation)
  amateur: [
    'Tires grip the asphalt as you enter the wide curve, maintaining an effortless typing cadence.',
    'The crowd cheers from the stadium grandstands while four sleek supercars blast past the pit wall.',
    'Quick reflexes allow you to read ahead, letting each keypress flow without hesitation or friction.',
    'Precision and velocity unite on the speedway, turning focused keystrokes into sheer kinetic power.',
    'Carbon-fiber body panels reduce curb weight, allowing instantaneous throttle response off the line.',
    'Twin overhead camshafts scream as you shift into fourth gear, pulling ahead of Xavier by half a car.',
    'The evening breeze cools the glowing brake rotors as you maintain a steady sixty-five words per minute.',
    'Aerodynamic splitters channel turbulent air around the chassis to generate maximum cornering downforce.',
    'Sustained typing accuracy keeps your fuel mixture optimal and delivers continuous engine acceleration.',
    'Reading three words ahead allows your fingers to execute fluid combinations before conscious thought.',
    'The digital dashboard flashes green as your velocity climbs through the third timing sector smoothly.',
    'Drafting behind the lead vehicle reduces aerodynamic drag and sets up the perfect overtaking maneuver.',
  ],

  // Tier 3: Semi-Pro / Advanced (Technical telemetry, compound sentences, capitalization, numbers)
  advanced: [
    'Engines scream at 9,000 RPM as you draft behind the leader, waiting for the perfect moment to strike.',
    'Downforce pins the carbon chassis to the track; your hands maintain flawless home-row discipline under pressure.',
    'Twin turbochargers spool into boost at 4.2 bar, surging past the quarter-mile mark in second position.',
    'Telemetry confirms 85 WPM with 99.4% accuracy through Sector 2; titanium exhaust pipes roar in overdrive.',
    'Navigating the technical chicanes requires surgical rhythm: braking into the apex before applying maximum acceleration.',
    'Carbon-ceramic brakes glow cherry red in the twilight; meanwhile, your cadence remains unflinching at high speed.',
    'The digital tachometer sweeps toward redline as nitrous oxide injects into the intake manifold with a deafening roar.',
    'Mastery over complex punctuation and compound words preserves your momentum while competitors struggle with missed strokes.',
    'Aerodynamic ground-effect tunnels generate 2,400 pounds of suction, gluing all four alloy wheels to the asphalt.',
    'Synchronizing cognitive parsing with finger kinematics rewires neuromuscular pathways for zero-glance velocity.',
    'Formula-grade telemetry records unbroken acceleration as the titanium exhaust bellows across the main straightaway.',
    'The checkered flag waves in the distance as your speed peaks at maximum threshold, leaving the competition far behind.',
  ],

  // Tier 4: Master / Legendary (Complex prose, diverse domains, challenging syntax, extreme velocity)
  legendary: [
    'High-stakes motorsport demands total neurological synchronization; every hyphen, apostrophe, and capital letter must execute flawlessly.',
    'Approaching the final sector at over 120 words per minute, the aerodynamic slipstream delivers crucial overtaking advantages.',
    'Telemetry gauges confirm zero input latency as you execute rapid alphanumeric sequences across five precision keyboard rows.',
    'Championship glory belongs to those whose fingers dance effortlessly across mechanical switches with uncompromising precision.',
    'Atmospheric pressure drops across the aerodynamic diffuser, generating 3,200 pounds of vacuum downforce through the high-speed sweepers.',
    'Grandmaster cadence combines surgical precision, relentless rhythm, and peak cognitive stamina into an unstoppable racing triumph.',
    'The hall of champions welcomes a true titan of precision typing, whose mastery rewrites the limits of human neuromuscular velocity.',
    'Laser-guided telemetry tracks every microsecond of actuation latency, confirming absolute harmony between mind, switch, and speedway.',
    'Hypercar prototypes battle wheel-to-wheel through the midnight rain, illuminated only by blinding xenon beams and glowing brake discs.',
    'Effortless velocity emerges when neuromuscular memory supersedes active deliberation, allowing text to materialize directly into kinetic force.',
  ],
};

/**
 * Returns a curated passage matching the requested difficulty tier.
 */
export const getPassageForTier = (tier = 1) => {
  const numericTier = Math.max(1, Math.min(8, Number(tier) || 1));
  let pool = CONTINUOUS_PASSAGE_LIBRARY.rookie;
  if (numericTier >= 7) {
    pool = CONTINUOUS_PASSAGE_LIBRARY.legendary;
  } else if (numericTier >= 5) {
    pool = CONTINUOUS_PASSAGE_LIBRARY.advanced;
  } else if (numericTier >= 3) {
    pool = CONTINUOUS_PASSAGE_LIBRARY.amateur;
  }
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
};

/**
 * Continuous Passage Stream Queue
 * Manages seamless rolling text buffers, prefetching, sliding viewport windows,
 * and persistent cumulative typing metrics without resetting race progress.
 */
export class PassageStreamQueue {
  constructor({ tier = 1, initialPassagesCount = 3 } = {}) {
    this.tier = tier;
    this.passagesQueue = [];
    this.historyIndices = new Set();

    // Cumulative session metrics
    this.globalCursor = 0;
    this.totalCharsTyped = 0;
    this.totalCorrect = 0;
    this.totalErrors = 0;
    this.currentStreak = 0;
    this.bestStreak = 0;
    this.passagesCompleted = 0;

    // Buffer state
    this.fullText = '';

    // Initialize buffer with multiple passages
    for (let i = 0; i < initialPassagesCount; i++) {
      this.appendNextPassage();
    }
  }

  /**
   * Selects a new unique passage from the appropriate tier pool.
   */
  pickNextPassage() {
    const numericTier = Math.max(1, Math.min(8, Number(this.tier) || 1));
    let pool = CONTINUOUS_PASSAGE_LIBRARY.rookie;
    if (numericTier >= 7) {
      pool = CONTINUOUS_PASSAGE_LIBRARY.legendary;
    } else if (numericTier >= 5) {
      pool = CONTINUOUS_PASSAGE_LIBRARY.advanced;
    } else if (numericTier >= 3) {
      pool = CONTINUOUS_PASSAGE_LIBRARY.amateur;
    }

    // Try to pick an unvisited passage
    const available = pool.filter((_, idx) => !this.historyIndices.has(`${numericTier}_${idx}`));
    const chosenPool = available.length > 0 ? available : pool;
    if (available.length === 0) {
      this.historyIndices.clear();
    }

    const randIdx = Math.floor(Math.random() * chosenPool.length);
    const text = chosenPool[randIdx];
    this.historyIndices.add(`${numericTier}_${randIdx}`);
    return text;
  }

  /**
   * Appends the next passage to the continuous stream buffer.
   */
  appendNextPassage() {
    const text = this.pickNextPassage();
    if (this.fullText.length === 0) {
      this.fullText = text;
    } else {
      this.fullText += ' ' + text;
    }
  }

  /**
   * Sets new tier for progressive difficulty scaling.
   */
  setTier(newTier) {
    this.tier = Math.max(1, Math.min(8, Number(newTier) || 1));
  }

  /**
   * Current target character expected from the player.
   */
  getCurrentChar() {
    return this.fullText[this.globalCursor] || '';
  }

  /**
   * Processes a single player keystroke.
   * Returns: { isCorrect, expectedChar, typedChar, isPassageBoundary, newWpm, accuracy }
   */
  handleKeystroke(char, elapsedSeconds = 1) {
    const expected = this.getCurrentChar();
    if (!expected) {
      // Buffer ran out, ensure more text is ready
      this.appendNextPassage();
    }

    const isCorrect = char === expected;

    if (isCorrect) {
      this.globalCursor++;
      this.totalCharsTyped++;
      this.totalCorrect++;
      this.currentStreak++;
      this.bestStreak = Math.max(this.bestStreak, this.currentStreak);

      // Check if we are approaching buffer boundary (within 50 chars)
      const remainingBuffer = this.fullText.length - this.globalCursor;
      if (remainingBuffer < 60) {
        this.appendNextPassage();
      }
    } else {
      this.totalCharsTyped++;
      this.totalErrors++;
      this.currentStreak = 0;
    }

    // Live metrics calculation
    const words = this.totalCorrect / 5;
    const minutes = Math.max(0.01, elapsedSeconds / 60);
    const liveWpm = Math.round(words / minutes);
    const totalStrokes = this.totalCorrect + this.totalErrors;
    const accuracy = totalStrokes > 0 ? Math.round((this.totalCorrect / totalStrokes) * 100) : 100;

    return {
      isCorrect,
      expectedChar: expected,
      typedChar: char,
      cursor: this.globalCursor,
      liveWpm,
      accuracy,
      currentStreak: this.currentStreak,
      bestStreak: this.bestStreak,
    };
  }

  /**
   * Handles backspace keystroke safely within the current buffer.
   */
  handleBackspace() {
    if (this.globalCursor > 0) {
      this.globalCursor--;
      return true;
    }
    return false;
  }

  /**
   * Provides a sliding viewport window of text for smooth, focused rendering.
   * Prevents overwhelming the player with infinite text while preserving visual context.
   */
  getViewportWindow(pastChars = 35, upcomingChars = 90) {
    const start = Math.max(0, this.globalCursor - pastChars);
    const end = Math.min(this.fullText.length, this.globalCursor + upcomingChars);

    const relativeCursor = this.globalCursor - start;
    const windowText = this.fullText.slice(start, end);

    return {
      windowText,
      relativeCursor,
      startOffset: start,
      endOffset: end,
      totalLength: this.fullText.length,
      globalCursor: this.globalCursor,
    };
  }

  /**
   * Total continuous distance or characters completed.
   */
  getProgress() {
    return {
      globalCursor: this.globalCursor,
      totalCorrect: this.totalCorrect,
      totalErrors: this.totalErrors,
      currentStreak: this.currentStreak,
      bestStreak: this.bestStreak,
      bufferLength: this.fullText.length,
    };
  }
}
