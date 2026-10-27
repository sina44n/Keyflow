"""
Stage 7 Generator: Precision & Grandmaster (600 Levels)
Keys: Full keyboard: Letters, Numbers (1-0), Symbols, Programming Syntax, High-Velocity Prose.
Allowed characters: Standard ANSI printable keyboard characters.
Progressive lengths from 45 chars (L1) to 900+ chars (L600).
Target metrics: 60 to 72+ WPM, 96% to 98% accuracy.
"""
import itertools
from .curriculum_builder import build_lesson, FINGER_MAP

STAGE_ID = 7
STAGE_TITLE = "Precision & Grandmaster"
HOME_KEYS = ["F", "J"]
STAGE_KEYS = ["Numbers", "Code Symbols", "High Velocity", "Grandmaster Capstone"]

SUBJECTS = [
    "In 1969, Apollo 11 spacecraft",
    "The Hubble Space Telescope",
    "Modern 64-bit microprocessors",
    "Quantum computing processors",
    "The transatlantic fiber optic cable",
    "The International Space Station",
    "The human genome project in 2003",
    "Voyager 1 deep space probe",
    "The James Webb Space Telescope",
    "The Linux operating system kernel",
    "The JavaScript V8 runtime engine",
    "A distributed PostgreSQL database cluster",
    "The TCP/IP networking protocol stack",
    "Modern WebGL Three.js skeletal hand rigs",
    "The standard 104-key ANSI keyboard layout",
    "An optimized binary search algorithm",
    "The Fibonacci sequence in mathematics",
    "Euler famous identity from 1748",
    "The speed of light in vacuum (c = 3.0 * 10^8 m/s)",
    "Grandmaster touch-typists at 72 WPM"
]

ACTIONS = [
    "executes over 3.8 billion instructions per second with 16 processing cores.",
    "transmits 160 terabits of data per second across 6,600 kilometers of deep sea cable.",
    "orbits Earth at an altitude of 408 kilometers with a velocity of 27,600 km/h.",
    "maps 3.2 billion base pairs of DNA with 99.99% sequence accuracy.",
    "operates at Lagrange point L2 approximately 1.5 million kilometers from Earth.",
    "processes information using 127 quantum qubits in coherent superposition.",
    "travels through interstellar space at a distance of 24 billion kilometers.",
    "manages over 10,000 concurrent database connections with sub-millisecond latency.",
    "calibrates 15 distinct finger contact coordinates across all 5 keyboard rows.",
    "achieves O(log n) search complexity over arrays with 1,000,000 sorted elements.",
    "computes values up to F(30) = 832,040 with recursive memoization in 2 milliseconds.",
    "connects e^(i * pi) + 1 = 0 relating the 5 fundamental mathematical constants.",
    "traverses 384,400 kilometers to land astronauts safely on the lunar surface.",
    "requires sustaining 360+ clean keystrokes per minute with 98%+ precision.",
    "compiles dynamic code into optimized machine instructions in 15 milliseconds.",
    "routes encrypted packets across 195 nations with zero packet degradation.",
    "renders 60 frames per second using high-performance WebGL hardware acceleration.",
    "maintains strict opposite-hand Shift discipline across 100% of capital letters.",
    "demonstrates that excellence is not an act, but a habit of disciplined practice.",
    "captures high-resolution deep field imagery across 13 billion light years."
]

BASE_CLAUSES = [f"{s} {a}" for s in SUBJECTS for a in ACTIONS]

