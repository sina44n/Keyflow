/**
 * StickmanParagraphManager.js
 * Continuous battle paragraph and sentence typing engine for KEYFLOW Stickman Fight (2D).
 * Provides continuous combat narrative passages, real-time char-by-char telemetry,
 * cadence tracking, and triggers martial combat actions.
 */

export const BATTLE_PASSAGES = {
  // Wave 1: The Shadow Awakening
  wave1: [
    "The crimson warrior grips his tactical blade as shadowy stalkers emerge from the blood-red forest. With silent steps he advances across the cold flagstones, emerald energy swirling around his knuckles.",
    "A lone shadow slips between the twisted pines with drawn steel. The warrior channels his inner flame, glowing crystals rotating gently as he prepares to strike with lethal precision.",
    "Leaves crunch beneath dark boots as the first enemy dashes forward. With steady breath and measured cadence, the crimson fighter draws his weapon into a low combat guard.",
  ],

  // Wave 2: Twin Phantoms
  wave2: [
    "Two shadowed phantoms dart through the crimson mist with gleaming daggers. He sidesteps the first lunge, deflects the incoming steel with a ringing clash, and spins into an acrobatic counter.",
    "Shadows converge from both flanks, their dark blades whistling through the dusk. Emerald ribbons ignite in a radiant arc as the crimson warrior vaults into the air to unleash a swift double strike.",
    "The twin stalkers circle in synchronization, seeking a gap in his defense. The warrior accelerates his tempo, each strike flowing seamlessly into the next like water cutting through granite.",
  ],

  // Wave 3: Night Flurry
  wave3: [
    "Steel sings in the crimson darkness as shadow ninjas leap from ancient stone spires. The warrior executes a rapid flurry of strikes, his floating crystal shards cutting luminous emerald trails through the gloom.",
    "Three adversaries close the distance simultaneously. Breathing through the clash, the fighter parries high, sweeps low with a spinning roundhouse, and thrusts forward to shatter their formation.",
    "Dark energy crackles through the canopy as waves of shadow warriors press their assault. The crimson blade dances in blinding patterns, each decisive impact echoing across the blood-red valley.",
  ],

  // Wave 4: Iron Vanguard
  wave4: [
    "Heavy iron armor groans under the relentless impact of glowing energy strikes. The crimson warrior unleashes a tempest of rapid cuts, exploiting every opening as armored sentinels buckle under pressure.",
    "Elite shadow assassins weave between brutish vanguards, testing his reflexes at maximum speed. With unbroken cadence and piercing focus, the warrior deflects heavy blows and carves through their defenses.",
    "Sparks shower the cracked earth as jagged blades collide at breakneck speed. The warrior channels maximum spirit power, sending orbiting emerald shards piercing directly through fortified barriers.",
  ],

  // Wave 5: Infernal Commander Boss
  wave5: [
    "The infernal commander rises amidst smoke and burning embers, brandishing an obsidian greatsword that splits the earth. The crimson warrior channels his supreme flow, crystals spinning wildly in a roaring tempest of emerald light.",
    "Flames lick the battlefield as the colossal boss charges with earth-shattering force. The warrior dodges beneath the sweeping cleave, leaping skyward to drive his glowing blade into the core of darkness.",
    "Every sinew burns with fiery resolve as commander and crimson warrior trade thunderous blows. With relentless typing fury, the warrior prepares the final blade storm to banish the dark legion forever.",
  ],

  // Endless / Bonus Passages
  endless: [
    "Beyond the shattered ruins lies the heart of the eternal eclipse. The crimson champion steps through the storm, his blade alight with emerald fire as endless shadow legions gather on the horizon.",
    "Through rain of sparks and whistling steel, the solitary warrior marches forward. Master of rhythm and deadly grace, no shadow army can halt the inexorable advance of the crimson flame.",
    "The ancient runic spires resonate with pure spirit harmony. Orbiting crystal daggers sing in unison as the warrior weaves an impenetrable barrier of martial perfection.",
  ],
};

