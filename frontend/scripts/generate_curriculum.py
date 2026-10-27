"""
Master Generator for KEYFLOW 600-Level Academy Curriculum
Compiles all 30 units across 7 stages into:
- frontend/src/data/curriculum600Data.js
- frontend/scripts/buildCurriculum600.js
"""
import json
import math
import os
import re
import sys

from units.stage1 import STAGE_1_UNITS
from units.stage2 import STAGE_2_UNITS
from units.stage3 import STAGE_3_UNITS
from units.stage4 import STAGE_4_UNITS
from units.stage5 import STAGE_5_UNITS
from units.stage6 import STAGE_6_UNITS
from units.stage7 import STAGE_7_UNITS

FINGER_MAP = {
    '`': 'left-pinky', '~': 'left-pinky', '1': 'left-pinky', '!': 'left-pinky',
    'q': 'left-pinky', 'Q': 'left-pinky', 'a': 'left-pinky', 'A': 'left-pinky',
    'z': 'left-pinky', 'Z': 'left-pinky',
    '2': 'left-ring', '@': 'left-ring', 'w': 'left-ring', 'W': 'left-ring',
    's': 'left-ring', 'S': 'left-ring', 'x': 'left-ring', 'X': 'left-ring',
    '3': 'left-middle', '#': 'left-middle', 'e': 'left-middle', 'E': 'left-middle',
    'd': 'left-middle', 'D': 'left-middle', 'c': 'left-middle', 'C': 'left-middle',
    '4': 'left-index', '$': 'left-index', '5': 'left-index', '%': 'left-index',
    'r': 'left-index', 'R': 'left-index', 't': 'left-index', 'T': 'left-index',
    'f': 'left-index', 'F': 'left-index', 'g': 'left-index', 'G': 'left-index',
    'v': 'left-index', 'V': 'left-index', 'b': 'left-index', 'B': 'left-index',
    ' ': 'thumb',
    '6': 'right-index', '^': 'right-index', '7': 'right-index', '&': 'right-index',
    'y': 'right-index', 'Y': 'right-index', 'u': 'right-index', 'U': 'right-index',
    'h': 'right-index', 'H': 'right-index', 'j': 'right-index', 'J': 'right-index',
    'n': 'right-index', 'N': 'right-index', 'm': 'right-index', 'M': 'right-index',
    '8': 'right-middle', '*': 'right-middle', 'i': 'right-middle', 'I': 'right-middle',
    'k': 'right-middle', 'K': 'right-middle', ',': 'right-middle', '<': 'right-middle',
    '9': 'right-ring', '(': 'right-ring', 'o': 'right-ring', 'O': 'right-ring',
    'l': 'right-ring', 'L': 'right-ring', '.': 'right-ring', '>': 'right-ring',
    '0': 'right-pinky', ')': 'right-pinky', '-': 'right-pinky', '_': 'right-pinky',
    '=': 'right-pinky', '+': 'right-pinky', 'p': 'right-pinky', 'P': 'right-pinky',
    '[': 'right-pinky', '{': 'right-pinky', ']': 'right-pinky', '}': 'right-pinky',
    '\\': 'right-pinky', '|': 'right-pinky', ';': 'right-pinky', ':': 'right-pinky',
    "'": 'right-pinky', '"': 'right-pinky', '/': 'right-pinky', '?': 'right-pinky',
}