UNIT_THEMES = [
    ("Left-Hand Number Reaches (1 to 5)", ["1", "2", "3", "4", "5"], ["left-number-row", "reach-accuracy"]),
    ("Right-Hand Number Reaches (6 to 0)", ["6", "7", "8", "9", "0"], ["right-number-row", "reach-accuracy"]),
    ("Alphanumeric Sequences & Dates", ["Alphanumeric", "Dates"], ["alphanumeric-flow", "number-letter-shift"]),
    ("Code Delimiters & Brackets", ["(", ")", "[", "]", "{", "}"], ["bracket-pairing", "code-delimiters"]),
    ("Programming Operators & Symbols", ["=", "+", "-", "*", "/", "<", ">", "&", "|"], ["programming-operators", "symbol-precision"]),
    ("JavaScript & Python Syntax Constructs", ["Syntax", "Constructs"], ["language-syntax", "code-cadence"]),
    ("HTML & CSS Markup Tags and Properties", ["<", ">", "/", ":", ";"], ["markup-tags", "css-properties"]),
    ("SQL Queries & Database Statements", ["SELECT", "FROM", "WHERE"], ["sql-keywords", "relational-syntax"]),
    ("Mathematical & Scientific Formulas", ["^", "*", "/", "+", "="], ["math-formulas", "scientific-notation"]),
    ("Terminal CLI Commands & File Paths", ["/", "-", "~", "$"], ["cli-commands", "file-paths"]),
    ("High-Velocity Bursts: 62 WPM Threshold", ["Velocity 62+"], ["velocity-bursts", "speed-threshold"]),
    ("High-Velocity Bursts: 65 WPM Threshold", ["Velocity 65+"], ["velocity-bursts", "speed-threshold"]),
    ("High-Velocity Bursts: 68 WPM Threshold", ["Velocity 68+"], ["velocity-bursts", "speed-threshold"]),
    ("High-Velocity Bursts: 70 WPM Threshold", ["Velocity 70+"], ["velocity-bursts", "speed-threshold"]),
    ("Clean Architecture Code Transcriptions", ["Clean Code"], ["clean-architecture", "software-prose"]),
    ("Classical Literature Transcriptions Alpha", ["Literature"], ["classic-literature", "extended-prose"]),
    ("Technical Documentation Transcriptions", ["Documentation"], ["tech-docs", "api-documentation"]),
    ("Dual-Hand Number & Symbol Agility", ["Numbers", "Symbols"], ["number-symbol-agility", "finger-dexterity"]),
    ("Complex Algorithm Implementations", ["Algorithms"], ["algorithm-syntax", "logic-cadence"]),
    ("Milestone Grandmaster Mid-Assessment", ["Comprehensive Mastery"], ["mid-assessment", "grandmaster-benchmark"]),
    ("Weak-Finger Pinky/Ring Remediation", ["Pinky", "Ring"], ["weak-finger-remediation", "strength-conditioning"]),
    ("Sustained 68 WPM Endurance Transcriptions", ["68 WPM Endurance"], ["endurance-transcription", "fatigue-resistance"]),
    ("Classical Philosophy & Scientific Treatises", ["Philosophy"], ["philosophical-treatises", "formal-endurance"]),
    ("Full-Stack Software Engineering Syntax", ["Full-Stack"], ["full-stack-syntax", "developer-typing"]),
    ("Rapid-Fire Mixed Symbol & Number Marathons", ["Mixed Symbols"], ["mixed-symbols", "marathon-precision"]),
    ("70 WPM Velocity Endurance Sprints", ["70 WPM Sprints"], ["velocity-sprints", "peak-speed"]),
    ("Masterpiece Literary Excerpts", ["Literary Masterpieces"], ["literary-masterpieces", "artistic-cadence"]),
    ("Zero-Error Speed Marathon", ["Zero Error"], ["zero-error-speed", "flawless-execution"]),
    ("Ultra-High Precision Capstone Warmup", ["Precision Warmup"], ["capstone-warmup", "elite-preparation"]),
    ("Grandmaster Capstone Mastery & Level 600 Final Graduation", ["All Skills", "72+ WPM", "98% Acc"], ["final-graduation", "grandmaster-capstone"]),
]

