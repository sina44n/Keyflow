/**
 * StickmanTypingEngine.js — Core Combat Typing Controller & Command Engine
 * =======================================================================
 * The primary combat interface for STICKMAN FIGHT (Prompt Section 4 & Reference Video 2):
 * - Generates contextual martial commands (Attacks, Defenses, Mobility, Combos)
 * - Real-time character-by-character typing verification
 * - Dynamic Flow Combo Multiplier (up to 4.5x)
 * - Genuine mathematical calculation of WPM, Accuracy %, Reaction Time, and Keystrokes
 * - Adaptive difficulty progression scaling from Wave 1 to Wave 5 Boss
 */

export const COMBAT_COMMAND_POOLS = {
  // Wave 1-2: Fast, punchy 3-5 letter words
  beginner: {
    attacks: ['SLASH', 'STRIKE', 'CUT', 'JAB', 'HACK', 'SLICE', 'KICK', 'PUNCH', 'CHOP'],
    defenses: ['BLOCK', 'GUARD', 'PARRY', 'WARD'],
    mobility: ['DASH', 'LEAP', 'DODGE', 'ROLL', 'VAULT', 'STEP', 'RUSH'],
    combos: ['COMBO', 'BLITZ', 'SURGE', 'FURY'],
  },

  // Wave 3-4: 5-8 letter martial words & technical strikes
  intermediate: {
    attacks: ['CLEAVE', 'FLURRY', 'PIERCE', 'EXECUTE', 'THRUST', 'CYCLONE', 'IMPALE', 'LACERATE'],
    defenses: ['DEFLECT', 'COUNTER', 'REPOSTE', 'ABSORB', 'BARRIER'],
    mobility: ['ADVANCE', 'RETREAT', 'SOMERSAULT', 'BACKSTEP', 'FLANK'],
    combos: ['NEON SURGE', 'DRAGON BITE', 'BLADE STORM', 'CRIMSON FANG'],
  },

  // Wave 5 Boss: Complex phrases & legendary martial techniques
  expert: {
    attacks: ['SHADOW STRIKE', 'VOID CUTTER', 'TITAN CLEAVER', 'ETERNAL SLASH', 'APEX FLURRY'],
    defenses: ['PERFECT PARRY', 'AEGIS SHIELD', 'MIRROR DEFLECT', 'DIVINE GUARD'],
    mobility: ['PHANTOM STEP', 'TEMPEST DASH', 'SHADOW VAULT', 'ABSOLUTE DODGE'],
    combos: ['CRIMSON BLADE STORM', 'INFERNAL DRAGON SURGE', 'CELESTIAL EXECUTION'],
  },
};

export class StickmanTypingEngine {
  constructor(audio) {
    this.audio = audio;

    // Active command state
    this.activeCommand = null; // { text, category, actionKey, targetId }
    this.typedBuffer = ''; // currently typed portion
    this.lastInputTime = Date.now();
    this.commandStartTime = Date.now();

    // Telemetry & Metrics (Strict mathematical computation)
    this.totalKeystrokes = 0;
    this.correctKeystrokes = 0;
    this.errorCount = 0;
    this.commandsCompleted = 0;
    this.reactionTimes = [];
    this.startTime = Date.now();

    // Flow Combo System
    this.comboCount = 0;
    this.maxCombo = 0;
    this.comboTimer = 0;
    this.comboDuration = 4.0; // 4 seconds to maintain combo chain

    // Difficulty level ('beginner' | 'intermediate' | 'expert')
    this.difficultyTier = 'beginner';
  }

  setDifficulty(wave) {
    if (wave >= 5) {
      this.difficultyTier = 'expert';
    } else if (wave >= 3) {
      this.difficultyTier = 'intermediate';
    } else {
      this.difficultyTier = 'beginner';
    }
  }

  reset() {
    this.typedBuffer = '';
    this.totalKeystrokes = 0;
    this.correctKeystrokes = 0;
    this.errorCount = 0;
    this.commandsCompleted = 0;
    this.reactionTimes = [];
    this.startTime = Date.now();
    this.comboCount = 0;
    this.maxCombo = 0;
    this.comboTimer = 0;
    this.activeCommand = null;
  }

  /**
   * Generates a new combat command tailored to the situation
   */
  generateCommand(context = {}) {
    const pool = COMBAT_COMMAND_POOLS[this.difficultyTier] || COMBAT_COMMAND_POOLS.beginner;

    // Prioritize context: if enemy is in windup, favor defensive prompts ('parry' / 'dodge' / 'block')
    let category = 'attacks';
    if (context.isDefensiveEmergency && Math.random() < 0.65) {
      category = 'defenses';
    } else if (context.isComboReady && Math.random() < 0.4) {
      category = 'combos';
    } else if (Math.random() < 0.25) {
      category = 'mobility';
    }

    const words = pool[category] || pool.attacks;
    let chosenText = words[Math.floor(Math.random() * words.length)];

    // Map word to actual animation / combat action
    let actionKey = 'slash';
    const upper = chosenText.toUpperCase();

    if (upper.includes('SLASH') || upper.includes('SLICE') || upper.includes('CHOP')) actionKey = 'slash';
    else if (upper.includes('STRIKE') || upper.includes('JAB') || upper.includes('THRUST') || upper.includes('PIERCE')) actionKey = 'strike';
    else if (upper.includes('CLEAVE') || upper.includes('HACK') || upper.includes('CRUSH') || upper.includes('TITAN')) actionKey = 'cleave';
    else if (upper.includes('FLURRY') || upper.includes('PUNCH') || upper.includes('KICK') || upper.includes('LACERATE')) actionKey = 'flurry';
    else if (upper.includes('CYCLONE') || upper.includes('STORM') || upper.includes('BLITZ')) actionKey = 'cyclone';
    else if (upper.includes('BLADE STORM') || upper.includes('DRAGON') || upper.includes('SURGE') || upper.includes('EXECUTION')) actionKey = 'bladeStorm';
    else if (upper.includes('BLOCK') || upper.includes('GUARD') || upper.includes('WARD') || upper.includes('SHIELD')) actionKey = 'block';
    else if (upper.includes('PARRY') || upper.includes('DEFLECT') || upper.includes('COUNTER') || upper.includes('REPOSTE')) actionKey = 'parry';
    else if (upper.includes('DODGE') || upper.includes('ROLL') || upper.includes('SOMERSAULT')) actionKey = 'dodge';
    else if (upper.includes('ADVANCE') || upper.includes('DASH') || upper.includes('RUSH')) actionKey = 'advance';
    else if (upper.includes('RETREAT') || upper.includes('BACKSTEP')) actionKey = 'retreat';
    else if (upper.includes('LEAP') || upper.includes('VAULT') || upper.includes('STEP')) actionKey = 'leap';

    this.activeCommand = {
      text: chosenText,
      category,
      actionKey,
      targetId: context.targetId || null,
    };

    this.typedBuffer = '';
    this.commandStartTime = Date.now();
    return this.activeCommand;
  }