STAGE_META = [
    {
        'stageId': 1,
        'title': 'Home Row Foundations',
        'subtitle': 'Tactile anchor keys, muscle relaxation, and index-bump indexing',
        'objective': 'Establish correct home-row anchors without looking at the keyboard. Focus on index rests on F and J bumps.',
        'badge': 'Foundation',
        'targetWpm': 22,
        'targetAccuracy': 92,
        'startLevel': 1,
        'endLevel': 100,
        'totalLessons': 100,
        'color': 'emerald',
        'targetKeys': ['A', 'S', 'D', 'F', 'J', 'K', 'L', ';', 'Space'],
        'homeKeys': ['F', 'J'],
    },
    {
        'stageId': 2,
        'title': 'Top Row Control',
        'subtitle': 'Upward diagonal reaches and returning to home-row rest',
        'objective': 'Train fingers to stretch upward into the top row cleanly and recover home-row posture without hesitation.',
        'badge': 'Top Row',
        'targetWpm': 30,
        'targetAccuracy': 93,
        'startLevel': 101,
        'endLevel': 180,
        'totalLessons': 80,
        'color': 'blue',
        'targetKeys': ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        'homeKeys': ['F', 'J'],
    },
    {
        'stageId': 3,
        'title': 'Bottom Row Control',
        'subtitle': 'Downward curl mechanics, wrist alignment, and pinky stabilization',
        'objective': 'Conquer the downward finger curl motion across the entire bottom row with balanced speed and posture.',
        'badge': 'Bottom Row',
        'targetWpm': 36,
        'targetAccuracy': 93,
        'startLevel': 181,
        'endLevel': 260,
        'totalLessons': 80,
        'color': 'violet',
        'targetKeys': ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.'],
        'homeKeys': ['F', 'J'],
    },
    {
        'stageId': 4,
        'title': 'Common Letter Combinations & Morphemes',
        'subtitle': 'High-frequency English digrams, trigrams, and syllable morphemes',
        'objective': 'Condition motor memory to fire frequent character sequences (th, ing, tion, ment) as single fluid neurological strokes.',
        'badge': 'Morphemes',
        'targetWpm': 44,
        'targetAccuracy': 94,
        'startLevel': 261,
        'endLevel': 340,
        'totalLessons': 80,
        'color': 'amber',
        'targetKeys': ['th', 'he', 'in', 'er', 'an', 'tion', 'ment', 'ness'],
        'homeKeys': ['F', 'J'],
    },
    {
        'stageId': 5,
        'title': 'Word Flow & Cadence',
        'subtitle': 'Continuous vocabulary rhythm and smooth multi-word transitions',
        'objective': 'Eliminate pause delays between words and establish a steady, uninterrupted metronome cadence.',
        'badge': 'Fluency',
        'targetWpm': 52,
        'targetAccuracy': 95,
        'startLevel': 341,
        'endLevel': 420,
        'totalLessons': 80,
        'color': 'cyan',
        'targetKeys': ['Full Alphabet', 'Continuous Flow', 'Space Cadence'],
        'homeKeys': ['F', 'J'],
    },
    {
        'stageId': 6,
        'title': 'Sentence Rhythm & Shift Discipline',
        'subtitle': 'Opposite-hand Shift keys, punctuation, quotes, and capitalization',
        'objective': 'Master two-handed Shift coordination: never press Shift and a letter key using the same hand.',
        'badge': 'Punctuation',
        'targetWpm': 58,
        'targetAccuracy': 95,
        'startLevel': 421,
        'endLevel': 500,
        'totalLessons': 80,
        'color': 'rose',
        'targetKeys': ['Shift', '.', '?', '!', ',', ';', ':', "'", '"'],
        'homeKeys': ['F', 'J'],
    },
    {
        'stageId': 7,
        'title': 'Precision, Speed Endurance & Capstone Mastery',
        'subtitle': 'Comprehensive velocity tests, numbers, code symbols, and grandmaster capstone',
        'objective': 'Achieve complete neuromuscular flow: sustain 65+ WPM with 96%+ precision across challenging prose, code, and endurance passages.',
        'badge': 'Mastery Tier',
        'targetWpm': 68,
        'targetAccuracy': 96,
        'startLevel': 501,
        'endLevel': 600,
        'totalLessons': 100,
        'color': 'orange',
        'targetKeys': ['Mixed Keys', 'Numbers', 'Symbols', 'Endurance', 'Code'],
        'homeKeys': ['F', 'J'],
    },
]

