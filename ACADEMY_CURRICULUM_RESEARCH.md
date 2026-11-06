# KEYFLOW Touch-Typing Curriculum Research & Pedagogical Blueprint
**Document:** `ACADEMY_CURRICULUM_RESEARCH.md`  
**Project:** KEYFLOW Typing Education & Gaming Platform  
**Target:** 4,200 Mandatory Core Levels (7 Stages × 600 Levels) + 300 Specialization Levels (Stage 8 = 4,500 Total Levels)

---

## 1. Executive Summary & Research Scope

To construct a world-class typing curriculum for KEYFLOW, we conducted a rigorous comparative analysis of the world's leading typing education systems, open-source repositories, and historical typing tutors:

1. **TypingClub / edclub (Typing Jungle)** — Industry-standard K-12 curriculum (650+ lessons).
2. **KeyQuest (`ovurevu/keyquest`)** — Browser-based open-source typing tutor with progressive key unlocks and weak-key algorithms.
3. **Textype (`jonnieey/textype`)** — CLI/Python typing tutor featuring structured lessons, dynamic sentence generation, and developer code exercises.
4. **Open-Typer (`Open-Typer/Open-Typer`)** — Multi-platform open-source typing engine with granular lesson packs (touch, word, sentence, text).
5. **GNU Typist (`gtypist`)** — The authoritative GNU typing instruction system with `.typ` scripting, structured drill-tutorial-speed test flow.
6. **Typing.com** — Comprehensive 3-phase commercial curriculum (Learn the Keys, Intermediate, Advanced / Applied).

This research report documents teaching methodologies, exercise typologies, progression mechanics, mastery criteria, and licensing considerations, clearly distinguishing research findings from KEYFLOW's original curriculum architecture.

---

## 2. In-Depth System Evaluations

### 2.1 TypingClub / edclub (Typing Jungle)
* **Source:** Official documentation, teacher handbook, public curriculum maps.
* **Core Teaching Methodology:**
  * **Tactile Foundation:** Begins strictly at the F and J index bumps (`Home Row`). Fingers are anchored; wrists hover.
  * **Pairwise Introduction:** Keys are introduced in symmetric or functional pairs (F & J, D & K, S & L, A & ;, G & H).
  * **Vertical Expansion:** Top row taught before bottom row (R & U, E & I, W & O, Q & P, T & Y) because upward finger reaches are anatomically more natural than downward curls.
  * **Strict Prerequisite Discipline:** Beginner exercises never introduce letters that have not been explicitly taught.
  * **Gamification & Multi-Star Mastery:** 5-star scoring model based on weighted accuracy and WPM thresholds.
* **Useful Curriculum Concepts for KEYFLOW:**
  * Milestone checkpoints every 10–20 lessons.
  * Explicit finger-return mechanics (always return to home row after every upward or downward stroke).
  * Opposite-hand Shift key discipline (never press Shift with the same hand that presses the letter key).
* **Licensing & Reuse:** Proprietary commercial content. **No copyrighted text, videos, or lesson assets were copied.** Only pedagogical sequencing principles are adopted.

### 2.2 KeyQuest (`ovurevu/keyquest`)
* **Source:** Open-source repository (`js/data/lessons.js`, `js/engine.js`, `js/keyboard.js`).
* **License:** MIT License.
* **Core Teaching Methodology:**
  * Modular `RAW_LESSONS` architecture with defined `keysIntroduced`, `targetAccuracy`, and `minWpm`.
  * Alternating-hand patterns (e.g. left-right-left-right key sequences) to prevent cognitive overload and promote balanced motor development.
  * Weak-key detection and targeted remediation loops.
* **Useful Concepts for KEYFLOW:**
  * Clean programmatic verification of keystroke validity against allowed key sets.
  * Real-time finger guidance highlighting on virtual keyboard.
* **Ideas Deliberately Excluded:** KeyQuest's lesson set is relatively small (under 100 lessons) and designed primarily for early elementary users. KEYFLOW requires adult-grade depth across 4,200+ levels.

### 2.3 Textype (`jonnieey/textype`)
* **Source:** Open-source Python repository (`textype`).
* **License:** MIT License.
* **Core Teaching Methodology:**
  * Structured drills followed by natural word and sentence practice.
  * Dedicated developer mode for programming syntax, brackets, and code snippets.
  * Accurate real-time typing telemetry (gross WPM, net WPM, raw accuracy, error categorization).