def generate_stage7_lessons():
    """Generates 600 unique, progressively longer Stage 7 lessons."""
    lessons = []
    seen_texts = set()
    clause_idx = 0
    num_clauses = len(BASE_CLAUSES)
    
    for unit_idx, (unit_label, target_keys, skills) in enumerate(UNIT_THEMES, start=1):
        for lesson_in_unit in range(1, 21):
            level_num = (unit_idx - 1) * 20 + lesson_in_unit
            
            # Target length band
            if level_num <= 40:
                target_min, target_max = 45, 95
            elif level_num <= 100:
                target_min, target_max = 95, 175
            elif level_num <= 200:
                target_min, target_max = 175, 290
            elif level_num <= 300:
                target_min, target_max = 290, 420
            elif level_num <= 400:
                target_min, target_max = 420, 580
            elif level_num <= 500:
                target_min, target_max = 580, 750
            elif level_num <= 580:
                target_min, target_max = 750, 900
            else:
                target_min, target_max = 900, 1200
            
            # Level 600 Grandmaster Capstone Final Graduation special text
            if level_num == 600:
                text = (
                    "Grandmaster Capstone Final Graduation: Having traversed all 4,200 levels across 7 independent stages "
                    "of the KEYFLOW Touch-Typing Academy - from Home Row Foundations to Top Row Control, Bottom Row Control, "
                    "Morphemes and Combinations, Word Flow and Cadence, Sentence Rhythm and Shift Discipline, to Grandmaster Precision - "
                    "you have attained true neuromuscular flow. Your hands operate with effortless economy, striking keys at 72+ WPM "
                    "with 98%+ precision across complex alphanumeric prose, punctuation, and code syntax. As Aristotle observed: "
                    "'We are what we repeatedly do. Excellence, then, is not an act, but a habit.' Every stroke, every word, and every "
                    "sentence typed across these 4,200 lessons has permanently refined your tactile intuition. "
                    "Congratulations, Grandmaster Typist: you have graduated to the pinnacle of keyboard mastery."
                )
            else:
                assembled = []
                curr_len = 0
                attempts = 0
                
                while curr_len < target_min or " ".join(assembled) in seen_texts:
                    cl = BASE_CLAUSES[(clause_idx + attempts) % num_clauses]
                    assembled.append(cl)
                    curr_len = sum(len(c) + 1 for c in assembled)
                    attempts += 1
                    if curr_len > target_max and len(assembled) > 1:
                        break
                
                clause_idx = (clause_idx + len(assembled)) % num_clauses
                text = " ".join(assembled)
            
            # Validate character mappings
            for ch in text:
                if ch not in FINGER_MAP and ch.lower() not in FINGER_MAP:
                    raise ValueError(f"Unmapped ANSI character '{ch}' in Stage 7 Level {level_num}")
            
            seen_texts.add(text)
            
            is_assessment = (lesson_in_unit == 20)
            if level_num == 600:
                title = "Level 600: Grandmaster Capstone Final Graduation"
                objective = "Culminate your complete 4,200-level Academy journey with sustained 72+ WPM speed and 98%+ accuracy."
            elif is_assessment:
                title = f"Unit {unit_idx} Precision & Grandmaster Assessment Benchmark"
                objective = f"Validate high-velocity technical typing precision and code syntax mastery across {unit_label}."
            else:
                title = f"{unit_label} Drill {lesson_in_unit}"
                objective = f"Sustain high-velocity neuromuscular flow (62-72 WPM) with extreme accuracy across {', '.join(target_keys)}."
            
            lesson = build_lesson(
                stage_id=STAGE_ID,
                stage_title=STAGE_TITLE,
                level_num=level_num,
                unit_num=unit_idx,
                unit_label=unit_label,
                lesson_in_unit=lesson_in_unit,
                title=title,
                objective=objective,
                text=text,
                target_keys=target_keys,
                home_keys=HOME_KEYS,
                skills=skills,
            )
            lessons.append(lesson)
            
    assert len(lessons) == 600, f"Expected 600 lessons for Stage 7, got {len(lessons)}"
    assert len(seen_texts) == 600, f"Expected 600 unique texts for Stage 7, got {len(seen_texts)}"
    return lessons