UNIT_DEFINITIONS = [
    # Stage 1: Units 1-5 (Levels 1-100)
    {'unitNumber': 1, 'stageId': 1, 'startLesson': 1, 'endLesson': 20, 'label': 'Home Row Anchor Foundations'},
    {'unitNumber': 2, 'stageId': 1, 'startLesson': 21, 'endLesson': 40, 'label': 'Home Row Finger Independence'},
    {'unitNumber': 3, 'stageId': 1, 'startLesson': 41, 'endLesson': 60, 'label': 'Home Row Short Words & Spatial Recovery'},
    {'unitNumber': 4, 'stageId': 1, 'startLesson': 61, 'endLesson': 80, 'label': 'Home Row Rhythm & Bilateral Phrasing'},
    {'unitNumber': 5, 'stageId': 1, 'startLesson': 81, 'endLesson': 100, 'label': 'Stage 1 Foundation Benchmark & Capstone'},

    # Stage 2: Units 6-9 (Levels 101-180)
    {'unitNumber': 6, 'stageId': 2, 'startLesson': 101, 'endLesson': 120, 'label': 'Top Row Inward Reaches (E, R, T, U, I, O)'},
    {'unitNumber': 7, 'stageId': 2, 'startLesson': 121, 'endLesson': 140, 'label': 'Top Row Outward Reaches & Morphemes (Q, W, P, Y)'},
    {'unitNumber': 8, 'stageId': 2, 'startLesson': 141, 'endLesson': 160, 'label': 'Top-to-Home Row Transitions & Cadence'},
    {'unitNumber': 9, 'stageId': 2, 'startLesson': 161, 'endLesson': 180, 'label': 'Stage 2 Top Row Benchmark & Assessment'},

    # Stage 3: Units 10-13 (Levels 181-260)
    {'unitNumber': 10, 'stageId': 3, 'startLesson': 181, 'endLesson': 200, 'label': 'Bottom Row Inward Reaches (C, V, B, N, M)'},
    {'unitNumber': 11, 'stageId': 3, 'startLesson': 201, 'endLesson': 220, 'label': 'Bottom Row Outward Reaches (Z, X)'},
    {'unitNumber': 12, 'stageId': 3, 'startLesson': 221, 'endLesson': 240, 'label': 'Three-Row Vertical Transitions & Hand Posture'},
    {'unitNumber': 13, 'stageId': 3, 'startLesson': 241, 'endLesson': 260, 'label': 'Stage 3 Bottom Row Benchmark & Assessment'},

    # Stage 4: Units 14-17 (Levels 261-340)
    {'unitNumber': 14, 'stageId': 4, 'startLesson': 261, 'endLesson': 280, 'label': 'High-Frequency Digrams (th, er, on, an, re, in, he)'},
    {'unitNumber': 15, 'stageId': 4, 'startLesson': 281, 'endLesson': 300, 'label': 'Common Trigrams & Word Fragments (the, ing, and, ion, ent)'},
    {'unitNumber': 16, 'stageId': 4, 'startLesson': 301, 'endLesson': 320, 'label': 'Multi-Syllabic Morphemes (-tion, -ment, -ness, inter-)'},
    {'unitNumber': 17, 'stageId': 4, 'startLesson': 321, 'endLesson': 340, 'label': 'Stage 4 Morpheme Fluency Benchmark & Assessment'},

    # Stage 5: Units 18-21 (Levels 341-420)
    {'unitNumber': 18, 'stageId': 5, 'startLesson': 341, 'endLesson': 360, 'label': 'Common Vocabulary Cadence & Spacebar Rhythm'},
    {'unitNumber': 19, 'stageId': 5, 'startLesson': 361, 'endLesson': 380, 'label': 'Varied Word Lengths & Bilateral Transitions'},
    {'unitNumber': 20, 'stageId': 5, 'startLesson': 381, 'endLesson': 400, 'label': 'Natural English Prose & Full Sentence Flow'},
    {'unitNumber': 21, 'stageId': 5, 'startLesson': 401, 'endLesson': 420, 'label': 'Stage 5 Word Cadence Benchmark & Assessment'},

    # Stage 6: Units 22-25 (Levels 421-500)
    {'unitNumber': 22, 'stageId': 6, 'startLesson': 421, 'endLesson': 440, 'label': 'Opposite-Hand Shift Mechanics & Capitalization'},
    {'unitNumber': 23, 'stageId': 6, 'startLesson': 441, 'endLesson': 460, 'label': 'Standard Punctuation & Contractions (., \', ?, !, ;)'},
    {'unitNumber': 24, 'stageId': 6, 'startLesson': 461, 'endLesson': 480, 'label': 'Complex Dialogue, Quotes & Parentheticals'},
    {'unitNumber': 25, 'stageId': 6, 'startLesson': 481, 'endLesson': 500, 'label': 'Stage 6 Sentence Rhythm Benchmark & Assessment'},

    # Stage 7: Units 26-30 (Levels 501-600)
    {'unitNumber': 26, 'stageId': 7, 'startLesson': 501, 'endLesson': 520, 'label': 'Number Row Reaches & Numeric Sequences (1 to 0)'},
    {'unitNumber': 27, 'stageId': 7, 'startLesson': 521, 'endLesson': 540, 'label': 'Alphanumeric Formats, Technical Code & Syntax'},
    {'unitNumber': 28, 'stageId': 7, 'startLesson': 541, 'endLesson': 560, 'label': 'High-Velocity Speed Bursts & Weak-Finger Remediation'},
    {'unitNumber': 29, 'stageId': 7, 'startLesson': 561, 'endLesson': 580, 'label': 'Extended Literary Transcription & Zero-Error Sprints'},
    {'unitNumber': 30, 'stageId': 7, 'startLesson': 581, 'endLesson': 600, 'label': 'Grandmaster Capstone Mastery & Level 600 Final Graduation'},
]