* **Useful Concepts for KEYFLOW:**
  * Inclusion of real programming constructs (HTML/CSS, JavaScript, Python, SQL) in advanced stages (Stage 6 & Stage 8).
  * Separation of keystroke accuracy from word-completion cadence.

### 2.4 Open-Typer (`Open-Typer/Open-Typer`)
* **Source:** Open-source C++/Qt repository.
* **License:** GNU GPL v3.
* **Core Teaching Methodology:**
  * Categorization of exercises into four distinct tiers:
    1. *Touch drills:* isolated character repetition and alternating hand pairs.
    2. *Word drills:* natural dictionary words restricted to learned keys.
    3. *Sentence drills:* grammatically correct sentences reinforcing punctuation.
    4. *Text passages:* multi-sentence coherent paragraphs.
* **Useful Concepts for KEYFLOW:**
  * Explicit exercise categorization (`drill`, `words`, `sentences`, `paragraph`, `assessment`) attached to each lesson's metadata.

### 2.5 GNU Typist (`gtypist`)
* **Source:** GNU Project official documentation and `.typ` course scripts (`q.typ`, `r.typ`, `t.typ`).
* **License:** GNU GPL v3+.
* **Core Teaching Methodology:**
  * The classic 3-step instructional cycle:
    1. `T:` Tutorial / visual instructions explaining key positioning and ergonomics.
    2. `D:` Repetitive interactive drill targeting specific muscle groups.
    3. `G:` Speed test or comprehensive passage with strict error thresholds.
  * Review drills (`r.typ`) placed at regular intervals to combat skill decay.
* **Useful Concepts for KEYFLOW:**
  * Inclusion of clear learning guidance, objectives, and ergonomics instructions on every lesson card.
  * Periodic cumulative review assessments concluding every single unit (every 20th lesson).

### 2.6 Typing.com
* **Source:** Official curriculum documentation.
* **Core Teaching Methodology:**
  * Three-tiered macro structure:
    * *Phase 1 (Learn the Keys):* Home row, top row, bottom row, basic symbols.
    * *Phase 2 (Intermediate Fluency):* Common words, morphemes, basic punctuation, rhythm.
    * *Phase 3 (Advanced & Applied):* Number row, complex symbols, business documents, real-world communication.
* **Useful Concepts for KEYFLOW:**
  * Direct application to real-world tasks (emails, business letters, technical documents, academic summaries).

---

## 3. Comparison Matrix of Typing Curricula

| System | Scale (Lessons) | Content Generation | Prerequisite Discipline | Opposite Shift Rule | Programming / Code | License |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TypingClub** | ~650 | Static hand-authored | Strict | Enforced | Basic HTML/JS | Proprietary |
| **KeyQuest** | ~80 | Static + dictionary | Moderate | Implicit | None | MIT |
| **Textype** | ~40 | Dynamic generator | Moderate | Optional | Yes (Python/JS) | MIT |
| **Open-Typer**| ~150 | Pack-based static | Strict | Optional | Optional | GPL v3 |
| **GNU Typist**| ~200 | Scripted `.typ` | Strict | Enforced | None | GPL v3+ |
| **Typing.com** | ~500 | Static hand-authored | Strict | Enforced | Yes | Proprietary |
| **KEYFLOW (Our Design)** | **4,500 (4,200 Core + 300 Specialization)** | **Hybrid (Pedagogical Hand-Crafted + Validated Word Decks)** | **Absolute & Strict** | **Strictly Enforced** | **Extensive (Stage 6 & 8)** | **Proprietary Original** |

---

## 4. KEYFLOW Original Curriculum Architecture (4,200 Mandatory Core + 300 Specialization)

### 4.1 Master Stage Allocation

