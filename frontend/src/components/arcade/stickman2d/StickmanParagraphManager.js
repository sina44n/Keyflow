/**
 * StickmanParagraphManager.js
 * Continuous Battle Paragraph & Sentence Typing Engine.
 *
 * Implements:
 * - Evocative, grammatically correct martial arts battle passages.
 * - Accurate Gross WPM, Net WPM, Accuracy, Keystroke Cadence, and Combo Multipliers.
 * - Choreography events: word completion, punctuation, paragraph finishers, and error stumble.
 * - Automatic seamless streaming into the next passage without breaking typing flow.
 */

export const BATTLE_PARAGRAPHS = {
  // Phase 1: 1-on-1 Sparring Passages
  encounter1: [
    "The crimson martial artist stepped into the arena, watching every breath of the shadowy opponent. With blinding speed, he closed the distance and launched a rapid barrage of strikes.",
    "Bouncing lightly on the balls of his feet, the fighter ducked beneath an incoming fist and drove a sharp counter into his rival's chest. Balance and precision decided every exchange.",
    "Dust rose from the flagstones as the two stickmen circled each other. He timed his approach carefully, stepping forward with a crisp jab before pivoting into a high roundhouse kick.",
  ],

  // Encounter 2: Two Opponents
  encounter2: [
    "Two shadow fighters advanced from opposite flanks, seeking to overwhelm him through sheer numbers. Shifting his stance, he intercepted the first attacker and swept low across the stones.",
    "Steel nerves and unbroken cadence guided his movement. He deflected a flying knee from the left, spun fluidly through the pocket, and drove both rivals backward with relentless combinations.",
  ],

  // Encounter 3: Three Opponents
  encounter3: [
    "Three adversaries closed the ring in tight formation. Breathing through the clash, the warrior vaulted into the air, driving a ferocious dropkick into their line and scattering their assault.",
    "Shadows blurred across the arena as rapid strikes collided. Every sentence typed fueled his speed, channeling pure martial spirit into an unstoppable torrent of punches and evasions.",
  ],

  // Advanced / Boss Encounters
  boss: [
    "The colossal shadow champion stepped forward with thunderous footsteps. The crimson warrior focused his inner energy, planting both feet firmly before unleashing a roaring double-palm ki blast that shattered the night.",
  ],
};

export class StickmanParagraphManager {
  constructor(options = {}) {
    this.onCorrectChar = options.onCorrectChar || (() => {});
    this.onErrorChar = options.onErrorChar || (() => {});
    this.onWordComplete = options.onWordComplete || (() => {});
    this.onPunctuation = options.onPunctuation || (() => {});
    this.onParagraphComplete = options.onParagraphComplete || (() => {});

    this.currentPassage = "";
    this.currentIndex = 0;
    this.charStatuses = [];
    this.typedHistory = [];

    this.startTime = null;
    this.lastKeystrokeTime = null;
    this.totalKeystrokes = 0;
    this.correctKeystrokes = 0;
    this.errorCount = 0;
    this.currentCombo = 0;
    this.maxCombo = 0;

    this.currentWordStartIndex = 0;
    this.wordsTyped = 0;

    this.encounterIndex = 1;
    this.paragraphIdx = 0;

    this.loadPassageForEncounter(1);
  }

  loadPassageForEncounter(encounter = 1) {
    this.encounterIndex = encounter;
    let pool = BATTLE_PARAGRAPHS.encounter1;
    if (encounter === 2) pool = BATTLE_PARAGRAPHS.encounter2;
    else if (encounter === 3) pool = BATTLE_PARAGRAPHS.encounter3;
    else if (encounter >= 4) pool = BATTLE_PARAGRAPHS.boss;

    const text = pool[this.paragraphIdx % pool.length];
    this.setPassage(text);
    this.paragraphIdx++;
  }

  setPassage(text) {
    this.currentPassage = text.trim();
    this.currentIndex = 0;
    this.charStatuses = new Array(this.currentPassage.length).fill("untyped");
    this.typedHistory = new Array(this.currentPassage.length).fill("");
    this.currentWordStartIndex = 0;
    this.wordsTyped = 0;
  }

  reset(encounter = 1) {
    this.startTime = null;
    this.lastKeystrokeTime = null;
    this.totalKeystrokes = 0;
    this.correctKeystrokes = 0;
    this.errorCount = 0;
    this.currentCombo = 0;
    this.maxCombo = 0;
    this.paragraphIdx = 0;
    this.loadPassageForEncounter(encounter);
  }