ALL_UNITS_DATA = (
    STAGE_1_UNITS +
    STAGE_2_UNITS +
    STAGE_3_UNITS +
    STAGE_4_UNITS +
    STAGE_5_UNITS +
    STAGE_6_UNITS +
    STAGE_7_UNITS
)

def get_difficulty(lvl):
    if lvl <= 100: return 'beginner'
    if lvl <= 260: return 'beginner-intermediate'
    if lvl <= 420: return 'intermediate'
    if lvl <= 500: return 'upper-intermediate'
    if lvl <= 560: return 'advanced'
    return 'expert'

def get_guidance(stage_id, unit_num, lvl_in_unit):
    if stage_id == 1:
        return "Keep wrists elevated, hovering lightly above the desk. Return index fingers immediately to the tactile F and J bumps."
    elif stage_id == 2:
        return "Extend fingers upward diagonally without lifting or twisting wrists. Tap top keys lightly and spring back to home row."
    elif stage_id == 3:
        return "Curl fingers downward from middle knuckles to strike bottom keys. Maintain neutral wrist angle and keep palms steady."
    elif stage_id == 4:
        return "Fire common letter combinations (th, ing, tion, ment) as single fluid neurological strokes rather than isolated letters."
    elif stage_id == 5:
        return "Maintain an unhurried, steady metronome cadence. Give the spacebar the exact same temporal duration as regular letters."
    elif stage_id == 6:
        return "Master two-handed Shift discipline: hold Shift with the opposite hand while the target hand strikes the capital key."
    else:
        return "Maintain relaxed shoulders, neutral wrist alignment, and light tactile pressure while sustaining high velocity."