| Stage | Identifier | Stage Title | Levels | Units | Pedagogical Focus | Target WPM | Target Acc |
| :---: | :---: | :--- | :---: | :---: | :--- | :---: | :---: |
| **1** | `S1` | **Home Row Foundations** | 600 | 30 | F & J tactile anchors, ASDF JKL;, G & H, home-row words | 15–25 | 92–95% |
| **2** | `S2` | **Complete Keyboard Control (Top & Bottom Rows)** | 600 | 30 | Upward reaches (RU EI WO QP TY), downward curls (VM C, X. Z/ BN), full alphabet | 25–35 | 93–96% |
| **3** | `S3` | **Word Building & Typing Fluency** | 600 | 30 | Digrams, trigrams, prefixes, suffixes, root words, alternating-hand rhythm | 35–45 | 94–96% |
| **4** | `S4` | **Numbers, Symbols & Shift Mastery** | 600 | 30 | Opposite-hand Shift, Capitalization, Number Row 1–0, Punctuation & Brackets | 40–50 | 95–97% |
| **5** | `S5` | **Sentence Rhythm & Composition** | 600 | 30 | Compound/complex sentences, dialogue, paragraphs, metronome cadence | 45–60 | 95–98% |
| **6** | `S6` | **Real-World & Professional Typing** | 600 | 30 | Business correspondence, formal reports, data formats, developer syntax | 50–65 | 96–98% |
| **7** | `S7` | **Precision, Speed & Grandmaster Mastery** | 600 | 30 | Velocity sprints, endurance tests (1–5 min), literary prose, Grandmaster Capstone | 65–85+ | 97–99% |
| **8** | `S8` | **Advanced Specializations (Bonus Mastery)** | 300 | 15 | Software engineering syntax, numerical data entry, legal/medical, competitive sprints | 75–100+ | 98–99% |
| **Total** | | **Comprehensive Touch-Typing Academy** | **4,500** | **225** | **Zero empty filler, strictly validated, pedagogically authentic touch-typing** | | |

---

## 5. Pedagogical Content Generation Rules

1. **Zero Untaught Keys in Beginner Lessons:**
   - In Stage 1, Unit 1 (Lessons 1–20), only keys `f`, `j`, `d`, `k`, `s`, `l`, `a`, `;`, and `space` are introduced progressively. Letters from the top row (`e`, `t`, `o`) or bottom row (`c`, `m`) **NEVER** appear in Stage 1!
2. **Gradual Cumulative Expansion:**
   - Each new key is introduced with:
     1. Key identification & finger placement instruction.
     2. Single-letter and double-letter tactile drills (`f j fj jf ff jj`).
     3. Syllable and coordination drills.
     4. Real English words formed *exclusively* from already-introduced keys.
3. **No Character Spam:**
   - Long repetitive blocks like `aaaaaaaaaaaaaaaa` or `fjfjfjfjfjfjfjfjfj` are prohibited. Keystroke blocks follow natural linguistic and rhythmic phrasing.
4. **Natural Linguistic Progression:**
   - Real words are introduced the moment their component letters are unlocked.
   - Stage 1 Home Row unlocks 40+ authentic English words (`a, as, ask, dad, sad, lad, fad, glad, glass, half, had, has, hall, fall, falls, flash, flask, salads, shall, flag, flags...`).
5. **Opposite-Hand Shift Enforcement:**
   - In Stage 4, lessons explicitly train and test opposite-hand Shift execution:
     - Right Shift used when typing left-hand capitals (`A, S, D, F, G, Q, W, E, R, T, Z, X, C, V, B`).
     - Left Shift used when typing right-hand capitals (`H, J, K, L, :, Y, U, I, O, P, N, M, <, >`).
6. **Mastery Thresholds:**
   - Star 1: Minimum baseline passing (Target WPM × 0.8, Target Accuracy - 5%).
   - Star 2: Target WPM and Target Accuracy achieved.
   - Star 3: Target WPM + 5, Accuracy ≥ 96%.
   - Star 4: Target WPM + 10, Accuracy ≥ 98%.
   - Star 5: Flawless execution (Accuracy 100% or WPM + 15).

---

## 6. Ideas Deliberately Excluded

1. **Randomized Gibberish Generators:**
   - Generating random strings of letters (`kdjf lsak jfls kdja`) for hundreds of lessons disengages learners and destroys word-level motor chunking.
2. **Artificial WPM Inflation:**
   - Permitting fast typing with 75% accuracy is strictly rejected. Motor errors practiced repeatedly become permanent bad habits. Accuracy is non-negotiable.
3. **Monolithic Lesson Files:**
   - Putting 4,200 lessons in a single file causes memory bloat and unmaintainable code. Instead, modular stage data files (`stage1Data.js` through `stage8Data.js`) are coordinated via a central `curriculumEngine.js`.