  handleKeyDown(e) {
    if (e.ctrlKey || e.altKey || e.metaKey) return null;

    const key = e.key;

    // Backspace handling
    if (key === "Backspace") {
      if (this.currentIndex > 0) {
        this.currentIndex--;
        this.charStatuses[this.currentIndex] = "untyped";
        this.typedHistory[this.currentIndex] = "";
        return {
          type: "backspace",
          index: this.currentIndex,
          stats: this.getStats(),
        };
      }
      return null;
    }

    // Ignore modifier keys
    if (key.length !== 1) return null;

    const now = performance.now();
    if (!this.startTime) {
      this.startTime = now;
    }
    this.lastKeystrokeTime = now;
    this.totalKeystrokes++;

    const expectedChar = this.currentPassage[this.currentIndex];
    const isCorrect = key === expectedChar;

    this.typedHistory[this.currentIndex] = key;

    if (isCorrect) {
      this.charStatuses[this.currentIndex] = "correct";
      this.correctKeystrokes++;
      this.currentCombo++;
      if (this.currentCombo > this.maxCombo) {
        this.maxCombo = this.currentCombo;
      }

      const isSpace = expectedChar === " ";
      const isPunctuation = [".", ",", "!", "?", ";", ":", "-"].includes(expectedChar);

      let completedWord = null;
      if (isSpace || this.currentIndex === this.currentPassage.length - 1) {
        const wordEnd = isSpace ? this.currentIndex : this.currentIndex + 1;
        completedWord = this.currentPassage.slice(this.currentWordStartIndex, wordEnd).trim();
        this.currentWordStartIndex = this.currentIndex + 1;
        this.wordsTyped++;
        this.onWordComplete(completedWord, this.wordsTyped, this.getStats());
      }

      if (isPunctuation) {
        this.onPunctuation(expectedChar, this.getStats());
      }

      this.onCorrectChar(expectedChar, isSpace, completedWord, this.getStats());

      this.currentIndex++;

      // Check if paragraph is completed
      if (this.currentIndex >= this.currentPassage.length) {
        const stats = this.getStats();
        this.onParagraphComplete(stats);
        return {
          type: "paragraph_complete",
          isCorrect: true,
          stats,
        };
      }

      return {
        type: "correct",
        char: expectedChar,
        isSpace,
        stats: this.getStats(),
      };
    } else {
      this.charStatuses[this.currentIndex] = "incorrect";
      this.errorCount++;
      this.currentCombo = 0; // Combo breaks

      this.onErrorChar(key, expectedChar, this.getStats());

      this.currentIndex++; // Move forward so player is not stuck

      if (this.currentIndex >= this.currentPassage.length) {
        const stats = this.getStats();
        this.onParagraphComplete(stats);
        return {
          type: "paragraph_complete",
          isCorrect: false,
          stats,
        };
      }

      return {
        type: "error",
        typed: key,
        expected: expectedChar,
        stats: this.getStats(),
      };
    }
  }

  getStats() {
    const elapsedMinutes = this.startTime
      ? Math.max(0.001, (performance.now() - this.startTime) / 60000)
      : 0.001;

    const grossWpm = Math.round((this.totalKeystrokes / 5) / elapsedMinutes);
    const netWpm = Math.max(0, Math.round(((this.correctKeystrokes / 5) - (this.errorCount * 0.2)) / elapsedMinutes));

    const accuracy = this.totalKeystrokes > 0
      ? Math.round((this.correctKeystrokes / this.totalKeystrokes) * 100)
      : 100;

    let flowMultiplier = 1.0;
    if (this.currentCombo >= 35) flowMultiplier = 3.5;
    else if (this.currentCombo >= 20) flowMultiplier = 2.5;
    else if (this.currentCombo >= 10) flowMultiplier = 1.8;
    else if (this.currentCombo >= 4) flowMultiplier = 1.3;

    return {
      wpm: netWpm,
      grossWpm,
      accuracy,
      combo: this.currentCombo,
      maxCombo: this.maxCombo,
      flowMultiplier,
      totalKeystrokes: this.totalKeystrokes,
      correctKeystrokes: this.correctKeystrokes,
      errorCount: this.errorCount,
      progressPercent: Math.min(100, Math.round((this.currentIndex / Math.max(1, this.currentPassage.length)) * 100)),
      currentIndex: this.currentIndex,
      passageLength: this.currentPassage.length,
    };
  }
}