def build_all_lessons():
    lessons = []
    seen_ids = set()
    seen_exercises = set()
    errors = []

    current_lvl = 1

    for u_idx, unit_exercises in enumerate(ALL_UNITS_DATA):
        unit_def = UNIT_DEFINITIONS[u_idx]
        unit_num = unit_def['unitNumber']
        stage_id = unit_def['stageId']
        stage_meta = STAGE_META[stage_id - 1]
        unit_label = unit_def['label']

        if len(unit_exercises) != 20:
            errors.append(f"Unit {unit_num} has {len(unit_exercises)} exercises (expected exactly 20)")

        for l_in_unit, item in enumerate(unit_exercises, 1):
            lvl = current_lvl
            lesson_id = f"level-{str(lvl).zfill(3)}"

            title = item.get("title", f"{unit_label} — Part {l_in_unit}")
            objective = item.get("objective", f"Master touch typing skills for Level {lvl} in {unit_label}.")
            exercise_text = item.get("text", "").strip()

            is_assessment = (l_in_unit == 20)
            is_milestone = (lvl % 50 == 0 or lvl == 600)

            # Special requirements for Level 600
            if lvl == 600:
                is_assessment = True
                is_milestone = True

            difficulty = get_difficulty(lvl)
            progress_factor = lvl / 600.0

            # Target WPM: smoothly from 18 to 72
            target_wpm = round(18 + 54 * (progress_factor ** 0.85))
            # Target Accuracy: smoothly from 90 to 98
            target_accuracy = min(98, round(90 + 8 * progress_factor))

            estimated_seconds = max(25, round((len(exercise_text) / (target_wpm * 5)) * 60 * 1.15))
            guidance = get_guidance(stage_id, unit_num, l_in_unit)

            # Validation checks
            if lesson_id in seen_ids:
                errors.append(f"Duplicate lesson ID: {lesson_id}")
            seen_ids.add(lesson_id)

            norm_text = re.sub(r'\s+', ' ', exercise_text.lower())
            if norm_text in seen_exercises:
                errors.append(f"Duplicate exercise text at Level {lvl}: '{exercise_text[:40]}...'")
            seen_exercises.add(norm_text)

            # Check character mapping
            for ch in exercise_text:
                if ch not in FINGER_MAP and ch.lower() not in FINGER_MAP:
                    errors.append(f"Unmapped character '{ch}' at Level {lvl}")

            # Check spam
            spam_match = re.search(r'([a-zA-Z0-9;.,])\1{4,}', exercise_text)
            if spam_match:
                errors.append(f"Spam detected at Level {lvl}: '{spam_match.group(0)}'")

            lessons.append({
                "levelNumber": lvl,
                "id": lesson_id,
                "stageId": stage_id,
                "stageTitle": stage_meta['title'],
                "unitNumber": unit_num,
                "unitLabel": unit_label,
                "lessonInUnit": l_in_unit,
                "title": title,
                "objective": objective,
                "skills": [f"Unit {unit_num}: {unit_label}", f"Level {lvl} Fluency"],
                "targetKeys": stage_meta['targetKeys'] if isinstance(stage_meta['targetKeys'], list) else [stage_meta['targetKeys']],
                "homeKeys": ['F', 'J'],
                "prerequisiteLevel": lvl - 1 if lvl > 1 else None,
                "exerciseText": exercise_text,
                "difficulty": difficulty,
                "targetWpm": target_wpm,
                "targetAccuracy": target_accuracy,
                "estimatedSeconds": estimated_seconds,
                "isAssessment": is_assessment,
                "isMilestone": is_milestone,
                "guidance": guidance,
                "fingerMap": FINGER_MAP,
            })

            current_lvl += 1

    if current_lvl != 601:
        errors.append(f"Total levels compiled: {current_lvl - 1} (expected exactly 600)")

    return lessons, errors

print("Compiling complete 600-level curriculum...")
all_lessons, errors = build_all_lessons()

if errors:
    print(f"FAILED with {len(errors)} errors:")
    for err in errors:
        print(f"  - {err}")
    sys.exit(1)

print(f"SUCCESS! All {len(all_lessons)} lessons validated.")
print(f"  Stage 1 (Levels 1-100): 100 lessons")
print(f"  Stage 2 (Levels 101-180): 80 lessons")
print(f"  Stage 3 (Levels 181-260): 80 lessons")
print(f"  Stage 4 (Levels 261-340): 80 lessons")
print(f"  Stage 5 (Levels 341-420): 80 lessons")
print(f"  Stage 6 (Levels 421-500): 80 lessons")
print(f"  Stage 7 (Levels 501-600): 100 lessons")

# Write to frontend/src/data/curriculum600Data.js
data_out_path = os.path.join(os.path.dirname(__file__), "../src/data/curriculum600Data.js")
js_content = f"""/**
 * KEYFLOW Academy — Complete 600-Level Curriculum Dataset
 * ========================================================
 * Auto-generated, deterministic, version-controlled touch-typing curriculum.
 * 7 Stages, 30 Units, 600 Contiguous Levels.
 * Zero repetitive character filler; authentic educational touch-typing pedagogy.
 */

export const CURRICULUM_600_LESSONS = {json.dumps(all_lessons, indent=2)};
"""

with open(data_out_path, "w", encoding="utf-8") as f:
    f.write(js_content)

file_size_kb = os.path.getsize(data_out_path) / 1024
print(f"Successfully wrote {data_out_path} ({file_size_kb:.1f} KB)")