  /**
   * Process a keystroke against the active combat command
   * @param {string} key The key pressed by the user
   * @returns {Object} { status: 'advancing' | 'completed' | 'error', actionKey, progress }
   */
  processKeystroke(key) {
    if (!this.activeCommand || !this.activeCommand.text) {
      return { status: 'none' };
    }

    // Ignore non-printable keys
    if (key.length > 1 && key !== 'Backspace' && key !== ' ') {
      return { status: 'ignored' };
    }

    this.totalKeystrokes++;
    const targetText = this.activeCommand.text;
    const nextExpectedChar = targetText[this.typedBuffer.length];

    // Case-insensitive match for combat ergonomics
    if (key.toLowerCase() === nextExpectedChar.toLowerCase()) {
      // CORRECT KEYSTROKE!
      this.typedBuffer += nextExpectedChar;
      this.correctKeystrokes++;
      this.lastInputTime = Date.now();

      if (this.audio) this.audio.playKeyType(false);

      // Check if command is fully typed
      if (this.typedBuffer.length === targetText.length) {
        // COMMAND COMPLETE!
        const reactionTime = (Date.now() - this.commandStartTime) / 1000;
        this.reactionTimes.push(reactionTime);
        this.commandsCompleted++;

        // Increment Combo
        this.comboCount++;
        this.maxCombo = Math.max(this.maxCombo, this.comboCount);
        this.comboTimer = this.comboDuration;

        if (this.audio) this.audio.playWordComplete();

        const completedAction = this.activeCommand.actionKey;
        const completedCommand = { ...this.activeCommand };

        // Reset buffer and prepare for next
        this.typedBuffer = '';

        return {
          status: 'completed',
          actionKey: completedAction,
          command: completedCommand,
          reactionTime,
          comboMultiplier: this.getComboMultiplier(),
        };
      }

      return {
        status: 'advancing',
        typed: this.typedBuffer,
        remaining: targetText.slice(this.typedBuffer.length),
        progress: this.typedBuffer.length / targetText.length,
      };
    } else {
      // INCORRECT KEYSTROKE
      this.errorCount++;
      if (this.audio) this.audio.playKeyType(true);

      // Break combo or reduce multiplier on mistakes
      if (this.comboCount > 0) {
        this.comboCount = Math.max(0, this.comboCount - 1);
      }

      return {
        status: 'error',
        typed: this.typedBuffer,
        remaining: targetText.slice(this.typedBuffer.length),
        expected: nextExpectedChar,
        received: key,
      };
    }
  }

  /**
   * Flow Combo Multiplier: 1.0x -> 4.5x
   */
  getComboMultiplier() {
    if (this.comboCount <= 1) return 1.0;
    if (this.comboCount <= 4) return 1.5;
    if (this.comboCount <= 8) return 2.2;
    if (this.comboCount <= 15) return 3.2;
    return 4.5;
  }

  /**
   * Real-time metrics calculations
   */
  getMetrics() {
    const elapsedMinutes = Math.max(0.01, (Date.now() - this.startTime) / 60000);
    // Standard typing formula: (correct characters / 5) / minutes
    const netWpm = Math.max(0, Math.round((this.correctKeystrokes / 5) / elapsedMinutes));

    const totalAttempts = this.correctKeystrokes + this.errorCount;
    const accuracy = totalAttempts > 0
      ? Math.max(0, Math.min(100, Math.round((this.correctKeystrokes / totalAttempts) * 100)))
      : 100;

    const avgReaction = this.reactionTimes.length > 0
      ? (this.reactionTimes.reduce((a, b) => a + b, 0) / this.reactionTimes.length).toFixed(2)
      : '0.00';

    return {
      wpm: netWpm,
      accuracy,
      totalKeystrokes: this.totalKeystrokes,
      correctKeystrokes: this.correctKeystrokes,
      errorCount: this.errorCount,
      combo: this.comboCount,
      maxCombo: this.maxCombo,
      multiplier: this.getComboMultiplier(),
      commandsCompleted: this.commandsCompleted,
      avgReactionTime: `${avgReaction}s`,
    };
  }

  /**
   * Update per-frame timers
   */
  update(delta) {
    if (this.comboTimer > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
      }
    }
  }
}