export class StickmanParagraphManager {
  constructor(options = {}) {
    this.onCorrectChar = options.onCorrectChar || (() => {});
    this.onErrorChar = options.onErrorChar || (() => {});
    this.onWordComplete = options.onWordComplete || (() => {});
    this.onParagraphComplete = options.onParagraphComplete || (() => {});
    this.onPunctuation = options.onPunctuation || (() => {});

    this.currentPassage = "";
    this.currentIndex = 0;
    this.charStatuses = []; // 'untyped' | 'correct' | 'incorrect'
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

    this.currentWave = 1;
    this.passageIndex = 0;

    this.loadPassageForWave(1);
  }

  loadPassageForWave(wave = 1) {
    this.currentWave = wave;
    let pool = BATTLE_PASSAGES.wave1;
    if (wave === 2) pool = BATTLE_PASSAGES.wave2;
    else if (wave === 3) pool = BATTLE_PASSAGES.wave3;
    else if (wave === 4) pool = BATTLE_PASSAGES.wave4;
    else if (wave === 5) pool = BATTLE_PASSAGES.wave5;
    else pool = BATTLE_PASSAGES.endless;

    const passageText = pool[this.passageIndex % pool.length];
    this.setPassage(passageText);
    this.passageIndex++;
  }

  setPassage(text) {
    this.currentPassage = text.trim();
    this.currentIndex = 0;
    this.charStatuses = new Array(this.currentPassage.length).fill("untyped");
    this.typedHistory = new Array(this.currentPassage.length).fill("");
    this.currentWordStartIndex = 0;
    this.wordsTyped = 0;
  }

  reset(wave = 1) {
    this.startTime = null;
    this.lastKeystrokeTime = null;
    this.totalKeystrokes = 0;
    this.correctKeystrokes = 0;
    this.errorCount = 0;
    this.currentCombo = 0;
    this.maxCombo = 0;
    this.passageIndex = 0;
    this.loadPassageForWave(wave);
  }

  handleKeyDown(e) {
    if (e.ctrlKey || e.altKey || e.metaKey) return null;

    const key = e.key;

    // Handle Backspace
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

    // Ignore non-printable keys
    if (key.length !== 1) {
      return null;
    }

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
      const isPunctuation = [".", ",", "!", "?", ";", ":", "-", '"', "'"].includes(expectedChar);

      let completedWord = null;
      if (isSpace || this.currentIndex === this.currentPassage.length - 1) {
        const wordEnd = isSpace ? this.currentIndex : this.currentIndex + 1;
        completedWord = this.currentPassage.slice(this.currentWordStartIndex, wordEnd);
        this.currentWordStartIndex = this.currentIndex + 1;
        this.wordsTyped++;
        this.onWordComplete(completedWord, this.wordsTyped, this.getStats());
      }

      if (isPunctuation) {
        this.onPunctuation(expectedChar, this.getStats());
      }

      this.onCorrectChar(expectedChar, isSpace, completedWord, this.getStats());

      this.currentIndex++;

      const isParagraphComplete = this.currentIndex >= this.currentPassage.length;
      if (isParagraphComplete) {
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
        isPunctuation,
        word: completedWord,
        stats: this.getStats(),
      };
    } else {
      this.charStatuses[this.currentIndex] = "incorrect";
      this.errorCount++;
      this.currentCombo = 0;

      this.onErrorChar(key, expectedChar, this.getStats());

      // Advance cursor anyway so player never gets rigidly blocked
      this.currentIndex++;

      const isParagraphComplete = this.currentIndex >= this.currentPassage.length;
      if (isParagraphComplete) {
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
    if (this.currentCombo >= 40) flowMultiplier = 4.0;
    else if (this.currentCombo >= 25) flowMultiplier = 3.0;
    else if (this.currentCombo >= 15) flowMultiplier = 2.2;
    else if (this.currentCombo >= 8) flowMultiplier = 1.6;
    else if (this.currentCombo >= 3) flowMultiplier = 1.2;

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

  getCurrentWord() {
    let start = this.currentIndex;
    while (start > 0 && this.currentPassage[start - 1] !== " ") {
      start--;
    }
    let end = this.currentIndex;
    while (end < this.currentPassage.length && this.currentPassage[end] !== " ") {
      end++;
    }
    return this.currentPassage.slice(start, end);
  }
}
